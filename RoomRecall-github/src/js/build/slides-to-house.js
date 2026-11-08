/**
 * RoomRecall · build/slides-to-house.js
 * Drop lecture slides on the street and a house builds itself.
 */

/* ---------- From slides to a house: drop a PDF on the street ---------- */
async function buildFromFile(file) {
  if (!file) return;
  // A photo dropped on the street becomes the front of your own house.
  if (/^image\//.test(file.type)) { startOwnHouse(file); return; }
  const { text, names, failed } = await readFiles([file]);
  if (failed.length) { toast(readReport(names, failed), 8000); return; }
  if (text.trim().length < 80) { toast(/\.pdf$/i.test(file.name) ? 'This PDF has almost no selectable text (it may be scanned images). Try the lecture slides exported as PDF, or paste the notes.' : 'That file has too little text to build a house. Try the lecture PDF or a text file.', 6000); return; }
  const taken = new Set(state.houses.map(h => h.lot));
  const lot = [...Array(LOT_COUNT).keys()].find(i => !taken.has(i));
  if (lot == null) { toast('Your street is full. Delete a house to free a lot.'); return; }
  const facade = CUTAWAYS[LOTS[lot].facade] ? LOTS[lot].facade : 'cottage';
  const course = names[0].replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 36) || 'New course';
  state.draft = newDraft({ facade, count: Math.min(3, CUTAWAYS[facade].rooms.length), course, courseNotes: text });
  state.draft.lot = lot; state.draft.course = course; ensureSpots(state.draft);
  $('#courseNotes').value = text; state.draft.showHouse = true;
  furnishHouse();
}
$('#dropPdf').addEventListener('change', e => { buildFromFile(e.target.files?.[0]); e.target.value = ''; });
(() => {
  const street = $('#street'); let depth = 0;
  street.addEventListener('dragenter', e => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { depth++; $('#dropVeil').hidden = false; } });
  street.addEventListener('dragover', e => { if ([...(e.dataTransfer?.types || [])].includes('Files')) e.preventDefault(); });
  street.addEventListener('dragleave', () => { if (--depth <= 0) { depth = 0; $('#dropVeil').hidden = true; } });
  street.addEventListener('drop', e => { e.preventDefault(); depth = 0; $('#dropVeil').hidden = true; buildFromFile(e.dataTransfer.files?.[0]); });
})();
/* While Claude furnishes, a small house assembles in the dialog and each room lights up when it is done. */
function showBuildingHouse(d) {
  const out = drawFor({ ...d, rooms: d.rooms }, 'mini');
  const darks = out.geometry.slots.map((s, i) => `<rect class="build-dark" data-room-dark="${i}" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}"/>`).join('');
  $('#aiHouse').innerHTML = `<svg viewBox="${out.full.x} ${out.full.y} ${out.full.w} ${out.full.h}" aria-hidden="true">${out.svg}${darks}</svg>`;
  $('#aiHouse').hidden = false;
}
function lightBuiltRoom(i) { $(`#aiHouse [data-room-dark="${i}"]`)?.classList.add('lit'); }

/* Start an own-house build from a photo of the front of a home. */
async function startOwnHouse(file) {
  let photo;
  try { photo = await loadPhoto(file); } catch (err) { toast(err.message, 8000); return; }
  startBuild();
  const d = state.draft; d.facade = 'own'; d.style = 'own'; d.facadeSrc = photo.src;
  d.palette = await paletteFrom(photo.src);
  d.rooms = d.rooms.map((r, i) => ({ ...r, slot: undefined, spots: undefined, type: ROOM_ORDER[i % 6], label: ROOM_TYPES[ROOM_ORDER[i % 6]].label }));
  houseTab = 'own';
  $$('[data-house-tab]').forEach(x => { x.classList.toggle('active', x.dataset.houseTab === 'own'); x.setAttribute('aria-selected', String(x.dataset.houseTab === 'own')); });
  renderBuild();
  toast('Your house is in. Pick how many rooms, then add a photo of each room in the next step.', 5000);
}
