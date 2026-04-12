<?php

namespace App\Http\Controllers\Service\Board;

use App\Http\Controllers\Controller;
use App\Models\Report\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function store(Request $request, int $postId)
    {
        $request->validate([
            'reason' => ['required', 'in:SPAM,OBSCENE,ILLEGAL,ETC'],
            'detail' => ['nullable', 'string', 'max:500'],
        ]);

        // 게시글 존재 확인
        $exists = DB::table('posts')
            ->where('post_id', $postId)
            ->where('post_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->exists();

        if (!$exists) {
            return response()->json(['message' => '존재하지 않는 게시글입니다.'], 404);
        }

        $userId = auth()->id();
        $ip     = $request->ip();

        // 중복 신고 확인 (로그인: user_id 기준 / 비로그인: IP 기준)
        $alreadyReported = Report::where('post_id', $postId)
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->when(!$userId, fn ($q) => $q->where('ip', $ip)->whereNull('user_id'))
            ->exists();

        if ($alreadyReported) {
            return response()->json(['message' => '이미 신고한 게시글입니다.'], 409);
        }

        Report::create([
            'post_id' => $postId,
            'user_id' => $userId,
            'ip'      => $ip,
            'reason'  => $request->reason,
            'detail'  => $request->detail,
            'status'  => 'PENDING',
        ]);

        return response()->json(['message' => '신고가 접수되었습니다.']);
    }
}
