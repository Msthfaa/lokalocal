/**
 * karawitan-synth.js — Sintesis Akustik Fisika Gamelan Perunggu & Angklung Bambu (0 KB Audio File)
 * Menggunakan Web Audio API murni untuk memodelkan getaran inharmonic bilah perunggu
 * dan resonansi tabung bambu pentatonis Jawa/Sunda (Laras Slendro / Pelog).
 * Bebas latensi, bekerja 100% offline, tanpa dependensi pustaka audio eksternal.
 */

import { tampilkanToast } from '../ui/toast.js';

let audioCtx = null;
let masterGain = null;
let compressor = null;

/**
 * Frekuensi Nada Pentatonis Nusantara (Standar Laras Slendro C4 - A4)
 */
export const NADA_PENTATONIS = [
  { nama: 'Ji', notasi: '1', frekuensi: 261.63, arti: 'Panunggul / Kepala', tombol: '1' },
  { nama: 'Ro', notasi: '2', frekuensi: 293.66, arti: 'Gulu / Leher', tombol: '2' },
  { nama: 'Lu', notasi: '3', frekuensi: 329.63, arti: 'Dhadha / Dada', tombol: '3' },
  { nama: 'Ma', notasi: '5', frekuensi: 392.00, arti: 'Lima / Tangan', tombol: '4' },
  { nama: 'Nem', notasi: '6', frekuensi: 440.00, arti: 'Nem / Enam', tombol: '5' }
];

/**
 * Melodi Klasik Nusantara untuk Fitur Pratinjau Otomatis (Gundhul Pacul Intro)
 */
const MELODI_CONTOH = [
  { nadaIndex: 0, durasi: 350 }, // 1
  { nadaIndex: 2, durasi: 350 }, // 3
  { nadaIndex: 0, durasi: 350 }, // 1
  { nadaIndex: 2, durasi: 350 }, // 3
  { nadaIndex: 3, durasi: 400 }, // 5
  { nadaIndex: 3, durasi: 450 }, // 5
  { nadaIndex: 4, durasi: 350 }, // 6
  { nadaIndex: 3, durasi: 350 }, // 5
  { nadaIndex: 2, durasi: 350 }, // 3
  { nadaIndex: 1, durasi: 350 }, // 2
  { nadaIndex: 0, durasi: 600 }  // 1
];

/**
 * Menyiapkan AudioContext pada interaksi pengguna pertama.
 */
function dapatkanAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();

    // Compressor Dinamis untuk Mencegah Distorsi Saat Banyak Nada Dibunyikan
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, audioCtx.currentTime);
    compressor.knee.setValueAtTime(30, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(10, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

    // Master Gain
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.65, audioCtx.currentTime);

    masterGain.connect(compressor);
    compressor.connect(audioCtx.destination);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return audioCtx;
}

/**
 * Membunyikan Nada Gamelan (Resonansi Bilah Logam Perunggu / Metallophone)
 * Model Fisika: Fundamental + 2 Inharmonic Partial Logam (2.76x & 5.40x)
 */
export function bunyikanGamelan(frekuensi, durasi = 2.2) {
  const ctx = dapatkanAudioContext();
  if (!ctx) return;

  const waktuSekarang = ctx.currentTime;

  // 1. Nada Dasar (Fundamental)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(frekuensi, waktuSekarang);

  gain1.gain.setValueAtTime(0.001, waktuSekarang);
  gain1.gain.exponentialRampToValueAtTime(0.7, waktuSekarang + 0.004); // Attack instan
  gain1.gain.exponentialRampToValueAtTime(0.0001, waktuSekarang + durasi);

  osc1.connect(gain1);
  gain1.connect(masterGain);

  // 2. Partial Logam 1 (~2.76x frekuensi bilah perunggu)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frekuensi * 2.76, waktuSekarang);

  gain2.gain.setValueAtTime(0.001, waktuSekarang);
  gain2.gain.exponentialRampToValueAtTime(0.25, waktuSekarang + 0.003);
  gain2.gain.exponentialRampToValueAtTime(0.0001, waktuSekarang + durasi * 0.45); // Luruh lebih cepat

  osc2.connect(gain2);
  gain2.connect(masterGain);

  // 3. Partial Gemerincing Logam 2 (~5.40x frekuensi gemerincing tabuh)
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'triangle';
  osc3.frequency.setValueAtTime(frekuensi * 5.4, waktuSekarang);

  gain3.gain.setValueAtTime(0.001, waktuSekarang);
  gain3.gain.exponentialRampToValueAtTime(0.12, waktuSekarang + 0.002);
  gain3.gain.exponentialRampToValueAtTime(0.0001, waktuSekarang + durasi * 0.22); // Kilau awal cepat luruh

  osc3.connect(gain3);
  gain3.connect(masterGain);

  osc1.start(waktuSekarang);
  osc2.start(waktuSekarang);
  osc3.start(waktuSekarang);

  osc1.stop(waktuSekarang + durasi + 0.1);
  osc2.stop(waktuSekarang + durasi * 0.45 + 0.1);
  osc3.stop(waktuSekarang + durasi * 0.22 + 0.1);
}

/**
 * Membunyikan Nada Angklung (Resonansi Tabung Bambu Ganda Bergetar)
 * Model Fisika: 2 Tabung Bambu Oktaf (f0 & 2*f0) + Tremolo Kocokan Tangan (LFO 8.5 Hz)
 */
export function bunyikanAngklung(frekuensi, durasi = 1.6) {
  const ctx = dapatkanAudioContext();
  if (!ctx) return;

  const waktuSekarang = ctx.currentTime;

  // LFO Modulasi Kocokan Bambu (Tremolo Goyang Angklung ~8.5 Hz)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(8.5, waktuSekarang);
  lfoGain.gain.setValueAtTime(0.18, waktuSekarang);

  // Filter Hangat Bambu (Lowpass 1400 Hz)
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, waktuSekarang);

  // Amplop Suara Bambu
  const gainUtama = ctx.createGain();
  gainUtama.gain.setValueAtTime(0.001, waktuSekarang);
  gainUtama.gain.exponentialRampToValueAtTime(0.65, waktuSekarang + 0.03); // Attack lembut getar bambu
  gainUtama.gain.exponentialRampToValueAtTime(0.0001, waktuSekarang + durasi);

  // Tabung Bambu Bawah (Fundamental)
  const oscTabung1 = ctx.createOscillator();
  oscTabung1.type = 'triangle';
  oscTabung1.frequency.setValueAtTime(frekuensi, waktuSekarang);

  // Tabung Bambu Atas (Oktaf Atas 2x frekuensi)
  const oscTabung2 = ctx.createOscillator();
  oscTabung2.type = 'sine';
  oscTabung2.frequency.setValueAtTime(frekuensi * 2.0, waktuSekarang);

  // Hubungkan LFO ke Gain Utama
  lfo.connect(lfoGain);
  lfoGain.connect(gainUtama.gain);

  oscTabung1.connect(filter);
  oscTabung2.connect(filter);
  filter.connect(gainUtama);
  gainUtama.connect(masterGain);

  lfo.start(waktuSekarang);
  oscTabung1.start(waktuSekarang);
  oscTabung2.start(waktuSekarang);

  lfo.stop(waktuSekarang + durasi + 0.1);
  oscTabung1.stop(waktuSekarang + durasi + 0.1);
  oscTabung2.stop(waktuSekarang + durasi + 0.1);
}

/**
 * Memainkan instrumen berdasarkan indeks nada dan pilihan instrumen.
 */
export function mainkanNada(indeks, instrumen = 'gamelan') {
  const item = NADA_PENTATONIS[indeks];
  if (!item) return;

  if (instrumen === 'angklung') {
    bunyikanAngklung(item.frekuensi);
  } else {
    bunyikanGamelan(item.frekuensi);
  }
}

let timeoutMelodi = [];

/**
 * Memainkan melodi contoh secara berurutan.
 */
export function mainkanMelodiContoh(instrumen = 'gamelan', onNadaAktif = null) {
  hentikanMelodi();
  let delayAkumulasi = 0;

  MELODI_CONTOH.forEach((step, idx) => {
    const tid = setTimeout(() => {
      mainkanNada(step.nadaIndex, instrumen);
      if (typeof onNadaAktif === 'function') {
        onNadaAktif(step.nadaIndex);
      }
      if (idx === MELODI_CONTOH.length - 1) {
        if (typeof onNadaAktif === 'function') {
          setTimeout(() => onNadaAktif(-1), 600);
        }
      }
    }, delayAkumulasi);
    timeoutMelodi.push(tid);
    delayAkumulasi += step.durasi;
  });
}

/**
 * Menghentikan melodi contoh yang sedang berputar.
 */
export function hentikanMelodi() {
  timeoutMelodi.forEach((tid) => clearTimeout(tid));
  timeoutMelodi = [];
}

/**
 * Membuka Modal Interaktif "Ruang Laras Bunyi Nusantara".
 */
export function bukaRuangBunyiModal() {
  let modalEl = document.getElementById('modal-ruang-bunyi');
  if (!modalEl) {
    modalEl = document.createElement('dialog');
    modalEl.id = 'modal-ruang-bunyi';
    modalEl.className = 'ruang-bunyi-dialog';
    modalEl.innerHTML = `
      <div class="ruang-bunyi-backdrop" data-aksi="tutup"></div>
      <div class="ruang-bunyi-wadah" role="dialog" aria-modal="true" aria-label="Ruang Laras Bunyi Nusantara — Gamelan dan Angklung Virtual">
        <div class="ruang-bunyi-header">
          <div class="ruang-bunyi-merek">
            <span class="ruang-bunyi-kicker">Eksplorasi Akustik Warisan UNESCO</span>
            <h3 class="ruang-bunyi-judul">Ruang Bunyi Nusantara</h3>
          </div>
          <button type="button" class="ruang-bunyi-tombol-tutup" aria-label="Tutup Ruang Bunyi" data-aksi="tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="ruang-bunyi-body">
          <!-- Pilihan Instrumen -->
          <div class="ruang-bunyi-toggle-instrumen" role="radiogroup" aria-label="Pilih instrumen tradisional">
            <button type="button" class="ruang-bunyi-tab aktif" data-instrumen="gamelan" role="radio" aria-checked="true">
              <span class="ruang-bunyi-tab-ikon">🪘</span>
              <span class="ruang-bunyi-tab-teks">Gamelan Perunggu (Saron)</span>
            </button>
            <button type="button" class="ruang-bunyi-tab" data-instrumen="angklung" role="radio" aria-checked="false">
              <span class="ruang-bunyi-tab-ikon">🎋</span>
              <span class="ruang-bunyi-tab-teks">Angklung Bambu (Priangan)</span>
            </button>
          </div>

          <p class="ruang-bunyi-keterangan" id="ruang-bunyi-keterangan">
            Resonansi logam perunggu dengan 5 nada pokok laras Slendro. Tekan bilah logam atau gunakan tombol keyboard 1, 2, 3, 4, 5.
          </p>

          <!-- Bilah Tuts Pentatonis Interaktif -->
          <div class="ruang-bunyi-tuts-baris" id="ruang-bunyi-tuts-baris" role="group" aria-label="Bilah Nada Pentatonis">
            ${NADA_PENTATONIS.map((n, idx) => `
              <button
                type="button"
                class="ruang-bunyi-bilah"
                data-index="${idx}"
                aria-label="Nada ${n.notasi} (${n.nama} - ${n.arti})"
                title="Tekan tombol ${n.tombol} di keyboard"
              >
                <span class="ruang-bunyi-bilah-notasi">${n.notasi}</span>
                <span class="ruang-bunyi-bilah-nama">${n.nama}</span>
                <span class="ruang-bunyi-bilah-kbd">${n.tombol}</span>
                <span class="ruang-bunyi-bilah-arti">${n.arti}</span>
              </button>
            `).join('')}
          </div>

          <!-- Bar Aksi Melodi Klasik -->
          <div class="ruang-bunyi-kontrol-bar">
            <button type="button" id="btn-putar-melodi-contoh" class="tombol tombol--garis ruang-bunyi-btn-melodi">
              <span class="ruang-bunyi-btn-ikon">🎵</span>
              <span>Dengarkan Tembang Klasik</span>
            </button>
            <span class="ruang-bunyi-hint-keyboard">
              💡 Pintasan tombol: <strong>1</strong> sampai <strong>5</strong> di keyboard
            </span>
          </div>
        </div>

        <div class="ruang-bunyi-footer">
          <p class="ruang-bunyi-footer-sains">
            Sintesis gelombang fisika akustik murni Web Audio API • 0 KB audio eksternal • Tanpa latensi
          </p>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  let instrumenAktif = 'gamelan';
  const tabBtns = modalEl.querySelectorAll('.ruang-bunyi-tab');
  const ketEl = modalEl.querySelector('#ruang-bunyi-keterangan');
  const bilahBtns = modalEl.querySelectorAll('.ruang-bunyi-bilah');
  const btnMelodi = modalEl.querySelector('#btn-putar-melodi-contoh');

  function getNamaInstrumen() {
    return instrumenAktif === 'angklung' ? 'Angklung Bambu' : 'Gamelan Perunggu';
  }

  function perbaruiInstrumen(baru) {
    instrumenAktif = baru;
    hentikanMelodi();
    tabBtns.forEach((tab) => {
      const match = tab.dataset.instrumen === instrumenAktif;
      tab.classList.toggle('aktif', match);
      tab.setAttribute('aria-checked', String(match));
    });

    if (ketEl) {
      if (instrumenAktif === 'angklung') {
        ketEl.textContent = 'Resonansi getaran tabung bambu kembar Priangan berlaras pentatonis. Tekan tabung atau tombol 1-5 di keyboard.';
      } else {
        ketEl.textContent = 'Resonansi logam perunggu dengan 5 nada pokok laras Slendro. Tekan bilah perunggu atau tombol 1-5 di keyboard.';
      }
    }
  }

  tabBtns.forEach((tab) => {
    tab.onclick = () => {
      perbaruiInstrumen(tab.dataset.instrumen);
    };
  });

  function getarkanBilah(idx) {
    const btn = bilahBtns[idx];
    if (btn) {
      btn.classList.add('sedang-bergetar');
      setTimeout(() => btn.classList.remove('sedang-bergetar'), 280);
    }
  }

  bilahBtns.forEach((btn) => {
    const memicu = () => {
      const idx = parseInt(btn.dataset.index, 10);
      mainkanNada(idx, instrumenAktif);
      getarkanBilah(idx);
    };
    btn.onclick = memicu;
    btn.onpointerdown = (e) => {
      if (e.pointerType === 'touch') memicu();
    };
  });

  if (btnMelodi) {
    btnMelodi.onclick = () => {
      tampilkanToast(`Memperdengarkan alunan tembang ${getNamaInstrumen()}... 🎶`);
      mainkanMelodiContoh(instrumenAktif, (idx) => {
        if (idx >= 0) {
          getarkanBilah(idx);
        }
      });
    };
  }

  // Keyboard Handler Khusus saat Modal Terbuka
  function handleKeydown(e) {
    if (!modalEl.hasAttribute('open')) return;
    const key = e.key;
    if (['1', '2', '3', '4', '5'].includes(key)) {
      e.preventDefault();
      const idx = parseInt(key, 10) - 1;
      mainkanNada(idx, instrumenAktif);
      getarkanBilah(idx);
    } else if (key === 'Escape') {
      tutupRuangBunyiModal();
    }
  }

  window.addEventListener('keydown', handleKeydown);

  // Event Tutup
  modalEl.querySelectorAll('[data-aksi="tutup"]').forEach((btn) => {
    btn.onclick = () => {
      tutupRuangBunyiModal();
    };
  });

  modalEl.showModal();
  modalEl.setAttribute('open', '');
  document.body.style.overflow = 'hidden';
}

/**
 * Menutup Modal Ruang Bunyi.
 */
export function tutupRuangBunyiModal() {
  const modalEl = document.getElementById('modal-ruang-bunyi');
  if (!modalEl) return;
  hentikanMelodi();
  modalEl.removeAttribute('open');
  modalEl.close();
  document.body.style.overflow = '';
}
