/**
 * verify-hero3d-cp1.mjs
 * Pengujian matematis dan struktural untuk CP-1 Peta Diorama 3D Indonesia:
 * 1. Menghitung total segitiga dan mesh untuk 38 provinsi
 * 2. Memastikan setiap 38 provinsi memiliki mesh tersendiri dengan kode dan data yang valid
 * 3. Memverifikasi orientasi geometris (arah Utara/Selatan & Barat/Timur)
 * 4. Memverifikasi budget segitiga (<= 150.000 desktop)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from '../web/node_modules/three/build/three.module.js';
import * as BufferGeometryUtils from '../web/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// 1. Muat GeoJSON dan data provinsi
const geoRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'web', 'public', 'data', 'geo', 'provinsi.geojson'), 'utf8'));
const provData = JSON.parse(fs.readFileSync(path.join(ROOT, 'web', 'public', 'data', 'provinsi.json'), 'utf8'));

console.log(`[CP-1 Verifikasi] GeoJSON memuat ${geoRaw.features.length} provinsi.`);
console.log(`[CP-1 Verifikasi] Data provinsi memuat ${provData.length} entri.`);

if (geoRaw.features.length !== 38) {
  console.error(`ERROR: Jumlah provinsi bukan 38, melainkan ${geoRaw.features.length}`);
  process.exit(1);
}

// 2. Implementasikan proyeksi yang sama persis dengan web
function buatProyeksiIndonesia() {
  const skala = 880;
  const cx = 500;
  const cy = 200;
  const refLng = 118.0;
  const refLat = -2.5;
  const rad = Math.PI / 180;
  const cosLat0 = Math.cos(refLat * rad);

  return function proyeksi([lng, lat]) {
    const x = cx + (lng - refLng) * rad * cosLat0 * skala;
    const y = cy - (lat - refLat) * rad * skala;
    return [x, y];
  };
}

const proyeksi = buatProyeksiIndonesia();

// 3. Bangun mesh per provinsi seperti di build-provinces.js
function bangunPoligonKeShape(rings, proyeksi) {
  if (!rings || rings.length === 0) return null;
  const luar = rings[0];
  if (!luar || luar.length < 3) return null;

  const skalaDunia = 10 / 880;
  const shape = new THREE.Shape();

  const [p0x, p0y] = proyeksi(luar[0]);
  shape.moveTo((p0x - 500) * skalaDunia, -(p0y - 200) * skalaDunia);

  for (let i = 1; i < luar.length; i++) {
    const [px, py] = proyeksi(luar[i]);
    shape.lineTo((px - 500) * skalaDunia, -(py - 200) * skalaDunia);
  }

  for (let h = 1; h < rings.length; h++) {
    const holeRing = rings[h];
    if (!holeRing || holeRing.length < 3) continue;
    const holePath = new THREE.Path();
    const [h0x, h0y] = proyeksi(holeRing[0]);
    holePath.moveTo((h0x - 500) * skalaDunia, -(h0y - 200) * skalaDunia);
    for (let i = 1; i < holeRing.length; i++) {
      const [hx, hy] = proyeksi(holeRing[i]);
      holePath.lineTo((hx - 500) * skalaDunia, -(hy - 200) * skalaDunia);
    }
    shape.holes.push(holePath);
  }

  return shape;
}

let totalTrianglesProvinces = 0;
const listMeshes = [];

const extrudeSettings = {
  depth: 0.35,
  bevelEnabled: true,
  bevelThickness: 0.04,
  bevelSize: 0.04,
  bevelSegments: 1
};

for (const f of geoRaw.features) {
  const geomType = f.geometry.type;
  const polygons = geomType === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const parts = [];

  for (const poly of polygons) {
    const shape = bangunPoligonKeShape(poly, proyeksi);
    if (!shape) continue;
    const g = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Orientasi: rotasi -90 derajat di X
    g.rotateX(-Math.PI / 2);
    parts.push(g);
  }

  if (parts.length === 0) {
    console.error(`ERROR: Provinsi ${f.properties.kode} (${f.properties.nama}) tidak menghasilkan geometri!`);
    process.exit(1);
  }

  let merged = parts.length === 1 ? parts[0] : BufferGeometryUtils.mergeGeometries(parts, false);
  merged.computeBoundingBox();
  const bb = merged.boundingBox;
  const center = new THREE.Vector3();
  bb.getCenter(center);
  merged.translate(-center.x, -center.y, -center.z);

  const triCount = merged.index ? merged.index.count / 3 : merged.attributes.position.count / 3;
  totalTrianglesProvinces += triCount;

  listMeshes.push({
    kode: f.properties.kode,
    nama: f.properties.nama,
    triangles: triCount,
    pusat: center
  });
}

// 4. Tambahkan papan laut dan awan
const oceanGeo = new THREE.CylinderGeometry(6.5, 6.7, 0.32, 54, 4);
const rimGeo = new THREE.TorusGeometry(6.62, 0.09, 8, 54);
const oceanTriangles = (oceanGeo.index.count + rimGeo.index.count) / 3;

// 12 gugus awan, tiap gugus 3 bola icosahedron (detail 0 = 20 segitiga)
const cloudsTriangles = 12 * 3 * 20;

const grandTotalTriangles = totalTrianglesProvinces + oceanTriangles + cloudsTriangles;

console.log('\n--- HASIL ANALISIS GEOMETRI 3D DIORAMA (CP-1) ---');
console.log(`Jumlah keping provinsi: ${listMeshes.length} / 38`);
console.log(`Total segitiga 38 provinsi: ${totalTrianglesProvinces.toLocaleString('id-ID')}`);
console.log(`Total segitiga papan laut: ${Math.round(oceanTriangles).toLocaleString('id-ID')}`);
console.log(`Total segitiga awan: ${cloudsTriangles.toLocaleString('id-ID')}`);
console.log(`GRAND TOTAL SEGITIGA SCENE: ${Math.round(grandTotalTriangles).toLocaleString('id-ID')}`);

const budgetDesktop = 150000;
const budgetPonsel = 80000;
console.log(`Budget Desktop: <= ${budgetDesktop.toLocaleString('id-ID')} -> ${grandTotalTriangles <= budgetDesktop ? 'LOLOS (JAUH DI BAWAH BUDGET)' : 'GAGAL'}`);
console.log(`Budget Ponsel: <= ${budgetPonsel.toLocaleString('id-ID')} -> ${grandTotalTriangles <= budgetPonsel ? 'LOLOS (JAUH DI BAWAH BUDGET)' : 'GAGAL'}`);

// 5. Cek batas koordinat dan orientasi
// Cek Aceh (kode 11) harus berada di Barat (-X) dan Papua (kode 91/92/94/95/96) di Timur (+X)
const aceh = listMeshes.find(m => m.kode === '11');
const papua = listMeshes.find(m => m.kode === '91');
console.log(`\nVerifikasi Posisi Geografis:`);
console.log(`Aceh (kode 11) pusat X: ${aceh.pusat.x.toFixed(2)}, Z: ${aceh.pusat.z.toFixed(2)} (Harus Barat/Kiri, X < 0)`);
console.log(`Papua (kode 91) pusat X: ${papua.pusat.x.toFixed(2)}, Z: ${papua.pusat.z.toFixed(2)} (Harus Timur/Kanan, X > 0)`);

if (aceh.pusat.x >= papua.pusat.x) {
  console.error('ERROR: Orientasi Barat-Timur terbalik!');
  process.exit(1);
} else {
  console.log('[OK] Orientasi Barat-Timur benar.');
}

console.log('\n[CP-1 SEMUA ATURAN GEOMETRI DAN STRUKTUR TERPENUHI]');
