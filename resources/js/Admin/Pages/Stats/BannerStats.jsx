import React, { useState } from "react";
import { router } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import {
    ComposedChart, Bar, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

function fmtDate(str) {
    if (!str) return "";
    const [, m, d] = str.split("-");
    return `${m}/${d}`;
}

function today()      { return new Date().toISOString().slice(0, 10); }
function daysAgo(n)   { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function thisMonthStart() { return today().slice(0, 8) + "01"; }

const PRESETS = [
    { label: "오늘",   from: today,          to: today    },
    { label: "7일",    from: () => daysAgo(6),  to: today },
    { label: "30일",   from: () => daysAgo(29), to: today },
    { label: "90일",   from: () => daysAgo(89), to: today },
    { label: "이번달", from: thisMonthStart,  to: today    },
];

const POSITION_LABEL = { MAIN_TOP: "메인상단", MAIN_BOTTOM: "메인하단", SIDE: "사이드", SIDE1: "사이드1", SIDE2: "사이드2" };
const TYPE_LABEL     = { IMAGE: "이미지", HTML: "HTML", IFRAME: "iframe", SCRIPT: "스크립트", VIDEO: "동영상" };
const STATUS_CLS     = { ACTIVE: "bg-green-100 text-green-700", INACTIVE: "bg-gray-100 text-gray-500" };

function ctr(impressions, clicks) {
    if (!impressions) return "0%";
    return ((clicks / impressions) * 100).toFixed(2) + "%";
}

function SummaryCard({ label, value, sub, color }) {
    const map = {
        blue:  "bg-blue-50 border-blue-100 text-blue-600",
        green: "bg-green-50 border-green-100 text-green-600",
        amber: "bg-amber-50 border-amber-100 text-amber-600",
    };
    return (
        <div className={`rounded-lg border p-5 ${map[color]}`}>
            <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-3xl font-black text-slate-800">{value}</p>
            {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
    );
}

export default function BannerStats({ auth, bannerStats = [], summary = {}, series = [], from, to }) {
    const [localFrom, setLocalFrom] = useState(from);
    const [localTo,   setLocalTo]   = useState(to);

    function applyFilter(f, t) {
        router.get("/admin/stats/banners", { from: f, to: t }, { preserveScroll: true });
    }

    const overallCtr = summary.total_impressions
        ? ((summary.total_clicks / summary.total_impressions) * 100).toFixed(2) + "%"
        : "0%";

    const chartData = series.map((d) => ({
        date:        fmtDate(d.date),
        노출:        d.impressions,
        클릭:        d.clicks,
    }));

    return (
        <AdminLayout user={auth?.user}>
            <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">배너 통계</h2>

                {/* 기간 선택 */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-center gap-3">
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => { const f = p.from(); const t = p.to(); setLocalFrom(f); setLocalTo(t); applyFilter(f, t); }}
                            className={`px-3 py-1.5 text-xs font-medium rounded border transition ${
                                localFrom === p.from() && localTo === p.to()
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-gray-200 text-slate-600 hover:border-blue-400"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                    <div className="flex items-center gap-2 ml-auto">
                        <input type="date" value={localFrom} max={localTo}
                            onChange={(e) => setLocalFrom(e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1.5 text-xs" />
                        <span className="text-slate-400 text-xs">~</span>
                        <input type="date" value={localTo} min={localFrom}
                            onChange={(e) => setLocalTo(e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1.5 text-xs" />
                        <button
                            onClick={() => applyFilter(localFrom, localTo)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                        >
                            조회
                        </button>
                    </div>
                </div>

                {/* 요약 카드 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SummaryCard label="총 노출수"  value={summary.total_impressions?.toLocaleString() ?? 0} color="blue"  />
                    <SummaryCard label="총 클릭수"  value={summary.total_clicks?.toLocaleString() ?? 0}      color="green" />
                    <SummaryCard label="전체 CTR"   value={overallCtr} sub="클릭수 / 노출수"                  color="amber" />
                </div>

                {/* 일별 추이 차트 */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                    <p className="text-sm font-bold text-slate-700 mb-4">일별 노출 / 클릭 추이</p>
                    {chartData.length === 0 || chartData.every(d => d.노출 === 0 && d.클릭 === 0) ? (
                        <p className="text-sm text-slate-400 text-center py-10">기간 내 데이터가 없습니다.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                                <YAxis yAxisId="left"  tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar    yAxisId="left"  dataKey="노출" fill="#60a5fa" radius={[3,3,0,0]} maxBarSize={32} />
                                <Line   yAxisId="right" dataKey="클릭" stroke="#10b981" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* 배너별 테이블 */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100">
                        <p className="text-sm font-bold text-slate-700">배너별 상세</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                                    <th className="px-4 py-3 text-left font-semibold">배너명</th>
                                    <th className="px-4 py-3 text-left font-semibold">위치</th>
                                    <th className="px-4 py-3 text-left font-semibold">타입</th>
                                    <th className="px-4 py-3 text-left font-semibold">상태</th>
                                    <th className="px-4 py-3 text-right font-semibold">노출수</th>
                                    <th className="px-4 py-3 text-right font-semibold">클릭수</th>
                                    <th className="px-4 py-3 text-right font-semibold">CTR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bannerStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                                            배너 데이터가 없습니다.
                                        </td>
                                    </tr>
                                ) : bannerStats.map((b) => (
                                    <tr key={b.banner_id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-medium text-slate-700 max-w-[200px] truncate">{b.title}</td>
                                        <td className="px-4 py-3 text-slate-500">{POSITION_LABEL[b.banner_position] ?? b.banner_position}</td>
                                        <td className="px-4 py-3 text-slate-500">{TYPE_LABEL[b.banner_type] ?? b.banner_type}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_CLS[b.banner_status] ?? "bg-gray-100 text-gray-500"}`}>
                                                {b.banner_status === "ACTIVE" ? "활성" : "비활성"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                            {Number(b.total_impressions).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                            {Number(b.total_clicks).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600">
                                            {ctr(b.total_impressions, b.total_clicks)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
