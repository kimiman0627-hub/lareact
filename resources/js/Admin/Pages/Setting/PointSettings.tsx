import React from "react";
import { useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";

interface PointSettingsPageProps extends Record<string, unknown> {
    settings: {
        login_point_enabled:      string;
        login_point_amount:       string;
        login_point_cycle:        string;
        attendance_point_enabled: string;
        attendance_point_amount:  string;
        attendance_bonus_enabled: string;
        attendance_bonus_days:    string;
        attendance_bonus_amount:  string;
    };
}

const CYCLES: Record<string, string> = {
    DAILY: "매일 1회",
    ONCE:  "최초 1회 (평생)",
};

export default function PointSettings() {
    const { settings } = usePage<PointSettingsPageProps>().props;

    const { data, setData, post, processing } = useForm({
        login_point_enabled:      settings.login_point_enabled      === "1",
        login_point_amount:       parseInt(settings.login_point_amount       ?? "0",  10),
        login_point_cycle:        settings.login_point_cycle        ?? "DAILY",
        attendance_point_enabled: settings.attendance_point_enabled === "1",
        attendance_point_amount:  parseInt(settings.attendance_point_amount  ?? "0",  10),
        attendance_bonus_enabled: settings.attendance_bonus_enabled === "1",
        attendance_bonus_days:    parseInt(settings.attendance_bonus_days    ?? "10", 10),
        attendance_bonus_amount:  parseInt(settings.attendance_bonus_amount  ?? "0",  10),
    });

    const flash = (usePage().props as { flash?: { success?: string } }).flash;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post("/admin/settings/point");
    }

    return (
        <AdminLayout>
            <div className="max-w-xl space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">포인트 설정</h1>
                    <p className="text-sm text-slate-400 mt-1">로그인 보너스 포인트 지급 방식을 설정합니다.</p>
                </div>

                {flash?.success && (
                    <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100">
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            <span className="font-bold text-slate-700">로그인 보너스</span>
                        </div>

                        {/* 활성화 토글 */}
                        <label className="flex items-center justify-between cursor-pointer py-1">
                            <div>
                                <p className="text-sm font-medium text-slate-700">로그인 포인트 지급</p>
                                <p className="text-xs text-slate-400 mt-0.5">로그인 시 설정한 포인트를 자동 지급합니다</p>
                            </div>
                            <div
                                onClick={() => setData("login_point_enabled", !data.login_point_enabled)}
                                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${data.login_point_enabled ? "bg-blue-600" : "bg-slate-300"}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.login_point_enabled ? "translate-x-5" : "translate-x-0"}`} />
                            </div>
                        </label>

                        {data.login_point_enabled && (
                            <div className="space-y-4 pt-2 border-t border-gray-100">
                                {/* 지급 포인트 */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-600">지급 포인트</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100000}
                                            value={data.login_point_amount}
                                            onChange={(e) => setData("login_point_amount", Number(e.target.value))}
                                            className="w-36 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                        />
                                        <span className="text-sm text-slate-500 font-medium">P</span>
                                    </div>
                                </div>

                                {/* 지급 주기 */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-600">지급 주기</label>
                                    <div className="flex gap-3">
                                        {Object.entries(CYCLES).map(([key, label]) => (
                                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="login_point_cycle"
                                                    value={key}
                                                    checked={data.login_point_cycle === key}
                                                    onChange={() => setData("login_point_cycle", key)}
                                                    className="accent-blue-600"
                                                />
                                                <span className="text-sm text-slate-700">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 출석체크 설정 */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5 mt-4">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-100">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            <span className="font-bold text-slate-700">출석체크</span>
                        </div>

                        {/* 출석 포인트 */}
                        <label className="flex items-center justify-between cursor-pointer py-1">
                            <div>
                                <p className="text-sm font-medium text-slate-700">출석 포인트 지급</p>
                                <p className="text-xs text-slate-400 mt-0.5">출석체크 시 포인트를 지급합니다</p>
                            </div>
                            <div
                                onClick={() => setData("attendance_point_enabled", !data.attendance_point_enabled)}
                                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${data.attendance_point_enabled ? "bg-blue-600" : "bg-slate-300"}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.attendance_point_enabled ? "translate-x-5" : "translate-x-0"}`} />
                            </div>
                        </label>

                        {data.attendance_point_enabled && (
                            <div className="space-y-1 pt-2 border-t border-gray-100">
                                <label className="text-sm font-medium text-slate-600">출석 포인트</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        max={100000}
                                        value={data.attendance_point_amount}
                                        onChange={(e) => setData("attendance_point_amount", Number(e.target.value))}
                                        className="w-36 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                    <span className="text-sm text-slate-500 font-medium">P</span>
                                </div>
                            </div>
                        )}

                        {/* 연속 출석 보너스 */}
                        <label className="flex items-center justify-between cursor-pointer py-1 border-t border-gray-100 pt-4">
                            <div>
                                <p className="text-sm font-medium text-slate-700">연속 출석 보너스</p>
                                <p className="text-xs text-slate-400 mt-0.5">N일 연속 출석마다 추가 포인트를 지급합니다</p>
                            </div>
                            <div
                                onClick={() => setData("attendance_bonus_enabled", !data.attendance_bonus_enabled)}
                                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${data.attendance_bonus_enabled ? "bg-blue-600" : "bg-slate-300"}`}
                            >
                                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.attendance_bonus_enabled ? "translate-x-5" : "translate-x-0"}`} />
                            </div>
                        </label>

                        {data.attendance_bonus_enabled && (
                            <div className="space-y-4 pt-2 border-t border-gray-100">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-600">연속 출석 기준일</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={365}
                                            value={data.attendance_bonus_days}
                                            onChange={(e) => setData("attendance_bonus_days", Number(e.target.value))}
                                            className="w-24 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                        />
                                        <span className="text-sm text-slate-500 font-medium">일마다</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-600">보너스 포인트</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100000}
                                            value={data.attendance_bonus_amount}
                                            onChange={(e) => setData("attendance_bonus_amount", Number(e.target.value))}
                                            className="w-36 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                        />
                                        <span className="text-sm text-slate-500 font-medium">P</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400">
                                    예: {data.attendance_bonus_days}일 연속 출석마다 +{data.attendance_bonus_amount.toLocaleString()}P 지급
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition"
                        >
                            {processing ? "저장 중..." : "저장"}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
