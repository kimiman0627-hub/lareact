import React from "react";
import { useForm } from "@inertiajs/react";

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post("/admin/login");
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
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
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
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
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
