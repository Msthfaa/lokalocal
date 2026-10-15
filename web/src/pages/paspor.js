/**
 * pages/paspor.js — Titik masuk halaman khusus Paspor Budaya Nusantara (paspor.html)
 * Menampilkan buku paspor, 38 stempel provinsi, lencana penjelajah, dan stempel penjaga data.
 */

import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/sections.css';

import { muatDataAwal } from '../data/loader.js';
import { inisialisasiNavigasi } from '../ui/nav.js';
import { inisialisasiDialogTentang, perbaruiAtribusiFooter } from '../ui/footer.js';
import { buatPengelolaPaspor } from '../features/paspor.js';
import { inisialisasiBagianPaspor } from '../sections/paspor.js';

async function mulaiHalamanPaspor() {
  const dialogTentangKontrol = inisialisasiDialogTentang();

  inisialisasiNavigasi({
    bukaDialogTentang: (pemicu) => {
      if (dialogTentangKontrol) dialogTentangKontrol.buka(pemicu);
    },
    halamanAktif: 'paspor'
  });

  const pengelolaPaspor = buatPengelolaPaspor();

  try {
    const dataAwal = await muatDataAwal();
    const { provinsi, meta } = dataAwal;

    perbaruiAtribusiFooter(meta);

    inisialisasiBagianPaspor({
      daftarProvinsi: provinsi,
      pengelolaPaspor,
      saatKlikPetakProvinsi: (kode) => {
        // Alihkan ke halaman jelajah dengan hash kode provinsi
        window.location.href = `./jelajah.html#provinsi-${kode}`;
      }
    });
  } catch (err) {
    console.error('Gagal memuat data paspor:', err);
    const bannerError = document.getElementById('banner-error-data');
    if (bannerError) bannerError.hidden = false;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mulaiHalamanPaspor);
} else {
  mulaiHalamanPaspor();
}
