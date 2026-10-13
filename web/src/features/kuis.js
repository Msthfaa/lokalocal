/**
 * kuis.js — Pembuat soal kuis otomatis dari budaya.clean.json dan statistik.json
 * Sesuai WEB_SPEC.md Bagian 8.2:
 * - 8 pertanyaan per sesi (4 Tipe A Asal Provinsi, 3 Tipe B Jenis OPK, 1 Tipe C Fakta Data)
 * - Aturan kandidat soal (agar adil dan tidak menyesatkan):
 *   1. Hanya rekaman dengan kelas_konten ∈ {'unggulan', 'pendek'}
 *   2. jumlah_lokasi === 1
 *   3. Nama unik di seluruh data (tidak ada nama_tampil yang sama di provinsi lain/mana pun)
 * - Pertanyaan jenis OPK wajib diawali "Menurut SPKT, …"
 */

import { DAFTAR_JENIS_OPK } from '../config.js';
import { formatAngka, formatPersen } from '../util/format.js';

const JENIS_OPK_VALID = DAFTAR_JENIS_OPK.filter((j) => j.kode !== 'cagar');

/**
 * Mengacak salinan array menggunakan algoritma Fisher-Yates.
 * @param {Array} arr
 * @returns {Array}
 */
function acakArray(arr) {
  const salinan = [...arr];
  for (let i = salinan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  }
  return salinan;
}

/**
 * Menyamarkan nama provinsi apabila disebut secara eksplisit di dalam ringkasan
 * pada soal Tipe A (Tebak Asal Provinsi) agar petunjuk tetap adil.
 * @param {string} ringkasan
 * @param {string} namaProvinsi
 */
function samarkanProvinsiDiPetunjuk(ringkasan, namaProvinsi) {
  if (!ringkasan || !namaProvinsi) return ringkasan || '';
  const escaped = namaProvinsi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  return ringkasan.replace(regex, '[provinsi ini]');
}

/**
 * Menyaring rekaman dari budaya.clean.json yang memenuhi syarat ketat WEB_SPEC.md Bagian 8.2:
 * - kategori_kode === 'OPK'
 * - kelas_konten === 'unggulan' atau 'pendek'
 * - punya_deskripsi === true & ringkasan tersedia
 * - jumlah_lokasi === 1
 * - nama_tampil unik di seluruh dataset
 * - bukan nama anomali seperti "#NAME?"
 *
 * @param {Array} daftarBudaya
 * @returns {Array}
 */
export function saringKandidatSoalKuis(daftarBudaya = []) {
  const hitungNama = new Map();
  for (const r of daftarBudaya) {
    const kunciNama = String(r.nama_tampil || r.nama || '').trim().toLowerCase();
    if (!kunciNama) continue;
    hitungNama.set(kunciNama, (hitungNama.get(kunciNama) || 0) + 1);
  }

  return daftarBudaya.filter((r) => {
    const kunciNama = String(r.nama_tampil || r.nama || '').trim().toLowerCase();
    if (!kunciNama || kunciNama.includes('#name')) return false;
    if ((hitungNama.get(kunciNama) || 0) !== 1) return false;
    if (r.kategori_kode !== 'OPK') return false;
    if (r.kelas_konten !== 'unggulan' && r.kelas_konten !== 'pendek') return false;
    if (Number(r.jumlah_lokasi || 1) !== 1) return false;
    if (!r.punya_deskripsi || !r.ringkasan) return false;
    if (!JENIS_OPK_VALID.some((j) => j.kode === r.jenis_kode)) return false;
    return true;
  });
}

/**
 * Membuat 1 soal Tipe C (Fakta Data) dari statistik.json.
 * @param {object} statistik
 */
function buatSoalTipeCFaktaData(statistik) {
  const top5 = statistik?.konsentrasi?.top5_provinsi || [];
  const provTerbanyak = top5[0]?.nama || 'Sumatera Barat';
  const totalTerbanyak = top5[0]?.total || 119;
  const belumTercatat = statistik?.provinsi_belum_tercatat ?? 10;
  const kabTeratas = statistik?.konsentrasi?.kabupaten_teratas?.nama || 'Kota Pariaman';
  const persenKab = Math.round(statistik?.konsentrasi?.kabupaten_teratas?.persen || 17);
  const top5Persen = formatPersen(statistik?.konsentrasi?.top5_provinsi_persen ?? 58.2);

  const bankSoalC = [
    {
      id: 'fakta-prov-terbanyak',
      tipe: 'C',
      labelTipe: 'Fakta Data SPKT',
      pertanyaan: 'Menurut tangkapan data SPKT per 9 Oktober 2026, provinsi mana yang memiliki jumlah catatan budaya terbanyak?',
      petunjuk: `Provinsi ini menyumbang ${formatAngka(totalTerbanyak)} catatan (sekitar 22% dari total rekaman nasional).`,
      pilihan: acakArray(['Sumatera Barat', 'Jawa Tengah', 'Jawa Timur', 'Sulawesi Selatan']),
      jawabanBenar: provTerbanyak,
      penjelasan: `${provTerbanyak} berada di urutan pertama dengan ${formatAngka(totalTerbanyak)} catatan di SPKT — sebagian besar berasal dari aktifnya pendataan di ${kabTeratas}.`,
      kodeProvinsiTerkait: top5[0]?.kode || '13',
      rekamanTerkait: null
    },
    {
      id: 'fakta-prov-belum',
      tipe: 'C',
      labelTipe: 'Fakta Data SPKT',
      pertanyaan: 'Dari 38 provinsi di Indonesia, berapa provinsi yang berstatus belum tercatat di dataset SPKT ini?',
      petunjuk: 'Ingat pesan utama situs ini: belum tercatat bukan berarti tidak memiliki budaya.',
      pilihan: acakArray(['10 provinsi', '3 provinsi', '15 provinsi', '20 provinsi']),
      jawabanBenar: `${belumTercatat} provinsi`,
      penjelasan: `Terdapat ${belumTercatat} provinsi yang belum memiliki rekaman pada tangkapan data SPKT per 9 Oktober 2026 (sementara 28 provinsi lainnya sudah memiliki catatan).`,
      kodeProvinsiTerkait: '14',
      rekamanTerkait: null
    },
    {
      id: 'fakta-kota-konsentrasi',
      tipe: 'C',
      labelTipe: 'Fakta Data SPKT',
      pertanyaan: `Satu kota menyumbang sekitar ${persenKab}% dari seluruh catatan budaya di dataset SPKT ini. Kota manakah itu?`,
      petunjuk: `Lima provinsi teratas bahkan menyumbang ${top5Persen} dari seluruh rekaman.`,
      pilihan: acakArray(['Kota Pariaman', 'Kota Surakarta', 'Kota Yogyakarta', 'Kota Denpasar']),
      jawabanBenar: kabTeratas,
      penjelasan: `${kabTeratas} di Sumatera Barat menyumbang 94 catatan (${formatPersen(statistik?.konsentrasi?.kabupaten_teratas?.persen || 17.3)}), memperlihatkan betapa aktifnya penginputan data di daerah tersebut.`,
      kodeProvinsiTerkait: '13',
      rekamanTerkait: null
    },
    {
      id: 'fakta-jenis-terbanyak',
      tipe: 'C',
      labelTipe: 'Fakta Data SPKT',
      pertanyaan: 'Menurut rekapitulasi SPKT pada dataset ini, jenis Objek Pemajuan Kebudayaan (OPK) manakah yang jumlah catatannya paling banyak?',
      petunjuk: 'Jenis ini mencakup kuliner tradisional, tenun, batik, anyaman, hingga senjata tradisional.',
      pilihan: acakArray([
        'Kerajinan Tradisional',
        'Seni Pertunjukan',
        'Tradisi Lisan & Bahasa',
        'Adat, Ritus & Perayaan'
      ]),
      jawabanBenar: 'Kerajinan Tradisional',
      penjelasan: `Kemahiran dan Kerajinan Tradisional menempati urutan teratas dengan ${formatAngka(statistik?.per_jenis_opk?.kerajinan || 121)} catatan unik setelah penggabungan.`,
      kodeProvinsiTerkait: '11',
      rekamanTerkait: null
    }
  ];

  return bankSoalC[Math.floor(Math.random() * bankSoalC.length)];
}

/**
 * Membangkitkan 8 soal kuis per sesi tanpa duplikat objek budaya:
 * - 4 soal Tipe A (Asal Provinsi)
 * - 3 soal Tipe B (Jenis OPK menurut SPKT)
 * - 1 soal Tipe C (Fakta Data)
 *
 * @param {object} parameter
 * @param {Array} parameter.budaya - Isi budaya.clean.json
 * @param {Array} parameter.provinsi - Isi provinsi.json
 * @param {object} parameter.statistik - Isi statistik.json
 * @returns {Array} Daftar 8 soal kuis siap pakai
 */
export function buatSesiKuis({ budaya = [], provinsi = [], statistik = {} }) {
  const kandidat = acakArray(saringKandidatSoalKuis(budaya));

  // Daftar nama provinsi yang berdata (28 provinsi) untuk pengecoh soal Tipe A
  const namaProvinsiBerdata = provinsi
    .filter((p) => p.status_data === 'ada' && p.total > 0)
    .map((p) => p.nama);

  const daftarRekamanTerpakai = [];
  const soalTipeA = [];
  const soalTipeB = [];

  // Pilih 4 rekaman untuk Tipe A (usahakan dari provinsi berbeda)
  const provTipeA = new Set();
  for (const rek of kandidat) {
    if (soalTipeA.length >= 4) break;
    if (provTipeA.has(rek.kode_provinsi) && kandidat.length > 15) continue;

    provTipeA.add(rek.kode_provinsi);
    daftarRekamanTerpakai.push(rek);

    const pengecohProv = acakArray(
      namaProvinsiBerdata.filter((nama) => nama !== rek.provinsi)
    ).slice(0, 3);

    const pilihan = acakArray([rek.provinsi, ...pengecohProv]);

    soalTipeA.push({
      id: `soal-a-${rek.id}`,
      tipe: 'A',
      labelTipe: 'Tebak Asal Provinsi',
      pertanyaan: `"${rek.nama_tampil}" tercatat di SPKT dari provinsi mana?`,
      petunjuk: samarkanProvinsiDiPetunjuk(rek.ringkasan, rek.provinsi),
      pilihan,
      jawabanBenar: rek.provinsi,
      penjelasan: `"${rek.nama_tampil}" tercatat dari Provinsi ${rek.provinsi}. ${rek.ringkasan}`,
      kodeProvinsiTerkait: rek.kode_provinsi,
      rekamanTerkait: rek
    });
  }

  // Pilih 3 rekaman berbeda untuk Tipe B (Jenis OPK menurut SPKT)
  const idTerpakai = new Set(daftarRekamanTerpakai.map((r) => r.id));
  const jenisTipeB = new Set();

  for (const rek of kandidat) {
    if (soalTipeB.length >= 3) break;
    if (idTerpakai.has(rek.id)) continue;
    if (jenisTipeB.has(rek.jenis_kode) && kandidat.length > 20) continue;

    idTerpakai.add(rek.id);
    jenisTipeB.add(rek.jenis_kode);
    daftarRekamanTerpakai.push(rek);

    const infoBenar = JENIS_OPK_VALID.find((j) => j.kode === rek.jenis_kode);
    const labelBenar = infoBenar ? infoBenar.label : rek.jenis;

    const pengecohJenis = acakArray(
      JENIS_OPK_VALID.filter((j) => j.kode !== rek.jenis_kode).map((j) => j.label)
    ).slice(0, 3);

    const pilihan = acakArray([labelBenar, ...pengecohJenis]);

    soalTipeB.push({
      id: `soal-b-${rek.id}`,
      tipe: 'B',
      labelTipe: 'Klasifikasi SPKT',
      pertanyaan: `Menurut SPKT, "${rek.nama_tampil}" (dari ${rek.provinsi}) dikategorikan sebagai…`,
      petunjuk: rek.ringkasan,
      pilihan,
      jawabanBenar: labelBenar,
      penjelasan: `Menurut SPKT, "${rek.nama_tampil}" termasuk dalam jenis ${rek.jenis} (${labelBenar}).`,
      kodeProvinsiTerkait: rek.kode_provinsi,
      rekamanTerkait: rek
    });
  }

  const soalC = buatSoalTipeCFaktaData(statistik);

  // Gabungkan 4 Tipe A + 3 Tipe B + 1 Tipe C = 8 soal, lalu acak urutannya
  return acakArray([...soalTipeA, ...soalTipeB, soalC]);
}
