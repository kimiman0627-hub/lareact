import React, { useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";

/* ── 공통 ── */
const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition";
const errCls   = "w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition";

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

function Modal({ title, onClose, children, maxW = "max-w-md" }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className={`bg-white rounded-xl shadow-xl w-full ${maxW} max-h-[90vh] flex flex-col`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="font-bold text-slate-700">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="px-6 py-5 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

function SubmitRow({ processing, label, color = "blue", onCancel }) {
    const colors = {
        blue:   "bg-blue-600 hover:bg-blue-700",
        amber:  "bg-amber-500 hover:bg-amber-600",
        red:    "bg-red-600 hover:bg-red-700",
        green:  "bg-emerald-600 hover:bg-emerald-700",
    };
    return (
        <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onCancel}
                className="px-4 py-2 text-sm text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                취소
            </button>
            <button type="submit" disabled={processing}
                className={`px-4 py-2 text-sm text-white font-bold rounded-lg disabled:opacity-60 transition ${colors[color]}`}>
                {processing ? "처리 중..." : label}
            </button>
        </div>
    );
}

/* ── 생성 모달 ── */
function CreateModal({ onClose }) {
    const form = useForm({ name: "", email: "", password: "", password_confirmation: "", is_super: false });

    function submit(e) {
        e.preventDefault();
        form.post("/admin/admins", { onSuccess: () => { form.reset(); onClose(); } });
    }

    return (
        <Modal title="관리자 추가" onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <Field label="이름" error={form.errors.name}>
                    <input type="text" value={form.data.name}
                        onChange={e => form.setData("name", e.target.value)}
                        className={form.errors.name ? errCls : inputCls} placeholder="관리자 이름" />
                </Field>
                <Field label="이메일" error={form.errors.email}>
                    <input type="email" value={form.data.email}
                        onChange={e => form.setData("email", e.target.value)}
                        className={form.errors.email ? errCls : inputCls} placeholder="admin@example.com" />
                </Field>
                <Field label="비밀번호" error={form.errors.password}>
                    <input type="password" value={form.data.password}
                        onChange={e => form.setData("password", e.target.value)}
                        className={form.errors.password ? errCls : inputCls} placeholder="8자 이상" autoComplete="new-password" />
                </Field>
                <Field label="비밀번호 확인" error={form.errors.password_confirmation}>
                    <input type="password" value={form.data.password_confirmation}
                        onChange={e => form.setData("password_confirmation", e.target.value)}
                        className={form.errors.password_confirmation ? errCls : inputCls}
                        placeholder="비밀번호 재입력" autoComplete="new-password" />
                </Field>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.data.is_super}
                        onChange={e => form.setData("is_super", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-slate-700 font-medium">슈퍼 관리자</span>
                    <span className="text-xs text-slate-400">(모든 메뉴 접근 가능)</span>
                </label>
                <SubmitRow processing={form.processing} label="생성" color="blue" onCancel={onClose} />
            </form>
        </Modal>
    );
}

/* ── 정보 수정 모달 ── */
function EditModal({ admin, onClose }) {
    const form = useForm({ name: admin.name, email: admin.email });

    function submit(e) {
        e.preventDefault();
        form.put(`/admin/admins/${admin.id}`, { onSuccess: onClose });
    }

    return (
        <Modal title={`정보 수정 — ${admin.name}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <Field label="이름" error={form.errors.name}>
                    <input type="text" value={form.data.name}
                        onChange={e => form.setData("name", e.target.value)}
                        className={form.errors.name ? errCls : inputCls} />
                </Field>
                <Field label="이메일" error={form.errors.email}>
                    <input type="email" value={form.data.email}
                        onChange={e => form.setData("email", e.target.value)}
                        className={form.errors.email ? errCls : inputCls} />
                </Field>
                <SubmitRow processing={form.processing} label="저장" color="blue" onCancel={onClose} />
            </form>
        </Modal>
    );
}

/* ── 비밀번호 변경 모달 ── */
function PasswordModal({ admin, currentAdminId, onClose }) {
    const isSelf = admin.id === currentAdminId;
    const form = useForm({ current_password: "", password: "", password_confirmation: "" });

    function submit(e) {
        e.preventDefault();
        form.post(`/admin/admins/${admin.id}/password`, {
            onSuccess: () => { form.reset(); onClose(); },
        });
    }

    return (
        <Modal title={`비밀번호 변경 — ${admin.name}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                {isSelf && (
                    <Field label="현재 비밀번호" error={form.errors.current_password}>
                        <input type="password" value={form.data.current_password}
                            onChange={e => form.setData("current_password", e.target.value)}
                            className={form.errors.current_password ? errCls : inputCls}
                            autoComplete="current-password" />
                    </Field>
                )}
                <Field label="새 비밀번호" error={form.errors.password}>
                    <input type="password" value={form.data.password}
                        onChange={e => form.setData("password", e.target.value)}
                        className={form.errors.password ? errCls : inputCls}
                        placeholder="8자 이상" autoComplete="new-password" />
                </Field>
                <Field label="새 비밀번호 확인" error={form.errors.password_confirmation}>
                    <input type="password" value={form.data.password_confirmation}
                        onChange={e => form.setData("password_confirmation", e.target.value)}
                        className={form.errors.password_confirmation ? errCls : inputCls}
                        autoComplete="new-password" />
                </Field>
                <SubmitRow processing={form.processing} label="비밀번호 변경" color="amber" onCancel={onClose} />
            </form>
        </Modal>
    );
}

/* ── 권한 설정 모달 ── */
function PermissionsModal({ admin, menuItems, onClose }) {
    const form = useForm({
        is_super:         admin.is_super ?? false,
        menu_permissions: (!admin.is_super && admin.menu_permissions) ? admin.menu_permissions : [],
    });

    const isSuper = form.data.is_super;
    const selected = form.data.menu_permissions;

    function setIsSuper(val) {
        form.setData('is_super', val);
    }

    function toggleRoute(route) {
        form.setData('menu_permissions',
            selected.includes(route)
                ? selected.filter(r => r !== route)
                : [...selected, route]
        );
    }

    function toggleGroup(routes) {
        const allChecked = routes.every(r => selected.includes(r));
        form.setData('menu_permissions',
            allChecked
                ? selected.filter(r => !routes.includes(r))
                : [...new Set([...selected, ...routes])]
        );
    }

    function submit(e) {
        e.preventDefault();
        form.put(`/admin/admins/${admin.id}/permissions`, { onSuccess: onClose });
    }

    return (
        <Modal title={`메뉴 권한 — ${admin.name}`} onClose={onClose} maxW="max-w-lg">
            <form onSubmit={submit} className="space-y-4">
                {/* 슈퍼 관리자 토글 */}
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${isSuper ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-gray-200 hover:bg-slate-100'}`}>
                    <input type="checkbox" checked={isSuper} onChange={e => setIsSuper(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-amber-500" />
                    <div>
                        <p className={`text-sm font-bold ${isSuper ? 'text-amber-700' : 'text-slate-700'}`}>슈퍼 관리자</p>
                        <p className="text-xs text-slate-400">모든 메뉴 접근 + 관리자 관리 권한 부여</p>
                    </div>
                </label>

                {/* 메뉴별 체크박스 */}
                {!isSuper && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">메뉴별 접근 권한</p>
                        {menuItems.filter(item => !item.super_only).map((item, idx) => {
                            const groupRoutes = item.submenu
                                ? item.submenu.map(s => s.route)
                                : [item.route];
                            const allChecked  = groupRoutes.every(r => selected.includes(r));
                            const someChecked = groupRoutes.some(r => selected.includes(r));

                            return (
                                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                    {/* 그룹 헤더 */}
                                    <label className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition select-none ${allChecked ? 'bg-blue-50' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                                            onChange={() => toggleGroup(groupRoutes)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 shrink-0"
                                        />
                                        <i className={`${item.icon} text-slate-400 w-4 text-xs shrink-0`} />
                                        <span className="text-sm font-semibold text-slate-700">{item.title}</span>
                                        {someChecked && (
                                            <span className="ml-auto text-[10px] text-blue-500 font-medium">
                                                {groupRoutes.filter(r => selected.includes(r)).length}/{groupRoutes.length}
                                            </span>
                                        )}
                                    </label>

                                    {/* 서브메뉴 항목 */}
                                    {item.submenu && (
                                        <div className="divide-y divide-gray-100 border-t border-gray-100">
                                            {item.submenu.map((sub, sIdx) => {
                                                const checked = selected.includes(sub.route);
                                                return (
                                                    <label key={sIdx}
                                                        className={`flex items-center gap-3 px-4 py-2 pl-10 cursor-pointer transition select-none ${checked ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleRoute(sub.route)}
                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 shrink-0"
                                                        />
                                                        <span className={`text-sm ${checked ? 'text-blue-700 font-medium' : 'text-slate-600'}`}>
                                                            {sub.title}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <SubmitRow processing={form.processing} label="권한 저장" color="green" onCancel={onClose} />
            </form>
        </Modal>
    );
}

/* ── 메인 페이지 ── */
export default function AdminManagerIndex({ admins, menuItems }) {
    const { auth } = usePage().props;
    const currentAdminId = auth?.admin?.id;

    const [createOpen, setCreateOpen]   = useState(false);
    const [editTarget, setEditTarget]   = useState(null);
    const [pwdTarget, setPwdTarget]     = useState(null);
    const [permTarget, setPermTarget]   = useState(null);

    const { delete: destroy, processing: deleting } = useForm();

    function handleDelete(admin) {
        if (!confirm(`"${admin.name}" 관리자를 삭제하시겠습니까?`)) return;
        destroy(`/admin/admins/${admin.id}`);
    }

    return (
        <AdminLayout>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">관리자 관리</h1>
                        <p className="text-sm text-slate-400 mt-1">관리자 계정 생성, 정보 수정, 메뉴 권한을 설정합니다.</p>
                    </div>
                    <button onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        관리자 추가
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">이름 / 이메일</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">등급</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">가입일</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {admins.map(admin => (
                                <tr key={admin.id} className={`hover:bg-slate-50 transition ${admin.id === currentAdminId ? "bg-blue-50/60" : ""}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                {admin.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {admin.name}
                                                    {admin.id === currentAdminId && (
                                                        <span className="ml-1.5 text-[10px] text-blue-500 bg-blue-50 border border-blue-200 rounded px-1 py-0.5">나</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-400">{admin.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {admin.is_super ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                슈퍼
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">일반</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString('ko-KR') : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => setEditTarget(admin)}
                                                className="px-2.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition">
                                                정보수정
                                            </button>
                                            <button onClick={() => setPwdTarget(admin)}
                                                className="px-2.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition">
                                                비밀번호
                                            </button>
                                            <button onClick={() => setPermTarget(admin)}
                                                className="px-2.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition">
                                                권한
                                            </button>
                                            {admin.id !== currentAdminId && (
                                                <button onClick={() => handleDelete(admin)} disabled={deleting}
                                                    className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {createOpen  && <CreateModal onClose={() => setCreateOpen(false)} />}
            {editTarget  && <EditModal admin={editTarget} onClose={() => setEditTarget(null)} />}
            {pwdTarget   && <PasswordModal admin={pwdTarget} currentAdminId={currentAdminId} onClose={() => setPwdTarget(null)} />}
            {permTarget  && <PermissionsModal admin={permTarget} menuItems={menuItems} onClose={() => setPermTarget(null)} />}
        </AdminLayout>
    );
}
