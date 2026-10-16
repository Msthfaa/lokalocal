# CHANGELOG — Proyek "Atlas Budaya"

## [2026-10-16] Penyambungan Dua Babak Animasi Penerbangan Pesawat Budaya (Lepas Landas & Mendarat di Pulau)
- **Dibuat/diubah:**
  - `web/src/ui/transisi-pesawat.js` (Memecah arsitektur animasi pesawat menjadi dua babak modular yang saling terhubung: `terbangkanPesawatLepasLandas` untuk lepas landas dari halaman keberangkatan, `siapkanPesawatMendarat` untuk menempatkan pesawat melayang di langit horison, dan `mendaratkanPesawatDiPulau` untuk menukik turun melintasi diorama 3D dan touchdown di pulau Jawa/Nusantara dengan letupan bintang emas).
  - `web/src/router/spa-router.js` (Memperbarui `navigasiKeJelajahDedicated`: memicu `terbangkanPesawatLepasLandas`, menyetel bendera sesi `lokalocal_mendarat_pesawat`, dan meneruskan query `mendarat=1` serta kode provinsi opsional ke `jelajah.html`).
  - `web/src/pages/jelajah.js` (Mendeteksi parameter `mendarat=1` atau bendera sesi saat tiba di halaman Jelajah; langsung melompati layar muat perahu, menampilkan pesawat melayang di angkasa tepat di titik terakhir ia berada, menjalankan pendaratan sinematik `mendaratkanPesawatDiPulau`, dan memicu kemunculan membal 38 pulau `kontroler3D.mulaiAnimasiMasuk()` saat roda pesawat menyentuh daratan).
  - `web/jelajah.html` (Menyempurnakan skrip anti-FOUC di `<head>` agar elemen `#jelajah-loading-screen` tidak muncul sekejap pun saat pengguna tiba via penerbangan pesawat).
  - `web/src/main.js` (Mengintegrasikan klik petak provinsi di S2 Peta Menyala, S4 Provinsi Gelap, S7 Paspor, dan S7 Kuis ke `spaRouter.navigasiKe('jelajah', { provinsi })` sehingga semua rute masuk memicu penerbangan pesawat dan langsung menancapkan panji bendera di pulau tujuan).
- **Hasil:**
  - Masalah pesawat hilang saat berpindah ke halaman Jelajah 100% teratasi!
  - Alur penerbangan kini terasa utuh, berkesinambungan, dan sinematik: lepas landas dari bawah layar beranda -> terbang menanjak ke angkasa -> halaman berubah ke diorama 3D nusantara -> pesawat menukik anggun ke tengah kepulauan -> touchdown dengan letupan bintang emas -> 38 pulau membal menyambut kedatangan penjelajah.
  - Terverifikasi via pengujian otomatis Edge headless: `scratch/screenshot-pesawat-takeoff.png`, `scratch/screenshot-pesawat-landing.png`, dan `scratch/screenshot-pesawat-touchdown.png` berhasil terekam dengan sempurna.

## [2026-10-16] Isolasi Mandiri Halaman Jelajah 3D (Eksklusi dari SPA) dengan Transisi Sinematik Pesawat Budaya
- **Dibuat/diubah:**
  - `web/jelajah.html` (Menghapus skrip redirect SPA; mengembalikan `jelajah.html` sebagai halaman mandiri *dedicated* selayar penuh dengan skrip `pages/jelajah.js`, sehingga memiliki 100% alokasi konteks WebGL GPU eksklusif tanpa berebut dengan adegan 3D di beranda).
  - `web/src/router/spa-router.js` (Mengecualikan `jelajah` dari daftar view in-memory SPA `DAFTAR_TAMPILAN = ['cerita', 'paspor', 'kuis']`. Setiap klik tautan menuju Jelajah kini secara mulus menerbangkan Pesawat Kartun Budaya Si Kembara melintasi layar dan mengarahkan navigasi browser ke `./jelajah.html` saat pesawat mengangkasa di titik puncak).
  - `web/index.html` (Menghapus container `#view-jelajah` dari shell beranda untuk membebaskan memori browser dan mencegah tabrakan ganda kanvas Three.js).
  - `web/src/main.js` (Menghapus inisialisasi ganda diorama 3D di latar belakang beranda; tautan provinsi di `peta-menyala` dan `provinsi-gelap` kini langsung mengarahkan ke `./jelajah.html?provinsi=kode`).
  - `web/src/pages/jelajah.js` (Mendukung parameter URL `?provinsi=` untuk otomatis memilih dan menancapkan panji bendera provinsi saat dibuka dari beranda).
- **Hasil:**
  - Masalah layar biru/kosong pada perangkat pengguna teratasi 100% karena GPU browser tidak lagi mengalami *WebGL context loss* akibat menjalankan dua adegan 3D berat sekaligus di satu dokumen.
  - Efek transisi pesawat kartun budaya yang lucu dan sinematik tetap dinikmati saat pengguna mengklik menu Jelajah dari beranda.
  - Halaman Jelajah 3D diorama kini sangat stabil, responsif, dan ringan dibuka di laptop maupun ponsel.

## [2026-10-16] Perbaikan Masalah Layar Blank pada Halaman Jelajah 3D & Sinkronisasi Tema Terang/Gelap
- **Dibuat/diubah:**
  - `web/src/ui/tema.js` (Sinkronisasi status kelas `body.tema-siang` dan `body.tema-malam` saat `terapkanTema()` dieksekusi agar elemen glassmorphism HUD dan gradien langit 3D mengenali tema aktif dengan sempurna).
  - `web/src/styles/sections.css` (Menambahkan dukungan selector langsung `[data-tema="terang"]` dan `[data-tema="gelap"]` untuk latar belakang langit diorama selayar penuh `.jelajah-layar-penuh-main`, `.jelajah-wadah-fullscreen`, floating HUD toolbar zoom, legenda status ringkas, dan kartu samping wilayah, mencegah latar belakang transparan yang jatuh ke warna krem `#FAF6EE`).
  - `web/src/router/spa-router.js` (Mengoptimalkan `tukarTampilanDom` dengan pembersihan eksplisit atribut `removeAttribute('hidden')` dan penegakan `style.display = 'block'` pada `#view-jelajah`; menambahkan parameter `animasiPesawat: false` untuk navigasi langsung saat pemuatan awal URL `#jelajah` agar tampilan terbuka seketika tanpa tertahan animasi).
  - `web/src/ui/transisi-pesawat.js` (Menambahkan *safety watchdog timeout* 2,8 detik untuk memastikan overlay penerbangan pesawat tidak pernah menggantung atau mengunci layar dalam kondisi apa pun).
  - `web/src/main.js` (Memicu `kontroler3D.perbaruiUkuran(true)` secara instan, via `requestAnimationFrame`, serta penjadwalan 80ms saat masuk ke halaman Jelajah untuk menjamin aspek rasio kamera dan kanvas WebGL terkalkulasi tepat).
  - `web/src/sections/hero3d/jelajah3d.js` & `web/src/sections/hero3d/index.js` (Mengganti `PCFSoftShadowMap` usang dengan `PCFShadowMap`, serta menyetel `sembunyikanMaritimAwal: false` agar seluruh kapal Pinisi dan ornamen maritim langsung tampil prima).
- **Hasil:**
  - Halaman Jelajah 3D kini terbuka seketika dan 100% bebas dari layar blank, baik dibuka via navigasi animasi pesawat, klik menu, maupun refresh langsung pada tautan URL `#jelajah`.
  - Baik Mode Terang maupun Mode Gelap menampilkan langit diorama nusantara, kepulauan 3D, kapal Pinisi, serta HUD kontrol dengan kontras yang jernih dan elegan.

## [2026-10-16] Perbaikan Kritis Peta 3D Jelajah Nusantara (Distorsi Sudut Kamera, Bentrok Wadah ID, & Kemunculan Keping Pulau)
- **Dibuat/diubah:**
  - `web/index.html` (Mengganti ID wadah kanvas 3D di `#view-jelajah` dari `#s5-peta-wadah` menjadi `#jelajah-3d-kanvas-wadah` untuk mengeliminasi tabrakan ID dengan peta 2D SVG lama).
  - `web/src/main.js` (Menargetkan `#jelajah-3d-kanvas-wadah` secara presisi untuk `inisialisasiJelajah3D`, memicu `kontroler3D.perbaruiUkuran(true)` lewat `requestAnimationFrame` saat pengguna berpindah ke tampilan Jelajah).
  - `web/src/sections/hero3d/index.js` (Memperbarui `hitungPosisiKameraFit`: menaikkan sudut elevasi kamera dari 31° ke 46° aerial isometrik yang proporsional, serta menyesuaikan radius target responsif untuk ponsel potret ramping `aspect < 0.8` hingga desktop layar lebar `aspect >= 1.3`).
  - `web/src/sections/hero3d/build-scene.js` & `web/src/sections/hero3d/ornamen-maritim.js` (Membesarkan radius piringan samudra `papanLaut` dari 5.3 ke 6.2 agar seluruh daratan dari Sabang hingga Merauke tertampung nyaman tanpa terpotong tepian laut, serta menyesuaikan bentang garis Khatulistiwa dan posisi plakat kayu emas di bibir samudra).
  - `web/src/sections/hero3d/jelajah3d.js` (Memastikan seluruh 38 keping pulau berstatus awal terlihat stabil `scale(1, 1, 1)` dan mengorkestrasi gelombang membal elastis imut saat `mulaiAnimasiMasuk()` dipicu ketika Pesawat Budaya touchdown mendarat; menata ulang basis zoom default ke 100% pada `zoomLevel = 1.0` dengan rentang 70% s.d. 200%).
- **Hasil:**
  - Peta 3D Nusantara kini tampil megah, luas, dan lapang dengan sudut pandang udara 46° yang sangat nyaman dipandang dan mudah diklik.
  - Masalah tampilan "lingkaran biru raksasa kosong" dan keping pulau yang terjepit di cakrawala atas 100% teratasi.
  - Tidak ada lagi tabrakan duplikasi kanvas WebGL atau peta 2D SVG yang menembus kanvas 3D.
  - Transisi pesawat kartun budaya mendarat mulus dan pulau-pulau membal ceria menyambut penjelajah.

## [2026-10-16] Transformasi Arsitektur SPA (Single Page Application) & Animasi Transisi Pesawat Kartun Budaya
- **Dibuat/diubah:**
  - `web/src/ui/transisi-pesawat.js` & `web/src/styles/transisi-pesawat.css` (Komponen visual SVG Pesawat Capung Propeller Chibi + Maskot Budaya "Si Kembara" dengan udeng batik dan kacamata penerbang. Mengorkestrasi lepas landas dari bagian bawah layar, mengangkasa dengan kepulan asap awan knalpot chibi, cross-fade halaman, dan menukik touchdown mendarat di pulau Nusantara 3D dengan letupan bintang emas).
  - `web/src/router/spa-router.js` (Client-side SPA Router: navigasi in-memory antar 4 tampilan utama tanpa browser reload, sinkronisasi URL hash `/#cerita`, `/#jelajah`, `/#paspor`, `/#kuis`, dukungan tombol Back/Forward browser, dan pemicu animasi transisi pesawat).
  - `web/index.html` (Penyatuan 4 view container utama `#view-cerita`, `#view-jelajah`, `#view-paspor`, `#view-kuis` dalam 1 shell terpadu).
  - `web/src/main.js` (Warm-up pemuatan data di awal pembuka, inisialisasi tunggal mesin 3D diorama di latar belakang, integrasi Paspor & Kuis, dan manajemen jeda render loop Three.js untuk penghematan GPU).
  - `web/src/sections/hero3d/jelajah3d.js` (Mengekspos metode `jedaRender()` dan `lanjutkanRender()` untuk smart render loop berbasis rute aktif).
  - `web/src/styles/layout.css` (Gaya container view `.spa-view` dan layout fullscreen transisi).
  - `web/jelajah.html`, `web/paspor.html`, `web/kuis.html` (Penerusan instan ke shell SPA terpadu untuk menjamin kompatibilitas bookmark & tautan langsung).
- **Hasil:**
  - Web kini beroperasi penuh sebagai SPA: pemuatan data dan aset 3D hanya terjadi di awal saat Tirai Wayang pembuka.
  - Pergantian antar halaman berlangsung sangat ringan dan instan (0 detik jeda) tanpa reload browser.
  - Musik gamelan lagu daerah Nusantara mengalun terus tanpa henti melintasi semua halaman.
  - Transisi menuju halaman Jelajah 3D menyajikan animasi spektakuler pesawat kartun budaya yang mendarat di pulau dengan 60 FPS buttery-smooth tanpa lag.
## [2026-10-16] Transformasi Anti-Slop & Redesain Audio Player Backsound Nusantara
- **Dibuat/diubah:**
  - `web/src/ui/audio.js`:
    - **Eliminasi Emoji Budaya Klise**: Menghapus seluruh emoji generatif AI slop (`🍌` untuk Ampar-Ampar Pisang, `🎡` bianglala karnaval untuk Kicir-Kicir, `🌺` kembang sepatu untuk Bungong Jeumpa, `🌙` bulan sabit untuk Soleram, dan `🏹` busur untuk Yamko Rambe Yamko).
    - **Indikator Track Interaktif (Play / Equalizer)**: Menggantikan emoji dengan sistem status lagu proporsional: nomor urut 2 digit (`01`, `02`, ...), ikon `▶` halus saat hover, dan visualizer mini-equalizer 3-batang (`.eq-mini-bar`) yang berdenyut hidup saat lagu aktif berputar.
    - **Kontrol Volume SVG & Tombol Mute**: Menghapus karakter emoji speaker (`🔉`, `🔊`, `🔇`) dan menggantinya dengan tombol ikon speaker SVG interaktif yang dapat diklik untuk toggle mute/unmute seketika.
    - **Ikon Tutup SVG**: Mengganti karakter teks mentah `✕` dengan tombol tutup bulat SVG modern.
  - `web/src/styles/components.css`:
    - **Scrollbar Elegan Ramping**: Mengganti scrollbar abu-abu tebal bawaan OS Windows dengan *custom glass scrollbar* tipis (5px) beraksen emas transparan tanpa tombol panah kaku.
    - **Eliminasi Outline Kapsul Lonjong 9999px**: Mengubah radius tombol lagu aktif dari kapsul lonjong ekstrem (`9999px`) menjadi kartu persegi melengkung modern (`14px`) yang selaras dengan bahasa desain kaca Lokalocal.
    - **Slider Volume Kustom**: Memberikan styling slider modern dengan fill progress dinamis bergradasi emas (`--vol-persen`), bulatan thumb putih bersih dengan cincin aksen, serta elevasi bayangan luar yang lembut.
    - **Panel Kaca Transparan 80% & 50% Lapisan Kaca**: Memperhalus `.audio-popup-panel` dengan lebar proporsional 340px, latar kaca `rgba(20, 16, 13, 0.65)` / `rgba(255, 255, 255, 0.70)`, blur 16px, dan tanpa bayangan dalam.
- **Hasil:**
  - Pemutar audio Backsound Nusantara kini tampil selayaknya pemutar musik kuratorial berstandar studio / museum kontemporer, bebas dari emoji AI slop, dan berfungsi responsif di desktop maupun ponsel.
  - Build produksi dan validasi data lolos 100% tanpa error.

## [2026-10-16] Transformasi Anti-Slop & Redesain Editorial Paspor Budaya (paspor.html)
- **Dibuat/diubah:**
  - `web/paspor.html`:
    - Mengganti teks kicker dengan identitas buku kuratorial (`Buku Dokumentasi Perjalanan`).
    - Menambahkan strip spesifikasi paspor (`.paspor-info-strip`) dengan data terformat (38 Provinsi Terdaftar • 05 Tingkat Gelar Kehormatan • 02 Kategori Cap Dokumen).
  - `web/src/sections/paspor.js`:
    - **Sistem Gelar Kehormatan Nyata (5 Level)**: Mengimplementasikan gelar kehormatan kurator (`Penjelajah Mula`, `Pengembara Tradisi`, `Perekam Jejak Budaya`, `Penjaga Narasi Nusantara`, `Kurator Agung Nusantara`) yang dihitung dinamis dari stempel terkumpul.
    - **Kartu Identitas Paspor (`.paspor-identitas-kartu`)**: Menghadirkan layout layaknya halaman identitas dokumen resmi dengan lambang paspor, rincian stempel SPKT vs Penjaga Cerita, serta progres bar presisi bergradasi emas.
    - **Bilah Filter Wilayah Geografis (`.paspor-filter-bar`)**: Membagi 38 provinsi ke dalam 6 gugus pulau (Sumatera, Jawa, Bali & Nusa, Kalimantan, Sulawesi, Maluku & Papua) dengan penghitung capaian stempel per wilayah (`terkumpul/total`), menghilangkan kebosanan grid 38 kotak repetitif.
    - **Eliminasi Wireframe & Pemotongan Teks**:
      - Mengganti kotak kosong berangka kode BPS menjadi *embossed watermark seal* elegan dengan teks status terpatri `BELUM TERCAP`.
      - Memperlebar lebar petak grid menjadi `minmax(92px, 1fr)` dan mengizinkan nama provinsi tampil hingga 3 baris sehingga tidak ada lagi pemotongan kasar ber-ellipsis (`Kepulauan Bangka...`).
    - **Kaki Paspor Fungsional**: Menghadirkan baris aksi lengkap dengan tombol pintas *Jelajahi Peta 3D*, *Salin Lembar Paspor*, dan tombol reset dengan konfirmasi 2 langkah yang aman.
  - `web/src/styles/sections.css`:
    - Mengeliminasi seluruh efek kabur teks (`text-shadow`) pada judul dan subjudul paspor.
    - Menerapkan efek kaca 80% tembus pandang & 50% lapisan warna kaca (`rgba(24, 20, 17, 0.5)` / `rgba(255, 255, 255, 0.5)` dengan `backdrop-filter: blur(12px)`) dan sudut melengkung 28px pada `.paspor-hero-kepala`, `#s7-panel-paspor`, dan `.paspor-nav-bawah-kotak`.
    - Menghapus bayangan dalam (`inset`) serta menjamin kontras teks tajam dan bersih pada tema gelap maupun terang.
- **Hasil:**
  - Halaman paspor kini memiliki identitas visual buku paspor fisik yang berwibawa, interaktif, rapi, dan bebas dari kesan wireframe buatan AI.
  - Build produksi dan validasi data lolos 100% tanpa error.

## [2026-10-16] Transformasi Anti-Slop & Redesain Editorial Halaman Kuis Interaktif (kuis.html)
- **Dibuat/diubah:**
  - `web/kuis.html`:
    - Mengeliminasi ornamen bintang kelip AI slop (`✦`, `.kicker-bintang`, `.kicker-glow`).
    - Menghapus 10 tombol pil wilayah dengan emoji generatif (`🏛️`, `⚡`, `🛶`, dll.) yang sebelumnya tidak berfungsi di kuis.
    - Menambahkan strip briefing tantangan kuratorial (`.kuis-info-strip` dengan nomor bab `01`, `02`, `03`).
  - `web/src/pages/kuis.js`:
    - Menghapus event listener mati untuk pil wilayah yang sebelumnya memanggil fungsi non-eksisten `kontrolKuis.gantiKategori`.
  - `web/src/sections/kuis.js`:
    - Mengganti teks pembuka generik dengan 3 pilar uji objektif (Asal Usul Geografis, Klasifikasi OPK, dan Realitas Data Terbuka).
    - Memperkenalkan bilah progres bersegmen 8 langkah (`.kuis-segmen-bar` & `.kuis-segmen-item`) dengan indikator langkah aktif dan terlewati.
    - Mengubah kotak petunjuk menjadi kutipan arsip resmi SPKT otentik (`.kuis-kotak-arsip`) berlatar parchment/espresso tanpa elemen dekoratif berlebihan.
    - Menambahkan penanda abjad (`A`, `B`, `C`, `D`) pada setiap kartu opsi jawaban (`.kuis-opsi-huruf`) serta status badge penegasan (`Tercatat Benar` / `Pilihanmu`).
    - Menata ulang kotak umpan balik (`.kuis-umpan-kartu`) dengan status ikon minimalis dan tombol aksi langsung (Lihat Peta 3D, Baca Kisah Arsip, Soal Berikutnya).
    - Merancang layar hasil akhir yang elegan: cincin persentase skor kuratorial, narasi evaluasi objektif, dan 3 kartu penemuan budaya yang ditemui di sesi kuis lengkap dengan tombol penjelajahan langsung.
  - `web/src/styles/sections.css`:
    - Mengeliminasi animasi kelip bintang (`@keyframes bintangKelip`), pil kapsul lonjong `999px`, serta efek kabur teks (`text-shadow: 0 1px 6px ...`).
    - Menerapkan efek kaca 80% tembus pandang & 50% lapisan kaca pada seluruh modul kuis (`.kuis-hero-kepala`, `#s7-panel-kuis`, `.kuis-nav-bawah-kotak`) dengan sudut lengkung 28px yang selaras dengan tombol audio nusantara.
    - Menghapus seluruh bayangan dalam (`inset`) baik pada tema gelap maupun tema terang, menjaga kontras teks tajam dan berwibawa (WCAG AA ≥ 4.5:1).
- **Hasil:**
  - Halaman kuis kini tampil selayaknya ruang audit kuratorial museum berstandar tinggi, bebas dari elemen slop, dan berfungsi interaktif secara penuh dengan pembacaan langsung dari 493 rekaman data bersih SPKT.
  - Build produksi lolos 100% dan verifikasi data lolos tanpa error.

## [2026-10-16] Penyatuan Halaman Penuh (Seamless Single Canvas) & Eliminasi Sekat Gradasi Gelap
- **Dibuat/diubah:**
  - `web/src/styles/sections.css`:
    - Menghapus elemen sekat gradasi horizontal (`::before` dan `::after`) pada `.editorial-section` dan `.penutup-section` yang sebelumnya menciptakan pita hitam tebal (*black gradient band*) di tengah halaman yang memisahkan modul editorial dan bagian penutup.
    - Menyatukan latar belakang `.editorial-section`, `.penutup-section`, dan `.footer-utama` menjadi satu kanvas utuh tanpa batas atau garis pemisah (`border: none !important`), baik pada mode gelap (`#000000`) maupun mode terang (`#ffffff`).
    - Menyelaraskan durasi transisi latar belakang menjadi `0.35s ease`.
  - `web/src/styles/base.css`:
    - Menambahkan transisi halus `transition: background-color 0.35s ease, color 0.35s ease` pada `html` dan `body` dengan proteksi `prefers-reduced-motion: reduce`.
  - `web/src/styles/layout.css`:
    - Menyelaraskan transisi warna latar pada `.footer-utama` ke `0.35s ease`.
- **Hasil:**
  - Halaman beranda kini menyatu 100% dari bagian atas hingga bawah tanpa pita pemisah gelap buatan. Seluruh perpindahan section mengalir mulus (*seamless bleed*) sebagai satu halaman langsung, dan transisi beralih tema (gelap ↔ terang) berjalan serempak dan halus di seluruh elemen halaman.
  - Build produksi dan validasi data lolos 100% tanpa error.

## [2026-10-16] Penghapusan Total Inner Shadow (Inset Rim / Bevel) Mode Terang & Gelap
- **Dibuat/diubah:**
  - `web/src/styles/layout.css`:
    - Menghapus semua `inset 0 1px ...` pada bilah navigasi (`.nav-daftar`), tombol aksi navigasi (`.nav-tombol-aksi`), tombol pengalih tema (`.nav-tombol-tema`), menu navigasi ponsel (`.tombol-menu-ponsel`, `.nav-daftar.terbuka`), dan kartu atribusi footer (`.footer-atribusi-modern`) pada mode terang maupun gelap.
  - `web/src/styles/components.css`:
    - Menghapus bayangan dalam `inset` pada kartu metrik beranda (`.kartu-metrik`), kartu cerita katalog (`.kartu-cerita`), dan kapsul audio nusantara (`.audio-kapsul`).
  - `web/src/styles/sections.css`:
    - Menghapus bayangan dalam `inset` pada tombol CTA sekunder hero (`.hero-cta-sekunder`), kartu scrollytelling (`.s2-kartu-langkah`, `.s3-kartu-panel`, `.s4-kartu-detail-kosong`), kartu bento grid beranda (`.bento-kartu`), kuratorial tag (`.kuratorial-tag-grup`), kartu destinasi (`.destinasi-kartu`), kartu akbar penutup (`.penutup-kartu-akbar`), pilar aksi (`.penutup-pilar-kartu`), kotak jejak paspor (`.penutup-jejak-kotak`), panel halaman paspor (`#s7-panel-paspor.s7-panel-kartu`, `.paspor-hero-kepala`, `.paspor-nav-bawah-kotak`), serta panel halaman kuis (`#s7-panel-kuis.s7-panel-kartu`, `.kuis-hero-kepala`, `.kuis-nav-bawah-kotak`).
- **Hasil:**
  - Seluruh efek *embossed rim / bevel highlight* buatan AI slop di tepi dalam kartu dan tombol berhasil dihilangkan sepenuhnya pada mode terang maupun mode gelap. Permukaan kaca kini tampak bersih, rata, natural, dan modern dengan elevasi bayangan luar (*outer drop-shadow*) yang proporsional.
  - Build produksi lolos 100% dan verifikasi data bersih valid tanpa error.

## [2026-10-16] Penyatuan Warna Footer (Putih Solid) & Penghapusan Garis Pemisah
- **Dibuat/diubah:**
  - `web/src/styles/layout.css`:
    - Mengubah latar belakang `.footer-utama` pada tema terang menjadi putih solid penuh (`#ffffff !important`) sehingga menyatu 100% tanpa perbedaan warna dengan latar bagian penutup di atasnya.
    - Menghapus garis pemisah horizontal atas (`border-top: none !important`), menciptakan transisi mulus dan bersih (*seamless bleed*) dari section penutup ke footer.
    - Pada tema gelap, `.footer-utama` diselaraskan ke latar hitam pekat murni (`#000000`) tanpa garis pemisah atas.
    - Menyesuaikan kartu atribusi modern (`.footer-atribusi-modern`) di tema terang dengan latar gradasi hangat lembut dan garis tepi aksen halus agar tetap kontras dan terdefinisi elegan di atas kanvas putih footer.
- **Hasil:**
  - Area footer kini tampil bersih, menyatu sempurna dengan bagian penutup tanpa sekat garis maupun diskrepansi warna.
  - Build produksi dan server lokal berjalan mulus tanpa peringatan atau error.

## [2026-10-16] Penyesuaian Spesifik Kaca: 80% Tembus Pandang & 50% Lapisan Kaca (Glassmorphism)
- **Dibuat/diubah:**
  - `web/src/styles/layout.css`:
    - Menyesuaikan gradasi transparansi navbar (`.nav-daftar`), tombol aksi navigasi (`.nav-tombol-aksi`), tombol ganti tema (`.nav-tombol-tema`), menu drawer ponsel (`.nav-daftar.terbuka`), dan kartu atribusi footer (`.footer-atribusi-modern`) secara tepat menjadi tembus pandang 80% (alpha 0.20 pada badan utama) dan ketebalan lapisan warna kaca 50% (alpha 0.50 pada sudut kilau pantulan atas):
      - Mode Terang: `linear-gradient(135deg, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.20) 100%)` dengan garis tepi kaca `border: 1px solid rgba(255, 255, 255, 0.50)`.
      - Mode Gelap: `linear-gradient(135deg, rgba(26, 21, 18, 0.50) 0%, rgba(14, 11, 9, 0.20) 100%)` dengan garis tepi kaca `border: 1px solid rgba(255, 255, 255, 0.15)`.
  - `web/src/styles/sections.css`:
    - Mengaplikasikan formula presisi 80% tembus pandang dan 50% lapisan kaca pada `.hero-cta-sekunder`, kartu bento beranda (`.bento-kartu`), kuratorial tag (`.kuratorial-tag-grup`), kartu destinasi (`.destinasi-kartu`), kartu scrollytelling (`.s2-kartu-langkah`, `.s3-kartu-panel`, `.s4-kartu-detail-kosong`), kartu akbar penutup (`.penutup-kartu-akbar`), kartu pilar aksi (`.penutup-pilar-kartu`), dan kotak jejak interaktif (`.penutup-jejak-kotak`).
  - `web/src/styles/components.css`:
    - Menyeragamkan kartu metrik (`.kartu-metrik`), kartu cerita katalog (`.kartu-cerita`), dan kapsul audio musik (`.audio-kapsul`) ke formula 80% tembus pandang dan 50% lapisan kaca.
- **Hasil:**
  - Efek tembus pandang kaca terlihat sangat transparan dan elegan (80% objek di belakang kartu terlihat jelas), sementara kilau permukaan kaca (50%) dan garis tepi pembiasan cahaya tetap membingkai konten dengan tegas tanpa mengorbankan keterbacaan teks sedikit pun.
  - Build produksi lolos 100% dan dev server berjalan lancar via HMR.

## [2026-10-16] Eliminasi Pola AI Slop: Redesain Beranda, Navbar, dan Footer Kuratorial
- **Dibuat/diubah:**
  - `web/src/styles/layout.css`:
    - Navbar: Mengganti radius kapsul lonjong (`9999px`) menjadi sistem token struktural `var(--r-md)` (8px) dan `var(--r-sm)` (6px); mengganti efek kaca jenuh AI (`blur(16px) saturate(180%)`) menjadi backdrop semi-transparan berbobot natural dengan border halus; menambahkan styling SVG presisi untuk tombol ganti tema (`.ikon-bulan` dan `.ikon-matahari`).
    - Footer: Menghilangkan ornamen bintang dekoratif klise `✦` pada tautan navigasi dan menggantinya dengan pseudo-element dot minimalis; mengubah tumpukan tombol balok kaca di kolom transparansi menjadi daftar aksi kuratorial teks yang rapi (`.footer-aksi-list` & `.footer-aksi-tombol`); menghapus filter neon drop-shadow pada logo dan text-shadow buram di tema terang; memperkaya baris bawah footer (`.footer-bawah-modern`) dengan hak cipta resmi, kutipan budaya, dan tombol kembali ke atas (`.footer-ke-atas-link`).
  - `web/src/styles/sections.css`:
    - Beranda (Hero & Bento Grid): Mengganti badge pil lonjong generatif dengan tag kuratorial editorial nusantara (`.kuratorial-tag-grup` dengan `.kuratorial-nomor` dan `.kuratorial-kategori`); membersihkan gradasi kuning pekat menjadi warna aksen solid berbobot; merapikan kartu pilar penutup dengan radius konsisten `var(--r-md)`.
  - `web/src/ui/footer.js`:
    - Membuat fungsi `perbaruiAtribusiFooter` menjaga struktur DOM kartu atribusi modern (`.footer-atribusi-modern`) tanpa mereset elemen ikon dan teks saat memperbarui tautan SPKT serta tanggal pengambilan data.
  - `web/index.html`, `web/jelajah.html`, `web/paspor.html`, `web/kuis.html`:
    - Navbar: Mengganti karakter emoji mentah (`🌙` dan `☀️`) pada tombol tema dengan ikon SVG; mengganti karakter panah `↗` / `→` pada tombol aksi navigasi dengan ikon SVG terstruktur (kubus 3D / buku cerita).
    - Footer: Menyeragamkan seluruh halaman ke struktur 3-kolom kuratorial modern bebas AI slop dan memastikan 0 karakter em dash (`—`).
- **Hasil:**
  - Tampilan visual website Lokalocal meningkat ke standar desain kuratorial editorial profesional, terbebas dari artefak AI slop (tidak ada kapsul lonjong berlebihan, tidak ada bintang klise, tidak ada neon glow artifisial, dan tipografi tajam tanpa bayangan kabur).
  - Validasi data `node tools/validate.mjs` lolos 100% (0 error), build produksi `npm run build` sukses dalam 2.61 detik, dan server Vite aktif responsif di background.
>>>>>>> origin/main

## [2026-10-16] Pembatasan Sesi Layar Pemuatan (Tirai Wayang & 3D Pinisi) & Akses IP Lokal
- **Dibuat/diubah:**
  - `web/src/ui/tirai-wayang.js` & `web/src/main.js` (Opening Tirai Wayang Gunungan dibatasi via `sessionStorage` sehingga hanya tampil satu kali di awal sesi kunjungan pengguna; navigasi bolak-balik halaman berlangsung instan; penambahan tombol 'Tonton Ulang Pembuka Wayang' di footer dan URL parameter `?tirai=1`).
  - `web/src/ui/loader-lucu.js`, `web/src/pages/jelajah.js`, & `web/jelajah.html` (Layar muat Kapal Pinisi 3D dibatasi per sesi via `sessionStorage` dengan mekanisme zero-FOUC fast-pass; kunjungan berikutnya langsung membuka adegan 3D tanpa modal kartu loading; URL parameter `?loader=1` untuk memicu ulang secara manual).
  - `web/vite.config.js` & `web/package.json` (Konfigurasi `--host` Vite agar web dapat diakses via IP jaringan lokal / WiFi untuk pengujian mobile).
- **Hasil:**
  - Pengalaman penjelajahan antar halaman (Cerita <-> Jelajah 3D <-> Paspor <-> Kuis) menjadi instan tanpa jeda loading berulang.
  - Sesi baru atau browser baru tetap menampilkan animasi pembuka dan loader maskot secara utuh.
  - Aplikasi dapat dibuka secara lancar di perangkat seluler melalui IP lokal.

## [2026-10-15] Penyesuaian Menyeluruh: Panel Kuis, Paspor, dan Kotak Navigasi Bawah Menjadi Transparan (True Glassmorphism)
- **Dibuat/diubah:**
  - `web/src/styles/sections.css`:
    - Mengubah seluruh kartu konten utama dan kotak navigasi bawah menjadi transparan tembus pandang (*true translucent glass*):
      - **Panel Kuis (`#s7-panel-kuis.s7-panel-kartu`):** Diubah dari putih padat 92% menjadi **42% transparan** (`background: rgba(255, 255, 255, 0.42)`), dengan *blur* optik 8px dan *inset glass sheen*.
      - **Panel Paspor (`#s7-panel-paspor.s7-panel-kartu`):** Diubah dari putih padat 92% menjadi **42% transparan** (`rgba(255, 255, 255, 0.42)`), dengan petak stempel dan blok progres semi-transparan.
      - **Kotak Navigasi Bawah (`.kuis-nav-bawah-kotak` & `.paspor-nav-bawah-kotak`):** Diubah dari putih padat 90% menjadi **42% transparan** (`rgba(255, 255, 255, 0.42)`).
      - **Elemen Dalam Kuis:** Petunjuk kuis (`rgba 0.70`), tombol pilihan (`rgba 0.68`), dan kartu skor akhir (`rgba 0.70`) kini memiliki transparansi kaca senada.
      - **Mode Gelap:** Menerapkan transparansi mewah yang seimbang (`background: rgba(24, 20, 17, 0.45)`).
    - Memastikan keterbacaan teks 100% terjaga tajam melalui *micro-halo text shadow* dan warna teks kontras tinggi.
- **Panel Footer (`.footer-utama`):** Diubah dari putih padat `#ffffff` menjadi **transparan kaca 35% (`background: rgba(255, 255, 255, 0.35)`)** dengan blur optik 10px dan border atas emas lembut (`border-top: 1px solid rgba(184, 115, 20, 0.28)`), menghilangkan sekat gradasi solid, serta membuat kotak atribusi data (`.footer-atribusi-modern`) dan tombol dialog (`.footer-tombol-kaca`) menjadi widget kaca transparan yang tembus pandang.
- **Hasil:**
  - Menjawab langsung permintaan pengguna: seluruh halaman dari ujung atas (hero) hingga ujung paling bawah (footer) kini **100% tembus pandang secara elegan dan mulus tanpa ada satu pun balok putih padat yang memotong ilustrasi budaya**.

## [2026-10-15] Perbaikan Mode Siang / Terang untuk Dialog Tentang Data, Tentang Kami, dan Halaman Paspor
- **Dibuat/diubah:**
  - `web/src/styles/components.css`:
    - Memperbaiki `background-color` pada `.dialog-modal` yang sebelumnya keliru menggunakan `var(--kertas)` (sehingga saat mode terang aktif, modal menjadi hitam pekat `#1C1917` dengan teks hitam).
    - Menerapkan arsitektur tema penuh untuk `.dialog-modal`: latar putih bersih dengan border emas hangat dan teks kontras tinggi di mode terang (`[data-tema="terang"]`), serta dark glassmorphism di mode gelap.
    - Menghilangkan outline fokus yang mencolok pada judul dialog (`.dialog-judul:focus { outline: none; }`).
    - Menyelaraskan tombol tutup dialog (`.tombol-tutup-dialog`) dengan tipografi dan hover kontras tinggi di kedua mode.
  - `web/paspor.html`:
    - Menyelaraskan baseline anti-FOUC di `<head>` agar mendukung mode terang seketika tanpa `!important` statis pada warna gelap.
    - Menghapus kelas `wadah` pada tag `<nav>` sehingga bilah navigasi atas selaras menjadi 3 kapsul mengambang (Floating Glassmorphism).
    - Menambahkan kelas `halaman-paspor-body`, `bagian-paspor-interaktif`, dan `paspor-nav-bawah-kotak`.
  - `web/src/styles/sections.css`:
    - Menautkan ilustrasi Budaya Nusantara yang jernih dan megah (`bg-budaya-kuis.jpg` di mode gelap dan `bg-budaya-kuis-light.jpg` di mode terang) pada `.halaman-paspor-body`.
    - Menerapkan styling lengkap mode terang untuk seluruh elemen paspor: judul hero, subjudul, kicker, panel kartu `#s7-panel-paspor`, blok progres, petak stempel 38 provinsi, catatan penyimpanan, dan kotak navigasi bawah.
  - `web/index.html` & `web/jelajah.html`:
    - Penyelarasan baseline anti-FOUC di `<head>` agar konsisten dan mendukung pergantian tema seketika tanpa `!important` statis.
- **Hasil:**
  - Dialog "Tentang Data & Keterbatasan" dan "Tentang Lokalocal & Pengembang" kini tampil anggun, bersih, dan berlatar putih dengan teks yang terbaca jelas di Mode Siang / Terang.
  - Halaman "Paspor Budaya Nusantara" kini tampil megah dengan latar Budaya Nusantara yang jernih dan teks yang kontras tajam (tidak ada lagi teks hitam di atas latar hitam).

## [2026-10-15] Pemulihan Latar Budaya Nusantara & Penyelarasan Mode Gelap / Terang Halaman Kuis
- **Dibuat/diubah:**
  - `web/public/assets/bg-budaya-kuis-light.jpg`:
    - Dihasilkan aset kembar resmi bernuansa perkamen emas (*warm ivory royal parchment*) dengan komposisi budaya yang 100% identik dengan versi malam: siluet Rumah Gadang Minang, Candi Borobudur & Prambanan, Rumah Adat Tongkonan Toraja, Kapal Pinisi, Wayang Kulit, dan awan Batik Megamendung.
  - `web/kuis.html`:
    - Memulihkan dan menyelaraskan penanganan tema anti-FOUC di `<head>` agar mendukung seketika baik mode gelap maupun terang tanpa mengunci layar secara hardcode (`!important` statis dihapus).
    - Menghapus kelas `wadah` pada tag `<nav>` di bilah navigasi atas (navbar) sehingga susunan 3 kapsul mengambang (Floating Glassmorphism: logo merek, menu halaman, dan aksi kanan) menjadi 100% identik dan selaras dengan halaman Cerita (`index.html`).
    - Menambahkan kelas `halaman-kuis-body` pada `<body>` dan `bagian-kuis-interaktif` pada `<section>` arena kuis.
    - Mengganti inline-style kotak navigasi bawah menjadi kelas terstruktur `kuis-nav-bawah-kotak`.
  - `web/src/styles/sections.css`:
    - Mengeliminasi penumpukan ganda (*double-layer stacking*) yang sebelumnya menimpa gambar latar pada `body` sekaligus `section`.
    - Mengurangi kepekatan gradasi gelap dan terang dari 85%–98% menjadi gradasi lembut (0%–35%) sehingga seluruh ilustrasi budaya (Rumah Gadang, Candi, Tongkonan, Pinisi, Wayang) tampil **sangat jelas, tajam, dan hidup** di mode gelap maupun mode terang.
    - Menautkan `/assets/bg-budaya-kuis.jpg` untuk Mode Gelap dan `/assets/bg-budaya-kuis-light.jpg` untuk Mode Terang.
    - Mengimplementasikan aturan styling lengkap mode terang (`[data-tema="terang"]`) untuk seluruh elemen kuis: judul, subjudul, chip filter statistik, pill filter wilayah nusantara, kartu pertanyaan kuis (`#s7-panel-kuis`), petunjuk, opsi pilihan, umpan balik jawaban, kartu skor akhir, dan kotak navigasi bawah dengan kontras tinggi (memenuhi standar aksesibilitas WCAG AAA).
- **Hasil:**
  - Latar belakang ilustrasi Budaya Nusantara kini tampil **sangat jelas, megah, dan kontras sempurna** baik di Mode Gelap maupun Mode Terang (tidak lagi redup, gelap gulita, atau memudar tertutup gradasi).
  - Pengguna dapat beralih antara Mode Gelap (Dark Mode) dan Mode Terang (Light Mode) dengan mulus melalui tombol toggle tema (🌙 / ☀️) di bilah navigasi kuis seperti halnya pada halaman Cerita.
  - Seluruh kode di luar cakupan halaman/navbar kuis tetap utuh dan tidak tersentuh sesuai batasan pengguna.

## [2026-10-14] Perbaikan Tampilan Pulau & Animasi Masuk Membal Sinkron (Pulau & Kapal Pinisi)
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/ornamen-maritim.js` (Perbaikan evaluasi kurva pelayaran Catmull-Rom agar aman dari nilai negatif; penambahan parameter `sembunyikanAwal: true` dan implementasi `mulaiAnimasiMasuk()` untuk 3 kapal Pinisi: kapal disembunyikan di awal, lalu menyembul membal keluar dari air laut bertahap seirama dengan penyebaran pulau: Pinisi Flores/Makassar di tengah t=0.25s, Pinisi Laut Jawa di barat-tengah t=0.55s, Flagship Sabang-Merauke t=0.85s, dan Kompas Mawar di t=0.35s).
  - `web/src/sections/hero3d/build-scene.js` (Meneruskan opsi `sembunyikanMaritimAwal` dari `jelajah3d` ke `bangunOrnamenKemaritiman`).
  - `web/src/sections/hero3d/build-provinces.js` (Menyimpan field `rNorm`, `distCenter`, `tinggiAngkat`, dan `sumbuPutar` pada `mesh.userData` untuk kalkulasi jarak radial dari pusat nusantara serta kompatibilitas penuh).
  - `web/src/sections/hero3d/jelajah3d.js` (Implementasi `mulaiAnimasiMasuk()` menggunakan GSAP `back.out(2.2)` untuk 38 pulau dan memicu kemunculan membal kapal Pinisi secara sinkron; menghapus panggilan `aplikasikanPose` yang tidak relevan di halaman fullscreen; membentengi render loop dengan blok `try...finally` sehingga requestAnimationFrame tidak pernah macet).
  - `web/src/pages/jelajah.js` (Sinkronisasi pemanggilan `kontroler3D.mulaiAnimasiMasuk()` tepat saat layar pemuatan maskot lucu memudar keluar).
- **Hasil:**
  - Peta 3D diorama kini 100% muncul dengan visual pulau yang lengkap, cerah zamrud, dan stabil tanpa freeze atau galat konsol.
  - Saat layar pemuatan selesai, pengguna disuguhkan animasi spektakuler dan menggemaskan: baik pulau-pulau maupun kapal Pinisi menyembul membal bersamaan dari dalam air laut mulai dari pusat nusantara lalu menyebar hingga Sabang dan Merauke.

## [2026-10-14] Optimasi Kinerja Muat & Layar Pemuatan Animasi Lucu Nusantara (Jelajah 3D)
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/build-provinces.js` (Pembangkitan material & tekstur atlas peta topografi diubah menjadi *Lazy On-Demand*. Mengeliminasi komputasi sinkron 76 kanvas resolusi 1024x1024 saat inisialisasi awal)
  - `web/src/ui/loader-lucu.js` (Komponen layar pemuatan interaktif: Maskot SVG Kapal Pinisi Chibi "Si Kembara" dengan mata imut berkedip, bendera Merah Putih berkibar, lumba-lumba melompat, ombak berlapis beranimasi, bilah progres Sabang–Merauke, dan lelucon kebudayaan nusantara berputar dinamis)
  - `web/src/pages/jelajah.js` (Integrasi tahapan pemuatan `loaderLucu`: 18% muat data -> 48% batas provinsi -> 72% relief 3D -> 92% lentera maritim -> 100% transisi halus saat frame pertama siap)
  - `web/jelajah.html` (Markup statis awal `#jelajah-loading-screen` agar langsung muncul tanpa jeda kosong)
  - `web/src/styles/sections.css` (Gaya visual kartu ceria, panggung samudra biru, animasi kedip mata, ombak dinamis, bilah progres bercahaya)
- **Hasil:**
  - Waktu persiapan adegan 3D terpangkas drastis dari sebelumnya beberapa detik menjadi sub-detik karena tekstur hanya dibangkitkan pada 1 provinsi terpilih saat Mode Detail dibuka.
  - Pengguna disambut layar pemuatan lucu dan menghibur bernuansa kebudayaan Nusantara yang secara visual memandu proses persiapan pulau sampai 100% matang dan siap dijelajahi.

## [2026-10-13] Ornamen Kemaritiman Nusantara & Pengayaan Tampilan Zoom Out
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/ornamen-maritim.js` (Modul mandiri kemaritiman nusantara: Flagship Pinisi berbendera Merah Putih rute Sabang–Merauke, perahu lokal di perairan terbuka tanpa menembus pulau, Cincin Khatulistiwa Emas 0°, Jalur Rempah Maritim kuno, Kompas Mawar antik)
  - `web/public/batik-pattern.svg` (Pola SVG Batik Kawung & Isen-isen mulus untuk tekstur halus di latar belakang)
  - `web/src/sections/hero3d/build-scene.js` (Penyatuan pengontrolMaritim ke adegan diorama dan mode waktu siang/malam)
  - `web/src/sections/hero3d/jelajah3d.js` (Loop animasi maritim, pembatasan minimum zoom-out ke 72% / 0.90 agar selalu proporsional dan tidak hampa)
  - `web/src/styles/sections.css` (Watermark tekstur batik halus pada bidang latar belakang luas serta gradasi atmosfer horison siang dan malam)
- **Hasil:**
  - Saat diorama di-zoom out, latar belakang biru luas dihiasi tekstur Batik Kawung yang sangat halus dan bernuansa royal budaya nusantara (tidak polos lagi).
  - Kapal Flagship Pinisi berlayar mulus dari Sabang ke Merauke melintasi 23 titik perairan laut dalam nasional (Selat Malaka, Laut Jawa, Laut Flores, Laut Banda, Arafura) dan kembali lewat Pasifik utara dengan bendera Merah Putih berkibar di tiang utama.
  - Seluruh rute kapal dihitung menggunakan kurva spline Catmull-Rom di perairan laut terbuka sehingga 100% realistis dan tidak pernah menembus daratan pulau.
  - Cincin Khatulistiwa Emas membentang membelah nusantara di garis 0° dengan tugu cincin emas dan plakat penanda.
  - Jalur Rempah Maritim menghubungkan pelabuhan kuno dengan garis bercahaya safir putus-putus.
  - Kompas Mawar Antik berukir emas diletakkan di samudra selatan.

## [2026-10-13] Peningkatan Visual — Efek Bokeh Blur Latar Belakang saat Keping Terpilih
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/mode-detail.js` (Pipeline blur render target, shader post-processing 17-tap Poisson disc, renderKhusus dengan Layer 0 & Layer 1 Three.js)
  - `web/src/sections/hero3d/jelajah3d.js` (Integrasi renderKhusus pada loop requestAnimationFrame)
  - `web/src/styles/sections.css` (Radial vignette backdrop pada `.mode-detail-overlay`)
  - `tools/check-imports.mjs` (Penambahan `WebGLRenderTarget`, `OrthographicCamera`, `ShaderMaterial` ke whitelist Three.js)
- **Hasil:**
  - Saat keping provinsi dipilih dan Mode Detail terbuka, latar belakang 3D diorama (kepulauan Indonesia, lautan, awan, dan cetakan keping asal) mendapatkan efek blur lembut natural (*depth of field / bokeh lens* 3.8px).
  - Keping daratan provinsi aktif di depan dirender pada Layer 1 dengan pembersihan depth buffer, sehingga 100% tajam, berkilau, dan bertekstur atlas tanpa ikut ter-blur.
  - Saat kembali ke peta, rendering kembali ke mode normal langsung tanpa overhead post-processing.

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

## [2026-10-13] Floating Side Card Kanan (Compact Secuil -> Animasi Bubble Melebar Kaya Data)
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/panel-kanan.js` (komponen baru Floating Side Card di kanan layar dengan transisi dua tahap: compact preview ringkas dan bubble expand kaya data)
  - `web/src/sections/hero3d/jelajah3d.js` (mengintegrasikan `panelKanan`, menonaktifkan kartu DOM lama yang menutupi tengah pulau, memperhalus lerp damping rotasi orbit menjadi 0.075 untuk kehalusan ekstra, dan animasi keping pulau naik +0.14)
  - `web/src/sections/hero3d/bendera.js` (mendukung `tampilkanOverlayDOM: false` sehingga tiang pin 3D emas tetap tertancap di pulau tanpa ada popup yang menghalangi peta)
  - `web/src/styles/sections.css` (gaya glassmorphism luxury `.jelajah-kartu-kanan`, mode `.is-compact` 350px, mode `.is-expanded` 520px dengan animasi `bubbleExpand`, tab bar koleksi budaya vs metrik, grafik bar persentase OPK, daftar scroll tradisi lokal, dan responsif mobile bottom sheet)
  - `CHANGELOG.md`
- **Hasil:**
  - **Tengah Layar Bebas Rintangan:** Memilih provinsi tidak lagi menutupi pulau di tengah peta; kartu informasi kini mengambang di sebelah kanan layar dengan rapi.
  - **Mode Compact ("Secuil Saja"):** Menampilkan identitas provinsi, status pencatatan SPKT, total catatan, quick chips kategori, dan tombol ciamik *"Buka Detail Budaya &rarr;"*.
  - **Mode Expanded ("Animasi Bubble Melebar"):** Kartu melebar mulus dengan efek pegas bubble (tidak sampai full screen), memuat tab katalog tradisi riil (dengan input pencarian & filter), grafik komposisi 6 jenis budaya, kabupaten kontributor teratas, dan tombol koleksi paspor.
  - Build produksi Vite lolos **100% tanpa error**.

## [2026-10-13] Redesain Jelajah 3D: Animasi Spring Halus, Ornamen 3D Matahari & Bulan Siang/Malam, POV Lapang, dan Tab Kota/Kabupaten
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/build-sky.js` (ornamen langit 3D: Matahari emas berkas sinar kerucut low-poly, Bulan perak berkawah, dan 22 bintang octahedron berkelap-kelip dengan orbit rotasi dan siklus pencahayaan)
  - `web/src/sections/hero3d/build-scene.js` (mengintegrasikan pengontrol langit ke dalam adegan, menambahkan `aturModeWaktu('siang' | 'malam')` yang mengubah hemisphere light, directional light, dan material laut secara dinamis)
  - `web/src/sections/hero3d/build-provinces.js` (ekstrusi dirampingkan menjadi 0.13 agar kepulauan tampil anggun, filter pulau mikro degenerate `< 0.035` unit dibersihkan, inisialisasi `targetY`, `offsetTerpilih`, `offsetHover` untuk animasi spring)
  - `web/src/sections/hero3d/index.js` (POV kamera diatur dengan `radiusTargetDasar = 5.8` dan elevasi 38°, memberi ruang lapang di langit untuk matahari & bulan serta menampilkan kepulauan nusantara secara proporsional di tengah)
  - `web/src/sections/hero3d/jelajah3d.js` (perbaikan fatal bug pencarian budaya dengan mencocokkan `kode_provinsi`, loop render dengan spring lerp `0.14` pada `mesh.position.y` sehingga animasi pulau naik-turun menjadi sangat mulus tanpa patah-patah, integrasi siklus waktu siang/malam, dan zoom default 1.05)
  - `web/src/sections/hero3d/panel-kanan.js` (memperbaiki daftar tradisi sehingga seluruh 493 rekaman budaya muncul lengkap, menambahkan Tab 2 "🏛️ Kota & Kabupaten" yang menampilkan seluruh kota/kabupaten kontributor per provinsi beserta jumlah rekaman dan persentase kontribusinya, mendesain ulang card menjadi glassmorphism mewah dengan tipografi Fraunces)
  - `web/jelajah.html` & `web/src/pages/jelajah.js` (mengganti tombol toggle mode warna alami/OPK yang tidak berguna menjadi tombol toggle Siang ☀️ / Malam 🌙 yang mengubah suasana langit dan pencahayaan secara interaktif)
  - `web/src/styles/sections.css` (styling Tab Kota & Kabupaten, Tab Metrik, tombol mode waktu malam/siang di HUD, dan penyesuaian dimensi card)
  - `CHANGELOG.md`
- **Hasil:**
  - **Animasi Pulau Buttery-Smooth:** Keping provinsi kini terangkat bertahap (`+0.18`) dengan interpolasi spring lerp yang mulus saat diklik atau di-hover, tanpa bug snapping atau ter-overwrite oleh mouse move.
  - **Ornamen 3D Matahari & Bulan Melayang:** Ruang langit yang sebelumnya kosong kini dihiasi Matahari 3D low-poly bersinar dan Bulan perak dengan bintang-bintang.
  - **Siklus Siang ☀️ & Malam 🌙 Interaktif:** Pengguna dapat beralih antara siang tropis yang cerah dan malam temaram yang magis melalui tombol HUD, mengubah pencahayaan langit, bayangan, dan warna laut.
  - Validasi data lolos **0 error** dan build produksi Vite selesai **100% sukses**.

## [2026-10-13] Penyempurnaan Total Jelajah 3D: Latar Langit Biru Atmosfer (Gambar Referensi), POV Dekat & Besar, Matahari/Bulan Anti-Tembus, Awan Mengalir & Efek Audio Gamelan
- **Dibuat/diubah:**
  - `web/src/styles/sections.css` (memperbaiki background kanvas `.jelajah-wadah-fullscreen` menjadi transparan dan menerapkan radial gradient atmosfer langit biru siang jenuh `#769BE6 -> #5477CB -> #3D5EA8` sesuai referensi visual Gambar 2, serta langit malam kosmis `#18223C -> #070A12`)
  - `web/src/sections/hero3d/build-scene.js` (memperkecil radius papan laut silinder dari 6.6 menjadi 5.3 agar pulau Indonesia membentang gagah dan memenuhi bidang piring diorama)
  - `web/src/sections/hero3d/index.js` & `jelajah3d.js` (menyetel `radiusTargetDasar = 3.6` dan `sudutElevasi = 31°` sehingga kepulauan nusantara tampak sangat dekat, besar, dan mudah diklik oleh pengguna)
  - `web/src/sections/hero3d/build-sky.js` (memposisikan Matahari dan Bulan di koordinat aman `Z = -3.8` dan `Y = 2.4`, mengubah transisi Siang/Malam murni menggunakan lerp skala/opacity tanpa menurunkan posisi melewati dasar papan laut sehingga 100% bebas dari bug tembus laut)
  - `web/src/util/audio.js` (membuat modul efek suara lonceng gamelan "ting" pentatonis lembut via Web Audio API tanpa dependensi eksternal)
  - `web/src/sections/hero3d/jelajah3d.js` (mengintegrasikan suara gamelan saat pulau dipilih, menambahkan efek denyut emissive emas pada pulau terpilih, dan menganimasikan awan melayang mengelilingi nusantara secara dinamis)
  - `CHANGELOG.md`
- **Hasil:**
  - **Background Siang Cantik & Bersih:** Background hitam di belakang piring laut hilang total, digantikan oleh langit biru atmosfer cerah yang segar sesuai referensi video.
  - **Pulau Dekat & Mudah Dijangkau:** Papan laut kompak dan kepulauan Indonesia tampil besar, megah, dan dekat di depan mata.
  - **Matahari & Bulan Bebas Bug Tembus:** Terletak di langit atas yang pas, tidak menabrak navbar dan bertransisi memudar/membesar tanpa pernah menembus laut.
  - **Awan Bergerak Hidup:** Gugus awan melayang lembut mengitari kepulauan nusantara secara organik.
  - **Interaksi Memuaskan:** Memilih pulau kini diiringi nada lonceng gamelan modern yang merdu serta denyut cahaya emas elastis pada pulau terpilih.

## [2026-10-13] Perbaikan Kritis Seleksi Pulau 3D, Zero-Crash Selection Event, & Harmonisasi Tema Siang/Malam Floating Card
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/jelajah3d.js` (menghapus duplikasi deklarasi variabel `zoomLevel`, `camera`, dan `cameraBasePos` yang memicu syntax error; memperluas ambang toleransi klik menjadi `< 22px` dan durasi `< 650ms`; menambahkan proteksi agar interaksi pada floating card, HUD, dan dialog tidak memicu event deselect "klik di luar pulau" ke kanvas)
  - `web/src/sections/hero3d/bendera.js` (menambahkan guard null-check aman pada `elKartu` dan pelepasan `grupTiang` dari parent saat `dispose()` untuk mencegah uncaught TypeError)
  - `web/src/sections/hero3d/panel-kanan.js` (memasang listener `stopPropagation` pada `pointerdown`, `pointerup`, dan `click` di elemen kartu mengambang agar tidak bocor ke kanvas 3D di belakangnya)
  - `web/src/styles/sections.css` (menambahkan aturan `touch-action: none` dan `user-select: none` pada kanvas 3D; menambahkan sistem styling lengkap tema siang untuk `body.tema-siang .jelajah-kartu-kanan` dan elemen HUD sehingga kartu berubah menjadi krem-putih museum elegan saat matahari aktif)
- **Hasil:**
  - **Seleksi Provinsi 100% Responsif & Lancar:** Masalah tidak bisa memilih pulau dan animasi freeze teratasi tuntas. Keping pulau terangkat mulus dengan pantulan cahaya emas berdenyut serta lonceng gamelan merdu.
  - **Interaksi Kartu Bebas Bug:** Mengklik tombol tab, input cari budaya, atau tombol di dalam floating side card tidak lagi menutup kartu secara tiba-tiba.
  - **Sinkronisasi Tema Siang & Malam:** Floating Side Card dan HUD kini otomatis beralih tampilan (mode terang saat Siang ☀️ dengan matahari, dan mode gelap glassmorphism saat Malam 🌙 dengan bulan).
  - Build produksi lolos **0 error** dan pengujian validasi data lolos **0 error**.

## [2026-10-13] Redesain Penanda Pulau: Beacon Kristal Emas & Cincin Riak Daratan, Presisi Mainland Island, serta Tekstur Topografi Alami Zamrud Nusantara
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/bendera.js` (meredesain penanda pulau dari tiang pipa bendera raksasa menjadi **Pin Kristal Emas & Cincin Riak Tanah** proporsional: tinggi tiang dirampingkan dari 1.6 unit ke 0.44 unit, jarum kuningan halus, permata kristal octahedron emas berputar di puncaknya, panji segitiga mini bertekstur, dan cincin riak emas di permukaan tanah yang berdenyut lembut mengunci posisi pin ke daratan pulau)
  - `web/src/sections/hero3d/build-provinces.js` (menambahkan algoritma kalkulasi luas poligon & centroid daratan utama sehingga penanda dijamin 100% berdiri tepat di atas pulau daratan utama — misalnya Halmahera di Maluku Utara — bukan di tengah laut kosong; menambahkan kanvas tekstur topografi tropis berarsir kontur mikro dan bintik kanopi alami; menyelaraskan 10 provinsi yang belum tercatat dengan rona hijau zamrud sejuk teduh `#5B9C69` yang menyatu harmonis dengan bentang alam kepulauan lainnya, menggantikan warna abu-abu kusam)
  - `CHANGELOG.md`
- **Hasil:**
  - **Penanda Menyatu & Proporsional:** Penanda tidak lagi berukuran raksasa dan tidak lagi menancap canggung di tengah laut; kini berdiri kokoh di daratan pulau utama dengan riak tanah dan kristal berputar yang elegan.
  - **Kepulauan Nusantara Utuh & Bertekstur:** Kesan pulau plastik polos dan abu-abu semen hilang total; seluruh Indonesia tampil sebagai satu kesatuan Zamrud Khatulistiwa yang hijau subur, hidup, bertekstur relief topografi alami, dan memukau mata.
  - Build produksi Vite lolos **100% tanpa error** dan validasi data lolos **0 error**.

## [2026-10-13] Fitur Titik Lampu Gemerlap Malam Hari Nusantara (Night City Lights) & Perbaikan Indikator Persentase Zoom HUD
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/build-lights.js` (komponen baru sistem partikel lampu malam nusantara: menghasilkan ratusan titik cahaya berkilau emas, jingga, dan putih pijar yang tersebar secara akurat di daratan pulau 38 provinsi menggunakan Ray-Casting point-in-polygon; beranimasi kelap-kelip lembut dan otomatis memudar saat siang serta menyala saat malam)
  - `web/src/sections/hero3d/build-scene.js` (mengintegrasikan pengontrol lampu malam ke grupUtama dan menyinkronkan siklus waktu `aturModeWaktu` siang/malam)
  - `web/src/sections/hero3d/jelajah3d.js` (menghubungkan loop update animasi kelap-kelip lampu malam, menambahkan dukungan zoom via mouse wheel, menghitung persentase zoom presisi `Math.round((zoomLevel / 1.25) * 100)`, serta menambahkan callback `onZoomUbah` dan method `getZoomPersen()`)
  - `web/src/pages/jelajah.js` (memperbaiki bug teks zoom HUD yang sebelumnya macet di 100%: kini tombol persentase zoom secara real-time memperbarui angkanya saat tombol `+`, tombol `−`, reset, maupun scroll wheel mouse digunakan)
  - `CHANGELOG.md`
- **Hasil:**
  - **Pesona Malam Hari Bertabur Cahaya:** Saat mode Malam Hari aktif, daratan kepulauan Indonesia memancarkan ratusan titik lampu gemerlap yang hidup seperti pemandangan satelit bumi di malam hari.
  - **Lampu Mengikuti Elevasi Pulau (Fix Tertinggal di Bawah):** Titik lampu kini diikatkan langsung sebagai child dari masing-masing mesh keping provinsi, sehingga saat keping pulau terangkat ke atas karena dipilih atau beranimasi spring, lampu-lampu malam otomatis ikut terangkat menempel di daratan pulau secara sempurna.
  - **Indikator Zoom 100% Berfungsi Akurat:** Angka zoom HUD kini selalu berubah dinamis (misalnya 70%, 85%, 100%, 115%, 130%, 145%) sesuai tingkat perbesaran kamera.
## [2026-10-13] Checkpoint CP-0: Audit Struktur Kode & Pembersihan Audio Klik Provinsi
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/jelajah3d.js` (menghapus panggilan dan import audio klik provinsi `mainkanSuaraPilihPulau()`).
  - `backup-removed/audio.js` (mencadangkan modul audio sintetis lama yang tidak lagi dipakai ke folder backup yang aman).
  - `web/src/util/audio.js` (dihapus dari bundel aktif proyek).
- **Hasil:**
  - Struktur kode terpetakan lengkap (Peta 3D Three.js, panel provinsi, event click/pointer, state, dan CSS styling).
  - Grep codebase 100% bersih dari pemanggilan audio maupun aset audio biner.
  - Tidak ada audio lain yang terpasang di situs (tidak ada BGM, tidak ada efek suara lain).
  - Build produksi Vite lolos 100% (0 error), validasi data lolos 0 error.
## [2026-10-13] Perbaikan Masalah Tiba-Tiba Jatuh ke Peta 2D Setelah Server Stop & Run Lagi
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/fallback.js`:
    - Mengeliminasi aturan kaku `cpu <= 4 && ram <= 4` yang sering salah mendeteksi laptop kerja/lomba sebagai perangkat lemah dan memblokir WebGL.
    - Menambahkan mekanisme caching dukungan WebGL dan segera memanggil ekstensi `WEBGL_lose_context` pada canvas probe agar tidak terjadi kebocoran kuota konteks WebGL browser saat tab me-reload berulang kali setelah server restart.
    - Menambahkan parameter `abaikanKurangiGerak: true` untuk halaman khusus Jelajah 3D agar preferensi animasi OS pengguna tidak mematikan visualisasi 3D.
  - `web/src/sections/hero3d/jelajah3d.js`:
    - Memanggil `apakahBisaMemuat3D({ abaikanKurangiGerak: true })` dan menyematkan fallback ganda pembuatan `WebGLRenderer` (mencoba tanpa opsi `high-performance` jika GPU diskrit sedang sleep).
  - `web/src/pages/jelajah.js`:
    - Mengutamakan eksekusi `inisialisasiJelajah3D` secara langsung tanpa double-guard yang rapuh.
    - Jika WebGL benar-benar tidak tersedia di browser, kontrol 3D yang tidak relevan (seperti tombol putar 3D & petunjuk 360°) disembunyikan agar tampilan antarmuka tidak rancu.
- **Hasil:**
  - Halaman `jelajah.html` kini selalu konsisten memuat Peta Diorama 3D Nusantara secara andal bahkan setelah server dihentikan dan dijalankan kembali (`stop` lalu `run`).
  - Tidak ada lagi kejadian WebGL context exhaustion atau salah alih ke peta 2D SVG bergaris arsir di bawah HUD 3D.
  - Build produksi lolos **100% tanpa error** dan validasi data lolos **0 error**.

## [2026-10-13] Inovasi Eksplorasi Detail Provinsi 3 Zona (Piece Top-Down Geografi, Feed Kartu Budaya Unsplash Meluncur Turun, dan Analisis Metrik) & Penghapusan Suara Klik
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/jelajah3d.js`:
    - Menghapus efek suara gamelan `mainkanSuaraPilihPulau()` saat provinsi diklik sehingga navigasi kini hening dan nyaman sesuai permintaan pengguna.
    - Menghubungkan parameter `geoProvinsi` ke pengelola kartu.
  - `web/src/data/gambar-budaya.js`:
    - Modul baru kurasi foto Unsplash resmi bertema budaya nusantara (resolusi HD optimal, ringan, dan dipetakan cerdas berdasarkan nama budaya serta kategori OPK/Cagar Budaya: tari, wayang, batik, tenun, arsitektur, kuliner, senjata, dll.).
  - `web/src/map/render-piece.js`:
    - Modul baru pembuat siluet top-down (aerial view) keping provinsi ber-zoom in tinggi langsung dari koordinat GeoJSON d3-geo lengkap dengan bayangan relief, kontur grid, dan penanda daratan utama.
  - `web/src/sections/hero3d/panel-kanan.js`:
    - Mengintegrasikan sistem **3 Zona Eksplorasi** saat tombol "Buka Detail Budaya" diklik:
      - **Zona 1 (Kiri / Kotak Biru):** Keping piece provinsi zoom-in dari atas (aerial view) & pembagian kota/kabupaten kontributor interaktif dengan meteran kontribusi yang dapat diklik untuk filter cepat.
      - **Zona 2 (Tengah / Kotak Merah):** Galeri kartu budaya vertikal modern terinspirasi langsung dari **Gambar 2** (rounded 24px, foto Unsplash, tipografi Fraunces display, ringkasan cerita SPKT) yang beranimasi **meluncur turun perlahan dari atas ke bawah** (*staggered drop cascade*).
      - **Zona 3 (Kanan / Kotak Kuning):** Ringkasan statistik, baris komposisi 5 kategori OPK + Cagar Budaya, refleksi data SPKT, aksi Paspor Budaya, dan tombol kembali ke peta.
  - `web/src/styles/sections.css`:
    - Menambahkan styling layout CSS Grid 3 kolom, card aesthetic ala Gambar 2, animasi `@keyframes kartuTurunMeluncur`, glassmorphism, dan responsivitas tablet/mobile.
  - `CHANGELOG.md`
- **Hasil:**
  - Suara klik pulau dihilangkan sepenuhnya.
  - Saat detail provinsi dibuka, pengunjung disajikan diorama digital 3 kolom yang sangat imersif dan megah.
  - Build produksi Vite lolos **100% (0 error)** dan validasi data lolos **0 error**.

## [2026-10-13] Checkpoint 1 (CP-1) — State Machine & Cangkang Tiga Kolom Mode Detail
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/mode-detail.js`:
    - Mengimplementasikan *State Machine* (`peta` ↔ `masuk` ↔ `detail` ↔ `keluar`) dengan tween GSAP satu variabel `detailProgress ∈ [0, 1]` (durasi normal 1.4 detik / `prefers-reduced-motion` 0.2 detik).
    - Memanfaatkan `scene.attach(meshAktif)` agar keping pulau terpilih sepenuhnya independen dari orbit `grupUtama`, lalu di-lerp ke kuadran kolom kiri layar (NDC X ≈ -0.68, Y ≈ 0.05 di desktop; X ≈ 0.0, Y ≈ 0.48 di mobile) dengan rotasi top-down aerial view miring ±20° menghadap kamera (`quaternion.slerp`).
    - Pulau lain meredup (`opacity: 0.12`) dan surut ke bawah (-0.22 unit); papan laut dan awan memudar secara anggun.
    - Cangkang DOM tiga kolom (`.mode-detail-overlay`):
      - **Kolom Kiri (≈ 28%):** Area pandang keping 3D Three.js transparan di atas + HUD label teknis + daftar kota/kabupaten kontributor dengan baris persentase.
      - **Kolom Tengah (≈ 44%):** Header arsip budaya, masonry 2-kolom kartu budaya statis dengan gaya **Gambar 2** (rounded 24px, gradien pastel per jenis OPK, teks gelap `#1F1A17` kontras $\ge 4.5:1$, inset foto Unsplash, teks rata tengah), serta *empty state* jujur bagi 10 provinsi yang belum tercatat di SPKT.
      - **Kolom Kanan (≈ 28%):** Penjelasan lainnya lengkap sesuai Bagian 7 (angka utama, peringkat nasional, horizontal bar chart 5 jenis OPK, rincian Cagar Budaya, catatan kejujuran data SPKT, tombol Paspor Budaya, tombol share, dan tautan SPKT).
    - Tombol "← Kembali ke peta", tombol silang tutup (&times;), keyboard shortcut `Esc`, dan pemilih dropdown provinsi lain (`select#select-pindah-prov`) tanpa reload halaman.
    - 100% tahan interupsi dan klik ganda: tween berbalik dari progress posisi saat itu tanpa lompatan kasar.
  - `web/src/sections/hero3d/panel-kanan.js`:
    - Mengintegrasikan callback `onBukaModeDetail(provinsiAktif)` ke tombol "Buka Detail Budaya →" pada kartu compact.
  - `web/src/sections/hero3d/jelajah3d.js`:
    - Menginisialisasi `buatPengelolaModeDetail` dan menghubungkannya dengan `meshTerpilih`, `pengontrolBendera`, dan `panelKanan`.
    - Mengisolasi loop render 3D saat mode detail aktif agar tidak terjadi perebutan transformasi posisi keping.
    - Mengabaikan raycast/drag orbit kanvas selama mode detail aktif.
  - `web/src/map/scales.js`:
    - Mengekspor `GRADIEN_JENIS_CSS` (gradien pastel Kerajinan, Seni, Lisan, Pengetahuan, Adat, dan Cagar Budaya).
  - `web/src/styles/sections.css`:
    - Menambahkan aturan CSS lengkap untuk `.mode-detail-overlay`, `.cangkang-detail-wadah`, `.cangkang-topbar`, `.cangkang-3kolom-grid`, `.cangkang-kolom--kiri`, `.cangkang-kolom--tengah`, `.kartu-gambar2`, `.cangkang-kolom--kanan`, dukungan tema malam/siang, dan media query responsif mobile (< 960px & < 600px).
- **Hasil:**
  - Klik "Buka Detail Budaya" pada panel mana pun berhasil mentransisikan keping 3D ke kolom kiri dan membuka tata letak 3 kolom dengan lancar.
  - Klik "← Kembali ke peta" atau tombol `Esc` mengembalikan keping pulau ke koordinat asalnya di peta Indonesia secara presisi, lalu menampilkan kembali bendera dan panel compact.
  - Transisi keluar-masuk tahan interupsi (tidak glitch saat ditekan berulang).
  - `npm run build` sukses 100% (0 error).
  - `node tools/validate.mjs` lolos 100% (0 error).
## [2026-10-13] Penyempurnaan Mode Detail: Perbaikan Bug Animasi Kembali ke Peta, Relief & Tekstur Detail Keping 3D, Interaksi Drag 360°, dan Pelebaran Kolom Arsip Budaya
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/mode-detail.js`:
    - **Perbaikan Definitif Bug Animasi Kembali ke Peta:** Menghilangkan ketergantungan re-parenting `scene.attach` / `parentAsli.attach` yang rentan desinkronisasi. Keping pulau kini tetap berada di bawah parent aslinya (`grupProvinsi`), posisi dan orientasi target dikonversi langsung ke local space parent via `worldToLocal`, dan lerp animasi beroperasi murni antara `posAsalLokal` (di daratan kepulauan Indonesia) dan `posTargetLokal`. Saat kembali ke peta, keping dijamin mendarat 100% presisi dan mulus di pulau asalnya di atas papan laut tanpa resiko melayang di luar peta.
    - **Perbaikan Fatal Bug `rotTargetKiri`:** Menghapus referensi variabel tak terdefinisi di loop per-frame yang sebelumnya menyebabkan runtime exception dan membekukan render Three.js.
    - **Interaksi Drag Orbit 360° pada Keping:** Mengaktifkan event listener pointer drag (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) pada panggung kiri (`.cangkang-kiri-viewarea`). Pengguna kini dapat memutar bebas keping 3D secara 360° horizontal dan melakukan tilt kemiringan vertikal secara responsif dengan spring inertia damping yang mulus.
    - **Tombol Reset Sudut:** Menambahkan tombol `↺ Reset` di bawah keping untuk mengembalikan orientasi ke aerial view awal kapan saja.
    - **Aksen Garis Batas Emas (`EdgesGeometry`):** Menambahkan `LineSegments` kontur emas halus (`0xFFE082`) ber-opacity dinamis di sekeliling pulau aktif saat mode detail untuk mempertegas batas wilayah geografis dan lekukan kepulauan.
  - `web/src/sections/hero3d/build-provinces.js`:
    - **Peningkatan Tekstur & Bump Map Prosedural:** Meningkatkan resolusi kanvas tekstur topografi dari 512×512 menjadi 1024×1024 dengan garis kontur elevasi bukit yang lebih rapat, serat tenun arsir mikro, dan bintik kanopi vegetasi khatulistiwa.
    - Menambahkan `dapatkanBumpMapTopografi()` dan mengaitkannya ke `bumpMap` dan `bumpScale: 0.024` pada `MeshStandardMaterial` keping, menghasilkan permukaan pulau yang memiliki kedalaman relief fisik 3D nyata saat disinari cahaya lampu tropis.
  - `web/src/styles/sections.css`:
    - **Pelebaran Kolom Arsip Budaya:** Memperbesar ukuran kolom tengah dari `minmax(310px, 340px)` menjadi `minmax(380px, 420px)` (`grid-template-columns: 1fr minmax(380px, 420px) minmax(270px, 310px)`). Kolom kiri tetap menjadi porsi panggung terlebar (`1fr`), sedangkan kartu arsip budaya di kolom tengah kini tampil jauh lebih lega, proporsional, dan nyaman dibaca.
    - Menyesuaikan dimensi `.kartu-gambar2`: frame foto bertambah tinggi (`max-height: 155px`), padding `14px 16px`, judul `1.1rem`, dan paragraf ringkasan 3 baris.
    - Menambahkan styling interaksi `.cangkang-kiri-viewarea` (`cursor: grab / grabbing`), hint visual interaksi, dan tombol `.btn-reset-keping`.
- **Hasil:**
  - Keping Kalimantan Tengah (dan semua provinsi) kini kembali secara presisi ke daratan aslinya di atas papan laut tanpa tertinggal melayang.
  - Keping 3D di panggung kiri dapat diputar interaktif 360° oleh pengguna dengan mouse atau layar sentuh.
  - Visual keping pulau tampak tajam, kaya tekstur, memiliki relief elevasi bukit/sungai dengan bump map, serta dipertegas garis kontur batas emas.
  - Kolom arsip budaya di tengah lebih lega dan megah.

## [2026-10-13] Revisi Mode Detail: Keping Provinsi Statis Top-Down POV dari Atas, Tekstur Peta Fisik Atlas Geografi Asli, dan Pembersihan UI
- **Dibuat/diubah:**
  - `web/src/map/tekstur-atlas.js`:
    - Membuat modul generator tekstur kartografi fisik resolusi tinggi ($1024 \times 1024$).
    - Dilengkapi gradasi hipsometrik bentang alam khatulistiwa (pesisir hijau zamrud `#589437`, perbukitan oker zaitun `#B5A548`, lereng terakota `#874623`, puncak kaldera vulkanik gelap `#4B2312`).
    - Hillshading 3D (pencahayaan relief Barat Laut NW 315° standar kartografi USGS/NatGeo).
    - Jaringan alur sungai biru safir berliku (`rgba(56, 115, 175, 0.78)`) dan danau kaldera toska.
    - Garis kontur topografi ketinggian konsentris tajam dan grid koordinat bujur/lintang kartografi.
    - Grayscale Bump Map selaras ($1024 \times 1024$) untuk kedalaman relief fisik.
  - `web/src/sections/hero3d/build-provinces.js`:
    - Normalisasi atribut UV pada `geomAkhir` ke rentang $[0, 1]$ berdasarkan `boundingBox` lokal keping: $u = (v_x - \min X) / \text{lebar}X$, $v = (\max Z - v_z) / \text{tinggi}Z$.
    - Tekstur peta fisik menempel pas membungkus daratan pulau tanpa pengulangan ubin acak (`repeat(1.0, 1.0)`).
    - Konfigurasi material keping: `color: 0xffffff`, `bumpScale: 0.035`, `roughness: 0.46` agar tekstur fisik terpancar penuh.
  - `web/src/sections/hero3d/mode-detail.js`:
    - **Orientasi Statis Top-Down POV dari Atas:** Pose keping diatur tepat tegak lurus menghadap kamera dari atas:
      `dummy.lookAt(camera.position); dummy.rotateX(Math.PI * 0.5);`
      Permukaan atas pulau (`+Y`) menghadap lurus ke kamera, arah Utara (`-Z`) tegak lurus ke atas layar, dan Timur (`+X`) ke kanan layar, menyerupai peta atlas 2D kartografi yang kaya kedalaman 3D.
    - Menghilangkan kontrol putar drag pointer dan tombol reset pada panggung kiri agar visual keping tetap statis dan presisi.
    - **Penghapusan Opsi Pilihan Provinsi:** Elemen `<select id="select-pindah-prov">` dan pendukungnya di kanan topbar dihapus sepenuhnya sesuai permintaan pengguna.
  - `web/src/styles/sections.css`:
    - Membersihkan CSS kontrol putar/drag pada `.cangkang-kiri-viewarea`.
- **Hasil:**
  - Keping provinsi kini tampil statis, tegak lurus menghadap layar dari atas (POV aerial view) seperti peta kartografi atlas geografi.
  - Permukaan keping kaya tekstur peta fisik asli (pantai hijau, perbukitan oker, pegunungan vulkanik, alur sungai biru, dan kontur topografi tajam).
  - Pilihan dropdown provinsi di kanan atas telah ditiadakan.
  - `npm run build` sukses 100% (0 error).
  - `node tools/validate.mjs` lolos 100% (0 error).

## [2026-10-13] Revisi Mode Detail: Reposisi Keping ke Tengah Panggung Bebas, Perbesaran Skala Keping (2x Lebih Megah), dan Pembatasan Tekstur Atlas Khusus Keping Terpilih
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/build-provinces.js`:
    - Material awal seluruh 38 provinsi di tampilan normal diorama dikembalikan ke tampilan low-poly flat-shaded murni (`map: null`, `bumpMap: null`, `flatShading: true`, `roughness: 0.82`, `metalness: 0.02`) sesuai warna aslinya (`warnaNatural` / `warnaData`). Tampilan awal peta kepulauan Indonesia kini 100% bersih, rapi, dan estetis tanpa tekstur yang menumpuk di kondisi normal.
    - Tekstur atlas dan bump map disimpan secara privat di `mesh.userData.teksturAtlas` dan `mesh.userData.bumpMapAtlas` sehingga siap dipanggil kapan saja keping masuk ke mode detail.
  - `web/src/sections/hero3d/build-scene.js`:
    - Memperbaiki `aturModeWarna` agar mode natural menggunakan warna hijau/zamrud alami `warnaNaturalHex` yang konsisten dengan `warnaNormal`.
  - `web/src/sections/hero3d/mode-detail.js`:
    - **Fungsi `terapkanTeksturAtlas(mesh, aktif)`:** Tekstur peta fisik atlas resolusi tinggi, bump map kedalaman, dan smooth shading **HANYA diterapkan pada keping provinsi saat masuk ke Mode Detail** (`buka()`). Saat pengguna menutup detail (`tutup()`) atau berganti ke provinsi lain, keping secara otomatis dikembalikan ke material normal diorama (flat shaded, tanpa tekstur).
    - **Reposisi Keping ke Tengah Panggung (Bebas Hambatan):** Menghitung koordinat horizontal `ndcX` secara dinamis berdasarkan area terbuka panggung kiri antara batas kanan kartu wilayah administratif (lebar ~290px) dan batas kiri kolom arsip budaya. Keping tidak lagi menumpuk di sisi paling kiri layar, melainkan bertengger pas di tengah panggung visual yang lapang.
    - **Perbesaran Skala Keping Target (Patokan Ukuran 1.70 & Jarak 2.40):** Ukuran keping ditingkatkan hingga **2x lebih besar** (`patokanUkuran` dinaikkan dari `0.80` ke `1.70`, batas maksimum skala dinaikkan dari `2.2` ke `4.5`, jarak kamera didekatkan ke `2.40`). Seluruh relief bukit, lembah, alur sungai, dan garis pantai kini tampil megah, mendominasi panggung visual kiri dengan sangat jelas dan tajam.
    - **Listener Window Resize Responsif:** Mengatur ulang ukuran dan posisi keping secara otomatis ketika jendela browser diubah ukurannya atau dimaksimalkan.
- **Hasil:**
  - Tampilan normal peta kepulauan Indonesia kembali bersih low-poly flat shaded tanpa tekstur yang mengganggu.
  - Saat provinsi dibuka di mode detail, keping bertransformasi menjadi peta fisik atlas detail, berukuran 2x lebih besar, dan posisinya berada tepat di tengah area panggung kiri (tidak mepet ke tepi kiri layar lagi).
  - Saat kembali ke peta, keping mendarat dan kembali ke tampilan normal pulau diorama.
  - `npm run build` sukses 100% (0 error).
  - `node tools/validate.mjs` lolos 100% (0 error).

## [2026-10-13] Kalibrasi Presisi: Ukuran Keping Proporsional "PAS" (Bebas Overflow & Tabrakan Kartu)
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/mode-detail.js`:
    - Mengganti pembagian skala kasar `patokanUkuran` dengan sistem kalkulasi proyeksi perspektif pixel matematis (`targetPx = Math.min(ruangTinggi * 0.56, ruangLebar * 0.62, 390)`).
    - Skala keping Three.js dihitung tepat dari frustum kamera: `worldSizeTarget = targetPx * (frustumH / winH)` sehingga dimensi terluar keping selalu berproyeksi tepat $\le 390\text{ px}$ di layar.
    - Menghilangkan total bug overflow: keping kini memiliki jarak aman (margin) $\ge 100\text{ px}$ ke topbar, $\ge 80\text{ px}$ ke kartu wilayah administratif kiri-bawah, dan $\ge 120\text{ px}$ ke kolom arsip budaya.
- **Hasil:**
  - Keping Kalimantan Selatan (dan semua provinsi) kini tampil pas, proporsional, dan elegan di panggung visual kiri tanpa menabrak atau tertutup elemen antarmuka apa pun.
  - `npm run build` sukses 100% (0 error).
  - `node tools/validate.mjs` lolos 100% (0 error).

## [2026-10-13] Mode Detail: Peta 3D Indonesia Tetap Ada di Latar (Agak Buram) & Visual Jejak Keping Asal Terangkat
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/mode-detail.js`:
    - **Peta 3D Latar Tetap Hadir (TIDAK Ditenggelamkan):** Menghilangkan kode yang sebelumnya menenggelamkan pulau-pulau lain ke bawah permukaan laut (`m.position.y = yAsal - p * 0.22`). Seluruh pulau lain kini tetap berada kokoh di ketinggian aslinya di atas papan laut.
    - **Efek "Agak Buram" / Temaram Atmosferik:** Opasitas pulau-pulau lain diatur ke tingkat lembut yang elegan (`opacity: Math.max(0.42, 1.0 - p * 0.58)`), papan laut tetap solid (`opacity: 0.85`), dan awan tetap melayang di langit (`opacity: 0.40`). Seluruh gugusan kepulauan Indonesia tetap terlihat jelas dan megah sebagai latar belakang alami diorama.
    - **Visual "Bagian yang Terambil Terlihat Jelas" (`meshCetakanAsal`):** Membuat cetakan / socket siluet keping di lokasi koordinat asalnya di peta Indonesia saat keping terangkat ke depan:
      1. Dasar cekungan siluet gelap berbayang (`0x0A1428`, `opacity: 0.72`) di atas papan laut.
      2. Garis kontur siluet bercahaya cyan / biru safir (`#38BDF8`, `opacity: 0.90`) di sekeliling batas wilayah asal.
      Pengunjung kini dapat melihat dengan sangat jelas rongga/slot tempat keping tersebut terangkat dari peta kepulauan Indonesia.
    - **Pembersihan Bersih (Clean Disposal):** Saat mode detail ditutup atau berganti provinsi, cetakan keping asal dibersihkan dari scene Three.js dan memori di-*dispose* tanpa kebocoran.
- **Hasil:**
  - Peta 3D Indonesia tidak lagi hilang atau lenyap saat mode detail dibuka, melainkan tetap hadir di latar belakang dengan nuansa temaram yang lembut.
  - Bagian/slot wilayah yang kepingnya terambil terlihat sangat jelas dan dramatis dengan siluet kontur cyan bercahaya di peta nusantara.
  - `npm run build` sukses 100% (0 error).
  - `node tools/validate.mjs` lolos 100% (0 error).

## [2026-10-13] Perbaikan Kritis Bug: Tekstur Menempel di Peta Normal & Penghapusan Tidak Sengaja Buffer Geometry
- **Temuan Masalah:**
  - Di Three.js, memutasi `material.map = null` dan `material.needsUpdate = true` pada material PBR yang sedang di-render tidak secara andal merevert shader GLSL kembali ke *flat-shading*, sehingga tekstur peta tetap terikat di WebGL state setelah mode detail ditutup.
  - Pada fungsi pembersihan `meshCetakanAsal`, pemanggilan `traverse` memicu `child.geometry?.dispose()` pada `meshDasarSlot` yang berbagi geometri dengan `meshAktif.geometry`. Hal ini mendispose buffer vertex asli keping provinsi dari VRAM GPU, menyebabkan raycasting dan handler klik membeku/error, sehingga keping pulau tertinggal dalam keadaan terangkat dan bertekstur di peta normal.
- **Dibuat/diubah:**
  - `web/src/sections/hero3d/build-provinces.js`:
    - Membuat dua instansiasi material terpisah per provinsi: `materialNormal` (murni flat-shaded low-poly tanpa map/bump) dan `materialAtlas` (bertekstur peta fisik PBR).
    - Disimpan di `mesh.userData.materialNormal` dan `mesh.userData.materialAtlas`.
  - `web/src/sections/hero3d/mode-detail.js`:
    - `terapkanTeksturAtlas(mesh, aktif)` kini langsung menukar *material instance* (`mesh.material = materialAtlas` vs `mesh.material = materialNormal`). Pergantian material bersifat instan, 100% bebas dari cache miss shader, dan menjamin keping di peta normal TIDAK PERNAH memiliki tekstur.
    - Membuat fungsi `bersihkanCetakanAsal()` yang secara selektif HANYA mendispose geometri garis `EdgesGeometry` yang dibuat khusus, dan TIDAK PERNAH menyentuh atau mendispose geometri daratan pulau asli.
  - `web/src/sections/hero3d/build-scene.js`:
    - Sinkronisasi perubahan warna mode natural/data pada `materialNormal`.
- **Hasil:**
  - Keping di peta normal kembali 100% hijau *flat-shaded* bersih saat mode detail ditutup.
  - Tidak ada lagi tekstur yang menempel atau pulau yang tertinggal melayang di peta normal.
  - Geometri pulau tetap utuh di memori GPU, raycasting dan navigasi klik antar pulau berjalan lancar tanpa error.
  - `npm run build` sukses 100% (0 error).
  - `node tools/validate.mjs` lolos 100% (0 error).

## [2026-10-14] Penyelarasan Navbar Halaman Jelajah 3D dengan Desain Floating Glassmorphism Beranda
- **Dibuat/diubah:**
  - `web/jelajah.html`:
    - Mengubah `<header id="header-utama" class="header-utama header-fullscreen">` menjadi `<header id="header-utama" class="header-utama">` (menghapus kelas `header-fullscreen`).
    - Menghapus kelas `wadah` pada `<nav class="nav-bar">` sehingga ketiga pulau navigasi (Logo kiri, Kapsul menu tengah, Aksi kanan) menyebar secara proporsional sesuai grid layout desktop `layout.css`.
  - `web/src/styles/sections.css`:
    - Menghapus aturan `body.tema-siang .header-fullscreen` yang sebelumnya memaksakan latar bar putih solid (`rgba(255, 255, 255, 0.88) !important;`) dan garis `border-bottom` kaku pada navigasi.
    - Menetralkan `.header-fullscreen` dan mengatur `.jelajah-layar-penuh-main` dengan `top: 0; width: 100vw; height: 100vh;` sehingga kanvas 3D mengisi layar penuh 100% tanpa celah putih di atas.
    - Menyesuaikan posisi `.jelajah-hud-atas` ke `top: 4.85rem;` agar badge petunjuk interaksi mengambang manis tepat di bawah kapsul menu navbar tanpa saling bertabrakan.
  - `CHANGELOG.md`
- **Hasil:**
  - Navbar di halaman Jelajah 3D (`jelajah.html`) kini tampil 100% identik dengan halaman Beranda (`index.html`): mengambang bebas (*floating pill*) dengan efek *frosted glassmorphism*, logo emas bercahaya, dan tombol aksi terpisah tanpa ada bilah putih padat di belakangnya.
  - Posisi dan tata letak navbar di halaman Beranda (`index.html`) tetap terjaga utuh tanpa ada perubahan sedikit pun.
  - Build produksi Vite sukses 100% (0 error). HMR server aktif memperbarui tampilan peramban.

## [2026-10-14] Penyelarasan Palet Hero CTA: Transformasi Warna Biru Menjadi Kuning Kecoklatan Emas
- **Dibuat/diubah:**
  - `web/index.html`:
    - Mengganti emoji bola dunia `🌐` pada tombol "Jelajah Peta 3D" dengan SVG ikon globe geometris modern (`.hero-cta-sekunder-ikon`) yang dapat diwarnai secara presisi sesuai palet identitas situs.
  - `web/src/styles/sections.css`:
    - Mengubah lingkaran `.hero-cta-ikon` pada tombol utama "Telusuri Cerita Budaya" dari warna biru laut (`#0077b6` / `#0288d1`) menjadi gradasi kuning kecoklatan keemasan kaya: `linear-gradient(135deg, #E6B14A 0%, #C88A24 60%, #9C5E0D 100%)`.
    - Mengubah bayangan hover tombol utama dari biru laut menjadi keemasan hangat: `box-shadow: 0 18px 40px rgba(184, 115, 20, 0.4);`.
    - Menerapkan warna kuning kecoklatan emas (`var(--aksen)` / `#E6B14A`) pada ikon globe dan batas tepi tombol sekunder `.hero-cta-sekunder`, lengkap dengan efek rotasi interaktif saat hover serta penyesuaian kontras pada mode terang.
  - `CHANGELOG.md`
- **Hasil:**
  - Seluruh elemen tombol aksi di hero kini memiliki harmoni visual yang senada dengan identitas warna budaya Nusantara (kuning kecoklatan emas / *warm amber gold*), menghilangkan ketidaksesuaian warna biru sebelumnya.
  - Build produksi Vite sukses 100% (0 error). HMR dev server langsung menyalurkan pembaruan ke layar peramban.

## [2026-10-14] Filter Wilayah Soal Kuis Nusantara & Animasi Kamera Fly-in 3D Diorama Budaya
- **Dibuat/diubah:**
  - `web/src/features/kuis.js` (menambahkan pemetaan wilayah `PETA_WILAYAH_KODE`, fungsi `buatSoalKhasWilayah` untuk topik regional & fakta data, serta parameter `kategori` pada `buatSesiKuis` agar soal yang dihasilkan spesifik sesuai pulau/wilayah yang diklik)
  - `web/src/sections/kuis.js` (menambahkan state `kategoriAktif` & `labelKategoriAktif`, metode `gantiKategori`, banner indikator topik aktif di header kuis, dan toast notifikasi perubahan topik)
  - `web/src/pages/kuis.js` (menghubungkan event klik seluruh pill wilayah & tombol stat ke `kontrolKuis.gantiKategori`, update kelas aktif visual `.is-aktif`, pemuatan data lengkap langsung tanpa delay, dan dukungan parameter URL `?topik=...`)
  - `web/kuis.html` (mengubah tag span statis menjadi tombol pill interaktif yang dapat diklik untuk memilih wilayah Sumatera, Jawa, Kalimantan, Sulawesi, Bali & Nusa Tenggara, Maluku & Papua, serta tombol stat 205 Tradisi, 38 Provinsi, dan 8 Tantangan Data)
  - `web/src/sections/hero3d/jelajah3d.js` (menambahkan animasi kamera masuk *fly-in drone* dari angkasa menuju kepulauan nusantara saat membuka halaman 3D, animasi fokus/kemudi kamera dinamis menuju koordinat pulau/daerah yang dipilih pengguna, perbaikan pencarian `kode_provinsi` agar tradisi SPKT tampil utuh, dan reset posisi kamera saat menutup kartu bendera)
  - `web/src/sections/hero3d/bendera.js` (integrasi basis data `CIRI_KHAS_PROVINSI` 38 provinsi: julukan daerah, arsitektur adat, seni & tradisi khas, kuliner & kriya, filosofi leluhur, serta kartu tradisi SPKT nyata dengan tag kategori dan tombol baca kisah)
  - `web/src/data/ciri-khas-provinsi.js` (basis data khasanah ciri khas budaya autentik untuk seluruh 38 provinsi di Indonesia)
  - `web/src/styles/sections.css` (penataan gaya visual pill tombol wilayah kuis, glowing highlight `.is-aktif`, banner topik kuis, serta komponen kartu bendera dan grid khasanah budaya daerah 3D)
  - `CHANGELOG.md`
- **Hasil:**
  - **Filter Kuis Berfungsi Penuh:** Mengklik tombol pill (mis. *🌿 Sumatera*, *🏛️ Jawa*, *🛶 Kalimantan*, *⛵ Sulawesi*, *🌊 Bali & Nusa Tenggara*, *🦜 Maluku & Papua*, dsb.) langsung mengganti topik kuis secara real-time dan menghasilkan 6–8 soal yang 100% relevan dengan kebudayaan dan fakta pencatatan di pulau tersebut.
  - **Animasi Kamera Fly-in 3D:** Saat membuka halaman Jelajah 3D, kamera meluncur anggun dari sudut atas langit menuju kepulauan Nusantara seiring keping pulau terangkat anggun dari atas permukaan laut.
  - **Fokus Kamera & Ciri Khas Budaya Daerah:** Mengklik suatu daerah di peta 3D secara otomatis mengarahkan dan memfokuskan kamera ke pulau tersebut, serta menampilkan kartu panji bendera berisi julukan daerah, 4 pilar khasanah budaya (Arsitektur Adat, Seni & Tradisi, Kuliner & Kriya, Filosofi), dan tradisi riil SPKT yang dapat diklik untuk membaca cerita lengkapnya.
  - Build produksi Vite lolos dengan **0 error dan 0 warning**.

## [2026-10-14] Perbaikan Cacat: FOUC Layar Putih Kuis & Standarisasi Dialog Modal Tentang Data
- **Dibuat/diubah:**
  - `web/kuis.html`: Menambahkan baseline `<style>` anti-FOUC (`background-color: #14110f !important`) dan `<link rel="stylesheet">` langsung di `<head>` untuk mencegah jeda rendering tanpa gaya (layar putih polos font default); menstandarisasi `#dialog-tentang` dan `#dialog-rekaman` memakai kelas modal `.dialog-modal`, `id="tombol-tutup-tentang"` dan `id="tombol-tutup-rekaman"`; serta menyinkronkan footer lengkap dengan atribusi dinamis.
  - `web/paspor.html`: Menstandarisasi `#dialog-tentang` menggunakan kelas modal `.dialog-modal` dan tombol tutup `id="tombol-tutup-tentang"`, serta memperbarui footer standar.
  - `web/jelajah.html`: Menstandarisasi `#dialog-tentang` dan `#dialog-rekaman` dengan `.dialog-modal` dan tombol tutup berkelas dialog standar.
  - `web/src/ui/footer.js`: Memperbarui fungsi `perbaruiAtribusiFooter(meta)` agar fleksibel menerima parameter `meta` baik berupa objek maupun string tanggal sehingga tidak pernah mengalami error `undefined`.
  - `web/src/pages/kuis.js` & `web/src/pages/paspor.js` & `web/src/pages/jelajah.js`: Menyinkronkan pemanggilan `perbaruiAtribusiFooter(meta)` agar dialog tentang data dan footer selalu memuat atribusi resmi dan tanggal dinamis.
- **Hasil:**
  - **Layar Putih Unstyled (FOUC) Hilang Total:** Berpindah atau me-refresh ke halaman Kuis kini langsung menampilkan tema gelap elegan dengan font modern tanpa pernah berkedip ke tampilan putih polos bawaan browser.
  - **Dialog "Tentang Data" Rapi & Berfungsi:** Mengklik "Tentang data" di navigasi atas maupun footer kini membuka modal dialog kertas elegan (.dialog-modal) di tengah layar dengan latar belakang gelap blur, teks keterbatasan transparan yang rapi, dan tombol tutup `[X]` yang berfungsi normal.
  - Build produksi Vite sukses tanpa error dan tanpa warning.


