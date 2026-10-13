/**
 * toast.js — Komponen notifikasi singkat (role="status")
 * Sesuai WEB_SPEC.md Bagian 4.7.
 */

let timerToast = null;

/**
 * Menampilkan pesan toast singkat di pojok bawah layar.
 * @param {string} pesan
 * @param {number} durasiMs
 */
export function tampilkanToast(pesan, durasiMs = 3200) {
  const el = document.getElementById('toast-status');
  if (!el) return;

  if (timerToast) {
    window.clearTimeout(timerToast);
  }

  el.textContent = pesan;
  el.hidden = false;

  timerToast = window.setTimeout(() => {
    el.hidden = true;
    el.textContent = '';
  }, durasiMs);
}
