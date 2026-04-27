const bar = document.getElementById('loading-bar');
const text = document.getElementById('loading-text');
const screen = document.getElementById('loading-screen');

export function setLoadingProgress(pct, message = '') {
  if (bar) bar.style.width = `${pct}%`;
  if (text && message) text.textContent = message;
}

export function hideLoadingScreen() {
  if (!screen) return;
  screen.style.opacity = '0';
  setTimeout(() => { screen.style.display = 'none'; }, 500);
}
