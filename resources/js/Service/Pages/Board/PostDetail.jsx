import React, { useState } from "react";
import { Link, useForm, usePage } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import { timeAgo, fmtHits } from "@/Service/Components/Board/BoardCard";


/** 댓글 입력 폼 */
function CommentForm({ postId, parentId = null, onCancel = null, autoFocus = false }) {
    // parent_id를 useForm 초기 상태에 포함해야 Inertia가 전송함
    const { data, setData, post, processing, reset, errors } = useForm({
        content: "",
        parent_id: parentId,
    });

    function submit(e) {
        e.preventDefault();
        post(`/post/${postId}/comments`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onCancel?.(); },
        });
    }

    return (
        <form onSubmit={submit} className="mt-2">
            <textarea
                value={data.content}
                onChange={e => setData("content", e.target.value)}
                rows={2}
                autoFocus={autoFocus}
                placeholder={parentId ? "대댓글을 입력하세요" : "댓글을 입력하세요"}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
            {errors.parent_id && <p className="text-xs text-red-500 mt-1">{errors.parent_id}</p>}
            <div className="flex justify-end gap-2 mt-1.5">
                {onCancel && (
                    <button type="button" onClick={onCancel}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 transition">
                        취소
                    </button>
                )}
                <button type="submit" disabled={processing || !data.content.trim()}
                    className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition">
                    {processing ? "등록 중..." : "등록"}
                </button>
            </div>
        </form>
    );
}

/** 댓글 단일 항목 */
function CommentItem({ comment, postId, authUser, maxDepth, replies = [], allComments, depth = 1 }) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const { delete: destroy, processing } = useForm();

    const isOwner  = authUser && authUser.id === comment.user_id;
    const canReply = authUser && comment.depth < maxDepth;
    const isNested = depth > 1;

    function handleDelete() {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        destroy(`/comment/${comment.comment_id}`, { preserveScroll: true });
    }

    return (
        <li>
            <div className={`flex gap-3 py-3 ${isNested ? "pl-4" : ""}`}>
                {/* 들여쓰기 표시선 */}
                {isNested && (
                    <div className="shrink-0 flex flex-col items-center">
                        <div className="w-0.5 h-3 bg-blue-200 rounded-full mb-1" />
                        <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-500 uppercase">
                            {comment.author?.charAt(0) ?? "?"}
                        </div>
                    </div>
                )}
                {!isNested && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                        {comment.author?.charAt(0) ?? "?"}
                    </div>
                )}

                <div className={`flex-1 min-w-0 ${isNested ? "bg-slate-50 rounded-xl px-3 py-2 border border-slate-100" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                        {isNested && <span className="text-blue-400 text-xs">↳</span>}
                        <span className="text-sm font-semibold text-slate-700">{comment.author}</span>
                        <span className="text-xs text-slate-400">{timeAgo(comment.created_at)}</span>
                        {isNested && (
                            <span className="text-[10px] text-blue-400 bg-blue-50 border border-blue-100 rounded px-1 leading-tight">답글</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap wrap-break-word leading-relaxed">
                        {comment.content}
                    </p>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-3 mt-1.5">
                        {canReply && (
                            <button onClick={() => setShowReplyForm(v => !v)}
                                className="text-xs text-slate-400 hover:text-blue-500 transition">
                                💬 답글
                            </button>
                        )}
                        {isOwner && (
                            <button onClick={handleDelete} disabled={processing}
                                className="text-xs text-slate-400 hover:text-red-500 transition">
                                삭제
                            </button>
                        )}
                    </div>

                    {/* 답글 입력폼 */}
                    {showReplyForm && authUser && (
                        <div className="mt-2">
                            <CommentForm
                                postId={postId}
                                parentId={comment.comment_id}
                                onCancel={() => setShowReplyForm(false)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 대댓글 목록 */}
            {replies.length > 0 && (
                <ul className="border-l-2 border-blue-200 ml-10 pl-3 mb-1">
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.comment_id}
                            comment={reply}
                            postId={postId}
                            authUser={authUser}
                            maxDepth={maxDepth}
                            replies={allComments.filter(c => c.parent_id === reply.comment_id)}
                            allComments={allComments}
                            depth={depth + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function PostDetail({ post, comments = [], maxDepth = 2 }) {
    const { auth } = usePage().props;
    const authUser  = auth?.user ?? null;

    // 최상위 댓글만 뽑아서 렌더링 (대댓글은 재귀로 처리)
    const topLevel = comments.filter(c => !c.parent_id);

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
                            <span className="text-[10px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 leading-tight">공지</span>
                        )}
                        {post.board_name && (
                            <Link href={`/board/${post.category}`}
                                className="text-[10px] font-medium text-blue-500 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 leading-tight hover:bg-blue-100 transition">
                                {post.board_name}
                            </Link>
                        )}
                    </div>
                    <h1 className="text-lg font-bold text-slate-800 leading-snug mb-3">{post.title}</h1>
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
                    <Link href={`/board/${post.category}`} className="text-sm text-slate-500 hover:text-blue-500 transition">
                        ← 목록
                    </Link>
                </div>
            </article>

            {/* 댓글 영역 */}
            <section className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-700 mb-1">
                    댓글 <span className="text-blue-500">{comments.length}</span>
                </h2>

                {/* 댓글 목록 */}
                {topLevel.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                        {topLevel.map(c => (
                            <CommentItem
                                key={c.comment_id}
                                comment={c}
                                postId={post.post_id}
                                authUser={authUser}
                                maxDepth={maxDepth}
                                replies={comments.filter(r => r.parent_id === c.comment_id)}
                                allComments={comments}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-400 py-6 text-center">첫 댓글을 남겨보세요.</p>
                )}

                {/* 최상위 댓글 입력 */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                    {authUser ? (
                        <div className="flex gap-3">
                            <div className="shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-500 uppercase">
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
                            <Link href="/login" className="text-sm text-blue-500 hover:underline font-medium">로그인하기</Link>
                        </div>
                    )}
                </div>
            </section>
        </ServiceLayout>
    );
}
