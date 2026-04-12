<?php

namespace App\Http\Controllers\Admin\Board;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LikeController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $params  = $this->validateParams($request);
        $perPage = 30;
        $page    = max(1, (int) ($params['page'] ?? 1));

        $query = DB::table('post_likes as pl')
            ->join('posts as p',  'pl.post_id', '=', 'p.post_id')
            ->join('users as u',  'pl.user_id', '=', 'u.id')
            ->join('boards as b', 'p.post_category', '=', 'b.category')
            ->whereNull('p.deleted_at');

        if (!empty($params['type'])) {
            $query->where('pl.type', $params['type']);
        }
        if (!empty($params['keyword'])) {
            $kw = $params['keyword'];
            $query->where(function ($q) use ($kw) {
                $q->where('p.title', 'ilike', "%{$kw}%")
                  ->orWhere('u.name',  'ilike', "%{$kw}%")
                  ->orWhere('u.email', 'ilike', "%{$kw}%");
            });
        }
        if (!empty($params['category'])) {
            $query->where('p.post_category', $params['category']);
        }

        $total = (clone $query)->count();

        $items = (clone $query)
            ->orderByDesc('pl.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get([
                'pl.id',
                'pl.type',
                'pl.created_at',
                'p.post_id',
                'p.title as post_title',
                'p.like_count',
                'p.dislike_count',
                'b.board_name',
                'u.id as user_id',
                'u.name as user_name',
                'u.email as user_email',
            ]);

        $paginated = new LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $categories = DB::table('boards')
            ->where('board_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->orderBy('board_order')
            ->pluck('board_name', 'category');

        return Inertia::render('Board/LikeList', [
            'list'       => $paginated,
            'total'      => $total,
            'params'     => $params,
            'categories' => $categories,
        ]);
    }

    private function validateParams(Request $request): array
    {
        return $request->validate([
            'type'     => 'nullable|in:LIKE,DISLIKE',
            'keyword'  => 'nullable|string|max:100',
            'category' => 'nullable|string|max:50',
            'page'     => 'nullable|integer|min:1',
        ]);
    }
}
