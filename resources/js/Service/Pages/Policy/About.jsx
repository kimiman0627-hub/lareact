import { Head, Link } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
            <div className="text-2xl mb-2">{icon}</div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
        </div>
    );
}

function StatBox({ value, label }) {
    return (
        <div className="text-center">
            <p className="text-2xl font-black text-blue-600">{value.toLocaleString()}+</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
    );
}

export default function About({ stats = {}, seo = {} }) {
    return (
        <ServiceLayout sidebar={false}>
            <Head>
                <title>{seo.title ?? "서비스 소개 | KRLived"}</title>
                <meta name="description" content={seo.description ?? ""} />
                <link rel="canonical" href={seo.canonical ?? ""} />
            </Head>

            <div className="max-w-3xl mx-auto space-y-6">
                {/* 히어로 */}
                <div className="bg-linear-to-br from-blue-600 to-blue-800 rounded-xl px-8 py-12 text-center text-white shadow-md">
                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-2">Community Portal</p>
                    <h1 className="text-3xl font-black mb-3">
                        <span className="text-white">KR</span>
                        <span className="text-sky-300">LIVED</span>
                    </h1>
                    <p className="text-sm text-blue-100 leading-relaxed max-w-md mx-auto">
                        국내외 다양한 커뮤니티의 인기 게시글과 실시간 금융 정보를 한 곳에서 편리하게 확인할 수 있는
                        통합 커뮤니티 포털입니다.
                    </p>
                    {(stats.boards || stats.posts) && (
                        <div className="flex justify-center gap-10 mt-8 pt-6 border-t border-blue-500/40">
                            {stats.boards > 0 && <StatBox value={stats.boards} label="운영 게시판" />}
                            {stats.posts  > 0 && <StatBox value={stats.posts}  label="누적 게시글" />}
                        </div>
                    )}
                </div>

                {/* 서비스 특징 */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-8 py-7">
                    <h2 className="text-base font-bold text-slate-800 mb-5">서비스 특징</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FeatureCard
                            icon="📰"
                            title="인기 콘텐츠 큐레이션"
                            desc="유머, 연예, 스포츠, 게임, IT 등 다양한 주제의 커뮤니티 인기 게시글을 실시간으로 확인할 수 있습니다."
                        />
                        <FeatureCard
                            icon="📈"
                            title="실시간 금융 정보"
                            desc="코스닥·나스닥 주식 시세, 비트코인·이더리움 가상화폐, 달러·유로·엔화 환율, 금·은 시세를 실시간으로 제공합니다."
                        />
                        <FeatureCard
                            icon="💬"
                            title="커뮤니티 활동"
                            desc="회원 가입 후 게시글 작성, 댓글, 좋아요, 스크랩 등 다양한 커뮤니티 활동에 참여하실 수 있습니다."
                        />
                        <FeatureCard
                            icon="🔥"
                            title="인기글 랭킹"
                            desc="조회수, 댓글, 좋아요를 종합한 인기 점수 기반으로 최근 7일간 가장 많이 읽힌 게시글을 확인하세요."
                        />
                    </div>
                </div>

                {/* 이용 방법 */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-8 py-7">
                    <h2 className="text-base font-bold text-slate-800 mb-5">이용 방법</h2>
                    <ol className="space-y-4">
                        {[
                            { step: "01", title: "회원 가입", desc: "이메일과 닉네임으로 간단하게 가입할 수 있습니다. 별도의 인증 절차 없이 바로 이용 가능합니다." },
                            { step: "02", title: "게시글 탐색", desc: "상단 메뉴에서 관심 있는 게시판을 선택하거나, 메인 페이지의 인기글 섹션에서 화제의 게시글을 확인하세요." },
                            { step: "03", title: "커뮤니티 참여", desc: "마음에 드는 게시글에 댓글을 남기거나 좋아요를 누르고, 직접 게시글을 작성하며 커뮤니티에 참여하세요." },
                            { step: "04", title: "금융 정보 확인", desc: "우측 사이드바에서 실시간 주식·환율·가상화폐·금은 시세를 한눈에 확인할 수 있습니다." },
                        ].map(({ step, title, desc }) => (
                            <li key={step} className="flex gap-4">
                                <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                                    {step}
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* 문의 */}
                <div className="bg-slate-50 rounded-xl border border-gray-100 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-slate-800">궁금한 점이 있으신가요?</p>
                        <p className="text-xs text-slate-500 mt-0.5">운영팀이 빠르게 답변드립니다.</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <Link
                            href="/inquiry?type=SUPPORT"
                            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                        >
                            1:1 문의
                        </Link>
                        <Link
                            href="/inquiry?type=PARTNERSHIP"
                            className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition"
                        >
                            제휴 문의
                        </Link>
                    </div>
                </div>
            </div>
        </ServiceLayout>
    );
}
