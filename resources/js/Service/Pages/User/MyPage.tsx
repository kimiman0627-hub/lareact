import React, { useState, useEffect } from "react";
import { Link, router, usePage, useForm } from "@inertiajs/react";
import { ajax } from "@/Utils/network";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import Pagination from "@/Service/Components/Common/Pagination";
import { timeAgo } from "@/Service/Components/Board/BoardCard";
import type { Post, Comment, PaginatedData, SharedProps } from "@/types";

interface TabButtonProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
    return (
        <button onClick={onClick}
            className={`px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {label}
        </button>
    );
}

interface PostsTabProps {
    posts?: PaginatedData<Post & { board_name?: string }> | null;
}

function PostsTab({ posts }: PostsTabProps) {
    const items    = posts?.data ?? [];
    const meta     = posts?.meta ?? (posts as unknown as { last_page?: number; current_page?: number; total?: number }) ?? {};
    const lastPage = (meta as { last_page?: number }).last_page ?? 1;
    const curPage  = (meta as { current_page?: number }).current_page ?? 1;
    const total    = (meta as { total?: number }).total ?? 0;

    function goPage(page: number) {
        router.get("/mypage", { tab: "posts", page }, { preserveScroll: true });
    }

    return (
        <div>
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">전체 {total}건</span>
            </div>
            {items.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-400">작성한 게시글이 없습니다.</div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {items.map((post) => (
                        <li key={post.post_id}>
                            <Link href={`/post/${post.post_id}`}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition group">
                                <span className="shrink-0 text-[10px] font-semibold text-white bg-blue-500 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap">{post.board_name}</span>
                                <span className="flex-1 min-w-0 text-sm text-slate-700 group-hover:text-blue-600 transition truncate">{post.title}</span>
                                <div className="shrink-0 flex items-center gap-2.5 text-xs text-slate-400 whitespace-nowrap">
                                    {(post.comment_count ?? 0) > 0 && <span className="text-blue-400">[{post.comment_count}]</span>}
                                    <span>조회 {post.hits}</span>
                                    <span>{timeAgo(post.created_at)}</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            <Pagination curPage={curPage} lastPage={lastPage} onPageChange={goPage} />
        </div>
    );
}

interface CommentItem extends Comment {
    board_name?: string;
    post_title?: string;
}

interface CommentsTabProps {
    comments?: PaginatedData<CommentItem> | null;
}

function CommentsTab({ comments }: CommentsTabProps) {
    const items    = comments?.data ?? [];
    const meta     = comments?.meta ?? (comments as unknown as { last_page?: number; current_page?: number; total?: number }) ?? {};
    const lastPage = (meta as { last_page?: number }).last_page ?? 1;
    const curPage  = (meta as { current_page?: number }).current_page ?? 1;
    const total    = (meta as { total?: number }).total ?? 0;

    function goPage(page: number) {
        router.get("/mypage", { tab: "comments", page }, { preserveScroll: true });
    }

    return (
        <div>
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">전체 {total}건</span>
            </div>
            {items.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-400">작성한 댓글이 없습니다.</div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {items.map((c) => (
                        <li key={c.comment_id} className="px-4 py-3 hover:bg-gray-50 transition">
                            <Link href={`/post/${c.post_id}`} className="flex items-center gap-2 mb-1.5">
                                <span className="shrink-0 text-[10px] font-semibold text-white bg-slate-400 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap">{c.board_name}</span>
                                <span className="text-xs text-slate-500 hover:text-blue-500 transition truncate">{c.post_title}</span>
                            </Link>
                            <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">{c.content}</p>
                            <span className="mt-1 block text-xs text-slate-400">{timeAgo(c.created_at)}</span>
                        </li>
                    ))}
                </ul>
            )}
            <Pagination curPage={curPage} lastPage={lastPage} onPageChange={goPage} />
        </div>
    );
}

interface InquiryItem {
    id: number;
    type: string;
    status: string;
    title: string;
    content: string;
    answer?: string | null;
    answered_at?: string;
    created_at: string;
}

const TYPE_LABEL: Record<string, string>  = { SUPPORT: "1:1 문의", PARTNERSHIP: "제휴 문의" };
const STATUS_META: Record<string, { label: string; cls: string }> = {
    PENDING:  { label: "대기중",   cls: "bg-yellow-100 text-yellow-700" },
    ANSWERED: { label: "답변완료", cls: "bg-green-100 text-green-700"  },
    CLOSED:   { label: "종료",     cls: "bg-gray-100 text-gray-500"    },
};

interface InquiryDetailModalProps {
    id: number;
    onClose: () => void;
}

function InquiryDetailModal({ id, onClose }: InquiryDetailModalProps) {
    const [detail, setDetail] = useState<InquiryItem | null>(null);

    useEffect(() => {
        (ajax.get(`/mypage/inquiry/${id}`) as Promise<InquiryItem>).then((data) => setDetail(data));
    }, [id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-slate-800">문의 상세</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                    {!detail ? (
                        <p className="text-sm text-slate-400 text-center py-8">불러오는 중...</p>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-semibold text-white bg-slate-500 rounded px-1.5 py-0.5">{TYPE_LABEL[detail.type] ?? detail.type}</span>
                                {(() => {
                                    const st = STATUS_META[detail.status] ?? { label: detail.status, cls: "bg-gray-100 text-gray-500" };
                                    return <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${st.cls}`}>{st.label}</span>;
                                })()}
                                <span className="text-xs text-slate-400">{timeAgo(detail.created_at)}</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">제목</p>
                                <p className="text-sm font-semibold text-slate-800">{detail.title}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">문의 내용</p>
                                <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{detail.content}</div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">답변</p>
                                {detail.answer ? (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{detail.answer}</div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">아직 답변이 등록되지 않았습니다.</p>
                                )}
                                {detail.answered_at && <p className="mt-1 text-xs text-slate-400">답변일시: {timeAgo(detail.answered_at)}</p>}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

interface InquiriesTabProps {
    inquiries?: PaginatedData<InquiryItem> | null;
}

function InquiriesTab({ inquiries }: InquiriesTabProps) {
    const items    = inquiries?.data ?? [];
    const meta     = inquiries?.meta ?? (inquiries as unknown as { last_page?: number; current_page?: number; total?: number }) ?? {};
    const lastPage = (meta as { last_page?: number }).last_page ?? 1;
    const curPage  = (meta as { current_page?: number }).current_page ?? 1;
    const total    = (meta as { total?: number }).total ?? 0;
    const [modalId, setModalId] = useState<number | null>(null);

    function goPage(page: number) {
        router.get("/mypage", { tab: "inquiries", page }, { preserveScroll: true });
    }

    return (
        <div>
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-slate-500">전체 {total}건</span>
                <Link href="/inquiry" className="text-xs text-blue-500 hover:text-blue-700 transition font-medium">+ 문의하기</Link>
            </div>
            {items.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-400">
                    문의 내역이 없습니다.
                    <div className="mt-3"><Link href="/inquiry" className="text-blue-500 hover:text-blue-700 transition font-medium">문의하기 →</Link></div>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {items.map((inq) => {
                        const st = STATUS_META[inq.status] ?? { label: inq.status, cls: "bg-gray-100 text-gray-500" };
                        return (
                            <li key={inq.id}>
                                <button onClick={() => setModalId(inq.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left">
                                    <span className="shrink-0 text-[10px] font-semibold text-white bg-slate-500 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap">{TYPE_LABEL[inq.type] ?? inq.type}</span>
                                    <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">{inq.title}</span>
                                    <div className="shrink-0 flex items-center gap-2 whitespace-nowrap">
                                        <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 leading-tight ${st.cls}`}>{st.label}</span>
                                        <span className="text-xs text-slate-400">{timeAgo(inq.created_at)}</span>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
            <Pagination curPage={curPage} lastPage={lastPage} onPageChange={goPage} />
            {modalId !== null && <InquiryDetailModal id={modalId} onClose={() => setModalId(null)} />}
        </div>
    );
}

function PasswordTab() {
    const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post("/mypage/password", { onSuccess: () => reset() });
    }

    return (
        <div className="px-5 py-6 max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">현재 비밀번호</label>
                    <input type="password" value={data.current_password} onChange={(e) => setData("current_password", e.target.value)}
                        autoComplete="current-password"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition" />
                    {errors.current_password && <p className="mt-1 text-xs text-red-500">{errors.current_password}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호</label>
                    <input type="password" value={data.password} onChange={(e) => setData("password", e.target.value)}
                        autoComplete="new-password"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition" />
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    <p className="mt-1 text-xs text-slate-400">최소 8자 이상</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호 확인</label>
                    <input type="password" value={data.password_confirmation} onChange={(e) => setData("password_confirmation", e.target.value)}
                        autoComplete="new-password"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition" />
                </div>
                <div className="flex items-center gap-3 pt-1">
                    <button type="submit" disabled={processing}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition">
                        {processing ? "변경 중..." : "비밀번호 변경"}
                    </button>
                    {recentlySuccessful && <span className="text-sm text-green-600 font-medium">변경되었습니다.</span>}
                </div>
            </form>
        </div>
    );
}

interface ScrapItem {
    scrap_id: number;
    post_id: number;
    board_name?: string;
    title: string;
    comment_count?: number;
    scrapped_at: string;
}

interface ScrapsTabProps {
    scraps?: PaginatedData<ScrapItem> | null;
}

function ScrapsTab({ scraps }: ScrapsTabProps) {
    const items    = scraps?.data ?? [];
    const meta     = scraps?.meta ?? (scraps as unknown as { last_page?: number; current_page?: number; total?: number }) ?? {};
    const lastPage = (meta as { last_page?: number }).last_page ?? 1;
    const curPage  = (meta as { current_page?: number }).current_page ?? 1;
    const total    = (meta as { total?: number }).total ?? 0;

    function goPage(page: number) {
        router.get("/mypage", { tab: "scraps", page }, { preserveScroll: true });
    }

    return (
        <div>
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <span className="text-xs text-slate-500">전체 {total}건</span>
            </div>
            {items.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-400">스크랩한 게시글이 없습니다.</div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {items.map((item) => (
                        <li key={item.scrap_id}>
                            <Link href={`/post/${item.post_id}`}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition group">
                                <svg className="shrink-0 w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                <span className="shrink-0 text-[10px] font-semibold text-white bg-amber-400 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap">{item.board_name}</span>
                                <span className="flex-1 min-w-0 text-sm text-slate-700 group-hover:text-amber-600 transition truncate">{item.title}</span>
                                <div className="shrink-0 flex items-center gap-2.5 text-xs text-slate-400 whitespace-nowrap">
                                    {(item.comment_count ?? 0) > 0 && <span className="text-amber-400">[{item.comment_count}]</span>}
                                    <span>{timeAgo(item.scrapped_at)}</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            <Pagination curPage={curPage} lastPage={lastPage} onPageChange={goPage} />
        </div>
    );
}

interface MyPageProps {
    tab?: string;
    posts?: PaginatedData<Post & { board_name?: string }> | null;
    comments?: PaginatedData<CommentItem> | null;
    inquiries?: PaginatedData<InquiryItem> | null;
    scraps?: PaginatedData<ScrapItem> | null;
}

export default function MyPage({ tab, posts, comments, inquiries, scraps }: MyPageProps) {
    const { auth } = usePage<SharedProps>().props;
    const user = auth?.user;

    function switchTab(newTab: string) {
        router.get("/mypage", { tab: newTab, page: 1 }, { preserveScroll: true });
    }

    return (
        <ServiceLayout>
            <div className="flex items-center gap-2 mb-4">
                <Link href="/" className="text-sm text-slate-400 hover:text-blue-500 transition">홈</Link>
                <span className="text-slate-300 text-sm">›</span>
                <span className="text-sm font-semibold text-slate-700">마이페이지</span>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4 mb-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white text-lg font-black shrink-0">
                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                    <p className="font-bold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200 px-2 overflow-x-auto scrollbar-none">
                    <TabButton label="내게시글" active={tab === "posts"} onClick={() => switchTab("posts")} />
                    <TabButton label="내댓글" active={tab === "comments"} onClick={() => switchTab("comments")} />
                    <TabButton label="내문의" active={tab === "inquiries"} onClick={() => switchTab("inquiries")} />
                    <TabButton label="스크랩" active={tab === "scraps"} onClick={() => switchTab("scraps")} />
                    <TabButton label="비밀번호 변경" active={tab === "password"} onClick={() => switchTab("password")} />
                </div>

                {tab === "posts"      && <PostsTab posts={posts} />}
                {tab === "comments"   && <CommentsTab comments={comments} />}
                {tab === "inquiries"  && <InquiriesTab inquiries={inquiries} />}
                {tab === "scraps"     && <ScrapsTab scraps={scraps} />}
                {tab === "password"   && <PasswordTab />}
            </div>
        </ServiceLayout>
    );
}
