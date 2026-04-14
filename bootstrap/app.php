<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withCommands([
        \App\Console\Commands\Crawling\DogDripScraper::class,
        \App\Console\Commands\Crawling\DcInsideScraper::class,
        \App\Console\Commands\Crawling\EtolandScraper::class,
        \App\Console\Commands\Crawling\TheqooScraper::class,
        \App\Console\Commands\Crawling\FomosScraper::class,
        \App\Console\Commands\Crawling\BobaedreamScraper::class,
    ])
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->prefix('admin')      // 모든 라우트 이름 앞에 admin. 을 자동으로 붙임
                ->name('admin.')       // 라우트 이름 앞에 admin. 붙임
                ->group(base_path('routes/admin.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn (Request $request) => 
            // 1. 주소가 admin으로 시작하거나 admin/ 인 경우
            $request->is('admin') || $request->is('admin/*') 
                ? route('admin.login')  // 관리자 로그인으로 이동
                : route('login')        // 그 외엔 일반 로그인으로 이동
        );
        // web 미들웨어 그룹 맨 뒤에 Inertia 미들웨어를 추가합니다.
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
