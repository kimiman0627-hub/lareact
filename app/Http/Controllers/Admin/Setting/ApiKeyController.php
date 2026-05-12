<?php

namespace App\Http\Controllers\Admin\Setting;

use App\Http\Controllers\Controller;
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
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'kakao_js_key'          => 'nullable|string|max:200',
            'blogger_blog_id'       => 'nullable|string|max:200',
            'blogger_client_id'     => 'nullable|string|max:200',
            'blogger_client_secret'  => 'nullable|string|max:300',
            'blogger_refresh_token'  => 'nullable|string|max:500',
            'blogger_min_hits'       => 'nullable|integer|min:0',
            'blogger_limit'          => 'nullable|integer|min:1|max:50',
            'blogger_days'           => 'nullable|integer|min:1|max:365',
            'blogger_enabled'        => 'nullable|in:0,1',
            'blogger_schedule_type'  => 'nullable|in:daily,hourly',
            'blogger_schedule_time'  => 'nullable|regex:/^\d{2}:\d{2}$/',
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
}
