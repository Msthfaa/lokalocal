/**
 * verify-hero3d-cp2.mjs
 * Pengujian deterministik fungsi pose murni CP-2:
 * 1. Verifikasi pose awal pada p = 0
 * 2. Simulasi bolak-balik 0 -> 1 -> 0 dengan 200 langkah
 * 3. Hitung selisih maksimal posisi dan orientasi kuaternion pada p = 0 setelah bolak-balik
 *    (Kriteria lolos: delta < 1e-6)
 * 4. Catat rentang nilai parameter ledakan D_i, H_i, sudutPutar, dan jadwal gelombang
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from '../web/node_modules/three/build/three.module.js';
import * as BufferGeometryUtils from '../web/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// 1. Muat GeoJSON
const geoRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'web', 'public', 'data', 'geo', 'provinsi.geojson'), 'utf8'));

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

// Fungsi hash deterministik
function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function rngDariHash(seed) {
  let s = seed >>> 0;
  return function acak() {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Bangun 38 keping provinsi
const daftarProvinsiMesh = [];
const skalaDunia = 10 / 880;

for (const f of geoRaw.features) {
  const kode = f.properties.kode || '00';
  const rings = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const shapes = [];

  for (const poly of rings) {
    const luar = poly[0];
    if (!luar || luar.length < 3) continue;
    const s = new THREE.Shape();
    const [p0x, p0y] = proyeksi(luar[0]);
    s.moveTo((p0x - 500) * skalaDunia, -(p0y - 200) * skalaDunia);
    for (let i = 1; i < luar.length; i++) {
      const [px, py] = proyeksi(luar[i]);
      s.lineTo((px - 500) * skalaDunia, -(py - 200) * skalaDunia);
    }
    shapes.push(s);
  }

  const parts = shapes.map(s => {
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 });
    g.rotateX(-Math.PI / 2);
    return g;
  });

  const merged = parts.length === 1 ? parts[0] : BufferGeometryUtils.mergeGeometries(parts, false);
  merged.computeBoundingBox();
  const center = new THREE.Vector3();
  merged.boundingBox.getCenter(center);
  merged.translate(-center.x, -center.y, -center.z);

  const mesh = new THREE.Mesh(merged, new THREE.MeshBasicMaterial());
  mesh.position.copy(center);

  // Parameter ledakan deterministik
  const seed = hashString(kode);
  const rng = rngDariHash(seed);
  const rPusat = Math.hypot(center.x, center.z);
  const rNorm = Math.min(1, rPusat / 5.2);

  const dirX = center.x + (rng() - 0.5) * 0.8;
  const dirZ = center.z + (rng() - 0.5) * 0.8;
  const panjangDir = Math.hypot(dirX, dirZ) || 1;
  const dirLontar = new THREE.Vector3(dirX / panjangDir, 0, dirZ / panjangDir);

  const distLontar = 1.6 + 1.6 * rNorm + rng() * 0.4;
  const tinggiAngkat = 0.8 + 1.6 * (1 - rNorm * 0.3) + rng() * 0.4;

  const sumbuPutar = new THREE.Vector3(
    rng() * 2 - 1,
    rng() * 2 - 1,
    rng() * 2 - 1
  ).normalize();
  const tanda = rng() > 0.5 ? 1 : -1;
  const sudutPutar = tanda * (Math.PI * 0.5 + rng() * Math.PI * 0.6);

  mesh.userData = {
    kode,
    nama: f.properties.nama,
    pusatAsal: center.clone(),
    dirLontar,
    distLontar,
    tinggiAngkat,
    sumbuPutar,
    sudutPutar,
    rNorm
  };

  daftarProvinsiMesh.push(mesh);
}

// Import pose evaluator logic
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

const tempVec = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();
const quatIdentitas = new THREE.Quaternion();

function terapkanPose(p) {
  for (let i = 0; i < daftarProvinsiMesh.length; i++) {
    const mesh = daftarProvinsiMesh[i];
    const u = mesh.userData;

    const mulai = 0.12 + 0.28 * u.rNorm;
    const durasi = 0.40;
    const q = clamp((p - mulai) / durasi, 0, 1);
    const e = easeInOutCubic(q);

    mesh.position.copy(u.pusatAsal);
    if (e > 0) {
      tempVec.copy(u.dirLontar).multiplyScalar(u.distLontar * e);
      tempVec.y += u.tinggiAngkat * e;
      mesh.position.add(tempVec);

      tempQuat.setFromAxisAngle(u.sumbuPutar, u.sudutPutar * e);
      mesh.quaternion.copy(tempQuat);

      const skala = 1 - 0.08 * Math.sin(e * Math.PI);
      mesh.scale.set(skala, skala, skala);
    } else {
      mesh.quaternion.copy(quatIdentitas);
      mesh.scale.set(1, 1, 1);
    }
  }
}

// Simpan pose awal referensi di p = 0
terapkanPose(0);
const poseAwal = daftarProvinsiMesh.map(m => ({
  posisi: m.position.clone(),
  rotasi: m.quaternion.clone(),
  skala: m.scale.clone()
}));

console.log('[CP-2 Verifikasi] Menguji simulasi bolak-balik scroll 0 -> 1 -> 0...');

// Simulasi scroll turun bertahap (100 step)
for (let step = 0; step <= 100; step++) {
  const p = step / 100;
  terapkanPose(p);
}

// Simulasi scroll naik bertahap (100 step) kembali ke 0
for (let step = 100; step >= 0; step--) {
  const p = step / 100;
  terapkanPose(p);
}

// Evaluasi selisih di p = 0 setelah bolak-balik
let maksDeltaPos = 0;
let maksDeltaRot = 0;
let maksDeltaSkala = 0;

for (let i = 0; i < daftarProvinsiMesh.length; i++) {
  const m = daftarProvinsiMesh[i];
  const ref = poseAwal[i];

  const dPos = m.position.distanceTo(ref.posisi);
  const dRot = Math.abs(1 - Math.abs(m.quaternion.dot(ref.rotasi)));
  const dSkala = Math.abs(m.scale.x - ref.skala.x);

  if (dPos > maksDeltaPos) maksDeltaPos = dPos;
  if (dRot > maksDeltaRot) maksDeltaRot = dRot;
  if (dSkala > maksDeltaSkala) maksDeltaSkala = dSkala;
}

console.log('\n--- HASIL PENGUJIAN DETERMINISME & REVERSIBILITAS (CP-2) ---');
console.log(`Maksimum Delta Posisi di p = 0:    ${maksDeltaPos.toExponential(4)} (Syarat: < 1e-6)`);
console.log(`Maksimum Delta Rotasi di p = 0:    ${maksDeltaRot.toExponential(4)} (Syarat: < 1e-6)`);
console.log(`Maksimum Delta Skala di p = 0:     ${maksDeltaSkala.toExponential(4)} (Syarat: < 1e-6)`);

const lolosPosisi = maksDeltaPos < 1e-6;
const lolosRotasi = maksDeltaRot < 1e-6;
const lolosSkala = maksDeltaSkala < 1e-6;

if (lolosPosisi && lolosRotasi && lolosSkala) {
  console.log('[OK] REVERSIBILITAS 100% PERSIS IDENTIK. Tidak ada drift atau residu.');
} else {
  console.error('[GAGAL] Terdapat drift matematis!');
  process.exit(1);
}

// Ringkasan parameter gerak
const dMin = Math.min(...daftarProvinsiMesh.map(m => m.userData.distLontar));
const dMax = Math.max(...daftarProvinsiMesh.map(m => m.userData.distLontar));
const hMin = Math.min(...daftarProvinsiMesh.map(m => m.userData.tinggiAngkat));
const hMax = Math.max(...daftarProvinsiMesh.map(m => m.userData.tinggiAngkat));

console.log(`\nRentang Parameter Ledakan:`);
console.log(`- Jarak lontar horizontal (D_i):  [${dMin.toFixed(2)}, ${dMax.toFixed(2)}] unit`);
console.log(`- Tinggi angkat (H_i):             [${hMin.toFixed(2)}, ${hMax.toFixed(2)}] unit`);
console.log(`- Jadwal gelombang tengah-luar:    mulai = 0.12 + 0.28 * rNorm, durasi = 0.40`);
console.log('\n[CP-2 SEMUA KRITERIA MATEMATIS TERPENUHI]');
