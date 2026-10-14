/**
 * gambar-budaya.js — Kurasi URL foto Unsplash resmi bertema Kebudayaan Indonesia
 * Foto beresolusi tinggi, berlisensi gratis (Unsplash License), berbobot ringan (?w=650&q=80),
 * dan dicocokkan secara cerdas berdasarkan kata kunci nama budaya dan kategori OPK/Cagar Budaya.
 */

// Koleksi gambar terkurasi berdasarkan kategori & tema budaya nusantara
const GAMBAR_TEMA = {
  // Seni Tari & Pertunjukan
  tari_bali: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=700&q=80',
  tari_tradisional: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=700&q=80',
  tari_topeng: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=80',
  wayang: 'https://images.unsplash.com/photo-1507842229451-79714971a651?auto=format&fit=crop&w=700&q=80',
  gamelan: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=700&q=80',
  seni_umum: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=700&q=80',

  // Kerajinan Tangan
  batik: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=700&q=80',
  tenun: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?auto=format&fit=crop&w=700&q=80',
  anyaman_ukir: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=700&q=80',
  keramik: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=700&q=80',
  kerajinan_umum: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80',

  // Adat Istiadat, Ritus & Perayaan
  upacara_adat: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=700&q=80',
  pakaian_adat: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=700&q=80',
  perayaan_adat: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=700&q=80',
  adat_umum: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=700&q=80',

  // Pengetahuan Tradisional & Kuliner / Ramuan
  rempah_jamu: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=700&q=80',
  kuliner_nusantara: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=700&q=80',
  pertanian_alam: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=700&q=80',
  pengetahuan_umum: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=700&q=80',

  // Cagar Budaya & Arsitektur Tradisional
  candi_sejarah: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=700&q=80',
  rumah_adat: 'https://images.unsplash.com/photo-1565019091390-e5bf4280598a?auto=format&fit=crop&w=700&q=80',
  situs_kuno: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=700&q=80',
  cagar_umum: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=700&q=80',

  // Senjata Tradisional
  senjata_pusaka: 'https://images.unsplash.com/photo-1588693951525-6b22b2746f34?auto=format&fit=crop&w=700&q=80',

  // Tradisi Lisan & Sastra
  naskah_sastra: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=700&q=80',
  pantun_lisan: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=700&q=80'
};

/**
 * Cadangan kumpulan gambar fallback per jenis kategori
 */
const FALLBACK_PER_JENIS = {
  seni: [GAMBAR_TEMA.tari_bali, GAMBAR_TEMA.tari_tradisional, GAMBAR_TEMA.gamelan, GAMBAR_TEMA.seni_umum],
  kerajinan: [GAMBAR_TEMA.batik, GAMBAR_TEMA.tenun, GAMBAR_TEMA.anyaman_ukir, GAMBAR_TEMA.keramik],
  adat: [GAMBAR_TEMA.upacara_adat, GAMBAR_TEMA.pakaian_adat, GAMBAR_TEMA.perayaan_adat],
  pengetahuan: [GAMBAR_TEMA.rempah_jamu, GAMBAR_TEMA.kuliner_nusantara, GAMBAR_TEMA.pertanian_alam],
  lisan: [GAMBAR_TEMA.wayang, GAMBAR_TEMA.naskah_sastra, GAMBAR_TEMA.pantun_lisan],
  cagar: [GAMBAR_TEMA.candi_sejarah, GAMBAR_TEMA.rumah_adat, GAMBAR_TEMA.situs_kuno]
};

/**
 * Mendapatkan URL gambar Unsplash yang paling representatif untuk sebuah karya budaya.
 *
 * @param {object} rekaman - Objek budaya (memuat nama, jenis, kategori, id)
 * @returns {string} URL Unsplash beresolusi optimal
 */
export function dapatkanGambarBudaya(rekaman) {
  if (!rekaman) return GAMBAR_TEMA.tari_tradisional;

  const namaLower = String(rekaman.nama || rekaman.nama_tampil || '').toLowerCase();
  const jenis = String(rekaman.jenis || rekaman.kategori || '').toLowerCase();

  // 1. Pencocokan kata kunci spesifik
  if (/tari|dance|joget|tayub|gandrung|saman|piring|topeng|reog|jaipong|pendet|bedayo/.test(namaLower)) {
    if (namaLower.includes('topeng')) return GAMBAR_TEMA.tari_topeng;
    if (namaLower.includes('bali') || namaLower.includes('pendet')) return GAMBAR_TEMA.tari_bali;
    return GAMBAR_TEMA.tari_tradisional;
  }

  if (/wayang|kulit|golek|teater|ketoprak|makyong|randai|lenong/.test(namaLower)) {
    return GAMBAR_TEMA.wayang;
  }

  if (/gamelan|musik|angklung|sasando|kolintang|gendang|kendang|suling|rebana|gong/.test(namaLower)) {
    return GAMBAR_TEMA.gamelan;
  }

  if (/batik|canting/.test(namaLower)) {
    return GAMBAR_TEMA.batik;
  }

  if (/tenun|songket|ikat|tapis|ulos|kain/.test(namaLower)) {
    return GAMBAR_TEMA.tenun;
  }

  if (/ukir|kayu|anyaman|bambu|rotan|pahat/.test(namaLower)) {
    return GAMBAR_TEMA.anyaman_ukir;
  }

  if (/keris|rencong|mandau|badik|kujang|clurit|pedang|bedog|senjata/.test(namaLower)) {
    return GAMBAR_TEMA.senjata_pusaka;
  }

  if (/candi|benteng|istana|keraton|makam|prasasti|situs|gua/.test(namaLower)) {
    return GAMBAR_TEMA.candi_sejarah;
  }

  if (/rumah|arsitektur|saoraja|tongkonan|gadang|joglo|panggung/.test(namaLower)) {
    return GAMBAR_TEMA.rumah_adat;
  }

  if (/jamu|ramuan|rempah|obat|minyak|herbal/.test(namaLower)) {
    return GAMBAR_TEMA.rempah_jamu;
  }

  if (/makan|kuliner|rendang|soto|dodol|kopi|teh|garam|gula|pangan|nasi/.test(namaLower)) {
    return GAMBAR_TEMA.kuliner_nusantara;
  }

  if (/upacara|adat|ritus|nikah|perkawinan|kematian|ngaben|kasada|tabuik|kenduri/.test(namaLower)) {
    return GAMBAR_TEMA.upacara_adat;
  }

  if (/naskah|lontar|aksara|kitab|cerita|mitos|legenda|pantun|sastra/.test(namaLower)) {
    return GAMBAR_TEMA.naskah_sastra;
  }

  // 2. Fallback deterministik berbasis jenis kategori dan hash ID
  const pool = FALLBACK_PER_JENIS[jenis] || FALLBACK_PER_JENIS.seni;
  let hash = 0;
  const idStr = String(rekaman.id || rekaman.nama || '0');
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0;
  }
  const idx = hash % pool.length;

  return pool[idx] || GAMBAR_TEMA.tari_tradisional;
}
