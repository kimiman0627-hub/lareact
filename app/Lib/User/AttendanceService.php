<?php

namespace App\Lib\User;

use App\Models\Setting\SiteSetting;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    /**
     * 오늘 출석 체크 처리
     * returns: ['status' => 'success'|'already', 'consecutive' => int, 'point' => int, 'bonus' => int]
     */
    public static function checkIn(int $userId): array
    {
        $today = today()->toDateString();

        $existing = DB::table('user_attendances')
            ->where('user_id', $userId)
            ->where('attended_date', $today)
            ->first();

        if ($existing) {
            return [
                'status'      => 'already',
                'consecutive' => $existing->consecutive_days,
                'point'       => 0,
                'bonus'       => 0,
            ];
        }

        // 어제 출석 기록 확인 → 연속일 계산
        $yesterday  = today()->subDay()->toDateString();
        $prevRecord = DB::table('user_attendances')
            ->where('user_id', $userId)
            ->where('attended_date', $yesterday)
            ->first();

        $consecutive = $prevRecord ? $prevRecord->consecutive_days + 1 : 1;

        DB::table('user_attendances')->insert([
            'user_id'          => $userId,
            'attended_date'    => $today,
            'consecutive_days' => $consecutive,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $pointEarned = 0;
        $bonusEarned = 0;

        // 출석 포인트
        if (SiteSetting::get('attendance_point_enabled', '0') === '1') {
            $amount = (int) SiteSetting::get('attendance_point_amount', '0');
            if ($amount > 0) {
                PointService::earn($userId, $amount, 'ATTENDANCE', '출석체크', null, null);
                $pointEarned = $amount;
            }
        }

        // 연속 출석 보너스
        if (SiteSetting::get('attendance_bonus_enabled', '0') === '1') {
            $bonusDays   = (int) SiteSetting::get('attendance_bonus_days', '10');
            $bonusAmount = (int) SiteSetting::get('attendance_bonus_amount', '0');

            if ($bonusDays > 0 && $bonusAmount > 0 && $consecutive % $bonusDays === 0) {
                PointService::earn($userId, $bonusAmount, 'ATTENDANCE_BONUS', "연속출석 {$consecutive}일 보너스", null, null);
                $bonusEarned = $bonusAmount;
            }
        }

        return [
            'status'      => 'success',
            'consecutive' => $consecutive,
            'point'       => $pointEarned,
            'bonus'       => $bonusEarned,
        ];
    }

    /**
     * 특정 유저의 최근 N일 출석 날짜 목록
     */
    public static function getRecentDates(int $userId, int $days = 30): array
    {
        return DB::table('user_attendances')
            ->where('user_id', $userId)
            ->where('attended_date', '>=', today()->subDays($days)->toDateString())
            ->orderBy('attended_date')
            ->pluck('attended_date')
            ->map(fn($d) => (string) $d)
            ->toArray();
    }

    /**
     * 특정 유저의 현재 연속 출석일
     */
    public static function getCurrentConsecutive(int $userId): int
    {
        $today = today()->toDateString();
        $record = DB::table('user_attendances')
            ->where('user_id', $userId)
            ->whereIn('attended_date', [$today, today()->subDay()->toDateString()])
            ->orderByDesc('attended_date')
            ->first();

        return $record ? $record->consecutive_days : 0;
    }

    /**
     * 관리자: 특정 유저의 특정 날짜 출석 추가 (연속일 재계산)
     */
    public static function adminAdd(int $userId, string $date): array
    {
        $exists = DB::table('user_attendances')
            ->where('user_id', $userId)
            ->where('attended_date', $date)
            ->exists();

        if ($exists) {
            return ['success' => false, 'message' => '이미 해당 날짜에 출석 기록이 있습니다.'];
        }

        // 직전 날짜의 연속일 확인
        $prevDate   = date('Y-m-d', strtotime($date . ' -1 day'));
        $prevRecord = DB::table('user_attendances')
            ->where('user_id', $userId)
            ->where('attended_date', $prevDate)
            ->first();

        $consecutive = $prevRecord ? $prevRecord->consecutive_days + 1 : 1;

        DB::table('user_attendances')->insert([
            'user_id'          => $userId,
            'attended_date'    => $date,
            'consecutive_days' => $consecutive,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // 해당 날짜 이후 레코드의 연속일도 재계산
        self::recalculateFrom($userId, $date);

        return ['success' => true, 'consecutive' => $consecutive];
    }

    /**
     * 특정 날짜 이후 연속일 재계산 (관리자 수정 시 사용)
     */
    public static function recalculateFrom(int $userId, string $fromDate): void
    {
        $records = DB::table('user_attendances')
            ->where('user_id', $userId)
            ->where('attended_date', '>', $fromDate)
            ->orderBy('attended_date')
            ->get();

        foreach ($records as $record) {
            $prevDate   = date('Y-m-d', strtotime($record->attended_date . ' -1 day'));
            $prevRecord = DB::table('user_attendances')
                ->where('user_id', $userId)
                ->where('attended_date', $prevDate)
                ->first();

            $consecutive = $prevRecord ? $prevRecord->consecutive_days + 1 : 1;

            DB::table('user_attendances')
                ->where('id', $record->id)
                ->update(['consecutive_days' => $consecutive, 'updated_at' => now()]);
        }
    }
}
