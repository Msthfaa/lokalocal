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

  // Animasi masuk halus untuk konten utama hero
  pasangMatchMediaAnimasi({
    desktop: () => {
      gsap.fromTo(
        '.hero-cinema-tengah',
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 1.1, delay: 0.2, ease: 'power3.out' }
      );
    },
    ponsel: () => {
      gsap.fromTo(
        '.hero-cinema-tengah',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.85, delay: 0.15, ease: 'power2.out' }
      );
    },
    kurangiGerak: () => {
      gsap.set('.hero-cinema-tengah', { opacity: 1, y: 0 });
    }
  });
}
