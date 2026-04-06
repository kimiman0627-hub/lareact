import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { ajax } from "@/Utils/network";

const BannerCreateModal = ({
    isOpen,
    onClose,
    onSubmit,
    selectedBanner = null,
    bannerStatuses = {},
    bannerPositions = {},
}) => {
    const [formData, setFormData] = useState({
        id: "",
        title: "",
        image_url: "",
        link_url: "",
        is_new_tab: false,
        banner_status: "ACTIVE",
        banner_position: "",
        sort_order: 0,
        start_date: "",
        end_date: "",
    });

    // URL 직접 입력 vs 파일 업로드 탭
    const [imageSource, setImageSource] = useState("url"); // "url" | "file"
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (selectedBanner) {
            setFormData({
                id: selectedBanner.banner_id ?? "",
                title: selectedBanner.title ?? "",
                image_url: selectedBanner.image_url ?? "",
                link_url: selectedBanner.link_url ?? "",
                is_new_tab: selectedBanner.is_new_tab === true || selectedBanner.is_new_tab === 1,
                banner_status: selectedBanner.banner_status ?? "ACTIVE",
                banner_position: selectedBanner.banner_position ?? "",
                sort_order: selectedBanner.sort_order ?? 0,
                start_date: selectedBanner.start_date ?? "",
                end_date: selectedBanner.end_date ?? "",
            });
        } else {
            setFormData({
                id: "",
                title: "",
                image_url: "",
                link_url: "",
                is_new_tab: false,
                banner_status: Object.keys(bannerStatuses)[0] ?? "ACTIVE",
                banner_position: "",
                sort_order: 0,
                start_date: "",
                end_date: "",
            });
        }
        setImageSource("url");
        setUploadError("");
    }, [selectedBanner, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError("");
        setUploading(true);

        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("file_kind", "BANNER");

            const res = await ajax.upload("/admin/files/upload", fd);

            if (res.success) {
                setFormData((prev) => ({ ...prev, image_url: res.data.file_url }));
            } else {
                setUploadError(res.message || "업로드에 실패했습니다.");
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.file?.[0] ||
                "업로드 중 오류가 발생했습니다.";
            setUploadError(msg);
        } finally {
            setUploading(false);
            // input 초기화 (같은 파일 재선택 가능하게)
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Banner Modal"
            overlayClassName="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-auto outline-none max-h-[90vh] overflow-y-auto"
        >
            <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                        {selectedBanner ? "배너 수정" : "배너 등록"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-900 transition"
                    >
                        닫기
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 제목 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">
                            배너 제목
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="배너 제목을 입력하세요"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>

                    {/* 이미지 - URL / 파일 탭 */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">
                                이미지
                            </label>
                            {/* 탭 토글 */}
                            <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs font-medium">
                                <button
                                    type="button"
                                    onClick={() => setImageSource("url")}
                                    className={`px-3 py-1.5 transition ${
                                        imageSource === "url"
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    URL 입력
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageSource("file")}
                                    className={`px-3 py-1.5 transition ${
                                        imageSource === "file"
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    파일 업로드
                                </button>
                            </div>
                        </div>

                        {imageSource === "url" ? (
                            <input
                                type="text"
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleChange}
                                required
                                placeholder="https://example.com/banner.jpg"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        ) : (
                            <div
                                className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {uploading ? (
                                    <div className="flex flex-col items-center gap-2 text-blue-600">
                                        <svg className="animate-spin h-7 w-7" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        <span className="text-sm">업로드 중...</span>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="h-8 w-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16l4-4 4 4 4-6 4 6M3 20h18M5 8a2 2 0 100-4 2 2 0 000 4z" />
                                        </svg>
                                        <p className="text-sm text-slate-500">
                                            클릭하여 이미지 선택
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            JPG, PNG, GIF, WEBP · 최대 10MB
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 업로드 오류 */}
                        {uploadError && (
                            <p className="text-xs text-red-500">{uploadError}</p>
                        )}

                        {/* 미리보기 (image_url이 있으면 항상 표시) */}
                        {formData.image_url && (
                            <div className="relative">
                                <img
                                    src={formData.image_url}
                                    alt="미리보기"
                                    className="h-28 w-full rounded-xl border border-slate-200 object-cover"
                                    onError={(e) => (e.target.style.display = "none")}
                                    onLoad={(e) => (e.target.style.display = "block")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData((p) => ({ ...p, image_url: "" }))}
                                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow text-slate-500 hover:text-red-500 transition"
                                    title="이미지 제거"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 링크 URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">
                            링크 URL
                        </label>
                        <input
                            type="text"
                            name="link_url"
                            value={formData.link_url}
                            onChange={handleChange}
                            placeholder="https://example.com (선택사항)"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>

                    {/* 상태 / 위치 / 정렬순서 */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">상태</label>
                            <select
                                name="banner_status"
                                value={formData.banner_status}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            >
                                {Object.entries(bannerStatuses).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">노출 위치</label>
                            <select
                                name="banner_position"
                                value={formData.banner_position}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            >
                                <option value="">선택하세요</option>
                                {Object.entries(bannerPositions).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">정렬 순서</label>
                            <input
                                type="number"
                                name="sort_order"
                                value={formData.sort_order}
                                onChange={handleChange}
                                min={0}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        </div>
                    </div>

                    {/* 노출 기간 */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">노출 시작일</label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">노출 종료일</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        </div>
                    </div>

                    {/* 새탭 / 버튼 */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                name="is_new_tab"
                                checked={formData.is_new_tab}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            새 탭에서 열기
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default BannerCreateModal;
