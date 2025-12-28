import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            // Define aliases if needed
            '@': path.resolve(__dirname, './src'),
            'mapbox-gl': 'maplibre-gl',
        },
    },
    server: {
        // Ensure proper URL encoding for paths
        fs: {
            strict: true,
        },
        port: 3000,
        strictPort: true,
        open: true,
    },
}));
