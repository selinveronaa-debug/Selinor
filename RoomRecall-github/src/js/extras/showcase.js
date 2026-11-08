/*
 * Showcase at the bottom of the home page: the Data in Finance demo house
 * drawn as an annotated route. Twelve numbered spots, a walking line from
 * the front door, a label with the formula for each spot, and a card that
 * shows the question, answer and picture for the chosen spot. The room you
 * are in lights up; the rest of the house stays grey.
 */
(function showcase() {
  const stage = $('#scStage');
  if (!stage) return;
  const house = DEMO_HOUSE, cut = CUTAWAYS[house.style];

  // Stage coordinates: a 1600 × 820 box. The house sits in the middle.
  const W = 1600, H = 820, HX = 420, HY = 70, HW = 760, HH = HW * cut.h / cut.w;
  const at = (px, py) => [HX + px / 100 * HW, HY + py / 100 * HH];

  // Short label for each spot, in walking order.
  const SHORT = ['PV = FV / (1 + r)^t', 'Higher r, lower PV', 'FV = PV × (1 + r)^t', 'PV = Σ CFₜ / (1 + r)^t',
    'R = (P₁ − P₀) / P₀', 'R = (P₁ + D − P₀) / P₀', 'Sharpe = (E(R) − r_f) / σ', 'r ≈ i − π',
    'Rₚ = Σ wᵢRᵢ', 'Low correlation, more gain', 'ρ = Cov(X,Y) / (σₓσᵧ)', 'Market risk stays'];

  const spots = [];
  house.rooms.forEach((room, ri) => {
    const geo = cut.rooms[room.slot];
    room.items.forEach(it => {
      const [px, py] = geo.objects[it.obj].slice(1);
      const [x, y] = at(px, py);
      spots.push({ n: spots.length + 1, room, ri, geo, it, x, y, short: SHORT[spots.length] || it.answer });
    });
  });

  // Labels: left side for spots on the left half of the house, right side for the rest.
  // Spread each side so labels never overlap.
  const GAP = 76;
  function place(list) {
    list.sort((a, b) => a.y - b.y);
    let prev = -Infinity;
    for (const s of list) { s.ly = Math.max(s.y, prev + GAP); prev = s.ly; }
    const over = prev - (H - 40);
    if (over > 0) list.forEach(s => { s.ly -= over; });
    for (let i = 1; i < list.length; i++) list[i].ly = Math.max(list[i].ly, list[i - 1].ly + GAP);
  }
  const left = spots.filter(s => s.x < HX + HW * .45), right = spots.filter(s => !left.includes(s));
  left.forEach(s => { s.side = 'l'; s.lx = 380; }); right.forEach(s => { s.side = 'r'; s.lx = 1220; });
  place(left); place(right);

  // Walking route: gentle curves between consecutive spots.
  const route = spots.map((s, i) => {
    if (!i) return `M ${s.x - 150} ${s.y - 60} Q ${s.x - 60} ${s.y - 90} ${s.x - 22} ${s.y - 12}`;
    const p = spots[i - 1], mx = (p.x + s.x) / 2, my = (p.y + s.y) / 2;
    const dx = s.x - p.x, dy = s.y - p.y, len = Math.hypot(dx, dy) || 1, bend = Math.min(60, len * .25);
    const cx = mx - dy / len * bend, cy = my + dx / len * bend;
    const ux = (s.x - cx), uy = (s.y - cy), ul = Math.hypot(ux, uy) || 1;
    return `M ${p.x} ${p.y} Q ${cx} ${cy} ${s.x - ux / ul * 24} ${s.y - uy / ul * 24}`;
  });
  const last = spots[spots.length - 1];
  const pct = (v, of) => (v / of * 100).toFixed(3) + '%';
  const clip = geo => {
    const pts = geo.poly || [[geo.rect[0], geo.rect[1]], [geo.rect[0] + geo.rect[2], geo.rect[1]], [geo.rect[0] + geo.rect[2], geo.rect[1] + geo.rect[3]], [geo.rect[0], geo.rect[1] + geo.rect[3]]];
    return 'polygon(' + pts.map(([x, y]) => `${x}% ${y}%`).join(',') + ')';
  };

  stage.innerHTML = `
    <div class="sc-house" style="left:${pct(HX, W)};top:${pct(HY, H)};width:${pct(HW, W)};height:${pct(HH, H)}">
      <img class="sc-grey" src="${cut.src}" alt="Cutaway of the Data in Finance cottage with twelve numbered spots">
      ${house.rooms.map((r, i) => `<img class="sc-lit" data-room="${i}" src="${cut.src}" alt="" style="clip-path:${clip(cut.rooms[r.slot])}">`).join('')}
      ${house.rooms.map((r, i) => {
        // Room tags sit where no spot is: top of the living room, bottom of the others.
        const g = cut.rooms[r.slot], top = i === 0 ? g.rect[1] + 1 : g.rect[1] + g.rect[3] - 6;
        const name = r.topic.length > 18 ? r.topic.split(' and ')[0] : r.topic;
        return `<span class="sc-room" style="left:${g.rect[0] + 1.5}%;top:${top}%">${i + 1} · ${esc(name)}</span>`; }).join('')}
    </div>
    <svg class="sc-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <defs><marker id="scArrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>
      ${spots.map(s => `<path class="sc-lead" data-n="${s.n}" d="M ${s.side === 'l' ? s.lx + 12 : s.lx - 12} ${s.ly} L ${s.x} ${s.y}"/>`).join('')}
      ${route.map((d, i) => `<path class="sc-route" data-n="${i + 1}" d="${d}" marker-end="url(#scArrow)"/>`).join('')}
      <path class="sc-route" d="M ${last.x + 14} ${last.y - 20} Q ${last.x + 40} ${last.y - 110} ${last.x + 110} ${last.y - 150}" marker-end="url(#scArrow)"/>
    </svg>
    <span class="sc-tag" style="left:${pct(spots[0].x - 190, W)};top:${pct(spots[0].y - 62, H)}">START</span>
    <span class="sc-tag" style="left:${pct(last.x + 104, W)};top:${pct(last.y - 184, H)}">END</span>
    ${spots.map(s => `<button class="sc-num" type="button" data-n="${s.n}" style="left:${pct(s.x, W)};top:${pct(s.y, H)}" aria-label="Spot ${s.n}: ${esc(cap(s.it.spot))}, ${esc(s.room.label)}">${s.n}</button>`).join('')}
    ${spots.map(s => `<button class="sc-label ${s.side}" type="button" data-n="${s.n}" style="${s.side === 'l' ? 'right' : 'left'}:${pct(s.side === 'l' ? W - s.lx : s.lx, W)};top:${pct(s.ly, H)}" tabindex="-1">
      <span class="sc-name"><i>${String(s.n).padStart(2, '0')}</i> ${esc(cap(s.it.spot))}</span><span class="sc-short">${esc(s.short)}</span></button>`).join('')}`;

  function show(n) {
    const s = spots[n - 1];
    stage.querySelectorAll('[data-n]').forEach(el => el.classList.toggle('on', +el.dataset.n === n));
    stage.querySelectorAll('.sc-route[data-n]').forEach(el => el.classList.toggle('done', +el.dataset.n <= n));
    stage.querySelectorAll('.sc-lit').forEach(el => el.classList.toggle('on', +el.dataset.room === s.ri));
    $('#scFile').textContent = `spot_${String(n).padStart(2, '0')}.txt`;
    $('#scCard').innerHTML = `
      <p class="eyebrow">${esc(s.room.label)} · ${esc(s.room.topic)}</p>
      <h3>${esc(cap(s.it.spot))}</h3>
      <p class="sc-q">${esc(s.it.question)}</p>
      <div class="sc-a">${esc(s.it.answer)}</div>
      <p class="sc-pic"><em>picture this</em>${esc(s.it.story)}</p>`;
  }
  stage.addEventListener('mouseover', e => { const b = e.target.closest('[data-n]'); if (b && b.matches('button')) show(+b.dataset.n); });
  stage.addEventListener('click', e => { const b = e.target.closest('button[data-n]'); if (b) show(+b.dataset.n); });
  stage.addEventListener('focusin', e => { const b = e.target.closest('button[data-n]'); if (b) show(+b.dataset.n); });
  $('#scWalk').addEventListener('click', () => $('#demoBtn').click());
  show(7);
})();
