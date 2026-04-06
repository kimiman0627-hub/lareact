<?php

namespace App\Http\Controllers\Admin\Banner;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Models\Banner\Banner;
use App\Lib\Banner\Banner as BannerLib;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BannerController extends Controller
{
    public function index(Request $request)
    {
        Inertia::setRootView('admin');

        $params = $this->validateIndex($request);

        $bannerLib = new BannerLib($params);
        $list = $bannerLib->getList();
        $total = $bannerLib->getCount();

        if ($list === false || $total === false) {
            return $this->error($bannerLib->resultMessage, null, 500);
        }

        $paginatedData = new LengthAwarePaginator(
            $list,
            $total,
            $params['per_page'] ?? 20,
            $params['page'] ?? 1,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Banner/BannerList', [
            'list'            => $paginatedData,
            'total'           => $total,
            'params'          => $params,
            'bannerStatuses'  => config('config.banner_statuses'),
            'bannerPositions' => config('config.banner_positions'),
        ]);
    }

    protected function validateIndex(Request $request)
    {
        return $request->validate([
            'id'              => 'nullable|integer',
            'title'           => 'nullable|string|max:100',
            'banner_status'   => 'nullable|in:' . implode(',', array_keys(config('config.banner_statuses'))),
            'banner_position' => 'nullable|in:' . implode(',', array_keys(config('config.banner_positions'))),
            'start_date'      => 'nullable|date',
            'end_date'        => 'nullable|date',
            'per_page'        => 'nullable|integer|min:1|max:100',
            'page'            => 'nullable|integer|min:1',
        ]);
    }

    protected function validateBanner(Request $request)
    {
        return $request->validate([
            'title'           => 'required|string|max:255',
            'image_url'       => 'required|string|max:500',
            'link_url'        => 'nullable|string|max:500',
            'is_new_tab'      => 'required|in:0,1,true,false',
            'banner_status'   => 'required|in:' . implode(',', array_keys(config('config.banner_statuses'))),
            'banner_position' => 'required|in:' . implode(',', array_keys(config('config.banner_positions'))),
            'sort_order'      => 'required|integer|min:0',
            'start_date'      => 'nullable|date',
            'end_date'        => 'nullable|date',
        ]);
    }

    public function store(Request $request)
    {
        $params = $this->validateBanner($request);
        $params['is_new_tab'] = $request->boolean('is_new_tab', false);

        $bannerLib = new BannerLib($params);
        $banner = $bannerLib->create();

        if (!$banner) {
            return $this->error('배너를 생성할 수 없습니다.', null, 500);
        }

        return redirect()->route('admin.banners.index')->with('message', '배너가 등록되었습니다.');
    }

    public function update(Request $request, $id)
    {
        $params = $this->validateBanner($request);
        $params['banner_id'] = $id;
        $params['is_new_tab'] = $request->boolean('is_new_tab', false);

        $bannerLib = new BannerLib($params);
        $banner = $bannerLib->update();

        if (!$banner) {
            return $this->error('배너를 수정할 수 없습니다.', null, 404);
        }

        return redirect()->route('admin.banners.index')->with('message', '배너가 수정되었습니다.');
    }

    public function destroy($id)
    {
        $bannerLib = new BannerLib();
        $deleted = $bannerLib->delete((int) $id);

        if (!$deleted) {
            return $this->error('배너를 삭제할 수 없습니다.', null, 404);
        }

        return redirect()->route('admin.banners.index')->with('message', '배너가 삭제되었습니다.');
    }

    public function order(Request $request, $id)
    {
        $request->validate(['direction' => 'required|in:up,down']);
        $direction = $request->direction;

        // 현재 순서 기준 전체 목록 조회 (sort_order 같은 경우 banner_id로 2차 정렬)
        $banners = Banner::whereNull('deleted_at')
            ->orderBy('sort_order', 'asc')
            ->orderBy('banner_id', 'asc')
            ->get();

        $index = $banners->search(fn($b) => $b->banner_id == $id);

        if ($index === false) {
            return $this->error('배너를 찾을 수 없습니다.', null, 404);
        }

        $targetIndex = $direction === 'up' ? $index - 1 : $index + 1;

        if ($targetIndex < 0 || $targetIndex >= $banners->count()) {
            return redirect()->route('admin.banners.index');
        }

        DB::transaction(function () use ($banners, $index, $targetIndex) {
            // sort_order가 중복될 수 있으므로 먼저 순서대로 정규화
            foreach ($banners as $i => $banner) {
                $banner->sort_order = $i * 10;
            }
            // 두 항목 swap
            [$banners[$index]->sort_order, $banners[$targetIndex]->sort_order] =
                [$banners[$targetIndex]->sort_order, $banners[$index]->sort_order];

            $banners[$index]->save();
            $banners[$targetIndex]->save();
        });

        return redirect()->route('admin.banners.index')->with('message', '순서가 변경되었습니다.');
    }
}
