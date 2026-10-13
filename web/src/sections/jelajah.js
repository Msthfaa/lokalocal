/**
 * jelajah.js — Bagian S5 (Jelajah): peta interaktif 38 provinsi dengan 4 mode warna & zoom,
 * panel detail provinsi, tabel alternatif aksesibel, pencarian teks (debounce 200ms),
 * filter chip jenis multi-pilih, dan kisi kartu cerita dengan "Muat lebih banyak".
 * Sesuai WEB_SPEC.md Bagian 3 (S5), Bagian 4, dan Bagian 5.
 */

import { DAFTAR_JENIS_OPK, FITUR_OPSIONAL } from '../config.js';
import { renderPetaSvg } from '../map/render.js';
import { pasangInteraksiPeta } from '../map/interactions.js';
import { tentukanFillProvinsi, dapatkanTanggaLegendaJumlah, WARNA_JENIS_HEX } from '../map/scales.js';
import { buatProyeksiIndonesia } from '../map/projection.js';
import { apakahBisaMemuat3D } from './hero3d/fallback.js';
import { buatPanelProvinsi } from '../ui/panel-provinsi.js';
import { buatTabelDaftarProvinsi } from '../ui/tabel-daftar.js';
import { buatElemenKartuCerita } from '../ui/kartu.js';
import { normalisasiPencarian } from '../util/teks.js';
import { formatAngka } from '../util/format.js';

const BATAS_PER_HALAMAN = 12;

/**
 * Menginisialisasi bagian S5 Jelajah.
 *
 * @param {object} dataAwal - { statistik, provinsi, geoProvinsi, meta }
 * @param {object} opsi
 * @param {(rekaman: object, pemicuEl: HTMLElement) => void} opsi.saatBukaDetailRekaman
 * @param {(kode: string, jenis: 'biasa'|'penjaga') => void} [opsi.saatCatatStempel]
 */
export function inisialisasiBagianJelajah(dataAwal, opsi = {}) {
  const { provinsi = [], geoProvinsi, meta } = dataAwal;
  const { saatBukaDetailRekaman, saatCatatStempel } = opsi;
  const tanggalTerformat = meta?.tanggal_ambil_terformat || '9 Oktober 2026';

  // Elemen DOM
  const wadahPeta = document.getElementById('s5-peta-wadah');
  const tooltipEl = document.getElementById('s5-peta-tooltip');
  const wadahLegendaPeta = document.getElementById('s5-legenda-peta');
  const selectModePeta = document.getElementById('s5-select-mode-peta');
  const selectSubJenisPeta = document.getElementById('s5-select-subjenis-peta');
  const btnMode3D = document.getElementById('s5-btn-mode-3d');
  const btnMode2D = document.getElementById('s5-btn-mode-2d');
  const bingkaiPetaS5 = document.getElementById('s5-bingkai-peta');
  const btnZoomIn = document.getElementById('s5-zoom-in');
  const btnZoomOut = document.getElementById('s5-zoom-out');
  const btnZoomReset = document.getElementById('s5-zoom-reset');
  const tombolToggleTabel = document.getElementById('s5-tombol-tabel');
  const wadahTabel = document.getElementById('s5-wadah-tabel');
  const wadahChipsProvinsi = document.getElementById('s5-chips-provinsi');
  const wadahPanelProvinsi = document.getElementById('s5-panel-provinsi');

  const inputCari = document.getElementById('s5-input-cari');
  const tombolHapusCari = document.getElementById('s5-hapus-cari');
  const wadahFilterJenis = document.getElementById('s5-filter-jenis');
  const tombolResetFilter = document.getElementById('s5-reset-filter');
  const teksRingkasanFilter = document.getElementById('s5-ringkasan-hasil');
  const wadahKisiKartu = document.getElementById('s5-kisi-kartu');
  const wadahMuatLagi = document.getElementById('s5-wadah-muat-lagi');
  const tombolMuatLagi = document.getElementById('s5-tombol-muat-lagi');

  // State eksplorasi
  let daftarBudaya = [];
  let petaIndexKunci = new Map();
  let dataLengkapSiap = false;

  let kodeProvinsiAktif = null;
  let kataKunciCari = '';
  const jenisTerpilih = new Set(); // multi-pilih kode jenis ('kerajinan', 'seni', ..., 'cagar', 'lainnya')
  let jumlahTampil = BATAS_PER_HALAMAN;
  let modePetaAktif = 'jumlah';
  let subJenisPetaAktif = 'kerajinan';
  let skalaZoom = 1;
  let modeDimensiAktif = '3d';

  const petaProvByKode = new Map(provinsi.map((p) => [String(p.kode), p]));

  // 1. Render Peta Interaktif 2D SVG
  let instansPeta = null;
  let kontrolPeta = null;

  if (wadahPeta && geoProvinsi) {
    instansPeta = renderPetaSvg(wadahPeta, {
      geoProvinsi,
      daftarProvinsi: provinsi,
      idUnik: 's5-jelajah',
      modeAwal: 'jumlah',
      interaktif: true
    });

    kontrolPeta = pasangInteraksiPeta(instansPeta, {
      tooltipEl,
      saatPilihProvinsi: (kode) => {
        aturProvinsiAktif(kode, false);
      }
    });
  }

  // 2. Render Peta Diorama 3D Jelajah Berskala Besar (Fase 9 Pilihan Interaktif)
  let kontroler3DJelajah = null;

  if (apakahBisaMemuat3D() && FITUR_OPSIONAL.globe3D && wadahPeta && geoProvinsi) {
    import('./hero3d/jelajah3d.js')
      .then(({ inisialisasiJelajah3D }) => {
        kontroler3DJelajah = inisialisasiJelajah3D({
          wadahEl: wadahPeta,
          geoProvinsi,
          daftarProvinsi: provinsi,
          proyeksi: buatProyeksiIndonesia(geoProvinsi),
          saatPilihProvinsi: (kode) => {
            aturProvinsiAktif(kode, false);
          }
        });

        if (kontroler3DJelajah && bingkaiPetaS5) {
          bingkaiPetaS5.classList.add('is-mode-3d');
          if (btnMode3D && btnMode2D) {
            btnMode3D.classList.add('is-active');
            btnMode2D.classList.remove('is-active');
          }
        }
      })
      .catch((err) => {
        console.warn('Fallback ke peta 2D di bagian jelajah:', err);
        aktifkanMode2D();
      });
  } else {
    // Bila tidak mendukung 3D, sembunyikan toggle dimensi dan gunakan 2D
    const grupToggleDimensi = document.getElementById('s5-grup-toggle-dimensi');
    if (grupToggleDimensi) grupToggleDimensi.style.display = 'none';
    aktifkanMode2D();
  }

  function aktifkanMode3D() {
    modeDimensiAktif = '3d';
    if (btnMode3D) btnMode3D.classList.add('is-active');
    if (btnMode2D) btnMode2D.classList.remove('is-active');
    if (bingkaiPetaS5) bingkaiPetaS5.classList.add('is-mode-3d');

    const kanvas3D = wadahPeta ? wadahPeta.querySelector('.s5-jelajah3d-kanvas') : null;
    if (kanvas3D) kanvas3D.style.display = 'block';

    if (kontroler3DJelajah && kodeProvinsiAktif) {
      kontroler3DJelajah.pilihProvinsi(kodeProvinsiAktif);
    }
  }

  function aktifkanMode2D() {
    modeDimensiAktif = '2d';
    if (btnMode2D) btnMode2D.classList.add('is-active');
    if (btnMode3D) btnMode3D.classList.remove('is-active');
    if (bingkaiPetaS5) bingkaiPetaS5.classList.remove('is-mode-3d');

    const kanvas3D = wadahPeta ? wadahPeta.querySelector('.s5-jelajah3d-kanvas') : null;
    if (kanvas3D) kanvas3D.style.display = 'none';

    if (instansPeta && instansPeta.svg) {
      instansPeta.svg.style.display = 'block';
    }
  }

  if (btnMode3D) {
    btnMode3D.addEventListener('click', aktifkanMode3D);
  }
  if (btnMode2D) {
    btnMode2D.addEventListener('click', aktifkanMode2D);
  }

  // 3. Kontrol Zoom Terpadu (3D Kamera Zoom & 2D SVG Transform)
  function terapkanZoomPeta() {
    if (!instansPeta || !instansPeta.grupViewport) return;
    const cx = 500;
    const cy = 200;
    if (skalaZoom <= 1.01) {
      instansPeta.grupViewport.removeAttribute('transform');
    } else {
      const tx = cx - cx * skalaZoom;
      const ty = cy - cy * skalaZoom;
      instansPeta.grupViewport.setAttribute(
        'transform',
        `translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${skalaZoom.toFixed(2)})`
      );
    }
  }

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      if (modeDimensiAktif === '3d' && kontroler3DJelajah) {
        kontroler3DJelajah.zoomIn();
      } else {
        skalaZoom = Math.min(2.8, skalaZoom + 0.4);
        terapkanZoomPeta();
      }
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      if (modeDimensiAktif === '3d' && kontroler3DJelajah) {
        kontroler3DJelajah.zoomOut();
      } else {
        skalaZoom = Math.max(1, skalaZoom - 0.4);
        terapkanZoomPeta();
      }
    });
  }
  if (btnZoomReset) {
    btnZoomReset.addEventListener('click', () => {
      if (modeDimensiAktif === '3d' && kontroler3DJelajah) {
        kontroler3DJelajah.zoomReset();
      } else {
        skalaZoom = 1;
        terapkanZoomPeta();
      }
    });
  }

  // 3. Pengalih Mode Pewarnaan Peta & Legenda Dinamis
  function perbaruiWarnaDanLegendaPeta() {
    if (!instansPeta) return;
    const semuaPath = instansPeta.grupProvinsi.querySelectorAll('.provinsi-path[data-kode]');

    for (const path of semuaPath) {
      const kode = path.dataset.kode;
      const dataProv = petaProvByKode.get(kode);
      const fillBaru = tentukanFillProvinsi(dataProv, {
        mode: modePetaAktif,
        jenisKode: subJenisPetaAktif,
        idPolaArsir: instansPeta.idPolaArsir,
        maksTotal: instansPeta.maksTotal
      });
      path.setAttribute('fill', fillBaru);
    }

    if (!wadahLegendaPeta) return;
    wadahLegendaPeta.textContent = '';

    if (modePetaAktif === 'jumlah' || modePetaAktif === 'cagar') {
      const tangga = dapatkanTanggaLegendaJumlah();
      for (const item of tangga) {
        const span = document.createElement('span');
        span.className = 'legenda-peta-item';

        const kotak = document.createElement('span');
        kotak.className = item.warna === 'arsir' ? 's4-ikon-arsir' : 'legenda-peta-kotak';
        if (item.warna !== 'arsir') {
          kotak.style.backgroundColor = item.warna;
        }

        const teks = document.createElement('span');
        teks.textContent = item.label;
        span.append(kotak, teks);
        wadahLegendaPeta.appendChild(span);
      }
    } else if (modePetaAktif === 'jenis-dominan') {
      for (const j of DAFTAR_JENIS_OPK) {
        const span = document.createElement('span');
        span.className = 'legenda-peta-item';

        const titik = document.createElement('span');
        titik.className = 'chip-titik';
        titik.dataset.jenis = j.kode;

        const teks = document.createElement('span');
        teks.textContent = j.label;
        span.append(titik, teks);
        wadahLegendaPeta.appendChild(span);
      }
    } else if (modePetaAktif === 'per-jenis') {
      const info = DAFTAR_JENIS_OPK.find((j) => j.kode === subJenisPetaAktif);
      const span = document.createElement('span');
      span.className = 'legenda-peta-item';
      const kotak = document.createElement('span');
      kotak.className = 'legenda-peta-kotak';
      kotak.style.backgroundColor = WARNA_JENIS_HEX[subJenisPetaAktif] || '#E6B14A';
      const teks = document.createElement('span');
      teks.textContent = `Provinsi dengan catatan ${info?.label || subJenisPetaAktif}`;
      span.append(kotak, teks);
      wadahLegendaPeta.appendChild(span);
    }

    if (kontroler3DJelajah) {
      kontroler3DJelajah.setColorMode(modePetaAktif === 'jumlah' ? 'natural' : 'data');
    }
  }

  if (selectModePeta) {
    selectModePeta.addEventListener('change', () => {
      modePetaAktif = selectModePeta.value;
      if (selectSubJenisPeta) {
        selectSubJenisPeta.hidden = modePetaAktif !== 'per-jenis';
      }
      perbaruiWarnaDanLegendaPeta();
    });
  }

  if (selectSubJenisPeta) {
    selectSubJenisPeta.addEventListener('change', () => {
      subJenisPetaAktif = selectSubJenisPeta.value;
      perbaruiWarnaDanLegendaPeta();
    });
  }

  perbaruiWarnaDanLegendaPeta();

  // 4. Panel Detail Provinsi
  const panelProvinsi = buatPanelProvinsi({
    wadahEl: wadahPanelProvinsi,
    daftarProvinsi: provinsi,
    tanggalAmbilTerformat: tanggalTerformat,
    saatCatatStempel,
    saatPilihProvinsiLain: (kodeBaru) => {
      aturProvinsiAktif(kodeBaru, true);
    },
    saatTutupPanel: () => {
      aturProvinsiAktif(null, false);
    }
  });

  // 5. Tabel Daftar 38 Provinsi (Alternatif Aksesibel)
  if (wadahTabel) {
    buatTabelDaftarProvinsi({
      wadahEl: wadahTabel,
      daftarProvinsi: provinsi,
      saatPilihProvinsi: (kode) => {
        aturProvinsiAktif(kode, true);
        if (wadahPanelProvinsi) {
          wadahPanelProvinsi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });
  }

  if (tombolToggleTabel && wadahTabel) {
    tombolToggleTabel.addEventListener('click', () => {
      const sedangTersembunyi = wadahTabel.hidden;
      wadahTabel.hidden = !sedangTersembunyi;
      tombolToggleTabel.setAttribute('aria-expanded', String(sedangTersembunyi));
      tombolToggleTabel.textContent = sedangTersembunyi
        ? 'Sembunyikan tabel 38 provinsi'
        : 'Lihat sebagai daftar (Tabel 38 Provinsi)';
    });
  }

  // 6. Chips Cepat 38 Provinsi di Bawah Peta
  function renderChipsProvinsi() {
    if (!wadahChipsProvinsi) return;
    wadahChipsProvinsi.textContent = '';

    for (const p of provinsi) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip-provinsi-kecil';
      btn.dataset.kode = p.kode;
      btn.setAttribute('aria-pressed', String(kodeProvinsiAktif === p.kode));

      const belum = p.status_data === 'belum_tercatat' || p.total <= 0;
      if (belum) {
        btn.classList.add('is-belum');
      }

      btn.textContent = belum ? `${p.nama} (belum tercatat)` : `${p.nama} (${formatAngka(p.total)})`;
      btn.addEventListener('click', () => {
        if (kodeProvinsiAktif === p.kode) {
          aturProvinsiAktif(null, false);
        } else {
          aturProvinsiAktif(p.kode, true);
        }
      });

      wadahChipsProvinsi.appendChild(btn);
    }
  }

  function perbaruiStatusChipsProvinsi() {
    if (!wadahChipsProvinsi) return;
    const semuaBtn = wadahChipsProvinsi.querySelectorAll('button[data-kode]');
    for (const btn of semuaBtn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.kode === kodeProvinsiAktif));
    }
  }

  renderChipsProvinsi();

  // 7. Chips Filter Jenis Budaya (Multi-pilih)
  const daftarFilterChip = [
    ...DAFTAR_JENIS_OPK,
    { kode: 'lainnya', label: 'Lembaga & Sarana', warnaVar: '--jenis-cagar' }
  ];

  function renderFilterJenis() {
    if (!wadahFilterJenis) return;
    wadahFilterJenis.textContent = '';

    for (const item of daftarFilterChip) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip-filter-tombol';
      btn.dataset.jenis = item.kode;
      btn.setAttribute('aria-pressed', String(jenisTerpilih.has(item.kode)));

      const titik = document.createElement('span');
      titik.className = 'chip-titik';
      titik.dataset.jenis = item.kode === 'lainnya' ? 'cagar' : item.kode;
      titik.setAttribute('aria-hidden', 'true');

      const teks = document.createElement('span');
      teks.textContent = item.label;

      btn.append(titik, teks);
      btn.addEventListener('click', () => {
        if (jenisTerpilih.has(item.kode)) {
          jenisTerpilih.delete(item.kode);
        } else {
          jenisTerpilih.add(item.kode);
        }
        btn.setAttribute('aria-pressed', String(jenisTerpilih.has(item.kode)));
        jumlahTampil = BATAS_PER_HALAMAN;
        renderDaftarKartu();
      });

      wadahFilterJenis.appendChild(btn);
    }
  }

  renderFilterJenis();

  // 8. Input Pencarian Teks dengan Debounce 200 ms
  let timerDebounce = null;
  if (inputCari) {
    inputCari.addEventListener('input', () => {
      const nilai = inputCari.value || '';
      if (tombolHapusCari) {
        tombolHapusCari.hidden = nilai.length === 0;
      }

      if (timerDebounce) window.clearTimeout(timerDebounce);
      timerDebounce = window.setTimeout(() => {
        kataKunciCari = normalisasiPencarian(nilai);
        jumlahTampil = BATAS_PER_HALAMAN;
        renderDaftarKartu();
      }, 200);
    });
  }

  if (tombolHapusCari && inputCari) {
    tombolHapusCari.addEventListener('click', () => {
      inputCari.value = '';
      tombolHapusCari.hidden = true;
      kataKunciCari = '';
      jumlahTampil = BATAS_PER_HALAMAN;
      renderDaftarKartu();
      inputCari.focus();
    });
  }

  if (tombolResetFilter) {
    tombolResetFilter.addEventListener('click', () => {
      aturProvinsiAktif(null, false);
      jenisTerpilih.clear();
      if (inputCari) inputCari.value = '';
      if (tombolHapusCari) tombolHapusCari.hidden = true;
      kataKunciCari = '';
      jumlahTampil = BATAS_PER_HALAMAN;
      renderFilterJenis();
      renderDaftarKartu();
    });
  }

  if (tombolMuatLagi) {
    tombolMuatLagi.addEventListener('click', () => {
      jumlahTampil += BATAS_PER_HALAMAN;
      renderDaftarKartu();
    });
  }

  // 9. Fungsi Mengatur Provinsi Aktif
  function aturProvinsiAktif(kode, sinkronkanPeta = true) {
    kodeProvinsiAktif = kode ? String(kode) : null;
    jumlahTampil = BATAS_PER_HALAMAN;

    if (sinkronkanPeta && kontrolPeta) {
      kontrolPeta.pilihProvinsi(kodeProvinsiAktif);
    } else if (!kodeProvinsiAktif && instansPeta) {
      const semuaPath = instansPeta.grupProvinsi.querySelectorAll('.provinsi-path');
      for (const p of semuaPath) {
        p.classList.remove('is-selected', 'is-dimmed-other');
      }
    }

    if (panelProvinsi) {
      if (kodeProvinsiAktif) {
        panelProvinsi.tampilkanProvinsi(kodeProvinsiAktif);
        if (
          wadahPanelProvinsi &&
          typeof window !== 'undefined' &&
          window.innerWidth < 1024
        ) {
          wadahPanelProvinsi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else {
        panelProvinsi.resetPanel();
      }
    }

    if (kontroler3DJelajah && modeDimensiAktif === '3d') {
      if (kodeProvinsiAktif) {
        kontroler3DJelajah.pilihProvinsi(kodeProvinsiAktif);
      } else {
        kontroler3DJelajah.sembunyikanBendera();
      }
    }

    perbaruiStatusChipsProvinsi();
    renderDaftarKartu();
  }

  // Daftarkan handler global untuk integrasi klik bendera dari hero 3D
  if (typeof window !== 'undefined') {
    window.__pilihProvinsiJelajah = (kode) => {
      aturProvinsiAktif(kode, true);
      if (kontroler3DJelajah) {
        kontroler3DJelajah.pilihProvinsi(kode);
      }
    };
  }

  // 10. Penyaringan dan Render Kisi Kartu Cerita
  function cocokkanJenisRekaman(rekaman) {
    if (jenisTerpilih.size === 0) return true;
    const kat = String(rekaman.kategori_kode || '');
    const jenis = String(rekaman.jenis_kode || '');

    if (kat === 'OPK' && jenisTerpilih.has(jenis)) return true;
    if (kat === 'CB' && jenisTerpilih.has('cagar')) return true;
    if ((kat === 'LB' || kat === 'SP') && jenisTerpilih.has('lainnya')) return true;
    return false;
  }

  function cocokkanPencarianRekaman(rekaman) {
    if (!kataKunciCari) return true;
    const teksIndex =
      petaIndexKunci.get(rekaman.id) ||
      normalisasiPencarian(
        `${rekaman.nama_tampil} ${rekaman.provinsi} ${(rekaman.kabupaten_daftar || []).join(' ')} ${rekaman.jenis}`
      );
    return teksIndex.includes(kataKunciCari);
  }

  function renderDaftarKartu() {
    if (!wadahKisiKartu) return;

    const adaFilterAktif =
      Boolean(kodeProvinsiAktif) || jenisTerpilih.size > 0 || Boolean(kataKunciCari);
    if (tombolResetFilter) {
      tombolResetFilter.hidden = !adaFilterAktif;
    }

    // Jika data lengkap belum selesai dimuat, tampilkan skeleton
    if (!dataLengkapSiap) {
      wadahKisiKartu.textContent = '';
      for (let i = 0; i < 6; i++) {
        const skel = document.createElement('div');
        skel.className = 'kartu-skeleton';
        skel.setAttribute('aria-hidden', 'true');
        wadahKisiKartu.appendChild(skel);
      }
      if (wadahMuatLagi) wadahMuatLagi.hidden = true;
      return;
    }

    // Cek apakah pengguna sedang memilih salah satu dari 10 provinsi yang belum tercatat di SPKT
    if (kodeProvinsiAktif) {
      const infoProv = petaProvByKode.get(kodeProvinsiAktif);
      if (infoProv && (infoProv.status_data === 'belum_tercatat' || infoProv.total <= 0)) {
        wadahKisiKartu.textContent = '';
        if (teksRingkasanFilter) {
          teksRingkasanFilter.textContent = `Provinsi ${infoProv.nama} — Belum tercatat di SPKT per ${tanggalTerformat}.`;
        }

        const kotakJujur = document.createElement('div');
        kotakJujur.className = 'kerangka-panel';
        kotakJujur.style.gridColumn = '1 / -1';

        const h3 = document.createElement('h3');
        h3.textContent = `${infoProv.nama} belum memiliki catatan di dataset SPKT ini`;

        const p = document.createElement('p');
        p.style.color = 'var(--kertas-redup)';
        p.textContent =
          `Belum tercatat di SPKT bukan berarti tidak ada budaya di ${infoProv.nama}. ` +
          `Setiap daerah memiliki tradisi lisan, kerajinan, adat, dan peninggalan sejarah — namun datanya belum sampai ke tangkapan sistem pada ${tanggalTerformat}.`;

        const btnSemua = document.createElement('button');
        btnSemua.type = 'button';
        btnSemua.className = 'tombol tombol--garis';
        btnSemua.style.alignSelf = 'flex-start';
        btnSemua.textContent = 'Tampilkan catatan dari seluruh provinsi';
        btnSemua.addEventListener('click', () => aturProvinsiAktif(null, false));

        kotakJujur.append(h3, p, btnSemua);
        wadahKisiKartu.appendChild(kotakJujur);
        if (wadahMuatLagi) wadahMuatLagi.hidden = true;
        return;
      }
    }

    // Saring rekaman
    const hasilSaring = daftarBudaya.filter((rek) => {
      if (kodeProvinsiAktif && String(rek.kode_provinsi) !== kodeProvinsiAktif) {
        return false;
      }
      if (!cocokkanJenisRekaman(rek)) {
        return false;
      }
      if (!cocokkanPencarianRekaman(rek)) {
        return false;
      }
      return true;
    });

    // Urutkan agar rekaman yang memiliki deskripsi ('unggulan', 'panjang', 'pendek') tampil lebih dulu sebelum 'kosong'
    const skorKelas = { unggulan: 1, panjang: 2, pendek: 3, kosong: 4 };
    hasilSaring.sort((a, b) => {
      const sA = skorKelas[a.kelas_konten] || 5;
      const sB = skorKelas[b.kelas_konten] || 5;
      if (sA !== sB) return sA - sB;
      return String(a.nama_tampil || '').localeCompare(String(b.nama_tampil || ''), 'id');
    });

    const potonganTampil = hasilSaring.slice(0, jumlahTampil);
    const namaProvAktif = kodeProvinsiAktif ? petaProvByKode.get(kodeProvinsiAktif)?.nama : null;

    if (teksRingkasanFilter) {
      const konteksWilayah = namaProvAktif ? ` di ${namaProvAktif}` : ' dari seluruh Indonesia';
      teksRingkasanFilter.textContent =
        `Menampilkan ${formatAngka(potonganTampil.length)} dari ${formatAngka(hasilSaring.length)} catatan unik${konteksWilayah}.`;
    }

    wadahKisiKartu.textContent = '';

    if (hasilSaring.length === 0) {
      const kosongCari = document.createElement('div');
      kosongCari.className = 'kerangka-panel';
      kosongCari.style.gridColumn = '1 / -1';

      const judulK = document.createElement('h3');
      judulK.textContent = 'Tidak ada catatan yang cocok dengan saringan ini';

      const ketK = document.createElement('p');
      ketK.style.color = 'var(--kertas-redup)';
      ketK.textContent = 'Coba ubah kata kunci pencarian atau lepaskan sebagian filter jenis budaya.';

      kosongCari.append(judulK, ketK);
      wadahKisiKartu.appendChild(kosongCari);
      if (wadahMuatLagi) wadahMuatLagi.hidden = true;
      return;
    }

    const frag = document.createDocumentFragment();
    for (const rek of potonganTampil) {
      const elKartu = buatElemenKartuCerita(rek, {
        ukuran: 'biasa',
        saatBacaSelengkapnya: (item, pemicu) => {
          if (typeof saatBukaDetailRekaman === 'function') {
            saatBukaDetailRekaman(item, pemicu);
          }
        }
      });
      frag.appendChild(elKartu);
    }
    wadahKisiKartu.appendChild(frag);

    const sisa = hasilSaring.length - potonganTampil.length;
    if (wadahMuatLagi && tombolMuatLagi) {
      if (sisa > 0) {
        wadahMuatLagi.hidden = false;
        tombolMuatLagi.textContent = `Muat lebih banyak (${formatAngka(sisa)} catatan lagi)`;
      } else {
        wadahMuatLagi.hidden = true;
      }
    }
  }

  /**
   * Dipanggil ketika budaya.clean.json dan index-pencarian.json selesai dimuat.
   */
  function terimaDataLengkap({ budaya = [], indexPencarian = [] }) {
    daftarBudaya = budaya;
    petaIndexKunci = new Map(
      indexPencarian.map((item) => [item.id, normalisasiPencarian(item.kata_kunci || '')])
    );
    dataLengkapSiap = true;
    renderDaftarKartu();
  }

  // Render awal (skeleton sementara menunggu data lengkap)
  renderDaftarKartu();

  return {
    terimaDataLengkap,
    pilihProvinsiDariLuar: (kode) => {
      aturProvinsiAktif(kode, true);
    }
  };
}
