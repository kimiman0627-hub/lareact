import { useRef, useEffect } from "react";

/**
 * HTML 문자열에서 <script> 태그를 추출하고, 나머지 HTML을 컨테이너에 렌더링한 뒤
 * 스크립트를 순서대로 주입한다.
 *
 * - 외부 스크립트(src)는 onload 후 다음 스크립트를 실행해 로딩 순서 보장
 * - 인라인 스크립트는 동기 실행
 * - requestAnimationFrame으로 DOM 페인트 완료 후 시작
 *
 * @returns {() => void} cleanup 함수 (언마운트 시 주입된 스크립트 제거)
 */
function injectBannerScript(container, htmlContent) {
    const injected = [];

    // DOMParser로 HTML 파싱 (createContextualFragment보다 안정적)
    const doc = new DOMParser().parseFromString(htmlContent, "text/html");
    const scripts = Array.from(doc.querySelectorAll("script"));

    // 스크립트 제거 후 나머지 HTML 렌더링
    scripts.forEach((s) => s.remove());
    container.innerHTML = doc.body.innerHTML;

    // 스크립트를 index 순서대로 하나씩 주입
    function injectNext(index) {
        if (index >= scripts.length) return;

        const src       = scripts[index];
        const newScript = document.createElement("script");

        // 원본 속성 복사 (type, async, defer, data-* 등)
        Array.from(src.attributes).forEach(({ name, value }) => {
            newScript.setAttribute(name, value);
        });

        if (src.src) {
            // 외부 스크립트: 로드 완료 후 다음 실행
            newScript.onload  = () => injectNext(index + 1);
            newScript.onerror = () => injectNext(index + 1); // 실패해도 다음으로
        } else {
            // 인라인 스크립트
            newScript.textContent = src.textContent;
        }

        container.appendChild(newScript);
        injected.push(newScript);

        // 인라인은 즉시 다음으로 (외부는 onload에서 처리)
        if (!src.src) injectNext(index + 1);
    }

    // DOM 페인트 완료 후 실행
    const rafId = requestAnimationFrame(() => injectNext(0));

    return () => {
        cancelAnimationFrame(rafId);
        injected.forEach((s) => s.parentNode?.removeChild(s));
    };
}

/**
 * 단일 배너를 타입에 맞게 렌더링
 *
 * IMAGE  — <img> (link_url 있으면 <a> 감싸기)
 * HTML   — dangerouslySetInnerHTML
 * IFRAME — dangerouslySetInnerHTML
 * VIDEO  — dangerouslySetInnerHTML
 * SCRIPT — DOM 직접 주입 (로딩 순서 보장)
 */
export default function BannerRenderer({ banner, className = "" }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (banner.banner_type !== "SCRIPT" || !containerRef.current) return;
        const cleanup = injectBannerScript(containerRef.current, banner.content ?? "");
        return cleanup;
    }, [banner.banner_id]);

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
        return <div ref={containerRef} className={className} />;
    }

    // HTML, IFRAME, VIDEO
    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: banner.content ?? "" }}
        />
    );
}
