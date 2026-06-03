import React, { useState, useRef, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import type { SharedProps } from "@/types";

export default function TopBar() {
    const { auth } = usePage<SharedProps>().props;
    const user = auth?.user ?? null;

    const [query, setQuery] = useState("");
    const [dropOpen, setDropOpen] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
                setDropOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.visit("/search", { method: "get", data: { q: query.trim() }, preserveState: false });
    };

    const searchInput = (
        <form onSubmit={handleSearch} className="w-full">
            <div className="flex items-center bg-white/10 border border-white/20 rounded-lg overflow-hidden focus-within:border-sky-400 focus-within:bg-white/15 transition">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="검색..."
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none min-w-0"
                />
                <button type="submit" className="px-3 py-2 text-slate-300 hover:text-white transition shrink-0" aria-label="검색">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                </button>
            </div>
        </form>
    );

    return (
        <div className="relative bg-[#0d1b2a] border-b border-[#0a1520]">
            <div className="max-w-6xl mx-auto px-4">
                <div className="h-12 flex items-center">
                    <Link href="/" className="shrink-0 flex items-center gap-0.5 select-none">
                        <span className="text-xl font-black tracking-tight text-sky-400">KR</span>
                        <span className="text-xl font-black tracking-tight text-white">LIVED</span>
                    </Link>

                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-sm lg:max-w-md px-4">
                        {searchInput}
                    </div>

                    <div className="flex-1 md:hidden" />

                    <div className="shrink-0 lg:hidden relative" ref={dropRef}>
                        {user ? (
                            <>
                                <button
                                    onClick={() => setDropOpen((v) => !v)}
                                    className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-sm font-bold hover:bg-sky-400 transition"
                                >
                                    {user.name?.[0]?.toUpperCase() ?? "?"}
                                </button>
                                {dropOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-gray-100 bg-slate-50">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                        </div>
                                        <Link href="/mypage" onClick={() => setDropOpen(false)}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-blue-500 hover:bg-slate-50 transition block">
                                            마이페이지
                                        </Link>
                                        <Link href="/mypage?tab=scraps" onClick={() => setDropOpen(false)}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-blue-500 hover:bg-slate-50 transition block">
                                            내 스크랩
                                        </Link>
                                        <Link href="/mypage?tab=inquiries" onClick={() => setDropOpen(false)}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-blue-500 hover:bg-slate-50 transition block">
                                            내 문의
                                        </Link>
                                        <Link href="/mypage?tab=password" onClick={() => setDropOpen(false)}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-blue-500 hover:bg-slate-50 transition block">
                                            비밀번호 변경
                                        </Link>
                                        <Link href="/logout" method="post" as="button" onClick={() => setDropOpen(false)}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:text-red-500 hover:bg-slate-50 transition">
                                            로그아웃
                                        </Link>
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link href="/login" className="text-sm font-medium text-white/80 hover:text-white transition">
                                로그인
                            </Link>
                        )}
                    </div>
                </div>

                <div className="md:hidden pb-2">
                    {searchInput}
                </div>
            </div>
        </div>
    );
}
