import React from "react";
import { Link, useForm, usePage } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import { timeAgo, fmtHits } from "@/Service/Components/Board/BoardCard";

const SOURCE_LABELS = {
    DOGDRIP:  "개드립",
    DCINSIDE: "DC인사이드",
    ETOLAND:  "이토랜드",
    THEQOO:   "더쿠",
};

function CommentForm({ postId }) {
    const { data, setData, post, processing, reset, errors } = useForm({ content: "" });

    function submit(e) {
        e.preventDefault();
        post(`/post/${postId}/comments`, {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <form onSubmit={submit} className="mt-4">
            <textarea
                value={data.content}
                onChange={e => setData("content", e.target.value)}
                rows={3}
                placeholder="댓글을 입력하세요"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.content && (
                <p className="text-xs text-red-500 mt-1">{errors.content}</p>
            )}
            <div className="flex justify-end mt-2">
                <button
                    type="submit"
                    disabled={processing || !data.content.trim()}
                    className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition"
                >
                    {processing ? "등록 중..." : "댓글 등록"}
                </button>
            </div>
        </form>
    );
}

function CommentItem({ comment, authUserId }) {
    const { delete: destroy, processing } = useForm();
    const isOwner = authUserId && authUserId === comment.user_id;

    function handleDelete() {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        destroy(`/comment/${comment.comment_id}`, { preserveScroll: true });
    }

    return (
        <li className="flex gap-3 py-3">
            {/* 아바타 */}
            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                {comment.author?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-700">{comment.author}</span>
                    <span className="text-xs text-slate-400">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                    {comment.content}
                </p>
            </div>
            {isOwner && (
                <button
                    onClick={handleDelete}
                    disabled={processing}
                    className="shrink-0 text-xs text-slate-400 hover:text-red-500 transition self-start mt-1"
                >
                    삭제
                </button>
            )}
        </li>
    );
}

export default function PostDetail({ post, comments = [] }) {
    const { auth } = usePage().props;
    const authUser  = auth?.user;

    return (
        <ServiceLayout theme="light">
            {/* 브레드크럼 */}
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                <Link href="/" className="hover:text-blue-500 transition">홈</Link>
                <span className="text-slate-300">›</span>
                <Link href={`/board/${post.category}`} className="hover:text-blue-500 transition">
                    {post.board_name}
                </Link>
                <span className="text-slate-300">›</span>
                <span className="text-slate-600 truncate max-w-xs">{post.title}</span>
            </div>

            <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* 게시글 헤더 */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        {post.is_notice && (
                            <span className="text-[10px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 leading-tight">
                                공지
                            </span>
                        )}
                        {post.source && (
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 leading-tight">
                                {SOURCE_LABELS[post.source] ?? post.source}
                            </span>
                        )}
                    </div>
                    <h1 className="text-lg font-bold text-slate-800 leading-snug mb-3">
                        {post.title}
                    </h1>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="font-medium text-slate-600">{post.author}</span>
                        <span className="text-slate-300">·</span>
                        <span>{timeAgo(post.created_at)}</span>
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {fmtHits(post.hits)}
                        </span>
                        {comments.length > 0 && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span>댓글 {comments.length}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* 본문 */}
                <div
                    className="px-5 py-6 prose prose-sm max-w-none text-slate-700 leading-relaxed post-content"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* 하단 */}
                <div className="px-5 py-3 border-t border-gray-100">
                    <Link
                        href={`/board/${post.category}`}
                        className="text-sm text-slate-500 hover:text-blue-500 transition"
                    >
                        ← 목록
                    </Link>
                </div>
            </article>

            {/* 댓글 영역 */}
            <section className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-700 mb-3">
                    댓글 <span className="text-blue-500">{comments.length}</span>
                </h2>

                {/* 댓글 목록 */}
                {comments.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                        {comments.map(c => (
                            <CommentItem
                                key={c.comment_id}
                                comment={c}
                                authUserId={authUser?.id}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-400 py-4 text-center">
                        첫 댓글을 남겨보세요.
                    </p>
                )}

                {/* 댓글 입력 */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                    {authUser ? (
                        <div className="flex gap-3">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-500 uppercase">
                                {authUser.name?.charAt(0) ?? "?"}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 mb-1">
                                    <span className="font-semibold text-slate-700">{authUser.name}</span>으로 댓글 작성
                                </p>
                                <CommentForm postId={post.post_id} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-3">
                            <p className="text-sm text-slate-500 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
                            <Link href="/login" className="text-sm text-blue-500 hover:underline font-medium">
                                로그인하기
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </ServiceLayout>
    );
}
