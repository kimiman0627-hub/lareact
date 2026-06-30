import React, { useState } from "react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";

interface RankItem {
    rank:  number;
    name:  string;
    total: number;
}

interface PointRankingProps {
    daily:     RankItem[];
    weekly:    RankItem[];
    monthly:   RankItem[];
    updatedAt: string;
}

type Period = "daily" | "weekly" | "monthly";

const PERIOD_LABELS: Record<Period, string> = {
    daily:   "일간",
    weekly:  "주간",
    monthly: "월간",
};

const PERIOD_DESC: Record<Period, string> = {
    daily:   "오늘 획득한 포인트 기준",
    weekly:  "이번 주 획득한 포인트 기준",
    monthly: "이번 달 획득한 포인트 기준",
};

const MEDAL: Record<number, { emoji: string; bg: string; text: string }> = {
    1: { emoji: "🥇", bg: "bg-amber-50",   text: "text-amber-700" },
    2: { emoji: "🥈", bg: "bg-slate-100",  text: "text-slate-600" },
    3: { emoji: "🥉", bg: "bg-orange-50",  text: "text-orange-700" },
};

function RankList({ items }: { items: RankItem[] }) {
    if (!items.length) {
        return (
            <div className="py-20 text-center text-sm text-slate-400">
                아직 포인트 획득 내역이 없습니다.
            </div>
        );
    }

    return (
        <ul className="divide-y divide-slate-100">
            {items.map((item) => {
                const medal = MEDAL[item.rank];
                return (
                    <li
                        key={item.rank}
                        className={`flex items-center gap-4 px-5 py-3.5 transition ${medal ? medal.bg + " hover:brightness-[0.98]" : "hover:bg-slate-50"}`}
                    >
                        {/* 순위 */}
                        <div className="w-10 shrink-0 text-center">
                            {medal ? (
                                <span className="text-2xl leading-none">{medal.emoji}</span>
                            ) : (
                                <span className="text-sm font-bold text-slate-400 tabular-nums">{item.rank}</span>
                            )}
                        </div>

                        {/* 아바타 */}
                        <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold
                            ${item.rank === 1 ? "bg-amber-400 text-white" :
                              item.rank === 2 ? "bg-slate-400 text-white" :
                              item.rank === 3 ? "bg-orange-400 text-white" :
                                               "bg-slate-200 text-slate-500"}`}>
                            {item.name[0]}
                        </div>

                        {/* 이름 */}
                        <div className="flex-1 min-w-0">
                            <span className={`text-sm font-semibold ${medal ? medal.text : "text-slate-700"}`}>
                                {item.name}
                            </span>
                            {item.rank === 1 && (
                                <span className="ml-2 text-[11px] font-bold text-amber-500 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
                                    1위
                                </span>
                            )}
                        </div>

                        {/* 포인트 */}
                        <div className="shrink-0 text-right">
                            <span className={`text-base font-bold tabular-nums ${
                                item.rank === 1 ? "text-amber-600" :
                                item.rank <= 3  ? "text-slate-600" :
                                                  "text-blue-600"
                            }`}>
                                {item.total.toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">P</span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

export default function PointRanking({ daily, weekly, monthly, updatedAt }: PointRankingProps) {
    const [period, setPeriod] = useState<Period>("daily");

    const data: Record<Period, RankItem[]> = { daily, weekly, monthly };
    const current = data[period];
    const top = current[0];

    return (
        <ServiceLayout>
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

                {/* 헤더 */}
                <div className="bg-linear-to-br from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-violet-200 text-sm font-medium">포인트 랭킹</p>
                            <p className="text-2xl font-black mt-1">TOP 20</p>
                            <p className="text-violet-200 text-xs mt-1">{PERIOD_DESC[period]}</p>
                        </div>
                        <div className="text-right">
                            {top && (
                                <>
                                    <p className="text-violet-200 text-xs">현재 1위</p>
                                    <p className="text-lg font-bold mt-0.5">{top.name}</p>
                                    <p className="text-violet-200 text-sm">{top.total.toLocaleString()}P</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 기간 탭 */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex border-b border-slate-100">
                        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`flex-1 py-3 text-sm font-semibold transition relative ${
                                    period === p
                                        ? "text-violet-600"
                                        : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                {PERIOD_LABELS[p]}
                                {period === p && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* 상위 3위 카드 */}
                    {current.length >= 3 && (
                        <div className="grid grid-cols-3 gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100">
                            {/* 2위 */}
                            <div className="flex flex-col items-center gap-1 order-1">
                                <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center text-white font-bold text-lg">
                                    {current[1]?.name[0]}
                                </div>
                                <span className="text-lg leading-none">🥈</span>
                                <p className="text-xs font-semibold text-slate-600 text-center">{current[1]?.name}</p>
                                <p className="text-xs font-bold text-slate-500 tabular-nums">{current[1]?.total.toLocaleString()}P</p>
                            </div>
                            {/* 1위 — 가운데, 더 크게 */}
                            <div className="flex flex-col items-center gap-1 order-2 -mt-3">
                                <div className="w-14 h-14 rounded-full bg-amber-400 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                    {current[0]?.name[0]}
                                </div>
                                <span className="text-2xl leading-none">🥇</span>
                                <p className="text-xs font-semibold text-amber-700 text-center">{current[0]?.name}</p>
                                <p className="text-xs font-bold text-amber-600 tabular-nums">{current[0]?.total.toLocaleString()}P</p>
                            </div>
                            {/* 3위 */}
                            <div className="flex flex-col items-center gap-1 order-3">
                                <div className="w-12 h-12 rounded-full bg-orange-300 flex items-center justify-center text-white font-bold text-lg">
                                    {current[2]?.name[0]}
                                </div>
                                <span className="text-lg leading-none">🥉</span>
                                <p className="text-xs font-semibold text-orange-700 text-center">{current[2]?.name}</p>
                                <p className="text-xs font-bold text-orange-600 tabular-nums">{current[2]?.total.toLocaleString()}P</p>
                            </div>
                        </div>
                    )}

                    {/* 전체 리스트 */}
                    <RankList items={current} />

                    <div className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400 text-right">
                        기준 시각: {updatedAt}
                    </div>
                </div>
            </div>
        </ServiceLayout>
    );
}
