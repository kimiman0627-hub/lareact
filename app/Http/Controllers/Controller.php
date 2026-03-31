<?php

namespace App\Http\Controllers;
use Illuminate\Http\JsonResponse;

abstract class Controller
{
    /**
     * 성공 응답 (200 OK)
     */
    protected function success($data = null, $message = null): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $data,
            'message' => $message,
            'errors'  => null,
        ], 200);
    }

    /**
     * 에러 응답 (기본 400 Bad Request)
     */
    protected function error($message = '오류가 발생했습니다.', $errors = null, int $code = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data'    => null,
            'message' => $message,
            'errors'  => $errors, // 유효성 검사 실패 시 상세 에러 객체 등
        ], $code);
    }
}
