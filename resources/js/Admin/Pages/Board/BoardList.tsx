import { route } from "ziggy-js";
import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import { http } from "@/Utils/http";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import Pagination from "@/Admin/Components/Common/Pagination";
import BoardModal from "@/Admin/Components/Boards/BoardModal";

const LAYOUT_BADGE: Record<string, string> = {
    GENERAL: "bg-slate-100 text-slate-600",
    GALLERY: "bg-purple-100 text-purple-700",
    PHOTO:   "bg-pink-100 text-pink-700",
    SIMPLE:  "bg-yellow-100 text-yellow-700",
};

interface SearchForm {
    [key: string]: unknown;
    keyword: string;
    board_status: string;
    board_type: string;
}

interface BoardListProps {
    list: any;
    total: number;
    params?: any;
    boardTypes: Record<string, string>;
    boardLayouts: Record<string, string>;
    boardStatuses: Record<string, string>;
    boardOptions: any;
}

export default function BoardList({
    list,
    total,
    params,
    boardTypes,
    boardLayouts,
    boardStatuses,
    boardOptions,
}: BoardListProps) {
    const { auth } = usePage<any>().props;

    const [searchForm, setSearchForm] = useState<SearchForm>({
        keyword:      params?.keyword      || "",
        board_status: params?.board_status || "",
        board_type:   params?.board_type   || "",
    });

    const [isModalOpen, setIsModalOpen]     = useState<boolean>(false);
    const [selectedBoard, setSelectedBoard] = useState<any>(null);

    const openCreate = () => {
        setSelectedBoard(null);
        setIsModalOpen(true);
    };

    const openEdit = (board: any) => {
        setSelectedBoard(board);
        setIsModalOpen(true);
    };

    const handleSubmit = (data: any) => {
        if (data.board_id) {
            http.put(route("admin.boards.update", data.board_id), data, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            http.post(route("admin.boards.store"), data, {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        http.delete(`/admin/boards/${id}`, {
            confirmMsg: "게시판을 삭제하시겠습니까?\n삭제 시 관련 설정이 모두 제거됩니다.",
            onSuccess: () => {
                http.get("/admin/boards", {}, { preserveState: true, replace: true });
            },
        });
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        http.get("/admin/boards", searchForm, { preserveState: true, replace: true });
    };

    const resetSearch = () => {
        setSearchForm({ keyword: "", board_status: "", board_type: "" });
        http.get("/admin/boards", {}, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout>
            <div className="space-y-4">
                <BoardModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSubmit}
                    selectedBoard={selectedBoard}
                    boardTypes={boardTypes}
                    boardLayouts={boardLayouts}
                    boardStatuses={boardStatuses}
                    boardOptions={boardOptions}
                />

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        게시판 설정
                        <span className="ml-2 text-sm font-normal text-slate-400">
                            총 {total}개
                        </span>
                    </h1>
                    <button
                        onClick={openCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                        게시판 등록
                    </button>
                </div>

                {/* 검색 영역 */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <form
                        onSubmit={handleSearch}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4"
                    >
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                게시판명
                            </label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.keyword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setSearchForm({
                                        ...searchForm,
                                        keyword: e.target.value,
                                    })
                                }
                                placeholder="게시판명 검색"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                구분
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.board_type}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setSearchForm({
                                        ...searchForm,
                                        board_type: e.target.value,
                                    })
                                }
                            >
                                <option value="">전체</option>
                                {Object.entries(boardTypes).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                상태
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.board_status}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setSearchForm({
                                        ...searchForm,
                                        board_status: e.target.value,
                                    })
                                }
                            >
                                <option value="">전체</option>
                                {Object.entries(boardStatuses).map(([k, v]) => (
                                    <option key={k} value={k}>
                                        {v}
                                    </option>
                                ))}
                            </select>
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
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600 w-12">
                                    순서
                                </th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                                    게시판명
                                </th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                                    카테고리
                                </th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                                    구분
                                </th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                                    타입
                                </th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                                    상태
                                </th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                                    주요 설정
                                </th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600 text-right">
                                    관리
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {list.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-12 text-center text-sm text-gray-400"
                                    >
                                        등록된 게시판이 없습니다.
                                    </td>
                                </tr>
                            )}
                            {list.data.map((board: any) => {
                                const opts = board.options ?? {};
                                return (
                                    <tr
                                        key={board.board_id}
                                        className="hover:bg-gray-50 transition"
                                    >
                                        <td className="px-4 py-4 text-sm text-gray-500 text-center">
                                            {board.board_order}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                            {board.board_name}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                                            {board.category}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {boardTypes[board.board_type] ??
                                                board.board_type}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${LAYOUT_BADGE[board.board_layout] ?? "bg-gray-100 text-gray-600"}`}
                                            >
                                                {boardLayouts[
                                                    board.board_layout
                                                ] ?? board.board_layout}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${board.board_status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                                            >
                                                {boardStatuses[
                                                    board.board_status
                                                ] ?? board.board_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-gray-500 space-x-1">
                                            {(opts.show_on_main ?? true) && (
                                                <span className="inline-block bg-green-50 text-green-700 rounded px-1.5 py-0.5">
                                                    메인노출
                                                </span>
                                            )}
                                            {opts.comment_enabled && (
                                                <span className="inline-block bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">
                                                    댓글
                                                </span>
                                            )}
                                            {opts.file_upload && (
                                                <span className="inline-block bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                                                    파일
                                                </span>
                                            )}
                                            {opts.point_enabled && (
                                                <span className="inline-block bg-yellow-50 text-yellow-700 rounded px-1.5 py-0.5">
                                                    포인트 {opts.point_amount}p
                                                </span>
                                            )}
                                            {opts.use_like && (
                                                <span className="inline-block bg-pink-50 text-pink-600 rounded px-1.5 py-0.5">
                                                    좋아요
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-right space-x-3">
                                            <button
                                                onClick={() => openEdit(board)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(board.board_id)
                                                }
                                                className="text-red-600 hover:underline"
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="mt-8">
                        <Pagination links={list.links} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
