/**
 * build-scene.js — Pembuatan adegan lengkap diorama Three.js:
 * Papan laut low-poly, pencahayaan lembut, keping provinsi, dan awan melayang.
 * Sesuai spesifikasi TUGAS Bagian 4, 5, dan 7.
 */

import {
  Scene,
  Group,
  CylinderGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  Mesh,
  Color,
  HemisphereLight,
  DirectionalLight,
  Vector3
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { bangunKepingProvinsi } from './build-provinces.js';
import { bangunGugusAwan } from './build-clouds.js';

const WARNA_LAUT = '#24336E';
const WARNA_TEPI_LAUT = '#3A52B0';

/**
 * Membangun papan laut silinder pipih dengan tepi sedikit terangkat dan gelombang halus low-poly.
 * @returns {{ mesh: Mesh, posisiVertexAsal: Float32Array }}
 */
function bangunPapanLautDiorama() {
  const radius = 6.6;
  const tinggi = 0.28;
  const segmenRadial = 64;

  // Silinder dasar laut
  const geoLaut = new CylinderGeometry(radius, radius + 0.12, tinggi, segmenRadial, 4);

  // Simpan posisi asli vertex untuk kalkulasi gelombang halus di CPU
  const posAttr = geoLaut.attributes.position;
  const posisiVertexAsal = new Float32Array(posAttr.array);

  // Material laut dengan flat shading bernuansa navy cerah
  const matLaut = new MeshStandardMaterial({
    color: new Color('#24336E'),
    roughness: 0.78,
    metalness: 0.05,
    flatShading: true
  });

  const meshLaut = new Mesh(geoLaut, matLaut);
  meshLaut.name = 'papan-laut';
  // Posisikan permukaan atas papan laut tepat di bawah dasar daratan (y = -0.06)
  meshLaut.position.set(0, -tinggi / 2 - 0.06, 0);
  meshLaut.receiveShadow = true;

  // Cincin tepi bevel yang sedikit lebih terang (#3A52B0)
  const geoTepi = new TorusGeometry(radius + 0.04, 0.06, 6, segmenRadial);
  geoTepi.rotateX(Math.PI / 2);
  const matTepi = new MeshStandardMaterial({
    color: new Color(WARNA_TEPI_LAUT),
    roughness: 0.8,
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

  return { mesh: meshLaut, posisiVertexAsal };
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
 * @returns {object} adegan, grupUtama, kepingProvinsi, gugusAwan, papanLaut, lampu
 */
export function bangunAdeganDiorama({
  geoProvinsi,
  daftarProvinsi,
  proyeksi,
  modeWarna = 'natural',
  aktifkanBayangan = true
}) {
  const scene = new Scene();
  scene.name = 'adegan-diorama-indonesia';

  // Grup poros utama untuk menampung seluruh diorama
  const grupUtama = new Group();
  grupUtama.name = 'grup-utama-diorama';
  scene.add(grupUtama);

  // 1. Pencahayaan lembut sesuai Bagian 7
  // HemisphereLight: langit putih #ffffff, tanah biru-indigo #4a5a8a, intensitas 0.95
  const hemiLight = new HemisphereLight(0xffffff, 0x4a5a8a, 0.95);
  scene.add(hemiLight);

  // DirectionalLight hangat (intensitas 2.2) dari kiri-atas depan
  const dirLight = new DirectionalLight(0xfffaed, 2.2);
  dirLight.position.set(-6, 12, 8);
  dirLight.castShadow = Boolean(aktifkanBayangan);

  if (aktifkanBayangan) {
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -8;
    dirLight.shadow.camera.right = 8;
    dirLight.shadow.camera.top = 8;
    dirLight.shadow.camera.bottom = -8;
    dirLight.shadow.bias = -0.0005;
  }
  scene.add(dirLight);

  // 2. Papan laut diorama
  const { mesh: papanLaut, posisiVertexAsal: vertexLautAsal } = bangunPapanLautDiorama();
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

  /**
   * Mengubah mode pewarnaan antara 'natural' dan 'data'
   * @param {'natural'|'data'} mode
   */
  function aturModeWarna(mode) {
    for (const mesh of daftarProvinsiMesh) {
      const u = mesh.userData;
      const targetHex = mode === 'data' ? u.warnaDataHex : u.warnaNaturalHex;
      mesh.material.color.set(targetHex);
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
    aturModeWarna
  };
}
