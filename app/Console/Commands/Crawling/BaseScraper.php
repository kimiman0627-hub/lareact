<?php

namespace App\Console\Commands\Crawling;

use Illuminate\Console\Command;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\ConnectException;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\User\User;
use App\Models\File\File;
use App\Models\Board\Post;
use App\Models\Crawl\CrawlLog;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

abstract class BaseScraper extends Command
{
    // ---------------------------------------------------------------
    // User-Agent 풀: 매 크롤링마다 랜덤 선택해 봇 탐지 완화
    // ---------------------------------------------------------------
    private const USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ];

    // 이미지 최소 크기 (bytes): 이하는 트래킹 픽셀·아이콘으로 간주해 스킵
    private const MIN_IMAGE_SIZE = 3072; // 3 KB

    // 비디오 최대 크기 (bytes): 초과하면 용량 절감을 위해 스킵
    private const MAX_VIDEO_SIZE = 52428800; // 50 MB

    // ---------------------------------------------------------------
    // 스토리지 헬퍼: config/filesystems.php 의 file_storage 값으로 분기
    // LOCAL → public 디스크 / NCP → ncp 디스크 (비공개 버킷, 프록시 서빙)
    // ---------------------------------------------------------------

    private function storageType(): string
    {
        return strtoupper(config('filesystems.file_storage', 'LOCAL'));
    }

    /**
     * 파일을 적절한 스토리지에 저장.
     * 반환: ['storage' => 'LOCAL'|'NCP', 'file_url' => 상대경로, 'public_url' => 브라우저_접근_URL]
     */
    private function putFile(string $relativePath, string $contents): array
    {
        $type      = $this->storageType();
        $disk      = $type === 'NCP' ? 'ncp' : 'public';
        $publicUrl = $type === 'NCP' ? '/file/' . $relativePath : '/storage/' . $relativePath;

        Storage::disk($disk)->put($relativePath, $contents);

        return [
            'storage'    => $type,
            'file_url'   => $relativePath,
            'public_url' => $publicUrl,
        ];
    }

    /**
     * 이미지 바이너리를 WebP로 변환 (GD 사용, 최대 너비 1200px, 품질 82%).
     * GD 미설치 또는 변환 실패 시 null 반환 → 호출부에서 원본으로 폴백.
     */
    private function toWebP(string $contents, int $maxWidth = 1200, int $quality = 82): ?string
    {
        if (!extension_loaded('gd')) {
            return null;
        }

        $image = @imagecreatefromstring($contents);
        if ($image === false) {
            return null;
        }

        // 팔레트(인덱스 컬러) 이미지는 WebP 미지원 → 트루컬러로 변환
        // imagepalettetotruecolor()는 알파채널도 함께 보존함
        if (!imageistruecolor($image)) {
            imagepalettetotruecolor($image);
        }

        $srcW = imagesx($image);
        $srcH = imagesy($image);

        if ($srcW > $maxWidth) {
            $dstH    = (int) round($srcH * $maxWidth / $srcW);
            $resized = imagecreatetruecolor($maxWidth, $dstH);

            // 알파채널(투명도) 보존
            imagealphablending($resized, false);
            imagesavealpha($resized, true);

            imagecopyresampled($resized, $image, 0, 0, 0, 0, $maxWidth, $dstH, $srcW, $srcH);
            imagedestroy($image);
            $image = $resized;
        }

        ob_start();
        $ok = imagewebp($image, null, $quality);
        $webpData = ob_get_clean();
        imagedestroy($image);

        return ($ok && $webpData) ? $webpData : null;
    }

    // ---------------------------------------------------------------
    // 크롤링 로그 상태 (메모리 내 집계 후 finishCrawlLog 에서 일괄 저장)
    // ---------------------------------------------------------------
    private ?CrawlLog $crawlLog  = null;
    private int   $logFound   = 0;
    private int   $logSaved   = 0;
    private int   $logSkipped = 0;
    private int   $logErrors  = 0;
    private array $errorLog   = [];

    /**
     * error() 를 오버라이드해서 콘솔 출력과 동시에 에러 로그를 메모리에 기록.
     */
    public function error($string, $verbosity = null): void
    {
        parent::error($string, $verbosity);
        if ($this->crawlLog !== null) {
            $this->logErrors++;
            $this->errorLog[] = [
                'message' => (string) $string,
                'time'    => now()->toDateTimeString(),
            ];
        }
    }

    /** 크롤링 시작 시 호출. */
    protected function startCrawlLog(string $source): void
    {
        $this->logFound = $this->logSaved = $this->logSkipped = $this->logErrors = 0;
        $this->errorLog = [];

        $this->crawlLog = CrawlLog::create([
            'source'     => $source,
            'command'    => trim(explode(' ', $this->signature)[0]),
            'status'     => 'RUNNING',
            'started_at' => now(),
        ]);
    }

    /** 크롤링 완료 시 호출. 에러가 있으면 DONE_WITH_ERRORS 로 기록. */
    protected function finishCrawlLog(): void
    {
        $status = $this->logErrors > 0 ? 'DONE_WITH_ERRORS' : 'DONE';

        $this->crawlLog?->update([
            'status'        => $status,
            'total_found'   => $this->logFound,
            'total_saved'   => $this->logSaved,
            'total_skipped' => $this->logSkipped,
            'total_errors'  => $this->logErrors,
            'error_log'     => array_slice($this->errorLog, -200), // 최대 200건
            'finished_at'   => now(),
        ]);
    }

    protected function incFound(int $n = 1): void { $this->logFound   += $n; }
    protected function incSaved(): void            { $this->logSaved++; }
    protected function incSkipped(): void          { $this->logSkipped++; }

    /**
     * 공통 Guzzle 클라이언트 생성.
     * 매 실행마다 UA 풀에서 랜덤 선택. 사이트별 옵션은 $extra로 오버라이드.
     */
    protected function makeClient(array $extra = []): Client
    {
        return new Client(array_merge_recursive([
            'timeout'         => 15,
            'connect_timeout' => 5,
            'headers'         => [
                'User-Agent'      => self::USER_AGENTS[array_rand(self::USER_AGENTS)],
                'Accept-Language' => 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept'          => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Encoding' => 'gzip, deflate, br',
                'Cache-Control'   => 'no-cache',
            ],
        ], $extra));
    }

    /**
     * HTML 페이지 가져오기.
     * - 429/503 또는 네트워크 에러 시 최대 2회 재시도
     * - 봇 차단 페이지(CAPTCHA 등) 감지 시 null 반환
     * - $convertEncoding=true 시 EUC-KR → UTF-8 자동 변환
     */
    protected function fetchHtml(Client $client, string $url, bool $convertEncoding = false): ?string
    {
        $maxRetries = 2;

        for ($attempt = 0; $attempt <= $maxRetries; $attempt++) {
            try {
                $response = $client->get($url);
                $body     = (string) $response->getBody();

                // 봇 차단 페이지 감지 (200 OK이지만 실제로는 차단된 경우)
                if ($this->isBotBlocked($body)) {
                    $this->warn("  봇/CAPTCHA 차단 감지 ({$url})");
                    return null;
                }

                if ($convertEncoding) {
                    $contentType = $response->getHeaderLine('Content-Type');
                    $isEucKr = str_contains(strtolower($contentType), 'euc-kr')
                            || str_contains(strtolower($body), 'charset=euc-kr')
                            || str_contains(strtolower($body), 'charset="euc-kr"');

                    if ($isEucKr) {
                        $converted = mb_convert_encoding($body, 'UTF-8', 'EUC-KR');
                        if ($converted !== false) {
                            $body = preg_replace('/charset=["\']?euc-kr["\']?/i', 'charset=utf-8', $converted);
                        }
                    }
                }

                return $body;

            } catch (ConnectException $e) {
                // 네트워크 연결 실패 — 재시도
                if ($attempt < $maxRetries) {
                    $wait = rand(5, 15);
                    $this->warn("  연결 실패, {$wait}초 후 재시도 (" . ($attempt + 1) . "/{$maxRetries}): {$url}");
                    sleep($wait);
                    continue;
                }
                $this->error("  연결 실패 (최대 재시도 초과, {$url}): " . $e->getMessage());
                return null;

            } catch (RequestException $e) {
                $status = $e->getResponse()?->getStatusCode() ?? 0;

                if ($status === 429) {
                    // Too Many Requests: 충분히 쉬고 재시도
                    if ($attempt < $maxRetries) {
                        $wait = rand(30, 60);
                        $this->warn("  429 Too Many Requests, {$wait}초 대기 후 재시도 (" . ($attempt + 1) . "/{$maxRetries})");
                        sleep($wait);
                        continue;
                    }
                } elseif ($status === 503) {
                    // Service Unavailable: 잠시 후 재시도
                    if ($attempt < $maxRetries) {
                        $wait = rand(10, 20);
                        $this->warn("  503 Service Unavailable, {$wait}초 대기 후 재시도 (" . ($attempt + 1) . "/{$maxRetries})");
                        sleep($wait);
                        continue;
                    }
                }

                $this->error("  HTTP 에러 [{$status}] ({$url}): " . $e->getMessage());
                return null;
            }
        }

        return null;
    }

    /**
     * 봇/CAPTCHA 차단 페이지 여부 감지.
     * 본문이 비정상적으로 짧거나 차단 키워드를 포함하면 true.
     */
    private function isBotBlocked(string $body): bool
    {
        // 정상 페이지는 최소 1KB 이상
        if (strlen($body) < 1024) {
            return true;
        }

        $lower = strtolower($body);
        $blockPatterns = [
            'captcha',
            'recaptcha',
            'robot check',
            'bot detection',
            'access denied',
            '비정상적인 접근',
            '잠시 후 다시',
            'too many requests',
            'rate limit',
        ];

        foreach ($blockPatterns as $pattern) {
            if (str_contains($lower, $pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 게시글 간 요청 딜레이.
     * 기본 2~4초, 약 10% 확률로 8~15초의 긴 대기 (봇 패턴 방지).
     */
    protected function throttle(): void
    {
        if (rand(1, 10) === 1) {
            $secs = rand(8, 15);
            $this->line("  [throttle] {$secs}초 대기...");
            sleep($secs);
        } else {
            sleep(rand(2, 4));
        }
    }

    /**
     * 컨텐츠 노드에서 이미지 목록 수집.
     * 반환: [originalSrc => ['resolved' => absoluteUrl, 'attr' => 'src'|'data-src']]
     */
    protected function collectImages(Crawler $contentNode, string $baseUrl): array
    {
        $images = [];

        $contentNode->filter('img')->each(function (Crawler $img) use ($baseUrl, &$images) {
            $src     = $img->attr('src')      ?? '';
            $dataSrc = $img->attr('data-src') ?? '';

            if ($dataSrc && !str_starts_with($dataSrc, 'data:')) {
                $originalSrc = $dataSrc;
                $attrName    = 'data-src';
            } elseif ($src && !str_starts_with($src, 'data:')) {
                $originalSrc = $src;
                $attrName    = 'src';
            } else {
                return;
            }

            if (isset($images[$originalSrc])) return;

            $resolvedSrc = str_starts_with($originalSrc, 'http')
                ? $originalSrc
                : $baseUrl . '/' . ltrim($originalSrc, '/');

            $images[$originalSrc] = ['resolved' => $resolvedSrc, 'attr' => $attrName];
        });

        return $images;
    }

    /**
     * 이미지 배치 다운로드 (트랜잭션 밖에서 호출).
     * 반환: [originalSrc => fileInfo 배열]
     */
    protected function downloadImages(Client $client, array $images, int $postId): array
    {
        if (empty($images)) return [];

        $dir = 'uploads/post/' . $postId;

        // LOCAL 전용: 디렉터리 사전 생성 (NCP는 자동 생성)
        if ($this->storageType() === 'LOCAL') {
            Storage::disk('public')->makeDirectory($dir);
        }

        $results = [];
        foreach ($images as $originalSrc => $info) {
            $fileInfo = $this->downloadImage($client, $info['resolved'], $dir);
            if ($fileInfo) {
                $results[$originalSrc] = $fileInfo;
            }
        }

        return $results;
    }

    /**
     * 단일 이미지 다운로드.
     * - 최소 크기(3KB) 미만이면 트래킹 픽셀/아이콘으로 간주해 스킵
     * - 실패 시 1회 재시도
     */
    protected function downloadImage(Client $client, string $imgUrl, string $dir): ?array
    {
        $maxRetries = 1;

        for ($attempt = 0; $attempt <= $maxRetries; $attempt++) {
            try {
                $response     = $client->get($imgUrl, ['timeout' => 20]);
                $contents    = (string) $response->getBody();
                $contentType = strtolower($response->getHeaderLine('Content-Type'));

                // HTML/텍스트 응답 필터: 403/redirect 에러 페이지가 이미지로 저장되는 것 방지
                if (str_contains($contentType, 'text/html') || str_contains($contentType, 'text/plain')) {
                    $this->line("    이미지 스킵 (HTML 응답, 접근 차단 추정): {$imgUrl}");
                    return null;
                }

                // Content-Type이 없을 때 본문이 HTML이면 스킵
                if (!$contentType && str_starts_with(ltrim($contents), '<')) {
                    $this->line("    이미지 스킵 (HTML 본문 감지): {$imgUrl}");
                    return null;
                }

                // 최소 크기 필터: 트래킹 픽셀, 아이콘, 플레이스홀더 제외
                if (strlen($contents) < self::MIN_IMAGE_SIZE) {
                    $this->line("    이미지 스킵 (너무 작음, " . strlen($contents) . "B): {$imgUrl}");
                    return null;
                }

                $originalName = basename(parse_url($imgUrl, PHP_URL_PATH));

                // GIF는 애니메이션 보존을 위해 원본 유지, 나머지는 WebP로 변환
                $contentType = $response->getHeaderLine('Content-Type');
                $isGif = str_contains(strtolower($contentType), 'gif')
                      || str_ends_with(strtolower(pathinfo($originalName, PATHINFO_EXTENSION)), 'gif');

                if ($isGif) {
                    $ext      = 'gif';
                    $mime     = 'image/gif';
                    $saveData = $contents;
                } else {
                    $converted = $this->toWebP($contents);
                    if ($converted !== null) {
                        $ext      = 'webp';
                        $mime     = 'image/webp';
                        $saveData = $converted;
                    } else {
                        // WebP 변환 실패 시 원본 포맷으로 폴백
                        $origExt  = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
                        $ext      = in_array($origExt, ['jpg', 'jpeg', 'png', 'webp']) ? $origExt : 'jpg';
                        $mime     = match ($ext) {
                            'png'  => 'image/png',
                            'webp' => 'image/webp',
                            default => 'image/jpeg',
                        };
                        $saveData = $contents;
                    }
                }

                $storedName = Str::uuid() . '.' . $ext;
                $savePath   = $dir . '/' . $storedName;

                $stored = $this->putFile($savePath, $saveData);

                return [
                    'original_name' => $originalName ?: ('image.' . $ext),
                    'stored_name'   => $storedName,
                    'file_path'     => $savePath,
                    'file_url'      => $stored['file_url'],
                    'public_url'    => $stored['public_url'],
                    'mime_type'     => $mime,
                    'file_size'     => strlen($saveData),
                    'storage'       => $stored['storage'],
                ];

            } catch (\Exception $e) {
                if ($attempt < $maxRetries) {
                    sleep(rand(3, 6));
                    continue;
                }
                $this->warn("    이미지 다운로드 실패 ({$imgUrl}): " . $e->getMessage());
                return null;
            }
        }

        return null;
    }

    /**
     * 컨텐츠 노드에서 비디오 목록 수집.
     * <video src="..."> 및 <video><source src="..."> 패턴 모두 처리.
     * 반환: [originalSrc => ['resolved' => absoluteUrl, 'tag' => 'video'|'source']]
     */
    protected function collectVideos(Crawler $contentNode, string $baseUrl): array
    {
        $videos = [];

        $collect = function (Crawler $node, string $tag) use ($baseUrl, &$videos) {
            $src = $node->attr('src') ?? '';
            if (!$src || str_starts_with($src, 'data:') || str_starts_with($src, 'blob:')) return;
            if (isset($videos[$src])) return;

            if (str_starts_with($src, '//')) {
                $resolved = 'https:' . $src;
            } elseif (str_starts_with($src, 'http')) {
                $resolved = $src;
            } else {
                $resolved = $baseUrl . '/' . ltrim($src, '/');
            }

            $videos[$src] = ['resolved' => $resolved, 'tag' => $tag];
        };

        $contentNode->filter('video[src]')->each(fn(Crawler $n) => $collect($n, 'video'));
        $contentNode->filter('video source[src]')->each(fn(Crawler $n) => $collect($n, 'source'));

        return $videos;
    }

    /**
     * 비디오 배치 다운로드 (트랜잭션 밖에서 호출).
     * 반환: [originalSrc => fileInfo 배열]
     */
    protected function downloadVideos(Client $client, array $videos, int $postId): array
    {
        if (empty($videos)) return [];

        $dir = 'uploads/post/' . $postId;

        // LOCAL 전용: 디렉터리 사전 생성 (NCP는 자동 생성)
        if ($this->storageType() === 'LOCAL') {
            Storage::disk('public')->makeDirectory($dir);
        }

        $results = [];
        foreach ($videos as $originalSrc => $info) {
            $fileInfo = $this->downloadVideo($client, $info['resolved'], $dir);
            if ($fileInfo) {
                $results[$originalSrc] = $fileInfo;
            }
        }

        return $results;
    }

    /**
     * 단일 비디오 다운로드.
     * - 50 MB 초과 파일은 스킵 (Content-Length 헤더로 사전 확인)
     * - 실패 시 1회 재시도
     */
    protected function downloadVideo(Client $client, string $videoUrl, string $dir): ?array
    {
        $maxRetries = 1;

        for ($attempt = 0; $attempt <= $maxRetries; $attempt++) {
            try {
                // HEAD 요청으로 파일 크기 사전 확인 (지원하는 경우에만)
                try {
                    $head = $client->head($videoUrl, ['timeout' => 10]);
                    $contentLength = (int) $head->getHeaderLine('Content-Length');
                    if ($contentLength > 0 && $contentLength > self::MAX_VIDEO_SIZE) {
                        $mb = round($contentLength / 1048576, 1);
                        $this->line("    비디오 스킵 (너무 큼, {$mb}MB): {$videoUrl}");
                        return null;
                    }
                } catch (\Exception) {
                    // HEAD 미지원 서버는 무시하고 GET으로 진행
                }

                $response     = $client->get($videoUrl, ['timeout' => 120]);
                $contents     = (string) $response->getBody();
                $contentType  = strtolower($response->getHeaderLine('Content-Type'));

                // 비디오가 아닌 응답 필터
                if (str_contains($contentType, 'text/html') || str_contains($contentType, 'text/plain')) {
                    $this->line("    비디오 스킵 (HTML 응답): {$videoUrl}");
                    return null;
                }

                // 최대 크기 필터
                if (strlen($contents) > self::MAX_VIDEO_SIZE) {
                    $mb = round(strlen($contents) / 1048576, 1);
                    $this->line("    비디오 스킵 (너무 큼, {$mb}MB): {$videoUrl}");
                    return null;
                }

                // 최소 크기 필터 (1KB 미만은 오류 응답으로 간주)
                if (strlen($contents) < 1024) {
                    $this->line("    비디오 스킵 (너무 작음, " . strlen($contents) . "B): {$videoUrl}");
                    return null;
                }

                $originalName = basename(parse_url($videoUrl, PHP_URL_PATH));
                $ext          = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

                if (!$ext || !in_array($ext, ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'])) {
                    $ext = match (true) {
                        str_contains($contentType, 'webm') => 'webm',
                        str_contains($contentType, 'ogg')  => 'ogg',
                        default                            => 'mp4',
                    };
                }

                $mime = match ($ext) {
                    'webm' => 'video/webm',
                    'ogg'  => 'video/ogg',
                    'mov'  => 'video/quicktime',
                    'avi'  => 'video/x-msvideo',
                    'mkv'  => 'video/x-matroska',
                    default => 'video/mp4',
                };

                $storedName = Str::uuid() . '.' . $ext;
                $savePath   = $dir . '/' . $storedName;

                $stored = $this->putFile($savePath, $contents);

                return [
                    'original_name' => $originalName ?: ('video.' . $ext),
                    'stored_name'   => $storedName,
                    'file_path'     => $savePath,
                    'file_url'      => $stored['file_url'],      // DB: 상대 경로
                    'public_url'    => $stored['public_url'],    // content HTML용
                    'mime_type'     => $mime,
                    'file_size'     => strlen($contents),
                    'storage'       => $stored['storage'],
                ];

            } catch (\Exception $e) {
                if ($attempt < $maxRetries) {
                    sleep(rand(3, 6));
                    continue;
                }
                $this->warn("    비디오 다운로드 실패 ({$videoUrl}): " . $e->getMessage());
                return null;
            }
        }

        return null;
    }

    /**
     * 다운로드 완료된 비디오로 content HTML 내 URL 교체.
     * content HTML에는 public_url (full URL) 사용.
     */
    protected function replaceVideoUrls(string $content, array $videos, array $downloaded): string
    {
        foreach ($downloaded as $originalSrc => $fileInfo) {
            $publicUrl = $fileInfo['public_url'] ?? $fileInfo['file_url'];
            $content   = str_replace($originalSrc, $publicUrl, $content);
        }

        return $content;
    }

    /**
     * content HTML에서 script, style, noscript 태그 제거.
     */
    protected function cleanContent(string $html): string
    {
        return preg_replace(
            ['/<script\b[^>]*>.*?<\/script>/is', '/<style\b[^>]*>.*?<\/style>/is', '/<noscript\b[^>]*>.*?<\/noscript>/is'],
            '',
            $html
        );
    }

    /**
     * content HTML 내 <video>, <source> 태그의 src를 절대 URL로 변환하고
     * <video> 태그에 controls 속성 추가 및 lazy-hidden 클래스 제거.
     */
    protected function fixVideoUrls(string $content, string $baseUrl): string
    {
        return preg_replace_callback(
            '/<(video|source)\b([^>]*)>/i',
            function (array $tag) use ($baseUrl): string {
                $tagName = strtolower($tag[1]);
                $attrs   = $tag[2];

                // src 절대 URL 변환
                $attrs = preg_replace_callback(
                    '/\bsrc=["\']([^"\']+)["\']/i',
                    function (array $m) use ($baseUrl): string {
                        $src = $m[1];
                        if (str_starts_with($src, '//')) {
                            $src = 'https:' . $src;
                        } elseif (!str_starts_with($src, 'http')) {
                            $src = $baseUrl . '/' . ltrim($src, '/');
                        }
                        return 'src="' . $src . '"';
                    },
                    $attrs
                );

                if ($tagName === 'video') {
                    // lazy-hidden 클래스 제거 (GnuBoard5 lazy-loading 숨김 처리)
                    $attrs = preg_replace_callback(
                        '/\bclass=["\']([^"\']+)["\']/i',
                        function (array $m): string {
                            $classes = trim(preg_replace('/\blazy-hidden\b\s*/i', '', $m[1]));
                            return $classes ? 'class="' . $classes . '"' : '';
                        },
                        $attrs
                    );

                    if (!preg_match('/\bcontrols\b/i', $attrs)) {
                        $attrs .= ' controls';
                    }
                }

                return '<' . $tag[1] . $attrs . '>';
            },
            $content
        );
    }

    /**
     * 크롤러에서 조회수를 추출하는 공통 헬퍼.
     * $selectors 를 순서대로 시도해 첫 번째로 숫자가 나오는 값을 반환.
     */
    protected function extractHits(Crawler $c, array $selectors): int
    {
        foreach ($selectors as $selector) {
            try {
                $node = $c->filter($selector)->first();
                if ($node->count()) {
                    $num = (int) preg_replace('/[^0-9]/', '', $node->text());
                    if ($num > 0) return $num;
                }
            } catch (\Exception) {
                // 잘못된 selector는 무시
            }
        }
        return 0;
    }

    /**
     * 다운로드 완료된 이미지로 content HTML 내 URL 교체.
     * $downloaded: [originalSrc => fileInfo]
     * content HTML에는 public_url (full URL) 사용.
     */
    protected function replaceImageUrls(string $content, array $images, array $downloaded): string
    {
        foreach ($downloaded as $originalSrc => $fileInfo) {
            $serverUrl = $fileInfo['public_url'] ?? $fileInfo['file_url'];
            $attrName  = $images[$originalSrc]['attr'] ?? 'src';

            if ($attrName === 'data-src') {
                $content = str_replace(
                    ['data-src="' . $originalSrc . '"', "data-src='" . $originalSrc . "'"],
                    'src="' . $serverUrl . '"',
                    $content
                );
            } else {
                $content = str_replace($originalSrc, $serverUrl, $content);
            }
        }

        return $content;
    }

    /**
     * File 레코드 일괄 저장.
     * file_url 에는 상대 경로만 저장 (저장소 prefix 없음).
     */
    protected function saveFileRecords(int $postId, array $downloaded): void
    {
        foreach ($downloaded as $fileInfo) {
            File::create([
                'storage'       => $fileInfo['storage'] ?? 'LOCAL',
                'file_kind'     => 'POST',
                'ref_id'        => $postId,
                'original_name' => $fileInfo['original_name'],
                'stored_name'   => $fileInfo['stored_name'],
                'file_path'     => $fileInfo['file_path'],
                'file_url'      => $fileInfo['file_url'],  // 상대 경로
                'mime_type'     => $fileInfo['mime_type'],
                'file_size'     => $fileInfo['file_size'],
            ]);
        }
    }

    /**
     * 게시글 및 관련 데이터(파일·댓글·좋아요·스크랩·배너) 전체 삭제.
     * 이미지/파일 저장 실패로 게시글을 롤백해야 할 때 사용.
     */
    protected function deletePost(int $postId): void
    {
        // 스토리지 파일 삭제 (storage 컬럼으로 디스크 분기)
        \DB::table('files')
            ->where('file_kind', 'POST')
            ->where('ref_id', $postId)
            ->get()
            ->each(function ($file) {
                $disk = ($file->storage ?? 'LOCAL') === 'NCP' ? 'ncp' : 'public';
                $rel  = ltrim(preg_replace('#^/(storage|file)/#', '', $file->file_url), '/');
                try {
                    Storage::disk($disk)->delete($rel);
                } catch (\Exception) {
                    // 스토리지 삭제 실패는 무시 (고아 파일로 남아도 DB는 정리)
                }
            });

        \DB::table('files')->where('file_kind', 'POST')->where('ref_id', $postId)->delete();
        \DB::table('comments')->where('post_id', $postId)->delete();
        \DB::table('post_likes')->where('post_id', $postId)->delete();
        \DB::table('scraps')->where('post_id', $postId)->delete();
        \DB::table('post_banners')->where('post_id', $postId)->delete();
        \DB::table('posts')->where('post_id', $postId)->delete();
    }

    /**
     * 크롤링 출처 회원 생성 또는 조회.
     */
    protected function firstOrCreateUser(string $name, string $email): User
    {
        return User::firstOrCreate(
            ['name' => $name],
            [
                'email'     => $email,
                'password'  => bcrypt(Str::random(16)),
                'user_role' => 'TEST',
            ]
        );
    }

    /**
     * 이미 저장된 source_id를 배치로 조회해 중복 체크용 맵 반환.
     * 반환: [sourceId => true]
     */
    protected function fetchExistingSourceIds(string $source, array $sourceIds): array
    {
        if (empty($sourceIds)) return [];

        return Post::where('source', $source)
            ->whereIn('source_id', $sourceIds)
            ->pluck('source_id')
            ->flip()
            ->all();
    }
}
