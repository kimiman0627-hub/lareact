<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * 크롤링 중 403/redirect 에러 HTML이 이미지로 저장된 파일을 정리합니다.
 * - 파일 내용이 HTML인 DB 레코드 탐지 → 파일 삭제 + DB 레코드 삭제
 */
class CleanFakeImages extends Command
{
    protected $signature   = 'crawl:clean-fake-images {--dry-run : 실제 삭제 없이 대상만 출력}';
    protected $description = '크롤링 중 저장된 HTML 응답(가짜 이미지) 파일을 정리합니다';

    public function handle(): void
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('[DRY-RUN 모드] 실제 삭제는 수행하지 않습니다.');
        }

        // storage/app/public/uploads/post/ 하위의 모든 이미지 파일 순회
        $baseDisk = Storage::disk('public');
        $allFiles = $baseDisk->allFiles('uploads/post');

        $deleted  = 0;
        $skipped  = 0;
        $errors   = 0;

        $this->info("총 " . count($allFiles) . "개 파일 검사 중...");

        $bar = $this->output->createProgressBar(count($allFiles));
        $bar->start();

        foreach ($allFiles as $relativePath) {
            $bar->advance();

            // 이미지 확장자만 검사
            $ext = strtolower(pathinfo($relativePath, PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                continue;
            }

            $fullPath = $baseDisk->path($relativePath);

            // 파일 크기 사전 필터 (3KB 이상은 진짜 이미지일 가능성 높음)
            $size = filesize($fullPath);
            if ($size >= 3072) {
                $skipped++;
                continue;
            }

            // 내용 확인 — HTML 시그니처 감지
            $head = file_get_contents($fullPath, false, null, 0, 256);
            if ($head === false) {
                $errors++;
                continue;
            }

            $isHtml = str_contains(strtolower($head), '<html')
                   || str_contains(strtolower($head), '<!doctype')
                   || str_contains(strtolower($head), 'forbidden')
                   || str_contains(strtolower($head), 'error');

            if (!$isHtml) {
                $skipped++;
                continue;
            }

            // DB에서 stored_name으로 레코드 조회
            $storedName = basename($relativePath);
            $fileRecord = DB::table('files')->where('stored_name', $storedName)->first();

            if ($dryRun) {
                $this->newLine();
                $this->line("  [삭제 예정] {$relativePath} ({$size}B)" .
                    ($fileRecord ? " → files.id={$fileRecord->file_id}" : " → DB 레코드 없음"));
                $deleted++;
                continue;
            }

            // 파일 삭제
            try {
                $baseDisk->delete($relativePath);
            } catch (\Exception $e) {
                $this->newLine();
                $this->warn("  파일 삭제 실패: {$relativePath} — " . $e->getMessage());
                $errors++;
                continue;
            }

            // DB 레코드 삭제
            if ($fileRecord) {
                DB::table('files')->where('file_id', $fileRecord->file_id)->delete();
            }

            $deleted++;
        }

        $bar->finish();
        $this->newLine(2);

        $action = $dryRun ? '삭제 예정' : '삭제 완료';
        $this->info("정리 {$action}: {$deleted}개 / 정상 스킵: {$skipped}개 / 오류: {$errors}개");

        if (!$dryRun && $deleted > 0) {
            $this->info('빈 디렉토리 정리 중...');
            $this->removeEmptyDirs($baseDisk->path('uploads/post'));
            $this->info('완료.');
        }
    }

    private function removeEmptyDirs(string $dir): void
    {
        if (!is_dir($dir)) return;

        foreach (scandir($dir) as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            $path = $dir . '/' . $entry;
            if (is_dir($path)) {
                $this->removeEmptyDirs($path);
                if (count(scandir($path)) === 2) { // . 과 .. 만 남은 경우
                    rmdir($path);
                }
            }
        }
    }
}
