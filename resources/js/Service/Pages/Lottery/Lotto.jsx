import React, { useState, useEffect, useCallback } from "react";
import { Head } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import { ajax } from "@/Utils/network";

function ballColor(n) {
    if (n <= 10) return "bg-yellow-400";
    if (n <= 20) return "bg-blue-500";
    if (n <= 30) return "bg-red-500";
    if (n <= 40) return "bg-gray-500";
    return "bg-green-600";
}

function Ball({ number, size = "md", isBonus = false }) {
    const sizeClass = {
        xs: "w-7 h-7 text-[10px]",
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
    }[size] ?? "w-10 h-10 text-sm";

    return (
        <span
            className={`inline-flex items-center justify-center rounded-full font-bold text-white shadow-sm shrink-0 ${sizeClass} ${ballColor(number)} ${isBonus ? "ring-2 ring-offset-1 ring-yellow-400" : ""}`}
        >
            {number}
        </span>
    );
}

function formatWinAmount(amount) {
    if (!amount) return "-";
    const n = parseInt(amount);
    const uk = Math.floor(n / 100000000);
    const man = Math.floor((n % 100000000) / 10000);
    if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
    if (uk > 0) return `${uk}억원`;
    return `${man.toLocaleString()}만원`;
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function generatePredictions(numberFreq) {
    const all = Array.from({ length: 45 }, (_, i) => i + 1);

    if (!numberFreq || Object.keys(numberFreq).length === 0) {
        return Array.from({ length: 5 }, () =>
            shuffle(all).slice(0, 6).sort((a, b) => a - b)
        );
    }

    const ranked = all.slice().sort((a, b) => (numberFreq[b] || 0) - (numberFreq[a] || 0) || a - b);
    const hot  = ranked.slice(0, 15);
    const mid  = ranked.slice(15, 30);
    const cold = ranked.slice(30);

    return [
        [4, 1, 1],
        [1, 1, 4],
        [2, 2, 2],
        [3, 2, 1],
        [1, 3, 2],
    ].map(([hc, mc, cc]) => [
        ...shuffle(hot).slice(0, hc),
        ...shuffle(mid).slice(0, mc),
        ...shuffle(cold).slice(0, cc),
    ].sort((a, b) => a - b));
}

export default function Lotto({ seo = {} }) {
    const [draws, setDraws] = useState([]);
    const [latestDrwNo, setLatestDrwNo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unavailable, setUnavailable] = useState(false);
    const [numberFreq, setNumberFreq] = useState({});
    const [predictions, setPredictions] = useState(() => generatePredictions({}));

    useEffect(() => {
        ajax.get("/api/lottery/lotto/results")
            .then((res) => {
                const { draws: d = [], latestDrwNo: n, unavailable: u, numberFreq: freq = {} } = res;
                setDraws(d);
                setLatestDrwNo(n);
                setUnavailable(!!u);
                setNumberFreq(freq);
                setPredictions(generatePredictions(freq));
            })
            .catch(() => {
                setUnavailable(true);
                setPredictions(generatePredictions({}));
            })
            .finally(() => setLoading(false));
    }, []);

    const refreshPredictions = useCallback(() => {
        setPredictions(generatePredictions(numberFreq));
    }, [numberFreq]);

    const latest = draws[0] ?? null;

    const title = seo.title ?? "로또 당첨번호 확인";
    const description = seo.description ?? "";
    const canonical = seo.canonical ?? "";
    const ogImage = seo.ogImage ?? null;

    return (
        <ServiceLayout>
            <Head>
                <title>{title}</title>
                <meta name="description" content={description} />
                <link rel="canonical" href={canonical} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:url" content={canonical} />
                {ogImage && <meta property="og:image" content={ogImage} />}
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                {ogImage && <meta name="twitter:image" content={ogImage} />}
            </Head>
            <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">

                {/* 최신 회차 하이라이트 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-lg font-bold text-gray-800">
                            {latestDrwNo ? `제 ${latestDrwNo}회 당첨번호` : "최신 당첨번호"}
                        </h2>
                        {latest && (
                            <span className="text-xs text-gray-400">{latest.drwNoDate}</span>
                        )}
                    </div>

                    {loading && (
                        <div className="flex gap-2 justify-center py-4">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                            ))}
                        </div>
                    )}

                    {!loading && unavailable && (
                        <p className="text-center text-sm text-amber-500 py-4">
                            동행복권 서버 점검 중입니다. 잠시 후 다시 시도해 주세요.
                        </p>
                    )}

                    {!loading && !unavailable && latest && (
                        <>
                            <div className="flex items-center gap-1.5 sm:gap-2 justify-center flex-wrap py-1">
                                {latest.numbers.map((n) => (
                                    <Ball key={n} number={n} />
                                ))}
                                <span className="text-gray-300 font-bold text-base mx-0.5">+</span>
                                <Ball number={latest.bonus} isBonus />
                            </div>
                            <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-500 mb-1">1등 당첨금</p>
                                    <p className="text-sm sm:text-base font-bold text-blue-600">
                                        {formatWinAmount(latest.firstWinamnt)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-500 mb-1">1등 당첨자</p>
                                    <p className="text-sm sm:text-base font-bold text-blue-600">
                                        {latest.firstPrzwnerCo}명
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 최근 10회 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
                    <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">최근 당첨 이력</h2>

                    {loading && (
                        <div className="space-y-2.5">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                            ))}
                        </div>
                    )}

                    {!loading && draws.length > 0 && (
                        <>
                            {/* 모바일: 카드 레이아웃 */}
                            <div className="sm:hidden space-y-2">
                                {draws.map((d) => (
                                    <div key={d.drwNo} className="border border-gray-100 rounded-lg px-3 py-2.5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">{d.drwNo}회</span>
                                            <span className="text-xs text-gray-400">{d.drwNoDate}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {d.numbers.map((n) => (
                                                <Ball key={n} number={n} size="xs" />
                                            ))}
                                            <span className="text-gray-300 text-xs mx-0.5">+</span>
                                            <Ball number={d.bonus} size="xs" isBonus />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 데스크탑: 테이블 */}
                            <div className="hidden sm:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                                            <th className="text-left pb-2 pr-3">회차</th>
                                            <th className="text-left pb-2 pr-3">날짜</th>
                                            <th className="pb-2 text-left">당첨번호</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {draws.map((d) => (
                                            <tr key={d.drwNo} className="hover:bg-gray-50">
                                                <td className="py-2 pr-3 font-medium text-gray-700 whitespace-nowrap">
                                                    {d.drwNo}회
                                                </td>
                                                <td className="py-2 pr-3 text-gray-400 whitespace-nowrap text-xs">
                                                    {d.drwNoDate}
                                                </td>
                                                <td className="py-2">
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {d.numbers.map((n) => (
                                                            <Ball key={n} number={n} size="sm" />
                                                        ))}
                                                        <span className="text-gray-300 text-xs">+</span>
                                                        <Ball number={d.bonus} size="sm" isBonus />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* 예상번호 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-gray-800">AI 예상번호</h2>
                            <p className="text-xs text-gray-400 mt-0.5">전체 회차 빈도 분석 기반 · 참고용</p>
                        </div>
                        <button
                            onClick={refreshPredictions}
                            className="flex items-center gap-1.5 text-xs bg-blue-50 active:bg-blue-100 hover:bg-blue-100 text-blue-600 font-medium px-3 py-2.5 rounded-lg transition-colors min-h-11"
                        >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            다시 생성
                        </button>
                    </div>

                    <div className="space-y-2.5 sm:space-y-3">
                        {predictions.map((set, i) => (
                            <div key={i} className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs font-bold text-gray-400 w-4 shrink-0 text-right">{i + 1}</span>
                                <div className="flex gap-1 sm:gap-1.5">
                                    {set.map((n) => (
                                        <Ball key={n} number={n} size="sm" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-4 text-xs text-gray-300 text-center">
                        * 예상번호는 통계 기반 참고용이며, 당첨을 보장하지 않습니다.
                    </p>
                </div>

            </div>
        </ServiceLayout>
    );
}
