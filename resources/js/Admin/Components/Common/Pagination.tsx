import React from "react";
import { Link } from "@inertiajs/react";

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links?: PaginationLink[];
    currentPage?: number;
    lastPage?: number;
    onPageChange?: (page: number) => void;
}

export default function Pagination({ links, currentPage, lastPage, onPageChange }: PaginationProps) {
    // curPage/lastPage/onPageChange 방식
    if (onPageChange && currentPage !== undefined && lastPage !== undefined) {
        if (lastPage <= 1) return null;
        const pages = Array.from({ length: lastPage }, (_, i) => i + 1)
            .filter(p => Math.abs(p - currentPage) <= 4);
        return (
            <div className="flex flex-wrap justify-center mt-6 gap-1">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                    className="px-4 py-2 text-sm text-gray-400 border border-gray-200 rounded-lg bg-gray-50 disabled:opacity-30">
                    &laquo;
                </button>
                {pages.map(p => (
                    <button key={p} onClick={() => onPageChange(p)}
                        className={`px-4 py-2 text-sm border rounded-lg transition ${p === currentPage ? "bg-blue-600 text-white border-blue-600 font-bold" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                        {p}
                    </button>
                ))}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === lastPage}
                    className="px-4 py-2 text-sm text-gray-400 border border-gray-200 rounded-lg bg-gray-50 disabled:opacity-30">
                    &raquo;
                </button>
            </div>
        );
    }

    // links 방식 (Inertia 페이지네이션)
    if (!links || links.length <= 3) return null;

    return (
        <div className="flex flex-wrap justify-center mt-6 gap-1">
            {links.map((link, key) =>
                link.url === null ? (
                    <div key={key}
                        className="px-4 py-2 text-sm text-gray-400 border border-gray-200 rounded-lg bg-gray-50"
                        dangerouslySetInnerHTML={{ __html: link.label }} />
                ) : (
                    <Link key={key} href={link.url}
                        className={`px-4 py-2 text-sm border rounded-lg transition duration-150 ${link.active ? "bg-blue-600 text-white border-blue-600 font-bold" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                        preserveState
                        dangerouslySetInnerHTML={{ __html: link.label }} />
                ),
            )}
        </div>
    );
}
