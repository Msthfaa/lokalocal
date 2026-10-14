/**
 * tekstur-atlas.js — Generator Tekstur Peta Atlas Topografi Fisik Realistis
 * Membangkitkan kanvas tekstur resolusi tinggi (1024x1024) bergaya peta fisik / terrain atlas
 * dengan elevasi hipsometrik (pesisir hijau, perbukitan oker, pegunungan vulkanik cokelat),
 * efek hillshading 3D (cahaya relief NW), alur sungai biru safir, dan garis kontur kartografi tajam.
 */

import { CanvasTexture, RepeatWrapping } from 'three';
import { hashString } from '../util/hash.js';

// Cache tekstur per kode provinsi agar tidak di-render berulang
const cacheTeksturPeta = new Map();
const cacheBumpPeta = new Map();

/**
 * Pseudo-random generator deterministik berbasis seed integer
 * @param {number} seed
 * @returns {number} 0..1
 */
function prng(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Membangkitkan Tekstur Peta Atlas Topografi Fisik Realistis untuk suatu provinsi
 * @param {object} parameter
 * @param {string} parameter.kode - Kode provinsi (misal: "35")
 * @param {string} [parameter.nama] - Nama provinsi (misal: "Jawa Timur")
 * @param {boolean} [parameter.belumTercatat=false]
 * @returns {{ teksturPeta: CanvasTexture, bumpMap: CanvasTexture }}
 */
export function dapatkanTeksturAtlasProvinsi({
  kode = '00',
  nama = '',
  belumTercatat = false
} = {}) {
  const kunciCache = `${kode}_${belumTercatat ? 'belum' : 'berdata'}`;
  if (cacheTeksturPeta.has(kunciCache) && cacheBumpPeta.has(kunciCache)) {
    return {
      teksturPeta: cacheTeksturPeta.get(kunciCache),
      bumpMap: cacheBumpPeta.get(kunciCache)
    };
  }

  if (typeof document === 'undefined') {
    return { teksturPeta: null, bumpMap: null };
  }

  const seed = hashString(kode + (nama || 'atlas'));
  const UKURAN = 1024;

  // ==============================================================
  // 1. KANVAS TEKSTUR BERWARNA (PHYSICAL MAP COLOR TEXTURE)
  // ==============================================================
  const canvasWarna = document.createElement('canvas');
  canvasWarna.width = UKURAN;
  canvasWarna.height = UKURAN;
  const ctx = canvasWarna.getContext('2d');

  // Kanvas Bump Map Grayscale yang selaras
  const canvasBump = document.createElement('canvas');
  canvasBump.width = UKURAN;
  canvasBump.height = UKURAN;
  const ctxBump = canvasBump.getContext('2d');

  // A. Latar Belakang Dataran Rendah Pesisir (Coastal Lowlands)
  // Gradasi alami bentang alam nusantara: hijau zamrud pesisir -> dataran pertanian
  const gradDasar = ctx.createLinearGradient(0, 0, UKURAN, UKURAN);
  if (belumTercatat) {
    gradDasar.addColorStop(0, '#5A8E62');
    gradDasar.addColorStop(0.35, '#4E7F55');
    gradDasar.addColorStop(0.7, '#416E47');
    gradDasar.addColorStop(1, '#53855A');
  } else {
    gradDasar.addColorStop(0, '#66A543');
    gradDasar.addColorStop(0.3, '#589437');
    gradDasar.addColorStop(0.65, '#4C822E');
    gradDasar.addColorStop(0.85, '#3F7024');
    gradDasar.addColorStop(1, '#5E9B3D');
  }
  ctx.fillStyle = gradDasar;
  ctx.fillRect(0, 0, UKURAN, UKURAN);

  // Bump map dasar netral
  ctxBump.fillStyle = '#808080';
  ctxBump.fillRect(0, 0, UKURAN, UKURAN);

  // B. Variasi Alami Lembah & Dataran Agrikultur Tropis (Mikro-Patchwork)
  ctx.fillStyle = belumTercatat ? 'rgba(70, 115, 80, 0.18)' : 'rgba(110, 165, 60, 0.22)';
  for (let i = 0; i < 40; i++) {
    const px = prng(seed + i * 7) * UKURAN;
    const py = prng(seed + i * 11) * UKURAN;
    const radX = 60 + prng(seed + i * 13) * 120;
    const radY = 40 + prng(seed + i * 17) * 90;
    ctx.beginPath();
    ctx.ellipse(px, py, radX, radY, prng(seed + i) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // C. Gugusan Barisan Pegunungan & Dataran Tinggi Hipsometrik (Mountain Ranges)
  // Membangkitkan 3-5 punggung pegunungan utama melintasi daratan provinsi
  const jumlahPegunungan = 3 + Math.floor(prng(seed + 1) * 3);
  const daftarGunung = [];

  for (let g = 0; g < jumlahPegunungan; g++) {
    const sG = seed + g * 31;
    // Pusat punggung pegunungan di koordinat dalam provinsi
    const gx = UKURAN * (0.2 + prng(sG + 2) * 0.6);
    const gy = UKURAN * (0.2 + prng(sG + 3) * 0.6);
    const jariDasar = 140 + prng(sG + 4) * 160;
    const rotGunung = (prng(sG + 5) - 0.5) * Math.PI * 0.8;
    daftarGunung.push({ x: gx, y: gy, r: jariDasar, rot: rotGunung, s: sG });

    // Lapisan 1: Kaki Bukit & Dataran Tinggi (Piedmont / Hills) — Oker Zaitun
    ctx.fillStyle = belumTercatat ? 'rgba(145, 140, 85, 0.65)' : 'rgba(175, 160, 75, 0.68)';
    ctx.beginPath();
    gambarKonturWobble(ctx, gx, gy, jariDasar * 1.0, 12, sG);
    ctx.fill();

    // Bump Lapisan 1
    ctxBump.fillStyle = '#A2A2A2';
    ctxBump.beginPath();
    gambarKonturWobble(ctxBump, gx, gy, jariDasar * 1.0, 12, sG);
    ctxBump.fill();

    // Lapisan 2: Lereng Pegunungan Tengah (Montane Slopes) — Oker Cokelat
    ctx.fillStyle = belumTercatat ? 'rgba(140, 105, 65, 0.72)' : 'rgba(165, 115, 60, 0.78)';
    ctx.beginPath();
    gambarKonturWobble(ctx, gx, gy, jariDasar * 0.68, 10, sG + 10);
    ctx.fill();

    // Bump Lapisan 2
    ctxBump.fillStyle = '#C0C0C0';
    ctxBump.beginPath();
    gambarKonturWobble(ctxBump, gx, gy, jariDasar * 0.68, 10, sG + 10);
    ctxBump.fill();

    // Lapisan 3: Punggung Pegunungan Tinggi (High Mountain Ridges) — Cokelat Terakota Vulkanik
    ctx.fillStyle = belumTercatat ? 'rgba(110, 65, 38, 0.82)' : 'rgba(135, 70, 35, 0.88)';
    ctx.beginPath();
    gambarKonturWobble(ctx, gx, gy, jariDasar * 0.42, 8, sG + 20);
    ctx.fill();

    // Bump Lapisan 3
    ctxBump.fillStyle = '#DCB0B0';
    ctxBump.beginPath();
    gambarKonturWobble(ctxBump, gx, gy, jariDasar * 0.42, 8, sG + 20);
    ctxBump.fill();

    // Lapisan 4: Puncak Gunung Berapi / Kaldera Tertinggi — Cokelat Basalt Tua Pekat
    ctx.fillStyle = 'rgba(75, 35, 18, 0.92)';
    ctx.beginPath();
    gambarKonturWobble(ctx, gx, gy, jariDasar * 0.20, 6, sG + 30);
    ctx.fill();

    // Bump Lapisan 4 (Puncak tertinggi = putih cerah)
    ctxBump.fillStyle = '#FFFFFF';
    ctxBump.beginPath();
    gambarKonturWobble(ctxBump, gx, gy, jariDasar * 0.20, 6, sG + 30);
    ctxBump.fill();

    // D. Efek Hillshading 3D Kartografi (Cahaya Barat Laut standard NW USGS / NatGeo)
    // Lereng Barat Laut (kiri-atas): Sorotan cahaya terang keemasan
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 225, 0.26)';
    ctx.beginPath();
    ctx.arc(gx - jariDasar * 0.18, gy - jariDasar * 0.18, jariDasar * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Lereng Tenggara (kanan-bawah): Bayangan teduh relief pegunungan
    ctx.save();
    ctx.fillStyle = 'rgba(20, 15, 10, 0.30)';
    ctx.beginPath();
    ctx.arc(gx + jariDasar * 0.16, gy + jariDasar * 0.16, jariDasar * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Danau Kawah Vulkanik / Kaldera Biru Toska di Puncak Gunung Tertentu
    if (prng(sG + 9) > 0.45) {
      ctx.fillStyle = 'rgba(38, 142, 155, 0.85)';
      ctx.beginPath();
      ctx.ellipse(
        gx + (prng(sG + 7) - 0.5) * 20,
        gy + (prng(sG + 8) - 0.5) * 20,
        14 + prng(sG + 6) * 16,
        9 + prng(sG + 9) * 10,
        prng(sG) * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Bump danau = lekukan ke dalam
      ctxBump.fillStyle = '#656565';
      ctxBump.beginPath();
      ctxBump.arc(gx, gy, 18, 0, Math.PI * 2);
      ctxBump.fill();
    }
  }

  // E. Alur Sungai-Sungai Alami Mengular (Hydrographic River Systems)
  // Sungai mengalir dari punggung pegunungan menuju ke pesisir laut
  ctx.strokeStyle = 'rgba(56, 115, 175, 0.78)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctxBump.strokeStyle = '#555555'; // Alur sungai mengukir lekukan lembah di bump map
  ctxBump.lineCap = 'round';
  ctxBump.lineJoin = 'round';

  for (let s = 0; s < 7; s++) {
    const sS = seed + s * 43;
    const gIndex = s % daftarGunung.length;
    const gSumber = daftarGunung[gIndex];

    let curX = gSumber.x + (prng(sS + 1) - 0.5) * 40;
    let curY = gSumber.y + (prng(sS + 2) - 0.5) * 40;

    // Arah aliran menuju tepi kanvas
    const sudutAliran = prng(sS + 3) * Math.PI * 2;
    const lebarSungai = 1.6 + prng(sS + 4) * 2.2;

    ctx.lineWidth = lebarSungai;
    ctxBump.lineWidth = lebarSungai + 1.2;

    ctx.beginPath();
    ctxBump.beginPath();
    ctx.moveTo(curX, curY);
    ctxBump.moveTo(curX, curY);

    const segmen = 18 + Math.floor(prng(sS + 5) * 12);
    for (let seg = 0; seg < segmen; seg++) {
      const stepDist = 18 + prng(sS + seg) * 14;
      const belok = (prng(sS + seg * 3) - 0.5) * 0.7;
      curX += Math.cos(sudutAliran + belok) * stepDist;
      curY += Math.sin(sudutAliran + belok) * stepDist;
      ctx.lineTo(curX, curY);
      ctxBump.lineTo(curX, curY);

      // Percabangan anak sungai kecil
      if (seg === Math.floor(segmen * 0.45)) {
        ctx.save();
        ctx.lineWidth = lebarSungai * 0.6;
        ctx.beginPath();
        ctx.moveTo(curX, curY);
        const cabX = curX + Math.cos(sudutAliran + 0.9) * 45;
        const cabY = curY + Math.sin(sudutAliran + 0.9) * 45;
        ctx.lineTo(cabX, cabY);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.stroke();
    ctxBump.stroke();
  }

  // F. Garis-Garis Kontur Topografi Kartografi Tajam (Topographic Contour Lines)
  // Menghasilkan garis-garis kontur ketinggian yang rapi dan elegan
  for (const g of daftarGunung) {
    for (let c = 1; c <= 7; c++) {
      const rC = g.r * (0.25 + c * 0.11);
      const adalahIndeks = c % 2 === 0;

      ctx.beginPath();
      gambarKonturWobble(ctx, g.x, g.y, rC, 14, g.s + c * 9);

      if (adalahIndeks) {
        // Kontur Indeks (lebih tebal, warna krem keemasan)
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = 'rgba(255, 240, 195, 0.38)';
      } else {
        // Kontur Menengah (tipis, putih lembut)
        ctx.lineWidth = 0.85;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      }
      ctx.stroke();
    }
  }

  // G. Grid Koordinat Kartografi & Garis Lintang/Bujur Halus (Geodetic Grid Lines)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 0.8;
  const gridJarak = UKURAN / 8;
  for (let x = gridJarak; x < UKURAN; x += gridJarak) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, UKURAN);
    ctx.stroke();
  }
  for (let y = gridJarak; y < UKURAN; y += gridJarak) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(UKURAN, y);
    ctx.stroke();
  }

  // H. Bintik-Bintik Kanopi Vegetasi Tropis Mikro & Detail Relief Batu
  ctx.fillStyle = belumTercatat ? 'rgba(220, 230, 210, 0.16)' : 'rgba(240, 225, 175, 0.18)';
  for (let i = 0; i < 900; i++) {
    const rx = (Math.sin(i * 12.9898 + seed) * 0.5 + 0.5) * UKURAN;
    const ry = (Math.cos(i * 78.233 + seed) * 0.5 + 0.5) * UKURAN;
    const rad = 1 + (Math.sin(i * 4.14) * 0.5 + 0.5) * 3.2;
    ctx.beginPath();
    ctx.arc(rx, ry, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // I. Titik-Titik Kota Administratif Bercahaya Lembut (Administrative Town Indicators)
  for (let k = 0; k < 6; k++) {
    const kX = UKURAN * (0.18 + prng(seed + k * 19) * 0.64);
    const kY = UKURAN * (0.18 + prng(seed + k * 23) * 0.64);

    // Titik pusat putih
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(kX, kY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Lingkaran konsentris keemasan
    ctx.strokeStyle = 'rgba(255, 220, 120, 0.65)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(kX, kY, 6.0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ==============================================================
  // BUAT THREE.JS CANVASTEXTURE DENGAN MAPPING PENUH [0, 1]
  // ==============================================================
  const teksturPeta = new CanvasTexture(canvasWarna);
  teksturPeta.wrapS = RepeatWrapping;
  teksturPeta.wrapT = RepeatWrapping;
  teksturPeta.repeat.set(1.0, 1.0); // Membungkus penuh poligon daratan provinsi tanpa ubin berulang!

  const bumpMap = new CanvasTexture(canvasBump);
  bumpMap.wrapS = RepeatWrapping;
  bumpMap.wrapT = RepeatWrapping;
  bumpMap.repeat.set(1.0, 1.0);

  cacheTeksturPeta.set(kunciCache, teksturPeta);
  cacheBumpPeta.set(kunciCache, bumpMap);

  return { teksturPeta, bumpMap };
}

/**
 * Menggambar jalur kontur berwobble kurva alami fraktal
 */
function gambarKonturWobble(ctx, cx, cy, rBase, segmen = 12, s = 0) {
  const step = (Math.PI * 2) / segmen;
  for (let i = 0; i <= segmen; i++) {
    const a = i * step;
    const wobble =
      Math.sin(a * 3 + s) * (rBase * 0.12) +
      Math.cos(a * 5 + s * 1.5) * (rBase * 0.08) +
      Math.sin(a * 7) * (rBase * 0.04);
    const r = Math.max(10, rBase + wobble);
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
}
