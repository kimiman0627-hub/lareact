<?php

namespace App\Console\Commands\Crawling;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\Board\Post;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * 이토랜드 크롤러 (2026-11 리뉴얼된 Next.js 사이트 기준)
 *
 *  목록: https://etoland.co.kr/b/{board}/list
 *        <main> 안의 <li> 행, 첫 칸 = 글번호, 제목 링크 = /b/{board}/view/{slug}-{글번호}
 *  본문: <h1> 제목, <meta name="author"> 작성자, "조회 : N", .view-content 본문
 *  이미지: src = btcdn 리사이즈 프록시, data-src = 원본 (btcdn 은 외부 Referer 차단 → 반드시 저장해서 사용)
 */
class EtolandScraper extends BaseScraper
{
    protected $signature = 'crawl:etoland';
    protected $description = '이토랜드(etoland.co.kr) 게시글 크롤링 및 DB 저장';

    private const SOURCE         = 'ETOLAND';
    private const DOMAIN         = 'etoland.co.kr';
    private const BASE_URL       = 'https://' . self::DOMAIN;
    private const ANONYMOUS_NAME = '익명';

    // etomovie 는 리뉴얼 후 게시판이 사라짐
    private const BOARDS = [
        'etohumor07' => 'free',
        'freebbs'    => 'free',
        'sisabbs01'  => 'free',
        'star02'     => 'free',
    ];

    public function handle(): void
    {
        $client = $this->makeClient([
            'headers' => ['Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'],
        ]);

        $this->startCrawlLog(self::SOURCE);
        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 이토랜드 크롤링 시작');

        foreach (self::BOARDS as $boardName => $category) {
            $this->info("게시판 크롤링: {$boardName}");
            $this->crawlBoard($client, $boardName, $category);
        }

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 크롤링 완료');
        $this->finishCrawlLog();
    }

    private function crawlBoard(Client $client, string $boardName, string $category): void
    {
        try {
            $html = $this->fetchHtml($client, self::BASE_URL . "/b/{$boardName}/list");
            if (!$html) return;

            $postLinks = $this->parseList(new Crawler($html), $boardName);

            if (empty($postLinks)) {
                $this->warn("  게시글 링크를 찾지 못했습니다.");
                return;
            }

            $this->info("  총 " . count($postLinks) . "건 발견");
            $this->incFound(count($postLinks));

            $candidateSourceIds = array_map(fn($no) => $boardName . '_' . $no, array_keys($postLinks));
            $existing = $this->fetchExistingSourceIds(self::SOURCE, $candidateSourceIds);

            foreach ($postLinks as $postNo => $url) {
                $sourceId = $boardName . '_' . $postNo;
                if (isset($existing[$sourceId])) {
                    $this->line("  스킵 (중복): source_id={$sourceId}");
                    $this->incSkipped();
                    continue;
                }
                $this->crawlPost($client, $category, $sourceId, $url);
                $this->throttle();
            }

        } catch (\Exception $e) {
            $this->error("  게시판 에러 ({$boardName}): " . $e->getMessage());
        }
    }

    /**
     * 목록 페이지에서 [글번호 => 절대 URL] 추출.
     * 사이드바(인기글/HIT 위젯)와 공지 행은 제외: <main> 안의 <li> 중 첫 칸이 숫자인 행만.
     */
    private function parseList(Crawler $crawler, string $boardName): array
    {
        $links = [];

        $crawler->filter('main li')->each(function (Crawler $li) use ($boardName, &$links) {
            $first = $li->filter('div')->first();
            $no    = $first->count() ? trim($first->text('')) : '';
            if (!ctype_digit($no)) return;

            $a = $li->filter('a[href^="/b/' . $boardName . '/view/"]')->first();
            if (!$a->count()) return;

            $href = strtok($a->attr('href'), '#');
            $links[$no] = self::BASE_URL . $href;
        });

        return $links;
    }

    private function crawlPost(Client $client, string $category, string $sourceId, string $url): void
    {
        try {
            $html = $this->fetchHtml($client, $url);
            if (!$html) return;

            $c = new Crawler($html);

            $title = $this->extractTitle($c);
            if (!$title) {
                $this->warn("  제목 없음: {$url}");
                return;
            }

            $authorNode = $c->filter('meta[name="author"]')->first();
            $author     = $authorNode->count() ? trim($authorNode->attr('content') ?? '') : '';
            if ($author === '' || $author === '이토랜드_익명') {
                $author = self::ANONYMOUS_NAME;
            }

            $contentNode = $c->filter('.view-content')->first();
            if (!$contentNode->count()) {
                $this->warn("  본문 없음: {$url}");
                return;
            }

            // 이미지를 감싼 원본 이미지 팝업 링크(highslide → 외부 사이트) 제거, 이미지만 남김
            $rawHtml = preg_replace('#<a\b[^>]*\bhighslide\b[^>]*>(.*?)</a>#is', '$1', $contentNode->html());
            $contentHtml = $this->fixVideoUrls($this->cleanContent($rawHtml), self::BASE_URL);

            // 텍스트 부족 게시글 스킵 (AdSense 저품질 콘텐츠 방지)
            $textLength = $this->extractTextLength($contentHtml);
            if ($textLength < self::MIN_TEXT_LENGTH) {
                $this->line("  텍스트 부족 스킵 ({$textLength}자 < " . self::MIN_TEXT_LENGTH . "자): {$url}");
                $this->incSkipped();
                return;
            }

            $cleanNode = new Crawler('<div>' . $contentHtml . '</div>');
            $images = $this->collectEtolandImages($cleanNode);
            $videos = $this->collectVideos($cleanNode, self::BASE_URL);

            // 글 헤더의 <span>조회 : <!-- -->2226</span> (React 주석 포함)
            $hits = preg_match('#<span>조회\s*:\s*(?:<!--\s*-->)?\s*([\d,]+)</span>#u', $html, $m)
                ? (int) str_replace(',', '', $m[1])
                : 0;

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

            // 이미지가 있었으나 하나도 저장 못한 경우 → 본문이 빈 글이 되므로 삭제
            if (!empty($images) && empty($downloaded)) {
                $this->warn("  이미지 다운로드 전체 실패 (source_id={$sourceId}), 게시물 삭제");
                $this->deletePost($post->post_id);
                return;
            }

            if (!empty($downloaded)) {
                $this->saveFileRecords($post->post_id, $downloaded);
            }
            $currentContent = $this->rewriteEtolandImages($contentHtml, $downloaded);

            // 비디오 다운로드 (CRAWL_SAVE_VIDEOS=true 일 때만 수집됨)
            $downloadedVideos = $this->downloadVideos($client, $videos, $post->post_id);
            if (!empty($downloadedVideos)) {
                $this->saveFileRecords($post->post_id, $downloadedVideos);
                $currentContent = $this->replaceVideoUrls($currentContent, $downloadedVideos);
            }

            if ($currentContent !== $contentHtml) {
                $post->update(['content' => $currentContent]);
            }

            $this->awardPostPoint($post);
            $this->incSaved();
            $this->info("  저장: [{$sourceId}] {$title} / 작성자: {$author} / 이미지: " . count($downloaded) . '/' . count($images) . '개 / 비디오: ' . count($downloadedVideos) . '/' . count($videos) . '개');

        } catch (\Exception $e) {
            $this->error("  게시글 에러 (source_id={$sourceId}): " . $e->getMessage());
        }
    }

    /** <h1> 제목, 없으면 og:title 에서 " - 유머 게시판" 꼬리 제거. */
    private function extractTitle(Crawler $c): string
    {
        $h1 = $c->filter('article h1')->first();
        if ($h1->count() && trim($h1->text('')) !== '') {
            return trim($h1->text(''));
        }

        $og = $c->filter('meta[property="og:title"]')->first();
        if (!$og->count()) return '';

        return trim(preg_replace('/\s+-\s+[^-]*게시판$/u', '', $og->attr('content') ?? ''));
    }

    /**
     * 본문 이미지 수집. 원본(data-src) 우선, 없으면 src.
     * 반환: [원본URL => ['resolved' => 절대URL, 'attr' => 'src']]
     */
    private function collectEtolandImages(Crawler $contentNode): array
    {
        $images = [];

        $contentNode->filter('img')->each(function (Crawler $img) use (&$images) {
            $src = $this->etolandImageKey($img->attr('data-src') ?? '', $img->attr('src') ?? '');
            if (!$src || isset($images[$src])) return;

            $images[$src] = ['resolved' => $src, 'attr' => 'src'];
        });

        return $images;
    }

    /** img 의 data-src / src 중 사용할 원본 URL (절대경로). data: URI 는 제외. */
    private function etolandImageKey(string $dataSrc, string $src): string
    {
        $url = ($dataSrc !== '' && !str_starts_with($dataSrc, 'data:')) ? $dataSrc : $src;
        if ($url === '' || str_starts_with($url, 'data:')) return '';
        if (str_starts_with($url, '//')) return 'https:' . $url;

        return str_starts_with($url, 'http') ? $url : self::BASE_URL . '/' . ltrim($url, '/');
    }

    /**
     * 본문 <img> 태그를 저장된 이미지 주소로 다시 작성.
     * 저장 못한 이미지는 이토랜드 CDN 이 외부 Referer 를 차단해 어차피 깨지므로 제거.
     */
    private function rewriteEtolandImages(string $content, array $downloaded): string
    {
        return preg_replace_callback('/<img\b[^>]*>/i', function (array $m) use ($downloaded): string {
            $tag = $m[0];
            $key = $this->etolandImageKey($this->tagAttr($tag, 'data-src'), $this->tagAttr($tag, 'src'));

            if ($key !== '' && isset($downloaded[$key])) {
                $url = $downloaded[$key]['public_url'] ?? $downloaded[$key]['file_url'];
                return '<img src="' . e($url) . '" alt="" loading="lazy">';
            }

            return '';
        }, $content) ?? $content;
    }

    /** HTML 태그 문자열에서 속성값 추출 (엔티티 디코딩). */
    private function tagAttr(string $tag, string $name): string
    {
        return preg_match('/\s' . preg_quote($name, '/') . '\s*=\s*(["\'])(.*?)\1/is', $tag, $m)
            ? html_entity_decode($m[2], ENT_QUOTES | ENT_HTML5, 'UTF-8')
            : '';
    }
}
