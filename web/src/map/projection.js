/**
 * projection.js — Proyeksi Mercator d3-geo yang disesuaikan ke batas Indonesia
 * Sesuai WEB_SPEC.md Bagian 5.1.
 */

import { geoMercator, geoPath } from 'd3-geo';

export const UKURAN_PETA = {
  lebar: 1000,
  tinggi: 400,
  paddingX: 20,
  paddingY: 16
};

// Provinsi kecil atau kepulauan tersebar yang wajib mendapat lingkaran sentuh (hit-circle)
const KODE_PROVINSI_KECIL = new Set([
  '19', // Kepulauan Bangka Belitung
  '21', // Kepulauan Riau
  '31', // DKI Jakarta
  '34', // DI Yogyakarta
  '36', // Banten
  '51', // Bali
  '52', // Nusa Tenggara Barat
  '75'  // Gorontalo
]);

/**
 * Memastikan cincin poligon mengikuti konvensi bola d3-geo:
 * cincin luar searah jarum jam (signedArea < 0) dan lubang berlawanan arah (signedArea > 0).
 */
function hitungLuasBertanda(ring) {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return s / 2;
}

function normalisasiCincinPoligon(rings) {
  return rings.map((ring, idx) => {
    const a = hitungLuasBertanda(ring);
    if ((idx === 0 && a > 0) || (idx > 0 && a < 0)) {
      return [...ring].reverse();
    }
    return ring;
  });
}

function siapkanGeoJsonUntukD3(geojson) {
  const features = (geojson.features || []).map((f) => {
    const geom = f.geometry || {};
    let coordinates = geom.coordinates;
    if (geom.type === 'Polygon') {
      coordinates = normalisasiCincinPoligon(coordinates);
    } else if (geom.type === 'MultiPolygon') {
      coordinates = coordinates.map((poly) => normalisasiCincinPoligon(poly));
    }
    return {
      ...f,
      geometry: {
        ...geom,
        coordinates
      }
    };
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Membangun proyeksi Mercator dan path generator untuk GeoJSON 38 provinsi.
 * Juga menghitung koordinat pixel pusat [cx, cy] dan luas pixel tiap provinsi.
 *
 * @param {object} geojson - FeatureCollection 38 provinsi
 */
export function buatProyeksiIndonesia(geojson) {
  const { lebar, tinggi, paddingX, paddingY } = UKURAN_PETA;
  const geoBersih = siapkanGeoJsonUntukD3(geojson);

  const projection = geoMercator().fitExtent(
    [
      [paddingX, paddingY],
      [lebar - paddingX, tinggi - paddingY]
    ],
    geoBersih
  );

  const pathGen = geoPath(projection);

  // Urutkan fitur berdasarkan kode provinsi (11 s.d. 96) agar urutan tab DOM logis & deterministik
  const fiturTerurut = [...geoBersih.features].sort((a, b) =>
    String(a.properties?.kode || '').localeCompare(String(b.properties?.kode || ''))
  );

  const metaFitur = fiturTerurut.map((feature) => {
    const kode = String(feature.properties?.kode || '');
    const nama = String(feature.properties?.nama || '');
    const d = pathGen(feature) || '';
    const luasPx = pathGen.area(feature) || 0;

    // Gunakan koordinat pusat dari properties.pusat [lng, lat] jika ada, fallback ke pathGen.centroid
    let cx = lebar / 2;
    let cy = tinggi / 2;
    const pusatGeo = feature.properties?.pusat;
    if (Array.isArray(pusatGeo) && pusatGeo.length === 2) {
      const p = projection(pusatGeo);
      if (p && Number.isFinite(p[0]) && Number.isFinite(p[1])) {
        cx = p[0];
        cy = p[1];
      }
    } else {
      const c = pathGen.centroid(feature);
      if (c && Number.isFinite(c[0]) && Number.isFinite(c[1])) {
        cx = c[0];
        cy = c[1];
      }
    }

    const butuhHitCircle = luasPx < 550 || KODE_PROVINSI_KECIL.has(kode);

    return {
      kode,
      nama,
      feature,
      d,
      cx: Math.round(cx * 10) / 10,
      cy: Math.round(cy * 10) / 10,
      luasPx: Math.round(luasPx),
      butuhHitCircle
    };
  });

  return {
    lebar,
    tinggi,
    projection,
    pathGen,
    metaFitur
  };
}
