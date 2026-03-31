import "./bootstrap";
import React from 'react'; 
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

createInertiaApp({
    resolve: (name) => {
        // name: 'Main/Index' -> 경로: './Service/Pages/Main/Index.jsx'
        return resolvePageComponent(
            `./Service/Pages/${name}.jsx`, 
            import.meta.glob('./Service/Pages/**/*.jsx')
        );
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        // 여기서 <App /> 대신 React.createElement(App, props)를 써보거나, 아래처럼 작성
        root.render(<App {...props} />); 
    },
});
