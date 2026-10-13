# Laporan Pembersihan & Pengayaan Data — Atlas Budaya (Fase 2)

- **Tanggal Pembersihan:** 2026-10-13T01:33:23.417Z
- **Total Rekaman Mentah (`budaya.json`):** 544
- **Total Setelah Dedup Murni (C-06):** 541 (dibuang 3 rekaman)
- **Total Setelah Penggabungan Multi-Kabupaten (C-07):** 493 (digabung dari 541 rekaman)

---

## Ringkasan Eksekusi Aturan (C-01 s.d. C-13)

| ID | Aturan | Jumlah Terdampak / Hasil |
|---|---|---|
| C-01 | Muat data mentah | 544 rekaman berhasil dimuat dari `public/data/budaya.json` |
| C-02 | Normalisasi teks & Title Case `nama_tampil` | 58 rekaman berhuruf kapital penuh diubah ke Title Case pada `nama_tampil` |
| C-03 | Validasi provinsi & tambah `kode_provinsi` | 544/544 cocok (tidak cocok: 0) |
| C-04 | Bersihkan `tahun` → `tahun_input` | 1 rekaman bernilai `1970` diubah menjadi `null` |
| C-05 | Hapus field `gambar` | 544 rekaman dibersihkan dari field `gambar` |
| C-06 | Hapus duplikat murni | 3 rekaman duplikat murni dihapus (tersisa 541) |
| C-07 | Kelompokkan tradisi multi-kabupaten | 26 grup digabung menjadi entri induk (mengurangi 48 baris duplikat lintas kabupaten) |
| C-08 | Status deskripsi (`punya_deskripsi`) | `true`: 361 rekaman (≥ 40 kar); `false`: 132 rekaman (< 40 kar) |
| C-09 | Ringkasan otomatis (≤ 240 kar, aman singkatan) | 361 ringkasan dibuat, 132 bernilai `null` |
| C-10 | Kelas konten (`kelas_konten`) | `unggulan`: 155, `pendek`: 65, `panjang`: 141, `kosong`: 132 |
| C-11 | Klasifikasi tampilan (`kategori_kode`, `jenis_kode`) | 493 rekaman diberi kode kategori & jenis |
| C-12 | Slug unik (`slug`) | 493 slug unik berhasil dibuat |
| C-13 | Pengurutan rekaman | Diurutkan berdasarkan `kode_provinsi`, `kategori_kode`, `nama_tampil` |

---

## Detail C-04: Rekaman Tahun `1970` yang Diubah ke `null`
- `aedef615-0706-43de-bf20-198bd791996a` — **Tepi Laut/Karina Waserba/Alfamart Jl. L.L. RE Martadinata No. 162** (Kota Bandung, Jawa Barat)

---

## Detail C-06: Duplikat Murni yang Dihapus (3 Grup)
> Catatan untuk Validasi V-04: Selisih `total` pada `provinsi.json` terhadap `provinsi-summary.json` hanya terjadi pada 3 provinsi berikut masing-masing sebesar -1 rekaman akibat penghapusan duplikat murni C-06 (Banten: 5 → 4, Sulawesi Tenggara: 6 → 5, Jawa Tengah: 79 → 78).

- **Jamjuri dan Junenah** (Kota Cilegon, Banten): disimpan `90a4203d-0ce9-4c47-b9f3-a915b2ba1e2f` (563 kar), dibuang `d22ab601-2fe1-43b6-b675-305ea9069c8f` (114 kar)
- **Rambi Wuna** (Kab. Buton Utara, Sulawesi Tenggara): disimpan `a0ee3a49-7b98-40a3-89eb-fad7340e929b` (0 kar), dibuang `1e654fda-3b48-43a0-b278-9b3fa516deb2` (0 kar)
- **Lagu Pantai Widuri** (Kab. Pemalang, Jawa Tengah): disimpan `ba7baaac-2171-4efe-ac90-64492443ed63` (19 kar), dibuang `f093c53c-34c4-443b-b250-f8236cf4021e` (0 kar)

---

## Detail C-07: Entri Gabungan Multi-Kabupaten (26 Entri Induk)

| No | Nama Tampil | Provinsi | Jml Rekaman Asal | Jml Kabupaten | Daftar Kabupaten | Alasan Penggabungan |
|---|---|---|---|---|---|---|
| 1 | Susualan | Banten | 2 | 1 | Kab. Pandeglang | Deskripsi sama-sama kosong |
| 2 | Saoraja Lapinceng | Sulawesi Selatan | 3 | 3 | Kab. Bone, Kab. Pinrang, Kota Pare Pare | Deskripsi 100% identik |
| 3 | Bekai (Dayak Kenya) | Kalimantan Utara | 2 | 1 | Kab. Bulungan | Deskripsi 100% identik |
| 4 | Rumah Panggung Bugis | Jawa Tengah | 2 | 2 | Kab. Boyolali, Kab. Pemalang | Deskripsi 100% identik |
| 5 | Kisar | Kalimantan Barat | 2 | 2 | Kota Pontianak, Kota Singkawang | Deskripsi 100% identik |
| 6 | Rujuh | Kalimantan Barat | 2 | 2 | Kota Pontianak, Kota Singkawang | Deskripsi 100% identik |
| 7 | Pakaian Dayung atau Hakav Dayung | Kalimantan Barat | 2 | 2 | Kota Pontianak, Kota Singkawang | Deskripsi 100% identik |
| 8 | Batik Garutan | Jawa Barat | 4 | 4 | Kab. Indramayu, Kab. Sumedang, Kota Bekasi, Kota Bogor | Deskripsi 100% identik |
| 9 | Clurit | Jawa Timur | 4 | 4 | Kab. Kediri, Kab. Sidoarjo, Kota Batu, Kota Blitar | Deskripsi 100% identik |
| 10 | Bantengan (Pasuruan) | Jawa Timur | 9 | 9 | Kab. Blitar, Kab. Jember, Kab. Kediri, Kab. Lumajang, Kab. Malang, Kab. Pacitan, Kab. Ponorogo, Kab. Trenggalek, Kab. Tulungagung | Deskripsi sama-sama kosong |
| 11 | Tari Bedayou Tulang Bawang | Lampung | 5 | 4 | Kab. Lampung Utara, Kab. Mesuji, Kab. Tulang Bawang, Kab. Tulang Bawang Barat | Deskripsi sama-sama kosong |
| 12 | Bedog Cikeruh | Jawa Barat | 5 | 5 | Kab. Bandung, Kab. Indramayu, Kab. Sumedang, Kota Bekasi, Kota Bogor | Deskripsi 100% identik |
| 13 | Famasao Ono Nihalo | Sumatera Utara | 2 | 1 | Kab. Nias Barat | Deskripsi 100% identik |
| 14 | Saloka | Kalimantan Tengah | 2 | 1 | Kab. Kotawaringin Barat | Deskripsi sama-sama kosong |
| 15 | Badewa | Kalimantan Selatan | 2 | 1 | Kab. Barito Kuala | Deskripsi 100% identik |
| 16 | Tungku Naga | Kalimantan Barat | 2 | 2 | Kota Pontianak, Kota Singkawang | Deskripsi 100% identik |
| 17 | Bubu | Kalimantan Barat | 2 | 2 | Kota Pontianak, Kota Singkawang | Deskripsi 100% identik |
| 18 | Temaduk | Kalimantan Barat | 2 | 2 | Kota Pontianak, Kota Singkawang | Deskripsi 100% identik |
| 19 | Kain Pamintan | Kalimantan Selatan | 2 | 1 | Kab. Barito Kuala | Deskripsi 100% identik |
| 20 | Pedang Bulangkait | Kalimantan Barat | 2 | 2 | Kota Pontianak, Kota Singkawang | Deskripsi 100% identik |
| 21 | Ketebung / Gendang | Kalimantan Barat | 2 | 2 | Kota Pontianak, Kota Singkawang | Deskripsi 100% identik |
| 22 | Alang | Sulawesi Selatan | 5 | 5 | Kab. Barru, Kab. Bone, Kab. Gowa, Kab. Pinrang, Kota Pare Pare | Deskripsi 100% identik |
| 23 | Jamu Jun | Jawa Tengah | 2 | 1 | Kota Semarang | Deskripsi sama-sama kosong |
| 24 | Bedog Lubuk | Jawa Barat | 3 | 3 | Kab. Indramayu, Kab. Sumedang, Kota Bogor | Deskripsi 100% identik |
| 25 | Serat Wedhatama | Jawa Tengah | 2 | 1 | Kota Surakarta | Deskripsi 100% identik |
| 26 | Arsitektur Tradisional Rumah Panjang Nanga Siyai | Kalimantan Barat | 2 | 2 | Kota Pontianak, Kota Singkawang | Deskripsi 100% identik |

### Kandidat Nama Sama yang TIDAK Digabung (4 Grup dalam Provinsi Sama + 1 Lintas Provinsi)
Sesuai aturan C-07 (*"Jangan menggabung bila deskripsi berbeda bermakna"*):
- **Ketoprak Dor Deli Serdang** (Sumatera Utara, 2 entri) — *Deskripsi berbeda bermakna antar entri*: `66286475` (Kab. Deli Serdang, 0 kar), `5cc50d36` (null, 6555 kar)
- **Krilu** (Bengkulu, 2 entri) — *Deskripsi berbeda bermakna antar entri*: `119f918d` (null, 4561 kar), `72132654` (Kab. Lebong, 952 kar)
- **Bahasa Kotawaringin** (Kalimantan Tengah, 2 entri) — *Deskripsi berbeda bermakna antar entri*: `183e864b` (null, 1118 kar), `e3109a16` (Kab. Kotawaringin Barat, 2080 kar)
- **Dungga Roro** (Nusa Tenggara Timur, 2 entri) — *Deskripsi berbeda bermakna antar entri*: `244493fb` (Kab. Sumba Barat Daya, 967 kar), `040d2d28` (null, 451 kar)
- **Bahasa Arab** (2 entri di provinsi berbeda: Jawa Tengah `786df72b` & Sumatera Barat `59952b3b`) — *Berbeda provinsi dan berbeda deskripsi*.

---

## Catatan Khusus Data Sumber
- Terdapat 1 rekaman di Provinsi Bali (`7399f372-bc95-4342-bb2e-089355bd8fa7`, Kab. Buleleng) yang memiliki `nama: "#NAME?"` dari sumber SPKT (kesalahan formula spreadsheet saat penginputan di SPKT untuk objek *"Uyah Amed / Garam Amed"*). Sesuai Aturan Emas 1 (*Jangan mengarang/mengubah isi data sumber*), nilai asli tetap dipertahankan.
