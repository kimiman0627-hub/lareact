<?php

namespace App\Http\Controllers\Admin\Point;

use App\Http\Controllers\Controller;
use App\Lib\User\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    private const PER_PAGE = 30;

    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $params = $request->validate([
            'keyword'    => 'nullable|string|max:100',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date',
            'page'       => 'nullable|integer|min:1',
        ]);

        $page = max(1, (int) ($params['page'] ?? 1));

        $base = DB::table('user_attendances as ua')
            ->join('users as u', 'u.id', '=', 'ua.user_id')
            ->select([
                'ua.id', 'ua.attended_date', 'ua.consecutive_days', 'ua.created_at',
                'u.id as user_id', 'u.name as user_name', 'u.email as user_email',
            ]);

        if (!empty($params['keyword'])) {
            $kw = '%' . $params['keyword'] . '%';
            $base->where(function ($q) use ($kw) {
                $q->where('u.name', 'like', $kw)
                  ->orWhere('u.email', 'like', $kw);
            });
        }

        if (!empty($params['start_date'])) {
            $base->where('ua.attended_date', '>=', $params['start_date']);
        }

        if (!empty($params['end_date'])) {
            $base->where('ua.attended_date', '<=', $params['end_date']);
        }

        $total = (clone $base)->count();
        $items = (clone $base)
            ->orderByDesc('ua.attended_date')
            ->orderByDesc('ua.id')
            ->offset(($page - 1) * self::PER_PAGE)
            ->limit(self::PER_PAGE)
            ->get();

        $list = new LengthAwarePaginator($items, $total, self::PER_PAGE, $page, [
            'path'  => $request->url(),
            'query' => $request->query(),
        ]);

        // 유저 목록 (수동 출석 추가용 검색에 사용)
        return Inertia::render('Point/AttendanceList', [
            'list'   => $list,
            'total'  => $total,
            'params' => $params,
        ]);
    }

    /**
     * 관리자: 유저에게 특정 날짜 출석 수동 추가
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'date'    => 'required|date_format:Y-m-d',
        ]);

        $result = AttendanceService::adminAdd((int) $validated['user_id'], $validated['date']);

        if (!$result['success']) {
            return back()->withErrors(['date' => $result['message']]);
        }

        return back()->with('success', "출석 기록이 추가되었습니다. (연속 {$result['consecutive']}일)");
    }

    /**
     * 관리자: 출석 기록 삭제
     */
    public function destroy(int $id)
    {
        $record = DB::table('user_attendances')->where('id', $id)->first();

        if (!$record) {
            return back()->withErrors(['id' => '기록을 찾을 수 없습니다.']);
        }

        DB::table('user_attendances')->where('id', $id)->delete();

        // 삭제된 날짜 이후 연속일 재계산
        AttendanceService::recalculateFrom((int) $record->user_id, $record->attended_date);

        return back()->with('success', '출석 기록이 삭제되었습니다.');
    }
}
