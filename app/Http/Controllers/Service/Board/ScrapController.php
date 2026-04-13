<?php

namespace App\Http\Controllers\Service\Board;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ScrapController extends Controller
{
    public function toggle(int $id): JsonResponse
    {
        $userId = auth()->id();

        // 게시글 존재 여부 확인
        $exists = DB::table('posts')
            ->where('post_id', $id)
            ->where('post_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->exists();

        if (!$exists) {
            return response()->json(['message' => '게시글을 찾을 수 없습니다.'], 404);
        }

        $alreadyScrapped = DB::table('scraps')
            ->where('user_id', $userId)
            ->where('post_id', $id)
            ->exists();

        if ($alreadyScrapped) {
            DB::table('scraps')->where('user_id', $userId)->where('post_id', $id)->delete();
            $scrapped = false;
        } else {
            DB::table('scraps')->insert([
                'user_id'    => $userId,
                'post_id'    => $id,
                'created_at' => now(),
            ]);
            $scrapped = true;
        }

        $count = DB::table('scraps')->where('post_id', $id)->count();

        return response()->json(['scrapped' => $scrapped, 'count' => $count]);
    }
}
