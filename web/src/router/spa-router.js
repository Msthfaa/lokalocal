/**
 * spa-router.js — Pengelola Rute SPA (Single Page Application) Lokalocal
 *
 * Mengelola perpindahan tampilan antar halaman ('cerita', 'jelajah', 'paspor', 'kuis')
 * secara in-memory tanpa reload browser, menyinkronkan URL hash & history browser,
 * menghentikan/menjalankan render loop Three.js sesuai kebutuhan,
 * serta memicu animasi sinematik Gatotkaca Chibi secara persisten tanpa kedip layar.
 */

import { terbangkanGatotkacaLepasLandas } from '../ui/transisi-gatotkaca.js';
import { NAMA_SITUS } from '../config.js';
import { gsap, apakahKurangiGerak } from '../util/motion.js';

export const DAFTAR_TAMPILAN = ['cerita', 'jelajah', 'paspor', 'kuis'];

const JUDUL_TAMPILAN = {
  cerita: `${NAMA_SITUS} — Cerita Kebudayaan Nusantara`,
  jelajah: `${NAMA_SITUS} — Jelajah Peta 3D Nusantara`,
  paspor: `${NAMA_SITUS} — Paspor Budaya Nusantara`,
  kuis: `${NAMA_SITUS} — Kuis Budaya Nusantara`
};

export class SpaRouter {
  /**
   * @param {object} parameter
   * @param {(tampilan: string, asal: string) => void} [parameter.saatGantiTampilan]
   * @param {(provinsiKode?: string) => Promise<void>} [parameter.onBukaJelajah]
   * @param {object} [parameter.kontroler3D]
   */
  constructor({ saatGantiTampilan, onBukaJelajah = null, kontroler3D = null } = {}) {
    this.tampilanAktif = 'cerita';
    this.saatGantiTampilan = saatGantiTampilan;
    this.onBukaJelajah = onBukaJelajah;
    this.kontroler3D = kontroler3D;
    this.sedangTransisi = false;

    this.elemenViews = {
      cerita: document.getElementById('view-cerita'),
      jelajah: document.getElementById('view-jelajah'),
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
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    const hashUtama = rawHash.split('?')[0].toLowerCase();

    if (DAFTAR_TAMPILAN.includes(hashUtama)) {
      return hashUtama;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const p = searchParams.get('p') || searchParams.get('halaman') || searchParams.get('tab');
    if (p && DAFTAR_TAMPILAN.includes(p.toLowerCase())) {
      return p.toLowerCase();
    }

    return 'cerita';
  }

  /**
   * Mengambil kode provinsi dari parameter URL atau hash jika ada
   */
  dapatkanProvinsiDariUrl() {
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    if (rawHash.includes('?')) {
      const queryStr = rawHash.split('?')[1];
      const params = new URLSearchParams(queryStr);
      const prov = params.get('provinsi') || params.get('prov');
      if (prov) return prov;
    }
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('provinsi') || searchParams.get('prov') || null;
  }

  /**
   * Memasang listener klik tautan internal, popstate, dan hashchange
   */
  pasangListenerGlobal() {
    // Tangani tombol Back / Forward browser
    window.addEventListener('hashchange', () => {
      const target = this.dapatkanTampilanDariUrl();
      const prov = this.dapatkanProvinsiDariUrl();
      if ((target !== this.tampilanAktif || prov) && !this.sedangTransisi) {
        this.navigasiKe(target, { updateUrl: false, animasiPesawat: false, provinsi: prov });
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
      let targetProvinsi = tautan.dataset.provinsi || null;

      if (tautan.dataset.navId === 'jelajah' || href.includes('jelajah.html') || href === '#jelajah' || href === '#/jelajah') {
        targetTampilan = 'jelajah';
        if (!targetProvinsi && href.includes('provinsi=')) {
          try {
            const urlObj = new URL(href, window.location.origin);
            targetProvinsi = urlObj.searchParams.get('provinsi');
          } catch {}
        }
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
        const butuhAnimasiPesawat = targetTampilan === 'jelajah' && this.tampilanAktif !== 'jelajah';
        this.navigasiKe(targetTampilan, { animasiPesawat: butuhAnimasiPesawat, provinsi: targetProvinsi });
      }
    });
  }

  /**
   * Navigasi khusus ke halaman Jelajah 3D
   * @param {object} [opsiTambahan]
   * @param {string} [opsiTambahan.provinsi]
   */
  navigasiKeJelajahDedicated(opsiTambahan = {}) {
    this.navigasiKe('jelajah', {
      animasiPesawat: this.tampilanAktif !== 'jelajah',
      provinsi: opsiTambahan.provinsi || null
    });
  }

  /**
   * Berpindah ke tampilan halaman yang dituju dengan transisi liquid halus tanpa kedip
   * @param {'cerita'|'jelajah'|'paspor'|'kuis'} targetTampilan
   * @param {object} [opsi]
   * @param {boolean} [opsi.updateUrl=true]
   * @param {boolean} [opsi.animasiPesawat=true]
   * @param {string|null} [opsi.provinsi=null]
   */
  async navigasiKe(targetTampilan, { updateUrl = true, animasiPesawat = true, provinsi = null } = {}) {
    if (!DAFTAR_TAMPILAN.includes(targetTampilan)) return;
    if (this.tampilanAktif === targetTampilan && !provinsi) return;
    if (this.sedangTransisi) return;

    const asalTampilan = this.tampilanAktif;
    this.sedangTransisi = true;

    // Perbarui URL hash & judul tab
    if (updateUrl) {
      window.location.hash = `#${targetTampilan}` + (provinsi ? `?provinsi=${encodeURIComponent(provinsi)}` : '');
    }
    document.title = JUDUL_TAMPILAN[targetTampilan] || NAMA_SITUS;

    // Gerakkan liquid indicator pill di navbar seketika dengan fluid physics
    this.perbaruiStatusNav(targetTampilan);

    // KASUS 1: BERPINDAH KE JELAJAH 3D
    if (targetTampilan === 'jelajah') {
      const elAsal = this.elemenViews[asalTampilan];
      const elTarget = this.elemenViews['jelajah'];

      const selesaikanMasukJelajah = async () => {
        this.tukarTampilanDom(asalTampilan, 'jelajah');
        if (typeof this.onBukaJelajah === 'function') {
          await this.onBukaJelajah(provinsi);
        } else if (this.kontroler3D) {
          if (typeof this.kontroler3D.lanjutkanRender === 'function') {
            this.kontroler3D.lanjutkanRender();
          }
          if (typeof this.kontroler3D.perbaruiUkuran === 'function') {
            this.kontroler3D.perbaruiUkuran();
          }
          if (provinsi && typeof this.kontroler3D.pilihProvinsi === 'function') {
            this.kontroler3D.pilihProvinsi(provinsi);
          }
        }
      };

      if (animasiPesawat && !apakahKurangiGerak()) {
        try {
          const { sambutGatotkacaDiJelajah } = await import('../ui/transisi-gatotkaca.js');
          terbangkanGatotkacaLepasLandas({
            onTerbangTinggi: async () => {
              await selesaikanMasukJelajah();
              await sambutGatotkacaDiJelajah();
              this.sedangTransisi = false;
            }
          });
          return;
        } catch {
          // Lanjutkan jika ada kendala modul
        }
      }

      // Transisi crossfade liquid halus
      if (elAsal && elTarget && !apakahKurangiGerak()) {
        gsap.to(elAsal, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.out',
          onComplete: async () => {
            await selesaikanMasukJelajah();
            gsap.fromTo(
              elTarget,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.25,
                ease: 'power2.inOut',
                onComplete: () => {
                  this.sedangTransisi = false;
                }
              }
            );
          }
        });
        return;
      }

      await selesaikanMasukJelajah();
      this.sedangTransisi = false;
      return;
    }

    // KASUS 2: BERPINDAH DARI JELAJAH KE HALAMAN LAIN (CERITA / PASPOR / KUIS)
    if (asalTampilan === 'jelajah' && this.kontroler3D && typeof this.kontroler3D.jedaRender === 'function') {
      this.kontroler3D.jedaRender();
    }

    const elAsal = this.elemenViews[asalTampilan];
    const elTarget = this.elemenViews[targetTampilan];

    if (!elAsal || !elTarget || apakahKurangiGerak()) {
      this.tukarTampilanDom(asalTampilan, targetTampilan);
      this.sedangTransisi = false;
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
              }
            }
          );
        }
      });
    } catch (e) {
      this.tukarTampilanDom(asalTampilan, targetTampilan);
      this.sedangTransisi = false;
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
   * Memperbarui atribut aria-current dan posisi liquid indicator pill pada navbar
   * @param {string} idNav
   */
  perbaruiStatusNav(idNav) {
    if (typeof window.tandaiNavAktif === 'function') {
      window.tandaiNavAktif(idNav);
    } else {
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

    // Perbarui tombol aksi kanan navbar (Jelajah 3D <-> Baca Cerita)
    const btnAksiKanan = document.getElementById('nav-tombol-aksi-kanan') || document.querySelector('.nav-tombol-aksi');
    if (btnAksiKanan) {
      if (idNav === 'jelajah') {
        btnAksiKanan.setAttribute('href', '#cerita');
        btnAksiKanan.setAttribute('title', 'Kembali ke Cerita Budaya');
        btnAksiKanan.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          <span>Baca Cerita</span>
        `;
      } else {
        btnAksiKanan.setAttribute('href', '#jelajah');
        btnAksiKanan.setAttribute('title', 'Jelajah Peta 3D Nusantara');
        btnAksiKanan.innerHTML = `
          <svg class="nav-merek-ikon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span>Jelajah 3D</span>
        `;
      }
    }
  }
}
