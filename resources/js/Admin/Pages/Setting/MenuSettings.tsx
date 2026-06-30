import React, { useState } from "react";
import { useForm, usePage, router } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";

interface MenuItem {
    [key: string]: unknown;
    label: string;
    href: string;
    new_tab?: boolean;
    children: ChildItem[];
}

interface ChildItem {
    label: string;
    href: string;
}

const newItem    = (label = "", href = ""): MenuItem => ({ label, href, children: [] });
const newChild   = (label = "", href = ""): ChildItem => ({ label, href });

function move<T>(arr: T[], idx: number, dir: number): T[] {
    const next = [...arr];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return arr;
    [next[idx], next[target]] = [next[target], next[idx]];
    return next;
}

// ── 소메뉴 행 ────────────────────────────────────────────────────────────────
interface ChildRowProps {
    child: ChildItem;
    idx: number;
    total: number;
    onChange: (idx: number, field: string, val: string) => void;
    onRemove: (idx: number) => void;
    onMove: (idx: number, dir: number) => void;
}

function ChildRow({ child, idx, total, onChange, onRemove, onMove }: ChildRowProps) {
    return (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => onMove(idx, -1)} disabled={idx === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </button>
                <button type="button" onClick={() => onMove(idx, 1)} disabled={idx === total - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-20 leading-none">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>
            <span className="text-xs text-gray-400 w-4 text-center">{idx + 1}</span>
            <input
                type="text"
                value={child.label}
                onChange={(e) => onChange(idx, "label", e.target.value)}
                placeholder="메뉴명"
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <input
                type="text"
                value={child.href}
                onChange={(e) => onChange(idx, "href", e.target.value)}
                placeholder="URL (예: /board/free)"
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button type="button" onClick={() => onRemove(idx)}
                className="text-red-400 hover:text-red-600 transition shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

// ── 대메뉴 카드 ──────────────────────────────────────────────────────────────
interface MenuCardProps {
    item: MenuItem;
    idx: number;
    total: number;
    onChange: (idx: number, field: string, val: any) => void;
    onRemove: (idx: number) => void;
    onMove: (idx: number, dir: number) => void;
}

function MenuCard({ item, idx, total, onChange, onRemove, onMove }: MenuCardProps) {
    const [expanded, setExpanded] = useState<boolean>(true);

    const updateChild = (ci: number, field: string, val: string) => {
        const children = item.children.map((c, i) => i === ci ? { ...c, [field]: val } : c);
        onChange(idx, "children", children);
    };
    const removeChild = (ci: number) => onChange(idx, "children", item.children.filter((_, i) => i !== ci));
    const moveChild   = (ci: number, dir: number) => onChange(idx, "children", move(item.children, ci, dir));
    const addChild    = () => onChange(idx, "children", [...item.children, newChild()]);

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* 대메뉴 헤더 */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-gray-100">
                {/* 순서 이동 */}
                <div className="flex gap-1">
                    <button type="button" onClick={() => onMove(idx, -1)} disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 rounded">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button type="button" onClick={() => onMove(idx, 1)} disabled={idx === total - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 rounded">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                <span className="text-xs font-bold text-slate-400 w-5 text-center">{idx + 1}</span>

                <input
                    type="text"
                    value={item.label}
                    onChange={(e) => onChange(idx, "label", e.target.value)}
                    placeholder="대메뉴명"
                    className="font-semibold text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
                />
                <input
                    type="text"
                    value={item.href}
                    onChange={(e) => onChange(idx, "href", e.target.value)}
                    placeholder="URL (소메뉴 있으면 비워도 됨)"
                    className="flex-1 text-sm font-mono border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <label className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap cursor-pointer select-none shrink-0">
                    <input
                        type="checkbox"
                        checked={!!item.new_tab}
                        onChange={(e) => onChange(idx, "new_tab", e.target.checked)}
                        className="w-3.5 h-3.5 accent-blue-600"
                    />
                    새창
                </label>

                <button type="button" onClick={() => setExpanded((v) => !v)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition">
                    <svg className={`w-4 h-4 transition-transform ${expanded ? "" : "-rotate-90"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <button type="button" onClick={() => onRemove(idx)}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {/* 소메뉴 영역 */}
            {expanded && (
                <div className="px-4 py-3 space-y-2 bg-gray-50/50">
                    {item.children.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-1">소메뉴 없음 — 대메뉴 URL로 직접 이동</p>
                    ) : (
                        item.children.map((child, ci) => (
                            <ChildRow
                                key={ci}
                                child={child}
                                idx={ci}
                                total={item.children.length}
                                onChange={updateChild}
                                onRemove={removeChild}
                                onMove={moveChild}
                            />
                        ))
                    )}
                    <button
                        type="button"
                        onClick={addChild}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 transition"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        소메뉴 추가
                    </button>
                </div>
            )}
        </div>
    );
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────
interface MenuSettingsProps {
    menu?: MenuItem[];
}

export default function MenuSettings({ menu: initialMenu = [] }: MenuSettingsProps) {
    const { auth, flash } = usePage<any>().props;
    const [menu, setMenu]     = useState<MenuItem[]>(initialMenu);
    const [saving, setSaving] = useState<boolean>(false);
    const [saved,  setSaved]  = useState<boolean>(false);

    const updateItem = (idx: number, field: string, val: any) =>
        setMenu((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    const removeItem = (idx: number) => setMenu((prev) => prev.filter((_, i) => i !== idx));
    const moveItem   = (idx: number, dir: number) => setMenu((prev) => move(prev, idx, dir));
    const addItem    = () => setMenu((prev) => [...prev, newItem()]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        router.post("/admin/settings/menu", { menu: menu as any }, {
            onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
            onFinish:  () => setSaving(false),
        });
    }

    function handleReset() {
        if (!confirm("메뉴를 초기화하면 게시판 목록 기반 기본 메뉴로 되돌아갑니다. 계속하시겠습니까?")) return;
        router.post("/admin/settings/menu", { menu: [] }, {
            onSuccess: () => { setMenu([]); setSaved(true); setTimeout(() => setSaved(false), 3000); },
        });
    }

    return (
        <AdminLayout>
            <div className="p-6 max-w-3xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">메뉴 설정</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        서비스 상단 네비게이션 메뉴를 설정합니다. 대메뉴에 소메뉴를 추가하면 드롭다운으로 표시됩니다.
                    </p>
                </div>

                {flash?.success && (
                    <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    {menu.length === 0 && (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-sm text-gray-400">
                            메뉴 항목이 없습니다. 아래 버튼으로 추가하세요.
                        </div>
                    )}

                    {menu.map((item, idx) => (
                        <MenuCard
                            key={idx}
                            item={item}
                            idx={idx}
                            total={menu.length}
                            onChange={updateItem}
                            onRemove={removeItem}
                            onMove={moveItem}
                        />
                    ))}

                    {/* 대메뉴 추가 버튼 */}
                    <button
                        type="button"
                        onClick={addItem}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-500 hover:bg-blue-50 rounded-xl text-sm font-semibold transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        대메뉴 추가
                    </button>

                    {/* 저장 / 초기화 */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition"
                        >
                            {saving ? "저장 중..." : "저장"}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-4 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl transition"
                        >
                            기본값으로 초기화
                        </button>
                        {saved && (
                            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                저장되었습니다.
                            </span>
                        )}
                    </div>
                </form>

                {/* 미리보기 */}
                {menu.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">미리보기</h2>
                        <div className="bg-[#1a3a5c] rounded-xl px-4 h-10 flex items-center gap-0.5 overflow-x-auto">
                            {menu.map((item) => (
                                <div key={item.label} className="relative group">
                                    <div className="px-3 h-10 flex items-center gap-1 text-white/90 text-sm font-medium whitespace-nowrap cursor-default">
                                        {item.label}
                                        {item.new_tab && (
                                            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        )}
                                        {item.children.length > 0 && (
                                            <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </div>
                                    {item.children.length > 0 && (
                                        <div className="hidden group-hover:block absolute top-full left-0 z-10 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-32">
                                            {item.children.map((c) => (
                                                <div key={c.href} className="px-4 py-2 text-sm text-slate-700 whitespace-nowrap">
                                                    {c.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
