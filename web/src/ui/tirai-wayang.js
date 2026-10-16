/**
 * tirai-wayang.js — Tirai Pembuka Wayang Gunungan Emas Nusantara
 *
 * Sesuai arahan pengguna:
 * 1. Card bawah dihapus sepenuhnya (hanya Gunungan Wayang murni di tengah).
 * 2. Gunungan mulai dari kecil di tengah, lalu membesar memenuhi layar dengan efek menyala.
 * 3. Ketika membuka:
 *    - Kedua daun pintu (membawa masing-masing belahan gunungan) meluncur ke kiri & kanan.
 *    - Transisi ke beranda utama dibuat sangat lembut dan mulus (buttery-smooth),
 *      menyambut pengguna dengan animasi kemunculan konten beranda yang anggun dan tanpa sentakan/lag.
 */

import gsap from 'gsap';
import '../styles/tirai-wayang.css';

// Asset gambar belahan kiri dan kanan dari 1 Wayang Gunungan asli pengguna (Kayon)
const URL_WAYANG_KIRI = './assets/wayang-gunungan-kiri.png';
const URL_WAYANG_KANAN = './assets/wayang-gunungan-kanan.png';

const KUNCI_SESI_TIRAI = 'lokalocal_tirai_dilihat';

/**
 * Menginisialisasi Tirai Pembuka Wayang Gunungan Emas Nusantara
 * @param {object} [opsi]
 * @param {Function} [opsi.onSelesai]
 * @param {boolean} [opsi.paksaTampil=false]
 */
export function inisialisasiTiraiWayang({ onSelesai, paksaTampil = false } = {}) {
  // Cek apakah parameter url meminta tampil paksa (misal ?tirai=1 atau ?opening=1)
  const cekUrlPaksa =
    typeof window !== 'undefined' &&
    window.location &&
    (window.location.search.includes('tirai=1') || window.location.search.includes('opening=1'));

  let sudahDilihat = false;
  try {
    sudahDilihat = sessionStorage.getItem(KUNCI_SESI_TIRAI) === 'true';
  } catch {
    // Abaikan jika browser membatasi storage (misal sandboxed iframe)
  }

  // Jika sudah dilihat di sesi ini dan tidak dipaksa tampil, langsung selesaikan tanpa memunculkan tirai
  if (!paksaTampil && !cekUrlPaksa && sudahDilihat) {
    if (typeof onSelesai === 'function') {
      onSelesai();
    }
    return {
      buka: () => {}
    };
  }

  // Bersihkan overlay lama jika ada
  const overlayLama = document.getElementById('tirai-wayang-overlay');
  if (overlayLama) {
    overlayLama.remove();
  }

  // Kunci scroll halaman saat tirai sedang aktif
  const overflowAsal = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  // 1. Bangun Struktur DOM Tirai Wayang Gunungan (Tanpa Card Bawah)
  const overlay = document.createElement('div');
  overlay.id = 'tirai-wayang-overlay';
  overlay.className = 'tirai-wayang-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Pembuka Gerbang Wayang Gunungan Nusantara');

  overlay.innerHTML = `
    <!-- Pendar Aura Emas Berdenyut di Belakang Gunungan -->
    <div class="tirai-aura-pusat" id="tirai-aura-pusat"></div>

    <!-- Sinar Cahaya Emas Berputar Melingkar -->
    <div class="tirai-sinar-berputar" id="tirai-sinar-berputar"></div>

    <!-- Partikel Debu Emas Melayang -->
    <div class="tirai-partikel-wadah" id="tirai-partikel-wadah"></div>

    <!-- Kilatan Cahaya Flash Emas Saat Membelah -->
    <div class="tirai-flash-cahaya" id="tirai-flash-cahaya"></div>

    <!-- Wadah Dua Pintu Gerbang (Menutupi Layar Saat Tertutup, Menyingkap Beranda Saat Terbuka) -->
    <div class="tirai-wadah-pintu" id="tirai-wadah-pintu" aria-hidden="true">
      <!-- Pintu Kiri (50vw): Membawa Belahan Kiri Gunungan & Seam Emas Kiri -->
      <div class="tirai-pintu tirai-pintu--kiri" id="tirai-pintu-kiri">
        <div class="tirai-gunungan-sayap tirai-gunungan-sayap--kiri" id="gunungan-sayap-kiri">
          <img
            src="${URL_WAYANG_KIRI}"
            alt="Wayang Gunungan Belahan Kiri"
            class="tirai-gunungan-img"
            draggable="false"
          />
        </div>
      </div>

      <!-- Pintu Kanan (50vw): Membawa Belahan Kanan Gunungan & Seam Emas Kanan -->
      <div class="tirai-pintu tirai-pintu--kanan" id="tirai-pintu-kanan">
        <div class="tirai-gunungan-sayap tirai-gunungan-sayap--kanan" id="gunungan-sayap-kanan">
          <img
            src="${URL_WAYANG_KANAN}"
            alt="Wayang Gunungan Belahan Kanan"
            class="tirai-gunungan-img"
            draggable="false"
          />
        </div>
      </div>
    </div>

    <!-- Tombol Lewati di Kanan Atas -->
    <button type="button" class="btn-lewati-tirai" id="btn-lewati-tirai" aria-label="Lewati pengantar">
      <span>Lewati</span>
      <span class="btn-lewati-panah" aria-hidden="true">&rarr;</span>
    </button>
  `;

  document.body.prepend(overlay);

  // Buat partikel debu emas melayang naik
  const partikelWadah = overlay.querySelector('#tirai-partikel-wadah');
  if (partikelWadah) {
    const jumlahPartikel = window.innerWidth < 640 ? 18 : 32;
    for (let i = 0; i < jumlahPartikel; i++) {
      const p = document.createElement('div');
      p.className = 'tirai-partikel';
      const ukuran = Math.random() * 4 + 2;
      p.style.width = `${ukuran}px`;
      p.style.height = `${ukuran}px`;
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.animationDelay = `${(Math.random() * 2.5).toFixed(2)}s`;
      p.style.animationDuration = `${(Math.random() * 2.2 + 2.4).toFixed(2)}s`;
      partikelWadah.appendChild(p);
    }
  }

  // Elemen DOM
  const pintuKiri = overlay.querySelector('#tirai-pintu-kiri');
  const pintuKanan = overlay.querySelector('#tirai-pintu-kanan');
  const sayapKiri = overlay.querySelector('#gunungan-sayap-kiri');
  const sayapKanan = overlay.querySelector('#gunungan-sayap-kanan');
  const auraPusat = overlay.querySelector('#tirai-aura-pusat');
  const sinarBerputar = overlay.querySelector('#tirai-sinar-berputar');
  const flashCahaya = overlay.querySelector('#tirai-flash-cahaya');
  const btnLewati = overlay.querySelector('#btn-lewati-tirai');

  // Elemen beranda untuk transisi masuk yang mulus (smooth entrance)
  const heroTengah = document.querySelector('.hero-cinema-tengah');
  const headerUtama = document.querySelector('.header-utama');
  const latarPeta = document.querySelector('.s1-latar-peta');

  let sedangMembuka = false;

  // Cek preferensi kurangi gerak
  const kurangiGerak =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const durasiMembesar = 1.8;

  // =========================================================================
  // ANIMASI GSAP: DARI KECIL DI TENGAH -> MEMBESAR -> PISAH TENGAH MENYINGKAP BERANDA
  // =========================================================================

  // Inisialisasi: Mulai dari kecil di tengah (scale: 0.14) dengan pendar lembut
  gsap.set([sayapKiri, sayapKanan], {
    scale: 0.14,
    opacity: 0.25
  });
  gsap.set([auraPusat, sinarBerputar], {
    scale: 0.18,
    opacity: 0.4
  });

  const tl = gsap.timeline({
    onComplete: selesaikanTirai
  });

  // [0.0s -> 1.8s]: WAYANG GUNUNGAN DARI KECIL MEMBESAR MEMENUHI LAYAR
  tl.to(
    [sayapKiri, sayapKanan],
    {
      scale: 1.0,
      opacity: 1,
      duration: durasiMembesar,
      ease: 'power3.out'
    },
    0.05
  );

  // Aura emas dan sinar berputar ikut membesar dan menyala semakin terang
  tl.to(
    [auraPusat, sinarBerputar],
    {
      scale: 1.0,
      opacity: 1,
      duration: durasiMembesar,
      ease: 'power3.out'
    },
    0.05
  );

  // [1.8s -> 2.0s]: KILATAN CAHAYA MENYALA SEBELUM GERBANG MEMBELAH
  tl.add(() => {
    // Kilatan flash cahaya emas
    if (flashCahaya) {
      gsap.fromTo(
        flashCahaya,
        { opacity: 0 },
        {
          opacity: 0.85,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        }
      );
    }
    // Sembunyikan tombol lewati secara halus
    if (btnLewati) {
      btnLewati.style.opacity = '0';
      btnLewati.style.pointerEvents = 'none';
    }
    // Buka akses pointer ke beranda tepat saat pintu mulai bergerak
    overlay.style.pointerEvents = 'none';
  }, 1.8);

  // Sinar berputar dan partikel debu memudar perlahan
  tl.to(
    [sinarBerputar, partikelWadah],
    {
      opacity: 0,
      duration: 0.65,
      ease: 'power2.out'
    },
    1.85
  );

  // Pendar aura emas di tengah memudar secara bertahap dan lembut (transisi memudar halus)
  tl.to(
    auraPusat,
    {
      opacity: 0,
      scale: 1.2,
      duration: 0.95,
      ease: 'power1.out'
    },
    1.9
  );

  // [1.9s -> 3.25s]: DAUN PINTU PISAH TENGAH & MEMBUKA MENYINGKAP BERANDA UTAMA SECARA BUTTERY-SMOOTH
  if (kurangiGerak) {
    tl.to(
      overlay,
      {
        opacity: 0,
        duration: 0.5,
        ease: 'power1.out'
      },
      1.9
    );
  } else {
    // 1. Pintu Kiri meluncur anggun ke kiri hingga keluar layar penuh
    tl.to(
      pintuKiri,
      {
        xPercent: -105,
        duration: 1.35,
        ease: 'power2.inOut'
      },
      1.9
    );

    // 2. Pintu Kanan meluncur anggun ke kanan hingga keluar layar penuh
    tl.to(
      pintuKanan,
      {
        xPercent: 105,
        duration: 1.35,
        ease: 'power2.inOut'
      },
      1.9
    );

    // 3. TRANSISI ELEGAN BERANDA UTAMA (Mekar Lembut Tanpa Ganjel)
    tl.add(() => {
      if (heroTengah) {
        gsap.fromTo(
          heroTengah,
          { scale: 0.94, opacity: 0.45, y: 16 },
          { scale: 1.0, opacity: 1, y: 0, duration: 1.3, ease: 'power2.out' }
        );
      }
      if (headerUtama) {
        gsap.fromTo(
          headerUtama,
          { y: -16, opacity: 0.45 },
          { y: 0, opacity: 1, duration: 1.1, ease: 'power2.out' }
        );
      }
      if (latarPeta) {
        gsap.fromTo(
          latarPeta,
          { filter: 'brightness(0.7) blur(3px)' },
          { filter: 'brightness(1) blur(0px)', duration: 1.4, ease: 'power2.out' }
        );
      }
    }, 1.95);
  }

  // Tombol Lewati: Langsung melompat ke momen buka gerbang
  const triggerBukaCepat = () => {
    if (sedangMembuka) return;
    sedangMembuka = true;
    tl.seek(1.88);
  };

  if (btnLewati) {
    btnLewati.addEventListener('click', triggerBukaCepat);
  }

  // Klik di mana saja / tombol Spasi, Enter, Esc untuk langsung buka
  const onKeyDown = (e) => {
    if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
      if (!sedangMembuka) {
        e.preventDefault();
        window.removeEventListener('keydown', onKeyDown);
        triggerBukaCepat();
      }
    }
  };
  window.addEventListener('keydown', onKeyDown, { once: true });

  function selesaikanTirai() {
    try {
      sessionStorage.setItem(KUNCI_SESI_TIRAI, 'true');
    } catch {
      // Abaikan jika browser private mode / storage terbatas
    }

    sedangMembuka = true;
    document.body.style.overflow = overflowAsal;
    overlay.classList.add('is-tersembunyi');
    overlay.style.display = 'none';
    overlay.remove();

    if (typeof onSelesai === 'function') {
      onSelesai();
    }
  }

  return {
    buka: triggerBukaCepat
  };
}
