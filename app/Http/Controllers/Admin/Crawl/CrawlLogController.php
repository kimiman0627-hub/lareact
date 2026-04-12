<?php

namespace App\Http\Controllers\Admin\Crawl;

use App\Http\Controllers\Controller;
use App\Models\Crawl\CrawlLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CrawlLogController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $query = CrawlLog::query()->latest('started_at');

        if ($source = $request->input('source')) {
            $query->where('source', $source);
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $logs = $query->paginate(30)->withQueryString();

        // 각 로그의 소요시간(초) 계산, error_log는 목록에서 제외(상세에서 별도 조회)
        $items = $logs->getCollection()->map(function (CrawlLog $log) {
            $duration = $log->finished_at && $log->started_at
                ? $log->started_at->diffInSeconds($log->finished_at)
                : null;

            return [
                'id'            => $log->id,
                'source'        => $log->source,
                'command'       => $log->command,
                'status'        => $log->status,
                'total_found'   => $log->total_found,
                'total_saved'   => $log->total_saved,
                'total_skipped' => $log->total_skipped,
                'total_errors'  => $log->total_errors,
                'duration_sec'  => $duration,
                'started_at'    => $log->started_at?->toDateTimeString(),
                'finished_at'   => $log->finished_at?->toDateTimeString(),
            ];
        });

        $logs->setCollection($items);

        // 필터용 소스 목록 (distinct)
        $sources = CrawlLog::distinct()->orderBy('source')->pluck('source');

        return Inertia::render('Crawl/CrawlLogList', [
            'logs'    => $logs,
            'sources' => $sources,
            'params'  => $request->only(['source', 'status']),
        ]);
    }

    public function show(int $id)
    {
        Inertia::setRootView('admin');

        $log = CrawlLog::findOrFail($id);

        return response()->json([
            'id'        => $log->id,
            'error_log' => $log->error_log ?? [],
        ]);
    }
}
