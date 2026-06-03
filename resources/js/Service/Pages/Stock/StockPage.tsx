import React, { useState, useEffect, useCallback } from "react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import SeoHead from "@/Service/Components/Common/SeoHead";
import { ajax } from "@/Utils/network";
import type { SeoData } from "@/types";

interface StockItem {
    name: string;
    symbol?: string;
    price: number;
    change: number;
    up: boolean;
    trade_val: string;
}

interface ChangeCellProps {
    up: boolean;
    change: number;
}

function ChangeCell({ up, change }: ChangeCellProps) {
    return (
        <span className={`font-semibold whitespace-nowrap ${up ? "text-red-500" : "text-blue-500"}`}>
            {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
        </span>
    );
}

interface StockPageProps {
    seo?: SeoData;
}

export default function StockPage({ seo = {} }: StockPageProps) {
    const [data, setData] = useState<Record<string, StockItem[]> | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    const [tab, setTab] = useState("kospi");
    const [error, setError] = useState(false);

    const fetchData = useCallback(() => {
        (ajax.get("/api/stocks/detail") as Promise<Record<string, StockItem[]>>)
            .then((json) => {
                setData(json);
                setUpdatedAt(new Date());
                setError(false);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchData();
        const timer = setInterval(fetchData, 60_000);
        return () => clearInterval(timer);
    }, [fetchData]);

    const list: StockItem[] = data?.[tab] ?? [];

    return (
        <ServiceLayout>
            <SeoHead seo={seo} defaultTitle="주식 시세" />
            <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-3">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
                    <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                        <div className="flex gap-1.5">
                            {["kospi", "kosdaq", "nasdaq"].map((t) => (
                                <button key={t} onClick={() => setTab(t)}
                                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold transition ${tab === t ? "bg-blue-600 text-white" : "text-slate-500 hover:text-blue-600 bg-gray-50"}`}>
                                    {t.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {updatedAt && (
                                <span className="hidden sm:inline text-xs text-gray-400 whitespace-nowrap">
                                    {updatedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} 기준
                                </span>
                            )}
                            <button onClick={fetchData}
                                className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-2.5 py-1 rounded-lg transition whitespace-nowrap">
                                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="hidden sm:inline">새로고침</span>
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="space-y-2">
                            {[...Array(10)].map((_, i) => <div key={i} className="h-8 sm:h-9 bg-gray-100 rounded animate-pulse" />)}
                        </div>
                    )}
                    {!loading && error && <p className="text-center text-sm text-amber-500 py-8">시세를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.</p>}
                    {!loading && !error && list.length === 0 && <p className="text-center text-sm text-gray-400 py-8">장 마감 또는 데이터 없음</p>}

                    {!loading && !error && list.length > 0 && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] sm:text-xs text-gray-400 border-b border-gray-100">
                                    <th className="hidden sm:table-cell text-left pb-2 pr-2 w-6">#</th>
                                    <th className="text-left pb-2 pr-2">종목</th>
                                    <th className="text-right pb-2 pr-2">현재가</th>
                                    <th className="text-right pb-2 pr-2">등락률</th>
                                    <th className="hidden sm:table-cell text-right pb-2">거래대금</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {list.map((stock, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="hidden sm:table-cell py-2.5 pr-2 text-xs text-gray-400">{i + 1}</td>
                                        <td className="py-2 sm:py-2.5 pr-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="sm:hidden text-[10px] text-gray-400 w-4 shrink-0">{i + 1}</span>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-800 text-xs leading-tight truncate">
                                                        {tab === "nasdaq" ? stock.symbol : stock.name}
                                                    </p>
                                                    {tab === "nasdaq" && (
                                                        <p className="hidden sm:block text-[10px] text-gray-400 truncate">{stock.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-2 sm:py-2.5 pr-2 text-right text-xs font-medium text-gray-700 whitespace-nowrap">
                                            {tab === "nasdaq" ? `$${stock.price.toLocaleString()}` : `${stock.price.toLocaleString()}원`}
                                        </td>
                                        <td className="py-2 sm:py-2.5 pr-2 text-right text-xs">
                                            <ChangeCell up={stock.up} change={stock.change} />
                                        </td>
                                        <td className="hidden sm:table-cell py-2.5 text-right text-xs text-gray-400 whitespace-nowrap">{stock.trade_val}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <p className="text-[10px] sm:text-xs text-gray-300 text-center">* 거래대금 상위 20개 종목 · 지연 데이터일 수 있습니다.</p>
            </div>
        </ServiceLayout>
    );
}
