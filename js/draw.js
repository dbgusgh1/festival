/* 그리기 모음: 캐릭터, 효과, 여행지 배경, 조이스틱 게임 화면. 교실 화면과 학생 폰이 같은 함수를 쓴다. */
const TEAM = [
  { n: '빨강', c: '#ff5a5f', d: '#b8323a', s: '▲' }, { n: '파랑', c: '#3d8bff', d: '#1c56b8', s: '●' },
  { n: '초록', c: '#27b56a', d: '#137a43', s: '■' }, { n: '노랑', c: '#f5b301', d: '#a87800', s: '★' }
];
const LVNAME = ['', '하', '중', '상'], LVCOL = ['', '#27b56a', '#f5a301', '#e63946'];
const INK = '#2b2118';
const FONT = 'Jua, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif';
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = k => 1 - Math.pow(1 - clamp01(k), 3);
const easeBack = k => { k = clamp01(k); const s = 1.70158; return 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
function txt(c, s, x, y, sz, col, al, stroke) {
  c.font = sz + 'px ' + FONT; c.textAlign = al || 'center'; c.textBaseline = 'middle';
  if (stroke) { c.lineWidth = Math.max(3, sz * 0.2); c.strokeStyle = stroke; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = col || '#333'; c.fillText(s, x, y);
}
function rr(c, x, y, w, h, r, fill, stroke, lw) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.lineWidth = lw || 4; c.strokeStyle = stroke; c.stroke(); }
}
// 스티커처럼 아래에 그림자가 진 판
function card(c, x, y, w, h, r, fill, lw, drop) {
  drop = drop == null ? 8 : drop;
  if (drop) rr(c, x, y + drop, w, h, r, 'rgba(43,33,24,.85)');
  rr(c, x, y, w, h, r, fill || '#fff', INK, lw || 5);
}
function pill(c, s, x, y, sz, bg, col, al) {
  c.font = sz + 'px ' + FONT; const w = c.measureText(s).width + sz * 1.1, h = sz * 1.55;
  const x0 = al === 'left' ? x : al === 'right' ? x - w : x - w / 2;
  rr(c, x0, y - h / 2, w, h, h / 2, bg || '#fff', INK, Math.max(2, sz * 0.12));
  txt(c, s, x0 + w / 2, y + 1, sz, col || INK);
  return w;
}
function wrapText(c, s, x, y, maxW, sz, col) {
  c.font = sz + 'px ' + FONT; const lines = []; let cur = '';
  for (const ch of String(s)) { if (c.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch; }
  lines.push(cur);
  lines.forEach((l, i) => txt(c, l, x, y + (i - (lines.length - 1) / 2) * sz * 1.25, sz, col));
}
const nameOf = (pl, id) => (pl ? (pl.hide ? '친구' : pl.n) : '?');
function lvBadge(c, lv, x, y, sz) { if (!lv) return; pill(c, '난이도 ' + LVNAME[lv], x, y, sz || 26, LVCOL[lv], '#fff', 'right'); }

/* ── 효과: 꽃가루, 별, 먼지, +점수 글자, 화면 흔들림. 교실 화면에서만 켠다. ── */
const FX = (function () {
  const L = []; let shake = 0, last = 0;
  const add = o => { if (FX.on && L.length < 700) L.push(o); };
  const R = Math.random;
  return {
    on: false,
    burst(x, y, n, cols, sp) { cols = cols || ['#ff5a5f', '#ffd400', '#3d8bff', '#27b56a', '#ff8fd8']; for (let k = 0; k < (n || 20); k++) { const a = R() * 6.28, v = (sp || 380) * (0.4 + R()); add({ k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160, t: 0, life: 0.7 + R() * 0.6, col: cols[k % cols.length], s: 7 + R() * 9, rot: R() * 6 }); } },
    stars(x, y, n, col) { for (let k = 0; k < (n || 8); k++) { const a = k / (n || 8) * 6.28, v = 220 + R() * 160; add({ k: 's', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.7, col: col || '#ffd400', s: 22 + R() * 14 }); } },
    pop(x, y, text, col, sz) { add({ k: 't', x, y, text, col: col || '#ff5a5f', sz: sz || 44, t: 0, life: 1.3 }); },
    ring(x, y, col, R0) { add({ k: 'r', x, y, col: col || '#fff', R: R0 || 90, t: 0, life: 0.55 }); },
    dust(x, y) { if (L.length < 250) add({ k: 'd', x: x + (R() - 0.5) * 10, y, vx: (R() - 0.5) * 40, vy: -20 - R() * 30, t: 0, life: 0.45, s: 5 + R() * 6 }); },
    confetti(n) { for (let k = 0; k < (n || 120); k++) add({ k: 'c', x: R() * 1600, y: -20 - R() * 500, vx: (R() - 0.5) * 120, vy: 180 + R() * 220, t: 0, life: 4.5, col: `hsl(${(R() * 360) | 0} 95% 60%)`, s: 8 + R() * 8, rot: R() * 6, w: 2 + R() * 4 }); },
    shake(a) { if (FX.on) shake = Math.max(shake, a); },
    // 게임 좌표(확대·축소된 그림 안)를 화면 좌표로 바꿔 준다
    at(c, x, y) { const m = c.getTransform(), k = c.canvas.width / 1600; return [(m.a * x + m.c * y + m.e) / k, (m.b * x + m.d * y + m.f) / k]; },
    pre(c) { if (shake > 0.5) c.translate((R() - 0.5) * shake, (R() - 0.5) * shake); },
    draw(c) {
      const now = performance.now() / 1000, dt = Math.min(0.05, last ? now - last : 0.016); last = now; shake *= Math.pow(0.02, dt);
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i]; p.t += dt; if (p.t >= p.life) { L.splice(i, 1); continue; }
        const k = p.t / p.life;
        if (p.k === 'p' || p.k === 's' || p.k === 'c' || p.k === 'd') { p.x += p.vx * dt; p.y += p.vy * dt; if (p.k === 'p') p.vy += 900 * dt; if (p.k === 's') { p.vx *= 0.94; p.vy *= 0.94; } if (p.k === 'c') p.rot += dt * 5; }
        c.globalAlpha = p.k === 'c' ? 1 : 1 - k * k;
        if (p.k === 'p') { c.save(); c.translate(p.x, p.y); c.rotate(p.rot + k * 8); c.fillStyle = p.col; c.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); c.restore(); }
        else if (p.k === 'c') { c.save(); c.translate(p.x + Math.sin(p.t * 3 + p.rot) * 30, p.y); c.rotate(p.rot); c.fillStyle = p.col; c.fillRect(-p.s / 2, -p.w / 2, p.s, p.w * 2.5 * Math.abs(Math.cos(p.rot))); c.restore(); }
        else if (p.k === 's') txt(c, '★', p.x, p.y, p.s * (1 - k * 0.5), p.col, 'center', INK);
        else if (p.k === 'd') { c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(p.x, p.y, p.s * (1 + k), 0, 7); c.fill(); }
        else if (p.k === 't') { const sc = k < 0.15 ? easeBack(k / 0.15) : 1; txt(c, p.text, p.x, p.y - k * 70, p.sz * sc, p.col, 'center', '#fff'); }
        else if (p.k === 'r') { c.strokeStyle = p.col; c.lineWidth = 10 * (1 - k); c.beginPath(); c.arc(p.x, p.y, p.R * easeOut(k), 0, 7); c.stroke(); }
      }
      c.globalAlpha = 1;
    },
    clear() { L.length = 0; shake = 0; }
  };
})();

/* ── 캐릭터 ── seed 하나로 색·귀 모양이 정해진다. 12번에 한 번은 황금색.
   o.walk(0~1): 걷는 세기 → 발이 번갈아 들리고 팔을 흔든다.  o.dir: 바라보는 방향(라디안) → 눈동자가 그쪽을 본다.
   o.face: smile / laugh / shock / dizzy / sad,  o.cheer: 두 팔 번쩍,  o.nofeet: 발 없이(지렁이 머리) */
function hat(c, s, k) {
  c.lineWidth = s * 0.09; c.strokeStyle = '#3a2a1a';
  if (k === 'band') { c.strokeStyle = '#e63946'; c.lineWidth = s * 0.2; c.beginPath(); c.arc(0, 0, s * 0.95, Math.PI * 1.18, Math.PI * 1.82); c.stroke(); c.fillStyle = '#e63946'; c.beginPath(); c.ellipse(s * 0.92, -s * 0.36, s * 0.12, s * 0.3, 0.6, 0, 7); c.fill(); }
  else if (k === 'gym') { c.strokeStyle = '#fff'; c.lineWidth = s * 0.22; c.beginPath(); c.arc(0, 0, s * 0.95, Math.PI * 1.18, Math.PI * 1.82); c.stroke(); c.strokeStyle = '#3d8bff'; c.lineWidth = s * 0.07; c.beginPath(); c.arc(0, 0, s * 0.95, Math.PI * 1.18, Math.PI * 1.82); c.stroke(); }
  else if (k === 'explorer' || k === 'desert') { c.fillStyle = k === 'desert' ? '#f1d9a0' : '#b98a4e'; c.beginPath(); c.ellipse(0, -s * 0.72, s * 1.15, s * 0.22, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(0, -s * 0.78, s * 0.6, Math.PI, 0); c.fill(); c.stroke(); c.fillStyle = k === 'desert' ? '#e07a2f' : '#6b3d1f'; c.fillRect(-s * 0.6, -s * 0.86, s * 1.2, s * 0.12); }
  else if (k === 'city') { c.fillStyle = '#ffd400'; c.beginPath(); c.arc(0, -s * 0.62, s * 0.72, Math.PI, 0); c.fill(); c.stroke(); c.fillRect(-s * 0.9, -s * 0.66, s * 1.8, s * 0.14); c.strokeRect(-s * 0.9, -s * 0.66, s * 1.8, s * 0.14); }
  else if (k === 'sea') { c.fillStyle = 'rgba(160,230,255,.75)'; c.strokeStyle = '#0b5ea8'; c.beginPath(); c.roundRect(-s * 0.72, -s * 0.4, s * 1.44, s * 0.55, s * 0.2); c.fill(); c.stroke(); c.fillStyle = '#ffd400'; c.fillRect(s * 0.7, -s * 1.1, s * 0.14, s * 0.8); }
  else if (k === 'night') { c.strokeStyle = '#7a6cff'; c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(0, -s * 1.35); c.stroke(); txt(c, '★', 0, -s * 1.5, s * 0.6, '#ffe45c'); }
  else if (k === 'party') { c.fillStyle = '#ff6fb5'; c.beginPath(); c.moveTo(-s * 0.4, -s * 0.8); c.lineTo(0, -s * 1.7); c.lineTo(s * 0.4, -s * 0.8); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = s * 0.08; c.beginPath(); c.moveTo(-s * 0.26, -s * 1.08); c.lineTo(s * 0.2, -s * 1.2); c.stroke(); c.fillStyle = '#ffe45c'; c.beginPath(); c.arc(0, -s * 1.7, s * 0.14, 0, 7); c.fill(); }
  else if (k === 'crown') { c.fillStyle = '#ffd400'; c.beginPath(); c.moveTo(-s * 0.55, -s * 0.75); c.lineTo(-s * 0.55, -s * 1.25); c.lineTo(-s * 0.27, -s * 1.0); c.lineTo(0, -s * 1.35); c.lineTo(s * 0.27, -s * 1.0); c.lineTo(s * 0.55, -s * 1.25); c.lineTo(s * 0.55, -s * 0.75); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#ff5a5f'; c.beginPath(); c.arc(0, -s * 0.92, s * 0.09, 0, 7); c.fill(); }
  else if (k === 'chef') { c.fillStyle = '#fff'; c.beginPath(); c.arc(-s * 0.3, -s * 1.05, s * 0.3, 0, 7); c.arc(s * 0.3, -s * 1.05, s * 0.3, 0, 7); c.arc(0, -s * 1.2, s * 0.34, 0, 7); c.fill(); c.stroke(); c.fillRect(-s * 0.5, -s * 0.95, s, s * 0.26); c.strokeRect(-s * 0.5, -s * 0.95, s, s * 0.26); }
}
const charCol = (seed, ghost) => { const hue = (seed * 47) % 360, gold = seed % 12 === 0; return ghost ? ['#cfd3da', '#8a8f99', '#a9aeb7'] : gold ? ['#ffd54a', '#a8740a', '#e5a92a'] : [`hsl(${hue} 85% 68%)`, `hsl(${hue} 55% 32%)`, `hsl(${hue} 62% 54%)`]; };
const CHAR_CACHE = new Map();
function drawChar(c, x, y, s, seed, o) {
  o = o || {}; seed = seed || 1;
  if (o.cache) return drawCharCached(c, x, y, s, seed, o);
  const T = performance.now() / 1000, ear = seed % 5, gold = seed % 12 === 0, m0 = c.getTransform(), lo = s * Math.hypot(m0.a, m0.b) < 15;   // 화면에서 작으면 잔무늬 생략
  const [body, line, dark] = charCol(seed, o.ghost);
  const walk = clamp01(o.walk || 0), ph = o.ph != null ? o.ph : T * 13 + seed * 1.7;
  const fx = o.dir != null ? Math.cos(o.dir) : 0, fy = o.dir != null ? Math.sin(o.dir) : 0;
  const bob = (o.bob || 0) - walk * Math.abs(Math.sin(ph)) * s * 0.16;
  const br = 1 + Math.sin(T * 2.6 + seed) * 0.03 * (1 - walk);
  c.save(); c.translate(x, y);
  if (o.alpha != null) c.globalAlpha = o.alpha;
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(0, s * 1.02, s * 0.8 * (1 + bob / s * 0.3), s * 0.2, 0, 0, 7); c.fill();
  if (o.team != null) { c.strokeStyle = TEAM[o.team].c; c.lineWidth = s * 0.22; c.beginPath(); c.ellipse(0, s * 1.0, s * 1.05, s * 0.3, 0, 0, 7); c.stroke(); }
  c.translate(0, bob);
  c.lineWidth = s * 0.11; c.strokeStyle = line; c.lineJoin = 'round';
  // 발: 걸을 때 번갈아 들린다
  if (!o.nofeet) for (const d of [-1, 1]) {
    const lift = walk ? Math.max(0, Math.sin(ph + (d > 0 ? Math.PI : 0))) * s * 0.26 * walk : 0;
    c.fillStyle = dark; c.beginPath(); c.ellipse(d * s * 0.42 + fx * s * 0.12, s * 0.86 - lift, s * 0.27, s * 0.18, 0, 0, 7); c.fill(); c.stroke();
  }
  c.rotate(fx * walk * 0.13 + (o.tilt || 0));
  if (o.sq) c.scale(1 + o.sq, 1 - o.sq);
  c.scale(2 - br, br);
  c.fillStyle = body;
  if (ear === 0) for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * s * 0.85, -s * 0.35); c.lineTo(d * s * 0.75, -s * 1.15); c.lineTo(d * s * 0.25, -s * 0.8); c.closePath(); c.fill(); c.stroke(); }
  if (ear === 1) for (const d of [-1, 1]) { const flop = walk * Math.sin(ph + d) * 0.2; c.beginPath(); c.ellipse(d * s * 0.4, -s * 1.2, s * 0.2, s * 0.55, d * 0.15 + flop, 0, 7); c.fill(); c.stroke(); }
  if (ear === 2) for (const d of [-1, 1]) { c.beginPath(); c.arc(d * s * 0.68, -s * 0.72, s * 0.3, 0, 7); c.fill(); c.stroke(); }
  if (ear === 3) { const sw = Math.sin(T * 4 + seed) * s * 0.15 + walk * Math.sin(ph) * s * 0.2; c.beginPath(); c.moveTo(0, -s * 0.9); c.quadraticCurveTo(s * 0.3 + sw, -s * 1.4, sw, -s * 1.5); c.stroke(); c.beginPath(); c.arc(sw, -s * 1.5, s * 0.14, 0, 7); c.fill(); c.stroke(); }
  if (ear === 4) for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * s * 0.5, -s * 0.75); c.quadraticCurveTo(d * s * 0.9, -s * 1.0, d * s * 0.7, -s * 1.3); c.stroke(); }
  c.beginPath(); c.ellipse(0, 0, s, s * 0.93, 0, 0, 7); c.fill(); c.stroke();
  if (!lo) { c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-s * 0.4, -s * 0.5, s * 0.28, s * 0.16, -0.5, 0, 7); c.fill(); }
  // 손: 걸을 때 흔들고, 신나면 번쩍
  if (!o.nofeet && (!lo || o.cheer)) for (const d of [-1, 1]) {
    let hx = d * s * 0.98, hy = s * 0.25;
    if (o.cheer) { hx = d * s * 1.0; hy = -s * 0.55 - Math.abs(Math.sin(T * 10 + d)) * s * 0.25; }
    else if (walk) { hy += Math.sin(ph + (d > 0 ? 0 : Math.PI)) * s * 0.18 * walk; hx += fx * s * 0.05; }
    c.fillStyle = body; c.beginPath(); c.arc(hx, hy, s * 0.2, 0, 7); c.fill(); c.stroke();
  }
  if (!lo) { c.fillStyle = 'rgba(255,120,150,.55)'; for (const d of [-1, 1]) { c.beginPath(); c.ellipse(d * s * 0.58, s * 0.18, s * 0.2, s * 0.13, 0, 0, 7); c.fill(); } }
  const f = o.face || 'smile', blink = !o.noblink && f === 'smile' && ((T + seed * 0.731) % 4.3) < 0.13;
  c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = s * 0.1; c.lineCap = 'round';
  const lx = fx * s * 0.07, ly = fy * s * 0.05;
  for (const d of [-1, 1]) {
    const ex = d * s * 0.34 + lx * 0.6, ey = -s * 0.08 + ly * 0.6;
    if (f === 'laugh') { c.beginPath(); c.moveTo(ex - s * 0.16, ey + s * 0.05); c.lineTo(ex, ey - s * 0.1); c.lineTo(ex + s * 0.16, ey + s * 0.05); c.stroke(); }
    else if (f === 'shock') { c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, s * 0.2, 0, 7); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(ex + lx * 0.5, ey + ly * 0.5, s * 0.06, 0, 7); c.fill(); }
    else if (f === 'dizzy') { c.beginPath(); c.moveTo(ex - s * 0.12, ey - s * 0.12); c.lineTo(ex + s * 0.12, ey + s * 0.12); c.moveTo(ex + s * 0.12, ey - s * 0.12); c.lineTo(ex - s * 0.12, ey + s * 0.12); c.stroke(); }
    else if (f === 'sad') { c.beginPath(); c.arc(ex, ey, s * 0.1, 0, 7); c.fill(); c.beginPath(); c.moveTo(ex - d * s * 0.18, ey - s * 0.24); c.lineTo(ex + d * s * 0.02, ey - s * 0.18); c.stroke(); }
    else if (blink) { c.beginPath(); c.moveTo(ex - s * 0.12, ey); c.lineTo(ex + s * 0.12, ey); c.stroke(); }
    else { c.beginPath(); c.arc(ex + lx * 0.4, ey + ly * 0.4, s * 0.12, 0, 7); c.fill(); if (!lo) { c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + lx * 0.4 - s * 0.04, ey + ly * 0.4 - s * 0.05, s * 0.045, 0, 7); c.fill(); c.fillStyle = INK; } }
  }
  if (f === 'laugh') { c.fillStyle = '#c2313e'; c.beginPath(); c.arc(lx * 0.5, s * 0.22, s * 0.3, 0, Math.PI); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#ff8fa3'; c.beginPath(); c.arc(lx * 0.5, s * 0.42, s * 0.14, Math.PI, 0); c.fill(); }
  else if (f === 'shock') { c.beginPath(); c.ellipse(lx * 0.5, s * 0.36, s * 0.1, s * 0.14, 0, 0, 7); c.fill(); }
  else if (f === 'dizzy' || f === 'sad') { c.beginPath(); c.arc(lx * 0.5, s * 0.44, s * 0.16, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke(); }
  else { c.beginPath(); c.arc(lx * 0.5, s * 0.22, s * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
  c.lineCap = 'butt';
  if (f === 'dizzy') for (let k = 0; k < 3; k++) { const a = T * 5 + k * 2.09; txt(c, '★', Math.cos(a) * s * 0.9, -s * 1.15 + Math.sin(a) * s * 0.25, s * 0.4, '#ffd400', 'center', INK); }
  if (o.hat) hat(c, s, o.hat);
  if (gold && !o.ghost) txt(c, '✦', s * 0.95, -s * 0.9 + Math.sin(T * 5) * s * 0.1, s * 0.5, '#fff7c2');
  c.restore();
  if (o.team != null) { c.fillStyle = TEAM[o.team].c; c.beginPath(); c.arc(x + s * 0.92, y + s * 0.62 + bob, s * 0.38, 0, 7); c.fill(); c.lineWidth = Math.max(1.5, s * 0.07); c.strokeStyle = '#fff'; c.stroke(); txt(c, TEAM[o.team].s, x + s * 0.92, y + s * 0.64 + bob, s * 0.5, '#fff'); }
  if (o.name) txt(c, o.name, x, y + s * 1.6 + (o.nameSize ? o.nameSize * 0.2 : 0), o.nameSize || Math.max(13, s * 0.62), o.nameCol || '#222', 'center', '#fff');
}

// 많은 캐릭터를 작게 그릴 때(땅따먹기 큰 화면): 걷는 모습 6장면 x 방향 5가지를 그림으로 저장해 두고 붙인다
function drawCharCached(c, x, y, s, seed, o) {
  const m = c.getTransform(), k = Math.hypot(m.a, m.b), es = Math.max(4, Math.round(s * k));
  const T = performance.now() / 1000, wf = (o.walk || 0) > 0.25 ? (((T * 13 + seed * 1.7) / (Math.PI / 3)) | 0) % 6 : -1;
  const fb = o.dir == null ? 0 : Math.round(Math.cos(o.dir) * 2), sb = o.dir == null ? 0 : Math.round(Math.sin(o.dir));
  const key = [seed, es, o.hat || '', o.face || '', o.team != null ? o.team : '', wf, fb, sb, o.cheer ? 1 : 0].join(',');
  let sp = CHAR_CACHE.get(key);
  if (!sp) {
    if (CHAR_CACHE.size > 1500) CHAR_CACHE.delete(CHAR_CACHE.keys().next().value);
    const W = Math.ceil(es * 3.8), H = Math.ceil(es * 4.2);
    sp = document.createElement('canvas'); sp.width = W; sp.height = H;
    drawChar(sp.getContext('2d'), W / 2, H * 0.52, es, seed, Object.assign({}, o, { cache: false, name: null, noblink: true, walk: wf >= 0 ? 1 : 0, ph: wf >= 0 ? wf * Math.PI / 3 + 0.5 : 0, dir: o.dir == null ? null : Math.atan2(sb, fb / 2) }));
    CHAR_CACHE.set(key, sp);
  }
  const X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(sp, Math.round(X - sp.width / 2), Math.round(Y - sp.height * 0.52)); c.restore();
  if (o.name) txt(c, o.name, x, y + s * 1.6 + (o.nameSize ? o.nameSize * 0.2 : 0), o.nameSize || Math.max(13, s * 0.62), o.nameCol || '#222', 'center', '#fff');
}

/* ── 부드러운 위치 보간 + 움직임 세기(걷는 모습용) ── */
/* 움직임 부드럽게: 새 위치가 올 때마다(교실 화면 1초 20번, 폰 1초 8번) 지금 보이는 자리에서 새 자리까지
   "위치가 오는 간격" 동안 일정한 속도로 미끄러지듯 옮긴다. 순간이동(300px 넘게)은 바로 옮긴다. (k는 예전 호환용) */
function lerpTo(disp, id, x, y, k) {
  const now = performance.now();
  let d = disp[id];
  if (!d) d = disp[id] = { x, y, mv: 0, dir: 0, fx: x, fy: y, tx: x, ty: y, tc: now, iv: 90 };
  if (x !== d.tx || y !== d.ty) {
    const gap = now - d.tc;
    if (gap > 15 && gap < d.iv * 2.5 + 60) d.iv = Math.min(260, Math.max(35, d.iv * 0.75 + gap * 0.25));
    d.fx = d.x; d.fy = d.y; d.tx = x; d.ty = y; d.tc = now;
  }
  let nx, ny;
  if (Math.hypot(x - d.x, y - d.y) > 300) { nx = x; ny = y; d.fx = x; d.fy = y; }
  else { const a = Math.min(1, (now - d.tc) / d.iv); nx = d.fx + (d.tx - d.fx) * a; ny = d.fy + (d.ty - d.fy) * a; }
  const dx = nx - d.x, dy = ny - d.y, m = Math.hypot(dx, dy);
  d.mv = d.mv * 0.8 + Math.min(m, 30) * 0.2; if (m > 0.4) d.dir = Math.atan2(dy, dx);
  d.x = nx; d.y = ny;
  return d;
}
const motion = (d, scale) => ({ walk: clamp01(d.mv / (scale || 1.6)), dir: d.mv > 0.3 ? d.dir : null });
function dustFor(c, d, s) { if (FX.on && d.mv > 1.2 && Math.random() < 0.035) { const [X, Y] = FX.at(c, d.x, d.y + s * 0.95); FX.dust(X, Y); } }

function timer(c, x, y, left, max) {
  c.fillStyle = 'rgba(43,33,24,.85)'; c.beginPath(); c.arc(x, y + 7, 84, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 84, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
  if (left == null) { txt(c, '⏱', x, y, 64, '#999'); return; }
  const warn = left <= 3, pulse = warn ? 1 + Math.abs(Math.sin(performance.now() / 160)) * 0.08 : 1;
  c.strokeStyle = '#eee'; c.lineWidth = 16; c.beginPath(); c.arc(x, y, 66, 0, 7); c.stroke();
  c.strokeStyle = warn ? '#e63946' : left / max < 0.4 ? '#f5a301' : '#3d8bff'; c.lineCap = 'round'; c.beginPath(); c.arc(x, y, 66, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, left / max)); c.stroke(); c.lineCap = 'butt';
  txt(c, Math.ceil(left), x, y + 4, 76 * pulse, warn ? '#e63946' : '#222');
}
function cloud(c, x, y, s, col) { c.fillStyle = col || '#fff'; c.beginPath(); c.arc(x, y, s, 0, 7); c.arc(x + s * 0.9, y + s * 0.2, s * 0.75, 0, 7); c.arc(x - s * 0.9, y + s * 0.25, s * 0.7, 0, 7); c.arc(x + s * 0.3, y - s * 0.45, s * 0.7, 0, 7); c.fill(); }

/* ══════════ 09 체육 OX 서바이벌 — 3D 경기장(ox3d.js) 위에 올리는 글자판 ══════════ */
// 문제 칸 내용: 원본 setQBar와 같은 규칙 → [번호 칸, 문제 글, 시간 칸, 빨간색?]
function oxQbar(P, st) {
  const q = P.q; st = st || {};
  if (P.ph === 'reveal' && P.ans) { const n = P.nextAt ? Math.max(0, Math.ceil((P.nextAt - Net.now()) / 1000)) : null; return [`정답 ${P.ans}`, P.ex ? `${P.ans === 'O' ? '⭕' : '❌'} ${P.ex}` : `정답은 ${P.ans}!`, n != null ? String(n) : P.ans, P.ans === 'X']; }
  if (P.ph === 'closed' && q) return [`Q${q.n}`, q.text, '🔒', true];
  if (P.ph === 'play' && q) { const t = Math.max(0, Math.ceil(st.left || 0)); return [`Q${q.n}`, q.text, String(t), t <= 3]; }
  if (P.ph === 'count' && q) return ['대기', '곧 다음 문제가 나와요! 경기장 가운데로 모여요', '–', false];
  return ['대기', '선생님이 문제를 내면 정답 칸으로 달려가세요!', '–', false];
}
function drawOXHud(c, S) {
  const P = S.pub, st = S.st || {}, n = Object.keys(st.p || {}).filter(id => S.players[id]).length;
  if (P.ph === 'intro' || P.ph === 'result') return;
  // 왼쪽 위: 방 인원과 생존자 (원본 #stat 칩)
  c.font = '26px ' + FONT; const chip = `👥 ${n} · 🙋 생존 ${st.alive != null ? st.alive : n}`, cw = c.measureText(chip).width + 40;
  rr(c, 20, 18, cw, 50, 25, 'rgba(20,26,40,.82)'); txt(c, chip, 40, 44, 26, '#fff', 'left');
  // 아래: 문제 칸 (원본 TV 모드의 #qbar)
  const [num, text, tm, warn] = oxQbar(P, st), x0 = 260, w = 1080, y0 = 700, h = 110;
  rr(c, x0, y0 + 7, w, h, 26, '#1d2433'); rr(c, x0, y0, w, h, 26, '#fff', '#1d2433', 5);
  c.font = '30px ' + FONT; const nw = c.measureText(num).width + 26;
  rr(c, x0 + 20, y0 + h / 2 - 24, nw, 48, 12, '#ffd23f', '#1d2433', 4); txt(c, num, x0 + 20 + nw / 2, y0 + h / 2 + 1, 30, '#1d2433');
  c.font = '34px ' + FONT; let t2 = text; const maxW = w - nw - 170; if (c.measureText(t2).width > maxW * 2) { while (c.measureText(t2 + '…').width > maxW * 2 && t2.length) t2 = t2.slice(0, -1); t2 += '…'; }
  wrapText(c, t2, x0 + 40 + nw + (maxW) / 2, y0 + h / 2, maxW, c.measureText(t2).width > maxW ? 30 : 36, '#1d2433');
  rr(c, x0 + w - 104, y0 + h / 2 - 38, 80, 76, 16, warn ? '#ef4b4b' : '#2fbf71', '#1d2433', 4); txt(c, tm, x0 + w - 64, y0 + h / 2 + 2, 44, '#fff');
  if (P.ph === 'reveal' && P.cnt) { const n = P.nextAt ? Math.max(0, Math.ceil((P.nextAt - Net.now()) / 1000)) : 0; pill(c, `생존 ${P.cnt.alive}명 · 이번에 탈락 ${P.cnt.out}명` + (P.paused ? ' · ⏸ 멈춤' : n ? ` · ${n}초 뒤 ${P.last ? '결과 발표' : '다음 문제'}` : ''), 800, 670, 26, '#fff', '#1d2433'); }
}
// 3D를 불러오지 못했을 때(인터넷이 막힌 경우)도 게임은 할 수 있게 위에서 내려다본 간단한 경기장
function drawOX2D(c, S, failed) {
  const st = S.st || {}, k = 36, ox = 800, oz = 330, X = x => ox + x * k, Z = z => oz + z * k;
  c.fillStyle = '#97cf64'; c.fillRect(0, 0, 1600, 900);
  rr(c, X(-19), Z(-15), 38 * k, 30 * k, 40, '#e4c891');
  [['O', '#b6bdca', '#2f6bff'], ['X', '#eda287', '#e04545']].forEach(([key, bg, fg]) => { const Zn = Sim.OX.W.ZONES[key]; rr(c, X(Zn.x - 5.5), Z(Zn.z - 5), 11 * k, 10 * k, 20, bg, '#fff', 5); txt(c, key, X(Zn.x), Z(Zn.z), 200, fg); });
  if (['closed', 'reveal'].includes(S.pub.ph)) [['O', '#2f6bff'], ['X', '#ef4b4b']].forEach(([key, col]) => { const Zn = Sim.OX.W.ZONES[key]; c.strokeStyle = col; c.lineWidth = 8; c.strokeRect(X(Zn.x - 5.8), Z(Zn.z - 5.3), 11.6 * k, 10.6 * k); });
  rr(c, X(-16), Z(9.2), 32 * k, 4.4 * k, 14, '#b7c0cd'); txt(c, '📣 응 원 석', X(0), Z(11.3), 40, '#7f8a9b');
  const ps = st.p || {};
  Object.keys(ps).forEach(id => { const pl = S.players[id]; if (!pl) return; const [x, z, f] = ps[id], d = lerpTo(S.disp, id, X(x / 100), Z(z / 100), 0.35); drawChar(c, d.x, d.y, 18, pl.c, Object.assign(motion(d), { ghost: !(f & 1), cheer: !(f & 1) && !(f & 8), name: nameOf(pl), nameSize: 16 })); });
  pill(c, failed ? '3D 경기장을 불러오지 못해 간단한 화면으로 보여 줘요 (인터넷 연결 확인)' : '3D 경기장 불러오는 중…', 800, 30, 22, '#fff', '#1d2433');
}

/* ══════════ 10 무궁화 꽃 — 체육관 ══════════ */
function drawRed(c, S) {
  const st = S.st || {}, t = S.t, W = 1600, H = 900, fx = W - 190;
  c.fillStyle = '#f0c27b'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(150,90,30,.22)'; c.lineWidth = 3; for (let y = 150; y < H; y += 50) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  for (let x = 0; x < W; x += 260) { c.strokeStyle = 'rgba(150,90,30,.12)'; c.beginPath(); c.moveTo(x, 140); c.lineTo(x, H); c.stroke(); }
  c.fillStyle = '#5b8def'; c.fillRect(0, 0, W, 130); for (let x = 60; x < W; x += 200) { rr(c, x, 26, 120, 70, 10, '#dff1ff', INK, 4); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(x + 14, 34, 18, 54); }
  for (let k = 0; k < 18; k++) { c.fillStyle = TEAM[k % 4].c; c.beginPath(); c.moveTo(k * 92, 120); c.lineTo(k * 92 + 92, 120); c.lineTo(k * 92 + 46, 150 + Math.sin(t * 2 + k) * 4); c.fill(); }
  c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); c.arc(W / 2, 520, 170, 0, 7); c.stroke(); c.beginPath(); c.moveTo(90, 150); c.lineTo(90, H); c.stroke();
  for (let y = 150; y < H; y += 40) for (let k = 0; k < 2; k++) { c.fillStyle = ((y / 40 + k) | 0) % 2 ? '#222' : '#fff'; c.fillRect(fx + k * 20, y, 20, 40); }
  pill(c, '결승선', fx + 20, 178, 22, '#fff', '#e63946');
  // 술래: 물총을 든 감시 로봇 "삐뽀" (이 앱만의 캐릭터). 등을 보이면 노래, 돌아보면 빨간 눈 + 탐지 빛, 움직인 친구에게 물총!
  const look = st.it === 'look', peek = st.it === 'peek', ix = W - 85, iy = 470;
  S.shots = (S.shots || []).filter(o => t - o.t < 0.7);
  const aim = S.shots.length ? S.shots[S.shots.length - 1] : null;
  if (look) {   // 탐지 빛: 눈에서 운동장 쪽으로 훑는 붉은 빛
    const sw = Math.sin(t * 2.2) * 0.45; c.save(); c.translate(ix - 10, iy - 46); c.rotate(Math.PI + sw);
    const gr = c.createLinearGradient(0, 0, 1500, 0); gr.addColorStop(0, 'rgba(255,40,60,.45)'); gr.addColorStop(1, 'rgba(255,40,60,0)');
    c.fillStyle = gr; c.beginPath(); c.moveTo(0, 0); c.lineTo(1500, -260); c.lineTo(1500, 260); c.closePath(); c.fill(); c.restore();
  }
  c.save(); c.translate(ix, iy);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, 205, 84, 18, 0, 0, 7); c.fill();
  // 다리와 바퀴
  rr(c, -46, 150, 30, 50, 10, '#7b8794', INK, 5); rr(c, 16, 150, 30, 50, 10, '#7b8794', INK, 5);
  rr(c, -56, 188, 50, 22, 11, '#3d4652', INK, 4); rr(c, 6, 188, 50, 22, 11, '#3d4652', INK, 4);
  // 몸통
  rr(c, -66, 10, 132, 150, 34, '#5fd0c4', INK, 6);
  if (look || peek) { rr(c, -40, 40, 80, 64, 14, '#e9fbf8', INK, 4); for (let k = 0; k < 3; k++) { c.fillStyle = ['#ff5a5f', '#ffd400', '#27b56a'][k]; c.beginPath(); c.arc(-22 + k * 22, 58, 7, 0, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); } rr(c, -26, 76, 52, 14, 6, look ? '#ff5a5f' : '#9aa3ad', INK, 3); }
  else { c.strokeStyle = 'rgba(43,33,24,.45)'; c.lineWidth = 4; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-34, 40 + k * 18); c.lineTo(34, 40 + k * 18); c.stroke(); } }
  // 머리
  c.save(); if (peek) c.rotate(Math.sin(t * 30) * 0.05);
  c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(0, -112); c.lineTo(0, -140); c.stroke();
  c.fillStyle = look ? '#ff3b4f' : Math.floor(t * 3) % 2 ? '#ffd400' : '#ffef9a'; c.beginPath(); c.arc(0, -146, 12, 0, 7); c.fill(); c.lineWidth = 4; c.stroke();
  rr(c, -78, -114, 156, 118, 38, '#8fe3d8', INK, 6);
  rr(c, -92, -72, 18, 40, 8, '#5fd0c4', INK, 4); rr(c, 74, -72, 18, 40, 8, '#5fd0c4', INK, 4);
  if (look) {
    rr(c, -62, -88, 124, 62, 28, '#1d2433', INK, 5);
    const gl = 0.6 + Math.abs(Math.sin(t * 8)) * 0.4; c.fillStyle = `rgba(255,40,60,${gl})`; c.beginPath(); c.arc(-8, -57, 22, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-14, -63, 6, 0, 7); c.fill();
    c.strokeStyle = '#ff3b4f'; c.lineWidth = 3; c.beginPath(); c.moveTo(-50, -57); c.lineTo(50, -57); c.stroke();
  } else if (peek) {
    rr(c, -62, -88, 70, 62, 26, '#1d2433', INK, 5); c.fillStyle = '#ffd400'; c.beginPath(); c.arc(-30, -57, 14, 0, 7); c.fill();
    txt(c, '?', 60, -128, 56, '#fff', 'center', INK);
  } else {   // 뒤통수: 스피커 구멍 + 노래 음표
    c.fillStyle = 'rgba(43,33,24,.5)'; for (let yy = -88; yy <= -30; yy += 14) for (let xx = -42; xx <= 42; xx += 14) { c.beginPath(); c.arc(xx, yy, 3.5, 0, 7); c.fill(); }
    for (let k = 0; k < 3; k++) { const ph = (t * 1.2 + k / 3) % 1; txt(c, k % 2 ? '♪' : '♫', -40 - ph * 120 + k * 20, -120 - ph * 90, 34, `rgba(255,255,255,${1 - ph})`, 'center', INK); }
  }
  c.restore();
  // 팔과 물총 (돌아보면 운동장 쪽을 겨눈다)
  const ang = look || aim ? (aim ? Math.atan2(aim.y - (iy + 30), aim.x - (ix - 40)) - Math.PI : -0.05) : 0.9;
  c.save(); c.translate(-40, 30); c.rotate(ang);
  rr(c, -70, -10, 70, 20, 10, '#5fd0c4', INK, 4);
  rr(c, -150, -24, 86, 34, 12, '#ff8c1a', INK, 5); rr(c, -176, -14, 30, 14, 6, '#ffd400', INK, 4);
  rr(c, -128, -52, 40, 30, 10, '#7fd3ff', INK, 4); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-122, -46, 8, 16);
  rr(c, -100, 6, 20, 34, 8, '#ff8c1a', INK, 4);
  c.restore();
  c.restore();
  // 물총 줄기: 움직이다 걸린 친구에게
  S.shots.forEach(o => {
    const k = (t - o.t) / 0.7, gx = ix - 40 + Math.cos(Math.atan2(o.y - (iy + 30), o.x - (ix - 40))) * 170, gy = iy + 30 + Math.sin(Math.atan2(o.y - (iy + 30), o.x - (ix - 40))) * 170;
    const reach = Math.min(1, k * 3), ex = gx + (o.x - gx) * reach, ey = gy + (o.y - gy) * reach;
    c.save(); c.globalAlpha = 1 - Math.max(0, k - 0.5) * 2; c.lineCap = 'round';
    c.strokeStyle = '#2f8cff'; c.lineWidth = 16; c.beginPath(); c.moveTo(gx, gy); c.lineTo(ex, ey); c.stroke();
    c.strokeStyle = '#bfe4ff'; c.lineWidth = 6; c.beginPath(); c.moveTo(gx, gy); c.lineTo(ex, ey); c.stroke();
    if (reach >= 1) for (let n = 0; n < 10; n++) { const a = n * 0.63, r = 14 + (k - 0.33) * 90; c.fillStyle = n % 2 ? '#7fd3ff' : '#fff'; c.beginPath(); c.arc(o.x + Math.cos(a) * r, o.y + Math.sin(a) * r * 0.7, 7, 0, 7); c.fill(); }
    c.restore();
  });
  if (look) { c.fillStyle = `rgba(230,57,70,${0.06 + Math.abs(Math.sin(t * 6)) * 0.05})`; c.fillRect(0, 140, W, H); }
  const chant = '무궁화 꽃이 피었습니다';
  card(c, 340, 14, 900, 104, 26, look ? '#e63946' : peek ? '#ffd400' : '#fff');
  if (st.ph === 'play') txt(c, look ? '멈춰!!  움직이면 물총 발사' : peek ? '어? 돌아보나…?' : chant.slice(0, Math.max(1, Math.ceil(chant.length * (st.prog || 0)))), 790, 68, 58, look ? '#fff' : '#222');
  else txt(c, S.pub.ph === 'intro' ? '로봇이 노래할 때만 조이스틱을 밀어요' : S.pub.ph === 'roundend' ? `${S.pub.round}판 끝!` : '준비!', 790, 68, 44, '#222');
  timer(c, 1480, 70, st.ph === 'play' ? st.left : null, S.pub.rdur || 40);
  if (S.pub.round) pill(c, `${S.pub.round} / ${S.pub.rounds}판`, 180, 68, 34, '#fff');
  const ps = st.p || {};
  Object.keys(ps).sort((a, b) => ps[a][1] - ps[b][1]).forEach(id => {
    const [x, y, s, rank] = ps[id], pl = S.players[id]; if (!pl) return;
    const d = lerpTo(S.disp, id, x, y, 0.35);
    if (s === 'out') {
      const k = Math.min(1, ((S.fallT[id] = S.fallT[id] || t), t - S.fallT[id]) / 0.9), hue = (pl.c * 47) % 360;
      if (k < 1) for (let n = 0; n < 24; n++) { const a = n * 2.4, r = 6 + k * (40 + (n % 5) * 14); c.fillStyle = `hsla(${hue},85%,${55 + n % 3 * 10}%,${1 - k * 0.75})`; c.fillRect(d.x + Math.cos(a) * r - 6, d.y + Math.sin(a) * r - 6 + k * k * 30, 12, 12); }
      drawChar(c, d.x, d.y, 20, pl.c, { ghost: true, face: 'dizzy', alpha: 0.55 });
      txt(c, nameOf(pl), d.x, d.y + 40, 18, '#888', 'center', '#fff');
    } else {
      delete S.fallT[id];
      const m = motion(d, 1.2);
      drawChar(c, d.x, d.y, 24, pl.c, Object.assign(m, { hat: 'gym', name: (s === 'fin' ? rank + '등 ' : '') + nameOf(pl), face: s === 'fin' ? 'laugh' : look ? 'shock' : 'smile', cheer: s === 'fin' }));
      dustFor(c, d, 24);
      if (id === S.me) txt(c, '▼', d.x, d.y - 50, 26, '#e63946', 'center', '#fff');
    }
  });
}

/* ══════════ 11 미로 — 보물섬 ══════════ */
const mazeCache = {};
function mazeLayer(seed, size) {
  size = size || [20, 11]; const key = seed + ':' + size;
  if (mazeCache[key]) return mazeCache[key];
  const m = Sim.genMaze(seed, size[0], size[1], size[2] ? 0 : 0.12), T = 1600 / m.tw, cv = document.createElement('canvas'); cv.width = 1600; cv.height = Math.ceil(m.th * T);
  const c = cv.getContext('2d'), r = Sim.rng(seed + 5);
  const sea = c.createLinearGradient(0, 0, 0, cv.height); sea.addColorStop(0, '#2b9be6'); sea.addColorStop(1, '#1667b8'); c.fillStyle = sea; c.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < m.th; y++) for (let x = 0; x < m.tw; x++) {
    if (m.t[y * m.tw + x]) { if (r() < 0.5) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; c.beginPath(); c.arc(x * T + T * 0.3 + r() * T * 0.4, y * T + T * 0.5, T * 0.18, Math.PI, 0); c.stroke(); } }
    else { c.fillStyle = '#e9c97a'; c.fillRect(x * T - 3, y * T - 3, T + 6, T + 6); }
  }
  for (let y = 0; y < m.th; y++) for (let x = 0; x < m.tw; x++) if (!m.t[y * m.tw + x]) {
    c.fillStyle = '#f6e3a1'; c.fillRect(x * T, y * T, T, T);
    c.fillStyle = 'rgba(190,150,70,.5)'; for (let k = 0; k < 3; k++) c.fillRect(x * T + r() * T, y * T + r() * T, 3, 3);
    if (r() < 0.05) txt(c, ['🐚', '⭐', '🐚'][(r() * 3) | 0], x * T + T / 2, y * T + T / 2, T * 0.4);
  }
  c.strokeStyle = '#0d4f8f'; c.lineWidth = 4;
  for (let y = 0; y < m.th; y++) for (let x = 0; x < m.tw; x++) if (!m.t[y * m.tw + x]) {
    const w = (dx, dy) => { const nx = x + dx, ny = y + dy; return nx < 0 || ny < 0 || nx >= m.tw || ny >= m.th ? dx <= 0 : m.t[ny * m.tw + nx]; };
    c.beginPath();
    if (w(0, -1)) { c.moveTo(x * T, y * T); c.lineTo(x * T + T, y * T); } if (w(0, 1)) { c.moveTo(x * T, y * T + T); c.lineTo(x * T + T, y * T + T); }
    if (w(-1, 0)) { c.moveTo(x * T, y * T); c.lineTo(x * T, y * T + T); } if (w(1, 0)) { c.moveTo(x * T + T, y * T); c.lineTo(x * T + T, y * T + T); }
    c.stroke();
  }
  const ex = (m.exit[0] - 0.5) * T, ey = (m.exit[1] + 0.1) * T;
  rr(c, ex, ey, T * 1.3, T * 0.8, 6, '#b5651d', '#3a2a1a', 4); rr(c, ex, ey, T * 1.3, T * 0.3, 6, '#ffd400', '#3a2a1a', 4); txt(c, '✦', ex + T * 0.65, ey - T * 0.15, T * 0.4, '#fff7c2', 'center', '#b5651d');
  txt(c, '출발', (m.start[0] + 0.5) * T, (m.start[1] - 0.45) * T, Math.max(16, T * 0.4), '#e63946', 'center', '#fff');
  return (mazeCache[key] = { cv, m, T });
}
function drawCrab(c, x, y, s, dx, t) {
  c.save(); c.translate(x, y); const w = Math.sin(t * 14) * 0.25;
  c.strokeStyle = INK; c.lineWidth = s * 0.08;
  for (const d of [-1, 1]) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(d * s * 0.4, s * 0.1 + k * s * 0.12); c.lineTo(d * s * 0.8, s * 0.25 + k * s * 0.15 + (k % 2 ? w : -w) * s * 0.3); c.stroke(); }
  c.fillStyle = '#ff4d3d'; for (const d of [-1, 1]) { c.save(); c.translate(d * s * 0.65, -s * 0.35); c.rotate(d * (0.4 + w)); c.beginPath(); c.ellipse(0, 0, s * 0.26, s * 0.2, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.moveTo(d * s * 0.05, 0); c.lineTo(d * s * 0.3, -s * 0.05); c.lineTo(d * s * 0.05, -s * 0.06); c.fill(); c.restore(); c.fillStyle = '#ff4d3d'; }
  c.beginPath(); c.ellipse(0, 0, s * 0.5, s * 0.36, 0, 0, 7); c.fill(); c.stroke();
  for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * s * 0.15, -s * 0.3); c.lineTo(d * s * 0.18, -s * 0.5); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(d * s * 0.18, -s * 0.55, s * 0.1, 0, 7); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(d * s * 0.18 + dx * s * 0.04, -s * 0.55, s * 0.04, 0, 7); c.fill(); }
  c.lineWidth = s * 0.06; c.beginPath(); c.moveTo(-s * 0.15, s * 0.08); c.lineTo(-s * 0.05, s * 0.02); c.lineTo(s * 0.05, s * 0.08); c.lineTo(s * 0.15, s * 0.02); c.stroke();
  c.restore();
}
function drawMaze(c, S) {
  const L = mazeLayer(S.pub.seed, S.pub.mz), st = S.st || {}, t = S.t;
  c.drawImage(L.cv, 0, 0);
  const cr = st.cr || [];
  for (let k = 0; k < cr.length; k += 3) {
    const d = lerpTo(S.disp, 'crab' + k, cr[k], cr[k + 1], 0.4);
    drawCrab(c, d.x, d.y, L.T * 0.6, cr[k + 2] || 0, t);
  }
  const ps = st.p || {};
  Object.keys(ps).forEach(id => {
    const [x, y, s, rank, safe] = ps[id], pl = S.players[id]; if (!pl) return;
    if (s === 'fin') return;
    const d = lerpTo(S.disp, id, x, y, 0.35);
    drawChar(c, d.x, d.y, L.T * 0.3, pl.c, Object.assign(motion(d, 1.0), { hat: 'explorer', alpha: safe && Math.floor(t * 10) % 2 ? 0.4 : 1, name: S.phone ? (id === S.me ? '나' : '') : nameOf(pl), nameSize: S.phone ? 0 : 15 }));
    if (id === S.me) txt(c, '▼', d.x, d.y - L.T * 0.78, 18, '#e63946', 'center', '#fff');
  });
}
function hudMaze(c, S) {
  const st = S.st || {}, ps = st.p || {};
  card(c, 1330, 12, 258, 76, 20, 'rgba(255,255,255,.95)', 4, 5);
  const sl = Math.ceil(st.left || 0); txt(c, st.ph === 'play' ? '남은 시간 ' + (sl >= 60 ? ((sl / 60) | 0) + '분 ' + String(sl % 60).padStart(2, '0') + '초' : sl + '초') : '보물섬 미로', 1459, 50, 30, st.left <= 10 && st.ph === 'play' ? '#e63946' : '#222');
  const fin = Object.keys(ps).filter(id => ps[id][2] === 'fin').sort((a, b) => ps[a][3] - ps[b][3]).slice(0, 5);
  if (fin.length) { card(c, 12, 12, 250, 40 + fin.length * 34, 16, 'rgba(255,255,255,.95)', 4, 5); txt(c, '보물 찾은 순서', 137, 34, 22, '#b5651d'); fin.forEach((id, k) => txt(c, `${ps[id][3]}등 ${nameOf(S.players[id])}`, 30, 68 + k * 34, 24, '#222', 'left')); }
  if (S.pub.lv) lvBadge(c, S.pub.lv, 1588, 112, 22);
}

/* ══════════ 13 땅따먹기 — 4가지 큰 맵 ══════════ */
const TERR_VIEW = { s: 812 / 1350, x: (1600 - 2400 * 812 / 1350) / 2, y: 84 };   // 교실 화면에서 맵을 놓는 자리
const terrToScreen = (x, y) => [TERR_VIEW.x + x * TERR_VIEW.s, TERR_VIEW.y + y * TERR_VIEW.s];
const THEMES = {
  city: { name: '흑백 도시', hat: 'city', ground: '#a3a7ae', grid: 'rgba(0,0,0,.06)', rock: '#5c6272', rockLine: '#363a46', slow: '#8a7562', fast: '#4c505a', haz: '청소 로봇', lm: ['🗼', '🎡', '🏛', '⛲', '🎠'], slowName: '공사장', fastName: '큰길' },
  desert: { name: '사막', hat: 'desert', ground: '#ebd194', grid: 'rgba(150,100,30,.08)', rock: '#c07a44', rockLine: '#7d4620', slow: '#c99a55', fast: '#f3a95f', haz: '모래 회오리', lm: ['🏺', '🐫', '🗿', '🌵', '⛺'], slowName: '모래늪', fastName: '바람길' },
  sea: { name: '바닷속', hat: 'sea', ground: '#1a5d8f', grid: 'rgba(255,255,255,.05)', rock: '#6f8796', rockLine: '#33424d', slow: '#14435f', fast: '#2f86c4', haz: '상어', lm: ['💎', '🐚', '⚓', '🐙', '🐠'], slowName: '미역 숲', fastName: '해류' },
  night: { name: '밤하늘', hat: 'night', ground: '#1d1d4a', grid: 'rgba(255,255,255,.04)', rock: '#6b6a8c', rockLine: '#36354f', slow: '#4b2a72', fast: '#2b3f8f', haz: '혜성', lm: ['🌙', '🪐', '⭐', '☄', '🛸'], slowName: '성운', fastName: '별똥길' }
};
const ITEM_ICON = { bolt: ['⚡', '#ffd400', '번개'], shield: ['🛡', '#7fd3ff', '방패'], snow: ['❄', '#e8f6ff', '눈송이'], portal: ['🏠', '#c59bff', '귀환'], paint: ['🎨', '#ff9ad5', '페인트 폭탄'] };
const terrCache = {};
const spriteCache = {};
function sprite(key, w, h, fn) {   // 자주 그리는 작은 그림(이모지 등)은 한 번 그려 두고 붙여 쓴다
  let cv = spriteCache[key]; if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h); return (spriteCache[key] = cv);
}
function terrPic(theme) {  // 칠하면 드러나는 숨은 큰 그림 (2400 x 1350)
  if (terrCache['pic' + theme]) return terrCache['pic' + theme];
  const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 1350; const c = cv.getContext('2d'), r = Sim.rng(theme.length * 977 + 3);
  c.scale(1.5, 1.5);
  if (theme === 'city') {
    const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#7fd2ff'); g.addColorStop(1, '#ffe3f1'); c.fillStyle = g; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#ffe45c'; c.beginPath(); c.arc(1350, 150, 90, 0, 7); c.fill();
    for (let x = 0; x < 1600; x += 110) { const h = 250 + r() * 420; c.fillStyle = `hsl(${r() * 360} 80% 65%)`; c.fillRect(x + 6, 900 - h, 98, h); c.fillStyle = '#fff8c9'; for (let y = 900 - h + 20; y < 860; y += 46) for (let k = 0; k < 3; k++) c.fillRect(x + 18 + k * 28, y, 16, 24); }
    for (let k = 0; k < 7; k++) cloud(c, 100 + k * 230, 80 + r() * 120, 30);
  } else if (theme === 'desert') {
    c.fillStyle = '#ffb74d'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#ff7043'; c.beginPath(); c.arc(800, 260, 150, 0, 7); c.fill();
    for (const [x, w] of [[300, 520], [800, 700], [1280, 480]]) { c.fillStyle = '#c98a2b'; c.beginPath(); c.moveTo(x - w / 2, 900); c.lineTo(x, 900 - w * 0.75); c.lineTo(x + w / 2, 900); c.fill(); c.fillStyle = '#e0a84a'; c.beginPath(); c.moveTo(x, 900 - w * 0.75); c.lineTo(x + w / 2, 900); c.lineTo(x + w * 0.1, 900); c.fill(); }
    for (let k = 0; k < 14; k++) txt(c, ['🌵', '☀', '🐪', '✺', '🦂'][k % 5], 80 + r() * 1440, 60 + r() * 300, 50, '#6d3b00');
  } else if (theme === 'sea') {
    c.fillStyle = '#19c2d8'; c.fillRect(0, 0, 1600, 900);
    for (let k = 0; k < 40; k++) { const x = r() * 1600, h = 80 + r() * 260; c.fillStyle = `hsl(${[340, 20, 50, 290, 160][k % 5]} 90% 65%)`; c.beginPath(); c.roundRect(x, 900 - h, 26, h, 13); c.fill(); c.beginPath(); c.roundRect(x - 30, 900 - h * 0.6, 26, h * 0.4, 13); c.fill(); }
    for (let k = 0; k < 26; k++) { const x = r() * 1600, y = 60 + r() * 600; c.fillStyle = `hsl(${r() * 360} 95% 60%)`; c.beginPath(); c.ellipse(x, y, 34, 18, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - 30, y); c.lineTo(x - 56, y - 16); c.lineTo(x - 56, y + 16); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 16, y - 4, 5, 0, 7); c.fill(); }
  } else {
    c.fillStyle = '#3b2a8f'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#ff7ac8'; c.globalAlpha = 0.35; for (let k = 0; k < 9; k++) { c.beginPath(); c.ellipse(r() * 1600, r() * 900, 320, 120, r() * 3, 0, 7); c.fill(); } c.globalAlpha = 1;
    const pts = []; for (let k = 0; k < 60; k++) pts.push([r() * 1600, r() * 900]);
    c.strokeStyle = '#fff7c2'; c.lineWidth = 3; c.beginPath(); pts.forEach((p, k) => (k % 6 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
    pts.forEach((p, k) => txt(c, '★', p[0], p[1], 26 + (k % 4) * 10, '#ffe45c'));
    c.fillStyle = '#fff7c2'; c.beginPath(); c.arc(1300, 180, 100, 0, 7); c.fill(); c.fillStyle = '#3b2a8f'; c.beginPath(); c.arc(1340, 150, 90, 0, 7); c.fill();
  }
  return (terrCache['pic' + theme] = cv);
}
function terrMapOf(P) {
  const key = 'map' + [P.seed, P.theme, P.lv, P.nt].join(':');
  return terrCache[key] || (terrCache[key] = Sim.terrMap(P.seed, P.theme, P.lv, P.nt));
}
function terrStatic(P) {   // 바뀌지 않는 바닥: 땅, 바위, 느린 땅, 빠른 길
  const key = 'st' + [P.seed, P.theme, P.lv, P.nt].join(':');
  if (terrCache[key]) return terrCache[key];
  const M = terrMapOf(P), th = THEMES[P.theme] || THEMES.city, GW = Sim.Terr.GW, GH = Sim.Terr.GH, C = Sim.Terr.CELL;
  const cv = document.createElement('canvas'); cv.width = GW * C; cv.height = GH * C; const c = cv.getContext('2d'), r = Sim.rng(P.seed + 17);
  c.fillStyle = th.ground; c.fillRect(0, 0, cv.width, cv.height);
  // 바닥 무늬
  for (let k = 0; k < 900; k++) {
    const x = r() * cv.width, y = r() * cv.height;
    if (P.theme === 'city') { c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x, y, 3, 3); }
    else if (P.theme === 'desert') { c.strokeStyle = 'rgba(160,110,40,.18)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 14, 3.6, 5.8); c.stroke(); }
    else if (P.theme === 'sea') { c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.arc(x, y, 2 + r() * 4, 0, 7); c.fill(); }
    else { c.fillStyle = `rgba(255,255,230,${0.2 + r() * 0.5})`; c.fillRect(x, y, 2, 2); }
  }
  c.strokeStyle = th.grid; c.lineWidth = 1;
  for (let x = 0; x <= GW; x++) { c.beginPath(); c.moveTo(x * C, 0); c.lineTo(x * C, cv.height); c.stroke(); } for (let y = 0; y <= GH; y++) { c.beginPath(); c.moveTo(0, y * C); c.lineTo(cv.width, y * C); c.stroke(); }
  const T = M.tile, at = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH ? 1 : T[y * GW + x]);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const v = at(x, y), X = x * C, Y = y * C;
    if (v === 2) {
      c.fillStyle = th.slow; c.fillRect(X, Y, C, C);
      if (P.theme === 'sea') { if ((x * 3 + y) % 4 === 0) { c.strokeStyle = '#3fbf6a'; c.lineWidth = 4; c.beginPath(); c.moveTo(X + 8, Y + C); c.quadraticCurveTo(X + 18, Y + 12, X + 8, Y - 6); c.stroke(); } }
      else { c.fillStyle = 'rgba(255,255,255,.16)'; if ((x + y) % 2) { c.beginPath(); c.arc(X + C / 2, Y + C / 2, 5, 0, 7); c.fill(); } }
    }
    else if (v === 3) {
      c.fillStyle = th.fast; c.fillRect(X, Y, C, C);
      const horiz = at(x - 1, y) === 3 || at(x + 1, y) === 3;
      c.strokeStyle = P.theme === 'city' || P.theme === 'desert' ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.45)'; c.lineWidth = 3;
      if ((horiz ? x : y) % 3 === 0) { c.beginPath(); if (horiz) { c.moveTo(X + 6, Y + 6); c.lineTo(X + 16, Y + C / 2); c.lineTo(X + 6, Y + C - 6); } else { c.moveTo(X + 6, Y + 6); c.lineTo(X + C / 2, Y + 16); c.lineTo(X + C - 6, Y + 6); } c.stroke(); }
    }
  }
  // 바위: 덩어리 테두리를 굵게, 위쪽에 밝은 면
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (at(x, y) === 1) { c.fillStyle = th.rock; c.fillRect(x * C, y * C, C, C); }
  c.strokeStyle = th.rockLine; c.lineWidth = 4; c.lineCap = 'round';
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (at(x, y) === 1) {
    const X = x * C, Y = y * C; c.beginPath();
    if (at(x, y - 1) !== 1) { c.moveTo(X, Y); c.lineTo(X + C, Y); } if (at(x, y + 1) !== 1) { c.moveTo(X, Y + C); c.lineTo(X + C, Y + C); }
    if (at(x - 1, y) !== 1) { c.moveTo(X, Y); c.lineTo(X, Y + C); } if (at(x + 1, y) !== 1) { c.moveTo(X + C, Y); c.lineTo(X + C, Y + C); }
    c.stroke();
    if (at(x, y + 1) !== 1 && y < GH - 1) { c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(X, Y + C, C, 7); }
    // 테마별 장식
    if (P.theme === 'city') { c.fillStyle = r() < 0.35 ? '#ffe680' : '#3f4452'; c.fillRect(X + 7, Y + 6, 11, 12); }
    else if (P.theme === 'desert') { if (r() < 0.25) { c.strokeStyle = 'rgba(90,40,10,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X + 5, Y + 8); c.lineTo(X + 12, Y + 14); c.lineTo(X + 18, Y + 10); c.stroke(); c.strokeStyle = th.rockLine; c.lineWidth = 4; } }
    else if (P.theme === 'sea') { c.fillStyle = `hsl(${[340, 20, 45, 290][(x * 7 + y) % 4]} 90% 70%)`; c.beginPath(); c.arc(X + C / 2, Y + C / 2, 6 + r() * 3, 0, 7); c.fill(); }
    else { if (r() < 0.4) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(X + 6 + r() * 12, Y + 6 + r() * 12, 3 + r() * 4, 0, 7); c.fill(); } }
  }
  c.lineCap = 'butt';
  return (terrCache[key] = cv);
}
function terrBoard(S) {  // 칸 주인이 바뀔 때만 다시 그리는 판
  const P = S.pub, g = S.grid || {}, key = [P.seed, P.theme, P.lv, P.nt, g.v || 0].join(':');
  if (S.board && S.boardKey === key) return S.board;
  const nowMs = performance.now(), base = key.split(':').slice(0, 4).join(':');   // 땅이 자주 바뀌어도 1초에 5번까지만 다시 그린다
  if (S.board && S.boardBase === base && nowMs - (S.boardT || 0) < 200) return S.board;
  S.boardT = nowMs; S.boardBase = base;
  const GW = Sim.Terr.GW, GH = Sim.Terr.GH, C = Sim.Terr.CELL, M = terrMapOf(P);
  const cv = S.board || document.createElement('canvas'); cv.width = GW * C; cv.height = GH * C; const c = cv.getContext('2d'), pic = terrPic(P.theme);
  c.drawImage(terrStatic(P), 0, 0);
  const own = Sim.gridParse(g.s || '');
  if (!g.s) M.bases.forEach(([bx, by], tm) => { for (let y = by; y < by + Sim.Terr.BASE; y++) for (let x = bx; x < bx + Sim.Terr.BASE; x++) own[y * GW + x] = tm; });
  for (let i = 0; i < own.length; i++) if (own[i] >= 0) { const x = (i % GW) * C, y = ((i / GW) | 0) * C; c.drawImage(pic, x, y, C, C, x, y, C, C); c.fillStyle = TEAM[own[i]].c; c.globalAlpha = 0.42; c.fillRect(x, y, C, C); c.globalAlpha = 1; }
  // 팀 땅 테두리
  c.lineWidth = 4; c.lineCap = 'round';
  for (let i = 0; i < own.length; i++) {
    const o = own[i]; if (o < 0) continue; const gx = i % GW, gy = (i / GW) | 0, X = gx * C, Y = gy * C;
    c.strokeStyle = TEAM[o].d; c.beginPath();
    if (gy === 0 || own[i - GW] !== o) { c.moveTo(X, Y); c.lineTo(X + C, Y); } if (gy === GH - 1 || own[i + GW] !== o) { c.moveTo(X, Y + C); c.lineTo(X + C, Y + C); }
    if (gx === 0 || own[i - 1] !== o) { c.moveTo(X, Y); c.lineTo(X, Y + C); } if (gx === GW - 1 || own[i + 1] !== o) { c.moveTo(X + C, Y); c.lineTo(X + C, Y + C); }
    c.stroke();
  }
  c.lineCap = 'butt';
  M.bases.forEach(([bx, by], tm) => { const B = Sim.Terr.BASE * C; c.lineWidth = 8; c.strokeStyle = '#fff'; c.setLineDash([16, 10]); c.strokeRect(bx * C + 4, by * C + 4, B - 8, B - 8); c.setLineDash([]); txt(c, TEAM[tm].s, bx * C + B / 2, by * C + B / 2, 110, 'rgba(255,255,255,.8)', 'center', TEAM[tm].d); });
  S.board = cv; S.boardKey = key; return cv;
}
function drawHazard(c, theme, x, y, dir, t) {
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(230,57,70,.16)'; c.beginPath(); c.arc(0, 0, 42 + Math.sin(t * 6) * 3, 0, 7); c.fill();
  if (theme === 'sea') {
    c.scale(dir || 1, 1); c.fillStyle = '#8fa3b5'; c.strokeStyle = INK; c.lineWidth = 4;
    c.beginPath(); c.ellipse(0, 0, 34, 18, 0, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-28, 0); c.lineTo(-48, -16 + Math.sin(t * 12) * 4); c.lineTo(-48, 16 + Math.sin(t * 12) * 4); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-4, -16); c.lineTo(6, -34); c.lineTo(14, -16); c.fill(); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(12, 6); for (let k = 0; k < 4; k++) { c.lineTo(16 + k * 4, 12); c.lineTo(18 + k * 4, 6); } c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(20, -5, 3.5, 0, 7); c.fill();
  } else if (theme === 'desert') {
    for (let k = 0; k < 5; k++) { c.strokeStyle = `rgba(150,100,40,${0.9 - k * 0.12})`; c.lineWidth = 6; c.beginPath(); c.ellipse(Math.sin(t * 8 + k) * 6, -24 + k * 12, 30 - k * 5, 7, 0, t * 6 + k, t * 6 + k + 4.5); c.stroke(); }
    c.fillStyle = INK; c.beginPath(); c.arc(-7, -10, 3, 0, 7); c.arc(7, -10, 3, 0, 7); c.fill();
  } else if (theme === 'night') {
    const g = c.createLinearGradient(0, 0, -70 * (dir || 1), 0); g.addColorStop(0, 'rgba(255,230,120,.9)'); g.addColorStop(1, 'rgba(255,120,200,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, -18); c.lineTo(-80 * (dir || 1), 0); c.lineTo(0, 18); c.fill();
    c.fillStyle = '#ffe680'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 20, 0, 7); c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(-6, -3, 3, 0, 7); c.arc(6, -3, 3, 0, 7); c.fill();
  } else {
    c.fillStyle = '#ffd400'; c.strokeStyle = INK; c.lineWidth = 4; rr(c, -30, -20, 60, 36, 10, '#ffd400', INK, 4);
    c.fillStyle = INK; for (let k = -2; k < 3; k++) c.fillRect(k * 12 - 3, -20, 6, 36);
    c.fillStyle = Math.floor(t * 6) % 2 ? '#ff3b3b' : '#ffb0b0'; c.beginPath(); c.arc(0, -26, 8, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#555'; for (const d of [-1, 1]) { c.beginPath(); c.arc(d * 18, 20, 9, 0, 7); c.fill(); c.stroke(); }
    rr(c, -36, 22, 72, 10, 4, '#888', INK, 3);
  }
  c.restore();
}
// 교실 화면용: 큰 판을 화면 크기로 한 번 줄여 두고 그대로 붙인다(매 장면마다 줄이면 느리다)
function terrBoardSmall(S) {
  const big = terrBoard(S), w = Math.round(Sim.Terr.TW * TERR_VIEW.s), h = Math.round(Sim.Terr.TH * TERR_VIEW.s);
  if (S.boardSmall && S.boardSmallKey === S.boardKey + ':' + S.boardT) return S.boardSmall;
  const cv = S.boardSmall || document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(big, 0, 0, w, h);
  S.boardSmall = cv; S.boardSmallKey = S.boardKey + ':' + S.boardT; return cv;
}
function drawTerr(c, S, noBoard) {
  const st = S.st || {}, t = S.t, P = S.pub, th = THEMES[P.theme] || THEMES.city, C = Sim.Terr.CELL, GW = Sim.Terr.GW, M = terrMapOf(P);
  if (!noBoard) c.drawImage(terrBoard(S), 0, 0);
  // 랜드마크
  const lm = st.lm || [];
  M.landmarks.forEach((L, k) => {
    const x = (L.x + L.w / 2) * C, y = (L.y + L.h / 2) * C, o = lm[k] != null ? lm[k] : -1, b = Math.sin(t * 2 + k) * 4;
    const sp = sprite(['lm', P.theme, k, o].join(':'), 140, 140, (g) => {
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(70, 118, 46, 12, 0, 0, 7); g.fill();
      g.fillStyle = o >= 0 ? TEAM[o].c : 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(70, 74, 44, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = o >= 0 ? '#fff' : INK; g.stroke();
      txt(g, th.lm[k % th.lm.length], 70, 76, 50);
      txt(g, '★', 106, 40, 34, o >= 0 ? '#ffd400' : '#fff', 'center', INK);
    });
    c.drawImage(sp, x - 70, y - 74 + b);
  });
  // 포털
  M.portals.forEach(([a, b], k) => [a, b].forEach(cell => {
    const x = (cell % GW + 0.5) * C, y = (((cell / GW) | 0) + 0.5) * C, col = k ? '#ff9f1c' : '#b26bff';
    for (let n = 0; n < 3; n++) { c.strokeStyle = col; c.globalAlpha = 0.9 - n * 0.25; c.lineWidth = 6; c.beginPath(); c.arc(x, y, 14 + n * 9, t * 4 + n, t * 4 + n + 4.2); c.stroke(); }
    c.globalAlpha = 1; c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill();
  }));
  // 그리는 중인 선
  const tr = st.tr || [];
  for (let tm = 0; tm < 4; tm++) for (const [col, R0] of [['d', 12], ['c', 9]]) {   // 팀마다 한 번에 칠한다
    c.beginPath(); let any = false;
    for (let k = 0; k < tr.length; k += 2) { if (tr[k + 1] !== tm) continue; const x = (tr[k] % GW + 0.5) * C, y = (((tr[k] / GW) | 0) + 0.5) * C; c.moveTo(x + R0, y); c.arc(x, y, R0, 0, 6.2832); any = true; }
    if (any) { c.fillStyle = TEAM[tm][col]; c.fill(); }
  }
  // 아이템
  (st.it || []).forEach(([cell, k]) => {
    const x = (cell % GW) * C + 12.5, y = ((cell / GW) | 0) * C + 12.5, ic = ITEM_ICON[k] || ITEM_ICON.bolt, b = Math.sin(t * 4 + cell) * 4;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + 22, 16, 5, 0, 0, 7); c.fill();
    c.drawImage(sprite('it:' + k, 52, 52, g => { g.fillStyle = ic[1]; g.beginPath(); g.arc(26, 26, 21, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); txt(g, ic[0], 26, 27, 24, INK); }), x - 26, y + b - 26);
  });
  // 방해꾼
  const hz = st.hz || [];
  for (let k = 0; k < hz.length; k += 3) { const d = lerpTo(S.disp, 'hz' + k, hz[k], hz[k + 1], 0.4); drawHazard(c, P.theme, d.x, d.y, hz[k + 2], t); }
  const ps = st.p || {};
  Object.keys(ps).sort((a, b) => ps[a][1] - ps[b][1]).forEach(id => {
    const [x, y, tm, bolt, shield, slow] = ps[id], pl = S.players[id]; if (!pl) return;
    const d = lerpTo(S.disp, id, x, y, 0.35);
    if (shield > 0) { c.strokeStyle = '#7fd3ff'; c.lineWidth = 5; c.beginPath(); c.arc(d.x, d.y, 34, 0, 7); c.stroke(); c.fillStyle = 'rgba(127,211,255,.2)'; c.fill(); }
    if (bolt > 0) txt(c, '⚡', d.x - 28, d.y - 26, 24, '#ffd400', 'center', INK);
    if (slow > 0) txt(c, '❄', d.x + 28, d.y - 26, 24, '#e8f6ff', 'center', INK);
    const me = id === S.me;
    drawChar(c, d.x, d.y, me ? 24 : 21, pl.c, Object.assign(motion(d, 1.4), { hat: th.hat, team: tm, face: slow > 0 ? 'shock' : 'smile', name: S.phone ? (me ? '나' : '') : nameOf(pl), nameCol: '#111', nameSize: S.phone ? 0 : 22, cache: !S.phone }));
    dustFor(c, d, 21);
  });
}
function hudTerr(c, S) {
  const st = S.st || {}, P = S.pub, pc = st.pc || [], th = THEMES[P.theme] || THEMES.city, lm = st.lm || [], n = Math.max(2, pc.length || P.nt || 4);
  const w = 170 * n + 220, x0 = 800 - w / 2;
  c.fillStyle = '#2b2118'; c.fillRect(0, 0, 1600, 84); for (let x = 0; x < 1600; x += 40) { c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(x, 0, 20, 84); }
  card(c, x0, 6, w, 70, 22, '#fff', 4, 0);
  for (let tm = 0; tm < n; tm++) {
    const x = x0 + 14 + tm * 170, stars = lm.filter(o => o === tm).length;
    rr(c, x, 14, 160, 54, 14, TEAM[tm].c, TEAM[tm].d, 3);
    txt(c, `${TEAM[tm].s} ${pc[tm] || 0}%`, x + (stars ? 60 : 80), 42, 26, '#fff', 'center', 'rgba(0,0,0,.3)');
    if (stars) txt(c, '★' + stars, x + 128, 42, 24, '#ffd400', 'center', INK);
  }
  txt(c, st.ph === 'play' ? Math.ceil(st.left) + '초' : th.name, x0 + w - 104, 42, 34, st.left <= 10 && st.ph === 'play' ? '#e63946' : '#222');
  txt(c, th.name, 20, 42, 28, '#fff', 'left'); if (P.lv) lvBadge(c, P.lv, 1580, 42, 22);
  if (st.ph === 'play' && st.left <= 10) txt(c, Math.ceil(st.left), 800, 450, 320, 'rgba(230,57,70,.35)');
}

/* ══════════ 14 지렁이 — 사탕 나라 ══════════ */
let wormBg = null;   // 사탕 나라 바닥은 한 번만 그려 두고 매 장면 붙여 쓴다(렉 방지)
function wormBack() {
  if (wormBg) return wormBg;
  const MW = 2400, MH = 1350, cv = document.createElement('canvas'); cv.width = MW; cv.height = MH; const c = cv.getContext('2d');
  c.fillStyle = '#ffe3f1'; c.fillRect(0, 0, MW, MH);
  c.fillStyle = 'rgba(255,255,255,.7)'; for (let y = 0; y < MH; y += 150) for (let x = (y / 150 % 2) * 75; x < MW; x += 150) { c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(255,170,210,.25)'; for (let k = 0; k < 14; k++) { c.beginPath(); c.arc((k * 397) % MW, (k * 241) % MH, 90 + (k % 3) * 40, 0, 7); c.fill(); }
  c.lineWidth = 18; c.strokeStyle = '#ff8fc7'; c.strokeRect(9, 9, MW - 18, MH - 18); c.setLineDash([30, 30]); c.strokeStyle = '#fff'; c.lineWidth = 8; c.strokeRect(9, 9, MW - 18, MH - 18); c.setLineDash([]);
  return (wormBg = cv);
}
function drawWorm(c, S) {
  const st = S.st || {}, t = S.t, MW = 2400, MH = 1350;
  c.drawImage(wormBack(), 0, 0);
  const ob = st.ob || [];
  for (let k = 0; k < ob.length; k += 3) {
    const big = ob[k + 2], R = big ? 20 : 11, b = big ? Math.sin(t * 5 + k) * 3 : 0;
    if (big) { c.fillStyle = '#fff'; c.beginPath(); c.arc(ob[k], ob[k + 1] + b, R + 5, 0, 7); c.fill(); for (let n = 0; n < 6; n++) { c.fillStyle = `hsl(${n * 60} 90% 60%)`; c.beginPath(); c.moveTo(ob[k], ob[k + 1] + b); c.arc(ob[k], ob[k + 1] + b, R, n * 1.047 + t, (n + 1) * 1.047 + t); c.fill(); } c.lineWidth = 3; c.strokeStyle = INK; c.beginPath(); c.arc(ob[k], ob[k + 1] + b, R, 0, 7); c.stroke(); continue; }
    c.fillStyle = `hsl(${(k * 53) % 360} 90% 60%)`; c.beginPath(); c.arc(ob[k], ob[k + 1], R, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(ob[k] - 3, ob[k + 1] - 4, 3.5, 0, 7); c.fill();
  }
  const mn = st.mn || [];
  for (let k = 0; k < mn.length; k += 2) {
    const x = mn[k], y = mn[k + 1]; c.save(); c.translate(x, y); c.rotate(t * 0.8);
    c.fillStyle = '#6b4bd6'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); for (let n = 0; n < 16; n++) { const r = n % 2 ? 18 : 32, a = n * Math.PI / 8; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke();
    c.restore(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 6, y - 3, 5, 0, 7); c.arc(x + 6, y - 3, 5, 0, 7); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(x - 6, y - 2, 2.5, 0, 7); c.arc(x + 6, y - 2, 2.5, 0, 7); c.fill();
  }
  const ws = st.w || {};
  Object.keys(ws).forEach(id => {
    const [len, dead, pts] = ws[id], pl = S.players[id]; if (!pl || dead || pts.length < 2) return;
    const [body, line] = charCol(pl.c);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]);
    c.strokeStyle = line; c.lineWidth = 34; c.stroke(); c.strokeStyle = body; c.lineWidth = 26; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 6; c.setLineDash([10, 30]); c.lineDashOffset = -t * 40; c.stroke(); c.setLineDash([]);
    const dir = pts.length >= 4 ? Math.atan2(pts[1] - pts[3], pts[0] - pts[2]) : 0;
    drawChar(c, pts[0], pts[1], 21, pl.c, { face: 'smile', dir, nofeet: true, name: (id === S.me ? '나 ' : nameOf(pl) + ' ') + len, nameCol: id === S.me ? '#e63946' : '#222', nameSize: S.phone ? 0 : 24 });
  });
}
function hudWorm(c, S) {
  const st = S.st || {}, ws = st.w || {};
  const top = Object.keys(ws).filter(id => S.players[id]).sort((a, b) => ws[b][0] - ws[a][0]).slice(0, 5);
  card(c, 1330, 12, 258, 60 + top.length * 36, 18, 'rgba(255,255,255,.95)', 4, 5); txt(c, '지금 상위 5명', 1459, 38, 24, '#e6398b');
  top.forEach((id, k) => txt(c, `${['👑', '2.', '3.', '4.', '5.'][k]} ${nameOf(S.players[id])}  ${ws[id][0]}`, 1348, 78 + k * 36, 26, '#222', 'left'));
  card(c, 12, 12, 190, 70, 18, 'rgba(255,255,255,.95)', 4, 5); txt(c, st.ph === 'play' ? Math.ceil(st.left) + '초' : '사탕 나라', 107, 48, 36, '#222');
  if (S.pub.lv) lvBadge(c, S.pub.lv, 330, 47, 22);
  if (st.ph === 'play' && st.left <= 10) txt(c, Math.ceil(st.left), 800, 450, 360, 'rgba(230,57,70,.45)');
}

/* ══════════ 세계지도 ══════════ */
const ISLANDS = [[330, 300, 290, 190, '#8fdc6a'], [250, 640, 190, 170, '#f6d37a'], [820, 240, 250, 150, '#ffb7d5'], [800, 560, 180, 130, '#fff3c4'], [1250, 330, 280, 200, '#b9e87a'], [1300, 700, 240, 140, '#cdb7ff'], [640, 780, 190, 90, '#9be3d0']];
function drawWorld(c, S, GAMES, from, to, k) {
  const t = S.t;
  const sea = c.createRadialGradient(800, 450, 100, 800, 450, 950); sea.addColorStop(0, '#7fdcff'); sea.addColorStop(1, '#3ba8e6'); c.fillStyle = sea; c.fillRect(0, 0, 1600, 900);
  c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 4; for (let y = 60; y < 900; y += 90) for (let x = (y % 180) + ((t * 14) % 180) - 180; x < 1600; x += 180) { c.beginPath(); c.arc(x, y, 22, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  ISLANDS.forEach(([x, y, w, h, col], i) => {
    const r = Sim.rng(i * 7 + 1);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); for (let a = 0; a < 6.3; a += 0.3) { const q = 1 + Math.sin(a * 3 + i) * 0.06 + Math.sin(t * 1.5 + a * 2) * 0.012; c.lineTo(x + Math.cos(a) * (w + 18) * q, y + Math.sin(a) * (h + 16) * q); } c.fill();
    c.fillStyle = '#f6e3a1'; c.beginPath(); for (let a = 0; a < 6.3; a += 0.3) { const q = 1 + Math.sin(a * 3 + i) * 0.06; c.lineTo(x + Math.cos(a) * (w + 4) * q, y + Math.sin(a) * (h + 4) * q); } c.fill();
    c.fillStyle = col; c.beginPath(); for (let a = 0; a < 6.3; a += 0.3) { const q = 1 + Math.sin(a * 3 + i) * 0.06; c.lineTo(x + Math.cos(a) * (w - 12) * q, y + Math.sin(a) * (h - 12) * q); } c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; for (let n = 0; n < 6; n++) { c.beginPath(); c.arc(x + (r() - 0.5) * w * 1.3, y + (r() - 0.5) * h * 1.1, 10 + r() * 18, 0, 7); c.fill(); }
  });
  // 배와 구름
  const bx = (t * 30) % 1900 - 150; txt(c, '⛵', bx, 520 + Math.sin(t * 2) * 6, 40);
  c.globalAlpha = 0.85; cloud(c, (t * 18) % 1900 - 150, 130, 30); cloud(c, (t * 12 + 900) % 1900 - 150, 820, 24); c.globalAlpha = 1;
  const vis = S.visited || {};
  Object.keys(GAMES).forEach(id => {
    const g = GAMES[id], [x, y] = g.xy, on = g.ready, sel = id === to;
    c.globalAlpha = on ? 1 : 0.55;
    const R0 = sel ? 46 + Math.sin(t * 6) * 4 : 38;
    c.fillStyle = 'rgba(43,33,24,.75)'; c.beginPath(); c.arc(x, y + 6, R0, 0, 7); c.fill();
    c.fillStyle = sel ? '#ff5a5f' : on ? '#fff' : '#e8e8e8'; c.beginPath(); c.arc(x, y, R0, 0, 7); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    txt(c, g.icon, x, y + 2, sel ? 46 : 38, '#222');
    pill(c, g.place + (on ? '' : ' (준비 중)'), x, y + 62, 20, sel ? '#ff5a5f' : '#fff', sel ? '#fff' : INK);
    if (vis[id]) { c.save(); c.translate(x + 30, y - 30); c.rotate(-0.25); c.fillStyle = '#27b56a'; c.beginPath(); c.arc(0, 0, 17, 0, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke(); txt(c, '✓', 0, 1, 22, '#fff'); c.restore(); }
    c.globalAlpha = 1;
  });
  const a = GAMES[from] ? GAMES[from].xy : [800, 450], b = GAMES[to] ? GAMES[to].xy : [800, 450];
  card(c, 735, 410, 130, 80, 16, '#fff', 5, 6); txt(c, '🏫 교실', 800, 450, 30, '#222');
  if (to != null) {
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e - Math.sin(e * Math.PI) * 120;
    c.setLineDash([14, 14]); c.lineDashOffset = -t * 30; c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 240, b[0], b[1]); c.stroke(); c.setLineDash([]);
    // 반 전체가 탄 열기구
    c.save(); c.translate(x, y); c.rotate(Math.sin(t * 3) * 0.06);
    c.fillStyle = '#ff5a5f'; c.beginPath(); c.arc(0, -70, 62, 0, 7); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#ffd400'; c.beginPath(); c.ellipse(0, -70, 22, 62, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#3d8bff'; c.beginPath(); c.ellipse(-44, -70, 10, 50, 0.2, 0, 7); c.ellipse(44, -70, 10, 50, -0.2, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-40, -24); c.lineTo(-22, 8); c.moveTo(40, -24); c.lineTo(22, 8); c.stroke(); rr(c, -26, 6, 52, 34, 8, '#b5651d', INK, 5);
    const ids = Object.keys(S.players).filter(i => S.players[i].c).slice(0, 3); ids.forEach((i, n) => drawChar(c, -16 + n * 16, 4, 11, S.players[i].c, { face: 'laugh', cheer: true, nofeet: true }));
    c.restore();
    card(c, 400, 20, 800, 90, 26); txt(c, GAMES[to] ? `${GAMES[to].place}(으)로 날아가는 중!` : '', 800, 66, 46, '#222');
  } else { card(c, 350, 20, 900, 90, 26); txt(c, '다음 여행지는 어디일까요?', 800, 66, 46, '#222'); }
}

/* ══════════ 교실(대기실·마지막 장면) ══════════ */
function drawClassroom(c, S, face, cx, span) {
  const t = S.t; cx = cx || 800; span = span || 1400;
  c.fillStyle = '#fff1cf'; c.fillRect(0, 0, 1600, 900);
  c.fillStyle = '#ffe2a8'; for (let x = 0; x < 1600; x += 80) c.fillRect(x, 0, 40, 640);
  c.fillStyle = '#e8b979'; c.fillRect(0, 640, 1600, 260); c.fillStyle = '#d9a566'; for (let x = 0; x < 1600; x += 120) c.fillRect(x, 640, 4, 260); c.fillStyle = '#c98b52'; c.fillRect(0, 632, 1600, 12);
  rr(c, 330, 60, 940, 300, 14, '#2f7d5b', '#8a5a2b', 14);
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(360 + k * 150, 80); c.lineTo(420 + k * 140, 340); c.stroke(); }
  c.fillStyle = '#fff'; c.fillRect(1180, 352, 50, 10); c.fillStyle = '#ffd400'; c.fillRect(1240, 352, 30, 10);
  for (let k = 0; k < 4; k++) { const wx = 60 + (k > 1 ? 1280 : 0) + (k % 2) * 110; rr(c, wx, 90, 90, 150, 8, '#a8e0ff', '#8a5a2b', 8); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(wx + 12, 100, 14, 130); cloud(c, wx + 45 + Math.sin(t * 0.5 + k) * 10, 140, 10); }
  for (let k = 0; k < 16; k++) { c.fillStyle = `hsl(${k * 47} 90% 65%)`; c.beginPath(); c.moveTo(k * 100, 0); c.lineTo(k * 100 + 100, 0); c.lineTo(k * 100 + 50, 60 + Math.sin(t * 2 + k) * 6); c.fill(); }
  const ids = Object.keys(S.players).filter(i => S.players[i].c), n = ids.length, per = Math.max(8, Math.ceil(n / (n > 90 ? 4 : 3)));
  ids.forEach((id, k) => {
    const row = (k / per) | 0, col = k % per, cnt = Math.min(per, n - row * per), s = n > 90 ? 18 : n > 60 ? 22 : n > 36 ? 27 : n > 24 ? 32 : 36;
    const x = cx + (col - (cnt - 1) / 2) * Math.min(150, span / cnt), y = 455 + row * (s * 3.4);
    const born = S.born[id] = S.born[id] || t, pop = Math.min(1, (t - born) / 0.5);
    if (pop < 1 && FX.on && !S.popped) S.popped = {};
    if (pop >= 1 && FX.on && S.popped && !S.popped[id]) { S.popped[id] = 1; FX.burst(x, y, 12); }
    const laugh = face === 'laugh';
    drawChar(c, x, y - (1 - easeOut(pop)) * 200, s * (0.4 + 0.6 * pop), S.players[id].c, { face: face || 'smile', hat: laugh ? 'party' : null, cheer: laugh && k % 2 === 0, name: nameOf(S.players[id]), bob: laugh ? -Math.abs(Math.sin(t * 7 + k)) * 18 : Math.sin(t * 2 + k) * 4, sq: laugh ? Math.sin(t * 14 + k) * 0.05 : 0, walk: laugh ? 0 : 0.0 });
    if (laugh && (k + Math.floor(t * 2)) % 5 === 0) txt(c, ['ㅋㅋㅋ', '하하하', '꺄르르', '푸하하'][k % 4], x + s, y - s * 1.6, 22, '#ff5a5f', 'center', '#fff');
  });
  if (face === 'laugh') for (let k = 0; k < 70; k++) { c.fillStyle = `hsl(${k * 37} 95% 60%)`; c.fillRect((k * 131 + t * 30) % 1600, (k * 67 + t * (90 + k % 7 * 20)) % 900, 12, 18); }
}
