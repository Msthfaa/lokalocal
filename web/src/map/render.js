/**
 * render.js — Merender peta SVG 38 provinsi Indonesia
 * Lengkap dengan <pattern> arsir diagonal untuk provinsi belum_tercatat,
 * atribut aksesibilitas (role="button", tabindex="0", aria-label),
 * dan lingkaran hit transparan (hit-circle) untuk provinsi kecil.
 */

import { buatProyeksiIndonesia } from './projection.js';
import { tentukanFillProvinsi, cariJenisDominanProvinsi } from './scales.js';
import { formatAngka } from '../util/format.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Membuat label aksesibel (aria-label) untuk provinsi pada peta.
 * Wajib menyebutkan "belum tercatat di SPKT" untuk provinsi dengan total = 0.
 * @param {object} dataProv
 * @param {string} namaFallback
 */
export function buatAriaLabelProvinsi(dataProv, namaFallback = '') {
  const nama = dataProv?.nama || namaFallback || 'Provinsi';
  if (!dataProv || dataProv.status_data === 'belum_tercatat' || dataProv.total <= 0) {
    return `${nama}, belum tercatat di SPKT`;
  }
  const dom = cariJenisDominanProvinsi(dataProv);
  const infoDom = dom ? `, dominan ${dom.label}` : '';
  return `${nama}, ${formatAngka(dataProv.total)} catatan budaya${infoDom}`;
}

/**
 * Merender elemen <svg> peta Indonesia ke dalam wadah HTML.
 *
 * @param {HTMLElement} wadahEl
 * @param {object} parameter
 * @param {object} parameter.geoProvinsi - GeoJSON 38 provinsi
 * @param {Array} parameter.daftarProvinsi - Isi dari provinsi.json
 * @param {string} [parameter.idUnik] - Akhiran ID untuk menghindari bentrok <pattern>
 * @param {string} [parameter.modeAwal] - 'gelap-awal' | 'jenis-dominan' | 'jumlah'
 * @param {boolean} [parameter.interaktif] - Apakah path bisa difokus/diklik
 * @param {boolean} [parameter.tampilkanTitikCahaya] - Untuk siluet pembuka S1
 */
export function renderPetaSvg(wadahEl, {
  geoProvinsi,
  daftarProvinsi = [],
  idUnik = 'utama',
  modeAwal = 'jumlah',
  interaktif = true,
  tampilkanTitikCahaya = false
}) {
  if (!wadahEl || !geoProvinsi) return null;

  const petaDataProv = new Map(
    daftarProvinsi.map((p) => [String(p.kode), p])
  );
  const maksTotal = daftarProvinsi.reduce(
    (maks, p) => Math.max(maks, Number(p.total || 0)),
    119
  );

  const { lebar, tinggi, metaFitur } = buatProyeksiIndonesia(geoProvinsi);
  const idPolaArsir = `pola-arsir-${idUnik}`;

  wadahEl.textContent = '';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${lebar} ${tinggi}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('peta-svg');
  if (!interaktif) {
    svg.setAttribute('aria-hidden', 'true');
  } else {
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'Peta interaktif 38 provinsi Indonesia berdasarkan catatan budaya SPKT');
  }

  // Defs: Pattern arsir diagonal untuk provinsi belum_tercatat (WEB_SPEC.md 5.4)
  const defs = document.createElementNS(SVG_NS, 'defs');
  const pattern = document.createElementNS(SVG_NS, 'pattern');
  pattern.setAttribute('id', idPolaArsir);
  pattern.setAttribute('width', '8');
  pattern.setAttribute('height', '8');
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  pattern.setAttribute('patternTransform', 'rotate(45)');

  const rectBg = document.createElementNS(SVG_NS, 'rect');
  rectBg.setAttribute('width', '8');
  rectBg.setAttribute('height', '8');
  rectBg.setAttribute('fill', '#1A1512');

  const lineArsir = document.createElementNS(SVG_NS, 'line');
  lineArsir.setAttribute('x1', '0');
  lineArsir.setAttribute('y1', '0');
  lineArsir.setAttribute('x2', '0');
  lineArsir.setAttribute('y2', '8');
  lineArsir.setAttribute('stroke', '#4A3F37');
  lineArsir.setAttribute('stroke-width', '2');

  pattern.append(rectBg, lineArsir);
  defs.appendChild(pattern);
  svg.appendChild(defs);

  // Grup viewport yang bisa di-zoom/pan
  const grupViewport = document.createElementNS(SVG_NS, 'g');
  grupViewport.classList.add('peta-viewport');

  const grupProvinsi = document.createElementNS(SVG_NS, 'g');
  grupProvinsi.classList.add('peta-lapisan-provinsi');

  const grupHitCircle = document.createElementNS(SVG_NS, 'g');
  grupHitCircle.classList.add('peta-lapisan-hit');

  const grupTitikCahaya = document.createElementNS(SVG_NS, 'g');
  grupTitikCahaya.classList.add('peta-lapisan-cahaya');

  for (const item of metaFitur) {
    const dataProv = petaDataProv.get(item.kode) || {
      kode: item.kode,
      nama: item.nama,
      total: 0,
      status_data: 'belum_tercatat'
    };

    const status = dataProv.status_data === 'ada' && dataProv.total > 0 ? 'ada' : 'belum_tercatat';
    const dom = cariJenisDominanProvinsi(dataProv);
    const warnaAwal = tentukanFillProvinsi(dataProv, {
      mode: modeAwal,
      idPolaArsir,
      maksTotal
    });

    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('provinsi-grup');
    g.dataset.kode = item.kode;
    g.dataset.status = status;
    g.dataset.cx = String(item.cx);
    g.dataset.cy = String(item.cy);
    if (dom) {
      g.dataset.jenisDominan = dom.kode;
      g.dataset.warnaDominan = dom.warna;
    }

    const path = document.createElementNS(SVG_NS, 'path');
    path.classList.add('provinsi-path');
    path.setAttribute('d', item.d);
    path.setAttribute('fill', warnaAwal);
    path.dataset.kode = item.kode;
    path.dataset.nama = dataProv.nama || item.nama;
    path.dataset.status = status;
    path.dataset.total = String(dataProv.total || 0);

    if (interaktif) {
      path.setAttribute('role', 'button');
      path.setAttribute('tabindex', '0');
      path.setAttribute('aria-label', buatAriaLabelProvinsi(dataProv, item.nama));
    }

    g.appendChild(path);
    grupProvinsi.appendChild(g);

    // Lingkaran hit transparan untuk provinsi kecil agar mudah disentuh di ponsel (WEB_SPEC.md 5.1)
    if (interaktif && item.butuhHitCircle) {
      const hit = document.createElementNS(SVG_NS, 'circle');
      hit.classList.add('provinsi-hit');
      hit.setAttribute('cx', String(item.cx));
      hit.setAttribute('cy', String(item.cy));
      hit.setAttribute('r', '18');
      hit.setAttribute('fill', 'transparent');
      hit.dataset.kode = item.kode;
      hit.setAttribute('aria-hidden', 'true');
      grupHitCircle.appendChild(hit);
    }

    // Titik cahaya halus di pusat provinsi berdata untuk latar S1 Pembuka
    if (tampilkanTitikCahaya && status === 'ada') {
      const titikLuar = document.createElementNS(SVG_NS, 'circle');
      titikLuar.classList.add('titik-cahaya-halo');
      titikLuar.setAttribute('cx', String(item.cx));
      titikLuar.setAttribute('cy', String(item.cy));
      titikLuar.setAttribute('r', String(Math.min(14, 4 + Math.sqrt(dataProv.total))));
      titikLuar.setAttribute('fill', dom?.warna || '#E6B14A');
      titikLuar.setAttribute('opacity', '0.22');

      const titikInti = document.createElementNS(SVG_NS, 'circle');
      titikInti.classList.add('titik-cahaya-inti');
      titikInti.setAttribute('cx', String(item.cx));
      titikInti.setAttribute('cy', String(item.cy));
      titikInti.setAttribute('r', '2.6');
      titikInti.setAttribute('fill', dom?.warna || '#E6B14A');

      grupTitikCahaya.append(titikLuar, titikInti);
    }
  }

  grupViewport.appendChild(grupProvinsi);
  if (tampilkanTitikCahaya) {
    grupViewport.appendChild(grupTitikCahaya);
  }
  if (interaktif) {
    grupViewport.appendChild(grupHitCircle);
  }
  svg.appendChild(grupViewport);
  wadahEl.appendChild(svg);

  return {
    svg,
    grupViewport,
    grupProvinsi,
    idPolaArsir,
    petaDataProv,
    maksTotal,
    metaFitur
  };
}
