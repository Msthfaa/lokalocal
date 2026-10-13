/**
 * pose.js — Fungsi murni penentuan pose 3D berdasarkan progress scroll [0, 1] dan waktu idle.
 * Sesuai spesifikasi TUGAS Bagian 2 & 6:
 * - Tidak ada simulasi fisika atau akumulasi state.
 * - pose = f(progress, waktu_idle).
 * - Saat progress = 0, seluruh keping kembali menyatu persis seperti semula (toleransi < 1e-6).
 */

import { Quaternion, Vector3 } from 'three';

/**
 * Fungsi easing cubic standar [0, 1] -> [0, 1]
 * @param {number} t
 * @returns {number}
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Fungsi easing sine standar [0, 1] -> [0, 1]
 * @param {number} t
 * @returns {number}
 */
export function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Membatasi nilai x di rentang [min, max]
 * @param {number} x
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

// Objek reusable sementara untuk menghindari alokasi memori (garbage collection) per frame
const tempVec = new Vector3();
const tempQuat = new Quaternion();
const quatIdentitas = new Quaternion();

/**
 * Menerapkan pose secara murni ke seluruh elemen adegan diorama 3D
 * berdasarkan satu nilai progress [0, 1] dan waktu idle (detik).
 *
 * @param {number} progress - Nilai scroll progress [0, 1]
 * @param {number} waktuIdle - Waktu berjalan (detik) untuk animasi halus idle
 * @param {object} elemenAdegan - Objek yang dikembalikan oleh bangunAdeganDiorama
 * @param {THREE.Camera} camera - Kamera adegan
 * @param {THREE.Vector3} cameraBasePos - Posisi awal kamera
 */
export function aplikasikanPose(progress, waktuIdle, elemenAdegan, camera, cameraBasePos) {
  const p = clamp(progress, 0, 1);
  const eGlobal = easeInOutCubic(p);

  const {
    grupUtama,
    papanLaut,
    vertexLautAsal,
    daftarProvinsiMesh,
    daftarAwan
  } = elemenAdegan;

  // 1. Goyang idle grup utama: hanya aktif saat p dekat 0, hilang saat p naik
  const faktorIdlePeta = Math.max(0, 1 - eGlobal * 1.5);
  if (grupUtama) {
    grupUtama.rotation.y = Math.sin(waktuIdle * 0.35) * 0.02 * faktorIdlePeta;
    grupUtama.rotation.x = 0.05 + Math.cos(waktuIdle * 0.28) * 0.01 * faktorIdlePeta;
  }

  // 2. Transformasi 38 Keping Provinsi (Pecah dari tengah keluar)
  for (let i = 0; i < daftarProvinsiMesh.length; i++) {
    const mesh = daftarProvinsiMesh[i];
    const u = mesh.userData;

    // Jadwal gelombang dari tengah keluar sesuai rNorm
    const mulai = 0.12 + 0.28 * u.rNorm;
    const durasi = 0.40;
    const q = clamp((p - mulai) / durasi, 0, 1);
    const e = easeInOutCubic(q);

    // Posisi: c_i + dir_i * D_i * e_i + (0, H_i * e_i, 0)
    mesh.position.copy(u.pusatAsal);
    if (e > 0) {
      tempVec.copy(u.dirLontar).multiplyScalar(u.distLontar * e);
      tempVec.y += u.tinggiAngkat * e;
      mesh.position.add(tempVec);

      // Rotasi: quaternion(axis_i, θ_i * e_i)
      tempQuat.setFromAxisAngle(u.sumbuPutar, u.sudutPutar * e);
      mesh.quaternion.copy(tempQuat);

      // Skala sedikit mengecil pada puncak lontaran untuk kesan kedalaman
      const skala = 1 - 0.08 * Math.sin(e * Math.PI);
      mesh.scale.set(skala, skala, skala);
    } else {
      // Saat e = 0, posisi dan rotasi kembali 100% tepat ke posisi asal
      mesh.quaternion.copy(quatIdentitas);
      mesh.scale.set(1, 1, 1);
    }
  }

  // 3. Transformasi Gugus Awan (Menyebar radial)
  const qAwan = clamp((p - 0.10) / 0.50, 0, 1);
  const eAwan = easeInOutCubic(qAwan);
  const faktorIdleAwan = 1 - eAwan;

  for (let i = 0; i < daftarAwan.length; i++) {
    const awan = daftarAwan[i];
    const u = awan.userData;

    awan.position.copy(u.pusatAsal);

    // Gerak melayang halus saat idle
    if (faktorIdleAwan > 0) {
      const floatX = Math.sin(waktuIdle * u.kecepatanIdle + u.faseIdle) * 0.12 * faktorIdleAwan;
      const floatY = Math.cos(waktuIdle * u.kecepatanIdle * 0.8 + u.faseIdle) * 0.08 * faktorIdleAwan;
      awan.position.x += floatX;
      awan.position.y += floatY;
    }

    if (eAwan > 0) {
      tempVec.copy(u.dirLontar).multiplyScalar(u.distLontar * eAwan);
      tempVec.y += u.tinggiLontar * eAwan;
      awan.position.add(tempVec);
      const skalaAwan = Math.max(0.1, 1 - 0.35 * eAwan);
      awan.scale.set(skalaAwan, skalaAwan, skalaAwan);
    } else {
      awan.scale.set(1, 1, 1);
    }
  }

  // 4. Papan Laut Diorama (Turun sedikit & kemiringan bertambah)
  if (papanLaut) {
    const uLaut = papanLaut.userData;
    papanLaut.position.copy(uLaut.posisiAsal);
    papanLaut.position.y -= 0.6 * eGlobal;

    papanLaut.rotation.copy(uLaut.rotasiAsal);
    papanLaut.rotation.x += (6 * Math.PI / 180) * eGlobal;

    // Redupkan kecerahan laut saat pecah
    if (papanLaut.material) {
      const faktorTerang = 1 - 0.35 * eGlobal;
      papanLaut.material.color.setRGB(0.141 * faktorTerang, 0.200 * faktorTerang, 0.431 * faktorTerang);
    }

    // Gelombang halus CPU di permukaan atas laut (hanya saat papan aktif)
    if (vertexLautAsal && eGlobal < 0.95) {
      const posAttr = papanLaut.geometry.attributes.position;
      const ampGelombang = 0.02 * (1 - eGlobal);
      for (let i = 0; i < posAttr.count; i++) {
        const yAsal = vertexLautAsal[i * 3 + 1];
        if (yAsal > 0.1) {
          const x = vertexLautAsal[i * 3];
          const z = vertexLautAsal[i * 3 + 2];
          const wave = Math.sin(x * 1.8 + waktuIdle * 1.4) * Math.cos(z * 1.8 + waktuIdle * 1.1) * ampGelombang;
          posAttr.setY(i, yAsal + wave);
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  // 5. Kamera (Mundur dan naik mengikuti easeInOutSine)
  if (camera && cameraBasePos) {
    const eKamera = easeInOutSine(p);
    camera.position.x = cameraBasePos.x;
    camera.position.y = cameraBasePos.y * (1 + 0.18 * eKamera);
    camera.position.z = cameraBasePos.z * (1 + 0.25 * eKamera);
    camera.lookAt(0, -0.05, 0);
  }

  // 6. Opasitas Global Saat Menjelang Selesai (p ∈ [0.88, 1.0])
  const opasitasAdegan = p < 0.88 ? 1 : Math.max(0, 1 - (p - 0.88) / 0.12);
  return {
    progress: p,
    opasitasAdegan
  };
}
