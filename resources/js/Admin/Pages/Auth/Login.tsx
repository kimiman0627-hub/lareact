import React from "react";
import { useForm } from "@inertiajs/react";
import AdminIcon from "@/Admin/Components/Common/AdminIcon";

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post("/admin/login", { onFinish: () => setData("password", "") });
    };

    const error = errors.email || errors.password;

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4">

            {/* 은은한 배경 장식 */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-sky-200/40 blur-3xl" />

            <div className="relative w-full max-w-sm">
                <div className="mb-8 text-center select-none">
                    <div className="inline-flex items-baseline">
                        <span className="text-3xl font-extrabold tracking-tight text-sky-500">KR</span>
                        <span className="text-3xl font-extrabold tracking-tight text-slate-900">LIVED</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">관리자 페이지에 로그인하세요</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
                    <form onSubmit={submit} className="space-y-5" noValidate>
                        {error && (
                            <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-slate-700">
                                이메일
                            </label>
                            <div className="relative">
                                <AdminIcon name="mailInput" className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="username"
                                    autoFocus
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    placeholder="admin@example.com"
                                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-slate-700">
                                비밀번호
                            </label>
                            <div className="relative">
                                <AdminIcon name="lock" className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    placeholder="••••••••"
                                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !data.email || !data.password}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing && (
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                                    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                            )}
                            {processing ? "로그인 중..." : "로그인"}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-[13px] text-slate-400">
                    <a href="/" className="transition hover:text-slate-600">← 사이트로 돌아가기</a>
                </p>
            </div>
        </div>
    );
}
