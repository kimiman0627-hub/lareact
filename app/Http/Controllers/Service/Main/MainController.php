<?php

// app/Http/Controllers/Service/Main/MainController.php
namespace App\Http\Controllers\Service\Main;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class MainController extends Controller
{
    public function index()
    {
        // 1. 기본 레이아웃(app.blade.php) 사용 (생략 가능)
        Inertia::setRootView('app');

        // 2. 서비스용 리액트 페이지 렌더링 (Service 폴더 내 Index.jsx)
        return Inertia::render('Main/Index');
    }
}
