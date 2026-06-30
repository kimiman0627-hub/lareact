<?php

namespace App\Lib\User;

use App\Models\Setting\SiteSetting;
use Illuminate\Support\Facades\DB;

class PointService
{
    /**
     * 게시글 작성 포인트 적립
     */
    public static function earnForPost(int $userId, array $options, int $postId, string $boardCategory): void
    {
        if (empty($options['point_enabled']) || empty($options['point_amount'])) return;

        $amount = (int) $options['point_amount'];
        $cycle  = $options['point_cycle'] ?? 'PER_POST';

        if (!self::canEarn($userId, 'POST_WRITE', $cycle, 'post', $boardCategory)) return;

        self::earn($userId, $amount, 'POST_WRITE', '게시글 작성', 'post', $postId);
    }

    /**
     * 댓글 작성 포인트 적립
     */
    public static function earnForComment(int $userId, array $options, int $commentId, string $boardCategory): void
    {
        if (empty($options['comment_point_enabled']) || empty($options['comment_point_amount'])) return;

        $amount = (int) $options['comment_point_amount'];
        $cycle  = $options['comment_point_cycle'] ?? 'PER_POST';

        if (!self::canEarn($userId, 'COMMENT_WRITE', $cycle, 'comment', $boardCategory)) return;

        self::earn($userId, $amount, 'COMMENT_WRITE', '댓글 작성', 'comment', $commentId);
    }

    /**
     * 로그인 포인트 적립 (사이트 설정 기반)
     */
    public static function earnForLogin(int $userId): void
    {
        if (SiteSetting::get('login_point_enabled', '0') !== '1') return;

        $amount = (int) SiteSetting::get('login_point_amount', '0');
        if ($amount <= 0) return;

        $cycle = SiteSetting::get('login_point_cycle', 'DAILY');

        $query = DB::table('user_points')
            ->where('user_id', $userId)
            ->where('type', 'LOGIN');

        if ($cycle === 'DAILY') {
            $query->whereDate('created_at', today());
        }

        if ($query->exists()) return;

        self::earn($userId, $amount, 'LOGIN', '로그인 지급', null, null);
    }

    /**
     * 게시글 삭제 시 포인트 회수
     */
    public static function revokeForPost(int $postUserId, int $postId): void
    {
        $earned = DB::table('user_points')
            ->where('user_id', $postUserId)
            ->where('type', 'POST_WRITE')
            ->where('related_type', 'post')
            ->where('related_id', $postId)
            ->where('amount', '>', 0)
            ->first();

        if (!$earned) return;

        self::earn($postUserId, -$earned->amount, 'POST_DELETE', '게시글 삭제', 'post', $postId);
    }

    /**
     * 댓글 삭제 시 포인트 회수
     */
    public static function revokeForComment(int $commentUserId, int $commentId): void
    {
        $earned = DB::table('user_points')
            ->where('user_id', $commentUserId)
            ->where('type', 'COMMENT_WRITE')
            ->where('related_type', 'comment')
            ->where('related_id', $commentId)
            ->where('amount', '>', 0)
            ->first();

        if (!$earned) return;

        self::earn($commentUserId, -$earned->amount, 'COMMENT_DELETE', '댓글 삭제', 'comment', $commentId);
    }

    /**
     * 포인트 지급 가능 여부 (주기 체크)
     */
    private static function canEarn(int $userId, string $type, string $cycle, string $relatedType, string $boardCategory): bool
    {
        if ($cycle === 'PER_POST') return true;

        $query = DB::table('user_points as up')
            ->where('up.user_id', $userId)
            ->where('up.type', $type)
            ->where('up.related_type', $relatedType);

        if ($relatedType === 'post') {
            $query->join('posts as p', 'p.post_id', '=', 'up.related_id')
                  ->where('p.post_category', $boardCategory);
        } else {
            $query->join('comments as c', 'c.comment_id', '=', 'up.related_id')
                  ->join('posts as p', 'p.post_id', '=', 'c.post_id')
                  ->where('p.post_category', $boardCategory);
        }

        if ($cycle === 'DAILY') {
            $query->whereDate('up.created_at', today());
        }

        return !$query->exists();
    }

    /**
     * 포인트 적립/차감 실행 (트랜잭션)
     * amount 양수=적립, 음수=차감
     */
    public static function earn(int $userId, int $amount, string $type, string $description, ?string $relatedType, int|null $relatedId): void
    {
        DB::transaction(function () use ($userId, $amount, $type, $description, $relatedType, $relatedId) {
            DB::table('users')->where('id', $userId)->increment('point', $amount);
            $balance = (int) DB::table('users')->where('id', $userId)->value('point');

            DB::table('user_points')->insert([
                'user_id'      => $userId,
                'type'         => $type,
                'amount'       => $amount,
                'balance'      => $balance,
                'description'  => $description,
                'related_type' => $relatedType,
                'related_id'   => $relatedId,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        });
    }
}
