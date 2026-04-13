import React from "react";
import { Link } from "@inertiajs/react";

export default function Footer({ theme = "dark" }) {
    const dark = theme === "dark";

    return (
        <footer className={`mt-auto text-sm ${dark ? "bg-[#0d1b2a] text-slate-500" : "bg-gray-100 text-slate-400 border-t border-gray-200"}`}>
            <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="font-bold">
                    <span className="text-sky-500">KR</span>
                    <span className={dark ? "text-slate-300" : "text-slate-600"}>LIVED</span>
                </span>
                <div className="flex items-center gap-4">
                    <Link href="/inquiry?type=SUPPORT" className="hover:text-sky-400 transition">1:1 문의</Link>
                    <Link href="/inquiry?type=PARTNERSHIP" className="hover:text-sky-400 transition">제휴 문의</Link>
                    <span>© {new Date().getFullYear()} KRLived. All rights reserved.</span>
                </div>
            </div>
        </footer>
    );
}
