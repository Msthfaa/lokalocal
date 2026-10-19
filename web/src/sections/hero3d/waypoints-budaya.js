/**
 * waypoints-budaya.js — Titik Penanda Budaya 3D Interaktif Nusantara
 * Muncul secara adaptif saat pengguna melakukan ZOOM IN (zoomLevel > 1.05)
 * Menampilkan pin mengambang dengan ikon/chibi budaya daerah yang melayang lembut,
 * dapat disorot (hover) dan diklik untuk membuka khasanah budaya daerah terkait.
 */

import {
  Group,
  Mesh,
  CylinderGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  Vector3,
  CanvasTexture,
  Sprite,
  SpriteMaterial,
  Color,
  Raycaster
} from 'three';
import gsap from 'gsap';

// Daftar 8 Waypoint Budaya Ikonik Mewakili Kepulauan Nusantara
export const DAFTAR_WAYPOINT = [
  {
    id: 'wp-sumbar',
    kodeProv: '13',
    nama: 'Rumah Gadang',
    sub: 'Minangkabau, Sumatera Barat',
    ikon: '🏛️',
    chibiId: 'minang',
    offset: new Vector3(-0.05, 0.22, 0.02)
  },
  {
    id: 'wp-aceh',
    kodeProv: '11',
    nama: 'Tari Saman',
    sub: 'Gayo, Aceh',
    ikon: '🪕',
    chibiId: 'aceh',
    offset: new Vector3(0.02, 0.22, -0.04)
  },
  {
    id: 'wp-sumut',
    kodeProv: '12',
    nama: 'Kain Ulos & Toba',
    sub: 'Batak, Sumatera Utara',
    ikon: '🧶',
    chibiId: 'batak',
    offset: new Vector3(0.02, 0.22, 0.02)
  },
  {
    id: 'wp-jateng',
    kodeProv: '33',
    nama: 'Candi Borobudur',
    sub: 'Mahakarya Jawa Tengah',
    ikon: '🛕',
    chibiId: 'jawa',
    offset: new Vector3(-0.02, 0.22, 0.02)
  },
  {
    id: 'wp-jatim',
    kodeProv: '35',
    nama: 'Reog Ponorogo',
    sub: 'Tradisi Seni Jawa Timur',
    ikon: '🎭',
    chibiId: 'jawa',
    offset: new Vector3(0.05, 0.22, 0.02)
  },
  {
    id: 'wp-bali',
    kodeProv: '51',
    nama: 'Pura & Tari Kecak',
    sub: 'Pulau Dewata, Bali',
    ikon: '🌺',
    chibiId: 'bali_wanita',
    offset: new Vector3(0.0, 0.22, 0.02)
  },
  {
    id: 'wp-sulsel',
    kodeProv: '73',
    nama: 'Tongkonan & Pinisi',
    sub: 'Toraja & Bugis, Sulsel',
    ikon: '⛵',
    chibiId: 'bugis',
    offset: new Vector3(0.0, 0.22, 0.02)
  },
  {
    id: 'wp-papua',
    kodeProv: '91',
    nama: 'Noken & Honai',
    sub: 'Bumi Cendrawasih, Papua',
    ikon: '🪵',
    chibiId: 'papua',
    offset: new Vector3(-0.04, 0.22, 0.02)
  }
];

/**
 * Menghasilkan tekstur canvas circular badge untuk waypoint 3D
 * @param {object} wp
 * @returns {THREE.CanvasTexture}
 */
function buatTeksturBadgeWaypoint(wp) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Lingkaran luar emas bercahaya
    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(28, 22, 17, 0.88)';
    ctx.fill();

    ctx.lineWidth = 10;
    ctx.strokeStyle = '#FFBE3B';
    ctx.stroke();

    // Lingkaran dalam emas tipis
    ctx.beginPath();
    ctx.arc(128, 128, 102, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.6)';
    ctx.stroke();

    // Emoji / Ikon Budaya Besar di Tengah
    ctx.font = '76px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(wp.ikon, 128, 128);
  }

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Membuat pengelola waypoints budaya 3D interaktif yang terhubung ke adegan Three.js
 *
 * @param {object} parameter
 * @param {THREE.Group} parameter.grupUtama - Grup dunia diorama
 * @param {Array<THREE.Mesh>} parameter.daftarProvinsiMesh - 38 mesh keping provinsi
 * @param {(kode: string, wp: object) => void} [parameter.saatKlikWaypoint]
 * @returns {object} API kontrol waypoints
 */
export function buatPengelolaWaypoints({
  grupUtama,
  daftarProvinsiMesh = [],
  saatKlikWaypoint
}) {
  const grupWaypoints = new Group();
  grupWaypoints.name = 'grup-waypoints-budaya-3d';
  grupWaypoints.visible = false;
  grupUtama.add(grupWaypoints);

  const daftarObjekWaypoint = [];
  const petaMeshProv = new Map(
    daftarProvinsiMesh.map((m) => [String(m.userData.kode).padStart(2, '0'), m])
  );

  // Material riak dasar emas
  const riakMat = new MeshStandardMaterial({
    color: 0xffc94a,
    emissive: 0xffa826,
    emissiveIntensity: 0.6,
    roughness: 0.25,
    metalness: 0.8,
    transparent: true,
    opacity: 0.85
  });

  // Material tiang jarum emas
  const tiangMat = new MeshStandardMaterial({
    color: 0xe8ba4d,
    roughness: 0.25,
    metalness: 0.85
  });

  // Bangun setiap waypoint 3D
  DAFTAR_WAYPOINT.forEach((wp, idx) => {
    const meshProv = petaMeshProv.get(String(wp.kodeProv).padStart(2, '0'));
    if (!meshProv) return;

    const u = meshProv.userData;
    const titikUtama = u.titikDaratanUtama || u.pusatAsal;
    if (!titikUtama) return;

    const grupItem = new Group();
    grupItem.name = `waypoint-${wp.id}`;
    grupItem.position.set(
      titikUtama.x + (wp.offset?.x || 0),
      titikUtama.y + 0.015,
      titikUtama.z + (wp.offset?.z || 0)
    );

    // 1. Cincin Riak Emas di Permukaan Daratan
    const riakGeo = new TorusGeometry(0.08, 0.007, 8, 20);
    riakGeo.rotateX(Math.PI / 2);
    const riakMesh = new Mesh(riakGeo, riakMat);
    riakMesh.position.y = 0.005;
    grupItem.add(riakMesh);

    // 2. Jarum Tiang Emas Ramping
    const tiangGeo = new CylinderGeometry(0.008, 0.012, 0.24, 10);
    const tiangMesh = new Mesh(tiangGeo, tiangMat);
    tiangMesh.position.y = 0.12;
    grupItem.add(tiangMesh);

    // 3. Sprite Badge Mengambang
    const mapBadge = buatTeksturBadgeWaypoint(wp);
    const spriteMat = new SpriteMaterial({
      map: mapBadge,
      transparent: true,
      opacity: 0.96,
      depthTest: true
    });
    const spriteBadge = new Sprite(spriteMat);
    spriteBadge.position.y = 0.28;
    spriteBadge.scale.set(0.24, 0.24, 1);
    grupItem.add(spriteBadge);

    // Simpan metadata interaksi
    grupItem.userData = {
      wp,
      meshProv,
      spriteBadge,
      riakMesh,
      posisiYAsal: grupItem.position.y,
      skalaTarget: 0,
      skalaKini: 0,
      isHovered: false
    };

    grupWaypoints.add(grupItem);
    daftarObjekWaypoint.push(grupItem);
  });

  let skalaGlobalZoom = 0;

  /**
   * Memperbarui visibilitas, skala dinamis, dan animasi bobbing setiap frame
   * @param {number} zoomLevel - Rentang 0.70 s.d. 2.0
   * @param {number} tDetik
   */
  function update(zoomLevel, tDetik) {
    // Hanya aktif saat pengguna melakukan ZOOM IN (zoomLevel > 1.08)
    const ambangMulai = 1.08;
    const ambangPenuh = 1.38;

    if (zoomLevel <= ambangMulai) {
      skalaGlobalZoom = 0;
      grupWaypoints.visible = false;
      return;
    }

    grupWaypoints.visible = true;
    const progres = Math.min(1.0, (zoomLevel - ambangMulai) / (ambangPenuh - ambangMulai));
    skalaGlobalZoom = progres;

    daftarObjekWaypoint.forEach((gItem, idx) => {
      const u = gItem.userData;
      // Sinkronkan posisi Y dengan elevasi keping pulau yang mungkin sedang terangkat
      if (u.meshProv) {
        gItem.position.y = u.meshProv.position.y + 0.015;
      }

      // Animasi bobbing naik-turun lembut (floating idle)
      const bobbing = Math.sin(tDetik * 2.4 + idx * 0.8) * 0.018;
      if (u.spriteBadge) {
        u.spriteBadge.position.y = 0.28 + bobbing;
      }

      // Riak dasar berdenyut perlahan
      if (u.riakMesh) {
        const denyutRiak = 1.0 + Math.sin(tDetik * 3.0 + idx) * 0.15;
        u.riakMesh.scale.set(denyutRiak, denyutRiak, denyutRiak);
      }

      // Interpolasi skala membal halus saat zoom in
      const hoverMult = u.isHovered ? 1.35 : 1.0;
      const targetS = skalaGlobalZoom * hoverMult;
      u.skalaKini += (targetS - u.skalaKini) * 0.14;
      gItem.scale.setScalar(u.skalaKini);
    });
  }

  /**
   * Memeriksa raycast klik pada waypoint
   * @param {THREE.Raycaster} raycaster
   * @returns {boolean} true jika mengenai salah satu waypoint
   */
  function tanganiKlik(raycaster) {
    if (skalaGlobalZoom < 0.25) return false;

    const daftarSprite = daftarObjekWaypoint.map((g) => g.userData.spriteBadge);
    const intersects = raycaster.intersectObjects(daftarSprite, false);

    if (intersects.length > 0) {
      const spriteTerpilih = intersects[0].object;
      const induk = spriteTerpilih.parent;
      if (induk && induk.userData?.wp) {
        const wp = induk.userData.wp;
        // Animasi membal saat diklik
        gsap.fromTo(
          induk.scale,
          { x: 1.4, y: 1.4, z: 1.4 },
          { x: 1.0, y: 1.0, z: 1.0, duration: 0.35, ease: 'back.out(2.5)' }
        );

        if (typeof saatKlikWaypoint === 'function') {
          saatKlikWaypoint(wp.kodeProv, wp);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Memeriksa raycast hover pada waypoint
   * @param {THREE.Raycaster} raycaster
   * @returns {object|null} waypoint yang di-hover jika ada
   */
  function tanganiHover(raycaster) {
    if (skalaGlobalZoom < 0.25) return null;

    const daftarSprite = daftarObjekWaypoint.map((g) => g.userData.spriteBadge);
    const intersects = raycaster.intersectObjects(daftarSprite, false);

    let wpAktif = null;
    daftarObjekWaypoint.forEach((g) => {
      g.userData.isHovered = false;
    });

    if (intersects.length > 0) {
      const spriteTerpilih = intersects[0].object;
      const induk = spriteTerpilih.parent;
      if (induk && induk.userData?.wp) {
        induk.userData.isHovered = true;
        wpAktif = induk.userData.wp;
      }
    }
    return wpAktif;
  }

  return {
    grup: grupWaypoints,
    update,
    tanganiKlik,
    tanganiHover
  };
}
