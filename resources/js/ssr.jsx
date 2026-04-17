import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        resolve: (name) => {
            // SSR에서는 비동기 dynamic import 불가 → eager: true 로 전체 로드
            const pages = import.meta.glob('./Service/Pages/**/*.jsx', { eager: true });
            return pages[`./Service/Pages/${name}.jsx`];
        },
        setup({ App, props }) {
            return <App {...props} />;
        },
    })
);
