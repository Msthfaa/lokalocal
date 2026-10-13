# AGENTS.md — Dokumen Induk Proyek "Atlas Budaya"

> **Baca file ini PERTAMA, lengkap, sebelum menyentuh apa pun.**
> Dokumen pendamping (wajib dibaca sesuai fase):
> - `DATA_SPEC.md` — semua tentang data: masalah, aturan pembersihan, skema, validasi
> - `WEB_SPEC.md` — semua tentang web: alur halaman, desain, animasi, komponen
>
> Bahasa kerja: **Bahasa Indonesia** (komentar kode, teks antarmuka, laporan ke pengguna).
> Nama variabel dan fungsi boleh Bahasa Inggris atau Indonesia, tapi konsisten.

---

## 1. Ringkasan proyek

Pengguna (peserta lomba) membuat **website interaktif bertema Sosial Budaya** untuk lomba pembuatan web, dengan fokus **keberagaman budaya Indonesia (lingkup 1 Indonesia)**.

Sumber data: situs publik **SPKT – Sistem Pendataan Kebudayaan Terpadu, Kementerian Kebudayaan RI** (`https://spkt.kemenbud.go.id`). Data **sudah di-scrape** dan tersedia sebagai file JSON lokal (lihat bagian 3). **Scraping tidak perlu diulang** kecuali pengguna secara eksplisit memintanya.

Masalah yang ingin dipecahkan: informasi budaya yang ada berupa teks panjang dan membosankan, sehingga orang cepat jenuh. Solusinya: pengalaman interaktif, visual, dan bercerita (scrollytelling) berbasis data nyata.

### Konsep inti (jangan diubah tanpa persetujuan pengguna)

Hasil analisis data menunjukkan data SPKT **sangat timpang**: hanya 28 dari 38 provinsi yang punya data, dan satu kota (Kota Pariaman) menyumbang ±17% seluruh rekaman. Ketimpangan ini mencerminkan **siapa yang sudah menginput data**, BUKAN seberapa kaya budaya suatu daerah.

Maka pesan sosial web ini:

> **"Budaya Indonesia tidak sedikit. Yang sedikit adalah yang sudah tercatat."**

Web ini bukan sekadar katalog budaya. Ia (1) memamerkan budaya yang sudah tercatat secara indah, (2) jujur memperlihatkan celah pencatatan, dan (3) mengajak pengunjung peduli dan ikut mendokumentasikan.

---

## 2. Aturan emas (berlaku sepanjang proyek)

1. **Jangan mengarang data.** Hanya gunakan isi field yang benar-benar ada di file sumber. Jika data tidak ada, tampilkan keadaan kosong yang jujur ("Belum ada deskripsi di SPKT"), jangan isi dengan karangan.
2. **Jangan menyiratkan "0 data = tidak punya budaya".** Setiap visual provinsi berwarna gelap/kosong wajib diberi label "belum tercatat di SPKT". Lihat `WEB_SPEC.md` bagian narasi.
3. **File mentah tidak boleh diubah atau dihapus.** Semua hasil olahan ditulis ke folder terpisah (bagian 3).
4. **Satu fase, satu langkah.** Kerjakan fase berurutan (bagian 7). Setelah selesai tiap fase: jalankan validasi, perbarui checklist, tulis laporan singkat, lalu **berhenti dan tunggu konfirmasi pengguna** sebelum fase berikutnya.
5. **Jangan melakukan scraping/crawl ulang** dan jangan mengakses situs SPKT dari kode web. Web hanya membaca file JSON statis lokal.
6. **Privasi:** data SDM Kebudayaan hanya boleh ditampilkan sebagai **agregat jumlah**, tidak pernah nama atau kontak pribadi.
7. **Atribusi wajib tampil di web:** `Data: SPKT – Kementerian Kebudayaan RI, diambil 9 Oktober 2026` dengan tautan ke `https://spkt.kemenbud.go.id` (ambil tanggal dari `meta.json`, jangan hardcode).
8. **Jika ragu atau ada keputusan yang belum ditentukan di dokumen ini, TANYA pengguna.** Jangan menebak untuk hal besar (struktur folder, pilihan library, perubahan konsep).
9. **Jangan menginstal paket yang tidak ada di daftar stack (bagian 5)** tanpa menjelaskan alasannya dan meminta persetujuan.
10. **Jangan membuat klaim yang tidak bisa diverifikasi** di teks web (misalnya "Indonesia punya 1.340 suku" tanpa sumber). Teks narasi hanya boleh memakai angka dari data atau sumber yang disebutkan jelas.

---

## 3. Lokasi file dan struktur folder

### 3.1 Path penting (Windows)

```
Folder data hasil scraping (SUMBER KEBENARAN):
C:\Users\Tyoo\Documents\Lomba Programming\scraping\public\data
```

Isi folder itu saat ini:

| File | Isi singkat |
|---|---|
| `budaya.json` | Array 544 rekaman budaya (ukuran ±940 KB) |
| `meta.json` | Metadata pengambilan: tanggal, sumber, jumlah, atribusi |
| `opk-per-provinsi.json` | Rekap OPK per provinsi dan per jenis |
| `provinsi-summary.json` | Ringkasan nasional + per provinsi + top 10 |

**Akar proyek (diasumsikan):** `C:\Users\Tyoo\Documents\Lomba Programming\scraping`
> Verifikasi dulu pada Fase 0 bahwa folder ini benar (cek ada `package.json` atau folder `scraper`). Jika struktur berbeda dari yang digambarkan di bawah, **laporkan ke pengguna, jangan memindahkan file sendiri.**

### 3.2 Catatan penting path di Windows

- Path mengandung **spasi** (`Lomba Programming`). Selalu beri tanda kutip pada perintah terminal:
  `cd "C:\Users\Tyoo\Documents\Lomba Programming\scraping"`
- Di kode Node.js jangan menulis backslash manual. Gunakan `node:path` dan `import.meta.url`:
  ```js
  import path from 'node:path';
  import { fileURLToPath } from 'node:url';
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const ROOT = path.resolve(__dirname, '..');           // sesuaikan kedalaman
  const RAW_DIR = path.join(ROOT, 'public', 'data');
  ```
- Baca/tulis file dengan encoding **UTF-8** (`'utf8'`). Teks mengandung karakter khusus seperti `’` dan nama daerah.
- Terminal pengguna kemungkinan **PowerShell**. Jangan memakai sintaks bash khusus (`&&` berfungsi di PowerShell 7 tapi tidak di 5.1, gunakan `;` atau script npm). Beri perintah yang valid untuk PowerShell.

### 3.3 Struktur target

```
scraping\                          <- akar proyek
├─ AGENTS.md                       <- file ini
├─ DATA_SPEC.md
├─ WEB_SPEC.md
├─ CHANGELOG.md                    <- dibuat agent, diperbarui tiap fase
├─ public\
│  └─ data\                        <- DATA MENTAH. JANGAN DIUBAH.
│     ├─ budaya.json
│     ├─ meta.json
│     ├─ opk-per-provinsi.json
│     ├─ provinsi-summary.json
│     └─ clean\                    <- HASIL OLAHAN (dibuat agent)
├─ backup-raw\                     <- salinan cadangan data mentah (Fase 0)
├─ tools\                          <- skrip audit & pembersihan (.mjs)
│  ├─ audit.mjs
│  ├─ clean.mjs
│  ├─ build-geo.mjs
│  └─ validate.mjs
├─ reports\                        <- laporan audit & validasi (.md/.json)
└─ web\                            <- aplikasi web (Vite)
   ├─ public\data\                 <- salinan data bersih (via skrip sync)
   └─ src\
```

Keputusan: web berada di subfolder `web\` agar terpisah dari alat data. Data bersih disalin ke `web\public\data\` oleh skrip `npm run sync-data`, bukan dirujuk lewat path luar.

---

## 4. Keadaan data saat ini (hasil audit awal — ringkas)

Rincian dan aturan penanganan ada di `DATA_SPEC.md`. Ringkasnya:

- **544 rekaman**: 473 Objek Pemajuan Kebudayaan (OPK), 65 Cagar Budaya, 3 Lembaga Budaya, 3 Sarana & Prasarana. Plus 5 SDM Kebudayaan (agregat saja).
- **28 dari 38 provinsi** punya data. 10 provinsi tanpa data: Kepulauan Riau, Maluku, Nusa Tenggara Barat, Papua Barat, Papua Barat Daya, Papua Selatan, Papua Tengah, Riau, Sulawesi Barat, Sulawesi Utara.
- **Sangat terkonsentrasi**: Sumatera Barat 119 rekaman (22%); Kota Pariaman 94 rekaman (17%); 5 provinsi teratas = 58%.
- **Koordinat** hanya ada di 2 rekaman. Tidak ada peta titik.
- **Foto tidak bisa dipakai**: field `gambar` hanya berisi alamat folder tanpa nama file (31 rekaman, banyak `[]`).
- **Deskripsi**: 413 terisi, 131 kosong (seluruh 65 Cagar Budaya kosong). Panjang median ±540 karakter, maksimum 26.736 karakter.
- Field `tahun` adalah **tahun input data**, bukan tahun budaya. Ada satu nilai `1970` (error).
- Ada duplikat murni (3) dan tradisi yang tercatat berulang di banyak kabupaten (contoh: "Bantengan" 9 kali).
- **Dugaan kuat scraping terpotong:** Cagar Budaya tepat 13 untuk tiap jenis (Benda, Bangunan, Struktur, Situs, Kawasan), dan Lembaga Budaya serta Sarana & Prasarana hanya 3. Perlu diverifikasi (Fase 1).

---

## 5. Tech stack (diputuskan)

| Kebutuhan | Pilihan | Catatan |
|---|---|---|
| Alat data | **Node.js ≥ 20**, skrip `.mjs`, tanpa dependency berat | Boleh `d3-geo`/`topojson` bila perlu |
| Build web | **Vite** (vanilla JavaScript, ES Modules) | Tanpa framework agar ringan dan mudah dirawat |
| Peta | **d3-geo** + **d3-scale** → SVG | Tidak pakai Leaflet (tidak ada titik koordinat) |
| Animasi | **GSAP** + **ScrollTrigger** | Wajib hormati `prefers-reduced-motion` |
| Gaya | CSS biasa dengan **CSS variables** (design tokens) | Tanpa Tailwind kecuali pengguna minta |
| 3D (opsional, Fase 9) | **Three.js**, hanya satu elemen kecil | Jangan jadikan fitur inti |
| Hosting | Static hosting (Netlify / Vercel / GitHub Pages) | Tidak butuh server |

Jika kamu (agent) merasa ada pilihan yang lebih baik, **usulkan dulu ke pengguna** beserta alasannya.

### 5.1 Batasan kemampuan agent dan solusinya

Agent ini model bahasa yang **hanya menghasilkan teks/kode**. Ia tidak membuat gambar, foto, tekstur, atau file model 3D secara langsung. Maka:

| Kebutuhan | Cara yang diputuskan |
|---|---|
| Foto/ilustrasi budaya | **Tidak dipakai.** Ganti dengan pola generatif SVG bergaya tenun/batik (dibuat lewat kode), ikon SVG, dan tipografi |
| Pola batik/tenun | Dibuat sebagai SVG `<pattern>` lewat kode. Lihat `WEB_SPEC.md` bagian 6 |
| Model 3D detail (candi, rumah adat) | **Tidak dipakai.** Jika pengguna ingin, pengguna menyediakan file `.glb` berlisensi jelas |
| Globe/peta 3D | Opsional (Fase 9): globe sederhana via kode Three.js, tanpa aset eksternal |
| GeoJSON 38 provinsi | Harus dicari dari sumber terbuka berlisensi jelas (Fase 3). Jika tak bisa diunduh, **minta pengguna mengunduh manual** dan menaruh di `reports\` atau `web\public\data\geo\` |
| Pengujian di perangkat nyata | Agent tidak bisa. Minta pengguna menguji di ponsel dan melaporkan hasilnya |

---

## 6. Protokol kerja agent

### 6.1 Di awal setiap sesi
1. Baca `AGENTS.md`, lalu `CHANGELOG.md` (jika ada) untuk tahu posisi terakhir.
2. Baca spesifikasi yang relevan (`DATA_SPEC.md` atau `WEB_SPEC.md`).
3. Nyatakan ke pengguna: "Saya akan mengerjakan Fase X. Berikut rencana langkahnya…".

### 6.2 Selama bekerja
- Kerjakan dalam langkah kecil. Setelah menulis skrip, **jalankan** dan tunjukkan keluarannya, jangan hanya mengklaim "sudah jalan".
- Tangani error dengan pesan jelas berbahasa Indonesia. Skrip tidak boleh crash diam-diam.
- Setiap skrip data harus **idempotent** (dijalankan berulang menghasilkan hasil sama) dan tidak menimpa data mentah.
- Tulis komentar singkat pada bagian yang tidak jelas dengan sendirinya.

### 6.3 Di akhir setiap fase
1. Jalankan validasi (`node tools/validate.mjs` untuk fase data; `npm run build` untuk fase web).
2. Centang item di checklist (bagian 7).
3. Tambahkan entri di `CHANGELOG.md` (format di bagian 9.2).
4. Beri laporan: apa yang selesai, apa yang tidak, temuan penting, keputusan yang perlu dari pengguna.
5. **Berhenti.** Tunggu pengguna menyatakan lanjut.

---

## 7. Roadmap dan checklist fase

Format status: `[ ]` belum, `[x]` selesai. Agent memperbarui bagian ini.

### Fase 0 — Persiapan dan keamanan
- [x] Verifikasi akar proyek dan keberadaan 4 file data mentah di `public\data`
- [x] Cek versi Node (`node -v` ≥ 20) dan npm
- [x] Buat salinan cadangan: `public\data\*.json` → `backup-raw\` (jangan menimpa jika sudah ada)
- [x] Buat folder `tools\`, `reports\`, `public\data\clean\`
- [x] Buat `CHANGELOG.md`
- [x] Buat `.gitignore` yang sesuai (abaikan `node_modules`, `dist`), tanyakan pengguna apakah memakai Git
- **Selesai bila:** semua folder ada, cadangan identik dengan aslinya (cek ukuran file/hash)

### Fase 1 — Audit dan verifikasi data
- [x] Tulis `tools\audit.mjs` sesuai `DATA_SPEC.md` bagian 6
- [x] Hasilkan `reports\audit-report.md` dan `reports\audit-report.json`
- [x] Konfirmasi angka audit sama dengan bagian 4 dokumen ini (jika beda, laporkan)
- [x] **Tanyakan pengguna** total di situs SPKT untuk Cagar Budaya, Lembaga Budaya, dan Sarana & Prasarana, lalu bandingkan dengan data lokal
- [x] Tulis kesimpulan: scraping lengkap atau terpotong. Jika terpotong, **berhenti** dan rekomendasikan crawl ulang (jangan crawl sendiri)
- **Selesai bila:** laporan audit ada dan pengguna sudah menyatakan lanjut atau memutuskan crawl ulang

### Fase 2 — Pembersihan dan pengayaan data
- [x] Tulis `tools\clean.mjs` sesuai `DATA_SPEC.md` bagian 4
- [x] Hasilkan semua berkas di `public\data\clean\` (daftar di `DATA_SPEC.md` bagian 5)
- [x] Tulis `tools\validate.mjs` dan pastikan lolos semua aturan di `DATA_SPEC.md` bagian 7
- [x] Hasilkan `reports\clean-report.md` (berapa dibuang, digabung, diperbaiki)
- **Selesai bila:** `validate.mjs` lolos tanpa error, laporan ada

### Fase 3 — Aset peta (GeoJSON)
- [x] Cari GeoJSON batas provinsi Indonesia **38 provinsi** dari sumber terbuka berlisensi jelas
- [x] Verifikasi: tepat 38 fitur, kode cocok dengan tabel kode di `DATA_SPEC.md` bagian 3
- [x] Sederhanakan geometri (target < 300 KB) tanpa merusak bentuk pulau kecil
- [ ] (Opsional) titik tengah kabupaten/kota untuk ±131 kabupaten yang muncul di data
- [x] Catat sumber dan lisensi di `reports\geo-sources.md`
- **Selesai bila:** `web\public\data\geo\provinsi.geojson` valid dan semua 38 provinsi bisa dicocokkan dengan data
- Jika tidak bisa mengunduh, **jangan mengarang batas wilayah.** Minta pengguna mengunduh manual dan beri langkah jelasnya.

### Fase 4 — Kerangka web dan sistem desain
- [x] Inisialisasi Vite di `web\` (vanilla)
- [x] Skrip `npm run sync-data` (salin `public\data\clean\*` ke `web\public\data\`)
- [x] Terapkan design tokens, tipografi, reset CSS (`WEB_SPEC.md` bagian 6)
- [x] Layout dasar, navigasi, footer dengan atribusi
- [x] Loader data + penanganan error jaringan/data
- **Selesai bila:** `npm run dev` menampilkan kerangka dengan data terbaca, `npm run build` sukses

### Fase 5 — Peta dan scrollytelling inti
- [x] Peta SVG provinsi dengan skala warna yang sesuai (`WEB_SPEC.md` bagian 5)
- [x] Bagian 1–4 alur halaman (pembuka, peta menyala, konsentrasi, provinsi gelap)
- [x] Animasi GSAP + ScrollTrigger sesuai spesifikasi, dengan versi `prefers-reduced-motion`
- **Selesai bila:** bagian 1–4 berjalan mulus di desktop dan lebar ponsel (360 px)

### Fase 6 — Jelajah (explorer) dan kartu cerita
- [x] Klik provinsi → panel detail (ringkasan, 5 jenis OPK, Cagar Budaya)
- [x] Daftar kartu cerita dengan ringkasan, filter jenis, pencarian teks
- [x] Halaman/dialog detail rekaman (deskripsi lengkap dengan "baca selengkapnya")
- [x] Penanganan rekaman "multi-kabupaten" dan "tanpa deskripsi"
- **Selesai bila:** semua 28 provinsi berdata bisa dijelajahi dan 10 provinsi kosong menampilkan keadaan kosong yang jujur

### Fase 7 — Fitur interaktif: Paspor Budaya dan Kuis
- [x] Paspor Budaya (stempel per provinsi, simpan di `localStorage` dengan `try/catch`)
- [x] Kuis dari data (`WEB_SPEC.md` bagian 8)
- [x] Bagian penutup + ajakan kontribusi
- **Selesai bila:** keduanya berjalan, tidak error saat `localStorage` tidak tersedia

### Fase 8 — Poles: aksesibilitas, performa, responsif
- [x] Audit kontras warna (≥ 4,5:1 untuk teks), navigasi keyboard, label ARIA, urutan fokus
- [x] Performa: ukuran total awal < 1,5 MB, gambar/aset ringan, lazy-load bagian berat
- [x] Uji lebar 360, 390, 768, 1024, 1440 px
- [x] Meta SEO + Open Graph (judul, deskripsi, gambar share dibuat via kode/SVG→PNG jika memungkinkan)
- [x] Halaman 404 / state error ramah
- **Selesai bila:** Lighthouse (dijalankan pengguna) Performance ≥ 85 dan Accessibility ≥ 95 di mobile, atau pengguna menyatakan cukup

### Fase 9 — (OPSIONAL) Sentuhan 3D
- [x] Hanya dikerjakan jika pengguna memintanya. Satu globe/peta berputar di pembuka dengan Three.js murni kode
- [x] Wajib ada fallback 2D untuk perangkat lemah dan `prefers-reduced-motion`

### Fase 10 — Rilis dan dokumentasi
- [ ] Deploy statis (tanyakan pilihan hosting ke pengguna)
- [ ] `README.md` untuk juri/pengguna: tujuan, cara menjalankan, sumber data, atribusi, keterbatasan
- [ ] Naskah demo 3 menit (alur klik dan kalimat kunci) di `reports\naskah-demo.md`
- [ ] Rencana cadangan demo (data statis sudah lokal, tidak perlu internet kecuali font)

---

## 8. Definition of Done (berlaku untuk seluruh proyek)

- Tidak ada data yang dikarang; semua angka di web bisa ditelusuri ke file data.
- Setiap provinsi gelap diberi label jelas "belum tercatat di SPKT", bukan "tidak punya budaya".
- Berjalan tanpa error konsol pada Chrome, Firefox, Safari (versi terbaru) dan Chrome Android.
- Bekerja di lebar 360 px tanpa scroll horizontal.
- `prefers-reduced-motion` dihormati.
- Navigasi keyboard dan teks alternatif dasar tersedia.
- Atribusi dan tanggal pengambilan data tampil.
- `npm run build` tanpa error maupun peringatan serius.
- Tidak ada kunci API, rahasia, atau path pribadi di kode yang dipublikasikan.

---

## 9. Pemeliharaan (maintenance)

Pengguna akan merawat dan menyempurnakan proyek ini bertahap. Bagian ini adalah **catatan hidup**. Agent wajib memperbaruinya.

### 9.1 Daftar celah dan utang teknis (Known Gaps)

| ID | Celah | Status | Catatan |
|---|---|---|---|
| G-01 | Scraping kemungkinan terpotong (Cagar Budaya 13 per jenis, Lembaga 3, Sarana 3) | Diterima | Diputuskan pengguna: pakai data 544 rekaman apa adanya dengan disclaimer jujur di web |
| G-02 | Jenis OPK baru 5 jenis; belum diverifikasi apakah SPKT punya lebih banyak | Diterima | Diputuskan pengguna: gunakan 5 jenis OPK yang tersedia di data lokal |
| G-03 | Koordinat nyaris tidak ada (2/544) | Diterima | Gunakan titik tengah kabupaten |
| G-04 | Foto tidak tersedia | Diterima | Pola generatif SVG |
| G-05 | 10 provinsi tanpa data | Diterima | Dijadikan pesan sosial |
| G-06 | GeoJSON 38 provinsi belum ada | Selesai | `provinsi.geojson` (38 provinsi, 56,5 KB) dibuat & lolos validasi V-14 di Fase 3 |
| G-07 | Teks deskripsi belum diuji untuk potongan ringkasan di kalimat singkatan (Kab., Dr., dll.) | Selesai | Pemecah kalimat aman singkatan diuji & lolos validasi V-08 di Fase 2 |
| G-08 | 1 rekaman di Bali (`7399f372...`) memiliki `nama: "#NAME?"` dari sumber SPKT (objek Uyah Amed) | Diterima | Dipertahankan sesuai Aturan Emas 1 (jangan mengarang/mengubah isi sumber) |

Agent menambah baris baru setiap menemukan celah, dan mengubah status bila selesai.

### 9.2 Format CHANGELOG.md

```
## [Tanggal] Fase X — judul singkat
- Dibuat/diubah: file ...
- Hasil: ...
- Temuan: ...
- Keputusan pengguna: ...
- Belum selesai / catatan: ...
```

### 9.3 Cara memperbarui data di kemudian hari

1. Pengguna (atau agent atas perintah eksplisit pengguna) mengambil data baru dan menaruhnya di `public\data\` **setelah** menyalin versi lama ke `backup-raw\<tanggal>\`.
2. Jalankan: `node tools/audit.mjs` → `node tools/clean.mjs` → `node tools/validate.mjs` → `npm run sync-data` (dari folder `web`).
3. Periksa `reports\` untuk perubahan angka. Perbarui teks narasi yang memuat angka hardcode (sebisa mungkin angka diambil dinamis dari data, bukan ditulis tangan).
4. Catat di `CHANGELOG.md`.

### 9.4 Log keputusan (Decision Log)

| Tanggal | Keputusan | Alasan |
|---|---|---|
| 2026-10-12 | Web memakai Vite + vanilla JS + d3-geo + GSAP | Ringan, mudah dirawat, cocok untuk peta tanpa titik koordinat |
| 2026-10-12 | Tanpa foto; pakai pola generatif SVG | Field `gambar` tidak bisa dipakai |
| 2026-10-12 | Konsep: "yang sedikit adalah yang tercatat" | Data timpang, jadi pesan sosial |
| 2026-10-12 | 3D hanya opsional | Risiko performa ponsel; agent tidak membuat aset 3D |
| 2026-10-13 | Akar proyek ditetapkan di `lokalokal\`, data mentah disalin ke `public\data\` & `backup-raw\`, memakai Git | Memisahkan proyek web dari folder scraper asli tanpa mengubah sumber |
| 2026-10-13 | Tetap menggunakan dataset lokal 544 rekaman tanpa crawl ulang, dengan disclaimer jujur di web | Efisiensi waktu lomba & transparansi keterbatasan tangkapan data |
| 2026-10-13 | Nama resmi situs ditetapkan menjadi **Lokalocal** | Dipilih langsung oleh pengguna menjelang Fase 8 |

---

## 10. Prompt pembuka yang disarankan untuk pengguna

Salin ke agent di awal tiap sesi:

```
Baca AGENTS.md sampai habis, lalu CHANGELOG.md jika ada.
Kerjakan Fase [X] saja. Jangan lanjut ke fase berikutnya sebelum aku bilang lanjut.
Sebelum menulis kode, tampilkan rencana langkahmu. Setelah selesai, jalankan validasi,
update checklist & CHANGELOG, lalu laporkan hasil dan hal yang butuh keputusanku.
```

Untuk Fase 1, tambahkan: *"Total Cagar Budaya di SPKT saat ini: … ; Lembaga Budaya: … ; Sarana & Prasarana: …"*.
