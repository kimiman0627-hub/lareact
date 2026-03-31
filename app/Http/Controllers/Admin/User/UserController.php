<?php

namespace App\Http\Controllers\Admin\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\User\User;
use App\Lib\User\User as UserLib;
use Inertia\Inertia;


class UserController extends Controller
{
    // 리스트 페이지
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $params = self::validateIndex($request);
        
        $userLib = new UserLib($params);
        $list = $userLib->getUserList($params);
        $total = $userLib->getUserCount($params);
        if ($list === false || $total === false) {
            return $this->error($userLib->resultMessage, null, 500);
        }

        $paginatedData = new LengthAwarePaginator(
            $list, 
            $total, 
            $this->params['per_page'] ?? 20, 
            $this->params['page'] ?? 1, 
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('User/Index', [
            'users' => $paginatedData,
            'total' => $total,
            'params' => $params
        ]);
    }

    public function validateIndex(Request $request)
    {
       $params = $request->validate([
            'id'          => 'nullable|string|max:100',
            'name'        => 'nullable|string|max:100',
            'email'       => 'nullable|string|max:100',
            'search_type' => 'nullable|in:id,name,email,all',
            'keyword'     => 'nullable|string|max:100',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date',
            'per_page'    => 'nullable|integer|min:1,max:100',
            'page'        => 'nullable|integer|min:1',
        ]);
        return $params;
    }

    public function getUserList(Request $request)
    {
        $params = self::validateIndex($request);
        $userLib = new UserLib($params);
        $data = [
            'list' => $userLib->getUserList($params),
            'total' => $userLib->getUserCount($params), 
            'params' => $params, 
        ];
        return $this->success($data);
    }

    protected function setUser(Request $request)
    {
        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => [
                'required', 'email', 'max:255',
                Rule::unique('users')->ignore($request->id),
            ],
            'password' => $request->id ? 'nullable|min:8' : 'required|min:8',
        ]);

        if ($request->filled('password')) {
            $data['password'] = bcrypt($request->password);
        } else {
            unset($data['password']);
        }

        // id가 있으면 update, 없으면 create
        User::updateOrCreate(['id' => $request->id], $data);

        return redirect()->back()->with('message', '저장되었습니다.');
    }

    public function store(Request $request)
    {
        return $this->setUser($request);
    }

    public function update(Request $request, $id)
    {
        // update 요청이 오면 id를 request에 강제로 심어서 save로 보냅니다.
        $request->merge(['id' => $id]); 
        return $this->setUser($request);
    }

    // 삭제
    public function destroy($id)
    {
        User::findOrFail($id)->delete();
        return redirect()->back()->with('message', '삭제되었습니다.');
    }
}
