import { Link, usePage } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import BoardCard from "@/Service/Components/Board/BoardCard";
import BannerSlot from "@/Service/Components/Banner/BannerSlot";

// xl 기준 3열 그리드 → 3개마다 배너 1행 삽입
const ROW_SIZE = 3;

export default function Index({ boards = [] }) {
    const { auth, categoryBanners1 = [] } = usePage().props;

    // boards를 ROW_SIZE개씩 묶음
    const rows = [];
    for (let i = 0; i < boards.length; i += ROW_SIZE) {
        rows.push(boards.slice(i, i + ROW_SIZE));
    }

    return (
        <ServiceLayout theme="dark">
            {/* 인트로 배너 */}
            <div className="bg-[#0d1b2a] rounded px-5 py-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-base font-bold text-white leading-snug">
                        커뮤니티에 오신 것을 환영합니다
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        다양한 주제의 게시판에서 자유롭게 소통하세요.
                    </p>
                </div>
                {!auth?.user && (
                    <div className="flex gap-2 shrink-0">
                        <Link
                            href="/login"
                            className="text-sm px-4 py-2 rounded border border-white/20 text-white hover:bg-white/10 transition"
                        >
                            로그인
                        </Link>
                        <Link
                            href="/register"
                            className="text-sm px-4 py-2 rounded bg-sky-500 hover:bg-sky-400 text-white font-semibold transition"
                        >
                            회원가입
                        </Link>
                    </div>
                )}
            </div>

            {/* 게시판 카드 그리드 */}
            {boards.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm bg-white rounded border border-gray-200">
                    등록된 게시판이 없습니다.
                </div>
            ) : (
                rows.map((row, ri) => (
                    <div key={ri}>
                        {/* 첫 행 이후 배너 삽입 */}
                        {ri > 0 && (
                            <BannerSlot
                                banners={categoryBanners1}
                                position="MAIN_BOARD_CATEGORY"
                            />
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                            {row.map((board) => (
                                <BoardCard key={board.board_id} board={board} />
                            ))}
                        </div>
                    </div>
                ))
            )}
        </ServiceLayout>
    );
}
