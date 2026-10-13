/**
 * config.js — Konfigurasi utama aplikasi web Lokalocal
 * Sesuai WEB_SPEC.md Bagian 1 & Bagian 13.
 */

export const NAMA_SITUS = 'Lokalocal';

export const PATH_DATA = {
  statistik: './data/statistik.json',
  provinsi: './data/provinsi.json',
  geoProvinsi: './data/geo/provinsi.geojson',
  meta: './data/meta.clean.json',
  budaya: './data/budaya.clean.json',
  indexPencarian: './data/index-pencarian.json',
  kabupaten: './data/kabupaten.json'
};

export const FITUR_OPSIONAL = {
  globe3D: true
};

export const DAFTAR_JENIS_OPK = [
  { kode: 'kerajinan', label: 'Kerajinan Tradisional', warnaVar: '--jenis-kerajinan' },
  { kode: 'seni', label: 'Seni Pertunjukan', warnaVar: '--jenis-seni' },
  { kode: 'lisan', label: 'Tradisi Lisan & Bahasa', warnaVar: '--jenis-lisan' },
  { kode: 'pengetahuan', label: 'Pengetahuan & Teknologi', warnaVar: '--jenis-pengetahuan' },
  { kode: 'adat', label: 'Adat, Ritus & Perayaan', warnaVar: '--jenis-adat' },
  { kode: 'cagar', label: 'Cagar Budaya', warnaVar: '--jenis-cagar' }
];
