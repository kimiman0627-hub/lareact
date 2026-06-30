<?php

use Illuminate\Support\Facades\Schedule;
use App\Models\Setting\SiteSetting;

// 크롤링 — 2시간 간격, 크롤러끼리 시작 분(minute) 분산
Schedule::command('crawl:dogdrip')->cron('0 */2 * * *');       // 매 짝수시 :00
Schedule::command('crawl:dcinside')->cron('30 */2 * * *');     // 매 짝수시 :30
Schedule::command('crawl:etoland')->cron('15 */2 * * *');      // 매 짝수시 :15
Schedule::command('crawl:fomos')->cron('10 */2 * * *');        // 매 짝수시 :10
Schedule::command('crawl:bobaedream')->cron('20 */2 * * *');   // 매 짝수시 :20
// Schedule::command('crawl:theqoo')->cron('45 */2 * * *');    // 매 짝수시 :45

// AI 요약 — 2시간 간격 (크롤링 5분 후)
Schedule::command('posts:summarize --limit=20')->cron('5 */2 * * *');

// Threads 자동 발행 — 매분 체크, 설정한 시각에만 실행
Schedule::command('threads:publish --force')
    ->everyMinute()
    ->when(function () {
        if (SiteSetting::get('threads_enabled', '0') !== '1') return false;
        $type      = SiteSetting::get('threads_schedule_type', 'daily');
        $scheduled = SiteSetting::get('threads_schedule_time', '10:00');
        if ($type === 'hourly') {
            [, $minute] = explode(':', $scheduled);
            return now()->format('i') === $minute;
        }
        return now()->format('H:i') === $scheduled;
    });

// Blogger 자동 발행 — 매분 체크, 설정한 시각에만 실행
Schedule::command('blogger:publish --force')
    ->everyMinute()
    ->when(function () {
        if (SiteSetting::get('blogger_enabled', '0') !== '1') return false;
        $type      = SiteSetting::get('blogger_schedule_type', 'daily');
        $scheduled = SiteSetting::get('blogger_schedule_time', '09:00');
        if ($type === 'hourly') {
            [, $minute] = explode(':', $scheduled);
            return now()->format('i') === $minute;
        }
        return now()->format('H:i') === $scheduled;
    });
