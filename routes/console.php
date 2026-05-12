<?php

use Illuminate\Support\Facades\Schedule;
use App\Models\Setting\SiteSetting;

// 개드립 크롤링 - 매시간 실행
Schedule::command('crawl:dogdrip')->hourly();

// DC인사이드 크롤링 - 매시간 30분에 실행 (개드립과 시간 분산)
Schedule::command('crawl:dcinside')->hourlyAt(30);

// // 이토랜드 매시간 15분에 실행 (개드립과 DC인사이드와 시간 분산)
Schedule::command('crawl:etoland')->hourlyAt(15); 

// // 더쿠 크롤링 - 매시간 45분에 실행 (다른 크롤러와 시간 분산)
// Schedule::command('crawl:theqoo')->hourlyAt(45);

// 포모스 크롤링 - 매시간 10분에 실행
Schedule::command('crawl:fomos')->hourlyAt(10);

// 보배드림 크롤링 - 매시간 20분에 실행
Schedule::command('crawl:bobaedream')->hourlyAt(20);

// AI 요약 — 매시 5분에 최대 20개 처리
Schedule::command('posts:summarize --limit=20')->hourlyAt(5);

// Blogger 자동 발행 — 매분 체크, 설정한 시각에만 실행
Schedule::command('blogger:publish --force')
    ->everyMinute()
    ->when(function () {
        if (SiteSetting::get('blogger_enabled', '0') !== '1') return false;
        $type      = SiteSetting::get('blogger_schedule_type', 'daily');
        $scheduled = SiteSetting::get('blogger_schedule_time', '09:00');
        if ($type === 'hourly') {
            // 설정 시각의 '분'만 사용 — 매시 :MM 에 실행
            [, $minute] = explode(':', $scheduled);
            return now()->format('i') === $minute;
        }
        return now()->format('H:i') === $scheduled;
    });
