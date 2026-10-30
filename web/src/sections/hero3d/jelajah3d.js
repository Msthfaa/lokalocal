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
  PCFShadowMap,
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
import { buatPengontrolTurSinematik } from './tur-sinematik.js';
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
    renderer.shadowMap.type = PCFShadowMap;
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
    sembunyikanMaritimAwal: false
  });

  const { scene, grupUtama, aturModeWarna, aturModeWaktu, getModeWaktu, pengontrolLangit } = elemenAdegan;

  const kurangiGerakan = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Kamera diorama: zoomLevel 1.0 memberikan kepulauan yang pas, lapang, dan megah
  let zoomLevel = 1.0;
  const camera = new PerspectiveCamera(34, 1, 0.1, 80);
  let cameraBasePos = hitungPosisiKameraFit(1.6, zoomLevel);

  // Vektor target kamera untuk transisi mulus ke wilayah yang dipilih
  let cameraTargetPos = cameraBasePos.clone();
  let cameraTargetLookAt = new Vector3(0, 0.12, 0);
  let cameraCurrentLookAt = new Vector3(0, 0.12, 0);

  // Posisi kamera awal mantap dan fokus di tengah kepulauan nusantara
  let animMasukAktif = false;
  camera.position.copy(cameraBasePos);
  camera.lookAt(cameraTargetLookAt);
  cameraCurrentLookAt.copy(cameraTargetLookAt);
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
      targetRotY = 0;
      currentRotY = 0;
      cameraTargetPos.copy(cameraBasePos);
      cameraTargetLookAt.set(0, 0.12, 0);
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
      const overlayRute = document.getElementById('jelajah-rute-overlay');
      if (overlayRute) {
        overlayRute.style.display = 'none';
        overlayRute.setAttribute('hidden', '');
      }
      if (ruteTematikSedangAktif) {
        ruteTematikSedangAktif = false;
      }
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
          if (meshTerpilih.userData.teksturTopo) {
            meshTerpilih.material.map = meshTerpilih.userData.teksturTopo;
            meshTerpilih.material.color.set(0xffffff);
          }
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

  let animasiMasukSelesai = false;
  let animasiMasukSedangBerjalan = false;

  // Pastikan posisi awal keping provinsi selalu stabil dan tampak di permukaan
  for (const m of elemenAdegan.daftarProvinsiMesh) {
    const u = m.userData;
    m.scale.set(1, 1, 1);
    if (u?.pusatAsal) {
      u.targetY = u.pusatAsal.y;
      m.position.set(u.pusatAsal.x, u.pusatAsal.y, u.pusatAsal.z);
    }
  }

  /**
   * Memicu animasi dramatis dan imut: gelombang membal elastis pulau
   * dari pusat kepulauan menyebar ke Sabang & Merauke saat pesawat mendarat.
   */
  function mulaiAnimasiMasuk() {
    if (animasiMasukSelesai || animasiMasukSedangBerjalan) return;
    animasiMasukSedangBerjalan = true;

    // Picu juga animasi kemunculan membal kapal Pinisi & kompas mawar
    if (elemenAdegan.pengontrolMaritim && typeof elemenAdegan.pengontrolMaritim.mulaiAnimasiMasuk === 'function') {
      elemenAdegan.pengontrolMaritim.mulaiAnimasiMasuk();
    }

    if (kurangiGerak) {
      animasiMasukSelesai = true;
      animasiMasukSedangBerjalan = false;
      return;
    }

    const n = daftarProvinsiTerurut.length;
    daftarProvinsiTerurut.forEach((mesh, idx) => {
      const u = mesh.userData;
      const targetY = u.pusatAsal.y;
      const rNorm = u.rNorm ?? (idx / n);

      // Delay bergelombang: pulau tengah (Kalimantan, Sulawesi, Jawa) membal duluan,
      // lalu menyebar keluar secara radial hingga ke Aceh & Papua
      const delay = 0.04 + rNorm * 0.45 + (idx / n) * 0.08;

      // Pop-up skala membal elastis (0.7 -> 1)
      gsap.fromTo(
        mesh.scale,
        { x: 0.7, y: 0.7, z: 0.7 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.55,
          delay,
          ease: 'back.out(2.2)'
        }
      );

      // Angkat posisi keping dengan efek membal lembut
      gsap.fromTo(
        u,
        { targetY: targetY - 0.28 },
        {
          targetY: targetY,
          duration: 0.65,
          delay,
          ease: 'back.out(1.8)',
          onComplete: () => {
            if (idx === n - 1) {
              animasiMasukSelesai = true;
              animasiMasukSedangBerjalan = false;
            }
          }
        }
      );
    });
  }

  /**
   * Menghitung dan memperbarui target posisi & orientasi kamera berdasarkan zoomLevel dan status pilihan pulau.
   * @param {boolean} [langsung=false] - Jika true, kamera langsung diset tanpa animasi lerp.
   */
  function perbaruiTargetKamera(langsung = false) {
    if (meshTerpilih && provTerpilihData) {
      const worldPusat = new Vector3();
      meshTerpilih.getWorldPosition(worldPusat);
      cameraTargetPos.set(
        cameraBasePos.x + worldPusat.x * 0.40,
        cameraBasePos.y * 0.94,
        cameraBasePos.z * 0.88 + worldPusat.z * 0.35
      );
      cameraTargetLookAt.set(worldPusat.x * 0.70, worldPusat.y + 0.08, worldPusat.z * 0.70);
    } else {
      cameraTargetPos.copy(cameraBasePos);
      cameraTargetLookAt.set(0, 0.12, 0);
    }

    if (langsung) {
      camera.position.copy(cameraTargetPos);
      cameraCurrentLookAt.copy(cameraTargetLookAt);
      camera.lookAt(cameraCurrentLookAt);
    }
  }

  function perbaruiUkuran(langsung = false) {
    if (!wadahEl || !renderer) return;
    const lebar = wadahEl.clientWidth > 0 ? wadahEl.clientWidth : window.innerWidth;
    const tinggi = wadahEl.clientHeight > 0 ? wadahEl.clientHeight : window.innerHeight;
    if (lebar <= 0 || tinggi <= 0) return;

    const aspect = lebar / tinggi;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    cameraBasePos = hitungPosisiKameraFit(aspect, zoomLevel);
    perbaruiTargetKamera(langsung);

    renderer.setSize(lebar, tinggi, false);
    pengontrolBendera.perbaruiPosisi();
  }

  perbaruiUkuran(true);

  // Event pointer / mouse / touch
  function onPointerDown(e) {
    if (pengelolaDetail && pengelolaDetail.isAktif()) return;

    // Hentikan tur sinematik jika user mulai menyeret peta secara manual
    if (pengontrolTur && pengontrolTur.apakahBerjalan()) {
      pengontrolTur.hentikan(true);
    }

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
      kanvas.style.cursor = 'pointer';
      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        if (meshHoverAktif !== mesh) {
          if (meshHoverAktif) {
            meshHoverAktif.userData.offsetHover = 0;
            if (meshHoverAktif.material && meshHoverAktif !== meshTerpilih) {
              meshHoverAktif.material.emissive.set('#000000');
              meshHoverAktif.material.emissiveIntensity = 0;
            }
          }
          meshHoverAktif = mesh;
          meshHoverAktif.userData.offsetHover = 0.08;
          if (mesh.material && mesh !== meshTerpilih) {
            mesh.material.emissive.set('#FFBE3B');
            mesh.material.emissiveIntensity = 0.28;
          }
        }
      }
    } else {
      kanvas.style.cursor = 'grab';
      if (meshHoverAktif) {
        meshHoverAktif.userData.offsetHover = 0;
        if (meshHoverAktif.material && meshHoverAktif !== meshTerpilih) {
          meshHoverAktif.material.emissive.set('#000000');
          meshHoverAktif.material.emissiveIntensity = 0;
        }
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

    // Jika pointerUp terjadi di atas kartu mengambang, HUD, pita wilayah, atau dialog, JANGAN batalkan pilihan pulau!
    if (
      e.target &&
      (e.target.closest('.mode-detail-overlay') ||
        e.target.closest('.jelajah-kartu-kanan') ||
        e.target.closest('.jelajah-hud-kanan-bawah') ||
        e.target.closest('.jelajah-hud-kiri-bawah') ||
        e.target.closest('.jelajah-hud-atas') ||
        e.target.closest('.jelajah-pita-wilayah') ||
        e.target.closest('.rute-cerita-overlay') ||
        e.target.closest('#jelajah-rute-overlay') ||
        e.target.closest('.rute-pemilih-dialog') ||
        e.target.closest('.nav-wadah') ||
        e.target.closest('.dialog-rekaman') ||
        e.target.closest('.dialog-tentang'))
    ) {
      return;
    }

    // Eksekusi klik langsung di pointerup jika jarak geser kecil dan durasi wajar
    // Toleransi sentuhan jari ponsel/tablet diperbesar agar lebih mudah & responsif
    const isTouch = e.pointerType === 'touch';
    const distTotal = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
    const durasi = performance.now() - waktuPointerDown;
    const batasJarak = isTouch ? 32 : 22;
    const batasDurasi = isTouch ? 750 : 650;
    if (distTotal < batasJarak && durasi < batasDurasi) {
      eksekusiKlikLayar(e.clientX, e.clientY, isTouch);
    }
  }

  function eksekusiKlikLayar(clientX, clientY, isTouch = false) {
    if (pengelolaDetail && pengelolaDetail.isAktif()) return;
    if (ruteTematikSedangAktif) {
      import('../../features/pengontrol-rute.js').then(({ keluarRute }) => keluarRute());
      return;
    }
    if (!animasiMasukSelesai && !kurangiGerak) return;

    const rect = kanvas.getBoundingClientRect();
    pointerRay.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerRay.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerRay, camera);

    let intersects = raycaster.intersectObjects(elemenAdegan.daftarProvinsiMesh, false);

    // Pada layar sentuh (mobile/tablet), lakukan uji toleransi kedekatan (proximity)
    // jika sentuhan meleset sedikit (8-16px) agar pulau-pulau kecil (Bali, Lombok, DIY, Maluku) mudah dipilih
    if (intersects.length === 0 && isTouch) {
      const offsets = [
        [0, 10], [0, -10], [10, 0], [-10, 0],
        [8, 8], [-8, 8], [8, -8], [-8, -8],
        [0, 16], [0, -16], [16, 0], [-16, 0]
      ];
      for (const [ox, oy] of offsets) {
        const rx = ((clientX + ox - rect.left) / rect.width) * 2 - 1;
        const ry = -((clientY + oy - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera({ x: rx, y: ry }, camera);
        const subHits = raycaster.intersectObjects(elemenAdegan.daftarProvinsiMesh, false);
        if (subHits.length > 0) {
          intersects = subHits;
          break;
        }
      }
    }

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
          if (meshTerpilih.userData.teksturTopo) {
            meshTerpilih.material.map = meshTerpilih.userData.teksturTopo;
            meshTerpilih.material.color.set(0xffffff);
          }
        }
        meshTerpilih = null;
        provTerpilihData = null;
      }
      perbaruiTargetKamera(false);
      pengontrolBendera.sembunyikan();
      panelKanan.sembunyikan();
    }
  }

  kanvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);

  function pilihProvinsi(kode, opsi = {}) {
    const kodeCari = String(kode).padStart(2, '0');
    const mesh = elemenAdegan.daftarProvinsiMesh.find(
      (m) => String(m.userData.kode).padStart(2, '0') === kodeCari
    );
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
        if (meshTerpilih.userData.teksturTopo) {
          meshTerpilih.material.map = meshTerpilih.userData.teksturTopo;
          meshTerpilih.material.color.set(0xffffff);
        }
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

    // Arahkan kamera secara dinamis dan mulus ke pulau/daerah yang dipilih di ruang dunia
    if (opsi.animasikanKamera !== false) {
      perbaruiTargetKamera(false);
    }
    pengontrolBendera.tampilkan(provData, mesh);

    // Tampilkan Floating Side Card di kanan layar
    if (opsi.tampilkanSideCard !== false) {
      panelKanan.tampilkan(provData, 'compact');
    }

    if (typeof saatPilihProvinsi === 'function' && opsi.pemicuEvent !== false) {
      saatPilihProvinsi(kode);
    }
  }

  let daftarMeshZonaAktif = [];
  let kodeUtamaZonaAktif = null;

  /**
   * Menyorot satu gugus pulau besar secara utuh selama Tur Sinematik 3D berlangsung:
   * Seluruh keping provinsi pada pulau yang sedang dibahas diangkat (+0.26 unit)
   * dan berpendar emas, sementara pulau-pulau lainnya dibuat semi-transparan redup.
   */
  function sorotPulauZona(zona) {
    if (!zona || !zona.daftarKode) return;

    const setKode = new Set(zona.daftarKode.map((k) => String(k).padStart(2, '0')));
    const kodeUtamaStr = String(zona.provinsiKode).padStart(2, '0');
    kodeUtamaZonaAktif = kodeUtamaStr;
    daftarMeshZonaAktif = [];

    let meshUtama = null;

    for (const m of elemenAdegan.daftarProvinsiMesh) {
      const u = m.userData;
      if (!u) continue;
      const kStr = String(u.kode).padStart(2, '0');
      const isPulauIni = setKode.has(kStr);
      const isUtama = (kStr === kodeUtamaStr);

      if (isPulauIni) {
        daftarMeshZonaAktif.push(m);
        // Angkat seluruh keping pulau yang sedang dibahas secara kompak & harmonis (+0.26 unit)
        u.offsetTerpilih = 0.26;

        if (m.material) {
          m.material.transparent = false;
          m.material.opacity = 1.0;
          if (u.teksturTopo) { m.material.map = u.teksturTopo; m.material.color.set(0xffffff); } else { m.material.color.set(u.warnaNormal || '#6EC443'); }
          m.material.emissive.set(isUtama ? '#FFD700' : '#E5A93C');
          m.material.emissiveIntensity = isUtama ? 0.65 : 0.45;
        }

        if (isUtama) {
          meshUtama = m;
        }
      } else {
        // Pulau-pulau lain di luar zona yang dibahas:
        // Turunkan lembut ke permukaan laut dan buat semi-transparan redup artistik (opacity 0.32)
        u.offsetTerpilih = -0.04;
        if (m.material) {
          m.material.transparent = true;
          m.material.opacity = 0.32;
          m.material.emissive.set('#000000');
          m.material.emissiveIntensity = 0;
        }
      }
    }

    // Tancapkan tiang bendera 3D pada provinsi representatif utama
    if (meshUtama) {
      meshTerpilih = meshUtama;
      const provData =
        daftarProvinsi.find((p) => String(p.kode).padStart(2, '0') === kodeUtamaStr) ||
        meshUtama.userData.info || {
          nama: meshUtama.userData.nama,
          kode: meshUtama.userData.kode,
          total: 0,
          status_data: 'belum_tercatat'
        };
      provTerpilihData = provData;
      pengontrolBendera.tampilkan(provData, meshUtama);
    }
  }

  function kembalikanSorotanPulau() {
    daftarMeshZonaAktif = [];
    kodeUtamaZonaAktif = null;
    meshTerpilih = null;
    provTerpilihData = null;

    for (const m of elemenAdegan.daftarProvinsiMesh) {
      const u = m.userData;
      if (!u) continue;
      u.offsetTerpilih = 0;
      if (m.material) {
        m.material.transparent = false;
        m.material.opacity = 1.0;
        if (u.teksturTopo) { m.material.map = u.teksturTopo; m.material.color.set(0xffffff); } else { m.material.color.set(u.warnaNormal || '#6EC443'); }
        m.material.emissive.set('#000000');
        m.material.emissiveIntensity = 0;
      }
    }

    pengontrolBendera.sembunyikan();
    panelKanan.sembunyikan();
  }

  // Pasang Pengontrol Tur Sinematik Autopilot 3D (6 Wilayah Nusantara)
  const pengontrolTur = buatPengontrolTurSinematik({
    camera,
    cameraBasePos,
    cameraTargetPos,
    cameraTargetLookAt,
    aturRotasiDiorama: (rotY) => {
      targetRotY = rotY;
    },
    sorotPulauZona: (zona) => {
      sorotPulauZona(zona);
    },
    pilihProvinsiMesh: (kode) => {
      pilihProvinsi(kode, { animasikanKamera: false, tampilkanSideCard: false });
    },
    kembalikanPilihanProvinsi: () => {
      kembalikanSorotanPulau();
    }
  });

  let meshRuteSorotan = null;
  let ruteTematikSedangAktif = false;

  function bersihkanSorotanProvinsi() {
    for (const m of elemenAdegan.daftarProvinsiMesh) {
      const u = m.userData;
      if (!u) continue;
      u.offsetTerpilih = 0;
      if (m.material) {
        m.material.transparent = false;
        m.material.opacity = 1.0;
        m.material.emissive.set('#000000');
        m.material.emissiveIntensity = 0;
        if (u.teksturTopo) {
          m.material.map = u.teksturTopo;
          m.material.color.set(0xffffff);
        } else {
          m.material.color.set(u.warnaNormal || '#6EC443');
        }
      }
    }
    pengontrolBendera.sembunyikan();
  }

  function sorotProvinsiRute(kode) {
    ruteTematikSedangAktif = true;
    panelKanan.sembunyikan();
    bersihkanSorotanProvinsi();

    // Sembunyikan gugus awan selama tur agar tidak menutupi pulau yang dibahas
    if (elemenAdegan.grupAwan) {
      elemenAdegan.grupAwan.visible = false;
    }

    if (!kode) return;
    const kodeCari = String(kode).padStart(2, '0');
    const mesh = elemenAdegan.daftarProvinsiMesh.find(
      (m) => String(m.userData.kode).padStart(2, '0') === kodeCari
    );
    if (!mesh) return;

    meshRuteSorotan = mesh;

    // 1. Redupkan seluruh provinsi lain dan tonjolkan provinsi yang sedang dibahas
    for (const m of elemenAdegan.daftarProvinsiMesh) {
      const u = m.userData;
      if (!u) continue;
      const kStr = String(u.kode).padStart(2, '0');
      if (kStr === kodeCari) {
        // Provinsi target: elevasi lembut dan proporsional (+0.08 unit), opaque solid, berpendar emas
        u.offsetTerpilih = 0.08;
        if (m.material) {
          m.material.transparent = false;
          m.material.opacity = 1.0;
          m.material.emissive.set('#FFD700');
          m.material.emissiveIntensity = 0.70;
        }
      } else {
        // Provinsi lain di luar target: tetap di permukaan laut dan diredupkan semi-transparan
        u.offsetTerpilih = 0;
        if (m.material) {
          m.material.transparent = true;
          m.material.opacity = 0.32;
          m.material.emissive.set('#000000');
          m.material.emissiveIntensity = 0;
        }
      }
    }

    // 2. Tancapkan tiang bendera 3D dengan nama provinsi tepat di atas keping daratan
    const provData =
      daftarProvinsi.find((p) => String(p.kode).padStart(2, '0') === kodeCari) ||
      mesh.userData.info || {
        nama: mesh.userData.nama,
        kode: mesh.userData.kode,
        total: 0,
        status_data: 'belum_tercatat'
      };
    pengontrolBendera.tampilkan(provData, mesh);
    panelKanan.sembunyikan();
  }

  function kembalikanSorotanRute() {
    ruteTematikSedangAktif = false;
    meshRuteSorotan = null;
    bersihkanSorotanProvinsi();

    // Tampilkan kembali gugus awan
    if (elemenAdegan.grupAwan) {
      elemenAdegan.grupAwan.visible = true;
    }
  }

  function resetKameraKeOverview(durasi = 1.8) {
    ruteTematikSedangAktif = false;
    kembalikanSorotanRute();
    panelKanan.sembunyikan();
    gsap.to(cameraTargetPos, {
      x: cameraBasePos.x,
      y: cameraBasePos.y,
      z: cameraBasePos.z,
      duration: durasi,
      ease: 'power2.inOut'
    });
    gsap.to(cameraTargetLookAt, {
      x: 0,
      y: 0.12,
      z: 0,
      duration: durasi,
      ease: 'power2.inOut'
    });
  }

  /**
   * Mengarahkan pandangan kamera ke gugus kepulauan tertentu secara sinematik
   * @param {'semua'|'sumatra'|'jawa'|'bali-nusa'|'kalimantan'|'sulawesi'|'maluku-papua'} zonaId
   */
  function fokusGugusWilayah(zonaId) {
    if (pengontrolTur && typeof pengontrolTur.apakahBerjalan === 'function' && pengontrolTur.apakahBerjalan()) {
      pengontrolTur.hentikan();
    }
    if (pengelolaDetail && typeof pengelolaDetail.isAktif === 'function' && pengelolaDetail.isAktif()) {
      pengelolaDetail.tutup();
    }

    if (!zonaId || zonaId === 'semua') {
      if (meshTerpilih) {
        meshTerpilih.userData.offsetTerpilih = 0;
        if (meshTerpilih.material) {
          meshTerpilih.material.emissive.set('#000000');
          meshTerpilih.material.emissiveIntensity = 0;
          if (meshTerpilih.userData.teksturTopo) {
            meshTerpilih.material.map = meshTerpilih.userData.teksturTopo;
            meshTerpilih.material.color.set(0xffffff);
          }
        }
        meshTerpilih = null;
        provTerpilihData = null;
      }
      pengontrolBendera.sembunyikan();
      panelKanan.sembunyikan();
      resetKameraKeOverview(1.2);
      return;
    }

    const KOORDINAT_GUGUS = {
      sumatra: {
        lookAt: { x: -3.80, y: 0.15, z: -0.45 },
        pos: { x: -3.80, y: 2.5, z: 3.1 }
      },
      jawa: {
        lookAt: { x: -1.80, y: 0.15, z: 1.15 },
        pos: { x: -1.80, y: 2.2, z: 3.6 }
      },
      'bali-nusa': {
        lookAt: { x: 0.45, y: 0.15, z: 1.65 },
        pos: { x: 0.45, y: 2.2, z: 3.9 }
      },
      kalimantan: {
        lookAt: { x: -1.00, y: 0.15, z: -0.55 },
        pos: { x: -1.00, y: 2.6, z: 2.8 }
      },
      sulawesi: {
        lookAt: { x: 1.13, y: 0.15, z: -0.20 },
        pos: { x: 1.13, y: 2.5, z: 3.0 }
      },
      'maluku-papua': {
        lookAt: { x: 3.45, y: 0.15, z: 0.20 },
        pos: { x: 3.45, y: 3.0, z: 3.8 }
      }
    };

    const target = KOORDINAT_GUGUS[zonaId];
    if (!target) return;

    if (meshTerpilih) {
      meshTerpilih.userData.offsetTerpilih = 0;
      if (meshTerpilih.material) {
        meshTerpilih.material.emissive.set('#000000');
        meshTerpilih.material.emissiveIntensity = 0;
        if (meshTerpilih.userData.teksturTopo) {
          meshTerpilih.material.map = meshTerpilih.userData.teksturTopo;
          meshTerpilih.material.color.set(0xffffff);
        }
      }
      meshTerpilih = null;
      provTerpilihData = null;
      pengontrolBendera.sembunyikan();
      panelKanan.sembunyikan();
    }

    gsap.killTweensOf(cameraTargetPos);
    gsap.killTweensOf(cameraTargetLookAt);

    gsap.to(cameraTargetPos, {
      x: target.pos.x,
      y: target.pos.y,
      z: target.pos.z,
      duration: 1.35,
      ease: 'power2.inOut'
    });
    gsap.to(cameraTargetLookAt, {
      x: target.lookAt.x,
      y: target.lookAt.y,
      z: target.lookAt.z,
      duration: 1.35,
      ease: 'power2.inOut'
    });
  }

  // Pasang Pengontrol Rute Cerita Tematik (Story Trails)
  const btnRuteTematik = document.getElementById('hud-rute-cerita');
  if (btnRuteTematik) {
    btnRuteTematik.addEventListener('click', () => {
      if (pengelolaDetail && typeof pengelolaDetail.isAktif === 'function' && pengelolaDetail.isAktif()) {
        pengelolaDetail.tutup();
      }
      panelKanan.sembunyikan();
      import('../../features/pengontrol-rute.js').then(({ bukaModalPemilihRute }) => {
        bukaModalPemilihRute({
          onMulaiRute: () => {
            ruteTematikSedangAktif = true;
            panelKanan.sembunyikan();
          },
          gerakkanKamera: (pos, lookAt, durasi = 1.8) => {
            gsap.to(cameraTargetPos, {
              x: pos.x,
              y: pos.y,
              z: pos.z,
              duration: durasi,
              ease: 'power2.inOut'
            });
            gsap.to(cameraTargetLookAt, {
              x: lookAt.x,
              y: lookAt.y,
              z: lookAt.z,
              duration: durasi,
              ease: 'power2.inOut'
            });
          },
          sorotProvinsi: sorotProvinsiRute,
          kembalikanSorotan: kembalikanSorotanRute,
          resetKamera: resetKameraKeOverview,
          bukaDetailProvinsi: (kode) => {
            pilihProvinsi(kode);
          }
        });
      });
    });
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

        // Denyut halus cahaya emas pada pulau terpilih atau gugusan pulau yang sedang dibahas
        if (daftarMeshZonaAktif.length > 0) {
          const denyut = 0.45 + Math.sin(tDetik * 3.5) * 0.15;
          for (const m of daftarMeshZonaAktif) {
            if (m.material) {
              const isUtama = String(m.userData.kode).padStart(2, '0') === kodeUtamaZonaAktif;
              m.material.emissiveIntensity = isUtama ? denyut + 0.18 : denyut;
            }
          }
        } else if (meshTerpilih && meshTerpilih.material) {
          meshTerpilih.material.emissiveIntensity = 0.45 + Math.sin(tDetik * 3.5) * 0.15;
        }

        // Spring Lerp halus untuk elevasi posisi setiap keping provinsi
        for (const m of elemenAdegan.daftarProvinsiMesh) {
          const u = m.userData;
          if (u?.pusatAsal) {
            m.position.x = u.pusatAsal.x;
            m.position.z = u.pusatAsal.z;
          }
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
        if (!kurangiGerak) {
          camera.position.lerp(cameraTargetPos, 0.085);
          cameraCurrentLookAt.lerp(cameraTargetLookAt, 0.085);
          camera.lookAt(cameraCurrentLookAt);
        } else {
          camera.position.copy(cameraTargetPos);
          cameraCurrentLookAt.copy(cameraTargetLookAt);
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

  // Kontrol Zoom presisi (rentang 70% s.d. 200%, default 100% pada zoomLevel 1.0)
  function aturZoom(faktor) {
    zoomLevel = Math.max(0.70, Math.min(2.0, faktor));
    const lebar = wadahEl?.clientWidth > 0 ? wadahEl.clientWidth : window.innerWidth;
    const tinggi = wadahEl?.clientHeight > 0 ? wadahEl.clientHeight : window.innerHeight;
    const aspect = lebar > 0 && tinggi > 0 ? lebar / tinggi : 1.6;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    cameraBasePos = hitungPosisiKameraFit(aspect, zoomLevel);
    perbaruiTargetKamera(false);

    const persen = Math.round(zoomLevel * 100);
    if (typeof onZoomUbah === 'function') {
      onZoomUbah(persen);
    }
    return persen;
  }

  function resetRotasi() {
    targetRotY = 0;
    currentRotY = 0;
    perbaruiTargetKamera(false);
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
    if (pengontrolTur && typeof pengontrolTur.hentikan === 'function') {
      pengontrolTur.hentikan();
    }
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
    zoomIn: () => aturZoom(zoomLevel + 0.15),
    zoomOut: () => aturZoom(zoomLevel - 0.15),
    zoomReset: () => aturZoom(1.0),
    getZoomPersen: () => Math.round(zoomLevel * 100),
    resetRotasi,
    toggleModeWaktu,
    aturModeWaktu,
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
      if (ruteTematikSedangAktif) {
        import('../../features/pengontrol-rute.js').then(({ keluarRute }) => keluarRute());
      }
      const dataTarget = provData || provTerpilihData;
      const meshTarget = mesh || meshTerpilih;
      if (dataTarget && meshTarget && pengelolaDetail) {
        pengelolaDetail.buka(dataTarget, meshTarget);
      } else {
        panelKanan.perluas();
      }
    },
    getZoom: () => zoomLevel,
    getModeWarna: () => modeWarnaAktif,
    jedaRender: hentikanLoop,
    lanjutkanRender: mulaiLoop,
    perbaruiUkuran,
    fokusGugusWilayah,
    mulaiTurSinematik: pengontrolTur.mulai,
    hentikanTurSinematik: pengontrolTur.hentikan,
    apakahTurBerjalan: pengontrolTur.apakahBerjalan
  };
}
