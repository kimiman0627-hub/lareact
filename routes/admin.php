<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\Auth\AuthController;
use App\Http\Controllers\Admin\Main\MainController;
use App\Http\Controllers\Admin\User\UserController;


// 관리자 

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:admin'])->group(function () {
    // 관리자 로그아웃 (반드시 post 방식 권장)
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    
    Route::get('/', [MainController::class, 'index']);
    // 유저 관리 API 리소스 (index, create, store, show, edit, update, destroy 자동 생성)
    Route::resource('users', UserController::class);
});

