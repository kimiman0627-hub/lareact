import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";

export default function AdminLayout({ children }) {
    const { auth } = usePage().props;
    // 회원 관리 서브메뉴 개폐 상태 (기본값: 열림)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(true);

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* 1. 고정 사이드바 */}
            <aside className="w-64 bg-slate-800 text-slate-100 flex flex-col shrink-0">
                <div className="p-6 text-2xl font-bold text-yellow-500 border-b border-slate-700">
                    Admin Panel
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/admin"
                        className="block p-3 rounded hover:bg-slate-700 transition"
                    >
                        📊 대시보드
                    </Link>

                    {/* --- 회원 관리 메뉴 (아코디언) --- */}
                    <div>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="w-full flex items-center justify-between p-3 rounded hover:bg-slate-700 transition group"
                        >
                            <div className="flex items-center">
                                <span className="mr-2">👥</span>
                                <span>회원 관리</span>
                            </div>
                            {/* 화살표 아이콘 */}
                            <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
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

                        {/* 서브 메뉴 영역 */}
                        {isUserMenuOpen && (
                            <div className="mt-1 ml-4 space-y-1 border-l border-slate-700">
                                <Link
                                    href="/admin/users"
                                    className="block p-2 pl-6 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                                >
                                    • 회원 리스트
                                </Link>
                                {/* 추가 서브 메뉴가 필요하면 여기에 작성 */}
                            </div>
                        )}
                    </div>
                    {/* --------------------------- */}

                    <Link
                        href="/admin/settings"
                        className="block p-3 rounded hover:bg-slate-700 transition"
                    >
                        ⚙️ 시스템 설정
                    </Link>
                </nav>
                <div className="p-4 border-t border-slate-700 text-sm text-slate-400">
                    v1.0.0
                </div>
            </aside>

            {/* 2. 본문 영역 */}
            <div className="flex-1 flex flex-col">
                {/* 상단 헤더 */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8">
                    <div className="font-medium text-slate-600">
                        시스템 관리 모드
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-slate-700">
                            {auth.admin?.name}님
                        </span>
                        <Link
                            href="/admin/logout"
                            method="post"
                            as="button"
                            className="text-xs text-red-500 hover:underline"
                        >
                            로그아웃
                        </Link>
                    </div>
                </header>

                {/* 실제 페이지 내용이 들어오는 곳 */}
                <main className="p-8 flex-1">{children}</main>
            </div>
        </div>
    );
}
