<?php

use Illuminate\Support\Facades\Schedule;

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
