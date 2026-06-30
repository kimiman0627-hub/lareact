import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import Pagination from "@/Admin/Components/Common/Pagination";

const fmt = (d: string | null | undefined): string =>
    d
        ? new Date(d).toLocaleString("ko-KR", {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
          })
        : "";

interface PointItem {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    type: string;
    amount: number;
    balance: number;
    description: string | null;
    related_type: string | null;
    related_id: number | null;
    created_at: string;
}

interface PointListProps {
    list: { data: PointItem[]; current_page: number; last_page: number; total: number };
    total: number;
    params: Record<string, string>;
    pointTypes: Record<string, string>;
}

export default function PointList({ list, total, params, pointTypes }: PointListProps) {
    const items    = list.data ?? [];
    const curPage  = list.current_page ?? 1;
    const lastPage = list.last_page ?? 1;

    const [form, setForm] = useState({
        keyword:    params?.keyword    ?? "",
        type:       params?.type       ?? "",
        start_date: params?.start_date ?? "",
        end_date:   params?.end_date   ?? "",
    });

    function search(e: React.FormEvent) {
        e.preventDefault();
        router.get("/admin/points", { ...form, page: 1 }, { preserveScroll: true });
    }

    function reset() {
        setForm({ keyword: "", type: "", start_date: "", end_date: "" });
        router.get("/admin/points", { page: 1 });
    }

    function goPage(page: number) {
        router.get("/admin/points", { ...params, page }, { preserveScroll: true });
    }

    const inputCls = "rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none";

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">포인트 내역</h1>
                        <p className="text-sm text-slate-400 mt-0.5">전체 {total.toLocaleString()}건</p>
                    </div>
                </div>

                {/* 검색 필터 */}
                <form onSubmit={search} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">유저 검색</label>
                            <input
                                type="text"
                                placeholder="이름 또는 이메일"
                                value={form.keyword}
                                onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
                                className={inputCls + " w-44"}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">타입</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                                className={inputCls + " w-36"}
                            >
                                <option value="">전체</option>
                                {Object.entries(pointTypes).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">시작일</label>
                            <input
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                                className={inputCls}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">종료일</label>
                            <input
                                type="date"
                                value={form.end_date}
                                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                                className={inputCls}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
                                검색
                            </button>
                            <button type="button" onClick={reset}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-lg transition">
                                초기화
                            </button>
                        </div>
                    </div>
                </form>

                {/* 테이블 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-10">#</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">유저</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">타입</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">포인트</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">잔액</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">설명</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">일시</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16 text-sm text-slate-400">
                                            포인트 내역이 없습니다.
                                        </td>
                                    </tr>
                                ) : items.map((item) => {
                                    const isEarn = item.amount > 0;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 text-xs text-slate-400">{item.id}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-slate-700">{item.user_name}</p>
                                                <p className="text-xs text-slate-400">{item.user_email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block text-[11px] font-semibold rounded px-2 py-0.5 leading-tight ${
                                                    isEarn
                                                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                                                        : "bg-red-50 text-red-500 border border-red-100"
                                                }`}>
                                                    {pointTypes[item.type] ?? item.type}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold text-sm ${isEarn ? "text-blue-600" : "text-red-500"}`}>
                                                {isEarn ? "+" : ""}{item.amount.toLocaleString()}P
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-slate-600 font-medium">
                                                {item.balance.toLocaleString()}P
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500 max-w-40 truncate">
                                                {item.description ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                                                {fmt(item.created_at)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-gray-100">
                        <Pagination currentPage={curPage} lastPage={lastPage} onPageChange={goPage} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
