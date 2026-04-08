import React, { useState } from "react";
import { Link } from "@inertiajs/react";

const NAV_ITEMS = [
    { label: "홈",     href: "/" },
    { label: "인기글", href: "/" },
    { label: "자유",   href: "/" },
    { label: "게임",   href: "/" },
    { label: "스포츠", href: "/" },
    { label: "주식·코인", href: "/" },
    { label: "유머",   href: "/" },
    { label: "방송",   href: "/" },
];

export default function NavBar() {
    const [open, setOpen] = useState(false);

    return (
        <nav className="bg-[#112d4a] border-b border-[#0d2236] sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center h-10">
                    {/* 데스크톱 메뉴 */}
                    <div className="hidden md:flex items-center gap-0 text-sm font-medium overflow-x-auto">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="px-3 h-10 flex items-center text-slate-300 hover:text-white hover:bg-white/10 transition whitespace-nowrap"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* 모바일 드롭다운 트리거 */}
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="md:hidden flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span>메뉴</span>
                    </button>
                </div>

                {/* 모바일 드로어 */}
                {open && (
                    <div className="md:hidden border-t border-white/10 py-2 pb-3 grid grid-cols-4 gap-1">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="text-center text-xs text-slate-300 hover:text-white py-2 rounded hover:bg-white/10 transition"
                                onClick={() => setOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
