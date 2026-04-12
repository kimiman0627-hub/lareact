import { Link } from "@inertiajs/react";
import { timeAgo } from "./BoardCard";

const GRADIENTS = [
    "bg-linear-to-br from-[#0f2642] to-[#1a3a5c]",
    "bg-linear-to-br from-slate-700 to-slate-500",
    "bg-linear-to-br from-emerald-800 to-emerald-600",
    "bg-linear-to-br from-rose-800 to-rose-600",
    "bg-linear-to-br from-violet-800 to-violet-600",
];

function RankBadge({ rank }) {
    const base = "shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black";
    if (rank === 1) return <span className={`${base} bg-orange-500 text-white`}>1</span>;
    if (rank === 2) return <span className={`${base} bg-slate-400 text-white`}>2</span>;
    if (rank === 3) return <span className={`${base} bg-amber-600 text-white`}>3</span>;
    return <span className={`${base} bg-slate-200 text-slate-500`}>{rank}</span>;
}

// 대형 카드 — h-full로 소형 카드 컬럼 높이에 맞춤
function FeaturedCard({ post }) {
    return (
        <Link
            href={`/post/${post.post_id}`}
            className="relative block w-full h-full rounded-xl overflow-hidden group shadow-sm"
        >
            {post.thumbnail ? (
                <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105"
                />
            ) : (
                <div className={`absolute inset-0 ${GRADIENTS[0]}`} />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                    <RankBadge rank={1} />
                    <span className="text-[10px] font-semibold text-white/70 bg-white/15 rounded px-2 py-0.5">
                        {post.board_name}
                    </span>
                </div>
                <p className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-sky-300 transition">
                    {post.title}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/50">
                    <span>{post.author}</span>
                    <span>·</span>
                    <span>{timeAgo(post.created_at)}</span>
                    {post.comment_count > 0 && (
                        <>
                            <span>·</span>
                            <span className="text-sky-400">댓글 {post.comment_count}</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}

// 소형 카드 — 고정 높이 h-16, 썸네일은 absolute로 클립
function SmallCard({ post, rank }) {
    const grad = GRADIENTS[rank - 1] ?? GRADIENTS[rank % GRADIENTS.length];
    return (
        <Link
            href={`/post/${post.post_id}`}
            className="flex items-stretch h-16 rounded-lg overflow-hidden group shadow-sm bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition"
        >
            {/* 썸네일 — 고정 너비, absolute 이미지 */}
            <div className="relative shrink-0 w-24 overflow-hidden">
                {post.thumbnail ? (
                    <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className={`absolute inset-0 ${grad} flex items-center justify-center`}>
                        <span className="text-xl font-black text-white/25">{rank}</span>
                    </div>
                )}
            </div>

            {/* 텍스트 */}
            <div className="flex flex-col justify-center flex-1 min-w-0 px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                    <RankBadge rank={rank} />
                    <span className="text-[10px] text-slate-400 truncate">{post.board_name}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                    {post.title}
                    {post.comment_count > 0 && (
                        <span className="ml-1 text-blue-400">[{post.comment_count}]</span>
                    )}
                </p>
            </div>
        </Link>
    );
}

export default function PopularWidget({ posts = [] }) {
    if (posts.length === 0) return null;

    const [first, ...rest] = posts;

    return (
        <section className="mb-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <span>🔥</span> 인기글
                    <span className="text-xs font-normal text-slate-400">최근 7일</span>
                </h2>
                <Link href="/popular" className="text-xs text-slate-400 hover:text-blue-500 transition font-medium">
                    전체보기 →
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* 대형 카드 — 모바일: h-52 고정 / 데스크톱: 옆 컬럼 높이에 맞춤(h-full) */}
                <div className="md:col-span-3 h-52 md:h-full flex">
                    <FeaturedCard post={first} />
                </div>

                {/* 소형 카드 4개 */}
                <div className="md:col-span-2 flex flex-col gap-2">
                    {rest.map((post, i) => (
                        <SmallCard key={post.post_id} post={post} rank={i + 2} />
                    ))}
                </div>
            </div>
        </section>
    );
}
