<?php

namespace App\Http\Controllers\Service;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PolicyController extends Controller
{
    public function privacy()
    {
        return Inertia::render('Policy/Privacy');
    }

    public function terms()
    {
        return Inertia::render('Policy/Terms');
    }

    public function about()
    {
        $stats = [
            'boards' => DB::table('boards')->where('board_status', 'ACTIVE')->count(),
            'posts'  => DB::table('posts')->where('post_status', 'ACTIVE')->count(),
        ];

        return Inertia::render('Policy/About', [
            'stats' => $stats,
            'seo'   => [
                'title'       => '서비스 소개 | KRLived',
                'description' => 'KRLived는 다양한 커뮤니티의 인기 게시글과 실시간 금융 정보를 한 곳에서 확인할 수 있는 커뮤니티 포털입니다.',
                'canonical'   => url('/about'),
            ],
        ]);
    }
}
