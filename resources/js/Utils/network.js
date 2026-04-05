import axios from "axios";

const client = axios.create({
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
    },
});

export const ajax = {
    /**
     * 핵심 요청 함수
     */
    async request(url, method = "GET", options = {}) {
        const {
            data = null,
            params = null, // GET 파라미터 전용
            onLoading = null, // 로딩 상태 제어 (true/false)
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
                // FormData일 경우 Axios가 Content-Type을 알아서 설정함
                headers:
                    data instanceof FormData
                        ? {}
                        : { "Content-Type": "application/json" },
            });

            if (onSuccess) onSuccess(response.data);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data || error.message;
            if (onError) onError(errorData);
            else console.error("AJAX Error:", errorData);
            throw error;
        } finally {
            if (onLoading) onLoading(false);
            if (onComplete) onComplete();
        }
    },

    // 래퍼 메서드들
    get: (url, params, options = {}) =>
        ajax.request(url, "GET", { ...options, params }),
    post: (url, data, options = {}) =>
        ajax.request(url, "POST", { ...options, data }),
    put: (url, data, options = {}) =>
        ajax.request(url, "PUT", { ...options, data }),
    patch: (url, data, options = {}) =>
        ajax.request(url, "PATCH", { ...options, data }),
    delete: (url, options = {}) => ajax.request(url, "DELETE", options),

    // 파일 업로드 전용
    upload: (url, formData, options = {}) => ajax.post(url, formData, options),
};
