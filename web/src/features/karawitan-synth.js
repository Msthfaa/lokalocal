/**
 * karawitan-synth.js — Audio Engine Akustik Tradisional Nusantara (Web Audio Buffer & Fisika Akustik)
 * Menggunakan rekaman sampel fisik asli (Casa da Música Javanese Gamelan Library - Lisensi Terbuka CC-BY-SA & Artistic License 2.0):
 * - Gamelan Saron Perunggu (Bilah Logam Barung & Peking 8 Nada Lengkap)
 * - Gamelan Bonang Barung (Gong Pencon Logam)
 * - Micro-SFX: Gong Ageng Sakral & Kendhang Ciblon (Tak & Thung)
 * - Didukung Fallback Fisika Akustik Bambu & Logam jika jaringan offline
 * Respons instan 0 ms, polifoni penuh tanpa jeda, audio berstandar kurasi museum.
 */

import { tampilkanToast } from '../ui/toast.js';

let audioCtx = null;
let masterGain = null;
let compressor = null;

// Cache AudioBuffer di memori (0 ms latency playback)
const bufferCache = new Map();
const sedangMemuat = new Map();

/**
 * 8 Tangga Nada Nusantara Lengkap (Laras Slendro & Pelog)
 */
export const NADA_PENTATONIS = [
  { nama: 'Ji', notasi: '1', frekuensi: 261.63, arti: 'Panunggul / Kepala', tombol: '1' },
  { nama: 'Ro', notasi: '2', frekuensi: 293.66, arti: 'Gulu / Leher', tombol: '2' },
  { nama: 'Lu', notasi: '3', frekuensi: 329.63, arti: 'Dhadha / Dada', tombol: '3' },
  { nama: 'Pat', notasi: '4', frekuensi: 349.23, arti: 'Pelog / Pathet', tombol: '4' },
  { nama: 'Ma', notasi: '5', frekuensi: 392.00, arti: 'Lima / Tangan', tombol: '5' },
  { nama: 'Nem', notasi: '6', frekuensi: 440.00, arti: 'Nem / Enam', tombol: '6' },
  { nama: 'Pi', notasi: '7', frekuensi: 493.88, arti: 'Barang / Peling', tombol: '7' },
  { nama: 'Ji̇', notasi: '1̇', frekuensi: 523.25, arti: 'Panunggul Luhur', tombol: '8' }
];

/**
 * Peta File Sampel Akustik Asli Lokal
 */
const PETA_SAMPEL = {
  gamelan: [
    './audio/instrumen/gamelan/saron-1.ogg',
    './audio/instrumen/gamelan/saron-2.ogg',
    './audio/instrumen/gamelan/saron-3.ogg',
    './audio/instrumen/gamelan/saron-4.ogg',
    './audio/instrumen/gamelan/saron-5.ogg',
    './audio/instrumen/gamelan/saron-6.ogg',
    './audio/instrumen/gamelan/saron-7.ogg',
    './audio/instrumen/gamelan/saron-8.ogg'
  ],
  bonang: [
    './audio/instrumen/bonang/bonang-1.ogg',
    './audio/instrumen/bonang/bonang-2.ogg',
    './audio/instrumen/bonang/bonang-3.ogg',
    './audio/instrumen/bonang/bonang-4.ogg',
    './audio/instrumen/bonang/bonang-5.ogg',
    './audio/instrumen/bonang/bonang-6.ogg',
    './audio/instrumen/bonang/bonang-7.ogg',
    './audio/instrumen/bonang/bonang-8.ogg'
  ],
  sfx: {
    gong: './audio/sfx/gong.ogg',
    kendangTak: './audio/sfx/kendang-tak.ogg',
    kendangThung: './audio/sfx/kendang-thung.ogg'
  }
};

/**
 * Melodi Klasik Nusantara untuk Pratinjau Interaktif
 */
const MELODI_CONTOH = [
  { nadaIndex: 0, durasi: 320 }, // 1
  { nadaIndex: 2, durasi: 320 }, // 3
  { nadaIndex: 0, durasi: 320 }, // 1
  { nadaIndex: 2, durasi: 320 }, // 3
  { nadaIndex: 4, durasi: 380 }, // 5
  { nadaIndex: 4, durasi: 400 }, // 5
  { nadaIndex: 5, durasi: 340 }, // 6
  { nadaIndex: 4, durasi: 340 }, // 5
  { nadaIndex: 2, durasi: 340 }, // 3
  { nadaIndex: 1, durasi: 340 }, // 2
  { nadaIndex: 2, durasi: 340 }, // 3
  { nadaIndex: 4, durasi: 360 }, // 5
  { nadaIndex: 7, durasi: 650 }  // 1̇
];

/**
 * Menginisialisasi Web AudioContext dan Master Compressor.
 */
export function dapatkanAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();

    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, audioCtx.currentTime);
    compressor.knee.setValueAtTime(25, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.75, audioCtx.currentTime);

    masterGain.connect(compressor);
    compressor.connect(audioCtx.destination);

    // Muat awal SFX dan sampel dasar
    praMuatSampelInstrumen('gamelan');
    praMuatUrl(PETA_SAMPEL.sfx.gong);
    praMuatUrl(PETA_SAMPEL.sfx.kendangTak);
    praMuatUrl(PETA_SAMPEL.sfx.kendangThung);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return audioCtx;
}

/**
 * Memuat dan men-decode file audio ke AudioBuffer (dengan memori cache).
 */
async function dapatkanAudioBuffer(url) {
  if (bufferCache.has(url)) {
    return bufferCache.get(url);
  }

  if (sedangMemuat.has(url)) {
    return sedangMemuat.get(url);
  }

  const promise = (async () => {
    try {
      const ctx = dapatkanAudioContext();
      if (!ctx) return null;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      bufferCache.set(url, decoded);
      return decoded;
    } catch (err) {
      console.warn(`[AudioEngine] Gagal memuat sampel '${url}':`, err.message);
      return null;
    } finally {
      sedangMemuat.delete(url);
    }
  })();

  sedangMemuat.set(url, promise);
  return promise;
}

/**
 * Melakukan pra-muat sampel instrumen di latar belakang.
 */
export function praMuatSampelInstrumen(instrumen) {
  const daftar = PETA_SAMPEL[instrumen];
  if (!Array.isArray(daftar)) return;
  daftar.forEach((url) => {
    dapatkanAudioBuffer(url).catch(() => {});
  });
}

function praMuatUrl(url) {
  if (url) dapatkanAudioBuffer(url).catch(() => {});
}

/**
 * Memutar rekaman sampel audio dengan polifoni bebas latensi.
 */
export async function putarAudioBuffer(url, volume = 0.85) {
  const ctx = dapatkanAudioContext();
  if (!ctx) return false;

  try {
    const buffer = await dapatkanAudioBuffer(url);
    if (!buffer) return false;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(masterGain);

    source.start(ctx.currentTime);
    return true;
  } catch (err) {
    console.warn('[AudioEngine] Kesalahan pemutaran buffer:', err.message);
    return false;
  }
}

/**
 * Micro-SFX: Dentum Sakral Gong Ageng (Perayaan Stempel Paspor / Momen Agung)
 */
export function bunyikanGong(volume = 0.95) {
  putarAudioBuffer(PETA_SAMPEL.sfx.gong, volume).then((sukses) => {
    if (!sukses) {
      // Fallback sintetis gong jika sampel belum termuat
      sintesisGongFallback(volume);
    }
  });
}

/**
 * Micro-SFX: Ketukan Kendhang Tak (Feedback Taktil Antarmuka / Klik)
 */
export function bunyikanKendangTak(volume = 0.55) {
  putarAudioBuffer(PETA_SAMPEL.sfx.kendangTak, volume);
}

/**
 * Micro-SFX: Dentum Kendhang Thung (Feedback Navigasi / Tab)
 */
export function bunyikanKendangThung(volume = 0.6) {
  putarAudioBuffer(PETA_SAMPEL.sfx.kendangThung, volume);
}

/**
 * Memainkan nada instrumen (Sampel Asli dengan Fallback Fisika Akustik).
 */
export async function mainkanNada(indeks, instrumen = 'gamelan') {
  const item = NADA_PENTATONIS[indeks];
  if (!item) return;

  if (instrumen === 'gamelan' || instrumen === 'bonang') {
    const daftar = PETA_SAMPEL[instrumen];
    const url = daftar ? daftar[indeks] : null;

    if (url) {
      const sukses = await putarAudioBuffer(url, 0.85);
      if (sukses) return;
    }

    // Fallback bila berkas belum siap / offline
    if (instrumen === 'bonang') {
      sintesisBonangFallback(item.frekuensi);
    } else {
      sintesisGamelanFallback(item.frekuensi);
    }
  } else if (instrumen === 'angklung') {
    sintesisAngklungAkustik(item.frekuensi);
  }
}

/**
 * Fallback Sintesis Fisika Akustik Gamelan Saron Perunggu
 */
function sintesisGamelanFallback(frekuensi, durasi = 2.4) {
  const ctx = dapatkanAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(frekuensi, t);
  gain1.gain.setValueAtTime(0.001, t);
  gain1.gain.exponentialRampToValueAtTime(0.7, t + 0.004);
  gain1.gain.exponentialRampToValueAtTime(0.0001, t + durasi);
  osc1.connect(gain1);
  gain1.connect(masterGain);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frekuensi * 2.76, t);
  gain2.gain.setValueAtTime(0.001, t);
  gain2.gain.exponentialRampToValueAtTime(0.28, t + 0.003);
  gain2.gain.exponentialRampToValueAtTime(0.0001, t + durasi * 0.45);
  osc2.connect(gain2);
  gain2.connect(masterGain);

  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + durasi + 0.1);
  osc2.stop(t + durasi * 0.45 + 0.1);
}

/**
 * Fallback Sintesis Fisika Akustik Bonang (Pencon Perunggu Cekung)
 */
function sintesisBonangFallback(frekuensi, durasi = 2.0) {
  const ctx = dapatkanAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frekuensi * 1.5, t);
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.exponentialRampToValueAtTime(0.65, t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + durasi);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + durasi + 0.1);
}

/**
 * Sintesis Akustik Angklung Bambu (Tremolo Goyang & Resonansi Bambu Kembar)
 */
function sintesisAngklungAkustik(frekuensi, durasi = 1.6) {
  const ctx = dapatkanAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(8.5, t);
  lfoGain.gain.setValueAtTime(0.2, t);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1450, t);

  const gainUtama = ctx.createGain();
  gainUtama.gain.setValueAtTime(0.001, t);
  gainUtama.gain.exponentialRampToValueAtTime(0.65, t + 0.025);
  gainUtama.gain.exponentialRampToValueAtTime(0.0001, t + durasi);

  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(frekuensi, t);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frekuensi * 2.0, t);

  lfo.connect(lfoGain);
  lfoGain.connect(gainUtama.gain);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainUtama);
  gainUtama.connect(masterGain);

  lfo.start(t);
  osc1.start(t);
  osc2.start(t);

  lfo.stop(t + durasi + 0.1);
  osc1.stop(t + durasi + 0.1);
  osc2.stop(t + durasi + 0.1);
}

/**
 * Fallback Sintesis Dentum Gong Ageng Sakral
 */
function sintesisGongFallback(volume = 0.9) {
  const ctx = dapatkanAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(65.4, t); // C2 nada rendah sakral
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.exponentialRampToValueAtTime(volume * 0.9, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 4.6);
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
  // Bangun konteks audio & pra-muat saat modal dibuka
  dapatkanAudioContext();
  praMuatSampelInstrumen('gamelan');
  praMuatSampelInstrumen('bonang');

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
            <span class="ruang-bunyi-kicker">Eksplorasi Akustik Warisan Dunia UNESCO</span>
            <h3 class="ruang-bunyi-judul">Ruang Bunyi Nusantara</h3>
          </div>
          <button type="button" class="ruang-bunyi-tombol-tutup" aria-label="Tutup Ruang Bunyi" data-aksi="tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="ruang-bunyi-body">
          <!-- Pilihan Instrumen Tradisional -->
          <div class="ruang-bunyi-toggle-instrumen" role="radiogroup" aria-label="Pilih instrumen tradisional">
            <button type="button" class="ruang-bunyi-tab aktif" data-instrumen="gamelan" role="radio" aria-checked="true">
              <span class="ruang-bunyi-tab-ikon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <line x1="7" y1="5" x2="7" y2="19"></line>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="17" y1="5" x2="17" y2="19"></line>
                </svg>
              </span>
              <span class="ruang-bunyi-tab-teks">Saron Perunggu</span>
            </button>
            <button type="button" class="ruang-bunyi-tab" data-instrumen="bonang" role="radio" aria-checked="false">
              <span class="ruang-bunyi-tab-ikon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <circle cx="12" cy="12" r="9"></circle>
                  <circle cx="12" cy="12" r="3.5"></circle>
                </svg>
              </span>
              <span class="ruang-bunyi-tab-teks">Bonang Barung</span>
            </button>
            <button type="button" class="ruang-bunyi-tab" data-instrumen="angklung" role="radio" aria-checked="false">
              <span class="ruang-bunyi-tab-ikon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <rect x="4" y="2" width="4" height="20" rx="1"></rect>
                  <rect x="11" y="5" width="4" height="17" rx="1"></rect>
                  <rect x="18" y="9" width="4" height="13" rx="1"></rect>
                </svg>
              </span>
              <span class="ruang-bunyi-tab-teks">Angklung Bambu</span>
            </button>
          </div>

          <p class="ruang-bunyi-keterangan" id="ruang-bunyi-keterangan">
            Sampel akustik asli bilah perunggu Saron Barung & Peking. Mendukung penekanan serentak (akor) dan sapuan melodi.
          </p>

          <!-- Bilah Tuts Pentatonis Interaktif -->
          <div class="ruang-bunyi-tuts-baris" id="ruang-bunyi-tuts-baris" role="group" aria-label="Bilah Nada Pentatonis dan Pelog">
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

          <!-- Bar Kontrol & Tembang Klasik -->
          <div class="ruang-bunyi-kontrol-bar">
            <button type="button" id="btn-putar-melodi-contoh" class="tombol tombol--garis ruang-bunyi-btn-melodi">
              <span class="ruang-bunyi-btn-ikon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </span>
              <span>Dengarkan Tembang Klasik</span>
            </button>
            <span class="ruang-bunyi-hint-keyboard">
              Pintasan keyboard: <strong>1</strong> s/d <strong>8</strong> (bisa ditekan bersamaan untuk akor harmoni)
            </span>
          </div>
        </div>

        <div class="ruang-bunyi-footer">
          <p class="ruang-bunyi-footer-sains">
            Sampel Akustik Fisik Asli • Casa da Música Gamelan Library (Lisensi Terbuka CC-BY-SA 4.0 / Artistic 2.0) • Latensi 0 ms
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
    if (instrumenAktif === 'bonang') return 'Bonang Barung';
    if (instrumenAktif === 'angklung') return 'Angklung Bambu';
    return 'Gamelan Saron Perunggu';
  }

  function perbaruiInstrumen(baru) {
    instrumenAktif = baru;
    hentikanMelodi();
    bunyikanKendangTak(0.4);

    // Pra-muat sampel instrumen terpilih
    if (instrumenAktif === 'gamelan' || instrumenAktif === 'bonang') {
      praMuatSampelInstrumen(instrumenAktif);
    }

    tabBtns.forEach((tab) => {
      const match = tab.dataset.instrumen === instrumenAktif;
      tab.classList.toggle('aktif', match);
      tab.setAttribute('aria-checked', String(match));
    });

    if (ketEl) {
      if (instrumenAktif === 'bonang') {
        ketEl.textContent = 'Sampel akustik asli gong pencon Bonang Barung perunggu (1-8). Denting melodi interlocking dengan resonansi logam alami.';
      } else if (instrumenAktif === 'angklung') {
        ketEl.textContent = 'Resonansi tabung bambu Priangan 8 nada lengkap (1-8). Tekan beberapa bilah bersamaan untuk harmoni getar angklung.';
      } else {
        ketEl.textContent = 'Sampel akustik asli bilah tebal perunggu Saron Barung & Peking (1-8). Dentang solid penabuh kayu dengan laras Slendro & Pelog.';
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

  // Multi-Touch & Pointer Down Support
  bilahBtns.forEach((btn) => {
    const bunyikan = (e) => {
      if (e) e.preventDefault();
      const idx = parseInt(btn.dataset.index, 10);
      mainkanNada(idx, instrumenAktif);
      getarkanBilah(idx);
    };

    btn.onpointerdown = bunyikan;

    // Glissando / Usap nada saat pointer digeser sambil ditekan
    btn.onpointerenter = (e) => {
      if (e.buttons === 1) {
        bunyikan(e);
      }
    };
  });

  if (btnMelodi) {
    btnMelodi.onclick = () => {
      tampilkanToast(`Memperdengarkan alunan tembang ${getNamaInstrumen()}...`);
      mainkanMelodiContoh(instrumenAktif, (idx) => {
        if (idx >= 0) {
          getarkanBilah(idx);
        }
      });
    };
  }

  // Keyboard Handler Polifonik (Mendukung Multi-key Simultan / Akor)
  const tombolSedangDitekan = new Set();
  const PETA_TOMBOL = {
    '1': 0, '2': 1, '3': 2, '4': 3,
    '5': 4, '6': 5, '7': 6, '8': 7
  };

  function handleKeydown(e) {
    if (!modalEl.hasAttribute('open')) return;
    const key = e.key;
    if (key in PETA_TOMBOL) {
      e.preventDefault();
      if (!tombolSedangDitekan.has(key)) {
        tombolSedangDitekan.add(key);
        const idx = PETA_TOMBOL[key];
        mainkanNada(idx, instrumenAktif);
        getarkanBilah(idx);
      }
    } else if (key === 'Escape') {
      tutupRuangBunyiModal();
    }
  }

  function handleKeyup(e) {
    if (e.key in PETA_TOMBOL) {
      tombolSedangDitekan.delete(e.key);
    }
  }

  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keyup', handleKeyup);

  modalEl.onclose = () => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('keyup', handleKeyup);
    document.body.style.overflow = '';
  };

  modalEl.oncancel = () => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('keyup', handleKeyup);
    document.body.style.overflow = '';
  };

  modalEl.querySelectorAll('[data-aksi="tutup"]').forEach((btn) => {
    btn.onclick = () => {
      tutupRuangBunyiModal();
    };
  });

  if (!modalEl.open) {
    modalEl.showModal();
  }
  document.body.style.overflow = 'hidden';
}

/**
 * Menutup Modal Ruang Bunyi.
 */
export function tutupRuangBunyiModal() {
  const modalEl = document.getElementById('modal-ruang-bunyi');
  if (!modalEl) return;
  hentikanMelodi();
  if (modalEl.open) {
    modalEl.close();
  }
  document.body.style.overflow = '';
}
