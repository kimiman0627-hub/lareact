<?php

namespace App\Http\Controllers\Admin\Setting;

use App\Http\Controllers\Controller;
use App\Models\Setting\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PointSettingController extends Controller
{
    public function index()
    {
        Inertia::setRootView('admin');

        return Inertia::render('Setting/PointSettings', [
            'settings' => [
                'login_point_enabled'      => SiteSetting::get('login_point_enabled',      '0'),
                'login_point_amount'       => SiteSetting::get('login_point_amount',        '0'),
                'login_point_cycle'        => SiteSetting::get('login_point_cycle',         'DAILY'),
                'attendance_point_enabled' => SiteSetting::get('attendance_point_enabled',  '0'),
                'attendance_point_amount'  => SiteSetting::get('attendance_point_amount',   '0'),
                'attendance_bonus_enabled' => SiteSetting::get('attendance_bonus_enabled',  '0'),
                'attendance_bonus_days'    => SiteSetting::get('attendance_bonus_days',     '10'),
                'attendance_bonus_amount'  => SiteSetting::get('attendance_bonus_amount',   '0'),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'login_point_enabled'      => 'required|boolean',
            'login_point_amount'       => 'required|integer|min:0|max:100000',
            'login_point_cycle'        => 'required|in:ONCE,DAILY',
            'attendance_point_enabled' => 'required|boolean',
            'attendance_point_amount'  => 'required|integer|min:0|max:100000',
            'attendance_bonus_enabled' => 'required|boolean',
            'attendance_bonus_days'    => 'required|integer|min:1|max:365',
            'attendance_bonus_amount'  => 'required|integer|min:0|max:100000',
        ]);

        SiteSetting::set('login_point_enabled',      $request->boolean('login_point_enabled')      ? '1' : '0');
        SiteSetting::set('login_point_amount',        (string) $request->integer('login_point_amount'));
        SiteSetting::set('login_point_cycle',         $request->input('login_point_cycle'));
        SiteSetting::set('attendance_point_enabled',  $request->boolean('attendance_point_enabled') ? '1' : '0');
        SiteSetting::set('attendance_point_amount',   (string) $request->integer('attendance_point_amount'));
        SiteSetting::set('attendance_bonus_enabled',  $request->boolean('attendance_bonus_enabled') ? '1' : '0');
        SiteSetting::set('attendance_bonus_days',     (string) $request->integer('attendance_bonus_days'));
        SiteSetting::set('attendance_bonus_amount',   (string) $request->integer('attendance_bonus_amount'));

        return back()->with('success', '포인트 설정이 저장되었습니다.');
    }
}
