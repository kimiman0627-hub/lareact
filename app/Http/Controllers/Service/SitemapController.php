<?php

namespace App\Http\Controllers\Service;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    private function xml(string $body): Response
    {
        return response(
            '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . $body,
            200,
            ['Content-Type' => 'application/xml; charset=utf-8']
        );
    }

    public function index(): Response
    {
        $sitemaps = [
            ['loc' => url('/sitemap-pages.xml'), 'lastmod' => now()->toDateString()],
            ['loc' => url('/sitemap-posts.xml'), 'lastmod' => $this->latestPostDate()],
        ];

        $items = '';
        foreach ($sitemaps as $s) {
            $items .= "  <sitemap>\n"
                    . "    <loc>" . e($s['loc']) . "</loc>\n"
                    . "    <lastmod>" . e($s['lastmod']) . "</lastmod>\n"
                    . "  </sitemap>\n";
        }

        return $this->xml(
            '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n"
            . $items
            . '</sitemapindex>'
        );
    }

    public function pages(): Response
    {
        $urls = [
            ['loc' => url('/'), 'priority' => '1.0', 'changefreq' => 'daily'],
        ];

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

        $items = '';
        foreach ($urls as $u) {
            $items .= "  <url>\n"
                    . "    <loc>" . e($u['loc']) . "</loc>\n"
                    . "    <changefreq>" . e($u['changefreq']) . "</changefreq>\n"
                    . "    <priority>" . e($u['priority']) . "</priority>\n"
                    . "  </url>\n";
        }

        return $this->xml(
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n"
            . $items
            . '</urlset>'
        );
    }

    public function posts(): Response
    {
        $posts = DB::table('posts')
            ->where('post_status', 'ACTIVE')
            ->whereNull('deleted_at')
            ->orderByDesc('post_id')
            ->limit(50000)
            ->get(['post_id', 'updated_at', 'created_at']);

        $items = '';
        foreach ($posts as $post) {
            $lastmod = substr($post->updated_at ?? $post->created_at, 0, 10);
            $items .= "  <url>\n"
                    . "    <loc>" . e(url('/post/' . $post->post_id)) . "</loc>\n"
                    . "    <lastmod>" . e($lastmod) . "</lastmod>\n"
                    . "    <changefreq>weekly</changefreq>\n"
                    . "    <priority>0.6</priority>\n"
                    . "  </url>\n";
        }

        return $this->xml(
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n"
            . $items
            . '</urlset>'
        );
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
