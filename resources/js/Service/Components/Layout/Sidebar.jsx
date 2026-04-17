import { Link, usePage } from "@inertiajs/react";
import AuthWidget from "@/Service/Components/Widgets/AuthWidget";
import BannerSlot from "@/Service/Components/Banner/BannerSlot";

function NoticeWidget() {
    const notices = [
        "서비스 이용 약관 안내",
        "개인정보처리방침 업데이트",
        "신규 게시판 오픈 안내",
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-slate-50">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    공지사항
                </span>
            </div>
            <ul className="divide-y divide-gray-50">
                {notices.map((n, i) => (
                    <li key={i}>
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 transition group"
                        >
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="text-xs text-slate-600 group-hover:text-blue-600 transition truncate">
                                {n}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function StatsWidget() {
    const { siteStats = {} } = usePage().props;

    const items = [
        {
            label: "오늘 게시글",
            value: siteStats.today_posts?.toLocaleString() ?? "—",
        },
        {
            label: "전체 회원",
            value: siteStats.total_members?.toLocaleString() ?? "—",
        },
        // { label: "현재 접속자", value: siteStats.online_users?.toLocaleString() ?? "—" },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
                현황
            </p>
            {items.map(({ label, value }) => (
                <div
                    key={label}
                    className="flex items-center justify-between text-xs"
                >
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-700">
                        {value}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function Sidebar() {
    const { sideBanners1 = [] } = usePage().props;
    const { sideBanners2 = [] } = usePage().props;

    return (
        <aside className="w-full lg:w-64 shrink-0 space-y-4 lg:self-start lg:sticky lg:top-20">
            {/* 로그인 위젯은 데스크톱에서만 표시 — 모바일은 TopBar에서 처리 */}
            <div className="hidden lg:block">
                <AuthWidget />
            </div>
            <BannerSlot banners={sideBanners1} position="SIDE" />
            <NoticeWidget />
            <StatsWidget />
            <BannerSlot banners={sideBanners2} position="SIDE2" />
        </aside>
    );
}
