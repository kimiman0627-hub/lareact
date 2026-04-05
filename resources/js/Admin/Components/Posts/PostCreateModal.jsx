import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { ajax } from "@/Utils/network";

const PostCreateModal = ({
    isOpen,
    onClose,
    onSubmit,
    selectedPost = null,
    postTypes = {},
    postStatuses = {},
    postCategories = {},
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
        created_at: new Date().toISOString().split("T")[0],
    });
    const [errors, setErrors] = useState({});
    const [userSearch, setUserSearch] = useState("");
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef(null);

    useEffect(() => {
        if (selectedPost) {
            setFormData(selectedPost);
            setUserSearch(
                selectedPost.user_name
                    ? `${selectedPost.user_name} (${selectedPost.email ?? ""})`
                    : selectedPost.user_id
                      ? `ID: ${selectedPost.user_id}`
                      : "",
            );
        } else {
            setFormData({
                id: "",
                user_id: "",
                post_status: Object.keys(postStatuses)[0] ?? "NORMAL",
                post_type: Object.keys(postTypes)[0] ?? "NORMAL",
                post_category: "",
                title: "",
                content: "",
                is_notice: false,
                created_at: new Date().toISOString().split("T")[0],
            });
            setUserSearch("");
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [selectedPost, isOpen]);

    const fetchUserSuggestions = async (keyword) => {
        try {
            const json = await ajax.get("/admin/users/search", { keyword });
            if (json.success) {
                setUserSuggestions(json.data || []);
                setShowSuggestions(true);
            } else {
                setUserSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error("User search failed", error);
            setUserSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleUserSearchChange = (value) => {
        setUserSearch(value);
        setFormData((prev) => ({
            ...prev,
            user_id: "",
        }));

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (value.trim().length >= 2) {
            searchTimeout.current = setTimeout(() => {
                fetchUserSuggestions(value.trim());
            }, 250);
        } else {
            setUserSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectUser = (user) => {
        setFormData((prev) => ({
            ...prev,
            user_id: user.id,
        }));
        setUserSearch(`${user.name} (${user.email})`);
        setUserSuggestions([]);
        setShowSuggestions(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleContentChange = (value) => {
        // console.log("content value:", value);
        setFormData((prev) => ({
            // ✅ prev 사용
            ...prev,
            content: value,
        }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // console.log("formData:", formData);
        onSubmit(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Post Modal"
            overlayClassName="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl mx-auto outline-none"
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
                        <div className="relative space-y-2">
                            <label className="text-sm font-medium text-slate-600">
                                회원정보
                            </label>
                            <input
                                type="text"
                                name="user_search"
                                value={userSearch}
                                onChange={(e) =>
                                    handleUserSearchChange(e.target.value)
                                }
                                autoComplete="off"
                                placeholder="회원 이름 또는 이메일 검색"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                            <input
                                type="hidden"
                                name="user_id"
                                value={formData.user_id}
                            />
                            {showSuggestions && userSuggestions.length > 0 && (
                                <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                                    {userSuggestions.map((user) => (
                                        <li
                                            key={user.id}
                                            onClick={() => selectUser(user)}
                                            className="cursor-pointer px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"
                                        >
                                            <div className="font-medium">
                                                {user.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {user.email} · ID {user.id}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">
                                작성일
                            </label>
                            <input
                                type="date"
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
                                    <option value="NORMAL">정상</option>
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
                        </div>
                    </div>

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
                        <label className="text-sm font-medium text-slate-600">
                            내용
                        </label>
                        <div className="rounded-2xl border border-slate-300 bg-white shadow-sm">
                            <ReactQuill
                                value={formData.content}
                                onChange={handleContentChange}
                                className="rounded-2xl"
                            />
                        </div>
                    </div>

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
