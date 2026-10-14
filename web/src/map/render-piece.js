/**
 * render-piece.js — Menghasilkan visualisasi Top-Down (Aerial View) keping provinsi terpilih
 * Sesuai kebutuhan Zona Kiri (Inspeksi Geografis Provinsi):
 * Mengambil geometri poligon provinsi dari GeoJSON, memperbesarnya secara optimal (zoom in),
 * dan merender siluet keping daratan nusantara bertekstur lengkap dengan garis kontur & titik koordinat.
 */

import { geoMercator, geoPath } from 'd3-geo';

/**
 * Menghasilkan elemen SVG string keping pulau provinsi yang di-fit ke dimensi tertentu
 *
 * @param {object} feature - Fitur GeoJSON provinsi
 * @param {object} [opsi]
 * @param {number} [opsi.lebar=280]
 * @param {number} [opsi.tinggi=180]
 * @param {string} [opsi.warna='#4E935E']
 * @param {boolean} [opsi.adalahKosong=false]
 * @returns {string} SVG HTML string
 */
export function buatSvgPieceProvinsi(feature, opsi = {}) {
  if (!feature || !feature.geometry) {
    return `<div class="piece-svg-kosong">Data peta wilayah belum tersedia</div>`;
  }

  const lebar = opsi.lebar || 280;
  const tinggi = opsi.tinggi || 180;
  const padding = 16;
  const warna = opsi.warna || '#4E935E';
  const adalahKosong = Boolean(opsi.adalahKosong);

  // Proyeksikan keping geometri provinsi ini agar pas dan besar di dalam kanvas SVG
  const projection = geoMercator().fitExtent(
    [
      [padding, padding],
      [lebar - padding, tinggi - padding]
    ],
    feature
  );

  const pathGen = geoPath(projection);
  const d = pathGen(feature) || '';

  // Hitung titik tengah daratan utama untuk penanda
  let cx = lebar / 2;
  let cy = tinggi / 2;
  const centroid = pathGen.centroid(feature);
  if (centroid && Number.isFinite(centroid[0]) && Number.isFinite(centroid[1])) {
    cx = centroid[0];
    cy = centroid[1];
  }

  const idPattern = `pola-grid-${feature.properties?.kode || 'prov'}`;

  return `
    <svg
      viewBox="0 0 ${lebar} ${tinggi}"
      class="piece-provinsi-svg"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Siluet Geografis Provinsi ${feature.properties?.nama || ''}"
    >
      <defs>
        <!-- Pola Grid Koordinat Taktis -->
        <pattern id="${idPattern}" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="0.75" />
        </pattern>

        <!-- Efek Bayangan Keping Pulau -->
        <filter id="shadow-piece" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="rgba(0, 0, 0, 0.45)" />
        </filter>

        <!-- Gradien Pencahayaan Pulau -->
        <linearGradient id="grad-pulau" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${warna}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${warna}" stop-opacity="0.65" />
        </linearGradient>
      </defs>

      <!-- Background Ruang Angkasa / Grid Taktis -->
      <rect width="100%" height="100%" fill="rgba(10, 16, 26, 0.55)" rx="14" />
      <rect width="100%" height="100%" fill="url(#${idPattern})" rx="14" />

      <!-- Siluet Keping Pulau Provinsi -->
      <g filter="url(#shadow-piece)">
        <path
          d="${d}"
          fill="url(#grad-pulau)"
          stroke="${adalahKosong ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 225, 140, 0.65)'}"
          stroke-width="1.25"
          stroke-linejoin="round"
          class="piece-path-pulau"
        />
      </g>

      <!-- Titik Pin Daratan Utama -->
      <g transform="translate(${cx}, ${cy})">
        <circle r="9" fill="none" stroke="#FFBE3B" stroke-width="1.2" opacity="0.65" class="piece-pulse-ring" />
        <circle r="4.5" fill="#FFBE3B" />
        <circle r="1.8" fill="#14110F" />
      </g>

      <!-- Label Koordinat Sudut -->
      <text x="12" y="20" fill="rgba(255,255,255,0.45)" font-size="9" font-family="monospace">
        AERIAL PIECE VIEW • KODE ${feature.properties?.kode || ''}
      </text>
    </svg>
  `;
}
