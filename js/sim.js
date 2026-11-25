/* 우리 반 게임 페스티벌 — 게임 판정 로직 (교실 화면 쪽에서만 실행)
   화면 그리기와 통신이 섞이지 않은 순수 계산 코드라서 Node로 자동 시험할 수 있다. */
(function (root, f) {
  if (typeof module !== 'undefined' && module.exports) module.exports = f();
  else root.Sim = f();
})(typeof self !== 'undefined' ? self : this, function () {
  const W = 1600, H = 900;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  // 조이스틱 입력 정리: 길이 1 이하, 아주 작은 떨림은 0
  function inp(i) {
    if (!i) return { x: 0, y: 0 };
    let x = +i.x || 0, y = +i.y || 0;
    const m = Math.hypot(x, y);
    if (m < 0.15) return { x: 0, y: 0 };
    if (m > 1) { x /= m; y /= m; }
    return { x, y };
  }
  // 값이 같으면 같은 순위(공동 순위)
  function rankBy(list, key, desc) {
    const a = list.slice().sort((p, q) => (desc ? key(q) - key(p) : key(p) - key(q)));
    let rank = 0, prev = null;
    a.forEach((it, i) => {
      const v = key(it);
      if (prev === null || v !== prev) rank = i + 1;
      it.rank = rank; prev = v;
    });
    return a;
  }

  /* ───────── 09. 조이스틱 OX ───────── */
  class OX {
    constructor(pids) {
      this.p = {}; this.ph = 'idle'; this.left = 0; this.speed = 340;
      this.top = 250; this.oMax = W * 0.40; this.xMin = W * 0.60;
      this.r = rng(Date.now());
      pids.forEach(id => this.add(id));
    }
    add(id) {
      if (this.p[id]) return;
      this.p[id] = { x: 0, y: 0, ans: '', st: 'ok' };
      this.center(this.p[id]);
    }
    center(pl) {
      pl.x = W / 2 + (this.r() - 0.5) * 120;
      pl.y = this.top + 40 + this.r() * (H - this.top - 90);
      pl.ans = ''; pl.st = 'ok';
    }
    startQ(dur) {
      Object.values(this.p).forEach(pl => this.center(pl));
      this.ph = 'q'; this.left = dur;
    }
    zone(x) { return x < this.oMax ? 'O' : x > this.xMin ? 'X' : '-'; }
    step(dt, inputs) {
      if (this.ph !== 'q') return;
      for (const id in this.p) {
        const pl = this.p[id], i = inp(inputs[id]);
        pl.x = clamp(pl.x + i.x * this.speed * dt, 30, W - 30);
        pl.y = clamp(pl.y + i.y * this.speed * dt, this.top, H - 30);
      }
      this.left -= dt;
      if (this.left <= 0) this.close();
    }
    close() {
      this.left = 0; this.ph = 'closed';
      for (const id in this.p) {
        const pl = this.p[id];
        pl.ans = this.zone(pl.x);
        pl.st = pl.ans === '-' ? 'fall' : 'ok';
      }
    }
    grade(answer) {
      const res = { correct: [], wrong: [], fell: [] };
      for (const id in this.p) {
        const pl = this.p[id];
        if (pl.ans === '-') res.fell.push(id);
        else if (pl.ans === answer) { res.correct.push(id); pl.st = 'right'; }
        else { res.wrong.push(id); pl.st = 'wrong'; }
      }
      this.ph = 'graded';
      return res;
    }
    snap() {
      const o = {};
      for (const id in this.p) { const p = this.p[id]; o[id] = [p.x | 0, p.y | 0, p.st]; }
      return { p: o, left: Math.max(0, +this.left.toFixed(1)), ph: this.ph };
    }
  }

  /* ───────── 10. 무궁화 꽃이 피었습니다 ───────── */
  class RedLight {
    constructor(pids, opts) {
      opts = opts || {};
      this.auto = opts.auto !== false; this.dur = opts.dur || 60;
      this.startX = 90; this.finishX = W - 190; this.top = 150; this.speed = 150;
      this.r = rng(opts.seed || Date.now());
      this.p = {}; this.pids = pids.slice(); this.ph = 'idle'; this.ev = [];
      this.reset();
    }
    add(id) { if (!this.p[id]) { this.pids.push(id); this.p[id] = { x: this.startX, y: this.top + this.r() * (H - this.top - 60), st: 'out', rank: 0 }; } }
    reset() {
      const n = this.pids.length;
      this.pids.forEach((id, k) => {
        this.p[id] = { x: this.startX, y: this.top + 30 + (H - this.top - 80) * ((k + 0.5) / n), st: 'run', rank: 0 };
      });
      this.it = 'back'; this.itT = 0; this.itDur = 3; this.grace = 0; this.nFin = 0; this.left = this.dur;
    }
    start() { this.reset(); this.ph = 'play'; this.nextBack(); }
    nextBack() { this.it = 'back'; this.itT = 0; this.itDur = 1.6 + this.r() * 2.8; }
    look() { if (this.it === 'look') return; this.it = 'look'; this.itT = 0; this.itDur = 1.6 + this.r() * 1.6; this.grace = 0.4; }
    toggle() { if (this.ph !== 'play') return; if (this.it === 'back') this.look(); else this.nextBack(); }
    step(dt, inputs) {
      if (this.ph !== 'play') return;
      this.left -= dt; this.itT += dt;
      if (this.auto && this.itT >= this.itDur) { if (this.it === 'back') this.look(); else this.nextBack(); }
      if (this.grace > 0) this.grace -= dt;
      let active = 0;
      for (const id of this.pids) {
        const pl = this.p[id];
        if (pl.st !== 'run') continue;
        const i = inp(inputs[id]);
        if (this.it === 'look') {
          // 돌아본 뒤 0.4초의 반응 시간이 지나고도 조이스틱을 밀고 있으면 탈락
          if (this.grace <= 0 && (i.x || i.y)) { pl.st = 'out'; this.ev.push({ t: 'out', id }); continue; }
        } else {
          pl.x = clamp(pl.x + i.x * this.speed * dt, 30, W - 30);
          pl.y = clamp(pl.y + i.y * this.speed * dt, this.top, H - 30);
          if (pl.x >= this.finishX) { pl.st = 'fin'; pl.rank = ++this.nFin; this.ev.push({ t: 'fin', id, rank: pl.rank }); continue; }
        }
        active++;
      }
      if (this.left <= 0 || active === 0) { this.left = Math.max(0, this.left); this.ph = 'done'; }
    }
    takeEvents() { const e = this.ev; this.ev = []; return e; }
    snap() {
      const o = {};
      for (const id of this.pids) { const p = this.p[id]; o[id] = [p.x | 0, p.y | 0, p.st, p.rank]; }
      return { p: o, it: this.it, prog: +clamp(this.itT / this.itDur, 0, 1).toFixed(2), left: Math.max(0, +this.left.toFixed(1)), ph: this.ph };
    }
  }

  /* ───────── 11. 그림 속 미로 ───────── */
  function genMaze(seed, cw, ch) {
    const r = rng(seed), tw = cw * 2 + 1, th = ch * 2 + 1;
    const t = new Uint8Array(tw * th).fill(1);
    const seen = new Uint8Array(cw * ch);
    const stack = [[0, (ch / 2) | 0]];
    seen[stack[0][1] * cw] = 1; t[(stack[0][1] * 2 + 1) * tw + 1] = 0;
    while (stack.length) {
      const [cx, cy] = stack[stack.length - 1];
      const ds = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
        const nx = cx + dx, ny = cy + dy;
        return nx >= 0 && ny >= 0 && nx < cw && ny < ch && !seen[ny * cw + nx];
      });
      if (!ds.length) { stack.pop(); continue; }
      const [dx, dy] = ds[(r() * ds.length) | 0];
      const nx = cx + dx, ny = cy + dy;
      seen[ny * cw + nx] = 1;
      t[(cy * 2 + 1 + dy) * tw + (cx * 2 + 1 + dx)] = 0;
      t[(ny * 2 + 1) * tw + (nx * 2 + 1)] = 0;
      stack.push([nx, ny]);
    }
    // 막다른 길만 있으면 지루하니 벽을 조금 뚫어 돌아가는 길을 만든다
    for (let k = 0; k < cw * ch * 0.12; k++) {
      const x = 1 + ((r() * (tw - 2)) | 0), y = 1 + ((r() * (th - 2)) | 0);
      if ((x % 2) === (y % 2)) continue;
      t[y * tw + x] = 0;
    }
    const sy = ((ch / 2) | 0) * 2 + 1, ey = ((r() * ch) | 0) * 2 + 1;
    t[ey * tw + tw - 1] = 0;
    return { t, tw, th, start: [1, sy], exit: [tw - 1, ey] };
  }
  class Maze {
    constructor(pids, opts) {
      opts = opts || {};
      this.seed = opts.seed || 7; this.dur = opts.dur || 90;
      this.m = genMaze(this.seed, 20, 11);
      this.T = W / this.m.tw; this.rad = this.T * 0.28; this.speed = 200;
      this.r = rng(this.seed + 99);
      this.p = {}; this.pids = []; this.nFin = 0; this.left = this.dur; this.ph = 'idle'; this.ev = [];
      pids.forEach(id => this.add(id));
    }
    add(id) {
      if (this.p[id]) return;
      this.pids.push(id);
      const [sx, sy] = this.m.start, j = this.T * 0.15;
      this.p[id] = { x: (sx + 0.5) * this.T + (this.r() - 0.5) * j, y: (sy + 0.5) * this.T + (this.r() - 0.5) * j, st: 'run', rank: 0, time: 0 };
    }
    start() { this.ph = 'play'; }
    wall(x, y) {
      const tx = Math.floor(x / this.T), ty = Math.floor(y / this.T);
      if (tx < 0 || ty < 0 || ty >= this.m.th) return true;
      if (tx >= this.m.tw) return false;
      return this.m.t[ty * this.m.tw + tx] === 1;
    }
    blocked(x, y) {
      const r = this.rad;
      return this.wall(x - r, y - r) || this.wall(x + r, y - r) || this.wall(x - r, y + r) || this.wall(x + r, y + r);
    }
    step(dt, inputs) {
      if (this.ph !== 'play') return;
      this.left -= dt;
      let active = 0;
      for (const id of this.pids) {
        const pl = this.p[id];
        if (pl.st !== 'run') continue;
        const i = inp(inputs[id]);
        const nx = pl.x + i.x * this.speed * dt, ny = pl.y + i.y * this.speed * dt;
        if (!this.blocked(nx, pl.y)) pl.x = nx;
        if (!this.blocked(pl.x, ny)) pl.y = ny;
        if (pl.x >= (this.m.tw - 0.5) * this.T) {
          pl.st = 'fin'; pl.rank = ++this.nFin; pl.time = +(this.dur - this.left).toFixed(2);
          this.ev.push({ t: 'fin', id, rank: pl.rank, time: pl.time });
        } else active++;
      }
      if (this.left <= 0 || active === 0) { this.left = Math.max(0, this.left); this.ph = 'done'; }
    }
    takeEvents() { const e = this.ev; this.ev = []; return e; }
    snap() {
      const o = {};
      for (const id of this.pids) { const p = this.p[id]; o[id] = [p.x | 0, p.y | 0, p.st, p.rank]; }
      return { p: o, left: Math.max(0, +this.left.toFixed(1)), ph: this.ph };
    }
  }

  /* ───────── 13. 네 모서리 땅따먹기 ───────── */
  const GW = 64, GH = 36, CELL = 25, BASE = 6;
  const ITEM_KINDS = ['bolt', 'shield', 'snow', 'portal'];
  class Terr {
    constructor(pids, teams, opts) {
      opts = opts || {};
      this.dur = opts.dur || 120; this.practice = !!opts.practice;
      this.r = rng(opts.seed || Date.now());
      this.own = new Int8Array(GW * GH).fill(-1);
      this.trail = new Int16Array(GW * GH).fill(-1);
      this.list = []; this.p = {}; this.items = []; this.itemT = 2; this.itemId = 0;
      this.gridVer = 1; this.left = this.dur; this.ph = 'idle'; this.ev = [];
      this.corners = [[0, 0], [GW - BASE, 0], [0, GH - BASE], [GW - BASE, GH - BASE]];
      this.corners.forEach(([bx, by], tm) => {
        for (let y = by; y < by + BASE; y++) for (let x = bx; x < bx + BASE; x++) this.own[y * GW + x] = tm;
      });
      pids.forEach(id => this.add(id, teams[id] || 0));
    }
    add(id, tm) {
      if (this.p[id]) return;
      const pl = { id, idx: this.list.length, tm, x: 0, y: 0, cells: [], bolt: 0, shield: 0, slow: 0, inv: 0 };
      this.list.push(pl); this.p[id] = pl; this.spawn(pl);
    }
    spawn(pl) {
      const [bx, by] = this.corners[pl.tm];
      pl.x = (bx + 1 + this.r() * (BASE - 2)) * CELL; pl.y = (by + 1 + this.r() * (BASE - 2)) * CELL;
    }
    start() { this.ph = 'play'; }
    clearTrail(pl) {
      for (const c of pl.cells) if (this.trail[c] === pl.idx) this.trail[c] = -1;
      pl.cells = [];
    }
    capture(pl) {
      const tm = pl.tm, own = this.own;
      let gained = 0;
      for (const c of pl.cells) if (own[c] === -1) { own[c] = tm; gained++; }
      this.clearTrail(pl);
      // 맵 가장자리에서 시작해 우리 팀 땅을 넘지 못하는 물을 붓는다. 물이 닿지 않은 빈 칸이 둘러싸인 칸이다.
      const seen = new Uint8Array(GW * GH), q = [];
      const push = c => { if (!seen[c] && own[c] !== tm) { seen[c] = 1; q.push(c); } };
      for (let x = 0; x < GW; x++) { push(x); push((GH - 1) * GW + x); }
      for (let y = 0; y < GH; y++) { push(y * GW); push(y * GW + GW - 1); }
      while (q.length) {
        const c = q.pop(), x = c % GW, y = (c / GW) | 0;
        if (x > 0) push(c - 1); if (x < GW - 1) push(c + 1);
        if (y > 0) push(c - GW); if (y < GH - 1) push(c + GW);
      }
      for (let c = 0; c < GW * GH; c++) if (!seen[c] && own[c] === -1) { own[c] = tm; gained++; }
      if (gained) {
        this.gridVer++;
        this.items = this.items.filter(it => own[it.c] === -1);
        this.ev.push({ t: 'cap', id: pl.id, n: gained });
      }
    }
    spawnItem() {
      const kinds = this.practice ? ['bolt', 'shield'] : ITEM_KINDS;
      for (let tries = 0; tries < 40; tries++) {
        // 맵을 6구역으로 나눠 차례로 돌아가며 놓아 한쪽에 몰리지 않게 한다
        const zone = this.itemId % 6, zx = zone % 3, zy = (zone / 3) | 0;
        const x = ((zx + this.r()) * GW / 3) | 0, y = ((zy + this.r()) * GH / 2) | 0, c = y * GW + x;
        if (this.own[c] !== -1 || this.trail[c] !== -1 || this.items.some(i => i.c === c)) continue;
        this.items.push({ id: ++this.itemId, c, k: kinds[(this.r() * kinds.length) | 0] });
        return;
      }
      this.itemId++;
    }
    step(dt, inputs) {
      if (this.ph !== 'play') return;
      this.left -= dt;
      this.itemT -= dt;
      if (this.itemT <= 0) { this.itemT = 3; if (this.items.length < 7) this.spawnItem(); }
      for (const pl of this.list) {
        ['bolt', 'shield', 'slow', 'inv'].forEach(k => { if (pl[k] > 0) pl[k] = Math.max(0, pl[k] - dt); });
        const i = inp(inputs[pl.id]);
        const sp = 215 * (pl.bolt > 0 ? 1.5 : 1) * (pl.slow > 0 ? 0.5 : 1);
        pl.x = clamp(pl.x + i.x * sp * dt, 4, W - 4);
        pl.y = clamp(pl.y + i.y * sp * dt, 4, H - 4);
        const c = ((pl.y / CELL) | 0) * GW + ((pl.x / CELL) | 0);
        // 상대의 닫히지 않은 선을 밟았는가
        const ti = this.trail[c];
        if (ti >= 0 && this.list[ti].tm !== pl.tm) {
          const v = this.list[ti];
          if (v.inv > 0) { /* 방금 방패로 막은 직후 */ }
          else if (v.shield > 0) { v.shield = 0; v.inv = 1.2; this.ev.push({ t: 'block', id: v.id, by: pl.id }); }
          else { this.clearTrail(v); this.spawn(v); this.ev.push({ t: 'cut', id: v.id, by: pl.id }); }
        }
        // 아이템: 이 반복문에서 먼저 처리된(=교실 화면이 먼저 도착했다고 판정한) 한 명만 받는다
        const ii = this.items.findIndex(it => it.c === c);
        if (ii >= 0) {
          const it = this.items.splice(ii, 1)[0];
          if (it.k === 'bolt') pl.bolt = 5;
          else if (it.k === 'shield') pl.shield = 8;
          else if (it.k === 'snow') {
            for (const o of this.list) if (o.tm !== pl.tm && Math.hypot(o.x - pl.x, o.y - pl.y) < 230) { o.slow = 3; this.ev.push({ t: 'slowed', id: o.id }); }
          } else if (it.k === 'portal') { this.clearTrail(pl); this.spawn(pl); }
          this.ev.push({ t: 'item', id: pl.id, k: it.k });
          if (it.k === 'portal') continue;
        }
        if (this.own[c] === pl.tm) { if (pl.cells.length) this.capture(pl); }
        else if (pl.cells[pl.cells.length - 1] !== c) {
          if (this.trail[c] === -1) this.trail[c] = pl.idx;
          if (!pl.cells.includes(c)) pl.cells.push(c);
        }
      }
      if (this.left <= 0) { this.left = 0; this.ph = 'done'; this.list.forEach(pl => this.clearTrail(pl)); }
    }
    counts() { const n = [0, 0, 0, 0]; for (let c = 0; c < GW * GH; c++) if (this.own[c] >= 0) n[this.own[c]]++; return n; }
    percents() { return this.counts().map(n => +(n * 100 / (GW * GH)).toFixed(1)); }
    gridStr() { let s = ''; for (let c = 0; c < GW * GH; c++) s += this.own[c] < 0 ? '.' : this.own[c]; return s; }
    takeEvents() { const e = this.ev; this.ev = []; return e; }
    snap() {
      const o = {}, tr = [];
      for (const pl of this.list) {
        o[pl.id] = [pl.x | 0, pl.y | 0, pl.tm, +pl.bolt.toFixed(1), +pl.shield.toFixed(1), +pl.slow.toFixed(1)];
      }
      for (let c = 0; c < GW * GH; c++) if (this.trail[c] >= 0) tr.push(c, this.list[this.trail[c]].tm);
      return { p: o, tr, it: this.items.map(i => [i.c, i.k]), pc: this.percents(), gv: this.gridVer, left: Math.max(0, +this.left.toFixed(1)), ph: this.ph };
    }
  }
  Terr.GW = GW; Terr.GH = GH; Terr.CELL = CELL; Terr.BASE = BASE;

  /* ───────── 14. 지렁이 키우기 ───────── */
  const MW = 2400, MH = 1350;
  class Worm {
    constructor(pids, opts) {
      opts = opts || {};
      this.dur = opts.dur || 90; this.collide = opts.collide !== false;
      this.r = rng(opts.seed || Date.now());
      this.base = 8; this.gap = 13; this.speed = 175; this.turn = 4.2;
      this.w = {}; this.pids = []; this.orbs = []; this.left = this.dur; this.ph = 'idle'; this.ev = [];
      for (let k = 0; k < 90; k++) this.orbs.push(this.newOrb());
      pids.forEach(id => this.add(id));
    }
    newOrb() { return { x: 40 + this.r() * (MW - 80), y: 40 + this.r() * (MH - 80), tmp: 0 }; }
    add(id) { if (this.w[id]) return; this.pids.push(id); this.w[id] = { len: this.base, dead: 0, pts: [], x: 0, y: 0, a: 0, ta: 0 }; this.place(this.w[id]); }
    place(w) {
      let best = null, bd = -1;
      for (let k = 0; k < 14; k++) {
        const x = 120 + this.r() * (MW - 240), y = 120 + this.r() * (MH - 240);
        let d = 1e9;
        for (const id of this.pids) { const o = this.w[id]; if (o !== w && !o.dead) for (let n = 0; n < o.pts.length; n += 3) d = Math.min(d, Math.hypot(o.pts[n].x - x, o.pts[n].y - y)); }
        if (d > bd) { bd = d; best = [x, y]; }
      }
      w.x = best[0]; w.y = best[1]; w.a = w.ta = this.r() * Math.PI * 2; w.len = this.base; w.dead = 0;
      w.pts = []; for (let k = 0; k < w.len; k++) w.pts.push({ x: w.x - Math.cos(w.a) * this.gap * k, y: w.y - Math.sin(w.a) * this.gap * k });
    }
    start() { this.ph = 'play'; }
    kill(id) {
      const w = this.w[id];
      for (let n = 0; n < w.pts.length; n += 2) this.orbs.push({ x: clamp(w.pts[n].x, 20, MW - 20), y: clamp(w.pts[n].y, 20, MH - 20), tmp: 1 });
      w.dead = 2; w.pts = []; this.ev.push({ t: 'die', id });
    }
    step(dt, inputs) {
      if (this.ph !== 'play') return;
      this.left -= dt;
      for (const id of this.pids) {
        const w = this.w[id];
        if (w.dead > 0) { w.dead -= dt; if (w.dead <= 0) { this.place(w); this.ev.push({ t: 'respawn', id }); } continue; }
        const i = inp(inputs[id]);
        if (i.x || i.y) w.ta = Math.atan2(i.y, i.x);   // 손을 떼면 마지막 방향 유지
        let d = w.ta - w.a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        w.a += clamp(d, -this.turn * dt, this.turn * dt);
        w.x += Math.cos(w.a) * this.speed * dt; w.y += Math.sin(w.a) * this.speed * dt;
        if (w.x < 12 || w.x > MW - 12) { w.x = clamp(w.x, 12, MW - 12); w.a = w.ta = Math.PI - w.a; }
        if (w.y < 12 || w.y > MH - 12) { w.y = clamp(w.y, 12, MH - 12); w.a = w.ta = -w.a; }
        const h = w.pts[0];
        if (Math.hypot(w.x - h.x, w.y - h.y) >= this.gap) { w.pts.unshift({ x: w.x, y: w.y }); }
        while (w.pts.length > w.len) w.pts.pop();
        for (let k = this.orbs.length - 1; k >= 0; k--) {
          const o = this.orbs[k];
          if (Math.abs(o.x - w.x) < 24 && Math.abs(o.y - w.y) < 24 && Math.hypot(o.x - w.x, o.y - w.y) < 24) {
            w.len++;
            if (o.tmp) this.orbs.splice(k, 1); else this.orbs[k] = this.newOrb();
          }
        }
      }
      if (this.collide) {
        const dead = [];
        for (const id of this.pids) {
          const w = this.w[id]; if (w.dead > 0) continue;
          outer: for (const od of this.pids) {
            if (od === id) continue;
            const o = this.w[od]; if (o.dead > 0) continue;
            for (let n = 0; n < o.pts.length; n++) {
              const p = o.pts[n];
              if (Math.abs(p.x - w.x) < 15 && Math.abs(p.y - w.y) < 15 && Math.hypot(p.x - w.x, p.y - w.y) < 15) { dead.push(id); break outer; }
            }
          }
        }
        dead.forEach(id => this.kill(id));
      }
      if (this.left <= 0) { this.left = 0; this.ph = 'done'; }
    }
    ranking() { return rankBy(this.pids.map(id => ({ id, len: this.w[id].len })), o => o.len, true); }
    takeEvents() { const e = this.ev; this.ev = []; return e; }
    snap() {
      const o = {};
      for (const id of this.pids) {
        const w = this.w[id], pts = [];
        for (let n = 0; n < w.pts.length; n += 2) pts.push(w.pts[n].x | 0, w.pts[n].y | 0);
        o[id] = [w.len, w.dead > 0 ? 1 : 0, pts];
      }
      const ob = []; for (const q of this.orbs) ob.push(q.x | 0, q.y | 0);
      return { w: o, ob, left: Math.max(0, +this.left.toFixed(1)), ph: this.ph };
    }
  }
  Worm.MW = MW; Worm.MH = MH;

  return { W, H, rng, inp, rankBy, genMaze, OX, RedLight, Maze, Terr, Worm };
});
