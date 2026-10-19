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
  Color,
  CanvasTexture,
  RepeatWrapping
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WARNA_JENIS_HEX } from '../../map/scales.js';
import { hashString } from '../../util/hash.js';
import { dapatkanTeksturAtlasProvinsi } from '../../map/tekstur-atlas.js';

// Skala konversi pixel SVG (1000 x 400) ke unit dunia 3D (~10 unit lebar)
export const SKALA_DUNIA = 10 / 880;
// Ketebalan ekstrusi proporsional: 0.13 unit (ramping, elegan, kepulauan tidak membentuk tiang tinggi)
export const KETEBALAN_EXTRUDE = 0.13;

// Rona alami Zamrud Khatulistiwa: Semua provinsi berkarakter hijau asri tropis
const WARNA_NATURAL_BERDATA = '#6EC443'; // Hijau zamrud segar bercahaya
const WARNA_NATURAL_BELUM = '#5B9C69';   // Hijau zamrud sejuk teduh (harmonis, BUKAN abu-abu semen!)

let cacheTeksturBerdata = null;
let cacheTeksturBelum = null;
let cacheBumpTopografi = null;

/**
 * Menghasilkan bump map relief kontur mikro untuk memberikan kedalaman fisik nyata pada permukaan pulau
 * @returns {THREE.CanvasTexture|null}
 */
function dapatkanBumpMapTopografi() {
  if (typeof document === 'undefined') return null;
  if (cacheBumpTopografi) return cacheBumpTopografi;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Dasar abu-abu netral (ketinggian tengah)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 1024, 1024);

  // Kontur elevasi perbukitan berlapis (putih = elevasi tinggi, gelap = lembah)
  for (let c = 0; c < 9; c++) {
    const tinggiRelief = Math.min(255, 140 + c * 13);
    ctx.strokeStyle = `rgb(${tinggiRelief}, ${tinggiRelief}, ${tinggiRelief})`;
    ctx.lineWidth = 3.5 + c * 1.2;
    ctx.beginPath();
    const cx = 512 + Math.sin(c * 1.5) * 140;
    const cy = 512 + Math.cos(c * 1.3) * 120;
    const rBase = 80 + c * 96;
    for (let a = 0; a <= Math.PI * 2 + 0.2; a += 0.12) {
      const wobble = Math.sin(a * 4 + c) * 26 + Math.cos(a * 5) * 14;
      const px = cx + Math.cos(a) * (rBase + wobble);
      const py = cy + Math.sin(a) * (rBase + wobble);
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Lembah-lembah alur sungai mikro (garis gelap yang mengukir relief)
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 2.0;
  for (let s = 0; s < 5; s++) {
    ctx.beginPath();
    let sx = (s + 1) * 180;
    let sy = 0;
    ctx.moveTo(sx, sy);
    for (let seg = 0; seg < 10; seg++) {
      sx += (Math.sin(seg * 1.2 + s) - 0.2) * 50;
      sy += 105;
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }

  // Micro-stipple noise batuan dan vegetasi lebat
  for (let i = 0; i < 900; i++) {
    const rx = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 1024;
    const ry = (Math.cos(i * 78.233) * 0.5 + 0.5) * 1024;
    const val = Math.floor(135 + Math.sin(i * 3.14) * 45);
    ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
    ctx.fillRect(rx, ry, 2.5, 2.5);
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2.0, 2.0);

  cacheBumpTopografi = texture;
  return texture;
}

/**
 * Menghasilkan tekstur topografi tropis bergradasi dengan kontur mikro alami
 * Menghilangkan kesan plastik flat polos dan memberikan tekstur diorama nusantara yang mewah
 * @param {'berdata'|'belum'} varian
 * @returns {THREE.CanvasTexture|null}
 */
function dapatkanTeksturTopografi(varian = 'berdata') {
  if (typeof document === 'undefined') return null;

  if (varian === 'berdata' && cacheTeksturBerdata) return cacheTeksturBerdata;
  if (varian === 'belum' && cacheTeksturBelum) return cacheTeksturBelum;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Gradasi Warna Bentang Alam Khatulistiwa Kaya Rona
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  if (varian === 'berdata') {
    grad.addColorStop(0, '#7ECC48');
    grad.addColorStop(0.28, '#62AC37');
    grad.addColorStop(0.62, '#4B8A28');
    grad.addColorStop(0.85, '#3D7420');
    grad.addColorStop(1, '#6EBD3E');
  } else {
    // 10 Provinsi Menanti Pendataan: Nuansa Zamrud Asri Teduh yang Menyatu Harmonis
    grad.addColorStop(0, '#6BAA78');
    grad.addColorStop(0.35, '#569363');
    grad.addColorStop(0.7, '#43784F');
    grad.addColorStop(1, '#619F6E');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Aksen Bintik Alami Kanopi Vegetasi Tropis (Micro-Stipples)
  ctx.fillStyle = varian === 'berdata' ? 'rgba(240, 225, 170, 0.18)' : 'rgba(225, 235, 210, 0.15)';
  for (let i = 0; i < 700; i++) {
    const rx = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 1024;
    const ry = (Math.cos(i * 78.233) * 0.5 + 0.5) * 1024;
    const rad = 1 + (Math.sin(i * 4.14) * 0.5 + 0.5) * 3.5;
    ctx.beginPath();
    ctx.arc(rx, ry, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Garis Kontur Topografi Mikro Elevasi Bukit / Pegunungan (Lebih Rapat & Tegas)
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  for (let c = 0; c < 9; c++) {
    ctx.beginPath();
    const cx = 512 + Math.sin(c * 1.4) * 130;
    const cy = 512 + Math.cos(c * 1.6) * 110;
    const rBase = 90 + c * 100;
    for (let a = 0; a <= Math.PI * 2 + 0.25; a += 0.15) {
      const wobble = Math.sin(a * 4 + c) * 22 + Math.cos(a * 5) * 12;
      const px = cx + Math.cos(a) * (rBase + wobble);
      const py = cy + Math.sin(a) * (rBase + wobble);
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // 4. Tekstur Serat Tenun Arsir Halus Tradisional Nusantara
  ctx.lineWidth = 0.85;
  ctx.strokeStyle = varian === 'berdata' ? 'rgba(20, 55, 12, 0.11)' : 'rgba(16, 42, 26, 0.10)';
  for (let y = 0; y < 1024; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y + (y % 48 === 0 ? 8 : -8));
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1.0, 1.0);

  if (varian === 'berdata') cacheTeksturBerdata = texture;
  else cacheTeksturBelum = texture;

  return texture;
}

/**
 * Menghitung luas poligon dan centroid daratan dengan algoritma Shoelace
 * Digunakan untuk menemukan pulau utama tempat penanda berdiri kokoh di daratan (bukan di laut)
 * @param {Array<[number, number]>} pts
 * @returns {{ area: number, cx: number, cy: number }}
 */
function hitungLuasDanCentroid(pts) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  const n = pts.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const p1 = pts[j];
    const p2 = pts[i];
    const f = p1[0] * p2[1] - p2[0] * p1[1];
    area += f;
    cx += (p1[0] + p2[0]) * f;
    cy += (p1[1] + p2[1]) * f;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-6) {
    let sx = 0, sy = 0;
    for (const p of pts) { sx += p[0]; sy += p[1]; }
    return { area: 0, cx: sx / n, cy: sy / n };
  }
  cx = cx / (6 * area);
  cy = cy / (6 * area);
  return { area: Math.abs(area), cx, cy };
}

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
    let maxAreaDaratan = -1;
    let titikDaratanUtama2D = null;

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

      // Abaikan pulau mikro yang rentang ukurannya lebih kecil dari 0.035 unit
      const rentangX = maxX - minX;
      const rentangY = maxY - minY;
      if (rentangX < 0.035 && rentangY < 0.035) {
        continue;
      }

      // Hitung luas dan centroid pulau daratan ini untuk penempatan marker akurat
      const { area, cx, cy } = hitungLuasDanCentroid(titikLuar);
      if (area > maxAreaDaratan) {
        maxAreaDaratan = area;
        titikDaratanUtama2D = { x: cx, y: cy };
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

      // Ekstrusi dengan bevel mikro bersih (0.008 unit) agar tepi halus tanpa retakan
      const geomExtrude = new ExtrudeGeometry(shape, {
        depth: KETEBALAN_EXTRUDE,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.006,
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

    // Normalisasi UV koordinat [0, 1] agar tekstur peta fisik atlas membungkus pas daratan provinsi
    geomAkhir.computeBoundingBox();
    const box = geomAkhir.boundingBox;
    const rentangX = box.max.x - box.min.x || 1;
    const rentangZ = box.max.z - box.min.z || 1;
    const posAttr = geomAkhir.attributes.position;
    const uvAttr = geomAkhir.attributes.uv;

    if (posAttr && uvAttr) {
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        // u: 0 di barat ke 1 di timur
        const u = (vx - box.min.x) / rentangX;
        // v: 0 di selatan ke 1 di utara (-Z adalah arah utara)
        const v = (box.max.z - vz) / rentangZ;
        uvAttr.setXY(i, u, v);
      }
      uvAttr.needsUpdate = true;
    }

    // Hitung titik daratan utama di koordinat dunia diorama (bukan di laut!)
    let titikDaratanUtamaDunia;
    if (titikDaratanUtama2D) {
      titikDaratanUtamaDunia = new Vector3(
        titikDaratanUtama2D.x,
        KETEBALAN_EXTRUDE + 0.015,
        -titikDaratanUtama2D.y
      );
    } else {
      titikDaratanUtamaDunia = new Vector3(
        pusatAsal.x,
        pusatAsal.y + KETEBALAN_EXTRUDE + 0.015,
        pusatAsal.z
      );
    }

    // 1. Material normal diorama: Tekstur bentang alam tropis kaya kontur mikro & relief alami (anti-kaku saat zoom in)
    const teksturTopo = dapatkanTeksturTopografi(belumTercatat ? 'belum' : 'berdata');
    const bumpMapTopo = dapatkanBumpMapTopografi();

    const warnaAwalHex = modeAwal === 'data' ? warnaDataHex : warnaNaturalHex;
    const materialNormal = new MeshStandardMaterial({
      color: modeAwal === 'data' ? new Color(warnaDataHex) : new Color(0xffffff),
      map: modeAwal === 'data' ? null : teksturTopo,
      bumpMap: bumpMapTopo || undefined,
      bumpScale: 0.035,
      roughness: 0.65,
      metalness: 0.03,
      flatShading: false
    });

    // 2. Material atlas & tekstur topografi dibuat MALAS (Lazy On-Demand)
    // Mencegah pembangkitan 76 kanvas 1024x1024 secara serentak di thread utama saat awal halaman dibuka.
    // Tekstur HANYA dibangkitkan saat provinsi bersangkutan benar-benar diklik/dibuka di Mode Detail.
    let materialAtlasCached = null;
    let teksturAtlasCached = null;
    let bumpMapAtlasCached = null;

    function pastikanMaterialAtlas() {
      if (!materialAtlasCached) {
        const hasil = dapatkanTeksturAtlasProvinsi({
          kode,
          nama,
          belumTercatat
        });
        teksturAtlasCached = hasil.teksturPeta;
        bumpMapAtlasCached = hasil.bumpMap;
        materialAtlasCached = new MeshStandardMaterial({
          color: new Color(0xffffff),
          map: teksturAtlasCached || undefined,
          bumpMap: bumpMapAtlasCached || undefined,
          bumpScale: 0.038,
          roughness: 0.44,
          metalness: 0.04,
          flatShading: false
        });
      }
      return materialAtlasCached;
    }

    const mesh = new Mesh(geomAkhir, materialNormal);
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
      rNorm,
      distCenter: r,
      pusatAsal: pusatAsal.clone(),
      titikDaratanUtama: titikDaratanUtamaDunia,
      targetY: pusatAsal.y,
      offsetTerpilih: 0,
      offsetHover: 0,
      dirLontar,
      distLontar,
      tinggiLontar,
      tinggiAngkat: tinggiLontar,
      axisPutar,
      sumbuPutar: axisPutar,
      sudutPutar,
      mulaiPecah,
      durasiPecah,
      warnaNatural: new Color(warnaNaturalHex),
      warnaData: new Color(warnaDataHex),
      warnaNaturalHex,
      warnaDataHex,
      warnaNormal: new Color(warnaAwalHex),
      materialNormal,
      teksturTopo,
      bumpMapTopo,
      pastikanMaterialAtlas,
      get materialAtlas() {
        return pastikanMaterialAtlas();
      },
      get teksturAtlas() {
        pastikanMaterialAtlas();
        return teksturAtlasCached;
      },
      get bumpMapAtlas() {
        pastikanMaterialAtlas();
        return bumpMapAtlasCached;
      },
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
