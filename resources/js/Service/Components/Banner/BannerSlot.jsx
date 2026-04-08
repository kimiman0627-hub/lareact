import BannerRenderer from "./BannerRenderer";

/**
 * 위치(position)에 따라 배너 목록을 적절한 레이아웃으로 렌더링
 *
 * SIDE               — 세로 스택 (사이드바 전용)
 * MAIN_BOARD_CATEGORY — 2개 나란히 flex-wrap (콘텐츠 영역 전용)
 * 그 외               — 세로 스택 (기본)
 */
export default function BannerSlot({ banners = [], position = "" }) {
    // 1. 데이터를 배열로 통일 (단일 객체면 [ ]로 감싸고, 없으면 빈 배열)
    const safeBanners = Array.isArray(banners)
        ? banners
        : banners
          ? [banners]
          : [];

    // 2. 비어있으면 렌더링 안 함
    if (safeBanners.length === 0) return null;

    if (position === "MAIN_BOARD_CATEGORY") {
        return (
            <div className="flex flex-wrap gap-3 my-6">
                {safeBanners.map((banner) => (
                    <div
                        key={banner.banner_id}
                        className="flex-1 overflow-hidden rounded border border-gray-200"
                        style={{ minWidth: "45%" }}
                    >
                        <BannerRenderer banner={banner} />
                    </div>
                ))}
            </div>
        );
    }

    // SIDE 및 기본: 세로 스택
    return (
        <div className="space-y-4">
            {safeBanners.map((banner) => (
                <div
                    key={banner.banner_id}
                    className="w-full overflow-hidden rounded border border-gray-200"
                >
                    <BannerRenderer banner={banner} />
                </div>
            ))}
        </div>
    );
}
