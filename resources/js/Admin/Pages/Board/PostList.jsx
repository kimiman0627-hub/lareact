import React, { useState } from "react";
import { http } from "@/Utils/http";
import { ajax } from "@/Utils/network"; // http 객체는 실제로 사용하시는 것을 import 하세요
import { useForm, usePage, router } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import Pagination from "@/Admin/Components/Common/Pagination"; // 페이지네이션 컴포넌트
import PostCreateModal from "@/Admin/Components/Posts/PostCreateModal";
import PostPreviewModal from "@/Admin/Components/Posts/PostPreviewModal";

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

    // URL에서 받은 문자열을 Date 객체로 변환하여 초기값으로 설정합니다.
    const [startDate, setStartDate] = useState(
        params?.start_date ? new Date(params.start_date) : null,
    );
    const [endDate, setEndDate] = useState(
        params?.end_date ? new Date(params.end_date) : null,
    );

    // URL의 기존 검색 조건을 초기값으로 세팅
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

    const [loading, setLoading] = useState(false);

    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen]     = useState(false);
    const [previewPost, setPreviewPost]         = useState(null);

    const openPreview = (post) => {
        setPreviewPost(post);
        setIsPreviewOpen(true);
    };

    const { data, setData, post, put, processing, reset } = useForm({
        id: null,
        title: "",
        content: "",
        post_status: "NORMAL",
        post_type: "NORMAL",
        post_category: "",
        is_notice: false,
        banner_ids: [],
    });

    // 등록 모달 열기
    const openCreatePostModal = () => {
        reset();
        setIsPostModalOpen(true);
    };

    // 수정 모달 열기
    const openPostEditModal = (item) => {
        setData({
            id: item.post_id,
            title: item.title,
            content: item.content,
            post_status: item.post_status,
            post_type: item.post_type,
            post_category: item.post_category,
            is_notice: item.is_notice === true,
            user_id: item.user_id,
            created_at: item.created_at,
            email: item.email,
            name: item.name,
            banner_ids: item.banner_ids ?? [],
        });
        setIsPostModalOpen(true);
    };

    const handleSubmit = (data) => {
        console.log("Submitting post data:", data);
        data.is_notice = data.is_notice ? true : false; // 체크박스 값이 boolean으로 변환되도록 처리

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
        http.delete(`/admin/posts/${id}`, {
            confirmMsg: "게시물을 삭제하시겠습니까?",
            onSuccess: () => {
                http.get(
                    "/admin/posts",
                    {},
                    {
                        preserveState: true,
                        replace: true,
                    },
                );
            },
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const searchData = {
            ...searchForm,
            start_date: startDate ? format(startDate, "yyyy-MM-dd") : "",
            end_date: endDate ? format(endDate, "yyyy-MM-dd") : "",
        };
        http.get("/admin/posts", searchData, {
            preserveState: true,
            replace: true,
        });
    };

    const resetSearch = () => {
        setSearchForm({
            id:            "",
            name:          "",
            email:         "",
            keyword:       "",
            search_type:   "title",
            post_status:   "",
            post_category: "",
            source:        "",
        });
        setStartDate(null);
        setEndDate(null);
        http.get("/admin/posts", {}, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout user={auth?.user}>
            <div className="p-6 max-w-7xl mx-auto">
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

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        게시물 관리
                    </h1>

                    <button
                        onClick={openCreatePostModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                        신규 게시물 등록
                    </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <form onSubmit={handleSearch} className="space-y-3">
                        {/* 1행: 카테고리 / 소스 / 상태 / 작성자 / ID */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">카테고리</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                                <label className="block text-xs font-semibold text-gray-500 mb-1">소스</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                                <label className="block text-xs font-semibold text-gray-500 mb-1">상태</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                                <label className="block text-xs font-semibold text-gray-500 mb-1">작성자</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={searchForm.name}
                                    onChange={(e) => setSearchForm({ ...searchForm, name: e.target.value })}
                                    placeholder="닉네임"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">ID</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={searchForm.id}
                                    onChange={(e) => setSearchForm({ ...searchForm, id: e.target.value })}
                                    placeholder="게시글 ID"
                                />
                            </div>
                        </div>

                        {/* 2행: 키워드 검색 + 날짜 + 버튼 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex gap-2">
                                <select
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={searchForm.search_type}
                                    onChange={(e) => setSearchForm({ ...searchForm, search_type: e.target.value })}
                                >
                                    <option value="title">제목</option>
                                    <option value="content">내용</option>
                                    <option value="all">제목+내용</option>
                                </select>
                                <input
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
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
                        </div>
                    </form>
                </div>

                {/* 테이블 리스트 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="text-left" style={{ minWidth: "900px", width: "100%" }}>
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-16">ID</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">카테고리</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">소스</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">제목</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">작성자</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20">상태</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">작성일</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right w-32">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {list.data.map((post) => (
                                    <tr key={post.post_id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                            {post.post_id}
                                        </td>
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
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs">
                                            <div className="truncate">{post.title}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                            {post.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${post.post_status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                {postStatuses[post.post_status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                                            {new Date(post.created_at).toLocaleDateString("ko-KR")}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap space-x-2">
                                            <button onClick={() => openPreview(post)} className="text-slate-500 hover:underline">
                                                미리보기
                                            </button>
                                            <button onClick={() => openPostEditModal(post)} className="text-blue-600 hover:underline">
                                                수정
                                            </button>
                                            <button onClick={() => deletePost(post.post_id)} className="text-red-600 hover:underline">
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-8">
                        <Pagination links={list.links} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
