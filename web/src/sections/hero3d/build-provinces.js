/**
 * build-provinces.js — Pembuatan 38 keping provinsi 3D bergaya mainan/diorama low-poly
 * Geometri bersih, bebas retakan vertex, dengan ketebalan balok diorama yang proporsional.
 * Sesuai spesifikasi TUGAS Bagian 4, 5, dan 6.
 */

import {
  Shape,
  Path,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Mesh,
  Group,
  Vector3,
  Color
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WARNA_JENIS_HEX } from '../../map/scales.js';
import { hashString } from '../../util/hash.js';

// Skala konversi pixel SVG (1000 x 400) ke unit dunia 3D (~10 unit lebar)
export const SKALA_DUNIA = 10 / 880;
// Ketebalan ekstrusi proporsional: 0.18 unit (tidak terlalu tebal sehingga pulau kecil tidak menjadi tiang tinggi)
export const KETEBALAN_EXTRUDE = 0.18;

const WARNA_NATURAL_BERDATA = '#7DB35F';
const WARNA_NATURAL_BELUM = '#4A4F5C';

/**
 * Pseudo-random generator deterministik berbasis seed integer
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
 * Membangun 38 mesh keping provinsi dari data GeoJSON dan data ringkasan provinsi.
 *
 * @param {object} parameter
 * @param {object} parameter.geoProvinsi - FeatureCollection 38 provinsi
 * @param {Array} parameter.daftarProvinsi - 38 data provinsi dari provinsi.json
 * @param {object} parameter.proyeksi - Hasil buatProyeksiIndonesia(geoProvinsi)
 * @param {'natural'|'data'} [parameter.modeAwal='natural']
 * @returns {{ grup: Group, daftarMesh: Array<Mesh>, petaMeshByKode: Map<string, Mesh> }}
 */
export function bangunKepingProvinsi({
  geoProvinsi,
  daftarProvinsi = [],
  proyeksi,
  modeAwal = 'natural'
}) {
  const petaDataProv = new Map(daftarProvinsi.map((p) => [String(p.kode), p]));
  const grupProvinsi = new Group();
  grupProvinsi.name = 'grup-keping-provinsi';

  const daftarMesh = [];
  const petaMeshByKode = new Map();

  const features = geoProvinsi.features || [];

  // 1. Ekstrusi setiap fitur provinsi menjadi geometri
  for (const feature of features) {
    const kode = String(feature.properties?.kode || '');
    const nama = String(feature.properties?.nama || '');
    const info = petaDataProv.get(kode);

    const belumTercatat = !info || info.status_data === 'belum_tercatat' || (info.total || 0) <= 0;
    const warnaNaturalHex = belumTercatat ? WARNA_NATURAL_BELUM : WARNA_NATURAL_BERDATA;

    let warnaDataHex = WARNA_NATURAL_BELUM;
    if (!belumTercatat) {
      const jenisDominan = info.jenis_dominan || 'kerajinan';
      warnaDataHex = WARNA_JENIS_HEX[jenisDominan] || '#E6B14A';
    }

    const multi =
      feature.geometry.type === 'MultiPolygon'
        ? feature.geometry.coordinates
        : [feature.geometry.coordinates];

    const daftarGeometriBagian = [];

    for (const poligon of multi) {
      if (!poligon[0] || poligon[0].length < 3) continue;

      // Filter pulau mikro degenerate agar tidak menjadi jarum/pilar runcing
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

      // Abaikan pulau mikro yang rentang ukurannya lebih kecil dari 0.015 unit
      const rentangX = maxX - minX;
      const rentangY = maxY - minY;
      if (rentangX < 0.015 && rentangY < 0.015) {
        continue;
      }

      const shape = new Shape();
      shape.moveTo(titikLuar[0][0], titikLuar[0][1]);
      for (let i = 1; i < titikLuar.length; i++) {
        shape.lineTo(titikLuar[i][0], titikLuar[i][1]);
      }

      // Lubang jika ada (danau/teluk tertutup)
      for (let h = 1; h < poligon.length; h++) {
        const holePts = poligon[h].map((pt) => {
          const p = proyeksi.projection(pt);
          const x = (p[0] - 500) * SKALA_DUNIA;
          const y = -(p[1] - 200) * SKALA_DUNIA;
          return [x, y];
        });
        if (holePts.length >= 3) {
          const holePath = new Path();
          holePath.moveTo(holePts[0][0], holePts[0][1]);
          for (let i = 1; i < holePts.length; i++) {
            holePath.lineTo(holePts[i][0], holePts[i][1]);
          }
          shape.holes.push(holePath);
        }
      }

      // Ekstrusi dengan bevel mikro bersih (0.01 unit) agar tepi halus tanpa self-intersect
      const geomExtrude = new ExtrudeGeometry(shape, {
        depth: KETEBALAN_EXTRUDE,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.012,
        bevelSegments: 1
      });

      daftarGeometriBagian.push(geomExtrude);
    }

    if (daftarGeometriBagian.length === 0) continue;

    // Gabungkan multi-poligon kepulauan menjadi satu BufferGeometry
    let geomAkhir =
      daftarGeometriBagian.length === 1
        ? daftarGeometriBagian[0]
        : mergeGeometries(daftarGeometriBagian, false);

    // Putar -90 derajat pada sumbu X agar permukaan 2D berada di bidang horizontal (X-Z)
    // dan ketebalan ekstrusi mengarah ke atas (+Y)
    geomAkhir.rotateX(-Math.PI / 2);
    geomAkhir.computeVertexNormals();

    // Pivot: geser geometri sehingga pusatnya tepat di (0,0,0) lokal
    geomAkhir.computeBoundingBox();
    const pusatAsal = new Vector3();
    geomAkhir.boundingBox.getCenter(pusatAsal);
    geomAkhir.translate(-pusatAsal.x, -pusatAsal.y, -pusatAsal.z);

    // Material low-poly flat shaded yang bersih dan cerah
    const warnaAwalHex = modeAwal === 'data' ? warnaDataHex : warnaNaturalHex;
    const material = new MeshStandardMaterial({
      color: new Color(warnaAwalHex),
      roughness: 0.82,
      metalness: 0.02,
      flatShading: true
    });

    const mesh = new Mesh(geomAkhir, material);
    mesh.name = `provinsi-${kode}`;
    mesh.position.copy(pusatAsal);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Parameter acak deterministik untuk gerak "pecah" (spesifikasi Bagian 6)
    const r = Math.sqrt(pusatAsal.x * pusatAsal.x + pusatAsal.z * pusatAsal.z);
    const rMaks = 5.2; // radius perkiraan sebaran nusantara di skala ini
    const rNorm = Math.min(1, r / rMaks);

    const seed = hashString(kode);
    const noiseX = (prng(seed + 1) - 0.5) * 0.45;
    const noiseZ = (prng(seed + 2) - 0.5) * 0.45;

    // Arah lontar: normalisasi(pusatAsal + noise)
    const dirLontar = new Vector3(
      pusatAsal.x + noiseX,
      0,
      pusatAsal.z + noiseZ
    ).normalize();

    // Jarak lontar D_i in [1.6; 3.2] — provinsi lebih luar terlontar lebih jauh
    const distLontar = 1.6 + 1.6 * rNorm + (prng(seed + 3) - 0.5) * 0.4;

    // Tinggi angkat H_i in [0.8; 2.4]
    const tinggiLontar = 0.9 + 1.3 * rNorm + (prng(seed + 4) - 0.5) * 0.3;

    // Sumbu putar acak ternormalisasi
    const axisPutar = new Vector3(
      prng(seed + 5) - 0.5,
      prng(seed + 6) * 0.8 + 0.2,
      prng(seed + 7) - 0.5
    ).normalize();

    // Sudut putar theta in [±0.5pi ; ±1.1pi]
    const arahPutar = prng(seed + 8) > 0.5 ? 1 : -1;
    const sudutPutar = arahPutar * (Math.PI * 0.5 + prng(seed + 9) * Math.PI * 0.6);

    // Jadwal gelombang dari tengah keluar (mulai_i = 0.12 + 0.28 * rNorm, durasi = 0.40)
    const mulaiPecah = 0.12 + 0.28 * rNorm;
    const durasiPecah = 0.40;

    mesh.userData = {
      kode,
      nama,
      info,
      pusatAsal: pusatAsal.clone(),
      dirLontar,
      distLontar,
      tinggiLontar,
      axisPutar,
      sudutPutar,
      mulaiPecah,
      durasiPecah,
      warnaNatural: new Color(warnaNaturalHex),
      warnaData: new Color(warnaDataHex),
      kecepatanIdle: 0.35 + prng(seed + 10) * 0.2,
      amplitudoIdle: 0.012 + prng(seed + 11) * 0.008,
      faseIdle: prng(seed + 12) * Math.PI * 2
    };

    daftarMesh.push(mesh);
    petaMeshByKode.set(kode, mesh);
    grupProvinsi.add(mesh);
  }

  return {
    grup: grupProvinsi,
    daftarMesh,
    petaMeshByKode
  };
}
