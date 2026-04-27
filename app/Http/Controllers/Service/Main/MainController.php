<?php

namespace App\Http\Controllers\Service\Main;

use App\Http\Controllers\Controller;
use App\Models\Banner\Banner as BannerModel;
use App\Models\Board\Board as BoardModel;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MainController extends Controller
{
    public function index()
    {
        Inertia::setRootView('app');

        $siteName    = config('app.name');
        $description = '다양한 주제의 게시글을 읽고 쓰는 커뮤니티 포털입니다. 유머, 연예, 스포츠, 게임, 주식 등 다양한 카테고리의 인기 게시글을 만나보세요.';

        return Inertia::render('Main/Index', array_merge($this->getMainData(), [
            'seo' => [
                'title'       => $siteName . ' | 커뮤니티 포털',
                'description' => $description,
                'canonical'   => url('/'),
                'ogType'      => 'website',
            ],
        ]));
    }

    // 추후 다른 버전이 필요할 경우 사용
    // public function classic()
    // {
    //     Inertia::setRootView('app');
    //     return Inertia::render('Preview/Index', $this->getMainData());
    // }

    public function getMainData()
    {
        return [
            'boards'           => BoardModel::getBoards(),
            'popularPosts'     => $this->getPopularPosts(),
            'categoryBanners1' => BannerModel::getActiveByPosition('MAIN_BOARD_CATEGORY1'),
            'categoryBanners2' => BannerModel::getActiveByPosition('MAIN_BOARD_CATEGORY2'),
        ];
    }

    private function getPopularPosts(): array
    {
        return DB::table('posts as p')
            ->join('users as u', 'p.user_id', '=', 'u.id')
            ->join('boards as b', 'p.post_category', '=', 'b.category')
            ->where('p.post_status', 'ACTIVE')
            ->where('p.created_at', '>=', now()->subDays(1))
            ->orderByDesc(DB::raw('(p.hits + p.comment_count * 50)'))
            ->limit(5)
            ->get([
                'p.post_id', 'p.title', 'p.hits', 'p.comment_count', 'p.created_at',
                'u.name as author',
                'b.board_name',
                DB::raw("(SELECT file_url FROM files WHERE file_kind = 'POST' AND ref_id = p.post_id ORDER BY file_id ASC LIMIT 1) AS thumbnail"),
            ])
            ->toArray();
    }
}
