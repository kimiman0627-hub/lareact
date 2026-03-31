import React, { useState } from "react";
import { http } from "@/Utils/http";
import { Link } from "@inertiajs/react"; // useForm은 이제 안 쓰므로 제거해도 됩니다.
import ServiceLayout from "../../Layouts/ServiceLayout";

export default function Login() {
    // 1. 데이터 관리를 위한 useState
    const [values, setValues] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false); // 로딩 상태 직접 관리

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true); // 로딩 시작

        http.post("/login", values, {
            onError: (err) => setErrors(err),
            onFinish: () => setProcessing(false), // 성공/실패 상관없이 로딩 종료
        });
    };

    return (
        <ServiceLayout>
            <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded-lg border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">
                    로그인
                </h2>
                <form onSubmit={submit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            이메일
                        </label>
                        <input
                            type="email"
                            // 2. data.email 대신 values.email 사용
                            value={values.email}
                            onChange={(e) =>
                                setValues({ ...values, email: e.target.value })
                            }
                            className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            // 3. data.password 대신 values.password 사용
                            value={values.password}
                            onChange={(e) =>
                                setValues({
                                    ...values,
                                    password: e.target.value,
                                })
                            }
                            className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button
                        disabled={processing}
                        className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition"
                    >
                        {processing ? "로그인 중..." : "로그인"}
                    </button>
                </form>
                {/* ... 하단 회원가입 링크 생략 ... */}
            </div>
        </ServiceLayout>
    );
}
