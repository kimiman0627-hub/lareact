import React, { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";

interface SavedBannerProps {
    message: string;
}

function SavedBanner({ message }: SavedBannerProps) {
    return (
        <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {message}
        </span>
    );
}

interface FieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

interface AdminProfileProps {
    admin: any;
}

export default function AdminProfile({ admin }: AdminProfileProps) {
    const { auth } = usePage<any>().props;

    /* ── 프로필 폼 ── */
    const profile = useForm({
        name:  admin?.name  ?? "",
        email: admin?.email ?? "",
    });

    const [profileSaved, setProfileSaved] = useState<boolean>(false);

    function submitProfile(e: React.FormEvent) {
        e.preventDefault();
        profile.post("/admin/settings/profile", {
            preserveScroll: true,
            onSuccess: () => {
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 3000);
            },
        });
    }

    /* ── 비밀번호 폼 ── */
    const pwd = useForm({
        current_password:      "",
        password:              "",
        password_confirmation: "",
    });

    const [passwordSaved, setPasswordSaved] = useState<boolean>(false);

    function submitPassword(e: React.FormEvent) {
        e.preventDefault();
        pwd.post("/admin/settings/password", {
            preserveScroll: true,
            onSuccess: () => {
                pwd.reset();
                setPasswordSaved(true);
                setTimeout(() => setPasswordSaved(false), 3000);
            },
        });
    }

    const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition";
    const inputErrCls = "w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition";

    return (
        <AdminLayout>
            <div className="p-6 max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">관리자 프로필</h1>
                    <p className="text-sm text-slate-400 mt-1">관리자 계정 정보와 비밀번호를 변경합니다.</p>
                </div>

                {/* ── 프로필 정보 ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </span>
                        <span className="font-bold text-slate-700">기본 정보</span>
                    </div>

                    <form onSubmit={submitProfile} className="space-y-4">
                        <Field label="이름" error={profile.errors.name}>
                            <input
                                type="text"
                                value={profile.data.name}
                                onChange={e => profile.setData("name", e.target.value)}
                                className={profile.errors.name ? inputErrCls : inputCls}
                                placeholder="관리자 이름"
                            />
                        </Field>

                        <Field label="이메일" error={profile.errors.email}>
                            <input
                                type="email"
                                value={profile.data.email}
                                onChange={e => profile.setData("email", e.target.value)}
                                className={profile.errors.email ? inputErrCls : inputCls}
                                placeholder="admin@example.com"
                            />
                        </Field>

                        <div className="flex items-center gap-3 pt-1">
                            <button
                                type="submit"
                                disabled={profile.processing}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition"
                            >
                                {profile.processing ? "저장 중..." : "저장"}
                            </button>
                            {profileSaved && <SavedBanner message="저장되었습니다." />}
                        </div>
                    </form>
                </div>

                {/* ── 비밀번호 변경 ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        <span className="font-bold text-slate-700">비밀번호 변경</span>
                    </div>

                    <form onSubmit={submitPassword} className="space-y-4">
                        <Field label="현재 비밀번호" error={pwd.errors.current_password}>
                            <input
                                type="password"
                                value={pwd.data.current_password}
                                onChange={e => pwd.setData("current_password", e.target.value)}
                                className={pwd.errors.current_password ? inputErrCls : inputCls}
                                placeholder="현재 비밀번호 입력"
                                autoComplete="current-password"
                            />
                        </Field>

                        <Field label="새 비밀번호" error={pwd.errors.password}>
                            <input
                                type="password"
                                value={pwd.data.password}
                                onChange={e => pwd.setData("password", e.target.value)}
                                className={pwd.errors.password ? inputErrCls : inputCls}
                                placeholder="8자 이상"
                                autoComplete="new-password"
                            />
                        </Field>

                        <Field label="새 비밀번호 확인" error={pwd.errors.password_confirmation}>
                            <input
                                type="password"
                                value={pwd.data.password_confirmation}
                                onChange={e => pwd.setData("password_confirmation", e.target.value)}
                                className={pwd.errors.password_confirmation ? inputErrCls : inputCls}
                                placeholder="새 비밀번호 재입력"
                                autoComplete="new-password"
                            />
                        </Field>

                        <div className="flex items-center gap-3 pt-1">
                            <button
                                type="submit"
                                disabled={pwd.processing}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition"
                            >
                                {pwd.processing ? "변경 중..." : "비밀번호 변경"}
                            </button>
                            {passwordSaved && <SavedBanner message="비밀번호가 변경되었습니다." />}
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
