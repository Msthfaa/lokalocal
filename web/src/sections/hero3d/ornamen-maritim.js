/**
 * ornamen-maritim.js — Ornamen Kemaritiman & Navigasi Nusantara 3D
 * Memperkaya diorama Indonesia dengan warisan bahari adiluhung:
 * 1. Perahu Layar Pinisi Utama ("Kembara Nusantara"): Berlayar dari Sabang ke Merauke melintasi koridor laut ALKI
 * 2. Dua Perahu Pinisi Pendamping di perairan Laut Jawa dan Laut Flores (bebas menabrak pulau)
 * 3. Cincin Khatulistiwa Emas (Equator Line 0°) membelah kepulauan secara presisi
 * 4. Garis Jalur Rempah Maritim (The Historic Spice Routes) bercahaya menghubungkan pelabuhan rempah bersejarah
 * 5. Mawar Kompas Bahari Antik (Antique Compass Rose) berukir emas di permukaan samudra
 */

import {
  Group,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  LineDashedMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  TorusGeometry,
  CylinderGeometry,
  ConeGeometry,
  BoxGeometry,
  PlaneGeometry,
  CanvasTexture,
  Color,
  Vector3,
  CatmullRomCurve3,
  DoubleSide
} from 'three';
import gsap from 'gsap';

/**
 * Membangun model perahu layar Pinisi khas Sulawesi Selatan (Bugis/Makassar)
 * dengan proporsi low-poly estetis: lambung kayu jati, anjungan haluan menjulur,
 * tiang kembar, dan layar tanja segitiga khas bahari nusantara.
 * @param {object} opsi
 * @param {boolean} [opsi.apakahFlagship=false] - Perahu utama berbendera Merah Putih
 */
function buatModelPerahuPinisi({ apakahFlagship = false } = {}) {
  const grupPerahu = new Group();
  grupPerahu.name = apakahFlagship ? 'pinisi-flagship-sabang-merauke' : 'perahu-pinisi';

  // 1. Material Kayu Jati & Layar Kain Tradisional
  const matKayuLambung = new MeshStandardMaterial({
    color: new Color(apakahFlagship ? '#4A2B14' : '#5C3A21'),
    roughness: 0.70,
    metalness: 0.06,
    flatShading: true
  });

  const matKayuGeladak = new MeshStandardMaterial({
    color: new Color(apakahFlagship ? '#9A6335' : '#8A5A32'),
    roughness: 0.75,
    metalness: 0.04,
    flatShading: true
  });

  const matLayar = new MeshStandardMaterial({
    color: new Color('#FFFDF2'),
    roughness: 0.85,
    metalness: 0.0,
    side: DoubleSide,
    flatShading: true
  });

  const matTiang = new MeshStandardMaterial({
    color: new Color('#9E6D3B'),
    roughness: 0.65,
    metalness: 0.08
  });

  // Lentera Emas di Buritan (menyala saat malam)
  const matLentera = new MeshStandardMaterial({
    color: new Color('#FFBE3B'),
    emissive: new Color('#FFA012'),
    emissiveIntensity: 0.6,
    roughness: 0.3,
    metalness: 0.8
  });

  // 2. Lambung Kapal (Hull)
  const geoTengah = new BoxGeometry(0.085, 0.055, 0.22);
  const meshTengah = new Mesh(geoTengah, matKayuLambung);
  meshTengah.position.set(0, 0.025, 0);
  grupPerahu.add(meshTengah);

  // Haluan lancip (Bow) di depan (-Z)
  const geoHaluan = new ConeGeometry(0.045, 0.11, 4);
  geoHaluan.rotateX(Math.PI / 2);
  geoHaluan.rotateY(Math.PI / 4);
  const meshHaluan = new Mesh(geoHaluan, matKayuLambung);
  meshHaluan.position.set(0, 0.024, -0.15);
  meshHaluan.scale.set(0.9, 0.75, 1.2);
  grupPerahu.add(meshHaluan);

  // Anjungan haluan menjulur ke depan (Bowsprit khas Pinisi)
  const geoBowsprit = new CylinderGeometry(0.004, 0.006, 0.12, 5);
  geoBowsprit.rotateX(Math.PI / 2.7);
  const meshBowsprit = new Mesh(geoBowsprit, matTiang);
  meshBowsprit.position.set(0, 0.052, -0.21);
  grupPerahu.add(meshBowsprit);

  // Buritan bertingkat (Stern / Aft Cabin) di belakang (+Z)
  const geoKabin = new BoxGeometry(0.07, 0.04, 0.075);
  const meshKabin = new Mesh(geoKabin, matKayuGeladak);
  meshKabin.position.set(0, 0.055, 0.065);
  grupPerahu.add(meshKabin);

  // Lentera navigasi di puncak kabin buritan
  const geoLentera = new CylinderGeometry(0.007, 0.007, 0.015, 6);
  const meshLentera = new Mesh(geoLentera, matLentera);
  meshLentera.position.set(0, 0.082, 0.088);
  meshLentera.name = 'lentera-pinisi';
  grupPerahu.add(meshLentera);

  // 3. Tiang Kembar (Two Masts)
  const geoTiangUtama = new CylinderGeometry(0.0055, 0.007, 0.27, 6);
  const meshTiangUtama = new Mesh(geoTiangUtama, matTiang);
  meshTiangUtama.position.set(0, 0.145, -0.045);
  grupPerahu.add(meshTiangUtama);

  const geoTiangBelakang = new CylinderGeometry(0.005, 0.0065, 0.23, 6);
  const meshTiangBelakang = new Mesh(geoTiangBelakang, matTiang);
  meshTiangBelakang.position.set(0, 0.135, 0.045);
  grupPerahu.add(meshTiangBelakang);

  // Palang galah layar (Yards)
  const geoGalah1 = new CylinderGeometry(0.003, 0.003, 0.09, 4);
  geoGalah1.rotateZ(Math.PI / 2);
  const meshGalah1 = new Mesh(geoGalah1, matTiang);
  meshGalah1.position.set(0, 0.17, -0.045);
  grupPerahu.add(meshGalah1);

  const geoGalah2 = new CylinderGeometry(0.0028, 0.0028, 0.075, 4);
  geoGalah2.rotateZ(Math.PI / 2);
  const meshGalah2 = new Mesh(geoGalah2, matTiang);
  meshGalah2.position.set(0, 0.155, 0.045);
  grupPerahu.add(meshGalah2);

  // 4. Layar Kain Tradisional (Sails)
  function buatGeometriLayar(p1, p2, p3) {
    const geo = new BufferGeometry();
    const vertices = new Float32Array([
      p1.x, p1.y, p1.z,
      p2.x, p2.y, p2.z,
      p3.x, p3.y, p3.z
    ]);
    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geo.computeVertexNormals();
    return geo;
  }

  // Layar tiang utama
  const geoLayar1 = buatGeometriLayar(
    new Vector3(0, 0.255, -0.045),
    new Vector3(0, 0.065, -0.045),
    new Vector3(0, 0.085, -0.125)
  );
  const meshLayar1 = new Mesh(geoLayar1, matLayar);
  grupPerahu.add(meshLayar1);

  // Layar tiang belakang
  const geoLayar2 = buatGeometriLayar(
    new Vector3(0, 0.225, 0.045),
    new Vector3(0, 0.065, 0.045),
    new Vector3(0, 0.08, -0.025)
  );
  const meshLayar2 = new Mesh(geoLayar2, matLayar);
  grupPerahu.add(meshLayar2);

  // Layar Cocor Haluan (Jib Sail - depan bowsprit)
  const geoLayarJib = buatGeometriLayar(
    new Vector3(0, 0.205, -0.045),
    new Vector3(0, 0.045, -0.14),
    new Vector3(0, 0.065, -0.23)
  );
  const meshLayarJib = new Mesh(geoLayarJib, matLayar);
  grupPerahu.add(meshLayarJib);

  // Bendera Merah Putih berkibar di tiang utama (khusus Flagship Sabang-Merauke)
  let meshBendera = null;
  if (apakahFlagship && typeof document !== 'undefined') {
    const canvasB = document.createElement('canvas');
    canvasB.width = 64;
    canvasB.height = 36;
    const ctxB = canvasB.getContext('2d');
    if (ctxB) {
      ctxB.fillStyle = '#DC2626';
      ctxB.fillRect(0, 0, 64, 18);
      ctxB.fillStyle = '#FFFFFF';
      ctxB.fillRect(0, 18, 64, 18);
      const texB = new CanvasTexture(canvasB);
      const matB = new MeshStandardMaterial({
        map: texB,
        side: DoubleSide,
        roughness: 0.6
      });
      const geoB = new PlaneGeometry(0.048, 0.027);
      meshBendera = new Mesh(geoB, matB);
      meshBendera.position.set(0.025, 0.27, -0.045);
      meshBendera.name = 'bendera-merah-putih';
      grupPerahu.add(meshBendera);
    }
  }

  // 5. Buih Ombak Halus di Belakang (Wake Trail)
  const geoWake = new PlaneGeometry(0.12, 0.24);
  geoWake.rotateX(-Math.PI / 2);
  const matWake = new MeshBasicMaterial({
    color: new Color('#E0F2FE'),
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });
  const meshWake = new Mesh(geoWake, matWake);
  meshWake.position.set(0, 0.003, 0.19);
  grupPerahu.add(meshWake);

  return {
    grup: grupPerahu,
    matLentera,
    matWake,
    meshBendera
  };
}

/**
 * Membangun ornamen Cincin Khatulistiwa Emas (Equator Line 0°)
 * Membelah kepulauan Indonesia secara presisi di Z = -0.605
 */
function bangunCincinKhatulistiwa() {
  const grup = new Group();
  grup.name = 'ornamen-khatulistiwa';

  const zKhatulistiwa = -0.605;
  const yKhatulistiwa = 0.022;

  // Garis utama khatulistiwa bercahaya emas halus membentang melintasi piringan laut
  const points = [];
  const segmen = 60;
  const lebarBentang = 12.2;
  for (let i = 0; i <= segmen; i++) {
    const x = -lebarBentang / 2 + (i / segmen) * lebarBentang;
    points.push(new Vector3(x, yKhatulistiwa, zKhatulistiwa));
  }

  const geoGaris = new BufferGeometry().setFromPoints(points);
  const matGaris = new LineDashedMaterial({
    color: new Color('#FFD54F'),
    dashSize: 0.18,
    gapSize: 0.08,
    linewidth: 1.5,
    transparent: true,
    opacity: 0.65
  });

  const garisKhatulistiwa = new Line(geoGaris, matGaris);
  garisKhatulistiwa.computeLineDistances();
  grup.add(garisKhatulistiwa);

  // Garis aksen kembar tipis di bawahnya
  const pointsBawah = points.map((p) => new Vector3(p.x, yKhatulistiwa - 0.004, zKhatulistiwa));
  const geoGarisBawah = new BufferGeometry().setFromPoints(pointsBawah);
  const matGarisBawah = new LineBasicMaterial({
    color: new Color('#FFB300'),
    transparent: true,
    opacity: 0.28
  });
  const garisBawah = new Line(geoGarisBawah, matGarisBawah);
  grup.add(garisBawah);

  // Titik penanda tugu khatulistiwa (Pasaman, Pontianak, Tomini, Halmahera)
  const lokasiKhatulistiwa = [
    { nama: 'Pasaman', x: -4.31 },
    { nama: 'Pontianak', x: -2.096 },
    { nama: 'Tomini', x: 0.451 },
    { nama: 'Halmahera', x: 2.355 }
  ];

  const geoRingTugu = new TorusGeometry(0.045, 0.007, 6, 16);
  geoRingTugu.rotateX(Math.PI / 2);
  const matRingTugu = new MeshStandardMaterial({
    color: new Color('#FFE082'),
    emissive: new Color('#FFB300'),
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.8
  });

  for (const lok of lokasiKhatulistiwa) {
    const ring = new Mesh(geoRingTugu, matRingTugu);
    ring.position.set(lok.x, yKhatulistiwa + 0.005, zKhatulistiwa);
    ring.name = `tugu-khatulistiwa-${lok.nama}`;
    grup.add(ring);
  }

  // Plakat penanda kayu beraksen emas di tepi kiri & kanan piringan laut
  const geoPlakat = new BoxGeometry(0.38, 0.015, 0.07);
  const matPlakat = new MeshStandardMaterial({
    color: new Color('#2E1F0D'),
    roughness: 0.5,
    metalness: 0.7
  });

  const plakatKiri = new Mesh(geoPlakat, matPlakat);
  plakatKiri.position.set(-5.85, yKhatulistiwa + 0.01, zKhatulistiwa);
  grup.add(plakatKiri);

  const plakatKanan = new Mesh(geoPlakat, matPlakat);
  plakatKanan.position.set(5.85, yKhatulistiwa + 0.01, zKhatulistiwa);
  grup.add(plakatKanan);

  return { grup, matGaris, matGarisBawah, matRingTugu };
}

/**
 * Membangun Garis Jalur Rempah Nusantara (The Historic Spice Routes)
 * Menghubungkan pelabuhan-pelabuhan sejarah maritim nusantara di perairan bebas
 */
function bangunJalurRempah() {
  const grup = new Group();
  grup.name = 'ornamen-jalur-rempah';

  const pelabuhan = [
    { nama: 'Malaka / Samudera Pasai', pos: new Vector3(-3.775, 0.02, -1.126) },
    { nama: 'Sunda Kelapa / Banten', pos: new Vector3(-2.687, 0.02, 0.857) },
    { nama: 'Tuban / Gresik', pos: new Vector3(-1.442, 0.02, 1.04) },
    { nama: 'Somba Opu / Makassar', pos: new Vector3(0.31, 0.02, 0.621) },
    { nama: 'Banda Neira (Kep. Banda)', pos: new Vector3(2.807, 0.02, 0.473) },
    { nama: 'Ternate & Tidore', pos: new Vector3(2.208, 0.02, -0.793) }
  ];

  // Rute 1: Jalur Selatan (Malaka -> Sunda Kelapa -> Tuban -> Makassar -> Banda)
  const kurvaSelatan = new CatmullRomCurve3([
    pelabuhan[0].pos,
    new Vector3(-3.25, 0.025, -0.1),
    pelabuhan[1].pos,
    pelabuhan[2].pos,
    new Vector3(-0.55, 0.025, 0.88),
    pelabuhan[3].pos,
    new Vector3(1.55, 0.025, 0.65),
    pelabuhan[4].pos
  ]);

  // Rute 2: Jalur Rempah Utara (Makassar -> Ternate -> Banda)
  const kurvaUtara = new CatmullRomCurve3([
    pelabuhan[3].pos,
    new Vector3(1.15, 0.025, -0.15),
    pelabuhan[5].pos,
    new Vector3(2.65, 0.025, -0.12),
    pelabuhan[4].pos
  ]);

  const matJalur = new LineDashedMaterial({
    color: new Color('#38BDF8'),
    dashSize: 0.12,
    gapSize: 0.07,
    linewidth: 1.5,
    transparent: true,
    opacity: 0.65
  });

  const geoSelatan = new BufferGeometry().setFromPoints(kurvaSelatan.getPoints(90));
  const garisSelatan = new Line(geoSelatan, matJalur);
  garisSelatan.computeLineDistances();
  grup.add(garisSelatan);

  const geoUtara = new BufferGeometry().setFromPoints(kurvaUtara.getPoints(60));
  const garisUtara = new Line(geoUtara, matJalur);
  garisUtara.computeLineDistances();
  grup.add(garisUtara);

  // Marker suar cincin mercusuar di pelabuhan rempah
  const geoBeacon = new TorusGeometry(0.04, 0.007, 5, 14);
  geoBeacon.rotateX(Math.PI / 2);
  const matBeacon = new MeshStandardMaterial({
    color: new Color('#7DD3FC'),
    emissive: new Color('#0284C7'),
    emissiveIntensity: 0.6,
    roughness: 0.25,
    metalness: 0.8
  });

  for (const p of pelabuhan) {
    const beacon = new Mesh(geoBeacon, matBeacon);
    beacon.position.copy(p.pos);
    beacon.position.y += 0.005;
    beacon.name = `beacon-rempah-${p.nama}`;
    grup.add(beacon);
  }

  return { grup, matJalur, matBeacon };
}

/**
 * Membangun Kompas Mawar Antik Bahari (Antique Compass Rose)
 * di samudra selatan barat daya Sumatera
 */
function bangunKompasMawar() {
  const grup = new Group();
  grup.name = 'kompas-mawar-nusantara';

  const posKompas = new Vector3(-3.85, 0.015, 2.05);
  grup.position.copy(posKompas);

  const geoCincinLuar = new TorusGeometry(0.48, 0.009, 6, 48);
  geoCincinLuar.rotateX(Math.PI / 2);
  const geoCincinDalam = new TorusGeometry(0.38, 0.006, 6, 48);
  geoCincinDalam.rotateX(Math.PI / 2);

  const matEmasKompas = new MeshStandardMaterial({
    color: new Color('#F59E0B'),
    emissive: new Color('#D97706'),
    emissiveIntensity: 0.35,
    roughness: 0.35,
    metalness: 0.85
  });

  const meshCincinLuar = new Mesh(geoCincinLuar, matEmasKompas);
  const meshCincinDalam = new Mesh(geoCincinDalam, matEmasKompas);
  grup.add(meshCincinLuar);
  grup.add(meshCincinDalam);

  const jarumUtama = [
    { rot: 0, scale: 0.44 },
    { rot: Math.PI / 2, scale: 0.35 },
    { rot: Math.PI, scale: 0.35 },
    { rot: -Math.PI / 2, scale: 0.35 }
  ];

  for (const j of jarumUtama) {
    const geoJarum = new ConeGeometry(0.038, j.scale, 4);
    geoJarum.rotateX(-Math.PI / 2);
    geoJarum.rotateY(j.rot);
    const meshJarum = new Mesh(geoJarum, matEmasKompas);
    meshJarum.position.set(0, 0.008, 0);
    grup.add(meshJarum);
  }

  const jarumAntara = [
    { rot: Math.PI / 4 },
    { rot: (3 * Math.PI) / 4 },
    { rot: (-3 * Math.PI) / 4 },
    { rot: -Math.PI / 4 }
  ];

  const matEmasMuda = new MeshStandardMaterial({
    color: new Color('#FCD34D'),
    roughness: 0.45,
    metalness: 0.7
  });

  for (const j of jarumAntara) {
    const geoJarum = new ConeGeometry(0.024, 0.26, 4);
    geoJarum.rotateX(-Math.PI / 2);
    geoJarum.rotateY(j.rot);
    const meshJarum = new Mesh(geoJarum, matEmasMuda);
    meshJarum.position.set(0, 0.006, 0);
    grup.add(meshJarum);
  }

  const geoPusat = new CylinderGeometry(0.032, 0.032, 0.016, 16);
  const meshPusat = new Mesh(geoPusat, matEmasKompas);
  meshPusat.position.set(0, 0.012, 0);
  grup.add(meshPusat);

  return { grup, matEmasKompas, matEmasMuda };
}

/**
 * Pabrik Utama Pembuatan Ornamen Kemaritiman Nusantara
 * Menghasilkan seluruh ornamen bahari dan fungsi update per frame
 * @param {object} [opsi={}]
 * @param {boolean} [opsi.sembunyikanAwal=true] - Sembunyikan kapal di awal hingga animasi masuk dipicu
 */
export function bangunOrnamenKemaritiman({ sembunyikanAwal = true } = {}) {
  const grupUtama = new Group();
  grupUtama.name = 'grup-ornamen-maritim-nusantara';

  // =========================================================================
  // 1. WAYPOINTS REALISTIS PERAIRAN BEBAS (100% BEBAS TABRAKAN PULAU)
  // =========================================================================

  // RUTE 1: EKSPEDISI SABANG KE MERAUKE & KELILING NUSANTARA (Flagship Merah Putih)
  // 23 titik perairan laut dalam dari Sabang melintasi Selat Malaka, Laut Jawa,
  // Laut Flores, Laut Banda, Arafura hingga Merauke, dan kembali lewat Samudra Pasifik utara
  const titikSabangMerauke = [
    new Vector3(-5.453, 0.012, -1.988), // Sabang (Titik Nol Barat)
    new Vector3(-4.905, 0.012, -1.916), // Perairan Aceh Timur
    new Vector3(-4.310, 0.012, -1.438), // Selat Malaka Tengah
    new Vector3(-3.477, 0.012, -0.962), // Selat Malaka Selatan
    new Vector3(-2.763, 0.012, -0.367), // Selat Karimata (antara Sum & Kal)
    new Vector3(-2.287, 0.012, 0.348),  // Laut Jawa Barat
    new Vector3(-1.335, 0.012, 0.635),  // Laut Jawa Tengah (utara Jawa)
    new Vector3(-0.382, 0.012, 0.946),  // Laut Bali Utara
    new Vector3(0.451, 0.012, 1.114),   // Laut Flores (selatan Sul, utara NTT)
    new Vector3(1.641, 0.012, 0.946),   // Laut Banda Selatan
    new Vector3(3.069, 0.012, 0.946),   // Laut Arafura Barat
    new Vector3(4.379, 0.012, 1.186),   // Laut Arafura Tengah
    new Vector3(5.307, 0.012, 1.426),   // Merauke (Ujung Timur)
    // Jalur laut utara kembali ke Sabang
    new Vector3(5.450, 0.012, 0.587),   // Perairan Kolam Arafura Timur
    new Vector3(4.736, 0.012, -0.486),  // Samudra Pasifik Jayapura
    new Vector3(3.307, 0.012, -0.724),  // Samudra Pasifik utara Kepala Burung
    new Vector3(1.998, 0.012, -0.962),  // Laut Maluku Utara (utara Halmahera)
    new Vector3(0.808, 0.012, -1.128),  // Laut Sulawesi (utara Manado)
    new Vector3(-0.144, 0.012, -1.438), // Perairan Tarakan Luar
    new Vector3(-1.454, 0.012, -1.510), // Laut Natuna Timur
    new Vector3(-2.525, 0.012, -1.438), // Laut Natuna Kepulauan
    new Vector3(-3.477, 0.012, -1.677), // Laut Cina Selatan Luar
    new Vector3(-4.548, 0.012, -1.988)  // Perairan utara Sabang
  ];

  const kurvaSabangMerauke = new CatmullRomCurve3(titikSabangMerauke, true, 'centripetal');

  // RUTE 2: PINISI "SAMUDRA FLORES" (Perairan terbuka Laut Flores & Selat Makassar Selatan)
  // Menjelajahi koridor laut dalam selatan Sulawesi tanpa menabrak daratan
  const titikRuteFlores = [
    new Vector3(0.25, 0.012, 0.72),  // Selat Makassar Selatan
    new Vector3(0.85, 0.012, 0.95),  // Laut Flores Barat (utara Sumbawa)
    new Vector3(1.55, 0.012, 0.82),  // Laut Flores Timur (utara Flores)
    new Vector3(1.15, 0.012, 0.52)   // Laut Selayar Selatan (barat daya Wakatobi)
  ];
  const kurvaFlores = new CatmullRomCurve3(titikRuteFlores, true, 'centripetal');

  // RUTE 3: PINISI "PALA BANDA" (Perairan Laut Jawa & Selat Karimata Luas)
  // Menjelajahi koridor laut terbuka luas antara Jawa dan Kalimantan
  const titikRuteJawa = [
    new Vector3(-2.35, 0.012, 0.28),  // Laut Jawa Barat (utara Jakarta/Cirebon)
    new Vector3(-1.35, 0.012, 0.55),  // Laut Jawa Tengah (utara Semarang)
    new Vector3(-1.05, 0.012, 0.15),  // Laut Jawa Timur (selatan Bawean)
    new Vector3(-2.05, 0.012, -0.15)  // Selat Karimata Selatan (selatan Belitung)
  ];
  const kurvaJawa = new CatmullRomCurve3(titikRuteJawa, true, 'centripetal');

  // =========================================================================
  // 2. PEMBUATAN 3 KAPAL PINISI BESERTA RUTENYA
  // =========================================================================
  const armada = [
    {
      nama: 'Pinisi Flagship • Ekspedisi Sabang-Merauke',
      kurva: kurvaSabangMerauke,
      kecepatan: 0.0075, // Perjalanan agung penuh melintasi nusantara
      fase: 0.0,
      skala: 0.82,
      apakahFlagship: true
    },
    {
      nama: 'Pinisi 2 • Selat Makassar & Laut Flores',
      kurva: kurvaFlores,
      kecepatan: 0.024,
      fase: 0.35,
      skala: 0.65,
      apakahFlagship: false
    },
    {
      nama: 'Pinisi 3 • Laut Jawa & Karimata',
      kurva: kurvaJawa,
      kecepatan: 0.022,
      fase: 0.70,
      skala: 0.65,
      apakahFlagship: false
    }
  ];

  const daftarPinisi = [];

  for (const item of armada) {
    const p = buatModelPerahuPinisi({ apakahFlagship: item.apakahFlagship });
    if (sembunyikanAwal) {
      p.grup.scale.set(0, 0, 0);
    } else {
      p.grup.scale.multiplyScalar(item.skala);
    }
    grupUtama.add(p.grup);
    daftarPinisi.push({
      ...p,
      data: item,
      faktorSkala: sembunyikanAwal ? 0.0 : 1.0,
      offsetYMasuk: sembunyikanAwal ? -0.30 : 0.0
    });
  }

  // Visualisasi Jejak Navigasi Halus Rute Sabang-Merauke di Laut
  const geoJalurSabangMerauke = new BufferGeometry().setFromPoints(kurvaSabangMerauke.getPoints(140));
  const matJalurSabangMerauke = new LineDashedMaterial({
    color: new Color('#FCD34D'), // Garis emas tipis pelayaran nasional
    dashSize: 0.10,
    gapSize: 0.08,
    linewidth: 1.2,
    transparent: true,
    opacity: 0.45
  });
  const garisSabangMerauke = new Line(geoJalurSabangMerauke, matJalurSabangMerauke);
  garisSabangMerauke.computeLineDistances();
  grupUtama.add(garisSabangMerauke);

  // 3. Bangun Cincin Khatulistiwa Emas (Equator Line 0°)
  const khatulistiwa = bangunCincinKhatulistiwa();
  grupUtama.add(khatulistiwa.grup);

  // 4. Bangun Jalur Rempah Maritim (Historic Spice Routes)
  const jalurRempah = bangunJalurRempah();
  grupUtama.add(jalurRempah.grup);

  // 5. Bangun Kompas Mawar Bahari (Antique Compass Rose)
  const kompasMawar = bangunKompasMawar();
  if (sembunyikanAwal) {
    kompasMawar.grup.scale.set(0, 0, 0);
  }
  grupUtama.add(kompasMawar.grup);

  /**
   * Update animasi berlayar perahu Pinisi & buih ombak setiap frame
   * Menggunakan evaluasi spline Catmull-Rom presisi untuk posisi & heading kapal
   * @param {number} tDetik
   */
  function update(tDetik) {
    // 1. Animasi Pelayaran 3 Kapal Pinisi Mengikuti Jalur Laut Bebas
    for (let i = 0; i < daftarPinisi.length; i++) {
      const item = daftarPinisi[i];
      const d = item.data;

      // Nilai progres u in [0, 1] sepanjang kurva (aman dari negatif & NaN)
      const waktuAman = Math.max(0, Number.isFinite(tDetik) ? tDetik : 0);
      const rawU = (d.fase + waktuAman * d.kecepatan) % 1.0;
      const u = ((rawU % 1.0) + 1.0) % 1.0;
      const uAman = Math.max(0.0001, Math.min(0.9999, u));

      let pos, tangent;
      try {
        pos = d.kurva.getPointAt(uAman);
        tangent = d.kurva.getTangentAt(uAman).normalize();
      } catch (errSpline) {
        pos = d.kurva.getPoint(uAman);
        tangent = new Vector3(0, 0, 1);
      }

      // Ayunan gelombang laut alami (Heave, Roll, Pitch)
      const heave = Math.sin(waktuAman * 2.4 + i * 1.5) * 0.008;
      const roll = Math.sin(waktuAman * 2.1 + i * 1.2) * 0.040;
      const pitch = Math.sin(waktuAman * 1.8 + i) * 0.022;

      // Skala kapal (mendukung animasi pop-up masuk)
      const faktorS = item.faktorSkala ?? 1.0;
      const s = item.data.skala * faktorS;
      item.grup.scale.set(s, s, s);

      // Posisi menyembul dari bawah laut ke permukaan
      item.grup.position.set(pos.x, pos.y + heave + (item.offsetYMasuk || 0), pos.z);

      // Sudut heading rotasi Y menghadap tepat ke arah laju kapal
      const heading = Math.atan2(tangent.x, tangent.z);
      item.grup.rotation.set(pitch, heading, roll);

      // Kibaran bendera Merah Putih pada Flagship
      if (item.meshBendera) {
        item.meshBendera.rotation.y = Math.sin(waktuAman * 5.0) * 0.22;
        item.meshBendera.rotation.z = Math.cos(waktuAman * 4.2) * 0.08;
      }

      // Denyut buih ombak di buritan
      if (item.matWake) {
        item.matWake.opacity = (0.38 + Math.sin(waktuAman * 3.5 + i) * 0.12) * faktorS;
      }
    }

    // 2. Denyut halus garis jalur navigasi
    if (matJalurSabangMerauke) {
      matJalurSabangMerauke.opacity = 0.40 + Math.sin(tDetik * 1.5) * 0.12;
    }
    if (jalurRempah.matJalur) {
      jalurRempah.matJalur.opacity = 0.55 + Math.sin(tDetik * 1.8) * 0.15;
    }
    if (jalurRempah.matBeacon) {
      jalurRempah.matBeacon.emissiveIntensity = 0.5 + Math.sin(tDetik * 2.2) * 0.25;
    }
    if (khatulistiwa.matGaris) {
      khatulistiwa.matGaris.opacity = 0.60 + Math.sin(tDetik * 1.4) * 0.15;
    }
  }

  let animasiMasukSelesai = !sembunyikanAwal;

  /**
   * Memicu animasi dramatis kemunculan kapal Pinisi:
   * Menyembul dari bawah laut dengan pantulan membal menggemaskan (bouncy pop-up)
   * beriringan dengan munculnya pulau-pulau dari tengah nusantara
   */
  function mulaiAnimasiMasuk() {
    if (animasiMasukSelesai) return;

    const kurangiGerak =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (kurangiGerak) {
      for (const p of daftarPinisi) {
        p.faktorSkala = 1.0;
        p.offsetYMasuk = 0.0;
        const s = p.data.skala;
        p.grup.scale.set(s, s, s);
      }
      if (kompasMawar?.grup) kompasMawar.grup.scale.set(1, 1, 1);
      animasiMasukSelesai = true;
      return;
    }

    // Urutan kemunculan 3 kapal selaras dengan penyebaran keping pulau dari tengah keluar:
    // 1. Pinisi 2 (Selat Makassar / Flores - TENGAH): muncul duluan bersama pulau tengah (delay ~0.25s)
    // 2. Pinisi 3 (Laut Jawa & Karimata - BARAT-TENGAH): muncul bersama pulau Jawa/Kalimantan (delay ~0.55s)
    // 3. Pinisi 1 Flagship (Sabang - BARAT JAUH): muncul agung bersama Aceh/Sabang berbendera Merah Putih (delay ~0.85s)
    const urutanKemunculan = [
      { indeks: 1, delay: 0.25 }, // Pinisi Flores
      { indeks: 2, delay: 0.55 }, // Pinisi Laut Jawa
      { indeks: 0, delay: 0.85 }  // Flagship Sabang-Merauke
    ];

    urutanKemunculan.forEach(({ indeks, delay }) => {
      const p = daftarPinisi[indeks];
      if (!p) return;

      // Pop-up skala membal keluar dari air
      gsap.to(p, {
        faktorSkala: 1.0,
        duration: 0.75,
        delay,
        ease: 'back.out(2.4)'
      });

      // Menyembul naik dari bawah permukaan laut dan bergoyang di ombak
      gsap.to(p, {
        offsetYMasuk: 0.0,
        duration: 0.85,
        delay,
        ease: 'back.out(1.8)',
        onComplete: () => {
          if (indeks === 0) {
            animasiMasukSelesai = true;
          }
        }
      });
    });

    // Ornamen Kompas Mawar di samudra selatan juga membal anggun
    if (kompasMawar?.grup) {
      kompasMawar.grup.scale.set(0, 0, 0);
      gsap.to(kompasMawar.grup.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.85,
        delay: 0.35,
        ease: 'back.out(1.8)'
      });
    }
  }

  /**
   * Mengubah nuansa ornamen saat mode Siang ☀️ dan Malam 🌙
   * @param {'siang'|'malam'} mode
   */
  function setModeWaktu(mode) {
    const adalahMalam = mode === 'malam';

    // Lentera perahu Pinisi menyala hangat di malam hari
    for (const p of daftarPinisi) {
      if (p.matLentera) {
        p.matLentera.emissiveIntensity = adalahMalam ? 1.4 : 0.45;
      }
    }

    // Jalur pelayaran lebih bersinar di malam hari
    if (matJalurSabangMerauke) {
      matJalurSabangMerauke.color.set(adalahMalam ? '#FDE047' : '#FCD34D');
    }
    if (jalurRempah.matJalur) {
      jalurRempah.matJalur.color.set(adalahMalam ? '#60A5FA' : '#38BDF8');
    }
    if (khatulistiwa.matGaris) {
      khatulistiwa.matGaris.color.set(adalahMalam ? '#FBBF24' : '#FFD54F');
    }
  }

  function dispose() {
    grupUtama.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }

  return {
    grup: grupUtama,
    daftarPinisi,
    update,
    mulaiAnimasiMasuk,
    setModeWaktu,
    dispose
  };
}
