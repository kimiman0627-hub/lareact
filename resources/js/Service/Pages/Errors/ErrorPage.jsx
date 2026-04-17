import React from "react";
import { Head, Link } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";

const ERROR_INFO = {
    404: {
        title: "페이지를 찾을 수 없습니다",
        description: "요청하신 페이지가 삭제되었거나 주소가 변경되었습니다.",
        icon: (
            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    403: {
        title: "접근 권한이 없습니다",
        description: "이 페이지를 볼 수 있는 권한이 없습니다.",
        icon: (
            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
    },
    500: {
        title: "서버 오류가 발생했습니다",
        description: "일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요.",
        icon: (
            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
    },
    503: {
        title: "서비스 점검 중입니다",
        description: "더 나은 서비스를 위해 점검 중입니다. 잠시 후 다시 방문해주세요.",
        icon: (
            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
};

export default function ErrorPage({ status = 404 }) {
    const info = ERROR_INFO[status] ?? ERROR_INFO[404];

    return (
        <ServiceLayout sidebar={false}>
            <Head title={`${status} - ${info.title}`} />

            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                {/* 아이콘 */}
                <div className="mb-4">{info.icon}</div>

                {/* 상태 코드 */}
                <p className="text-7xl font-black text-slate-200 leading-none mb-4 select-none">
                    {status}
                </p>

                {/* 제목 */}
                <h1 className="text-xl font-bold text-slate-700 mb-2">
                    {info.title}
                </h1>

                {/* 설명 */}
                <p className="text-sm text-slate-400 mb-8 max-w-sm leading-relaxed">
                    {info.description}
                </p>

                {/* 버튼 */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="px-5 py-2.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        홈으로
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 transition"
                    >
                        이전 페이지
                    </button>
                </div>
            </div>
        </ServiceLayout>
    );
}
