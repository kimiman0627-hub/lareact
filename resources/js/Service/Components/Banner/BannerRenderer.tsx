import { useRef, useEffect, useState } from "react";
import type { Banner } from "@/types";

interface ScriptBannerProps {
    banner: Banner;
    className?: string;
}

function ScriptBanner({ banner, className }: ScriptBannerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState(250);

    const srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; overflow: hidden; }
ins.adsbygoogle { display: block !important; }
</style>
</head>
<body>
${banner.content ?? ""}
<script>
(function() {
  function report() {
    var h = Math.max(document.body.scrollHeight, document.body.offsetHeight,
                     document.documentElement.scrollHeight);
    if (h > 0) parent.postMessage({ type: 'bannerResize', id: ${banner.banner_id}, height: h }, '*');
  }
  window.addEventListener('load', report);
  setTimeout(report, 500);
  setTimeout(report, 1500);
  setTimeout(report, 3000);
})();
<\/script>
</body>
</html>`;

    useEffect(() => {
        function onMessage(e: MessageEvent) {
            if (e.data?.type === "bannerResize" && e.data.id === banner.banner_id) {
                setHeight(e.data.height);
            }
        }
        window.addEventListener("message", onMessage);
        return () => window.removeEventListener("message", onMessage);
    }, [banner.banner_id]);

    return (
        <iframe
            ref={iframeRef}
            srcDoc={srcdoc}
            className={`w-full block ${className ?? ""}`}
            style={{ height: `${height}px`, border: "none" }}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            title={banner.title || "advertisement"}
        />
    );
}

function recordClick(bannerId: number) {
    const url = `/banner/${bannerId}/click`;
    if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
    } else {
        fetch(url, { method: "POST", keepalive: true }).catch(() => {});
    }
}

interface BannerRendererProps {
    banner: Banner & { is_new_tab?: boolean };
    className?: string;
}

export default function BannerRenderer({ banner, className = "" }: BannerRendererProps) {
    if (banner.banner_type === "IMAGE") {
        const img = (
            <img src={banner.image_url} alt={banner.title}
                className={`w-full h-auto block ${className}`} />
        );
        return banner.link_url ? (
            <a href={banner.link_url}
                target={banner.is_new_tab ? "_blank" : "_self"}
                rel="noopener noreferrer"
                onClick={() => recordClick(banner.banner_id)}>
                {img}
            </a>
        ) : img;
    }

    if (banner.banner_type === "SCRIPT") {
        return <ScriptBanner banner={banner} className={className} />;
    }

    return (
        <div className={className} dangerouslySetInnerHTML={{ __html: banner.content ?? "" }} />
    );
}
