/**
 * build-lights.js — Sistem Lampu Malam Nusantara (Night City Lights)
 * Menampilkan ratusan titik cahaya gemerlap kota & perkampungan nusantara
 * yang terikat langsung di atas permukaan daratan keping provinsi, sehingga
 * ikut terangkat secara sempurna saat provinsi dipilih.
 */

import {
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  CanvasTexture,
  Color,
  AdditiveBlending,
  Group
} from 'three';
import { SKALA_DUNIA, KETEBALAN_EXTRUDE } from './build-provinces.js';
import { hashString } from '../../util/hash.js';

/**
 * Pseudo-random generator deterministik
 * @param {number} seed
 * @returns {number} 0..1
 */
function prng(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Pengujian titik di dalam poligon (Ray-Casting Algorithm)
 * Menjamin semua lampu berada tepat di daratan pulau, tidak di laut
 * @param {number} px
 * @param {number} py
 * @param {Array<[number, number]>} ring
 * @returns {boolean}
 */
function pointInPolygon(px, py, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Membuat tekstur lingkaran halo berpendar lembut untuk partikel lampu malam
 * @returns {THREE.CanvasTexture|null}
 */
function buatTeksturLampuMalam() {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.25, 'rgba(255, 235, 150, 0.95)');
  grad.addColorStop(0.55, 'rgba(255, 180, 70, 0.55)');
  grad.addColorStop(0.85, 'rgba(255, 140, 40, 0.15)');
  grad.addColorStop(1, 'rgba(255, 140, 40, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  return new CanvasTexture(canvas);
}

/**
 * Membangun sistem titik-titik lampu malam yang terikat langsung pada masing-masing keping provinsi
 *
 * @param {object} parameter
 * @param {object} parameter.geoProvinsi - FeatureCollection 38 provinsi
 * @param {object} parameter.proyeksi - Hasil buatProyeksiIndonesia(geoProvinsi)
 * @param {Map<string, THREE.Mesh>} parameter.petaMeshByKode - Map kode ke Mesh provinsi
 * @returns {object} API pengontrol lampu malam
 */
export function bangunLampuMalamNusantara({ geoProvinsi, proyeksi, petaMeshByKode }) {
  const features = geoProvinsi?.features || [];
  const warnaLampuPilihan = [
    new Color('#FFEBB0'), // Kuning emas pijar hangat
    new Color('#FFD680'), // Emas jingga lembut
    new Color('#FFF8E7'), // Putih hangat
    new Color('#FFAE52'), // Jingga kota
    new Color('#FFE39F')  // Kuning fajar
  ];

  const texture = buatTeksturLampuMalam();
  const sharedMaterial = new PointsMaterial({
    size: 0.058,
    vertexColors: true,
    map: texture || undefined,
    transparent: true,
    opacity: 0.0, // Awalnya mati (siang hari)
    blending: AdditiveBlending,
    depthWrite: false
  });

  const daftarGeometri = [];
  const daftarPoints = [];
  let totalTitik = 0;

  for (const feature of features) {
    const kode = String(feature.properties?.kode || '');
    const meshProvinsi = petaMeshByKode?.get(kode);
    if (!meshProvinsi) continue;

    const multi =
      feature.geometry.type === 'MultiPolygon'
        ? feature.geometry.coordinates
        : [feature.geometry.coordinates];

    const seed = hashString(kode);
    const positions = [];
    const colors = [];

    // Pusat keping pulau di ruang lokal grup provinsi
    const posXMesh = meshProvinsi.position.x;
    const posZMesh = meshProvinsi.position.z;

    // Ketinggian permukaan atas tanah pulau di ruang lokal mesh
    if (!meshProvinsi.geometry.boundingBox) {
      meshProvinsi.geometry.computeBoundingBox();
    }
    const maxYLokal = meshProvinsi.geometry.boundingBox?.max?.y ?? (KETEBALAN_EXTRUDE * 0.5);
    // Tepat di atas tanah pulau (hanya selisih 0.0025 unit agar bebas z-fighting)
    const lokalY = maxYLokal + 0.0025;

    for (let pIdx = 0; pIdx < multi.length; pIdx++) {
      const poligon = multi[pIdx];
      if (!poligon[0] || poligon[0].length < 3) continue;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const titikLuar = poligon[0].map((pt) => {
        const p = proyeksi.projection(pt);
        const x = (p[0] - 500) * SKALA_DUNIA;
        const y = -(p[1] - 200) * SKALA_DUNIA;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        return [x, y];
      });

      const rentangX = maxX - minX;
      const rentangY = maxY - minY;
      if (rentangX < 0.035 && rentangY < 0.035) continue;

      // Hitung kuota titik lampu sebanding dengan luas daratan pulau
      const areaPerkiraan = rentangX * rentangY;
      const kuotaTitik = Math.max(2, Math.min(24, Math.round(areaPerkiraan * 34)));

      let terkumpul = 0;
      let percobaan = 0;
      while (terkumpul < kuotaTitik && percobaan < 120) {
        percobaan++;
        const sX = minX + prng(seed + pIdx * 97 + percobaan * 13) * rentangX;
        const sY = minY + prng(seed + pIdx * 97 + percobaan * 29) * rentangY;

        if (pointInPolygon(sX, sY, titikLuar)) {
          // Posisi 3D lokal tepat menempel di daratan pulau
          const lokalX = sX - posXMesh;
          const lokalZ = -sY - posZMesh;

          positions.push(lokalX, lokalY, lokalZ);

          // Rona variasi warna lampu malam
          const wIdx = Math.floor(prng(seed + percobaan * 7) * warnaLampuPilihan.length);
          const col = warnaLampuPilihan[wIdx];
          colors.push(col.r, col.g, col.b);

          terkumpul++;
          totalTitik++;
        }
      }
    }

    if (positions.length > 0) {
      const geo = new BufferGeometry();
      geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new Float32BufferAttribute(colors, 3));

      const points = new Points(geo, sharedMaterial);
      points.name = `lampu-malam-${kode}`;
      meshProvinsi.add(points);

      daftarGeometri.push(geo);
      daftarPoints.push(points);
    }
  }

  let targetOpacity = 0.0;
  let currentOpacity = 0.0;

  function setModeWaktu(mode) {
    targetOpacity = mode === 'malam' ? 0.95 : 0.0;
    const tampak = mode === 'malam';
    for (let i = 0; i < daftarPoints.length; i++) {
      daftarPoints[i].visible = tampak;
    }
  }

  function update(tDetik) {
    currentOpacity += (targetOpacity - currentOpacity) * 0.055;

    if (currentOpacity > 0.005) {
      sharedMaterial.opacity = currentOpacity * (0.80 + Math.sin(tDetik * 2.8) * 0.20);
      for (let i = 0; i < daftarPoints.length; i++) {
        daftarPoints[i].visible = true;
      }
    } else {
      sharedMaterial.opacity = 0;
      for (let i = 0; i < daftarPoints.length; i++) {
        daftarPoints[i].visible = false;
      }
    }
  }

  function dispose() {
    for (let i = 0; i < daftarGeometri.length; i++) {
      daftarGeometri[i].dispose();
    }
    sharedMaterial.dispose();
    if (texture) texture.dispose();
  }

  return {
    setModeWaktu,
    update,
    dispose,
    totalTitik
  };
}
