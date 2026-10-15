/**
 * jelajah3d.js — Peta Diorama 3D Interaktif Khusus Bagian Jelajah Fullscreen
 * Menampilkan Peta 3D Indonesia berskala besar dengan tiang bendera detail provinsi,
 * kontrol drag orbit 360°, zoom in/out, ornamen langit matahari & bulan, dan floating card.
 */

import {
  WebGLRenderer,
  PerspectiveCamera,
  Vector3,
  Vector2,
  Raycaster,
  PCFSoftShadowMap,
  SRGBColorSpace,
  Color
} from 'three';
import gsap from 'gsap';
import { bangunAdeganDiorama } from './build-scene.js';
import { apakahBisaMemuat3D } from './fallback.js';
import { buatPengontrolBendera } from './bendera.js';
import { buatPanelKanan } from './panel-kanan.js';
import { buatPengelolaModeDetail } from './mode-detail.js';
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
  onCatatStempel,
  onZoomUbah
}) {
  if (!wadahEl || !geoProvinsi || !proyeksi) return null;
  if (!apakahBisaMemuat3D({ abaikanKurangiGerak: true })) return null;

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
  } catch (err1) {
    try {
      // Coba tanpa opsi high-performance jika GPU diskrit sedang idle
      renderer = new WebGLRenderer({ alpha: true, antialias: false });
    } catch (err2) {
      console.warn('Gagal menginisialisasi WebGLRenderer Three.js:', err2);
      return null;
    }
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
    'Peta Diorama 3D Indonesia berskala penuh. Klik pulau provinsi untuk melihat detail kekayaan budaya.'
  );
  kanvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab;';
  wadahEl.appendChild(kanvas);

  // State mode warna & waktu
  let modeWarnaAktif = 'natural';

  // Bangun adegan 3D diorama
  const elemenAdegan = bangunAdeganDiorama({
    geoProvinsi,
    daftarProvinsi,
    proyeksi,
    modeWarna: modeWarnaAktif,
    aktifkanBayangan: !adalahPonsel,
    sembunyikanMaritimAwal: true
  });

  const { scene, grupUtama, aturModeWarna, aturModeWaktu, getModeWaktu, pengontrolLangit } = elemenAdegan;

  const kurangiGerakan = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Kamera diorama: zoomLevel 1.25 memberikan kepulauan yang dekat, besar, dan megah
  let zoomLevel = 1.25;
  const camera = new PerspectiveCamera(34, 1, 0.1, 50);
  let cameraBasePos = hitungPosisiKameraFit(1.6, zoomLevel);

  // Vektor target kamera untuk transisi mulus ke wilayah yang dipilih
  let cameraTargetPos = cameraBasePos.clone();
  let cameraTargetLookAt = new Vector3(0, 0.12, 0);
  let cameraCurrentLookAt = new Vector3(0, 0.12, 0);

  // Posisi kamera awal mantap dan fokus di tengah kepulauan nusantara
  let animMasukAktif = false;
  camera.position.copy(cameraBasePos);
  camera.lookAt(0, 0.12, 0);
  cameraCurrentLookAt.set(0, 0.12, 0);
  if (grupUtama) {
    grupUtama.position.y = 0;
  }

  // Simpan data budaya lokal dan fungsi pencarian akurat
  let dataBudayaLokal = Array.isArray(daftarBudaya) ? daftarBudaya : [];

  function ambilBudayaProvinsi(kode) {
    return dataBudayaLokal.filter(
      (b) => String(b.kode_provinsi || b.provinsi_kode) === String(kode)
    );
  }

  // Variabel provinsi terpilih
  let meshTerpilih = null;
  let provTerpilihData = null;

  // Pasang Pengontrol Bendera 3D di atas pulau terpilih (terikat pada grupUtama agar ikut berputar)
  const pengontrolBendera = buatPengontrolBendera({
    scene,
    grupUtama,
    camera,
    wadahEl,
    tampilkanOverlayDOM: false,
    ambilBudayaProvinsi
  });

  // Pasang Mesin Keadaan Mode Detail 3 Kolom Nusantara (Zoom aerial keping, auto-scroll budaya, analisis)
  const pengelolaDetail = buatPengelolaModeDetail({
    scene,
    grupUtama,
    camera,
    elemenAdegan,
    daftarProvinsi,
    wadahEl,
    onBukaDetailRekaman,
    onCatatStempel,
    ambilBudayaProvinsi,
    tanggalAmbilData: '9 Oktober 2026',
    onMulaiBuka: () => {
      // Sembunyikan bendera dan floating card compact saat masuk mode detail
      pengontrolBendera.sembunyikan();
      panelKanan.sembunyikan();
    },
    onSelesaiTutup: () => {
      // Kembalikan bendera dan floating card compact saat kembali ke peta
      if (meshTerpilih && provTerpilihData) {
        meshTerpilih.userData.offsetTerpilih = 0.25;
        if (meshTerpilih.material) {
          meshTerpilih.material.emissive.set('#FFBE3B');
          meshTerpilih.material.emissiveIntensity = 0.55;
        }
        pengontrolBendera.tampilkan(provTerpilihData, meshTerpilih);
        panelKanan.tampilkan(provTerpilihData, 'compact');
      }
    },
    onPilihProvinsiBaru: (kodeBaru) => {
      const meshBaru = elemenAdegan.daftarProvinsiMesh.find((m) => String(m.userData.kode) === String(kodeBaru));
      if (meshBaru) {
        meshTerpilih = meshBaru;
        const kodeStr = String(kodeBaru).padStart(2, '0');
        provTerpilihData =
          daftarProvinsi.find((p) => String(p.kode).padStart(2, '0') === kodeStr) ||
          meshBaru.userData.info;
      }
    }
  });

  // Pasang Floating Side Card di Kanan Layar (Mode compact dengan tombol Buka Detail Budaya)
  const panelKanan = buatPanelKanan({
    wadahEl,
    geoProvinsi,
    onBukaDetailRekaman,
    onCatatStempel,
    ambilBudayaProvinsi,
    onBukaModeDetail: (provData) => {
      if (meshTerpilih) {
        pengelolaDetail.buka(provData, meshTerpilih);
      }
    },
    onTutup: () => {
      if (meshTerpilih) {
        meshTerpilih.userData.offsetTerpilih = 0;
        if (meshTerpilih.material) {
          meshTerpilih.material.emissive.set('#000000');
          meshTerpilih.material.emissiveIntensity = 0;
        }
        meshTerpilih = null;
      }
      // Kembalikan fokus kamera ke tengah diorama
      cameraTargetPos.copy(cameraBasePos);
      cameraTargetLookAt.set(0, 0.12, 0);
    }
  });

  // State interaksi drag putar diorama
  let isDragging = false;
  let dragStartX = 0;
  let dragDistance = 0;
  let pointerDownX = 0;
  let pointerDownY = 0;
  let waktuPointerDown = 0;
  let targetRotY = 0;
  let currentRotY = 0;
  let idRaf = null;
  let sedangAktif = true;
  let tabAktif = !document.hidden;
  let waktuMulai = performance.now();

  const raycaster = new Raycaster();
  const pointerRay = new Vector2();
  let meshHoverAktif = null;

  // Cek preferensi kurangi gerak sistem
  const kurangiGerak =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Urutkan 38 keping provinsi dari tengah keluar (berbasis rNorm)
  const daftarProvinsiTerurut = [...elemenAdegan.daftarProvinsiMesh].sort((a, b) => {
    const ra = a.userData.rNorm ?? 0;
    const rb = b.userData.rNorm ?? 0;
    return ra - rb;
  });

  let animasiMasukSelesai = Boolean(kurangiGerak);
  let animasiMasukSedangBerjalan = false;

  // Kondisi awal sebelum animasi masuk: sembunyikan keping jika bukan reduced-motion
  if (!kurangiGerak) {
    for (const m of elemenAdegan.daftarProvinsiMesh) {
      const u = m.userData;
      m.scale.set(0, 0, 0);
      u.targetY = u.pusatAsal.y - 0.45;
      m.position.y = u.pusatAsal.y - 0.45;
    }
  }

  /**
   * Memicu animasi dramatis dan imut: satu per satu keping pulau muncul
   * membal elastis dari laut, mulai dari pusat kepulauan menyebar ke Sabang & Merauke.
   */
  function mulaiAnimasiMasuk() {
    if (animasiMasukSelesai || animasiMasukSedangBerjalan) return;
    animasiMasukSedangBerjalan = true;

    // Picu juga animasi kemunculan membal kapal Pinisi & kompas mawar
    if (elemenAdegan.pengontrolMaritim && typeof elemenAdegan.pengontrolMaritim.mulaiAnimasiMasuk === 'function') {
      elemenAdegan.pengontrolMaritim.mulaiAnimasiMasuk();
    }

    if (kurangiGerak) {
      for (const m of elemenAdegan.daftarProvinsiMesh) {
        m.scale.set(1, 1, 1);
        m.userData.targetY = m.userData.pusatAsal.y;
        m.position.y = m.userData.pusatAsal.y;
      }
      animasiMasukSelesai = true;
      animasiMasukSedangBerjalan = false;
      return;
    }

    const n = daftarProvinsiTerurut.length;
    daftarProvinsiTerurut.forEach((mesh, idx) => {
      const u = mesh.userData;
      const targetY = u.pusatAsal.y;
      const rNorm = u.rNorm ?? (idx / n);

      // Delay bergelombang: pulau tengah (Kalimantan, Sulawesi, Jawa) muncul duluan,
      // lalu menyebar keluar secara radial hingga ke Aceh & Papua
      const delay = 0.05 + rNorm * 0.92 + (idx / n) * 0.18;

      // Pop-up skala membal elastis (0 -> 1)
      gsap.to(mesh.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.72,
        delay,
        ease: 'back.out(2.2)'
      });

      // Angkat posisi keping dari bawah permukaan air ke daratan normal
      gsap.to(u, {
        targetY: targetY,
        duration: 0.80,
        delay,
        ease: 'back.out(1.6)',
        onComplete: () => {
          if (idx === n - 1) {
            animasiMasukSelesai = true;
            animasiMasukSedangBerjalan = false;
          }
        }
      });
    });
  }

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
    camera.lookAt(0, 0.12, 0);

    renderer.setSize(lebar, tinggi, false);
    pengontrolBendera.perbaruiPosisi();
  }

  perbaruiUkuran();

  // Event pointer / mouse / touch
  function onPointerDown(e) {
    if (pengelolaDetail && pengelolaDetail.isAktif()) return;

    isDragging = true;
    dragStartX = e.clientX;
    dragDistance = 0;
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
    waktuPointerDown = performance.now();
    kanvas.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    if (pengelolaDetail && pengelolaDetail.isAktif()) return;

    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      dragDistance += Math.abs(deltaX);
      dragStartX = e.clientX;
      targetRotY += deltaX * 0.0055;
      return;
    }

    // Raycast hover hanya di desktop / mouse
    if (adalahLayarSentuh || (!animasiMasukSelesai && !kurangiGerak)) return;

    const rect = kanvas.getBoundingClientRect();
    pointerRay.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerRay.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerRay, camera);
    const intersects = raycaster.intersectObjects(elemenAdegan.daftarProvinsiMesh, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      kanvas.style.cursor = 'pointer';
      if (meshHoverAktif !== mesh) {
        if (meshHoverAktif) {
          meshHoverAktif.userData.offsetHover = 0;
        }
        meshHoverAktif = mesh;
        meshHoverAktif.userData.offsetHover = 0.08;
      }
    } else {
      kanvas.style.cursor = 'grab';
      if (meshHoverAktif) {
        meshHoverAktif.userData.offsetHover = 0;
        meshHoverAktif = null;
      }
    }
  }

  function onPointerUp(e) {
    if (pengelolaDetail && pengelolaDetail.isAktif()) return;

    if (isDragging) {
      isDragging = false;
      kanvas.style.cursor = 'grab';
    }

    // Jika pointerUp terjadi di atas kartu mengambang, HUD, atau dialog, JANGAN batalkan pilihan pulau!
    if (
      e.target &&
      (e.target.closest('.mode-detail-overlay') ||
        e.target.closest('.jelajah-kartu-kanan') ||
        e.target.closest('.jelajah-hud-kanan-bawah') ||
        e.target.closest('.jelajah-hud-kiri-bawah') ||
        e.target.closest('.jelajah-hud-atas') ||
        e.target.closest('.nav-wadah') ||
        e.target.closest('.dialog-rekaman') ||
        e.target.closest('.dialog-tentang'))
    ) {
      return;
    }

    // Eksekusi klik langsung di pointerup jika jarak geser kecil (< 22px) dan durasi wajar (< 650ms)
    const distTotal = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
    const durasi = performance.now() - waktuPointerDown;
    if (distTotal < 22 && durasi < 650) {
      eksekusiKlikLayar(e.clientX, e.clientY);
    }
  }

  function eksekusiKlikLayar(clientX, clientY) {
    if (pengelolaDetail && pengelolaDetail.isAktif()) return;
    if (!animasiMasukSelesai && !kurangiGerak) return;

    const rect = kanvas.getBoundingClientRect();
    pointerRay.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerRay.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerRay, camera);
    const intersects = raycaster.intersectObjects(elemenAdegan.daftarProvinsiMesh, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      pilihProvinsi(mesh.userData.kode);
    } else {
      // Klik di luar pulau / laut: batalkan pilihan
      if (meshTerpilih) {
        meshTerpilih.userData.offsetTerpilih = 0;
        if (meshTerpilih.material) {
          meshTerpilih.material.emissive.set('#000000');
          meshTerpilih.material.emissiveIntensity = 0;
        }
        meshTerpilih = null;
        provTerpilihData = null;
      }
      cameraTargetPos.copy(cameraBasePos);
      cameraTargetLookAt.set(0, -0.05, 0);
      pengontrolBendera.sembunyikan();
      panelKanan.sembunyikan();
    }
  }

  kanvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);

  function pilihProvinsi(kode) {
    const mesh = elemenAdegan.daftarProvinsiMesh.find((m) => String(m.userData.kode) === String(kode));
    if (!mesh) return;

    const kodeStr = String(kode).padStart(2, '0');
    const provData =
      daftarProvinsi.find((p) => String(p.kode).padStart(2, '0') === kodeStr) ||
      mesh.userData.info || {
        nama: mesh.userData.nama,
        kode: mesh.userData.kode,
        total: 0,
        status_data: 'belum_tercatat'
      };

    provTerpilihData = provData;

    if (meshTerpilih && meshTerpilih !== mesh) {
      meshTerpilih.userData.offsetTerpilih = 0;
      if (meshTerpilih.material) {
        meshTerpilih.material.emissive.set('#000000');
        meshTerpilih.material.emissiveIntensity = 0;
      }
    }
    meshTerpilih = mesh;
    // Angkat keping pulau terpilih secara elastis (+0.25 unit)
    mesh.userData.offsetTerpilih = 0.25;

    // Efek highlight emissive emas menyala lembut pada pulau terpilih
    if (mesh.material) {
      mesh.material.emissive.set('#FFBE3B');
      mesh.material.emissiveIntensity = 0.55;
    }

    // Arahkan kamera secara dinamis dan mulus ke pulau/daerah yang dipilih
    const pusatMesh = mesh.position;
    cameraTargetPos.set(
      cameraBasePos.x + pusatMesh.x * 0.45,
      cameraBasePos.y * 0.94,
      cameraBasePos.z * 0.88 + pusatMesh.z * 0.4
    );
    cameraTargetLookAt.set(pusatMesh.x * 0.72, pusatMesh.y + 0.08, pusatMesh.z * 0.72);
    pengontrolBendera.tampilkan(provData, mesh);

    // Tampilkan Floating Side Card di kanan layar
    panelKanan.tampilkan(provData, 'compact');

    if (typeof saatPilihProvinsi === 'function') {
      saatPilihProvinsi(kode);
    }
  }

  // Loop Render dengan buttery-smooth spring interpolation
  function loop(sekarang) {
    if (!sedangAktif || !tabAktif) {
      idRaf = null;
      return;
    }

    try {
      const tDetik = Math.max(0, (sekarang - waktuMulai) * 0.001);

      if (pengelolaDetail && pengelolaDetail.isAktif()) {
        // Saat di Mode Detail, update animasi interpolasi pose keping & parallax
        pengelolaDetail.updatePerFrame(tDetik);
      } else {
        // Interpolasi rotasi drag halus diorama
        currentRotY += (targetRotY - currentRotY) * 0.075;
        if (grupUtama) {
          // Goyangan halus idle yang sangat lembut
          grupUtama.rotation.y = currentRotY + Math.sin(tDetik * 0.28) * 0.006;
        }

        // Denyut halus cahaya emas pada pulau terpilih
        if (meshTerpilih && meshTerpilih.material) {
          meshTerpilih.material.emissiveIntensity = 0.45 + Math.sin(tDetik * 3.5) * 0.15;
        }

        // Spring Lerp halus untuk elevasi posisi setiap keping provinsi
        for (const m of elemenAdegan.daftarProvinsiMesh) {
          const u = m.userData;
          const targetY = (u.targetY ?? u.pusatAsal.y) + (u.offsetTerpilih || 0) + (u.offsetHover || 0);
          m.position.y += (targetY - m.position.y) * 0.14;
        }

        // Perbarui posisi tiang bendera 3D
        pengontrolBendera.perbaruiPosisi();
      }

      // Update animasi ornamen langit (Matahari, Bulan, Bintang)
      if (pengontrolLangit && typeof pengontrolLangit.update === 'function') {
        pengontrolLangit.update(tDetik);
      }

      // Update animasi titik lampu malam nusantara di daratan pulau
      if (elemenAdegan.pengontrolLampuMalam && typeof elemenAdegan.pengontrolLampuMalam.update === 'function') {
        elemenAdegan.pengontrolLampuMalam.update(tDetik);
      }

      // Animasi dinamis awan-awan melayang mengitari kepulauan
      if (elemenAdegan.daftarAwan && elemenAdegan.daftarAwan.length > 0) {
        for (let i = 0; i < elemenAdegan.daftarAwan.length; i++) {
          const awan = elemenAdegan.daftarAwan[i];
          const u = awan.userData;
          if (!u) continue;
          const sudutBaru = (u.faseIdle || 0) + tDetik * 0.05 * (u.kecepatanIdle || 0.4);
          const radius = Math.sqrt(u.pusatAsal.x * u.pusatAsal.x + u.pusatAsal.z * u.pusatAsal.z);
          awan.position.x = Math.cos(sudutBaru) * radius;
          awan.position.z = Math.sin(sudutBaru) * radius;
          awan.position.y = u.pusatAsal.y + Math.sin(tDetik * 0.7 + i) * 0.07;
          awan.rotation.y = sudutBaru;
        }
      }

      // Update animasi ornamen kemaritiman nusantara (3 Perahu Pinisi berlayar, buih ombak, denyut jalur rempah)
      if (elemenAdegan.pengontrolMaritim && typeof elemenAdegan.pengontrolMaritim.update === 'function') {
        elemenAdegan.pengontrolMaritim.update(tDetik);
      }

      // Lerp kamera halus ke target posisi daerah yang dipilih (jika mode detail tidak aktif)
      const modeDetailAktif = pengelolaDetail && typeof pengelolaDetail.isAktif === 'function' && pengelolaDetail.isAktif();
      if (!modeDetailAktif) {
        if (!kurangiGerakan) {
          camera.position.lerp(cameraTargetPos, 0.055);
          cameraCurrentLookAt.lerp(cameraTargetLookAt, 0.055);
          camera.lookAt(cameraCurrentLookAt);
        } else {
          camera.position.copy(cameraTargetPos);
          camera.lookAt(cameraTargetLookAt);
        }
      }

      // Render: gunakan renderKhusus saat mode detail aktif agar latar belakang peta ter-blur lembut
      if (pengelolaDetail && typeof pengelolaDetail.isAktif === 'function' && pengelolaDetail.isAktif()) {
        pengelolaDetail.renderKhusus(renderer, scene, camera);
      } else {
        renderer.render(scene, camera);
      }
    } catch (errLoop) {
      console.warn('Kendala render frame diorama:', errLoop);
    } finally {
      idRaf = window.requestAnimationFrame(loop);
    }
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

  // Zoom dengan scroll mouse
  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.09 : 0.09;
    aturZoom(zoomLevel + delta);
  }
  kanvas.addEventListener('wheel', onWheel, { passive: false });

  mulaiLoop();

  // Kontrol Zoom presisi (dibatasi minimum 72% / 0.90 agar saat zoom out diorama tetap proporsional & kaya)
  function aturZoom(faktor) {
    zoomLevel = Math.max(0.90, Math.min(2.25, faktor));
    perbaruiUkuran();
    const persen = Math.round((zoomLevel / 1.25) * 100);
    if (typeof onZoomUbah === 'function') {
      onZoomUbah(persen);
    }
    return persen;
  }

  function resetRotasi() {
    targetRotY = 0;
    currentRotY = 0;
    cameraTargetPos.copy(cameraBasePos);
    cameraTargetLookAt.set(0, -0.05, 0);
  }

  function toggleModeWaktu() {
    const modeBaru = getModeWaktu() === 'siang' ? 'malam' : 'siang';
    aturModeWaktu(modeBaru);
    return modeBaru;
  }

  function toggleModeWarna() {
    modeWarnaAktif = modeWarnaAktif === 'natural' ? 'data' : 'natural';
    aturModeWarna(modeWarnaAktif);
    return modeWarnaAktif;
  }

  function aturDaftarBudaya(budayaBaru) {
    if (Array.isArray(budayaBaru)) {
      dataBudayaLokal = budayaBaru;
      // Perbarui panel kanan yang sedang aktif jika ada
      panelKanan.perbaruiDataBudaya();
    }
  }

  function bersihkan() {
    hentikanLoop();
    document.removeEventListener('visibilitychange', saatVisibilitas);
    window.removeEventListener('resize', saatResize);
    kanvas.removeEventListener('wheel', onWheel);
    kanvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    pengontrolBendera.dispose();
    panelKanan.dispose();
    if (pengelolaDetail && typeof pengelolaDetail.dispose === 'function') {
      pengelolaDetail.dispose();
    }
    if (elemenAdegan.pengontrolLampuMalam && typeof elemenAdegan.pengontrolLampuMalam.dispose === 'function') {
      elemenAdegan.pengontrolLampuMalam.dispose();
    }
    if (elemenAdegan.pengontrolMaritim && typeof elemenAdegan.pengontrolMaritim.dispose === 'function') {
      elemenAdegan.pengontrolMaritim.dispose();
    }

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
    mulaiAnimasiMasuk,
    pilihProvinsi,
    aturZoom,
    zoomIn: () => aturZoom(zoomLevel + 0.1875),
    zoomOut: () => aturZoom(zoomLevel - 0.1875),
    zoomReset: () => aturZoom(1.25),
    getZoomPersen: () => Math.round((zoomLevel / 1.25) * 100),
    resetRotasi,
    toggleModeWaktu,
    setModeWaktu: aturModeWaktu,
    getModeWaktu,
    toggleModeWarna,
    setColorMode: aturModeWarna,
    aturDaftarBudaya,
    bersihkan,
    tampilkanBendera: pilihProvinsi,
    sembunyikanBendera: () => {
      if (meshTerpilih) {
        meshTerpilih.userData.offsetTerpilih = 0;
        meshTerpilih = null;
        provTerpilihData = null;
      }
      pengontrolBendera.sembunyikan();
      panelKanan.sembunyikan();
    },
    bukaDetailWilayah: (provData, mesh) => {
      const dataTarget = provData || provTerpilihData;
      const meshTarget = mesh || meshTerpilih;
      if (dataTarget && meshTarget && pengelolaDetail) {
        pengelolaDetail.buka(dataTarget, meshTarget);
      } else {
        panelKanan.perluas();
      }
    },
    getZoom: () => zoomLevel,
    getModeWarna: () => modeWarnaAktif
  };
}
