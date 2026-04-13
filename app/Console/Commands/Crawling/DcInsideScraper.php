<?php

namespace App\Console\Commands\Crawling;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Board\Post;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DcInsideScraper extends BaseScraper
{
    protected $signature   = 'crawl:dcinside';
    protected $description = 'DCInside 갤러리 게시글 크롤링 및 DB 저장';

    private const SOURCE         = 'DCINSIDE';
    private const BASE_URL       = 'https://gall.dcinside.com';
    private const ANONYMOUS_NAME = '익명';

    private const GALLERIES = [
        'programming'   => 'free',
        'stock_new1'    => 'stock',
        'baseball_new9' => 'sports',
        'soccer'        => 'sports',
    ];

    // mgallery는 URL 경로에 /board/ 가 추가됨
    private const GALLERY_TYPE = [
        'programming'   => 'mgallery',
        'stock_new1'    => 'board',
        'baseball_new9' => 'board',
        'soccer'        => 'board',
    ];

    private const PAGES_PER_GALLERY = 2;

    public function handle(): void
    {
        $client = $this->makeClient(['allow_redirects' => true, 'headers' => ['Referer' => self::BASE_URL]]);

        $this->startCrawlLog(self::SOURCE);
        $this->info('[' . now()->format('Y-m-d H:i:s') . '] DC인사이드 크롤링 시작');

        foreach (self::GALLERIES as $galleryId => $category) {
            $this->info("갤러리 크롤링: {$galleryId} → category: {$category}");
            $this->crawlGallery($client, $galleryId, $category);
        }

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 크롤링 완료');
        $this->finishCrawlLog();
    }

    private function crawlGallery(Client $client, string $galleryId, string $category): void
    {
        $gallType = self::GALLERY_TYPE[$galleryId] ?? 'board';

        for ($page = 1; $page <= self::PAGES_PER_GALLERY; $page++) {
            try {
                // mgallery는 /mgallery/board/lists/, 일반은 /board/lists/
                $pathPrefix = $gallType === 'mgallery' ? '/mgallery/board/lists/' : '/board/lists/';
                $listUrl    = self::BASE_URL . $pathPrefix . "?id={$galleryId}&page={$page}";
                $html      = $this->fetchHtml($client, $listUrl);
                if (!$html) break;

                $crawler   = new Crawler($html);
                $postLinks = [];

                $crawler->filter('tr.us-post, tr.ub-content')->each(function (Crawler $row) use (&$postLinks, $gallType, $galleryId) {
                    if ($row->attr('class') && str_contains($row->attr('class'), 'notice')) return;

                    $linkNode = $row->filter('td.gall_tit a')->first();
                    if (!$linkNode->count()) return;

                    $href = $linkNode->attr('href') ?? '';
                    if (!$href) return;

                    if (!str_starts_with($href, 'http')) {
                        $href = self::BASE_URL . $href;
                    }

                    if (preg_match('/[?&]no=(\d+)/', $href, $m)) {
                        $postLinks[$m[1]] = $href;
                    }
                });

                if (empty($postLinks)) {
                    $this->warn("  게시글 링크를 찾지 못했습니다. (page {$page})");
                    break;
                }

                $this->info("  page {$page}: " . count($postLinks) . "건 발견");
                $this->incFound(count($postLinks));

                $candidateSourceIds = array_map(fn($no) => $galleryId . '_' . $no, array_keys($postLinks));
                $existing = $this->fetchExistingSourceIds(self::SOURCE, $candidateSourceIds);

                foreach ($postLinks as $postNo => $url) {
                    $sourceId = $galleryId . '_' . $postNo;
                    if (isset($existing[$sourceId])) {
                        $this->line("  스킵 (중복): {$sourceId}");
                        $this->incSkipped();
                        continue;
                    }
                    $this->crawlPost($client, $galleryId, $category, $postNo, $url);
                    $this->throttle();
                }

            } catch (\Exception $e) {
                $this->error("  갤러리 에러 ({$galleryId} page {$page}): " . $e->getMessage());
            }
        }
    }

    private function crawlPost(Client $client, string $galleryId, string $category, string $postNo, string $url): void
    {
        $sourceId = $galleryId . '_' . $postNo;

        try {
            $html = $this->fetchHtml($client, $url);
            if (!$html) return;

            $c = new Crawler($html);

            $titleNode = $c->filter('.title_subject')->first();
            if (!$titleNode->count()) {
                $titleNode = $c->filter('h3.title span')->first();
            }
            $title = $titleNode->count() ? trim($titleNode->text()) : '(제목 없음)';

            $authorNode = $c->filter('.gall_writer .nickname')->first();
            if (!$authorNode->count()) {
                $authorNode = $c->filter('.gall_writer .ip')->first();
            }
            $author = $authorNode->count() ? trim(strip_tags($authorNode->html())) : self::ANONYMOUS_NAME;

            $contentNode = $c->filter('.write_div')->first();
            if (!$contentNode->count()) {
                $this->warn("  본문 없음: {$url}");
                return;
            }
            $contentHtml = $this->fixVideoUrls($this->cleanContent($contentNode->html()), self::BASE_URL);

            $images = $this->collectImages($contentNode, self::BASE_URL);

            // 조회수: <span class="gall_count">조회 135</span>
            $hits = $this->extractHits($c, ['.gall_count', '.view_count']);

            // DB 저장 (트랜잭션) — 이미지 HTTP 요청 없음
            $post = DB::transaction(function () use ($sourceId, $category, $title, $author, $contentHtml, $hits) {
                $slug = Str::slug($author) ?: 'dc-user';
                $user = $this->firstOrCreateUser($author, $slug . '_' . Str::random(6) . '@dummy.dcinside.com');

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
                $finalContent = $this->replaceImageUrls($contentHtml, $images, $downloaded);
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
}
