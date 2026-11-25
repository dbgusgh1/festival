/* 교실 화면: 게임의 심판 역할을 한다. 미공개 정답은 이 화면의 메모리에만 있고 학생 폰으로 보내지 않는다. */
async function startHost(code) {
  const base = 'rooms/' + code, app = $('#app');
  document.body.className = 'host';
  const cv = el('canvas', { id: 'cv', width: 1600, height: 900 }), qrBox = el('div', { id: 'qr' });
  const drawer = el('div', { id: 'drawer', class: 'hidden' });
  const gear = el('button', { id: 'gear', text: '⚙ 진행', onclick: () => drawer.classList.toggle('hidden') });
  app.replaceChildren(cv, qrBox, gear, drawer);
  const c = cv.getContext('2d');
  const S = { pub: { scene: 'lobby', v: 0 }, st: null, players: {}, grid: null, disp: {}, fallT: {}, born: {}, t: 0 };
  let netIn = {}, scores = {}, stats = {}, gp = {}, sim = null, paused = false, qs = [], qi = -1, opts = {}, round = 0, rounds = 1;
  let prevPlace = null, flyT0 = 0, bots = {}, lastGv = 0, pubAcc = 0, timer = null, autoTimer = null;
  let G = null, Gs = null, gtimers = [], evSeen = {}, store = {}, shared = {}, nTeams = 4, botAcc = 0, history = [];
  const uid = Net.uid();
  const t0 = Net.now();
  let ctl = { update() { } };

  const old = { meta: await Net.get(base + '/meta') };
  if (old.meta && old.meta.owner === Net.uid()) { old.sc = await Net.get(base + '/sc'); old.pub = await Net.get(base + '/pub'); }
  if (old && old.meta && old.meta.owner !== Net.uid()) { app.replaceChildren(el('div', { class: 'card', text: '다른 선생님이 쓰고 있는 방 번호예요. 처음 화면에서 새 방을 열어 주세요.' })); return; }
  if (old && old.meta) { scores = old.sc || {}; if (old.pub && old.pub.scene !== 'lobby') S.pub.scene = 'map'; S.pub.letter = (old.pub && old.pub.letter) || ''; }
  else await Net.set(base + '/meta', { owner: Net.uid(), t: t0 });
  const setPub = patch => { Object.assign(S.pub, patch); S.pub.v++; Net.set(base + '/pub', S.pub); ctl.update(); };
  setPub({});

  const joinUrl = location.origin + location.pathname + '?r=' + code + (QS.has('demo') ? '&demo' : '');
  qrBox.append(el('div', { class: 'qrimg', id: 'qrimg' }), el('div', { class: 'qrcode', text: code }), el('div', { class: 'qrurl', text: joinUrl.replace(/^https?:\/\//, '') }));
  if (window.QRCode) new QRCode($('#qrimg'), { text: joinUrl, width: 300, height: 300 }); else $('#qrimg').textContent = 'QR 대신 아래 주소와 방 번호로 들어오세요';

  const active = () => Object.keys(S.players).filter(id => S.players[id] && S.players[id].c);
  Net.on(base + '/players', v => {
    S.players = v || {};
    for (const id in S.players) if (S.players[id].bot && !bots[id]) bots[id] = { x: 0, y: 0, t: 0 };
    if (sim && S.pub.scene === 'game' && sim.add) active().forEach(id => { if (S.pub.gid === 'terr') { if (!sim.p[id]) sim.add(id, teamOf(id)); } else sim.add(id); });
    checkAuto(); ctl.update();
  });
  Net.on(base + '/in', v => (netIn = v || {}));
  Net.on(base + '/cmd', v => { if (v && v.ts > t0) cmd(v); });
  Net.on('teachers/' + uid + '/q', v => (store = v || {}));
  Net.on('shared', v => (shared = v || {}));
  Net.get('teachers/' + uid + '/rooms/' + code).then(v => (history = (v && v.games) || []));
  // 학생 폰의 입력(터치·답). 지금 받고 있는 질문(ask.key)에 대한 새 입력만 게임에 넘긴다.
  Net.on(base + '/ev', v => {
    v = v || {};
    for (const pid in v) {
      const e = v[pid]; if (!e || e.n === evSeen[pid]) continue;
      evSeen[pid] = e.n;
      if (!G || !Gs || S.pub.scene !== 'game' || !S.pub.ask || e.q !== S.pub.ask.key || !S.players[pid]) continue;
      try { G.onEv(ctx, Gs, pid, e); } catch (err) { console.error(err); }
    }
  });

  /* ── 진행자 명령 ── */
  function cmd(m) {
    const P = S.pub;
    if (G && Gs && P.scene === 'game' && G.cmd && G.cmd(ctx, Gs, m)) return;
    switch (m.t) {
      case 'target': setPub({ target: m.n || null, auto: null }); checkAuto(); break;
      case 'cancel': clearTimeout(autoTimer); setPub({ target: null, auto: null }); break;
      case 'begin': clearTimeout(autoTimer); if (P.scene === 'lobby') setPub({ scene: 'map', auto: null, target: null }); break;
      case 'go': if (GAMES[m.gid] && GAMES[m.gid].ready && P.scene !== 'lobby' && P.scene !== 'fly') fly(m.gid, m.o || {}); break;
      case 'start': if (P.scene === 'game' && (P.ph === 'intro')) countdown(); break;
      case 'pause': paused = !paused; setPub({ paused }); break;
      case 'reveal': if (P.gid === 'ox' && P.ph === 'closed') reveal(); break;
      case 'next':
        if (P.gid === 'ox' && P.ph === 'reveal') { if (qi + 1 < qs.length) countdown(); else result(); }
        else if (P.gid === 'red' && P.ph === 'roundend') { if (round < rounds) countdown(); else result(); }
        break;
      case 'look': if (sim && P.gid === 'red') sim.toggle(); break;
      case 'end': if (P.scene === 'game' && P.ph !== 'result' && (P.ph !== 'intro' || G)) { if (sim && (P.ph === 'play')) { if (P.gid === 'terr') sim.list.forEach(pl => sim.clearTrail(pl)); } result(); } break;
      case 'map': clearTimeout(timer); clearG(); sim = null; paused = false; setPub({ scene: 'map', ph: null, q: null, res: null, paused: false }); break;
      case 'finish': finish(); break;
      case 'teams': nTeams = m.n || nTeams; shuffleTeams(); break;
      case 'team': if (S.players[m.pid]) Net.set(base + '/players/' + m.pid + '/tm', ((S.players[m.pid].tm || 0) + 1) % nTeams); break;
      case 'hide': if (S.players[m.pid]) Net.set(base + '/players/' + m.pid + '/hide', S.players[m.pid].hide ? null : true); break;
      case 'kick': Net.set(base + '/players/' + m.pid, null); delete bots[m.pid]; break;
      case 'bots': for (let k = 0; k < m.n; k++) { const id = 'bot' + Math.random().toString(36).slice(2, 7); Net.set(base + '/players/' + id, { n: '시험' + (Object.keys(bots).length + k + 1), c: 1 + ((Math.random() * 9999) | 0), bot: 1 }); } break;
      case 'nobots': Object.keys(bots).forEach(id => Net.set(base + '/players/' + id, null)); bots = {}; break;
      case 'letter': setPub({ letter: String(m.text || '').slice(0, 80) }); break;
    }
  }
  function checkAuto() {
    const P = S.pub;
    if (P.scene !== 'lobby' || !P.target || P.auto || active().length < P.target) return;
    setPub({ auto: Net.now() + 10000 });
    autoTimer = setTimeout(() => cmd({ t: 'begin' }), 10000);
  }
  const teamOf = id => { const p = S.players[id]; if (p && p.tm != null) return p.tm; const n = Array(nTeams).fill(0); active().forEach(i => { const q = S.players[i]; if (q.tm != null && q.tm < nTeams) n[q.tm]++; }); const tm = n.indexOf(Math.min(...n)); Net.set(base + '/players/' + id + '/tm', tm); if (p) p.tm = tm; return tm; };
  function shuffleTeams() { const ids = active().sort(() => Math.random() - 0.5); ids.forEach((id, k) => { S.players[id].tm = k % nTeams; Net.set(base + '/players/' + id + '/tm', k % nTeams); }); }

  /* ── 여행지로 이동 → 게임 준비 ── */
  function fly(gid, o) {
    clearTimeout(timer); clearG(); sim = null; S.st = null; paused = false; opts = o; flyT0 = S.t;
    setPub({ scene: 'fly', gid, from: prevPlace, ph: null, q: null, res: null, ans: null, paused: false, practice: !!o.practice });
    timer = setTimeout(() => setup(gid), 3400);
  }
  const GKEYS = ['mole', 'beat', 'tq', 'tres', 'tqz', 'dist', 'ans', 'mem', 'memq', 'memans', 'rk', 'zm', 'ten', 'sq', 'sres', 'mb', 'df', 'ask', 'can', 'canLabel', 'until', 'q', 'res', 'cnt', 'ex'];
  function clearG() { gtimers.forEach(clearTimeout); gtimers = []; G = null; Gs = null; S.launchT = null; if (S.priv && Object.keys(S.priv).length) ctx.priv({}); }
  function setup(gid) {
    if (GAMEDEF[gid]) {
      const reset = {}; GKEYS.forEach(k => (reset[k] = null));
      S.disp = {}; S.st = null; prevPlace = gid; G = GAMEDEF[gid];
      setPub(Object.assign(reset, { scene: 'game', gid, ph: 'intro' }));
      Gs = G.setup(ctx);
      return;
    }
    const ids = active(), seed = 1 + ((Math.random() * 1e9) | 0), pr = !!opts.practice; let theme = null;
    S.disp = {}; S.fallT = {}; gp = {}; round = 0; rounds = 1; qi = -1; lastGv = 0; S.grid = null;
    if (gid === 'ox') {
      sim = new Sim.OX(ids);
      qs = pr ? [OX_PRACTICE] : ctx.pool('ox', opts.n || 5);
    } else if (gid === 'red') { rounds = pr ? 1 : (opts.rounds || 3); sim = new Sim.RedLight(ids, { auto: opts.auto !== false, dur: pr ? 25 : 40, seed }); }
    else if (gid === 'maze') sim = new Sim.Maze(ids, { seed, dur: pr ? 45 : (opts.dur || 90) });
    else if (gid === 'terr') {
      const tm = {}; ids.forEach(id => (tm[id] = teamOf(id)));
      theme = THEMES[opts.theme] ? opts.theme : Object.keys(THEMES)[(Math.random() * 4) | 0];
      sim = new Sim.Terr(ids, tm, { seed, dur: pr ? 45 : (opts.dur || 120), practice: pr });
    } else if (gid === 'worm') sim = new Sim.Worm(ids, { seed, dur: pr ? 40 : (opts.dur || 90), collide: opts.collide !== false });
    pushState(true); prevPlace = gid;
    setPub({ scene: 'game', gid, ph: 'intro', seed, theme, round: 0, rounds, manual: gid === 'red' && opts.auto === false, collide: opts.collide !== false });
  }
  function countdown() {
    setPub({ ph: 'count', t: Net.now() + 3500 });
    timer = setTimeout(begin, 3500);
  }
  function begin() {
    const gid = S.pub.gid; S.fallT = {};
    if (G) { G.begin(ctx, Gs); return; }
    if (gid === 'ox') { qi++; const q = qs[qi]; sim.startQ(15); setPub({ ph: 'play', q: { text: q.q, n: qi + 1, total: qs.length }, ans: null, ex: null, cnt: null }); }
    else if (gid === 'red') { round++; sim.start(); setPub({ ph: 'play', round }); }
    else { sim.start(); setPub({ ph: 'play' }); }
    for (const id in bots) bots[id].side = Math.random() < 0.45 ? -1 : Math.random() < 0.85 ? 1 : 0;
  }
  const stat = (id, k) => { (stats[id] = stats[id] || {})[k] = (stats[id][k] || 0) + 1; };
  const tell = (id, m) => { if (!bots[id]) Net.set(base + '/pv/' + id, Object.assign({ ts: Net.now() }, m)); };
  function reveal() {
    const q = qs[qi], res = sim.grade(q.a);
    res.correct.forEach(id => { if (!S.pub.practice) { scores[id] = (scores[id] || 0) + 10; gp[id] = (gp[id] || 0) + 10; Net.set(base + '/sc/' + id, scores[id]); } tell(id, { k: 'ox', r: 'right' }); });
    res.wrong.forEach(id => tell(id, { k: 'ox', r: 'wrong' }));
    res.fell.forEach(id => { stat(id, 'fall'); tell(id, { k: 'ox', r: 'fell' }); });
    let o = 0, x = 0; Object.values(sim.p).forEach(p => { if (p.ans === 'O') o++; else if (p.ans === 'X') x++; });
    pushState(true); setPub({ ph: 'reveal', ans: q.a, ex: q.ex || '', cnt: { o, x, f: res.fell.length } });
  }
  function result() {
    clearTimeout(timer);
    const gid = S.pub.gid, ids = active(); let res;
    if (G) { gtimers.forEach(clearTimeout); gtimers = []; res = G.end(ctx, Gs); if (S.priv && Object.keys(S.priv).length) ctx.priv({}); }
    else if (gid === 'ox') res = { type: 'solo', title: '이번 OX 점수', unit: '점', rows: Sim.rankBy(ids.map(id => ({ id, v: gp[id] || 0 })), o => o.v, true) };
    else if (gid === 'red') res = { type: 'solo', title: '골인 횟수', unit: '번 골인', rows: Sim.rankBy(ids.map(id => ({ id, v: gp[id] || 0 })), o => o.v, true) };
    else if (gid === 'maze') { const p = sim.p; res = { type: 'solo', title: '보물 찾은 순서', unit: '초', rows: ids.filter(id => p[id] && p[id].st === 'fin').sort((a, b) => p[a].rank - p[b].rank).map(id => ({ id, v: p[id].time, rank: p[id].rank })), rest: ids.filter(id => !p[id] || p[id].st !== 'fin').length }; }
    else if (gid === 'terr') { const pc = sim.percents(); res = { type: 'team', title: '점령률', rows: Sim.rankBy(pc.map((v, tm) => ({ tm, v })), o => o.v, true) }; }
    else if (gid === 'worm') res = { type: 'solo', title: '지렁이 길이', unit: '', rows: sim.ranking().map(o => ({ id: o.id, v: o.len, rank: o.rank })) };
    if (res.type === 'solo') res.rows.forEach(r => tell(r.id, { k: 'res', rank: r.rank, v: r.v, unit: res.unit }));
    else if (res.type === 'team') ids.forEach(id => { const tm = S.players[id].tm, r = res.rows.find(o => o.tm === tm); if (r) tell(id, { k: 'res', rank: r.rank, v: r.label || r.v, unit: r.label ? '' : '%', team: tm }); });
    else if (res.type === 'class') ids.forEach(id => tell(id, { k: 'msg', b: res.big, s: '우리 반 기록', c: 'green' }));
    else if (res.type === 'lottery') ids.forEach(id => tell(id, res.ids.includes(id) ? { k: 'msg', b: '당첨!', s: '행운의 주인공', c: 'green' } : { k: 'msg', b: '아쉽지만 다음 기회에', s: '', c: '' }));
    record(gid, res);
    ids.forEach(id => stat(id, 'games'));
    if (res.type === 'solo') res.rows = res.rows.slice(0, 10);
    sim = null; paused = false; pushState(true);
    setPub({ ph: 'result', res, paused: false });
  }
  function record(gid, res) {
    const top = res.type === 'team' ? res.rows.slice(0, 3).map(r => TEAM[r.tm].n + '팀') : res.type === 'class' ? [res.big] : (res.rows || res.ids || []).slice(0, 3).map(r => ctx.name(r.id || r));
    history.push({ gid, t: Net.now(), practice: !!S.pub.practice, top });
    Net.set('teachers/' + uid + '/rooms/' + code, { t: t0, n: active().length, games: history.slice(-40) });
  }
  function finish() {
    clearTimeout(timer); clearG(); sim = null;
    active().forEach(id => tell(id, { k: 'end', st: stats[id] || {}, sc: scores[id] || 0 }));
    setPub({ scene: 'end', ph: null, res: null, q: null });
  }

  /* ── 시험용 가상 참가자의 조이스틱 ── */
  function botInputs(dt) {
    const gid = S.pub.gid, out = {};
    for (const id in bots) {
      const b = bots[id]; b.t -= dt;
      if (gid === 'ox') { const p = sim.p[id]; if (!p) continue; const tx = b.side < 0 ? 300 : b.side > 0 ? 1300 : 800; if (b.t <= 0) { b.t = 0.4; b.x = Math.abs(tx - p.x) < 60 ? 0 : Math.sign(tx - p.x); b.y = Math.random() - 0.5; } }
      else if (gid === 'red') { if (sim.it === 'look') { if (!b.slow) { b.slow = 1; b.t = Math.random() < 0.85 ? 0.15 : 1; } if (b.t <= 0) { b.x = 0; b.y = 0; } } else { b.slow = 0; b.x = 1; b.y = Math.sin(S.t + id.length) * 0.2; } }
      else if (b.t <= 0) { b.t = 0.4 + Math.random() * 1.2; const a = Math.random() * 6.28; b.x = Math.cos(a) + (gid === 'maze' ? 0.3 : 0); b.y = Math.sin(a); }
      out[id] = { x: b.x, y: b.y };
    }
    return out;
  }
  function pushState(force) {
    if (!sim) { if (force) Net.set(base + '/st', S.st); return; }
    S.st = sim.snap();
    if (S.pub.gid === 'terr' && sim.gridVer !== lastGv) { lastGv = sim.gridVer; S.grid = { v: lastGv, s: sim.gridStr() }; Net.set(base + '/grid', S.grid); }
    if (force) Net.set(base + '/st', S.st);
  }
  /* ── 판정 루프: 1초에 20번 계산, 학생 폰으로는 1초에 8번 보낸다 ── */
  let last = performance.now();
  setInterval(() => {
    const now = performance.now(), dt = Math.min(1, (now - last) / 1000); last = now;
    const P = S.pub;
    if (G && Gs && P.scene === 'game' && !paused && P.ph !== 'intro' && P.ph !== 'count' && P.ph !== 'result') {
      try {
        if (G.tick) G.tick(ctx, Gs, dt);
        botAcc += dt; if (G.bot && botAcc > 0.25) { botAcc = 0; for (const id in bots) if (S.players[id]) G.bot(ctx, Gs, id); }
      } catch (err) { console.error(err); }
      return;
    }
    if (!sim || P.scene !== 'game' || P.ph !== 'play' || paused) return;
    // 컴퓨터가 잠깐 버벅여도 게임 시계가 늦어지지 않도록, 밀린 시간은 0.05초씩 나눠 한꺼번에 계산한다
    const all = Object.assign({}, netIn, botInputs(dt));
    for (let rest = dt; rest > 0.0001; rest -= 0.05) sim.step(Math.min(0.05, rest), all);
    pushState(false);
    pubAcc += dt; if (pubAcc >= 0.125) { pubAcc = 0; Net.set(base + '/st', S.st); }
    const gid = P.gid;
    (sim.takeEvents ? sim.takeEvents() : []).forEach(e => {
      if (gid === 'red') { if (e.t === 'out') { stat(e.id, 'out'); tell(e.id, { k: 'out' }); beep(180, 0.25, 'sawtooth'); } else { gp[e.id] = (gp[e.id] || 0) + 1; stat(e.id, 'fin'); tell(e.id, { k: 'fin', rank: e.rank }); beep(880, 0.12); } }
      else if (gid === 'maze') { stat(e.id, 'fin'); tell(e.id, { k: 'fin', rank: e.rank }); beep(880, 0.12); }
      else if (gid === 'terr') { if (e.t === 'cut') { stat(e.id, 'cut'); tell(e.id, { k: 'cut' }); } else if (e.t === 'block') tell(e.id, { k: 'block' }); else if (e.t === 'item') tell(e.id, { k: 'item', it: e.k }); else if (e.t === 'slowed') tell(e.id, { k: 'slowed' }); }
      else if (gid === 'worm' && e.t === 'die') { stat(e.id, 'die'); tell(e.id, { k: 'die' }); }
    });
    if (gid === 'ox' && sim.ph === 'closed') { pushState(true); setPub({ ph: 'closed' }); beep(140, 0.5, 'sawtooth'); }
    else if (gid === 'red' && sim.ph === 'done') { pushState(true); setPub({ ph: 'roundend' }); }
    else if (sim.ph === 'done') result();
  }, 50);

  /* 터치·퀴즈·그림 게임(games2.js)이 쓰는 도구 모음 */
  const DEF = { ox: () => OX_DEFAULT, tq: () => TQ_DEFAULT, taste: () => TASTE_DEFAULT, solo: () => SOLO_DEFAULT };
  const ctx = {
    S, P: () => S.pub, setPub, now: () => Net.now(), active, get opts() { return opts; }, get practice() { return !!opts.practice; },
    name: id => (S.players[id] ? nameOf(S.players[id]) : '?'),
    tell, stat, beep: (f, d, t) => beep(f, d, t), teamOf,
    score(id, n) { if (opts.practice || !S.players[id]) return; scores[id] = (scores[id] || 0) + n; Net.set(base + '/sc/' + id, scores[id]); },
    after(ms, fn) { const h = setTimeout(() => { gtimers = gtimers.filter(x => x !== h); try { fn(); } catch (err) { console.error(err); } }, ms); gtimers.push(h); return h; },
    done() { if (S.pub.ph !== 'result') result(); },
    ask(a) { a.key = Math.random().toString(36).slice(2, 9); setPub({ ask: a }); },
    askClose() { if (S.pub.ask) setPub({ ask: Object.assign({}, S.pub.ask, { closed: true }) }); },
    priv(o) { S.priv = o; Net.set(base + '/priv', o); ctl.update(); },
    setImg: o => Net.set(base + '/img', o),
    pool(type, n) {
      const mine = Object.values((store[type] || {})), sh = Object.values((shared[type] || {})), d = DEF[type]();
      let p = opts.src === 'mine' ? mine : opts.src === 'shared' ? sh : opts.src === 'mix' ? d.concat(mine, sh) : d;
      if (!p.length) p = d;
      return shuffle(p).slice(0, n);
    },
    photos: type => Object.entries(store[type] || {}).map(([id, v]) => Object.assign({ id }, v)),
    loadImg: id => Net.get('teachers/' + uid + '/img/' + id).then(url => new Promise(res => { if (!url) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; })),
    botEv(id, e) { const now = Net.now(); try { G.onEv(ctx, Gs, id, Object.assign({ at: now, ct: now, n: Math.random(), q: S.pub.ask && S.pub.ask.key }, e)); } catch (err) { console.error(err); } }
  };

  let ac; function beep(f, d, type) { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = 0.08; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) { } }

  /* ── 그리기 ── */
  function fit() { const s = Math.min(innerWidth / 1600, innerHeight / 900); cv.style.width = 1600 * s + 'px'; cv.style.height = 900 * s + 'px'; qrBox.style.transform = `scale(${s})`; qrBox.style.left = (innerWidth - 1600 * s) / 2 + 60 * s + 'px'; qrBox.style.top = (innerHeight - 900 * s) / 2 + 250 * s + 'px'; }
  addEventListener('resize', fit); fit();
  let lastCount = -1;
  function frame(ms) {
    S.t = ms / 1000; const P = S.pub, t = S.t;
    qrBox.style.display = P.scene === 'lobby' ? '' : 'none';
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (P.scene === 'lobby') {
      drawClassroom(c, S, null, 1010, 1040); const n = active().length;
      txt(c, '우리 반 게임 페스티벌', 800, 150, 84, '#fff', 'center', '#1d4f3a'); txt(c, 'QR을 찍고 포춘쿠키를 깨뜨려 내 캐릭터를 뽑아요', 800, 250, 38, '#fff7c2');
      txt(c, `입장 ${n}명` + (P.target ? ` / 목표 ${P.target}명` : ''), 800, 315, 40, '#fff');
      if (P.auto) { const s = Math.max(0, Math.ceil((P.auto - Net.now()) / 1000)); rr(c, 500, 380, 600, 150, 30, '#ff5a5f', '#2b2118', 6); txt(c, `${s}초 뒤 출발!`, 800, 455, 80, '#fff'); if (s !== lastCount) { lastCount = s; beep(660, 0.08); } }
    } else if (P.scene === 'map') drawWorld(c, S, GAMES, prevPlace, null, 0);
    else if (P.scene === 'fly') drawWorld(c, S, GAMES, P.from, P.gid, Math.min(1, (t - flyT0) / 3.2));
    else if (P.scene === 'end') {
      drawClassroom(c, S, 'laugh'); txt(c, '여행 끝! 교실에 돌아왔어요', 800, 140, 80, '#fff', 'center', '#1d4f3a'); txt(c, '폰에 도착한 포춘쿠키를 깨뜨려 행운의 편지를 읽어요', 800, 245, 38, '#fff7c2');
      if (P.letter) { rr(c, 250, 290, 1100, 60, 20, '#fff'); txt(c, '선생님의 한마디: ' + P.letter, 800, 322, 30, '#2b2118'); }
    } else if (P.scene === 'game') {
      const g = P.gid;
      if (G) { try { G.draw(c, S, Gs, ctx); } catch (err) { console.error(err); } }
      else if (g === 'ox') drawOX(c, S); else if (g === 'red') drawRed(c, S); else if (g === 'maze') { c.fillStyle = '#1e7fd6'; c.fillRect(0, 0, 1600, 900); drawMaze(c, S); hudMaze(c, S); }
      else if (g === 'terr') { drawTerr(c, S); hudTerr(c, S); } else if (g === 'worm') { c.save(); c.scale(1600 / 2400, 900 / 1350); drawWorm(c, S); c.restore(); hudWorm(c, S); }
      if (P.practice) { rr(c, 20, 830, 170, 54, 16, '#ffd400', '#2b2118', 4); txt(c, '연습판', 105, 858, 32, '#2b2118'); }
      if (P.ph === 'intro') overlayIntro(P); else if (P.ph === 'count') overlayCount(P); else if (P.ph === 'result') overlayResult(P);
      if (P.paused) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, 1600, 900); txt(c, '잠깐 멈춤', 800, 450, 140, '#fff'); }
    }
    requestAnimationFrame(frame);
  }
  function overlayIntro(P) {
    const g = GAMES[P.gid]; c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 0, 1600, 900);
    rr(c, 250, 150, 1100, 600, 40, '#fff', '#2b2118', 8);
    txt(c, `${g.icon} ${g.place}`, 800, 215, 40, '#ff5a5f'); txt(c, g.name + (P.practice ? ' · 연습판' : ''), 800, 290, 66, '#222');
    (RULES[P.gid] || []).forEach((r, k) => txt(c, '· ' + r, 340, 395 + k * 70, 42, '#333', 'left'));
    if (P.gid === 'terr' && P.theme) txt(c, '오늘의 맵: ' + THEMES[P.theme].name, 800, 700, 36, '#3d8bff');
  }
  function overlayCount(P) {
    const s = Math.ceil((P.t - Net.now()) / 1000);
    txt(c, s > 0 ? s : '출발!', 800, 470, 380, '#fff', 'center', '#2b2118');
    if (s !== lastCount) { lastCount = s; beep(s > 0 ? 520 : 880, 0.12); }
  }
  function overlayResult(P) {
    const R = P.res; if (!R) return; const t = S.t;
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, 1600, 900);
    rr(c, 200, 60, 1200, 780, 40, '#fff', '#2b2118', 8);
    txt(c, ({ team: '팀 결과 · ', class: '반 전체 기록 · ', lottery: '행운 추첨 · ' }[R.type] || '개인 결과 · ') + R.title, 800, 125, 56, '#222');
    const rows = R.rows || [];
    if (R.type === 'class') { txt(c, R.big, 800, 300, 96, '#e63946'); (R.lines || []).forEach((l, k) => txt(c, l, 800, 420 + k * 64, 40, '#444')); dressedCrowd(c, S, 780, 'party', 'laugh'); }
    else if (R.type === 'lottery') {
      const ids = R.ids || [], n = ids.length, cols = Math.min(5, n || 1);
      ids.forEach((id, k) => { const pl = S.players[id]; if (!pl) return; const x = 800 + ((k % cols) - (cols - 1) / 2) * 220, y = 300 + ((k / cols) | 0) * 200; drawChar(c, x, y, 50, pl.c, { face: 'laugh', hat: 'party', bob: -Math.abs(Math.sin(t * 5 + k)) * 14 }); txt(c, `${k + 1}. ${nameOf(pl)}`, x, y + 84, 34, '#e63946'); });
      if (!n) txt(c, '아직 골인한 구슬이 없어요', 800, 400, 44, '#888');
    }
    else if (R.type === 'team') rows.forEach((r, k) => {
      const y = 230 + k * 140, T = TEAM[r.tm]; rr(c, 300, y, 1000, 110, 24, '#f3f3f3'); rr(c, 300, y, Math.max(120, 1000 * r.v / Math.max(1, rows[0].v || 1)), 110, 24, T.c);
      txt(c, `${r.rank}등  ${T.s} ${T.n}팀`, 330, y + 56, 50, '#fff', 'left', 'rgba(0,0,0,.4)'); txt(c, r.label || r.v + '%', 1270, y + 56, 48, '#222', 'right', '#fff');
    });
    else {
      rows.slice(0, 3).forEach((r, k) => { const pl = S.players[r.id]; if (!pl) return; const x = [800, 480, 1120][k], y = [300, 330, 330][k]; drawChar(c, x, y, [70, 54, 54][k], pl.c, { face: 'laugh', hat: 'party', bob: -Math.abs(Math.sin(t * 5 + k)) * 16 }); txt(c, `${r.rank}등 ${nameOf(pl)}`, x, y + 110, 40, '#222'); txt(c, r.v + (R.unit || ''), x, y + 156, 32, '#ff5a5f'); });
      rows.slice(3, 10).forEach((r, k) => { const pl = S.players[r.id]; if (!pl) return; const x = 300 + (k % 2) * 520, y = 540 + ((k / 2) | 0) * 62; drawChar(c, x, y, 20, pl.c, {}); txt(c, `${r.rank}등 ${nameOf(pl)}`, x + 40, y, 32, '#222', 'left'); txt(c, r.v + (R.unit || ''), x + 440, y, 28, '#888', 'right'); });
      if (!rows.length) txt(c, '아직 기록이 없어요', 800, 400, 44, '#888');
      if (R.rest) txt(c, `아직 미로 안에 ${R.rest}명`, 800, 800, 30, '#888');
    }
    if (R.cls) { rr(c, 400, 760, 800, 64, 20, '#ffd400', '#2b2118', 4); txt(c, R.cls, 800, 792, 34, '#2b2118'); }
  }

  ctl = buildControl(drawer, { screen: true, code, send: cmd, S, active });
  drawer.append(el('div', { class: 'hint', text: '선생님 폰으로 조종하려면 폰에서 같은 계정으로 로그인한 뒤 주소 끝에 ?ctl=' + code + ' 를 붙여 여세요. 내 OX 문제는 그 화면과 선생님 첫 화면에서 관리해요.' }));
  requestAnimationFrame(frame);
  window.__host = { S, cmd, getSim: () => sim, gs: () => Gs };   // 자동 시험용
}
