import React, { useState, useEffect } from "react";
import Modal from "react-modal";

const DEFAULT_OPTIONS = {
    read_permission: "ALL",
    write_permission: "MEMBER",
    comment_enabled: true,
    comment_permission: "MEMBER",
    allow_anonymous: false,
    show_anonymous: false,
    secret_comment: false,
    point_enabled: false,
    point_amount: 0,
    point_cycle: "ONCE",
    file_upload: true,
    file_size_limit: 10,
    posts_per_page: 20,
    use_like: true,
    use_dislike: false,
    thumbnail_enabled: true,
    notice_count: 3,
};

const DEFAULT_FORM = {
    board_name: "",
    board_order: 0,
    board_type: "NORMAL",
    board_layout: "GENERAL",
    board_status: "ACTIVE",
    category: "",
    options: { ...DEFAULT_OPTIONS },
};

const TABS = ["기본 정보", "권한 / 댓글", "포인트 / 파일", "기타"];

const SelectField = ({ label, value, onChange, options }) => (
    <div className="space-y-1">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
        >
            {Object.entries(options).map(([k, v]) => (
                <option key={k} value={k}>
                    {v}
                </option>
            ))}
        </select>
    </div>
);

const Toggle = ({ label, desc, checked, onChange }) => (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-2">
        <span className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            {desc && <span className="text-xs text-slate-400">{desc}</span>}
        </span>
        <div
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300"}`}
        >
            <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
            />
        </div>
    </label>
);

const NumberField = ({ label, value, onChange, min = 0, max }) => (
    <div className="space-y-1">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <input
            type="number"
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
        />
    </div>
);

export default function BoardModal({
    isOpen,
    onClose,
    onSubmit,
    selectedBoard = null,
    boardTypes = {},
    boardLayouts = {},
    boardStatuses = {},
    boardOptions = {},
}) {
    const [tab, setTab] = useState(0);
    const [form, setForm] = useState(DEFAULT_FORM);

    const permissions = boardOptions.permissions ?? {
        ALL: "전체",
        MEMBER: "회원",
        ADMIN: "관리자",
    };
    const pointCycles = boardOptions.point_cycles ?? {
        ONCE: "최초 1회",
        DAILY: "일 1회",
        PER_POST: "작성마다",
    };

    useEffect(() => {
        setTab(0);
        if (selectedBoard) {
            setForm({
                ...DEFAULT_FORM,
                ...selectedBoard,
                options: {
                    ...DEFAULT_OPTIONS,
                    ...(selectedBoard.options ?? {}),
                },
            });
        } else {
            setForm({ ...DEFAULT_FORM, options: { ...DEFAULT_OPTIONS } });
        }
    }, [selectedBoard, isOpen]);

    const set = (key, value) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const setOpt = (key, value) =>
        setForm((prev) => ({
            ...prev,
            options: { ...prev.options, [key]: value },
        }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            shouldCloseOnOverlayClick={false}
            contentLabel="Board Modal"
            overlayClassName="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-auto outline-none max-h-[92vh] overflow-y-auto"
        >
            <div className="p-6 md:p-8 space-y-5">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">
                        {selectedBoard ? "게시판 수정" : "게시판 등록"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-900 transition"
                    >
                        닫기
                    </button>
                </div>

                {/* 탭 */}
                <div className="flex gap-1 border-b border-slate-200">
                    {TABS.map((t, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setTab(i)}
                            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                                tab === i
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ── Tab 0: 기본 정보 ── */}
                    {tab === 0 && (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-600">
                                        게시판명{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.board_name}
                                        onChange={(e) =>
                                            set("board_name", e.target.value)
                                        }
                                        required
                                        placeholder="예) 자유게시판"
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-600">
                                        카테고리 키{" "}
                                        <span className="text-red-500">*</span>
                                        <span className="ml-1 text-xs text-slate-400 font-normal">
                                            (영문/숫자/언더바)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.category}
                                        onChange={(e) =>
                                            set("category", e.target.value)
                                        }
                                        required
                                        placeholder="예) FREE"
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <SelectField
                                    label="게시판 구분"
                                    value={form.board_type}
                                    onChange={(e) =>
                                        set("board_type", e.target.value)
                                    }
                                    options={boardTypes}
                                />
                                <SelectField
                                    label="게시판 타입"
                                    value={form.board_layout}
                                    onChange={(e) =>
                                        set("board_layout", e.target.value)
                                    }
                                    options={boardLayouts}
                                />
                                <SelectField
                                    label="상태"
                                    value={form.board_status}
                                    onChange={(e) =>
                                        set("board_status", e.target.value)
                                    }
                                    options={boardStatuses}
                                />
                            </div>

                            <NumberField
                                label="정렬 순서 (낮을수록 앞에 표시)"
                                value={form.board_order}
                                onChange={(e) =>
                                    set("board_order", Number(e.target.value))
                                }
                                min={0}
                            />
                        </div>
                    )}

                    {/* ── Tab 1: 권한 / 댓글 ── */}
                    {tab === 1 && (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <SelectField
                                    label="읽기 권한"
                                    value={form.options.read_permission}
                                    onChange={(e) =>
                                        setOpt(
                                            "read_permission",
                                            e.target.value,
                                        )
                                    }
                                    options={permissions}
                                />
                                <SelectField
                                    label="쓰기 권한"
                                    value={form.options.write_permission}
                                    onChange={(e) =>
                                        setOpt(
                                            "write_permission",
                                            e.target.value,
                                        )
                                    }
                                    options={permissions}
                                />
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 space-y-1 divide-y divide-slate-100">
                                <Toggle
                                    label="댓글 허용"
                                    desc="게시글에 댓글을 달 수 있습니다"
                                    checked={form.options.comment_enabled}
                                    onChange={() =>
                                        setOpt(
                                            "comment_enabled",
                                            !form.options.comment_enabled,
                                        )
                                    }
                                />
                                <div className="pt-2">
                                    <SelectField
                                        label="댓글 권한"
                                        value={form.options.comment_permission}
                                        onChange={(e) =>
                                            setOpt(
                                                "comment_permission",
                                                e.target.value,
                                            )
                                        }
                                        options={permissions}
                                    />
                                </div>
                                <Toggle
                                    label="익명 작성 허용"
                                    desc="비로그인 사용자도 게시글을 작성할 수 있습니다"
                                    checked={form.options.allow_anonymous}
                                    onChange={() =>
                                        setOpt(
                                            "allow_anonymous",
                                            !form.options.allow_anonymous,
                                        )
                                    }
                                />
                                <Toggle
                                    label="익명 노출"
                                    desc="작성자 이름을 익명으로 표시합니다"
                                    checked={form.options.show_anonymous}
                                    onChange={() =>
                                        setOpt(
                                            "show_anonymous",
                                            !form.options.show_anonymous,
                                        )
                                    }
                                />
                                <Toggle
                                    label="비밀댓글 허용"
                                    desc="작성자와 관리자만 볼 수 있는 비밀댓글을 허용합니다"
                                    checked={form.options.secret_comment}
                                    onChange={() =>
                                        setOpt(
                                            "secret_comment",
                                            !form.options.secret_comment,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Tab 2: 포인트 / 파일 ── */}
                    {tab === 2 && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-slate-200 p-4 space-y-3 divide-y divide-slate-100">
                                <Toggle
                                    label="포인트 지급"
                                    desc="게시글 작성 시 포인트를 지급합니다"
                                    checked={form.options.point_enabled}
                                    onChange={() =>
                                        setOpt(
                                            "point_enabled",
                                            !form.options.point_enabled,
                                        )
                                    }
                                />
                                {form.options.point_enabled && (
                                    <div className="pt-3 grid gap-4 md:grid-cols-2">
                                        <NumberField
                                            label="지급 포인트"
                                            value={form.options.point_amount}
                                            onChange={(e) =>
                                                setOpt(
                                                    "point_amount",
                                                    Number(e.target.value),
                                                )
                                            }
                                            min={0}
                                        />
                                        <SelectField
                                            label="지급 주기"
                                            value={form.options.point_cycle}
                                            onChange={(e) =>
                                                setOpt(
                                                    "point_cycle",
                                                    e.target.value,
                                                )
                                            }
                                            options={pointCycles}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 space-y-1 divide-y divide-slate-100">
                                <Toggle
                                    label="파일 업로드 허용"
                                    checked={form.options.file_upload}
                                    onChange={() =>
                                        setOpt(
                                            "file_upload",
                                            !form.options.file_upload,
                                        )
                                    }
                                />
                                {form.options.file_upload && (
                                    <div className="pt-3">
                                        <NumberField
                                            label="파일 크기 제한 (MB)"
                                            value={form.options.file_size_limit}
                                            onChange={(e) =>
                                                setOpt(
                                                    "file_size_limit",
                                                    Number(e.target.value),
                                                )
                                            }
                                            min={1}
                                            max={500}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Tab 3: 기타 ── */}
                    {tab === 3 && (
                        <div className="space-y-4">
                            <NumberField
                                label="페이지당 게시물 수"
                                value={form.options.posts_per_page}
                                onChange={(e) =>
                                    setOpt(
                                        "posts_per_page",
                                        Number(e.target.value),
                                    )
                                }
                                min={5}
                                max={100}
                            />
                            <NumberField
                                label="상단 고정 공지 수"
                                value={form.options.notice_count}
                                onChange={(e) =>
                                    setOpt(
                                        "notice_count",
                                        Number(e.target.value),
                                    )
                                }
                                min={0}
                                max={20}
                            />

                            <div className="rounded-xl border border-slate-200 p-4 space-y-1 divide-y divide-slate-100">
                                <Toggle
                                    label="좋아요 기능"
                                    checked={form.options.use_like}
                                    onChange={() =>
                                        setOpt(
                                            "use_like",
                                            !form.options.use_like,
                                        )
                                    }
                                />
                                <Toggle
                                    label="싫어요 기능"
                                    checked={form.options.use_dislike}
                                    onChange={() =>
                                        setOpt(
                                            "use_dislike",
                                            !form.options.use_dislike,
                                        )
                                    }
                                />
                                <Toggle
                                    label="썸네일 표시"
                                    desc="목록에서 첫 번째 이미지를 썸네일로 표시합니다"
                                    checked={form.options.thumbnail_enabled}
                                    onChange={() =>
                                        setOpt(
                                            "thumbnail_enabled",
                                            !form.options.thumbnail_enabled,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {/* 하단 버튼 */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                        >
                            저장
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
