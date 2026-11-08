/**
 * RoomRecall · social/cities.js
 * Shared streets, borrowing houses and leaderboards (the artifact `db` and `user` capabilities).
 */

/* ---------- Cities and leaderboard (shared db) ---------- */
const NET = { db: null, user: null, me: null, ready: false, cities: [], scores: [], unsub: [] };
const courseKey = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60);
let boardCourse = '';
(async () => {
  try {
    if (!window.claude?.use) throw 0;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    NET.db = db; NET.user = user;
    if (user) { NET.me = await user.id().catch(() => null); NET.isOwner = Boolean(user.isOwner?.()); }
    watchChallenge();
  } catch { /* offline */ }
  NET.ready = true;
  if (state.screen === 'cities') openCities();
})();
const localScores = () => store.get('rr-v2-scores', {});
async function saveScore(course, score, total) {
  const key = courseKey(course); if (!key) return;
  const pct = Math.round(score / total * 100);
  const loc = localScores(); const prev = loc[key];
  if (!prev || pct >= prev.pct) { loc[key] = { course, score, total, pct, at: Date.now() }; store.set('rr-v2-scores', loc); }
  if (!NET.db || !NET.me) { $('#boardStatus').textContent = 'Score saved on this device.'; return; }
  try {
    const ref = NET.db.doc(`scores/${NET.me}`);
    const snap = await ref.get();
    const entries = { ...(snap.exists ? snap.data().entries || {} : {}) };
    if (!entries[key] || pct >= entries[key].pct) {
      entries[key] = { course: String(course).slice(0, 60), score, total, pct, at: Date.now() };
      await ref.set({ entries, gems: gems.total });
      $('#boardStatus').textContent = prev && pct > prev.pct ? 'New personal best, saved to the leaderboard ✦' : 'Saved to the shared leaderboard.';
    } else { await ref.set({ entries, gems: gems.total }); $('#boardStatus').textContent = `Your best for this course is still ${entries[key].pct}%.`; }
  } catch { $('#boardStatus').textContent = 'Score saved on this device. The shared leaderboard is not reachable here.'; }
}
function openCities() {
  if (!NET.ready) { $('#cityStatus').textContent = 'Connecting…'; return; }
  if (!NET.db) {
    $('#cityStatus').textContent = '';
    $('#cityList').innerHTML = `<div class="empty" style="color:var(--muted-on-night);border-color:rgba(247,230,220,.3)">Open RoomRecall on claude.ai while signed in to visit classmates’ streets. Your own houses still work offline.</div>`;
    renderBoard(); return;
  }
  if (!NET.unsub.length) {
    NET.unsub.push(NET.db.collection('cities').onSnapshot(s => { NET.cities = s.docs.map(d => ({ id: d.id, ...d.data() })); renderCities(); }, () => { $('#cityStatus').textContent = 'Could not load cities right now.'; }));
    NET.unsub.push(NET.db.collection('scores').onSnapshot(s => { NET.scores = s.docs.map(d => ({ id: d.id, ...d.data() })); renderBoard(); }, () => { }));
    $('#cityStatus').textContent = 'Loading streets…';
  }
  renderCities(); renderBoard();
}
async function profilesFor(ids) {
  if (!NET.user || !ids.length) return {};
  try { return await NET.user.profiles(ids); } catch { return {}; }
}
async function renderCities() {
  const list = NET.cities.filter(c => Array.isArray(c.houses) && c.houses.length);
  const ps = await profilesFor(list.map(c => c.id));
  $('#cityStatus').textContent = list.length ? `${list.length} street${list.length > 1 ? 's' : ''} shared` : '';
  if (!list.length) { $('#cityList').innerHTML = `<div class="empty" style="color:var(--muted-on-night);border-color:rgba(247,230,220,.3)">No streets shared yet. Share yours, then send the link to your study group.</div>`; return; }
  $('#cityList').innerHTML = list.map(c => {
    const p = ps[c.id] || {}; const mine = c.id === NET.me;
    return `<div class="city"><div class="city-head">${p.avatarUrl ? `<img src="${esc(p.avatarUrl)}" alt="" />` : ''}<b class="city-name" data-uid="${esc(c.id)}"></b>${mine ? '<span class="chip">you</span>' : ''}<button class="btn small primary" type="button" data-visit="${esc(c.id)}" style="margin-left:auto">Visit street →</button></div>
      <div class="city-houses">${c.houses.slice(0, 12).map((h, hi) => `<div class="city-house"><img src="${esc(FACADES[h.facade]?.src || FACADES.cottage.src)}" alt="" /><div><b>${esc(h.course)}</b><small>${h.rooms?.length || 0} rooms · ${esc((h.rooms || []).map(r => r.topic).filter(Boolean).slice(0, 2).join(', '))}</small></div>${mine ? '' : `<button class="btn small rose" type="button" data-borrow="${esc(c.id)}:${hi}">Borrow</button>`}</div>`).join('')}</div></div>`;
  }).join('');
  $$('.city-name').forEach(el => { const p = ps[el.dataset.uid]; el.textContent = (p && p.name) ? `${p.name}’s street` : 'A classmate’s street'; });
  $$('[data-visit]').forEach(b => b.addEventListener('click', () => visitStreet(b.dataset.visit, ps[b.dataset.visit]?.name)));
  bindBorrow();
}
function bindBorrow() {
  $$('[data-borrow]').forEach(b => b.addEventListener('click', () => {
    const [uid, hi] = b.dataset.borrow.split(':'); const h = NET.cities.find(c => c.id === uid)?.houses?.[+hi]; if (!h) return;
    state.draft = newDraft({ course: h.course, facade: FACADES[h.facade] ? h.facade : 'cottage', count: h.rooms.length, perRoom: h.perRoom || 4, courseNotes: h.courseNotes || '', rooms: h.rooms.map(r => ({ type: ROOM_TYPES[r.type] ? r.type : 'living', label: ROOM_TYPES[r.type]?.label || 'Room', topic: r.topic || '', notes: r.notes || '', files: [] })) });
    renderRooms(); show('rooms'); toast('Borrowed. Claude will furnish your own copy of this house.');
  }));
}
/* Walk down a classmate's shared street. */
function visitStreet(uid, name) {
  const city = NET.cities.find(c => c.id === uid); if (!city) return;
  const houses = city.houses || []; const mine = uid === NET.me;
  $('#visitTitle').innerHTML = mine ? 'Your <em>shared street</em>' : `${esc(name || 'A classmate')}’s <em>street</em>`;
  show('visit');
  const pick = id => { const hi = houses.findIndex(h => h.id === id); const el = $(`#visitHouses [data-vh="${hi}"]`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } };
  renderStreetInto($('#visitTrack'), assignLots(houses.map(h => ({ ...h }))), { open: pick, empty: () => toast('This lot is still empty on their street.', 2500) });
  $('#visitHouses').innerHTML = houses.length ? houses.map((h, hi) => `<div class="city-house" data-vh="${hi}"><img src="${esc(FACADES[h.facade]?.src || FACADES.cottage.src)}" alt="" /><div><b>${esc(h.course)}</b><small>${h.rooms?.length || 0} rooms · ${esc((h.rooms || []).map(r => r.topic).filter(Boolean).join(', '))}</small></div>${mine ? '' : `<button class="btn small rose" type="button" data-borrow="${esc(uid)}:${hi}">Borrow</button>`}</div>`).join('') : '<div class="empty">No houses on this street yet.</div>';
  bindBorrow();
}
async function renderBoard() {
  const remote = NET.scores.flatMap(s => Object.entries(s.entries || {}).map(([k, e]) => ({ uid: s.id, key: k, ...e })));
  const rows = remote.length ? remote : Object.entries(localScores()).map(([k, e]) => ({ uid: NET.me || 'me', key: k, ...e }));
  const courses = [['__gems', '💎 Diamonds'], ...new Map(rows.map(r => [r.key, r.course])).entries()];
  if (!boardCourse || !courses.find(([k]) => k === boardCourse)) boardCourse = courses[1]?.[0] || '__gems';
  $('#boardCourses').innerHTML = courses.map(([k, c]) => `<button class="pill ${k === boardCourse ? 'active' : ''}" type="button" data-board="${esc(k)}">${esc(c)}</button>`).join('');
  $$('[data-board]').forEach(b => b.addEventListener('click', () => { boardCourse = b.dataset.board; renderBoard(); }));
  if (boardCourse === '__gems') {
    const g = NET.scores.length ? NET.scores.map(x => ({ uid: x.id, gems: x.gems || 0 })) : [{ uid: NET.me || 'me', gems: gems.total }];
    const top = g.sort((a, b) => b.gems - a.gems).slice(0, 15);
    const psg = await profilesFor(top.map(r => r.uid).filter(id => id && id !== 'me'));
    $('#boardWrap').innerHTML = `<table class="board"><thead><tr><th>#</th><th>STUDENT</th><th>DIAMONDS</th></tr></thead><tbody>${top.map((r, i) => `<tr class="${r.uid === NET.me || r.uid === 'me' ? 'me' : ''}"><td class="rank">${i + 1}</td><td class="bname" data-uid="${esc(r.uid)}"></td><td>💎 ${r.gems.toLocaleString()}</td></tr>`).join('')}</tbody></table>`;
    $$('.bname').forEach(td => { const id = td.dataset.uid; td.textContent = id === NET.me || id === 'me' ? 'You' : (psg[id]?.name || 'Classmate'); });
    return;
  }
  const list = rows.filter(r => r.key === boardCourse).sort((a, b) => b.pct - a.pct || a.at - b.at).slice(0, 15);
  if (!list.length) { $('#boardWrap').innerHTML = `<div class="empty">Finish a quiz and your score lands here. Beat your classmates on the same course.</div>`; return; }
  const ps = await profilesFor([...new Set(list.map(r => r.uid))].filter(id => id && id !== 'me'));
  $('#boardWrap').innerHTML = `<table class="board"><thead><tr><th>#</th><th>STUDENT</th><th>BEST</th><th>SCORE</th></tr></thead><tbody>${list.map((r, i) => `<tr class="${r.uid === NET.me || r.uid === 'me' ? 'me' : ''}"><td class="rank">${i + 1}</td><td class="bname" data-uid="${esc(r.uid)}"></td><td>${r.pct}%</td><td>${r.score}/${r.total}</td></tr>`).join('')}</tbody></table>`;
  $$('.bname').forEach(td => { const id = td.dataset.uid; td.textContent = id === NET.me || id === 'me' ? 'You' : (ps[id]?.name || 'Classmate'); });
}
$('#citiesBtn').addEventListener('click', () => show('cities'));
$('#aboutBtn').addEventListener('click', () => show('about'));
$('#shareCity').addEventListener('click', async () => {
  if (!NET.db || !NET.me) { toast('Sharing needs RoomRecall open on claude.ai while signed in.'); return; }
  const mine = state.houses.filter(h => !h.demo);
  if (!mine.length) { toast('Build a course house first, then share your street.'); return; }
  const houses = mine.slice(0, 10).map(h => ({ id: h.id, lot: h.lot ?? null, course: h.course, facade: FACADES[h.facade] ? h.facade : 'cottage', perRoom: h.perRoom || 4, courseNotes: (h.courseNotes || '').slice(0, 12000), rooms: h.rooms.map(r => ({ type: r.type, topic: r.topic, notes: (r.notes || '').slice(0, 6000) })) }));
  try { await NET.db.doc(`cities/${NET.me}`).set({ houses, updatedAt: Date.now() }); toast('Your street is shared ✦'); }
  catch (e) { toast(e?.code === 'invalid_argument' ? 'You can only read streets on this link. Ask the owner for Contributor access.' : 'Could not share right now. Try again.'); }
});
