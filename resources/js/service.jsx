import "./bootstrap";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

createInertiaApp({
    resolve: (name) => {
        return resolvePageComponent(
            `./Service/Pages/${name}.jsx`,
            import.meta.glob('./Service/Pages/**/*.jsx')
        );
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
