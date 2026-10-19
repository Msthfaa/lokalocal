/**
 * transisi-gatotkaca.js — Orkestrator Animasi Transisi Gatotkaca Chibi Nusantara
 *
 * Menggerakkan Karakter Gatotkaca Chibi & Tirai Awan Empuk (Fluffy Cumulus):
 * 1. [Stage 1 - Lepas Landas di Beranda]:
 *    - Gatotkaca muncul heroik di tengah layar dengan aura emas dan percikan petir Brajamusti.
 *    - Melompat dan terbang melesat ke atas angkasa.
 *    - Tirai awan empuk (bank atas & bank bawah) menyapu secara organik menutup layar 100% tanpa celah.
 *    - Berpindah ke jelajah.html?mendarat=1 secara mulus tanpa kedip putih.
 * 2. [Stage 2 - Sambutan & Panduan di Peta 3D Jelajah]:
 *    - Tirai awan tersibak halus ke atas & bawah menampakkan peta 3D Nusantara.
 *    - Gatotkaca melayang anggun di atas kepulauan Nusantara tanpa pernah tertutup kartu dialog.
 *    - Membuka balon sambutan tepat di bawah Gatotkaca dengan tombol "Oke, Ayo Jelajah! 🚀".
 *    - Saat tombol "Oke" diklik, Gatotkaca melesat terbang keluar layar ke angkasa luar.
 */

import gsap from 'gsap';
import '../styles/transisi-gatotkaca.css';

let overlayEl = null;
let langitAuraEl = null;
let langitMistEl = null;
let bankAtasEl = null;
let bankBawahEl = null;
let awanApungWadahEl = null;
let panggungWadahEl = null;
let aktorPosisiEl = null;
let bobbingWadahEl = null;
let auraGlowEl = null;
let sparksWadahEl = null;
let dialogWadahEl = null;
let btnOkeEl = null;
let toastTerbangEl = null;
let timelineAktif = null;
let resolveTungguOke = null;
let janjiGatotkacaSiap = null;

/**
 * Menghasilkan HTML string untuk overlay transisi Gatotkaca
 * Digunakan baik secara dinamis di JS maupun statis di jelajah.html
 */
export function ambilHtmlOverlayGatotkaca() {
  return `
    <!-- 1. Latar Kilau Langit & Mist Lembut -->
    <div class="gatotkaca-langit-aura" id="gatotkaca-langit-aura"></div>
    <div class="gatotkaca-langit-mist" id="gatotkaca-langit-mist"></div>

    <!-- 2. Bank Awan Atas (Tirai Atas) -->
    <div class="gatotkaca-tirai-bank-atas" id="gatotkaca-bank-atas">
      <div class="gatotkaca-awan-solid-atas"></div>
      <svg class="gatotkaca-awan-crest gatotkaca-awan-crest--atas" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="gBackAtas" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#E2E8F0" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#CBD5E1" stop-opacity="1"/>
          </linearGradient>
          <linearGradient id="gMidAtas" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#F1F5F9" stop-opacity="0.98"/>
            <stop offset="100%" stop-color="#E2E8F0" stop-opacity="1"/>
          </linearGradient>
          <linearGradient id="gFrontAtas" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
            <stop offset="100%" stop-color="#F8FAFC" stop-opacity="1"/>
          </linearGradient>
        </defs>
        <!-- Lapis 1 Belakang Bulat-Bulat -->
        <path d="M -20,0 L -20,60 A 70,70 0 0,0 110,60 A 90,90 0 0,0 270,70 A 75,75 0 0,0 400,60 A 100,100 0 0,0 580,75 A 85,85 0 0,0 730,65 A 105,105 0 0,0 920,80 A 80,80 0 0,0 1060,65 A 95,95 0 0,0 1230,75 A 75,75 0 0,0 1360,60 A 85,85 0 0,0 1460,60 L 1460,0 Z" fill="url(#gBackAtas)" opacity="0.65"/>
        <!-- Lapis 2 Tengah Bulat-Bulat -->
        <path d="M -20,0 L -20,50 A 80,80 0 0,0 130,55 A 70,70 0 0,0 260,50 A 90,90 0 0,0 410,65 A 85,85 0 0,0 570,55 A 100,100 0 0,0 750,70 A 80,80 0 0,0 900,60 A 95,95 0 0,0 1080,68 A 75,75 0 0,0 1220,52 A 85,85 0 0,0 1370,58 A 75,75 0 0,0 1460,50 L 1460,0 Z" fill="url(#gMidAtas)" opacity="0.85"/>
        <!-- Lapis 3 Depan Bulat-Bulat Super Fluffy -->
        <path d="M -20,0 L -20,40 A 85,85 0 0,0 140,50 A 65,65 0 0,0 250,45 A 95,95 0 0,0 420,60 A 80,80 0 0,0 560,50 A 110,110 0 0,0 760,70 A 85,85 0 0,0 910,55 A 100,100 0 0,0 1090,65 A 70,70 0 0,0 1210,45 A 90,90 0 0,0 1370,55 A 70,70 0 0,0 1460,40 L 1460,0 Z" fill="url(#gFrontAtas)"/>
      </svg>
    </div>

    <!-- 3. Bank Awan Bawah (Tirai Bawah) -->
    <div class="gatotkaca-tirai-bank-bawah" id="gatotkaca-bank-bawah">
      <svg class="gatotkaca-awan-crest gatotkaca-awan-crest--bawah" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="gBackBawah" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#E2E8F0" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#CBD5E1" stop-opacity="1"/>
          </linearGradient>
          <linearGradient id="gMidBawah" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F1F5F9" stop-opacity="0.98"/>
            <stop offset="100%" stop-color="#E2E8F0" stop-opacity="1"/>
          </linearGradient>
          <linearGradient id="gFrontBawah" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
            <stop offset="100%" stop-color="#F8FAFC" stop-opacity="1"/>
          </linearGradient>
        </defs>
        <!-- Lapis 1 Belakang Bulat-Bulat -->
        <path d="M -20,200 L -20,140 A 70,70 0 0,1 110,140 A 90,90 0 0,1 270,130 A 75,75 0 0,1 400,140 A 100,100 0 0,1 580,125 A 85,85 0 0,1 730,135 A 105,105 0 0,1 920,120 A 80,80 0 0,1 1060,135 A 95,95 0 0,1 1230,125 A 75,75 0 0,1 1360,140 A 85,85 0 0,1 1460,140 L 1460,200 Z" fill="url(#gBackBawah)" opacity="0.65"/>
        <!-- Lapis 2 Tengah Bulat-Bulat -->
        <path d="M -20,200 L -20,150 A 80,80 0 0,1 130,145 A 70,70 0 0,1 260,150 A 90,90 0 0,1 410,135 A 85,85 0 0,1 570,145 A 100,100 0 0,1 750,130 A 80,80 0 0,1 900,140 A 95,95 0 0,1 1080,132 A 75,75 0 0,1 1220,148 A 85,85 0 0,1 1370,142 A 75,75 0 0,1 1460,150 L 1460,200 Z" fill="url(#gMidBawah)" opacity="0.85"/>
        <!-- Lapis 3 Depan Bulat-Bulat Super Fluffy -->
        <path d="M -20,200 L -20,160 A 85,85 0 0,1 140,150 A 65,65 0 0,1 250,155 A 95,95 0 0,1 420,140 A 80,80 0 0,1 560,150 A 110,110 0 0,1 760,130 A 85,85 0 0,1 910,145 A 100,100 0 0,1 1090,135 A 70,70 0 0,1 1210,155 A 90,90 0 0,1 1370,145 A 70,70 0 0,1 1460,160 L 1460,200 Z" fill="url(#gFrontBawah)"/>
      </svg>
      <div class="gatotkaca-awan-solid-bawah"></div>
    </div>

    <!-- 4. Awan-Awan Apung Chibi Melayang -->
    <div class="gatotkaca-awan-apung-wadah" id="gatotkaca-awan-apung-wadah">
      <div class="gatotkaca-awan-apung gatotkaca-awan-apung-1">
        <svg viewBox="0 0 120 70" width="120" height="70" fill="none">
          <path d="M 25 55 L 95 55 A 16 16 0 0 0 95 23 A 20 20 0 0 0 55 12 A 18 18 0 0 0 25 30 A 15 15 0 0 0 25 55 Z" fill="#FFFFFF"/>
        </svg>
      </div>
      <div class="gatotkaca-awan-apung gatotkaca-awan-apung-2">
        <svg viewBox="0 0 140 80" width="140" height="80" fill="none">
          <path d="M 28 65 L 112 65 A 18 18 0 0 0 112 28 A 22 22 0 0 0 65 15 A 20 20 0 0 0 28 35 A 17 17 0 0 0 28 65 Z" fill="#FFFFFF"/>
        </svg>
      </div>
      <div class="gatotkaca-awan-apung gatotkaca-awan-apung-3">
        <svg viewBox="0 0 110 65" width="110" height="65" fill="none">
          <path d="M 22 52 L 88 52 A 15 15 0 0 0 88 22 A 18 18 0 0 0 50 12 A 16 16 0 0 0 22 28 A 14 14 0 0 0 22 52 Z" fill="#FFFFFF"/>
        </svg>
      </div>
    </div>

    <!-- 5. Toast Teks Slogan Terbang -->
    <div class="gatotkaca-toast-terbang" id="gatotkaca-toast-terbang">
      <span aria-hidden="true">⚡</span>
      <span>Otot Kawat Tulang Besi, Melesat ke Nusantara!</span>
    </div>

    <!-- 6. Panggung Utama Sambutan: Gatotkaca di Atas + Balon Dialog di Bawah -->
    <div class="gatotkaca-panggung-wadah" id="gatotkaca-panggung-wadah">
      <!-- Kontainer Posisi Gatotkaca -->
      <div class="gatotkaca-aktor-posisi" id="gatotkaca-aktor-posisi">
        <div class="gatotkaca-bobbing-wadah" id="gatotkaca-bobbing-wadah">
          <div class="gatotkaca-aura-glow" id="gatotkaca-aura-glow"></div>
          <img
            src="/assets/gatotkaca-transparan.png"
            alt="Gatotkaca Chibi Sang Ksatria Budaya Nusantara"
            class="gatotkaca-gambar"
            id="gatotkaca-gambar"
            loading="eager"
          />
          <div class="gatotkaca-bayangan-bawah" id="gatotkaca-bayangan"></div>

          <!-- Sparks Bintang Emas & Petir -->
          <div class="gatotkaca-sparks-wadah" id="gatotkaca-sparks">
            <span class="gatotkaca-spark" style="top: -12px; left: 16px;">✨</span>
            <span class="gatotkaca-spark" style="top: -18px; right: 24px;">⚡</span>
            <span class="gatotkaca-spark" style="bottom: 30px; left: -12px;">⭐</span>
            <span class="gatotkaca-spark" style="bottom: 24px; right: -8px;">✨</span>
            <span class="gatotkaca-spark" style="top: 45%; left: -24px;">⚡</span>
            <span class="gatotkaca-spark" style="top: 38%; right: -22px;">🌟</span>
          </div>
        </div>
      </div>

      <!-- Balon Dialog Sambutan & Panduan Singkat (Tepat di Bawah Gatotkaca) -->
      <div class="gatotkaca-dialog-wadah" id="gatotkaca-dialog-wadah">
        <div class="gatotkaca-dialog-kartu">
          <div class="gatotkaca-dialog-panah" aria-hidden="true"></div>
          <div class="gatotkaca-lencana">
            <span class="gatotkaca-lencana-titik" aria-hidden="true"></span>
            <span>Ksatria Budaya Nusantara</span>
          </div>
          <h3 class="gatotkaca-dialog-judul">Selamat Datang di Peta 3D Nusantara!</h3>
          <p class="gatotkaca-dialog-teks">
            Jelajahi relief kepulauan Indonesia secara 360°! Putar sudut pandang, klik provinsi untuk menancapkan panji budaya, dan kumpulkan stempel di paspormu.
          </p>
          <button type="button" id="gatotkaca-btn-oke" class="gatotkaca-btn-oke" aria-label="Mulai jelajahi peta 3D">
            <span>Oke, Ayo Jelajah!</span>
            <span class="gatotkaca-btn-panah" aria-hidden="true">🚀</span>
          </button>
          <div class="gatotkaca-dialog-hint">Tekan tombol atau Enter untuk mulai</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Memastikan elemen DOM untuk transisi Gatotkaca sudah terpasang di body
 */
function pastikanDomSiap() {
  const adaDiDom = document.getElementById('transisi-gatotkaca-overlay');

  if (adaDiDom) {
    overlayEl = adaDiDom;
  } else {
    overlayEl = document.createElement('div');
    overlayEl.id = 'transisi-gatotkaca-overlay';
    overlayEl.className = 'transisi-gatotkaca-overlay';
    overlayEl.setAttribute('role', 'status');
    overlayEl.setAttribute('aria-live', 'polite');
    overlayEl.setAttribute('aria-label', 'Transisi penerbangan Gatotkaca menuju Peta 3D Nusantara');
    overlayEl.innerHTML = ambilHtmlOverlayGatotkaca();
    document.body.appendChild(overlayEl);
  }

  langitAuraEl = overlayEl.querySelector('#gatotkaca-langit-aura');
  langitMistEl = overlayEl.querySelector('#gatotkaca-langit-mist');
  bankAtasEl = overlayEl.querySelector('#gatotkaca-bank-atas');
  bankBawahEl = overlayEl.querySelector('#gatotkaca-bank-bawah');
  awanApungWadahEl = overlayEl.querySelector('#gatotkaca-awan-apung-wadah');
  panggungWadahEl = overlayEl.querySelector('#gatotkaca-panggung-wadah');
  aktorPosisiEl = overlayEl.querySelector('#gatotkaca-aktor-posisi');
  bobbingWadahEl = overlayEl.querySelector('#gatotkaca-bobbing-wadah');
  auraGlowEl = overlayEl.querySelector('#gatotkaca-aura-glow');
  sparksWadahEl = overlayEl.querySelector('#gatotkaca-sparks');
  dialogWadahEl = overlayEl.querySelector('#gatotkaca-dialog-wadah');
  btnOkeEl = overlayEl.querySelector('#gatotkaca-btn-oke');
  toastTerbangEl = overlayEl.querySelector('#gatotkaca-toast-terbang');

  // Pasang listener tombol Oke
  if (btnOkeEl && !btnOkeEl.dataset.listenerTerpasang) {
    btnOkeEl.dataset.listenerTerpasang = 'true';
    btnOkeEl.addEventListener('click', () => {
      if (typeof resolveTungguOke === 'function') {
        resolveTungguOke();
        resolveTungguOke = null;
      }
    });
  }

  // Dukungan tombol Enter dan Escape
  if (!window._gatotkacaKeydownTerpasang) {
    window._gatotkacaKeydownTerpasang = true;
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') && overlayEl && overlayEl.classList.contains('is-aktif')) {
        if (dialogWadahEl && dialogWadahEl.classList.contains('is-tampil')) {
          e.preventDefault();
          if (typeof resolveTungguOke === 'function') {
            resolveTungguOke();
            resolveTungguOke = null;
          }
        }
      }
    });
  }
}

/**
 * Memicu letupan partikel bintang emas & petir di sekitar Gatotkaca
 */
function picuPartikelPetir() {
  if (!sparksWadahEl) return;
  const sparks = sparksWadahEl.querySelectorAll('.gatotkaca-spark');
  sparks.forEach((sp, idx) => {
    gsap.fromTo(
      sp,
      { scale: 0.2, opacity: 0, x: 0, y: 0 },
      {
        scale: Math.random() * 0.7 + 1.15,
        opacity: 1,
        x: (Math.random() - 0.5) * 64,
        y: (Math.random() - 0.5) * 54,
        duration: 0.45,
        delay: idx * 0.04,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out'
      }
    );
  });
}

/**
 * TAHAP 1: LEPAS LANDAS DI HALAMAN ASAL (index.html, paspor.html, kuis.html)
 * Karakter Gatotkaca muncul heroik di tengah layar, lalu melesat terbang ke atas
 * diiringi sapuan tirai awan empuk (bank atas & bank bawah) yang menutup layar 100% mulus.
 *
 * @param {object} parameter
 * @param {() => void} parameter.onTerbangTinggi - Dipanggil saat awan sudah menutup layar penuh untuk pindah URL
 */
export function terbangkanGatotkacaLepasLandas({ onTerbangTinggi }) {
  pastikanDomSiap();

  const kurangiGerak =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (kurangiGerak) {
    if (typeof onTerbangTinggi === 'function') onTerbangTinggi();
    return;
  }

  if (timelineAktif) {
    timelineAktif.kill();
    timelineAktif = null;
  }

  overlayEl.classList.add('is-aktif');
  if (dialogWadahEl) dialogWadahEl.classList.remove('is-tampil');

  const awanApungList = awanApungWadahEl ? awanApungWadahEl.querySelectorAll('.gatotkaca-awan-apung') : [];

  // Reset posisi awal secara presisi
  gsap.set(langitAuraEl, { opacity: 0 });
  gsap.set(langitMistEl, { opacity: 0 });
  gsap.set(toastTerbangEl, { opacity: 0, y: 15 });
  gsap.set(bankAtasEl, { y: '-105%' });
  gsap.set(bankBawahEl, { y: '105%' });
  gsap.set(awanApungList, { opacity: 0, scale: 0.85 });

  if (bobbingWadahEl) {
    bobbingWadahEl.classList.remove('gatotkaca-efek-melayang');
  }

  gsap.set(aktorPosisiEl, {
    x: 0,
    y: 0,
    scale: 0,
    rotation: -14,
    opacity: 0
  });

  // Watchdog timeout pengaman agar navigasi tetap terjadi bila ada kendala
  const safetyTimeout = setTimeout(() => {
    if (typeof onTerbangTinggi === 'function') onTerbangTinggi();
  }, 2600);

  timelineAktif = gsap.timeline({
    onComplete: () => {
      clearTimeout(safetyTimeout);
    }
  });

  // [0.0s -> 0.45s]: Gatotkaca muncul gagah membal di tengah layar
  timelineAktif.to(
    aktorPosisiEl,
    {
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: 0.45,
      ease: 'back.out(2.0)',
      onStart: () => {
        picuPartikelPetir();
      }
    },
    0
  );

  // [0.05s -> 0.45s]: Langit aura menyala lembut
  timelineAktif.to(
    langitAuraEl,
    {
      opacity: 1,
      duration: 0.4
    },
    0.05
  );

  // [0.15s -> 0.50s]: Toast slogan muncul di bawah Gatotkaca
  timelineAktif.to(
    toastTerbangEl,
    {
      opacity: 1,
      y: 0,
      duration: 0.35,
      ease: 'power2.out'
    },
    0.15
  );

  // [0.55s -> 0.72s]: Gatotkaca sedikit menunduk ancang-ancang
  timelineAktif.to(
    aktorPosisiEl,
    {
      y: 24,
      scale: 0.94,
      duration: 0.17,
      ease: 'power1.inOut'
    },
    0.55
  );

  // [0.72s -> 1.25s]: Gatotkaca melesat terbang ke atas angkasa!
  timelineAktif.to(
    aktorPosisiEl,
    {
      y: -window.innerHeight * 0.95,
      scale: 0.7,
      rotation: 6,
      duration: 0.53,
      ease: 'power3.in',
      onStart: () => {
        picuPartikelPetir();
      }
    },
    0.72
  );

  // [0.65s -> 1.25s]: Tirai awan empuk menyapu naik & turun menutup layar 100% tanpa celah
  timelineAktif.to(
    bankBawahEl,
    {
      y: '0%',
      duration: 0.60,
      ease: 'power2.inOut'
    },
    0.65
  );

  timelineAktif.to(
    bankAtasEl,
    {
      y: '0%',
      duration: 0.60,
      ease: 'power2.inOut'
    },
    0.65
  );

  timelineAktif.to(
    langitMistEl,
    {
      opacity: 1,
      duration: 0.55,
      ease: 'power1.inOut'
    },
    0.70
  );

  timelineAktif.to(
    awanApungList,
    {
      opacity: 1,
      scale: 1,
      duration: 0.45,
      stagger: 0.05,
      ease: 'power2.out'
    },
    0.75
  );

  // Saat awan SUDAH SEPENUHNYA menutupi layar (t = 1.28s): Panggil callback navigasi!
  timelineAktif.add(() => {
    clearTimeout(safetyTimeout);
    if (typeof onTerbangTinggi === 'function') {
      onTerbangTinggi();
    }
  }, 1.28);
}

/**
 * Menyiapkan Gatotkaca saat halaman jelajah.html pertama kali terbuka (via mendarat=1)
 * Tirai awan perlahan tersibak keluar layar dan menampakkan Gatotkaca melayang anggun di atas peta 3D.
 */
export function siapkanGatotkacaMendarat() {
  pastikanDomSiap();

  const awanApungList = awanApungWadahEl ? awanApungWadahEl.querySelectorAll('.gatotkaca-awan-apung') : [];

  // 1. Kunci posisi awal tirai awan & Gatotkaca secara instan dengan GSAP sebelum melepas class CSS
  gsap.set(bankAtasEl, { y: '0%' });
  gsap.set(bankBawahEl, { y: '0%' });
  gsap.set(langitMistEl, { opacity: 1 });
  gsap.set(langitAuraEl, { opacity: 0.75 });
  gsap.set(awanApungList, { opacity: 1, scale: 1 });

  // Siapkan Gatotkaca di atas agar meluncur turun secara anggun tanpa pernah berkedip
  gsap.set(aktorPosisiEl, {
    x: 0,
    y: -90,
    scale: 0.85,
    rotation: 0,
    opacity: 0
  });

  // 2. Aktifkan overlay dan lepaskan class statis tanpa ada 1 frame pun yang bocor
  overlayEl.classList.add('is-aktif');
  document.documentElement.classList.remove('sedang-mendarat-gatotkaca');

  // Sembunyikan dialog dahulu sampai Gatotkaca selesai mendarat
  if (dialogWadahEl) {
    dialogWadahEl.classList.remove('is-tampil');
    gsap.set(dialogWadahEl, { opacity: 0, y: 25, scale: 0.92 });
  }

  // Tirai awan empuk tersibak halus ke atas & bawah menyingkap relief 3D Nusantara
  gsap.to(bankAtasEl, {
    y: '-105%',
    duration: 0.95,
    ease: 'power2.inOut',
    delay: 0.1
  });

  gsap.to(bankBawahEl, {
    y: '105%',
    duration: 0.95,
    ease: 'power2.inOut',
    delay: 0.1
  });

  // Mist dan aura langit meredup anggun
  gsap.to(langitMistEl, {
    opacity: 0,
    duration: 0.8,
    delay: 0.15
  });

  gsap.to(langitAuraEl, {
    opacity: 0.25,
    duration: 0.85,
    delay: 0.15
  });

  // Awan apung bergeser lembut ke tepi layar
  gsap.to(awanApungList, {
    x: (i) => (i % 2 === 0 ? -120 : 120),
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    delay: 0.1
  });

  // Gatotkaca meluncur turun dengan anggun ke posisinya di atas kepulauan
  janjiGatotkacaSiap = new Promise((resolve) => {
    gsap.to(aktorPosisiEl, {
      y: 0,
      scale: 1,
      opacity: 1,
      duration: 0.85,
      ease: 'back.out(1.5)',
      delay: 0.2,
      onComplete: () => {
        if (bobbingWadahEl) {
          bobbingWadahEl.classList.add('gatotkaca-efek-melayang');
        }
        picuPartikelPetir();
        resolve();
      }
    });
  });

  return janjiGatotkacaSiap;
}

/**
 * TAHAP 2: SAMBUTAN DI JELAJAH 3D (Greeting & Panduan Interaktif)
 * Gatotkaca melayang di bagian atas layar diiringi balon dialog sambutan tepat di bawahnya.
 * Menunggu pengguna mengklik "Oke, Ayo Jelajah!" lalu terbang keluar layar ke angkasa luar.
 *
 * @param {object} parameter
 * @param {() => void} [parameter.onTouchdown] - Dipanggil saat dialog ditutup dan peta siap
 * @param {() => void} [parameter.onSelesai] - Dipanggil setelah Gatotkaca tuntas melesat keluar layar
 */
export async function sambutGatotkacaDiJelajah({ onTouchdown, onSelesai } = {}) {
  pastikanDomSiap();

  const kurangiGerak =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (kurangiGerak) {
    if (overlayEl) overlayEl.classList.remove('is-aktif');
    if (typeof onTouchdown === 'function') onTouchdown();
    if (typeof onSelesai === 'function') onSelesai();
    return;
  }

  // Tunggu sampai Gatotkaca selesai meluncur turun ke posisinya
  if (janjiGatotkacaSiap) {
    try {
      await janjiGatotkacaSiap;
    } catch {}
  }

  // Tampilkan balon dialog sambutan tepat di bawah Gatotkaca
  if (dialogWadahEl) {
    dialogWadahEl.classList.add('is-tampil');
    gsap.fromTo(
      dialogWadahEl,
      { opacity: 0, y: 20, scale: 0.92 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.45,
        ease: 'back.out(1.7)',
        delay: 0.15,
        onComplete: () => {
          if (btnOkeEl) {
            try {
              btnOkeEl.focus();
            } catch {}
          }
        }
      }
    );
  }

  // Janji interaktif: tunggu sampai pengguna menekan tombol "Oke"
  new Promise((resolve) => {
    resolveTungguOke = resolve;

    // Watchdog fallback jika pengguna tidak mengklik tombol dalam 40 detik
    setTimeout(() => {
      if (resolveTungguOke === resolve) {
        resolveTungguOke();
        resolveTungguOke = null;
      }
    }, 40000);
  }).then(() => {
    // Pengguna menekan Oke: Melesatkan Gatotkaca keluar layar ke angkasa!
    terbangkanGatotkacaKeluar({ onTouchdown, onSelesai });
  });
}

/**
 * Menerbangkan Gatotkaca keluar layar ke atas angkasa setelah tombol "Oke" ditekan
 */
function terbangkanGatotkacaKeluar({ onTouchdown, onSelesai }) {
  if (dialogWadahEl) {
    gsap.to(dialogWadahEl, {
      opacity: 0,
      y: 15,
      scale: 0.88,
      duration: 0.20,
      ease: 'power1.in',
      onComplete: () => {
        dialogWadahEl.classList.remove('is-tampil');
      }
    });
  }

  if (bobbingWadahEl) {
    bobbingWadahEl.classList.remove('gatotkaca-efek-melayang');
  }

  // Efek kilatan emas dan petir pamit
  picuPartikelPetir();
  if (auraGlowEl) {
    gsap.to(auraGlowEl, {
      scale: 1.6,
      opacity: 1,
      duration: 0.2
    });
  }

  // Gatotkaca melesat terbang keluar layar ke atas dengan kecepatan tinggi
  gsap.to(aktorPosisiEl, {
    y: -window.innerHeight - 300,
    scale: 0.55,
    rotation: -8,
    duration: 0.65,
    ease: 'power3.in',
    onComplete: () => {
      // Hilangkan overlay
      if (overlayEl) overlayEl.classList.remove('is-aktif');

      // Picu animasi masuk pulau diorama 3D
      if (typeof onTouchdown === 'function') {
        onTouchdown();
      }
      if (typeof onSelesai === 'function') {
        onSelesai();
      }
    }
  });

  // Redupkan aura langit
  if (langitAuraEl) {
    gsap.to(langitAuraEl, {
      opacity: 0,
      duration: 0.45
    });
  }
}

/* ==========================================================================
   Fungsi Kompatibilitas Mundur (Alias untuk Pemanggil Lama)
   ========================================================================== */
export const terbangkanPesawatLepasLandas = terbangkanGatotkacaLepasLandas;
export const siapkanPesawatMendarat = siapkanGatotkacaMendarat;
export const sambutPesawatDiJelajah = sambutGatotkacaDiJelajah;
