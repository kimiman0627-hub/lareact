import { Head } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";

function Section({ title, children }) {
    return (
        <div className="mb-8">
            <h2 className="text-base font-bold text-slate-800 mb-3 pb-2 border-b border-gray-200">{title}</h2>
            <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
        </div>
    );
}

export default function Privacy() {
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
                    KRLived(이하 "서비스")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 및 관련 법령을
                    준수합니다. 본 방침을 통해 수집하는 개인정보의 항목, 이용 목적, 보유 기간 등을 안내드립니다.
                </p>

                <Section title="1. 수집하는 개인정보 항목">
                    <p><strong>회원가입 시 필수 항목</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>이메일 주소</li>
                        <li>닉네임(이름)</li>
                        <li>비밀번호 (암호화 저장)</li>
                    </ul>
                    <p className="mt-2"><strong>서비스 이용 과정에서 자동 수집되는 항목</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>접속 IP 주소</li>
                        <li>쿠키, 서비스 이용 기록</li>
                        <li>최근 로그인 일시</li>
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
                    <p className="mt-2 text-slate-500 text-xs">※ 전자상거래법에 따른 계약 또는 청약 철회 기록: 5년 / 소비자 불만·분쟁처리 기록: 3년</p>
                </Section>

                <Section title="4. 개인정보의 제3자 제공">
                    <p>서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li>이용자가 사전에 동의한 경우</li>
                        <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                    </ul>
                </Section>

                <Section title="5. 개인정보의 파기 절차 및 방법">
                    <p>이용자의 개인정보는 목적이 달성된 후 다음과 같은 방법으로 파기됩니다.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li><strong>전자적 파일:</strong> 복구 불가능한 방법으로 영구 삭제</li>
                        <li><strong>종이 문서:</strong> 분쇄 또는 소각 처리</li>
                    </ul>
                </Section>

                <Section title="6. 이용자의 권리와 행사 방법">
                    <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li>개인정보 열람 요청</li>
                        <li>개인정보 정정·삭제 요청</li>
                        <li>개인정보 처리 정지 요청</li>
                        <li>회원 탈퇴(개인정보 삭제)</li>
                    </ul>
                    <p className="mt-2">위 권리 행사는 1:1 문의 또는 아래 개인정보보호책임자에게 이메일로 요청하실 수 있습니다.</p>
                </Section>

                <Section title="7. 쿠키(Cookie)의 사용">
                    <p>
                        서비스는 로그인 세션 유지 등을 위해 쿠키를 사용합니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부 서비스 이용이 제한될 수 있습니다.
                    </p>
                </Section>

                <Section title="8. 개인정보 보호책임자">
                    <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1">
                        <p><strong>책임자:</strong> KRLived 운영팀</p>
                        <p><strong>이메일:</strong> kimiman0627@gmail.com</p>
                        <p><strong>문의:</strong> <a href="/inquiry?type=SUPPORT" className="text-blue-500 hover:underline">1:1 문의하기</a></p>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                        개인정보 침해에 관한 신고·상담은 한국인터넷진흥원(KISA) 개인정보침해신고센터(privacy.kisa.or.kr / 국번없이 118)에 문의하실 수 있습니다.
                    </p>
                </Section>

                <p className="text-xs text-slate-400 text-right mt-4 pt-4 border-t border-gray-100">
                    본 방침은 {updated}부터 시행됩니다.
                </p>
            </div>
        </ServiceLayout>
    );
}
