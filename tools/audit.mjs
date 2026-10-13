import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'public', 'data');
const REPORTS_DIR = path.join(ROOT, 'reports');

// Tabel referensi resmi 38 provinsi (DATA_SPEC.md Bagian 3)
const REFERENSI_PROVINSI = [
  { kode: '11', nama: 'Aceh' },
  { kode: '12', nama: 'Sumatera Utara' },
  { kode: '13', nama: 'Sumatera Barat' },
  { kode: '14', nama: 'Riau' },
  { kode: '15', nama: 'Jambi' },
  { kode: '16', nama: 'Sumatera Selatan' },
  { kode: '17', nama: 'Bengkulu' },
  { kode: '18', nama: 'Lampung' },
  { kode: '19', nama: 'Kepulauan Bangka Belitung' },
  { kode: '21', nama: 'Kepulauan Riau' },
  { kode: '31', nama: 'DKI Jakarta' },
  { kode: '32', nama: 'Jawa Barat' },
  { kode: '33', nama: 'Jawa Tengah' },
  { kode: '34', nama: 'DI Yogyakarta' },
  { kode: '35', nama: 'Jawa Timur' },
  { kode: '36', nama: 'Banten' },
  { kode: '51', nama: 'Bali' },
  { kode: '52', nama: 'Nusa Tenggara Barat' },
  { kode: '53', nama: 'Nusa Tenggara Timur' },
  { kode: '61', nama: 'Kalimantan Barat' },
  { kode: '62', nama: 'Kalimantan Tengah' },
  { kode: '63', nama: 'Kalimantan Selatan' },
  { kode: '64', nama: 'Kalimantan Timur' },
  { kode: '65', nama: 'Kalimantan Utara' },
  { kode: '71', nama: 'Sulawesi Utara' },
  { kode: '72', nama: 'Sulawesi Tengah' },
  { kode: '73', nama: 'Sulawesi Selatan' },
  { kode: '74', nama: 'Sulawesi Tenggara' },
  { kode: '75', nama: 'Gorontalo' },
  { kode: '76', nama: 'Sulawesi Barat' },
  { kode: '81', nama: 'Maluku' },
  { kode: '82', nama: 'Maluku Utara' },
  { kode: '91', nama: 'Papua' },
  { kode: '92', nama: 'Papua Barat' },
  { kode: '93', nama: 'Papua Selatan' },
  { kode: '94', nama: 'Papua Tengah' },
  { kode: '95', nama: 'Papua Pegunungan' },
  { kode: '96', nama: 'Papua Barat Daya' }
];

const BOUNDS_INDONESIA = {
  LAT_MIN: -11.5,
  LAT_MAX: 6.5,
  LNG_MIN: 94.0,
  LNG_MAX: 142.0
};

function bacaJson(namaFile) {
  const filePath = path.join(RAW_DIR, namaFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Berkas data mentah tidak ditemukan: ${filePath}`);
  }
  try {
    const teks = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(teks);
  } catch (err) {
    throw new Error(`Gagal membaca atau mengurai JSON dari ${namaFile}: ${err.message}`);
  }
}

function hitungMedian(angkaTerurut) {
  if (angkaTerurut.length === 0) return 0;
  const tengah = Math.floor(angkaTerurut.length / 2);
  if (angkaTerurut.length % 2 === 0) {
    return (angkaTerurut[tengah - 1] + angkaTerurut[tengah]) / 2;
  }
  return angkaTerurut[tengah];
}

function jalankanAudit() {
  console.log('Memulai audit data mentah di public/data/...');

  const budaya = bacaJson('budaya.json');
  const meta = bacaJson('meta.json');
  const opkProv = bacaJson('opk-per-provinsi.json');
  const provSummary = bacaJson('provinsi-summary.json');

  if (!Array.isArray(budaya)) {
    throw new Error('Isi budaya.json bukan berupa array.');
  }

  const totalRekaman = budaya.length;

  // 1. Jumlah rekaman per kategori dan per jenis
  const perKategori = {};
  const perKategoriJenis = {};
  for (const r of budaya) {
    const kat = r.kategori || '(Kosong)';
    const jns = r.jenis || '(Kosong)';
    perKategori[kat] = (perKategori[kat] || 0) + 1;
    if (!perKategoriJenis[kat]) perKategoriJenis[kat] = {};
    perKategoriJenis[kat][jns] = (perKategoriJenis[kat][jns] || 0) + 1;
  }

  // 2. Kelengkapan tiap field
  const daftarField = [
    'id', 'kategori', 'jenis', 'nama', 'deskripsi',
    'provinsi', 'kabupaten', 'lat', 'lng', 'gambar', 'tahun', 'sumber'
  ];
  const kelengkapanField = {};
  let gambarBukanNull = 0;
  let gambarArrayKosong = 0;
  let gambarPathFolderTanpaFile = 0;
  let gambarUrlLangsung = 0;

  for (const f of daftarField) {
    kelengkapanField[f] = { terisi: 0, kosong: 0, total: totalRekaman };
  }

  for (const r of budaya) {
    for (const f of daftarField) {
      const val = r[f];
      const terisi = val !== null && val !== undefined && String(val).trim() !== '';
      if (f === 'gambar' && terisi) {
        gambarBukanNull++;
        const strVal = String(val).trim();
        if (strVal === '[]') {
          gambarArrayKosong++;
        } else if (strVal.startsWith('[')) {
          gambarPathFolderTanpaFile++;
        } else {
          gambarUrlLangsung++;
        }
      }
      if (terisi) {
        kelengkapanField[f].terisi++;
      } else {
        kelengkapanField[f].kosong++;
      }
    }
  }

  // 3. Statistik panjang deskripsi
  const panjangSemua = [];
  const panjangTerisi = [];
  const kosongPerKategori = {};
  let deskripsiKosong = 0;
  let deskripsiKurang40 = 0;
  let deskripsiKurang100Semua = 0;
  let deskripsiKurang100Terisi = 0;
  let deskripsiUnggulan300_1200 = 0;
  let deskripsiLebih1500 = 0;

  for (const r of budaya) {
    const teks = (r.deskripsi || '').trim();
    const len = teks.length;
    panjangSemua.push({ id: r.id, nama: r.nama, kategori: r.kategori, provinsi: r.provinsi, panjang: len });

    if (len === 0) {
      deskripsiKosong++;
      kosongPerKategori[r.kategori] = (kosongPerKategori[r.kategori] || 0) + 1;
    } else {
      panjangTerisi.push(len);
      if (len < 100) deskripsiKurang100Terisi++;
    }

    if (len < 40) deskripsiKurang40++;
    if (len < 100) deskripsiKurang100Semua++;
    if (len >= 300 && len <= 1200) deskripsiUnggulan300_1200++;
    if (len > 1500) deskripsiLebih1500++;
  }

  const urutSemua = panjangSemua.map((x) => x.panjang).sort((a, b) => a - b);
  const urutTerisi = [...panjangTerisi].sort((a, b) => a - b);
  const top5Terpanjang = [...panjangSemua].sort((a, b) => b.panjang - a.panjang).slice(0, 5);

  const statistikDeskripsi = {
    total_rekaman: totalRekaman,
    terisi: panjangTerisi.length,
    kosong: deskripsiKosong,
    kosong_per_kategori: kosongPerKategori,
    kurang_dari_40_karakter: deskripsiKurang40,
    kurang_dari_100_karakter_termasuk_kosong: deskripsiKurang100Semua,
    kurang_dari_100_karakter_hanya_terisi: deskripsiKurang100Terisi,
    kandidat_unggulan_300_1200: deskripsiUnggulan300_1200,
    lebih_dari_1500_karakter: deskripsiLebih1500,
    semua_rekaman: {
      min: urutSemua[0] ?? 0,
      median: hitungMedian(urutSemua),
      rata_rata: Math.round(urutSemua.reduce((a, b) => a + b, 0) / totalRekaman),
      maks: urutSemua[urutSemua.length - 1] ?? 0
    },
    rekaman_terisi_saja: {
      min: urutTerisi[0] ?? 0,
      median: hitungMedian(urutTerisi),
      rata_rata: Math.round(urutTerisi.reduce((a, b) => a + b, 0) / (urutTerisi.length || 1)),
      maks: urutTerisi[urutTerisi.length - 1] ?? 0
    },
    top_5_terpanjang: top5Terpanjang
  };

  // 4. Sebaran per provinsi & kabupaten
  const hitungProvinsi = {};
  const hitungKabupaten = {};
  let kabupatenNull = 0;

  for (const r of budaya) {
    const prov = r.provinsi || '(Kosong)';
    hitungProvinsi[prov] = (hitungProvinsi[prov] || 0) + 1;

    if (!r.kabupaten || String(r.kabupaten).trim() === '') {
      kabupatenNull++;
    } else {
      const kabKey = `${r.kabupaten} (${prov})`;
      hitungKabupaten[kabKey] = (hitungKabupaten[kabKey] || 0) + 1;
    }
  }

  const sebaranProvinsi = Object.entries(hitungProvinsi)
    .map(([provinsi, jumlah]) => ({
      provinsi,
      jumlah,
      persen: Number(((jumlah / totalRekaman) * 100).toFixed(2))
    }))
    .sort((a, b) => b.jumlah - a.jumlah || a.provinsi.localeCompare(b.provinsi, 'id'));

  const sebaranKabupaten = Object.entries(hitungKabupaten)
    .map(([label, jumlah]) => ({
      kabupaten_provinsi: label,
      jumlah,
      persen: Number(((jumlah / totalRekaman) * 100).toFixed(2))
    }))
    .sort((a, b) => b.jumlah - a.jumlah || a.kabupaten_provinsi.localeCompare(b.kabupaten_provinsi, 'id'));

  const top5Provinsi = sebaranProvinsi.slice(0, 5);
  const top5Total = top5Provinsi.reduce((acc, item) => acc + item.jumlah, 0);
  const top3Total = sebaranProvinsi.slice(0, 3).reduce((acc, item) => acc + item.jumlah, 0);

  // 5. Pencocokan dengan 38 provinsi referensi
  const mapReferensi = new Map(REFERENSI_PROVINSI.map((p) => [p.nama, p.kode]));
  const provinsiTakDikenal = sebaranProvinsi
    .filter((p) => !mapReferensi.has(p.provinsi))
    .map((p) => p.provinsi);

  const provinsiTanpaData = REFERENSI_PROVINSI
    .filter((p) => !hitungProvinsi[p.nama])
    .map((p) => ({ kode: p.kode, nama: p.nama }));

  // 6. Duplikat murni dan nama berulang
  const grupDuplikatMurni = new Map();
  const grupNama = new Map();

  for (const r of budaya) {
    const namaNorm = (r.nama || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const kunciMurni = `${namaNorm}|${r.provinsi || ''}|${r.kabupaten || ''}`;
    if (!grupDuplikatMurni.has(kunciMurni)) grupDuplikatMurni.set(kunciMurni, []);
    grupDuplikatMurni.get(kunciMurni).push({
      id: r.id,
      nama: r.nama,
      kategori: r.kategori,
      jenis: r.jenis,
      provinsi: r.provinsi,
      kabupaten: r.kabupaten,
      tahun: r.tahun,
      panjang_deskripsi: (r.deskripsi || '').trim().length
    });

    if (!grupNama.has(namaNorm)) grupNama.set(namaNorm, []);
    grupNama.get(namaNorm).push({
      id: r.id,
      nama: r.nama,
      provinsi: r.provinsi,
      kabupaten: r.kabupaten,
      tahun: r.tahun,
      panjang_deskripsi: (r.deskripsi || '').trim().length
    });
  }

  const duplikatMurni = [];
  for (const [kunci, daftar] of grupDuplikatMurni.entries()) {
    if (daftar.length > 1) {
      duplikatMurni.push({
        kunci,
        jumlah: daftar.length,
        rekaman: daftar
      });
    }
  }

  const namaBerulang = [];
  for (const [namaNorm, daftar] of grupNama.entries()) {
    if (daftar.length > 1) {
      const provinsiUnik = [...new Set(daftar.map((d) => d.provinsi))];
      const kabupatenUnik = [...new Set(daftar.map((d) => d.kabupaten || '(null)'))];
      namaBerulang.push({
        nama_normal: namaNorm,
        nama_contoh: daftar[0].nama,
        jumlah: daftar.length,
        provinsi: provinsiUnik,
        kabupaten: kabupatenUnik,
        semua_deskripsi_kosong: daftar.every((d) => d.panjang_deskripsi === 0)
      });
    }
  }
  namaBerulang.sort((a, b) => b.jumlah - a.jumlah || a.nama_normal.localeCompare(b.nama_normal, 'id'));

  // 7. Koordinat
  const rekamanBerkoordinat = [];
  const koordinatLuarBatas = [];
  for (const r of budaya) {
    if (r.lat !== null && r.lat !== undefined && r.lng !== null && r.lng !== undefined) {
      const info = {
        id: r.id,
        nama: r.nama,
        provinsi: r.provinsi,
        kabupaten: r.kabupaten,
        lat: r.lat,
        lng: r.lng
      };
      rekamanBerkoordinat.push(info);
      if (
        r.lat < BOUNDS_INDONESIA.LAT_MIN ||
        r.lat > BOUNDS_INDONESIA.LAT_MAX ||
        r.lng < BOUNDS_INDONESIA.LNG_MIN ||
        r.lng > BOUNDS_INDONESIA.LNG_MAX
      ) {
        koordinatLuarBatas.push(info);
      }
    }
  }

  // 8. Sebaran tahun_input
  const sebaranTahun = {};
  const tahunTidakWajar = [];
  for (const r of budaya) {
    const th = r.tahun;
    sebaranTahun[th] = (sebaranTahun[th] || 0) + 1;
    if (!th || th < 2000 || th > 2026) {
      tahunTidakWajar.push({
        id: r.id,
        nama: r.nama,
        provinsi: r.provinsi,
        kabupaten: r.kabupaten,
        tahun: th
      });
    }
  }

  // 9. Pemeriksaan pola pemotongan (indikasi scraping terpotong)
  const jenisCB = perKategoriJenis['Cagar Budaya'] || {};
  const nilaiJenisCB = Object.values(jenisCB);
  const semuaJenisCBSama = nilaiJenisCB.length > 0 && nilaiJenisCB.every((v) => v === nilaiJenisCB[0]);

  const analisisPemotongan = {
    cagar_budaya_per_jenis: jenisCB,
    cagar_budaya_seragam: semuaJenisCBSama,
    nilai_seragam_cb: semuaJenisCBSama ? nilaiJenisCB[0] : null,
    lembaga_budaya_total: perKategori['Lembaga Budaya'] || 0,
    sarana_prasarana_total: perKategori['Sarana & Prasarana'] || 0,
    jumlah_jenis_opk_tercatat: Object.keys(perKategoriJenis['Objek Pemajuan Kebudayaan'] || {}).length,
    indikasi_terpotong: semuaJenisCBSama || (perKategori['Lembaga Budaya'] || 0) <= 5 || (perKategori['Sarana & Prasarana'] || 0) <= 5,
    catatan_teknis: [
      'Seluruh 5 jenis Cagar Budaya masing-masing berjumlah tepat 13 rekaman (total 65) dan seluruh deskripsinya kosong.',
      'Lembaga Budaya hanya 3 rekaman dan Sarana & Prasarana hanya 3 rekaman.',
      'Objek Pemajuan Kebudayaan (OPK) hanya memuat 5 jenis dari 10 objek pemajuan kebudayaan menurut UU Pemajuan Kebudayaan.',
      'Berdasarkan jejak scraper/endpoints.json, request ke /api/telusuri/category/list-data sempat mengembalikan HTTP 500 Internal Server Error untuk sejumlah kombinasi, sehingga data yang tertangkap kemungkinan berasal dari tangkapan awal infinite scroll / halaman terbatas.'
    ]
  };

  // 11. Konsistensi antar file
  const selisihAntarFile = [];

  // 11a. meta.json vs budaya.json
  if (meta.jumlah_record !== totalRekaman) {
    selisihAntarFile.push(`meta.json jumlah_record (${meta.jumlah_record}) != budaya.json (${totalRekaman})`);
  }
  for (const [kat, jml] of Object.entries(perKategori)) {
    const jmlMeta = meta.kategori_summary?.[kat];
    if (jmlMeta !== jml) {
      selisihAntarFile.push(`meta.json kategori_summary[${kat}] (${jmlMeta}) != budaya.json (${jml})`);
    }
  }

  // 11b. opk-per-provinsi.json vs budaya.json
  const totalOpkBudaya = perKategori['Objek Pemajuan Kebudayaan'] || 0;
  if (opkProv.total_objek_pemajuan !== totalOpkBudaya) {
    selisihAntarFile.push(`opk-per-provinsi.json total_objek_pemajuan (${opkProv.total_objek_pemajuan}) != budaya.json (${totalOpkBudaya})`);
  }
  for (const itemProv of opkProv.data_per_provinsi || []) {
    const rekProvOpk = budaya.filter((r) => r.provinsi === itemProv.provinsi && r.kategori === 'Objek Pemajuan Kebudayaan');
    if (rekProvOpk.length !== itemProv.total_opk) {
      selisihAntarFile.push(`opk-per-provinsi.json provinsi ${itemProv.provinsi}: total_opk (${itemProv.total_opk}) != budaya.json (${rekProvOpk.length})`);
    }
  }

  // 11c. provinsi-summary.json vs budaya.json
  for (const itemProv of provSummary.provinsi || []) {
    const rekProv = budaya.filter((r) => r.provinsi === itemProv.provinsi);
    const sdmProv = itemProv.kategori?.['SDM Kebudayaan (Agregat)'] || 0;
    // Periksa apakah total_budaya di provinsi-summary menghitung SDM atau tidak
    const totalTanpaSdm = rekProv.length;
    const totalDenganSdm = rekProv.length + sdmProv;
    if (itemProv.total_budaya !== totalTanpaSdm && itemProv.total_budaya !== totalDenganSdm) {
      selisihAntarFile.push(`provinsi-summary.json provinsi ${itemProv.provinsi}: total_budaya (${itemProv.total_budaya}) != budaya.json (${totalTanpaSdm})`);
    }
  }

  // Cek apakah total_budaya di provinsi-summary memasukkan SDM Kebudayaan (Agregat)
  const provinsiDenganSdm = (provSummary.provinsi || []).filter((p) => (p.kategori?.['SDM Kebudayaan (Agregat)'] || 0) > 0);
  const catatanSdmSummary = provinsiDenganSdm.map((p) => {
    const rekProv = budaya.filter((r) => r.provinsi === p.provinsi).length;
    const sdm = p.kategori['SDM Kebudayaan (Agregat)'];
    return {
      provinsi: p.provinsi,
      rekaman_di_budaya_json: rekProv,
      sdm_agregat: sdm,
      total_budaya_di_summary: p.total_budaya,
      apakah_total_termasuk_sdm: p.total_budaya === rekProv + sdm
    };
  });

  // Cek padding 0 di top_10_per_kategori
  const paddingTop10 = {};
  for (const [kat, daftarTop] of Object.entries(provSummary.top_10_per_kategori || {})) {
    const jumlahNol = daftarTop.filter((x) => (x.count ?? x.jumlah) === 0).length;
    if (jumlahNol > 0) {
      paddingTop10[kat] = jumlahNol;
    }
  }

  const hasilAudit = {
    tanggal_audit: new Date().toISOString(),
    tanggal_ambil_data: meta.tanggal_ambil,
    ringkasan_jumlah: {
      total_rekaman: totalRekaman,
      total_sdm_agregat: meta.jumlah_sdm_agregat,
      per_kategori: perKategori,
      per_kategori_dan_jenis: perKategoriJenis
    },
    kelengkapan_field: {
      per_field: kelengkapanField,
      catatan_gambar: {
        total_non_null: gambarBukanNull,
        string_array_kosong: gambarArrayKosong,
        json_array_path_folder_saja: gambarPathFolderTanpaFile,
        url_langsung: gambarUrlLangsung,
        kesimpulan: 'Dari 31 rekaman non-null: 10 berisi "[]", 16 berisi JSON array dengan path folder dasar tanpa nama file gambar, dan hanya 5 berisi string URL langsung. Sesuai DATA_SPEC.md 2.4, field gambar tidak dapat diandalkan dan wajib dihapus pada Fase 2.'
      }
    },
    statistik_deskripsi: statistikDeskripsi,
    sebaran_wilayah: {
      jumlah_provinsi_berdata: sebaranProvinsi.length,
      jumlah_provinsi_tanpa_data: provinsiTanpaData.length,
      konsentrasi_top3_persen: Number(((top3Total / totalRekaman) * 100).toFixed(2)),
      konsentrasi_top5_persen: Number(((top5Total / totalRekaman) * 100).toFixed(2)),
      top_5_provinsi: top5Provinsi,
      semua_provinsi_berdata: sebaranProvinsi,
      jumlah_kabupaten_tercatat: sebaranKabupaten.length,
      rekaman_kabupaten_null: kabupatenNull,
      top_10_kabupaten: sebaranKabupaten.slice(0, 10)
    },
    validasi_referensi_provinsi: {
      total_referensi: REFERENSI_PROVINSI.length,
      provinsi_di_data_tidak_di_referensi: provinsiTakDikenal,
      provinsi_referensi_tanpa_data: provinsiTanpaData
    },
    duplikat_dan_berulang: {
      jumlah_grup_duplikat_murni: duplikatMurni.length,
      duplikat_murni: duplikatMurni,
      jumlah_nama_berulang: namaBerulang.length,
      nama_berulang: namaBerulang
    },
    koordinat: {
      jumlah_berkoordinat: rekamanBerkoordinat.length,
      rekaman_berkoordinat: rekamanBerkoordinat,
      jumlah_luar_batas_indonesia: koordinatLuarBatas.length,
      koordinat_luar_batas: koordinatLuarBatas
    },
    sebaran_tahun_input: {
      per_tahun: sebaranTahun,
      nilai_tidak_wajar: tahunTidakWajar
    },
    pemeriksaan_pemotongan: analisisPemotongan,
    konsistensi_antar_file: {
      selisih_ditemukan: selisihAntarFile,
      catatan_sdm_pada_provinsi_summary: catatanSdmSummary,
      padding_nol_pada_top10_kategori: paddingTop10
    },
    pertanyaan_untuk_pengguna: {
      instruksi: 'Bandingkan angka lokal di bawah ini dengan total aktual di situs SPKT (https://spkt.kemenbud.go.id) untuk memastikan apakah hasil scraping terpotong.',
      perbandingan_kategori: [
        { kategori: 'Objek Pemajuan Kebudayaan (OPK)', jumlah_lokal: perKategori['Objek Pemajuan Kebudayaan'] || 0, status: 'Digunakan apa adanya (473 rekaman, 5 jenis)' },
        { kategori: 'Cagar Budaya', jumlah_lokal: perKategori['Cagar Budaya'] || 0, status: 'Terindikasi terpotong (tepat 13 per jenis = 65); digunakan apa adanya dengan disclaimer jujur' },
        { kategori: 'Lembaga Budaya', jumlah_lokal: perKategori['Lembaga Budaya'] || 0, status: 'Terindikasi terpotong (3 rekaman); digunakan apa adanya dengan disclaimer jujur' },
        { kategori: 'Sarana & Prasarana', jumlah_lokal: perKategori['Sarana & Prasarana'] || 0, status: 'Terindikasi terpotong (3 rekaman); digunakan apa adanya dengan disclaimer jujur' },
        { kategori: 'SDM Kebudayaan (Agregat)', jumlah_lokal: meta.jumlah_sdm_agregat || 0, status: 'Hanya ditampilkan sebagai agregat (5)' }
      ],
      keputusan_pengguna: 'Tetap gunakan data lokal saat ini (544 rekaman) apa adanya dengan kejujuran penuh di disclaimer web, lalu lanjut ke Fase 2 tanpa crawl ulang.'
    }
  };

  // Pastikan folder reports tersedia
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // Tulis reports/audit-report.json
  const jsonReportPath = path.join(REPORTS_DIR, 'audit-report.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(hasilAudit, null, 2), 'utf8');

  // Tulis reports/audit-report.md
  const mdReportPath = path.join(REPORTS_DIR, 'audit-report.md');
  const mdContent = buatMarkdownReport(hasilAudit, meta);
  fs.writeFileSync(mdReportPath, mdContent, 'utf8');

  console.log(`✓ Audit selesai.`);
  console.log(`  - JSON : ${jsonReportPath}`);
  console.log(`  - MD   : ${mdReportPath}`);
}

function buatMarkdownReport(audit, meta) {
  const {
    ringkasan_jumlah,
    kelengkapan_field,
    statistik_deskripsi,
    sebaran_wilayah,
    validasi_referensi_provinsi,
    duplikat_dan_berulang,
    koordinat,
    sebaran_tahun_input,
    pemeriksaan_pemotongan,
    konsistensi_antar_file
  } = audit;

  const barisKategori = Object.entries(ringkasan_jumlah.per_kategori)
    .map(([kat, jml]) => `| ${kat} | ${jml} |`)
    .join('\n');

  const barisJenis = [];
  for (const [kat, objJenis] of Object.entries(ringkasan_jumlah.per_kategori_dan_jenis)) {
    for (const [jns, jml] of Object.entries(objJenis)) {
      barisJenis.push(`| ${kat} | ${jns} | ${jml} |`);
    }
  }

  const barisField = Object.entries(kelengkapan_field.per_field)
    .map(([f, d]) => `| \`${f}\` | ${d.terisi} / ${d.total} | ${d.kosong} |`)
    .join('\n');

  const barisTopProv = sebaran_wilayah.semua_provinsi_berdata
    .map((p, i) => `| ${i + 1} | ${p.provinsi} | ${p.jumlah} | ${p.persen}% |`)
    .join('\n');

  const barisTopKab = sebaran_wilayah.top_10_kabupaten
    .map((k, i) => `| ${i + 1} | ${k.kabupaten_provinsi} | ${k.jumlah} | ${k.persen}% |`)
    .join('\n');

  const barisProvKosong = validasi_referensi_provinsi.provinsi_referensi_tanpa_data
    .map((p) => `- \`${p.kode}\` — ${p.nama}`)
    .join('\n');

  const barisDuplikatMurni = duplikat_dan_berulang.duplikat_murni
    .map((d) => {
      const detail = d.rekaman
        .map((r) => `\`${r.id}\` (thn: ${r.tahun}, deskripsi: ${r.panjang_deskripsi} kar)`)
        .join(', ');
      return `- **${d.rekaman[0].nama}** — ${d.rekaman[0].kabupaten}, ${d.rekaman[0].provinsi} (${d.jumlah}x): ${detail}`;
    })
    .join('\n');

  const barisNamaBerulang = duplikat_dan_berulang.nama_berulang
    .map((n) => `| ${n.nama_contoh} | ${n.jumlah} | ${n.provinsi.join(', ')} | ${n.semua_deskripsi_kosong ? 'Ya (0 kar)' : 'Tidak'} |`)
    .join('\n');

  const barisTahun = Object.entries(sebaran_tahun_input.per_tahun)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([th, jml]) => `| ${th} | ${jml} | ${Number(th) < 2000 ? '⚠️ Tidak wajar (epoch error)' : 'Normal'} |`)
    .join('\n');

  return `# Laporan Audit Data Mentah — Atlas Budaya

- **Tanggal Audit:** ${audit.tanggal_audit}
- **Tanggal Ambil Data (\`meta.json\`):** ${meta.tanggal_ambil_terformat} (\`${meta.tanggal_ambil}\`)
- **Sumber:** ${meta.sumber} (${meta.url_sumber})

---

## 1. Jumlah Rekaman per Kategori dan Jenis

- **Total Rekaman (\`budaya.json\`):** **${ringkasan_jumlah.total_rekaman}** rekaman
- **SDM Kebudayaan (Agregat di \`meta.json\`):** **${ringkasan_jumlah.total_sdm_agregat}** (Jawa Tengah: 2, Sulawesi Selatan: 3)

### Per Kategori
| Kategori | Jumlah |
|---|---|
${barisKategori}

### Rincian per Jenis
| Kategori | Jenis | Jumlah |
|---|---|---|
${barisJenis.join('\n')}

---

## 2. Kelengkapan Tiap Field

| Field | Terisi / Total | Kosong |
|---|---|---|
${barisField}

> **Catatan Field \`gambar\`:** Terdapat ${kelengkapan_field.catatan_gambar.total_non_null} rekaman non-null (513 \`null\`), dengan rincian: **${kelengkapan_field.catatan_gambar.string_array_kosong}** berisi string \`"[]"\`, **${kelengkapan_field.catatan_gambar.json_array_path_folder_saja}** berisi JSON array path folder dasar (\`https://app.dapobud.kemenbud.go.id/storage/\`) tanpa nama berkas gambar, dan hanya **${kelengkapan_field.catatan_gambar.url_langsung}** berisi URL langsung. Sesuai \`DATA_SPEC.md\` 2.4, field \`gambar\` tidak dapat dipakai dan akan dihapus pada Fase 2.

---

## 3. Statistik Panjang Deskripsi

- **Terisi (> 0 karakter):** ${statistik_deskripsi.terisi} rekaman
- **Kosong (0 karakter):** ${statistik_deskripsi.kosong} rekaman
  - Rincian kosong per kategori: ${JSON.stringify(statistik_deskripsi.kosong_per_kategori)}
- **Panjang < 40 karakter (termasuk kosong):** ${statistik_deskripsi.kurang_dari_40_karakter} rekaman
- **Panjang < 100 karakter (termasuk kosong):** ${statistik_deskripsi.kurang_dari_100_karakter_termasuk_kosong} rekaman (jika hanya dihitung yang terisi 1–99 karakter: **${statistik_deskripsi.kurang_dari_100_karakter_hanya_terisi}** rekaman)
- **Kandidat Unggulan (300–1.200 karakter):** ${statistik_deskripsi.kandidat_unggulan_300_1200} rekaman
- **Deskripsi Panjang (> 1.500 karakter):** ${statistik_deskripsi.lebih_dari_1500_karakter} rekaman

| Kelompok Hitung | Minimum | Median | Rata-rata | Maksimum |
|---|---|---|---|---|
| Seluruh 544 Rekaman | ${statistik_deskripsi.semua_rekaman.min} | ${statistik_deskripsi.semua_rekaman.median} | ${statistik_deskripsi.semua_rekaman.rata_rata} | ${statistik_deskripsi.semua_rekaman.maks} |
| 413 Rekaman Terisi | ${statistik_deskripsi.rekaman_terisi_saja.min} | ${statistik_deskripsi.rekaman_terisi_saja.median} | ${statistik_deskripsi.rekaman_terisi_saja.rata_rata} | ${statistik_deskripsi.rekaman_terisi_saja.maks} |

**5 Rekaman dengan Deskripsi Terpanjang:**
${statistik_deskripsi.top_5_terpanjang.map((x, i) => `${i + 1}. **${x.nama}** (${x.provinsi}) — ${x.panjang.toLocaleString('id-ID')} karakter (\`${x.id}\`)`).join('\n')}

---

## 4. Sebaran Wilayah & Konsentrasi Data

- **Provinsi memiliki data:** **${sebaran_wilayah.jumlah_provinsi_berdata}** dari 38 provinsi
- **Provinsi belum tercatat (0 rekaman):** **${sebaran_wilayah.jumlah_provinsi_tanpa_data}** provinsi
- **Konsentrasi 3 Provinsi Teratas:** **${sebaran_wilayah.konsentrasi_top3_persen}%** dari total nasional
- **Konsentrasi 5 Provinsi Teratas:** **${sebaran_wilayah.konsentrasi_top5_persen}%** dari total nasional (catatan: peringkat 5 dan 6 yakni Jawa Barat & Kalimantan Barat sama-sama memiliki 38 rekaman)
- **Rekaman dengan \`kabupaten = null\`:** **${sebaran_wilayah.rekaman_kabupaten_null}** rekaman

### Sebaran 28 Provinsi Berdata
| Peringkat | Provinsi | Jumlah | Persentase |
|---|---|---|---|
${barisTopProv}

### 10 Kabupaten/Kota Teratas
| Peringkat | Kabupaten/Kota (Provinsi) | Jumlah | Persentase Nasional |
|---|---|---|---|
${barisTopKab}

---

## 5. Pencocokan Tabel Referensi 38 Provinsi

- **Provinsi di \`budaya.json\` yang TIDAK ada di tabel referensi (Bagian 3 \`DATA_SPEC.md\`):** ${validasi_referensi_provinsi.provinsi_di_data_tidak_di_referensi.length === 0 ? 'Tidak ada (0) — 100% cocok' : validasi_referensi_provinsi.provinsi_di_data_tidak_di_referensi.join(', ')}
- **10 Provinsi di tabel referensi yang belum memiliki rekaman di \`budaya.json\`:**
${barisProvKosong}

---

## 6. Duplikat Murni & Nama Berulang

### Duplikat Murni (${duplikat_dan_berulang.jumlah_grup_duplikat_murni} grup)
${barisDuplikatMurni}

### Nama Berulang (${duplikat_dan_berulang.jumlah_nama_berulang} nama unik muncul > 1 kali)
| Nama | Jumlah | Provinsi | Semua Deskripsi Kosong? |
|---|---|---|---|
${barisNamaBerulang}

---

## 7. Pemeriksaan Koordinat

- **Rekaman memiliki koordinat (\`lat\` & \`lng\`):** ${koordinat.jumlah_berkoordinat} dari ${ringkasan_jumlah.total_rekaman} rekaman
${koordinat.rekaman_berkoordinat.map((k) => `  - **${k.nama}** (${k.kabupaten}, ${k.provinsi}): \`${k.lat}, ${k.lng}\``).join('\n')}
- **Koordinat di luar batas Indonesia (lat -11,5..6,5; lng 94..142):** ${koordinat.jumlah_luar_batas_indonesia} rekaman

---

## 8. Sebaran \`tahun\` (Tahun Input Data)

| Tahun | Jumlah Rekaman | Status |
|---|---|---|
${barisTahun}

**Rekaman dengan tahun tidak wajar:**
${sebaran_tahun_input.nilai_tidak_wajar.map((t) => `- \`${t.id}\` — **${t.nama}** (${t.kabupaten}, ${t.provinsi}): tahun \`${t.tahun}\``).join('\n')}

---

## 9. Pemeriksaan Pola Pemotongan (Dugaan Scraping Terpotong)

- **Apakah semua jenis Cagar Budaya berjumlah sama persis?** **${pemeriksaan_pemotongan.cagar_budaya_seragam ? 'YA (Masing-masing tepat 13 rekaman, total 65)' : 'Tidak'}**
- **Total Lembaga Budaya:** **${pemeriksaan_pemotongan.lembaga_budaya_total}** rekaman
- **Total Sarana & Prasarana:** **${pemeriksaan_pemotongan.sarana_prasarana_total}** rekaman
- **Jumlah Jenis OPK yang muncul:** **${pemeriksaan_pemotongan.jumlah_jenis_opk_tercatat}** jenis

**Analisis Teknis dari Log Scraper Awal:**
${pemeriksaan_pemotongan.catatan_teknis.map((c) => `- ${c}`).join('\n')}

---

## 10. Pertanyaan untuk Pengguna & Kesimpulan Akhir Fase 1

| Kategori | Jumlah di Data Lokal | Status & Catatan Verifikasi |
|---|---|---|
| Objek Pemajuan Kebudayaan (OPK) | 473 | Digunakan apa adanya (5 jenis OPK tercatat) |
| Cagar Budaya | 65 (13 per jenis) | Terindikasi terpotong pada saat scraping (tepat 13 per jenis, tanpa deskripsi) |
| Lembaga Budaya | 3 | Terindikasi terpotong pada saat scraping |
| Sarana & Prasarana | 3 | Terindikasi terpotong pada saat scraping |
| SDM Kebudayaan (Agregat) | 5 | Hanya ditampilkan sebagai agregat |

- **Kesimpulan Audit:** Scraping awal kemungkinan besar **terpotong** untuk kategori Cagar Budaya (tepat 13 rekaman per subkategori), Lembaga Budaya (3), dan Sarana & Prasarana (3) akibat kendala paginasi/HTTP 500 pada endpoint list-data saat pengambilan 9 Oktober 2026.
- **Keputusan Pengguna (2026-10-13):** Tetap menggunakan dataset lokal saat ini (**544 rekaman**) apa adanya tanpa melakukan crawl ulang, dengan mencantumkan keterbatasan tangkapan data ini secara jujur pada bagian *Tentang Data / Disclaimer* di website, lalu melanjutkan ke Fase 2.

---

## 11. Konsistensi Antar Berkas (\`meta.json\`, \`opk-per-provinsi.json\`, \`provinsi-summary.json\` vs \`budaya.json\`)

- **Selisih jumlah OPK atau kategori:** ${konsistensi_antar_file.selisih_ditemukan.length === 0 ? 'Tidak ada selisih (Konsisten).' : konsistensi_antar_file.selisih_ditemukan.join('; ')}
- **Catatan penting pada \`provinsi-summary.json\`:**
  1. Nilai \`total_budaya\` per provinsi di \`provinsi-summary.json\` konsisten 100% dengan jumlah rekaman di \`budaya.json\` (Jawa Tengah: 79 rekaman + 2 SDM Agregat disimpan terpisah di sub-key \`kategori["SDM Kebudayaan (Agregat)"]\`; Sulawesi Selatan: 39 rekaman + 3 SDM Agregat).
  2. Pada \`top_10_per_kategori\` di \`provinsi-summary.json\`, kategori \`Lembaga Budaya\` memiliki **${konsistensi_antar_file.padding_nol_pada_top10_kategori['Lembaga Budaya'] || 0} provinsi bernilai \`count: 0\`** dan \`Sarana & Prasarana\` memiliki **${konsistensi_antar_file.padding_nol_pada_top10_kategori['Sarana & Prasarana'] || 0} provinsi bernilai \`count: 0\`** sebagai pengisi (padding) — sesuai peringatan di \`DATA_SPEC.md\` bagian 1.4.
`;
}

try {
  jalankanAudit();
} catch (err) {
  console.error(`[ERROR AUDIT] ${err.message}`);
  process.exitCode = 1;
}
