<?php

namespace App\Http\Controllers\Service;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class StockController extends Controller
{
    public function page()
    {
        return inertia('Stock/StockPage', [
            'seo' => [
                'title'       => '주식 시세 | 코스피 · 코스닥 · 나스닥 실시간',
                'description' => '코스피, 코스닥, 나스닥 주요 종목 실시간 시세 · 등락률 · 거래대금을 한눈에 확인하세요.',
                'canonical'   => url('/stock'),
            ],
        ]);
    }

    public function index()
    {
        $data = Cache::remember('stocks.all', 60, fn () => [
            'kospi'      => $this->fetchKrxMarket('KOSPI', 5),
            'kosdaq'     => $this->fetchKrxMarket('KOSDAQ', 5),
            'nasdaq'     => $this->fetchNasdaq(5),
            'updated_at' => now()->toIso8601String(),
        ]);

        return response()->json($data);
    }

    public function detail()
    {
        $data = Cache::remember('stocks.detail', 60, fn () => [
            'kospi'      => $this->fetchKrxMarket('KOSPI', 20),
            'kosdaq'     => $this->fetchKrxMarket('KOSDAQ', 20),
            'nasdaq'     => $this->fetchNasdaq(20),
            'updated_at' => now()->toIso8601String(),
        ]);

        return response()->json($data);
    }

    // ── KOSPI / KOSDAQ: 네이버 금융 모바일 API (시가총액 상위 → 거래대금 내림차순) ──
    private function fetchKrxMarket(string $market, int $limit): array
    {
        try {
            $res = Http::timeout(5)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                    'Accept'     => 'application/json',
                ])
                ->get("https://m.stock.naver.com/api/stocks/marketValue/{$market}", [
                    'page'     => 1,
                    'pageSize' => max(100, $limit * 5),
                ]);

            if (!$res->ok()) return [];

            return collect($res->json()['stocks'] ?? [])
                ->sortByDesc(fn ($s) => (int) str_replace(',', '', $s['accumulatedTradingValue'] ?? '0'))
                ->take($limit)
                ->values()
                ->map(fn ($s) => [
                    'name'      => $s['stockName'] ?? '',
                    'price'     => (int) str_replace(',', '', $s['closePrice'] ?? '0'),
                    'change'    => (float) ($s['fluctuationsRatio'] ?? 0),
                    'up'        => ($s['compareToPreviousPrice']['code'] ?? '') === '2',
                    'trade_val' => str_replace('원', '', $s['accumulatedTradingValueKrwHangeul'] ?? ''),
                ])
                ->toArray();
        } catch (\Throwable) {
            return [];
        }
    }

    // ── NASDAQ: Yahoo Finance screener (most active, 거래대금 기준) ──────
    private function fetchNasdaq(int $limit): array
    {
        try {
            $res = Http::timeout(5)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept'     => 'application/json',
                ])
                ->get('https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved', [
                    'scrIds' => 'most_actives',
                    'count'  => max(100, $limit * 5),
                    'region' => 'US',
                    'lang'   => 'en-US',
                ]);

            if (!$res->ok()) return [];

            $quotes = $res->json('finance.result.0.quotes') ?? [];

            // NASDAQ 거래소만 필터 → 거래대금(가격×거래량) 내림차순
            return collect($quotes)
                ->filter(fn ($q) => in_array($q['exchange'] ?? '', ['NMS', 'NGM', 'NCM']))
                ->sortByDesc(fn ($q) => ($q['regularMarketVolume'] ?? 0) * ($q['regularMarketPrice'] ?? 0))
                ->take($limit)
                ->values()
                ->map(fn ($q) => [
                    'name'      => $q['shortName'] ?? $q['symbol'] ?? '',
                    'symbol'    => $q['symbol']    ?? '',
                    'price'     => round($q['regularMarketPrice'] ?? 0, 2),
                    'change'    => round($q['regularMarketChangePercent'] ?? 0, 2),
                    'up'        => ($q['regularMarketChangePercent'] ?? 0) >= 0,
                    'trade_val' => $this->fmtUsd(
                        (int) (($q['regularMarketVolume'] ?? 0) * ($q['regularMarketPrice'] ?? 0))
                    ),
                ])
                ->toArray();
        } catch (\Throwable) {
            return [];
        }
    }

    // ── 가상화폐: Upbit 프록시 (CORS 우회, 60초 캐시) ────────────────────
    public function crypto()
    {
        $data = Cache::remember('crypto.prices', 60, function () {
            try {
                $res = Http::timeout(5)->get('https://api.upbit.com/v1/ticker', [
                    'markets' => 'KRW-BTC,KRW-ETH,KRW-XRP',
                ]);
                if (!$res->ok()) return null;
                return $res->json();
            } catch (\Throwable) {
                return null;
            }
        });

        return response()->json($data);
    }

    // ── 환율: Frankfurter (ECB 기준, 5분 캐시) ───────────────────────────
    public function exchangeRates()
    {
        $data = Cache::remember('exchange.rates', 300, function () {
            try {
                $res = Http::timeout(4)->get('https://api.frankfurter.app/latest?base=USD&symbols=KRW,EUR,JPY');
                if (!$res->ok()) return null;

                $d   = $res->json();
                $rates = $d['rates'] ?? [];
                $krw = $rates['KRW'] ?? null;
                $eur = $rates['EUR'] ?? null;
                $jpy = $rates['JPY'] ?? null;

                if (!$krw || !$eur || !$jpy) return null;

                return [
                    'USD'  => (int) round($krw),
                    'EUR'  => (int) round($krw / $eur),
                    'JPY'  => round($krw / $jpy * 100, 1),
                    'date' => $d['date'] ?? null,
                ];
            } catch (\Throwable) {
                return null;
            }
        });

        return response()->json($data);
    }

    // ── 금/은: Yahoo Finance v8 chart API (GC=F, SI=F) ─────────────────
    public function metals()
    {
        $data = Cache::remember('metals.all', 300, function () {
            return [
                'gold'       => $this->fetchMetal('GC=F'),
                'silver'     => $this->fetchMetal('SI=F'),
                'updated_at' => now()->toIso8601String(),
            ];
        });

        return response()->json($data);
    }

    private function fetchMetal(string $symbol): ?array
    {
        try {
            $res = Http::timeout(5)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept'     => 'application/json',
                ])
                ->get("https://query1.finance.yahoo.com/v8/finance/chart/{$symbol}", [
                    'interval' => '1d',
                    'range'    => '5d',
                ]);

            if (!$res->ok()) return null;

            $meta  = $res->json('chart.result.0.meta');
            $price = (float) ($meta['regularMarketPrice']  ?? 0);
            $prev  = (float) ($meta['chartPreviousClose']  ?? 0);

            if (!$price) return null;

            $change = $prev > 0 ? round(($price - $prev) / $prev * 100, 2) : 0.0;

            return [
                'price_usd' => round($price, 2),
                'change'    => $change,
                'up'        => $change >= 0,
            ];
        } catch (\Throwable) {
            return null;
        }
    }

    private function fmtUsd(int $usd): string
    {
        if ($usd >= 1_000_000_000) return round($usd / 1_000_000_000, 1) . 'B';
        if ($usd >= 1_000_000)     return round($usd / 1_000_000)         . 'M';
        return '$' . number_format($usd);
    }
}
