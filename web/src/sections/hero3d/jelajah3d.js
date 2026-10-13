/**
 * jelajah3d.js — Peta Diorama 3D Interaktif Khusus Bagian Jelajah Fullscreen
 * Menampilkan Peta 3D Indonesia berskala besar dengan tiang bendera detail provinsi,
 * kontrol drag orbit 360°, zoom in/out, dan penancapan panji informasi wilayah.
 */

import {
  WebGLRenderer,
  PerspectiveCamera,
  Vector3,
  Vector2,
  Raycaster,
  PCFSoftShadowMap,
  SRGBColorSpace
} from 'three';
import { bangunAdeganDiorama } from './build-scene.js';
import { aplikasikanPose } from './pose.js';
import { apakahBisaMemuat3D } from './fallback.js';
import { buatPengontrolBendera } from './bendera.js';
import { hitungPosisiKameraFit } from './index.js';

/**
 * Menginisialisasi Peta Diorama 3D berskala besar di halaman Jelajah fullscreen.
 *
 * @param {object} parameter
 * @param {HTMLElement} parameter.wadahEl - Wadah elemen (#s5-peta-wadah)
 * @param {object} parameter.geoProvinsi
 * @param {Array} parameter.daftarProvinsi
 * @param {Array} [parameter.daftarBudaya]
 * @param {object} parameter.proyeksi
 * @param {(kode: string) => void} [parameter.saatPilihProvinsi]
 * @param {(rekaman: object, pemicuEl: HTMLElement) => void} [parameter.onBukaDetailRekaman]
 * @param {(kode: string, jenis: string) => void} [parameter.onCatatStempel]
 * @returns {object|null}
 */
export function inisialisasiJelajah3D({
  wadahEl,
  geoProvinsi,
  daftarProvinsi = [],
  daftarBudaya = [],
  proyeksi,
  saatPilihProvinsi,
  onBukaDetailRekaman,
  onCatatStempel
}) {
  if (!wadahEl || !geoProvinsi || !proyeksi) return null;
  if (!apakahBisaMemuat3D()) return null;

  const adalahLayarSentuh =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const adalahPonsel = window.innerWidth < 768 || adalahLayarSentuh;

  let renderer = null;
  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: !adalahPonsel,
      powerPreference: 'high-performance'
    });
  } catch {
    return null;
  }

  const dprMaks = adalahPonsel ? 1.25 : 1.5;
  const dpr = Math.min(window.devicePixelRatio || 1, dprMaks);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;

  if (!adalahPonsel) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
  }

  const kanvas = renderer.domElement;
  kanvas.className = 's5-jelajah3d-kanvas';
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute(
    'aria-label',
    'Peta Diorama 3D Indonesia berskala penuh. Klik pulau provinsi untuk menancapkan bendera rincian budaya.'
  );
  kanvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab;';
  wadahEl.appendChild(kanvas);

  // State mode warna
  let modeWarnaAktif = 'natural';

  // Bangun adegan 3D diorama
  const elemenAdegan = bangunAdeganDiorama({
    geoProvinsi,
    daftarProvinsi,
    proyeksi,
    modeWarna: modeWarnaAktif,
    aktifkanBayangan: !adalahPonsel
  });

  const { scene, grupUtama, aturModeWarna } = elemenAdegan;

  // Kamera diorama berskala dekat (faktorZoom = 1.25 - 1.35) agar kepulauan tampil megah
  let zoomLevel = 1.30;
  const camera = new PerspectiveCamera(34, 1, 0.1, 50);
  let cameraBasePos = hitungPosisiKameraFit(1.6, zoomLevel);
  camera.position.copy(cameraBasePos);
  camera.lookAt(0, -0.05, 0);

  // Simpan data budaya lokal dan fungsi pencarian
  let dataBudayaLokal = Array.isArray(daftarBudaya) ? daftarBudaya : [];

  function ambilBudayaProvinsi(kode) {
    return dataBudayaLokal.filter(b => String(b.provinsi_kode) === String(kode));
  }

  // Pasang Pengontrol Bendera 3D
  const pengontrolBendera = buatPengontrolBendera({
    scene,
    camera,
    wadahEl,
    onJelajahiProvinsi: (kode) => {
      if (typeof saatPilihProvinsi === 'function') {
        saatPilihProvinsi(kode);
      }
    },
    onBukaDetailRekaman,
    onCatatStempel,
    ambilBudayaProvinsi
  });

  // State interaksi drag putar diorama
  let isDragging = false;
  let dragStartX = 0;
  let dragDistance = 0;
  let targetRotY = 0;
  let currentRotY = 0;
  let idRaf = null;
  let sedangAktif = true;
  let tabAktif = !document.hidden;
  let waktuMulai = performance.now();

  const raycaster = new Raycaster();
  const pointerRay = new Vector2();
  let meshHoverAktif = null;
  let meshTerpilih = null;

  function perbaruiUkuran() {
    if (!wadahEl || !renderer) return;
    const lebar = wadahEl.clientWidth || window.innerWidth;
    const tinggi = wadahEl.clientHeight || window.innerHeight;
    if (lebar <= 0 || tinggi <= 0) return;

    const aspect = lebar / tinggi;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    cameraBasePos = hitungPosisiKameraFit(aspect, zoomLevel);
    camera.position.copy(cameraBasePos);
    camera.lookAt(0, -0.05, 0);

    renderer.setSize(lebar, tinggi, false);
    aplikasikanPose(0, 0, elemenAdegan, camera, cameraBasePos);
    pengontrolBendera.perbaruiPosisi();
  }

  perbaruiUkuran();

  // Event pointer / mouse / touch
  function onPointerDown(e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragDistance = 0;
    kanvas.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      dragDistance += Math.abs(deltaX);
      dragStartX = e.clientX;
      targetRotY += deltaX * 0.0055;
      return;
    }

    // Raycast hover hanya di desktop / mouse
    if (adalahLayarSentuh) return;

    const rect = kanvas.getBoundingClientRect();
    pointerRay.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerRay.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerRay, camera);
    const intersects = raycaster.intersectObjects(elemenAdegan.daftarProvinsiMesh, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      kanvas.style.cursor = 'pointer';
      if (meshHoverAktif !== mesh) {
        if (meshHoverAktif && meshHoverAktif !== meshTerpilih) {
          meshHoverAktif.position.y = meshHoverAktif.userData.pusatAsal.y;
        }
        meshHoverAktif = mesh;
        if (mesh !== meshTerpilih) {
          mesh.position.y = mesh.userData.pusatAsal.y + 0.08;
        }
      }
    } else {
      kanvas.style.cursor = 'grab';
      if (meshHoverAktif && meshHoverAktif !== meshTerpilih) {
        meshHoverAktif.position.y = meshHoverAktif.userData.pusatAsal.y;
        meshHoverAktif = null;
      }
    }
  }

  function onPointerUp(e) {
    if (isDragging) {
      isDragging = false;
      kanvas.style.cursor = 'grab';
    }
  }

  function onClick(e) {
    // Jika sedang menyeret (drag) cukup jauh, abaikan klik raycast
    if (dragDistance > 6) return;

    const rect = kanvas.getBoundingClientRect();
    pointerRay.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerRay.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerRay, camera);
    const intersects = raycaster.intersectObjects(elemenAdegan.daftarProvinsiMesh, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      pilihProvinsi(mesh.userData.kode);
    } else {
      // Klik di laut/luar pulau: tutup bendera jika aktif
      if (meshTerpilih) {
        meshTerpilih.position.y = meshTerpilih.userData.pusatAsal.y;
        meshTerpilih = null;
      }
      pengontrolBendera.sembunyikan();
    }
  }

  kanvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);
  kanvas.addEventListener('click', onClick);

  function pilihProvinsi(kode) {
    const mesh = elemenAdegan.daftarProvinsiMesh.find((m) => String(m.userData.kode) === String(kode));
    if (!mesh) return;

    const provData = daftarProvinsi.find((p) => String(p.kode) === String(kode));

    if (meshTerpilih && meshTerpilih !== mesh) {
      meshTerpilih.position.y = meshTerpilih.userData.pusatAsal.y;
    }
    meshTerpilih = mesh;
    mesh.position.y = mesh.userData.pusatAsal.y + 0.12;

    pengontrolBendera.tampilkan(provData, mesh);

    if (typeof saatPilihProvinsi === 'function') {
      saatPilihProvinsi(kode);
    }
  }

  // Loop Render
  function loop(sekarang) {
    if (!sedangAktif || !tabAktif) {
      idRaf = null;
      return;
    }

    const tDetik = (sekarang - waktuMulai) * 0.001;

    // Interpolasi rotasi drag halus
    currentRotY += (targetRotY - currentRotY) * 0.1;
    if (grupUtama) {
      // Goyangan halus idle yang sangat lembut
      grupUtama.rotation.y = currentRotY + Math.sin(tDetik * 0.35) * 0.012;
    }

    // Perbarui posisi kartu bendera mengikuti proyeksi 3D
    pengontrolBendera.perbaruiPosisi();

    renderer.render(scene, camera);
    idRaf = window.requestAnimationFrame(loop);
  }

  function mulaiLoop() {
    if (idRaf === null && sedangAktif && tabAktif) {
      idRaf = window.requestAnimationFrame(loop);
    }
  }

  function hentikanLoop() {
    if (idRaf !== null) {
      window.cancelAnimationFrame(idRaf);
      idRaf = null;
    }
  }

  const saatVisibilitas = () => {
    tabAktif = !document.hidden;
    if (tabAktif) mulaiLoop();
    else hentikanLoop();
  };
  document.addEventListener('visibilitychange', saatVisibilitas);

  const saatResize = () => perbaruiUkuran();
  window.addEventListener('resize', saatResize, { passive: true });

  mulaiLoop();

  // Kontrol Zoom
  function aturZoom(faktor) {
    zoomLevel = Math.max(0.85, Math.min(2.3, faktor));
    perbaruiUkuran();
  }

  function resetRotasi() {
    targetRotY = 0;
    currentRotY = 0;
  }

  function toggleModeWarna() {
    modeWarnaAktif = modeWarnaAktif === 'natural' ? 'data' : 'natural';
    aturModeWarna(modeWarnaAktif);
    return modeWarnaAktif;
  }

  function aturDaftarBudaya(budayaBaru) {
    if (Array.isArray(budayaBaru)) {
      dataBudayaLokal = budayaBaru;
      // Perbarui bendera yang sedang aktif jika ada
      const provAktif = pengontrolBendera.getProvinsiAktif();
      if (provAktif && meshTerpilih) {
        pengontrolBendera.tampilkan(provAktif, meshTerpilih);
      }
    }
  }

  function bersihkan() {
    hentikanLoop();
    document.removeEventListener('visibilitychange', saatVisibilitas);
    window.removeEventListener('resize', saatResize);
    kanvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    kanvas.removeEventListener('click', onClick);

    pengontrolBendera.dispose();

    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });

    if (renderer) renderer.dispose();
    if (kanvas && kanvas.parentNode) kanvas.parentNode.removeChild(kanvas);
  }

  return {
    pilihProvinsi,
    aturZoom,
    zoomIn: () => aturZoom(zoomLevel + 0.2),
    zoomOut: () => aturZoom(zoomLevel - 0.2),
    zoomReset: () => aturZoom(1.30),
    resetRotasi,
    toggleModeWarna,
    setColorMode: aturModeWarna,
    aturDaftarBudaya,
    bersihkan,
    tampilkanBendera: pilihProvinsi,
    sembunyikanBendera: () => pengontrolBendera.sembunyikan(),
    getZoom: () => zoomLevel,
    getModeWarna: () => modeWarnaAktif
  };
}
