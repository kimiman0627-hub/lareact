<?php

namespace App\Http\Controllers\Service\Board;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BoardController extends Controller
{
    public function index(Request $request, string $category)
    {
        Inertia::setRootView('app');

        $board = DB::table('boards')
            ->where('category', $category)
            ->where('board_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->first();

        if (!$board) {
            abort(404);
        }

        $options    = is_string($board->options) ? json_decode($board->options, true) : (array) $board->options;
        $perPage    = (int) ($options['posts_per_page'] ?? 20);
        $page       = max(1, (int) $request->input('page', 1));

        $baseQuery = DB::table('posts as p')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->where('p.post_category', $category)
            ->where('p.post_status', 'ACTIVE')
            ->whereNull('p.deleted_at');

        $total = (clone $baseQuery)->count();

        $posts = (clone $baseQuery)
            ->orderByDesc('p.is_notice')
            ->orderByDesc('p.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get([
                'p.post_id', 'p.title', 'p.is_notice', 'p.hits',
                'p.comment_count', 'p.created_at', 'p.source',
                'u.name as author',
            ]);

        $paginated = new LengthAwarePaginator(
            $posts,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Board/BoardList', [
            'board'   => $board,
            'list'    => $paginated,
        ]);
    }

    public function show(int $id)
    {
        Inertia::setRootView('app');

        $post = DB::table('posts as p')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->join('boards as b', 'p.post_category', '=', 'b.category')
            ->where('p.post_id', $id)
            ->where('p.post_status', 'ACTIVE')
            ->whereNull('p.deleted_at')
            ->first([
                'p.post_id', 'p.title', 'p.content', 'p.is_notice',
                'p.hits', 'p.comment_count', 'p.created_at', 'p.post_category', 'p.source',
                'u.name as author',
                'b.board_name', 'b.category',
            ]);

        if (!$post) {
            abort(404);
        }

        DB::table('posts')->where('post_id', $id)->increment('hits');

        $comments = DB::table('comments as c')
            ->join('users as u', 'c.user_id', '=', 'u.id')
            ->where('c.post_id', $id)
            ->whereNull('c.deleted_at')
            ->orderBy('c.created_at')
            ->get(['c.comment_id', 'c.content', 'c.created_at', 'c.user_id', 'u.name as author']);

        return Inertia::render('Board/PostDetail', [
            'post'     => $post,
            'comments' => $comments,
        ]);
    }
}
