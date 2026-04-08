import React from "react";
import Modal from "react-modal";

export default function PostPreviewModal({ isOpen, onClose, post, postStatuses, postCategories }) {
    if (!post) return null;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={true}
            contentLabel="Post Preview"
            overlayClassName="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl mx-auto outline-none max-h-[90vh] flex flex-col"
        >
            {/* 헤더 */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                <div className="space-y-1 flex-1 mr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400">
                            #{post.post_id}
                        </span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {postCategories?.[post.post_category] ?? post.post_category}
                        </span>
                        {post.is_notice && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                공지
                            </span>
                        )}
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                                post.post_status === "ACTIVE"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-500"
                            }`}
                        >
                            {postStatuses?.[post.post_status] ?? post.post_status}
                        </span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 leading-tight">
                        {post.title}
                    </h2>
                    <div className="text-xs text-slate-400">
                        {post.name && (
                            <span className="mr-2">
                                {post.name}
                                {post.email && ` (${post.email})`}
                            </span>
                        )}
                        {post.created_at && (
                            <span>
                                {new Date(post.created_at).toLocaleString("ko-KR")}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 text-slate-400 hover:text-slate-700 transition text-xl leading-none"
                >
                    ✕
                </button>
            </div>

            {/* 본문 */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
                <div
                    className="prose prose-slate max-w-none
                        [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2
                        [&_p]:my-2 [&_br]:block
                        [&_a]:text-blue-600 [&_a]:underline
                        [&_table]:w-full [&_table]:border-collapse
                        [&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </div>

            {/* 푸터 */}
            <div className="px-6 py-3 border-t border-slate-100 flex justify-end shrink-0">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                    닫기
                </button>
            </div>
        </Modal>
    );
}
