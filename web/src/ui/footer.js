/**
 * footer.js — Merender atribusi dinamis di footer dan mengelola dialog "Tentang Data"
 * Sesuai AGENTS.md Aturan Emas #7 & WEB_SPEC.md Bagian 3 (Footer / Tentang data).
 */

import { TEKS } from '../content/teks.js';
import { pasangPerilakuDialog } from '../util/a11y.js';

/**
 * Menginisialisasi dialog "Tentang Data & Keterbatasan" serta tombol pemicunya di footer.
 * @returns {{ buka: (pemicu?: HTMLElement) => void, tutup: () => void }}
 */
export function inisialisasiDialogTentang() {
  const dialogEl = document.getElementById('dialog-tentang');
  const judulEl = document.getElementById('dialog-tentang-judul');
  const tombolTutupEl = document.getElementById('tombol-tutup-tentang');
  const tombolBukaFooter = document.getElementById('footer-tombol-tentang');
  const daftarKeterbatasanEl = document.getElementById('daftar-keterbatasan-data');

  // Isi daftar keterbatasan data secara aman menggunakan textContent
  if (daftarKeterbatasanEl && daftarKeterbatasanEl.children.length === 0) {
    for (const butir of TEKS.tentangData.butirKeterbatasan) {
      const li = document.createElement('li');
      li.textContent = butir;
      daftarKeterbatasanEl.appendChild(li);
    }
  }

  const kontrol = pasangPerilakuDialog(dialogEl, judulEl);

  if (tombolTutupEl) {
    tombolTutupEl.addEventListener('click', () => kontrol.tutup());
  }

  if (tombolBukaFooter) {
    tombolBukaFooter.addEventListener('click', () => kontrol.buka(tombolBukaFooter));
  }

  return kontrol;
}

/**
 * Memperbarui teks atribusi dan tanggal pengambilan data dari meta.clean.json
 * di seluruh elemen footer dan dialog tentang data.
 *
 * Wajib menampilkan:
 * "Data: SPKT – Kementerian Kebudayaan RI, diambil {tanggal_ambil_terformat}"
 * dengan tautan ke https://spkt.kemenbud.go.id
 *
 * @param {object} meta - Isi dari meta.clean.json
 */
export function perbaruiAtribusiFooter(meta) {
  if (!meta) return;

  const tanggalTerformat = meta.tanggal_ambil_terformat || '9 Oktober 2026';
  const urlSumber = meta.url_sumber || 'https://spkt.kemenbud.go.id';
  const namaSumber = meta.sumber || 'SPKT – Sistem Pendataan Kebudayaan Terpadu, Kementerian Kebudayaan RI';

  const wadahAtribusiFooter = document.getElementById('footer-atribusi-dinamis');
  if (wadahAtribusiFooter) {
    wadahAtribusiFooter.textContent = '';

    const teksAwal = document.createTextNode('Data: ');
    const tautan = document.createElement('a');
    tautan.href = urlSumber;
    tautan.target = '_blank';
    tautan.rel = 'noopener noreferrer';
    tautan.textContent = 'SPKT – Kementerian Kebudayaan RI';

    const teksTanggal = document.createTextNode(`, diambil ${tanggalTerformat}`);

    wadahAtribusiFooter.append(teksAwal, tautan, teksTanggal);
  }

  const wadahAtribusiDialog = document.getElementById('dialog-atribusi-dinamis');
  if (wadahAtribusiDialog) {
    wadahAtribusiDialog.textContent = '';

    const p = document.createElement('p');
    p.append(document.createTextNode(`Sumber resmi: ${namaSumber} (`));

    const tautan = document.createElement('a');
    tautan.href = urlSumber;
    tautan.target = '_blank';
    tautan.rel = 'noopener noreferrer';
    tautan.textContent = urlSumber;

    p.append(tautan, document.createTextNode(`), diambil pada ${tanggalTerformat}.`));
    wadahAtribusiDialog.appendChild(p);
  }

  // Perbarui seluruh penanda tanggal statistik di halaman
  const elemenTanggal = document.querySelectorAll('[data-tanggal-ambil]');
  for (const el of elemenTanggal) {
    el.textContent = tanggalTerformat;
  }
}
