import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Define aliases if needed
      '@': path.resolve(__dirname, './src'),
      'mapbox-gl': 'maplibre-gl'
    },
  },
  server: {
    // Ensure proper URL encoding for paths
    fs: {
      strict: true,
    },
  },
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
});