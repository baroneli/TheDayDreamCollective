import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        classes: resolve(__dirname, 'classes.html'),
        schedule: resolve(__dirname, 'schedule.html'),
        contact: resolve(__dirname, 'contact.html'),
        financials: resolve(__dirname, 'financials.html'),
      },
    },
  },
});
