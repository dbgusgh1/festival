/* 우리 반 게임 페스티벌 — 조이스틱 게임 판정 로직 (교실 화면 쪽에서만 실행)
   화면 그리기와 통신이 섞이지 않은 순수 계산 코드라서 Node로 자동 시험할 수 있다.
   난이도 lv: 1 하, 2 중, 3 상 */
(function (root, f) {
  if (typeof module !== 'undefined' && module.exports) module.exports = f();
  else root.Sim = f();
})(typeof self !== 'undefined' ? self : this, function () {
  const W = 1600, H = 900;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const LV = v => (v === 1 || v === 3 ? v : 2);

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

  /* ───────── 09. 체육 OX 서바이벌 (3D) ─────────
     「체육 OX 서바이벌」 1단계 체험판의 규칙을 그대로 옮긴 판정 코드. 좌표는 3D 경기장 단위(x 좌우, z 앞뒤).
     O 구역 중심 (-7,-4), X 구역 중심 (7,-4), 크기 11 x 10. 시간이 끝나면 울타리가 올라오고(1.3초 동안 멈춤) 판정.
     정답 구역 안에 있어야 생존, 틀리거나 구역 밖이면 탈락해 응원석으로 걸어간다.
     부활 미션: 5문제 중 3개 이상 맞히면 다음 문제 시작 때 경기장으로 복귀. 탈락 1번당 시도 1회, 부활 횟수는 선생님이 정한다. */
  const OXW = { ZONE_W: 11, ZONE_D: 10, ZONES: { O: { x: -7, z: -4 }, X: { x: 7, z: -4 } }, PLAY: { x0: -17, x1: 17, z0: -13, z1: 7.5 }, STAND: { x0: -15, x1: 15, z0: 9.6, z1: 13 }, SPEED: 7 };
  function oxZoneAt(x, z) {
    for (const k of ['O', 'X']) { const Z = OXW.ZONES[k]; if (Math.abs(x - Z.x) <= OXW.ZONE_W / 2 - 0.2 && Math.abs(z - Z.z) <= OXW.ZONE_D / 2 - 0.2) return k; }
    return null;
  }
  class OX {
    constructor(pids, opts) {
      opts = opts || {};
      this.maxRev = opts.revives != null ? opts.revives : 1;
      this.r = rng(opts.seed || Date.now());
      this.p = {}; this.ph = 'idle'; this.left = 0; this.qNo = 0; this.closeT = 0; this.ev = []; this.emSeq = 0;
      pids.forEach(id => this.add(id));
    }
    rin(R) { return { x: R.x0 + this.r() * (R.x1 - R.x0), z: R.z0 + this.r() * (R.z1 - R.z0) }; }
    add(id, shirt) {
      if (this.p[id]) return;
      const s = this.rin({ x0: -12, x1: 12, z0: 1, z1: 7 });
      this.p[id] = { x: s.x, z: s.z, vx: 0, vz: 0, alive: true, pend: false, tried: false, rvOpen: false, used: 0, auto: null, elimQ: null, ans: 0, cor: 0, sh: shirt || 0, em: -1, es: 0 };
    }
    canRevive(id) { const p = this.p[id]; return !!p && !p.alive && !p.pend && !p.tried && p.used < this.maxRev && this.ph !== 'ended'; }
    startQ(dur) {
      // 부활 대기자 복귀
      for (const id in this.p) { const p = this.p[id]; if (p.pend) { p.pend = false; p.alive = true; p.auto = null; const s = this.rin({ x0: -1, x1: 1, z0: 3, z1: 6 }); p.x = s.x; p.z = s.z; this.ev.push({ t: 'back', id }); } }
      this.qNo++; this.ph = 'q'; this.left = dur;
    }
    step(dt, inputs) {
      const frozen = this.ph === 'closing';
      for (const id in this.p) {
        const p = this.p[id];
        if (p.auto) { const dx = p.auto.x - p.x, dz = p.auto.z - p.z, d = Math.hypot(dx, dz); if (d < 0.3) { p.auto = null; p.vx = p.vz = 0; } else { p.vx = dx / d * OXW.SPEED * 1.4; p.vz = dz / d * OXW.SPEED * 1.4; } }
        else if (frozen && p.alive) { p.vx = p.vz = 0; }
        else { const i = inp(inputs[id]); p.vx = i.x * OXW.SPEED; p.vz = i.y * OXW.SPEED; }
        p.x += p.vx * dt; p.z += p.vz * dt;
      }
      // 서로 밀어내기
      const L = Object.values(this.p);
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
        const a = L[i], b = L[j], dx = b.x - a.x, dz = b.z - a.z;
        if (Math.abs(dx) > 0.95 || Math.abs(dz) > 0.95) continue;
        const d = Math.hypot(dx, dz);
        if (d > 0 && d < 0.95) { const push = (0.95 - d) / 2, nx = dx / d, nz = dz / d; a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push; }
      }
      for (const p of L) if (!p.auto) { const R = p.alive ? OXW.PLAY : OXW.STAND; p.x = clamp(p.x, R.x0, R.x1); p.z = clamp(p.z, R.z0, R.z1); }
      if (this.ph === 'q') { this.left -= dt; if (this.left <= 0) this.close(); }
      else if (this.ph === 'closing') { this.closeT -= dt; if (this.closeT <= 0) this.ph = 'judge'; }
    }
    close() { if (this.ph !== 'q') return; this.left = 0; this.ph = 'closing'; this.closeT = 1.3; }
    grade(a) {
      const res = { correct: [], out: [] };
      for (const id in this.p) {
        const p = this.p[id]; if (!p.alive) continue; p.ans++;
        if (oxZoneAt(p.x, p.z) === a) { p.cor++; res.correct.push(id); } else { res.out.push(id); this.eliminate(id); }
      }
      this.ph = 'graded';
      return res;
    }
    eliminate(id) { const p = this.p[id]; p.alive = false; p.elimQ = this.qNo; p.tried = false; p.rvOpen = false; p.auto = this.rin(OXW.STAND); }
    reviveStart(id) { if (!this.canRevive(id)) return false; const p = this.p[id]; p.tried = true; p.rvOpen = true; return true; }
    reviveEnd(id, score) {
      const p = this.p[id]; if (!p || !p.rvOpen) return null; p.rvOpen = false;
      const pass = score >= 3 && this.ph !== 'ended' && !p.alive;
      if (pass) { p.pend = true; p.used++; this.emoji(id, 3); }
      return pass;
    }
    emoji(id, i) { const p = this.p[id]; if (!p) return; p.em = i; p.es = ++this.emSeq; }
    alive() { return Object.values(this.p).filter(p => p.alive).length; }
    ranking() {   // 생존자 먼저, 그다음 늦게 탈락한 순, 그다음 정답 수
      return Object.keys(this.p).map(id => ({ id, p: this.p[id] }))
        .sort((a, b) => (b.p.alive - a.p.alive) || ((b.p.elimQ == null ? 999 : b.p.elimQ) - (a.p.elimQ == null ? 999 : a.p.elimQ)) || (b.p.cor - a.p.cor))
        .map((o, k, arr) => { const prev = arr[k - 1]; o.rank = prev && prev.p.alive === o.p.alive && prev.p.elimQ === o.p.elimQ && prev.p.cor === o.p.cor ? prev.rank : k + 1; return o; });
    }
    takeEvents() { const e = this.ev; this.ev = []; return e; }
    snap() {
      const o = {};
      for (const id in this.p) {
        const p = this.p[id];
        o[id] = [Math.round(p.x * 100), Math.round(p.z * 100), (p.alive ? 1 : 0) | (p.pend ? 2 : 0) | (this.canRevive(id) ? 4 : 0) | (p.auto ? 8 : 0), p.sh, p.em, p.es];
      }
      return { p: o, left: Math.max(0, +this.left.toFixed(1)), ph: this.ph, q: this.qNo, alive: this.alive() };
    }
  }
  OX.W = OXW; OX.zoneAt = oxZoneAt;

  /* ───────── 10. 무궁화 꽃이 피었습니다 ─────────
     하: 술래가 천천히, 돌아본 뒤 0.7초 여유. 중: 0.4초. 상: 0.25초 + 고개만 살짝 돌리는 속임수. */
  class RedLight {
    constructor(pids, opts) {
      opts = opts || {};
      this.lv = LV(opts.lv);
      this.auto = opts.auto !== false; this.dur = opts.dur || 60;
      this.startX = 90; this.finishX = W - 190; this.top = 150; this.speed = 150;
      this.graceT = [0, 0.7, 0.4, 0.25][this.lv];
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
    nextBack() {
      const [a, b] = [null, [2.6, 2.2], [1.6, 2.8], [0.9, 2.8]][this.lv];
      this.it = 'back'; this.itT = 0; this.itDur = a + this.r() * b;
    }
    peek() { this.it = 'peek'; this.itT = 0; this.itDur = 0.55 + this.r() * 0.35; }
    look() {
      if (this.it === 'look') return;
      const [a, b] = [null, [2.0, 1.0], [1.6, 1.6], [1.2, 2.0]][this.lv];
      this.it = 'look'; this.itT = 0; this.itDur = a + this.r() * b; this.grace = this.graceT;
    }
    toggle() { if (this.ph !== 'play') return; if (this.it !== 'look') this.look(); else this.nextBack(); }
    step(dt, inputs) {
      if (this.ph !== 'play') return;
      this.left -= dt; this.itT += dt;
      if (this.auto && this.itT >= this.itDur) {
        if (this.it === 'back') { if (this.lv === 3 && this.r() < 0.4) this.peek(); else this.look(); }
        else if (this.it === 'peek') { if (this.r() < 0.5) this.look(); else this.nextBack(); }
        else this.nextBack();
      }
      if (this.grace > 0) this.grace -= dt;
      let active = 0;
      for (const id of this.pids) {
        const pl = this.p[id];
        if (pl.st !== 'run') continue;
        const i = inp(inputs[id]);
        if (this.it === 'look') {
          // 돌아본 뒤 반응 시간이 지나고도 조이스틱을 밀고 있으면 탈락
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

  /* ───────── 11. 그림 속 미로 ─────────
     하: 작은 미로. 중: 보통 미로 + 게 3마리. 상: 큰 미로 + 게 6마리. 게에 닿으면 출발점으로. */
  const MAZE_SIZE = [null, [14, 8], [20, 11], [26, 14]];
  function genMaze(seed, cw, ch, loops) {
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
    // 보통 미로: 벽을 조금 뚫어 돌아가는 길을 만든다. 꽉 막힌 미로(loops=0): 길이 하나뿐이고 막다른 길이 많다
    const nHole = cw * ch * (loops == null ? 0.12 : loops);
    for (let k = 0; k < nHole; k++) {
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
      this.lv = LV(opts.lv);
      this.seed = opts.seed || 7; this.dur = opts.dur || 90;
      const [cw, ch] = MAZE_SIZE[this.lv]; this.cw = cw; this.ch = ch;
      this.tight = !!opts.tight;
      this.m = genMaze(this.seed, cw, ch, this.tight ? 0 : 0.12);
      this.T = W / this.m.tw; this.rad = this.T * 0.28; this.speed = this.T * 4.2;
      this.r = rng(this.seed + 99);
      this.p = {}; this.pids = []; this.nFin = 0; this.left = this.dur; this.ph = 'idle'; this.ev = [];
      // 게: 출발점에서 먼 길 위에서 시작해 갈림길마다 방향을 바꾼다
      this.crabs = [];
      const open = [];
      for (let y = 1; y < this.m.th - 1; y++) for (let x = Math.ceil(this.m.tw * 0.35); x < this.m.tw - 2; x++) if (!this.m.t[y * this.m.tw + x] && x % 2 && y % 2) open.push([x, y]);
      for (let k = 0; k < [0, 0, 3, 6][this.lv] && open.length; k++) {
        const [x, y] = open.splice((this.r() * open.length) | 0, 1)[0];
        this.crabs.push({ x, y, fx: x, fy: y, tx: x, ty: y, k: 1, dx: 0, dy: 0 });
      }
      this.crabSpeed = [0, 0, 2.2, 3.0][this.lv];
      pids.forEach(id => this.add(id));
    }
    add(id) {
      if (this.p[id]) return;
      this.pids.push(id);
      this.p[id] = { x: 0, y: 0, st: 'run', rank: 0, time: 0, safe: 0 };
      this.home(this.p[id]);
    }
    home(pl) {
      const [sx, sy] = this.m.start, j = this.T * 0.15;
      pl.x = (sx + 0.5) * this.T + (this.r() - 0.5) * j; pl.y = (sy + 0.5) * this.T + (this.r() - 0.5) * j; pl.safe = 1.5;
    }
    start() { this.ph = 'play'; }
    open(x, y) { return x >= 0 && y >= 0 && x < this.m.tw - 1 && y < this.m.th && !this.m.t[y * this.m.tw + x]; }
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
    moveCrabs(dt) {
      for (const cb of this.crabs) {
        cb.k += dt * this.crabSpeed;
        if (cb.k >= 1) {
          cb.fx = cb.tx; cb.fy = cb.ty; cb.k = 0;
          const ds = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => this.open(cb.fx + dx, cb.fy + dy));
          const fwd = ds.filter(([dx, dy]) => !(dx === -cb.dx && dy === -cb.dy));
          const pick = (fwd.length ? fwd : ds)[(this.r() * (fwd.length || ds.length)) | 0] || [0, 0];
          cb.dx = pick[0]; cb.dy = pick[1]; cb.tx = cb.fx + cb.dx; cb.ty = cb.fy + cb.dy;
        }
        cb.x = cb.fx + (cb.tx - cb.fx) * cb.k; cb.y = cb.fy + (cb.ty - cb.fy) * cb.k;
      }
    }
    step(dt, inputs) {
      if (this.ph !== 'play') return;
      this.left -= dt;
      this.moveCrabs(dt);
      let active = 0;
      for (const id of this.pids) {
        const pl = this.p[id];
        if (pl.st !== 'run') continue;
        if (pl.safe > 0) pl.safe -= dt;
        const i = inp(inputs[id]);
        const nx = pl.x + i.x * this.speed * dt, ny = pl.y + i.y * this.speed * dt;
        if (!this.blocked(nx, pl.y)) pl.x = nx;
        if (!this.blocked(pl.x, ny)) pl.y = ny;
        if (pl.safe <= 0) for (const cb of this.crabs) {
          if (Math.hypot((cb.x + 0.5) * this.T - pl.x, (cb.y + 0.5) * this.T - pl.y) < this.T * 0.55) { this.ev.push({ t: 'crab', id, x: pl.x | 0, y: pl.y | 0 }); this.home(pl); break; }
        }
        if (pl.x >= (this.m.tw - 0.5) * this.T) {
          pl.st = 'fin'; pl.rank = ++this.nFin; pl.time = +(this.dur - this.left).toFixed(2);
          this.ev.push({ t: 'fin', id, rank: pl.rank, time: pl.time });
        } else active++;
      }
      if (this.left <= 0 || active === 0) { this.left = Math.max(0, this.left); this.ph = 'done'; }
    }
    takeEvents() { const e = this.ev; this.ev = []; return e; }
    snap() {
      const o = {}, cr = [];
      for (const id of this.pids) { const p = this.p[id]; o[id] = [p.x | 0, p.y | 0, p.st, p.rank, p.safe > 0 ? 1 : 0]; }
      for (const cb of this.crabs) cr.push(+((cb.x + 0.5) * this.T).toFixed(0), +((cb.y + 0.5) * this.T).toFixed(0), cb.dx);
      return { p: o, cr, left: Math.max(0, +this.left.toFixed(1)), ph: this.ph };
    }
  }

  /* ───────── 13. 땅따먹기 (큰 맵) ─────────
     맵: 96 x 54칸(한 칸 25). 칸 종류 0 보통, 1 바위(못 지나감·못 칠함), 2 느린 땅, 3 빠른 길.
     포털 두 짝, 랜드마크(★)는 칸의 절반 넘게 칠한 팀이 가져가 끝날 때 +3점.
     중·상에는 움직이는 방해꾼이 있어 땅 밖에 나온 친구나 그 선에 닿으면 선이 지워진다.
     상에서는 내 선을 내가 밟아도 끊긴다. */
  const GW = 96, GH = 54, CELL = 25, BASE = 7, TW = GW * CELL, TH = GH * CELL;
  const ITEM_KINDS = ['bolt', 'shield', 'snow', 'portal', 'paint'];
  function basesFor(nt) {
    const L = 2, R = GW - BASE - 2, T = 2, B = GH - BASE - 2, MX = ((GW - BASE) / 2) | 0;
    return nt <= 2 ? [[L, T], [R, B]] : nt === 3 ? [[L, T], [R, T], [MX, B]] : [[L, T], [R, T], [L, B], [R, B]];
  }
  // 맵 만들기: 같은 씨앗·테마·난이도·팀 수면 교실 화면과 학생 폰이 똑같은 맵을 만든다
  function terrMap(seed, theme, lv, nt, plain) {
    lv = LV(lv); nt = clamp(nt || 4, 2, 4);
    const r = rng(seed * 31 + 7), tile = new Uint8Array(GW * GH), bases = basesFor(nt);
    const idx = (x, y) => y * GW + x, inb = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH;
    const reserved = new Uint8Array(GW * GH);
    const reserve = (x0, y0, w, h, pad) => { for (let y = y0 - pad; y < y0 + h + pad; y++) for (let x = x0 - pad; x < x0 + w + pad; x++) if (inb(x, y)) reserved[idx(x, y)] = 1; };
    bases.forEach(([x, y]) => reserve(x, y, BASE, BASE, 3));
    // 랜드마크: 가운데 하나 + 양옆
    const lmSpots = [[GW / 2 - 2, GH / 2 - 2], [GW * 0.27 - 2, GH / 2 - 2], [GW * 0.73 - 2, GH / 2 - 2], [GW / 2 - 2, GH * 0.2 - 2], [GW / 2 - 2, GH * 0.8 - 2]].slice(0, plain ? 0 : [0, 3, 4, 5][lv]);
    const landmarks = lmSpots.map(([x, y]) => ({ x: x | 0, y: y | 0, w: 4, h: 4 }));
    landmarks.forEach(L => reserve(L.x, L.y, L.w, L.h, 2));
    // 포털 두 짝 (하는 한 짝)
    const portals = [];
    const pPairs = [[[GW * 0.3, GH * 0.12], [GW * 0.7, GH * 0.88]], [[GW * 0.7, GH * 0.12], [GW * 0.3, GH * 0.88]]].slice(0, plain ? 0 : lv === 1 ? 1 : 2);
    pPairs.forEach(([a, b]) => { const A = idx(a[0] | 0, a[1] | 0), B = idx(b[0] | 0, b[1] | 0); portals.push([A, B]); reserve(a[0] | 0, a[1] | 0, 1, 1, 2); reserve(b[0] | 0, b[1] | 0, 1, 1, 2); });
    const paint = (x0, y0, w, h, v, round) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        if (!inb(x, y) || reserved[idx(x, y)]) continue;
        if (round) { const nx = (x - x0 + 0.5) / w - 0.5, ny = (y - y0 + 0.5) / h - 0.5; if (nx * nx + ny * ny > 0.25 + r() * 0.04) continue; }
        if (v === 1 || !tile[idx(x, y)]) tile[idx(x, y)] = v;
      }
    };
    // 빠른 길(도시의 큰길, 바다의 해류, 밤하늘의 별똥길, 사막의 바람길)
    const lanes = plain ? 0 : [0, 1, 2, 2][lv];
    for (let k = 0; k < lanes; k++) {
      if (k % 2 === 0) { const y = (GH * (k === 0 ? 0.36 : 0.64)) | 0; paint(10, y, GW - 20, 2, 3); }
      else { const x = (GW * (k === 1 ? 0.5 : 0.25)) | 0; paint(x, 8, 2, GH - 16, 3); }
    }
    // 바위와 느린 땅: 난이도가 높을수록 많다
    const nRock = plain ? 0 : [0, 9, 17, 26][lv], nSlow = plain ? 0 : [0, 4, 7, 9][lv];
    const shape = { city: [3, 6, 3, 5, false], desert: [3, 6, 3, 6, true], sea: [3, 7, 3, 6, true], night: [3, 5, 3, 5, true] }[theme] || [3, 6, 3, 5, true];
    for (let k = 0; k < nRock; k++) {
      const w = shape[0] + ((r() * (shape[1] - shape[0] + 1)) | 0), h = shape[2] + ((r() * (shape[3] - shape[2] + 1)) | 0);
      paint(2 + ((r() * (GW - w - 4)) | 0), 2 + ((r() * (GH - h - 4)) | 0), w, h, 1, shape[4]);
    }
    for (let k = 0; k < nSlow; k++) { const s = 5 + ((r() * 4) | 0); paint(4 + ((r() * (GW - s - 8)) | 0), 4 + ((r() * (GH - s - 8)) | 0), s + 2, s, 2, true); }
    // 바위로 갇힌 빈 칸은 바위로 메운다(어디서든 걸어서 갈 수 있게)
    const seen = new Uint8Array(GW * GH), q = [idx(bases[0][0] + 1, bases[0][1] + 1)]; seen[q[0]] = 1;
    while (q.length) { const c = q.pop(), x = c % GW, y = (c / GW) | 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (!inb(nx, ny)) return; const n = idx(nx, ny); if (seen[n] || tile[n] === 1) return; seen[n] = 1; q.push(n); }); }
    for (let c = 0; c < GW * GH; c++) if (!seen[c] && tile[c] !== 1) tile[c] = 1;
    landmarks.forEach(L => { L.cells = []; for (let y = L.y; y < L.y + L.h; y++) for (let x = L.x; x < L.x + L.w; x++) L.cells.push(idx(x, y)); });
    let free = 0; for (let c = 0; c < GW * GH; c++) if (tile[c] !== 1) free++;
    return { tile, bases, landmarks, portals, free, lv, nt, theme };
  }

  class Terr {
    constructor(pids, teams, opts) {
      opts = opts || {};
      this.lv = LV(opts.lv); this.dur = opts.dur || 120; this.practice = !!opts.practice;
      this.r = rng(opts.seed || Date.now());
      let nt = opts.nt || 0; for (const id in teams) nt = Math.max(nt, (teams[id] || 0) + 1); this.nt = clamp(nt || 2, 2, 4);
      this.map = terrMap(opts.seed || 1, opts.theme || 'city', this.lv, this.nt, opts.plain);
      this.tile = this.map.tile;
      this.own = new Int8Array(GW * GH).fill(-1);
      this.trail = new Int16Array(GW * GH).fill(-1);
      this.list = []; this.p = {}; this.items = []; this.itemT = 2; this.itemId = 0;
      this.gridVer = 1; this.left = this.dur; this.ph = 'idle'; this.ev = [];
      this.map.bases.forEach(([bx, by], tm) => {
        for (let y = by; y < by + BASE; y++) for (let x = bx; x < bx + BASE; x++) this.own[y * GW + x] = tm;
      });
      // 움직이는 방해꾼
      this.haz = [];
      for (let k = 0; k < (this.practice ? 0 : [0, 0, 2, 4][this.lv]); k++) {
        for (let tries = 0; tries < 50; tries++) {
          const x = GW * (0.25 + this.r() * 0.5), y = GH * (0.2 + this.r() * 0.6);
          if (this.tile[((y | 0) * GW) + (x | 0)] === 1) continue;
          const a = this.r() * Math.PI * 2, v = this.lv === 3 ? 150 : 115;
          this.haz.push({ x: x * CELL, y: y * CELL, vx: Math.cos(a) * v, vy: Math.sin(a) * v, turn: 2 + this.r() * 3 });
          break;
        }
      }
      pids.forEach(id => this.add(id, teams[id] || 0));
    }
    add(id, tm) {
      if (this.p[id]) return;
      tm = clamp(tm || 0, 0, this.nt - 1);
      const pl = { id, idx: this.list.length, tm, x: 0, y: 0, cells: [], bolt: 0, shield: 0, slow: 0, inv: 0, pcd: 0 };
      this.list.push(pl); this.p[id] = pl; this.spawn(pl);
    }
    spawn(pl) {
      const [bx, by] = this.map.bases[pl.tm];
      pl.x = (bx + 1 + this.r() * (BASE - 2)) * CELL; pl.y = (by + 1 + this.r() * (BASE - 2)) * CELL; pl.inv = Math.max(pl.inv, 1);
    }
    start() { this.ph = 'play'; }
    solid(x, y) { if (x < 0 || y < 0 || x >= TW || y >= TH) return true; return this.tile[((y / CELL) | 0) * GW + ((x / CELL) | 0)] === 1; }
    clearTrail(pl) {
      for (const c of pl.cells) if (this.trail[c] === pl.idx) this.trail[c] = -1;
      pl.cells = [];
    }
    cut(v, by, why) {
      if (v.inv > 0) return;
      if (v.shield > 0) { v.shield = 0; v.inv = 1.2; this.ev.push({ t: 'block', id: v.id, by, x: v.x | 0, y: v.y | 0 }); return; }
      const x = v.x | 0, y = v.y | 0;
      this.clearTrail(v); this.spawn(v); this.ev.push({ t: 'cut', id: v.id, by, why, x, y });
    }
    claimCell(c, tm) { if (this.tile[c] === 1 || this.own[c] !== -1) return 0; this.own[c] = tm; return 1; }
    capture(pl) {
      const tm = pl.tm, own = this.own;
      let gained = 0;
      for (const c of pl.cells) gained += this.claimCell(c, tm);
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
      for (let c = 0; c < GW * GH; c++) if (!seen[c]) gained += this.claimCell(c, tm);
      if (gained) this.gained(pl, gained);
    }
    gained(pl, n) {
      this.gridVer++;
      this.items = this.items.filter(it => this.own[it.c] === -1);
      this.ev.push({ t: 'cap', id: pl.id, n, x: pl.x | 0, y: pl.y | 0 });
    }
    paintBomb(pl) {
      const cx = (pl.x / CELL) | 0, cy = (pl.y / CELL) | 0; let n = 0;
      for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) {
        if (x < 0 || y < 0 || x >= GW || y >= GH || (x - cx) ** 2 + (y - cy) ** 2 > 17) continue;
        const c = y * GW + x; if (this.trail[c] >= 0) continue; n += this.claimCell(c, pl.tm);
      }
      if (n) this.gained(pl, n);
    }
    spawnItem() {
      const kinds = this.practice ? ['bolt', 'shield'] : ITEM_KINDS;
      for (let tries = 0; tries < 60; tries++) {
        // 맵을 8구역으로 나눠 차례로 돌아가며 놓아 한쪽에 몰리지 않게 한다
        const zone = this.itemId % 8, zx = zone % 4, zy = (zone / 4) | 0;
        const x = ((zx + this.r()) * GW / 4) | 0, y = ((zy + this.r()) * GH / 2) | 0, c = y * GW + x;
        if (this.tile[c] === 1 || this.own[c] !== -1 || this.trail[c] !== -1 || this.items.some(i => i.c === c)) continue;
        this.items.push({ id: ++this.itemId, c, k: kinds[(this.r() * kinds.length) | 0] });
        return;
      }
      this.itemId++;
    }
    moveHaz(dt) {
      for (const h of this.haz) {
        h.turn -= dt;
        if (h.turn <= 0) { h.turn = 2 + this.r() * 3; const a = Math.atan2(h.vy, h.vx) + (this.r() - 0.5) * 1.6, v = Math.hypot(h.vx, h.vy); h.vx = Math.cos(a) * v; h.vy = Math.sin(a) * v; }
        const nx = h.x + h.vx * dt; if (this.solid(nx, h.y) || this.own[((h.y / CELL) | 0) * GW + ((nx / CELL) | 0)] >= 0 && this.inBase(nx, h.y)) h.vx = -h.vx; else h.x = nx;
        const ny = h.y + h.vy * dt; if (this.solid(h.x, ny) || this.own[((ny / CELL) | 0) * GW + ((h.x / CELL) | 0)] >= 0 && this.inBase(h.x, ny)) h.vy = -h.vy; else h.y = ny;
        // 닿은 선 지우기
        const hc = ((h.y / CELL) | 0) * GW + ((h.x / CELL) | 0);
        for (const d of [0, -1, 1, -GW, GW]) { const ti = this.trail[hc + d]; if (ti >= 0) this.cut(this.list[ti], null, 'haz'); }
        for (const pl of this.list) if (pl.cells.length && Math.hypot(pl.x - h.x, pl.y - h.y) < 34) this.cut(pl, null, 'haz');
      }
    }
    inBase(x, y) { const cx = (x / CELL) | 0, cy = (y / CELL) | 0; return this.map.bases.some(([bx, by]) => cx >= bx - 1 && cy >= by - 1 && cx < bx + BASE + 1 && cy < by + BASE + 1); }
    step(dt, inputs) {
      if (this.ph !== 'play') return;
      this.left -= dt;
      this.itemT -= dt;
      if (this.itemT <= 0) { this.itemT = this.lv === 1 ? 2 : 2.6; if (this.items.length < 12) this.spawnItem(); }
      this.moveHaz(dt);
      for (const pl of this.list) {
        ['bolt', 'shield', 'slow', 'inv', 'pcd'].forEach(k => { if (pl[k] > 0) pl[k] = Math.max(0, pl[k] - dt); });
        const i = inp(inputs[pl.id]);
        const here = this.tile[((pl.y / CELL) | 0) * GW + ((pl.x / CELL) | 0)];
        const sp = 260 * (pl.bolt > 0 ? 1.45 : 1) * (pl.slow > 0 ? 0.5 : 1) * (here === 2 ? 0.55 : here === 3 ? 1.5 : 1);
        const nx = clamp(pl.x + i.x * sp * dt, 4, TW - 4), ny = clamp(pl.y + i.y * sp * dt, 4, TH - 4);
        if (!this.solid(nx, pl.y)) pl.x = nx;
        if (!this.solid(pl.x, ny)) pl.y = ny;
        let c = ((pl.y / CELL) | 0) * GW + ((pl.x / CELL) | 0);
        // 포털: 짝 포털로 순간 이동
        if (pl.pcd <= 0) for (const [a, b] of this.map.portals) {
          const to = c === a ? b : c === b ? a : -1;
          if (to >= 0) { pl.x = (to % GW + 0.5) * CELL; pl.y = (((to / GW) | 0) + 0.5) * CELL; pl.pcd = 1.6; this.ev.push({ t: 'warp', id: pl.id, x: pl.x | 0, y: pl.y | 0 }); c = to; break; }
        }
        // 상대의 닫히지 않은 선을 밟았는가
        const ti = this.trail[c];
        if (ti >= 0 && this.list[ti].tm !== pl.tm) this.cut(this.list[ti], pl.id, 'step');
        // 상: 내 선을 내가 밟으면 끊긴다(방금 지나온 몇 칸은 빼고)
        if (this.lv === 3 && ti === pl.idx && pl.cells.length > 4 && pl.cells.indexOf(c) < pl.cells.length - 4) { this.cut(pl, pl.id, 'self'); continue; }
        // 아이템: 이 반복문에서 먼저 처리된(=교실 화면이 먼저 도착했다고 판정한) 한 명만 받는다
        const ii = this.items.findIndex(it => it.c === c);
        if (ii >= 0) {
          const it = this.items.splice(ii, 1)[0];
          this.ev.push({ t: 'item', id: pl.id, k: it.k, x: pl.x | 0, y: pl.y | 0 });
          if (it.k === 'bolt') pl.bolt = 5;
          else if (it.k === 'shield') pl.shield = 8;
          else if (it.k === 'snow') {
            for (const o of this.list) if (o.tm !== pl.tm && Math.hypot(o.x - pl.x, o.y - pl.y) < 300) { o.slow = 3; this.ev.push({ t: 'slowed', id: o.id }); }
          } else if (it.k === 'portal') { this.clearTrail(pl); this.spawn(pl); continue; }
          else if (it.k === 'paint') this.paintBomb(pl);
        }
        if (this.own[c] === pl.tm) { if (pl.cells.length) this.capture(pl); }
        else if (this.tile[c] !== 1 && pl.cells[pl.cells.length - 1] !== c) {
          if (this.trail[c] === -1) this.trail[c] = pl.idx;
          if (!pl.cells.includes(c)) pl.cells.push(c);
        }
      }
      if (this.left <= 0) { this.left = 0; this.ph = 'done'; this.list.forEach(pl => this.clearTrail(pl)); }
    }
    counts() { const n = [0, 0, 0, 0]; for (let c = 0; c < GW * GH; c++) if (this.own[c] >= 0) n[this.own[c]]++; return n.slice(0, this.nt); }
    percents() { return this.counts().map(n => +(n * 100 / this.map.free).toFixed(1)); }
    stars() {   // 랜드마크마다 칸의 절반 넘게 칠한 팀
      return this.map.landmarks.map(L => { const n = [0, 0, 0, 0]; L.cells.forEach(c => { if (this.own[c] >= 0) n[this.own[c]]++; }); const m = Math.max(...n); return m * 2 > L.cells.length ? n.indexOf(m) : -1; });
    }
    scores() { const pc = this.percents(), st = this.stars(); return pc.map((p, tm) => { const s = st.filter(o => o === tm).length; return { tm, pc: p, star: s, v: +(p + s * 3).toFixed(1) }; }); }
    gridStr() {   // 칸 주인을 줄여서 적는다: 글자 + 반복 횟수(36진수) + ','
      let s = '', prev = null, n = 0;
      for (let c = 0; c <= GW * GH; c++) {
        const ch = c === GW * GH ? null : this.own[c] < 0 ? '.' : String(this.own[c]);
        if (ch === prev) { n++; continue; }
        if (prev !== null) s += prev + n.toString(36) + ',';
        prev = ch; n = 1;
      }
      return s;
    }
    takeEvents() { const e = this.ev; this.ev = []; return e; }
    snap() {
      const o = {}, tr = [], hz = [];
      for (const pl of this.list) o[pl.id] = [pl.x | 0, pl.y | 0, pl.tm, +pl.bolt.toFixed(1), +pl.shield.toFixed(1), +pl.slow.toFixed(1)];
      for (let c = 0; c < GW * GH; c++) if (this.trail[c] >= 0) tr.push(c, this.list[this.trail[c]].tm);
      for (const h of this.haz) hz.push(h.x | 0, h.y | 0, h.vx > 0 ? 1 : -1);
      return { p: o, tr, hz, it: this.items.map(i => [i.c, i.k]), pc: this.percents(), lm: this.stars(), gv: this.gridVer, left: Math.max(0, +this.left.toFixed(1)), ph: this.ph };
    }
  }
  function gridParse(s) {   // gridStr의 반대: 칸마다 -1(빈 칸) 또는 팀 번호
    const out = new Int8Array(GW * GH).fill(-1); let i = 0;
    (s || '').split(',').forEach(tok => { if (!tok) return; const v = tok[0] === '.' ? -1 : +tok[0], n = parseInt(tok.slice(1), 36); out.fill(v, i, i + n); i += n; });
    return out;
  }
  Terr.GW = GW; Terr.GH = GH; Terr.CELL = CELL; Terr.BASE = BASE; Terr.TW = TW; Terr.TH = TH;

  /* ───────── 14. 지렁이 키우기 ─────────
     하: 느리게. 중: 보통 + 가시 5개. 상: 빠르게 + 가시 10개. 머리가 가시에 닿으면 흩어진다. */
  const MW = 2400, MH = 1350;
  class Worm {
    constructor(pids, opts) {
      opts = opts || {};
      this.lv = LV(opts.lv);
      this.dur = opts.dur || 90; this.collide = opts.collide !== false;
      this.r = rng(opts.seed || Date.now());
      this.base = 8; this.gap = 13; this.speed = [0, 150, 175, 205][this.lv]; this.turn = 4.2;
      this.w = {}; this.pids = []; this.orbs = []; this.left = this.dur; this.ph = 'idle'; this.ev = [];
      this.mines = [];
      for (let k = 0; k < (this.collide ? [0, 0, 5, 10][this.lv] : 0); k++) this.mines.push({ x: 200 + this.r() * (MW - 400), y: 200 + this.r() * (MH - 400), r: 26 });
      for (let k = 0; k < 110; k++) this.orbs.push(this.newOrb());
      pids.forEach(id => this.add(id));
    }
    newOrb() {
      for (let k = 0; k < 10; k++) { const o = { x: 40 + this.r() * (MW - 80), y: 40 + this.r() * (MH - 80), tmp: 0, big: this.r() < 0.08 ? 1 : 0 }; if (!this.mines || this.mines.every(m => Math.hypot(m.x - o.x, m.y - o.y) > 60)) return o; }
      return { x: 40 + this.r() * (MW - 80), y: 40, tmp: 0, big: 0 };
    }
    add(id) { if (this.w[id]) return; this.pids.push(id); this.w[id] = { len: this.base, dead: 0, pts: [], x: 0, y: 0, a: 0, ta: 0 }; this.place(this.w[id]); }
    place(w) {
      let best = null, bd = -1;
      for (let k = 0; k < 14; k++) {
        const x = 120 + this.r() * (MW - 240), y = 120 + this.r() * (MH - 240);
        let d = 1e9;
        for (const id of this.pids) { const o = this.w[id]; if (o !== w && !o.dead) for (let n = 0; n < o.pts.length; n += 3) d = Math.min(d, Math.hypot(o.pts[n].x - x, o.pts[n].y - y)); }
        for (const m of this.mines) d = Math.min(d, Math.hypot(m.x - x, m.y - y) * 1.5);
        if (d > bd) { bd = d; best = [x, y]; }
      }
      w.x = best[0]; w.y = best[1]; w.a = w.ta = this.r() * Math.PI * 2; w.len = this.base; w.dead = 0;
      w.pts = []; for (let k = 0; k < w.len; k++) w.pts.push({ x: w.x - Math.cos(w.a) * this.gap * k, y: w.y - Math.sin(w.a) * this.gap * k });
    }
    start() { this.ph = 'play'; }
    kill(id, why) {
      const w = this.w[id];
      this.ev.push({ t: 'die', id, why, x: w.x | 0, y: w.y | 0 });
      for (let n = 0; n < w.pts.length; n += 2) this.orbs.push({ x: clamp(w.pts[n].x, 20, MW - 20), y: clamp(w.pts[n].y, 20, MH - 20), tmp: 1, big: 0 });
      this.ov = (this.ov || 0) + 1;
      w.dead = 2; w.pts = [];
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
          const o = this.orbs[k], R = o.big ? 32 : 24;
          if (Math.abs(o.x - w.x) < R && Math.abs(o.y - w.y) < R && Math.hypot(o.x - w.x, o.y - w.y) < R) {
            w.len += o.big ? 4 : 1;
            if (o.big) this.ev.push({ t: 'big', id, x: o.x | 0, y: o.y | 0 });
            if (o.tmp) this.orbs.splice(k, 1); else this.orbs[k] = this.newOrb();
            this.ov = (this.ov || 0) + 1;
          }
        }
      }
      if (this.collide) {
        const dead = [];
        // 지렁이마다 몸을 감싸는 상자를 먼저 구해 두고, 머리가 상자 밖이면 몸 마디를 하나하나 보지 않는다(사람이 많을 때 렉 방지)
        for (const id of this.pids) {
          const o = this.w[id]; if (o.dead > 0 || !o.pts.length) { o.bb = null; continue; }
          let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
          for (const p of o.pts) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
          o.bb = [x0 - 16, y0 - 16, x1 + 16, y1 + 16];
        }
        for (const id of this.pids) {
          const w = this.w[id]; if (w.dead > 0) continue;
          if (this.mines.some(m => Math.hypot(m.x - w.x, m.y - w.y) < m.r + 8)) { dead.push([id, 'mine']); continue; }
          outer: for (const od of this.pids) {
            if (od === id) continue;
            const o = this.w[od]; if (o.dead > 0 || !o.bb || w.x < o.bb[0] || w.x > o.bb[2] || w.y < o.bb[1] || w.y > o.bb[3]) continue;
            for (let n = 0; n < o.pts.length; n++) {
              const p = o.pts[n];
              if (Math.abs(p.x - w.x) < 15 && Math.abs(p.y - w.y) < 15 && Math.hypot(p.x - w.x, p.y - w.y) < 15) { dead.push([id, 'body']); break outer; }
            }
          }
        }
        dead.forEach(([id, why]) => this.kill(id, why));
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
      const ob = []; for (const q of this.orbs) ob.push(q.x | 0, q.y | 0, q.big);
      const mn = []; for (const m of this.mines) mn.push(m.x | 0, m.y | 0);
      return { w: o, ob, mn, ov: this.ov || 0, left: Math.max(0, +this.left.toFixed(1)), ph: this.ph };
    }
    // 학생 폰으로 보내는 가벼운 상태: 몸은 마디를 건너뛰어 지렁이당 최대 약 40점, 사탕은 바뀌었을 때만 보낸다
    netSnap() {
      const o = {};
      for (const id of this.pids) {
        const w = this.w[id], pts = [], stp = Math.max(2, Math.ceil(w.pts.length / 40));
        for (let n = 0; n < w.pts.length; n += stp) pts.push(w.pts[n].x | 0, w.pts[n].y | 0);
        const tl = w.pts[w.pts.length - 1]; if (tl && (w.pts.length - 1) % stp) pts.push(tl.x | 0, tl.y | 0);
        o[id] = [w.len, w.dead > 0 ? 1 : 0, pts];
      }
      const out = { w: o, ov: this.ov || 0, left: Math.max(0, +this.left.toFixed(1)), ph: this.ph };
      if (this.sentOv !== out.ov || !this.sentMn) {
        this.sentOv = out.ov; const ob = []; for (const q of this.orbs) ob.push(q.x | 0, q.y | 0, q.big); out.ob = ob;
      }
      if (!this.sentMn || (this.netN = (this.netN || 0) + 1) % 16 === 0) { this.sentMn = 1; const mn = []; for (const m of this.mines) mn.push(m.x | 0, m.y | 0); out.mn = mn; }
      return out;
    }
  }
  Worm.MW = MW; Worm.MH = MH;

  return { W, H, LV, rng, inp, rankBy, genMaze, MAZE_SIZE, OX, RedLight, Maze, terrMap, gridParse, Terr, Worm };
});
