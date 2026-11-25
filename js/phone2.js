/* 학생 폰: 터치·퀴즈·그림 게임의 입력 화면. 교실 화면이 보낸 ask(무엇을 입력받을지)에 따라 그린다. */
const TAP_THEME = { mole: '#000', beat: '#0f1a3a', rocket: '#101632', ten: '#000' };

function ripple(root, e) {
  const r = root.getBoundingClientRect(), d = el('div', { class: 'ripple' });
  d.style.left = e.clientX - r.left + 'px'; d.style.top = e.clientY - r.top + 'px';
  root.append(d); setTimeout(() => d.remove(), 500);
}

function renderAsk(root, a, env) {
  root.onpointerdown = null; root.style.background = '';
  root.className = 'ask';
  if (a.type === 'tap') {
    root.className = 'ask tap'; root.style.background = env.teamColor || TAP_THEME[a.theme] || '#000';
    const hint = el('div', { class: 'thint', text: a.hint || '' });
    root.replaceChildren(el('div', { class: 'tlab', text: a.label }), hint);
    let last = 0, once = false;
    root.onpointerdown = e => {
      e.preventDefault(); if (a.closed) return;
      const now = performance.now(); if (now - last < 120) return; last = now;
      if (a.once && once) return; once = true;
      env.send({ k: 'tap' }); ripple(root, e); if (navigator.vibrate) navigator.vibrate(20);
      if (a.once) hint.textContent = '눌렀어요! 결과를 기다려요';
    };
    return;
  }
  if (a.type === 'choice' || a.type === 'grid') {
    const sel = env.sel[a.key], locked = a.closed || (sel != null && !a.change);
    const n = a.type === 'grid' ? a.cols * a.rows : a.opts.length;
    const btns = Array.from({ length: n }, (_, k) => el('button', {
      class: 'ach' + (sel === k ? ' on' : ''), style: a.type === 'grid' ? '' : `background:${OPTC[k % 4]}`, disabled: locked || null,
      onclick: () => { env.sel[a.key] = k; env.send({ k: 'ans', v: k }); renderAsk(root, a, env); }
    }, a.type === 'grid' ? [el('b', { text: String(k + 1) })] : [el('b', { text: SYM[k % 4] }), el('span', { text: a.opts[k] })]));
    root.replaceChildren(el('div', { class: 'alab', text: a.label }), el('div', { class: a.type === 'grid' ? 'agrid' : 'achoice' + (n > 2 ? ' four' : ''), style: a.type === 'grid' ? `grid-template-columns:repeat(${a.cols},1fr)` : '' }, btns),
      el('div', { class: 'hint', text: a.closed ? '마감됐어요' : sel != null ? (a.change ? '마감 전에는 바꿀 수 있어요' : '골랐어요') : '' }));
    return;
  }
  if (a.type === 'text') {
    if ((a.skip || []).includes(env.me)) { root.replaceChildren(el('div', { class: 'alab', text: '이미 맞혔어요! 친구들을 기다려요' })); return; }
    const done = env.sel[a.key], locked = a.closed || (done != null && !a.change);
    const inp = el('input', { type: 'text', maxlength: 20, placeholder: a.ph || '' }), err = el('div', { class: 'err' });
    if (done != null) inp.value = done; if (locked) inp.disabled = true;
    const go = () => { const v = inp.value.trim(); if (!v) { err.textContent = '답을 먼저 적어 주세요.'; return; } env.sel[a.key] = v; env.send({ k: 'ans', v }); inp.blur(); renderAsk(root, a, env); };
    inp.addEventListener('input', () => (err.textContent = '')); inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    root.replaceChildren(el('div', { class: 'alab', text: a.label }), inp, err, el('button', { class: 'b pri', text: a.closed ? '마감됐어요' : done != null ? (a.change ? '바꿔서 다시 내기' : '냈어요') : '내기', disabled: locked || null, onclick: go }));
    return;
  }
  if (a.type === 'diff') { env.diff = diffViewer(root, env); return; }
  // wait / info: 내 캐릭터와 안내만
  const cv = el('canvas', { class: 'acv', width: 300, height: 300 });
  root.replaceChildren(cv, el('div', { class: 'alab', text: a.label || '' }));
  const c = cv.getContext('2d');
  (function l(ms) { if (!cv.isConnected) return; c.clearRect(0, 0, 300, 300); if (env.marble) { c.fillStyle = `hsl(${(env.c * 47) % 360} 85% 60%)`; c.beginPath(); c.arc(150, 150, 120, 0, 7); c.fill(); c.lineWidth = 8; c.strokeStyle = '#2b2118'; c.stroke(); } drawChar(c, 150, 160, env.marble ? 70 : 90, env.c, { face: 'smile', hat: env.hat, bob: -Math.abs(Math.sin(ms / 250)) * 12, name: env.marble ? env.name : null }); requestAnimationFrame(l); })(0);
}

/* 틀린 그림 폰 화면: 끌어서 이동, 두 손가락·버튼으로 1~10배 확대, 터치하면 붓 동그라미 */
function diffViewer(root, env) {
  const cv = el('canvas', { class: 'dcv' }), mm = el('canvas', { class: 'dmm', width: 160, height: 90 }), zl = el('span', { class: 'dzl' }), lt = el('div', { class: 'dlt' });
  const lockBox = el('div', { class: 'dlock hidden' }, [el('div', { class: 'big', text: '🔒 잠깐 쉬어요' }), el('div', { class: 'sub', text: '아무 데나 막 누르면 잠겨요' }), lt]);
  const setZ = v => { z = Math.max(1, Math.min(10, v)); };
  const bar = el('div', { class: 'dbar' }, [el('button', { class: 'b sm', text: '−', onclick: () => setZ(z - 1) }), zl, el('button', { class: 'b sm', text: '+', onclick: () => setZ(z + 1) })]);
  root.replaceChildren(el('div', { class: 'dwrap' }, [cv, mm, bar, lockBox]));
  let img = null, imgKey = null, z = 3, cx = 800, cy = 450, marks = [], lockUntil = 0, fixed = [];
  const patches = {}, c = cv.getContext('2d'), mc = mm.getContext('2d');
  const geo = () => { const W = cv.clientWidth, H = cv.clientHeight, s = W / 1600 * z; return { W, H, s }; };
  const clampC = () => { const { W, H, s } = geo(), hw = W / 2 / s, hh = H / 2 / s; cx = hw >= 800 ? 800 : Math.max(hw, Math.min(1600 - hw, cx)); cy = hh >= 450 ? 450 : Math.max(hh, Math.min(900 - hh, cy)); };
  const pts = new Map(); let pinch = null, moved = 0, downT = 0;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) { moved = 0; downT = performance.now(); pinch = null; } if (pts.size === 2) { const a = [...pts.values()]; pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), z }; } e.preventDefault(); });
  cv.addEventListener('pointermove', e => { const p = pts.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 1 && !pinch) { const { s } = geo(); cx -= dx / s; cy -= dy / s; moved += Math.abs(dx) + Math.abs(dy); }
    else if (pts.size === 2 && pinch) { const a = [...pts.values()]; setZ(pinch.z * Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) / pinch.d); moved += 99; } e.preventDefault(); });
  const up = e => {
    if (!pts.has(e.pointerId)) return; const single = pts.size === 1 && !pinch; pts.delete(e.pointerId); if (!pts.size) pinch = pinch && null;
    if (!single || moved > 10 || performance.now() - downT > 450 || lockUntil > Net.now() || !img) return;
    const r = cv.getBoundingClientRect(), { W, H, s } = geo(), x = cx + (e.clientX - r.left - W / 2) / s, y = cy + (e.clientY - r.top - H / 2) / s;
    if (x < 0 || y < 0 || x > 1600 || y > 900) return;
    marks.push({ x, y, k: 'pend', t: performance.now() }); env.send({ k: 'tap', x: +(x / 1600).toFixed(4), y: +(y / 900).toFixed(4) });
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => { pts.delete(e.pointerId); pinch = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); setZ(z + (e.deltaY < 0 ? 0.5 : -0.5)); }, { passive: false });

  (function loop() {
    if (!cv.isConnected) return;
    const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    clampC(); const { s } = geo(), ox = W / 2 - cx * s, oy = H / 2 - cy * s, now = performance.now();
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#2b2118'; c.fillRect(0, 0, W, H);
    if (img) c.drawImage(img, ox, oy, 1600 * s, 900 * s); else txt(c, '그림을 받는 중…', W / 2, H / 2, 20, '#fff');
    fixed.forEach(f => { const im = patches[f.i] || (patches[f.i] = Object.assign(new Image(), { src: f.p })), pad = f.r + 6; if (im.complete) c.drawImage(im, ox + (f.x - pad) * s, oy + (f.y - pad) * s, pad * 2 * s, pad * 2 * s); c.strokeStyle = '#e63946'; c.lineWidth = 4; c.beginPath(); c.arc(ox + f.x * s, oy + f.y * s, f.r * s, 0, 7); c.stroke(); });
    marks = marks.filter(m => now - m.t < (m.k === 'pend' ? 3000 : m.k === 'hit' ? 1500 : 1300));
    marks.forEach(m => {
      const X = ox + m.x * s, Y = oy + m.y * s, k = Math.min(1, (now - m.t) / 300), R = 26;
      if (m.k === 'pend' || m.k === 'hit') { c.strokeStyle = m.k === 'hit' ? '#e63946' : 'rgba(43,33,24,.85)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.arc(X, Y, R, -1.4, -1.4 + 6.6 * k); c.stroke(); }
      else if (m.k === 'miss') { c.globalAlpha = 1 - (now - m.t) / 1300; c.strokeStyle = '#e63946'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(X - 18, Y - 18); c.lineTo(X + 18, Y + 18); c.moveTo(X + 18, Y - 18); c.lineTo(X - 18, Y + 18); c.stroke(); c.globalAlpha = 1; }
      else { c.globalAlpha = 1 - (now - m.t) / 1300; c.strokeStyle = '#f5b301'; c.lineWidth = 6; c.beginPath(); c.arc(X, Y, R, 0, 7); c.stroke(); c.globalAlpha = 1; }
      c.lineCap = 'butt';
    });
    mc.clearRect(0, 0, 160, 90); if (img) mc.drawImage(img, 0, 0, 160, 90); mc.strokeStyle = '#e63946'; mc.lineWidth = 3; mc.strokeRect((cx - W / 2 / s) / 10, (cy - H / 2 / s) / 10, W / s / 10, H / s / 10);
    zl.textContent = (Math.round(z * 10) / 10) + '배';
    const left = Math.ceil((lockUntil - Net.now()) / 1000); lockBox.classList.toggle('hidden', !(left > 0)); if (left > 0) lt.textContent = left + '초';
    requestAnimationFrame(loop);
  })();
  return {
    alive: () => cv.isConnected,
    setImg(o) { if (!o || o.k === imgKey) return; imgKey = o.k; const im = new Image(); im.onload = () => (img = im); im.src = o.url; },
    key: () => imgKey,
    setFixed(list) { fixed = list || []; },
    mark(v) {
      if (v.r === 'lock') { lockUntil = v.until; }
      if (v.x == null) return;
      let m = null, bd = 60; marks.forEach(q => { if (q.k !== 'pend') return; const d = Math.hypot(q.x - v.x, q.y - v.y); if (d < bd) { bd = d; m = q; } });
      if (!m) { m = { x: v.x, y: v.y }; marks.push(m); }
      m.k = v.r === 'hit' ? 'hit' : v.r === 'already' ? 'already' : 'miss'; m.t = performance.now();
    }
  };
}
