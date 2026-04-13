<?php

namespace App\Http\Controllers\Service;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class SitemapController extends Controller
{
    /**
     * sitemap_index.xml: 정적 페이지 + 게시글 사이트맵 분리
     */
    public function index()
    {
        $sitemaps = [
            ['loc' => url('/sitemap-pages.xml'),  'lastmod' => now()->toDateString()],
            ['loc' => url('/sitemap-posts.xml'),  'lastmod' => $this->latestPostDate()],
        ];

        return response()
            ->view('sitemap.index', compact('sitemaps'))
            ->header('Content-Type', 'application/xml; charset=utf-8');
    }

    /**
     * sitemap-pages.xml: 정적 페이지 + 게시판 목록 페이지
     */
    public function pages()
    {
        $urls = [['loc' => url('/'), 'priority' => '1.0', 'changefreq' => 'daily']];

        $boards = DB::table('boards')
            ->where('board_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->orderBy('board_order')
            ->get(['category']);

        foreach ($boards as $board) {
            $urls[] = [
                'loc'        => url('/board/' . $board->category),
                'priority'   => '0.8',
                'changefreq' => 'hourly',
            ];
        }

        return response()
            ->view('sitemap.pages', compact('urls'))
            ->header('Content-Type', 'application/xml; charset=utf-8');
    }

    /**
     * sitemap-posts.xml: 게시글 상세 페이지 (최근 50,000건)
     */
    public function posts()
    {
        $posts = DB::table('posts')
            ->where('post_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->orderByDesc('post_id')
            ->limit(50000)
            ->get(['post_id', 'updated_at', 'created_at']);

        return response()
            ->view('sitemap.posts', compact('posts'))
            ->header('Content-Type', 'application/xml; charset=utf-8');
    }

    private function latestPostDate(): string
    {
        $latest = DB::table('posts')
            ->where('post_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->max('updated_at');

        return $latest ? substr($latest, 0, 10) : now()->toDateString();
    }
}
