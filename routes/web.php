<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Service\Main\MainController;
use App\Http\Controllers\Service\Auth\AuthController;
use App\Http\Controllers\Service\Board\BoardController;
use App\Http\Controllers\Service\Board\PopularController;
use App\Http\Controllers\Service\Board\CommentController;
use App\Http\Controllers\Service\Board\LikeController;
use App\Http\Controllers\Service\Search\SearchController;
use App\Http\Controllers\Service\User\MypageController;
use App\Http\Controllers\Service\Inquiry\InquiryController;
use App\Http\Controllers\Service\Board\ReportController;
use App\Http\Controllers\Service\Board\ScrapController;
use App\Http\Controllers\Service\SitemapController;
use App\Http\Middleware\HandleInertiaRequests;

// 사이트맵 (Inertia 미들웨어 제외 — <script/> 주입 방지)
Route::withoutMiddleware([HandleInertiaRequests::class])->group(function () {
    Route::get('/sitemap.xml',       [SitemapController::class, 'index']);
    Route::get('/sitemap-pages.xml', [SitemapController::class, 'pages']);
    Route::get('/sitemap-posts.xml', [SitemapController::class, 'posts']);
});

// 서비스 메인
Route::get('/', [MainController::class, 'index']);

// 통합검색
Route::get('/search', [SearchController::class, 'index'])->name('search');

// 인기글
Route::get('/popular', [PopularController::class, 'index'])->name('popular');

// 게시판
Route::get('/board/{category}', [BoardController::class, 'index'])->name('board.index');
Route::get('/post/{id}', [BoardController::class, 'show'])->name('post.show');

// 로그인 필요
Route::middleware('auth')->group(function () {
    // 댓글
    Route::post('/post/{id}/comments', [CommentController::class, 'store'])->name('comment.store');
    Route::delete('/comment/{id}', [CommentController::class, 'destroy'])->name('comment.destroy');
    Route::post('/post/{id}/like', [LikeController::class, 'toggle'])->name('post.like');
    Route::post('/post/{id}/report', [ReportController::class, 'store'])->name('post.report');
    Route::post('/post/{id}/scrap', [ScrapController::class, 'toggle'])->name('post.scrap');

    // 마이페이지
    Route::get('/mypage', [MypageController::class, 'index'])->name('mypage');
    Route::post('/mypage/password', [MypageController::class, 'changePassword'])->name('mypage.password');
    Route::get('/mypage/inquiry/{id}', [MypageController::class, 'inquiryDetail'])->name('mypage.inquiry.detail');
});
Route::get('/classic', [MainController::class, 'classic']);

// 문의하기
Route::get('/inquiry', [InquiryController::class, 'create'])->name('inquiry.create');
Route::post('/inquiry', [InquiryController::class, 'store'])->name('inquiry.store');
Route::get('/inquiry/complete', [InquiryController::class, 'complete'])->name('inquiry.complete');

// 페이지 보여주기
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');

// 데이터 처리 (POST)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

