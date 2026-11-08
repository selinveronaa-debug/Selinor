/**
 * RoomRecall · main.js
 * Boot: draw the street, report whether Claude is reachable, and add app-wide keyboard and first-visit touches.
 */

/* ---------- Start ---------- */
renderStreet();
updateAiStatus();

/* Escape closes whichever dialog is open, topmost first. */
const DIALOGS = ['#ownDialog', '#shopDialog', '#examDialog', '#spotPicker', '#player'];
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const open = DIALOGS.map(s => $(s)).find(d => d && !d.hidden);
  if (open) { open.hidden = true; e.stopImmediatePropagation(); if (open.id === 'player') $('#playerBtn').setAttribute('aria-expanded', 'false'); }
}, true);

/* Images below the fold load lazily; the street art loads first. */
$$('img:not(.tile-base):not(.logo)').forEach(img => { img.loading = 'lazy'; img.decoding = 'async'; });

/* First visit: one short hint, then never again. */
if (!store.get('rr-v2-welcomed', false)) {
  setTimeout(() => toast('Welcome ✿ Tap a glowing house to walk it, or build one from your own notes.', 7000), 2400);
  store.set('rr-v2-welcomed', true);
}
