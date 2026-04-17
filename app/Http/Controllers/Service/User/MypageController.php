<?php

namespace App\Http\Controllers\Service\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class MypageController extends Controller
{
    private const PER_PAGE = 20;

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password'      => ['required'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.required' => '현재 비밀번호를 입력해주세요.',
            'password.required'         => '새 비밀번호를 입력해주세요.',
            'password.min'              => '비밀번호는 최소 8자 이상이어야 합니다.',
            'password.confirmed'        => '새 비밀번호가 일치하지 않습니다.',
        ]);

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => '현재 비밀번호가 올바르지 않습니다.']);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return back()->with('success', '비밀번호가 변경되었습니다.');
    }

    public function index(Request $request)
    {
        Inertia::setRootView('app');

        $tab    = $request->input('tab', 'posts');
        $page   = max(1, (int) $request->input('page', 1));
        $userId = auth()->id();

        $posts     = null;
        $comments  = null;
        $inquiries = null;
        $scraps    = null;

        if ($tab === 'posts') {
            $base = DB::table('posts as p')
                ->join('boards as b', 'p.post_category', '=', 'b.category')
                ->where('p.user_id', $userId)
                ->where('p.post_status', 'ACTIVE')
                ->whereNull('p.source');          // 본인이 직접 작성한 글만

            $total = (clone $base)->count();

            $items = (clone $base)
                ->orderByDesc('p.created_at')
                ->offset(($page - 1) * self::PER_PAGE)
                ->limit(self::PER_PAGE)
                ->get([
                    'p.post_id', 'p.title', 'p.hits', 'p.comment_count', 'p.created_at',
                    'b.board_name', 'b.category as board_category',
                ]);

            $posts = new LengthAwarePaginator($items, $total, self::PER_PAGE, $page, [
                'path'  => $request->url(),
                'query' => $request->query(),
            ]);
        } elseif ($tab === 'comments') {
            $base = DB::table('comments as c')
                ->join('posts as p', 'c.post_id', '=', 'p.post_id')
                ->join('boards as b', 'p.post_category', '=', 'b.category')
                ->where('c.user_id', $userId)
                ->where('p.post_status', 'ACTIVE');

            $total = (clone $base)->count();

            $items = (clone $base)
                ->orderByDesc('c.created_at')
                ->offset(($page - 1) * self::PER_PAGE)
                ->limit(self::PER_PAGE)
                ->get([
                    'c.comment_id', 'c.content', 'c.created_at',
                    'p.post_id', 'p.title as post_title',
                    'b.board_name', 'b.category as board_category',
                ]);

            $comments = new LengthAwarePaginator($items, $total, self::PER_PAGE, $page, [
                'path'  => $request->url(),
                'query' => $request->query(),
            ]);
        } elseif ($tab === 'inquiries') {
            $base = DB::table('inquiries')
                ->where('user_id', $userId)
                ->orderByDesc('created_at');

            $total = (clone $base)->count();

            $items = (clone $base)
                ->offset(($page - 1) * self::PER_PAGE)
                ->limit(self::PER_PAGE)
                ->get(['id', 'type', 'title', 'status', 'created_at', 'answered_at']);

            $inquiries = new LengthAwarePaginator($items, $total, self::PER_PAGE, $page, [
                'path'  => $request->url(),
                'query' => $request->query(),
            ]);
        } elseif ($tab === 'scraps') {
            $base = DB::table('scraps as s')
                ->join('posts as p', 's.post_id', '=', 'p.post_id')
                ->join('users as u', 'p.user_id', '=', 'u.id')
                ->join('boards as b', 'p.post_category', '=', 'b.category')
                ->where('s.user_id', $userId)
                ->where('p.post_status', 'ACTIVE');

            $total = (clone $base)->count();

            $items = (clone $base)
                ->orderByDesc('s.created_at')
                ->offset(($page - 1) * self::PER_PAGE)
                ->limit(self::PER_PAGE)
                ->get([
                    's.id as scrap_id', 's.created_at as scrapped_at',
                    'p.post_id', 'p.title', 'p.hits', 'p.comment_count',
                    'u.name as author',
                    'b.board_name', 'b.category as board_category',
                ]);

            $scraps = new LengthAwarePaginator($items, $total, self::PER_PAGE, $page, [
                'path'  => $request->url(),
                'query' => $request->query(),
            ]);
        }

        return Inertia::render('User/MyPage', [
            'tab'       => $tab,
            'posts'     => $posts,
            'comments'  => $comments,
            'inquiries' => $inquiries,
            'scraps'    => $scraps,
        ]);
    }

    public function inquiryDetail(int $id)
    {
        $inquiry = DB::table('inquiries')
            ->where('id', $id)
            ->where('user_id', auth()->id())
            ->first(['id', 'type', 'title', 'content', 'status', 'answer', 'created_at', 'answered_at']);

        if (!$inquiry) abort(404);

        return response()->json($inquiry);
    }
}
