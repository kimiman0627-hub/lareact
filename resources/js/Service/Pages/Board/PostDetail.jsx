import React, { useState, useRef, useEffect } from "react";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import { timeAgo, fmtHits } from "@/Service/Components/Board/BoardCard";
import axios from "axios";
import ReportModal from "@/Service/Components/Board/ReportModal";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";


/** 댓글 입력 폼 */
function CommentForm({ postId, parentId = null, onCancel = null, autoFocus = false }) {
    // parent_id를 useForm 초기 상태에 포함해야 Inertia가 전송함
    const { data, setData, post, processing, reset, errors } = useForm({
        content: "",
        parent_id: parentId,
    });

    function submit(e) {
        e.preventDefault();
        post(`/post/${postId}/comments`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onCancel?.(); },
        });
    }

    return (
        <form onSubmit={submit} className="mt-2">
            <textarea
                value={data.content}
                onChange={e => setData("content", e.target.value)}
                rows={2}
                autoFocus={autoFocus}
                placeholder={parentId ? "대댓글을 입력하세요" : "댓글을 입력하세요"}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
            {errors.parent_id && <p className="text-xs text-red-500 mt-1">{errors.parent_id}</p>}
            <div className="flex justify-end gap-2 mt-1.5">
                {onCancel && (
                    <button type="button" onClick={onCancel}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 transition">
                        취소
                    </button>
                )}
                <button type="submit" disabled={processing || !data.content.trim()}
                    className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition">
                    {processing ? "등록 중..." : "등록"}
                </button>
            </div>
        </form>
    );
}

/** 댓글 단일 항목 */
function CommentItem({ comment, postId, authUser, maxDepth, replies = [], allComments, depth = 1 }) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const { delete: destroy, processing } = useForm();

    const isOwner  = authUser && authUser.id === comment.user_id;
    const canReply = authUser && comment.depth < maxDepth;
    const isNested = depth > 1;

    function handleDelete() {
        if (!confirm("댓글을 삭제하시겠습니까?")) return;
        destroy(`/comment/${comment.comment_id}`, { preserveScroll: true });
    }

    return (
        <li>
            <div className={`flex gap-3 py-3 ${isNested ? "pl-4" : ""}`}>
                {/* 들여쓰기 표시선 */}
                {isNested && (
                    <div className="shrink-0 flex flex-col items-center">
                        <div className="w-0.5 h-3 bg-blue-200 rounded-full mb-1" />
                        <div className="shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-500 uppercase">
                            {comment.author?.charAt(0) ?? "?"}
                        </div>
                    </div>
                )}
                {!isNested && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                        {comment.author?.charAt(0) ?? "?"}
                    </div>
                )}

                <div className={`flex-1 min-w-0 ${isNested ? "bg-slate-50 rounded-xl px-3 py-2 border border-slate-100" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                        {isNested && <span className="text-blue-400 text-xs">↳</span>}
                        <span className="text-sm font-semibold text-slate-700">{comment.author}</span>
                        <span className="text-xs text-slate-400">{timeAgo(comment.created_at)}</span>
                        {isNested && (
                            <span className="text-[10px] text-blue-400 bg-blue-50 border border-blue-100 rounded px-1 leading-tight">답글</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap wrap-break-word leading-relaxed">
                        {comment.content}
                    </p>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-3 mt-1.5">
                        {canReply && (
                            <button onClick={() => setShowReplyForm(v => !v)}
                                className="text-xs text-slate-400 hover:text-blue-500 transition">
                                💬 답글
                            </button>
                        )}
                        {isOwner && (
                            <button onClick={handleDelete} disabled={processing}
                                className="text-xs text-slate-400 hover:text-red-500 transition">
                                삭제
                            </button>
                        )}
                    </div>

                    {/* 답글 입력폼 */}
                    {showReplyForm && authUser && (
                        <div className="mt-2">
                            <CommentForm
                                postId={postId}
                                parentId={comment.comment_id}
                                onCancel={() => setShowReplyForm(false)}
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 대댓글 목록 */}
            {replies.length > 0 && (
                <ul className="border-l-2 border-blue-200 ml-10 pl-3 mb-1">
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.comment_id}
                            comment={reply}
                            postId={postId}
                            authUser={authUser}
                            maxDepth={maxDepth}
                            replies={allComments.filter(c => c.parent_id === reply.comment_id)}
                            allComments={allComments}
                            depth={depth + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

/** 공유 버튼 (클립보드 복사 + SNS) */
function ShareButton({ title, ogImage }) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const ref = useRef(null);

    // 바깥 클릭 시 닫기
    useEffect(() => {
        function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
        if (open) document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const currentUrl   = typeof window !== 'undefined' ? window.location.href : '';
    const encodedUrl   = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(title ?? '');

    function copyUrl() {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(currentUrl).then(() => {
                setCopied(true);
                setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
            });
        } else {
            const el = document.createElement('textarea');
            el.value = currentUrl;
            el.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
        }
    }

    function shareKakao() {
        const appKey = document.querySelector('meta[name="kakao-key"]')?.content;
        if (!appKey) { copyUrl(); return; }

        const doShare = () => {
            try {
                if (!window.Kakao.isInitialized()) {
                    window.Kakao.init(appKey);
                }
                const shareParams = ogImage
                    ? {
                        objectType: 'feed',
                        content: {
                            title: title ?? '',
                            description: '',
                            imageUrl: ogImage,
                            link: { mobileWebUrl: currentUrl, webUrl: currentUrl },
                        },
                        buttons: [{ title: '게시글 보기', link: { mobileWebUrl: currentUrl, webUrl: currentUrl } }],
                    }
                    : {
                        objectType: 'feed',
                        content: {
                            title: title ?? '',
                            description: currentUrl,
                            imageUrl: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png',
                            link: { mobileWebUrl: currentUrl, webUrl: currentUrl },
                        },
                        buttons: [{ title: '게시글 보기', link: { mobileWebUrl: currentUrl, webUrl: currentUrl } }],
                    };
                window.Kakao.Share.sendDefault(shareParams);
            } catch (e) {
                console.error('Kakao share error:', e);
                copyUrl();
            }
        };

        if (window.Kakao) {
            doShare();
        } else {
            const s = document.createElement('script');
            s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
            s.onload = doShare;
            s.onerror = () => copyUrl();
            document.head.appendChild(s);
        }
        setOpen(false);
    }

    // 인스타그램: 모바일은 Web Share API(시스템 공유 시트), 데스크탑은 URL 복사
    function shareInstagram() {
        if (navigator.share) {
            navigator.share({ title: title ?? '', url: currentUrl }).catch(() => {});
        } else {
            copyUrl();
        }
        setOpen(false);
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-500 transition"
                title="공유"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                공유
            </button>

            {open && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                    {/* 카카오톡 */}
                    <button
                        onClick={shareKakao}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FEE500">
                            <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.61 1.6 4.9 4 6.29l-.7 2.52c-.12.43.15.42.32.3l2.93-1.99c.47.07.95.11 1.46.11 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"/>
                        </svg>
                        카카오톡
                    </button>

                    {/* 인스타그램 */}
                    <button
                        onClick={shareInstagram}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#E4405F">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                        인스타그램
                    </button>

                    {/* 쓰레드 */}
                    <a
                        href={`https://www.threads.net/intent/post?text=${encodedTitle}%20${encodedUrl}`}
                        target="_blank" rel="noreferrer"
                        onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.29 8.29 0 004.83 1.53v-3.4a4.85 4.85 0 01-1.06-.19z"/>
                        </svg>
                        쓰레드
                    </a>

                    <div className="border-t border-gray-100 my-1" />

                    {/* X (Twitter) */}
                    <a
                        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                        target="_blank" rel="noreferrer"
                        onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        X (Twitter)
                    </a>

                    {/* Facebook */}
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                        target="_blank" rel="noreferrer"
                        onClick={() => setOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                    </a>

                    <div className="border-t border-gray-100 my-1" />

                    {/* URL 복사 */}
                    <button
                        onClick={copyUrl}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                        {copied
                            ? <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        }
                        {copied ? '복사됨!' : 'URL 복사'}
                    </button>
                </div>
            )}
        </div>
    );
}

/** 스크랩 버튼 */
function ScrapButton({ postId, initialScrapped, initialCount, authUser }) {
    const [scrapped, setScrapped] = useState(initialScrapped ?? false);
    const [count, setCount]       = useState(initialCount ?? 0);
    const [loading, setLoading]   = useState(false);

    async function handleToggle() {
        if (!authUser) {
            window.location.href = '/login';
            return;
        }
        if (loading) return;
        setLoading(true);
        try {
            const res = await axios.post(`/post/${postId}/scrap`);
            setScrapped(res.data.scrapped);
            setCount(res.data.count);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            title={scrapped ? '스크랩 취소' : '스크랩'}
            className={`flex items-center gap-1 text-xs transition disabled:opacity-50 ${
                scrapped ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-amber-500'
            }`}
        >
            <svg className="w-4 h-4" fill={scrapped ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            스크랩{count > 0 && <span className="font-mono ml-0.5">{count}</span>}
        </button>
    );
}

/** 좋아요/싫어요 바 */
function LikeBar({ postId, initialLike, initialDislike, initialUserType, useLike, useDislike, authUser }) {
    const [likeCount, setLikeCount]   = useState(initialLike ?? 0);
    const [dislikeCount, setDislikeCount] = useState(initialDislike ?? 0);
    const [userType, setUserType]     = useState(initialUserType ?? null);
    const [loading, setLoading]       = useState(false);

    if (!useLike && !useDislike) return null;

    async function handleToggle(type) {
        if (!authUser) {
            window.location.href = '/login';
            return;
        }
        if (loading) return;
        setLoading(true);
        try {
            const res = await axios.post(`/post/${postId}/like`, { type });
            setLikeCount(res.data.like_count);
            setDislikeCount(res.data.dislike_count);
            setUserType(res.data.user_type);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center gap-3 py-5 border-t border-gray-100">
            {useLike && (
                <button
                    onClick={() => handleToggle('LIKE')}
                    disabled={loading}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full border-2 text-sm font-semibold transition disabled:opacity-50 ${
                        userType === 'LIKE'
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-200 text-slate-500 hover:border-blue-400 hover:text-blue-500'
                    }`}
                >
                    <svg className="w-4 h-4" fill={userType === 'LIKE' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    좋아요 <span className="font-mono">{likeCount}</span>
                </button>
            )}
            {useDislike && (
                <button
                    onClick={() => handleToggle('DISLIKE')}
                    disabled={loading}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full border-2 text-sm font-semibold transition disabled:opacity-50 ${
                        userType === 'DISLIKE'
                            ? 'border-rose-500 bg-rose-500 text-white'
                            : 'border-gray-200 text-slate-500 hover:border-rose-400 hover:text-rose-500'
                    }`}
                >
                    <svg className="w-4 h-4 rotate-180" fill={userType === 'DISLIKE' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    싫어요 <span className="font-mono">{dislikeCount}</span>
                </button>
            )}
        </div>
    );
}

export default function PostDetail({ post, summary = null, isOwner = false, boardPosts = [], boardPostsTotal = 0, boardPostsPage = 1, boardPostsPerPage = 15, comments = [], maxDepth = 2, boardOptions = {}, userLikeType = null, isScrapped = false, scrapCount = 0, prevPost = null, nextPost = null, seo = {} }) {
    const { auth } = usePage().props;
    const authUser  = auth?.user ?? null;
    const [showReport, setShowReport] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [lightboxSlides, setLightboxSlides] = useState([]);
    const { delete: destroy, processing: deleting } = useForm();
    const contentRef = useRef(null);

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const imgs = Array.from(el.querySelectorAll('img'));
        const slides = imgs.map(img => ({ src: img.src, alt: img.alt }));
        setLightboxSlides(slides);
        imgs.forEach((img, i) => {
            img.style.cursor = 'zoom-in';
            img.onclick = () => setLightboxIndex(i);
            img.onerror = () => {
                const placeholder = document.createElement('div');
                placeholder.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;color:#94a3b8;font-size:13px;max-width:100%;';
                placeholder.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>이미지를 불러올 수 없습니다';
                img.replaceWith(placeholder);
            };
        });
        return () => { imgs.forEach(img => { img.onclick = null; img.onerror = null; }); };
    }, [post?.content]);

    if (!post) return null;

    // 최상위 댓글만 뽑아서 렌더링 (대댓글은 재귀로 처리)
    const topLevel = comments.filter(c => !c.parent_id);

    // JSON-LD 구조화 데이터 (Article 스키마)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: seo.description ?? '',
        author: { '@type': 'Person', name: post.author },
        datePublished: seo.publishedAt ?? post.created_at,
        url: seo.canonical ?? '',
        ...(seo.ogImage ? { image: seo.ogImage } : {}),
    };

    return (
        <ServiceLayout theme="light">
            <Head>
                <title>{seo.title ?? post.title}</title>
                <meta name="description" content={seo.description ?? ''} />
                <link rel="canonical" href={seo.canonical ?? ''} />
                <meta property="og:type" content="article" />
                <meta property="og:title" content={seo.title ?? post.title} />
                <meta property="og:description" content={seo.description ?? ''} />
                <meta property="og:url" content={seo.canonical ?? ''} />
                {seo.ogImage ? <meta property="og:image" content={seo.ogImage} /> : null}
                {seo.publishedAt ? <meta property="article:published_time" content={seo.publishedAt} /> : null}
                <meta name="twitter:title" content={seo.title ?? post.title} />
                <meta name="twitter:description" content={seo.description ?? ''} />
                {seo.ogImage ? <meta name="twitter:image" content={seo.ogImage} /> : null}
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Head>
            {/* 브레드크럼 */}
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                <Link href="/" className="hover:text-blue-500 transition">홈</Link>
                <span className="text-slate-300">›</span>
                <Link href={`/board/${post.category}`} className="hover:text-blue-500 transition">
                    {post.board_name}
                </Link>
                <span className="text-slate-300">›</span>
                <span className="text-slate-600 truncate max-w-xs">{post.title}</span>
            </div>

            <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* 게시글 헤더 */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        {post.is_notice && (
                            <span className="text-[10px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 leading-tight">공지</span>
                        )}
                        {post.board_name && (
                            <Link href={`/board/${post.category}`}
                                className="text-[10px] font-medium text-blue-500 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 leading-tight hover:bg-blue-100 transition">
                                {post.board_name}
                            </Link>
                        )}
                    </div>
                    <h1 className="text-lg font-bold text-slate-800 leading-snug mb-3">{post.title}</h1>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="font-medium text-slate-600">{post.author}</span>
                        <span className="text-slate-300">·</span>
                        <span>{timeAgo(post.created_at)}</span>
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {fmtHits(post.hits)}
                        </span>
                        {comments.length > 0 && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span>댓글 {comments.length}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* AI 요약 */}
                {summary && (
                    <div className="mx-5 mb-0 mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-400">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI 요약
                        </p>
                        <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
                    </div>
                )}

                {/* 본문 */}
                <div
                    ref={contentRef}
                    className="px-5 py-6 prose prose-sm max-w-none text-slate-700 leading-relaxed post-content"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* 좋아요 / 싫어요 */}
                <LikeBar
                    postId={post.post_id}
                    initialLike={post.like_count}
                    initialDislike={post.dislike_count}
                    initialUserType={userLikeType}
                    useLike={boardOptions.use_like ?? true}
                    useDislike={boardOptions.use_dislike ?? false}
                    authUser={authUser}
                />

                {/* 이전글 / 다음글 */}
                {(prevPost || nextPost) && (
                    <div className="border-t border-gray-100 text-sm">
                        {nextPost && (
                            <Link
                                href={`/post/${nextPost.post_id}`}
                                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition border-b border-gray-100 group"
                            >
                                <span className="shrink-0 flex items-center gap-1 text-xs text-slate-400 w-14">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                    다음글
                                </span>
                                <span className="text-slate-700 truncate group-hover:text-blue-500 transition">{nextPost.title}</span>
                            </Link>
                        )}
                        {prevPost && (
                            <Link
                                href={`/post/${prevPost.post_id}`}
                                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition group"
                            >
                                <span className="shrink-0 flex items-center gap-1 text-xs text-slate-400 w-14">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    이전글
                                </span>
                                <span className="text-slate-700 truncate group-hover:text-blue-500 transition">{prevPost.title}</span>
                            </Link>
                        )}
                    </div>
                )}

                {/* 하단 */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                    <Link href={`/board/${post.category}`} className="text-sm text-slate-500 hover:text-blue-500 transition">
                        ← 목록
                    </Link>
                    <div className="flex items-center gap-4">
                        <ScrapButton
                            postId={post.post_id}
                            initialScrapped={isScrapped}
                            initialCount={scrapCount}
                            authUser={authUser}
                        />
                        <ShareButton title={post.title} ogImage={seo.ogImage ?? null} />
                        {!isOwner && (
                            <button
                                onClick={() => setShowReport(true)}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H13l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                </svg>
                                신고
                            </button>
                        )}
                        {isOwner && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                삭제
                            </button>
                        )}
                    </div>
                </div>
            </article>

            <Lightbox
                open={lightboxIndex >= 0}
                index={lightboxIndex}
                close={() => setLightboxIndex(-1)}
                slides={lightboxSlides}
                plugins={[Zoom]}
            />
            {showReport && <ReportModal postId={post.post_id} onClose={() => setShowReport(false)} />}

            {/* 삭제 확인 모달 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-80 mx-4">
                        <h3 className="text-base font-bold text-slate-800 mb-2">게시글 삭제</h3>
                        <p className="text-sm text-slate-500 mb-5">
                            게시글을 삭제하면 첨부 파일과 함께 복구할 수 없습니다.<br />삭제하시겠습니까?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="px-4 py-2 text-sm text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => destroy(`/post/${post.post_id}`, {
                                    onSuccess: () => setShowDeleteConfirm(false),
                                })}
                                disabled={deleting}
                                className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                            >
                                {deleting ? '삭제 중...' : '삭제'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 같은 게시판 글 목록 */}
            {boardPosts.length > 0 && (() => {
                const totalPages = Math.ceil(boardPostsTotal / boardPostsPerPage);
                const goPage = (page) => router.visit(`/post/${post.post_id}`, {
                    data: { list_page: page },
                    preserveScroll: false,
                    preserveState: false,
                });

                const pageNumbers = (() => {
                    const range = [];
                    const start = Math.max(1, boardPostsPage - 2);
                    const end   = Math.min(totalPages, boardPostsPage + 2);
                    for (let i = start; i <= end; i++) range.push(i);
                    return range;
                })();

                return (
                    <section className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-700">{post.board_name} 글 목록</h2>
                            <Link href={`/board/${post.category}`} className="text-xs text-blue-500 hover:underline">
                                전체보기
                            </Link>
                        </div>

                        <ul className="divide-y divide-gray-100">
                            {boardPosts.map(p => {
                                const isCurrent = p.post_id === post.post_id;
                                return (
                                    <li key={p.post_id} className={isCurrent ? "bg-blue-50" : ""}>
                                        <Link
                                            href={`/post/${p.post_id}`}
                                            className={`flex items-center gap-3 px-5 py-2.5 transition group ${isCurrent ? "cursor-default pointer-events-none" : "hover:bg-slate-50"}`}
                                        >
                                            {p.is_notice && (
                                                <span className="shrink-0 text-[10px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 leading-tight">공지</span>
                                            )}
                                            {isCurrent && (
                                                <span className="shrink-0 text-[10px] font-bold text-white bg-blue-500 rounded px-1.5 py-0.5 leading-tight">현재글</span>
                                            )}
                                            {p.has_image && (
                                                <svg className="shrink-0 w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                            <span className={`flex-1 text-sm truncate transition ${isCurrent ? "font-bold text-blue-600" : "text-slate-700 group-hover:text-blue-500"}`}>
                                                {p.title}
                                            </span>
                                            <span className="shrink-0 text-xs text-slate-400 hidden sm:block">{p.name}</span>
                                            {p.comment_count > 0 && (
                                                <span className="shrink-0 text-xs text-blue-400 font-medium">[{p.comment_count}]</span>
                                            )}
                                            <span className="shrink-0 text-xs text-slate-300">{timeAgo(p.created_at)}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-1 px-5 py-3 border-t border-gray-100">
                                <button
                                    onClick={() => goPage(boardPostsPage - 1)}
                                    disabled={boardPostsPage <= 1}
                                    className="px-2 py-1 text-xs text-slate-500 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    ‹
                                </button>
                                {pageNumbers.map(n => (
                                    <button
                                        key={n}
                                        onClick={() => goPage(n)}
                                        className={`px-2.5 py-1 text-xs rounded transition ${n === boardPostsPage ? "bg-blue-500 text-white font-bold" : "text-slate-500 hover:text-blue-500 hover:bg-blue-50"}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                                <button
                                    onClick={() => goPage(boardPostsPage + 1)}
                                    disabled={boardPostsPage >= totalPages}
                                    className="px-2 py-1 text-xs text-slate-500 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </section>
                );
            })()}

            {/* 댓글 영역 */}
            <section className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-700 mb-1">
                    댓글 <span className="text-blue-500">{comments.length}</span>
                </h2>

                {/* 댓글 목록 */}
                {topLevel.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                        {topLevel.map(c => (
                            <CommentItem
                                key={c.comment_id}
                                comment={c}
                                postId={post.post_id}
                                authUser={authUser}
                                maxDepth={maxDepth}
                                replies={comments.filter(r => r.parent_id === c.comment_id)}
                                allComments={comments}
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-400 py-6 text-center">첫 댓글을 남겨보세요.</p>
                )}

                {/* 최상위 댓글 입력 */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                    {authUser ? (
                        <div className="flex gap-3">
                            <div className="shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-500 uppercase">
                                {authUser.name?.charAt(0) ?? "?"}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 mb-1">
                                    <span className="font-semibold text-slate-700">{authUser.name}</span>으로 댓글 작성
                                </p>
                                <CommentForm postId={post.post_id} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-3">
                            <p className="text-sm text-slate-500 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
                            <Link href="/login" className="text-sm text-blue-500 hover:underline font-medium">로그인하기</Link>
                        </div>
                    )}
                </div>
            </section>
        </ServiceLayout>
    );
}
