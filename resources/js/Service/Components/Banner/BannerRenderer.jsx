import { useRef, useEffect, useState } from "react";

/**
 * SCRIPT 타입 배너 — 격리된 srcdoc iframe에서 실행
 *
 * 외부 위젯 스크립트(쿠팡파트너스 G 등)는 document.body에 직접 요소를 삽입하는 경우가 있어
 * iframe 내부에서 실행하여 메인 페이지 DOM에 영향을 주지 않도록 격리한다.
 * postMessage로 콘텐츠 높이를 전달받아 iframe을 자동 리사이즈한다.
 */
function ScriptBanner({ banner, className }) {
    const iframeRef = useRef(null);
    const [height, setHeight] = useState(250);

    const srcdoc = `<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { overflow: hidden; display: flex; justify-content: center; align-items: flex-start; }
</style>
</head>
<body>
${banner.content ?? ""}
<script>
(function() {
  function report() {
    var h = document.body.scrollHeight;
    if (h > 0) parent.postMessage({ type: 'bannerResize', id: ${banner.banner_id}, height: h }, '*');
  }
  window.addEventListener('load', report);
  setTimeout(report, 500);
  setTimeout(report, 1500);
})();
<\/script>
</body>
</html>`;

    useEffect(() => {
        function onMessage(e) {
            if (e.data?.type === 'bannerResize' && e.data.id === banner.banner_id) {
                setHeight(e.data.height);
            }
        }
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [banner.banner_id]);

    return (
        <iframe
            ref={iframeRef}
            srcDoc={srcdoc}
            className={`w-full block ${className ?? ""}`}
            style={{ height: `${height}px`, border: "none" }}
            sandbox="allow-scripts"
            title={banner.title || "advertisement"}
        />
    );
}

/**
 * 단일 배너를 타입에 맞게 렌더링
 *
 * IMAGE  — <img> (link_url 있으면 <a> 감싸기)
 * HTML   — dangerouslySetInnerHTML
 * IFRAME — dangerouslySetInnerHTML
 * VIDEO  — dangerouslySetInnerHTML
 * SCRIPT — 격리된 srcdoc iframe (외부 위젯 스크립트 안전 실행)
 */
export default function BannerRenderer({ banner, className = "" }) {
    if (banner.banner_type === "IMAGE") {
        const img = (
            <img
                src={banner.image_url}
                alt={banner.title}
                className={`w-full h-auto block ${className}`}
            />
        );
        return banner.link_url ? (
            <a
                href={banner.link_url}
                target={banner.is_new_tab ? "_blank" : "_self"}
                rel="noopener noreferrer"
            >
                {img}
            </a>
        ) : img;
    }

    if (banner.banner_type === "SCRIPT") {
        return <ScriptBanner banner={banner} className={className} />;
    }

    // HTML, IFRAME, VIDEO
    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: banner.content ?? "" }}
        />
    );
}
