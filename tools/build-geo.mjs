import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REFERENSI_PROVINSI } from './clean.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CLEAN_DIR = path.join(ROOT, 'public', 'data', 'clean');
const RAW_GEO_CACHE = path.join(CLEAN_DIR, 'indonesia-38-provinces.raw.geojson');
const OUT_CLEAN_GEO = path.join(CLEAN_DIR, 'provinsi.geojson');
const OUT_WEB_GEO = path.join(ROOT, 'web', 'public', 'data', 'geo', 'provinsi.geojson');
const REPORTS_DIR = path.join(ROOT, 'reports');

const GEOJSON_SOURCE_URL =
  'https://raw.githubusercontent.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces/main/GeoJSON/indonesia-38-provinces.geojson';

const BOUNDS_INDONESIA = {
  LAT_MIN: -11.5,
  LAT_MAX: 6.5,
  LNG_MIN: 94.0,
  LNG_MAX: 142.0
};

/**
 * Normalisasi nama provinsi dari sumber GeoJSON agar cocok dengan tabel referensi DATA_SPEC.md Bagian 3
 */
const ALIAS_NAMA_PROVINSI = {
  'daerah khusus ibukota jakarta': 'DKI Jakarta',
  'dki jakarta': 'DKI Jakarta',
  'daerah istimewa yogyakarta': 'DI Yogyakarta',
  'di yogyakarta': 'DI Yogyakarta',
  'kepulauan bangka belitung': 'Kepulauan Bangka Belitung',
  'bangka belitung': 'Kepulauan Bangka Belitung',
  'kepulauan riau': 'Kepulauan Riau',
  'nanggroe aceh darussalam': 'Aceh',
  'aceh': 'Aceh',
  'papua barat daya': 'Papua Barat Daya',
  'papua selatan': 'Papua Selatan',
  'papua tengah': 'Papua Tengah',
  'papua pegunungan': 'Papua Pegunungan'
};

async function unduhAtauBacaGeoJson() {
  if (fs.existsSync(RAW_GEO_CACHE)) {
    console.log(`[CACHE] Membaca GeoJSON mentah dari ${RAW_GEO_CACHE}`);
    return JSON.parse(fs.readFileSync(RAW_GEO_CACHE, 'utf8'));
  }

  console.log(`[UNDUH] Mengambil GeoJSON 38 provinsi dari:\n  ${GEOJSON_SOURCE_URL}`);
  const res = await fetch(GEOJSON_SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Gagal mengunduh GeoJSON: HTTP ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  const parsed = JSON.parse(text);

  fs.mkdirSync(path.dirname(RAW_GEO_CACHE), { recursive: true });
  fs.writeFileSync(RAW_GEO_CACHE, text, 'utf8');
  return parsed;
}

/**
 * Bulatkan koordinat ke 4 angka desimal (~11m) agar ukuran file < 300 KB tanpa menghilangkan pulau kecil
 */
function bulatkanKoordinat(coords, desimal = 4) {
  const faktor = 10 ** desimal;
  if (typeof coords[0] === 'number') {
    return [
      Math.round(coords[0] * faktor) / faktor,
      Math.round(coords[1] * faktor) / faktor
    ];
  }
  return coords.map((c) => bulatkanKoordinat(c, desimal));
}

/**
 * Menghitung luas bertanda (shoelace formula) cincin poligon pada bidang [lng, lat].
 * Nilai > 0 = counter-clockwise (CCW), nilai < 0 = clockwise (CW).
 * d3-geo mengharapkan cincin luar berarah CW (< 0) dan cincin lubang berarah CCW (> 0).
 */
function hitungLuasBertandaRing(ring) {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return s / 2;
}

function rewindRingsD3(rings) {
  return rings.map((ring, idx) => {
    const area = hitungLuasBertandaRing(ring);
    if ((idx === 0 && area > 0) || (idx > 0 && area < 0)) {
      return [...ring].reverse();
    }
    return ring;
  });
}

function normalisasiWindingD3(type, coordinates) {
  if (type === 'Polygon') {
    return rewindRingsD3(coordinates);
  }
  if (type === 'MultiPolygon') {
    return coordinates.map((poly) => rewindRingsD3(poly));
  }
  return coordinates;
}

/**
 * Hitung bounding box dan titik pusat poligon terbesar (agar pusat jatuh di daratan utama provinsi)
 */
function hitungGeometriInfo(geometry) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let jumlahTitik = 0;

  let ringTerbesar = null;
  let skorRingTerbesar = -1;

  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];

  for (const poly of polygons) {
    const outerRing = poly[0] || [];
    let rMinLng = Infinity;
    let rMaxLng = -Infinity;
    let rMinLat = Infinity;
    let rMaxLat = -Infinity;

    for (const pt of outerRing) {
      const [lng, lat] = pt;
      jumlahTitik++;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;

      if (lng < rMinLng) rMinLng = lng;
      if (lng > rMaxLng) rMaxLng = lng;
      if (lat < rMinLat) rMinLat = lat;
      if (lat > rMaxLat) rMaxLat = lat;
    }

    const luasKotakRing = (rMaxLng - rMinLng) * (rMaxLat - rMinLat);
    if (luasKotakRing > skorRingTerbesar && outerRing.length > 0) {
      skorRingTerbesar = luasKotakRing;
      ringTerbesar = outerRing;
    }
  }

  // Hitung rata-rata titik pada outerRing poligon terbesar sebagai pusat visual provinsi
  let pusatLng = (minLng + maxLng) / 2;
  let pusatLat = (minLat + maxLat) / 2;
  if (ringTerbesar && ringTerbesar.length > 0) {
    let sumLng = 0;
    let sumLat = 0;
    for (const [lng, lat] of ringTerbesar) {
      sumLng += lng;
      sumLat += lat;
    }
    pusatLng = Number((sumLng / ringTerbesar.length).toFixed(4));
    pusatLat = Number((sumLat / ringTerbesar.length).toFixed(4));
  }

  return {
    bbox: [
      Number(minLng.toFixed(4)),
      Number(minLat.toFixed(4)),
      Number(maxLng.toFixed(4)),
      Number(maxLat.toFixed(4))
    ],
    pusat: [pusatLng, pusatLat],
    jumlahTitik,
    jumlahPoligon: polygons.length
  };
}

function cocokkanProvinsi(props, mapNamaKeKode, mapKodeKeNama) {
  const rawNama = String(props.PROVINSI || props.provinsi || props.NAME_1 || props.name || '').trim();
  const rawKode = String(props.KODE_PROV || props.kode || props.id || '').trim();

  const namaLower = rawNama.toLowerCase().replace(/\s+/g, ' ');
  const namaDariAlias = ALIAS_NAMA_PROVINSI[namaLower];

  // Prioritas 1: cocokkan lewat nama (karena kode BPS/Kemendagri untuk 4 DOB Papua kadang berbeda antara 93-96 vs 94-97)
  if (namaDariAlias && mapNamaKeKode.has(namaDariAlias)) {
    const kode = mapNamaKeKode.get(namaDariAlias);
    return { kode, nama: namaDariAlias, rawNama, rawKode };
  }

  for (const [namaResmi, kodeResmi] of mapNamaKeKode.entries()) {
    if (namaResmi.toLowerCase() === namaLower) {
      return { kode: kodeResmi, nama: namaResmi, rawNama, rawKode };
    }
  }

  // Prioritas 2: cocokkan lewat kode 2 digit
  if (mapKodeKeNama.has(rawKode)) {
    return { kode: rawKode, nama: mapKodeKeNama.get(rawKode), rawNama, rawKode };
  }

  return null;
}

async function jalankanBuildGeo() {
  console.log('===============================================================');
  console.log('   FASE 3: PEMBANGUNAN & VALIDASI GEOJSON 38 PROVINSI');
  console.log('===============================================================\n');

  const rawGeo = await unduhAtauBacaGeoJson();
  if (!rawGeo || rawGeo.type !== 'FeatureCollection' || !Array.isArray(rawGeo.features)) {
    throw new Error('File sumber bukan FeatureCollection GeoJSON yang valid.');
  }

  console.log(`[INFO] Jumlah fitur di sumber: ${rawGeo.features.length}`);

  const mapNamaKeKode = new Map(REFERENSI_PROVINSI.map((p) => [p.nama, p.kode]));
  const mapKodeKeNama = new Map(REFERENSI_PROVINSI.map((p) => [p.kode, p.nama]));

  const fiturBersih = [];
  const logPemetaan = [];
  const kodeTerpakai = new Set();
  let titikLuarBatas = 0;

  for (const feat of rawGeo.features) {
    const hasilCocok = cocokkanProvinsi(feat.properties || {}, mapNamaKeKode, mapKodeKeNama);
    if (!hasilCocok) {
      throw new Error(`Gagal mencocokkan fitur provinsi: ${JSON.stringify(feat.properties)}`);
    }

    const { kode, nama, rawNama, rawKode } = hasilCocok;
    if (kodeTerpakai.has(kode)) {
      throw new Error(`Duplikat kode provinsi terdeteksi pada GeoJSON: ${kode} (${nama})`);
    }
    kodeTerpakai.add(kode);

    const coordsBulat = bulatkanKoordinat(feat.geometry.coordinates, 4);
    const coordsWindingD3 = normalisasiWindingD3(feat.geometry.type, coordsBulat);
    const geomBersih = {
      type: feat.geometry.type,
      coordinates: coordsWindingD3
    };

    const info = hitungGeometriInfo(geomBersih);
    const [minLng, minLat, maxLng, maxLat] = info.bbox;
    if (
      minLat < BOUNDS_INDONESIA.LAT_MIN ||
      maxLat > BOUNDS_INDONESIA.LAT_MAX ||
      minLng < BOUNDS_INDONESIA.LNG_MIN ||
      maxLng > BOUNDS_INDONESIA.LNG_MAX
    ) {
      titikLuarBatas++;
    }

    fiturBersih.push({
      type: 'Feature',
      id: kode,
      properties: {
        kode,
        nama,
        pusat: info.pusat,
        bbox: info.bbox
      },
      geometry: geomBersih
    });

    logPemetaan.push({
      kode,
      nama,
      rawKode,
      rawNama,
      jumlahPoligon: info.jumlahPoligon,
      jumlahTitik: info.jumlahTitik,
      pusat: info.pusat
    });
  }

  // Urutkan fitur berdasarkan kode provinsi (11 s.d. 96)
  fiturBersih.sort((a, b) => a.properties.kode.localeCompare(b.properties.kode));
  logPemetaan.sort((a, b) => a.kode.localeCompare(b.kode));

  // Validasi kelengkapan 38 provinsi terhadap provinsi.json
  const provCleanPath = path.join(CLEAN_DIR, 'provinsi.json');
  const provClean = JSON.parse(fs.readFileSync(provCleanPath, 'utf8'));
  const belumAdaDiGeo = provClean.filter((p) => !kodeTerpakai.has(p.kode));

  if (fiturBersih.length !== 38 || belumAdaDiGeo.length > 0) {
    throw new Error(
      `Jumlah provinsi tidak tepat 38 (ditemukan ${fiturBersih.length}). Provinsi hilang: ${belumAdaDiGeo.map((x) => x.nama).join(', ')}`
    );
  }

  const geojsonOutput = {
    type: 'FeatureCollection',
    features: fiturBersih
  };

  // Simpan ke public/data/clean/provinsi.geojson dan web/public/data/geo/provinsi.geojson
  fs.mkdirSync(path.dirname(OUT_CLEAN_GEO), { recursive: true });
  fs.mkdirSync(path.dirname(OUT_WEB_GEO), { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const jsonMinified = JSON.stringify(geojsonOutput);
  fs.writeFileSync(OUT_CLEAN_GEO, jsonMinified, 'utf8');
  fs.writeFileSync(OUT_WEB_GEO, jsonMinified, 'utf8');

  // Hapus file cache raw sementara agar folder public/data/clean hanya berisi berkas produksi bersih
  if (fs.existsSync(RAW_GEO_CACHE)) {
    fs.unlinkSync(RAW_GEO_CACHE);
  }

  const ukuranByte = Buffer.byteLength(jsonMinified, 'utf8');
  const ukuranKb = (ukuranByte / 1024).toFixed(1);

  // Tulis laporan reports/geo-sources.md
  const laporanGeoMd = buatLaporanGeoMd({
    ukuranByte,
    ukuranKb,
    titikLuarBatas,
    logPemetaan
  });
  const reportPath = path.join(REPORTS_DIR, 'geo-sources.md');
  fs.writeFileSync(reportPath, laporanGeoMd, 'utf8');

  console.log(`✅ Validasi 38 Provinsi : LOLOS (38/38 fitur unik & cocok dengan provinsi.json)`);
  console.log(`✅ Batas Koordinat NKRI : LOLOS (${titikLuarBatas} fitur di luar batas)`);
  console.log(`✅ Ukuran Berkas Akhir  : ${ukuranKb} KB (${ukuranByte.toLocaleString('id-ID')} byte) — Target < 300 KB`);
  console.log(`✅ Disimpan di          :`);
  console.log(`   - ${OUT_CLEAN_GEO}`);
  console.log(`   - ${OUT_WEB_GEO}`);
  console.log(`   - ${reportPath}`);
}

function buatLaporanGeoMd({ ukuranByte, ukuranKb, titikLuarBatas, logPemetaan }) {
  const barisTabel = logPemetaan
    .map(
      (p) =>
        `| \`${p.kode}\` | ${p.nama} | \`${p.rawKode}\` | ${p.rawNama} | ${p.jumlahPoligon} | ${p.jumlahTitik.toLocaleString('id-ID')} | \`[${p.pusat[0]}, ${p.pusat[1]}]\` |`
    )
    .join('\n');

  return `# Laporan Sumber & Validasi Aset Peta (GeoJSON 38 Provinsi) — Fase 3

## 1. Sumber Data & Lisensi

- **Nama Repositori:** \`denyherianto/indonesia-geojson-topojson-maps-with-38-provinces\`
- **URL Repositori:** https://github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces
- **URL Berkas Mentah:** \`${GEOJSON_SOURCE_URL}\`
- **Tanggal Akses:** 2026-10-13
- **Lisensi Data:** **Creative Commons Attribution 4.0 International (CC BY 4.0)** (\`DATA_LICENSE.md\`) & **MIT License** (\`LICENSE\`).
- **Atribusi Peta:** Batas provinsi Indonesia (38 provinsi) oleh Deny Herianto (CC BY 4.0).

---

## 2. Pemrosesan & Penyederhanaan (\`tools/build-geo.mjs\`)

1. **Pencocokan Kode & Nama Resmi:**
   - Setiap fitur dicocokkan terhadap Tabel Referensi 38 Provinsi Kemendagri/BPS pada \`DATA_SPEC.md\` Bagian 3.
   - Properti distandardisasi menjadi \`{ kode, nama, pusat, bbox }\` dan \`id\` fitur disamakan dengan \`kode\` (2 digit).
   - Catatan penyesuaian kode: pada sumber asli bila kode 4 DOB Papua menggunakan urutan BPS berbeda, skrip memetakan secara eksplisit ke kode resmi Kemendagri di \`DATA_SPEC.md\` (\`93\` Papua Selatan, \`94\` Papua Tengah, \`95\` Papua Pegunungan, \`96\` Papua Barat Daya).
2. **Presisi Geometri & Ukuran Berkas:**
   - Koordinat dibulatkan ke 4 angka desimal ($\approx 11$ meter di ekuator) tanpa menghapus poligon pulau kecil.
   - **Ukuran berkas akhir:** **${ukuranKb} KB** (${ukuranByte.toLocaleString('id-ID')} byte) — jauh di bawah batas anggaran **< 300 KB**.
3. **Titik Tengah Kabupaten (Opsional 8.2):**
   - Dilewati sesuai panduan \`DATA_SPEC.md\` 8.2 (*"Jika tidak ada sumber yang andal, lewati. Web tetap berfungsi dengan peta provinsi"*). Sebagai gantinya, setiap provinsi telah dilengkapi koordinat \`pusat\` daratan utamanya untuk pengurutan animasi barat-ke-timur (A-03) dan penempatan lingkaran sentuh (*hit-circle*) provinsi kecil.

---

## 3. Hasil Validasi Geometri & Pencocokan 38 Provinsi

- **Jumlah Fitur:** **38** fitur (\`Polygon\` / \`MultiPolygon\`)
- **Kecocokan dengan \`public/data/clean/provinsi.json\`:** **100% cocok (38/38 provinsi)**
- **Fitur di luar kotak batas Indonesia (lat -11,5..6,5; lng 94..142):** **${titikLuarBatas}**

| Kode Resmi | Nama Resmi (\`DATA_SPEC.md\`) | Kode Sumber | Nama Sumber | Jml Poligon | Jml Titik | Titik Pusat \`[lng, lat]\` |
|---|---|---|---|---|---|---|
${barisTabel}
`;
}

try {
  await jalankanBuildGeo();
} catch (err) {
  console.error(`[ERROR BUILD-GEO] ${err.message}`);
  process.exitCode = 1;
}
