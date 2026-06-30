import React, { useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { http } from "@/Utils/http";
import type { User, SharedProps } from "@/types";

function LoginForm() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        http.post("/login", form, {
            onLoading: setLoading,
            onError: (errs) => setErrors(errs as Record<string, string>),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2.5 px-4 py-3">
            <div>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="이메일"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                    autoComplete="email" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
                <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)}
                    placeholder="비밀번호"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                    autoComplete="current-password" />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <button type="submit" disabled={loading}
                className="w-full text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 rounded transition">
                {loading ? "로그인 중..." : "로그인"}
            </button>
            <div className="text-center">
                <Link href="/register" className="text-xs text-blue-500 hover:text-blue-700 transition">
                    아직 계정이 없으신가요? 회원가입
                </Link>
            </div>
        </form>
    );
}

function RegisterForm() {
    const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        http.post("/register", form, {
            onLoading: setLoading,
            onError: (errs) => setErrors(errs as Record<string, string>),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2.5 px-4 py-3">
            <div>
                <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                    placeholder="닉네임"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                    autoComplete="username" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                    placeholder="이메일"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                    autoComplete="email" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
                <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)}
                    placeholder="비밀번호"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                    autoComplete="new-password" />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <div>
                <input type="password" value={form.password_confirmation} onChange={(e) => set("password_confirmation", e.target.value)}
                    placeholder="비밀번호 확인"
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
                    autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading}
                className="w-full text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 rounded transition">
                {loading ? "가입 중..." : "무료 가입"}
            </button>
        </form>
    );
}

interface UserPanelProps {
    user: User;
}

function UserPanel({ user }: UserPanelProps) {
    return (
        <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-600">{user.name?.[0] ?? "?"}</span>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
            </div>
            <Link href="/mypage?tab=points"
                className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-lg hover:bg-amber-100 transition">
                <span className="text-xs text-slate-500">보유 포인트</span>
                <span className="text-sm font-bold text-amber-500">{(user.point ?? 0).toLocaleString()}<span className="text-[10px] font-normal text-slate-400 ml-0.5">P</span></span>
            </Link>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
                <Link href="/mypage?tab=posts" className="text-center py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition">내 게시글</Link>
                <Link href="/mypage?tab=comments" className="text-center py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition">내 댓글</Link>
                <Link href="/mypage?tab=scraps" className="text-center py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition">내 스크랩</Link>
                <Link href="/mypage?tab=inquiries" className="text-center py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition">내 문의</Link>
                <Link href="/mypage?tab=password" className="col-span-2 text-center py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition">비밀번호 변경</Link>
            </div>
            <Link href="/logout" method="post" as="button"
                className="w-full text-sm text-slate-500 hover:text-red-500 border border-gray-200 rounded py-1.5 transition">
                로그아웃
            </Link>
        </div>
    );
}

export default function AuthWidget() {
    const { auth } = usePage<SharedProps>().props;
    const [tab, setTab] = useState<"login" | "register">("login");

    if (auth?.user) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-slate-50">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">내 정보</span>
                </div>
                <UserPanel user={auth.user} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
                <button onClick={() => setTab("login")}
                    className={`flex-1 text-xs font-semibold py-2.5 transition ${tab === "login" ? "text-blue-600 border-b-2 border-blue-500 bg-white" : "text-slate-500 hover:text-slate-700 bg-slate-50"}`}>
                    로그인
                </button>
                <button onClick={() => setTab("register")}
                    className={`flex-1 text-xs font-semibold py-2.5 transition ${tab === "register" ? "text-blue-600 border-b-2 border-blue-500 bg-white" : "text-slate-500 hover:text-slate-700 bg-slate-50"}`}>
                    회원가입
                </button>
            </div>
            {tab === "login" ? <LoginForm /> : <RegisterForm />}
        </div>
    );
}
