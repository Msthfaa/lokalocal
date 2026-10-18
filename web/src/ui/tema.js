/**
 * tema.js — Pengontrol Tema Gelap & Terang (Dark Mode / Light Mode)
 * Menyimpan preferensi di localStorage, memperbarui atribut data-tema pada <html>,
 * dan mengontrol tombol toggle tema di navbar desktop dan menu ponsel.
 */

const KUNCI_STORAGE = 'lokalocal-tema';

/**
 * Mengambil tema yang sedang aktif.
 * @returns {'gelap'|'terang'}
 */
export function ambilTemaSaatIni() {
  try {
    const tersimpan = localStorage.getItem(KUNCI_STORAGE);
    if (tersimpan === 'terang' || tersimpan === 'gelap') {
      return tersimpan;
    }
  } catch (err) {
    // Abaikan error localStorage jika dibatasi
  }

  // Default gelap sesuai identitas awal Lokalocal
  return 'gelap';
}

/**
 * Menerapkan tema ke elemen root dan memperbarui status UI tombol.
 * @param {'gelap'|'terang'} tema
 */
export function terapkanTema(tema) {
  const temaFinal = tema === 'terang' ? 'terang' : 'gelap';
  document.documentElement.setAttribute('data-tema', temaFinal);
  if (document.body) {
    document.body.classList.toggle('tema-siang', temaFinal === 'terang');
    document.body.classList.toggle('tema-malam', temaFinal === 'gelap');
  }

  try {
    localStorage.setItem(KUNCI_STORAGE, temaFinal);
  } catch (err) {
    // Abaikan
  }

  // Perbarui tombol desktop
  const tombolToggle = document.getElementById('tombol-toggle-tema');
  if (tombolToggle) {
    const label = temaFinal === 'gelap' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';
    tombolToggle.setAttribute('aria-label', label);
    tombolToggle.setAttribute('title', label);
  }

  // Pancarkan event jika komponen lain perlu merender ulang (misal kanvas 3D)
  window.dispatchEvent(
    new CustomEvent('lokalocal-ganti-tema', {
      detail: { tema: temaFinal }
    })
  );
}

/**
 * Beralih antara tema gelap dan terang dengan transisi memudar halus 1 halaman penuh.
 * Menggunakan View Transitions API (crossfade memudar) jika didukung,
 * atau fallback transisi terkoordinasi secara global.
 *
 * @returns {'gelap'|'terang'}
 */
export function toggleTema() {
  const sekarang = ambilTemaSaatIni();
  const temaBaru = sekarang === 'gelap' ? 'terang' : 'gelap';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Jika browser mendukung View Transitions API dan user tidak mematikan animasi
  if (typeof document.startViewTransition === 'function' && !prefersReduced) {
    const transition = document.startViewTransition(() => {
      terapkanTema(temaBaru);
    });

    transition.ready.then(() => {
      try {
        document.documentElement.animate(
          { opacity: [0, 1] },
          {
            duration: 350,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      } catch (err) {
        // Fallback jika browser mengandalkan animasi CSS murni
      }
    });

    return temaBaru;
  }

  // Fallback transisi memudar menyeluruh 1 halaman untuk browser tanpa View Transitions API
  if (!prefersReduced) {
    document.documentElement.classList.add('tema-transisi-aktif');
    terapkanTema(temaBaru);
    setTimeout(() => {
      document.documentElement.classList.remove('tema-transisi-aktif');
    }, 400);
  } else {
    terapkanTema(temaBaru);
  }

  return temaBaru;
}

/**
 * Menginisialisasi event listener dan tema awal saat halaman dimuat.
 */
export function inisialisasiTema() {
  const temaAwal = ambilTemaSaatIni();
  terapkanTema(temaAwal);

  const tombolToggle = document.getElementById('tombol-toggle-tema');
  if (tombolToggle) {
    tombolToggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTema(e);
    });
  }
}
