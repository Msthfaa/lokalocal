/**
 * hero.js — Bagian S1 (Pembuka): siluet peta Indonesia 2D (A-02) dengan
 * peningkatan progresif elemen globe 3D ringan Three.js (Fase 9),
 * serta animasi judul per baris (A-01).
 * Sesuai WEB_SPEC.md Bagian 3 (S1), Bagian 7.2, dan Bagian 15.
 */

import { FITUR_OPSIONAL } from '../config.js';
import { renderPetaSvg } from '../map/render.js';
import { buatProyeksiIndonesia } from '../map/projection.js';
import { gsap, ScrollTrigger, pasangMatchMediaAnimasi, apakahKurangiGerak } from '../util/motion.js';
import { formatAngka } from '../util/format.js';
import { apakahBisaMemuat3D } from './hero3d/fallback.js';

/**
 * Memeriksa apakah perangkat dan preferensi pengguna mendukung elemen 3D:
 * @returns {boolean}
 */
export function apakahMendukungGlobe3D() {
  return FITUR_OPSIONAL.globe3D && apakahBisaMemuat3D();
}

/**
 * Memasang ScrollTrigger interaktif pada bagian Hero untuk Peta Diorama 3D Indonesia.
 * - Posisi awal (opening/scroll di atas): Peta 3D utuh penuh di tengah, awan melayang, prompt scroll.
 * - Scroll turun: Peta 3D pecah dramatis, kepingan melayang keluar, isi beranda menyingkap masuk.
 * - Scroll naik: Kepingan provinsi menyatu kembali persis seperti semula!
 *
 * @param {object} parameter
 */
function pasangScrollTriggerHeroDiorama({ kontroler3D, elPembuka, elKonten, elPrompt }) {
  if (!kontroler3D || !elPembuka) return;

  elPembuka.classList.add('has-diorama-mode');

  // Set state awal: peta utuh menyatu, prompt aktif, konten beranda siap disingkap
  kontroler3D.setProgress(0);
  if (elKonten) {
    elKonten.style.opacity = '0';
    elKonten.style.transform = 'translateY(35px)';
    elKonten.style.pointerEvents = 'none';
  }
  if (elPrompt) {
    elPrompt.style.opacity = '1';
    elPrompt.style.transform = 'translateX(-50%) translateY(0)';
  }

  // Pin section pembuka dan hubungkan scroll dengan pose 3D serta kemunculan isi beranda
  ScrollTrigger.create({
    trigger: elPembuka,
    start: 'top top',
    end: '+=150%',
    pin: true,
    pinSpacing: true,
    scrub: 0.6,
    anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;

      // 1. Terapkan pose murni pada kepingan diorama 3D
      kontroler3D.setProgress(p);

      // 2. Prompt scroll memudar cepat di awal
      if (elPrompt) {
        const opPrompt = Math.max(0, 1 - p * 6);
        elPrompt.style.opacity = opPrompt.toFixed(3);
        elPrompt.style.transform = `translateX(-50%) translateY(${(p * 25).toFixed(1)}px)`;
      }

      // 3. Isi beranda (judul, deskripsi, metrik) menyingkap saat peta pecah
      if (elKonten) {
        // Muncul bertahap antara p = 0.12 s.d 0.58
        const pMasuk = Math.min(1, Math.max(0, (p - 0.12) / 0.46));
        // Transisi keluar halus di ujung scroll p = 0.84 s.d 1.0 (mengalir ke bagian S2)
        const pKeluar = p > 0.84 ? Math.max(0, 1 - (p - 0.84) / 0.16) : 1;
        const opasitas = pMasuk * pKeluar;

        elKonten.style.opacity = opasitas.toFixed(3);
        elKonten.style.pointerEvents = opasitas > 0.3 ? 'auto' : 'none';

        const offsetY = (35 * (1 - pMasuk) - (p > 0.84 ? (p - 0.84) * 50 : 0)).toFixed(1);
        elKonten.style.transform = `translateY(${offsetY}px)`;
      }
    }
  });

  ScrollTrigger.refresh();
}

/**
 * Menginisialisasi bagian S1 Pembuka.
 * @param {object} dataAwal - { statistik, provinsi, geoProvinsi, meta }
 */
export function inisialisasiBagianHero({ statistik, provinsi, geoProvinsi }) {
  const elPembuka = document.getElementById('pembuka');
  const wadahLatarPeta = document.getElementById('s1-latar-peta');
  const elKonten = elPembuka ? elPembuka.querySelector('.s1-konten') : null;
  const elPrompt = document.getElementById('s1-prompt-scroll');
  const elTotalMentah = document.getElementById('stat-total-mentah');

  if (elTotalMentah && statistik) {
    elTotalMentah.textContent = formatAngka(statistik.total_rekaman);
  }

  // Fallback 2D selalu dirender terlebih dahulu agar instan dan tahan gagal
  if (wadahLatarPeta && geoProvinsi) {
    renderPetaSvg(wadahLatarPeta, {
      geoProvinsi,
      daftarProvinsi: provinsi,
      idUnik: 's1-hero',
      modeAwal: 'gelap-awal',
      interaktif: false,
      tampilkanTitikCahaya: true
    });

    // Muat Peta Diorama 3D Indonesia low-poly secara dinamis bila perangkat mampu & bukan reduced-motion
    if (apakahBisaMemuat3D() && FITUR_OPSIONAL.globe3D) {
      import('./hero3d/index.js')
        .then(({ inisialisasiHero3D }) => {
          if (!apakahKurangiGerak()) {
            const kontroler3D = inisialisasiHero3D({
              wadahEl: wadahLatarPeta,
              geoProvinsi,
              daftarProvinsi: provinsi,
              proyeksi: buatProyeksiIndonesia(geoProvinsi),
              progressAwal: 0
            });
            if (kontroler3D) {
              if (typeof window !== 'undefined') {
                window.__kontrolerHero3D = kontroler3D;
              }
              // Pasang ScrollTrigger pin dan scrub: pecah saat scroll turun, menyatu saat scroll naik
              pasangScrollTriggerHeroDiorama({
                kontroler3D,
                elPembuka,
                elKonten,
                elPrompt
              });
            }
          }
        })
        .catch((err) => {
          // Jika gagal memuat modul 3D, fallback 2D SVG sudah tampil dengan aman
          console.warn('Gagal memuat modul 3D diorama, fallback 2D SVG tetap aktif:', err);
        });
    }
  }

  // Animasi standar teks hanya dipasang jika tidak masuk ke mode diorama 3D (misal fallback 2D)
  const barisJudul = document.querySelectorAll('#judul-s1 .h1-baris-dalam');

  pasangMatchMediaAnimasi({
    desktop: () => {
      if (elPembuka && elPembuka.classList.contains('has-diorama-mode')) return;

      if (barisJudul.length > 0) {
        gsap.fromTo(
          barisJudul,
          { yPercent: 100, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.12,
            clearProps: 'willChange'
          }
        );
      }

      if (wadahLatarPeta) {
        gsap.fromTo(
          wadahLatarPeta,
          { opacity: 0 },
          { opacity: 0.35, duration: 1.6, ease: 'power1.out' }
        );
      }
    },
    ponsel: () => {
      if (elPembuka && elPembuka.classList.contains('has-diorama-mode')) return;

      if (barisJudul.length > 0) {
        gsap.fromTo(
          barisJudul,
          { yPercent: 100, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.75,
            ease: 'power3.out',
            stagger: 0.1,
            clearProps: 'willChange'
          }
        );
      }

      if (wadahLatarPeta) {
        gsap.fromTo(
          wadahLatarPeta,
          { opacity: 0 },
          { opacity: 0.32, duration: 1.2, ease: 'power1.out' }
        );
      }
    },
    kurangiGerak: () => {
      if (barisJudul.length > 0) {
        gsap.set(barisJudul, { yPercent: 0, opacity: 1 });
      }
      if (wadahLatarPeta) {
        gsap.set(wadahLatarPeta, { opacity: 0.35 });
      }
    }
  });
}

