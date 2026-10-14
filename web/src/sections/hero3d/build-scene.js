/**
 * build-scene.js — Pembuatan adegan lengkap diorama Three.js:
 * Papan laut low-poly kompak, pencahayaan cerah tropis (bebas mati lampu/bayangan hitam di 360°),
 * keping provinsi, awan melayang, dan ornamen langit 3D (Matahari ☀️ & Bulan 🌙).
 */

import {
  Scene,
  Group,
  CylinderGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  Mesh,
  Color,
  AmbientLight,
  HemisphereLight,
  DirectionalLight,
  Vector3
} from 'three';
import { bangunKepingProvinsi } from './build-provinces.js';
import { bangunGugusAwan } from './build-clouds.js';
import { bangunLangitDiorama } from './build-sky.js';
import { bangunLampuMalamNusantara } from './build-lights.js';
import { bangunOrnamenKemaritiman } from './ornamen-maritim.js';

// Warna laut cerah jenuh segar sesuai video referensi
const WARNA_LAUT_SIANG = '#2D5FC7';
const WARNA_TEPI_SIANG = '#4E82E8';
const WARNA_LAUT_MALAM = '#162248';
const WARNA_TEPI_MALAM = '#2A3B72';

/**
 * Membangun papan laut silinder kompak yang proporsional membungkus kepulauan nusantara
 * @returns {{ mesh: Mesh, posisiVertexAsal: Float32Array, matLaut: MeshStandardMaterial, matTepi: MeshStandardMaterial }}
 */
function bangunPapanLautDiorama() {
  const radius = 5.3;
  const tinggi = 0.22;
  const segmenRadial = 64;

  // Silinder dasar laut
  const geoLaut = new CylinderGeometry(radius, radius + 0.1, tinggi, segmenRadial, 4);

  // Simpan posisi asli vertex untuk kalkulasi gelombang halus di CPU
  const posAttr = geoLaut.attributes.position;
  const posisiVertexAsal = new Float32Array(posAttr.array);

  // Material laut dengan flat shading bernuansa biru tropis cerah
  const matLaut = new MeshStandardMaterial({
    color: new Color(WARNA_LAUT_SIANG),
    roughness: 0.65,
    metalness: 0.08,
    flatShading: true
  });

  const meshLaut = new Mesh(geoLaut, matLaut);
  meshLaut.name = 'papan-laut';
  meshLaut.position.set(0, -tinggi / 2 - 0.06, 0);
  meshLaut.receiveShadow = true;

  // Cincin tepi bevel yang sedikit lebih terang
  const geoTepi = new TorusGeometry(radius + 0.04, 0.05, 6, segmenRadial);
  geoTepi.rotateX(Math.PI / 2);
  const matTepi = new MeshStandardMaterial({
    color: new Color(WARNA_TEPI_SIANG),
    roughness: 0.7,
    metalness: 0.0,
    flatShading: true
  });
  const meshTepi = new Mesh(geoTepi, matTepi);
  meshTepi.name = 'tepi-papan-laut';
  meshTepi.position.set(0, tinggi / 2, 0);
  meshLaut.add(meshTepi);

  meshLaut.userData = {
    posisiAsal: meshLaut.position.clone(),
    rotasiAsal: meshLaut.rotation.clone(),
    posisiVertexAsal
  };

  return { mesh: meshLaut, posisiVertexAsal, matLaut, matTepi };
}

/**
 * Membangun adegan diorama 3D lengkap.
 *
 * @param {object} parameter
 * @param {object} parameter.geoProvinsi
 * @param {Array} parameter.daftarProvinsi
 * @param {object} parameter.proyeksi
 * @param {'natural'|'data'} [parameter.modeWarna='natural']
 * @param {boolean} [parameter.aktifkanBayangan=true]
 * @returns {object} adegan, grupUtama, kepingProvinsi, gugusAwan, papanLaut, lampu, pengontrolLangit
 */
export function bangunAdeganDiorama({
  geoProvinsi,
  daftarProvinsi,
  proyeksi,
  modeWarna = 'natural',
  aktifkanBayangan = true,
  sembunyikanMaritimAwal = false
}) {
  const scene = new Scene();
  scene.name = 'adegan-diorama-indonesia';

  // Grup poros utama untuk menampung seluruh diorama
  const grupUtama = new Group();
  grupUtama.name = 'grup-utama-diorama';
  scene.add(grupUtama);

  // ==========================================
  // 1. PENCAHAYAAN CERAH TROPIS (BEBAS MATI LAMPU DI 360°)
  // ==========================================
  // Ambient Light merata agar di semua sudut rotasi pulau tidak pernah hitam kelam
  const ambLight = new AmbientLight(0xffffff, 1.35);
  scene.add(ambLight);

  // Hemisphere Light langit putih hangat & pantulan biru langit
  const hemiLight = new HemisphereLight(0xffffff, 0x85abf2, 1.0);
  scene.add(hemiLight);

  // Directional Light Utama (Matahari Siang) dari atas-depan
  const dirLight = new DirectionalLight(0xfff7e6, 1.9);
  dirLight.position.set(2, 13, 6);
  dirLight.castShadow = Boolean(aktifkanBayangan);

  if (aktifkanBayangan) {
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -7;
    dirLight.shadow.camera.right = 7;
    dirLight.shadow.camera.top = 7;
    dirLight.shadow.camera.bottom = -7;
    dirLight.shadow.bias = -0.0005;
  }
  scene.add(dirLight);

  // Fill Light lembut dari belakang agar sisi belakang pulau tetap cerah saat diputar
  const fillLight = new DirectionalLight(0xd4e4ff, 0.75);
  fillLight.position.set(-3, 9, -6);
  scene.add(fillLight);

  // 2. Papan laut diorama kompak
  const { mesh: papanLaut, posisiVertexAsal: vertexLautAsal, matLaut, matTepi } = bangunPapanLautDiorama();
  grupUtama.add(papanLaut);

  // 3. 38 Keping Provinsi
  const { grup: grupProvinsi, daftarMesh: daftarProvinsiMesh, petaMeshByKode } =
    bangunKepingProvinsi({
      geoProvinsi,
      daftarProvinsi,
      proyeksi,
      modeAwal: modeWarna
    });
  grupUtama.add(grupProvinsi);

  // 4. Gugus awan melayang
  const { grup: grupAwan, daftarAwan } = bangunGugusAwan();
  grupUtama.add(grupAwan);

  // 5. Ornamen Langit 3D (Matahari ☀️ & Bulan 🌙)
  const pengontrolLangit = bangunLangitDiorama();
  grupUtama.add(pengontrolLangit.grup);

  // 6. Titik-Titik Cahaya Lampu Malam Nusantara (Night City Lights yang menempel langsung di keping pulau)
  const pengontrolLampuMalam = bangunLampuMalamNusantara({ geoProvinsi, proyeksi, petaMeshByKode });

  // 7. Ornamen Kemaritiman Nusantara (3 Perahu Layar Pinisi Berlayar, Cincin Khatulistiwa 0°, Jalur Rempah, & Kompas Mawar)
  const pengontrolMaritim = bangunOrnamenKemaritiman({ sembunyikanAwal: sembunyikanMaritimAwal });
  grupUtama.add(pengontrolMaritim.grup);

  let modeWaktuAktif = 'siang';

  /**
   * Mengatur mode waktu antara Siang ☀️ dan Malam 🌙
   * Menjamin pencahayaan selalu terang, hidup, dan indah
   * @param {'siang'|'malam'} mode
   */
  function aturModeWaktu(mode) {
    modeWaktuAktif = mode === 'malam' ? 'malam' : 'siang';
    pengontrolLangit.setModeWaktu(modeWaktuAktif);
    pengontrolLampuMalam.setModeWaktu(modeWaktuAktif);
    pengontrolMaritim.setModeWaktu(modeWaktuAktif);

    if (modeWaktuAktif === 'malam') {
      // Cahaya malam temaram bernuansa bulan kosmis elegan
      ambLight.intensity = 0.65;
      hemiLight.color.set('#6B80B5');
      hemiLight.groundColor.set('#1A2238');
      hemiLight.intensity = 0.65;

      dirLight.color.set('#B5C8E8');
      dirLight.intensity = 1.25;

      fillLight.color.set('#5B70A8');
      fillLight.intensity = 0.45;

      matLaut.color.set(WARNA_LAUT_MALAM);
      matTepi.color.set(WARNA_TEPI_MALAM);
    } else {
      // Cahaya siang cerah hangat bernuansa matahari tropis
      ambLight.intensity = 1.35;
      hemiLight.color.set(0xffffff);
      hemiLight.groundColor.set(0x85abf2);
      hemiLight.intensity = 1.0;

      dirLight.color.set(0xfff7e6);
      dirLight.intensity = 1.9;

      fillLight.color.set(0xd4e4ff);
      fillLight.intensity = 0.75;

      matLaut.color.set(WARNA_LAUT_SIANG);
      matTepi.color.set(WARNA_TEPI_SIANG);
    }

    return modeWaktuAktif;
  }

  /**
   * Mengubah mode pewarnaan antara 'natural' dan 'data'
   * @param {'natural'|'data'} mode
   */
  function aturModeWarna(mode) {
    for (const mesh of daftarProvinsiMesh) {
      const u = mesh.userData;
      const targetHex = mode === 'data' ? u.warnaDataHex : u.warnaNaturalHex;
      if (u.materialNormal) {
        u.materialNormal.color.set(targetHex);
      }
      if (mesh.material) {
        mesh.material.color.set(targetHex);
      }
      if (u.warnaNormal) {
        u.warnaNormal.set(targetHex);
      }
    }
  }

  return {
    scene,
    grupUtama,
    papanLaut,
    vertexLautAsal,
    daftarProvinsiMesh,
    petaMeshByKode,
    daftarAwan,
    grupProvinsi,
    grupAwan,
    dirLight,
    hemiLight,
    ambLight,
    fillLight,
    pengontrolLangit,
    pengontrolLampuMalam,
    pengontrolMaritim,
    aturModeWarna,
    aturModeWaktu,
    getModeWaktu: () => modeWaktuAktif
  };
}
