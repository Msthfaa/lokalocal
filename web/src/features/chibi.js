/**
 * features/chibi.js — Pengelola Karakter Adat Nusantara (Chibi Companion & Avatars)
 * Mengatur 8 representasi suku adat Indonesia dengan spektrum emosi lengkap
 * untuk Kuis Budaya, Paspor Budaya, Peta Jelajah, dan Empty Search State.
 */

export const DAFTAR_CHIBI = [
  {
    id: 'minang',
    nama: 'Uni Minang',
    panggilan: 'Uni',
    suku: 'Minangkabau',
    daerah: 'Sumatera Barat',
    salam: 'Rancak bana! Salamaik datang!',
    apresiasi: 'Rancak bana! Jawabanmu batua sabana batua!',
    semangat: 'Ondeh mande! Pantang suruik, ayo cubo baliak!',
    foto: '/assets/chibi/minang_netral.png',
    senang: '/assets/chibi/minang_senang.png',
    kaget: '/assets/chibi/minang_kaget.png',
    pikir: '/assets/chibi/minang_pikir.png',
    belakang: '/assets/chibi/minang_belakang.png'
  },
  {
    id: 'jawa',
    nama: 'Mas Bejo',
    panggilan: 'Mas',
    suku: 'Jawa',
    daerah: 'Jawa',
    salam: 'Sugeng rawuh sedulur!',
    apresiasi: 'Jos gandos! Panjenengan pancen pinter sanget!',
    semangat: 'Ampun susah nggih! Ayo dijajal maneh kanthi mantep!',
    foto: '/assets/chibi/jawa_netral.png',
    senang: '/assets/chibi/jawa_senang.png',
    kaget: '/assets/chibi/jawa_marah.png',
    pikir: '/assets/chibi/jawa_malu.png',
    belakang: '/assets/chibi/jawa_belakang.png'
  },
  {
    id: 'bali_wanita',
    nama: 'Ni Luh',
    panggilan: 'Mbok',
    suku: 'Bali',
    daerah: 'Bali',
    salam: 'Om Swastiastu!',
    apresiasi: 'Matur sukseme! Jawaban idadane becik pisan!',
    semangat: 'Sampunang sedih! Semangat, ayo cobi malih!',
    foto: '/assets/chibi/bali_wanita_netral.png',
    senang: '/assets/chibi/bali_wanita_senang.png',
    kaget: '/assets/chibi/bali_wanita_sedih.png',
    pikir: '/assets/chibi/bali_wanita_semangat.png',
    belakang: '/assets/chibi/bali_wanita_belakang.png'
  },
  {
    id: 'bali_pria',
    nama: 'Bli Dewa',
    panggilan: 'Bli',
    suku: 'Bali',
    daerah: 'Bali & Nusa Tenggara',
    salam: 'Om Swastiastu semeton!',
    apresiasi: 'Luung gati! Wawasan budaya semeton luar biasa!',
    semangat: 'De nyerah semeton, jalan terus melajah!',
    foto: '/assets/chibi/bali_pria_netral.png',
    senang: '/assets/chibi/bali_pria_senang.png',
    kaget: '/assets/chibi/bali_pria_kaget.png',
    pikir: '/assets/chibi/bali_pria_pikir.png',
    belakang: '/assets/chibi/bali_pria_belakang.png'
  },
  {
    id: 'batak',
    nama: 'Uda Batak',
    panggilan: 'Uda',
    suku: 'Batak',
    daerah: 'Sumatera Utara',
    salam: 'Horas tondi madingin!',
    apresiasi: 'Horas! Tabo nai rohangku, botul do caritami!',
    semangat: 'Unang mandele ito! Togu roham, coba ma muse!',
    foto: '/assets/chibi/batak_netral.png',
    senang: '/assets/chibi/batak_senang.png',
    kaget: '/assets/chibi/batak_marah.png',
    pikir: '/assets/chibi/batak_malu.png',
    belakang: '/assets/chibi/batak_belakang.png'
  },
  {
    id: 'papua',
    nama: 'Pace Papua',
    panggilan: 'Pace',
    suku: 'Papua',
    daerah: 'Papua & Maluku',
    salam: 'Koyo koya! Sa Papua!',
    apresiasi: 'Iyo kaskado! Ko pung wawasan budaya sadap skali!',
    semangat: 'Tra papa kawan! Tong coba lagi sampai dapa!',
    foto: '/assets/chibi/papua_netral.png',
    senang: '/assets/chibi/papua_senang.png',
    kaget: '/assets/chibi/papua_sedih.png',
    pikir: '/assets/chibi/papua_semangat.png',
    belakang: '/assets/chibi/papua_belakang.png'
  },
  {
    id: 'aceh',
    nama: 'Cut Kak',
    panggilan: 'Cut',
    suku: 'Aceh',
    daerah: 'Aceh',
    salam: 'Saleum teuka rakan bandum!',
    apresiasi: 'Get that! Cara rakan jaweueb teupat that!',
    semangat: 'Bèk putôh asa rakan! Ayô cuba lom beu meusampe!',
    foto: '/assets/chibi/aceh_netral.png',
    senang: '/assets/chibi/aceh_senang.png',
    kaget: '/assets/chibi/aceh_sedih.png',
    pikir: '/assets/chibi/aceh_senyum.png',
    belakang: '/assets/chibi/aceh_belakang.png'
  },
  {
    id: 'bugis',
    nama: 'Daeng Bugis',
    panggilan: 'Daeng',
    suku: 'Bugis-Makassar',
    daerah: 'Sulawesi Selatan',
    salam: 'Salama ki tapada salama!',
    apresiasi: 'Bajiki tongko! Ewako, caramu manjawab patut diacungi jempol!',
    semangat: 'Siri na pace! Jangan menyerah, ayo maju lagi!',
    foto: '/assets/chibi/bugis_netral.png',
    senang: '/assets/chibi/bugis_senang.png',
    kaget: '/assets/chibi/bugis_sedih.png',
    pikir: '/assets/chibi/bugis_senyum.png',
    belakang: '/assets/chibi/bugis_belakang.png'
  }
];

const KUNCI_STORAGE_AVATAR = 'lokalocal_avatar_chibi';

/**
 * Mengambil karakter berdasarkan ID
 * @param {string} id
 * @returns {object}
 */
export function dapatkanChibi(id) {
  return DAFTAR_CHIBI.find((c) => c.id === id) || DAFTAR_CHIBI[0];
}

/**
 * Mengambil avatar yang dipilih pengguna dari localStorage
 * @returns {object}
 */
export function ambilAvatarPengguna() {
  try {
    const idTersimpan = localStorage.getItem(KUNCI_STORAGE_AVATAR);
    if (idTersimpan) {
      const match = DAFTAR_CHIBI.find((c) => c.id === idTersimpan);
      if (match) return match;
    }
  } catch {
    // Abaikan error localStorage
  }
  return DAFTAR_CHIBI[0]; // Default: Uni Minang
}

/**
 * Menyimpan avatar pilihan pengguna ke localStorage
 * @param {string} id
 */
export function simpanAvatarPengguna(id) {
  try {
    localStorage.setItem(KUNCI_STORAGE_AVATAR, id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lokalocal-ganti-avatar', { detail: { id } }));
    }
  } catch {
    // Abaikan
  }
}

/**
 * Menemukan chibi yang paling mewakili suatu kode provinsi
 * @param {string|number} kodeProv
 * @returns {object}
 */
export function dapatkanChibiProvinsi(kodeProv) {
  const k = String(kodeProv).padStart(2, '0');
  // Aceh
  if (k === '11') return dapatkanChibi('aceh');
  // Sumatera Utara
  if (k === '12') return dapatkanChibi('batak');
  // Sumatera Barat & Sumatera Lainnya
  if (['13', '14', '15', '16', '17', '18', '19', '21'].includes(k)) return dapatkanChibi('minang');
  // Jawa
  if (['31', '32', '33', '34', '35', '36'].includes(k)) return dapatkanChibi('jawa');
  // Bali
  if (k === '51') return dapatkanChibi('bali_wanita');
  // Nusa Tenggara
  if (['52', '53'].includes(k)) return dapatkanChibi('bali_pria');
  // Kalimantan
  if (['61', '62', '63', '64', '65'].includes(k)) {
    return {
      ...dapatkanChibi('bugis'),
      nama: 'Ksatria Dayak',
      suku: 'Dayak',
      daerah: 'Kalimantan'
    };
  }
  // Sulawesi
  if (['71', '72', '73', '74', '75', '76'].includes(k)) return dapatkanChibi('bugis');
  // Maluku & Papua
  if (['81', '82', '91', '92', '93', '94', '95', '96'].includes(k)) return dapatkanChibi('papua');

  return dapatkanChibi('minang');
}
