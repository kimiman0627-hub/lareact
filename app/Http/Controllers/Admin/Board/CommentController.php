<?php

namespace App\Http\Controllers\Admin\Board;

use App\Http\Controllers\Controller;
use App\Models\Board\Comment;
use App\Models\User\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CommentController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $params  = $request->only(['keyword', 'post_id', 'page', 'per_page']);
        $page    = max(1, (int) ($params['page']    ?? 1));
        $perPage = (int) ($params['per_page'] ?? 20);

        $query = DB::table('comments as c')
            ->join('users as u', 'c.user_id', '=', 'u.id')
            ->join('posts as p', 'c.post_id', '=', 'p.post_id');

        if (!empty($params['keyword'])) {
            $query->where('c.content', 'ilike', '%' . $params['keyword'] . '%');
        }

        if (!empty($params['post_id'])) {
            $query->where('c.post_id', (int) $params['post_id']);
        }

        $total    = (clone $query)->count();
        $comments = (clone $query)
            ->orderByDesc('c.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get([
                'c.comment_id', 'c.post_id', 'c.user_id', 'c.parent_id',
                'c.depth', 'c.content', 'c.created_at',
                'u.name as author',
                'p.title as post_title',
            ]);

        $list = new LengthAwarePaginator(
            $comments,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Board/CommentList', [
            'list'   => $list,
            'total'  => $total,
            'params' => $params,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'post_id'   => 'required|integer|exists:posts,post_id',
            'user_id'   => 'required|integer|exists:users,id',
            'content'   => 'required|string|max:2000',
            'parent_id' => 'nullable|integer|exists:comments,comment_id',
        ]);

        $depth = 1;
        if ($data['parent_id'] ?? null) {
            $parent = Comment::find($data['parent_id']);
            $depth  = $parent ? $parent->depth + 1 : 1;
        }

        Comment::create([
            'post_id'   => $data['post_id'],
            'user_id'   => $data['user_id'],
            'parent_id' => $data['parent_id'] ?? null,
            'depth'     => $depth,
            'content'   => $data['content'],
        ]);

        DB::table('posts')->where('post_id', $data['post_id'])->increment('comment_count');

        return response()->json(['message' => '댓글이 등록되었습니다.']);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $comment = Comment::findOrFail($id);
        $comment->update(['content' => $data['content']]);

        return response()->json(['message' => '댓글이 수정되었습니다.']);
    }

    public function destroy(int $id)
    {
        $comment = Comment::findOrFail($id);
        $postId  = $comment->post_id;

        $comment->delete();

        DB::table('posts')->where('post_id', $postId)->decrement('comment_count', 1);

        return response()->json(['message' => '댓글이 삭제되었습니다.']);
    }
}
