/* 교실 화면: 게임의 심판 역할을 한다. 미공개 정답은 이 화면의 메모리에만 있고 학생 폰으로 보내지 않는다. */
async function startHost(code) {
  const base = 'rooms/' + code, app = $('#app');
  document.body.className = 'host';
  const cv = el('canvas', { id: 'cv', width: 1600, height: 900 }), qrBox = el('div', { id: 'qr' }), qrMini = el('div', { id: 'qrmini' });
  const drawer = el('div', { id: 'drawer', class: 'hidden' });
  const gear = el('button', { id: 'gear', text: '⚙ 진행', onclick: () => drawer.classList.toggle('hidden') });
  const ox3box = el('div', { id: 'ox3box' });
  // 노트북에서 방을 연 직후에만 보이는 작은 안내: 조종판을 노트북 화면용 새 창으로 연다. 조종판이 연결되면 저절로 사라진다
  const openCtl = () => { const w = window.open(appUrl('?ctl=' + code), 'fest_ctl_' + code, 'width=720,height=900'); if (!w) ctlErr.textContent = '새 창이 막혔어요. 주소창 오른쪽의 팝업 허용을 눌러 주세요.'; };
  const ctlErr = el('div', { class: 'err' });
  const ctlHelp = el('div', { id: 'ctlhelp' }, [el('b', { text: '전광판 + 노트북 조종판으로 진행하기' }),
    el('div', { class: 'hint', text: '① 조종판 열기 → ② 이 창을 빔·TV 화면으로 옮기고 F11 → ③ 노트북에 둔 조종판으로 진행' }),
    el('button', { class: 'b pri', text: '🖥 조종판 새 창으로 열기', onclick: openCtl }), ctlErr,
    el('button', { class: 'b link', text: '이 안내 닫기 (⚙ 진행 버튼으로 진행)', onclick: () => { ctlHelp.remove(); } })]);
  app.replaceChildren(ox3box, cv, qrBox, qrMini, gear, drawer, ctlHelp);
  let ctlSeen = 0; const ctlOn = () => ctlSeen && Net.now() - ctlSeen < 9000;
  const c = cv.getContext('2d');
  const S = { pub: { scene: 'lobby', v: 0 }, st: null, players: {}, grid: null, disp: {}, fallT: {}, born: {}, t: 0, visited: {} };
  FX.on = true;
  const LVOF = o => (o.lv === 1 || o.lv === 3 ? o.lv : 2);
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

  const joinUrl = appUrl('?r=' + code);
  qrBox.append(el('div', { class: 'qrimg', id: 'qrimg' }), el('div', { class: 'qrcode', text: code }), el('div', { class: 'qrurl', text: joinUrl.replace(/^https?:\/\//, '') }));
  if (window.QRCode) new QRCode($('#qrimg'), { text: joinUrl, width: 300, height: 300 }); else $('#qrimg').textContent = 'QR 대신 아래 주소와 방 번호로 들어오세요';
  // 중간 참가·다시 들어오기용 작은 QR: 지도 화면에서는 저절로, 게임 중에는 조종판의 "입장 QR 띄우기"로 보인다
  const qmImg = el('div', { class: 'qmimg' });
  qrMini.append(el('b', { text: '중간에 들어오기' }), qmImg, el('div', { class: 'qmcode', text: '방 ' + code }));
  if (window.QRCode) new QRCode(qmImg, { text: joinUrl, width: 118, height: 118 }); else qmImg.textContent = joinUrl.replace(/^https?:\/\//, '');
  // 학생 폰에 "교실 화면이 살아 있어요"를 2초마다 알린다(폰은 이게 끊기면 '연결이 늦어요'와 다시 연결 버튼을 보여 준다)
  setInterval(() => { if (cv.isConnected) Net.set(base + '/meta/hb', Net.now()); }, 2000);

  const active = () => Object.keys(S.players).filter(id => S.players[id] && S.players[id].c);
  /* 다시 들어오기: 다른 브라우저로 새로 들어온 학생이 "전에 들어왔던 내 캐릭터"를 고르면(claim)
     나가 있던 예전 자리의 캐릭터·점수·기록·팀·지금 게임 속 위치를 새 폰으로 옮긴다 */
  function renameIn(o, a, b, d) {
    if (!o || typeof o !== 'object' || d > 2 || ArrayBuffer.isView(o)) return;
    if (Array.isArray(o)) { for (let k = 0; k < o.length; k++) { const v = o[k]; if (v === a) o[k] = b; else if (v && typeof v === 'object') { if (v.id === a) v.id = b; renameIn(v, a, b, d + 1); } } return; }
    for (const key of Object.keys(o)) { const v = o[key]; if (key === a) { o[b] = v; delete o[key]; } if (v && typeof v === 'object') renameIn(v, a, b, d + 1); }
  }
  function claim(nw, old) {
    const o = S.players[old], me = S.players[nw];
    if (!o || o.bot || o.on !== false || !o.c) { Net.set(base + '/players/' + nw + '/claim', null); return; }
    const rec = Object.assign({}, o, { on: true });
    for (const m of [scores, stats, gp, netIn, evSeen]) if (m && m[old] != null) { m[nw] = m[old]; delete m[old]; }
    try { if (sim) renameIn(sim, old, nw, 0); if (Gs) renameIn(Gs, old, nw, 0); renameIn(S.disp, old, nw, 1); } catch (e) { console.warn('자리 옮기기', e); }
    S.players[nw] = rec; delete S.players[old];
    Net.set(base + '/players/' + old, null); Net.set(base + '/players/' + nw, rec);   // 예전 자리를 먼저 지워야 게임에 다시 끼어들지 않는다
    Net.set(base + '/sc/' + nw, scores[nw] || 0); Net.set(base + '/sc/' + old, null);
    tell(nw, { k: 'msg', b: `${o.n}(으)로 다시 들어왔어요`, s: `점수 ${scores[nw] || 0}점 그대로`, c: 'green' });
    void me;
  }
  Net.on(base + '/players', v => {
    S.players = v || {};
    for (const id in S.players) if (S.players[id] && S.players[id].claim) claim(id, S.players[id].claim);
    for (const id in S.players) if (S.players[id].bot && !bots[id]) bots[id] = { x: 0, y: 0, t: 0 };
    if (sim && S.pub.scene === 'game' && sim.add) active().forEach(id => { if (S.pub.gid === 'terr') { if (!sim.p[id]) sim.add(id, teamOf(id)); } else sim.add(id); });
    checkAuto(); ctl.update();
  });
  Net.on(base + '/in', v => (netIn = v || {}));
  Net.on(base + '/meta/ctl', v => (ctlSeen = v || 0));
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
      if (sim && S.pub.scene === 'game' && S.pub.gid === 'ox' && S.players[pid]) { oxEv(pid, e); continue; }
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
      case 'pause': paused = !paused; if (paused) hush(); setPub({ paused }); break;
      case 'qr': setPub({ qr: !P.qr }); break;
      case 'reveal': if (P.gid === 'ox' && P.ph === 'closed' && sim) sim.ph = 'judge'; break;
      case 'close': if (P.gid === 'ox' && P.ph === 'play' && sim) sim.close(); break;
      case 'next':
        if (P.gid === 'ox' && P.ph === 'reveal') { clearTimeout(timer); oxNext(); }
        else if (P.gid === 'red' && P.ph === 'roundend') { if (round < rounds) countdown(); else result(); }
        break;
      case 'look': if (sim && P.gid === 'red') sim.toggle(); break;
      case 'end': if (P.scene === 'game' && P.ph !== 'result' && (P.ph !== 'intro' || G)) { if (sim && (P.ph === 'play')) { if (P.gid === 'terr') sim.list.forEach(pl => sim.clearTrail(pl)); } result(); } break;
      case 'map': clearTimeout(timer); hush(); clearG(); sim = null; paused = false; setPub({ scene: 'map', ph: null, q: null, res: null, paused: false }); break;
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
    FX.clear();
    setPub({ scene: 'fly', gid, from: prevPlace, ph: null, q: null, res: null, ans: null, paused: false, practice: !!o.practice, lv: LVOF(o) });
    timer = setTimeout(() => setup(gid), 3400);
  }
  const GKEYS = ['mole', 'beat', 'tq', 'tres', 'tqz', 'dist', 'ans', 'mem', 'memq', 'memans', 'zm', 'ten', 'sq', 'sres', 'mb', 'df', 'ask', 'can', 'canLabel', 'until', 'q', 'res', 'cnt', 'ex'];
  function clearG() { gtimers.forEach(clearTimeout); gtimers = []; G = null; Gs = null; S.launchT = null; if (S.priv && Object.keys(S.priv).length) ctx.priv({}); }
  function setup(gid) {
    if (GAMEDEF[gid]) {
      const reset = {}; GKEYS.forEach(k => (reset[k] = null));
      S.disp = {}; S.st = null; prevPlace = gid; G = GAMEDEF[gid];
      setPub(Object.assign(reset, { scene: 'game', gid, ph: 'intro', lv: LVOF(opts) }));
      Gs = G.setup(ctx);
      return;
    }
    const ids = active(), seed = 1 + ((Math.random() * 1e9) | 0), pr = !!opts.practice, lv = LVOF(opts); let theme = null, nt = null, mz = null;
    S.disp = {}; S.fallT = {}; gp = {}; round = 0; rounds = 1; qi = -1; lastGv = 0; S.grid = null;
    if (gid === 'ox') {
      sim = new Sim.OX(ids, { seed, revives: opts.rev != null ? +opts.rev : 1 });
      qs = pr ? [OX_PRACTICE] : ctx.pool('ox', opts.n || 10);
      OX3D.load(); OX3D.reset(); oxBots = {};
    } else if (gid === 'red') { rounds = pr ? 1 : (opts.n || opts.rounds || 3); sim = new Sim.RedLight(ids, { auto: opts.auto !== false, dur: pr ? 25 : 40, seed, lv }); }
    else if (gid === 'maze') { sim = new Sim.Maze(ids, { seed, lv, tight: !!+opts.tight, dur: pr ? 45 : (opts.dur || 300) }); mz = [sim.cw, sim.ch, sim.tight ? 1 : 0]; }
    else if (gid === 'terr') {
      const tm = {}; ids.forEach(id => (tm[id] = teamOf(id) % nTeams));
      theme = THEMES[opts.theme] ? opts.theme : Object.keys(THEMES)[(Math.random() * 4) | 0];
      sim = new Sim.Terr(ids, tm, { seed, theme, lv, nt: nTeams, dur: pr ? 45 : (opts.dur || 150), practice: pr }); nt = sim.nt;
    } else if (gid === 'worm') sim = new Sim.Worm(ids, { seed, lv, dur: pr ? 40 : (opts.dur || 90), collide: opts.collide !== false });
    S.board = null; pushState(true); prevPlace = gid;
    setPub({ scene: 'game', gid, ph: 'intro', seed, theme, nt, mz, lv, round: 0, rounds, qdur: gid === 'ox' && +opts.time ? +opts.time : [0, 15, 10, 7][lv], rdur: 40, manual: gid === 'red' && opts.auto === false, collide: opts.collide !== false });
  }
  function countdown() {
    setPub({ ph: 'count', t: Net.now() + 3500 });
    timer = setTimeout(begin, 3500);
  }
  function begin() {
    const gid = S.pub.gid; S.fallT = {};
    if (G) { G.begin(ctx, Gs); return; }
    if (gid === 'ox') { qi++; const q = qs[qi]; sim.startQ(S.pub.qdur || 10); oxBotsPick(q.a); setPub({ ph: 'play', q: { text: q.q, n: qi + 1, total: qs.length }, ans: null, ex: null, cnt: null, nextAt: null, can: 'close', canLabel: '⏹ 시간 끝내기' }); }
    else if (gid === 'red') { round++; redIt = null; sim.start(); setPub({ ph: 'play', round }); }
    else { sim.start(); setPub({ ph: 'play' }); }
    for (const id in bots) bots[id].side = Math.random() < 0.45 ? -1 : Math.random() < 0.85 ? 1 : 0;
  }
  const stat = (id, k) => { (stats[id] = stats[id] || {})[k] = (stats[id][k] || 0) + 1; };
  const tell = (id, m) => { if (!bots[id]) Net.set(base + '/pv/' + id, Object.assign({ ts: Net.now() }, m)); };
  function reveal() {   // 체육 OX 서바이벌: 울타리가 닫히고 1.3초 뒤 자동 판정
    const q = qs[qi], res = sim.grade(q.a);
    res.correct.forEach(id => { if (!S.pub.practice) { scores[id] = (scores[id] || 0) + 10; gp[id] = (gp[id] || 0) + 10; Net.set(base + '/sc/' + id, scores[id]); } tell(id, { k: 'ox', r: 'right', a: q.a }); });
    res.out.forEach(id => { stat(id, 'oxout'); tell(id, { k: 'ox', r: 'out', a: q.a }); if (bots[id]) oxBotRevive(id); });
    const last = qi + 1 >= qs.length;
    pushState(true); setPub({ ph: 'reveal', ans: q.a, ex: q.ex || '', cnt: { alive: sim.alive(), out: res.out.length }, nextAt: Net.now() + 5000, last, can: null });
    beep(q.a === 'O' ? 660 : 520, 0.2);
    clearTimeout(timer); timer = setTimeout(oxAuto, 5000);
  }
  // 정답 공개 5초 뒤 자동으로 다음 문제(마지막이면 결과). 일시정지 중이면 풀릴 때까지 기다린다
  function oxAuto() { if (!sim || S.pub.gid !== 'ox' || S.pub.ph !== 'reveal') return; if (paused) { timer = setTimeout(oxAuto, 400); return; } oxNext(); }
  function oxNext() { if (qi + 1 < qs.length) begin(); else result(); }
  // 학생 폰에서 온 OX 입력: 이모지, 옷 색, 부활 미션(문제 번호와 답을 받아 교실 화면이 채점)
  function oxEv(pid, e) {
    if (e.k === 'emo') sim.emoji(pid, Math.max(0, Math.min(8, e.i | 0)));
    else if (e.k === 'rvs') sim.reviveStart(pid);
    else if (e.k === 'rv') {
      const idx = [...new Set((e.qs || []).map(n => n | 0))].filter(n => n >= 0 && n < OX_REVIVE_BANK.length).slice(0, 5);
      const sc = idx.length === 5 ? idx.reduce((s, n, k) => s + ((e.a || [])[k] === OX_REVIVE_BANK[n][1] ? 1 : 0), 0) : 0;
      const ok = sim.reviveEnd(pid, sc); if (ok != null) { tell(pid, { k: 'rvr', ok, sc }); if (ok) stat(pid, 'revive'); }
    }
  }
  /* 가상 참가자: 원본처럼 72%는 정답 칸, 24%는 오답 칸, 4%는 가운데 통로로. 탈락하면 응원석에서 이모지, 부활 미션은 문제마다 68% 확률로 맞힘 */
  let oxBots = {};
  function oxBotsPick(ans) {
    for (const id in bots) {
      const p = sim && sim.p[id]; if (!p || !p.alive) continue;
      const r = Math.random(); let pick = r < 0.72 ? ans : (ans === 'O' ? 'X' : 'O'); if (r > 0.96) pick = null;
      const Z = Sim.OX.W.ZONES, W = Sim.OX.W;
      oxBots[id] = { wait: 0.3 + Math.random() * Math.min(3, (S.pub.qdur || 10) * 0.4), tg: pick ? { x: Z[pick].x + (Math.random() - 0.5) * (W.ZONE_W - 2.5), z: Z[pick].z + (Math.random() - 0.5) * (W.ZONE_D - 2.5) } : { x: -1.2 + Math.random() * 2.4, z: -8 + Math.random() * 13 } };
    }
  }
  function oxBotRevive(id) {
    ctx.after(2500 + Math.random() * 6000, () => { if (!sim || !sim.reviveStart || !sim.reviveStart(id)) return; let sc = 0; for (let k = 0; k < 5; k++) if (Math.random() < 0.68) sc++; sim.reviveEnd(id, sc); });
  }
  function result() {
    clearTimeout(timer); hush();
    const gid = S.pub.gid, ids = active(); let res;
    if (G) { gtimers.forEach(clearTimeout); gtimers = []; res = G.end(ctx, Gs); if (S.priv && Object.keys(S.priv).length) ctx.priv({}); }
    else if (gid === 'ox') res = { type: 'solo', title: '체육 OX 서바이벌 순위', unit: '', rows: sim.ranking().filter(o => S.players[o.id]).map(o => ({ id: o.id, rank: o.rank, v: (o.p.alive ? '🙋 생존' : `😵 Q${o.p.elimQ} 탈락`) + ` · 정답 ${o.p.cor}/${o.p.ans}` + (o.p.used ? ` · 부활 ${o.p.used}` : '') })) };
    else if (gid === 'red') res = { type: 'solo', title: '골인 횟수', unit: '번 골인', rows: Sim.rankBy(ids.map(id => ({ id, v: gp[id] || 0 })), o => o.v, true) };
    else if (gid === 'maze') { const p = sim.p; res = { type: 'solo', title: '보물 찾은 순서', unit: '초', rows: ids.filter(id => p[id] && p[id].st === 'fin').sort((a, b) => p[a].rank - p[b].rank).map(id => ({ id, v: p[id].time, rank: p[id].rank })), rest: ids.filter(id => !p[id] || p[id].st !== 'fin').length }; }
    else if (gid === 'terr') { res = { type: 'team', title: sim.map.landmarks.length ? '칠한 땅 % + 랜드마크 ★ (하나에 3점)' : '칠한 땅', rows: Sim.rankBy(sim.scores(), o => o.v, true).map(o => ({ tm: o.tm, rank: o.rank, v: o.v, label: o.star ? `${o.pc}% + ★${o.star} = ${o.v}점` : `${o.pc}%` })) }; }
    else if (gid === 'worm') res = { type: 'solo', title: '지렁이 길이', unit: '', rows: sim.ranking().map(o => ({ id: o.id, v: o.len, rank: o.rank })) };
    if (res.type === 'solo') res.rows.forEach(r => tell(r.id, { k: 'res', rank: r.rank, v: r.v, unit: res.unit }));
    else if (res.type === 'team') ids.forEach(id => { const tm = S.players[id].tm, r = res.rows.find(o => o.tm === tm); if (r) tell(id, { k: 'res', rank: r.rank, v: r.label || r.v, unit: r.label ? '' : '%', team: tm }); });
    else if (res.type === 'class') ids.forEach(id => tell(id, { k: 'msg', b: res.big, s: '우리 반 기록', c: 'green' }));
    else if (res.type === 'lottery') ids.forEach(id => tell(id, res.ids.includes(id) ? { k: 'msg', b: '당첨!', s: '행운의 주인공', c: 'green' } : { k: 'msg', b: '아쉽지만 다음 기회에', s: '', c: '' }));
    record(gid, res); S.visited[gid] = 1; FX.confetti(140);
    ids.forEach(id => stat(id, 'games'));
    if (res.type === 'solo') res.rows = res.rows.slice(0, 10);
    sim = null; paused = false; pushState(true);
    S.resT = S.t; setPub({ ph: 'result', res, paused: false });
  }
  function record(gid, res) {
    const top = res.type === 'team' ? res.rows.slice(0, 3).map(r => TEAM[r.tm].n + '팀') : res.type === 'class' ? [res.big] : (res.rows || res.ids || []).slice(0, 3).map(r => ctx.name(r.id || r));
    history.push({ gid, t: Net.now(), practice: !!S.pub.practice, top });
    Net.set('teachers/' + uid + '/rooms/' + code, { t: t0, n: active().length, games: history.slice(-40) });
  }
  function finish() {
    clearTimeout(timer); clearG(); sim = null; FX.confetti(220);
    active().forEach(id => tell(id, { k: 'end', st: stats[id] || {}, sc: scores[id] || 0 }));
    setPub({ scene: 'end', ph: null, res: null, q: null });
  }

  /* ── 시험용 가상 참가자의 조이스틱 ── */
  function botInputs(dt) {
    const gid = S.pub.gid, out = {};
    for (const id in bots) {
      const b = bots[id]; b.t -= dt;
      if (gid === 'ox') {
        const p = sim.p[id]; if (!p) continue; const o = oxBots[id] = oxBots[id] || {};
        if (!p.alive && !p.auto) { if (!o.st || Math.random() < dt * 0.3) o.st = { x: -15 + Math.random() * 30, z: 9.6 + Math.random() * 3.4 }; o.tg = o.st; if (Math.random() < dt * 0.12) sim.emoji(id, [0, 5, 1, 8][(Math.random() * 4) | 0]); }
        else if (p.alive && sim.ph !== 'q' && (!o.tg || Math.random() < dt * 0.3)) o.tg = { x: -13 + Math.random() * 26, z: -11 + Math.random() * 17 };
        if (o.wait > 0) { o.wait -= dt; b.x = b.y = 0; }
        else if (o.tg) { const dx = o.tg.x - p.x, dz = o.tg.z - p.z, d = Math.hypot(dx, dz); if (d < 0.4) { b.x = b.y = 0; if (sim.ph !== 'q') o.tg = null; } else { const k = p.alive ? 0.85 : 0.4; b.x = dx / d * k; b.y = dz / d * k; } }
        else b.x = b.y = 0;
      }
      else if (gid === 'red') { if (sim.it === 'look') { if (!b.slow) { b.slow = 1; b.t = Math.random() < 0.85 ? 0.15 : 1; } if (b.t <= 0) { b.x = 0; b.y = 0; } } else { b.slow = 0; b.x = 1; b.y = Math.sin(S.t + id.length) * 0.2; } }
      else if (b.t <= 0) { b.t = 0.4 + Math.random() * 1.2; const a = Math.random() * 6.28; b.x = Math.cos(a) + (gid === 'maze' ? 0.3 : 0); b.y = Math.sin(a); }
      out[id] = { x: b.x, y: b.y };
    }
    return out;
  }
  function oxShirts() { for (const id in sim.p) { const pl = S.players[id]; sim.p[id].sh = pl ? (pl.sh != null ? pl.sh | 0 : (pl.c || 0) % 8) : 0; } }
  // 폰으로 보내는 상태: 지렁이처럼 무거운 게임은 가벼운 판(netSnap)을 보낸다. 새로 들어온 폰을 위해 가끔은 전체를 보낸다
  let netFull = 0;
  const netSt = () => (sim && sim.netSnap && (netFull = (netFull + 1) % 24) ? sim.netSnap() : S.st);
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
    if (!sim || P.scene !== 'game' || paused) return;
    if (P.ph !== 'play' && !(P.gid === 'ox' && P.ph !== 'result')) return;
    // 컴퓨터가 잠깐 버벅여도 게임 시계가 늦어지지 않도록, 밀린 시간은 0.05초씩 나눠 한꺼번에 계산한다
    const all = Object.assign({}, netIn, botInputs(dt));
    for (let rest = dt; rest > 0.0001; rest -= 0.05) sim.step(Math.min(0.05, rest), all);
    pushState(false);
    pubAcc += dt; if (pubAcc >= 0.125) { pubAcc = 0; Net.set(base + '/st', netSt()); }
    const gid = P.gid;
    if (gid === 'red' && P.ph === 'play' && sim.it !== redIt) {
      redIt = sim.it;
      if (redIt === 'back') redSing(sim.itDur);
      else if (redIt === 'look') { hush(); beep(988, 0.12, 'square'); setTimeout(() => beep(740, 0.2, 'square'), 140); }
      else if (redIt === 'peek') beep(620, 0.08, 'triangle');
    }
    const W3 = 2 / 3, pos = id => { const p = S.st && S.st.p && S.st.p[id]; return !p ? [800, 450] : gid === 'maze' ? [MAZE_BOX.x + p[0] * MAZE_BOX.s, MAZE_BOX.y + p[1] * MAZE_BOX.s] : [p[0], p[1]]; };
    (sim.takeEvents && gid !== 'ox' ? sim.takeEvents() : []).forEach(e => {
      if (gid === 'red') { const [x, y] = pos(e.id); if (e.t === 'out') { stat(e.id, 'out'); tell(e.id, { k: 'out' }); sweep(1400, 160, 0.35); (S.shots = S.shots || []).push({ x, y, t: S.t }); FX.pop(x, y - 50, '찍!', '#2f8cff', 34); FX.shake(6); } else { gp[e.id] = (gp[e.id] || 0) + 1; stat(e.id, 'fin'); tell(e.id, { k: 'fin', rank: e.rank }); beep(880, 0.12); FX.stars(x, y, 10); FX.pop(x, y - 60, e.rank + '등!', '#27b56a', 40); } }
      else if (gid === 'maze') { if (e.t === 'crab') { stat(e.id, 'crab'); tell(e.id, { k: 'crab' }); FX.pop(e.x, e.y - 30, '집게!', '#e63946', 30); FX.burst(e.x, e.y, 10, ['#ff4d3d', '#fff']); beep(220, 0.15, 'square'); } else { stat(e.id, 'fin'); tell(e.id, { k: 'fin', rank: e.rank }); beep(880, 0.12); FX.stars(1560, sim.m.exit[1] * sim.T, 12); } }
      else if (gid === 'terr') {
        if (e.t === 'cut') { stat(e.id, 'cut'); tell(e.id, { k: 'cut', why: e.why }); FX.burst(...terrToScreen(e.x, e.y), 16, [TEAM[(sim.p[e.id] || {}).tm || 0].c, '#fff']); FX.pop(terrToScreen(e.x, e.y)[0], terrToScreen(e.x, e.y)[1] - 30, e.why === 'self' ? '앗, 내 선!' : e.why === 'haz' ? THEMES[S.pub.theme].haz + '!' : '싹둑!', '#e63946', 30); FX.shake(5); beep(160, 0.2, 'sawtooth'); }
        else if (e.t === 'block') { tell(e.id, { k: 'block' }); FX.ring(...terrToScreen(e.x, e.y), '#7fd3ff', 50); }
        else if (e.t === 'item') { tell(e.id, { k: 'item', it: e.k }); FX.ring(...terrToScreen(e.x, e.y), '#ffd400', 46); if (e.k === 'paint') FX.burst(...terrToScreen(e.x, e.y), 24, [TEAM[sim.p[e.id].tm].c, '#fff', '#ff9ad5']); beep(1100, 0.06); }
        else if (e.t === 'slowed') tell(e.id, { k: 'slowed' });
        else if (e.t === 'warp') { FX.ring(...terrToScreen(e.x, e.y), '#b26bff', 40); tell(e.id, { k: 'warp' }); }
        else if (e.t === 'cap' && e.n >= 6) { FX.pop(terrToScreen(e.x, e.y)[0], terrToScreen(e.x, e.y)[1] - 26, '+' + e.n + '칸', TEAM[sim.p[e.id].tm].d, Math.min(52, 24 + e.n / 6)); if (e.n >= 40) { FX.burst(...terrToScreen(e.x, e.y), 20, [TEAM[sim.p[e.id].tm].c, '#fff', '#ffd400']); beep(990, 0.1); } }
      }
      else if (gid === 'worm') { if (e.t === 'die') { stat(e.id, 'die'); tell(e.id, { k: 'die', why: e.why }); FX.burst(e.x * W3, e.y * W3, 18); } else if (e.t === 'big') FX.pop(e.x * W3, e.y * W3 - 20, '+4', '#e6398b', 30); }
      else if (gid === 'ox' && e.t === 'bump') { FX.ring(e.x, e.y, '#fff', 40); }
    });
    if (gid === 'ox') {
      oxShirts();
      if (sim.ph === 'closing' && P.ph === 'play') { pushState(true); setPub({ ph: 'closed', can: null }); beep(140, 0.5, 'sawtooth'); }
      else if (sim.ph === 'judge' && P.ph === 'closed') reveal();
      sim.takeEvents().forEach(e => { if (e.t === 'back') tell(e.id, { k: 'oxback' }); });
    }
    else if (gid === 'red' && sim.ph === 'done') { hush(); redIt = null; pushState(true); setPub({ ph: 'roundend' }); }
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

  /* 무궁화 꽃: 로봇이 등을 보이면 "무궁화 꽃이 피었습니다"를 소리 내어 읽는다(브라우저 한국어 음성).
     한국어 음성이 없는 컴퓨터는 11음 멜로디로 대신한다. 소리는 교실 화면(전광판) 컴퓨터에서만 난다. */
  let redIt = null;
  const koVoice = () => { try { return speechSynthesis.getVoices().find(v => /^ko/i.test(v.lang)) || null; } catch (e) { return null; } };
  try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); } catch (e) { }
  const hush = () => { try { speechSynthesis.cancel(); } catch (e) { } };
  function redSing(dur) {
    const v = koVoice();
    if (v) { try { hush(); const u = new SpeechSynthesisUtterance('무궁화 꽃이 피었습니다'); u.lang = 'ko-KR'; u.voice = v; u.rate = Math.max(0.8, Math.min(2.4, 2.1 / Math.max(0.5, dur))); u.pitch = 1.15; u.volume = 1; speechSynthesis.speak(u); return; } catch (e) { } }
    const notes = [523, 523, 587, 659, 587, 523, 494, 523, 587, 523, 440], step = dur * 1000 / (notes.length + 0.5);
    notes.forEach((f, k) => setTimeout(() => { if (sim && sim.it === 'back' && S.pub.gid === 'red') beep(f, Math.min(0.18, step / 1000 * 0.8), 'triangle'); }, k * step));
  }
  function sweep(f1, f2, d, type) { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sawtooth'; o.frequency.setValueAtTime(f1, ac.currentTime); o.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + d); g.gain.setValueAtTime(0.09, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) { } }
  addEventListener('pointerdown', () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { } });
  let ac; function beep(f, d, type) { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.value = 0.08; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) { } }

  /* ── 그리기 ── */
  function fit() { const s = Math.min(innerWidth / 1600, innerHeight / 900); cv.style.width = 1600 * s + 'px'; cv.style.height = 900 * s + 'px'; Object.assign(ox3box.style, { left: (innerWidth - 1600 * s) / 2 + 'px', top: (innerHeight - 900 * s) / 2 + 'px', width: 1600 * s + 'px', height: 900 * s + 'px' }); qrBox.style.transform = `scale(${s})`; qrBox.style.left = (innerWidth - 1600 * s) / 2 + 60 * s + 'px'; qrBox.style.top = (innerHeight - 900 * s) / 2 + 250 * s + 'px'; qrMini.style.transform = `scale(${s})`; qrMini.style.left = (innerWidth - 1600 * s) / 2 + 888 * s + 'px'; qrMini.style.top = (innerHeight - 900 * s) / 2 + 688 * s + 'px'; }
  addEventListener('resize', fit); fit();
  let lastCount = -1; const host = { con: null };
  function frame(ms) {
    S.t = ms / 1000; const P = S.pub, t = S.t;
    qrBox.style.display = P.scene === 'lobby' ? '' : 'none';
    qrMini.style.display = P.scene !== 'lobby' && P.scene !== 'fly' && (P.scene === 'map' || P.qr) ? '' : 'none';
    if (P.scene !== 'lobby' && ctlHelp.isConnected) ctlHelp.remove();   // 입장이 끝나면 안내는 저절로 닫힌다(⚙ 진행 서랍에도 같은 버튼이 있다)
    const con = ctlOn(); if (con !== host.con) { host.con = con; gear.style.display = con ? 'none' : ''; if (con) { drawer.classList.add('hidden'); if (ctlHelp.isConnected) ctlHelp.remove(); } }
    c.setTransform(1, 0, 0, 1, 0, 0); c.save(); FX.pre(c);
    if (!(P.scene === 'game' && P.gid === 'ox')) OX3D.detach();
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
      else if (g === 'ox') { c.clearRect(0, 0, 1600, 900); if (OX3D.ready) { OX3D.attach(ox3box); OX3D.frame({ st: S.st, pub: P, players: S.players, me: null, tv: true, nameOf: pl => nameOf(pl) }); } else drawOX2D(c, S, OX3D.failed); drawOXHud(c, S); } else if (g === 'red') drawRed(c, S); else if (g === 'maze') { c.fillStyle = '#1e7fd6'; c.fillRect(0, 0, 1600, 900); c.save(); c.translate(MAZE_BOX.x, MAZE_BOX.y); c.scale(MAZE_BOX.s, MAZE_BOX.s); drawMaze(c, S); c.restore(); hudMaze(c, S); }
      else if (g === 'terr') { c.fillStyle = '#3a2f26'; c.fillRect(0, 0, 1600, 900); c.drawImage(terrBoardSmall(S), TERR_VIEW.x, TERR_VIEW.y); c.save(); c.translate(TERR_VIEW.x, TERR_VIEW.y); c.scale(TERR_VIEW.s, TERR_VIEW.s); drawTerr(c, S, true); c.restore(); hudTerr(c, S); } else if (g === 'worm') { c.save(); c.scale(1600 / 2400, 900 / 1350); drawWorm(c, S); c.restore(); hudWorm(c, S); }
      if (P.practice) pill(c, '연습판', 20, 820, 28, '#ffd400', INK, 'left');
      if (P.ph === 'intro') overlayIntro(P); else if (P.ph === 'count') overlayCount(P); else if (P.ph === 'result') overlayResult(P);
      if (P.paused) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, 1600, 900); txt(c, '잠깐 멈춤', 800, 450, 140, '#fff'); }
    }
    c.restore(); FX.draw(c);
    requestAnimationFrame(frame);
  }
  function overlayIntro(P) {
    const g = GAMES[P.gid], t = S.t; c.fillStyle = 'rgba(20,14,40,.55)'; c.fillRect(0, 0, 1600, 900);
    card(c, 230, 110, 1140, 680, 40, '#fff', 8, 12);
    rr(c, 230, 110, 1140, 150, [40, 40, 0, 0], '#fff4d1'); c.fillStyle = INK; c.fillRect(230, 258, 1140, 5);
    txt(c, g.icon, 330, 185, 84); txt(c, g.place, 420, 160, 34, '#ff5a5f', 'left'); txt(c, g.name + (P.practice ? ' · 연습판' : ''), 420, 214, 58, '#222', 'left');
    if (P.lv) { const x = 1330; pill(c, '난이도 ' + LVNAME[P.lv] + ' ' + '★'.repeat(P.lv) + '☆'.repeat(3 - P.lv), x, 185, 30, LVCOL[P.lv], '#fff', 'right'); }
    (RULES[P.gid] || []).forEach((r, k) => { c.fillStyle = ['#ff5a5f', '#3d8bff', '#27b56a', '#f5b301'][k % 4]; c.beginPath(); c.arc(320, 320 + k * 76, 22, 0, 7); c.fill(); txt(c, String(k + 1), 320, 322 + k * 76, 28, '#fff'); txt(c, r, 360, 320 + k * 76, 40, '#333', 'left'); });
    const L = (LV_RULES[P.gid] || [])[P.lv];
    if (L) { rr(c, 290, 625, 1020, 64, 20, LVCOL[P.lv] + '22', LVCOL[P.lv], 4); txt(c, L, 800, 658, 32, '#333'); }
    if (P.gid === 'terr' && P.theme) txt(c, `오늘의 맵: ${THEMES[P.theme].name} · ${THEMES[P.theme].slowName}은 느리고 ${THEMES[P.theme].fastName}은 빨라요`, 800, 730, 30, '#3d8bff');
    for (let k = 0; k < 5; k++) drawChar(c, 1160 + k * 40, 760, 16, [7, 23, 41, 58, 94][k], { walk: 1, dir: 0, bob: 0 });
  }
  function overlayCount(P) {
    const left = (P.t - Net.now()) / 1000, s = Math.ceil(left), k = 1 - (left - Math.floor(left));
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, 1600, 900);
    const sc = s > 0 ? easeBack(Math.min(1, k * 2.5)) : 1;
    c.save(); c.translate(800, 450); c.scale(sc, sc); c.rotate(s > 0 ? (1 - Math.min(1, k * 2.5)) * -0.3 : 0);
    txt(c, s > 0 ? s : '출발!', 0, 20, 380, ['#ffd400', '#27b56a', '#3d8bff', '#ff5a5f'][Math.max(0, s) % 4], 'center', INK);
    c.restore();
    if (s !== lastCount) { lastCount = s; beep(s > 0 ? 520 : 880, 0.12); if (s <= 0) FX.burst(800, 450, 50); }
  }
  function overlayResult(P) {
    const R = P.res; if (!R) return; const t = S.t;
    c.fillStyle = 'rgba(20,14,40,.6)'; c.fillRect(0, 0, 1600, 900);
    c.save(); c.translate(800, 470); c.rotate(t * 0.2); for (let k = 0; k < 12; k++) { c.rotate(Math.PI / 6); c.fillStyle = 'rgba(255,230,120,.08)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-120, -900); c.lineTo(120, -900); c.fill(); } c.restore();
    card(c, 200, 60, 1200, 780, 40, '#fff', 8, 12);
    rr(c, 440, 34, 720, 76, 38, '#ff5a5f', INK, 6); txt(c, ({ team: '팀 결과', class: '반 전체 기록', lottery: '행운 추첨' }[R.type] || '개인 결과'), 800, 72, 42, '#fff');
    txt(c, R.title, 800, 140, 44, '#222');
    const rows = R.rows || [];
    if (R.type === 'class') { txt(c, R.big, 800, 300, 96, '#e63946'); (R.lines || []).forEach((l, k) => txt(c, l, 800, 420 + k * 64, 40, '#444')); dressedCrowd(c, S, 780, 'party', 'laugh'); }
    else if (R.type === 'lottery') {
      const ids = R.ids || [], n = ids.length, cols = Math.min(5, n || 1);
      ids.forEach((id, k) => { const pl = S.players[id]; if (!pl) return; const x = 800 + ((k % cols) - (cols - 1) / 2) * 220, y = 300 + ((k / cols) | 0) * 200; drawChar(c, x, y, 50, pl.c, { face: 'laugh', hat: 'party', bob: -Math.abs(Math.sin(t * 5 + k)) * 14 }); txt(c, `${k + 1}. ${nameOf(pl)}`, x, y + 84, 34, '#e63946'); });
      if (!n) txt(c, '아직 골인한 구슬이 없어요', 800, 400, 44, '#888');
    }
    else if (R.type === 'team') rows.forEach((r, k) => {
      const y = 200 + k * 140, T = TEAM[r.tm], grow = easeOut((t - (S.resT || t)) * 1.2 - k * 0.15); rr(c, 300, y, 1000, 110, 24, '#f3f3f3', '#ddd', 3); rr(c, 300, y, Math.max(140, 1000 * grow * r.v / Math.max(1, rows[0].v || 1)), 110, 24, T.c, T.d, 4);
      txt(c, `${r.rank}등  ${T.s} ${T.n}팀`, 330, y + 56, 48, '#fff', 'left', 'rgba(0,0,0,.4)'); txt(c, r.label || r.v + '%', 1270, y + 56, 42, '#222', 'right', '#fff');
      if (r.rank === 1) txt(c, '👑', 300, y + 4, 50);
      const mates = Object.keys(S.players).filter(id => S.players[id].c && S.players[id].tm === r.tm).slice(0, 8);
      mates.forEach((id, n) => drawChar(c, 1340 + (n % 2) * 26 - 0, y + 30 + ((n / 2) | 0) * 22, 11, S.players[id].c, { face: r.rank === 1 ? 'laugh' : 'smile', cheer: r.rank === 1, nofeet: true }));
    });
    else {
      // 시상대
      [[800, 470, 300, '#ffd400'], [480, 500, 270, '#cfd8e3'], [1120, 515, 255, '#f0a868']].forEach(([x, y, w, col], k) => { if (!rows[k]) return; rr(c, x - w / 2 + 40, y, w - 80, 10, 4, 'rgba(0,0,0,.15)'); });
      rows.slice(0, 3).forEach((r, k) => { const pl = S.players[r.id]; if (!pl) return; const x = [800, 480, 1120][k], py = [372, 402, 420][k], y = py - [128, 104, 104][k]; rr(c, x - 120, py, 240, 528 - py, [18, 18, 0, 0], ['#ffd400', '#d9e2ec', '#f0a868'][k], INK, 5); txt(c, String(r.rank), x, py + 28, 40, INK); pill(c, r.v + (R.unit || ''), x, py + 72, 24, '#fff', '#ff5a5f'); drawChar(c, x, y, [70, 54, 54][k], pl.c, { face: 'laugh', hat: k === 0 ? 'crown' : 'party', cheer: true, bob: -Math.abs(Math.sin(t * 5 + k)) * 16 }); txt(c, nameOf(pl), x, py - 24, 32, '#222', 'center', '#fff'); });
      c.fillStyle = INK; c.fillRect(300, 528, 1000, 6);
      rows.slice(3, 10).forEach((r, k) => { const pl = S.players[r.id]; if (!pl) return; const x = 300 + (k % 2) * 520, y = 580 + ((k / 2) | 0) * 60; drawChar(c, x, y, 20, pl.c, {}); txt(c, `${r.rank}등 ${nameOf(pl)}`, x + 40, y, 32, '#222', 'left'); txt(c, r.v + (R.unit || ''), x + 440, y, 28, '#888', 'right'); });
      if (!rows.length) txt(c, '아직 기록이 없어요', 800, 400, 44, '#888');
      if (R.rest) txt(c, `아직 미로 안에 ${R.rest}명`, 800, 812, 28, '#888');
    }
    if (R.cls) { rr(c, 400, 760, 800, 64, 20, '#ffd400', '#2b2118', 4); txt(c, R.cls, 800, 792, 34, '#2b2118'); }
  }

  ctl = buildControl(drawer, { screen: true, code, send: cmd, S, active });
  // 지도에서 여행지를 직접 눌러도 그곳으로 날아간다 (옵션은 ⚙ 진행 서랍에서 고른 값)
  const mapHit = e => { if (S.pub.scene !== 'map') return null; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 1600 / r.width, y = (e.clientY - r.top) * 900 / r.height; let best = null, bd = 85; for (const id in GAMES) { const g = GAMES[id]; if (!g.ready || !g.xy) continue; const d = Math.hypot(g.xy[0] - x, g.xy[1] - y); if (d < bd) { bd = d; best = id; } } return best; };
  cv.addEventListener('click', e => { const id = mapHit(e); if (id) cmd({ t: 'go', gid: id, o: ctl.opts ? ctl.opts() : {} }); });
  cv.addEventListener('mousemove', e => (cv.style.cursor = mapHit(e) ? 'pointer' : ''));
  drawer.prepend(el('div', { class: 'cblk' }, [el('h3', { text: '노트북 조종판' }), el('div', { class: 'hint', text: '이 서랍은 전광판에 그대로 보여요. 정답이 보이면 안 되는 게임은 조종판 창에서 진행해요.' }), el('button', { class: 'b pri', text: '🖥 조종판 새 창으로 열기', onclick: openCtl })]));
  requestAnimationFrame(frame);
  window.__host = { S, cmd, getSim: () => sim, gs: () => Gs };   // 자동 시험용
}
