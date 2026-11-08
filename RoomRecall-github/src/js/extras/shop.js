/**
 * RoomRecall · extras/shop.js
 * Spend diamonds on decorations drawn into every room.
 */

/* ---------- Diamond shop: cosy decorations for every room ---------- */
const DECOR = [
  { id: 'lights', name: 'Fairy lights', price: 40, icon: '✨', note: 'Strung across every room' },
  { id: 'cat', name: 'Sleepy cat', price: 80, icon: '🐈', note: 'Naps in the first room' },
  { id: 'plant', name: 'Monstera', price: 60, icon: '🪴', note: 'In the corner of each room' },
  { id: 'moon', name: 'Moon lamp', price: 120, icon: '🌙', note: 'Glows over the whole house' },
  { id: 'stars', name: 'Shooting stars', price: 150, icon: '🌠', note: 'Across the night sky' },
  { id: 'gold', name: 'Golden frame', price: 250, icon: '🖼️', note: 'For houses you know by heart' }
];
const owned = new Set(store.get('rr-v2-decor', []));
const hidden = new Set(store.get('rr-v2-decor-off', []));
/* A decoration shows when it is bought and switched on. */
const shows = id => owned.has(id) && !hidden.has(id);
function applyShooting() { document.body.classList.toggle('shooting', shows('stars')); }
function openShop() {
  $('#shopBal').textContent = `💎 ${gems.total.toLocaleString()}`;
  $('#shopGrid').innerHTML = DECOR.map(d => {
    const has = owned.has(d.id), can = gems.total >= d.price;
    if (has) {
      const on = !hidden.has(d.id);
      return `<div class="shop-item owned ${on ? '' : 'off'}"><span class="shop-ico">${d.icon}</span><b>${esc(d.name)}</b><small>${esc(d.note)}</small>
        <label class="switch"><input type="checkbox" data-toggle="${d.id}" ${on ? 'checked' : ''} /><span aria-hidden="true"></span>${on ? 'On' : 'Off'}</label></div>`;
    }
    return `<button class="shop-item" type="button" data-buy="${d.id}" ${!can ? 'aria-disabled="true"' : ''}><span class="shop-ico">${d.icon}</span><b>${esc(d.name)}</b><small>${esc(d.note)}</small><em>💎 ${d.price}</em></button>`;
  }).join('');
  $$('[data-toggle]').forEach(t => t.addEventListener('change', () => {
    const id = t.dataset.toggle;
    if (t.checked) hidden.delete(id); else hidden.add(id);
    store.set('rr-v2-decor-off', [...hidden]);
    applyShooting(); openShop();
    if (state.screen === 'palace') renderPalace();
  }));
  $$('[data-buy]').forEach(b => b.addEventListener('click', () => {
    const d = DECOR.find(x => x.id === b.dataset.buy);
    if (owned.has(d.id)) return;
    if (gems.total < d.price) { toast(`You need ${d.price - gems.total} more diamonds. Walk a house and recall a few facts.`, 3000); return; }
    gems.total -= d.price; store.set('rr-v2-gems', gems.total); renderGems(true);
    owned.add(d.id); store.set('rr-v2-decor', [...owned]); openShop();
    toast(`${d.name} moved in ${d.icon}`);
    if (state.screen === 'palace') renderPalace();
    applyShooting();
  }));
  $('#shopDialog').hidden = false;
}
$('#gemChip').addEventListener('click', openShop);
$('#gemChip').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openShop(); } });
$('#shopClose').addEventListener('click', () => { $('#shopDialog').hidden = true; });
applyShooting();

/* Fairy lights hang below the room label. In an attic room they follow the slope of the roof. */
function fairyLights(r, poly, u) {
  const drop = Math.max(u * 1.5, r.h * .2);
  let chain;
  if (poly) {
    const bottom = Math.max(...poly.map(p => p[1]));
    const top = poly.filter(p => p[1] < bottom - 1).sort((a, b) => a[0] - b[0]);
    chain = top.map(([x, y], k) => [x + (k === 0 ? u * .6 : k === top.length - 1 ? -u * .6 : 0), y + drop * .8]);
  } else chain = [[r.x + u * .4, r.y + drop], [r.x + r.w - u * .4, r.y + drop]];
  // Sample points along the chain, sag a little between them, and hang a bulb at each.
  const pts = [];
  for (let k = 0; k < chain.length - 1; k++) {
    const [x1, y1] = chain[k], [x2, y2] = chain[k + 1];
    const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / (u * 1.4)));
    for (let j = 0; j < n; j++) pts.push([x1 + (x2 - x1) * j / n, y1 + (y2 - y1) * j / n]);
  }
  pts.push(chain[chain.length - 1]);
  let path = `M${pts[0][0]} ${pts[0][1]}`, bulbs = '';
  for (let k = 1; k < pts.length; k++) {
    const [ax, ay] = pts[k - 1], [bx, by] = pts[k];
    path += ` Q${(ax + bx) / 2} ${(ay + by) / 2 + u * .5} ${bx} ${by}`;
    bulbs += `<circle class="fairy" cx="${(ax + bx) / 2}" cy="${(ay + by) / 2 + u * .32}" r="${u * .15}" fill="${['#ffd58a', '#f8ccaa', '#f3d9d6'][k % 3]}" style="animation-delay:${k * .3}s"/>`;
  }
  return `<path d="${path}" fill="none" stroke="#3a2a26" stroke-width="${u * .06}" opacity=".7"/>${bulbs}`;
}

/* Decorations are drawn on top of each room of the walk view. */
function decorSvg(slots, house, polys = []) {
  if (![...owned].some(shows) || !slots?.length) return '';
  let s = '';
  slots.forEach((r, i) => {
    const u = Math.min(r.w, r.h) / 10;
    if (shows('lights')) s += fairyLights(r, polys[i], u);
    if (shows('plant')) s += `<text x="${r.x + u * .3}" y="${r.y + r.h - u * .35}" font-size="${u * 1.6}">🪴</text>`;
    if (shows('cat') && i === 0) s += `<text x="${r.x + r.w - u * 2.1}" y="${r.y + r.h - u * .3}" font-size="${u * 1.5}">🐈</text>`;
    if (shows('gold') && house && houseSummary(house).fresh === house.rooms.reduce((a, x) => a + x.items.length, 0)) s += `<rect x="${r.x + 2}" y="${r.y + 2}" width="${r.w - 4}" height="${r.h - 4}" fill="none" stroke="#e7b75a" stroke-width="${u * .25}" rx="${u * .2}"/>`;
  });
  if (shows('moon')) { const r = slots[0]; const u = Math.min(r.w, r.h) / 10; s += `<text x="${r.x + r.w - u * 1.6}" y="${r.y + u * 2.2}" font-size="${u * 1.3}" class="moonlamp">🌙</text>`; }
  return `<g class="decor" pointer-events="none">${s}</g>`;
}
