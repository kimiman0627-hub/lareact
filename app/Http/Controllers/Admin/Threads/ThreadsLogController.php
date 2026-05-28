<?php

namespace App\Http\Controllers\Admin\Threads;

use App\Http\Controllers\Controller;
use App\Lib\Threads\ThreadsService;
use App\Models\Board\Post;
use App\Models\Setting\SiteSetting;
use App\Models\Threads\ThreadsLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;

class ThreadsLogController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $status = $request->query('status');

        $logs = ThreadsLog::query()
            ->when($status, fn($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total'   => ThreadsLog::count(),
            'success' => ThreadsLog::where('status', 'SUCCESS')->count(),
            'failed'  => ThreadsLog::where('status', 'FAILED')->count(),
        ];

        return Inertia::render('Threads/ThreadsLogs', [
            'logs'     => $logs,
            'stats'    => $stats,
            'filter'   => $status ?? '',
            'settings' => [
                'threads_enabled'       => SiteSetting::get('threads_enabled', '0'),
                'threads_schedule_type' => SiteSetting::get('threads_schedule_type', 'daily'),
                'threads_schedule_time' => SiteSetting::get('threads_schedule_time', '10:00'),
            ],
        ]);
    }

    public function publishNow()
    {
        $exitCode = Artisan::call('threads:publish', ['--force' => true]);
        $output   = Artisan::output();

        return response()->json([
            'success' => $exitCode === 0,
            'output'  => $output,
        ]);
    }

    /**
     * 관리자 UI에서 특정 게시물 + 커스텀 텍스트로 단건 발행.
     */
    public function publishPost(Request $request)
    {
        $request->validate([
            'post_id' => 'required|integer',
            'text'    => 'nullable|string|max:500',
        ]);

        $post = Post::find($request->input('post_id'));
        if (!$post) {
            return response()->json(['success' => false, 'output' => '게시물을 찾을 수 없습니다.']);
        }

        try {
            $service    = new ThreadsService();
            $customText = trim($request->input('text', ''));
            $result     = $service->publish($post, $customText);

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
                'hits'              => $post->hits ?? 0,
                'source'            => $post->source ?? null,
                'threads_media_id'  => $result['media_id'],
                'threads_permalink' => $result['permalink'],
                'status'            => 'SUCCESS',
                'message'           => null,
            ]);

            $output = "✅ [{$post->post_id}] {$post->title}\n→ {$result['permalink']}";
            return response()->json(['success' => true, 'output' => $output, 'permalink' => $result['permalink']]);
        } catch (\Throwable $e) {
            ThreadsLog::create([
                'post_id'    => $post->post_id,
                'post_title' => $post->title,
                'hits'       => $post->hits ?? 0,
                'source'     => $post->source ?? null,
                'status'     => 'FAILED',
                'message'    => $e->getMessage(),
            ]);

            return response()->json(['success' => false, 'output' => $e->getMessage()]);
        }
    }

    /**
     * 발행 미리보기 텍스트 생성 (실제 발행 없이).
     */
    public function previewText(Request $request)
    {
        $request->validate(['post_id' => 'required|integer']);

        $post = Post::find($request->input('post_id'));
        if (!$post) {
            return response()->json(['text' => '']);
        }

        try {
            $service = new ThreadsService();
            $text    = $service->buildText($post);
            return response()->json(['text' => $text, 'length' => mb_strlen($text)]);
        } catch (\Throwable $e) {
            return response()->json(['text' => '', 'error' => $e->getMessage()]);
        }
    }

    public function destroy(int $id)
    {
        $log = ThreadsLog::findOrFail($id);

        // post_data에서 threads 필드 제거
        $post = Post::find($log->post_id);
        if ($post) {
            $postData = is_array($post->post_data)
                ? $post->post_data
                : (is_string($post->post_data) && $post->post_data !== '' ? json_decode($post->post_data, true) ?? [] : []);
            unset($postData['threads_media_id'], $postData['threads_permalink'], $postData['threads_published_at']);
            $post->post_data = json_encode($postData, JSON_UNESCAPED_UNICODE);
            $post->save();
        }

        $log->delete();

        return back()->with('success', '발행 로그가 삭제되었습니다. 해당 게시물은 다시 발행 가능합니다.');
    }
}
