<?php

namespace App\Console\Commands\Crawling;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Board\Post;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DogDripScraper extends BaseScraper
{
    protected $signature = 'crawl:dogdrip';
    protected $description = 'DogDrip.net 게시글 크롤링 및 DB 저장';

    private const SOURCE         = 'DOGDRIP';
    private const DOMAIN         = 'dogdrip.net';
    private const BASE_URL       = 'https://www.' . self::DOMAIN;
    private const ANONYMOUS_NAME = '개드립_익명';

    private const BOARDS = [
        'dogdrip' => '/dogdrip',
        'userdog' => '/userdog',
        'doc'     => '/doc',
        'stock'   => '/stock',
        'ib'      => '/ib',
        'game'    => '/game',
        'lol'   => '/lol',
        'coin'    => '/coin',
        'lostark' => '/lostark',
        'diablo'   => '/diablo',
    ];

    private const CATEGORY_MAP = [
        'dogdrip' => 'free',
        'userdog' => 'free',
        'doc'     => 'free',
        'stock'   => 'stock',
        'ib'      => 'enter',
        'game'    => 'game',
        'coin'    => 'stock',
        'lol'     => 'game',
        'lostark' => 'game',
        'diablo'  => 'game',
    ];

    public function handle(): void
    {
        $client = $this->makeClient();

        $this->startCrawlLog(self::SOURCE);
        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 개드립 크롤링 시작');

        foreach (self::BOARDS as $boardName => $boardPath) {
            $this->info("게시판 크롤링: {$boardName}");
            $this->crawlBoard($client, $boardName, $boardPath);
        }

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 크롤링 완료');
        $this->finishCrawlLog();
    }

    private function crawlBoard(Client $client, string $boardName, string $boardPath): void
    {
        try {
            $html = $this->fetchHtml($client, self::BASE_URL . $boardPath);
            if (!$html) return;

            $crawler  = new Crawler($html);
            $postLinks = [];

            $crawler->filter('a.title-link, a.ed.link-reset')->each(function (Crawler $node) use (&$postLinks) {
                $href = $node->attr('href');
                if (!$href) return;

                if (!str_starts_with($href, 'http')) {
                    $href = self::BASE_URL . '/' . ltrim($href, '/');
                }

                if (preg_match('#/(\d{7,})(?:[/?]|$)#', $href, $m)) {
                    $postLinks[$m[1]] = $href;
                }
            });

            if (empty($postLinks)) {
                $this->warn("  게시글 링크를 찾지 못했습니다.");
                return;
            }

            $this->info("  총 " . count($postLinks) . "건 발견");
            $this->incFound(count($postLinks));

            $existing = $this->fetchExistingSourceIds(self::SOURCE, array_keys($postLinks));

            foreach ($postLinks as $sourceId => $url) {
                if (isset($existing[$sourceId])) {
                    $this->line("  스킵 (중복): source_id={$sourceId}");
                    $this->incSkipped();
                    continue;
                }
                $this->crawlPost($client, $boardName, $sourceId, $url);
                sleep(rand(1, 2));
            }

        } catch (\Exception $e) {
            $this->error("  게시판 에러 ({$boardName}): " . $e->getMessage());
        }
    }

    private function crawlPost(Client $client, string $boardName, string $sourceId, string $url): void
    {
        try {
            $html = $this->fetchHtml($client, $url);
            if (!$html) return;

            $c = new Crawler($html);

            $ogTitle = $c->filter('meta[property="og:title"]')->first();
            $title   = $ogTitle->count()
                ? trim(preg_replace('/\s*-\s*DogDrip\.Net.*$/i', '', $ogTitle->attr('content')))
                : '(제목 없음)';

            $authorNode = $c->filter('.title-toolbar a[class*="member_"]')->first();
            $author     = $authorNode->count() ? trim($authorNode->text()) : self::ANONYMOUS_NAME;

            $contentNode = $c->filter('.xe_content')->first();
            if (!$contentNode->count()) {
                $this->warn("  본문 없음: {$url}");
                return;
            }
            $contentHtml = $this->fixVideoUrls($this->cleanContent($contentNode->html()), self::BASE_URL);

            $images = $this->collectImages($contentNode, self::BASE_URL);

            // 조회수: XE 엔진 표준 selector
            $hits = $this->extractHits($c, ['span.view_count', '.view_count', '.rd_num_view']);

            // DB 저장 (트랜잭션) — 이미지 HTTP 요청 없음
            $post = DB::transaction(function () use ($sourceId, $boardName, $title, $author, $contentHtml, $hits) {
                $user = $this->firstOrCreateUser(
                    $author,
                    Str::slug($author) . '_' . Str::random(6) . '@' . self::DOMAIN
                );

                return Post::create([
                    'source'        => self::SOURCE,
                    'source_id'     => $sourceId,
                    'user_id'       => $user->id,
                    'post_status'   => 'ACTIVE',
                    'post_type'     => 'NORMAL',
                    'post_category' => self::CATEGORY_MAP[$boardName] ?? $boardName,
                    'title'         => $title,
                    'content'       => $contentHtml,
                    'hits'          => $hits,
                    'comment_count' => 0,
                    'is_notice'     => false,
                ]);
            });

            // 이미지 다운로드 (트랜잭션 밖)
            $downloaded = $this->downloadImages($client, $images, $post->post_id);

            // File 레코드 저장 + content URL 교체
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
