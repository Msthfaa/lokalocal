/**
 * fallback.js — Pemeriksaan kemampuan perangkat & penanganan fallback 2D untuk Hero 3D
 * Sesuai spesifikasi TUGAS Bagian 8.
 */

import { apakahKurangiGerak } from '../../util/motion.js';

/**
 * Memeriksa apakah browser mendukung WebGL (WebGL2 atau WebGL 1).
 * Menggunakan probe ringan tanpa merusak konteks WebGL browser.
 * @returns {boolean}
 */
export function cekDukunganWebGL() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const probe = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (probe.getContext('webgl2') ||
        probe.getContext('webgl') ||
        probe.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Memeriksa apakah perangkat memenuhi syarat untuk memuat adegan 3D:
 * 1. Mendukung konteks WebGL
 * 2. Tidak menyalakan mode hemat data ekstrem (saveData)
 * 3. Hormati prefers-reduced-motion: reduce kecuali pada halaman khusus eksplorasi 3D
 *
 * @param {object} [opsi]
 * @param {boolean} [opsi.abaikanKurangiGerak=false]
 * @param {boolean} [opsi.abaikanSaveData=false]
 * @returns {boolean}
 */
export function apakahBisaMemuat3D(opsi = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  // 1. Periksa dukungan WebGL mendasar
  if (!cekDukunganWebGL()) {
    return false;
  }

  // 2. Periksa mode penghemat data pengguna (kecuali diabaikan untuk halaman 3D utama)
  const nav = window.navigator || {};
  if (!opsi.abaikanSaveData && nav.connection && nav.connection.saveData === true) {
    return false;
  }

  // 3. Hormati preferensi kurangi gerak (opsional untuk halaman khusus 3D)
  if (!opsi.abaikanKurangiGerak && apakahKurangiGerak()) {
    return false;
  }

  return true;
}

