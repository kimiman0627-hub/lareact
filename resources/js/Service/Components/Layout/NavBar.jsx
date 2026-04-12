import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";

export default function NavBar() {
    const { gnbBoards = [] } = usePage().props;
    const [open, setOpen] = useState(false);

    const fixedItems = [
        { label: "홈",   href: "/" },
        { label: "인기글", href: "/popular" },
    ];
    const boardItems = gnbBoards.map((b) => ({
        label: b.board_name,
        href: `/board/${b.category}`,
    }));
    const items = [...fixedItems, ...boardItems];

    return (
        <nav className="bg-[#1a3a5c] border-b border-[#0d2a45]">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center h-10">
                    {/* 데스크톱 메뉴 */}
                    <div className="hidden md:flex items-center text-sm font-medium overflow-x-auto">
                        {items.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="px-3 h-10 flex items-center text-white/90 hover:text-white hover:bg-white/15 transition whitespace-nowrap"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* 모바일 드롭다운 트리거 */}
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="md:hidden flex items-center gap-2 text-sm text-white/90 hover:text-white transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <span>메뉴</span>
                    </button>
                </div>

                {/* 모바일 드로어 */}
                {open && (
                    <div className="md:hidden border-t border-white/20 py-2 pb-3 grid grid-cols-4 gap-1">
                        {items.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="text-center text-xs text-white/90 hover:text-white py-2 rounded hover:bg-white/15 transition"
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
