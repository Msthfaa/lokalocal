import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REFERENSI_PROVINSI, DAFTAR_SINGKATAN } from './clean.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'public', 'data');
const CLEAN_DIR = path.join(RAW_DIR, 'clean');

const BERKAS_WAJIB = [
  'budaya.clean.json',
  'provinsi.json',
  'statistik.json',
  'kabupaten.json',
  'index-pencarian.json',
  'meta.clean.json'
];

function jalankanValidasi() {
  console.log('===============================================================');
  console.log('   VALIDASI DATA BERSIH — ATLAS BUDAYA (DATA_SPEC.md Bag. 7)');
  console.log('===============================================================\n');

  const hasil = [];
  let jumlahError = 0;
  let jumlahWarn = 0;

  function catat(id, level, lulus, pesan, detail = null) {
    hasil.push({ id, level, lulus, pesan, detail });
    if (!lulus && level === 'error') {
      jumlahError++;
      console.log(`❌ [${id}] ERROR : ${pesan}`);
    } else if (level === 'warn') {
      jumlahWarn++;
      console.log(`⚠️  [${id}] WARN  : ${pesan}`);
    } else {
      console.log(`✅ [${id}] OK    : ${pesan}`);
    }
    if (detail) {
      console.log(`   ↳ ${detail}`);
    }
  }

  // V-01: Semua file keluaran ada dan berupa JSON valid
  const dataClean = {};
  const errorV01 = [];
  for (const nama of BERKAS_WAJIB) {
    const p = path.join(CLEAN_DIR, nama);
    if (!fs.existsSync(p)) {
      errorV01.push(`Tidak ditemukan: ${nama}`);
      continue;
    }
    try {
      dataClean[nama] = JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (err) {
      errorV01.push(`JSON tidak valid pada ${nama}: ${err.message}`);
    }
  }

  catat(
    'V-01',
    'error',
    errorV01.length === 0,
    errorV01.length === 0
      ? `Keenam berkas keluaran di public/data/clean/ tersedia dan berupa JSON valid.`
      : `Masalah pada berkas keluaran: ${errorV01.join('; ')}`
  );

  if (errorV01.length > 0) {
    process.exitCode = 1;
    return;
  }

  const budaya = dataClean['budaya.clean.json'];
  const provinsi = dataClean['provinsi.json'];
  const statistik = dataClean['statistik.json'];
  const metaClean = dataClean['meta.clean.json'];
  const rawProvSummary = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'provinsi-summary.json'), 'utf8'));

  // V-02: budaya.clean.json semua id unik dan slug unik
  const setId = new Set();
  const setSlug = new Set();
  const dupId = [];
  const dupSlug = [];

  for (const r of budaya) {
    if (!r.id || setId.has(r.id)) dupId.push(r.id);
    setId.add(r.id);
    if (!r.slug || setSlug.has(r.slug)) dupSlug.push(r.slug);
    setSlug.add(r.slug);
  }

  catat(
    'V-02',
    'error',
    dupId.length === 0 && dupSlug.length === 0,
    dupId.length === 0 && dupSlug.length === 0
      ? `Semua ${budaya.length} rekaman memiliki id dan slug yang 100% unik.`
      : `Ditemukan duplikat id (${dupId.length}) atau slug (${dupSlug.length}).`
  );

  // V-03: Tidak ada rekaman tanpa kode_provinsi yang valid
  const setKodeValid = new Set(REFERENSI_PROVINSI.map((p) => p.kode));
  const rekamanKodeInvalid = budaya.filter((r) => !r.kode_provinsi || !setKodeValid.has(r.kode_provinsi));

  catat(
    'V-03',
    'error',
    rekamanKodeInvalid.length === 0,
    rekamanKodeInvalid.length === 0
      ? `Seluruh rekaman memiliki kode_provinsi 2 digit yang valid sesuai referensi 38 provinsi.`
      : `Terdapat ${rekamanKodeInvalid.length} rekaman dengan kode_provinsi tidak valid.`
  );

  // V-04: Untuk tiap provinsi, total di provinsi.json = jumlah rekaman bersih provinsi itu sebelum C-07 minus duplikat murni
  const mapSummaryAsli = new Map((rawProvSummary.provinsi || []).map((p) => [p.provinsi, p.total_budaya]));
  const errorV04 = [];
  const selisihC06 = [];

  for (const p of provinsi) {
    const rekProv = budaya.filter((r) => r.kode_provinsi === p.kode);
    // Jumlah rekaman sebelum penggabungan C-07 adalah total dari id_anggota tiap entri di provinsi tersebut
    const hitungSebelumC07 = rekProv.reduce((acc, r) => acc + (Array.isArray(r.id_anggota) ? r.id_anggota.length : 1), 0);
    if (p.total !== hitungSebelumC07) {
      errorV04.push(`${p.nama}: provinsi.json total (${p.total}) != hitungan sebelum C-07 (${hitungSebelumC07})`);
    }
    const totalSummary = mapSummaryAsli.get(p.nama) ?? 0;
    if (p.total !== totalSummary) {
      selisihC06.push(`${p.nama} (${totalSummary} -> ${p.total})`);
    }
  }

  const totalSelisihC06 = Array.from(mapSummaryAsli.values()).reduce((a, b) => a + b, 0) - provinsi.reduce((a, b) => a + b.total, 0);
  const sesuaiDedup = totalSelisihC06 === (metaClean.hitungan_pembersihan?.duplikat_murni_dibuang || 0);

  catat(
    'V-04',
    'error',
    errorV04.length === 0 && sesuaiDedup,
    errorV04.length === 0 && sesuaiDedup
      ? `Total per provinsi konsisten dengan rekaman sebelum C-07 minus ${totalSelisihC06} duplikat murni C-06.`
      : `Ketidaksesuaian V-04: ${errorV04.join('; ')}`,
    selisihC06.length > 0 ? `Selisih akibat dedup murni C-06: ${selisihC06.join(', ')}` : null
  );

  // V-05: provinsi.json berisi tepat 38 provinsi, kode unik, urut
  const kodeProvList = provinsi.map((p) => p.kode);
  const kodeProvUnik = new Set(kodeProvList);
  const apakahUrut = kodeProvList.every((k, i) => i === 0 || kodeProvList[i - 1].localeCompare(k) < 0);

  catat(
    'V-05',
    'error',
    provinsi.length === 38 && kodeProvUnik.size === 38 && apakahUrut,
    provinsi.length === 38 && kodeProvUnik.size === 38 && apakahUrut
      ? `provinsi.json berisi tepat 38 provinsi dengan kode unik dan terurut naik.`
      : `provinsi.json bermasalah: panjang=${provinsi.length}, unik=${kodeProvUnik.size}, urut=${apakahUrut}`
  );

  // V-06: Tidak ada field gambar pada keluaran
  const adaGambar = budaya.some((r) => 'gambar' in r);
  catat(
    'V-06',
    'error',
    !adaGambar,
    !adaGambar
      ? `Tidak ada field 'gambar' pada budaya.clean.json.`
      : `Masih ditemukan field 'gambar' pada budaya.clean.json.`
  );

  // V-07: Tidak ada nama atau kontak pribadi SDM pada keluaran
  const adaKategoriSdm = budaya.some(
    (r) =>
      String(r.kategori).toLowerCase().includes('sdm') ||
      String(r.kategori_kode).toLowerCase() === 'tb' ||
      'telepon' in r ||
      'email' in r ||
      'nik' in r
  );
  catat(
    'V-07',
    'error',
    !adaKategoriSdm,
    !adaKategoriSdm
      ? `Privasi terjaga: tidak ada rekaman individu atau kontak pribadi SDM pada keluaran.`
      : `Ditemukan data individu SDM pada keluaran!`
  );

  // V-08: ringkasan <= 241 karakter dan tidak berakhir di tengah singkatan
  const errorV08 = [];
  for (const r of budaya) {
    if (r.ringkasan === null) continue;
    if (typeof r.ringkasan !== 'string' || r.ringkasan.length > 241) {
      errorV08.push(`${r.id} (${r.nama_tampil}): panjang ringkasan ${r.ringkasan?.length}`);
      continue;
    }
    const matchAkhir = r.ringkasan.trim().match(/(?:^|\s)([A-Za-z0-9]+)\.$/);
    if (matchAkhir) {
      const kataAkhir = matchAkhir[1].toLowerCase();
      if (DAFTAR_SINGKATAN.has(kataAkhir) || (kataAkhir.length === 1 && /[a-z]/i.test(kataAkhir))) {
        errorV08.push(`${r.id} (${r.nama_tampil}): berakhir pada singkatan "${matchAkhir[1]}."`);
      }
    }
  }

  catat(
    'V-08',
    'error',
    errorV08.length === 0,
    errorV08.length === 0
      ? `Semua ringkasan <= 241 karakter dan bebas dari pemotongan di tengah singkatan.`
      : `Terdapat ${errorV08.length} ringkasan yang melanggar V-08: ${errorV08.slice(0, 3).join('; ')}`
  );

  // V-09: Tidak ada tahun_input = 1970
  const ada1970 = budaya.some((r) => r.tahun_input === 1970);
  catat(
    'V-09',
    'error',
    !ada1970,
    !ada1970
      ? `Tidak ada rekaman dengan tahun_input = 1970.`
      : `Masih ditemukan rekaman dengan tahun_input = 1970!`
  );

  // V-10 (warn): Rekaman punya_deskripsi=false dicatat jumlahnya
  const tanpaDeskripsi = budaya.filter((r) => !r.punya_deskripsi);
  catat(
    'V-10',
    'warn',
    true,
    `Terdapat ${tanpaDeskripsi.length} dari ${budaya.length} rekaman bersih dengan punya_deskripsi = false (< 40 karakter).`
  );

  // V-11 (warn): Entri gabungan (C-07) dicantumkan daftarnya untuk ditinjau pengguna
  const entriGabungan = budaya.filter((r) => Array.isArray(r.id_anggota) && r.id_anggota.length > 1);
  const ringkasanGabungan = entriGabungan
    .map((g) => `${g.nama_tampil} (${g.provinsi}: ${g.id_anggota.length} rekaman -> ${g.jumlah_lokasi} lokasi)`)
    .join('; ');
  catat(
    'V-11',
    'warn',
    true,
    `Terdapat ${entriGabungan.length} entri induk hasil penggabungan C-07 (rincian lengkap di reports/clean-report.md).`,
    ringkasanGabungan
  );

  // V-12 (warn): Ukuran budaya.clean.json > 1 MB
  const ukuranByte = fs.statSync(path.join(CLEAN_DIR, 'budaya.clean.json')).size;
  const ukuranKb = (ukuranByte / 1024).toFixed(1);
  const lebih1Mb = ukuranByte > 1024 * 1024;
  catat(
    'V-12',
    'warn',
    !lebih1Mb,
    `Ukuran budaya.clean.json adalah ${ukuranKb} KB (${ukuranByte.toLocaleString('id-ID')} byte) — ${lebih1Mb ? 'MELEBIHI 1 MB!' : 'aman di bawah batas 1 MB.'}`
  );

  // V-13 (error): statistik.json konsisten: jumlah per_kategori = total_setelah_gabung
  const totalKategoriStat = Object.values(statistik.per_kategori || {}).reduce((a, b) => a + b, 0);
  const konsistenV13 =
    totalKategoriStat === statistik.total_setelah_gabung &&
    statistik.total_setelah_gabung === budaya.length;

  catat(
    'V-13',
    'error',
    konsistenV13,
    konsistenV13
      ? `statistik.json konsisten: jumlah per_kategori (${totalKategoriStat}) == total_setelah_gabung (${statistik.total_setelah_gabung}) == panjang budaya.clean.json (${budaya.length}).`
      : `Ketidaksesuaian V-13: jumlah per_kategori (${totalKategoriStat}) vs total_setelah_gabung (${statistik.total_setelah_gabung}) vs budaya.clean.json (${budaya.length})`
  );

  // V-14 (Fase 3): Validasi web/public/data/geo/provinsi.geojson jika sudah dibuat
  const geoWebPath = path.join(ROOT, 'web', 'public', 'data', 'geo', 'provinsi.geojson');
  if (fs.existsSync(geoWebPath)) {
    const geo = JSON.parse(fs.readFileSync(geoWebPath, 'utf8'));
    const geoSize = fs.statSync(geoWebPath).size;
    const geoKodeSet = new Set((geo.features || []).map((f) => f.properties?.kode));
    const semuaCocok =
      geo.type === 'FeatureCollection' &&
      Array.isArray(geo.features) &&
      geo.features.length === 38 &&
      geoKodeSet.size === 38 &&
      provinsi.every((p) => geoKodeSet.has(p.kode)) &&
      geoSize < 300 * 1024;

    catat(
      'V-14',
      'error',
      semuaCocok,
      semuaCocok
        ? `web/public/data/geo/provinsi.geojson valid: 38 fitur provinsi cocok 100%, ukuran ${(geoSize / 1024).toFixed(1)} KB (< 300 KB).`
        : `provinsi.geojson tidak memenuhi syarat 38 provinsi atau melebihi 300 KB.`
    );
  }

  console.log('\n===============================================================');
  if (jumlahError === 0) {
    console.log(`🟢 VALIDASI LOLOS: 0 error, ${jumlahWarn} catatan peringatan (warn).`);
    console.log('===============================================================');
  } else {
    console.error(`🔴 VALIDASI GAGAL: ${jumlahError} error ditemukan!`);
    console.log('===============================================================');
    process.exitCode = 1;
  }
}

try {
  jalankanValidasi();
} catch (err) {
  console.error(`[FATAL VALIDATE] ${err.message}`);
  process.exitCode = 1;
}
