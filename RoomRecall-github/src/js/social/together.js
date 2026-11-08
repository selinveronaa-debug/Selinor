/**
 * RoomRecall · social/together.js
 * Walk the same house live with classmates (the artifact `room` capability).
 */

/* ---------- Study together: walk the same house live (room capability) ---------- */
const live = { room: null, unsub: [], on: false };
async function toggleTogether() {
  if (live.on) { await leaveTogether(); return; }
  const room = window.claude?.use ? await window.claude.use('room').catch(() => null) : null;
  if (!room) { toast('Studying together works when RoomRecall is open on claude.ai.'); return; }
  try {
    live.room = await room.join(`walk-${courseKey(state.house.course).replace(/[^a-z0-9-]/g, '-').slice(0, 40)}`);
    live.on = true; $('#togetherBtn').textContent = '👥 Leave group';
    live.unsub.push(live.room.onPeers(() => renderPeers()));
    sharePresence(); renderPeers();
    toast('You are in the study group. Anyone who opens this course house joins you.');
  } catch { toast('Could not join the study group right now.'); }
}
async function leaveTogether() {
  live.unsub.forEach(u => u()); live.unsub = [];
  try { await live.room?.leave(); } catch { }
  live.room = null; live.on = false; $('#togetherBtn').textContent = '👥 Study together'; $('#peerChips').innerHTML = '';
  if (state.screen === 'palace') renderPalace();
}
function sharePresence() { if (live.on) live.room.presence({ room: state.walk.room, item: state.walk.item }).catch(() => { }); }
async function renderPeers() {
  if (!live.on) return;
  const others = live.room.peers().filter(p => !p.isMe);
  const ps = await profilesFor(others.map(p => p.by).filter(Boolean));
  $('#peerChips').innerHTML = others.length ? others.map(p => { const pr = ps[p.by] || {}; const r = state.house.rooms[p.presence?.room]; return `<span class="peer"><img src="${esc(pr.avatarUrl || '')}" alt="" /><span class="pname"></span><small>${r ? esc(r.label) : 'looking around'}</small></span>`; }).join('') : '<span class="peer-wait">waiting for classmates…</span>';
  $$('#peerChips .pname').forEach((el, i) => { el.textContent = (ps[others[i].by]?.name || 'Classmate').split(' ')[0]; });
  live.others = others;
  if (state.screen === 'palace') drawPeerMarkers();
}
function drawPeerMarkers() {
  const svg = $('#palaceStage svg'); if (!svg || !live.on) return;
  svg.querySelectorAll('.peer-mark').forEach(n => n.remove());
  (live.others || []).forEach((p, k) => {
    const pin = svg.querySelector(`[data-pin-room="${p.presence?.room}"][data-pin-item="${p.presence?.item}"] circle:not(.pin-health):not(.pin-ring)`);
    if (!pin) return;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const r = +pin.getAttribute('r');
    Object.entries({ cx: +pin.getAttribute('cx') + r * (1 + k * .4), cy: +pin.getAttribute('cy') - r, r: r * .45, class: 'peer-mark', fill: '#8c9a72', stroke: '#3a2a26', 'stroke-width': r * .12 }).forEach(([a, v]) => c.setAttribute(a, v));
    svg.appendChild(c);
  });
}
$('#togetherBtn').addEventListener('click', toggleTogether);
