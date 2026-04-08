<?php

namespace App\Console\Commands\Crawling;

use Illuminate\Console\Command;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\User\User;
use App\Models\Board\Post;
use App\Models\File\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DogDripScraper extends Command
{
    protected $signature = 'crawl:dogdrip';
    protected $description = 'DogDrip.net 게시글 크롤링 및 DB 저장';

    private const SOURCE   = 'DOGDRIP';
    
    private const DOMAIN = 'dogdrip.net' ;
    private const BASE_URL = 'https://www.' . self::DOMAIN;
    private const BOARDS = [
        'dogdrip' => '/dogdrip',    // 개드립
        'userdog' => '/userdog',    // 유저개드립
        'doc'     => '/doc',    // 읽을 거리판
        'stock'   => '/stock', // 주식
        'ib'      => '/ib',    // 인터넷 방송판
        'game'  => '/game',   // 게임
    ];

    // 게시판명과 카테고리 매핑 boards 키 기준)
    private const CATEGORY_MAP = [
        'dogdrip' => 'free',
        'userdog' => 'free',
        'doc'     => 'free',
        'stock'   => 'stock',
        'ib'      => 'bj',
        'game'  => 'game',
    ];

    public function handle(): void
    {
        $client = $this->makeClient();

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 개드립 크롤링 시작');

        foreach (self::BOARDS as $boardName => $boardPath) {
            $this->info("게시판 크롤링: {$boardName}");
            $this->crawlBoard($client, $boardName, $boardPath);
        }

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 크롤링 완료');
    }

    private function crawlBoard(Client $client, string $boardName, string $boardPath): void
    {
        try {
            $html = $this->fetchHtml($client, self::BASE_URL . $boardPath);
            if (!$html) return;

            $crawler = new Crawler($html);

            // 게시글 링크 수집: title-link 우선, 없으면 URL 패턴으로 폴백
            $postLinks = [];
            $crawler->filter('a.title-link, a.ed.link-reset')->each(function (Crawler $node) use (&$postLinks) {
                $href = $node->attr('href');
                if (!$href) return;

                if (!str_starts_with($href, 'http')) {
                    $href = self::BASE_URL . '/' . ltrim($href, '/');
                }

                // URL에서 게시물 ID 추출 (7자리 이상 숫자)
                if (preg_match('#/(\d{7,})(?:[/?]|$)#', $href, $m)) {
                    $postLinks[$m[1]] = $href;
                }
            });

            if (empty($postLinks)) {
                $this->warn("  게시글 링크를 찾지 못했습니다.");
                return;
            }

            $this->info("  총 " . count($postLinks) . "건 발견");

            foreach ($postLinks as $sourceId => $url) {
                $this->crawlPost($client, $boardName, $sourceId, $url);
                sleep(rand(1, 2));
            }

        } catch (\Exception $e) {
            $this->error("  게시판 에러 ({$boardName}): " . $e->getMessage());
        }
    }

    private function crawlPost(Client $client, string $boardName, string $sourceId, string $url): void
    {
        // 중복 체크
        if (Post::where('source', self::SOURCE)->where('source_id', $sourceId)->exists()) {
            $this->line("  스킵 (중복): source_id={$sourceId}");
            return;
        }

        try {
            $html = $this->fetchHtml($client, $url);
            if (!$html) return;

            $c = new Crawler($html);

            // 제목: og:title 메타태그에서 추출 후 " - DogDrip.Net 개드립" 제거
            $ogTitle = $c->filter('meta[property="og:title"]')->first();
            $title = $ogTitle->count()
                ? trim(preg_replace('/\s*-\s*DogDrip\.Net.*$/i', '', $ogTitle->attr('content')))
                : '(제목 없음)';

            // 작성자: .title-toolbar 안의 첫 번째 member_ 링크
            $authorNode = $c->filter('.title-toolbar a[class*="member_"]')->first();
            $author = $authorNode->count() ? trim($authorNode->text()) : '익명';

            // 본문
            $contentNode = $c->filter('.xe_content')->first();
            if (!$contentNode->count()) {
                $this->warn("  본문 없음: {$url}");
                return;
            }
            $contentHtml = $contentNode->html();

            // 이미지 URL 수집: 원본 src(HTML에 실제 기재된 값) → 절대경로 매핑
            $imageMap    = []; // originalSrc => resolvedSrc
            $imgAttrMap  = []; // originalSrc => 'src' | 'data-src'

            $contentNode->filter('img')->each(function (Crawler $img) use (&$imageMap, &$imgAttrMap) {
                $src     = $img->attr('src')      ?? '';
                $dataSrc = $img->attr('data-src') ?? '';

                // data-src 우선 (lazy load): base64/빈 값이 아닌 경우
                if ($dataSrc && !str_starts_with($dataSrc, 'data:')) {
                    $originalSrc = $dataSrc;
                    $attrName    = 'data-src';
                } elseif ($src && !str_starts_with($src, 'data:')) {
                    $originalSrc = $src;
                    $attrName    = 'src';
                } else {
                    return; // 유효한 이미지 URL 없음
                }

                $resolvedSrc = $originalSrc;
                if (!str_starts_with($originalSrc, 'http')) {
                    // /dvs/d/... 같은 절대 경로도 BASE_URL로 처리
                    $resolvedSrc = self::BASE_URL . '/' . ltrim($originalSrc, '/');
                }

                $imageMap[$originalSrc]   = $resolvedSrc;
                $imgAttrMap[$originalSrc] = $attrName;
            });

            DB::transaction(function () use ($sourceId, $boardName, $title, $author, $contentHtml, $imageMap, $imgAttrMap) {
                // 작성자 유저 생성 or 조회 (name 기준)
                $slug = Str::slug($author) ?: 'user';
                $user = User::firstOrCreate(
                    ['name' => $author],
                    [
                        'email'    => $slug . '_' . Str::random(6) . '@'. self::DOMAIN,
                        'password' => bcrypt(Str::random(16)),
                    ]
                );

                // 게시글 저장 (일단 원본 content로)
                $post = Post::create([
                    'source'        => self::SOURCE,
                    'source_id'     => $sourceId,
                    'user_id'       => $user->id,
                    'post_status'   => 'ACTIVE',
                    'post_type'     => 'NORMAL',
                    'post_category' => self::CATEGORY_MAP[$boardName] ?? $boardName,
                    'title'         => $title,
                    'content'       => $contentHtml,
                    'hits'          => 0,
                    'comment_count' => 0,
                    'is_notice'     => false,
                ]);

                // 이미지 다운로드 → File 저장 → content 내 원본 URL을 서버 URL로 교체
                $finalContent = $contentHtml;
                $downloadedCount = 0;
                foreach ($imageMap as $originalSrc => $resolvedSrc) {
                    $fileInfo = $this->downloadImage($resolvedSrc, $post->post_id);
                    if ($fileInfo) {
                        File::create([
                            'file_kind'     => 'POST',
                            'ref_id'        => $post->post_id,
                            'original_name' => $fileInfo['original_name'],
                            'stored_name'   => $fileInfo['stored_name'],
                            'file_path'     => $fileInfo['file_path'],
                            'file_url'      => $fileInfo['file_url'],
                            'mime_type'     => $fileInfo['mime_type'],
                            'file_size'     => $fileInfo['file_size'],
                        ]);
                        // HTML 내 원본 URL을 서버 URL로 교체
                        // data-src 였다면 → src 로 속성명까지 변경 (lazy load 이미지 정상 표시)
                        $serverUrl = $fileInfo['file_url'];
                        $attrName  = $imgAttrMap[$originalSrc] ?? 'src';

                        if ($attrName === 'data-src') {
                            $finalContent = str_replace(
                                ['data-src="' . $originalSrc . '"', "data-src='" . $originalSrc . "'"],
                                'src="' . $serverUrl . '"',
                                $finalContent
                            );
                        } else {
                            $finalContent = str_replace($originalSrc, $serverUrl, $finalContent);
                        }
                        $downloadedCount++;
                    }
                }

                // 이미지 URL이 교체된 content로 업데이트
                if ($finalContent !== $contentHtml) {
                    $post->update(['content' => $finalContent]);
                }

                $this->info("  저장: [{$sourceId}] {$title} / 작성자: {$author} / 이미지: {$downloadedCount}/" . count($imageMap) . "개");
            });

        } catch (\Exception $e) {
            $this->error("  게시글 에러 (source_id={$sourceId}): " . $e->getMessage());
        }
    }

    private function makeClient(): Client
    {
        return new Client([
            'timeout'         => 15,
            'connect_timeout' => 5,
            'headers'         => [
                'User-Agent'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language' => 'ko-KR,ko;q=0.9',
            ],
        ]);
    }

    /**
     * 이미지 URL을 다운로드해서 storage/app/public/uploads/post/{postId}/ 에 저장
     * 성공 시 파일 정보 배열 반환, 실패 시 null
     */
    private function downloadImage(string $imgUrl, int $postId): ?array
    {
        try {
            $client = $this->makeClient();
            $response = $client->get($imgUrl, ['timeout' => 20]);

            $originalName = basename(parse_url($imgUrl, PHP_URL_PATH));
            $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

            // 확장자가 없거나 webp처럼 mime으로 판단이 필요한 경우 Content-Type으로 보완
            $contentType = $response->getHeaderLine('Content-Type');
            if (!$ext || $ext === 'webp') {
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
            $dir        = 'uploads/post/' . $postId;
            $savePath   = $dir . '/' . $storedName;
            $contents   = (string) $response->getBody();

            Storage::disk('public')->makeDirectory($dir);
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
            $this->warn("    이미지 다운로드 실패 ({$imgUrl}): " . $e->getMessage());
            return null;
        }
    }

    private function fetchHtml(Client $client, string $url): ?string
    {
        try {
            $response = $client->get($url);
            return (string) $response->getBody();
        } catch (RequestException $e) {
            $this->error("  HTTP 에러 ({$url}): " . $e->getMessage());
            return null;
        }
    }
}
