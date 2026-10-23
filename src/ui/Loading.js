/** Fades out and removes the loading overlay. */
export function hideLoading() {
  const el = document.getElementById('loading');
  if (!el) return;
  el.style.opacity = 0;
  setTimeout(() => el.remove(), 900);
}
