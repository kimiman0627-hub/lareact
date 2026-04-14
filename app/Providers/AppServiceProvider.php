<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Setting\SiteSetting;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // 서비스 Blade 템플릿에 사이트 설정 자동 주입
        view()->composer('app', function ($view) {
            $view->with('siteSettings', SiteSetting::allCached());
        });
    }
}
