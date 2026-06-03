import axios from "axios";
import type { AjaxOptions } from "@/types";

const client = axios.create({
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
    },
});

export const ajax = {
    async request(url: string, method: string = "GET", options: AjaxOptions = {}): Promise<unknown> {
        const {
            data = null,
            params = null,
            onLoading = null,
            onSuccess = null,
            onError = null,
            onComplete = null,
        } = options;

        if (onLoading) onLoading(true);

        try {
            const response = await client({
                url,
                method: method.toUpperCase(),
                data,
                params,
                headers:
                    data instanceof FormData
                        ? {}
                        : { "Content-Type": "application/json" },
            });

            if (onSuccess) onSuccess(response.data);
            return response.data;
        } catch (error: unknown) {
            const axiosError = error as { response?: { data: unknown }; message: string };
            const errorData = axiosError.response?.data || axiosError.message;
            if (onError) onError(errorData);
            else console.error("AJAX Error:", errorData);
            throw error;
        } finally {
            if (onLoading) onLoading(false);
            if (onComplete) onComplete();
        }
    },

    get: (url: string, params?: Record<string, unknown> | null, options: AjaxOptions = {}) =>
        ajax.request(url, "GET", { ...options, params }),
    post: (url: string, data?: unknown, options: AjaxOptions = {}) =>
        ajax.request(url, "POST", { ...options, data }),
    put: (url: string, data?: unknown, options: AjaxOptions = {}) =>
        ajax.request(url, "PUT", { ...options, data }),
    patch: (url: string, data?: unknown, options: AjaxOptions = {}) =>
        ajax.request(url, "PATCH", { ...options, data }),
    delete: (url: string, options: AjaxOptions = {}) =>
        ajax.request(url, "DELETE", options),
    upload: (url: string, formData: FormData, options: AjaxOptions = {}) =>
        ajax.post(url, formData, options),
};
