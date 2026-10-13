/**
 * format.js — Utilitas pemformatan angka, persentase, dan tanggal bahasa Indonesia
 * Sesuai WEB_SPEC.md Bagian 12.
 */

const fmtAngkaBulat = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0
});

const fmtDesimalSatu = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
});

/**
 * Format angka bulat dengan titik pemisah ribuan (contoh: 1234 -> "1.234")
 * @param {number|null|undefined} nilai
 * @returns {string}
 */
export function formatAngka(nilai) {
  if (nilai === null || nilai === undefined || Number.isNaN(Number(nilai))) {
    return '0';
  }
  return fmtAngkaBulat.format(Number(nilai));
}

/**
 * Format angka desimal / persentase dengan koma Indonesia (contoh: 17.3 -> "17,3")
 * @param {number|null|undefined} nilai
 * @returns {string}
 */
export function formatDesimal(nilai) {
  if (nilai === null || nilai === undefined || Number.isNaN(Number(nilai))) {
    return '0';
  }
  return fmtDesimalSatu.format(Number(nilai));
}

/**
 * Format persentase lengkap dengan tanda % (contoh: 17.3 -> "17,3%")
 * @param {number|null|undefined} nilai
 * @returns {string}
 */
export function formatPersen(nilai) {
  return `${formatDesimal(nilai)}%`;
}
