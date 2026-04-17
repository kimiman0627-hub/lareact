<?php

namespace App\Http\Controllers\Service\Search;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('app');

        $q      = trim($request->input('q', ''));
        $perPage = 20;
        $page   = max(1, (int) $request->input('page', 1));

        if ($q === '') {
            return Inertia::render('Search/SearchResult', [
                'query' => '',
                'list'  => null,
            ]);
        }

        $baseQuery = DB::table('posts as p')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->join('boards as b', 'p.post_category', '=', 'b.category')
            ->where('p.post_status', 'ACTIVE')
            ->where(function ($q2) use ($q) {
                $q2->where('p.title', 'ilike', "%{$q}%")
                   ->orWhere('p.content', 'ilike', "%{$q}%");
            });

        $total = (clone $baseQuery)->count();

        $posts = (clone $baseQuery)
            ->orderByDesc('p.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get([
                'p.post_id', 'p.title', 'p.hits', 'p.comment_count',
                'p.created_at', 'p.post_category', 'p.source',
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

        return Inertia::render('Search/SearchResult', [
            'query' => $q,
            'list'  => $paginated,
        ]);
    }
}
