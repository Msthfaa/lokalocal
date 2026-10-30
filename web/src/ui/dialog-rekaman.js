/**
 * dialog-rekaman.js — Dialog detail rekaman budaya (<dialog>)
 * Sesuai WEB_SPEC.md Bagian 4.3:
 * - Judul, lencana jenis & kategori lengkap, lokasi, dan deskripsi lengkap
 * - Deskripsi dipecah menjadi paragraf (setiap ±3–4 kalimat aman singkatan)
 * - Jika > 1.500 karakter: tampilkan ±1.200 karakter pertama + tombol "Tampilkan semua"
 * - Entri gabungan: daftar kabupaten sebagai chips
 * - Keterangan kecil: "Sumber: SPKT – Kementerian Kebudayaan RI (diambil {tanggal})"
 *   dan "Tahun pencatatan: {tahun_input}" bila ada.
 */

import { pasangPerilakuDialog } from '../util/a11y.js';
import { pecahParagrafDeskripsi } from '../util/teks.js';
import { buatPolaKartuSvg } from '../patterns/generate.js';
import { dapatkanLabelPendekJenis } from './kartu.js';
import { formatAngka } from '../util/format.js';
import { dapatkanGambarBudaya, dapatkanCadanganGambarBudaya, dapatkanSumberGambar } from '../data/gambar-budaya.js';

/**
 * Menginisialisasi dialog detail rekaman budaya.
 * @param {object} opsi
 * @param {string} [opsi.tanggalAmbilTerformat='9 Oktober 2026']
 */
export function inisialisasiDialogRekaman({ tanggalAmbilTerformat = '9 Oktober 2026' } = {}) {
  const dialogEl = document.getElementById('dialog-rekaman');
  const judulEl = document.getElementById('dialog-rekaman-judul');
  const tombolTutupEl = document.getElementById('tombol-tutup-rekaman');
  const wadahPolaEl = document.getElementById('dialog-rekaman-pola');
  const wadahMetaEl = document.getElementById('dialog-rekaman-meta');
  const wadahKabChipsEl = document.getElementById('dialog-rekaman-kabupaten');
  const wadahDeskripsiEl = document.getElementById('dialog-rekaman-deskripsi');
  const wadahKakiSumberEl = document.getElementById('dialog-rekaman-sumber');

  let tanggalData = tanggalAmbilTerformat;

  const kontrol = pasangPerilakuDialog(dialogEl, judulEl);

  if (tombolTutupEl) {
    tombolTutupEl.addEventListener('click', () => kontrol.tutup());
  }

  function aturTanggalAmbil(tglBaru) {
    if (tglBaru) tanggalData = tglBaru;
  }

  /**
   * Membuka dialog detail untuk satu rekaman budaya.
   * @param {object} rekaman
   * @param {HTMLElement} [pemicuEl]
   */
  function bukaRekaman(rekaman, pemicuEl = null) {
    if (!rekaman || !dialogEl) return;

    // 1. Pola SVG header & Foto Dokumentasi Wikimedia
    if (wadahPolaEl) {
      wadahPolaEl.textContent = '';
      wadahPolaEl.appendChild(
        buatPolaKartuSvg({
          id: rekaman.id,
          jenisKode: rekaman.jenis_kode,
          kategoriKode: rekaman.kategori_kode,
          lebar: 680,
          tinggi: 140
        })
      );

      const fotoLangsung = dapatkanGambarBudaya(rekaman);
      if (wadahPolaEl && fotoLangsung) {
        const fotoEl = document.createElement('img');
        fotoEl.className = 'dialog-rekaman-banner-foto';
        fotoEl.alt = rekaman.nama_tampil || rekaman.nama || 'Dokumentasi Budaya';
        fotoEl.loading = 'lazy';
        fotoEl.referrerPolicy = 'no-referrer';
        fotoEl.crossOrigin = 'anonymous';
        fotoEl.onload = () => {
          fotoEl.style.opacity = '1';
          if (!wadahPolaEl.querySelector('.dialog-rekaman-sumber-badge')) {
            const badge = document.createElement('span');
            badge.className = 'dialog-rekaman-sumber-badge';
            badge.textContent = dapatkanSumberGambar(rekaman);
            wadahPolaEl.appendChild(badge);
          }
        };
        fotoEl.onerror = () => {
          const cadangan = dapatkanCadanganGambarBudaya(rekaman);
          if (cadangan && !fotoEl.dataset.fallback) {
            fotoEl.dataset.fallback = '1';
            fotoEl.src = cadangan;
          } else {
            fotoEl.remove();
          }
        };
        fotoEl.src = fotoLangsung;
        wadahPolaEl.appendChild(fotoEl);
      }
    }

    // 2. Judul
    if (judulEl) {
      judulEl.textContent = rekaman.nama_tampil || rekaman.nama || 'Catatan Budaya';
    }

    // 3. Lencana kategori, jenis lengkap, dan lokasi provinsi
    if (wadahMetaEl) {
      wadahMetaEl.textContent = '';

      const infoJenis = dapatkanLabelPendekJenis(rekaman);
      const chipJenis = document.createElement('span');
      chipJenis.className = 'dialog-chip-terang';

      const titik = document.createElement('span');
      titik.className = 'chip-titik';
      titik.dataset.jenis = infoJenis.kodeWarna;
      titik.setAttribute('aria-hidden', 'true');

      const teksJenis = document.createElement('span');
      teksJenis.textContent = `${rekaman.kategori || 'Budaya'} • ${rekaman.jenis || infoJenis.teks}`;
      chipJenis.append(titik, teksJenis);

      const chipProv = document.createElement('span');
      chipProv.className = 'dialog-chip-terang';
      chipProv.textContent = `Provinsi ${rekaman.provinsi || '-'}`;

      wadahMetaEl.append(chipJenis, chipProv);
    }

    // 4. Daftar kabupaten/kota (sebagai chips jika tersedia / multi-kabupaten)
    if (wadahKabChipsEl) {
      wadahKabChipsEl.textContent = '';
      const daftarKab = Array.isArray(rekaman.kabupaten_daftar) && rekaman.kabupaten_daftar.length > 0
        ? rekaman.kabupaten_daftar
        : rekaman.kabupaten
        ? [rekaman.kabupaten]
        : [];

      if (daftarKab.length > 0) {
        wadahKabChipsEl.hidden = false;
        const labelKab = document.createElement('p');
        labelKab.className = 'label-kecil';
        labelKab.style.marginBottom = '6px';
        labelKab.textContent =
          daftarKab.length > 1
            ? `Tercatat di ${formatAngka(daftarKab.length)} Kabupaten/Kota:`
            : 'Lokasi Kabupaten/Kota:';

        const listEl = document.createElement('ul');
        listEl.className = 'daftar-chip';
        for (const namaKab of daftarKab) {
          const li = document.createElement('li');
          li.className = 'dialog-chip-terang';
          li.textContent = namaKab;
          listEl.appendChild(li);
        }

        wadahKabChipsEl.append(labelKab, listEl);
      } else {
        wadahKabChipsEl.hidden = true;
      }
    }

    // 5. Deskripsi lengkap dengan pemecah paragraf & "Tampilkan semua" bila > 1.500 karakter
    if (wadahDeskripsiEl) {
      wadahDeskripsiEl.textContent = '';
      const teksAsli = String(rekaman.deskripsi || '').trim();

      if (!rekaman.punya_deskripsi || !teksAsli) {
        const pKosong = document.createElement('p');
        pKosong.style.color = 'var(--tinta-2)';
        pKosong.style.fontStyle = 'italic';
        pKosong.textContent = 'SPKT belum memuat deskripsi untuk objek ini.';
        wadahDeskripsiEl.appendChild(pKosong);
      } else {
        const paragrafList = pecahParagrafDeskripsi(teksAsli, 3);
        const perluPotong = teksAsli.length > 1500 && paragrafList.length > 2;

        if (!perluPotong) {
          for (const par of paragrafList) {
            const p = document.createElement('p');
            p.textContent = par;
            wadahDeskripsiEl.appendChild(p);
          }
        } else {
          // Tampilkan paragraf awal hingga ±1.200 karakter
          let akumulasiKarakter = 0;
          let batasIndeks = 0;
          for (let i = 0; i < paragrafList.length; i++) {
            akumulasiKarakter += paragrafList[i].length;
            batasIndeks = i + 1;
            if (akumulasiKarakter >= 1200) break;
          }

          const paragrafAwal = paragrafList.slice(0, batasIndeks);
          const paragrafSisa = paragrafList.slice(batasIndeks);

          for (const par of paragrafAwal) {
            const p = document.createElement('p');
            p.textContent = par;
            wadahDeskripsiEl.appendChild(p);
          }

          if (paragrafSisa.length > 0) {
            const wadahSisa = document.createElement('div');
            wadahSisa.className = 'dialog-paragraf-lanjutan';

            const tombolTampilkanSemua = document.createElement('button');
            tombolTampilkanSemua.type = 'button';
            tombolTampilkanSemua.className = 'tombol tombol--garis';
            tombolTampilkanSemua.style.marginTop = 'var(--ruang-3)';
            tombolTampilkanSemua.textContent = `Tampilkan semua (${formatAngka(teksAsli.length)} karakter)`;

            tombolTampilkanSemua.addEventListener('click', () => {
              tombolTampilkanSemua.remove();
              // Render bertahap dengan DocumentFragment agar deskripsi 26 ribu karakter tetap mulus
              const frag = document.createDocumentFragment();
              for (const par of paragrafSisa) {
                const p = document.createElement('p');
                p.textContent = par;
                frag.appendChild(p);
              }
              wadahSisa.appendChild(frag);
            });

            wadahDeskripsiEl.append(wadahSisa, tombolTampilkanSemua);
          }
        }
      }
    }

    // 6. Keterangan sumber & Tahun pencatatan (wajib label "Tahun pencatatan")
    if (wadahKakiSumberEl) {
      wadahKakiSumberEl.textContent = '';

      const pSumber = document.createElement('p');
      pSumber.textContent = `Sumber: SPKT – Kementerian Kebudayaan RI (diambil ${tanggalData})`;
      wadahKakiSumberEl.appendChild(pSumber);

      if (rekaman.tahun_input) {
        const pTahun = document.createElement('p');
        pTahun.textContent = `Tahun pencatatan: ${rekaman.tahun_input}`;
        wadahKakiSumberEl.appendChild(pTahun);
      }
    }

    kontrol.buka(pemicuEl);
  }

  return {
    bukaRekaman,
    tutup: kontrol.tutup,
    aturTanggalAmbil
  };
}
