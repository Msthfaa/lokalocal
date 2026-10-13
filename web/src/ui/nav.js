/**
 * nav.js — Bilah navigasi utama, menu layar penuh ponsel, dan penanda bagian aktif
 * Sesuai WEB_SPEC.md Bagian 4.1.
 */

import { TEKS } from '../content/teks.js';

/**
 * Menginisialisasi perilaku navigasi utama.
 * @param {object} opsi
 * @param {(pemicu: HTMLElement) => void} opsi.bukaDialogTentang
 */
/**
 * Menginisialisasi perilaku navigasi utama.
 * @param {object} opsi
 * @param {(pemicu: HTMLElement) => void} opsi.bukaDialogTentang
 * @param {'cerita'|'jelajah'|'paspor'|'kuis'} [opsi.halamanAktif='cerita']
 */
export function inisialisasiNavigasi({ bukaDialogTentang, halamanAktif = 'cerita' }) {
  const headerEl = document.getElementById('header-utama');
  const tombolMenuEl = document.getElementById('tombol-menu-ponsel');
  const daftarNavEl = document.getElementById('nav-daftar');
  const tombolTentangNav = document.getElementById('nav-tombol-tentang');
  const tautanNav = daftarNavEl
    ? Array.from(daftarNavEl.querySelectorAll('a.nav-tautan'))
    : [];

  let menuTerbuka = false;

  function aturStatusMenu(buka) {
    menuTerbuka = Boolean(buka);
    if (!tombolMenuEl || !daftarNavEl) return;

    tombolMenuEl.setAttribute('aria-expanded', String(menuTerbuka));
    tombolMenuEl.setAttribute(
      'aria-label',
      menuTerbuka ? TEKS.nav.tutupMenu : TEKS.nav.bukaMenu
    );
    daftarNavEl.classList.toggle('terbuka', menuTerbuka);
  }

  if (tombolMenuEl) {
    tombolMenuEl.addEventListener('click', () => {
      aturStatusMenu(!menuTerbuka);
    });
  }

  // Tutup menu ponsel saat salah satu tautan diklik
  for (const tautan of tautanNav) {
    tautan.addEventListener('click', () => {
      if (menuTerbuka) {
        aturStatusMenu(false);
      }
    });
  }

  if (tombolTentangNav) {
    tombolTentangNav.addEventListener('click', () => {
      if (menuTerbuka) {
        aturStatusMenu(false);
      }
      if (typeof bukaDialogTentang === 'function') {
        bukaDialogTentang(tombolTentangNav);
      }
    });
  }

  // Tutup menu ponsel dengan tombol Escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuTerbuka) {
      aturStatusMenu(false);
      if (tombolMenuEl) tombolMenuEl.focus();
    }
  });

  // Efek latar solid saat halaman digulir
  const perbaruiStatusGulir = () => {
    if (!headerEl) return;
    headerEl.classList.toggle('tergulir', window.scrollY > 16);
  };
  perbaruiStatusGulir();
  window.addEventListener('scroll', perbaruiStatusGulir, { passive: true });

  // Tandai navigasi aktif berdasarkan halaman aktif saat ini
  function tandaiNavAktif(idNav) {
    for (const tautan of tautanNav) {
      const cocok = tautan.dataset.navId === idNav;
      if (cocok) {
        tautan.setAttribute('aria-current', 'page');
      } else {
        tautan.removeAttribute('aria-current');
      }
    }
  }

  if (halamanAktif) {
    tandaiNavAktif(halamanAktif);
  }
}
