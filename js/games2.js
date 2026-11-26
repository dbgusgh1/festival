/* 터치·퀴즈·그림 게임 11종. 교실 화면(심판)에서 돌아가며, 학생 폰에는 '무엇을 입력받을지(ask)'와 개인 결과만 보낸다. */
const TASTE_DEFAULT = [['탕수육 부먹', '탕수육 찍먹'], ['짜장면', '짬뽕'], ['여름', '겨울'], ['산', '바다'], ['강아지', '고양이'], ['아침형 인간', '저녁형 인간'], ['민트초코 좋아', '민트초코 싫어'], ['떡볶이', '순대'], ['순간이동 능력', '투명인간 능력'], ['평생 라면만', '평생 치킨만'], ['체육 시간 피구', '체육 시간 축구'], ['급식 빨리 먹기', '급식 천천히 먹기']].map(([a, b]) => ({ a, b }));
const TQ_DEFAULT = [
  { q: '선생님이 방학 첫날 가장 먼저 할 일은?', o: ['늦잠 자기', '여행 가기', '운동하기', '밀린 드라마 보기'] },
  { q: '선생님이 제일 좋아하는 급식 메뉴는?', o: ['돈가스', '떡볶이', '카레', '비빔밥'] },
  { q: '선생님의 어릴 적 꿈은?', o: ['운동선수', '선생님', '가수', '과학자'] },
  { q: '선생님이 가장 무서워하는 것은?', o: ['벌레', '귀신', '높은 곳', '시험지 채점'] },
  { q: '선생님이 주말에 주로 하는 일은?', o: ['운동', '낮잠', '요리', '게임'] },
  { q: '선생님이 올해 가장 기뻤던 순간은?', o: ['체육대회', '현장체험학습', '방학식', '첫 만남'] },
  { q: '선생님이 가장 자주 하는 말은?', o: ['조용히!', '잘했어!', '다시 한번', '밥 먹으러 가자'] },
  { q: '선생님이 다시 태어나면 되고 싶은 동물은?', o: ['고양이', '독수리', '돌고래', '나무늘보'] }
];
const SOLO_DEFAULT = ['교실에서 볼 수 있는 네모난 물건은?', '빨간색 과일이나 채소는?', '공으로 하는 운동은?', '방학에 가고 싶은 곳은?', '급식에 나오면 좋은 반찬은?', 'ㄱ으로 시작하는 동물은?', '편의점에서 파는 것은?', '학교에 있는 장소는?', '바다에 사는 동물은?', '필통에 들어 있는 것은?', '겨울에 생각나는 것은?', '체육 시간에 쓰는 물건은?', '노란색인 것은?', '받으면 기분 좋은 선물은?', '날개가 있는 것은?', '라면에 넣으면 맛있는 것은?'].map(q => ({ q }));
const STORE_ITEMS = [['🍙', '삼각김밥'], ['🥛', '우유'], ['🍫', '초콜릿'], ['🍜', '컵라면'], ['🧃', '주스'], ['🍞', '빵'], ['🍦', '아이스크림'], ['🍬', '사탕'], ['🥤', '탄산음료'], ['🍪', '쿠키'], ['🧻', '휴지'], ['🔋', '건전지'], ['🍌', '바나나'], ['🥚', '달걀'], ['🧀', '치즈'], ['🍭', '막대사탕'], ['🍕', '피자'], ['🌭', '핫도그']];
const SYM = ['▲', '●', '■', '★'], OPTC = ['#ff5a5f', '#3d8bff', '#27b56a', '#f5b301'];
const shuffle = (a, r) => { a = a.slice(); for (let k = a.length - 1; k > 0; k--) { const j = ((r ? r() : Math.random()) * (k + 1)) | 0; [a[k], a[j]] = [a[j], a[k]]; } return a; };
const key = () => Math.random().toString(36).slice(2, 9);
const secs = (ctx, until) => Math.max(0, (until - ctx.now()) / 1000);
const LVOF = ctx => (ctx.opts.lv === 1 || ctx.opts.lv === 3 ? ctx.opts.lv : 2);

/* 공통 그리기 */
function head(c, text, sub, col) {
  rr(c, 60, 24, 1220, 150, 28, '#fff', '#2b2118', 6);
  if (sub) { txt(c, sub, 100, 54, 28, col || '#e63946', 'left'); wrapText(c, text, 670, 118, 1140, 46, '#222'); }
  else wrapText(c, text, 670, 100, 1140, 50, '#222');
}
function sky(c, top, bottom) { c.fillStyle = top; c.fillRect(0, 0, 1600, 900); if (bottom) { c.fillStyle = bottom; c.fillRect(0, 620, 1600, 280); } }
function choiceTiles(c, opts, y, h, dist, ans, total) {
  const n = opts.length, w = (1480 - (n - 1) * 20) / n;
  opts.forEach((o, k) => {
    const x = 60 + k * (w + 20), win = ans != null && (Array.isArray(ans) ? ans.includes(k) : ans === k), dim = ans != null && !win;
    c.globalAlpha = dim ? 0.45 : 1;
    rr(c, x, y, w, h, 26, OPTC[k % 4], '#2b2118', win ? 10 : 5);
    txt(c, SYM[k % 4], x + 44, y + 44, 40, '#fff');
    wrapText(c, o, x + w / 2, y + h / 2 - (dist ? 16 : 0), w - 60, n > 2 ? 40 : 54, '#fff');
    if (dist) { const v = dist[k] || 0; txt(c, v + '명', x + w / 2, y + h - 40, 44, '#fff', 'center', 'rgba(0,0,0,.35)'); if (total) { c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 20, y + h - 14, (w - 40) * v / total, 8); } }
    c.globalAlpha = 1;
  });
}
function dressedCrowd(c, S, y, hat, face) {
  const ids = Object.keys(S.players).filter(i => S.players[i].c).slice(0, 40), n = ids.length;
  ids.forEach((id, k) => drawChar(c, 60 + (k + 0.5) * (1480 / Math.max(n, 1)), y + (k % 2) * 16, Math.min(26, 700 / Math.max(n, 1)), S.players[id].c, { hat, face: face || 'smile', bob: -Math.abs(Math.sin(S.t * 3 + k)) * 6 }));
}

const GAMEDEF = {
  /* ═════ 01 두더지 선착순 ═════
     하: 두더지가 나오면 폰 아무 곳이나 탭 (한 마리씩).
     중: 폰에 구멍 9개 → 큰 화면과 같은 구멍을 탭. 다른 구멍을 누르면 1초 쉬기. 가끔 황금 두더지(+20).
     상: 구멍 16개, 두 마리씩 나오고 빨리 숨는다. 💣 폭탄 두더지를 누르면 -5점·2초 쉬기. */
  mole: {
    CFG: [null,
      { cols: 3, rows: 3, up: 2200, gap: [1200, 2200], max: 1, gold: 0, bomb: 0, n: 10, any: true },
      { cols: 3, rows: 3, up: 1700, gap: [600, 1400], max: 1, gold: 0.15, bomb: 0, n: 14 },
      { cols: 4, rows: 4, up: 1300, gap: [250, 900], max: 2, gold: 0.12, bomb: 0.22, n: 20 }],
    setup(ctx) {
      const lv = LVOF(ctx), cf = this.CFG[lv], holes = [];
      const fw = cf.cols === 4 ? 250 : 320, fh = cf.cols === 4 ? 140 : 175, x0 = 800 - (cf.cols - 1) * fw / 2, y0 = cf.cols === 4 ? 345 : 390;
      for (let r = 0; r < cf.rows; r++) for (let q = 0; q < cf.cols; q++) holes.push([x0 + q * fw, y0 + r * fh]);
      if (cf.any) ctx.ask({ type: 'tap', theme: 'mole', label: '🔨 뿅망치', hint: '두더지가 나오면 화면 아무 곳이나 탭!' });
      else ctx.ask({ type: 'holes', cols: cf.cols, rows: cf.rows, label: '🔨 큰 화면과 같은 구멍을 탭!' });
      ctx.setPub({ ml: { cols: cf.cols, rows: cf.rows, holes, list: [], total: ctx.practice ? 3 : (ctx.opts.n || cf.n), n: 0, lv } });
      return { cf, lv, holes, total: ctx.practice ? 3 : (ctx.opts.n || cf.n), spawned: 0, moles: {}, pts: {}, catches: {}, lock: {}, early: {}, mid: 0 };
    },
    begin(ctx, g) { ctx.setPub({ ph: 'play' }); ctx.after(900, () => this.spawn(ctx, g)); },
    live(g) { return Object.values(g.moles).filter(m => m.st === 'up'); },
    push(ctx, g) {
      const now = ctx.now(), list = Object.values(g.moles).filter(m => m.st === 'up' || now - (m.endAt || now) < 1600).map(m => ({ id: m.id, h: m.h, k: m.k, st: m.st, by: m.by || null, t0: m.upAt, t1: m.endAt || 0 }));
      ctx.setPub({ ml: Object.assign({}, ctx.P().ml, { list, n: g.spawned }) });
    },
    spawn(ctx, g) {
      if (g.spawned >= g.total) { if (!this.live(g).length) ctx.after(1200, () => ctx.done()); return; }
      if (this.live(g).length < g.cf.max) {
        const busy = new Set(this.live(g).map(m => m.h)), free = g.holes.map((_, k) => k).filter(k => !busy.has(k));
        const h = free[(Math.random() * free.length) | 0], r = Math.random();
        const k = g.spawned >= 1 && r < g.cf.bomb ? 'bomb' : r < g.cf.bomb + g.cf.gold ? 'gold' : 'norm';
        const m = { id: ++g.mid, h, k, st: 'up', upAt: ctx.now(), taps: [], early: g.cf.any ? Object.assign({}, g.early) : {} };
        if (k !== 'bomb') g.spawned++;
        g.early = {}; g.moles[m.id] = m; ctx.beep(k === 'gold' ? 1200 : k === 'bomb' ? 300 : 700, 0.06);
        this.push(ctx, g);
        ctx.after(g.cf.up * (k === 'gold' ? 0.8 : 1), () => { if (m.st === 'up') this.hide(ctx, g, m); });
      }
      const [a, b] = g.cf.gap; ctx.after(a + Math.random() * (b - a) + (g.cf.any ? g.cf.up : 0), () => this.spawn(ctx, g));
    },
    hide(ctx, g, m) {   // 숨을 시간: 잡혔으면 잡은 사람, 아니면 도망
      if (m.st !== 'up') return;
      const w = m.k === 'bomb' ? null : Sim2.moleWinner(m.taps, m.upAt, m.upAt + g.cf.up + 300, m.early);
      m.endAt = ctx.now(); g.lastSt = null;
      if (w) {
        const p = m.k === 'gold' ? 20 : 10;
        m.st = 'hit'; m.by = ctx.name(w); g.catches[w] = (g.catches[w] || 0) + 1; g.pts[w] = (g.pts[w] || 0) + p; ctx.score(w, p); ctx.stat(w, 'mole');
        ctx.tell(w, { k: 'msg', b: m.k === 'gold' ? '황금 두더지! 잡았닭!' : '잡았어요! 잡았닭!', s: ctx.practice ? '연습판' : `+${p}점`, c: 'green' }); ctx.beep(990, 0.1);
        const [x, y] = g.holes[m.h]; FX.stars(x, y - 60, m.k === 'gold' ? 14 : 8, m.k === 'gold' ? '#ffd400' : '#fff'); FX.pop(x + 70, y - 90, `+${p}`, m.k === 'gold' ? '#d48a00' : '#e63946', 40);
        [...new Set(m.taps.map(t => t.id))].forEach(id => { if (id !== w) ctx.tell(id, { k: 'msg', b: '먼저 잡혔어요!', s: m.by + '이(가) 먼저', c: 'red' }); });
      } else m.st = m.k === 'bomb' ? 'gone' : 'miss';
      this.push(ctx, g);
    },
    onEv(ctx, g, id, e) {
      if (e.k !== 'tap') return;
      const now = ctx.now();
      if (g.lock[id] > now) return ctx.tell(id, { k: 'msg', b: '잠깐 쉬는 중', s: Math.ceil((g.lock[id] - now) / 1000) + '초 뒤에 다시', c: 'warn' });
      if (g.cf.any) {
        const m = this.live(g)[0];
        if (!m) {
          const prev = Object.values(g.moles).sort((p, q) => (q.endAt || 0) - (p.endAt || 0))[0];
          if (prev && now - (prev.endAt || 0) < 1200) { if (prev.st === 'hit' && !prev.taps.some(t => t.id === id)) ctx.tell(id, { k: 'msg', b: '먼저 잡혔어요!', s: (prev.by || '') + '이(가) 먼저', c: 'red' }); return; }
          if (!g.early[id]) { g.early[id] = 1; ctx.tell(id, { k: 'msg', b: '너무 빨랐어요!', s: '이번 두더지는 못 잡아요', c: 'warn' }); } return;
        }
        if (m.early[id]) return;
        m.taps.push({ id, at: e.at, n: e.n }); if (!m.pend) { m.pend = 1; ctx.after(300, () => this.hide(ctx, g, m)); }
        return;
      }
      const h = e.h | 0, m = this.live(g).find(q => q.h === h);
      if (!m) { g.lock[id] = now + 1000; return ctx.tell(id, { k: 'msg', b: '헛방!', s: '두더지가 없는 구멍이에요 · 1초 쉬기', c: 'red' }); }
      if (m.k === 'bomb') {
        if (m.boomed && m.boomed[id]) return; (m.boomed = m.boomed || {})[id] = 1;
        g.lock[id] = now + 2000; g.pts[id] = (g.pts[id] || 0) - 5; ctx.score(id, -5);
        const [x, y] = g.holes[m.h]; FX.burst(x, y - 40, 14, ['#333', '#ff9f1c', '#ff3b3b']); FX.pop(x, y - 120, '펑! -5', '#333', 34); FX.shake(6);
        return ctx.tell(id, { k: 'msg', b: '펑! 폭탄 두더지', s: ctx.practice ? '연습판' : '-5점 · 2초 쉬기', c: 'red' });
      }
      m.taps.push({ id, at: e.at, n: e.n }); if (!m.pend) { m.pend = 1; ctx.after(250, () => this.hide(ctx, g, m)); }
    },
    bot(ctx, g, id) {
      const L = this.live(g);
      if (g.cf.any) { if (L.length && Math.random() < 0.25) ctx.botEv(id, { k: 'tap' }); else if (!L.length && Math.random() < 0.02) ctx.botEv(id, { k: 'tap' }); return; }
      if (L.length && Math.random() < 0.18) ctx.botEv(id, { k: 'tap', h: Math.random() < 0.7 ? L[0].h : (Math.random() * g.holes.length) | 0 });
    },
    end(ctx, g) { return { type: 'solo', title: '두더지 점수', unit: '점', rows: Sim.rankBy(ctx.active().map(id => ({ id, v: g.pts[id] || 0 })), o => o.v, true) }; },
    draw(c, S, g) {
      const P = S.pub, ml = P.ml || { holes: [], list: [] }, t = S.t, now = Net.now();
      const sky = c.createLinearGradient(0, 0, 0, 300); sky.addColorStop(0, '#7fd3ff'); sky.addColorStop(1, '#d8f3ff'); c.fillStyle = sky; c.fillRect(0, 0, 1600, 900);
      c.fillStyle = '#ffe45c'; c.beginPath(); c.arc(1460, 90, 60, 0, 7); c.fill(); cloud(c, (t * 15) % 1900 - 150, 200, 30); cloud(c, (t * 10 + 800) % 1900 - 150, 160, 24);
      c.fillStyle = '#8fd46a'; c.beginPath(); c.ellipse(300, 330, 500, 110, 0, Math.PI, 0); c.ellipse(1300, 340, 520, 120, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#7cc95b'; c.fillRect(0, 300, 1600, 600);
      for (let x = 20; x < 1600; x += 60) { c.fillStyle = '#a5672f'; c.fillRect(x, 270, 10, 60); } c.fillStyle = '#c48a4e'; c.fillRect(0, 282, 1600, 10); c.fillRect(0, 306, 1600, 10);
      const cols = ml.cols || 3, rows = ml.rows || 3, fw = cols === 4 ? 250 : 320, fh = cols === 4 ? 140 : 175, hs = cols === 4 ? 0.64 : 0.86;
      for (let k = 0; k < 14; k++) { const x = 90 + k * 110; if (x > 260 && x < 1340) continue; c.fillStyle = '#ff8a1f'; c.beginPath(); c.moveTo(x - 12, 830); c.lineTo(x + 12, 830); c.lineTo(x, 890); c.fill(); c.fillStyle = '#3aa655'; c.beginPath(); c.ellipse(x - 8, 820, 6, 16, -0.4 + Math.sin(t * 2 + k) * 0.1, 0, 7); c.ellipse(x + 8, 820, 6, 16, 0.4 + Math.sin(t * 2 + k) * 0.1, 0, 7); c.fill(); }
      const holes = ml.holes || [];
      if (holes.length) { const x0 = holes[0][0] - fw / 2 - 20, y0 = holes[0][1] - fh / 2 - 40; rr(c, x0, y0 + 10, fw * cols + 40, fh * rows + 70, 50, 'rgba(0,0,0,.18)'); rr(c, x0, y0, fw * cols + 40, fh * rows + 70, 50, '#a5672f', '#6b3d1f', 6); c.fillStyle = 'rgba(255,255,255,.07)'; for (let k = 0; k < 40; k++) { c.beginPath(); c.arc(x0 + ((k * 137) % (fw * cols)), y0 + ((k * 89) % (fh * rows)), 6, 0, 7); c.fill(); } }
      const byHole = {}; (ml.list || []).forEach(m => (byHole[m.h] = m));
      holes.forEach(([x, y], k) => {
        c.save(); c.translate(x, y); c.scale(hs, hs);
        c.fillStyle = '#4a2a12'; c.beginPath(); c.ellipse(0, 40, 110, 34, 0, 0, 7); c.fill();
        if (ml.lv !== 1) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(-118, 30, 22, 0, 7); c.fill(); txt(c, String(k + 1), -118, 32, 28, '#6b3d1f'); }
        const m = byHole[k];
        if (m) {
          const age = (now - m.t0) / 1000, gone = m.st !== 'up', ga = gone ? (now - m.t1) / 1000 : 0;
          let rise = easeBack(Math.min(1, age / 0.18)); if (gone) rise = m.st === 'hit' ? Math.max(0, 1 - Math.max(0, ga - 0.6) / 0.25) : Math.max(0, 1 - ga / 0.25);
          c.save(); c.beginPath(); c.rect(-130, -230, 260, 270); c.clip();
          const yy = 10 + 90 * (1 - rise), col = m.k === 'gold' ? '#ffcc33' : m.k === 'bomb' ? '#3b3b4a' : '#8a5a3c', ln = m.k === 'gold' ? '#a87800' : '#3a2a1a';
          c.fillStyle = col; c.beginPath(); c.ellipse(0, yy - 60, 72, 84, 0, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = ln; c.stroke();
          c.fillStyle = m.k === 'bomb' ? '#5a5a6e' : '#f5c6a5'; c.beginPath(); c.ellipse(0, yy - 40, 42, 32, 0, 0, 7); c.fill();
          for (const d of [-1, 1]) { c.fillStyle = col; c.beginPath(); c.ellipse(d * 58, yy - 4, 22, 14, d * 0.4, 0, 7); c.fill(); c.stroke(); }
          c.fillStyle = '#ff6f91'; c.beginPath(); c.arc(0, yy - 54, 12, 0, 7); c.fill();
          c.fillStyle = '#fff'; c.fillRect(-8, yy - 36, 7, 10); c.fillRect(1, yy - 36, 7, 10);
          if (m.st === 'hit') { txt(c, '✕', -24, yy - 86, 34, ln); txt(c, '✕', 24, yy - 86, 34, ln); for (let n = 0; n < 3; n++) { const a = t * 6 + n * 2.1; txt(c, '★', Math.cos(a) * 60, yy - 150 + Math.sin(a) * 14, 30, '#ffd400', 'center', INK); } }
          else { c.fillStyle = '#111'; c.beginPath(); c.arc(-24, yy - 86, 9, 0, 7); c.arc(24, yy - 86, 9, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-27, yy - 89, 3, 0, 7); c.arc(21, yy - 89, 3, 0, 7); c.fill(); }
          if (m.k === 'bomb') { c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(0, yy - 150, 18, Math.PI, 0); c.fill(); c.stroke(); c.strokeStyle = '#a87800'; c.beginPath(); c.moveTo(0, yy - 168); c.quadraticCurveTo(14, yy - 190, 4, yy - 200); c.stroke(); txt(c, '✸', 4 + Math.sin(t * 30) * 2, yy - 204, 26, '#ff9f1c'); txt(c, '💣', 54, yy - 120, 34); }
          else if (m.k === 'gold') { c.save(); c.translate(0, yy - 60); hat(c, 80, 'crown'); c.restore(); for (let n = 0; n < 2; n++) txt(c, '✦', Math.sin(t * 7 + n * 3) * 70, yy - 100 + Math.cos(t * 5 + n) * 30, 26, '#fff7c2'); }
          else { c.fillStyle = '#ffd400'; c.beginPath(); c.arc(0, yy - 100, 64, Math.PI, 0); c.closePath(); c.fill(); c.strokeStyle = ln; c.lineWidth = 5; c.stroke(); c.fillStyle = '#fff6b0'; c.beginPath(); c.arc(0, yy - 150, 10, 0, 7); c.fill(); c.stroke(); }
          c.restore();
          if (m.st === 'hit' && ga < 0.6) {   // 뿅망치
            const sw = Math.min(1, ga / 0.12);
            c.save(); c.translate(70, -150); c.rotate(-1.2 + sw * 1.2); rr(c, -8, 0, 16, 120, 6, '#c98b52', INK, 4); rr(c, -60, -30, 120, 56, 22, '#ff5a5f', INK, 5); rr(c, -60, -30, 22, 56, [22, 0, 0, 22], '#ffd400', INK, 4); c.restore();
          }
          if (m.st === 'hit' && m.by) pill(c, m.by, 0, -230 + Math.max(0, 0.3 - ga) * 60, 26, '#fff', '#e63946');
          if (m.st === 'miss' && ga < 0.6) txt(c, '쏙!', 0, -60 - ga * 60, 36, '#fff', 'center', INK);
        }
        c.fillStyle = '#6b3d1f'; c.beginPath(); c.ellipse(0, 50, 120, 26, 0, 0, Math.PI); c.fill();
        c.restore();
      });
      card(c, 60, 24, 1220, 120, 28);
      const last = (ml.list || []).filter(m => m.st !== 'up').sort((a, b) => b.t1 - a.t1)[0];
      if (last && now - last.t1 < 1500) txt(c, last.st === 'hit' ? `잡았닭! ${last.by}` : last.k === 'bomb' ? '폭탄 두더지가 들어갔어요' : '두더지가 도망갔어요!', 670, 84, 56, last.st === 'hit' ? '#e63946' : '#888');
      else txt(c, P.ph === 'play' ? (ml.lv === 1 ? '두더지가 나오면 폰을 탭!' : '두더지가 나온 구멍 번호를 폰에서 탭!') : '당근밭 두더지 선착순', 670, 84, 52, '#222');
      pill(c, `${Math.min(ml.n || 0, ml.total || 0)} / ${ml.total || ''}마리`, 1440, 64, 34, '#fff');
      lvBadge(c, ml.lv, 1580, 120, 24);
      if (g) { const top = Object.keys(g.pts).sort((a, b) => g.pts[b] - g.pts[a]).slice(0, 5); if (top.length) { card(c, 1330, 330, 250, 60 + top.length * 48, 20, 'rgba(255,255,255,.95)', 4, 6); txt(c, '두더지 점수', 1455, 360, 26, '#e63946'); } top.forEach((id, k) => txt(c, `${k + 1}. ${nameOf(S.players[id])} ${g.pts[id]}점`, 1350, 405 + k * 48, 26, '#222', 'left')); }
    }
  },

  /* ═════ 02 우리 반 박자 맞추기 ═════ */
  beat: {
    setup(ctx) { return { R: ctx.practice ? 1 : (ctx.opts.n || 5), r: 0, rec: [] }; },
    begin(ctx, g) { ctx.setPub({ ph: 'play' }); this.round(ctx, g); },
    round(ctx, g) {
      if (g.r >= g.R) return ctx.done();
      g.r++; g.press = {};
      const lv = LVOF(ctx), k = g.r - 1;
      const dur = lv === 1 ? Math.max(2400, 3800 - k * 300) : lv === 3 ? Math.max(1300, 2800 - k * 350) : Math.max(1600, 3200 - k * 350);
      const w = lv === 1 ? Math.max(0.13, 0.2 - k * 0.015) : lv === 3 ? Math.max(0.06, 0.11 - k * 0.012) : Math.max(0.07, 0.15 - k * 0.02);
      const a = 0.42 + Math.random() * (0.88 - 0.42 - w);
      g.cur = { t0: ctx.now() + 2000, dur, zone: [+a.toFixed(3), +(a + w).toFixed(3)], r: g.r, R: g.R, st: 'run', hide: lv === 3 ? [+(a - 0.14).toFixed(3), +(a + w + 0.04).toFixed(3)] : null };
      ctx.ask({ type: 'tap', theme: 'beat', label: '🔔 커다란 종', hint: '큰 화면의 바늘이 노란 구간에 오면 한 번만 탭!', once: true });
      ctx.setPub({ beat: g.cur });
      ctx.after(2000 + dur + 700, () => {
        const ids = ctx.active(); let ok = 0;
        ids.forEach(id => {
          const ct = g.press[id], hit = ct != null && Sim2.beatHit(g.cur.t0, g.cur.dur, g.cur.zone, ct);
          if (hit) ok++;
          ctx.tell(id, hit ? { k: 'msg', b: '딩동! 성공', s: '우리 반 기록에 +1', c: 'green' } : { k: 'msg', b: ct == null ? '안 눌렀어요' : '아쉬워요', s: ct == null ? '' : (Sim2.beatPos(g.cur.t0, g.cur.dur, ct) < g.cur.zone[0] ? '조금 빨랐어요' : '조금 늦었어요'), c: 'red' });
        });
        g.rec.push({ ok, of: ids.length }); g.cur = Object.assign({}, g.cur, { st: 'done', ok, of: ids.length });
        ctx.setPub({ beat: g.cur }); ctx.beep(ok * 2 >= ids.length ? 990 : 300, 0.2);
        ctx.after(3000, () => this.round(ctx, g));
      });
    },
    onEv(ctx, g, id, e) { if (e.k === 'tap' && g.cur && g.cur.st === 'run' && g.press[id] == null) { g.press[id] = e.ct; ctx.tell(id, { k: 'msg', b: '눌렀어요!', s: '결과를 기다려요', c: '' }); } },
    bot(ctx, g, id) { if (g.cur && g.cur.st === 'run' && g.press[id] == null) { const p = Sim2.beatPos(g.cur.t0, g.cur.dur, ctx.now()); if (p > g.cur.zone[0] - 0.08 && Math.random() < 0.35) ctx.botEv(id, { k: 'tap' }); } },
    end(ctx, g) {
      const ok = g.rec.reduce((a, b) => a + b.ok, 0), of = g.rec.reduce((a, b) => a + b.of, 0);
      return { type: 'class', title: '우리 반 박자 기록', big: `${of}번 중 ${ok}번 성공`, lines: g.rec.map((r, k) => `${k + 1}라운드 · ${r.of}명 중 ${r.ok}명 성공`) };
    },
    draw(c, S, g, ctx) {
      const b = S.pub.beat, t = S.t;
      sky(c, '#ffe3a8', '#c7e9a0'); c.fillStyle = '#c28a4e'; c.fillRect(640, 120, 320, 520); c.beginPath(); c.moveTo(600, 120); c.lineTo(800, 10); c.lineTo(1000, 120); c.fillStyle = '#8b3a2b'; c.fill();
      for (let k = 0; k < 6; k++) { c.fillStyle = `hsl(${k * 60} 70% 70%)`; c.fillRect(80 + k * 90, 470 - (k % 3) * 40, 70, 170 + (k % 3) * 40); c.fillRect(1100 + k * 80, 480 - (k % 2) * 50, 60, 160 + (k % 2) * 50); }
      const cx = 800, cy = 560, R = 420;
      c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, R, Math.PI, 0); c.closePath(); c.fill(); c.lineWidth = 10; c.strokeStyle = '#2b2118'; c.stroke();
      if (b) {
        const ang = p => Math.PI + p * Math.PI;
        c.fillStyle = '#ffd400'; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R - 8, ang(b.zone[0]), ang(b.zone[1])); c.closePath(); c.fill();
        txt(c, '여기!', cx + Math.cos(ang((b.zone[0] + b.zone[1]) / 2)) * (R + 40), cy + Math.sin(ang((b.zone[0] + b.zone[1]) / 2)) * (R + 40), 36, '#e63946', 'center', '#fff');
        for (let k = 0; k <= 10; k++) { const a = ang(k / 10); c.strokeStyle = '#2b2118'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30)); c.lineTo(cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8)); c.stroke(); }
        const p = Math.max(0, Math.min(1, (Net.now() - b.t0) / b.dur)), a = ang(b.st === 'run' ? p : 1);
        const hid = b.hide && b.st === 'run' && p >= b.hide[0] && p <= b.hide[1];
        if (!hid) { c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx + 6, cy + 6); c.lineTo(cx + 6 + Math.cos(a) * (R - 40), cy + 6 + Math.sin(a) * (R - 40)); c.stroke(); c.strokeStyle = '#e63946'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40)); c.stroke(); c.lineCap = 'butt'; }
        if (b.hide && b.st === 'run' && p > b.hide[0] - 0.08 && p < b.hide[1] + 0.08) { const al = Math.min(1, Math.min(p - b.hide[0] + 0.08, b.hide[1] + 0.08 - p) / 0.08); c.globalAlpha = al; const mid = ang((b.hide[0] + b.hide[1]) / 2); for (let n = 0; n < 4; n++) cloud(c, cx + Math.cos(mid) * (R * 0.55) + (n - 1.5) * 70, cy + Math.sin(mid) * (R * 0.55) + Math.sin(n * 2) * 30, 70, '#f4f7ff'); c.globalAlpha = 1; }
        c.fillStyle = '#2b2118'; c.beginPath(); c.arc(cx, cy, 26, 0, 7); c.fill();
        rr(c, 260, 650, 1080, 200, 30, '#fff', '#2b2118', 6);
        if (b.st === 'done') { txt(c, `${b.of}명 중 ${b.ok}명 성공`, 800, 730, 90, '#e63946'); txt(c, `${b.r} / ${b.R} 라운드`, 800, 812, 34, '#888'); }
        else txt(c, Net.now() < b.t0 ? `${b.r}라운드 준비… 바늘을 보세요` : '노란 구간에서 한 번만 탭!', 800, 750, 58, '#222');
      } else { rr(c, 260, 650, 1080, 200, 30, '#fff', '#2b2118', 6); txt(c, '시계탑 마을 박자 맞추기', 800, 750, 58, '#222'); }
      lvBadge(c, S.pub.lv, 1580, 40, 26);
      if (S.pub.ph === 'play') dressedCrowd(c, S, 600, 'band');
    }
  },

  /* ═════ 03 공통 취향 맞추기 ═════ */
  taste: {
    setup(ctx) { return { qs: ctx.pool('taste', ctx.practice ? 1 : (ctx.opts.n || 5)), i: -1, tot: {} }; },
    begin(ctx, g) { this.q(ctx, g); },
    q(ctx, g) {
      g.i++; if (g.i >= g.qs.length) return ctx.done();
      const q = g.qs[g.i], T = [0, 15000, 12000, 8000][LVOF(ctx)]; g.votes = {}; g.until = ctx.now() + T; g.open = true; g.T = T;
      ctx.ask({ type: 'choice', opts: [q.a, q.b], label: '두 가게 중 하나에 줄 서기', change: true });
      ctx.setPub({ ph: 'play', tq: { a: q.a, b: q.b, n: g.i + 1, total: g.qs.length, until: g.until, T: T / 1000 }, tres: null, can: null });
      ctx.after(T, () => this.close(ctx, g));
    },
    close(ctx, g) {
      g.open = false; ctx.askClose();
      const r = Sim2.tasteScore(g.votes);
      r.winners.forEach(id => { ctx.score(id, 10); g.tot[id] = (g.tot[id] || 0) + 10; });
      ctx.active().forEach(id => ctx.tell(id, g.votes[id] == null ? { k: 'msg', b: '투표를 안 했어요', s: '0점', c: '' } : r.winners.includes(id) ? { k: 'msg', b: '우리 반 취향 적중!', s: ctx.practice ? '연습판' : '+10점', c: 'green' } : { k: 'msg', b: '소수 취향이네요', s: '0점', c: 'red' }));
      ctx.setPub({ ph: 'reveal', tres: { n: r.n, win: r.win }, can: 'next', canLabel: g.i + 1 < g.qs.length ? '다음 질문' : '결과 보기' });
    },
    cmd(ctx, g, m) { if (m.t === 'next' && ctx.P().ph === 'reveal') { this.q(ctx, g); return true; } if (m.t === 'close' && g.open) { this.close(ctx, g); return true; } },
    onEv(ctx, g, id, e) { if (e.k === 'ans' && g.open && e.q === ctx.P().ask.key && (e.v === 0 || e.v === 1)) g.votes[id] = e.v; },
    bot(ctx, g, id) { if (g.open && g.votes[id] == null && Math.random() < 0.3) ctx.botEv(id, { k: 'ans', v: Math.random() < 0.6 ? 0 : 1 }); },
    end(ctx, g) { return { type: 'solo', title: '취향 적중 점수', unit: '점', rows: Sim.rankBy(ctx.active().map(id => ({ id, v: g.tot[id] || 0 })), o => o.v, true) }; },
    draw(c, S, g, ctx) {
      const P = S.pub, q = P.tq;
      sky(c, '#2a1f5c', '#3b2a1a'); for (let k = 0; k < 30; k++) { c.fillStyle = `hsl(${k * 37} 90% 65%)`; c.beginPath(); c.arc(30 + k * 53, 30 + Math.sin(k) * 10, 12, 0, 7); c.fill(); }
      if (!q) { head(c, '야시장 먹자골목 · 우리 반 공통 취향 맞추기'); return; }
      head(c, `${q.a}  vs  ${q.b}`, `질문 ${q.n} / ${q.total}`);
      [q.a, q.b].forEach((o, k) => {
        const x = k ? 860 : 80, R = P.tres, win = R && R.win.includes(k);
        rr(c, x, 220, 660, 120, 20, k ? '#3d8bff' : '#ff5a5f', '#2b2118', 6); txt(c, (k ? '● ' : '▲ ') + o, x + 330, 280, 50, '#fff');
        c.fillStyle = '#b5651d'; c.fillRect(x + 40, 340, 580, 30); c.fillStyle = '#fff1cf'; c.fillRect(x + 20, 370, 620, 300);
        c.strokeStyle = '#2b2118'; c.lineWidth = 6; c.strokeRect(x + 20, 370, 620, 300);
        if (R) { txt(c, R.n[k] + '명', x + 330, 520, 130, win ? '#e63946' : '#888'); if (win) txt(c, R.win.length === 2 ? '동점! 모두 +10' : '다수 취향! +10', x + 330, 630, 44, '#27b56a'); }
        else txt(c, '?', x + 330, 520, 160, '#c9b18a');
      });
      if (!P.tres) timer(c, 1440, 100, secs({ now: Net.now }, q.until), q.T || 12);
      dressedCrowd(c, S, 780, null);
    }
  },

  /* ═════ 04 선생님 퀴즈 ═════ */
  tquiz: {
    setup(ctx) { return { qs: ctx.pool('tq', ctx.practice ? 1 : (ctx.opts.n || 5)), i: -1, tot: {} }; },
    begin(ctx, g) { this.q(ctx, g); },
    q(ctx, g) {
      g.i++; if (g.i >= g.qs.length) return ctx.done();
      const q = g.qs[g.i]; g.ans = (q.a === 0 || q.a > 0) ? +q.a : null; g.votes = {}; g.open = false;
      ctx.setPub({ ph: g.ans == null ? 'teacher' : 'play', tqz: { q: q.q, o: q.o, n: g.i + 1, total: g.qs.length }, dist: null, ans: null, can: null });
      ctx.priv({ need: g.ans == null ? 'tans' : null, q: q.q, o: q.o });
      ctx.ask({ type: 'wait', label: '선생님이 답을 고르는 중이에요' });
      if (g.ans != null) this.open(ctx, g);
    },
    open(ctx, g) {
      const q = g.qs[g.i], T = [0, 20000, 15000, 10000][LVOF(ctx)]; g.open = true; g.until = ctx.now() + T;
      ctx.priv({ need: null, q: q.q, o: q.o, picked: true });
      ctx.ask({ type: 'choice', opts: q.o, label: '선생님의 답을 예상해요', change: true });
      ctx.setPub({ ph: 'play', until: g.until, udur: T / 1000 });
      ctx.after(T, () => this.close(ctx, g));
    },
    close(ctx, g) { if (!g.open) return; g.open = false; ctx.askClose(); ctx.setPub({ ph: 'closed', can: 'reveal', canLabel: '선생님 답 공개' }); },
    reveal(ctx, g) {
      const q = g.qs[g.i], dist = q.o.map(() => 0);
      for (const id in g.votes) dist[g.votes[id]]++;
      ctx.active().forEach(id => { const hit = g.votes[id] === g.ans; if (hit) { ctx.score(id, 10); g.tot[id] = (g.tot[id] || 0) + 10; } ctx.tell(id, g.votes[id] == null ? { k: 'msg', b: '고르지 않았어요', s: '', c: '' } : hit ? { k: 'msg', b: '선생님 마음을 읽었어요!', s: ctx.practice ? '연습판' : '+10점', c: 'green' } : { k: 'msg', b: '선생님 답은 ' + q.o[g.ans], s: '0점', c: 'red' }); });
      ctx.setPub({ ph: 'reveal', dist, ans: g.ans, can: 'next', canLabel: g.i + 1 < g.qs.length ? '다음 문제' : '결과 보기' });
    },
    cmd(ctx, g, m) {
      const P = ctx.P();
      if (m.t === 'tans' && P.ph === 'teacher' && m.v >= 0 && m.v < 4) { g.ans = m.v; this.open(ctx, g); return true; }
      if (m.t === 'close' && g.open) { this.close(ctx, g); return true; }
      if (m.t === 'reveal' && P.ph === 'closed') { this.reveal(ctx, g); return true; }
      if (m.t === 'next' && P.ph === 'reveal') { this.q(ctx, g); return true; }
    },
    onEv(ctx, g, id, e) { if (e.k === 'ans' && g.open && e.q === ctx.P().ask.key && e.v >= 0 && e.v < 4) g.votes[id] = e.v; },
    bot(ctx, g, id) { if (g.open && g.votes[id] == null && Math.random() < 0.3) ctx.botEv(id, { k: 'ans', v: (Math.random() * 4) | 0 }); },
    end(ctx, g) { return { type: 'solo', title: '선생님 마음 읽기 점수', unit: '점', rows: Sim.rankBy(ctx.active().map(id => ({ id, v: g.tot[id] || 0 })), o => o.v, true) }; },
    draw(c, S) {
      const P = S.pub, q = P.tqz, t = S.t;
      sky(c, '#3b1d6e', '#2b2118'); for (let k = 0; k < 7; k++) { c.fillStyle = `hsla(${k * 50},100%,70%,.25)`; c.beginPath(); c.moveTo(100 + k * 230, 0); c.lineTo(40 + k * 230 + Math.sin(t + k) * 80, 900); c.lineTo(200 + k * 230 + Math.sin(t + k) * 80, 900); c.fill(); }
      if (!q) { head(c, '퀴즈쇼 스튜디오 · 선생님 퀴즈'); return; }
      head(c, q.q, `문제 ${q.n} / ${q.total}`);
      drawChar(c, 800, 330, 70, 7, { hat: 'party', face: P.ph === 'reveal' ? 'laugh' : 'smile', bob: -Math.abs(Math.sin(t * 2)) * 8, name: '선생님' });
      if (P.ph === 'teacher') { rr(c, 360, 450, 880, 110, 30, '#ffd400', '#2b2118', 6); txt(c, '선생님이 몰래 답을 고르는 중…', 800, 505, 48, '#2b2118'); }
      else if (P.ph === 'play') timer(c, 1440, 100, Math.max(0, (P.until - Net.now()) / 1000), P.udur || 15);
      choiceTiles(c, q.o, 590, 270, P.dist, P.ph === 'reveal' ? P.ans : null, P.dist ? P.dist.reduce((a, b) => a + b, 0) : 0);
      if (P.ph === 'closed') txt(c, '마감! 선생님의 답은?', 800, 540, 44, '#fff', 'center', '#2b2118');
    }
  },

  /* ═════ 05 기억력 구조대 ═════ */
  memory: {
    setup(ctx) { return { R: ctx.practice ? 1 : (ctx.opts.n || 4), r: 0, tot: {} }; },
    begin(ctx, g) { this.round(ctx, g); },
    round(ctx, g) {
      if (g.r >= g.R) return ctx.done();
      g.r++; g.votes = {};
      const lv = LVOF(ctx), [cols, rows, show] = [null, [3, 3, 8000], [4, 3, 6000], [4, 4, 5000]][lv], N = cols * rows;
      const items = shuffle(STORE_ITEMS).slice(0, N), kind = lv === 3 ? (g.r % 3 ? 'where' : 'what') : g.r % 2 ? 'what' : 'where';
      const corners = [0, cols - 1, N - cols, N - 1], cell = kind === 'what' ? (lv === 3 ? (Math.random() * N) | 0 : corners[(Math.random() * 4) | 0]) : (Math.random() * N) | 0;
      const CN = { [corners[0]]: '맨 왼쪽 위', [corners[1]]: '맨 오른쪽 위', [corners[2]]: '맨 왼쪽 아래', [corners[3]]: '맨 오른쪽 아래' };
      const pos = i => { const row = (i / cols) | 0, col = i % cols; return CN[i] || `위에서 ${row + 1}번째 줄, 왼쪽에서 ${col + 1}번째 칸`; };
      g.cols = cols; g.rows = rows;
      let q, opts, ans;
      if (kind === 'what') { const wrong = shuffle(items.filter((_, i) => i !== cell)).slice(0, 3); opts = shuffle([items[cell], ...wrong]); ans = opts.indexOf(items[cell]); q = `${pos(cell)}에는 무엇이 있었나요?`; }
      else { ans = cell; q = `${items[cell][1]}(${items[cell][0]})은(는) 어디에 있었나요?`; }
      g.cur = { items, kind, cell, ans, q, opts };
      ctx.ask({ type: 'wait', label: '큰 화면의 진열대를 잘 기억해요' });
      g.showUntil = ctx.now() + show;
      ctx.setPub({ ph: 'show', mem: { items, r: g.r, R: g.R, until: g.showUntil, cols, rows, sd: show / 1000 }, memq: null, memans: null, can: null });
      ctx.after(show, () => {
        g.open = true; g.until = ctx.now() + 12000;
        ctx.ask(kind === 'what' ? { type: 'choice', opts: opts.map(o => o[0] + ' ' + o[1]), label: q, change: true } : { type: 'grid', cols, rows, label: q, change: true });
        ctx.setPub({ ph: 'play', memq: { q, until: g.until }, mem: { items: null, r: g.r, R: g.R, cols, rows } });
        ctx.after(12000, () => this.close(ctx, g));
      });
    },
    close(ctx, g) {
      if (!g.open) return; g.open = false; ctx.askClose();
      let ok = 0;
      ctx.active().forEach(id => { const hit = g.votes[id] === g.cur.ans; if (hit) { ok++; ctx.score(id, 10); g.tot[id] = (g.tot[id] || 0) + 10; } ctx.tell(id, hit ? { k: 'msg', b: '정답! 기억력 최고', s: ctx.practice ? '연습판' : '+10점', c: 'green' } : { k: 'msg', b: g.votes[id] == null ? '답하지 않았어요' : '아쉬워요', s: '큰 화면에서 정답을 확인해요', c: 'red' }); });
      ctx.setPub({ ph: 'reveal', mem: { items: g.cur.items, r: g.r, R: g.R, cols: g.cols, rows: g.rows }, memans: { cell: g.cur.kind === 'what' ? g.cur.cell : g.cur.ans, ok, of: ctx.active().length }, can: 'next', canLabel: g.r < g.R ? '다음 문제' : '결과 보기' });
    },
    cmd(ctx, g, m) { if (m.t === 'next' && ctx.P().ph === 'reveal') { this.round(ctx, g); return true; } if (m.t === 'close' && g.open) { this.close(ctx, g); return true; } },
    onEv(ctx, g, id, e) { if (e.k === 'ans' && g.open && e.q === ctx.P().ask.key) g.votes[id] = e.v; },
    bot(ctx, g, id) { if (g.open && g.votes[id] == null && Math.random() < 0.3) ctx.botEv(id, { k: 'ans', v: Math.random() < 0.6 ? g.cur.ans : (Math.random() * (g.cur.kind === 'what' ? 4 : g.cols * g.rows)) | 0 }); },
    end(ctx, g) { return { type: 'solo', title: '기억력 점수', unit: '점', rows: Sim.rankBy(ctx.active().map(id => ({ id, v: g.tot[id] || 0 })), o => o.v, true) }; },
    draw(c, S) {
      const P = S.pub, m = P.mem, t = S.t;
      sky(c, '#e8f7ff', '#d6d6d6'); c.fillStyle = '#27b56a'; c.fillRect(0, 0, 1600, 16); c.fillStyle = '#ff8a1f'; c.fillRect(0, 16, 1600, 16);
      if (P.memq) head(c, P.memq.q, `문제 ${m.r} / ${m.R}`); else head(c, m ? (m.items ? (P.ph === 'reveal' ? '정답 공개! 원래 진열대' : '잘 기억해요! 곧 셔터가 내려가요') : '') : '편의점 기억력 구조대', m ? `문제 ${m.r} / ${m.R}` : null);
      const cols = (m && m.cols) || 4, rows = (m && m.rows) || 3, cw = cols === 3 ? 300 : 270, ch = rows === 4 ? 160 : 210, x0 = 800 - cols * cw / 2, y0 = 210, sc = ch / 210;
      for (let row = 0; row < rows; row++) { c.fillStyle = '#b5651d'; c.fillRect(x0 - 20, y0 + row * ch + ch - 22, cw * cols + 40, 22); }
      for (let i = 0; i < cols * rows; i++) {
        const row = (i / cols) | 0, col = i % cols, x = x0 + col * cw, y = y0 + row * ch;
        rr(c, x + 10, y + 6, cw - 20, ch - 34, 18, '#fff', '#2b2118', 4);
        if (m && m.items) { txt(c, m.items[i][0], x + cw / 2, y + 80 * sc, 90 * sc); txt(c, m.items[i][1], x + cw / 2, y + 150 * sc, 26, '#555'); }
        else { for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#9aa3ad' : '#b9c1ca'; c.fillRect(x + 12, y + 8 + k * 26 * sc, cw - 24, 26 * sc); } }
        txt(c, String(i + 1), x + 30, y + 30, 22, '#999');
        if (P.memans && P.memans.cell === i) { c.lineWidth = 12; c.strokeStyle = '#e63946'; c.strokeRect(x + 4, y, cw - 8, ch - 22); }
      }
      if (P.ph === 'show' && m && m.until) timer(c, 1440, 100, Math.max(0, (m.until - Net.now()) / 1000), m.sd || 6);
      lvBadge(c, P.lv, 1580, 220, 24);
      if (P.ph === 'play' && P.memq) timer(c, 1440, 100, Math.max(0, (P.memq.until - Net.now()) / 1000), 12);
      if (P.memans) { rr(c, 1330, 360, 250, 130, 24, '#fff', '#2b2118', 5); txt(c, `${P.memans.of}명 중`, 1455, 400, 34, '#222'); txt(c, `${P.memans.ok}명 정답`, 1455, 450, 40, '#e63946'); }
    }
  },

  /* ═════ 07 사진 확대 탐정 ═════ */
  zoom: {
    setup(ctx) {
      const mine = ctx.photos('zoom'), defs = ART.ZOOM.map((z, k) => Object.assign({ def: k }, z));
      let list = ctx.opts.src === 'mine' && mine.length ? mine : ctx.opts.src === 'mix' ? shuffle(defs.concat(mine)) : shuffle(defs);
      list = list.slice(0, ctx.practice ? 1 : (ctx.opts.n || 3));
      return { list, i: -1, tot: {}, cv: document.createElement('canvas') };
    },
    begin(ctx, g) { this.item(ctx, g); },
    async item(ctx, g) {
      g.i++; if (g.i >= g.list.length) return ctx.done();
      const it = g.list[g.i]; g.cv.width = 1600; g.cv.height = 900; const c = g.cv.getContext('2d');
      if (it.draw) it.draw(c); else { const img = await ctx.loadImg(it.id); if (img) ART.cover(c, img); else { c.fillStyle = '#333'; c.fillRect(0, 0, 1600, 900); } }
      g.done = {}; g.stage = 0; this.stage(ctx, g);
    },
    stage(ctx, g) {
      g.stage++; g.sub = {};
      const it = g.list[g.i], pts = [30, 20, 10][g.stage - 1], lv = LVOF(ctx), T = [0, 20000, 15000, 12000][lv];
      g.open = true; g.until = ctx.now() + T;
      ctx.ask({ type: 'text', label: `단서 ${g.stage} · 맞히면 ${pts}점`, ph: '정답을 적어요', skip: Object.keys(g.done) });
      ctx.setPub({ ph: 'play', zm: { i: g.i + 1, n: g.list.length, stage: g.stage, pts, until: g.until, T: T / 1000, f: [0, 1.6, 1, 0.7][lv], right: Object.keys(g.done).length }, can: 'close', canLabel: '이 단서 마감' });
      clearTimeout(g.tm); g.tm = ctx.after(T, () => this.closeStage(ctx, g));
    },
    closeStage(ctx, g) {
      if (!g.open) return; g.open = false; ctx.askClose();
      const it = g.list[g.i], ans = [it.ans].concat(it.alts || []).map(Sim2.norm), pts = [30, 20, 10][g.stage - 1];
      for (const id in g.sub) {
        if (g.done[id]) continue;
        if (ans.includes(Sim2.norm(g.sub[id]))) { g.done[id] = g.stage; ctx.score(id, pts); g.tot[id] = (g.tot[id] || 0) + pts; ctx.tell(id, { k: 'msg', b: '정답! 명탐정', s: ctx.practice ? '연습판' : `+${pts}점`, c: 'green' }); }
        else ctx.tell(id, { k: 'msg', b: '아니에요', s: g.stage < 3 ? '다음 단서에서 다시 도전!' : '', c: 'red' });
      }
      if (g.stage < 3) { ctx.setPub({ zm: Object.assign({}, ctx.P().zm, { right: Object.keys(g.done).length }) }); ctx.after(1500, () => this.stage(ctx, g)); }
      else { ctx.setPub({ ph: 'reveal', zm: Object.assign({}, ctx.P().zm, { ans: it.ans, right: Object.keys(g.done).length }), can: 'next', canLabel: g.i + 1 < g.list.length ? '다음 사진' : '결과 보기' }); }
    },
    cmd(ctx, g, m) { if (m.t === 'close' && g.open) { this.closeStage(ctx, g); return true; } if (m.t === 'next' && ctx.P().ph === 'reveal') { this.item(ctx, g); return true; } },
    onEv(ctx, g, id, e) { if (e.k === 'ans' && g.open && e.q === ctx.P().ask.key && g.sub[id] == null && !g.done[id]) { g.sub[id] = String(e.v || '').slice(0, 30); ctx.tell(id, { k: 'msg', b: '제출했어요', s: '단서가 끝나면 채점해요', c: '' }); } },
    bot(ctx, g, id) { if (g.open && g.sub[id] == null && !g.done[id] && Math.random() < 0.15) ctx.botEv(id, { k: 'ans', v: Math.random() < 0.3 * g.stage ? g.list[g.i].ans : '모르겠다' }); },
    end(ctx, g) { return { type: 'solo', title: '명탐정 점수', unit: '점', rows: Sim.rankBy(ctx.active().map(id => ({ id, v: g.tot[id] || 0 })), o => o.v, true) }; },
    draw(c, S, g) {
      const P = S.pub, z = P.zm;
      c.fillStyle = '#4b3621'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#5d4329'; for (let x = 0; x < 1600; x += 80) c.fillRect(x, 0, 40, 900);
      if (!z || !g) { head(c, '탐정 사무소 · 사진 확대 탐정'); return; }
      const it = g.list[g.i]; if (!it) return; const full = P.ph === 'reveal';
      const f = z.f || 1, wf = full ? 1 : Math.min(1, it.w[z.stage - 1] * (z.stage === 1 ? f : z.stage === 2 ? Math.sqrt(f) : 1)), vw = 1600 * wf, vh = vw * 9 / 16;
      let sx = it.cx - vw / 2, sy = it.cy - vh / 2; sx = Math.max(0, Math.min(1600 - vw, sx)); sy = Math.max(0, Math.min(900 - vh, sy));
      const bx = 230, by = 190, bw = 1140, bh = 641;
      rr(c, bx - 18, by - 18, bw + 36, bh + 36, 30, '#2b2118');
      c.save(); c.beginPath(); c.roundRect(bx, by, bw, bh, 20); c.clip(); c.drawImage(g.cv, sx, sy, vw, vh, bx, by, bw, bh); c.restore();
      rr(c, 60, 24, 1220, 140, 28, '#fff', '#2b2118', 6);
      if (full) { txt(c, `정답은 「${z.ans}」`, 670, 94, 66, '#e63946'); }
      else { txt(c, `단서 ${z.stage} / 3 · 지금 맞히면 ${z.pts}점`, 670, 70, 44, '#222'); txt(c, `사진 ${z.i} / ${z.n} · 무엇일까요? 폰에 적어요`, 670, 128, 30, '#888'); }
      if (!full) timer(c, 1440, 100, Math.max(0, (z.until - Net.now()) / 1000), z.T || 15);
      txt(c, `지금까지 ${z.right}명 정답`, 1490, 860, 30, '#fff', 'right', '#2b2118');
      drawChar(c, 120, 780, 60, 23, { hat: 'explorer', face: full ? 'laugh' : 'smile' }); txt(c, '🔍', 190, 720, 70);
    }
  },

  /* ═════ 08 마음속으로 초 세기 — 깜깜한 동굴 ═════
     "준비!!!"(4초) → "시작!!!" 신호부터 마음속으로 센다. 1판 10초 → 2판 13초 → 3판 15초.
     화면에는 시간을 짐작할 수 있는 움직임(캐릭터 줄, 진행 막대)을 두지 않는다. */
  ten: {
    SECS: [10, 13, 15],
    READY: 4000,
    setup(ctx) { return { R: ctx.practice ? 1 : (ctx.opts.n || 3), r: 0, best: {}, recs: {} }; },
    begin(ctx, g) { this.round(ctx, g); },
    round(ctx, g) {
      if (g.r >= g.R) return ctx.done();
      g.r++; g.press = {}; g.t0 = ctx.now() + this.READY; g.open = true;
      g.sec = this.SECS[Math.min(g.r, this.SECS.length) - 1];
      const lv = LVOF(ctx), fl = [];
      if (lv === 3) for (let k = 0; k < 7; k++) { const at = 1300 + Math.random() * (g.sec * 1000 + 500); fl.push(Math.round(at)); ctx.after(this.READY + at, () => { if (g.open) ctx.beep(300 + Math.random() * 700, 0.09, 'triangle'); }); }
      ctx.ask({ type: 'tap', theme: 'ten', label: `🔦 손전등 스위치 · ${g.sec}초`, hint: `"시작!!!"이 나오면 마음속으로 ${g.sec}초를 세고 한 번 탭!`, once: true });
      ctx.setPub({ ph: 'play', ten: { t0: g.t0, r: g.r, R: g.R, sec: g.sec, rows: null, lv, fl }, can: 'close', canLabel: '지금 마감' });
      ctx.after(this.READY, () => ctx.beep(880, 0.35));
      clearTimeout(g.tm); g.tm = ctx.after(this.READY + (g.sec + 10) * 1000, () => this.close(ctx, g));
    },
    close(ctx, g) {
      if (!g.open) return; g.open = false; clearTimeout(g.tm);
      const rows = Sim2.tenGrade(g.t0, g.press, g.sec);
      rows.forEach(r => {
        const prev = g.best[r.id]; if (!prev || r.diff < prev.diff) g.best[r.id] = Object.assign({ sec: g.sec }, r);
        (g.recs[r.id] = g.recs[r.id] || []).push(Sim2.fmt2(r.rec));
        ctx.tell(r.id, { k: 'msg', b: `${Sim2.fmt2(r.rec)}초`, s: `목표 ${g.sec}초와 ${Sim2.fmt2(r.diff)}초 차이 · ${r.rank}등`, c: r.rank === 1 ? 'green' : '' });
      });
      Object.keys(g.press).forEach(id => { if (!rows.find(r => r.id === id)) ctx.tell(id, { k: 'msg', b: '너무 빨랐어요!', s: '"시작!!!" 전에 눌렀어요', c: 'warn' }); });
      ctx.setPub({ ph: 'reveal', ten: { t0: g.t0, r: g.r, R: g.R, sec: g.sec, rows: rows.slice(0, 12).map(r => ({ id: r.id, rec: r.rec, diff: r.diff, rank: r.rank })), n: rows.length }, can: 'next', canLabel: g.r < g.R ? `다음 판 (${this.SECS[Math.min(g.r + 1, this.SECS.length) - 1]}초)` : '결과 보기' });
    },
    cmd(ctx, g, m) { if (m.t === 'close' && g.open) { this.close(ctx, g); return true; } if (m.t === 'next' && ctx.P().ph === 'reveal') { this.round(ctx, g); return true; } },
    onEv(ctx, g, id, e) {
      if (e.k !== 'tap' || !g.open || g.press[id] != null) return;
      g.press[id] = e.ct;
      ctx.tell(id, e.ct < g.t0 ? { k: 'msg', b: '너무 빨랐어요!', s: '이번 판 기록은 없어요', c: 'warn' } : { k: 'msg', b: '찰칵! 기록했어요', s: '결과는 모두 누른 뒤에', c: '' });
      if (ctx.active().every(i => g.press[i] != null) && ctx.now() > g.t0 + 3000) ctx.after(800, () => this.close(ctx, g));
    },
    bot(ctx, g, id) { if (g.open && g.press[id] == null && ctx.now() > g.t0 + (g.sec - 2) * 1000 && Math.random() < 0.12) ctx.botEv(id, { k: 'tap' }); },
    end(ctx, g) {
      const rows = Sim.rankBy(Object.values(g.best).map(r => ({ id: r.id, v: `${Sim2.fmt2(r.rec)}초 (목표 ${r.sec}초)`, d: r.diff })), o => o.d, false);
      return { type: 'solo', title: '목표 초에 가장 가까운 기록', unit: '', rows };
    },
    draw(c, S) {
      const P = S.pub, tn = P.ten, now = Net.now();
      c.fillStyle = '#0d0b14'; c.fillRect(0, 0, 1600, 900);
      c.fillStyle = '#1e1a2b'; for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(k * 200, 0); c.lineTo(k * 200 + 100, 140 + (k % 3) * 40); c.lineTo(k * 200 + 200, 0); c.fill(); }
      if (!tn) { head(c, '깜깜한 동굴 · 마음속으로 초 세기'); txt(c, '1판 10초 → 2판 13초 → 3판 15초', 800, 520, 56, '#ffd400'); return; }
      const sec = tn.sec || 10, badge = () => { rr(c, 560, 40, 480, 96, 30, '#ffd400', '#2b2118', 6); txt(c, `${tn.r}판 / ${tn.R}판 · 목표 ${sec}초`, 800, 89, 46, '#2b2118'); };
      if (P.ph === 'play') {
        if (now < tn.t0) {
          badge();
          txt(c, '준비!!!', 800, 380, 190, '#fff');
          txt(c, `"시작!!!"이 나오면 마음속으로 ${sec}초를 세요`, 800, 570, 54, '#ffd400');
          txt(c, `${sec}초가 됐다고 생각하면 폰을 한 번만 탭!`, 800, 650, 42, '#aaa');
        } else {
          const el = now - tn.t0, k = Math.max(0, 1 - el / 1500);
          c.fillStyle = `rgba(255,230,120,${k})`; c.fillRect(0, 0, 1600, 900);
          badge();
          if (tn.lv === 1 && el < 3000) txt(c, String(Math.floor(el / 1000) + 1), 800, 430, 260, '#ffd400', 'center', '#2b2118');
          else txt(c, '시작!!!', 800, 430, 220, k > 0.2 ? '#2b2118' : '#3a3550');
          txt(c, tn.lv === 1 && el < 3000 ? `숫자가 사라져도 ${sec}까지 계속 세요!` : `마음속으로 ${sec}초…`, 800, 650, 54, '#6a6488');
          (tn.fl || []).forEach(f => { const d = el - f; if (d > 0 && d < 220) { c.fillStyle = `rgba(${[255, 120, 200][f % 3]},${[120, 200, 255][f % 3]},255,${0.45 * (1 - d / 220)})`; c.fillRect(0, 0, 1600, 900); txt(c, ['삐!', '뿅!', '딩!', '똑!'][f % 4], 300 + (f * 37) % 1000, 200 + (f * 13) % 500, 90, '#fff', 'center', '#2b2118'); } });
        }
      } else {
        rr(c, 200, 60, 1200, 790, 30, '#fff', '#2b2118', 6);
        txt(c, `${tn.r}판 결과 · 목표 ${sec}초 · ${tn.n}명 기록`, 800, 120, 46, '#222');
        (tn.rows || []).forEach((r, k) => { const x = k < 6 ? 260 : 830, y = 210 + (k % 6) * 105, pl = S.players[r.id]; if (!pl) return; drawChar(c, x + 30, y, 32, pl.c, { face: r.rank === 1 ? 'laugh' : 'smile', hat: 'explorer' }); txt(c, `${r.rank}등 ${nameOf(pl)}`, x + 80, y - 16, 32, '#222', 'left'); txt(c, `${Sim2.fmt2(r.rec)}초 (차이 ${Sim2.fmt2(r.diff)})`, x + 80, y + 22, 28, r.rank === 1 ? '#e63946' : '#666', 'left'); });
      }
    }
  },

  /* ═════ 12 답이 겹치면 0점 ═════ */
  solo: {
    setup(ctx) { return { qs: ctx.pool('solo', ctx.practice ? 1 : (ctx.opts.n || 10)), i: -1, tot: {} }; },
    begin(ctx, g) { this.q(ctx, g); },
    q(ctx, g) {
      g.i++; if (g.i >= g.qs.length) return ctx.done();
      const T = [0, 30000, 25000, 15000][LVOF(ctx)]; g.ans = {}; g.open = true; g.until = ctx.now() + T; g.S = null;
      ctx.ask({ type: 'text', label: '나만 쓸 것 같은 답 하나', ph: '답을 적어요', change: true });
      ctx.setPub({ ph: 'play', sq: { q: g.qs[g.i].q, n: g.i + 1, total: g.qs.length, until: g.until, cnt: 0, T: T / 1000 }, sres: null, can: 'close', canLabel: '지금 마감' });
      clearTimeout(g.tm); g.tm = ctx.after(T, () => this.close(ctx, g));
    },
    close(ctx, g) {
      if (!g.open) return; g.open = false; clearTimeout(g.tm); ctx.askClose();
      g.S = new Sim2.Solo(g.ans); this.priv(ctx, g);
      ctx.setPub({ ph: 'review', can: 'confirm', canLabel: '점수 확정하고 공개' });
    },
    priv(ctx, g) { ctx.priv({ review: g.S.list().map(gr => ({ k: gr.k, label: gr.label, n: gr.ids.length, out: gr.out, hide: gr.hide })) }); },
    confirm(ctx, g) {
      const plus = g.S.score(), L = g.S.list();
      plus.forEach(id => { ctx.score(id, 10); g.tot[id] = (g.tot[id] || 0) + 10; });
      L.forEach(gr => gr.ids.forEach(id => ctx.tell(id, gr.out ? { k: 'msg', b: '주제와 맞지 않아요', s: '0점', c: 'red' } : gr.ids.length === 1 ? { k: 'msg', b: '나만 쓴 답! 살았다…!', s: ctx.practice ? '연습판' : '+10점', c: 'green' } : { k: 'msg', b: `${gr.ids.length}명이 겹쳤어요`, s: '0점', c: 'red' })));
      ctx.active().forEach(id => { if (g.ans[id] == null) ctx.tell(id, { k: 'msg', b: '답을 안 냈어요', s: '0점', c: '' }); });
      ctx.priv({});
      ctx.setPub({ ph: 'reveal', sres: L.slice(0, 24).map(gr => ({ l: gr.hide ? '(가려진 답)' : gr.label, n: gr.ids.length, out: gr.out })), can: 'next', canLabel: g.i + 1 < g.qs.length ? '다음 주제' : '결과 보기' });
    },
    cmd(ctx, g, m) {
      const P = ctx.P();
      if (m.t === 'close' && g.open) { this.close(ctx, g); return true; }
      if (P.ph === 'review' && g.S) {
        if (m.t === 'confirm') { this.confirm(ctx, g); return true; }
        if (m.t === 'smerge') { g.S.merge(m.from, m.into); this.priv(ctx, g); return true; }
        if (m.t === 'sout') { g.S.toggle(m.k, 'out'); this.priv(ctx, g); return true; }
        if (m.t === 'shide') { g.S.toggle(m.k, 'hide'); this.priv(ctx, g); return true; }
      }
      if (m.t === 'next' && P.ph === 'reveal') { this.q(ctx, g); return true; }
    },
    onEv(ctx, g, id, e) { if (e.k === 'ans' && g.open && e.q === ctx.P().ask.key) { const v = String(e.v || '').trim().slice(0, 20); if (!v) return; const first = g.ans[id] == null; g.ans[id] = v; if (first) ctx.setPub({ sq: Object.assign({}, ctx.P().sq, { cnt: Object.keys(g.ans).length }) }); ctx.tell(id, { k: 'msg', b: '병에 넣어 띄웠어요', s: '마감 전에는 바꿀 수 있어요', c: '' }); } },
    bot(ctx, g, id) { if (g.open && g.ans[id] == null && Math.random() < 0.15) ctx.botEv(id, { k: 'ans', v: ['칠판', '창문', '칠 판', '사물함', '지우개', '책', '공책', '시계', '창문 ', '모니터'][(Math.random() * 10) | 0] }); },
    end(ctx, g) { return { type: 'solo', title: '나만의 답 점수', unit: '점', rows: Sim.rankBy(ctx.active().map(id => ({ id, v: g.tot[id] || 0 })), o => o.v, true) }; },
    draw(c, S) {
      const P = S.pub, q = P.sq, t = S.t;
      sky(c, '#7fd8ff'); c.fillStyle = '#2aa7d8'; c.fillRect(0, 560, 1600, 340); c.fillStyle = '#f6e3a1'; c.beginPath(); c.ellipse(800, 640, 560, 120, 0, 0, 7); c.fill();
      c.fillStyle = '#3aa655'; for (const x of [480, 1120]) { c.fillStyle = '#8a5a2b'; c.fillRect(x - 10, 420, 20, 200); c.fillStyle = '#3aa655'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + Math.cos(k * 1.25) * 60, 420 + Math.sin(k * 1.25) * 24, 70, 18, k * 1.25, 0, 7); c.fill(); } }
      if (!q) { head(c, '무인도 · 답이 겹치면 0점'); return; }
      head(c, q.q, `주제 ${q.n} / ${q.total}`);
      if (P.ph === 'play') { timer(c, 1440, 100, Math.max(0, (q.until - Net.now()) / 1000), q.T || 25); txt(c, `유리병 ${q.cnt}개 도착`, 800, 300, 56, '#fff', 'center', '#2b2118'); for (let k = 0; k < Math.min(q.cnt, 30); k++) txt(c, '🍾', 200 + (k * 97) % 1200, 420 + Math.sin(t * 2 + k) * 10 + (k % 3) * 40, 44); }
      else if (P.ph === 'review') { rr(c, 360, 300, 880, 140, 30, '#ffd400', '#2b2118', 6); txt(c, '선생님이 답을 확인하고 있어요', 800, 370, 50, '#2b2118'); }
      else if (P.sres) {
        P.sres.forEach((r, k) => { const col = k % 4, row = (k / 4) | 0, x = 100 + col * 360, y = 220 + row * 105; rr(c, x, y, 340, 90, 24, r.out ? '#ccc' : r.n === 1 ? '#ffd400' : '#fff', '#2b2118', 4); txt(c, r.l, x + 20, y + 45, 32, '#222', 'left'); txt(c, r.n + '명' + (r.out ? ' 제외' : r.n === 1 ? ' +10' : ''), x + 320, y + 45, 28, r.n === 1 && !r.out ? '#e63946' : '#888', 'right'); });
      }
    }
  },

  /* ═════ 15 통통! 행운 낙하 ═════ */
  marble: {
    setup(ctx) {
      const ids = ctx.active(), seed = 1 + ((Math.random() * 1e9) | 0);
      const sim = new Sim2.Marble(ids, { seed, dur: ctx.practice ? 60 : 120, lv: LVOF(ctx), spd: 3 });
      ctx.ask({ type: 'info', label: '내 구슬을 응원해요!' });
      const lottery = ctx.opts.mode === 'lottery', K = Math.max(1, Math.min(ids.length, ctx.opts.k || 3));
      ctx.setPub({ mb: { lottery, K, ord: [] } });
      return { sim, lottery, K, cam: 300 };
    },
    begin(ctx, g) { g.sim.start(); ctx.setPub({ ph: 'play' }); },
    tick(ctx, g, dt) {
      if (ctx.P().ph !== 'play') return;
      g.sim.step(dt);
      g.sim.takeEvents().forEach(e => { const win = g.lottery && e.rank <= g.K; ctx.tell(e.id, { k: 'msg', b: win ? `당첨! ${e.rank}번째 골인` : `${e.rank}번째로 골인!`, s: g.lottery ? (win ? '행운의 주인공' : '아쉽지만 다음 기회에') : '', c: (g.lottery ? win : e.rank <= 3) ? 'green' : '' }); ctx.setPub({ mb: { lottery: g.lottery, K: g.K, ord: g.sim.order.slice(0, 10) } }); ctx.beep(e.rank <= 3 ? 990 : 660, 0.06); });
      if (g.sim.ph === 'done' || (g.lottery && g.sim.order.length >= g.K)) ctx.done();
    },
    end(ctx, g) {
      if (g.lottery) return { type: 'lottery', title: `행운 추첨 당첨자 ${g.K}명`, ids: g.sim.order.slice(0, g.K) };
      const rk = g.sim.ranking();
      rk.forEach(r => { if (!r.done) ctx.tell(r.id, { k: 'msg', b: `${r.rank}등`, s: '결승선 가까이까지 왔어요', c: '' }); });
      return { type: 'solo', title: '구슬 경주 도착 순서', unit: '', rows: rk.map(r => ({ id: r.id, rank: r.rank, v: r.done ? '골인' : '도착 못 함' })) };
    },
    draw(c, S, g) {
      if (!g) return;
      const sim = g.sim, C = sim.course, CW = Sim2.Marble.CW, FIN = sim.FIN, CH = sim.CH, t = S.t, players = S.players;
      c.fillStyle = '#eaf6ff'; c.fillRect(0, 0, 1600, 900);
      // 카메라: 아직 달리는 구슬 중 앞쪽 무리를 따라간다
      const run = sim.b.filter(b => !b.fin).sort((a, b) => b.y - a.y), tgt = run.length ? run[Math.min(2, run.length - 1)].y - 380 : FIN - 600;
      g.cam += (Math.max(0, Math.min(FIN - 700, tgt)) - g.cam) * 0.22;
      const sc = 0.9, ox = 330, oy = -g.cam * sc;
      const drawCourse = (s, ox, oy, minimal) => {
        c.save(); c.translate(ox, oy); c.scale(s, s);
        c.fillStyle = '#ffffff'; c.fillRect(0, 0, CW, CH); c.fillStyle = '#d7ecff'; for (let y = 0; y < CH; y += 400) c.fillRect(0, y, CW, 200);
        c.lineCap = 'round'; c.strokeStyle = '#8a5a2b'; c.lineWidth = 14; C.segs.forEach(sg => { c.beginPath(); c.moveTo(sg.x1, sg.y1); c.lineTo(sg.x2, sg.y2); c.stroke(); });
        C.bumps.forEach(o => { c.fillStyle = o.k === 'bumper' ? '#ff4d6d' : '#5e60ce'; c.beginPath(); c.arc(o.x, o.y, o.r, 0, 7); c.fill(); if (!minimal && o.k === 'bumper') { c.fillStyle = '#fff'; c.beginPath(); c.arc(o.x, o.y, o.r * 0.5, 0, 7); c.fill(); } });
        C.mills.forEach(m => { c.strokeStyle = '#2a9d8f'; c.lineWidth = 16; sim.millSegs(m).forEach(sg => { c.beginPath(); c.moveTo(sg.x1, sg.y1); c.lineTo(sg.x2, sg.y2); c.stroke(); }); c.fillStyle = '#264653'; c.beginPath(); c.arc(m.x, m.y, 14, 0, 7); c.fill(); });
        for (let x = 0; x < CW; x += 40) { c.fillStyle = (x / 40) % 2 ? '#222' : '#fff'; c.fillRect(x, FIN, 40, 30); }
        c.lineCap = 'butt'; c.restore();
      };
      // 왼쪽 전체 지도
      const ms = 860 / CH; drawCourse(ms, 40, 20, true);
      sim.b.forEach(b => { const pl = players[b.id]; c.fillStyle = pl ? `hsl(${(pl.c * 47) % 360} 85% 55%)` : '#999'; c.beginPath(); c.arc(40 + b.x * ms, 20 + Math.min(b.y, FIN) * ms, 3, 0, 7); c.fill(); });
      c.strokeStyle = '#e63946'; c.lineWidth = 3; c.strokeRect(40, 20 + g.cam * ms, CW * ms, 900 / sc * ms);
      // 가운데 큰 화면
      c.save(); c.beginPath(); c.rect(ox, 0, CW * sc, 900); c.clip();
      drawCourse(sc, ox, oy, false);
      sim.b.forEach(b => { if (b.fin) return; const pl = players[b.id], x = ox + b.x * sc, y = oy + b.y * sc; if (y < -40 || y > 940) return; const hue = pl ? (pl.c * 47) % 360 : 0; c.fillStyle = `hsl(${hue} 85% 60%)`; c.beginPath(); c.arc(x, y, Sim2.Marble.BR * sc, 0, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = `hsl(${hue} 55% 30%)`; c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x - 4, y - 4, 4, 0, 7); c.fill(); if (pl) txt(c, nameOf(pl), x, y - 22, 16, '#222', 'center', '#fff'); });
      c.restore(); c.strokeStyle = '#2b2118'; c.lineWidth = 6; c.strokeRect(ox, 0, CW * sc, 900);
      // 오른쪽 도착 순서
      const P = S.pub, mb = P.mb || {};
      rr(c, 1250, 20, 330, 860, 24, '#fff', '#2b2118', 5);
      txt(c, mb.lottery ? `행운 추첨 · ${mb.K}명` : '도착 순서', 1415, 60, 32, '#e63946');
      (mb.ord || []).forEach((id, k) => { const pl = players[id]; if (!pl) return; const y = 120 + k * 72; drawChar(c, 1300, y, 24, pl.c, { face: 'laugh' }); txt(c, `${k + 1}. ${nameOf(pl)}`, 1340, y, 30, mb.lottery && k < mb.K ? '#e63946' : '#222', 'left'); });
      if (P.ph === 'play') txt(c, Math.ceil(Math.max(0, sim.left)) + '초', 1415, 840, 34, '#888');
    }
  },

  /* ═════ 16 틀린 그림 찾기 ═════ */
  diff: {
    setup(ctx) {
      const mine = ctx.photos('diff'), scenes = shuffle(Object.keys(ART.SCENES)).map(k => ({ scene: k }));
      let list = ctx.opts.src === 'mine' && mine.length ? mine : ctx.opts.src === 'mix' ? shuffle(scenes.concat(mine)) : scenes;
      list = list.slice(0, ctx.practice ? 1 : (ctx.opts.n || 3));
      return { list, i: -1, fixedBy: {}, total: 0, found: 0, a: document.createElement('canvas'), b: document.createElement('canvas') };
    },
    begin(ctx, g) { this.round(ctx, g); },
    async round(ctx, g) {
      g.i++; if (g.i >= g.list.length) return ctx.done();
      const it = g.list[g.i]; [g.a, g.b].forEach(cv => { cv.width = 1600; cv.height = 900; });
      const A = g.a.getContext('2d'), B = g.b.getContext('2d');
      const lv = LVOF(ctx); g.lv = lv;
      if (it.scene) { const d = ART.makeDiffs(it.scene, ctx.practice ? 3 : (ctx.opts.spots || [0, 3, 5, 7][lv]), (Math.random() * 1e9) | 0, lv); ART.renderScene(A, it.scene, d.objs, false); ART.renderScene(B, it.scene, d.objs, true); g.spots = d.spots; g.title = ART.SCENES[it.scene].name; }
      else { const img = await ctx.loadImg(it.id); if (img) ART.cover(A, img); B.drawImage(g.a, 0, 0); ART.mutatePhoto(B, it.spots || []); g.spots = (it.spots || []).map(s => ({ x: s.x, y: s.y, r: s.r })); g.title = it.title || '사진'; }
      g.fixed = g.spots.map(() => null); g.miss = {}; g.lock = {}; g.cand = {}; g.total += g.spots.length;
      const big = document.createElement('canvas'); big.width = 2000; big.height = 1125; big.getContext('2d').drawImage(g.b, 0, 0, 2000, 1125);
      const k = key(); await ctx.setImg({ k, url: big.toDataURL('image/jpeg', 0.78) });
      g.until = ctx.now() + (ctx.opts.dur || 120) * 1000; g.open = true;
      ctx.ask({ type: 'diff', img: k, label: '틀린 곳을 찾아 터치!' });
      ctx.setPub({ ph: 'play', df: { k, title: g.title, i: g.i + 1, n: g.list.length, total: g.spots.length, fixed: [], until: g.until, last: null, rev: null }, can: 'close', canLabel: '이 그림 마치기' });
      clearTimeout(g.tm); g.tm = ctx.after((ctx.opts.dur || 120) * 1000, () => this.close(ctx, g));
    },
    patch(g, s) { const pad = s.r + 6, cv = document.createElement('canvas'); cv.width = cv.height = Math.ceil(pad * 2); cv.getContext('2d').drawImage(g.a, s.x - pad, s.y - pad, pad * 2, pad * 2, 0, 0, pad * 2, pad * 2); return cv.toDataURL('image/jpeg', 0.85); },
    award(ctx, g, i) {
      const c = g.cand[i]; delete g.cand[i]; if (!c || !c.length || g.fixed[i]) return;
      c.sort((a, b) => a.at - b.at || a.n - b.n); const w = c[0].id, s = g.spots[i];
      g.fixed[i] = w; g.fixedBy[w] = (g.fixedBy[w] || 0) + 1; g.found++; ctx.score(w, 10); ctx.stat(w, 'fix');
      ctx.tell(w, { k: 'diff', r: 'hit', x: c[0].x, y: c[0].y, b: '찾았어요! 복원 완료', s: ctx.practice ? '연습판' : '+10점', c: 'green' });
      c.slice(1).forEach(o => { if (o.id !== w) ctx.tell(o.id, { k: 'diff', r: 'already', x: o.x, y: o.y, b: '먼저 고쳤어요!', s: ctx.name(w) + '이(가) 먼저', c: 'warn' }); });
      const df = ctx.P().df; df.fixed = df.fixed.concat([{ i, x: s.x, y: s.y, r: s.r, by: ctx.name(w), p: this.patch(g, s) }]); df.last = ctx.name(w);
      ctx.setPub({ df }); ctx.beep(990, 0.1); FX.stars(810 + s.x * 750 / 1600, 230 + s.y * 422 / 900, 8); FX.pop(810 + s.x * 750 / 1600, 250 + s.y * 422 / 900, ctx.name(w), '#e63946', 30);
      if (g.fixed.every(Boolean)) ctx.after(1200, () => this.close(ctx, g));
    },
    close(ctx, g) {
      if (!g.open) return; g.open = false; clearTimeout(g.tm); ctx.askClose();
      const df = ctx.P().df; df.rev = g.spots.map((s, i) => (g.fixed[i] ? null : { x: s.x, y: s.y, r: s.r })).filter(Boolean);
      df.cls = `우리 반이 ${g.spots.length}곳 중 ${g.fixed.filter(Boolean).length}곳 복원`;
      ctx.setPub({ ph: 'reveal', df, can: 'next', canLabel: g.i + 1 < g.list.length ? '다음 그림' : '결과 보기' });
    },
    cmd(ctx, g, m) { if (m.t === 'close' && g.open) { this.close(ctx, g); return true; } if (m.t === 'next' && ctx.P().ph === 'reveal') { this.round(ctx, g); return true; } },
    onEv(ctx, g, id, e) {
      if (e.k !== 'tap' || !g.open || e.q !== ctx.P().ask.key) return;
      const now = ctx.now(), x = +e.x * 1600, y = +e.y * 900;
      if (g.lock[id] > now) return ctx.tell(id, { k: 'diff', r: 'lock', until: g.lock[id] });
      const i = Sim2.diffHit(g.spots, x, y, 12);
      if (i < 0) {
        const L = Sim2.spamLock((g.miss[id] || []).concat([now]), now, g.lv === 1 ? 4 : 3, 5000), lk = g.lv === 1 ? 10 : 20; g.miss[id] = L.recent;
        if (L.lock) { g.lock[id] = now + lk * 1000; g.miss[id] = []; return ctx.tell(id, { k: 'diff', r: 'lock', until: g.lock[id], x, y, b: lk + '초 잠금!', s: '아무 데나 막 누르면 잠겨요', c: 'red' }); }
        return ctx.tell(id, { k: 'diff', r: 'miss', x, y, b: '여기는 아니에요', s: '', c: 'red' });
      }
      if (g.fixed[i]) return ctx.tell(id, { k: 'diff', r: 'already', x, y, b: '먼저 고쳤어요!', s: '', c: 'warn' });
      if (!g.cand[i]) { g.cand[i] = []; ctx.after(250, () => this.award(ctx, g, i)); }
      g.cand[i].push({ id, at: e.at, n: e.n, x, y });
    },
    bot(ctx, g, id) { if (g.open && Math.random() < 0.04) { const s = g.spots[(Math.random() * g.spots.length) | 0], good = Math.random() < 0.3; ctx.botEv(id, { k: 'tap', x: good ? s.x / 1600 : Math.random(), y: good ? s.y / 900 : Math.random() }); } },
    end(ctx, g) { return { type: 'solo', title: '복원한 곳', unit: '곳', rows: Sim.rankBy(ctx.active().map(id => ({ id, v: g.fixedBy[id] || 0 })), o => o.v, true), cls: `우리 반이 모두 ${g.total}곳 중 ${g.found}곳 복원` }; },
    draw(c, S, g) {
      const P = S.pub, df = P.df, t = S.t;
      c.fillStyle = '#f3e9dc'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#c9a77c'; c.fillRect(0, 800, 1600, 100);
      if (!df || !g) { head(c, '미술관 · 틀린 그림 찾기'); return; }
      rr(c, 40, 20, 1520, 150, 28, '#fff', '#2b2118', 6);
      txt(c, `${df.title} · 남은 틀린 곳 ${df.total - df.fixed.length}개`, 80, 70, 46, '#222', 'left');
      txt(c, df.last ? `방금 ${df.last}이(가) 복원!` : '폰에서 확대해서 틀린 곳을 터치!', 80, 130, 34, df.last ? '#e63946' : '#888', 'left');
      if (P.ph === 'play') timer(c, 1440, 96, Math.max(0, (df.until - Net.now()) / 1000), 120);
      const fw = 750, fh = 422, y = 230;
      [[g.a, 40, '원본'], [g.b, 810, '틀린 그림']].forEach(([cv, x, label], k) => {
        rr(c, x - 14, y - 14, fw + 28, fh + 28, 10, '#b8860b', '#5a3e00', 6); c.drawImage(cv, x, y, fw, fh);
        txt(c, label, x + fw / 2, y + fh + 50, 34, '#2b2118');
        if (k === 1) {
          const s = fw / 1600;
          (S.patch = S.patch || {});
          df.fixed.forEach(f => {
            const im = S.patch[f.p.length + ':' + f.i] || (S.patch[f.p.length + ':' + f.i] = Object.assign(new Image(), { src: f.p }));
            const pad = f.r + 6; if (im.complete) c.drawImage(im, x + (f.x - pad) * s, y + (f.y - pad) * s, pad * 2 * s, pad * 2 * s);
            c.strokeStyle = '#e63946'; c.lineWidth = 6; c.beginPath(); c.arc(x + f.x * s, y + f.y * s, f.r * s + 4, 0, 7); c.stroke();
          });
          (df.rev || []).forEach(f => { c.strokeStyle = '#ffd400'; c.lineWidth = 6 + Math.sin(t * 8) * 3; c.beginPath(); c.arc(x + f.x * s, y + f.y * s, f.r * s + 6, 0, 7); c.stroke(); });
        }
      });
      if (df.cls) { rr(c, 400, 760, 800, 80, 24, '#ffd400', '#2b2118', 5); txt(c, df.cls, 800, 800, 40, '#2b2118'); }
    }
  }
};

/* 여행지 목록에 연결하고, 첫 안내 화면의 규칙을 붙인다 */
Object.keys(GAMEDEF).forEach(k => { GAMES[k].ready = true; if (GAMEDEF[k].team) GAMES[k].team = true; });
Object.assign(RULES, {
  mole: ['두더지는 큰 화면에만 나와요', '잘 보고 폰을 탭해서 뿅망치!', '서버에 먼저 도착한 한 명만 잡아요', '아무 때나 막 누르면 잠깐 쉬어야 해요'],
  beat: ['바늘이 노란 구간을 지나가요', '구간 안이라고 생각할 때 폰을 한 번만 탭', '빠른 사람이 아니라 구간 안에 누른 사람이 성공', '성공한 인원이 우리 반 기록이 돼요'],
  taste: ['두 가게 중 하나를 골라요', '마감 전에는 몇 명이 골랐는지 몰라요', '더 많이 고른 쪽 모두 +10점', '동점이면 투표한 사람 모두 +10점'],
  tquiz: ['선생님이 먼저 몰래 답을 골라요', '선생님의 답을 예상해 폰에서 골라요', '맞히면 +10점', '마감 뒤 모두의 선택과 선생님 답 공개'],
  memory: ['진열대 물건을 잠깐 보여 줘요', '셔터가 내려가면 폰에서 답해요', '빨리가 아니라 정확하게!', '정답이면 +10점'],
  zoom: ['사진의 아주 작은 부분부터 보여 줘요', '폰에 답을 적어요 (단서마다 한 번)', '첫 단서 30점, 두 번째 20점, 세 번째 10점', '틀려도 다음 단서에서 다시 도전'],
  ten: ['"준비!!!" 다음에 "시작!!!"이 나오면 세기 시작', '마음속으로 정해진 초를 세고 폰을 한 번 탭', '1판 10초 → 2판 13초 → 3판 15초', '정해진 초에 가장 가까운 사람이 1등'],
  solo: ['주제에 맞는 답을 하나 적어요', '나만 쓴 답이면 +10점', '친구와 겹치면 모두 0점', '띄어쓰기만 다른 답은 같은 답'],
  marble: ['모두의 구슬이 동시에 떨어져요', '폰으로 조종하지 않아요, 응원만!', '판, 바람개비, 범퍼에 튕기며 내려가요', '먼저 결승선을 통과한 순서대로'],
  diff: ['왼쪽이 원본, 오른쪽이 틀린 그림', '폰에서 확대해 틀린 곳을 터치', '먼저 고친 한 명만 +10점', '아무 데나 막 누르면 잠겨요']
});
