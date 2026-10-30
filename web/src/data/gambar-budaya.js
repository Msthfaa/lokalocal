/**
 * gambar-budaya.js — Layanan Foto Dokumentasi Budaya Real-time (Wikimedia Commons API) & Fallback Tenun SVG
 *
 * Menerapkan Opsi 3:
 * 1. Peta Kurasi Lokal: Menyimpan URL foto asli Wikipedia/Wikimedia Commons yang sudah terverifikasi akurat 100%.
 * 2. Fetch Real-Time Wikipedia Indonesia Action API (CORS-friendly):
 *    Mencari foto dokumentasi resmi berlisensi Creative Commons saat kartu dibuka.
 * 3. Fallback Tenun/Batik Generatif SVG:
 *    Jika tidak ditemukan dokumentasi foto resmi (seperti tradisi lokal kabupaten),
 *    kartu menampilkan ornamen Tenun/Batik SVG beridentitas budaya asli (bebas dari foto stok palsu).
 */

import kamusKurasi from './foto-wikimedia-kurasi.json';

// In-memory cache untuk query real-time agar tidak ada request ganda
const cacheMemory = new Map();

/**
 * Mendapatkan URL foto terverifikasi secara instan dari kamus lokal.
 *
 * @param {object} rekaman - Objek budaya
 * @returns {string|null} URL foto asli Wikimedia atau null jika belum ada
 */
export function dapatkanGambarBudaya(rekaman) {
  if (!rekaman) return null;
  const id = rekaman.id;
  if (id && kamusKurasi[id]?.fotoUrl) {
    return kamusKurasi[id].fotoUrl;
  }
  return null;
}

/**
 * Mencari foto dokumentasi nyata secara real-time dari API Wikimedia Commons / Wikipedia Indonesia.
 * Menggunakan sistem cache memori dan sessionStorage peramban.
 *
 * @param {object} rekaman - Objek data budaya (memuat id, nama, provinsi, dll.)
 * @returns {Promise<{ url: string, title: string, sumber: string }|null>}
 */
export async function ambilFotoWikimediaRealtime(rekaman) {
  if (!rekaman) return null;
  const id = rekaman.id;
  const nama = rekaman.nama || rekaman.nama_tampil || '';

  // 1. Cek kamus lokal terverifikasi
  if (id && kamusKurasi[id]?.fotoUrl) {
    return {
      url: kamusKurasi[id].fotoUrl,
      title: kamusKurasi[id].wikiTitle || nama,
      sumber: 'Wikimedia Commons'
    };
  }

  // 2. Cek cache in-memory
  if (cacheMemory.has(nama)) {
    return cacheMemory.get(nama);
  }

  // 3. Cek sessionStorage peramban
  const cacheKey = `lklc_wiki_${id || nama}`;
  try {
    const tersimpan = sessionStorage.getItem(cacheKey);
    if (tersimpan) {
      const parsed = JSON.parse(tersimpan);
      cacheMemory.set(nama, parsed);
      return parsed;
    }
  } catch {
    // Abaikan jika storage dinonaktifkan
  }

  // 4. Bersihkan nama untuk query Wikipedia
  const namaBersih = nama
    .replace(/#NAME\?/gi, '')
    .replace(/\([^)]*\)/g, '')
    .trim();

  if (!namaBersih || namaBersih.length < 3) {
    cacheMemory.set(nama, null);
    return null;
  }

  // 5. Query Wikimedia Commons / Wikipedia Action API
  const url = `https://id.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&pithumbsize=600&redirects=1&titles=${encodeURIComponent(namaBersih)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 detik batas tunggu

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Api-User-Agent': 'LokalocalAtlasBudaya/1.0 (https://github.com/Msthfaa/lokalocal)'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      cacheMemory.set(nama, null);
      return null;
    }

    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});
    const first = pages[0];

    if (first && first.thumbnail?.source && !first.missing) {
      const hasil = {
        url: first.thumbnail.source,
        title: first.title,
        sumber: 'Wikimedia Commons'
      };
      cacheMemory.set(nama, hasil);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(hasil));
      } catch {}
      return hasil;
    }
  } catch {
    // Timeout atau offline
  }

  // Jika tidak ditemukan di Wikipedia, tandai null agar fallback ke Tenun SVG
  cacheMemory.set(nama, null);
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(null));
  } catch {}
  return null;
}
