<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Service\Main\MainController;
use App\Http\Controllers\Service\Auth\AuthController;

// 서비스 메인
Route::get('/', [MainController::class, 'index']);

// 페이지 보여주기
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');

// 데이터 처리 (POST)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

