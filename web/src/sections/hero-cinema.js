/**
 * hero-cinema.js — Pengontrol latar belakang sinematik berputar (video-like slideshow)
 * Menampilkan ragam destinasi wisata alam dan mahakarya budaya Nusantara
 * Berpindah otomatis setiap 5 detik sekali dengan transisi halus dan efek Ken Burns.
 */

export const DESTINASI_NUSANTARA = [
  {
    id: 'borobudur',
    judul: 'Candi Borobudur',
    wilayah: 'Magelang, Jawa Tengah',
    kategori: 'Cagar Budaya Dunia UNESCO',
    deskripsi: 'Mahakarya arsitektur batu terbesar di dunia yang dibangun abad ke-8 di tengah kabut fajar Menoreh.',
    gambar: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=1920&q=80',
    warnaAksen: '#E6A23C'
  },
  {
    id: 'raja-ampat',
    judul: 'Kepulauan Raja Ampat',
    wilayah: 'Papua Barat Daya',
    kategori: 'Keajaiban Alam Bahari Tropis',
    deskripsi: 'Gugusan pulau karst zamrud dan suaka keanekaragaman hayati terumbu karang terkaya di dunia.',
    gambar: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1920&q=80',
    warnaAksen: '#20B2AA'
  },
  {
    id: 'bromo',
    judul: 'Gunung Bromo & Tengger',
    wilayah: 'Probolinggo, Jawa Timur',
    kategori: 'Wisata Alam & Adat Ritus Kasada',
    deskripsi: 'Kaldera vulkanik megah dan pusat perayaan adat suci Yadnya Kasada masyarakat suku Tengger.',
    gambar: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1920&q=80',
    warnaAksen: '#E76F51'
  },
  {
    id: 'prambanan',
    judul: 'Candi Prambanan',
    wilayah: 'Sleman, D.I. Yogyakarta',
    kategori: 'Cagar Budaya & Seni Pertunjukan',
    deskripsi: 'Kompleks candi Hindu terindah di Asia Tenggara, panggung abadi epik Sendratari Ramayana.',
    gambar: 'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?auto=format&fit=crop&w=1920&q=80',
    warnaAksen: '#D4A373'
  },
  {
    id: 'padar',
    judul: 'Pulau Padar & Labuan Bajo',
    wilayah: 'Manggarai Barat, NTT',
    kategori: 'Taman Nasional Komodo',
    deskripsi: 'Panorama perbukitan sabana eksotis yang memeluk tiga lekukan teluk berpasir warna-warni.',
    gambar: 'https://images.unsplash.com/photo-1505993597083-3bd19fb75e57?auto=format&fit=crop&w=1920&q=80',
    warnaAksen: '#2A9D8F'
  },
  {
    id: 'toraja',
    judul: 'Desa Adat Kete Kesu',
    wilayah: 'Tana Toraja, Sulawesi Selatan',
    kategori: 'Adat Ritus & Rumah Tongkonan',
    deskripsi: 'Perkampungan megalitikum Toraja dengan deretan atap perahu melengkung dan ritus sakral leluhur.',
    gambar: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=1920&q=80',
    warnaAksen: '#C77DFF'
  },
  {
    id: 'toba',
    judul: 'Danau Toba & Kaldera Samosir',
    wilayah: 'Sumatera Utara',
    kategori: 'Geopark Global UNESCO & Budaya Batak',
    deskripsi: 'Danau kaldera supervulkan terbesar di dunia, persemayaman tradisi dan tenun pusaka Ulos Batak.',
    gambar: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1920&q=80',
    warnaAksen: '#457B9D'
  },
  {
    id: 'ulun-danu',
    judul: 'Pura Ulun Danu Beratan',
    wilayah: 'Bedugul, Tabanan, Bali',
    kategori: 'Harmoni Alam & Sistem Subak UNESCO',
    deskripsi: 'Pura air suci di tepi danau kawah pegunungan yang melambangkan kesuburan dan kearifan Subak.',
    gambar: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=80',
    warnaAksen: '#588157'
  }
];

/**
 * Menginisialisasi slider latar belakang sinematik (video-like) di elemen wadah hero.
 * Berpindah otomatis setiap 5 detik tanpa jeda hover.
 *
 * @param {HTMLElement} wadahEl - Wadah elemen latar pembuka
 * @returns {{ jeda: () => void, lanjut: () => void, keSlide: (index: number) => void }}
 */
export function inisialisasiHeroCinema(wadahEl) {
  if (!wadahEl) return null;

  // Bersihkan isi wadah sebelumnya
  wadahEl.innerHTML = '';
  wadahEl.classList.add('hero-cinema-wadah');

  // Wadah lapisan slide gambar
  const wadahSlide = document.createElement('div');
  wadahSlide.className = 'hero-cinema-lapisan-slide';
  wadahSlide.setAttribute('aria-hidden', 'true');

  // Lapisan overlay gradien gelap agar teks di atasnya selalu tajam & terbaca (WCAG AA)
  const overlayEl = document.createElement('div');
  overlayEl.className = 'hero-cinema-overlay';
  overlayEl.setAttribute('aria-hidden', 'true');

  wadahEl.appendChild(wadahSlide);
  wadahEl.appendChild(overlayEl);

  const elemenSlide = [];

  // Bangun elemen slide latar belakang
  DESTINASI_NUSANTARA.forEach((destinasi, idx) => {
    const slide = document.createElement('div');
    slide.className = `hero-cinema-item ${idx === 0 ? 'aktif' : ''}`;
    slide.style.backgroundImage = `url("${destinasi.gambar}")`;
    slide.setAttribute('data-id', destinasi.id);
    wadahSlide.appendChild(slide);
    elemenSlide.push(slide);
  });

  let indeksAktif = 0;
  let timerId = null;
  const DURASI_SLIDE = 5000; // Otomatis berpindah setiap 5 detik sekali

  function pindahKeSlide(indeksBaru) {
    if (indeksBaru === indeksAktif && elemenSlide[indeksAktif]?.classList.contains('aktif')) return;

    elemenSlide[indeksAktif]?.classList.remove('aktif');
    indeksAktif = (indeksBaru + DESTINASI_NUSANTARA.length) % DESTINASI_NUSANTARA.length;
    elemenSlide[indeksAktif]?.classList.add('aktif');
  }

  function slideBerikutnya() {
    pindahKeSlide(indeksAktif + 1);
  }

  function mulaiUlangTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(slideBerikutnya, DURASI_SLIDE);
  }

  function jedaTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  // Mulai perputaran otomatis setiap 5 detik
  mulaiUlangTimer();

  // Preload gambar berikutnya untuk transisi instan tanpa jeda jaringan
  DESTINASI_NUSANTARA.slice(1, 5).forEach((item) => {
    const img = new Image();
    img.src = item.gambar;
  });

  // Hormati visibilitychange browser agar hemat CPU/baterai saat tab tidak aktif
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      jedaTimer();
    } else {
      mulaiUlangTimer();
    }
  });

  return {
    jeda: jedaTimer,
    lanjut: mulaiUlangTimer,
    keSlide: pindahKeSlide
  };
}
