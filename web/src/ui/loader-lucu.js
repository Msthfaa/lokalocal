/**
 * loader-lucu.js — Layar Pemuatan Interaktif & Animasi Lucu Nusantara (3D Jelajah)
 * Menghadirkan maskot Kapal Pinisi Mungil "Si Kembara" dengan mata imut berkedip,
 * ombak berlapis beranimasi, bilah progres pelayaran Sabang-Merauke,
 * dan lelucon/fakta kebudayaan Nusantara yang berganti secara dinamis saat peta 3D disiapkan.
 */

const PESAN_LUCU_NUSANTARA = [
  'Menyusun 17.000 pulau satu per satu... (awas ada yang hanyut!) 🏝️',
  'Membangunkan Komodo sebentar agar tidak menghalangi jalur kapal... 🦎💤',
  'Memoles lambung kapal Pinisi dengan minyak kelapa wangi... ⛵✨',
  'Menjemur kain batik sebentar biar tidak kusut di atas peta... 🎨🧺',
  'Mengajak burung Cenderawasih latihan vokal pagi... 🦜🎶',
  'Membungkus bekal rendang untuk pelayaran dari Sabang ke Merauke... 🍱🔥',
  'Memanaskan oven 3D... kepulauan sebentar lagi matang dan siap santap! 🍛🔥',
  'Menyetel kompas pelaut kuno dan lentera khatulistiwa... 🧭✨',
  'Merajut terumbu karang bawah laut... hati-hati terantuk ya! 🐠🌊'
];

/**
 * Membuat dan mengontrol antarmuka layar muat animasi lucu
 * @param {HTMLElement} [wadahInduk=document.body]
 * @returns {object} Kontroler: aturProgres, getProgres, selesai, hancurkan
 */
export function inisialisasiLoaderLucu(wadahInduk = document.body) {
  let elemenLoader = document.getElementById('jelajah-loading-screen');

  if (!elemenLoader) {
    elemenLoader = document.createElement('div');
    elemenLoader.id = 'jelajah-loading-screen';
    elemenLoader.className = 'jelajah-loading-screen';
    elemenLoader.setAttribute('role', 'status');
    elemenLoader.setAttribute('aria-live', 'polite');
    wadahInduk.prepend(elemenLoader);
  }

  // Struktur HTML Maskot & Antarmuka Ceria
  elemenLoader.innerHTML = `
    <div class="jelajah-loading-kartu">
      <!-- Panggung Maskot Kapal Pinisi Mungil "Si Kembara" -->
      <div class="jelajah-maskot-panggung" aria-hidden="true">
        <!-- Awan melayang -->
        <div class="jelajah-maskot-awan jelajah-maskot-awan--1">☁️</div>
        <div class="jelajah-maskot-awan jelajah-maskot-awan--2">☁️</div>

        <!-- Ikan terbang / lumba-lumba kecil sesekali melompat -->
        <div class="jelajah-maskot-lumba">🐬</div>

        <!-- SVG Kapal Pinisi Mungil Lucu dengan Mata Berkedip & Bendera -->
        <div class="jelajah-kapal-animasi">
          <svg class="jelajah-kapal-svg" viewBox="0 0 160 140" width="160" height="140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Asap Cerah / Bintang Keberuntungan -->
            <g class="jelajah-bintang-kilau">
              <path d="M125 22L127 27L132 29L127 31L125 36L123 31L118 29L123 27Z" fill="#FFD15C" opacity="0.85"/>
              <circle cx="35" cy="40" r="3" fill="#FFF" opacity="0.6"/>
            </g>

            <!-- Tiang Layar Utama -->
            <line x1="80" y1="20" x2="80" y2="92" stroke="#5C3B1E" stroke-width="4.5" stroke-linecap="round"/>
            <line x1="112" y1="36" x2="112" y2="92" stroke="#5C3B1E" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="48" y1="46" x2="48" y2="92" stroke="#5C3B1E" stroke-width="3" stroke-linecap="round"/>

            <!-- Bendera Merah Putih Berkibar -->
            <g class="jelajah-bendera-tiang">
              <rect x="80" y="14" width="22" height="7" fill="#E83D3D" rx="1.5"/>
              <rect x="80" y="21" width="22" height="7" fill="#FFFFFF" rx="1.5"/>
              <path d="M102 14L99 21L102 28" fill="none" stroke="#D32F2F" stroke-width="1.5"/>
            </g>

            <!-- Layar Segitiga Pinisi (Gading & Terakota Nusantara) -->
            <!-- Layar Belakang -->
            <path d="M48 50L24 86H48Z" fill="#FBF5E8" stroke="#D9C7A5" stroke-width="2"/>
            <line x1="42" y1="58" x2="28" y2="82" stroke="#E6B14A" stroke-width="1.5" stroke-dasharray="2 2"/>

            <!-- Layar Depan -->
            <path d="M112 40L142 86H112Z" fill="#F4E8D1" stroke="#CBB48C" stroke-width="2"/>
            <!-- Layar Utama Tengah -->
            <path d="M80 26L48 86H80Z" fill="#FFFDF8" stroke="#E2D4B7" stroke-width="2.5"/>
            <path d="M80 30L112 86H80Z" fill="#C86A3D" stroke="#A94F25" stroke-width="2"/>

            <!-- Lambung Kapal Kayu Pinisi Bulat Menggemaskan -->
            <path d="M18 84C24 104 46 112 80 112C114 112 136 104 146 84C136 88 114 91 80 91C46 91 26 88 18 84Z" fill="#8B4513" stroke="#5C2E0B" stroke-width="3"/>
            <!-- Garis Dekorasi Warna Emas pada Lambung -->
            <path d="M22 90C36 102 60 106 80 106C100 106 124 102 140 90" stroke="#FFBE3B" stroke-width="3" stroke-linecap="round" fill="none"/>

            <!-- Wajah Chibi Lucu Kapal "Si Kembara" -->
            <!-- Pipi Merona Merah Muda (Blush) -->
            <ellipse cx="64" cy="99" rx="4.5" ry="3" fill="#FF8A8A" opacity="0.8"/>
            <ellipse cx="96" cy="99" rx="4.5" ry="3" fill="#FF8A8A" opacity="0.8"/>

            <!-- Mata Kartun Beranimasi (Kedip Mata) -->
            <g class="jelajah-mata-kapal">
              <!-- Mata Kiri -->
              <circle cx="70" cy="94" r="4.2" fill="#241B15"/>
              <circle cx="68.5" cy="92.5" r="1.6" fill="#FFFFFF"/>
              <!-- Mata Kanan -->
              <circle cx="90" cy="94" r="4.2" fill="#241B15"/>
              <circle cx="88.5" cy="92.5" r="1.6" fill="#FFFFFF"/>
            </g>

            <!-- Senyum Manis -->
            <path d="M76 98C78 101 82 101 84 98" stroke="#241B15" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          </svg>
        </div>

        <!-- Ombak Laut Berlapis yang Bergerak -->
        <div class="jelajah-ombak-wadah">
          <div class="jelajah-ombak jelajah-ombak--belakang"></div>
          <div class="jelajah-ombak jelajah-ombak--depan"></div>
        </div>
      </div>

      <!-- Teks & Judul Loader -->
      <div class="jelajah-loading-header">
        <span class="jelajah-loading-lencana">
          <span class="jelajah-loading-titik"></span>
          Dapur Peta Nusantara
        </span>
        <h2 class="jelajah-loading-judul">Menyiapkan Nusantara 3D</h2>
      </div>

      <!-- Pesan Lucu Berputar Dinamis -->
      <div class="jelajah-loading-pesan-kotak">
        <p id="jelajah-loading-pesan" class="jelajah-loading-pesan">
          ${PESAN_LUCU_NUSANTARA[0]}
        </p>
      </div>

      <!-- Bilah Progres Ceria (Sabang ke Merauke) -->
      <div class="jelajah-loading-progres-area">
        <div class="jelajah-loading-jalur">
          <div id="jelajah-loading-bar" class="jelajah-loading-bar" style="width: 15%;">
            <!-- Ikon kapal mini di ujung bilah -->
            <span class="jelajah-loading-kapal-mini" aria-hidden="true">⛵</span>
          </div>
        </div>

        <div class="jelajah-loading-footer">
          <div class="jelajah-loading-posisi">
            <span class="jelajah-loading-kota">Sabang</span>
            <span class="jelajah-loading-panah">&rarr;</span>
            <span class="jelajah-loading-kota">Merauke</span>
          </div>
          <span id="jelajah-loading-persen" class="jelajah-loading-persen">15%</span>
        </div>
      </div>

      <p class="jelajah-loading-tip">
        💡 <strong>Tahukah kamu?</strong> Di peta ini kamu bisa memutar Nusantara 360°, beralih ke Mode Malam berbintang, dan mencap paspor tiap provinsi!
      </p>
    </div>
  `;

  const barEl = elemenLoader.querySelector('#jelajah-loading-bar');
  const persenEl = elemenLoader.querySelector('#jelajah-loading-persen');
  const pesanEl = elemenLoader.querySelector('#jelajah-loading-pesan');

  let progresSaatIni = 15;
  let indeksPesan = 0;
  let intervalPesan = null;
  let sudahSelesai = false;

  // Rotasi pesan lucu tiap 2.1 detik
  intervalPesan = setInterval(() => {
    if (sudahSelesai || !pesanEl) return;
    indeksPesan = (indeksPesan + 1) % PESAN_LUCU_NUSANTARA.length;
    pesanEl.style.opacity = '0';
    pesanEl.style.transform = 'translateY(5px)';

    setTimeout(() => {
      if (pesanEl && !sudahSelesai) {
        pesanEl.textContent = PESAN_LUCU_NUSANTARA[indeksPesan];
        pesanEl.style.opacity = '1';
        pesanEl.style.transform = 'translateY(0)';
      }
    }, 220);
  }, 2200);

  /**
   * Mengatur progres numerik dan pesan terkini
   * @param {number} nilaiPersen - 0 sampai 100
   * @param {string} [pesanKustom] - Opsional pesan status
   */
  function aturProgres(nilaiPersen, pesanKustom) {
    if (sudahSelesai) return;
    const target = Math.max(progresSaatIni, Math.min(100, Math.round(nilaiPersen)));
    progresSaatIni = target;

    if (barEl) {
      barEl.style.width = `${target}%`;
    }
    if (persenEl) {
      persenEl.textContent = `${target}%`;
    }
    if (pesanKustom && pesanEl) {
      pesanEl.textContent = pesanKustom;
      pesanEl.style.opacity = '1';
      pesanEl.style.transform = 'translateY(0)';
    }

    // Sinkronkan ke maskot kartun penunggu di navbar
    const navKartunPesan = document.getElementById('nav-kartun-pesan');
    const navKartunPersen = document.getElementById('nav-kartun-persen');
    if (navKartunPersen) {
      navKartunPersen.textContent = `${target}%`;
    }
    if (pesanKustom && navKartunPesan) {
      const pesanRingkas = pesanKustom.length > 26 ? pesanKustom.slice(0, 24) + '...' : pesanKustom;
      navKartunPesan.textContent = pesanRingkas;
    }
  }

  /**
   * Menuntaskan layar pemuatan saat adegan 3D sudah matang sempurna
   * @param {string} [pesanPenutup='Nusantara siap dijelajahi! Selamat berlayar ⛵✨']
   * @param {Function} [onSelesai]
   */
  function selesai(pesanPenutup = 'Nusantara siap dijelajahi! Selamat berlayar ⛵✨', onSelesai) {
    if (sudahSelesai) return;
    sudahSelesai = true;

    if (intervalPesan) {
      clearInterval(intervalPesan);
      intervalPesan = null;
    }

    aturProgres(100, pesanPenutup);

    // Animasi maskot kartun navbar melambai gembira
    const navKartun = document.getElementById('nav-loading-kartun');
    const navKartunPesan = document.getElementById('nav-kartun-pesan');
    if (navKartunPesan) {
      navKartunPesan.textContent = 'Siap Berlayar! ⛵✨';
    }
    if (navKartun) {
      navKartun.classList.add('is-selesai');
    }

    // Beri jeda manis 450ms agar mata pengguna melihat 100% dan pesan sukses
    setTimeout(() => {
      elemenLoader.classList.add('is-selesai');

      setTimeout(() => {
        elemenLoader.setAttribute('aria-hidden', 'true');
        elemenLoader.style.display = 'none';
        if (navKartun) {
          navKartun.style.display = 'none';
        }
        if (typeof onSelesai === 'function') {
          onSelesai();
        }
      }, 550);
    }, 450);
  }

  /**
   * Menghapus instans dan listener
   */
  function hancurkan() {
    if (intervalPesan) {
      clearInterval(intervalPesan);
      intervalPesan = null;
    }
    if (elemenLoader && elemenLoader.parentNode) {
      elemenLoader.parentNode.removeChild(elemenLoader);
    }
  }

  return {
    aturProgres,
    getProgres: () => progresSaatIni,
    selesai,
    hancurkan
  };
}
