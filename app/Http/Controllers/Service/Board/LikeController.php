<?php

namespace App\Http\Controllers\Service\Board;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LikeController extends Controller
{
    public function toggle(Request $request, int $postId)
    {
        $request->validate(['type' => 'required|in:LIKE,DISLIKE']);

        $userId = $request->user()->id;
        $type   = $request->type;

        $post = DB::table('posts')
            ->where('post_id', $postId)
            ->where('post_status', 'ACTIVE')
            ->first(['post_id', 'post_category']);

        if (!$post) {
            return response()->json(['message' => '게시글을 찾을 수 없습니다.'], 404);
        }

        // 게시판 옵션 확인
        $board = DB::table('boards')->where('category', $post->post_category)->first(['options']);
        $options = $board ? (is_string($board->options) ? json_decode($board->options, true) : (array) $board->options) : [];

        if ($type === 'LIKE' && !($options['use_like'] ?? true)) {
            return response()->json(['message' => '좋아요 기능이 비활성화된 게시판입니다.'], 403);
        }
        if ($type === 'DISLIKE' && !($options['use_dislike'] ?? false)) {
            return response()->json(['message' => '싫어요 기능이 비활성화된 게시판입니다.'], 403);
        }

        $existing = DB::table('post_likes')
            ->where('post_id', $postId)
            ->where('user_id', $userId)
            ->first();

        DB::transaction(function () use ($postId, $userId, $type, $existing) {
            if (!$existing) {
                // 새로 추가
                DB::table('post_likes')->insert([
                    'post_id' => $postId,
                    'user_id' => $userId,
                    'type'    => $type,
                ]);
                DB::table('posts')->where('post_id', $postId)
                    ->increment($type === 'LIKE' ? 'like_count' : 'dislike_count');

            } elseif ($existing->type === $type) {
                // 같은 타입 → 취소
                DB::table('post_likes')
                    ->where('post_id', $postId)->where('user_id', $userId)->delete();
                DB::table('posts')->where('post_id', $postId)
                    ->decrement($type === 'LIKE' ? 'like_count' : 'dislike_count');

            } else {
                // 다른 타입 → 전환
                DB::table('post_likes')
                    ->where('post_id', $postId)->where('user_id', $userId)
                    ->update(['type' => $type]);
                $add = $type === 'LIKE' ? 'like_count' : 'dislike_count';
                $sub = $type === 'LIKE' ? 'dislike_count' : 'like_count';
                DB::table('posts')->where('post_id', $postId)
                    ->increment($add);
                DB::table('posts')->where('post_id', $postId)
                    ->decrement($sub);
            }
        });

        $updated = DB::table('posts')
            ->where('post_id', $postId)
            ->first(['like_count', 'dislike_count']);

        $userType = DB::table('post_likes')
            ->where('post_id', $postId)->where('user_id', $userId)
            ->value('type');

        return response()->json([
            'like_count'    => $updated->like_count,
            'dislike_count' => $updated->dislike_count,
            'user_type'     => $userType,
        ]);
    }
}
