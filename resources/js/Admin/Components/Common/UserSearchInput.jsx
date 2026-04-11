import React, { useState, useEffect, useRef } from "react";
import { ajax } from "@/Utils/network";

/**
 * 회원 검색 입력 컴포넌트
 *
 * Props:
 *   initialText  - 초기 표시 텍스트 (수정 모드에서 기존 회원 이름/이메일 표시용)
 *   onSelect     - 회원 선택 시 콜백 (user 객체 또는 null 전달)
 *   error        - 외부에서 전달하는 에러 메시지
 *   placeholder  - 입력창 placeholder (기본값: "회원 이름 또는 이메일 검색")
 */
export default function UserSearchInput({ initialText = "", onSelect, error, placeholder = "회원 이름 또는 이메일 검색" }) {
    const [userSearch, setUserSearch] = useState(initialText);

    // initialText가 바뀌면 (모달 열릴 때마다) 입력값 동기화
    useEffect(() => {
        setUserSearch(initialText);
    }, [initialText]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef(null);

    const fetchSuggestions = async (keyword) => {
        try {
            const json = await ajax.get("/admin/users/search", { keyword });
            if (json.success) {
                setSuggestions(json.data || []);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleChange = (value) => {
        setUserSearch(value);
        onSelect(null);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (value.trim().length >= 2) {
            searchTimeout.current = setTimeout(() => fetchSuggestions(value.trim()), 250);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelect = (user) => {
        setUserSearch(user.name && user.email ? `${user.name} (${user.email})` : user.name || user.email || "");
        setSuggestions([]);
        setShowSuggestions(false);
        onSelect(user);
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={userSearch}
                onChange={(e) => handleChange(e.target.value)}
                autoComplete="off"
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                    {suggestions.map((user) => (
                        <li
                            key={user.id}
                            onClick={() => handleSelect(user)}
                            className="cursor-pointer px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"
                        >
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email} · ID {user.id}</div>
                        </li>
                    ))}
                </ul>
            )}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
