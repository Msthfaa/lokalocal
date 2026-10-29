/**
 * paspor.js — Logika penyimpanan dan pengelolaan stempel Paspor Budaya (38 Provinsi)
 * Sesuai WEB_SPEC.md Bagian 8.1:
 * - Kunci localStorage: 'atlasbudaya:paspor:v1'
 * - Format JSON: { "13": { "t": 1760000000000, "jenis": "biasa" | "penjaga" } }
 * - Wajib dibungkus try/catch; jika localStorage tidak tersedia/diblokir,
 *   gunakan memori sementara dan laporkan storageTersedia = false.
 */

export const KUNCI_STORAGE_PASPOR = 'atlasbudaya:paspor:v1';

/**
 * Membuat pengelola state Paspor Budaya.
 * @param {object} [opsi]
 * @param {Storage|null} [opsi.storageKustom] - Untuk pengujian unit tanpa window.localStorage
 */
export function buatPengelolaPaspor(opsi = {}) {
  let memoriSementara = {};
  let storageTersedia = true;
  const pendengar = new Set();

  function dapatkanStorage() {
    if (opsi.storageKustom !== undefined) {
      return opsi.storageKustom;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return null;
  }

  function muatDariStorage() {
    try {
      const storage = dapatkanStorage();
      if (!storage) {
        storageTersedia = false;
        return { ...memoriSementara };
      }
      // Uji tulis/baca singkat bila belum teruji
      const raw = storage.getItem(KUNCI_STORAGE_PASPOR);
      if (!raw) {
        memoriSementara = {};
        return {};
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        memoriSementara = { ...parsed };
        return { ...memoriSementara };
      }
      memoriSementara = {};
      return {};
    } catch {
      storageTersedia = false;
      return { ...memoriSementara };
    }
  }

  function simpanKeStorage(dataBaru) {
    memoriSementara = { ...dataBaru };
    try {
      const storage = dapatkanStorage();
      if (!storage) {
        storageTersedia = false;
        return false;
      }
      storage.setItem(KUNCI_STORAGE_PASPOR, JSON.stringify(memoriSementara));
      storageTersedia = true;
      return true;
    } catch {
      storageTersedia = false;
      return false;
    }
  }

  function beritahuPendengar(infoPerubahan = null) {
    const salinan = { ...memoriSementara };
    for (const fn of pendengar) {
      fn(salinan, infoPerubahan);
    }
  }

  // Inisialisasi awal
  muatDariStorage();

  /**
   * Mencatat stempel untuk kode provinsi tertentu.
   * @param {string} kode - Kode 2 digit provinsi ('11' s.d. '96')
   * @param {'biasa'|'penjaga'} [jenis='biasa']
   * @returns {{ baruDitambahkan: boolean, totalStempel: number, baruSelesai38: boolean }}
   */
  function catatStempel(kode, jenis = 'biasa') {
    const k = String(kode || '').trim();
    if (!k) {
      return { baruDitambahkan: false, totalStempel: Object.keys(memoriSementara).length, baruSelesai38: false };
    }

    const jumlahSebelum = Object.keys(memoriSementara).length;
    const sudahAda = Boolean(memoriSementara[k]);

    // Jika sudah ada dengan jenis yang sama, tidak perlu timpa timestamp
    if (sudahAda && memoriSementara[k].jenis === jenis) {
      return {
        baruDitambahkan: false,
        totalStempel: jumlahSebelum,
        baruSelesai38: false
      };
    }

    const dataBaru = {
      ...memoriSementara,
      [k]: {
        t: Date.now(),
        jenis: jenis === 'penjaga' ? 'penjaga' : 'biasa'
      }
    };

    simpanKeStorage(dataBaru);
    const jumlahSesudah = Object.keys(memoriSementara).length;
    const baruDitambahkan = !sudahAda;
    const baruSelesai38 = jumlahSebelum < 38 && jumlahSesudah >= 38;

    if (baruDitambahkan) {
      import('./karawitan-synth.js')
        .then(({ bunyikanGong }) => {
          bunyikanGong(0.9);
        })
        .catch(() => {});
    }

    beritahuPendengar({
      aksi: 'tambah',
      kode: k,
      jenis: dataBaru[k].jenis,
      baruDitambahkan,
      baruSelesai38
    });

    return {
      baruDitambahkan,
      totalStempel: jumlahSesudah,
      baruSelesai38
    };
  }

  /**
   * Menghapus seluruh progres stempel paspor.
   */
  function resetPaspor() {
    memoriSementara = {};
    try {
      const storage = dapatkanStorage();
      if (storage) {
        storage.removeItem(KUNCI_STORAGE_PASPOR);
      }
    } catch {
      storageTersedia = false;
    }
    beritahuPendengar({ aksi: 'reset' });
  }

  function dapatkanSemuaStempel() {
    return { ...memoriSementara };
  }

  function apakahStorageTersedia() {
    return storageTersedia;
  }

  function langganan(fn) {
    if (typeof fn === 'function') {
      pendengar.add(fn);
    }
    return () => pendengar.delete(fn);
  }

  return {
    catatStempel,
    resetPaspor,
    dapatkanSemuaStempel,
    apakahStorageTersedia,
    langganan
  };
}
