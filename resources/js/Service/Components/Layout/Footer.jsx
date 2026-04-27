import React from "react";
import { Link } from "@inertiajs/react";

export default function Footer({ theme = "dark" }) {
    const dark = theme === "dark";

    return (
        <footer className={`mt-auto text-sm ${dark ? "bg-[#0d1b2a] text-slate-500" : "bg-gray-100 text-slate-400 border-t border-gray-200"}`}>
            <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="font-bold">
                    <span className="text-sky-500">KR</span>
                    <span className={dark ? "text-slate-300" : "text-slate-600"}>LIVED</span>
                </span>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                    <Link href="/about" className="hover:text-sky-400 transition whitespace-nowrap">서비스 소개</Link>
                    <Link href="/privacy" className="hover:text-sky-400 transition whitespace-nowrap">개인정보처리방침</Link>
                    <Link href="/terms" className="hover:text-sky-400 transition whitespace-nowrap">이용약관</Link>
                    <Link href="/inquiry?type=SUPPORT" className="hover:text-sky-400 transition whitespace-nowrap">1:1 문의</Link>
                    <Link href="/inquiry?type=PARTNERSHIP" className="hover:text-sky-400 transition whitespace-nowrap">제휴 문의</Link>
                    <span className="whitespace-nowrap">© {new Date().getFullYear()} KRLived</span>
                </div>
            </div>
        </footer>
    );
}
