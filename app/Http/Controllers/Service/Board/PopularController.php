<?php

namespace App\Http\Controllers\Service\Board;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PopularController extends Controller
{
    // 기준: 최근 7일 이내 게시글을 조회수 기준 정렬
    public function index(Request $request)
    {
        Inertia::setRootView('app');

        $perPage = 30;
        $page    = max(1, (int) $request->input('page', 1));

        $baseQuery = DB::table('posts as p')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->join('boards as b', 'p.post_category', '=', 'b.category')
            ->where('p.post_status', 'ACTIVE')
            ->where('p.created_at', '>=', now()->subDays(7));

        $total = (clone $baseQuery)->count();

        // 인기점수 = 조회수 + 댓글수 × 50 (출처별 조회수 스케일 차이 보정)
        $posts = (clone $baseQuery)
            ->orderByDesc(DB::raw('(p.hits + p.comment_count * 50)'))
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get([
                'p.post_id', 'p.title', 'p.hits', 'p.comment_count',
                'p.created_at', 'p.post_category',
                'u.name as author',
                'b.board_name',
                DB::raw("EXISTS (SELECT 1 FROM files WHERE file_kind = 'POST' AND ref_id = p.post_id) AS has_image"),
            ]);

        $paginated = new LengthAwarePaginator(
            $posts,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Board/PopularList', [
            'list' => $paginated,
        ]);
    }
}
