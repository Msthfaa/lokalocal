/**
 * teks.js (util) — Pemecah kalimat aman singkatan & normalisasi pencarian teks
 * Sesuai DATA_SPEC.md C-09 & WEB_SPEC.md Bagian 4.3, 13.
 */

const SINGKATAN_AMAN = new Set([
  'kab', 'kec', 'kel', 'ds', 'kp', 'dr', 'drs', 'ir', 'prof', 'hj', 'h',
  'ny', 'tn', 'st', 'mt', 'sh', 'mh', 'se', 'mm', 'msc', 'phd', 'no', 'hlm',
  'hal', 'dll', 'dsb', 'dst', 'dkk', 'al', 'vol', 'ed', 'cet', 'th', 'thn',
  'ab', 'sm', 'm', 'rp', 'pt', 'cv', 'ud', 'tbk', 'jl', 'jln', 'gg', 'rt', 'rw'
]);

/**
 * Memecah teks deskripsi panjang menjadi array kalimat tanpa salah memotong
 * pada singkatan umum bahasa Indonesia (Kab., Kec., Dr., dll.).
 * @param {string} teks
 * @returns {string[]}
 */
export function pecahKalimatAman(teks) {
  if (!teks || typeof teks !== 'string') return [];
  const bersih = teks.replace(/\s+/g, ' ').trim();
  if (!bersih) return [];

  const hasil = [];
  let buffer = '';
  const token = bersih.split(' ');

  for (let i = 0; i < token.length; i++) {
    const kata = token[i];
    buffer = buffer ? `${buffer} ${kata}` : kata;

    if (/[.!?]["'”’)]*$/.test(kata)) {
      const tanpaTanda = kata.replace(/[.!?,"'”’()[\]]+/g, '').toLowerCase();
      const adalahSingkatan = SINGKATAN_AMAN.has(tanpaTanda);
      const adalahInisialTunggal = /^[a-z]$/i.test(tanpaTanda);
      const adalahAngkaPenomoran = /^\d+$/.test(tanpaTanda) && buffer.length < 6;

      const kataBerikut = token[i + 1] || '';
      const diawaliKapitalBerikut = /^[A-Z0-9"“‘(]/.test(kataBerikut);

      if (!adalahSingkatan && !adalahInisialTunggal && !adalahAngkaPenomoran && (diawaliKapitalBerikut || i === token.length - 1)) {
        hasil.push(buffer.trim());
        buffer = '';
      }
    }
  }

  if (buffer.trim()) {
    hasil.push(buffer.trim());
  }

  return hasil;
}

/**
 * Mengelompokkan kalimat-kalimat deskripsi menjadi paragraf berisi 3-4 kalimat
 * agar nyaman dibaca pada dialog detail (WEB_SPEC.md Bagian 4.3).
 * @param {string} teks
 * @param {number} kalimatPerParagraf
 * @returns {string[]}
 */
export function pecahParagrafDeskripsi(teks, kalimatPerParagraf = 3) {
  const kalimat = pecahKalimatAman(teks);
  if (kalimat.length === 0) return [];
  const paragraf = [];
  for (let i = 0; i < kalimat.length; i += kalimatPerParagraf) {
    paragraf.push(kalimat.slice(i, i + kalimatPerParagraf).join(' '));
  }
  return paragraf;
}

/**
 * Normalisasi string untuk pencarian: huruf kecil, tanpa diakritik, spasi tunggal.
 * @param {string} str
 * @returns {string}
 */
export function normalisasiPencarian(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
