import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        jelajah: path.resolve(__dirname, 'jelajah.html'),
        paspor: path.resolve(__dirname, 'paspor.html'),
        kuis: path.resolve(__dirname, 'kuis.html')
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false
  }
});
