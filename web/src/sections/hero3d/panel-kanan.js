/**
 * panel-kanan.js — Floating Side Card & Modal Eksplorasi 3 Zona untuk Jelajah 3D
 * Sesuai arahan pengguna:
 * 1. Mode Compact: Ringkasan secuil di kanan layar dengan tombol "Buka Detail Budaya".
 * 2. Mode Expanded: Layar terbagi 3 Zona Spektakuler:
 *    - Zona Kiri (Biru): Keping Piece Provinsi Zoom-In Top-Down (Aerial View SVG) & Pembagian Wilayah Kota/Kabupaten.
 *    - Zona Tengah (Merah): Galeri Kartu Budaya (Style Gambar 2) dengan foto Unsplash, tipografi mewah, dan animasi meluncur turun dari atas.
 *    - Zona Kanan (Kuning): Analisis Kategori, Peringkat Nasional, Refleksi Data SPKT, dan Paspor Budaya.
 */

import { WARNA_JENIS_HEX } from '../../map/scales.js';
import { formatAngka } from '../../util/format.js';
import { normalisasiPencarian } from '../../util/teks.js';
import { dapatkanGambarBudaya } from '../../data/gambar-budaya.js';
import { buatSvgPieceProvinsi } from '../../map/render-piece.js';
import { dapatkanChibiProvinsi } from '../../features/chibi.js';
import { ikonPaspor, ikonCentang, ikonCari, ikonKompas } from '../../ui/ikon.js';

/**
 * Membuat komponen Floating Card & Detail 3 Zona untuk Jelajah 3D
 *
 * @param {object} parameter
 * @param {HTMLElement} parameter.wadahEl - Wadah elemen (#s5-peta-wadah)
 * @param {object} [parameter.geoProvinsi] - FeatureCollection GeoJSON 38 provinsi
 * @param {(rekaman: object, pemicuEl: HTMLElement) => void} [parameter.onBukaDetailRekaman]
 * @param {(kode: string, jenis: string) => void} [parameter.onCatatStempel]
 * @param {(kode: string) => Array} [parameter.ambilBudayaProvinsi]
 * @returns {object} API kontrol panel
 */
export function buatPanelKanan({
  wadahEl,
  geoProvinsi,
  onBukaDetailRekaman,
  onCatatStempel,
  ambilBudayaProvinsi,
  onBukaModeDetail
}) {
  // Buat elemen DOM kontainer Floating Card
  const elKartu = document.createElement('aside');
  elKartu.className = 'jelajah-kartu-kanan is-tersembunyi';
  elKartu.setAttribute('role', 'region');
  elKartu.setAttribute('aria-label', 'Panel Eksplorasi Wilayah Budaya');

  // Cegah interaksi di dalam kartu bocor ke canvas 3D di belakangnya
  elKartu.addEventListener('pointerdown', (e) => e.stopPropagation());
  elKartu.addEventListener('pointerup', (e) => e.stopPropagation());
  elKartu.addEventListener('click', (e) => e.stopPropagation());

  wadahEl.appendChild(elKartu);

  // State internal
  let provinsiAktif = null;
  let statusMode = 'compact'; // 'compact' | 'expanded'
  let kataKunciCari = '';
  let filterJenisAktif = 'semua';
  let filterKabupatenAktif = ''; // filter kota/kabupaten terpilih di zona kiri
  let stempelTerkumpulMap = new Set();

  /**
   * Menampilkan kartu untuk provinsi tertentu
   * @param {object} provData - Data provinsi dari provinsi.json
   * @param {'compact'|'expanded'} [modeAwal='compact']
   */
  function tampilkan(provData, modeAwal = 'compact') {
    if (!provData) return;

    provinsiAktif = provData;
    statusMode = modeAwal;
    kataKunciCari = '';
    filterJenisAktif = 'semua';
    filterKabupatenAktif = '';

    render();

    elKartu.classList.remove('is-tersembunyi');
    elKartu.classList.add('is-muncul');
    elKartu.classList.toggle('is-expanded', statusMode === 'expanded');
    elKartu.classList.toggle('is-compact', statusMode === 'compact');
  }

  /**
   * Menyembunyikan kartu
   */
  function sembunyikan() {
    provinsiAktif = null;
    statusMode = 'compact';
    elKartu.classList.remove('is-muncul', 'is-expanded');
    elKartu.classList.add('is-tersembunyi');
  }

  /**
   * Melebarkan kartu ke Mode Eksplorasi 3 Zona (Kiri - Tengah - Kanan)
   */
  function perluas() {
    statusMode = 'expanded';
    filterKabupatenAktif = '';
    elKartu.classList.remove('is-compact');
    elKartu.classList.add('is-expanded');
    render();
  }

  /**
   * Mengembalikan kartu ke mode compact ("secuil")
   */
  function ciutkan() {
    statusMode = 'compact';
    filterKabupatenAktif = '';
    elKartu.classList.remove('is-expanded');
    elKartu.classList.add('is-compact');
    render();
  }

  /**
   * Render isi kartu sesuai state saat ini
   */
  function render() {
    if (!provinsiAktif) return;

    const p = provinsiAktif;
    const adalahKosong = p.status_data === 'belum_tercatat' || (p.total || 0) === 0;
    const warnaJenis = WARNA_JENIS_HEX[p.jenis_dominan] || '#E6B14A';
    const sudahStempel = stempelTerkumpulMap.has(String(p.kode));

    // Data karya budaya lokal dari budaya.clean.json
    let daftarTradisi = [];
    if (typeof ambilBudayaProvinsi === 'function') {
      daftarTradisi = ambilBudayaProvinsi(String(p.kode)) || [];
    }

    // Filter tradisi (pencarian teks + kategori + kabupaten aktif)
    const tradisiTerfilter = daftarTradisi.filter((item) => {
      if (filterJenisAktif !== 'semua' && item.jenis !== filterJenisAktif) {
        return false;
      }
      if (filterKabupatenAktif && item.kabupaten_nama !== filterKabupatenAktif) {
        return false;
      }
      if (kataKunciCari) {
        const cariNorm = normalisasiPencarian(kataKunciCari);
        const namaNorm = normalisasiPencarian(item.nama || '');
        const kabNorm = normalisasiPencarian(item.kabupaten_nama || '');
        if (!namaNorm.includes(cariNorm) && !kabNorm.includes(cariNorm)) {
          return false;
        }
      }
      return true;
    });

    // Susun daftar Kota & Kabupaten kontributor
    let daftarKabupaten = [];
    if (Array.isArray(p.kabupaten_teratas) && p.kabupaten_teratas.length > 0) {
      daftarKabupaten = p.kabupaten_teratas;
    } else if (daftarTradisi.length > 0) {
      const mapKab = new Map();
      for (const t of daftarTradisi) {
        const namaK = t.kabupaten_nama || 'Kabupaten Belum Terdata';
        mapKab.set(namaK, (mapKab.get(namaK) || 0) + 1);
      }
      daftarKabupaten = Array.from(mapKab.entries())
        .map(([nama, jumlah]) => ({ nama, jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah);
    }

    // Susun rincian komposisi 5 OPK + Cagar Budaya
    const perJenis = p.per_jenis_opk || {};
    const daftarKategori = [
      { kode: 'kerajinan', nama: 'Kerajinan', jml: perJenis.kerajinan || 0, warna: WARNA_JENIS_HEX.kerajinan },
      { kode: 'seni', nama: 'Seni Pertunjukan', jml: perJenis.seni || 0, warna: WARNA_JENIS_HEX.seni },
      { kode: 'lisan', nama: 'Tradisi Lisan', jml: perJenis.lisan || 0, warna: WARNA_JENIS_HEX.lisan },
      { kode: 'pengetahuan', nama: 'Pengetahuan', jml: perJenis.pengetahuan || 0, warna: WARNA_JENIS_HEX.pengetahuan },
      { kode: 'adat', nama: 'Adat Ritus', jml: perJenis.adat || 0, warna: WARNA_JENIS_HEX.adat },
      { kode: 'cagar', nama: 'Cagar Budaya', jml: p.total_cagar_budaya || 0, warna: WARNA_JENIS_HEX.cagar }
    ].filter((k) => k.jml > 0);

    // Ambil fitur GeoJSON provinsi terpilih untuk visualisasi piece top-down di Zona Kiri
    let fiturGeoProv = null;
    if (geoProvinsi && Array.isArray(geoProvinsi.features)) {
      fiturGeoProv = geoProvinsi.features.find(
        (f) => String(f.properties?.kode) === String(p.kode)
      );
    }

    const chibiProv = dapatkanChibiProvinsi(p.kode);

    if (statusMode === 'compact') {
      // ==========================================
      // 1. TAMPILAN COMPACT ("SECUIL SAJA" DI KANAN)
      // ==========================================
      elKartu.innerHTML = `
        <div class="kartu-kanan-compact-inner">
          <header class="kartu-kanan-header">
            <div class="kartu-kanan-header-kiri">
              <div class="kartu-chibi-avatar-badge" title="Duta Budaya: ${chibiProv.nama} (${chibiProv.suku})">
                <img src="${adalahKosong ? chibiProv.kaget : chibiProv.senang}" alt="${chibiProv.nama}" class="kartu-chibi-img" />
              </div>
              <div class="kartu-kanan-judul-blok">
                <span class="kartu-badge-kode" style="color: ${warnaJenis};">
                  PROVINSI ${p.kode} &bull; ${chibiProv.suku}
                </span>
                <h3 class="kartu-nama-prov">${p.nama}</h3>
              </div>
            </div>
            <button type="button" class="kartu-tombol-tutup" aria-label="Tutup kartu">&times;</button>
          </header>

          <div class="kartu-compact-status ${adalahKosong ? 'is-kosong' : 'is-ada'}">
            ${
              adalahKosong
                ? `<span class="kartu-titik-status is-kosong"></span>
                   <span>Belum tercatat di SPKT (Menanti Pendataan)</span>`
                : `<span class="kartu-titik-status is-ada"></span>
                   <div>
                     <strong class="kartu-angka-total">${formatAngka(p.total)}</strong>
                     <span class="kartu-teks-status">Catatan Budaya ${p.peringkat_total ? `&bull; #${p.peringkat_total} Nasional` : ''}</span>
                   </div>`
            }
          </div>

          ${
            !adalahKosong && daftarKategori.length > 0
              ? `
            <div class="kartu-compact-chips">
              ${daftarKategori
                .slice(0, 3)
                .map(
                  (k) => `
                <span class="kartu-chip-mini">
                  <span class="kartu-chip-dot" style="background-color: ${k.warna};"></span>
                  ${k.nama} <strong>${k.jml}</strong>
                </span>
              `
                )
                .join('')}
              ${daftarKategori.length > 3 ? `<span class="kartu-chip-mini">+${daftarKategori.length - 3} lainnya</span>` : ''}
            </div>
          `
              : ''
          }

          ${
            adalahKosong
              ? `
            <div class="kartu-chibi-pesan-sosial">
              <p><strong>${chibiProv.nama}:</strong> “Budaya di ${p.nama} sangat kaya, namun belum tercatat di SPKT. Yuk kita sama-sama dorong pencatatannya!”</p>
            </div>
            <p class="kartu-catatan-refleksi">
              Belum tercatat di SPKT bukan berarti tidak memiliki budaya. Pendataan resmi masih terus berlanjut.
            </p>
          `
              : ''
          }

          <div class="kartu-compact-aksi">
            <button type="button" class="kartu-btn-perluas" aria-label="Buka rincian lengkap budaya provinsi ini">
              <span>Buka Detail Budaya</span>
              <span class="kartu-ikon-panah">&rarr;</span>
            </button>

            <button type="button" class="kartu-btn-paspor-mini ${sudahStempel ? 'is-terkumpul' : ''}" data-kode="${p.kode}" title="Kumpulkan stempel paspor">
              ${sudahStempel ? `${ikonCentang(13)} <span>Terkumpul</span>` : `${ikonPaspor(13)} <span>Stempel</span>`}
            </button>
          </div>
        </div>
      `;
    } else {
      // ==========================================
      // 2. TAMPILAN EXPANDED (3 ZONA IMERSIF LENGKAP)
      // ==========================================
      const pieceSvgHtml = fiturGeoProv
        ? buatSvgPieceProvinsi(fiturGeoProv, {
            lebar: 300,
            tinggi: 185,
            warna: warnaJenis,
            adalahKosong
          })
        : `<div class="piece-placeholder">Siluet wilayah provinsi</div>`;

      elKartu.innerHTML = `
        <div class="detail-3zona-container">
          <!-- Top Bar: Navigasi & Aksi Penutup -->
          <header class="detail-3zona-topbar">
            <div class="detail-topbar-kiri">
              <span class="detail-topbar-badge" style="background-color: ${warnaJenis}22; color: ${warnaJenis}; border: 1px solid ${warnaJenis}55;">
                PROVINSI ${p.kode}
              </span>
              <h2 class="detail-topbar-judul">${p.nama}</h2>
              ${
                p.peringkat_total
                  ? `<span class="detail-topbar-peringkat">Peringkat #${p.peringkat_total} Nasional</span>`
                  : ''
              }
            </div>

            <div class="detail-topbar-kanan">
              <button type="button" class="detail-btn-tutup-eksplorasi" title="Kembali ke Peta Indonesia" aria-label="Tutup detail provinsi">
                <span>&times; Kembali ke Peta</span>
              </button>
            </div>
          </header>

          <!-- 3 Kolom Utama (Kiri, Tengah, Kanan) -->
          <div class="detail-3zona-grid">
            
            <!-- ==========================================
                 ZONA KIRI: AERIAL PIECE & PEMBAGIAN WILAYAH
                 ========================================== -->
            <section class="zona-kolom zona-kolom--kiri" aria-label="Inspeksi Geografi dan Wilayah">
              <div class="zona-kepala">
                <span class="zona-nomor-chip">ZONA 1</span>
                <h3 class="zona-judul">Inspeksi Geografi &amp; Wilayah</h3>
              </div>

              <!-- Kartu Siluet Keping Provinsi (Zoom-In Top-Down) -->
              <div class="zona-kiri-piece-wadah">
                ${pieceSvgHtml}
                <div class="zona-kiri-piece-meta">
                  <span>Kontur Daratan Top-Down</span>
                  <span>Kode BPS: ${p.kode}</span>
                </div>
              </div>

              <!-- Pembagian Wilayah Kota & Kabupaten -->
              <div class="zona-kiri-kab-blok">
                <div class="zona-subkepala">
                  <h4>Pembagian Kota &amp; Kabupaten</h4>
                  <span class="zona-subkepala-counter">${daftarKabupaten.length} Daerah</span>
                </div>

                ${
                  filterKabupatenAktif
                    ? `
                  <div class="zona-filter-aktif-bar">
                    <span>Menampilkan: <strong>${filterKabupatenAktif}</strong></span>
                    <button type="button" class="btn-reset-filter-kab" title="Tampilkan semua kota/kabupaten">&times; Hapus filter</button>
                  </div>
                `
                    : ''
                }

                <div class="zona-kiri-daftar-kab">
                  ${
                    daftarKabupaten.length > 0
                      ? daftarKabupaten
                          .map((kab) => {
                            const totalProv = p.total || 1;
                            const persen = Math.round((kab.jumlah / totalProv) * 100);
                            const aktif = filterKabupatenAktif === kab.nama;
                            return `
                        <button
                          type="button"
                          class="zona-kab-item ${aktif ? 'is-kab-selected' : ''}"
                          data-kab="${kab.nama}"
                          title="Klik untuk menyaring budaya dari ${kab.nama}"
                        >
                          <div class="zona-kab-nama-baris">
                            <span class="zona-kab-nama">${kab.nama}</span>
                            <span class="zona-kab-jumlah">${kab.jumlah} karya</span>
                          </div>
                          <div class="zona-kab-meter">
                            <div class="zona-kab-meter-fill" style="width: ${persen}%; background-color: ${warnaJenis};"></div>
                          </div>
                        </button>
                      `;
                          })
                          .join('')
                      : `
                    <div class="zona-state-kosong-sub">
                      <p>Belum ada rincian kabupaten/kota yang tercatat di SPKT.</p>
                    </div>
                  `
                  }
                </div>
              </div>
            </section>

            <!-- ==========================================
                 ZONA TENGAH: GALERI KARTU BUDAYA (STYLE GAMBAR 2)
                 ========================================== -->
            <section class="zona-kolom zona-kolom--tengah" aria-label="Galeri Koleksi Warisan Budaya">
              <div class="zona-kepala zona-kepala--tengah">
                <div>
                  <span class="zona-nomor-chip">ZONA 2</span>
                  <h3 class="zona-judul">Koleksi Warisan Budaya</h3>
                </div>
                <span class="zona-koleksi-counter">${tradisiTerfilter.length} dari ${daftarTradisi.length} Karya</span>
              </div>

              <!-- Bar Pencarian & Filter Kategori -->
              <div class="zona-tengah-filter-bar">
                <div class="zona-cari-wrapper">
                  <span class="zona-cari-ikon">${ikonCari(14)}</span>
                  <input
                    type="search"
                    class="zona-input-cari"
                    placeholder="Cari tradisi, tari, kuliner di ${p.nama}..."
                    value="${kataKunciCari}"
                    aria-label="Cari tradisi"
                  />
                </div>

                <select class="zona-select-kategori" aria-label="Filter kategori budaya">
                  <option value="semua" ${filterJenisAktif === 'semua' ? 'selected' : ''}>Semua Kategori (${daftarTradisi.length})</option>
                  ${daftarKategori
                    .map(
                      (k) => `
                    <option value="${k.kode}" ${filterJenisAktif === k.kode ? 'selected' : ''}>${k.nama} (${k.jml})</option>
                  `
                    )
                    .join('')}
                </select>
              </div>

              <!-- Feed Kartu Budaya (Animasi Meluncur Turun dari Atas) -->
              <div class="zona-tengah-feed-scroll" aria-live="polite">
                ${
                  tradisiTerfilter.length > 0
                    ? `
                  <div class="zona-kartu-grid">
                    ${tradisiTerfilter
                      .map((item, idx) => {
                        const fotoUrl = dapatkanGambarBudaya(item);
                        const warnaAksenJenis = WARNA_JENIS_HEX[item.jenis] || '#E6B14A';
                        const namaJenisLabel = (item.jenis_label || item.kategori || 'WARISAN BUDAYA').toUpperCase();

                        return `
                        <article
                          class="kartu-budaya-modern"
                          style="--kartu-idx: ${idx}; --warna-aksen: ${warnaAksenJenis};"
                          data-id="${item.id}"
                        >
                          <!-- Inset Foto Unsplash Estetis -->
                          <div class="kartu-modern-media">
                            <img
                              src="${fotoUrl}"
                              alt="${item.nama}"
                              class="kartu-modern-img"
                              loading="lazy"
                            />
                            <div class="kartu-modern-overlay"></div>
                            <span class="kartu-modern-badge-jenis">
                              ${namaJenisLabel}
                            </span>
                          </div>

                          <!-- Konten Kartu (Style Gambar 2) -->
                          <div class="kartu-modern-badan">
                            <span class="kartu-modern-subtitle">
                              ${item.kabupaten_nama ? `${item.kabupaten_nama.toUpperCase()}` : p.nama.toUpperCase()}
                            </span>

                            <h4 class="kartu-modern-judul">
                              ${item.nama}
                            </h4>

                            <p class="kartu-modern-ringkasan">
                              ${item.ringkasan || 'Warisan budaya nusantara tercatat dalam arsip Sistem Pendataan Kebudayaan Terpadu.'}
                            </p>

                            <div class="kartu-modern-footer">
                              <button type="button" class="kartu-modern-btn-detail" data-id="${item.id}">
                                <span>Baca Kisah Lengkap</span>
                                <span class="kartu-modern-panah">&rarr;</span>
                              </button>

                              ${
                                item.tahun_input
                                  ? `<span class="kartu-modern-tahun">SPKT ${item.tahun_input}</span>`
                                  : ''
                              }
                            </div>
                          </div>
                        </article>
                      `;
                      })
                      .join('')}
                  </div>
                `
                    : adalahKosong
                    ? `
                  <div class="zona-state-kosong-refleksi">
                    <div class="zona-ikon-refleksi">${ikonKompas(36)}</div>
                    <h3>Belum Tercatat di SPKT</h3>
                    <p>
                      Provinsi <strong>${p.nama}</strong> saat ini belum memiliki rekaman data di SPKT Kementerian Kebudayaan RI per tanggal pencatatan.
                    </p>
                    <blockquote class="zona-kutipan-refleksi">
                      &ldquo;Budaya Indonesia tidak sedikit. Yang sedikit adalah yang sudah tercatat.&rdquo;
                    </blockquote>
                  </div>
                `
                    : `
                  <div class="zona-state-kosong-cari">
                    <p>Tidak ditemukan tradisi dengan kriteria pencarian ini.</p>
                    <button type="button" class="btn-reset-pencarian">Tampilkan Semua Budaya</button>
                  </div>
                `
                }
              </div>
            </section>

            <!-- ==========================================
                 ZONA KANAN: ANALISIS & REKAPITULASI LAINNYA
                 ========================================== -->
            <section class="zona-kolom zona-kolom--kanan" aria-label="Analisis dan Penjelasan Lainnya">
              <div class="zona-kepala">
                <span class="zona-nomor-chip">ZONA 3</span>
                <h3 class="zona-judul">Analisis &amp; Penjelasan Lainnya</h3>
              </div>

              <!-- Ringkasan Statistik Utama -->
              <div class="zona-kanan-stat-kartu">
                <div class="zona-kanan-stat-item">
                  <span class="zona-stat-angka">${formatAngka(p.total)}</span>
                  <span class="zona-stat-label">Total Karya Budaya Tercatat</span>
                </div>
                <div class="zona-kanan-stat-item">
                  <span class="zona-stat-angka">${p.peringkat_total ? `#${p.peringkat_total}` : '-'}</span>
                  <span class="zona-stat-label">Peringkat Sebaran Nasional</span>
                </div>
              </div>

              <!-- Komposisi Objek Pemajuan Kebudayaan -->
              <div class="zona-kanan-seksi">
                <h4 class="zona-seksi-judul">Komposisi Kategori Kebudayaan</h4>
                <div class="zona-kanan-kategori-list">
                  ${
                    daftarKategori.length > 0
                      ? daftarKategori
                          .map((k) => {
                            const persen = Math.round((k.jml / (p.total || 1)) * 100);
                            return `
                        <div class="zona-kat-baris">
                          <div class="zona-kat-teks">
                            <span class="zona-kat-nama">
                              <span class="zona-kat-titik" style="background-color: ${k.warna};"></span>
                              ${k.nama}
                            </span>
                            <span class="zona-kat-angka"><strong>${k.jml}</strong> (${persen}%)</span>
                          </div>
                          <div class="zona-kat-rel">
                            <div class="zona-kat-rel-isi" style="width: ${persen}%; background-color: ${k.warna};"></div>
                          </div>
                        </div>
                      `;
                          })
                          .join('')
                      : `<p class="zona-teks-redup">Belum ada rincian kategori untuk wilayah ini.</p>`
                  }
                </div>
              </div>

              <!-- Refleksi Sosial SPKT -->
              <div class="zona-kanan-seksi zona-kanan-seksi--refleksi">
                <h4 class="zona-seksi-judul">Refleksi Pendataan Kebudayaan</h4>
                <p class="zona-refleksi-teks">
                  Data ini merepresentasikan kemajuan pencatatan dinas terkait ke dalam Sistem Pendataan Kebudayaan Terpadu (SPKT), bukan mencerminkan tingkat kekayaan budaya yang sesungguhnya.
                </p>
              </div>

              <!-- Tombol Aksi Paspor Budaya -->
              <div class="zona-kanan-aksi-paspor">
                <button
                  type="button"
                  class="zona-btn-paspor ${sudahStempel ? 'is-stempel-sukses' : ''}"
                  data-kode="${p.kode}"
                >
                  <span class="zona-btn-paspor-ikon">${sudahStempel ? ikonCentang(15) : ikonPaspor(15)}</span>
                  <span>${sudahStempel ? 'Stempel Paspor Telah Dikoleksi' : 'Kumpulkan Stempel Paspor'}</span>
                </button>
              </div>
            </section>

          </div>
        </div>
      `;
    }

    // Pasang Event Listener Interaktif
    pasangEventListener(daftarTradisi);
  }

  /**
   * Memasang event listener interaktif pada elemen DOM
   */
  function pasangEventListener(daftarTradisi) {
    // 1. Tombol Tutup & Ciutkan
    const btnTutup = elKartu.querySelectorAll('.kartu-tombol-tutup, .detail-btn-tutup-eksplorasi');
    btnTutup.forEach((b) => b.addEventListener('click', sembunyikan));

    // 2. Tombol Perluas (Buka Detail Budaya)
    const btnPerluas = elKartu.querySelector('.kartu-btn-perluas');
    if (btnPerluas) {
      btnPerluas.addEventListener('click', () => {
        if (typeof onBukaModeDetail === 'function' && provinsiAktif) {
          onBukaModeDetail(provinsiAktif);
        } else {
          perluas();
        }
      });
    }

    // 3. Filter Kota/Kabupaten di Zona Kiri
    const btnsKab = elKartu.querySelectorAll('.zona-kab-item');
    btnsKab.forEach((btn) => {
      btn.addEventListener('click', () => {
        const kab = btn.dataset.kab;
        if (filterKabupatenAktif === kab) {
          filterKabupatenAktif = '';
        } else {
          filterKabupatenAktif = kab;
        }
        render();
      });
    });

    // 4. Tombol Reset Filter Kabupaten
    const btnResetKab = elKartu.querySelector('.btn-reset-filter-kab');
    if (btnResetKab) {
      btnResetKab.addEventListener('click', () => {
        filterKabupatenAktif = '';
        render();
      });
    }

    // 5. Input Cari Tradisi di Zona Tengah
    const inputCari = elKartu.querySelector('.zona-input-cari');
    if (inputCari) {
      inputCari.addEventListener('input', (e) => {
        kataKunciCari = e.target.value;
        render();
        const inputBaru = elKartu.querySelector('.zona-input-cari');
        if (inputBaru) {
          inputBaru.focus();
          inputBaru.setSelectionRange(inputBaru.value.length, inputBaru.value.length);
        }
      });
    }

    // 6. Select Filter Kategori di Zona Tengah
    const selectFilter = elKartu.querySelector('.zona-select-kategori');
    if (selectFilter) {
      selectFilter.addEventListener('change', (e) => {
        filterJenisAktif = e.target.value;
        render();
      });
    }

    // 7. Reset Pencarian jika kosong
    const btnResetCari = elKartu.querySelector('.btn-reset-pencarian');
    if (btnResetCari) {
      btnResetCari.addEventListener('click', () => {
        kataKunciCari = '';
        filterJenisAktif = 'semua';
        filterKabupatenAktif = '';
        render();
      });
    }

    // 8. Tombol Stempel Paspor
    const btnsPaspor = elKartu.querySelectorAll('.kartu-btn-paspor-mini, .zona-btn-paspor');
    btnsPaspor.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!provinsiAktif) return;
        const kode = String(provinsiAktif.kode);
        stempelTerkumpulMap.add(kode);
        if (typeof onCatatStempel === 'function') {
          onCatatStempel(kode, 'interaktif');
        }
        render();
      });
    });

    // 9. Tombol Baca Kisah Lengkap Rekaman
    const btnsKisah = elKartu.querySelectorAll('.kartu-modern-btn-detail, .kartu-btn-baca-kisah');
    btnsKisah.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const rekaman = daftarTradisi.find((t) => t.id === id);
        if (rekaman && typeof onBukaDetailRekaman === 'function') {
          onBukaDetailRekaman(rekaman, btn);
        }
      });
    });
  }

  return {
    tampilkan,
    sembunyikan,
    perluas,
    ciutkan,
    perbaruiDataBudaya: () => {
      if (provinsiAktif) render();
    },
    dispose: () => {
      if (elKartu && elKartu.parentNode) {
        elKartu.parentNode.removeChild(elKartu);
      }
    }
  };
}
