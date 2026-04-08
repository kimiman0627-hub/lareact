import React from "react";
import { Link } from "@inertiajs/react";
import { timeAgo, fmtHits } from "./BoardCard";

// 게시판별 좌측 강조 컬러 사이클
const BORDER_COLORS = [
    "border-blue-500",
    "border-emerald-500",
    "border-rose-500",
    "border-amber-500",
    "border-purple-500",
    "border-cyan-500",
];

const BADGE_COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
    "bg-purple-100 text-purple-700",
    "bg-cyan-100 text-cyan-700",
];

/**
 * 디자인 B — 라이트 포탈 섹션형 (Ruliweb / Inven 느낌)
 */
export default function BoardSection({ board, colorIndex = 0 }) {
    const posts     = board.posts ?? [];
    const href      = `/board/${board.category}`;
    const border    = BORDER_COLORS[colorIndex % BORDER_COLORS.length];
    const badge     = BADGE_COLORS[colorIndex  % BADGE_COLORS.length];

    return (
        <section className={`bg-white rounded-lg shadow-sm border-l-4 ${border} overflow-hidden`}>
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                        {board.board_name}
                    </span>
                </div>
                <Link href={href}
                    className="text-xs text-slate-400 hover:text-blue-500 transition font-medium">
                    전체보기 →
                </Link>
            </div>

            {/* 게시글 목록 */}
            <ul>
                {posts.length === 0 && (
                    <li className="px-4 py-5 text-center text-xs text-slate-400">
                        게시글이 없습니다.
                    </li>
                )}
                {posts.map((post, i) => (
                    <li key={post.post_id}
                        className={`${i !== 0 ? "border-t border-gray-50" : ""}`}>
                        <Link href={`/post/${post.post_id}`}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition group">
                            {/* 번호 */}
                            <span className="shrink-0 w-5 text-center text-xs font-mono text-slate-300 group-hover:text-blue-400 transition">
                                {i + 1}
                            </span>

                            {/* 공지 */}
                            {post.is_notice && (
                                <span className="shrink-0 text-[10px] font-bold text-white bg-red-500 rounded px-1 leading-tight">
                                    공지
                                </span>
                            )}

                            {/* 제목 */}
                            <span className="flex-1 text-sm text-slate-700 group-hover:text-blue-600 transition leading-snug min-w-0 truncate">
                                {post.title}
                                {post.comment_count > 0 && (
                                    <span className="ml-1 text-blue-400 font-semibold text-xs">
                                        +{post.comment_count}
                                    </span>
                                )}
                            </span>

                            {/* 메타 */}
                            <span className="shrink-0 flex items-center gap-2 text-[11px] text-slate-400 whitespace-nowrap">
                                <span className="hidden md:flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {fmtHits(post.hits)}
                                </span>
                                <span className="text-slate-300 hidden md:block">·</span>
                                <span>{timeAgo(post.created_at)}</span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
