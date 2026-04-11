<?php

namespace App\Console\Commands\Crawling;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Board\Post;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FomosScraper extends BaseScraper
{
    protected $signature   = 'crawl:fomos';
    protected $description = '포모스(fomos.kr) 게시글 크롤링 및 DB 저장';

    private const SOURCE         = 'FOMOS';
    private const DOMAIN         = 'fomos.kr';
    private const BASE_URL       = 'https://www.' . self::DOMAIN;
    private const ANONYMOUS_NAME = '포모스_익명';

    /**
     * 크롤링할 게시판 목록
     *
     * type: 'esports' | 'commune'
     * url : 목록 페이지 전체 URL
     * key : source_id prefix (중복 방지)
     * category: 저장할 post_category
     */
    private const BOARDS = [
        [
            'type'     => 'esports',
            'url'      => self::BASE_URL . '/esports/news_list?news_cate_id=1',
            'key'      => 'e',
            'category' => 'game',
        ],
        [
            'type'     => 'commune',
            'url'      => self::BASE_URL . '/commune/article_list?bbs_id=33',
            'key'      => 'c33',
            'category' => 'free',
        ],
        [
            'type'     => 'commune',
            'url'      => self::BASE_URL . '/commune/article_list?bbs_id=34',
            'key'      => 'c34',
            'category' => 'free',
        ],
    ];

    public function handle(): void
    {
        $client = $this->makeClient();

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 포모스 크롤링 시작');

        foreach (self::BOARDS as $board) {
            $this->info("게시판 크롤링: {$board['url']}");
            $this->crawlBoard($client, $board);
        }

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 크롤링 완료');
    }

    private function crawlBoard(Client $client, array $board): void
    {
        try {
            $html = $this->fetchHtml($client, $board['url']);
            if (!$html) return;

            $crawler    = new Crawler($html);
            $postLinks  = [];

            if ($board['type'] === 'esports') {
                // e스포츠 뉴스: href="/esports/news_view?...entry_id=12345..."
                $crawler->filter('a[href*="news_view"]')->each(function (Crawler $node) use (&$postLinks, $board) {
                    $href = $node->attr('href');
                    if (!$href) return;

                    if (preg_match('/entry_id=(\d+)/', $href, $m)) {
                        $sourceId = $board['key'] . '_' . $m[1];
                        $postLinks[$sourceId] = self::BASE_URL . '/esports/news_view?entry_id=' . $m[1];
                    }
                });
            } else {
                // 커뮤니티: href="/commune/article_view?bbs_id=33&...indexno=123..."
                $crawler->filter('a[href*="article_view"]')->each(function (Crawler $node) use (&$postLinks, $board) {
                    $href = $node->attr('href');
                    if (!$href) return;

                    if (preg_match('/bbs_id=(\d+).*indexno=(\d+)/', $href, $m)) {
                        $sourceId = $board['key'] . '_' . $m[2];
                        $postLinks[$sourceId] = self::BASE_URL . '/commune/article_view?bbs_id=' . $m[1] . '&indexno=' . $m[2];
                    }
                });
            }

            $postLinks = array_unique($postLinks);

            if (empty($postLinks)) {
                $this->warn('  게시글 링크를 찾지 못했습니다.');
                return;
            }

            $this->info('  총 ' . count($postLinks) . '건 발견');

            $existing = $this->fetchExistingSourceIds(self::SOURCE, array_keys($postLinks));

            foreach ($postLinks as $sourceId => $url) {
                if (isset($existing[$sourceId])) {
                    $this->line("  스킵 (중복): source_id={$sourceId}");
                    continue;
                }
                $this->crawlPost($client, $sourceId, $url, $board['category']);
                sleep(rand(1, 2));
            }

        } catch (\Exception $e) {
            $this->error('  게시판 에러: ' . $e->getMessage());
        }
    }

    private function crawlPost(Client $client, string $sourceId, string $url, string $category): void
    {
        try {
            $html = $this->fetchHtml($client, $url);
            if (!$html) return;

            $c = new Crawler($html);

            // 제목: og:title 우선, 없으면 .board_area h3
            $ogTitle = $c->filter('meta[property="og:title"]')->first();
            if ($ogTitle->count()) {
                $title = trim(preg_replace('/\s*[-|]\s*포모스.*$/iu', '', $ogTitle->attr('content')));
            } else {
                $h3 = $c->filter('.board_area.common_view h3')->first();
                $title = $h3->count() ? trim($h3->text()) : '(제목 없음)';
            }
            if ($title === '') $title = '(제목 없음)';

            // 작성자: p.sub_tit 첫 번째 span
            $authorNode = $c->filter('p.sub_tit span')->first();
            $author     = $authorNode->count() ? trim($authorNode->text()) : self::ANONYMOUS_NAME;
            if ($author === '') $author = self::ANONYMOUS_NAME;

            // 본문: .view_text
            $contentNode = $c->filter('.view_text')->first();
            if (!$contentNode->count()) {
                $this->warn("  본문 없음: {$url}");
                return;
            }
            $contentHtml = $this->fixVideoUrls($this->cleanContent($contentNode->html()), self::BASE_URL);

            $images = $this->collectImages($contentNode, self::BASE_URL);

            // DB 저장
            $post = DB::transaction(function () use ($sourceId, $category, $title, $author, $contentHtml) {
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
                    'hits'          => 0,
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

            $this->info("  저장: [{$sourceId}] {$title} / 작성자: {$author} / 이미지: " . count($downloaded) . '/' . count($images) . '개');

        } catch (\Exception $e) {
            $this->error("  게시글 에러 (source_id={$sourceId}): " . $e->getMessage());
        }
    }
}
