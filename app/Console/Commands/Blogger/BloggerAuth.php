<?php

namespace App\Console\Commands\Blogger;

use Illuminate\Console\Command;
use App\Models\Setting\SiteSetting;
use Google\Client;

class BloggerAuth extends Command
{
    protected $signature = 'blogger:auth';
    protected $description = 'Google Blogger OAuth2 인증 (최초 1회 실행 → DB에 refresh_token 저장)';

    public function handle(): int
    {
        $clientId     = SiteSetting::get('blogger_client_id');
        $clientSecret = SiteSetting::get('blogger_client_secret');

        if (!$clientId || !$clientSecret) {
            $this->error('관리자 설정 페이지에서 Blogger Client ID / Client Secret 을 먼저 저장하세요.');
            return 1;
        }

        $client = new Client();
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setRedirectUri('urn:ietf:wg:oauth:2.0:oob');
        $client->setScopes(['https://www.googleapis.com/auth/blogger']);
        $client->setAccessType('offline');
        $client->setPrompt('consent');

        $authUrl = $client->createAuthUrl();

        $this->info('아래 URL을 브라우저에서 열고 Google 계정으로 로그인하세요:');
        $this->line($authUrl);
        $this->newLine();

        $code = $this->ask('인증 코드를 붙여넣으세요');

        try {
            $token = $client->fetchAccessTokenWithAuthCode($code);
        } catch (\Throwable $e) {
            $this->error('토큰 발급 실패: ' . $e->getMessage());
            return 1;
        }

        if (isset($token['error'])) {
            $this->error('토큰 오류: ' . ($token['error_description'] ?? $token['error']));
            return 1;
        }

        $refreshToken = $token['refresh_token'] ?? null;
        if (!$refreshToken) {
            $this->error('refresh_token을 받지 못했습니다. Google Cloud Console에서 앱을 "테스트" 상태로 설정했는지 확인하세요.');
            return 1;
        }

        SiteSetting::set('blogger_refresh_token', $refreshToken);

        $this->info('✅ 인증 성공! Refresh Token이 DB에 저장되었습니다.');

        return 0;
    }
}
