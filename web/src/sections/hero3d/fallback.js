/**
 * fallback.js — Pemeriksaan kemampuan perangkat & penanganan fallback 2D untuk Hero 3D
 * Sesuai spesifikasi TUGAS Bagian 8.
 */

import { apakahKurangiGerak } from '../../util/motion.js';

/**
 * Memeriksa apakah perangkat memenuhi syarat untuk memuat Three.js dan adegan 3D:
 * 1. Tidak ada prefers-reduced-motion: reduce
 * 2. Tidak menyalakan mode hemat data (saveData)
 * 3. Bukan perangkat dengan CPU <= 4 DAN RAM <= 4
 * 4. Mendukung konteks WebGL
 *
 * @returns {boolean}
 */
export function apakahBisaMemuat3D() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  // 1. Hormati preferensi kurangi gerak
  if (apakahKurangiGerak()) {
    return false;
  }

  // 2. Periksa mode penghemat data pengguna
  const nav = window.navigator || {};
  if (nav.connection && nav.connection.saveData === true) {
    return false;
  }

  // 3. Periksa batas perangkat lemah (hardwareConcurrency <= 4 dan deviceMemory <= 4)
  const cpu = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 8;
  const ram = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 8;
  if (cpu <= 4 && ram <= 4) {
    return false;
  }

  // 4. Periksa kemampuan WebGL kanvas
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}
