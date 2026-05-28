<?php

namespace App\Lib\Threads;

use App\Models\Board\Post;
use App\Models\Setting\SiteSetting;
use Illuminate\Support\Facades\Http;

class ThreadsService
{
    private const API_BASE = 'https://graph.threads.net/v1.0';
    private const MAX_TEXT_LENGTH = 500;

    private string $accessToken;
    private string $userId;

    public function __construct()
    {
        $this->accessToken = SiteSetting::get('threads_access_token', '');
        $this->userId      = SiteSetting::get('threads_user_id', '');

        if (!$this->accessToken || !$this->userId) {
            throw new \RuntimeException('관리자 API 키 관리 페이지에서 Threads 액세스 토큰과 User ID를 저장하세요.');
        }
    }

    /**
     * 게시물을 Threads에 발행하고 media_id를 반환.
     */
    public function publish(Post $post, string $customText = ''): array
    {
        $text = $customText ?: $this->buildText($post);

        $containerId = $this->createContainer($text);
        $mediaId     = $this->publishContainer($containerId);

        return [
            'media_id'  => $mediaId,
            'permalink' => $this->getPermalink($mediaId),
        ];
    }

    /**
     * 게시물 제목 + summary(또는 본문 앞부분) + URL로 Threads 텍스트 구성.
     */
    public function buildText(Post $post): string
    {
        $siteUrl  = rtrim(env('APP_URL', ''), '/');
        $postUrl  = "{$siteUrl}/post/{$post->post_id}";

        $postData = is_array($post->post_data)
            ? $post->post_data
            : (is_string($post->post_data) && $post->post_data !== '' ? json_decode($post->post_data, true) ?? [] : []);

        $summary = $postData['summary'] ?? '';

        if (!$summary) {
            $plain   = strip_tags($post->content ?? '');
            $summary = mb_substr($plain, 0, 120);
        }

        $title   = $post->title ?? '';
        $urlLine = $postUrl;

        // 500자 제한에 맞게 summary 길이 조정
        $fixed   = mb_strlen($title) + mb_strlen($urlLine) + 4; // \n\n + \n
        $maxSummary = self::MAX_TEXT_LENGTH - $fixed;

        if ($maxSummary > 0 && $summary) {
            $summary = mb_substr($summary, 0, $maxSummary);
        } else {
            $summary = '';
        }

        $parts = array_filter([$title, $summary, $urlLine]);
        return implode("\n\n", $parts);
    }

    /**
     * Threads 텍스트 컨테이너 생성 → creation_id 반환.
     */
    private function createContainer(string $text): string
    {
        $response = Http::timeout(15)->post(
            self::API_BASE . "/{$this->userId}/threads",
            [
                'media_type'   => 'TEXT',
                'text'         => $text,
                'access_token' => $this->accessToken,
            ]
        );

        if (!$response->ok()) {
            $error = $response->json('error.message') ?? $response->body();
            throw new \RuntimeException("컨테이너 생성 실패: {$error}");
        }

        return $response->json('id');
    }

    /**
     * 컨테이너 발행 → Threads media_id 반환.
     */
    private function publishContainer(string $containerId): string
    {
        $response = Http::timeout(15)->post(
            self::API_BASE . "/{$this->userId}/threads_publish",
            [
                'creation_id'  => $containerId,
                'access_token' => $this->accessToken,
            ]
        );

        if (!$response->ok()) {
            $error = $response->json('error.message') ?? $response->body();
            throw new \RuntimeException("발행 실패: {$error}");
        }

        return $response->json('id');
    }

    /**
     * media_id로 Threads 퍼머링크 조회.
     */
    private function getPermalink(string $mediaId): string
    {
        $response = Http::timeout(10)->get(
            self::API_BASE . "/{$mediaId}",
            [
                'fields'       => 'permalink',
                'access_token' => $this->accessToken,
            ]
        );

        return $response->json('permalink') ?? '';
    }

    /**
     * 액세스 토큰으로 User ID 조회 (설정 저장 시 사용).
     */
    public static function fetchUserId(string $accessToken): string
    {
        $response = Http::timeout(10)->get(
            self::API_BASE . '/me',
            [
                'fields'       => 'id,username',
                'access_token' => $accessToken,
            ]
        );

        if (!$response->ok()) {
            $error = $response->json('error.message') ?? $response->body();
            throw new \RuntimeException("User ID 조회 실패: {$error}");
        }

        return $response->json('id');
    }
}
