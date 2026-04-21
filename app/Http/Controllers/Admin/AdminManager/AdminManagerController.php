<?php

namespace App\Http\Controllers\Admin\AdminManager;

use App\Http\Controllers\Controller;
use App\Models\Admin\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminManagerController extends Controller
{
    private function requireSuper(): void
    {
        if (!Auth::guard('admin')->user()->is_super) {
            abort(403, '슈퍼 관리자만 접근할 수 있습니다.');
        }
    }

    public function index()
    {
        $this->requireSuper();
        Inertia::setRootView('admin');

        return Inertia::render('AdminManager/Index', [
            'admins'    => Admin::orderBy('id')->get(['id', 'name', 'email', 'is_super', 'menu_permissions', 'created_at']),
            'menuItems' => config('admin.menu'),
        ]);
    }

    public function store(Request $request)
    {
        $this->requireSuper();

        $validated = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:admins,email',
            'password' => 'required|string|min:8|confirmed',
            'is_super' => 'boolean',
        ]);

        Admin::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_super' => $validated['is_super'] ?? false,
        ]);

        return back();
    }

    public function update(Request $request, int $id)
    {
        $me = Auth::guard('admin')->user();
        if (!$me->is_super && (int) $me->id !== $id) {
            abort(403);
        }

        $admin = Admin::findOrFail($id);

        $validated = $request->validate([
            'name'  => 'required|string|max:100',
            'email' => ['required', 'email', Rule::unique('admins', 'email')->ignore($id)],
        ]);

        $admin->name  = $validated['name'];
        $admin->email = $validated['email'];
        $admin->save();

        return back();
    }

    public function updatePassword(Request $request, int $id)
    {
        $me    = Auth::guard('admin')->user();
        $admin = Admin::findOrFail($id);
        $isSelf = (int) $me->id === $id;

        if (!$isSelf && !$me->is_super) {
            abort(403);
        }

        if ($isSelf) {
            $request->validate([
                'current_password' => 'required|string',
                'password'         => 'required|string|min:8|confirmed',
            ]);
            if (!Hash::check($request->current_password, $admin->password)) {
                return back()->withErrors(['current_password' => '현재 비밀번호가 일치하지 않습니다.']);
            }
        } else {
            $request->validate([
                'password' => 'required|string|min:8|confirmed',
            ]);
        }

        $admin->password = Hash::make($request->password);
        $admin->save();

        return back();
    }

    public function updatePermissions(Request $request, int $id)
    {
        $this->requireSuper();

        $admin = Admin::findOrFail($id);

        $request->validate([
            'is_super'           => 'boolean',
            'menu_permissions'   => 'nullable|array',
            'menu_permissions.*' => 'string',
        ]);

        $admin->is_super         = $request->boolean('is_super');
        $admin->menu_permissions = $admin->is_super ? null : $request->input('menu_permissions');
        $admin->save();

        return back();
    }

    public function destroy(int $id)
    {
        $this->requireSuper();

        if ((int) Auth::guard('admin')->id() === $id) {
            return back()->withErrors(['error' => '자기 자신은 삭제할 수 없습니다.']);
        }

        Admin::findOrFail($id)->delete();

        return back();
    }
}
