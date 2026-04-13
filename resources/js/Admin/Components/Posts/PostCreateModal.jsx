import React, { useState, useEffect, useRef, useMemo } from "react";
import Modal from "react-modal";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { ajax } from "@/Utils/network";
import UserSearchInput from "@/Admin/Components/Common/UserSearchInput";

// DB datetime("2026-04-06 12:34:56" 또는 "2026-04-06T12:34:56.000Z") → datetime-local 입력값("2026-04-06T12:34")
const toDatetimeLocal = (val) => {
    if (!val) return "";
    return String(val).replace(" ", "T").substring(0, 16);
};

// 현재 시각을 datetime-local 형식으로 반환
const nowDatetimeLocal = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Canvas로 이미지 압축 (최대 너비 1200px, JPEG 80%)
const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("압축 실패"));
                            return;
                        }
                        resolve(
                            new File(
                                [blob],
                                file.name.replace(/\.[^.]+$/, ".jpg"),
                                { type: "image/jpeg" },
                            ),
                        );
                    },
                    "image/jpeg",
                    quality,
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

const PostCreateModal = ({
    isOpen,
    onClose,
    onSubmit,
    selectedPost = null,
    postTypes = {},
    postStatuses = {},
    postCategories = {},
    banners = [],
    bannerPositions = {},
}) => {
    const [formData, setFormData] = useState({
        id: "",
        user_id: "",
        post_status: "ACTIVE",
        post_type: "NORMAL",
        post_category: "",
        title: "",
        content: "",
        is_notice: false,
        created_at: nowDatetimeLocal(),
        banner_ids: [],
    });
    const [userInitialText, setUserInitialText] = useState("");
    const [htmlMode, setHtmlMode] = useState(false);
    const quillRef = useRef(null);
    const quillKey = useRef(0);
    const uploadedFileIds = useRef([]);

    useEffect(() => {
        // Quill 재초기화를 위해 key 변경
        quillKey.current += 1;
        setHtmlMode(false);
        uploadedFileIds.current = [];

        if (selectedPost) {
            setFormData({
                ...selectedPost,
                created_at:
                    toDatetimeLocal(selectedPost.created_at) ||
                    nowDatetimeLocal(),
                banner_ids: selectedPost.banner_ids ?? [],
                hits:          selectedPost.hits          ?? 0,
                like_count:    selectedPost.like_count    ?? 0,
                dislike_count: selectedPost.dislike_count ?? 0,
            });
            // 수정 모드: 기존 회원 정보를 UserSearchInput 초기값으로 표시
            const name = selectedPost.name ?? "";
            const email = selectedPost.email ?? "";
            setUserInitialText(name && email ? `${name} (${email})` : name || email);
        } else {
            setFormData({
                id: "",
                user_id: "",
                post_status: Object.keys(postStatuses)[0] ?? "ACTIVE",
                post_type: Object.keys(postTypes)[0] ?? "NORMAL",
                post_category: "",
                title: "",
                content: "",
                is_notice: false,
                created_at: nowDatetimeLocal(),
                banner_ids: [],
            });
            setUserInitialText("");
        }
    }, [selectedPost, isOpen]);

    // Quill 이미지 핸들러: 파일 선택 → Canvas 압축 → 서버 업로드 → URL 삽입
    const quillModules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                ],
                handlers: {
                    image: () => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept =
                            "image/jpeg,image/png,image/gif,image/webp";
                        input.click();

                        input.onchange = async () => {
                            const file = input.files?.[0];
                            if (!file) return;
                            try {
                                const compressed = await compressImage(file);
                                const fd = new FormData();
                                fd.append("file", compressed);
                                fd.append("file_kind", "POST");

                                const res = await ajax.upload(
                                    "/admin/files/upload",
                                    fd,
                                );
                                if (res.success) {
                                    // 업로드된 file_id 추적 (게시물 저장 시 ref_id 업데이트용)
                                    if (res.data.file_id) {
                                        uploadedFileIds.current.push(res.data.file_id);
                                    }
                                    const editor =
                                        quillRef.current?.getEditor();
                                    if (editor) {
                                        const range = editor.getSelection(true);
                                        editor.insertEmbed(
                                            range.index,
                                            "image",
                                            res.data.file_url,
                                        );
                                        editor.setSelection(range.index + 1);
                                    }
                                }
                            } catch (err) {
                                console.error("이미지 업로드 실패:", err);
                            }
                        };
                    },
                },
            },
        }),
        [],
    );

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const toggleBanner = (bannerId) => {
        setFormData((prev) => {
            const ids = prev.banner_ids ?? [];
            return {
                ...prev,
                banner_ids: ids.includes(bannerId)
                    ? ids.filter((id) => id !== bannerId)
                    : [...ids, bannerId],
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            created_at: formData.created_at
                ? formData.created_at.replace("T", " ") + ":00"
                : null,
            uploaded_file_ids: uploadedFileIds.current,
        };

        onSubmit(submitData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            contentLabel="Post Modal"
            overlayClassName="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl mx-auto outline-none max-h-[90vh] overflow-y-auto"
        >
            <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                        {selectedPost ? "게시글 수정" : "게시글 작성"}
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
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* 회원정보 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">
                                회원정보
                            </label>
                            <UserSearchInput
                                key={`${selectedPost?.id}-${isOpen}`}
                                initialText={userInitialText}
                                onSelect={(user) =>
                                    setFormData((prev) => ({ ...prev, user_id: user ? user.id : "" }))
                                }
                            />
                        </div>

                        {/* 작성일 - datetime-local 타입으로 Y-m-d H:i 형식 표시 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">
                                작성일
                            </label>
                            <input
                                type="datetime-local"
                                name="created_at"
                                value={formData.created_at}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">
                                게시물 상태
                            </label>
                            <select
                                name="post_status"
                                value={formData.post_status}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            >
                                {Object.entries(postStatuses).length > 0 ? (
                                    Object.entries(postStatuses).map(
                                        ([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        ),
                                    )
                                ) : (
                                    <option value="ACTIVE">활성</option>
                                )}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">
                                게시물 타입
                            </label>
                            <select
                                name="post_type"
                                value={formData.post_type}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            >
                                {Object.entries(postTypes).length > 0 ? (
                                    Object.entries(postTypes).map(
                                        ([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        ),
                                    )
                                ) : (
                                    <option value="NORMAL">일반</option>
                                )}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">
                                카테고리
                            </label>
                            {Object.keys(postCategories).length === 0 ? (
                                <div className="w-full rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                                    게시판 설정에서 게시판을 먼저 등록해주세요.
                                </div>
                            ) : (
                                <select
                                    name="post_category"
                                    value={formData.post_category}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                >
                                    <option value="">선택하세요</option>
                                    {Object.entries(postCategories).map(
                                        ([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* 통계 정보 — 수정 모드에서만 표시 */}
                    {selectedPost && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">통계</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">조회수</label>
                                    <input
                                        type="number"
                                        name="hits"
                                        value={formData.hits ?? 0}
                                        onChange={handleChange}
                                        min={0}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">좋아요</label>
                                    <input
                                        type="number"
                                        name="like_count"
                                        value={formData.like_count ?? 0}
                                        onChange={handleChange}
                                        min={0}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">싫어요</label>
                                    <input
                                        type="number"
                                        name="dislike_count"
                                        value={formData.dislike_count ?? 0}
                                        onChange={handleChange}
                                        min={0}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500">댓글수 / 스크랩</label>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 flex items-center gap-2">
                                        <span>💬 {selectedPost.comment_count ?? 0}</span>
                                        <span className="text-slate-300">·</span>
                                        <span>🔖 {selectedPost.scrap_count ?? 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">
                            제목
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="제목을 입력하세요"
                            required
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-600">
                                내용
                                <span className="ml-2 text-xs text-slate-400 font-normal">
                                    이미지 삽입 시 자동 압축 후 업로드됩니다
                                </span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setHtmlMode((v) => !v)}
                                className="text-xs px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                            >
                                {htmlMode ? "에디터 모드" : "HTML 편집"}
                            </button>
                        </div>
                        {htmlMode ? (
                            <textarea
                                value={formData.content}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        content: e.target.value,
                                    }))
                                }
                                className="w-full h-64 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-mono text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-y"
                                spellCheck={false}
                            />
                        ) : (
                            <div className="rounded-2xl border border-slate-300 bg-white shadow-sm">
                                <ReactQuill
                                    key={quillKey.current}
                                    ref={quillRef}
                                    value={formData.content}
                                    onChange={(value) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            content: value,
                                        }))
                                    }
                                    modules={quillModules}
                                    className="rounded-2xl"
                                    style={{
                                        height: "200px",
                                        marginBottom: "50px",
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* 연동 배너 선택 */}
                    {banners.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">
                                연동 배너
                            </label>
                            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-300 bg-slate-50 p-3 space-y-2">
                                {banners.map((banner) => (
                                    <label
                                        key={banner.banner_id}
                                        className="flex items-center gap-3 cursor-pointer hover:bg-white rounded-lg px-2 py-1 transition"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={(
                                                formData.banner_ids ?? []
                                            ).includes(banner.banner_id)}
                                            onChange={() =>
                                                toggleBanner(banner.banner_id)
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700 flex-1">
                                            {banner.title}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {bannerPositions[
                                                banner.banner_position
                                            ] ?? banner.banner_position}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {(formData.banner_ids ?? []).length > 0 && (
                                <p className="text-xs text-blue-600">
                                    {(formData.banner_ids ?? []).length}개 배너
                                    선택됨
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                name="is_notice"
                                checked={formData.is_notice}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            공지글
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
                                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
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

export default PostCreateModal;
