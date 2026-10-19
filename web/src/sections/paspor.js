/**
 * paspor.js (section) — Antarmuka bagian S7 Paspor Budaya (38 Stempel Provinsi)
 * Redesain Editorial Anti-Slop: Lembaran Paspor Geografis & Gelar Kehormatan Kuratorial.
 * Sesuai WEB_SPEC.md Bagian 8.1 & Bagian 7.2 (A-11).
 */

import { buatStempelProvinsiSvg } from '../patterns/generate.js';
import { formatAngka } from '../util/format.js';
import { gsap, apakahKurangiGerak } from '../util/motion.js';
import { tampilkanToast } from '../ui/toast.js';
import { DAFTAR_CHIBI, ambilAvatarPengguna, simpanAvatarPengguna, dapatkanChibi } from '../features/chibi.js';

const GUGUS_WILAYAH = [
  { id: 'semua', label: 'Semua', kodeSet: null },
  { id: 'sumatera', label: 'Sumatera', kodeSet: new Set(['11', '12', '13', '14', '15', '16', '17', '18', '19', '21']) },
  { id: 'jawa', label: 'Jawa', kodeSet: new Set(['31', '32', '33', '34', '35', '36']) },
  { id: 'bali-nusa', label: 'Bali & Nusa', kodeSet: new Set(['51', '52', '53']) },
  { id: 'kalimantan', label: 'Kalimantan', kodeSet: new Set(['61', '62', '63', '64', '65']) },
  { id: 'sulawesi', label: 'Sulawesi', kodeSet: new Set(['71', '72', '73', '74', '75', '76']) },
  { id: 'maluku-papua', label: 'Maluku & Papua', kodeSet: new Set(['81', '82', '91', '92', '93', '94', '95', '96']) }
];

function hitungGelarPaspor(jumlahTerkumpul, totalProvinsi) {
  if (jumlahTerkumpul === 0) {
    return {
      gelar: 'Penjelajah Mula',
      tingkat: 'Level 1',
      deskripsi: 'Buku paspor baru dibuka. Jelajahi peta 3D untuk mengukir stempel pertamamu.'
    };
  }
  if (jumlahTerkumpul <= 9) {
    return {
      gelar: 'Pengembara Tradisi',
      tingkat: 'Level 2',
      deskripsi: 'Jejak langkah awalmu mulai terhimpun di lembaran arsip kebudayaan nusantara.'
    };
  }
  if (jumlahTerkumpul <= 24) {
    return {
      gelar: 'Perekam Jejak Budaya',
      tingkat: 'Level 3',
      deskripsi: 'Lebih dari seperempat nusantara telah kamu telusuri dan resapi dengan tekun.'
    };
  }
  if (jumlahTerkumpul < totalProvinsi) {
    return {
      gelar: 'Penjaga Narasi Nusantara',
      tingkat: 'Level 4',
      deskripsi: 'Hampir seluruh penjuru nusantara telah terhimpun lengkap dalam dokumen paspormu.'
    };
  }
  return {
    gelar: 'Kurator Agung Nusantara',
    tingkat: 'Level 5 (Paripurna)',
    deskripsi: 'Lengkap 38/38 provinsi! Seluruh warisan dan kepedulian budaya telah terpatri abadi.'
  };
}

/**
 * Menginisialisasi UI Paspor Budaya di bagian S7.
 *
 * @param {object} parameter
 * @param {Array} parameter.daftarProvinsi - 38 provinsi dari provinsi.json
 * @param {object} parameter.pengelolaPaspor - Instans dari buatPengelolaPaspor()
 * @param {(kode: string) => void} parameter.saatKlikPetakProvinsi - Membuka provinsi di S5 Jelajah
 */
export function inisialisasiBagianPaspor({
  daftarProvinsi = [],
  pengelolaPaspor,
  saatKlikPetakProvinsi
}) {
  const wadahUtama = document.getElementById('s7-panel-paspor');
  if (!wadahUtama || !pengelolaPaspor) return null;

  const petaNamaProv = new Map(daftarProvinsi.map((p) => [String(p.kode), p.nama]));
  let filterWilayahAktif = 'semua';
  let sedangKonfirmasiReset = false;
  let modalAvatarBuka = false;

  function render(infoPerubahan = null) {
    const avatarAktif = ambilAvatarPengguna();
    const semuaStempel = pengelolaPaspor.dapatkanSemuaStempel();
    const kodeTerkumpul = Object.keys(semuaStempel);
    const jumlahTerkumpul = kodeTerkumpul.length;
    const totalProvinsi = daftarProvinsi.length || 38;
    const persen = Math.round((jumlahTerkumpul / totalProvinsi) * 100);

    const jumlahBiasa = kodeTerkumpul.filter((k) => semuaStempel[k]?.jenis !== 'penjaga').length;
    const jumlahPenjaga = kodeTerkumpul.filter((k) => semuaStempel[k]?.jenis === 'penjaga').length;
    const infoGelar = hitungGelarPaspor(jumlahTerkumpul, totalProvinsi);

    wadahUtama.textContent = '';

    // =========================================================================
    // 1. Kartu Identitas Paspor (Passport Identity Card / Buku Dokumen)
    // =========================================================================
    const kartuIdentitas = document.createElement('div');
    kartuIdentitas.className = 'paspor-identitas-kartu';

    const barisAtasId = document.createElement('div');
    barisAtasId.className = 'paspor-identitas-baris-atas';

    // Foto Resmi Penjelajah Budaya (Chibi Avatar)
    const boxAvatar = document.createElement('div');
    boxAvatar.className = 'paspor-avatar-foto-box';
    boxAvatar.setAttribute('role', 'button');
    boxAvatar.setAttribute('tabindex', '0');
    boxAvatar.setAttribute('title', `Foto Resmi: ${avatarAktif.nama} (${avatarAktif.suku}). Klik untuk ganti foto!`);
    boxAvatar.innerHTML = `
      <div class="paspor-foto-frame">
        <img src="${avatarAktif.foto}" alt="${avatarAktif.nama}" class="paspor-foto-img" />
        <span class="paspor-foto-badge-stempel">PASPOR</span>
      </div>
      <div class="paspor-foto-info">
        <strong class="paspor-foto-nama">${avatarAktif.nama}</strong>
        <span class="paspor-foto-ganti-link">Ganti Foto 🔄</span>
      </div>
    `;
    boxAvatar.addEventListener('click', () => {
      modalAvatarBuka = !modalAvatarBuka;
      render();
    });

    const grupMerek = document.createElement('div');
    grupMerek.className = 'paspor-identitas-merek-grup';
    grupMerek.innerHTML = `
      <span class="paspor-identitas-lambang">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </span>
      <div>
        <p class="paspor-identitas-sublabel">Dokumen Resmi Penjelajah Kebudayaan</p>
        <h3 class="paspor-identitas-judul">Lembar Paspor 38 Wilayah</h3>
      </div>
    `;

    const badgeGelar = document.createElement('div');
    badgeGelar.className = 'paspor-gelar-badge';
    badgeGelar.innerHTML = `
      <span class="paspor-gelar-tingkat">${infoGelar.tingkat}</span>
      <strong class="paspor-gelar-nama">${infoGelar.gelar}</strong>
    `;

    barisAtasId.append(boxAvatar, grupMerek, badgeGelar);

    // Modal Tray Pemilihan Avatar jika dibuka
    if (modalAvatarBuka) {
      const modalAvatar = document.createElement('div');
      modalAvatar.className = 'paspor-avatar-tray-modal';
      modalAvatar.innerHTML = `
        <div class="paspor-avatar-tray-inner">
          <div class="paspor-avatar-tray-header">
            <h4>Pilih Foto Identitas Penjelajah Budaya</h4>
            <button type="button" class="paspor-avatar-tray-tutup" aria-label="Tutup">&times;</button>
          </div>
          <p class="paspor-avatar-tray-sub">Pilih salah satu dari 8 perwakilan pakaian adat Nusantara untuk buku paspormu:</p>
          <div class="paspor-avatar-tray-grid">
            ${DAFTAR_CHIBI.map(
              (c) => `
              <button type="button" class="paspor-avatar-item-btn ${c.id === avatarAktif.id ? 'is-aktif' : ''}" data-id="${c.id}">
                <div class="paspor-item-avatar-img-wrap">
                  <img src="${c.foto}" alt="${c.nama}" />
                </div>
                <strong class="paspor-item-nama">${c.nama}</strong>
                <span class="paspor-item-suku">${c.suku}</span>
              </button>
            `
            ).join('')}
          </div>
        </div>
      `;
      const btnTutupM = modalAvatar.querySelector('.paspor-avatar-tray-tutup');
      if (btnTutupM) {
        btnTutupM.addEventListener('click', (e) => {
          e.stopPropagation();
          modalAvatarBuka = false;
          render();
        });
      }
      modalAvatar.querySelectorAll('.paspor-avatar-item-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idDipilih = btn.dataset.id;
          simpanAvatarPengguna(idDipilih);
          modalAvatarBuka = false;
          tampilkanToast(`Foto profil paspor berganti ke ${dapatkanChibi(idDipilih).nama}!`);
          render();
        });
      });
      kartuIdentitas.appendChild(modalAvatar);
    }

    const narasiGelar = document.createElement('p');
    narasiGelar.className = 'paspor-identitas-deskripsi';
    narasiGelar.textContent = infoGelar.deskripsi;

    // Baris Metrik & Progres Bar Emas
    const blokProgres = document.createElement('div');
    blokProgres.className = 'paspor-progres-blok';

    const barisInfoProgres = document.createElement('div');
    barisInfoProgres.className = 'paspor-progres-info';

    const teksKoleksi = document.createElement('div');
    teksKoleksi.className = 'paspor-progres-teks-kiri';
    teksKoleksi.innerHTML = `
      <strong class="paspor-angka-besar">${formatAngka(jumlahTerkumpul)}</strong>
      <span class="paspor-penyebut">/${formatAngka(totalProvinsi)} Provinsi Terhimpun</span>
      <span class="paspor-persen-badge">${persen}%</span>
    `;

    const teksRincian = document.createElement('div');
    teksRincian.className = 'paspor-progres-rincian';
    teksRincian.innerHTML = `
      <span class="paspor-rincian-item is-tercatat">
        <span class="paspor-titik-status" aria-hidden="true"></span>
        <strong>${formatAngka(jumlahBiasa)}</strong> Stempel SPKT
      </span>
      <span class="paspor-rincian-item is-penjaga">
        <span class="paspor-titik-status" aria-hidden="true"></span>
        <strong>${formatAngka(jumlahPenjaga)}</strong> Penjaga Cerita
      </span>
    `;

    barisInfoProgres.append(teksKoleksi, teksRincian);

    const trekBar = document.createElement('div');
    trekBar.className = 'paspor-progres-trek';
    trekBar.setAttribute('role', 'progressbar');
    trekBar.setAttribute('aria-valuenow', String(jumlahTerkumpul));
    trekBar.setAttribute('aria-valuemin', '0');
    trekBar.setAttribute('aria-valuemax', String(totalProvinsi));
    trekBar.setAttribute('aria-label', `${jumlahTerkumpul} dari ${totalProvinsi} provinsi dijelajahi`);

    const isiBar = document.createElement('div');
    isiBar.className = 'paspor-progres-isi';
    isiBar.style.width = `${persen}%`;
    trekBar.appendChild(isiBar);

    blokProgres.append(barisInfoProgres, trekBar);

    // Baris Tombol Aksi Cetak Kartu Pengelana Budaya
    const barisAksiKartu = document.createElement('div');
    barisAksiKartu.className = 'paspor-identitas-aksi-baris';
    barisAksiKartu.style.cssText = 'display: flex; align-items: center; justify-content: flex-end; margin-top: 14px; gap: 10px; flex-wrap: wrap;';

    const btnCetakKartu = document.createElement('button');
    btnCetakKartu.type = 'button';
    btnCetakKartu.className = 'tombol tombol--utama';
    btnCetakKartu.style.cssText = 'font-size: 0.85rem; padding: 7px 16px; min-height: 38px;';
    btnCetakKartu.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2"></rect>
        <circle cx="9" cy="10" r="2"></circle>
        <path d="M15 8h2"></path>
        <path d="M15 12h2"></path>
        <path d="M7 16h10"></path>
      </svg>
      <span>Cetak Kartu Pengelana Budaya (PNG)</span>
    `;
    btnCetakKartu.addEventListener('click', () => {
      import('../features/paspor-canvas.js').then(({ bukaModalCetakKartu }) => {
        bukaModalCetakKartu({ pengelolaPaspor, daftarProvinsi });
      });
    });

    barisAksiKartu.appendChild(btnCetakKartu);

    kartuIdentitas.append(barisAtasId, narasiGelar, blokProgres, barisAksiKartu);
    wadahUtama.appendChild(kartuIdentitas);

    // =========================================================================
    // 2. Banner Status Storage (Bila localStorage dinonaktifkan peramban)
    // =========================================================================
    if (!pengelolaPaspor.apakahStorageTersedia()) {
      const catatanStorage = document.createElement('p');
      catatanStorage.className = 'paspor-catatan-storage';
      catatanStorage.setAttribute('role', 'status');
      catatanStorage.textContent = 'Progres disimpan sementara di sesi ini (penyimpanan lokal peramban dinonaktifkan).';
      wadahUtama.appendChild(catatanStorage);
    }

    // =========================================================================
    // 3. Banner Perayaan jika 38/38 Lengkap
    // =========================================================================
    if (jumlahTerkumpul >= totalProvinsi) {
      const perayaan = document.createElement('div');
      perayaan.className = 'paspor-banner-lengkap';
      perayaan.innerHTML = `
        <div class="paspor-lengkap-ikon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="paspor-lengkap-konten">
          <strong>Lengkap Paripurna 38/38 Provinsi Nusantara!</strong>
          <p>Kamu telah membuktikan kepedulian tinggi dengan menelusuri setiap sudut tradisi tercatat dan menyuarakan daerah yang belum terdata.</p>
        </div>
      `;
      wadahUtama.appendChild(perayaan);
    }

    // =========================================================================
    // 4. Bilah Filter Wilayah Geografis (Gugus Pulau Nusantara)
    // =========================================================================
    const barFilter = document.createElement('div');
    barFilter.className = 'paspor-filter-bar';
    barFilter.setAttribute('role', 'tablist');
    barFilter.setAttribute('aria-label', 'Filter gugus wilayah kepulauan');

    GUGUS_WILAYAH.forEach((gugus) => {
      const btnTab = document.createElement('button');
      btnTab.type = 'button';
      btnTab.className = `paspor-filter-tab ${filterWilayahAktif === gugus.id ? 'is-aktif' : ''}`;
      btnTab.setAttribute('role', 'tab');
      btnTab.setAttribute('aria-selected', String(filterWilayahAktif === gugus.id));

      // Hitung jumlah stempel terkumpul di gugus ini
      let totalGugus = 0;
      let terkumpulGugus = 0;

      if (gugus.kodeSet === null) {
        totalGugus = totalProvinsi;
        terkumpulGugus = jumlahTerkumpul;
      } else {
        daftarProvinsi.forEach((p) => {
          if (gugus.kodeSet.has(p.kode)) {
            totalGugus++;
            if (semuaStempel[p.kode]) {
              terkumpulGugus++;
            }
          }
        });
      }

      btnTab.innerHTML = `
        <span class="paspor-tab-label">${gugus.label}</span>
        <span class="paspor-tab-counter">${terkumpulGugus}/${totalGugus}</span>
      `;

      btnTab.addEventListener('click', () => {
        if (filterWilayahAktif !== gugus.id) {
          filterWilayahAktif = gugus.id;
          render();
        }
      });

      barFilter.appendChild(btnTab);
    });

    wadahUtama.appendChild(barFilter);

    // =========================================================================
    // 5. Kisi Petak Stempel 38 Wilayah (Responsif & Proporsional)
    // =========================================================================
    const gugusAktifObj = GUGUS_WILAYAH.find((g) => g.id === filterWilayahAktif) || GUGUS_WILAYAH[0];
    const provinsiTerfilter = gugusAktifObj.kodeSet === null
      ? daftarProvinsi
      : daftarProvinsi.filter((p) => gugusAktifObj.kodeSet.has(p.kode));

    const kisi = document.createElement('div');
    kisi.className = 'paspor-kisi-38';
    kisi.setAttribute('role', 'list');
    kisi.setAttribute('aria-label', `Daftar stempel wilayah untuk ${gugusAktifObj.label}`);

    provinsiTerfilter.forEach((prov) => {
      const dataStempel = semuaStempel[prov.kode];
      const sudahDapat = Boolean(dataStempel);
      const jenisStempel = dataStempel?.jenis || 'biasa';
      const adalahBelumTercatat = prov.status_data === 'belum_tercatat' || prov.total <= 0;

      const petak = document.createElement('button');
      petak.type = 'button';
      petak.setAttribute('role', 'listitem');
      petak.className = `paspor-petak ${sudahDapat ? 'is-terkumpul' : 'is-kosong'}`;
      if (sudahDapat && jenisStempel === 'penjaga') {
        petak.classList.add('is-penjaga');
      }
      petak.dataset.kode = prov.kode;

      const statusLabel = sudahDapat
        ? jenisStempel === 'penjaga'
          ? 'stempel Penjaga Cerita terkumpul'
          : 'stempel resmi SPKT terkumpul'
        : adalahBelumTercatat
        ? 'belum dikunjungi (belum tercatat di SPKT)'
        : 'belum dikunjungi';

      petak.setAttribute('aria-label', `${prov.nama}: ${statusLabel}. Klik untuk membuka di peta Jelajah 3D.`);

      const bungkusVisual = document.createElement('div');
      bungkusVisual.className = 'paspor-petak-visual';

      if (sudahDapat) {
        const svgStempel = buatStempelProvinsiSvg({
          kode: prov.kode,
          nama: prov.nama,
          jenis: jenisStempel
        });
        bungkusVisual.appendChild(svgStempel);
      } else {
        // Watermark Seal Elegan (Bukan sekadar dashed box wireframe kosong)
        const watermarkSeal = document.createElement('div');
        watermarkSeal.className = 'paspor-stempel-watermark';
        watermarkSeal.innerHTML = `
          <span class="paspor-watermark-cincin" aria-hidden="true"></span>
          <span class="paspor-watermark-kode">${prov.kode}</span>
          <span class="paspor-watermark-status">BELUM TERCAP</span>
        `;
        bungkusVisual.appendChild(watermarkSeal);
      }

      const labelNama = document.createElement('span');
      labelNama.className = 'paspor-petak-nama';
      labelNama.textContent = prov.nama;

      petak.append(bungkusVisual, labelNama);

      // Badge status kecil penjelajah
      if (sudahDapat) {
        const badgeCap = document.createElement('span');
        badgeCap.className = `paspor-tag-status ${jenisStempel === 'penjaga' ? 'is-penjaga' : 'is-tercatat'}`;
        badgeCap.textContent = jenisStempel === 'penjaga' ? 'Penjaga' : 'Tercatat';
        petak.appendChild(badgeCap);
      }

      petak.addEventListener('click', () => {
        if (typeof saatKlikPetakProvinsi === 'function') {
          saatKlikPetakProvinsi(prov.kode);
        }
        const elJelajah = document.getElementById('jelajah');
        if (elJelajah) {
          elJelajah.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      kisi.appendChild(petak);

      // Animasi timbul saat stempel baru saja diperoleh
      if (
        infoPerubahan &&
        infoPerubahan.aksi === 'tambah' &&
        infoPerubahan.baruDitambahkan &&
        infoPerubahan.kode === prov.kode &&
        !apakahKurangiGerak()
      ) {
        gsap.fromTo(
          bungkusVisual,
          { scale: 1.35, rotation: -6 },
          { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(1.8)' }
        );
      }
    });

    wadahUtama.appendChild(kisi);

    // =========================================================================
    // 6. Kaki Paspor: Navigasi Aksi Lengkap & Reset dengan Konfirmasi Aman
    // =========================================================================
    const kaki = document.createElement('div');
    kaki.className = 'paspor-kaki';

    const barisAksiKiri = document.createElement('div');
    barisAksiKiri.className = 'paspor-kaki-grup-kiri';

    const btnBukaPeta = document.createElement('a');
    btnBukaPeta.href = './jelajah.html';
    btnBukaPeta.className = 'tombol tombol--utama paspor-kaki-btn';
    btnBukaPeta.innerHTML = '<span>Jelajahi Peta 3D</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';

    const btnSalinStatus = document.createElement('button');
    btnSalinStatus.type = 'button';
    btnSalinStatus.className = 'tombol tombol--garis paspor-kaki-btn';
    btnSalinStatus.innerHTML = '<span>Salin Lembar Paspor</span> <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    btnSalinStatus.addEventListener('click', async () => {
      const teksShare = `Paspor Budaya Nusantara Lokalocal: ${jumlahTerkumpul}/38 provinsi terkumpul dengan gelar '${infoGelar.gelar}' (${infoGelar.tingkat}). Budaya Indonesia tidak sedikit, yang sedikit adalah yang sudah tercatat.`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Paspor Budaya Nusantara — Lokalocal',
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
        tampilkanToast('Status Paspor Budaya berhasil disalin ke papan klip.');
      } catch {
        tampilkanToast('Salin tautan dari bilah alamat browser.');
      }
    });

    barisAksiKiri.append(btnBukaPeta, btnSalinStatus);

    const barisAksiKanan = document.createElement('div');
    barisAksiKanan.className = 'paspor-kaki-grup-kanan';

    if (jumlahTerkumpul > 0) {
      if (!sedangKonfirmasiReset) {
        const btnReset = document.createElement('button');
        btnReset.type = 'button';
        btnReset.className = 'tombol tombol--garis paspor-tombol-reset';
        btnReset.textContent = 'Mulai ulang paspor';
        btnReset.addEventListener('click', () => {
          sedangKonfirmasiReset = true;
          render();
        });
        barisAksiKanan.appendChild(btnReset);
      } else {
        const grupKonfirmasi = document.createElement('div');
        grupKonfirmasi.className = 'paspor-konfirmasi-reset-kotak';

        const teksTanya = document.createElement('span');
        teksTanya.className = 'paspor-konfirmasi-teks';
        teksTanya.textContent = 'Hapus semua stempel dan mulai dari 0?';

        const btnYa = document.createElement('button');
        btnYa.type = 'button';
        btnYa.className = 'tombol tombol--utama paspor-btn-konfirmasi-ya';
        btnYa.textContent = 'Ya, reset';
        btnYa.addEventListener('click', () => {
          sedangKonfirmasiReset = false;
          pengelolaPaspor.resetPaspor();
          tampilkanToast('Paspor Budaya telah diatur ulang ke 0/38.');
        });

        const btnBatal = document.createElement('button');
        btnBatal.type = 'button';
        btnBatal.className = 'tombol tombol--garis paspor-btn-konfirmasi-batal';
        btnBatal.textContent = 'Batal';
        btnBatal.addEventListener('click', () => {
          sedangKonfirmasiReset = false;
          render();
        });

        grupKonfirmasi.append(teksTanya, btnYa, btnBatal);
        barisAksiKanan.appendChild(grupKonfirmasi);
      }
    }

    kaki.append(barisAksiKiri, barisAksiKanan);
    wadahUtama.appendChild(kaki);
  }

  // Langganan perubahan stempel paspor
  pengelolaPaspor.langganan((_stempel, info) => {
    render(info);

    if (info && info.aksi === 'tambah' && info.baruDitambahkan) {
      const namaProv = petaNamaProv.get(info.kode) || 'Provinsi';
      if (info.baruSelesai38) {
        tampilkanToast('Selamat! Seluruh 38 provinsi di Paspor Budaya telah kamu jelajahi!', 4500);
      } else if (info.jenis !== 'penjaga') {
        tampilkanToast(`Stempel baru: ${namaProv}!`);
      }
    }
  });

  render();
  return { segarkan: () => render() };
}
