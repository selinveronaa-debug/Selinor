/**
 * RoomRecall · social/challenge.js
 * One shared house per week for the whole class.
 */

/* ---------- Weekly challenge: one shared house for the whole class ---------- */
const weekNo = () => { const d = new Date(); const j = new Date(d.getFullYear(), 0, 1); return `${d.getFullYear()}-w${Math.ceil(((d - j) / DAY + j.getDay() + 1) / 7)}`; };
let challenge = null;
function watchChallenge() {
  if (!NET.db || watchChallenge.on) return; watchChallenge.on = true;
  try { NET.db.doc('challenge/current').onSnapshot(s => { challenge = s.exists ? s.data() : null; renderChallenge(); }, () => { }); } catch { /* challenge stays hidden */ }
}
function renderChallenge() {
  const card = $('#challengeCard');
  if (!challenge?.house) { card.hidden = true; return; }
  const h = challenge.house; const fresh = challenge.week === weekNo();
  card.hidden = false;
  card.innerHTML = `<img src="${esc(FACADES[h.facade]?.src || FACADES.cottage.src)}" alt="" /><div><p class="eyebrow" style="margin:0">${fresh ? 'THIS WEEK’S CHALLENGE' : 'LAST CHALLENGE'}</p><b>${esc(h.course)}</b><small>${h.rooms.length} rooms · ${h.rooms.reduce((a, r) => a + r.items.length, 0)} spots · most diamonds wins</small></div><button class="btn primary small" type="button" id="playChallenge">Play →</button>`;
  $('#playChallenge').addEventListener('click', () => {
    const id = `challenge-${challenge.week}`;
    const copy = { ...structuredClone(h), id, challenge: challenge.week, lot: state.houses.find(x => x.id === id)?.lot };
    if (!state.houses.find(x => x.id === id)) { state.houses.push(copy); assignLots(state.houses); saveHouses(); }
    openHouse(id);
  });
}
$('#challengeSet').addEventListener('click', async () => {
  const h = state.house; if (!h || !NET.db) return;
  const house = { course: h.course, facade: CUTAWAYS[h.facade] ? h.facade : 'cottage', style: h.style, perRoom: h.perRoom, rooms: h.rooms.map(r => ({ slot: r.slot, spots: r.spots, type: r.type, label: r.label, topic: r.topic, items: r.items })) };
  try { await NET.db.doc('challenge/current').set({ week: weekNo(), house, setAt: Date.now() }); toast('This house is now the weekly challenge ★'); }
  catch { toast('Only the owner of this page can set the weekly challenge.'); }
});
