/**
 * RoomRecall · core/state.js
 * App state, saved houses and the memory-health model (new · fresh · due · weak).
 */

/* ---------- State ---------- */
const HOUSES_KEY = 'rr-v2-houses';
const state = {
  houses: store.get(HOUSES_KEY, []),
  draft: null,
  house: null,
  walk: { room: -1, item: 0, recall: false },
  quiz: null,
  commute: { line: '5', variant: 'ring', stops: [], memories: [], idx: 0, questions: [] },
  selectedRoom: 0
};
// Houses saved by the earlier code-drawn version have no room slots: refresh the demo, map the rest by order.
state.houses = state.houses.map(h => {
  const demo = DEMOS.find(d => d.id === h.id); if (demo) return structuredClone(demo);
  if (CUTAWAYS[h.facade] && h.rooms.some(r => r.slot === undefined)) {
    const n = CUTAWAYS[h.facade].rooms.length;
    return { ...h, rooms: h.rooms.slice(0, n).map((r, i) => ({ ...r, slot: i, label: CUTAWAYS[h.facade].rooms[i].label, items: r.items.filter(it => it.obj < CUTAWAYS[h.facade].rooms[i].objects.length) })) };
  }
  return h;
});
// First visit: move both ready-made demos onto the street so it never starts empty.
if (!store.get('rr-v2-seeded', false) && !state.houses.length) {
  state.houses = DEMOS.map(d => structuredClone(d));
  store.set('rr-v2-seeded', true);
}
function saveHouses() {
  if (!store.set(HOUSES_KEY, state.houses)) {
    const slim = state.houses.map(h => ({ ...h, facadeSrc: h.facadeSrc && h.facadeSrc.length > 200000 ? null : h.facadeSrc, rooms: h.rooms.map(r => ({ ...r, photo: null })) }));
    store.set(HOUSES_KEY, slim);
  }
}
function upsertHouse(h) {
  const i = state.houses.findIndex(x => x.id === h.id);
  if (i === -1) state.houses.push(h); else state.houses[i] = h;
  saveHouses();
}
function facadeSrcOf(h) { return h.facadeSrc || FACADES[h.facade]?.src || FACADES.cottage.src; }

function isCut(f) { return Boolean(CUTAWAYS[f]); }
function drawFor(h, mode, extra = {}) {
  if (isCut(h.facade)) return drawCutaway({ facade: h.facade, used: h.rooms.map(r => r.slot), mode, ...extra });
  return drawDollhouse({ rooms: h.rooms, style: h.style, palette: h.palette, mode, uid: mode, ...extra });
}
/* Every object a room offers, in order. */
function objectNames(h, r) {
  if (isCut(h.facade)) return CUTAWAYS[h.facade].rooms[r.slot].objects.map(o => o[0]);
  if (r.photo && r.photoObjects?.length) return r.photoObjects.map(o => o.name);
  return ROOM_TYPES[r.type].objects.map(o => o.name);
}
/* Make sure each room has an ordered list of chosen spots (object indices). */
function ensureSpots(d) {
  d.rooms.forEach(r => {
    const n = objectNames(d, r).length;
    if (r.photo && r.photoObjects?.length) { r.spots = r.photoObjects.map((_, i) => i); return; }
    if (Array.isArray(r.spots)) { r.spots = r.spots.filter(i => i < n); return; }
    // A new room starts with the first few objects; the student can add or remove any of them.
    r.spots = Array.from({ length: Math.min(d.perRoom, n) }, (_, i) => i);
  });
}
function spotsFor(h, r) { const names = objectNames(h, r); return (r.spots || names.map((_, i) => i)).map(i => names[i]); }
function cutRoom(facade, slot) { const c = CUTAWAYS[facade].rooms[slot]; return { slot, type: c.type, label: c.label, topic: '', notes: '', files: [] }; }

/* ---------- Memory health ----------
   Every spot keeps a tiny history. From it we derive one of four states:
   new (never tested), fresh (recalled recently), due (time to review on the 1-3-7 day rhythm)
   and weak (missed more than recalled, or missed last time). */
const STATS_KEY = 'rr-v2-stats';
const DAY = 86400000;
const REVIEW_STEPS = [1, 3, 7, 14, 30];
const memStats = store.get(STATS_KEY, {});
const spotKey = (h, ri, ii) => `${h.id}|${ri}|${ii}`;
function spotStat(h, ri, ii) { return memStats[spotKey(h, ri, ii)] || { right: 0, wrong: 0, streak: 0, last: 0, lastRight: null }; }
function recordAnswer(h, ri, ii, right) {
  const k = spotKey(h, ri, ii); const st = { ...spotStat(h, ri, ii) };
  if (right) { st.right++; st.streak++; } else { st.wrong++; st.streak = 0; }
  st.last = Date.now(); st.lastRight = right;
  memStats[k] = st; store.set(STATS_KEY, memStats);
}
function spotHealth(h, ri, ii, now = Date.now()) {
  const st = spotStat(h, ri, ii);
  if (!st.last) return 'new';
  if (st.lastRight === false || (st.wrong >= 2 && st.wrong > st.right)) return 'weak';
  const gap = REVIEW_STEPS[Math.min(st.streak, REVIEW_STEPS.length) - 1] || 1;
  return now - st.last > gap * DAY ? 'due' : 'fresh';
}
const HEALTH_RANK = { weak: 3, due: 2, new: 1, fresh: 0 };
function roomHealth(h, ri) { return h.rooms[ri].items.reduce((w, _, ii) => { const s = spotHealth(h, ri, ii); return HEALTH_RANK[s] > HEALTH_RANK[w] ? s : w; }, 'fresh'); }
function houseSummary(h) {
  const c = { new: 0, fresh: 0, due: 0, weak: 0 }; let last = 0;
  h.rooms.forEach((r, ri) => r.items.forEach((_, ii) => { c[spotHealth(h, ri, ii)]++; last = Math.max(last, spotStat(h, ri, ii).last); }));
  const tested = c.fresh + c.due + c.weak;
  return { ...c, tested, needs: c.due + c.weak, neglected: tested > 0 && Date.now() - last > 10 * DAY };
}
