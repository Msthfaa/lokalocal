/**
 * konsentrasi.js — Bagian S3 (Cahaya Tidak Merata): visual waffle 10x10 (A-05)
 * dan grafik bar horizontal 5 provinsi teratas (A-06).
 * Sesuai WEB_SPEC.md Bagian 3 (S3) & Bagian 7.2.
 */

import { gsap, ScrollTrigger, pasangMatchMediaAnimasi } from '../util/motion.js';
import { formatAngka, formatPersen } from '../util/format.js';

/**
 * Menginisialisasi bagian S3 Cahaya Tidak Merata (Konsentrasi Data).
 * @param {object} dataAwal - { statistik }
 */
export function inisialisasiBagianKonsentrasi({ statistik }) {
  if (!statistik || !statistik.konsentrasi) return;

  const { kabupaten_teratas: kabTeratas, top5_provinsi_persen: top5Persen, top5_provinsi: top5List } =
    statistik.konsentrasi;

  const persenBulat = Math.round(Number(kabTeratas?.persen || 17));
  const elPersenKab = document.getElementById('s3-persen-kabupaten');
  const elNamaKab = document.getElementById('s3-nama-kabupaten');
  const elProvKab = document.getElementById('s3-provinsi-kabupaten');
  const elJumlahKab = document.getElementById('s3-jumlah-kabupaten');
  const elTop5Persen = document.getElementById('s3-top5-persen');

  if (elPersenKab) elPersenKab.textContent = formatAngka(persenBulat);
  if (elNamaKab && kabTeratas) elNamaKab.textContent = kabTeratas.nama;
  if (elProvKab && kabTeratas) elProvKab.textContent = kabTeratas.provinsi;
  if (elJumlahKab && kabTeratas) elJumlahKab.textContent = formatAngka(kabTeratas.jumlah);
  if (elTop5Persen) elTop5Persen.textContent = formatPersen(top5Persen);

  // 1. Bangun kisi waffle 10x10 (100 kotak)
  const wadahWaffle = document.getElementById('s3-waffle-grid');
  const selSorot = [];

  if (wadahWaffle) {
    wadahWaffle.textContent = '';
    wadahWaffle.setAttribute(
      'aria-label',
      `Diagram waffle 100 kotak: ${persenBulat} dari 100 kotak berasal dari ${kabTeratas?.nama || 'Kota Pariaman'}`
    );

    for (let i = 0; i < 100; i++) {
      const sel = document.createElement('div');
      sel.className = 'waffle-sel';
      if (i < persenBulat) {
        sel.classList.add('is-sorot');
        selSorot.push(sel);
      }
      wadahWaffle.appendChild(sel);
    }
  }

  // 2. Bangun bar horizontal 5 provinsi teratas
  const wadahBar = document.getElementById('s3-daftar-top5');
  const elemenBarIsi = [];

  if (wadahBar && Array.isArray(top5List)) {
    wadahBar.textContent = '';
    const maksTop5 = top5List.reduce((m, p) => Math.max(m, Number(p.total || 0)), 1);

    for (const item of top5List) {
      const li = document.createElement('li');
      li.className = 'bar-top5-item';

      const info = document.createElement('div');
      info.className = 'bar-top5-info';

      const nama = document.createElement('span');
      nama.className = 'bar-top5-nama';
      nama.textContent = item.nama;

      const angka = document.createElement('span');
      angka.className = 'bar-top5-angka';
      angka.textContent = `${formatAngka(item.total)} catatan (${formatPersen(item.persen)})`;

      info.append(nama, angka);

      const trek = document.createElement('div');
      trek.className = 'bar-top5-trek';
      trek.setAttribute('aria-hidden', 'true');

      const isi = document.createElement('div');
      isi.className = 'bar-top5-isi';
      const lebarPersen = Math.max(6, Math.round((Number(item.total || 0) / maksTop5) * 100));
      isi.style.width = `${lebarPersen}%`;

      trek.appendChild(isi);
      li.append(info, trek);
      wadahBar.appendChild(li);
      elemenBarIsi.push(isi);
    }
  }

  // 3. Animasi A-05 (waffle) & A-06 (bar top-5)
  pasangMatchMediaAnimasi({
    desktop: () => {
      if (selSorot.length > 0) {
        gsap.set(selSorot, { scale: 0.4, opacity: 0.25 });
        ScrollTrigger.create({
          trigger: '#s3-waffle-grid',
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(selSorot, {
              scale: 1,
              opacity: 1,
              duration: 0.35,
              stagger: 0.02,
              ease: 'back.out(1.5)'
            });
          }
        });
      }

      if (elemenBarIsi.length > 0) {
        gsap.set(elemenBarIsi, { scaleX: 0 });
        ScrollTrigger.create({
          trigger: '#s3-daftar-top5',
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(elemenBarIsi, {
              scaleX: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: 'power3.out',
              clearProps: 'willChange'
            });
          }
        });
      }
    },
    ponsel: () => {
      if (selSorot.length > 0) {
        gsap.set(selSorot, { opacity: 0.3 });
        ScrollTrigger.create({
          trigger: '#s3-waffle-grid',
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(selSorot, {
              opacity: 1,
              duration: 0.3,
              stagger: 0.018,
              ease: 'power2.out'
            });
          }
        });
      }

      if (elemenBarIsi.length > 0) {
        gsap.set(elemenBarIsi, { scaleX: 0 });
        ScrollTrigger.create({
          trigger: '#s3-daftar-top5',
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(elemenBarIsi, {
              scaleX: 1,
              duration: 0.7,
              stagger: 0.08,
              ease: 'power3.out',
              clearProps: 'willChange'
            });
          }
        });
      }
    },
    kurangiGerak: () => {
      if (selSorot.length > 0) {
        gsap.set(selSorot, { scale: 1, opacity: 1 });
      }
      if (elemenBarIsi.length > 0) {
        gsap.set(elemenBarIsi, { scaleX: 1 });
      }
    }
  });
}
