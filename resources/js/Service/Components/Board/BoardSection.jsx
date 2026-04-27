import { useState } from "react";
import { Link } from "@inertiajs/react";
import { timeAgo, fmtHits } from "./BoardCard";

const SCHEMES = [
    { bar: "bg-blue-600",    nameCls: "text-blue-800",   hdr: "bg-blue-50 border-blue-100",    grad: "from-blue-800 to-blue-500"    },
    { bar: "bg-emerald-600", nameCls: "text-emerald-800", hdr: "bg-emerald-50 border-emerald-100", grad: "from-emerald-800 to-emerald-500" },
    { bar: "bg-rose-600",    nameCls: "text-rose-800",   hdr: "bg-rose-50 border-rose-100",    grad: "from-rose-800 to-rose-500"    },
    { bar: "bg-amber-600",   nameCls: "text-amber-800",  hdr: "bg-amber-50 border-amber-100",  grad: "from-amber-800 to-amber-500"  },
    { bar: "bg-purple-600",  nameCls: "text-purple-800", hdr: "bg-purple-50 border-purple-100",grad: "from-purple-800 to-purple-500" },
    { bar: "bg-cyan-600",    nameCls: "text-cyan-800",   hdr: "bg-cyan-50 border-cyan-100",   grad: "from-cyan-800 to-cyan-500"    },
];

function FeaturedPost({ post, grad }) {
    const [imgError, setImgError] = useState(false);

    return (
        <Link
            href={`/post/${post.post_id}`}
            className="flex gap-3 px-3 py-3 hover:bg-blue-50/40 transition group border-b border-gray-100"
        >
            {/* 썸네일 */}
            <div className="shrink-0 w-22 h-15 rounded-md overflow-hidden bg-gray-100">
                {post.thumbnail && !imgError ? (
                    <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className={`w-full h-full bg-linear-to-br ${grad} flex items-center justify-center`}>
                        <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* 텍스트 */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-[13px] font-semibold text-slate-700 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                    {post.is_notice && (
                        <span className="inline-block text-[9px] font-bold text-white bg-red-500 rounded px-1 mr-1 leading-tight align-middle">공지</span>
                    )}
                    {post.title}
                    {post.comment_count > 0 && (
                        <span className="ml-1 text-blue-500 font-bold text-xs">[{post.comment_count}]</span>
                    )}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                    <span>{post.author}</span>
                    <span className="text-slate-200">·</span>
                    <span className="flex items-center gap-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {fmtHits(post.hits)}
                    </span>
                    <span className="text-slate-200">·</span>
                    <span>{timeAgo(post.created_at)}</span>
                </div>
            </div>
        </Link>
    );
}

function CompactRow({ post, idx }) {
    return (
        <li>
            <Link
                href={`/post/${post.post_id}`}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition group border-b border-gray-50 last:border-0"
            >
                <span className="shrink-0 w-4 text-center text-[10px] font-mono text-slate-300 group-hover:text-blue-400 transition">
                    {idx}
                </span>
                <span className="flex-1 text-xs text-slate-600 group-hover:text-blue-600 transition truncate leading-snug">
                    {post.is_notice && (
                        <span className="inline-block text-[9px] font-bold text-white bg-red-500 rounded px-1 mr-1 leading-tight align-middle">공지</span>
                    )}
                    {post.title}
                    {post.comment_count > 0 && (
                        <span className="ml-1 text-blue-400 font-semibold text-[11px]">[{post.comment_count}]</span>
                    )}
                </span>
                <span className="shrink-0 text-[10px] text-slate-300 whitespace-nowrap">
                    {timeAgo(post.created_at)}
                </span>
            </Link>
        </li>
    );
}

export default function BoardSection({ board, colorIndex = 0 }) {
    const posts  = board.posts ?? [];
    const href   = `/board/${board.category}`;
    const scheme = SCHEMES[colorIndex % SCHEMES.length];
    const [featured, ...rest] = posts;

    return (
        <section className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            {/* 헤더 */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${scheme.hdr}`}>
                <div className="flex items-center gap-2">
                    <span className={`inline-block w-0.75 h-4 rounded-full ${scheme.bar}`} />
                    <span className={`text-sm font-bold ${scheme.nameCls}`}>{board.board_name}</span>
                </div>
                <Link href={href} className="text-[11px] text-slate-400 hover:text-blue-500 transition font-medium">
                    전체보기 →
                </Link>
            </div>

            {/* 대표 게시글 */}
            {featured ? (
                <FeaturedPost post={featured} grad={scheme.grad} />
            ) : (
                <p className="px-4 py-5 text-center text-xs text-slate-400">게시글이 없습니다.</p>
            )}

            {/* 나머지 게시글 */}
            {rest.length > 0 && (
                <ul>
                    {rest.map((post, i) => (
                        <CompactRow key={post.post_id} post={post} idx={i + 2} />
                    ))}
                </ul>
            )}
        </section>
    );
}
