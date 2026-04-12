import React, { useState, useRef, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";

export default function TopBar() {
    const { auth } = usePage().props;
    const user = auth?.user ?? null;

    const [query, setQuery]       = useState("");
    const [dropOpen, setDropOpen] = useState(false);
    const dropRef = useRef(null);

    // 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        function onClickOutside(e) {
            if (dropRef.current && !dropRef.current.contains(e.target)) {
                setDropOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.visit("/search", { method: "get", data: { q: query.trim() }, preserveState: false });
    };

    const SearchForm = ({ className = "" }) => (
        <form onSubmit={handleSearch} className={className}>
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

                {/* ── 1행: 로고 + (md이상 검색 중앙고정) + 유저버튼 ── */}
                <div className="h-12 flex items-center">
                    {/* 로고 */}
                    <Link href="/" className="shrink-0 flex items-center gap-0.5 select-none">
                        <span className="text-xl font-black tracking-tight text-white">COMM</span>
                        <span className="text-xl font-black tracking-tight text-sky-400">GATE</span>
                    </Link>

                    {/* 검색 — md 이상에서 정중앙 고정 (absolute) */}
                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-sm lg:max-w-md px-4 pointer-events-none">
                        <SearchForm className="w-full pointer-events-auto" />
                    </div>

                    {/* 스페이서 (모바일에서 유저버튼을 오른쪽 정렬) */}
                    <div className="flex-1 md:hidden" />

                    {/* 모바일 유저 버튼 — lg 이상에서는 Sidebar AuthWidget이 담당 */}
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
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            onClick={() => setDropOpen(false)}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:text-red-500 hover:bg-slate-50 transition"
                                        >
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

                {/* ── 2행: 검색 — 모바일에서만 표시 ── */}
                <div className="md:hidden pb-2">
                    <SearchForm className="w-full" />
                </div>

            </div>
        </div>
    );
}
