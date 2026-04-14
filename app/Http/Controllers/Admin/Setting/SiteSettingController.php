<?php

namespace App\Http\Controllers\Admin\Setting;

use App\Http\Controllers\Controller;
use App\Models\Setting\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiteSettingController extends Controller
{
    public function index()
    {
        Inertia::setRootView('admin');

        return Inertia::render('Setting/SiteSettings', [
            'settings' => SiteSetting::allCached(),
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'head_code'   => 'nullable|string|max:10000',
            'footer_code' => 'nullable|string|max:10000',
        ]);

        SiteSetting::set('head_code',   $request->input('head_code'));
        SiteSetting::set('footer_code', $request->input('footer_code'));

        return back()->with('success', '저장되었습니다.');
    }
}
