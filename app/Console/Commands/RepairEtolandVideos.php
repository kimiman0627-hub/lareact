<?php

namespace App\Console\Commands;

use App\Console\Commands\Crawling\BaseScraper;
use App\Models\File\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * 이토랜드 기존 게시물 중 동영상 문제 복구.
 *
 * [Type A] lazy-hidden 클래스로 비디오가 숨겨진 경우
 *   → <video> 태그에서 lazy-hidden 클래스 제거
 *
 * [Type B] 상대 경로 src (/data/files/...) — data-src에 실제 이토랜드 URL 존재
 *   → data-src URL로 재다운로드 → NCP 저장
 *   → 다운로드 실패 시 게시물 + 관련 데이터 전체 삭제
 *
 * [Type C] 이토랜드 외부 URL (https://etoland.co.kr/data/files/...) — --download-external 옵션 시 처리
 *   → 재다운로드 → NCP 저장
 *   → 다운로드 실패 시 게시물 삭제
 */
class RepairEtolandVideos extends BaseScraper
{
    protected $signature = 'repair:etoland-videos
                            {--dry-run : 실제 변경 없이 대상만 출력}
                            {--chunk=30 : 한 번에 처리할 게시물 수}
                            {--post-id= : 특정 게시물 ID만 처리}
                            {--download-external : 이토랜드 외부 URL 동영상도 재다운로드 (실패 시 삭제)}';

    protected $description = '이토랜드 동영상 문제 게시물 복구 (TypeA: lazy-hidden 제거 / TypeB: 상대URL 재다운로드 / TypeC: 외부URL 재다운로드)';

    private int $fixedA  = 0;
    private int $fixedB  = 0;
    private int $fixedC  = 0;
    private int $deleted = 0;
    private int $errors  = 0;

    public function handle(): int
    {
        $dryRun          = $this->option('dry-run');
        $chunkSize       = (int) $this->option('chunk');
        $onlyId          = $this->option('post-id');
        $downloadExternal = $this->option('download-external');

        if ($dryRun) {
            $this->warn('[DRY-RUN] 실제 변경을 수행하지 않습니다.');
        }

        $client = $this->makeClient([
            'headers' => [
                'Referer' => 'https://etoland.co.kr/',
                'Accept'  => 'video/mp4,video/webm,*/*;q=0.8',
            ],
        ]);

        $query = DB::table('posts')
            ->where('source', 'ETOLAND')
            ->where(function ($q) use ($downloadExternal) {
                $q->where('content', 'like', '%lazy-hidden%')
                  ->orWhere('content', 'like', '%src="/data/files/%')
                  ->orWhere('content', 'like', "%src='/data/files/%");

                if ($downloadExternal) {
                    // etoland 서버의 모든 경로(/data/files/, /storage/ 등) 포함
                    $q->orWhere(function ($q2) {
                        $q2->where('content', 'like', '%etoland.co.kr/%')
                           ->where('content', 'like', '%<source%');
                    });
                }
            });

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

        $query->orderBy('post_id')->chunk($chunkSize, function ($posts) use ($client, $dryRun, $downloadExternal, $bar) {
            foreach ($posts as $post) {
                $this->repairPost($client, $post, $dryRun, $downloadExternal);
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->table(
            ['TypeA(lazy-hidden 제거)', 'TypeB(상대URL 재다운로드)', 'TypeC(외부URL 재다운로드)', '삭제(실패)', '오류'],
            [[$this->fixedA, $this->fixedB, $this->fixedC, $this->deleted, $this->errors]],
        );

        return 0;
    }

    private function repairPost($client, object $post, bool $dryRun, bool $downloadExternal): void
    {
        $content  = $post->content;
        $changed  = false;
        $hasTypeA = str_contains($content, 'lazy-hidden');

        // ─── Type A: lazy-hidden 클래스 제거 ─────────────────────────────
        if ($hasTypeA) {
            if ($dryRun) {
                $this->line("\n  [TypeA DRY] post_id={$post->post_id} lazy-hidden 제거 예정");
            } else {
                $fixed = $this->removeLazyHidden($content);
                if ($fixed !== $content) {
                    $content = $fixed;
                    $changed  = true;
                }
            }
        }

        // ─── Type B: 상대 경로 비디오 재다운로드 ──────────────────────────
        $allRelativeSrcs  = $this->findAllRelativeVideoSrcs($content);
        $downloadableMap  = $this->findRelativeVideoSrcMap($content);
        $unrepairableSrcs = array_diff($allRelativeSrcs, array_keys($downloadableMap));

        if (!empty($unrepairableSrcs)) {
            // data-src 없음 → 복구 불가 → 삭제
            $this->line("\n  [삭제] post_id={$post->post_id} 상대경로 비디오 복구불가(data-src 없음): " . implode(', ', $unrepairableSrcs));
            if (!$dryRun) {
                $this->deletePost((int) $post->post_id);
                $this->deleted++;
                return;
            }
        }

        if (!empty($downloadableMap)) {
            if ($dryRun) {
                foreach ($downloadableMap as $relSrc => $downloadUrl) {
                    $this->line("\n  [TypeB DRY] post_id={$post->post_id} relSrc={$relSrc} → {$downloadUrl}");
                }
            } else {
                $newContent = $this->downloadAndReplaceVideos($client, $post, $content, $downloadableMap);
                if ($newContent === null) {
                    // 게시물 삭제됨 (다운로드 실패)
                    $this->deleted++;
                    return;
                }
                if ($newContent !== $content) {
                    $content = $newContent;
                    $changed  = true;
                }
                $this->fixedB++;
            }
        }

        // ─── Type C: 외부 이토랜드 URL 재다운로드 (옵션) ─────────────────
        if ($downloadExternal) {
            $externalVideos = $this->findExternalEtolandVideoSrcs($content);
            if (!empty($externalVideos)) {
                if ($dryRun) {
                    foreach ($externalVideos as $src) {
                        $this->line("\n  [TypeC DRY] post_id={$post->post_id} → {$src}");
                    }
                } else {
                    // 외부 URL은 src 자체가 다운로드 URL
                    $videoMap   = array_combine($externalVideos, $externalVideos);
                    $newContent = $this->downloadAndReplaceVideos($client, $post, $content, $videoMap);
                    if ($newContent === null) {
                        $this->deleted++;
                        return;
                    }
                    if ($newContent !== $content) {
                        $content = $newContent;
                        $changed  = true;
                    }
                    $this->fixedC++;
                }
            }
        }

        // ─── 카운터 / 저장 ─────────────────────────────────────────────
        if ($hasTypeA) {
            $this->fixedA++;
        }

        if ($changed && !$dryRun) {
            DB::table('posts')->where('post_id', $post->post_id)->update([
                'content'    => $content,
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * <video>/<source> 태그에서 lazy-hidden 클래스만 제거.
     */
    private function removeLazyHidden(string $content): string
    {
        return preg_replace_callback(
            '/<video\b([^>]*)>/i',
            function (array $m): string {
                $attrs = preg_replace_callback(
                    '/\bclass=["\']([^"\']+)["\']/i',
                    function (array $c): string {
                        $classes = trim(preg_replace('/\blazy-hidden\b\s*/i', '', $c[1]));
                        return $classes ? 'class="' . $classes . '"' : '';
                    },
                    $m[1]
                );
                return '<video' . $attrs . '>';
            },
            $content
        ) ?? $content;
    }

    /**
     * content에서 상대 경로 src(/data/files/...)를 가진 모든 src 값 목록 반환.
     * data-src 유무에 관계없이 전부 수집 (복구 가능 여부 판단용).
     */
    private function findAllRelativeVideoSrcs(string $content): array
    {
        $result = [];

        preg_match_all('/<(?:source|video)\b([^>]*)>/i', $content, $tagMatches);
        foreach ($tagMatches[1] as $tagAttrs) {
            if (!preg_match('/\bsrc=["\']([^"\']+)["\']/i', $tagAttrs, $srcMatch)) {
                continue;
            }
            $src = $srcMatch[1];
            if (str_starts_with($src, '/data/files/')) {
                $result[] = $src;
            }
        }

        return array_unique($result);
    }

    /**
     * content에서 상대 경로 src(/data/files/...)를 가진 video/source 태그 수집.
     * data-src 속성에서 실제 다운로드 URL을 추출.
     * 반환: [srcInContent => downloadUrl]
     */
    private function findRelativeVideoSrcMap(string $content): array
    {
        $result = [];

        preg_match_all('/<(?:source|video)\b([^>]*)>/i', $content, $tagMatches);
        foreach ($tagMatches[1] as $tagAttrs) {
            if (!preg_match('/\bsrc=["\']([^"\']+)["\']/i', $tagAttrs, $srcMatch)) {
                continue;
            }
            $src = $srcMatch[1];
            if (!str_starts_with($src, '/data/files/')) {
                continue;
            }
            if (isset($result[$src])) {
                continue;
            }

            // data-src 속성에서 실제 이토랜드 URL 추출 (상대경로면 도메인 보완)
            if (preg_match('/\bdata-src=["\']([^"\']+)["\']/i', $tagAttrs, $dataSrcMatch)) {
                $downloadUrl = $dataSrcMatch[1];
                if (!str_starts_with($downloadUrl, 'http')) {
                    $downloadUrl = 'https://www.etoland.co.kr/' . ltrim($downloadUrl, '/');
                }
                $result[$src] = $downloadUrl;
            }
        }

        return $result;
    }

    /**
     * content에서 이토랜드 서버 URL(etoland.co.kr/...) 비디오 src 수집.
     * /data/files/, /storage/ 등 모든 경로 포함.
     */
    private function findExternalEtolandVideoSrcs(string $content): array
    {
        $result = [];

        preg_match_all('/<(?:source|video)\b([^>]*)>/i', $content, $tagMatches);
        foreach ($tagMatches[1] as $tagAttrs) {
            if (!preg_match('/\bsrc=["\']([^"\']+)["\']/i', $tagAttrs, $srcMatch)) {
                continue;
            }
            $src = $srcMatch[1];
            if (str_contains($src, 'etoland.co.kr/')) {
                $result[] = $src;
            }
        }

        return array_unique($result);
    }

    /**
     * 비디오 배치 다운로드 후 content URL 교체.
     * @param  array  $videoMap [srcInContent => downloadUrl]
     * @return string|null 업데이트된 content, 실패(삭제)시 null
     */
    private function downloadAndReplaceVideos($client, object $post, string $content, array $videoMap): ?string
    {
        $dir = 'uploads/post/' . $post->post_id;

        foreach ($videoMap as $srcInContent => $downloadUrl) {
            try {
                $fileInfo = $this->downloadVideo($client, $downloadUrl, $dir);

                if (!$fileInfo) {
                    $this->line("\n  [삭제] post_id={$post->post_id} 비디오 다운로드 실패: {$downloadUrl}");
                    $this->deletePost((int) $post->post_id);
                    return null;
                }

                // 파일 레코드 저장
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

                $serverUrl = $fileInfo['public_url'] ?? $fileInfo['file_url'];

                // src 교체
                $content = str_replace($srcInContent, $serverUrl, $content);

                // data-src 속성 제거 (다운로드 완료)
                $escapedDownload = preg_quote($downloadUrl, '/');
                $content = preg_replace('/\s*\bdata-src=["\']' . $escapedDownload . '["\']/', '', $content);

            } catch (\Throwable $e) {
                $this->line("\n  [삭제] post_id={$post->post_id} 오류({$e->getMessage()})");
                $this->deletePost((int) $post->post_id);
                return null;
            }
        }

        return $content;
    }

}
