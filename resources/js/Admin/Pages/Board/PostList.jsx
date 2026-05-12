import React, { useState, useRef, useCallback } from "react";
import { http } from "@/Utils/http";
import { ajax } from "@/Utils/network";
import { useForm, usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import Pagination from "@/Admin/Components/Common/Pagination";
import PostCreateModal from "@/Admin/Components/Posts/PostCreateModal";
import PostPreviewModal from "@/Admin/Components/Posts/PostPreviewModal";

const fmt = (d) =>
    d
        ? new Date(d).toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
          })
        : "";

export default function PostIndex({
    list,
    total,
    params,
    postTypes,
    postStatuses,
    postCategories,
    postSources,
    banners,
    bannerPositions,
}) {
    const { auth } = usePage().props;

    const [startDate, setStartDate] = useState(
        params?.start_date ? new Date(params.start_date) : null,
    );
    const [endDate, setEndDate] = useState(
        params?.end_date ? new Date(params.end_date) : null,
    );

    const [searchForm, setSearchForm] = useState({
        id:            params?.id            || "",
        name:          params?.name          || "",
        email:         params?.email         || "",
        keyword:       params?.keyword       || "",
        search_type:   params?.search_type   || "title",
        post_status:   params?.post_status   || "",
        post_category: params?.post_category || "",
        source:        params?.source        || "",
    });

    /* 체크박스 선택 */
    const [selectedIds, setSelectedIds] = useState(new Set());
    const allIds = list.data.map((p) => p.post_id);
    const allChecked = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
    const someChecked = !allChecked && allIds.some((id) => selectedIds.has(id));
    const checkboxRef = useRef(null);

    // indeterminate 처리
    React.useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = someChecked;
        }
    }, [someChecked]);

    const toggleAll = () => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allChecked) {
                allIds.forEach((id) => next.delete(id));
            } else {
                allIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    const toggleOne = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen]     = useState(false);
    const [previewPost, setPreviewPost]         = useState(null);

    // Blogger 발행 상태: { [post_id]: 'loading' | 'done' | 'error' }
    const [bloggerStatus, setBloggerStatus] = useState({});

    const publishToBlogger = useCallback(async (post) => {
        setBloggerStatus((prev) => ({ ...prev, [post.post_id]: "loading" }));
        try {
            const res = await fetch("/admin/blogger/publish-post", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
                },
                body: JSON.stringify({ post_id: post.post_id }),
            });
            const json = await res.json();
            if (json.success) {
                setBloggerStatus((prev) => ({ ...prev, [post.post_id]: "done" }));
                router.reload({ only: ["list"] });
            } else {
                alert("발행 실패: " + (json.output || "알 수 없는 오류"));
                setBloggerStatus((prev) => ({ ...prev, [post.post_id]: "error" }));
            }
        } catch {
            alert("발행 요청 중 오류가 발생했습니다.");
            setBloggerStatus((prev) => ({ ...prev, [post.post_id]: "error" }));
        }
    }, []);

    const openPreview = async (post) => {
        try {
            const res = await ajax.get(`/admin/posts/${post.post_id}`);
            setPreviewPost(res ?? post);
        } catch {
            setPreviewPost(post);
        }
        setIsPreviewOpen(true);
    };

    const { data, setData, reset } = useForm({
        id: null,
        title: "",
        content: "",
        post_status: "NORMAL",
        post_type: "NORMAL",
        post_category: "",
        is_notice: false,
        banner_ids: [],
    });

    const openCreatePostModal = () => {
        reset();
        setIsPostModalOpen(true);
    };

    const openPostEditModal = async (item) => {
        try {
            const res = await ajax.get(`/admin/posts/${item.post_id}`);
            const full = res ?? item;
            setData({
                id:            full.post_id,
                title:         full.title,
                content:       full.content ?? "",
                post_status:   full.post_status,
                post_type:     full.post_type,
                post_category: full.post_category,
                is_notice:     full.is_notice === true,
                user_id:       full.user_id,
                created_at:    full.created_at,
                email:         full.email,
                name:          full.name,
                banner_ids:    full.banner_ids ?? [],
                hits:          full.hits ?? 0,
                like_count:    full.like_count ?? 0,
                dislike_count: full.dislike_count ?? 0,
                comment_count: full.comment_count ?? 0,
                scrap_count:   full.scrap_count ?? 0,
            });
        } catch {
            setData({
                id:            item.post_id,
                title:         item.title,
                content:       "",
                post_status:   item.post_status,
                post_type:     item.post_type,
                post_category: item.post_category,
                is_notice:     item.is_notice === true,
                user_id:       item.user_id,
                created_at:    item.created_at,
                email:         item.email,
                name:          item.name,
                banner_ids:    item.banner_ids ?? [],
                hits:          item.hits ?? 0,
                like_count:    item.like_count ?? 0,
                dislike_count: item.dislike_count ?? 0,
                comment_count: item.comment_count ?? 0,
                scrap_count:   item.scrap_count ?? 0,
            });
        }
        setIsPostModalOpen(true);
    };

    const handleSubmit = (data) => {
        data.is_notice = !!data.is_notice;
        if (data.id) {
            http.put(route("admin.posts.update", data.id), data, {
                onSuccess: () => setIsPostModalOpen(false),
            });
        } else {
            http.post(route("admin.posts.store"), data, {
                onSuccess: () => setIsPostModalOpen(false),
            });
        }
    };

    const deletePost = (id) => {
        const savedSearch = window.location.search;
        http.delete(`/admin/posts/${id}`, {
            confirmMsg: "게시물을 삭제하시겠습니까?",
            onSuccess: () => {
                setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
                router.visit("/admin/posts" + savedSearch, { preserveScroll: true, replace: true });
            },
        });
    };

    const deleteBulk = () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`선택한 ${selectedIds.size}개 게시물을 삭제하시겠습니까?`)) return;
        const savedSearch = window.location.search;
        router.visit("/admin/posts/bulk", {
            method: "delete",
            data: { ids: [...selectedIds] },
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds(new Set());
                router.visit("/admin/posts" + savedSearch, { preserveScroll: true, replace: true });
            },
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const searchData = {
            ...searchForm,
            start_date: startDate ? format(startDate, "yyyy-MM-dd") : "",
            end_date:   endDate   ? format(endDate,   "yyyy-MM-dd") : "",
        };
        http.get("/admin/posts", searchData, { preserveState: true, replace: true });
    };

    const resetSearch = () => {
        setSearchForm({
            id: "", name: "", email: "", keyword: "",
            search_type: "title", post_status: "", post_category: "", source: "",
        });
        setStartDate(null);
        setEndDate(null);
        http.get("/admin/posts", {}, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout user={auth?.user}>
            <div className="space-y-4">
                <PostPreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    post={previewPost}
                    postStatuses={postStatuses}
                    postCategories={postCategories}
                />
                <PostCreateModal
                    isOpen={isPostModalOpen}
                    onClose={() => setIsPostModalOpen(false)}
                    selectedPost={data.id ? data : null}
                    postTypes={postTypes}
                    postStatuses={postStatuses}
                    postCategories={postCategories}
                    banners={banners}
                    bannerPositions={bannerPositions}
                    onSubmit={handleSubmit}
                />

                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-800">게시물 관리</h1>
                    <button
                        onClick={openCreatePostModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition"
                    >
                        <i className="fa-solid fa-plus" /> 신규 게시물 등록
                    </button>
                </div>

                {/* 검색 폼 */}
                <form
                    onSubmit={handleSearch}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3"
                >
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">카테고리</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={searchForm.post_category}
                                onChange={(e) => setSearchForm({ ...searchForm, post_category: e.target.value })}
                            >
                                <option value="">전체</option>
                                {Object.entries(postCategories).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">소스</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={searchForm.source}
                                onChange={(e) => setSearchForm({ ...searchForm, source: e.target.value })}
                            >
                                <option value="">전체</option>
                                <option value="DIRECT">직접 작성</option>
                                {Object.entries(postSources).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">상태</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={searchForm.post_status}
                                onChange={(e) => setSearchForm({ ...searchForm, post_status: e.target.value })}
                            >
                                <option value="">전체</option>
                                {Object.entries(postStatuses).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">작성자</label>
                            <input
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={searchForm.name}
                                onChange={(e) => setSearchForm({ ...searchForm, name: e.target.value })}
                                placeholder="닉네임"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">ID</label>
                            <input
                                type="number"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={searchForm.id}
                                onChange={(e) => setSearchForm({ ...searchForm, id: e.target.value })}
                                placeholder="게시글 ID"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex gap-2">
                            <select
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={searchForm.search_type}
                                onChange={(e) => setSearchForm({ ...searchForm, search_type: e.target.value })}
                            >
                                <option value="title">제목</option>
                                <option value="content">내용</option>
                                <option value="all">제목+내용</option>
                            </select>
                            <input
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                value={searchForm.keyword}
                                onChange={(e) => setSearchForm({ ...searchForm, keyword: e.target.value })}
                                placeholder="검색어 입력"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                locale={ko}
                                dateFormat="yyyy-MM-dd"
                                placeholderText="시작일"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <span className="text-gray-400 shrink-0">~</span>
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate}
                                locale={ko}
                                dateFormat="yyyy-MM-dd"
                                placeholderText="종료일"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition"
                            >
                                검색
                            </button>
                            <button
                                type="button"
                                onClick={resetSearch}
                                className="flex-1 px-4 py-2 border border-gray-200 text-sm text-slate-600 rounded-lg hover:bg-gray-50 transition"
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
                            전체 <span className="font-semibold text-slate-700">{total}</span>건
                        </span>
                        {selectedIds.size > 0 && (
                            <button
                                onClick={deleteBulk}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-medium rounded-lg hover:bg-red-100 transition"
                            >
                                <i className="fa-solid fa-trash-can" />
                                선택 삭제 ({selectedIds.size})
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="text-left" style={{ minWidth: "960px", width: "100%" }}>
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            ref={checkboxRef}
                                            type="checkbox"
                                            checked={allChecked}
                                            onChange={toggleAll}
                                            className="w-4 h-4 rounded border-gray-300 accent-blue-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-16">ID</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">카테고리</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">소스</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">제목</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">작성자</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20">상태</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-36">작성일</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right w-56">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {list.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">
                                            게시물이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    list.data.map((post) => (
                                        <tr
                                            key={post.post_id}
                                            className={`hover:bg-gray-50 transition ${selectedIds.has(post.post_id) ? "bg-blue-50" : ""}`}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(post.post_id)}
                                                    onChange={() => toggleOne(post.post_id)}
                                                    className="w-4 h-4 rounded border-gray-300 accent-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{post.post_id}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5 whitespace-nowrap">
                                                    {postCategories[post.post_category] ?? post.post_category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {post.source ? (
                                                    <span className="text-xs bg-blue-50 text-blue-600 rounded px-2 py-0.5 whitespace-nowrap">
                                                        {postSources[post.source] ?? post.source}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">직접작성</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                <div className="truncate">
                                                    {post.title}
                                                    {post.has_image && (
                                                        <i className="fa-regular fa-image ml-1.5 text-slate-400 text-xs" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                {post.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${post.post_status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                    {postStatuses[post.post_status]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                                                {fmt(post.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openPreview(post)}
                                                        className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                                                    >
                                                        미리보기
                                                    </button>
                                                    <button
                                                        onClick={() => openPostEditModal(post)}
                                                        className="px-2.5 py-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() => deletePost(post.post_id)}
                                                        className="px-2.5 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-100 transition"
                                                    >
                                                        삭제
                                                    </button>
                                                    {post.blogger_post_id ? (
                                                        <a
                                                            href={post.blogger_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition"
                                                            title="Blogger에서 보기"
                                                        >
                                                            <i className="fa-brands fa-blogger mr-1" />발행됨
                                                        </a>
                                                    ) : (
                                                        <button
                                                            onClick={() => publishToBlogger(post)}
                                                            disabled={bloggerStatus[post.post_id] === "loading"}
                                                            className="px-2.5 py-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Blogger에 발행"
                                                        >
                                                            {bloggerStatus[post.post_id] === "loading" ? (
                                                                <i className="fa-solid fa-spinner fa-spin mr-1" />
                                                            ) : (
                                                                <i className="fa-brands fa-blogger mr-1" />
                                                            )}
                                                            Blogger
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {list.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-gray-100">
                            <Pagination links={list.links} />
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
