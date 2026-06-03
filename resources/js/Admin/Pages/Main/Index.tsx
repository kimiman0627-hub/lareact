import React from 'react';
import { Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';

function timeAgo(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60)   return `${diff}초 전`;
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
}

interface StatCardProps {
    label: string;
    value?: number;
    sub?: string;
    color: 'blue' | 'green' | 'purple' | 'amber';
}

function StatCard({ label, value, sub, color }: StatCardProps) {
    const colors = {
        blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-600',   val: 'text-blue-700'   },
        green:  { bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-600',  val: 'text-green-700'  },
        purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', val: 'text-purple-700' },
        amber:  { bg: 'bg-amber-50',  border: 'border-amber-100',  text: 'text-amber-600',  val: 'text-amber-700'  },
    };
    const c = colors[color] ?? colors.blue;
    return (
        <div className={`rounded-lg border p-5 ${c.bg} ${c.border}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>{label}</p>
            <p className={`mt-1 text-3xl font-black ${c.val}`}>{value?.toLocaleString() ?? '—'}</p>
            {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
    );
}

const MAX_BAR = 40; // px

interface WeekSeriesItem {
    date: string;
    login_count: number;
    reg_count: number;
}

interface WeekChartProps {
    series: WeekSeriesItem[];
}

function WeekChart({ series }: WeekChartProps) {
    const maxLogin = Math.max(...series.map((d) => d.login_count), 1);
    const maxReg   = Math.max(...series.map((d) => d.reg_count),   1);

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm font-bold text-slate-700 mb-4">최근 7일 추이</p>
            <div className="flex items-end justify-between gap-1">
                {series.map((d) => {
                    const loginH = Math.round((d.login_count / maxLogin) * MAX_BAR) || 2;
                    const regH   = Math.round((d.reg_count   / maxReg)   * MAX_BAR) || 2;
                    const label  = d.date.slice(5); // MM-DD
                    return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
                            <div className="w-full flex items-end justify-center gap-0.5" style={{ height: `${MAX_BAR + 4}px` }}>
                                <div
                                    title={`로그인 ${d.login_count}`}
                                    className="w-[45%] bg-blue-400 rounded-t hover:bg-blue-500 transition"
                                    style={{ height: `${loginH}px` }}
                                />
                                <div
                                    title={`가입 ${d.reg_count}`}
                                    className="w-[45%] bg-emerald-400 rounded-t hover:bg-emerald-500 transition"
                                    style={{ height: `${regH}px` }}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{label}</p>
                        </div>
                    );
                })}
            </div>
            <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400" /> 로그인
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-400" /> 가입
                </span>
            </div>
        </div>
    );
}

const INQUIRY_TYPE: Record<string, string> = { SUPPORT: '1:1문의', PARTNERSHIP: '제휴' };
const CRAWL_STATUS: Record<string, { label: string; cls: string }> = {
    RUNNING: { label: '실행중', cls: 'bg-blue-100 text-blue-700'   },
    DONE:    { label: '완료',   cls: 'bg-green-100 text-green-700' },
    FAILED:  { label: '실패',   cls: 'bg-red-100 text-red-600'     },
};

interface IndexProps {
    auth?: any;
    stats?: {
        today_visitors?: number;
        today_posts?: number;
        total_members?: number;
        pending_inquiries?: number;
    };
    weekSeries?: WeekSeriesItem[];
    recentPosts?: any[];
    recentInquiries?: any[];
    crawlLogs?: any[];
}

export default function Index({
    auth,
    stats = {},
    weekSeries = [],
    recentPosts = [],
    recentInquiries = [],
    crawlLogs = [],
}: IndexProps) {
    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* 요약 카드 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="오늘 방문자"  value={stats.today_visitors}    sub="로그인 기준" color="blue"   />
                    <StatCard label="오늘 게시글"  value={stats.today_posts}       sub="활성 게시글" color="green"  />
                    <StatCard label="전체 회원"    value={stats.total_members}     sub="TEST 제외"   color="purple" />
                    <StatCard label="미답변 문의"  value={stats.pending_inquiries} sub="PENDING"     color="amber"  />
                </div>

                {/* 추이 차트 + 미답변 문의 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <WeekChart series={weekSeries} />

                    {/* 미답변 문의 */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-slate-700">미답변 문의</p>
                            <Link href="/admin/inquiries" className="text-xs text-blue-500 hover:text-blue-700">전체보기 →</Link>
                        </div>
                        {recentInquiries.length === 0 ? (
                            <p className="text-sm text-slate-400 py-6 text-center">미답변 문의가 없습니다.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {recentInquiries.map((inq) => (
                                    <li key={inq.id} className="py-2.5 flex items-center gap-2">
                                        <span className="shrink-0 text-[10px] font-semibold text-white bg-amber-500 rounded px-1.5 py-0.5 whitespace-nowrap">
                                            {INQUIRY_TYPE[inq.type] ?? inq.type}
                                        </span>
                                        <span className="flex-1 min-w-0 text-xs text-slate-700 truncate">{inq.title}</span>
                                        <span className="shrink-0 text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(inq.created_at)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* 최근 게시글 + 크롤링 로그 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 최근 게시글 */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-slate-700">최근 게시글</p>
                            <Link href="/admin/posts" className="text-xs text-blue-500 hover:text-blue-700">전체보기 →</Link>
                        </div>
                        {recentPosts.length === 0 ? (
                            <p className="text-sm text-slate-400 py-6 text-center">게시글이 없습니다.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {recentPosts.map((p) => (
                                    <li key={p.post_id} className="py-2.5 flex items-center gap-2">
                                        {p.board_name && (
                                            <span className="shrink-0 text-[10px] font-semibold text-white bg-blue-500 rounded px-1.5 py-0.5 whitespace-nowrap">
                                                {p.board_name}
                                            </span>
                                        )}
                                        <span className="flex-1 min-w-0 text-xs text-slate-700 truncate">{p.title}</span>
                                        <span className="shrink-0 text-[11px] text-slate-400 whitespace-nowrap">
                                            조회 {p.hits} · {timeAgo(p.created_at)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* 크롤링 로그 */}
                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-slate-700">최근 크롤링</p>
                            <Link href="/admin/crawl-logs" className="text-xs text-blue-500 hover:text-blue-700">전체보기 →</Link>
                        </div>
                        {crawlLogs.length === 0 ? (
                            <p className="text-sm text-slate-400 py-6 text-center">크롤링 이력이 없습니다.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {crawlLogs.map((log) => {
                                    const st = CRAWL_STATUS[log.status] ?? { label: log.status, cls: 'bg-gray-100 text-gray-500' };
                                    return (
                                        <li key={log.id} className="py-2.5 flex items-center gap-2">
                                            <span className={`shrink-0 text-[10px] font-semibold rounded px-1.5 py-0.5 whitespace-nowrap ${st.cls}`}>
                                                {st.label}
                                            </span>
                                            <span className="shrink-0 text-xs font-medium text-slate-600 w-20 truncate">{log.source}</span>
                                            <span className="flex-1 text-xs text-slate-500">
                                                저장 <strong className="text-slate-700">{log.total_saved}</strong>
                                                {log.total_errors > 0 && (
                                                    <span className="text-red-500"> · 오류 {log.total_errors}</span>
                                                )}
                                            </span>
                                            <span className="shrink-0 text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(log.started_at)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
