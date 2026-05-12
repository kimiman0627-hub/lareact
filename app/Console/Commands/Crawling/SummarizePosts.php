<?php

namespace App\Console\Commands\Crawling;

use App\Services\SummaryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SummarizePosts extends Command
{
    protected $signature   = 'posts:summarize
                                {--limit=20 : 한 번에 처리할 최대 게시물 수}
                                {--post-id= : 특정 게시물 ID만 처리}';
    protected $description = '요약이 없는 크롤링 게시물에 AI 요약을 생성합니다';

    public function handle(SummaryService $summary): int
    {
        $postId = $this->option('post-id');
        $limit  = (int) $this->option('limit');

        $query = DB::table('posts')
            ->whereNotNull('source')          // 크롤링 게시물만
            ->where('post_status', 'ACTIVE')
            ->whereRaw("(post_data->>'summary') IS NULL"); // 요약 없는 것만

        if ($postId) {
            $query->where('post_id', $postId);
        } else {
            $query->orderByDesc('post_id')->limit($limit);
        }

        $posts = $query->get(['post_id', 'title', 'content', 'post_data']);

        if ($posts->isEmpty()) {
            $this->info('요약할 게시물이 없습니다.');
            return 0;
        }

        $this->info("총 {$posts->count()}개 게시물 요약 시작...");
        $ok = $fail = 0;

        foreach ($posts as $post) {
            $result = $summary->summarize($post->content ?? '');

            if ($result === null) {
                $this->warn("  [SKIP] #{$post->post_id} — 요약 생성 실패");
                $fail++;
                continue;
            }

            $raw      = $post->post_data;
            $postData = is_array($raw)
                ? $raw
                : (is_string($raw) && $raw !== '' ? json_decode($raw, true) ?? [] : []);

            $postData['summary'] = $result;

            DB::table('posts')
                ->where('post_id', $post->post_id)
                ->update(['post_data' => json_encode($postData, JSON_UNESCAPED_UNICODE)]);

            $this->line("  [OK]   #{$post->post_id} — {$post->title}");
            $ok++;

            // API 레이트리밋 방지
            usleep(300_000);
        }

        $this->info("완료: 성공 {$ok} / 실패 {$fail}");
        return 0;
    }
}
