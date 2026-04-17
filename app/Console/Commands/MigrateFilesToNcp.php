<?php

namespace App\Console\Commands;

use App\Console\Commands\Crawling\BaseScraper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * 로컬에 저장된 게시물 첨부파일을 NCP Object Storage로 이전.
 *
 * - --source 미지정 시 모든 소스(직접 작성 포함) 처리
 * - --source=DOGDRIP 처럼 특정 소스만 지정 가능
 * - 로컬 파일이 하나라도 누락된 게시물 → 게시물 + 관련 데이터 전체 삭제
 * - NCP 업로드 중 오류 발생한 게시물 → 게시물 + 관련 데이터 전체 삭제
 * - 모든 파일이 존재하는 게시물 → NCP 업로드 후 DB 및 content HTML URL 갱신
 */
class MigrateFilesToNcp extends BaseScraper
{
    protected $signature = 'migrate:files-to-ncp
                            {--source= : 특정 소스만 처리 (예: DOGDRIP, DCINSIDE). 미지정 시 전체}
                            {--dry-run : 실제 변경 없이 결과만 출력}
                            {--chunk=100 : 한 번에 처리할 게시물 수}';

    protected $description = '로컬 게시물 파일을 NCP Object Storage로 이전합니다 (소스 지정 가능)';

    private int $migrated = 0;
    private int $deleted  = 0;
    private int $skipped  = 0;
    private int $errors   = 0;

    public function handle(): int
    {
        $dryRun    = $this->option('dry-run');
        $source    = $this->option('source') ? strtoupper($this->option('source')) : null;
        $chunkSize = (int) $this->option('chunk');

        if ($dryRun) {
            $this->warn('[DRY-RUN] 실제 변경을 수행하지 않습니다.');
        }

        $label = $source ?? '전체 소스';
        $this->info("대상 소스: {$label}");

        $query = DB::table('posts as p')
            ->join('files as f', fn($j) => $j->on('f.ref_id', '=', 'p.post_id')
                ->where('f.file_kind', 'POST')
                ->where('f.storage', 'LOCAL'))
            ->distinct();

        if ($source !== null) {
            $query->where('p.source', $source);
        }

        $postIds = $query->pluck('p.post_id')->toArray();

        $total = count($postIds);
        $this->info("마이그레이션 대상: {$total}개 게시물");

        if ($total === 0) {
            $this->info('대상 없음. 종료합니다.');
            return 0;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        foreach (array_chunk($postIds, $chunkSize) as $chunk) {
            foreach ($chunk as $postId) {
                $this->processPost((int) $postId, $dryRun);
                $bar->advance();
            }
        }

        $bar->finish();
        $this->newLine(2);

        $this->table(
            ['이전 완료', '파일 없어 삭제', '건너뜀(이미 NCP 등)', '오류'],
            [[$this->migrated, $this->deleted, $this->skipped, $this->errors]],
        );

        return 0;
    }

    private function processPost(int $postId, bool $dryRun): void
    {
        $files = DB::table('files')
            ->where('file_kind', 'POST')
            ->where('ref_id', $postId)
            ->get();

        if ($files->isEmpty()) {
            $this->skipped++;
            return;
        }

        // 로컬 파일만 추출 (NCP로 이미 이전된 것 제외)
        $localFiles = $files->where('storage', 'LOCAL')->values();
        if ($localFiles->isEmpty()) {
            $this->skipped++;
            return;
        }

        // 로컬 파일 존재 여부 확인 — 하나라도 없으면 게시물 삭제
        foreach ($localFiles as $file) {
            $relPath = $this->toRelPath($file->file_url);
            if (!Storage::disk('public')->exists($relPath)) {
                $this->line("\n  [삭제] post_id={$postId} 파일 누락: {$file->file_url}");
                if (!$dryRun) {
                    $this->deletePost($postId);
                }
                $this->deleted++;
                return;
            }
        }

        // 모든 파일 존재 → NCP로 업로드
        $post = DB::table('posts')->where('post_id', $postId)->first(['post_id', 'content']);
        if (!$post) {
            $this->errors++;
            return;
        }

        $content = $post->content;

        try {
            foreach ($localFiles as $file) {
                $relPath  = $this->toRelPath($file->file_url);
                $contents = Storage::disk('public')->get($relPath);

                if ($contents === null) {
                    throw new \RuntimeException("로컬 파일 읽기 실패: {$relPath}");
                }

                if (!$dryRun) {
                    Storage::disk('ncp')->put($relPath, $contents);
                    Storage::disk('public')->delete($relPath);

                    DB::table('files')->where('file_id', $file->file_id)->update([
                        'file_url'   => '/file/' . $relPath,
                        'file_path'  => $relPath,
                        'storage'    => 'NCP',
                        'updated_at' => now(),
                    ]);
                }

                $content = $this->replaceContentUrl($content, $file->file_url, '/file/' . $relPath);
            }

            if (!$dryRun && $content !== $post->content) {
                DB::table('posts')->where('post_id', $postId)->update([
                    'content'    => $content,
                    'updated_at' => now(),
                ]);
            }

            $this->migrated++;
        } catch (\Throwable $e) {
            $this->line("\n  [오류→삭제] post_id={$postId}: {$e->getMessage()}");
            if (!$dryRun) {
                $this->deletePost($postId);
            }
            $this->deleted++;
        }
    }

    /**
     * file_url → 스토리지 상대 경로 정규화.
     * /storage/uploads/...           → uploads/...
     * /file/uploads/...              → uploads/...
     * http://host/storage/uploads/... → uploads/...
     */
    private function toRelPath(string $fileUrl): string
    {
        $path = preg_replace('#^https?://[^/]+#', '', $fileUrl);
        return ltrim(preg_replace('#^/(storage|file)/#', '', $path), '/');
    }

    /**
     * content HTML 내 이전 파일 URL을 새 NCP URL로 교체.
     * 상대(/storage/...) 및 절대(http://...) 형태 모두 처리.
     */
    private function replaceContentUrl(string $content, string $oldUrl, string $newUrl): string
    {
        $relOld  = $this->toRelPath($oldUrl);
        $escaped = preg_quote('/storage/' . $relOld, '#');

        $content = str_replace('/storage/' . $relOld, $newUrl, $content);
        $content = preg_replace('#https?://[^/]+' . $escaped . '#', $newUrl, $content);

        return $content;
    }
}
