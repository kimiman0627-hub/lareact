import React, { useState, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import type { NavItem, SharedProps } from "@/types";

interface DropdownItemProps {
    item: NavItem;
}

function DropdownItem({ item }: DropdownItemProps) {
    const [open, setOpen] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const enter = () => { if (timer.current) clearTimeout(timer.current); setOpen(true); };
    const leave = () => { timer.current = setTimeout(() => setOpen(false), 120); };

    if (!item.children?.length) {
        if (item.new_tab) {
            return (
                <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 h-10 flex items-center text-white/90 hover:text-white hover:bg-white/15 transition whitespace-nowrap text-sm font-medium"
                >
                    {item.label}
                </a>
            );
        }
        return (
            <Link
                href={item.href}
                className="px-3 h-10 flex items-center text-white/90 hover:text-white hover:bg-white/15 transition whitespace-nowrap text-sm font-medium"
            >
                {item.label}
            </Link>
        );
    }

    return (
        <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
            <button className="px-3 h-10 flex items-center gap-1 text-white/90 hover:text-white hover:bg-white/15 transition whitespace-nowrap text-sm font-medium">
                {item.label}
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="absolute top-full left-0 z-50 min-w-35 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                    {item.children.map((child) => (
                        <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 whitespace-nowrap"
                        >
                            {child.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function NavBar() {
    const { navMenu = [] } = usePage<SharedProps>().props;
    const [open, setOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState<Record<string, boolean>>({});

    const toggleMobile = (label: string) =>
        setMobileOpen((prev) => ({ ...prev, [label]: !prev[label] }));

    return (
        <nav className="bg-[#1a3a5c] border-b border-[#0d2a45]">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center h-10">
                    <div className="hidden md:flex items-center overflow-x-auto">
                        {navMenu.map((item) => (
                            <DropdownItem key={item.label} item={item} />
                        ))}
                    </div>

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

                {open && (
                    <div className="md:hidden border-t border-white/20 py-2 pb-3">
                        {navMenu.map((item) => (
                            <div key={item.label}>
                                {item.children?.length ? (
                                    <>
                                        <button
                                            onClick={() => toggleMobile(item.label)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded transition"
                                        >
                                            <span>{item.label}</span>
                                            <svg
                                                className={`w-3 h-3 opacity-60 transition-transform ${mobileOpen[item.label] ? "rotate-180" : ""}`}
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {mobileOpen[item.label] && (
                                            <div className="ml-4 border-l border-white/20 pl-2 mt-1 mb-1 space-y-0.5">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        className="block px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded transition"
                                                        onClick={() => setOpen(false)}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : item.new_tab ? (
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded transition"
                                        onClick={() => setOpen(false)}
                                    >
                                        {item.label}
                                    </a>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="block px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 rounded transition"
                                        onClick={() => setOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
