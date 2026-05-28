import { useEffect } from "react";
import { ajax } from "@/Utils/network";
import BannerRenderer from "./BannerRenderer";

function recordImpression(bannerId) {
    // sendBeacon 우선, 미지원 시 axios fallback
    const url = `/banner/${bannerId}/impression`;
    if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
    } else {
        ajax.post(url).catch(() => {});
    }
}

/**
 * 위치(position)에 따라 배너 목록을 적절한 레이아웃으로 렌더링
 *
 * SIDE               — 세로 스택 (사이드바 전용)
 * MAIN_BOARD_CATEGORY — 2개 나란히 flex-wrap (콘텐츠 영역 전용)
 * 그 외               — 세로 스택 (기본)
 */
export default function BannerSlot({ banners = [], position = "" }) {
    const safeBanners = Array.isArray(banners)
        ? banners
        : banners
          ? [banners]
          : [];

    // 노출 기록: 배너가 렌더링될 때 한 번씩 기록
    useEffect(() => {
        safeBanners.forEach((banner) => recordImpression(banner.banner_id));
    }, [safeBanners.map((b) => b.banner_id).join(",")]);

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
