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

            // 본문 내 불필요한 UI 요소 제거
            $rawHtml = $contentNode->html();
            $rawHtml = preg_replace('/<div\b[^>]*\bview_document_address\b[^>]*>.*?<\/div>/is', '', $rawHtml);

            $contentHtml = $this->fixVideoUrls($this->cleanContent($rawHtml), self::BASE_URL);

            // 텍스트 부족 게시글 스킵 (AdSense 저품질 콘텐츠 방지)
            $textLength = $this->extractTextLength($contentHtml);
            if ($textLength < self::MIN_TEXT_LENGTH) {
                $this->line("  텍스트 부족 스킵 ({$textLength}자 < " . self::MIN_TEXT_LENGTH . "자): {$url}");
                $this->incSkipped();
                return;
            }

            // view_document_address가 제거된 HTML로 새 Crawler 생성 후 이미지/비디오 수집
            $cleanNode = new Crawler($contentHtml);
            $images = $this->collectImagesEtoland($cleanNode, $boardName);
            $videos = $this->collectVideos($cleanNode, self::BASE_URL);

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
            $currentContent = $contentHtml;

            if (!empty($downloaded)) {
                $this->saveFileRecords($post->post_id, $downloaded);
                $currentContent = $this->replaceEtolandImageUrls($currentContent, $images, $downloaded);
            }

            // 다운로드 실패한 이미지 정리:
            // loading_img placeholder src → data-src(이토랜드 원본 URL) fallback으로 교체
            // data-src도 없으면 img 태그 제거
            $currentContent = $this->cleanupUndownloadedImages($currentContent);

            // 비디오 다운로드 (트랜잭션 밖)
            $downloadedVideos = $this->downloadVideos($client, $videos, $post->post_id);

            if (!empty($downloadedVideos)) {
                $this->saveFileRecords($post->post_id, $downloadedVideos);
                $currentContent = $this->replaceVideoUrls($currentContent, $videos, $downloadedVideos);
            }

            if ($currentContent !== $contentHtml) {
                $post->update(['content' => $currentContent]);
            }

            $this->incSaved();
            $this->info("  저장: [{$sourceId}] {$title} / 작성자: {$author} / 이미지: " . count($downloaded) . '/' . count($images) . '개 / 비디오: ' . count($downloadedVideos) . '/' . count($videos) . '개');

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

            // 우선순위: data-src > data-file-src > src
            //
            // data-file-src 단독 사용 시 구성하는 URL(/data/file/{board}/{token})은
            // 실제 파일 경로(/data/files/{board}/{year}/{month}/{day}/minify/{token}.jpg)와
            // 달라 693바이트 오류 응답을 반환하므로, full URL인 data-src를 먼저 사용한다.
            if ($dataSrc && !str_starts_with($dataSrc, 'data:') && !str_contains($dataSrc, 'loading_img')) {
                // 리사이즈 프록시 URL에서 원본 경로 복원
                if (preg_match('/[?&]src=(.+)$/', $dataSrc, $m)) {
                    $dataSrc = urldecode($m[1]);
                }
                $resolved = str_starts_with($dataSrc, 'http')
                    ? $dataSrc
                    : self::BASE_URL . '/' . ltrim($dataSrc, '/');

                if (!isset($images[$dataSrc])) {
                    $images[$dataSrc] = ['resolved' => $resolved, 'attr' => 'data-src'];
                }
                return;
            }

            // data-src 없을 때만 data-file-src 폴백 (토큰 → CDN URL 구성)
            if ($dataFileSrc && !str_starts_with($dataFileSrc, 'data:')) {
                if (isset($images[$dataFileSrc])) return;
                $cdnUrl = self::BASE_URL . '/data/file/' . $boardName . '/' . $dataFileSrc;
                $images[$dataFileSrc] = ['resolved' => $cdnUrl, 'attr' => 'data-file-src'];
                return;
            }

            // 일반 src (로딩 플레이스홀더 제외)
            if ($src && !str_starts_with($src, 'data:') && !str_contains($src, 'loading_img')) {
                // 리사이즈 프록시 URL에서 원본 경로 복원
                if (preg_match('/[?&]src=(.+)$/', $src, $m)) {
                    $src = urldecode($m[1]);
                }
                if (isset($images[$src])) return;
                $resolved = str_starts_with($src, 'http')
                    ? $src
                    : self::BASE_URL . '/' . ltrim($src, '/');
                $images[$src] = ['resolved' => $resolved, 'attr' => 'src'];
            }
        });

        return $images;
    }

    /**
     * 다운로드 실패한 이미지 정리.
     * loading_img placeholder src가 남아 있는 img 태그에서:
     *  - data-src 있음 → src를 이토랜드 원본 URL로 교체, data-src/data-file-src 제거
     *  - data-src 없음 → img 태그 자체 제거 (깨진 이미지 방지)
     */
    private function cleanupUndownloadedImages(string $content): string
    {
        return preg_replace_callback(
            '/<img\b([^>]*)>/i',
            function (array $m): string {
                $attrs = $m[1];

                // loading_img src가 없으면 건드리지 않음
                if (!preg_match('/\bsrc=["\'][^"\']*loading_img[^"\']*["\']/i', $attrs)) {
                    return $m[0];
                }

                // data-src에서 fallback URL 추출 (상대경로면 절대 URL로 보완)
                $fallbackSrc = '';
                if (preg_match('/\bdata-src=["\']([^"\']+)["\']/i', $attrs, $ds)) {
                    $fallbackSrc = $ds[1];
                    if (!str_starts_with($fallbackSrc, 'http')) {
                        $fallbackSrc = self::BASE_URL . '/' . ltrim($fallbackSrc, '/');
                    }
                }

                if (!$fallbackSrc) {
                    // fallback 없음 → 태그 제거
                    return '';
                }

                // loading_img src → 이토랜드 원본 URL로 교체
                $attrs = preg_replace('/\bsrc=["\'][^"\']*loading_img[^"\']*["\']/', 'src="' . $fallbackSrc . '"', $attrs);
                // data-src, data-file-src 제거 (처리 완료)
                $attrs = preg_replace('/\s*\bdata-src=["\'][^"\']*["\']/', '', $attrs);
                $attrs = preg_replace('/\s*\bdata-file-src=["\'][^"\']*["\']/', '', $attrs);

                return '<img ' . trim(preg_replace('/\s+/', ' ', $attrs)) . '>';
            },
            $content
        ) ?? $content;
    }

    /**
     * 이토랜드 전용 이미지 URL 교체.
     * data-file-src 방식: 플레이스홀더 src를 서버 URL로 교체하고 data-file-src 속성 제거.
     * 그 외는 BaseScraper::replaceImageUrls 와 동일.
     */
    private function replaceEtolandImageUrls(string $content, array $images, array $downloaded): string
    {
        foreach ($downloaded as $originalSrc => $fileInfo) {
            $serverUrl = $fileInfo['public_url'] ?? $fileInfo['file_url'];
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
                // data-src가 있는 img 태그는 src="/img/loading_img.jpg" 도 함께 있으므로
                // regex callback으로 loading src 교체 + data-src/data-file-src 속성 제거
                $escaped = preg_quote($originalSrc, '/');
                $replaced = preg_replace_callback(
                    '/<img\b([^>]*)\bdata-src=["\']' . $escaped . '["\']([^>]*)>/i',
                    function (array $m) use ($serverUrl): string {
                        $attrs = $m[1] . $m[2];
                        // 로딩 플레이스홀더 src 교체
                        if (preg_match('/\bsrc=["\'][^"\']*loading[^"\']*["\']/i', $attrs)) {
                            $attrs = preg_replace(
                                '/\bsrc=["\'][^"\']*loading[^"\']*["\']/i',
                                'src="' . $serverUrl . '"',
                                $attrs
                            );
                        } else {
                            $attrs = 'src="' . $serverUrl . '" ' . $attrs;
                        }
                        // data-src, data-file-src 속성 제거
                        $attrs = preg_replace('/\s*\bdata-src=["\'][^"\']*["\']/', '', $attrs);
                        $attrs = preg_replace('/\s*\bdata-file-src=["\'][^"\']*["\']/', '', $attrs);
                        return '<img ' . trim(preg_replace('/\s+/', ' ', $attrs)) . '>';
                    },
                    $content
                );
                if ($replaced !== null) {
                    $content = $replaced;
                }
            } else {
                $content = str_replace($originalSrc, $serverUrl, $content);
            }
        }

        return $content;
    }
}
