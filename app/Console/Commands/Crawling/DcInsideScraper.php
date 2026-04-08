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

class DcInsideScraper extends Command
{
    protected $signature   = 'crawl:dcinside';
    protected $description = 'DCInside 갤러리 게시글 크롤링 및 DB 저장';

    private const SOURCE   = 'DCINSIDE';
    private const BASE_URL = 'https://gall.dcinside.com';

    // 크롤링할 갤러리 목록: [갤러리ID => post_category]
    private const GALLERIES = [
        'programming' => 'dev',       // 프로그래밍 마이너 갤러리
        'stock_new1'  => 'stock',     // 주식 갤러리
        'baseball_new9' => 'baseball', // 야구 갤러리
        'soccer_new'  => 'soccer',    // 축구 갤러리
    ];

    // 갤러리별 목록 URL 베이스 (마이너갤/일반갤 구분)
    private const GALLERY_TYPE = [
        'programming'  => 'mgallery', // 마이너 갤러리
        'stock_new1'   => 'board',
        'baseball_new9'=> 'board',
        'soccer_new'   => 'board',
    ];

    // 수집할 페이지 수
    private const PAGES_PER_GALLERY = 2;

    public function handle(): void
    {
        $client = $this->makeClient();

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] DC인사이드 크롤링 시작');

        foreach (self::GALLERIES as $galleryId => $category) {
            $this->info("갤러리 크롤링: {$galleryId} → category: {$category}");
            $this->crawlGallery($client, $galleryId, $category);
        }

        $this->info('[' . now()->format('Y-m-d H:i:s') . '] 크롤링 완료');
    }

    private function crawlGallery(Client $client, string $galleryId, string $category): void
    {
        $gallType = self::GALLERY_TYPE[$galleryId] ?? 'board';

        for ($page = 1; $page <= self::PAGES_PER_GALLERY; $page++) {
            try {
                $listUrl = self::BASE_URL . "/{$gallType}/lists/?id={$galleryId}&page={$page}";
                $html = $this->fetchHtml($client, $listUrl);
                if (!$html) break;

                $crawler = new Crawler($html);

                // 목록에서 게시글 링크 수집
                $postLinks = [];
                $crawler->filter('tr.us-post, tr.ub-content')->each(function (Crawler $row) use (&$postLinks, $gallType, $galleryId) {
                    // 공지/광고 행 스킵
                    if ($row->attr('class') && str_contains($row->attr('class'), 'notice')) return;

                    $linkNode = $row->filter('td.gall_tit a')->first();
                    if (!$linkNode->count()) return;

                    $href = $linkNode->attr('href') ?? '';
                    if (!$href) return;

                    // 상대경로 보정
                    if (!str_starts_with($href, 'http')) {
                        $href = self::BASE_URL . $href;
                    }

                    // 게시글 번호 추출 (no=숫자)
                    if (preg_match('/[?&]no=(\d+)/', $href, $m)) {
                        $postNo = $m[1];
                        // 공지(notice) 스킵: no가 매우 작으면 공지일 가능성이 높음
                        $postLinks[$postNo] = $href;
                    }
                });

                if (empty($postLinks)) {
                    $this->warn("  게시글 링크를 찾지 못했습니다. (page {$page})");
                    break;
                }

                $this->info("  page {$page}: " . count($postLinks) . "건 발견");

                foreach ($postLinks as $postNo => $url) {
                    $this->crawlPost($client, $galleryId, $category, $postNo, $url);
                    sleep(rand(1, 2));
                }

            } catch (\Exception $e) {
                $this->error("  갤러리 에러 ({$galleryId} page {$page}): " . $e->getMessage());
            }
        }
    }

    private function crawlPost(Client $client, string $galleryId, string $category, string $postNo, string $url): void
    {
        // 중복 체크
        $sourceId = $galleryId . '_' . $postNo;
        if (Post::where('source', self::SOURCE)->where('source_id', $sourceId)->exists()) {
            $this->line("  스킵 (중복): {$sourceId}");
            return;
        }

        try {
            $html = $this->fetchHtml($client, $url);
            if (!$html) return;

            $c = new Crawler($html);

            // 제목
            $titleNode = $c->filter('.title_subject')->first();
            if (!$titleNode->count()) {
                $titleNode = $c->filter('h3.title span')->first();
            }
            $title = $titleNode->count() ? trim($titleNode->text()) : '(제목 없음)';

            // 작성자: 닉네임 우선, 없으면 유동닉
            $authorNode = $c->filter('.gall_writer .nickname')->first();
            if (!$authorNode->count()) {
                $authorNode = $c->filter('.gall_writer .ip')->first();
            }
            $author = $authorNode->count() ? trim(strip_tags($authorNode->html())) : '익명';

            // 본문 (.write_div)
            $contentNode = $c->filter('.write_div')->first();
            if (!$contentNode->count()) {
                $this->warn("  본문 없음: {$url}");
                return;
            }
            $contentHtml = $contentNode->html();

            // 이미지 URL 수집
            $imageMap   = []; // originalSrc => resolvedSrc
            $imgAttrMap = []; // originalSrc => 'src' | 'data-src'

            $contentNode->filter('img')->each(function (Crawler $img) use (&$imageMap, &$imgAttrMap) {
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

                $resolvedSrc = $originalSrc;
                if (!str_starts_with($originalSrc, 'http')) {
                    $resolvedSrc = self::BASE_URL . '/' . ltrim($originalSrc, '/');
                }

                $imageMap[$originalSrc]   = $resolvedSrc;
                $imgAttrMap[$originalSrc] = $attrName;
            });

            DB::transaction(function () use ($sourceId, $category, $title, $author, $contentHtml, $imageMap, $imgAttrMap) {
                // 작성자 유저 생성 or 조회
                $slug = Str::slug($author) ?: 'dc-user';
                $user = User::firstOrCreate(
                    ['name' => $author],
                    [
                        'email'    => $slug . '_' . Str::random(6) . '@dummy.dcinside.com',
                        'password' => bcrypt(Str::random(16)),
                    ]
                );

                // 게시글 저장
                $post = Post::create([
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

                // 이미지 다운로드 → File 저장 → content URL 교체
                $finalContent   = $contentHtml;
                $downloadedCount = 0;

                foreach ($imageMap as $originalSrc => $resolvedSrc) {
                    $fileInfo = $this->downloadImage($resolvedSrc, $post->post_id);
                    if (!$fileInfo) continue;

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

                if ($finalContent !== $contentHtml) {
                    $post->update(['content' => $finalContent]);
                }

                $this->info("  저장: [{$sourceId}] {$title} / 작성자: {$author} / 이미지: {$downloadedCount}/" . count($imageMap) . "개");
            });

        } catch (\Exception $e) {
            $this->error("  게시글 에러 (source_id={$sourceId}): " . $e->getMessage());
        }
    }

    private function downloadImage(string $imgUrl, int $postId): ?array
    {
        try {
            $client   = $this->makeClient();
            $response = $client->get($imgUrl, ['timeout' => 20]);

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

    private function makeClient(): Client
    {
        return new Client([
            'timeout'         => 15,
            'connect_timeout' => 5,
            'allow_redirects' => true,
            'headers'         => [
                'User-Agent'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept'          => 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language' => 'ko-KR,ko;q=0.9',
                'Referer'         => self::BASE_URL,
            ],
        ]);
    }
}
