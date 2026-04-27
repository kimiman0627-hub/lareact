<?php

namespace App\Http\Controllers\Service\Banner;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BannerStatController extends Controller
{
    public function impression(Request $request, int $bannerId)
    {
        $this->upsertStat($bannerId, 'impressions');
        return response()->noContent();
    }

    public function click(Request $request, int $bannerId)
    {
        $this->upsertStat($bannerId, 'clicks');
        return response()->noContent();
    }

    private function upsertStat(int $bannerId, string $field): void
    {
        $exists = DB::table('banners')->where('banner_id', $bannerId)->exists();
        if (!$exists) return;

        $today = now()->toDateString();

        DB::statement("
            INSERT INTO banner_daily_stats (banner_id, stat_date, impressions, clicks, created_at, updated_at)
            VALUES (?, ?, 0, 0, NOW(), NOW())
            ON CONFLICT (banner_id, stat_date) DO NOTHING
        ", [$bannerId, $today]);

        DB::table('banner_daily_stats')
            ->where('banner_id', $bannerId)
            ->where('stat_date', $today)
            ->increment($field);
    }
}
