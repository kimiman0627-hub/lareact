<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Service\Main\MainController;
use App\Http\Controllers\Service\Auth\AuthController;
use App\Http\Controllers\Service\Board\BoardController;
use App\Http\Controllers\Service\Board\CommentController;

// 서비스 메인
Route::get('/', [MainController::class, 'index']);

// 게시판
Route::get('/board/{category}', [BoardController::class, 'index'])->name('board.index');
Route::get('/post/{id}', [BoardController::class, 'show'])->name('post.show');

// 댓글 (로그인 필요)
Route::middleware('auth')->group(function () {
    Route::post('/post/{id}/comments', [CommentController::class, 'store'])->name('comment.store');
    Route::delete('/comment/{id}', [CommentController::class, 'destroy'])->name('comment.destroy');
});
Route::get('/classic', [MainController::class, 'classic']);

// 페이지 보여주기
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');

// 데이터 처리 (POST)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

