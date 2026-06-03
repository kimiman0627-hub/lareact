import React, { useState } from "react";
import { router } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import Pagination from "@/Admin/Components/Common/Pagination";
import { ajax } from "@/Utils/network";

const REASON_LABEL: Record<string, { label: string; cls: string }> = {
    SPAM:    { label: "스팸/도배",   cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    OBSCENE: { label: "음란/불건전", cls: "bg-pink-100 text-pink-700 border-pink-200" },
    ILLEGAL: { label: "불법 정보",   cls: "bg-red-100 text-red-700 border-red-200" },
    ETC:     { label: "기타",        cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: "대기중",  cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    REVIEWED:  { label: "검토완료", cls: "bg-green-100 text-green-700 border-green-200" },
    DISMISSED: { label: "기각",    cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

interface ReasonBadgeProps {
    reason: string;
}

function ReasonBadge({ reason }: ReasonBadgeProps) {
    const r = REASON_LABEL[reason] ?? { label: reason, cls: "bg-gray-100 text-gray-600 border-gray-200" };
    return <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-semibold ${r.cls}`}>{r.label}</span>;
}

interface StatusSelectProps {
    id: number;
    current: string;
}

function StatusSelect({ id, current }: StatusSelectProps) {
    const [value, setValue] = useState<string>(current);
    const [saving, setSaving] = useState<boolean>(false);

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const next = e.target.value;
        setValue(next);
        setSaving(true);
        ajax.patch(`/admin/reports/${id}`, { status: next })
            .finally(() => setSaving(false));
    }

    return (
        <select
            value={value}
            onChange={handleChange}
            disabled={saving}
            className={`border rounded px-2 py-0.5 text-xs font-semibold focus:outline-none transition ${
                STATUS_LABEL[value]?.cls ?? "border-gray-200 text-gray-600"
            }`}
        >
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
            ))}
        </select>
    );
}

function formatDate(str: string | null | undefined): string {
    if (!str) return "-";
    return str.replace("T", " ").slice(0, 16);
}

interface ReportListProps {
    list: any;
    filters: any;
}

export default function ReportList({ list, filters }: ReportListProps) {
    const items = list.data ?? [];
    const meta  = list.meta ?? list;

    const [status, setStatus] = useState<string>(filters.status ?? "");
    const [reason, setReason] = useState<string>(filters.reason ?? "");

    function applyFilter() {
        router.get("/admin/reports", { status, reason, page: 1 }, { preserveScroll: true });
    }

    function resetFilter() {
        setStatus(""); setReason("");
        router.get("/admin/reports", {}, { preserveScroll: true });
    }

    return (
        <AdminLayout title="신고 관리">
            {/* 필터 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">사유</label>
                    <select value={reason} onChange={(e) => setReason(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 transition">
                        <option value="">전체</option>
                        {Object.entries(REASON_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">상태</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 transition">
                        <option value="">전체</option>
                        {Object.entries(STATUS_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
                <button onClick={applyFilter}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
                    검색
                </button>
                <button onClick={resetFilter}
                    className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-slate-600 text-sm rounded-lg transition">
                    초기화
                </button>
            </div>

            {/* 테이블 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">신고 목록</span>
                    <span className="text-xs text-slate-400">총 {meta.total ?? 0}건</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-slate-50 text-xs text-slate-500 font-semibold">
                                <th className="px-4 py-2.5 text-left w-10">#</th>
                                <th className="px-4 py-2.5 text-left">게시글</th>
                                <th className="px-4 py-2.5 text-left w-24">신고자</th>
                                <th className="px-4 py-2.5 text-left w-24">사유</th>
                                <th className="px-4 py-2.5 text-left w-48">상세</th>
                                <th className="px-4 py-2.5 text-left w-28">상태</th>
                                <th className="px-4 py-2.5 text-left w-36">신고일시</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {items.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">신고 내역이 없습니다.</td></tr>
                            )}
                            {items.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition whitespace-nowrap">
                                    <td className="px-4 py-2.5 text-slate-400 text-xs">{item.id}</td>
                                    <td className="px-4 py-2.5 max-w-xs">
                                        <a
                                            href={`/post/${item.post_id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-slate-700 hover:text-blue-500 transition truncate block"
                                        >
                                            {item.post_title}
                                        </a>
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-600 text-xs">
                                        {item.reporter_name ?? <span className="text-slate-400">비로그인</span>}
                                    </td>
                                    <td className="px-4 py-2.5"><ReasonBadge reason={item.reason} /></td>
                                    <td className="px-4 py-2.5 text-slate-500 text-xs max-w-48 truncate">
                                        {item.detail ?? "-"}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <StatusSelect id={item.id} current={item.status} />
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-400 text-xs">{formatDate(item.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination links={list.links ?? []} />
            </div>
        </AdminLayout>
    );
}
