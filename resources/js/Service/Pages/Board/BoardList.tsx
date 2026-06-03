import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import { timeAgo, fmtHits } from "@/Service/Components/Board/BoardCard";
import Pagination from "@/Service/Components/Common/Pagination";
import type { Board, Post, PaginatedData, SeoData, SharedProps } from "@/types";

interface BoardListProps {
    board: Board;
    list: PaginatedData<Post> | { data: Post[]; last_page?: number; current_page?: number; total?: number };
    seo?: SeoData;
}

export default function BoardList({ board, list, seo = {} }: BoardListProps) {
    const { auth } = usePage<SharedProps>().props;
    const posts     = (list as PaginatedData<Post>).data ?? [];
    const meta      = (list as PaginatedData<Post>).meta ?? list as { last_page?: number; current_page?: number; total?: number };
    const lastPage  = (meta as { last_page?: number }).last_page ?? 1;
    const curPage   = (meta as { current_page?: number }).current_page ?? 1;

    function goPage(page: number) {
        router.get(`/board/${board.category}`, { page }, { preserveScroll: true });
    }

    return (
        <ServiceLayout theme="light">
            <Head>
                <title>{seo.title ?? board.board_name}</title>
                <meta name="description" content={seo.description ?? ""} />
                <link rel="canonical" href={seo.canonical ?? ""} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={seo.title ?? board.board_name} />
                <meta property="og:description" content={seo.description ?? ""} />
                <meta property="og:url" content={seo.canonical ?? ""} />
            </Head>

            <div className="flex items-center gap-2 mb-4">
                <Link href="/" className="text-sm text-slate-400 hover:text-blue-500 transition">홈</Link>
                <span className="text-slate-300 text-sm">›</span>
                <span className="text-sm font-semibold text-slate-700">{board.board_name}</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h1 className="text-base font-bold text-slate-800">{board.board_name}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">전체 {(meta as { total?: number }).total ?? 0}건</span>
                        {auth?.user && (
                            <Link href={`/post/write?category=${board.category}`}
                                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded px-2.5 py-1 transition">
                                글쓰기
                            </Link>
                        )}
                    </div>
                </div>

                <ul className="divide-y divide-gray-100">
                    {posts.length === 0 && (
                        <li className="px-4 py-10 text-center text-sm text-slate-400">게시글이 없습니다.</li>
                    )}
                    {posts.map((post) => (
                        <li key={post.post_id}>
                            <Link href={`/post/${post.post_id}`}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition group">
                                {post.is_notice ? (
                                    <span className="shrink-0 text-[10px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 leading-tight">공지</span>
                                ) : (
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-200" />
                                )}

                                <span className="flex-1 text-sm text-slate-700 group-hover:text-blue-600 transition leading-snug truncate min-w-0">
                                    {post.title}
                                    {post.has_image && <i className="fa-regular fa-image ml-1 text-slate-400 text-[11px]" />}
                                    {(post.comment_count ?? 0) > 0 && (
                                        <span className="ml-1 text-blue-400 font-semibold text-xs">[{post.comment_count}]</span>
                                    )}
                                </span>

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

                <Pagination curPage={curPage} lastPage={lastPage} onPageChange={goPage} />
            </div>
        </ServiceLayout>
    );
}
