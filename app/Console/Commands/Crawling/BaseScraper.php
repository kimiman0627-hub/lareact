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
                    $this->warn("  연결 실패, {$wait}초 후 재시도 ({$attempt+1}/{$maxRetries}): {$url}");
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
                        $this->warn("  429 Too Many Requests, {$wait}초 대기 후 재시도 ({$attempt+1}/{$maxRetries})");
                        sleep($wait);
                        continue;
                    }
                } elseif ($status === 503) {
                    // Service Unavailable: 잠시 후 재시도
                    if ($attempt < $maxRetries) {
                        $wait = rand(10, 20);
                        $this->warn("  503 Service Unavailable, {$wait}초 대기 후 재시도 ({$attempt+1}/{$maxRetries})");
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
        Storage::disk('public')->makeDirectory($dir);

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
                $contents     = (string) $response->getBody();

                // 최소 크기 필터: 트래킹 픽셀, 아이콘, 플레이스홀더 제외
                if (strlen($contents) < self::MIN_IMAGE_SIZE) {
                    $this->line("    이미지 스킵 (너무 작음, " . strlen($contents) . "B): {$imgUrl}");
                    return null;
                }

                $originalName = basename(parse_url($imgUrl, PHP_URL_PATH));
                $ext          = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

                $contentType = $response->getHeaderLine('Content-Type');
                if (!$ext || !in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                    $ext = match (true) {
                        str_contains($contentType, 'webp') => 'webp',
                        str_contains($contentType, 'png')  => 'png',
                        str_contains($contentType, 'gif')  => 'gif',
                        default                            => 'jpg',
                    };
                }

                $mime = match ($ext) {
                    'png'  => 'image/png',
                    'gif'  => 'image/gif',
                    'webp' => 'image/webp',
                    default => 'image/jpeg',
                };

                $storedName = Str::uuid() . '.' . $ext;
                $savePath   = $dir . '/' . $storedName;

                Storage::disk('public')->put($savePath, $contents);

                return [
                    'original_name' => $originalName ?: ('image.' . $ext),
                    'stored_name'   => $storedName,
                    'file_path'     => 'public/' . $savePath,
                    'file_url'      => '/storage/' . $savePath,
                    'mime_type'     => $mime,
                    'file_size'     => strlen($contents),
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
     * <video> 태그에 controls 속성이 없으면 추가.
     */
    protected function fixVideoUrls(string $content, string $baseUrl): string
    {
        return preg_replace_callback(
            '/<(video|source)\b([^>]*)>/i',
            function (array $tag) use ($baseUrl): string {
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
                    $tag[2]
                );

                if (strtolower($tag[1]) === 'video' && !preg_match('/\bcontrols\b/i', $attrs)) {
                    $attrs .= ' controls';
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
     */
    protected function replaceImageUrls(string $content, array $images, array $downloaded): string
    {
        foreach ($downloaded as $originalSrc => $fileInfo) {
            $serverUrl = $fileInfo['file_url'];
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
     */
    protected function saveFileRecords(int $postId, array $downloaded): void
    {
        foreach ($downloaded as $fileInfo) {
            File::create([
                'file_kind'     => 'POST',
                'ref_id'        => $postId,
                'original_name' => $fileInfo['original_name'],
                'stored_name'   => $fileInfo['stored_name'],
                'file_path'     => $fileInfo['file_path'],
                'file_url'      => $fileInfo['file_url'],
                'mime_type'     => $fileInfo['mime_type'],
                'file_size'     => $fileInfo['file_size'],
            ]);
        }
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
