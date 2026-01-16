import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    root: 'public',
    publicDir: false,
    build: {
        outDir: '../build',
        emptyOutDir: true,
        sourcemap: true,
    },
    server: {
        port: 3000,
        open: true,
        proxy: {
            // Proxy API requests to the backend server during development
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    resolve: {
        alias: {
            '/src': path.resolve(__dirname, './src'),
            '@': path.resolve(__dirname, './src'),
        },
    },
    worker: {
        format: 'es',
    },
});
