/**
 * RoomRecall · focus/focus.js
 * Pomodoro timer and generated background sounds (Web Audio).
 */

/* ---------- Lo-fi focus player ---------- */
const POMO = { focus: 25 * 60, break: 5 * 60, long: 15 * 60 };
const pomo = { mode: 'focus', left: POMO.focus, running: false, timer: null, round: 1 };
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
function renderPomo() {
  $('#timer').textContent = fmt(pomo.left);
  $('#playerBtnTime').textContent = fmt(pomo.left);
  $('#playerBtn').classList.toggle('on', pomo.running);
  $('#pomoStart').textContent = pomo.running ? '❚❚ Pause' : '▶ Start';
  $('#pomoStatus').textContent = pomo.mode === 'focus' ? `Focus round ${pomo.round} of 4` : pomo.mode === 'break' ? 'Short break. Stand up, look far away.' : 'Long break. You earned it.';
  $$('[data-pomo]').forEach(b => b.classList.toggle('active', b.dataset.pomo === pomo.mode));
}
function setPomo(mode) { pomo.mode = mode; pomo.left = POMO[mode]; renderPomo(); }
$$('[data-pomo]').forEach(b => b.addEventListener('click', () => { stopPomo(); setPomo(b.dataset.pomo); }));
function stopPomo() { pomo.running = false; clearInterval(pomo.timer); renderPomo(); }
$('#pomoStart').addEventListener('click', () => {
  if (pomo.running) { stopPomo(); return; }
  ensureAudio();
  pomo.running = true; const end = Date.now() + pomo.left * 1000;
  pomo.timer = setInterval(() => {
    pomo.left = Math.max(0, Math.round((end - Date.now()) / 1000));
    if (pomo.left === 0) {
      stopPomo(); chime();
      if (pomo.mode === 'focus') { const long = pomo.round % 4 === 0; pomo.round = long ? 1 : pomo.round + 1; setPomo(long ? 'long' : 'break'); toast('Focus round done. Time for a break ☕'); }
      else { setPomo('focus'); toast('Break over. Back to the house ✿'); }
    }
    renderPomo();
  }, 500);
  renderPomo();
});
$('#pomoReset').addEventListener('click', () => { stopPomo(); setPomo(pomo.mode); });
$('#playerBtn').addEventListener('click', () => { const p = $('#player'); p.hidden = !p.hidden; $('#playerBtn').setAttribute('aria-expanded', String(!p.hidden)); });
$('#playerClose').addEventListener('click', () => { $('#player').hidden = true; $('#playerBtn').setAttribute('aria-expanded', 'false'); });

let actx = null, master = null, noiseNodes = [], crackleTimer = null, currentNoise = null;
function ensureAudio() {
  if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; actx = new AC(); master = actx.createGain(); master.gain.value = +$('#noiseVol').value / 100 * .6; master.connect(actx.destination); }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function noiseBuffer(kind) {
  const len = actx.sampleRate * 4; const buf = actx.createBuffer(1, len, actx.sampleRate); const d = buf.getChannelData(0);
  let last = 0, b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
    else if (kind === 'pink') { b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0526; d[i] = (b0 + b1 + b2 + w * .1848) * .11; }
    else d[i] = w * .35;
  }
  return buf;
}
function loopSource(kind) { const s = actx.createBufferSource(); s.buffer = noiseBuffer(kind); s.loop = true; return s; }
function stopNoise() { noiseNodes.forEach(n => { try { n.stop?.(); n.disconnect(); } catch { } }); noiseNodes = []; clearInterval(crackleTimer); currentNoise = null; }
function playNoise(kind) {
  if (!ensureAudio()) { toast('Sound is not supported in this browser.'); return; }
  stopNoise(); currentNoise = kind;
  if (kind === 'white' || kind === 'brown') { const s = loopSource(kind); s.connect(master); s.start(); noiseNodes.push(s); }
  if (kind === 'rain') {
    const s = loopSource('pink'); const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000; const g = actx.createGain(); g.gain.value = 1.2;
    s.connect(hp).connect(lp).connect(g).connect(master); s.start(); noiseNodes.push(s, hp, lp, g);
    const lfo = actx.createOscillator(); const lg = actx.createGain(); lfo.frequency.value = .13; lg.gain.value = .25; lfo.connect(lg).connect(g.gain); lfo.start(); noiseNodes.push(lfo, lg);
  }
  if (kind === 'fire') {
    const s = loopSource('brown'); const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; const g = actx.createGain(); g.gain.value = .9;
    s.connect(lp).connect(g).connect(master); s.start(); noiseNodes.push(s, lp, g);
    crackleTimer = setInterval(() => {
      if (Math.random() > .55) return;
      const n = Math.floor(actx.sampleRate * (.004 + Math.random() * .02)); const b = actx.createBuffer(1, n, actx.sampleRate); const d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
      const src = actx.createBufferSource(); src.buffer = b; const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500 + Math.random() * 2500;
      const cg = actx.createGain(); cg.gain.value = .2 + Math.random() * .5; src.connect(hp).connect(cg).connect(master); src.start();
    }, 90);
  }
  renderNoise();
}
function renderNoise() { $$('[data-noise]').forEach(b => b.classList.toggle('on', b.dataset.noise === currentNoise)); }
$$('[data-noise]').forEach(b => b.addEventListener('click', () => { if (currentNoise === b.dataset.noise) { stopNoise(); renderNoise(); } else playNoise(b.dataset.noise); }));
$('#noiseVol').addEventListener('input', e => { if (master) master.gain.value = +e.target.value / 100 * .6; });
function chime() {
  if (!ensureAudio()) return;
  [660, 880, 990].forEach((f, i) => { const o = actx.createOscillator(); const g = actx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, actx.currentTime + i * .18); g.gain.linearRampToValueAtTime(.18, actx.currentTime + i * .18 + .02); g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + i * .18 + .9); o.connect(g).connect(actx.destination); o.start(actx.currentTime + i * .18); o.stop(actx.currentTime + i * .18 + 1); });
}
renderPomo();
