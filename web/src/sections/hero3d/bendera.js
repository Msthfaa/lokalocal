/**
 * bendera.js — Komponen Tiang & Bendera Detail Provinsi 3D
 * Menancap di atas provinsi yang diklik/dipilih dan menampilkan informasi budaya lengkap,
 * rincian OPK, kabupaten kontributor, serta contoh karya budaya nyata.
 */

import {
  Group,
  Mesh,
  CylinderGeometry,
  OctahedronGeometry,
  TorusGeometry,
  Shape,
  ExtrudeGeometry,
  MeshStandardMaterial,
  Vector3
} from 'three';
import { WARNA_JENIS_HEX } from '../../map/scales.js';
import { formatAngka } from '../../util/format.js';
import { KETEBALAN_EXTRUDE } from './build-provinces.js';
import { ikonPaspor, ikonCentang } from '../../ui/ikon.js';
import { KUNCI_STORAGE_PASPOR } from '../../features/paspor.js';

function apakahSudahStempelDiStorage(kode) {
  if (!kode) return false;
  const k = String(kode).trim();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(KUNCI_STORAGE_PASPOR);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed[k]) {
          return true;
        }
      }
    }
  } catch {}
  return false;
}

/**
 * Membuat pengontrol penanda kristal diorama 3D dan kartu popover
 *
 * @param {object} parameter
 * @param {THREE.Scene} parameter.scene
 * @param {THREE.Group} [parameter.grupUtama]
 * @param {THREE.Camera} parameter.camera
 * @param {HTMLElement} parameter.wadahEl - Wadah elemen canvas
 * @param {(kode: string) => void} [parameter.onJelajahiProvinsi]
 * @param {(rekaman: object, pemicuEl: HTMLElement) => void} [parameter.onBukaDetailRekaman]
 * @param {(kode: string, jenis: string) => void} [parameter.onCatatStempel]
 * @param {(kode: string) => Array} [parameter.ambilBudayaProvinsi]
 * @returns {object} API kontrol bendera/penanda
 */
export function buatPengontrolBendera({
  scene,
  grupUtama,
  camera,
  wadahEl,
  tampilkanOverlayDOM = false,
  onJelajahiProvinsi,
  onBukaDetailRekaman,
  onCatatStempel,
  ambilBudayaProvinsi
}) {
  // 1. Objek 3D Penanda: Beacon Kristal Emas & Cincin Riak Daratan
  const grupTiang = new Group();
  grupTiang.name = 'penanda-kristal-diorama';
  grupTiang.visible = false;

  // Dasar Cincin Riak Penanda di Permukaan Tanah (Menyatu dengan Daratan Pulau)
  const riakGeo = new TorusGeometry(0.12, 0.009, 8, 24);
  riakGeo.rotateX(Math.PI / 2);
  const riakMat = new MeshStandardMaterial({
    color: 0xFFC94A,
    emissive: 0xFFA826,
    emissiveIntensity: 0.85,
    roughness: 0.25,
    metalness: 0.7,
    transparent: true,
    opacity: 0.9
  });
  const riakMesh = new Mesh(riakGeo, riakMat);
  riakMesh.position.y = 0.006;
  grupTiang.add(riakMesh);

  // Jarum Tiang Emas Ramping & Ringkas (Tinggi proporsional 0.44 unit)
  const tiangGeo = new CylinderGeometry(0.013, 0.018, 0.44, 12);
  const tiangMat = new MeshStandardMaterial({
    color: 0xE8BA4D,
    roughness: 0.22,
    metalness: 0.85
  });
  const tiangMesh = new Mesh(tiangGeo, tiangMat);
  tiangMesh.position.y = 0.22;
  grupTiang.add(tiangMesh);

  // Puncak Permata Kristal 3D Octahedron Emas yang Berputar
  const kristalGeo = new OctahedronGeometry(0.065, 0);
  const kristalMat = new MeshStandardMaterial({
    color: 0xFFD255,
    emissive: 0xE89828,
    emissiveIntensity: 0.75,
    roughness: 0.18,
    metalness: 0.8
  });
  const kristalMesh = new Mesh(kristalGeo, kristalMat);
  kristalMesh.position.y = 0.46;
  grupTiang.add(kristalMesh);

  // Panji Segitiga Mini (Pennant Ribbon)
  const panjiShape = new Shape();
  panjiShape.moveTo(0, 0);
  panjiShape.lineTo(0.18, -0.05);
  panjiShape.lineTo(0, -0.10);
  panjiShape.closePath();
  const panjiGeo = new ExtrudeGeometry(panjiShape, {
    depth: 0.01,
    bevelEnabled: false
  });
  const panjiMat = new MeshStandardMaterial({
    color: 0xC85A32,
    roughness: 0.4,
    metalness: 0.15
  });
  const panjiMesh = new Mesh(panjiGeo, panjiMat);
  panjiMesh.position.set(0.014, 0.44, 0);
  grupTiang.add(panjiMesh);

  (grupUtama || scene).add(grupTiang);

  // 2. Elemen DOM Overlay Kartu Bendera (hanya jika diaktifkan)
  let elKartu = null;
  if (tampilkanOverlayDOM && wadahEl) {
    elKartu = document.createElement('div');
    elKartu.className = 'diorama-bendera-kartu';
    elKartu.setAttribute('role', 'dialog');
    elKartu.setAttribute('aria-label', 'Detail budaya wilayah provinsi terpilih');
    elKartu.hidden = true;
    wadahEl.appendChild(elKartu);
  }

  // State
  let provinsiAktif = null;
  let meshAktif = null;
  let waktuMulaiTampil = 0;
  let titikUjungDunia = new Vector3();
  let titikProyeksiLayar = new Vector3();
  let skalaAnimasiTiang = 0;
  let targetSkala = 0;
  let stempelTerkumpul = false;

  /**
   * Menampilkan penanda di atas pulau terpilih
   * @param {object} provData - Data dari provinsi.json
   * @param {THREE.Mesh} mesh - Mesh provinsi
   */
  function tampilkan(provData, mesh) {
    if (!provData || !mesh) return;

    provinsiAktif = provData;
    meshAktif = mesh;
    stempelTerkumpul = apakahSudahStempelDiStorage(provData.kode);
    waktuMulaiTampil = performance.now();

    // Posisikan penanda tepat di daratan utama (bukan di tengah laut!)
    const posDaratan = mesh.userData?.titikDaratanUtama || mesh.position;
    const maxYLokal = mesh.geometry?.boundingBox?.max?.y ?? (KETEBALAN_EXTRUDE * 0.5);
    const yPermukaan = mesh.position.y + maxYLokal + 0.002;

    grupTiang.position.set(posDaratan.x, yPermukaan, posDaratan.z);
    grupTiang.visible = true;
    skalaAnimasiTiang = 0.1;
    targetSkala = 1;
    grupTiang.scale.set(1, 0.1, 1);

    // Tentukan warna panji segitiga mini berdasarkan jenis dominan budaya
    const warnaJenis = WARNA_JENIS_HEX[provData.jenis_dominan] || '#E6B14A';
    panjiMat.color.set(warnaJenis);

    if (!tampilkanOverlayDOM || !elKartu) {
      return;
    }

    // Susun rincian jenis OPK
    const perJenis = provData.per_jenis_opk || {};
    const daftarJenisTeks = [
      { nama: 'Kerajinan', jml: perJenis.kerajinan || 0, warna: WARNA_JENIS_HEX.kerajinan },
      { nama: 'Seni', jml: perJenis.seni || 0, warna: WARNA_JENIS_HEX.seni },
      { nama: 'Tradisi Lisan', jml: perJenis.lisan || 0, warna: WARNA_JENIS_HEX.lisan },
      { nama: 'Pengetahuan', jml: perJenis.pengetahuan || 0, warna: WARNA_JENIS_HEX.pengetahuan },
      { nama: 'Adat Ritus', jml: perJenis.adat || 0, warna: WARNA_JENIS_HEX.adat },
      { nama: 'Cagar Budaya', jml: provData.total_cagar_budaya || 0, warna: WARNA_JENIS_HEX.cagar }
    ].filter(item => item.jml > 0);

    const adalahKosong = provData.status_data === 'belum_tercatat' || provData.total === 0;

    // Ambil daftar tradisi nyata dari data lengkap bila tersedia
    let daftarTradisi = [];
    if (typeof ambilBudayaProvinsi === 'function') {
      daftarTradisi = ambilBudayaProvinsi(String(provData.kode)) || [];
    }

    // Ambil maksimal 3–4 tradisi unggulan yang memiliki deskripsi
    const tradisiUnggulan = daftarTradisi
      .slice()
      .sort((a, b) => (b.panjang_deskripsi || 0) - (a.panjang_deskripsi || 0))
      .slice(0, 3);

    // Ambil kabupaten/kota kontributor teratas bila ada
    const kabTeratas = (provData.kabupaten_teratas || []).slice(0, 3);

    // Susun isi HTML Bendera
    elKartu.innerHTML = `
      <div class="bendera-pita-kiri" style="background-color: ${warnaJenis};"></div>
      <div class="bendera-konten">
        <header class="bendera-header">
          <div class="bendera-judul-grup">
            <span class="bendera-badge-kode">PROVINSI ${provData.kode}</span>
            <h3 class="bendera-nama-prov">${provData.nama}</h3>
          </div>
          <button type="button" class="bendera-tombol-tutup" aria-label="Tutup detail bendera">&times;</button>
        </header>

        <div class="bendera-status-bar ${adalahKosong ? 'is-kosong' : 'is-tercatat'}">
          ${adalahKosong
            ? '<span class="bendera-status-titik"></span> <span class="bendera-status-teks">Belum tercatat di SPKT (Menanti Pendataan)</span>'
            : `<strong class="bendera-total-angka">${formatAngka(provData.total)}</strong> <span class="bendera-status-teks">Karya Budaya Tercatat ${provData.peringkat_total ? `&bull; Peringkat #${provData.peringkat_total}` : ''}</span>`
          }
        </div>

        ${!adalahKosong && daftarJenisTeks.length > 0 ? `
          <div class="bendera-seksi">
            <span class="bendera-seksi-label">Komposisi Budaya:</span>
            <div class="bendera-rincian-kategori">
              ${daftarJenisTeks.map(k => `
                <span class="bendera-chip-kategori">
                  <span class="bendera-titik-warna" style="background-color:${k.warna}"></span>
                  ${k.nama} <strong>${k.jml}</strong>
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${!adalahKosong && kabTeratas.length > 0 ? `
          <div class="bendera-seksi">
            <span class="bendera-seksi-label">Kontributor Terbanyak:</span>
            <p class="bendera-kabupaten-teks">
              ${kabTeratas.map(k => `${k.nama} (${k.jumlah})`).join(', ')}
            </p>
          </div>
        ` : ''}

        ${!adalahKosong && tradisiUnggulan.length > 0 ? `
          <div class="bendera-seksi">
            <span class="bendera-seksi-label">Warisan Budaya Unggulan:</span>
            <div class="bendera-daftar-tradisi">
              ${tradisiUnggulan.map(t => `
                <button type="button" class="bendera-item-tradisi" data-id="${t.id}">
                  <span class="bendera-tradisi-nama">${t.nama}</span>
                  <span class="bendera-tradisi-jenis">${t.jenis_label || t.kategori} &rarr;</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${adalahKosong ? `
          <div class="bendera-catatan-kosong">
            <p>
              Belum tercatat di SPKT bukan berarti tidak memiliki budaya. Kebudayaan di provinsi ini tetap kaya dan hidup, namun masih menanti pendataan resmi ke dalam sistem terpadu kementerian.
            </p>
          </div>
        ` : ''}

        <footer class="bendera-footer-aksi">
          <button type="button" class="bendera-tombol-paspor ${stempelTerkumpul ? 'is-terkumpul' : ''}" data-kode="${provData.kode}">
            <span class="bendera-ikon-stempel">${stempelTerkumpul ? ikonCentang(13) : ikonPaspor(13)}</span>
            <span class="bendera-teks-paspor">${stempelTerkumpul ? 'Stempel Dicatat' : 'Kumpulkan Stempel Paspor'}</span>
          </button>
        </footer>
      </div>
    `;

    elKartu.hidden = false;
    elKartu.classList.add('is-muncul');

    // Event listener tombol tutup
    const btnTutup = elKartu.querySelector('.bendera-tombol-tutup');
    if (btnTutup) {
      btnTutup.addEventListener('click', (e) => {
        e.stopPropagation();
        sembunyikan();
      });
    }

    // Event listener klik item tradisi -> buka dialog rekaman lengkap
    const tombolTradisi = elKartu.querySelectorAll('.bendera-item-tradisi');
    tombolTradisi.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idBudaya = btn.getAttribute('data-id');
        const itemDitemukan = daftarTradisi.find(t => String(t.id) === String(idBudaya));
        if (itemDitemukan && typeof onBukaDetailRekaman === 'function') {
          onBukaDetailRekaman(itemDitemukan, btn);
        }
      });
    });

    // Event listener tombol paspor
    const btnPaspor = elKartu.querySelector('.bendera-tombol-paspor');
    if (btnPaspor) {
      btnPaspor.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof onCatatStempel === 'function' && !stempelTerkumpul) {
          const jenisStempel = adalahKosong ? 'penjaga' : 'biasa';
          onCatatStempel(String(provData.kode), jenisStempel);
          stempelTerkumpul = true;
          btnPaspor.classList.add('is-terkumpul');
          const teksPaspor = btnPaspor.querySelector('.bendera-teks-paspor');
          if (teksPaspor) {
            teksPaspor.innerHTML = `${ikonCentang(13)} <span>Stempel Dicatat</span>`;
          }
        }
      });
    }

    perbaruiPosisi();
  }

  /**
   * Menyembunyikan bendera
   */
  function sembunyikan() {
    provinsiAktif = null;
    targetSkala = 0;
    if (elKartu) {
      elKartu.classList.remove('is-muncul');
      setTimeout(() => {
        if (!provinsiAktif) {
          grupTiang.visible = false;
          elKartu.hidden = true;
        }
      }, 200);
    } else {
      grupTiang.visible = false;
    }
  }

  /**
   * Memperbarui posisi koordinat kartu di layar setiap frame loop
   */
  /**
   * Memperbarui posisi koordinat penanda di ruang 3D dan kartu DOM setiap frame loop
   */
  function perbaruiPosisi() {
    if (!provinsiAktif || !grupTiang.visible) return;

    // Ketinggian Y penanda selalu mengikuti ketinggian pulau yang beranimasi spring lerp
    if (meshAktif) {
      const maxYLokal = meshAktif.geometry?.boundingBox?.max?.y ?? (KETEBALAN_EXTRUDE * 0.5);
      grupTiang.position.y = meshAktif.position.y + maxYLokal + 0.002;
    }

    // Animasi skala tumbuh tiang
    if (Math.abs(skalaAnimasiTiang - targetSkala) > 0.01) {
      skalaAnimasiTiang += (targetSkala - skalaAnimasiTiang) * 0.22;
      grupTiang.scale.set(1, Math.max(0.01, skalaAnimasiTiang), 1);
    }

    // Animasi rotasi kristal permata 3D & denyut riak daratan
    const sekarang = performance.now();
    const tDetik = (sekarang - waktuMulaiTampil) * 0.001;
    kristalMesh.rotation.y += 0.025;
    kristalMesh.position.y = 0.46 + Math.sin(tDetik * 3.5) * 0.012;

    const skalaRiak = 1.0 + (Math.sin(tDetik * 3.0) * 0.5 + 0.5) * 0.35;
    riakMesh.scale.set(skalaRiak, skalaRiak, 1);
    riakMat.opacity = Math.max(0.1, 0.85 - (skalaRiak - 1.0) * 0.5);

    if (!elKartu) return;

    // Hitung posisi ujung tiang (puncak kristal) di ruang dunia
    grupTiang.getWorldPosition(titikUjungDunia);
    titikUjungDunia.y += 0.55 * skalaAnimasiTiang;

    // Proyeksikan ke ruang kanvas [ -1..1 ] -> [ 0..width, 0..height ]
    titikProyeksiLayar.copy(titikUjungDunia);
    titikProyeksiLayar.project(camera);

    const lebar = wadahEl.clientWidth || window.innerWidth;
    const tinggi = wadahEl.clientHeight || window.innerHeight;

    // Jika di belakang kamera, sembunyikan
    if (titikProyeksiLayar.z > 1) {
      elKartu.style.opacity = '0';
      return;
    }

    const xLayar = (titikProyeksiLayar.x * 0.5 + 0.5) * lebar;
    const yLayar = (-titikProyeksiLayar.y * 0.5 + 0.5) * tinggi;

    const adalahLayarKecil = lebar < 640;

    if (adalahLayarKecil) {
      // Pada ponsel, posisikan kartu di bottom sheet yang nyaman
      elKartu.style.opacity = '1';
      elKartu.style.transform = 'none';
      elKartu.style.top = 'auto';
      elKartu.style.bottom = '16px';
      elKartu.style.left = '16px';
      elKartu.style.right = '16px';
      elKartu.style.maxWidth = 'calc(100vw - 32px)';
    } else {
      // Pada desktop, clamp agar tidak keluar batas kanan/kiri
      const batasKiri = 180;
      const batasKanan = lebar - 180;
      const xClamped = Math.max(batasKiri, Math.min(batasKanan, xLayar));

      // Jika terlalu dekat ke tepi atas (< 230px), tempatkan di bawah tiang
      const posisiDiAtas = yLayar > 230;
      elKartu.classList.toggle('posisi-bawah', !posisiDiAtas);

      elKartu.style.opacity = '1';
      elKartu.style.top = '0';
      elKartu.style.bottom = 'auto';
      elKartu.style.left = '0';
      elKartu.style.right = 'auto';
      elKartu.style.maxWidth = '360px';

      if (posisiDiAtas) {
        elKartu.style.transform = `translate3d(calc(${xClamped}px - 50%), calc(${yLayar}px - 100% - 16px), 0)`;
      } else {
        elKartu.style.transform = `translate3d(calc(${xClamped}px - 50%), calc(${yLayar}px + 20px), 0)`;
      }
    }
  }

  function dispose() {
    sembunyikan();
    if (grupUtama) {
      grupUtama.remove(grupTiang);
    } else {
      scene.remove(grupTiang);
    }
    riakGeo.dispose();
    riakMat.dispose();
    tiangGeo.dispose();
    tiangMat.dispose();
    kristalGeo.dispose();
    kristalMat.dispose();
    panjiGeo.dispose();
    panjiMat.dispose();
    if (elKartu && elKartu.parentNode) {
      elKartu.parentNode.removeChild(elKartu);
    }
  }

  return {
    tampilkan,
    sembunyikan,
    perbaruiPosisi,
    dispose,
    getProvinsiAktif: () => provinsiAktif
  };
}
