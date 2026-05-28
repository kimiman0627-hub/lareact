<?php

namespace App\Console\Commands\Lottery;

use App\Models\Lottery\LottoDraw;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SyncLottoDraws extends Command
{
    protected $signature = 'lotto:sync
                            {--dry-run : 실제 저장 없이 대상만 확인}';

    protected $description = '동행복권 당첨번호를 DB에 동기화합니다 (전체 및 증분)';

    private const API_URL = 'https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do';
    private const HEADERS  = [
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer'    => 'https://www.dhlottery.co.kr/lt645/result',
        'Accept'     => 'application/json, text/javascript, */*',
    ];

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        $latestInDb  = LottoDraw::max('drw_no') ?? 0;
        $estimatedTop = $this->estimateLatestDrwNo();

        $this->info("DB 최신 회차: {$latestInDb} / 예상 최신 회차: {$estimatedTop}");

        if ($latestInDb >= $estimatedTop) {
            $this->info('이미 최신 상태입니다.');
            return 0;
        }

        // srchLtEpsd=X 는 X를 중심으로 앞뒤 ~5회씩 반환
        // step=10으로 순회하면 전 회차 커버 가능 (중복은 upsert로 처리)
        $totalSaved = 0;
        $bar = $this->output->createProgressBar(ceil($estimatedTop / 10));
        $bar->start();

        for ($x = $estimatedTop; $x >= 1; $x -= 10) {
            $items = $this->fetchBatch($x);

            foreach ($items as $item) {
                if ($item['drw_no'] <= $latestInDb) {
                    // 이미 DB에 있는 회차까지 도달 → 조기 종료
                    $bar->finish();
                    $this->newLine();
                    $this->info("총 {$totalSaved}건 저장 완료.");
                    if (!$isDryRun) {
                        Cache::forget('lotto_number_freq');
                        Cache::forget('lotto_sync_checked');
                    }
                    return 0;
                }

                if (!$isDryRun) {
                    LottoDraw::upsert([$item], ['drw_no']);
                }
                $totalSaved++;
            }

            $bar->advance();
            usleep(150000); // 150ms throttle
        }

        $bar->finish();
        $this->newLine();
        $this->info("총 {$totalSaved}건 " . ($isDryRun ? '대상 확인 (dry-run).' : '저장 완료.'));

        if (!$isDryRun) {
            Cache::forget('lotto_number_freq');
            Cache::forget('lotto_sync_checked');
        }

        return 0;
    }

    private function fetchBatch(int $drwNo): array
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(self::HEADERS)
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
        return (int) floor($firstDraw->diffInWeeks(Carbon::now())) + 6;
    }
}
