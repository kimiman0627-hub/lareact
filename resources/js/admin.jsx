
import "./bootstrap";
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

createInertiaApp({
     resolve: (name) => {
            // name: 'Main/Index' -> 경로: './Service/Pages/Main/Index.jsx'
            return resolvePageComponent(
                `./Admin/Pages/${name}.jsx`, 
                import.meta.glob('./Admin/Pages/**/*.jsx')
            );
        },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
