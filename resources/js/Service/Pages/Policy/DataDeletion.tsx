import { Head } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import React from "react";

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
    return (
        <div className="mb-8">
            <h2 className="text-base font-bold text-slate-800 mb-3 pb-2 border-b border-gray-200">{title}</h2>
            <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
        </div>
    );
}

interface Props {
    officerEmail?: string;
    siteName?: string;
    appUrl?: string;
}

export default function DataDeletion({ officerEmail = "", siteName = "KRLived", appUrl = "" }: Props) {
    const updated = "2026년 6월 9일";
    const inquiryUrl = "/inquiry?type=SUPPORT";

    return (
        <ServiceLayout sidebar={false}>
            <Head>
                <title>사용자 데이터 삭제 안내 | {siteName}</title>
                <meta name="description" content={`${siteName} 사용자 데이터 삭제 요청 방법 안내`} />
            </Head>

            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 px-8 py-10">
                <h1 className="text-xl font-bold text-slate-900 mb-1">사용자 데이터 삭제 안내</h1>
                <p className="text-xs text-slate-400 mb-8">최종 업데이트: {updated}</p>

                <p className="text-sm text-slate-600 leading-relaxed mb-8">
                    {siteName}은 Meta(Threads, Instagram) 로그인 기능을 운영자 계정 연동 목적으로만 사용합니다.
                    본 페이지는 Meta 플랫폼 정책에 따라 사용자 데이터 삭제 요청 방법을 안내합니다.
                </p>

                <Section title="1. 수집하는 데이터">
                    <p>Meta(Threads) 연동 과정에서 다음 정보가 수집될 수 있습니다.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li>Threads 사용자 ID</li>
                        <li>Threads 액세스 토큰 (서버에 암호화 저장)</li>
                        <li>Threads 발행 이력 (게시물 ID, 발행 시각)</li>
                    </ul>
                    <p className="mt-2 text-xs text-slate-400">
                        * 해당 데이터는 운영자 계정의 콘텐츠 자동 발행 목적으로만 사용되며, 일반 사용자에게는 수집되지 않습니다.
                    </p>
                </Section>

                <Section title="2. 데이터 삭제 요청 방법">
                    <p className="font-medium text-slate-700">아래 방법 중 하나로 삭제를 요청하실 수 있습니다.</p>

                    <div className="mt-3 space-y-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-4">
                            <p className="font-semibold text-blue-800 mb-1">방법 1. Threads 앱에서 직접 연결 해제</p>
                            <ol className="list-decimal list-inside space-y-1 text-slate-600 ml-1">
                                <li>Threads 앱 → 프로필 → 설정</li>
                                <li>개인정보 보호 → 앱 및 웹사이트</li>
                                <li>{siteName} 앱 선택 → 액세스 제거</li>
                            </ol>
                            <p className="text-xs text-slate-500 mt-2">
                                연결 해제 시 저장된 액세스 토큰이 자동으로 삭제됩니다.
                            </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-4">
                            <p className="font-semibold text-slate-700 mb-1">방법 2. 직접 삭제 요청</p>
                            <p className="text-slate-600">
                                아래 채널로 삭제 요청을 보내주시면 <strong>7영업일 이내</strong>에 처리 후 결과를 알려드립니다.
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                                {officerEmail && (
                                    <li>
                                        이메일:{" "}
                                        <a href={`mailto:${officerEmail}`} className="text-blue-500 hover:underline">
                                            {officerEmail}
                                        </a>
                                    </li>
                                )}
                                <li>
                                    <a href={inquiryUrl} className="text-blue-500 hover:underline">
                                        1:1 문의하기
                                    </a>
                                    {" "}(제목에 "데이터 삭제 요청" 명시)
                                </li>
                            </ul>
                        </div>
                    </div>
                </Section>

                <Section title="3. 삭제 처리 범위">
                    <p>삭제 요청 접수 시 아래 데이터가 모두 삭제됩니다.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li>Threads 액세스 토큰</li>
                        <li>Threads 사용자 ID</li>
                        <li>Threads 발행 이력 로그</li>
                    </ul>
                    <p className="mt-2">
                        단, 관계 법령에 따라 일정 기간 보관이 필요한 데이터는 해당 기간 경과 후 삭제됩니다.
                    </p>
                </Section>

                <Section title="4. 문의처">
                    <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1">
                        <p><strong>서비스명:</strong> {siteName}</p>
                        {officerEmail && (
                            <p>
                                <strong>이메일:</strong>{" "}
                                <a href={`mailto:${officerEmail}`} className="text-blue-500 hover:underline">
                                    {officerEmail}
                                </a>
                            </p>
                        )}
                        <p>
                            <strong>문의:</strong>{" "}
                            <a href={inquiryUrl} className="text-blue-500 hover:underline">
                                1:1 문의하기
                            </a>
                        </p>
                    </div>
                </Section>

                <p className="text-xs text-slate-400 text-right mt-4 pt-4 border-t border-gray-100">
                    본 안내는 {updated}부터 적용됩니다.
                </p>
            </div>
        </ServiceLayout>
    );
}
