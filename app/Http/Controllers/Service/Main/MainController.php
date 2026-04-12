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
        return Inertia::render('Main/Index', $this->getMainData());
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
            'sideBanners1'     => BannerModel::getActiveByPosition('SIDE1'),
            'sideBanners2'     => BannerModel::getActiveByPosition('SIDE2'),
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
            ->whereNull('p.deleted_at')
            ->where('p.created_at', '>=', now()->subDays(7))
            ->orderByDesc('p.hits')
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
