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
use App\Http\Controllers\Service\File\FileProxyController;
use App\Http\Controllers\Service\File\FileController;
use App\Http\Controllers\Service\Banner\BannerStatController;
use App\Http\Controllers\Service\StockController;
use App\Http\Controllers\Service\PolicyController;
use App\Http\Controllers\Service\Lottery\LottoController;
use App\Http\Middleware\HandleInertiaRequests;

// 가상화폐 시세 API — Upbit CORS 우회 프록시 (throttle: 분당 30회)
Route::withoutMiddleware([HandleInertiaRequests::class])
    ->middleware('throttle:30,1')
    ->get('/api/crypto', [StockController::class, 'crypto'])
    ->name('api.crypto');

// 주식 시세 API (Inertia 미들웨어 제외 — JSON 응답, throttle: 분당 30회)
Route::withoutMiddleware([HandleInertiaRequests::class])
    ->middleware('throttle:30,1')
    ->get('/api/stocks', [StockController::class, 'index'])
    ->name('api.stocks');

// 주식 시세 상세 API — 상위 20개 (페이지 전용)
Route::withoutMiddleware([HandleInertiaRequests::class])
    ->middleware('throttle:30,1')
    ->get('/api/stocks/detail', [StockController::class, 'detail'])
    ->name('api.stocks.detail');

// 금/은 시세 API (throttle: 분당 30회)
Route::withoutMiddleware([HandleInertiaRequests::class])
    ->middleware('throttle:30,1')
    ->get('/api/metals', [StockController::class, 'metals'])
    ->name('api.metals');

// 환율 API (throttle: 분당 30회)
Route::withoutMiddleware([HandleInertiaRequests::class])
    ->middleware('throttle:30,1')
    ->get('/api/exchange-rates', [StockController::class, 'exchangeRates'])
    ->name('api.exchange-rates');

// NCP 비공개 버킷 파일 프록시
// - HandleInertiaRequests 제외: JSON 응답이 아닌 파일 스트림
// - throttle:file-proxy: IP당 분당 120회 제한
Route::withoutMiddleware([HandleInertiaRequests::class])
    ->middleware('throttle:file-proxy')
    ->get('/file/{path}', [FileProxyController::class, 'serve'])
    ->where('path', '.+')
    ->name('file.proxy');

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
Route::get('/post/write', [BoardController::class, 'create'])->name('post.create')->middleware('auth');
Route::get('/post/{id}', [BoardController::class, 'show'])->name('post.show');

// 로그인 필요
Route::middleware('auth')->group(function () {
    // 게시글 작성/파일업로드
    Route::post('/post/write', [BoardController::class, 'store'])->name('post.store');
    Route::post('/files/upload', [FileController::class, 'upload'])->name('file.upload');

    // 댓글
    Route::delete('/post/{id}', [BoardController::class, 'destroy'])->name('post.destroy');
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

// 배너 통계 기록 (throttle: IP당 분당 120회)
Route::middleware('throttle:120,1')->group(function () {
    Route::post('/banner/{id}/impression', [BannerStatController::class, 'impression'])->name('banner.impression');
    Route::post('/banner/{id}/click',      [BannerStatController::class, 'click'])->name('banner.click');
});

// 정책/소개 페이지
Route::get('/about',   [PolicyController::class, 'about'])->name('about');
Route::get('/privacy', [PolicyController::class, 'privacy'])->name('privacy');
Route::get('/terms',   [PolicyController::class, 'terms'])->name('terms');

// 페이지 보여주기
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');

// 데이터 처리 (POST)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// 주식 시세 페이지
Route::get('/stock', [StockController::class, 'page'])->name('stock');

//
Route::get('/lottery/lotto', [LottoController::class, 'index'])->name('lottery.lotto');

// 로또 당첨번호 API — DB 조회 기반
Route::withoutMiddleware([HandleInertiaRequests::class])
    ->get('/api/lottery/lotto/results', [LottoController::class, 'results'])
    ->name('api.lottery.lotto.results');