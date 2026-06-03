import React, { useState } from "react";
import { http } from "@/Utils/http";
import ServiceLayout from "../../Layouts/ServiceLayout";

export default function Register() {
    const [values, setValues] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValues({ ...values, [e.target.name]: e.target.value });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        http.post("/register", values, {
            onError: (err) => setErrors(err as Record<string, string>),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <ServiceLayout>
            <form onSubmit={submit} className="max-w-md mx-auto p-6 bg-white shadow rounded-lg">
                <h2 className="text-2xl font-bold mb-6">회원가입</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium">이름</label>
                    <input name="name" type="text" value={values.name} onChange={handleChange}
                        className="w-full p-2 border rounded" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">이메일</label>
                    <input name="email" type="email" value={values.email} onChange={handleChange}
                        className="w-full p-2 border rounded" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium">비밀번호</label>
                    <input name="password" type="password" value={values.password} onChange={handleChange}
                        className="w-full p-2 border rounded" />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium">비밀번호 확인</label>
                    <input name="password_confirmation" type="password" value={values.password_confirmation} onChange={handleChange}
                        className="w-full p-2 border rounded" />
                </div>

                <button disabled={processing}
                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                    {processing ? "처리 중..." : "가입하기"}
                </button>
            </form>
        </ServiceLayout>
    );
}
