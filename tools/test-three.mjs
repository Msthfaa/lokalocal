import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from '../web/node_modules/three/build/three.module.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Mock browser globals for node testing
const dummyEl = {
  style: {},
  appendChild: () => {},
  removeChild: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  setAttribute: () => {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {} }
};

globalThis.document = {
  createElement: (tag) => {
    return {
      width: 1024,
      height: 1024,
      getContext: () => ({
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
        fillRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        ellipse: () => {},
        drawImage: () => {}
      }),
      style: {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      setAttribute: () => {},
      appendChild: () => {},
      removeChild: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    };
  },
  body: dummyEl,
  addEventListener: () => {},
  removeEventListener: () => {}
};

globalThis.window = {
  innerWidth: 1440,
  innerHeight: 900,
  devicePixelRatio: 1,
  addEventListener: () => {},
  removeEventListener: () => {}
};

async function test() {
  try {
    const geoRaw = fs.readFileSync(path.join(ROOT, 'web', 'public', 'data', 'geo', 'provinsi.geojson'), 'utf8');
    const geoProvinsi = JSON.parse(geoRaw);

    const provRaw = fs.readFileSync(path.join(ROOT, 'web', 'public', 'data', 'provinsi.json'), 'utf8');
    const daftarProvinsi = JSON.parse(provRaw);

    const { buatProyeksiIndonesia } = await import('../web/src/map/projection.js');
    const proyeksi = buatProyeksiIndonesia(geoProvinsi);

    const { bangunAdeganDiorama } = await import('../web/src/sections/hero3d/build-scene.js');

    console.log('Building diorama scene...');
    const adegan = bangunAdeganDiorama({
      geoProvinsi,
      daftarProvinsi,
      proyeksi,
      modeWarna: 'natural',
      aktifkanBayangan: true
    });

    const camera = new THREE.PerspectiveCamera(34, 1.6, 0.1, 50);

    const { buatPengelolaModeDetail } = await import('../web/src/sections/hero3d/mode-detail.js');
    console.log('Building mode detail...');
    const pengelolaDetail = buatPengelolaModeDetail({
      scene: adegan.scene,
      grupUtama: adegan.grupUtama,
      camera,
      elemenAdegan: adegan,
      daftarProvinsi,
      wadahEl: dummyEl
    });
    console.log('Mode detail created OK!');

    // Mock renderer
    const renderer = {
      domElement: { width: 1440, height: 900 },
      setRenderTarget: () => {},
      render: () => {},
      clearDepth: () => {}
    };

    console.log('Testing renderKhusus normal mode...');
    pengelolaDetail.renderKhusus(renderer, adegan.scene, camera);
    console.log('renderKhusus normal OK!');

    console.log('Testing buka detail on province 14 (Riau)...');
    const riauMesh = adegan.daftarProvinsiMesh.find(m => String(m.userData.kode) === '14');
    const riauData = daftarProvinsi.find(p => String(p.kode) === '14');
    pengelolaDetail.buka(riauData, riauMesh);
    console.log('buka OK! state =', pengelolaDetail.getState());

    console.log('Testing renderKhusus in detail mode...');
    pengelolaDetail.renderKhusus(renderer, adegan.scene, camera);
    console.log('renderKhusus detail OK!');

  } catch (err) {
    console.error('TEST ERROR:', err);
  }
}

test();
