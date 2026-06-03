import React, { useState, useRef, useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import { ajax } from "@/Utils/network";
import type { Board } from "@/types";

const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> =>
    new Promise((resolve, reject) => {
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
                (canvas.getContext("2d") as CanvasRenderingContext2D).drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { reject(new Error("압축 실패")); return; }
                        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
                    },
                    "image/jpeg",
                    quality,
                );
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });

interface PostWriteProps {
    boards?: Board[];
    category?: string | null;
}

export default function PostWrite({ boards = [], category = null }: PostWriteProps) {
    const [form, setForm] = useState({
        post_category: category ?? (boards[0]?.category ?? ""),
        title: "",
        content: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const quillRef = useRef<ReactQuill | null>(null);
    const uploadedFileIds = useRef<number[]>([]);

    const quillModules = useMemo(() => ({
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
                    input.accept = "image/jpeg,image/png,image/gif,image/webp";
                    input.click();
                    input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        try {
                            const compressed = await compressImage(file);
                            const fd = new FormData();
                            fd.append("file", compressed);
                            const res = await ajax.upload("/files/upload", fd) as { success: boolean; data: { file_id?: number; file_url: string } };
                            if (res.success) {
                                if (res.data.file_id) uploadedFileIds.current.push(res.data.file_id);
                                const editor = (quillRef.current as ReactQuill & { getEditor?: () => { getSelection: (b: boolean) => { index: number }; insertEmbed: (i: number, t: string, v: string) => void; setSelection: (i: number) => void } })?.getEditor?.();
                                if (editor) {
                                    const range = editor.getSelection(true);
                                    editor.insertEmbed(range.index, "image", res.data.file_url);
                                    editor.setSelection(range.index + 1);
                                }
                            }
                        } catch (err) {
                            console.error("이미지 업로드 실패:", err);
                            alert("이미지 업로드에 실패했습니다.");
                        }
                    };
                },
            },
        },
    }), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};
        if (!form.post_category) newErrors.post_category = "게시판을 선택해주세요.";
        if (!form.title.trim()) newErrors.title = "제목을 입력해주세요.";
        if (!form.content || form.content === "<p><br></p>") newErrors.content = "내용을 입력해주세요.";
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        setSubmitting(true);
        router.post("/post/write", {
            post_category: form.post_category,
            title: form.title,
            content: form.content,
            uploaded_file_ids: uploadedFileIds.current,
        }, {
            onError: (errs) => { setErrors(errs as Record<string, string>); setSubmitting(false); },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <ServiceLayout theme="light">
            <Head><title>글쓰기</title></Head>

            <div className="flex items-center gap-2 mb-4">
                <Link href="/" className="text-sm text-slate-400 hover:text-blue-500 transition">홈</Link>
                <span className="text-slate-300 text-sm">›</span>
                <span className="text-sm font-semibold text-slate-700">글쓰기</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h1 className="text-base font-bold text-slate-800">글쓰기</h1>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">게시판</label>
                        <select value={form.post_category}
                            onChange={(e) => setForm((prev) => ({ ...prev, post_category: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">선택하세요</option>
                            {boards.map((b) => (
                                <option key={b.category} value={b.category}>{b.board_name}</option>
                            ))}
                        </select>
                        {errors.post_category && <p className="mt-1 text-xs text-red-500">{errors.post_category}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">제목</label>
                        <input type="text" value={form.title}
                            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="제목을 입력하세요" maxLength={255}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                            내용
                            <span className="ml-2 text-xs text-slate-400 font-normal">이미지 삽입 시 자동 압축 후 업로드됩니다</span>
                        </label>
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                            <ReactQuill ref={quillRef} value={form.content}
                                onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
                                modules={quillModules}
                                style={{ height: "320px", marginBottom: "50px" }} />
                        </div>
                        {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href={form.post_category ? `/board/${form.post_category}` : "/"}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50 transition">
                            취소
                        </Link>
                        <button type="submit" disabled={submitting}
                            className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
                            {submitting ? "등록 중..." : "등록"}
                        </button>
                    </div>
                </form>
            </div>
        </ServiceLayout>
    );
}
