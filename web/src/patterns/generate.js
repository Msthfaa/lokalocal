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
 * Peta Nomor Urut Resmi 38 Provinsi Nusantara (No. 1 - 38).
 * Menghindari kebingungan kode wilayah Kemendagri/BPS (11 s.d. 96) di tampilan antarmuka.
 */
export const URUTAN_PROVINSI_KODE = {
  '11': 1,  '12': 2,  '13': 3,  '14': 4,  '15': 5,
  '16': 6,  '17': 7,  '18': 8,  '19': 9,  '21': 10,
  '31': 11, '32': 12, '33': 13, '34': 14, '35': 15, '36': 16,
  '51': 17, '52': 18, '53': 19,
  '61': 20, '62': 21, '63': 22, '64': 23, '65': 24,
  '71': 25, '72': 26, '73': 27, '74': 28, '75': 29, '76': 30,
  '81': 31, '82': 32,
  '91': 33, '92': 34, '93': 35, '94': 36, '95': 37, '96': 38
};

export const DATA_IKON_PROVINSI = {
  '11': {
    nama: 'Aceh',
    ikon: 'Rencong Pusaka',
    labelBanner: 'RENCONG',
    path: 'M32 48 C34 44 38 41 41 37 C43 34 44 30 42 26 C45 27 47 30 46 35 C44 40 39 44 36 48 Z M42 26 L46 21 L50 24 L46 28 Z'
  },
  '12': {
    nama: 'Sumatera Utara',
    ikon: 'Rumah Bolon',
    labelBanner: 'RUMAH BOLON',
    path: 'M25 36 C32 30 48 30 55 36 L51 40 L53 50 L49 50 L49 44 L31 44 L31 50 L27 50 L29 40 Z M35 40 L45 40 L40 33 Z'
  },
  '13': {
    nama: 'Sumatera Barat',
    ikon: 'Rumah Gadang',
    labelBanner: 'RUMAH GADANG',
    path: 'M23 28 C26 37 32 39 37 40 C38 34 39 30 40 27 C41 30 42 34 43 40 C48 39 54 37 57 28 C54 42 47 43 40 43 C33 43 26 42 23 28 Z M30 43 L32 51 L48 51 L50 43 Z'
  },
  '14': {
    nama: 'Riau',
    ikon: 'Lancang Kuning',
    labelBanner: 'LANCANG KUNING',
    path: 'M24 44 C32 50 48 50 56 44 L54 48 C46 52 34 52 26 48 Z M40 24 L40 44 M40 26 L49 36 L40 38 Z M40 28 L33 37 L40 38 Z'
  },
  '15': {
    nama: 'Jambi',
    ikon: 'Gentala Arasy',
    labelBanner: 'GENTALA ARASY',
    path: 'M38 22 C38 20 42 20 42 22 L44 30 L44 50 L36 50 L36 30 Z M38 32 H42 V36 H38 Z M32 46 L48 46 M28 50 L52 50'
  },
  '16': {
    nama: 'Sumatera Selatan',
    ikon: 'Jembatan Ampera',
    labelBanner: 'AMPERA',
    path: 'M31 24 H35 V50 H31 Z M45 24 H49 V50 H45 Z M23 43 L31 34 M49 34 L57 43 M31 30 H49 M21 45 H59 V47 H21 Z'
  },
  '17': {
    nama: 'Bengkulu',
    ikon: 'Bunga Rafflesia',
    labelBanner: 'RAFFLESIA',
    path: 'M40 31 C40 24 46 24 46 31 C52 29 54 35 48 38 C52 43 48 47 43 44 C40 50 34 48 36 42 C30 41 30 34 36 33 C35 27 40 26 40 31 Z M40 36 A2.5 2.5 0 1 0 40 41 A2.5 2.5 0 1 0 40 36 Z'
  },
  '18': {
    nama: 'Lampung',
    ikon: 'Siger Lampung',
    labelBanner: 'SIGER',
    path: 'M23 46 C25 38 28 32 31 36 C33 30 36 26 40 22 C44 26 47 30 49 36 C52 32 55 38 57 46 L53 48 C49 46 45 45 40 45 C35 45 31 46 27 48 Z'
  },
  '19': {
    nama: 'Kepulauan Bangka Belitung',
    ikon: 'Mercusuar Lengkuas',
    labelBanner: 'LENGKUAS',
    path: 'M38 22 H42 L43 26 H37 Z M37 26 H43 L45 48 H35 Z M32 50 C35 47 45 47 48 50 Z M35 32 H45 M36 38 H44 M36 44 H44'
  },
  '21': {
    nama: 'Kepulauan Riau',
    ikon: 'Tanjak Melayu',
    labelBanner: 'TANJAK',
    path: 'M25 46 C29 44 35 42 40 42 C45 42 51 44 55 46 L53 50 C47 48 33 48 27 50 Z M35 42 L40 23 L47 42 C44 39 40 38 35 42 Z'
  },
  '31': {
    nama: 'DKI Jakarta',
    ikon: 'Tugu Monas',
    labelBanner: 'MONAS',
    path: 'M39 22 C38 20 42 20 41 22 C42 24 42 26 40 27 C38 26 38 24 39 22 Z M39 28 H41 L42 43 H38 Z M31 43 L34 46 H46 L49 43 Z M29 47 H51 V50 H29 Z'
  },
  '32': {
    nama: 'Jawa Barat',
    ikon: 'Kujang Pasundan',
    labelBanner: 'KUJANG',
    path: 'M35 50 C37 44 35 40 37 36 C39 32 45 30 44 24 C41 29 38 29 37 34 C34 30 31 34 33 40 C31 44 33 48 35 50 Z M40 32 A1 1 0 1 0 40 34 A1 1 0 1 0 40 32 Z M38 37 A1 1 0 1 0 38 39 A1 1 0 1 0 38 37 Z M36 42 A1 1 0 1 0 36 44 A1 1 0 1 0 36 42 Z'
  },
  '33': {
    nama: 'Jawa Tengah',
    ikon: 'Candi Borobudur',
    labelBanner: 'BOROBUDUR',
    path: 'M39 21 H41 V25 H39 Z M35 32 C35 26 45 26 45 32 Z M29 40 C29 33 51 33 51 40 Z M24 45 H56 V47 H24 Z M22 48 H58 V50 H22 Z M33 40 V44 M40 40 V44 M47 40 V44'
  },
  '34': {
    nama: 'DI Yogyakarta',
    ikon: 'Gunungan Keraton',
    labelBanner: 'GUNUNGAN',
    path: 'M40 20 C48 28 52 36 48 46 L40 47 L32 46 C28 36 32 28 40 20 Z M40 47 V51 M36 51 H44 M40 28 V44 M36 34 L40 38 L44 34 M35 40 L40 43 L45 40'
  },
  '35': {
    nama: 'Jawa Timur',
    ikon: 'Singo Barong Reog',
    labelBanner: 'REOG',
    path: 'M40 20 C48 20 55 26 55 35 C51 33 48 34 46 38 C44 36 42 36 40 38 C38 36 36 36 34 38 C32 34 29 33 25 35 C25 26 32 20 40 20 Z M33 42 H47 L44 49 H36 Z M37 43 A1.5 1.5 0 1 0 37 46 M43 43 A1.5 1.5 0 1 0 43 46'
  },
  '36': {
    nama: 'Banten',
    ikon: 'Badak Bercula',
    labelBanner: 'BADAK BANTEN',
    path: 'M25 42 C27 36 33 34 39 35 C41 30 43 30 44 34 C48 35 53 39 53 44 C51 46 47 47 43 46 L41 50 H31 L32 45 C28 46 26 44 25 42 Z M43 32 L45 28 L46 32 Z'
  },
  '51': {
    nama: 'Bali',
    ikon: 'Gapura Candi Bentar',
    labelBanner: 'CANDI BENTAR',
    path: 'M25 50 V36 L29 34 V30 L33 28 V24 L37 22 V50 Z M55 50 V36 L51 34 V30 L47 28 V24 L43 22 V50 Z M23 50 H57 V52 H23 Z'
  },
  '52': {
    nama: 'Nusa Tenggara Barat',
    ikon: 'Lumbung Sasak',
    labelBanner: 'LUMBUNG SASAK',
    path: 'M26 38 C26 26 54 26 54 38 L51 40 L52 50 L48 50 L48 45 L32 45 L32 50 L28 50 L29 40 Z M33 40 H47 V43 H33 Z'
  },
  '53': {
    nama: 'Nusa Tenggara Timur',
    ikon: 'Mbaru Niang',
    labelBanner: 'MBARU NIANG',
    path: 'M40 21 L56 47 H24 Z M40 21 V18 M38 18 H42 M31 47 L34 51 H46 L49 47 Z M38 43 H42 V47 H38 Z'
  },
  '61': {
    nama: 'Kalimantan Barat',
    ikon: 'Tugu Khatulistiwa',
    labelBanner: 'EQUATOR',
    path: 'M31 24 H34 V50 H31 Z M46 24 H49 V50 H46 Z M24 37 C24 30 56 30 56 37 C56 44 24 44 24 37 Z M21 39 L59 35'
  },
  '62': {
    nama: 'Kalimantan Tengah',
    ikon: 'Talawang Dayak',
    labelBanner: 'TALAWANG',
    path: 'M40 20 L49 28 V44 L40 51 L31 44 V28 Z M40 24 V47 M34 32 L40 36 L46 32 M34 42 L40 39 L46 42'
  },
  '63': {
    nama: 'Kalimantan Selatan',
    ikon: 'Bubungan Tinggi',
    labelBanner: 'RUMAH BANJAR',
    path: 'M40 21 L48 33 L55 42 L49 43 L49 50 H31 L31 43 L25 42 L32 33 Z M36 43 H44 V48 H36 Z'
  },
  '64': {
    nama: 'Kalimantan Timur',
    ikon: 'Burung Enggang',
    labelBanner: 'ENGGANG',
    path: 'M29 44 C33 38 39 36 45 37 C50 32 55 30 57 33 C51 36 47 40 45 45 C39 48 33 48 29 44 Z M43 33 C44 28 50 26 52 30 Z M48 37 A1 1 0 1 0 48 39 A1 1 0 1 0 48 37 Z'
  },
  '65': {
    nama: 'Kalimantan Utara',
    ikon: 'Rumah Baloy',
    labelBanner: 'RUMAH BALOY',
    path: 'M25 34 L40 24 L55 34 L51 36 L52 50 H48 L48 44 H32 L32 50 H28 L29 36 Z M34 36 H46 V41 H34 Z'
  },
  '71': {
    nama: 'Sulawesi Utara',
    ikon: 'Rumah Woloan',
    labelBanner: 'RUMAH WOLOAN',
    path: 'M25 34 L40 24 L55 34 L51 37 V44 H29 V37 Z M30 44 L26 51 H30 L33 44 M50 44 L54 51 H50 L47 44 M36 36 H44 V41 H36 Z'
  },
  '72': {
    nama: 'Sulawesi Tengah',
    ikon: 'Megalit Bada',
    labelBanner: 'MEGALIT BADA',
    path: 'M32 26 C32 22 48 22 48 26 L47 49 C47 51 33 51 33 49 Z M35 32 A2 2 0 1 0 35 36 A2 2 0 1 0 35 32 Z M45 32 A2 2 0 1 0 45 36 A2 2 0 1 0 45 32 Z M40 37 V42 M36 44 H44'
  },
  '73': {
    nama: 'Sulawesi Selatan',
    ikon: 'Tongkonan Toraja',
    labelBanner: 'TONGKONAN',
    path: 'M22 24 C27 37 33 41 40 42 C47 41 53 37 58 24 C54 43 48 46 40 46 C32 46 26 43 22 24 Z M32 46 L34 51 H46 L48 46 Z'
  },
  '74': {
    nama: 'Sulawesi Tenggara',
    ikon: 'Benteng Buton',
    labelBanner: 'BENTENG BUTON',
    path: 'M24 50 V34 H29 V38 H34 V34 H40 V38 H46 V34 H51 V38 H56 V50 Z M35 50 V42 C35 40 45 40 45 42 V50 Z'
  },
  '75': {
    nama: 'Gorontalo',
    ikon: 'Rumah Dulohupa',
    labelBanner: 'DULOHUPA',
    path: 'M25 36 L40 26 L55 36 L52 38 V50 H48 V45 H32 V50 H28 V38 Z M33 30 L40 26 L47 30 M35 39 H45 V44 H35 Z'
  },
  '76': {
    nama: 'Sulawesi Barat',
    ikon: 'Perahu Sandeq',
    labelBanner: 'PERAHU SANDEQ',
    path: 'M25 46 C33 51 47 51 55 46 L53 49 C45 52 35 52 27 49 Z M41 22 V46 M41 24 L57 44 H41 Z M23 41 H57'
  },
  '81': {
    nama: 'Maluku',
    ikon: 'Baileo Maluku',
    labelBanner: 'BAILEO',
    path: 'M24 32 L40 22 L56 32 L52 35 V50 H48 V44 H32 V50 H28 V35 Z M30 40 H50 M34 44 V50 M46 44 V50'
  },
  '82': {
    nama: 'Maluku Utara',
    ikon: 'Kedaton Ternate',
    labelBanner: 'KEDATON',
    path: 'M26 39 L40 29 L54 39 L51 42 V50 H29 V42 Z M34 27 L40 23 L46 27 M35 42 H45 V50 H35 Z'
  },
  '91': {
    nama: 'Papua',
    ikon: 'Honai & Tifa',
    labelBanner: 'HONAI & TIFA',
    path: 'M25 38 C25 26 45 26 45 38 L43 50 H27 Z M33 44 H37 V50 H33 Z M47 36 L53 32 V46 L47 42 Z M47 36 L53 42 M47 42 L53 36'
  },
  '92': {
    nama: 'Papua Barat',
    ikon: 'Rumah Kaki Seribu',
    labelBanner: 'KAKI SERIBU',
    path: 'M27 33 L40 25 L53 33 L50 40 H30 Z M30 40 L28 50 M34 40 L33 50 M38 40 L38 50 M42 40 L42 50 M46 40 L47 50 M35 34 H45 V38 H35 Z'
  },
  '93': {
    nama: 'Papua Selatan',
    ikon: 'Ukiran Asmat',
    labelBanner: 'ASMAT',
    path: 'M36 20 H44 V26 C46 28 46 32 44 34 C46 36 46 40 44 42 V51 H36 V42 C34 40 34 36 36 34 C34 32 34 28 36 26 Z M38 23 H42 M38 31 H42 M38 39 H42 M38 47 H42'
  },
  '94': {
    nama: 'Papua Tengah',
    ikon: 'Tas Noken',
    labelBanner: 'NOKEN PAPUA',
    path: 'M31 24 C31 20 49 20 49 24 L49 33 C49 46 31 46 31 33 Z M33 33 C33 42 47 42 47 33 Z M34 36 H46 M35 40 H45'
  },
  '95': {
    nama: 'Papua Pegunungan',
    ikon: 'Honai Baliem',
    labelBanner: 'HONAI BALIEM',
    path: 'M25 37 C25 24 55 24 55 37 L52 50 H28 Z M35 44 H45 V50 H35 Z M32 37 C35 34 45 34 48 37'
  },
  '96': {
    nama: 'Papua Barat Daya',
    ikon: 'Karst Raja Ampat',
    labelBanner: 'RAJA AMPAT',
    path: 'M22 44 C22 36 30 34 32 44 C34 34 42 32 44 44 C46 36 54 36 56 44 Z M19 47 C29 44 49 44 59 47 M21 50 C31 48 47 48 57 50'
  }
};

/**
 * Membuat elemen <svg> stempel bulat khas untuk paspor (WEB_SPEC.md Bagian 8.1 & 7.2)
 * Menampilkan ikon budaya khas daerah spesifik (Rencong, Borobudur, Gadang, Reog, Monas, dll.)
 *
 * @param {object} parameter
 * @param {string} parameter.kode - Kode 2 digit provinsi
 * @param {string} parameter.nama - Nama provinsi
 * @param {'biasa'|'penjaga'} [parameter.jenis='biasa']
 * @returns {SVGSVGElement}
 */
export function buatStempelProvinsiSvg({ kode = '11', nama = 'Provinsi', nomorUrut = null, jenis = 'biasa' } = {}) {
  const infoIkon = DATA_IKON_PROVINSI[kode] || {
    nama: nama,
    ikon: 'Warisan Budaya',
    labelBanner: 'BUDAYA',
    path: 'M40 22 L52 36 L40 50 L28 36 Z'
  };

  const seed = hashString(`stempel-${kode}-${nama}`);
  const daftarWarna = Object.values(WARNA_JENIS_HEX);
  const warnaUtama =
    jenis === 'penjaga' ? '#E6B14A' : daftarWarna[seed % daftarWarna.length] || '#E6B14A';

  const noUrut = nomorUrut != null ? nomorUrut : (URUTAN_PROVINSI_KODE[kode] || 1);
  const noTampil = String(noUrut).padStart(2, '0');

  const svg = buatElSvg('svg', {
    viewBox: '0 0 80 80',
    class: 'stempel-paspor-svg',
    'aria-hidden': 'true'
  });

  // 1. Lingkaran luar berstempel pos resmi (gerigi stempel tinta)
  svg.appendChild(
    buatElSvg('circle', {
      cx: 40,
      cy: 40,
      r: 36,
      fill: '#181310',
      stroke: warnaUtama,
      'stroke-width': 2.4,
      'stroke-dasharray': '5 2.5'
    })
  );

  // 2. Lingkaran cincin dalam tipis
  svg.appendChild(
    buatElSvg('circle', {
      cx: 40,
      cy: 40,
      r: 31,
      fill: 'none',
      stroke: warnaUtama,
      'stroke-width': 1,
      'stroke-opacity': 0.65
    })
  );

  // 3. Ikon Budaya Khas Daerah (Silhouette Vektor Budaya Spesifik)
  svg.appendChild(
    buatElSvg('path', {
      d: infoIkon.path,
      fill: warnaUtama,
      'fill-opacity': 0.38,
      stroke: warnaUtama,
      'stroke-width': 1.6,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    })
  );

  // 4. Pita / Banner Nama Ikon Khas di Bawah
  svg.appendChild(
    buatElSvg('rect', {
      x: 13,
      y: 56,
      width: 54,
      height: 13,
      rx: 3.5,
      fill: warnaUtama,
      'fill-opacity': 0.94
    })
  );

  const teksIkon = buatElSvg('text', {
    x: 40,
    y: 65,
    'text-anchor': 'middle',
    fill: '#14110F',
    'font-size': '6.4',
    'font-weight': '900',
    'letter-spacing': '0.04em',
    'font-family': 'Plus Jakarta Sans Variable, sans-serif'
  });
  teksIkon.textContent = infoIkon.labelBanner;
  svg.appendChild(teksIkon);

  // 5. Label Kode Wilayah di Bagian Atas
  const teksKode = buatElSvg('text', {
    x: 40,
    y: 18,
    'text-anchor': 'middle',
    fill: warnaUtama,
    'font-size': '7.5',
    'font-weight': '800',
    'letter-spacing': '0.08em',
    'font-family': 'Fraunces Variable, serif'
  });
  teksKode.textContent = `★ ${noTampil} ★`;
  svg.appendChild(teksKode);

  return svg;
}

