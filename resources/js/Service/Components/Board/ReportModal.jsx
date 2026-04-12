import React, { useState } from "react";
import axios from "axios";

const REASONS = [
    { value: "SPAM",    label: "스팸/도배" },
    { value: "OBSCENE", label: "음란/불건전" },
    { value: "ILLEGAL", label: "불법 정보" },
    { value: "ETC",     label: "기타" },
];

export default function ReportModal({ postId, onClose }) {
    const [reason, setReason] = useState("SPAM");
    const [detail, setDetail] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone]     = useState(false);
    const [error, setError]   = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await axios.post(`/post/${postId}/report`, { reason, detail: detail || null });
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.message ?? "신고 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <h3 className="font-bold text-slate-800 text-sm">게시글 신고</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                {done ? (
                    <div className="px-5 py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">신고가 접수되었습니다</p>
                        <p className="text-xs text-slate-400 mb-4">검토 후 조치하겠습니다.</p>
                        <button onClick={onClose}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
                            확인
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                        {/* 신고 사유 */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">신고 사유</label>
                            <div className="space-y-2">
                                {REASONS.map((r) => (
                                    <label key={r.value} className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={r.value}
                                            checked={reason === r.value}
                                            onChange={() => setReason(r.value)}
                                            className="accent-blue-600"
                                        />
                                        <span className="text-sm text-slate-700">{r.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 기타 상세 (ETC 선택 시) */}
                        {reason === "ETC" && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">상세 내용</label>
                                <textarea
                                    value={detail}
                                    onChange={(e) => setDetail(e.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    placeholder="신고 내용을 입력해주세요."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition resize-none"
                                />
                            </div>
                        )}

                        {error && <p className="text-xs text-red-500">{error}</p>}

                        <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={onClose}
                                className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-slate-600 text-sm rounded-lg transition">
                                취소
                            </button>
                            <button type="submit" disabled={loading}
                                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition">
                                {loading ? "신고 중..." : "신고하기"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
