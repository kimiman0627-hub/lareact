<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
                'admin' => $request->user('admin'), // 관리자 유저
            ],

            // 관리자로 인증된 경우에만 config/admin.php의 menu를 전달
            'adminMenu' => $request->user('admin') ? config('admin.menu') : null,

            // GNB 게시판 목록 (모든 페이지 공유)
            'gnbBoards' => DB::table('boards')
                ->where('board_status', 'ACTIVE')
                ->whereNull('deleted_at')
                ->orderBy('board_order')
                ->orderBy('board_id')
                ->get(['board_id', 'board_name', 'category'])
                ->toArray(),

            // 사이드바 현황 통계 (캐시 적용)
            // today_posts / total_members: 3분 캐시 (자주 바뀌지 않음)
            // online_users: 1분 캐시 (세션 기반 실시간성 유지)
            'siteStats' => [
                'today_posts'   => cache()->remember('stats.today_posts', 180, fn () =>
                    DB::table('posts')
                        ->where('post_status', 'ACTIVE')
                        ->whereNull('deleted_at')
                        ->whereDate('created_at', today())
                        ->count()
                ),
                'total_members' => cache()->remember('stats.total_members', 180, fn () =>
                    DB::table('users')
                        ->whereNot('user_role', 'TEST')
                        ->count()
                ),
                'online_users'  => cache()->remember('stats.online_users', 60, fn () =>
                    DB::table('sessions')
                        ->where('last_activity', '>=', now()->subMinutes(5)->timestamp)
                        ->count()
                ),
            ],
        ]);
    }
}
