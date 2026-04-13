<?php

namespace App\Console\Commands\Crawling;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Board\Post;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TheqooScraper extends BaseScraper
{
    protected $signature = 'crawl:theqoo';
    protected $description = '더쿠(theqoo.net) 게시글 크롤링 및 DB 저장';

    private const SOURCE         = 'THEQOO';
    private const DOMAIN         = 'theqoo.net';
    private const BASE_URL       = 'https://' . self::DOMAIN;
    private const ANONYMOUS_NAME = '익명';

    // 게시판 mid → 기본 카테고리 (상세 페이지의 카테고리로 덮어씀)
    private const BOARDS = [
        'hot'    => 'free',
        'square' => 'free',
        // 'talk' 는 로그인 필요 게시판으로 403 반환 — 제외
        'ktalk'  => 'enter',
        'dyb'    => 'enter',
        'stock'  => 'stock',
        'exercise'  => 'sports',
        'sports' => 'sports',
        'kstar'  => 'enter',
        'lolt1'   => 'game',
        'kdolboys'  => 'enter',
        'kdolgirls' => 'enter',
    ];

    // 더쿠 카테고리 → 우리 board category
    private const CATEGORY_MAP = [
        '영화/드라마/방송' => 'enter',
        '케이돌'          => 'enter',
    ];

    public function handle(): void
    {
        $client = $this->makeClient([
            'headers' => ['Referer' => self::BASE_URL],
        ]);

        $this->startCrawlLog(self::SOURCE);
        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 더쿠 크롤링 시작');

        foreach (self::BOARDS as $boardMid => $defaultCategory) {
            $this->info("게시판 크롤링: {$boardMid}");
            $this->crawlBoard($client, $boardMid, $defaultCategory);
        }

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 크롤링 완료');
        $this->finishCrawlLog();
    }

    private function crawlBoard(Client $client, string $boardMid, string $defaultCategory): void
    {
        try {
            $html = $this->fetchHtml($client, self::BASE_URL . '/' . $boardMid);
            if (!$html) return;

            $crawler   = new Crawler($html);
            $postLinks = [];

            // 게시글 링크: td.title > a 중 /{board}/{숫자} 패턴만 (replyNum 제외)
            $crawler->filter('td.title a:not(.replyNum)')->each(function (Crawler $node) use ($boardMid, &$postLinks) {
                $href = $node->attr('href') ?? '';
                if (!$href) return;

                if (preg_match('#^/' . preg_quote($boardMid, '#') . '/(\d{6,})$#', $href, $m)) {
                    $postLinks[$m[1]] = self::BASE_URL . $href;
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
                $this->crawlPost($client, $sourceId, $url, $defaultCategory);
                $this->throttle();
            }

        } catch (\Exception $e) {
            $this->error("  게시판 에러 ({$boardMid}): " . $e->getMessage());
        }
    }

    private function crawlPost(Client $client, string $sourceId, string $url, string $defaultCategory): void
    {
        try {
            $html = $this->fetchHtml($client, $url);
            if (!$html) return;

            $c = new Crawler($html);

            // 제목
            $titleNode = $c->filter('.theqoo_document_header .title')->first();
            $title     = $titleNode->count() ? trim($titleNode->text()) : '';
            if (!$title) {
                $ogTitle = $c->filter('meta[property="og:title"]')->first();
                $title   = $ogTitle->count() ? trim($ogTitle->attr('content')) : '(제목 없음)';
            }

            // 카테고리 (상세 페이지 카테고리 우선)
            $cateNode    = $c->filter('.theqoo_document_header .cate')->first();
            $detailCate  = $cateNode->count() ? trim($cateNode->text()) : '';
            $category    = self::CATEGORY_MAP[$detailCate] ?? $defaultCategory;

            // 작성자 (.btm_area .side 첫 번째 div의 텍스트 노드)
            $sideNode = $c->filter('.btm_area .side')->first();
            $author   = self::ANONYMOUS_NAME;
            if ($sideNode->count()) {
                $rawText = trim($sideNode->getNode(0)->textContent);
                // 링크(https://...) 제거 후 첫 줄만 사용
                $author = trim(preg_replace('/https?:\/\/\S+/', '', $rawText));
                $author = trim(preg_replace('/\s+/', ' ', $author));
                if ($author === '') $author = self::ANONYMOUS_NAME;
                if($author === '무명의 더쿠') $author = self::ANONYMOUS_NAME; // 작성자명이 '더쿠'인 경우 익명 처리
            }

            // 본문
            $contentNode = $c->filter('.xe_content')->first();
            if (!$contentNode->count()) {
                $this->warn("  본문 없음: {$url}");
                return;
            }
            $contentHtml = $this->fixVideoUrls($this->cleanContent($contentNode->html()), self::BASE_URL);

            $images = $this->collectImages($contentNode, self::BASE_URL);

            // 조회수: 더쿠는 조회수가 JS 렌더링이므로 스크랩수/추천수를 대체값으로 사용
            $hits = $this->extractHits($c, ['#scrapped_count', '#voted_count', 'span.view_count', '.view_count']);

            // DB 저장 (트랜잭션)
            $post = DB::transaction(function () use ($sourceId, $category, $title, $author, $contentHtml, $hits) {
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
            $this->info("  저장: [{$sourceId}] {$title} / 작성자: {$author} / 카테고리: {$category} / 이미지: " . count($downloaded) . '/' . count($images) . '개');

        } catch (\Exception $e) {
            $this->error("  게시글 에러 (source_id={$sourceId}): " . $e->getMessage());
        }
    }
}
