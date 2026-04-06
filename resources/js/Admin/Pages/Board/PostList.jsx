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
import PostCreateModal from "@/Admin/Components/Posts/PostCreateModal"; // 게시물 등록/수정 모달 컴포넌트

export default function PostIndex({
    list,
    total,
    params,
    postTypes,
    postStatuses,
    postCategories,
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
        id: params?.id || "",
        name: params?.name || "",
        email: params?.email || "",
        title: params?.title || "",
        content: params?.content || "",
        keyword: params?.keyword || "",
        search_type: params?.search_type || "all",
    });

    const [loading, setLoading] = useState(false);

    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

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
            id: "",
            name: "",
            email: "",
            title: "",
            content: "",
            keyword: "",
            search_type: "all",
        });
        setStartDate(null);
        setEndDate(null);
        http.get("/admin/posts", {}, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout user={auth?.user}>
            <div className="p-6 max-w-7xl mx-auto">
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
                    <form
                        onSubmit={handleSearch}
                        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
                    >
                        {/* ID 검색 */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                ID
                            </label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.id}
                                onChange={(e) =>
                                    setSearchForm({
                                        ...searchForm,
                                        id: e.target.value,
                                    })
                                }
                                placeholder="ID 숫자"
                            />
                        </div>
                        {/* 이름 검색 */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                이름
                            </label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.name}
                                onChange={(e) =>
                                    setSearchForm({
                                        ...searchForm,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="이름 포함"
                            />
                        </div>
                        {/* 이메일 검색 */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                이메일
                            </label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.email}
                                onChange={(e) =>
                                    setSearchForm({
                                        ...searchForm,
                                        email: e.target.value,
                                    })
                                }
                                placeholder="이메일 주소"
                            />
                        </div>
                        {/* 가입일 검색 (기간) */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                가입일
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative">
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
                                </div>
                                <span className="text-gray-400">~</span>
                                <div className="relative">
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        selectsEnd
                                        startDate={startDate}
                                        endDate={endDate}
                                        minDate={startDate} // 시작일 이전은 선택 못하게 막음
                                        locale={ko}
                                        dateFormat="yyyy-MM-dd"
                                        placeholderText="종료일"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* 버튼들 */}
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

                {/* 테이블 리스트 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                    id
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                    제목
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                    작성자
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                    상태
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                    작성일
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">
                                    관리
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {list.data.map((post) => (
                                <tr
                                    key={post.post_id}
                                    className="hover:bg-gray-50 transition"
                                >
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {post.post_id}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {post.title}
                                    </td>

                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {post.email} / {post.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {postStatuses[post.post_status]}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(
                                            post.created_at,
                                        ).toLocaleString("ko-KR")}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right space-x-3">
                                        <button
                                            onClick={() =>
                                                openPostEditModal(post)
                                            }
                                            className="text-blue-600 hover:underline"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={() =>
                                                deletePost(post.post_id)
                                            }
                                            className="text-red-600 hover:underline"
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
