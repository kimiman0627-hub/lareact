/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],
    safelist: [
        // 로또 볼 배경색 — ballColor() 함수에서 동적으로 사용되어 빌드 시 스캔 누락 방지
        'bg-yellow-400',
        'bg-blue-500',
        'bg-red-500',
        'bg-gray-500',
        'bg-green-600',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
