/**
 * nav.js — Bilah navigasi utama mengambang (floating glassmorphism navbar),
 * menu layar penuh ponsel, dan penanda halaman/bagian aktif dengan liquid sliding pill.
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

  // Pastikan elemen pill liquid tersedia di dalam bar navigasi
  let pillEl = document.getElementById('nav-liquid-pill');
  if (!pillEl && daftarNavEl) {
    pillEl = document.createElement('li');
    pillEl.id = 'nav-liquid-pill';
    pillEl.className = 'nav-liquid-pill';
    pillEl.setAttribute('aria-hidden', 'true');
    daftarNavEl.prepend(pillEl);
  }

  let idAktifSaatIni = halamanAktif || 'cerita';

  /**
   * Menghitung dan menggerakkan kapsul liquid kuning ke item aktif
   */
  function perbaruiPosisiPill(idNav, tanpaAnimasi = false) {
    if (!pillEl || !daftarNavEl) return;
    const targetLink = tautanNav.find((a) => a.dataset.navId === idNav);
    if (!targetLink) {
      pillEl.style.opacity = '0';
      return;
    }

    const navRect = daftarNavEl.getBoundingClientRect();
    const linkRect = targetLink.getBoundingClientRect();

    const x = linkRect.left - navRect.left;
    const y = linkRect.top - navRect.top;
    const w = linkRect.width;
    const h = linkRect.height;

    if (w <= 0 || h <= 0) return;

    if (tanpaAnimasi) {
      pillEl.style.transition = 'none';
    } else {
      pillEl.style.transition = '';
    }

    pillEl.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    pillEl.style.width = `${Math.round(w)}px`;
    pillEl.style.height = `${Math.round(h)}px`;
    pillEl.style.opacity = '1';

    if (tanpaAnimasi) {
      requestAnimationFrame(() => {
        pillEl.style.transition = '';
      });
    }
  }

  // Tandai navigasi aktif berdasarkan halaman aktif saat ini
  function tandaiNavAktif(idNav, langsung = false) {
    idAktifSaatIni = idNav;
    for (const tautan of tautanNav) {
      const cocok = tautan.dataset.navId === idNav;
      if (cocok) {
        tautan.setAttribute('aria-current', 'page');
      } else {
        tautan.removeAttribute('aria-current');
      }
    }
    requestAnimationFrame(() => {
      perbaruiPosisiPill(idNav, langsung);
    });
  }

  window.addEventListener('resize', () => {
    perbaruiPosisiPill(idAktifSaatIni, true);
  });

  if (halamanAktif) {
    tandaiNavAktif(halamanAktif, true);
    setTimeout(() => {
      perbaruiPosisiPill(halamanAktif, true);
    }, 120);
  }

  window.tandaiNavAktif = tandaiNavAktif;
  window.perbaruiPosisiPillNav = perbaruiPosisiPill;

  return {
    tandaiNavAktif,
    perbaruiPosisiPill
  };
}
