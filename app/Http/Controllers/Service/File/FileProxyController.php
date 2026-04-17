<?php

namespace App\Http\Controllers\Service\File;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;

class FileProxyController extends Controller
{
    /**
     * NCP 비공개 버킷의 파일을 프록시로 서빙.
     *
     * 보안 레이어:
     *  1. Referer 체크  — 우리 도메인 외 요청 차단 (핫링킹 방지)
     *  2. Rate limiting — throttle:file-proxy 미들웨어 (route에서 지정)
     *  3. Cache-Control — 브라우저 1일 캐시로 반복 요청 최소화
     *
     * path 파라미터는 "uploads/post/123/uuid.jpg" 형태 (슬래시 포함).
     */
    public function serve(Request $request, string $path): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\Response
    {
        // ── 1. Referer 체크 ──────────────────────────────────────────────
        // 브라우저가 페이지에서 이미지를 요청할 때는 반드시 Referer를 전송함.
        // Referer가 없거나 우리 도메인이 아니면 403.
        $referer = $request->header('Referer', '');
        $appUrl  = rtrim(config('app.url'), '/');

        if (!$this->isAllowedReferer($referer, $appUrl)) {
            abort(403, 'Forbidden');
        }

        // ── 2. 경로 보안 검증 ────────────────────────────────────────────
        // 디렉터리 트래버설 방지: ".." 포함 경로 차단
        if (str_contains($path, '..') || str_contains($path, "\0")) {
            abort(400, 'Invalid path');
        }

        // ── 3. NCP 버킷에서 파일 조회 ────────────────────────────────────
        $disk = Storage::disk('ncp');

        if (!$disk->exists($path)) {
            abort(404);
        }

        $mimeType = $disk->mimeType($path) ?: 'application/octet-stream';
        $fileSize = $disk->size($path);

        // ── 4. 스트리밍 응답 ────────────────────────────────────────────
        // Content-Disposition: inline — 브라우저에서 바로 표시
        // Cache-Control: public, max-age=86400 — 브라우저 1일 캐시
        //   (재방문 시 서버 요청 없음 → 서버 부하 최소화)
        $stream = $disk->readStream($path);

        return response()->stream(
            function () use ($stream) {
                fpassthru($stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }
            },
            200,
            [
                'Content-Type'        => $mimeType,
                'Content-Length'      => $fileSize,
                'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
                'Cache-Control'       => 'public, max-age=86400',
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }

    /**
     * Referer 허용 여부 확인.
     *
     * 허용 조건:
     *  - Referer 없음: 직접 URL 접근 시도로 간주해 거부
     *    (브라우저는 같은 도메인 페이지에서 이미지 로딩 시 항상 Referer 전송)
     *  - Referer가 우리 앱 URL로 시작: 허용
     */
    private function isAllowedReferer(string $referer, string $appUrl): bool
    {
        if ($referer === '') {
            return false;
        }

        // 앱 URL로 시작하는 referer만 허용
        return str_starts_with($referer, $appUrl);
    }
}
