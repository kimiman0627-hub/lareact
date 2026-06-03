import React, { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";

interface SectionCardProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    children: React.ReactNode;
}

function SectionCard({ icon, iconBg, title, children }: SectionCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${iconBg}`}>
                    {icon}
                </span>
                <span className="font-bold text-slate-700">{title}</span>
            </div>
            {children}
        </div>
    );
}

interface SaveRowProps {
    processing: boolean;
    saved: boolean;
}

function SaveRow({ processing, saved }: SaveRowProps) {
    return (
        <div className="mt-5 flex items-center gap-3">
            <button
                type="submit"
                disabled={processing}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition"
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
    );
}

// ── 개인정보 보호책임자 섹션 ────────────────────────────────────────────────
interface PrivacyOfficerSectionProps {
    settings: any;
}

function PrivacyOfficerSection({ settings }: PrivacyOfficerSectionProps) {
    const { data, setData, post, processing, errors } = useForm({
        privacy_officer_name:  settings.privacy_officer_name  ?? "",
        privacy_officer_email: settings.privacy_officer_email ?? "",
    });
    const [saved, setSaved] = useState<boolean>(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post("/admin/settings/site", {
            onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
        });
    }

    return (
        <form onSubmit={handleSubmit}>
            <SectionCard
                iconBg="bg-violet-100 text-violet-600"
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                }
                title="개인정보 보호책임자"
            >
                <p className="text-xs text-slate-400 mb-4">
                    개인정보처리방침 페이지에 표시됩니다.
                </p>
                <div className="max-w-md space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">책임자 이름</label>
                        <input
                            type="text"
                            value={data.privacy_officer_name}
                            onChange={(e) => setData("privacy_officer_name", e.target.value)}
                            placeholder="예: KRLived 운영팀"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.privacy_officer_name && (
                            <p className="mt-1 text-xs text-red-500">{errors.privacy_officer_name}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
                        <input
                            type="email"
                            value={data.privacy_officer_email}
                            onChange={(e) => setData("privacy_officer_email", e.target.value)}
                            placeholder="예: contact@example.com"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.privacy_officer_email && (
                            <p className="mt-1 text-xs text-red-500">{errors.privacy_officer_email}</p>
                        )}
                    </div>
                </div>
                <SaveRow processing={processing} saved={saved} />
            </SectionCard>
        </form>
    );
}

// ── 코드 삽입 섹션 ──────────────────────────────────────────────────────────
interface CodeInjectionSectionProps {
    settings: any;
}

function CodeInjectionSection({ settings }: CodeInjectionSectionProps) {
    const { data, setData, post, processing, errors } = useForm({
        head_code:   settings.head_code   ?? "",
        footer_code: settings.footer_code ?? "",
    });
    const [saved, setSaved] = useState<boolean>(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post("/admin/settings/site", {
            onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* HEAD */}
            <SectionCard
                iconBg="bg-blue-100 text-blue-600"
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                }
                title="&lt;head&gt; 영역 코드"
            >
                <p className="text-xs text-slate-400 mb-3">
                    &lt;/head&gt; 바로 위에 삽입됩니다. 메타태그, 애드센스 인증 코드, GA 스크립트 등을 입력하세요.
                </p>
                <textarea
                    value={data.head_code}
                    onChange={(e) => setData("head_code", e.target.value)}
                    rows={8}
                    spellCheck={false}
                    className="w-full font-mono text-xs bg-slate-900 text-green-300 border border-slate-700 rounded-xl px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
                    placeholder="<!-- 여기에 HTML / script 코드를 입력하세요 -->"
                />
                {errors.head_code && <p className="mt-1 text-xs text-red-500">{errors.head_code}</p>}
            </SectionCard>

            {/* FOOTER */}
            <SectionCard
                iconBg="bg-emerald-100 text-emerald-600"
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                    </svg>
                }
                title="&lt;body&gt; 하단 코드"
            >
                <p className="text-xs text-slate-400 mb-3">
                    &lt;/body&gt; 바로 위에 삽입됩니다. 광고 스크립트, 채팅 위젯, 트래킹 코드 등을 입력하세요.
                </p>
                <textarea
                    value={data.footer_code}
                    onChange={(e) => setData("footer_code", e.target.value)}
                    rows={8}
                    spellCheck={false}
                    className="w-full font-mono text-xs bg-slate-900 text-green-300 border border-slate-700 rounded-xl px-4 py-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
                    placeholder="<!-- 여기에 HTML / script 코드를 입력하세요 -->"
                />
                {errors.footer_code && <p className="mt-1 text-xs text-red-500">{errors.footer_code}</p>}
            </SectionCard>

            <SaveRow processing={processing} saved={saved} />
        </form>
    );
}

interface SiteSettingsProps {
    settings?: any;
}

export default function SiteSettings({ settings = {} }: SiteSettingsProps) {
    const { auth } = usePage<any>().props;

    return (
        <AdminLayout>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">사이트 설정</h1>
                    <p className="text-sm text-slate-400 mt-1">서비스 운영에 필요한 기본 설정을 관리합니다.</p>
                </div>

                <div className="space-y-6">
                    <PrivacyOfficerSection settings={settings} />
                    <CodeInjectionSection settings={settings} />
                </div>
            </div>
        </AdminLayout>
    );
}
