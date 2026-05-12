<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SummaryService
{
    private const API_URL = 'https://api.anthropic.com/v1/messages';
    private const MODEL   = 'claude-haiku-4-5-20251001';
    private const MAX_TOKENS = 300;

    public function summarize(string $html): ?string
    {
        $apiKey = config('services.anthropic.key');
        if (!$apiKey) {
            return null;
        }

        $text = $this->stripHtml($html);
        if (mb_strlen($text) < 100) {
            return null;
        }

        // 너무 긴 본문은 앞 3000자만 사용
        $text = mb_substr($text, 0, 3000);

        try {
            $response = Http::withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(20)->post(self::API_URL, [
                'model'      => self::MODEL,
                'max_tokens' => self::MAX_TOKENS,
                'messages'   => [
                    [
                        'role'    => 'user',
                        'content' => "다음 게시글을 한국어로 2~3문장으로 간결하게 요약해주세요. 핵심 내용만 담고, 별도 서문이나 \"요약:\" 같은 레이블 없이 바로 요약문만 출력하세요.\n\n{$text}",
                    ],
                ],
            ]);

            if (!$response->successful()) {
                Log::warning('SummaryService API error', ['status' => $response->status(), 'body' => $response->body()]);
                return null;
            }

            $summary = trim($response->json('content.0.text') ?? '');
            return $summary ?: null;

        } catch (\Throwable $e) {
            Log::warning('SummaryService exception', ['message' => $e->getMessage()]);
            return null;
        }
    }

    private function stripHtml(string $html): string
    {
        // 스크립트/스타일 제거
        $html = preg_replace('/<(script|style)[^>]*>.*?<\/\1>/is', '', $html);
        // 태그 제거
        $text = strip_tags($html);
        // HTML 엔티티 디코딩
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        // 연속 공백/줄바꿈 정리
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }
}
