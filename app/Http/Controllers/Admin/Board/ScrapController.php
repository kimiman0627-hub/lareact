<?php

namespace App\Http\Controllers\Admin\Board;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ScrapController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $params  = $request->validate([
            'keyword'  => 'nullable|string|max:100',
            'category' => 'nullable|string|max:50',
            'page'     => 'nullable|integer|min:1',
        ]);

        $perPage = 30;
        $page    = max(1, (int) ($params['page'] ?? 1));

        $query = DB::table('scraps as s')
            ->join('posts as p',  's.post_id',       '=', 'p.post_id')
            ->join('users as u',  's.user_id',        '=', 'u.id')
            ->join('boards as b', 'p.post_category',  '=', 'b.category')
            ->whereNull('p.deleted_at');

        if (!empty($params['keyword'])) {
            $kw = $params['keyword'];
            $query->where(function ($q) use ($kw) {
                $q->where('p.title',  'ilike', "%{$kw}%")
                  ->orWhere('u.name',  'ilike', "%{$kw}%")
                  ->orWhere('u.email', 'ilike', "%{$kw}%");
            });
        }

        if (!empty($params['category'])) {
            $query->where('p.post_category', $params['category']);
        }

        $total = (clone $query)->count();

        $items = (clone $query)
            ->orderByDesc('s.created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get([
                's.id',
                's.created_at as scrapped_at',
                'p.post_id',
                'p.title as post_title',
                'b.board_name',
                'u.id   as user_id',
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

        return Inertia::render('Board/ScrapList', [
            'list'       => $paginated,
            'total'      => $total,
            'params'     => $params,
            'categories' => $categories,
        ]);
    }
}
