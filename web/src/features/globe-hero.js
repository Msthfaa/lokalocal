/**
 * globe-hero.js — Elemen aksen 3D opsional di bagian pembuka (S1):
 * Globe lengkung Nusantara & titik-titik cahaya 38 provinsi murni kode Three.js.
 * Sesuai WEB_SPEC.md Bagian 15 & AGENTS.md Fase 9:
 * - Tanpa aset eksternal (murni kode geometri & titik koordinat GeoJSON lokal).
 * - Dimuat secara dinamis (import()) hanya jika WebGL didukung, bukan perangkat lemah,
 *   dan prefers-reduced-motion tidak aktif.
 * - devicePixelRatio dibatasi maksimum 1,5.
 * - Render dihentikan otomatis saat tab tidak aktif atau bagian S1 di luar layar.
 */

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  BufferGeometry,
  LineBasicMaterial,
  LineSegments,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  Color,
  Vector3,
  CanvasTexture,
  AdditiveBlending
} from 'three';
import { WARNA_JENIS_HEX } from '../map/scales.js';

const DEG2RAD = Math.PI / 180;
const RADIUS_BOLA = 2.25;

/**
 * Mengubah koordinat [bujur, lintang] menjadi vektor 3D di permukaan bola.
 * Diputar sehingga bujur tengah Indonesia (~118° BT) menghadap kamera (+Z).
 *
 * @param {number} lon - Bujur (derajat)
 * @param {number} lat - Lintang (derajat)
 * @param {number} radius - Jari-jari bola
 * @returns {Vector3}
 */
function lonLatKeVektor3(lon, lat, radius = RADIUS_BOLA) {
  const phi = (90 - lat) * DEG2RAD;
  // Geser bujur 118° BT agar tepat menghadap arah +Z (kamera)
  const theta = (lon - 118) * DEG2RAD;

  const sinPhi = Math.sin(phi);
  const x = radius * sinPhi * Math.sin(theta);
  const y = radius * Math.cos(phi);
  const z = radius * sinPhi * Math.cos(theta);
  return new Vector3(x, y, z);
}

/**
 * Membuat tekstur lingkaran cahaya lembut secara prosedural lewat <canvas> memori
 * (tanpa memuat file gambar eksternal).
 */
function buatTeksturTitikCahaya() {
  const ukuran = 64;
  const kanvas = document.createElement('canvas');
  kanvas.width = ukuran;
  kanvas.height = ukuran;
  const ctx = kanvas.getContext('2d');
  if (!ctx) return null;

  const pusat = ukuran / 2;
  const gradien = ctx.createRadialGradient(pusat, pusat, 2, pusat, pusat, pusat);
  gradien.addColorStop(0, 'rgba(255, 248, 230, 1)');
  gradien.addColorStop(0.35, 'rgba(230, 177, 74, 0.85)');
  gradien.addColorStop(0.7, 'rgba(230, 177, 74, 0.22)');
  gradien.addColorStop(1, 'rgba(20, 17, 15, 0)');

  ctx.fillStyle = gradien;
  ctx.fillRect(0, 0, ukuran, ukuran);

  const tekstur = new CanvasTexture(kanvas);
  tekstur.needsUpdate = true;
  return tekstur;
}

/**
 * Membangun geometri garis jaring lintang-bujur (graticule) di sekitar bola.
 */
function buatJaringBola(radius) {
  const titik = [];
  // Garis lintang setiap 15 derajat
  for (let lat = -60; lat <= 60; lat += 15) {
    for (let lon = -180; lon < 180; lon += 4) {
      titik.push(lonLatKeVektor3(lon, lat, radius));
      titik.push(lonLatKeVektor3(lon + 4, lat, radius));
    }
  }
  // Garis bujur setiap 15 derajat
  for (let lon = -180; lon < 180; lon += 15) {
    for (let lat = -72; lat < 72; lat += 4) {
      titik.push(lonLatKeVektor3(lon, lat, radius));
      titik.push(lonLatKeVektor3(lon, lat + 4, radius));
    }
  }
  const geo = new BufferGeometry().setFromPoints(titik);
  const mat = new LineBasicMaterial({
    color: new Color('#3A322C'),
    transparent: true,
    opacity: 0.28
  });
  return new LineSegments(geo, mat);
}

/**
 * Membangun siluet garis pantai kepulauan Indonesia di permukaan bola 3D
 * dari koordinat GeoJSON 38 provinsi lokal.
 */
function buatGarisKepulauan3D(geoProvinsi, petaProvinsi, radius) {
  const segmenBerdata = [];
  const segmenBelum = [];

  const features = geoProvinsi?.features || [];
  for (const fitur of features) {
    const kode = String(fitur.properties?.kode || '');
    const info = petaProvinsi.get(kode);
    const belumTercatat = !info || info.status_data === 'belum_tercatat' || info.total <= 0;
    const targetArray = belumTercatat ? segmenBelum : segmenBerdata;

    const geom = fitur.geometry;
    if (!geom) continue;

    const daftarPoligon =
      geom.type === 'Polygon'
        ? [geom.coordinates]
        : geom.type === 'MultiPolygon'
        ? geom.coordinates
        : [];

    for (const poligon of daftarPoligon) {
      const cincinLuar = poligon[0];
      if (!Array.isArray(cincinLuar) || cincinLuar.length < 4) continue;

      // Ambil sampel titik agar jumlah segmen tetap ringan di GPU
      const langkah = cincinLuar.length > 120 ? 2 : 1;
      for (let i = 0; i < cincinLuar.length - langkah; i += langkah) {
        const p1 = cincinLuar[i];
        const p2 = cincinLuar[i + langkah];
        if (!p1 || !p2) continue;
        targetArray.push(lonLatKeVektor3(p1[0], p1[1], radius));
        targetArray.push(lonLatKeVektor3(p2[0], p2[1], radius));
      }
    }
  }

  const grup = new Group();

  if (segmenBerdata.length > 0) {
    const geoAda = new BufferGeometry().setFromPoints(segmenBerdata);
    const matAda = new LineBasicMaterial({
      color: new Color('#8A6E4B'),
      transparent: true,
      opacity: 0.62
    });
    grup.add(new LineSegments(geoAda, matAda));
  }

  if (segmenBelum.length > 0) {
    const geoBelum = new BufferGeometry().setFromPoints(segmenBelum);
    const matBelum = new LineBasicMaterial({
      color: new Color('#52443A'),
      transparent: true,
      opacity: 0.42
    });
    grup.add(new LineSegments(geoBelum, matBelum));
  }

  return grup;
}

/**
 * Membangun titik-titik cahaya untuk 38 provinsi di atas permukaan bola 3D.
 */
function buatTitikCahayaProvinsi3D(geoProvinsi, petaProvinsi, radius) {
  const posisiBerdata = [];
  const warnaBerdata = [];
  const posisiBelum = [];

  const features = geoProvinsi?.features || [];
  for (const fitur of features) {
    const kode = String(fitur.properties?.kode || '');
    const pusat = fitur.properties?.pusat;
    if (!Array.isArray(pusat) || pusat.length < 2) continue;

    const info = petaProvinsi.get(kode);
    const belum = !info || info.status_data === 'belum_tercatat' || info.total <= 0;
    const v = lonLatKeVektor3(pusat[0], pusat[1], radius + 0.025);

    if (belum) {
      posisiBelum.push(v.x, v.y, v.z);
    } else {
      posisiBerdata.push(v.x, v.y, v.z);
      const jenisDominan = info.jenis_dominan || 'seni';
      const hex = WARNA_JENIS_HEX[jenisDominan] || '#E6B14A';
      const c = new Color(hex);
      warnaBerdata.push(c.r, c.g, c.b);
    }
  }

  const grup = new Group();
  const teksturTitik = buatTeksturTitikCahaya();

  if (posisiBerdata.length > 0) {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(posisiBerdata, 3));
    geo.setAttribute('color', new Float32BufferAttribute(warnaBerdata, 3));

    const mat = new PointsMaterial({
      size: 0.14,
      map: teksturTitik || null,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: AdditiveBlending
    });

    grup.add(new Points(geo, mat));
  }

  if (posisiBelum.length > 0) {
    const geoBelum = new BufferGeometry();
    geoBelum.setAttribute('position', new Float32BufferAttribute(posisiBelum, 3));

    const matBelum = new PointsMaterial({
      size: 0.075,
      map: teksturTitik || null,
      color: new Color('#C8BCB0'),
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    grup.add(new Points(geoBelum, matBelum));
  }

  return { grup, teksturTitik };
}

/**
 * Memasang globe 3D ringan pada wadah latar bagian pembuka (S1).
 *
 * @param {object} parameter
 * @param {HTMLElement} parameter.wadahEl - Elemen #s1-latar-peta
 * @param {object} parameter.geoProvinsi - GeoJSON 38 provinsi
 * @param {Array} parameter.daftarProvinsi - Array 38 provinsi dari provinsi.json
 * @returns {{ bersihkan: () => void } | null}
 */
export function pasangGlobeHero3D({ wadahEl, geoProvinsi, daftarProvinsi = [] }) {
  if (!wadahEl || !geoProvinsi) return null;

  let renderer = null;
  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
  } catch {
    // Jika pembuatan konteks WebGL gagal, biarkan fallback 2D SVG tetap tampil
    return null;
  }

  // Batasi devicePixelRatio maksimum 1.5 sesuai WEB_SPEC.md Bagian 15
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);

  const kanvas = renderer.domElement;
  kanvas.className = 's1-globe-kanvas';
  kanvas.setAttribute('aria-hidden', 'true');
  wadahEl.appendChild(kanvas);
  wadahEl.classList.add('has-globe-3d');

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 20);
  camera.position.set(0, 0.15, 5.2);
  camera.lookAt(0, -0.05, 0);

  const grupGlobe = new Group();
  // Miringkan sedikit agar sabuk Nusantara tampak anggun
  grupGlobe.rotation.x = 0.08;
  scene.add(grupGlobe);

  // 1. Bola inti gelap transparan sebagai siluet dasar
  const geoBolaInti = new SphereGeometry(RADIUS_BOLA * 0.992, 36, 24);
  const matBolaInti = new MeshBasicMaterial({
    color: new Color('#181310'),
    transparent: true,
    opacity: 0.58
  });
  const meshBolaInti = new Mesh(geoBolaInti, matBolaInti);
  grupGlobe.add(meshBolaInti);

  // 2. Jaring lintang-bujur halus
  const jaring = buatJaringBola(RADIUS_BOLA * 0.996);
  grupGlobe.add(jaring);

  // 3. Garis pantai kepulauan Nusantara & 38 titik cahaya provinsi
  const petaProvinsi = new Map(daftarProvinsi.map((p) => [String(p.kode), p]));
  const garisKepulauan = buatGarisKepulauan3D(geoProvinsi, petaProvinsi, RADIUS_BOLA);
  grupGlobe.add(garisKepulauan);

  const { grup: grupTitik, teksturTitik } = buatTitikCahayaProvinsi3D(
    geoProvinsi,
    petaProvinsi,
    RADIUS_BOLA
  );
  grupGlobe.add(grupTitik);

  function perbaruiUkuran() {
    if (!wadahEl || !renderer) return;
    const lebar = wadahEl.clientWidth || window.innerWidth;
    const tinggi = wadahEl.clientHeight || window.innerHeight;
    if (lebar <= 0 || tinggi <= 0) return;

    camera.aspect = lebar / tinggi;
    camera.updateProjectionMatrix();
    renderer.setSize(lebar, tinggi, false);
  }

  perbaruiUkuran();

  let idRaf = null;
  let sedangTerlihatDiLayar = true;
  let tabAktif = !document.hidden;
  let sudahDibersihkan = false;
  let waktuMulai = performance.now();

  function apakahHarusRender() {
    return !sudahDibersihkan && sedangTerlihatDiLayar && tabAktif;
  }

  function loopRender(waktuSekarang) {
    if (!apakahHarusRender()) {
      idRaf = null;
      return;
    }

    const detik = (waktuSekarang - waktuMulai) * 0.001;
    // Ayunan rotasi lembut di sekitar poros Nusantara (-14° s.d. +14°) agar Indonesia selalu menghadap depan
    grupGlobe.rotation.y = Math.sin(detik * 0.28) * 0.25;
    grupGlobe.rotation.z = Math.cos(detik * 0.18) * 0.025;

    renderer.render(scene, camera);
    idRaf = window.requestAnimationFrame(loopRender);
  }

  function mulaiLoopJikaPerlu() {
    if (apakahHarusRender() && idRaf === null) {
      waktuMulai = performance.now();
      idRaf = window.requestAnimationFrame(loopRender);
    }
  }

  function hentikanLoop() {
    if (idRaf !== null) {
      window.cancelAnimationFrame(idRaf);
      idRaf = null;
    }
  }

  // Pantau visibilitas elemen S1 di viewport menggunakan IntersectionObserver
  let observer = null;
  const bagianPembuka = document.getElementById('pembuka') || wadahEl;
  if ('IntersectionObserver' in window && bagianPembuka) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          sedangTerlihatDiLayar = entry.isIntersecting;
          if (sedangTerlihatDiLayar) {
            mulaiLoopJikaPerlu();
          } else {
            hentikanLoop();
          }
        }
      },
      { threshold: 0.02 }
    );
    observer.observe(bagianPembuka);
  }

  // Hentikan render saat tab browser tidak aktif
  const saatVisibilitasBerubah = () => {
    tabAktif = !document.hidden;
    if (tabAktif) {
      mulaiLoopJikaPerlu();
    } else {
      hentikanLoop();
    }
  };
  document.addEventListener('visibilitychange', saatVisibilitasBerubah);

  // Perbarui ukuran saat jendela berubah
  const saatResize = () => perbaruiUkuran();
  window.addEventListener('resize', saatResize, { passive: true });

  // Pantau jika pengguna mengaktifkan prefers-reduced-motion di tengah sesi
  const mqlReduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  const saatReducedMotionBerubah = (e) => {
    if (e.matches) {
      bersihkan();
    }
  };
  if (mqlReduced && mqlReduced.addEventListener) {
    mqlReduced.addEventListener('change', saatReducedMotionBerubah);
  }

  // Jalankan frame pertama & mulai loop
  renderer.render(scene, camera);
  mulaiLoopJikaPerlu();

  function bersihkan() {
    if (sudahDibersihkan) return;
    sudahDibersihkan = true;
    hentikanLoop();

    if (observer) {
      observer.disconnect();
      observer = null;
    }
    document.removeEventListener('visibilitychange', saatVisibilitasBerubah);
    window.removeEventListener('resize', saatResize);
    if (mqlReduced && mqlReduced.removeEventListener) {
      mqlReduced.removeEventListener('change', saatReducedMotionBerubah);
    }

    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    if (teksturTitik) teksturTitik.dispose();

    if (renderer) {
      renderer.dispose();
    }
    if (kanvas && kanvas.parentNode) {
      kanvas.parentNode.removeChild(kanvas);
    }
    wadahEl.classList.remove('has-globe-3d');
  }

  return { bersihkan };
}
