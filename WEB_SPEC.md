# WEB_SPEC.md — Spesifikasi Web Atlas Budaya

> Dibaca bersama `AGENTS.md` dan `DATA_SPEC.md`. Dokumen ini mengatur Fase 4 sampai 10.
> Semua angka di UI **dihitung dari data** (`statistik.json`, `provinsi.json`), bukan ditulis tangan. Teks bertanda `{kurung kurawal}` adalah placeholder dari data.

---

## 1. Konsep dan tujuan

**Nama situs:** belum diputuskan pengguna. Simpan di `src/config.js` sebagai `NAMA_SITUS` (default sementara: `"Atlas Budaya"`). Kandidat dari pengguna: Nusantarasa, Tenun Cerita, Mozaik Nusa, Jejak Nusa. **Tanyakan pengguna sebelum Fase 8.**

**Pesan inti:** *"Budaya Indonesia tidak sedikit. Yang sedikit adalah yang sudah tercatat."*

**Tiga tujuan pengalaman:**
1. **Terpukau**: peta dan animasi yang indah membuat orang betah menelusuri data yang biasanya kering.
2. **Tersadar**: ketimpangan pencatatan terasa jelas tanpa menyalahkan siapa pun dan tanpa merendahkan daerah mana pun.
3. **Tergerak**: pengunjung ingin menjelajah lebih jauh, berbagi, dan peduli pada pencatatan budaya.

**Kriteria juri yang dibidik:** ide dan kesesuaian tema sosial budaya, kualitas UX, kualitas teknis, kejujuran dan kebermanfaatan data. Web yang mulus dan jujur mengalahkan web ambisius yang setengah jadi.

**Target perangkat:** ponsel (utama, mulai 360 px) dan desktop. Juri sering membuka dari ponsel.

---

## 2. Arsitektur informasi

Satu halaman panjang (single page) dengan scrollytelling, ditambah mode jelajah interaktif. Tanpa router berat; gunakan anchor dan `<dialog>`.

```
[Navigasi mini, tetap di atas]  Cerita | Jelajah | Paspor | Kuis | Tentang data
 S1  Pembuka
 S2  Peta menyala
 S3  Cahaya tidak merata (konsentrasi)
 S4  Yang masih gelap (provinsi belum tercatat)
 S5  Jelajah (peta interaktif + panel provinsi + kartu)
 S6  Kisah pilihan (kartu unggulan)
 S7  Paspor Budaya & Kuis
 S8  Penutup dan ajakan
 Footer: atribusi, tanggal data, disclaimer, tentang data & keterbatasan
```

Data dimuat bertahap:
1. Awal: `statistik.json`, `provinsi.json`, `geo/provinsi.geojson`, `meta.clean.json` (semuanya kecil).
2. Setelah bagian Jelajah mendekati viewport (IntersectionObserver) atau browser idle: `budaya.clean.json` dan `index-pencarian.json`.

---

## 3. Storyboard dan narasi per bagian

Teks adalah draf awal dan boleh dipoles, **tapi makna dan kejujuran tidak boleh berubah**. Semua kalimat statistik diakhiri rujukan "per {tanggal_ambil_terformat}" (cukup sekali per bagian, boleh di catatan kecil).

### S1 — Pembuka
- **Visual:** latar gelap `--malam`; siluet peta Indonesia (38 provinsi) berwarna gelap hampir tak terlihat; partikel/titik cahaya halus muncul pelan.
- **Kicker:** `{NAMA_SITUS}`
- **H1:** "Berapa banyak budaya Indonesia yang sudah tercatat?"
- **Sub:** "Kami membaca {total_rekaman} catatan dari sistem pendataan resmi Kementerian Kebudayaan. Ada yang indah. Ada yang janggal."
- **CTA:** "Mulai menelusuri" (scroll halus ke S2). Indikator scroll berupa panah bergerak halus.
- **Animasi:** H1 muncul per baris (clip/slide-up), siluet peta fade-in, indikator scroll berdenyut (hilang jika reduced motion).

### S2 — Peta menyala
- **Layout:** peta di-*pin* di tengah (desktop) / menempel di atas 55vh (ponsel); teks langkah bergulir.
- **Langkah teks (muncul bergantian saat scroll):**
  1. "Satu per satu, provinsi yang sudah mencatat budayanya mulai menyala."
  2. Penghitung besar: **{total_rekaman}** "catatan budaya" (count-up).
  3. "Tersebar di **{provinsi_berdata} dari 38 provinsi**."
  4. Legenda warna 5 jenis OPK + Cagar Budaya (chip berwarna) muncul: "Setiap warna adalah jenis budaya yang berbeda."
- **Animasi:** provinsi menyala berurutan dari barat ke timur (urut x pusat provinsi), stagger 0,04 s, transisi warna 0,6 s. Provinsi `belum_tercatat` tetap gelap.
- Warna provinsi pada bagian ini = **jenis OPK dominan** di provinsi itu (lihat 5.3 untuk mode peta).

### S3 — Cahaya tidak merata
- **Teks:** "Tapi cahayanya tidak merata."
- **Visual waffle:** kisi 10×10 kotak (100 kotak). Kotak yang mewakili `{konsentrasi.kabupaten_teratas.persen}` dibulatkan menyala warna aksen; sisanya redup.
- **Teks bawah waffle:** "Dari setiap 100 catatan, {persen_bulat} berasal dari satu kota: **{nama_kabupaten}**, {provinsi}."
- **Teks lanjutan:** "Lima provinsi teratas menyumbang {top5_persen}% dari seluruh catatan."
- **Catatan penting (wajib tampil, ukuran terbaca):** "Angka ini menunjukkan seberapa banyak yang sudah dicatat, bukan seberapa kaya budaya sebuah daerah."
- **Mini-bar:** 5 provinsi teratas sebagai bar horizontal beranimasi (lebar sesuai total), label jelas.
- **Animasi:** kotak waffle menyala berurutan; bar tumbuh dari kiri; angka count-up.

### S4 — Yang masih gelap
- **Teks:** "{provinsi_belum_tercatat} provinsi belum punya catatan di SPKT."
- **Peta:** provinsi menyala meredup, 10 provinsi `belum_tercatat` diberi **pola arsir** diagonal (bukan sekadar gelap) dan perlahan berdenyut lembut. Pada ponsel, jika animasi mengganggu, cukup statis.
- **Chips daftar:** nama kesepuluh provinsi sebagai tombol (klik → panel provinsi dengan keadaan kosong yang jujur, lihat 4.5).
- **Teks:** "Belum tercatat bukan berarti tidak ada. Setiap provinsi ini punya tradisi, kerajinan, dan cerita. Catatannya yang belum sampai di sini."
- **Animasi:** provinsi lain meredup (opacity 0,35) sementara 10 provinsi arsir "menyala" dengan garis tepi aksen. Reduced motion: langsung keadaan akhir.

### S5 — Jelajah
- **Peta interaktif** (lihat bagian 5) + **panel provinsi** (desktop: panel samping kanan; ponsel: *bottom sheet* yang bisa digeser/ditutup).
- **Kontrol:** pencarian teks (nama objek/daerah), filter jenis (chip multi-pilih), pengalih mode peta (5.3), tombol "Lihat sebagai daftar" (alternatif aksesibel).
- **Panel provinsi memuat:** nama provinsi, total catatan, rincian jenis (bar kecil berwarna), kabupaten teratas, kartu objek (maks 12, tombol "Muat lebih banyak"), ringkasan Cagar Budaya (jenis dan jumlah), SDM kebudayaan hanya sebagai angka agregat bila > 0.
- Membuka panel provinsi **mencatat stempel Paspor** (bagian 8).

### S6 — Kisah pilihan
- **Isi:** 6 kartu besar dari rekaman `kelas_konten = unggulan`, dipilih dari provinsi dan jenis yang beragam (ambil dari `unggulan_ids` tiap provinsi, hindari lebih dari 1 per provinsi, usahakan 5 jenis OPK terwakili).
- **Kartu:** pola generatif sesuai jenis (bagian 6.4), nama, provinsi, `ringkasan`, tombol "Baca selengkapnya" (membuka dialog detail).
- **Animasi:** kartu masuk bergantian saat scroll; pada hover/fokus pola sedikit bergeser (parallax halus).
- Rotasi: urutan acak per kunjungan (dengan *seed* sehingga stabil di sesi yang sama).

### S7 — Paspor Budaya & Kuis
- Dua kartu besar sejajar (bertumpuk di ponsel): "Paspor Budaya" (progres stempel) dan "Uji pengetahuanmu" (mulai kuis). Spesifikasi di bagian 8.

### S8 — Penutup dan ajakan
- **Teks:** "Budaya hidup lewat cerita yang dituturkan. Kalau daerahmu belum banyak tercatat, kamu bisa ikut menjaga ceritanya."
- **CTA utama:** "Kunjungi SPKT" → `https://spkt.kemenbud.go.id` (buka tab baru, `rel="noopener noreferrer"`).
- **Catatan untuk agent:** **jangan** menyebut fitur kontribusi publik tertentu di SPKT kecuali pengguna sudah memverifikasi keberadaannya. Tanyakan pengguna.
- **CTA sekunder:** "Bagikan" (Web Share API bila ada; jika tidak, salin tautan), "Ulangi dari awal".

### Footer / "Tentang data" (dialog)
- Atribusi: `Data: SPKT – Kementerian Kebudayaan RI, diambil {tanggal_ambil_terformat}` + tautan.
- **Disclaimer wajib:** "Situs ini dibuat sebagai karya lomba dan tidak resmi, tidak berafiliasi dengan Kementerian Kebudayaan RI."
- **Keterbatasan data (wajib jujur):** data hanya mencerminkan yang tercatat di SPKT pada tanggal pengambilan; tidak semua provinsi memiliki catatan; jumlah tidak mengukur kekayaan budaya; deskripsi bersumber apa adanya dari SPKT; foto tidak tersedia; tahun pada data adalah tahun pencatatan.
- Tentang kami/pembuat: placeholder, isi oleh pengguna.

---

## 4. Komponen UI

### 4.1 Navigasi
Bilah tipis tetap di atas (transparan → solid saat scroll), tautan anchor dengan penanda bagian aktif (IntersectionObserver). Ponsel: ikon menu → panel layar penuh. Ada *skip link* "Lompat ke konten".

### 4.2 Kartu cerita (`<article>`)
Struktur: pola/ornamen bagian atas (tinggi 96–140 px, dari 6.4), lencana jenis (warna + teks), `nama_tampil` (heading), lokasi (kabupaten/provinsi), `ringkasan` maksimal 4 baris (CSS line-clamp), tombol "Baca selengkapnya".
Varian: `unggulan` (besar), `biasa`, `tanpa-deskripsi` (menampilkan "SPKT belum memuat deskripsi untuk objek ini." dengan gaya lebih tenang, tanpa tombol baca).
Entri gabungan: lencana "Tercatat di {jumlah_lokasi} kabupaten".

### 4.3 Dialog detail rekaman (`<dialog>`)
- Judul, lencana jenis & kategori, lokasi, `deskripsi` lengkap.
- Deskripsi dipecah menjadi paragraf (setiap ±3–4 kalimat, memakai pemecah kalimat aman singkatan seperti pada C-09). Jika > 1.500 karakter: tampilkan ±1.200 karakter pertama + tombol "Tampilkan semua". Deskripsi sampai 26.000 karakter harus tetap lancar (render paragraf bertahap).
- Entri gabungan: daftar kabupaten sebagai chips.
- Keterangan kecil: "Sumber: SPKT – Kementerian Kebudayaan RI (diambil {tanggal})" dan "Tahun pencatatan: {tahun_input}" bila ada (label **"tahun pencatatan"**, bukan "tahun").
- Fokus: pindah ke judul saat dibuka, kembali ke pemicu saat ditutup; Esc menutup; klik latar menutup; `aria-labelledby` terhubung.

### 4.4 Chips filter
Multi-pilih, memiliki `aria-pressed`, warna sesuai jenis plus teks (tidak mengandalkan warna saja), target sentuh ≥ 44 px.

### 4.5 Keadaan kosong provinsi `belum_tercatat`
Panel menampilkan: nama provinsi; pola arsir; teks "**Belum tercatat di SPKT.** Bukan berarti tidak ada budaya di {provinsi}. Datanya belum sampai ke sistem pada {tanggal_ambil_terformat}."; tombol "Lihat provinsi lain yang berdekatan" (opsional, berdasarkan daftar tetangga yang **disimpan tetap** di `src/data/tetangga.js`; hanya isi jika akurat, jika ragu lewati); tombol "Tandai: aku peduli" (memberi stempel khusus di Paspor).
Dilarang kata: "kosong", "miskin", "tertinggal" dalam konteks budaya.

### 4.6 Tampilan daftar (alternatif aksesibel)
Tabel semantik `<table>` 38 baris: Provinsi, Total, OPK, Cagar Budaya, Status. Bisa diurutkan. Tombol menuju panel provinsi. Wajib ada karena peta SVG sulit bagi pembaca layar.

### 4.7 Toast / umpan balik
Satu komponen toast kecil (`role="status"`) untuk "Stempel baru!" dan "Tautan disalin".

---

## 5. Peta

### 5.1 Teknis
- `d3-geo` dengan proyeksi **Mercator** disesuaikan (`fitSize`) ke batas Indonesia; render sebagai **SVG** (`<path>` per provinsi).
- Setiap path: `data-kode`, `role="button"`, `tabindex="0"`, `aria-label="{nama}, {total} catatan"` (untuk belum tercatat: `"{nama}, belum tercatat di SPKT"`).
- Interaksi: hover (desktop) menampilkan tooltip (nama + total); klik/Enter/Spasi membuka panel; fokus keyboard terlihat jelas (outline 2–3 px kontras tinggi).
- Zoom: sederhana via tombol +/− dan *pinch* di ponsel (opsional; jangan menunda inti). Jika dibuat, pakai transformasi pada `<g>` dengan batas minimum/maksimum.
- **Target sentuh kecil:** provinsi kecil (DKI Jakarta, DI Yogyakarta, Banten, Bali, Kepulauan Riau, Kepulauan Bangka Belitung, Gorontalo, dll.) sulit disentuh. Untuk provinsi yang luas proyeksinya di bawah ambang (mis. < 600 px² pada lebar 360 px), tambahkan **lingkaran hit transparan** (r ≈ 16–20 px) di titik tengahnya yang meneruskan klik ke provinsi tersebut. Selain itu selalu sediakan daftar chips provinsi di bawah peta.
- Urutan DOM: `<g>` provinsi diurutkan berdasarkan kode agar urutan tab logis dan deterministik.

### 5.2 Skala warna (WAJIB: bukan linear)
Data sangat timpang (maks 119, banyak provinsi < 10). Gunakan **skala akar kuadrat** (`d3.scaleSqrt`) atau logaritmik dengan offset (`scaleSymlog`) dari 0 ke `maks_total`, memetakan ke rampa warna 5–6 tahap yang naik terang. Tampilkan legenda dengan angka nyata (mis. 1, 5, 20, 50, 100+). Jangan mengklaim "lebih kaya" pada legenda; gunakan "jumlah catatan".

### 5.3 Mode peta (pengalih pada bagian Jelajah)
| Mode | Pewarnaan | Dipakai di |
|---|---|---|
| **Jumlah** | Skala sqrt total catatan, satu warna dasar | Default Jelajah |
| **Jenis dominan** | Warna jenis OPK terbanyak di provinsi | S2 |
| **Per jenis** | Pilih satu jenis OPK → skala sqrt dari jumlah jenis itu | Filter di Jelajah |
| **Cagar Budaya** | Skala sqrt jumlah Cagar Budaya | Opsional |

### 5.4 Keadaan visual provinsi
| Keadaan | Gaya |
|---|---|
| Menyala/berdata | Warna dari skala/jenis, garis tepi tipis `--garis` |
| Belum tercatat | `<pattern>` arsir diagonal (garis 1,5 px, jarak 6 px) di atas dasar gelap; **bukan** sekadar warna gelap polos |
| Hover/fokus | Naik ke atas (urutan DOM tidak berubah, gunakan filter/stroke), garis tepi aksen 2 px |
| Terpilih | Garis tepi aksen 3 px + provinsi lain meredup 0,55 |
| Meredup (filter tidak cocok) | Opacity 0,25 |

---

## 6. Sistem desain

### 6.1 Design tokens (`src/styles/tokens.css`)

```css
:root {
  /* Dasar */
  --malam: #14110F;        /* latar gelap utama */
  --malam-2: #1E1916;      /* permukaan di atas latar gelap */
  --kertas: #F4EBDD;       /* latar terang / teks di atas gelap */
  --tinta: #2A211B;        /* teks di atas terang */
  --garis: #3A322C;        /* garis halus di mode gelap */
  --aksen: #E6B14A;        /* emas: aksen utama, fokus, sorotan */

  /* Jenis budaya (diverifikasi kontras ≥ 4.5:1 terhadap --malam; agent wajib mengecek ulang) */
  --jenis-kerajinan: #E07A4F;   /* terakota */
  --jenis-seni: #E6B14A;        /* emas */
  --jenis-lisan: #8FA3E8;       /* indigo muda */
  --jenis-pengetahuan: #7FB07A; /* hijau lumut */
  --jenis-adat: #D983A8;        /* mawar */
  --jenis-cagar: #A89F95;       /* abu batu */

  /* Ruang & bentuk */
  --r-sm: 8px; --r-md: 14px; --r-lg: 24px;
  --ruang-1: 4px; --ruang-2: 8px; --ruang-3: 16px; --ruang-4: 24px; --ruang-5: 40px; --ruang-6: 72px;
  --lebar-baca: 68ch;

  /* Gerak */
  --ease-keluar: cubic-bezier(.22,1,.36,1);
  --dur-cepat: .2s; --dur-sedang: .6s; --dur-lambat: 1.2s;
}
@media (prefers-reduced-motion: reduce) {
  :root { --dur-cepat: 0s; --dur-sedang: 0s; --dur-lambat: 0s; }
}
```
Bagian bergaya terang (S3 teks panjang, dialog detail) memakai `--kertas` dan `--tinta`. Hindari kontras buruk; periksa semua pasangan teks/latar.

### 6.2 Tipografi
- **Display:** serif ekspresif, disarankan **Fraunces** (variabel). Dipakai untuk H1/H2 dan angka besar.
- **Isi:** sans-serif ramah, disarankan **Plus Jakarta Sans** (dirancang di Indonesia). Dipakai untuk teks, UI, label.
- **Self-host** lewat paket `@fontsource-variable/fraunces` dan `@fontsource-variable/plus-jakarta-sans` (agar demo tidak bergantung internet). Ini dua paket tambahan yang **diizinkan**.
- Skala (clamp fluid): H1 `clamp(2.2rem, 6vw, 4.5rem)`, H2 `clamp(1.6rem, 4vw, 2.75rem)`, isi `1rem`–`1.125rem`, label `0.8125rem` huruf kapital berjarak 0,08em.
- Baris isi `line-height: 1.6`; lebar baca maksimum `--lebar-baca`.
- `font-display: swap`; sediakan fallback `Georgia, serif` / `system-ui, sans-serif`.

### 6.3 Nuansa visual
Hangat, bumi, "malam Nusantara": latar gelap cokelat-hitam, cahaya emas dan terakota, sentuhan indigo. Hindari ungu-biru generik ala template, bayangan berlebihan, dan efek kaca (glassmorphism) berat. Ilustrasi bersifat geometris dan tenang. Garis dan tekstur halus (grain SVG sangat ringan, opsional).

### 6.4 Pola generatif (pengganti foto)
Dibuat dengan kode (`src/patterns/generate.js`), menghasilkan elemen SVG. **Terinspirasi** gaya tenun dan batik secara umum; **bukan** reproduksi motif suku/daerah tertentu dan tidak boleh diberi klaim asal daerah tertentu.

| `jenis_kode` | Motif geometris | Warna |
|---|---|---|
| `kerajinan` | Belah ketupat berlapis (diamond) pada kisi | `--jenis-kerajinan` |
| `seni` | Lingkaran bersinggungan membentuk kelopak empat | `--jenis-seni` |
| `lisan` | Gelombang/garis bergelombang bertumpuk | `--jenis-lisan` |
| `pengetahuan` | Segitiga berjajar (tumpal) | `--jenis-pengetahuan` |
| `adat` | Zig-zag/chevron berulang | `--jenis-adat` |
| Cagar Budaya (semua) | Garis tegas bata/persegi bertingkat | `--jenis-cagar` |

Aturan:
- Variasi **deterministik** per rekaman: seed dari `id` (hash sederhana) mengatur skala, rotasi (0/90°), dan fase motif, sehingga kartu tidak identik tetapi stabil di setiap kunjungan.
- Pola ringan: gunakan `<pattern>` + beberapa elemen, bukan ribuan node. Target < 2 KB markup per kartu; gunakan `<use>` bila bisa.
- Pola arsir untuk "belum tercatat" memakai garis diagonal netral (`--garis`), berbeda tegas dari motif jenis.
- `aria-hidden="true"` untuk pola dekoratif.

### 6.5 Ikon
SVG inline kecil buatan sendiri (panah, tutup, cari, daftar, bagikan, stempel). Tanpa library ikon besar.

---

## 7. Animasi (GSAP + ScrollTrigger)

### 7.1 Prinsip
- Animasi harus **membantu memahami data**, bukan pamer. Setiap animasi menjawab: "apa yang perlu dilihat pengguna?".
- Hanya animasikan `transform`, `opacity`, dan atribut SVG ringan (`fill`, `stroke-dashoffset`). Hindari menganimasikan `width/height/top/left` dan `filter` berat.
- Total durasi satu urutan tidak lebih dari ±2,5 detik; pengguna tidak boleh menunggu animasi untuk membaca.
- Semua animasi dibungkus `gsap.matchMedia()`:
  - `(prefers-reduced-motion: reduce)` → **tanpa pin, tanpa gerak**: tampilkan keadaan akhir langsung, hitung angka langsung ke nilai akhir.
  - `(max-width: 768px)` → kurangi jumlah elemen beranimasi, hindari parallax.
- Bersihkan `ScrollTrigger` saat perlu (`ScrollTrigger.refresh()` setelah font dan data siap dan saat ukuran berubah).

### 7.2 Katalog animasi

| ID | Di mana | Efek | Durasi / easing |
|---|---|---|---|
| A-01 | S1 H1 | Muncul per baris (yPercent 100 → 0 dalam wadah overflow hidden) | 0,9 s, `power3.out`, stagger 0,12 |
| A-02 | S1 siluet peta | Fade-in opacity 0 → 0,35 | 1,6 s, `power1.out` |
| A-03 | S2 provinsi menyala | Fill dari `--malam-2` ke warna jenis, urut barat → timur | 0,6 s tiap provinsi, stagger 0,04 |
| A-04 | S2 penghitung | Count-up 0 → total, format `Intl.NumberFormat('id-ID')` | 1,6 s, `power2.out` |
| A-05 | S3 waffle | Kotak menyala berurutan | 0,02 s stagger, total ≤ 1,2 s |
| A-06 | S3 bar top-5 | `scaleX` 0 → 1 dari kiri | 0,8 s, `power3.out`, stagger 0,1 |
| A-07 | S4 meredup & arsir | Provinsi berdata opacity → 0,35; garis tepi provinsi arsir muncul | 0,8 s |
| A-08 | S4 denyut lembut | Opacity arsir 0,7 ↔ 1 | 2,4 s, `sine.inOut`, ulang tak hingga (dimatikan di ponsel dan reduced motion) |
| A-09 | S6 kartu masuk | `y: 40 → 0`, `opacity: 0 → 1`, ScrollTrigger `start: "top 85%"` | 0,7 s, stagger 0,1 |
| A-10 | Panel provinsi | Geser masuk dari kanan (desktop) / naik dari bawah (ponsel) | 0,45 s, `power3.out` |
| A-11 | Stempel Paspor | Skala 1,4 → 1 + rotasi −8° → 0, bunyi tidak diperlukan | 0,5 s, `back.out(1.6)` |
| A-12 | Transisi bagian | Tidak ada transisi halaman berat; hanya scroll mulus bawaan CSS `scroll-behavior: smooth` (dimatikan saat reduced motion) | – |

### 7.3 Pola S2 (peta menyala)
- Desktop: bagian dipasangi `ScrollTrigger` dengan `pin: true`, panjang scroll ≈ 3 layar. Satu *timeline* ber-`scrub: 0.5` menggerakkan A-03, A-04, dan pergantian langkah teks. Tanpa `snap` agar tidak terasa "menyeret".
- Ponsel: peta ditempel (`position: sticky; top: 0`) tinggi ±55vh; teks langkah di bawah dan memicu animasi lewat `onEnter`, bukan `scrub`, agar ringan.

### 7.4 Kinerja animasi
Gunakan `will-change: transform` hanya pada elemen yang sedang dianimasikan dan lepaskan setelah selesai. Jangan menganimasikan 38 provinsi dengan `filter: drop-shadow`. Pantau FPS; jika turun di bawah 50 pada ponsel kelas menengah (diuji pengguna), sederhanakan.

---

## 8. Paspor Budaya dan Kuis

### 8.1 Paspor Budaya
- **Mekanik:** membuka panel provinsi (dari peta, chips, atau daftar) memberi satu **stempel** provinsi itu. Total 38 stempel. Dua jenis: stempel biasa (provinsi berdata) dan **stempel "Penjaga Cerita"** (diberikan ketika pengguna membuka provinsi `belum_tercatat` lalu menekan "Tandai: aku peduli").
- **Tampilan:** kisi 38 petak kecil; yang sudah didapat berwarna dan memperlihatkan stempel; yang belum berupa garis putus-putus. Bar progres "{n} dari 38 provinsi dijelajahi".
- **Desain stempel:** SVG bundar dengan nama provinsi (melingkar atau di tengah), pola generatif deterministik dari `kode` (6.4), tepi bergerigi halus. Tidak memakai lambang resmi, logo daerah, atau bendera.
- **Penyimpanan:** `localStorage` kunci `atlasbudaya:paspor:v1` (JSON: `{ "13": { "t": 1760000000000, "jenis": "biasa" } }`). **Wajib** dibungkus `try/catch`; jika gagal (mode privat, diblokir), pakai memori sementara dan tampilkan catatan kecil "Progres tidak tersimpan di perangkat ini".
- **Selesai 38/38:** toast perayaan sederhana (tanpa konfeti berat) dan ajakan ke S8.
- **Reset:** tombol "Mulai ulang paspor" dengan konfirmasi.

### 8.2 Kuis
- 8 pertanyaan per sesi, dibuat otomatis dari `budaya.clean.json` dan `statistik.json`. Acak urutan dan pilihan; jangan ada pengulangan objek.
- **Aturan sumber soal (agar adil dan tidak menyesatkan):**
  - Hanya rekaman dengan `kelas_konten` ∈ {`unggulan`, `pendek`}, `jumlah_lokasi = 1`, dan **nama unik** di seluruh data (tidak ada nama yang sama di provinsi lain).
  - Klasifikasi jenis adalah klasifikasi **SPKT**. Pertanyaan jenis harus diawali "Menurut SPKT, …".

| Tipe | Contoh | Pilihan |
|---|---|---|
| A. Asal provinsi | "{nama_tampil} tercatat dari provinsi mana?" (tampilkan `ringkasan` sebagai petunjuk) | 4 provinsi (1 benar + 3 acak yang berdata) |
| B. Jenis OPK | "Menurut SPKT, {nama_tampil} dikategorikan sebagai…" | 4 dari 5 jenis OPK |
| C. Fakta data | "Provinsi mana yang punya catatan OPK terbanyak?" / "Berapa provinsi yang belum tercatat di SPKT?" | 3–4 opsi dihitung dari data |

- Proporsi: 4 tipe A, 3 tipe B, 1 tipe C.
- **Umpan balik per soal:** benar/salah + satu kalimat penjelasan (dari `ringkasan`) + tombol "Lihat di peta" (membuka provinsinya). Teks salah harus ramah ("Hampir! Ini tercatat dari {provinsi}.").
- **Layar hasil:** skor, kalimat umpan balik netral, 3 tradisi yang baru ditemui (tautan ke kartu), tombol "Main lagi" dan "Bagikan".
- Aksesibel: pilihan sebagai `<button>` atau `radio`, fokus berpindah ke umpan balik, tidak bergantung pada warna benar/salah saja (ikon dan teks).
- Tidak ada papan skor daring, tidak ada pengiriman data keluar.

---

## 9. Aksesibilitas (target WCAG 2.1 AA)

- `<html lang="id">`, satu `<h1>`, hierarki heading berurutan, landmark (`header`, `nav`, `main`, `section` dengan `aria-labelledby`, `footer`).
- Kontras teks ≥ 4,5:1 (teks besar ≥ 3:1). Periksa semua token di 6.1 dan teks di atas pola.
- Semua fungsi bisa dioperasikan dengan keyboard; fokus selalu terlihat; urutan tab logis; tidak ada *keyboard trap* kecuali dialog (yang mengelola fokus dengan benar).
- Peta: lihat 5.1 dan 4.6 (tabel alternatif).
- Angka yang menghitung naik: elemen visual `aria-hidden="true"`, sediakan teks statis dengan nilai akhir untuk pembaca layar. Hindari `aria-live` yang membaca setiap pertambahan.
- Informasi tidak boleh hanya dibedakan lewat warna (gunakan teks, ikon, atau pola).
- Target sentuh ≥ 44×44 px untuk kontrol utama.
- `prefers-reduced-motion` dihormati penuh (7.1). Tidak ada konten berkedip > 3 kali/detik.
- Teks dapat diperbesar sampai 200% tanpa kehilangan fungsi.
- Gambar/elemen dekoratif `aria-hidden`; elemen informatif punya teks alternatif.

---

## 10. Performa dan responsif

**Anggaran:**
- Muat awal (HTML + CSS + JS + data awal + font) **< 1,5 MB**; JS awal gzip < 150 KB tidak termasuk three.js (yang dimuat dinamis hanya jika Fase 9 dikerjakan).
- LCP < 2,5 s pada 4G sedang; tidak ada layout shift berarti (CLS < 0,1).
- `budaya.clean.json` dimuat setelah idle atau saat Jelajah mendekati viewport; tampilkan *skeleton* pada kartu saat menunggu.
- Pecah kode: modul kuis/paspor/dialog dimuat dinamis (`import()`).
- Font: subset Latin, hanya bobot yang dipakai.
- Hindari render semua kartu sekaligus: tampilkan bertahap (maks 12 per provinsi, "Muat lebih banyak").

**Breakpoint (mobile-first):** 360, 480, 768, 1024, 1280.
- Tidak boleh ada scroll horizontal pada 360 px.
- Panel provinsi: *bottom sheet* ≤ 768 px, panel samping > 768 px.
- Peta memakai `viewBox` dan `preserveAspectRatio` agar skala otomatis.
- Teks fluid dengan `clamp()`.
- Uji orientasi lanskap ponsel (tinggi pendek) untuk S2 (pin).

**Ketahanan:**
- Jika data gagal dimuat: pesan ramah berbahasa Indonesia + tombol "Coba lagi"; situs tidak boleh layar putih.
- Jika JavaScript animasi gagal: konten tetap terbaca (progressive enhancement; keadaan akhir adalah default CSS, animasi memulai dari keadaan awal lewat JS).
- Tanpa dependensi internet saat demo (font dan data lokal).

---

## 11. SEO, berbagi, dan rilis

- `<title>`: "{NAMA_SITUS} — Berapa banyak budaya Indonesia yang sudah tercatat?" (≤ 60 karakter bila memungkinkan).
- `meta description` ±150 karakter yang jujur dan menarik.
- Open Graph dan Twitter Card (`og:title`, `og:description`, `og:image` 1200×630, `og:locale = id_ID`). Gambar OG dibuat dari desain situs (agent menulis HTML/SVG-nya; **pengguna** mengambil tangkapan layar atau mengekspor PNG karena agent tidak membuat gambar raster).
- `favicon` SVG sederhana (belah ketupat emas).
- Rilis statis: `npm run build` → folder `dist`. Pengaturan `base` di `vite.config.js` mengikuti hosting (tanyakan pengguna: Netlify/Vercel/GitHub Pages).
- Tambahkan `robots.txt` dan `sitemap` sederhana bila hosting memerlukannya.
- Tidak ada analytics atau pelacak pihak ketiga kecuali pengguna meminta.

---

## 12. Gaya tulisan (copywriting)

- Suara: hangat, jujur, tenang, tidak menggurui. Kalimat pendek. Gunakan "kamu" (bukan "Anda") kecuali pengguna meminta formal.
- Hindari klise ("Indonesia kaya akan budaya!" tanpa data), kata hiperbolis ("luar biasa", "mengejutkan"), dan nada menyalahkan daerah/instansi.
- Angka: format Indonesia (`1.234`, desimal koma `17,3%`), selalu kaitkan dengan tanggal pengambilan bila berupa statistik.
- Sebut istilah resmi pada kali pertama: "Objek Pemajuan Kebudayaan (OPK)" dengan penjelasan satu kalimat; setelah itu boleh singkat.
- Gunakan nama pendek jenis (tabel 4.1 `DATA_SPEC.md`) di UI, nama lengkap di dialog detail.
- Jangan menerjemahkan atau "memperbaiki" deskripsi sumber.
- Semua teks tampil dikelola di satu berkas (`src/content/teks.js`) agar mudah disunting pengguna tanpa menyentuh logika.

---

## 13. Struktur kode `web/src`

```
src/
├─ main.js                  # titik masuk, inisialisasi bagian
├─ config.js                # NAMA_SITUS, path data, flag fitur (opsional 3D)
├─ content/teks.js          # semua teks UI & narasi
├─ data/
│  ├─ loader.js             # muat JSON bertahap, cache, penanganan error
│  └─ tetangga.js           # (opsional) provinsi bertetangga, hanya jika akurat
├─ map/
│  ├─ projection.js
│  ├─ render.js             # gambar path, pola arsir, hit-circle
│  ├─ scales.js             # skala sqrt & warna jenis
│  └─ interactions.js       # hover, fokus, klik, keyboard, zoom
├─ sections/                # hero, nyala, konsentrasi, gelap, jelajah, kisah, paspor, kuis, penutup
├─ ui/                      # panel, dialog, kartu, chips, tabel-daftar, toast, nav
├─ patterns/generate.js     # pola generatif SVG (6.4) + stempel
├─ features/
│  ├─ paspor.js             # logika stempel + localStorage aman
│  └─ kuis.js               # pembuat soal dari data
├─ util/
│  ├─ format.js             # Intl id-ID, persen, tanggal
│  ├─ teks.js               # pemecah kalimat aman singkatan, normalisasi pencarian
│  ├─ hash.js               # seed deterministik dari id
│  ├─ a11y.js               # fokus dialog, aria-live, skip link
│  └─ motion.js             # gsap.matchMedia, helper reduced motion
└─ styles/                  # tokens, base, layout, components, sections
```

Aturan kode: modul kecil dan fokus, tanpa variabel global, tanpa `innerHTML` dari data tak tepercaya (gunakan `textContent`/pembuat elemen, karena deskripsi berasal dari sumber luar), tanpa `console.log` tersisa di rilis.

Pencarian: normalisasi (huruf kecil, hapus diakritik via `normalize('NFD')`), cocokkan pada `nama_tampil`, kabupaten, provinsi, jenis; *debounce* 200 ms; sorot hasil; batasi 30 hasil.

---

## 14. Daftar uji manual (dijalankan pengguna di akhir tiap fase web)

**Fungsi**
- [ ] Semua 38 provinsi bisa diklik/difokus dan membuka panel yang benar
- [ ] 10 provinsi belum tercatat menampilkan keadaan kosong yang jujur (4.5)
- [ ] Angka di S2–S4 sama dengan `statistik.json`
- [ ] Pencarian, filter, dan "Muat lebih banyak" bekerja
- [ ] Dialog detail: Esc, fokus kembali, deskripsi sangat panjang (OKOKAN ±26 ribu karakter) tetap lancar
- [ ] Paspor menyimpan dan memuat ulang setelah refresh; berfungsi saat penyimpanan diblokir
- [ ] Kuis menghasilkan 8 soal tanpa duplikat dan hasilnya benar

**Tampilan**
- [ ] 360, 390, 768, 1024, 1440 px tanpa scroll horizontal dan tanpa teks terpotong
- [ ] Peta terbaca di ponsel, provinsi kecil (Jakarta, Yogyakarta, Banten, Bali) bisa disentuh
- [ ] Mode gelap/terang elemen teks tetap kontras

**Gerak & aksesibilitas**
- [ ] Aktifkan "Kurangi gerakan" di sistem: tidak ada pin/animasi, keadaan akhir tampil
- [ ] Navigasi hanya dengan keyboard sampai ke kuis dan paspor
- [ ] Pembaca layar (mis. NVDA/TalkBack) membaca nama provinsi + jumlah dengan benar

**Kinerja & ketahanan**
- [ ] Throttling "Slow 4G" di DevTools: halaman tetap dapat dipakai
- [ ] Matikan jaringan setelah dimuat: situs tetap berfungsi (data lokal, font lokal)
- [ ] Hapus file data sementara: muncul pesan error ramah, bukan layar putih
- [ ] Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95

---

## 15. Opsional (Fase 9): sentuhan 3D

Hanya jika pengguna meminta. Syarat:
- Satu elemen kecil di S1: globe sederhana atau titik-titik cahaya berbentuk Indonesia, murni kode Three.js (tanpa aset eksternal), dimuat dengan `import()` hanya di perangkat yang mampu.
- Cek `window.matchMedia('(prefers-reduced-motion: reduce)')` dan kemampuan WebGL; jika gagal atau perangkat lemah, tampilkan versi 2D (A-02).
- Batasi `devicePixelRatio` maksimum 1,5, hentikan render saat tab tidak aktif atau elemen di luar layar.
- Tidak menggantikan peta SVG; hanya aksen pembuka.
