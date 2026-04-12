<?php

namespace App\Http\Controllers\Admin\Report;

use App\Http\Controllers\Controller;
use App\Models\Report\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $status = $request->input('status', '');
        $reason = $request->input('reason', '');

        $query = DB::table('reports as r')
            ->join('posts as p', 'r.post_id', '=', 'p.post_id')
            ->leftJoin('users as u', 'r.user_id', '=', 'u.id')
            ->orderByDesc('r.created_at');

        if ($status) $query->where('r.status', $status);
        if ($reason) $query->where('r.reason', $reason);

        $list = $query->paginate(20, [
            'r.id', 'r.post_id', 'r.reason', 'r.detail', 'r.status', 'r.ip', 'r.created_at',
            'p.title as post_title',
            'u.name as reporter_name',
        ])->withQueryString();

        return Inertia::render('Report/ReportList', [
            'list'    => $list,
            'filters' => compact('status', 'reason'),
        ]);
    }

    public function update(Request $request, int $id)
    {
        $request->validate(['status' => ['required', 'in:PENDING,REVIEWED,DISMISSED']]);

        Report::findOrFail($id)->update(['status' => $request->status]);

        return back();
    }
}
