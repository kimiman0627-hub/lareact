<?php

namespace App\Console\Commands\Threads;

use App\Lib\Threads\ThreadsService;
use App\Models\Board\Post;
use App\Models\Setting\SiteSetting;
use App\Models\Threads\ThreadsLog;
use Illuminate\Console\Command;

class PublishToThreads extends Command
{
    protected $signature = 'threads:publish
        {--post-id=   : 특정 게시물 1건만 즉시 발행 (다른 필터 무시)}
        {--text=      : 커스텀 텍스트 (미지정 시 제목+요약+URL 자동 생성)}
        {--limit=     : 1회 실행당 최대 발행 수 (미지정 시 DB 설정값 사용)}
        {--min-hits=  : 최소 조회수 기준 (미지정 시 DB 설정값 사용)}
        {--days=      : 최근 N일 이내 게시물만 대상 (미지정 시 DB 설정값 사용)}
        {--force      : 스케줄 활성화 여부 무시하고 강제 실행}
        {--dry-run    : 실제 발행 없이 대상만 출력}';

    protected $description = '최근 인기 크롤링 게시물을 Threads에 자동 발행';

    public function handle(): int
    {
        if ($postId = (int) $this->option('post-id')) {
            return $this->publishSingle($postId, $this->option('text') ?? '');
        }

        $dryRun = $this->option('dry-run');
        $force  = $this->option('force');

        if (!$force && !$dryRun) {
            if (SiteSetting::get('threads_enabled', '0') !== '1') {
                $this->info('자동 발행이 비활성화 상태입니다. (관리자 → API 키 관리에서 활성화)');
                return 0;
            }
        }

        $limit   = (int) ($this->option('limit')    ?: SiteSetting::get('threads_limit',    '3'));
        $minHits = (int) ($this->option('min-hits') ?: SiteSetting::get('threads_min_hits', '50'));
        $days    = (int) ($this->option('days')     ?: SiteSetting::get('threads_days',     '7'));

        $posts = Post::query()
            ->whereNotNull('source')
            ->where('post_status', 'ACTIVE')
            ->where('hits', '>=', $minHits)
            ->where('created_at', '>=', now()->subDays($days))
            ->whereRaw("(post_data->>'threads_media_id') IS NULL")
            ->orderByDesc('hits')
            ->limit($limit)
            ->get(['post_id', 'title', 'content', 'post_category', 'source', 'hits', 'post_data', 'created_at']);

        if ($posts->isEmpty()) {
            $this->info("발행 대상 없음 (최근 {$days}일, hits >= {$minHits}, 미발행 게시물)");
            return 0;
        }

        $this->info("발행 대상: {$posts->count()}건 (최근 {$days}일, hits >= {$minHits})");

        if ($dryRun) {
            $this->table(
                ['post_id', 'hits', '등록일', 'source', '제목'],
                $posts->map(fn($p) => [
                    $p->post_id,
                    $p->hits,
                    $p->created_at->format('m-d'),
                    $p->source,
                    mb_substr($p->title, 0, 45),
                ])
            );
            return 0;
        }

        try {
            $service = new ThreadsService();
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            ThreadsLog::create([
                'post_id'    => null,
                'post_title' => '[인증 실패]',
                'status'     => 'FAILED',
                'message'    => $e->getMessage(),
            ]);
            return 1;
        }

        $published = 0;
        $failed    = 0;

        foreach ($posts as $post) {
            try {
                $result = $service->publish($post);

                $postData = is_array($post->post_data)
                    ? $post->post_data
                    : (is_string($post->post_data) && $post->post_data !== '' ? json_decode($post->post_data, true) ?? [] : []);
                $postData['threads_media_id']    = $result['media_id'];
                $postData['threads_permalink']   = $result['permalink'];
                $postData['threads_published_at'] = now()->toIso8601String();
                $post->post_data = $postData;
                $post->save();

                ThreadsLog::create([
                    'post_id'           => $post->post_id,
                    'post_title'        => $post->title,
                    'hits'              => $post->hits,
                    'source'            => $post->source,
                    'threads_media_id'  => $result['media_id'],
                    'threads_permalink' => $result['permalink'],
                    'status'            => 'SUCCESS',
                    'message'           => null,
                ]);

                $this->line("✅ [{$post->post_id}] {$post->title} → {$result['permalink']}");
                $published++;

                sleep(2);
            } catch (\Throwable $e) {
                ThreadsLog::create([
                    'post_id'    => $post->post_id,
                    'post_title' => $post->title,
                    'hits'       => $post->hits,
                    'source'     => $post->source,
                    'status'     => 'FAILED',
                    'message'    => $e->getMessage(),
                ]);

                $this->error("❌ [{$post->post_id}] 발행 실패: " . $e->getMessage());
                $failed++;
            }
        }

        $this->newLine();
        $this->info("완료 — 성공: {$published}, 실패: {$failed}");

        return $failed > 0 ? 1 : 0;
    }

    private function publishSingle(int $postId, string $customText = ''): int
    {
        $post = Post::find($postId, ['post_id', 'title', 'content', 'post_category', 'source', 'hits', 'post_data']);

        if (!$post) {
            $this->error("게시물({$postId})을 찾을 수 없습니다.");
            return 1;
        }

        try {
            $service = new ThreadsService();
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            ThreadsLog::create([
                'post_id'    => $post->post_id,
                'post_title' => $post->title,
                'status'     => 'FAILED',
                'message'    => $e->getMessage(),
            ]);
            return 1;
        }

        try {
            $result = $service->publish($post, $customText);

            $postData = is_array($post->post_data)
                ? $post->post_data
                : (is_string($post->post_data) && $post->post_data !== '' ? json_decode($post->post_data, true) ?? [] : []);
            $postData['threads_media_id']    = $result['media_id'];
            $postData['threads_permalink']   = $result['permalink'];
            $postData['threads_published_at'] = now()->toIso8601String();
            $post->post_data = $postData;
            $post->save();

            ThreadsLog::create([
                'post_id'           => $post->post_id,
                'post_title'        => $post->title,
                'hits'              => $post->hits,
                'source'            => $post->source,
                'threads_media_id'  => $result['media_id'],
                'threads_permalink' => $result['permalink'],
                'status'            => 'SUCCESS',
                'message'           => null,
            ]);

            $this->line("✅ [{$post->post_id}] {$post->title} → {$result['permalink']}");
            return 0;
        } catch (\Throwable $e) {
            ThreadsLog::create([
                'post_id'    => $post->post_id,
                'post_title' => $post->title,
                'hits'       => $post->hits,
                'source'     => $post->source,
                'status'     => 'FAILED',
                'message'    => $e->getMessage(),
            ]);

            $this->error("발행 실패: " . $e->getMessage());
            return 1;
        }
    }
}
