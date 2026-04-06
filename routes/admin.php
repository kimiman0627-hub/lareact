<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\Auth\AuthController;
use App\Http\Controllers\Admin\Main\MainController;
use App\Http\Controllers\Admin\User\UserController;
use App\Http\Controllers\Admin\Board\PostController;
use App\Http\Controllers\Admin\Banner\BannerController;
use App\Http\Controllers\Admin\File\FileController;

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

    Route::resource('posts', PostController::class);

    Route::patch('banners/{banner}/order', [BannerController::class, 'order'])->name('banners.order');
    Route::resource('banners', BannerController::class);

    Route::post('files/upload', [FileController::class, 'upload'])->name('files.upload');
});

