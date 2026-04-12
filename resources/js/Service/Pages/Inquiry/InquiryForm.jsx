import React from "react";
import { Link, useForm, usePage } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";

const TYPE_OPTIONS = [
    { value: "SUPPORT",     label: "1:1 문의" },
    { value: "PARTNERSHIP", label: "제휴 문의" },
];

export default function InquiryForm({ type: initialType }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const { data, setData, post, processing, errors } = useForm({
        type:    initialType ?? "SUPPORT",
        name:    user?.name  ?? "",
        email:   user?.email ?? "",
        phone:   "",
        title:   "",
        content: "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        post("/inquiry");
    }

    return (
        <ServiceLayout>
            {/* 브레드크럼 */}
            <div className="flex items-center gap-2 mb-4">
                <Link href="/" className="text-sm text-slate-400 hover:text-blue-500 transition">홈</Link>
                <span className="text-slate-300 text-sm">›</span>
                <span className="text-sm font-semibold text-slate-700">문의하기</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* 헤더 */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h1 className="text-base font-bold text-slate-800">문의하기</h1>
                    <p className="text-xs text-slate-400 mt-0.5">빠른 시일 내에 이메일로 답변 드리겠습니다.</p>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* 문의 유형 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">문의 유형</label>
                        <div className="flex gap-3">
                            {TYPE_OPTIONS.map((opt) => (
                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="type"
                                        value={opt.value}
                                        checked={data.type === opt.value}
                                        onChange={() => setData("type", opt.value)}
                                        className="accent-blue-600"
                                    />
                                    <span className="text-sm text-slate-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 이름 / 이메일 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                이름 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="홍길동"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                이메일 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                placeholder="example@email.com"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                        </div>
                    </div>

                    {/* 연락처 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">연락처</label>
                        <input
                            type="text"
                            value={data.phone}
                            onChange={(e) => setData("phone", e.target.value)}
                            placeholder="010-0000-0000 (선택)"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                        />
                    </div>

                    {/* 제목 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            제목 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            placeholder="문의 제목을 입력해주세요"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    {/* 내용 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            내용 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={data.content}
                            onChange={(e) => setData("content", e.target.value)}
                            placeholder="문의 내용을 자세히 입력해주세요."
                            rows={7}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition resize-none"
                        />
                        <div className="flex justify-between mt-1">
                            {errors.content
                                ? <p className="text-xs text-red-500">{errors.content}</p>
                                : <span />
                            }
                            <span className="text-xs text-slate-400">{data.content.length} / 5000</span>
                        </div>
                    </div>

                    {/* 제출 */}
                    <div className="pt-1">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
                        >
                            {processing ? "제출 중..." : "문의 제출"}
                        </button>
                    </div>
                </form>
            </div>
        </ServiceLayout>
    );
}
