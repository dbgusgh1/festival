/* 그리기 모음: 캐릭터, 여행지 배경, 게임 화면. 교실 화면과 학생 폰이 같은 함수를 쓴다. */
const TEAM = [
  { n: '빨강', c: '#ff5a5f', s: '▲' }, { n: '파랑', c: '#3d8bff', s: '●' },
  { n: '초록', c: '#27b56a', s: '■' }, { n: '노랑', c: '#f5b301', s: '★' }
];
const FONT = 'Jua, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif';
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
function wrapText(c, s, x, y, maxW, sz, col) {
  c.font = sz + 'px ' + FONT; const lines = []; let cur = '';
  for (const ch of String(s)) { if (c.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch; }
  lines.push(cur);
  lines.forEach((l, i) => txt(c, l, x, y + (i - (lines.length - 1) / 2) * sz * 1.25, sz, col));
}
const nameOf = (pl, id) => (pl ? (pl.hide ? '친구' : pl.n) : '?');

/* ── 캐릭터 ── seed 하나로 색·귀 모양이 정해진다. 12번에 한 번은 황금색. */
function hat(c, s, k) {
  c.lineWidth = s * 0.09; c.strokeStyle = '#3a2a1a';
  if (k === 'band') { c.strokeStyle = '#e63946'; c.lineWidth = s * 0.2; c.beginPath(); c.arc(0, 0, s * 0.95, Math.PI * 1.18, Math.PI * 1.82); c.stroke(); }
  else if (k === 'gym') { c.strokeStyle = '#fff'; c.lineWidth = s * 0.22; c.beginPath(); c.arc(0, 0, s * 0.95, Math.PI * 1.18, Math.PI * 1.82); c.stroke(); c.strokeStyle = '#3d8bff'; c.lineWidth = s * 0.07; c.beginPath(); c.arc(0, 0, s * 0.95, Math.PI * 1.18, Math.PI * 1.82); c.stroke(); }
  else if (k === 'explorer' || k === 'desert') { c.fillStyle = k === 'desert' ? '#f1d9a0' : '#b98a4e'; c.beginPath(); c.ellipse(0, -s * 0.72, s * 1.15, s * 0.22, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(0, -s * 0.78, s * 0.6, Math.PI, 0); c.fill(); c.stroke(); }
  else if (k === 'city') { c.fillStyle = '#ffd400'; c.beginPath(); c.arc(0, -s * 0.62, s * 0.72, Math.PI, 0); c.fill(); c.stroke(); c.fillRect(-s * 0.9, -s * 0.66, s * 1.8, s * 0.14); c.strokeRect(-s * 0.9, -s * 0.66, s * 1.8, s * 0.14); }
  else if (k === 'sea') { c.fillStyle = 'rgba(160,230,255,.75)'; c.strokeStyle = '#0b5ea8'; c.beginPath(); c.roundRect(-s * 0.72, -s * 0.4, s * 1.44, s * 0.55, s * 0.2); c.fill(); c.stroke(); }
  else if (k === 'night') { c.strokeStyle = '#7a6cff'; c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(0, -s * 1.35); c.stroke(); txt(c, '★', 0, -s * 1.5, s * 0.6, '#ffe45c'); }
  else if (k === 'party') { c.fillStyle = '#ff6fb5'; c.beginPath(); c.moveTo(-s * 0.4, -s * 0.8); c.lineTo(0, -s * 1.7); c.lineTo(s * 0.4, -s * 0.8); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#ffe45c'; c.beginPath(); c.arc(0, -s * 1.7, s * 0.14, 0, 7); c.fill(); }
}
function drawChar(c, x, y, s, seed, o) {
  o = o || {}; seed = seed || 1;
  const hue = (seed * 47) % 360, ear = seed % 5, gold = seed % 12 === 0;
  const body = o.ghost ? '#cfd3da' : gold ? '#ffd54a' : `hsl(${hue} 85% 68%)`, line = o.ghost ? '#8a8f99' : gold ? '#a8740a' : `hsl(${hue} 55% 32%)`;
  c.save(); c.translate(x, y + (o.bob || 0));
  if (o.alpha != null) c.globalAlpha = o.alpha;
  c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(0, s * 0.95 - (o.bob || 0), s * 0.8, s * 0.2, 0, 0, 7); c.fill();
  if (o.team != null) { c.strokeStyle = TEAM[o.team].c; c.lineWidth = s * 0.22; c.beginPath(); c.ellipse(0, s * 0.95, s * 1.05, s * 0.3, 0, 0, 7); c.stroke(); }
  if (o.sq) c.scale(1 + o.sq, 1 - o.sq);
  c.lineWidth = s * 0.11; c.strokeStyle = line; c.fillStyle = body; c.lineJoin = 'round';
  if (ear === 0) for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * s * 0.85, -s * 0.35); c.lineTo(d * s * 0.75, -s * 1.15); c.lineTo(d * s * 0.25, -s * 0.8); c.closePath(); c.fill(); c.stroke(); }
  if (ear === 1) for (const d of [-1, 1]) { c.beginPath(); c.ellipse(d * s * 0.4, -s * 1.2, s * 0.2, s * 0.55, d * 0.15, 0, 7); c.fill(); c.stroke(); }
  if (ear === 2) for (const d of [-1, 1]) { c.beginPath(); c.arc(d * s * 0.68, -s * 0.72, s * 0.3, 0, 7); c.fill(); c.stroke(); }
  if (ear === 3) { c.beginPath(); c.moveTo(0, -s * 0.9); c.quadraticCurveTo(s * 0.3, -s * 1.4, 0, -s * 1.5); c.stroke(); c.beginPath(); c.arc(0, -s * 1.5, s * 0.14, 0, 7); c.fill(); c.stroke(); }
  if (ear === 4) for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * s * 0.5, -s * 0.75); c.quadraticCurveTo(d * s * 0.9, -s * 1.0, d * s * 0.7, -s * 1.3); c.stroke(); }
  c.beginPath(); c.ellipse(0, 0, s, s * 0.93, 0, 0, 7); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-s * 0.4, -s * 0.5, s * 0.28, s * 0.16, -0.5, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,120,150,.55)'; for (const d of [-1, 1]) { c.beginPath(); c.ellipse(d * s * 0.58, s * 0.18, s * 0.2, s * 0.13, 0, 0, 7); c.fill(); }
  const f = o.face || 'smile'; c.strokeStyle = '#2b2118'; c.fillStyle = '#2b2118'; c.lineWidth = s * 0.1; c.lineCap = 'round';
  for (const d of [-1, 1]) {
    const ex = d * s * 0.34, ey = -s * 0.08;
    if (f === 'laugh') { c.beginPath(); c.moveTo(ex - s * 0.16, ey + s * 0.05); c.lineTo(ex, ey - s * 0.1); c.lineTo(ex + s * 0.16, ey + s * 0.05); c.stroke(); }
    else if (f === 'shock') { c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, s * 0.2, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#2b2118'; c.beginPath(); c.arc(ex, ey, s * 0.06, 0, 7); c.fill(); }
    else { c.beginPath(); c.arc(ex, ey, s * 0.12, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex - s * 0.04, ey - s * 0.05, s * 0.045, 0, 7); c.fill(); c.fillStyle = '#2b2118'; }
  }
  if (f === 'laugh') { c.fillStyle = '#c2313e'; c.beginPath(); c.arc(0, s * 0.22, s * 0.3, 0, Math.PI); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#ff8fa3'; c.beginPath(); c.arc(0, s * 0.42, s * 0.14, Math.PI, 0); c.fill(); }
  else if (f === 'shock') { c.beginPath(); c.ellipse(0, s * 0.36, s * 0.1, s * 0.14, 0, 0, 7); c.fill(); }
  else { c.beginPath(); c.arc(0, s * 0.22, s * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); }
  if (o.hat) hat(c, s, o.hat);
  if (gold && !o.ghost) txt(c, '✦', s * 0.95, -s * 0.9, s * 0.5, '#fff7c2');
  c.restore();
  if (o.team != null) { c.fillStyle = TEAM[o.team].c; c.beginPath(); c.arc(x + s * 0.9, y + s * 0.6, s * 0.38, 0, 7); c.fill(); txt(c, TEAM[o.team].s, x + s * 0.9, y + s * 0.62, s * 0.5, '#fff'); }
  if (o.name) txt(c, o.name, x, y + s * 1.55, Math.max(13, s * 0.62), o.nameCol || '#222', 'center', '#fff');
}

/* ── 부드러운 위치 보간 ── */
function lerpTo(disp, id, x, y, k) {
  const d = disp[id] || (disp[id] = { x, y });
  if (Math.hypot(x - d.x, y - d.y) > 300) { d.x = x; d.y = y; } else { d.x += (x - d.x) * k; d.y += (y - d.y) * k; }
  return d;
}

/* ══════════ 09 OX — 운동장 ══════════ */
function drawOX(c, S) {
  const st = S.st || {}, pub = S.pub, t = S.t, W = 1600, H = 900, top = 250;
  c.fillStyle = '#e9c98b'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#7ec4ff'; c.fillRect(0, 0, W, 210); c.fillStyle = '#9bd66b'; c.fillRect(0, 190, W, 40);
  c.fillStyle = '#8ec5ff'; c.fillRect(0, top - 20, W * 0.40, H); c.fillStyle = '#ffa3a3'; c.fillRect(W * 0.60, top - 20, W * 0.40, H);
  const danger = st.ph === 'q' && st.left <= 3, flash = danger && Math.floor(t * 4) % 2;
  c.fillStyle = flash ? '#2b2118' : danger ? '#ffcf33' : '#d9b56e'; c.fillRect(W * 0.40, top - 20, W * 0.20, H);
  c.save(); c.beginPath(); c.rect(W * 0.40, top - 20, W * 0.20, H); c.clip(); c.strokeStyle = danger ? (flash ? '#ffcf33' : '#2b2118') : 'rgba(120,80,20,.35)'; c.lineWidth = 26;
  for (let k = -20; k < 30; k++) { c.beginPath(); c.moveTo(W * 0.40 + k * 60, top - 20); c.lineTo(W * 0.40 + k * 60 - 500, H); c.stroke(); } c.restore();
  txt(c, 'O', W * 0.2, 600, 420, 'rgba(255,255,255,.6)'); txt(c, 'X', W * 0.8, 600, 420, 'rgba(255,255,255,.6)'); txt(c, '파란 O 구역', W * 0.2, top + 20, 30, '#1d4fa8', 'center', '#fff'); txt(c, '빨간 X 구역', W * 0.8, top + 20, 30, '#b3202c', 'center', '#fff');
  txt(c, danger ? '위험! 여기 있으면 떨어져요' : '위험 구역', W / 2, top + 20, 30, danger ? '#e63946' : '#7a5a1e', 'center', '#fff');
  if (pub.ph === 'reveal' && pub.ans) { c.lineWidth = 16; c.strokeStyle = '#27b56a'; c.strokeRect(pub.ans === 'O' ? 8 : W * 0.60 + 8, top - 12, W * 0.40 - 16, H - top + 4); }
  // 캐릭터
  const ps = st.p || {};
  Object.keys(ps).sort((a, b) => ps[a][1] - ps[b][1]).forEach(id => {
    const [x, y, s] = ps[id], pl = S.players[id]; if (!pl) return;
    const d = lerpTo(S.disp, id, x, y, 0.35);
    if (s === 'fall') {
      const k = Math.min(1, ((S.fallT[id] = S.fallT[id] || t), t - S.fallT[id]) / 1.2);
      c.fillStyle = '#1a0f0a'; c.beginPath(); c.ellipse(d.x, d.y + 20, 46, 18, 0, 0, 7); c.fill();
      c.fillStyle = '#ff5a1f'; for (let n = 0; n < 5; n++) { c.beginPath(); c.arc(d.x - 30 + n * 15, d.y + 18 - Math.abs(Math.sin(t * 6 + n)) * 14 * k, 6, 0, 7); c.fill(); }
      if (k < 1) drawChar(c, d.x, d.y + k * 40, 26 * (1 - k * 0.8), pl.c, { face: 'shock', name: nameOf(pl) });
      else txt(c, nameOf(pl), d.x, d.y - 8, 18, '#fff', 'center', '#1a0f0a');
    } else {
      delete S.fallT[id];
      drawChar(c, d.x, d.y, 26, pl.c, { hat: 'band', name: nameOf(pl), face: s === 'right' ? 'laugh' : s === 'wrong' ? 'shock' : 'smile', bob: s === 'right' ? -Math.abs(Math.sin(t * 8)) * 14 : 0, hl: id === S.me });
      if (id === S.me) txt(c, '▼', d.x, d.y - 48, 26, '#e63946', 'center', '#fff');
    }
  });
  // 문제 칸
  rr(c, 60, 24, W - 340, 170, 28, '#fff', '#2b2118', 6);
  if (pub.q) {
    txt(c, `문제 ${pub.q.n} / ${pub.q.total}`, 100, 54, 28, '#e63946', 'left');
    if (pub.ph === 'reveal') { wrapText(c, pub.q.text, 60 + (W - 340) / 2, 96, W - 420, 38, '#555'); txt(c, `정답은 ${pub.ans}!  ${pub.ex || ''}`, 60 + (W - 340) / 2, 160, 34, '#27b56a'); }
    else wrapText(c, pub.q.text, 60 + (W - 340) / 2, 122, W - 420, 52, '#222');
  } else txt(c, pub.ph === 'intro' ? '조이스틱으로 직접 걸어가서 O 또는 X 구역에 서세요' : '준비!', 60 + (W - 340) / 2, 110, 44, '#222');
  timer(c, 1440, 110, st.ph === 'q' ? st.left : null, 15);
  if (pub.ph === 'reveal' && pub.cnt) txt(c, `O ${pub.cnt.o}명 · X ${pub.cnt.x}명 · 떨어짐 ${pub.cnt.f}명`, W / 2, 232, 34, '#2b2118', 'center', '#fff');
}
function timer(c, x, y, left, max) {
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 84, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = '#2b2118'; c.stroke();
  if (left == null) { txt(c, '⏱', x, y, 64, '#999'); return; }
  c.strokeStyle = left <= 3 ? '#e63946' : '#3d8bff'; c.lineWidth = 16; c.beginPath(); c.arc(x, y, 66, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, left / max)); c.stroke();
  txt(c, Math.ceil(left), x, y + 4, 76, left <= 3 ? '#e63946' : '#222');
}

/* ══════════ 10 무궁화 꽃 — 체육관 ══════════ */
function drawRed(c, S) {
  const st = S.st || {}, t = S.t, W = 1600, H = 900, fx = W - 190;
  c.fillStyle = '#f0c27b'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(150,90,30,.25)'; c.lineWidth = 3; for (let y = 150; y < H; y += 50) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.fillStyle = '#5b8def'; c.fillRect(0, 0, W, 130); c.fillStyle = '#fff'; for (let x = 60; x < W; x += 200) rr(c, x, 26, 120, 70, 10, '#dff1ff', '#2b2118', 4);
  c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); c.arc(W / 2, 520, 170, 0, 7); c.stroke(); c.beginPath(); c.moveTo(90, 140); c.lineTo(90, H); c.stroke();
  for (let y = 140; y < H; y += 40) for (let k = 0; k < 2; k++) { c.fillStyle = ((y / 40 + k) | 0) % 2 ? '#222' : '#fff'; c.fillRect(fx + k * 20, y, 20, 40); }
  txt(c, '결승선', fx + 20, 160, 26, '#e63946', 'center', '#fff');
  // 술래: 호루라기 문 커다란 체육 선생님 인형, 손에는 뿅망치
  const look = st.it === 'look', ix = W - 85, iy = 470;
  c.save(); c.translate(ix, iy);
  rr(c, -60, 10, 120, 190, 40, '#2f6fde', '#2b2118', 6); c.fillStyle = '#fff'; c.fillRect(-60, 80, 120, 16);
  c.fillStyle = '#ffd9b3'; c.beginPath(); c.arc(0, -40, 66, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = '#2b2118'; c.stroke();
  c.fillStyle = '#e63946'; c.beginPath(); c.arc(0, -62, 68, Math.PI, 0); c.fill(); c.stroke();
  if (look) { c.fillStyle = '#fff'; for (const d of [-1, 1]) { c.beginPath(); c.arc(d * 24, -34, 17, 0, 7); c.fill(); c.stroke(); } c.fillStyle = '#e63946'; for (const d of [-1, 1]) { c.beginPath(); c.arc(d * 24 - 5, -34, 8, 0, 7); c.fill(); } rr(c, -40, -8, 46, 18, 6, '#ffd400', '#2b2118', 4); }
  else txt(c, '등', 0, 100, 60, 'rgba(255,255,255,.7)');
  c.rotate(look ? -0.9 : 0.3); rr(c, -100, -6, 70, 12, 4, '#a36a2b', '#2b2118', 4); rr(c, -140, -28, 46, 56, 12, '#ff5a5f', '#2b2118', 5); rr(c, -146, -28, 12, 56, 4, '#ffd400', '#2b2118', 4);
  c.restore();
  const chant = '무궁화 꽃이 피었습니다';
  rr(c, 340, 14, 900, 104, 26, look ? '#e63946' : '#fff', '#2b2118', 6);
  if (st.ph === 'play') txt(c, look ? '멈춰!!  움직이면 탈락' : chant.slice(0, Math.max(1, Math.ceil(chant.length * (st.prog || 0)))), 790, 68, 58, look ? '#fff' : '#222');
  else txt(c, S.pub.ph === 'intro' ? '술래가 등을 보일 때만 조이스틱을 밀어요' : S.pub.ph === 'roundend' ? `${S.pub.round}판 끝!` : '준비!', 790, 68, 44, '#222');
  timer(c, 1480, 70, st.ph === 'play' ? st.left : null, 40);
  if (S.pub.round) txt(c, `${S.pub.round} / ${S.pub.rounds}판`, 180, 68, 44, '#fff', 'center', '#2b2118');
  const ps = st.p || {};
  Object.keys(ps).forEach(id => {
    const [x, y, s, rank] = ps[id], pl = S.players[id]; if (!pl) return;
    const d = lerpTo(S.disp, id, x, y, 0.35);
    if (s === 'out') {
      const k = Math.min(1, ((S.fallT[id] = S.fallT[id] || t), t - S.fallT[id]) / 0.9), hue = (pl.c * 47) % 360;
      for (let n = 0; n < 24; n++) { const a = n * 2.4, r = 6 + k * (40 + (n % 5) * 14); c.fillStyle = `hsla(${hue},85%,${55 + n % 3 * 10}%,${1 - k * 0.75})`; c.fillRect(d.x + Math.cos(a) * r - 6, d.y + Math.sin(a) * r - 6 + k * k * 30, 12, 12); }
      txt(c, nameOf(pl), d.x, d.y + 44, 18, '#888', 'center', '#fff');
    } else {
      delete S.fallT[id];
      const moving = st.it === 'back' && s === 'run';
      drawChar(c, d.x, d.y, 24, pl.c, { hat: 'gym', name: (s === 'fin' ? rank + '등 ' : '') + nameOf(pl), face: s === 'fin' ? 'laugh' : look ? 'shock' : 'smile', bob: moving ? -Math.abs(Math.sin(t * 9 + x * 0.05)) * 6 : 0 });
      if (id === S.me) txt(c, '▼', d.x, d.y - 46, 26, '#e63946', 'center', '#fff');
    }
  });
}

/* ══════════ 11 미로 — 보물섬 ══════════ */
const mazeCache = {};
function mazeLayer(seed) {
  if (mazeCache[seed]) return mazeCache[seed];
  const m = Sim.genMaze(seed, 20, 11), T = 1600 / m.tw, cv = document.createElement('canvas'); cv.width = 1600; cv.height = Math.ceil(m.th * T);
  const c = cv.getContext('2d'), r = Sim.rng(seed + 5);
  c.fillStyle = '#1e7fd6'; c.fillRect(0, 0, cv.width, cv.height);
  for (let y = 0; y < m.th; y++) for (let x = 0; x < m.tw; x++) {
    if (m.t[y * m.tw + x]) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; c.beginPath(); c.arc(x * T + T * 0.3 + r() * T * 0.4, y * T + T * 0.5, T * 0.18, Math.PI, 0); c.stroke(); }
    else { c.fillStyle = '#f6e3a1'; c.fillRect(x * T - 1, y * T - 1, T + 2, T + 2); }
  }
  for (let y = 0; y < m.th; y++) for (let x = 0; x < m.tw; x++) if (!m.t[y * m.tw + x]) {
    c.fillStyle = 'rgba(190,150,70,.5)'; for (let k = 0; k < 3; k++) c.fillRect(x * T + r() * T, y * T + r() * T, 3, 3);
    if (r() < 0.08) { c.fillStyle = '#3aa655'; c.beginPath(); c.arc(x * T + T / 2, y * T + T / 2, T * 0.16, 0, 7); c.fill(); }
  }
  c.strokeStyle = '#0d4f8f'; c.lineWidth = 4;
  for (let y = 0; y < m.th; y++) for (let x = 0; x < m.tw; x++) if (!m.t[y * m.tw + x]) {
    const w = (dx, dy) => { const nx = x + dx, ny = y + dy; return nx < 0 || ny < 0 || nx >= m.tw || ny >= m.th ? dx <= 0 : m.t[ny * m.tw + nx]; };
    c.beginPath();
    if (w(0, -1)) { c.moveTo(x * T, y * T); c.lineTo(x * T + T, y * T); } if (w(0, 1)) { c.moveTo(x * T, y * T + T); c.lineTo(x * T + T, y * T + T); }
    if (w(-1, 0)) { c.moveTo(x * T, y * T); c.lineTo(x * T, y * T + T); } if (w(1, 0)) { c.moveTo(x * T + T, y * T); c.lineTo(x * T + T, y * T + T); }
    c.stroke();
  }
  rr(c, (m.exit[0] - 0.5) * T, (m.exit[1] + 0.1) * T, T * 1.3, T * 0.8, 6, '#b5651d', '#3a2a1a', 4); rr(c, (m.exit[0] - 0.5) * T, (m.exit[1] + 0.1) * T, T * 1.3, T * 0.3, 6, '#ffd400', '#3a2a1a', 4);
  txt(c, '출발', (m.start[0] + 0.5) * T, (m.start[1] - 0.45) * T, 20, '#e63946', 'center', '#fff');
  return (mazeCache[seed] = { cv, m, T });
}
function drawMaze(c, S) {
  const L = mazeLayer(S.pub.seed), st = S.st || {}, t = S.t;
  c.drawImage(L.cv, 0, 0);
  const ps = st.p || {};
  Object.keys(ps).forEach(id => {
    const [x, y, s, rank] = ps[id], pl = S.players[id]; if (!pl) return;
    if (s === 'fin') return;
    const d = lerpTo(S.disp, id, x, y, 0.35);
    drawChar(c, d.x, d.y, L.T * 0.3, pl.c, { hat: 'explorer', name: S.phone ? (id === S.me ? '나' : '') : nameOf(pl) });
    if (id === S.me) txt(c, '▼', d.x, d.y - L.T * 0.75, 18, '#e63946', 'center', '#fff');
  });
}
function hudMaze(c, S) {
  const st = S.st || {}, ps = st.p || {};
  rr(c, 1330, 12, 258, 76, 20, 'rgba(255,255,255,.92)', '#2b2118', 4);
  txt(c, st.ph === 'play' ? '남은 시간 ' + Math.ceil(st.left) + '초' : '보물섬 미로', 1459, 50, 30, st.left <= 10 && st.ph === 'play' ? '#e63946' : '#222');
  const fin = Object.keys(ps).filter(id => ps[id][2] === 'fin').sort((a, b) => ps[a][3] - ps[b][3]).slice(0, 5);
  if (fin.length) { rr(c, 12, 12, 250, 40 + fin.length * 34, 16, 'rgba(255,255,255,.92)', '#2b2118', 4); txt(c, '보물 찾은 순서', 137, 34, 22, '#b5651d'); fin.forEach((id, k) => txt(c, `${ps[id][3]}등 ${nameOf(S.players[id])}`, 30, 68 + k * 34, 24, '#222', 'left')); }
}

/* ══════════ 13 땅따먹기 — 4가지 맵 ══════════ */
const THEMES = {
  city: { name: '흑백 도시', hat: 'city', cover: '#8d9199', coverLine: '#6d7179', tool: '페인트 롤러' },
  desert: { name: '사막', hat: 'desert', cover: '#e6c98a', coverLine: '#cfae69', tool: '빗자루' },
  sea: { name: '바닷속', hat: 'sea', cover: '#0f3d66', coverLine: '#0a2c4a', tool: '산호 심기' },
  night: { name: '밤하늘', hat: 'night', cover: '#161638', coverLine: '#23235a', tool: '별 잇기' }
};
const ITEM_ICON = { bolt: ['⚡', '#ffd400', '번개'], shield: ['🛡', '#7fd3ff', '방패'], snow: ['❄', '#e8f6ff', '눈송이'], portal: ['🌀', '#c59bff', '귀환 포털'] };
const terrCache = {};
function terrPic(theme) {  // 점령하면 드러나는 숨은 큰 그림
  if (terrCache[theme]) return terrCache[theme];
  const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 900; const c = cv.getContext('2d'), r = Sim.rng(theme.length * 977 + 3);
  if (theme === 'city') {
    c.fillStyle = '#8fd8ff'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#ffe45c'; c.beginPath(); c.arc(1350, 150, 90, 0, 7); c.fill();
    for (let x = 0; x < 1600; x += 110) { const h = 250 + r() * 420; c.fillStyle = `hsl(${r() * 360} 80% 65%)`; c.fillRect(x + 6, 900 - h, 98, h); c.fillStyle = '#fff8c9'; for (let y = 900 - h + 20; y < 860; y += 46) for (let k = 0; k < 3; k++) c.fillRect(x + 18 + k * 28, y, 16, 24); }
    for (let k = 0; k < 7; k++) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(100 + k * 230, 80 + r() * 120, 70, 26, 0, 0, 7); c.fill(); }
  } else if (theme === 'desert') {
    c.fillStyle = '#ffb74d'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#ff7043'; c.beginPath(); c.arc(800, 260, 150, 0, 7); c.fill();
    for (const [x, w] of [[300, 520], [800, 700], [1280, 480]]) { c.fillStyle = '#c98a2b'; c.beginPath(); c.moveTo(x - w / 2, 900); c.lineTo(x, 900 - w * 0.75); c.lineTo(x + w / 2, 900); c.fill(); c.fillStyle = '#e0a84a'; c.beginPath(); c.moveTo(x, 900 - w * 0.75); c.lineTo(x + w / 2, 900); c.lineTo(x + w * 0.1, 900); c.fill(); }
    for (let k = 0; k < 14; k++) txt(c, ['𓂀', '☥', '𓃭', '✺', '𓆣'][k % 5], 80 + r() * 1440, 60 + r() * 300, 60, '#6d3b00');
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
  return (terrCache[theme] = cv);
}
function terrBoard(S) {  // 땅 상태가 바뀔 때만 다시 그리는 판
  const g = S.grid || {}, key = S.pub.theme + ':' + (g.v || 0);
  if (S.board && S.boardKey === key) return S.board;
  const cv = S.board || document.createElement('canvas'); cv.width = 1600; cv.height = 900; const c = cv.getContext('2d'), th = THEMES[S.pub.theme] || THEMES.city, pic = terrPic(S.pub.theme);
  c.fillStyle = th.cover; c.fillRect(0, 0, 1600, 900); c.strokeStyle = th.coverLine; c.lineWidth = 1;
  for (let x = 0; x <= 64; x++) { c.beginPath(); c.moveTo(x * 25, 0); c.lineTo(x * 25, 900); c.stroke(); } for (let y = 0; y <= 36; y++) { c.beginPath(); c.moveTo(0, y * 25); c.lineTo(1600, y * 25); c.stroke(); }
  const s = g.s || '';
  for (let i = 0; i < s.length; i++) if (s[i] !== '.') { const x = (i % 64) * 25, y = ((i / 64) | 0) * 25; c.drawImage(pic, x, y, 25, 25, x, y, 25, 25); c.fillStyle = TEAM[+s[i]].c; c.globalAlpha = 0.38; c.fillRect(x, y, 25, 25); c.globalAlpha = 1; }
  [[0, 0], [58, 0], [0, 30], [58, 30]].forEach(([bx, by], tm) => { c.lineWidth = 6; c.strokeStyle = TEAM[tm].c; c.strokeRect(bx * 25 + 3, by * 25 + 3, 144, 144); txt(c, TEAM[tm].s, bx * 25 + 75, by * 25 + 75, 90, 'rgba(255,255,255,.75)'); });
  S.board = cv; S.boardKey = key; return cv;
}
function drawTerr(c, S) {
  const st = S.st || {}, t = S.t, th = THEMES[S.pub.theme] || THEMES.city;
  c.drawImage(terrBoard(S), 0, 0);
  const tr = st.tr || [];
  for (let k = 0; k < tr.length; k += 2) { const x = (tr[k] % 64) * 25, y = ((tr[k] / 64) | 0) * 25; c.fillStyle = TEAM[tr[k + 1]].c; c.globalAlpha = 0.85; c.fillRect(x + 3, y + 3, 19, 19); c.globalAlpha = 1; c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x + 3, y + 3, 19, 19); }
  (st.it || []).forEach(([cell, k]) => { const x = (cell % 64) * 25 + 12.5, y = ((cell / 64) | 0) * 25 + 12.5, ic = ITEM_ICON[k], b = Math.sin(t * 4 + cell) * 3; c.fillStyle = ic[1]; c.beginPath(); c.arc(x, y + b, 20, 0, 7); c.fill(); c.lineWidth = 4; c.strokeStyle = '#2b2118'; c.stroke(); txt(c, ic[0], x, y + b + 1, 24, '#2b2118'); });
  const ps = st.p || {};
  Object.keys(ps).forEach(id => {
    const [x, y, tm, bolt, shield, slow] = ps[id], pl = S.players[id]; if (!pl) return;
    const d = lerpTo(S.disp, id, x, y, 0.35);
    if (shield > 0) { c.strokeStyle = '#7fd3ff'; c.lineWidth = 5; c.beginPath(); c.arc(d.x, d.y, 30, 0, 7); c.stroke(); }
    if (bolt > 0) txt(c, '⚡', d.x - 26, d.y - 22, 22, '#ffd400', 'center', '#2b2118');
    if (slow > 0) txt(c, '❄', d.x + 26, d.y - 22, 22, '#e8f6ff', 'center', '#2b2118');
    drawChar(c, d.x, d.y, 19, pl.c, { hat: th.hat, team: tm, name: S.phone ? (id === S.me ? '나' : '') : nameOf(pl), nameCol: '#111' });
  });
}
function hudTerr(c, S) {
  const st = S.st || {}, pc = st.pc || [0, 0, 0, 0], th = THEMES[S.pub.theme] || THEMES.city;
  rr(c, 400, 8, 800, 74, 20, 'rgba(255,255,255,.93)', '#2b2118', 4);
  pc.forEach((p, tm) => { const x = 420 + tm * 150; rr(c, x, 18, 140, 54, 12, TEAM[tm].c); txt(c, `${TEAM[tm].s} ${TEAM[tm].n} ${p}%`, x + 70, 46, 24, '#fff', 'center', 'rgba(0,0,0,.35)'); });
  txt(c, st.ph === 'play' ? Math.ceil(st.left) + '초' : th.name, 1110, 46, 34, st.left <= 10 && st.ph === 'play' ? '#e63946' : '#222');
}

/* ══════════ 14 지렁이 — 사탕 나라 ══════════ */
function drawWorm(c, S) {
  const st = S.st || {}, t = S.t, MW = 2400, MH = 1350;
  c.fillStyle = '#ffe3f1'; c.fillRect(0, 0, MW, MH);
  c.fillStyle = 'rgba(255,255,255,.7)'; for (let y = 0; y < MH; y += 150) for (let x = (y / 150 % 2) * 75; x < MW; x += 150) { c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); }
  c.lineWidth = 14; c.strokeStyle = '#ff8fc7'; c.strokeRect(7, 7, MW - 14, MH - 14);
  const ob = st.ob || [];
  for (let k = 0; k < ob.length; k += 2) { c.fillStyle = `hsl(${(k * 53) % 360} 90% 60%)`; c.beginPath(); c.arc(ob[k], ob[k + 1], 11, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(ob[k] - 3, ob[k + 1] - 4, 3.5, 0, 7); c.fill(); }
  const ws = st.w || {};
  Object.keys(ws).forEach(id => {
    const [len, dead, pts] = ws[id], pl = S.players[id]; if (!pl || dead || pts.length < 2) return;
    const hue = (pl.c * 47) % 360, gold = pl.c % 12 === 0;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = gold ? '#a8740a' : `hsl(${hue} 55% 32%)`; c.lineWidth = 34; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]); c.stroke();
    c.strokeStyle = gold ? '#ffd54a' : `hsl(${hue} 85% 68%)`; c.lineWidth = 26; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 6; c.setLineDash([10, 30]); c.stroke(); c.setLineDash([]);
    drawChar(c, pts[0], pts[1], 21, pl.c, { face: 'smile', name: (id === S.me ? '나 ' : nameOf(pl) + ' ') + len, nameCol: id === S.me ? '#e63946' : '#222' });
  });
}
function hudWorm(c, S) {
  const st = S.st || {}, ws = st.w || {};
  const top = Object.keys(ws).filter(id => S.players[id]).sort((a, b) => ws[b][0] - ws[a][0]).slice(0, 5);
  rr(c, 1330, 12, 258, 60 + top.length * 36, 18, 'rgba(255,255,255,.93)', '#2b2118', 4); txt(c, '지금 상위 5명', 1459, 38, 24, '#e6398b');
  top.forEach((id, k) => txt(c, `${k + 1}. ${nameOf(S.players[id])}  ${ws[id][0]}`, 1348, 78 + k * 36, 26, '#222', 'left'));
  rr(c, 12, 12, 190, 70, 18, 'rgba(255,255,255,.93)', '#2b2118', 4); txt(c, st.ph === 'play' ? Math.ceil(st.left) + '초' : '사탕 나라', 107, 48, 36, '#222');
  if (st.ph === 'play' && st.left <= 10) txt(c, Math.ceil(st.left), 800, 450, 360, 'rgba(230,57,70,.45)');
}

/* ══════════ 세계지도 ══════════ */
function drawWorld(c, S, GAMES, from, to, k) {
  const t = S.t;
  c.fillStyle = '#6fd0ff'; c.fillRect(0, 0, 1600, 900);
  c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 4; for (let y = 60; y < 900; y += 90) for (let x = (y % 180) + ((t * 14) % 180) - 180; x < 1600; x += 180) { c.beginPath(); c.arc(x, y, 26, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  const land = [[330, 300, 290, 190, '#8fdc6a'], [250, 640, 190, 170, '#f6d37a'], [820, 240, 250, 150, '#ffb7d5'], [800, 560, 180, 130, '#fff3c4'], [1250, 330, 280, 200, '#b9e87a'], [1300, 700, 240, 140, '#cdb7ff'], [640, 780, 190, 90, '#9be3d0']];
  land.forEach(([x, y, w, h, col]) => { c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x, y, w + 16, h + 14, 0, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, 7); c.fill(); });
  Object.keys(GAMES).forEach(id => {
    const g = GAMES[id], [x, y] = g.xy, on = g.ready, sel = id === to;
    c.globalAlpha = on ? 1 : 0.55;
    c.fillStyle = sel ? '#ff5a5f' : on ? '#fff' : '#e8e8e8'; c.beginPath(); c.arc(x, y, sel ? 46 + Math.sin(t * 6) * 4 : 36, 0, 7); c.fill(); c.lineWidth = 5; c.strokeStyle = '#2b2118'; c.stroke();
    txt(c, g.icon, x, y + 2, sel ? 46 : 36, '#222'); txt(c, g.place + (on ? '' : ' (준비 중)'), x, y + 58, 24, '#222', 'center', '#fff');
    c.globalAlpha = 1;
  });
  const a = GAMES[from] ? GAMES[from].xy : [800, 450], b = GAMES[to] ? GAMES[to].xy : [800, 450];
  rr(c, 735, 410, 130, 80, 16, '#fff', '#2b2118', 5); txt(c, '🏫 교실', 800, 450, 30, '#222');
  if (to != null) {
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e - Math.sin(e * Math.PI) * 120;
    c.setLineDash([14, 14]); c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 240, b[0], b[1]); c.stroke(); c.setLineDash([]);
    // 반 전체가 탄 열기구
    c.fillStyle = '#ff5a5f'; c.beginPath(); c.arc(x, y - 70, 62, 0, 7); c.fill(); c.lineWidth = 5; c.strokeStyle = '#2b2118'; c.stroke();
    c.fillStyle = '#ffd400'; c.beginPath(); c.ellipse(x, y - 70, 22, 62, 0, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 40, y - 24); c.lineTo(x - 22, y + 8); c.moveTo(x + 40, y - 24); c.lineTo(x + 22, y + 8); c.stroke(); rr(c, x - 26, y + 6, 52, 34, 8, '#b5651d', '#2b2118', 5);
    const ids = Object.keys(S.players).filter(i => S.players[i].c).slice(0, 3); ids.forEach((i, n) => drawChar(c, x - 16 + n * 16, y + 4, 11, S.players[i].c, { face: 'laugh' }));
    rr(c, 400, 20, 800, 90, 26, '#fff', '#2b2118', 6); txt(c, GAMES[to] ? `${GAMES[to].place}(으)로 날아가는 중!` : '', 800, 66, 46, '#222');
  } else { rr(c, 350, 20, 900, 90, 26, '#fff', '#2b2118', 6); txt(c, '다음 여행지는 어디일까요?', 800, 66, 46, '#222'); }
}

/* ══════════ 교실(대기실·마지막 장면) ══════════ */
function drawClassroom(c, S, face, cx, span) {
  const t = S.t; cx = cx || 800; span = span || 1400;
  c.fillStyle = '#fff1cf'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#e8b979'; c.fillRect(0, 640, 1600, 260);
  rr(c, 330, 60, 940, 300, 14, '#2f7d5b', '#8a5a2b', 14);
  for (let k = 0; k < 4; k++) rr(c, 60 + (k > 1 ? 1280 : 0) + (k % 2) * 110, 90, 90, 150, 8, '#a8e0ff', '#8a5a2b', 8);
  for (let k = 0; k < 16; k++) { c.fillStyle = `hsl(${k * 47} 90% 65%)`; c.beginPath(); c.moveTo(k * 100, 0); c.lineTo(k * 100 + 100, 0); c.lineTo(k * 100 + 50, 60 + Math.sin(t * 2 + k) * 6); c.fill(); }
  const ids = Object.keys(S.players).filter(i => S.players[i].c), n = ids.length, per = Math.max(8, Math.ceil(n / 4));
  ids.forEach((id, k) => {
    const row = (k / per) | 0, col = k % per, cnt = Math.min(per, n - row * per), s = n > 60 ? 22 : n > 32 ? 28 : 36;
    const x = cx + (col - (cnt - 1) / 2) * Math.min(150, span / cnt), y = 470 + row * (s * 2.9);
    const born = S.born[id] = S.born[id] || t, pop = Math.min(1, (t - born) / 0.5);
    const laugh = face === 'laugh';
    drawChar(c, x, y - (1 - pop) * 200, s * (0.4 + 0.6 * pop), S.players[id].c, { face: face || 'smile', hat: laugh ? 'party' : null, name: nameOf(S.players[id]), bob: laugh ? -Math.abs(Math.sin(t * 7 + k)) * 18 : Math.sin(t * 2 + k) * 4, sq: laugh ? Math.sin(t * 14 + k) * 0.05 : 0 });
    if (laugh && (k + Math.floor(t * 2)) % 5 === 0) txt(c, ['ㅋㅋㅋ', '하하하', '꺄르르', '푸하하'][k % 4], x + s, y - s * 1.6, 22, '#ff5a5f', 'center', '#fff');
  });
  if (face === 'laugh') for (let k = 0; k < 70; k++) { c.fillStyle = `hsl(${k * 37} 95% 60%)`; c.fillRect((k * 131 + t * 30) % 1600, (k * 67 + t * (90 + k % 7 * 20)) % 900, 12, 18); }
}
