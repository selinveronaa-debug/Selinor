/**
 * RoomRecall · ui/splash.js
 * The cosy loading screen: waits for the fonts and the street art, shows a study tip, then fades away.
 */

/* ---------- Loading screen ---------- */
(() => {
  const TIPS = [
    'Memory athletes store facts in places they already know.',
    'Testing yourself beats rereading: 61% vs 40% remembered after a week.',
    'A strange picture sticks better than a plain one.',
    'Walk the same route every time, front door first.',
    'Come back after 1, 3 and 7 days and the facts stay.',
    'Say the picture out loud while you look at the spot.'
  ];
  const MIN_MS = 1400, MAX_MS = 6000;
  const splash = $('#splash'); if (!splash) return;
  $('#splashTip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
  const steps = ['Lighting up your street…', 'Fluffing the cushions…', 'Putting the kettle on…', 'Opening the front door…'];
  let shown = 0;
  const statusTimer = setInterval(() => { shown = (shown + 1) % steps.length; $('#splashStatus').textContent = steps[shown]; }, 900);

  const loadImg = src => new Promise(res => { const i = new Image(); i.onload = i.onerror = res; i.src = src; });
  const tasks = [
    document.fonts ? document.fonts.ready : Promise.resolve(),
    loadImg('./assets/street-loop.webp'),
    ...['tower', 'cottage', 'chalet', 'blue', 'cabin'].map(n => loadImg(`./assets/house-${n}.webp`)),
    loadImg('./assets/logo.webp')
  ];
  let done = 0;
  tasks.forEach(t => t.then(() => { done++; $('#splashBar').style.width = `${Math.round(8 + done / tasks.length * 92)}%`; }));

  const started = performance.now();
  const finish = () => {
    clearInterval(statusTimer);
    $('#splashBar').style.width = '100%';
    $('#splashStatus').textContent = 'Welcome home ✿';
    setTimeout(() => { splash.classList.add('done'); setTimeout(() => splash.remove(), 700); }, 350);
  };
  Promise.race([Promise.all(tasks), new Promise(r => setTimeout(r, MAX_MS))])
    .then(() => setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - started))));
})();
