<?php

namespace App\Http\Controllers\Admin\Inquiry;

use App\Http\Controllers\Controller;
use App\Models\Inquiry\Inquiry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InquiryController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $type   = $request->input('type', '');
        $status = $request->input('status', '');
        $page   = max(1, (int) $request->input('page', 1));

        $query = Inquiry::query()->orderByDesc('created_at');

        if ($type)   $query->where('type', $type);
        if ($status) $query->where('status', $status);

        $list = $query->paginate(20)->withQueryString();

        return Inertia::render('Inquiry/InquiryList', [
            'list'          => $list,
            'filters'       => compact('type', 'status'),
        ]);
    }

    public function show(int $id)
    {
        $inquiry = Inquiry::findOrFail($id);
        return response()->json($inquiry);
    }

    public function answer(Request $request, int $id)
    {
        $request->validate([
            'answer' => ['required', 'string'],
            'status' => ['required', 'in:ANSWERED,CLOSED'],
        ]);

        $inquiry = Inquiry::findOrFail($id);
        $inquiry->update([
            'answer'      => $request->answer,
            'status'      => $request->status,
            'answered_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }
}
