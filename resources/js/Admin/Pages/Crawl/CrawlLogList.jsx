import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import Pagination from "@/Admin/Components/Common/Pagination";
import axios from "axios";

const STATUS_BADGE = {
    RUNNING: { label: "실행중",  cls: "bg-blue-100 text-blue-700 border-blue-200"  },
    DONE:    { label: "완료",    cls: "bg-green-100 text-green-700 border-green-200" },
    FAILED:  { label: "실패",    cls: "bg-red-100 text-red-700 border-red-200"      },
};

function StatusBadge({ status }) {
    const s = STATUS_BADGE[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${s.cls}`}>
            {status === "RUNNING" && (
                <svg className="animate-spin mr-1 w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
            )}
            {s.label}
        </span>
    );
}

function StatCell({ value, colorCls = "text-slate-700" }) {
    return <span className={`font-mono text-sm font-semibold ${colorCls}`}>{value?.toLocaleString() ?? "-"}</span>;
}

function formatDuration(sec) {
    if (sec == null) return "-";
    if (sec < 60) return `${sec}초`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
}

function formatDateTime(str) {
    if (!str) return "-";
    return str.replace("T", " ").substring(0, 19);
}

/** 에러 로그 상세 모달 */
function ErrorModal({ logId, onClose }) {
    const [errors, setErrors] = useState(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        axios.get(`/admin/crawl-logs/${logId}`)
            .then(res => setErrors(res.data.error_log ?? []))
            .catch(() => setErrors([]))
            .finally(() => setLoading(false));
    }, [logId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-slate-800">에러 로그 상세</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8 text-slate-400 text-sm">불러오는 중...</div>
                    ) : errors.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">에러 없음</div>
                    ) : (
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="text-left px-3 py-2 text-slate-500 font-semibold w-36">시각</th>
                                    <th className="text-left px-3 py-2 text-slate-500 font-semibold">에러 메시지</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {errors.map((e, i) => (
                                    <tr key={i} className="hover:bg-red-50">
                                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{e.time ?? "-"}</td>
                                        <td className="px-3 py-2 text-red-700 font-mono break-all">{e.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CrawlLogList({ logs, sources = [], params = {} }) {
    const [source, setSource] = useState(params.source ?? "");
    const [status, setStatus] = useState(params.status ?? "");
    const [modalId, setModalId] = useState(null);

    function applyFilter() {
        router.get("/admin/crawl-logs", { source: source || undefined, status: status || undefined }, { preserveState: true });
    }

    function resetFilter() {
        setSource("");
        setStatus("");
        router.get("/admin/crawl-logs");
    }

    const items = logs?.data ?? [];

    return (
        <AdminLayout>
            {modalId !== null && <ErrorModal logId={modalId} onClose={() => setModalId(null)} />}

            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-5 text-slate-800">크롤링 로그</h2>

                {/* 필터 */}
                <div className="flex flex-wrap gap-3 mb-5 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600 whitespace-nowrap">소스</label>
                        <select
                            value={source}
                            onChange={e => setSource(e.target.value)}
                            className="text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">전체</option>
                            {sources.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600 whitespace-nowrap">상태</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">전체</option>
                            <option value="RUNNING">실행중</option>
                            <option value="DONE">완료</option>
                            <option value="FAILED">실패</option>
                        </select>
                    </div>
                    <button
                        onClick={applyFilter}
                        className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        조회
                    </button>
                    <button
                        onClick={resetFilter}
                        className="px-4 py-1.5 text-sm bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition"
                    >
                        초기화
                    </button>
                </div>

                {/* 테이블 */}
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">소스</th>
                                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">커맨드</th>
                                <th className="text-center px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">상태</th>
                                <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">발견</th>
                                <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">저장</th>
                                <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">스킵</th>
                                <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">오류</th>
                                <th className="text-left px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">시작시각</th>
                                <th className="text-right px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">소요</th>
                                <th className="text-center px-4 py-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">에러보기</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-12 text-slate-400 text-sm">
                                        크롤링 로그가 없습니다.
                                    </td>
                                </tr>
                            ) : items.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-3">
                                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono font-semibold">
                                            {log.source}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{log.command}</td>
                                    <td className="px-4 py-3 text-center"><StatusBadge status={log.status} /></td>
                                    <td className="px-4 py-3 text-right"><StatCell value={log.total_found} /></td>
                                    <td className="px-4 py-3 text-right"><StatCell value={log.total_saved} colorCls="text-green-600" /></td>
                                    <td className="px-4 py-3 text-right"><StatCell value={log.total_skipped} colorCls="text-slate-400" /></td>
                                    <td className="px-4 py-3 text-right">
                                        <StatCell
                                            value={log.total_errors}
                                            colorCls={log.total_errors > 0 ? "text-red-500" : "text-slate-400"}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(log.started_at)}</td>
                                    <td className="px-4 py-3 text-right text-slate-500 text-xs">{formatDuration(log.duration_sec)}</td>
                                    <td className="px-4 py-3 text-center">
                                        {log.total_errors > 0 ? (
                                            <button
                                                onClick={() => setModalId(log.id)}
                                                className="text-xs text-red-500 hover:text-red-700 underline transition"
                                            >
                                                {log.total_errors}건 확인
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 페이지네이션 */}
                {logs?.last_page > 1 && (
                    <div className="mt-4">
                        <Pagination links={logs.links} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
