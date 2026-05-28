import React, { useState, useEffect, useCallback } from "react";
import { http } from "@/Utils/http";
import { useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import Pagination from "@/Admin/Components/Common/Pagination";
import { ajax } from "@/Utils/network";

// ─── 공통 유틸 ──────────────────────────────────────────────────────
function formatDate(str) {
    if (!str) return "-";
    return str.replace("T", " ").slice(0, 16);
}

const ROLE_LABELS = { USER: "일반", ADMIN: "관리자", TEST: "테스트" };
const ROLE_COLORS = {
    USER:  "bg-blue-50 text-blue-700 border-blue-200",
    ADMIN: "bg-red-50 text-red-700 border-red-200",
    TEST:  "bg-gray-50 text-gray-500 border-gray-200",
};
const INQUIRY_STATUS = { PENDING: "대기", ANSWERED: "답변완료" };
const POST_STATUS    = { ACTIVE: "정상", INACTIVE: "비활성", DELETED: "삭제" };

function RoleBadge({ role }) {
    return (
        <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-semibold ${ROLE_COLORS[role] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
            {ROLE_LABELS[role] ?? role}
        </span>
    );
}

function StatusBadge({ status, map, okKey = "ACTIVE" }) {
    const label = map[status] ?? status;
    const ok    = status === okKey;
    return (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-semibold border ${ok ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
            {label}
        </span>
    );
}

function Spinner() {
    return (
        <div className="flex justify-center py-10">
            <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
        </div>
    );
}

// 탭 안에서 쓸 간단한 이전/다음 페이지네이션
function SimplePager({ page, lastPage, onChange }) {
    if (lastPage <= 1) return null;
    return (
        <div className="flex justify-center items-center gap-3 mt-4 text-sm">
            <button
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
                className="px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                이전
            </button>
            <span className="text-gray-500 text-xs">{page} / {lastPage}</span>
            <button
                disabled={page >= lastPage}
                onClick={() => onChange(page + 1)}
                className="px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
                다음
            </button>
        </div>
    );
}

// ─── 활동 탭: 게시글 ─────────────────────────────────────────────────
function PostsTab({ userId }) {
    const [state, setState] = useState({ items: [], total: 0, page: 1, lastPage: 1, loading: true });

    const load = useCallback((page = 1) => {
        setState(s => ({ ...s, loading: true }));
        ajax.get(`/admin/users/${userId}/activities`, { type: "posts", page })
            .then(data => setState({ ...data, loading: false }))
            .catch(() => setState(s => ({ ...s, loading: false })));
    }, [userId]);

    useEffect(() => { load(1); }, [load]);

    if (state.loading) return <Spinner />;
    if (!state.items.length) return <p className="text-center text-sm text-gray-400 py-10">게시글이 없습니다.</p>;

    return (
        <>
            <p className="text-xs text-gray-400 mb-3">총 {state.total.toLocaleString()}건</p>
            <div className="space-y-1">
                {state.items.map(p => (
                    <div key={p.post_id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition group">
                        <div className="flex-1 min-w-0">
                            <a
                                href={`/post/${p.post_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition truncate block"
                            >
                                {p.title}
                            </a>
                            <div className="flex items-center gap-2 mt-0.5">
                                {p.board_name && (
                                    <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">{p.board_name}</span>
                                )}
                                <StatusBadge status={p.post_status} map={POST_STATUS} okKey="ACTIVE" />
                                <span className="text-[11px] text-gray-400">조회 {(p.hits ?? 0).toLocaleString()}</span>
                                <span className="text-[11px] text-gray-400">댓글 {(p.comment_count ?? 0).toLocaleString()}</span>
                            </div>
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">{formatDate(p.created_at)}</span>
                    </div>
                ))}
            </div>
            <SimplePager page={state.page} lastPage={state.last_page} onChange={load} />
        </>
    );
}

// ─── 활동 탭: 댓글 ──────────────────────────────────────────────────
function CommentsTab({ userId }) {
    const [state, setState] = useState({ items: [], total: 0, page: 1, lastPage: 1, loading: true });

    const load = useCallback((page = 1) => {
        setState(s => ({ ...s, loading: true }));
        ajax.get(`/admin/users/${userId}/activities`, { type: "comments", page })
            .then(data => setState({ ...data, loading: false }))
            .catch(() => setState(s => ({ ...s, loading: false })));
    }, [userId]);

    useEffect(() => { load(1); }, [load]);

    if (state.loading) return <Spinner />;
    if (!state.items.length) return <p className="text-center text-sm text-gray-400 py-10">댓글이 없습니다.</p>;

    return (
        <>
            <p className="text-xs text-gray-400 mb-3">총 {state.total.toLocaleString()}건</p>
            <div className="space-y-1">
                {state.items.map(c => (
                    <div key={c.comment_id} className="px-3 py-2.5 rounded-lg hover:bg-gray-50 transition group">
                        <p className="text-sm text-gray-800 line-clamp-2">{c.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                            {c.post_title && (
                                <a
                                    href={`/post/${c.post_id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-blue-500 hover:underline truncate max-w-xs"
                                >
                                    └ {c.post_title}
                                </a>
                            )}
                            <span className="text-[11px] text-gray-400 ml-auto shrink-0">{formatDate(c.created_at)}</span>
                        </div>
                    </div>
                ))}
            </div>
            <SimplePager page={state.page} lastPage={state.last_page} onChange={load} />
        </>
    );
}

// ─── 활동 탭: 문의사항 ──────────────────────────────────────────────
function InquiriesTab({ userId }) {
    const [state, setState] = useState({ items: [], total: 0, page: 1, lastPage: 1, loading: true });

    const load = useCallback((page = 1) => {
        setState(s => ({ ...s, loading: true }));
        ajax.get(`/admin/users/${userId}/activities`, { type: "inquiries", page })
            .then(data => setState({ ...data, loading: false }))
            .catch(() => setState(s => ({ ...s, loading: false })));
    }, [userId]);

    useEffect(() => { load(1); }, [load]);

    if (state.loading) return <Spinner />;
    if (!state.items.length) return <p className="text-center text-sm text-gray-400 py-10">문의 내역이 없습니다.</p>;

    return (
        <>
            <p className="text-xs text-gray-400 mb-3">총 {state.total.toLocaleString()}건</p>
            <div className="space-y-1">
                {state.items.map(inq => (
                    <div key={inq.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{inq.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                {inq.type && <span className="text-[11px] text-gray-400">{inq.type}</span>}
                                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${inq.status === "ANSWERED" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                                    {INQUIRY_STATUS[inq.status] ?? inq.status}
                                </span>
                                {inq.answered_at && (
                                    <span className="text-[11px] text-gray-400">답변: {formatDate(inq.answered_at)}</span>
                                )}
                            </div>
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0">{formatDate(inq.created_at)}</span>
                    </div>
                ))}
            </div>
            <SimplePager page={state.page} lastPage={state.last_page} onChange={load} />
        </>
    );
}

// ─── 회원 상세/수정 모달 ────────────────────────────────────────────
const TABS = [
    { key: "info",      label: "기본정보" },
    { key: "posts",     label: "게시글" },
    { key: "comments",  label: "댓글" },
    { key: "inquiries", label: "문의사항" },
];

function DetailModal({ userId, onClose }) {
    const [detail,    setDetail]    = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [activeTab, setActiveTab] = useState("info");

    const { data, setData, put, processing, errors } = useForm({
        name: "", email: "", user_role: "USER", password: "",
    });

    useEffect(() => {
        ajax.get(`/admin/users/${userId}`)
            .then(u => {
                setDetail(u);
                setData({ name: u.name, email: u.email, user_role: u.user_role ?? "USER", password: "" });
            })
            .catch(() => setLoadError(true));
    }, [userId]);

    function save() {
        put(`/admin/users/${userId}`, { onSuccess: () => onClose() });
    }

    function handleDelete() {
        if (!confirm(`ID ${userId} 회원을 정말 삭제하시겠습니까?\n삭제 후 복구가 불가능합니다.`)) return;
        http.delete(`/admin/users/${userId}`, { onSuccess: () => onClose() });
    }

    // 탭별 카운트 배지 (detail 로드 후)
    const tabCounts = detail ? {
        posts:     detail.stats.post_count,
        comments:  detail.stats.comment_count,
        inquiries: detail.stats.inquiry_count,
    } : {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "90vh" }}>

                {/* 헤더 */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-lg font-bold text-gray-800">
                            {detail ? detail.name : "회원 상세"}
                        </h2>
                        {detail && <RoleBadge role={detail.user_role} />}
                        {detail && (
                            <span className="text-xs text-gray-400">#{detail.id}</span>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 탭 네비게이션 */}
                <div className="flex border-b border-gray-100 shrink-0 px-6">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative py-3 px-4 text-sm font-medium transition -mb-px border-b-2 ${
                                activeTab === tab.key
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab.label}
                            {tabCounts[tab.key] > 0 && (
                                <span className="ml-1.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">
                                    {tabCounts[tab.key].toLocaleString()}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* 탭 본문 */}
                <div className="flex-1 overflow-y-auto">
                    {loadError && (
                        <p className="text-sm text-red-500 text-center py-12">회원 정보를 불러올 수 없습니다.</p>
                    )}
                    {!detail && !loadError && <Spinner />}

                    {detail && (
                        <>
                            {/* ── 기본정보 탭 ── */}
                            {activeTab === "info" && (
                                <div className="p-6 space-y-6">
                                    {/* 기본 정보 */}
                                    <section>
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">기본 정보</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: "회원 ID",    value: `#${detail.id}` },
                                                { label: "가입일",      value: formatDate(detail.created_at) },
                                                { label: "최근 수정일", value: formatDate(detail.updated_at) },
                                                {
                                                    label: "이메일 인증",
                                                    value: detail.email_verified_at ? "인증 완료" : "미인증",
                                                    cls: detail.email_verified_at ? "text-green-600 font-semibold" : "text-amber-500 font-semibold",
                                                },
                                            ].map(({ label, value, cls = "" }) => (
                                                <div key={label} className="bg-gray-50 rounded-lg px-4 py-3">
                                                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                                    <p className={`text-sm font-medium text-gray-800 ${cls}`}>{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* 활동 통계 */}
                                    <section>
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">활동 통계</h3>
                                        <div className="grid grid-cols-5 gap-2">
                                            {[
                                                { label: "게시글",  value: detail.stats.post_count,    color: "text-blue-600" },
                                                { label: "댓글",    value: detail.stats.comment_count,  color: "text-indigo-600" },
                                                { label: "스크랩",  value: detail.stats.scrap_count,    color: "text-amber-600" },
                                                { label: "좋아요",  value: detail.stats.like_count,     color: "text-rose-600" },
                                                { label: "문의",    value: detail.stats.inquiry_count,  color: "text-teal-600" },
                                            ].map(({ label, value, color }) => (
                                                <div key={label} className="bg-gray-50 rounded-lg px-2 py-3 text-center">
                                                    <p className={`text-lg font-bold ${color}`}>{value.toLocaleString()}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* 정보 수정 */}
                                    <section>
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">정보 수정</h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                                                    <input
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={data.name}
                                                        onChange={e => setData("name", e.target.value)}
                                                    />
                                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                                                    <select
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={data.user_role}
                                                        onChange={e => setData("user_role", e.target.value)}
                                                    >
                                                        {Object.entries(ROLE_LABELS).map(([v, l]) => (
                                                            <option key={v} value={v}>{l}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                                                <input
                                                    type="email"
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={data.email}
                                                    onChange={e => setData("email", e.target.value)}
                                                />
                                                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    비밀번호
                                                    <span className="ml-1 text-xs text-gray-400 font-normal">(변경할 경우에만 입력)</span>
                                                </label>
                                                <input
                                                    type="password"
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    placeholder="변경하지 않으려면 비워두세요"
                                                    value={data.password}
                                                    onChange={e => setData("password", e.target.value)}
                                                />
                                                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {/* ── 게시글 탭 ── */}
                            {activeTab === "posts" && (
                                <div className="p-6">
                                    <PostsTab userId={userId} />
                                </div>
                            )}

                            {/* ── 댓글 탭 ── */}
                            {activeTab === "comments" && (
                                <div className="p-6">
                                    <CommentsTab userId={userId} />
                                </div>
                            )}

                            {/* ── 문의사항 탭 ── */}
                            {activeTab === "inquiries" && (
                                <div className="p-6">
                                    <InquiriesTab userId={userId} />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 하단 버튼 (기본정보 탭에서만 노출) */}
                {detail && activeTab === "info" && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
                        <button onClick={handleDelete}
                            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition">
                            삭제
                        </button>
                        <div className="flex-1" />
                        <button onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-white transition">
                            취소
                        </button>
                        <button onClick={save} disabled={processing}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                            {processing ? "저장 중..." : "저장하기"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── 신규 등록 모달 ────────────────────────────────────────────────
function CreateModal({ onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "", email: "", password: "", user_role: "USER",
    });

    function save() {
        post("/admin/users", { onSuccess: () => onClose() });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">신규 회원 등록</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {[
                        { label: "이름",      key: "name",     type: "text" },
                        { label: "이메일",    key: "email",    type: "email" },
                        { label: "비밀번호",  key: "password", type: "password" },
                    ].map(({ label, key, type }) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                            <input type={type}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={data[key]}
                                onChange={e => setData(key, e.target.value)}
                            />
                            {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={data.user_role}
                            onChange={e => setData("user_role", e.target.value)}
                        >
                            {Object.entries(ROLE_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-white transition">
                        취소
                    </button>
                    <button onClick={save} disabled={processing}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                        {processing ? "처리중..." : "등록하기"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── 메인 페이지 ────────────────────────────────────────────────────
export default function UserIndex({ users, total, params }) {
    const { auth } = usePage().props;

    const [startDate, setStartDate] = useState(params?.start_date ? new Date(params.start_date) : null);
    const [endDate,   setEndDate]   = useState(params?.end_date   ? new Date(params.end_date)   : null);
    const [searchForm, setSearchForm] = useState({
        id: params?.id || "", name: params?.name || "", email: params?.email || "",
    });

    const [createOpen,   setCreateOpen]   = useState(false);
    const [detailUserId, setDetailUserId] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        http.get("/admin/users", {
            ...searchForm,
            start_date: startDate ? format(startDate, "yyyy-MM-dd") : "",
            end_date:   endDate   ? format(endDate,   "yyyy-MM-dd") : "",
        }, { preserveState: true, replace: true });
    };

    const resetSearch = () => {
        setSearchForm({ id: "", name: "", email: "" });
        setStartDate(null);
        setEndDate(null);
        http.get("/admin/users");
    };

    return (
        <AdminLayout user={auth?.admin}>
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        회원 관리
                        <span className="ml-2 text-sm font-normal text-slate-400">총 {total}명</span>
                    </h1>
                    <button onClick={() => setCreateOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        신규 회원 등록
                    </button>
                </div>

                {/* 검색 */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">ID</label>
                            <input type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.id}
                                onChange={e => setSearchForm({ ...searchForm, id: e.target.value })}
                                placeholder="숫자 ID"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">이름</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.name}
                                onChange={e => setSearchForm({ ...searchForm, name: e.target.value })}
                                placeholder="이름 포함"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">이메일</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.email}
                                onChange={e => setSearchForm({ ...searchForm, email: e.target.value })}
                                placeholder="이메일 주소"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">가입일</label>
                            <div className="flex items-center gap-1">
                                <DatePicker selected={startDate} onChange={setStartDate}
                                    selectsStart startDate={startDate} endDate={endDate}
                                    locale={ko} dateFormat="yyyy-MM-dd" placeholderText="시작일"
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none"
                                />
                                <span className="text-gray-400 text-xs">~</span>
                                <DatePicker selected={endDate} onChange={setEndDate}
                                    selectsEnd startDate={startDate} endDate={endDate} minDate={startDate}
                                    locale={ko} dateFormat="yyyy-MM-dd" placeholderText="종료일"
                                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <button type="submit"
                                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-blue-700 transition">
                                검색
                            </button>
                            <button type="button" onClick={resetSearch}
                                className="flex-1 bg-white border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-bold hover:bg-gray-50 transition">
                                초기화
                            </button>
                        </div>
                    </form>
                </div>

                {/* 테이블 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-16">ID</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-24">역할</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">이름</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">이메일</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-36">가입일</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-24 text-right">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                                            회원이 없습니다.
                                        </td>
                                    </tr>
                                )}
                                {users.data.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-xs text-gray-400">{user.id}</td>
                                        <td className="px-4 py-3">
                                            <RoleBadge role={user.user_role ?? "USER"} />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                                        <td className="px-4 py-3 text-gray-500">{user.email}</td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{formatDate(user.created_at)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => setDetailUserId(user.id)}
                                                className="text-blue-600 hover:underline text-xs font-medium"
                                            >
                                                상세/수정
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={users.links} />
                </div>
            </div>

            {createOpen   && <CreateModal onClose={() => setCreateOpen(false)} />}
            {detailUserId && <DetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />}
        </AdminLayout>
    );
}
