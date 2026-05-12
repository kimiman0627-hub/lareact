<?php

namespace App\Http\Controllers\Service;

use App\Http\Controllers\Controller;
use App\Models\Setting\SiteSetting;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PolicyController extends Controller
{
    public function privacy()
    {
        $s = SiteSetting::allCached();

        return Inertia::render('Policy/Privacy', [
            'officerName'  => $s['privacy_officer_name']  ?? 'KRLived 운영팀',
            'officerEmail' => $s['privacy_officer_email'] ?? '',
        ]);
    }

    public function terms()
    {
        $s = SiteSetting::allCached();

        return Inertia::render('Policy/Terms', [
            'officerEmail' => $s['privacy_officer_email'] ?? '',
        ]);
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
