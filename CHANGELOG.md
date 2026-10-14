# CHANGELOG — Proyek "Atlas Budaya"

## [2026-10-13] Fase 0 — Persiapan dan keamanan
- **Dibuat/diubah:**
  - Folder `public/data/`, `public/data/clean/`, `backup-raw/`, `tools/`, `reports/`
  - Salinan 4 file data mentah (`budaya.json`, `meta.json`, `opk-per-provinsi.json`, `provinsi-summary.json`) ke `public/data/` dan `backup-raw/`
  - `.gitignore` dan repositori Git (`.git/`)
  - `CHANGELOG.md`
  - `AGENTS.md` (checklist Fase 0 & Decision Log)
- **Hasil:**
  - Lingkungan terverifikasi: Node.js `v24.18.0` (≥ 20) dan npm `11.16.0` (via `npm.cmd`).
  - Ke-4 file data mentah telah disalin ke `public/data/` dan `backup-raw/` dengan ukuran serta hash SHA-256 yang 100% identik dengan sumber di `../scraping/public/data/`:
    - `budaya.json`: 938.764 byte (`5012D4C6B274FE4E...`)
    - `meta.json`: 491 byte (`E55E1ACD8AB9F920...`)
    - `opk-per-provinsi.json`: 7.788 byte (`F2E8DEAABB8C54FE...`)
    - `provinsi-summary.json`: 14.246 byte (`154DF0E0D1EA0197...`)
- **Temuan:**
  - Workspace aktif berada di `C:\Users\Tyoo\Documents\Lomba Programming\lokalokal`, terpisah dari folder scraper asli di `C:\Users\Tyoo\Documents\Lomba Programming\scraping`.
  - PowerShell ExecutionPolicy memblokir `npm.ps1`, sehingga pemanggilan npm di terminal menggunakan `npm.cmd`.
- **Keputusan pengguna:**
  - Menjadikan `C:\Users\Tyoo\Documents\Lomba Programming\lokalokal` sebagai akar proyek dan menyalin 4 file JSON mentah ke `lokalokal\public\data` serta `lokalokal\backup-raw` tanpa mengubah folder `scraping`.
  - Menggunakan Git (`git init` + `.gitignore`).
- **Belum selesai / catatan:**
  - Fase 0 selesai sepenuhnya. Siap masuk ke Fase 1 (Audit dan verifikasi data).

## [2026-10-13] Fase 1 — Audit dan verifikasi data
- **Dibuat/diubah:**
  - `tools/audit.mjs`
  - `reports/audit-report.md` dan `reports/audit-report.json`
  - `AGENTS.md` (checklist Fase 1, Known Gaps G-01 & G-02, Decision Log)
- **Hasil:**
  - Seluruh 11 poin audit pada `DATA_SPEC.md` bagian 6 telah dijalankan terhadap `public/data/*.json`.
  - Angka audit 100% cocok dengan Bagian 4 `AGENTS.md`: 544 rekaman (473 OPK, 65 Cagar Budaya, 3 Lembaga Budaya, 3 Sarana & Prasarana) + 5 SDM Kebudayaan (agregat); 28 provinsi berdata, 10 provinsi tanpa data; Sumatera Barat 119 rekaman (21,88%) dan Kota Pariaman 94 rekaman (17,28%); 413 deskripsi terisi, 131 kosong; 3 grup duplikat murni dan 34 nama berulang; 1 rekaman bertahun `1970`.
- **Temuan:**
  - Cagar Budaya masing-masing tepat 13 rekaman per subkategori (total 65, seluruhnya tanpa deskripsi), Lembaga Budaya 3, dan Sarana & Prasarana 3 — mengonfirmasi indikasi bahwa tangkapan API saat scraping awal terpotong oleh kendala paginasi/HTTP 500 pada endpoint list-data.
  - Pada `provinsi-summary.json`, bagian `top_10_per_kategori` untuk Lembaga Budaya (9 provinsi) dan Sarana & Prasarana (7 provinsi) berisi pengisi (`count: 0`).
- **Keputusan pengguna:**
  - Tetap menggunakan dataset lokal saat ini (544 rekaman) apa adanya tanpa melakukan crawl ulang, dengan mencantumkan keterbatasan data secara jujur di disclaimer website, lalu melanjutkan ke Fase 2.
- **Belum selesai / catatan:**
  - Fase 1 selesai sepenuhnya. Siap masuk ke Fase 2 (Pembersihan dan pengayaan data).

## [2026-10-13] Fase 2 — Pembersihan dan pengayaan data
- **Dibuat/diubah:**
  - `tools/clean.mjs` dan `tools/validate.mjs`
  - 6 berkas keluaran di `public/data/clean/`: `budaya.clean.json`, `provinsi.json`, `statistik.json`, `kabupaten.json`, `index-pencarian.json`, `meta.clean.json`
  - `reports/clean-report.md`
  - `AGENTS.md` (checklist Fase 2, Known Gaps G-07 & G-08)
- **Hasil:**
  - Dari 544 rekaman mentah: dihapus 3 duplikat murni (C-06) menjadi 541 rekaman; digabungkan 26 grup tradisi multi-kabupaten berdeskripsi identik (C-07) menjadi 493 rekaman bersih akhir (`budaya.clean.json`, ukuran 951,6 KB).
  - 58 rekaman berhuruf kapital penuh atau huruf kecil penuh dirapikan ke Title Case pada `nama_tampil` (C-02).
  - 1 rekaman bertahun `1970` diubah menjadi `null` pada `tahun_input` (C-04).
  - 361 ringkasan otomatis ($\le 240$ karakter, aman dari singkatan) berhasil dibuat (C-09); 132 rekaman berstatus `punya_deskripsi: false` (< 40 karakter).
  - Kelas konten: `unggulan` 155, `pendek` 65, `panjang` 141, `kosong` 132.
  - `node tools/validate.mjs` lolos dengan **0 error** (V-01 s.d. V-13 terpenuhi seluruhnya).
- **Temuan:**
  - 4 grup nama berulang dalam satu provinsi (`Ketoprak Dor Deli Serdang`, `Krilu`, `Bahasa Kotawaringin`, `Dungga Roro`) memiliki deskripsi yang berbeda bermakna antar entri sehingga tidak digabung sesuai aturan C-07, dan 1 nama (`Bahasa Arab`) berada di provinsi berbeda.
  - Ditemukan 1 rekaman di Bali (`7399f372-bc95-4342-bb2e-089355bd8fa7`, Kab. Buleleng) dengan `nama: "#NAME?"` dari sumber SPKT (deskripsi membahas "Uyah Amed / Garam Amed"); dipertahankan apa adanya sesuai Aturan Emas 1.
- **Keputusan pengguna:**
  - Tidak ada keputusan tambahan yang tertunda pada fase ini; daftar 26 entri gabungan C-07 telah dilampirkan di `reports/clean-report.md`.
- **Belum selesai / catatan:**
  - Fase 2 selesai sepenuhnya. Siap masuk ke Fase 3 (Aset peta GeoJSON 38 provinsi).
## [2026-10-13] Fase 3 — Aset peta (GeoJSON)
- **Dibuat/diubah:**
  - `tools/build-geo.mjs`
  - `public/data/clean/provinsi.geojson` dan `web/public/data/geo/provinsi.geojson`
  - `reports/geo-sources.md`
  - `tools/validate.mjs` (penambahan aturan V-14)
  - `AGENTS.md` (checklist Fase 3 & Known Gaps G-06)
- **Hasil:**
  - Mengunduh dan menormalisasi GeoJSON batas administrasi 38 provinsi Indonesia dari repositori terbuka `denyherianto/indonesia-geojson-topojson-maps-with-38-provinces` (CC BY 4.0 / MIT).
  - Seluruh 38 fitur telah dipetakan 1:1 dengan `kode` (`11` s.d. `96`) dan `nama` resmi pada `DATA_SPEC.md` Bagian 3, dilengkapi titik tengah `pusat` (`[lng, lat]`) dan kotak pembatas `bbox` (`[minLng, minLat, maxLng, maxLat]`).
  - Geometri disederhanakan ke presisi 4 desimal tanpa menghapus poligon pulau kecil: ukuran akhir **56,5 KB** (jauh di bawah batas target 300 KB).
  - `node tools/validate.mjs` lolos **0 error** termasuk aturan `V-14` untuk `web/public/data/geo/provinsi.geojson`.
- **Temuan:**
  - Pada file sumber mentah, 4 provinsi pemekaran Papua (`Papua Selatan`, `Papua Tengah`, `Papua Pegunungan`, `Papua Barat Daya`) sudah memiliki geometri dan nama `PROVINSI` yang terpisah, tetapi atribut `KODE_PROV` masih memakai kode induk (`91`/`92`). Skrip `tools/build-geo.mjs` mencocokkan berdasarkan nama provinsi terlebih dahulu terhadap tabel referensi sehingga ke-38 provinsi memperoleh kode resmi `11` s.d. `96` secara akurat.
- **Keputusan pengguna:**
  - Tidak ada keputusan tambahan yang tertunda pada fase ini.
- **Belum selesai / catatan:**
  - Fase 3 selesai sepenuhnya. Siap masuk ke Fase 4 (Kerangka web dan sistem desain).

## [2026-10-13] Fase 4 — Kerangka web dan sistem desain
- **Dibuat/diubah:**
  - `web/package.json`, `web/vite.config.js`, `web/scripts/sync-data.mjs`
  - `web/public/favicon.svg` dan salinan 7 berkas data bersih di `web/public/data/`
  - `web/src/styles/tokens.css`, `web/src/styles/base.css`, `web/src/styles/layout.css`, `web/src/styles/components.css`
  - `web/src/config.js`, `web/src/content/teks.js`
  - `web/src/util/format.js`, `web/src/util/teks.js`, `web/src/util/hash.js`, `web/src/util/a11y.js`
  - `web/src/data/loader.js`
  - `web/src/ui/nav.js`, `web/src/ui/footer.js`, `web/src/ui/toast.js`
  - `web/index.html`, `web/src/main.js`
  - `AGENTS.md` (checklist Fase 4)
- **Hasil:**
  - Proyek Vite (vanilla JS, ES Modules) diinisialisasi di `web/` dengan paket `vite`, `d3-geo`, `d3-scale`, `gsap`, `@fontsource-variable/fraunces`, dan `@fontsource-variable/plus-jakarta-sans`.
  - Skrip `npm run sync-data` menyalin 7 berkas dari `public/data/clean/` ke `web/public/data/` (termasuk `geo/provinsi.geojson`).
  - Sistem desain (`tokens.css`, `base.css`, `layout.css`, `components.css`) diterapkan dengan kontras warna WCAG AA, tipografi fluid Fraunces & Plus Jakarta Sans, fokus keyboard aksesibel, dan dukungan `prefers-reduced-motion`.
  - Kerangka halaman `S1`–`S8`, navigasi tetap dengan penanda bagian aktif (`IntersectionObserver`) + menu ponsel, dialog `<dialog>` "Tentang Data & Keterbatasan", serta footer atribusi dinamis dari `meta.clean.json` telah berjalan.
  - Loader data bertahap (`muatDataAwal` dan `jadwalkanMuatDataLengkap`) membaca seluruh JSON lokal dan dilengkapi banner error ramah berbahasa Indonesia + tombol "Coba lagi".
  - `npm run build` sukses dalam 216 ms (JS bundle 12,20 KB / gzip 4,75 KB; CSS 17,43 KB / gzip 5,67 KB) dan server pengembangan (`npm run dev`) terverifikasi menyajikan halaman serta data.
- **Temuan:**
  - Seluruh paket font variabel berhasil di-bundle secara lokal (self-hosted `.woff2`), sehingga halaman tidak bergantung pada jaringan internet saat demo.
- **Keputusan pengguna:**
  - Nama situs sementara menggunakan default `"Atlas Budaya"` di `src/config.js` (dapat dipilih pengguna sebelum Fase 8).
- **Belum selesai / catatan:**
  - Fase 4 selesai sepenuhnya. Siap masuk ke Fase 5 (Peta SVG provinsi dan scrollytelling inti S1–S4 dengan GSAP + ScrollTrigger).

## [2026-10-13] Fase 5 — Peta dan scrollytelling inti
- **Dibuat/diubah:**
  - `web/src/map/projection.js`, `web/src/map/scales.js`, `web/src/map/render.js`, `web/src/map/interactions.js`
  - `web/src/util/motion.js`
  - `web/src/sections/hero.js`, `web/src/sections/nyala.js`, `web/src/sections/konsentrasi.js`, `web/src/sections/gelap.js`
  - `web/src/styles/sections.css`
  - `web/index.html`, `web/src/main.js`
  - `tools/build-geo.mjs` dan `public/data/clean/provinsi.geojson` (normalisasi arah putaran cincin poligon *winding order* untuk geometri bola `d3-geo`)
  - `AGENTS.md` (checklist Fase 5)
- **Hasil:**
  - Peta SVG 38 provinsi dirender dengan proyeksi Mercator `d3-geo` (`viewBox="0 0 1000 400"`), terurut berdasarkan `kode` (`11`–`96`), lengkap dengan `<pattern>` arsir diagonal untuk 10 provinsi `belum_tercatat`, label aksesibel (`role="button"`, `tabindex="0"`, `aria-label`), tooltip apung, serta 9 lingkaran sentuh transparan (`hit-circle`) untuk provinsi berukuran kecil.
  - Skala warna `scaleSqrt` (`d3-scale`) dan mode warna **Jenis OPK Dominan** diterapkan sesuai `WEB_SPEC.md` Bagian 5.
  - Bagian `S1` (Pembuka dengan siluet peta & titik cahaya halus), `S2` (Peta menyala dari barat ke timur + penghitung count-up + 4 langkah cerita), `S3` (Diagram waffle $10\times 10$ Kota Pariaman 17% + bar horizontal 5 provinsi teratas + catatan jujur), dan `S4` (Peta sorotan 10 provinsi berarsir belum tercatat + 10 chip interaktif + kartu penjelasan jujur) selesai diimplementasikan.
  - Animasi GSAP + ScrollTrigger (`A-01` s.d. `A-08`) dibungkus `gsap.matchMedia()` dengan pembedaan desktop vs ponsel serta dukungan penuh `prefers-reduced-motion: reduce`.
  - `npm run build` sukses dalam 887 ms tanpa error maupun peringatan (JS gzip `71,59 KB`, CSS gzip `7,05 KB`).
- **Temuan:**
  - Cincin poligon pada GeoJSON standar RFC 7946 berarah *counter-clockwise*, yang oleh geometri bola `d3-geo` dianggap membungkus luar bola bumi. Ditambahkan normalisasi arah cincin (*clockwise* untuk cincin luar, *counter-clockwise* untuk lubang) pada `tools/build-geo.mjs` dan `web/src/map/projection.js` sehingga `geoBounds` pas membungkus Indonesia (`[95.19, -10.93]` s.d. `[141.02, 5.91]`) dan urutan `cx` barat-ke-timur merentang akurat dari Aceh (`cx: 64.2`) hingga Papua Pegunungan (`cx: 942.4`).
- **Keputusan pengguna:**
  - Tidak ada keputusan tambahan yang tertunda pada fase ini.
- **Belum selesai / catatan:**
  - Fase 5 selesai sepenuhnya. Siap masuk ke Fase 6 (Jelajah/explorer, panel detail provinsi, pola generatif SVG kartu cerita, filter jenis, pencarian teks, dan dialog detail rekaman).

## [2026-10-13] Fase 6 — Jelajah (explorer) dan kartu cerita
- **Dibuat/diubah:**
  - `web/src/patterns/generate.js`
  - `web/src/ui/kartu.js`, `web/src/ui/dialog-rekaman.js`, `web/src/ui/panel-provinsi.js`, `web/src/ui/tabel-daftar.js`
  - `web/src/sections/jelajah.js`, `web/src/sections/kisah.js`
  - `web/src/styles/components.css`, `web/src/styles/sections.css`
  - `web/index.html`, `web/src/main.js`
  - `AGENTS.md` (checklist Fase 6)
- **Hasil:**
  - Generator pola SVG deterministik (`src/patterns/generate.js`) membangkitkan motif berdasarkan `hashString(id)` untuk 5 jenis OPK (`kerajinan` belah ketupat berlapis, `seni` kelopak lingkaran, `lisan` gelombang bertumpuk, `pengetahuan` segitiga tumpal, `adat` chevron zig-zag) serta Cagar Budaya (`cagar` persegi bata bertingkat).
  - Komponen kartu cerita (`src/ui/kartu.js`) mendukung varian `unggulan`, `biasa`, dan `tanpa-deskripsi` (*"SPKT belum memuat deskripsi untuk objek ini."* tanpa tombol baca), serta menampilkan lencana *"Tercatat di {n} kabupaten"* untuk rekaman gabungan multi-kabupaten.
  - Dialog detail rekaman (`src/ui/dialog-rekaman.js`) menampilkan deskripsi lengkap yang dipecah ke dalam paragraf aman singkatan, dilengkapi tombol *"Tampilkan semua"* untuk deskripsi $> 1.500$ karakter (diuji pada *Okokan* $26.736$ karakter $\rightarrow$ 49 paragraf dalam $1,31\text{ ms}$), daftar chips kabupaten, sumber SPKT, dan label **"Tahun pencatatan"**.
  - Panel detail provinsi (`src/ui/panel-provinsi.js`) merender ringkasan metrik, bar warna 5 jenis OPK, Cagar Budaya, SDM agregat (jika $>0$), dan kabupaten teratas untuk 28 provinsi berdata, serta keadaan kosong yang jujur + tombol *"Tandai: aku peduli"* + rekomendasi provinsi terdekat untuk 10 provinsi `belum_tercatat`.
  - Bagian S5 Jelajah (`src/sections/jelajah.js`) menyediakan 4 mode warna peta, kontrol zoom (`+`, `−`, `100%`), tabel alternatif aksesibel 38 provinsi (`src/ui/tabel-daftar.js`), pilih cepat 38 provinsi, pencarian teks ber-*debounce* 200 ms, filter chip jenis multi-pilih, dan kisi kartu cerita dengan paginasi 12 kartu (*"Muat lebih banyak"*).
  - Bagian S6 Kisah Pilihan (`src/sections/kisah.js`) menampilkan 6 kartu besar `unggulan` dari 6 provinsi berbeda yang mewakili kelima jenis OPK dengan animasi masuk `A-09`.
  - `npm run build` sukses dalam 1,02 detik tanpa error maupun peringatan (JS gzip `80,51 KB`, CSS gzip `8,61 KB`).
- **Temuan:**
  - Seluruh 493 rekaman unik dan 38 provinsi bekerja mulus pada mode peta, tabel alternatif, pencarian, maupun filter jenis.
- **Keputusan pengguna:**
  - Tidak ada keputusan tambahan yang tertunda pada fase ini.
- **Belum selesai / catatan:**
  - Fase 6 selesai sepenuhnya. Siap masuk ke Fase 7 (Fitur interaktif: Paspor Budaya 38 stempel provinsi dengan `localStorage` aman & Kuis 8 soal otomatis dari data).

## [2026-10-13] Fase 7 — Fitur interaktif: Paspor Budaya dan Kuis
- **Dibuat/diubah:**
  - `web/src/patterns/generate.js` (penambahan `buatStempelProvinsiSvg`)
  - `web/src/features/paspor.js`, `web/src/features/kuis.js`
  - `web/src/sections/paspor.js`, `web/src/sections/kuis.js`, `web/src/sections/penutup.js`
  - `web/src/styles/sections.css`
  - `web/index.html`, `web/src/main.js`
  - `AGENTS.md` (checklist Fase 7)
- **Hasil:**
  - **Paspor Budaya (`src/features/paspor.js` & `src/sections/paspor.js`):** Menyimpan koleksi stempel 38 provinsi di `localStorage` dengan kunci `atlasbudaya:paspor:v1` yang dibungkus `try/catch` penuh serta fallback memori sementara dan catatan status jika `localStorage` diblokir/tidak tersedia. Mendukung stempel provinsi tercatat (`biasa`) saat membuka panel provinsi di S5 serta stempel **"Penjaga Cerita"** (`penjaga`, garis putus-putus emas) saat menekan tombol *"Tandai: aku peduli"* pada 10 provinsi `belum_tercatat`. Dilengkapi animasi stempel `A-11`, bar progres, perayaan saat 38/38 lengkap, dan tombol *"Mulai ulang paspor"* dengan konfirmasi.
  - **Kuis Interaktif (`src/features/kuis.js` & `src/sections/kuis.js`):** Menyaring 205 kandidat soal bersih (`ringkasan !== null`, `jumlah_kabupaten === 1`, `nama_tampil` unik di seluruh dataset, dan bukan `#NAME?`) dan membangkitkan 8 soal unik per sesi (4 soal Tipe A tebak asal provinsi dengan petunjuk ringkasan yang disensor nama daerahnya, 3 soal Tipe B tebak jenis OPK diawali *"Menurut SPKT, …"*, dan 1 soal Tipe C fakta data nasional). Menyediakan umpan balik ramah berfokus otomatis (`tabindex="-1"`), penanda ikon + warna (`✓` / `✕`), tombol *"Lihat di peta"* dan *"Baca kisah lengkap"*, serta layar hasil akhir dengan 3 tradisi yang ditemui dan fitur bagikan skor.
  - **Bagian Penutup S8 (`src/sections/penutup.js`):** Menampilkan ringkasan dinamis progres jejak Paspor Budaya pengunjung serta tautan kontribusi ke SPKT Kementerian Kebudayaan.
  - `npm run build` sukses dalam 1,04 detik tanpa error maupun peringatan (JS gzip `86,81 KB`, CSS gzip `9,38 KB`).
- **Temuan:**
  - Penyaringan ketat `saringKandidatSoalKuis` menghasilkan 205 rekaman kandidat berkualitas tinggi dari 27 provinsi berdata sehingga setiap sesi kuis selalu bervariasi dan bebas dari soal ambigu lintas provinsi.
- **Keputusan pengguna:**
  - Menunggu pilihan nama situs final dari pengguna sebelum masuk ke Fase 8 (Poles: aksesibilitas, performa, responsif, SEO/Open Graph).
- **Belum selesai / catatan:**
  - Fase 7 selesai sepenuhnya. Siap masuk ke Fase 8 setelah konfirmasi pengguna.

## [2026-10-13] Fase 8 — Poles: aksesibilitas, performa, responsif
- **Dibuat/diubah:**
  - `web/src/config.js` (`NAMA_SITUS = 'Lokalocal'`)
  - `web/src/styles/tokens.css`, `web/src/styles/components.css`, `web/src/styles/sections.css`
  - `web/src/main.js`, `web/src/sections/jelajah.js`, `web/src/sections/kuis.js`, `web/src/sections/penutup.js`
  - `web/index.html`
  - `web/public/og-image.svg`, `web/public/404.html`, `web/public/robots.txt`
  - `AGENTS.md` (checklist Fase 8 & Decision Log)
- **Hasil:**
  - **Nama Situs & SEO/Open Graph:** Mengubah nama situs menjadi **Lokalocal** di seluruh elemen halaman, judul `<title>`, Open Graph (`og:title`, `og:description`, `og:image` `1200×630`), dan Twitter Card (`summary_large_image`). Menambahkan gambar share `web/public/og-image.svg` (`1200×630`) dan `web/public/robots.txt`.
  - **Audit Kontras Warna & Aksesibilitas (WCAG 2.1 AA):** Melengkapi token `--aksen-2`, `--sukses`, dan `--peringatan` di `tokens.css` serta memverifikasi seluruh 19 pasangan warna teks/latar memenuhi kontras $\ge 4,5:1$ (rentang `5,89:1` s.d. `15,91:1`). Memastikan ukuran target sentuh $\ge 44\times 44\text{ px}$ pada seluruh tombol kontrol, struktur 1 `<h1>`, dan 8 `<section>` ber-`aria-labelledby` valid.
  - **Performa & Pemecahan Kode (Code Splitting):** Menerapkan `import()` dinamis di `main.js` untuk modul `dialog-rekaman`, `paspor`, `kuis`, dan `penutup`. Bundle JS utama turun menjadi `216,70 KB` (`81,15 KB` gzip, jauh di bawah batas $150\text{ KB}$ gzip) dan total muat awal hanya $\pm 0,44\text{ MB}$ (jauh di bawah anggaran $1,5\text{ MB}$). Dipastikan 0 `console.log` di seluruh 32 berkas `web/src/`.
  - **Responsivitas (360 px – 1440 px & Lanskap Pendek):** Menyesuaikan grid metrik dan padding kartu/dialog untuk lebar 360 px & 390 px tanpa *overflow* horizontal, menambahkan aturan orientasi lanskap pendek (`max-height: 540px`) pada peta S2, serta menggulirkan panel provinsi otomatis ke pandangan saat provinsi dipilih pada layar $< 1024\text{ px}$.
  - **Halaman 404 Ramah:** Membuat `web/public/404.html` berbahasa Indonesia bergaya senada (*"Halaman ini belum tercatat di peta kami"*).
- **Temuan:**
  - Seluruh aturan validasi data (`node tools/validate.mjs`) dan build produksi (`npm run build`) lolos dengan 0 error.
- **Keputusan pengguna:**
  - Menetapkan nama situs menjadi **Lokalocal**.
- **Belum selesai / catatan:**
  - Fase 8 selesai sepenuhnya. Menunggu keputusan pengguna apakah ingin melewati Fase 9 (opsional 3D) dan langsung ke Fase 10 (Rilis dan dokumentasi), atau mengerjakan Fase 9 terlebih dahulu.

## [2026-10-13] Fase 9 — (OPSIONAL) Sentuhan 3D
- **Dibuat/diubah:**
  - `web/package.json` (penambahan paket `three`)
  - `web/src/config.js` (`FITUR_OPSIONAL.globe3D = true`)
  - `web/src/features/globe-hero.js`
  - `web/src/sections/hero.js`
  - `web/src/styles/sections.css`
  - `web/vite.config.js`
  - `AGENTS.md` (checklist Fase 9)
- **Hasil:**
  - **Globe 3D Nusantara Murni Kode (`src/features/globe-hero.js`):** Menampilkan bola dunia lengkung yang menghadap sabuk kepulauan Indonesia (~118° BT) dengan garis pantai 38 provinsi hasil proyeksi koordinat `provinsi.geojson` ke permukaan bola 3D, jaring lintang-bujur halus, dan 38 titik cahaya provinsi (28 provinsi berdata menyala sesuai warna jenis OPK dominan, 10 provinsi `belum_tercatat` redup) tanpa memuat tekstur/aset `.glb` eksternal.
  - **Pemuatan Dinamis & Fallback 2D (`src/sections/hero.js`):** Peta siluet SVG 2D (`A-02`) selalu dirender terlebih dahulu sebagai dasar instan. Fungsi `apakahMendukungGlobe3D()` memeriksa dukungan WebGL, `prefers-reduced-motion`, mode hemat data (`saveData`), dan spesifikasi perangkat (`hardwareConcurrency`/`deviceMemory`); jika lolos barulah `globe-hero.js` dimuat secara dinamis (`import()`), sehingga bundle JS utama tetap `81,44 KB` gzip.
  - **Penghematan Baterai & Kinerja:** `devicePixelRatio` dibatasi maksimum `1,5`, loop render otomatis berhenti saat bagian S1 keluar layar (`IntersectionObserver`) atau saat tab tidak aktif (`visibilitychange`), serta otomatis melepas memori WebGL (`dispose()`) bila pengguna mengaktifkan `prefers-reduced-motion`.
  - `npm run build` sukses dalam 1,91 detik dengan **0 error dan 0 peringatan**.
- **Temuan:**
  - Pemisahan `globe-hero.js` menjadi *chunk* asinkron tersendiri membuat waktu muat awal halaman tidak terdampak pada perangkat yang hanya memakai fallback 2D.
- **Keputusan pengguna:**
  - Meminta pengerjaan Fase 9 (Sentuhan 3D).
## [2026-10-13] Fase 9 (Diorama 3D Low-Poly) — Checkpoint 1: Peta Statis
- **Dibuat/diubah:**
  - `web/package.json` (pin versi exact `"three": "0.186.1"`)
  - `web/src/util/geo.js` (algoritma Douglas–Peucker dan perhitungan luas poligon prosedural tanpa dependensi)
  - `web/src/sections/hero3d/fallback.js` (pemeriksaan WebGL, prefers-reduced-motion, mode hemat data, dan deteksi hardware lemah)
  - `web/src/sections/hero3d/build-provinces.js` (generasi 38 keping provinsi 3D low-poly via ExtrudeGeometry, rotasi -90° X, jitter deterministik, pivot di titik tengah, dan parameter ledakan deterministik)
  - `web/src/sections/hero3d/build-clouds.js` (12 gugus awan low-poly icosahedron mengitari diorama)
  - `web/src/sections/hero3d/build-scene.js` (rakitan Scene Three.js, papan laut diorama silinder `#24336E` berbingkai bevel `#3A52B0` dengan gelombang halus, pencahayaan HemisphereLight + DirectionalLight berbayangan PCF lembut)
  - `web/src/sections/hero3d/pose.js` (fungsi pose murni deterministik untuk state resting dan progress)
  - `web/src/sections/hero3d/index.js` (pengontrol siklus hidup, framing kamera responsif 360 px – 1440 px, parallax pointer desktop, overlay debug `?debug3d=1`, observer pause on off-screen/tab hidden)
  - `web/src/sections/hero.js` & `web/src/styles/sections.css` (penghubung hero3d dengan fallback instan 2D SVG bila WebGL tidak tersedia)
  - `tools/verify-hero3d-cp1.mjs` (skrip audit geometri dan budget segitiga)
- **Hasil:**
  - Tepat 38 keping provinsi 3D berkoordinat riil telah terbangun dan terpusat di atas papan laut diorama.
  - Total segitiga adegan: **21.024 segitiga** (38 provinsi = 18.900, papan laut = 1.404, awan = 720). Sangat hemat dan jauh di bawah batas anggaran desktop ($\le 150.000$) maupun ponsel ($\le 80.000$).
  - Orientasi geografis valid: Barat/Aceh (X = -3,71) hingga Timur/Papua (X = +3,46) serta Utara (-Z) dan Selatan (+Z) persis sejajar dengan proyeksi 2D SVG `projection.js`.
  - Mode debug `?debug3d=1` berfungsi menampilkan live FPS, jumlah segitiga, draw calls, canvas size, DPR, tombol toggle warna, dan slider pengatur progress.
  - Build produksi Vite sukses 100% (0 error, 0 warning) dengan bundle terisolasi via dynamic import.
- **Temuan:**
  - Jumlah koordinat GeoJSON `provinsi.geojson` (2.673 titik) sangat ideal sehingga tidak diperlukan pemangkasan pulau kecil tambahan; bentuk pulau tetap terjaga dan performa tetap tinggi.
- **Keputusan pengguna:**
  - Melanjutkan integrasi 3D ke alur opening dan beranda: saat situs dibuka tampil peta utuh full, saat scroll turun peta pecah dan isi beranda tersingkap, saat scroll naik peta menyatu kembali.

## [2026-10-13] Fase 9 (Diorama 3D Low-Poly) — Checkpoint 2 & 3: Pecah-Menyatu Terikat Scroll
- **Dibuat/diubah:**
  - `tools/verify-hero3d-cp2.mjs` (pengujian matematis fungsi pose murni dan reversibilitas bolak-balik $0 \rightarrow 1 \rightarrow 0$)
  - `web/index.html` (penambahan elemen interaktif `#s1-prompt-scroll` dengan badge "Atlas 3D Nusantara" dan panah petunjuk scroll)
  - `web/src/styles/sections.css` (gaya visual `.s1-prompt-scroll`, animasi panah bouncing `s1-panah-ayun`, serta transisi transform & opacity untuk konten beranda `.s1-konten`)
  - `web/src/sections/hero.js` (implementasi `pasangScrollTriggerHeroDiorama` dengan GSAP ScrollTrigger pin `end: '+=150%'` dan scrub halus `0.6` mengontrol progress [0, 1])
  - `CHANGELOG.md`
- **Hasil:**
  - **Reversibilitas Deterministik 100% (CP-2):** Skrip `verify-hero3d-cp2.mjs` membuktikan bahwa setelah siklus bolak-balik 200 langkah ($0 \rightarrow 1 \rightarrow 0$), selisih posisi, rotasi, dan skala di $p = 0$ bernilai **0.0000e+0** ($< 10^{-6}$), bebas drift atau residu.
  - **Pengalaman Scroll Opening & Beranda (CP-3):**
    - Saat web dibuka (opening / $p = 0$): Layar menampilkan **Peta 3D Indonesia utuh (full) diorama** di tengah layar dengan awan mengitari kepulauan dan goyangan halus (idle), disertai prompt scroll mengambang.
    - Saat pengguna scroll turun: Section pembuka di-pin, peta 3D **pecah** (38 kepingan provinsi melayang dan berputar ke luar), sementara **isi beranda** (judul, penjelasan 544 catatan, dan 4 kartu metrik budaya) terangkat menyingkap masuk ke tengah layar.
    - Di ujung scroll ($p > 0.84$), pemandangan memudar halus berganti ke bagian S2 (Peta Menyala).
    - **Saat pengguna scroll naik kembali:** Kepingan provinsi yang terbang melayang berputar balik dan **MENYATU PERSIS SEPERTI SEMULA** menjadi peta nusantara utuh di atas papan laut diorama.
  - Build produksi lolos dengan **0 error dan 0 warning**.
- **Belum selesai / catatan:**
  - Checkpoint 1, 2, dan 3 telah selesai dan terintegrasi penuh.

## [2026-10-13] Fase 9 (Diorama 3D Low-Poly) — Peta Full-Screen, Mode Jelajah 3D, & Tiang Bendera Budaya
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/bendera.js` (komponen Tiang 3D emas + kartu popover bendera panji budaya nusantara beranimasi)
  - `web/src/sections/hero3d/jelajah3d.js` (Peta Diorama 3D berskala besar khusus bagian Jelajah dengan fitur drag-putar horizontal, kontrol zoom in/out, dan raycaster bendera)
  - `web/src/sections/hero3d/index.js` (pembesaran framing kamera hero: `radiusTarget` diubah dari 7.6 menjadi 4.1 untuk kesan full-screen, penambahan raycaster hover/click pada kepingan provinsi)
  - `web/src/sections/jelajah.js` (integrasi Peta 3D Jelajah, toggle format `[🌐 Diorama 3D]` vs `[🗺️ Peta 2D]`, sinkronisasi zoom terpadu, dan sinkronisasi klik bendera dengan panel provinsi)
  - `web/index.html` (penambahan tombol toggle format peta di bar kontrol Jelajah dan id bingkai peta)
  - `web/src/styles/sections.css` (gaya visual kartu bendera `.diorama-bendera-kartu`, tombol toggle dimensi `.s5-toggle-dimensi`, dan bingkai peta 3D berskala tinggi `.s5-bingkai-peta.is-mode-3d`)
  - `CHANGELOG.md`
- **Hasil:**
  - **Peta Lebih Besar (Full Screen Feel):** Kamera diatur mendekat sehingga pulau-pulau nusantara dan papan diorama laut membentang luas mengisi ~88% layar desktop tanpa membuang banyak ruang kosong hitam.
  - **Peta 3D Berskala Lebih Besar di Jelajah:** Bagian Jelajah (`#jelajah`) kini menampilkan Peta 3D Diorama berskala besar yang interaktif secara default. Pengguna dapat memutar diorama dengan mouse drag dan mengatur zoom (+ / -).
  - **Sistem Tiang Bendera Detail Budaya:** Saat salah satu provinsi diklik (baik di opening maupun di jelajah), tiang bendera 3D emas menancap di atas provinsi tersebut dan memunculkan kartu bendera yang memuat:
    - Nama Provinsi
    - Status SPKT (Tercatat vs Belum Tercatat)
    - Total Catatan Budaya
    - Rincian jenis OPK (Kerajinan, Seni, Tradisi Lisan, Pengetahuan, Adat Ritus, Cagar Budaya)
    - Tombol "Lihat Koleksi Budaya &rarr;" yang membuka panel detail budaya lengkap.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.
- **Belum selesai / catatan:**
  - Seluruh fitur 3D interaktif telah berjalan mulus dan responsif.

## [2026-10-13] Multi-Page Application (MPA) — Pembagian Menu Navbar Menjadi Halaman Mandiri
- **Dibuat/diubah:**
  - `web/jelajah.html` & `web/src/pages/jelajah.js` (Halaman mandiri Jelajah Budaya dengan Peta 3D Nusantara, Panel Provinsi, dan Arsip Tradisi)
  - `web/paspor.html` & `web/src/pages/paspor.js` (Halaman mandiri Paspor Budaya 38 Provinsi dengan 38 petak stempel dan lencana penjelajah)
  - `web/kuis.html` & `web/src/pages/kuis.js` (Halaman mandiri Kuis Budaya Interaktif berbasis data nyata SPKT)
  - `web/index.html` (Halaman Cerita / Beranda dengan Scrollytelling Peta 3D Diorama)
  - `web/src/ui/nav.js` (pembaruan sistem navigasi dengan penanda halaman aktif `aria-current="page"`)
  - `web/vite.config.js` (konfigurasi Rollup multi-input untuk 4 berkas HTML)
  - `CHANGELOG.md`
- **Hasil:**
  - Setiap menu pada bilah navigasi kini memiliki halaman mandiri tersendiri:
    - **Cerita:** `index.html` (Beranda & narasi scrollytelling pembuka)
    - **Jelajah:** `jelajah.html` (Eksplorasi peta 3D diorama berskala besar, tiang bendera budaya, dan kisi arsip)
    - **Paspor:** `paspor.html` (Buku paspor koleksi stempel 38 provinsi)
    - **Kuis:** `kuis.html` (Arena uji wawasan tradisi nusantara)
  - Setiap halaman memiliki URL mandiri, judul `<title>`, meta deskripsi spesifik, serta indikator navbar aktif yang sesuai.
  - Build produksi Vite multi-page sukses menghasilkan 4 halaman HTML terpisah di `dist/` dalam 2,12 detik dengan 0 error dan 0 warning.
  - Keempat rute merespons status HTTP 200 OK di dev server.
- **Belum selesai / catatan:**
  - Struktur multi-halaman selesai sepenuhnya dan siap diuji.

## [2026-10-13] Halaman Jelajah 3D Full-Screen Murni (Immersive Diorama) & Panji Bendera Detail Wilayah
- **Dibuat/diubah:**
  - `web/jelajah.html` (disederhanakan murni menjadi tampilan 100% selayar penuh tanpa elemen section bawah atau celah gulir, dilengkapi toolbar Floating HUD mengambang)
  - `web/src/pages/jelajah.js` (pengontrol inisialisasi peta 3D fullscreen, event listener kontrol HUD, penanganan dialog rekaman dan integrasi paspor budaya)
  - `web/src/sections/hero3d/jelajah3d.js` (framing kamera diorama lebih dekat dan megah, zoom responsif, resetRotasi orbit, toggle mode warna alami vs data, dan passing data budaya ke bendera)
  - `web/src/sections/hero3d/bendera.js` (kartu panji bendera diperkaya: nama & kode provinsi, total catatan & peringkat nasional, komposisi jenis OPK, kabupaten kontributor teratas, daftar warisan budaya unggulan riil yang dapat diklik untuk membaca deskripsi lengkap, tombol stempel paspor, serta pemosisian responsif anti-terpotong)
  - `web/src/styles/sections.css` (gaya visual `.halaman-fullscreen-*`, `.jelajah-layar-penuh-main`, toolbar Floating HUD diorama, dan penyempurnaan kartu panji bendera di desktop & ponsel)
  - `CHANGELOG.md`
- **Hasil:**
  - **Tampilan 100% Selayar Penuh (Zero-Scroll):** Halaman Jelajah kini sepenuhnya mengalokasikan seluruh viewport (100vw x 100vh) untuk Peta 3D Diorama Indonesia tanpa adanya teks beranda panjang, kisi kartu bawah, atau footer yang mengganggu.
  - **Floating HUD Elegan:** Toolbar mengambang di pojok kanan bawah menyediakan kontrol Perbesaran Zoom (+ / − / 100%), Reset Putar Orbit 360°, dan Toggle Mode Warna (Alami / Data OPK Dominan).
  - **Panji Bendera Detail Wilayah Lengkap:** Setiap kali pulau provinsi diklik:
    - Tiang 3D emas menancap tepat di pusat provinsi dengan bendera mini berkibar.
    - Kartu panji bendera menampilkan status pendataan SPKT, komposisi jenis OPK, kabupaten kontributor utama, dan daftar tradisi unggulan nyata dari data SPKT yang dapat diklik langsung untuk membuka modal kisah lengkap.
    - Tersedia tombol satu-klik "Kumpulkan Stempel Paspor" untuk mencatat provinsi tersebut ke Paspor Budaya.
  - Build produksi lolos dengan **0 error dan 0 warning**.
- **Belum selesai / catatan:**
  - Halaman Jelajah telah beroperasi penuh sesuai permintaan pengguna.

## [2026-10-13] Perbaikan Cacat: Banner Error Palsu & Artefak Geometri 3D Keping Pulau
- **Dibuat/diubah:**
  - `web/src/pages/jelajah.js` (memperbaiki pemanggilan `jadwalkanMuatDataLengkap` menggunakan callback yang sesuai sehingga tidak lagi melempar `TypeError: Cannot read properties of undefined (reading 'then')`)
  - `web/jelajah.html` (memastikan `#banner-error-data` default tersembunyi dengan `display: none` ketika berstatus `hidden`)
  - `web/src/sections/hero3d/build-provinces.js` (menghilangkan jitter vertex acak yang merusak topologi poligon permukaan pulau, mengurangi ketebalan ekstrusi dari 0.35 menjadi 0.18 agar pulau kecil tidak menjadi tiang tinggi, menggunakan bevel mikro 0.015 yang bersih, dan memfilter poligon mikro degenerate)
  - `web/src/sections/hero3d/build-scene.js` (menyesuaikan posisi vertikal papan laut silinder menjadi y = -0.20 agar permukaan laut tidak memotong/menenggelamkan dasar daratan keping pulau)
  - `web/src/sections/hero3d/index.js` (meningkatkan sudut elevasi kamera dari 31° menjadi 38° agar seluruh kepulauan nusantara terlihat jelas dari sudut 3/4 isometrik tanpa tumpang tindih)
  - `CHANGELOG.md`
- **Hasil:**
  - **Banner Error Hilang:** Banner merah "Gagal memuat data budaya" tidak lagi muncul keliru di layar.
  - **Daratan Mulus & Bersih:** Garis-garis retakan tajam dan artefak jaring kawat pada permukaan atas pulau hilang total; pulau tampil bersih, rapi, dan kokoh dengan gaya low-poly mainan diorama yang estetik.
  - **Proporsi Sempurna:** Pulau-pulau kecil tidak lagi mencuat seperti pilar tinggi, dan papan laut diorama menyangga kepulauan nusantara dengan anggun tanpa menenggelamkan pulau.
  - Build produksi lolos dengan **0 error dan 0 warning**.

## [2026-10-13] Navigasi Mengambang Glassmorphism & Dashboard Sinematik Alam-Budaya Nusantara
- **Dibuat/diubah:**
  - `web/src/sections/hero-cinema.js` (komponen pengontrol latar belakang sinematik video-like alam & budaya nusantara dengan efek Ken Burns halus, auto-advance 6 detik, HUD lokasi, dan dots kontrol)
  - `web/src/sections/hero.js` (integrasi hero cinema, transisi GSAP halus untuk konten utama dan kartu kaca)
  - `web/src/styles/layout.css` (navigasi mengambang floating pill dengan `backdrop-filter: blur(20px)`, rounded-full, active state putih solid, dan drawer ponsel melayang)
  - `web/src/styles/sections.css` (gaya visual dashboard sinematik ala referensi Sunrock: judul display besar, subjudul, CTA pil putih dengan badge panah sirkular, dan 2 kartu kaca frosted glass di sudut kiri & kanan bawah)
  - `web/src/ui/nav.js` & `web/src/ui/footer.js` (penambahan tombol dan dialog modal `Tentang Kami` di seluruh halaman)
  - `web/index.html`, `web/jelajah.html`, `web/paspor.html`, `web/kuis.html` (penyelarasan menu navbar mengambang 6 butir: Cerita, Jelajah, Paspor, Kuis, Tentang data, Tentang kami + tombol aksi Jelajah 3D)
  - `CHANGELOG.md`
- **Hasil:**
  - **Navigasi Mengambang Glassmorphism:** Bilah navigasi kini melayang di atas konten dengan sudut membulat penuh (*pill*), efek latar blur kaca buram, penanda aktif berbentuk pil putih tegas, dan tombol aksi "Jelajah 3D" di sisi kanan.
  - **Latar Sinematik Seperti Video:** Latar belakang beranda kini memutar 8 destinasi ikonik wisata alam dan budaya Indonesia (Candi Borobudur, Raja Ampat, Gunung Bromo, Candi Prambanan, Pulau Padar/Komodo, Kete Kesu Toraja, Danau Toba, dan Pura Ulun Danu Beratan Bali) dengan pergerakan kamera Ken Burns lambat yang menyerupai video rekaman udara (*aerial drone reel*).
  - **Tata Letak Dashboard Sesuai Gambar Referensi:**
    - Di tengah: Judul display megah, narasi pembuka, dan tombol CTA pil putih elegan berikon panah sirkular (*"Telusuri Cerita Budaya ↗"*).
    - Di sudut kiri bawah: Kartu kaca buram (*frosted glass*) "544 Warisan Budaya SPKT" dengan ikon lencana.
    - Di sudut kanan bawah: Kartu kaca buram (*frosted glass*) "Celah & Dampak Dokumentasi" dengan ikon kompas.
  - **Dialog Modal "Tentang Kami":** Menyajikan profil platform Lokalocal, visi sosial, empat pilar eksplorasi, serta komitmen etika data.
  - Build produksi lolos dengan **0 error dan 0 warning**.

## [2026-10-13] Penyesuaian Blur Navbar 30%, Statis Tanpa Animasi, & Latar 5 Detik Otomatis
- **Dibuat/diubah:**
  - `web/src/styles/layout.css` (menetapkan opasitas latar belakang navbar menjadi 30% `rgba(18, 16, 14, 0.3)` dengan `backdrop-filter: blur(16px) saturate(180%)`, serta menonaktifkan seluruh animasi/transisi gulir sehingga navbar 100% diam dan stay di tempatnya)
  - `web/src/ui/nav.js` (menghapus event listener scroll pada header agar tidak ada pergantian kelas/gaya saat digulir)
  - `web/src/sections/hero-cinema.js` (menghapus HUD lencana lokasi dan titik indikator, mengubah durasi pergantian otomatis menjadi tepat 5 detik per slide, serta menghapus jeda hover agar latar belakang terus berputar secara konsisten)
  - `web/index.html` & `web/src/styles/sections.css` (menghapus elemen pill kicker "Atlas Budaya & Alam Nusantara" dan CSS terkait)
  - `CHANGELOG.md`
- **Hasil:**
  - Blur navbar jernih dengan opasitas 30% dan navbar tetap berada di posisinya secara statis tanpa animasi.
  - Tampilan beranda bersih tanpa HUD badge/kicker yang mengganggu.
  - Latar belakang foto alam dan budaya nusantara berpindah secara otomatis dan mulus setiap 5 detik sekali.
## [2026-10-13] Pemisahan Navbar Menjadi 3 Komponen Mandiri (Logo, Menu Tengah, Tombol 3D)
- **Dibuat/diubah:**
  - `web/src/styles/layout.css` (memisahkan wadah `.nav-bar` menjadi 3 elemen mandiri dengan CSS Grid `1fr auto 1fr` pada desktop: Logo Lokalocal di kiri, kapsul daftar menu di tengah dengan blur 30%, dan tombol Jelajah 3D di kanan dengan blur 30%)
  - `web/src/ui/nav.js` & berkas HTML (`index.html`, `jelajah.html`, `paspor.html`, `kuis.html`)
  - `CHANGELOG.md`
- **Hasil:**
  - **Pemisahan 3 Elemen Navbar:**
    1. **Sisi Kiri:** Logo merek "Lokalocal" dengan lambang belah ketupat emas melayang anggun mandiri di kiri.
    2. **Tengah (Center):** Kapsul daftar navigasi (Cerita, Jelajah, Paspor, Kuis, Tentang data, Tentang kami) mengambang presisi di tengah layar dengan latar kaca buram (*frosted blur*) opasitas 30% dan tab aktif pil putih solid.
    3. **Sisi Kanan:** Tombol kapsul "Jelajah 3D ↗" (atau "Baca Cerita →" di halaman jelajah) berdiri mandiri di kanan dengan efek frosted blur 30% yang senada.
  - **Bebas Animasi & Statis:** Seluruh elemen navbar tetap diam di posisinya (*stay*) tanpa lonjakan atau pergeseran saat halaman digulir.
  - Build produksi lolos dengan **0 error dan 0 warning**.

## [2026-10-13] Fitur Dark Mode & Light Mode Serta Transformasi Editorial Bento Bab 1–3
- **Dibuat/diubah:**
  - `web/src/ui/tema.js` (modul baru untuk manajemen preferensi tema gelap/terang, persistensi `localStorage`, sinkronisasi atribut `[data-tema]`, pemancar event kustom `lokalocal-ganti-tema`, serta listener toggle pada tombol desktop dan ponsel)
  - `web/src/styles/tokens.css` (definisi token warna lengkap untuk `[data-tema="terang"]`: latar kertas gading hangat `#F9F6F0`, kartu putih `#FFFFFF`, tipografi espresso pekat `#1C1917` berkontras > 14:1, garis batas lembut `#E2D9CD`, dan aksen emas pekat `#B87314`)
  - `web/src/styles/layout.css` (penataan tombol toggle tema mengambang di kanan navbar `.nav-tombol-tema`, tombol drawer tema ponsel, serta penyesuaian navbar kaca frosted di mode terang)
  - `web/src/styles/sections.css` (gaya visual Editorial Bento Blog Grid 5 kartu dan Popular Destinations 5 kolom horizontal ala referensi gambar perjalanan)
  - `web/index.html` (transformasi presentasi Bab 1 s.d. Bab 3 menjadi Bento Magazine Grid dengan 1 kartu besar di kiri, 4 kartu di kanan 2x2, baris 5 destinasi teratas, serta drawer toggle accordion untuk mengakses infografis peta D3 interaktif, grafik waffle 10x10, dan peta 10 provinsi gelap asli)
  - `web/jelajah.html`, `web/paspor.html`, `web/kuis.html` (dukungan script anti-FOUC tema instan dan tombol toggle tema di seluruh halaman)
  - `web/src/main.js`, `web/src/pages/jelajah.js`, `web/src/pages/paspor.js`, `web/src/pages/kuis.js` (inisialisasi tema dan pengkabelan interaksi klik kartu Bento ke drawer infografis)
  - `CHANGELOG.md`
- **Hasil:**
  - **Fitur Dark Mode & Light Mode Berfungsi Penuh:**
    - Tombol toggle tema (🌙 / ☀️) diletakkan rapi di sisi kanan navbar bersebelahan dengan tombol Jelajah 3D, sementara kapsul menu navigasi tengah dipertahankan bersih khusus untuk 6 butir menu utama (item teks "Mode Tampilan" di dalam menu telah dihapus sesuai permintaan).
    - Pilihan tema tersimpan secara persisten di `localStorage` dan dimuat seketika tanpa kedipan layar (*zero-FOUC*).
    - Mode Terang menampilkan estetika hangat bertema kertas koran/majalah (*editorial ivory*) dengan kontras teks yang memenuhi standar aksesibilitas WCAG AA (≥ 4.5:1).
  - **Transformasi Bab 1 — 3 Menjadi Tata Letak Majalah Editorial (Sesuai Gambar Referensi):**
    - **Bento Grid 5 Kartu:**
      1. *Kartu Kiri Besar (Bab 1):* Foto megah Candi Prambanan, badge `BAB 1 • PETA MENYALA`, judul display, ringkasan 544 catatan budaya dari 28 provinsi, serta avatar kurator & tanggal.
      2. *Kartu Kanan 1 (Bab 2):* Rumah Gadang Minangkabau, badge `BAB 2 • KONSENTRASI`, bahasan Kota Pariaman penyumbang 17% data.
      3. *Kartu Kanan 2 (Top 5):* Gunung Bromo, badge `TOP 5 WILAYAH`, bahasan 58,2% data terpusat di 5 provinsi.
      4. *Kartu Kanan 3 (Bab 3):* Raja Ampat Papua, badge `BAB 3 • YANG MASIH GELAP`, pesan sosial 10 provinsi belum tercatat.
      5. *Kartu Kanan 4 (Pusaka):* Desa Adat Toraja, badge `PUSAKA NUSANTARA`, 65 Cagar Budaya & 422 OPK resmi.
    - **Destinasi Unggulan (5 Kolom Horizontal):**
      - Deretan kartu foto berbingkai dengan ikon dan status catatan kebudayaan: Bali (38 catatan), Sumatera Barat (119 catatan), Jawa Tengah (79 catatan), Jawa Timur (61 catatan), dan D.I. Yogyakarta (45 catatan).
    - **Aksesibel & Interaktif:**
      - Tersedia tombol drawer *"Buka Peta Interaktif & Infografis Detail (Bab 1–3)"* yang memungkinkan pengunjung tetap mengeksplorasi peta D3 interaktif, waffle grid 10x10, dan peta 10 provinsi gelap secara penuh.
      - Mengklik masing-masing kartu Bento secara otomatis membuka drawer dan menggulir ke bagian visualisasi yang bersangkutan.
  - Build produksi lolos dengan **0 error dan 0 warning**.

## [2026-10-13] Penghapusan Kartu Kaca Hero & Perataan Teks Hero Rata Tengah
- **Dibuat/diubah:**
  - `web/index.html` (menghapus wadah `.hero-floating-cards` beserta 2 kartu kaca di dalamnya: "544 Warisan Budaya SPKT" dan "Celah & Dampak Dokumentasi")
  - `web/src/styles/sections.css` (menyesuaikan container `.s1-pembuka` dan `.hero-cinema-tengah` menjadi flexbox terpusat penuh dengan `justify-content: center; align-items: center; min-height: 100vh;`, mengatur teks judul, subjudul, dan deretan tombol CTA menjadi rata tengah simetris, serta membersihkan deklarasi CSS kartu kaca yang sudah tidak digunakan)
  - `web/src/sections/hero.js` (memperbarui timeline animasi GSAP agar hanya menganimasikan teks dan tombol CTA hero tanpa mencari kartu kaca)
  - `CHANGELOG.md`
- **Hasil:**
  - Bagian hero/beranda kini tampil bersih, elegan, dan fokus:
    - Judul utama *"Pesona Alam & Mahakarya Budaya Nusantara"*, subjudul narasi, serta tombol aksi *"Telusuri Cerita Budaya"* dan *"Jelajah Peta 3D"* terpusat sempurna di tengah layar secara vertikal dan horizontal.
    - Dua kartu kaca di bagian bawah hero telah dihilangkan sepenuhnya, memberikan ruang pandang yang lebih lega ke latar belakang sinematik alam dan budaya nusantara.
  - Build produksi lolos dengan **0 error dan 0 warning**.

## [2026-10-13] Transformasi Wilayah Unggulan Menjadi Top 5 Kebudayaan Indonesia yang Mendunia
- **Dibuat/diubah:**
  - `web/index.html` (mengubah Modul 2 dari deretan 5 provinsi unggulan menjadi **Top 5 Kebudayaan Indonesia yang Mendunia** yang diakui UNESCO: 1. Bambu Angklung, 2. Seni Wayang, 3. Batik, 4. Gamelan, 5. Tari Saman; menyematkan teks deskripsi lengkap untuk masing-masing kebudayaan; menyematkan tautan rujukan resmi ke situs Tribratanews Polri baik pada baris kepala maupun banner atribusi rujukan; serta memperbaiki URL foto Candi Prambanan dan Rumah Gadang Minangkabau di Bento Grid Bab 1 & 2)
  - `web/src/sections/hero-cinema.js` (memperbarui URL foto Candi Prambanan agar menampilkan candi batu asli)
  - `web/src/styles/sections.css` (menambahkan aturan CSS `.top5-budaya-grid`, kartu editorial `.budaya-top5-kartu`, badge UNESCO, tipografi teks, tombol pencarian ke katalog data, serta banner sumber rujukan `.top5-sumber-rujukan-bar` yang ramah mode gelap dan terang)
  - `CHANGELOG.md`
- **Hasil:**
  - Bagian Modul 2 di beranda kini menampilkan 5 warisan kebudayaan agung Indonesia yang diakui dunia internasional (UNESCO) lengkap dengan foto beresolusi tinggi, badge pengakuan, narasi mendalam, dan tombol penelusuran ke katalog data SPKT.
  - Tautan sumber rujukan ke artikel resmi Tribratanews Polri (`https://tribratanews.polri.go.id/blog/none-22/inilah-5-warisan-budaya-indonesia-yang-mendunia-52549`) terpasang jelas dan dapat diklik.
  - Foto Bento Grid Bab 1 (Prambanan) dan Bab 2 (Minangkabau) kini tampil tajam, akurat, dan tidak ada lagi gambar yang rusak (*broken*).
  - Build produksi lolos dengan **0 error dan 0 warning**.

## [2026-10-13] Penambahan Fitur Backsound Lagu Daerah Nusantara & Kontrol Pemutar Mengambang
- **Dibuat/diubah:**
  - `web/public/audio/` (mengunduh dan menyimpan 5 berkas audio lagu daerah Nusantara berkualitas tinggi berlisensi CC-BY-SA 4.0 dari arsip WikiDendang, Wikimedia Indonesia secara lokal: `ampar-ampar-pisang.mp3`, `kicir-kicir.mp3`, `bungong-jeumpa.mp3`, `soleram.mp3`, `yamko-rambe-yamko.mp3`)
  - `web/src/ui/audio.js` (modul baru pengontrol audio pemutar lagu berurutan dengan volume lembut default 18%, penanganan autoplay ramah kebijakan browser via interaksi pertama, transisi otomatis ke lagu berikutnya saat selesai, persistensi preferensi di `localStorage`, serta widget dock mengambang di kanan bawah)
  - `web/src/styles/components.css` (penataan gaya visual widget mengambang `.audio-backsound-dock`, kapsul frosted glass, equalizer audio interaktif yang bergerak saat lagu berputar, panel pop-up daftar 5 lagu, slider volume lembut, dan dukungan penuh mode gelap serta terang)
  - `web/src/main.js`, `web/src/pages/jelajah.js`, `web/src/pages/paspor.js`, `web/src/pages/kuis.js` (pengkabelan pemutar musik di seluruh halaman web)
  - `CHANGELOG.md`
- **Hasil:**
  - Website kini dilengkapi backsound instrumental/vokal tradisional yang syahdu dan tenang dengan urutan playlist persis sesuai permintaan:
    1. **Ampar-Ampar Pisang** (Kalimantan Selatan)
    2. **Kicir-Kicir** (DKI Jakarta)
    3. **Bungong Jeumpa** (Aceh)
    4. **Soleram** (Riau)
    5. **Yamko Rambe Yamko** (Papua)
  - Volume audio disetel rendah (18%) agar berfungsi sebagai latar belakang (*ambient backsound*) yang menenangkan tanpa mengganggu fokus membaca narasi budaya.
  - Pengunjung dapat menjeda, memutar, memilih lagu mana pun dari popup daftar putar, serta mengatur volume secara bebas melalui widget mengambang di sudut kanan bawah.
  - Berkas audio tersimpan lokal secara mandiri sehingga web dapat diputar 100% offline tanpa ketergantungan koneksi pihak ketiga.
  - Build produksi lolos dengan **0 error dan 0 warning**.

## [2026-10-13] Penyederhanaan Halaman Beranda (Penghapusan Bagian Jelajah, Kisah Pilihan, dan Paspor/Kuis)
- **Dibuat/diubah:**
  - `web/index.html` (menghapus `<section id="jelajah">` "Eksplorasi Data: Jelajahi Peta & Catatan Budaya", `<section id="kisah-pilihan">` "Kisah Pilihan: Potret tradisi dari berbagai penjuru", dan `<section id="paspor-kuis">` "Interaksi & Tantangan: Paspor Budaya & Uji Pengetahuanmu" dari halaman beranda `index.html`)
  - `web/src/sections/jelajah.js` & `web/src/sections/kisah.js` (menambahkan guard kondisional agar tidak error saat elemen-elemen DOM tersebut tidak ada di halaman beranda)
  - `web/src/main.js` (memperbarui rute interaksi klik provinsi pada peta drawer Bab 1 & Bab 3 serta klik kartu bento Cagar Budaya agar secara mulus mengarahkan pengunjung langsung ke halaman khusus `jelajah.html`)
  - `CHANGELOG.md`
- **Hasil:**
  - Halaman Beranda kini jauh lebih ramping, elegan, dan fokus sebagai panggung bercerita (*Storytelling & Editorial Showcase*), terdiri atas:
    1. **Hero Sinematik**: Latar berputar 5 detik sekali, tipografi rata tengah, dan tombol aksi.
    2. **Editorial Bento Magazine**: Sorotan Bab 1–3 dengan foto budaya beresolusi tinggi.
    3. **Top 5 Kebudayaan Dunia**: Angklung, Wayang, Batik, Gamelan, dan Saman berdasar rujukan resmi Tribratanews Polri.
    4. **Drawer Infografis Lengkap (Bab 1–3)**: Peta menyala, grafik konsentrasi, dan peta 10 provinsi belum tercatat yang dapat dibuka-tutup.
    5. **Penutup & Ajakan Aksi**: Pesan sosial dokumentasi budaya Nusantara dan atribusi resmi SPKT.
  - Seluruh fitur interaktif Eksplorasi Peta (`jelajah.html`), Paspor Budaya (`paspor.html`), dan Kuis Budaya (`kuis.html`) tetap dapat diakses secara leluasa melalui kapsul menu di navbar.
## [2026-10-13] Penyempurnaan Top 5 Kebudayaan: Foto Dokumenter Asli & Tata Letak Ringkas
- **Dibuat/diubah:**
  - `web/public/images/top5/` (mengunduh 5 foto dokumenter autentik beresolusi tinggi langsung dari arsip kebudayaan Nusantara terverifikasi Wikimedia Commons: `angklung.jpg`, `wayang.jpg`, `batik.jpg`, `gamelan.jpg`, dan `tari-saman.jpg` — menggantikan gambar eksternal dan bebas dari gambar AI/ilustrasi fantasi yang keliru konteks)
  - `web/index.html` (memperbarui sumber gambar ke berkas lokal `./images/top5/*.jpg`, menghapus paragraf deskripsi teks panjang dan tombol "Cari di Katalog Data" pada masing-masing dari ke-5 kartu kebudayaan, serta menghapus banner sumber rujukan di bagian bawah grid)
  - `web/src/styles/sections.css` (menyesuaikan proporsi tinggi gambar `.budaya-top5-foto-bungkus` menjadi 185px serta memadatkan padding `.budaya-top5-badan` menjadi ringkas, proporsional, dan estetis)
  - `CHANGELOG.md`
- **Hasil:**
  - Seluruh kartu Top 5 Kebudayaan kini menampilkan foto dokumenter asli warisan budaya Indonesia:
    1. **Bambu Angklung** (Pertunjukan Angklung Saung Udjo, Jawa Barat)
    2. **Seni Wayang** (Pertunjukan Wayang Kulit oleh Ki Dalang Tradisional)
    3. **Batik** (Pengrajin kain batik tulis tradisional menggunakan canting)
    4. **Gamelan** (Ansambel gong dan instrumen orkestra gamelan Jawa/Bali)
    5. **Tari Saman** (Barisan penari Saman asli suku Gayo, Aceh dalam busana adat tradisional)
  - Kartu tampil bersih, rapi, dan elegan tanpa teks deskripsi panjang maupun tombol footer, menyisakan foto autentik, badge UNESCO, ikon, judul, dan kategori budaya.
  - Hyperlink rujukan utama ke Tribratanews Polri tetap aktif dan tersedia di sisi kanan atas header (`Sumber: Tribratanews Polri ↗`).
  - Berkas tersimpan lokal di dalam repositori web sehingga gambar dimuat secara instan dan 100% offline.
## [2026-10-14] Pembaruan Bento Grid: 5 Destinasi Tempat Bersejarah di Indonesia (Indonesia.travel)
- **Dibuat/diubah:**
  - `web/public/images/bersejarah/` (mengunduh 5 foto dokumenter autentik beresolusi tinggi langsung dari arsip Wikimedia Commons secara lokal: `borobudur.jpg`, `rotterdam.jpg`, `mulawarman.jpg`, `maimun.jpg`, dan `kudus.jpg` — bebas gambar AI, bebas broken link, dan dimuat 100% offline)
  - `web/index.html` (memperbarui modul Bento Grid 5 kartu dengan konten 5 tempat bersejarah Nusantara: 1. Candi Borobudur, Jawa Tengah; 2. Benteng Rotterdam, Sulawesi Selatan; 3. Museum Mulawarman, Kalimantan Timur; 4. Istana Maimun, Sumatra Utara; 5. Masjid Menara Kudus, Jawa Tengah; menyematkan badge kategori, narasi sejarah, dan penunjuk lokasi berikon SVG; serta menambahkan hyperlink sumber resmi di pojok kanan atas ke Indonesia.travel)
  - `web/src/styles/sections.css` (menambahkan gaya badge lokasi `.bento-lokasi-badge` dengan efek frosted glass dan warna aksen emas elegan tanpa emoji)
  - `web/src/main.js` (menghubungkan interaksi klik setiap kartu bento tempat bersejarah langsung ke pencarian katalog data `jelajah.html`)
  - `CHANGELOG.md`
- **Hasil:**
  - Bento Grid di beranda kini menampilkan 5 destinasi tempat bersejarah termasyhur di Indonesia:
    1. **Candi Borobudur, Jawa Tengah**: Candi Buddha terbesar di dunia abad ke-8 Masehi peninggalan Dinasti Syailendra.
    2. **Benteng Rotterdam, Sulawesi Selatan**: Benteng pertahanan maritim berbentuk penyu peninggalan Raja Gowa ke-9 (1545).
    3. **Museum Mulawarman, Kalimantan Timur**: Bekas istana megah penyimpan pusaka dan singgasana Kesultanan Kutai Kartanegara.
    4. **Istana Maimun, Sumatra Utara**: Mahakarya arsitektur Kesultanan Deli perpaduan gaya Melayu, Islam, Spanyol, dan Italia (1888).
    5. **Masjid Menara Kudus, Jawa Tengah**: Masjid bersejarah dengan menara bata merah kuno wujud toleransi dan akulturasi Sunan Kudus (1549).
  - Hyperlink rujukan resmi di pojok kanan atas header mengarah langsung ke artikel resmi: `https://www.indonesia.travel/id/id/travel-ideas/heritage/tempat-bersejarah-di-indonesia`.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Background Hitam Pekat & Gradasi Transisi Halus (Seamless Fade-to-Black)
- **Dibuat/diubah:**
  - `web/src/styles/sections.css`:
    - Mengubah latar belakang `.editorial-section` (#cerita-editorial) menjadi hitam pekat murni (`#000000`).
    - Menambahkan lapisan gradasi transisi `.s1-pembuka::after` setinggi 340px dengan kurva `linear-gradient` ke `#000000` di bagian bawah Hero Cinema untuk menghilangkan garis horizontal potong yang tajam pada foto slideshow.
    - Menambahkan gradasi hitam lembut di bagian atas (`.editorial-section::before`) dan bawah (`.editorial-section::after`) setinggi 220px untuk transisi halaman yang mulus dan sinematik.
    - Memastikan `.editorial-section > .wadah` tetap di atas lapisan gradasi (`z-index: 2`).
  - `CHANGELOG.md`
- **Hasil:**
  - Garis batas tajam antara foto latar Hero dan section Bento Grid kini menghilang sepenuhnya, berganti menjadi transisi gradasi memudar ke hitam pekat (*fade to black*) yang sangat lembut, sinematik, dan berkelas.
  - Section Bento Grid dan Top 5 tampil elegan dengan background hitam pekat (`#000000`), memberikan kontras visual yang tajam terhadap foto-foto tempat bersejarah.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Penyesuaian Light Mode: Background Putih & Gradasi Putih Transisi
- **Dibuat/diubah:**
  - `web/src/styles/sections.css`:
    - Mengatur `.editorial-section` pada mode terang (`[data-tema="terang"]`) menjadi berlatar belakang putih bersih (`#ffffff`).
    - Menyesuaikan gradasi transisi atas di Hero (`[data-tema="terang"] .s1-pembuka::after`) dan atas editorial (`[data-tema="terang"] .editorial-section::before`) menjadi gradasi memudar ke putih (*fade-to-white*).
    - Menyesuaikan gradasi transisi bawah (`[data-tema="terang"] .editorial-section::after`) menjadi gradasi memudar ke putih (*fade-to-white*) menuju section di bawahnya.
    - Menyesuaikan warna teks judul editorial (`.editorial-judul-section`), subjudul Top 5 (`.editorial-subjudul-section`), dan kicker menjadi warna gelap kontras (`#14110F`) pada mode terang sehingga terbaca dengan sangat tajam dan jelas.
  - `CHANGELOG.md`
- **Hasil:**
  - Saat beralih ke Mode Terang (*Light Mode*):
    - Seluruh section editorial berubah bersih menjadi berlatar putih dengan teks gelap yang kontras dan tajam.
    - Transisi dari foto Hero di atas dan transisi ke section di bawahnya memudar secara lembut ke warna putih (*seamless fade-to-white*), tanpa adanya blok atau garis hitam yang tertinggal.
  - Saat beralih ke Mode Gelap (*Dark Mode*):
    - Tetap tampil sinematik dengan latar hitam pekat dan transisi memudar ke hitam (*fade-to-black*).
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Penyesuaian Tinggi Gradasi Transisi Hero & Editorial (Ramping & Proporsional)
- **Dibuat/diubah:**
  - `web/src/styles/sections.css`:
    - Mengurangi tinggi lapisan gradasi bawah Hero (`.s1-pembuka::after`) dari sebelumnya 340px menjadi **110px** agar tidak naik menutupi tombol CTA ("Telusuri Cerita Budaya" & "Jelajah Peta 3D") maupun teks narasi Hero.
    - Menyesuaikan lapisan `.hero-cinema-overlay` agar tidak menghasilkan kabut berlebih di bagian bawah tombol.
    - Mengurangi tinggi gradasi atas dan bawah `.editorial-section::before` & `::after` dari 220px menjadi **80px** serta merampingkan padding section.
  - `CHANGELOG.md`
- **Hasil:**
  - Foto pemandangan alam dan tombol aksi CTA di Hero kini tampil jernih, tajam, dan tidak lagi tertutup kabut gradasi putih/hitam yang terlalu tinggi.
  - Efek transisi memudar (*fade transition*) tetap bekerja dengan sangat mulus dan tepat berada di tepi batas bawah layar, baik di Mode Terang (*fade-to-white*) maupun Mode Gelap (*fade-to-black*).
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Penyelarasan Transparansi Blur Navbar pada Mode Terang (Light Mode)
- **Dibuat/diubah:**
  - `web/src/styles/layout.css`:
    - Mengubah opasitas latar belakang seluruh kapsul navigasi pada mode terang (`[data-tema="terang"] .nav-daftar`, `.nav-tombol-tema`, `.nav-tombol-aksi`, `.tombol-menu-ponsel`) dari sebelumnya 80% (`rgba(255, 255, 255, 0.8)`) menjadi **30% (`rgba(255, 255, 255, 0.3)`)** sehingga persis identik dengan mode gelap (`rgba(18, 16, 14, 0.3)`).
    - Mempertahankan efek kaca buram `backdrop-filter: blur(16px) saturate(180%)` dengan border lembut semi-transparan `rgba(255, 255, 255, 0.4)`.
    - Menyesuaikan ketebalan dan kontras font `.nav-tautan` agar tetap terbaca jelas dan elegan di atas kapsul transparan.
  - `CHANGELOG.md`
- **Hasil:**
  - Kapsul navigasi (menu tengah, tombol tema matahari, dan tombol Jelajah 3D) pada Mode Terang kini tampil dengan efek *frosted glass* kaca transparan 30% yang tembus pandang dan berbayang lembut, tidak lagi berwarna putih susu pekat dan seragam secara visual dengan Mode Gelap.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Penyelarasan Badge Bento Grid: Kapsul Emas Frosted Glass & Hyperlink Keemasan
- **Dibuat/diubah:**
  - `web/src/styles/sections.css`:
    - Mengubah badge kategori kartu Bento Grid (`.bento-badge`) menjadi kapsul bulat *pill* (`border-radius: 9999px; font-weight: 800`), berlatar belakang kaca buram semi-transparan (`background: rgba(18, 16, 14, 0.45); backdrop-filter: blur(12px) saturate(180%)`), bingkai tipis keemasan (`1px solid rgba(230, 177, 74, 0.4)`), dan warna teks emas `var(--aksen)` (`#E6B14A`), seragam 100% dengan badge pada kartu Top 5 Kebudayaan.
    - Menetralkan modifier warna hijau lama (`.badge-tips`, `.badge-destinasi`, `.badge-itinerary`, `.badge-foto`) sehingga seluruh badge tempat bersejarah tampil konsisten tanpa unsur kotak hijau.
    - Mengubah warna hyperlink rujukan pojok kanan atas (`.editorial-taut-semua`) dari sebelumnya hijau (`#2D6A4F` / `#52B788`) menjadi warna gold keemasan elegan (`var(--aksen)` `#E6B14A` di dark mode, `#B87314` di light mode; hover `#F0C368` / `#92580E`) yang senada dengan kicker judul.
  - `CHANGELOG.md`
- **Hasil:**
  - Seluruh badge di kartu Bento Grid (Candi Borobudur, Benteng Rotterdam, Museum Mulawarman, Istana Maimun, Masjid Menara Kudus) kini menggunakan kapsul bulat lonjong dengan efek blur kaca transparan keemasan yang serasi dengan kartu Top 5 dan navbar.
  - Tautan rujukan di pojok kanan atas tampil dengan warna gold keemasan yang harmonis di kedua mode tampilan.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Penyelarasan Kartu Top 5 Kebudayaan UNESCO Menjadi Full-Image Bento Card
- **Dibuat/diubah:**
  - `web/index.html`:
    - Mengubah struktur ke-5 kartu Top 5 Kebudayaan (Bambu Angklung, Seni Wayang, Batik, Gamelan, Tari Saman) dari format *split card* (foto di atas dan badan putih di bawah) menjadi format **Full-Image Bento Card** yang sama persis dengan kartu tempat bersejarah (Gambar 1).
    - Memasang elemen `.bento-gambar` (foto penuh melingkupi kartu), `.bento-overlay` (gradasi gelap sinematik), `.bento-badge-bungkus` > `.bento-badge` (kapsul emas *frosted glass* di pojok kiri atas), dan `.bento-konten` di bagian bawah foto.
    - Menambahkan ikon pin lokasi emas melingkar (`.bento-lokasi-badge`) beserta info lokasi 2 baris (asal daerah & tahun penetapan warisan takbenda UNESCO).
  - `web/src/styles/sections.css`:
    - Menghapus aturan layout split lama (`.budaya-top5-foto-bungkus`, `.budaya-top5-badan`, dll.).
    - Mengintegrasikan styling `.budaya-top5-kartu` dengan sistem `.bento-kartu`, mengatur tinggi kartu proporsional (`min-height: 285px` s.d. `315px` pada 5 kolom), serta merapikan padding dan ukuran font judul agar tampil simetris dan elegan di desktop maupun mobile.
  - `CHANGELOG.md`
- **Hasil:**
  - Seluruh kartu pada modul "Top 5 Kebudayaan Indonesia yang Mendunia" kini tampil sinematik dengan foto memenuhi seluruh kartu, overlay gradasi gelap, badge kapsul emas *frosted glass*, teks judul putih kontras di atas foto, serta ikon pin lokasi keemasan, 100% seragam dengan kartu tempat bersejarah di Gambar 1.
  - Tampilan konsisten sempurna di Mode Gelap maupun Mode Terang tanpa kotak putih terpisah.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Penghapusan Tombol Drawer Toggle Infografis (Alur Halaman Mulus & Langsung)
- **Dibuat/diubah:**
  - `web/index.html`:
    - Menghapus tombol toggle drawer `.editorial-toggle-wadah` (`#tombol-toggle-infografis` beserta label *"Buka/Sembunyikan Peta Interaktif & Infografis Detail (Bab 1–3)"*).
    - Menghapus elemen pembungkus `#wadah-infografis-lengkap` beratribut `hidden` sehingga seluruh konten Bab 1 (Peta Menyala), Bab 2 (Konsentrasi Budaya), dan Bab 3 (Provinsi Gelap) mengalir secara langsung, alami, dan terbuka permanen di alur halaman utama.
  - `web/src/main.js`:
    - Menyederhanakan `inisialisasiBentoEditorial()` dengan menghapus logika buka/tutup drawer infografis dan fokus pada interaksi navigasi kartu bento.
  - `web/src/styles/sections.css`:
    - Menghapus aturan CSS `.editorial-toggle-wadah`, `.tombol-toggle-infografis`, dan `.wadah-infografis-lengkap`.
  - `CHANGELOG.md`
- **Hasil:**
  - Tombol drawer toggle yang canggung dan mengapung di antara section editorial dan Bab 1 telah hilang sepenuhnya.
  - Pengunjung dapat menggulir (*scroll*) dari modul editorial (Tempat Bersejarah & Top 5 UNESCO) langsung ke Bab 1 — Peta Menyala secara mulus (*seamless*), tanpa perlu mengklik tombol ekspansi terlebih dahulu.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Penghapusan Section Infografis Bab 1, 2, dan 3 dari Halaman Beranda
- **Dibuat/diubah:**
  - `web/index.html`:
    - Menghapus seluruh section **Bab 1 — Peta Menyala** (`#peta-menyala`), **Bab 2 — Cahaya Tidak Merata** (`#konsentrasi`), dan **Bab 3 — Yang Masih Gelap** (`#provinsi-gelap`).
    - Memperbarui tautan tombol aksi utama pada Hero (`.hero-cta-pill`) dari sebelumnya mengarah ke `#peta-menyala` menjadi langsung mengarah ke `#editorial-bersejarah` (*"Telusuri Cerita Budaya"*).
  - `web/src/main.js`:
    - Menambahkan *DOM guard checks* (`if (document.getElementById(...))`) sebelum menginisialisasi modul `nyala.js`, `konsentrasi.js`, dan `gelap.js` guna mencegah referensi *null* dan menghemat alokasi memori.
  - `CHANGELOG.md`
- **Hasil:**
  - Halaman beranda kini tampil sangat ramping, fokus, dan elegan: mengalir dari Hero (Peta 3D Diorama & alam) $\rightarrow$ Tempat Bersejarah di Indonesia (Bento Grid) $\rightarrow$ Top 5 Kebudayaan UNESCO (Full-Image Card) $\rightarrow$ Penutup & Ajakan Aksi.
  - Tampilan visual bersih tanpa ada lagi blok infografis statistik yang memanjang di beranda.
  - Ukuran HTML berkurang dari 44,6 KB menjadi **35,5 KB** (turun 20%).
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Perombakan Section Penutup & Footer Menjadi Showcase Sinematik Mewah
- **Dibuat/diubah:**
  - `web/index.html`:
    - Mengubah Section Penutup (`#penutup`) menjadi **Kartu Akbar Showcase Ajakan Budaya** (`.penutup-kartu-akbar`):
      - Badge kapsul keemasan *frosted glass* (`# JAGA CERITANYA • MARI BERKONTRIBUSI`).
      - Judul display Fraunces akbar dengan efek teks gradasi emas berkilau (*"Budaya Indonesia tidak sedikit. Yang sedikit adalah yang sudah tercatat."*).
      - Menambahkan **3 Kartu Mini Pilar Aksi Budaya** bergaya Bento Grid (Kenali Warisan Sekitarmu, Catat Tutur Maestro, Daftarkan Perlindungan).
      - Mengemas pelacak Paspor Budaya (`#s8-ringkasan-jejak`) ke dalam kartu interaktif horizontal berikon stempel emas dan tautan langsung ke `./paspor.html`.
      - Menata baris tombol aksi (CTA) dengan tombol utama emas menyala, tombol sekunder kaca *frosted glass*, dan tombol kembali ke atas.
    - Mentransformasikan **Footer Utama** (`.footer-utama`) menjadi layout 3 kolom modern:
      - Kolom 1: Merek `Lokalocal` berikon monogram SVG emas + kartu atribusi resmi SPKT Kemendikbud (`#footer-atribusi-dinamis`) berlatar kaca buram.
      - Kolom 2: Navigasi cepat (*Beranda Cerita, Jelajah Katalog 3D, Paspor Budaya, Kuis Kebudayaan*).
      - Kolom 3: Pernyataan transparansi karya lomba + tombol dialog *"Baca Tentang Data & Keterbatasan"* (`#footer-tombol-tentang`) dan *"Tentang Pengembang"* (`#footer-tombol-tentang-kami`).
      - Baris bawah: Kutipan pesan sosial keemasan dan badge spesifikasi teknis (*Data Statis Lokal • Prefers-Reduced-Motion • WCAG 2.1 AA*).
  - `web/src/styles/sections.css`:
    - Menambahkan seluruh styling `.penutup-section`, `.penutup-kartu-akbar`, `.penutup-pilar-grid`, `.penutup-jejak-kotak`, dan tombol-tombol CTA emas/kaca dengan dukungan penuh mode gelap dan mode terang.
  - `web/src/styles/layout.css`:
    - Menambahkan seluruh styling modern `.footer-grid-modern`, `.footer-kolom-merek`, `.footer-atribusi-modern`, `.footer-kolom-nav`, `.footer-kolom-transparansi`, `.footer-tombol-kaca`, dan `.footer-bawah-modern`.
  - `web/src/ui/footer.js`:
    - Menghubungkan tombol `#footer-tombol-tentang-kami` di footer agar langsung membuka dialog tim pengembang.
  - `CHANGELOG.md`
- **Hasil:**
  - Bagian Penutup dan Footer kini tampil luar biasa menarik, sinematik, dan berkelas dunia, dengan estetika *glassmorphism* dan aksen keemasan yang serasi 100% dengan Bento Grid dan modul Top 5 Kebudayaan di atasnya.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Penyelarasan Background Hitam Pekat & Gradasi Transisi Halus (Dark & Light Mode)
- **Dibuat/diubah:**
  - `web/src/styles/sections.css`:
    - Mengubah warna latar belakang `.penutup-section` menjadi **hitam pekat murni (`#000000`)** di mode gelap (*Night Mode*), dan putih bersih (`#ffffff`) di mode terang (*Light Mode*).
    - Memasang lapisan gradasi transisi memudar (*fade-to-black gradient*) setinggi 80px di bagian atas (`.penutup-section::before`) yang menyambung mulus dari section Top 5 Editorial, serta di bagian bawah (`.penutup-section::after`) yang menyambung mulus ke Footer.
    - Pada mode terang, gradasi otomatis beralih menjadi memudar ke putih (*fade-to-white gradient*).
    - Menyesuaikan latar kartu akbar (`.penutup-kartu-akbar`) agar kontras mengapung secara elegan di atas hitam pekat dengan bayangan lembut.
  - `web/src/styles/layout.css`:
    - Mengubah warna latar belakang `.footer-utama` menjadi **hitam pekat murni (`#000000`)** di mode gelap dan putih bersih (`#ffffff`) di mode terang.
    - Memasang gradasi transisi memudar setinggi 60px di bagian atas footer (`.footer-utama::before`) untuk menjamin transisi 100% mulus tanpa ada garis atau blok warna yang terputus.
  - `CHANGELOG.md`
- **Hasil:**
  - Seluruh alur bawah halaman dari modul Top 5 Kebudayaan $\rightarrow$ Section Penutup $\rightarrow$ Footer kini menyatu dalam satu kesatuan warna hitam pekat (`#000000`) yang sinematik di Night Mode dan putih bersih (`#ffffff`) di Light Mode, dihubungkan oleh gradasi transisi lembut tanpa patahan warna.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Penghapusan Garis Pemisah (Border-Top) antara Penutup dan Footer
- **Dibuat/diubah:**
  - `web/src/styles/layout.css`:
    - Menghapus garis `border-top: 1px solid rgba(230, 177, 74, 0.25)` pada `.footer-utama` (diubah menjadi `border-top: none;` pada mode gelap maupun mode terang).
  - `CHANGELOG.md`
- **Hasil:**
  - Garis pemisah horizontal tipis di bawah tombol aksi penutup kini telah hilang sepenuhnya.
  - Bidang hitam pekat antara kartu akbar penutup dan footer kini menyatu secara mulus dan bersih (*seamless edge-to-edge*).
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Peniadaan Tuntas Garis Horizontal Menjalar (Border-Bottom .bagian) pada Penutup
- **Dibuat/diubah:**
  - `web/src/styles/layout.css`:
    - Menambahkan aturan override spesifik berbobot tinggi:
      `.bagian:last-of-type, .bagian.penutup-section, #penutup.bagian, #penutup { border-bottom: none !important; border-top: none !important; border: none !important; }`
      sehingga garis horizontal tipis warisan dari `.bagian { border-bottom: 1px solid var(--garis); }` yang menjalar selebar viewport hilang tuntas.
    - Menegaskan `border: none !important; border-top: none !important; border-bottom: none !important;` pada `.footer-utama` baik mode gelap maupun mode terang.
  - `web/src/styles/sections.css`:
    - Menegaskan `#penutup`, `#penutup.bagian`, `.penutup-section` dengan `border: none !important; border-top: none !important; border-bottom: none !important; outline: none !important;` di kedua mode (gelap dan terang).
  - `CHANGELOG.md`
- **Hasil:**
  - Tidak ada lagi garis pembatas horizontal tipis yang memotong selebar layar di antara Section Penutup dan Footer.
  - Transisi visual antara Kartu Akbar dan Footer mengalir 100% *seamless* dan bersih tanpa gangguan garis horizontal.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**. HMR dev server aktif mengalirkan pembaruan ke klien.

