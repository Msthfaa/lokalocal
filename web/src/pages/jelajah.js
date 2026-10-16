/**
 * pages/jelajah.js — Titik masuk halaman khusus Jelajah Budaya 3D (jelajah.html)
 * Menampilkan Peta Diorama 3D Nusantara selayar penuh dengan kontrol HUD mengambang,
 * penancapan panji bendera rincian wilayah, koleksi stempel paspor, dan dialog rekaman.
 */

import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/sections.css';

import { muatDataAwal, muatDataLengkap, jadwalkanMuatDataLengkap } from '../data/loader.js';
import { inisialisasiNavigasi } from '../ui/nav.js';
import { inisialisasiTema, ambilTemaSaatIni } from '../ui/tema.js';
import { inisialisasiBacksound } from '../ui/audio.js';
import { inisialisasiDialogTentang, inisialisasiDialogTentangKami, perbaruiAtribusiFooter } from '../ui/footer.js';
import { inisialisasiDialogRekaman } from '../ui/dialog-rekaman.js';
import { buatPengelolaPaspor } from '../features/paspor.js';
import { inisialisasiJelajah3D } from '../sections/hero3d/jelajah3d.js';
import { buatProyeksiIndonesia } from '../map/projection.js';
import { apakahBisaMemuat3D } from '../sections/hero3d/fallback.js';
import { renderPetaSvg } from '../map/render.js';
import { pasangInteraksiPeta } from '../map/interactions.js';
import { inisialisasiLoaderLucu } from '../ui/loader-lucu.js';

let dialogRekamanKontrol = null;
let pengelolaPaspor = null;
let kontroler3D = null;

async function mulaiHalamanJelajah() {
  inisialisasiTema();
  inisialisasiBacksound();

  // Sinkronisasi tema awal dengan pilihan pengguna di navbar
  const temaAwal = ambilTemaSaatIni();
  const adalahSiangAwal = temaAwal === 'terang';
  document.body.classList.toggle('tema-siang', adalahSiangAwal);
  document.body.classList.toggle('tema-malam', !adalahSiangAwal);

  // Dengarkan perubahan tema dari tombol bulan/matahari di navbar
  window.addEventListener('lokalocal-ganti-tema', (e) => {
    const temaKini = e.detail?.tema;
    const adalahSiang = temaKini === 'terang';
    document.body.classList.toggle('tema-siang', adalahSiang);
    document.body.classList.toggle('tema-malam', !adalahSiang);
    if (kontroler3D && typeof kontroler3D.aturModeWaktu === 'function') {
      kontroler3D.aturModeWaktu(adalahSiang ? 'siang' : 'malam');
    }
  });

  // Cek apakah Peta 3D sudah pernah dimuat di sesi kunjungan ini
  const KUNCI_SESI_PETA3D = 'lokalocal_peta3d_dimuat';
  let peta3dSudahDimuat = false;
  try {
    peta3dSudahDimuat = sessionStorage.getItem(KUNCI_SESI_PETA3D) === 'true';
  } catch {
    // Abaikan
  }

  const paksaLoader =
    typeof window !== 'undefined' &&
    window.location &&
    (window.location.search.includes('loader=1') || window.location.search.includes('reset=1'));

  const lewatiLoader = peta3dSudahDimuat && !paksaLoader;

  // Tampilkan layar muat interaktif & animasi lucu Nusantara (hanya saat pertama kali di sesi ini)
  const loaderLucu = inisialisasiLoaderLucu(document.body, { lewati: lewatiLoader });
  if (!lewatiLoader) {
    loaderLucu.aturProgres(18, 'Membaca arsip kebudayaan Nusantara...');
  }

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
    loaderLucu.aturProgres(48, 'Menyusun koordinat batas 38 provinsi...');
    const { provinsi, geoProvinsi, meta } = dataAwal;

    if (dialogRekamanKontrol && meta?.tanggal_ambil_terformat) {
      dialogRekamanKontrol.aturTanggalAmbil(meta.tanggal_ambil_terformat);
    }

    perbaruiAtribusiFooter(meta);

    const proyeksi = buatProyeksiIndonesia(geoProvinsi);
    loaderLucu.aturProgres(72, 'Membangkitkan relief 3D & menyiapkan kapal Pinisi...');

    // Prioritaskan inisialisasi Peta Diorama 3D Nusantara
    if (wadahPeta) {
      kontroler3D = inisialisasiJelajah3D({
        wadahEl: wadahPeta,
        geoProvinsi,
        daftarProvinsi: provinsi,
        daftarBudaya: [],
        proyeksi,
        saatPilihProvinsi: (kode) => {
          // Logika tambahan bila diperlukan
        },
        onZoomUbah: (persen) => {
          const btnReset = document.getElementById('hud-zoom-reset');
          if (btnReset) {
            btnReset.textContent = `${persen}%`;
            btnReset.setAttribute('title', `Atur Ulang Zoom Kamera (Sekarang ${persen}%)`);
          }
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
    }

    if (kontroler3D) {
      if (typeof kontroler3D.aturModeWaktu === 'function') {
        kontroler3D.aturModeWaktu(adalahSiangAwal ? 'siang' : 'malam');
      }
      // Peta 3D berhasil aktif: pasang interaksi Floating HUD
      pasangKontrolHud(kontroler3D);
    } else if (wadahPeta && geoProvinsi) {
      // Fallback 2D hanya jika browser/perangkat benar-benar tidak mendukung WebGL
      wadahPeta.classList.add('is-fallback-2d');

      // Sesuaikan HUD agar tidak menampilkan kontrol 3D yang tidak relevan
      const hudKanan = document.querySelector('.jelajah-hud-kanan-bawah');
      if (hudKanan) hudKanan.style.display = 'none';

      const hudPetunjuk = document.querySelector('.hud-pill-petunjuk');
      if (hudPetunjuk) {
        hudPetunjuk.innerHTML = `
          <span class="hud-titik-aktif"></span>
          <strong>Mode Ringan (2D)</strong> &bull; Klik provinsi untuk menandai paspor budaya
        `;
      }

      const instans2D = renderPetaSvg(wadahPeta, {
        geoProvinsi,
        daftarProvinsi: provinsi,
        idUnik: 'jelajah-full-2d',
        modeAwal: 'jumlah',
        interaktif: true
      });
      pasangInteraksiPeta(instans2D, {
        saatPilihProvinsi: (kode) => {
          if (pengelolaPaspor) pengelolaPaspor.catatStempel(kode, 'biasa');
        }
      });
    }

    // Tuntaskan layar muat lucu secara halus
    if (!lewatiLoader) {
      loaderLucu.aturProgres(92, 'Menyalakan lentera laut & mengibarkan bendera...');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          loaderLucu.selesai('Nusantara sudah matang dan siap dijelajahi! Selamat berlayar ⛵✨');

          // Memicu kemunculan dramatis 38 pulau satu per satu membal dari tengah nusantara
          if (kontroler3D && typeof kontroler3D.mulaiAnimasiMasuk === 'function') {
            setTimeout(() => {
              kontroler3D.mulaiAnimasiMasuk();
            }, 450);
          }
        });
      });
    } else {
      loaderLucu.selesai();
      if (kontroler3D && typeof kontroler3D.mulaiAnimasiMasuk === 'function') {
        setTimeout(() => {
          kontroler3D.mulaiAnimasiMasuk();
        }, 120);
      }
    }

    // Muat data lengkap (budaya.clean.json) secara langsung untuk kartu bendera & tradisi
    muatDataLengkap()
      .then(({ budaya }) => {
        if (kontroler3D && typeof kontroler3D.aturDaftarBudaya === 'function') {
          kontroler3D.aturDaftarBudaya(budaya);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat katalog lengkap untuk kartu bendera:', err);
      });

  } catch (err) {
    console.error('Gagal memuat data awal jelajah 3D:', err);
    loaderLucu.selesai('Terjadi kendala saat membaca data');
    const bannerError = document.getElementById('banner-error-data');
    if (bannerError) {
      bannerError.hidden = false;
      bannerError.style.display = 'flex';
    }
  }
}

/**
 * Memasang interaksi tombol-tombol pada Floating HUD Zoom
 * @param {object} kontroler
 */
function pasangKontrolHud(kontroler) {
  if (!kontroler) return;

  const btnZoomIn = document.getElementById('hud-zoom-in');
  const btnZoomOut = document.getElementById('hud-zoom-out');
  const btnZoomReset = document.getElementById('hud-zoom-reset');
  const btnResetPutar = document.getElementById('hud-reset-putar');

  function perbaruiLabelZoom(persen) {
    if (btnZoomReset) {
      const nilaiPersen = typeof persen === 'number' ? persen : (kontroler.getZoomPersen ? kontroler.getZoomPersen() : 100);
      btnZoomReset.textContent = `${nilaiPersen}%`;
      btnZoomReset.setAttribute('title', `Atur Ulang Zoom Kamera (Sekarang ${nilaiPersen}%)`);
    }
  }

  // Inisialisasi teks zoom awal (100%)
  perbaruiLabelZoom();

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      const p = kontroler.zoomIn();
      perbaruiLabelZoom(p);
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      const p = kontroler.zoomOut();
      perbaruiLabelZoom(p);
    });
  }

  if (btnZoomReset) {
    btnZoomReset.addEventListener('click', () => {
      const p = kontroler.zoomReset();
      perbaruiLabelZoom(p);
    });
  }

  if (btnResetPutar) {
    btnResetPutar.addEventListener('click', () => kontroler.resetRotasi());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mulaiHalamanJelajah);
} else {
  mulaiHalamanJelajah();
}
