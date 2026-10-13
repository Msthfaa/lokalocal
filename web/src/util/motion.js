/**
 * motion.js — Utilitas animasi GSAP + ScrollTrigger & penanganan prefers-reduced-motion
 * Sesuai WEB_SPEC.md Bagian 7.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { formatAngka } from './format.js';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/**
 * Mengecek apakah pengguna mengaktifkan preferensi kurangi gerakan (prefers-reduced-motion: reduce).
 * @returns {boolean}
 */
export function apakahKurangiGerak() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Membungkus animasi GSAP dalam gsap.matchMedia() agar otomatis menyesuaikan:
 * - prefers-reduced-motion: reduce -> tanpa pin, tanpa gerak, langsung keadaan akhir
 * - desktop (min-width: 769px) vs ponsel (max-width: 768px)
 *
 * @param {object} handler
 * @param {() => void} [handler.desktop]
 * @param {() => void} [handler.ponsel]
 * @param {() => void} [handler.kurangiGerak]
 */
export function pasangMatchMediaAnimasi({ desktop, ponsel, kurangiGerak }) {
  const mm = gsap.matchMedia();

  mm.add(
    {
      isDesktop: '(min-width: 769px)',
      isMobile: '(max-width: 768px)',
      reduceMotion: '(prefers-reduced-motion: reduce)'
    },
    (context) => {
      const { isDesktop, isMobile, reduceMotion } = context.conditions;

      if (reduceMotion) {
        if (typeof kurangiGerak === 'function') {
          kurangiGerak();
        }
        return;
      }

      if (isDesktop && typeof desktop === 'function') {
        desktop();
      } else if (isMobile && typeof ponsel === 'function') {
        ponsel();
      }
    }
  );

  return mm;
}

/**
 * Menganimasikan penghitung angka naik (count-up A-04) dari 0 ke nilaiAkhir
 * menggunakan format ribuan Indonesia, serta menghormati prefers-reduced-motion.
 *
 * @param {HTMLElement} elemenAngkaVisual
 * @param {number} nilaiAkhir
 * @param {number} [durasi=1.6]
 */
export function animasiHitungAngka(elemenAngkaVisual, nilaiAkhir, durasi = 1.6) {
  if (!elemenAngkaVisual) return null;
  const target = Number(nilaiAkhir || 0);

  if (apakahKurangiGerak()) {
    elemenAngkaVisual.textContent = formatAngka(target);
    return null;
  }

  const state = { nilai: 0 };
  return gsap.to(state, {
    nilai: target,
    duration: durasi,
    ease: 'power2.out',
    onUpdate: () => {
      elemenAngkaVisual.textContent = formatAngka(Math.round(state.nilai));
    }
  });
}

/**
 * Menyegarkan perhitungan posisi ScrollTrigger setelah DOM dan font siap.
 */
export function segarkanScrollTrigger() {
  ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }
}
