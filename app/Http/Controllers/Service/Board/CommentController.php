<?php

namespace App\Http\Controllers\Service\Board;

use App\Http\Controllers\Controller;
use App\Lib\User\PointService;
use App\Models\Board\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CommentController extends Controller
{
    public function store(Request $request, int $postId)
    {
        $request->validate([
            'content'   => 'required|string|max:2000',
            'parent_id' => 'nullable|integer|exists:comments,comment_id',
        ]);

        $post = DB::table('posts')
            ->where('post_id', $postId)
            ->where('post_status', 'ACTIVE')
            ->first();

        if (!$post) abort(404);

        // 게시판 댓글 깊이 설정 조회
        $board = DB::table('boards')
            ->where('category', $post->post_category)
            ->first();

        $options      = $board ? json_decode($board->options ?? '{}', true) : [];
        $maxDepth     = (int) ($options['comment_depth'] ?? 2);

        $parentId = $request->input('parent_id');
        $depth    = 1;

        if ($parentId) {
            $parent = Comment::findOrFail($parentId);

            if ($parent->post_id !== $postId) abort(422);

            $depth = $parent->depth + 1;

            if ($depth > $maxDepth) {
                return back()->withErrors(['parent_id' => '더 이상 대댓글을 작성할 수 없습니다.']);
            }
        }

        $comment = Comment::create([
            'post_id'   => $postId,
            'user_id'   => Auth::id(),
            'parent_id' => $parentId,
            'depth'     => $depth,
            'content'   => $request->input('content'),
        ]);

        DB::table('posts')->where('post_id', $postId)->increment('comment_count');

        PointService::earnForComment(Auth::id(), $options, $comment->comment_id, $post->post_category);

        return back();
    }

    public function destroy(int $commentId)
    {
        $comment = Comment::findOrFail($commentId);

        if ($comment->user_id !== Auth::id()) abort(403);

        PointService::revokeForComment((int) $comment->user_id, $commentId);

        $comment->delete();

        DB::table('posts')->where('post_id', $comment->post_id)->decrement('comment_count');

        return back();
    }
}
