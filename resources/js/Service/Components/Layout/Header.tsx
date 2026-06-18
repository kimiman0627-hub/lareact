import { useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import type { NavLink, SharedProps } from "@/types";

interface HeaderProps {
    theme?: "dark" | "light";
    navLinks?: NavLink[];
}

export default function Header({ theme = "dark", navLinks = [] }: HeaderProps) {
    const { auth } = usePage<SharedProps>().props;
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");

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

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = q.trim();
        if (!trimmed) return;
        router.get("/search", { q: trimmed });
    }

    return (
        <header className={`sticky top-0 z-40 ${wrap}`}>
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14 gap-3">
                    <Link href="/" className="flex items-center gap-1 shrink-0 select-none">
                        <span className={`text-xl font-black tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
                            COMM
                        </span>
                        <span className="text-xl font-black tracking-tight text-sky-500">GATE</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-0.5 text-sm font-medium shrink-0">
                        {links.map((l) => (
                            <Link key={l.label} href={l.href}
                                className={`px-3 py-1.5 rounded transition ${link}`}>
                                {l.label}
                            </Link>
                        ))}
                    </nav>

                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
                        <div className={`flex w-full rounded overflow-hidden border ${dark ? "border-white/20 bg-white/10" : "border-gray-300 bg-gray-50"}`}>
                            <input
                                type="text"
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                placeholder="검색어 입력..."
                                className={`flex-1 px-3 py-1.5 text-sm bg-transparent outline-none placeholder:text-slate-400 ${dark ? "text-white" : "text-slate-800"}`}
                            />
                            <button type="submit" className={`px-3 text-slate-400 hover:text-sky-400 transition`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                </svg>
                            </button>
                        </div>
                    </form>

                    <div className="flex items-center gap-2 shrink-0">
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
                        <form onSubmit={handleSearch} className="px-3 pb-2">
                            <div className={`flex rounded overflow-hidden border ${dark ? "border-white/20 bg-white/10" : "border-gray-300 bg-gray-50"}`}>
                                <input
                                    type="text"
                                    value={q}
                                    onChange={e => setQ(e.target.value)}
                                    placeholder="검색어 입력..."
                                    className={`flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-slate-400 ${dark ? "text-white" : "text-slate-800"}`}
                                />
                                <button type="submit" className="px-3 text-slate-400 hover:text-sky-400 transition">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                    </svg>
                                </button>
                            </div>
                        </form>
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
