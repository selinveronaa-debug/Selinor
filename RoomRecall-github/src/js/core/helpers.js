/**
 * RoomRecall · core/helpers.js
 * Small DOM, text and storage helpers used everywhere.
 */

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const plain = s => String(s || '').replace(/^the\s+/i, '');
const cap = s => { const t = plain(s); return t.charAt(0).toUpperCase() + t.slice(1); };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
};
let toastTimer;
function toast(msg, ms = 5000) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ms); }
function shuffle(a) { const c = [...a]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; }

/* Read a photo the student picked: decode it, shrink it to at most 1600 px and
   return a JPEG data URL. Gives a plain reason when the browser cannot decode
   it (iPhone HEIC photos in Chrome are the usual case). */
async function loadPhoto(file, max = 1600) {
  if (!file) throw new Error('No photo was chosen.');
  if (!file.size) throw new Error('The photo arrived empty (0 bytes). If it is in iCloud or Google Photos, download it to your computer first, or take a screenshot of it.');
  const isHeic = /hei[cf]/i.test(file.type || '') || /\.hei[cf]$/i.test(file.name || '');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image(); im.onload = () => resolve(im); im.onerror = () => reject(new Error('decode')); im.src = url;
    });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    // The blob comes straight from the canvas: fetching a data: URL is blocked in the artifact frame.
    const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', .86));
    return { src: c.toDataURL('image/jpeg', .86), blob, w, h };
  } catch {
    throw new Error(isHeic
      ? 'This is an iPhone HEIC photo, and this browser cannot open it. Save it as JPG or PNG (or take a screenshot of it) and try again.'
      : 'That photo could not be opened. Try a JPG or PNG.');
  } finally { URL.revokeObjectURL(url); }
}
