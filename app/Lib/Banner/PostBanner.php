<?php

namespace App\Lib\Banner;

use Illuminate\Support\Facades\DB;
use App\Lib\Common\ResultTrait;

class PostBanner
{
    use ResultTrait;

    function __construct()
    {
        $this->initResult();
    }

    /**
     * 게시물에 연동된 배너 ID 목록 조회
     */
    public function getByPostId(int $postId): array
    {
        try {
            $rows = DB::select(
                "SELECT banner_id FROM post_banners WHERE post_id = ? ORDER BY sort_order ASC",
                [$postId]
            );
            return array_column($rows, 'banner_id');
        } catch (\Throwable $e) {
            $this->setResult(500, $e->getMessage());
            return [];
        }
    }

    /**
     * 게시물-배너 연동을 동기화 (기존 삭제 후 재등록)
     */
    public function sync(int $postId, array $bannerIds): bool
    {
        try {
            DB::beginTransaction();

            DB::delete("DELETE FROM post_banners WHERE post_id = ?", [$postId]);

            foreach ($bannerIds as $sort => $bannerId) {
                DB::insert(
                    "INSERT INTO post_banners (post_id, banner_id, sort_order, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
                    [$postId, $bannerId, $sort]
                );
            }

            DB::commit();
            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->setResult(500, $e->getMessage());
            return false;
        }
    }

    /**
     * 게시물 삭제 시 연동 배너도 함께 제거
     */
    public function deleteByPostId(int $postId): bool
    {
        try {
            DB::delete("DELETE FROM post_banners WHERE post_id = ?", [$postId]);
            return true;
        } catch (\Throwable $e) {
            $this->setResult(500, $e->getMessage());
            return false;
        }
    }
}
