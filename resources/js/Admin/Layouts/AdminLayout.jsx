import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";

export default function AdminLayout({ children }) {
    const { auth, adminMenu = [] } = usePage().props; // 미들웨어에서 보낸 메뉴 데이터

    const { url } = usePage();

    // 메뉴 개폐 상태
    const [openMenus, setOpenMenus] = useState({});

    // 현재 URL과 메뉴 경로를 비교하여 활성화 상태 결정
    const isActiveMenu = (menuPath) => {
        const currentPath = new URL(url, window.location.origin).pathname;
        return (
            currentPath === menuPath || currentPath.startsWith(menuPath + "?")
        );
    };

    // 페이지 이동 시 현재 메뉴를 자동으로 펼쳐주는 로직
    useEffect(() => {
        const newOpenState = {};
        adminMenu.forEach((item, index) => {
            if (item.submenu) {
                const isChildActive = item.submenu.some((sub) =>
                    isActiveMenu(new URL(route(sub.route)).pathname),
                );
                if (isChildActive) {
                    newOpenState[index] = true;
                }
            }
        });
        // 현재 활성화된 메뉴만 열리도록 상태 업데이트
        setOpenMenus(newOpenState);
    }, [url]); // url이 바뀔 때마다 실행

    const toggleMenu = (index) => {
        setOpenMenus((prev) => ({
            ...prev,
            [index]: !prev[index], // 사용자가 수동으로 끄고 켤 수 있음
        }));
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <aside className="w-64 bg-slate-800 text-slate-100 flex flex-col shrink-0">
                <div className="p-6 text-2xl font-bold text-yellow-500 border-b border-slate-700">
                    Admin Panel
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {adminMenu.map((item, index) => {
                        const hasSubmenu =
                            item.submenu && item.submenu.length > 0;

                        // 현재 메뉴의 활성화 여부 계산
                        const isMainActive = hasSubmenu
                            ? item.submenu.some((sub) =>
                                  isActiveMenu(
                                      new URL(route(sub.route)).pathname,
                                  ),
                              )
                            : isActiveMenu(new URL(route(item.route)).pathname);

                        return (
                            <div key={index}>
                                {hasSubmenu ? (
                                    <>
                                        <button
                                            onClick={() => toggleMenu(index)}
                                            className={`w-full flex items-center justify-between p-3 rounded hover:bg-slate-700 transition ${isMainActive ? "bg-slate-700 text-white" : ""}`}
                                        >
                                            <div className="flex items-center">
                                                <i
                                                    className={`${item.icon} mr-3 w-5`}
                                                ></i>
                                                <span>{item.title}</span>
                                            </div>
                                            <svg
                                                className={`w-4 h-4 transition-transform duration-200 ${openMenus[index] ? "rotate-180" : ""}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        {/* 토글 상태(openMenus[index])에 따라 서브메뉴 표시 */}
                                        {openMenus[index] && (
                                            <div className="mt-1 ml-4 space-y-1 border-l border-slate-700">
                                                {item.submenu.map(
                                                    (sub, subIdx) => {
                                                        const isSubActive =
                                                            isActiveMenu(
                                                                new URL(
                                                                    route(
                                                                        sub.route,
                                                                    ),
                                                                ).pathname,
                                                            );
                                                        return (
                                                            <Link
                                                                key={subIdx}
                                                                href={route(
                                                                    sub.route,
                                                                )}
                                                                className={`block p-2 pl-6 text-sm rounded transition ${isSubActive ? "text-white font-bold bg-slate-600" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
                                                            >
                                                                {sub.title}
                                                            </Link>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={route(item.route)}
                                        className={`flex items-center p-3 rounded transition ${isMainActive ? "bg-slate-700 text-white" : "hover:bg-slate-700"}`}
                                    >
                                        <i
                                            className={`${item.icon} mr-3 w-5`}
                                        ></i>
                                        <span>{item.title}</span>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                {/* 헤더 및 컨텐츠 영역 생략 (기존 코드와 동일) */}
                <main className="p-8 flex-1">{children}</main>
            </div>
        </div>
    );
}
