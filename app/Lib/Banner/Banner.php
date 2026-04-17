<?php

namespace App\Lib\Banner;

use App\Models\Banner\Banner as BannerModel;
use Illuminate\Support\Facades\DB;
use App\Lib\Common\QueryTrait;
use App\Lib\Common\ResultTrait;

class Banner
{
    use QueryTrait, ResultTrait;

    function __construct($params = [])
    {
        $this->initQuery();
        $this->initResult();
        $this->setParams($params);
        $this->genQuery();
    }

    public function genQuery()
    {
        if (!empty($this->params['id'] ?? null)) {
            $this->where('B.banner_id', '=', $this->params['id']);
        }

        if (!empty($this->params['title'] ?? null)) {
            $this->whereLike('B.title', $this->params['title']);
        }

        if (!empty($this->params['banner_status'] ?? null)) {
            $this->where('B.banner_status', '=', $this->params['banner_status']);
        }

        if (!empty($this->params['banner_position'] ?? null)) {
            $this->where('B.banner_position', '=', $this->params['banner_position']);
        }

        if (!empty($this->params['start_date'] ?? null) && !empty($this->params['end_date'] ?? null)) {
            $this->whereBetween('B.created_at', $this->params['start_date'], $this->params['end_date']);
        }

        $this->orderBy('B.sort_order', 'ASC');
        $this->orderBy('B.created_at', 'DESC');
        $this->limit($this->params['page'] ?? 1, $this->params['per_page'] ?? 20);
    }

    public function getList()
    {
        try {
            return DB::select("SELECT B.*
                FROM banners AS B
                {$this->buildWhere()}
                {$this->buildOrderBy()}
                {$this->buildLimit()}", $this->bindings);
        } catch (\Throwable $e) {
            $this->setResult(500, $e->getMessage());
            return false;
        }
    }

    public function getCount()
    {
        try {
            return DB::selectOne("SELECT COUNT(*) AS total
                FROM banners AS B
                {$this->buildWhere()}", $this->bindings)->total ?? 0;
        } catch (\Throwable $e) {
            $this->setResult(500, $e->getMessage());
            return false;
        }
    }

    public function find(int $id): ?BannerModel
    {
        return BannerModel::find($id);
    }

    public function create(): BannerModel
    {
        return BannerModel::create($this->params);
    }

    public function update(): ?BannerModel
    {
        $banner = $this->find($this->params['banner_id'] ?? $this->params['id'] ?? 0);
        if (!$banner) {
            return null;
        }

        $banner->fill($this->params);
        $banner->save();

        return $banner;
    }

    public function delete(int $id): bool
    {
        $banner = $this->find($id);
        if (!$banner) {
            return false;
        }

        return (bool) $banner->delete();
    }


}
