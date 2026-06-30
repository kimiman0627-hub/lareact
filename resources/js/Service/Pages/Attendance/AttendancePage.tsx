import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import { ajax } from "@/Utils/network";

interface RankItem {
    rank: number;
    name: string;
    consecutive_days: number;
    checked_at: string;
}

interface AttendancePageProps {
    checkedToday: boolean;
    consecutive: number;
    recentDates: string[];
    attendancePointEnabled: boolean;
    attendancePointAmount: number;
    bonusEnabled: boolean;
    bonusDays: number;
    bonusAmount: number;
    nextBonusIn: number;
    todayRanking: RankItem[];
}

function buildCalendar(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

const RANK_MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function AttendancePage({
    checkedToday: initialChecked,
    consecutive: initialConsecutive,
    recentDates,
    attendancePointEnabled,
    attendancePointAmount,
    bonusEnabled,
    bonusDays,
    bonusAmount,
    nextBonusIn: initialNextBonusIn,
    todayRanking: initialRanking,
}: AttendancePageProps) {
    const { auth } = usePage<any>().props;
    const user = auth?.user;

    const [checked, setChecked]           = useState(initialChecked);
    const [consecutive, setConsecutive]   = useState(initialConsecutive);
    const [nextBonusIn, setNextBonusIn]   = useState(initialNextBonusIn);
    const [attendedDates, setAttendedDates] = useState<Set<string>>(new Set(recentDates));
    const [ranking, setRanking]           = useState<RankItem[]>(initialRanking);
    const [loading, setLoading]           = useState(false);
    const [toast, setToast]               = useState<{ msg: string; type: "success" | "info" | "error" } | null>(null);

    const today    = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const year     = today.getFullYear();
    const month    = today.getMonth();
    const cells    = buildCalendar(year, month);

    const monthLabel = `${year}년 ${month + 1}월`;

    function showToast(msg: string, type: "success" | "info" | "error" = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    async function handleCheckIn() {
        if (!user) {
            showToast("로그인 후 이용할 수 있습니다.", "error");
            return;
        }
        if (checked) {
            showToast("오늘은 이미 출석했습니다.", "info");
            return;
        }

        setLoading(true);
        try {
            const data = await ajax.post("/attendance") as any;

            if (data.status === "already") {
                setChecked(true);
                showToast("오늘은 이미 출석했습니다.", "info");
            } else {
                setChecked(true);
                setConsecutive(data.consecutive);
                setAttendedDates((prev) => new Set([...prev, todayStr]));

                const nb = bonusDays > 0 ? bonusDays - (data.consecutive % bonusDays) : bonusDays;
                setNextBonusIn(nb === bonusDays && data.consecutive > 0 ? 0 : nb);

                // 랭킹에 내 항목 추가
                const myEntry: RankItem = {
                    rank:             data.rank ?? ranking.length + 1,
                    name:             user.name ? user.name[0] + "*".repeat(Math.max(0, user.name.length - 1)) : "?*",
                    consecutive_days: data.consecutive,
                    checked_at:       new Date().toISOString(),
                };
                setRanking((prev) => [...prev, myEntry]);

                let msg = `출석 완료! ${data.rank ? data.rank + "번째 출석 🎉 " : ""}연속 ${data.consecutive}일`;
                if (attendancePointEnabled && data.point > 0) msg += ` · +${data.point.toLocaleString()}P`;
                if (bonusEnabled && data.bonus > 0) msg += ` · 보너스 +${data.bonus.toLocaleString()}P`;
                showToast(msg);
            }
        } catch {
            showToast("오류가 발생했습니다. 다시 시도해주세요.", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <ServiceLayout>
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {/* 토스트 */}
                {toast && (
                    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
                        toast.type === "success" ? "bg-green-600 text-white" :
                        toast.type === "error"   ? "bg-red-500 text-white" :
                                                   "bg-slate-700 text-white"
                    }`}>
                        {toast.msg}
                    </div>
                )}

                {/* 헤더 카드 */}
                <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">오늘의 출석체크</p>
                            <p className="text-2xl font-bold mt-1">
                                {consecutive > 0 ? `${consecutive}일 연속 출석 중` : "첫 출석을 해보세요!"}
                            </p>
                            {bonusEnabled && bonusDays > 0 && (
                                <p className="text-blue-100 text-xs mt-1">
                                    {nextBonusIn > 0
                                        ? `${nextBonusIn}일 후 연속 보너스 +${bonusAmount.toLocaleString()}P`
                                        : `🎉 오늘 보너스 대상!`}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            {attendancePointEnabled && attendancePointAmount > 0 && (
                                <p className="text-blue-100 text-xs">출석 시</p>
                            )}
                            {attendancePointEnabled && attendancePointAmount > 0 && (
                                <p className="text-2xl font-bold">+{attendancePointAmount.toLocaleString()}P</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleCheckIn}
                        disabled={checked || loading || !user}
                        className={`mt-5 w-full py-3 rounded-xl font-bold text-sm transition ${
                            checked
                                ? "bg-white/20 text-white/60 cursor-not-allowed"
                                : loading
                                ? "bg-white/30 text-white/70 cursor-wait"
                                : !user
                                ? "bg-white/20 text-white/60 cursor-not-allowed"
                                : "bg-white text-indigo-600 hover:bg-blue-50"
                        }`}
                    >
                        {!user ? "로그인 후 출석체크 가능" : checked ? "✓ 오늘 출석 완료" : loading ? "처리 중..." : "출석체크 하기"}
                    </button>
                </div>

                {/* 달력 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-slate-700 mb-4">{monthLabel} 출석 현황</h2>
                    <div className="grid grid-cols-7 gap-1">
                        {DAYS.map((d, i) => (
                            <div key={d} className={`text-center text-xs font-semibold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-400"}`}>
                                {d}
                            </div>
                        ))}
                        {cells.map((day, idx) => {
                            if (!day) return <div key={idx} />;
                            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const isToday   = dateStr === todayStr;
                            const attended  = attendedDates.has(dateStr);
                            const isSun = idx % 7 === 0;
                            const isSat = idx % 7 === 6;

                            return (
                                <div key={idx} className={`relative flex items-center justify-center h-9 rounded-lg text-sm font-medium transition ${
                                    attended
                                        ? "bg-blue-500 text-white"
                                        : isToday
                                        ? "border-2 border-blue-400 text-blue-600"
                                        : isSun
                                        ? "text-red-400"
                                        : isSat
                                        ? "text-blue-400"
                                        : "text-slate-600"
                                }`}>
                                    {day}
                                    {attended && (
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-blue-500 inline-block" />출석일
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded border-2 border-blue-400 inline-block" />오늘
                        </span>
                    </div>
                </div>

                {/* 보너스 정보 */}
                {bonusEnabled && bonusDays > 0 && bonusAmount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                        <span className="text-2xl">🏆</span>
                        <div>
                            <p className="text-sm font-bold text-amber-700">연속 출석 보너스</p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                {bonusDays}일 연속 출석마다 <strong>+{bonusAmount.toLocaleString()}P</strong> 추가 지급
                            </p>
                        </div>
                    </div>
                )}

                {/* 오늘 출석 랭킹 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-bold text-slate-700">오늘의 출석 현황</h2>
                        <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5 font-medium">
                            {ranking.length}명 출석
                        </span>
                    </div>

                    {ranking.length === 0 ? (
                        <div className="py-12 text-center text-sm text-slate-400">
                            아직 오늘 출석한 사람이 없습니다.<br />
                            <span className="text-blue-500 font-medium">첫 번째로 출석해보세요!</span>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {ranking.map((item) => (
                                <li key={item.rank} className={`flex items-center gap-3 px-5 py-3 ${item.rank <= 3 ? "bg-amber-50/50" : ""}`}>
                                    {/* 순위 */}
                                    <div className="w-8 shrink-0 text-center">
                                        {RANK_MEDAL[item.rank] ? (
                                            <span className="text-lg leading-none">{RANK_MEDAL[item.rank]}</span>
                                        ) : (
                                            <span className="text-sm font-bold text-slate-400">{item.rank}</span>
                                        )}
                                    </div>

                                    {/* 닉네임 */}
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                                        {item.consecutive_days >= 2 && (
                                            <span className="ml-2 text-xs text-blue-500 font-medium">
                                                🔥 {item.consecutive_days}일 연속
                                            </span>
                                        )}
                                    </div>

                                    {/* 출석 시간 */}
                                    <div className="shrink-0 text-xs text-slate-400 tabular-nums">
                                        {fmtTime(item.checked_at)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </ServiceLayout>
    );
}
