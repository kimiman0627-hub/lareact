import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import Pagination from "@/Admin/Components/Common/Pagination";
import { ajax } from "@/Utils/network";
import CommentCreateModal from "@/Admin/Components/Comments/CommentCreateModal";

/** 날짜 포맷 */
const fmt = (d) =>
    d
        ? new Date(d).toLocaleDateString("ko-KR", {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";

/** 댓글 수정 모달 */
function EditModal({ comment, onClose }) {
    const [content, setContent] = useState(comment.content);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    function submit(e) {
        e.preventDefault();
        setLoading(true);
        ajax.put(route("admin.comments.update", comment.comment_id), {
            content,
        })
            .then(() => {
                onClose(true);
            })
            .catch(() => {
                setError("수정 중 오류가 발생했습니다.");
            })
            .finally(() => setLoading(false));
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-slate-800">
                        댓글 수정
                    </h3>
                    <button
                        onClick={() => onClose(false)}
                        className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>
                <form onSubmit={submit} className="px-6 py-5 space-y-4">
                    <div className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                        게시글:{" "}
                        <span className="text-slate-600 font-medium">
                            {comment.post_title}
                        </span>
                        <span className="ml-2 text-slate-300">·</span>
                        <span className="ml-2">작성자: {comment.author}</span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                            댓글 내용
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                        />
                        {error && (
                            <p className="text-xs text-red-500 mt-1">{error}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-slate-600 hover:bg-gray-50 transition"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition"
                        >
                            {loading ? "저장 중..." : "저장"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CommentList({ list, total, params }) {
    const [searchForm, setSearchForm] = useState({
        keyword: params?.keyword ?? "",
        post_id: params?.post_id ?? "",
    });
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    const comments = list.data ?? [];

    function search(e) {
        e.preventDefault();
        router.get(route("admin.comments.index"), searchForm, {
            preserveScroll: true,
        });
    }

    function reset() {
        const empty = { keyword: "", post_id: "" };
        setSearchForm(empty);
        router.get(route("admin.comments.index"), {}, { preserveScroll: true });
    }

    function handleDelete(id) {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        ajax.delete(route("admin.comments.destroy", id)).then(() =>
            router.reload({ preserveScroll: true }),
        );
    }

    function handleModalClose(refresh) {
        setCreateOpen(false);
        setEditTarget(null);
        if (refresh) router.reload({ preserveScroll: true });
    }

    return (
        <AdminLayout>
            {createOpen && <CommentCreateModal onClose={handleModalClose} />}
            {editTarget && (
                <EditModal comment={editTarget} onClose={handleModalClose} />
            )}

            <div className="space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-800">
                        댓글 목록
                    </h1>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition"
                    >
                        <i className="fa-solid fa-plus" /> 댓글 작성
                    </button>
                </div>

                {/* 검색 폼 */}
                <form
                    onSubmit={search}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[160px]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                게시글 ID
                            </label>
                            <input
                                type="number"
                                value={searchForm.post_id}
                                onChange={(e) =>
                                    setSearchForm((f) => ({
                                        ...f,
                                        post_id: e.target.value,
                                    }))
                                }
                                placeholder="게시글 ID"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div className="flex-[2] min-w-[220px]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                내용 검색
                            </label>
                            <input
                                type="text"
                                value={searchForm.keyword}
                                onChange={(e) =>
                                    setSearchForm((f) => ({
                                        ...f,
                                        keyword: e.target.value,
                                    }))
                                }
                                placeholder="댓글 내용으로 검색"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition"
                            >
                                검색
                            </button>
                            <button
                                type="button"
                                onClick={reset}
                                className="px-4 py-2 border border-gray-200 text-sm text-slate-600 rounded-lg hover:bg-gray-50 transition"
                            >
                                초기화
                            </button>
                        </div>
                    </div>
                </form>

                {/* 테이블 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            전체{" "}
                            <span className="font-semibold text-slate-700">
                                {total}
                            </span>
                            건
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table
                            className="text-left"
                            style={{ minWidth: "900px", width: "100%" }}
                        >
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-16">
                                        ID
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-65">
                                        게시글
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-60">
                                        작성자
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                                        내용
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20 text-center">
                                        깊이
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-40">
                                        작성일
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-35 text-right">
                                        관리
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {comments.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-sm text-slate-400"
                                        >
                                            댓글이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    comments.map((c) => (
                                        <tr
                                            key={c.comment_id}
                                            className="hover:bg-gray-50 transition"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                {c.comment_id}
                                            </td>
                                            <td className="px-4 py-3">
                                                <a
                                                    href={`/post/${c.post_id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-blue-500 hover:underline line-clamp-1"
                                                >
                                                    [{c.post_id}] {c.post_title}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {c.author}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700 max-w-xs">
                                                <p className="line-clamp-2 whitespace-pre-wrap">
                                                    {c.content}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${c.depth > 1 ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}
                                                >
                                                    {c.depth}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-400">
                                                {fmt(c.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            setEditTarget(c)
                                                        }
                                                        className="px-2.5 py-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                c.comment_id,
                                                            )
                                                        }
                                                        className="px-2.5 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-100 transition"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이지네이션 */}
                    {list.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-gray-100">
                            <Pagination
                                currentPage={list.current_page}
                                lastPage={list.last_page}
                                onPageChange={(page) =>
                                    router.get(
                                        route("admin.comments.index"),
                                        { ...searchForm, page },
                                        { preserveScroll: true },
                                    )
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
