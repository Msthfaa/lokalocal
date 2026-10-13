/**
 * geo.js — Utilitas pemrosesan geometri dan poligon untuk Peta 3D
 * - Algoritma Douglas–Peucker untuk simplifikasi poligon tanpa dependensi luar
 * - Konversi cincin poligon GeoJSON ke koordinat 2D bidang (x, z)
 */

/**
 * Menghitung jarak tegak lurus dari titik p ke garis yang dibentuk oleh p1 dan p2.
 * @param {[number, number]} p
 * @param {[number, number]} p1
 * @param {[number, number]} p2
 * @returns {number}
 */
function jarakKeGaris(p, p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const panjangSq = dx * dx + dy * dy;
  if (panjangSq === 0) {
    const ex = p[0] - p1[0];
    const ey = p[1] - p1[1];
    return Math.sqrt(ex * ex + ey * ey);
  }
  const t = Math.max(0, Math.min(1, ((p[0] - p1[0]) * dx + (p[1] - p1[1]) * dy) / panjangSq));
  const projX = p1[0] + t * dx;
  const projY = p1[1] + t * dy;
  const rx = p[0] - projX;
  const ry = p[1] - projY;
  return Math.sqrt(rx * rx + ry * ry);
}

/**
 * Menyederhanakan urutan titik poligon menggunakan algoritma Douglas–Peucker.
 * Menjaga titik awal dan akhir tetap identik (cincin tertutup).
 *
 * @param {Array<[number, number]>} titik - Array koordinat [lng, lat] atau [x, y]
 * @param {number} toleransi - Ambang batas penyederhanaan
 * @returns {Array<[number, number]>}
 */
export function douglasPeucker(titik, toleransi = 0.005) {
  if (!Array.isArray(titik) || titik.length <= 3 || toleransi <= 0) {
    return titik;
  }

  const adalahCincinTertutup =
    titik[0][0] === titik[titik.length - 1][0] &&
    titik[0][1] === titik[titik.length - 1][1];

  function rekursif(pts) {
    if (pts.length <= 2) return pts;

    let jarakMaks = 0;
    let indeksMaks = 0;
    const awal = pts[0];
    const akhir = pts[pts.length - 1];

    for (let i = 1; i < pts.length - 1; i++) {
      const d = jarakKeGaris(pts[i], awal, akhir);
      if (d > jarakMaks) {
        jarakMaks = d;
        indeksMaks = i;
      }
    }

    if (jarakMaks > toleransi) {
      const kiri = rekursif(pts.slice(0, indeksMaks + 1));
      const kanan = rekursif(pts.slice(indeksMaks));
      return kiri.slice(0, kiri.length - 1).concat(kanan);
    }
    return [awal, akhir];
  }

  // Jika cincin tertutup, pisahkan agar tidak tereduksi jadi 2 titik
  if (adalahCincinTertutup) {
    const separuh = Math.floor(titik.length / 2);
    const bagian1 = rekursif(titik.slice(0, separuh + 1));
    const bagian2 = rekursif(titik.slice(separuh));
    return bagian1.slice(0, bagian1.length - 1).concat(bagian2);
  }

  return rekursif(titik);
}

/**
 * Menghitung luas poligon 2D untuk menyaring pulau-pulau di bawah ambang batas minimal.
 * @param {Array<[number, number]>} cincin
 * @returns {number}
 */
export function hitungLuasPoligon(cincin) {
  let luas = 0;
  for (let i = 0; i < cincin.length - 1; i++) {
    luas += cincin[i][0] * cincin[i + 1][1] - cincin[i + 1][0] * cincin[i][1];
  }
  return Math.abs(luas / 2);
}
