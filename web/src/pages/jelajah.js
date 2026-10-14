/**
 * pages/jelajah.js — Titik masuk halaman khusus Jelajah Budaya 3D (jelajah.html)
 * Menampilkan Peta Diorama 3D Nusantara selayar penuh dengan kontrol HUD mengambang,
 * penancapan panji bendera rincian wilayah, koleksi stempel paspor, dan dialog rekaman.
 */

import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/sections.css';

import { muatDataAwal, jadwalkanMuatDataLengkap } from '../data/loader.js';
import { inisialisasiNavigasi } from '../ui/nav.js';
import { inisialisasiTema } from '../ui/tema.js';
import { inisialisasiBacksound } from '../ui/audio.js';
import { inisialisasiDialogTentang, inisialisasiDialogTentangKami } from '../ui/footer.js';
import { inisialisasiDialogRekaman } from '../ui/dialog-rekaman.js';
import { buatPengelolaPaspor } from '../features/paspor.js';
import { inisialisasiJelajah3D } from '../sections/hero3d/jelajah3d.js';
import { buatProyeksiIndonesia } from '../map/projection.js';
import { apakahBisaMemuat3D } from '../sections/hero3d/fallback.js';
import { renderPetaSvg } from '../map/render.js';
import { pasangInteraksiPeta } from '../map/interactions.js';

let dialogRekamanKontrol = null;
let pengelolaPaspor = null;
let kontroler3D = null;

async function mulaiHalamanJelajah() {
  inisialisasiTema();
  inisialisasiBacksound();

  const dialogTentangKontrol = inisialisasiDialogTentang();
  const dialogTentangKamiKontrol = inisialisasiDialogTentangKami();

  inisialisasiNavigasi({
    bukaDialogTentang: (pemicu) => {
      if (dialogTentangKontrol) dialogTentangKontrol.buka(pemicu);
    },
    bukaDialogTentangKami: (pemicu) => {
      if (dialogTentangKamiKontrol) dialogTentangKamiKontrol.buka(pemicu);
    },
    halamanAktif: 'jelajah'
  });

  // Tombol Tentang Data pada HUD Kiri Bawah
  const btnTentangHud = document.getElementById('hud-tombol-tentang');
  if (btnTentangHud && dialogTentangKontrol) {
    btnTentangHud.addEventListener('click', (e) => {
      dialogTentangKontrol.buka(e.currentTarget);
    });
  }

  dialogRekamanKontrol = inisialisasiDialogRekaman();
  pengelolaPaspor = buatPengelolaPaspor();

  const wadahPeta = document.getElementById('s5-peta-wadah');

  try {
    const dataAwal = await muatDataAwal();
    const { provinsi, geoProvinsi, meta } = dataAwal;

    if (dialogRekamanKontrol && meta?.tanggal_ambil_terformat) {
      dialogRekamanKontrol.aturTanggalAmbil(meta.tanggal_ambil_terformat);
    }

    const proyeksi = buatProyeksiIndonesia(geoProvinsi);

    // Periksa apakah perangkat mendukung 3D WebGL
    if (apakahBisaMemuat3D() && wadahPeta) {
      kontroler3D = inisialisasiJelajah3D({
        wadahEl: wadahPeta,
        geoProvinsi,
        daftarProvinsi: provinsi,
        daftarBudaya: [],
        proyeksi,
        saatPilihProvinsi: (kode) => {
          // Logika tambahan bila diperlukan
        },
        onBukaDetailRekaman: (rekaman, pemicuEl) => {
          if (dialogRekamanKontrol) {
            dialogRekamanKontrol.bukaRekaman(rekaman, pemicuEl);
          }
        },
        onCatatStempel: (kode, jenis) => {
          if (pengelolaPaspor) {
            pengelolaPaspor.catatStempel(kode, jenis);
          }
        }
      });

      // Hubungkan tombol Floating HUD
      pasangKontrolHud(kontroler3D);
    } else if (wadahPeta && geoProvinsi) {
      // Fallback 2D bila WebGL tidak didukung
      wadahPeta.classList.add('is-fallback-2d');
      const instans2D = renderPetaSvg(wadahPeta, {
        geoProvinsi,
        daftarProvinsi: provinsi,
        idUnik: 'jelajah-full-2d',
        modeAwal: 'jumlah',
        interaktif: true
      });
      pasangInteraksiPeta(instans2D, {
        saatPilihProvinsi: (kode) => {
          // Buka paspor stempel
          if (pengelolaPaspor) pengelolaPaspor.catatStempel(kode, 'biasa');
        }
      });
    }

    // Jadwalkan pemuatan data lengkap (budaya.clean.json) secara asinkron
    jadwalkanMuatDataLengkap(
      null,
      ({ budaya }) => {
        if (kontroler3D && typeof kontroler3D.aturDaftarBudaya === 'function') {
          kontroler3D.aturDaftarBudaya(budaya);
        }
      },
      (err) => {
        console.warn('Gagal memuat katalog lengkap untuk kartu bendera:', err);
      }
    );

  } catch (err) {
    console.error('Gagal memuat data awal jelajah 3D:', err);
    const bannerError = document.getElementById('banner-error-data');
    if (bannerError) {
      bannerError.hidden = false;
      bannerError.style.display = 'flex';
    }
  }
}

/**
 * Memasang interaksi tombol-tombol pada Floating HUD
 * @param {object} kontroler
 */
function pasangKontrolHud(kontroler) {
  if (!kontroler) return;

  const btnZoomIn = document.getElementById('hud-zoom-in');
  const btnZoomOut = document.getElementById('hud-zoom-out');
  const btnZoomReset = document.getElementById('hud-zoom-reset');
  const btnResetPutar = document.getElementById('hud-reset-putar');
  const btnModeWarna = document.getElementById('hud-mode-warna');
  const labelModeWarna = document.getElementById('hud-mode-warna-label');

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => kontroler.zoomIn());
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => kontroler.zoomOut());
  }

  if (btnZoomReset) {
    btnZoomReset.addEventListener('click', () => kontroler.zoomReset());
  }

  if (btnResetPutar) {
    btnResetPutar.addEventListener('click', () => kontroler.resetRotasi());
  }

  if (btnModeWarna) {
    btnModeWarna.addEventListener('click', () => {
      const modeBaru = kontroler.toggleModeWarna();
      if (labelModeWarna) {
        labelModeWarna.textContent = modeBaru === 'natural' ? 'Warna Alami' : 'Data OPK';
      }
      btnModeWarna.classList.toggle('is-mode-data', modeBaru === 'data');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mulaiHalamanJelajah);
} else {
  mulaiHalamanJelajah();
}
