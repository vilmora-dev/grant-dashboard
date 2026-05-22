import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/recharts') ||
                        id.includes('node_modules/d3') ||
                        id.includes('node_modules/victory-vendor')) {
                        return 'vendor-recharts';
                    }
                    if (id.includes('node_modules/react-dom')) return 'vendor-react';
                    if (id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-is') ||
                        id.includes('node_modules/scheduler')) {
                        return 'vendor-react';
                    }
                    if (id.includes('node_modules/@inertiajs')) return 'vendor-inertia';
                },
            },
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        hmr: {
            host: 'localhost',
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
});
