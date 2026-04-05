import Modal from "react-modal";
import "./bootstrap";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";

Modal.setAppElement("#app");

createInertiaApp({
    resolve: (name) =>
        resolvePageComponent(
            `./Admin/Pages/${name}.jsx`,
            import.meta.glob("./Admin/Pages/**/*.jsx"),
        ),
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
