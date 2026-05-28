<?php

namespace App\Http\Controllers\Service\Lottery;

use App\Http\Controllers\Controller;
use App\Models\Lottery\LottoDraw;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class LottoController extends Controller
{
    private const API_URL      = 'https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do';
    private const API_HEADERS  = [
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer'    => 'https://www.dhlottery.co.kr/lt645/result',
        'Accept'     => 'application/json, text/javascript, */*',
    ];

    public function index()
    {
        Inertia::setRootView('app');

        $siteName    = config('app.name');
        $title       = '로또 당첨번호 확인 | 최신 회차 번호 조회 · ' . $siteName;
        $description = '최신 로또 당첨번호를 확인하세요. 1회부터 최신 회차까지 전체 통계 기반 AI 예상번호를 무료로 제공합니다.';

        return Inertia::render('Lottery/Lotto', [
            'seo' => [
                'title'       => $title,
                'description' => $description,
                'canonical'   => url('/lottery/lotto'),
                'ogType'      => 'website',
                'ogImage'     => asset('og-lotto.png'),
            ],
        ]);
    }

    public function results()
    {
        // 최신 회차 갱신 시도 (1시간 캐시로 API 호출 제한)
        $this->syncLatestIfStale();

        $draws = LottoDraw::orderByDesc('drw_no')->limit(10)->get();

        if ($draws->isEmpty()) {
            return response()->json(['draws' => [], 'latestDrwNo' => null, 'unavailable' => true]);
        }

        return response()->json([
            'draws'       => $draws->map(fn($d) => [
                'drwNo'          => $d->drw_no,
                'drwNoDate'      => $d->drw_date->format('Y-m-d'),
                'numbers'        => [$d->no1, $d->no2, $d->no3, $d->no4, $d->no5, $d->no6],
                'bonus'          => $d->bonus_no,
                'firstWinamnt'   => $d->first_prize_amount,
                'firstPrzwnerCo' => $d->first_prize_winners,
            ]),
            'latestDrwNo' => $draws->first()->drw_no,
            'numberFreq'  => $this->getNumberFrequency(),
        ]);
    }

    // 최신 회차가 DB에 없으면 API에서 가져와 저장 (1시간에 1회만 체크)
    private function syncLatestIfStale(): void
    {
        if (Cache::has('lotto_sync_checked')) {
            return;
        }

        Cache::put('lotto_sync_checked', true, 3600);

        $latestInDb  = LottoDraw::max('drw_no') ?? 0;
        $estimated   = $this->estimateLatestDrwNo();

        if ($latestInDb >= $estimated) {
            return;
        }

        for ($try = $estimated + 3; $try >= $estimated - 2; $try--) {
            $items = $this->fetchDrawListFromApi($try);
            if (empty($items)) {
                continue;
            }

            $newItems = array_filter($items, fn($item) => $item['drw_no'] > $latestInDb);
            if (!empty($newItems)) {
                LottoDraw::upsert(array_values($newItems), ['drw_no']);
                Cache::forget('lotto_number_freq');
            }
            break;
        }
    }

    // 전체 회차 번호 출현 빈도 (캐시 1시간)
    private function getNumberFrequency(): array
    {
        return Cache::remember('lotto_number_freq', 3600, function () {
            $rows = DB::select("
                SELECT num, COUNT(*) AS cnt
                FROM (
                    SELECT no1 AS num FROM lotto_draws
                    UNION ALL SELECT no2 FROM lotto_draws
                    UNION ALL SELECT no3 FROM lotto_draws
                    UNION ALL SELECT no4 FROM lotto_draws
                    UNION ALL SELECT no5 FROM lotto_draws
                    UNION ALL SELECT no6 FROM lotto_draws
                ) t
                GROUP BY num
                ORDER BY num
            ");

            $freq = array_fill(1, 45, 0);
            foreach ($rows as $row) {
                $freq[(int) $row->num] = (int) $row->cnt;
            }
            return $freq;
        });
    }

    private function fetchDrawListFromApi(int $drwNo): array
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(self::API_HEADERS)
                ->get(self::API_URL, ['srchLtEpsd' => $drwNo]);

            if (!str_contains($response->header('Content-Type') ?? '', 'json')) {
                return [];
            }

            $items = $response->json('data.list') ?? [];

            return array_map(fn($item) => [
                'drw_no'              => $item['ltEpsd'],
                'drw_date'            => substr($item['ltRflYmd'], 0, 4) . '-' . substr($item['ltRflYmd'], 4, 2) . '-' . substr($item['ltRflYmd'], 6, 2),
                'no1'                 => $item['tm1WnNo'],
                'no2'                 => $item['tm2WnNo'],
                'no3'                 => $item['tm3WnNo'],
                'no4'                 => $item['tm4WnNo'],
                'no5'                 => $item['tm5WnNo'],
                'no6'                 => $item['tm6WnNo'],
                'bonus_no'            => $item['bnsWnNo'],
                'first_prize_amount'  => $item['rnk1WnAmt'],
                'first_prize_winners' => $item['rnk1WnNope'],
            ], $items);
        } catch (\Exception) {
            return [];
        }
    }

    private function estimateLatestDrwNo(): int
    {
        $firstDraw = Carbon::parse('2002-12-07');
        return (int) floor($firstDraw->diffInWeeks(Carbon::now())) + 1;
    }
}
