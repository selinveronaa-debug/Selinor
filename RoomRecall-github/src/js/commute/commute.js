/**
 * RoomRecall · commute/commute.js
 * Metro mode: 3 to 12 stops on an Oslo line become a memory route.
 */

/* How many stops a ride can hold. */
const MIN_STOPS = 3, MAX_STOPS = 12;

/* ---------- Commute ---------- */
$('#commuteBtn').addEventListener('click', () => { renderLines(); renderStops(); show('commute'); const t = $('.train'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; });
function currentRoute() {
  const c = state.commute; const line = metroLines[c.line];
  if (c.line !== '5') return { ...line, label: '' };
  const v = line.variants[c.variant]; return { ...line, stops: v.stops, label: v.label };
}
function renderLines() {
  const c = state.commute;
  $('#linePicker').innerHTML = Object.entries(metroLines).map(([n, l]) => `<button class="line-choice ${n === c.line ? 'active' : ''}" type="button" style="background:${l.color}" data-line="${n}" aria-pressed="${n === c.line}">${n}</button>`).join('');
  $$('[data-line]').forEach(b => b.addEventListener('click', () => { if (c.line === b.dataset.line) return; c.line = b.dataset.line; c.stops = []; renderLines(); renderStops(); }));
}
function renderStops() {
  const c = state.commute; const r = currentRoute();
  $('#routeTitle').textContent = `Line ${c.line} · ${r.title}${r.label ? ` · ${r.label}` : ''}`;
  $('#stopCount').textContent = `${c.stops.length} stop${c.stops.length === 1 ? '' : 's'} · ${MIN_STOPS}–${MAX_STOPS}`;
  $('#routeVariants').innerHTML = c.line === '5' ? Object.entries(metroLines['5'].variants).map(([k, v]) => `<button class="pill ${k === c.variant ? 'active' : ''}" type="button" data-variant="${k}">${v.label}</button>`).join('') : '';
  $$('[data-variant]').forEach(b => b.addEventListener('click', () => { c.variant = b.dataset.variant; c.stops = []; renderStops(); }));
  $('#stopSelector').innerHTML = r.stops.map(s => { const i = c.stops.indexOf(s); return `<button class="stop ${i > -1 ? 'sel' : ''}" type="button" style="--route:${r.color}" data-stop="${esc(s)}"><span>${i > -1 ? i + 1 : ''}</span>${esc(s)}</button>`; }).join('');
  $$('[data-stop]').forEach(b => b.addEventListener('click', () => {
    const s = b.dataset.stop;
    if (c.stops.includes(s)) c.stops = c.stops.filter(x => x !== s);
    else if (c.stops.length < MAX_STOPS) c.stops = r.stops.filter(x => [...c.stops, s].includes(x));
    else { toast(`A ride holds up to ${MAX_STOPS} stops. Tap one to remove it first.`, 3000); return; }
    renderStops();
  }));
  syncCommute();
}
function syncCommute() { $('#buildCommute').disabled = $('#commuteNotes').value.trim().length < 40 || state.commute.stops.length < MIN_STOPS; }
$('#commuteNotes').addEventListener('input', syncCommute);
$('#commuteFiles').addEventListener('change', async e => {
  $('#commuteFileStatus').textContent = 'Reading files…';
  const { text, names, failed } = await readFiles([...e.target.files]);
  $('#commuteNotes').value = [$('#commuteNotes').value, text].filter(Boolean).join('\n\n');
  $('#commuteFileStatus').textContent = failed.length ? readReport(names, failed) : `${names.length} file(s) read`;
  syncCommute();
});
/* The demo only fills in notes; stops the student already picked are never replaced. */
$('#commuteSample').addEventListener('click', () => {
  const c = state.commute;
  $('#commuteNotes').value = commuteDemoNotes;
  if (!c.stops.length) { c.line = '5'; c.variant = 'ring'; c.stops = ['Tåsen', 'Storo', 'Sinsen', 'Løren', 'Romsås']; renderLines(); }
  else toast('Demo notes added. Your own stops are kept.', 2500);
  renderStops();
});
$('#buildCommute').addEventListener('click', async () => {
  const c = state.commute; const text = $('#commuteNotes').value;
  $('#commuteError').textContent = '';
  const isDemo = text.trim() === commuteDemoNotes.trim() && c.stops.length === commuteDemoConcepts.length;
  const qCount = Math.min(20, c.stops.length * 2);
  if (aiOn() && !isDemo) {
    const signal = overlay.open('Riding your route…', ['Reading the notes', 'Matching ideas to stops', 'Writing questions']);
    overlay.set(0, 'active');
    try {
      const data = await AI.sample.json(`You are turning an Oslo metro ride into a memory route (method of loci) for a student.
Stops in riding order:
${c.stops.map((s, i) => `${i}. ${s}`).join('\n')}
Notes:
"""
${text.slice(0, 40000)}
"""
Pick the ${c.stops.length} most important distinct concepts. Give each stop one concept, choosing pairs where the stop name SOUNDS or is spelled like the concept.
For each stop: "hook" (one short line linking the name to the concept, e.g. "Sinsen sounds like synapse"; if no sound-alike exists, a visual link), "story" and "summary" (one plain sentence definition).
${STORY_RULES.replace('The spot itself', 'The station itself')}
Then exactly ${qCount} multiple-choice questions spread over the ${c.stops.length} concepts: "prompt", short "answer", 3 plausible "distractors", one-sentence "explanation", "anchor" (0-${c.stops.length - 1}, the stop index).
Everything in English. Keep stop names exactly as given.
Reply with only JSON: {"title":"course title, max 36 characters","stops":[{"stop":"...","concept":"max 4 words","emoji":"⚡","hook":"...","summary":"...","story":"..."}],"questions":[{"prompt":"...","answer":"...","distractors":["...","...","..."],"explanation":"...","anchor":0}]}`, {
        signal, cache: DAY_CACHE, onText: ({ text: t }) => { const n = (t.match(/"story"/g) || []).length, q = (t.match(/"distractors"/g) || []).length; if (q) { overlay.set(1, 'done'); overlay.set(2, 'active'); overlay.live(`Question ${q} of ${qCount}…`); } else if (n) { overlay.set(0, 'done'); overlay.set(1, 'active'); overlay.live(`Stop ${n} of ${c.stops.length}…`); } }
      });
      const rows = data?.stops || [];
      const mem = c.stops.map((s, i) => { const r = rows.find(x => cleanStr(x.stop).toLowerCase() === s.toLowerCase()) || rows[i]; return r && { name: s, concept: cleanStr(r.concept, 48), emoji: cleanStr(r.emoji, 4) || '✦', hook: cleanStr(r.hook, 140), story: cleanStr(r.story, 420) }; });
      if (mem.some(m => !m || !m.concept || !m.story)) throw { code: 'invalid_json' };
      c.memories = mem; c.questions = normalizeAiQuestions(data.questions, c.stops.length); c.course = cleanStr(data.title, 36) || 'Commute course';
      overlay.close(); c.idx = 0; renderRide(); show('ride'); return;
    } catch (e) { overlay.close(); if (e?.code === 'cancelled') return; toast(aiErrorText(e)); }
  }
  const concepts = isDemo ? commuteDemoConcepts : extractConcepts(text, c.stops.length);
  if (concepts.length < c.stops.length) { $('#commuteError').textContent = `Add a bit more material so ${c.stops.length} clear ideas can be found, or pick fewer stops.`; return; }
  c.memories = matchConceptsToStops(concepts.slice(0, c.stops.length), c.stops);
  c.questions = isDemo ? commuteDemoQuestionBank.map(q => ({ ...q, anchor: c.memories.findIndex(m => m.concept === commuteDemoConcepts[q.anchor].concept) })) : [];
  c.course = isDemo ? 'Cell Biology' : 'Commute course';
  c.idx = 0; renderRide(); show('ride');
});
function renderRide() {
  const c = state.commute; const r = currentRoute(); const m = c.memories[c.idx];
  $('#rideCrumb').textContent = `LINE ${c.line} · ${c.course.toUpperCase()}`;
  $('#metroLine').innerHTML = c.memories.map((x, i) => `<button class="metro-node ${i === c.idx ? 'active' : ''}" type="button" style="--route:${r.color}" data-ride="${i}">${esc(x.name)}</button>`).join('');
  $$('[data-ride]').forEach(b => b.addEventListener('click', () => { c.idx = +b.dataset.ride; renderRide(); }));
  $('#rideProgress').textContent = `${c.idx + 1}/${c.memories.length}`;
  requestAnimationFrame(() => { const node = $$('#metroLine .metro-node')[c.idx]; const track = $('.ride-track'); if (node && track) { const nr = node.getBoundingClientRect(), tr = track.getBoundingClientRect(); $('#rideTrain').style.left = `${nr.left - tr.left + nr.width / 2 + 40}px`; } });
  $('#stationName').textContent = m.name; $('#stationHook').textContent = m.hook || '';
  $('#rideEmoji').textContent = `${m.emoji || '✦'} STOP ${c.idx + 1}`; $('#rideConcept').textContent = m.concept; $('#rideStory').textContent = m.story;
  $('#ridePrev').disabled = c.idx === 0;
  $('#rideNext').textContent = c.idx === c.memories.length - 1 ? 'Test my memory →' : 'Next stop →';
}
$('#ridePrev').addEventListener('click', () => { if (state.commute.idx > 0) { state.commute.idx--; renderRide(); } });
$('#rideNext').addEventListener('click', () => { const c = state.commute; if (c.idx < c.memories.length - 1) { c.idx++; renderRide(); } else startQuiz('commute'); });
