<?php

namespace App\Http\Controllers\Admin\Stats;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StatController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $request->validate([
            'from' => 'nullable|date',
            'to'   => 'nullable|date|after_or_equal:from',
        ]);

        $to   = $request->input('to',   now()->toDateString());
        $from = $request->input('from', now()->subDays(29)->toDateString());

        // 최대 365일 제한
        $fromCarbon = \Carbon\Carbon::parse($from);
        $toCarbon   = \Carbon\Carbon::parse($to);
        if ($fromCarbon->diffInDays($toCarbon) > 365) {
            $from = $toCarbon->copy()->subDays(365)->toDateString();
            $fromCarbon = \Carbon\Carbon::parse($from);
        }

        $days = $fromCarbon->diffInDays($toCarbon) + 1;

        // user_daily_stats에서 기간 데이터 조회
        $rows    = DB::table('user_daily_stats')
            ->whereBetween('stat_date', [$from, $to])
            ->orderBy('stat_date')
            ->get(['stat_date', 'reg_count', 'login_count']);

        // 날짜 인덱스로 변환 (빠진 날짜는 0으로 채움)
        $indexed = $rows->keyBy('stat_date');
        $series  = [];
        for ($d = 0; $d < $days; $d++) {
            $date     = $fromCarbon->copy()->addDays($d)->toDateString();
            $row      = $indexed->get($date);
            $series[] = [
                'date'        => $date,
                'reg_count'   => $row?->reg_count   ?? 0,
                'login_count' => $row?->login_count ?? 0,
            ];
        }

        // 요약 카드 (항상 오늘/이번주/이번달 기준 고정)
        $today     = now()->toDateString();
        $weekStart = now()->subDays(6)->toDateString();
        $monStart  = now()->startOfMonth()->toDateString();
        $todayRow  = DB::table('user_daily_stats')->where('stat_date', $today)->first();

        $summary = [
            'today_reg'   => $todayRow?->reg_count   ?? 0,
            'today_login' => $todayRow?->login_count ?? 0,
            'week_reg'    => (int) DB::table('user_daily_stats')
                                ->whereBetween('stat_date', [$weekStart, $today])->sum('reg_count'),
            'week_login'  => (int) DB::table('user_daily_stats')
                                ->whereBetween('stat_date', [$weekStart, $today])->sum('login_count'),
            'month_reg'   => (int) DB::table('user_daily_stats')
                                ->whereBetween('stat_date', [$monStart, $today])->sum('reg_count'),
            'month_login' => (int) DB::table('user_daily_stats')
                                ->whereBetween('stat_date', [$monStart, $today])->sum('login_count'),
            'total_users' => (int) DB::table('users')->count(),
        ];

        return Inertia::render('Stats/UserStats', [
            'series'  => $series,
            'summary' => $summary,
            'from'    => $from,
            'to'      => $to,
        ]);
    }
}
