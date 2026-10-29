/**
 * peringkat-paspor.js — Sistem Peringkat & Gelar Kehormatan Paspor Budaya (Gamification Tiers)
 * Menetapkan 7 tingkatan gelar kehormatan Nusantara berdasarkan progres 38 stempel provinsi.
 */

export const TINGKAT_GELAR = [
  {
    tingkat: 1,
    minStempel: 0,
    maxStempel: 0,
    gelar: 'Musafir Pemula',
    kicker: 'Tingkat 1 dari 6',
    lencana: 'Perintis Jejak',
    deskripsi: 'Buku paspor baru dibuka. Jelajahi relief peta kepulauan untuk menancapkan panji dan mengukir stempel pertamamu.',
    targetBerikutnya: 1
  },
  {
    tingkat: 2,
    minStempel: 1,
    maxStempel: 4,
    gelar: 'Musafir Pesisir',
    kicker: 'Tingkat 2 dari 6',
    lencana: 'Penghimpun Beranda',
    deskripsi: 'Langkah pertama mengarungi kepulauan, membuka lembaran pusaka tradisi dan meresapi denyut budaya perintis.',
    targetBerikutnya: 5
  },
  {
    tingkat: 3,
    minStempel: 5,
    maxStempel: 11,
    gelar: 'Penjelajah Samudra',
    kicker: 'Tingkat 3 dari 6',
    lencana: 'Pengarung Kepulauan',
    deskripsi: 'Mengarungi selat dan tanjung nusantara, menyelami ragam seni pertunjukan, arsitektur, dan adat istiadat leluhur.',
    targetBerikutnya: 12
  },
  {
    tingkat: 4,
    minStempel: 12,
    maxStempel: 21,
    gelar: 'Penjaga Cerita',
    kicker: 'Tingkat 4 dari 6',
    lencana: 'Perawat Memori',
    deskripsi: 'Merengkuh lebih dari sepertiga peradaban pertiwi, merawat ingatan lisan dan kisah lokal yang tak ternilai harganya.',
    targetBerikutnya: 22
  },
  {
    tingkat: 5,
    minStempel: 22,
    maxStempel: 30,
    gelar: 'Pujangga Nusantara',
    kicker: 'Tingkat 5 dari 6',
    lencana: 'Penenun Hikmah',
    deskripsi: 'Menghayati kedalaman filosofi tradisi, menenun pemahaman luhur lintas suku dari Sabang sampai Merauke.',
    targetBerikutnya: 31
  },
  {
    tingkat: 6,
    minStempel: 31,
    maxStempel: 37,
    gelar: 'Mpu Budaya',
    kicker: 'Tingkat 6 dari 6',
    lencana: 'Saksi Luhur',
    deskripsi: 'Hampir merengkuh seluruh cakrawala 38 provinsi kepulauan, menjadi saksi hidup keluhuran peradaban bangsa.',
    targetBerikutnya: 38
  },
  {
    tingkat: 7,
    minStempel: 38,
    maxStempel: 38,
    gelar: 'Mahaguru Adiluhung Nusantara',
    kicker: 'Gelar Paripurna Tertinggi',
    lencana: 'Ksatria Paripurna 38/38',
    deskripsi: 'Lengkap seluruh 38 provinsi! Penjaga sejati warisan budaya Nusantara yang berdedikasi merawat identitas bangsa.',
    targetBerikutnya: 38
  }
];

/**
 * Menghitung gelar peringkat kehormatan berdasarkan jumlah stempel yang dikoleksi.
 */
export function hitungPeringkatPaspor(totalStempel = 0, totalProvinsi = 38) {
  const jumlah = Math.max(0, Math.min(totalProvinsi, Number(totalStempel) || 0));

  for (let i = TINGKAT_GELAR.length - 1; i >= 0; i--) {
    const item = TINGKAT_GELAR[i];
    if (jumlah >= item.minStempel) {
      const sisaKeTarget = item.targetBerikutnya - jumlah;
      return {
        ...item,
        totalStempel: jumlah,
        totalProvinsi,
        isParipurna: jumlah >= totalProvinsi,
        sisaKeTarget: Math.max(0, sisaKeTarget),
        rasioProgres: Math.min(1, jumlah / totalProvinsi)
      };
    }
  }

  return {
    ...TINGKAT_GELAR[0],
    totalStempel: 0,
    totalProvinsi,
    isParipurna: false,
    sisaKeTarget: 1,
    rasioProgres: 0
  };
}
