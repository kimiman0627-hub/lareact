<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminPermission
{
    // 권한 체크 없이 항상 허용하는 라우트
    private const ALWAYS_ALLOW = [
        'admin.index',
        'admin.logout',
        'admin.settings.profile',
        'admin.settings.profile.update',
        'admin.settings.password.update',
        'admin.files.upload',
        'admin.admins.index',
        'admin.admins.store',
        'admin.admins.update',
        'admin.admins.password',
        'admin.admins.permissions',
        'admin.admins.destroy',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return redirect()->route('admin.login');
        }

        // 슈퍼 관리자는 전체 허용
        if ($admin->is_super) {
            return $next($request);
        }

        $currentRoute = $request->route()?->getName();

        // 항상 허용 목록
        if (in_array($currentRoute, self::ALWAYS_ALLOW)) {
            return $next($request);
        }

        // 권한 없는 일반 관리자가 관리자 관리 페이지 접근 시 차단
        if (str_starts_with($currentRoute ?? '', 'admin.admins')) {
            abort(403, '슈퍼 관리자만 접근할 수 있습니다.');
        }

        $permissions = $admin->menu_permissions ?? [];

        // 메뉴 config에서 허용된 권한의 라우트 그룹 prefix 추출
        // 예: admin.users.index → admin.users (→ admin.users.* 전체 허용)
        foreach ($permissions as $permRoute) {
            $parts  = explode('.', $permRoute);
            array_pop($parts);
            $prefix = implode('.', $parts); // e.g. "admin.users"

            if ($prefix && str_starts_with($currentRoute ?? '', $prefix)) {
                return $next($request);
            }
        }

        abort(403, '이 페이지에 대한 접근 권한이 없습니다.');
    }
}
