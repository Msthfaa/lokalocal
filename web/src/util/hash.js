/**
 * hash.js — Fungsi hash deterministik sederhana (FNV-1a 32-bit)
 * Digunakan untuk membangkitkan seed pola generatif SVG dari ID rekaman/kode provinsi.
 */

/**
 * Menghasilkan bilangan bulat positif 32-bit deterministik dari string.
 * @param {string} str
 * @returns {number}
 */
export function hashString(str) {
  const input = String(str || 'atlasbudaya');
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
