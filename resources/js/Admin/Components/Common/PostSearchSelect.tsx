import React, { useState } from "react";
import { route } from "ziggy-js";
import { ajax } from "@/Utils/network";

interface Post {
    post_id: number;
    title: string;
    post_category: string;
}

interface PostSearchSelectProps {
    selectedPost: Post | null;
    onSelect: (post: Post | null) => void;
}

/**
 * 게시글 검색 + 선택 컴포넌트
 *
 * Props:
 *   selectedPost - 현재 선택된 게시글 객체 (null이면 검색 입력 표시)
 *   onSelect     - 선택/해제 시 콜백 (post 객체 또는 null 전달)
 */
export default function PostSearchSelect({ selectedPost, onSelect }: PostSearchSelectProps) {
    const [keyword, setKeyword] = useState<string>("");
    const [results, setResults] = useState<Post[]>([]);
    const [searching, setSearching] = useState<boolean>(false);

    function search(kw: string) {
        setKeyword(kw);
        if (kw.trim().length < 1) { setResults([]); return; }
        setSearching(true);
        ajax.get(route("admin.posts.search"), { keyword: kw })
            .then((data: any) => setResults(data ?? []))
            .catch(() => setResults([]))
            .finally(() => setSearching(false));
    }

    if (selectedPost) {
        return (
            <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-700 flex-1 truncate">
                    <span className="text-blue-500 font-mono text-xs mr-1">[{selectedPost.post_id}]</span>
                    {selectedPost.title}
                </span>
                <button
                    type="button"
                    onClick={() => { onSelect(null); setResults([]); setKeyword(""); }}
                    className="shrink-0 text-slate-400 hover:text-red-500 transition text-base leading-none"
                >
                    &times;
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <input
                type="text"
                value={keyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => search(e.target.value)}
                placeholder="게시글 제목으로 검색..."
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {searching && (
                <div className="absolute right-3 top-2.5 text-xs text-slate-400">검색 중...</div>
            )}
            {results.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {results.map((post) => (
                        <li key={post.post_id}>
                            <button
                                type="button"
                                onClick={() => { onSelect(post); setResults([]); setKeyword(""); }}
                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition flex items-center gap-2"
                            >
                                <span className="shrink-0 text-xs text-slate-400 font-mono">#{post.post_id}</span>
                                <span className="flex-1 truncate text-slate-700">{post.title}</span>
                                <span className="shrink-0 text-[10px] text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">{post.post_category}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {keyword.length > 0 && !searching && results.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow px-3 py-3 text-sm text-slate-400 text-center">
                    검색 결과가 없습니다.
                </div>
            )}
        </div>
    );
}
