/**
 * paspor.js (section) — Antarmuka bagian S7 Paspor Budaya (38 Stempel Provinsi)
 * Sesuai WEB_SPEC.md Bagian 8.1 & Bagian 7.2 (A-11).
 */

import { buatStempelProvinsiSvg } from '../patterns/generate.js';
import { formatAngka } from '../util/format.js';
import { gsap, apakahKurangiGerak } from '../util/motion.js';
import { tampilkanToast } from '../ui/toast.js';

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
  let sedangKonfirmasiReset = false;

  function render(infoPerubahan = null) {
    const semuaStempel = pengelolaPaspor.dapatkanSemuaStempel();
    const kodeTerkumpul = Object.keys(semuaStempel);
    const jumlahTerkumpul = kodeTerkumpul.length;
    const totalProvinsi = daftarProvinsi.length || 38;
    const persen = Math.round((jumlahTerkumpul / totalProvinsi) * 100);

    const jumlahBiasa = kodeTerkumpul.filter((k) => semuaStempel[k]?.jenis !== 'penjaga').length;
    const jumlahPenjaga = kodeTerkumpul.filter((k) => semuaStempel[k]?.jenis === 'penjaga').length;

    wadahUtama.textContent = '';

    // 1. Kepala Kartu Paspor
    const kepala = document.createElement('div');
    kepala.className = 'paspor-kepala';

    const judulGrup = document.createElement('div');
    const kicker = document.createElement('p');
    kicker.className = 'label-kecil';
    kicker.textContent = 'Koleksi Stempel Jelajah';

    const h3 = document.createElement('h3');
    h3.textContent = 'Paspor Budaya Nusantara';

    const ket = document.createElement('p');
    ket.style.fontSize = 'var(--teks-kecil)';
    ket.style.color = 'var(--kertas-redup)';
    ket.style.marginTop = '4px';
    ket.textContent =
      'Buka panel provinsi di peta Jelajah untuk mengumpulkan stempel provinsi berdata, atau tandai kepedulianmu pada provinsi yang belum tercatat untuk meraih stempel "Penjaga Cerita".';

    judulGrup.append(kicker, h3, ket);
    kepala.appendChild(judulGrup);
    wadahUtama.appendChild(kepala);

    // 2. Catatan jika localStorage tidak tersedia (WEB_SPEC.md 8.1)
    if (!pengelolaPaspor.apakahStorageTersedia()) {
      const catatanStorage = document.createElement('p');
      catatanStorage.className = 'paspor-catatan-storage';
      catatanStorage.setAttribute('role', 'status');
      catatanStorage.textContent = 'Progres tidak tersimpan di perangkat ini (penyimpanan lokal tidak tersedia).';
      wadahUtama.appendChild(catatanStorage);
    }

    // 3. Bar Progres "{n} dari 38 provinsi dijelajahi"
    const blokProgres = document.createElement('div');
    blokProgres.className = 'paspor-progres-blok';

    const barisInfoProgres = document.createElement('div');
    barisInfoProgres.className = 'paspor-progres-info';

    const teksProgres = document.createElement('strong');
    teksProgres.textContent = `${formatAngka(jumlahTerkumpul)} dari ${formatAngka(totalProvinsi)} provinsi dijelajahi`;

    const teksRincian = document.createElement('span');
    teksRincian.style.fontSize = '0.8125rem';
    teksRincian.style.color = 'var(--kertas-redup)';
    teksRincian.textContent = `${formatAngka(jumlahBiasa)} Tercatat • ${formatAngka(jumlahPenjaga)} Penjaga Cerita`;

    barisInfoProgres.append(teksProgres, teksRincian);

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
    wadahUtama.appendChild(blokProgres);

    // 4. Banner Perayaan jika 38/38 selesai
    if (jumlahTerkumpul >= totalProvinsi) {
      const perayaan = document.createElement('div');
      perayaan.className = 'kotak-catatan-jujur';
      perayaan.innerHTML = '';

      const pRayakan = document.createElement('p');
      const strongR = document.createElement('strong');
      strongR.textContent = 'Lengkap 38/38 Provinsi! ';
      pRayakan.append(
        strongR,
        document.createTextNode(
          'Kamu telah menelusuri seluruh provinsi — baik yang sudah tercatat maupun yang masih menunggu didokumentasikan. '
        )
      );

      const tautanPenutup = document.createElement('a');
      tautanPenutup.href = '#penutup';
      tautanPenutup.textContent = 'Lanjut ke bagian penutup ↓';
      pRayakan.appendChild(tautanPenutup);

      perayaan.appendChild(pRayakan);
      wadahUtama.appendChild(perayaan);
    }

    // 5. Kisi 38 Petak Stempel Provinsi
    const kisi = document.createElement('div');
    kisi.className = 'paspor-kisi-38';
    kisi.setAttribute('role', 'list');
    kisi.setAttribute('aria-label', 'Daftar 38 petak stempel provinsi');

    for (const prov of daftarProvinsi) {
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
          : 'stempel provinsi tercatat terkumpul'
        : adalahBelumTercatat
        ? 'belum dikunjungi (belum tercatat di SPKT)'
        : 'belum dikunjungi';

      petak.setAttribute('aria-label', `${prov.nama}: ${statusLabel}. Klik untuk membuka di peta Jelajah.`);

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
        const lingkaranKosong = document.createElement('span');
        lingkaranKosong.className = 'paspor-lingkaran-kosong';
        lingkaranKosong.textContent = prov.kode;
        bungkusVisual.appendChild(lingkaranKosong);
      }

      const labelNama = document.createElement('span');
      labelNama.className = 'paspor-petak-nama';
      labelNama.textContent = prov.nama;

      petak.append(bungkusVisual, labelNama);

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

      // Animasi A-11 jika petak ini baru saja mendapatkan stempel
      if (
        infoPerubahan &&
        infoPerubahan.aksi === 'tambah' &&
        infoPerubahan.baruDitambahkan &&
        infoPerubahan.kode === prov.kode &&
        !apakahKurangiGerak()
      ) {
        gsap.fromTo(
          bungkusVisual,
          { scale: 1.4, rotation: -8 },
          { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.6)' }
        );
      }
    }

    wadahUtama.appendChild(kisi);

    // 6. Kaki Paspor: Tombol Reset dengan Konfirmasi
    const kaki = document.createElement('div');
    kaki.className = 'paspor-kaki';

    if (jumlahTerkumpul > 0) {
      if (!sedangKonfirmasiReset) {
        const btnReset = document.createElement('button');
        btnReset.type = 'button';
        btnReset.className = 'tombol tombol--garis';
        btnReset.textContent = 'Mulai ulang paspor';
        btnReset.addEventListener('click', () => {
          sedangKonfirmasiReset = true;
          render();
        });
        kaki.appendChild(btnReset);
      } else {
        const grupKonfirmasi = document.createElement('div');
        grupKonfirmasi.style.display = 'flex';
        grupKonfirmasi.style.flexWrap = 'wrap';
        grupKonfirmasi.style.alignItems = 'center';
        grupKonfirmasi.style.gap = 'var(--ruang-2)';

        const teksTanya = document.createElement('span');
        teksTanya.style.fontSize = 'var(--teks-kecil)';
        teksTanya.textContent = 'Hapus semua stempel dan mulai dari 0?';

        const btnYa = document.createElement('button');
        btnYa.type = 'button';
        btnYa.className = 'tombol tombol--utama';
        btnYa.textContent = 'Ya, mulai ulang';
        btnYa.addEventListener('click', () => {
          sedangKonfirmasiReset = false;
          pengelolaPaspor.resetPaspor();
          tampilkanToast('Paspor Budaya telah diatur ulang ke 0/38.');
        });

        const btnBatal = document.createElement('button');
        btnBatal.type = 'button';
        btnBatal.className = 'tombol tombol--garis';
        btnBatal.textContent = 'Batal';
        btnBatal.addEventListener('click', () => {
          sedangKonfirmasiReset = false;
          render();
        });

        grupKonfirmasi.append(teksTanya, btnYa, btnBatal);
        kaki.appendChild(grupKonfirmasi);
      }
    } else {
      const petunjukAwal = document.createElement('span');
      petunjukAwal.style.fontSize = '0.8125rem';
      petunjukAwal.style.color = 'var(--kertas-redup)';
      petunjukAwal.textContent = 'Klik petak provinsi mana pun untuk mulai menjelajah dan mengumpulkan stempel pertama.';
      kaki.appendChild(petunjukAwal);
    }

    wadahUtama.appendChild(kaki);
  }

  // Langganan perubahan stempel
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
