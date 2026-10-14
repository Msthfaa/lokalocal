/**
 * build-sky.js — Ornamen 3D Matahari ☀️ & Bulan 🌙 di Langit Diorama
 * Menyediakan ornamen 3D yang selalu tampak jelas di latar belakang kepulauan nusantara
 * dengan transisi kemunculan skala halus (tanpa tembus laut) saat berganti Siang/Malam.
 */

import {
  Group,
  Mesh,
  IcosahedronGeometry,
  OctahedronGeometry,
  ConeGeometry,
  MeshStandardMaterial,
  Color,
  Vector3
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Membangun ornamen langit 3D (Matahari, Bulan, Bintang)
 * @returns {object} API kontrol langit
 */
export function bangunLangitDiorama() {
  const grupLangit = new Group();
  grupLangit.name = 'grup-langit-tata-surya';

  // ==========================================
  // 1. MATAHARI ☀️ (Langit Kiri-Atas Belakang)
  // ==========================================
  const grupMatahari = new Group();
  grupMatahari.name = 'matahari-3d';

  // Inti bola matahari low-poly
  const geoIntiMatahari = new IcosahedronGeometry(0.55, 1);
  const matIntiMatahari = new MeshStandardMaterial({
    color: new Color('#FFC425'),
    emissive: new Color('#FF7700'),
    emissiveIntensity: 0.95,
    roughness: 0.25,
    metalness: 0.05,
    flatShading: true
  });
  const meshIntiMatahari = new Mesh(geoIntiMatahari, matIntiMatahari);
  grupMatahari.add(meshIntiMatahari);

  // Cincin berkas sinar matahari (8 kerucut sinar low-poly)
  const daftarSinar = [];
  const jumlahSinar = 8;
  for (let i = 0; i < jumlahSinar; i++) {
    const sudut = (i / jumlahSinar) * Math.PI * 2;
    const geoSinar = new ConeGeometry(0.12, 0.42, 4);
    geoSinar.rotateZ(-Math.PI / 2);
    geoSinar.translate(0.72, 0, 0);
    geoSinar.rotateZ(sudut);
    daftarSinar.push(geoSinar);
  }
  const geoSemuaSinar = mergeGeometries(daftarSinar, false);
  const matSinar = new MeshStandardMaterial({
    color: new Color('#FFA826'),
    emissive: new Color('#FF5500'),
    emissiveIntensity: 0.75,
    roughness: 0.3,
    metalness: 0.0,
    flatShading: true
  });
  const meshSinarMatahari = new Mesh(geoSemuaSinar, matSinar);
  grupMatahari.add(meshSinarMatahari);

  // Posisi permanen di langit kiri-atas belakang (tidak menabrak navbar dan tidak tembus laut)
  grupMatahari.position.set(-2.2, 2.4, -3.8);
  grupMatahari.scale.set(1, 1, 1);
  grupLangit.add(grupMatahari);

  // ==========================================
  // 2. BULAN 🌙 (Langit Kanan-Atas Belakang)
  // ==========================================
  const grupBulan = new Group();
  grupBulan.name = 'bulan-3d';

  // Bola bulan kawah low-poly
  const geoBulan = new IcosahedronGeometry(0.48, 1);
  const matBulan = new MeshStandardMaterial({
    color: new Color('#E8F0FE'),
    emissive: new Color('#7597E8'),
    emissiveIntensity: 0.75,
    roughness: 0.55,
    metalness: 0.05,
    flatShading: true
  });
  const meshBulan = new Mesh(geoBulan, matBulan);
  grupBulan.add(meshBulan);

  // Taburan 22 bintang mini low-poly di sekitar bulan
  const daftarBintang = [];
  for (let i = 0; i < 22; i++) {
    const rad = 0.85 + (i % 5) * 0.38;
    const theta = (i / 22) * Math.PI * 2;
    const phi = ((i % 4) - 1.5) * 0.35;
    const geoBintang = new OctahedronGeometry(0.045 + (i % 3) * 0.015, 0);
    const bx = Math.cos(theta) * rad;
    const by = Math.sin(phi) * rad;
    const bz = Math.sin(theta) * rad;
    geoBintang.translate(bx, by, bz);
    daftarBintang.push(geoBintang);
  }
  const geoSemuaBintang = mergeGeometries(daftarBintang, false);
  const matBintang = new MeshStandardMaterial({
    color: new Color('#FFFFFF'),
    emissive: new Color('#C0D4FF'),
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.1,
    flatShading: true
  });
  const meshBintang = new Mesh(geoSemuaBintang, matBintang);
  grupBulan.add(meshBintang);

  // Posisi permanen di langit kanan-atas belakang
  grupBulan.position.set(2.2, 2.4, -3.8);
  grupBulan.scale.set(0.001, 0.001, 0.001); // Awalnya sembunyi saat mode siang
  grupLangit.add(grupBulan);

  // State waktu
  let modeWaktu = 'siang'; // 'siang' | 'malam'
  let targetSkalaMatahari = 1.0;
  let targetSkalaBulan = 0.001;

  /**
   * Mengatur mode waktu (siang / malam)
   * Menggunakan transisi skala & emissive yang bebas tembus 100%
   * @param {'siang'|'malam'} mode
   */
  function setModeWaktu(mode) {
    modeWaktu = mode === 'malam' ? 'malam' : 'siang';
    if (modeWaktu === 'siang') {
      targetSkalaMatahari = 1.0;
      targetSkalaBulan = 0.001;
    } else {
      targetSkalaMatahari = 0.001;
      targetSkalaBulan = 1.0;
    }
  }

  function toggleModeWaktu() {
    const baru = modeWaktu === 'siang' ? 'malam' : 'siang';
    setModeWaktu(baru);
    return baru;
  }

  /**
   * Update animasi tiap frame
   * @param {number} tDetik
   */
  function update(tDetik) {
    // Lerp skala transisi kemunculan matahari dan bulan (sangat halus)
    const curSkalaM = grupMatahari.scale.x;
    const nextSkalaM = curSkalaM + (targetSkalaMatahari - curSkalaM) * 0.08;
    grupMatahari.scale.set(nextSkalaM, nextSkalaM, nextSkalaM);
    grupMatahari.visible = nextSkalaM > 0.01;

    const curSkalaB = grupBulan.scale.x;
    const nextSkalaB = curSkalaB + (targetSkalaBulan - curSkalaB) * 0.08;
    grupBulan.scale.set(nextSkalaB, nextSkalaB, nextSkalaB);
    grupBulan.visible = nextSkalaB > 0.01;

    // Putar berkas sinar matahari perlahan
    if (meshSinarMatahari && grupMatahari.visible) {
      meshSinarMatahari.rotation.z = tDetik * 0.35;
      meshIntiMatahari.rotation.y = tDetik * 0.25;
    }

    // Kelap-kelip bintang malam
    if (meshBintang && grupBulan.visible) {
      meshBintang.rotation.y = tDetik * 0.14;
      meshBintang.rotation.x = Math.sin(tDetik * 0.25) * 0.08;
      meshBulan.rotation.y = tDetik * 0.15;
    }
  }

  return {
    grup: grupLangit,
    setModeWaktu,
    toggleModeWaktu,
    update,
    getModeWaktu: () => modeWaktu
  };
}
