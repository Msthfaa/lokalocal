import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'public', 'data');
const CLEAN_DIR = path.join(RAW_DIR, 'clean');
const REPORTS_DIR = path.join(ROOT, 'reports');

// Tabel referensi 38 provinsi (DATA_SPEC.md Bagian 3)
export const REFERENSI_PROVINSI = [
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

const KATA_HUBUNG_KECIL = new Set([
  'dan', 'di', 'ke', 'dari', 'yang', 'atau', 'pada', 'untuk', 'dalam', 'dengan', 'oleh', 'sebagai'
]);

const AKRONIM_TETAP = new Set([
  'KIM', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII', 'RI', 'DKI', 'DI', 'TNI', 'VOC'
]);

// Daftar singkatan yang tidak boleh dianggap sebagai akhir kalimat (C-09 & V-08)
export const DAFTAR_SINGKATAN = new Set([
  'kab', 'kec', 'kel', 'ds', 'dr', 'drs', 'dra', 'ir', 'prof', 'st', 'sh', 'mh', 'm', 's', 'h', 'hj',
  'no', 'hlm', 'hal', 'dll', 'dsb', 'dst', 'dkk', 'al', 'vol', 'ed', 'cet', 'th', 'thn', 'abad',
  'jl', 'jln', 'gg', 'rt', 'rw', 'km', 'cm', 'mm', 'kg', 'gr', 'rp', 'pt', 'cv', 'ud', 'tbk',
  'ny', 'tn', 'sdr', 'sdri', 'bpk', 'ibu', 'kh', 'ust', 'mgr', 'pst', 'pdt', 'rm', 'll', 're'
]);

const KATEGORI_KODE_MAP = {
  'Objek Pemajuan Kebudayaan': 'OPK',
  'Cagar Budaya': 'CB',
  'Lembaga Budaya': 'LB',
  'Sarana & Prasarana': 'SP'
};

const JENIS_KODE_MAP = {
  // OPK
  'Kemahiran dan Kerajinan Tradisional': 'kerajinan',
  'Seni Pertunjukan': 'seni',
  'Tradisi dan Ekspresi Lisan': 'lisan',
  'Pengetahuan dan Kebiasaan Perilaku Mengenai Alam Semesta': 'pengetahuan',
  'Adat Istiadat Masyarakat, Ritus, dan Perayaan': 'adat',
  // Cagar Budaya
  'Benda': 'benda',
  'Bangunan': 'bangunan',
  'Struktur': 'struktur',
  'Situs': 'situs',
  'Kawasan': 'kawasan',
  // Lembaga Budaya & Sarana Prasarana
  'Non-Pemerintah': 'non_pemerintah',
  'Pemerintah': 'pemerintah'
};

function bacaJsonMentah(namaFile) {
  const filePath = path.join(RAW_DIR, namaFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Berkas data mentah tidak ditemukan: ${filePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`Gagal mengurai JSON dari ${namaFile}: ${err.message}`);
  }
}

function normalisasiSpasi(str) {
  if (str === null || str === undefined) return '';
  return String(str).trim().replace(/\s+/g, ' ');
}

/**
 * Mengubah string ALL CAPS menjadi Title Case yang rapi (C-02)
 */
function keTitleCase(nama) {
  const rapi = nama
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();

  // Jika bukan ALL CAPS dan bukan all lowercase, atau tidak punya huruf alfabet (seperti #NAME?)
  const adaHuruf = /[A-Za-z]/.test(rapi);
  const apakahAllCaps = adaHuruf && rapi === rapi.toUpperCase();
  const apakahAllLower = adaHuruf && rapi === rapi.toLowerCase();
  if (!apakahAllCaps && !apakahAllLower) return rapi;
  if (AKRONIM_TETAP.has(rapi.toUpperCase())) return rapi.toUpperCase();

  const tokenList = rapi.split(' ');
  return tokenList
    .map((token, idx) => {
      // Pisahkan awalan kurung buka jika ada, misal "(DAYAK"
      const match = token.match(/^([("']*)([A-Za-z0-9-]+)([)"',.:;]*)$/);
      if (!match) return token;
      const [, awalan, inti, akhiran] = match;
      if (AKRONIM_TETAP.has(inti.toUpperCase())) {
        return `${awalan}${inti.toUpperCase()}${akhiran}`;
      }
      const lower = inti.toLowerCase();
      // Kata hubung kecil tetap huruf kecil kecuali di kata pertama atau tepat setelah kurung buka
      if (idx > 0 && !awalan.includes('(') && KATA_HUBUNG_KECIL.has(lower)) {
        return `${awalan}${lower}${akhiran}`;
      }
      // Tangani kata berpenghubung tanda hubung seperti "SARE-SARE" -> "Sare-Sare"
      const bagianHubung = lower
        .split('-')
        .map((b) => (b.length > 0 ? b.charAt(0).toUpperCase() + b.slice(1) : b))
        .join('-');
      return `${awalan}${bagianHubung}${akhiran}`;
    })
    .join(' ');
}

/**
 * Pemecah kalimat yang aman dari singkatan bahasa Indonesia dan inisial (C-09)
 */
export function pecahKalimatAman(teks) {
  if (!teks) return [];
  const bersih = normalisasiSpasi(teks);
  if (!bersih) return [];

  const hasil = [];
  let awal = 0;

  for (let i = 0; i < bersih.length; i++) {
    const ch = bersih[i];
    if (ch === '.' || ch === '!' || ch === '?') {
      const next = bersih[i + 1];
      const adalahPenutupKutipan = next === '"' || next === '\u201d' || next === '\u2019' || next === ')';
      if (next !== undefined && next !== ' ' && !adalahPenutupKutipan) {
        continue;
      }

      if (ch === '.') {
        const sebelum = bersih.slice(awal, i);
        const matchKata = sebelum.match(/([A-Za-z0-9]+)$/);
        const kataTerakhir = matchKata ? matchKata[1].toLowerCase() : '';

        // 1. Cek apakah kata sebelum titik ada di kamus singkatan
        if (DAFTAR_SINGKATAN.has(kataTerakhir)) {
          continue;
        }
        // 2. Cek apakah kata sebelum titik adalah 1 huruf inisial (mis. A. B. atau H.)
        if (kataTerakhir.length === 1 && /[a-z]/i.test(kataTerakhir)) {
          continue;
        }
        // 3. Cek apakah kata sebelum titik adalah angka daftar (mis. "1. ", "2. ")
        if (/^\d+$/.test(kataTerakhir)) {
          continue;
        }
        // 4. Cek apakah bagian dari gelar/inisial berganda seperti S.H. atau M.Pd.
        if (/\b[A-Za-z]\.[A-Za-z]+$/.test(sebelum)) {
          continue;
        }
      }

      let akhir = i + 1;
      while (
        akhir < bersih.length &&
        (bersih[akhir] === '"' || bersih[akhir] === '\u201d' || bersih[akhir] === '\u2019' || bersih[akhir] === ')')
      ) {
        akhir++;
      }

      const kalimat = bersih.slice(awal, akhir).trim();
      if (kalimat) hasil.push(kalimat);

      awal = akhir;
      while (awal < bersih.length && bersih[awal] === ' ') awal++;
      i = awal - 1;
    }
  }

  if (awal < bersih.length) {
    const sisa = bersih.slice(awal).trim();
    if (sisa) hasil.push(sisa);
  }

  return hasil;
}

/**
 * Membuat ringkasan <= 240 karakter yang tidak memotong kata atau singkatan (C-09 & V-08)
 */
export function buatRingkasan(deskripsi, punyaDeskripsi) {
  if (!punyaDeskripsi) return null;
  const bersih = normalisasiSpasi(deskripsi);
  if (bersih.length <= 240) {
    // Jika berakhir tepat pada singkatan (sangat jarang untuk deskripsi utuh), tambahkan elipsis
    return pastikanBukanAkhirSingkatan(bersih);
  }

  const kalimatList = pecahKalimatAman(bersih);
  let terkumpul = '';

  for (const kal of kalimatList) {
    const kandidat = terkumpul ? `${terkumpul} ${kal}` : kal;
    if (kandidat.length <= 240) {
      terkumpul = kandidat;
    } else {
      break;
    }
  }

  if (terkumpul.length >= 40) {
    return pastikanBukanAkhirSingkatan(terkumpul);
  }

  // Jika kalimat pertama saja > 240 karakter, potong di batas spasi sebelum 239 karakter
  let potong = bersih.slice(0, 239);
  const idxSpasi = potong.lastIndexOf(' ');
  if (idxSpasi > 60) {
    potong = potong.slice(0, idxSpasi);
  }

  // Jika kata paling akhir di potongan adalah singkatan berakhiran titik, mundurkan 1 kata
  potong = hapusSingkatanMenggantungDiAkhir(potong);
  potong = potong.replace(/[.,;:!?\s]+$/, '');
  return `${potong}…`;
}

function hapusSingkatanMenggantungDiAkhir(teks) {
  let hasil = teks.trim();
  while (true) {
    const match = hasil.match(/\s+([A-Za-z0-9.]+)\.$/);
    if (!match) break;
    const kata = match[1].toLowerCase().replace(/\./g, '');
    if (DAFTAR_SINGKATAN.has(kata) || kata.length === 1) {
      hasil = hasil.slice(0, hasil.length - match[0].length).trim();
    } else {
      break;
    }
  }
  return hasil;
}

function pastikanBukanAkhirSingkatan(teks) {
  const bersih = hapusSingkatanMenggantungDiAkhir(teks);
  if (bersih.length !== teks.trim().length) {
    return `${bersih.replace(/[.,;:!?\s]+$/, '')}…`;
  }
  return teks.trim();
}

function buatSlugDasar(namaTampil, kodeProvinsi) {
  const tanpaDiakritik = namaTampil
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const slugNama = tanpaDiakritik
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const dasar = slugNama || 'objek-budaya';
  return `${dasar}-${kodeProvinsi}`;
}

function jalankanClean() {
  console.log('Memulai pembersihan dan pengayaan data (Fase 2)...');

  // C-01: Muat data mentah
  const rawBudaya = bacaJsonMentah('budaya.json');
  const rawMeta = bacaJsonMentah('meta.json');
  const rawProvSummary = bacaJsonMentah('provinsi-summary.json');

  if (!Array.isArray(rawBudaya)) {
    throw new Error('Isi budaya.json harus berupa array.');
  }

  const totalMentah = rawBudaya.length;
  const mapProvinsiKode = new Map(REFERENSI_PROVINSI.map((p) => [p.nama, p.kode]));

  // Catatan audit pembersihan untuk reports/clean-report.md
  const logTitleCase = [];
  const logProvinsiTakCocok = [];
  const logTahun1970 = [];
  let jumlahGambarDihapus = 0;

  // Langkah C-02, C-03, C-04, C-05
  const tahap1 = rawBudaya.map((item) => {
    const namaAsli = normalisasiSpasi(item.nama);
    const namaTampil = keTitleCase(namaAsli);
    if (namaTampil !== namaAsli) {
      logTitleCase.push({ id: item.id, asli: namaAsli, tampil: namaTampil });
    }

    // C-02: trim dan normalisasi spasi ganda pada deskripsi tanpa mengubah huruf besar/kecil
    const deskripsiBersih = item.deskripsi ? String(item.deskripsi).trim().replace(/  +/g, ' ') : '';

    const provinsi = normalisasiSpasi(item.provinsi);
    const kodeProvinsi = mapProvinsiKode.get(provinsi) || null;
    if (!kodeProvinsi) {
      logProvinsiTakCocok.push({ id: item.id, provinsi });
    }

    const kabupaten = item.kabupaten ? normalisasiSpasi(item.kabupaten) : null;

    // C-04: Bersihkan tahun (1970 -> null)
    let tahunInput = item.tahun ?? null;
    if (tahunInput === 1970) {
      logTahun1970.push({ id: item.id, nama: namaAsli, provinsi, kabupaten });
      tahunInput = null;
    }

    // C-05: Hapus gambar
    if (item.gambar !== undefined) {
      jumlahGambarDihapus++;
    }

    const kategori = normalisasiSpasi(item.kategori);
    const jenis = normalisasiSpasi(item.jenis);

    return {
      id: normalisasiSpasi(item.id),
      kategori,
      jenis,
      nama: namaAsli,
      nama_tampil: namaTampil,
      deskripsi: deskripsiBersih,
      kode_provinsi: kodeProvinsi,
      provinsi,
      kabupaten: kabupaten || null,
      lat: item.lat ?? null,
      lng: item.lng ?? null,
      tahun_input: tahunInput
    };
  });

  // C-06: Hapus duplikat murni (nama lowercase + provinsi + kabupaten sama)
  const grupDedupMurni = new Map();
  for (const r of tahap1) {
    const kunci = `${r.nama.toLowerCase()}|${r.provinsi}|${r.kabupaten || ''}`;
    if (!grupDedupMurni.has(kunci)) {
      grupDedupMurni.set(kunci, []);
    }
    grupDedupMurni.get(kunci).push(r);
  }

  const setelahC06 = [];
  const logDuplikatMurni = [];

  for (const [kunci, daftar] of grupDedupMurni.entries()) {
    if (daftar.length === 1) {
      setelahC06.push(daftar[0]);
      continue;
    }
    // Urutkan: deskripsi terpanjang lebih dulu, lalu tahun_input terbaru
    const terurut = [...daftar].sort((a, b) => {
      if (b.deskripsi.length !== a.deskripsi.length) {
        return b.deskripsi.length - a.deskripsi.length;
      }
      return (b.tahun_input || 0) - (a.tahun_input || 0);
    });
    const disimpan = terurut[0];
    const dibuang = terurut.slice(1);
    setelahC06.push(disimpan);
    logDuplikatMurni.push({
      kunci,
      nama: disimpan.nama_tampil,
      provinsi: disimpan.provinsi,
      kabupaten: disimpan.kabupaten,
      id_disimpan: disimpan.id,
      panjang_disimpan: disimpan.deskripsi.length,
      id_dibuang: dibuang.map((d) => ({ id: d.id, panjang: d.deskripsi.length, tahun: d.tahun_input }))
    });
  }

  // Simpan snapshot setelah C-06 (sebelum C-07) untuk agregasi provinsi.json (sesuai aturan V-04)
  const rekamanSebelumC07 = [...setelahC06];

  // C-07: Kelompokkan tradisi multi-kabupaten dalam satu provinsi
  const grupPerProvNama = new Map();
  for (const r of setelahC06) {
    const kunci = `${r.kode_provinsi}|${r.kategori}|${r.jenis}|${r.nama.toLowerCase()}`;
    if (!grupPerProvNama.has(kunci)) {
      grupPerProvNama.set(kunci, []);
    }
    grupPerProvNama.get(kunci).push(r);
  }

  const setelahC07 = [];
  const logGabunganC07 = [];
  const logKandidatTakDigabung = [];

  for (const [, daftar] of grupPerProvNama.entries()) {
    if (daftar.length === 1) {
      const tunggal = daftar[0];
      setelahC07.push({
        ...tunggal,
        kabupaten_daftar: tunggal.kabupaten ? [tunggal.kabupaten] : [],
        jumlah_lokasi: 1,
        id_anggota: [tunggal.id]
      });
      continue;
    }

    // Cek apakah semua deskripsi 100% identik (baik kosong maupun teks sama persis)
    const deskripsiPertama = daftar[0].deskripsi;
    const semuaDeskripsiSama = daftar.every((item) => item.deskripsi === deskripsiPertama);
    const namaMemuatKurung = /\(.+\)/.test(daftar[0].nama);

    if (semuaDeskripsiSama || (namaMemuatKurung && semuaDeskripsiSama)) {
      // Urutkan anggota agar yang memiliki kabupaten non-null dan tahun terbaru menjadi induk
      const urutAnggota = [...daftar].sort((a, b) => {
        if (Boolean(b.kabupaten) !== Boolean(a.kabupaten)) {
          return a.kabupaten ? -1 : 1;
        }
        return (b.tahun_input || 0) - (a.tahun_input || 0);
      });

      const induk = urutAnggota[0];
      const kabupatenUnik = [...new Set(daftar.map((d) => d.kabupaten).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'id')
      );
      const idAnggota = daftar.map((d) => d.id);
      const jumlahLokasi = kabupatenUnik.length > 0 ? kabupatenUnik.length : 1;

      setelahC07.push({
        ...induk,
        kabupaten: kabupatenUnik[0] || induk.kabupaten || null,
        kabupaten_daftar: kabupatenUnik,
        jumlah_lokasi: jumlahLokasi,
        id_anggota: idAnggota
      });

      logGabunganC07.push({
        nama: induk.nama_tampil,
        provinsi: induk.provinsi,
        id_induk: induk.id,
        jumlah_anggota: idAnggota.length,
        jumlah_lokasi: jumlahLokasi,
        kabupaten_daftar: kabupatenUnik,
        id_anggota: idAnggota,
        alasan: deskripsiPertama.length === 0 ? 'Deskripsi sama-sama kosong' : 'Deskripsi 100% identik'
      });
    } else {
      // Deskripsi berbeda bermakna -> jangan digabung (sesuai aturan C-07)
      for (const item of daftar) {
        setelahC07.push({
          ...item,
          kabupaten_daftar: item.kabupaten ? [item.kabupaten] : [],
          jumlah_lokasi: 1,
          id_anggota: [item.id]
        });
      }
      logKandidatTakDigabung.push({
        nama: daftar[0].nama_tampil,
        provinsi: daftar[0].provinsi,
        jumlah_entri: daftar.length,
        alasan: 'Deskripsi berbeda bermakna antar entri',
        entri: daftar.map((d) => ({
          id: d.id,
          kabupaten: d.kabupaten,
          panjang_deskripsi: d.deskripsi.length
        }))
      });
    }
  }

  // C-08, C-09, C-10, C-11, C-12, C-13
  const slugTerpakai = new Set();
  const rekamanBersih = setelahC07.map((r) => {
    const panjangDeskripsi = r.deskripsi.length;
    const punyaDeskripsi = panjangDeskripsi >= 40;
    const ringkasan = buatRingkasan(r.deskripsi, punyaDeskripsi);

    let kelasKonten = 'kosong';
    if (panjangDeskripsi >= 300 && panjangDeskripsi <= 1200) {
      kelasKonten = 'unggulan';
    } else if (panjangDeskripsi >= 40 && panjangDeskripsi < 300) {
      kelasKonten = 'pendek';
    } else if (panjangDeskripsi > 1200) {
      kelasKonten = 'panjang';
    }

    const kategoriKode = KATEGORI_KODE_MAP[r.kategori] || 'OPK';
    const jenisKode = JENIS_KODE_MAP[r.jenis] || 'lainnya';

    const slugDasar = buatSlugDasar(r.nama_tampil, r.kode_provinsi);
    let slug = slugDasar;
    let counter = 2;
    while (slugTerpakai.has(slug)) {
      slug = `${slugDasar}-${counter}`;
      counter++;
    }
    slugTerpakai.add(slug);

    return {
      id: r.id,
      slug,
      kategori: r.kategori,
      kategori_kode: kategoriKode,
      jenis: r.jenis,
      jenis_kode: jenisKode,
      nama: r.nama,
      nama_tampil: r.nama_tampil,
      ringkasan,
      deskripsi: r.deskripsi,
      punya_deskripsi: punyaDeskripsi,
      panjang_deskripsi: panjangDeskripsi,
      kelas_konten: kelasKonten,
      kode_provinsi: r.kode_provinsi,
      provinsi: r.provinsi,
      kabupaten: r.kabupaten,
      kabupaten_daftar: r.kabupaten_daftar,
      jumlah_lokasi: r.jumlah_lokasi,
      id_anggota: r.id_anggota,
      lat: r.lat,
      lng: r.lng,
      tahun_input: r.tahun_input
    };
  });

  // C-13: Urutkan berdasarkan kode_provinsi, kategori_kode, nama_tampil (locale 'id')
  rekamanBersih.sort((a, b) => {
    if (a.kode_provinsi !== b.kode_provinsi) {
      return a.kode_provinsi.localeCompare(b.kode_provinsi, 'id');
    }
    if (a.kategori_kode !== b.kategori_kode) {
      return a.kategori_kode.localeCompare(b.kategori_kode, 'id');
    }
    return a.nama_tampil.localeCompare(b.nama_tampil, 'id');
  });

  // Ambil data SDM agregat per provinsi dari provinsi-summary.json
  const mapSdmProvinsi = new Map();
  for (const p of rawProvSummary.provinsi || []) {
    const sdm = p.kategori?.['SDM Kebudayaan (Agregat)'] || 0;
    mapSdmProvinsi.set(p.provinsi, sdm);
  }

  // Bangun provinsi.json (38 provinsi, urut kode, total sebelum C-07 sesuai V-04)
  const provinsiList = REFERENSI_PROVINSI.map((ref) => {
    const rekSebelum = rekamanSebelumC07.filter((r) => r.kode_provinsi === ref.kode);
    const rekSesudah = rekamanBersih.filter((r) => r.kode_provinsi === ref.kode);

    const perKategori = { OPK: 0, CB: 0, LB: 0, SP: 0 };
    const perJenisOpk = { kerajinan: 0, seni: 0, lisan: 0, pengetahuan: 0, adat: 0 };
    const perJenisCb = { benda: 0, bangunan: 0, struktur: 0, situs: 0, kawasan: 0 };
    const hitungKab = {};

    for (const r of rekSebelum) {
      const katKode = KATEGORI_KODE_MAP[r.kategori] || 'OPK';
      const jnsKode = JENIS_KODE_MAP[r.jenis];
      perKategori[katKode] = (perKategori[katKode] || 0) + 1;
      if (katKode === 'OPK' && jnsKode && perJenisOpk[jnsKode] !== undefined) {
        perJenisOpk[jnsKode]++;
      }
      if (katKode === 'CB' && jnsKode && perJenisCb[jnsKode] !== undefined) {
        perJenisCb[jnsKode]++;
      }
      if (r.kabupaten) {
        hitungKab[r.kabupaten] = (hitungKab[r.kabupaten] || 0) + 1;
      }
    }

    const kabupatenTeratas = Object.entries(hitungKab)
      .map(([nama, jumlah]) => ({ nama, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama, 'id'))
      .slice(0, 5);

    // Pilih sampai 3 unggulan_ids yang paling beragam jenis_kode-nya
    const kandidatUnggulan = rekSesudah.filter((r) => r.kelas_konten === 'unggulan');
    const unggulanIds = [];
    const jenisTerpilih = new Set();

    // Putaran 1: ambil jenis_kode yang berbeda-beda terlebih dahulu
    for (const u of kandidatUnggulan) {
      if (unggulanIds.length >= 3) break;
      if (!jenisTerpilih.has(u.jenis_kode)) {
        unggulanIds.push(u.id);
        jenisTerpilih.add(u.jenis_kode);
      }
    }
    // Putaran 2: jika belum 3, isi dari sisa kandidat unggulan
    for (const u of kandidatUnggulan) {
      if (unggulanIds.length >= 3) break;
      if (!unggulanIds.includes(u.id)) {
        unggulanIds.push(u.id);
      }
    }

    const total = rekSebelum.length;
    return {
      kode: ref.kode,
      nama: ref.nama,
      total,
      total_setelah_gabung: rekSesudah.length,
      per_kategori: perKategori,
      per_jenis_opk: perJenisOpk,
      per_jenis_cb: perJenisCb,
      sdm_agregat: mapSdmProvinsi.get(ref.nama) || 0,
      status_data: total > 0 ? 'ada' : 'belum_tercatat',
      peringkat_total: null,
      kabupaten_teratas: kabupatenTeratas,
      unggulan_ids: unggulanIds
    };
  });

  // Hitung peringkat_total berdasarkan total menurun
  const urutPeringkat = [...provinsiList]
    .filter((p) => p.total > 0)
    .sort((a, b) => b.total - a.total || a.kode.localeCompare(b.kode));
  urutPeringkat.forEach((p, idx) => {
    p.peringkat_total = idx + 1;
  });

  // Pastikan provinsiList tetap urut kode
  provinsiList.sort((a, b) => a.kode.localeCompare(b.kode));

  // Bangun kabupaten.json (agregat per kabupaten/kota dari rekamanSebelumC07)
  const mapKabupaten = new Map();
  let jumlahKabupatenNull = 0;

  for (const r of rekamanSebelumC07) {
    if (!r.kabupaten) {
      jumlahKabupatenNull++;
      continue;
    }
    const kunci = `${r.kabupaten}|${r.kode_provinsi}`;
    if (!mapKabupaten.has(kunci)) {
      mapKabupaten.set(kunci, {
        nama: r.kabupaten,
        kode_provinsi: r.kode_provinsi,
        provinsi: r.provinsi,
        jumlah: 0,
        per_kategori: { OPK: 0, CB: 0, LB: 0, SP: 0 }
      });
    }
    const item = mapKabupaten.get(kunci);
    const katKode = KATEGORI_KODE_MAP[r.kategori] || 'OPK';
    item.jumlah++;
    item.per_kategori[katKode] = (item.per_kategori[katKode] || 0) + 1;
  }

  const daftarKabupaten = [...mapKabupaten.values()].sort(
    (a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama, 'id')
  );

  const dataKabupaten = {
    total_kabupaten_tercatat: daftarKabupaten.length,
    rekaman_tanpa_kabupaten: jumlahKabupatenNull,
    kabupaten: daftarKabupaten
  };

  // Bangun statistik.json (DATA_SPEC.md Bagian 5.3 & V-13)
  const perKategoriSesudah = { OPK: 0, CB: 0, LB: 0, SP: 0 };
  const perJenisOpkSesudah = { kerajinan: 0, seni: 0, lisan: 0, pengetahuan: 0, adat: 0 };
  const kelasKontenHitungan = { unggulan: 0, pendek: 0, panjang: 0, kosong: 0 };

  for (const r of rekamanBersih) {
    perKategoriSesudah[r.kategori_kode] = (perKategoriSesudah[r.kategori_kode] || 0) + 1;
    if (r.kategori_kode === 'OPK' && perJenisOpkSesudah[r.jenis_kode] !== undefined) {
      perJenisOpkSesudah[r.jenis_kode]++;
    }
    kelasKontenHitungan[r.kelas_konten] = (kelasKontenHitungan[r.kelas_konten] || 0) + 1;
  }

  const perKategoriSebelum = { OPK: 0, CB: 0, LB: 0, SP: 0 };
  const perJenisOpkSebelum = { kerajinan: 0, seni: 0, lisan: 0, pengetahuan: 0, adat: 0 };
  for (const r of rekamanSebelumC07) {
    const katKode = KATEGORI_KODE_MAP[r.kategori] || 'OPK';
    const jnsKode = JENIS_KODE_MAP[r.jenis];
    perKategoriSebelum[katKode] = (perKategoriSebelum[katKode] || 0) + 1;
    if (katKode === 'OPK' && jnsKode && perJenisOpkSebelum[jnsKode] !== undefined) {
      perJenisOpkSebelum[jnsKode]++;
    }
  }

  // Gelombang input dihitung dari rekamanSebelumC07 (tanpa tahun null/1970)
  const hitungTahun = {};
  for (const r of rekamanSebelumC07) {
    if (r.tahun_input !== null) {
      hitungTahun[r.tahun_input] = (hitungTahun[r.tahun_input] || 0) + 1;
    }
  }
  const gelombangInput = Object.entries(hitungTahun)
    .map(([tahun, jumlah]) => ({ tahun: Number(tahun), jumlah }))
    .sort((a, b) => a.tahun - b.tahun);

  const totalSebelumGabung = rekamanSebelumC07.length;
  const kabTeratas = daftarKabupaten[0];
  const top3Prov = urutPeringkat.slice(0, 3);
  const top5Prov = urutPeringkat.slice(0, 5);
  const top3Sum = top3Prov.reduce((acc, p) => acc + p.total, 0);
  const top5Sum = top5Prov.reduce((acc, p) => acc + p.total, 0);

  const statistik = {
    total_rekaman: totalMentah,
    total_setelah_dedup_murni: totalSebelumGabung,
    total_setelah_gabung: rekamanBersih.length,
    total_sdm_agregat: rawMeta.jumlah_sdm_agregat || 5,
    // Sesuai V-13: jumlah per_kategori = total_setelah_gabung
    per_kategori: perKategoriSesudah,
    per_kategori_sebelum_gabung: perKategoriSebelum,
    per_jenis_opk: perJenisOpkSesudah,
    per_jenis_opk_sebelum_gabung: perJenisOpkSebelum,
    provinsi_berdata: urutPeringkat.length,
    provinsi_belum_tercatat: provinsiList.filter((p) => p.total === 0).length,
    daftar_belum_tercatat: provinsiList
      .filter((p) => p.total === 0)
      .map((p) => ({ kode: p.kode, nama: p.nama })),
    konsentrasi: {
      kabupaten_teratas: {
        nama: kabTeratas.nama,
        provinsi: kabTeratas.provinsi,
        jumlah: kabTeratas.jumlah,
        persen: Number(((kabTeratas.jumlah / totalMentah) * 100).toFixed(1))
      },
      top3_provinsi_persen: Number(((top3Sum / totalSebelumGabung) * 100).toFixed(1)),
      top5_provinsi_persen: Number(((top5Sum / totalSebelumGabung) * 100).toFixed(1)),
      top5_provinsi: top5Prov.map((p) => ({
        kode: p.kode,
        nama: p.nama,
        total: p.total,
        persen: Number(((p.total / totalSebelumGabung) * 100).toFixed(1))
      }))
    },
    gelombang_input: gelombangInput,
    kelas_konten: kelasKontenHitungan,
    tanggal_ambil: rawMeta.tanggal_ambil,
    tanggal_ambil_terformat: rawMeta.tanggal_ambil_terformat
  };

  // Bangun index-pencarian.json
  const indexPencarian = rekamanBersih.map((r) => {
    const teksCari = `${r.nama_tampil} ${r.provinsi} ${r.kabupaten_daftar.join(' ')} ${r.jenis}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return {
      id: r.id,
      slug: r.slug,
      nama: r.nama_tampil,
      provinsi: r.provinsi,
      kode_provinsi: r.kode_provinsi,
      kabupaten: r.kabupaten_daftar,
      kategori_kode: r.kategori_kode,
      jenis: r.jenis,
      jenis_kode: r.jenis_kode,
      kelas_konten: r.kelas_konten,
      kata_kunci: teksCari
    };
  });

  // Bangun meta.clean.json
  const metaClean = {
    ...rawMeta,
    versi_skema: '1.0',
    tanggal_pembersihan: new Date().toISOString(),
    hitungan_pembersihan: {
      total_mentah: totalMentah,
      duplikat_murni_dibuang: logDuplikatMurni.length,
      total_sebelum_gabung: totalSebelumGabung,
      grup_multi_kabupaten_digabung: logGabunganC07.length,
      rekaman_anggota_tergabung: totalSebelumGabung - rekamanBersih.length,
      total_bersih_akhir: rekamanBersih.length
    }
  };

  // Pastikan folder clean dan reports ada
  fs.mkdirSync(CLEAN_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // Tulis 6 berkas keluaran di public/data/clean/
  // budaya.clean.json minified sesuai DATA_SPEC.md Bagian 5
  fs.writeFileSync(path.join(CLEAN_DIR, 'budaya.clean.json'), JSON.stringify(rekamanBersih), 'utf8');
  fs.writeFileSync(path.join(CLEAN_DIR, 'provinsi.json'), JSON.stringify(provinsiList, null, 2), 'utf8');
  fs.writeFileSync(path.join(CLEAN_DIR, 'statistik.json'), JSON.stringify(statistik, null, 2), 'utf8');
  fs.writeFileSync(path.join(CLEAN_DIR, 'kabupaten.json'), JSON.stringify(dataKabupaten, null, 2), 'utf8');
  fs.writeFileSync(path.join(CLEAN_DIR, 'index-pencarian.json'), JSON.stringify(indexPencarian), 'utf8');
  fs.writeFileSync(path.join(CLEAN_DIR, 'meta.clean.json'), JSON.stringify(metaClean, null, 2), 'utf8');

  // Tulis reports/clean-report.md
  const laporanMd = buatLaporanCleanMd({
    totalMentah,
    logTitleCase,
    logProvinsiTakCocok,
    logTahun1970,
    jumlahGambarDihapus,
    logDuplikatMurni,
    totalSebelumGabung,
    logGabunganC07,
    logKandidatTakDigabung,
    rekamanBersih,
    kelasKontenHitungan
  });
  fs.writeFileSync(path.join(REPORTS_DIR, 'clean-report.md'), laporanMd, 'utf8');

  console.log('✓ Pembersihan selesai.');
  console.log(`  - Rekaman mentah         : ${totalMentah}`);
  console.log(`  - Setelah C-06 (dedup)   : ${totalSebelumGabung} (-${logDuplikatMurni.length} duplikat murni)`);
  console.log(`  - Setelah C-07 (gabung)  : ${rekamanBersih.length} (${logGabunganC07.length} entri induk multi-kabupaten)`);
  console.log(`  - Laporan tersimpan di   : ${path.join(REPORTS_DIR, 'clean-report.md')}`);
}

function buatLaporanCleanMd({
  totalMentah,
  logTitleCase,
  logProvinsiTakCocok,
  logTahun1970,
  jumlahGambarDihapus,
  logDuplikatMurni,
  totalSebelumGabung,
  logGabunganC07,
  logKandidatTakDigabung,
  rekamanBersih,
  kelasKontenHitungan
}) {
  const punyaDeskripsiCount = rekamanBersih.filter((r) => r.punya_deskripsi).length;
  const tanpaDeskripsiCount = rekamanBersih.length - punyaDeskripsiCount;

  const barisDedup = logDuplikatMurni
    .map(
      (d) =>
        `- **${d.nama}** (${d.kabupaten}, ${d.provinsi}): disimpan \`${d.id_disimpan}\` (${d.panjang_disimpan} kar), dibuang ${d.id_dibuang.map((x) => `\`${x.id}\` (${x.panjang} kar)`).join(', ')}`
    )
    .join('\n');

  const barisGabung = logGabunganC07
    .map(
      (g, i) =>
        `| ${i + 1} | ${g.nama} | ${g.provinsi} | ${g.jumlah_anggota} | ${g.jumlah_lokasi} | ${g.kabupaten_daftar.join(', ') || '(Lokasi kabupaten belum dicatat)'} | ${g.alasan} |`
    )
    .join('\n');

  const barisKandidat = logKandidatTakDigabung
    .map(
      (k) =>
        `- **${k.nama}** (${k.provinsi}, ${k.jumlah_entri} entri) — *${k.alasan}*: ${k.entri.map((e) => `\`${e.id.slice(0, 8)}\` (${e.kabupaten || 'null'}, ${e.panjang_deskripsi} kar)`).join(', ')}`
    )
    .join('\n');

  return `# Laporan Pembersihan & Pengayaan Data — Atlas Budaya (Fase 2)

- **Tanggal Pembersihan:** ${new Date().toISOString()}
- **Total Rekaman Mentah (\`budaya.json\`):** ${totalMentah}
- **Total Setelah Dedup Murni (C-06):** ${totalSebelumGabung} (dibuang ${logDuplikatMurni.length} rekaman)
- **Total Setelah Penggabungan Multi-Kabupaten (C-07):** ${rekamanBersih.length} (digabung dari ${totalSebelumGabung} rekaman)

---

## Ringkasan Eksekusi Aturan (C-01 s.d. C-13)

| ID | Aturan | Jumlah Terdampak / Hasil |
|---|---|---|
| C-01 | Muat data mentah | ${totalMentah} rekaman berhasil dimuat dari \`public/data/budaya.json\` |
| C-02 | Normalisasi teks & Title Case \`nama_tampil\` | ${logTitleCase.length} rekaman berhuruf kapital penuh diubah ke Title Case pada \`nama_tampil\` |
| C-03 | Validasi provinsi & tambah \`kode_provinsi\` | ${totalMentah - logProvinsiTakCocok.length}/${totalMentah} cocok (tidak cocok: ${logProvinsiTakCocok.length}) |
| C-04 | Bersihkan \`tahun\` → \`tahun_input\` | ${logTahun1970.length} rekaman bernilai \`1970\` diubah menjadi \`null\` |
| C-05 | Hapus field \`gambar\` | ${jumlahGambarDihapus} rekaman dibersihkan dari field \`gambar\` |
| C-06 | Hapus duplikat murni | ${logDuplikatMurni.length} rekaman duplikat murni dihapus (tersisa ${totalSebelumGabung}) |
| C-07 | Kelompokkan tradisi multi-kabupaten | ${logGabunganC07.length} grup digabung menjadi entri induk (mengurangi ${totalSebelumGabung - rekamanBersih.length} baris duplikat lintas kabupaten) |
| C-08 | Status deskripsi (\`punya_deskripsi\`) | \`true\`: ${punyaDeskripsiCount} rekaman (≥ 40 kar); \`false\`: ${tanpaDeskripsiCount} rekaman (< 40 kar) |
| C-09 | Ringkasan otomatis (≤ 240 kar, aman singkatan) | ${punyaDeskripsiCount} ringkasan dibuat, ${tanpaDeskripsiCount} bernilai \`null\` |
| C-10 | Kelas konten (\`kelas_konten\`) | \`unggulan\`: ${kelasKontenHitungan.unggulan}, \`pendek\`: ${kelasKontenHitungan.pendek}, \`panjang\`: ${kelasKontenHitungan.panjang}, \`kosong\`: ${kelasKontenHitungan.kosong} |
| C-11 | Klasifikasi tampilan (\`kategori_kode\`, \`jenis_kode\`) | ${rekamanBersih.length} rekaman diberi kode kategori & jenis |
| C-12 | Slug unik (\`slug\`) | ${rekamanBersih.length} slug unik berhasil dibuat |
| C-13 | Pengurutan rekaman | Diurutkan berdasarkan \`kode_provinsi\`, \`kategori_kode\`, \`nama_tampil\` |

---

## Detail C-04: Rekaman Tahun \`1970\` yang Diubah ke \`null\`
${logTahun1970.map((t) => `- \`${t.id}\` — **${t.nama}** (${t.kabupaten}, ${t.provinsi})`).join('\n')}

---

## Detail C-06: Duplikat Murni yang Dihapus (${logDuplikatMurni.length} Grup)
> Catatan untuk Validasi V-04: Selisih \`total\` pada \`provinsi.json\` terhadap \`provinsi-summary.json\` hanya terjadi pada 3 provinsi berikut masing-masing sebesar -1 rekaman akibat penghapusan duplikat murni C-06 (Banten: 5 → 4, Sulawesi Tenggara: 6 → 5, Jawa Tengah: 79 → 78).

${barisDedup}

---

## Detail C-07: Entri Gabungan Multi-Kabupaten (${logGabunganC07.length} Entri Induk)

| No | Nama Tampil | Provinsi | Jml Rekaman Asal | Jml Kabupaten | Daftar Kabupaten | Alasan Penggabungan |
|---|---|---|---|---|---|---|
${barisGabung}

### Kandidat Nama Sama yang TIDAK Digabung (${logKandidatTakDigabung.length} Grup dalam Provinsi Sama + 1 Lintas Provinsi)
Sesuai aturan C-07 (*"Jangan menggabung bila deskripsi berbeda bermakna"*):
${barisKandidat}
- **Bahasa Arab** (2 entri di provinsi berbeda: Jawa Tengah \`786df72b\` & Sumatera Barat \`59952b3b\`) — *Berbeda provinsi dan berbeda deskripsi*.

---

## Catatan Khusus Data Sumber
- Terdapat 1 rekaman di Provinsi Bali (\`7399f372-bc95-4342-bb2e-089355bd8fa7\`, Kab. Buleleng) yang memiliki \`nama: "#NAME?"\` dari sumber SPKT (kesalahan formula spreadsheet saat penginputan di SPKT untuk objek *"Uyah Amed / Garam Amed"*). Sesuai Aturan Emas 1 (*Jangan mengarang/mengubah isi data sumber*), nilai asli tetap dipertahankan.
`;
}

// Jalankan hanya jika dieksekusi langsung
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    jalankanClean();
  } catch (err) {
    console.error(`[ERROR CLEAN] ${err.message}`);
    process.exitCode = 1;
  }
}
