/**
 * RoomRecall · art/dollhouse.js
 * Draws houses in SVG: the illustrated cutaway homes (with room shapes and object positions) and a code-drawn dollhouse for your own house.
 */

/* ---------- Dollhouse drawn in SVG ---------- */
const INK = '#3a2a26';
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
const S2 = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const glow = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#lampGlow)" pointer-events="none"/>`;
const nightWindow = (x, y, w, h) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#2f2840" ${S}/>
  <circle cx="${x + w * .72}" cy="${y + h * .3}" r="${Math.min(w, h) * .13}" fill="#f8ddb0"/>
  <circle cx="${x + w * .76}" cy="${y + h * .26}" r="${Math.min(w, h) * .12}" fill="#2f2840"/>
  <circle cx="${x + w * .25}" cy="${y + h * .25}" r="1.6" fill="#f8ddb0"/><circle cx="${x + w * .45}" cy="${y + h * .55}" r="1.3" fill="#f8ddb0"/><circle cx="${x + w * .18}" cy="${y + h * .7}" r="1.2" fill="#f8ddb0"/>
  <path d="M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}" stroke="#e8d6c4" stroke-width="5"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="none" ${S}/>`;

const ROOM_TYPES = {
  living: {
    label: 'Living room', wall: '#ecc9c4', deco: (w) => '',
    objects: [
      { name: 'the painting', cx: 195, cy: 70, svg: `<rect x="148" y="38" width="94" height="64" rx="4" fill="#c9a27a" ${S}/><rect x="157" y="47" width="76" height="46" fill="#a9c1c4" ${S2}/><path d="M157 93 L182 66 L198 80 L212 64 L233 93 Z" fill="#8c9a72" ${S2}/><circle cx="218" cy="58" r="6" fill="#f6c36b"/>` },
      { name: 'the floor lamp', cx: 340, cy: 120, svg: `${glow(340, 122, 70)}<path d="M340 118V208" ${S}/><ellipse cx="340" cy="209" rx="18" ry="5" fill="#5b443d" ${S2}/><path d="M316 118 L364 118 L353 86 L327 86 Z" fill="#f8ccaa" ${S}/>` },
      { name: 'the sofa', cx: 190, cy: 146, svg: `<rect x="106" y="128" width="188" height="48" rx="18" fill="#c09fa0" ${S}/><rect x="98" y="164" width="204" height="38" rx="12" fill="#d7b4b3" ${S}/><rect x="88" y="146" width="28" height="58" rx="13" fill="#c09fa0" ${S}/><rect x="284" y="146" width="28" height="58" rx="13" fill="#c09fa0" ${S}/><rect x="128" y="138" width="34" height="24" rx="9" fill="#f2c1a3" ${S2}/><rect x="236" y="138" width="34" height="24" rx="9" fill="#8c9a72" ${S2}/><path d="M112 204v8M288 204v8" ${S}/>` },
      { name: 'the coffee table', cx: 238, cy: 194, svg: `<rect x="146" y="188" width="108" height="9" rx="3" fill="#8a5a3b" ${S}/><path d="M156 197v15M244 197v15" ${S}/><path d="M180 188v-10h14v10" fill="#fff6ef" ${S2}/><path d="M194 181c6 0 6 6 0 6" fill="none" ${S2}/><rect x="212" y="181" width="26" height="7" rx="2" fill="#857c91" ${S2}/>` },
      { name: 'the plant', cx: 64, cy: 150, svg: `<ellipse cx="50" cy="140" rx="12" ry="28" transform="rotate(-25 50 140)" fill="#8c9a72" ${S2}/><ellipse cx="80" cy="136" rx="12" ry="30" transform="rotate(22 80 136)" fill="#5f6b4c" ${S2}/><ellipse cx="65" cy="126" rx="11" ry="32" fill="#8c9a72" ${S2}/><path d="M40 172 L90 172 L84 212 L46 212 Z" fill="#c97b5a" ${S}/>` }
    ]
  },
  kitchen: {
    label: 'Kitchen', wall: '#dfe0c6',
    deco: () => `<path d="M250 70H370" ${S}/><rect x="262" y="52" width="14" height="18" rx="3" fill="#f2c1a3" ${S2}/><rect x="284" y="48" width="14" height="22" rx="3" fill="#c09fa0" ${S2}/><rect x="306" y="54" width="14" height="16" rx="3" fill="#8c9a72" ${S2}/>`,
    objects: [
      { name: 'the hanging lamp', cx: 200, cy: 58, svg: `${glow(200, 78, 64)}<path d="M200 0V46" ${S}/><path d="M178 70 L222 70 L211 46 L189 46 Z" fill="#5b443d" ${S}/><ellipse cx="200" cy="71" rx="9" ry="4" fill="#f6c36b"/>` },
      { name: 'the fridge', cx: 55, cy: 150, svg: `<rect x="20" y="86" width="70" height="126" rx="9" fill="#f6efe6" ${S}/><path d="M20 128H90" ${S}/><path d="M80 100v18M80 140v24" ${S}/><circle cx="40" cy="106" r="5" fill="#c97b5a"/><rect x="34" y="140" width="14" height="10" fill="#f2c1a3" ${S2}/>` },
      { name: 'the dining table', cx: 182, cy: 178, svg: `<path d="M110 140v72M110 180h30v6h-30" fill="#a86f4c" ${S}/><rect x="122" y="168" width="122" height="9" rx="3" fill="#8a5a3b" ${S}/><path d="M132 177v35M234 177v35" ${S}/><path d="M176 168v-14c0-6 12-6 12 0v14" fill="#a9c1c4" ${S2}/><circle cx="178" cy="148" r="5" fill="#f2c1a3" ${S2}/><circle cx="188" cy="146" r="5" fill="#c09fa0" ${S2}/>` },
      { name: 'the stove', cx: 303, cy: 184, svg: `<rect x="262" y="148" width="84" height="64" rx="5" fill="#e9e2d6" ${S}/><rect x="272" y="170" width="64" height="34" rx="4" fill="#5b443d" ${S2}/><rect x="280" y="176" width="48" height="12" rx="2" fill="#f6c36b" opacity=".7"/><circle cx="278" cy="158" r="3.5" fill="${INK}"/><circle cx="292" cy="158" r="3.5" fill="${INK}"/><circle cx="330" cy="158" r="3.5" fill="${INK}"/>` },
      { name: 'the kettle', cx: 304, cy: 134, svg: `<path d="M288 148 Q286 124 304 122 Q322 124 320 148 Z" fill="#c97b5a" ${S}/><path d="M292 126 Q304 108 316 126" fill="none" ${S}/><path d="M320 134 L332 126" ${S}/><path d="M300 114c-4-6 4-8 0-14M310 114c-4-6 4-8 0-14" fill="none" stroke="#fff6ef" stroke-width="2" opacity=".8"/>` }
    ]
  },
  bedroom: {
    label: 'Bedroom', wall: '#f3d8c6', deco: () => '',
    objects: [
      { name: 'the window', cx: 226, cy: 64, svg: `<path d="M172 24h108" ${S}/>${nightWindow(182, 30, 88, 70)}<path d="M174 24 Q170 70 186 104 L176 104 Q164 64 174 24Z" fill="#c09fa0" ${S2}/><path d="M278 24 Q282 70 266 104 L276 104 Q288 64 278 24Z" fill="#c09fa0" ${S2}/>` },
      { name: 'the bed', cx: 252, cy: 170, svg: `<rect x="140" y="116" width="18" height="96" rx="7" fill="#8a5a3b" ${S}/><rect x="150" y="160" width="202" height="32" rx="9" fill="#fff6ef" ${S}/><rect x="198" y="154" width="156" height="40" rx="11" fill="#8c9a72" ${S}/><path d="M214 166h124" stroke="#5f6b4c" stroke-width="2"/><rect x="160" y="146" width="46" height="20" rx="9" fill="#f8ccaa" ${S2}/><path d="M156 192v20M346 194v18" ${S}/>` },
      { name: 'the bedside lamp', cx: 373, cy: 160, svg: `${glow(373, 150, 52)}<rect x="354" y="172" width="38" height="40" rx="4" fill="#8a5a3b" ${S}/><path d="M358 190h30" ${S2}/><path d="M367 172v-12h12v12" fill="#c09fa0" ${S2}/><path d="M360 160 L386 160 L380 138 L366 138 Z" fill="#f8ccaa" ${S}/>` },
      { name: 'the wardrobe', cx: 68, cy: 140, svg: `<rect x="22" y="66" width="94" height="146" rx="6" fill="#a86f4c" ${S}/><path d="M69 72V206" ${S}/><path d="M22 80H116" ${S2}/><circle cx="62" cy="142" r="3" fill="#f6c36b" ${S2}/><circle cx="76" cy="142" r="3" fill="#f6c36b" ${S2}/>` },
      { name: 'the rug', cx: 252, cy: 228, svg: `<ellipse cx="252" cy="229" rx="98" ry="12" fill="#c09fa0" ${S}/><ellipse cx="252" cy="229" rx="76" ry="7" fill="none" stroke="#fff6ef" stroke-width="2" stroke-dasharray="6 5"/>` }
    ]
  },
  study: {
    label: 'Study', wall: '#ddd5e4', deco: () => `<rect x="190" y="40" width="44" height="34" rx="3" fill="#fff6ef" ${S2}/><path d="M198 50h28M198 58h20M198 66h24" stroke="#857c91" stroke-width="2"/>`,
    objects: [
      { name: 'the bookshelf', cx: 62, cy: 130, svg: `<rect x="20" y="48" width="84" height="164" rx="5" fill="#8a5a3b" ${S}/><path d="M20 92H104M20 136H104M20 176H104" ${S}/>${[[28, 60, '#c09fa0'], [40, 64, '#8c9a72'], [52, 58, '#f2c1a3'], [66, 62, '#857c91'], [30, 104, '#f6c36b'], [44, 100, '#c97b5a'], [58, 106, '#a9c1c4'], [76, 102, '#c09fa0'], [32, 146, '#857c91'], [48, 150, '#8c9a72'], [64, 144, '#f2c1a3']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="11" height="${(y < 70 ? 92 : y < 120 ? 136 : 176) - y}" fill="${c}" ${S2}/>`).join('')}` },
      { name: 'the desk', cx: 258, cy: 176, svg: `<rect x="168" y="156" width="176" height="10" rx="3" fill="#8a5a3b" ${S}/><path d="M178 166v46" ${S}/><rect x="292" y="166" width="46" height="46" rx="3" fill="#a86f4c" ${S}/><path d="M298 186h34" ${S2}/>` },
      { name: 'the laptop', cx: 250, cy: 138, svg: `${glow(250, 140, 40)}<rect x="220" y="116" width="62" height="40" rx="4" fill="${INK}" ${S}/><rect x="226" y="121" width="50" height="30" rx="2" fill="#857c91"/><path d="M232 130h26M232 138h34M232 146h18" stroke="#f8ccaa" stroke-width="2"/><rect x="210" y="154" width="82" height="5" rx="2" fill="#c9b9c9" ${S2}/>` },
      { name: 'the globe', cx: 322, cy: 136, svg: `<circle cx="322" cy="132" r="16" fill="#a9c1c4" ${S}/><path d="M312 126c6 2 8 8 4 12M326 120c4 6 10 6 10 14M318 144c4-4 10-2 12 0" fill="#8c9a72" stroke="#5f6b4c" stroke-width="2"/><path d="M302 132 A20 20 0 0 0 342 132" fill="none" ${S2}/><path d="M322 152v4M312 157h20" ${S}/>` },
      { name: 'the desk chair', cx: 150, cy: 170, svg: `<rect x="128" y="138" width="14" height="54" rx="6" fill="#c09fa0" ${S}/><rect x="128" y="184" width="54" height="10" rx="4" fill="#c09fa0" ${S}/><path d="M156 194v10M140 210h34M144 204l-6 8M168 204l6 8" ${S}/>` }
    ]
  },
  bathroom: {
    label: 'Bathroom', wall: '#d5e1de',
    deco: () => `<path d="M0 120H400" stroke="#b9cbc6" stroke-width="2"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 40} 120V212" stroke="#b9cbc6" stroke-width="2"/>`).join('')}`,
    objects: [
      { name: 'the mirror', cx: 300, cy: 76, svg: `<circle cx="300" cy="76" r="32" fill="#c9a27a" ${S}/><circle cx="300" cy="76" r="24" fill="#e6eef0" ${S2}/><path d="M288 66 L296 58M290 76 L304 62" stroke="#fff" stroke-width="3"/>` },
      { name: 'the sink', cx: 300, cy: 150, svg: `<rect x="288" y="142" width="24" height="70" rx="5" fill="#fff6ef" ${S}/><rect x="258" y="126" width="84" height="18" rx="9" fill="#fff6ef" ${S}/><path d="M300 126v-12h12" fill="none" ${S}/>` },
      { name: 'the bathtub', cx: 118, cy: 176, svg: `<path d="M26 148 L212 148 L202 192 Q196 204 182 204 L58 204 Q44 204 38 192 Z" fill="#fff6ef" ${S}/><path d="M56 204l-6 8M184 204l6 8" ${S}/><circle cx="70" cy="140" r="9" fill="#fff" ${S2}/><circle cx="86" cy="134" r="7" fill="#fff" ${S2}/><circle cx="100" cy="141" r="6" fill="#fff" ${S2}/>` },
      { name: 'the rubber duck', cx: 164, cy: 136, svg: `<ellipse cx="162" cy="142" rx="16" ry="9" fill="#f6c36b" ${S}/><circle cx="172" cy="128" r="8" fill="#f6c36b" ${S}/><path d="M180 128 L188 131 L180 133" fill="#c97b5a" ${S2}/><circle cx="174" cy="126" r="1.5" fill="${INK}"/>` },
      { name: 'the towel', cx: 372, cy: 126, svg: `<path d="M350 94H394" ${S}/><rect x="356" y="94" width="32" height="64" rx="4" fill="#c09fa0" ${S}/><path d="M356 140h32M356 146h32" stroke="#fff6ef" stroke-width="2.5"/>` }
    ]
  },
  reading: {
    label: 'Reading nook', wall: '#ecd8b8', deco: () => nightWindow(24, 30, 118, 92),
    objects: [
      { name: 'the window seat', cx: 70, cy: 182, svg: `<rect x="16" y="150" width="138" height="62" rx="4" fill="#8a5a3b" ${S}/><path d="M60 156v50M106 156v50" ${S2}/><rect x="16" y="140" width="138" height="14" rx="6" fill="#f2c1a3" ${S}/>` },
      { name: 'the cat', cx: 114, cy: 126, svg: `<path d="M96 138 Q92 120 110 118 Q130 118 130 138 Z" fill="#5b443d" ${S}/><circle cx="126" cy="114" r="10" fill="#5b443d" ${S}/><path d="M118 108 L120 98 L126 105 M130 105 L134 98 L135 109" fill="#5b443d" ${S2}/><path d="M96 136 Q82 132 86 120" fill="none" ${S}/><circle cx="129" cy="113" r="1.6" fill="#f6c36b"/>` },
      { name: 'the armchair', cx: 222, cy: 160, svg: `<rect x="176" y="116" width="92" height="64" rx="20" fill="#8c9a72" ${S}/><rect x="170" y="164" width="104" height="30" rx="10" fill="#a3b08a" ${S}/><rect x="160" y="148" width="22" height="50" rx="10" fill="#8c9a72" ${S}/><rect x="262" y="148" width="22" height="50" rx="10" fill="#8c9a72" ${S}/><path d="M176 198v14M268 198v14" ${S}/><rect x="198" y="132" width="40" height="24" rx="9" fill="#f8ccaa" ${S2}/>` },
      { name: 'the reading lamp', cx: 298, cy: 118, svg: `${glow(298, 128, 56)}<path d="M298 112V208M286 210h24" ${S}/><path d="M298 112 Q298 96 312 96" fill="none" ${S}/><path d="M300 100 L326 100 L320 122 L306 122 Z" fill="#f8ccaa" ${S}/>` },
      { name: 'the bookcase', cx: 354, cy: 132, svg: `<rect x="320" y="54" width="68" height="158" rx="5" fill="#a86f4c" ${S}/><path d="M320 102H388M320 150H388" ${S}/>${[[328, 66, '#857c91'], [340, 70, '#c09fa0'], [354, 64, '#8c9a72'], [328, 114, '#f2c1a3'], [342, 112, '#a9c1c4'], [358, 118, '#c97b5a'], [330, 162, '#f6c36b'], [346, 166, '#857c91']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="11" height="${(y < 100 ? 102 : y < 150 ? 150 : 198) - y}" fill="${c}" ${S2}/>`).join('')}` }
    ]
  }
};
const ROOM_ORDER = ['living', 'kitchen', 'study', 'bedroom', 'bathroom', 'reading'];

const HOUSE_STYLES = {
  cottage: { frame: '#5b443d', siding: '#d8c3a5', roof: '#5b443d', roofEdge: INK },
  chalet: { frame: '#6e4630', siding: '#9a6845', roof: '#3a2a26', roofEdge: INK },
  villa: { frame: '#8f7f70', siding: '#e8d9c6', roof: '#4a3a34', roofEdge: INK },
  friends: { frame: '#7a4a3a', siding: '#c9a27a', roof: '#6b3f2f', roofEdge: INK },
  gilmore: { frame: '#5d6a80', siding: '#8394ad', roof: '#3d4352', roofEdge: INK },
  satc: { frame: '#7a5a3e', siding: '#c79a68', roof: '#5b443d', roofEdge: INK },
  himym: { frame: '#5b3a2a', siding: '#b07a4e', roof: '#3a2a26', roofEdge: INK },
  stranger: { frame: '#7a6a5a', siding: '#e2d6bf', roof: '#4f4a48', roofEdge: INK },
  bridgerton: { frame: '#9a8670', siding: '#ead8be', roof: '#5b4d44', roofEdge: INK },
  own: { frame: '#6e4630', siding: '#c9a27a', roof: '#4a3a34', roofEdge: INK }
};

function floorPlan(count) {
  return ({ 1: [1], 2: [2], 3: [2, 1], 4: [2, 2], 5: [3, 2], 6: [3, 3] })[count] || [2, 2];
}

function houseGeometry(count) {
  const W = 1000, t = 16, floorH = 262, roofH = 210;
  const floors = floorPlan(count);
  const nF = floors.length;
  const H = nF * floorH + t;
  const slots = [];
  floors.forEach((n, fi) => {
    const top = (nF - 1 - fi) * floorH;
    const y = top + t, h = floorH - t;
    const w = (W - t * (n + 1)) / n;
    for (let k = 0; k < n; k++) slots.push({ x: t + k * (w + t), y, w, h, floor: fi });
  });
  return { W, t, H, roofH, floorH, slots };
}

function roomTransform(slot) {
  const s = Math.min(slot.w / 400, slot.h / 250);
  return { s, ox: slot.x + (slot.w - 400 * s) / 2, oy: slot.y + slot.h - 250 * s };
}

/* Absolute positions of every object used in a room. */
function roomObjectPoints(room, slot) {
  if (room.photo && Array.isArray(room.photoObjects) && room.photoObjects.length) {
    const iw = room.photoW || 4, ih = room.photoH || 3;
    const scale = Math.max(slot.w / iw, slot.h / ih);
    const dw = iw * scale, dh = ih * scale;
    const x0 = slot.x + (slot.w - dw) / 2, y0 = slot.y + (slot.h - dh) / 2;
    return room.photoObjects.map(o => ({
      name: o.name,
      x: Math.min(slot.x + slot.w - 16, Math.max(slot.x + 16, x0 + o.x / 100 * dw)),
      y: Math.min(slot.y + slot.h - 16, Math.max(slot.y + 16, y0 + o.y / 100 * dh))
    }));
  }
  const type = ROOM_TYPES[room.type] || ROOM_TYPES.living;
  const { s, ox, oy } = roomTransform(slot);
  return type.objects.map(o => ({ name: o.name, x: ox + o.cx * s, y: oy + o.cy * s }));
}

function svgEsc(v) { return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/**
 * Draw the cutaway dollhouse.
 * opts: { rooms:[{type,label,photo,photoW,photoH,photoObjects}], style, mode:'setup'|'walk'|'mini', selected, pins:[[{n,state}]], uid }
 */
function drawDollhouse(opts) {
  const rooms = opts.rooms;
  const g = houseGeometry(rooms.length);
  const st = opts.palette || HOUSE_STYLES[opts.style] || HOUSE_STYLES.cottage;
  const uid = opts.uid || 'h';
  const { W, H, roofH } = g;
  const mini = opts.mode === 'mini';
  let defs = `<defs><radialGradient id="lampGlow"><stop offset="0" stop-color="#ffd58a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></radialGradient>
    <linearGradient id="${uid}grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4a34"/><stop offset="1" stop-color="#2e2c22"/></linearGradient>`;
  let body = '';
  // ground
  body += `<rect x="-400" y="${H - 6}" width="${W + 800}" height="140" fill="url(#${uid}grass)"/>`;
  body += `<path d="M${W / 2 - 60} ${H} Q${W / 2 - 120} ${H + 70} ${W / 2 - 260} ${H + 130} L${W / 2 + 40} ${H + 130} Q${W / 2 + 40} ${H + 60} ${W / 2 + 60} ${H}Z" fill="#8a6f5c" opacity=".55"/>`;
  [[-70, 0.9], [W + 60, 1.1], [-150, .7], [W + 150, .8]].forEach(([x, k]) => {
    body += `<g transform="translate(${x} ${H - 10}) scale(${k})"><ellipse cx="0" cy="0" rx="60" ry="38" fill="#4f5a3c" ${S}/><ellipse cx="-26" cy="-6" rx="30" ry="24" fill="#6a7550" ${S2}/><circle cx="18" cy="-14" r="5" fill="#f3d9d6"/><circle cx="-10" cy="-22" r="4" fill="#f8ccaa"/></g>`;
  });
  // roof + chimney
  body += `<rect x="${W * .72}" y="${-roofH * .8}" width="56" height="${roofH * .7}" fill="#b9a089" ${S}/><rect x="${W * .72 - 8}" y="${-roofH * .8 - 14}" width="72" height="16" fill="#8f7f70" ${S}/>`;
  body += `<path d="M-56 8 L${W / 2} ${-roofH} L${W + 56} 8 Z" fill="${st.roof}" stroke="${st.roofEdge}" stroke-width="8" stroke-linejoin="round"/>`;
  body += `<path d="M-20 0 L${W / 2} ${-roofH + 30} L${W + 20} 0" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="6"/>`;
  body += `<circle cx="${W / 2}" cy="${-roofH * .42}" r="34" fill="#f6c36b" ${S}/><path d="M${W / 2} ${-roofH * .42 - 34}V${-roofH * .42 + 34}M${W / 2 - 34} ${-roofH * .42}H${W / 2 + 34}" ${S}/>`;
  // building frame
  body += `<rect x="-6" y="-2" width="${W + 12}" height="${H + 4}" rx="6" fill="${st.frame}" stroke="${INK}" stroke-width="6"/>`;
  // rooms
  g.slots.forEach((slot, i) => {
    const room = rooms[i] || { type: ROOM_ORDER[i % 6] };
    const type = ROOM_TYPES[room.type] || ROOM_TYPES.living;
    const cid = `${uid}c${i}`;
    defs += `<clipPath id="${cid}"><rect x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}"/></clipPath>`;
    const { s, ox, oy } = roomTransform(slot);
    let inner = '';
    if (room.photo && !mini) {
      inner += `<image href="${svgEsc(room.photo)}" x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" preserveAspectRatio="xMidYMid slice"/>`;
    } else {
      inner += `<rect x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" fill="${type.wall}"/>`;
      inner += `<rect x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" fill="url(#${uid}stripe)" opacity=".5"/>`;
      const floorY = oy + 212 * s;
      inner += `<rect x="${slot.x}" y="${floorY}" width="${slot.w}" height="${slot.y + slot.h - floorY}" fill="#b98a66"/>`;
      for (let px = slot.x + 30; px < slot.x + slot.w; px += 60) inner += `<path d="M${px} ${floorY + 4}V${slot.y + slot.h}" stroke="#a07554" stroke-width="2"/>`;
      inner += `<path d="M${slot.x} ${floorY}H${slot.x + slot.w}" stroke="${INK}" stroke-width="4"/>`;
      if (!mini) {
        inner += `<g transform="translate(${ox} ${oy}) scale(${s})">${type.deco ? type.deco() : ''}${type.objects.map((o, oi) => `<g class="obj" data-room="${i}" data-obj="${oi}" data-tip="${svgEsc(o.name.replace(/^the /, ''))}">${o.svg}</g>`).join('')}</g>`;
      }
      // soft room light
      inner += `<rect x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" fill="url(#${uid}shade)" pointer-events="none"/>`;
    }
    body += `<g clip-path="url(#${cid})">${inner}</g>`;
    body += `<rect x="${slot.x}" y="${slot.y}" width="${slot.w}" height="${slot.h}" fill="none" stroke="${INK}" stroke-width="4"/>`;
    if (!mini) {
      const label = room.label || type.label;
      const shown = label.length > 22 ? label.slice(0, 21) + '…' : label;
      const lw = Math.min(slot.w - 24, 28 + (shown.length + 4) * 10.6);
      body += `<g pointer-events="none"><rect x="${slot.x + 12}" y="${slot.y + 12}" width="${lw}" height="30" rx="9" fill="#fff6ef" ${S2}/><text x="${slot.x + 24}" y="${slot.y + 33}" font-family="DM Mono, monospace" font-size="17" fill="${INK}">${i + 1} · ${svgEsc(shown)}</text></g>`;
    } else {
      body += `<text x="${slot.x + slot.w / 2}" y="${slot.y + slot.h / 2 + 22}" text-anchor="middle" font-family="DM Mono, monospace" font-size="64" fill="${INK}" opacity=".65">${i + 1}</text>`;
    }
    if (opts.mode === 'setup' && opts.selected === i) {
      body += `<g class="room-hit sel" pointer-events="none"><rect class="room-hl" x="${slot.x + 4}" y="${slot.y + 4}" width="${slot.w - 8}" height="${slot.h - 8}" rx="6"/></g>`;
    }
    if (opts.mode === 'setup') {
      const chosen = new Set((opts.pins?.[i] || []).map(p => p.obj));
      roomObjectPoints(room, slot).forEach((p, oi) => { if (!chosen.has(oi)) body += addMarker(p.x, p.y, Math.max(11, 15 * s), i, oi, p.name); });
    }
    if (opts.pins && opts.pins[i]) {
      const pts = roomObjectPoints(room, slot);
      const r = Math.max(12, 18 * s);
      opts.pins[i].forEach(pin => {
        const p = pts[pin.obj];
        if (!p) return;
        const fill = pin.state === 'cur' ? '#f8ccaa' : pin.state === 'done' ? '#8c9a72' : '#fff6ef';
        body += `<g class="pin ${pin.state}" data-pin-room="${i}" data-pin-item="${pin.item}" role="button" tabindex="0" aria-label="Spot ${pin.n}">
          ${pin.state === 'cur' ? `<circle class="pin-ring" cx="${p.x}" cy="${p.y}" r="${r + 9}" fill="none"/>` : ''}
          <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${Math.max(2.5, 3.5 * s)}"/>
          <text x="${p.x}" y="${p.y + r * .38}" text-anchor="middle" font-family="DM Mono, monospace" font-size="${r * 1.1}" fill="${INK}">${pin.n}</text></g>`;
      });
    }
  });
  defs += `<pattern id="${uid}stripe" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0 0V22" stroke="rgba(58,42,38,.08)" stroke-width="6"/></pattern>
    <linearGradient id="${uid}shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a26" stop-opacity=".18"/><stop offset=".35" stop-color="#3a2a26" stop-opacity="0"/><stop offset="1" stop-color="#3a2a26" stop-opacity=".12"/></linearGradient></defs>`;
  const full = { x: -170, y: -roofH - 40, w: W + 340, h: H + roofH + 150 };
  return { svg: defs + body, geometry: g, full };
}

/* A dashed "+" on an object that can become a spot (setup mode only). */
function addMarker(x, y, r, room, obj, name) {
  const label = svgEsc(String(name).replace(/^the /, ''));
  return `<g class="spot-add" data-room="${room}" data-obj="${obj}" data-tip="add ${label}" role="button" tabindex="0" aria-label="Add ${label} as a spot">
    <circle class="spot-hit" cx="${x}" cy="${y}" r="${r * 1.9}"/>
    <circle class="spot-ring" cx="${x}" cy="${y}" r="${r}"/>
    <path d="M${x - r * .45} ${y}H${x + r * .45}M${x} ${y - r * .45}V${y + r * .45}" class="spot-plus"/></g>`;
}

/* ---------- Illustrated cutaway houses (her artwork) ----------
   rect = [x, y, w, h] and object x/y are percentages of the image.
   Rooms are listed in walking order: front door first. */
const CUTAWAYS = {
  cottage: { src: './assets/cut-cottage.webp', w: 924, h: 802, rooms: [
    { label: 'Living room', type: 'living', rect: [5, 54, 46, 40], objects: [['the fireplace', 19, 76], ['the armchair', 12, 84], ['the sofa', 42, 83], ['the coffee table', 29, 87], ['the floor lamp', 46, 70], ['the bookshelf', 35, 64], ['the mantel flowers', 16, 64]] },
    { label: 'Kitchen', type: 'kitchen', rect: [52, 54, 41, 40], objects: [['the pendant lamp', 69, 60], ['the window', 62, 63], ['the sink', 63, 73], ['the dining table', 72, 85], ['the oven', 89, 81], ['the cabinets', 80, 61], ['the cooker hood', 89, 61]] },
    { label: 'Bedroom', type: 'bedroom', rect: [6, 20, 57, 31], poly: [[5, 51], [5, 45], [37, 10], [52, 24], [63, 26], [63, 51]], objects: [['the bed', 31, 45], ['the left lamp', 18, 40], ['the painting', 33, 26], ['the hanging plant', 46, 27], ['the dresser', 55, 45], ['the right lamp', 45, 40]] },
    { label: 'Bathroom', type: 'bathroom', rect: [64, 25, 24, 26], poly: [[64, 51], [64, 31], [75.5, 17], [88, 31], [88, 51]], objects: [['the bathtub', 76, 45], ['the window', 74, 29], ['the golden tap', 77, 37], ['the candle', 83, 41], ['the soap bottles', 68, 41]] }
  ] },
  chalet: { src: './assets/cut-chalet.webp', w: 1000, h: 1566, rooms: [
    { label: 'Kitchen', type: 'kitchen', rect: [5, 71, 87, 27], objects: [['the cooker hood', 43, 74], ['the pendant lamp', 61, 75], ['the sink', 23, 81], ['the oven', 45, 88], ['the dining table', 62, 89], ['the potted plant', 11, 93], ['the staircase', 81, 84]] },
    { label: 'Living room', type: 'living', rect: [5, 42, 87, 27], objects: [['the sofa', 40, 61], ['the wood stove', 72, 58], ['the window', 48, 50], ['the floor lamp', 15, 57], ['the coffee table', 43, 65], ['the painting', 27, 50], ['the armchair', 82, 64], ['the bookshelf', 86, 51]] },
    { label: 'Bedroom', type: 'bedroom', rect: [5, 14, 87, 25], poly: [[5, 39.5], [5, 31], [48, 5], [92, 31], [92, 39.5]], objects: [['the bed', 46, 33], ['the bedside lamp', 23, 27], ['the hanging plant', 35, 20], ['the painting', 68, 24], ['the armchair', 77, 33], ['the dresser', 87, 35], ['the railing', 12, 36]] }
  ] },
  villa: { src: './assets/cut-villa.webp', w: 1536, h: 1024, rooms: [
    { label: 'Entrance hall', type: 'reading', rect: [51, 76, 32, 19], objects: [['the front door', 58, 86], ['the wall lamp', 62, 80], ['the plant', 67, 84], ['the side table', 64, 90], ['the staircase', 76, 86]] },
    { label: 'Kitchen', type: 'kitchen', rect: [17, 76, 33, 19], objects: [['the fridge', 21, 86], ['the cooker hood', 29, 79], ['the stove', 31, 88], ['the window', 41, 81], ['the dining table', 42, 90]] },
    { label: 'Living room', type: 'living', rect: [17, 49, 36, 25], objects: [['the sofa', 35, 66], ['the arc lamp', 24, 56], ['the window', 31, 55], ['the painting', 44, 55], ['the flower vase', 41, 62]] },
    { label: 'Guest room', type: 'bedroom', rect: [54, 49, 29, 25], objects: [['the bed', 63, 67], ['the flower painting', 63, 55], ['the curtains', 75, 56], ['the globe lamp', 78, 62], ['the nightstand', 77, 68]] },
    { label: 'Bedroom', type: 'bedroom', rect: [17, 20, 35, 27], objects: [['the bed', 26, 41], ['the mushroom lamp', 35, 36], ['the curtains', 44, 30], ['the painting', 28, 28], ['the hanging plant', 36, 25]] },
    { label: 'Bathroom', type: 'bathroom', rect: [53, 20, 30, 27], objects: [['the bathtub', 60, 40], ['the round mirror', 74, 30], ['the sink', 75, 42], ['the hanging plant', 66, 25], ['the bottles', 79, 35]] }
  ] },
  friends: { src: './assets/cut-friends.webp', w: 1002, h: 948, rooms: [
    { label: 'The apartment', type: 'living', rect: [3, 15, 94, 82], objects: [['the purple door', 6, 52], ['the kitchen shelf', 19, 37], ['the dining table', 14, 76], ['the big window', 57, 40], ['the sofa', 37, 73], ['the coffee table', 66, 80], ['the cream armchair', 63, 64], ['the green armchair', 89, 85]] }
  ] },
  gilmore: { src: './assets/cut-gilmore.webp', w: 906, h: 1002, rooms: [
    { label: 'Living room', type: 'living', rect: [2, 50, 96, 45], objects: [['the fireplace', 23, 70], ['the bookshelf', 55, 65], ['the armchair', 16, 82], ['the coffee table', 37, 86], ['the sofa', 57, 82], ['the kitchen counter', 83, 78], ['the window', 40, 63]] },
    { label: 'Bedroom', type: 'bedroom', rect: [2, 10, 96, 37], objects: [['the bed', 52, 38], ['the window', 53, 24], ['the dresser', 15, 36], ['the painting', 36, 25], ['the armchair', 86, 36], ['the vanity', 70, 34]] }
  ] },
  satc: { src: './assets/cut-satc.webp', w: 900, h: 1002, rooms: [
    { label: 'Living room', type: 'living', rect: [3, 52, 94, 43], objects: [['the sofa', 52, 85], ['the bookshelf', 42, 65], ['the coffee table', 51, 91], ['the window', 66, 65], ['the writing desk', 90, 80], ['the armchair', 12, 82], ['the painting', 8, 65]] },
    { label: 'Bedroom', type: 'bedroom', rect: [3, 15, 94, 32], objects: [['the bed', 56, 40], ['the bookshelf', 66, 27], ['the lamp', 8, 33], ['the balcony door', 16, 32], ['the bedside lamp', 90, 32], ['the side table', 28, 38]] }
  ] },
  himym: { src: './assets/cut-himym.webp', w: 972, h: 978, rooms: [
    { label: 'Living room', type: 'living', rect: [2, 52, 96, 43], objects: [['the red sofa', 45, 88], ['the bookshelf', 32, 66], ['the table lamp', 8, 74], ['the desk', 88, 85], ['the fridge', 77, 78], ['the side table', 58, 89], ['the poster', 13, 63]] },
    { label: 'Dining room', type: 'kitchen', rect: [2, 15, 96, 33], objects: [['the dining table', 30, 43], ['the left window', 20, 30], ['the middle window', 42, 30], ['the door', 73, 33], ['the sofa', 75, 44], ['the lamp', 92, 38], ['the painting', 61, 30]] }
  ] },
  stranger: { src: './assets/cut-stranger.webp', w: 906, h: 978, rooms: [
    { label: 'Living room', type: 'living', rect: [2, 52, 96, 44], objects: [['the sofa', 25, 85], ['the floor lamp', 34, 70], ['the painting', 55, 68], ['the coffee table', 40, 91], ['the old TV', 80, 85], ['the shelf', 78, 67], ['the door', 7, 72]] },
    { label: 'Bedroom', type: 'bedroom', rect: [2, 18, 96, 33], objects: [['the bed', 52, 43], ['the lamp', 32, 33], ['the window', 50, 28], ['the dresser', 10, 43], ['the nightstand', 90, 45], ['the painting', 61, 28]] }
  ] },
  bridgerton: { src: './assets/cut-bridgerton.webp', w: 846, h: 978, rooms: [
    { label: 'Drawing room', type: 'living', rect: [2, 54, 96, 42], objects: [['the sofa', 25, 89], ['the chandelier', 50, 62], ['the armchair', 78, 87], ['the tea table', 50, 90], ['the lamp', 6, 82], ['the window', 25, 68], ['the wall sconce', 33, 72]] },
    { label: 'Bedroom', type: 'bedroom', rect: [2, 13, 96, 37], objects: [['the canopy bed', 50, 41], ['the chandelier', 50, 22], ['the lamp', 13, 40], ['the vanity', 85, 41], ['the left window', 25, 30], ['the right window', 75, 30]] }
  ] }
};

function cutawaySlot(cut, ri) {
  const [x, y, w, h] = cut.rooms[ri].rect;
  return { x: x / 100 * cut.w, y: y / 100 * cut.h, w: w / 100 * cut.w, h: h / 100 * cut.h };
}

/**
 * Draw one of the illustrated houses.
 * opts: { facade, used:[roomIndex in walking order], mode:'setup'|'walk'|'mini', pins:[[{obj,item,n,state}]] (by used index), selected }
 * Returns geometry.slots indexed like `used`.
 */
function drawCutaway(opts) {
  const cut = CUTAWAYS[opts.facade];
  const used = opts.used;
  const { w: W, h: H } = cut;
  const R = Math.max(W, H) * 0.028;
  let svg = `<defs><radialGradient id="hotGlow"><stop offset="0" stop-color="#ffe3a8" stop-opacity=".85"/><stop offset=".55" stop-color="#ffc977" stop-opacity=".35"/><stop offset="1" stop-color="#ffc977" stop-opacity="0"/></radialGradient></defs>`;
  svg += `<image href="${cut.src}" x="0" y="0" width="${W}" height="${H}"/>`;
  cut.rooms.forEach((room, ri) => {
    const s = cutawaySlot(cut, ri); const ui = used.indexOf(ri);
    if (ui === -1) {
      svg += room.poly
        ? `<polygon points="${room.poly.map(([px, py]) => `${px / 100 * W},${py / 100 * H}`).join(' ')}" fill="rgba(22,16,28,.66)" pointer-events="none"/>`
        : `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="rgba(22,16,28,.66)" pointer-events="none"/>`;
      const shape = room.poly ? `<polygon class="room-hl" points="${room.poly.map(([px, py]) => `${px / 100 * W},${py / 100 * H}`).join(' ')}" fill="transparent" stroke="transparent"/>` : `<rect class="room-hl" x="${s.x + 4}" y="${s.y + 4}" width="${s.w - 8}" height="${s.h - 8}" rx="8" fill="transparent" stroke="transparent"/>`;
      if (opts.mode === 'setup') svg += `<g class="room-hit" data-room-toggle="${ri}" role="button" tabindex="0" aria-label="Use the ${svgEsc(room.label)}">${shape}<text x="${s.x + s.w / 2}" y="${s.y + s.h / 2}" text-anchor="middle" font-family="DM Mono, monospace" font-size="${R * 1.1}" fill="#f8ccaa">+ use ${svgEsc(room.label.toLowerCase())}</text></g>`;
      return;
    }
    if (opts.mode === 'mini') return;
    // hover glows on every object of a room in use
    room.objects.forEach(([name, ox, oy], oi) => {
      svg += `<g class="hot" data-tip="${svgEsc(name.replace(/^the /, ''))}" data-room="${ui}" data-obj="${oi}"><circle class="hot-glow" cx="${ox / 100 * W}" cy="${oy / 100 * H}" r="${R * 2.2}" fill="url(#hotGlow)"/><circle cx="${ox / 100 * W}" cy="${oy / 100 * H}" r="${R * 1.6}" fill="transparent"/></g>`;
    });
    const L = Math.min(R, s.w * .045);
    const lw = L * 1.2 + (room.label.length + 4) * L * .6;
    svg += `<g pointer-events="none" class="room-label"><rect x="${s.x + L * .4}" y="${s.y + L * .4}" width="${lw}" height="${L * 1.45}" rx="${L * .45}" fill="#fff6ef" stroke="${INK}" stroke-width="${L * .12}"/><text x="${s.x + L * .9}" y="${s.y + L * 1.42}" font-family="DM Mono, monospace" font-size="${L * .9}" fill="${INK}">${ui + 1} · ${svgEsc(room.label)}</text></g>`;
    if (opts.mode === 'setup' && opts.selected === ui) svg += `<g class="room-hit sel" pointer-events="none">${room.poly ? `<polygon class="room-hl" points="${room.poly.map(([px, py]) => `${px / 100 * W},${py / 100 * H}`).join(' ')}"/>` : `<rect class="room-hl" x="${s.x + 4}" y="${s.y + 4}" width="${s.w - 8}" height="${s.h - 8}" rx="8"/>`}</g>`;
    if (opts.mode === 'setup') {
      const chosen = new Set((opts.pins?.[ui] || []).map(p => p.obj));
      room.objects.forEach(([name, ox, oy], oi) => {
        if (chosen.has(oi)) return;
        svg += addMarker(ox / 100 * W, oy / 100 * H, R * .72, ui, oi, name);
      });
    }
    if (opts.pins && opts.pins[ui]) {
      const r = R * .85;
      opts.pins[ui].forEach(pin => {
        const o = room.objects[pin.obj]; if (!o) return;
        const px = o[1] / 100 * W, py = o[2] / 100 * H;
        const fill = pin.state === 'cur' ? '#f8ccaa' : '#fff6ef';
        svg += `<g class="pin ${pin.state} h-${pin.health || 'new'}" data-pin-room="${ui}" data-pin-item="${pin.item}" data-tip="${svgEsc(o[0].replace(/^the /, ''))}" role="button" tabindex="0" aria-label="Spot ${pin.n}: ${svgEsc(o[0])}">
          <circle class="pin-health" cx="${px}" cy="${py}" r="${r * 2.1}"/>
          ${pin.state === 'cur' ? `<circle class="pin-ring" cx="${px}" cy="${py}" r="${r * 1.55}" fill="none"/>` : ''}
          <circle cx="${px}" cy="${py}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${r * .16}"/>
          <text x="${px}" y="${py + r * .36}" text-anchor="middle" font-family="DM Mono, monospace" font-weight="500" font-size="${r * 1.05}" fill="${INK}">${pin.n}</text></g>`;
      });
    }
  });
  const polys = used.map(ri => cut.rooms[ri].poly ? cut.rooms[ri].poly.map(([px, py]) => [px / 100 * W, py / 100 * H]) : null);
  return { svg, geometry: { slots: used.map(ri => cutawaySlot(cut, ri)), polys }, full: { x: -W * .04, y: -H * .03, w: W * 1.08, h: H * 1.06 } };
}
