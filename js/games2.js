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
const SOLO_DEFAULT = ['교실에서 볼 수 있는 네모난 물건은?', '빨간색 과일이나 채소는?', '공으로 하는 운동은?', '방학에 가고 싶은 곳은?', '급식에 나오면 좋은 반찬은?', 'ㄱ으로 시작하는 동물은?', '편의점에서 파는 것은?', '학교에 있는 장소는?'].map(q => ({ q }));
const STORE_ITEMS = [['🍙', '삼각김밥'], ['🥛', '우유'], ['🍫', '초콜릿'], ['🍜', '컵라면'], ['🧃', '주스'], ['🍞', '빵'], ['🍦', '아이스크림'], ['🍬', '사탕'], ['🥤', '탄산음료'], ['🍪', '쿠키'], ['🧻', '휴지'], ['🔋', '건전지'], ['🍌', '바나나'], ['🥚', '달걀'], ['🧀', '치즈'], ['🍭', '막대사탕'], ['🍕', '피자'], ['🌭', '핫도그']];
const SYM = ['▲', '●', '■', '★'], OPTC = ['#ff5a5f', '#3d8bff', '#27b56a', '#f5b301'];
const shuffle = (a, r) => { a = a.slice(); for (let k = a.length - 1; k > 0; k--) { const j = ((r ? r() : Math.random()) * (k + 1)) | 0; [a[k], a[j]] = [a[j], a[k]]; } return a; };
const key = () => Math.random().toString(36).slice(2, 9);
const secs = (ctx, until) => Math.max(0, (until - ctx.now()) / 1000);

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
  /* ═════ 01 두더지 선착순 ═════ */
  mole: {
    setup(ctx) {
      const holes = []; for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) holes.push([460 + q * 340, 380 + r * 170]);
      ctx.ask({ type: 'tap', theme: 'mole', label: '🔨 뿅망치', hint: '두더지가 나오면 화면 아무 곳이나 탭!' });
      return { holes, total: ctx.practice ? 3 : (ctx.opts.n || 10), i: 0, st: 'idle', catches: {}, mole: null };
    },
    begin(ctx, g) { ctx.setPub({ ph: 'play' }); this.next(ctx, g); },
    next(ctx, g) {
      if (g.i >= g.total) return ctx.done();
      g.i++; g.st = 'wait'; g.early = {}; g.taps = []; g.told = {}; g.win = null;
      g.mole = { h: (Math.random() * 9) | 0, st: 'wait', n: g.i, by: null };
      ctx.setPub({ mole: g.mole });
      ctx.after(1200 + Math.random() * 2200, () => {
        g.st = 'up'; g.upAt = ctx.now(); g.downAt = g.upAt + 1800; g.mole.st = 'up'; ctx.setPub({ mole: g.mole }); ctx.beep(700, 0.06);
        ctx.after(2200, () => { if (g.st === 'up') this.decide(ctx, g); });
      });
    },
    decide(ctx, g) {
      if (g.st !== 'up') return;
      const w = Sim2.moleWinner(g.taps, g.upAt, g.downAt, g.early);
      g.st = 'done';
      if (w) { g.win = w; g.catches[w] = (g.catches[w] || 0) + 1; ctx.score(w, 10); ctx.stat(w, 'mole'); g.mole.st = 'hit'; g.mole.by = ctx.name(w); ctx.tell(w, { k: 'msg', b: '잡았어요! 잡았닭!', s: ctx.practice ? '연습판' : '+10점', c: 'green' }); ctx.beep(990, 0.1); }
      else g.mole.st = 'miss';
      g.taps.forEach(t => { if (t.id !== w && !g.told[t.id]) { g.told[t.id] = 1; ctx.tell(t.id, g.early[t.id] ? { k: 'msg', b: '너무 빨랐어요!', s: '두더지가 나온 뒤에 눌러요', c: 'warn' } : { k: 'msg', b: '먼저 잡혔어요!', s: g.mole.by ? g.mole.by + '이(가) 먼저' : '', c: 'red' }); } });
      ctx.setPub({ mole: g.mole });
      ctx.after(1400, () => this.next(ctx, g));
    },
    onEv(ctx, g, id, e) {
      if (e.k !== 'tap') return;
      if (g.st === 'wait') { if (!g.early[id]) { g.early[id] = 1; ctx.tell(id, { k: 'msg', b: '너무 빨랐어요!', s: '이번 두더지는 못 잡아요', c: 'warn' }); } return; }
      if (g.st === 'up') {
        g.taps.push({ id, at: e.at, n: e.n });
        if (!g.early[id] && e.at >= g.upAt && !g.pend) { g.pend = 1; ctx.after(300, () => { g.pend = 0; this.decide(ctx, g); }); }
      } else if (g.st === 'done' && id !== g.win && !g.told[id]) { g.told[id] = 1; ctx.tell(id, { k: 'msg', b: '먼저 잡혔어요!', s: '', c: 'red' }); }
    },
    bot(ctx, g, id) { if (g.st === 'up' && Math.random() < 0.25) ctx.botEv(id, { k: 'tap' }); else if (g.st === 'wait' && Math.random() < 0.02) ctx.botEv(id, { k: 'tap' }); },
    end(ctx, g) { return { type: 'solo', title: '잡은 두더지', unit: '마리', rows: Sim.rankBy(ctx.active().map(id => ({ id, v: g.catches[id] || 0 })), o => o.v, true) }; },
    draw(c, S, g) {
      const P = S.pub, m = P.mole, t = S.t;
      sky(c, '#9fe0ff', '#7cc95b'); c.fillStyle = '#a5672f'; c.beginPath(); c.roundRect(300, 280, 1000, 600, 60); c.fill();
      for (let k = 0; k < 14; k++) { const x = 90 + k * 110; c.fillStyle = '#ff8a1f'; c.beginPath(); c.moveTo(x - 12, 260); c.lineTo(x + 12, 260); c.lineTo(x, 320); c.fill(); c.fillStyle = '#3aa655'; c.beginPath(); c.ellipse(x - 8, 248, 6, 16, -0.4, 0, 7); c.ellipse(x + 8, 248, 6, 16, 0.4, 0, 7); c.fill(); }
      (g ? g.holes : []).forEach(([x, y], k) => {
        c.fillStyle = '#4a2a12'; c.beginPath(); c.ellipse(x, y + 40, 110, 34, 0, 0, 7); c.fill();
        if (m && m.h === k && (m.st === 'up' || m.st === 'hit')) {
          const pop = m.st === 'hit' ? Math.max(0, 1 - (t % 10)) : 1;
          c.save(); c.beginPath(); c.rect(x - 120, y - 200, 240, 240); c.clip();
          const yy = y + 10 - 70 * pop;
          c.fillStyle = '#8a5a3c'; c.beginPath(); c.ellipse(x, yy, 70, 80, 0, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = '#3a2a1a'; c.stroke();
          c.fillStyle = '#f5c6a5'; c.beginPath(); c.ellipse(x, yy + 18, 40, 30, 0, 0, 7); c.fill();
          c.fillStyle = '#ff6f91'; c.beginPath(); c.arc(x, yy + 4, 12, 0, 7); c.fill();
          if (m.st === 'hit') { txt(c, '✕', x - 24, yy - 26, 34, '#3a2a1a'); txt(c, '✕', x + 24, yy - 26, 34, '#3a2a1a'); txt(c, '⭐', x + 60, yy - 80, 50, '#ffd400'); }
          else { c.fillStyle = '#111'; c.beginPath(); c.arc(x - 22, yy - 26, 8, 0, 7); c.arc(x + 22, yy - 26, 8, 0, 7); c.fill(); }
          c.restore();
        }
        c.fillStyle = '#6b3d1f'; c.beginPath(); c.ellipse(x, y + 50, 120, 26, 0, 0, Math.PI); c.fill();
      });
      rr(c, 60, 24, 1220, 120, 28, '#fff', '#2b2118', 6);
      if (m && m.st === 'hit') txt(c, `잡았닭! ${m.by}`, 670, 84, 64, '#e63946');
      else if (m && m.st === 'miss') txt(c, '두더지가 도망갔어요!', 670, 84, 54, '#888');
      else txt(c, P.ph === 'play' ? '두더지가 나오면 폰을 탭!' : '당근밭 두더지 선착순', 670, 84, 54, '#222');
      if (m) txt(c, `${m.n} / ${g ? g.total : ''}마리`, 1440, 84, 44, '#fff', 'center', '#2b2118');
      if (g) { const top = Object.keys(g.catches).sort((a, b) => g.catches[b] - g.catches[a]).slice(0, 5); if (top.length) { rr(c, 1320, 330, 260, 60 + top.length * 48, 20, 'rgba(255,255,255,.92)', '#2b2118', 4); txt(c, '잡은 두더지', 1450, 360, 26, '#e63946'); } top.forEach((id, k) => txt(c, `${k + 1}. ${nameOf(S.players[id])} ${g.catches[id]}마리`, 1340, 405 + k * 48, 28, '#222', 'left')); }
    }
  },

  /* ═════ 02 우리 반 박자 맞추기 ═════ */
  beat: {
    setup(ctx) { return { R: ctx.practice ? 1 : (ctx.opts.n || 5), r: 0, rec: [] }; },
    begin(ctx, g) { ctx.setPub({ ph: 'play' }); this.round(ctx, g); },
    round(ctx, g) {
      if (g.r >= g.R) return ctx.done();
      g.r++; g.press = {};
      const dur = Math.max(1600, 3200 - (g.r - 1) * 350), w = Math.max(0.07, 0.15 - (g.r - 1) * 0.02), a = 0.42 + Math.random() * (0.88 - 0.42 - w);
      g.cur = { t0: ctx.now() + 2000, dur, zone: [+a.toFixed(3), +(a + w).toFixed(3)], r: g.r, R: g.R, st: 'run' };
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
        c.strokeStyle = '#e63946'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40)); c.stroke(); c.lineCap = 'butt';
        c.fillStyle = '#2b2118'; c.beginPath(); c.arc(cx, cy, 26, 0, 7); c.fill();
        rr(c, 260, 650, 1080, 200, 30, '#fff', '#2b2118', 6);
        if (b.st === 'done') { txt(c, `${b.of}명 중 ${b.ok}명 성공`, 800, 730, 90, '#e63946'); txt(c, `${b.r} / ${b.R} 라운드`, 800, 812, 34, '#888'); }
        else txt(c, Net.now() < b.t0 ? `${b.r}라운드 준비… 바늘을 보세요` : '노란 구간에서 한 번만 탭!', 800, 750, 58, '#222');
      } else { rr(c, 260, 650, 1080, 200, 30, '#fff', '#2b2118', 6); txt(c, '시계탑 마을 박자 맞추기', 800, 750, 58, '#222'); }
      if (S.pub.ph === 'play') dressedCrowd(c, S, 600, 'band');
    }
  },

  /* ═════ 03 공통 취향 맞추기 ═════ */
  taste: {
    setup(ctx) { return { qs: ctx.pool('taste', ctx.practice ? 1 : (ctx.opts.n || 5)), i: -1, tot: {} }; },
    begin(ctx, g) { this.q(ctx, g); },
    q(ctx, g) {
      g.i++; if (g.i >= g.qs.length) return ctx.done();
      const q = g.qs[g.i]; g.votes = {}; g.until = ctx.now() + 12000; g.open = true;
      ctx.ask({ type: 'choice', opts: [q.a, q.b], label: '두 가게 중 하나에 줄 서기', change: true });
      ctx.setPub({ ph: 'play', tq: { a: q.a, b: q.b, n: g.i + 1, total: g.qs.length, until: g.until }, tres: null, can: null });
      ctx.after(12000, () => this.close(ctx, g));
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
      if (!P.tres) timer(c, 1440, 100, secs({ now: Net.now }, q.until), 12);
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
      const q = g.qs[g.i]; g.open = true; g.until = ctx.now() + 15000;
      ctx.priv({ need: null, q: q.q, o: q.o, picked: true });
      ctx.ask({ type: 'choice', opts: q.o, label: '선생님의 답을 예상해요', change: true });
      ctx.setPub({ ph: 'play', until: g.until });
      ctx.after(15000, () => this.close(ctx, g));
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
      else if (P.ph === 'play') timer(c, 1440, 100, Math.max(0, (P.until - Net.now()) / 1000), 15);
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
      const items = shuffle(STORE_ITEMS).slice(0, 12), kind = g.r % 2 ? 'what' : 'where';
      const corners = [0, 3, 8, 11], cell = kind === 'what' ? corners[(Math.random() * 4) | 0] : (Math.random() * 12) | 0;
      const pos = i => { const row = (i / 4) | 0, col = i % 4; return { 0: '맨 왼쪽 위', 3: '맨 오른쪽 위', 8: '맨 왼쪽 아래', 11: '맨 오른쪽 아래' }[i] || `위에서 ${row + 1}번째 줄, 왼쪽에서 ${col + 1}번째 칸`; };
      let q, opts, ans;
      if (kind === 'what') { const wrong = shuffle(items.filter((_, i) => i !== cell)).slice(0, 3); opts = shuffle([items[cell], ...wrong]); ans = opts.indexOf(items[cell]); q = `${pos(cell)}에는 무엇이 있었나요?`; }
      else { ans = cell; q = `${items[cell][1]}(${items[cell][0]})은(는) 어디에 있었나요?`; }
      g.cur = { items, kind, cell, ans, q, opts };
      ctx.ask({ type: 'wait', label: '큰 화면의 진열대를 잘 기억해요' });
      g.showUntil = ctx.now() + 6000;
      ctx.setPub({ ph: 'show', mem: { items, r: g.r, R: g.R, until: g.showUntil }, memq: null, memans: null, can: null });
      ctx.after(6000, () => {
        g.open = true; g.until = ctx.now() + 12000;
        ctx.ask(kind === 'what' ? { type: 'choice', opts: opts.map(o => o[0] + ' ' + o[1]), label: q, change: true } : { type: 'grid', cols: 4, rows: 3, label: q, change: true });
        ctx.setPub({ ph: 'play', memq: { q, until: g.until }, mem: { items: null, r: g.r, R: g.R } });
        ctx.after(12000, () => this.close(ctx, g));
      });
    },
    close(ctx, g) {
      if (!g.open) return; g.open = false; ctx.askClose();
      let ok = 0;
      ctx.active().forEach(id => { const hit = g.votes[id] === g.cur.ans; if (hit) { ok++; ctx.score(id, 10); g.tot[id] = (g.tot[id] || 0) + 10; } ctx.tell(id, hit ? { k: 'msg', b: '정답! 기억력 최고', s: ctx.practice ? '연습판' : '+10점', c: 'green' } : { k: 'msg', b: g.votes[id] == null ? '답하지 않았어요' : '아쉬워요', s: '큰 화면에서 정답을 확인해요', c: 'red' }); });
      ctx.setPub({ ph: 'reveal', mem: { items: g.cur.items, r: g.r, R: g.R }, memans: { cell: g.cur.kind === 'what' ? g.cur.cell : g.cur.ans, ok, of: ctx.active().length }, can: 'next', canLabel: g.r < g.R ? '다음 문제' : '결과 보기' });
    },
    cmd(ctx, g, m) { if (m.t === 'next' && ctx.P().ph === 'reveal') { this.round(ctx, g); return true; } if (m.t === 'close' && g.open) { this.close(ctx, g); return true; } },
    onEv(ctx, g, id, e) { if (e.k === 'ans' && g.open && e.q === ctx.P().ask.key) g.votes[id] = e.v; },
    bot(ctx, g, id) { if (g.open && g.votes[id] == null && Math.random() < 0.3) ctx.botEv(id, { k: 'ans', v: Math.random() < 0.6 ? g.cur.ans : (Math.random() * (g.cur.kind === 'what' ? 4 : 12)) | 0 }); },
    end(ctx, g) { return { type: 'solo', title: '기억력 점수', unit: '점', rows: Sim.rankBy(ctx.active().map(id => ({ id, v: g.tot[id] || 0 })), o => o.v, true) }; },
    draw(c, S) {
      const P = S.pub, m = P.mem, t = S.t;
      sky(c, '#e8f7ff', '#d6d6d6'); c.fillStyle = '#27b56a'; c.fillRect(0, 0, 1600, 16); c.fillStyle = '#ff8a1f'; c.fillRect(0, 16, 1600, 16);
      if (P.memq) head(c, P.memq.q, `문제 ${m.r} / ${m.R}`); else head(c, m ? (m.items ? (P.ph === 'reveal' ? '정답 공개! 원래 진열대' : '잘 기억해요! 곧 셔터가 내려가요') : '') : '편의점 기억력 구조대', m ? `문제 ${m.r} / ${m.R}` : null);
      const x0 = 260, y0 = 210, cw = 270, ch = 210;
      for (let row = 0; row < 3; row++) { c.fillStyle = '#b5651d'; c.fillRect(x0 - 20, y0 + row * ch + ch - 22, cw * 4 + 40, 22); }
      for (let i = 0; i < 12; i++) {
        const row = (i / 4) | 0, col = i % 4, x = x0 + col * cw, y = y0 + row * ch;
        rr(c, x + 10, y + 6, cw - 20, ch - 34, 18, '#fff', '#2b2118', 4);
        if (m && m.items) { txt(c, m.items[i][0], x + cw / 2, y + 80, 90); txt(c, m.items[i][1], x + cw / 2, y + 150, 26, '#555'); }
        else { for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#9aa3ad' : '#b9c1ca'; c.fillRect(x + 12, y + 8 + k * 26, cw - 24, 26); } }
        txt(c, String(i + 1), x + 30, y + 30, 22, '#999');
        if (P.memans && P.memans.cell === i) { c.lineWidth = 12; c.strokeStyle = '#e63946'; c.strokeRect(x + 4, y, cw - 8, ch - 22); }
      }
      if (P.ph === 'show' && m && m.until) timer(c, 1440, 100, Math.max(0, (m.until - Net.now()) / 1000), 6);
      if (P.ph === 'play' && P.memq) timer(c, 1440, 100, Math.max(0, (P.memq.until - Net.now()) / 1000), 12);
      if (P.memans) { rr(c, 1330, 360, 250, 130, 24, '#fff', '#2b2118', 5); txt(c, `${P.memans.of}명 중`, 1455, 400, 34, '#222'); txt(c, `${P.memans.ok}명 정답`, 1455, 450, 40, '#e63946'); }
    }
  },

  /* ═════ 06 반 대항 로켓 ═════ */
  rocket: {
    team: true,
    setup(ctx) {
      const tm = {}; ctx.active().forEach(id => (tm[id] = ctx.teamOf(id)));
      const R = new Sim2.Rocket(tm, { need: ctx.practice ? 2 : (ctx.opts.need || 4), ratio: 0.7 });
      ctx.ask({ type: 'tap', theme: 'rocket', label: '🚀 발사 버튼', hint: '큰 화면 신호등이 초록일 때 한 번 탭!' });
      return { R, tm, sig: null, until: 0 };
    },
    begin(ctx, g) { g.until = ctx.now() + 75000; ctx.setPub({ ph: 'play', until: g.until }); this.gap(ctx, g); },
    gap(ctx, g) {
      if (g.R.allDone() || ctx.now() > g.until) return ctx.done();
      g.sig = { st: 'wait', s0: 0, s1: 0 }; g.press = {}; g.early = {};
      this.push(ctx, g);
      ctx.after(1600 + Math.random() * 1800, () => {
        g.sig = { st: 'go', s0: ctx.now(), s1: ctx.now() + 1400 }; this.push(ctx, g); ctx.beep(880, 0.1);
        ctx.after(1400 + 450, () => {
          const done = g.R.signal(g.sig.s0, g.sig.s1, g.press);
          g.sig.st = 'eval'; this.push(ctx, g, done);
          Object.keys(g.tm).forEach(id => ctx.tell(id, g.press[id] != null ? { k: 'msg', b: '엔진에 힘을 보탰어요!', s: '', c: 'green' } : g.early[id] ? { k: 'msg', b: '너무 빨랐어요', s: '초록 신호를 기다려요', c: 'warn' } : { k: 'msg', b: '놓쳤어요', s: '다음 신호에 다시!', c: 'red' }));
          if (done.length) ctx.beep(1200, 0.4);
          ctx.after(1500, () => this.gap(ctx, g));
        });
      });
    },
    push(ctx, g, launched) {
      const teams = {}; for (const tm in g.R.teams) { const T = g.R.teams[tm]; teams[tm] = { eng: T.eng, n: T.ids.length, last: T.last, rank: T.rank }; }
      ctx.setPub({ rk: { teams, need: g.R.need, sig: g.sig.st, launched: launched || [] } });
    },
    onEv(ctx, g, id, e) {
      if (e.k !== 'tap' || g.tm[id] == null) return;
      if (g.sig.st === 'wait') { g.early[id] = 1; return; }
      if (g.sig.st === 'go' && !g.early[id] && g.press[id] == null && e.ct >= g.sig.s0 && e.ct <= g.sig.s1) g.press[id] = e.ct;
    },
    bot(ctx, g, id) { if (g.sig && g.sig.st === 'go' && g.press[id] == null && Math.random() < 0.45) ctx.botEv(id, { k: 'tap' }); },
    end(ctx, g) { const rows = g.R.ranking(); return { type: 'team', title: '로켓 발사 순위', rows: rows.map(r => ({ tm: r.tm, rank: r.rank, v: r.eng, label: r.fin ? '발사 성공!' : `엔진 ${r.eng}/${g.R.need}` })) }; },
    draw(c, S) {
      const P = S.pub, k = P.rk, t = S.t;
      c.fillStyle = '#0b1340'; c.fillRect(0, 0, 1600, 900); for (let n = 0; n < 120; n++) { c.fillStyle = `rgba(255,255,255,${0.3 + (n % 5) / 8})`; c.fillRect((n * 137) % 1600, (n * 89) % 620, 3, 3); }
      c.fillStyle = '#4a4f6a'; c.fillRect(0, 780, 1600, 120);
      if (!k) { head(c, '우주 발사 기지 · 반 대항 로켓'); return; }
      const tms = Object.keys(k.teams), n = tms.length, go = k.sig === 'go';
      rr(c, 640, 20, 320, 130, 40, '#222', '#fff', 6); c.fillStyle = go ? '#27e36a' : '#ff3b3b'; c.beginPath(); c.arc(720, 85, 46, 0, 7); c.fill(); txt(c, go ? '지금!' : '기다려', 860, 86, 52, go ? '#27e36a' : '#ff6b6b');
      if (P.until) txt(c, Math.ceil(Math.max(0, (P.until - Net.now()) / 1000)) + '초', 1480, 80, 50, '#fff');
      tms.forEach((tm, i) => {
        const T = k.teams[tm], TT = TEAM[tm], cx = (i + 0.5) * 1600 / n, fly = T.rank ? Math.min(600, ((S.launchT = S.launchT || {})[tm] = S.launchT[tm] || t, (t - S.launchT[tm]) * 300)) : 0;
        const y = 560 - fly;
        c.save(); c.translate(cx, y);
        c.fillStyle = TT.c; c.beginPath(); c.moveTo(0, -240); c.quadraticCurveTo(90, -150, 70, 60); c.lineTo(-70, 60); c.quadraticCurveTo(-90, -150, 0, -240); c.fill(); c.lineWidth = 8; c.strokeStyle = '#fff'; c.stroke();
        c.fillStyle = '#bfe8ff'; c.beginPath(); c.arc(0, -120, 36, 0, 7); c.fill(); c.stroke(); txt(c, TT.s, 0, -118, 40, TT.c);
        for (const d of [-1, 1]) { c.fillStyle = TT.c; c.beginPath(); c.moveTo(d * 66, -10); c.lineTo(d * 120, 90); c.lineTo(d * 60, 60); c.fill(); c.stroke(); }
        if (T.rank || go) { c.fillStyle = '#ffb703'; c.beginPath(); c.moveTo(-40, 64); c.lineTo(0, 64 + (T.rank ? 220 : 60) + Math.sin(t * 30) * 20); c.lineTo(40, 64); c.fill(); }
        c.restore();
        for (let e = 0; e < k.need; e++) { const ex = cx - (k.need - 1) * 26 + e * 52; c.fillStyle = e < T.eng ? '#ffd400' : '#33395a'; c.beginPath(); c.arc(ex, 720, 20, 0, 7); c.fill(); c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke(); }
        txt(c, `${TT.s} ${TT.n}팀`, cx, 640 + 120, 36, '#fff', 'center', TT.c);
        const L = T.last; txt(c, T.rank ? `${T.rank}등 발사!` : L ? `이번 신호 ${L.ok}/${L.of}명 성공 · 엔진 ${T.eng}/${k.need}개` : `엔진 ${T.eng}/${k.need}개 · ${T.n}명`, cx, 840, n > 3 ? 24 : 30, '#fff');
      });
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
      const it = g.list[g.i], pts = [30, 20, 10][g.stage - 1];
      g.open = true; g.until = ctx.now() + 15000;
      ctx.ask({ type: 'text', label: `단서 ${g.stage} · 맞히면 ${pts}점`, ph: '정답을 적어요', skip: Object.keys(g.done) });
      ctx.setPub({ ph: 'play', zm: { i: g.i + 1, n: g.list.length, stage: g.stage, pts, until: g.until, right: Object.keys(g.done).length }, can: 'close', canLabel: '이 단서 마감' });
      clearTimeout(g.tm); g.tm = ctx.after(15000, () => this.closeStage(ctx, g));
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
      const wf = full ? 1 : it.w[z.stage - 1], vw = 1600 * wf, vh = vw * 9 / 16;
      let sx = it.cx - vw / 2, sy = it.cy - vh / 2; sx = Math.max(0, Math.min(1600 - vw, sx)); sy = Math.max(0, Math.min(900 - vh, sy));
      const bx = 230, by = 190, bw = 1140, bh = 641;
      rr(c, bx - 18, by - 18, bw + 36, bh + 36, 30, '#2b2118');
      c.save(); c.beginPath(); c.roundRect(bx, by, bw, bh, 20); c.clip(); c.drawImage(g.cv, sx, sy, vw, vh, bx, by, bw, bh); c.restore();
      rr(c, 60, 24, 1220, 140, 28, '#fff', '#2b2118', 6);
      if (full) { txt(c, `정답은 「${z.ans}」`, 670, 94, 66, '#e63946'); }
      else { txt(c, `단서 ${z.stage} / 3 · 지금 맞히면 ${z.pts}점`, 670, 70, 44, '#222'); txt(c, `사진 ${z.i} / ${z.n} · 무엇일까요? 폰에 적어요`, 670, 128, 30, '#888'); }
      if (!full) timer(c, 1440, 100, Math.max(0, (z.until - Net.now()) / 1000), 15);
      txt(c, `지금까지 ${z.right}명 정답`, 1490, 860, 30, '#fff', 'right', '#2b2118');
      drawChar(c, 120, 780, 60, 23, { hat: 'explorer', face: full ? 'laugh' : 'smile' }); txt(c, '🔍', 190, 720, 70);
    }
  },

  /* ═════ 08 마음속으로 10초 세기 ═════ */
  ten: {
    setup(ctx) { return { R: ctx.practice ? 1 : (ctx.opts.n || 2), r: 0, best: {} }; },
    begin(ctx, g) { this.round(ctx, g); },
    round(ctx, g) {
      if (g.r >= g.R) return ctx.done();
      g.r++; g.press = {}; g.t0 = ctx.now() + 3000; g.open = true;
      ctx.ask({ type: 'tap', theme: 'ten', label: '🔦 손전등 스위치', hint: '시작 신호부터 마음속으로 10초를 세고 한 번 탭!', once: true });
      ctx.setPub({ ph: 'play', ten: { t0: g.t0, r: g.r, R: g.R, rows: null }, can: 'close', canLabel: '지금 마감' });
      ctx.after(3000, () => ctx.beep(880, 0.25));
      clearTimeout(g.tm); g.tm = ctx.after(3000 + 20000, () => this.close(ctx, g));
    },
    close(ctx, g) {
      if (!g.open) return; g.open = false; clearTimeout(g.tm);
      const rows = Sim2.tenGrade(g.t0, g.press);
      rows.forEach(r => { if (g.best[r.id] == null || r.diff < g.best[r.id].diff) g.best[r.id] = r; ctx.tell(r.id, { k: 'msg', b: `${Sim2.fmt2(r.rec)}초`, s: `10.00초와 ${Sim2.fmt2(r.diff)}초 차이 · ${r.rank}등`, c: r.rank === 1 ? 'green' : '' }); });
      Object.keys(g.press).forEach(id => { if (!rows.find(r => r.id === id)) ctx.tell(id, { k: 'msg', b: '너무 빨랐어요!', s: '시작 신호 전에 눌렀어요', c: 'warn' }); });
      ctx.setPub({ ph: 'reveal', ten: { t0: g.t0, r: g.r, R: g.R, rows: rows.slice(0, 12).map(r => ({ id: r.id, rec: r.rec, diff: r.diff, rank: r.rank })), n: rows.length }, can: 'next', canLabel: g.r < g.R ? '다음 판' : '결과 보기' });
    },
    cmd(ctx, g, m) { if (m.t === 'close' && g.open) { this.close(ctx, g); return true; } if (m.t === 'next' && ctx.P().ph === 'reveal') { this.round(ctx, g); return true; } },
    onEv(ctx, g, id, e) {
      if (e.k !== 'tap' || !g.open || g.press[id] != null) return;
      g.press[id] = e.ct;
      ctx.tell(id, e.ct < g.t0 ? { k: 'msg', b: '너무 빨랐어요!', s: '이번 판 기록은 없어요', c: 'warn' } : { k: 'msg', b: '찰칵! 기록했어요', s: '결과는 모두 누른 뒤에', c: '' });
      if (ctx.active().every(i => g.press[i] != null) && ctx.now() > g.t0 + 3000) ctx.after(800, () => this.close(ctx, g));
    },
    bot(ctx, g, id) { if (g.open && g.press[id] == null && ctx.now() > g.t0 + 8000 && Math.random() < 0.12) ctx.botEv(id, { k: 'tap' }); },
    end(ctx, g) { const rows = Sim.rankBy(Object.values(g.best).map(r => ({ id: r.id, v: Sim2.fmt2(r.rec) + '초', d: r.diff })), o => o.d, false); return { type: 'solo', title: '10초에 가장 가까운 기록', unit: '', rows }; },
    draw(c, S) {
      const P = S.pub, tn = P.ten, now = Net.now(), t = S.t;
      c.fillStyle = '#0d0b14'; c.fillRect(0, 0, 1600, 900);
      c.fillStyle = '#1e1a2b'; for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(k * 200, 0); c.lineTo(k * 200 + 100, 140 + (k % 3) * 40); c.lineTo(k * 200 + 200, 0); c.fill(); }
      if (!tn) { head(c, '깜깜한 동굴 · 마음속으로 10초 세기'); return; }
      if (P.ph === 'play') {
        if (now < tn.t0) { txt(c, '준비…', 800, 380, 160, '#666'); txt(c, '불이 켜지면 마음속으로 10초!', 800, 560, 54, '#aaa'); }
        else { const k = Math.max(0, 1 - (now - tn.t0) / 1500); c.fillStyle = `rgba(255,230,120,${k})`; c.fillRect(0, 0, 1600, 900); txt(c, '시작!', 800, 420, 220, k > 0.2 ? '#2b2118' : '#3a3550'); txt(c, '하나… 둘… 셋…', 800, 640, 60, '#55506e'); }
        dressedCrowd(c, S, 820, null, 'shock');
      } else {
        rr(c, 200, 60, 1200, 790, 30, '#fff', '#2b2118', 6);
        txt(c, `${tn.r}판 결과 · ${tn.n}명 기록`, 800, 120, 46, '#222');
        (tn.rows || []).forEach((r, k) => { const x = k < 6 ? 260 : 830, y = 210 + (k % 6) * 105, pl = S.players[r.id]; if (!pl) return; drawChar(c, x + 30, y, 32, pl.c, { face: r.rank === 1 ? 'laugh' : 'smile', hat: 'explorer' }); txt(c, `${r.rank}등 ${nameOf(pl)}`, x + 80, y - 16, 32, '#222', 'left'); txt(c, `${Sim2.fmt2(r.rec)}초 (차이 ${Sim2.fmt2(r.diff)})`, x + 80, y + 22, 28, r.rank === 1 ? '#e63946' : '#666', 'left'); });
      }
    }
  },

  /* ═════ 12 답이 겹치면 0점 ═════ */
  solo: {
    setup(ctx) { return { qs: ctx.pool('solo', ctx.practice ? 1 : (ctx.opts.n || 3)), i: -1, tot: {} }; },
    begin(ctx, g) { this.q(ctx, g); },
    q(ctx, g) {
      g.i++; if (g.i >= g.qs.length) return ctx.done();
      g.ans = {}; g.open = true; g.until = ctx.now() + 25000; g.S = null;
      ctx.ask({ type: 'text', label: '나만 쓸 것 같은 답 하나', ph: '답을 적어요', change: true });
      ctx.setPub({ ph: 'play', sq: { q: g.qs[g.i].q, n: g.i + 1, total: g.qs.length, until: g.until, cnt: 0 }, sres: null, can: 'close', canLabel: '지금 마감' });
      clearTimeout(g.tm); g.tm = ctx.after(25000, () => this.close(ctx, g));
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
      if (P.ph === 'play') { timer(c, 1440, 100, Math.max(0, (q.until - Net.now()) / 1000), 25); txt(c, `유리병 ${q.cnt}개 도착`, 800, 300, 56, '#fff', 'center', '#2b2118'); for (let k = 0; k < Math.min(q.cnt, 30); k++) txt(c, '🍾', 200 + (k * 97) % 1200, 420 + Math.sin(t * 2 + k) * 10 + (k % 3) * 40, 44); }
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
      const sim = new Sim2.Marble(ids, { seed, dur: ctx.practice ? 60 : 120 });
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
      const sim = g.sim, C = sim.course, CW = Sim2.Marble.CW, FIN = Sim2.Marble.FIN, t = S.t, players = S.players;
      c.fillStyle = '#eaf6ff'; c.fillRect(0, 0, 1600, 900);
      // 카메라: 아직 달리는 구슬 중 앞쪽 무리를 따라간다
      const run = sim.b.filter(b => !b.fin).sort((a, b) => b.y - a.y), tgt = run.length ? run[Math.min(2, run.length - 1)].y - 380 : FIN - 600;
      g.cam += (Math.max(0, Math.min(FIN - 700, tgt)) - g.cam) * 0.08;
      const sc = 0.9, ox = 330, oy = -g.cam * sc;
      const drawCourse = (s, ox, oy, minimal) => {
        c.save(); c.translate(ox, oy); c.scale(s, s);
        c.fillStyle = '#ffffff'; c.fillRect(0, 0, CW, Sim2.Marble.CH); c.fillStyle = '#d7ecff'; for (let y = 0; y < Sim2.Marble.CH; y += 400) c.fillRect(0, y, CW, 200);
        c.lineCap = 'round'; c.strokeStyle = '#8a5a2b'; c.lineWidth = 14; C.segs.forEach(sg => { c.beginPath(); c.moveTo(sg.x1, sg.y1); c.lineTo(sg.x2, sg.y2); c.stroke(); });
        C.bumps.forEach(o => { c.fillStyle = o.k === 'bumper' ? '#ff4d6d' : '#5e60ce'; c.beginPath(); c.arc(o.x, o.y, o.r, 0, 7); c.fill(); if (!minimal && o.k === 'bumper') { c.fillStyle = '#fff'; c.beginPath(); c.arc(o.x, o.y, o.r * 0.5, 0, 7); c.fill(); } });
        C.mills.forEach(m => { c.strokeStyle = '#2a9d8f'; c.lineWidth = 16; sim.millSegs(m).forEach(sg => { c.beginPath(); c.moveTo(sg.x1, sg.y1); c.lineTo(sg.x2, sg.y2); c.stroke(); }); c.fillStyle = '#264653'; c.beginPath(); c.arc(m.x, m.y, 14, 0, 7); c.fill(); });
        for (let x = 0; x < CW; x += 40) { c.fillStyle = (x / 40) % 2 ? '#222' : '#fff'; c.fillRect(x, FIN, 40, 30); }
        c.lineCap = 'butt'; c.restore();
      };
      // 왼쪽 전체 지도
      const ms = 860 / Sim2.Marble.CH; drawCourse(ms, 40, 20, true);
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
      if (it.scene) { const d = ART.makeDiffs(it.scene, ctx.practice ? 3 : (ctx.opts.spots || 5), (Math.random() * 1e9) | 0); ART.renderScene(A, it.scene, d.objs, false); ART.renderScene(B, it.scene, d.objs, true); g.spots = d.spots; g.title = ART.SCENES[it.scene].name; }
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
      ctx.setPub({ df }); ctx.beep(990, 0.1);
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
        const L = Sim2.spamLock((g.miss[id] || []).concat([now]), now, 3, 5000); g.miss[id] = L.recent;
        if (L.lock) { g.lock[id] = now + 20000; g.miss[id] = []; return ctx.tell(id, { k: 'diff', r: 'lock', until: g.lock[id], x, y, b: '20초 잠금!', s: '아무 데나 막 누르면 잠겨요', c: 'red' }); }
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
  mole: ['두더지는 큰 화면에만 나와요', '두더지가 나오면 폰 화면 아무 곳이나 탭', '서버에 먼저 도착한 한 명만 잡아요', '나오기 전에 누르면 그 두더지는 못 잡아요'],
  beat: ['바늘이 노란 구간을 지나가요', '구간 안이라고 생각할 때 폰을 한 번만 탭', '빠른 사람이 아니라 구간 안에 누른 사람이 성공', '성공한 인원이 우리 반 기록이 돼요'],
  taste: ['두 가게 중 하나를 골라요', '마감 전에는 몇 명이 골랐는지 몰라요', '더 많이 고른 쪽 모두 +10점', '동점이면 투표한 사람 모두 +10점'],
  tquiz: ['선생님이 먼저 몰래 답을 골라요', '선생님의 답을 예상해 폰에서 골라요', '맞히면 +10점', '마감 뒤 모두의 선택과 선생님 답 공개'],
  memory: ['진열대 물건을 잠깐 보여 줘요', '셔터가 내려가면 폰에서 답해요', '빨리가 아니라 정확하게!', '정답이면 +10점'],
  rocket: ['팀마다 로켓 한 대', '큰 화면 신호가 초록일 때 한 번 탭', '팀원의 70%가 성공하면 엔진 하나 켜짐', '신호 전에 누르면 그 신호는 놓쳐요'],
  zoom: ['사진의 아주 작은 부분부터 보여 줘요', '폰에 답을 적어요 (단서마다 한 번)', '첫 단서 30점, 두 번째 20점, 세 번째 10점', '틀려도 다음 단서에서 다시 도전'],
  ten: ['큰 화면에 시작 신호만 나와요', '마음속으로 10초를 세고 폰을 한 번 탭', '10.00초에 가장 가까운 사람이 1등', '차이가 같으면 공동 순위'],
  solo: ['주제에 맞는 답을 하나 적어요', '나만 쓴 답이면 +10점', '친구와 겹치면 모두 0점', '띄어쓰기만 다른 답은 같은 답'],
  marble: ['모두의 구슬이 동시에 떨어져요', '폰으로 조종하지 않아요, 응원만!', '판, 바람개비, 범퍼에 튕기며 내려가요', '먼저 결승선을 통과한 순서대로'],
  diff: ['왼쪽이 원본, 오른쪽이 틀린 그림', '폰에서 확대해 틀린 곳을 터치', '먼저 고친 한 명만 +10점', '아무 데나 막 누르면 20초 잠금']
});
