import { usePage } from "@inertiajs/react";
import ServiceLayout from "@/Service/Layouts/ServiceLayout";
import BoardSection from "@/Service/Components/Board/BoardSection";
import BannerSlot from "@/Service/Components/Banner/BannerSlot";

export default function MainIndex({ boards = [] }) {
    const { props } = usePage(); // 전체 props를 가져옵니다.

    return (
        <ServiceLayout theme="light">
            <div className="space-y-4">
                {boards.map((board, i) => (
                    <div key={board.board_id}>
                        <BoardSection board={board} colorIndex={i} />
                        {/* i가 0이면 categoryBanners1, i가 1이면 categoryBanners2 호출 */}
                        {i < boards.length - 1 && (
                            <BannerSlot
                                banners={props[`categoryBanners${i + 1}`]}
                                position="MAIN_BOARD_CATEGORY"
                            />
                        )}
                    </div>
                ))}
            </div>
        </ServiceLayout>
    );
}
