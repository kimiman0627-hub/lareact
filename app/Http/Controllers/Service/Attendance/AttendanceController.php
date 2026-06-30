<?php

namespace App\Http\Controllers\Service\Attendance;

use App\Http\Controllers\Controller;
use App\Lib\User\AttendanceService;
use App\Models\Setting\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        $today  = today()->toDateString();

        $checkedToday   = false;
        $consecutive    = 0;
        $recentDates    = [];

        if ($userId) {
            $checkedToday = DB::table('user_attendances')
                ->where('user_id', $userId)
                ->where('attended_date', $today)
                ->exists();

            $consecutive  = AttendanceService::getCurrentConsecutive($userId);
            $recentDates  = AttendanceService::getRecentDates($userId, 35);
        }

        $bonusDays = (int) SiteSetting::get('attendance_bonus_days', '10');
        $nextBonus = $bonusDays > 0 && $consecutive > 0
            ? $bonusDays - ($consecutive % $bonusDays)
            : $bonusDays;
        if ($nextBonus === $bonusDays && $consecutive > 0) $nextBonus = 0;

        // 오늘 출석 랭킹 (출석 순서대로)
        $todayRanking = DB::table('user_attendances as ua')
            ->join('users as u', 'u.id', '=', 'ua.user_id')
            ->where('ua.attended_date', $today)
            ->orderBy('ua.created_at')
            ->select(['u.name', 'ua.consecutive_days', 'ua.created_at'])
            ->get()
            ->map(function ($row, $index) {
                return [
                    'rank'             => $index + 1,
                    'name'             => mb_substr($row->name, 0, 1) . str_repeat('*', max(0, mb_strlen($row->name) - 1)),
                    'consecutive_days' => $row->consecutive_days,
                    'checked_at'       => $row->created_at,
                ];
            })
            ->values();

        return Inertia::render('Attendance/AttendancePage', [
            'checkedToday'           => $checkedToday,
            'consecutive'            => $consecutive,
            'recentDates'            => $recentDates,
            'attendancePointEnabled' => SiteSetting::get('attendance_point_enabled', '0') === '1',
            'attendancePointAmount'  => (int) SiteSetting::get('attendance_point_amount', '0'),
            'bonusEnabled'           => SiteSetting::get('attendance_bonus_enabled', '0') === '1',
            'bonusDays'              => $bonusDays,
            'bonusAmount'            => (int) SiteSetting::get('attendance_bonus_amount', '0'),
            'nextBonusIn'            => $nextBonus,
            'todayRanking'           => $todayRanking,
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['message' => '로그인이 필요합니다.'], 401);
        }

        $result = AttendanceService::checkIn(Auth::id());

        // 출석 성공 시 내 랭킹 순위 반환
        if ($result['status'] === 'success') {
            $today = today()->toDateString();
            $rank  = DB::table('user_attendances')
                ->where('attended_date', $today)
                ->where('created_at', '<=', DB::table('user_attendances')
                    ->where('user_id', Auth::id())
                    ->where('attended_date', $today)
                    ->value('created_at')
                )
                ->count();
            $result['rank'] = $rank;
        }

        return response()->json($result);
    }
}
