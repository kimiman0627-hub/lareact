<?php

namespace App\Http\Controllers\Admin\Setting;

use App\Http\Controllers\Controller;
use App\Lib\Threads\ThreadsService;
use App\Models\Setting\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Google\Client as GoogleClient;

class ApiKeyController extends Controller
{
    public function index()
    {
        Inertia::setRootView('admin');

        $s = SiteSetting::allCached();

        return Inertia::render('Setting/ApiKeys', [
            'settings' => [
                'kakao_js_key'            => $s['kakao_js_key']       ?? '',
                'blogger_blog_id'         => $s['blogger_blog_id']    ?? '',
                'blogger_client_id'       => $s['blogger_client_id']  ?? '',
                'blogger_has_secret'      => !empty($s['blogger_client_secret']),
                'blogger_has_token'       => !empty($s['blogger_refresh_token']),
                'blogger_min_hits'        => $s['blogger_min_hits']       ?? '100',
                'blogger_limit'           => $s['blogger_limit']          ?? '5',
                'blogger_days'            => $s['blogger_days']           ?? '7',
                'blogger_enabled'         => $s['blogger_enabled']        ?? '0',
                'blogger_schedule_type'   => $s['blogger_schedule_type']  ?? 'daily',
                'blogger_schedule_time'   => $s['blogger_schedule_time']  ?? '09:00',
                'blogger_callback_url'    => route('admin.settings.blogger.callback'),
                // Threads
                'threads_app_id'          => $s['threads_app_id']          ?? '',
                'threads_has_app_secret'  => !empty($s['threads_app_secret']),
                'threads_has_token'       => !empty($s['threads_access_token']),
                'threads_user_id'         => $s['threads_user_id']         ?? '',
                'threads_callback_url'    => route('admin.settings.threads.callback'),
                'threads_min_hits'        => $s['threads_min_hits']        ?? '50',
                'threads_limit'           => $s['threads_limit']           ?? '3',
                'threads_days'            => $s['threads_days']            ?? '7',
                'threads_enabled'         => $s['threads_enabled']         ?? '0',
                'threads_schedule_type'   => $s['threads_schedule_type']   ?? 'daily',
                'threads_schedule_time'   => $s['threads_schedule_time']   ?? '10:00',
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'kakao_js_key'           => 'nullable|string|max:200',
            'blogger_blog_id'        => 'nullable|string|max:200',
            'blogger_client_id'      => 'nullable|string|max:200',
            'blogger_client_secret'  => 'nullable|string|max:300',
            'blogger_refresh_token'  => 'nullable|string|max:500',
            'blogger_min_hits'       => 'nullable|integer|min:0',
            'blogger_limit'          => 'nullable|integer|min:1|max:50',
            'blogger_days'           => 'nullable|integer|min:1|max:365',
            'blogger_enabled'        => 'nullable|in:0,1',
            'blogger_schedule_type'  => 'nullable|in:daily,hourly',
            'blogger_schedule_time'  => 'nullable|regex:/^\d{2}:\d{2}$/',
            // Threads
            'threads_app_id'         => 'nullable|string|max:200',
            'threads_app_secret'     => 'nullable|string|max:300',
            'threads_access_token'   => 'nullable|string|max:500',
            'threads_min_hits'       => 'nullable|integer|min:0',
            'threads_limit'          => 'nullable|integer|min:1|max:50',
            'threads_days'           => 'nullable|integer|min:1|max:365',
            'threads_enabled'        => 'nullable|in:0,1',
            'threads_schedule_type'  => 'nullable|in:daily,hourly',
            'threads_schedule_time'  => 'nullable|regex:/^\d{2}:\d{2}$/',
        ]);

        // 요청에 포함된 필드만 저장 (섹션별 개별 저장 지원)
        if ($request->has('kakao_js_key'))          SiteSetting::set('kakao_js_key',          $validated['kakao_js_key']          ?? '');
        if ($request->has('blogger_blog_id'))        SiteSetting::set('blogger_blog_id',        $validated['blogger_blog_id']        ?? '');
        if ($request->has('blogger_client_id'))      SiteSetting::set('blogger_client_id',      $validated['blogger_client_id']      ?? '');
        if ($request->has('blogger_min_hits'))        SiteSetting::set('blogger_min_hits',       (string) ($validated['blogger_min_hits']  ?? 100));
        if ($request->has('blogger_limit'))           SiteSetting::set('blogger_limit',          (string) ($validated['blogger_limit']     ?? 5));
        if ($request->has('blogger_days'))            SiteSetting::set('blogger_days',           (string) ($validated['blogger_days']      ?? 7));
        if ($request->has('blogger_enabled'))         SiteSetting::set('blogger_enabled',        $validated['blogger_enabled']        ?? '0');
        if ($request->has('blogger_schedule_type'))   SiteSetting::set('blogger_schedule_type',  $validated['blogger_schedule_type']  ?? 'daily');
        if ($request->has('blogger_schedule_time'))   SiteSetting::set('blogger_schedule_time',  $validated['blogger_schedule_time']  ?? '09:00');

        if (!empty($validated['blogger_client_secret'])) {
            SiteSetting::set('blogger_client_secret', $validated['blogger_client_secret']);
        }
        if (!empty($validated['blogger_refresh_token'])) {
            SiteSetting::set('blogger_refresh_token', $validated['blogger_refresh_token']);
        }

        // Threads 설정 저장
        if ($request->has('threads_app_id'))        SiteSetting::set('threads_app_id',        $validated['threads_app_id']        ?? '');
        if (!empty($validated['threads_app_secret'])) SiteSetting::set('threads_app_secret', $validated['threads_app_secret']);
        if ($request->has('threads_min_hits'))      SiteSetting::set('threads_min_hits',      (string) ($validated['threads_min_hits']     ?? 50));
        if ($request->has('threads_limit'))         SiteSetting::set('threads_limit',         (string) ($validated['threads_limit']        ?? 3));
        if ($request->has('threads_days'))          SiteSetting::set('threads_days',          (string) ($validated['threads_days']         ?? 7));
        if ($request->has('threads_enabled'))       SiteSetting::set('threads_enabled',       $validated['threads_enabled']       ?? '0');
        if ($request->has('threads_schedule_type')) SiteSetting::set('threads_schedule_type', $validated['threads_schedule_type'] ?? 'daily');
        if ($request->has('threads_schedule_time')) SiteSetting::set('threads_schedule_time', $validated['threads_schedule_time'] ?? '10:00');

        // 토큰 저장 시 User ID 자동 조회
        if (!empty($validated['threads_access_token'])) {
            SiteSetting::set('threads_access_token', $validated['threads_access_token']);
            try {
                $userId = ThreadsService::fetchUserId($validated['threads_access_token']);
                SiteSetting::set('threads_user_id', $userId);
            } catch (\Throwable $e) {
                return back()->with('error', 'Threads 토큰은 저장됐지만 User ID 조회에 실패했습니다: ' . $e->getMessage());
            }
        }

        return back()->with('success', '저장되었습니다.');
    }

    // ── Google OAuth 시작 ─────────────────────────────────────────────
    public function bloggerAuthStart()
    {
        $clientId     = SiteSetting::get('blogger_client_id');
        $clientSecret = SiteSetting::get('blogger_client_secret');

        if (!$clientId || !$clientSecret) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', 'Client ID와 Client Secret을 먼저 저장하세요.');
        }

        $state = bin2hex(random_bytes(16));
        session(['blogger_oauth_state' => $state]);

        $client = new GoogleClient();
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri(route('admin.settings.blogger.callback'));
        $client->setScopes(['https://www.googleapis.com/auth/blogger']);
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->setState($state);

        return redirect($client->createAuthUrl());
    }

    // ── Google OAuth 콜백 ─────────────────────────────────────────────
    public function bloggerAuthCallback(Request $request)
    {
        // 관리자 로그인 상태 확인 (미들웨어 밖이므로 직접 체크)
        if (!auth('admin')->check()) {
            return redirect()->route('admin.login');
        }

        $storedState = session('blogger_oauth_state');

        if (!$storedState || $request->input('state') !== $storedState) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', '유효하지 않은 인증 요청입니다. 다시 시도해 주세요.');
        }

        if ($request->has('error')) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', '인증이 취소되었습니다: ' . $request->input('error'));
        }

        $code = $request->input('code');
        if (!$code) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', '인증 코드를 받지 못했습니다.');
        }

        $clientId     = SiteSetting::get('blogger_client_id');
        $clientSecret = SiteSetting::get('blogger_client_secret');

        $client = new GoogleClient();
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri(route('admin.settings.blogger.callback'));

        try {
            $token = $client->fetchAccessTokenWithAuthCode($code);
        } catch (\Throwable $e) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', '토큰 발급 실패: ' . $e->getMessage());
        }

        if (isset($token['error'])) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', '토큰 오류: ' . ($token['error_description'] ?? $token['error']));
        }

        $refreshToken = $token['refresh_token'] ?? null;
        if (!$refreshToken) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', 'Refresh Token을 받지 못했습니다. Google Cloud Console에서 앱 동의를 초기화한 후 다시 시도하세요.');
        }

        SiteSetting::set('blogger_refresh_token', $refreshToken);
        session()->forget('blogger_oauth_state');

        return redirect()->route('admin.settings.api-keys')
            ->with('success', 'Google Blogger 계정 연결이 완료되었습니다.');
    }

    // ── 연결 해제 ─────────────────────────────────────────────────────
    public function bloggerDisconnect()
    {
        SiteSetting::set('blogger_refresh_token', '');

        return redirect()->route('admin.settings.api-keys')
            ->with('success', 'Google Blogger 연결이 해제되었습니다.');
    }

    // ── Threads OAuth 시작 ────────────────────────────────────────────
    public function threadsAuthStart()
    {
        $appId     = SiteSetting::get('threads_app_id');
        $appSecret = SiteSetting::get('threads_app_secret');

        if (!$appId || !$appSecret) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', 'App ID와 App Secret을 먼저 저장하세요.');
        }

        $state = bin2hex(random_bytes(16));
        session(['threads_oauth_state' => $state]);

        $params = http_build_query([
            'client_id'     => $appId,
            'redirect_uri'  => route('admin.settings.threads.callback'),
            'scope'         => 'threads_basic,threads_content_publish',
            'response_type' => 'code',
            'state'         => $state,
        ]);

        return redirect('https://threads.net/oauth/authorize?' . $params);
    }

    // ── Threads OAuth 콜백 ────────────────────────────────────────────
    public function threadsAuthCallback(Request $request)
    {
        if (!auth('admin')->check()) {
            return redirect()->route('admin.login');
        }

        $storedState = session('threads_oauth_state');

        if (!$storedState || $request->input('state') !== $storedState) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', '유효하지 않은 인증 요청입니다. 다시 시도해 주세요.');
        }

        if ($request->has('error')) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', '인증이 취소되었습니다: ' . $request->input('error'));
        }

        $code = $request->input('code');
        if (!$code) {
            return redirect()->route('admin.settings.api-keys')
                ->with('error', '인증 코드를 받지 못했습니다.');
        }

        $appId     = SiteSetting::get('threads_app_id');
        $appSecret = SiteSetting::get('threads_app_secret');

        // 단기 토큰 발급
        $tokenRes = \Illuminate\Support\Facades\Http::asForm()->post(
            'https://graph.threads.net/oauth/access_token',
            [
                'client_id'     => $appId,
                'client_secret' => $appSecret,
                'grant_type'    => 'authorization_code',
                'redirect_uri'  => route('admin.settings.threads.callback'),
                'code'          => $code,
            ]
        );

        if (!$tokenRes->ok()) {
            $error = $tokenRes->json('error_message') ?? $tokenRes->body();
            return redirect()->route('admin.settings.api-keys')
                ->with('error', '단기 토큰 발급 실패: ' . $error);
        }

        $shortToken = $tokenRes->json('access_token');

        // Long-lived 토큰으로 교환 (60일)
        $longRes = \Illuminate\Support\Facades\Http::get(
            'https://graph.threads.net/access_token',
            [
                'grant_type'    => 'th_exchange_token',
                'client_secret' => $appSecret,
                'access_token'  => $shortToken,
            ]
        );

        $accessToken = $longRes->ok() ? ($longRes->json('access_token') ?? $shortToken) : $shortToken;

        SiteSetting::set('threads_access_token', $accessToken);

        try {
            $userId = ThreadsService::fetchUserId($accessToken);
            SiteSetting::set('threads_user_id', $userId);
        } catch (\Throwable $e) {
            $request->session()->forget('threads_oauth_state');
            return redirect()->route('admin.settings.api-keys')
                ->with('error', '토큰은 저장됐지만 User ID 조회 실패: ' . $e->getMessage());
        }

        $request->session()->forget('threads_oauth_state');

        return redirect()->route('admin.settings.api-keys')
            ->with('success', 'Threads 계정 연결이 완료되었습니다.');
    }

    // ── Threads 연결 해제 ──────────────────────────────────────────────
    public function threadsDisconnect()
    {
        SiteSetting::set('threads_access_token', '');
        SiteSetting::set('threads_user_id', '');

        return redirect()->route('admin.settings.api-keys')
            ->with('success', 'Threads 연결이 해제되었습니다.');
    }

    // ── Meta 앱 사용 해제 콜백 (deauthorize) ──────────────────────────
    // 사용자가 앱 권한을 제거할 때 Meta가 POST로 호출
    public function threadsDeauthorize(Request $request): \Illuminate\Http\JsonResponse
    {
        $payload = $this->parseMetaSignedRequest($request);

        if ($payload && isset($payload['user_id'])) {
            $userId = $payload['user_id'];
            if ($userId === SiteSetting::get('threads_user_id')) {
                SiteSetting::set('threads_access_token', '');
                SiteSetting::set('threads_user_id', '');
            }
        }

        return response()->json(['success' => true]);
    }

    // ── Meta 사용자 데이터 삭제 콜백 ──────────────────────────────────
    // Meta 앱 심사 필수 항목: 사용자가 데이터 삭제 요청 시 호출됨
    public function threadsDataDeletion(Request $request): \Illuminate\Http\JsonResponse
    {
        $payload = $this->parseMetaSignedRequest($request);

        if (!$payload || !isset($payload['user_id'])) {
            return response()->json(['error' => 'invalid request'], 400);
        }

        $userId = $payload['user_id'];
        $confirmationCode = hash('sha256', $userId . now()->timestamp . config('app.key'));

        // 해당 유저가 연결된 계정이면 토큰 삭제
        if ($userId === SiteSetting::get('threads_user_id')) {
            SiteSetting::set('threads_access_token', '');
            SiteSetting::set('threads_user_id', '');
        }

        // Threads 발행 로그에서 해당 유저 관련 기록 삭제
        \Illuminate\Support\Facades\DB::table('threads_logs')
            ->where('message', 'like', "%{$userId}%")
            ->delete();

        $statusUrl = url('/threads/deletion-status?id=' . $confirmationCode);

        return response()->json([
            'url'               => $statusUrl,
            'confirmation_code' => $confirmationCode,
        ]);
    }

    // ── 데이터 삭제 상태 확인 페이지 (Meta가 검증용으로 접근) ─────────
    public function threadsDeletionStatus(Request $request): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'status'  => 'deleted',
            'message' => 'User data has been deleted.',
        ]);
    }

    // ── Meta signed_request 파싱/검증 ─────────────────────────────────
    private function parseMetaSignedRequest(Request $request): ?array
    {
        $signedRequest = $request->input('signed_request');
        if (!$signedRequest) {
            return null;
        }

        $parts = explode('.', $signedRequest, 2);
        if (count($parts) !== 2) {
            return null;
        }

        [$encodedSig, $encodedPayload] = $parts;

        $appSecret = SiteSetting::get('threads_app_secret');
        if (!$appSecret) {
            return null;
        }

        // 서명 검증
        $expectedSig = hash_hmac('sha256', $encodedPayload, $appSecret, true);
        $decodedSig  = base64_decode(strtr($encodedSig, '-_', '+/'));

        if (!hash_equals($expectedSig, $decodedSig)) {
            return null;
        }

        $payload = json_decode(base64_decode(strtr($encodedPayload, '-_', '+/')), true);
        return is_array($payload) ? $payload : null;
    }
}
