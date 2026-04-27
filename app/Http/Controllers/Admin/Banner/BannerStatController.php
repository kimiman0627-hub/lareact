<?php

namespace App\Http\Controllers\Admin\Banner;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BannerStatController extends Controller
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
        }

        // 배너별 집계
        $bannerStats = DB::table('banners')
            ->leftJoin('banner_daily_stats', function ($join) use ($from, $to) {
                $join->on('banners.banner_id', '=', 'banner_daily_stats.banner_id')
                     ->whereBetween('banner_daily_stats.stat_date', [$from, $to]);
            })
            ->groupBy('banners.banner_id', 'banners.title', 'banners.banner_position', 'banners.banner_type', 'banners.banner_status')
            ->orderByRaw('SUM(COALESCE(banner_daily_stats.impressions, 0)) DESC')
            ->get([
                'banners.banner_id',
                'banners.title',
                'banners.banner_position',
                'banners.banner_type',
                'banners.banner_status',
                DB::raw('COALESCE(SUM(banner_daily_stats.impressions), 0) AS total_impressions'),
                DB::raw('COALESCE(SUM(banner_daily_stats.clicks), 0) AS total_clicks'),
            ]);

        // 요약
        $summary = [
            'total_impressions' => $bannerStats->sum('total_impressions'),
            'total_clicks'      => $bannerStats->sum('total_clicks'),
        ];

        // 날짜별 전체 추이 (기간 내 일별 합산)
        $days    = $fromCarbon->diffInDays(\Carbon\Carbon::parse($to)) + 1;
        $rows    = DB::table('banner_daily_stats')
            ->whereBetween('stat_date', [$from, $to])
            ->groupBy('stat_date')
            ->orderBy('stat_date')
            ->get([
                'stat_date',
                DB::raw('SUM(impressions) AS impressions'),
                DB::raw('SUM(clicks) AS clicks'),
            ])
            ->keyBy('stat_date');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date  = $fromCarbon->copy()->addDays($i)->toDateString();
            $row   = $rows->get($date);
            $series[] = [
                'date'        => $date,
                'impressions' => (int) ($row?->impressions ?? 0),
                'clicks'      => (int) ($row?->clicks      ?? 0),
            ];
        }

        return Inertia::render('Stats/BannerStats', [
            'bannerStats' => $bannerStats,
            'summary'     => $summary,
            'series'      => $series,
            'from'        => $from,
            'to'          => $to,
        ]);
    }
}
