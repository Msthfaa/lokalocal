/**
 * panel-provinsi.js — Panel detail provinsi (panel samping di desktop / bottom sheet di ponsel)
 * Sesuai WEB_SPEC.md Bagian 3 (S5), 4.5 (Keadaan kosong provinsi belum_tercatat), dan 7.2 (A-10).
 */

import { DAFTAR_JENIS_OPK } from '../config.js';
import { WARNA_JENIS_HEX } from '../map/scales.js';
import { formatAngka } from '../util/format.js';
import { gsap, apakahKurangiGerak } from '../util/motion.js';
import { tampilkanToast } from './toast.js';

const LABEL_JENIS_CB = [
  { kode: 'benda', label: 'Benda' },
  { kode: 'bangunan', label: 'Bangunan' },
  { kode: 'struktur', label: 'Struktur' },
  { kode: 'situs', label: 'Situs' },
  { kode: 'kawasan', label: 'Kawasan' }
];

/**
 * Menginisialisasi komponen Panel Detail Provinsi di bagian Jelajah.
 *
 * @param {object} parameter
 * @param {HTMLElement} parameter.wadahEl
 * @param {Array} parameter.daftarProvinsi
 * @param {string} [parameter.tanggalAmbilTerformat='9 Oktober 2026']
 * @param {(kode: string, jenisStempel: 'biasa'|'penjaga') => void} [parameter.saatCatatStempel]
 * @param {(kode: string) => void} [parameter.saatPilihProvinsiLain]
 * @param {() => void} [parameter.saatTutupPanel]
 */
export function buatPanelProvinsi({
  wadahEl,
  daftarProvinsi = [],
  tanggalAmbilTerformat = '9 Oktober 2026',
  saatCatatStempel,
  saatPilihProvinsiLain,
  saatTutupPanel
}) {
  if (!wadahEl) return null;

  const petaProv = new Map(daftarProvinsi.map((p) => [String(p.kode), p]));
  let kodeAktif = null;

  /**
   * Mencari 3 provinsi berdata terdekat berdasarkan kedekatan kode wilayah / pulau
   * untuk membantu pengunjung dari provinsi yang belum tercatat.
   */
  function cariProvinsiBerdataTerdekat(kodeTarget) {
    const angkaTarget = Number(kodeTarget || 0);
    return daftarProvinsi
      .filter((p) => p.status_data === 'ada' && p.total > 0 && p.kode !== kodeTarget)
      .sort((a, b) => Math.abs(Number(a.kode) - angkaTarget) - Math.abs(Number(b.kode) - angkaTarget))
      .slice(0, 3);
  }

  function renderKeadaanBelumDipilih() {
    wadahEl.textContent = '';
    wadahEl.classList.remove('is-terbuka');

    const kotak = document.createElement('div');
    kotak.className = 'panel-prov-placeholder';

    const kicker = document.createElement('p');
    kicker.className = 'label-kecil';
    kicker.textContent = 'Panel Provinsi';

    const judul = document.createElement('h3');
    judul.textContent = 'Pilih satu provinsi pada peta';

    const desk = document.createElement('p');
    desk.style.fontSize = 'var(--teks-kecil)';
    desk.style.color = 'var(--kertas-redup)';
    desk.textContent =
      'Klik provinsi mana pun di peta (atau pilih dari daftar tombol provinsi di bawah peta) untuk melihat rincian jenis OPK, Cagar Budaya, kabupaten teratas, dan daftar objek budayanya.';

    kotak.append(kicker, judul, desk);
    wadahEl.appendChild(kotak);
  }

  function tampilkanProvinsi(kode) {
    const dataProv = petaProv.get(String(kode));
    if (!dataProv) {
      renderKeadaanBelumDipilih();
      return;
    }

    kodeAktif = String(kode);
    wadahEl.textContent = '';
    wadahEl.classList.add('is-terbuka');

    const kartu = document.createElement('div');
    kartu.className = 'panel-prov-kartu';

    // Header Panel Provinsi
    const kepala = document.createElement('div');
    kepala.className = 'panel-prov-kepala';

    const infoJudul = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'label-kecil';
    kicker.textContent =
      dataProv.status_data === 'ada' && dataProv.peringkat_total
        ? `Kode Wilayah ${dataProv.kode} • Peringkat #${dataProv.peringkat_total} Jumlah Catatan`
        : `Kode Wilayah ${dataProv.kode}`;

    const h3 = document.createElement('h3');
    h3.className = 'panel-prov-judul';
    h3.tabIndex = -1;
    h3.textContent = dataProv.nama;

    infoJudul.append(kicker, h3);

    const btnTutup = document.createElement('button');
    btnTutup.type = 'button';
    btnTutup.className = 'tombol-tutup-panel';
    btnTutup.setAttribute('aria-label', `Tutup panel provinsi ${dataProv.nama}`);
    btnTutup.textContent = '✕ Semua Provinsi';
    btnTutup.addEventListener('click', () => {
      kodeAktif = null;
      renderKeadaanBelumDipilih();
      if (typeof saatTutupPanel === 'function') {
        saatTutupPanel();
      }
    });

    kepala.append(infoJudul, btnTutup);
    kartu.appendChild(kepala);

    const belumTercatat = dataProv.status_data === 'belum_tercatat' || dataProv.total <= 0;

    if (belumTercatat) {
      // Keadaan Kosong yang Jujur (WEB_SPEC.md Bagian 4.5)
      const blokKosong = document.createElement('div');
      blokKosong.className = 'panel-prov-kosong';

      const ornamenArsir = document.createElement('div');
      ornamenArsir.className = 'panel-prov-ornamen-arsir';
      ornamenArsir.setAttribute('aria-hidden', 'true');

      const pJujur = document.createElement('p');
      const strongJujur = document.createElement('strong');
      strongJujur.textContent = 'Belum tercatat di SPKT. ';
      pJujur.append(
        strongJujur,
        document.createTextNode(
          `Bukan berarti tidak ada budaya di ${dataProv.nama}. Datanya belum sampai ke sistem pada ${tanggalAmbilTerformat}.`
        )
      );

      const aksiPeduli = document.createElement('div');
      aksiPeduli.style.display = 'flex';
      aksiPeduli.style.flexWrap = 'wrap';
      aksiPeduli.style.gap = 'var(--ruang-2)';
      aksiPeduli.style.marginTop = 'var(--ruang-2)';

      const btnPeduli = document.createElement('button');
      btnPeduli.type = 'button';
      btnPeduli.className = 'tombol tombol--utama';
      btnPeduli.textContent = 'Tandai: aku peduli';
      btnPeduli.addEventListener('click', () => {
        btnPeduli.textContent = '✓ Ditandai sebagai Penjaga Cerita';
        btnPeduli.disabled = true;
        if (typeof saatCatatStempel === 'function') {
          saatCatatStempel(dataProv.kode, 'penjaga');
        }
        tampilkanToast(`Stempel "Penjaga Cerita" untuk ${dataProv.nama} ditambahkan!`);
      });

      aksiPeduli.appendChild(btnPeduli);
      blokKosong.append(ornamenArsir, pJujur, aksiPeduli);

      // Provinsi berdata di kawasan terdekat
      const tetangga = cariProvinsiBerdataTerdekat(dataProv.kode);
      if (tetangga.length > 0) {
        const subTetangga = document.createElement('div');
        subTetangga.style.marginTop = 'var(--ruang-3)';

        const labelTetangga = document.createElement('p');
        labelTetangga.className = 'label-kecil';
        labelTetangga.style.marginBottom = '8px';
        labelTetangga.textContent = 'Lihat provinsi lain di kawasan terdekat:';

        const listTetangga = document.createElement('div');
        listTetangga.className = 'daftar-chip';

        for (const t of tetangga) {
          const btnT = document.createElement('button');
          btnT.type = 'button';
          btnT.className = 's4-chip-tombol';
          btnT.textContent = `${t.nama} (${formatAngka(t.total)})`;
          btnT.addEventListener('click', () => {
            if (typeof saatPilihProvinsiLain === 'function') {
              saatPilihProvinsiLain(t.kode);
            }
          });
          listTetangga.appendChild(btnT);
        }

        subTetangga.append(labelTetangga, listTetangga);
        blokKosong.appendChild(subTetangga);
      }

      kartu.appendChild(blokKosong);
    } else {
      // Provinsi Berdata: catat stempel biasa
      if (typeof saatCatatStempel === 'function') {
        saatCatatStempel(dataProv.kode, 'biasa');
      }

      // 1. Ringkasan Metrik Provinsi
      const barMetrik = document.createElement('div');
      barMetrik.className = 'panel-prov-metrik-grid';

      const itemTotal = buatKotakMiniMetrik(
        formatAngka(dataProv.total),
        'Total Catatan SPKT',
        dataProv.total !== dataProv.total_setelah_gabung
          ? `${formatAngka(dataProv.total_setelah_gabung)} catatan unik`
          : 'Catatan terverifikasi'
      );
      const itemOpk = buatKotakMiniMetrik(
        formatAngka(dataProv.per_kategori?.OPK || 0),
        'Objek Pemajuan (OPK)',
        '5 jenis tradisi & seni'
      );
      const itemCb = buatKotakMiniMetrik(
        formatAngka(dataProv.per_kategori?.CB || 0),
        'Cagar Budaya',
        'Warisan kebendaan'
      );

      barMetrik.append(itemTotal, itemOpk, itemCb);
      kartu.appendChild(barMetrik);

      // 2. Rincian 5 Jenis OPK (Bar Kecil Berwarna)
      const blokOpk = document.createElement('div');
      blokOpk.className = 'panel-prov-seksi';

      const judulOpk = document.createElement('p');
      judulOpk.className = 'label-kecil';
      judulOpk.textContent = 'Rincian 5 Jenis Objek Pemajuan Kebudayaan (OPK)';
      blokOpk.appendChild(judulOpk);

      const listBarOpk = document.createElement('div');
      listBarOpk.className = 'panel-prov-bar-list';

      const jenisOpkSaja = DAFTAR_JENIS_OPK.filter((j) => j.kode !== 'cagar');
      const maksJenis = Math.max(
        1,
        ...jenisOpkSaja.map((j) => Number(dataProv.per_jenis_opk?.[j.kode] || 0))
      );

      for (const j of jenisOpkSaja) {
        const nilai = Number(dataProv.per_jenis_opk?.[j.kode] || 0);
        const baris = document.createElement('div');
        baris.className = 'panel-prov-bar-item';

        const atas = document.createElement('div');
        atas.className = 'panel-prov-bar-info';

        const kiri = document.createElement('span');
        kiri.style.display = 'inline-flex';
        kiri.style.alignItems = 'center';
        kiri.style.gap = '6px';

        const titik = document.createElement('span');
        titik.className = 'chip-titik';
        titik.dataset.jenis = j.kode;
        titik.setAttribute('aria-hidden', 'true');

        const teksLabel = document.createElement('span');
        teksLabel.textContent = j.label;
        kiri.append(titik, teksLabel);

        const kanan = document.createElement('strong');
        kanan.textContent = formatAngka(nilai);

        atas.append(kiri, kanan);

        const trek = document.createElement('div');
        trek.className = 'panel-prov-bar-trek';
        const isi = document.createElement('div');
        isi.className = 'panel-prov-bar-isi';
        isi.style.width = `${ nilai > 0 ? Math.max(6, Math.round((nilai / maksJenis) * 100)) : 0 }%`;
        isi.style.backgroundColor = WARNA_JENIS_HEX[j.kode] || '#E6B14A';

        trek.appendChild(isi);
        baris.append(atas, trek);
        listBarOpk.appendChild(baris);
      }

      blokOpk.appendChild(listBarOpk);
      kartu.appendChild(blokOpk);

      // 3. Ringkasan Cagar Budaya, Lembaga, Sarana & SDM Agregat
      const totalCb = Number(dataProv.per_kategori?.CB || 0);
      const totalLb = Number(dataProv.per_kategori?.LB || 0);
      const totalSp = Number(dataProv.per_kategori?.SP || 0);
      const sdmAgregat = Number(dataProv.sdm_agregat || 0);

      if (totalCb > 0 || totalLb > 0 || totalSp > 0 || sdmAgregat > 0) {
        const blokCb = document.createElement('div');
        blokCb.className = 'panel-prov-seksi';

        const judulCb = document.createElement('p');
        judulCb.className = 'label-kecil';
        judulCb.textContent = 'Cagar Budaya & Kategori Lainnya';
        blokCb.appendChild(judulCb);

        const chipsCb = document.createElement('div');
        chipsCb.className = 'daftar-chip';

        for (const itemCb of LABEL_JENIS_CB) {
          const n = Number(dataProv.per_jenis_cb?.[itemCb.kode] || 0);
          if (n > 0) {
            const span = document.createElement('span');
            span.className = 'chip-jenis kartu-lencana-kecil';
            span.textContent = `${itemCb.label}: ${formatAngka(n)}`;
            chipsCb.appendChild(span);
          }
        }

        if (totalLb > 0) {
          const spanLb = document.createElement('span');
          spanLb.className = 'chip-jenis kartu-lencana-kecil';
          spanLb.textContent = `Lembaga Budaya: ${formatAngka(totalLb)}`;
          chipsCb.appendChild(spanLb);
        }

        if (totalSp > 0) {
          const spanSp = document.createElement('span');
          spanSp.className = 'chip-jenis kartu-lencana-kecil';
          spanSp.textContent = `Sarana & Prasarana: ${formatAngka(totalSp)}`;
          chipsCb.appendChild(spanSp);
        }

        if (sdmAgregat > 0) {
          const spanSdm = document.createElement('span');
          spanSdm.className = 'chip-jenis kartu-lencana-kecil';
          spanSdm.textContent = `SDM Kebudayaan (agregat): ${formatAngka(sdmAgregat)}`;
          chipsCb.appendChild(spanSdm);
        }

        blokCb.appendChild(chipsCb);
        kartu.appendChild(blokCb);
      }

      // 4. Kabupaten / Kota Teratas
      if (Array.isArray(dataProv.kabupaten_teratas) && dataProv.kabupaten_teratas.length > 0) {
        const blokKab = document.createElement('div');
        blokKab.className = 'panel-prov-seksi';

        const judulKab = document.createElement('p');
        judulKab.className = 'label-kecil';
        judulKab.textContent = 'Kabupaten / Kota Teratas';
        blokKab.appendChild(judulKab);

        const listKab = document.createElement('ul');
        listKab.className = 'daftar-chip';

        for (const k of dataProv.kabupaten_teratas) {
          const li = document.createElement('li');
          li.className = 'chip-jenis kartu-lencana-kecil';
          li.textContent = `${k.nama} (${formatAngka(k.jumlah)})`;
          listKab.appendChild(li);
        }

        blokKab.appendChild(listKab);
        kartu.appendChild(blokKab);
      }
    }

    wadahEl.appendChild(kartu);

    // Animasi A-10: Panel provinsi masuk dengan halus
    if (!apakahKurangiGerak()) {
      const adalahPonsel = window.matchMedia('(max-width: 768px)').matches;
      gsap.fromTo(
        kartu,
        adalahPonsel ? { y: 28, opacity: 0 } : { x: 24, opacity: 0 },
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration: 0.45,
          ease: 'power3.out'
        }
      );
    }
  }

  function buatKotakMiniMetrik(angka, label, ket) {
    const div = document.createElement('div');
    div.className = 'panel-prov-metrik-item';

    const spanAngka = document.createElement('span');
    spanAngka.className = 'panel-prov-metrik-angka';
    spanAngka.textContent = angka;

    const spanLabel = document.createElement('span');
    spanLabel.className = 'panel-prov-metrik-label';
    spanLabel.textContent = label;

    const spanKet = document.createElement('span');
    spanKet.className = 'panel-prov-metrik-ket';
    spanKet.textContent = ket;

    div.append(spanAngka, spanLabel, spanKet);
    return div;
  }

  renderKeadaanBelumDipilih();

  return {
    tampilkanProvinsi,
    resetPanel: renderKeadaanBelumDipilih,
    dapatkanKodeAktif: () => kodeAktif
  };
}
