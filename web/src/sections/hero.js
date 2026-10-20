/**
 * hero.js — Bagian S1 (Pembuka / Dashboard Cerita):
 * Latar sinematik berputar seperti video (alam & budaya Nusantara)
 * dengan tata letak modern mirip kartu referensi (Sunrock style),
 * dua kartu kaca mengambang (frosted glass) di sudut bawah,
 * dan tombol aksi pil elegan.
 */

import { inisialisasiHeroCinema } from './hero-cinema.js';
import { gsap, pasangMatchMediaAnimasi } from '../util/motion.js';
import { formatAngka } from '../util/format.js';

/**
 * Menginisialisasi bagian S1 Pembuka / Dashboard.
 * @param {object} dataAwal - { statistik, provinsi, geoProvinsi, meta }
 */
export function inisialisasiBagianHero({ statistik }) {
  const elPembuka = document.getElementById('pembuka');
  const wadahLatarPeta = document.getElementById('s1-latar-peta');
  const elTotalMentah = document.getElementById('stat-total-mentah');

  if (elTotalMentah && statistik) {
    elTotalMentah.textContent = formatAngka(statistik.total_rekaman);
  }

  // Inisialisasi latar belakang sinematik video-like alam & budaya nusantara
  if (wadahLatarPeta) {
    inisialisasiHeroCinema(wadahLatarPeta);
  }

  // Animasi masuk halus saat halaman pertama dimuat
  pasangMatchMediaAnimasi({
    desktop: () => {
      gsap.fromTo(
        ['#judul-s1', '#subjudul-s1', '.hero-cta-wadah'],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.0, delay: 0.2, stagger: 0.12, ease: 'power3.out' }
      );
    },
    ponsel: () => {
      gsap.fromTo(
        ['#judul-s1', '#subjudul-s1', '.hero-cta-wadah'],
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.15, stagger: 0.1, ease: 'power2.out' }
      );
    },
    kurangiGerak: () => {
      gsap.set(['#judul-s1', '#subjudul-s1', '.hero-cta-wadah'], { opacity: 1, y: 0 });
    }
  });

  // Animasi menghilang perlahan secara transparan saat discroll ke bawah (Scroll-driven Fade Out)
  if (elPembuka) {
    const elTengah = elPembuka.querySelector('.hero-cinema-tengah');
    const wadahLatar = document.getElementById('s1-latar-peta');
    let ticking = false;

    const perbaruiFadeScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      
      // 1. Teks dan tombol judul tengah menghilang mulus seiring scroll (0px - 240px)
      const batasTeks = Math.min(window.innerHeight * 0.45, 240);
      const progresTeks = Math.min(1, Math.max(0, y / batasTeks));
      const opasitasTeks = Math.max(0, 1 - progresTeks);

      if (elTengah) {
        elTengah.style.opacity = opasitasTeks.toFixed(3);
        elTengah.style.transform = `translateY(${(-36 * progresTeks).toFixed(1)}px)`;
        elTengah.style.pointerEvents = opasitasTeks < 0.12 ? 'none' : 'auto';
      }

      // 2. Latar belakang foto sinematik memudar bersih dan mulus saat discroll (0px - 440px)
      if (wadahLatar) {
        const batasLatar = Math.min(window.innerHeight * 0.72, 440);
        const progresLatar = Math.min(1, Math.max(0, y / batasLatar));
        // Kurva halus kuadratik agar awal scroll terasa sangat organik
        const opasitasLatar = Math.max(0, 1 - Math.pow(progresLatar, 1.25));
        wadahLatar.style.opacity = opasitasLatar.toFixed(3);
        wadahLatar.style.visibility = opasitasLatar <= 0.005 ? 'hidden' : 'visible';
      }

      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(perbaruiFadeScroll);
          ticking = true;
        }
      },
      { passive: true }
    );

    perbaruiFadeScroll();
  }
}
