/**
 * tur-sinematik.js — Autopilot Drone Tour 3D Melintasi 6 Gugus Wilayah Kepulauan Nusantara
 * Mengendalikan transisi interpolasi kamera sinematik Three.js + GSAP,
 * kartu narasi budaya per zona, serta penanganan interaksi drag manual yang mulus.
 */

import gsap from 'gsap';
import { Vector3 } from 'three';
import { tampilkanToast } from '../../ui/toast.js';

export const DAFTAR_ZONA_TUR = [
  {
    nomor: 1,
    zonaId: 'sumatera',
    provinsiKode: '13',
    judul: 'Sumatera: Gerbang Barat & Warisan Luhur',
    subjudul: '119 Rekaman di Sumbar • Randai, Silek Harimau Lalok, & Balai Kaliki',
    deskripsi: 'Gugusan peradaban barat dengan 119 catatan budaya di Sumatera Barat: seni teater tutur Randai, bela diri Silek Harimau Lalok Pariaman, dan kawasan adat Balai Kaliki.',
    offsetLookAt: { x: -1.8, y: 0.12, z: 0.35 },
    offsetPos: { x: -1.5, y: 1.45, z: 2.45 },
    rotY: 0.15
  },
  {
    nomor: 2,
    zonaId: 'jawa',
    provinsiKode: '35',
    judul: 'Jawa: Warisan Kesenian & Ragam Motif',
    subjudul: '167 Rekaman Budaya • Bantengan, Wayang Kulit Gagrak, & Batik Garutan',
    deskripsi: 'Episentrum seni pertunjukan dan kerajinan tradisi: seni Bantengan Pasuruan, Wayang Kulit Gagrak Porongan, hingga ragam filosofi motif Batik Garutan & Cianjur.',
    offsetLookAt: { x: -0.3, y: 0.12, z: 0.95 },
    offsetPos: { x: -0.25, y: 1.35, z: 2.25 },
    rotY: -0.04
  },
  {
    nomor: 3,
    zonaId: 'bali-nusa',
    provinsiKode: '51',
    judul: 'Bali & Kepulauan Nusa: Dinamika Seni & Tradisi',
    subjudul: '9 Rekaman Tercatat • Ogoh-Ogoh, Okokan, Gending Ratu Anom, & Knobe',
    deskripsi: 'Seni pertunjukan Ogoh-Ogoh, tradisi bunyi Okokan Tabanan, tembang Gending Ratu Anom di Bali, hingga alat musik tradisi Knobe dari Nusa Tenggara Timur.',
    offsetLookAt: { x: 0.75, y: 0.12, z: 1.15 },
    offsetPos: { x: 0.8, y: 1.35, z: 2.3 },
    rotY: -0.14
  },
  {
    nomor: 4,
    zonaId: 'kalimantan',
    provinsiKode: '61',
    judul: 'Kalimantan: Kearifan Rumah Panjang & Ritus Bahari',
    subjudul: '59 Rekaman Budaya • Rumah Panjang Nanga Siyai, Naq Hudoq, & Keringut',
    deskripsi: 'Arsitektur Rumah Panjang Nanga Siyai, topeng ritus Naq Hudoq Dayak Bahau, instrumen musik petik Jatung Utang, serta alat musik tiup Keringut Dayak Punan.',
    offsetLookAt: { x: -0.45, y: 0.12, z: -0.1 },
    offsetPos: { x: -0.4, y: 1.5, z: 2.35 },
    rotY: 0.08
  },
  {
    nomor: 5,
    zonaId: 'sulawesi',
    provinsiKode: '73',
    judul: 'Sulawesi: Arsitektur Adat & Jejak Aksara',
    subjudul: '49 Rekaman Budaya • Aksara Lontaraq, Rumah Kajang, & Pakaian Adat Bada',
    deskripsi: 'Dokumentasi aksara Lontaraq Bugis-Makassar, arsitektur bersahaja Balla To Kajang, istana Raja Kulawi, serta busana serat kayu Bada Sulawesi Tengah.',
    offsetLookAt: { x: 0.65, y: 0.12, z: 0.15 },
    offsetPos: { x: 0.7, y: 1.45, z: 2.35 },
    rotY: -0.12
  },
  {
    nomor: 6,
    zonaId: 'maluku-papua',
    provinsiKode: '91',
    judul: 'Maluku & Papua: Negeri Rempah & Bumi Cenderawasih',
    subjudul: '17 Rekaman Tercatat • Rumah Adat Sasadu, Tari Togal, & Limne Ketengban',
    deskripsi: 'Arsitektur musyawarah Sasadu Maluku Utara, kesyahduan Tari Togal, perkusi Kelambut Papua, hingga gerak tari adat Limne suku Ketengban Papua Pegunungan.',
    offsetLookAt: { x: 1.95, y: 0.12, z: 0.35 },
    offsetPos: { x: 1.85, y: 1.5, z: 2.5 },
    rotY: -0.22
  }
];

const DURASI_PER_ZONA_DETIK = 7;

/**
 * Membuat mesin pengontrol Tur Sinematik Autopilot 3D.
 */
export function buatPengontrolTurSinematik({
  camera,
  cameraBasePos,
  cameraTargetPos,
  cameraTargetLookAt,
  aturRotasiDiorama,
  pilihProvinsiMesh,
  kembalikanPilihanProvinsi
}) {
  let sedangBerjalan = false;
  let sedangDijeda = false;
  let indeksZona = 0;
  let timerZona = null;
  let tweenKamera = null;
  let waktuMulaiZona = 0;
  let sisaWaktuMs = DURASI_PER_ZONA_DETIK * 1000;
  let idRafProgres = null;

  // Elemen DOM HUD Overlay
  const overlayEl = document.getElementById('jelajah-tur-overlay');
  const zonaLangkahEl = document.getElementById('jelajah-tur-zona-langkah');
  const judulEl = document.getElementById('jelajah-tur-judul');
  const deskripsiEl = document.getElementById('jelajah-tur-deskripsi');
  const progresIsiEl = document.getElementById('jelajah-tur-progres-isi');
  const btnJeda = document.getElementById('jelajah-tur-btn-jeda');
  const ikonJeda = document.getElementById('jelajah-tur-ikon-jeda');
  const teksJeda = document.getElementById('jelajah-tur-teks-jeda');
  const btnLanjut = document.getElementById('jelajah-tur-btn-lanjut');
  const btnKeluar = document.getElementById('jelajah-tur-btn-keluar');
  const btnTriggerHud = document.getElementById('hud-tur-sinematik');

  function perbaruiUIOverlay(zona) {
    if (!overlayEl) return;
    overlayEl.hidden = false;
    overlayEl.classList.add('aktif');

    if (zonaLangkahEl) {
      zonaLangkahEl.textContent = `Wilayah ${zona.nomor} dari ${DAFTAR_ZONA_TUR.length}`;
    }
    if (judulEl) {
      judulEl.textContent = zona.judul;
    }
    if (deskripsiEl) {
      deskripsiEl.textContent = zona.deskripsi;
    }
    if (btnTriggerHud) {
      btnTriggerHud.classList.add('aktif-tur');
    }
  }

  function mulaiAnimasiProgresBar(durasiMs) {
    if (!progresIsiEl) return;
    waktuMulaiZona = performance.now();
    cancelAnimationFrame(idRafProgres);

    function updateProgres(now) {
      if (!sedangBerjalan) return;
      if (!sedangDijeda) {
        const berlalu = now - waktuMulaiZona;
        const persen = Math.min(100, (berlalu / durasiMs) * 100);
        progresIsiEl.style.width = `${persen}%`;
      }
      idRafProgres = requestAnimationFrame(updateProgres);
    }

    idRafProgres = requestAnimationFrame(updateProgres);
  }

  function terbangKeZona(idx) {
    if (!sedangBerjalan) return;
    if (idx >= DAFTAR_ZONA_TUR.length) {
      selesaikanTur();
      return;
    }

    indeksZona = idx;
    const zona = DAFTAR_ZONA_TUR[indeksZona];
    perbaruiUIOverlay(zona);

    // Sorot provinsi representatif di peta jika ada fungsinya
    if (typeof pilihProvinsiMesh === 'function') {
      pilihProvinsiMesh(zona.provinsiKode);
    }

    // Atur rotasi diorama ke sudut zona
    if (typeof aturRotasiDiorama === 'function') {
      aturRotasiDiorama(zona.rotY);
    }

    // Gerakkan kamera ke target zona dengan transisi mulus
    if (tweenKamera) tweenKamera.kill();

    const targetPos = new Vector3(zona.offsetPos.x, zona.offsetPos.y, zona.offsetPos.z);
    const targetLook = new Vector3(zona.offsetLookAt.x, zona.offsetLookAt.y, zona.offsetLookAt.z);

    tweenKamera = gsap.timeline();
    tweenKamera.to(cameraTargetPos, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 2.2,
      ease: 'power2.inOut'
    }, 0);

    tweenKamera.to(cameraTargetLookAt, {
      x: targetLook.x,
      y: targetLook.y,
      z: targetLook.z,
      duration: 2.2,
      ease: 'power2.inOut'
    }, 0);

    // Jadwalkan transisi ke zona berikutnya setelah durasi selesai
    clearTimeout(timerZona);
    sisaWaktuMs = DURASI_PER_ZONA_DETIK * 1000;
    mulaiAnimasiProgresBar(sisaWaktuMs);

    timerZona = setTimeout(() => {
      terbangKeZona(indeksZona + 1);
    }, sisaWaktuMs);
  }

  function mulaiTur() {
    if (sedangBerjalan) return;
    sedangBerjalan = true;
    sedangDijeda = false;
    indeksZona = 0;

    tampilkanToast('Memulai Tur Sinematik Drone Nusantara... Nikmati penerbanganmu 🎥✨');
    terbangKeZona(0);
  }

  function jedaAtauLanjutkan() {
    if (!sedangBerjalan) return;

    sedangDijeda = !sedangDijeda;
    if (sedangDijeda) {
      clearTimeout(timerZona);
      if (ikonJeda) ikonJeda.textContent = '▶';
      if (teksJeda) teksJeda.textContent = 'Lanjut';
      tampilkanToast('Tur Sinematik dijeda.');
    } else {
      if (ikonJeda) ikonJeda.textContent = '⏸';
      if (teksJeda) teksJeda.textContent = 'Jeda';
      timerZona = setTimeout(() => {
        terbangKeZona(indeksZona + 1);
      }, 3500);
      mulaiAnimasiProgresBar(3500);
      tampilkanToast('Melanjutkan tur sinematik...');
    }
  }

  function lompatZonaBerikutnya() {
    if (!sedangBerjalan) return;
    clearTimeout(timerZona);
    terbangKeZona(indeksZona + 1);
  }

  function hentikanTur(pesanManual = false) {
    if (!sedangBerjalan) return;
    sedangBerjalan = false;
    sedangDijeda = false;

    clearTimeout(timerZona);
    cancelAnimationFrame(idRafProgres);
    if (tweenKamera) tweenKamera.kill();

    if (overlayEl) {
      overlayEl.classList.remove('aktif');
      overlayEl.hidden = true;
    }
    if (btnTriggerHud) {
      btnTriggerHud.classList.remove('aktif-tur');
    }

    if (typeof kembalikanPilihanProvinsi === 'function') {
      kembalikanPilihanProvinsi();
    }

    // Kembalikan orientasi kamera ke pandangan penuh Nusantara
    gsap.to(cameraTargetPos, {
      x: cameraBasePos.x,
      y: cameraBasePos.y,
      z: cameraBasePos.z,
      duration: 1.4,
      ease: 'power2.out'
    });
    gsap.to(cameraTargetLookAt, {
      x: 0,
      y: 0.12,
      z: 0,
      duration: 1.4,
      ease: 'power2.out'
    });

    if (pesanManual) {
      tampilkanToast('Tur Sinematik dihentikan. Kendali manual aktif kembali ⛵');
    }
  }

  function selesaikanTur() {
    hentikanTur(false);
    tampilkanToast('Perjalanan melintasi 6 wilayah kepulauan selesai! Selamat mengarungi khazanah Nusantara lebih dalam 🌴✨');
  }

  // Pasang Listener Tombol HUD
  if (btnTriggerHud) {
    btnTriggerHud.addEventListener('click', () => {
      if (sedangBerjalan) {
        hentikanTur(true);
      } else {
        mulaiTur();
      }
    });
  }

  if (btnJeda) {
    btnJeda.addEventListener('click', jedaAtauLanjutkan);
  }

  if (btnLanjut) {
    btnLanjut.addEventListener('click', lompatZonaBerikutnya);
  }

  if (btnKeluar) {
    btnKeluar.addEventListener('click', () => {
      hentikanTur(true);
    });
  }

  // Tombol Escape menutup tur
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sedangBerjalan) {
      hentikanTur(true);
    }
  });

  return {
    mulai: mulaiTur,
    hentikan: hentikanTur,
    jeda: jedaAtauLanjutkan,
    lanjut: lompatZonaBerikutnya,
    apakahBerjalan: () => sedangBerjalan
  };
}
