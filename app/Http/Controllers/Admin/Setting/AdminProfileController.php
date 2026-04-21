<?php

namespace App\Http\Controllers\Admin\Setting;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminProfileController extends Controller
{
    public function index()
    {
        Inertia::setRootView('admin');

        return Inertia::render('Setting/AdminProfile', [
            'admin' => Auth::guard('admin')->user(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $admin = Auth::guard('admin')->user();

        $validated = $request->validate([
            'name'  => 'required|string|max:100',
            'email' => ['required', 'email', Rule::unique('admins', 'email')->ignore($admin->id)],
        ]);

        $admin->name  = $validated['name'];
        $admin->email = $validated['email'];
        $admin->save();

        return back();
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $admin = Auth::guard('admin')->user();

        if (!Hash::check($request->current_password, $admin->password)) {
            return back()->withErrors(['current_password' => '현재 비밀번호가 일치하지 않습니다.']);
        }

        $admin->password = Hash::make($request->password);
        $admin->save();

        return back();
    }
}
