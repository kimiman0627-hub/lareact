import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import Pagination from "@/Admin/Components/Common/Pagination";

function formatDate(str) {
    if (!str) return "-";
    return str.replace("T", " ").slice(0, 16);
}

export default function ScrapList({ list, total, params, categories }) {
    const { auth } = usePage().props;

    const [form, setForm] = useState({
        keyword:  params?.keyword  ?? "",
        category: params?.category ?? "",
    });

    function handleSearch(e) {
        e.preventDefault();
        router.get("/admin/scraps", { ...form, page: 1 }, { preserveState: true, replace: true });
    }

    function resetSearch() {
        setForm({ keyword: "", category: "" });
        router.get("/admin/scraps", {}, { preserveState: true, replace: true });
    }

    const items = list?.data ?? [];

    return (
        <AdminLayout user={auth?.admin}>
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        스크랩 내역
                        <span className="ml-2 text-sm font-normal text-slate-400">총 {total}건</span>
                    </h1>
                </div>

                {/* 검색 */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">게시판</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                            >
                                <option value="">전체</option>
                                {Object.entries(categories ?? {}).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">검색 (제목 / 회원명 / 이메일)</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form.keyword}
                                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-10">#</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-24">게시판</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">게시글</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-40">회원</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 w-36">스크랩 일시</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                                            스크랩 내역이 없습니다.
                                        </td>
                                    </tr>
                                )}
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition whitespace-nowrap">
                                        <td className="px-4 py-3 text-xs text-gray-400">{item.id}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2 py-0.5 rounded border text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200">
                                                {item.board_name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <a
                                                href={`/post/${item.post_id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-slate-700 hover:text-blue-500 transition truncate block"
                                            >
                                                {item.post_title}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800 text-xs">{item.user_name}</p>
                                            <p className="text-gray-400 text-xs">{item.user_email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400">
                                            {formatDate(item.scrapped_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination links={list?.links ?? []} />
                </div>
            </div>
        </AdminLayout>
    );
}
