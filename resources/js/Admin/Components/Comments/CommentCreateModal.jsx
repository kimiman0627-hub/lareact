import React, { useState } from "react";
import { route } from "ziggy-js";
import { ajax } from "@/Utils/network";
import UserSearchInput from "@/Admin/Components/Common/UserSearchInput";
import PostSearchSelect from "@/Admin/Components/Common/PostSearchSelect";

export default function CommentCreateModal({ onClose }) {
    const [selectedPost, setSelectedPost] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState({});

    function submit(e) {
        e.preventDefault();
        if (!selectedPost) { setError({ post_id: ["게시글을 선택해주세요."] }); return; }
        if (!selectedUser) { setError({ user_id: ["회원을 선택해주세요."] }); return; }
        setLoading(true);
        setError({});
        ajax.post(route("admin.comments.store"), {
            post_id: selectedPost.post_id,
            user_id: selectedUser.id,
            content,
        })
            .then(() => onClose(true))
            .catch((err) => setError(err?.response?.data?.errors ?? {}))
            .finally(() => setLoading(false));
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-slate-800">댓글 작성</h3>
                    <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
                </div>
                <form onSubmit={submit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">게시글 <span className="text-red-500">*</span></label>
                        <PostSearchSelect selectedPost={selectedPost} onSelect={setSelectedPost} />
                        {error.post_id && <p className="text-xs text-red-500 mt-1">{error.post_id[0]}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">작성 회원 <span className="text-red-500">*</span></label>
                        <UserSearchInput
                            onSelect={setSelectedUser}
                            error={error.user_id?.[0]}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">댓글 내용 <span className="text-red-500">*</span></label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={4}
                            placeholder="댓글 내용을 입력하세요"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        />
                        {error.content && <p className="text-xs text-red-500 mt-1">{error.content[0]}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={() => onClose(false)}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-slate-600 hover:bg-gray-50 transition">
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedPost || !selectedUser || !content.trim()}
                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition"
                        >
                            {loading ? "등록 중..." : "등록"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
