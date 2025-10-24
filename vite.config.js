import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        financials: resolve(__dirname, 'financials.html'),
      },
    },
  },
  server: {
    strictPort: true,
    port: 5174
  }
});
