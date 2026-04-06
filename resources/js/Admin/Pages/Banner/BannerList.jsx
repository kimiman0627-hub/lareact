import React, { useState } from "react";
import { http } from "@/Utils/http";
import { usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import Pagination from "@/Admin/Components/Common/Pagination";
import BannerCreateModal from "@/Admin/Components/Banners/BannerCreateModal";

export default function BannerList({
    list,
    total,
    params,
    bannerStatuses,
    bannerPositions,
}) {
    const { auth } = usePage().props;

    const [searchForm, setSearchForm] = useState({
        id: params?.id || "",
        title: params?.title || "",
        banner_status: params?.banner_status || "",
        banner_position: params?.banner_position || "",
    });

    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);

    const openCreateModal = () => {
        setSelectedBanner(null);
        setIsBannerModalOpen(true);
    };

    const openEditModal = (banner) => {
        setSelectedBanner(banner);
        setIsBannerModalOpen(true);
    };

    const handleSubmit = (data) => {
        if (data.id) {
            http.put(route("admin.banners.update", data.id), data, {
                onSuccess: () => setIsBannerModalOpen(false),
            });
        } else {
            http.post(route("admin.banners.store"), data, {
                onSuccess: () => setIsBannerModalOpen(false),
            });
        }
    };

    const deleteBanner = (id) => {
        http.delete(`/admin/banners/${id}`, {
            confirmMsg: "배너를 삭제하시겠습니까?",
            onSuccess: () => {
                http.get("/admin/banners", {}, { preserveState: true, replace: true });
            },
        });
    };

    const moveOrder = (id, direction) => {
        http.patch(`/admin/banners/${id}/order`, { direction }, {
            preserveState: false,
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        http.get("/admin/banners", searchForm, { preserveState: true, replace: true });
    };

    const resetSearch = () => {
        setSearchForm({ id: "", title: "", banner_status: "", banner_position: "" });
        http.get("/admin/banners", {}, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout user={auth?.user}>
            <div className="p-6 max-w-7xl mx-auto">
                <BannerCreateModal
                    isOpen={isBannerModalOpen}
                    onClose={() => setIsBannerModalOpen(false)}
                    selectedBanner={selectedBanner}
                    bannerStatuses={bannerStatuses}
                    bannerPositions={bannerPositions}
                    onSubmit={handleSubmit}
                />

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">배너 관리</h1>
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                        신규 배너 등록
                    </button>
                </div>

                {/* 검색 영역 */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <form
                        onSubmit={handleSearch}
                        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
                    >
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                ID
                            </label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.id}
                                onChange={(e) => setSearchForm({ ...searchForm, id: e.target.value })}
                                placeholder="ID 숫자"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                제목
                            </label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.title}
                                onChange={(e) => setSearchForm({ ...searchForm, title: e.target.value })}
                                placeholder="제목 포함"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                상태
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.banner_status}
                                onChange={(e) => setSearchForm({ ...searchForm, banner_status: e.target.value })}
                            >
                                <option value="">전체</option>
                                {Object.entries(bannerStatuses).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                노출 위치
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.banner_position}
                                onChange={(e) => setSearchForm({ ...searchForm, banner_position: e.target.value })}
                            >
                                <option value="">전체</option>
                                {Object.entries(bannerPositions).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
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
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">순서</th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">ID</th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">미리보기</th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">제목</th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">위치</th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">상태</th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">노출 기간</th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600">등록일</th>
                                <th className="px-4 py-4 text-sm font-semibold text-gray-600 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {list.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-400">
                                        등록된 배너가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                list.data.map((banner, index) => (
                                    <tr key={banner.banner_id} className="hover:bg-gray-50 transition">
                                        {/* 순서 변경 화살표 */}
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1 items-center">
                                                <button
                                                    onClick={() => moveOrder(banner.banner_id, "up")}
                                                    disabled={index === 0}
                                                    title="위로"
                                                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                    </svg>
                                                </button>
                                                <span className="text-xs text-gray-400 font-mono">{banner.sort_order}</span>
                                                <button
                                                    onClick={() => moveOrder(banner.banner_id, "down")}
                                                    disabled={index === list.data.length - 1}
                                                    title="아래로"
                                                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition"
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{banner.banner_id}</td>
                                        <td className="px-4 py-4">
                                            {banner.image_url && (
                                                <img
                                                    src={banner.image_url}
                                                    alt={banner.title}
                                                    className="h-10 w-20 rounded object-cover border border-gray-200"
                                                    onError={(e) => (e.target.style.display = "none")}
                                                />
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                            {banner.link_url ? (
                                                <a
                                                    href={banner.link_url}
                                                    target={banner.is_new_tab ? "_blank" : "_self"}
                                                    rel="noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {banner.title}
                                                </a>
                                            ) : (
                                                banner.title
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {bannerPositions[banner.banner_position] ?? banner.banner_position}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <span
                                                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                                    banner.banner_status === "ACTIVE"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-500"
                                                }`}
                                            >
                                                {bannerStatuses[banner.banner_status] ?? banner.banner_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {banner.start_date || "-"}
                                            {banner.start_date && banner.end_date && " ~ "}
                                            {banner.end_date || ""}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {new Date(banner.created_at).toLocaleString("ko-KR")}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-right space-x-3">
                                            <button
                                                onClick={() => openEditModal(banner)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={() => deleteBanner(banner.banner_id)}
                                                className="text-red-600 hover:underline"
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
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
