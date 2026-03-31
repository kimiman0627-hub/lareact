import React, { useState } from "react";
import { http } from "@/Utils/http";
import { ajax } from "@/Utils/network"; // http 객체는 실제로 사용하시는 것을 import 하세요
import { useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Admin/Layouts/AdminLayout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import Pagination from "@/Admin/Components/Common/Pagination"; // 페이지네이션 컴포넌트

export default function UserIndex({ users, total, params }) {
    const { auth } = usePage().props;

    // URL에서 받은 문자열을 Date 객체로 변환하여 초기값으로 설정합니다.
    const [startDate, setStartDate] = useState(
        params?.start_date ? new Date(params.start_date) : null,
    );
    const [endDate, setEndDate] = useState(
        params?.end_date ? new Date(params.end_date) : null,
    );

    // URL의 기존 검색 조건을 초기값으로 세팅
    const [searchForm, setSearchForm] = useState({
        id: params?.id || "",
        name: params?.name || "",
        email: params?.email || "",
    });

    const [loading, setLoading] = useState(false);
    // 모달 및 폼 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 등록, 수정폼
    const { data, setData, post, put, processing, reset } = useForm({
        id: null,
        name: "",
        email: "",
        password: "",
    });

    // 등록 버튼 클릭 (빈 폼으로 모달 열기)
    const openCreateModal = () => {
        reset(); // useForm 데이터 초기화
        setIsModalOpen(true);
    };

    // 수정 버튼 클릭 (데이터 채워서 모달 열기)
    const openEditModal = (user) => {
        setData({
            id: user.id,
            name: user.name,
            email: user.email,
            password: "", // 비밀번호는 보안상 비움
        });
        setIsModalOpen(true);
    };

    // 저장 실행 (등록/수정 공통)
    const saveUser = () => {
        const action = data.id ? put : post;
        const url = data.id ? `/admin/users/${data.id}` : "/admin/users";

        action(url, {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
                alert("성공적으로 저장되었습니다.");
                // 여기서 reload를 따로 안 해도 Inertia가 자동으로 props를 최신화합니다.
            },
            // 에러 시 자동으로 useForm의 errors 객체에 담깁니다.
        });
    };

    const deleteUser = (id) => {
        http.delete(`/admin/users/${id}`, {
            confirmMsg: "정말 삭제하시겠습니까?",
            onSuccess: () => {
                alert("성공적으로 삭제되었습니다.");
                // 삭제 후에도 Inertia가 자동으로 props를 최신화합니다.
            },
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const searchData = {
            ...searchForm,
            start_date: startDate ? format(startDate, "yyyy-MM-dd") : "",
            end_date: endDate ? format(endDate, "yyyy-MM-dd") : "",
        };
        http.get("/admin/users", searchData, {
            preserveState: true,
            replace: true,
        });
    };

    // 초기화 버튼 클릭
    const resetSearch = () => {
        setSearchForm({ id: "", name: "", email: "" });
        setStartDate(null);
        setEndDate(null);
        http.get("/admin/users");
    };

    return (
        <AdminLayout user={auth?.user}>
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        회원 관리
                    </h1>

                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                        신규 회원 등록
                    </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                    <form
                        onSubmit={handleSearch}
                        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4"
                    >
                        {/* ID 검색 */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                ID
                            </label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.id}
                                onChange={(e) =>
                                    setSearchForm({
                                        ...searchForm,
                                        id: e.target.value,
                                    })
                                }
                                placeholder="ID 숫자"
                            />
                        </div>
                        {/* 이름 검색 */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                이름
                            </label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.name}
                                onChange={(e) =>
                                    setSearchForm({
                                        ...searchForm,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="이름 포함"
                            />
                        </div>
                        {/* 이메일 검색 */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                이메일
                            </label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchForm.email}
                                onChange={(e) =>
                                    setSearchForm({
                                        ...searchForm,
                                        email: e.target.value,
                                    })
                                }
                                placeholder="이메일 주소"
                            />
                        </div>
                        {/* 가입일 검색 (기간) */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                가입일
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        selectsStart
                                        startDate={startDate}
                                        endDate={endDate}
                                        locale={ko}
                                        dateFormat="yyyy-MM-dd"
                                        placeholderText="시작일"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <span className="text-gray-400">~</span>
                                <div className="relative">
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        selectsEnd
                                        startDate={startDate}
                                        endDate={endDate}
                                        minDate={startDate} // 시작일 이전은 선택 못하게 막음
                                        locale={ko}
                                        dateFormat="yyyy-MM-dd"
                                        placeholderText="종료일"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* 버튼들 */}
                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-bold hover:bg-blue-700 transition"
                            >
                                검색
                            </button>
                            <button
                                type="button"
                                onClick={resetSearch}
                                className="flex-1 bg-white border border-gray-300 text-gray-600 rounded-lg py-2 text-sm font-bold hover:bg-gray-50 transition"
                            >
                                초기화
                            </button>
                        </div>
                    </form>
                </div>

                {/* 테이블 리스트 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                    ID
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                    이름
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                                    이메일
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">
                                    관리
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.data.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-gray-50 transition"
                                >
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {user.id}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {user.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right space-x-3">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-8">
                        <Pagination links={users.links} />
                    </div>
                </div>

                {/* --- 등록/수정 모달창 --- */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {data.id
                                        ? "회원 정보 수정"
                                        : "신규 회원 등록"}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        ></path>
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        이름
                                    </label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        이메일
                                    </label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        비밀번호
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        placeholder={
                                            data.id
                                                ? "변경시에만 입력"
                                                : "비밀번호 입력"
                                        }
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 flex gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white transition"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={saveUser}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-300"
                                >
                                    {loading ? "처리중..." : "저장하기"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
