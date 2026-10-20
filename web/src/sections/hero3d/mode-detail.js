/**
 * mode-detail.js — Mesin Keadaan (State Machine) & Antarmuka Mode Detail Provinsi 3D
 * Sesuai CP-1 dan Bagian 4 & 7 Dokumen Spesifikasi:
 * - State machine: 'peta' -> 'masuk' -> 'detail' -> 'keluar' -> 'peta'
 * - detailProgress in [0, 1] di-tween dengan GSAP (dapat diinterupsi kapan saja tanpa lompatan)
 * - Keping provinsi terpilih terangkat, berputar menghadap atas, dan melayang ke kolom kiri layar
 * - Provinsi lain meredup (opacity -> 0.12) dan surut ke bawah
 * - Cangkang tata letak 3 kolom:
 *   - Kolom Kiri: Ruang pandang keping 3D + daftar kabupaten/kota
 *   - Kolom Tengah: Kartu kebudayaan statis bergaya Gambar 2 (gradien per jenis) atau empty state jujur
 *   - Kolom Kanan: Rincian lengkap Bagian 7 (angka utama, 5 jenis OPK, CB, refleksi data, paspor, share, link SPKT)
 * - Tombol "← Kembali ke peta", tombol Esc, dan pemilih provinsi lain tanpa reload
 */

import {
  Vector3,
  Vector2,
  Euler,
  Quaternion,
  Object3D,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Group,
  MeshStandardMaterial,
  Color,
  Mesh,
  WebGLRenderTarget,
  OrthographicCamera,
  PlaneGeometry,
  ShaderMaterial,
  Scene,
  LinearFilter,
  RGBAFormat
} from 'three';
import { gsap } from 'gsap';
import { apakahKurangiGerak } from '../../util/motion.js';
import { WARNA_JENIS_HEX, GRADIEN_JENIS_CSS } from '../../map/scales.js';
import { formatAngka } from '../../util/format.js';
import { dapatkanGambarBudaya } from '../../data/gambar-budaya.js';

export function buatPengelolaModeDetail({
  scene,
  grupUtama,
  camera,
  elemenAdegan,
  daftarProvinsi = [],
  wadahEl,
  onBukaDetailRekaman,
  onCatatStempel,
  ambilBudayaProvinsi,
  tanggalAmbilData = '9 Oktober 2026',
  onMulaiBuka,
  onSelesaiTutup,
  onPilihProvinsiBaru
}) {
  // State Machine
  let state = 'peta'; // 'peta' | 'masuk' | 'detail' | 'keluar'
  const detailProgress = { val: 0 };
  let tweenProgress = null;

  let provAktif = null;
  let meshAktif = null;

  // Transformasi asal & target keping terpilih (dalam sistem koordinat lokal & dunia)
  const posAsalLokal = new Vector3();
  const quatAsalLokal = new Quaternion(0, 0, 0, 1);
  const posAsalWorld = new Vector3();
  const quatAsalWorld = new Quaternion();
  const posTargetWorld = new Vector3();
  const quatTargetWorld = new Quaternion();
  let skalaTarget = 1.0;

  // Interaksi putar bebas 360° pada keping terpilih
  let isDraggingKeping = false;
  let dragKepingStartX = 0;
  let dragKepingStartY = 0;
  let rotasiInteraktifX = 0;
  let rotasiInteraktifY = 0;
  let targetRotasiInteraktifX = 0;
  let targetRotasiInteraktifY = 0;

  // Garis kontur batas emas bertekstur
  let garisAksen = null;

  // Jejak / cetakan slot keping yang terambil dari peta asal
  let meshCetakanAsal = null;

  // Papan laut & Awan
  const matLaut = elemenAdegan?.papanLaut?.matLaut || null;
  const daftarAwan = elemenAdegan?.daftarAwan || [];
  const daftarMeshLain = [];

  // Setup Pipeline Blur Lembut Latar Belakang (Depth-of-Field Bokeh)
  // Menghasilkan latar belakang peta Indonesia yang blur lembut elegan saat keping provinsi dibuka
  const renderTargetBg = new WebGLRenderTarget(1024, 768, {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    format: RGBAFormat
  });

  const postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postQuadGeom = new PlaneGeometry(2, 2);

  const blurMat = new ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 uResolution;
      uniform float uBlur;
      varying vec2 vUv;

      void main() {
        if (uBlur <= 0.01) {
          gl_FragColor = texture2D(tDiffuse, vUv);
          return;
        }

        vec2 texel = (1.0 / uResolution) * uBlur;
        vec4 sum = vec4(0.0);

        // 17-tap Poisson disc filter terbobot seimbang untuk bokeh kamera sinematik
        sum += texture2D(tDiffuse, vUv) * 0.128;

        sum += texture2D(tDiffuse, vUv + vec2(-0.85,  0.00) * texel) * 0.086;
        sum += texture2D(tDiffuse, vUv + vec2( 0.85,  0.00) * texel) * 0.086;
        sum += texture2D(tDiffuse, vUv + vec2( 0.00, -0.85) * texel) * 0.086;
        sum += texture2D(tDiffuse, vUv + vec2( 0.00,  0.85) * texel) * 0.086;

        sum += texture2D(tDiffuse, vUv + vec2(-1.35, -1.35) * texel * 0.707) * 0.059;
        sum += texture2D(tDiffuse, vUv + vec2( 1.35, -1.35) * texel * 0.707) * 0.059;
        sum += texture2D(tDiffuse, vUv + vec2(-1.35,  1.35) * texel * 0.707) * 0.059;
        sum += texture2D(tDiffuse, vUv + vec2( 1.35,  1.35) * texel * 0.707) * 0.059;

        sum += texture2D(tDiffuse, vUv + vec2(-2.10,  0.00) * texel) * 0.041;
        sum += texture2D(tDiffuse, vUv + vec2( 2.10,  0.00) * texel) * 0.041;
        sum += texture2D(tDiffuse, vUv + vec2( 0.00, -2.10) * texel) * 0.041;
        sum += texture2D(tDiffuse, vUv + vec2( 0.00,  2.10) * texel) * 0.041;

        sum += texture2D(tDiffuse, vUv + vec2(-2.00, -2.00) * texel * 0.707) * 0.032;
        sum += texture2D(tDiffuse, vUv + vec2( 2.00, -2.00) * texel * 0.707) * 0.032;
        sum += texture2D(tDiffuse, vUv + vec2(-2.00,  2.00) * texel * 0.707) * 0.032;
        sum += texture2D(tDiffuse, vUv + vec2( 2.00,  2.00) * texel * 0.707) * 0.032;

        // Sedikit tone down lembut (5%) agar keping pulau di depan lebih kontras & menonjol
        sum.rgb *= 0.95;

        gl_FragColor = sum;
      }
    `,
    uniforms: {
      tDiffuse: { value: null },
      uResolution: { value: new Vector2(1, 1) },
      uBlur: { value: 0 }
    },
    depthTest: false,
    depthWrite: false
  });

  const postQuad = new Mesh(postQuadGeom, blurMat);
  const postScene = new Scene();
  postScene.add(postQuad);

  // DOM Kontainer Mode Detail
  const domOverlay = document.createElement('div');
  domOverlay.className = 'mode-detail-overlay is-tersembunyi';
  domOverlay.setAttribute('role', 'region');
  domOverlay.setAttribute('aria-label', 'Mode Detail Provinsi Nusantara');

  // Cegah interaksi di overlay merembes ke kanvas 3D
  domOverlay.addEventListener('pointerdown', (e) => e.stopPropagation());
  domOverlay.addEventListener('pointerup', (e) => e.stopPropagation());

  wadahEl.appendChild(domOverlay);

  // Parallax halus pointer di atas kolom kiri
  let parallaxX = 0;
  let parallaxY = 0;
  let targetParallaxX = 0;
  let targetParallaxY = 0;

  domOverlay.addEventListener('pointermove', (e) => {
    if (state !== 'detail' && state !== 'masuk') return;
    if (isDraggingKeping) return; // Jangan terapkan parallax jika sedang drag keping
    const rect = domOverlay.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    // Parallax aktif saat kursor di 45% sisi kiri layar
    if (nx < 0.45) {
      targetParallaxX = (nx - 0.22) * 0.10;
      targetParallaxY = (ny - 0.5) * 0.10;
    } else {
      targetParallaxX = 0;
      targetParallaxY = 0;
    }
  });

  // Listener keyboard ESC untuk menutup mode detail
  function onKeyDown(e) {
    if (e.key === 'Escape' && isAktif()) {
      e.preventDefault();
      tutup();
    }
  }
  window.addEventListener('keydown', onKeyDown);

  /**
   * Menerapkan atau mencopot tekstur atlas fisik realistis pada keping provinsi
   * dengan menukar material instance secara aman & instan tanpa shader recompilation
   * @param {Mesh} mesh
   * @param {boolean} aktif - true jika mode detail aktif, false jika kembali ke normal
   */
  function terapkanTeksturAtlas(mesh, aktif) {
    if (!mesh) return;
    if (aktif && mesh.userData?.materialAtlas) {
      mesh.material = mesh.userData.materialAtlas;
      mesh.material.side = 2; // DoubleSide
      mesh.material.emissive.setHex(0x000000);
      mesh.material.emissiveIntensity = 0;
    } else if (mesh.userData?.materialNormal) {
      mesh.material = mesh.userData.materialNormal;
      mesh.material.side = 2; // DoubleSide
      if (mesh.userData.teksturTopo) {
        mesh.material.map = mesh.userData.teksturTopo;
        mesh.material.color.set(0xffffff);
      } else {
        const warnaAsal = mesh.userData.warnaNormal || mesh.userData.warnaNatural;
        if (warnaAsal) {
          mesh.material.color.copy(warnaAsal);
        }
      }
      mesh.material.emissive.setHex(0x000000);
      mesh.material.emissiveIntensity = 0;
      mesh.material.needsUpdate = true;
    }
  }

  /**
   * Membersihkan slot jejak cetakan keping asal dari scene secara aman
   * TANPA merusak atau mendispose geometri asli milik keping provinsi
   */
  function bersihkanCetakanAsal() {
    if (!meshCetakanAsal) return;
    if (meshCetakanAsal.parent) {
      meshCetakanAsal.parent.remove(meshCetakanAsal);
    }
    meshCetakanAsal.traverse((child) => {
      // HANYA dispose geometri kontur garis yang dibuat khusus, JANGAN dispose geometri asli provinsi!
      if (child.isLineSegments) {
        child.geometry?.dispose();
      }
      child.material?.dispose();
    });
    meshCetakanAsal = null;
  }

  /**
   * Menghitung posisi target 3D keping terpilih di depan kamera
   * di dalam sistem koordinat lokal parent (grupProvinsi)
   * Menggunakan proyeksi terukur pixel-perfect agar ukuran keping benar-benar "PAS":
   * tidak kekecilan, tidak menabrak topbar, tidak bertabrakan dengan kartu administratif,
   * dan tidak menabrak kolom tengah.
   */
  function hitungTargetKiri(mesh) {
    if (!mesh) return;
    const adalahPonsel = window.innerWidth < 768;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Default target NDC di area pandang kolom kiri
    let ndcX = adalahPonsel ? 0.0 : -0.32;
    let ndcY = adalahPonsel ? 0.45 : 0.08;
    let targetPx = adalahPonsel ? Math.min(winW * 0.70, 260) : 380;

    const kolomKiriEl = domOverlay.querySelector('.cangkang-kolom--kiri');
    const kanvasEl = wadahEl?.querySelector('canvas') || wadahEl;
    if (kolomKiriEl && kanvasEl) {
      const rectKiri = kolomKiriEl.getBoundingClientRect();
      const rectKanvas = kanvasEl.getBoundingClientRect();
      if (rectKanvas.width > 0 && rectKanvas.height > 0) {
        if (!adalahPonsel) {
          const viewAreaEl = domOverlay.querySelector('.cangkang-kiri-viewarea');
          const rectView = viewAreaEl ? viewAreaEl.getBoundingClientRect() : rectKiri;
          const pixelX = rectView.left + rectView.width * 0.5;
          const pixelY = rectView.top + rectView.height * 0.48;

          ndcX = ((pixelX - rectKanvas.left) / rectKanvas.width) * 2 - 1;
          ndcY = -(((pixelY - rectKanvas.top) / rectKanvas.height) * 2 - 1);
          targetPx = Math.min(rectView.width * 0.72, rectView.height * 0.76, 460);
        } else {
          ndcX = 0.0;
          ndcY = 0.45;
          targetPx = Math.min(winW * 0.68, winH * 0.30, 260);
        }
      }
    }

    const targetNDC = new Vector3(ndcX, ndcY, 0.5);
    targetNDC.unproject(camera);

    const dir = targetNDC.sub(camera.position).normalize();
    const jarak = adalahPonsel ? 2.80 : 2.70; // Jarak proporsional di depan lensa kamera
    posTargetWorld.copy(camera.position).add(dir.multiplyScalar(jarak));

    // Hitung ukuran target Three.js di dunia 3D agar persis sesuai targetPx di layar
    const fovRad = ((camera.fov || 34) * Math.PI) / 180;
    const frustumH = 2 * jarak * Math.tan(fovRad * 0.5);
    const worldSizeTarget = targetPx * (frustumH / winH);

    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    const rentangX = box.max.x - box.min.x;
    const rentangZ = box.max.z - box.min.z;
    const ukuranMaks = Math.max(rentangX, rentangZ) || 1.0;

    // Skala presisi matematis: ukuran terbesar objek akan berproyeksi TEPAT sebesar targetPx pixel
    skalaTarget = worldSizeTarget / ukuranMaks;

    // Target quaternion di world space: Menghadap tegak lurus ke layar POV dari atas (Top-Down Aerial View)
    // Permukaan atas (+Y keping) menghadap tepat ke kamera, Utara (-Z keping) tegak lurus ke atas layar, Timur (+X keping) ke kanan layar
    const dummy = new Object3D();
    dummy.position.copy(posTargetWorld);
    dummy.lookAt(camera.position);
    dummy.rotateX(Math.PI * 0.5); // Tepat 90 derajat top-down POV dari atas tanpa kemiringan miring
    dummy.updateMatrixWorld(true);
    quatTargetWorld.copy(dummy.quaternion);
  }

  // Sinkronisasi posisi keping jika jendela diubah ukurannya saat mode detail aktif
  window.addEventListener(
    'resize',
    () => {
      if (state === 'detail' && meshAktif) {
        hitungTargetKiri(meshAktif);
        updatePoseVisual(1.0);
      }
    },
    { passive: true }
  );

  /**
   * Fungsi murni yang menerapkan seluruh pose visual berdasarkan nilai p in [0, 1]
   */
  function updatePoseVisual(p) {
    // 1. Transformasi keping pulau terpilih (di ruang dunia, diproyeksikan ke ruang lokal parent)
    if (meshAktif) {
      const parent = meshAktif.parent || elemenAdegan?.grupProvinsi || grupUtama;
      if (parent) {
        parent.updateMatrixWorld(true);

        // Posisi dan orientasi slot keping di diorama pada ruang dunia (World Space) di frame saat ini
        const slotWorldPos = parent.localToWorld(posAsalLokal.clone());
        const parentQuatWorld = new Quaternion();
        parent.getWorldQuaternion(parentQuatWorld);

        // Interpolasi posisi di ruang dunia: dari slot diorama (p = 0) ke target tampilan detail (p = 1)
        const curWorldPos = slotWorldPos.lerp(posTargetWorld, p);
        meshAktif.position.copy(parent.worldToLocal(curWorldPos));

        // Interpolasi rotasi di ruang dunia: dari orientasi slot diorama (p = 0) ke target tampilan detail (p = 1)
        const curQuatWorld = parentQuatWorld.clone().slerp(quatTargetWorld, p);
        meshAktif.quaternion.copy(parentQuatWorld.clone().invert().multiply(curQuatWorld));

        // Lerp skala keping
        const skalaKini = 1.0 + (skalaTarget - 1.0) * p;
        meshAktif.scale.setScalar(skalaKini);
      }

      // Garis kontur aksen emas
      if (garisAksen && garisAksen.material) {
        garisAksen.material.opacity = p * 0.85;
      }

      // Pastikan material keping terpilih selalu solid & cemerlang
      if (meshAktif.material) {
        meshAktif.material.transparent = false;
        meshAktif.material.opacity = 1.0;
      }
    }

    // 2. Jejak keping terangkat di peta asal terlihat jelas ("bagian yang terambil terlihat")
    if (meshCetakanAsal) {
      const dasar = meshCetakanAsal.children[0];
      const garis = meshCetakanAsal.children[1];
      if (dasar && dasar.material) {
        dasar.material.opacity = p * 0.72;
      }
      if (garis && garis.material) {
        garis.material.opacity = p * 0.90;
      }
    }

    // 3. Peta 3D Indonesia TETAP ADA di latar belakang, dibuat agak buram / temaram secara elegan
    for (let i = 0; i < daftarMeshLain.length; i++) {
      const m = daftarMeshLain[i];
      // Pertahankan posisi Y asal (TIDAK ditenggelamkan ke bawah laut agar bentuk pulau utuh)
      const yAsal = m.userData?.pusatAsal?.y ?? 0;
      m.position.y = yAsal;

      if (m.material) {
        if (p > 0.01) {
          m.material.transparent = true;
          // Opasitas solid-elegan (0.78 - 0.88): pulau-pulau tetap utuh di latar belakang
          // Efek buram kamera dihasilkan langsung oleh depth-of-field blur shader
          m.material.opacity = Math.max(0.78, 1.0 - p * 0.22);
        } else {
          m.material.transparent = false;
          m.material.opacity = 1.0;
        }
      }
    }

    // 4. Papan laut diorama tetap solid dan indah di latar belakang
    if (matLaut) {
      if (p > 0.01) {
        matLaut.transparent = true;
        matLaut.opacity = Math.max(0.85, 1.0 - p * 0.15);
      } else {
        matLaut.transparent = false;
        matLaut.opacity = 1.0;
      }
    }

    // 5. Awan melayang lembut di latar belakang
    for (let i = 0; i < daftarAwan.length; i++) {
      const awan = daftarAwan[i];
      if (awan.material) {
        awan.material.transparent = true;
        awan.material.opacity = Math.max(0.40, 1.0 - p * 0.60);
      }
    }

    // 6. Sinkronisasi opasitas & visibility DOM overlay
    domOverlay.style.opacity = String(p);
    if (p > 0.01) {
      domOverlay.classList.remove('is-tersembunyi');
      domOverlay.classList.add('is-tampil');
      domOverlay.style.pointerEvents = p > 0.75 ? 'auto' : 'none';
    } else {
      domOverlay.classList.remove('is-tampil');
      domOverlay.classList.add('is-tersembunyi');
      domOverlay.style.pointerEvents = 'none';
    }
  }

  /**
   * Membuka Mode Detail untuk provinsi terpilih
   */
  function buka(provData, mesh) {
    if (!provData || !mesh) return;

    try {
      // Bersihkan aksen dan reset mesh aktif sebelumnya jika berbeda
      if (meshAktif && meshAktif !== mesh) {
        if (garisAksen) {
          meshAktif.remove(garisAksen);
          garisAksen.geometry?.dispose();
          garisAksen.material?.dispose();
          garisAksen = null;
        }
        meshAktif.position.copy(posAsalLokal);
        meshAktif.rotation.set(0, 0, 0);
        meshAktif.scale.set(1, 1, 1);
        terapkanTeksturAtlas(meshAktif, false);
      }

      provAktif = provData;
      meshAktif = mesh;

      // Terapkan tekstur peta fisik atlas HANYA pada keping terpilih saat masuk ke mode detail
      terapkanTeksturAtlas(meshAktif, true);

      // Simpan posisi asal lokal dan dunia di dalam grupProvinsi & adegan
      if (mesh.userData?.pusatAsal) {
        posAsalLokal.copy(mesh.userData.pusatAsal);
      } else {
        posAsalLokal.copy(mesh.position);
      }
      quatAsalLokal.set(0, 0, 0, 1);

      mesh.getWorldPosition(posAsalWorld);
      mesh.getWorldQuaternion(quatAsalWorld);

      // Reset rotasi interaktif
      targetRotasiInteraktifX = 0;
      targetRotasiInteraktifY = 0;
      rotasiInteraktifX = 0;
      rotasiInteraktifY = 0;

      // Pasang aksen garis kontur emas di sekeliling keping agar detail visualnya tajam & bertekstur
      if (!garisAksen && mesh.geometry) {
        const geomEdges = new EdgesGeometry(mesh.geometry, 24);
        const matEdges = new LineBasicMaterial({
          color: 0xFFE082,
          transparent: true,
          opacity: 0.0,
          linewidth: 1.5
        });
        garisAksen = new LineSegments(geomEdges, matEdges);
        garisAksen.name = 'aksen-garis-detail';
        mesh.add(garisAksen);
      }

      // Bersihkan jejak cetakan keping sebelumnya jika ada secara aman
      bersihkanCetakanAsal();

      const parentGrup = mesh.parent || elemenAdegan?.grupProvinsi || grupUtama;
      if (parentGrup && mesh.geometry) {
        const grupCetakan = new Group();
        grupCetakan.name = 'jejak-cetakan-keping-asal';

        // 1. Dasar siluet cekungan: bayangan warna gelap di atas laut
        const matDasarSlot = new MeshStandardMaterial({
          color: new Color(0x0a1428),
          roughness: 0.95,
          metalness: 0.05,
          transparent: true,
          opacity: 0.0,
          depthWrite: false
        });
        const meshDasarSlot = new Mesh(mesh.geometry, matDasarSlot);
        meshDasarSlot.scale.set(0.998, 0.18, 0.998);
        grupCetakan.add(meshDasarSlot);

        // 2. Garis kontur siluet bercahaya cyan / biru safir penanda lokasi asal keping
        const geomEdgesSlot = new EdgesGeometry(mesh.geometry, 24);
        const matGarisSlot = new LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.0,
          linewidth: 1.5
        });
        const garisSlot = new LineSegments(geomEdgesSlot, matGarisSlot);
        garisSlot.position.y = 0.01;
        grupCetakan.add(garisSlot);

        grupCetakan.position.copy(posAsalLokal);
        grupCetakan.rotation.set(0, 0, 0);
        grupCetakan.scale.set(1, 1, 1);

        parentGrup.add(grupCetakan);
        meshCetakanAsal = grupCetakan;
      }

      // Kumpulkan daftar mesh provinsi lain
      daftarMeshLain.length = 0;
      if (elemenAdegan?.daftarProvinsiMesh) {
        for (const m of elemenAdegan.daftarProvinsiMesh) {
          if (m !== meshAktif) {
            daftarMeshLain.push(m);
          }
        }
      }

      // Render cangkang DOM 3 Kolom terlebih dahulu agar elemen layout terukur presisi
      renderDom();

      // Hitung posisi target di kolom kiri (di ruang lokal parent) dengan koordinat dinamis yang akurat
      hitungTargetKiri(meshAktif);

      // Panggil callback onMulaiBuka setelah persiapan DOM dan target selesai
      if (typeof onMulaiBuka === 'function') {
        onMulaiBuka(provData, mesh);
      }

      // Hentikan tween sebelumnya jika sedang berjalan (interupsi mulus)
      if (tweenProgress) {
        tweenProgress.kill();
      }

      state = 'masuk';
      const durasi = apakahKurangiGerak() ? 0.2 : 1.4;

      if (grupUtama) {
        gsap.to(grupUtama.rotation, {
          y: 0,
          duration: durasi,
          ease: 'power3.inOut'
        });
      }

      tweenProgress = gsap.to(detailProgress, {
        val: 1,
        duration: durasi,
        ease: 'power3.inOut',
        onUpdate: () => {
          updatePoseVisual(detailProgress.val);
        },
        onComplete: () => {
          state = 'detail';
          updatePoseVisual(1.0);
        }
      });
    } catch (err) {
      console.error('[ModeDetail.buka] Terjadi galat saat membuka mode detail:', err);
      state = 'peta';
      if (meshAktif) {
        terapkanTeksturAtlas(meshAktif, false);
      }
      bersihkanCetakanAsal();
      if (typeof onSelesaiTutup === 'function') {
        onSelesaiTutup();
      }
    }
  }

  /**
   * Menutup Mode Detail dan kembali ke peta awal
   */
  function tutup() {
    if (state === 'peta' && detailProgress.val === 0) return;

    if (tweenProgress) {
      tweenProgress.kill();
    }

    state = 'keluar';
    const durasi = apakahKurangiGerak() ? 0.2 : 1.2;

    // Kembalikan rotasi interaktif ke 0 secara mulus
    targetRotasiInteraktifX = 0;
    targetRotasiInteraktifY = 0;

    tweenProgress = gsap.to(detailProgress, {
      val: 0,
      duration: durasi,
      ease: 'power3.inOut',
      onUpdate: () => {
        updatePoseVisual(detailProgress.val);
      },
      onComplete: () => {
        state = 'peta';

        // Pulihkan seluruh mesh pulau lain ke kondisi solid normal
        for (let i = 0; i < daftarMeshLain.length; i++) {
          const m = daftarMeshLain[i];
          if (m.material) {
            m.material.transparent = false;
            m.material.opacity = 1.0;
          }
        }
        if (matLaut) {
          matLaut.transparent = false;
          matLaut.opacity = 1.0;
        }
        for (let i = 0; i < daftarAwan.length; i++) {
          const awan = daftarAwan[i];
          if (awan.material) {
            awan.material.opacity = 1.0;
          }
        }

        // Pastikan keping 100% tepat kembali ke posisi, rotasi, dan skala asalnya
        if (meshAktif) {
          meshAktif.position.copy(posAsalLokal);
          meshAktif.rotation.set(0, 0, 0);
          meshAktif.scale.set(1, 1, 1);
          meshAktif.layers.set(0);

          // Kembalikan material keping terpilih ke kondisi normal diorama (flat shaded, tanpa tekstur)
          terapkanTeksturAtlas(meshAktif, false);

          if (garisAksen) {
            meshAktif.remove(garisAksen);
            garisAksen.geometry?.dispose();
            garisAksen.material?.dispose();
            garisAksen = null;
          }
        }

        bersihkanCetakanAsal();

        domOverlay.style.opacity = '0';
        domOverlay.classList.remove('is-tampil');
        domOverlay.classList.add('is-tersembunyi');
        domOverlay.style.pointerEvents = 'none';

        if (typeof onSelesaiTutup === 'function') {
          onSelesaiTutup();
        }

        provAktif = null;
        meshAktif = null;
      }
    });
  }

  /**
   * Berpindah ke provinsi lain tanpa keluar ke peta terlebih dahulu
   * (Transisi keluar cepat lalu masuk ke provinsi baru)
   */
  function gantiProvinsi(kodeBaru) {
    const meshBaru = elemenAdegan?.daftarProvinsiMesh?.find(
      (m) => String(m.userData.kode) === String(kodeBaru)
    );
    const dataBaru = daftarProvinsi.find(
      (p) => String(p.kode).padStart(2, '0') === String(kodeBaru).padStart(2, '0')
    );
    if (!meshBaru || !dataBaru) return;

    if (tweenProgress) tweenProgress.kill();

    // Pulihkan mesh aktif sebelumnya ke posisi asal lokalnya dan kembalikan tekstur ke normal
    if (meshAktif) {
      if (garisAksen) {
        meshAktif.remove(garisAksen);
        garisAksen.geometry?.dispose();
        garisAksen.material?.dispose();
        garisAksen = null;
      }
      bersihkanCetakanAsal();
      meshAktif.position.copy(posAsalLokal);
      meshAktif.scale.setScalar(1.0);
      meshAktif.rotation.set(0, 0, 0);
      meshAktif.layers.set(0);
      terapkanTeksturAtlas(meshAktif, false);
      if (meshAktif.material) {
        meshAktif.material.emissive?.set('#000000');
      }
    }

    if (typeof onPilihProvinsiBaru === 'function') {
      onPilihProvinsiBaru(kodeBaru);
    }

    // Buka provinsi baru langsung
    buka(dataBaru, meshBaru);
  }

  /**
   * Merender cangkang antarmuka 3 Kolom HTML
   */
  function renderDom() {
    if (!provAktif) return;

    const p = provAktif;
    const kodeStr = String(p.kode).padStart(2, '0');
    const adalahKosong = p.status_data === 'belum_tercatat' || (p.total || 0) === 0;
    const warnaJenis = WARNA_JENIS_HEX[p.jenis_dominan] || '#E6B14A';

    // Data tradisi budaya
    const daftarBudaya = ambilBudayaProvinsi(p.kode) || [];

    // Data pembagian wilayah kab/kota
    let daftarKab = [];
    if (Array.isArray(p.kabupaten_teratas) && p.kabupaten_teratas.length > 0) {
      daftarKab = p.kabupaten_teratas;
    } else if (daftarBudaya.length > 0) {
      const mapKab = new Map();
      for (const t of daftarBudaya) {
        const namaK = t.kabupaten_nama || 'Kabupaten Belum Terdata';
        mapKab.set(namaK, (mapKab.get(namaK) || 0) + 1);
      }
      daftarKab = Array.from(mapKab.entries())
        .map(([nama, jumlah]) => ({ nama, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah);
    }

    // Data komposisi 5 OPK
    const opk = p.per_jenis_opk || p.opk || {};
    const daftarJenis = [
      { key: 'adat', nama: 'Adat Ritus', jml: opk.adat || opk.adat_istiadat || 0, warna: '#E6A23C' },
      { key: 'seni', nama: 'Seni Pertunjukan', jml: opk.seni || 0, warna: '#409EFF' },
      { key: 'lisan', nama: 'Tradisi Lisan', jml: opk.lisan || opk.tradisi_lisan || 0, warna: '#67C23A' },
      { key: 'pengetahuan', nama: 'Pengetahuan Tradisional', jml: opk.pengetahuan || opk.pengetahuan_tradisional || 0, warna: '#909399' },
      { key: 'kerajinan', nama: 'Kerajinan', jml: opk.kerajinan || opk.teknologi_tradisional || 0, warna: '#F56C6C' }
    ];

    // Cagar budaya & kategori lain
    const cb = p.per_jenis_cb || p.cagar_budaya || {};
    const totalCB = p.per_kategori?.CB || p.total_cagar_budaya || 0;
    const totalLB = p.per_kategori?.LB || p.total_lembaga_budaya || 0;
    const totalSP = p.per_kategori?.SP || p.total_sarana_prasarana || 0;

    domOverlay.innerHTML = `
      <div class="cangkang-detail-wadah">
        <!-- Top Bar Navigasi -->
        <header class="cangkang-topbar">
          <button type="button" class="btn-kembali-peta" title="Kembali ke Peta Indonesia (Esc)">
            <span class="btn-kembali-panah">&larr;</span>
            <span class="btn-kembali-teks">Kembali ke peta</span>
          </button>

          <div class="cangkang-topbar-tengah">
            <span class="cangkang-badge-kodeprov" style="color: ${warnaJenis}; border-color: ${warnaJenis}44;">
              PROVINSI ${kodeStr}
            </span>
            <h2 class="cangkang-judul-prov">${p.nama}</h2>
            ${
              p.peringkat_total
                ? `<span class="cangkang-chip-peringkat">Peringkat #${p.peringkat_total} Nasional</span>`
                : ''
            }
          </div>

          <div class="cangkang-topbar-kanan">
            <button type="button" class="btn-tutup-silang" title="Tutup Detail (&times;)" aria-label="Tutup detail provinsi">&times;</button>
          </div>
        </header>

        <!-- Layout 2 Zona (Kiri: Peta 3D Lega 70%, Kanan: 1 Panel Samping Elegan Berbasis Tab) -->
        <div class="cangkang-layout-2zona">
          
          <!-- ZONA KIRI: Area Pandang Peta 3D (Lega, Bersih Tanpa Halangan) -->
          <div class="cangkang-kolom cangkang-kolom--kiri" aria-label="Inspeksi Keping 3D Wilayah">
            <div class="cangkang-kiri-viewarea" role="region" aria-label="Peta Topografi POV dari atas ${p.nama}">
              <div class="cangkang-kiri-hud-pill">
                <span class="cangkang-hud-titik"></span>
                <span>PETA TOPOGRAFI &bull; ${p.nama.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <!-- ZONA KANAN: Satu Panel Kanan Elegan Berbasis Tab Modern -->
          <aside class="cangkang-panel-kanan-tunggal" aria-label="Detail Informasi ${p.nama}">
            
            <!-- Tab Navigation Switcher -->
            <nav class="cangkang-tab-nav" role="tablist" aria-label="Pilihan Informasi">
              <button type="button" role="tab" class="cangkang-tab-btn is-aktif" data-tab="budaya" aria-selected="true">
                <span class="cangkang-tab-ikon">🏛️</span>
                <span class="cangkang-tab-teks">Warisan Budaya</span>
                <span class="cangkang-tab-counter">${daftarBudaya.length}</span>
              </button>
              <button type="button" role="tab" class="cangkang-tab-btn" data-tab="data" aria-selected="false">
                <span class="cangkang-tab-ikon">📊</span>
                <span class="cangkang-tab-teks">Data &amp; Angka</span>
              </button>
              <button type="button" role="tab" class="cangkang-tab-btn" data-tab="wilayah" aria-selected="false">
                <span class="cangkang-tab-ikon">📍</span>
                <span class="cangkang-tab-teks">Kabupaten</span>
                <span class="cangkang-tab-counter">${daftarKab.length}</span>
              </button>
            </nav>

            <!-- Panel Scrollable Body -->
            <div class="cangkang-tab-konten-wadah">

              <!-- ==============================================
                   TAB PANE 1: WARISAN BUDAYA (KARTU KOMPAK)
                   ============================================== -->
              <section class="cangkang-tab-pane is-aktif" data-pane="budaya" role="tabpanel">
                <div class="cangkang-pane-header">
                  <div>
                    <span class="cangkang-kicker-tengah">ARSIP RESMI SPKT</span>
                    <h3 class="cangkang-judul-tengah">Koleksi ${p.nama}</h3>
                  </div>
                  <span class="cangkang-counter-tengah">${daftarBudaya.length} Catatan</span>
                </div>

                <div class="cangkang-daftar-budaya-kompak">
                  ${
                    !adalahKosong && daftarBudaya.length > 0
                      ? daftarBudaya
                          .map((item) => {
                            const gradienBg = GRADIEN_JENIS_CSS[item.jenis] || 'linear-gradient(135deg, #FFD36B, #FFF1B8)';
                            const fotoUrl = dapatkanGambarBudaya(item);
                            const jenisLabel = (item.jenis_label || item.kategori || 'OPK').toUpperCase();
                            const kabLabel = item.kabupaten_nama || p.nama;

                            return `
                            <article
                              class="kartu-budaya-kompak"
                              data-id="${item.id}"
                              role="button"
                              tabindex="0"
                              title="Klik untuk membuka detail ${item.nama_tampil || item.nama}"
                            >
                              <!-- Thumbnail Square di Kiri (72x72 px) -->
                              <div class="kartu-kompak-thumb" style="background: ${gradienBg};">
                                <img
                                  src="${fotoUrl}"
                                  alt="${item.nama}"
                                  class="kartu-kompak-img"
                                  loading="lazy"
                                />
                                <span class="kartu-kompak-jenis-badge">${item.jenis ? item.jenis.toUpperCase() : 'OPK'}</span>
                              </div>

                              <!-- Info Teks Ringkas di Kanan -->
                              <div class="kartu-kompak-info">
                                <div class="kartu-kompak-meta">
                                  <span class="kartu-kompak-kicker">${jenisLabel}</span>
                                  <span class="kartu-kompak-titik">&bull;</span>
                                  <span class="kartu-kompak-kab">${kabLabel}</span>
                                </div>
                                <h4 class="kartu-kompak-judul">${item.nama_tampil || item.nama}</h4>
                                <p class="kartu-kompak-sinopsis">
                                  ${item.ringkasan || 'SPKT belum memuat deskripsi lengkap untuk rekaman budaya ini.'}
                                </p>
                                <div class="kartu-kompak-bawah">
                                  ${
                                    item.jumlah_lokasi_gabungan && item.jumlah_lokasi_gabungan > 1
                                      ? `<span class="kartu-kompak-gabung">📍 ${item.jumlah_lokasi_gabungan} wilayah</span>`
                                      : ''
                                  }
                                  <span class="kartu-kompak-link">Baca Selengkapnya &rarr;</span>
                                </div>
                              </div>
                            </article>
                          `;
                          })
                          .join('')
                      : `
                      <!-- Keadaan Kosong yang Jujur (10 Provinsi Tanpa Data) -->
                      <div class="cangkang-state-kosong-jujur">
                        <div class="cangkang-kosong-ikon">🔭</div>
                        <h3 class="cangkang-kosong-judul">Belum Tercatat di SPKT</h3>
                        <p class="cangkang-kosong-deskripsi">
                          Provinsi <strong>${p.nama}</strong> saat ini belum memiliki rekaman data di Sistem Pendataan Kebudayaan Terpadu (SPKT), Kementerian Kebudayaan RI per tanggal pencatatan.
                        </p>
                        <blockquote class="cangkang-kosong-kutipan">
                          &ldquo;Budaya Indonesia tidak sedikit. Yang sedikit adalah yang sudah tercatat.&rdquo;
                        </blockquote>
                        <p class="cangkang-kosong-ajakan">
                          Celah data ini mengajak kita peduli mendokumentasikan dan mendaftarkan kekayaan budaya lokal agar abadi dan dikenal dunia.
                        </p>
                      </div>
                    `
                  }
                </div>
              </section>

              <!-- ==============================================
                   TAB PANE 2: DATA & ANGKA STATISTIK
                   ============================================== -->
              <section class="cangkang-tab-pane" data-pane="data" role="tabpanel" hidden>
                <div class="cangkang-pane-header">
                  <div>
                    <span class="cangkang-kicker-tengah">RINGKASAN STATISTIK</span>
                    <h3 class="cangkang-judul-tengah">Data &amp; Analisis</h3>
                  </div>
                  <span class="cangkang-kanan-status ${adalahKosong ? 'is-menanti' : 'is-aktif'}">
                    ${adalahKosong ? 'Menanti Pendataan' : 'Tercatat Resmi SPKT'}
                  </span>
                </div>

                <!-- 2 Kotak Angka Utama -->
                <div class="cangkang-kanan-angka-grid">
                  <div class="cangkang-angka-kotak">
                    <span class="cangkang-angka-val">${formatAngka(p.total)}</span>
                    <span class="cangkang-angka-lbl">Total Catatan Budaya</span>
                  </div>
                  <div class="cangkang-angka-kotak">
                    <span class="cangkang-angka-val">${p.peringkat_total ? '#' + p.peringkat_total : '-'}</span>
                    <span class="cangkang-angka-lbl">Peringkat Nasional</span>
                  </div>
                </div>

                <!-- Komposisi 5 Jenis OPK -->
                <div class="cangkang-kanan-seksi">
                  <h4 class="cangkang-seksi-judul">Objek Pemajuan Kebudayaan (OPK)</h4>
                  <div class="cangkang-opk-list">
                    ${daftarJenis
                      .map((item) => {
                        const totalP = p.total || 1;
                        const persen = Math.round((item.jml / totalP) * 100);
                        return `
                      <div class="cangkang-opk-baris">
                        <div class="cangkang-opk-teks">
                          <span class="cangkang-opk-nama">
                            <span class="cangkang-opk-titik" style="background-color: ${item.warna};"></span>
                            ${item.nama}
                          </span>
                          <span class="cangkang-opk-nilai"><strong>${item.jml}</strong> (${persen}%)</span>
                        </div>
                        <div class="cangkang-opk-track">
                          <div class="cangkang-opk-fill" style="width: ${persen}%; background-color: ${item.warna};"></div>
                        </div>
                      </div>
                    `;
                      })
                      .join('')}
                  </div>
                </div>

                <!-- Cagar Budaya & Sarana Prasarana -->
                ${
                  totalCB > 0 || totalLB > 0 || totalSP > 0
                    ? `
                  <div class="cangkang-kanan-seksi">
                    <h4 class="cangkang-seksi-judul">Cagar Budaya &amp; Sarana</h4>
                    <div class="cangkang-cb-rincian">
                      ${cb.benda ? `<span>Benda: <strong>${cb.benda}</strong></span>` : ''}
                      ${cb.bangunan ? `<span>Bangunan: <strong>${cb.bangunan}</strong></span>` : ''}
                      ${cb.struktur ? `<span>Struktur: <strong>${cb.struktur}</strong></span>` : ''}
                      ${cb.situs ? `<span>Situs: <strong>${cb.situs}</strong></span>` : ''}
                      ${cb.kawasan ? `<span>Kawasan: <strong>${cb.kawasan}</strong></span>` : ''}
                      ${totalLB ? `<span>Lembaga: <strong>${totalLB}</strong></span>` : ''}
                      ${totalSP ? `<span>Sarana: <strong>${totalSP}</strong></span>` : ''}
                    </div>
                  </div>
                `
                    : ''
                }

                <!-- Catatan Kejujuran Data (Wajib) -->
                <div class="cangkang-kanan-seksi cangkang-kanan-seksi--kejujuran">
                  <h4 class="cangkang-seksi-judul">Tentang Angka Ini</h4>
                  <p class="cangkang-kejujuran-teks">
                    Angka ini menunjukkan yang sudah tercatat di SPKT per ${tanggalAmbilData}, bukan seberapa kaya budaya ${p.nama}.
                  </p>
                </div>

                <!-- Aksi: Paspor, Bagikan, Tautan SPKT -->
                <div class="cangkang-kanan-aksi">
                  <button type="button" class="btn-aksi-paspor" data-kode="${p.kode}">
                    <span>🏷️ Tambahkan ke Paspor Budaya</span>
                  </button>

                  <div class="cangkang-aksi-grup-dua">
                    <button type="button" class="btn-aksi-bagikan" title="Bagikan halaman budaya ini">
                      <span>📤 Bagikan</span>
                    </button>
                    <a
                      href="https://spkt.kemenbud.go.id"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="tautan-spkt-resmi"
                    >
                      <span>↗ Lihat di SPKT</span>
                    </a>
                  </div>
                </div>
              </section>

              <!-- ==============================================
                   TAB PANE 3: WILAYAH ADMINISTRATIF KABUPATEN
                   ============================================== -->
              <section class="cangkang-tab-pane" data-pane="wilayah" role="tabpanel" hidden>
                <div class="cangkang-pane-header">
                  <div>
                    <span class="cangkang-kicker-tengah">PEMBAGIAN DAERAH</span>
                    <h3 class="cangkang-judul-tengah">Kabupaten &amp; Kota</h3>
                  </div>
                  <span class="cangkang-counter-tengah">${daftarKab.length} Terdata</span>
                </div>

                <div class="cangkang-tab-daftar-kab">
                  ${
                    daftarKab.length > 0
                      ? daftarKab
                          .map((kab) => {
                            const totalP = p.total || 1;
                            const persen = Math.round((kab.jumlah / totalP) * 100);
                            return `
                        <div class="cangkang-kab-item">
                          <div class="cangkang-kab-teks">
                            <span class="cangkang-kab-nama">${kab.nama}</span>
                            <span class="cangkang-kab-jml">${kab.jumlah} karya (${persen}%)</span>
                          </div>
                          <div class="cangkang-kab-bar">
                            <div class="cangkang-kab-bar-isi" style="width: ${persen}%; background-color: ${warnaJenis};"></div>
                          </div>
                        </div>
                      `;
                          })
                          .join('')
                      : `
                    <div class="cangkang-wilayah-kosong">
                      <p>Belum ada rincian kabupaten/kota yang tercatat di SPKT untuk provinsi ini.</p>
                    </div>
                  `
                  }
                </div>
              </section>

            </div>
          </aside>

        </div>
      </div>
    `;

    // Pasang Event Listener Interaktif pada Cangkang
    pasangListenerCangkang(daftarBudaya);
  }

  /**
   * Memasang event listener tombol-tombol cangkang
   */
  function pasangListenerCangkang(daftarBudaya) {
    // Tombol kembali & tutup
    const btnKembali = domOverlay.querySelector('.btn-kembali-peta');
    if (btnKembali) btnKembali.addEventListener('click', tutup);

    const btnTutupSilang = domOverlay.querySelector('.btn-tutup-silang');
    if (btnTutupSilang) btnTutupSilang.addEventListener('click', tutup);

    // Tab Navigation Switcher
    const tabBtns = domOverlay.querySelectorAll('.cangkang-tab-btn');
    const tabPanes = domOverlay.querySelectorAll('.cangkang-tab-pane');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        tabBtns.forEach((b) => {
          const aktif = b === btn;
          b.classList.toggle('is-aktif', aktif);
          b.setAttribute('aria-selected', aktif ? 'true' : 'false');
        });
        tabPanes.forEach((pane) => {
          const aktif = pane.dataset.pane === targetTab;
          pane.classList.toggle('is-aktif', aktif);
          pane.hidden = !aktif;
        });
      });
    });

    // Tombol Paspor
    const btnPaspor = domOverlay.querySelector('.btn-aksi-paspor');
    if (btnPaspor && provAktif) {
      const kode = String(provAktif.kode);
      btnPaspor.addEventListener('click', () => {
        if (typeof onCatatStempel === 'function') {
          onCatatStempel(kode, 'detail');
        }
        btnPaspor.innerHTML = '<span>✅ Stempel Paspor Terkumpul</span>';
        btnPaspor.classList.add('is-terkumpul');
      });
    }

    // Tombol Bagikan
    const btnBagikan = domOverlay.querySelector('.btn-aksi-bagikan');
    if (btnBagikan && provAktif) {
      btnBagikan.addEventListener('click', async () => {
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Lokalocal — ${provAktif.nama}`,
              text: `Jelajahi warisan budaya ${provAktif.nama} di Lokalocal`,
              url
            });
          } catch {
            // Abaikan abort
          }
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          btnBagikan.textContent = '✓ Tersalin!';
          setTimeout(() => { btnBagikan.textContent = '📤 Bagikan'; }, 2000);
        }
      });
    }

    // Kartu Budaya Kompak: klik kartu membuka dialog detail
    const kartuItems = domOverlay.querySelectorAll('.kartu-budaya-kompak');
    kartuItems.forEach((card) => {
      const bukaDetail = () => {
        const id = card.dataset.id;
        const rekaman = daftarBudaya.find((b) => b.id === id);
        if (rekaman && typeof onBukaDetailRekaman === 'function') {
          onBukaDetailRekaman(rekaman, card);
        }
      };
      card.addEventListener('click', bukaDetail);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          bukaDetail();
        }
      });
    });
  }

  function renderKhusus(renderer, scene, camera) {
    if (!renderer || !scene || !camera) return;

    const p = detailProgress.val;

    if (p > 0.01 && meshAktif) {
      const kanvas = renderer.domElement;
      const lebarTarget = Math.max(1, kanvas.width);
      const tinggiTarget = Math.max(1, kanvas.height);

      if (renderTargetBg.width !== lebarTarget || renderTargetBg.height !== tinggiTarget) {
        renderTargetBg.setSize(lebarTarget, tinggiTarget);
      }

      // 1. Tempatkan keping aktif dan garis kontur emas di Layer 1
      meshAktif.layers.set(1);
      if (garisAksen) {
        garisAksen.layers.set(1);
      }

      // Pastikan seluruh sumber cahaya menerangi Layer 0 (latar) dan Layer 1 (keping aktif)
      scene.traverse((child) => {
        if (child.isLight) {
          child.layers.enable(0);
          child.layers.enable(1);
        }
      });

      // 2. Render latar belakang (seluruh kepulauan Indonesia, laut, awan, dan cetakan slot) ke render target
      camera.layers.set(0);
      renderer.setRenderTarget(renderTargetBg);
      renderer.render(scene, camera);

      // 3. Render render target ke layar utama dengan shader blur bokeh lembut
      renderer.setRenderTarget(null);
      blurMat.uniforms.tDiffuse.value = renderTargetBg.texture;
      blurMat.uniforms.uResolution.value.set(lebarTarget, tinggiTarget);
      // Blur halus: uBlur p * 3.8 pixel ("jangan terlalu blur", lembut & natural)
      blurMat.uniforms.uBlur.value = p * 3.8;
      renderer.render(postScene, postCamera);

      // 4. Bersihkan depth buffer dan render keping aktif secara kristal tajam di atasnya
      renderer.clearDepth();
      camera.layers.set(1);
      const autoClearAsal = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.autoClear = autoClearAsal;

      // 5. Kembalikan kamera agar melihat Layer 0 dan Layer 1
      camera.layers.set(0);
      camera.layers.enable(1);
    } else {
      // Saat normal (peta penuh): render langsung ke layar tanpa overhead
      if (meshAktif) {
        meshAktif.layers.set(0);
        if (garisAksen) garisAksen.layers.set(0);
      }
      camera.layers.set(0);
      camera.layers.enable(1);
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }
  }

  return {
    buka,
    tutup,
    gantiProvinsi,
    renderKhusus,
    isAktif: () => state !== 'peta',
    getState: () => state,
    getProgress: () => detailProgress.val,
    updatePerFrame: (tDetik) => {
      // Keping provinsi statis menghadap ke layar POV dari atas sesuai instruksi pengguna
    },
    dispose: () => {
      window.removeEventListener('keydown', onKeyDown);
      if (tweenProgress) tweenProgress.kill();
      if (garisAksen && meshAktif) {
        meshAktif.remove(garisAksen);
        garisAksen.geometry?.dispose();
        garisAksen.material?.dispose();
        garisAksen = null;
      }
      if (renderTargetBg) renderTargetBg.dispose();
      if (postQuadGeom) postQuadGeom.dispose();
      if (blurMat) blurMat.dispose();
      if (domOverlay && domOverlay.parentNode) {
        domOverlay.parentNode.removeChild(domOverlay);
      }
    }
  };
}
