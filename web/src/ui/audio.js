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
    sumber: './audio/ampar-ampar-pisang.mp3'
  },
  {
    nomor: 2,
    id: 'kicir-kicir',
    judul: 'Kicir-Kicir',
    daerah: 'DKI Jakarta',
    durasi: '3:27',
    sumber: './audio/kicir-kicir.mp3'
  },
  {
    nomor: 3,
    id: 'bungong-jeumpa',
    judul: 'Bungong Jeumpa',
    daerah: 'Aceh',
    durasi: '2:31',
    sumber: './audio/bungong-jeumpa.mp3'
  },
  {
    nomor: 4,
    id: 'soleram',
    judul: 'Soleram',
    daerah: 'Riau',
    durasi: '2:03',
    sumber: './audio/soleram.mp3'
  },
  {
    nomor: 5,
    id: 'yamko-rambe-yamko',
    judul: 'Yamko Rambe Yamko',
    daerah: 'Papua',
    durasi: '2:06',
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
let volumeSebelumMute = VOLUME_DEFAULT;

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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
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
          <span class="audio-popup-badge">ARSIP AUDIO NUSANTARA</span>
          <h4 class="audio-popup-judul">Lagu Tradisional Daerah</h4>
        </div>
        <button
          type="button"
          class="audio-popup-tutup"
          id="audio-popup-tutup"
          aria-label="Tutup Panel Lagu"
          title="Tutup Panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Kontrol Slider Volume Lembut -->
      <div class="audio-volume-wadah">
        <button
          type="button"
          class="audio-volume-mute-btn"
          id="audio-volume-mute-btn"
          aria-label="Bisukan atau nyalakan suara"
          title="Bisukan / Nyalakan suara"
        >
          <span class="audio-volume-svg-ikon" id="audio-volume-svg-ikon"></span>
        </button>
        <label for="audio-volume-slider" class="sr-only">Volume Backsound</label>
        <input
          type="range"
          id="audio-volume-slider"
          class="audio-volume-slider"
          min="0"
          max="1"
          step="0.01"
          value="${audio.volume}"
          title="Atur Volume Backsound (lembut)"
        />
        <span class="audio-volume-persen" id="audio-volume-persen">${Math.round(audio.volume * 100)}%</span>
      </div>

      <!-- Daftar 5 Lagu Berurutan -->
      <ul class="audio-playlist-list" id="audio-playlist-list" role="list">
        ${DAFTAR_PUTAR_BACKSOUND.map(
          (track, idx) => `
          <li class="audio-playlist-item ${idx === indeksAktif ? 'aktif' : ''} ${statusSedangMemutar && idx === indeksAktif ? 'sedang-putar' : ''}" data-index="${idx}">
            <button type="button" class="audio-track-btn" data-index="${idx}" aria-label="Putar lagu ${track.judul} dari ${track.daerah}">
              <div class="audio-track-status-box">
                <span class="audio-track-nomor">${String(track.nomor).padStart(2, '0')}</span>
                <span class="audio-track-play-icon" aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6 4 20 12 6 20 6 4"></polygon>
                  </svg>
                </span>
                <span class="audio-track-eq" aria-hidden="true">
                  <span class="eq-mini-bar b1"></span>
                  <span class="eq-mini-bar b2"></span>
                  <span class="eq-mini-bar b3"></span>
                </span>
              </div>
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

      <!-- Tombol Akses Ruang Bunyi Nusantara (Gamelan & Angklung) -->
      <div class="audio-popup-ruang-bunyi-wadah" style="padding: 10px 14px 4px;">
        <button
          type="button"
          id="audio-btn-buka-ruang-bunyi"
          class="tombol tombol--utama"
          style="width: 100%; font-size: 0.8rem; padding: 7px 12px; min-height: 38px; display: flex; align-items: center; justify-content: center; gap: 8px;"
          title="Buka Ruang Laras Gamelan & Angklung Virtual"
        >
          <span aria-hidden="true">🪘</span>
          <span>Mainkan Gamelan & Angklung</span>
        </button>
      </div>

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
  const tombolMute = document.getElementById('audio-volume-mute-btn');

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

  const btnBukaRuangBunyi = document.getElementById('audio-btn-buka-ruang-bunyi');
  if (btnBukaRuangBunyi) {
    btnBukaRuangBunyi.addEventListener('click', () => {
      popupEl.setAttribute('hidden', '');
      tombolMenu.setAttribute('aria-expanded', 'false');
      import('../features/karawitan-synth.js').then(({ bukaRuangBunyiModal }) => {
        bukaRuangBunyiModal();
      });
    });
  }

  tombolNext.addEventListener('click', () => {
    putarLaguBerikutnya();
  });

  sliderVolume.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    aturVolumeAudio(v);
  });

  if (tombolMute) {
    tombolMute.addEventListener('click', () => {
      if (audio.volume > 0) {
        volumeSebelumMute = audio.volume;
        aturVolumeAudio(0);
      } else {
        aturVolumeAudio(volumeSebelumMute > 0 ? volumeSebelumMute : VOLUME_DEFAULT);
      }
    });
  }

  // Klik salah satu lagu di daftar putar
  playlistList.addEventListener('click', (e) => {
    const btn = e.target.closest('.audio-track-btn');
    if (btn) {
      const idx = parseInt(btn.dataset.index, 10);
      if (!Number.isNaN(idx)) {
        if (idx === indeksAktif) {
          // Toggle play/pause lagu saat ini
          if (audio.paused) {
            audio.play().catch(() => {});
          } else {
            audio.pause();
          }
        } else {
          putarLaguIndex(idx);
        }
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

  perbaruiSliderVolume(audio.volume);
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
    const adalahAktif = idx === indeksAktif;
    item.classList.toggle('aktif', adalahAktif);
    item.classList.toggle('sedang-putar', adalahAktif && statusSedangMemutar);
  });
}

/**
 * Memperbarui angka persentase volume pada UI slider dan SVG ikon.
 * @param {number} vol
 */
function perbaruiSliderVolume(vol) {
  const slider = document.getElementById('audio-volume-slider');
  const persenEl = document.getElementById('audio-volume-persen');
  const ikonWrap = document.getElementById('audio-volume-svg-ikon');

  if (slider) {
    slider.value = String(vol);
    slider.style.setProperty('--vol-persen', `${Math.round(vol * 100)}%`);
  }
  if (persenEl) persenEl.textContent = `${Math.round(vol * 100)}%`;

  if (ikonWrap) {
    if (vol === 0) {
      ikonWrap.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      `;
    } else if (vol < 0.4) {
      ikonWrap.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
    } else {
      ikonWrap.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      `;
    }
  }
}

// Ekspos global fungsi pembuka Ruang Bunyi Nusantara
if (typeof window !== 'undefined') {
  window.bukaRuangBunyi = () => {
    import('../features/karawitan-synth.js').then(({ bukaRuangBunyiModal }) => {
      bukaRuangBunyiModal();
    });
  };
}

