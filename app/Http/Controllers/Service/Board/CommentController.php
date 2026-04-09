<?php

namespace App\Http\Controllers\Service\Board;

use App\Http\Controllers\Controller;
use App\Models\Board\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CommentController extends Controller
{
    public function store(Request $request, int $postId)
    {
        $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $post = DB::table('posts')
            ->where('post_id', $postId)
            ->where('post_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->first();

        if (!$post) {
            abort(404);
        }

        Comment::create([
            'post_id' => $postId,
            'user_id' => Auth::id(),
            'content' => $request->input('content'),
        ]);

        DB::table('posts')->where('post_id', $postId)->increment('comment_count');

        return back();
    }

    public function destroy(int $commentId)
    {
        $comment = Comment::findOrFail($commentId);

        if ($comment->user_id !== Auth::id()) {
            abort(403);
        }

        $comment->delete();

        DB::table('posts')->where('post_id', $comment->post_id)->decrement('comment_count');

        return back();
    }
}
