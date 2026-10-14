/**
 * audio.js — Pengelola backsound lagu daerah Nusantara
 * Urutan pemutaran:
 * 1. Ampar-Ampar Pisang (Kalimantan Selatan)
 * 2. Kicir-Kicir (DKI Jakarta)
 * 3. Bungong Jeumpa (Aceh)
 * 4. Soleram (Riau)
 * 5. Yamko Rambe Yamko (Papua)
 *
 * Volume disetel lembut (default ~18%) sebagai backsound ambient yang tenang.
 * Sumber audio: WikiDendang, Wikimedia Indonesia (Lisensi Creative Commons CC-BY-SA 4.0).
 */

export const DAFTAR_PUTAR_BACKSOUND = [
  {
    nomor: 1,
    id: 'ampar-ampar-pisang',
    judul: 'Ampar-Ampar Pisang',
    daerah: 'Kalimantan Selatan',
    durasi: '1:37',
    ikon: '🍌',
    sumber: './audio/ampar-ampar-pisang.mp3'
  },
  {
    nomor: 2,
    id: 'kicir-kicir',
    judul: 'Kicir-Kicir',
    daerah: 'DKI Jakarta',
    durasi: '3:27',
    ikon: '🎡',
    sumber: './audio/kicir-kicir.mp3'
  },
  {
    nomor: 3,
    id: 'bungong-jeumpa',
    judul: 'Bungong Jeumpa',
    daerah: 'Aceh',
    durasi: '2:31',
    ikon: '🌺',
    sumber: './audio/bungong-jeumpa.mp3'
  },
  {
    nomor: 4,
    id: 'soleram',
    judul: 'Soleram',
    daerah: 'Riau',
    durasi: '2:03',
    ikon: '🌙',
    sumber: './audio/soleram.mp3'
  },
  {
    nomor: 5,
    id: 'yamko-rambe-yamko',
    judul: 'Yamko Rambe Yamko',
    daerah: 'Papua',
    durasi: '2:06',
    ikon: '🏹',
    sumber: './audio/yamko-rambe-yamko.mp3'
  }
];

const KUNCI_STORAGE_VOLUME = 'lokalocal-backsound-volume';
const KUNCI_STORAGE_STATUS = 'lokalocal-backsound-status';
const KUNCI_STORAGE_INDEX = 'lokalocal-backsound-index';

const VOLUME_DEFAULT = 0.18; // 18% lembut untuk ambient backsound

let instanceAudio = null;
let indeksAktif = 0;
let statusSedangMemutar = false;
let widgetEl = null;
let popupEl = null;
let interaksiPertamaTerjadi = false;

/**
 * Menginisialisasi pemutar backsound dan menyematkan kontrol mengambang ke halaman.
 */
export function inisialisasiBacksound() {
  if (instanceAudio) return instanceAudio;

  // Baca preferensi tersimpan
  let volumeAwal = VOLUME_DEFAULT;
  try {
    const volStr = localStorage.getItem(KUNCI_STORAGE_VOLUME);
    if (volStr !== null) {
      const v = parseFloat(volStr);
      if (!Number.isNaN(v) && v >= 0 && v <= 1) volumeAwal = v;
    }
    const idxStr = localStorage.getItem(KUNCI_STORAGE_INDEX);
    if (idxStr !== null) {
      const idx = parseInt(idxStr, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < DAFTAR_PUTAR_BACKSOUND.length) {
        indeksAktif = idx;
      }
    }
  } catch {
    // Abaikan error localStorage
  }

  // Buat elemen Audio
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.volume = volumeAwal;
  audio.loop = false;
  instanceAudio = audio;

  // Pasang sumber lagu pertama
  audio.src = DAFTAR_PUTAR_BACKSOUND[indeksAktif].sumber;

  // Bangun antarmuka kontrol mengambang
  bangunWidgetUI(audio);

  // Event otomatis lanjut ke lagu berikutnya saat lagu selesai
  audio.addEventListener('ended', () => {
    putarLaguBerikutnya();
  });

  audio.addEventListener('play', () => {
    statusSedangMemutar = true;
    perbaruiTampilanUI();
    try {
      localStorage.setItem(KUNCI_STORAGE_STATUS, 'play');
    } catch {
      // Abaikan
    }
  });

  audio.addEventListener('pause', () => {
    statusSedangMemutar = false;
    perbaruiTampilanUI();
    try {
      localStorage.setItem(KUNCI_STORAGE_STATUS, 'pause');
    } catch {
      // Abaikan
    }
  });

  audio.addEventListener('error', () => {
    // Jika ada kegagalan file, coba lagu berikutnya secara aman
    console.warn('[Backsound] Gagal memuat track, beralih ke track berikutnya...');
  });

  // Autoplay ramah kebijakan browser: saat interaksi klik pertama pengguna di dokumen
  function tanganiInteraksiPertama() {
    if (interaksiPertamaTerjadi) return;
    interaksiPertamaTerjadi = true;

    // Periksa apakah pengguna sebelumnya mematikan musik
    let statusSebelumnya = 'play';
    try {
      statusSebelumnya = localStorage.getItem(KUNCI_STORAGE_STATUS) || 'play';
    } catch {
      // Abaikan
    }

    if (statusSebelumnya !== 'pause' && !statusSedangMemutar) {
      audio.play().catch(() => {
        // Autoplay diblokir browser, pengguna bisa mengklik tombol putar manual
      });
    }

    window.removeEventListener('pointerdown', tanganiInteraksiPertama);
    window.removeEventListener('keydown', tanganiInteraksiPertama);
  }

  window.addEventListener('pointerdown', tanganiInteraksiPertama, { once: true, passive: true });
  window.addEventListener('keydown', tanganiInteraksiPertama, { once: true, passive: true });

  return {
    putar: () => audio.play(),
    jeda: () => audio.pause(),
    gantiLagu: (idx) => putarLaguIndex(idx),
    aturVolume: (v) => aturVolumeAudio(v)
  };
}

/**
 * Memutar lagu berdasarkan indeks daftar putar.
 * @param {number} idx
 */
function putarLaguIndex(idx) {
  if (!instanceAudio) return;
  if (idx < 0 || idx >= DAFTAR_PUTAR_BACKSOUND.length) return;

  indeksAktif = idx;
  try {
    localStorage.setItem(KUNCI_STORAGE_INDEX, String(indeksAktif));
  } catch {
    // Abaikan
  }

  const track = DAFTAR_PUTAR_BACKSOUND[indeksAktif];
  instanceAudio.src = track.sumber;
  instanceAudio.play().catch(() => {
    // Browser perlu interaksi
  });
  perbaruiTampilanUI();
}

/**
 * Beralih ke lagu berikutnya secara berurutan.
 */
function putarLaguBerikutnya() {
  const nextIdx = (indeksAktif + 1) % DAFTAR_PUTAR_BACKSOUND.length;
  putarLaguIndex(nextIdx);
}

/**
 * Beralih ke lagu sebelumnya.
 */
function putarLaguSebelumnya() {
  const prevIdx = (indeksAktif - 1 + DAFTAR_PUTAR_BACKSOUND.length) % DAFTAR_PUTAR_BACKSOUND.length;
  putarLaguIndex(prevIdx);
}

/**
 * Menyetel volume audio dan menyimpannya.
 * @param {number} vol
 */
function aturVolumeAudio(vol) {
  if (!instanceAudio) return;
  const clamped = Math.max(0, Math.min(1, vol));
  instanceAudio.volume = clamped;
  try {
    localStorage.setItem(KUNCI_STORAGE_VOLUME, String(clamped));
  } catch {
    // Abaikan
  }
  perbaruiSliderVolume(clamped);
}

/**
 * Membangun elemen UI mengambang (Floating Audio Dock).
 * @param {HTMLAudioElement} audio
 */
function bangunWidgetUI(audio) {
  if (document.getElementById('audio-backsound-dock')) return;

  // Wadah dock utama mengambang di kanan bawah
  widgetEl = document.createElement('aside');
  widgetEl.id = 'audio-backsound-dock';
  widgetEl.className = 'audio-backsound-dock';
  widgetEl.setAttribute('aria-label', 'Pemutar Backsound Lagu Daerah');

  widgetEl.innerHTML = `
    <!-- Tombol Kapsul Utama -->
    <div class="audio-kapsul" id="audio-kapsul-utama">
      <button
        type="button"
        class="audio-tombol-ikon"
        id="audio-tombol-toggle"
        aria-label="Putar atau Jeda Backsound"
        title="Putar / Jeda Backsound"
      >
        <div class="audio-equalizer" id="audio-equalizer" aria-hidden="true">
          <span class="eq-bar bar-1"></span>
          <span class="eq-bar bar-2"></span>
          <span class="eq-bar bar-3"></span>
        </div>
      </button>

      <button
        type="button"
        class="audio-info-teks"
        id="audio-tombol-buka-playlist"
        aria-label="Buka Daftar Putar Backsound"
        title="Klik untuk membuka daftar lagu & pengaturan volume"
      >
        <span class="audio-lagu-judul" id="audio-label-judul">Ampar-Ampar Pisang</span>
        <span class="audio-lagu-daerah" id="audio-label-daerah">Kalimantan Selatan • 1/5</span>
      </button>

      <div class="audio-aksi-cepat">
        <button
          type="button"
          class="audio-tombol-kecil"
          id="audio-tombol-next"
          aria-label="Lagu Berikutnya"
          title="Lagu Berikutnya"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4l10 8-10 8V4zm11 0h3v16h-3V4z"/>
          </svg>
        </button>

        <button
          type="button"
          class="audio-tombol-kecil"
          id="audio-tombol-menu"
          aria-expanded="false"
          aria-label="Daftar Putar"
          title="Daftar Putar & Volume"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Panel Pop-up Daftar Putar & Kontrol Volume -->
    <div class="audio-popup-panel" id="audio-popup-panel" hidden>
      <div class="audio-popup-header">
        <div class="audio-popup-header-teks">
          <span class="audio-popup-badge">BACKSOUND NUSANTARA</span>
          <h4 class="audio-popup-judul">Lagu Daerah Indonesia</h4>
        </div>
        <button
          type="button"
          class="audio-popup-tutup"
          id="audio-popup-tutup"
          aria-label="Tutup Panel Lagu"
        >
          ✕
        </button>
      </div>

      <!-- Kontrol Volume Lembut -->
      <div class="audio-volume-wadah">
        <span class="audio-volume-ikon" id="audio-volume-ikon" aria-hidden="true">🔉</span>
        <label for="audio-volume-slider" class="sr-only">Volume Backsound</label>
        <input
          type="range"
          id="audio-volume-slider"
          class="audio-volume-slider"
          min="0"
          max="1"
          step="0.02"
          value="${audio.volume}"
          title="Atur Volume Backsound (lembut)"
        />
        <span class="audio-volume-persen" id="audio-volume-persen">${Math.round(audio.volume * 100)}%</span>
      </div>

      <!-- Daftar 5 Lagu Berurutan -->
      <ul class="audio-playlist-list" id="audio-playlist-list" role="list">
        ${DAFTAR_PUTAR_BACKSOUND.map(
          (track, idx) => `
          <li class="audio-playlist-item ${idx === indeksAktif ? 'aktif' : ''}" data-index="${idx}">
            <button type="button" class="audio-track-btn" data-index="${idx}">
              <span class="audio-track-nomor">${track.nomor}</span>
              <span class="audio-track-ikon" aria-hidden="true">${track.ikon}</span>
              <div class="audio-track-detail">
                <span class="audio-track-judul">${track.judul}</span>
                <span class="audio-track-daerah">${track.daerah}</span>
              </div>
              <span class="audio-track-durasi">${track.durasi}</span>
            </button>
          </li>
        `
        ).join('')}
      </ul>

      <!-- Atribusi Sumber WikiDendang -->
      <div class="audio-popup-footer">
        <p class="audio-popup-sumber">
          Arsip WikiDendang • Wikimedia Indonesia (Lisensi CC-BY-SA 4.0)
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(widgetEl);
  popupEl = document.getElementById('audio-popup-panel');

  // Pasang Listener
  const tombolToggle = document.getElementById('audio-tombol-toggle');
  const tombolBukaPlaylist = document.getElementById('audio-tombol-buka-playlist');
  const tombolMenu = document.getElementById('audio-tombol-menu');
  const tombolNext = document.getElementById('audio-tombol-next');
  const tombolTutupPopup = document.getElementById('audio-popup-tutup');
  const sliderVolume = document.getElementById('audio-volume-slider');
  const playlistList = document.getElementById('audio-playlist-list');

  tombolToggle.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  const togglePopup = () => {
    const isHidden = popupEl.hasAttribute('hidden');
    if (isHidden) {
      popupEl.removeAttribute('hidden');
      tombolMenu.setAttribute('aria-expanded', 'true');
    } else {
      popupEl.setAttribute('hidden', '');
      tombolMenu.setAttribute('aria-expanded', 'false');
    }
  };

  tombolBukaPlaylist.addEventListener('click', togglePopup);
  tombolMenu.addEventListener('click', togglePopup);
  tombolTutupPopup.addEventListener('click', () => {
    popupEl.setAttribute('hidden', '');
    tombolMenu.setAttribute('aria-expanded', 'false');
  });

  tombolNext.addEventListener('click', () => {
    putarLaguBerikutnya();
  });

  sliderVolume.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    aturVolumeAudio(v);
  });

  // Klik salah satu lagu di daftar putar
  playlistList.addEventListener('click', (e) => {
    const btn = e.target.closest('.audio-track-btn');
    if (btn) {
      const idx = parseInt(btn.dataset.index, 10);
      if (!Number.isNaN(idx)) {
        putarLaguIndex(idx);
      }
    }
  });

  // Tutup popup jika menekan ESC atau klik di luar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popupEl.hasAttribute('hidden')) {
      popupEl.setAttribute('hidden', '');
      tombolMenu.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('pointerdown', (e) => {
    if (!popupEl.hasAttribute('hidden') && !widgetEl.contains(e.target)) {
      popupEl.setAttribute('hidden', '');
      tombolMenu.setAttribute('aria-expanded', 'false');
    }
  });

  perbaruiTampilanUI();
}

/**
 * Memperbarui tampilan widget sesuai lagu aktif dan status play/pause.
 */
function perbaruiTampilanUI() {
  const labelJudul = document.getElementById('audio-label-judul');
  const labelDaerah = document.getElementById('audio-label-daerah');
  const equalizer = document.getElementById('audio-equalizer');
  const tombolToggle = document.getElementById('audio-tombol-toggle');
  const playlistItems = document.querySelectorAll('.audio-playlist-item');

  const track = DAFTAR_PUTAR_BACKSOUND[indeksAktif];
  if (labelJudul) labelJudul.textContent = track.judul;
  if (labelDaerah) labelDaerah.textContent = `${track.daerah} • ${track.nomor}/5`;

  if (equalizer && tombolToggle) {
    if (statusSedangMemutar) {
      equalizer.classList.add('aktif');
      tombolToggle.setAttribute('title', `Jeda ${track.judul}`);
      tombolToggle.classList.add('sedang-putar');
    } else {
      equalizer.classList.remove('aktif');
      tombolToggle.setAttribute('title', `Putar ${track.judul}`);
      tombolToggle.classList.remove('sedang-putar');
    }
  }

  // Perbarui item aktif di playlist
  playlistItems.forEach((item, idx) => {
    item.classList.toggle('aktif', idx === indeksAktif);
  });
}

/**
 * Memperbarui angka persentase volume pada UI slider.
 * @param {number} vol
 */
function perbaruiSliderVolume(vol) {
  const slider = document.getElementById('audio-volume-slider');
  const persenEl = document.getElementById('audio-volume-persen');
  const ikonEl = document.getElementById('audio-volume-ikon');

  if (slider) slider.value = String(vol);
  if (persenEl) persenEl.textContent = `${Math.round(vol * 100)}%`;
  if (ikonEl) {
    if (vol === 0) ikonEl.textContent = '🔇';
    else if (vol < 0.4) ikonEl.textContent = '🔉';
    else ikonEl.textContent = '🔊';
  }
}
