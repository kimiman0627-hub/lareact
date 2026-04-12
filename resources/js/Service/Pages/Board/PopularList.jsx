import React from "react";
import { Link, router } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import { timeAgo, fmtHits } from "@/Service/Components/Board/BoardCard";
import Pagination from "@/Service/Components/Common/Pagination";

export default function PopularList({ list }) {
    const posts    = list?.data ?? [];
    const meta     = list?.meta ?? list ?? {};
    const lastPage = meta.last_page ?? 1;
    const curPage  = meta.current_page ?? 1;
    const total    = meta.total ?? 0;

    function goPage(page) {
        router.get("/popular", { page }, { preserveScroll: true });
    }

    return (
        <ServiceLayout>
            {/* 브레드크럼 */}
            <div className="flex items-center gap-2 mb-4">
                <Link href="/" className="text-sm text-slate-400 hover:text-blue-500 transition">홈</Link>
                <span className="text-slate-300 text-sm">›</span>
                <span className="text-sm font-semibold text-slate-700">인기글</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* 타이틀 */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-orange-500">🔥</span> 인기글
                        <span className="text-xs font-normal text-slate-400">최근 7일 기준</span>
                    </h1>
                    <span className="text-xs text-slate-400">전체 {total}건</span>
                </div>

                {/* 목록 없음 */}
                {posts.length === 0 && (
                    <div className="px-4 py-16 text-center text-sm text-slate-400">
                        인기글이 없습니다.
                    </div>
                )}

                {/* 목록 */}
                <ul className="divide-y divide-gray-100">
                    {posts.map((post, i) => {
                        const rank = (curPage - 1) * (meta.per_page ?? 30) + i + 1;
                        return (
                        <li key={post.post_id}>
                            <Link
                                href={`/post/${post.post_id}`}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition group"
                            >
                                {/* 순위 */}
                                <span className={`shrink-0 w-6 text-center text-xs font-bold ${
                                    rank === 1 ? "text-orange-500" :
                                    rank === 2 ? "text-slate-500" :
                                    rank === 3 ? "text-amber-600" :
                                    "text-slate-300"
                                }`}>
                                    {rank}
                                </span>

                                {/* 게시판 배지 */}
                                <span className="shrink-0 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap">
                                    {post.board_name}
                                </span>

                                {/* 제목 */}
                                <span className="flex-1 text-sm text-slate-700 group-hover:text-orange-600 transition leading-snug truncate min-w-0">
                                    {post.title}
                                    {post.has_image && (
                                        <i className="fa-regular fa-image ml-1 text-slate-400 text-[11px]" />
                                    )}
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
                                    <span className="hidden sm:flex items-center gap-1 text-orange-400 font-medium">
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
                        );
                    })}
                </ul>

                <Pagination curPage={curPage} lastPage={lastPage} onPageChange={goPage} />
            </div>
        </ServiceLayout>
    );
}
