import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/',
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
  plugins: [
    {
      name: 'vite-clean-urls-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url) return next();
          const [pathname, search] = req.url.split('?');
          const query = search ? '?' + search : '';
          if (pathname === '/jelajah' || pathname === '/jelajah/') {
            req.url = '/jelajah.html' + query;
          } else if (pathname === '/paspor' || pathname === '/paspor/') {
            req.url = '/paspor.html' + query;
          } else if (pathname === '/kuis' || pathname === '/kuis/') {
            req.url = '/kuis.html' + query;
          } else if (pathname === '/cerita' || pathname === '/cerita/') {
            req.url = '/index.html' + query;
          }
          next();
        });
      },
      closeBundle() {
        // Gandakan ke struktur folder bersih dist/<rute>/index.html untuk hosting statis (Vercel, Netlify, GitHub Pages)
        const distDir = path.resolve(__dirname, 'dist');
        const routes = ['jelajah', 'paspor', 'kuis'];
        for (const route of routes) {
          const srcHtml = path.join(distDir, `${route}.html`);
          const targetDir = path.join(distDir, route);
          if (fs.existsSync(srcHtml)) {
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            fs.copyFileSync(srcHtml, path.join(targetDir, 'index.html'));
          }
        }
      }
    }
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: false
  }
});
