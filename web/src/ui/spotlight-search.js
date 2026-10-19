/**
 * spotlight-search.js — Modul Command Palette Global (Ctrl + K / Cmd + K)
 * Memfasilitasi pencarian kilat ke seluruh 493 tradisi OPK & Cagar Budaya serta 38 Provinsi.
 * Memenuhi Kaidah Aksesibilitas WCAG, Keyboard Navigation (Arrow Keys + Enter + Esc),
 * serta Anti-Slop (desain beridentitas budaya, umpan balik interaktif nyata).
 */

import { escapeHtml } from '../util/teks.js';

let dialogEl = null;
let inputEl = null;
let hasilWadahEl = null;
let filterPilEls = [];
let indeksData = [];
let daftarProvinsiData = [];
let itemHasilTerpilihIndex = 0;
let itemHasilDaftar = [];
let filterKategoriAktif = 'semua';
let cbOnBukaDetailRekaman = null;
let cbOnPilihProvinsi = null;
let sedangMemuatData = false;

/**
 * Menyiapkan dan memuat indeks pencarian.
 */
async function muatIndeksPencarian() {
  if (indeksData.length > 0 || sedangMemuatData) return;
  sedangMemuatData = true;
  try {
    const res = await fetch('/data/index-pencarian.json');
    if (res.ok) {
      indeksData = await res.json();
    }
  } catch (err) {
    console.warn('Gagal memuat index-pencarian.json:', err);
  } finally {
    sedangMemuatData = false;
  }
}

/**
 * Membuka modal Spotlight Search.
 */
export function bukaSpotlightSearch() {
  if (!dialogEl) return;
  dialogEl.showModal();
  dialogEl.setAttribute('open', '');
  document.body.style.overflow = 'hidden';

  muatIndeksPencarian().then(() => {
    if (inputEl) {
      inputEl.value = '';
      inputEl.focus();
      filterKategoriAktif = 'semua';
      perbaruiFilterPilUI();
      jalankanPencarian('');
    }
  });
}

/**
 * Menutup modal Spotlight Search.
 */
export function tutupSpotlightSearch() {
  if (!dialogEl) return;
  dialogEl.removeAttribute('open');
  dialogEl.close();
  document.body.style.overflow = '';
}

/**
 * Menyorot substring teks yang cocok dengan query.
 */
function sorotTeks(teks, query) {
  if (!teks) return '';
  if (!query || query.trim() === '') return escapeHtml(teks);
  const qBersih = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${qBersih})`, 'gi');
  return escapeHtml(teks).replace(regex, '<span class="spotlight-item-teks-highlight">$1</span>');
}

/**
 * Memperbarui tampilan tombol filter kategori.
 */
function perbaruiFilterPilUI() {
  for (const pil of filterPilEls) {
    pil.classList.toggle('aktif', pil.dataset.kategori === filterKategoriAktif);
  }
}

/**
 * Merender daftar hasil ke dalam wadah hasil.
 */
function renderHasil(daftar, query = '') {
  itemHasilDaftar = daftar;
  itemHasilTerpilihIndex = 0;
  hasilWadahEl.textContent = '';

  if (daftar.length === 0) {
    if (query.trim() === '') {
      // Tampilkan Saran Populer Awal
      const saranWadah = document.createElement('div');
      saranWadah.className = 'spotlight-saran-grup';
      saranWadah.innerHTML = `
        <div class="spotlight-saran-label">Pencarian Populer Nusantara</div>
        <div class="spotlight-saran-tag-wadah">
          <button type="button" class="spotlight-saran-tag" data-cari="Bantengan">Bantengan</button>
          <button type="button" class="spotlight-saran-tag" data-cari="Zapin">Zapin</button>
          <button type="button" class="spotlight-saran-tag" data-cari="Pencak Silat">Pencak Silat</button>
          <button type="button" class="spotlight-saran-tag" data-cari="Upuh Kerawang">Upuh Kerawang</button>
          <button type="button" class="spotlight-saran-tag" data-cari="Sumatera Barat">Sumatera Barat</button>
          <button type="button" class="spotlight-saran-tag" data-cari="Jawa Timur">Jawa Timur</button>
          <button type="button" class="spotlight-saran-tag" data-cari="Bali">Bali</button>
          <button type="button" class="spotlight-saran-tag" data-cari="Aceh">Aceh</button>
        </div>
      `;

      saranWadah.querySelectorAll('.spotlight-saran-tag').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (inputEl) {
            inputEl.value = btn.dataset.cari;
            jalankanPencarian(btn.dataset.cari);
          }
        });
      });

      hasilWadahEl.appendChild(saranWadah);
      return;
    }

    // Tampilkan Keadaan Kosong (Empty State)
    const kosongEl = document.createElement('div');
    kosongEl.className = 'spotlight-keadaan-kosong';
    kosongEl.innerHTML = `
      <div class="spotlight-keadaan-kosong-ikon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <h4 class="spotlight-keadaan-kosong-judul">Khazanah Belum Ditemukan</h4>
      <p class="spotlight-keadaan-kosong-deskripsi">
        Tidak ditemukan entri dengan kata kunci "<strong>${escapeHtml(query)}</strong>". Coba cari berdasarkan nama tarian, kuliner, seni pertunjukan, atau nama provinsi.
      </p>
    `;
    hasilWadahEl.appendChild(kosongEl);
    return;
  }

  // Render Item-item yang cocok
  daftar.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = `spotlight-item ${idx === 0 ? 'terpilih' : ''}`;
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
    el.dataset.index = String(idx);

    let lencanaTipe = '';
    if (item.tipe === 'provinsi') {
      lencanaTipe = `<span class="spotlight-badge-tipe tipe-provinsi">Provinsi</span>`;
    } else if (item.kategori_kode === 'CB' || item.jenis === 'Cagar Budaya') {
      lencanaTipe = `<span class="spotlight-badge-tipe tipe-cagar">Cagar Budaya</span>`;
    } else {
      lencanaTipe = `<span class="spotlight-badge-tipe tipe-opk">${escapeHtml(item.jenis || 'OPK')}</span>`;
    }

    const judulSorot = sorotTeks(item.nama, query);
    const kabTeks = Array.isArray(item.kabupaten)
      ? item.kabupaten.join(', ')
      : (item.kabupaten || item.kabupaten_kota || '');
    const subTeks = item.tipe === 'provinsi'
      ? `${item.jumlah_budaya || 0} Warisan Budaya Tercatat`
      : `${sorotTeks(item.provinsi || '', query)}${kabTeks ? ' • ' + escapeHtml(kabTeks) : ''}`;

    el.innerHTML = `
      <div class="spotlight-item-konten">
        <div class="spotlight-item-judul-baris">
          <span class="spotlight-item-judul">${judulSorot}</span>
          ${lencanaTipe}
        </div>
        <div class="spotlight-item-sub">
          <span>${subTeks}</span>
        </div>
      </div>
      <div class="spotlight-item-ikon-arah" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    `;

    el.addEventListener('mouseenter', () => {
      pilihIndex(idx, false);
    });

    el.addEventListener('click', () => {
      eksekusiPilihan(item);
    });

    hasilWadahEl.appendChild(el);
  });
}

/**
 * Mengubah index item yang sedang dipilih keyboard / mouse.
 */
function pilihIndex(indexBaru, gulir = true) {
  if (itemHasilDaftar.length === 0) return;
  const items = hasilWadahEl.querySelectorAll('.spotlight-item');
  if (items[itemHasilTerpilihIndex]) {
    items[itemHasilTerpilihIndex].classList.remove('terpilih');
    items[itemHasilTerpilihIndex].setAttribute('aria-selected', 'false');
  }

  itemHasilTerpilihIndex = (indexBaru + itemHasilDaftar.length) % itemHasilDaftar.length;
  const itemAktif = items[itemHasilTerpilihIndex];
  if (itemAktif) {
    itemAktif.classList.add('terpilih');
    itemAktif.setAttribute('aria-selected', 'true');
    if (gulir) {
      itemAktif.scrollIntoView({ block: 'nearest' });
    }
  }
}

/**
 * Mengeksekusi aksi saat item hasil dipilih (diklik / ditekan Enter).
 */
function eksekusiPilihan(item) {
  tutupSpotlightSearch();
  if (!item) return;

  if (item.tipe === 'provinsi') {
    if (typeof cbOnPilihProvinsi === 'function') {
      cbOnPilihProvinsi(item.kode_provinsi || item.kode);
    } else {
      window.location.href = `./jelajah.html?provinsi=${item.kode_provinsi || item.kode}`;
    }
    return;
  }

  // Objek Budaya
  if (typeof cbOnBukaDetailRekaman === 'function') {
    cbOnBukaDetailRekaman(item, null);
  } else {
    // Jika berada di luar halaman jelajah atau callback tidak terpasang, arahkan ke jelajah dengan parameter budaya
    const kodeProv = item.kode_provinsi || item.provinsi_kode || '';
    window.location.href = `./jelajah.html?provinsi=${kodeProv}&budaya=${encodeURIComponent(item.id || item.nama)}`;
  }
}

/**
 * Menjalankan filter dan pencarian teks.
 */
function jalankanPencarian(query) {
  const q = String(query || '').trim().toLowerCase();

  // Kumpulkan calon dari Provinsi
  let hasilProvinsi = [];
  if (daftarProvinsiData.length > 0 && (filterKategoriAktif === 'semua' || filterKategoriAktif === 'provinsi')) {
    hasilProvinsi = daftarProvinsiData
      .filter((p) => {
        if (!q) return false;
        return (
          p.nama.toLowerCase().includes(q) ||
          p.kode.includes(q) ||
          (p.ibu_kota && p.ibu_kota.toLowerCase().includes(q))
        );
      })
      .map((p) => ({
        tipe: 'provinsi',
        id: `prov-${p.kode}`,
        nama: p.nama,
        kode_provinsi: p.kode,
        jumlah_budaya: p.total_budaya || p.jumlah_budaya || 0
      }));
  }

  // Kumpulkan calon dari Indeks Budaya
  let hasilBudaya = indeksData.filter((b) => {
    // Filter Kategori
    if (filterKategoriAktif !== 'semua') {
      if (filterKategoriAktif === 'CB' && b.kategori_kode !== 'CB') return false;
      if (filterKategoriAktif === 'OPK' && b.kategori_kode === 'CB') return false;
      if (filterKategoriAktif === 'provinsi') return false;
      if (['tradisi_lisan', 'adat_istiadat', 'seni', 'bahasa', 'permainan_rakyat', 'olahraga_tradisional', 'pengetahuan_tradisional'].includes(filterKategoriAktif)) {
        const slug = String(b.slug || b.jenis || '').toLowerCase().replace(/\s+/g, '_');
        if (!slug.includes(filterKategoriAktif.replace('_', ' '))) {
          if (String(b.jenis || '').toLowerCase() !== filterKategoriAktif.replace('_', ' ')) {
            return false;
          }
        }
      }
    }

    if (!q) return true; // Tampilkan semua jika query kosong

    // Kecocokan teks
    const namaCocok = (b.nama || '').toLowerCase().includes(q);
    const provCocok = (b.provinsi || '').toLowerCase().includes(q);
    const kabStr = Array.isArray(b.kabupaten) ? b.kabupaten.join(' ') : (b.kabupaten || b.kabupaten_kota || '');
    const kabCocok = kabStr.toLowerCase().includes(q);
    const jenisCocok = (b.jenis || '').toLowerCase().includes(q);
    const kataKunciCocok = (b.kata_kunci || '').toLowerCase().includes(q);

    return namaCocok || provCocok || kabCocok || jenisCocok || kataKunciCocok;
  });

  // Urutkan kecocokan nama di depan
  if (q) {
    hasilBudaya.sort((a, b) => {
      const aNamaSama = (a.nama || '').toLowerCase().startsWith(q);
      const bNamaSama = (b.nama || '').toLowerCase().startsWith(q);
      if (aNamaSama && !bNamaSama) return -1;
      if (!aNamaSama && bNamaSama) return 1;
      return 0;
    });
  }

  // Batasi agar performa tetap cepat dan responsif
  const gabungan = [...hasilProvinsi, ...hasilBudaya].slice(0, 40);
  renderHasil(gabungan, q);
}

/**
 * Menginisialisasi komponen Spotlight Search di halaman web.
 *
 * @param {object} parameter
 * @param {Array} [parameter.daftarProvinsi]
 * @param {(rekaman: object, pemicuEl: HTMLElement) => void} [parameter.onBukaDetailRekaman]
 * @param {(kodeProvinsi: string) => void} [parameter.onPilihProvinsi]
 */
export function inisialisasiSpotlightSearch({
  daftarProvinsi = [],
  onBukaDetailRekaman,
  onPilihProvinsi
} = {}) {
  daftarProvinsiData = daftarProvinsi;
  cbOnBukaDetailRekaman = onBukaDetailRekaman;
  cbOnPilihProvinsi = onPilihProvinsi;

  // Cek apakah dialog sudah ada di DOM
  let dialog = document.getElementById('modal-spotlight-pencarian');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'modal-spotlight-pencarian';
    dialog.className = 'spotlight-dialog';
    dialog.innerHTML = `
      <div class="spotlight-backdrop" data-aksi="tutup"></div>
      <div class="spotlight-wadah" role="dialog" aria-modal="true" aria-label="Pencarian Cepat Tradisi dan Cagar Budaya">
        <div class="spotlight-header">
          <div class="spotlight-ikon-cari" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="search"
            class="spotlight-input"
            id="spotlight-input-pencarian"
            placeholder="Ketik nama tradisi, kesenian, kuliner, cagar budaya, atau provinsi..."
            autocomplete="off"
            spellcheck="false"
            aria-autocomplete="list"
            aria-controls="spotlight-daftar-hasil"
          />
          <div class="spotlight-header-aksi">
            <span class="spotlight-kbd-badge" title="Tekan Escape untuk keluar">ESC</span>
            <button type="button" class="spotlight-tombol-tutup" aria-label="Tutup pencarian" data-aksi="tutup">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="spotlight-filter-bar" role="toolbar" aria-label="Kategori pencarian">
          <button type="button" class="spotlight-filter-pil aktif" data-kategori="semua">Semua (493)</button>
          <button type="button" class="spotlight-filter-pil" data-kategori="OPK">Tradisi & Seni (OPK)</button>
          <button type="button" class="spotlight-filter-pil" data-kategori="CB">Cagar Budaya</button>
          <button type="button" class="spotlight-filter-pil" data-kategori="provinsi">Wilayah Provinsi</button>
        </div>

        <div id="spotlight-daftar-hasil" class="spotlight-hasil-wadah" role="listbox"></div>

        <div class="spotlight-footer">
          <div class="spotlight-footer-petunjuk">
            <span class="spotlight-footer-item">
              <span class="spotlight-kbd-badge">↑↓</span> navigasi
            </span>
            <span class="spotlight-footer-item">
              <span class="spotlight-kbd-badge">ENTER</span> pilih
            </span>
            <span class="spotlight-footer-item">
              <span class="spotlight-kbd-badge">ESC</span> tutup
            </span>
          </div>
          <div class="spotlight-footer-atribusi">
            Data Resmi SPKT Kemendikbud
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  dialogEl = dialog;
  inputEl = dialog.querySelector('#spotlight-input-pencarian');
  hasilWadahEl = dialog.querySelector('#spotlight-daftar-hasil');
  filterPilEls = Array.from(dialog.querySelectorAll('.spotlight-filter-pil'));

  // Event tutup backdrop & tombol
  dialog.querySelectorAll('[data-aksi="tutup"]').forEach((btn) => {
    btn.addEventListener('click', tutupSpotlightSearch);
  });

  // Event filter pills
  for (const pil of filterPilEls) {
    pil.addEventListener('click', () => {
      filterKategoriAktif = pil.dataset.kategori;
      perbaruiFilterPilUI();
      jalankanPencarian(inputEl ? inputEl.value : '');
    });
  }

  // Event input pencarian
  if (inputEl) {
    inputEl.addEventListener('input', (e) => {
      jalankanPencarian(e.target.value);
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        pilihIndex(itemHasilTerpilihIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        pilihIndex(itemHasilTerpilihIndex - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (itemHasilDaftar[itemHasilTerpilihIndex]) {
          eksekusiPilihan(itemHasilDaftar[itemHasilTerpilihIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        tutupSpotlightSearch();
      }
    });
  }

  // Pasang Pintasan Keyboard Global (Ctrl + K / Cmd + K)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialogEl.hasAttribute('open')) {
        tutupSpotlightSearch();
      } else {
        bukaSpotlightSearch();
      }
    }
  });

  // Pasang tombol pencarian di navbar jika elemen belum memiliki event
  document.querySelectorAll('.nav-tombol-cari').forEach((btn) => {
    btn.addEventListener('click', () => {
      bukaSpotlightSearch();
    });
  });

  // Mulai prefetch indeks di latar belakang
  muatIndeksPencarian();

  return {
    buka: bukaSpotlightSearch,
    tutup: tutupSpotlightSearch
  };
}
