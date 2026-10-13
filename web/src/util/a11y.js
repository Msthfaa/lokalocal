/**
 * a11y.js — Utilitas pengelolaan dialog aksesibel (<dialog>) dan fokus keyboard
 * Sesuai WEB_SPEC.md Bagian 4.3 & Bagian 9.
 */

/**
 * Mengikat perilaku aksesibel pada elemen <dialog>:
 * - Menyimpan elemen pemicu dan mengembalikan fokus saat ditutup
 * - Memindahkan fokus ke judul dialog saat dibuka
 * - Menutup dialog ketika klik pada area backdrop di luar kotak dialog
 *
 * @param {HTMLDialogElement} dialogEl
 * @param {HTMLElement|null} judulFokusEl
 */
export function pasangPerilakuDialog(dialogEl, judulFokusEl = null) {
  if (!dialogEl) return { buka: () => {}, tutup: () => {} };

  let pemicuTerakhir = null;

  function buka(elemenPemicu = null) {
    pemicuTerakhir = elemenPemicu || document.activeElement;
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
    if (typeof dialogEl.close === 'function' && dialogEl.open) {
      dialogEl.close();
    } else {
      dialogEl.removeAttribute('open');
    }
  }

  dialogEl.addEventListener('close', () => {
    if (pemicuTerakhir && typeof pemicuTerakhir.focus === 'function') {
      pemicuTerakhir.focus();
    }
  });

  // Klik pada backdrop menutup dialog
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
