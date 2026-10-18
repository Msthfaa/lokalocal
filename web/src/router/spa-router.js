/**
 * spa-router.js — Pengelola Rute SPA (Single Page Application) Lokalocal
 *
 * Mengelola perpindahan tampilan antar halaman ('cerita', 'jelajah', 'paspor', 'kuis')
 * secara in-memory tanpa reload browser, menyinkronkan URL hash & history browser,
 * menghentikan/menjalankan render loop Three.js sesuai kebutuhan,
 * serta memicu animasi sinematik Pesawat Kartun Budaya saat menuju halaman Jelajah.
 */

import { terbangkanPesawatLepasLandas } from '../ui/transisi-pesawat.js';
import { NAMA_SITUS } from '../config.js';
import { gsap, apakahKurangiGerak } from '../util/motion.js';

export const DAFTAR_TAMPILAN = ['cerita', 'paspor', 'kuis'];

const JUDUL_TAMPILAN = {
  cerita: `${NAMA_SITUS} — Cerita Kebudayaan Nusantara`,
  paspor: `${NAMA_SITUS} — Paspor Budaya Nusantara`,
  kuis: `${NAMA_SITUS} — Kuis Budaya Nusantara`
};

export class SpaRouter {
  /**
   * @param {object} parameter
   * @param {(tampilan: string) => void} [parameter.saatGantiTampilan]
   * @param {object} [parameter.kontroler3D]
   */
  constructor({ saatGantiTampilan, kontroler3D = null } = {}) {
    this.tampilanAktif = 'cerita';
    this.saatGantiTampilan = saatGantiTampilan;
    this.kontroler3D = kontroler3D;
    this.sedangTransisi = false;

    this.elemenViews = {
      cerita: document.getElementById('view-cerita'),
      paspor: document.getElementById('view-paspor'),
      kuis: document.getElementById('view-kuis')
    };

    this.pasangListenerGlobal();
  }

  aturKontroler3D(kontroler3D) {
    this.kontroler3D = kontroler3D;
  }

  /**
   * Mengambil nama tampilan awal dari hash URL atau parameter pencarian
   */
  dapatkanTampilanDariUrl() {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
    if (DAFTAR_TAMPILAN.includes(hash)) {
      return hash;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const p = searchParams.get('p') || searchParams.get('halaman') || searchParams.get('tab');
    if (p && DAFTAR_TAMPILAN.includes(p.toLowerCase())) {
      return p.toLowerCase();
    }

    return 'cerita';
  }

  /**
   * Memasang listener klik tautan internal, popstate, dan hashchange
   */
  pasangListenerGlobal() {
    // Tangani tombol Back / Forward browser
    window.addEventListener('hashchange', () => {
      const target = this.dapatkanTampilanDariUrl();
      if (target !== this.tampilanAktif && !this.sedangTransisi) {
        this.navigasiKe(target, { updateUrl: false });
      }
    });

    // Tangkap semua klik tautan navigasi di seluruh DOM
    document.addEventListener('click', (e) => {
      const tautan = e.target.closest('a');
      if (!tautan) return;

      const href = tautan.getAttribute('href');
      if (!href) return;

      // Abaikan tautan eksternal atau new tab
      if (href.startsWith('http') || href.startsWith('//') || tautan.target === '_blank') {
        return;
      }

      // Deteksi target tampilan dari href
      let targetTampilan = null;
      if (tautan.dataset.navId === 'jelajah' || href.includes('jelajah.html') || href === '#jelajah' || href === '#/jelajah') {
        e.preventDefault();
        this.navigasiKeJelajahDedicated();
        return;
      } else if (tautan.dataset.navId && DAFTAR_TAMPILAN.includes(tautan.dataset.navId)) {
        targetTampilan = tautan.dataset.navId;
      } else if (href.includes('paspor.html') || href === '#paspor' || href === '#/paspor') {
        targetTampilan = 'paspor';
      } else if (href.includes('kuis.html') || href === '#kuis' || href === '#/kuis') {
        targetTampilan = 'kuis';
      } else if (href === './index.html' || href === 'index.html' || href === './' || href === '/' || href === '#cerita') {
        targetTampilan = 'cerita';
      }

      if (targetTampilan) {
        e.preventDefault();
        this.navigasiKe(targetTampilan);
      }
    });
  }

  /**
   * Navigasi khusus ke halaman Jelajah 3D tersendiri (jelajah.html)
   * dengan memicu animasi terbang Pesawat Kartun Budaya lepas landas
   * @param {object} [opsiTambahan]
   * @param {string} [opsiTambahan.provinsi]
   */
  navigasiKeJelajahDedicated(opsiTambahan = {}) {
    if (this.sedangTransisi) return;
    this.sedangTransisi = true;

    try {
      sessionStorage.setItem('lokalocal_mendarat_pesawat', '1');
    } catch {}

    const queryParams = [];
    queryParams.push('mendarat=1');
    if (opsiTambahan.provinsi) {
      queryParams.push(`provinsi=${encodeURIComponent(opsiTambahan.provinsi)}`);
    }

    const targetUrl = `./jelajah.html?${queryParams.join('&')}`;

    try {
      terbangkanPesawatLepasLandas({
        onTerbangTinggi: () => {
          window.location.href = targetUrl;
        }
      });
    } catch {
      window.location.href = targetUrl;
    }
  }

  /**
   * Berpindah ke tampilan halaman yang dituju
   * @param {'cerita'|'jelajah'|'paspor'|'kuis'} targetTampilan
   * @param {object} [opsi]
   * @param {boolean} [opsi.updateUrl=true]
   * @param {boolean} [opsi.paksaPesawat=false]
   */
  navigasiKe(targetTampilan, { updateUrl = true, paksaPesawat = false, animasiPesawat = true, provinsi = null } = {}) {
    if (targetTampilan === 'jelajah') {
      this.navigasiKeJelajahDedicated({ provinsi });
      return;
    }

    if (!DAFTAR_TAMPILAN.includes(targetTampilan)) return;
    if (this.tampilanAktif === targetTampilan) return;
    if (this.sedangTransisi) return;

    const asalTampilan = this.tampilanAktif;
    this.sedangTransisi = true;

    // Perbarui URL hash & judul tab
    if (updateUrl) {
      window.location.hash = `#${targetTampilan}`;
    }
    document.title = JUDUL_TAMPILAN[targetTampilan] || NAMA_SITUS;

    // PERPINDAHAN ANTAR HALAMAN LAINNYA -> BUTTERY-SMOOTH CROSSFADE CEPAT
    const elAsal = this.elemenViews[asalTampilan];
    const elTarget = this.elemenViews[targetTampilan];

    if (!animasiPesawat || !elAsal || !elTarget || apakahKurangiGerak()) {
      this.tukarTampilanDom(asalTampilan, targetTampilan);
      this.sedangTransisi = false;
      this.perbaruiStatusNav(targetTampilan);
      return;
    }

    try {
      gsap.to(elAsal, {
        opacity: 0,
        duration: 0.18,
        ease: 'power1.out',
        onComplete: () => {
          this.tukarTampilanDom(asalTampilan, targetTampilan);
          window.scrollTo({ top: 0, behavior: 'instant' });

          gsap.fromTo(
            elTarget,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.22,
              ease: 'power1.in',
              onComplete: () => {
                this.sedangTransisi = false;
                this.perbaruiStatusNav(targetTampilan);
              }
            }
          );
        }
      });
    } catch (e) {
      this.tukarTampilanDom(asalTampilan, targetTampilan);
      this.sedangTransisi = false;
      this.perbaruiStatusNav(targetTampilan);
    }
  }

  /**
   * Menukar visibilitas DOM container view secara langsung
   * @param {string} asal
   * @param {string} target
   */
  tukarTampilanDom(asal, target) {
    this.tampilanAktif = target;

    // Pastikan elemenViews selalu terupdate jika ada elemen DOM yang baru dimuat
    for (const id of DAFTAR_TAMPILAN) {
      if (!this.elemenViews[id]) {
        this.elemenViews[id] = document.getElementById(`view-${id}`);
      }
    }

    // Kelola class body untuk kebutuhan CSS khusus halaman fullscreen
    const adalahFullscreenJelajah = target === 'jelajah';
    document.body.classList.toggle('halaman-fullscreen-body', adalahFullscreenJelajah);
    document.body.classList.toggle('halaman-paspor-body', target === 'paspor');
    document.body.classList.toggle('halaman-kuis-body', target === 'kuis');

    // Sembunyikan semua view yang tidak aktif dan tampilkan view yang dituju
    for (const [id, el] of Object.entries(this.elemenViews)) {
      if (!el) continue;
      const aktif = id === target;
      if (aktif) {
        el.hidden = false;
        el.removeAttribute('hidden');
        el.style.display = 'block';
        el.style.opacity = '1';
        el.classList.add('is-aktif');
      } else {
        el.hidden = true;
        el.setAttribute('hidden', '');
        el.style.display = 'none';
        el.classList.remove('is-aktif');
      }
    }

    // Jika masuk jelajah, posisikan scroll di 0 agar kanvas selayar penuh pas
    if (adalahFullscreenJelajah) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Panggil callback listeners jika ada
    if (typeof this.saatGantiTampilan === 'function') {
      this.saatGantiTampilan(target, asal);
    }
  }

  /**
   * Memperbarui atribut aria-current dan kelas aktif pada navbar
   * @param {string} idNav
   */
  perbaruiStatusNav(idNav) {
    const daftarTautan = document.querySelectorAll('.nav-tautan[data-nav-id]');
    daftarTautan.forEach((tautan) => {
      const cocok = tautan.dataset.navId === idNav;
      if (cocok) {
        tautan.setAttribute('aria-current', 'page');
      } else {
        tautan.removeAttribute('aria-current');
      }
    });
  }
}
