import React, { useState } from "react";
import { http } from "@/Utils/http";
import ServiceLayout from "../../Layouts/ServiceLayout";

export default function Register() {
    // 1. useState로 데이터와 로딩 상태 관리
    const [values, setValues] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // 2. 입력값 변경 통합 핸들러 (input에 name 속성 추가 필요)
    const handleChange = (e) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);

        http.post("/register", values, {
            onError: (err) => setErrors(err),
            onFinish: () => setProcessing(false),
            onSuccess: () => console.log("가입 성공!"),
        });
    };

    return (
        <ServiceLayout>
            <form
                onSubmit={submit}
                className="max-w-md mx-auto p-6 bg-white shadow rounded-lg"
            >
                <h2 className="text-2xl font-bold mb-6">회원가입</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium">이름</label>
                    <input
                        name="name" // name 추가
                        type="text"
                        value={values.name} // data.name -> values.name
                        onChange={handleChange} // handleChange 사용
                        className="w-full p-2 border rounded"
                    />
                    {errors.name && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">이메일</label>
                    <input
                        name="email" // name 추가
                        type="email"
                        value={values.email} // data.email -> values.email
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">
                        비밀번호
                    </label>
                    <input
                        name="password" // name 추가
                        type="password"
                        value={values.password} // data.password -> values.password
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                    {errors.password && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.password}
                        </p>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium">
                        비밀번호 확인
                    </label>
                    <input
                        name="password_confirmation" // name 추가
                        type="password"
                        value={values.password_confirmation} // data... -> values...
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <button
                    disabled={processing}
                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {processing ? "처리 중..." : "가입하기"}
                </button>
            </form>
        </ServiceLayout>
    );
}
