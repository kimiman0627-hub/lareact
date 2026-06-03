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

interface PrivacyProps {
    officerName?: string;
    officerEmail?: string;
}

export default function Privacy({ officerName = "KRLived 운영팀", officerEmail = "" }: PrivacyProps) {
    const updated = "2026년 4월 27일";

    return (
        <ServiceLayout sidebar={false}>
            <Head>
                <title>개인정보처리방침 | KRLived</title>
                <meta name="description" content="KRLived 개인정보처리방침" />
            </Head>

            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 px-8 py-10">
                <h1 className="text-xl font-bold text-slate-900 mb-1">개인정보처리방침</h1>
                <p className="text-xs text-slate-400 mb-8">시행일: {updated}</p>
                <p className="text-sm text-slate-600 leading-relaxed mb-8">
                    KRLived(이하 "서비스")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관련 법령을 준수합니다.
                </p>

                <Section title="1. 수집하는 개인정보 항목">
                    <p><strong>회원가입 시 필수 항목</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>이메일 주소</li><li>닉네임(이름)</li><li>비밀번호 (암호화 저장)</li>
                    </ul>
                    <p className="mt-2"><strong>서비스 이용 과정에서 자동 수집되는 항목</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>접속 IP 주소</li><li>쿠키, 서비스 이용 기록</li><li>최근 로그인 일시</li>
                    </ul>
                </Section>

                <Section title="2. 개인정보의 수집 및 이용 목적">
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>회원 가입 및 관리, 본인 확인</li>
                        <li>게시글 작성·댓글·좋아요 등 서비스 기능 제공</li>
                        <li>고객 문의 응답 및 민원 처리</li>
                        <li>불법·부정 이용 방지 및 서비스 보안 유지</li>
                    </ul>
                </Section>

                <Section title="3. 개인정보의 보유 및 이용 기간">
                    <p>원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li>회원 정보: 회원 탈퇴 시까지</li>
                        <li>단, 관계 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관</li>
                    </ul>
                </Section>

                <Section title="4. 개인정보의 제3자 제공">
                    <p>서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.</p>
                </Section>

                <Section title="5. 개인정보의 파기 절차 및 방법">
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>전자적 파일:</strong> 복구 불가능한 방법으로 영구 삭제</li>
                        <li><strong>종이 문서:</strong> 분쇄 또는 소각 처리</li>
                    </ul>
                </Section>

                <Section title="6. 이용자의 권리와 행사 방법">
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>개인정보 열람 요청</li><li>개인정보 정정·삭제 요청</li>
                        <li>개인정보 처리 정지 요청</li><li>회원 탈퇴(개인정보 삭제)</li>
                    </ul>
                </Section>

                <Section title="7. 쿠키(Cookie)의 사용">
                    <p>서비스는 로그인 세션 유지 등을 위해 쿠키를 사용합니다.</p>
                </Section>

                <Section title="8. 개인정보 보호책임자">
                    <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1">
                        <p><strong>책임자:</strong> {officerName}</p>
                        {officerEmail && <p><strong>이메일:</strong> <a href={`mailto:${officerEmail}`} className="text-blue-500 hover:underline">{officerEmail}</a></p>}
                        <p><strong>문의:</strong> <a href="/inquiry?type=SUPPORT" className="text-blue-500 hover:underline">1:1 문의하기</a></p>
                    </div>
                </Section>

                <p className="text-xs text-slate-400 text-right mt-4 pt-4 border-t border-gray-100">본 방침은 {updated}부터 시행됩니다.</p>
            </div>
        </ServiceLayout>
    );
}
