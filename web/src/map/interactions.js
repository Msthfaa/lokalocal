/**
 * interactions.js — Interaksi peta SVG: hover tooltip, fokus keyboard, klik, dan zoom sederhana
 * Sesuai WEB_SPEC.md Bagian 5.1 & 5.4.
 */

import { cariJenisDominanProvinsi } from './scales.js';
import { formatAngka } from '../util/format.js';

/**
 * Memasang interaksi hover, fokus, klik, dan keyboard pada peta SVG.
 *
 * @param {object} instansPeta - Hasil kembalian dari renderPetaSvg
 * @param {object} opsi
 * @param {HTMLElement} [opsi.tooltipEl] - Elemen tooltip dalam wadah peta
 * @param {(kode: string, dataProv: object, pemicuEl: Element) => void} [opsi.saatPilihProvinsi]
 */
export function pasangInteraksiPeta(instansPeta, opsi = {}) {
  if (!instansPeta || !instansPeta.svg) return null;

  const { svg, grupProvinsi, petaDataProv } = instansPeta;
  const { tooltipEl, saatPilihProvinsi } = opsi;

  let kodeTerpilih = null;

  function cariPathProvinsi(kode) {
    return grupProvinsi.querySelector(`.provinsi-path[data-kode="${kode}"]`);
  }

  function buatIsiTooltip(dataProv) {
    if (!dataProv) return '';
    if (dataProv.status_data === 'belum_tercatat' || dataProv.total <= 0) {
      return `${dataProv.nama} — Belum tercatat di SPKT`;
    }
    const dom = cariJenisDominanProvinsi(dataProv);
    const ketDom = dom ? ` • Dominan: ${dom.label}` : '';
    return `${dataProv.nama} — ${formatAngka(dataProv.total)} catatan${ketDom}`;
  }

  function tampilkanTooltip(kode, clientX, clientY, fokusElemen = null) {
    if (!tooltipEl) return;
    const dataProv = petaDataProv.get(String(kode));
    if (!dataProv) return;

    tooltipEl.textContent = buatIsiTooltip(dataProv);
    tooltipEl.hidden = false;

    const wadahRect = svg.parentElement?.getBoundingClientRect();
    if (!wadahRect) return;

    let x = clientX - wadahRect.left;
    let y = clientY - wadahRect.top;

    if ((clientX === 0 && clientY === 0) && fokusElemen) {
      const elRect = fokusElemen.getBoundingClientRect();
      x = elRect.left + elRect.width / 2 - wadahRect.left;
      y = elRect.top - wadahRect.top;
    }

    const batasKanan = wadahRect.width - 16;
    const posX = Math.max(16, Math.min(batasKanan, x));
    const posY = Math.max(24, y - 12);

    tooltipEl.style.left = `${posX}px`;
    tooltipEl.style.top = `${posY}px`;
  }

  function sembunyikanTooltip() {
    if (!tooltipEl) return;
    tooltipEl.hidden = true;
  }

  function sorotHover(kode, aktif) {
    const path = cariPathProvinsi(kode);
    if (!path) return;
    path.classList.toggle('is-hover', aktif);
  }

  function pilihProvinsi(kode, pemicuEl = null) {
    kodeTerpilih = kode ? String(kode) : null;
    const semuaPath = grupProvinsi.querySelectorAll('.provinsi-path');

    for (const p of semuaPath) {
      const adalahTarget = kodeTerpilih && p.dataset.kode === kodeTerpilih;
      p.classList.toggle('is-selected', Boolean(adalahTarget));
      p.classList.toggle('is-dimmed-other', Boolean(kodeTerpilih && !adalahTarget));
    }

    if (kodeTerpilih && typeof saatPilihProvinsi === 'function') {
      const dataProv = petaDataProv.get(kodeTerpilih);
      saatPilihProvinsi(kodeTerpilih, dataProv, pemicuEl || cariPathProvinsi(kodeTerpilih));
    }
  }

  // Delegasi pointer & mouse pada SVG (mencakup .provinsi-path dan .provinsi-hit)
  svg.addEventListener('pointermove', (e) => {
    const target = e.target.closest('[data-kode]');
    if (!target) {
      sembunyikanTooltip();
      return;
    }
    const kode = target.dataset.kode;
    tampilkanTooltip(kode, e.clientX, e.clientY, target);
  });

  svg.addEventListener('pointerover', (e) => {
    const target = e.target.closest('[data-kode]');
    if (target) {
      sorotHover(target.dataset.kode, true);
    }
  });

  svg.addEventListener('pointerout', (e) => {
    const target = e.target.closest('[data-kode]');
    if (target) {
      sorotHover(target.dataset.kode, false);
    }
  });

  svg.addEventListener('pointerleave', () => {
    sembunyikanTooltip();
  });

  svg.addEventListener('click', (e) => {
    const target = e.target.closest('[data-kode]');
    if (!target) return;
    const kode = target.dataset.kode;
    pilihProvinsi(kode, cariPathProvinsi(kode));
  });

  // Fokus & tombol keyboard pada .provinsi-path
  svg.addEventListener('focusin', (e) => {
    const target = e.target.closest('.provinsi-path[data-kode]');
    if (!target) return;
    tampilkanTooltip(target.dataset.kode, 0, 0, target);
  });

  svg.addEventListener('focusout', () => {
    sembunyikanTooltip();
  });

  svg.addEventListener('keydown', (e) => {
    const target = e.target.closest('.provinsi-path[data-kode]');
    if (!target) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pilihProvinsi(target.dataset.kode, target);
    }
  });

  return {
    pilihProvinsi,
    dapatkanKodeTerpilih: () => kodeTerpilih
  };
}
