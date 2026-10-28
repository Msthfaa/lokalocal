/**
 * ikon.js — Pustaka Ikonografi Vektor SVG Presisi (Zero-Emoji / Museum-Grade UI)
 * Menggunakan stroke 1.5px - 1.75px yang seragam, adaptif terhadap currentColor,
 * dan terukur proporsional untuk menggantikan seluruh emoji sistem operasi.
 */

function buatSvg(konten, ukuran = 16, viewBox = '0 0 24 24', kelas = '') {
  return `<svg width="${ukuran}" height="${ukuran}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="ikon-svg ${kelas}" aria-hidden="true" focusable="false">${konten}</svg>`;
}

/**
 * Ikon Pin Lokasi / Peta
 */
export function ikonPinLokasi(ukuran = 14, kelas = '') {
  return buatSvg(
    `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}

/**
 * Ikon Paspor / Dokumen / Stempel
 */
export function ikonPaspor(ukuran = 14, kelas = '') {
  return buatSvg(
    `<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><circle cx="12" cy="13" r="3"/><path d="M12 10v6"/><path d="M9 13h6"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}

/**
 * Ikon Bagikan / Berbagi / Node Share
 */
export function ikonBagikan(ukuran = 14, kelas = '') {
  return buatSvg(
    `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}

/**
 * Ikon Tautan Eksternal (Panah Keluar)
 */
export function ikonTautanEksternal(ukuran = 13, kelas = '') {
  return buatSvg(
    `<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}

/**
 * Ikon Centang Verifikasi / Sukses
 */
export function ikonCentang(ukuran = 14, kelas = '') {
  return buatSvg(
    `<polyline points="20 6 9 17 4 12"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}

/**
 * Ikon Pencarian / Kaca Pembesar
 */
export function ikonCari(ukuran = 14, kelas = '') {
  return buatSvg(
    `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}

/**
 * Ikon Kompas Penjelajah / Refleksi
 */
export function ikonKompas(ukuran = 20, kelas = '') {
  return buatSvg(
    `<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}

/**
 * Ikon Lentera / Cahaya
 */
export function ikonLentera(ukuran = 18, kelas = '') {
  return buatSvg(
    `<path d="M9 3h6"/><path d="M8 7h8"/><path d="M7 11h10"/><path d="M6 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7Z"/><line x1="12" y1="11" x2="12" y2="17"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}

/**
 * Ikon Kamera / Tur Sinematik
 */
export function ikonKamera(ukuran = 14, kelas = '') {
  return buatSvg(
    `<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}

/**
 * Ikon Putar / Reset Tampilan Peta
 */
export function ikonResetPutar(ukuran = 14, kelas = '') {
  return buatSvg(
    `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}

/**
 * Ikon Speaker / Suara Narasi
 */
export function ikonSpeaker(ukuran = 14, aktif = true, kelas = '') {
  if (aktif) {
    return buatSvg(
      `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>`,
      ukuran,
      '0 0 24 24',
      kelas
    );
  }
  return buatSvg(
    `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`,
    ukuran,
    '0 0 24 24',
    kelas
  );
}
