/**
 * fallback.js — Pemeriksaan kemampuan perangkat & penanganan fallback 2D untuk Hero 3D
 * Sesuai spesifikasi TUGAS Bagian 8.
 */

import { apakahKurangiGerak } from '../../util/motion.js';

let cacheDukunganWebGL = null;

/**
 * Memeriksa apakah browser mendukung WebGL (WebGL2 atau WebGL 1).
 * Menggunakan cache dan segera melepaskan konteks probe agar tidak memakan kuota WebGL browser.
 * @returns {boolean}
 */
export function cekDukunganWebGL() {
  if (cacheDukunganWebGL !== null) {
    return cacheDukunganWebGL;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    const probe = document.createElement('canvas');
    const gl =
      probe.getContext('webgl2') ||
      probe.getContext('webgl') ||
      probe.getContext('experimental-webgl');

    if (!gl) {
      cacheDukunganWebGL = false;
      return false;
    }

    // Segera lepaskan konteks probe agar tidak bocor dan tidak memakan kuota konteks aktif browser
    const extLose = gl.getExtension('WEBGL_lose_context');
    if (extLose) {
      extLose.loseContext();
    }

    cacheDukunganWebGL = true;
    return true;
  } catch {
    cacheDukunganWebGL = false;
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

  // 2. Periksa mode penghemat data pengguna
  const nav = window.navigator || {};
  if (nav.connection && nav.connection.saveData === true) {
    return false;
  }

  // 3. Hormati preferensi kurangi gerak (opsional untuk halaman khusus 3D)
  if (!opsi.abaikanKurangiGerak && apakahKurangiGerak()) {
    return false;
  }

  return true;
}
