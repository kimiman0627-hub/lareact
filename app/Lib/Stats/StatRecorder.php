<?php

namespace App\Lib\Stats;

use Illuminate\Support\Facades\DB;

class StatRecorder
{
    /**
     * 오늘 날짜의 통계 row를 upsert하여 카운터 증가
     */
    public static function increment(string $column): void
    {
        $today = now()->toDateString();

        DB::table('user_daily_stats')->upsert(
            [
                'stat_date'  => $today,
                $column      => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            ['stat_date'],                    // 유니크 키
            [$column => DB::raw("user_daily_stats.{$column} + 1"), 'updated_at' => now()]
        );
    }

    public static function recordRegister(): void
    {
        self::increment('reg_count');
    }

    public static function recordLogin(): void
    {
        self::increment('login_count');
    }
}
