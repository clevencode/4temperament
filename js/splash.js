// splash.js — Écran de démarrage (icône cerveau officielle)

const SPLASH_MIN_MS = 900;
const SPLASH_FADE_MS = 420;
let splashShownAt = 0;

function hideSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (!splash || splash.classList.contains('is-hidden')) return;

  const elapsed = Date.now() - splashShownAt;
  const wait = Math.max(0, SPLASH_MIN_MS - elapsed);

  setTimeout(() => {
    splash.classList.add('is-hiding');
    splash.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      splash.classList.add('is-hidden');
      document.body.classList.remove('splash-active');
    }, SPLASH_FADE_MS);
  }, wait);
}

function initSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  splashShownAt = Date.now();
  document.body.classList.add('splash-active');
  splash.classList.remove('is-hidden', 'is-hiding');
  splash.setAttribute('aria-hidden', 'false');
}

window.initSplashScreen = initSplashScreen;
window.hideSplashScreen = hideSplashScreen;

if (document.getElementById('splash-screen')) {
  splashShownAt = Date.now();
}