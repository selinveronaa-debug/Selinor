/**
 * RoomRecall · ui/screens.js
 * Screen switching and the animated night sky behind every screen.
 */

/* ---------- Screens ---------- */
function show(name) {
  $('#tip').hidden = true; $('#delConfirm').hidden = true; $('#delHouse').hidden = false;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === `screen-${name}`));
  state.screen = name;
  if (name !== 'palace' && live.on) leaveTogether();
  if (name === 'home') renderStreet();
  if (name === 'visit') requestAnimationFrame(sizeStreet);
  if (name === 'cities') openCities();
}
$('#brandBtn').addEventListener('click', () => show('home'));
$$('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));

/* ---------- Starry sky (global) ---------- */
function makeSky(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const isCalm = () => document.body.classList.contains('calm');
  const still = () => reduceMotion || isCalm();
  let w = 0, h = 0, stars = [], clouds = [], dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((w * h) / (opts.density || 5200));
    const band = opts.band || 1;
    stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.pow(Math.random(), 1.4) * h * band, r: Math.random() * 1.3 + .3, p: Math.random() * Math.PI * 2, s: .6 + Math.random() * 1.6, warm: Math.random() < .3 }));
    clouds = Array.from({ length: opts.clouds ?? 5 }, (_, i) => ({ x: Math.random() * w, y: (0.08 + Math.random() * .3) * h * band, rx: 120 + Math.random() * 180, ry: 18 + Math.random() * 20, v: 4 + Math.random() * 7, a: .05 + Math.random() * .06 }));
  }
  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    if (opts.background) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1b1524'); g.addColorStop(.55, '#2a2236'); g.addColorStop(1, '#3d2f42');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const glowG = ctx.createRadialGradient(w * .82, h * .08, 0, w * .82, h * .08, Math.max(w, h) * .45);
      glowG.addColorStop(0, 'rgba(248,204,170,.10)'); glowG.addColorStop(1, 'rgba(248,204,170,0)');
      ctx.fillStyle = glowG; ctx.fillRect(0, 0, w, h);
    }
    const sec = t / 1000;
    for (const s of stars) {
      const tw = isCalm() ? .5 : reduceMotion ? .8 : .45 + .55 * (0.5 + 0.5 * Math.sin(sec * s.s + s.p));
      ctx.globalAlpha = tw;
      ctx.fillStyle = s.warm ? '#ffe2b8' : '#f4ecff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      if (!isCalm() && s.r > 1.3 && tw > .85) { ctx.globalAlpha = tw * .35; ctx.fillRect(s.x - 4, s.y - .4, 8, .8); ctx.fillRect(s.x - .4, s.y - 4, .8, 8); }
    }
    ctx.globalAlpha = 1;
    for (const c of isCalm() ? [] : clouds) {
      if (!still()) { c.x += c.v / 60; if (c.x - c.rx > w) c.x = -c.rx; }
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.rx);
      g.addColorStop(0, `rgba(232,210,222,${c.a})`); g.addColorStop(1, 'rgba(232,210,222,0)');
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(1, c.ry / c.rx); ctx.translate(-c.x, -c.y);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, c.rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    if (!still()) requestAnimationFrame(frame);
  }
  resize(); window.addEventListener('resize', () => { resize(); if (still()) requestAnimationFrame(frame); });
  // Calm mode stops the loop after one still frame; turning it off starts the loop again.
  document.addEventListener('rr-calm', () => requestAnimationFrame(frame));
  requestAnimationFrame(frame);
}
makeSky($('#sky'), { background: true, density: 4200, clouds: 6 });
