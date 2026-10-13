/**
 * tabel-daftar.js — Tabel semantik 38 provinsi sebagai alternatif aksesibel peta SVG
 * Sesuai WEB_SPEC.md Bagian 4.6:
 * - Memuat 38 baris: Provinsi, Total, OPK, Cagar Budaya, Status, dan Aksi
 * - Dapat diurutkan berdasarkan kolom
 * - Tombol menuju panel provinsi
 */

import { formatAngka } from '../util/format.js';

/**
 * Menginisialisasi komponen tabel daftar 38 provinsi.
 * @param {object} parameter
 * @param {HTMLElement} parameter.wadahEl
 * @param {Array} parameter.daftarProvinsi
 * @param {(kode: string, pemicuEl: HTMLElement) => void} parameter.saatPilihProvinsi
 */
export function buatTabelDaftarProvinsi({ wadahEl, daftarProvinsi = [], saatPilihProvinsi }) {
  if (!wadahEl) return null;

  let kolomUrut = 'total'; // 'kode' | 'nama' | 'total' | 'opk' | 'cb'
  let arahUrut = 'desc';   // 'asc' | 'desc'

  function urutkanData() {
    const salinan = [...daftarProvinsi];
    salinan.sort((a, b) => {
      let nilaiA;
      let nilaiB;

      if (kolomUrut === 'nama') {
        nilaiA = String(a.nama || '');
        nilaiB = String(b.nama || '');
        return arahUrut === 'asc'
          ? nilaiA.localeCompare(nilaiB, 'id')
          : nilaiB.localeCompare(nilaiA, 'id');
      }

      if (kolomUrut === 'kode') {
        nilaiA = Number(a.kode || 0);
        nilaiB = Number(b.kode || 0);
      } else if (kolomUrut === 'opk') {
        nilaiA = Number(a.per_kategori?.OPK || 0);
        nilaiB = Number(b.per_kategori?.OPK || 0);
      } else if (kolomUrut === 'cb') {
        nilaiA = Number(a.per_kategori?.CB || 0);
        nilaiB = Number(b.per_kategori?.CB || 0);
      } else {
        nilaiA = Number(a.total || 0);
        nilaiB = Number(b.total || 0);
      }

      if (nilaiA === nilaiB) {
        return String(a.kode || '').localeCompare(String(b.kode || ''));
      }
      return arahUrut === 'asc' ? nilaiA - nilaiB : nilaiB - nilaiA;
    });
    return salinan;
  }

  function ubahUrutan(kolomBaru) {
    if (kolomUrut === kolomBaru) {
      arahUrut = arahUrut === 'asc' ? 'desc' : 'asc';
    } else {
      kolomUrut = kolomBaru;
      arahUrut = kolomBaru === 'nama' || kolomBaru === 'kode' ? 'asc' : 'desc';
    }
    render();
  }

  function render() {
    wadahEl.textContent = '';

    const bungkusScroll = document.createElement('div');
    bungkusScroll.className = 'tabel-provinsi-bungkus';

    const table = document.createElement('table');
    table.className = 'tabel-provinsi';

    const caption = document.createElement('caption');
    caption.className = 'sr-only';
    caption.textContent = 'Tabel daftar 38 provinsi Indonesia beserta jumlah catatan budaya di SPKT';
    table.appendChild(caption);

    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');

    const kolomDefinisi = [
      { id: 'nama', label: 'Provinsi', bisaUrut: true },
      { id: 'total', label: 'Total Catatan', bisaUrut: true },
      { id: 'opk', label: 'OPK', bisaUrut: true },
      { id: 'cb', label: 'Cagar Budaya', bisaUrut: true },
      { id: 'status', label: 'Status Pencatatan', bisaUrut: false },
      { id: 'aksi', label: 'Detail', bisaUrut: false }
    ];

    for (const kol of kolomDefinisi) {
      const th = document.createElement('th');
      th.scope = 'col';

      if (kol.bisaUrut) {
        const sedangAktif = kolomUrut === kol.id;
        th.setAttribute(
          'aria-sort',
          sedangAktif ? (arahUrut === 'asc' ? 'ascending' : 'descending') : 'none'
        );

        const btnUrut = document.createElement('button');
        btnUrut.type = 'button';
        btnUrut.className = 'tabel-tombol-urut';
        const panah = sedangAktif ? (arahUrut === 'asc' ? ' ↑' : ' ↓') : ' ↕';
        btnUrut.textContent = `${kol.label}${panah}`;
        btnUrut.addEventListener('click', () => ubahUrutan(kol.id));
        th.appendChild(btnUrut);
      } else {
        th.textContent = kol.label;
      }

      trHead.appendChild(th);
    }

    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const dataTerurut = urutkanData();

    for (const p of dataTerurut) {
      const tr = document.createElement('tr');
      const belumTercatat = p.status_data === 'belum_tercatat' || p.total <= 0;
      if (belumTercatat) {
        tr.className = 'baris-belum-tercatat';
      }

      const thNama = document.createElement('th');
      thNama.scope = 'row';
      thNama.textContent = p.nama;

      const tdTotal = document.createElement('td');
      tdTotal.textContent = formatAngka(p.total);

      const tdOpk = document.createElement('td');
      tdOpk.textContent = formatAngka(p.per_kategori?.OPK || 0);

      const tdCb = document.createElement('td');
      tdCb.textContent = formatAngka(p.per_kategori?.CB || 0);

      const tdStatus = document.createElement('td');
      const spanStatus = document.createElement('span');
      spanStatus.className = belumTercatat ? 'status-chip status-chip--belum' : 'status-chip status-chip--ada';
      spanStatus.textContent = belumTercatat ? 'Belum tercatat di SPKT' : 'Tercatat di SPKT';
      tdStatus.appendChild(spanStatus);

      const tdAksi = document.createElement('td');
      const btnPilih = document.createElement('button');
      btnPilih.type = 'button';
      btnPilih.className = 'tombol tombol--garis tabel-tombol-pilih';
      btnPilih.textContent = 'Lihat panel';
      btnPilih.setAttribute('aria-label', `Lihat panel detail provinsi ${p.nama}`);
      btnPilih.addEventListener('click', () => {
        if (typeof saatPilihProvinsi === 'function') {
          saatPilihProvinsi(p.kode, btnPilih);
        }
      });
      tdAksi.appendChild(btnPilih);

      tr.append(thNama, tdTotal, tdOpk, tdCb, tdStatus, tdAksi);
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    bungkusScroll.appendChild(table);
    wadahEl.appendChild(bungkusScroll);
  }

  render();

  return {
    segarkan: render
  };
}
