/**
 * generate.js — Generator pola SVG deterministik pengganti foto (WEB_SPEC.md Bagian 6.4)
 * Terinspirasi gaya tenun dan batik secara umum; bukan reproduksi motif suku/daerah tertentu.
 * Menghasilkan elemen <svg> ringan (< 2 KB markup per kartu) dengan aria-hidden="true".
 */

import { hashString } from '../util/hash.js';
import { WARNA_JENIS_HEX } from '../map/scales.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Menentukan kunci motif dan warna dari objek rekaman budaya.
 * @param {object} rekaman
 */
export function tentukanMotifRekaman(rekaman) {
  const jenisKode = String(rekaman?.jenis_kode || '').toLowerCase();
  const katKode = String(rekaman?.kategori_kode || '').toUpperCase();

  if (katKode === 'OPK' && WARNA_JENIS_HEX[jenisKode]) {
    return {
      motif: jenisKode,
      warna: WARNA_JENIS_HEX[jenisKode]
    };
  }

  return {
    motif: 'cagar',
    warna: WARNA_JENIS_HEX.cagar
  };
}

function buatElSvg(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

/**
 * Membuat elemen <svg> pola generatif deterministik untuk header kartu / dialog.
 *
 * @param {object} parameter
 * @param {string} parameter.id - ID unik rekaman untuk seed deterministik
 * @param {string} [parameter.jenisKode] - 'kerajinan' | 'seni' | 'lisan' | 'pengetahuan' | 'adat' | 'cagar'
 * @param {string} [parameter.kategoriKode] - 'OPK' | 'CB' | 'LB' | 'SP'
 * @param {number} [parameter.lebar=360]
 * @param {number} [parameter.tinggi=116]
 * @returns {SVGSVGElement}
 */
export function buatPolaKartuSvg({
  id = 'default',
  jenisKode = 'seni',
  kategoriKode = 'OPK',
  lebar = 360,
  tinggi = 116
} = {}) {
  const seed = hashString(id);
  const { motif, warna } = tentukanMotifRekaman({
    jenis_kode: jenisKode,
    kategori_kode: kategoriKode
  });

  // Variasi deterministik dari seed: ukuran ubin (24, 28, 32, 36), rotasi (0 atau 90), dan offset fase
  const ukuranUbin = 24 + (seed % 4) * 4;
  const rotasiPattern = (seed >>> 3) % 2 === 0 ? 0 : 90;
  const offsetX = (seed >>> 5) % ukuranUbin;
  const offsetY = (seed >>> 7) % ukuranUbin;
  const idPattern = `pat-${motif}-${(seed % 99999).toString(36)}`;

  const svg = buatElSvg('svg', {
    viewBox: `0 0 ${lebar} ${tinggi}`,
    preserveAspectRatio: 'xMidYMid slice',
    class: 'pola-kartu-svg',
    'aria-hidden': 'true'
  });

  const defs = buatElSvg('defs');
  const pattern = buatElSvg('pattern', {
    id: idPattern,
    x: offsetX,
    y: offsetY,
    width: ukuranUbin,
    height: ukuranUbin,
    patternUnits: 'userSpaceOnUse',
    patternTransform: `rotate(${rotasiPattern})`
  });

  const m = ukuranUbin / 2;

  if (motif === 'kerajinan') {
    // Belah ketupat berlapis (diamond) pada kisi
    pattern.append(
      buatElSvg('path', {
        d: `M ${m} 2 L ${ukuranUbin - 2} ${m} L ${m} ${ukuranUbin - 2} L 2 ${m} Z`,
        fill: 'none',
        stroke: warna,
        'stroke-width': 1.4,
        'stroke-opacity': 0.52
      }),
      buatElSvg('path', {
        d: `M ${m} ${m - 5} L ${m + 5} ${m} L ${m} ${m + 5} L ${m - 5} ${m} Z`,
        fill: warna,
        'fill-opacity': 0.28
      })
    );
  } else if (motif === 'seni') {
    // Lingkaran bersinggungan membentuk kelopak empat (kawung/bunga)
    pattern.append(
      buatElSvg('circle', {
        cx: m,
        cy: m,
        r: m - 2,
        fill: 'none',
        stroke: warna,
        'stroke-width': 1.3,
        'stroke-opacity': 0.45
      }),
      buatElSvg('circle', {
        cx: 0,
        cy: 0,
        r: m,
        fill: 'none',
        stroke: warna,
        'stroke-width': 1.1,
        'stroke-opacity': 0.3
      }),
      buatElSvg('circle', {
        cx: m,
        cy: m,
        r: 2.5,
        fill: warna,
        'fill-opacity': 0.55
      })
    );
  } else if (motif === 'lisan') {
    // Gelombang / garis bergelombang bertumpuk
    const y1 = Math.round(ukuranUbin * 0.33);
    const y2 = Math.round(ukuranUbin * 0.72);
    pattern.append(
      buatElSvg('path', {
        d: `M 0 ${y1} Q ${m / 2} ${y1 - 6} ${m} ${y1} T ${ukuranUbin} ${y1}`,
        fill: 'none',
        stroke: warna,
        'stroke-width': 1.5,
        'stroke-opacity': 0.55
      }),
      buatElSvg('path', {
        d: `M 0 ${y2} Q ${m / 2} ${y2 - 6} ${m} ${y2} T ${ukuranUbin} ${y2}`,
        fill: 'none',
        stroke: warna,
        'stroke-width': 1.2,
        'stroke-opacity': 0.32
      })
    );
  } else if (motif === 'pengetahuan') {
    // Segitiga berjajar (tumpal)
    pattern.append(
      buatElSvg('path', {
        d: `M 2 ${ukuranUbin - 2} L ${m} 3 L ${ukuranUbin - 2} ${ukuranUbin - 2} Z`,
        fill: 'none',
        stroke: warna,
        'stroke-width': 1.4,
        'stroke-opacity': 0.5
      }),
      buatElSvg('circle', {
        cx: m,
        cy: Math.round(ukuranUbin * 0.62),
        r: 2.2,
        fill: warna,
        'fill-opacity': 0.45
      })
    );
  } else if (motif === 'adat') {
    // Zig-zag / chevron berulang
    const yA = Math.round(ukuranUbin * 0.42);
    const yB = Math.round(ukuranUbin * 0.82);
    pattern.append(
      buatElSvg('path', {
        d: `M 0 ${yA} L ${m} 4 L ${ukuranUbin} ${yA}`,
        fill: 'none',
        stroke: warna,
        'stroke-width': 1.6,
        'stroke-opacity': 0.55
      }),
      buatElSvg('path', {
        d: `M 0 ${yB} L ${m} ${m} L ${ukuranUbin} ${yB}`,
        fill: 'none',
        stroke: warna,
        'stroke-width': 1.2,
        'stroke-opacity': 0.34
      })
    );
  } else {
    // Cagar Budaya: garis tegas bata / persegi bertingkat
    pattern.append(
      buatElSvg('rect', {
        x: 2,
        y: 2,
        width: ukuranUbin - 4,
        height: m - 3,
        fill: 'none',
        stroke: warna,
        'stroke-width': 1.3,
        'stroke-opacity': 0.48
      }),
      buatElSvg('rect', {
        x: 6,
        y: m + 2,
        width: ukuranUbin - 12,
        height: m - 4,
        fill: warna,
        'fill-opacity': 0.22,
        stroke: warna,
        'stroke-width': 1.1,
        'stroke-opacity': 0.4
      })
    );
  }

  defs.appendChild(pattern);
  svg.appendChild(defs);

  // Latar dasar gelap hangat
  svg.appendChild(
    buatElSvg('rect', {
      width: lebar,
      height: tinggi,
      fill: '#191412'
    })
  );

  // Lapisan ubin pola
  svg.appendChild(
    buatElSvg('rect', {
      width: lebar,
      height: tinggi,
      fill: `url(#${idPattern})`
    })
  );

  // Elemen aksen pusat deterministik agar tiap kartu punya titik fokus halus
  const fokusX = Math.round(lebar * 0.72 + ((seed % 40) - 20));
  const fokusY = Math.round(tinggi * 0.5);
  const grupAksen = buatElSvg('g', {
    class: 'pola-kartu-aksen',
    transform: `translate(${fokusX}, ${fokusY})`
  });

  grupAksen.append(
    buatElSvg('circle', {
      r: 34,
      fill: '#14110F',
      'fill-opacity': 0.65,
      stroke: warna,
      'stroke-width': 1.5,
      'stroke-opacity': 0.75
    }),
    buatElSvg('path', {
      d: 'M 0 -18 L 18 0 L 0 18 L -18 0 Z',
      fill: warna,
      'fill-opacity': 0.25,
      stroke: warna,
      'stroke-width': 1.4
    })
  );

  svg.appendChild(grupAksen);
  return svg;
}

/**
 * Membuat elemen <svg> stempel bundar untuk Paspor Budaya (WEB_SPEC.md Bagian 8.1).
 * Menggunakan motif geometris deterministik dari kode provinsi, tanpa lambang/bendera resmi.
 *
 * @param {object} parameter
 * @param {string} parameter.kode - Kode 2 digit provinsi ('11' s.d. '96')
 * @param {string} parameter.nama - Nama provinsi
 * @param {'biasa'|'penjaga'} [parameter.jenis='biasa']
 * @returns {SVGSVGElement}
 */
export function buatStempelProvinsiSvg({ kode = '11', nama = 'Provinsi', jenis = 'biasa' } = {}) {
  const seed = hashString(`stempel-${kode}-${nama}`);
  const daftarWarna = Object.values(WARNA_JENIS_HEX);
  const warnaUtama =
    jenis === 'penjaga' ? '#E6B14A' : daftarWarna[seed % daftarWarna.length] || '#E6B14A';

  const svg = buatElSvg('svg', {
    viewBox: '0 0 80 80',
    class: 'stempel-paspor-svg',
    'aria-hidden': 'true'
  });

  // Lingkaran luar bergerigi halus (stroke-dasharray)
  svg.appendChild(
    buatElSvg('circle', {
      cx: 40,
      cy: 40,
      r: 35,
      fill: '#191412',
      stroke: warnaUtama,
      'stroke-width': 2.5,
      'stroke-dasharray': '4 2.5'
    })
  );

  // Lingkaran cincin dalam
  svg.appendChild(
    buatElSvg('circle', {
      cx: 40,
      cy: 40,
      r: 29,
      fill: 'none',
      stroke: warnaUtama,
      'stroke-width': 1,
      'stroke-opacity': 0.55
    })
  );

  // Ornamen geometris tengah berdasarkan seed
  const varianBentuk = seed % 3;
  if (varianBentuk === 0) {
    svg.appendChild(
      buatElSvg('path', {
        d: 'M 40 16 L 64 40 L 40 64 L 16 40 Z',
        fill: warnaUtama,
        'fill-opacity': 0.16,
        stroke: warnaUtama,
        'stroke-width': 1.2,
        'stroke-opacity': 0.65
      })
    );
  } else if (varianBentuk === 1) {
    svg.appendChild(
      buatElSvg('polygon', {
        points: '40,15 61,52 19,52',
        fill: warnaUtama,
        'fill-opacity': 0.15,
        stroke: warnaUtama,
        'stroke-width': 1.2,
        'stroke-opacity': 0.65
      })
    );
  } else {
    svg.appendChild(
      buatElSvg('rect', {
        x: 23,
        y: 23,
        width: 34,
        height: 34,
        rx: 6,
        fill: warnaUtama,
        'fill-opacity': 0.15,
        stroke: warnaUtama,
        'stroke-width': 1.2,
        'stroke-opacity': 0.65
      })
    );
  }

  // Kode provinsi di tengah
  const teksKode = buatElSvg('text', {
    x: 40,
    y: 44,
    'text-anchor': 'middle',
    fill: '#F4EBDD',
    'font-size': '15',
    'font-weight': '700',
    'font-family': 'Fraunces Variable, Georgia, serif'
  });
  teksKode.textContent = kode;
  svg.appendChild(teksKode);

  // Label kecil di bawah kode ('PENJAGA' atau 'SPKT')
  const teksSub = buatElSvg('text', {
    x: 40,
    y: 57,
    'text-anchor': 'middle',
    fill: warnaUtama,
    'font-size': '6.5',
    'font-weight': '700',
    'letter-spacing': '0.08em'
  });
  teksSub.textContent = jenis === 'penjaga' ? 'PENJAGA' : 'TERCATAT';
  svg.appendChild(teksSub);

  return svg;
}
