/**
 * RoomRecall · walk/quiz.js
 * Active recall: route check, house quiz, weak-spot review, exam mode and results.
 */

/* ---------- Quiz ---------- */
function startRouteQuiz() {
  const h = state.house;
  const spots = h.rooms.flatMap((r, ri) => r.items.map((it, ii) => ({ r, ri, ii, it })));
  const qs = shuffle(spots).slice(0, Math.min(6, spots.length)).map(s => {
    const roomSpots = s.r.items.map(i => cap(i.spot));
    const pool = [...new Set([...roomSpots, ...spots.map(x => cap(x.it.spot))])].filter(n => n !== cap(s.it.spot));
    return { question: `In the ${s.r.label.toLowerCase()}, what is spot ${s.ii + 1}?`, answer: cap(s.it.spot), distractors: shuffle(pool).slice(0, 3), where: `${s.r.label.toUpperCase()} · SPOT ${s.ii + 1}`, story: `Walk into the ${s.r.label.toLowerCase()} and look around in order: ${s.r.items.map(i => plain(i.spot)).join(', ')}.`, explanation: '' };
  });
  state.quiz = { kind: 'route', list: qs, i: 0, score: 0, missed: [], gems: 0 }; gems.streak = 0;
  renderQuiz(); show('quiz');
}
function houseItems(h) {
  return h.rooms.flatMap((r, ri) => r.items.map((it, ii) => ({ ...it, where: `${r.label.toUpperCase()} · ${plain(it.spot).toUpperCase()}`, ref: { h, ri, ii }, label: `${r.label} · ${cap(it.spot)}`, course: h.course })));
}
function startQuiz(kind, opts = {}) {
  let list;
  if (kind === 'house') {
    const h = state.house;
    list = houseItems(h);
    if (opts.only) { list = list.filter(x => opts.only.includes(spotHealth(h, x.ref.ri, x.ref.ii))); list.sort((a, b) => HEALTH_RANK[spotHealth(h, b.ref.ri, b.ref.ii)] - HEALTH_RANK[spotHealth(h, a.ref.ri, a.ref.ii)]); }
    if (!list.length) { toast('Nothing is due right now. Lovely.'); return; }
  } else if (kind === 'exam') {
    list = shuffle(state.houses.flatMap(houseItems)).slice(0, opts.count || 20);
    if (!list.length) { toast('Build a course house first.'); return; }
  } else {
    const c = state.commute;
    list = [
      ...c.memories.map((m, i) => ({ question: `Which idea is waiting at ${m.name}?`, answer: m.concept, distractors: shuffle(c.memories.filter(x => x !== m).map(x => x.concept)).slice(0, 3), story: m.story, where: `STOP · ${m.name.toUpperCase()}`, label: m.name, explanation: m.hook || '' })),
      ...c.questions.map(q => { const m = c.memories[q.anchor ?? 0] || c.memories[0]; return { question: q.prompt, answer: q.answer, distractors: q.distractors?.length >= 3 ? q.distractors : shuffle(c.memories.map(x => x.concept).filter(x => x !== q.answer)).slice(0, 3), story: m.story, where: `STOP · ${m.name.toUpperCase()}`, label: m.name, explanation: q.explanation || '' }; })
    ];
  }
  state.quiz = { kind, list, i: 0, score: 0, missed: [], gems: 0, exam: kind === 'exam', endsAt: kind === 'exam' ? Date.now() + (opts.minutes || 10) * 60000 : 0 }; gems.streak = 0;
  startExamClock();
  renderQuiz(); show('quiz');
}
/* Exam mode: one clock for the whole paper, no walk-back hints until the end. */
let examTimer = null;
function startExamClock() {
  clearInterval(examTimer); const q = state.quiz; $('#examClock').hidden = !q.exam;
  if (!q.exam) return;
  const tick = () => {
    const left = Math.max(0, Math.round((q.endsAt - Date.now()) / 1000));
    $('#examClock').textContent = `⏱ ${fmt(left)}`; $('#examClock').classList.toggle('low', left < 60);
    if (!left && state.quiz === q && state.screen === 'quiz') { clearInterval(examTimer); q.timeUp = true; showResult(); }
  };
  tick(); examTimer = setInterval(tick, 500);
}
function renderQuiz() {
  const q = state.quiz; const it = q.list[q.i];
  $('#quizStep').textContent = `${q.i + 1} / ${q.list.length}`;
  $('#quizBar').style.width = `${((q.i + 1) / q.list.length) * 100}%`;
  $('#quizScore').textContent = `💎 ${q.gems || 0}`;
  $('#quizAnchor').textContent = q.kind === 'route' ? 'ROUTE CHECK' : q.exam ? `EXAM · ${it.course.toUpperCase()}` : it.where;
  $('#quizQ').textContent = it.question;
  const opts = shuffle([it.answer, ...(it.distractors || []).slice(0, 3)]);
  $('#quizOptions').innerHTML = opts.map((o, i) => `<button class="quiz-option" type="button" data-answer="${esc(o)}"><span>${i + 1}</span>${esc(o)}</button>`).join('');
  $('#quizFeedback').textContent = '';
  $('#quizNext').disabled = true;
  $('#quizNext').textContent = q.i === q.list.length - 1 ? 'See my result →' : 'Next →';
  q.answered = false;
  $$('.quiz-option').forEach(b => b.addEventListener('click', () => answer(b)));
}
function answer(btn) {
  const q = state.quiz; if (q.answered) return; q.answered = true;
  const it = q.list[q.i];
  const right = btn.dataset.answer === it.answer;
  $$('.quiz-option').forEach(o => { o.disabled = true; if (o.dataset.answer === it.answer) o.classList.add('correct'); else if (o !== btn) o.classList.add('dim'); });
  const fb = $('#quizFeedback'); fb.textContent = '';
  if (it.ref) recordAnswer(it.ref.h, it.ref.ri, it.ref.ii, right);
  if (q.exam) {
    if (right) { q.score++; gems.streak++; addGems(10 + (gems.streak >= 3 ? 5 : 0)); } else { q.missed.push(it); gems.streak = 0; btn.classList.add('wrong'); }
    $$('.quiz-option').forEach(o => o.classList.remove('correct', 'dim'));
    btn.classList.add(right ? 'picked' : 'picked');
    fb.textContent = 'Answer saved. Results come at the end.';
    $('#quizNext').disabled = false; setTimeout(() => { if (state.quiz === q && q.answered) $('#quizNext').click(); }, 450);
    return;
  }
  if (right) {
    q.score++; gems.streak++;
    const base = q.kind === 'route' ? 2 : 10; const bonus = gems.streak >= 3 && q.kind !== 'route' ? 5 : 0;
    addGems(base + bonus, bonus ? `· ${gems.streak} in a row` : '');
    fb.textContent = it.explanation ? `Correct. ${it.explanation}` : 'Correct. The spot did its job.';
  }
  else {
    btn.classList.add('wrong'); q.missed.push(it); gems.streak = 0;
    fb.append(`Not quite. The answer is: ${it.answer}`);
    if (it.story) { const s = document.createElement('span'); s.className = 'walk'; const b = document.createElement('b'); b.textContent = `WALK BACK TO ${q.kind === 'route' ? 'THE ROOM' : it.where}`; s.append(b, document.createElement('br'), it.story); fb.append(s); }
  }
  $('#quizScore').textContent = `💎 ${q.gems || 0}`;
  $('#quizNext').disabled = false; $('#quizNext').focus();
}
$('#quizNext').addEventListener('click', () => { const q = state.quiz; if (q.i < q.list.length - 1) { q.i++; renderQuiz(); } else showResult(); });
$('#quizExit').addEventListener('click', () => { clearInterval(examTimer); if (state.quiz?.kind === 'commute') show('ride'); else if (state.quiz?.exam) show('home'); else if (state.house) show('palace'); else show('home'); });

/* Exam setup dialog */
function openExam() {
  const n = state.houses.reduce((a, h) => a + h.rooms.reduce((b, r) => b + r.items.length, 0), 0);
  if (!n) { toast('Build a course house first.'); return; }
  $('#examInfo').textContent = `${state.houses.length} house${state.houses.length > 1 ? 's' : ''} · ${n} questions to draw from. No hints until the end.`;
  $('#examDialog').hidden = false;
}
$('#examBtn').addEventListener('click', openExam);
$('#examClose').addEventListener('click', () => { $('#examDialog').hidden = true; });
$$('[data-exam]').forEach(b => b.addEventListener('click', () => { const [m, c] = b.dataset.exam.split(':').map(Number); $('#examDialog').hidden = true; state.house = null; startQuiz('exam', { minutes: m, count: c }); }));

function showResult() {
  clearInterval(examTimer);
  const q = state.quiz; const total = q.exam ? Math.max(q.i + (q.answered ? 1 : 0), 1) : q.list.length;
  $('#scoreValue').textContent = `${q.score} of ${total}`;
  if (q.score === total && q.kind !== 'route') addGems(25, 'perfect walk');
  $('#gemEarned').innerHTML = `<b>+${q.gems || 0}</b> 💎 this round · ${gems.total.toLocaleString()} in total${q.score === total ? ' · perfect walk bonus included' : ''}`;
  const pct = q.score / total;
  if (q.exam) {
    const byCourse = {};
    q.list.slice(0, total).forEach(it => { const c = (byCourse[it.course] ||= { right: 0, n: 0 }); c.n++; if (!q.missed.includes(it)) c.right++; });
    $('#scoreMsg').innerHTML = `${q.timeUp ? 'Time is up. ' : ''}${Object.entries(byCourse).map(([c, v]) => `<b>${esc(c)}</b> ${v.right}/${v.n}`).join(' · ')}`;
  } else
  $('#scoreMsg').textContent = q.kind === 'route'
    ? (pct === 1 ? 'You know the route. Now walk it and let the pictures move in.' : 'Walk the route once more, out loud, before you put facts on it.')
    : pct >= .8 ? 'Strong first walk. Walk it again tomorrow and the pictures will lock in.' : 'This round showed your weak spots. Walk those rooms again, then retake the quiz.';
  $('#revisitWrap').hidden = !q.missed.length || q.kind === 'route' || q.exam;
  $('#resultEyebrow').textContent = q.exam ? 'PRACTICE EXAM FINISHED' : q.kind === 'route' ? 'ROUTE CHECK DONE' : q.kind === 'commute' ? 'RIDE COMPLETE' : 'WALK COMPLETE';
  $('#examReview').hidden = !q.exam || !q.missed.length;
  $('#examReview').innerHTML = q.exam ? q.missed.map(m => `<div class="exam-miss"><b>${esc(m.question)}</b><span>${esc(m.answer)}</span><small>${esc(m.label)} · ${esc(m.course)}</small></div>`).join('') : '';
  $('#revisitList').innerHTML = q.missed.map(m => `<span class="chip">${esc(m.emoji || '✦')} ${esc(m.label || m.answer)}</span>`).join('');
  $('#walkAgain').textContent = q.kind === 'commute' ? 'Ride the route again' : q.exam ? 'Back to the street' : 'Walk the house again';
  $('#toBoard').hidden = q.kind === 'route';
  $('#boardStatus').textContent = '';
  show('result');
  if (q.kind !== 'route') saveScore(q.kind === 'commute' ? (state.commute.course || 'Commute') : q.exam ? 'Practice exam' : state.house.course, q.score, total);
}
$('#retryQuiz').addEventListener('click', () => { const k = state.quiz.kind; if (k === 'route') startRouteQuiz(); else if (k === 'exam') openExam(); else startQuiz(k); });
$('#walkAgain').addEventListener('click', () => {
  if (state.quiz.kind === 'exam') { show('home'); return; }
  if (state.quiz.kind === 'commute') { state.commute.idx = 0; renderRide(); show('ride'); }
  else { state.walk.room = state.quiz.kind === 'route' ? 0 : -1; state.walk.item = 0; show('palace'); renderPalace(); }
});
$('#toBoard').addEventListener('click', () => { const q = state.quiz; boardCourse = courseKey(q.kind === 'commute' ? (state.commute.course || 'Commute') : q.exam ? 'Practice exam' : state.house.course); show('cities'); });

document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,select') || !$('#aiOverlay').hidden) return;
  if (state.screen === 'quiz') {
    const n = +e.key; const opts = $$('.quiz-option');
    if (n >= 1 && n <= opts.length && !state.quiz.answered) { opts[n - 1].click(); e.preventDefault(); }
    else if (e.key === 'Enter' && state.quiz.answered && document.activeElement !== $('#quizNext')) { $('#quizNext').click(); e.preventDefault(); }
    else if (e.key === 'Escape') $('#quizExit').click();
  } else if (state.screen === 'palace') {
    if (e.key === 'ArrowRight') stepForward();
    if (e.key === 'ArrowLeft') stepBack();
    if (e.key === 'Escape') { state.walk.room = -1; renderPalace(); }
  } else if (state.screen === 'ride') {
    if (e.key === 'ArrowRight') $('#rideNext').click();
    if (e.key === 'ArrowLeft') $('#ridePrev').click();
  }
});
