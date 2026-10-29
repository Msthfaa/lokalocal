/**
 * pengontrol-rute.js — Pengontrol Antarmuka & Navigasi Sinematik Rute Tematik (Story Trails)
 * Mengelola transisi kamera 3D antar-waypoint cerita, kartu narasi melayang, dan kontrol alur.
 */

import { DAFTAR_RUTE_TEMATIK, dapatkanRuteById } from './rute-tematik.js';
import { bunyikanKendangTak, bunyikanKendangThung, bunyikanGong } from './karawitan-synth.js';
import { tampilkanToast } from '../ui/toast.js';

let ruteAktif = null;
let indeksTitikAktif = 0;
let overlayRuteEl = null;
let modalPemilihEl = null;
let fungsiGerakKamera = null;
let fungsiBukaDetail = null;
let fungsiSorotProvinsi = null;
let fungsiKembalikanSorotan = null;
let fungsiResetKamera = null;

/**
 * Membuka Dialog Pemilih Rute Cerita Tematik.
 */
export function bukaModalPemilihRute(opsi = {}) {
  const { onMulaiRute, gerakkanKamera, bukaDetailProvinsi } = opsi;
  if (gerakkanKamera) fungsiGerakKamera = gerakkanKamera;
  if (bukaDetailProvinsi) fungsiBukaDetail = bukaDetailProvinsi;

  if (!modalPemilihEl) {
    modalPemilihEl = document.createElement('dialog');
    modalPemilihEl.id = 'modal-pemilih-rute-tematik';
    modalPemilihEl.className = 'rute-pemilih-dialog';
    modalPemilihEl.innerHTML = `
      <div class="rute-pemilih-backdrop" data-aksi="tutup"></div>
      <div class="rute-pemilih-wadah" role="dialog" aria-modal="true" aria-label="Pilih Rute Cerita Tematik Nusantara">
        <div class="rute-pemilih-header">
          <div>
            <span class="rute-pemilih-kicker">Penjelajahan Terkurasi</span>
            <h3 class="rute-pemilih-judul">Rute Cerita Tematik</h3>
          </div>
          <button type="button" class="rute-pemilih-btn-tutup" aria-label="Tutup Pemilih Rute" data-aksi="tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p class="rute-pemilih-sub">
          Jelajahi relief kepulauan Indonesia melalui narasi sejarah dan tradisi terpandu. Kamera 3D akan memandu Anda melintasi titik-titik kebudayaan pilihan.
        </p>

        <div class="rute-kartu-daftar">
          ${DAFTAR_RUTE_TEMATIK.map(r => `
            <article class="rute-kartu" data-rute-id="${r.id}">
              <div class="rute-kartu-ikon" style="color: ${r.temaWarna};">
                ${r.ikonSvg}
              </div>
              <div class="rute-kartu-konten">
                <div class="rute-kartu-meta">
                  <span class="rute-kartu-badge">${r.titikKisah.length} Titik Perjalanan</span>
                </div>
                <h4 class="rute-kartu-judul">${r.judul}</h4>
                <p class="rute-kartu-deskripsi">${r.deskripsi}</p>
                <div class="rute-kartu-waypoint-preview">
                  ${r.titikKisah.map(t => `<span class="rute-waypoint-pill">${t.provinsiNama}</span>`).join('')}
                </div>
              </div>
              <button type="button" class="tombol tombol--utama rute-btn-mulai" data-rute-id="${r.id}">
                <span>Mulai Rute</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </article>
          `).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(modalPemilihEl);

    // Event Tutup
    modalPemilihEl.querySelectorAll('[data-aksi="tutup"]').forEach(btn => {
      btn.onclick = () => tutupModalPemilihRute();
    });

    // Event Mulai Rute
    modalPemilihEl.querySelectorAll('.rute-btn-mulai, .rute-kartu').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = el.dataset.ruteId || el.closest('[data-rute-id]')?.dataset.ruteId;
        if (id) {
          tutupModalPemilihRute();
          mulaiRute(id, { gerakkanKamera: fungsiGerakKamera, bukaDetailProvinsi: fungsiBukaDetail });
          if (typeof onMulaiRute === 'function') onMulaiRute(id);
        }
      });
    });
  }

  if (!modalPemilihEl.open) {
    modalPemilihEl.showModal();
  }
}

/**
 * Menutup Dialog Pemilih Rute.
 */
export function tutupModalPemilihRute() {
  if (modalPemilihEl && modalPemilihEl.open) {
    modalPemilihEl.close();
  }
}

/**
 * Memulai Rute Cerita Tematik.
 */
export function mulaiRute(ruteId, opsi = {}) {
  const rute = dapatkanRuteById(ruteId);
  if (!rute) return;

  ruteAktif = rute;
  indeksTitikAktif = 0;
  if (opsi.gerakkanKamera) fungsiGerakKamera = opsi.gerakkanKamera;
  if (opsi.bukaDetailProvinsi) fungsiBukaDetail = opsi.bukaDetailProvinsi;
  if (opsi.sorotProvinsi) fungsiSorotProvinsi = opsi.sorotProvinsi;
  if (opsi.kembalikanSorotan) fungsiKembalikanSorotan = opsi.kembalikanSorotan;
  if (opsi.resetKamera) fungsiResetKamera = opsi.resetKamera;

  bunyikanKendangTak(0.5);
  tampilkanToast(`Memulai rute: ${rute.judul}`);

  bukaOverlayRute();
  perbaruiTampilanTitik();
}

/**
 * Membuka Overlay Navigasi Waypoint Rute di Layar.
 */
function bukaOverlayRute() {
  if (!overlayRuteEl) {
    overlayRuteEl = document.createElement('div');
    overlayRuteEl.id = 'jelajah-rute-overlay';
    overlayRuteEl.className = 'rute-cerita-overlay';
    overlayRuteEl.setAttribute('role', 'region');
    overlayRuteEl.setAttribute('aria-label', 'Navigasi Rute Cerita Tematik 3D');
    document.body.appendChild(overlayRuteEl);
  }
  overlayRuteEl.removeAttribute('hidden');
  overlayRuteEl.style.display = 'flex';
}

/**
 * Memperbarui tampilan waypoint saat kamera berpindah.
 */
function perbaruiTampilanTitik() {
  if (!ruteAktif || !overlayRuteEl) return;

  const titik = ruteAktif.titikKisah[indeksTitikAktif];
  if (!titik) return;

  const totalTitik = ruteAktif.titikKisah.length;
  const isAkhir = indeksTitikAktif === totalTitik - 1;
  const isAwal = indeksTitikAktif === 0;

  overlayRuteEl.innerHTML = `
    <div class="rute-vignette-kartu" role="dialog" aria-modal="false" aria-label="${titik.judulTitik}">
      <div class="rute-vignette-baris-atas">
        <div class="rute-vignette-lencana-grup">
          <span class="rute-vignette-titik-aktif" aria-hidden="true"></span>
          <span class="rute-vignette-tema">${ruteAktif.judul}</span>
          <span class="rute-vignette-langkah">Titik ${titik.urutan} dari ${totalTitik}</span>
        </div>
        <button type="button" class="rute-vignette-btn-keluar" id="rute-btn-keluar" aria-label="Keluar dari Rute">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="rute-vignette-body">
        <div class="rute-vignette-wilayah">${titik.provinsiNama}</div>
        <h3 class="rute-vignette-judul">${titik.judulTitik}</h3>
        <p class="rute-vignette-fokus">Fokus: <strong>${titik.fokusBudaya}</strong></p>
        <p class="rute-vignette-narasi">${titik.narasiKisah}</p>

        <div class="rute-vignette-fakta">
          <span class="rute-vignette-fakta-label">Kilas Sejarah:</span>
          <span class="rute-vignette-fakta-isi">${titik.faktaSejarah}</span>
        </div>
      </div>

      <div class="rute-vignette-footer">
        <div class="rute-vignette-nav-kiri">
          <button type="button" class="tombol tombol--garis rute-nav-btn" id="rute-btn-prev" ${isAwal ? 'disabled style="opacity: 0.35; pointer-events: none;"' : ''}>
            <span>&larr; Sebelumnya</span>
          </button>
          <button type="button" class="tombol tombol--garis rute-nav-btn" id="rute-btn-detail" title="Lihat semua rekaman budaya provinsi ini">
            <span>Buka Provinsi</span>
          </button>
        </div>

        <div class="rute-vignette-nav-kanan">
          <button type="button" class="tombol tombol--utama rute-nav-btn rute-nav-btn--next" id="rute-btn-next">
            <span>${isAkhir ? 'Selesaikan Rute' : 'Titik Berikutnya &rarr;'}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Terbang ke koordinat kamera 3D jika kontrol kamera tersedia
  if (typeof fungsiGerakKamera === 'function' && titik.posisiKamera) {
    fungsiGerakKamera(titik.posisiKamera.pos, titik.posisiKamera.lookAt, 1.8);
  }

  // Timbul & sorot pulau provinsi yang sedang dibahas
  if (typeof fungsiSorotProvinsi === 'function' && titik.provinsiKode) {
    fungsiSorotProvinsi(titik.provinsiKode);
  }

  // Pasang Listener tombol
  const btnKeluar = overlayRuteEl.querySelector('#rute-btn-keluar');
  if (btnKeluar) btnKeluar.onclick = keluarRute;

  const btnPrev = overlayRuteEl.querySelector('#rute-btn-prev');
  if (btnPrev) {
    btnPrev.onclick = () => {
      if (indeksTitikAktif > 0) {
        indeksTitikAktif--;
        bunyikanKendangTak(0.4);
        perbaruiTampilanTitik();
      }
    };
  }

  const btnNext = overlayRuteEl.querySelector('#rute-btn-next');
  if (btnNext) {
    btnNext.onclick = () => {
      if (isAkhir) {
        selesaikanRute();
      } else {
        indeksTitikAktif++;
        bunyikanKendangThung(0.5);
        perbaruiTampilanTitik();
      }
    };
  }

  const btnDetail = overlayRuteEl.querySelector('#rute-btn-detail');
  if (btnDetail && typeof fungsiBukaDetail === 'function') {
    btnDetail.onclick = () => {
      fungsiBukaDetail(titik.provinsiKode);
    };
  }
}

/**
 * Menyelesaikan Rute dengan Apresiasi.
 */
function selesaikanRute() {
  bunyikanGong(0.9);
  tampilkanToast(`Selamat! Anda telah menuntaskan penjelajahan ${ruteAktif?.judul || 'Rute Tematik'}.`);
  keluarRute();
}

/**
 * Keluar dari Rute Tematik dan menutup overlay.
 */
export function keluarRute() {
  ruteAktif = null;
  indeksTitikAktif = 0;
  if (overlayRuteEl) {
    overlayRuteEl.setAttribute('hidden', '');
    overlayRuteEl.style.display = 'none';
  }

  // Kembalikan pulau yang timbul ke elevasi normal
  if (typeof fungsiKembalikanSorotan === 'function') {
    fungsiKembalikanSorotan();
  }

  // Kembalikan POV kamera ke lanskap normal kepulauan Indonesia
  if (typeof fungsiResetKamera === 'function') {
    fungsiResetKamera(1.8);
  }
}
