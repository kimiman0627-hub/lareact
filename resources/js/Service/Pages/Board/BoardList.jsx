import React from "react";
import { Link } from "@inertiajs/react";
import { router } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import { timeAgo, fmtHits } from "@/Service/Components/Board/BoardCard";

const SOURCE_LABELS = {
    DOGDRIP:  "개드립",
    DCINSIDE: "DC",
    ETOLAND:  "이토랜드",
    THEQOO:   "더쿠",
};

export default function BoardList({ board, list }) {
    const posts     = list.data ?? [];
    const meta      = list.meta ?? list;
    const lastPage  = meta.last_page ?? 1;
    const curPage   = meta.current_page ?? 1;

    function goPage(page) {
        router.get(`/board/${board.category}`, { page }, { preserveScroll: true });
    }

    return (
        <ServiceLayout theme="light">
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-4">
                <Link href="/" className="text-sm text-slate-400 hover:text-blue-500 transition">홈</Link>
                <span className="text-slate-300 text-sm">›</span>
                <span className="text-sm font-semibold text-slate-700">{board.board_name}</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* 게시판 타이틀 */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h1 className="text-base font-bold text-slate-800">{board.board_name}</h1>
                    <span className="text-xs text-slate-400">전체 {meta.total ?? 0}건</span>
                </div>

                {/* 게시글 목록 */}
                <ul className="divide-y divide-gray-100">
                    {posts.length === 0 && (
                        <li className="px-4 py-10 text-center text-sm text-slate-400">
                            게시글이 없습니다.
                        </li>
                    )}
                    {posts.map((post) => (
                        <li key={post.post_id}>
                            <Link
                                href={`/post/${post.post_id}`}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition group"
                            >
                                {/* 공지 배지 */}
                                {post.is_notice ? (
                                    <span className="shrink-0 text-[10px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 leading-tight">
                                        공지
                                    </span>
                                ) : (
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-200" />
                                )}

                                {/* 출처 배지 */}
                                {post.source && (
                                    <span className="shrink-0 text-[10px] font-medium text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 leading-tight">
                                        {SOURCE_LABELS[post.source] ?? post.source}
                                    </span>
                                )}

                                {/* 제목 */}
                                <span className="flex-1 text-sm text-slate-700 group-hover:text-blue-600 transition leading-snug truncate min-w-0">
                                    {post.title}
                                    {post.comment_count > 0 && (
                                        <span className="ml-1 text-blue-400 font-semibold text-xs">
                                            [{post.comment_count}]
                                        </span>
                                    )}
                                </span>

                                {/* 메타 */}
                                <span className="shrink-0 flex items-center gap-2 text-[11px] text-slate-400 whitespace-nowrap">
                                    <span className="hidden sm:block max-w-[60px] truncate">{post.author}</span>
                                    <span className="hidden sm:block text-slate-300">·</span>
                                    <span className="hidden sm:flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {fmtHits(post.hits)}
                                    </span>
                                    <span className="text-slate-300 hidden sm:block">·</span>
                                    <span>{timeAgo(post.created_at)}</span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* 페이지네이션 */}
                {lastPage > 1 && (
                    <div className="flex justify-center items-center gap-1 px-4 py-3 border-t border-gray-100">
                        <button
                            onClick={() => goPage(curPage - 1)}
                            disabled={curPage === 1}
                            className="px-2.5 py-1 text-xs rounded border border-gray-200 text-slate-500 disabled:opacity-30 hover:border-blue-400 hover:text-blue-500 transition"
                        >
                            ‹
                        </button>
                        {Array.from({ length: lastPage }, (_, i) => i + 1)
                            .filter(p => Math.abs(p - curPage) <= 4)
                            .map(p => (
                                <button
                                    key={p}
                                    onClick={() => goPage(p)}
                                    className={`px-2.5 py-1 text-xs rounded border transition ${
                                        p === curPage
                                            ? "border-blue-500 bg-blue-500 text-white"
                                            : "border-gray-200 text-slate-600 hover:border-blue-400 hover:text-blue-500"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        <button
                            onClick={() => goPage(curPage + 1)}
                            disabled={curPage === lastPage}
                            className="px-2.5 py-1 text-xs rounded border border-gray-200 text-slate-500 disabled:opacity-30 hover:border-blue-400 hover:text-blue-500 transition"
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>
        </ServiceLayout>
    );
}
