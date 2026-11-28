import React, { useState, useEffect, useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import type { AdminMenu, AdminMenuItem, SharedProps } from "@/types";
import AdminIcon from "@/Admin/Components/Common/AdminIcon";

interface AdminSharedProps extends SharedProps {
    auth: { user: null; admin?: { name: string; email?: string } };
    adminMenu?: (AdminMenu & { submenu?: (AdminMenuItem & { title?: string; icon?: string })[] })[];
}

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

/** 메뉴 route 이름 → pathname (route 가 없거나 ziggy 에 없으면 null) */
function routePath(name?: string): string | null {
    if (!name) return null;
    try {
        return new URL(route(name)).pathname;
    } catch {
        return null;
    }
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const { auth, adminMenu = [] } = usePage<AdminSharedProps>().props;
    const { url } = usePage<AdminSharedProps>();

    const currentPath = new URL(url, window.location.origin).pathname;
    const isActive = (path: string | null) => !!path && (currentPath === path || currentPath.startsWith(path + "/"));

    const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});
    const [mobileOpen, setMobileOpen] = useState(false);

    // 현재 페이지가 속한 메뉴 펼치기 + 페이지 제목 계산
    const { activeIndex, pageTitle } = useMemo(() => {
        let best = { index: -1, label: "", len: 0 };
        adminMenu.forEach((item, index) => {
            const candidates = item.submenu?.length
                ? item.submenu.map((s) => ({ path: routePath(s.route), label: s.label }))
                : [{ path: routePath(item.route), label: item.label }];
            candidates.forEach(({ path, label }) => {
                // 가장 길게 일치하는 경로를 현재 메뉴로 (예: /admin 보다 /admin/posts 우선)
                if (path && isActive(path) && path.length > best.len) best = { index, label, len: path.length };
            });
        });
        return { activeIndex: best.index, pageTitle: best.label };
    }, [url, adminMenu]);

    useEffect(() => {
        if (activeIndex >= 0) setOpenMenus((prev) => ({ ...prev, [activeIndex]: true }));
        setMobileOpen(false);
    }, [url]);

    const adminName = auth?.admin?.name ?? "관리자";

    const sidebar = (
        <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-2 px-5 border-b border-slate-100">
                <Link href={route("admin.index")} className="flex items-baseline select-none">
                    <span className="text-xl font-extrabold tracking-tight text-sky-500">KR</span>
                    <span className="text-xl font-extrabold tracking-tight text-slate-900">LIVED</span>
                </Link>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">Admin</span>
                <button
                    onClick={() => setMobileOpen(false)}
                    className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
                    aria-label="메뉴 닫기"
                >
                    <AdminIcon name="close" />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                {adminMenu.map((item, index) => {
                    const hasSubmenu = !!item.submenu?.length;
                    const isGroupActive = index === activeIndex;
                    const open = !!openMenus[index];

                    if (!hasSubmenu) {
                        return (
                            <Link
                                key={index}
                                href={item.route ? route(item.route) : "#"}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                    isGroupActive
                                        ? "bg-sky-50 text-sky-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <AdminIcon name={item.icon} className={`w-[18px] h-[18px] ${isGroupActive ? "text-sky-600" : "text-slate-400"}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    }

                    return (
                        <div key={index}>
                            <button
                                onClick={() => setOpenMenus((prev) => ({ ...prev, [index]: !prev[index] }))}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                                    isGroupActive ? "text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                <AdminIcon name={item.icon} className={`w-[18px] h-[18px] ${isGroupActive ? "text-sky-600" : "text-slate-400"}`} />
                                <span className="flex-1 text-left">{item.label}</span>
                                <AdminIcon name="chevronDown" className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                            </button>
                            {open && (
                                <div className="mb-1 ml-[21px] mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
                                    {item.submenu!.map((sub, subIdx) => {
                                        const active = isGroupActive && sub.label === pageTitle;
                                        return (
                                            <Link
                                                key={subIdx}
                                                href={route(sub.route)}
                                                className={`block rounded-md px-3 py-1.5 text-[13px] transition ${
                                                    active
                                                        ? "bg-sky-50 font-semibold text-sky-700"
                                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                                }`}
                                            >
                                                {sub.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="border-t border-slate-100 p-3">
                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                >
                    <AdminIcon name="external" className="w-[18px] h-[18px] text-slate-400" />
                    사이트 바로가기
                </a>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* 데스크톱 사이드바 */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200 bg-white lg:block">
                {sidebar}
            </aside>

            {/* 모바일 사이드바 */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">{sidebar}</aside>
                </div>
            )}

            <div className="lg:pl-60">
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur lg:px-8">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="-ml-1 rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                        aria-label="메뉴 열기"
                    >
                        <AdminIcon name="menu" className="w-5 h-5" />
                    </button>

                    <h1 className="truncate text-[15px] font-semibold text-slate-900">{title || pageTitle || "관리자"}</h1>

                    <div className="ml-auto flex items-center gap-1">
                        <div className="mr-2 hidden items-center gap-2.5 sm:flex">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
                                {adminName.slice(0, 1)}
                            </span>
                            <span className="text-sm font-medium text-slate-700">{adminName}</span>
                        </div>
                        <Link
                            href="/admin/settings/profile"
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            title="비밀번호 변경"
                        >
                            <AdminIcon name="lock" className="w-4 h-4" />
                            <span className="hidden md:inline">비밀번호 변경</span>
                        </Link>
                        <Link
                            href="/admin/logout"
                            method="post"
                            as="button"
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            title="로그아웃"
                        >
                            <AdminIcon name="logout" className="w-4 h-4" />
                            <span className="hidden md:inline">로그아웃</span>
                        </Link>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
