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
 * Beralih antara tema gelap dan terang dengan transisi menyatu 1 halaman penuh.
 * Menggunakan View Transitions API (circular reveal dari titik klik/tombol) jika didukung,
 * atau fallback transisi terkoordinasi secara global.
 *
 * @param {MouseEvent|PointerEvent|Event|null} [event]
 * @returns {'gelap'|'terang'}
 */
export function toggleTema(event = null) {
  const sekarang = ambilTemaSaatIni();
  const temaBaru = sekarang === 'gelap' ? 'terang' : 'gelap';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Jika browser mendukung View Transitions API dan user tidak mematikan animasi
  if (typeof document.startViewTransition === 'function' && !prefersReduced) {
    // Tentukan koordinat titik pusat ekspansi lingkaran
    let x = window.innerWidth / 2;
    let y = 0;

    if (event && typeof event.clientX === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
      x = event.clientX;
      y = event.clientY;
    } else {
      const tombol = document.getElementById('tombol-toggle-tema');
      if (tombol) {
        const rect = tombol.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    // Jarak terjauh ke sudut layar untuk radius ekspansi lingkaran penuh
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      terapkanTema(temaBaru);
    });

    transition.ready.then(() => {
      try {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 450,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      } catch (err) {
        // Fallback jika browser menolak pseudoElement di Web Animations API
      }
    });

    return temaBaru;
  }

  // Fallback transisi menyeluruh 1 halaman untuk browser tanpa View Transitions API
  if (!prefersReduced) {
    document.documentElement.classList.add('tema-transisi-aktif');
    terapkanTema(temaBaru);
    setTimeout(() => {
      document.documentElement.classList.remove('tema-transisi-aktif');
    }, 450);
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
