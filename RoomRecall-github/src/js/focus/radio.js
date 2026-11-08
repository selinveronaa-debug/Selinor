/**
 * RoomRecall · focus/radio.js
 * RoomRecall FM: a generated lo-fi beat.
 */

/* ---------- Lo-fi radio: a small generative beat made with Web Audio ---------- */
const radio = { on: false, timer: null, step: 0, nodes: [] };
const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]; // Fmaj7 Em7 Dm7 Cmaj7
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
function radioOut() {
  if (!ensureAudio()) return null;
  if (!radio.bus) {
    radio.bus = actx.createGain(); radio.bus.gain.value = .5;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    radio.bus.connect(lp).connect(master);
  }
  return radio.bus;
}
function keyNote(freq, t, dur, vol) {
  const o = actx.createOscillator(), o2 = actx.createOscillator(), g = actx.createGain();
  o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = freq; o2.frequency.value = freq * 2.001; o.detune.value = -6;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(g); o2.connect(g); g.connect(radio.bus); o.start(t); o2.start(t); o.stop(t + dur + .05); o2.stop(t + dur + .05);
}
function drum(t, kind) {
  if (kind === 'kick') { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + .18); g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(g).connect(radio.bus); o.start(t); o.stop(t + .32); return; }
  const n = actx.createBufferSource(); n.buffer = radio.noise || (radio.noise = noiseBuffer('white'));
  const f = actx.createBiquadFilter(); f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : 1800;
  const g = actx.createGain(); const v = kind === 'hat' ? .05 : .16; const d = kind === 'hat' ? .04 : .14;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); n.connect(f).connect(g).connect(radio.bus); n.start(t, Math.random()); n.stop(t + d + .02);
}
function radioTick() {
  const beat = 60 / 72 / 2; // eighth notes at 72 bpm
  const t = actx.currentTime + .08; const st = radio.step++;
  const bar = Math.floor(st / 8) % CHORDS.length, pos = st % 8;
  if (pos === 0) CHORDS[bar].forEach((n, i) => keyNote(midi(n), t + i * .018, beat * 7.5, .05));
  if (pos === 4 && Math.random() < .7) keyNote(midi(CHORDS[bar][3] + 12 + [0, 2, -1][st % 3]), t, beat * 2, .03);
  if (pos === 0 || pos === 5) drum(t + (pos === 5 ? .03 : 0), 'kick');
  if (pos === 2 || pos === 6) drum(t + .02, 'snare');
  drum(t + (pos % 2 ? .035 : 0), 'hat');
  if (pos === 0) { const b = actx.createOscillator(), g = actx.createGain(); b.type = 'sine'; b.frequency.value = midi(CHORDS[bar][0] - 12); g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + beat * 6); b.connect(g).connect(radio.bus); b.start(t); b.stop(t + beat * 6); }
}
function setRadio(on) {
  if (on && !radioOut()) { toast('Sound is not supported in this browser.'); return; }
  radio.on = on; clearInterval(radio.timer);
  if (on) {
    radio.step = 0; radio.timer = setInterval(radioTick, (60 / 72 / 2) * 1000);
    if (currentNoise !== 'rain' && currentNoise !== 'fire') { const vinyl = actx.createBufferSource(); vinyl.buffer = noiseBuffer('pink'); vinyl.loop = true; const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000; const g = actx.createGain(); g.gain.value = .05; vinyl.connect(hp).connect(g).connect(radio.bus); vinyl.start(); radio.vinyl = vinyl; }
  } else { try { radio.vinyl?.stop(); } catch { } radio.vinyl = null; }
  $('#radio').classList.toggle('on', on);
  $('#radioBtn').textContent = on ? '❚❚' : '▶'; $('#radioBtn').setAttribute('aria-pressed', String(on));
  $('#radioNow').textContent = on ? 'now playing · midnight study loop' : 'lo-fi beats · off';
}
$('#radioBtn').addEventListener('click', () => setRadio(!radio.on));
$('#pomoStart').addEventListener('click', () => { if (pomo.running && $('#radioAuto').checked && !radio.on && pomo.mode === 'focus') setRadio(true); });
