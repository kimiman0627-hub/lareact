import { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import AuthWidget from "@/Service/Components/Widgets/AuthWidget";
import BannerSlot from "@/Service/Components/Banner/BannerSlot";

function NoticeWidget() {
    const { sideNotices = [] } = usePage().props;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-slate-50">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    공지사항
                </span>
                <Link
                    href="/board/notice"
                    className="text-[10px] text-slate-400 hover:text-blue-500 transition"
                >
                    더보기
                </Link>
            </div>
            {sideNotices.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-400">
                    등록된 공지사항이 없습니다.
                </p>
            ) : (
                <ul className="divide-y divide-gray-50">
                    {sideNotices.map((n) => (
                        <li key={n.post_id}>
                            <Link
                                href={`/post/${n.post_id}`}
                                className="flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 transition group"
                            >
                                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
                                <span className="text-xs text-slate-600 group-hover:text-blue-600 transition truncate">
                                    {n.title}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const COINS = [
    { key: "KRW-BTC", name: "비트코인", symbol: "BTC" },
    { key: "KRW-ETH", name: "이더리움", symbol: "ETH" },
    { key: "KRW-XRP", name: "리플", symbol: "XRP" },
];

function CryptoWidget() {
    const [prices, setPrices] = useState(null);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [error, setError] = useState(false);

    async function fetchPrices() {
        try {
            const res = await fetch("/api/crypto");
            if (!res.ok) throw new Error();
            const data = await res.json();
            const mapped = {};
            data.forEach((item) => {
                mapped[item.market] = item;
            });
            setPrices(mapped);
            setUpdatedAt(new Date());
            setError(false);
        } catch {
            setError(true);
        }
    }

    useEffect(() => {
        fetchPrices();
        const timer = setInterval(fetchPrices, 60_000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-slate-50">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    가상화폐
                </span>
                {updatedAt && (
                    <span className="text-[10px] text-slate-400">
                        {updatedAt.toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}{" "}
                        기준
                    </span>
                )}
            </div>
            <div className="px-4 py-3 space-y-3">
                {!prices && !error && (
                    <p className="text-xs text-slate-400 text-center py-1">
                        불러오는 중...
                    </p>
                )}
                {error && (
                    <p className="text-xs text-slate-400 text-center py-1">
                        시세를 불러올 수 없습니다.
                    </p>
                )}
                {prices &&
                    COINS.map(({ key, name, symbol }) => {
                        const d = prices[key];
                        if (!d) return null;
                        const isUp = d.signed_change_rate >= 0;
                        return (
                            <div
                                key={key}
                                className="flex items-center justify-between text-xs"
                            >
                                <div>
                                    <span className="font-medium text-slate-700">
                                        {name}
                                    </span>
                                    <span className="ml-1 text-[10px] text-slate-400">
                                        {symbol}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-slate-800">
                                        {d.trade_price.toLocaleString()}원
                                    </p>
                                    <p
                                        className={`text-[10px] font-medium ${isUp ? "text-red-500" : "text-blue-500"}`}
                                    >
                                        {isUp ? "▲" : "▼"}{" "}
                                        {Math.abs(
                                            d.signed_change_rate * 100,
                                        ).toFixed(2)}
                                        %
                                    </p>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

function StockWidget() {
    const [data, setData] = useState(null);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [tab, setTab] = useState("kosdaq");
    const [error, setError] = useState(false);

    async function fetchStocks() {
        try {
            const res = await fetch("/api/stocks");
            if (!res.ok) throw new Error();
            const json = await res.json();
            setData(json);
            setUpdatedAt(new Date());
            setError(false);
        } catch {
            setError(true);
        }
    }

    useEffect(() => {
        fetchStocks();
        const timer = setInterval(fetchStocks, 60_000);
        return () => clearInterval(timer);
    }, []);

    const list = data?.[tab] ?? [];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-slate-50">
                <div className="flex gap-1">
                    {["kosdaq", "nasdaq"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                                tab === t
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-500 hover:text-blue-600"
                            }`}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
                {updatedAt && (
                    <span className="text-[10px] text-slate-400">
                        {updatedAt.toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                    </span>
                )}
            </div>

            {/* 컬럼 헤더 */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 px-3 py-1.5 border-b border-gray-50 bg-gray-50">
                <span className="text-[10px] text-slate-400 font-medium">
                    종목
                </span>
                <span className="text-[10px] text-slate-400 font-medium text-right">
                    등락
                </span>
                <span className="text-[10px] text-slate-400 font-medium text-right">
                    거래대금
                </span>
            </div>

            {/* 목록 */}
            <div className="divide-y divide-gray-50">
                {error && (
                    <p className="text-xs text-slate-400 text-center py-4">
                        시세를 불러올 수 없습니다.
                    </p>
                )}
                {!error && !data && (
                    <p className="text-xs text-slate-400 text-center py-4">
                        불러오는 중...
                    </p>
                )}
                {!error && data && list.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">
                        장 마감 또는 데이터 없음
                    </p>
                )}
                {list.map((stock, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-[1fr_auto_auto] gap-x-2 px-3 py-2 items-center hover:bg-slate-50 transition"
                    >
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-700 truncate">
                                {tab === "nasdaq" ? stock.symbol : stock.name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                                {tab === "nasdaq"
                                    ? `${stock.name} · $${stock.price.toLocaleString()}`
                                    : `${stock.price.toLocaleString()}원`}
                            </p>
                        </div>
                        <div
                            className={`text-[11px] font-semibold text-right whitespace-nowrap ${stock.up ? "text-red-500" : "text-blue-500"}`}
                        >
                            {stock.up ? "▲" : "▼"}{" "}
                            {Math.abs(stock.change).toFixed(2)}%
                        </div>
                        <div className="text-[11px] text-slate-500 text-right whitespace-nowrap">
                            {stock.trade_val}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ExchangeWidget() {
    const initial = usePage().props.exchangeRates;
    const [rates, setRates] = useState(initial);

    async function fetchRates() {
        try {
            const res = await fetch("/api/exchange-rates");
            if (!res.ok) throw new Error();
            const json = await res.json();
            setRates(json);
        } catch {
            // 실패 시 기존 값 유지
        }
    }

    useEffect(() => {
        const timer = setInterval(fetchRates, 300_000);
        return () => clearInterval(timer);
    }, []);

    if (!rates) return null;

    const items = [
        { flag: "🇺🇸", label: "달러 (USD)", value: rates.USD?.toLocaleString() },
        { flag: "🇪🇺", label: "유로 (EUR)", value: rates.EUR?.toLocaleString() },
        {
            flag: "🇯🇵",
            label: "엔화 (100¥)",
            value: rates.JPY?.toLocaleString(),
        },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-slate-50">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    환율
                </span>
            </div>
            <div className="px-4 py-3 space-y-2.5">
                {items.map(({ flag, label, value }) => (
                    <div
                        key={label}
                        className="flex items-center justify-between text-xs"
                    >
                        <span className="text-slate-500">
                            {flag} {label}
                        </span>
                        <span className="font-semibold text-slate-700">
                            {value ? `${value}원` : "—"}
                        </span>
                    </div>
                ))}
                {rates.date && (
                    <p className="text-[10px] text-slate-400 text-right pt-1 border-t border-gray-50">
                        {rates.date} 기준
                    </p>
                )}
            </div>
        </div>
    );
}

function MetalWidget() {
    const [data, setData] = useState(null);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [error, setError] = useState(false);

    async function fetchMetals() {
        try {
            const res = await fetch("/api/metals");
            if (!res.ok) throw new Error();
            const json = await res.json();
            setData(json);
            setUpdatedAt(new Date());
            setError(false);
        } catch {
            setError(true);
        }
    }

    useEffect(() => {
        fetchMetals();
        const timer = setInterval(fetchMetals, 300_000);
        return () => clearInterval(timer);
    }, []);

    const items = data
        ? [
              { label: "금 (Gold)", key: "gold", unit: "$/oz" },
              { label: "은 (Silver)", key: "silver", unit: "$/oz" },
          ]
        : [];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-slate-50">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    금 / 은
                </span>
                {updatedAt && (
                    <span className="text-[10px] text-slate-400">
                        {updatedAt.toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}{" "}
                        기준
                    </span>
                )}
            </div>
            <div className="px-4 py-3 space-y-3">
                {!data && !error && (
                    <p className="text-xs text-slate-400 text-center py-1">
                        불러오는 중...
                    </p>
                )}
                {error && (
                    <p className="text-xs text-slate-400 text-center py-1">
                        시세를 불러올 수 없습니다.
                    </p>
                )}
                {items.map(({ label, key, unit }) => {
                    const d = data?.[key];
                    if (!d) return null;
                    return (
                        <div
                            key={key}
                            className="flex items-center justify-between text-xs"
                        >
                            <span className="text-slate-500">{label}</span>
                            <div className="text-right">
                                <p className="font-semibold text-slate-800">
                                    ${d.price_usd.toLocaleString()}{" "}
                                    <span className="text-[10px] text-slate-400">
                                        {unit}
                                    </span>
                                </p>
                                <p
                                    className={`text-[10px] font-medium ${d.up ? "text-red-500" : "text-blue-500"}`}
                                >
                                    {d.up ? "▲" : "▼"}{" "}
                                    {Math.abs(d.change).toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
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
        // {
        //     label: "오늘 방문자",
        //     value: siteStats.today_visitors?.toLocaleString() ?? "—",
        // },
        // { label: "전체 회원", value: siteStats.total_members?.toLocaleString() ?? "—" },
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
            <ExchangeWidget />
            <StockWidget />
            <CryptoWidget />
            <MetalWidget />
            <StatsWidget />
            <NoticeWidget />
            <BannerSlot banners={sideBanners2} position="SIDE2" />
        </aside>
    );
}
