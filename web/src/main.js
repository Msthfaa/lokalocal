/**
 * main.js — Titik masuk aplikasi web Lokalocal
 * Menginisialisasi sistem desain, navigasi, dialog tentang data, bagian S1–S8,
 * pemuatan modul interaktif secara dinamis (code splitting), dan pemuatan data bertahap.
 */

import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/sections.css';

import { NAMA_SITUS } from './config.js';
import { TEKS } from './content/teks.js';
import { muatDataAwal, jadwalkanMuatDataLengkap } from './data/loader.js';
import { formatAngka } from './util/format.js';
import { segarkanScrollTrigger } from './util/motion.js';
import { inisialisasiNavigasi } from './ui/nav.js';
import { inisialisasiTema } from './ui/tema.js';
import { inisialisasiBacksound } from './ui/audio.js';
import { inisialisasiDialogTentang, inisialisasiDialogTentangKami, perbaruiAtribusiFooter } from './ui/footer.js';
import { tampilkanToast } from './ui/toast.js';
import { inisialisasiTiraiWayang } from './ui/tirai-wayang.js';

import { inisialisasiBagianHero } from './sections/hero.js';
import { inisialisasiBagianNyala } from './sections/nyala.js';
import { inisialisasiBagianKonsentrasi } from './sections/konsentrasi.js';
import { inisialisasiBagianGelap } from './sections/gelap.js';
import { inisialisasiBagianJelajah } from './sections/jelajah.js';
import { inisialisasiBagianKisah } from './sections/kisah.js';

let dialogRekamanKontrol = null;
let janjiDialogRekaman = null;
let kontrolJelajah = null;
let kontrolKisah = null;
let kontrolKuis = null;
let pengelolaPaspor = null;
let dataLengkapCache = null;
let tanggalAmbilCache = null;
const antreanStempel = [];

/**
 * Mengisi elemen teks berdasarkan ID secara aman menggunakan textContent.
 * @param {string} id
 * @param {string} teks
 */
function isiTeks(id, teks) {
  const el = document.getElementById(id);
  if (el) el.textContent = teks;
}

/**
 * Memuat modul dialog detail rekaman secara dinamis saat dibutuhkan.
 */
async function pastikanDialogRekamanSiap() {
  if (dialogRekamanKontrol) return dialogRekamanKontrol;
  if (!janjiDialogRekaman) {
    janjiDialogRekaman = import('./ui/dialog-rekaman.js').then(({ inisialisasiDialogRekaman }) => {
      dialogRekamanKontrol = inisialisasiDialogRekaman();
      if (dialogRekamanKontrol && tanggalAmbilCache) {
        dialogRekamanKontrol.aturTanggalAmbil(tanggalAmbilCache);
      }
      return dialogRekamanKontrol;
    });
  }
  return janjiDialogRekaman;
}

/**
 * Membuka dialog detail rekaman budaya (memuat modulnya bila belum dimuat).
 */
async function bukaDetailRekamanDinamis(rekaman, pemicuEl) {
  const kontrol = await pastikanDialogRekamanSiap();
  if (kontrol) {
    kontrol.bukaRekaman(rekaman, pemicuEl);
  }
}

/**
 * Memuat modul Paspor Budaya, Kuis Interaktif, dan Penutup (S7 & S8) secara dinamis.
 */
async function muatFiturInteraktifS7S8({ provinsi, statistik }) {
  const [
    { buatPengelolaPaspor },
    { inisialisasiBagianPaspor },
    { inisialisasiBagianKuis },
    { inisialisasiBagianPenutup }
  ] = await Promise.all([
    import('./features/paspor.js'),
    import('./sections/paspor.js'),
    import('./sections/kuis.js'),
    import('./sections/penutup.js')
  ]);

  if (!pengelolaPaspor) {
    pengelolaPaspor = buatPengelolaPaspor();
  }

  // Jalankan antrean stempel bila pengguna sempat mengklik provinsi sebelum modul selesai dimuat
  while (antreanStempel.length > 0) {
    const item = antreanStempel.shift();
    pengelolaPaspor.catatStempel(item.kode, item.jenis);
  }

  inisialisasiBagianPaspor({
    daftarProvinsi: provinsi,
    pengelolaPaspor,
    saatKlikPetakProvinsi: (kode) => {
      if (kontrolJelajah) {
        kontrolJelajah.pilihProvinsiDariLuar(kode);
      }
    }
  });

  kontrolKuis = inisialisasiBagianKuis({
    daftarProvinsi: provinsi,
    statistik,
    saatLihatProvinsiDiPeta: (kode) => {
      if (kontrolJelajah) {
        kontrolJelajah.pilihProvinsiDariLuar(kode);
      }
    },
    saatBukaDetailRekaman: (rekaman, pemicuEl) => {
      bukaDetailRekamanDinamis(rekaman, pemicuEl);
    }
  });

  if (dataLengkapCache && kontrolKuis) {
    kontrolKuis.terimaDataLengkap(dataLengkapCache);
  }

  inisialisasiBagianPenutup({
    pengelolaPaspor,
    totalProvinsi: provinsi.length || 38
  });
}

/**
 * Merender data tahap awal ke bagian S1–S8 dan memperbarui atribusi footer.
 */
function renderDataAwalKeHalaman(dataAwal) {
  const { statistik, provinsi = [], meta } = dataAwal;

  // Perbarui atribusi dan tanggal di footer, dialog, serta teks halaman
  perbaruiAtribusiFooter(meta);
  if (meta?.tanggal_ambil_terformat) {
    tanggalAmbilCache = meta.tanggal_ambil_terformat;
    if (dialogRekamanKontrol) {
      dialogRekamanKontrol.aturTanggalAmbil(tanggalAmbilCache);
    }
  }

  const totalProvinsi = (statistik.provinsi_berdata ?? 28) + (statistik.provinsi_belum_tercatat ?? 10);

  // Kartu metrik ringkasan di S1
  isiTeks('metrik-rekaman-bersih', formatAngka(statistik.total_setelah_gabung));
  isiTeks('metrik-rekaman-mentah', formatAngka(statistik.total_rekaman));
  isiTeks(
    'metrik-provinsi-berdata',
    `${formatAngka(statistik.provinsi_berdata)} / ${formatAngka(totalProvinsi)}`
  );
  isiTeks('metrik-provinsi-belum', formatAngka(statistik.provinsi_belum_tercatat));

  const totalOpk = statistik.per_kategori?.OPK ?? 0;
  const totalCagar = statistik.per_kategori?.CB ?? 0;
  isiTeks('metrik-opk-total', formatAngka(totalOpk));
  isiTeks('metrik-cagar-total', formatAngka(totalCagar));

  // Inisialisasi bagian S1 - S6
  inisialisasiBagianHero(dataAwal);
  if (document.getElementById('peta-menyala')) {
    inisialisasiBagianNyala(dataAwal, {
      saatKlikProvinsi: (kode) => {
        if (kontrolJelajah) {
          kontrolJelajah.pilihProvinsiDariLuar(kode);
        } else {
          window.location.href = `./jelajah.html?provinsi=${encodeURIComponent(kode)}`;
        }
      }
    });
  }
  if (document.getElementById('konsentrasi')) {
    inisialisasiBagianKonsentrasi(dataAwal);
  }
  if (document.getElementById('provinsi-gelap')) {
    inisialisasiBagianGelap(dataAwal, {
      saatPilihProvinsiKeJelajah: (kode) => {
        if (kontrolJelajah) {
          kontrolJelajah.pilihProvinsiDariLuar(kode);
        } else {
          window.location.href = `./jelajah.html?provinsi=${encodeURIComponent(kode)}`;
        }
      }
    });
  }

  kontrolJelajah = inisialisasiBagianJelajah(dataAwal, {
    saatBukaDetailRekaman: (rekaman, pemicuEl) => {
      bukaDetailRekamanDinamis(rekaman, pemicuEl);
    },
    saatCatatStempel: (kode, jenis) => {
      if (pengelolaPaspor) {
        pengelolaPaspor.catatStempel(kode, jenis);
      } else {
        antreanStempel.push({ kode, jenis });
      }
    }
  });

  kontrolKisah = inisialisasiBagianKisah({
    saatBukaDetailRekaman: (rekaman, pemicuEl) => {
      bukaDetailRekamanDinamis(rekaman, pemicuEl);
    }
  });

  // Muat fitur S7 & S8 secara dinamis
  muatFiturInteraktifS7S8({ provinsi, statistik });

  // Segarkan perhitungan ScrollTrigger setelah peta dan font terpasang
  segarkanScrollTrigger();
}

/**
 * Menginisialisasi tombol bagikan di bagian penutup (S8).
 */
function inisialisasiTombolBagikan() {
  const tombolBagikan = document.getElementById('tombol-bagikan-halaman');
  if (!tombolBagikan) return;

  tombolBagikan.addEventListener('click', async () => {
    const urlBagikan = window.location.href;
    const dataShare = {
      title: `${NAMA_SITUS} — ${TEKS.s1Pembuka.judul}`,
      text: TEKS.situs.sloganInti,
      url: urlBagikan
    };

    if (navigator.share) {
      try {
        await navigator.share(dataShare);
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(urlBagikan);
      tampilkanToast('Tautan halaman berhasil disalin.');
    } catch {
      tampilkanToast('Salin tautan dari bilah alamat browser kamu.');
    }
  });
}

/**
 * Memulai pemuatan data dan menangani error jaringan/data dengan ramah.
 */
async function jalankanPemuatanData(paksaUlang = false) {
  const bannerError = document.getElementById('banner-error-data');
  const pesanError = document.getElementById('banner-error-pesan');

  if (bannerError) bannerError.hidden = true;

  try {
    const dataAwal = await muatDataAwal(paksaUlang);
    renderDataAwalKeHalaman(dataAwal);

    // Jadwalkan pemuatan data tahap kedua (budaya.clean.json & index-pencarian.json)
    const elemenJelajah = document.getElementById('jelajah');
    jadwalkanMuatDataLengkap(
      elemenJelajah,
      (dataLengkap) => {
        dataLengkapCache = dataLengkap;
        if (kontrolJelajah) {
          kontrolJelajah.terimaDataLengkap(dataLengkap);
        }
        if (kontrolKisah) {
          kontrolKisah.terimaDataLengkap(dataLengkap);
        }
        if (kontrolKuis) {
          kontrolKuis.terimaDataLengkap(dataLengkap);
        }
        // Siapkan modul dialog detail di waktu senggang setelah data lengkap siap
        pastikanDialogRekamanSiap();
        segarkanScrollTrigger();
      },
      (err) => {
        isiTeks(
          's5-ringkasan-hasil',
          `Kendala memuat koleksi lengkap: ${err.message}. Gunakan tombol Coba lagi di bagian atas.`
        );
        if (bannerError && pesanError) {
          pesanError.textContent = err.message;
          bannerError.hidden = false;
        }
      }
    );
  } catch (err) {
    if (bannerError && pesanError) {
      pesanError.textContent = err.message || TEKS.errorData.pesan;
      bannerError.hidden = false;
    }
  }
}

/**
 * Menginisialisasi interaksi kartu Bento Tempat Bersejarah.
 */
function inisialisasiBentoEditorial() {

  const kartuBersejarah = [
    { id: 'kartu-bento-borobudur', query: 'Borobudur' },
    { id: 'kartu-bento-rotterdam', query: 'Rotterdam' },
    { id: 'kartu-bento-mulawarman', query: 'Mulawarman' },
    { id: 'kartu-bento-maimun', query: 'Maimun' },
    { id: 'kartu-bento-kudus', query: 'Kudus' },
  ];

  kartuBersejarah.forEach(({ id, query }) => {
    const el = document.getElementById(id);
    if (el) {
      const navigasi = () => {
        window.location.href = `./jelajah.html?q=${encodeURIComponent(query)}`;
      };
      el.addEventListener('click', navigasi);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigasi();
        }
      });
    }
  });
}

function init() {
  // Pasang Tirai Pembuka Sinematik Wayang Gunungan (Hanya saat awal masuk per sesi)
  inisialisasiTiraiWayang({
    paksaTampil: false,
    onSelesai: () => {
      requestAnimationFrame(() => {
        segarkanScrollTrigger();
      });
    }
  });

  // Ekspos fungsi global untuk memutar ulang pengantar wayang kapan saja bila diinginkan
  window.tontonTiraiWayang = () => {
    inisialisasiTiraiWayang({ paksaTampil: true });
  };

  const btnTontonTirai = document.getElementById('footer-tombol-tonton-tirai');
  if (btnTontonTirai) {
    btnTontonTirai.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.tontonTiraiWayang();
    });
  }

  inisialisasiTema();
  inisialisasiBacksound();

  isiTeks('nav-nama-situs', NAMA_SITUS);
  isiTeks('kicker-s1', NAMA_SITUS);
  isiTeks('footer-judul-situs', NAMA_SITUS);

  const dialogTentang = inisialisasiDialogTentang();
  const dialogTentangKami = inisialisasiDialogTentangKami();

  inisialisasiNavigasi({
    bukaDialogTentang: (pemicu) => dialogTentang.buka(pemicu),
    bukaDialogTentangKami: (pemicu) => dialogTentangKami.buka(pemicu),
    halamanAktif: 'cerita'
  });
  inisialisasiTombolBagikan();
  inisialisasiBentoEditorial();

  const tombolCobaLagi = document.getElementById('tombol-coba-lagi-data');
  if (tombolCobaLagi) {
    tombolCobaLagi.addEventListener('click', () => {
      jalankanPemuatanData(true);
    });
  }

  jalankanPemuatanData(false);
}

init();

