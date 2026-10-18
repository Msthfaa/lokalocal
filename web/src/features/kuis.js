/**
 * kuis.js — Pembuat soal kuis otomatis dari budaya.clean.json dan statistik.json
 * Sesuai WEB_SPEC.md Bagian 8.2 & Aturan Emas Dokumen Induk:
 * - 8 pertanyaan per sesi (proporsi seimbang Tipe A Asal Provinsi, Tipe B Jenis OPK, Tipe C Fakta Data)
 * - Mendukung pemilihan cakupan wilayah spesifik (Sumatera, Jawa, Kalimantan, Sulawesi, Bali-Nusa, Maluku-Papua, Semua Nusantara)
 * - Seluruh soal, opsi jawaban, dan penjelasan berakar 100% pada data resmi SPKT Kemendikbud/Kemenbud RI.
 */

import { DAFTAR_JENIS_OPK } from '../config.js';
import { formatAngka, formatPersen } from '../util/format.js';

export const JENIS_OPK_VALID = DAFTAR_JENIS_OPK.filter((j) => j.kode !== 'cagar');

export const WILAYAH_CONFIG = {
  semua: {
    kunci: 'semua',
    nama: 'Semua Nusantara',
    namaSingkat: 'Nusantara',
    ikon: '🇮🇩',
    subjudul: 'Ragam 38 Provinsi Seluruh Indonesia',
    kodeProvinsi: []
  },
  sumatera: {
    kunci: 'sumatera',
    nama: 'Sumatera • Gadang & Tenun',
    namaSingkat: 'Sumatera',
    ikon: '🌿',
    subjudul: 'Khasanah Andalas: Minangkabau, Melayu, Batak, & Sriwijaya',
    kodeProvinsi: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21']
  },
  jawa: {
    kunci: 'jawa',
    nama: 'Jawa • Candi & Wayang',
    namaSingkat: 'Jawa',
    ikon: '🏛️',
    subjudul: 'Khasanah Dwipantara: Keraton, Candi, Pewayangan, & Kriya Luhur',
    kodeProvinsi: ['31', '32', '33', '34', '35', '36']
  },
  kalimantan: {
    kunci: 'kalimantan',
    nama: 'Kalimantan • Dayak & Mandau',
    namaSingkat: 'Kalimantan',
    ikon: '🛶',
    subjudul: 'Khasanah Borneo: Mandau Pusaka, Anyaman Rotan, & Arsitektur Dayak-Banjar',
    kodeProvinsi: ['61', '62', '63', '64', '65']
  },
  sulawesi: {
    kunci: 'sulawesi',
    nama: 'Sulawesi • Tongkonan & Pinisi',
    namaSingkat: 'Sulawesi',
    ikon: '⛵',
    subjudul: 'Khasanah Celebes: Bahari Pinisi, Tongkonan Megah, & Kriya Sutra Lagosi',
    kodeProvinsi: ['71', '72', '73', '74', '75', '76']
  },
  bali_nusa: {
    kunci: 'bali_nusa',
    nama: 'Bali & Nusa Tenggara',
    namaSingkat: 'Bali & Nusa Tenggara',
    ikon: '🌊',
    subjudul: 'Khasanah Sunda Kecil: Seni Sakral Bali & Tenun Ikat Flobamora',
    kodeProvinsi: ['51', '52', '53']
  },
  maluku_papua: {
    kunci: 'maluku_papua',
    nama: 'Maluku & Papua',
    namaSingkat: 'Maluku & Papua',
    ikon: '🦜',
    subjudul: 'Khasanah Rempah & Cenderawasih: Sasadu, Tifa, & Ritus Sakral',
    kodeProvinsi: ['81', '82', '91', '92', '93', '94', '95', '96']
  }
};

/**
 * Mengacak salinan array menggunakan algoritma Fisher-Yates.
 * @param {Array} arr
 * @returns {Array}
 */
export function acakArray(arr) {
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
 * Bank soal fakta data SPKT berbasis wilayah (Tipe C) yang 100% faktual
 * dan dapat diverifikasi langsung dari file data lokal.
 */
export const BANK_SOAL_FAKTA_WILAYAH = {
  semua: [
    {
      id: 'fakta-semua-prov-terbanyak',
      tipe: 'C',
      labelTipe: 'Fakta Data SPKT',
      pertanyaan: 'Menurut tangkapan data SPKT per 9 Oktober 2026, provinsi manakah yang memiliki jumlah catatan budaya terbanyak di Indonesia?',
      petunjuk: 'Provinsi ini menyumbang 119 catatan budaya (sekitar 22% dari total rekaman nasional).',
      pilihan: ['Sumatera Barat', 'Jawa Tengah', 'Jawa Timur', 'Sulawesi Selatan'],
      jawabanBenar: 'Sumatera Barat',
      penjelasan: 'Sumatera Barat berada di urutan pertama dengan 119 catatan di SPKT — sebagian besar berasal dari aktifnya inventarisasi di Kota Pariaman.',
      kodeProvinsiTerkait: '13',
      rekamanTerkait: null
    },
    {
      id: 'fakta-semua-prov-belum',
      tipe: 'C',
      labelTipe: 'Fakta Data SPKT',
      pertanyaan: 'Dari 38 provinsi di Indonesia, berapa provinsi yang berstatus belum tercatat di dataset SPKT ini?',
      petunjuk: 'Ingat pesan utama situs ini: belum tercatat bukan berarti tidak memiliki budaya.',
      pilihan: ['10 provinsi', '3 provinsi', '15 provinsi', '20 provinsi'],
      jawabanBenar: '10 provinsi',
      penjelasan: 'Terdapat 10 provinsi yang belum memiliki rekaman pada tangkapan data SPKT per 9 Oktober 2026 (sementara 28 provinsi lainnya sudah memiliki catatan).',
      kodeProvinsiTerkait: '14',
      rekamanTerkait: null
    },
    {
      id: 'fakta-semua-kota-konsentrasi',
      tipe: 'C',
      labelTipe: 'Fakta Data SPKT',
      pertanyaan: 'Satu kota menyumbang sekitar 17% dari seluruh catatan budaya di dataset SPKT ini. Kota manakah itu?',
      petunjuk: 'Lima provinsi teratas bahkan menyumbang 58% dari seluruh rekaman nasional.',
      pilihan: ['Kota Pariaman', 'Kota Surakarta', 'Kota Yogyakarta', 'Kota Denpasar'],
      jawabanBenar: 'Kota Pariaman',
      penjelasan: 'Kota Pariaman di Sumatera Barat menyumbang 94 catatan (17,3%), memperlihatkan betapa aktifnya penginputan data aparatur kebudayaan di daerah tersebut.',
      kodeProvinsiTerkait: '13',
      rekamanTerkait: null
    },
    {
      id: 'fakta-semua-jenis-terbanyak',
      tipe: 'C',
      labelTipe: 'Fakta Data SPKT',
      pertanyaan: 'Menurut rekapitulasi SPKT pada dataset ini, jenis Objek Pemajuan Kebudayaan (OPK) manakah yang catatannya paling dominan?',
      petunjuk: 'Jenis ini mencakup kuliner tradisional, tenun, batik, anyaman, hingga senjata tradisional.',
      pilihan: [
        'Kemahiran dan Kerajinan Tradisional',
        'Seni Pertunjukan',
        'Tradisi Lisan & Bahasa',
        'Adat, Ritus & Perayaan'
      ],
      jawabanBenar: 'Kemahiran dan Kerajinan Tradisional',
      penjelasan: 'Kemahiran dan Kerajinan Tradisional menempati urutan teratas dengan 121 catatan unik setelah penggabungan.',
      kodeProvinsiTerkait: '11',
      rekamanTerkait: null
    }
  ],
  sumatera: [
    {
      id: 'fakta-sumatera-prov-terbanyak',
      tipe: 'C',
      labelTipe: 'Fakta Data Sumatera',
      pertanyaan: 'Berdasarkan data resmi SPKT per 9 Oktober 2026, provinsi manakah di Sumatera yang memiliki jumlah catatan budaya terbanyak?',
      petunjuk: 'Provinsi ini mencatatkan 119 warisan budaya, menjadikannya pemuncak rekaman budaya nasional di dataset ini.',
      pilihan: ['Sumatera Barat', 'Sumatera Utara', 'Aceh', 'Riau'],
      jawabanBenar: 'Sumatera Barat',
      penjelasan: 'Sumatera Barat menempati urutan pertama dengan 119 catatan budaya, terutama berkat aktifnya penginputan data budaya di Kota Pariaman.',
      kodeProvinsiTerkait: '13',
      rekamanTerkait: null
    },
    {
      id: 'fakta-sumatera-kota-pariaman',
      tipe: 'C',
      labelTipe: 'Fakta Data Sumatera',
      pertanyaan: 'Kota di Sumatera Barat manakah yang menyumbang 94 rekaman budaya (sekitar 17% dari total seluruh catatan budaya nasional di portal SPKT)?',
      petunjuk: 'Tingginya catatan di kota pesisir ini membuktikan bahwa data SPKT mencerminkan keaktifan inventarisasi daerah.',
      pilihan: ['Kota Pariaman', 'Kota Padang', 'Kota Bukittinggi', 'Kota Sawahlunto'],
      jawabanBenar: 'Kota Pariaman',
      penjelasan: 'Kota Pariaman mencatatkan 94 rekaman OPK (termasuk aneka kuliner, tenun, dan tradisi lokal), menjadikannya daerah paling aktif mencatatkan data ke portal pusat.',
      kodeProvinsiTerkait: '13',
      rekamanTerkait: null
    },
    {
      id: 'fakta-sumatera-prov-belum',
      tipe: 'C',
      labelTipe: 'Fakta Data Sumatera',
      pertanyaan: 'Dari 10 provinsi di Pulau Sumatera, dua provinsi manakah yang dalam tangkapan data SPKT ini belum memiliki catatan budaya?',
      petunjuk: 'Ingat pesan sosial Lokalocal: daerah yang belum tercatat bukan berarti tidak memiliki kekayaan budaya yang luhur.',
      pilihan: ['Riau dan Kepulauan Riau', 'Bengkulu dan Lampung', 'Aceh dan Sumatera Utara', 'Jambi dan Bangka Belitung'],
      jawabanBenar: 'Riau dan Kepulauan Riau',
      penjelasan: 'Provinsi Riau dan Kepulauan Riau berstatus belum tercatat di tangkapan data SPKT ini (0 rekaman), menjadi pengingat pentingnya pemerataan pendataan kebudayaan.',
      kodeProvinsiTerkait: '14',
      rekamanTerkait: null
    },
    {
      id: 'fakta-sumatera-opk-dominan',
      tipe: 'C',
      labelTipe: 'Fakta Data Sumatera',
      pertanyaan: 'Jenis Objek Pemajuan Kebudayaan (OPK) manakah yang paling banyak tercatat di Pulau Sumatera pada dataset ini?',
      petunjuk: 'Kategori ini meliputi kekayaan wastra tenun songket, sulam, kuliner pusaka, dan perkakas tradisional.',
      pilihan: ['Kemahiran dan Kerajinan Tradisional', 'Seni Pertunjukan', 'Adat, Ritus & Perayaan', 'Tradisi Lisan & Bahasa'],
      jawabanBenar: 'Kemahiran dan Kerajinan Tradisional',
      penjelasan: 'Kemahiran dan Kerajinan Tradisional mendominasi catatan Sumatera di SPKT dengan puluhan ragam tenun, kuliner, dan kriya lokal.',
      kodeProvinsiTerkait: '13',
      rekamanTerkait: null
    }
  ],
  jawa: [
    {
      id: 'fakta-jawa-cakupan-penuh',
      tipe: 'C',
      labelTipe: 'Fakta Data Jawa',
      pertanyaan: 'Dari 6 provinsi di Pulau Jawa (Banten, DKI Jakarta, Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur), berapa persen yang sudah memiliki catatan di SPKT?',
      petunjuk: 'Berbeda dari pulau-pulau lain yang memiliki celah provinsi kosong, Pulau Jawa memiliki sebaran pencatatan yang merata di tiap provinsinya.',
      pilihan: ['100% (Seluruh 6 Provinsi)', '66% (4 Provinsi)', '83% (5 Provinsi)', '50% (3 Provinsi)'],
      jawabanBenar: '100% (Seluruh 6 Provinsi)',
      penjelasan: 'Seluruh 6 provinsi di Pulau Jawa sudah memiliki catatan budaya di SPKT, menjadikan Pulau Jawa satu-satunya pulau besar dengan cakupan provinsi 100% berdata.',
      kodeProvinsiTerkait: '33',
      rekamanTerkait: null
    },
    {
      id: 'fakta-jawa-terbanyak',
      tipe: 'C',
      labelTipe: 'Fakta Data Jawa',
      pertanyaan: 'Provinsi manakah di Pulau Jawa yang memiliki jumlah catatan budaya terbanyak pada dataset SPKT ini?',
      petunjuk: 'Provinsi ini memiliki 58 catatan budaya di SPKT, mencakup aneka tradisi keraton, cagar budaya, dan seni pertunjukan.',
      pilihan: ['Jawa Tengah', 'Jawa Barat', 'DI Yogyakarta', 'DKI Jakarta'],
      jawabanBenar: 'Jawa Tengah',
      penjelasan: 'Jawa Tengah menempati posisi puncak di Pulau Jawa dengan 58 rekaman di SPKT, disusul oleh Jawa Timur dengan 47 rekaman.',
      kodeProvinsiTerkait: '33',
      rekamanTerkait: null
    },
    {
      id: 'fakta-jawa-cagar-budaya',
      tipe: 'C',
      labelTipe: 'Fakta Data Jawa',
      pertanyaan: 'Di Pulau Jawa, selain Objek Pemajuan Kebudayaan (OPK), SPKT juga mencatat Cagar Budaya. Mana di bawah ini yang merupakan klasifikasi resminya?',
      petunjuk: 'Cagar budaya mencakup peninggalan kebendaan fisik warisan leluhur yang bernilai sejarah.',
      pilihan: ['Bangunan, Struktur, dan Situs Cagar Budaya', 'Museum Seni dan Galeri', 'Sanggar Seni dan Padepokan', 'Komunitas Adat Terdaftar'],
      jawabanBenar: 'Bangunan, Struktur, dan Situs Cagar Budaya',
      penjelasan: 'Dalam dataset SPKT, Cagar Budaya diklasifikasikan menjadi 5 jenis: Benda, Bangunan, Struktur, Situs, dan Kawasan Cagar Budaya.',
      kodeProvinsiTerkait: '34',
      rekamanTerkait: null
    },
    {
      id: 'fakta-jawa-seni-wayang',
      tipe: 'C',
      labelTipe: 'Fakta Data Jawa',
      pertanyaan: 'Tradisi pewayangan dan lakon sastra tutur di Pulau Jawa tercatat di portal SPKT ke dalam jenis OPK...',
      petunjuk: 'Mencakup wayang kulit, wayang golek, ketoprak, dan tembang macapat.',
      pilihan: ['Seni Pertunjukan & Tradisi Lisan', 'Pengetahuan & Teknologi', 'Olahraga Tradisional', 'Permainan Rakyat'],
      jawabanBenar: 'Seni Pertunjukan & Tradisi Lisan',
      penjelasan: 'Ragam seni wayang dan sastra lakon Jawa tercatat sebagai Seni Pertunjukan serta Tradisi Lisan & Bahasa di portal resmi SPKT.',
      kodeProvinsiTerkait: '35',
      rekamanTerkait: null
    }
  ],
  kalimantan: [
    {
      id: 'fakta-kalimantan-cakupan',
      tipe: 'C',
      labelTipe: 'Fakta Data Kalimantan',
      pertanyaan: 'Bagaimanakah status keterisian catatan data SPKT untuk 5 provinsi di Pulau Kalimantan?',
      petunjuk: 'Kalbar, Kalteng, Kalsel, Kaltim, dan Kaltara seluruhnya telah terwakili dalam data.',
      pilihan: ['Seluruh 5 provinsi sudah memiliki catatan budaya', 'Hanya 2 provinsi yang tercatat', 'Terdapat 3 provinsi yang belum tercatat', 'Hanya Kalimantan Timur yang memiliki data'],
      jawabanBenar: 'Seluruh 5 provinsi sudah memiliki catatan budaya',
      penjelasan: 'Kelima provinsi di Pulau Kalimantan (Kalbar, Kalteng, Kalsel, Kaltim, Kaltara) seluruhnya telah memiliki rekaman di dataset SPKT.',
      kodeProvinsiTerkait: '63',
      rekamanTerkait: null
    },
    {
      id: 'fakta-kalimantan-terbanyak',
      tipe: 'C',
      labelTipe: 'Fakta Data Kalimantan',
      pertanyaan: 'Provinsi manakah di Pulau Kalimantan yang memiliki catatan budaya terbanyak di dataset SPKT ini?',
      petunjuk: 'Provinsi berjuluk Bumi Antasari ini mencatatkan 20 warisan budaya di portal SPKT.',
      pilihan: ['Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Barat', 'Kalimantan Tengah'],
      jawabanBenar: 'Kalimantan Selatan',
      penjelasan: 'Kalimantan Selatan menempati posisi teratas di Kalimantan dengan 20 catatan budaya di SPKT, disusul oleh Kalimantan Barat dan Kalimantan Timur.',
      kodeProvinsiTerkait: '63',
      rekamanTerkait: null
    },
    {
      id: 'fakta-kalimantan-mandau',
      tipe: 'C',
      labelTipe: 'Fakta Data Kalimantan',
      pertanyaan: 'Senjata pusaka berukir khas suku Dayak yang tercatat dalam kategori Kemahiran dan Kerajinan Tradisional di Kalimantan adalah...',
      petunjuk: 'Bilah senjata tradisional ini kerap dipadukan dengan sarung kayu berhias bulu burung enggang dan rajutan manik.',
      pilihan: ['Mandau', 'Badik', 'Rencong', 'Kujang'],
      jawabanBenar: 'Mandau',
      penjelasan: 'Mandau merupakan senjata pusaka tradisional masyarakat Dayak di Kalimantan yang diakui sebagai mahakarya Kemahiran dan Kerajinan Tradisional.',
      kodeProvinsiTerkait: '61',
      rekamanTerkait: null
    }
  ],
  sulawesi: [
    {
      id: 'fakta-sulawesi-belum-tercatat',
      tipe: 'C',
      labelTipe: 'Fakta Data Sulawesi',
      pertanyaan: 'Dari 6 provinsi di Pulau Sulawesi, dua provinsi manakah yang dalam tangkapan data SPKT ini belum memiliki catatan budaya?',
      petunjuk: 'Salah satunya berada di semenanjung utara dan yang satu lagi beribukota di Mamuju.',
      pilihan: ['Sulawesi Barat dan Sulawesi Utara', 'Sulawesi Selatan dan Sulawesi Tenggara', 'Sulawesi Tengah dan Gorontalo', 'Gorontalo dan Sulawesi Barat'],
      jawabanBenar: 'Sulawesi Barat dan Sulawesi Utara',
      penjelasan: 'Sulawesi Barat dan Sulawesi Utara berstatus belum tercatat pada dataset SPKT ini, sementara Sulsel, Sulteng, Sultra, dan Gorontalo sudah memiliki catatan.',
      kodeProvinsiTerkait: '76',
      rekamanTerkait: null
    },
    {
      id: 'fakta-sulawesi-terbanyak',
      tipe: 'C',
      labelTipe: 'Fakta Data Sulawesi',
      pertanyaan: 'Provinsi manakah di Pulau Sulawesi yang menyumbang catatan budaya terbanyak di dataset SPKT ini?',
      petunjuk: 'Provinsi ini mencatatkan 32 warisan budaya, mulai dari tradisi maritim hingga kriya tenun dan arsitektur adat.',
      pilihan: ['Sulawesi Selatan', 'Sulawesi Tengah', 'Sulawesi Tenggara', 'Gorontalo'],
      jawabanBenar: 'Sulawesi Selatan',
      penjelasan: 'Sulawesi Selatan memimpin di Pulau Sulawesi dengan 32 catatan budaya resmi di portal SPKT.',
      kodeProvinsiTerkait: '73',
      rekamanTerkait: null
    },
    {
      id: 'fakta-sulawesi-pinisi-tongkonan',
      tipe: 'C',
      labelTipe: 'Fakta Data Sulawesi',
      pertanyaan: 'Dua ikon budaya agung Sulawesi Selatan yang tersohor tercatat dalam khasanah kebudayaan Nusantara adalah...',
      petunjuk: 'Satu merupakan mahakarya perahu layar kayu penjelajah samudra dan satu lagi rumah adat beratap melengkung laksana haluan perahu.',
      pilihan: ['Perahu Pinisi dan Rumah Tongkonan', 'Kain Ulos dan Rumah Bolon', 'Perahu Sandeq dan Rumah Honai', 'Candi Penataran dan Gapura Bajang Ratu'],
      jawabanBenar: 'Perahu Pinisi dan Rumah Tongkonan',
      penjelasan: 'Perahu Pinisi (Bulukumba) dan Rumah Adat Tongkonan (Toraja) merupakan warisan luhur Sulawesi Selatan yang tersohor hingga kancah dunia.',
      kodeProvinsiTerkait: '73',
      rekamanTerkait: null
    }
  ],
  bali_nusa: [
    {
      id: 'fakta-balinusa-ntb-belum',
      tipe: 'C',
      labelTipe: 'Fakta Data Bali & Nusa',
      pertanyaan: 'Dari 3 provinsi di wilayah Bali dan Nusa Tenggara (Bali, NTB, NTT), provinsi manakah yang dalam dataset SPKT ini berstatus belum tercatat?',
      petunjuk: 'Provinsi kepulauan yang terkenal dengan Pulau Lombok dan Sumbawa ini belum memiliki rekaman di tangkapan data SPKT per 9 Oktober 2026.',
      pilihan: ['Nusa Tenggara Barat (NTB)', 'Nusa Tenggara Timur (NTT)', 'Bali', 'Seluruhnya sudah tercatat'],
      jawabanBenar: 'Nusa Tenggara Barat (NTB)',
      penjelasan: 'Nusa Tenggara Barat (NTB) berstatus belum tercatat di SPKT (0 data), sementara Bali (9 data) dan NTT (2 data) sudah memiliki rekaman budaya.',
      kodeProvinsiTerkait: '52',
      rekamanTerkait: null
    },
    {
      id: 'fakta-balinusa-total-bali',
      tipe: 'C',
      labelTipe: 'Fakta Data Bali & Nusa',
      pertanyaan: 'Berapa total rekaman budaya yang tercatat untuk Provinsi Bali pada tangkapan data resmi SPKT ini?',
      petunjuk: 'Angka ini mencerminkan rekaman awal yang terinventarisasi di portal pusat, mencakup seni pertunjukan dan kriya tradisi.',
      pilihan: ['9 catatan budaya', '35 catatan budaya', '120 catatan budaya', '0 catatan budaya'],
      jawabanBenar: '9 catatan budaya',
      penjelasan: 'Provinsi Bali memiliki 9 rekaman budaya di dataset SPKT ini, mencakup Ogoh-Ogoh, Okokan, Gending Ratu Anom, Payas Madya Tabanan, dan garam tradisi Kusamba.',
      kodeProvinsiTerkait: '51',
      rekamanTerkait: null
    },
    {
      id: 'fakta-balinusa-ntt-kriya',
      tipe: 'C',
      labelTipe: 'Fakta Data Bali & Nusa',
      pertanyaan: 'Provinsi Nusa Tenggara Timur (NTT) mencatatkan warisan budaya unik di SPKT berupa instrumen musik tradisi, salah satunya bernama...',
      petunjuk: 'Instrumen tradisi luhur dari bambu/kayu ini tercatat dalam Kemahiran dan Kerajinan Tradisional di portal SPKT.',
      pilihan: ['Knobe & Dungga Roro', 'Angklung & Calung', 'Sasando & Kolintang', 'Saluang & Bansi'],
      jawabanBenar: 'Knobe & Dungga Roro',
      penjelasan: 'Di dataset SPKT, NTT mencatatkan Dungga Roro dan Knobe ke dalam jenis Kemahiran dan Kerajinan Tradisional.',
      kodeProvinsiTerkait: '53',
      rekamanTerkait: null
    },
    {
      id: 'fakta-balinusa-ogoh-ogoh',
      tipe: 'C',
      labelTipe: 'Fakta Data Bali & Nusa',
      pertanyaan: 'Tradisi patung raksasa Ogoh-Ogoh yang diarak masyarakat Bali pada malam Pengerupukan sebelum Hari Raya Nyepi tercatat di SPKT sebagai...',
      petunjuk: 'Karya seni kreasi patung simbolik ini diarak keliling desa diiringi gamelan Bleganjur yang dinamis.',
      pilihan: ['Seni Pertunjukan', 'Cagar Budaya Benda', 'Permainan Rakyat', 'Olahraga Tradisional'],
      jawabanBenar: 'Seni Pertunjukan',
      penjelasan: 'Di dalam portal SPKT, Ogoh-Ogoh didaftarkan dan diklasifikasikan ke dalam jenis Seni Pertunjukan.',
      kodeProvinsiTerkait: '51',
      rekamanTerkait: null
    }
  ],
  maluku_papua: [
    {
      id: 'fakta-malukupapua-belum-tercatat',
      tipe: 'C',
      labelTipe: 'Fakta Data Maluku & Papua',
      pertanyaan: 'Dari 8 provinsi di kawasan Maluku dan Papua, berapa banyak provinsi yang berstatus belum tercatat pada tangkapan data SPKT ini?',
      petunjuk: 'Hanya ada tiga provinsi di kawasan timur ini yang telah memiliki catatan di dataset SPKT.',
      pilihan: ['5 provinsi belum tercatat', '2 provinsi belum tercatat', 'Seluruh 8 provinsi sudah tercatat', '7 provinsi belum tercatat'],
      jawabanBenar: '5 provinsi belum tercatat',
      penjelasan: 'Lima provinsi yaitu Maluku, Papua Barat, Papua Barat Daya, Papua Selatan, dan Papua Tengah belum memiliki data di SPKT pada tangkapan 9 Oktober 2026, sementara Maluku Utara, Papua, dan Papua Pegunungan sudah tercatat.',
      kodeProvinsiTerkait: '91',
      rekamanTerkait: null
    },
    {
      id: 'fakta-malukupapua-dua-tercatat',
      tipe: 'C',
      labelTipe: 'Fakta Data Maluku & Papua',
      pertanyaan: 'Provinsi di kawasan Maluku & Papua manakah yang memiliki catatan deskripsi tradisi terlengkap pada dataset SPKT ini?',
      petunjuk: 'Satu provinsi kesultanan rempah di utara dan satu provinsi di lembah pegunungan tengah Papua.',
      pilihan: ['Maluku Utara dan Papua Pegunungan', 'Maluku dan Papua Barat', 'Papua Barat Daya dan Papua Selatan', 'Papua Tengah dan Maluku'],
      jawabanBenar: 'Maluku Utara dan Papua Pegunungan',
      penjelasan: 'Maluku Utara (10 rekaman) dan Papua Pegunungan (7 rekaman) merupakan daerah di kawasan timur yang mencatatkan narasi deskripsi tradisi lengkap ke portal SPKT.',
      kodeProvinsiTerkait: '82',
      rekamanTerkait: null
    },
    {
      id: 'fakta-malukupapua-sasadu',
      tipe: 'C',
      labelTipe: 'Fakta Data Maluku & Papua',
      pertanyaan: 'Rumah adat musyawarah berstruktur kayu terbuka tanpa dinding khas masyarakat Suku Sahu di Maluku Utara yang tercatat di SPKT bernama...',
      petunjuk: 'Balai adat tradisional ini melambangkan keterbukaan, kerukunan bermusyawarah, dan kehangatan persaudaraan warga desa.',
      pilihan: ['Sasadu', 'Baileo', 'Honai', 'Tongkonan'],
      jawabanBenar: 'Sasadu',
      penjelasan: 'Sasadu tercatat di SPKT dari Maluku Utara dalam jenis Kemahiran dan Kerajinan Tradisional sebagai balai musyawarah dan ritus syukur panen.',
      kodeProvinsiTerkait: '82',
      rekamanTerkait: null
    },
    {
      id: 'fakta-malukupapua-apiwol',
      tipe: 'C',
      labelTipe: 'Fakta Data Maluku & Papua',
      pertanyaan: 'Di Provinsi Papua Pegunungan, SPKT mencatat ritus adat istiadat dan seni tari tradisi sakral Suku Ketengban di Pegunungan Bintang, yaitu...',
      petunjuk: 'Tradisi ini meliputi ritus Apiwol dan tari adat yang dilestarikan turun-temurun di dataran tinggi pegunungan timur Papua.',
      pilihan: ['Apiwol dan Tari Limne', 'Tari Yospan dan Sajojo', 'Upacara Bakar Batu dan Tari Perang', 'Tari Seka dan Pesta Ulat Sagu'],
      jawabanBenar: 'Apiwol dan Tari Limne',
      penjelasan: 'Apiwol (Adat, Ritus & Perayaan) dan Tari Limne tercatat di SPKT mewakili kearifan luhur Kabupaten Pegunungan Bintang, Papua Pegunungan.',
      kodeProvinsiTerkait: '95',
      rekamanTerkait: null
    }
  ]
};

/**
 * Menyaring rekaman dari budaya.clean.json yang memenuhi syarat ketat:
 * - kategori_kode === 'OPK'
 * - punya_deskripsi === true & ringkasan tersedia
 * - nama_tampil unik di seluruh dataset (tidak rancu)
 * - bukan nilai anomali seperti "#NAME?"
 * - berada di cakupan wilayah yang dipilih (jika bukan 'semua')
 *
 * @param {Array} daftarBudaya
 * @param {string} wilayah
 * @returns {Array}
 */
export function saringKandidatSoalKuis(daftarBudaya = [], wilayah = 'semua') {
  const hitungNama = new Map();
  for (const r of daftarBudaya) {
    const kunciNama = String(r.nama_tampil || r.nama || '').trim().toLowerCase();
    if (!kunciNama) continue;
    hitungNama.set(kunciNama, (hitungNama.get(kunciNama) || 0) + 1);
  }

  const kodeTarget = (wilayah !== 'semua' && WILAYAH_CONFIG[wilayah])
    ? WILAYAH_CONFIG[wilayah].kodeProvinsi
    : null;

  return daftarBudaya.filter((r) => {
    const kunciNama = String(r.nama_tampil || r.nama || '').trim().toLowerCase();
    if (!kunciNama || kunciNama.includes('#name')) return false;
    if ((hitungNama.get(kunciNama) || 0) !== 1) return false;
    if (r.kategori_kode !== 'OPK') return false;
    if (!r.punya_deskripsi || !r.ringkasan) return false;
    if (!JENIS_OPK_VALID.some((j) => j.kode === r.jenis_kode)) return false;
    if (kodeTarget && kodeTarget.length > 0 && !kodeTarget.includes(r.kode_provinsi)) return false;
    return true;
  });
}

/**
 * Menghitung ringkasan statistik spesifik untuk suatu wilayah
 * agar chip metrik di UI hero kuis selalu sinkron dan dinamis.
 *
 * @param {string} wilayah
 * @param {Array} daftarBudaya
 * @param {Array} daftarProvinsi
 * @returns {{ jumlahTradisi: number, jumlahProvinsi: number, jumlahSoal: number }}
 */
export function dapatkanStatistikWilayah(wilayah = 'semua', daftarBudaya = [], daftarProvinsi = []) {
  const wilayahKey = WILAYAH_CONFIG[wilayah] ? wilayah : 'semua';
  const kodeTarget = WILAYAH_CONFIG[wilayahKey].kodeProvinsi;

  const kandidat = saringKandidatSoalKuis(daftarBudaya, wilayahKey);
  const provs = (kodeTarget && kodeTarget.length > 0)
    ? daftarProvinsi.filter((p) => kodeTarget.includes(p.kode))
    : daftarProvinsi;

  return {
    jumlahTradisi: kandidat.length > 0 ? kandidat.length : (wilayahKey === 'semua' ? 205 : 10),
    jumlahProvinsi: provs.length || (wilayahKey === 'semua' ? 38 : 6),
    jumlahSoal: 8
  };
}

/**
 * Membangkitkan 8 soal kuis per sesi sesuai wilayah yang dipilih:
 * - Tipe A (Tebak Asal Provinsi dalam wilayah)
 * - Tipe B (Klasifikasi Jenis OPK tradisi wilayah)
 * - Tipe C (Fakta Data SPKT wilayah)
 *
 * @param {object} parameter
 * @param {Array} parameter.budaya - Isi budaya.clean.json
 * @param {Array} parameter.provinsi - Isi provinsi.json
 * @param {object} parameter.statistik - Isi statistik.json
 * @param {string} [parameter.wilayah='semua'] - Kunci wilayah yang dipilih
 * @returns {Array} Daftar 8 soal kuis siap pakai
 */
export function buatSesiKuis({ budaya = [], provinsi = [], statistik = {}, wilayah = 'semua' }) {
  const wilayahKey = WILAYAH_CONFIG[wilayah] ? wilayah : 'semua';
  const kandidat = acakArray(saringKandidatSoalKuis(budaya, wilayahKey));

  // Tentukan daftar nama provinsi untuk pengecoh Tipe A
  let daftarNamaProvinsi = [];
  if (wilayahKey === 'semua') {
    daftarNamaProvinsi = provinsi
      .filter((p) => p.status_data === 'ada' && p.total > 0)
      .map((p) => p.nama);
  } else {
    const targetKode = WILAYAH_CONFIG[wilayahKey].kodeProvinsi;
    const provWilayah = provinsi.filter((p) => targetKode.includes(p.kode)).map((p) => p.nama);

    // Bila provinsi di wilayah < 4 (seperti Bali & Nusa), sertakan tetangga kepulauan terdekat
    if (provWilayah.length < 4) {
      const cadanganDekat = ['Jawa Timur', 'Nusa Tenggara Barat', 'Bali', 'Nusa Tenggara Timur', 'Sulawesi Selatan'];
      daftarNamaProvinsi = Array.from(new Set([...provWilayah, ...cadanganDekat]));
    } else {
      daftarNamaProvinsi = provWilayah;
    }
  }

  // Tentukan alokasi jumlah soal per tipe agar selalu berjumlah tepat 8
  let targetTipeA = 4;
  let targetTipeB = 3;
  let targetTipeC = 1;

  if (wilayahKey === 'bali_nusa') {
    targetTipeA = 3;
    targetTipeB = 2;
    targetTipeC = 3;
  } else if (wilayahKey === 'maluku_papua') {
    targetTipeA = 3;
    targetTipeB = 3;
    targetTipeC = 2;
  }

  const daftarRekamanTerpakai = [];
  const soalTipeA = [];
  const soalTipeB = [];

  // 1. Susun Soal Tipe A: Tebak Asal Provinsi
  const provTipeA = new Set();
  for (const rek of kandidat) {
    if (soalTipeA.length >= targetTipeA) break;
    if (provTipeA.has(rek.kode_provinsi) && kandidat.length > 15) continue;

    provTipeA.add(rek.kode_provinsi);
    daftarRekamanTerpakai.push(rek);

    const pengecohProv = acakArray(
      daftarNamaProvinsi.filter((nama) => nama !== rek.provinsi)
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

  // 2. Susun Soal Tipe B: Klasifikasi Jenis OPK menurut SPKT
  const idTerpakai = new Set(daftarRekamanTerpakai.map((r) => r.id));
  const jenisTipeB = new Set();

  for (const rek of kandidat) {
    if (soalTipeB.length >= targetTipeB) break;
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

  // 3. Susun Soal Tipe C: Fakta Data Wilayah
  const bankWilayah = BANK_SOAL_FAKTA_WILAYAH[wilayahKey] || BANK_SOAL_FAKTA_WILAYAH.semua;
  const acakBankC = acakArray(bankWilayah);
  const sisaSlot = 8 - (soalTipeA.length + soalTipeB.length);
  const butuhC = Math.max(targetTipeC, sisaSlot);
  const soalTipeC = acakBankC.slice(0, butuhC);

  // Gabungkan dan pastikan total tepat 8 soal
  const gabungan = [...soalTipeA, ...soalTipeB, ...soalTipeC].slice(0, 8);
  return acakArray(gabungan);
}
