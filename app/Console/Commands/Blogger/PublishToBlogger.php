<?php

namespace App\Console\Commands\Blogger;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use App\Models\Board\Post;
use App\Models\Blogger\BloggerLog;
use App\Models\Setting\SiteSetting;
use Google\Client;
use Google\Service\Blogger;

class PublishToBlogger extends Command
{
    protected $signature = 'blogger:publish
        {--post-id=   : 특정 게시물 1건만 즉시 발행 (다른 필터 무시)}
        {--limit=     : 1회 실행당 최대 발행 수 (미지정 시 DB 설정값 사용)}
        {--min-hits=  : 최소 조회수 기준 (미지정 시 DB 설정값 사용)}
        {--days=      : 최근 N일 이내 게시물만 대상 (미지정 시 DB 설정값 사용)}
        {--force      : 스케줄 활성화 여부 무시하고 강제 실행}
        {--dry-run    : 실제 발행 없이 대상만 출력}';

    protected $description = '최근 인기 크롤링 게시물을 Google Blogger에 자동 발행';

    public function handle(): int
    {
        // ── 단건 즉시 발행 (--post-id 지정 시) ──────────────────────
        if ($postId = (int) $this->option('post-id')) {
            return $this->publishSingle($postId);
        }

        $dryRun = $this->option('dry-run');
        $force  = $this->option('force');

        // 자동 발행 활성화 체크 (--force 또는 --dry-run 이면 건너뜀)
        if (!$force && !$dryRun) {
            if (SiteSetting::get('blogger_enabled', '0') !== '1') {
                $this->info('자동 발행이 비활성화 상태입니다. (관리자 → API 키 관리에서 활성화)');
                return 0;
            }
        }

        $limit   = (int) ($this->option('limit')    ?: SiteSetting::get('blogger_limit',    '5'));
        $minHits = (int) ($this->option('min-hits') ?: SiteSetting::get('blogger_min_hits', '100'));
        $days    = (int) ($this->option('days')     ?: SiteSetting::get('blogger_days',     '7'));

        // ── 발행 대상 조회 (최근 N일 이내, hits 내림차순) ────────────
        $posts = Post::query()
            ->whereNotNull('source')
            ->where('post_status', 'ACTIVE')
            ->where('hits', '>=', $minHits)
            ->where('created_at', '>=', now()->subDays($days))
            ->whereRaw("(post_data->>'blogger_post_id') IS NULL")
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

        // ── Blogger 클라이언트 초기화 ────────────────────────────────
        try {
            $blogger = $this->makeBloggerService();
        } catch (\Throwable $e) {
            $this->error('Blogger 인증 실패: ' . $e->getMessage());
            BloggerLog::create([
                'post_id'    => null,
                'post_title' => '[인증 실패]',
                'status'     => 'FAILED',
                'message'    => $e->getMessage(),
            ]);
            return 1;
        }

        $blogId = SiteSetting::get('blogger_blog_id');
        if (!$blogId) {
            $this->error('관리자 설정 페이지에서 Blogger Blog ID를 저장하세요.');
            return 1;
        }

        $published = 0;
        $failed    = 0;

        foreach ($posts as $post) {
            try {
                $blogPost = new Blogger\Post();
                $blogPost->setTitle($post->title);
                $blogPost->setContent($this->buildContent($post));
                $blogPost->setLabels($this->buildLabels($post));

                $result = $blogger->posts->insert($blogId, $blogPost);

                $postData = $this->decodePostData($post->post_data);
                $postData['blogger_post_id']     = $result->getId();
                $postData['blogger_url']          = $result->getUrl();
                $postData['blogger_published_at'] = now()->toIso8601String();
                $post->post_data = $postData;
                $post->save();

                BloggerLog::create([
                    'post_id'        => $post->post_id,
                    'post_title'     => $post->title,
                    'hits'           => $post->hits,
                    'source'         => $post->source,
                    'blogger_post_id' => $result->getId(),
                    'blogger_url'    => $result->getUrl(),
                    'status'         => 'SUCCESS',
                    'message'        => null,
                ]);

                $this->line("✅ [{$post->post_id}] {$post->title} → {$result->getUrl()}");
                $published++;

                sleep(1);
            } catch (\Throwable $e) {
                BloggerLog::create([
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

    private function makeBloggerService(): Blogger
    {
        $clientId     = SiteSetting::get('blogger_client_id');
        $clientSecret = SiteSetting::get('blogger_client_secret');
        $refreshToken = SiteSetting::get('blogger_refresh_token');

        if (!$clientId || !$clientSecret || !$refreshToken) {
            throw new \RuntimeException(
                '관리자 API 키 관리 페이지에서 Blogger 설정을 완료하고 Google 계정을 연결하세요.'
            );
        }

        $client = new Client();
        $client->setClientId($clientId);
        $client->setClientSecret($clientSecret);
        $client->setAccessType('offline');

        $tokenData = $client->refreshToken($refreshToken);

        // refreshToken()은 실패해도 예외를 던지지 않고 에러 배열을 반환
        if (!isset($tokenData['access_token'])) {
            $reason = $tokenData['error_description'] ?? ($tokenData['error'] ?? 'unknown');
            throw new \RuntimeException(
                "Google refresh token 갱신 실패: {$reason}. 관리자 → API 키 관리에서 Google 계정을 재연결하세요."
            );
        }

        return new Blogger($client);
    }

    private function buildContent(Post $post): string
    {
        $content = $post->content ?? '';

        $content = $this->rewriteImages($content, $post->post_id);
        $content = $this->rewriteVideoSources($content, $post->post_id);

        $siteUrl  = rtrim(env('APP_URL', ''), '/');
        $postUrl  = $siteUrl . '/post/' . $post->post_id;
        $siteName = SiteSetting::get('site_name', config('app.name', $siteUrl));

        return $content;
    }

    /**
     * <source src="..."> 및 <video src="..."> 를 NCP 퍼블릭 URL로 교체.
     * - /file/... : NCP 비공개 버킷 → 스트리밍 복사 후 퍼블릭 경로
     * - https://... : 50MB 이하 시 다운로드 후 업로드, 초과 또는 실패 시 원본 유지
     */
    private function rewriteVideoSources(string $content, int $postId): string
    {
        $callback = function (array $m) use ($postId, &$tag) {
            $publicUrl = $this->toPublicVideoUrl($m[2], $postId);
            return $publicUrl
                ? "<{$tag}{$m[1]} src=\"{$publicUrl}\""
                : $m[0];
        };

        $tag = 'source';
        $content = preg_replace_callback('/<source([^>]*)\ssrc=["\']([^"\']+)["\']/i', $callback, $content);

        $tag = 'video';
        $content = preg_replace_callback('/<video([^>]*)\ssrc=["\']([^"\']+)["\']/i', $callback, $content);

        return $content;
    }

    /**
     * 콘텐츠 내 img src를 NCP 퍼블릭 URL로 교체.
     * - /file/... : NCP 비공개 버킷 → 퍼블릭 경로에 복사
     * - /storage/... : 로컬 디스크 → NCP 퍼블릭 경로에 복사
     * - https://외부... : 원본 Referer로 다운로드 → NCP 퍼블릭 경로에 저장
     */
    private function rewriteImages(string $content, int $postId): string
    {
        return preg_replace_callback(
            '/<img([^>]*)\ssrc=["\']([^"\']+)["\']/i',
            function (array $m) use ($postId) {
                $publicUrl = $this->toPublicUrl($m[2], $postId);
                if ($publicUrl) {
                    return '<img' . $m[1] . ' src="' . $publicUrl . '"';
                }
                return $m[0];
            },
            $content
        );
    }

    private function toPublicUrl(string $src, int $postId): ?string
    {
        if (str_starts_with($src, 'data:')) {
            return $src;
        }

        $cdnBase = rtrim(env('NCP_CDN_URL', ''), '/');
        if (!$cdnBase) {
            return null;
        }

        // 이미 NCP 퍼블릭 URL이면 그대로 사용
        if (str_starts_with($src, $cdnBase)) {
            return $src;
        }

        $ext  = strtolower(pathinfo(parse_url($src, PHP_URL_PATH), PATHINFO_EXTENSION)) ?: 'jpg';
        $ext  = in_array($ext, ['jpg','jpeg','png','gif','webp','avif']) ? $ext : 'jpg';
        $dest = "blogger/{$postId}/" . md5($src) . ".{$ext}";

        // 이미 업로드된 경우 재사용
        if (Storage::disk('ncp')->exists($dest)) {
            return "{$cdnBase}/{$dest}";
        }

        try {
            $binary = $this->fetchImageBinary($src);
            if (!$binary) {
                return null;
            }
            Storage::disk('ncp')->put($dest, $binary, 'public');
            return "{$cdnBase}/{$dest}";
        } catch (\Throwable) {
            return null;
        }
    }

    private function fetchImageBinary(string $src): ?string
    {
        // NCP 비공개 버킷 (/file/...)
        if (str_starts_with($src, '/file/')) {
            $path = ltrim(substr($src, 6), '/');
            return Storage::disk('ncp')->get($path) ?: null;
        }

        // 로컬 public 스토리지 (/storage/...)
        if (str_starts_with($src, '/storage/')) {
            $path = ltrim(substr($src, 9), '/');
            return Storage::disk('public')->get($path) ?: null;
        }

        // 외부 URL — 원본 도메인을 Referer로 세팅해 핫링크 차단 우회
        if (str_starts_with($src, 'http')) {
            $parsed  = parse_url($src);
            $referer = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
            $res = Http::timeout(15)
                ->withHeaders([
                    'Referer'    => $referer . '/',
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ])
                ->get($src);
            return $res->ok() ? $res->body() : null;
        }

        return null;
    }

    private function toPublicVideoUrl(string $src, int $postId): ?string
    {
        if (str_starts_with($src, 'data:')) return $src;

        $cdnBase = rtrim(env('NCP_CDN_URL', ''), '/');
        if (!$cdnBase) return null;

        if (str_starts_with($src, $cdnBase)) return $src;

        $ext  = strtolower(pathinfo(parse_url($src, PHP_URL_PATH), PATHINFO_EXTENSION)) ?: 'mp4';
        $ext  = in_array($ext, ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'avi']) ? $ext : 'mp4';
        $dest = "blogger/{$postId}/" . md5($src) . ".{$ext}";

        if (Storage::disk('ncp')->exists($dest)) {
            return "{$cdnBase}/{$dest}";
        }

        try {
            if (str_starts_with($src, '/file/')) {
                // 스트림 복사 — 대용량 파일도 메모리 낭비 없이 처리
                $path   = ltrim(substr($src, 6), '/');
                $stream = Storage::disk('ncp')->readStream($path);
                if (!$stream) return null;
                Storage::disk('ncp')->put($dest, $stream, 'public');
                return "{$cdnBase}/{$dest}";
            }

            if (str_starts_with($src, 'http')) {
                $parsed  = parse_url($src);
                $referer = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
                $headers = [
                    'Referer'    => $referer . '/',
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ];

                // Content-Length 선확인 — 50MB 초과 시 원본 URL 유지
                $head = Http::timeout(5)->withHeaders($headers)->head($src);
                if (!$head->ok()) return null;
                $size = (int) ($head->header('Content-Length') ?? 0);
                if ($size > 50 * 1024 * 1024) return null;

                $res = Http::timeout(60)->withHeaders($headers)->get($src);
                if (!$res->ok()) return null;
                Storage::disk('ncp')->put($dest, $res->body(), 'public');
                return "{$cdnBase}/{$dest}";
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }

    private function publishSingle(int $postId): int
    {
        $post = Post::find($postId, ['post_id', 'title', 'content', 'post_category', 'source', 'hits', 'post_data']);

        if (!$post) {
            $this->error("게시물({$postId})을 찾을 수 없습니다.");
            return 1;
        }

        $existing = $this->decodePostData($post->post_data)['blogger_post_id'] ?? null;
        if ($existing) {
            $this->warn("이미 Blogger에 발행된 게시물입니다. (blogger_post_id: {$existing})");
            return 0;
        }

        try {
            $blogger = $this->makeBloggerService();
        } catch (\Throwable $e) {
            $this->error('Blogger 인증 실패: ' . $e->getMessage());
            BloggerLog::create([
                'post_id'    => $post->post_id,
                'post_title' => $post->title,
                'status'     => 'FAILED',
                'message'    => $e->getMessage(),
            ]);
            return 1;
        }

        $blogId = SiteSetting::get('blogger_blog_id');
        if (!$blogId) {
            $this->error('관리자 설정 페이지에서 Blogger Blog ID를 저장하세요.');
            return 1;
        }

        try {
            $blogPost = new \Google\Service\Blogger\Post();
            $blogPost->setTitle($post->title);
            $blogPost->setContent($this->buildContent($post));
            $blogPost->setLabels($this->buildLabels($post));

            $result = $blogger->posts->insert($blogId, $blogPost);

            $postData = $this->decodePostData($post->post_data);
            $postData['blogger_post_id']     = $result->getId();
            $postData['blogger_url']          = $result->getUrl();
            $postData['blogger_published_at'] = now()->toIso8601String();
            $post->post_data = $postData;
            $post->save();

            BloggerLog::create([
                'post_id'         => $post->post_id,
                'post_title'      => $post->title,
                'hits'            => $post->hits,
                'source'          => $post->source,
                'blogger_post_id' => $result->getId(),
                'blogger_url'     => $result->getUrl(),
                'status'          => 'SUCCESS',
                'message'         => null,
            ]);

            $this->line("✅ [{$post->post_id}] {$post->title} → {$result->getUrl()}");
            return 0;
        } catch (\Throwable $e) {
            BloggerLog::create([
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

    private function decodePostData(mixed $raw): array
    {
        if (is_array($raw)) return $raw;
        if (is_string($raw) && $raw !== '') return json_decode($raw, true) ?? [];
        return [];
    }

    private function buildLabels(Post $post): array
    {
        $labels = [];
        if ($post->post_category) $labels[] = $post->post_category;
        if ($post->source)        $labels[] = $post->source;
        return $labels;
    }
}
