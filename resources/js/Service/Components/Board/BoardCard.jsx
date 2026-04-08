import React from "react";
import { Link } from "@inertiajs/react";

export const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)        return "방금";
    if (diff < 3600)      return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400)     return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 86400 * 3) return `${Math.floor(diff / 86400)}일 전`;
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
};

export const fmtHits = (n) => {
    if (!n) return "0";
    if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "만";
    if (n >= 1000)  return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
};

const truncate = (str, len = 38) =>
    str && str.length > len ? str.slice(0, len) + "…" : str;

/**
 * 디자인 A — 다크 네이비 헤더 카드
 */
export default function BoardCard({ board }) {
    const posts = board.posts ?? [];
    const href  = `/board/${board.category}`;

    return (
        <article className="bg-white rounded border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            {/* 카드 헤더 */}
            <div className="flex items-center justify-between bg-[#1a2942] px-3 py-2.5 gap-2">
                <Link href={href}
                    className="text-sm font-bold text-white hover:text-sky-300 transition truncate">
                    {board.board_name}
                </Link>
                <Link href={href}
                    className="shrink-0 text-[11px] text-slate-400 hover:text-sky-400 transition whitespace-nowrap">
                    더보기 →
                </Link>
            </div>

            {/* 게시글 목록 */}
            <ul className="flex-1 divide-y divide-gray-100">
                {posts.length === 0 && (
                    <li className="px-3 py-5 text-center text-xs text-slate-400">
                        게시글이 없습니다.
                    </li>
                )}
                {posts.map((post) => (
                    <li key={post.post_id}>
                        <Link href={`/post/${post.post_id}`}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-sky-50 transition group">
                            {post.is_notice
                                ? <span className="shrink-0 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded px-1 leading-tight">공지</span>
                                : <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-200 mt-px" />
                            }

                            <span className="flex-1 text-sm text-slate-800 group-hover:text-sky-700 leading-snug min-w-0 truncate">
                                {truncate(post.title)}
                                {post.comment_count > 0 && (
                                    <span className="ml-1 text-sky-500 font-bold text-xs">
                                        [{post.comment_count}]
                                    </span>
                                )}
                            </span>

                            <span className="shrink-0 flex items-center gap-1.5 text-[11px] text-slate-400 whitespace-nowrap">
                                <span className="hidden sm:block max-w-[56px] truncate">{post.author}</span>
                                <span className="text-slate-300">·</span>
                                <span>{timeAgo(post.created_at)}</span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </article>
    );
}
