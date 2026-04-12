import React, { useState } from "react";
import { router } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import Pagination from "@/Admin/Components/Common/Pagination";
import axios from "axios";

const TYPE_LABEL = {
    SUPPORT:     { label: "1:1 문의",  cls: "bg-blue-100 text-blue-700 border-blue-200" },
    PARTNERSHIP: { label: "제휴 문의", cls: "bg-purple-100 text-purple-700 border-purple-200" },
};

const STATUS_LABEL = {
    PENDING:  { label: "대기중", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    ANSWERED: { label: "답변완료", cls: "bg-green-100 text-green-700 border-green-200" },
    CLOSED:   { label: "종료", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

function TypeBadge({ type }) {
    const t = TYPE_LABEL[type] ?? { label: type, cls: "bg-gray-100 text-gray-600 border-gray-200" };
    return <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-semibold ${t.cls}`}>{t.label}</span>;
}

function StatusBadge({ status }) {
    const s = STATUS_LABEL[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
    return <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

function formatDate(str) {
    if (!str) return "-";
    return str.replace("T", " ").slice(0, 16);
}

function DetailModal({ id, onClose }) {
    const [inquiry, setInquiry] = useState(null);
    const [answer, setAnswer]   = useState("");
    const [status, setStatus]   = useState("ANSWERED");
    const [saving, setSaving]   = useState(false);
    const [done, setDone]       = useState(false);

    React.useEffect(() => {
        axios.get(`/admin/inquiries/${id}`).then((res) => {
            setInquiry(res.data);
            setAnswer(res.data.answer ?? "");
            setStatus(res.data.status === "PENDING" ? "ANSWERED" : res.data.status);
        });
    }, [id]);

    function handleSave() {
        if (!answer.trim()) return;
        setSaving(true);
        axios.post(`/admin/inquiries/${id}/answer`, { answer, status })
            .then(() => { setDone(true); router.reload({ only: ["list"] }); })
            .finally(() => setSaving(false));
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <h3 className="font-bold text-slate-800">문의 상세</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                    {!inquiry ? (
                        <p className="text-sm text-slate-400 text-center py-8">불러오는 중...</p>
                    ) : (
                        <>
                            {/* 문의 정보 */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-xs text-slate-400 block mb-0.5">유형</span>
                                    <TypeBadge type={inquiry.type} />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 block mb-0.5">상태</span>
                                    <StatusBadge status={inquiry.status} />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 block mb-0.5">이름</span>
                                    <span className="font-medium text-slate-700">{inquiry.name}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 block mb-0.5">이메일</span>
                                    <span className="text-slate-700">{inquiry.email}</span>
                                </div>
                                {inquiry.phone && (
                                    <div>
                                        <span className="text-xs text-slate-400 block mb-0.5">연락처</span>
                                        <span className="text-slate-700">{inquiry.phone}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-xs text-slate-400 block mb-0.5">접수일시</span>
                                    <span className="text-slate-700">{formatDate(inquiry.created_at)}</span>
                                </div>
                            </div>

                            {/* 제목 */}
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">제목</span>
                                <p className="text-sm font-semibold text-slate-800">{inquiry.title}</p>
                            </div>

                            {/* 내용 */}
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">문의 내용</span>
                                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {inquiry.content}
                                </div>
                            </div>

                            {/* 답변 */}
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">답변</span>
                                <textarea
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    rows={5}
                                    placeholder="답변 내용을 입력하세요..."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition resize-none"
                                />
                            </div>

                            {/* 상태 + 저장 */}
                            <div className="flex items-center gap-3">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 transition"
                                >
                                    <option value="ANSWERED">답변완료</option>
                                    <option value="CLOSED">종료</option>
                                </select>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !answer.trim()}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                                >
                                    {saving ? "저장 중..." : "답변 저장"}
                                </button>
                                {done && <span className="text-sm text-green-600 font-medium">저장되었습니다.</span>}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function InquiryList({ list, filters }) {
    const items = list.data ?? [];
    const meta  = list.meta ?? list;

    const [type,   setType]   = useState(filters.type   ?? "");
    const [status, setStatus] = useState(filters.status ?? "");
    const [modalId, setModalId] = useState(null);

    function applyFilter() {
        router.get("/admin/inquiries", { type, status, page: 1 }, { preserveScroll: true });
    }

    function resetFilter() {
        setType(""); setStatus("");
        router.get("/admin/inquiries", {}, { preserveScroll: true });
    }

    return (
        <AdminLayout title="문의 관리">
            {/* 필터 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">유형</label>
                    <select value={type} onChange={(e) => setType(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 transition">
                        <option value="">전체</option>
                        <option value="SUPPORT">1:1 문의</option>
                        <option value="PARTNERSHIP">제휴 문의</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">상태</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 transition">
                        <option value="">전체</option>
                        <option value="PENDING">대기중</option>
                        <option value="ANSWERED">답변완료</option>
                        <option value="CLOSED">종료</option>
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
                    <span className="text-sm font-semibold text-slate-700">문의 목록</span>
                    <span className="text-xs text-slate-400">총 {meta.total ?? 0}건</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-slate-50 text-xs text-slate-500 font-semibold">
                                <th className="px-4 py-2.5 text-left w-10">#</th>
                                <th className="px-4 py-2.5 text-left w-24">유형</th>
                                <th className="px-4 py-2.5 text-left">제목</th>
                                <th className="px-4 py-2.5 text-left w-24">이름</th>
                                <th className="px-4 py-2.5 text-left w-20">상태</th>
                                <th className="px-4 py-2.5 text-left w-36">접수일시</th>
                                <th className="px-4 py-2.5 text-left w-16">상세</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {items.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">문의 내역이 없습니다.</td></tr>
                            )}
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-2.5 text-slate-400 text-xs">{item.id}</td>
                                    <td className="px-4 py-2.5"><TypeBadge type={item.type} /></td>
                                    <td className="px-4 py-2.5 text-slate-700 truncate max-w-xs">{item.title}</td>
                                    <td className="px-4 py-2.5 text-slate-600">{item.name}</td>
                                    <td className="px-4 py-2.5"><StatusBadge status={item.status} /></td>
                                    <td className="px-4 py-2.5 text-slate-400 text-xs">{formatDate(item.created_at)}</td>
                                    <td className="px-4 py-2.5">
                                        <button
                                            onClick={() => setModalId(item.id)}
                                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-600 text-xs font-medium rounded transition"
                                        >
                                            보기
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination links={list.links ?? []} />
            </div>

            {modalId && <DetailModal id={modalId} onClose={() => setModalId(null)} />}
        </AdminLayout>
    );
}
