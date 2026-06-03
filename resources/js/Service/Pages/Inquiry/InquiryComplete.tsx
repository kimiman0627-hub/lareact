import React from "react";
import { Link } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";

export default function InquiryComplete() {
    return (
        <ServiceLayout>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">문의가 접수되었습니다</h2>
                <p className="text-sm text-slate-500 mb-6">입력하신 이메일로 빠른 시일 내에 답변 드리겠습니다.</p>
                <Link href="/" className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition">
                    홈으로 돌아가기
                </Link>
            </div>
        </ServiceLayout>
    );
}
