/**
 * build-clouds.js — Pembuatan gugus awan low-poly icosahedron
 * Sesuai spesifikasi TUGAS Bagian 5.6 dan 6.
 */

import {
  IcosahedronGeometry,
  MeshStandardMaterial,
  Mesh,
  Group,
  Vector3,
  Color
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Membangun 12 gugus awan low-poly di sekitar peta diorama.
 * @returns {{ grup: Group, daftarAwan: Array<Mesh> }}
 */
export function bangunGugusAwan() {
  const grupAwan = new Group();
  grupAwan.name = 'grup-awan';

  const daftarAwan = [];

  // Material awan putih doff flat shaded
  const matAwan = new MeshStandardMaterial({
    color: new Color('#FFFFFF'),
    roughness: 0.9,
    metalness: 0.0,
    flatShading: true,
    transparent: true,
    opacity: 0.92
  });

  // Konfigurasi 12 gugus awan deterministik melingkari peta
  const configGugus = [
    { sudut: 0.2, radius: 4.8, tinggi: 1.1, gumpal: 3, skala: 1.1 },
    { sudut: 0.7, radius: 5.6, tinggi: 1.4, gumpal: 4, skala: 1.3 },
    { sudut: 1.2, radius: 4.2, tinggi: 0.9, gumpal: 3, skala: 0.9 },
    { sudut: 1.8, radius: 5.2, tinggi: 1.6, gumpal: 4, skala: 1.2 },
    { sudut: 2.3, radius: 4.6, tinggi: 1.0, gumpal: 3, skala: 1.0 },
    { sudut: 2.8, radius: 5.4, tinggi: 1.3, gumpal: 4, skala: 1.1 },
    { sudut: 3.4, radius: 4.9, tinggi: 1.5, gumpal: 3, skala: 1.2 },
    { sudut: 3.9, radius: 5.7, tinggi: 1.1, gumpal: 4, skala: 1.4 },
    { sudut: 4.5, radius: 4.4, tinggi: 1.3, gumpal: 3, skala: 1.0 },
    { sudut: 5.0, radius: 5.3, tinggi: 1.7, gumpal: 4, skala: 1.3 },
    { sudut: 5.6, radius: 4.7, tinggi: 0.95, gumpal: 3, skala: 0.95 },
    { sudut: 6.1, radius: 5.5, tinggi: 1.4, gumpal: 4, skala: 1.15 }
  ];

  for (let i = 0; i < configGugus.length; i++) {
    const cfg = configGugus[i];
    const subGeomList = [];

    // Tiap gugus terdiri dari 3–4 bola icosahedron saling bertumpuk
    for (let j = 0; j < cfg.gumpal; j++) {
      const rBlob = (0.2 + (j % 2) * 0.08) * cfg.skala;
      const geoBlob = new IcosahedronGeometry(rBlob, 0);

      // Geser sedikit tiap gumpalan relatif terhadap pusat awan
      const offsetX = ((j - 1.2) * 0.22) * cfg.skala;
      const offsetY = ((j % 2) * 0.08) * cfg.skala;
      const offsetZ = (((j + 1) % 2) * 0.14) * cfg.skala;
      geoBlob.translate(offsetX, offsetY, offsetZ);

      subGeomList.push(geoBlob);
    }

    const geoGugus = mergeGeometries(subGeomList, false);
    const meshAwan = new Mesh(geoGugus, matAwan);
    meshAwan.name = `awan-${i}`;

    const x = Math.cos(cfg.sudut) * cfg.radius;
    const z = Math.sin(cfg.sudut) * cfg.radius;
    const y = cfg.tinggi;

    const pusatAsal = new Vector3(x, y, z);
    meshAwan.position.copy(pusatAsal);
    meshAwan.castShadow = true;

    // Vektor arah sebar radial
    const dirLontar = new Vector3(x, 0.4, z).normalize();

    meshAwan.userData = {
      pusatAsal: pusatAsal.clone(),
      dirLontar,
      distLontar: 3.5 + (i % 3) * 0.8,
      tinggiLontar: 0.8 + (i % 2) * 0.5,
      kecepatanIdle: 0.4 + (i % 3) * 0.2,
      faseIdle: cfg.sudut
    };

    daftarAwan.push(meshAwan);
    grupAwan.add(meshAwan);
  }

  return {
    grup: grupAwan,
    daftarAwan
  };
}
