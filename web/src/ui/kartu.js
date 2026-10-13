/**
 * kartu.js — Komponen Kartu Cerita (<article>)
 * Sesuai WEB_SPEC.md Bagian 4.2:
 * - Varian: 'unggulan', 'biasa', 'tanpa-deskripsi'
 * - Ornamen pola generatif di bagian atas (96–140 px)
 * - Lencana jenis (warna + teks)
 * - Lencana multi-kabupaten ("Tercatat di {jumlah_lokasi} kabupaten") bila > 1
 * - Keadaan tanpa deskripsi: menampilkan "SPKT belum memuat deskripsi untuk objek ini." tanpa tombol baca.
 */

import { buatPolaKartuSvg } from '../patterns/generate.js';
import { LABEL_JENIS } from '../map/scales.js';
import { formatAngka } from '../util/format.js';

/**
 * Menentukan teks pendek jenis/kategori untuk lencana kartu.
 * @param {object} rekaman
 */
export function dapatkanLabelPendekJenis(rekaman) {
  const katKode = String(rekaman?.kategori_kode || '');
  const jenisKode = String(rekaman?.jenis_kode || '');

  if (katKode === 'OPK' && LABEL_JENIS[jenisKode]) {
    return {
      kodeWarna: jenisKode,
      teks: LABEL_JENIS[jenisKode]
    };
  }

  if (katKode === 'CB') {
    return {
      kodeWarna: 'cagar',
      teks: `Cagar Budaya • ${rekaman.jenis || 'Objek'}`
    };
  }

  return {
    kodeWarna: 'cagar',
    teks: `${rekaman?.kategori || 'Budaya'}${rekaman?.jenis ? ` • ${rekaman.jenis}` : ''}`
  };
}

/**
 * Menyusun string lokasi yang rapi untuk kartu.
 * @param {object} rekaman
 */
export function formatLokasiRekaman(rekaman) {
  const prov = rekaman?.provinsi || 'Indonesia';
  const daftarKab = Array.isArray(rekaman?.kabupaten_daftar) ? rekaman.kabupaten_daftar : [];

  if (daftarKab.length > 1) {
    return `${daftarKab[0]} & ${daftarKab.length - 1} kab/kota lain, ${prov}`;
  }
  if (daftarKab.length === 1 && daftarKab[0]) {
    return `${daftarKab[0]}, ${prov}`;
  }
  if (rekaman?.kabupaten) {
    return `${rekaman.kabupaten}, ${prov}`;
  }
  return prov;
}

/**
 * Membuat elemen DOM <article class="kartu-cerita"> untuk satu rekaman budaya.
 *
 * @param {object} rekaman - Objek dari budaya.clean.json
 * @param {object} [opsi]
 * @param {'unggulan'|'biasa'} [opsi.ukuran='biasa']
 * @param {(rekaman: object, tombolPemicu: HTMLElement) => void} [opsi.saatBacaSelengkapnya]
 * @returns {HTMLElement}
 */
export function buatElemenKartuCerita(rekaman, opsi = {}) {
  const { ukuran = 'biasa', saatBacaSelengkapnya } = opsi;
  const punyaDeskripsi = Boolean(rekaman?.punya_deskripsi && rekaman?.deskripsi);
  const varian = !punyaDeskripsi
    ? 'tanpa-deskripsi'
    : ukuran === 'unggulan'
    ? 'unggulan'
    : 'biasa';

  const article = document.createElement('article');
  article.className = `kartu-cerita kartu-cerita--${varian}`;
  article.dataset.id = rekaman.id;
  article.dataset.jenis = rekaman.jenis_kode || 'cagar';

  // 1. Ornamen Pola Generatif SVG di bagian atas
  const wadahPola = document.createElement('div');
  wadahPola.className = 'kartu-cerita-pola';
  const svgPola = buatPolaKartuSvg({
    id: rekaman.id,
    jenisKode: rekaman.jenis_kode,
    kategoriKode: rekaman.kategori_kode,
    lebar: 380,
    tinggi: ukuran === 'unggulan' ? 132 : 104
  });
  wadahPola.appendChild(svgPola);

  // Baris lencana di atas pola / badan kartu
  const isi = document.createElement('div');
  isi.className = 'kartu-cerita-isi';

  const barisLencana = document.createElement('div');
  barisLencana.className = 'kartu-cerita-lencana-baris';

  const infoJenis = dapatkanLabelPendekJenis(rekaman);
  const lencanaJenis = document.createElement('span');
  lencanaJenis.className = 'chip-jenis kartu-lencana-kecil';

  const titik = document.createElement('span');
  titik.className = 'chip-titik';
  titik.dataset.jenis = infoJenis.kodeWarna;
  titik.setAttribute('aria-hidden', 'true');

  const teksJenis = document.createElement('span');
  teksJenis.textContent = infoJenis.teks;
  lencanaJenis.append(titik, teksJenis);
  barisLencana.appendChild(lencanaJenis);

  // Lencana entri gabungan multi-kabupaten (WEB_SPEC.md 4.2)
  const jumlahLokasi = Number(rekaman.jumlah_lokasi || 1);
  if (jumlahLokasi > 1) {
    const lencanaMulti = document.createElement('span');
    lencanaMulti.className = 'kartu-lencana-multi';
    lencanaMulti.textContent = `Tercatat di ${formatAngka(jumlahLokasi)} kabupaten`;
    barisLencana.appendChild(lencanaMulti);
  }

  // 2. Judul & Lokasi
  const judul = document.createElement('h3');
  judul.className = 'kartu-cerita-judul';
  judul.textContent = rekaman.nama_tampil || rekaman.nama || 'Tanpa Judul';

  const lokasi = document.createElement('p');
  lokasi.className = 'kartu-cerita-lokasi';
  lokasi.textContent = formatLokasiRekaman(rekaman);

  isi.append(barisLencana, judul, lokasi);

  // 3. Ringkasan atau Keadaan Tanpa Deskripsi
  if (punyaDeskripsi) {
    const ringkasan = document.createElement('p');
    ringkasan.className = 'kartu-cerita-ringkasan';
    ringkasan.textContent = rekaman.ringkasan || rekaman.deskripsi;
    isi.appendChild(ringkasan);

    const kaki = document.createElement('div');
    kaki.className = 'kartu-cerita-kaki';

    const tombolBaca = document.createElement('button');
    tombolBaca.type = 'button';
    tombolBaca.className = 'tombol tombol--garis kartu-tombol-baca';
    tombolBaca.textContent = 'Baca selengkapnya';
    tombolBaca.addEventListener('click', () => {
      if (typeof saatBacaSelengkapnya === 'function') {
        saatBacaSelengkapnya(rekaman, tombolBaca);
      }
    });

    kaki.appendChild(tombolBaca);
    isi.appendChild(kaki);
  } else {
    const tanpaDesk = document.createElement('p');
    tanpaDesk.className = 'kartu-cerita-kosong-teks';
    tanpaDesk.textContent = 'SPKT belum memuat deskripsi untuk objek ini.';
    isi.appendChild(tanpaDesk);
  }

  article.append(wadahPola, isi);
  return article;
}
