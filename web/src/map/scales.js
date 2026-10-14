/**
 * scales.js — Skala warna akar kuadrat (d3-scale scaleSqrt) dan pemetaan warna jenis budaya
 * Sesuai WEB_SPEC.md Bagian 5.2, 5.3, dan 6.1.
 */

import { scaleSqrt } from 'd3-scale';
import { DAFTAR_JENIS_OPK } from '../config.js';

// Warna heksadesimal sesuai tokens.css (untuk animasi GSAP pada atribut fill SVG)
export const WARNA_JENIS_HEX = {
  kerajinan: '#E07A4F',
  seni: '#E6B14A',
  lisan: '#8FA3E8',
  pengetahuan: '#7FB07A',
  adat: '#D983A8',
  cagar: '#A89F95'
};

// Gradien pastel lembut untuk kartu budaya ala Gambar 2 (Bagian 5.3 WEB_SPEC)
export const GRADIEN_JENIS_CSS = {
  kerajinan: 'linear-gradient(135deg, #FF9A6B, #FFD3B0)',
  seni: 'linear-gradient(135deg, #FFD36B, #FFF1B8)',
  lisan: 'linear-gradient(135deg, #A9B8FF, #E3E8FF)',
  pengetahuan: 'linear-gradient(135deg, #8FD3A0, #D6F2C8)',
  adat: 'linear-gradient(135deg, #FF9EC4, #FFD6E7)',
  cagar: 'linear-gradient(135deg, #CFC6BC, #F1ECE6)'
};

export const LABEL_JENIS = Object.fromEntries(
  DAFTAR_JENIS_OPK.map((j) => [j.kode, j.label])
);

// Rampa warna hangat 6 tahap (bukan linear, dipakai dengan scaleSqrt)
const RAMPA_JUMLAH = [
  '#2D231B', // 1 - 3 catatan
  '#4F3824', // 4 - 10 catatan
  '#7A522B', // 11 - 24 catatan
  '#A66E32', // 25 - 49 catatan
  '#CD8E3C', // 50 - 89 catatan
  '#E6B14A'  // 90+ catatan
];

/**
 * Menentukan kode jenis budaya dominan di sebuah provinsi.
 * Jika semua OPK = 0 namun ada Cagar Budaya, kembalikan 'cagar'.
 * @param {object} dataProv - Objek provinsi dari provinsi.json
 * @returns {{ kode: string, label: string, jumlah: number, warna: string } | null}
 */
export function cariJenisDominanProvinsi(dataProv) {
  if (!dataProv || dataProv.status_data === 'belum_tercatat' || dataProv.total <= 0) {
    return null;
  }

  const perJenis = dataProv.per_jenis_opk || {};
  const urutanPrioritas = ['kerajinan', 'seni', 'lisan', 'pengetahuan', 'adat'];

  let kodeTerbanyak = null;
  let nilaiTerbanyak = 0;

  for (const kode of urutanPrioritas) {
    const n = Number(perJenis[kode] || 0);
    if (n > nilaiTerbanyak) {
      nilaiTerbanyak = n;
      kodeTerbanyak = kode;
    }
  }

  if (kodeTerbanyak && nilaiTerbanyak > 0) {
    return {
      kode: kodeTerbanyak,
      label: LABEL_JENIS[kodeTerbanyak] || kodeTerbanyak,
      jumlah: nilaiTerbanyak,
      warna: WARNA_JENIS_HEX[kodeTerbanyak]
    };
  }

  const jumlahCb = Number(dataProv.per_kategori?.CB || 0);
  if (jumlahCb > 0) {
    return {
      kode: 'cagar',
      label: LABEL_JENIS.cagar,
      jumlah: jumlahCb,
      warna: WARNA_JENIS_HEX.cagar
    };
  }

  return {
    kode: 'seni',
    label: 'Catatan Budaya',
    jumlah: dataProv.total,
    warna: WARNA_JENIS_HEX.seni
  };
}

/**
 * Membuat fungsi pewarna berdasarkan skala akar kuadrat (scaleSqrt) dari 1 s.d. maksTotal.
 * @param {number} maksTotal
 */
export function buatSkalaSqrtJumlah(maksTotal = 119) {
  const batasAtas = Math.max(10, Number(maksTotal) || 119);
  const skala = scaleSqrt().domain([1, batasAtas]).range([0, RAMPA_JUMLAH.length - 1]).clamp(true);

  return function warnaDariJumlah(jumlah) {
    const n = Number(jumlah || 0);
    if (n <= 0) return null;
    const idx = Math.round(skala(n));
    return RAMPA_JUMLAH[Math.min(RAMPA_JUMLAH.length - 1, Math.max(0, idx))];
  };
}

/**
 * Menghasilkan daftar tangga legenda jumlah catatan dengan angka nyata.
 */
export function dapatkanTanggaLegendaJumlah() {
  return [
    { label: 'Belum tercatat', warna: 'arsir' },
    { label: '1–3', warna: RAMPA_JUMLAH[0] },
    { label: '4–10', warna: RAMPA_JUMLAH[1] },
    { label: '11–25', warna: RAMPA_JUMLAH[2] },
    { label: '26–60', warna: RAMPA_JUMLAH[3] },
    { label: '61–119 catatan', warna: RAMPA_JUMLAH[5] }
  ];
}

/**
 * Menghitung warna isian (fill) untuk satu provinsi sesuai mode peta:
 * - 'gelap-awal': semua provinsi gelap (#1E1916 atau pola arsir) sebelum menyala di S2
 * - 'jenis-dominan': warna jenis OPK terbanyak di provinsi tersebut (dipakai di S2)
 * - 'jumlah': skala sqrt dari total catatan (default di S5 Jelajah)
 * - 'per-jenis': skala sqrt dari jenis OPK tertentu
 * - 'cagar': skala sqrt dari jumlah Cagar Budaya
 *
 * @param {object} dataProv
 * @param {object} opsi
 * @param {string} opsi.mode
 * @param {string} [opsi.jenisKode]
 * @param {string} [opsi.idPolaArsir]
 * @param {number} [opsi.maksTotal]
 */
export function tentukanFillProvinsi(dataProv, opsi = {}) {
  const {
    mode = 'jumlah',
    jenisKode = 'kerajinan',
    idPolaArsir = 'pola-arsir-gelap',
    maksTotal = 119
  } = opsi;

  if (!dataProv || dataProv.status_data === 'belum_tercatat' || dataProv.total <= 0) {
    return `url(#${idPolaArsir})`;
  }

  if (mode === 'gelap-awal') {
    return '#1E1916';
  }

  if (mode === 'jenis-dominan') {
    const dom = cariJenisDominanProvinsi(dataProv);
    return dom ? dom.warna : '#1E1916';
  }

  if (mode === 'per-jenis') {
    const n = Number(dataProv.per_jenis_opk?.[jenisKode] || 0);
    if (n <= 0) return '#1E1916';
    return WARNA_JENIS_HEX[jenisKode] || '#E6B14A';
  }

  if (mode === 'cagar') {
    const n = Number(dataProv.per_kategori?.CB || 0);
    if (n <= 0) return '#1E1916';
    const skalaCb = buatSkalaSqrtJumlah(20);
    return skalaCb(n) || WARNA_JENIS_HEX.cagar;
  }

  const skalaJumlah = buatSkalaSqrtJumlah(maksTotal);
  return skalaJumlah(dataProv.total) || RAMPA_JUMLAH[0];
}
