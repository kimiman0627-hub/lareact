import { Head, Link } from "@inertiajs/react";
import { useMemo, useState, useEffect } from "react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import BoardSection from "@/Service/Components/Board/BoardSection";
import PopularWidget from "@/Service/Components/Board/PopularWidget";

function LatestTicker({ boards }) {
    const [index, setIndex] = useState(0);
    const [show, setShow] = useState(true);

    const latest = useMemo(() => {
        const all = boards.flatMap((b) =>
            (b.posts ?? []).map((p) => ({ ...p, board_name: b.board_name }))
        );
        return all
            .filter((p) => !p.is_notice)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 12);
    }, [boards]);

    useEffect(() => {
        if (latest.length <= 1) return;
        const timer = setInterval(() => {
            setShow(false);
            setTimeout(() => {
                setIndex((i) => (i + 1) % latest.length);
                setShow(true);
            }, 250);
        }, 3500);
        return () => clearInterval(timer);
    }, [latest.length]);

    if (latest.length === 0) return null;

    const post = latest[index];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex items-center overflow-hidden h-9">
            <span className="shrink-0 flex items-center justify-center h-full px-3 bg-blue-600 text-[11px] font-bold text-white tracking-wide">
                NEW
            </span>
            <div className="overflow-hidden flex-1 px-3 flex items-center">
                <Link
                    href={`/post/${post.post_id}`}
                    className="text-xs text-slate-600 hover:text-blue-600 truncate block w-full"
                    style={{
                        transition: "opacity 250ms, transform 250ms",
                        opacity: show ? 1 : 0,
                        transform: show ? "translateY(0)" : "translateY(-6px)",
                    }}
                >
                    <span className="text-slate-400 mr-1">[{post.board_name}]</span>
                    {post.title}
                </Link>
            </div>
        </div>
    );
}

export default function MainIndex({ boards = [], popularPosts = [], seo = {} }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "url": seo.canonical,
                "name": "KRLived",
                "description": seo.description,
                "inLanguage": "ko-KR",
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": { "@type": "EntryPoint", "urlTemplate": (seo.canonical ?? "").replace(/\/$/, "") + "/search?q={search_term_string}" },
                    "query-input": "required name=search_term_string",
                },
            },
            {
                "@type": "Organization",
                "name": "KRLived",
                "url": seo.canonical,
                "contactPoint": { "@type": "ContactPoint", "email": "kimiman0627@gmail.com", "contactType": "customer support" },
            },
        ],
    };

    return (
        <ServiceLayout theme="light">
            <Head>
                <title>{seo.title ?? "커뮤니티 포털"}</title>
                <meta name="description" content={seo.description ?? ""} />
                <link rel="canonical" href={seo.canonical ?? ""} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={seo.title ?? "커뮤니티 포털"} />
                <meta property="og:description" content={seo.description ?? ""} />
                <meta property="og:url" content={seo.canonical ?? ""} />
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Head>

            <div className="space-y-5">
                {/* 최신글 ticker */}
                <LatestTicker boards={boards} />

                {/* 인기글 */}
                <PopularWidget posts={popularPosts} />

                {/* 게시판 목록 */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-sm font-bold text-slate-600 shrink-0">게시판</h2>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {boards.map((board, i) => (
                            <BoardSection key={board.board_id} board={board} colorIndex={i} />
                        ))}
                    </div>
                </div>
            </div>
        </ServiceLayout>
    );
}
