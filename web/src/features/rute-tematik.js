/**
 * rute-tematik.js — Kurasi 3 Rute Cerita Tematik Nusantara (Story Trails)
 * Menyediakan alur penjelajahan terpandu melintasi pulau dengan sudut pandang tematik:
 * 1. Jalur Rempah & Maritim Nusantara
 * 2. Jejak Ritus Tari & Mistisisme Nusantara
 * 3. Mahakarya Kriya Tenun & Batik Pusaka
 */

export const DAFTAR_RUTE_TEMATIK = [
  {
    id: 'jalur-rempah',
    judul: 'Jalur Rempah & Maritim Nusantara',
    tagline: 'Mengikuti jejak bahari rempah yang mengubah peta perdagangan dunia',
    temaWarna: '#E0A96D',
    ikonSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    deskripsi: 'Menelusuri simpul pelabuhan niaga kuno dari kepulauan cengkeh dan pala di timur, kegagahan armada Pinisi di selat Makassar, hingga gerbang muara Sunda Kelapa.',
    titikKisah: [
      {
        urutan: 1,
        provinsiKode: '82',
        provinsiNama: 'Maluku Utara',
        judulTitik: 'Episentrum Rempah Dunia: Ternate & Tidore',
        fokusBudaya: 'Benteng Kastela, Cengkeh Afo, & Tradisi Kololi Kie',
        narasiKisah: 'Di kaki gunung berapi Gamalama dan Kie Matubu, pala dan cengkeh tumbuh liar memikat penjelajah dari Venesia, Gujarat, hingga Lisbon. Tradisi bahari Kololi Kie mengitari pulau dengan perahu kora-kora menjaga keharmonisan alam dan laut.',
        faktaSejarah: 'Pada abad ke-16, harga satu pon cengkeh di Eropa setara dengan emas murni, menjadikan Maluku Utara magnet perniagaan global.',
        posisiKamera: {
          lookAt: { x: 2.90, y: 0.15, z: -0.40 },
          pos: { x: 2.90, y: 2.2, z: 2.8 }
        }
      },
      {
        urutan: 2,
        provinsiKode: '73',
        provinsiNama: 'Sulawesi Selatan',
        judulTitik: 'Garda Samudra: Pinisi & Pelabuhan Somba Opu',
        fokusBudaya: 'Perahu Layar Pinisi, Balla Lompoa, & Aksara Lontaraq',
        narasiKisah: 'Para tukang kayu di Bulukumba merakit perahu Pinisi tanpa paku besi, mengandalkan pasak kayu ulin dan perhitungan intuisi leluhur. Kapal-kapal ini menghubungkan rempah dari kepulauan timur menuju pelabuhan Somba Opu yang kosmopolit.',
        faktaSejarah: 'Teknik pembuatan perahu Pinisi telah ditetapkan UNESCO sebagai Warisan Budaya Takbenda Dunia pada tahun 2017.',
        posisiKamera: {
          lookAt: { x: 1.13, y: 0.15, z: -0.20 },
          pos: { x: 1.13, y: 2.4, z: 3.2 }
        }
      },
      {
        urutan: 3,
        provinsiKode: '14',
        provinsiNama: 'Riau & Selat Malaka',
        judulTitik: 'Jalur Sutra Bahari: Selat Tersibuk Peradaban',
        fokusBudaya: 'Tradisi Bahari Melayu & Lentera Pendataan',
        narasiKisah: 'Selat Malaka adalah urat nadi perniagaan maritim dunia. Di sini kapal-kapal rempah berlabuh menanti angin muson. Wilayah Riau saat ini belum tercatat penuh di SPKT, menjadi panggilan bagi kita untuk menyalakan lentera dokumentasi.',
        faktaSejarah: 'Selat Malaka dilayari lebih dari 80.000 kapal setiap tahun, menjadikannya jalur perdagangan maritim paling strategis sejak ribuan tahun lalu.',
        posisiKamera: {
          lookAt: { x: -3.30, y: 0.15, z: -0.70 },
          pos: { x: -3.30, y: 2.3, z: 2.9 }
        }
      },
      {
        urutan: 4,
        provinsiKode: '31',
        provinsiNama: 'DKI Jakarta',
        judulTitik: 'Muara Pertemuan: Sunda Kelapa & Batavia',
        fokusBudaya: 'Pelabuhan Sunda Kelapa, Tari Topeng Betawi, & Musik Gambang Kromong',
        narasiKisah: 'Di muara Sungai Ciliwung, kapal-kapal phinisi bertiang kayu tinggi bersandar membongkar komoditas dari seantero pulau. Pelabuhan Sunda Kelapa menjadi saksi bertemunya pedagang Tionghoa, Arab, Melayu, dan Eropa membentuk kultur Betawi yang inklusif.',
        faktaSejarah: 'Sunda Kelapa telah beroperasi sejak abad ke-12 sebagai pelabuhan utama Kerajaan Sunda Pajajaran.',
        posisiKamera: {
          lookAt: { x: -2.30, y: 0.15, z: 0.85 },
          pos: { x: -2.30, y: 2.1, z: 3.6 }
        }
      }
    ]
  },
  {
    id: 'tari-mistis',
    judul: 'Jejak Ritus Tari & Mistisisme Nusantara',
    tagline: 'Menyingkap gerak sakral, topeng leluhur, dan dialog spiritual manusia dengan alam',
    temaWarna: '#C86A3D',
    ikonSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3c0 1.5 1 2.5 2 3.5l1 1 1-1c1-1 2-2 2-3.5a3 3 0 0 0-3-3z"/><path d="M19 12c-1.5 0-3 1-3 2.5s1 2.5 1 4.5c0 1.5-1 3-3 3s-3-1.5-3-3"/><path d="M5 12c1.5 0 3 1 3 2.5S7 17 7 19c0 1.5 1 3 3 3s3-1.5 3-3"/></svg>`,
    deskripsi: 'Menyusuri tarian yang lahir bukan sekadar hiburan, melainkan doa, penolak bala, dan medium penyerahan diri kepada Sang Pencipta.',
    titikKisah: [
      {
        urutan: 1,
        provinsiKode: '11',
        provinsiNama: 'Aceh',
        judulTitik: 'Harmoni Ribuan Tangan: Tari Saman Gayo',
        fokusBudaya: 'Tari Saman, Seudati, & Syair Penutur Kasih',
        narasiKisah: 'Ditarikan dalam posisi berbanjar rapat di atas lantai, Tari Saman menghentak dada dan paha dalam kecepatan sinkronisasi luar biasa. Dikembangkan oleh Syekh Saman sebagai media dakwah, tarian ini menuntut kekompakan mutlak dan kerendahan hati.',
        faktaSejarah: 'Tari Saman diakui UNESCO sebagai Karya Agung Warisan Budaya Lisan dan Nonbendawi Manusia pada tahun 2011.',
        posisiKamera: {
          lookAt: { x: -4.50, y: 0.15, z: -0.20 },
          pos: { x: -4.50, y: 2.4, z: 3.1 }
        }
      },
      {
        urutan: 2,
        provinsiKode: '35',
        provinsiNama: 'Jawa Timur',
        judulTitik: 'Kekuatan Magis Singo Barong: Reog Ponorogo',
        fokusBudaya: 'Reog Ponorogo, Seni Bantengan Pasuruan, & Tari Seblang',
        narasiKisah: 'Topeng dadak merak seberat 50 kilogram diangkat hanya menggunakan kekuatan gigi oleh penari Singo Barong. Reog melambangkan kritik politik, keteguhan batin, dan perlindungan desa dari mara bahaya spiritual.',
        faktaSejarah: 'Topeng Reog Ponorogo adalah salah satu topeng pertunjukan terberat dan terbesar di dunia yang digigit tanpa tali penopang bahu.',
        posisiKamera: {
          lookAt: { x: -1.30, y: 0.15, z: 1.30 },
          pos: { x: -1.30, y: 2.2, z: 4.1 }
        }
      },
      {
        urutan: 3,
        provinsiKode: '51',
        provinsiNama: 'Bali',
        judulTitik: 'Koor Api & Transendensi: Kecak & Sanghyang',
        fokusBudaya: 'Tari Kecak Uluwatu, Sanghyang Dedari, & Okokan Tabanan',
        narasiKisah: 'Puluhan pria bertelanjang dada duduk melingkar menyerukan ritme cak-cak-cak tanpa iringan alat musik logam. Berakar dari ritual pembersihan Sanghyang, Kecak memadukan kisah epik Ramayana dengan kekuatan transendensi api.',
        faktaSejarah: 'Tari Kecak tidak menggunakan gamelan sama sekali; instrumen pengiringnya 100% adalah harmoni vokal manusia polifonik.',
        posisiKamera: {
          lookAt: { x: 0.15, y: 0.15, z: 1.55 },
          pos: { x: 0.15, y: 2.1, z: 4.3 }
        }
      },
      {
        urutan: 4,
        provinsiKode: '64',
        provinsiNama: 'Kalimantan Timur',
        judulTitik: 'Topeng Pemanggil Kesuburan: Naq Hudoq Dayak',
        fokusBudaya: 'Ritus Hudoq Dayak Bahau & Musik Keringut',
        narasiKisah: 'Para penari berbalut daun pisang kering dengan topeng kayu paruh burung enggang meliuk di ladang. Tarian Hudoq adalah doa sakral memohon perlindungan tanaman padi dari hama dan ungkapan syukur kepada roh leluhur penjaga tanah.',
        faktaSejarah: 'Topeng Hudoq dipahat dari kayu jelutung ringan dengan rumbai bulu burung enggang yang melambangkan kesucian dan keberanian.',
        posisiKamera: {
          lookAt: { x: -0.40, y: 0.15, z: -0.80 },
          pos: { x: -0.40, y: 2.5, z: 2.7 }
        }
      }
    ]
  },
  {
    id: 'kriya-tekstil',
    judul: 'Mahakarya Kriya Tenun & Batik Pusaka',
    tagline: 'Menenun doa leluhur dan melukis kosmologi alam pada lembaran kain',
    temaWarna: '#C49A45',
    ikonSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/><path d="M4 12V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`,
    deskripsi: 'Menelusuri warisan helai benang Nusantara yang sarat makna sosial: dari kain pengurung jiwa di Batak hingga titik malam keraton Jawa.',
    titikKisah: [
      {
        urutan: 1,
        provinsiKode: '12',
        provinsiNama: 'Sumatera Utara',
        judulTitik: 'Kain Kehangatan Jiwa: Tenun Ulos Batak',
        fokusBudaya: 'Ulos Ragidup, Ulos Ragi Hotang, & Tenun Tradisi Toba',
        narasiKisah: 'Bagi masyarakat Batak, ada tiga sumber kehangatan: matahari, api, dan ulos. Ditenun helai demi helai menggunakan gedongan kayu, ulos disematkan dalam setiap fase daur hidup: kelahiran, pernikahan, hingga perpisahan raga.',
        faktaSejarah: 'Ulos Ragidup adalah jenis ulos tertinggi yang pembuatannya membutuhkan perhitungan astrologi Batak kuno.',
        posisiKamera: {
          lookAt: { x: -4.00, y: 0.15, z: -0.45 },
          pos: { x: -4.00, y: 2.4, z: 3.2 }
        }
      },
      {
        urutan: 2,
        provinsiKode: '13',
        provinsiNama: 'Sumatera Barat',
        judulTitik: 'Kilau Benang Emas: Songket Pandai Sikek',
        fokusBudaya: 'Songket Silungkang, Pandai Sikek, & Motif Kaluak Paku',
        narasiKisah: 'Di lereng Gunung Singgalang, para penenun perempuan merapatkan benang emas dan perak membentuk motif pucuk rebung dan kaluak paku. Setiap lekuk motif adalah petuah adat Minangkabau: alam takambang jadi guru.',
        faktaSejarah: 'Dibutuhkan waktu satu hingga tiga bulan untuk menenun selembar kain songket halus dengan tingkat kerapatan tinggi.',
        posisiKamera: {
          lookAt: { x: -3.60, y: 0.15, z: -0.30 },
          pos: { x: -3.60, y: 2.2, z: 3.2 }
        }
      },
      {
        urutan: 3,
        provinsiKode: '33',
        provinsiNama: 'Jawa Tengah & DI Yogyakarta',
        judulTitik: 'Goresan Canting Kosmologis: Batik Tulis Keraton',
        fokusBudaya: 'Batik Parang Rusak, Kawung, Sekaten, & Wayang Wong',
        narasiKisah: 'Aroma malam panas dan suara tiupan canting mengalir di gang-gang kota Solo dan Yogyakarta. Motif Parang Rusak yang melambangkan ombak samudera dulunya terlarang bagi orang di luar benteng keraton, menyimbolkan tekad yang tak pernah surut.',
        faktaSejarah: 'Batik Indonesia diakui UNESCO sebagai Warisan Kemanusiaan untuk Budaya Lisan dan Nonbendawi sejak 2 Oktober 2009.',
        posisiKamera: {
          lookAt: { x: -1.70, y: 0.15, z: 1.15 },
          pos: { x: -1.70, y: 2.1, z: 4.1 }
        }
      },
      {
        urutan: 4,
        provinsiKode: '53',
        provinsiNama: 'Nusa Tenggara Timur',
        judulTitik: 'Pewarna Akar & Pusaka Sumba: Tenun Ikat',
        fokusBudaya: 'Tenun Ikat Sumba, Pewarna Alami Mengkudu, & Alat Musik Knobe',
        narasiKisah: 'Kain tenun ikat Sumba diwarnai dengan akar pohon mengkudu untuk warna merah marun dan daun nila untuk biru malam. Bergambar kuda jantan perkasa, tengkorak leluhur, dan pohon andung, kain ini merekam silsilah kehormatan keluarga.',
        faktaSejarah: 'Proses perendaman pewarna alami tenun ikat Sumba dapat memakan waktu hingga berbulan-bulan demi menghasilkan warna yang tahan puluhan tahun.',
        posisiKamera: {
          lookAt: { x: 1.20, y: 0.15, z: 2.10 },
          pos: { x: 1.20, y: 2.2, z: 4.6 }
        }
      }
    ]
  }
];

/**
 * Mendapatkan data rute berdasarkan ID.
 */
export function dapatkanRuteById(id) {
  return DAFTAR_RUTE_TEMATIK.find(r => r.id === id) || null;
}
