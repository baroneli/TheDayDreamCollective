import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

function getHtmlInputs() {
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.html'));
  const entries = {};
  for (const f of files) {
    const name = f.replace(/\.html$/, '');
    entries[name] = resolve(__dirname, f);
  }
  return entries;
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: getHtmlInputs(),
    },
  },
  server: { strictPort: true, port: 5174 },
});
