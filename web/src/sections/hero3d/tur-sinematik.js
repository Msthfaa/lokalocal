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
    pulauNama: 'Pulau Sumatera',
    daftarKode: ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21'],
    provinsiKode: '13',
    provinsiNama: 'Sumatera Barat (119 Catatan)',
    judul: 'Sumatera: Gerbang Barat & Warisan Luhur',
    subjudul: 'Randai Minangkabau, Silek Harimau Lalok, & Kawasan Balai Kaliki',
    deskripsi: 'Gugusan peradaban barat dengan 119 catatan budaya di Sumatera Barat: seni teater tutur Randai, bela diri Silek Harimau Lalok Pariaman, dan kawasan adat Balai Kaliki.',
    narasiAudio: 'Selamat datang di Pulau Sumatera, Gerbang Barat Nusantara. Wilayah ini menyimpan seratus sembilan belas catatan kebudayaan di Sumatera Barat, termasuk seni teater tutur Randai Minangkabau, seni bela diri Silek Harimau Lalok, dan cagar budaya Balai Kaliki.',
    audioUrl: '/assets/audio/tur/tur-1-sumatera.mp3',
    durasiDetik: 20.5,
    offsetLookAt: { x: -3.80, y: 0.15, z: -0.45 },
    offsetPos: { x: -3.80, y: 2.8, z: 3.3 },
    rotY: 0.0
  },
  {
    nomor: 2,
    zonaId: 'jawa',
    pulauNama: 'Pulau Jawa',
    daftarKode: ['31', '32', '33', '34', '35', '36'],
    provinsiKode: '35',
    provinsiNama: 'Jawa Timur (70 Catatan)',
    judul: 'Jawa: Warisan Kesenian & Ragam Motif',
    subjudul: 'Bantengan Pasuruan, Wayang Kulit Gagrak, & Batik Garutan',
    deskripsi: 'Episentrum seni pertunjukan dan kerajinan tradisi: seni Bantengan Pasuruan, Wayang Kulit Gagrak Porongan, hingga ragam filosofi motif Batik Garutan & Cianjur.',
    narasiAudio: 'Kita melayang ke Pulau Jawa, episentrum kesenian dan ragam motif adiluhung. Mari saksikan keunikan seni Bantengan Pasuruan, pertunjukan Wayang Kulit Gagrak Porongan, hingga mahakarya Batik Garutan yang penuh filosofi.',
    audioUrl: '/assets/audio/tur/tur-2-jawa.mp3',
    durasiDetik: 18.5,
    offsetLookAt: { x: -1.80, y: 0.15, z: 1.15 },
    offsetPos: { x: -1.80, y: 2.3, z: 4.1 },
    rotY: 0.0
  },
  {
    nomor: 3,
    zonaId: 'bali-nusa',
    pulauNama: 'Kepulauan Bali & Nusa Tenggara',
    daftarKode: ['51', '52', '53'],
    provinsiKode: '51',
    provinsiNama: 'Bali (6 Catatan)',
    judul: 'Bali & Kepulauan Nusa: Dinamika Seni & Tradisi',
    subjudul: 'Ogoh-Ogoh, Okokan Tabanan, Gending Ratu Anom, & Knobe',
    deskripsi: 'Seni pertunjukan Ogoh-Ogoh, tradisi bunyi Okokan Tabanan, tembang Gending Ratu Anom di Bali, hingga alat musik tradisi Knobe dari Nusa Tenggara Timur.',
    narasiAudio: 'Kini kita singgah di Kepulauan Bali dan Nusa Tenggara, beranda dewata nan kaya tradisi. Dari kemegahan patung Ogoh-Ogoh, tradisi bunyi Okokan Tabanan, lantunan tembang Gending Ratu Anom, hingga keunikan alat musik Knobe di Nusa Tenggara Timur.',
    audioUrl: '/assets/audio/tur/tur-3-bali-nusa.mp3',
    durasiDetik: 21.0,
    offsetLookAt: { x: 0.45, y: 0.15, z: 1.65 },
    offsetPos: { x: 0.45, y: 2.3, z: 4.6 },
    rotY: 0.0
  },
  {
    nomor: 4,
    zonaId: 'kalimantan',
    pulauNama: 'Pulau Kalimantan (Borneo)',
    daftarKode: ['61', '62', '63', '64', '65'],
    provinsiKode: '61',
    provinsiNama: 'Kalimantan Barat (29 Catatan)',
    judul: 'Kalimantan: Kearifan Rumah Panjang & Ritus Bahari',
    subjudul: 'Rumah Panjang Nanga Siyai, Naq Hudoq, & Musik Keringut',
    deskripsi: 'Arsitektur Rumah Panjang Nanga Siyai, topeng ritus Naq Hudoq Dayak Bahau, instrumen musik petik Jatung Utang, serta alat musik tiup Keringut Dayak Punan.',
    narasiAudio: 'Terbang melintasi rimbunnya Pulau Kalimantan, jantung Borneo pusaka Dayak. Simak kemegahan Rumah Panjang Nanga Siyai, ritus sakral topeng Hudoq Dayak Bahau, petikan Jatung Utang, serta alat tiup Keringut Dayak Punan.',
    audioUrl: '/assets/audio/tur/tur-4-kalimantan.mp3',
    durasiDetik: 18.5,
    offsetLookAt: { x: -1.00, y: 0.15, z: -0.55 },
    offsetPos: { x: -1.00, y: 2.9, z: 2.9 },
    rotY: 0.0
  },
  {
    nomor: 5,
    zonaId: 'sulawesi',
    pulauNama: 'Pulau Sulawesi',
    daftarKode: ['71', '72', '73', '74', '75', '76'],
    provinsiKode: '73',
    provinsiNama: 'Sulawesi Selatan (33 Catatan)',
    judul: 'Sulawesi: Arsitektur Adat & Jejak Aksara',
    subjudul: 'Aksara Lontaraq, Rumah Kajang, & Pakaian Adat Bada',
    deskripsi: 'Dokumentasi aksara Lontaraq Bugis-Makassar, arsitektur bersahaja Balla To Kajang, istana Raja Kulawi, serta busana serat kayu Bada Sulawesi Tengah.',
    narasiAudio: 'Kita tiba di Pulau Sulawesi, benteng arsitektur adat dan jejak aksara kuno. Menghadirkan aksara Lontaraq Bugis Makassar, arsitektur bersahaja Balla To Kajang, istana Raja Kulawi, serta busana serat kayu Lembah Bada.',
    audioUrl: '/assets/audio/tur/tur-5-sulawesi.mp3',
    durasiDetik: 19.5,
    offsetLookAt: { x: 1.13, y: 0.15, z: -0.20 },
    offsetPos: { x: 1.13, y: 2.8, z: 3.2 },
    rotY: 0.0
  },
  {
    nomor: 6,
    zonaId: 'maluku-papua',
    pulauNama: 'Kepulauan Maluku & Tanah Papua',
    daftarKode: ['81', '82', '91', '92', '93', '94', '95', '96'],
    provinsiKode: '82',
    provinsiNama: 'Maluku Utara (9 Catatan)',
    judul: 'Maluku & Papua: Negeri Rempah & Bumi Cenderawasih',
    subjudul: 'Rumah Adat Sasadu, Tari Togal, & Limne Ketengban',
    deskripsi: 'Arsitektur musyawarah Sasadu Maluku Utara, kesyahduan Tari Togal, perkusi Kelambut Papua, hingga gerak tari adat Limne suku Ketengban Papua Pegunungan.',
    narasiAudio: 'Pemberhentian terakhir di Kepulauan Maluku dan Tanah Papua, bumi cenderawasih kaya rempah. Menampilkan balai musyawarah Sasadu Halmahera, tarian Togal, tabuhan perkusi Kelambut, hingga gerak tari adat Limne suku Ketengban di Papua Pegunungan.',
    audioUrl: '/assets/audio/tur/tur-6-maluku-papua.mp3',
    durasiDetik: 20.2,
    offsetLookAt: { x: 3.45, y: 0.15, z: 0.20 },
    offsetPos: { x: 3.45, y: 3.4, z: 4.3 },
    rotY: 0.0
  }
];

const DURASI_PER_ZONA_DETIK = 12.0;

/**
 * Membuat mesin pengontrol Tur Sinematik Autopilot 3D.
 */
export function buatPengontrolTurSinematik({
  camera,
  cameraBasePos,
  cameraTargetPos,
  cameraTargetLookAt,
  aturRotasiDiorama,
  sorotPulauZona,
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
  let suaraWanitaIndo = null;

  /**
   * Menemukan suara wanita berbahasa Indonesia dengan pelafalan & aksen asli Indonesia
   * Memprioritaskan Microsoft Gadis Natural (Edge/Windows) atau Google Bahasa Indonesia (Chrome)
   */
  function perbaruiPilihanSuaraWanitaIndo() {
    if (!synth) return null;
    const voices = synth.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Prioritas Utama: Microsoft Gadis Natural (Edge / Windows 11 — suara wanita Indonesia paling fasih & manusiawi)
    let v = voices.find(
      (x) =>
        x.lang.toLowerCase().startsWith('id') &&
        (x.name.toLowerCase().includes('gadis') ||
         (x.name.toLowerCase().includes('natural') && !x.name.toLowerCase().includes('ardi')))
    );
    if (v) {
      suaraWanitaIndo = v;
      return v;
    }

    // 2. Google Bahasa Indonesia di Chrome / Android
    v = voices.find(
      (x) =>
        x.lang.toLowerCase().startsWith('id') &&
        x.name.toLowerCase().includes('google')
    );
    if (v) {
      suaraWanitaIndo = v;
      return v;
    }

    // 3. Suara dengan tag Female / Perempuan / Wanita Indonesia lainnya
    v = voices.find(
      (x) =>
        x.lang.toLowerCase().startsWith('id') &&
        (x.name.toLowerCase().includes('female') ||
         x.name.toLowerCase().includes('wanita') ||
         x.name.toLowerCase().includes('perempuan') ||
         x.name.toLowerCase().includes('putri') ||
         x.name.toLowerCase().includes('siti'))
    );
    if (v) {
      suaraWanitaIndo = v;
      return v;
    }

    // 4. Suara bahasa Indonesia non-pria (menghindari Ardi / Male / Pria / David)
    v = voices.find(
      (x) =>
        x.lang.toLowerCase().startsWith('id') &&
        !x.name.toLowerCase().includes('ardi') &&
        !x.name.toLowerCase().includes('male') &&
        !x.name.toLowerCase().includes('pria')
    );
    if (v) {
      suaraWanitaIndo = v;
      return v;
    }

    // 5. Suara resmi bahasa Indonesia (id-ID)
    v = voices.find((x) => x.lang.toLowerCase().startsWith('id'));
    if (v) {
      suaraWanitaIndo = v;
      return v;
    }

    // 6. Kode bahasa lama 'in-ID'
    v = voices.find((x) => x.lang.toLowerCase().startsWith('in'));
    if (v) {
      suaraWanitaIndo = v;
      return v;
    }

    return null;
  }

  // Pasang pendengar voiceschanged agar suara terdeteksi seketika browser selesai memuat
  if (synth) {
    perbaruiPilihanSuaraWanitaIndo();
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', perbaruiPilihanSuaraWanitaIndo);
    } else {
      synth.onvoiceschanged = perbaruiPilihanSuaraWanitaIndo;
    }
  }

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

  // Pemutar Audio Studio Piper TTS (Format MP3 Jernih & Ringan) dengan Fallback Web Speech API
  let naratorAudioEl = null;
  if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
    try {
      naratorAudioEl = new Audio();
      naratorAudioEl.preload = 'auto';
    } catch (e) {
      console.warn('Audio narator init kendala:', e);
    }
  }

  function bicarakanNarasiZona(zona) {
    if (!voiceOverAktif) return;
    hentikanVoiceOver();

    // Prioritas 1: Putar audio MP3 narator wanita Piper TTS (Suara Studio Jernih & Alami)
    if (naratorAudioEl && zona.audioUrl) {
      try {
        naratorAudioEl.src = zona.audioUrl;
        naratorAudioEl.currentTime = 0;
        const playPromise = naratorAudioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio MP3 diblokir/gagal, beralih ke Web Speech:', err);
            putarWebSpeechFallback(zona);
          });
        }
        return;
      } catch (err) {
        console.warn('Kendala memutar naratorAudioEl:', err);
      }
    }

    // Prioritas 2 (Fallback): Web Speech API
    putarWebSpeechFallback(zona);
  }

  function putarWebSpeechFallback(zona) {
    if (!synth || !voiceOverAktif) return;
    try {
      synth.cancel();

      if (!suaraWanitaIndo) {
        perbaruiPilihanSuaraWanitaIndo();
      }

      const naskah = zona.narasiAudio || `${zona.judul}. ${zona.subjudul}. ${zona.deskripsi}`;
      const utterance = new SpeechSynthesisUtterance(naskah);
      utterance.lang = 'id-ID';

      if (suaraWanitaIndo) {
        utterance.voice = suaraWanitaIndo;
        // Pitch 1.04 memberikan timbre wanita hangat, ramah, dan artikulasi jelas
        utterance.pitch = 1.04;
        // Rate 0.94 memberikan tempo tutur mendongeng yang anggun dan santai
        utterance.rate = 0.94;
      } else {
        // Fallback jika suara belum siap
        utterance.pitch = 1.14;
        utterance.rate = 0.92;
      }

      synth.speak(utterance);
    } catch (err) {
      console.warn('Voice Over speech synthesis kendala:', err);
    }
  }

  function hentikanVoiceOver() {
    if (naratorAudioEl) {
      naratorAudioEl.pause();
      naratorAudioEl.currentTime = 0;
    }
    if (synth) {
      synth.cancel();
    }
  }

  function perbaruiUIOverlay(zona) {
    if (!overlayEl) return;
    overlayEl.hidden = false;
    overlayEl.classList.add('aktif');

    if (zonaLangkahEl) {
      zonaLangkahEl.textContent = `Wilayah ${zona.nomor} dari ${DAFTAR_ZONA_TUR.length}: ${zona.pulauNama}`;
    }
    if (provinsiBadgeEl) {
      provinsiBadgeEl.textContent = `🏝️ Fokus: ${zona.pulauNama} • ${zona.provinsiNama}`;
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

    // Sorot khusus pulau yang sedang dibahas (angkat pulau & beri rona emas berkilau, pulau lain teduh redup)
    if (typeof sorotPulauZona === 'function') {
      sorotPulauZona(zona);
    } else if (typeof pilihProvinsiMesh === 'function') {
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

    // Jadwalkan transisi ke zona berikutnya setelah durasi narasi audio selesai
    clearTimeout(timerZona);
    const durasiDetik = zona.durasiDetik || DURASI_PER_ZONA_DETIK;
    sisaWaktuMs = durasiDetik * 1000;
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

    tampilkanToast('Memulai Tur Drone Sinematik Nusantara... Dengarkan narasi pemandu budaya 🎥🎙️✨');
    terbangKeZona(0);
  }

  function jedaAtauLanjutkan() {
    if (!sedangBerjalan) return;

    sedangDijeda = !sedangDijeda;
    if (sedangDijeda) {
      clearTimeout(timerZona);
      if (naratorAudioEl) naratorAudioEl.pause();
      if (synth) synth.pause();
      if (ikonJeda) ikonJeda.textContent = '▶';
      if (teksJeda) teksJeda.textContent = 'Lanjut';
      tampilkanToast('Tur Sinematik dijeda.');
    } else {
      if (naratorAudioEl && naratorAudioEl.paused && naratorAudioEl.currentTime > 0) {
        naratorAudioEl.play().catch(() => {});
      } else if (synth && synth.paused) {
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
