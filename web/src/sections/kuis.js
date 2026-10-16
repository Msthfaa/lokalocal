/**
 * kuis.js (section) — Antarmuka Kuis Interaktif 8 Soal Budaya Nusantara
 * Sesuai WEB_SPEC.md Bagian 8.2 & Kaidah Anti-Slop:
 * - Desain kuratorial bersih tanpa ornamen klise (tanpa bintang kelip, tanpa emoji acak).
 * - Progress bar bersegmen 8 langkah yang jelas.
 * - Opsi jawaban terindeks abjad (A, B, C, D) dengan status feedback elegan.
 * - Kotak petunjuk arsip resmi SPKT berformat kutipan historis.
 * - Ringkasan akhir berbobot dengan 3 kartu tradisi penemuan baru.
 */

import { buatSesiKuis } from '../features/kuis.js';
import { formatAngka } from '../util/format.js';
import { tampilkanToast } from '../ui/toast.js';

const ABJAD_OPSI = ['A', 'B', 'C', 'D'];

/**
 * Menginisialisasi UI Kuis 8 Soal di bagian S7 dan halaman kuis.html.
 *
 * @param {object} parameter
 * @param {Array} parameter.daftarProvinsi
 * @param {object} parameter.statistik
 * @param {(kode: string) => void} parameter.saatLihatProvinsiDiPeta
 * @param {(rekaman: object, pemicuEl: HTMLElement) => void} parameter.saatBukaDetailRekaman
 */
export function inisialisasiBagianKuis({
  daftarProvinsi = [],
  statistik = {},
  saatLihatProvinsiDiPeta,
  saatBukaDetailRekaman
}) {
  const wadahUtama = document.getElementById('s7-panel-kuis');
  if (!wadahUtama) return null;

  let daftarBudaya = [];
  let dataSiap = false;

  let statusLayar = 'awal'; // 'awal' | 'bermain' | 'hasil'
  let daftarSoal = [];
  let indeksSoalAktif = 0;
  let skor = 0;
  let jawabanDipilih = null;
  let tradisiDitemui = [];

  function mulaiSesiBaru() {
    if (!dataSiap || daftarBudaya.length === 0) return;
    daftarSoal = buatSesiKuis({
      budaya: daftarBudaya,
      provinsi: daftarProvinsi,
      statistik
    });
    indeksSoalAktif = 0;
    skor = 0;
    jawabanDipilih = null;
    tradisiDitemui = daftarSoal
      .filter((s) => s.rekamanTerkait)
      .map((s) => s.rekamanTerkait)
      .slice(0, 3);
    statusLayar = 'bermain';
    render();
  }

  function pilihJawaban(opsiTeks) {
    if (jawabanDipilih !== null) return;
    jawabanDipilih = opsiTeks;
    const soalSekarang = daftarSoal[indeksSoalAktif];
    if (soalSekarang && opsiTeks === soalSekarang.jawabanBenar) {
      skor += 1;
    }
    render(true);
  }

  function lanjutSoalBerikutnya() {
    if (indeksSoalAktif + 1 < daftarSoal.length) {
      indeksSoalAktif += 1;
      jawabanDipilih = null;
      render();
    } else {
      statusLayar = 'hasil';
      render(true);
    }
  }

  function dapatkanPesanHasil(skorAkhir, total) {
    if (skorAkhir >= 7) {
      return 'Ketajaman wawasanmu luar biasa. Kamu mengenali ragam budaya dan membaca pola pencatatan data Nusantara dengan sangat cermat.';
    }
    if (skorAkhir >= 4) {
      return 'Pemahaman dasar yang sangat baik! Berbagai tradisi daerah yang unik kini semakin terekam jelas dalam ingatanmu.';
    }
    return 'Setiap jawaban adalah pintu penemuan baru. Terus telusuri katalog budaya untuk mengenal warisan Nusantara yang belum banyak diketahui.';
  }

  function render(fokusKeUmpanBalik = false) {
    wadahUtama.textContent = '';

    // =========================================================================
    // 1. Header Kartu Kuis (Kuratorial & Progress Bar Bersegmen)
    // =========================================================================
    const kepala = document.createElement('div');
    kepala.className = 'kuis-kartu-kepala';

    const barisAtas = document.createElement('div');
    barisAtas.className = 'kuis-kartu-baris-atas';

    const infoKiri = document.createElement('div');
    infoKiri.className = 'kuis-kartu-meta-kiri';

    if (statusLayar === 'bermain') {
      const soal = daftarSoal[indeksSoalAktif];
      const tagKategori = document.createElement('span');
      tagKategori.className = 'kuis-label-kategori';
      tagKategori.textContent = soal?.labelTipe || 'Tantangan Budaya';

      const judulSoal = document.createElement('h3');
      judulSoal.className = 'kuis-kartu-judul';
      judulSoal.textContent = `Pertanyaan ${indeksSoalAktif + 1} dari ${daftarSoal.length}`;

      infoKiri.append(tagKategori, judulSoal);
      barisAtas.appendChild(infoKiri);

      const skorChip = document.createElement('div');
      skorChip.className = 'kuis-lencana-skor-live';
      skorChip.innerHTML = `<span class="kuis-lencana-skor-label">Skor</span><span class="kuis-lencana-skor-angka">${skor}</span>`;
      barisAtas.appendChild(skorChip);
    } else if (statusLayar === 'hasil') {
      const tagKategori = document.createElement('span');
      tagKategori.className = 'kuis-label-kategori';
      tagKategori.textContent = 'Evaluasi Akhir';

      const judulHasil = document.createElement('h3');
      judulHasil.className = 'kuis-kartu-judul';
      judulHasil.textContent = 'Rangkuman Penelusuran Budaya';

      infoKiri.append(tagKategori, judulHasil);
      barisAtas.appendChild(infoKiri);
    } else {
      const tagKategori = document.createElement('span');
      tagKategori.className = 'kuis-label-kategori';
      tagKategori.textContent = 'Kurasi Terbuka SPKT';

      const judulAwal = document.createElement('h3');
      judulAwal.className = 'kuis-kartu-judul';
      judulAwal.textContent = 'Eksplorasi Wawasan 8 Soal';

      infoKiri.append(tagKategori, judulAwal);
      barisAtas.appendChild(infoKiri);
    }

    kepala.appendChild(barisAtas);

    // Progress Bar Bersegmen 8 Langkah (Hanya tampil saat bermain)
    if (statusLayar === 'bermain' && daftarSoal.length > 0) {
      const barProgres = document.createElement('div');
      barProgres.className = 'kuis-segmen-bar';
      barProgres.setAttribute('role', 'progressbar');
      barProgres.setAttribute('aria-valuenow', indeksSoalAktif + 1);
      barProgres.setAttribute('aria-valuemin', 1);
      barProgres.setAttribute('aria-valuemax', daftarSoal.length);
      barProgres.setAttribute('aria-label', `Soal ${indeksSoalAktif + 1} dari ${daftarSoal.length}`);

      for (let i = 0; i < daftarSoal.length; i++) {
        const segmen = document.createElement('span');
        segmen.className = 'kuis-segmen-item';
        if (i < indeksSoalAktif) {
          segmen.classList.add('is-lewat');
        } else if (i === indeksSoalAktif) {
          segmen.classList.add('is-aktif');
        }
        barProgres.appendChild(segmen);
      }
      kepala.appendChild(barProgres);
    }

    wadahUtama.appendChild(kepala);

    // =========================================================================
    // 2. Layar Awal (Briefing & Pengenalan Tantangan)
    // =========================================================================
    if (statusLayar === 'awal') {
      const badanAwal = document.createElement('div');
      badanAwal.className = 'kuis-badan-konten';

      const deskripsiAwal = document.createElement('p');
      deskripsiAwal.className = 'kuis-paragraf-pembuka';
      deskripsiAwal.textContent =
        'Setiap pertanyaan diracik secara objektif dari data resmi Sistem Pendataan Kebudayaan Terpadu (SPKT) Kementerian Kebudayaan RI, menguji wawasan faktual tanpa asumsi atau tebakan fiktif.';

      // Tiga Pilar Tantangan yang Diuji
      const gridPilar = document.createElement('div');
      gridPilar.className = 'kuis-pilar-awal-grid';

      const dataPilar = [
        {
          nomor: '01',
          judul: 'Asal Usul Geografis',
          isi: 'Mengenali provinsi asal tradisi dan warisan dari petunjuk ringkasan catatan sejarah.'
        },
        {
          nomor: '02',
          judul: 'Klasifikasi Objek Budaya',
          isi: 'Membedakan kategori OPK (Kerajinan, Seni, Tradisi Lisan, Pengetahuan, dan Adat).'
        },
        {
          nomor: '03',
          judul: 'Realitas Data Terbuka',
          isi: 'Mencermati sebaran pencatatan, konsentrasi wilayah, dan provinsi yang belum tercatat.'
        }
      ];

      dataPilar.forEach((item) => {
        const kartuPilar = document.createElement('div');
        kartuPilar.className = 'kuis-pilar-item';
        kartuPilar.innerHTML = `
          <span class="kuis-pilar-nomor">${item.nomor}</span>
          <h4 class="kuis-pilar-judul">${item.judul}</h4>
          <p class="kuis-pilar-isi">${item.isi}</p>
        `;
        gridPilar.appendChild(kartuPilar);
      });

      const barisAksiMulai = document.createElement('div');
      barisAksiMulai.className = 'kuis-awal-aksi';

      const btnMulai = document.createElement('button');
      btnMulai.type = 'button';
      btnMulai.className = 'tombol tombol--utama kuis-tombol-mulai';
      btnMulai.disabled = !dataSiap;
      btnMulai.innerHTML = dataSiap
        ? '<span>Mulai Tantangan (8 Soal)</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>'
        : '<span>Menyiapkan bank data budaya...</span>';
      btnMulai.addEventListener('click', () => mulaiSesiBaru());

      const catatanData = document.createElement('span');
      catatanData.className = 'kuis-awal-catatan';
      catatanData.textContent = dataSiap
        ? '• Bank data siap dari 493 catatan tervalidasi'
        : '• Sedang membaca arsip lokal...';

      barisAksiMulai.append(btnMulai, catatanData);
      badanAwal.append(deskripsiAwal, gridPilar, barisAksiMulai);
      wadahUtama.appendChild(badanAwal);
      return;
    }

    // =========================================================================
    // 3. Layar Bermain (Pertanyaan, Arsip Petunjuk, dan Opsi Abjad)
    // =========================================================================
    if (statusLayar === 'bermain') {
      const soal = daftarSoal[indeksSoalAktif];
      if (!soal) return;

      const badanSoal = document.createElement('div');
      badanSoal.className = 'kuis-badan-konten';

      // Kalimat Pertanyaan Utama
      const judulTanya = document.createElement('h4');
      judulTanya.className = 'kuis-pertanyaan-teks';
      judulTanya.textContent = soal.pertanyaan;

      // Kotak Kutipan Arsip Resmi SPKT
      const kotakArsip = document.createElement('div');
      kotakArsip.className = 'kuis-kotak-arsip';

      const arsipKepala = document.createElement('div');
      arsipKepala.className = 'kuis-arsip-kepala';
      arsipKepala.innerHTML = `
        <svg class="kuis-arsip-ikon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <span class="kuis-arsip-sumber-label">Petunjuk dari Catatan Resmi SPKT:</span>
      `;

      const isiKutipan = document.createElement('blockquote');
      isiKutipan.className = 'kuis-arsip-kutipan';
      isiKutipan.textContent = `“${soal.petunjuk}”`;

      kotakArsip.append(arsipKepala, isiKutipan);

      // Daftar Pilihan Jawaban dengan Label Abjad (A, B, C, D)
      const grupPilihan = document.createElement('div');
      grupPilihan.className = 'kuis-opsi-grup';
      grupPilihan.setAttribute('role', 'group');
      grupPilihan.setAttribute('aria-label', 'Pilihan jawaban kuis');

      soal.pilihan.forEach((teksOpsi, idx) => {
        const btnOpsi = document.createElement('button');
        btnOpsi.type = 'button';
        btnOpsi.className = 'kuis-opsi-kartu';

        const hurufAbjad = ABJAD_OPSI[idx] || String(idx + 1);
        const sudahMenjawab = jawabanDipilih !== null;
        const adalahBenar = teksOpsi === soal.jawabanBenar;
        const adalahPilihanKita = teksOpsi === jawabanDipilih;

        if (sudahMenjawab) {
          btnOpsi.disabled = true;
          if (adalahBenar) {
            btnOpsi.classList.add('is-jawaban-benar');
          } else if (adalahPilihanKita && !adalahBenar) {
            btnOpsi.classList.add('is-jawaban-salah');
          } else {
            btnOpsi.classList.add('is-bukan-pilihan');
          }
        }

        const lencanaHuruf = document.createElement('span');
        lencanaHuruf.className = 'kuis-opsi-huruf';
        lencanaHuruf.textContent = hurufAbjad;

        const teksLabel = document.createElement('span');
        teksLabel.className = 'kuis-opsi-label';
        teksLabel.textContent = teksOpsi;

        btnOpsi.append(lencanaHuruf, teksLabel);

        // Status Badge Tambahan Saat Selesai Menjawab
        if (sudahMenjawab) {
          const badgeStatus = document.createElement('span');
          badgeStatus.className = 'kuis-opsi-status-badge';
          if (adalahBenar) {
            badgeStatus.textContent = 'Tercatat Benar';
            btnOpsi.appendChild(badgeStatus);
          } else if (adalahPilihanKita && !adalahBenar) {
            badgeStatus.textContent = 'Pilihanmu';
            btnOpsi.appendChild(badgeStatus);
          }
        }

        btnOpsi.addEventListener('click', () => pilihJawaban(teksOpsi));
        grupPilihan.appendChild(btnOpsi);
      });

      badanSoal.append(judulTanya, kotakArsip, grupPilihan);

      // Kotak Umpan Balik dan Penjelasan Budaya
      if (jawabanDipilih !== null) {
        const benar = jawabanDipilih === soal.jawabanBenar;
        const kotakUmpan = document.createElement('div');
        kotakUmpan.className = `kuis-umpan-kartu ${benar ? 'is-benar' : 'is-salah'}`;
        kotakUmpan.tabIndex = -1;

        const headerUmpan = document.createElement('div');
        headerUmpan.className = 'kuis-umpan-kepala';

        const ikonStatus = document.createElement('span');
        ikonStatus.className = 'kuis-umpan-ikon-bulat';
        ikonStatus.innerHTML = benar
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

        const teksStatus = document.createElement('h5');
        teksStatus.className = 'kuis-umpan-status-teks';
        teksStatus.textContent = benar
          ? 'Catatanmu tepat sekali!'
          : `Belum tepat. Jawaban tercatat: ${soal.jawabanBenar}`;

        headerUmpan.append(ikonStatus, teksStatus);

        const teksPenjelasan = document.createElement('p');
        teksPenjelasan.className = 'kuis-umpan-penjelasan';
        teksPenjelasan.textContent = soal.penjelasan;

        const barisAksi = document.createElement('div');
        barisAksi.className = 'kuis-umpan-aksi-baris';

        if (soal.kodeProvinsiTerkait) {
          const btnLihatPeta = document.createElement('button');
          btnLihatPeta.type = 'button';
          btnLihatPeta.className = 'tombol tombol--garis';
          btnLihatPeta.innerHTML = '<span>Lihat Peta 3D</span>';
          btnLihatPeta.addEventListener('click', () => {
            if (typeof saatLihatProvinsiDiPeta === 'function') {
              saatLihatProvinsiDiPeta(soal.kodeProvinsiTerkait);
            }
            const elJelajah = document.getElementById('jelajah');
            if (elJelajah) {
              elJelajah.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
          barisAksi.appendChild(btnLihatPeta);
        }

        if (soal.rekamanTerkait && typeof saatBukaDetailRekaman === 'function') {
          const btnDetail = document.createElement('button');
          btnDetail.type = 'button';
          btnDetail.className = 'tombol tombol--garis';
          btnDetail.innerHTML = '<span>Baca Kisah Arsip</span>';
          btnDetail.addEventListener('click', () => {
            saatBukaDetailRekaman(soal.rekamanTerkait, btnDetail);
          });
          barisAksi.appendChild(btnDetail);
        }

        const btnLanjut = document.createElement('button');
        btnLanjut.type = 'button';
        btnLanjut.className = 'tombol tombol--utama kuis-tombol-lanjut';
        btnLanjut.innerHTML =
          indeksSoalAktif + 1 < daftarSoal.length
            ? '<span>Soal Berikutnya</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>'
            : '<span>Lihat Hasil Evaluasi</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
        btnLanjut.addEventListener('click', () => lanjutSoalBerikutnya());
        barisAksi.appendChild(btnLanjut);

        kotakUmpan.append(headerUmpan, teksPenjelasan, barisAksi);
        badanSoal.appendChild(kotakUmpan);

        if (fokusKeUmpanBalik) {
          window.requestAnimationFrame(() => {
            kotakUmpan.focus();
          });
        }
      }

      wadahUtama.appendChild(badanSoal);
      return;
    }

    // =========================================================================
    // 4. Layar Hasil Akhir (Skor & 3 Penemuan Budaya Sesi Ini)
    // =========================================================================
    if (statusLayar === 'hasil') {
      const badanHasil = document.createElement('div');
      badanHasil.className = 'kuis-badan-konten';
      badanHasil.tabIndex = -1;

      // Kartu Skor Editorial
      const kartuSkor = document.createElement('div');
      kartuSkor.className = 'kuis-hasil-skor-kartu';

      const rasioSkor = Math.round((skor / daftarSoal.length) * 100);

      kartuSkor.innerHTML = `
        <div class="kuis-hasil-lingkaran-wrap">
          <span class="kuis-hasil-angka">${formatAngka(skor)}<span class="kuis-hasil-penyebut">/${formatAngka(daftarSoal.length)}</span></span>
          <span class="kuis-hasil-persen">${rasioSkor}% Tepat</span>
        </div>
        <div class="kuis-hasil-narasi">
          <h4 class="kuis-hasil-tajuk">${skor >= 6 ? 'Wawasan Budaya yang Mengagumkan' : (skor >= 4 ? 'Apresiasi Budaya yang Terbina Baik' : 'Awal Penjelajahan Tradisi Nusantara')}</h4>
          <p class="kuis-hasil-pesan">${dapatkanPesanHasil(skor, daftarSoal.length)}</p>
        </div>
      `;

      badanHasil.appendChild(kartuSkor);

      // Tiga Tradisi yang Ditemui Selama Kuis
      if (tradisiDitemui.length > 0) {
        const blokTradisi = document.createElement('div');
        blokTradisi.className = 'kuis-hasil-tradisi-blok';

        const labelTradisi = document.createElement('p');
        labelTradisi.className = 'label-kecil';
        labelTradisi.textContent = '3 Catatan Budaya yang Kamu Temui di Sesi Ini:';
        blokTradisi.appendChild(labelTradisi);

        const listTradisi = document.createElement('div');
        listTradisi.className = 'kuis-tradisi-grid-kartu';

        tradisiDitemui.forEach((rek) => {
          const kartuItem = document.createElement('article');
          kartuItem.className = 'kuis-tradisi-mini-kartu';

          const tagWilayah = document.createElement('div');
          tagWilayah.className = 'kuis-tradisi-mini-tag';
          tagWilayah.textContent = `${rek.provinsi || 'Nusantara'} • ${rek.jenis || 'OPK'}`;

          const namaItem = document.createElement('h5');
          namaItem.className = 'kuis-tradisi-mini-judul';
          namaItem.textContent = rek.nama_tampil || rek.nama;

          const ringkasItem = document.createElement('p');
          ringkasItem.className = 'kuis-tradisi-mini-isi';
          ringkasItem.textContent = rek.ringkasan || 'Warisan budaya takbenda tercatat di SPKT.';

          const btnBaca = document.createElement('button');
          btnBaca.type = 'button';
          btnBaca.className = 'tombol tombol--garis kuis-tradisi-mini-btn';
          btnBaca.innerHTML = '<span>Buka Detail Arsip</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
          btnBaca.addEventListener('click', () => {
            if (typeof saatBukaDetailRekaman === 'function') {
              saatBukaDetailRekaman(rek, btnBaca);
            }
          });

          kartuItem.append(tagWilayah, namaItem, ringkasItem, btnBaca);
          listTradisi.appendChild(kartuItem);
        });

        blokTradisi.appendChild(listTradisi);
        badanHasil.appendChild(blokTradisi);
      }

      // Baris Aksi Akhir
      const barisAksiHasil = document.createElement('div');
      barisAksiHasil.className = 'kuis-hasil-aksi-baris';

      const btnMainLagi = document.createElement('button');
      btnMainLagi.type = 'button';
      btnMainLagi.className = 'tombol tombol--utama';
      btnMainLagi.innerHTML = '<span>Mainkan 8 Soal Baru</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>';
      btnMainLagi.addEventListener('click', () => mulaiSesiBaru());

      const btnBagikanSkor = document.createElement('button');
      btnBagikanSkor.type = 'button';
      btnBagikanSkor.className = 'tombol tombol--garis';
      btnBagikanSkor.innerHTML = '<span>Salin Hasil Kuis</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      btnBagikanSkor.addEventListener('click', async () => {
        const teksShare = `Aku menjawab tepat ${skor} dari ${daftarSoal.length} soal di Kuis Kebudayaan Lokalocal. Budaya Indonesia tidak sedikit, yang sedikit adalah yang sudah tercatat.`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Hasil Kuis Budaya Lokalocal',
              text: teksShare,
              url: window.location.href
            });
            return;
          } catch {
            // lanjut ke clipboard
          }
        }
        try {
          await navigator.clipboard.writeText(`${teksShare} — ${window.location.href}`);
          tampilkanToast('Rangkuman hasil berhasil disalin ke papan klip.');
        } catch {
          tampilkanToast('Salin tautan dari bilah alamat browser.');
        }
      });

      barisAksiHasil.append(btnMainLagi, btnBagikanSkor);
      badanHasil.appendChild(barisAksiHasil);
      wadahUtama.appendChild(badanHasil);

      if (fokusKeUmpanBalik) {
        window.requestAnimationFrame(() => {
          badanHasil.focus();
        });
      }
    }
  }

  function terimaDataLengkap({ budaya = [] }) {
    daftarBudaya = budaya;
    dataSiap = true;
    if (statusLayar === 'awal') {
      render();
    }
  }

  render();

  return {
    terimaDataLengkap
  };
}

