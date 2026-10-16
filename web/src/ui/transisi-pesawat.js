/**
 * transisi-pesawat.js — Orkestrator Animasi Pesawat Kartun Budaya Nusantara
 *
 * Menggerakkan Maskot Budaya "Si Kembara" yang menaiki Pesawat Capung Klasik Nusantara:
 * 1. Lepas landas (Stage 1) dari bagian bawah layar saat pengguna membuka menu Jelajah dari halaman lain.
 * 2. Mengarungi angkasa melintasi layar dengan kepulan awan chibi dan jejak debu emas.
 * 3. Halaman berpindah ke Peta 3D Jelajah secara buttery-smooth tanpa lag.
 * 4. Pendaratan (Stage 2): Pesawat menukik anggun dan melakukan pendaratan (touchdown) di pulau Nusantara 3D.
 * 5. Letupan partikel emas menyambut penjelajah dan kontrol peta 3D dibuka penuh.
 */

import gsap from 'gsap';
import '../styles/transisi-pesawat.css';

let overlayEl = null;
let pesawatAktorEl = null;
let jejakAsapWadahEl = null;
let touchdownWadahEl = null;
let teksMendaratEl = null;
let kilauLayarEl = null;
let timelineAktif = null;

/**
 * Memastikan elemen DOM untuk transisi pesawat sudah terpasang di body
 */
function pastikanDomSiap() {
  if (overlayEl && document.body.contains(overlayEl)) return;

  overlayEl = document.createElement('div');
  overlayEl.id = 'transisi-pesawat-overlay';
  overlayEl.className = 'transisi-pesawat-overlay';
  overlayEl.setAttribute('role', 'status');
  overlayEl.setAttribute('aria-live', 'polite');
  overlayEl.setAttribute('aria-label', 'Transisi penerbangan menuju Peta 3D Nusantara');

  overlayEl.innerHTML = `
    <!-- Kilatan Aura Langit Nusantara -->
    <div class="pesawat-kilau-layar" id="pesawat-kilau-layar"></div>

    <!-- Wadah Jejak Asap Knalpot Chibi -->
    <div class="pesawat-jejak-asap-wadah" id="pesawat-jejak-asap"></div>

    <!-- Partikel Letupan Touchdown saat Mendarat di Pulau -->
    <div class="pesawat-touchdown-wadah" id="pesawat-touchdown-wadah">
      <span class="pesawat-touchdown-spark" style="transform: translate(-36px, -36px) scale(1.3);">✨</span>
      <span class="pesawat-touchdown-spark" style="transform: translate(32px, -30px) scale(1.1);">✦</span>
      <span class="pesawat-touchdown-spark" style="transform: translate(-28px, 28px) scale(1.2);">⭐</span>
      <span class="pesawat-touchdown-spark" style="transform: translate(36px, 24px) scale(1.4);">✨</span>
      <span class="pesawat-touchdown-spark" style="transform: translate(0, -42px) scale(1.5);">🌟</span>
    </div>

    <!-- Aktor Pesawat Kartun Budaya (SVG Murni Ringan & Tajam 60 FPS) -->
    <div class="pesawat-wadah-aktor" id="pesawat-wadah-aktor">
      <svg
        viewBox="0 0 220 160"
        width="220"
        height="160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="pesawat-svg-elemen"
      >
        <!-- Bayangan Sayap Bawah -->
        <ellipse cx="100" cy="132" rx="42" ry="7" fill="#000" opacity="0.18" />

        <!-- Roda Pendaratan Depan & Belakang -->
        <g id="pesawat-roda">
          <line x1="126" y1="102" x2="132" y2="124" stroke="#443224" stroke-width="3" stroke-linecap="round" />
          <line x1="142" y1="104" x2="134" y2="124" stroke="#443224" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="133" cy="125" r="9" fill="#241B15" />
          <circle cx="133" cy="125" r="4.5" fill="#E5D6BD" stroke="#443224" stroke-width="1.5" />

          <line x1="56" y1="96" x2="52" y2="114" stroke="#443224" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="52" cy="115" r="5" fill="#241B15" />
        </g>

        <!-- Knalpot Samping dengan Aksen Logam Antik -->
        <g id="pesawat-knalpot">
          <path d="M110 92 L96 97 L88 95" stroke="#785338" stroke-width="4" stroke-linecap="round" />
          <ellipse cx="86" cy="95" rx="3.5" ry="4.5" fill="#241B15" />
        </g>

        <!-- Sayap Bawah Kayu Klasik Nusantara -->
        <path
          d="M74 100 C92 98 142 98 160 101 C163 103 162 107 158 109 C140 112 90 112 72 109 C69 107 70 102 74 100 Z"
          fill="#C86A3D"
          stroke="#8A3F1B"
          stroke-width="2.5"
        />

        <!-- Badan Pesawat Utama (Fuselage Gading & Terakota) -->
        <path
          d="M48 90 C32 86 28 78 30 72 C33 65 52 64 80 62 C124 59 178 63 192 78 C198 84 195 91 184 96 C162 103 108 102 68 96 C56 94 50 92 48 90 Z"
          fill="#FAF6EE"
          stroke="#5C3B1E"
          stroke-width="3"
        />
        <!-- Pola Aksen Strip Merah Emas di Lambung -->
        <path
          d="M52 86 C80 83 138 82 188 88 C176 96 122 99 64 94 Z"
          fill="#D32F2F"
          opacity="0.88"
        />
        <path
          d="M62 88 C94 85 142 85 180 89"
          stroke="#FFD15C"
          stroke-width="2.5"
          stroke-linecap="round"
        />

        <!-- KOKPIT & MASKOT KARTUN BUDAYA "SI KEMBARA" -->
        <g id="pesawat-kokpit-maskot">
          <!-- Kaca Depan Kokpit (Windshield Bening) -->
          <path
            d="M136 62 C142 50 152 46 160 48 C164 52 165 58 164 63 Z"
            fill="rgba(199, 241, 255, 0.65)"
            stroke="#5C3B1E"
            stroke-width="2"
          />

          <!-- Badan Baju Batik Maskot -->
          <path d="M112 62 C114 53 124 49 136 51 C144 54 146 62 142 66 Z" fill="#C86A3D" stroke="#5C3B1E" stroke-width="2" />
          <path d="M120 54 L128 64" stroke="#FFD15C" stroke-width="1.5" />

          <!-- Kepala Kartun Chibi -->
          <circle cx="128" cy="40" r="14" fill="#FFE2C6" stroke="#5C3B1E" stroke-width="2.2" />

          <!-- Pipi Merona Merah Muda (Blush) -->
          <ellipse cx="118" cy="43" rx="3" ry="2" fill="#FF8A8A" opacity="0.85" />
          <ellipse cx="138" cy="43" rx="3" ry="2" fill="#FF8A8A" opacity="0.85" />

          <!-- Mata Kartun Chibi Berkedip -->
          <g class="pesawat-mata-chibi">
            <circle cx="122" cy="38" r="2.8" fill="#241B15" />
            <circle cx="121" cy="36.8" r="1" fill="#FFFFFF" />
            <circle cx="134" cy="38" r="2.8" fill="#241B15" />
            <circle cx="133" cy="36.8" r="1" fill="#FFFFFF" />
          </g>

          <!-- Senyum Manis Gembira -->
          <path d="M125 43 C127 46 130 46 132 43" stroke="#241B15" stroke-width="1.8" stroke-linecap="round" fill="none" />

          <!-- Blangkon / Udeng Batik Khas Nusantara dengan Kacamata Penerbang Retro -->
          <path
            d="M113 36 C115 25 125 22 136 24 C144 26 146 34 144 38 C135 34 122 34 113 36 Z"
            fill="#5C3B1E"
            stroke="#3B220C"
            stroke-width="2"
          />
          <path d="M115 32 C124 30 136 30 144 33" stroke="#FFD15C" stroke-width="2" stroke-linecap="round" />
          <circle cx="113" cy="35" r="3.5" fill="#C86A3D" stroke="#3B220C" stroke-width="1.5" />

          <!-- Kacamata Aviator di Dahi -->
          <g id="pesawat-goggles">
            <line x1="117" y1="31" x2="139" y2="31" stroke="#241B15" stroke-width="2" />
            <ellipse cx="123" cy="31" rx="4.5" ry="3.5" fill="#67E8F9" stroke="#241B15" stroke-width="1.5" />
            <ellipse cx="133" cy="31" rx="4.5" ry="3.5" fill="#67E8F9" stroke="#241B15" stroke-width="1.5" />
          </g>

          <!-- Tangan Maskot Melambai Gembira -->
          <g class="pesawat-tangan-lambai">
            <path d="M112 56 C105 52 98 44 104 38 C108 42 114 48 116 54 Z" fill="#FFE2C6" stroke="#5C3B1E" stroke-width="2" />
            <circle cx="102" cy="37" r="4.2" fill="#FFE2C6" stroke="#5C3B1E" stroke-width="1.5" />
          </g>
        </g>

        <!-- Sayap Atas Utama (Sayap Ganda Biplane Elegan) -->
        <g id="pesawat-sayap-atas">
          <line x1="114" y1="62" x2="118" y2="44" stroke="#443224" stroke-width="2.5" stroke-linecap="round" />
          <line x1="148" y1="64" x2="152" y2="44" stroke="#443224" stroke-width="2.5" stroke-linecap="round" />
          <line x1="116" y1="44" x2="150" y2="64" stroke="#785338" stroke-width="1.2" stroke-dasharray="2 2" />

          <path
            d="M68 40 C90 37 156 37 178 41 C182 43 181 49 176 51 C154 55 88 55 66 51 C62 48 63 42 68 40 Z"
            fill="#C86A3D"
            stroke="#8A3F1B"
            stroke-width="2.8"
          />
          <path d="M72 44 C96 42 148 42 172 45" stroke="#FFD15C" stroke-width="2.5" stroke-linecap="round" />
        </g>

        <!-- Ekor Pesawat & Bendera Merah Putih -->
        <g id="pesawat-ekor">
          <path d="M30 72 L16 38 C23 37 36 44 42 64 Z" fill="#FAF6EE" stroke="#5C3B1E" stroke-width="2.5" />
          <g class="pesawat-bendera-ekor">
            <line x1="16" y1="38" x2="16" y2="18" stroke="#443224" stroke-width="2.2" stroke-linecap="round" />
            <path d="M16 18 C24 16 28 22 36 19 L36 26 C28 29 24 23 16 25 Z" fill="#E83D3D" />
            <path d="M16 25 C24 23 28 29 36 26 L36 33 C28 36 24 30 16 32 Z" fill="#FFFFFF" stroke="#D32F2F" stroke-width="0.5" />
          </g>
          <path d="M24 75 L12 77 C14 80 24 81 32 80 Z" fill="#C86A3D" stroke="#8A3F1B" stroke-width="1.5" />
        </g>

        <!-- Moncong Hidung Pesawat & Baling-Baling Emas -->
        <g id="pesawat-moncong">
          <ellipse cx="192" cy="80" rx="6" ry="14" fill="#FFD15C" stroke="#5C3B1E" stroke-width="2.2" />
          <g class="pesawat-baling-grup">
            <ellipse cx="195" cy="82" rx="4.5" ry="36" fill="rgba(255, 209, 92, 0.85)" stroke="#B87314" stroke-width="1.8" />
            <circle cx="195" cy="82" r="5" fill="#443224" />
            <ellipse cx="195" cy="82" rx="8" ry="42" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="2.5" stroke-dasharray="8 6" />
          </g>
        </g>
      </svg>
    </div>

    <!-- Banner Teks Ucapan Selamat Mendarat -->
    <div class="pesawat-teks-mendarat" id="pesawat-teks-mendarat">
      <span class="pesawat-teks-mendarat-titik"></span>
      <span id="pesawat-teks-konten">Mendarat di Kepulauan Nusantara 3D... 🏝️✨</span>
    </div>
  `;

  document.body.appendChild(overlayEl);

  pesawatAktorEl = overlayEl.querySelector('#pesawat-wadah-aktor');
  jejakAsapWadahEl = overlayEl.querySelector('#pesawat-jejak-asap');
  touchdownWadahEl = overlayEl.querySelector('#pesawat-touchdown-wadah');
  teksMendaratEl = overlayEl.querySelector('#pesawat-teks-mendarat');
  kilauLayarEl = overlayEl.querySelector('#pesawat-kilau-layar');
}

/**
 * Menghasilkan partikel kepulan asap awan knalpot di posisi belakang pesawat
 * @param {number} x - Posisi X layar
 * @param {number} y - Posisi Y layar
 */
function buatAsapKnalpot(x, y) {
  if (!jejakAsapWadahEl) return;

  const partikel = document.createElement('div');
  partikel.className = 'pesawat-asap-partikel';
  const diameter = Math.random() * 20 + 16;
  partikel.style.width = `${diameter}px`;
  partikel.style.height = `${diameter}px`;
  partikel.style.left = `${x}px`;
  partikel.style.top = `${y}px`;

  jejakAsapWadahEl.appendChild(partikel);

  gsap.fromTo(
    partikel,
    {
      scale: 0.35,
      opacity: 0.85,
      x: 0,
      y: 0
    },
    {
      scale: Math.random() * 1.4 + 1.2,
      opacity: 0,
      x: (Math.random() - 0.5) * 50 - 40,
      y: (Math.random() - 0.5) * 30 + 10,
      duration: 0.85,
      ease: 'power1.out',
      onComplete: () => {
        if (partikel.parentNode) {
          partikel.parentNode.removeChild(partikel);
        }
      }
    }
  );
}

/**
 * Menghitung koordinat responsif penerbangan pesawat berdasarkan resolusi viewport
 */
function dapatkanKoordinatPenerbangan() {
  const lebarLayar = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const tinggiLayar = typeof window !== 'undefined' ? window.innerHeight : 800;

  return {
    // 1. Titik Awal: Di bawah layar (kiri-tengah)
    posAwal: {
      x: lebarLayar * 0.15,
      y: tinggiLayar + 140,
      rotasi: -34,
      skala: 1.25
    },
    // 2. Titik Puncak Mengangkasa (Pusat Layar Horison Atas)
    posPuncak: {
      x: lebarLayar * 0.44 - 110,
      y: tinggiLayar * 0.28,
      rotasi: -12,
      skala: 1.05
    },
    // 3. Titik Mendarat (Pulau Jawa/Bali di tengah Peta 3D Nusantara)
    posMendarat: {
      x: lebarLayar * 0.50 - 55,
      y: tinggiLayar * 0.52 - 40,
      rotasi: 8,
      skala: 0.22
    }
  };
}

/**
 * TAHAP 1: LEPAS LANDAS (Takeoff)
 * Menggerakkan pesawat terbang menanjak dari bawah layar hingga mencapai posisi puncak di angkasa.
 *
 * @param {object} parameter
 * @param {() => void} parameter.onTerbangTinggi - Dipanggil saat pesawat sudah di ketinggian jelajah untuk berpindah URL/tampilan
 */
export function terbangkanPesawatLepasLandas({ onTerbangTinggi }) {
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

  const { posAwal, posPuncak } = dapatkanKoordinatPenerbangan();

  // Set posisi awal pesawat di bawah layar
  gsap.set(pesawatAktorEl, {
    x: posAwal.x,
    y: posAwal.y,
    rotation: posAwal.rotasi,
    scale: posAwal.skala,
    opacity: 1
  });

  gsap.set(kilauLayarEl, { opacity: 0 });
  gsap.set(touchdownWadahEl, { opacity: 0 });
  gsap.set(teksMendaratEl, { opacity: 0 });

  let intervalAsap = null;

  // Watchdog pengaman: Jamin callback selalu terpanggil dalam 1.8 detik
  const safetyTimeout = setTimeout(() => {
    if (intervalAsap) clearInterval(intervalAsap);
    if (typeof onTerbangTinggi === 'function') onTerbangTinggi();
  }, 1800);

  timelineAktif = gsap.timeline({
    onComplete: () => {
      clearTimeout(safetyTimeout);
      if (intervalAsap) clearInterval(intervalAsap);
    }
  });

  // [0.0s -> 0.72s]: LEPAS LANDAS MENUKIK KE ATAS
  timelineAktif.to(
    pesawatAktorEl,
    {
      x: posPuncak.x,
      y: posPuncak.y,
      rotation: posPuncak.rotasi,
      scale: posPuncak.skala,
      duration: 0.72,
      ease: 'power2.out',
      onStart: () => {
        intervalAsap = setInterval(() => {
          if (!pesawatAktorEl) return;
          const rect = pesawatAktorEl.getBoundingClientRect();
          buatAsapKnalpot(rect.left + 24, rect.top + rect.height * 0.65);
        }, 55);
      }
    },
    0
  );

  // Efek kilau langit lembut saat pesawat mencapai puncak
  timelineAktif.to(
    kilauLayarEl,
    {
      opacity: 0.75,
      duration: 0.32,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut'
    },
    0.38
  );

  // Saat pesawat mencapai puncak di angkasa, panggil callback untuk transisi halaman
  timelineAktif.add(() => {
    if (intervalAsap) {
      clearInterval(intervalAsap);
      intervalAsap = null;
    }
    clearTimeout(safetyTimeout);
    if (typeof onTerbangTinggi === 'function') {
      onTerbangTinggi();
    }
  }, 0.60);
}

/**
 * Memposisikan pesawat langsung di posisi puncak (cruising altitude) di angkasa.
 * Berguna saat halaman Jelajah baru dibuka via mendarat=1 agar pesawat langsung terlihat melayang.
 */
export function siapkanPesawatMendarat() {
  pastikanDomSiap();
  overlayEl.classList.add('is-aktif');

  const { posPuncak } = dapatkanKoordinatPenerbangan();

  gsap.set(pesawatAktorEl, {
    x: posPuncak.x,
    y: posPuncak.y,
    rotation: posPuncak.rotasi,
    scale: posPuncak.skala,
    opacity: 1
  });

  gsap.set(kilauLayarEl, { opacity: 0 });
  gsap.set(touchdownWadahEl, { opacity: 0 });
  gsap.set(teksMendaratEl, { opacity: 0 });
}

/**
 * TAHAP 2: PENDARATAN (Touchdown)
 * Menggerakkan pesawat menukik turun dari posisi puncak angkasa menuju pulau diorama Nusantara 3D,
 * menyemburkan percikan bintang emas saat menyentuh daratan, dan memicu animasi masuk diorama 3D.
 *
 * @param {object} parameter
 * @param {() => void} [parameter.onTouchdown] - Dipanggil tepat saat roda pesawat menyentuh daratan pulau
 * @param {() => void} [parameter.onSelesai] - Dipanggil setelah seluruh animasi transisi tuntas
 */
export function mendaratkanPesawatDiPulau({ onTouchdown, onSelesai } = {}) {
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

  if (timelineAktif) {
    timelineAktif.kill();
    timelineAktif = null;
  }

  overlayEl.classList.add('is-aktif');

  const { posPuncak, posMendarat } = dapatkanKoordinatPenerbangan();

  // Pastikan posisi awal di puncak
  gsap.set(pesawatAktorEl, {
    x: posPuncak.x,
    y: posPuncak.y,
    rotation: posPuncak.rotasi,
    scale: posPuncak.skala,
    opacity: 1
  });

  gsap.set(touchdownWadahEl, { opacity: 0 });
  gsap.set(teksMendaratEl, { opacity: 0 });

  let intervalAsap = null;

  // Watchdog pengaman
  const safetyTimeout = setTimeout(() => {
    if (intervalAsap) clearInterval(intervalAsap);
    if (overlayEl) overlayEl.classList.remove('is-aktif');
    if (typeof onTouchdown === 'function') onTouchdown();
    if (typeof onSelesai === 'function') onSelesai();
  }, 2600);

  timelineAktif = gsap.timeline({
    onComplete: () => {
      clearTimeout(safetyTimeout);
      if (intervalAsap) clearInterval(intervalAsap);
      if (overlayEl) overlayEl.classList.remove('is-aktif');
      timelineAktif = null;
      if (typeof onSelesai === 'function') {
        onSelesai();
      }
    }
  });

  // Tampilkan banner mendarat lembut
  if (teksMendaratEl) {
    timelineAktif.to(teksMendaratEl, { opacity: 1, duration: 0.28 }, 0.05);
  }

  // [0.0s -> 0.95s]: MENUKIK TURUN DAN MENDARAT DI PULAU NUSANTARA 3D
  timelineAktif.to(
    pesawatAktorEl,
    {
      x: posMendarat.x,
      y: posMendarat.y,
      rotation: posMendarat.rotasi,
      scale: posMendarat.skala,
      duration: 0.95,
      ease: 'power2.inOut',
      onStart: () => {
        intervalAsap = setInterval(() => {
          if (!pesawatAktorEl) return;
          const rect = pesawatAktorEl.getBoundingClientRect();
          buatAsapKnalpot(rect.left + 16, rect.top + rect.height * 0.65);
        }, 65);
      },
      onComplete: () => {
        if (intervalAsap) {
          clearInterval(intervalAsap);
          intervalAsap = null;
        }
      }
    },
    0
  );

  // [0.82s]: SENTUHAN PENDARATAN (TOUCHDOWN!)
  timelineAktif.add(() => {
    // Posisikan letupan tepat di titik mendarat pesawat
    if (touchdownWadahEl) {
      touchdownWadahEl.style.left = `${posMendarat.x + 24}px`;
      touchdownWadahEl.style.top = `${posMendarat.y + 18}px`;

      gsap.fromTo(
        touchdownWadahEl,
        { scale: 0.35, opacity: 1 },
        { scale: 1.8, opacity: 0, duration: 0.65, ease: 'back.out(2)' }
      );
    }

    if (typeof onTouchdown === 'function') {
      onTouchdown();
    }
  }, 0.82);

  // Pesawat mengecil dan memudar lembut setelah sukses mendarat
  timelineAktif.to(
    pesawatAktorEl,
    {
      opacity: 0,
      scale: posMendarat.skala * 0.55,
      duration: 0.35,
      ease: 'power2.in'
    },
    0.98
  );

  timelineAktif.to(
    teksMendaratEl,
    {
      opacity: 0,
      duration: 0.25,
      ease: 'power1.out'
    },
    1.15
  );
}

/**
 * Menjalankan animasi penerbangan sinematik penuh (Lepas Landas -> Crossfade -> Mendarat)
 * Berguna saat transisi dalam mode SPA tanpa reload browser.
 *
 * @param {object} parameter
 * @param {() => void} parameter.onGantiTampilan - Dipanggil saat pesawat di udara untuk mengganti view DOM
 * @param {() => void} [parameter.onMendaratSelesai] - Dipanggil saat pesawat sukses mendarat di pulau
 */
export function terbangkanPesawatKeJelajah({ onGantiTampilan, onMendaratSelesai }) {
  terbangkanPesawatLepasLandas({
    onTerbangTinggi: () => {
      if (typeof onGantiTampilan === 'function') {
        onGantiTampilan();
      }
      mendaratkanPesawatDiPulau({
        onSelesai: onMendaratSelesai
      });
    }
  });
}
