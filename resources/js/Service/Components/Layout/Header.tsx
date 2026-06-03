import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import type { NavLink, SharedProps } from "@/types";

interface HeaderProps {
    theme?: "dark" | "light";
    navLinks?: NavLink[];
}

export default function Header({ theme = "dark", navLinks = [] }: HeaderProps) {
    const { auth } = usePage<SharedProps>().props;
    const [open, setOpen] = useState(false);

    const dark = theme === "dark";
    const wrap = dark ? "bg-[#0d1b2a] text-white shadow-lg" : "bg-white text-slate-800 border-b border-gray-200 shadow-sm";
    const link = dark ? "text-slate-300 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-blue-600 hover:bg-blue-50";
    const btn  = dark ? "border-white/20 text-slate-300 hover:bg-white/10" : "border-gray-300 text-slate-600 hover:bg-gray-100";

    const defaultLinks: NavLink[] = [
        { label: "홈",   href: "/" },
        { label: "게시판", href: "/" },
        { label: "인기글", href: "/" },
    ];
    const links = navLinks.length ? navLinks : defaultLinks;

    return (
        <header className={`sticky top-0 z-40 ${wrap}`}>
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    <Link href="/" className="flex items-center gap-1 shrink-0 select-none">
                        <span className={`text-xl font-black tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
                            COMM
                        </span>
                        <span className="text-xl font-black tracking-tight text-sky-500">GATE</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-0.5 text-sm font-medium">
                        {links.map((l) => (
                            <Link key={l.label} href={l.href}
                                className={`px-3 py-1.5 rounded transition ${link}`}>
                                {l.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        {auth?.user ? (
                            <>
                                <span className={`hidden sm:block text-sm mr-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                    <span className={dark ? "text-white" : "text-slate-800"}>{auth.user.name}</span>님
                                </span>
                                <Link href="/logout" method="post" as="button"
                                    className={`text-sm px-3 py-1.5 rounded border transition ${btn}`}>
                                    로그아웃
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/login"
                                    className={`text-sm px-3 py-1.5 rounded border transition ${btn}`}>
                                    로그인
                                </Link>
                                <Link href="/register"
                                    className="text-sm px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-white font-semibold transition">
                                    회원가입
                                </Link>
                            </>
                        )}

                        <button onClick={() => setOpen(v => !v)}
                            className={`md:hidden p-1.5 rounded transition ${link}`}
                            aria-label="메뉴">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {open
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                }
                            </svg>
                        </button>
                    </div>
                </div>

                {open && (
                    <div className={`md:hidden border-t py-2 space-y-0.5 pb-3 ${dark ? "border-white/10" : "border-gray-200"}`}>
                        {links.map((l) => (
                            <Link key={l.label} href={l.href}
                                className={`block px-3 py-2 text-sm rounded transition ${link}`}>
                                {l.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </header>
    );
}
