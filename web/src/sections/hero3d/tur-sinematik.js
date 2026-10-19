/**
 * tur-sinematik.js — Autopilot Drone Tour 3D Melintasi 6 Gugus Wilayah Kepulauan Nusantara
 * Mengendalikan transisi interpolasi kamera sinematik Three.js + GSAP,
 * penyorotan pulau & penancapan bendera provinsi resmi SPKT,
 * voice over narasi suara berbahasa Indonesia murni Web Speech API,
 * serta penanganan interaksi drag manual yang mulus tanpa memblokir klik UI.
 */

import gsap from 'gsap';
import { Vector3 } from 'three';
import { tampilkanToast } from '../../ui/toast.js';

export const DAFTAR_ZONA_TUR = [
  {
    nomor: 1,
    zonaId: 'sumatera',
    provinsiKode: '13',
    provinsiNama: 'Sumatera Barat (119 Catatan)',
    judul: 'Sumatera: Gerbang Barat & Warisan Luhur',
    subjudul: 'Randai Minangkabau, Silek Harimau Lalok, & Kawasan Balai Kaliki',
    deskripsi: 'Gugusan peradaban barat dengan 119 catatan budaya di Sumatera Barat: seni teater tutur Randai, bela diri Silek Harimau Lalok Pariaman, dan kawasan adat Balai Kaliki.',
    offsetLookAt: { x: -2.2, y: 0.15, z: 0.2 },
    offsetPos: { x: -1.9, y: 2.9, z: 4.3 },
    rotY: 0.12
  },
  {
    nomor: 2,
    zonaId: 'jawa',
    provinsiKode: '35',
    provinsiNama: 'Jawa Timur (70 Catatan)',
    judul: 'Jawa: Warisan Kesenian & Ragam Motif',
    subjudul: 'Bantengan Pasuruan, Wayang Kulit Gagrak, & Batik Garutan',
    deskripsi: 'Episentrum seni pertunjukan dan kerajinan tradisi: seni Bantengan Pasuruan, Wayang Kulit Gagrak Porongan, hingga ragam filosofi motif Batik Garutan & Cianjur.',
    offsetLookAt: { x: -0.4, y: 0.15, z: 1.1 },
    offsetPos: { x: -0.3, y: 2.8, z: 4.3 },
    rotY: -0.02
  },
  {
    nomor: 3,
    zonaId: 'bali-nusa',
    provinsiKode: '51',
    provinsiNama: 'Bali (6 Catatan)',
    judul: 'Bali & Kepulauan Nusa: Dinamika Seni & Tradisi',
    subjudul: 'Ogoh-Ogoh, Okokan Tabanan, Gending Ratu Anom, & Knobe',
    deskripsi: 'Seni pertunjukan Ogoh-Ogoh, tradisi bunyi Okokan Tabanan, tembang Gending Ratu Anom di Bali, hingga alat musik tradisi Knobe dari Nusa Tenggara Timur.',
    offsetLookAt: { x: 1.0, y: 0.15, z: 1.25 },
    offsetPos: { x: 0.9, y: 2.8, z: 4.3 },
    rotY: -0.08
  },
  {
    nomor: 4,
    zonaId: 'kalimantan',
    provinsiKode: '61',
    provinsiNama: 'Kalimantan Barat (29 Catatan)',
    judul: 'Kalimantan: Kearifan Rumah Panjang & Ritus Bahari',
    subjudul: 'Rumah Panjang Nanga Siyai, Naq Hudoq, & Musik Keringut',
    deskripsi: 'Arsitektur Rumah Panjang Nanga Siyai, topeng ritus Naq Hudoq Dayak Bahau, instrumen musik petik Jatung Utang, serta alat musik tiup Keringut Dayak Punan.',
    offsetLookAt: { x: -0.6, y: 0.15, z: -0.2 },
    offsetPos: { x: -0.5, y: 3.1, z: 4.4 },
    rotY: 0.05
  },
  {
    nomor: 5,
    zonaId: 'sulawesi',
    provinsiKode: '73',
    provinsiNama: 'Sulawesi Selatan (33 Catatan)',
    judul: 'Sulawesi: Arsitektur Adat & Jejak Aksara',
    subjudul: 'Aksara Lontaraq, Rumah Kajang, & Pakaian Adat Bada',
    deskripsi: 'Dokumentasi aksara Lontaraq Bugis-Makassar, arsitektur bersahaja Balla To Kajang, istana Raja Kulawi, serta busana serat kayu Bada Sulawesi Tengah.',
    offsetLookAt: { x: 0.8, y: 0.15, z: 0.1 },
    offsetPos: { x: 0.8, y: 2.9, z: 4.3 },
    rotY: -0.06
  },
  {
    nomor: 6,
    zonaId: 'maluku-papua',
    provinsiKode: '82',
    provinsiNama: 'Maluku Utara (9 Catatan)',
    judul: 'Maluku & Papua: Negeri Rempah & Bumi Cenderawasih',
    subjudul: 'Rumah Adat Sasadu, Tari Togal, & Limne Ketengban',
    deskripsi: 'Arsitektur musyawarah Sasadu Maluku Utara, kesyahduan Tari Togal, perkusi Kelambut Papua, hingga gerak tari adat Limne suku Ketengban Papua Pegunungan.',
    offsetLookAt: { x: 2.3, y: 0.15, z: 0.25 },
    offsetPos: { x: 2.1, y: 3.0, z: 4.4 },
    rotY: -0.15
  }
];

const DURASI_PER_ZONA_DETIK = 9.5;

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

  // Voice Over (Web Speech API)
  let voiceOverAktif = true;
  const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

  // Elemen DOM HUD Overlay
  const overlayEl = document.getElementById('jelajah-tur-overlay');
  const zonaLangkahEl = document.getElementById('jelajah-tur-zona-langkah');
  const provinsiBadgeEl = document.getElementById('jelajah-tur-provinsi-badge');
  const judulEl = document.getElementById('jelajah-tur-judul');
  const subjudulEl = document.getElementById('jelajah-tur-subjudul');
  const deskripsiEl = document.getElementById('jelajah-tur-deskripsi');
  const progresIsiEl = document.getElementById('jelajah-tur-progres-isi');
  const btnJeda = document.getElementById('jelajah-tur-btn-jeda');
  const ikonJeda = document.getElementById('jelajah-tur-ikon-jeda');
  const teksJeda = document.getElementById('jelajah-tur-teks-jeda');
  const btnLanjut = document.getElementById('jelajah-tur-btn-lanjut');
  const btnKeluar = document.getElementById('jelajah-tur-btn-keluar');
  const btnTriggerHud = document.getElementById('hud-tur-sinematik');
  const btnVO = document.getElementById('jelajah-tur-btn-vo');
  const ikonVO = document.getElementById('jelajah-tur-ikon-vo');
  const teksVO = document.getElementById('jelajah-tur-teks-vo');

  function bicarakanNarasiZona(zona) {
    if (!synth || !voiceOverAktif) return;
    try {
      synth.cancel();
      const naskah = `${zona.judul}. Fokus provinsi ${zona.provinsiNama}. ${zona.subjudul}. ${zona.deskripsi}`;
      const utterance = new SpeechSynthesisUtterance(naskah);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Cari suara berbahasa Indonesia
      const voices = synth.getVoices();
      const idVoice = voices.find((v) => v.lang.startsWith('id') || v.lang.includes('ID'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      synth.speak(utterance);
    } catch (err) {
      console.warn('Voice Over speech synthesis kendala:', err);
    }
  }

  function hentikanVoiceOver() {
    if (synth) {
      synth.cancel();
    }
  }

  function perbaruiUIOverlay(zona) {
    if (!overlayEl) return;
    overlayEl.hidden = false;
    overlayEl.classList.add('aktif');

    if (zonaLangkahEl) {
      zonaLangkahEl.textContent = `Wilayah ${zona.nomor} dari ${DAFTAR_ZONA_TUR.length}`;
    }
    if (provinsiBadgeEl) {
      provinsiBadgeEl.textContent = `📍 Fokus: ${zona.provinsiNama}`;
    }
    if (judulEl) {
      judulEl.textContent = zona.judul;
    }
    if (subjudulEl) {
      subjudulEl.textContent = zona.subjudul;
    }
    if (deskripsiEl) {
      deskripsiEl.textContent = zona.deskripsi;
    }
    if (btnTriggerHud) {
      btnTriggerHud.classList.add('aktif-tur');
    }

    // Suarakan Voice Over
    bicarakanNarasiZona(zona);
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

    // Sorot provinsi representatif di peta 3D & tancapkan bendera
    if (typeof pilihProvinsiMesh === 'function') {
      pilihProvinsiMesh(zona.provinsiKode);
    }

    // Atur rotasi diorama ke sudut zona
    if (typeof aturRotasiDiorama === 'function') {
      aturRotasiDiorama(zona.rotY);
    }

    // Gerakkan kamera drone ke target zona dengan sudut elevasi sinematik yang lapang
    if (tweenKamera) tweenKamera.kill();

    const targetPos = new Vector3(zona.offsetPos.x, zona.offsetPos.y, zona.offsetPos.z);
    const targetLook = new Vector3(zona.offsetLookAt.x, zona.offsetLookAt.y, zona.offsetLookAt.z);

    tweenKamera = gsap.timeline();
    tweenKamera.to(cameraTargetPos, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 2.4,
      ease: 'power2.inOut'
    }, 0);

    tweenKamera.to(cameraTargetLookAt, {
      x: targetLook.x,
      y: targetLook.y,
      z: targetLook.z,
      duration: 2.4,
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

    tampilkanToast('Memulai Tur Drone Sinematik Nusantara... Dengarkan narasi audio 🎥🎙️✨');
    terbangKeZona(0);
  }

  function jedaAtauLanjutkan() {
    if (!sedangBerjalan) return;

    sedangDijeda = !sedangDijeda;
    if (sedangDijeda) {
      clearTimeout(timerZona);
      if (synth) synth.pause();
      if (ikonJeda) ikonJeda.textContent = '▶';
      if (teksJeda) teksJeda.textContent = 'Lanjut';
      tampilkanToast('Tur Sinematik dijeda.');
    } else {
      if (synth && synth.paused) {
        synth.resume();
      } else {
        bicarakanNarasiZona(DAFTAR_ZONA_TUR[indeksZona]);
      }
      if (ikonJeda) ikonJeda.textContent = '⏸';
      if (teksJeda) teksJeda.textContent = 'Jeda';
      timerZona = setTimeout(() => {
        terbangKeZona(indeksZona + 1);
      }, 4500);
      mulaiAnimasiProgresBar(4500);
      tampilkanToast('Melanjutkan tur sinematik...');
    }
  }

  function lompatZonaBerikutnya() {
    if (!sedangBerjalan) return;
    clearTimeout(timerZona);
    hentikanVoiceOver();
    terbangKeZona(indeksZona + 1);
  }

  function hentikanTur(pesanManual = false) {
    if (!sedangBerjalan) return;
    sedangBerjalan = false;
    sedangDijeda = false;

    hentikanVoiceOver();
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
    tampilkanToast('Perjalanan drone melintasi 6 wilayah kepulauan selesai! Selamat mengarungi khazanah Nusantara lebih dalam 🌴✨');
  }

  // Toggle Voice Over Narasi Suara
  if (btnVO) {
    btnVO.addEventListener('click', () => {
      voiceOverAktif = !voiceOverAktif;
      if (voiceOverAktif) {
        btnVO.classList.remove('bisu');
        if (ikonVO) ikonVO.textContent = '🔊';
        if (teksVO) teksVO.textContent = 'Narasi: ON';
        tampilkanToast('Voice Over suara narator diaktifkan 🎙️');
        bicarakanNarasiZona(DAFTAR_ZONA_TUR[indeksZona]);
      } else {
        btnVO.classList.add('bisu');
        if (ikonVO) ikonVO.textContent = '🔇';
        if (teksVO) teksVO.textContent = 'Narasi: OFF';
        hentikanVoiceOver();
        tampilkanToast('Voice Over suara narator dibisukan 🔇');
      }
    });
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
