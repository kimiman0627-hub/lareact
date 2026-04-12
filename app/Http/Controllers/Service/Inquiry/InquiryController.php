<?php

namespace App\Http\Controllers\Service\Inquiry;

use App\Http\Controllers\Controller;
use App\Models\Inquiry\Inquiry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InquiryController extends Controller
{
    public function create(Request $request)
    {
        Inertia::setRootView('app');

        $type = $request->input('type', 'SUPPORT');

        return Inertia::render('Inquiry/InquiryForm', [
            'type' => in_array($type, ['PARTNERSHIP', 'SUPPORT']) ? $type : 'SUPPORT',
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type'    => ['required', 'in:PARTNERSHIP,SUPPORT'],
            'name'    => ['required', 'string', 'max:100'],
            'email'   => ['required', 'email', 'max:255'],
            'phone'   => ['nullable', 'string', 'max:30'],
            'title'   => ['required', 'string', 'max:200'],
            'content' => ['required', 'string', 'max:5000'],
        ], [
            'name.required'    => '이름을 입력해주세요.',
            'email.required'   => '이메일을 입력해주세요.',
            'email.email'      => '올바른 이메일 형식이 아닙니다.',
            'title.required'   => '제목을 입력해주세요.',
            'content.required' => '내용을 입력해주세요.',
            'content.max'      => '내용은 5000자 이내로 입력해주세요.',
        ]);

        Inquiry::create([
            'type'    => $request->type,
            'user_id' => auth()->id(),
            'name'    => $request->name,
            'email'   => $request->email,
            'phone'   => $request->phone,
            'title'   => $request->title,
            'content' => $request->content,
            'status'  => 'PENDING',
        ]);

        return redirect('/inquiry/complete');
    }

    public function complete()
    {
        Inertia::setRootView('app');
        return Inertia::render('Inquiry/InquiryComplete');
    }
}
