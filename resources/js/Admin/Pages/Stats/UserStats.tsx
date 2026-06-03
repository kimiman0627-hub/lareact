import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

/* ── 날짜 포맷 ──────────────────────────────────────── */
function fmtDate(str: string): string {
    if (!str) return "";
    const [, m, d] = str.split("-");
    return `${m}/${d}`;
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}

/* ── 빠른 기간 선택 프리셋 ──────────────────────────── */
const PRESETS = [
    { label: "오늘",      from: () => today(),       to: () => today()       },
    { label: "7일",       from: () => daysAgo(6),    to: () => today()       },
    { label: "30일",      from: () => daysAgo(29),   to: () => today()       },
    { label: "90일",      from: () => daysAgo(89),   to: () => today()       },
    { label: "이번달",    from: () => today().slice(0, 8) + "01", to: () => today() },
];

/* ── 요약 카드 ──────────────────────────────────────── */
interface StatCardProps {
    label: string;
    value: number;
    sub?: string;
    color: string;
}

function StatCard({ label, value, sub, color }: StatCardProps) {
    const colors: Record<string, string> = {
        blue:  "bg-blue-50 border-blue-200 text-blue-600",
        green: "bg-emerald-50 border-emerald-200 text-emerald-600",
        sky:   "bg-sky-50 border-sky-200 text-sky-600",
        slate: "bg-slate-50 border-slate-200 text-slate-600",
    };
    return (
        <div className={`rounded-xl border p-4 ${colors[color] ?? colors.slate}`}>
            <p className="text-xs font-semibold opacity-70 mb-1">{label}</p>
            <p className="text-3xl font-black">{value.toLocaleString()}</p>
            {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
        </div>
    );
}

/* ── 커스텀 툴팁 ────────────────────────────────────── */
interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-bold text-slate-700 mb-2">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }} className="font-medium">
                    {p.name}:{" "}
                    <span className="font-bold">{p.value.toLocaleString()}</span>
                </p>
            ))}
        </div>
    );
}

/* ── 메인 페이지 ────────────────────────────────────── */
interface UserStatsProps {
    series?: any[];
    summary?: any;
    from: string;
    to: string;
}

export default function UserStats({ series = [], summary = {}, from, to }: UserStatsProps) {
    const { auth } = usePage<any>().props;

    const [form, setForm] = useState<{ from: string; to: string }>({ from: from ?? daysAgo(29), to: to ?? today() });

    function applyPreset(preset: typeof PRESETS[number]) {
        const next = { from: preset.from(), to: preset.to() };
        setForm(next);
        router.get("/admin/stats/users", next, { preserveState: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get("/admin/stats/users", form, { preserveState: true, replace: true });
    }

    function isActivePreset(preset: typeof PRESETS[number]): boolean {
        return form.from === preset.from() && form.to === preset.to();
    }

    const chartData = series.map((r) => ({
        ...r,
        label: fmtDate(r.date),
    }));

    // X축 간격 — 기간이 길수록 레이블 간격 넓힘
    const days       = series.length;
    const xInterval  = days <= 7 ? 0 : days <= 31 ? 4 : days <= 90 ? 9 : 19;

    const periodReg   = series.reduce((s, r) => s + r.reg_count, 0);
    const periodLogin = series.reduce((s, r) => s + r.login_count, 0);

    return (
        <AdminLayout>
            <div className="space-y-6">

                {/* 헤더 */}
                <h1 className="text-2xl font-bold text-gray-800">회원 통계</h1>

                {/* 검색폼 */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <form onSubmit={handleSearch}>
                        <div className="flex flex-wrap items-end gap-3">
                            {/* 시작일 */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    시작일
                                </label>
                                <input
                                    type="date"
                                    value={form.from}
                                    max={form.to}
                                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <span className="text-slate-400 pb-2">~</span>

                            {/* 종료일 */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    종료일
                                </label>
                                <input
                                    type="date"
                                    value={form.to}
                                    min={form.from}
                                    max={today()}
                                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* 검색 버튼 */}
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                            >
                                검색
                            </button>

                            {/* 구분선 */}
                            <div className="w-px h-8 bg-gray-200 self-center hidden sm:block" />

                            {/* 빠른 선택 프리셋 */}
                            <div className="flex gap-1.5 flex-wrap">
                                {PRESETS.map((p) => (
                                    <button
                                        key={p.label}
                                        type="button"
                                        onClick={() => applyPreset(p)}
                                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                                            isActivePreset(p)
                                                ? "bg-blue-600 text-white"
                                                : "bg-white border border-gray-300 text-slate-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                {/* 요약 카드 (항상 오늘/이번주/이번달 기준) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="오늘 가입"    value={summary.today_reg   ?? 0} color="blue"  />
                    <StatCard label="오늘 로그인"  value={summary.today_login ?? 0} color="green" />
                    <StatCard label="이번달 가입"  value={summary.month_reg   ?? 0}
                        sub={`이번 주 ${summary.week_reg ?? 0}명`} color="sky" />
                    <StatCard label="전체 회원수"  value={summary.total_users ?? 0} color="slate" />
                </div>

                {/* 차트 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-700">
                            {from} ~ {to} 추이
                        </h2>
                        <div className="flex gap-4 text-xs text-slate-500">
                            <span>
                                가입 합계&nbsp;
                                <span className="font-bold text-blue-600">
                                    {periodReg.toLocaleString()}명
                                </span>
                            </span>
                            <span>
                                로그인 합계&nbsp;
                                <span className="font-bold text-emerald-600">
                                    {periodLogin.toLocaleString()}회
                                </span>
                            </span>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: "#94a3b8" }}
                                interval={xInterval}
                            />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                formatter={(v) => (
                                    <span className="text-xs text-slate-600">{v}</span>
                                )}
                            />
                            <Bar
                                dataKey="reg_count"
                                name="가입"
                                fill="#3b82f6"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={24}
                            />
                            <Line
                                dataKey="login_count"
                                name="로그인"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                type="monotone"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* 일별 상세 테이블 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h2 className="font-bold text-slate-700 text-sm">일별 상세</h2>
                        <span className="text-xs text-slate-400">{days}일 기간</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-2.5 font-semibold">날짜</th>
                                    <th className="px-5 py-2.5 font-semibold text-blue-600">신규 가입</th>
                                    <th className="px-5 py-2.5 font-semibold text-emerald-600">로그인 수</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {[...series].reverse().map((row) => (
                                    <tr key={row.date} className="hover:bg-gray-50 transition">
                                        <td className="px-5 py-2.5 text-slate-600 font-medium">
                                            {row.date}
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-blue-600 w-8 text-right">
                                                    {row.reg_count}
                                                </span>
                                                {row.reg_count > 0 && (
                                                    <div
                                                        className="h-1.5 rounded-full bg-blue-400 opacity-60"
                                                        style={{
                                                            width: `${Math.min(row.reg_count * 12, 120)}px`,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-emerald-600 w-8 text-right">
                                                    {row.login_count}
                                                </span>
                                                {row.login_count > 0 && (
                                                    <div
                                                        className="h-1.5 rounded-full bg-emerald-400 opacity-60"
                                                        style={{
                                                            width: `${Math.min(row.login_count * 4, 120)}px`,
                                                        }}
                                                    />
                                                )}
                                            </div>
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
