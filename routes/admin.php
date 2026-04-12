<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\Auth\AuthController;
use App\Http\Controllers\Admin\Main\MainController;
use App\Http\Controllers\Admin\User\UserController;
use App\Http\Controllers\Admin\Board\PostController;
use App\Http\Controllers\Admin\Board\BoardController;
use App\Http\Controllers\Admin\Board\CommentController;
use App\Http\Controllers\Admin\Board\LikeController;
use App\Http\Controllers\Admin\Banner\BannerController;
use App\Http\Controllers\Admin\File\FileController;
use App\Http\Controllers\Admin\Crawl\CrawlLogController;
use App\Http\Controllers\Admin\Inquiry\InquiryController as AdminInquiryController;
use App\Http\Controllers\Admin\Report\ReportController as AdminReportController;

// 관리자 

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:admin'])->group(function () {
    // 관리자 로그아웃 (반드시 post 방식 권장)
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    
    Route::get('/', [MainController::class, 'index'])->name('index');
    
    //   유저 관리 API 리소스 (index, create, store, show, edit, update, destroy 자동 생성)
    //   GET|HEAD        admin/users ........................ admin.users.index › Admin\User\UserController@index
    //   POST            admin/users ........................ admin.users.store › Admin\User\UserController@store
    //   GET|HEAD        admin/users/create ............... admin.users.create › Admin\User\UserController@create
    //   GET|HEAD        admin/users/{user} ................... admin.users.show › Admin\User\UserController@show
    //   PUT|PATCH       admin/users/{user} ............... admin.users.update › Admin\User\UserController@update
    //   DELETE          admin/users/{user} ............. admin.users.destroy › Admin\User\UserController@destroy
    //   GET|HEAD        admin/users/{user}/edit .............. admin.users.edit › Admin\User\UserController@edit
    Route::get('users/search', [UserController::class, 'search'])->name('admin.users.search');
    Route::resource('users', UserController::class);

    Route::get('posts/search', [PostController::class, 'search'])->name('posts.search');
    Route::resource('posts', PostController::class);
    Route::resource('boards', BoardController::class);

    Route::get('likes',              [LikeController::class,   'index'])->name('likes.index');
    Route::get('comments',           [CommentController::class, 'index'])->name('comments.index');
    Route::post('comments',          [CommentController::class, 'store'])->name('comments.store');
    Route::put('comments/{id}',      [CommentController::class, 'update'])->name('comments.update');
    Route::delete('comments/{id}',   [CommentController::class, 'destroy'])->name('comments.destroy');

    Route::patch('banners/{banner}/order', [BannerController::class, 'order'])->name('banners.order');
    Route::resource('banners', BannerController::class);

    Route::post('files/upload', [FileController::class, 'upload'])->name('files.upload');

    // 크롤링 로그
    Route::get('crawl-logs',          [CrawlLogController::class, 'index'])->name('crawl-logs.index');
    Route::get('crawl-logs/{id}',     [CrawlLogController::class, 'show'])->name('crawl-logs.show');

    // 문의 관리
    Route::get('inquiries',               [AdminInquiryController::class, 'index'])->name('inquiries.index');
    Route::get('inquiries/{id}',          [AdminInquiryController::class, 'show'])->name('inquiries.show');
    Route::post('inquiries/{id}/answer',  [AdminInquiryController::class, 'answer'])->name('inquiries.answer');

    // 신고 관리
    Route::get('reports',          [AdminReportController::class, 'index'])->name('reports.index');
    Route::patch('reports/{id}',   [AdminReportController::class, 'update'])->name('reports.update');
});

