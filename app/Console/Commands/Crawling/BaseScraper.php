<?php

namespace App\Console\Commands\Crawling;

use Illuminate\Console\Command;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\DomCrawler\Crawler;
use App\Models\User\User;
use App\Models\File\File;
use App\Models\Board\Post;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

abstract class BaseScraper extends Command
{
    /**
     * 공통 Guzzle 클라이언트 생성. 사이트별 옵션은 $extra로 오버라이드.
     */
    protected function makeClient(array $extra = []): Client
    {
        return new Client(array_merge_recursive([
            'timeout'         => 15,
            'connect_timeout' => 5,
            'headers'         => [
                'User-Agent'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language' => 'ko-KR,ko;q=0.9',
            ],
        ], $extra));
    }

    /**
     * HTML 페이지 가져오기. $convertEncoding=true 시 EUC-KR → UTF-8 자동 변환.
     */
    protected function fetchHtml(Client $client, string $url, bool $convertEncoding = false): ?string
    {
        try {
            $response = $client->get($url);
            $body     = (string) $response->getBody();

            if ($convertEncoding) {
                $contentType = $response->getHeaderLine('Content-Type');
                $isEucKr = str_contains(strtolower($contentType), 'euc-kr')
                        || str_contains(strtolower($body), 'charset=euc-kr')
                        || str_contains(strtolower($body), 'charset="euc-kr"');

                if ($isEucKr) {
                    $converted = mb_convert_encoding($body, 'UTF-8', 'EUC-KR');
                    if ($converted !== false) {
                        $body = preg_replace('/charset=["\']?euc-kr["\']?/i', 'charset=utf-8', $converted);
                    }
                }
            }

            return $body;
        } catch (RequestException $e) {
            $this->error("  HTTP 에러 ({$url}): " . $e->getMessage());
            return null;
        }
    }

    /**
     * 컨텐츠 노드에서 이미지 목록 수집.
     * 반환: [originalSrc => ['resolved' => absoluteUrl, 'attr' => 'src'|'data-src']]
     */
    protected function collectImages(Crawler $contentNode, string $baseUrl): array
    {
        $images = [];

        $contentNode->filter('img')->each(function (Crawler $img) use ($baseUrl, &$images) {
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

            if (isset($images[$originalSrc])) return;

            $resolvedSrc = str_starts_with($originalSrc, 'http')
                ? $originalSrc
                : $baseUrl . '/' . ltrim($originalSrc, '/');

            $images[$originalSrc] = ['resolved' => $resolvedSrc, 'attr' => $attrName];
        });

        return $images;
    }

    /**
     * 이미지 배치 다운로드 (트랜잭션 밖에서 호출).
     * 반환: [originalSrc => fileInfo 배열]
     */
    protected function downloadImages(Client $client, array $images, int $postId): array
    {
        if (empty($images)) return [];

        $dir = 'uploads/post/' . $postId;
        Storage::disk('public')->makeDirectory($dir);

        $results = [];
        foreach ($images as $originalSrc => $info) {
            $fileInfo = $this->downloadImage($client, $info['resolved'], $postId, $dir);
            if ($fileInfo) {
                $results[$originalSrc] = $fileInfo;
            }
        }

        return $results;
    }

    /**
     * 단일 이미지 다운로드. $dir은 호출 전 생성되어 있어야 함.
     */
    protected function downloadImage(Client $client, string $imgUrl, int $postId, string $dir): ?array
    {
        try {
            $response     = $client->get($imgUrl, ['timeout' => 20]);
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
            $savePath   = $dir . '/' . $storedName;
            $contents   = (string) $response->getBody();

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

    /**
     * content HTML에서 script, style, noscript 태그 제거.
     */
    protected function cleanContent(string $html): string
    {
        return preg_replace(
            ['/<script\b[^>]*>.*?<\/script>/is', '/<style\b[^>]*>.*?<\/style>/is', '/<noscript\b[^>]*>.*?<\/noscript>/is'],
            '',
            $html
        );
    }

    /**
     * content HTML 내 <video>, <source> 태그의 상대 경로 src를 절대 URL로 변환.
     */
    protected function fixVideoUrls(string $content, string $baseUrl): string
    {
        return preg_replace_callback(
            '/<(video|source)\b[^>]*>/i',
            function (array $tag) use ($baseUrl): string {
                return preg_replace_callback(
                    '/\bsrc=["\']([^"\']+)["\']/i',
                    function (array $m) use ($baseUrl): string {
                        $src = $m[1];
                        if (!str_starts_with($src, 'http')) {
                            $src = $baseUrl . '/' . ltrim($src, '/');
                        }
                        return 'src="' . $src . '"';
                    },
                    $tag[0]
                );
            },
            $content
        );
    }

    /**
     * 다운로드 완료된 이미지로 content HTML 내 URL 교체.
     * $downloaded: [originalSrc => fileInfo]
     */
    protected function replaceImageUrls(string $content, array $images, array $downloaded): string
    {
        foreach ($downloaded as $originalSrc => $fileInfo) {
            $serverUrl = $fileInfo['file_url'];
            $attrName  = $images[$originalSrc]['attr'] ?? 'src';

            if ($attrName === 'data-src') {
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

    /**
     * File 레코드 일괄 저장.
     */
    protected function saveFileRecords(int $postId, array $downloaded): void
    {
        foreach ($downloaded as $fileInfo) {
            File::create([
                'file_kind'     => 'POST',
                'ref_id'        => $postId,
                'original_name' => $fileInfo['original_name'],
                'stored_name'   => $fileInfo['stored_name'],
                'file_path'     => $fileInfo['file_path'],
                'file_url'      => $fileInfo['file_url'],
                'mime_type'     => $fileInfo['mime_type'],
                'file_size'     => $fileInfo['file_size'],
            ]);
        }
    }

    /**
     * 크롤링 출처 회원 생성 또는 조회.
     */
    protected function firstOrCreateUser(string $name, string $email): User
    {
        return User::firstOrCreate(
            ['name' => $name],
            [
                'email'     => $email,
                'password'  => bcrypt(Str::random(16)),
                'user_role' => 'TEST',
            ]
        );
    }

    /**
     * 이미 저장된 source_id를 배치로 조회해 중복 체크용 맵 반환.
     * 반환: [sourceId => true]
     */
    protected function fetchExistingSourceIds(string $source, array $sourceIds): array
    {
        if (empty($sourceIds)) return [];

        return Post::where('source', $source)
            ->whereIn('source_id', $sourceIds)
            ->pluck('source_id')
            ->flip()
            ->all();
    }
}
