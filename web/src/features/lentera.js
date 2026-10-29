/**
 * lentera.js — Logika Pengelolaan Lentera Pendataan Virtual (10 Provinsi Belum Berdata)
 * Mengelola penyimpanan empati pengunjung di localStorage ('lokalocal:lentera:v1').
 * Memberikan dorongan moral, kepedulian dokumentasi budaya, dan visual cahaya hangat.
 */

import { bunyikanKendangThung, bunyikanGong } from './karawitan-synth.js';
import { tampilkanToast } from '../ui/toast.js';

export const KUNCI_STORAGE_LENTERA = 'lokalocal:lentera:v1';

// 10 Provinsi yang berstatus belum memiliki rekaman di SPKT
export const KODE_PROVINSI_GELAP = [
  '14', // Riau
  '21', // Kepulauan Riau
  '52', // Nusa Tenggara Barat
  '72', // Sulawesi Tengah (cek spesifikasi data)
  '76', // Sulawesi Barat
  '71', // Sulawesi Utara
  '81', // Maluku
  '92', // Papua Barat
  '93', // Papua Selatan
  '94', // Papua Tengah
  '95', // Papua Pegunungan
  '96'  // Papua Barat Daya
];

let memoriLentera = {};
let storageTersedia = true;
const pendengarLentera = new Set();

function muatLenteraDariStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      storageTersedia = false;
      return {};
    }
    const raw = window.localStorage.getItem(KUNCI_STORAGE_LENTERA);
    if (!raw) {
      memoriLentera = {};
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      memoriLentera = { ...parsed };
      return memoriLentera;
    }
    memoriLentera = {};
    return {};
  } catch {
    storageTersedia = false;
    return {};
  }
}

function simpanLenteraKeStorage(dataBaru) {
  memoriLentera = { ...dataBaru };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(KUNCI_STORAGE_LENTERA, JSON.stringify(memoriLentera));
    }
  } catch {
    storageTersedia = false;
  }
}

function beritahuSemua(info = null) {
  const salinan = { ...memoriLentera };
  for (const fn of pendengarLentera) {
    try {
      fn(salinan, info);
    } catch (e) {
      console.warn('[Lentera] Error pada pendengar:', e);
    }
  }
}

// Inisialisasi awal
muatLenteraDariStorage();

/**
 * Memeriksa apakah lentera untuk provinsi tertentu sudah dinyalakan.
 */
export function apakahLenteraMenyala(kode) {
  const k = String(kode || '').trim();
  return Boolean(memoriLentera[k]);
}

/**
 * Menyalakan lentera untuk provinsi tertentu.
 */
export function nyalakanLentera(kode, namaProvinsi = '') {
  const k = String(kode || '').trim();
  if (!k) return { berhasil: false, baru: false, total: hitungTotalLenteraMenyala() };

  muatLenteraDariStorage();
  const sudahAda = Boolean(memoriLentera[k]);

  if (!sudahAda) {
    memoriLentera[k] = {
      t: Date.now(),
      nama: namaProvinsi || `Provinsi ${k}`
    };
    simpanLenteraKeStorage(memoriLentera);

    // Feedback audio sakral & taktil
    bunyikanKendangThung(0.65);
    setTimeout(() => {
      bunyikanGong(0.7);
    }, 180);

    const total = hitungTotalLenteraMenyala();
    tampilkanToast(`Lentera untuk ${namaProvinsi || 'provinsi ini'} berhasil dinyalakan.`);

    beritahuSemua({
      aksi: 'nyalakan',
      kode: k,
      baru: true,
      total
    });

    return { berhasil: true, baru: true, total };
  }

  return { berhasil: true, baru: false, total: hitungTotalLenteraMenyala() };
}

/**
 * Menghitung berapa banyak lentera yang telah dinyalakan pengunjung.
 */
export function hitungTotalLenteraMenyala() {
  muatLenteraDariStorage();
  return Object.keys(memoriLentera).length;
}

/**
 * Mendapatkan daftar kode provinsi yang lenteranya sudah menyala.
 */
export function daftarLenteraMenyala() {
  muatLenteraDariStorage();
  return Object.keys(memoriLentera);
}

/**
 * Mendaftarkan fungsi callback saat status lentera berubah.
 */
export function langgananLentera(callback) {
  if (typeof callback === 'function') {
    pendengarLentera.add(callback);
    return () => pendengarLentera.delete(callback);
  }
  return () => {};
}
