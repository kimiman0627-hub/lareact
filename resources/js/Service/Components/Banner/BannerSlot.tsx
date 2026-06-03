import { useEffect } from "react";
import { ajax } from "@/Utils/network";
import BannerRenderer from "./BannerRenderer";
import type { Banner } from "@/types";

function recordImpression(bannerId: number) {
    const url = `/banner/${bannerId}/impression`;
    if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
    } else {
        ajax.post(url).catch(() => {});
    }
}

interface BannerSlotProps {
    banners?: Banner | Banner[];
    position?: string;
}

export default function BannerSlot({ banners = [], position = "" }: BannerSlotProps) {
    const safeBanners: Banner[] = Array.isArray(banners)
        ? banners
        : banners
          ? [banners]
          : [];

    useEffect(() => {
        safeBanners.forEach((banner) => recordImpression(banner.banner_id));
    }, [safeBanners.map((b) => b.banner_id).join(",")]);

    if (safeBanners.length === 0) return null;

    if (position === "MAIN_BOARD_CATEGORY") {
        return (
            <div className="flex flex-wrap gap-3 my-6">
                {safeBanners.map((banner) => (
                    <div key={banner.banner_id} className="flex-1 overflow-hidden rounded border border-gray-200" style={{ minWidth: "45%" }}>
                        <BannerRenderer banner={banner} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {safeBanners.map((banner) => (
                <div key={banner.banner_id} className="w-full overflow-hidden rounded border border-gray-200">
                    <BannerRenderer banner={banner} />
                </div>
            ))}
        </div>
    );
}
