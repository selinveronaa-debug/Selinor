/**
 * RoomRecall · walk/walk.js
 * Walking the memory palace room by room, with zoom, pins, hover answers and memory lights.
 */

/* ---------- Walk the palace ---------- */
let zoomAnim = null;
function animateViewBox(svg, to, ms = 650) {
  const from = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
  cancelAnimationFrame(zoomAnim);
  if (reduceMotion || from.length !== 4) { svg.setAttribute('viewBox', to.join(' ')); return; }
  const t0 = performance.now();
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const step = now => {
    const k = ease(Math.min(1, (now - t0) / ms));
    svg.setAttribute('viewBox', from.map((f, i) => f + (to[i] - f) * k).join(' '));
    if (k < 1) zoomAnim = requestAnimationFrame(step);
  };
  zoomAnim = requestAnimationFrame(step);
}
function openHouse(id, opts = {}) {
  const demo = DEMOS.find(d => d.id === id);
  const h = state.houses.find(x => x.id === id) || (demo ? structuredClone(demo) : null);
  if (!h) return;
  state.house = h;
  state.walk = { room: -1, item: 0, recall: false, warmup: Boolean(opts.warmup) };
  $('#palaceTitle').textContent = h.course;
  $('#palaceCrumb').textContent = `${(FACADES[h.facade]?.label || 'Your house').toUpperCase()} · ${h.rooms.length} ROOMS · ${h.rooms.reduce((n, r) => n + r.items.length, 0)} SPOTS`;
  show('palace');
  renderPalace(true);
}
$('#palaceBack').addEventListener('click', () => show('home'));
$('#delHouse').addEventListener('click', () => { $('#delHouse').hidden = true; $('#delConfirm').hidden = false; });
$('#delNo').addEventListener('click', () => { $('#delHouse').hidden = false; $('#delConfirm').hidden = true; });
$('#delYes').addEventListener('click', async () => {
  const h = state.house; if (!h) return;
  state.houses = state.houses.filter(x => x.id !== h.id); saveHouses();
  if (NET.db && NET.me) {
    try { const ref = NET.db.doc(`cities/${NET.me}`); const snap = await ref.get(); if (snap.exists && (snap.data().houses || []).some(x => x.id === h.id)) await ref.set({ ...snap.data(), houses: snap.data().houses.filter(x => x.id !== h.id), updatedAt: Date.now() }); } catch { }
  }
  state.house = null; show('home'); toast(`${h.course} was removed from your street. The lot is free again.`);
});
function openDemo(demo) {
  if (!state.houses.find(x => x.id === demo.id)) upsertHouse(structuredClone(demo));
  openHouse(demo.id);
}
$('#demoBtn').addEventListener('click', () => openDemo(DEMO_HOUSE));

function pinsFor(h) {
  return h.rooms.map((r, ri) => r.items.map((it, ii) => ({ obj: it.obj, item: ii, n: ii + 1, health: spotHealth(h, ri, ii), state: ri === state.walk.room && ii === state.walk.item ? 'cur' : 'todo' })));
}
function renderPalace(first = false) {
  const h = state.house; const w = state.walk;
  const out = drawFor(h, 'walk', { pins: w.room >= 0 || w.heat ? pinsFor(h) : null });
  out.svg += decorSvg(out.geometry.slots, h, out.geometry.polys || []);
  const stage = $('#palaceStage');
  const prev = stage.querySelector('svg')?.getAttribute('viewBox');
  stage.innerHTML = `${h.facade === 'own' ? `<div class="stage-front"><img src="${esc(facadeSrcOf(h))}" alt="" /><small>FRONT</small></div>` : ''}<svg viewBox="${prev || `${out.full.x} ${out.full.y} ${out.full.w} ${out.full.h}`}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Your memory palace">${out.svg}</svg>`;
  const svg = stage.querySelector('svg');
  if (w.room >= 0 && stage.querySelector('.stage-front')) stage.querySelector('.stage-front').hidden = true;
  let target;
  if (w.room < 0) target = [out.full.x, out.full.y, out.full.w, out.full.h];
  else { const s = out.geometry.slots[w.room]; const pad = 22; target = [s.x - pad, s.y - pad, s.w + pad * 2, s.h + pad * 2]; }
  if (first && !prev) svg.setAttribute('viewBox', [out.full.x, out.full.y, out.full.w, out.full.h].join(' '));
  animateViewBox(svg, target);
  // clicks
  svg.querySelectorAll('[data-pin-room]').forEach(p => {
    const go = () => { w.room = +p.dataset.pinRoom; w.item = +p.dataset.pinItem; renderPalace(); };
    p.addEventListener('click', go); p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  // Every object in a used room glows on hover and shows what is stored there.
  svg.querySelectorAll('.hot,.obj').forEach(o => {
    const room = h.rooms[+o.dataset.room]; if (!room) return;
    const it = room.items.find(x => x.obj === +o.dataset.obj);
    o.dataset.tip = it ? `${cap(it.spot)} · ${it.type === 'formula' ? it.answer : it.question}` : `${cap(o.dataset.tip || 'spot')} · free spot`;
    if (it) o.classList.add('has-item');
  });
  svg.querySelectorAll('[data-pin-room]').forEach(p => {
    const it = h.rooms[+p.dataset.pinRoom]?.items[+p.dataset.pinItem];
    if (it) p.dataset.tip = `${cap(it.spot)} · ${it.type === 'formula' ? it.answer : it.question}`;
  });
  bindTips(stage);
  svg.querySelectorAll('.hot,.obj').forEach(o => o.addEventListener('click', () => {
    const ri = +o.dataset.room, oi = +o.dataset.obj; const room = h.rooms[ri]; if (!room) return;
    const ii = room.items.findIndex(it => it.obj === oi);
    if (ii > -1) { w.room = ri; w.item = ii; renderPalace(); } else toast(`${cap(o.dataset.tip || 'This spot')} is free. Add more spots per room to use it.`, 2500);
  }));
  if (w.room < 0) {
    out.geometry.slots.forEach((s, i) => {
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      Object.entries({ x: s.x, y: s.y, width: s.w, height: s.h, fill: 'transparent', class: 'room-hit', tabindex: 0, role: 'button', 'aria-label': `Walk into the ${h.rooms[i].label.toLowerCase()}` }).forEach(([k, v]) => r.setAttribute(k, v));
      const enter = () => { w.room = i; w.item = 0; renderPalace(); };
      r.addEventListener('click', enter);
      r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } });
      svg.appendChild(r);
    });
  }
  stage.classList.toggle('heat', Boolean(w.heat));
  // tabs carry a small light for the room's memory health
  $('#roomTabs').innerHTML = `<button class="room-tab ${w.room < 0 ? 'active' : ''}" type="button" data-tab="-1">⌂ Whole house</button>` + h.rooms.map((r, i) => `<button class="room-tab ${w.room === i ? 'active' : ''}" type="button" data-tab="${i}"><i class="hdot h-${roomHealth(h, i)}" aria-hidden="true"></i>${i + 1} · ${esc(r.label)}</button>`).join('');
  $$('[data-tab]').forEach(b => b.addEventListener('click', () => { w.room = +b.dataset.tab; w.item = 0; renderPalace(); }));
  renderMemCard();
  sharePresence(); drawPeerMarkers();
  $('#challengeSet').hidden = !(NET.user && NET.isOwner && NET.db && !h.challenge);
}

function renderMemCard() {
  const h = state.house; const w = state.walk; const body = $('#memBody');
  if (w.room < 0) {
    const total = h.rooms.reduce((n, r) => n + r.items.length, 0);
    $('#memBar').textContent = 'route.txt';
    body.innerHTML = `
      <p class="eyebrow" style="margin:0">${w.warmup ? 'FIRST: LEARN THE ROUTE' : 'YOUR ROUTE'}</p>
      <div class="mem-q">${esc(h.rooms.length)} rooms, ${total} spots, always walked in this order.</div>
      <ol style="margin:0;padding-left:18px;display:grid;gap:6px;color:var(--cocoa-2);font-size:13px">${h.rooms.map(r => `<li><b style="color:var(--cocoa)">${esc(r.label)}</b> · ${esc(r.topic)}<br><span style="font-size:12px">${r.items.map(it => esc(plain(it.spot))).join(' → ')}</span></li>`).join('')}</ol>
      ${(() => { const sm = houseSummary(h); return sm.tested ? `<div class="health-row"><span><i class="hdot h-fresh"></i>${sm.fresh} fresh</span><span><i class="hdot h-due"></i>${sm.due} due</span><span><i class="hdot h-weak"></i>${sm.weak} weak</span><span><i class="hdot h-new"></i>${sm.new} new</span></div>` : '<p style="margin:0;font-size:12px">Memory athletes learn the spots before they store anything on them. Take the one-minute route check, then walk room by room.</p>'; })()}
      <label class="heat-toggle"><input type="checkbox" id="heatToggle" ${w.heat ? 'checked' : ''}/> Show memory lights in the house</label>
      <div style="display:grid;gap:8px;margin-top:auto">
        <button class="btn rose" id="routeCheck" type="button">Route check: name the spots</button>
        <button class="btn ink" id="startWalk" type="button">Walk room by room →</button>
        ${houseSummary(h).needs ? `<button class="btn ink" id="weakWalk" type="button">Review ${houseSummary(h).needs} due and weak spots</button>` : ''}
        <button class="btn primary" id="testAll" type="button">Test me on everything</button>
      </div>`;
    $('#routeCheck').addEventListener('click', startRouteQuiz);
    $('#heatToggle').addEventListener('change', e => { w.heat = e.target.checked; renderPalace(); });
    $('#weakWalk')?.addEventListener('click', () => startQuiz('house', { only: ['weak', 'due'] }));
    $('#startWalk').addEventListener('click', () => { w.room = 0; w.item = 0; renderPalace(); });
    $('#testAll').addEventListener('click', () => startQuiz('house'));
    return;
  }
  const room = h.rooms[w.room]; const it = room.items[w.item];
  const totalBefore = h.rooms.slice(0, w.room).reduce((n, r) => n + r.items.length, 0);
  const lastRoom = w.room === h.rooms.length - 1, lastItem = w.item === room.items.length - 1;
  $('#memBar').textContent = `spot ${String(totalBefore + w.item + 1).padStart(2, '0')}`;
  const hidden = w.recall && !w.revealed;
  body.innerHTML = `
    <div class="mem-where">${esc(room.label.toUpperCase())} · ${esc(room.topic.toUpperCase())}</div><div><span class="hpill h-${spotHealth(h, w.room, w.item)}">${({ new: 'not tested yet', fresh: 'fresh', due: 'due for review', weak: 'weak spot' })[spotHealth(h, w.room, w.item)]}</span></div>
    <div class="progress-dots" aria-hidden="true">${room.items.map((_, i) => `<i class="${i <= w.item ? 'on' : ''}"></i>`).join('')}</div>
    <div style="display:flex;align-items:center;gap:10px"><span style="font-size:30px">${esc(it.emoji || '✦')}</span><b style="font-family:var(--f-display);font-weight:400;font-size:22px;color:var(--cocoa)">${esc(cap(it.spot))}</b></div>
    <div class="mem-q">${esc(it.question)}</div>
    ${hidden ? `<button class="btn rose" id="reveal" type="button">Picture it first, then reveal</button>` : `
    <div class="mem-a ${it.type === 'formula' ? 'formula' : ''}">${esc(it.answer)}</div>
    <p class="mem-story" id="memStory">${esc(it.story)}</p>
    ${it.explanation ? `<p style="margin:0;font-size:12px">${esc(it.explanation)}</p>` : ''}`}
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <label style="display:flex;gap:6px;align-items:center;font-size:12px;font-weight:800;cursor:pointer"><input type="checkbox" id="recallToggle" ${w.recall ? 'checked' : ''}/> Recall mode</label>
      ${!hidden ? `<button class="link" id="ownPic" type="button">✎ Write my own picture</button>` : ''}
      ${aiOn() && !hidden ? `<button class="link" id="weirder" type="button">✦ Make it weirder</button>` : ''}
    </div>
    <div class="mem-nav">
      <button class="circle" id="memPrev" type="button" aria-label="Previous spot" ${w.room === 0 && w.item === 0 ? 'disabled' : ''}>←</button>
      <button class="btn ink" id="memNext" type="button">${lastItem ? (lastRoom ? 'Test my memory →' : `Next room: ${esc(h.rooms[w.room + 1].label)} →`) : 'Next spot →'}</button>
    </div>`;
  $('#reveal')?.addEventListener('click', () => { w.revealed = true; renderMemCard(); });
  $('#recallToggle').addEventListener('change', e => { w.recall = e.target.checked; w.revealed = false; renderMemCard(); });
  $('#weirder')?.addEventListener('click', async e => {
    const b = e.target; b.disabled = true; b.textContent = '✦ Thinking of something stranger…';
    try { it.story = await aiWeirder(it, h.course); if (!h.demo || state.houses.find(x => x.id === h.id)) upsertHouse(h); renderMemCard(); }
    catch (err) { aiErrorText(err); b.textContent = 'Could not rewrite it right now'; }
  });
  $('#ownPic')?.addEventListener('click', () => openOwnPicture(h, it));
  $('#memPrev').addEventListener('click', stepBack);
  $('#memNext').addEventListener('click', stepForward);
}
function stepForward() {
  const h = state.house, w = state.walk; if (w.room < 0) { w.room = 0; w.item = 0; renderPalace(); return; }
  w.revealed = false;
  if (w.item < h.rooms[w.room].items.length - 1) w.item++;
  else if (w.room < h.rooms.length - 1) { w.room++; w.item = 0; }
  else { startQuiz('house'); return; }
  renderPalace();
}
function stepBack() {
  const h = state.house, w = state.walk; w.revealed = false;
  if (w.item > 0) w.item--; else if (w.room > 0) { w.room--; w.item = h.rooms[w.room].items.length - 1; } else return;
  renderPalace();
}
