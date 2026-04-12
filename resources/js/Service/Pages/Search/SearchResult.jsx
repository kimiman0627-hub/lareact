import React, { useState } from "react";
import { Link, router } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import { timeAgo, fmtHits } from "@/Service/Components/Board/BoardCard";
import Pagination from "@/Service/Components/Common/Pagination";


export default function SearchResult({ query, list }) {
    const [inputVal, setInputVal] = useState(query ?? "");

    const posts    = list?.data ?? [];
    const meta     = list?.meta ?? list ?? {};
    const lastPage = meta.last_page ?? 1;
    const curPage  = meta.current_page ?? 1;
    const total    = meta.total ?? 0;

    function goPage(page) {
        router.get("/search", { q: query, page }, { preserveScroll: true });
    }

    function handleSearch(e) {
        e.preventDefault();
        if (!inputVal.trim()) return;
        router.get("/search", { q: inputVal.trim() });
    }

    return (
        <ServiceLayout>
            {/* 브레드크럼 */}
            <div className="flex items-center gap-2 mb-4">
                <Link href="/" className="text-sm text-slate-400 hover:text-blue-500 transition">홈</Link>
                <span className="text-slate-300 text-sm">›</span>
                <span className="text-sm font-semibold text-slate-700">통합검색</span>
            </div>

            {/* 검색 폼 */}
            <form onSubmit={handleSearch} className="mb-5">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="검색어를 입력하세요"
                        className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                    />
                    <button
                        type="submit"
                        className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
                    >
                        검색
                    </button>
                </div>
            </form>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* 타이틀 */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h1 className="text-base font-bold text-slate-800">
                        {query ? (
                            <>
                                <span className="text-blue-600">"{query}"</span> 검색 결과
                            </>
                        ) : "통합검색"}
                    </h1>
                    {list && (
                        <span className="text-xs text-slate-400">전체 {total}건</span>
                    )}
                </div>

                {/* 검색어 없음 */}
                {!query && (
                    <div className="px-4 py-16 text-center text-sm text-slate-400">
                        검색어를 입력해주세요.
                    </div>
                )}

                {/* 결과 없음 */}
                {query && posts.length === 0 && (
                    <div className="px-4 py-16 text-center text-sm text-slate-400">
                        <p className="font-medium text-slate-500 mb-1">검색 결과가 없습니다.</p>
                        <p>다른 검색어로 시도해 보세요.</p>
                    </div>
                )}

                {/* 결과 목록 */}
                {posts.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                        {posts.map((post) => (
                            <li key={post.post_id}>
                                <Link
                                    href={`/post/${post.post_id}`}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition group"
                                >
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-200" />

                                    {/* 게시판 배지 */}
                                    <span className="shrink-0 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap">
                                        {post.board_name}
                                    </span>

                                    {/* 제목 */}
                                    <span className="flex-1 text-sm text-slate-700 group-hover:text-blue-600 transition leading-snug truncate min-w-0">
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
                )}

                <Pagination curPage={curPage} lastPage={lastPage} onPageChange={goPage} />
            </div>
        </ServiceLayout>
    );
}
