/**
 * teks.js — Seluruh teks antarmuka & narasi dikelola di satu berkas
 * agar mudah disunting pengguna tanpa menyentuh logika (WEB_SPEC.md Bagian 12).
 */

import { NAMA_SITUS } from '../config.js';

export const TEKS = {
  situs: {
    nama: NAMA_SITUS,
    sloganInti: 'Budaya Indonesia tidak sedikit. Yang sedikit adalah yang sudah tercatat.',
    skipLink: 'Lompat ke konten utama'
  },

  nav: {
    ariaLabel: 'Navigasi utama',
    bukaMenu: 'Buka menu navigasi',
    tutupMenu: 'Tutup menu navigasi',
    item: [
      { id: 'cerita', label: 'Cerita', href: '#pembuka' },
      { id: 'jelajah', label: 'Jelajah', href: '#jelajah' },
      { id: 'paspor', label: 'Paspor', href: '#paspor-kuis' },
      { id: 'kuis', label: 'Kuis', href: '#paspor-kuis' }
    ],
    tombolTentangData: 'Tentang data'
  },

  s1Pembuka: {
    kicker: NAMA_SITUS,
    judul: 'Berapa banyak budaya Indonesia yang sudah tercatat?',
    buatSubjudul: (totalRekaman) =>
      `Kami membaca ${totalRekaman} catatan dari sistem pendataan resmi Kementerian Kebudayaan. Ada yang indah. Ada yang janggal.`,
    ctaMulai: 'Mulai menelusuri'
  },

  s2Nyala: {
    kicker: 'Bab 1 — Peta Menyala',
    langkah1: 'Satu per satu, provinsi yang sudah mencatat budayanya mulai menyala.',
    labelPenghitung: 'catatan budaya setelah pembersihan duplikat',
    buatLangkah3: (provinsiBerdata, totalProvinsi) =>
      `Tersebar di ${provinsiBerdata} dari ${totalProvinsi} provinsi.`,
    langkah4: 'Setiap warna adalah jenis budaya yang berbeda.'
  },

  s3Konsentrasi: {
    kicker: 'Bab 2 — Cahaya Tidak Merata',
    judul: 'Tapi cahayanya tidak merata.',
    buatTeksWaffle: (persenBulat, namaKabupaten, namaProvinsi) =>
      `Dari setiap 100 catatan, ${persenBulat} berasal dari satu kota: ${namaKabupaten}, ${namaProvinsi}.`,
    buatTeksTop5: (top5Persen) =>
      `Lima provinsi teratas menyumbang ${top5Persen}% dari seluruh catatan.`,
    catatanJujur:
      'Angka ini menunjukkan seberapa banyak yang sudah dicatat di dalam sistem, bukan seberapa kaya budaya sebuah daerah.'
  },

  s4Gelap: {
    kicker: 'Bab 3 — Yang Masih Gelap',
    buatJudul: (provinsiBelumTercatat) =>
      `${provinsiBelumTercatat} provinsi belum punya catatan di SPKT.`,
    narasi:
      'Belum tercatat bukan berarti tidak ada. Setiap provinsi ini punya tradisi, kerajinan, dan cerita. Catatannya yang belum sampai di sini.',
    labelStatusBelum: 'Belum tercatat di SPKT'
  },

  s5Jelajah: {
    kicker: 'Eksplorasi Data',
    judul: 'Jelajahi Peta & Catatan Budaya',
    subjudul:
      'Pilih provinsi di peta atau cari nama tradisi, kerajinan, dan cagar budaya untuk membaca kisah di baliknya.'
  },

  s6Kisah: {
    kicker: 'Kisah Pilihan',
    judul: 'Potret tradisi dari berbagai penjuru',
    subjudul:
      'Enam catatan pilihan dengan deskripsi lengkap dari berbagai provinsi dan jenis Objek Pemajuan Kebudayaan.'
  },

  s7PasporKuis: {
    kicker: 'Interaksi & Tantangan',
    judul: 'Paspor Budaya & Uji Pengetahuanmu',
    subjudul:
      'Kumpulkan stempel dari 38 provinsi yang kamu telusuri, lalu uji seberapa jauh kamu mengenal catatan budaya Nusantara.'
  },

  s8Penutup: {
    kicker: 'Jaga Ceritanya',
    judul: 'Budaya Indonesia tidak sedikit. Yang sedikit adalah yang sudah tercatat.',
    narasi:
      'Budaya hidup lewat cerita yang dituturkan. Kalau daerahmu belum banyak tercatat, kamu bisa ikut menjaga dan mendokumentasikan ceritanya.',
    ctaSpkt: 'Kunjungi SPKT Kementerian Kebudayaan',
    ctaBagikan: 'Bagikan halaman ini',
    ctaUlangi: 'Ulangi dari awal'
  },

  tentangData: {
    judulDialog: 'Tentang Data & Keterbatasan',
    disclaimerResmi:
      'Situs ini dibuat sebagai karya lomba dan tidak resmi, tidak berafiliasi dengan Kementerian Kebudayaan RI.',
    judulKeterbatasan: 'Keterbatasan Data (Transparansi)',
    butirKeterbatasan: [
      'Data hanya mencerminkan rekaman yang tercatat pada tangkapan publik SPKT per tanggal pengambilan.',
      'Tidak semua provinsi memiliki catatan di dataset ini (28 provinsi tercatat, 10 provinsi belum tercatat di SPKT pada saat pengambilan).',
      'Jumlah catatan sama sekali tidak mengukur kekayaan budaya suatu daerah, melainkan tingkat penginputan data ke sistem.',
      'Terdapat indikasi bahwa hasil tangkapan API pada kategori Cagar Budaya (65 rekaman, tepat 13 per jenis), Lembaga Budaya (3 rekaman), dan Sarana & Prasarana (3 rekaman) merupakan cuplikan halaman awal.',
      'Deskripsi ditampilkan apa adanya dari sumber SPKT; foto tidak tersedia karena data sumber hanya memuat path direktori tanpa nama berkas gambar.',
      'Angka tahun pada data merupakan tahun pencatatan ke sistem, bukan tahun lahirnya tradisi atau objek budaya.',
      'Data SDM Kebudayaan hanya ditampilkan sebagai jumlah agregat demi menjaga privasi.'
    ],
    judulPembuat: 'Tentang Pembuat',
    teksPembuat:
      'Disusun untuk Lomba Pembuatan Website bertema Sosial Budaya — menyajikan data terbuka menjadi pengalaman bercerita yang jujur dan mudah dijelajahi.'
  },

  errorData: {
    judul: 'Gagal memuat data budaya',
    pesan:
      'Kami mengalami kendala saat membaca berkas data lokal. Pastikan berkas data tersedia dan koneksi lokal berjalan normal.',
    tombolCobaLagi: 'Coba lagi'
  }
};
