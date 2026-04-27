<?php

namespace App\Http\Controllers\Admin\Main;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MainController extends Controller
{
    public function index()
    {
        Inertia::setRootView('admin');

        $today     = now()->toDateString();
        $weekStart = now()->subDays(6)->toDateString();

        // 요약 카드
        $stats = [
            'today_visitors' => DB::table('users')
                ->whereNot('user_role', 'TEST')
                ->where(function ($q) {
                    $q->whereDate('last_login_at', today())
                      ->orWhere(function ($q2) {
                          $q2->whereNull('last_login_at')->whereDate('created_at', today());
                      });
                })
                ->count(),
            'today_posts'    => DB::table('posts')
                ->where('post_status', 'ACTIVE')
                ->whereDate('created_at', today())
                ->count(),
            'total_members'  => DB::table('users')
                ->whereNot('user_role', 'TEST')
                ->count(),
            'pending_inquiries' => DB::table('inquiries')
                ->where('status', 'PENDING')
                ->count(),
        ];

        // 최근 7일 가입/로그인 추이
        $rows    = DB::table('user_daily_stats')
            ->whereBetween('stat_date', [$weekStart, $today])
            ->orderBy('stat_date')
            ->get(['stat_date', 'reg_count', 'login_count']);
        $indexed = $rows->keyBy('stat_date');
        $weekSeries = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $row  = $indexed->get($date);
            $weekSeries[] = [
                'date'        => $date,
                'reg_count'   => $row?->reg_count   ?? 0,
                'login_count' => $row?->login_count ?? 0,
            ];
        }

        // 최근 게시글 8개
        $recentPosts = DB::table('posts')
            ->leftJoin('boards', 'posts.post_category', '=', 'boards.category')
            ->where('posts.post_status', 'ACTIVE')
            ->orderByDesc('posts.created_at')
            ->limit(8)
            ->get(['posts.post_id', 'posts.title', 'posts.hits', 'posts.comment_count', 'posts.created_at', 'boards.board_name']);

        // 미답변 문의 5개
        $recentInquiries = DB::table('inquiries')
            ->where('status', 'PENDING')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'type', 'name', 'title', 'created_at']);

        // 최근 크롤링 로그 5개
        $crawlLogs = DB::table('crawl_logs')
            ->orderByDesc('started_at')
            ->limit(5)
            ->get(['id', 'source', 'status', 'total_saved', 'total_errors', 'started_at', 'finished_at']);

        return Inertia::render('Main/Index', [
            'stats'           => $stats,
            'weekSeries'      => $weekSeries,
            'recentPosts'     => $recentPosts,
            'recentInquiries' => $recentInquiries,
            'crawlLogs'       => $crawlLogs,
        ]);
    }
}
