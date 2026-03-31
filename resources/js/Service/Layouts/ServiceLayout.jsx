import React from "react";
import { Link, usePage } from "@inertiajs/react";

export default function ServiceLayout({ children }) {
    // 라라벨에서 넘겨주는 공유 데이터(auth)를 가져옵니다.
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <nav className="bg-white shadow-sm p-4 flex justify-between px-10 items-center">
                <Link
                    href="/"
                    className="font-extrabold text-2xl text-blue-600 tracking-tight"
                >
                    LAREACT
                </Link>

                <div className="flex gap-6 items-center font-medium">
                    <Link href="/" className="hover:text-blue-600 transition">
                        홈
                    </Link>

                    {/* auth?.user 처럼 물음표(Optional Chaining)를 붙여주면 안전합니다 */}
                    {auth?.user ? (
                        <div className="flex items-center gap-4">
                            <span className="pr-4">{auth.user.name}님</span>
                            <Link href="/logout" method="post" as="button">
                                로그아웃
                            </Link>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <Link href="/login">로그인</Link>
                            <Link href="/register">회원가입</Link>
                        </div>
                    )}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-10">{children}</main>
        </div>
    );
}
