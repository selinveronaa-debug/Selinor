/**
 * RoomRecall · build/build.js
 * Building a course house: pick a house, choose rooms and spots, then let Claude furnish it.
 */

/* ---------- Step 1: choose a house ---------- */
function newDraft(base = {}) {
  const facade = base.facade || 'cottage';
  const count = base.count || 3;
  const types = FACADES[facade]?.rooms || ROOM_ORDER;
  const cut = CUTAWAYS[facade];
  return {
    id: base.id || `h-${Date.now()}`,
    course: base.course || '',
    facade, facadeSrc: base.facadeSrc || null,
    style: base.style || facade,
    count: cut ? Math.min(count, cut.rooms.length) : count, perRoom: base.perRoom || 4,
    courseNotes: base.courseNotes || '', courseFiles: [],
    rooms: base.rooms || (cut ? cut.rooms.slice(0, Math.min(count, cut.rooms.length)).map((_, i) => cutRoom(facade, i)) : Array.from({ length: count }, (_, i) => ({ type: types[i % types.length], label: ROOM_TYPES[types[i % types.length]].label, topic: '', notes: '', files: [] })))
  };
}
function startBuild(facade, lot) {
  state.draft = newDraft(typeof facade === 'string' ? { facade } : {});
  state.draft.lot = Number.isInteger(lot) ? lot : null;
  houseTab = FACADES[state.draft.facade]?.group || 'cozy';
  $$('[data-house-tab]').forEach(x => { x.classList.toggle('active', x.dataset.houseTab === houseTab); x.setAttribute('aria-selected', String(x.dataset.houseTab === houseTab)); });
  renderBuild(); show('build');
}
$('#startBtn').addEventListener('click', () => startBuild());

let houseTab = 'cozy';
$$('[data-house-tab]').forEach(b => b.addEventListener('click', () => {
  houseTab = b.dataset.houseTab;
  $$('[data-house-tab]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', String(x === b)); });
  renderHouseGrid();
}));
function renderHouseGrid() {
  const d = state.draft;
  const grid = $('#houseGrid');
  if (houseTab === 'own') {
    grid.innerHTML = `<label class="facade ${d.facade === 'own' ? 'active' : ''}" for="ownFacade"><input id="ownFacade" type="file" accept="image/*" />${d.facadeSrc ? `<img src="${esc(d.facadeSrc)}" alt="Your house" />` : '<span class="upl">＋</span>'}<b>${d.facadeSrc ? 'Your house' : 'Upload a photo'}</b><small>THE OUTSIDE OF ANY HOME</small></label>
      <div class="facade" style="justify-content:center;text-align:center"><small style="line-height:1.5">Tip: pick a place you know with your eyes closed, like the home you grew up in or where you live now. You already know the way through it.</small></div>`;
    $('#ownFacade').addEventListener('change', async e => {
      const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
      let photo;
      try { photo = await loadPhoto(f); } catch (err) { toast(err.message, 8000); return; }
      const wasCut = isCut(d.facade); d.facade = 'own'; d.style = 'own'; d.facadeSrc = photo.src;
      d.palette = await paletteFrom(photo.src);
      if (wasCut) d.rooms = d.rooms.map((r, i) => ({ ...r, slot: undefined, spots: undefined, type: ROOM_ORDER[i % 6], label: ROOM_TYPES[ROOM_ORDER[i % 6]].label }));
      renderBuild();
      toast('Your house is in. Next, add a photo of each room.', 4000);
    });
    return;
  }
  grid.innerHTML = Object.entries(FACADES).filter(([, f]) => f.group === houseTab).map(([k, f]) => `
    <button class="facade ${d.facade === k ? 'active' : ''}" type="button" data-facade="${k}" aria-pressed="${d.facade === k}">
      <img src="${f.src}" alt="${esc(f.label)}" /><b>${esc(f.label)}</b><small>${esc(f.note)}</small></button>`).join('');
  grid.querySelectorAll('[data-facade]').forEach(b => b.addEventListener('click', () => {
    d.facade = b.dataset.facade; d.style = d.facade; d.facadeSrc = null;
    const cut = CUTAWAYS[d.facade];
    const n = Math.min(d.count, cut.rooms.length);
    d.rooms = cut.rooms.slice(0, n).map((_, i) => ({ ...cutRoom(d.facade, i), topic: d.rooms[i]?.topic || '', notes: d.rooms[i]?.notes || '', files: d.rooms[i]?.files || [] }));
    d.count = n;
    renderBuild();
  }));
}
/* Read the roof and wall colours from a photo of the house, so the cutaway matches it. */
function paletteFrom(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); const W = 60, H = Math.max(20, Math.round(60 * img.naturalHeight / img.naturalWidth));
      c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H);
      const avg = (y0, y1) => { const d = x.getImageData(Math.round(W * .2), Math.round(H * y0), Math.round(W * .6), Math.max(1, Math.round(H * (y1 - y0)))).data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } return n ? [r / n, g / n, b / n] : [180, 150, 120]; };
      const hex = (c, k = 1) => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0')).join('');
      const roof = avg(.05, .28), wall = avg(.45, .7);
      resolve({ frame: hex(wall, .62), siding: hex(wall), roof: hex(roof, .85), roofEdge: '#3a2a26' });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
function setRoomCount(n) {
  const d = state.draft;
  if (isCut(d.facade)) {
    const cut = CUTAWAYS[d.facade]; n = Math.min(n, cut.rooms.length); d.count = n;
    while (d.rooms.length < n) { const free = cut.rooms.findIndex((_, i) => !d.rooms.some(r => r.slot === i)); d.rooms.push(cutRoom(d.facade, free)); }
    d.rooms = d.rooms.slice(0, n); renderBuild(); return;
  }
  d.count = n;
  const types = FACADES[d.facade]?.rooms || ROOM_ORDER;
  while (d.rooms.length < n) { const t = types[d.rooms.length % types.length]; d.rooms.push({ type: t, label: ROOM_TYPES[t].label, topic: '', notes: '', files: [] }); }
  d.rooms = d.rooms.slice(0, n);
  renderBuild();
}
function renderMiniPlan() {
  const d = state.draft;
  const out = drawFor(d, 'mini');
  const svg = $('#miniPlan');
  svg.setAttribute('viewBox', `${out.full.x} ${out.full.y} ${out.full.w} ${out.full.h}`);
  svg.innerHTML = out.svg;
}
function renderBuild() {
  const d = state.draft;
  $('#courseName').value = d.course;
  const max = isCut(d.facade) ? CUTAWAYS[d.facade].rooms.length : 6;
  // Only offer as many rooms as this house really has.
  $('#countPicker').innerHTML = Array.from({ length: max }, (_, k) => k + 1).map(n => `<button type="button" role="radio" aria-checked="${n === d.count}" class="${n === d.count ? 'active' : ''}" data-count="${n}">${n}</button>`).join('');
  $('#countPicker').style.gridTemplateColumns = `repeat(${max}, minmax(0, 52px))`;
  $$('[data-count]').forEach(b => b.addEventListener('click', () => setRoomCount(+b.dataset.count)));
  $$('[data-per]').forEach(b => b.classList.toggle('active', +b.dataset.per === d.perRoom));
  $('#buildHint').textContent = `${isCut(d.facade) ? `This house has ${max} room${max > 1 ? 's' : ''}; the ones you skip stay dimmed. ` : ''}Each room starts with ${d.perRoom} spots. In the next step you can add or remove any piece of furniture.`;
  renderHouseGrid(); renderMiniPlan();
}
$('#courseName').addEventListener('input', e => { state.draft.course = e.target.value; });
$$('[data-per]').forEach(b => b.addEventListener('click', () => { state.draft.perRoom = +b.dataset.per; renderBuild(); }));
$('#toRoomsBtn').addEventListener('click', () => {
  const d = state.draft;
  d.course = $('#courseName').value.trim() || 'My course';
  ensureSpots(d);
  renderRooms(); show('rooms');
});

/* ---------- Step 2: rooms ---------- */
function renderSetupStage() {
  const d = state.draft;
  ensureSpots(d);
  const pins = d.rooms.map(r => (r.spots || []).map((oi, k) => ({ obj: oi, item: k, n: k + 1, state: 'todo' })));
  const out = drawFor(d, 'setup', { selected: state.selectedRoom, pins });
  $('#setupStage').innerHTML = `<div class="stage-front"><img src="${esc(facadeSrcOf(d))}" alt="" /><small>FRONT</small></div><div class="setup-help"><span class="sh-add">+</span> tap to add a spot · <span class="sh-pin">1</span> tap to remove · numbers are the walking order</div><svg viewBox="${out.full.x} ${out.full.y} ${out.full.w} ${out.full.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cutaway of your house">${out.svg}</svg>`;
  $$('#setupStage [data-room-hit]').forEach(g => g.addEventListener('click', () => {
    state.selectedRoom = +g.dataset.roomHit; renderSetupStage(); renderRoomCards();
    $(`#roomCard${state.selectedRoom}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }));
  const toggle = (ri, oi) => {
    const r = d.rooms[ri]; if (!r) return;
    state.selectedRoom = ri;
    const at = r.spots.indexOf(oi);
    if (at > -1) { if (r.spots.length > 1) r.spots.splice(at, 1); else toast('A room needs at least one spot.', 2500); }
    else r.spots.push(oi);
    renderSetupStage(); renderRoomCards();
  };
  $$('#setupStage .hot, #setupStage .obj, #setupStage .spot-add').forEach(o => {
    const go = e => { e.stopPropagation(); e.preventDefault?.(); toggle(+o.dataset.room, +o.dataset.obj); };
    o.addEventListener('click', go);
    o.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(e); });
  });
  $$('#setupStage [data-pin-room]').forEach(p => p.addEventListener('click', e => { e.stopPropagation(); const r = d.rooms[+p.dataset.pinRoom]; toggle(+p.dataset.pinRoom, r.spots[+p.dataset.pinItem]); }));
  $$('#setupStage [data-room-toggle]').forEach(g => g.addEventListener('click', () => {
    d.rooms.push(cutRoom(d.facade, +g.dataset.roomToggle)); ensureSpots(d);
    d.rooms.sort((a, b) => a.slot - b.slot); d.count = d.rooms.length;
    state.selectedRoom = d.rooms.findIndex(r => r.slot === +g.dataset.roomToggle);
    renderSetupStage(); renderRoomCards();
  }));
  bindTips($('#setupStage'));
}
function renderRoomCards() {
  const d = state.draft;
  $('#roomCards').innerHTML = d.rooms.map((r, i) => `
    <div class="room-card ${state.selectedRoom === i ? 'sel' : ''}" id="roomCard${i}">
      <div class="room-card-head"><span class="num">${i + 1}</span>
        ${isCut(d.facade) ? `<b style="flex:1;font-family:var(--f-display);font-weight:400;font-size:20px">${esc(r.label)}</b>${d.rooms.length > 1 ? `<button class="link" type="button" data-room-skip="${i}">skip room</button>` : ''}` : `<select data-room-type="${i}" aria-label="Room type for room ${i + 1}">${ROOM_ORDER.map(t => `<option value="${t}" ${r.type === t ? 'selected' : ''}>${ROOM_TYPES[t].label}</option>`).join('')}</select>`}</div>
      <div class="spot-line"><b>${r.spots?.length || 0} of ${objectNames(d, r).length} spots</b><span>${esc(spotsFor(d, r).map(plain).join(' → ') || 'tap a + in the house')}</span>
        <span class="spot-btns"><button class="link" type="button" data-all="${i}">use all</button><button class="link" type="button" data-few="${i}">reset</button></span></div>
      <div class="row"><input class="input" data-room-topic="${i}" maxlength="60" placeholder="Topic, e.g. Time value of money" value="${esc(r.topic)}" aria-label="Topic for room ${i + 1}" /></div>
      <div class="row">
        <label class="chip ${r.files?.length || r.notes ? 'ok' : ''}" for="roomFile${i}"><input id="roomFile${i}" data-room-file="${i}" type="file" multiple accept=".pdf,.pptx,.docx,.txt,.md,.csv,.r,.R,text/plain,application/pdf" />↥ ${r.files?.length ? `${r.files.length} file${r.files.length > 1 ? 's' : ''}` : 'Notes for this room'}</label>
        ${isCut(d.facade) ? '' : `<label class="chip ${r.photo ? 'ok' : ''}" for="roomPhoto${i}"><input id="roomPhoto${i}" data-room-photo="${i}" type="file" accept="image/*" />📷 ${r.photo ? 'Own photo' : 'Use my own photo'}</label>
        ${r.photo ? `<button class="chip ${r.photoObjects?.length ? 'ok' : ''}" type="button" data-room-spots="${i}">📍 ${r.photoObjects?.length ? `${r.photoObjects.length} spots chosen` : 'Choose spots'}</button><button class="link" type="button" data-room-unphoto="${i}">remove</button>` : ''}`}
      </div>
    </div>`).join('');
  $$('[data-room-type]').forEach(s => s.addEventListener('change', e => { const r = d.rooms[+e.target.dataset.roomType]; r.type = e.target.value; r.label = ROOM_TYPES[r.type].label; r.spots = undefined; renderSetupStage(); renderRoomCards(); }));
  $$('[data-room-topic]').forEach(s => s.addEventListener('input', e => { d.rooms[+e.target.dataset.roomTopic].topic = e.target.value; }));
  $$('[data-room-topic]').forEach(s => s.addEventListener('focus', e => { const i = +e.target.dataset.roomTopic; if (state.selectedRoom !== i) { state.selectedRoom = i; renderSetupStage(); $$('.room-card').forEach((c, k) => c.classList.toggle('sel', k === i)); } }));
  $$('[data-room-file]').forEach(inp => inp.addEventListener('change', async e => {
    const i = +e.target.dataset.roomFile; const { text, names, failed } = await readFiles([...e.target.files]);
    if (failed.length) toast(readReport(names, failed), 7000);
    d.rooms[i].notes = text; d.rooms[i].files = names; renderRoomCards();
  }));
  $$('[data-room-photo]').forEach(inp => inp.addEventListener('change', e => {
    const i = +e.target.dataset.roomPhoto; const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    loadPhoto(f).then(photo => {
      Object.assign(d.rooms[i], { photo: photo.src, photoFile: photo.blob || f, photoW: photo.w, photoH: photo.h, photoObjects: null });
      renderSetupStage(); renderRoomCards(); openSpotPicker(i);
    }).catch(err => toast(err.message, 8000));
  }));
  $$('[data-all]').forEach(b => b.addEventListener('click', () => { const r = d.rooms[+b.dataset.all]; r.spots = objectNames(d, r).map((_, k) => k); state.selectedRoom = +b.dataset.all; renderSetupStage(); renderRoomCards(); }));
  $$('[data-few]').forEach(b => b.addEventListener('click', () => { const r = d.rooms[+b.dataset.few]; r.spots = undefined; ensureSpots(d); renderSetupStage(); renderRoomCards(); }));
  $$('[data-room-skip]').forEach(b => b.addEventListener('click', () => { d.rooms.splice(+b.dataset.roomSkip, 1); d.count = d.rooms.length; state.selectedRoom = 0; renderSetupStage(); renderRoomCards(); }));
  $$('[data-room-spots]').forEach(b => b.addEventListener('click', () => openSpotPicker(+b.dataset.roomSpots)));
  $$('[data-room-unphoto]').forEach(b => b.addEventListener('click', () => { const r = d.rooms[+b.dataset.roomUnphoto]; r.photo = null; r.photoFile = null; r.photoObjects = null; r.spots = undefined; renderSetupStage(); renderRoomCards(); }));
}
function renderRooms() {
  const d = state.draft;
  $('#roomsTitle').innerHTML = `Inside <em>${esc(FACADES[d.facade]?.label || 'your house')}</em>`;
  $('#roomsHint').textContent = isCut(d.facade) ? 'Every + is a piece of furniture you can use. Tap it to add a spot, tap a number to remove it. Dimmed rooms can be added too.' : 'Each room can use your own photo. Tap “Choose spots” to pick the objects yourself.';
  $('#courseNotes').value = d.courseNotes;
  $('#courseStatus').textContent = d.courseFiles.length ? `${d.courseFiles.length} file(s) read · ${d.courseNotes.length.toLocaleString()} characters` : 'Rooms without their own notes use this.';
  $('#roomsError').textContent = '';
  state.selectedRoom = 0;
  renderSetupStage(); renderRoomCards(); updateAiStatus();
}
$('#courseNotes').addEventListener('input', e => { state.draft.courseNotes = e.target.value; });
/* Read several course files; returns their text plus, for each file that failed, why. */
const MAX_FILE_MB = 80;
async function readFiles(files) {
  const parts = [], names = [], failed = [];
  for (const f of files.slice(0, 40)) {
    if (f.size > MAX_FILE_MB * 1024 * 1024) { failed.push(`${f.name}: larger than ${MAX_FILE_MB} MB`); continue; }
    try {
      const t = (await readCourseFile(f)).replace(/\s+/g, ' ').trim();
      if (t.length < 20) throw new Error('it has almost no text');
      parts.push(`FILE: ${f.name}\n${t.slice(0, 60000)}`); names.push(f.name);
    } catch (e) { failed.push(`${f.name}: ${e?.message || 'could not be read'}`); console.warn('RoomRecall could not read', f.name, e); }
  }
  return { text: parts.join('\n\n').slice(0, 200000), names, failed };
}
function readReport(names, failed) {
  const ok = names.length ? `${names.length} file${names.length > 1 ? 's' : ''} read. ` : '';
  return ok + (failed.length ? `Could not read ${failed.join('; ')}. Tip: export slides as PDF, or paste the text.` : '');
}
$('#courseFiles').addEventListener('change', async e => {
  $('#courseStatus').textContent = 'Reading files…';
  const { text, names, failed } = await readFiles([...e.target.files]);
  const d = state.draft; d.courseNotes = [d.courseNotes, text].filter(Boolean).join('\n\n'); d.courseFiles = [...d.courseFiles, ...names];
  $('#courseNotes').value = d.courseNotes;
  $('#courseStatus').textContent = failed.length ? readReport(names, failed) : `${d.courseFiles.length} file(s) read · ${d.courseNotes.length.toLocaleString()} characters`;
});

/* ---------- Choose spots on your own photo ---------- */
const MAX_PHOTO_SPOTS = 10;
const picker = { room: -1, pts: [], pending: null };
function openSpotPicker(i) {
  const r = state.draft.rooms[i]; if (!r?.photo) return;
  picker.room = i; picker.pts = (r.photoObjects || []).map(o => ({ ...o })); picker.pending = null;
  $('#spotImg').src = r.photo; $('#spotName').value = ''; $('#spotAdd').disabled = true;
  $('#spotAi').hidden = !(aiOn() && AI.images && r.photoFile);
  $('#spotTitle').textContent = `Tap the objects in the ${r.label.toLowerCase()}`;
  $('#spotPicker').hidden = false; renderSpots();
}
function renderSpots() {
  $('#spotPins').innerHTML = picker.pts.map((p, i) => `<span class="spot-pin" style="left:${p.x}%;top:${p.y}%">${i + 1}</span>`).join('') + (picker.pending ? `<span class="spot-pin pending" style="left:${picker.pending.x}%;top:${picker.pending.y}%">${picker.pts.length + 1}</span>` : '');
  $('#spotList').innerHTML = picker.pts.map((p, i) => `<button class="chip ok" type="button" data-unspot="${i}">${i + 1} · ${esc(plain(p.name))} ✕</button>`).join('');
  $$('[data-unspot]').forEach(b => b.addEventListener('click', () => { picker.pts.splice(+b.dataset.unspot, 1); renderSpots(); }));
  $('#spotHint').textContent = picker.pts.length >= MAX_PHOTO_SPOTS ? `${MAX_PHOTO_SPOTS} spots, the most a room can hold. Save, or remove one.` : `${picker.pts.length} spot${picker.pts.length === 1 ? '' : 's'} so far. Tap an object, name it, add as many as you like (up to ${MAX_PHOTO_SPOTS}). Pick them in walking order.`;
  $('#spotDone').disabled = picker.pts.length < 2;
}
$('#spotStage').addEventListener('click', e => {
  if (picker.pts.length >= MAX_PHOTO_SPOTS) { toast(`A room can hold up to ${MAX_PHOTO_SPOTS} spots.`, 2500); return; }
  const img = $('#spotImg').getBoundingClientRect();
  if (e.clientX < img.left || e.clientX > img.right || e.clientY < img.top || e.clientY > img.bottom) return;
  picker.pending = { x: (e.clientX - img.left) / img.width * 100, y: (e.clientY - img.top) / img.height * 100 };
  $('#spotAdd').disabled = false; $('#spotName').focus(); renderSpots();
});
$('#spotPins').style.cssText = 'position:absolute;inset:0;pointer-events:none';
function addSpot() {
  const name = $('#spotName').value.trim(); if (!picker.pending || !name) return;
  picker.pts.push({ ...picker.pending, name: /^the\s/i.test(name) ? name : `the ${name}` }); picker.pending = null;
  $('#spotName').value = ''; $('#spotAdd').disabled = true; renderSpots();
}
$('#spotAdd').addEventListener('click', addSpot);
$('#spotName').addEventListener('keydown', e => { if (e.key === 'Enter') addSpot(); });
$('#spotClear').addEventListener('click', () => { picker.pts = []; picker.pending = null; renderSpots(); });
$('#spotClose').addEventListener('click', () => { $('#spotPicker').hidden = true; });
$('#spotAi').addEventListener('click', async e => {
  const b = e.target; b.disabled = true; b.textContent = '✦ Looking around…';
  try { picker.pts = await aiFindObjects(state.draft.rooms[picker.room].photoFile, state.draft.perRoom); renderSpots(); }
  catch (err) { aiErrorText(err); toast('Claude could not read this photo. Tap the spots yourself.'); }
  finally { b.disabled = false; b.textContent = '✦ Let Claude pick'; }
});
$('#spotDone').addEventListener('click', () => {
  const r = state.draft.rooms[picker.room];
  r.photoObjects = picker.pts.slice(0, MAX_PHOTO_SPOTS); r.spots = undefined;
  $('#spotPicker').hidden = true; renderSetupStage(); renderRoomCards();
});

/* ---------- Furnish the house with facts ---------- */
let building = false;
$('#buildHouseBtn').addEventListener('click', furnishHouse);
async function furnishHouse() {
  if (building) return;
  const d = state.draft;
  d.courseNotes = $('#courseNotes').value;
  const hasAny = d.courseNotes.trim().length > 40 || d.rooms.some(r => r.notes.trim().length > 40);
  if (!hasAny) { $('#roomsError').textContent = 'Add course notes, or notes for at least one room, first.'; return; }
  building = true; $('#buildHouseBtn').disabled = true; $('#roomsError').textContent = '';
  const steps = ['Planning one topic per room', ...d.rooms.map((r, i) => `Room ${i + 1} · ${r.label}`)];
  const signal = overlay.open(d.showHouse ? `Building “${d.course}”…` : 'Furnishing your house…', steps);
  showBuildingHouse(d);
  const notes = [];
  let note = '';
  try {
    // 1. topics
    overlay.set(0, 'active');
    const missing = d.rooms.filter(r => !r.topic.trim() && !r.notes.trim()).length;
    let planned = [];
    if (missing && d.courseNotes.trim()) {
      if (aiOn()) {
        try { planned = await aiPlanTopics({ course: d.course, notes: d.courseNotes, rooms: d.rooms.length, signal }); }
        catch (e) { if (e?.code === 'cancelled') throw e; note = aiErrorText(e); }
      }
    }
    const chunks = splitText(d.courseNotes, d.rooms.length);
    d.rooms.forEach((r, i) => { if (!r.topic.trim() && !r.notes.trim() && planned[i]) r.topic = planned[i]; });
    overlay.set(0, 'done');

    // 2. rooms, three at a time
    const results = new Array(d.rooms.length);
    const work = d.rooms.map((r, i) => async () => {
      overlay.set(i + 1, 'active');
      const roomNotes = r.notes.trim() || d.courseNotes;
      let spots = spotsFor(d, r);
      const choseByHand = !isCut(d.facade) && r.photo && r.photoObjects?.length;
      if (!choseByHand && !isCut(d.facade) && r.photo && aiOn() && AI.images && r.photoFile) {
        try { r.photoObjects = r.photoObjects || await aiFindObjects(r.photoFile, d.perRoom); spots = r.photoObjects.map(o => o.name); r.spots = r.photoObjects.map((_, k) => k); }
        catch (e) { if (e?.code === 'cancelled') throw e; r.photo = null; }
      } else if (r.photo && !r.photoObjects) { r.photo = null; }
      let res = null;
      if (aiOn()) {
        try { res = await aiRoom({ course: d.course, topic: r.topic, roomLabel: r.label, spots, notes: roomNotes, signal, onText: ({ text }) => { const n = (text.match(/"story"\s*:/g) || []).length; overlay.live(`${r.label}: spot ${Math.min(n + 1, spots.length)} of ${spots.length}…`); } }); }
        catch (e) { if (e?.code === 'cancelled') throw e; note = aiErrorText(e); }
      }
      if (!res) res = offlineRoom(r.notes.trim() || chunks[i] || d.courseNotes, spots);
      const idx = (r.photo && r.photoObjects?.length) ? r.photoObjects.map((_, k) => k) : (r.spots || spots.map((_, k) => k));
      res.items.forEach(it => { it.obj = idx[it.obj] ?? it.obj; });
      results[i] = { slot: r.slot, spots: r.spots, type: r.type, label: r.label, topic: r.topic || res.topic || `Part ${i + 1}`, photo: r.photo || null, photoW: r.photoW, photoH: r.photoH, photoObjects: r.photo ? r.photoObjects : null, notes: r.notes.slice(0, 20000), items: res.items };
      overlay.set(i + 1, 'done'); lightBuiltRoom(i);
    });
    const queue = [...work];
    await Promise.all(Array.from({ length: Math.min(3, queue.length) }, async () => { while (queue.length) await queue.shift()(); }));
    if (results.some(r => !r || !r.items.length)) throw { code: 'empty' };
    const house = { id: d.id, lot: d.lot ?? null, course: d.course, facade: d.facade, facadeSrc: d.facadeSrc, style: d.style, palette: d.palette || null, perRoom: d.perRoom, courseNotes: d.courseNotes.slice(0, 40000), rooms: results, createdAt: Date.now(), byClaude: aiOn() };
    upsertHouse(house); assignLots(state.houses); saveHouses();
    overlay.close();
    openHouse(house.id, { warmup: true });
    if (note) toast(note);
  } catch (e) {
    overlay.close();
    $('#roomsError').textContent = e?.code === 'cancelled' ? 'Stopped. Nothing was saved.' : e?.code === 'empty' ? 'Some rooms came back empty. Add a bit more material and try again.' : 'Something went wrong while furnishing. Try again.';
  } finally {
    building = false; $('#buildHouseBtn').disabled = false;
  }
}
