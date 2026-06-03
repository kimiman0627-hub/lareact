import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import Pagination from "@/Admin/Components/Common/Pagination";

const fmt = (d: string | null | undefined): string =>
    d
        ? new Date(d).toLocaleDateString("ko-KR", {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
    LIKE:    { label: "좋아요", cls: "bg-blue-50 text-blue-600 border border-blue-200" },
    DISLIKE: { label: "싫어요", cls: "bg-rose-50 text-rose-600 border border-rose-200" },
};

interface SearchForm {
    [key: string]: unknown;
    type: string;
    keyword: string;
    category: string;
}

interface LikeListProps {
    list: any;
    total: number;
    params?: any;
    categories: Record<string, string>;
}

export default function LikeList({ list, total, params, categories }: LikeListProps) {
    const { auth } = usePage<any>().props;

    const [searchForm, setSearchForm] = useState<SearchForm>({
        type:     params?.type     || "",
        keyword:  params?.keyword  || "",
        category: params?.category || "",
    });

    function handleSearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        router.get("/admin/likes", searchForm as any, { preserveState: true, replace: true });
    }

    function resetSearch() {
        setSearchForm({ type: "", keyword: "", category: "" });
        router.get("/admin/likes", {}, { preserveState: true, replace: true });
    }

    const items = list?.data ?? [];

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        좋아요 / 싫어요 내역
                        <span className="ml-2 text-sm font-normal text-slate-400">
                            총 {total}건
                        </span>
                    </h1>
                </div>

                {/* 검색 */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">종류</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.type}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSearchForm({ ...searchForm, type: e.target.value })}
                            >
                                <option value="">전체</option>
                                <option value="LIKE">좋아요</option>
                                <option value="DISLIKE">싫어요</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">게시판</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.category}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSearchForm({ ...searchForm, category: e.target.value })}
                            >
                                <option value="">전체</option>
                                {Object.entries(categories).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">검색 (제목 / 회원명 / 이메일)</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.keyword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchForm({ ...searchForm, keyword: e.target.value })}
                                placeholder="검색어 입력"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-blue-700 transition"
                            >
                                검색
                            </button>
                            <button
                                type="button"
                                onClick={resetSearch}
                                className="flex-1 bg-white border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-bold hover:bg-gray-50 transition"
                            >
                                초기화
                            </button>
                        </div>
                    </form>
                </div>

                {/* 테이블 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600 w-20">종류</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">게시판</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">게시글</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">
                                    <span className="flex items-center gap-1">
                                        👍 <span className="text-blue-500">좋아요</span>
                                        &nbsp;/&nbsp;
                                        👎 <span className="text-rose-500">싫어요</span>
                                    </span>
                                </th>
                                <th className="px-4 py-3 font-semibold text-gray-600">회원</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">일시</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                                        내역이 없습니다.
                                    </td>
                                </tr>
                            )}
                            {items.map((item: any) => {
                                const badge = TYPE_BADGE[item.type] ?? { label: item.type, cls: "bg-gray-100 text-gray-600" };
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                                                {item.type === 'LIKE' ? '👍' : '👎'} {badge.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {item.board_name}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <a
                                                href={`/post/${item.post_id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline truncate block"
                                            >
                                                {item.post_title}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            <span className="text-blue-500 font-semibold">{item.like_count}</span>
                                            <span className="text-gray-300 mx-1">/</span>
                                            <span className="text-rose-500 font-semibold">{item.dislike_count}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800 text-xs">{item.user_name}</p>
                                            <p className="text-gray-400 text-xs">{item.user_email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                                            {fmt(item.created_at)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="mt-4">
                        <Pagination links={list.links} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
