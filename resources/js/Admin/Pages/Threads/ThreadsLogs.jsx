import React, { useState } from "react";
import { usePage, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import { ajax } from "@/Utils/network";

function FlashMessage() {
    const { flash = {} } = usePage().props;
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

function StatCard({ label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
        </div>
    );
}

function ScheduleBadge({ settings }) {
    const enabled  = settings.threads_enabled === "1";
    const isHourly = settings.threads_schedule_type === "hourly";
    const time     = settings.threads_schedule_time ?? "10:00";
    const minute   = time.split(":")[1] ?? "00";

    const scheduleLabel = enabled
        ? (isHourly ? `매시 :${minute} 발행` : `매일 ${time} 발행`)
        : "";

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

function PublishNowButton() {
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState(null);

    async function handlePublish() {
        if (!confirm("지금 바로 자동 발행을 실행하시겠습니까?\n(활성화 여부와 무관하게 즉시 발행됩니다)")) return;
        setLoading(true);
        setResult(null);
        try {
            const res  = await fetch("/admin/threads/publish-now", {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
                    "Accept": "application/json",
                },
            });
            const data = await res.json();
            setResult(data);
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
                className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition">
                {loading
                    ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.29 8.29 0 004.83 1.53v-3.4a4.85 4.85 0 01-1.06-.19z"/></svg>
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

/** 게시물 검색 + 커스텀 텍스트 입력 후 단건 발행 모달 */
function PublishPostModal({ onClose }) {
    const [query,     setQuery]     = useState("");
    const [results,   setResults]   = useState([]);
    const [searching, setSearching] = useState(false);
    const [selected,  setSelected]  = useState(null);
    const [text,      setText]      = useState("");
    const [charCount, setCharCount] = useState(0);
    const [previewing, setPreviewing] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [result,    setResult]    = useState(null);

    async function search() {
        if (!query.trim()) return;
        setSearching(true);
        try {
            const data = await ajax.get("/admin/posts/search", { q: query, per_page: 10 });
            setResults(data.data ?? data ?? []);
        } finally {
            setSearching(false);
        }
    }

    async function selectPost(post) {
        setSelected(post);
        setResults([]);
        setQuery(post.title);
        setPreviewing(true);
        try {
            const data = await ajax.post("/admin/threads/preview-text", { post_id: post.post_id });
            setText(data.text ?? "");
            setCharCount(data.length ?? 0);
        } catch {
            // 미리보기 실패 시 빈 텍스트로 직접 입력
        } finally {
            setPreviewing(false);
        }
    }

    function handleTextChange(e) {
        setText(e.target.value);
        setCharCount([...e.target.value].length);
    }

    async function publish() {
        if (!selected) return;
        if (!confirm(`"${selected.title}"\n이 게시물을 Threads에 발행하시겠습니까?`)) return;
        setPublishing(true);
        setResult(null);
        try {
            const data = await ajax.post("/admin/threads/publish-post", { post_id: selected.post_id, text });
            setResult(data);
            if (res.data.success) {
                setTimeout(() => { router.reload(); onClose(); }, 2000);
            }
        } catch {
            setResult({ success: false, output: "요청 실패" });
        } finally {
            setPublishing(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.29 8.29 0 004.83 1.53v-3.4a4.85 4.85 0 01-1.06-.19z"/></svg>
                        Threads 게시물 발행
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* 게시물 검색 */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">게시물 검색</label>
                        <div className="flex gap-2">
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && search()}
                                placeholder="제목 검색..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                            />
                            <button onClick={search} disabled={searching}
                                className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50 transition">
                                {searching ? "..." : "검색"}
                            </button>
                        </div>

                        {results.length > 0 && (
                            <ul className="mt-1 border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                                {results.map(p => (
                                    <li key={p.post_id}>
                                        <button
                                            onClick={() => selectPost(p)}
                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            <span className="font-medium truncate block">{p.title}</span>
                                            <span className="text-xs text-slate-400">{p.source ?? "직접작성"} · 조회 {Number(p.hits ?? 0).toLocaleString()}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* 발행 텍스트 */}
                    {selected && (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-500">발행 텍스트 (최대 500자)</label>
                                <span className={`text-xs font-mono ${charCount > 500 ? "text-red-500" : "text-slate-400"}`}>
                                    {charCount} / 500
                                </span>
                            </div>
                            {previewing ? (
                                <div className="h-32 flex items-center justify-center bg-slate-50 rounded-lg border border-gray-200 text-xs text-slate-400">
                                    자동 생성 중...
                                </div>
                            ) : (
                                <textarea
                                    value={text}
                                    onChange={handleTextChange}
                                    rows={6}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black/20"
                                    placeholder="제목 + 요약 + URL이 자동 입력됩니다. 직접 수정도 가능합니다."
                                />
                            )}
                            <p className="text-[11px] text-slate-400 mt-1">제목·AI요약·URL이 자동 생성됩니다. 직접 수정 가능합니다.</p>
                        </div>
                    )}

                    {/* 발행 결과 */}
                    {result && (
                        <div className={`rounded-lg p-3 text-xs font-mono whitespace-pre-wrap border ${
                            result.success ? "bg-slate-900 text-green-300 border-slate-700" : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                            {result.output}
                            {result.success && result.permalink && (
                                <a href={result.permalink} target="_blank" rel="noreferrer"
                                    className="block mt-1 text-blue-400 underline">
                                    Threads에서 보기 →
                                </a>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        닫기
                    </button>
                    <button
                        onClick={publish}
                        disabled={!selected || publishing || charCount > 500 || previewing}
                        className="px-5 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition"
                    >
                        {publishing ? "발행 중..." : "Threads에 발행"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ThreadsLogs({ logs, stats, filter, settings }) {
    const { auth } = usePage().props;
    const [showPublishModal, setShowPublishModal] = useState(false);

    const filters = [
        { label: "전체",  value: "" },
        { label: "성공",  value: "SUCCESS" },
        { label: "실패",  value: "FAILED" },
    ];

    function applyFilter(value) {
        router.get("/admin/threads/logs", value ? { status: value } : {}, { preserveState: true });
    }

    return (
        <AdminLayout user={auth?.admin}>
            <div className="p-6 max-w-6xl mx-auto">
                {/* 헤더 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.29 8.29 0 004.83 1.53v-3.4a4.85 4.85 0 01-1.06-.19z"/></svg>
                            Threads 발행 로그
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">Threads에 발행된 게시물 이력</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <ScheduleBadge settings={settings} />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPublishModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                게시물 발행
                            </button>
                            <PublishNowButton />
                        </div>
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
                                    ? "bg-black text-white"
                                    : "bg-white border border-gray-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"
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
                                {logs.data.map((log) => (
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
                                        <td className="px-4 py-3 text-right text-slate-500">{Number(log.hits ?? 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString("ko-KR", {
                                                month: "2-digit", day: "2-digit",
                                                hour: "2-digit", minute: "2-digit",
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.threads_permalink ? (
                                                <a href={log.threads_permalink} target="_blank" rel="noopener noreferrer"
                                                    className="text-slate-700 hover:text-black text-xs flex items-center gap-1">
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
                                                    if (!confirm(`"${log.post_title}" 발행 로그를 삭제하시겠습니까?\n삭제 후 해당 게시물은 다시 발행 가능합니다.`)) return;
                                                    router.delete(`/admin/threads/logs/${log.id}`);
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
                        {logs.links.map((link, i) => (
                            <button key={i}
                                disabled={!link.url || link.active}
                                onClick={() => link.url && router.get(link.url)}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                                    link.active
                                        ? "bg-black text-white"
                                        : link.url
                                            ? "bg-white border border-gray-200 text-slate-500 hover:border-slate-400"
                                            : "bg-white border border-gray-100 text-slate-300 cursor-default"
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showPublishModal && <PublishPostModal onClose={() => setShowPublishModal(false)} />}
        </AdminLayout>
    );
}
