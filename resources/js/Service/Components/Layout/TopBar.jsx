import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import { router } from "@inertiajs/react";

export default function TopBar() {
    const [query, setQuery] = useState("");

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.visit("/search", { method: "get", data: { q: query.trim() }, preserveState: false });
    };

    return (
        <div className="bg-[#1a3a5c] border-b border-[#0d2a45]">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                {/* 로고 */}
                <Link href="/" className="shrink-0 flex items-center gap-0.5 select-none">
                    <span className="text-2xl font-black tracking-tight text-white">COMM</span>
                    <span className="text-2xl font-black tracking-tight text-sky-400">GATE</span>
                </Link>

                {/* 검색 폼 */}
                <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                    <div className="flex items-center bg-white/10 border border-white/20 rounded-lg overflow-hidden focus-within:border-sky-400 focus-within:bg-white/15 transition">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="게시글, 게시판 검색..."
                            className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-400 outline-none"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 text-slate-300 hover:text-white transition"
                            aria-label="검색"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                        </button>
                    </div>
                </form>

                {/* 우측 여백 (로고 균형) */}
                <div className="shrink-0 w-24 hidden sm:block" />
            </div>
        </div>
    );
}
