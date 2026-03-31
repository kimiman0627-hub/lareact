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
                host: env.VITE_SERVER_HOST, // 브라우저가 접속할 공인 IP
                clientPort: parseInt(env.VITE_HMR_CLIENT_PORT) || 80, // 브라우저는 80으로 접속
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
