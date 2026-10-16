/**
 * hero3d/index.js — Modul utama Peta Diorama 3D Indonesia (Fase 9)
 * Sesuai spesifikasi TUGAS:
 * - 38 keping provinsi low-poly di atas papan laut diorama
 * - Kamera fit responsif (desktop 1440 px hingga ponsel 360 px)
 * - Mode debug ?debug3d=1 lengkap dengan slider progress dan statistik (FPS, Triangles, Draw calls)
 * - Lifecycle lengkap dengan pause saat off-screen dan dispose bersih
 */

import {
  WebGLRenderer,
  PerspectiveCamera,
  Vector3,
  Vector2,
  Raycaster,
  PCFShadowMap,
  SRGBColorSpace
} from 'three';
import { bangunAdeganDiorama } from './build-scene.js';
import { aplikasikanPose } from './pose.js';
import { apakahBisaMemuat3D } from './fallback.js';
import { buatPengontrolBendera } from './bendera.js';

/**
 * Menghitung posisi awal kamera agar diorama utuh selalu pas dan besar di viewport
 * (desktop tampak full screen dan gagah, ponsel potret pas di tengah).
 *
 * @param {number} aspect - Rasio lebar / tinggi viewport
 * @param {number} [faktorZoom=1] - Pengali perbesaran kamera
 * @returns {Vector3}
 */
export function hitungPosisiKameraFit(aspect, faktorZoom = 1) {
  const fovVertikalRad = (34 * Math.PI) / 180;
  const fovHorizontalRad = 2 * Math.atan(Math.tan(fovVertikalRad / 2) * aspect);

  // Penyesuaian radius target dasar berdasarkan aspek layar agar 38 provinsi selalu pas
  let radiusTargetDasar = 3.6;
  if (aspect < 0.8) {
    // Ponsel potret ramping (misal 390x844 atau 360x800)
    radiusTargetDasar = 5.8;
  } else if (aspect < 1.0) {
    // Layar tablet potret / persegi
    radiusTargetDasar = 4.5;
  } else if (aspect < 1.3) {
    // Layar tablet lanskap / laptop kecil
    radiusTargetDasar = 3.8;
  } else {
    // Desktop layar lebar (aspect >= 1.3)
    radiusTargetDasar = 3.6;
  }

  const radiusTarget = radiusTargetDasar / faktorZoom;

  const jarakVert = radiusTarget / Math.tan(fovVertikalRad / 2);
  const jarakHoriz = radiusTarget / Math.tan(fovHorizontalRad / 2);
  const jarak = Math.max(jarakVert, jarakHoriz);

  // Sudut kamera 46 derajat dari horizontal: sudut 3/4 isometrik udara yang seimbang
  // kepulauan terlihat lapang, relief 3D dan pulau-pulau tampak luas, jelas, dan mudah dijelajahi
  const sudutElevasi = (46 * Math.PI) / 180;
  const y = jarak * Math.sin(sudutElevasi);
  const z = jarak * Math.cos(sudutElevasi);

  return new Vector3(0, y, z);
}

/**
 * Memasang panel debug jika URL memuat param ?debug3d=1
 */
function pasangPanelDebug({ wadahEl, renderer, onSliderProgress, onToggleModeWarna }) {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('debug3d')) return null;

  const panel = document.createElement('div');
  panel.id = 'panel-debug-3d';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 9999;
    background: rgba(20, 17, 15, 0.92);
    border: 1px solid #E6B14A;
    border-radius: 12px;
    padding: 14px 16px;
    color: #F4EBDD;
    font-family: monospace;
    font-size: 12px;
    line-height: 1.5;
    box-shadow: 0 12px 32px rgba(0,0,0,0.6);
    max-width: 320px;
  `;

  panel.innerHTML = `
    <div style="font-weight: bold; color: #E6B14A; margin-bottom: 6px; display: flex; justify-content: space-between;">
      <span>DEBUG 3D DIORAMA</span>
      <span id="debug-fps">-- FPS</span>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
      <div>Segitiga: <strong id="debug-triangles" style="color:#7DB35F;">0</strong></div>
      <div>Draw calls: <strong id="debug-calls">0</strong></div>
      <div>Canvas: <span id="debug-size">0x0</span></div>
      <div>DPR: <span id="debug-dpr">1</span></div>
    </div>
    <div style="margin-top: 8px; border-top: 1px solid #3A322C; padding-top: 8px;">
      <label style="display: block; font-weight: bold; margin-bottom: 4px;">
        Progress Pecah: <span id="debug-progress-val" style="color:#E6B14A;">0.00</span>
      </label>
      <input type="range" id="debug-slider-progress" min="0" max="1" step="0.005" value="0" style="width: 100%; accent-color: #E6B14A; cursor: pointer;" />
    </div>
    <div style="margin-top: 8px; display: flex; gap: 6px;">
      <button type="button" id="debug-btn-natural" style="flex:1; padding: 4px 6px; border: 1px solid #3A322C; border-radius: 4px; background: #28211D; color: #7DB35F; cursor: pointer; font-family: monospace;">Natural</button>
      <button type="button" id="debug-btn-data" style="flex:1; padding: 4px 6px; border: 1px solid #3A322C; border-radius: 4px; background: #28211D; color: #E6B14A; cursor: pointer; font-family: monospace;">Data OPK</button>
    </div>
  `;

  document.body.appendChild(panel);

  const elFps = panel.querySelector('#debug-fps');
  const elTri = panel.querySelector('#debug-triangles');
  const elCalls = panel.querySelector('#debug-calls');
  const elSize = panel.querySelector('#debug-size');
  const elDpr = panel.querySelector('#debug-dpr');
  const elSlider = panel.querySelector('#debug-slider-progress');
  const elProgVal = panel.querySelector('#debug-progress-val');
  const btnNatural = panel.querySelector('#debug-btn-natural');
  const btnData = panel.querySelector('#debug-btn-data');

  elSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    elProgVal.textContent = val.toFixed(2);
    if (typeof onSliderProgress === 'function') {
      onSliderProgress(val);
    }
  });

  btnNatural.addEventListener('click', () => {
    if (typeof onToggleModeWarna === 'function') onToggleModeWarna('natural');
  });

  btnData.addEventListener('click', () => {
    if (typeof onToggleModeWarna === 'function') onToggleModeWarna('data');
  });

  return {
    perbaruiStatistik: (fps, lebar, tinggi, dpr) => {
      if (elFps) elFps.textContent = `${Math.round(fps)} FPS`;
      if (elTri && renderer) elTri.textContent = renderer.info.render.triangles.toLocaleString('id-ID');
      if (elCalls && renderer) elCalls.textContent = renderer.info.render.calls;
      if (elSize) elSize.textContent = `${lebar}x${tinggi}`;
      if (elDpr) elDpr.textContent = dpr.toFixed(1);
    },
    aturSlider: (p) => {
      if (elSlider && document.activeElement !== elSlider) {
        elSlider.value = p;
        elProgVal.textContent = p.toFixed(2);
      }
    },
    hapus: () => {
      if (panel.parentNode) panel.parentNode.removeChild(panel);
    }
  };
}

/**
 * Menginisialisasi Peta Diorama 3D Indonesia di bagian Hero (S1).
 *
 * @param {object} parameter
 * @param {HTMLElement} parameter.wadahEl - Wadah elemen canvas (#s1-latar-peta)
 * @param {object} parameter.geoProvinsi - FeatureCollection 38 provinsi
 * @param {Array} parameter.daftarProvinsi - 38 data provinsi dari provinsi.json
 * @param {object} parameter.proyeksi - Hasil buatProyeksiIndonesia(geoProvinsi)
 * @param {number} [parameter.progressAwal=0]
 * @returns {object|null} API kontrol 3D atau null jika fallback
 */
export function inisialisasiHero3D({
  wadahEl,
  geoProvinsi,
  daftarProvinsi = [],
  proyeksi,
  progressAwal = 0,
  faktorZoom = 1,
  onPilihProvinsi = null
}) {
  if (!wadahEl || !geoProvinsi || !proyeksi) {
    return null;
  }

  // Cek apakah perangkat memenuhi syarat
  if (!apakahBisaMemuat3D()) {
    return null;
  }

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

  // Bayangan hanya aktif di desktop
  if (!adalahPonsel) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
  }

  const kanvas = renderer.domElement;
  kanvas.className = 's1-hero3d-kanvas';
  kanvas.setAttribute('role', 'img');
  kanvas.setAttribute(
    'aria-label',
    'Peta tiga dimensi Indonesia yang terpecah menjadi 38 provinsi saat halaman digulir'
  );
  kanvas.style.pointerEvents = 'auto';
  wadahEl.appendChild(kanvas);
  wadahEl.classList.add('has-diorama-3d');

  // Bangun adegan lengkap
  const elemenAdegan = bangunAdeganDiorama({
    geoProvinsi,
    daftarProvinsi,
    proyeksi,
    modeWarna: 'natural',
    aktifkanBayangan: !adalahPonsel
  });

  const { scene, aturModeWarna } = elemenAdegan;

  // Kamera
  const camera = new PerspectiveCamera(34, 1, 0.1, 50);
  let cameraBasePos = hitungPosisiKameraFit(1.6, faktorZoom);
  camera.position.copy(cameraBasePos);
  camera.lookAt(0, -0.05, 0);

  // Pasang Pengontrol Bendera Detail Provinsi 3D
  const pengontrolBendera = buatPengontrolBendera({
    scene,
    camera,
    wadahEl,
    onJelajahiProvinsi: (kode) => {
      if (typeof onPilihProvinsi === 'function') {
        onPilihProvinsi(kode);
      }
      const elJelajah = document.getElementById('jelajah');
      if (elJelajah) {
        elJelajah.scrollIntoView({ behavior: 'smooth' });
      }
      if (typeof window.__pilihProvinsiJelajah === 'function') {
        window.__pilihProvinsiJelajah(kode);
      }
    }
  });

  // State gerak & kontrol
  let progressAktif = progressAwal;
  let modeManualDebug = false;
  let idRaf = null;
  let sedangAktifViewport = true;
  let tabAktif = !document.hidden;
  let waktuMulai = performance.now();
  let frameCount = 0;
  let fps = 60;
  let lastFpsCalc = performance.now();

  // Raycaster untuk mendeteksi klik keping provinsi & memunculkan bendera
  const raycaster = new Raycaster();
  const pointerRay = new Vector2();
  let meshHoverAktif = null;
  let meshTerpilih = null;

  function tanganiPointerMove(e) {
    if (progressAktif > 0.4) return; // Hanya aktif saat peta dalam keadaan menyatu/dekat
    const rect = kanvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

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
      kanvas.style.cursor = 'default';
      if (meshHoverAktif && meshHoverAktif !== meshTerpilih) {
        meshHoverAktif.position.y = meshHoverAktif.userData.pusatAsal.y;
        meshHoverAktif = null;
      }
    }
  }

  function tanganiKlikKanvas(e) {
    if (progressAktif > 0.4) return;
    const rect = kanvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    pointerRay.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerRay.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerRay, camera);
    const intersects = raycaster.intersectObjects(elemenAdegan.daftarProvinsiMesh, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      pilihProvinsiMesh(mesh);
    } else {
      // Klik di luar pulau: sembunyikan bendera jika klik laut lepas
      if (meshTerpilih) {
        meshTerpilih.position.y = meshTerpilih.userData.pusatAsal.y;
        meshTerpilih = null;
      }
      pengontrolBendera.sembunyikan();
    }
  }

  function pilihProvinsiMesh(mesh) {
    if (!mesh) return;
    const kode = mesh.userData.kode;
    const provData = daftarProvinsi.find((p) => String(p.kode) === String(kode));

    if (meshTerpilih && meshTerpilih !== mesh) {
      meshTerpilih.position.y = meshTerpilih.userData.pusatAsal.y;
    }
    meshTerpilih = mesh;
    mesh.position.y = mesh.userData.pusatAsal.y + 0.12;

    pengontrolBendera.tampilkan(provData, mesh);

    if (typeof onPilihProvinsi === 'function') {
      onPilihProvinsi(kode);
    }
  }

  kanvas.addEventListener('pointermove', tanganiPointerMove, { passive: true });
  kanvas.addEventListener('click', tanganiKlikKanvas);

  // Pointer parallax halus untuk desktop
  const pointerTarget = { x: 0, y: 0 };
  const pointerCurrent = { x: 0, y: 0 };

  if (!adalahLayarSentuh) {
    window.addEventListener(
      'pointermove',
      (e) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        pointerTarget.x = nx * 0.035; // ±2 derajat
        pointerTarget.y = ny * 0.025;
      },
      { passive: true }
    );
  }

  function perbaruiUkuran() {
    if (!wadahEl || !renderer) return;
    const lebar = wadahEl.clientWidth || window.innerWidth;
    const tinggi = wadahEl.clientHeight || window.innerHeight;
    if (lebar <= 0 || tinggi <= 0) return;

    const aspect = lebar / tinggi;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    cameraBasePos = hitungPosisiKameraFit(aspect, faktorZoom);
    renderer.setSize(lebar, tinggi, false);

    // Langsung terapkan pose agar kamera dan posisi sinkron
    aplikasikanPose(progressAktif, 0, elemenAdegan, camera, cameraBasePos);
    pengontrolBendera.perbaruiPosisi();
  }

  perbaruiUkuran();

  // Mode debug ?debug3d=1
  const panelDebug = pasangPanelDebug({
    wadahEl,
    renderer,
    onSliderProgress: (p) => {
      modeManualDebug = true;
      progressAktif = p;
    },
    onToggleModeWarna: (m) => {
      aturModeWarna(m);
    }
  });

  function loop(sekarang) {
    if (!sedangAktifViewport || !tabAktif) {
      idRaf = null;
      return;
    }

    const tDetik = (sekarang - waktuMulai) * 0.001;

    // Perhitungan FPS untuk debug
    frameCount++;
    if (sekarang - lastFpsCalc >= 1000) {
      fps = (frameCount * 1000) / (sekarang - lastFpsCalc);
      frameCount = 0;
      lastFpsCalc = sekarang;
      if (panelDebug) {
        panelDebug.perbaruiStatistik(
          fps,
          wadahEl.clientWidth,
          wadahEl.clientHeight,
          dpr
        );
      }
    }

    // Parallax kursor halus
    if (!adalahLayarSentuh) {
      pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.05;
      pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.05;
    }

    // Terapkan pose murni deterministik
    const hasilPose = aplikasikanPose(
      progressAktif,
      tDetik,
      elemenAdegan,
      camera,
      cameraBasePos
    );

    // Tambahkan sedikit pengaruh kursor ke kamera saat progress dekat 0
    if (!adalahLayarSentuh) {
      const faktorParallax = Math.max(0, 1 - progressAktif * 1.5);
      camera.position.x += pointerCurrent.x * faktorParallax;
      camera.position.y += pointerCurrent.y * faktorParallax;
      camera.lookAt(0, -0.05, 0);
    }

    // Perbarui posisi koordinat kartu bendera di layar
    pengontrolBendera.perbaruiPosisi();

    // Opasitas kanvas menjelang transisi S2
    kanvas.style.opacity = String(hasilPose.opasitasAdegan);

    renderer.render(scene, camera);
    idRaf = window.requestAnimationFrame(loop);
  }

  function mulaiLoop() {
    if (idRaf === null && sedangAktifViewport && tabAktif) {
      idRaf = window.requestAnimationFrame(loop);
    }
  }

  function hentikanLoop() {
    if (idRaf !== null) {
      window.cancelAnimationFrame(idRaf);
      idRaf = null;
    }
  }

  // IntersectionObserver untuk mematikan render saat bagian S1 di luar layar
  let observer = null;
  const bagianPembuka = document.getElementById('pembuka') || wadahEl;
  if ('IntersectionObserver' in window && bagianPembuka) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          sedangAktifViewport = entry.isIntersecting;
          if (sedangAktifViewport) {
            mulaiLoop();
          } else {
            hentikanLoop();
          }
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(bagianPembuka);
  }

  // visibilitychange
  const saatVisibilitas = () => {
    tabAktif = !document.hidden;
    if (tabAktif) mulaiLoop();
    else hentikanLoop();
  };
  document.addEventListener('visibilitychange', saatVisibilitas);

  const saatResize = () => perbaruiUkuran();
  window.addEventListener('resize', saatResize, { passive: true });

  // Terapkan pose awal dan jalankan
  aplikasikanPose(progressAktif, 0, elemenAdegan, camera, cameraBasePos);
  mulaiLoop();

  /**
   * Mengatur progress scroll dari luar (mis. GSAP ScrollTrigger)
   * @param {number} p
   */
  function setProgress(p) {
    if (modeManualDebug) return; // Slider debug mengambil alih sementara jika diaktifkan
    progressAktif = p;
    if (panelDebug) panelDebug.aturSlider(p);
  }

  function bersihkan() {
    hentikanLoop();
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    document.removeEventListener('visibilitychange', saatVisibilitas);
    window.removeEventListener('resize', saatResize);
    kanvas.removeEventListener('pointermove', tanganiPointerMove);
    kanvas.removeEventListener('click', tanganiKlikKanvas);
    if (pengontrolBendera) pengontrolBendera.dispose();

    // Lepas memori WebGL
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });

    if (renderer) renderer.dispose();
    if (kanvas && kanvas.parentNode) kanvas.parentNode.removeChild(kanvas);
    wadahEl.classList.remove('has-diorama-3d');
  }

  function tampilkanBenderaProvinsi(kode) {
    const mesh = elemenAdegan.daftarProvinsiMesh.find((m) => String(m.userData.kode) === String(kode));
    if (mesh) {
      pilihProvinsiMesh(mesh);
    }
  }

  return {
    setProgress,
    setColorMode: aturModeWarna,
    tampilkanBendera: tampilkanBenderaProvinsi,
    sembunyikanBendera: () => pengontrolBendera.sembunyikan(),
    resize: perbaruiUkuran,
    bersihkan,
    renderer,
    scene,
    camera,
    daftarMesh: elemenAdegan.daftarProvinsiMesh
  };
}
