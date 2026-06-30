<?php

namespace App\Http\Controllers\Admin\Point;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PointController extends Controller
{
    private const PER_PAGE = 30;

    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $params = $request->validate([
            'keyword'    => 'nullable|string|max:100',
            'type'       => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
            'page'       => 'nullable|integer|min:1',
        ]);

        $page = max(1, (int) ($params['page'] ?? 1));

        $base = DB::table('user_points as up')
            ->join('users as u', 'u.id', '=', 'up.user_id')
            ->select([
                'up.id', 'up.type', 'up.amount', 'up.balance',
                'up.description', 'up.related_type', 'up.related_id',
                'up.created_at',
                'u.id as user_id', 'u.name as user_name', 'u.email as user_email',
            ]);

        if (!empty($params['keyword'])) {
            $kw = '%' . $params['keyword'] . '%';
            $base->where(function ($q) use ($kw) {
                $q->where('u.name', 'like', $kw)
                  ->orWhere('u.email', 'like', $kw);
            });
        }

        if (!empty($params['type'])) {
            $base->where('up.type', $params['type']);
        }

        if (!empty($params['start_date'])) {
            $base->whereDate('up.created_at', '>=', $params['start_date']);
        }

        if (!empty($params['end_date'])) {
            $base->whereDate('up.created_at', '<=', $params['end_date']);
        }

        $total = (clone $base)->count();

        $items = (clone $base)
            ->orderByDesc('up.id')
            ->offset(($page - 1) * self::PER_PAGE)
            ->limit(self::PER_PAGE)
            ->get();

        $list = new LengthAwarePaginator($items, $total, self::PER_PAGE, $page, [
            'path'  => $request->url(),
            'query' => $request->query(),
        ]);

        return Inertia::render('Point/PointList', [
            'list'        => $list,
            'total'       => $total,
            'params'      => $params,
            'pointTypes'  => config('config.point_types'),
        ]);
    }
}
