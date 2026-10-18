/**
 * pages/kuis.js — Titik masuk halaman khusus Kuis Budaya Nusantara (kuis.html)
 * Menampilkan arena kuis interaktif 5 soal acak berbasis data resmi SPKT.
 */

import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/sections.css';

import { muatDataAwal, muatDataLengkap } from '../data/loader.js';
import { inisialisasiNavigasi } from '../ui/nav.js';
import { inisialisasiTema } from '../ui/tema.js';
import { inisialisasiBacksound } from '../ui/audio.js';
import { inisialisasiDialogTentang, inisialisasiDialogTentangKami, perbaruiAtribusiFooter } from '../ui/footer.js';
import { inisialisasiBagianKuis } from '../sections/kuis.js';
import { inisialisasiDialogRekaman } from '../ui/dialog-rekaman.js';

let dialogRekamanKontrol = null;

async function mulaiHalamanKuis() {
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
    halamanAktif: 'kuis'
  });

  dialogRekamanKontrol = inisialisasiDialogRekaman();

  try {
    const dataAwal = await muatDataAwal();
    const { statistik, provinsi, meta } = dataAwal;

    if (dialogRekamanKontrol && meta?.tanggal_ambil_terformat) {
      dialogRekamanKontrol.aturTanggalAmbil(meta.tanggal_ambil_terformat);
    }

    perbaruiAtribusiFooter(meta);

    const kontrolKuis = inisialisasiBagianKuis({
      daftarProvinsi: provinsi,
      statistik,
      saatLihatProvinsiDiPeta: (kode) => {
        window.location.href = `./jelajah.html#provinsi-${kode}`;
      },
      saatBukaDetailRekaman: (rekaman, pemicuEl) => {
        if (dialogRekamanKontrol) {
          dialogRekamanKontrol.bukaRekaman(rekaman, pemicuEl);
        }
      }
    });

    // Pemuatan data budaya lengkap untuk bank soal 205 tradisi nyata
    muatDataLengkap()
      .then(({ budaya }) => {
        if (kontrolKuis && budaya) {
          kontrolKuis.terimaDataLengkap({ budaya });
        }
      })
      .catch((err) => {
        console.warn('Peringatan memuat katalog lengkap kuis:', err);
      });

    // Hubungkan tombol pill wilayah ke kontrol kuis
    const daftarPills = document.querySelectorAll('.kuis-wilayah-pill');
    daftarPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const kategori = pill.dataset.kategori;
        if (!kategori || !kontrolKuis) return;
        kontrolKuis.aturWilayah(kategori);

        const panelKuis = document.getElementById('s7-panel-kuis');
        if (panelKuis) {
          panelKuis.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });

    // Tangani parameter URL jika ada (misal ?topik=sumatera)
    const params = new URLSearchParams(window.location.search);
    const topikUrl = params.get('topik') || params.get('kategori');
    if (topikUrl && kontrolKuis) {
      kontrolKuis.aturWilayah(topikUrl);
    }
  } catch (err) {
    console.error('Gagal memuat data kuis:', err);
    const bannerError = document.getElementById('banner-error-data');
    if (bannerError) bannerError.hidden = false;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mulaiHalamanKuis);
} else {
  mulaiHalamanKuis();
}
