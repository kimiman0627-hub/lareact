import React, { useState } from "react";
import { usePage, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";

function FlashMessage() {
    const { flash = {} } = usePage<any>().props;
    if (!flash.success && !flash.error) return null;
    const isSuccess = !!flash.success;
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium mb-6 ${
            isSuccess ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
        }`}>
            {isSuccess
                ? <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                : <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            }
            {flash.success || flash.error}
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: number;
    color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
        </div>
    );
}

function PublishNowButton() {
    const [loading, setLoading]   = useState<boolean>(false);
    const [result,  setResult]    = useState<any>(null);

    async function handlePublish() {
        if (!confirm("지금 바로 발행을 실행하시겠습니까?\n(활성화 여부와 무관하게 즉시 발행됩니다)")) return;
        setLoading(true);
        setResult(null);
        try {
            const res  = await fetch("/admin/blogger/publish-now", {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? "",
                    "Accept": "application/json",
                },
            });
            const data = await res.json();
            setResult(data);
            // 페이지 새로고침해서 로그 반영
            setTimeout(() => router.reload(), 1500);
        } catch {
            setResult({ success: false, output: "요청 실패" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-2">
            <button onClick={handlePublish} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition">
                {loading
                    ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                }
                {loading ? "발행 중..." : "지금 발행"}
            </button>
            {result && (
                <div className={`rounded-lg p-3 text-xs font-mono whitespace-pre-wrap border ${
                    result.success ? "bg-slate-900 text-green-300 border-slate-700" : "bg-red-50 text-red-700 border-red-200"
                }`}>
                    {result.output || (result.success ? "완료" : "오류 발생")}
                </div>
            )}
        </div>
    );
}

interface ScheduleBadgeProps {
    settings: any;
}

function ScheduleBadge({ settings }: ScheduleBadgeProps) {
    const enabled = settings.blogger_enabled === "1";
    const isHourly = settings.blogger_schedule_type === "hourly";
    const time = settings.blogger_schedule_time ?? "09:00";
    const minute = time.split(":")[1] ?? "00";

    let scheduleLabel = "";
    if (enabled) {
        scheduleLabel = isHourly
            ? `매시 :${minute} 발행`
            : `매일 ${time} 발행`;
    }

    return (
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border font-medium ${
            enabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-slate-100 border-slate-200 text-slate-500"
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-emerald-500" : "bg-slate-400"}`} />
            {enabled ? `자동 발행 ON — ${scheduleLabel}` : "자동 발행 OFF"}
            <Link href="/admin/settings/api-keys" className="ml-1 underline underline-offset-2 opacity-70 hover:opacity-100">
                설정
            </Link>
        </div>
    );
}

interface BloggerLogsProps {
    logs: any;
    stats: any;
    filter: string;
    settings: any;
}

export default function BloggerLogs({ logs, stats, filter, settings }: BloggerLogsProps) {
    const { auth } = usePage<any>().props;

    const filters = [
        { label: "전체", value: "" },
        { label: "성공", value: "SUCCESS" },
        { label: "실패", value: "FAILED" },
    ];

    function applyFilter(value: string) {
        router.get("/admin/blogger/logs", value ? { status: value } : {}, { preserveState: true });
    }

    return (
        <AdminLayout>
            <div className="p-6 max-w-6xl mx-auto">
                {/* 헤더 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Blogger 발행 로그</h1>
                        <p className="text-sm text-slate-400 mt-1">Google Blogger에 발행된 게시물 이력</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <ScheduleBadge settings={settings} />
                        <PublishNowButton />
                    </div>
                </div>

                <FlashMessage />

                {/* 통계 카드 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard label="전체 발행 시도" value={stats.total}   color="text-slate-700" />
                    <StatCard label="성공"           value={stats.success} color="text-emerald-600" />
                    <StatCard label="실패"           value={stats.failed}  color="text-red-500" />
                </div>

                {/* 필터 탭 */}
                <div className="flex gap-1 mb-4">
                    {filters.map((f) => (
                        <button key={f.value} onClick={() => applyFilter(f.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                filter === f.value
                                    ? "bg-blue-600 text-white"
                                    : "bg-white border border-gray-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                            }`}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* 로그 테이블 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {logs.data.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 text-sm">
                            발행 이력이 없습니다.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-slate-50 text-xs text-slate-500 font-semibold">
                                    <th className="px-4 py-3 text-left">상태</th>
                                    <th className="px-4 py-3 text-left">제목</th>
                                    <th className="px-4 py-3 text-left">출처</th>
                                    <th className="px-4 py-3 text-right">조회수</th>
                                    <th className="px-4 py-3 text-left">발행 일시</th>
                                    <th className="px-4 py-3 text-left">링크</th>
                                    <th className="px-4 py-3 text-center">삭제</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.data.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3">
                                            {log.status === "SUCCESS" ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />성공
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-600">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />실패
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-slate-700 font-medium truncate max-w-xs" title={log.post_title}>
                                                {log.post_title}
                                            </p>
                                            {log.status === "FAILED" && log.message && (
                                                <p className="text-[11px] text-red-500 truncate max-w-xs mt-0.5" title={log.message}>
                                                    {log.message}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{log.source ?? "—"}</td>
                                        <td className="px-4 py-3 text-right text-slate-500">{Number(log.hits).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString("ko-KR", {
                                                month: "2-digit", day: "2-digit",
                                                hour: "2-digit", minute: "2-digit",
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.blogger_url ? (
                                                <a href={log.blogger_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1">
                                                    보기
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            ) : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => {
                                                    if (!confirm(`"${log.post_title}" 발행을 삭제하시겠습니까?\nBlogger에서도 삭제되며 다시 발행 가능합니다.`)) return;
                                                    router.delete(`/admin/blogger/logs/${log.id}`);
                                                }}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition"
                                                title="삭제"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 페이지네이션 */}
                {logs.last_page > 1 && (
                    <div className="flex justify-center gap-1 mt-5">
                        {logs.links.map((link: any, i: number) => (
                            <button key={i}
                                disabled={!link.url || link.active}
                                onClick={() => link.url && router.get(link.url)}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                                    link.active
                                        ? "bg-blue-600 text-white"
                                        : link.url
                                            ? "bg-white border border-gray-200 text-slate-500 hover:border-blue-400"
                                            : "bg-white border border-gray-100 text-slate-300 cursor-default"
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
