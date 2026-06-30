import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import Pagination from "@/Admin/Components/Common/Pagination";
import { ajax } from "@/Utils/network";

const fmt = (d: string | null | undefined): string =>
    d ? new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }) : "";

interface AttendanceItem {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    attended_date: string;
    consecutive_days: number;
    created_at: string;
}

interface AttendanceListProps {
    list: { data: AttendanceItem[]; current_page: number; last_page: number; total: number };
    total: number;
    params: Record<string, string>;
}

export default function AttendanceList({ list, total, params }: AttendanceListProps) {
    const { flash } = usePage<any>().props;
    const items    = list.data ?? [];
    const curPage  = list.current_page ?? 1;
    const lastPage = list.last_page ?? 1;

    const [filter, setFilter] = useState({
        keyword:    params?.keyword    ?? "",
        start_date: params?.start_date ?? "",
        end_date:   params?.end_date   ?? "",
    });

    // 수동 출석 추가 폼
    const [addForm, setAddForm] = useState({ user_id: "", user_keyword: "", date: "" });
    const [userResults, setUserResults] = useState<{ id: number; name: string; email: string }[]>([]);
    const [searchingUser, setSearchingUser] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [addLoading, setAddLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

    const inputCls = "rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none";

    function search(e: React.FormEvent) {
        e.preventDefault();
        router.get("/admin/attendances", { ...filter, page: 1 }, { preserveScroll: true });
    }

    function reset() {
        setFilter({ keyword: "", start_date: "", end_date: "" });
        router.get("/admin/attendances", { page: 1 });
    }

    function goPage(page: number) {
        router.get("/admin/attendances", { ...params, page }, { preserveScroll: true });
    }

    async function searchUser() {
        if (!addForm.user_keyword.trim()) return;
        setSearchingUser(true);
        try {
            const res = await ajax.get("/admin/users/search", { keyword: addForm.user_keyword }) as any;
            setUserResults(res?.users ?? []);
        } catch {
            setUserResults([]);
        } finally {
            setSearchingUser(false);
        }
    }

    function selectUser(u: { id: number; name: string; email: string }) {
        setAddForm((f) => ({ ...f, user_id: String(u.id), user_keyword: `${u.name} (${u.email})` }));
        setUserResults([]);
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setAddError(null);
        if (!addForm.user_id) { setAddError("유저를 선택해주세요."); return; }
        if (!addForm.date)    { setAddError("날짜를 입력해주세요."); return; }
        setAddLoading(true);
        try {
            await ajax.post("/admin/attendances", { user_id: addForm.user_id, date: addForm.date });
            setAddForm({ user_id: "", user_keyword: "", date: "" });
            router.reload({ preserveUrl: true });
        } catch (err: any) {
            setAddError(err?.response?.data?.errors?.date?.[0] ?? "오류가 발생했습니다.");
        } finally {
            setAddLoading(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("이 출석 기록을 삭제하시겠습니까?\n이후 연속일이 재계산됩니다.")) return;
        setDeleteLoading(id);
        try {
            await ajax.delete(`/admin/attendances/${id}`);
            router.reload({ preserveUrl: true });
        } catch {
            alert("삭제 중 오류가 발생했습니다.");
        } finally {
            setDeleteLoading(null);
        }
    }

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">출석 내역</h1>
                        <p className="text-sm text-slate-400 mt-0.5">전체 {total.toLocaleString()}건</p>
                    </div>
                </div>

                {flash?.success && (
                    <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                        {flash.success}
                    </div>
                )}

                {/* 수동 출석 추가 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <h2 className="text-sm font-bold text-slate-700 mb-3">출석 수동 추가</h2>
                    <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
                        <div className="space-y-1 relative">
                            <label className="text-xs font-medium text-slate-500">유저 검색</label>
                            <div className="flex gap-1">
                                <input
                                    type="text"
                                    placeholder="이름 또는 이메일"
                                    value={addForm.user_keyword}
                                    onChange={(e) => {
                                        setAddForm((f) => ({ ...f, user_keyword: e.target.value, user_id: "" }));
                                        setUserResults([]);
                                    }}
                                    className={inputCls + " w-44"}
                                />
                                <button type="button" onClick={searchUser} disabled={searchingUser}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-lg transition">
                                    {searchingUser ? "..." : "검색"}
                                </button>
                            </div>
                            {userResults.length > 0 && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {userResults.map((u) => (
                                        <button key={u.id} type="button"
                                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0"
                                            onClick={() => selectUser(u)}>
                                            <p className="font-medium text-slate-700">{u.name}</p>
                                            <p className="text-xs text-slate-400">{u.email}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">날짜</label>
                            <input
                                type="date"
                                value={addForm.date}
                                onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                                className={inputCls}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            {addError && <p className="text-xs text-red-500">{addError}</p>}
                            <button type="submit" disabled={addLoading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition">
                                {addLoading ? "추가 중..." : "출석 추가"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 검색 필터 */}
                <form onSubmit={search} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">유저 검색</label>
                            <input
                                type="text"
                                placeholder="이름 또는 이메일"
                                value={filter.keyword}
                                onChange={(e) => setFilter((f) => ({ ...f, keyword: e.target.value }))}
                                className={inputCls + " w-44"}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">시작일</label>
                            <input type="date" value={filter.start_date}
                                onChange={(e) => setFilter((f) => ({ ...f, start_date: e.target.value }))}
                                className={inputCls} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">종료일</label>
                            <input type="date" value={filter.end_date}
                                onChange={(e) => setFilter((f) => ({ ...f, end_date: e.target.value }))}
                                className={inputCls} />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
                                검색
                            </button>
                            <button type="button" onClick={reset}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-lg transition">
                                초기화
                            </button>
                        </div>
                    </div>
                </form>

                {/* 테이블 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-10">#</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">유저</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">출석일</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">연속일</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">등록일시</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-16 text-sm text-slate-400">
                                            출석 내역이 없습니다.
                                        </td>
                                    </tr>
                                ) : items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 text-xs text-slate-400">{item.id}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-slate-700">{item.user_name}</p>
                                            <p className="text-xs text-slate-400">{item.user_email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                                            {item.attended_date}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                                                {item.consecutive_days}일
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                                            {fmt(item.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deleteLoading === item.id}
                                                className="text-xs text-red-400 hover:text-red-600 font-medium transition disabled:opacity-40"
                                            >
                                                {deleteLoading === item.id ? "삭제 중..." : "삭제"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-gray-100">
                        <Pagination currentPage={curPage} lastPage={lastPage} onPageChange={goPage} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
