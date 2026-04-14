<?php

namespace App\Http\Controllers\Service\Auth;

use App\Http\Controllers\Controller;
use App\Models\User\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Lib\Stats\StatRecorder;

class AuthController extends Controller
{
    // 회원가입 페이지 호출
    public function showRegister()
    {
        return Inertia::render('Auth/Register');
    }

    // 회원가입 처리
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        Auth::login($user);
        StatRecorder::recordRegister();
        return redirect('/');
    }

    // 로그인 페이지 호출
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    // 로그인 처리
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            StatRecorder::recordLogin();
            return redirect()->intended('/');
        }

        return back()->withErrors(['email' => '이메일 또는 비밀번호가 일치하지 않습니다.']);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
