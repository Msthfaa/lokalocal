/**
 * paspor-canvas.js — Generator Cetak Kartu Pengelana Budaya Nusantara (HTML5 Canvas PNG)
 * Memungkinkan pengunjung mengukir nama mereka pada Kartu Tanda Pengelana Budaya resolusi tinggi,
 * lengkap dengan gelar penjelajah, jumlah stempel provinsi, segel wax resmi, dan maskot Gatotkaca.
 * 100% Client-side, tanpa dependensi server atau library gambar eksternal.
 */

import { formatAngka } from '../util/format.js';
import { tampilkanToast } from '../ui/toast.js';

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
 * Merender Kartu Pengelana Budaya ke dalam elemen Canvas HTML5.
 *
 * @param {object} parameter
 * @param {HTMLCanvasElement} parameter.kanvas
 * @param {string} [parameter.nama='Pengelana Nusantara']
 * @param {object} parameter.semuaStempel - Objek stempel dari localStorage
 * @param {number} [parameter.totalProvinsi=38]
 * @param {object} parameter.infoGelar - { gelar, tingkat, deskripsi }
 * @param {Image|null} [parameter.gambarMaskot=null]
 */
export function gambarKartuPengelana({
  kanvas,
  nama = 'Pengelana Nusantara',
  semuaStempel = {},
  totalProvinsi = 38,
  infoGelar = { gelar: 'Pengembara Tradisi', tingkat: 'Level 1' },
  gambarMaskot = null
}) {
  const ctx = kanvas.getContext('2d');
  const L = kanvas.width;   // 1200 px
  const T = kanvas.height;  // 675 px

  const stempelArr = Object.keys(semuaStempel);
  const totalStempel = stempelArr.length;
  const namaBersih = (nama || 'Pengelana Nusantara').trim() || 'Pengelana Nusantara';

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

  // Sudut Ornamen Tenun (Corner Accents)
  const ukuranSudut = 20;
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

  // 3. Header Kartu (Lambang Surya Nusantara & Judul Resmi)
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

  // Aura Lingkaran
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

  // Render Gambar Gatotkaca atau Cadangan Ikon Bintang
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
    ctx.fillText('⚡', avatarX, avatarY + 22);
  }

  // Label Lencana Bawah Avatar
  ctx.fillStyle = '#FFD15C';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1px';
  ctx.fillText('KSATRIA BUDAYA', avatarX, avatarY + avatarR + 24);
  ctx.restore();

  // 5. Panel Tengah: Informasi Pengelana & Gelar Kehormatan
  const infoX = 350;
  const barisY = 210;

  // Nama Pengelana
  ctx.fillStyle = 'rgba(212, 160, 23, 0.85)';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('NAMA PENJELAJAH', infoX, barisY);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 32px "Fraunces", Georgia, serif';
  ctx.fillText(namaBersih, infoX, barisY + 36);

  // Gelar & Tingkat
  ctx.fillStyle = 'rgba(212, 160, 23, 0.85)';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('GELAR KEHORMATAN', infoX, barisY + 86);

  // Lencana Gelar
  ctx.fillStyle = '#FFBE3B';
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${infoGelar.gelar} • ${infoGelar.tingkat}`, infoX, barisY + 116);

  // Statistik Wilayah
  ctx.fillStyle = 'rgba(212, 160, 23, 0.85)';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('JEJAK WILAYAH TERHIMPUN', infoX, barisY + 166);

  ctx.fillStyle = '#F5F0EB';
  ctx.font = '700 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${formatAngka(totalStempel)} dari ${formatAngka(totalProvinsi)} Provinsi`, infoX, barisY + 196);

  // Progres Bar Visual di Kartu
  const barLebar = 460;
  const barTinggi = 8;
  const barY = barisY + 210;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(infoX, barY, barLebar, barTinggi);

  const rasio = Math.min(1, Math.max(0, totalStempel / totalProvinsi));
  ctx.fillStyle = '#D4A017';
  ctx.fillRect(infoX, barY, barLebar * rasio, barTinggi);

  // Nomor Seri Registrasi Unik
  const tglKini = new Date();
  const formatTgl = tglKini.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const hashReg = `LKLC-${tglKini.getFullYear()}-${String(totalStempel).padStart(2, '0')}${Math.abs(namaBersih.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 9000 + 1000)}`;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '500 13px ui-monospace, monospace';
  ctx.fillText(`NO. REG: ${hashReg}   |   TERBIT: ${formatTgl}`, infoX, barisY + 246);

  // 6. Panel Kanan: Cap Segel Timbul Resmi (Official Seal)
  const segelX = 980;
  const segelY = 320;
  const segelR = 76;

  ctx.save();
  ctx.translate(segelX, segelY);
  ctx.rotate(-0.08); // Sedikit miring alami seperti cap lilin/stempel nyata

  // Lingkaran Cap
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

  // Bintang Segi 8 di Tengah
  ctx.fillStyle = '#FFD15C';
  ctx.font = '28px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('✪', 0, 10);

  // Teks Melingkar / Teks Cap
  ctx.fillStyle = '#FFD15C';
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText('TERCATAT RESMI', 0, -22);
  ctx.fillText('SPKT KEMENBUD', 0, 32);

  ctx.restore();

  // 7. Footer Kartu (Pesan Sosial & Atribusi)
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
 * Membuka Modal Cetak Kartu Pengelana Budaya.
 *
 * @param {object} parameter
 * @param {object} parameter.pengelolaPaspor
 * @param {Array} [parameter.daftarProvinsi=[]]
 */
export async function bukaModalCetakKartu({ pengelolaPaspor, daftarProvinsi = [] }) {
  if (!pengelolaPaspor) return;

  const semuaStempel = pengelolaPaspor.dapatkanSemuaStempel();
  const totalProvinsi = daftarProvinsi.length || 38;
  const jumlahTerkumpul = Object.keys(semuaStempel).length;

  // Hitung gelar
  let gelar = 'Penjelajah Mula';
  let tingkat = 'Level 1';
  if (jumlahTerkumpul >= 38) {
    gelar = 'Kurator Agung Nusantara';
    tingkat = 'Level 5 (Paripurna)';
  } else if (jumlahTerkumpul >= 25) {
    gelar = 'Penjaga Narasi Nusantara';
    tingkat = 'Level 4';
  } else if (jumlahTerkumpul >= 10) {
    gelar = 'Perekam Jejak Budaya';
    tingkat = 'Level 3';
  } else if (jumlahTerkumpul >= 1) {
    gelar = 'Pengembara Tradisi';
    tingkat = 'Level 2';
  }

  const infoGelar = { gelar, tingkat };

  // Ambil gambar Gatotkaca
  const gambarMaskot = await muatGambarGatotkaca();

  // Cek apakah dialog sudah ada
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
          <div class="modal-kartu-input-baris">
            <label for="input-nama-pengelana" class="modal-kartu-input-label">Nama di Kartu:</label>
            <input
              type="text"
              id="input-nama-pengelana"
              class="modal-kartu-input-teks"
              placeholder="Ketik namamu di sini..."
              maxlength="28"
              value="Pengelana Nusantara"
            />
          </div>

          <div class="modal-kartu-kanvas-pembungkus">
            <canvas id="kanvas-kartu-pengelana" width="1200" height="675" class="modal-kartu-kanvas"></canvas>
          </div>
        </div>

        <div class="modal-kartu-footer">
          <div class="modal-kartu-footer-info">
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
              <span>Unduh Kartu PNG</span>
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

  function gambarUlang() {
    gambarKartuPengelana({
      kanvas,
      nama: inputNama ? inputNama.value : 'Pengelana Nusantara',
      semuaStempel,
      totalProvinsi,
      infoGelar,
      gambarMaskot
    });
  }

  // Event Input real-time
  if (inputNama) {
    inputNama.oninput = () => {
      gambarUlang();
    };
  }

  // Event Tutup
  modalEl.querySelectorAll('[data-aksi="tutup"]').forEach((btn) => {
    btn.onclick = () => {
      modalEl.removeAttribute('open');
      modalEl.close();
      document.body.style.overflow = '';
    };
  });

  // Event Unduh PNG
  if (btnUnduh) {
    btnUnduh.onclick = () => {
      try {
        const link = document.createElement('a');
        const namaFileBersih = (inputNama?.value || 'Pengelana')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-');
        link.download = `kartu-pengelana-${namaFileBersih}.png`;
        link.href = kanvas.toDataURL('image/png');
        link.click();
        tampilkanToast('Kartu Pengelana Budaya berhasil diunduh! Simpan dan bagikan kebanggaanmu 🪪✨');
      } catch (err) {
        console.error('Gagal mengunduh kartu:', err);
        tampilkanToast('Gagal mengunduh kartu, coba klik kanan dan simpan gambar.');
      }
    };
  }

  // Tampilkan Modal
  modalEl.showModal();
  modalEl.setAttribute('open', '');
  document.body.style.overflow = 'hidden';

  // Render awal
  gambarUlang();
}
