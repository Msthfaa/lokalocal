/**
 * kuis.js (section) — Antarmuka Kuis Interaktif 8 Soal Budaya Nusantara
 * Sesuai arahan pengguna & WEB_SPEC.md:
 * - Wajib memilih wilayah terlebih dahulu (tidak default ke semua wilayah).
 * - Menampilkan grid pemilihan wilayah interaktif saat awal.
 * - Soal-soal yang muncul dikurasi 100% sesuai daerah yang dipilih.
 * - Progress bar bersegmen 8 langkah yang jelas.
 * - Opsi jawaban terindeks abjad (A, B, C, D) dengan status feedback elegan.
 * - Kotak petunjuk arsip resmi SPKT berformat kutipan historis.
 * - Ringkasan akhir berbobot dengan 3 kartu tradisi penemuan baru dan pintasan coba wilayah lain.
 */

import { buatSesiKuis, WILAYAH_CONFIG, dapatkanStatistikWilayah } from '../features/kuis.js';
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

  // Nilai awal: null (wajib memilih wilayah terlebih dahulu)
  let wilayahAktif = null;
  let statusLayar = 'awal'; // 'awal' | 'bermain' | 'hasil'
  let daftarSoal = [];
  let indeksSoalAktif = 0;
  let skor = 0;
  let jawabanDipilih = null;
  let tradisiDitemui = [];

  function perbaruiStatistikHero() {
    const statWil = dapatkanStatistikWilayah(wilayahAktif || 'semua', daftarBudaya, daftarProvinsi);
    const elTradisi = document.getElementById('stat-angka-tradisi');
    const elProvinsi = document.getElementById('stat-angka-provinsi');
    const elSoal = document.getElementById('stat-angka-soal');

    if (elTradisi) elTradisi.textContent = formatAngka(statWil.jumlahTradisi);
    if (elProvinsi) elProvinsi.textContent = formatAngka(statWil.jumlahProvinsi);
    if (elSoal) elSoal.textContent = '8';
  }

  function mulaiSesiBaru(kategori = wilayahAktif) {
    if (!kategori || !WILAYAH_CONFIG[kategori]) {
      // Bila belum memilih wilayah, arahkan pengguna memilih terlebih dahulu
      statusLayar = 'awal';
      wilayahAktif = null;
      render();
      return;
    }

    if (!dataSiap || daftarBudaya.length === 0) return;

    wilayahAktif = kategori;
    daftarSoal = buatSesiKuis({
      budaya: daftarBudaya,
      provinsi: daftarProvinsi,
      statistik,
      wilayah: wilayahAktif
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

  function aturWilayah(kategori) {
    if (!WILAYAH_CONFIG[kategori]) return;
    wilayahAktif = kategori;

    // Perbarui status aktif visual di tombol pill DOM
    const pills = document.querySelectorAll('.kuis-wilayah-pill');
    pills.forEach((p) => {
      const cocok = p.dataset.kategori === kategori;
      p.classList.toggle('is-aktif', cocok);
      p.setAttribute('aria-selected', cocok ? 'true' : 'false');
    });

    perbaruiStatistikHero();

    // Langsung mulai sesi bermain untuk wilayah yang baru dipilih
    mulaiSesiBaru(kategori);
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
    const infoWil = WILAYAH_CONFIG[wilayahAktif] || WILAYAH_CONFIG.semua;
    if (skorAkhir >= 7) {
      return `Ketajaman wawasanmu luar biasa! Kamu mengenali ragam budaya dan membaca pola pencatatan data ${infoWil.namaSingkat || infoWil.nama} dengan sangat cermat.`;
    }
    if (skorAkhir >= 4) {
      return `Pemahaman yang sangat baik! Berbagai tradisi daerah dan fakta data di ${infoWil.namaSingkat || infoWil.nama} kini terekam semakin jelas dalam ingatanmu.`;
    }
    return `Setiap jawaban adalah pintu penemuan baru. Terus telusuri khasanah budaya ${infoWil.namaSingkat || infoWil.nama} untuk mengenal warisan Nusantara yang belum banyak diketahui.`;
  }

  function render(fokusKeUmpanBalik = false) {
    wadahUtama.textContent = '';
    const infoWilayah = wilayahAktif ? WILAYAH_CONFIG[wilayahAktif] : null;

    // =========================================================================
    // 1. Header Kartu Kuis (Banner Topik Wilayah + Metadata)
    // =========================================================================
    const kepala = document.createElement('div');
    kepala.className = 'kuis-kartu-kepala';

    if (infoWilayah) {
      // Banner Topik Wilayah Aktif
      const bannerTopik = document.createElement('div');
      bannerTopik.className = 'kuis-topik-badge-banner';
      bannerTopik.setAttribute('role', 'status');
      bannerTopik.innerHTML = `
        <span class="kuis-topik-label">Zona Aktif:</span>
        <strong class="kuis-topik-nama">${infoWilayah.ikon} ${infoWilayah.nama}</strong>
        <span class="kuis-topik-total">&bull; 8 Pertanyaan Terkurasi SPKT</span>
      `;
      kepala.appendChild(bannerTopik);
    } else {
      // Banner Permintaan Memilih Wilayah Terlebih Dahulu
      const bannerPilih = document.createElement('div');
      bannerPilih.className = 'kuis-topik-badge-banner kuis-topik-badge-banner--pilih';
      bannerPilih.setAttribute('role', 'status');
      bannerPilih.innerHTML = `
        <span class="kuis-topik-label">Zona Kuratorial:</span>
        <strong class="kuis-topik-nama">Pilih Zona Wilayah Budaya</strong>
        <span class="kuis-topik-total">&bull; 7 Pilihan Wilayah</span>
      `;
      kepala.appendChild(bannerPilih);
    }

    const barisAtas = document.createElement('div');
    barisAtas.className = 'kuis-kartu-baris-atas';

    const infoKiri = document.createElement('div');
    infoKiri.className = 'kuis-kartu-meta-kiri';

    if (statusLayar === 'bermain' && infoWilayah) {
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
      skorChip.innerHTML = `<span class="kuis-lencana-skor-label">Skor</span><strong class="kuis-lencana-skor-angka">${skor}</strong>`;
      barisAtas.appendChild(skorChip);
    } else if (statusLayar === 'hasil' && infoWilayah) {
      const tagKategori = document.createElement('span');
      tagKategori.className = 'kuis-label-kategori';
      tagKategori.textContent = 'Evaluasi Akhir';

      const judulHasil = document.createElement('h3');
      judulHasil.className = 'kuis-kartu-judul';
      judulHasil.textContent = `Hasil Penjelajahan: ${infoWilayah.nama}`;

      infoKiri.append(tagKategori, judulHasil);
      barisAtas.appendChild(infoKiri);
    } else {
      const tagKategori = document.createElement('span');
      tagKategori.className = 'kuis-label-kategori';
      tagKategori.textContent = 'Eksplorasi Terkurasi SPKT';

      const judulAwal = document.createElement('h3');
      judulAwal.className = 'kuis-kartu-judul';
      judulAwal.textContent = 'Pilih Wilayah Penjelajahan';

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
    // 2. Layar Awal: WAJIB PILIH WILAYAH TERLEBIH DAHULU
    // =========================================================================
    if (statusLayar === 'awal') {
      const badanAwal = document.createElement('div');
      badanAwal.className = 'kuis-badan-konten';

      const deskripsiAwal = document.createElement('p');
      deskripsiAwal.className = 'kuis-paragraf-pembuka';
      deskripsiAwal.textContent =
        'Tentukan zona wilayah kebudayaan Indonesia yang ingin kamu uji. Soal-soal yang muncul dihimpun secara spesifik berdasarkan tradisi, seni, kriya, dan realitas pencatatan data resmi SPKT di daerah pilihanmu:';

      // Grid Kartu Pemilihan Wilayah Interaktif
      const gridPilih = document.createElement('div');
      gridPilih.className = 'kuis-pilih-wilayah-grid';
      gridPilih.setAttribute('role', 'list');
      gridPilih.setAttribute('aria-label', 'Daftar pilihan zona wilayah budaya');

      Object.entries(WILAYAH_CONFIG).forEach(([kunci, cfg]) => {
        const statW = dapatkanStatistikWilayah(kunci, daftarBudaya, daftarProvinsi);
        const kartuW = document.createElement('button');
        kartuW.type = 'button';
        kartuW.className = 'kuis-pilih-wilayah-kartu';
        kartuW.setAttribute('role', 'listitem');
        kartuW.innerHTML = `
          <div class="kuis-pilih-kartu-atas">
            <div class="kuis-pilih-kartu-kepala">
              <span class="kuis-pilih-kartu-ikon" aria-hidden="true">${cfg.ikon}</span>
              <h4 class="kuis-pilih-kartu-judul">${cfg.nama}</h4>
            </div>
            <p class="kuis-pilih-kartu-sub">${cfg.subjudul}</p>
          </div>
          <div class="kuis-pilih-kartu-kaki">
            <span class="kuis-pilih-kartu-stat">${formatAngka(statW.jumlahTradisi)} Tradisi &bull; ${statW.jumlahProvinsi} Prov</span>
            <span class="kuis-pilih-kartu-panah">Buka Tantangan &rarr;</span>
          </div>
        `;
        kartuW.addEventListener('click', () => {
          aturWilayah(kunci);
          const panelKuis = document.getElementById('s7-panel-kuis');
          if (panelKuis) {
            panelKuis.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
        gridPilih.appendChild(kartuW);
      });

      const catatanBawah = document.createElement('div');
      catatanBawah.className = 'kuis-awal-catatan';
      catatanBawah.style.marginTop = 'var(--ruang-2)';
      catatanBawah.textContent = dataSiap
        ? 'Pilih salah satu zona di atas untuk memulai 8 pertanyaan kuratorial.'
        : 'Sedang membaca arsip lokal...';

      badanAwal.append(deskripsiAwal, gridPilih, catatanBawah);
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
        <span class="kuis-arsip-tag">Catatan Arsip SPKT</span>
        <span class="kuis-arsip-sumber-label">Kementerian Kebudayaan RI</span>
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
            badgeStatus.textContent = 'Tercatat Benar ✓';
            btnOpsi.appendChild(badgeStatus);
          } else if (adalahPilihanKita && !adalahBenar) {
            badgeStatus.textContent = 'Pilihan Anda';
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
          ? 'Catatan Anda tepat!'
          : `Belum tepat. Jawaban tercatat di SPKT: ${soal.jawabanBenar}`;

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
              elJelajah.scrollIntoView({ behavior: 'smooth' });
            }
          });
          barisAksi.appendChild(btnLihatPeta);
        }

        const btnLanjut = document.createElement('button');
        btnLanjut.type = 'button';
        btnLanjut.className = 'tombol tombol--utama';
        const adalahSoalTerakhir = indeksSoalAktif + 1 === daftarSoal.length;
        btnLanjut.innerHTML = adalahSoalTerakhir
          ? '<span>Lihat Evaluasi Akhir</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>'
          : '<span>Pertanyaan Berikutnya</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
        btnLanjut.addEventListener('click', () => lanjutSoalBerikutnya());

        barisAksi.appendChild(btnLanjut);
        kotakUmpan.append(headerUmpan, teksPenjelasan, barisAksi);
        badanSoal.appendChild(kotakUmpan);
      }

      wadahUtama.appendChild(badanSoal);

      if (fokusKeUmpanBalik) {
        window.requestAnimationFrame(() => {
          const kotakUmpanBaru = wadahUtama.querySelector('.kuis-umpan-kartu');
          if (kotakUmpanBaru) kotakUmpanBaru.focus();
        });
      }
      return;
    }

    // =========================================================================
    // 4. Layar Hasil (Skor, Refleksi Data, dan Tradisi Ditemukan)
    // =========================================================================
    if (statusLayar === 'hasil' && infoWilayah) {
      const badanHasil = document.createElement('div');
      badanHasil.className = 'kuis-badan-konten';
      badanHasil.tabIndex = -1;

      // Papan Skor Utama
      const kartuSkor = document.createElement('div');
      kartuSkor.className = 'kuis-hasil-papan-skor';

      const angkaSkor = document.createElement('div');
      angkaSkor.className = 'kuis-hasil-angka-besar';
      angkaSkor.innerHTML = `<span class="kuis-angka-skor-utama">${skor}</span><span class="kuis-angka-skor-pemisah">/</span><span class="kuis-angka-skor-total">${daftarSoal.length}</span>`;

      const teksEvaluasi = document.createElement('div');
      teksEvaluasi.className = 'kuis-hasil-evaluasi-teks';

      const judulEvaluasi = document.createElement('h4');
      judulEvaluasi.className = 'kuis-hasil-subjudul';
      judulEvaluasi.textContent =
        skor >= 7
          ? `Wawasan ${infoWilayah.namaSingkat || infoWilayah.nama} Istimewa`
          : skor >= 4
          ? `Penjelajah ${infoWilayah.namaSingkat || infoWilayah.nama} Berpotensi`
          : `Penemu Jejak Awal ${infoWilayah.namaSingkat || infoWilayah.nama}`;

      const paragrafEvaluasi = document.createElement('p');
      paragrafEvaluasi.className = 'kuis-hasil-paragraf';
      paragrafEvaluasi.textContent = dapatkanPesanHasil(skor, daftarSoal.length);

      teksEvaluasi.append(judulEvaluasi, paragrafEvaluasi);
      kartuSkor.append(angkaSkor, teksEvaluasi);
      badanHasil.appendChild(kartuSkor);

      // Kartu 3 Catatan Tradisi yang Ditemui
      if (tradisiDitemui.length > 0) {
        const blokTradisi = document.createElement('div');
        blokTradisi.className = 'kuis-hasil-tradisi-blok';

        const labelTradisi = document.createElement('p');
        labelTradisi.className = 'label-kecil';
        labelTradisi.textContent = `Catatan Budaya ${infoWilayah.namaSingkat || ''} yang Terhimpun di Sesi Ini:`;
        blokTradisi.appendChild(labelTradisi);

        const listTradisi = document.createElement('div');
        listTradisi.className = 'kuis-tradisi-grid-kartu';

        tradisiDitemui.forEach((rek) => {
          const kartuItem = document.createElement('article');
          kartuItem.className = 'kuis-tradisi-mini-kartu';

          const tagWilayah = document.createElement('div');
          tagWilayah.className = 'kuis-tradisi-mini-tag';
          tagWilayah.textContent = `${rek.provinsi || 'Nusantara'} · ${rek.jenis || 'OPK'}`;

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

      // Pintasan Pilih Wilayah Lain di Akhir Sesi
      const blokPilihLain = document.createElement('div');
      blokPilihLain.className = 'kuis-hasil-wilayah-kotak';
      blokPilihLain.innerHTML = `<span class="kuis-hasil-wilayah-label">Tantang Wawasan Wilayah Lain:</span>`;

      const listWilayahCepat = document.createElement('div');
      listWilayahCepat.className = 'kuis-hasil-wilayah-baris';

      Object.entries(WILAYAH_CONFIG).forEach(([kunci, cfg]) => {
        if (kunci === wilayahAktif) return;
        const btnWil = document.createElement('button');
        btnWil.type = 'button';
        btnWil.className = 'kuis-hasil-wilayah-chip';
        btnWil.innerHTML = `<span>${cfg.ikon} ${cfg.namaSingkat || cfg.nama}</span>`;
        btnWil.addEventListener('click', () => {
          aturWilayah(kunci);
          const panelKuis = document.getElementById('s7-panel-kuis');
          if (panelKuis) {
            panelKuis.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        listWilayahCepat.appendChild(btnWil);
      });
      blokPilihLain.appendChild(listWilayahCepat);
      badanHasil.appendChild(blokPilihLain);

      // Baris Aksi Akhir
      const barisAksiHasil = document.createElement('div');
      barisAksiHasil.className = 'kuis-hasil-aksi-baris';

      const btnMainLagi = document.createElement('button');
      btnMainLagi.type = 'button';
      btnMainLagi.className = 'tombol tombol--utama';
      btnMainLagi.innerHTML = `<span>Mainkan 8 Soal Baru (${infoWilayah.namaSingkat || 'Wilayah'})</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`;
      btnMainLagi.addEventListener('click', () => mulaiSesiBaru(wilayahAktif));

      const btnPilihUlang = document.createElement('button');
      btnPilihUlang.type = 'button';
      btnPilihUlang.className = 'tombol tombol--garis';
      btnPilihUlang.innerHTML = '<span>Pilih Wilayah Lain &larr;</span>';
      btnPilihUlang.addEventListener('click', () => {
        wilayahAktif = null;
        statusLayar = 'awal';
        const pills = document.querySelectorAll('.kuis-wilayah-pill');
        pills.forEach((p) => {
          p.classList.remove('is-aktif');
          p.setAttribute('aria-selected', 'false');
        });
        render();
      });

      const btnBagikanSkor = document.createElement('button');
      btnBagikanSkor.type = 'button';
      btnBagikanSkor.className = 'tombol tombol--garis';
      btnBagikanSkor.innerHTML = '<span>Salin Hasil Kuis</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      btnBagikanSkor.addEventListener('click', async () => {
        const teksShare = `Aku menjawab tepat ${skor} dari ${daftarSoal.length} soal di Kuis Kebudayaan Lokalocal untuk wilayah ${infoWilayah.nama}. Budaya Indonesia tidak sedikit, yang sedikit adalah yang sudah tercatat.`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Hasil Kuis Budaya ${infoWilayah.nama} - Lokalocal`,
              text: teksShare,
              url: window.location.href
            });
            return;
          } catch {
            // lanjut ke clipboard
          }
        }
        try {
          await navigator.clipboard.writeText(`${teksShare} (${window.location.href})`);
          tampilkanToast('Rangkuman hasil berhasil disalin ke papan klip.');
        } catch {
          tampilkanToast('Salin tautan dari bilah alamat browser.');
        }
      });

      barisAksiHasil.append(btnMainLagi, btnPilihUlang, btnBagikanSkor);
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
    perbaruiStatistikHero();
    if (statusLayar === 'awal') {
      render();
    }
  }

  render();

  return {
    terimaDataLengkap,
    aturWilayah,
    mulaiSesiBaru,
    dapatkanWilayahAktif: () => wilayahAktif
  };
}
