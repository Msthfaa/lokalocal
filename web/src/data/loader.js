/**
 * loader.js — Pemuat data bertahap dengan cache memori dan penanganan error ramah
 * Sesuai WEB_SPEC.md Bagian 2 & Bagian 13:
 * 1. Tahap awal: statistik.json, provinsi.json, geo/provinsi.geojson, meta.clean.json
 * 2. Tahap kedua (idle / IntersectionObserver mendekati Jelajah): budaya.clean.json, index-pencarian.json
 */

import { PATH_DATA } from '../config.js';

const cacheData = {
  awal: null,
  lengkap: null
};

let sedangMemuatAwal = null;
let sedangMemuatLengkap = null;

/**
 * Mengambil satu berkas JSON lokal dengan pesan error jelas berbahasa Indonesia.
 * @param {string} url
 * @param {string} namaBerkas
 */
async function ambilJson(url, namaBerkas) {
  let respons;
  try {
    respons = await fetch(url, { cache: 'default' });
  } catch (err) {
    throw new Error(`Koneksi gagal saat memuat ${namaBerkas} (${err.message || 'kesalahan jaringan'}).`);
  }

  if (!respons.ok) {
    throw new Error(`Berkas ${namaBerkas} tidak dapat dimuat (status HTTP ${respons.status}).`);
  }

  try {
    return await respons.json();
  } catch {
    throw new Error(`Format JSON pada berkas ${namaBerkas} tidak valid.`);
  }
}

/**
 * Memuat data tahap awal yang berukuran ringan untuk merender pembuka, cerita, peta, dan footer.
 * @param {boolean} paksaUlang - Jika true, abaikan cache (untuk tombol "Coba lagi")
 * @returns {Promise<{statistik: object, provinsi: Array, geoProvinsi: object, meta: object}>}
 */
export async function muatDataAwal(paksaUlang = false) {
  if (cacheData.awal && !paksaUlang) {
    return cacheData.awal;
  }

  if (sedangMemuatAwal && !paksaUlang) {
    return sedangMemuatAwal;
  }

  sedangMemuatAwal = (async () => {
    try {
      const [statistik, provinsi, geoProvinsi, meta] = await Promise.all([
        ambilJson(PATH_DATA.statistik, 'statistik.json'),
        ambilJson(PATH_DATA.provinsi, 'provinsi.json'),
        ambilJson(PATH_DATA.geoProvinsi, 'provinsi.geojson'),
        ambilJson(PATH_DATA.meta, 'meta.clean.json')
      ]);

      const hasil = { statistik, provinsi, geoProvinsi, meta };
      cacheData.awal = hasil;
      return hasil;
    } finally {
      sedangMemuatAwal = null;
    }
  })();

  return sedangMemuatAwal;
}

/**
 * Memuat data tahap kedua (rekaman lengkap budaya & indeks pencarian)
 * saat bagian Jelajah mendekati viewport atau saat browser idle.
 * @param {boolean} paksaUlang
 * @returns {Promise<{budaya: Array, indexPencarian: Array}>}
 */
export async function muatDataLengkap(paksaUlang = false) {
  if (cacheData.lengkap && !paksaUlang) {
    return cacheData.lengkap;
  }

  if (sedangMemuatLengkap && !paksaUlang) {
    return sedangMemuatLengkap;
  }

  sedangMemuatLengkap = (async () => {
    try {
      const [budaya, indexPencarian] = await Promise.all([
        ambilJson(PATH_DATA.budaya, 'budaya.clean.json'),
        ambilJson(PATH_DATA.indexPencarian, 'index-pencarian.json')
      ]);

      const hasil = { budaya, indexPencarian };
      cacheData.lengkap = hasil;
      return hasil;
    } finally {
      sedangMemuatLengkap = null;
    }
  })();

  return sedangMemuatLengkap;
}

/**
 * Menjadwalkan pemuatan data lengkap secara cerdas:
 * - Saat elemen target (mis. #jelajah) mendekati 400px dari viewport, ATAU
 * - Saat browser sedang idle (requestIdleCallback / fallback setTimeout 1800ms)
 *
 * @param {HTMLElement|null} elemenTarget
 * @param {(data: {budaya: Array, indexPencarian: Array}) => void} saatSelesai
 * @param {(err: Error) => void} saatGagal
 */
export function jadwalkanMuatDataLengkap(elemenTarget, saatSelesai, saatGagal) {
  let sudahDipicu = false;

  const picu = () => {
    if (sudahDipicu) return;
    sudahDipicu = true;
    muatDataLengkap()
      .then((data) => {
        if (typeof saatSelesai === 'function') saatSelesai(data);
      })
      .catch((err) => {
        if (typeof saatGagal === 'function') saatGagal(err);
      });
  };

  if (elemenTarget && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.disconnect();
            picu();
            break;
          }
        }
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(elemenTarget);
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => picu(), { timeout: 2500 });
  } else {
    window.setTimeout(() => picu(), 1800);
  }
}
