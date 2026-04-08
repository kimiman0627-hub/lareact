import React from "react";

export default function Footer({ theme = "dark" }) {
    const dark = theme === "dark";

    return (
        <footer className={`mt-auto text-sm ${dark ? "bg-[#0d1b2a] text-slate-500" : "bg-gray-100 text-slate-400 border-t border-gray-200"}`}>
            <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="font-bold">
                    <span className={dark ? "text-slate-300" : "text-slate-600"}>COMM</span>
                    <span className="text-sky-500">GATE</span>
                </span>
                <span>© {new Date().getFullYear()} CommGate. All rights reserved.</span>
            </div>
        </footer>
    );
}
