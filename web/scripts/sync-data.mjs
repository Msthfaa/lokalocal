/**
 * sync-data.mjs — Menyalin data hasil pembersihan dari ../public/data/clean/
 * ke dalam folder web/public/data/ agar aplikasi web mandiri dan tidak
 * mengakses path di luar root Vite.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(WEB_ROOT, '..');

const SRC_CLEAN_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'clean');
const DEST_DATA_DIR = path.join(WEB_ROOT, 'public', 'data');
const DEST_GEO_DIR = path.join(DEST_DATA_DIR, 'geo');

const FILES_TO_SYNC = [
  { src: 'budaya.clean.json', dest: path.join(DEST_DATA_DIR, 'budaya.clean.json') },
  { src: 'provinsi.json', dest: path.join(DEST_DATA_DIR, 'provinsi.json') },
  { src: 'statistik.json', dest: path.join(DEST_DATA_DIR, 'statistik.json') },
  { src: 'kabupaten.json', dest: path.join(DEST_DATA_DIR, 'kabupaten.json') },
  { src: 'index-pencarian.json', dest: path.join(DEST_DATA_DIR, 'index-pencarian.json') },
  { src: 'meta.clean.json', dest: path.join(DEST_DATA_DIR, 'meta.clean.json') },
  { src: 'provinsi.geojson', dest: path.join(DEST_GEO_DIR, 'provinsi.geojson') }
];

function syncData() {
  if (!fs.existsSync(SRC_CLEAN_DIR)) {
    console.error(`[sync-data] Folder sumber tidak ditemukan: ${SRC_CLEAN_DIR}`);
    console.error('Jalankan "node tools/clean.mjs" dan "node tools/build-geo.mjs" terlebih dahulu dari akar proyek.');
    process.exit(1);
  }

  fs.mkdirSync(DEST_DATA_DIR, { recursive: true });
  fs.mkdirSync(DEST_GEO_DIR, { recursive: true });

  let disalin = 0;
  for (const item of FILES_TO_SYNC) {
    const srcPath = path.join(SRC_CLEAN_DIR, item.src);
    if (!fs.existsSync(srcPath)) {
      console.error(`[sync-data] Berkas sumber tidak ditemukan: ${srcPath}`);
      process.exit(1);
    }
    fs.copyFileSync(srcPath, item.dest);
    const stat = fs.statSync(item.dest);
    const kb = (stat.size / 1024).toFixed(1);
    console.log(`  [OK] ${item.src} -> ${path.relative(WEB_ROOT, item.dest)} (${kb} KB)`);
    disalin++;
  }

  console.log(`[sync-data] Selesai menyalin ${disalin} berkas data bersih ke web/public/data/.`);
}

syncData();
