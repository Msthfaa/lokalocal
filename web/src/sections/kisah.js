/**
 * kisah.js — Bagian S6 (Kisah Pilihan): 6 kartu besar dari rekaman kelas_konten = 'unggulan'
 * Dipilih dari provinsi dan jenis OPK yang beragam, rotasi stabil per sesi kunjungan,
 * dan animasi masuk A-09 saat scroll.
 * Sesuai WEB_SPEC.md Bagian 3 (S6) & Bagian 7.2 (A-09).
 */

import { buatElemenKartuCerita } from '../ui/kartu.js';
import { hashString } from '../util/hash.js';
import { gsap, ScrollTrigger, pasangMatchMediaAnimasi } from '../util/motion.js';

const KUNCI_SESI_SEED = 'atlasbudaya:seed_kisah:v1';

function dapatkanSeedSesi() {
  try {
    let tersimpan = window.sessionStorage.getItem(KUNCI_SESI_SEED);
    if (!tersimpan) {
      tersimpan = String(Date.now() % 100000);
      window.sessionStorage.setItem(KUNCI_SESI_SEED, tersimpan);
    }
    return tersimpan;
  } catch {
    return '20261009';
  }
}

/**
 * Memilih 6 rekaman unggulan dari provinsi berbeda dan mewakili 5 jenis OPK secara beragam.
 * @param {Array} daftarBudaya
 * @param {string} seedStr
 * @returns {Array}
 */
export function pilihEnamKisahUnggulan(daftarBudaya, seedStr = 'atlas') {
  const kandidat = daftarBudaya.filter(
    (r) => r.kelas_konten === 'unggulan' && r.punya_deskripsi && r.kategori_kode === 'OPK'
  );

  // Urutkan deterministik berdasarkan seedStr + id
  const teracak = [...kandidat].sort((a, b) => {
    const hA = hashString(`${seedStr}:${a.id}`);
    const hB = hashString(`${seedStr}:${b.id}`);
    return hA - hB;
  });

  const terpilih = [];
  const provinsiTerpakai = new Set();
  const urutanJenisTarget = ['kerajinan', 'seni', 'lisan', 'pengetahuan', 'adat'];

  // Tahap 1: Ambil 1 perwakilan untuk masing-masing dari 5 jenis OPK dari provinsi berbeda
  for (const jenisTarget of urutanJenisTarget) {
    const cocok = teracak.find(
      (r) => r.jenis_kode === jenisTarget && !provinsiTerpakai.has(r.kode_provinsi)
    );
    if (cocok) {
      terpilih.push(cocok);
      provinsiTerpakai.add(cocok.kode_provinsi);
    }
  }

  // Tahap 2: Genapkan menjadi 6 kartu dari provinsi yang belum terpakai
  for (const r of teracak) {
    if (terpilih.length >= 6) break;
    if (!provinsiTerpakai.has(r.kode_provinsi) && !terpilih.some((x) => x.id === r.id)) {
      terpilih.push(r);
      provinsiTerpakai.add(r.kode_provinsi);
    }
  }

  return terpilih.slice(0, 6);
}

/**
 * Menginisialisasi bagian S6 Kisah Pilihan.
 * @param {object} parameter
 * @param {(rekaman: object, pemicuEl: HTMLElement) => void} parameter.saatBukaDetailRekaman
 */
export function inisialisasiBagianKisah({ saatBukaDetailRekaman }) {
  const wadahKisah = document.getElementById('s6-kisi-kisah');
  if (!wadahKisah) return null;

  const tombolAcakKisah = document.getElementById('s6-tombol-acak');

  let daftarBudaya = [];
  let putaranSeed = 0;

  function renderEnamKisah(animasikan = false) {
    if (!wadahKisah || daftarBudaya.length === 0) return;

    const seedDasar = dapatkanSeedSesi();
    const pilihan = pilihEnamKisahUnggulan(daftarBudaya, `${seedDasar}-${putaranSeed}`);

    wadahKisah.textContent = '';
    const elemenKartu = [];

    for (const rek of pilihan) {
      const kartu = buatElemenKartuCerita(rek, {
        ukuran: 'unggulan',
        saatBacaSelengkapnya: (item, pemicu) => {
          if (typeof saatBukaDetailRekaman === 'function') {
            saatBukaDetailRekaman(item, pemicu);
          }
        }
      });
      wadahKisah.appendChild(kartu);
      elemenKartu.push(kartu);
    }

    if (animasikan && elemenKartu.length > 0) {
      pasangMatchMediaAnimasi({
        desktop: () => {
          gsap.fromTo(
            elemenKartu,
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: wadahKisah,
                start: 'top 85%',
                once: true
              }
            }
          );
        },
        ponsel: () => {
          gsap.fromTo(
            elemenKartu,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.55,
              stagger: 0.08,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: wadahKisah,
                start: 'top 88%',
                once: true
              }
            }
          );
        },
        kurangiGerak: () => {
          gsap.set(elemenKartu, { y: 0, opacity: 1 });
        }
      });
      ScrollTrigger.refresh();
    }
  }

  if (tombolAcakKisah) {
    tombolAcakKisah.addEventListener('click', () => {
      putaranSeed += 1;
      renderEnamKisah(false);
    });
  }

  function terimaDataLengkap({ budaya = [] }) {
    daftarBudaya = budaya;
    renderEnamKisah(true);
  }

  return {
    terimaDataLengkap
  };
}
