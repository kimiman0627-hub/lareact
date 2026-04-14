<?php

namespace App\Console\Commands\Crawling;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Board\Post;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EtolandScraper extends BaseScraper
{
    protected $signature = 'crawl:etoland';
    protected $description = '이토랜드(etoland.co.kr) 게시글 크롤링 및 DB 저장';

    private const SOURCE         = 'ETOLAND';
    private const DOMAIN         = 'etoland.co.kr';
    private const BASE_URL       = 'https://www.' . self::DOMAIN;
    private const ANONYMOUS_NAME = '익명';

    private const BOARDS = [
        'etohumor07' => ['path' => '/bbs/board.php?bo_table=etohumor07', 'category' => 'free'],
        'freebbs'    => ['path' => '/bbs/board.php?bo_table=freebbs',    'category' => 'free'],
        'sisabbs01'  => ['path' => '/bbs/board.php?bo_table=sisabbs01',  'category' => 'free'],
        'etomovie'   => ['path' => '/bbs/board.php?bo_table=etomovie',   'category' => 'free'],
        'star02'     => ['path' => '/bbs/board.php?bo_table=star02',     'category' => 'free'],
    ];

    public function handle(): void
    {
        $client = $this->makeClient([
            'headers' => ['Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'],
        ]);

        $this->startCrawlLog(self::SOURCE);
        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 이토랜드 크롤링 시작');

        foreach (self::BOARDS as $boardName => $boardInfo) {
            $this->info("게시판 크롤링: {$boardName}");
            $this->crawlBoard($client, $boardName, $boardInfo);
        }

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 크롤링 완료');
        $this->finishCrawlLog();
    }

    private function crawlBoard(Client $client, string $boardName, array $boardInfo): void
    {
        try {
            $html = $this->fetchHtml($client, self::BASE_URL . $boardInfo['path'], true);
            if (!$html) return;

            $crawler   = new Crawler($html);
            $postLinks = [];

            $crawler->filter('a[href]')->each(function (Crawler $node) use ($boardName, &$postLinks) {
                $href = $node->attr('href');
                if (!$href) return;

                if (preg_match('/bo_table=' . preg_quote($boardName, '/') . '&(?:amp;)?wr_id=(\d+)/i', $href, $m)) {
                    $wrId = $m[1];
                    if (isset($postLinks[$wrId])) return;

                    if (!str_starts_with($href, 'http')) {
                        $href = self::BASE_URL . '/' . ltrim($href, '/');
                    }
                    $postLinks[$wrId] = str_replace('&amp;', '&', $href);
                }
            });

            if (empty($postLinks)) {
                $this->warn("  게시글 링크를 찾지 못했습니다.");
                return;
            }

            $this->info("  총 " . count($postLinks) . "건 발견");
            $this->incFound(count($postLinks));

            $candidateSourceIds = array_map(fn($wrId) => $boardName . '_' . $wrId, array_keys($postLinks));
            $existing = $this->fetchExistingSourceIds(self::SOURCE, $candidateSourceIds);

            foreach ($postLinks as $wrId => $url) {
                $sourceId = $boardName . '_' . $wrId;
                if (isset($existing[$sourceId])) {
                    $this->line("  스킵 (중복): source_id={$sourceId}");
                    $this->incSkipped();
                    continue;
                }
                $this->crawlPost($client, $boardName, $boardInfo['category'], $sourceId, $url);
                $this->throttle();
            }

        } catch (\Exception $e) {
            $this->error("  게시판 에러 ({$boardName}): " . $e->getMessage());
        }
    }

    private function crawlPost(Client $client, string $boardName, string $category, string $sourceId, string $url): void
    {
        try {
            $html = $this->fetchHtml($client, $url, true);
            if (!$html) return;

            $c = new Crawler($html);

            $ogTitle = $c->filter('meta[property="og:title"]')->first();
            if ($ogTitle->count()) {
                $title = trim($ogTitle->attr('content'));
            } else {
                $rawTitle = $c->filter('.title_wrap .title')->count()
                    ? $c->filter('.title_wrap .title')->first()->text()
                    : '';
                // etoland 목록형 제목: "[카테고리] 제목 [댓글수 N]" 형식에서 앞뒤 제거
                $title = trim(preg_replace('/\[댓글수\s*\d+\]\s*$/', '', preg_replace('/^\[[^\]]*\]\s*/', '', $rawTitle)));
            }

            if (!$title) {
                $this->warn("  제목 없음: {$url}");
                return;
            }

            $writerNode = $c->filter('span.writer span.member')->first();
            $author     = $writerNode->count() ? trim($writerNode->text()) : self::ANONYMOUS_NAME;
            if ($author === '이토랜드_익명') {
                $author = self::ANONYMOUS_NAME;
            }

            $contentNode = $c->filter('#view_content')->first();
            if (!$contentNode->count()) {
                $this->warn("  본문 없음: {$url}");
                return;
            }
            $contentHtml = $this->fixVideoUrls($this->cleanContent($contentNode->html()), self::BASE_URL);

            // 썸네일 리사이즈 URL → 원본으로 복원 후 이미지 수집
            $images = $this->collectImagesEtoland($contentNode, $boardName);

            // 조회수: GnuBoard5 표준 - <span class="views">13420</span>
            $hits = $this->extractHits($c, ['span.views', '#view_count', '.view_count', 'span.count']);

            // DB 저장 (트랜잭션) — 이미지 HTTP 요청 없음
            $post = DB::transaction(function () use ($sourceId, $category, $title, $author, $contentHtml, $hits) {
                $slug = Str::slug($author) ?: 'user';
                $user = $this->firstOrCreateUser($author, $slug . '_' . Str::random(6) . '@' . self::DOMAIN);

                return Post::create([
                    'source'        => self::SOURCE,
                    'source_id'     => $sourceId,
                    'user_id'       => $user->id,
                    'post_status'   => 'ACTIVE',
                    'post_type'     => 'NORMAL',
                    'post_category' => $category,
                    'title'         => $title,
                    'content'       => $contentHtml,
                    'hits'          => $hits,
                    'comment_count' => 0,
                    'is_notice'     => false,
                ]);
            });

            // 이미지 다운로드 (트랜잭션 밖)
            $downloaded = $this->downloadImages($client, $images, $post->post_id);

            if (!empty($downloaded)) {
                $this->saveFileRecords($post->post_id, $downloaded);
                $finalContent = $this->replaceEtolandImageUrls($contentHtml, $images, $downloaded);
                if ($finalContent !== $contentHtml) {
                    $post->update(['content' => $finalContent]);
                }
            }

            $this->incSaved();
            $this->info("  저장: [{$sourceId}] {$title} / 작성자: {$author} / 이미지: " . count($downloaded) . '/' . count($images) . '개');

        } catch (\Exception $e) {
            $this->error("  게시글 에러 (source_id={$sourceId}): " . $e->getMessage());
        }
    }

    /**
     * 이토랜드 전용 이미지 수집.
     * GnuBoard5 lazy-loading: data-file-src에 실제 파일명, src는 로딩 플레이스홀더.
     * 리사이즈 프록시 URL(/module/resize/...?src=/data/...) → 원본 경로로 복원.
     */
    private function collectImagesEtoland(Crawler $contentNode, string $boardName): array
    {
        $images = [];

        $contentNode->filter('img')->each(function (Crawler $img) use ($boardName, &$images) {
            $dataFileSrc = $img->attr('data-file-src') ?? '';
            $src         = $img->attr('src')           ?? '';
            $dataSrc     = $img->attr('data-src')      ?? '';

            // GnuBoard5 lazy-loading: data-file-src가 실제 이미지 파일명
            if ($dataFileSrc && !str_starts_with($dataFileSrc, 'data:')) {
                if (isset($images[$dataFileSrc])) return;
                // CDN 경로: /data/file/[board_table]/[filename]
                $cdnUrl = self::BASE_URL . '/data/file/' . $boardName . '/' . $dataFileSrc;
                $images[$dataFileSrc] = ['resolved' => $cdnUrl, 'attr' => 'data-file-src'];
                return;
            }

            // 일반 data-src 또는 src (로딩 플레이스홀더 제외)
            if ($dataSrc && !str_starts_with($dataSrc, 'data:')) {
                $originalSrc = $dataSrc;
                $attrName    = 'data-src';
            } elseif ($src && !str_starts_with($src, 'data:') && !str_contains($src, 'loading_img')) {
                $originalSrc = $src;
                $attrName    = 'src';
            } else {
                return;
            }

            // 리사이즈 프록시 URL에서 원본 경로 복원
            if (preg_match('/[?&]src=(.+)$/', $originalSrc, $m)) {
                $originalSrc = urldecode($m[1]);
                $attrName    = 'src';
            }

            if (isset($images[$originalSrc])) return;

            $resolvedSrc = str_starts_with($originalSrc, 'http')
                ? $originalSrc
                : self::BASE_URL . '/' . ltrim($originalSrc, '/');

            $images[$originalSrc] = ['resolved' => $resolvedSrc, 'attr' => $attrName];
        });

        return $images;
    }

    /**
     * 이토랜드 전용 이미지 URL 교체.
     * data-file-src 방식: 플레이스홀더 src를 서버 URL로 교체하고 data-file-src 속성 제거.
     * 그 외는 BaseScraper::replaceImageUrls 와 동일.
     */
    private function replaceEtolandImageUrls(string $content, array $images, array $downloaded): string
    {
        foreach ($downloaded as $originalSrc => $fileInfo) {
            $serverUrl = $fileInfo['file_url'];
            $attrName  = $images[$originalSrc]['attr'] ?? 'src';

            if ($attrName === 'data-file-src') {
                // <img ... src="[placeholder]" ... data-file-src="TOKEN" ...> 처리:
                // 1) 플레이스홀더 src → 서버 URL로 교체
                // 2) data-file-src 속성 제거
                $content = preg_replace_callback(
                    '/<img\b([^>]*)\bdata-file-src=["\']' . preg_quote($originalSrc, '/') . '["\']([^>]*)>/i',
                    function (array $m) use ($serverUrl): string {
                        $before = $m[1];
                        $after  = $m[2];
                        $full   = $before . $after;

                        // 로딩 플레이스홀더 src 속성을 서버 URL로 교체
                        if (preg_match('/\bsrc=["\'][^"\']*loading[^"\']*["\']/i', $full)) {
                            $full = preg_replace(
                                '/\bsrc=["\'][^"\']*loading[^"\']*["\']/i',
                                'src="' . $serverUrl . '"',
                                $full
                            );
                        } else {
                            // src 속성이 없거나 다른 src인 경우 앞에 추가
                            $full = 'src="' . $serverUrl . '" ' . $full;
                        }

                        // 공백 정리
                        $full = trim(preg_replace('/\s+/', ' ', $full));
                        return '<img ' . $full . '>';
                    },
                    $content
                );
            } elseif ($attrName === 'data-src') {
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
}
