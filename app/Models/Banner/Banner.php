<?php

namespace App\Models\Banner;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Banner extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'banner_id';
    protected $guarded = ['banner_id'];

    /**
     * 특정 위치의 활성 배너 목록을 반환한다.
     * 노출 기간(start_date/end_date)이 오늘 날짜 범위 안에 있는 배너만 포함.
     */
    public static function getActiveByPosition(string $position): array
    {
        $today = now()->toDateString();

        return static::where('banner_status', 'ACTIVE')
            ->where('banner_position', $position)
            ->where(function ($q) use ($today) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            })
            ->orderBy('sort_order')
            ->orderBy('banner_id')
            ->get()
            ->toArray();
    }
}
