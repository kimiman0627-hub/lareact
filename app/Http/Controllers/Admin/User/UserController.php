<?php

namespace App\Http\Controllers\Admin\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
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
            $params['per_page'] ?? 20,
            $params['page']     ?? 1,
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

    // 회원 상세 (JSON) — 상세/수정 모달에서 호출
    public function show($id)
    {
        $user = User::findOrFail($id);

        $stats = [
            'post_count'     => DB::table('posts')->where('user_id', $id)->count(),
            'comment_count'  => DB::table('comments')->where('user_id', $id)->count(),
            'scrap_count'    => DB::table('scraps')->where('user_id', $id)->count(),
            'like_count'     => DB::table('post_likes')->where('user_id', $id)->count(),
            'inquiry_count'  => DB::table('inquiries')->where('user_id', $id)->count(),
        ];

        return response()->json([
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'user_role'         => $user->user_role ?? 'USER',
            'email_verified_at' => $user->email_verified_at,
            'created_at'        => $user->created_at,
            'updated_at'        => $user->updated_at,
            'stats'             => $stats,
        ]);
    }

    // 회원 활동 내역 (JSON) — 탭별 페이지네이션
    public function activities(Request $request, $id)
    {
        User::findOrFail($id); // 존재 확인

        $type    = $request->input('type', 'posts');
        $page    = max(1, (int) $request->input('page', 1));
        $perPage = 15;
        $offset  = ($page - 1) * $perPage;

        switch ($type) {
            case 'posts':
                $total = DB::table('posts')
                    ->where('user_id', $id)->count();
                $items = DB::table('posts as p')
                    ->leftJoin('boards as b', 'p.post_category', '=', 'b.category')
                    ->where('p.user_id', $id)
                    ->orderByDesc('p.created_at')
                    ->offset($offset)->limit($perPage)
                    ->get(['p.post_id', 'p.title', 'p.post_status', 'p.hits',
                           'p.comment_count', 'p.created_at', 'b.board_name']);
                break;

            case 'comments':
                $total = DB::table('comments')
                    ->where('user_id', $id)->count();
                $items = DB::table('comments as c')
                    ->leftJoin('posts as p', 'c.post_id', '=', 'p.post_id')
                    ->where('c.user_id', $id)
                    ->orderByDesc('c.created_at')
                    ->offset($offset)->limit($perPage)
                    ->get(['c.comment_id', 'c.content', 'c.created_at',
                           'p.post_id', 'p.title as post_title']);
                break;

            case 'inquiries':
                $total = DB::table('inquiries')->where('user_id', $id)->count();
                $items = DB::table('inquiries')
                    ->where('user_id', $id)
                    ->orderByDesc('created_at')
                    ->offset($offset)->limit($perPage)
                    ->get(['id', 'title', 'type', 'status', 'created_at', 'answered_at']);
                break;

            default:
                return response()->json(['items' => [], 'total' => 0, 'last_page' => 1, 'page' => 1]);
        }

        return response()->json([
            'items'     => $items,
            'total'     => $total,
            'page'      => $page,
            'per_page'  => $perPage,
            'last_page' => max(1, (int) ceil($total / $perPage)),
        ]);
    }

    public function search(Request $request)
    {
        $request->validate([
            'keyword' => 'required|string|max:100',
        ]);

        $keyword = $request->keyword;
        $users = User::select(['id', 'name', 'email'])
            ->where('id', 'like', "%{$keyword}%")
            ->orWhere('name', 'like', "%{$keyword}%")
            ->orWhere('email', 'like', "%{$keyword}%")
            ->limit(10)
            ->get();

        return $this->success($users);
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
            'name'      => 'required|string|max:255',
            'email'     => [
                'required', 'email', 'max:255',
                Rule::unique('users')->ignore($request->id),
            ],
            'password'  => $request->id ? 'nullable|min:8' : 'required|min:8',
            'user_role' => 'nullable|in:USER,ADMIN,TEST',
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
