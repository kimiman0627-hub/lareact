<?php

namespace App\Http\Middleware;

use App\Models\Banner\Banner as BannerModel;
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
    /**
     * 캐시 실패(Redis 장애, 디스크 풀 등) 시 예외를 삼키고 콜백 결과를 직접 반환.
     * 캐시 없이 DB에서 직접 읽으므로 사이트는 정상 동작 유지됨.
     */
    private function filterAdminMenu($admin, array $menus): array
    {
        $result = [];

        foreach ($menus as $item) {
            // 슈퍼 전용 항목: 슈퍼 관리자가 아니면 제외
            if (!empty($item['super_only']) && !$admin->is_super) {
                continue;
            }

            // 슈퍼 관리자거나 permissions 미설정이면 전체 노출
            if ($admin->is_super || is_null($admin->menu_permissions)) {
                $result[] = $item;
                continue;
            }

            $permissions = $admin->menu_permissions ?? [];

            if (empty($item['submenu'])) {
                if (in_array($item['route'], $permissions)) {
                    $result[] = $item;
                }
                continue;
            }

            $filteredSub = array_values(array_filter(
                $item['submenu'],
                fn($sub) => in_array($sub['route'], $permissions)
            ));

            if (!empty($filteredSub)) {
                $item['submenu'] = $filteredSub;
                $result[] = $item;
            }
        }

        return $result;
    }

    private function safeCache(string $key, int $ttl, callable $callback): mixed
    {
        try {
            return cache()->remember($key, $ttl, $callback);
        } catch (\Throwable) {
            return $callback();
        }
    }

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

            // 관리자로 인증된 경우에만 config/admin.php의 menu를 전달 (권한 필터링 적용)
            'adminMenu' => $request->user('admin')
                ? $this->filterAdminMenu($request->user('admin'), config('admin.menu'))
                : [],

            // GNB 게시판 목록 (모든 페이지 공유)
            'gnbBoards' => DB::table('boards')
                ->where('board_status', 'ACTIVE')
                ->orderBy('board_order')
                ->orderBy('board_id')
                ->get(['board_id', 'board_name', 'category'])
                ->toArray(),

            // 사이드바 배너 (캐시 5분, Redis 장애 시 DB 직접 조회로 폴백)
            'sideBanners1' => $this->safeCache('banners.side1', 300, fn () =>
                BannerModel::getActiveByPosition('SIDE1')
            ),
            'sideBanners2' => $this->safeCache('banners.side2', 300, fn () =>
                BannerModel::getActiveByPosition('SIDE2')
            ),

            // 사이드바 현황 통계 (캐시, Redis 장애 시 DB 직접 조회로 폴백)
            'siteStats' => [
                'today_posts'   => $this->safeCache('stats.today_posts', 180, fn () =>
                    DB::table('posts')
                        ->where('post_status', 'ACTIVE')
                        ->whereDate('created_at', today())
                        ->count()
                ),
                'total_members' => $this->safeCache('stats.total_members', 180, fn () =>
                    DB::table('users')
                        ->whereNot('user_role', 'TEST')
                        ->count()
                ),
                'online_users'  => $this->safeCache('stats.online_users', 60, fn () =>
                    DB::table('sessions')
                        ->where('last_activity', '>=', now()->subMinutes(5)->timestamp)
                        ->count()
                ),
            ],
        ]);
    }
}
