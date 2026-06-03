import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import type { AdminMenu, AdminMenuItem, SharedProps } from "@/types";

interface AdminSharedProps extends SharedProps {
    auth: { user: null; admin?: { name: string } };
    adminMenu?: (AdminMenu & { submenu?: (AdminMenuItem & { title?: string; icon?: string })[] })[];
}

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { auth, adminMenu = [] } = usePage<AdminSharedProps>().props;
    const { url } = usePage<AdminSharedProps>();

    const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});

    const isActiveMenu = (menuPath: string): boolean => {
        const currentPath = new URL(url, window.location.origin).pathname;
        return currentPath === menuPath || currentPath.startsWith(menuPath + "?");
    };

    useEffect(() => {
        const newOpenState: Record<number, boolean> = {};
        adminMenu.forEach((item, index) => {
            if (item.submenu) {
                const isChildActive = item.submenu.some((sub) =>
                    sub.route && isActiveMenu(new URL(route(sub.route)).pathname),
                );
                if (isChildActive) newOpenState[index] = true;
            }
        });
        setOpenMenus(newOpenState);
    }, [url]);

    const toggleMenu = (index: number) => {
        setOpenMenus((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <aside className="w-64 bg-slate-800 text-slate-100 flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-700 select-none">
                    <span className="text-2xl font-black text-sky-400">KR</span>
                    <span className="text-2xl font-black text-white">LIVED</span>
                    <span className="ml-2 text-xs font-semibold text-slate-400 align-middle">Admin</span>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {adminMenu.map((item, index) => {
                        const hasSubmenu = item.submenu && item.submenu.length > 0;
                        const isMainActive = hasSubmenu
                            ? item.submenu!.some((sub) => sub.route && isActiveMenu(new URL(route(sub.route)).pathname))
                            : item.route && isActiveMenu(new URL(route(item.route)).pathname);

                        return (
                            <div key={index}>
                                {hasSubmenu ? (
                                    <>
                                        <button onClick={() => toggleMenu(index)}
                                            className={`w-full flex items-center justify-between p-3 rounded hover:bg-slate-700 transition ${isMainActive ? "bg-slate-700 text-white" : ""}`}>
                                            <div className="flex items-center">
                                                <i className={`${item.icon} mr-3 w-5`}></i>
                                                <span>{item.label}</span>
                                            </div>
                                            <svg className={`w-4 h-4 transition-transform duration-200 ${openMenus[index] ? "rotate-180" : ""}`}
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {openMenus[index] && (
                                            <div className="mt-1 ml-4 space-y-1 border-l border-slate-700">
                                                {item.submenu!.map((sub, subIdx) => {
                                                    const isSubActive = sub.route && isActiveMenu(new URL(route(sub.route)).pathname);
                                                    return (
                                                        <Link key={subIdx} href={route(sub.route)}
                                                            className={`block p-2 pl-6 text-sm rounded transition ${isSubActive ? "text-white font-bold bg-slate-600" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                                                            {sub.label}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link href={item.route ? route(item.route) : "#"}
                                        className={`flex items-center p-3 rounded transition ${isMainActive ? "bg-slate-700 text-white" : "hover:bg-slate-700"}`}>
                                        <i className={`${item.icon} mr-3 w-5`}></i>
                                        <span>{item.label}</span>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-6 gap-3 shrink-0">
                    <span className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">{auth?.admin?.name ?? "관리자"}</span>님
                    </span>
                    <Link href="/admin/settings/profile"
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        비밀번호 변경
                    </Link>
                    <Link href="/admin/logout" method="post" as="button"
                        className="text-xs text-slate-400 hover:text-red-500 transition">
                        로그아웃
                    </Link>
                </header>
                <main className="p-8 flex-1">{children}</main>
            </div>
        </div>
    );
}
