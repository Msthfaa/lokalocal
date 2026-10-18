/**
 * a11y.js — Utilitas pengelolaan dialog aksesibel (<dialog>), transisi halus, dan fokus keyboard
 * Sesuai WEB_SPEC.md Bagian 4.3 & Bagian 9.
 */

/**
 * Mengikat perilaku aksesibel pada elemen <dialog>:
 * - Transisi membuka dan menutup yang mulus (smooth entrance & exit)
 * - Menyimpan elemen pemicu dan mengembalikan fokus saat ditutup
 * - Memindahkan fokus ke judul dialog saat dibuka
 * - Menutup dialog dengan transisi ketika tombol tutup, tombol ESC, atau area backdrop diklik
 *
 * @param {HTMLDialogElement} dialogEl
 * @param {HTMLElement|null} judulFokusEl
 */
export function pasangPerilakuDialog(dialogEl, judulFokusEl = null) {
  if (!dialogEl) return { buka: () => {}, tutup: () => {} };

  let pemicuTerakhir = null;
  let sedangMenutup = false;

  function buka(elemenPemicu = null) {
    pemicuTerakhir = elemenPemicu || document.activeElement;
    sedangMenutup = false;
    dialogEl.classList.remove('dialog-keluar');

    if (typeof dialogEl.showModal === 'function') {
      if (!dialogEl.open) {
        dialogEl.showModal();
      }
    } else {
      dialogEl.setAttribute('open', '');
    }

    if (judulFokusEl) {
      judulFokusEl.focus();
    }
  }

  function tutup() {
    if (!dialogEl.open || sedangMenutup) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      sedangMenutup = false;
      dialogEl.classList.remove('dialog-keluar');
      if (typeof dialogEl.close === 'function') {
        dialogEl.close();
      } else {
        dialogEl.removeAttribute('open');
      }
      return;
    }

    sedangMenutup = true;
    dialogEl.classList.add('dialog-keluar');

    let telahSelesai = false;
    const selesaiTutup = () => {
      if (telahSelesai) return;
      telahSelesai = true;
      dialogEl.removeEventListener('animationend', onAnimasiEnd);
      dialogEl.removeEventListener('transitionend', onAnimasiEnd);
      clearTimeout(timerFallback);
      dialogEl.classList.remove('dialog-keluar');
      sedangMenutup = false;

      if (typeof dialogEl.close === 'function' && dialogEl.open) {
        dialogEl.close();
      } else {
        dialogEl.removeAttribute('open');
      }
    };

    const onAnimasiEnd = (e) => {
      if (e.target === dialogEl) {
        selesaiTutup();
      }
    };

    dialogEl.addEventListener('animationend', onAnimasiEnd);
    dialogEl.addEventListener('transitionend', onAnimasiEnd);
    const timerFallback = setTimeout(selesaiTutup, 260);
  }

  dialogEl.addEventListener('close', () => {
    sedangMenutup = false;
    dialogEl.classList.remove('dialog-keluar');
    if (pemicuTerakhir && typeof pemicuTerakhir.focus === 'function') {
      pemicuTerakhir.focus();
    }
  });

  // Intersep event cancel (ESC) agar dialog menutup dengan transisi halus
  dialogEl.addEventListener('cancel', (event) => {
    event.preventDefault();
    tutup();
  });

  // Klik pada backdrop menutup dialog dengan transisi halus
  dialogEl.addEventListener('click', (event) => {
    const rect = dialogEl.getBoundingClientRect();
    const diDalamDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;

    if (!diDalamDialog) {
      tutup();
    }
  });

  return { buka, tutup };
}

