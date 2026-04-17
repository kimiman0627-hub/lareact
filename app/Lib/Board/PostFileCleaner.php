<?php

namespace App\Lib\Board;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * 게시물 첨부파일 삭제/동기화 공통 라이브러리.
 * 관리자 PostController와 서비스 BoardController 양쪽에서 공유.
 *
 * file_url 컬럼은 두 가지 형식이 혼재함:
 *   구형 (관리자 직접 업로드): /storage/uploads/post/...
 *   신형 (크롤러/신규):       uploads/post/...
 * storage 컬럼: LOCAL | NCP
 */
class PostFileCleaner
{
    /**
     * 게시물에 연결된 모든 파일을 스토리지 + DB에서 삭제.
     */
    public static function deleteByPost(int $postId): void
    {
        $files = DB::table('files')
            ->where('file_kind', 'POST')
            ->where('ref_id', $postId)
            ->get();

        foreach ($files as $file) {
            static::deleteFromStorage($file->storage ?? 'LOCAL', static::toRelativePath($file->file_url));
        }

        DB::table('files')
            ->where('file_kind', 'POST')
            ->where('ref_id', $postId)
            ->delete();
    }

    /**
     * content HTML 기준으로 files 테이블 동기화.
     *  - $newFileIds: 새로 업로드되어 ref_id 연결이 필요한 파일 IDs
     *  - content에 더 이상 없는 파일(고아)은 스토리지 + DB에서 삭제
     */
    public static function syncContentFiles(int $postId, string $content, array $newFileIds = []): void
    {
        // 1. 새로 업로드된 파일 ref_id 연결 (ref_id = null 인 것만)
        if (!empty($newFileIds)) {
            DB::table('files')
                ->whereIn('file_id', $newFileIds)
                ->where('file_kind', 'POST')
                ->whereNull('ref_id')
                ->update(['ref_id' => $postId]);
        }

        // 2. content에서 파일 URL 추출 → 상대 경로로 정규화
        //    - LOCAL: /storage/uploads/...
        //    - NCP:   /file/uploads/...
        preg_match_all('#(?:/storage|/file)/uploads/[^\s"\'<>\)]+#', $content, $matches);
        $relativePathsInContent = array_unique(
            array_map(
                fn($url) => ltrim(preg_replace('#^/(storage|file)/#', '', $url), '/'),
                $matches[0] ?? []
            )
        );

        // 3. 포스트에 연결된 파일 중 content에 없는 것(고아) 삭제
        $files = DB::table('files')
            ->where('file_kind', 'POST')
            ->where('ref_id', $postId)
            ->get();

        foreach ($files as $file) {
            $relativePath = static::toRelativePath($file->file_url);
            if (empty($relativePathsInContent) || !in_array($relativePath, $relativePathsInContent)) {
                static::deleteFromStorage($file->storage ?? 'LOCAL', $relativePath);
                DB::table('files')->where('file_id', $file->file_id)->delete();
            }
        }
    }

    /**
     * file_url → 스토리지 상대 경로 정규화.
     * /storage/uploads/... 또는 /file/uploads/... → uploads/...
     */
    private static function toRelativePath(string $fileUrl): string
    {
        return ltrim(preg_replace('#^/(storage|file)/#', '', $fileUrl), '/');
    }

    /**
     * 스토리지 종류에 맞는 디스크에서 파일 삭제.
     */
    private static function deleteFromStorage(string $storage, string $relativePath): void
    {
        $disk = ($storage === 'NCP') ? 'ncp' : 'public';
        Storage::disk($disk)->delete($relativePath);
    }
}
