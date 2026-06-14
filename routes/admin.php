<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\Auth\AuthController;
use App\Http\Controllers\Admin\Main\MainController;
use App\Http\Controllers\Admin\User\UserController;
use App\Http\Controllers\Admin\Board\PostController;
use App\Http\Controllers\Admin\Board\BoardController;
use App\Http\Controllers\Admin\Board\CommentController;
use App\Http\Controllers\Admin\Board\LikeController;
use App\Http\Controllers\Admin\Board\ScrapController as AdminScrapController;
use App\Http\Controllers\Admin\Banner\BannerController;
use App\Http\Controllers\Admin\Banner\BannerStatController as AdminBannerStatController;
use App\Http\Controllers\Admin\File\FileController;
use App\Http\Controllers\Admin\Crawl\CrawlLogController;
use App\Http\Controllers\Admin\Inquiry\InquiryController as AdminInquiryController;
use App\Http\Controllers\Admin\Report\ReportController as AdminReportController;
use App\Http\Controllers\Admin\Stats\StatController;
use App\Http\Controllers\Admin\Setting\SiteSettingController;
use App\Http\Controllers\Admin\Setting\MenuSettingController;
use App\Http\Controllers\Admin\Blogger\BloggerLogController;
use App\Http\Controllers\Admin\Threads\ThreadsLogController;
use App\Http\Controllers\Admin\Setting\ApiKeyController;
use App\Http\Controllers\Admin\Setting\AdminProfileController;
use App\Http\Controllers\Admin\AdminManager\AdminManagerController;

// 관리자

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);

// OAuth 콜백 — 인증 미들웨어 밖에 두어야 리다이렉트 후 세션이 유지됨
Route::get('settings/blogger/callback', [ApiKeyController::class, 'bloggerAuthCallback'])->name('settings.blogger.callback');
Route::get('settings/threads/callback', [ApiKeyController::class, 'threadsAuthCallback'])->name('settings.threads.callback');
Route::post('settings/threads/deauthorize', [ApiKeyController::class, 'threadsDeauthorize'])->name('settings.threads.deauthorize');
Route::post('settings/threads/delete',      [ApiKeyController::class, 'threadsDataDeletion'])->name('settings.threads.delete');

Route::middleware(['auth:admin', 'admin.permission'])->group(function () {
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
    Route::get('users/search',              [UserController::class, 'search'])->name('users.search');
    Route::get('users/{user}/activities',   [UserController::class, 'activities'])->name('users.activities');
    Route::resource('users', UserController::class);

    Route::get('posts/search', [PostController::class, 'search'])->name('posts.search');
    Route::delete('posts/bulk', [PostController::class, 'destroyBulk'])->name('posts.bulk-destroy');
    Route::resource('posts', PostController::class);
    Route::resource('boards', BoardController::class);

    Route::get('likes',              [LikeController::class,   'index'])->name('likes.index');
    Route::get('scraps',             [AdminScrapController::class, 'index'])->name('scraps.index');
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

    // 통계
    Route::get('stats/users',      [StatController::class, 'index'])->name('stats.users');
    Route::get('stats/banners',    [AdminBannerStatController::class, 'index'])->name('stats.banners');

    // 사이트 설정
    Route::get('settings/site',     [SiteSettingController::class, 'index'])->name('settings.site');
    Route::post('settings/site',    [SiteSettingController::class, 'update'])->name('settings.site.update');

    // 메뉴 설정
    Route::get('settings/menu',     [MenuSettingController::class, 'index'])->name('settings.menu');
    Route::post('settings/menu',    [MenuSettingController::class, 'update'])->name('settings.menu.update');

    // Blogger 발행 로그
    Route::get('blogger/logs',            [BloggerLogController::class, 'index'])->name('blogger.logs');
    Route::post('blogger/publish-now',    [BloggerLogController::class, 'publishNow'])->name('blogger.publish-now');
    Route::post('blogger/publish-post',   [BloggerLogController::class, 'publishPost'])->name('blogger.publish-post');
    Route::delete('blogger/logs/{id}',    [BloggerLogController::class, 'destroy'])->name('blogger.logs.destroy');

    // Threads 발행 로그
    Route::get('threads/logs',             [ThreadsLogController::class, 'index'])->name('threads.logs');
    Route::post('threads/publish-now',     [ThreadsLogController::class, 'publishNow'])->name('threads.publish-now');
    Route::post('threads/publish-post',    [ThreadsLogController::class, 'publishPost'])->name('threads.publish-post');
    Route::post('threads/preview-text',    [ThreadsLogController::class, 'previewText'])->name('threads.preview-text');
    Route::delete('threads/logs/{id}',     [ThreadsLogController::class, 'destroy'])->name('threads.logs.destroy');

    // API 키 관리
    Route::get('settings/api-keys',            [ApiKeyController::class, 'index'])->name('settings.api-keys');
    Route::post('settings/api-keys',           [ApiKeyController::class, 'update'])->name('settings.api-keys.update');
    Route::get('settings/blogger/auth',        [ApiKeyController::class, 'bloggerAuthStart'])->name('settings.blogger.auth');
    Route::post('settings/blogger/disconnect', [ApiKeyController::class, 'bloggerDisconnect'])->name('settings.blogger.disconnect');
    Route::get('settings/threads/auth',        [ApiKeyController::class, 'threadsAuthStart'])->name('settings.threads.auth');
    Route::post('settings/threads/disconnect', [ApiKeyController::class, 'threadsDisconnect'])->name('settings.threads.disconnect');

    // 관리자 프로필 (자기 자신)
    Route::get('settings/profile',   [AdminProfileController::class, 'index'])->name('settings.profile');
    Route::post('settings/profile',  [AdminProfileController::class, 'updateProfile'])->name('settings.profile.update');
    Route::post('settings/password', [AdminProfileController::class, 'updatePassword'])->name('settings.password.update');

    // 관리자 관리 (슈퍼 관리자 전용)
    Route::get('admins',                       [AdminManagerController::class, 'index'])->name('admins.index');
    Route::post('admins',                      [AdminManagerController::class, 'store'])->name('admins.store');
    Route::put('admins/{id}',                  [AdminManagerController::class, 'update'])->name('admins.update');
    Route::post('admins/{id}/password',        [AdminManagerController::class, 'updatePassword'])->name('admins.password');
    Route::put('admins/{id}/permissions',      [AdminManagerController::class, 'updatePermissions'])->name('admins.permissions');
    Route::delete('admins/{id}',               [AdminManagerController::class, 'destroy'])->name('admins.destroy');
});

