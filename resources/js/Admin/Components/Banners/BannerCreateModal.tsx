import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { ajax } from "@/Utils/network";

interface BannerCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    selectedBanner?: any;
    bannerTypes?: Record<string, string>;
    bannerStatuses?: Record<string, string>;
    bannerPositions?: Record<string, string>;
}

const TYPE_META: Record<string, { label: string; contentLabel: string | null; placeholder: string | null; hint: string | null }> = {
    IMAGE:  { label: "이미지",        contentLabel: null,             placeholder: null,                            hint: null },
    HTML:   { label: "HTML",          contentLabel: "HTML 코드",      placeholder: "<div>...</div>",                hint: "직접 작성한 HTML 마크업을 입력하세요." },
    IFRAME: { label: "iframe 임베드", contentLabel: "iframe 코드",    placeholder: '<iframe src="..." ...></iframe>', hint: "쿠팡파트너스, 애드핏 등 광고 네트워크에서 발급된 iframe 코드를 붙여넣으세요." },
    SCRIPT: { label: "스크립트",      contentLabel: "script 코드",    placeholder: "<script>...</script>",           hint: "광고 네트워크에서 발급된 script 태그 전체를 붙여넣으세요." },
    VIDEO:  { label: "동영상 URL",    contentLabel: "동영상 URL / 임베드 코드", placeholder: "https://www.youtube.com/embed/...", hint: "YouTube, Vimeo 임베드 URL 또는 iframe 코드를 입력하세요." },
};

const EMPTY_FORM = (bannerStatuses: Record<string, string>) => ({
    id: "",
    title: "",
    banner_type: "IMAGE",
    image_url: "",
    content: "",
    link_url: "",
    is_new_tab: false,
    banner_status: Object.keys(bannerStatuses)[0] ?? "ACTIVE",
    banner_position: "",
    sort_order: 0,
    start_date: "",
    end_date: "",
});

const BannerCreateModal = ({
    isOpen,
    onClose,
    onSubmit,
    selectedBanner = null,
    bannerTypes = {},
    bannerStatuses = {},
    bannerPositions = {},
}: BannerCreateModalProps) => {
    const [formData, setFormData] = useState<any>(EMPTY_FORM(bannerStatuses));

    // IMAGE 타입용 이미지 소스 탭
    const [imageSource, setImageSource] = useState<string>("url"); // "url" | "file"
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedBanner) {
            setFormData({
                id:              selectedBanner.banner_id   ?? "",
                title:           selectedBanner.title       ?? "",
                banner_type:     selectedBanner.banner_type ?? "IMAGE",
                image_url:       selectedBanner.image_url   ?? "",
                content:         selectedBanner.content     ?? "",
                link_url:        selectedBanner.link_url    ?? "",
                is_new_tab:      selectedBanner.is_new_tab === true || selectedBanner.is_new_tab === 1,
                banner_status:   selectedBanner.banner_status   ?? Object.keys(bannerStatuses)[0] ?? "ACTIVE",
                banner_position: selectedBanner.banner_position ?? "",
                sort_order:      selectedBanner.sort_order  ?? 0,
                start_date:      selectedBanner.start_date  ?? "",
                end_date:        selectedBanner.end_date    ?? "",
            });
        } else {
            setFormData(EMPTY_FORM(bannerStatuses));
        }
        setImageSource("url");
        setUploadError("");
    }, [selectedBanner, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev: any) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError("");
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("file_kind", "BANNER");
            const res = await ajax.upload("/admin/files/upload", fd) as any;
            if (res.success) {
                setFormData((prev: any) => ({ ...prev, image_url: res.data.file_url }));
            } else {
                setUploadError(res.message || "업로드에 실패했습니다.");
            }
        } catch (err: any) {
            setUploadError(
                err.response?.data?.message ||
                err.response?.data?.errors?.file?.[0] ||
                "업로드 중 오류가 발생했습니다."
            );
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const isImage = formData.banner_type === "IMAGE";
    const meta    = TYPE_META[formData.banner_type] ?? TYPE_META.IMAGE;

    // 타입 변경 시 상대방 필드 초기화
    const handleTypeChange = (newType: string) => {
        setFormData((prev: any) => ({
            ...prev,
            banner_type: newType,
            image_url:   newType === "IMAGE" ? prev.image_url : "",
            content:     newType !== "IMAGE" ? prev.content   : "",
        }));
        setUploadError("");
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
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                        {selectedBanner ? "배너 수정" : "배너 등록"}
                    </h2>
                    <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-900 transition">
                        닫기
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 제목 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">배너 제목</label>
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

                    {/* 배너 타입 */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">배너 타입</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(bannerTypes).map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleTypeChange(key)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                                        formData.banner_type === key
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── IMAGE 타입: URL / 파일 업로드 ── */}
                    {isImage && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-600">이미지</label>
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
                                            <p className="text-sm text-slate-500">클릭하여 이미지 선택</p>
                                            <p className="text-xs text-slate-400 mt-1">JPG, PNG, GIF, WEBP · 최대 10MB</p>
                                        </>
                                    )}
                                </div>
                            )}

                            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

                            {formData.image_url && (
                                <div className="relative">
                                    <img
                                        src={formData.image_url}
                                        alt="미리보기"
                                        className="h-28 w-full rounded-xl border border-slate-200 object-cover"
                                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                                        onLoad={(e)  => ((e.target as HTMLImageElement).style.display = "block")}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData((p: any) => ({ ...p, image_url: "" }))}
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
                    )}

                    {/* ── 비이미지 타입: 코드/URL 텍스트 영역 ── */}
                    {!isImage && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">
                                {meta.contentLabel}
                            </label>
                            {meta.hint && (
                                <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                    {meta.hint}
                                </p>
                            )}
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                required
                                rows={6}
                                placeholder={meta.placeholder ?? ""}
                                spellCheck={false}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-y"
                            />
                        </div>
                    )}

                    {/* 링크 URL (IMAGE·VIDEO 타입에서 유용) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">
                            링크 URL
                            {!isImage && (
                                <span className="ml-1 text-xs text-slate-400 font-normal">(선택 — 코드 내 링크가 우선)</span>
                            )}
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
