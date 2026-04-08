<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// 개드립 크롤링 - 매시간 실행
Schedule::command('crawl:dogdrip')->hourly();

// DC인사이드 크롤링 - 매시간 30분에 실행 (개드립과 시간 분산)
Schedule::command('crawl:dcinside')->hourlyAt(30);
