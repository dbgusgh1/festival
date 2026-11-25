/* 터치·퀴즈·그림 게임 판정 로직과 구슬 경주 물리. 화면과 분리되어 Node로 시험할 수 있다. */
(function (root, f) {
  if (typeof module !== 'undefined' && module.exports) module.exports = f(require('./sim.js'));
  else root.Sim2 = f(root.Sim);
})(typeof self !== 'undefined' ? self : this, function (Sim) {
  const rankBy = Sim.rankBy;

  // 답 비교용: 띄어쓰기·문장부호를 지우고 소문자로
  const norm = s => String(s == null ? '' : s).replace(/[\s.,!?~'"·]/g, '').toLowerCase();

  /* 두더지: 등장 시각 이후, 내려가기 전에 서버에 도착한 터치 중 가장 이른 것 하나 */
  function moleWinner(taps, upAt, downAt, early) {
    let best = null;
    for (const t of taps) {
      if (early && early[t.id]) continue;
      if (t.at < upAt || t.at > downAt) continue;
      if (!best || t.at < best.at || (t.at === best.at && t.n < best.n)) best = t;
    }
    return best ? best.id : null;
  }

  /* 박자: 누른 순간 바늘 위치가 목표 구간 안인가 */
  const beatPos = (t0, dur, ct) => (ct - t0) / dur;
  const beatHit = (t0, dur, zone, ct) => { const p = beatPos(t0, dur, ct); return p >= zone[0] && p <= zone[1]; };

  /* 10초 세기: 0.01초 단위 기록, 10.00초와의 차이로 순위(같으면 공동) */
  function tenGrade(t0, presses) {
    const rows = [];
    for (const id in presses) {
      const ms = presses[id] - t0;
      if (ms < 0) continue;
      const rec = Math.round(ms / 10);              // 0.01초 단위 정수
      rows.push({ id, rec, diff: Math.abs(rec - 1000) });
    }
    return rankBy(rows, r => r.diff, false);
  }
  const fmt2 = h => (h / 100).toFixed(2);

  /* 공통 취향: 많이 고른 쪽 전원 +10, 동점이면 투표자 전원 +10 */
  function tasteScore(votes) {
    const n = [0, 0];
    for (const id in votes) if (votes[id] === 0 || votes[id] === 1) n[votes[id]]++;
    const win = n[0] === n[1] ? [0, 1] : n[0] > n[1] ? [0] : [1];
    const winners = Object.keys(votes).filter(id => win.includes(votes[id]) && (n[0] + n[1] > 0));
    return { n, win, winners };
  }

  /* 답이 겹치면 0점: 띄어쓰기만 다른 답은 자동으로 묶고, 진행자가 묶기·제외·가리기를 할 수 있다 */
  class Solo {
    constructor(answers) {
      this.g = {};
      for (const id in answers) {
        const raw = String(answers[id] || '').trim(); if (!raw) continue;
        const k = norm(raw) || raw;
        (this.g[k] = this.g[k] || { k, label: raw, ids: [], out: false, hide: false }).ids.push(id);
      }
    }
    merge(from, into) {
      if (from === into || !this.g[from] || !this.g[into]) return false;
      this.g[into].ids.push(...this.g[from].ids); this.g[into].out = this.g[into].out || this.g[from].out;
      delete this.g[from]; return true;
    }
    toggle(k, field) { if (this.g[k]) this.g[k][field] = !this.g[k][field]; }
    list() { return Object.values(this.g).sort((a, b) => b.ids.length - a.ids.length || a.label.localeCompare(b.label)); }
    score() {
      const plus = [];
      for (const gr of Object.values(this.g)) if (!gr.out && gr.ids.length === 1) plus.push(gr.ids[0]);
      return plus;
    }
  }

  /* 반 대항 로켓 */
  class Rocket {
    constructor(teams, opts) {
      opts = opts || {};
      this.need = opts.need || 5; this.ratio = opts.ratio || 0.7;
      this.teams = {};                       // tm -> {ids, eng, rank, last}
      for (const id in teams) { const tm = teams[id]; (this.teams[tm] = this.teams[tm] || { ids: [], eng: 0, rank: 0, last: null }).ids.push(id); }
      this.nDone = 0;
    }
    // 한 신호 판정: presses = {id: ct}, 신호 구간 [s0, s1] 안의 첫 입력만 인정
    signal(s0, s1, presses) {
      const done = [];
      for (const tm in this.teams) {
        const T = this.teams[tm];
        const need = Math.max(1, Math.ceil(T.ids.length * this.ratio - 1e-9));
        const ok = T.ids.filter(id => presses[id] != null && presses[id] >= s0 && presses[id] <= s1).length;
        T.last = { ok, of: T.ids.length, need };
        if (T.rank) continue;
        if (ok >= need) { T.eng++; if (T.eng >= this.need) done.push(tm); }
      }
      if (done.length) { const r = this.nDone + 1; done.forEach(tm => (this.teams[tm].rank = r)); this.nDone += done.length; }
      return done;
    }
    allDone() { return Object.values(this.teams).every(T => T.rank); }
    ranking() {
      const rows = Object.keys(this.teams).map(tm => ({ tm: +tm, eng: this.teams[tm].eng, fin: this.teams[tm].rank || 0 }));
      // 발사한 팀은 발사 순위, 못 한 팀은 엔진 수로
      rows.forEach(r => (r.key = r.fin ? 1000 - r.fin : r.eng));
      return rankBy(rows, r => r.key, true);
    }
  }

  /* 틀린 그림: 터치가 어느 틀린 곳에 들었는가 */
  function diffHit(spots, x, y, pad) {
    pad = pad || 0;
    let best = -1, bd = 1e9;
    spots.forEach((s, i) => { const d = Math.hypot(s.x - x, s.y - y); if (d <= s.r + pad && d < bd) { bd = d; best = i; } });
    return best;
  }
  // 연타 잠금: 최근 window ms 안에 틀린 터치가 limit번 이상이면 잠금
  function spamLock(misses, now, limit, windowMs) {
    const recent = misses.filter(t => now - t < windowMs);
    return { recent, lock: recent.length >= limit };
  }

  /* ───────── 15. 구슬 경주 물리 ───────── */
  const CW = 1000, CH = 7200, BR = 13, FIN = CH - 160;
  function buildCourse(seed) {
    const r = Sim.rng(seed), segs = [], bumps = [], mills = [];
    const seg = (x1, y1, x2, y2, k) => segs.push({ x1, y1, x2, y2, k: k || 'board' });
    let y = 700;
    // 출발 바구니 바닥(출발 신호 때 열림)은 따로 처리
    const sections = ['zig', 'pegs', 'mill', 'bump', 'zig', 'mill', 'bump', 'funnel'];
    sections.forEach((kind, si) => {
      if (kind === 'zig') {
        for (let k = 0; k < 4; k++) {
          const left = (k + si) % 2 === 0;
          if (left) seg(0, y, CW * 0.72, y + 120); else seg(CW, y, CW * 0.28, y + 120);
          y += 190;
        }
        y += 60;
      } else if (kind === 'pegs') {
        for (let row = 0; row < 7; row++) {
          const off = row % 2 ? 0 : 55;
          for (let x = 55 + off; x < CW - 30; x += 110) bumps.push({ x, y, r: 11, e: 0.55, k: 'peg' });
          y += 85;
        }
        y += 60;
      } else if (kind === 'mill') {
        const n = 3;
        for (let k = 0; k < n; k++) mills.push({ x: (k + 0.5) * CW / n + (r() - 0.5) * 60, y: y + 90 + (k % 2) * 120, L: 120, w: (k % 2 ? -1 : 1) * (1.6 + r()), a: r() * 6.28 });
        seg(0, y + 330, 120, y + 380); seg(CW, y + 330, CW - 120, y + 380);
        y += 480;
      } else if (kind === 'bump') {
        for (let k = 0; k < 9; k++) bumps.push({ x: 90 + r() * (CW - 180), y: y + (k % 3) * 150 + r() * 60, r: 30 + r() * 18, e: 1.05, k: 'bumper' });
        y += 520;
      } else if (kind === 'funnel') {
        seg(0, y, CW * 0.42, y + 260); seg(CW, y, CW * 0.58, y + 260);
        y += 320;
      }
    });
    // 남은 길이는 결승선까지 직선 구간
    return { segs, bumps, mills, len: Math.max(y + 200, FIN - 100) };
  }
  class Marble {
    constructor(pids, opts) {
      opts = opts || {};
      this.seed = opts.seed || 1; this.dur = opts.dur || 120;
      this.course = buildCourse(this.seed);
      this.r = Sim.rng(this.seed * 7 + 3);
      this.b = []; this.idx = {}; this.order = []; this.left = this.dur; this.ph = 'idle'; this.t = 0; this.ev = [];
      const ids = pids.slice();
      for (let k = ids.length - 1; k > 0; k--) { const j = (this.r() * (k + 1)) | 0; [ids[k], ids[j]] = [ids[j], ids[k]]; }  // 출발 위치 섞기
      const perRow = 30;
      ids.forEach((id, k) => {
        const row = (k / perRow) | 0, col = k % perRow;
        const x = 40 + col * ((CW - 80) / (perRow - 1)) + (row % 2) * 12 + (this.r() - 0.5) * 6;
        this.idx[id] = this.b.length;
        this.b.push({ id, x, y: 560 - row * 30, vx: 0, vy: 0, fin: 0, best: 0, stuck: 0 });
      });
    }
    start() { this.ph = 'play'; }
    millSegs(m) {
      const out = [];
      for (let k = 0; k < 2; k++) {
        const a = m.a + k * Math.PI / 2, cx = Math.cos(a) * m.L, cy = Math.sin(a) * m.L;
        out.push({ x1: m.x - cx, y1: m.y - cy, x2: m.x + cx, y2: m.y + cy, k: 'mill', m });
      }
      return out;
    }
    collideSeg(b, s, e) {
      const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy;
      let t = ((b.x - s.x1) * dx + (b.y - s.y1) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = s.x1 + dx * t, py = s.y1 + dy * t; let nx = b.x - px, ny = b.y - py; const d = Math.hypot(nx, ny);
      if (d >= BR || d === 0) return;
      nx /= d; ny /= d; b.x = px + nx * BR; b.y = py + ny * BR;
      let svx = 0, svy = 0;
      if (s.m) { svx = -s.m.w * (py - s.m.y); svy = s.m.w * (px - s.m.x); }   // 돌고 있는 날개의 속도
      const rvx = b.vx - svx, rvy = b.vy - svy, vn = rvx * nx + rvy * ny;
      if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; b.vx = b.vx * 0.995 + svx * 0.02; b.vy = b.vy * 0.995 + svy * 0.02; }
    }
    collideBall(b, o) {
      let nx = b.x - o.x, ny = b.y - o.y; const d = Math.hypot(nx, ny), rr = BR + o.r;
      if (d >= rr || d === 0) return;
      nx /= d; ny /= d; b.x = o.x + nx * rr; b.y = o.y + ny * rr;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) { const e = o.e; b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; if (o.k === 'bumper') { b.vx += nx * 160; b.vy += ny * 160; } }
    }
    step(dt) {
      if (this.ph !== 'play') return;
      this.left -= dt; this.t += dt;
      const C = this.course, sub = Math.max(1, Math.ceil(dt * 240)), h = dt / sub;
      for (let s = 0; s < sub; s++) {
        C.mills.forEach(m => (m.a += m.w * h));
        const msegs = []; C.mills.forEach(m => msegs.push(...this.millSegs(m)));
        const grid = new Map();
        for (const b of this.b) { if (b.fin) continue; const key = ((b.x / 32) | 0) + ',' + ((b.y / 32) | 0); (grid.get(key) || grid.set(key, []).get(key)).push(b); }
        for (const b of this.b) {
          if (b.fin) continue;
          b.vy += 900 * h;
          const sp = Math.hypot(b.vx, b.vy); if (sp > 950) { b.vx *= 950 / sp; b.vy *= 950 / sp; }
          b.x += b.vx * h; b.y += b.vy * h;
          if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx) * 0.5; } if (b.x > CW - BR) { b.x = CW - BR; b.vx = -Math.abs(b.vx) * 0.5; }
          for (const sg of C.segs) { if (Math.max(sg.y1, sg.y2) + BR < b.y || Math.min(sg.y1, sg.y2) - BR > b.y) continue; this.collideSeg(b, sg, 0.35); }
          for (const sg of msegs) { if (Math.abs(sg.m.y - b.y) > sg.m.L + BR) continue; this.collideSeg(b, sg, 0.5); }
          for (const o of C.bumps) { if (Math.abs(o.y - b.y) > o.r + BR) continue; this.collideBall(b, o); }
          const gx = (b.x / 32) | 0, gy = (b.y / 32) | 0;
          for (let ix = gx - 1; ix <= gx + 1; ix++) for (let iy = gy - 1; iy <= gy + 1; iy++) {
            const cell = grid.get(ix + ',' + iy); if (!cell) continue;
            for (const o of cell) {
              if (o === b || o.fin) continue;
              let nx = b.x - o.x, ny = b.y - o.y; const d = Math.hypot(nx, ny);
              if (d >= BR * 2 || d === 0) continue;
              nx /= d; ny /= d; const push = (BR * 2 - d) / 2; b.x += nx * push; b.y += ny * push; o.x -= nx * push; o.y -= ny * push;
              const vn = (b.vx - o.vx) * nx + (b.vy - o.vy) * ny;
              if (vn < 0) { const j = -(1 + 0.6) * vn / 2; b.vx += j * nx; b.vy += j * ny; o.vx -= j * nx; o.vy -= j * ny; }
            }
          }
          if (b.y >= FIN) { b.fin = this.order.length + 1; b.time = +this.t.toFixed(2); this.order.push(b.id); this.ev.push({ t: 'fin', id: b.id, rank: b.fin }); }
        }
      }
      // 오래 갇힌 구슬은 살짝 흔들어 준다
      for (const b of this.b) {
        if (b.fin) continue;
        if (b.y > b.best + 25) { b.best = b.y; b.stuck = 0; } else if ((b.stuck += dt) > 3) { b.stuck = 0; b.vx = (this.r() - 0.5) * 500; b.vy = -150; }
      }
      if (this.left <= 0 || this.order.length === this.b.length) { this.left = Math.max(0, this.left); this.ph = 'done'; }
    }
    ranking() {
      const fin = this.order.map((id, k) => ({ id, rank: k + 1, done: true }));
      const rest = this.b.filter(b => !b.fin).sort((a, b) => b.y - a.y).map((b, k) => ({ id: b.id, rank: fin.length + k + 1, done: false }));
      return fin.concat(rest);
    }
    takeEvents() { const e = this.ev; this.ev = []; return e; }
    snap() {
      const p = []; for (const b of this.b) p.push(b.x | 0, b.y | 0);
      return { p, ids: this.b.map(b => b.id), ord: this.order.slice(), mills: this.course.mills.map(m => +m.a.toFixed(2)), left: Math.max(0, +this.left.toFixed(1)), ph: this.ph };
    }
  }
  Marble.CW = CW; Marble.CH = CH; Marble.BR = BR; Marble.FIN = FIN;

  return { norm, moleWinner, beatPos, beatHit, tenGrade, fmt2, tasteScore, Solo, Rocket, diffHit, spamLock, buildCourse, Marble };
});
