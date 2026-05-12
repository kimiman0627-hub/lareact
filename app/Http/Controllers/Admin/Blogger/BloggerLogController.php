<?php

namespace App\Http\Controllers\Admin\Blogger;

use App\Http\Controllers\Controller;
use App\Models\Blogger\BloggerLog;
use App\Models\Board\Post;
use App\Models\Setting\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Google\Client;
use Google\Service\Blogger;

class BloggerLogController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $status = $request->query('status');

        $logs = BloggerLog::query()
            ->when($status, fn($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total'   => BloggerLog::count(),
            'success' => BloggerLog::where('status', 'SUCCESS')->count(),
            'failed'  => BloggerLog::where('status', 'FAILED')->count(),
        ];

        return Inertia::render('Blogger/BloggerLogs', [
            'logs'       => $logs,
            'stats'      => $stats,
            'filter'     => $status ?? '',
            'settings'   => [
                'blogger_enabled'       => SiteSetting::get('blogger_enabled', '0'),
                'blogger_schedule_type' => SiteSetting::get('blogger_schedule_type', 'daily'),
                'blogger_schedule_time' => SiteSetting::get('blogger_schedule_time', '09:00'),
            ],
        ]);
    }

    public function publishNow()
    {
        $exitCode = Artisan::call('blogger:publish', ['--force' => true]);
        $output   = Artisan::output();

        return response()->json([
            'success' => $exitCode === 0,
            'output'  => $output,
        ]);
    }

    public function destroy(int $id)
    {
        $log = BloggerLog::findOrFail($id);

        $apiWarning = null;

        // 1) Blogger API에서 게시물 삭제 시도
        if ($log->blogger_post_id) {
            try {
                $client = new Client();
                $client->setClientId(SiteSetting::get('blogger_client_id'));
                $client->setClientSecret(SiteSetting::get('blogger_client_secret'));
                $client->setAccessType('offline');
                $client->refreshToken(SiteSetting::get('blogger_refresh_token'));

                $blogger = new Blogger($client);
                $blogger->posts->delete(SiteSetting::get('blogger_blog_id'), $log->blogger_post_id);
            } catch (\Throwable $e) {
                $apiWarning = 'Blogger API 삭제 실패 (로컬만 삭제됨): ' . $e->getMessage();
            }
        }

        // 2) posts.post_data에서 blogger 필드 제거
        $post = Post::find($log->post_id);
        if ($post) {
            $raw      = $post->post_data;
            $postData = is_array($raw) ? $raw : (is_string($raw) && $raw !== '' ? json_decode($raw, true) ?? [] : []);
            unset($postData['blogger_post_id'], $postData['blogger_url'], $postData['blogger_published_at']);
            $post->post_data = json_encode($postData, JSON_UNESCAPED_UNICODE);
            $post->save();
        }

        // 3) 로그 삭제
        $log->delete();

        $message = $apiWarning ?? '발행이 삭제되었습니다.';
        return back()->with($apiWarning ? 'error' : 'success', $message);
    }

    public function publishPost(Request $request)
    {
        $request->validate(['post_id' => 'required|integer']);

        $exitCode = Artisan::call('blogger:publish', [
            '--post-id' => $request->input('post_id'),
        ]);
        $output = trim(Artisan::output());

        return response()->json([
            'success' => $exitCode === 0,
            'output'  => $output,
        ]);
    }
}
