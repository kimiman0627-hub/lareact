import React, { useState } from "react";
import { http } from "@/Utils/http";
import { Link } from "@inertiajs/react";
import ServiceLayout from "../../Layouts/ServiceLayout";

export default function Login() {
    const [values, setValues] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        http.post("/login", values, {
            onError: (err) => setErrors(err as Record<string, string>),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <ServiceLayout>
            <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded-lg border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">로그인</h2>
                <form onSubmit={submit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">이메일</label>
                        <input type="email" value={values.email}
                            onChange={(e) => setValues({ ...values, email: e.target.value })}
                            className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                        <input type="password" value={values.password}
                            onChange={(e) => setValues({ ...values, password: e.target.value })}
                            className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <button disabled={processing}
                        className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition">
                        {processing ? "로그인 중..." : "로그인"}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <Link href="/register" className="text-sm text-blue-600 hover:underline">회원가입</Link>
                </div>
            </div>
        </ServiceLayout>
    );
}
