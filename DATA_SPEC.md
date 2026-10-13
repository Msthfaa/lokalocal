# DATA_SPEC.md — Spesifikasi Data Atlas Budaya

> Dibaca bersama `AGENTS.md`. Dokumen ini mengatur Fase 1, 2, dan 3 (audit, pembersihan, aset peta).
> **Aturan utama:** data mentah di `public\data\` tidak boleh diubah. Semua hasil olahan ditulis ke `public\data\clean\`.

---

## 1. Sumber data mentah

Lokasi: `C:\Users\Tyoo\Documents\Lomba Programming\scraping\public\data`
Tanggal pengambilan: **9 Oktober 2026** (lihat `meta.json`).

### 1.1 `budaya.json` — data utama

Array berisi 544 objek. Semua objek punya 12 key yang sama:

| Key | Tipe | Terisi | Keterangan |
|---|---|---|---|
| `id` | string (UUID) | 544/544 | Unik semua |
| `kategori` | string | 544/544 | Salah satu dari 4 nilai (lihat 1.4) |
| `jenis` | string | 544/544 | Sub-klasifikasi, tergantung kategori |
| `nama` | string | 544/544 | Nama objek budaya |
| `deskripsi` | string | 413/544 | Banyak kosong; panjang 0 sampai 26.736 karakter |
| `provinsi` | string | 544/544 | 28 nilai berbeda |
| `kabupaten` | string/null | 508/544 | Awalan `Kab.` atau `Kota`; 36 null |
| `lat` | number/null | 2/544 | Praktis tidak ada |
| `lng` | number/null | 2/544 | Praktis tidak ada |
| `gambar` | string | 31/544 terisi | **Rusak**, lihat 2.4 |
| `tahun` | number | 544/544 | Tahun input data, BUKAN tahun budaya |
| `sumber` | string | 544/544 | Selalu `SPKT - Kementerian Kebudayaan RI` |

Contoh bentuk objek (deskripsi dipotong):
```json
{
  "id": "249a10ec-9e51-4dc8-9e16-cee84fb22ca5",
  "kategori": "Objek Pemajuan Kebudayaan",
  "jenis": "Adat Istiadat Masyarakat, Ritus, dan Perayaan",
  "nama": "Rangkaian Prosesi Pernikahan Adat Bugis",
  "deskripsi": "Rangkaian prosesi adat pernikahan masyarakat Bugis, khususnya di wilayah Kabupaten Barru, ...",
  "provinsi": "Sulawesi Selatan",
  "kabupaten": "Kab. Barru",
  "lat": null, "lng": null,
  "gambar": "[]",
  "tahun": 2026,
  "sumber": "SPKT - Kementerian Kebudayaan RI"
}
```

### 1.2 `meta.json`
Keys: `tanggal_ambil` (ISO), `tanggal_ambil_terformat`, `sumber`, `url_sumber`, `atribusi`, `jumlah_record` (544), `jumlah_sdm_agregat` (5), `jumlah_provinsi` (38), `kategori_summary` {kategori: jumlah}.
> Catatan: `jumlah_provinsi: 38` adalah jumlah provinsi **di daftar**, bukan provinsi yang berdata (hanya 28).

### 1.3 `opk-per-provinsi.json`
Keys: `total_objek_pemajuan` (473), `daftar_jenis_opk` (5 string), `rekap_per_jenis` {jenis: jumlah}, `data_per_provinsi` [{`provinsi`, `total_opk`, `jenis`: {jenis: jumlah}}] untuk 38 provinsi (10 di antaranya `total_opk: 0`, `jenis: {}`).

### 1.4 `provinsi-summary.json`
Keys: `ringkasan_nasional`, `provinsi` [{`provinsi`, `total_budaya`, `kategori`: {…, `SDM Kebudayaan (Agregat)`}}] (38 provinsi), `top_10_per_kategori`, `provinsi_data_paling_sedikit`.
> **Jangan pakai** `top_10_per_kategori` untuk "Lembaga Budaya" dan "Sarana & Prasarana": daftarnya diisi provinsi berangka 0 sebagai pengisi (padding), tidak bermakna.
> SDM Kebudayaan agregat: Jawa Tengah 2, Sulawesi Selatan 3 (total 5). Tampilkan hanya sebagai angka agregat.

### 1.5 Nilai kategori dan jenis yang valid

| `kategori` | Jumlah | Nilai `jenis` |
|---|---|---|
| Objek Pemajuan Kebudayaan | 473 | `Kemahiran dan Kerajinan Tradisional` (147), `Seni Pertunjukan` (118), `Tradisi dan Ekspresi Lisan` (99), `Pengetahuan dan Kebiasaan Perilaku Mengenai Alam Semesta` (78), `Adat Istiadat Masyarakat, Ritus, dan Perayaan` (31) |
| Cagar Budaya | 65 | `Benda`, `Bangunan`, `Struktur`, `Situs`, `Kawasan` (13 masing-masing) |
| Lembaga Budaya | 3 | `Non-Pemerintah` |
| Sarana & Prasarana | 3 | `Pemerintah` |

---

## 2. Masalah data yang sudah diketahui

### 2.1 Kemungkinan scraping terpotong (PRIORITAS TERTINGGI)
Cagar Budaya tepat 13 per jenis (13×5 = 65), Lembaga 3, Sarana 3. Pola serapi ini mencurigakan (kemungkinan batas halaman/limit). **Wajib diverifikasi di Fase 1** dengan membandingkan total di situs SPKT (angka diberikan pengguna). Jika terpotong: hentikan, laporkan, rekomendasikan crawl ulang. Jangan membangun fitur yang bergantung pada angka yang mungkin salah.

### 2.2 Konsentrasi ekstrem
- Kota Pariaman: 94 rekaman (±17% dari 544). Kota Solok: 21. Keduanya di Sumatera Barat (total provinsi 119 = 22%).
- Kab. Boyolali 34, Kab. Barru 25, Kota Pontianak 22, Kab. Wonogiri 21.
- 5 provinsi teratas (Sumbar 119, Jateng 79, Jatim 41, Sulsel 39, Jabar 38/Kalbar 38) ≈ 58% total.
- **Implikasi:** skala warna linear akan membuat hampir semua provinsi tampak "kosong". Gunakan skala akar kuadrat atau logaritmik (lihat `WEB_SPEC.md` bagian 5).

### 2.3 Koordinat
Hanya 2 rekaman punya lat/lng (Museum Kayu Tuah Himba, Masjid Agung Baiturahim Gorontalo). Jangan membuat peta titik. Gunakan agregasi per provinsi, dan opsional titik tengah kabupaten.

### 2.4 Field `gambar` rusak
Isinya string JSON berisi array objek `{ "path": "...", "nama": "" }`. `path` hanya berupa alamat folder (`https://app.dapobud.kemenbud.go.id/storage/`) tanpa nama file, dan `nama` kosong. **Tidak ada gambar yang bisa ditampilkan.** Pada hasil bersih: hapus field `gambar`, ganti dengan `punya_gambar_sumber: false` (atau abaikan sepenuhnya).
Jangan mencoba menebak nama file atau mengakses `app.dapobud.kemenbud.go.id`.

### 2.5 Deskripsi
- 131 kosong: seluruh 65 Cagar Budaya, 65 OPK, 1 Sarana & Prasarana.
- 156 rekaman berdeskripsi di bawah 100 karakter. 140 di atas 1.500 karakter. Maksimum 26.736 karakter (OKOKAN), lalu 17.821 (Aksara Jawa), 17.305, 14.001, 11.115.
- Tidak ada tag HTML, tidak ada newline di deskripsi.
- Sekitar 161 rekaman berdeskripsi 300–1.200 karakter: kandidat konten unggulan.
- Deskripsi panjang mungkin mengandung kata etimologis dan istilah lokal bertanda `’`/`"`. Pertahankan teks apa adanya (jangan "memperbaiki" ejaan).

### 2.6 Tahun
`tahun` = tahun data diinput ke SPKT. Sebaran: 2010 (23), 2013 (18), 2017 (19), 2021 (63), 2022 (25), 2024 (20), 2025 (62), 2026 (246), dan lainnya. Ada satu nilai `1970` (kemungkinan epoch 0 akibat tanggal kosong) → perlakukan sebagai `null`.
Boleh dipakai untuk narasi "gelombang pencatatan" (kapan data dimasukkan), **dilarang** dipakai sebagai "tahun asal budaya".

### 2.7 Duplikat dan entri berulang
- 3 duplikat murni (nama + provinsi + kabupaten sama): "jamjuri dan junenah" (Kota Cilegon), "rambi wuna" (Kab. Buton Utara), "lagu pantai widuri" (Kab. Pemalang).
- 34 nama berulang. Banyak bukan duplikat melainkan **tradisi yang sama di banyak kabupaten** (contoh: "Bantengan (Pasuruan)" tercatat 9 kali di Jawa Timur untuk kabupaten berbeda, tahun 2018, deskripsi kosong). Beberapa nama sama muncul 2–4 kali (Batik Garutan 4, Clurit 4, Saoraja Lapinceng 3).
- Perlakuan: lihat aturan C-06 dan C-07.

### 2.8 Kabupaten null
36 rekaman tidak punya kabupaten. Biarkan `null`; jangan ditebak.

### 2.9 Provinsi tanpa data (10)
Kepulauan Riau, Maluku, Nusa Tenggara Barat, Papua Barat, Papua Barat Daya, Papua Selatan, Papua Tengah, Riau, Sulawesi Barat, Sulawesi Utara. Perlu tetap ada di semua keluaran (dengan nilai 0) agar peta lengkap 38 provinsi.

---

## 3. Referensi 38 provinsi (kode Kemendagri/BPS)

Gunakan tabel ini sebagai **satu-satunya daftar rujukan** nama ↔ kode. Nama harus **persis** sama dengan nilai `provinsi` di data.

| Kode | Nama di data | Kode | Nama di data |
|---|---|---|---|
| 11 | Aceh | 61 | Kalimantan Barat |
| 12 | Sumatera Utara | 62 | Kalimantan Tengah |
| 13 | Sumatera Barat | 63 | Kalimantan Selatan |
| 14 | Riau | 64 | Kalimantan Timur |
| 15 | Jambi | 65 | Kalimantan Utara |
| 16 | Sumatera Selatan | 71 | Sulawesi Utara |
| 17 | Bengkulu | 72 | Sulawesi Tengah |
| 18 | Lampung | 73 | Sulawesi Selatan |
| 19 | Kepulauan Bangka Belitung | 74 | Sulawesi Tenggara |
| 21 | Kepulauan Riau | 75 | Gorontalo |
| 31 | DKI Jakarta | 76 | Sulawesi Barat |
| 32 | Jawa Barat | 81 | Maluku |
| 33 | Jawa Tengah | 82 | Maluku Utara |
| 34 | DI Yogyakarta | 91 | Papua |
| 35 | Jawa Timur | 92 | Papua Barat |
| 36 | Banten | 93 | Papua Selatan |
| 51 | Bali | 94 | Papua Tengah |
| 52 | Nusa Tenggara Barat | 95 | Papua Pegunungan |
| 53 | Nusa Tenggara Timur | 96 | Papua Barat Daya |

Total: 38. Jika ada nilai `provinsi` di data yang tidak ada di tabel ini, **laporkan** (jangan diam-diam diubah).

---

## 4. Aturan pembersihan (`tools\clean.mjs`)

Urutan eksekusi penting. Setiap aturan mencatat jumlah rekaman yang terdampak ke `reports\clean-report.md`.

| ID | Aturan | Detail |
|---|---|---|
| C-01 | Muat data mentah | Baca `budaya.json` UTF-8. Hentikan dengan pesan jelas jika gagal parse |
| C-02 | Normalisasi teks | `trim()` di semua string; ganti spasi ganda menjadi satu; **jangan** ubah huruf besar/kecil isi `deskripsi`. Untuk `nama` yang seluruhnya huruf besar (mis. "KAWASAN KOTA TUA KALIANGET", "LEMBAGA ADAT SUKU DAYAK MERATUS") ubah ke Title Case **hanya untuk field tampilan** `nama_tampil`; simpan aslinya di `nama` |
| C-03 | Validasi provinsi | Cocokkan setiap `provinsi` ke tabel bagian 3, tambahkan `kode_provinsi`. Tidak cocok → laporkan, jangan hapus |
| C-04 | Bersihkan tahun | `1970` → `null`. Ganti nama field menjadi `tahun_input` |
| C-05 | Hapus `gambar` | Hapus field. Tidak ada pengganti |
| C-06 | Hapus duplikat murni | Kunci: `nama` (lowercase, trim) + `provinsi` + `kabupaten`. Simpan yang deskripsinya lebih panjang; jika sama, simpan yang `tahun` lebih baru. Catat ID yang dibuang |
| C-07 | Kelompokkan tradisi multi-kabupaten | Rekaman dengan nama dasar sama dalam satu provinsi, kabupaten berbeda, dan salah satu cirinya: nama memuat kurung seperti "(Pasuruan)", atau deskripsi kosong yang sama → gabungkan menjadi satu **entri induk** dengan `kabupaten_daftar: [...]` dan `jumlah_lokasi`. Pertahankan ID semua anggota di `id_anggota`. **Jangan** menggabung bila deskripsi berbeda bermakna (itu mungkin objek berbeda). Jika ragu, jangan gabungkan, cantumkan di laporan sebagai "kandidat" |
| C-08 | Status deskripsi | Tambah `punya_deskripsi` (boolean, true bila panjang ≥ 40 karakter) dan `panjang_deskripsi` (angka) |
| C-09 | Ringkasan otomatis | Buat `ringkasan` ≤ 240 karakter: ambil kalimat-kalimat awal deskripsi sampai batas. **Pemecah kalimat harus aman dari singkatan** (`Kab.`, `Kec.`, `Dr.`, `S.`, `H.`, `dll.`, `dsb.`, `no.`, `St.`, `Prof.`, inisial seperti `A. B.`). Jangan memotong di tengah kata; akhiri dengan `…` bila dipotong. Jika `punya_deskripsi` false → `ringkasan: null` |
| C-10 | Kelas konten | Tambah `kelas_konten`: `unggulan` (300–1.200 karakter), `pendek` (40–299), `panjang` (>1.200), `kosong` (<40). Dipakai untuk memilih kartu unggulan |
| C-11 | Klasifikasi tampilan | Tambah `kategori_kode`: `OPK`, `CB`, `LB`, `SP`; dan untuk OPK tambah `jenis_kode` (lihat 4.1) |
| C-12 | ID stabil | Pertahankan `id` asli. Tambah `slug` unik dari `nama_tampil` + kode provinsi (huruf kecil, tanda hubung, tanpa diakritik, bila bentrok tambah akhiran angka) |
| C-13 | Urutan | Urutkan: `kode_provinsi`, `kategori_kode`, `nama_tampil` (locale `id`) |

### 4.1 Kode jenis OPK (untuk warna dan ikon)

| `jenis` (nilai asli) | `jenis_kode` | Nama pendek tampilan |
|---|---|---|
| Kemahiran dan Kerajinan Tradisional | `kerajinan` | Kerajinan |
| Seni Pertunjukan | `seni` | Seni Pertunjukan |
| Tradisi dan Ekspresi Lisan | `lisan` | Tradisi Lisan |
| Pengetahuan dan Kebiasaan Perilaku Mengenai Alam Semesta | `pengetahuan` | Pengetahuan Alam |
| Adat Istiadat Masyarakat, Ritus, dan Perayaan | `adat` | Adat & Ritus |

Untuk Cagar Budaya, `jenis_kode` = `benda|bangunan|struktur|situs|kawasan`.

---

## 5. Keluaran (`public\data\clean\`)

Semua file UTF-8, JSON tanpa komentar, indentasi 2 spasi untuk file kecil dan **minified** untuk `budaya.json` bersih (kecuali pengguna meminta sebaliknya).

| File | Isi | Dipakai oleh |
|---|---|---|
| `budaya.clean.json` | Semua rekaman bersih (skema 5.1) | Penjelajah, kartu, kuis |
| `provinsi.json` | 38 provinsi lengkap dengan agregat (skema 5.2) | Peta, panel provinsi |
| `statistik.json` | Statistik nasional dan sorotan (skema 5.3) | Scrollytelling |
| `kabupaten.json` | Agregat per kabupaten/kota (±131 + `null`) | Treemap konsentrasi |
| `index-pencarian.json` | Indeks ringan untuk pencarian teks (id, nama, provinsi, jenis, kata kunci) | Pencarian |
| `meta.clean.json` | Salinan `meta.json` + tanggal pembersihan + versi skema + hitungan | Footer, atribusi |

### 5.1 Skema rekaman bersih (`budaya.clean.json`)

```json
{
  "id": "string (UUID asli)",
  "slug": "string unik",
  "kategori": "string (nilai asli)",
  "kategori_kode": "OPK | CB | LB | SP",
  "jenis": "string (nilai asli)",
  "jenis_kode": "kerajinan | seni | lisan | pengetahuan | adat | benda | bangunan | struktur | situs | kawasan | non_pemerintah | pemerintah",
  "nama": "string (asli)",
  "nama_tampil": "string",
  "ringkasan": "string | null",
  "deskripsi": "string (asli, bisa kosong)",
  "punya_deskripsi": true,
  "panjang_deskripsi": 0,
  "kelas_konten": "unggulan | pendek | panjang | kosong",
  "kode_provinsi": "string (2 digit)",
  "provinsi": "string",
  "kabupaten": "string | null",
  "kabupaten_daftar": ["string"],
  "jumlah_lokasi": 1,
  "id_anggota": ["string"],
  "lat": null,
  "lng": null,
  "tahun_input": 2026
}
```
`kabupaten_daftar`, `jumlah_lokasi`, `id_anggota` selalu ada; untuk rekaman biasa `kabupaten_daftar` berisi satu kabupaten (atau kosong bila null), `jumlah_lokasi` 1, `id_anggota` berisi `id` sendiri.

### 5.2 Skema `provinsi.json`

Array 38 objek (urut kode):
```json
{
  "kode": "13",
  "nama": "Sumatera Barat",
  "total": 119,
  "per_kategori": { "OPK": 118, "CB": 1, "LB": 0, "SP": 0 },
  "per_jenis_opk": { "kerajinan": 10, "seni": 16, "lisan": 43, "pengetahuan": 28, "adat": 21 },
  "per_jenis_cb": { "benda": 0, "bangunan": 1, "struktur": 0, "situs": 0, "kawasan": 0 },
  "sdm_agregat": 0,
  "status_data": "ada | belum_tercatat",
  "peringkat_total": 1,
  "kabupaten_teratas": [{ "nama": "Kota Pariaman", "jumlah": 94 }],
  "unggulan_ids": ["id1", "id2", "id3"]
}
```
- `status_data`: `belum_tercatat` bila `total === 0`.
- `unggulan_ids`: sampai 3 rekaman `kelas_konten = unggulan` yang paling beragam jenisnya (usahakan jenis berbeda).
- Cocokkan total dengan `provinsi-summary.json` (lihat validasi V-04).

### 5.3 Skema `statistik.json`

```json
{
  "total_rekaman": 544,
  "total_setelah_gabung": 0,
  "per_kategori": {},
  "per_jenis_opk": {},
  "provinsi_berdata": 28,
  "provinsi_belum_tercatat": 10,
  "daftar_belum_tercatat": [{ "kode": "14", "nama": "Riau" }],
  "konsentrasi": {
    "kabupaten_teratas": { "nama": "Kota Pariaman", "provinsi": "Sumatera Barat", "jumlah": 94, "persen": 17.3 },
    "top3_provinsi_persen": 0,
    "top5_provinsi_persen": 0
  },
  "gelombang_input": [{ "tahun": 2021, "jumlah": 63 }],
  "kelas_konten": { "unggulan": 0, "pendek": 0, "panjang": 0, "kosong": 0 },
  "tanggal_ambil": "2026-10-09T08:36:12.355Z"
}
```
Semua angka dihitung dari data, **bukan** ditulis tangan. `total_rekaman` dihitung sebelum penggabungan C-07 agar bisa dibandingkan dengan 544.

---

## 6. Skrip audit (`tools\audit.mjs`, Fase 1)

Hanya **membaca** data mentah. Output: `reports\audit-report.md` (ringkas, mudah dibaca manusia) dan `reports\audit-report.json`.

Laporan wajib memuat:
1. Jumlah rekaman, per kategori, per jenis.
2. Kelengkapan tiap field (terisi/total).
3. Statistik panjang deskripsi (min, median, rata-rata, maks, jumlah <100, >1.500, kosong per kategori).
4. Sebaran per provinsi dan per kabupaten (10 teratas), persentase konsentrasi, 5 provinsi teratas.
5. Provinsi di data yang tidak ada di tabel bagian 3, dan provinsi di tabel yang tidak ada di data.
6. Duplikat murni (daftar ID) dan nama berulang (daftar nama + jumlah + provinsi).
7. Koordinat di luar batas Indonesia (lat −11,5…6,5; lng 94…142).
8. Sebaran `tahun_input` termasuk nilai tidak wajar.
9. Pemeriksaan **pola pemotongan**: hitungan per `jenis` Cagar Budaya; tandai bila semua sama.
10. Bagian **"Pertanyaan untuk pengguna"**: total di situs SPKT untuk tiap kategori vs data lokal.
11. Konsistensi antar file: `meta.json`, `opk-per-provinsi.json`, `provinsi-summary.json` terhadap `budaya.json` (total OPK per provinsi sama? total per provinsi sama?). Laporkan selisih apa pun.

---

## 7. Validasi (`tools\validate.mjs`, Fase 2)

Skrip keluar dengan kode ≠ 0 jika ada pelanggaran **error**. Cetak ringkasan hijau/merah.

| ID | Level | Aturan |
|---|---|---|
| V-01 | error | Semua file keluaran di bagian 5 ada dan berupa JSON valid |
| V-02 | error | `budaya.clean.json`: semua `id` unik dan `slug` unik |
| V-03 | error | Tidak ada rekaman tanpa `kode_provinsi` yang valid |
| V-04 | error | Untuk tiap provinsi, `total` di `provinsi.json` = jumlah rekaman bersih provinsi itu **sebelum** penggabungan C-07 minus duplikat murni; selisih terhadap `provinsi-summary.json` dijelaskan di laporan (boleh beda hanya karena C-06) |
| V-05 | error | `provinsi.json` berisi tepat 38 provinsi, kode unik, urut |
| V-06 | error | Tidak ada field `gambar` pada keluaran |
| V-07 | error | Tidak ada nama atau kontak pribadi SDM pada keluaran |
| V-08 | error | `ringkasan` ≤ 241 karakter dan tidak berakhir di tengah singkatan (`Kab.`, `Dr.`, dll.) |
| V-09 | error | Tidak ada `tahun_input` = 1970 |
| V-10 | warn | Rekaman `punya_deskripsi=false` dicatat jumlahnya |
| V-11 | warn | Entri gabungan (C-07) dicantumkan daftarnya untuk ditinjau pengguna |
| V-12 | warn | Ukuran `budaya.clean.json` > 1 MB (pertimbangkan pemisahan per provinsi) |
| V-13 | error | `statistik.json` konsisten: jumlah `per_kategori` = `total_setelah_gabung` |

---

## 8. Aset peta (Fase 3)

### 8.1 GeoJSON provinsi (wajib)
- Cari batas administratif provinsi Indonesia yang memuat **38 provinsi** (termasuk Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya).
- Utamakan sumber terbuka dengan lisensi jelas (mis. repositori GeoJSON komunitas, data pemerintah, Natural Earth hanya jika ada tingkat admin-1 yang sudah 38 provinsi). **Catat URL, tanggal akses, dan lisensi** di `reports\geo-sources.md`.
- Banyak sumber lama hanya berisi 34 provinsi. **Jangan** memecah polygon sendiri secara asal. Jika hanya ada 34 provinsi: laporkan ke pengguna dan tawarkan opsi: (a) cari sumber lain, (b) pengguna mengunduh manual, (c) tampilkan 34 dengan catatan jelas dan petakan 4 provinsi Papua baru ke provinsi induk dengan label yang jujur. Keputusan di tangan pengguna.
- Properti tiap fitur harus memuat `kode` (2 digit sesuai bagian 3) dan `nama`. Jika sumber memakai properti berbeda, buat pemetaan eksplisit di skrip.
- Sederhanakan geometri (mis. `mapshaper` atau `topojson-simplify`) hingga file < 300 KB **tanpa menghilangkan pulau kecil** yang penting secara visual. Simpan ke `web\public\data\geo\provinsi.geojson`.
- Validasi: 38 fitur, semua `kode` unik dan ada di tabel bagian 3, geometri valid, koordinat dalam kotak Indonesia.

### 8.2 Titik tengah kabupaten (opsional)
- Hanya jika sumbernya jelas dan dapat diverifikasi. Hasilkan `kabupaten-centroid.json`: `{ "Kab. Barru|73": { lat, lng } }`.
- Pencocokan nama kabupaten harus ketat dan mencatat yang gagal cocok. **Jangan menebak koordinat.**
- Jika tidak ada sumber yang andal, lewati. Web tetap berfungsi dengan peta provinsi.

---

## 9. Panduan teks "kosong" dan "ketimpangan" (agar jujur)

Gunakan ungkapan berikut secara konsisten di seluruh data dan UI:

| Situasi | Ungkapan |
|---|---|
| Provinsi `total = 0` | "Belum tercatat di SPKT" |
| Rekaman tanpa deskripsi | "SPKT belum memuat deskripsi untuk objek ini." |
| Kabupaten null | "Lokasi kabupaten belum dicatat" |
| Entri gabungan | "Tercatat di N kabupaten" |
| Angka dihitung dari data | Selalu sertakan "per [tanggal ambil]" pada pernyataan statistik di halaman |

Dilarang: "tidak punya budaya", "miskin budaya", "daerah tertinggal budaya", atau ungkapan sejenis.

---

## 10. Catatan pemeliharaan data

- Setiap kali data mentah diganti, jalankan ulang audit → clean → validate, lalu bandingkan `reports\audit-report.json` lama dan baru (selisih per provinsi dan kategori).
- Simpan versi skema di `meta.clean.json` (`versi_skema`: "1.0"). Naikkan versi bila struktur berubah dan catat di `CHANGELOG.md`.
- Jika crawl ulang menghasilkan jenis OPK baru (mis. Manuskrip, Bahasa, Permainan Rakyat, Olahraga Tradisional): tambahkan ke tabel 4.1 (kode, nama pendek, warna di `WEB_SPEC.md`), dan perbarui skema `per_jenis_opk`.
