<?php

// app/Http/Controllers/Admin/Auth/AuthController.php
namespace App\Http\Controllers\Admin\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin() {
        Inertia::setRootView('admin'); // admin.blade.php 사용
        return Inertia::render('Auth/Login'); // Admin/Auth/Login.jsx 렌더링
    }

    public function login(Request $request) {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // [중요] admin 가드를 사용하여 admins 테이블에서 찾습니다.
        if (Auth::guard('admin')->attempt($credentials)) {
            $request->session()->regenerate();
            return redirect()->intended('/admin');
        }

        return back()->withErrors(['email' => '관리자 정보가 일치하지 않습니다.']);
    }

    public function logout(Request $request) {
        Auth::guard('admin')->logout(); // 관리자 가드 종료
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/admin/login');
    }
}
