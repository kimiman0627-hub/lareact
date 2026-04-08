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
            'boards'          => BoardModel::getBoards(),
            'sideBanners1'    => BannerModel::getActiveByPosition('SIDE1'),
            'sideBanners2'    => BannerModel::getActiveByPosition('SIDE2'),
            'categoryBanners1' => BannerModel::getActiveByPosition('MAIN_BOARD_CATEGORY1'),
            'categoryBanners2' => BannerModel::getActiveByPosition('MAIN_BOARD_CATEGORY2'),
        ];
    }
}
