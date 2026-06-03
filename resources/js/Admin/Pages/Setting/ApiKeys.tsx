import React, { useState, useEffect } from "react";
import { useForm, usePage, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";

// ── 공통 컴포넌트 ────────────────────────────────────────────────────────────

function FlashMessage() {
    const { flash = {} } = usePage<any>().props;
    const [visible, setVisible] = useState<boolean>(false);

    useEffect(() => {
        if (flash.success || flash.error) {
            setVisible(true);
            const t = setTimeout(() => setVisible(false), 5000);
            return () => clearTimeout(t);
        }
    }, [flash.success, flash.error]);

    if (!visible || (!flash.success && !flash.error)) return null;

    const isSuccess = !!flash.success;
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium mb-6 ${
            isSuccess
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
        }`}>
            {isSuccess ? (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ) : (
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
            {flash.success || flash.error}
        </div>
    );
}

interface SectionHeaderProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
}

function SectionHeader({ icon, title, description }: SectionHeaderProps) {
    return (
        <div className="flex items-start gap-3 mb-5 pb-4 border-b border-gray-100">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 shrink-0 mt-0.5">
                {icon}
            </span>
            <div>
                <p className="font-bold text-slate-700">{title}</p>
                {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
        </div>
    );
}

interface TextInputProps {
    label: string;
    description?: string;
    link?: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    mono?: boolean;
}

function TextInput({ label, description, link, value, onChange, placeholder, mono = false }: TextInputProps) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
                <label className="block text-sm font-semibold text-slate-700">{label}</label>
                {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 transition shrink-0">
                        발급받기
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                )}
            </div>
            {description && <p className="text-xs text-slate-400">{description}</p>}
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder ?? ""}
                className={`w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${mono ? "font-mono" : ""}`}
            />
        </div>
    );
}

interface SecretInputProps {
    label: string;
    description?: string;
    link?: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    savedText?: any;
}

function SecretInput({ label, description, link, value, onChange, placeholder, savedText }: SecretInputProps) {
    const [show, setShow] = useState<boolean>(false);
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
                <label className="block text-sm font-semibold text-slate-700">{label}</label>
                {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 transition shrink-0">
                        발급받기
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                )}
            </div>
            {description && (
                <p className="text-xs text-slate-400">
                    {description}
                    {savedText && (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            저장됨
                        </span>
                    )}
                </p>
            )}
            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder ?? ""}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button type="button" onClick={() => setShow((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-blue-600 px-2 py-0.5 rounded">
                    {show ? "숨기기" : "보기"}
                </button>
            </div>
        </div>
    );
}

interface SaveButtonProps {
    processing: boolean;
}

function SaveButton({ processing }: SaveButtonProps) {
    return (
        <button type="submit" disabled={processing}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition">
            {processing ? "저장 중..." : "저장"}
        </button>
    );
}

interface SavedBadgeProps {
    show: boolean;
}

function SavedBadge({ show }: SavedBadgeProps) {
    if (!show) return null;
    return (
        <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            저장되었습니다.
        </span>
    );
}

// ── Kakao 섹션 ──────────────────────────────────────────────────────────────
interface KakaoSectionProps {
    settings: any;
}

function KakaoSection({ settings }: KakaoSectionProps) {
    const { data, setData, post, processing } = useForm({
        kakao_js_key: settings.kakao_js_key ?? "",
    });
    const [saved, setSaved] = useState<boolean>(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post("/admin/settings/api-keys", {
            onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
        });
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <SectionHeader
                icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.567 1.522 4.83 3.84 6.238l-.98 3.636a.5.5 0 0 0 .736.548L9.96 18.4A11.3 11.3 0 0 0 12 18.5c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
                    </svg>
                }
                title="Kakao"
                description="카카오 공유하기 등 Kakao SDK 기능에 사용됩니다."
            />
            <div className="max-w-md">
                <TextInput
                    label="JavaScript App Key"
                    description="내 애플리케이션 → 앱 키 → JavaScript 키"
                    link="https://developers.kakao.com/console/app"
                    value={data.kakao_js_key}
                    onChange={(e) => setData("kakao_js_key", e.target.value)}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    mono
                />
            </div>
            <div className="mt-5 flex items-center gap-3">
                <SaveButton processing={processing} />
                <SavedBadge show={saved} />
            </div>
        </form>
    );
}

// ── Google Blogger 설정 체크리스트 ──────────────────────────────────────────
interface SetupChecklistProps {
    clientId: string;
    hasSecret: any;
    hasToken: any;
    callbackUrl: string;
}

function SetupChecklist({ clientId, hasSecret, hasToken, callbackUrl }: SetupChecklistProps) {
    const projectNumber = clientId ? (clientId.match(/^(\d+)-/) || [])[1] : null;

    const gc = (path: string) =>
        projectNumber
            ? `https://console.cloud.google.com${path}?project=${projectNumber}`
            : `https://console.cloud.google.com${path}`;

    const steps = [
        {
            done: !!projectNumber,
            label: "Blogger API 활성화",
            description: "Google Cloud 프로젝트에서 Blogger API를 사용 설정해야 합니다.",
            link: gc("/apis/api/blogger.googleapis.com/overview"),
            linkText: "Blogger API 사용 설정 →",
        },
        {
            done: !!projectNumber,
            label: "OAuth 동의 화면 구성",
            description: "외부 앱 유형으로 생성, 테스트 사용자에 본인 계정 추가.",
            link: gc("/apis/credentials/consent"),
            linkText: "OAuth 동의 화면 열기 →",
        },
        {
            done: !!projectNumber,
            label: "OAuth 클라이언트 ID 생성 (웹 애플리케이션)",
            description: (
                <>
                    승인된 리디렉션 URI에 아래 주소를 추가하세요.
                    <span
                        className="ml-1 inline-flex items-center gap-1 bg-slate-200 px-2 py-0.5 rounded font-mono text-slate-700 cursor-pointer hover:bg-slate-300 transition select-all"
                        onClick={() => navigator.clipboard?.writeText(callbackUrl)}
                        title="클릭하여 복사"
                    >
                        {callbackUrl}
                        <svg className="w-3 h-3 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </span>
                </>
            ),
            link: gc("/apis/credentials"),
            linkText: "사용자 인증 정보 열기 →",
        },
        {
            done: !!clientId && hasSecret,
            label: "Client ID · Client Secret 입력 후 저장",
            description: "위 폼에 발급받은 값을 입력하고 저장 버튼을 클릭하세요.",
            link: null,
            linkText: undefined,
        },
        {
            done: hasToken,
            label: "Google 계정 연결 완료",
            description: "위 '구글 계정 연결' 버튼을 클릭해 OAuth 인증을 완료하세요.",
            link: null,
            linkText: undefined,
        },
    ];

    const doneCount = steps.filter((s) => s.done).length;
    const allDone   = doneCount === steps.length;

    return (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className={`flex items-center justify-between px-4 py-2.5 text-xs font-semibold ${
                allDone ? "bg-emerald-50 text-emerald-700 border-b border-emerald-100"
                        : "bg-slate-50 text-slate-600 border-b border-slate-200"
            }`}>
                <span>설정 체크리스트</span>
                <span className={allDone ? "text-emerald-500" : "text-slate-400"}>
                    {doneCount} / {steps.length} 완료
                </span>
            </div>
            <div className="divide-y divide-slate-100">
                {steps.map((step, i) => (
                    <div key={i} className={`flex gap-3 px-4 py-3 ${step.done ? "bg-white" : "bg-amber-50/40"}`}>
                        {/* 상태 아이콘 */}
                        <div className="shrink-0 mt-0.5">
                            {step.done ? (
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100">
                                    <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold">
                                    {i + 1}
                                </span>
                            )}
                        </div>
                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold ${step.done ? "text-slate-500 line-through decoration-slate-300" : "text-slate-700"}`}>
                                {step.label}
                            </p>
                            {!step.done && (
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
                            )}
                            {!step.done && step.link && (
                                <a href={step.link} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition">
                                    {step.linkText}
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Google Blogger 섹션 ─────────────────────────────────────────────────────
interface BloggerSectionProps {
    settings: any;
}

function BloggerSection({ settings }: BloggerSectionProps) {
    const { data, setData, post, processing } = useForm({
        blogger_blog_id:        settings.blogger_blog_id       ?? "",
        blogger_client_id:      settings.blogger_client_id     ?? "",
        blogger_client_secret:  "",
        blogger_refresh_token:  "",
        blogger_min_hits:       settings.blogger_min_hits      ?? "100",
        blogger_limit:          settings.blogger_limit         ?? "5",
        blogger_days:           settings.blogger_days          ?? "7",
        blogger_enabled:        settings.blogger_enabled       ?? "0",
        blogger_schedule_type:  settings.blogger_schedule_type ?? "daily",
        blogger_schedule_time:  settings.blogger_schedule_time ?? "09:00",
    });
    const [saved, setSaved] = useState<boolean>(false);
    const [disconnecting, setDisconnecting] = useState<boolean>(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post("/admin/settings/api-keys", {
            onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
        });
    }

    function handleDisconnect() {
        if (!confirm("Google Blogger 연결을 해제하시겠습니까?")) return;
        setDisconnecting(true);
        router.post("/admin/settings/blogger/disconnect", {}, {
            onFinish: () => setDisconnecting(false),
        });
    }

    const callbackUrl = settings.blogger_callback_url ?? (window.location.origin + "/admin/settings/blogger/callback");

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <SectionHeader
                icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.5 3h-15A1.5 1.5 0 0 0 3 4.5v15A1.5 1.5 0 0 0 4.5 21h15a1.5 1.5 0 0 0 1.5-1.5v-15A1.5 1.5 0 0 0 19.5 3zm-5.25 13.5H9.75a.75.75 0 0 1 0-1.5h4.5a.75.75 0 0 1 0 1.5zm0-3H9.75a.75.75 0 0 1 0-1.5h4.5a.75.75 0 0 1 0 1.5zm0-3H9.75a.75.75 0 0 1 0-1.5h4.5a.75.75 0 0 1 0 1.5z"/>
                    </svg>
                }
                title="Google Blogger 자동 발행"
                description="조회수 높은 게시물을 Google Blogger에 자동으로 포스팅합니다."
            />

            {/* ── Google 계정 연결 상태 ── */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-6 ${
                settings.blogger_has_token
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-200"
            }`}>
                <div className="flex items-center gap-2.5">
                    {settings.blogger_has_token ? (
                        <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-sm font-semibold text-emerald-700">Google 계정 연결됨</span>
                            <span className="text-xs text-emerald-600">— Blogger 발행 가능</span>
                        </>
                    ) : (
                        <>
                            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                            <span className="text-sm font-semibold text-slate-600">Google 계정 미연결</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {settings.blogger_has_token ? (
                        <>
                            <a href="/admin/settings/blogger/auth"
                                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-300 hover:bg-emerald-100 rounded-lg transition">
                                재연결
                            </a>
                            <button onClick={handleDisconnect} disabled={disconnecting}
                                className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                                {disconnecting ? "해제 중..." : "연결 해제"}
                            </button>
                        </>
                    ) : (
                        <a href="/admin/settings/blogger/auth"
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Google 계정 연결
                        </a>
                    )}
                </div>
            </div>

            {/* ── 키 입력 폼 ── */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <TextInput
                        label="Blog ID"
                        description="관리 페이지 URL에 포함된 숫자 ID"
                        link="https://www.blogger.com/blog/posts"
                        value={data.blogger_blog_id}
                        onChange={(e) => setData("blogger_blog_id", e.target.value)}
                        placeholder="예: 1234567890"
                        mono
                    />
                    <TextInput
                        label="OAuth Client ID"
                        description="사용자 인증 정보 → OAuth 2.0 클라이언트 ID (웹 애플리케이션)"
                        link="https://console.cloud.google.com/apis/credentials"
                        value={data.blogger_client_id}
                        onChange={(e) => setData("blogger_client_id", e.target.value)}
                        placeholder="xxxxx.apps.googleusercontent.com"
                        mono
                    />
                    <SecretInput
                        label="OAuth Client Secret"
                        description="변경 시에만 입력하세요."
                        link="https://console.cloud.google.com/apis/credentials"
                        savedText={settings.blogger_has_secret}
                        value={data.blogger_client_secret}
                        onChange={(e) => setData("blogger_client_secret", e.target.value)}
                        placeholder={settings.blogger_has_secret ? "변경하지 않으면 비워두세요" : "GOCSPX-xxxxx"}
                    />
                </div>

                {/* 발행 옵션 */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                    <p className="text-xs font-semibold text-slate-500">발행 옵션</p>

                    {/* 자동 발행 ON/OFF */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                            <p className="text-sm font-semibold text-slate-700">자동 발행</p>
                            <p className="text-xs text-slate-400 mt-0.5">설정한 주기에 자동으로 게시물을 발행합니다</p>
                        </div>
                        <button type="button"
                            onClick={() => setData("blogger_enabled", data.blogger_enabled === "1" ? "0" : "1")}
                            className={`relative w-11 h-6 rounded-full transition-colors ${data.blogger_enabled === "1" ? "bg-blue-600" : "bg-slate-300"}`}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.blogger_enabled === "1" ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>

                    {/* 발행 주기 선택 */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">발행 주기</p>
                        <div className="flex gap-2">
                            {[
                                { value: "daily",  label: "하루 한 번", desc: "매일 지정 시각에 1회" },
                                { value: "hourly", label: "매시간",     desc: "매시 지정 분에 반복" },
                            ].map((opt) => (
                                <button key={opt.value} type="button"
                                    onClick={() => setData("blogger_schedule_type", opt.value)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl border text-left transition ${
                                        data.blogger_schedule_type === opt.value
                                            ? "bg-blue-50 border-blue-400 text-blue-700"
                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                                    }`}>
                                    <p className="text-sm font-semibold">{opt.label}</p>
                                    <p className="text-[11px] mt-0.5 opacity-70">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 max-w-sm">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">
                                {data.blogger_schedule_type === "hourly" ? "발행 분 (매시 :MM)" : "발행 시각"}
                            </label>
                            <p className="text-xs text-slate-400">
                                {data.blogger_schedule_type === "hourly"
                                    ? `매시 ${(data.blogger_schedule_time ?? "09:00").split(":")[1]}분에 발행`
                                    : "매일 이 시각에 자동 발행"}
                            </p>
                            <input type="time" value={data.blogger_schedule_time}
                                onChange={(e) => setData("blogger_schedule_time", e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">기준 기간 (일)</label>
                            <p className="text-xs text-slate-400">최근 N일 이내 게시물만 대상</p>
                            <input type="number" min="1" max="365" value={data.blogger_days}
                                onChange={(e) => setData("blogger_days", e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">1회 최대 발행 수</label>
                            <p className="text-xs text-slate-400">한 번에 발행할 게시물 수</p>
                            <input type="number" min="1" max="50" value={data.blogger_limit}
                                onChange={(e) => setData("blogger_limit", e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">최소 조회수</label>
                            <p className="text-xs text-slate-400">이 이상인 게시물만 발행</p>
                            <input type="number" min="0" value={data.blogger_min_hits}
                                onChange={(e) => setData("blogger_min_hits", e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>

                {/* 설정 체크리스트 */}
                <SetupChecklist
                    clientId={data.blogger_client_id}
                    hasSecret={settings.blogger_has_secret}
                    hasToken={settings.blogger_has_token}
                    callbackUrl={callbackUrl}
                />

                <div className="flex items-center gap-3">
                    <SaveButton processing={processing} />
                    <SavedBadge show={saved} />
                </div>
            </form>
        </div>
    );
}

// ── Threads 섹션 ────────────────────────────────────────────────────────────
interface ThreadsSectionProps {
    settings: any;
}

function ThreadsSection({ settings }: ThreadsSectionProps) {
    const { data, setData, post, processing } = useForm({
        threads_app_id:        settings.threads_app_id        ?? "",
        threads_app_secret:    "",
        threads_min_hits:      settings.threads_min_hits      ?? "50",
        threads_limit:         settings.threads_limit         ?? "3",
        threads_days:          settings.threads_days          ?? "7",
        threads_enabled:       settings.threads_enabled       ?? "0",
        threads_schedule_type: settings.threads_schedule_type ?? "daily",
        threads_schedule_time: settings.threads_schedule_time ?? "10:00",
    });
    const [saved, setSaved]               = useState<boolean>(false);
    const [disconnecting, setDisconnecting] = useState<boolean>(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post("/admin/settings/api-keys", {
            onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
        });
    }

    function handleDisconnect() {
        if (!confirm("Threads 연결을 해제하시겠습니까?\n액세스 토큰과 User ID가 삭제됩니다.")) return;
        setDisconnecting(true);
        router.post("/admin/settings/threads/disconnect", {}, {
            onFinish: () => setDisconnecting(false),
        });
    }

    const ThreadsIcon = () => (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.29 8.29 0 004.83 1.53v-3.4a4.85 4.85 0 01-1.06-.19z"/>
        </svg>
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <SectionHeader
                icon={<ThreadsIcon />}
                title="Threads 자동 발행"
                description="조회수 높은 게시물을 Threads에 자동으로 포스팅합니다. (제목 + AI요약 + URL)"
            />

            {/* 연결 상태 */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-6 ${
                settings.threads_has_token
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-200"
            }`}>
                <div className="flex items-center gap-2.5">
                    {settings.threads_has_token ? (
                        <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-sm font-semibold text-emerald-700">Threads 연결됨</span>
                            {settings.threads_user_id && (
                                <span className="text-xs text-emerald-600 font-mono">— ID: {settings.threads_user_id}</span>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                            <span className="text-sm font-semibold text-slate-600">Threads 미연결</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {settings.threads_has_token ? (
                        <>
                            <a href="/admin/settings/threads/auth"
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-lg transition">
                                재연결
                            </a>
                            <button onClick={handleDisconnect} disabled={disconnecting}
                                className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                                {disconnecting ? "해제 중..." : "연결 해제"}
                            </button>
                        </>
                    ) : (
                        <a href="/admin/settings/threads/auth"
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Threads 계정 연결
                        </a>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* App ID / App Secret */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <TextInput
                        label="App ID"
                        description="Meta for Developers → 해당 앱 → 설정 → 기본"
                        link="https://developers.facebook.com/apps"
                        value={data.threads_app_id}
                        onChange={(e) => setData("threads_app_id", e.target.value)}
                        placeholder="123456789"
                        mono
                    />
                    <SecretInput
                        label="App Secret"
                        description="변경 시에만 입력하세요."
                        link="https://developers.facebook.com/apps"
                        savedText={settings.threads_has_app_secret}
                        value={data.threads_app_secret}
                        onChange={(e) => setData("threads_app_secret", e.target.value)}
                        placeholder={settings.threads_has_app_secret ? "변경하지 않으면 비워두세요" : "abc123..."}
                    />
                </div>
                <p className="text-[11px] text-slate-400 -mt-3">저장 후 위 "Threads 계정 연결" 버튼을 클릭하면 OAuth 인증으로 자동 토큰 발급됩니다.</p>

                {/* 발행 옵션 */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                    <p className="text-xs font-semibold text-slate-500">발행 옵션</p>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                            <p className="text-sm font-semibold text-slate-700">자동 발행</p>
                            <p className="text-xs text-slate-400 mt-0.5">설정한 주기에 자동으로 게시물을 Threads에 발행합니다</p>
                        </div>
                        <button type="button"
                            onClick={() => setData("threads_enabled", data.threads_enabled === "1" ? "0" : "1")}
                            className={`relative w-11 h-6 rounded-full transition-colors ${data.threads_enabled === "1" ? "bg-black" : "bg-slate-300"}`}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.threads_enabled === "1" ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">발행 주기</p>
                        <div className="flex gap-2">
                            {[
                                { value: "daily",  label: "하루 한 번", desc: "매일 지정 시각에 1회" },
                                { value: "hourly", label: "매시간",     desc: "매시 지정 분에 반복" },
                            ].map((opt) => (
                                <button key={opt.value} type="button"
                                    onClick={() => setData("threads_schedule_type", opt.value)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl border text-left transition ${
                                        data.threads_schedule_type === opt.value
                                            ? "bg-slate-900 border-slate-900 text-white"
                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                                    }`}>
                                    <p className="text-sm font-semibold">{opt.label}</p>
                                    <p className="text-[11px] mt-0.5 opacity-70">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 max-w-sm">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">
                                {data.threads_schedule_type === "hourly" ? "발행 분 (매시 :MM)" : "발행 시각"}
                            </label>
                            <p className="text-xs text-slate-400">
                                {data.threads_schedule_type === "hourly"
                                    ? `매시 ${(data.threads_schedule_time ?? "10:00").split(":")[1]}분에 발행`
                                    : "매일 이 시각에 자동 발행"}
                            </p>
                            <input type="time" value={data.threads_schedule_time}
                                onChange={(e) => setData("threads_schedule_time", e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">기준 기간 (일)</label>
                            <p className="text-xs text-slate-400">최근 N일 이내 게시물만 대상</p>
                            <input type="number" min="1" max="365" value={data.threads_days}
                                onChange={(e) => setData("threads_days", e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">1회 최대 발행 수</label>
                            <p className="text-xs text-slate-400">한 번에 발행할 게시물 수</p>
                            <input type="number" min="1" max="50" value={data.threads_limit}
                                onChange={(e) => setData("threads_limit", e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700">최소 조회수</label>
                            <p className="text-xs text-slate-400">이 이상인 게시물만 발행</p>
                            <input type="number" min="0" value={data.threads_min_hits}
                                onChange={(e) => setData("threads_min_hits", e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing}
                        className="px-5 py-2 bg-black hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition">
                        {processing ? "저장 중..." : "저장"}
                    </button>
                    <SavedBadge show={saved} />
                </div>
            </form>
        </div>
    );
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────
interface ApiKeysProps {
    settings?: any;
}

export default function ApiKeys({ settings = {} }: ApiKeysProps) {
    const { auth } = usePage<any>().props;

    return (
        <AdminLayout>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">API 키 관리</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        외부 서비스 연동에 필요한 API 키를 관리합니다.
                    </p>
                </div>

                <FlashMessage />

                <div className="space-y-6">
                    <KakaoSection settings={settings} />
                    <BloggerSection settings={settings} />
                    <ThreadsSection settings={settings} />
                </div>
            </div>
        </AdminLayout>
    );
}
