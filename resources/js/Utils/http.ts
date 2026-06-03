import { router } from "@inertiajs/react";
import type { HttpOptions } from "@/types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const http = {
    request: (method: HttpMethod | string, url: string, data: Record<string, unknown> = {}, options: HttpOptions = {}) => {
        const setLoading = options.onLoading || (() => {});
        const isAdmin = url.startsWith("/admin");

        let payload: Record<string, unknown> = { ...data };
        let currentMethod = method.toUpperCase() as HttpMethod;

        // 파일 포함 PUT/PATCH/DELETE 시 라라벨 메소드 스푸핑
        if (["PUT", "PATCH", "DELETE"].includes(currentMethod) && hasFiles(data)) {
            payload._method = currentMethod;
            currentMethod = "POST";
        }

        router.visit(url, {
            method: currentMethod.toLowerCase() as "get" | "post" | "put" | "patch" | "delete",
            data: payload as Record<string, string | number | boolean | File | Blob>,
            forceFormData: hasFiles(data),
            preserveScroll: options.preserveScroll ?? true,
            preserveState: options.preserveState ?? true,
            replace: options.replace,

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

            onFinish: (visit) => {
                setLoading(false);
                options.onFinish?.(visit);
            },
        });
    },

    get: (url: string, data?: Record<string, unknown>, options?: HttpOptions) =>
        http.request("GET", url, data, options),
    post: (url: string, data?: Record<string, unknown>, options?: HttpOptions) =>
        http.request("POST", url, data, options),
    put: (url: string, data?: Record<string, unknown>, options?: HttpOptions) =>
        http.request("PUT", url, data, options),
    patch: (url: string, data?: Record<string, unknown>, options?: HttpOptions) =>
        http.request("PATCH", url, data, options),
    delete: (url: string, options: HttpOptions = {}) => {
        const msg = options.confirmMsg || "정말 삭제하시겠습니까?";
        if (confirm(msg)) {
            http.request("DELETE", url, {}, options);
        }
    },
};

function hasFiles(data: Record<string, unknown>): boolean {
    if (!data) return false;
    return Object.values(data).some((v) => {
        if (v instanceof File || v instanceof Blob) return true;
        if (Array.isArray(v)) return v.some((f) => f instanceof File || f instanceof Blob);
        return false;
    });
}
