/**
 * bendera.js — Komponen Tiang & Bendera Detail Provinsi 3D
 * Menancap di atas provinsi yang diklik/dipilih dan menampilkan informasi budaya lengkap,
 * rincian OPK, kabupaten kontributor, serta contoh karya budaya nyata.
 */

import {
  Group,
  Mesh,
  CylinderGeometry,
  SphereGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  Vector3
} from 'three';
import { WARNA_JENIS_HEX } from '../../map/scales.js';
import { formatAngka } from '../../util/format.js';

/**
 * Membuat pengontrol bendera 3D dan kartu popover bendera
 *
 * @param {object} parameter
 * @param {THREE.Scene} parameter.scene
 * @param {THREE.Camera} parameter.camera
 * @param {HTMLElement} parameter.wadahEl - Wadah elemen canvas
 * @param {(kode: string) => void} [parameter.onJelajahiProvinsi]
 * @param {(rekaman: object, pemicuEl: HTMLElement) => void} [parameter.onBukaDetailRekaman]
 * @param {(kode: string, jenis: string) => void} [parameter.onCatatStempel]
 * @param {(kode: string) => Array} [parameter.ambilBudayaProvinsi]
 * @returns {object} API kontrol bendera
 */
export function buatPengontrolBendera({
  scene,
  camera,
  wadahEl,
  onJelajahiProvinsi,
  onBukaDetailRekaman,
  onCatatStempel,
  ambilBudayaProvinsi
}) {
  // 1. Objek 3D Tiang Bendera
  const grupTiang = new Group();
  grupTiang.visible = false;

  // Batang tiang emas berkilau
  const tiangGeo = new CylinderGeometry(0.045, 0.045, 1.6, 12);
  const tiangMat = new MeshStandardMaterial({
    color: 0xE6B14A,
    roughness: 0.25,
    metalness: 0.7,
    flatShading: true
  });
  const tiangMesh = new Mesh(tiangGeo, tiangMat);
  tiangMesh.position.y = 0.8;
  grupTiang.add(tiangMesh);

  // Bola emas di puncak tiang
  const bolaGeo = new SphereGeometry(0.095, 12, 12);
  const bolaMesh = new Mesh(bolaGeo, tiangMat);
  bolaMesh.position.y = 1.6;
  grupTiang.add(bolaMesh);

  // Bendera mini 3D low-poly
  const kainGeo = new BoxGeometry(0.68, 0.44, 0.035);
  const kainMat = new MeshStandardMaterial({
    color: 0xC85A32,
    roughness: 0.55,
    metalness: 0.1,
    flatShading: true
  });
  const kainMesh = new Mesh(kainGeo, kainMat);
  kainMesh.position.set(0.38, 1.35, 0);
  grupTiang.add(kainMesh);

  scene.add(grupTiang);

  // 2. Elemen DOM Overlay Kartu Bendera
  const elKartu = document.createElement('div');
  elKartu.className = 'diorama-bendera-kartu';
  elKartu.setAttribute('role', 'dialog');
  elKartu.setAttribute('aria-label', 'Detail budaya wilayah provinsi terpilih');
  elKartu.hidden = true;
  wadahEl.appendChild(elKartu);

  // State
  let provinsiAktif = null;
  let titikUjungDunia = new Vector3();
  let titikProyeksiLayar = new Vector3();
  let skalaAnimasiTiang = 0;
  let targetSkala = 0;
  let stempelTerkumpul = false;

  /**
   * Menampilkan bendera di atas provinsi
   * @param {object} provData - Data dari provinsi.json
   * @param {THREE.Mesh} mesh - Mesh provinsi
   */
  function tampilkan(provData, mesh) {
    if (!provData || !mesh) return;

    provinsiAktif = provData;
    stempelTerkumpul = false;

    // Posisikan tiang di pusat keping provinsi
    grupTiang.position.copy(mesh.position);
    grupTiang.visible = true;
    skalaAnimasiTiang = 0.1;
    targetSkala = 1;
    grupTiang.scale.set(1, 0.1, 1);

    // Tentukan warna bendera mini 3D berdasarkan jenis dominan
    const warnaJenis = WARNA_JENIS_HEX[provData.jenis_dominan] || '#E6B14A';
    kainMat.color.set(warnaJenis);

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
          <button type="button" class="bendera-tombol-paspor" data-kode="${provData.kode}">
            <span class="bendera-ikon-stempel">🏷️</span>
            <span class="bendera-teks-paspor">Kumpulkan Stempel Paspor</span>
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
            teksPaspor.textContent = '✅ Stempel Berhasil Dicatat!';
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
    elKartu.classList.remove('is-muncul');
    setTimeout(() => {
      if (!provinsiAktif) {
        grupTiang.visible = false;
        elKartu.hidden = true;
      }
    }, 200);
  }

  /**
   * Memperbarui posisi koordinat kartu di layar setiap frame loop
   */
  function perbaruiPosisi() {
    if (!provinsiAktif || !grupTiang.visible) return;

    // Animasi skala tumbuh tiang
    if (Math.abs(skalaAnimasiTiang - targetSkala) > 0.01) {
      skalaAnimasiTiang += (targetSkala - skalaAnimasiTiang) * 0.22;
      grupTiang.scale.set(1, Math.max(0.01, skalaAnimasiTiang), 1);
    }

    // Hitung posisi ujung tiang (puncak bola emas) di ruang dunia
    grupTiang.getWorldPosition(titikUjungDunia);
    titikUjungDunia.y += 1.65 * skalaAnimasiTiang;

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
    scene.remove(grupTiang);
    tiangGeo.dispose();
    tiangMat.dispose();
    bolaGeo.dispose();
    kainGeo.dispose();
    kainMat.dispose();
    if (elKartu.parentNode) {
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
