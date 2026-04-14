import React, { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";

function CodeArea({ label, description, name, value, onChange }) {
    return (
        <div className="space-y-2">
            <div>
                <label className="block text-sm font-bold text-slate-700">{label}</label>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows={10}
                spellCheck={false}
                className="w-full font-mono text-xs bg-slate-900 text-green-300 border border-slate-700 rounded-xl px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
                placeholder={`<!-- 여기에 HTML / script 코드를 입력하세요 -->`}
            />
        </div>
    );
}

export default function SiteSettings({ settings = {} }) {
    const { auth } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        head_code:   settings.head_code   ?? "",
        footer_code: settings.footer_code ?? "",
    });

    const [saved, setSaved] = useState(false);

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/settings/site", {
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            },
        });
    }

    return (
        <AdminLayout user={auth?.admin}>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">사이트 설정</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        서비스 페이지 HTML에 삽입할 코드를 설정합니다. 애드센스, 분석 스크립트 등을 입력할 수 있습니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* HEAD 코드 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                            </span>
                            <span className="font-bold text-slate-700">&lt;head&gt; 영역 코드</span>
                        </div>
                        <CodeArea
                            label=""
                            description="</head> 바로 위에 삽입됩니다. 메타태그, 애드센스 인증 코드, GA 스크립트 등을 입력하세요."
                            name="head_code"
                            value={data.head_code}
                            onChange={(e) => setData("head_code", e.target.value)}
                        />
                        {errors.head_code && (
                            <p className="mt-1 text-xs text-red-500">{errors.head_code}</p>
                        )}
                    </div>

                    {/* FOOTER 코드 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                                </svg>
                            </span>
                            <span className="font-bold text-slate-700">&lt;body&gt; 하단 코드</span>
                        </div>
                        <CodeArea
                            label=""
                            description="</body> 바로 위에 삽입됩니다. 광고 스크립트, 채팅 위젯, 트래킹 코드 등을 입력하세요."
                            name="footer_code"
                            value={data.footer_code}
                            onChange={(e) => setData("footer_code", e.target.value)}
                        />
                        {errors.footer_code && (
                            <p className="mt-1 text-xs text-red-500">{errors.footer_code}</p>
                        )}
                    </div>

                    {/* 저장 버튼 */}
                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition"
                        >
                            {processing ? "저장 중..." : "저장"}
                        </button>
                        {saved && (
                            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                저장되었습니다.
            </span>
                        )}
                    </div>

                </form>

                {/* 미리보기 */}
                {(data.head_code || data.footer_code) && (
                    <div className="mt-8 space-y-4">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">현재 입력된 코드 미리보기</h2>
                        {data.head_code && (
                            <div className="bg-slate-900 rounded-xl p-4">
                                <p className="text-xs text-slate-500 mb-2">HEAD 영역</p>
                                <pre className="text-xs text-green-300 whitespace-pre-wrap break-all font-mono overflow-x-auto">
                                    {data.head_code}
                                </pre>
                            </div>
                        )}
                        {data.footer_code && (
                            <div className="bg-slate-900 rounded-xl p-4">
                                <p className="text-xs text-slate-500 mb-2">BODY 하단</p>
                                <pre className="text-xs text-green-300 whitespace-pre-wrap break-all font-mono overflow-x-auto">
                                    {data.footer_code}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
