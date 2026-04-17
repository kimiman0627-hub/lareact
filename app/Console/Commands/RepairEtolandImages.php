<?php

namespace App\Console\Commands;

use App\Console\Commands\Crawling\BaseScraper;
use App\Models\File\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * 이토랜드 기존 게시물 중 이미지 문제 게시물 복구.
 *
 * [Type A] 파일은 저장됐으나 content에 loading_img src가 중복 잔존
 *   → loading placeholder src 제거 후 저장된 URL만 남김
 *
 * [Type B] 실제 다운로드 실패 (data-src에 etoland URL만 있음)
 *   → data-src URL로 재다운로드 → NCP 저장
 *   → 다운로드 실패 시 게시물 + 관련 데이터 전체 삭제
 */
class RepairEtolandImages extends BaseScraper
{
    protected $signature = 'repair:etoland-images
                            {--dry-run : 실제 변경 없이 대상만 출력}
                            {--chunk=50 : 한 번에 처리할 게시물 수}
                            {--post-id= : 특정 게시물 ID만 처리}';

    protected $description = '이토랜드 이미지 문제 게시물 복구 (TypeA: double-src 정리 / TypeB: 재다운로드, 실패 시 삭제)';

    private int $fixedA  = 0;
    private int $fixedB  = 0;
    private int $deleted = 0;
    private int $errors  = 0;

    public function handle(): int
    {
        $dryRun    = $this->option('dry-run');
        $chunkSize = (int) $this->option('chunk');
        $onlyId    = $this->option('post-id');

        if ($dryRun) {
            $this->warn('[DRY-RUN] 실제 변경을 수행하지 않습니다.');
        }

        $client = $this->makeClient([
            'headers' => [
                'Referer' => 'https://etoland.co.kr/',
                'Accept'  => 'image/avif,image/webp,image/apng,*/*;q=0.8',
            ],
        ]);

        $query = DB::table('posts')
            ->where('source', 'ETOLAND')
            ->where('content', 'like', '%loading_img%');

        if ($onlyId) {
            $query->where('post_id', (int) $onlyId);
        }

        $total = $query->count();
        $this->info("복구 대상: {$total}개 게시물");

        if ($total === 0) {
            $this->info('대상 없음. 종료합니다.');
            return 0;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $query->orderBy('post_id')->chunk($chunkSize, function ($posts) use ($client, $dryRun, $bar) {
            foreach ($posts as $post) {
                $this->repairPost($client, $post, $dryRun);
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->table(
            ['TypeA 수정(double-src)', 'TypeB 수정(재다운로드)', '삭제(실패)', '오류'],
            [[$this->fixedA, $this->fixedB, $this->deleted, $this->errors]],
        );

        return 0;
    }

    private function repairPost($client, object $post, bool $dryRun): void
    {
        $content      = $post->content;
        $hasSavedFile = str_contains($content, '/storage/uploads/') || str_contains($content, '/file/uploads/');

        // ─── Type A: 파일은 있으나 loading_img src가 중복 잔존 ───────────────
        if ($hasSavedFile) {
            if ($dryRun) {
                $this->line("\n  [TypeA DRY] post_id={$post->post_id} loading src 제거 예정");
                return;
            }

            $fixed = $this->removeLoadingPlaceholderSrc($content);
            if ($fixed !== $content) {
                DB::table('posts')->where('post_id', $post->post_id)->update([
                    'content'    => $fixed,
                    'updated_at' => now(),
                ]);
            }
            $this->fixedA++;
            return;
        }

        // ─── Type B: 재다운로드 필요 ─────────────────────────────────────────
        preg_match_all(
            '/data-src=["\']([^"\']*etoland\.co\.kr[^"\']+)["\']/i',
            $content,
            $matches
        );
        $dataSrcUrls = array_unique(array_filter($matches[1] ?? []));

        if (empty($dataSrcUrls)) {
            // 복구 방법 없음 → 삭제
            $this->line("\n  [삭제] post_id={$post->post_id} 복구 불가(data-src 없음)");
            if (!$dryRun) {
                $this->deletePost((int) $post->post_id);
            }
            $this->deleted++;
            return;
        }

        if ($dryRun) {
            foreach ($dataSrcUrls as $url) {
                $this->line("\n  [TypeB DRY] post_id={$post->post_id} → {$url}");
            }
            return;
        }

        $dir        = 'uploads/post/' . $post->post_id;
        $downloaded = [];

        foreach ($dataSrcUrls as $dataSrcUrl) {
            try {
                $fileInfo = $this->downloadImage($client, $dataSrcUrl, $dir);
                if (!$fileInfo) {
                    $this->line("\n  [삭제] post_id={$post->post_id} 다운로드 실패: {$dataSrcUrl}");
                    $this->deletePost((int) $post->post_id);
                    $this->deleted++;
                    return;
                }
                $downloaded[$dataSrcUrl] = $fileInfo;
            } catch (\Throwable $e) {
                $this->line("\n  [삭제] post_id={$post->post_id} 오류({$e->getMessage()})");
                $this->deletePost((int) $post->post_id);
                $this->deleted++;
                return;
            }
        }

        // 파일 레코드 저장
        foreach ($downloaded as $fileInfo) {
            File::create([
                'storage'       => $fileInfo['storage'] ?? 'NCP',
                'file_kind'     => 'POST',
                'ref_id'        => $post->post_id,
                'original_name' => $fileInfo['original_name'],
                'stored_name'   => $fileInfo['stored_name'],
                'file_path'     => $fileInfo['file_path'],
                'file_url'      => $fileInfo['file_url'],
                'mime_type'     => $fileInfo['mime_type'],
                'file_size'     => $fileInfo['file_size'],
            ]);
        }

        // content URL 교체 (loading src → 서버 URL, data-src/data-file-src 제거)
        foreach ($downloaded as $dataSrcUrl => $fileInfo) {
            $serverUrl = $fileInfo['public_url'] ?? $fileInfo['file_url'];
            $escaped   = preg_quote($dataSrcUrl, '/');

            $content = preg_replace_callback(
                '/<img\b([^>]*)\bdata-src=["\']' . $escaped . '["\']([^>]*)>/i',
                fn($m) => $this->buildCleanImgTag($m[1] . $m[2], $serverUrl),
                $content
            ) ?? $content;
        }

        DB::table('posts')->where('post_id', $post->post_id)->update([
            'content'    => $content,
            'updated_at' => now(),
        ]);

        $this->fixedB++;
    }

    /**
     * Type A: img 태그에서 loading placeholder src 속성만 제거.
     * 저장된 /storage/... 또는 /file/... src는 유지.
     */
    private function removeLoadingPlaceholderSrc(string $content): string
    {
        return preg_replace_callback(
            '/<img\b([^>]*)>/i',
            function (array $m): string {
                $attrs = $m[1];
                // loading_img src가 없으면 그대로 반환
                if (!preg_match('/\bsrc=["\'][^"\']*loading_img[^"\']*["\']/i', $attrs)) {
                    return $m[0];
                }
                // loading_img src만 제거 (저장된 src는 유지)
                $attrs = preg_replace('/\s*\bsrc=["\'][^"\']*loading_img[^"\']*["\']/', '', $attrs);
                // data-file-src도 함께 제거 (이미 반영 완료)
                $attrs = preg_replace('/\s*\bdata-file-src=["\'][^"\']*["\']/', '', $attrs);
                return '<img ' . trim(preg_replace('/\s+/', ' ', $attrs)) . '>';
            },
            $content
        ) ?? $content;
    }

    /**
     * Type B: img 속성에서 loading src 교체 + data-src/data-file-src 제거.
     */
    private function buildCleanImgTag(string $attrs, string $serverUrl): string
    {
        if (preg_match('/\bsrc=["\'][^"\']*loading[^"\']*["\']/i', $attrs)) {
            $attrs = preg_replace(
                '/\bsrc=["\'][^"\']*loading[^"\']*["\']/i',
                'src="' . $serverUrl . '"',
                $attrs
            );
        } else {
            $attrs = 'src="' . $serverUrl . '" ' . $attrs;
        }
        $attrs = preg_replace('/\s*\bdata-src=["\'][^"\']*["\']/', '', $attrs);
        $attrs = preg_replace('/\s*\bdata-file-src=["\'][^"\']*["\']/', '', $attrs);
        return '<img ' . trim(preg_replace('/\s+/', ' ', $attrs)) . '>';
    }

}
