<?php

namespace App\Console\Commands\Crawling;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Board\Post;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BobaedreamScraper extends BaseScraper
{
    protected $signature   = 'crawl:bobaedream';
    protected $description = '보배드림 게시글 크롤링 및 DB 저장 (베스트글, 자유게시판)';

    private const SOURCE   = 'BOBAEDREAM';
    private const DOMAIN   = 'bobaedream.co.kr';
    private const BASE_URL = 'https://www.' . self::DOMAIN;

    /**
     * code → 저장할 post_category
     * 보배드림 베스트/자유게시판 모두 자유 카테고리로 저장
     */
    private const BOARDS = [
        'best'  => 'free',  // 베스트글
        'freeb' => 'free',  // 자유게시판
    ];

    public function handle(): void
    {
        $client = $this->makeClient([
            'headers' => [
                'Referer' => self::BASE_URL . '/',
            ],
        ]);

        $this->startCrawlLog(self::SOURCE);
        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 보배드림 크롤링 시작');

        foreach (self::BOARDS as $code => $category) {
            $label = $code === 'best' ? '베스트글' : '자유게시판';
            $this->info("게시판 크롤링: {$label} (code={$code})");
            $this->crawlBoard($client, $code, $category);
        }

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 크롤링 완료');
        $this->finishCrawlLog();
    }

    private function crawlBoard(Client $client, string $code, string $category): void
    {
        try {
            $listUrl = self::BASE_URL . '/list?code=' . $code;
            $html    = $this->fetchHtml($client, $listUrl);
            if (!$html) return;

            $crawler   = new Crawler($html);
            $postLinks = [];

            /*
             * 보배드림 리스트 구조:
             *   <table class="board_list">
             *     <tr class="border-bottom">
             *       <td class="subj">
             *         <a href="/view?code=best&No=1234567">title</a>
             *       </td>
             *     </tr>
             *   </table>
             *
             * No=숫자 파라미터를 추출해 source_id 로 사용.
             * 게시판 code별로 No가 중복될 수 있으므로 "code_No" 형태로 구성.
             */
            $crawler->filter('a')->each(function (Crawler $node) use ($code, &$postLinks) {
                $href = $node->attr('href');
                if (!$href) return;

                // /view?code=...&No=숫자 또는 &No=숫자 패턴
                if (!preg_match('/[?&]No=(\d{4,})/i', $href, $m)) return;

                $no       = $m[1];
                $sourceId = $code . '_' . $no;

                if (isset($postLinks[$sourceId])) return;

                // 절대 URL 보정
                if (!str_starts_with($href, 'http')) {
                    $href = self::BASE_URL . (str_starts_with($href, '/') ? $href : '/' . $href);
                }

                $postLinks[$sourceId] = $href;
            });

            if (empty($postLinks)) {
                $this->warn("  게시글 링크를 찾지 못했습니다. (code={$code})");
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
                $this->crawlPost($client, $sourceId, $url, $category);
                $this->throttle();
            }

        } catch (\Exception $e) {
            $this->error("  게시판 에러 (code={$code}): " . $e->getMessage());
        }
    }

    private function crawlPost(Client $client, string $sourceId, string $url, string $category): void
    {
        try {
            $html = $this->fetchHtml($client, $url);
            if (!$html) return;

            $c = new Crawler($html);

            // ── 제목 ───────────────────────────────────────────────────
            $title = $this->extractTitle($c);

            // ── 작성자 닉네임 ──────────────────────────────────────────
            $author = $this->extractAuthor($c);

            // ── 본문 ───────────────────────────────────────────────────
            $contentNode = $this->extractContentNode($c);
            if (!$contentNode) {
                $this->warn("  본문 없음: {$url}");
                return;
            }

            $contentHtml = $this->fixVideoUrls(
                $this->cleanContent($contentNode->html()),
                self::BASE_URL
            );
            $images = $this->collectImages($contentNode, self::BASE_URL);
            $videos = $this->collectVideos($contentNode, self::BASE_URL);

            // ── 조회수 ─────────────────────────────────────────────────
            $hits = $this->extractHits($c, [
                '.view_num em',      // 기본 구조: <span class="view_num"><em>12,345</em></span>
                '.viewCount em',
                'dd.count',
                'span.count',
                'em.hit',
                '.cnt_view em',
            ]);

            // ── DB 저장 (트랜잭션) ─────────────────────────────────────
            $post = DB::transaction(function () use ($sourceId, $title, $author, $contentHtml, $hits, $category) {
                $user = $this->firstOrCreateUser(
                    $author,
                    Str::slug($author, '_') . '_' . Str::random(6) . '@' . self::DOMAIN
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

            // ── 이미지 다운로드 (트랜잭션 밖) ─────────────────────────
            $downloaded = $this->downloadImages($client, $images, $post->post_id);
            $currentContent = $contentHtml;

            if (!empty($downloaded)) {
                $this->saveFileRecords($post->post_id, $downloaded);
                $currentContent = $this->replaceImageUrls($currentContent, $images, $downloaded);
            }

            // ── 비디오 다운로드 (트랜잭션 밖) ─────────────────────────
            $downloadedVideos = $this->downloadVideos($client, $videos, $post->post_id);

            if (!empty($downloadedVideos)) {
                $this->saveFileRecords($post->post_id, $downloadedVideos);
                $currentContent = $this->replaceVideoUrls($currentContent, $videos, $downloadedVideos);
            }

            if ($currentContent !== $contentHtml) {
                $post->update(['content' => $currentContent]);
            }

            $this->incSaved();
            $this->info(
                "  저장: [{$sourceId}] {$title}" .
                " / 작성자: {$author}" .
                " / 이미지: " . count($downloaded) . '/' . count($images) . '개' .
                " / 비디오: " . count($downloadedVideos) . '/' . count($videos) . '개'
            );

        } catch (\Exception $e) {
            $this->error("  게시글 에러 (source_id={$sourceId}): " . $e->getMessage());
        }
    }

    // ---------------------------------------------------------------
    // 추출 헬퍼
    // ---------------------------------------------------------------

    private function extractTitle(Crawler $c): string
    {
        // og:title 우선 — 사이트명 제거
        $og = $c->filter('meta[property="og:title"]')->first();
        if ($og->count()) {
            $t = trim(preg_replace('/\s*[|\-]\s*보배드림.*$/iu', '', $og->attr('content') ?? ''));
            if ($t !== '') return $t;
        }

        foreach ([
            'h3.tit',
            '.writerInfo h4',
            '.subject h3',
            '.view_tit',
            'h2.tit',
            'h1.tit',
        ] as $sel) {
            try {
                $node = $c->filter($sel)->first();
                if ($node->count()) {
                    $t = trim($node->text());
                    if ($t !== '') return $t;
                }
            } catch (\Exception) {}
        }

        return '(제목 없음)';
    }

    private function extractAuthor(Crawler $c): string
    {
        foreach ([
            '.writerInfo .nick',
            '.writerInfo a.nick',
            'a.nick',
            'span.nick',
            '.writer .nick',
            '.profile_info .nick',
        ] as $sel) {
            try {
                $node = $c->filter($sel)->first();
                if ($node->count()) {
                    $t = trim($node->text());
                    if ($t !== '') return $t;
                }
            } catch (\Exception) {}
        }

        return '익명';
    }

    private function extractContentNode(Crawler $c): ?Crawler
    {
        foreach ([
            '.bodyCont',           // 가장 흔한 보배드림 본문 컨테이너
            '.board_view_content',
            '.view-content',
            '.car_contents',
            '#bodyCont',
            '.content_wrap',
        ] as $sel) {
            try {
                $node = $c->filter($sel)->first();
                if ($node->count()) return $node;
            } catch (\Exception) {}
        }

        return null;
    }
}
