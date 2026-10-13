/**
 * kuis.js (section) — Antarmuka Kuis Interaktif 8 Soal di bagian S7
 * Sesuai WEB_SPEC.md Bagian 8.2.
 */

import { buatSesiKuis } from '../features/kuis.js';
import { formatAngka } from '../util/format.js';
import { tampilkanToast } from '../ui/toast.js';

/**
 * Menginisialisasi UI Kuis 8 Soal di bagian S7.
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
      return 'Tajam sekali! Kamu membaca pola dan catatan budaya Nusantara dengan sangat cermat.';
    }
    if (skorAkhir >= 4) {
      return 'Bekal yang bagus! Banyak tradisi unik dari berbagai provinsi yang kini makin kamu kenal.';
    }
    return 'Setiap jawaban adalah cerita baru. Masih banyak tradisi Nusantara yang menunggu untuk kita telusuri bersama.';
  }

  function render(fokusKeUmpanBalik = false) {
    wadahUtama.textContent = '';

    // Header tetap di atas kartu Kuis
    const kepala = document.createElement('div');
    kepala.className = 'kuis-kepala';

    const kiri = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'label-kecil';
    kicker.textContent = 'Tantangan 8 Pertanyaan';

    const h3 = document.createElement('h3');
    h3.textContent = 'Uji Pengetahuanmu';
    kiri.append(kicker, h3);
    kepala.appendChild(kiri);

    if (statusLayar === 'bermain') {
      const lencanaSkor = document.createElement('span');
      lencanaSkor.className = 'chip-jenis';
      lencanaSkor.textContent = `Soal ${indeksSoalAktif + 1}/${daftarSoal.length} • Skor: ${skor}`;
      kepala.appendChild(lencanaSkor);
    }

    wadahUtama.appendChild(kepala);

    // 1. Layar Awal
    if (statusLayar === 'awal') {
      const badanAwal = document.createElement('div');
      badanAwal.className = 'kuis-badan';

      const p1 = document.createElement('p');
      p1.style.color = 'var(--kertas-redup)';
      p1.textContent =
        'Delapan pertanyaan singkat yang diracik otomatis dari catatan SPKT: menebak asal provinsi suatu tradisi, mengenali kategori Objek Pemajuan Kebudayaan (OPK), dan mencermati fakta pencatatan nasional.';

      const daftarAturan = document.createElement('ul');
      daftarAturan.className = 'kuis-poin-awal';
      const butir = [
        '4 soal tebak asal provinsi dari petunjuk ringkasan tradisi',
        '3 soal klasifikasi jenis OPK menurut SPKT',
        '1 soal fakta ketimpangan & pencatatan data nasional'
      ];
      for (const teksButir of butir) {
        const li = document.createElement('li');
        li.textContent = teksButir;
        daftarAturan.appendChild(li);
      }

      const btnMulai = document.createElement('button');
      btnMulai.type = 'button';
      btnMulai.className = 'tombol tombol--utama';
      btnMulai.style.alignSelf = 'flex-start';
      btnMulai.disabled = !dataSiap;
      btnMulai.textContent = dataSiap ? 'Mulai Kuis (8 Soal)' : 'Menyiapkan bank soal...';
      btnMulai.addEventListener('click', () => mulaiSesiBaru());

      badanAwal.append(p1, daftarAturan, btnMulai);
      wadahUtama.appendChild(badanAwal);
      return;
    }

    // 2. Layar Bermain
    if (statusLayar === 'bermain') {
      const soal = daftarSoal[indeksSoalAktif];
      if (!soal) return;

      const badanSoal = document.createElement('div');
      badanSoal.className = 'kuis-badan';

      const lencanaTipe = document.createElement('span');
      lencanaTipe.className = 'kartu-lencana-multi';
      lencanaTipe.style.alignSelf = 'flex-start';
      lencanaTipe.textContent = soal.labelTipe;

      const teksTanya = document.createElement('h4');
      teksTanya.className = 'kuis-pertanyaan';
      teksTanya.textContent = soal.pertanyaan;

      const kotakPetunjuk = document.createElement('div');
      kotakPetunjuk.className = 'kuis-petunjuk';
      const labelPetunjuk = document.createElement('span');
      labelPetunjuk.className = 'label-kecil';
      labelPetunjuk.style.display = 'block';
      labelPetunjuk.style.marginBottom = '4px';
      labelPetunjuk.textContent = 'Petunjuk dari catatan SPKT:';
      const isiPetunjuk = document.createElement('p');
      isiPetunjuk.textContent = soal.petunjuk;
      kotakPetunjuk.append(labelPetunjuk, isiPetunjuk);

      // Daftar Pilihan Jawaban
      const grupPilihan = document.createElement('div');
      grupPilihan.className = 'kuis-pilihan-grup';
      grupPilihan.setAttribute('role', 'group');
      grupPilihan.setAttribute('aria-label', 'Pilihan jawaban');

      for (const teksOpsi of soal.pilihan) {
        const btnOpsi = document.createElement('button');
        btnOpsi.type = 'button';
        btnOpsi.className = 'kuis-pilihan-tombol';

        const sudahMenjawab = jawabanDipilih !== null;
        const adalahBenar = teksOpsi === soal.jawabanBenar;
        const adalahPilihanKita = teksOpsi === jawabanDipilih;

        let prefiksIkon = '';
        if (sudahMenjawab) {
          btnOpsi.disabled = true;
          if (adalahBenar) {
            btnOpsi.classList.add('is-benar');
            prefiksIkon = '✓ ';
          } else if (adalahPilihanKita && !adalahBenar) {
            btnOpsi.classList.add('is-salah');
            prefiksIkon = '✕ ';
          }
        }

        const spanTeks = document.createElement('span');
        spanTeks.textContent = `${prefiksIkon}${teksOpsi}`;

        btnOpsi.appendChild(spanTeks);

        if (sudahMenjawab && adalahBenar) {
          const ketStatus = document.createElement('span');
          ketStatus.className = 'kuis-pilihan-ket';
          ketStatus.textContent = 'Jawaban tercatat';
          btnOpsi.appendChild(ketStatus);
        } else if (sudahMenjawab && adalahPilihanKita && !adalahBenar) {
          const ketStatus = document.createElement('span');
          ketStatus.className = 'kuis-pilihan-ket';
          ketStatus.textContent = 'Pilihanmu';
          btnOpsi.appendChild(ketStatus);
        }

        btnOpsi.addEventListener('click', () => pilihJawaban(teksOpsi));
        grupPilihan.appendChild(btnOpsi);
      }

      badanSoal.append(lencanaTipe, teksTanya, kotakPetunjuk, grupPilihan);

      // Kotak Umpan Balik setelah memilih jawaban
      if (jawabanDipilih !== null) {
        const benar = jawabanDipilih === soal.jawabanBenar;
        const kotakUmpan = document.createElement('div');
        kotakUmpan.className = `kuis-umpan-balik ${benar ? 'is-benar' : 'is-salah'}`;
        kotakUmpan.tabIndex = -1;

        const judulUmpan = document.createElement('p');
        judulUmpan.className = 'kuis-umpan-judul';
        judulUmpan.textContent = benar
          ? '✓ Benar! Catatanmu tepat.'
          : `Hampir! Ini tercatat sebagai: ${soal.jawabanBenar}.`;

        const teksPenjelasan = document.createElement('p');
        teksPenjelasan.style.fontSize = 'var(--teks-kecil)';
        teksPenjelasan.style.color = 'var(--kertas-redup)';
        teksPenjelasan.textContent = soal.penjelasan;

        const barisAksi = document.createElement('div');
        barisAksi.className = 'kuis-umpan-aksi';

        if (soal.kodeProvinsiTerkait) {
          const btnLihatPeta = document.createElement('button');
          btnLihatPeta.type = 'button';
          btnLihatPeta.className = 'tombol tombol--garis';
          btnLihatPeta.textContent = 'Lihat di peta';
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
          btnDetail.textContent = 'Baca kisah lengkap';
          btnDetail.addEventListener('click', () => {
            saatBukaDetailRekaman(soal.rekamanTerkait, btnDetail);
          });
          barisAksi.appendChild(btnDetail);
        }

        const btnLanjut = document.createElement('button');
        btnLanjut.type = 'button';
        btnLanjut.className = 'tombol tombol--utama';
        btnLanjut.textContent =
          indeksSoalAktif + 1 < daftarSoal.length ? 'Soal berikutnya →' : 'Lihat hasil kuis →';
        btnLanjut.addEventListener('click', () => lanjutSoalBerikutnya());
        barisAksi.appendChild(btnLanjut);

        kotakUmpan.append(judulUmpan, teksPenjelasan, barisAksi);
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

    // 3. Layar Hasil Akhir
    if (statusLayar === 'hasil') {
      const badanHasil = document.createElement('div');
      badanHasil.className = 'kuis-badan';
      badanHasil.tabIndex = -1;

      const kotakSkor = document.createElement('div');
      kotakSkor.className = 'kuis-skor-akhir';

      const angkaSkor = document.createElement('span');
      angkaSkor.className = 'kuis-skor-angka';
      angkaSkor.textContent = `${formatAngka(skor)} / ${formatAngka(daftarSoal.length)}`;

      const kalimatUmpan = document.createElement('p');
      kalimatUmpan.style.marginTop = 'var(--ruang-2)';
      kalimatUmpan.textContent = dapatkanPesanHasil(skor, daftarSoal.length);

      kotakSkor.append(angkaSkor, kalimatUmpan);
      badanHasil.appendChild(kotakSkor);

      // 3 tradisi yang baru ditemui selama kuis
      if (tradisiDitemui.length > 0) {
        const blokTradisi = document.createElement('div');
        blokTradisi.className = 'kuis-tradisi-ditemui';

        const labelT = document.createElement('p');
        labelT.className = 'label-kecil';
        labelT.textContent = '3 Tradisi yang Kamu Temui di Sesi Ini:';
        blokTradisi.appendChild(labelT);

        const listT = document.createElement('ul');
        listT.className = 'kuis-tradisi-list';

        for (const rek of tradisiDitemui) {
          const li = document.createElement('li');
          li.className = 'kuis-tradisi-item';

          const infoT = document.createElement('div');
          const namaT = document.createElement('strong');
          namaT.textContent = rek.nama_tampil;
          const asalT = document.createElement('span');
          asalT.style.display = 'block';
          asalT.style.fontSize = '0.78rem';
          asalT.style.color = 'var(--kertas-redup)';
          asalT.textContent = `${rek.provinsi} • ${rek.jenis}`;
          infoT.append(namaT, asalT);

          const btnBaca = document.createElement('button');
          btnBaca.type = 'button';
          btnBaca.className = 'tombol tombol--garis tabel-tombol-pilih';
          btnBaca.textContent = 'Baca cerita';
          btnBaca.addEventListener('click', () => {
            if (typeof saatBukaDetailRekaman === 'function') {
              saatBukaDetailRekaman(rek, btnBaca);
            }
          });

          li.append(infoT, btnBaca);
          listT.appendChild(li);
        }

        blokTradisi.appendChild(listT);
        badanHasil.appendChild(blokTradisi);
      }

      // Tombol Main Lagi & Bagikan
      const barisTombolHasil = document.createElement('div');
      barisTombolHasil.style.display = 'flex';
      barisTombolHasil.style.flexWrap = 'wrap';
      barisTombolHasil.style.gap = 'var(--ruang-2)';
      barisTombolHasil.style.marginTop = 'var(--ruang-2)';

      const btnMainLagi = document.createElement('button');
      btnMainLagi.type = 'button';
      btnMainLagi.className = 'tombol tombol--utama';
      btnMainLagi.textContent = 'Main lagi (8 soal baru)';
      btnMainLagi.addEventListener('click', () => mulaiSesiBaru());

      const btnBagikanSkor = document.createElement('button');
      btnBagikanSkor.type = 'button';
      btnBagikanSkor.className = 'tombol tombol--garis';
      btnBagikanSkor.textContent = 'Bagikan hasil';
      btnBagikanSkor.addEventListener('click', async () => {
        const teksShare = `Aku menjawab ${skor} dari ${daftarSoal.length} soal di Kuis Lokalocal! Budaya Indonesia tidak sedikit — yang sedikit adalah yang sudah tercatat.`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Kuis Lokalocal',
              text: teksShare,
              url: window.location.href
            });
            return;
          } catch {
            // lanjut ke clipboard
          }
        }
        try {
          await navigator.clipboard.writeText(`${teksShare} ${window.location.href}`);
          tampilkanToast('Hasil kuis disalin ke papan klip!');
        } catch {
          tampilkanToast('Salin tautan dari bilah alamat browser kamu.');
        }
      });

      barisTombolHasil.append(btnMainLagi, btnBagikanSkor);
      badanHasil.appendChild(barisTombolHasil);
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
