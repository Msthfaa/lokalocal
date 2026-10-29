/**
 * paspor-canvas.js — Generator Cetak Kartu Pengelana & Instagram Story (HTML5 Canvas PNG)
 * Mendukung 2 Format Grafis Resolusi Tinggi:
 * 1. Kartu Tanda Pengelana (Lanskap 1200×675 px) — Untuk dokumen, sertifikat, & Twitter/X.
 * 2. Instagram Story (Vertikal 1080×1920 px / Rasio 9:16) — Untuk Instagram Story, WhatsApp Status, & TikTok.
 * Dilengkapi Sistem Peringkat Kehormatan, Cap Segel Resmi, dan Miniatur 38 Petak Stempel.
 * 100% Client-side, tanpa server eksternal, latensi 0 ms.
 */

import { formatAngka } from '../util/format.js';
import { tampilkanToast } from '../ui/toast.js';
import { hitungPeringkatPaspor } from './peringkat-paspor.js';

let gambarGatotkacaCache = null;

/**
 * Memuat gambar Gatotkaca Chibi ke memori untuk di-render ke Canvas.
 */
function muatGambarGatotkaca() {
  if (gambarGatotkacaCache) return Promise.resolve(gambarGatotkacaCache);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      gambarGatotkacaCache = img;
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = '/assets/gatotkaca-transparan.png';
  });
}

/**
 * FORMAT 1: Kartu Tanda Pengelana Budaya (Lanskap 1200 × 675 px)
 */
export function gambarKartuPengelana({
  kanvas,
  nama = 'Pengelana Nusantara',
  semuaStempel = {},
  totalProvinsi = 38,
  infoGelar = null,
  gambarMaskot = null
}) {
  kanvas.width = 1200;
  kanvas.height = 675;
  const ctx = kanvas.getContext('2d');
  const L = kanvas.width;
  const T = kanvas.height;

  const stempelArr = Object.keys(semuaStempel);
  const totalStempel = stempelArr.length;
  const namaBersih = (nama || 'Pengelana Nusantara').trim() || 'Pengelana Nusantara';
  const gelarInfo = infoGelar || hitungPeringkatPaspor(totalStempel, totalProvinsi);

  // 1. Latar Belakang Gradasi Hangat Malam Nusantara
  const gradLatar = ctx.createLinearGradient(0, 0, L, T);
  gradLatar.addColorStop(0, '#14100C');
  gradLatar.addColorStop(0.5, '#1A1410');
  gradLatar.addColorStop(1, '#0E0B09');
  ctx.fillStyle = gradLatar;
  ctx.fillRect(0, 0, L, T);

  // Radial Glow Emas Hangat di Tengah
  const gradGlow = ctx.createRadialGradient(L * 0.5, T * 0.45, 50, L * 0.5, T * 0.45, 550);
  gradGlow.addColorStop(0, 'rgba(212, 160, 23, 0.12)');
  gradGlow.addColorStop(0.6, 'rgba(180, 83, 9, 0.05)');
  gradGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradGlow;
  ctx.fillRect(0, 0, L, T);

  // 2. Bingkai Ornamen Luar Ganda (Double Border Emas Geometris)
  const padLuar = 28;
  ctx.strokeStyle = 'rgba(212, 160, 23, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(padLuar, padLuar, L - padLuar * 2, T - padLuar * 2);

  const padDalam = 36;
  ctx.strokeStyle = 'rgba(212, 160, 23, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(padDalam, padDalam, L - padDalam * 2, T - padDalam * 2);

  // Titik Aksen Sudut
  ctx.fillStyle = '#D4A017';
  const titikSudut = [
    [padLuar, padLuar],
    [L - padLuar, padLuar],
    [padLuar, T - padLuar],
    [L - padLuar, T - padLuar]
  ];
  for (const [x, y] of titikSudut) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Header Kartu
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD15C';
  ctx.font = '700 13px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('REPUBLIK INDONESIA • KEMENTERIAN KEBUDAYAAN', L / 2, 72);

  ctx.fillStyle = '#F5F0EB';
  ctx.font = '700 28px "Fraunces", Georgia, serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('KARTU TANDA PENGELANA BUDAYA', L / 2, 108);

  ctx.fillStyle = 'rgba(212, 160, 23, 0.85)';
  ctx.font = '500 13px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText('DOKUMEN PENJELAJAH RESMI ATLAS BUDAYA LOKALOCAL', L / 2, 130);

  // Garis Pembatas Header Emas
  const gradGaris = ctx.createLinearGradient(L * 0.2, 142, L * 0.8, 142);
  gradGaris.addColorStop(0, 'rgba(212, 160, 23, 0)');
  gradGaris.addColorStop(0.5, 'rgba(212, 160, 23, 0.6)');
  gradGaris.addColorStop(1, 'rgba(212, 160, 23, 0)');
  ctx.strokeStyle = gradGaris;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(L * 0.15, 145);
  ctx.lineTo(L * 0.85, 145);
  ctx.stroke();
  ctx.restore();

  // 4. Panel Kiri: Maskot Gatotkaca Chibi dalam Bingkai Lingkaran Emas
  const avatarX = 185;
  const avatarY = 320;
  const avatarR = 105;

  ctx.save();
  const gradAvatar = ctx.createRadialGradient(avatarX, avatarY, 30, avatarX, avatarY, avatarR);
  gradAvatar.addColorStop(0, 'rgba(212, 160, 23, 0.3)');
  gradAvatar.addColorStop(1, 'rgba(20, 16, 12, 0.85)');
  ctx.fillStyle = gradAvatar;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#D4A017';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.stroke();

  // Lingkaran Titik Hiasan
  ctx.strokeStyle = 'rgba(255, 209, 92, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR - 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (gambarMaskot) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR - 10, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(gambarMaskot, avatarX - 90, avatarY - 88, 180, 180);
    ctx.restore();
  } else {
    ctx.fillStyle = '#D4A017';
    ctx.font = '64px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('✦', avatarX, avatarY + 20);
  }

  ctx.fillStyle = '#FFD15C';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1px';
  ctx.fillText('KSATRIA BUDAYA', avatarX, avatarY + avatarR + 24);
  ctx.restore();

  // 5. Panel Tengah: Informasi Pengelana & Gelar Kehormatan
  const infoX = 350;
  const barisY = 210;

  ctx.fillStyle = 'rgba(212, 160, 23, 0.85)';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('NAMA PENJELAJAH', infoX, barisY);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 32px "Fraunces", Georgia, serif';
  ctx.fillText(namaBersih, infoX, barisY + 36);

  ctx.fillStyle = 'rgba(212, 160, 23, 0.85)';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('PERINGKAT KEHORMATAN', infoX, barisY + 86);

  ctx.fillStyle = '#FFBE3B';
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${gelarInfo.gelar} • ${gelarInfo.kicker}`, infoX, barisY + 116);

  ctx.fillStyle = 'rgba(212, 160, 23, 0.85)';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('JEJAK WILAYAH TERHIMPUN', infoX, barisY + 166);

  ctx.fillStyle = '#F5F0EB';
  ctx.font = '700 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${formatAngka(totalStempel)} dari ${formatAngka(totalProvinsi)} Provinsi`, infoX, barisY + 196);

  // Progres Bar
  const barLebar = 460;
  const barTinggi = 8;
  const barY = barisY + 210;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(infoX, barY, barLebar, barTinggi);

  const rasio = Math.min(1, Math.max(0, totalStempel / totalProvinsi));
  ctx.fillStyle = '#D4A017';
  ctx.fillRect(infoX, barY, barLebar * rasio, barTinggi);

  const tglKini = new Date();
  const formatTgl = tglKini.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const hashReg = `LKLC-${tglKini.getFullYear()}-${String(totalStempel).padStart(2, '0')}${Math.abs(namaBersih.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 9000 + 1000)}`;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '500 13px ui-monospace, monospace';
  ctx.fillText(`NO. REG: ${hashReg}   |   TERBIT: ${formatTgl}`, infoX, barisY + 246);

  // 6. Panel Kanan: Cap Segel Timbul Resmi
  const segelX = 980;
  const segelY = 320;
  const segelR = 76;

  ctx.save();
  ctx.translate(segelX, segelY);
  ctx.rotate(-0.08);

  ctx.strokeStyle = '#D4A017';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, segelR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 160, 23, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, segelR - 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#FFD15C';
  ctx.font = '28px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('✦', 0, 10);

  ctx.fillStyle = '#FFD15C';
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText('TERCATAT RESMI', 0, -22);
  ctx.fillText('SPKT KEMENBUD', 0, 32);
  ctx.restore();

  // 7. Footer Kartu
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(245, 240, 235, 0.75)';
  ctx.font = 'italic 14px "Fraunces", Georgia, serif';
  ctx.fillText('"Budaya Indonesia tidak sedikit. Yang sedikit adalah yang sudah tercatat."', L / 2, T - 55);

  ctx.fillStyle = 'rgba(212, 160, 23, 0.7)';
  ctx.font = '500 11px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('Atlas Budaya Nusantara • https://spkt.kemenbud.go.id', L / 2, T - 36);
  ctx.restore();
}

/**
 * FORMAT 2: Kartu Instagram Story (Vertikal 1080 × 1920 px — Rasio 9:16)
 */
export function gambarKartuInstagramStory({
  kanvas,
  nama = 'Pengelana Nusantara',
  semuaStempel = {},
  totalProvinsi = 38,
  infoGelar = null,
  gambarMaskot = null
}) {
  kanvas.width = 1080;
  kanvas.height = 1920;
  const ctx = kanvas.getContext('2d');
  const L = kanvas.width;   // 1080
  const T = kanvas.height;  // 1920

  const stempelArr = Object.keys(semuaStempel);
  const totalStempel = stempelArr.length;
  const namaBersih = (nama || 'Pengelana Nusantara').trim() || 'Pengelana Nusantara';
  const gelarInfo = infoGelar || hitungPeringkatPaspor(totalStempel, totalProvinsi);

  // 1. Latar Belakang Vertikal Deep Royal Night
  const gradLatar = ctx.createLinearGradient(0, 0, 0, T);
  gradLatar.addColorStop(0, '#0F0B08');
  gradLatar.addColorStop(0.35, '#19120D');
  gradLatar.addColorStop(0.7, '#140E0A');
  gradLatar.addColorStop(1, '#080605');
  ctx.fillStyle = gradLatar;
  ctx.fillRect(0, 0, L, T);

  // Radial Aura Cahaya Emas Atas & Tengah
  const gradGlowAtas = ctx.createRadialGradient(L * 0.5, 480, 40, L * 0.5, 480, 520);
  gradGlowAtas.addColorStop(0, 'rgba(255, 209, 92, 0.16)');
  gradGlowAtas.addColorStop(0.6, 'rgba(212, 160, 23, 0.05)');
  gradGlowAtas.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradGlowAtas;
  ctx.fillRect(0, 0, L, T);

  // 2. Bingkai Vertikal Ganda Emas
  const padLuar = 40;
  ctx.strokeStyle = 'rgba(212, 160, 23, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(padLuar, padLuar, L - padLuar * 2, T - padLuar * 2);

  const padDalam = 52;
  ctx.strokeStyle = 'rgba(212, 160, 23, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(padDalam, padDalam, L - padDalam * 2, T - padDalam * 2);

  // Ornamen 4 Sudut
  ctx.fillStyle = '#FFD15C';
  const sudutStory = [
    [padLuar, padLuar],
    [L - padLuar, padLuar],
    [padLuar, T - padLuar],
    [L - padLuar, T - padLuar]
  ];
  for (const [x, y] of sudutStory) {
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Header Branding Story
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#FFD15C';
  ctx.font = '700 18px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('LOKALOCAL • PASPOR BUDAYA NUSANTARA', L / 2, 135);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '500 15px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('DOKUMEN RESMI PENJELAJAH PERTIWI', L / 2, 168);

  // Garis Emas Halus
  ctx.strokeStyle = 'rgba(212, 160, 23, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(L * 0.25, 195);
  ctx.lineTo(L * 0.75, 195);
  ctx.stroke();
  ctx.restore();

  // 4. Avatar Gatotkaca Chibi Melayang di Tengah
  const avaX = L / 2;
  const avaY = 380;
  const avaR = 125;

  ctx.save();
  const gradAva = ctx.createRadialGradient(avaX, avaY, 20, avaX, avaY, avaR);
  gradAva.addColorStop(0, 'rgba(255, 209, 92, 0.35)');
  gradAva.addColorStop(1, 'rgba(24, 18, 14, 0.9)');
  ctx.fillStyle = gradAva;
  ctx.beginPath();
  ctx.arc(avaX, avaY, avaR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FFD15C';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(avaX, avaY, avaR, 0, Math.PI * 2);
  ctx.stroke();

  // Hiasan Putaran Putus-putus
  ctx.strokeStyle = 'rgba(255, 209, 92, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.arc(avaX, avaY, avaR - 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (gambarMaskot) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avaX, avaY, avaR - 12, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(gambarMaskot, avaX - 110, avaY - 105, 220, 220);
    ctx.restore();
  } else {
    ctx.fillStyle = '#FFD15C';
    ctx.font = '80px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('✦', avaX, avaY + 30);
  }
  ctx.restore();

  // 5. Nama Pengelana & Gelar Kehormatan
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 46px "Fraunces", Georgia, serif';
  ctx.fillText(namaBersih, L / 2, 575);

  // Badge Gelar Pill
  const teksPill = `★ ${gelarInfo.gelar.toUpperCase()} • ${gelarInfo.kicker.toUpperCase()} ★`;
  ctx.font = '700 18px system-ui, -apple-system, sans-serif';
  const lebarPill = ctx.measureText(teksPill).width + 36;
  const tinggiPill = 38;
  const pillX = (L - lebarPill) / 2;
  const pillY = 605;

  ctx.fillStyle = 'rgba(255, 209, 92, 0.18)';
  ctx.strokeStyle = '#FFD15C';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, lebarPill, tinggiPill, 19);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFE082';
  ctx.fillText(teksPill, L / 2, pillY + 25);
  ctx.restore();

  // 6. Angka Heroik Progres: X DARI 38 PROVINSI
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(212, 160, 23, 0.85)';
  ctx.font = '700 16px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('JEJAK WILAYAH TERHIMPUN', L / 2, 705);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 78px "Fraunces", Georgia, serif';
  ctx.fillText(`${formatAngka(totalStempel)}`, L / 2 - 70, 785);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '600 36px "Fraunces", Georgia, serif';
  ctx.fillText(`/ 38`, L / 2 + 50, 785);

  ctx.fillStyle = '#EADBC8';
  ctx.font = '500 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('Provinsi Kepulauan Nusantara Telah Dikoleksi', L / 2, 825);

  // Progres Bar Story
  const barL = 680;
  const barT = 10;
  const barX = (L - barL) / 2;
  const barY = 855;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barL, barT, 5);
  ctx.fill();

  const rasio = Math.min(1, Math.max(0, totalStempel / totalProvinsi));
  ctx.fillStyle = '#FFD15C';
  ctx.beginPath();
  ctx.roundRect(barX, barY, Math.max(12, barL * rasio), barT, 5);
  ctx.fill();
  ctx.restore();

  // 7. Grid Miniatur 38 Stempel Wilayah Nusantara (5 baris x 8 kolom)
  const gridWadahY = 915;
  const kolomGrid = 8;
  const ukuranSlot = 52;
  const gapSlot = 12;
  const totalLebarGrid = kolomGrid * ukuranSlot + (kolomGrid - 1) * gapSlot;
  const startX = (L - totalLebarGrid) / 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '700 14px ui-monospace, monospace';

  for (let i = 0; i < totalProvinsi; i++) {
    const baris = Math.floor(i / kolomGrid);
    const kol = i % kolomGrid;
    const slotX = startX + kol * (ukuranSlot + gapSlot);
    const slotY = gridWadahY + baris * (ukuranSlot + gapSlot);

    const isTerkumpul = i < totalStempel;

    if (isTerkumpul) {
      // Slot Emas Bersinar (Sudah terkumpul)
      ctx.fillStyle = 'rgba(212, 160, 23, 0.25)';
      ctx.strokeStyle = '#FFD15C';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(slotX, slotY, ukuranSlot, ukuranSlot, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFE082';
      ctx.fillText(String(i + 1).padStart(2, '0'), slotX + ukuranSlot / 2, slotY + 32);
    } else {
      // Slot Meredup (Menanti dijelajahi)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(slotX, slotY, ukuranSlot, ukuranSlot, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillText(String(i + 1).padStart(2, '0'), slotX + ukuranSlot / 2, slotY + 32);
    }
  }
  ctx.restore();

  // 8. Cap Segel Resmi Melayang di Bawah Grid
  const segelY = 1350;
  const segelX = L / 2;
  const segelR = 70;

  ctx.save();
  ctx.translate(segelX, segelY);
  ctx.rotate(-0.05);

  ctx.strokeStyle = '#FFD15C';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, segelR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 209, 92, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, segelR - 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#FFD15C';
  ctx.font = '26px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('✦', 0, 8);

  ctx.fillStyle = '#FFD15C';
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.letterSpacing = '1.8px';
  ctx.fillText('TERCATAT RESMI', 0, -22);
  ctx.fillText('PASPOR NUSANTARA', 0, 32);
  ctx.restore();

  // 9. Pesan Filosofis Luhur
  ctx.save();
  ctx.textAlign = 'center';

  const quoteBoxY = 1510;
  const quoteBoxL = 840;
  const quoteBoxX = (L - quoteBoxL) / 2;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = 'rgba(212, 160, 23, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(quoteBoxX, quoteBoxY, quoteBoxL, 140, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFDF8';
  ctx.font = 'italic 23px "Fraunces", Georgia, serif';
  ctx.fillText('"Budaya Indonesia tidak sedikit.', L / 2, quoteBoxY + 52);
  ctx.fillText('Yang sedikit adalah yang sudah tercatat."', L / 2, quoteBoxY + 92);

  ctx.fillStyle = 'rgba(212, 160, 23, 0.85)';
  ctx.font = '500 15px system-ui, sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText('PESAN SOSIAL LOKALOCAL • SPKT KEMENBUD RI', L / 2, quoteBoxY + 122);

  // 10. Footer Watermark & Tanggal
  const tglKini = new Date();
  const formatTgl = tglKini.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 24px "Fraunces", Georgia, serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('lokalocal.id', L / 2, 1750);

  ctx.fillStyle = 'rgba(255, 209, 92, 0.7)';
  ctx.font = '500 15px system-ui, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(`TERBIT PADA ${formatTgl.toUpperCase()}`, L / 2, 1785);
  ctx.restore();
}

/**
 * Membuka Modal Cetak Kartu Pengelana Budaya & Instagram Story.
 */
export async function bukaModalCetakKartu({ pengelolaPaspor, daftarProvinsi = [] }) {
  if (!pengelolaPaspor) return;

  const semuaStempel = pengelolaPaspor.dapatkanSemuaStempel();
  const totalProvinsi = daftarProvinsi.length || 38;
  const jumlahTerkumpul = Object.keys(semuaStempel).length;
  const infoGelar = hitungPeringkatPaspor(jumlahTerkumpul, totalProvinsi);

  const gambarMaskot = await muatGambarGatotkaca();

  let formatAktif = 'lanskap'; // 'lanskap' | 'story'

  let modalEl = document.getElementById('modal-cetak-kartu-paspor');
  if (!modalEl) {
    modalEl = document.createElement('dialog');
    modalEl.id = 'modal-cetak-kartu-paspor';
    modalEl.className = 'modal-kartu-dialog';
    modalEl.innerHTML = `
      <div class="modal-kartu-backdrop" data-aksi="tutup"></div>
      <div class="modal-kartu-wadah" role="dialog" aria-modal="true" aria-label="Cetak Kartu Tanda Pengelana Budaya">
        <div class="modal-kartu-header">
          <div>
            <span class="modal-kartu-kicker">Dokumen Paspor Budaya</span>
            <h3 class="modal-kartu-judul">Kartu Tanda Pengelana Budaya</h3>
          </div>
          <button type="button" class="modal-kartu-tombol-tutup" aria-label="Tutup pratinjau kartu" data-aksi="tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-kartu-body">
          <!-- Pengaturan Nama & Pilihan Format -->
          <div class="modal-kartu-baris-kontrol">
            <div class="modal-kartu-input-grup">
              <label for="input-nama-pengelana" class="modal-kartu-input-label">Nama di Kartu:</label>
              <input
                type="text"
                id="input-nama-pengelana"
                class="modal-kartu-input-teks"
                placeholder="Ketik namamu di sini..."
                maxlength="26"
                value="Pengelana Nusantara"
              />
            </div>

            <!-- Tab Pilihan Rasio Format -->
            <div class="modal-kartu-tab-format" role="radiogroup" aria-label="Pilih format kartu">
              <button type="button" class="kartu-format-tab aktif" data-format="lanskap" role="radio" aria-checked="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
                <span>Kartu Lanskap (1200×675)</span>
              </button>
              <button type="button" class="kartu-format-tab" data-format="story" role="radio" aria-checked="false">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/></svg>
                <span>Instagram Story (9:16)</span>
              </button>
            </div>
          </div>

          <!-- Wadah Preview Kanvas Dinamis -->
          <div class="modal-kartu-kanvas-pembungkus" id="pembungkus-kanvas-kartu">
            <canvas id="kanvas-kartu-pengelana" width="1200" height="675" class="modal-kartu-kanvas"></canvas>
          </div>
        </div>

        <div class="modal-kartu-footer">
          <div class="modal-kartu-footer-info" id="kartu-footer-info">
            Format PNG Resolusi Tinggi (1200×675 px) • Siap Dibagikan
          </div>
          <div class="modal-kartu-footer-aksi">
            <button type="button" class="tombol tombol--garis" data-aksi="tutup">
              Tutup
            </button>
            <button type="button" id="btn-unduh-kartu-png" class="tombol tombol--utama">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span id="btn-unduh-teks">Unduh Kartu PNG</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  const kanvas = modalEl.querySelector('#kanvas-kartu-pengelana');
  const inputNama = modalEl.querySelector('#input-nama-pengelana');
  const btnUnduh = modalEl.querySelector('#btn-unduh-kartu-png');
  const btnUnduhTeks = modalEl.querySelector('#btn-unduh-teks');
  const footerInfo = modalEl.querySelector('#kartu-footer-info');
  const tabs = modalEl.querySelectorAll('.kartu-format-tab');
  const pembungkus = modalEl.querySelector('#pembungkus-kanvas-kartu');

  function gambarUlang() {
    const namaTeks = inputNama ? inputNama.value : 'Pengelana Nusantara';
    if (formatAktif === 'story') {
      pembungkus.classList.add('mode-story');
      gambarKartuInstagramStory({
        kanvas,
        nama: namaTeks,
        semuaStempel,
        totalProvinsi,
        infoGelar,
        gambarMaskot
      });
      if (footerInfo) footerInfo.textContent = 'Format Instagram Story HD (1080×1920 px - Rasio 9:16) • Siap Share';
      if (btnUnduhTeks) btnUnduhTeks.textContent = 'Unduh Story PNG';
    } else {
      pembungkus.classList.remove('mode-story');
      gambarKartuPengelana({
        kanvas,
        nama: namaTeks,
        semuaStempel,
        totalProvinsi,
        infoGelar,
        gambarMaskot
      });
      if (footerInfo) footerInfo.textContent = 'Format Kartu Lanskap (1200×675 px) • Siap Dibagikan';
      if (btnUnduhTeks) btnUnduhTeks.textContent = 'Unduh Kartu PNG';
    }
  }

  // Event Ganti Format Tab
  tabs.forEach(tab => {
    tab.onclick = () => {
      formatAktif = tab.dataset.format;
      tabs.forEach(t => {
        const aktif = t.dataset.format === formatAktif;
        t.classList.toggle('aktif', aktif);
        t.setAttribute('aria-checked', String(aktif));
      });
      gambarUlang();
    };
  });

  if (inputNama) {
    inputNama.oninput = () => {
      gambarUlang();
    };
  }

  modalEl.querySelectorAll('[data-aksi="tutup"]').forEach((btn) => {
    btn.onclick = () => {
      if (modalEl.open) modalEl.close();
      document.body.style.overflow = '';
    };
  });

  modalEl.onclose = () => {
    document.body.style.overflow = '';
  };

  modalEl.oncancel = () => {
    document.body.style.overflow = '';
  };

  if (btnUnduh) {
    btnUnduh.onclick = () => {
      try {
        const link = document.createElement('a');
        const namaFileBersih = (inputNama?.value || 'Pengelana')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-');
        const awalan = formatAktif === 'story' ? 'story-budaya' : 'kartu-pengelana';
        link.download = `${awalan}-${namaFileBersih}.png`;
        link.href = kanvas.toDataURL('image/png');
        link.click();
        tampilkanToast('Gambar berhasil diunduh. Simpan dan bagikan ke Instagram Story atau media sosial!');
      } catch (err) {
        console.error('Gagal mengunduh gambar:', err);
        tampilkanToast('Gagal mengunduh gambar, coba klik kanan dan simpan gambar.');
      }
    };
  }

  modalEl.showModal();
  modalEl.setAttribute('open', '');
  document.body.style.overflow = 'hidden';

  gambarUlang();
}
