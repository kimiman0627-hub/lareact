<?php

namespace App\Http\Controllers\Admin\Setting;

use App\Http\Controllers\Controller;
use App\Models\Setting\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MenuSettingController extends Controller
{
    public function index()
    {
        Inertia::setRootView('admin');

        $raw  = SiteSetting::get('nav_menu', '');
        $menu = $raw ? (json_decode($raw, true) ?? []) : [];

        return Inertia::render('Setting/MenuSettings', [
            'menu' => $menu,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'menu'                          => 'required|array|max:30',
            'menu.*.label'                  => 'required|string|max:30',
            'menu.*.href'                   => 'nullable|string|max:200',
            'menu.*.children'               => 'nullable|array|max:20',
            'menu.*.children.*.label'       => 'required|string|max:30',
            'menu.*.children.*.href'        => 'required|string|max:200',
        ]);

        $menu = collect($request->input('menu'))->map(function ($item) {
            return [
                'label'    => trim($item['label']),
                'href'     => trim($item['href'] ?? ''),
                'children' => collect($item['children'] ?? [])->map(fn ($c) => [
                    'label' => trim($c['label']),
                    'href'  => trim($c['href']),
                ])->values()->toArray(),
            ];
        })->values()->toArray();

        SiteSetting::set('nav_menu', json_encode($menu, JSON_UNESCAPED_UNICODE));

        // 캐시 무효화
        \Illuminate\Support\Facades\Cache::forget('site_settings_all');

        return back()->with('success', '메뉴가 저장되었습니다.');
    }
}
