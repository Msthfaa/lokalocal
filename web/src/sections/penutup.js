/**
 * penutup.js — Bagian S8 (Penutup & Ajakan Peduli Dokumentasi Budaya)
 * Sesuai WEB_SPEC.md Bagian 3 (S8).
 */

import { formatAngka } from '../util/format.js';

/**
 * Menginisialisasi bagian S8 Penutup dengan ringkasan progres Paspor pengunjung.
 * @param {object} parameter
 * @param {object} parameter.pengelolaPaspor
 * @param {number} [parameter.totalProvinsi=38]
 */
export function inisialisasiBagianPenutup({ pengelolaPaspor, totalProvinsi = 38 }) {
  const elRingkasanJejak = document.getElementById('s8-ringkasan-jejak');
  if (!elRingkasanJejak || !pengelolaPaspor) return;

  function perbaruiTeksJejak() {
    const stempel = pengelolaPaspor.dapatkanSemuaStempel();
    const jumlah = Object.keys(stempel).length;

    if (jumlah === 0) {
      elRingkasanJejak.textContent =
        'Kamu belum mengumpulkan stempel provinsi di Paspor Budaya. Pilih provinsi di peta Jelajah untuk mulai menelusuri!';
    } else if (jumlah < totalProvinsi) {
      elRingkasanJejak.textContent =
        `Sejauh ini kamu telah menelusuri ${formatAngka(jumlah)} dari ${formatAngka(totalProvinsi)} provinsi di Paspor Budaya. Masih ada ${formatAngka(totalProvinsi - jumlah)} provinsi yang menunggu kamu kunjungi.`;
    } else {
      elRingkasanJejak.textContent =
        `Terima kasih — kamu telah menelusuri seluruh ${formatAngka(totalProvinsi)} provinsi Indonesia di Paspor Budaya.`;
    }
  }

  pengelolaPaspor.langganan(() => {
    perbaruiTeksJejak();
  });

  perbaruiTeksJejak();
}
