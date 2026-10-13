# Laporan Audit Data Mentah — Atlas Budaya

- **Tanggal Audit:** 2026-10-13T01:24:44.450Z
- **Tanggal Ambil Data (`meta.json`):** 9 Oktober 2026 (`2026-10-09T08:36:12.355Z`)
- **Sumber:** SPKT - Kementerian Kebudayaan RI (https://spkt.kemenbud.go.id)

---

## 1. Jumlah Rekaman per Kategori dan Jenis

- **Total Rekaman (`budaya.json`):** **544** rekaman
- **SDM Kebudayaan (Agregat di `meta.json`):** **5** (Jawa Tengah: 2, Sulawesi Selatan: 3)

### Per Kategori
| Kategori | Jumlah |
|---|---|
| Objek Pemajuan Kebudayaan | 473 |
| Cagar Budaya | 65 |
| Sarana & Prasarana | 3 |
| Lembaga Budaya | 3 |

### Rincian per Jenis
| Kategori | Jenis | Jumlah |
|---|---|---|
| Objek Pemajuan Kebudayaan | Adat Istiadat Masyarakat, Ritus, dan Perayaan | 31 |
| Objek Pemajuan Kebudayaan | Tradisi dan Ekspresi Lisan | 99 |
| Objek Pemajuan Kebudayaan | Kemahiran dan Kerajinan Tradisional | 147 |
| Objek Pemajuan Kebudayaan | Seni Pertunjukan | 118 |
| Objek Pemajuan Kebudayaan | Pengetahuan dan Kebiasaan Perilaku Mengenai Alam Semesta | 78 |
| Cagar Budaya | Kawasan | 13 |
| Cagar Budaya | Struktur | 13 |
| Cagar Budaya | Benda | 13 |
| Cagar Budaya | Situs | 13 |
| Cagar Budaya | Bangunan | 13 |
| Sarana & Prasarana | Pemerintah | 3 |
| Lembaga Budaya | Non-Pemerintah | 3 |

---

## 2. Kelengkapan Tiap Field

| Field | Terisi / Total | Kosong |
|---|---|---|
| `id` | 544 / 544 | 0 |
| `kategori` | 544 / 544 | 0 |
| `jenis` | 544 / 544 | 0 |
| `nama` | 544 / 544 | 0 |
| `deskripsi` | 413 / 544 | 131 |
| `provinsi` | 544 / 544 | 0 |
| `kabupaten` | 508 / 544 | 36 |
| `lat` | 2 / 544 | 542 |
| `lng` | 2 / 544 | 542 |
| `gambar` | 31 / 544 | 513 |
| `tahun` | 544 / 544 | 0 |
| `sumber` | 544 / 544 | 0 |

> **Catatan Field `gambar`:** Terdapat 31 rekaman non-null (513 `null`), dengan rincian: **10** berisi string `"[]"`, **16** berisi JSON array path folder dasar (`https://app.dapobud.kemenbud.go.id/storage/`) tanpa nama berkas gambar, dan hanya **5** berisi URL langsung. Sesuai `DATA_SPEC.md` 2.4, field `gambar` tidak dapat dipakai dan akan dihapus pada Fase 2.

---

## 3. Statistik Panjang Deskripsi

- **Terisi (> 0 karakter):** 413 rekaman
- **Kosong (0 karakter):** 131 rekaman
  - Rincian kosong per kategori: {"Cagar Budaya":65,"Objek Pemajuan Kebudayaan":65,"Sarana & Prasarana":1}
- **Panjang < 40 karakter (termasuk kosong):** 149 rekaman
- **Panjang < 100 karakter (termasuk kosong):** 156 rekaman (jika hanya dihitung yang terisi 1–99 karakter: **25** rekaman)
- **Kandidat Unggulan (300–1.200 karakter):** 161 rekaman
- **Deskripsi Panjang (> 1.500 karakter):** 140 rekaman

| Kelompok Hitung | Minimum | Median | Rata-rata | Maksimum |
|---|---|---|---|---|
| Seluruh 544 Rekaman | 0 | 542.5 | 1318 | 26736 |
| 413 Rekaman Terisi | 1 | 937 | 1736 | 26736 |

**5 Rekaman dengan Deskripsi Terpanjang:**
1. **OKOKAN** (Bali) — 26.736 karakter (`a46acfab-92a8-4447-afb2-f578886b7261`)
2. **Aksara Jawa** (DI Yogyakarta) — 17.821 karakter (`309f4359-d60b-4736-8930-bc09a3673064`)
3. **Mamutuih Etongan** (Sumatera Barat) — 17.305 karakter (`2301be83-9386-4f16-87f4-030fc17b12c2`)
4. **Knobe** (Nusa Tenggara Timur) — 14.001 karakter (`12b3d65e-aeed-42b5-8a10-a9817239655f`)
5. **Famasao Ono Nihalo** (Sumatera Utara) — 11.115 karakter (`46c65cbf-1aaa-49e9-9f47-1bf0a538a431`)

---

## 4. Sebaran Wilayah & Konsentrasi Data

- **Provinsi memiliki data:** **28** dari 38 provinsi
- **Provinsi belum tercatat (0 rekaman):** **10** provinsi
- **Konsentrasi 3 Provinsi Teratas:** **43.93%** dari total nasional
- **Konsentrasi 5 Provinsi Teratas:** **58.09%** dari total nasional (catatan: peringkat 5 dan 6 yakni Jawa Barat & Kalimantan Barat sama-sama memiliki 38 rekaman)
- **Rekaman dengan `kabupaten = null`:** **36** rekaman

### Sebaran 28 Provinsi Berdata
| Peringkat | Provinsi | Jumlah | Persentase |
|---|---|---|---|
| 1 | Sumatera Barat | 119 | 21.88% |
| 2 | Jawa Tengah | 79 | 14.52% |
| 3 | Jawa Timur | 41 | 7.54% |
| 4 | Sulawesi Selatan | 39 | 7.17% |
| 5 | Jawa Barat | 38 | 6.99% |
| 6 | Kalimantan Barat | 38 | 6.99% |
| 7 | Aceh | 26 | 4.78% |
| 8 | Sumatera Selatan | 18 | 3.31% |
| 9 | DKI Jakarta | 17 | 3.13% |
| 10 | DI Yogyakarta | 13 | 2.39% |
| 11 | Kalimantan Selatan | 13 | 2.39% |
| 12 | Kalimantan Tengah | 10 | 1.84% |
| 13 | Kepulauan Bangka Belitung | 9 | 1.65% |
| 14 | Maluku Utara | 9 | 1.65% |
| 15 | Sulawesi Tengah | 9 | 1.65% |
| 16 | Lampung | 8 | 1.47% |
| 17 | Sumatera Utara | 8 | 1.47% |
| 18 | Jambi | 7 | 1.29% |
| 19 | Bali | 6 | 1.1% |
| 20 | Kalimantan Timur | 6 | 1.1% |
| 21 | Sulawesi Tenggara | 6 | 1.1% |
| 22 | Banten | 5 | 0.92% |
| 23 | Kalimantan Utara | 5 | 0.92% |
| 24 | Papua | 5 | 0.92% |
| 25 | Nusa Tenggara Timur | 3 | 0.55% |
| 26 | Papua Pegunungan | 3 | 0.55% |
| 27 | Bengkulu | 2 | 0.37% |
| 28 | Gorontalo | 2 | 0.37% |

### 10 Kabupaten/Kota Teratas
| Peringkat | Kabupaten/Kota (Provinsi) | Jumlah | Persentase Nasional |
|---|---|---|---|
| 1 | Kota Pariaman (Sumatera Barat) | 94 | 17.28% |
| 2 | Kab. Boyolali (Jawa Tengah) | 34 | 6.25% |
| 3 | Kab. Barru (Sulawesi Selatan) | 25 | 4.6% |
| 4 | Kota Pontianak (Kalimantan Barat) | 22 | 4.04% |
| 5 | Kab. Wonogiri (Jawa Tengah) | 21 | 3.86% |
| 6 | Kota Solok (Sumatera Barat) | 21 | 3.86% |
| 7 | Kab. Pidie Jaya (Aceh) | 15 | 2.76% |
| 8 | Kota Singkawang (Kalimantan Barat) | 14 | 2.57% |
| 9 | Kab. Sumedang (Jawa Barat) | 11 | 2.02% |
| 10 | Kab. Banyuasin (Sumatera Selatan) | 9 | 1.65% |

---

## 5. Pencocokan Tabel Referensi 38 Provinsi

- **Provinsi di `budaya.json` yang TIDAK ada di tabel referensi (Bagian 3 `DATA_SPEC.md`):** Tidak ada (0) — 100% cocok
- **10 Provinsi di tabel referensi yang belum memiliki rekaman di `budaya.json`:**
- `14` — Riau
- `21` — Kepulauan Riau
- `52` — Nusa Tenggara Barat
- `71` — Sulawesi Utara
- `76` — Sulawesi Barat
- `81` — Maluku
- `92` — Papua Barat
- `93` — Papua Selatan
- `94` — Papua Tengah
- `96` — Papua Barat Daya

---

## 6. Duplikat Murni & Nama Berulang

### Duplikat Murni (3 grup)
- **Jamjuri dan Junenah** — Kota Cilegon, Banten (2x): `d22ab601-2fe1-43b6-b675-305ea9069c8f` (thn: 2022, deskripsi: 114 kar), `90a4203d-0ce9-4c47-b9f3-a915b2ba1e2f` (thn: 2022, deskripsi: 563 kar)
- **RAMBI WUNA** — Kab. Buton Utara, Sulawesi Tenggara (2x): `a0ee3a49-7b98-40a3-89eb-fad7340e929b` (thn: 2020, deskripsi: 0 kar), `1e654fda-3b48-43a0-b278-9b3fa516deb2` (thn: 2020, deskripsi: 0 kar)
- **Lagu Pantai Widuri** — Kab. Pemalang, Jawa Tengah (2x): `ba7baaac-2171-4efe-ac90-64492443ed63` (thn: 2025, deskripsi: 19 kar), `f093c53c-34c4-443b-b250-f8236cf4021e` (thn: 2025, deskripsi: 0 kar)

### Nama Berulang (34 nama unik muncul > 1 kali)
| Nama | Jumlah | Provinsi | Semua Deskripsi Kosong? |
|---|---|---|---|
| Bantengan (Pasuruan) | 9 | Jawa Timur | Ya (0 kar) |
| Alang | 5 | Sulawesi Selatan | Tidak |
| BEDOG CIKERUH | 5 | Jawa Barat | Tidak |
| Tari Bedayou Tulang Bawang | 5 | Lampung | Ya (0 kar) |
| Batik Garutan | 4 | Jawa Barat | Tidak |
| Clurit | 4 | Jawa Timur | Tidak |
| Bedog Lubuk | 3 | Jawa Barat | Tidak |
| Saoraja Lapinceng | 3 | Sulawesi Selatan | Tidak |
| Arsitektur Tradisional Rumah Panjang Nanga Siyai | 2 | Kalimantan Barat | Tidak |
| Badewa | 2 | Kalimantan Selatan | Tidak |
| Bahasa Arab | 2 | Jawa Tengah, Sumatera Barat | Tidak |
| Bahasa Kotawaringin | 2 | Kalimantan Tengah | Tidak |
| BEKAI (DAYAK KENYA) | 2 | Kalimantan Utara | Tidak |
| Bubu | 2 | Kalimantan Barat | Tidak |
| Dungga Roro | 2 | Nusa Tenggara Timur | Tidak |
| Famasao Ono Nihalo | 2 | Sumatera Utara | Tidak |
| Jamjuri dan Junenah | 2 | Banten | Tidak |
| JAMU JUN | 2 | Jawa Tengah | Ya (0 kar) |
| Kain Pamintan | 2 | Kalimantan Selatan | Tidak |
| Ketebung / Gendang | 2 | Kalimantan Barat | Tidak |
| Ketoprak Dor Deli Serdang | 2 | Sumatera Utara | Tidak |
| Kisar | 2 | Kalimantan Barat | Tidak |
| Krilu | 2 | Bengkulu | Tidak |
| Lagu Pantai Widuri | 2 | Jawa Tengah | Tidak |
| Pakaian Dayung atau Hakav Dayung | 2 | Kalimantan Barat | Tidak |
| Pedang Bulangkait | 2 | Kalimantan Barat | Tidak |
| RAMBI WUNA | 2 | Sulawesi Tenggara | Ya (0 kar) |
| Rujuh | 2 | Kalimantan Barat | Tidak |
| Rumah Panggung Bugis | 2 | Jawa Tengah | Tidak |
| Saloka | 2 | Kalimantan Tengah | Ya (0 kar) |
| SERAT WEDHATAMA | 2 | Jawa Tengah | Tidak |
| Susualan | 2 | Banten | Ya (0 kar) |
| Temaduk | 2 | Kalimantan Barat | Tidak |
| Tungku Naga | 2 | Kalimantan Barat | Tidak |

---

## 7. Pemeriksaan Koordinat

- **Rekaman memiliki koordinat (`lat` & `lng`):** 2 dari 544 rekaman
  - **Museum Kayu Tuah Himba** (Kab. Kutai Kartanegara, Kalimantan Timur): `-0.405712, 116.970886`
  - **Masjid Agung Baiturahim Kota Gorontalo (Masjid Adat Gorontalo)** (Kota Gorontalo, Gorontalo): `0.537738, 123.060247`
- **Koordinat di luar batas Indonesia (lat -11,5..6,5; lng 94..142):** 0 rekaman

---

## 8. Sebaran `tahun` (Tahun Input Data)

| Tahun | Jumlah Rekaman | Status |
|---|---|---|
| 1970 | 1 | ⚠️ Tidak wajar (epoch error) |
| 2010 | 23 | Normal |
| 2011 | 6 | Normal |
| 2012 | 9 | Normal |
| 2013 | 18 | Normal |
| 2014 | 4 | Normal |
| 2015 | 2 | Normal |
| 2016 | 3 | Normal |
| 2017 | 19 | Normal |
| 2018 | 12 | Normal |
| 2019 | 5 | Normal |
| 2020 | 9 | Normal |
| 2021 | 63 | Normal |
| 2022 | 25 | Normal |
| 2023 | 17 | Normal |
| 2024 | 20 | Normal |
| 2025 | 62 | Normal |
| 2026 | 246 | Normal |

**Rekaman dengan tahun tidak wajar:**
- `aedef615-0706-43de-bf20-198bd791996a` — **Tepi Laut/Karina Waserba/Alfamart Jl. L.L. RE Martadinata No. 162** (Kota Bandung, Jawa Barat): tahun `1970`

---

## 9. Pemeriksaan Pola Pemotongan (Dugaan Scraping Terpotong)

- **Apakah semua jenis Cagar Budaya berjumlah sama persis?** **YA (Masing-masing tepat 13 rekaman, total 65)**
- **Total Lembaga Budaya:** **3** rekaman
- **Total Sarana & Prasarana:** **3** rekaman
- **Jumlah Jenis OPK yang muncul:** **5** jenis

**Analisis Teknis dari Log Scraper Awal:**
- Seluruh 5 jenis Cagar Budaya masing-masing berjumlah tepat 13 rekaman (total 65) dan seluruh deskripsinya kosong.
- Lembaga Budaya hanya 3 rekaman dan Sarana & Prasarana hanya 3 rekaman.
- Objek Pemajuan Kebudayaan (OPK) hanya memuat 5 jenis dari 10 objek pemajuan kebudayaan menurut UU Pemajuan Kebudayaan.
- Berdasarkan jejak scraper/endpoints.json, request ke /api/telusuri/category/list-data sempat mengembalikan HTTP 500 Internal Server Error untuk sejumlah kombinasi, sehingga data yang tertangkap kemungkinan berasal dari tangkapan awal infinite scroll / halaman terbatas.

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

## 11. Konsistensi Antar Berkas (`meta.json`, `opk-per-provinsi.json`, `provinsi-summary.json` vs `budaya.json`)

- **Selisih jumlah OPK atau kategori:** Tidak ada selisih (Konsisten).
- **Catatan penting pada `provinsi-summary.json`:**
  1. Nilai `total_budaya` per provinsi di `provinsi-summary.json` konsisten 100% dengan jumlah rekaman di `budaya.json` (Jawa Tengah: 79 rekaman + 2 SDM Agregat disimpan terpisah di sub-key `kategori["SDM Kebudayaan (Agregat)"]`; Sulawesi Selatan: 39 rekaman + 3 SDM Agregat).
  2. Pada `top_10_per_kategori` di `provinsi-summary.json`, kategori `Lembaga Budaya` memiliki **9 provinsi bernilai `count: 0`** dan `Sarana & Prasarana` memiliki **7 provinsi bernilai `count: 0`** sebagai pengisi (padding) — sesuai peringatan di `DATA_SPEC.md` bagian 1.4.
