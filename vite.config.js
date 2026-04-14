import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; 

export default defineConfig(({ mode }) => {
    // .env 파일 로드
    const env = loadEnv(mode, process.cwd(), '');

    return {
        server: {
            host: '127.0.0.1', // Nginx가 내부(Local)에서 전달해주므로 127.0.0.1 고정
            port: 5173,
            strictPort: true,
            hmr: {
                protocol:   'wss',                                      // HTTPS 환경에서는 wss 필수
                host:       env.VITE_SERVER_HOST,                       // krlived.com
                clientPort: parseInt(env.VITE_HMR_CLIENT_PORT) || 443, // 브라우저는 443으로 접속
            },
            watch: {
                // vendor/, node_modules/ 는 변경될 일 없으므로 watch에서 제외
                // → inotify 파일워처 수 대폭 절감 (ENOSPC 방지)
                ignored: ['**/vendor/**', '**/node_modules/**', '**/storage/**', '**/public/build/**'],
            },
        },
        plugins: [
            tailwindcss(), 
            laravel({
                input: [
                    'resources/css/app.css',
                    'resources/css/admin.css',
                    'resources/js/service.jsx',
                    'resources/js/admin.jsx'
                ],
                refresh: true,
            }),
            react(),
        ],
        resolve: {
            alias: {
                '@': '/resources/js',
            },
        },
    };
});
