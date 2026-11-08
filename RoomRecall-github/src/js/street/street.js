/**
 * RoomRecall · street/street.js
 * The looping street on the home screen: lots, houses, glow on hover, tooltips and diamonds.
 */

/* ---------- Home street ---------- */
/* Twelve lots on the open lawns of the park tile (six per half). `lot` is the empty plot, `box` is where its house
   stands (left, top, width, height in % of the tile). A house only appears once a course lives there. */
const LOTS = [
  { sprite: 'chalet', box: [28.07, 24.47, 6.66, 26.54], lot: [27.74, 43.84, 7.32, 9.56], facade: 'chalet' },
  { sprite: 'cottage', box: [8.02, 22.21, 7.29, 22.95], lot: [7.65, 37.99, 8.02, 9.56], facade: 'cottage' },
  { sprite: 'cabin', box: [13.69, 44.21, 4.92, 20.09], lot: [13.44, 57.12, 5.42, 9.56], facade: 'chalet' },
  { sprite: 'blue', box: [27.15, 56.91, 6.11, 24.39], lot: [26.84, 74.12, 6.72, 9.56], facade: 'gilmore' },
  { box: [37.04, 52.87, 6.06, 21.52], lot: [36.74, 67.22, 6.66, 9.56], facade: 'villa' },
  { sprite: 'tower', box: [2.83, 49.95, 5.69, 31.35], lot: [2.55, 74.12, 6.26, 9.56], facade: 'friends' },
  { sprite: 'blue', box: [65.28, 24.47, 6.65, 26.54], lot: [64.95, 43.84, 7.31, 9.56], facade: 'gilmore' },
  { sprite: 'chalet', box: [85.46, 22.21, 5.76, 22.95], lot: [85.17, 37.99, 6.33, 9.56], facade: 'chalet' },
  { box: [81.03, 44.21, 5.65, 20.09], lot: [80.74, 57.12, 6.22, 9.56], facade: 'villa' },
  { sprite: 'cottage', box: [65.92, 56.91, 7.75, 24.39], lot: [65.54, 74.12, 8.52, 9.56], facade: 'cottage' },
  { sprite: 'cabin', box: [57.29, 52.87, 5.28, 21.52], lot: [57.03, 67.22, 5.8, 9.56], facade: 'chalet' },
  { sprite: 'tower', box: [91.47, 49.95, 5.69, 31.35], lot: [91.19, 74.12, 6.26, 9.56], facade: 'friends' }
];
const LOT_COUNT = LOTS.length;

/* Give every house a lot of its own; a deleted house frees its lot. */
function assignLots(houses) {
  const taken = new Set(houses.filter(h => Number.isInteger(h.lot)).map(h => h.lot));
  houses.forEach(h => {
    if (Number.isInteger(h.lot) && h.lot < LOT_COUNT) return;
    const open = [...Array(LOT_COUNT).keys()].filter(i => !taken.has(i));
    const free = open.find(i => LOTS[i].facade === h.facade) ?? open[0];
    h.lot = free ?? null; if (free != null) taken.add(free);
  });
  return houses;
}

function renderStreet() {
  assignLots(state.houses); saveHouses();
  renderStreetInto($('#streetTrack'), state.houses, { open: id => openHouse(id), empty: lot => startBuild(lot == null ? undefined : LOTS[lot].facade, lot) });
}

/* Draw a looping street into `track`. Houses sit on their own lot; empty lots show a + to build. */
function renderStreetInto(track, houses, on) {
  const byLot = new Map(houses.filter(h => Number.isInteger(h.lot)).map(h => [h.lot, h]));
  // One tile = the park followed by its mirror image, so every seam meets itself exactly.
  // Each half has six lots on its open lawns; houses are never mirrored.
  const tile = () => {
    let html = `<img class="tile-base" src="./assets/street-loop.webp" alt="" draggable="false" />`;
    LOTS.forEach((lot, i) => {
      const [x, y, w, hgt] = lot.box; const h = byLot.get(i);
      const box = `left:${x}%;top:${y}%;width:${w}%;height:${hgt}%`;
      if (h) {
        const art = lot.sprite ? `./assets/house-${lot.sprite}.webp` : facadeSrcOf(h);
        const sm = h.rooms?.[0]?.items ? houseSummary(h) : { needs: 0, neglected: false };
        html += `<button class="lot-house ${lot.sprite ? '' : 'facade-lot'} ${sm.neglected ? 'neglected' : ''} ${sm.needs ? 'due' : ''}" type="button" data-open="${esc(h.id)}" style="${box}" aria-label="Open ${esc(h.course)}${sm.needs ? `, ${sm.needs} spots to review` : ''}"><img src="${esc(art)}" alt="" draggable="false" /><span class="sign"><b>${sm.needs ? `🔔 ${sm.needs} · ` : ''}${esc(h.course)}</b></span></button>`;
      } else {
        const [lx, ly, lw, lh] = lot.lot;
        html += `<button class="lot-empty" type="button" data-lot="${i}" style="left:${lx}%;top:${ly}%;width:${lw}%;height:${lh}%" aria-label="Build a course house on this lot"><span class="lot-plus">+</span></button>`;
      }
    });
    return `<div class="tile">${html}</div>`;
  };
  track.innerHTML = Array.from({ length: 3 }, tile).join('');
  track.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
    b.classList.remove('lit'); void b.offsetWidth; b.classList.add('lit');
    setTimeout(() => on.open(b.dataset.open), 380);
  }));
  track.querySelectorAll('[data-lot]').forEach(b => b.addEventListener('click', () => on.empty(+b.dataset.lot)));
  sizeStreet();
}
const TILE_W = 3344, TILE_H = 941; // size of street-loop.webp
function sizeStreet() {
  $$('.street').forEach(street => {
    const track = street.querySelector('.street-track'); if (!track || !street.clientHeight) return;
    const tw = street.clientHeight * 1.06 * (TILE_W / TILE_H);
    track.style.setProperty('--tw', `${tw}px`);
    track.style.setProperty('--shift', `${tw}px`);
  });
}
window.addEventListener('resize', sizeStreet);
function renderSeriesStrip() {
  $('#seriesStrip').innerHTML = Object.entries(FACADES).filter(([, f]) => f.group === 'series').map(([k, f]) => `<button class="series-mini" type="button" data-series="${k}" aria-label="${esc(f.label)} from ${esc(f.note)}" title="${esc(f.label)} · ${esc(f.note)}"><img src="${f.src}" alt="" /></button>`).join('');
  $$('[data-series]').forEach(b => b.addEventListener('click', () => b.dataset.series === 'friends' ? openDemo(DEMO_FRIENDS) : startBuild(b.dataset.series)));
}
renderSeriesStrip();

/* ---------- Tooltips on furniture ---------- */
function bindTips(root) {
  const tip = $('#tip');
  root.addEventListener('pointerover', e => { const t = e.target.closest('[data-tip]'); if (!t) return; tip.textContent = t.dataset.tip; tip.hidden = false; });
  root.addEventListener('pointermove', e => { if (!tip.hidden) { tip.style.left = `${e.clientX}px`; tip.style.top = `${e.clientY}px`; } });
  root.addEventListener('pointerout', e => { const t = e.target.closest('[data-tip]'); if (t && !t.contains(e.relatedTarget)) tip.hidden = true; });
}

/* ---------- Diamonds ---------- */
const gems = { total: store.get('rr-v2-gems', 0), streak: 0 };
function renderGems(bump) { $('#gemCount').textContent = gems.total.toLocaleString(); if (bump) { const c = $('#gemChip'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } }
function addGems(n, label) {
  gems.total += n; store.set('rr-v2-gems', gems.total); renderGems(true);
  if (state.quiz) state.quiz.gems = (state.quiz.gems || 0) + n;
  const pop = $('#gemPop'); pop.textContent = `+${n} 💎${label ? ` ${label}` : ''}`; pop.classList.remove('go'); void pop.offsetWidth; pop.classList.add('go');
}
renderGems();
/* A one-time welcome gift, so the shop can be tried right away. */
if (!store.get('rr-v2-gift', false)) {
  gems.total += 300; store.set('rr-v2-gems', gems.total); store.set('rr-v2-gift', true); renderGems();
  setTimeout(() => toast('🎁 Welcome gift: 300 💎 to spend in the shop. Tap the diamond.', 6000), 9600);
}
