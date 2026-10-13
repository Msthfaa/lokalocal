# Laporan Sumber & Validasi Aset Peta (GeoJSON 38 Provinsi) — Fase 3

## 1. Sumber Data & Lisensi

- **Nama Repositori:** `denyherianto/indonesia-geojson-topojson-maps-with-38-provinces`
- **URL Repositori:** https://github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces
- **URL Berkas Mentah:** `https://raw.githubusercontent.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces/main/GeoJSON/indonesia-38-provinces.geojson`
- **Tanggal Akses:** 2026-10-13
- **Lisensi Data:** **Creative Commons Attribution 4.0 International (CC BY 4.0)** (`DATA_LICENSE.md`) & **MIT License** (`LICENSE`).
- **Atribusi Peta:** Batas provinsi Indonesia (38 provinsi) oleh Deny Herianto (CC BY 4.0).

---

## 2. Pemrosesan & Penyederhanaan (`tools/build-geo.mjs`)

1. **Pencocokan Kode & Nama Resmi:**
   - Setiap fitur dicocokkan terhadap Tabel Referensi 38 Provinsi Kemendagri/BPS pada `DATA_SPEC.md` Bagian 3.
   - Properti distandardisasi menjadi `{ kode, nama, pusat, bbox }` dan `id` fitur disamakan dengan `kode` (2 digit).
   - Catatan penyesuaian kode: pada sumber asli bila kode 4 DOB Papua menggunakan urutan BPS berbeda, skrip memetakan secara eksplisit ke kode resmi Kemendagri di `DATA_SPEC.md` (`93` Papua Selatan, `94` Papua Tengah, `95` Papua Pegunungan, `96` Papua Barat Daya).
2. **Presisi Geometri & Ukuran Berkas:**
   - Koordinat dibulatkan ke 4 angka desimal ($approx 11$ meter di ekuator) tanpa menghapus poligon pulau kecil.
   - **Ukuran berkas akhir:** **56.5 KB** (57.819 byte) — jauh di bawah batas anggaran **< 300 KB**.
3. **Titik Tengah Kabupaten (Opsional 8.2):**
   - Dilewati sesuai panduan `DATA_SPEC.md` 8.2 (*"Jika tidak ada sumber yang andal, lewati. Web tetap berfungsi dengan peta provinsi"*). Sebagai gantinya, setiap provinsi telah dilengkapi koordinat `pusat` daratan utamanya untuk pengurutan animasi barat-ke-timur (A-03) dan penempatan lingkaran sentuh (*hit-circle*) provinsi kecil.

---

## 3. Hasil Validasi Geometri & Pencocokan 38 Provinsi

- **Jumlah Fitur:** **38** fitur (`Polygon` / `MultiPolygon`)
- **Kecocokan dengan `public/data/clean/provinsi.json`:** **100% cocok (38/38 provinsi)**
- **Fitur di luar kotak batas Indonesia (lat -11,5..6,5; lng 94..142):** **0**

| Kode Resmi | Nama Resmi (`DATA_SPEC.md`) | Kode Sumber | Nama Sumber | Jml Poligon | Jml Titik | Titik Pusat `[lng, lat]` |
|---|---|---|---|---|---|---|
| `11` | Aceh | `11` | Aceh | 4 | 54 | `[97.3025, 3.9784]` |
| `12` | Sumatera Utara | `12` | Sumatera Utara | 5 | 62 | `[99.1098, 2.3479]` |
| `13` | Sumatera Barat | `13` | Sumatera Barat | 5 | 66 | `[100.5696, -0.4111]` |
| `14` | Riau | `14` | Riau | 8 | 98 | `[101.5302, 0.6214]` |
| `15` | Jambi | `15` | Jambi | 1 | 33 | `[102.6152, -1.7566]` |
| `16` | Sumatera Selatan | `16` | Sumatera Selatan | 2 | 66 | `[104.0557, -3.1404]` |
| `17` | Bengkulu | `17` | Bengkulu | 2 | 38 | `[102.5369, -3.5762]` |
| `18` | Lampung | `18` | Lampung | 1 | 26 | `[104.8372, -4.9585]` |
| `19` | Kepulauan Bangka Belitung | `19` | Kepulauan Bangka Belitung | 4 | 47 | `[105.9346, -2.2258]` |
| `21` | Kepulauan Riau | `21` | Kepulauan Riau | 14 | 80 | `[108.2014, 3.8467]` |
| `31` | DKI Jakarta | `31` | DKI Jakarta | 1 | 6 | `[106.8008, -6.1848]` |
| `32` | Jawa Barat | `32` | Jawa Barat | 1 | 32 | `[107.6353, -6.8329]` |
| `33` | Jawa Tengah | `33` | Jawa Tengah | 2 | 47 | `[110.3053, -7.2992]` |
| `34` | DI Yogyakarta | `34` | Daerah Istimewa Yogyakarta | 1 | 9 | `[110.4122, -7.8337]` |
| `35` | Jawa Timur | `35` | Jawa Timur | 6 | 65 | `[112.5042, -7.8138]` |
| `36` | Banten | `36` | Banten | 2 | 26 | `[106.1171, -6.4196]` |
| `51` | Bali | `51` | Bali | 2 | 15 | `[115.0297, -8.4654]` |
| `52` | Nusa Tenggara Barat | `52` | Nusa Tenggara Barat | 4 | 57 | `[118.1162, -8.6113]` |
| `53` | Nusa Tenggara Timur | `53` | Nusa Tenggara Timur | 14 | 154 | `[121.4803, -8.5676]` |
| `61` | Kalimantan Barat | `61` | Kalimantan Barat | 7 | 120 | `[111.0811, 0.0087]` |
| `62` | Kalimantan Tengah | `62` | Kalimantan Tengah | 1 | 70 | `[113.4305, -1.484]` |
| `63` | Kalimantan Selatan | `63` | Kalimantan Selatan | 3 | 41 | `[115.614, -2.5866]` |
| `64` | Kalimantan Timur | `64` | Kalimantan Timur | 8 | 119 | `[116.2146, 0.3806]` |
| `65` | Kalimantan Utara | `65` | Kalimantan Utara | 6 | 93 | `[116.4916, 2.9206]` |
| `71` | Sulawesi Utara | `71` | Sulawesi Utara | 5 | 42 | `[124.2992, 1.0373]` |
| `72` | Sulawesi Tengah | `72` | Sulawesi Tengah | 7 | 126 | `[121.081, -0.7364]` |
| `73` | Sulawesi Selatan | `73` | Sulawesi Selatan | 5 | 61 | `[120.2418, -3.5761]` |
| `74` | Sulawesi Tenggara | `74` | Sulawesi Tenggara | 8 | 91 | `[122.0101, -3.8292]` |
| `75` | Gorontalo | `75` | Gorontalo | 1 | 21 | `[122.3534, 0.6842]` |
| `76` | Sulawesi Barat | `76` | Sulawesi Barat | 1 | 29 | `[119.3429, -2.3386]` |
| `81` | Maluku | `81` | Maluku | 34 | 231 | `[129.0791, -3.2501]` |
| `82` | Maluku Utara | `82` | Maluku Utara | 13 | 113 | `[128.016, 0.8153]` |
| `91` | Papua | `91` | Papua | 5 | 96 | `[138.5503, -3.0686]` |
| `92` | Papua Barat | `92` | Papua Barat | 9 | 139 | `[133.6938, -2.8665]` |
| `93` | Papua Selatan | `91` | Papua Selatan | 5 | 89 | `[139.1308, -6.1436]` |
| `94` | Papua Tengah | `91` | Papua Tengah | 1 | 57 | `[136.5794, -3.5772]` |
| `95` | Papua Pegunungan | `91` | Papua Pegunungan | 1 | 66 | `[139.2234, -4.1226]` |
| `96` | Papua Barat Daya | `92` | Papua Barat Daya | 8 | 88 | `[132.1801, -1.4154]` |
