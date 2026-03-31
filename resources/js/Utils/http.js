import { router } from "@inertiajs/react";

export const http = {
    request: (method, url, data = {}, options = {}) => {
        // [추가] 로딩 제어 함수 추출 (기본값은 빈 함수로 처리해서 에러 방지)
        const setLoading = options.onLoading || (() => {});
        const isAdmin = url.startsWith("/admin");

        let payload = { ...data };
        let currentMethod = method.toUpperCase();

        // 파일 포함 PUT/PATCH 시 라라벨 메소드 스푸핑
        if (
            ["PUT", "PATCH", "DELETE"].includes(currentMethod) &&
            hasFiles(data)
        ) {
            payload._method = currentMethod;
            currentMethod = "POST";
        }

        router.visit(url, {
            ...options,
            method: currentMethod.toLowerCase(),
            data: payload,
            forceFormData: hasFiles(data),
            preserveScroll: options.preserveScroll ?? true,
            preserveState: options.preserveState ?? true,

            // [개선] 요청 시작 시 로딩 시작
            onBefore: (visit) => {
                setLoading(true);
                options.onBefore?.(visit);
            },

            onSuccess: (page) => {
                options.onSuccess?.(page);
            },

            onError: (errors) => {
                if (isAdmin) console.error("Admin API Error:", errors);
                options.onError?.(errors);
            },

            // [개선] 성공/실패 상관없이 요청이 끝날 때 무조건 로딩 해제
            onFinish: (visit) => {
                setLoading(false);
                options.onFinish?.(visit);
            },
        });
    },

    // 래퍼 메서드들
    get: (url, data, options) => http.request("GET", url, data, options),
    post: (url, data, options) => http.request("POST", url, data, options),
    put: (url, data, options) => http.request("PUT", url, data, options),
    patch: (url, data, options) => http.request("PATCH", url, data, options),
    delete: (url, options = {}) => {
        const msg = options.confirmMsg || "정말 삭제하시겠습니까?";
        if (confirm(msg)) {
            http.request("DELETE", url, {}, options);
        }
    },
};

function hasFiles(data) {
    if (!data) return false;
    return Object.values(data).some((v) => {
        if (v instanceof File || v instanceof Blob) return true;
        if (Array.isArray(v))
            return v.some((f) => f instanceof File || f instanceof Blob);
        return false;
    });
}
