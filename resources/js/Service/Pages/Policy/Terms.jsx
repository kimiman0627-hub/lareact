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

export default function Terms() {
    const updated = "2026년 4월 27일";

    return (
        <ServiceLayout sidebar={false}>
            <Head>
                <title>이용약관 | KRLived</title>
                <meta name="description" content="KRLived 서비스 이용약관" />
            </Head>

            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 px-8 py-10">
                <h1 className="text-xl font-bold text-slate-900 mb-1">이용약관</h1>
                <p className="text-xs text-slate-400 mb-8">시행일: {updated}</p>

                <Section title="제1조 (목적)">
                    <p>
                        본 약관은 KRLived(이하 "서비스")가 제공하는 커뮤니티 서비스의 이용에 관한 조건 및 절차,
                        이용자와 서비스 운영자의 권리·의무·책임 사항을 규정함을 목적으로 합니다.
                    </p>
                </Section>

                <Section title="제2조 (정의)">
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>이용자:</strong> 서비스에 접속하여 본 약관에 따라 서비스를 이용하는 회원 및 비회원</li>
                        <li><strong>회원:</strong> 서비스에 회원가입하여 아이디를 발급받은 자</li>
                        <li><strong>게시물:</strong> 회원이 서비스에 게재한 글, 사진, 댓글 등 일체의 정보</li>
                    </ul>
                </Section>

                <Section title="제3조 (약관의 효력 및 변경)">
                    <p>
                        본 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
                        운영자는 필요 시 약관을 변경할 수 있으며, 변경된 약관은 공지 후 7일 이후부터 효력이 발생합니다.
                    </p>
                </Section>

                <Section title="제4조 (회원 가입)">
                    <p>이용자는 서비스가 정한 양식에 따라 정보를 기입하고 약관에 동의함으로써 회원가입을 신청합니다.</p>
                    <p className="mt-2">다음에 해당하는 경우 회원가입이 제한될 수 있습니다.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                        <li>타인의 명의를 도용하거나 허위 정보를 기재한 경우</li>
                        <li>만 14세 미만인 경우</li>
                        <li>이전에 서비스 이용 제한을 받은 이력이 있는 경우</li>
                    </ul>
                </Section>

                <Section title="제5조 (이용자의 의무)">
                    <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                        <li>타인의 개인정보를 도용하거나 허위 사실을 유포하는 행위</li>
                        <li>욕설, 혐오 표현, 음란물 등 다른 이용자에게 불쾌감을 주는 콘텐츠 게시</li>
                        <li>저작권 등 타인의 지식재산권을 침해하는 행위</li>
                        <li>서비스 운영을 방해하거나 서버에 과부하를 유발하는 행위</li>
                        <li>영리를 목적으로 한 무단 광고 게시</li>
                        <li>관련 법령에 위반되는 행위</li>
                    </ul>
                </Section>

                <Section title="제6조 (게시물 관리)">
                    <p>
                        이용자가 게시한 게시물의 저작권은 해당 이용자에게 있습니다. 단, 운영자는 서비스 운영 및 홍보를 위해
                        게시물을 별도 보상 없이 게재·수정·복제·배포할 수 있으며, 이용자는 이에 동의합니다.
                    </p>
                    <p className="mt-2">
                        다음에 해당하는 게시물은 사전 통보 없이 삭제될 수 있습니다.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                        <li>타인의 명예를 훼손하거나 권리를 침해하는 내용</li>
                        <li>음란·폭력·혐오 등 공서양속에 반하는 내용</li>
                        <li>관계 법령에 위반되는 내용</li>
                        <li>도배, 스팸 등 서비스 품질을 저하시키는 내용</li>
                    </ul>
                </Section>

                <Section title="제7조 (서비스 이용 제한)">
                    <p>
                        운영자는 이용자가 본 약관을 위반한 경우 사전 통보 없이 서비스 이용을 제한하거나 계정을 정지·삭제할 수 있습니다.
                        이에 대해 이용자는 1:1 문의를 통해 이의를 제기할 수 있습니다.
                    </p>
                </Section>

                <Section title="제8조 (서비스 제공 및 변경)">
                    <p>
                        운영자는 서비스의 내용, 기능, 운영 시간 등을 변경하거나 중단할 수 있습니다.
                        서비스 중단 시에는 사전 공지를 원칙으로 하되, 긴급한 경우 사후 공지할 수 있습니다.
                    </p>
                </Section>

                <Section title="제9조 (면책 조항)">
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>운영자는 천재지변, 전쟁, 기간통신사업자의 서비스 중단 등 불가항력적 사유로 인한 서비스 장애에 대해 책임지지 않습니다.</li>
                        <li>이용자 간 또는 이용자와 제3자 간에 발생한 분쟁에 대해 운영자는 관여하지 않으며 책임지지 않습니다.</li>
                        <li>이용자가 게시한 정보의 정확성 및 신뢰성에 대해 운영자는 보증하지 않습니다.</li>
                        <li>서비스 내 링크된 외부 사이트의 내용에 대해 운영자는 책임지지 않습니다.</li>
                    </ul>
                </Section>

                <Section title="제10조 (분쟁 해결 및 준거법)">
                    <p>
                        본 약관과 관련된 분쟁은 대한민국 법령을 준거법으로 하며, 관할 법원은 운영자 소재지 관할 법원으로 합니다.
                    </p>
                </Section>

                <div className="bg-gray-50 rounded-lg px-4 py-3 mt-6">
                    <p className="text-sm font-semibold text-slate-700 mb-1">문의처</p>
                    <p className="text-sm text-slate-600">이메일: kimiman0627@gmail.com</p>
                    <p className="text-sm text-slate-600">
                        문의: <a href="/inquiry?type=SUPPORT" className="text-blue-500 hover:underline">1:1 문의하기</a>
                    </p>
                </div>

                <p className="text-xs text-slate-400 text-right mt-6 pt-4 border-t border-gray-100">
                    본 약관은 {updated}부터 시행됩니다.
                </p>
            </div>
        </ServiceLayout>
    );
}
