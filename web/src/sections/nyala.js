/**
 * nyala.js — Bagian S2 (Peta Menyala): peta SVG 38 provinsi menyala dari barat ke timur (A-03),
 * penghitung count-up (A-04), langkah scrollytelling, dan legenda warna jenis OPK.
 * Sesuai WEB_SPEC.md Bagian 3 (S2), 5.3, dan 7.2–7.3.
 */

import { DAFTAR_JENIS_OPK } from '../config.js';
import { renderPetaSvg } from '../map/render.js';
import { pasangInteraksiPeta } from '../map/interactions.js';
import { gsap, ScrollTrigger, pasangMatchMediaAnimasi, animasiHitungAngka } from '../util/motion.js';
import { formatAngka } from '../util/format.js';

/**
 * Menginisialisasi bagian S2 Peta Menyala.
 * @param {object} dataAwal - { statistik, provinsi, geoProvinsi, meta }
 * @param {object} [opsi]
 * @param {(kode: string) => void} [opsi.saatKlikProvinsi]
 */
export function inisialisasiBagianNyala({ statistik, provinsi, geoProvinsi }, opsi = {}) {
  const wadahPeta = document.getElementById('s2-peta-wadah');
  const tooltipEl = document.getElementById('s2-peta-tooltip');
  const angkaVisualEl = document.getElementById('s2-angka-visual');
  const angkaSrEl = document.getElementById('s2-angka-sr');
  const elProvBerdata = document.getElementById('s2-provinsi-berdata');
  const elTotalProv = document.getElementById('s2-total-provinsi');
  const wadahLegenda = document.getElementById('s2-legenda-jenis');

  const totalRekaman = Number(statistik?.total_rekaman || 544);
  const provBerdata = Number(statistik?.provinsi_berdata || 28);
  const totalProv = provBerdata + Number(statistik?.provinsi_belum_tercatat || 10);

  if (angkaVisualEl) angkaVisualEl.textContent = formatAngka(totalRekaman);
  if (angkaSrEl) angkaSrEl.textContent = `${formatAngka(totalRekaman)} catatan budaya`;
  if (elProvBerdata) elProvBerdata.textContent = formatAngka(provBerdata);
  if (elTotalProv) elTotalProv.textContent = formatAngka(totalProv);

  // Isi legenda chip 5 jenis OPK + Cagar Budaya
  if (wadahLegenda) {
    wadahLegenda.textContent = '';
    const totalCagar = Number(statistik?.per_kategori?.CB || 0);

    for (const item of DAFTAR_JENIS_OPK) {
      const li = document.createElement('li');
      li.className = 'chip-jenis';

      const titik = document.createElement('span');
      titik.className = 'chip-titik';
      titik.dataset.jenis = item.kode;
      titik.setAttribute('aria-hidden', 'true');

      const jumlah =
        item.kode === 'cagar'
          ? totalCagar
          : Number(statistik?.per_jenis_opk?.[item.kode] || 0);

      const teks = document.createElement('span');
      teks.textContent = `${item.label} (${formatAngka(jumlah)})`;

      li.append(titik, teks);
      wadahLegenda.appendChild(li);
    }
  }

  if (!wadahPeta || !geoProvinsi) return;

  // Render peta S2 dengan mode default 'jenis-dominan' (sebagai keadaan akhir / fallback non-JS)
  const instansPeta = renderPetaSvg(wadahPeta, {
    geoProvinsi,
    daftarProvinsi: provinsi,
    idUnik: 's2-nyala',
    modeAwal: 'jenis-dominan',
    interaktif: true
  });

  pasangInteraksiPeta(instansPeta, {
    tooltipEl,
    saatPilihProvinsi: (kode) => {
      if (typeof opsi.saatKlikProvinsi === 'function') {
        opsi.saatKlikProvinsi(kode);
      }
    }
  });

  // Ambil seluruh grup provinsi yang punya data, urutkan dari barat ke timur berdasarkan cx
  const grupBerdata = Array.from(
    instansPeta.grupProvinsi.querySelectorAll('.provinsi-grup[data-status="ada"]')
  ).sort((a, b) => Number(a.dataset.cx || 0) - Number(b.dataset.cx || 0));

  const kartuLangkah = Array.from(document.querySelectorAll('#peta-menyala .s2-kartu-langkah'));

  function kembalikanWarnaAkhir() {
    for (const g of grupBerdata) {
      const path = g.querySelector('.provinsi-path');
      const warna = g.dataset.warnaDominan || '#E6B14A';
      if (path) path.setAttribute('fill', warna);
    }
    if (angkaVisualEl) {
      angkaVisualEl.textContent = formatAngka(totalRekaman);
    }
  }

  function jalankanUrutanMenyala() {
    for (let i = 0; i < grupBerdata.length; i++) {
      const g = grupBerdata[i];
      const path = g.querySelector('.provinsi-path');
      const warnaTarget = g.dataset.warnaDominan || '#E6B14A';
      if (!path) continue;

      gsap.fromTo(
        path,
        { attr: { fill: '#1E1916' } },
        {
          attr: { fill: warnaTarget },
          duration: 0.6,
          delay: i * 0.04,
          ease: 'power2.out'
        }
      );
    }

    if (angkaVisualEl) {
      animasiHitungAngka(angkaVisualEl, totalRekaman, 1.6);
    }
  }

  pasangMatchMediaAnimasi({
    desktop: () => {
      // Setel awal gelap sebelum masuk viewport
      for (const g of grupBerdata) {
        const path = g.querySelector('.provinsi-path');
        if (path) path.setAttribute('fill', '#1E1916');
      }

      ScrollTrigger.create({
        trigger: '#peta-menyala',
        start: 'top 70%',
        once: true,
        onEnter: () => {
          jalankanUrutanMenyala();
        }
      });

      // Sorot kartu langkah aktif saat digulir
      for (const kartu of kartuLangkah) {
        ScrollTrigger.create({
          trigger: kartu,
          start: 'top 65%',
          end: 'bottom 35%',
          toggleClass: { targets: kartu, className: 'is-aktif' }
        });
      }
    },
    ponsel: () => {
      for (const g of grupBerdata) {
        const path = g.querySelector('.provinsi-path');
        if (path) path.setAttribute('fill', '#1E1916');
      }

      ScrollTrigger.create({
        trigger: '#peta-menyala',
        start: 'top 75%',
        once: true,
        onEnter: () => {
          jalankanUrutanMenyala();
        }
      });
    },
    kurangiGerak: () => {
      kembalikanWarnaAkhir();
    }
  });
}
