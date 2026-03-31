<?php
// app/Http/Controllers/Admin/Main/MainController.php
namespace App\Http\Controllers\Admin\Main;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class MainController extends Controller
{
    public function index()
    {
        // 1. 관리자 전용 레이아웃(admin.blade.php) 사용
        Inertia::setRootView('admin');

        // 2. 관리자용 리액트 페이지 렌더링 (Admin 폴더 내 Index.jsx)
        return Inertia::render('Main/Index');
    }
}
