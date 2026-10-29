/**
 * gelap.js — Bagian S4 (Yang Masih Gelap): peta sorotan 10 provinsi belum_tercatat
 * dengan pola arsir diagonal, animasi A-07 & A-08, daftar 10 chip provinsi interaktif,
 * dan tampilan keadaan kosong yang jujur (WEB_SPEC.md Bagian 3 S4 & 4.5).
 */

import { renderPetaSvg } from '../map/render.js';
import { pasangInteraksiPeta } from '../map/interactions.js';
import { gsap, ScrollTrigger, pasangMatchMediaAnimasi } from '../util/motion.js';
import { formatAngka } from '../util/format.js';
import { ikonLentera } from '../ui/ikon.js';
import { apakahLenteraMenyala, nyalakanLentera } from '../features/lentera.js';

/**
 * Menginisialisasi bagian S4 (10 Provinsi Belum Tercatat di SPKT).
 * @param {object} dataAwal - { statistik, provinsi, geoProvinsi, meta }
 * @param {object} [opsi]
 * @param {(kode: string) => void} [opsi.saatPilihProvinsiKeJelajah]
 */
export function inisialisasiBagianGelap({ statistik, provinsi, geoProvinsi, meta }, opsi = {}) {
  const elJumlahBelum = document.getElementById('s4-jumlah-belum');
  const wadahPeta = document.getElementById('s4-peta-wadah');
  const tooltipEl = document.getElementById('s4-peta-tooltip');
  const wadahChipBelum = document.getElementById('s4-daftar-provinsi-belum');
  const wadahDetailKosong = document.getElementById('s4-detail-provinsi-kosong');

  const tanggalTerformat = meta?.tanggal_ambil_terformat || '9 Oktober 2026';
  const provBelum = Array.isArray(provinsi)
    ? provinsi.filter((p) => p.status_data === 'belum_tercatat')
    : [];

  if (elJumlahBelum) {
    elJumlahBelum.textContent = formatAngka(statistik?.provinsi_belum_tercatat ?? provBelum.length);
  }

  let kontrolPeta = null;
  let instansPeta = null;

  // Fungsi untuk menampilkan penjelasan jujur saat salah satu provinsi diklik
  function tampilkanPenjelasanProvinsi(kode) {
    const targetProv = provinsiDariKode(kode);
    if (!targetProv || !wadahDetailKosong) return;

    // Perbarui status aria-pressed pada daftar chip
    if (wadahChipBelum) {
      const semuaTombol = wadahChipBelum.querySelectorAll('button[data-kode]');
      for (const btn of semuaTombol) {
        btn.setAttribute('aria-pressed', String(btn.dataset.kode === String(kode)));
      }
    }

    wadahDetailKosong.textContent = '';
    wadahDetailKosong.hidden = false;

    const kepala = document.createElement('div');
    kepala.style.display = 'flex';
    kepala.style.flexWrap = 'wrap';
    kepala.style.justifyContent = 'space-between';
    kepala.style.alignItems = 'center';
    kepala.style.gap = 'var(--ruang-2)';

    const judul = document.createElement('h3');
    judul.style.fontSize = '1.15rem';
    judul.textContent = targetProv.nama;

    const lencana = document.createElement('span');
    lencana.className = 'chip-jenis';
    const ikonArsir = document.createElement('span');
    ikonArsir.className = 's4-ikon-arsir';
    ikonArsir.setAttribute('aria-hidden', 'true');
    const teksLencana = document.createElement('span');
    teksLencana.textContent = targetProv.status_data === 'belum_tercatat'
      ? 'Belum tercatat di SPKT'
      : `${formatAngka(targetProv.total)} catatan tercatat`;
    lencana.append(ikonArsir, teksLencana);

    kepala.append(judul, lencana);

    const deskripsi = document.createElement('p');
    deskripsi.style.fontSize = 'var(--teks-kecil)';
    deskripsi.style.color = 'var(--kertas-redup)';

    if (targetProv.status_data === 'belum_tercatat') {
      const tebal = document.createElement('strong');
      tebal.style.color = 'var(--kertas)';
      tebal.textContent = 'Belum tercatat di SPKT. ';
      deskripsi.append(
        tebal,
        document.createTextNode(
          `Bukan berarti tidak ada budaya di ${targetProv.nama}. Datanya belum sampai ke sistem pada ${tanggalTerformat}.`
        )
      );
    } else {
      deskripsi.textContent = `${targetProv.nama} memiliki ${formatAngka(targetProv.total)} catatan di SPKT per ${tanggalTerformat}.`;
    }

    wadahDetailKosong.append(kepala, deskripsi);

    if (targetProv.status_data === 'belum_tercatat') {
      const boxLentera = document.createElement('div');
      boxLentera.className = 's4-lentera-box';
      boxLentera.style.marginTop = 'var(--ruang-2)';
      boxLentera.style.marginBottom = 'var(--ruang-2)';

      const sudahMenyala = apakahLenteraMenyala(targetProv.kode);
      const btnLentera = document.createElement('button');
      btnLentera.type = 'button';
      btnLentera.className = `tombol tombol--utama btn-s4-lentera ${sudahMenyala ? 'lentera-sudah-aktif' : ''}`;
      btnLentera.innerHTML = `
        <span class="lentera-btn-svg" aria-hidden="true">${ikonLentera(18)}</span>
        <span class="lentera-btn-teks">${sudahMenyala ? 'Lentera Telah Menyala' : 'Nyalakan Lentera Pendataan'}</span>
      `;
      btnLentera.addEventListener('click', () => {
        const res = nyalakanLentera(targetProv.kode, targetProv.nama);
        if (res.berhasil) {
          btnLentera.classList.add('lentera-sudah-aktif');
          const teks = btnLentera.querySelector('.lentera-btn-teks');
          if (teks) teks.textContent = 'Lentera Telah Menyala';
        }
      });
      boxLentera.appendChild(btnLentera);
      wadahDetailKosong.appendChild(boxLentera);
    }

    if (typeof opsi.saatPilihProvinsiKeJelajah === 'function') {
      const aksi = document.createElement('div');
      aksi.style.marginTop = 'var(--ruang-1)';
      const tombolKeJelajah = document.createElement('a');
      tombolKeJelajah.href = '#jelajah';
      tombolKeJelajah.className = 'tombol tombol--garis';
      tombolKeJelajah.textContent = `Buka ${targetProv.nama} di panel Jelajah`;
      tombolKeJelajah.addEventListener('click', () => {
        opsi.saatPilihProvinsiKeJelajah(targetProv.kode);
      });
      aksi.appendChild(tombolKeJelajah);
      wadahDetailKosong.appendChild(aksi);
    }
  }

  function provinsiDariKode(kode) {
    return (provinsi || []).find((p) => String(p.kode) === String(kode)) || null;
  }

  // Render peta S4
  if (wadahPeta && geoProvinsi) {
    instansPeta = renderPetaSvg(wadahPeta, {
      geoProvinsi,
      daftarProvinsi: provinsi,
      idUnik: 's4-gelap',
      modeAwal: 'jumlah',
      interaktif: true
    });

    kontrolPeta = pasangInteraksiPeta(instansPeta, {
      tooltipEl,
      saatPilihProvinsi: (kode) => {
        tampilkanPenjelasanProvinsi(kode);
      }
    });
  }

  // Render 10 chip provinsi belum_tercatat sebagai tombol interaktif
  if (wadahChipBelum) {
    wadahChipBelum.textContent = '';
    for (const p of provBelum) {
      const li = document.createElement('li');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 's4-chip-tombol';
      btn.dataset.kode = p.kode;
      btn.setAttribute('aria-pressed', 'false');

      const kotakArsir = document.createElement('span');
      kotakArsir.className = 's4-ikon-arsir';
      kotakArsir.setAttribute('aria-hidden', 'true');

      const teks = document.createElement('span');
      teks.textContent = p.nama;

      btn.append(kotakArsir, teks);
      btn.addEventListener('click', () => {
        if (kontrolPeta) {
          kontrolPeta.pilihProvinsi(p.kode);
        } else {
          tampilkanPenjelasanProvinsi(p.kode);
        }
      });

      li.appendChild(btn);
      wadahChipBelum.appendChild(li);
    }
  }

  // Tampilkan provinsi belum_tercatat pertama secara default di kartu penjelasan jujur
  if (provBelum.length > 0) {
    tampilkanPenjelasanProvinsi(provBelum[0].kode);
  }

  // Animasi A-07 (meredupkan provinsi berdata & menonjolkan 10 provinsi arsir) & A-08 (denyut lembut di desktop)
  if (instansPeta) {
    const pathBerdata = instansPeta.grupProvinsi.querySelectorAll(
      '.provinsi-grup[data-status="ada"] .provinsi-path'
    );
    const pathBelum = instansPeta.grupProvinsi.querySelectorAll(
      '.provinsi-grup[data-status="belum_tercatat"] .provinsi-path'
    );

    pasangMatchMediaAnimasi({
      desktop: () => {
        gsap.set(pathBerdata, { opacity: 0.75 });
        ScrollTrigger.create({
          trigger: '#provinsi-gelap',
          start: 'top 75%',
          once: true,
          onEnter: () => {
            // A-07: Provinsi berdata meredup ke 0.32
            gsap.to(pathBerdata, {
              opacity: 0.32,
              duration: 0.8,
              ease: 'power2.out'
            });

            // A-08: Denyut lembut pada 10 provinsi arsir (hanya di desktop)
            gsap.fromTo(
              pathBelum,
              { opacity: 0.72 },
              {
                opacity: 1,
                duration: 2.4,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true
              }
            );
          }
        });
      },
      ponsel: () => {
        // Di ponsel tetap statis tanpa animasi berulang sesuai WEB_SPEC.md Bagian 3 (S4) & 7.2
        gsap.set(pathBerdata, { opacity: 0.32 });
        gsap.set(pathBelum, { opacity: 1 });
      },
      kurangiGerak: () => {
        gsap.set(pathBerdata, { opacity: 0.32 });
        gsap.set(pathBelum, { opacity: 1 });
      }
    });
  }
}
