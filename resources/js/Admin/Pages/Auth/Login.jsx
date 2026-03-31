import React, { useState } from "react";
import { http } from "@/Utils/http";

export default function Login() {
    const [values, setValues] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false); // 로딩 상태 직접 관리

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true); // 로딩 시작

        http.post("/admin/login", values, {
            onError: (err) => setErrors(err),
            onFinish: () => setProcessing(false), // 성공/실패 상관없이 로딩 종료
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="max-w-md w-full p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
                <h2 className="text-3xl font-bold text-yellow-500 mb-8 text-center uppercase tracking-widest">
                    Admin Login
                </h2>
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={values.email}
                            onChange={(e) =>
                                setValues({ ...values, email: e.target.value })
                            }
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                        {errors.email && (
                            <p className="text-red-400 text-xs mt-1">
                                {errors.email}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={values.password}
                            onChange={(e) =>
                                setValues({
                                    ...values,
                                    password: e.target.value,
                                })
                            }
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                    <button
                        disabled={processing}
                        className="w-full py-3 bg-yellow-600 text-white rounded font-bold hover:bg-yellow-500 transition shadow-lg shadow-yellow-900/20"
                    >
                        {processing ? "Authenticating..." : "ENTER SYSTEM"}
                    </button>
                </form>
            </div>
        </div>
    );
}
