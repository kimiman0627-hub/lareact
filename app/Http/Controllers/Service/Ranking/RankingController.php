<?php

namespace App\Http\Controllers\Service\Ranking;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RankingController extends Controller
{
    public function points()
    {
        $now = now();

        $periods = [
            'daily'   => [$now->copy()->startOfDay(),   $now->copy()],
            'weekly'  => [$now->copy()->startOfWeek(1), $now->copy()],
            'monthly' => [$now->copy()->startOfMonth(), $now->copy()],
        ];

        $rankings = [];
        foreach ($periods as $key => [$start, $end]) {
            $rankings[$key] = DB::table('user_points as up')
                ->join('users as u', 'u.id', '=', 'up.user_id')
                ->whereBetween('up.created_at', [$start, $end])
                ->where('up.amount', '>', 0)
                ->groupBy('up.user_id', 'u.name')
                ->orderByDesc('total')
                ->limit(20)
                ->select([
                    'up.user_id',
                    DB::raw('SUM(up.amount) as total'),
                    'u.name',
                ])
                ->get()
                ->map(function ($row, $index) {
                    return [
                        'rank'  => $index + 1,
                        'name'  => mb_substr($row->name, 0, 1) . str_repeat('*', max(0, mb_strlen($row->name) - 1)),
                        'total' => (int) $row->total,
                    ];
                })
                ->values();
        }

        return Inertia::render('Ranking/PointRanking', [
            'daily'   => $rankings['daily'],
            'weekly'  => $rankings['weekly'],
            'monthly' => $rankings['monthly'],
            'updatedAt' => $now->format('Y-m-d H:i'),
        ]);
    }
}
