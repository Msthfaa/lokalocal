/**
 * nav.js — Bilah navigasi utama mengambang (floating glassmorphism navbar),
 * menu layar penuh ponsel, dan penanda halaman/bagian aktif.
 * Menu: Cerita, Jelajah, Paspor, Kuis, Tentang data, Tentang kami
 */

import { TEKS } from '../content/teks.js';

/**
 * Menginisialisasi perilaku navigasi utama.
 * @param {object} opsi
 * @param {(pemicu: HTMLElement) => void} [opsi.bukaDialogTentang]
 * @param {(pemicu: HTMLElement) => void} [opsi.bukaDialogTentangKami]
 * @param {'cerita'|'jelajah'|'paspor'|'kuis'} [opsi.halamanAktif='cerita']
 */
export function inisialisasiNavigasi({ bukaDialogTentang, bukaDialogTentangKami, halamanAktif = 'cerita' }) {
  const headerEl = document.getElementById('header-utama');
  const tombolMenuEl = document.getElementById('tombol-menu-ponsel');
  const daftarNavEl = document.getElementById('nav-daftar');
  const tombolTentangNav = document.getElementById('nav-tombol-tentang');
  const tombolTentangKamiNav = document.getElementById('nav-tombol-tentang-kami');
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

  if (tombolTentangKamiNav) {
    tombolTentangKamiNav.addEventListener('click', () => {
      if (menuTerbuka) {
        aturStatusMenu(false);
      }
      if (typeof bukaDialogTentangKami === 'function') {
        bukaDialogTentangKami(tombolTentangKamiNav);
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

  window.tandaiNavAktif = tandaiNavAktif;

  return {
    tandaiNavAktif
  };
}
