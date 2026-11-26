/* 학생 폰: 조이스틱과 내 정보만 보여 준다. 판정은 하지 않고 조이스틱 방향만 보낸다. */

/* 포춘쿠키: 세 번 두드리면 휘황찬란하게 깨진다 */
function cookieStage(root, title) {
  return new Promise(done => {
    const cv = el('canvas', { class: 'cookie', width: 720, height: 720 }), hint = el('div', { class: 'big', text: title }), sub = el('div', { class: 'sub', text: '쿠키를 톡톡 두드려요 (0/3)' });
    root.replaceChildren(el('div', { class: 'stage' }, [hint, cv, sub]));
    const c = cv.getContext('2d'); let taps = 0, shake = 0, burst = 0, parts = [], t0 = performance.now(), alive = true;
    cv.addEventListener('pointerdown', () => {
      if (burst) return; taps++; shake = 0.35; sub.textContent = `쿠키를 톡톡 두드려요 (${taps}/3)`;
      if (navigator.vibrate) navigator.vibrate(30);
      if (taps >= 3) { burst = performance.now(); sub.textContent = ''; for (let k = 0; k < 140; k++) { const a = Math.random() * 6.28, v = 300 + Math.random() * 900; parts.push({ x: 360, y: 360, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, h: (Math.random() * 360) | 0, s: 8 + Math.random() * 16, star: k % 4 === 0, r: Math.random() * 6 }); } if (navigator.vibrate) navigator.vibrate([60, 40, 120]); }
    });
    function half(dir, off, rot) {
      c.save(); c.translate(360 + dir * off, 380 + off * 0.3); c.rotate(dir * rot); c.fillStyle = '#f5bd55'; c.strokeStyle = '#a86a1c'; c.lineWidth = 12; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(0, -130); c.quadraticCurveTo(dir * 190, -230, dir * 235, 20); c.quadraticCurveTo(dir * 130, 150, 0, 40); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(dir * 120, -90, 50, 22, dir * 0.6, 0, 7); c.fill(); c.restore();
    }
    (function loop(now) {
      if (!alive) return; const t = (now - t0) / 1000, dt = 1 / 60;
      c.clearRect(0, 0, 720, 720);
      if (!burst) {
        if (shake > 0) shake -= dt;
        c.save(); c.translate(shake > 0 ? Math.sin(t * 80) * 14 : 0, Math.sin(t * 2.5) * 12);
        for (let k = 0; k < 8; k++) { const a = t * 0.8 + k * 0.785; txt(c, '✦', 360 + Math.cos(a) * 300, 360 + Math.sin(a) * 300, 34 + Math.sin(t * 4 + k) * 10, `hsl(${k * 45} 95% 65%)`); }
        half(-1, 0, 0); half(1, 0, 0);
        c.strokeStyle = '#7a4a10'; c.lineWidth = 8; c.lineCap = 'round';
        for (let k = 0; k < taps; k++) { c.beginPath(); c.moveTo(330 + k * 40, 260); c.lineTo(300 + k * 50, 320); c.lineTo(350 + k * 30, 370); c.lineTo(320 + k * 45, 430); c.stroke(); }
        c.restore();
      } else {
        const k = (now - burst) / 1000;
        c.save(); c.translate(360, 360); c.rotate(k * 1.5);
        for (let n = 0; n < 16; n++) { c.rotate(Math.PI / 8); c.fillStyle = `hsla(${n * 22 + k * 200},100%,65%,${Math.max(0, 0.9 - k * 0.5)})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(-60, -900); c.lineTo(60, -900); c.fill(); }
        c.restore();
        c.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - k * 2.5)})`; c.fillRect(0, 0, 720, 720);
        half(-1, k * 420, k * 2); half(1, k * 420, k * 2);
        parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.r += dt * 8; if (p.star) txt(c, '★', p.x, p.y, p.s * 2.2, `hsl(${p.h} 100% 65%)`); else { c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = `hsl(${p.h} 95% 60%)`; c.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); c.restore(); } });
        if (k > 1.5) { alive = false; done(); return; }
      }
      requestAnimationFrame(loop);
    })(t0);
  });
}

async function startPlayer(code) {
  const app = $('#app'), base = 'rooms/' + code; document.body.className = 'phone';
  const uid = await Net.anon(), mine = base + '/players/' + uid;
  if (!(await Net.get(base + '/meta'))) { app.replaceChildren(el('div', { class: 'card' }, [el('div', { class: 'big', text: `${code}번 방을 찾을 수 없어요` }), el('div', { class: 'sub', text: '교실 화면의 방 번호를 다시 확인해 주세요.' }), navLink('처음으로', '?', 'b pri')])); return; }
  let me = await Net.get(mine);
  if (!me || !me.n) me = await new Promise(res => {
    const inp = el('input', { type: 'text', maxlength: 8, placeholder: '닉네임 (8자까지)' }), err = el('div', { class: 'err' });
    inp.addEventListener('input', () => (err.textContent = ''));
    const go = () => { const n = inp.value.trim(); if (!n) { err.textContent = '닉네임을 먼저 적어 주세요.'; return; } const m = { n }; Net.set(mine, m); res(m); };
    app.replaceChildren(el('div', { class: 'card' }, [el('div', { class: 'big', text: '우리 반 게임 페스티벌' }), el('div', { class: 'sub', text: `${code}번 방에 들어가요` }), inp, err, el('button', { class: 'b pri', text: '입장', onclick: go })]));
  });
  if (!me.c) {
    await cookieStage(app, '여행 친구가 들어 있는 포춘쿠키');
    me.c = 1 + ((Math.random() * 99999) | 0);
    const cv = el('canvas', { width: 400, height: 400, class: 'reveal' });
    await new Promise(res => {
      app.replaceChildren(el('div', { class: 'stage' }, [el('div', { class: 'big', text: me.c % 12 === 0 ? '황금 친구가 나왔어요!' : '내 여행 친구가 나왔어요!' }), cv, el('div', { class: 'slip', text: '오늘의 여행 운세 · ' + FORTUNES[me.c % FORTUNES.length] }), el('button', { class: 'b pri', text: '여행 출발', onclick: res })]));
      const c = cv.getContext('2d'); (function l(ms) { if (!cv.isConnected) return; c.clearRect(0, 0, 400, 400); drawChar(c, 200, 210, 110, me.c, { face: 'laugh', bob: -Math.abs(Math.sin(ms / 180)) * 24, name: me.n }); requestAnimationFrame(l); })(0);
    });
    Net.set(mine + '/c', me.c);
  }
  Net.set(mine + '/on', true); Net.gone(mine + '/on', false);

  /* ── 본 화면 ── */
  const pv = el('canvas', { id: 'pv' }), pask = el('div', { id: 'pask', class: 'hidden' }), big = el('div', { class: 'big' }), sub = el('div', { class: 'sub' }), msg = el('div', { id: 'pmsg' }, [big, sub]);
  const toast = el('div', { id: 'ptoast' }), knob = el('div', { id: 'pknob' }), jbase = el('div', { id: 'pbase' }, [knob]), joy = el('div', { id: 'pjoy' }, [jbase, el('div', { class: 'jhint', text: '여기를 밀어서 움직여요' })]);
  const nick = el('b', { text: me.n }), score = el('span', { text: '0점' }), place = el('div', { id: 'pplace' });
  const overlay = el('div', { id: 'pover', class: 'hidden' });
  app.replaceChildren(el('div', { id: 'ptop' }, [nick, score, place]), el('div', { id: 'pmid' }, [pv, pask, msg]), joy, toast, overlay);
  const c = pv.getContext('2d');
  const S = { pub: {}, st: null, players: { [uid]: me }, grid: null, disp: {}, fallT: {}, born: {}, t: 0, me: uid, phone: true };
  let lastMsg = null, askKey = null, askClosed = null, env = { sel: {}, me: uid, send: e => Net.ev(base + '/ev/' + uid, Object.assign({ q: S.pub.ask && S.pub.ask.key, ct: Net.now(), n: Date.now() + Math.random() }, e)) };
  let lastOx = null, lastRes = null, endInfo = null, lastTs = 0, toastT = 0, cam = { x: 800, y: 450 }, endShown = false, joined = true;

  Net.on(base + '/pub', v => { const prev = S.pub; S.pub = v || {}; if (prev.gid !== S.pub.gid || prev.scene !== S.pub.scene) { S.disp = {}; S.fallT = {}; lastOx = null; if (S.pub.ph !== 'result') lastRes = null; lastMsg = null; } if (S.pub.ph === 'play' && S.pub.gid === 'ox') lastOx = null; if (S.pub.scene === 'end') showEnd(); });
  // 지렁이: 사탕·가시가 안 바뀌면 빠진 채로 온다 → 앞에 받은 것을 그대로 쓴다
  Net.on(base + '/st', v => { if (v && v.w && S.st && S.st.w) { if (!v.ob && S.st.ob) v.ob = S.st.ob; if (!v.mn && S.st.mn) v.mn = S.st.mn; } S.st = v; });
  Net.on(base + '/grid', v => (S.grid = v));
  Net.on(base + '/img', v => { S.img = v; if (env.diff) env.diff.setImg(v); });
  Net.on(base + '/players', v => { S.players = v || {}; const m = S.players[uid]; if (m) me = m; else if (joined) { joined = false; app.replaceChildren(el('div', { class: 'card' }, [el('div', { class: 'big', text: '방에서 나왔어요' }), navLink('다시 들어가기', '?r=' + code, 'b pri')])); } });
  Net.on(base + '/sc/' + uid, v => (score.textContent = (v || 0) + '점'));
  Net.on(base + '/pv/' + uid, v => {
    if (!v || v.ts === lastTs) return; lastTs = v.ts;
    if (v.k === 'msg' || (v.k === 'diff' && v.b)) { lastMsg = v; v.rt = performance.now(); if (navigator.vibrate) navigator.vibrate(40); } if (v.k === 'diff' && env.diff) env.diff.mark(v);
    if (v.k === 'ox' && ox && ox.ui && Net.now() - v.ts < 4000) { if (v.r === 'out') oxToast('😵 아쉬워요! 탈락', '응원석에서 친구들을 응원해 주세요'); else oxToast('🎉 정답! 생존', `정답은 ${v.a}`); if (navigator.vibrate) navigator.vibrate(v.r === 'out' ? [80, 60, 80] : 40); }
    if (v.k === 'oxback' && ox && ox.ui) oxToast('💪 부활 성공!', '경기장으로 돌아왔어요');
    if (v.k === 'ox') lastOx = v.r; else if (v.k === 'res') lastRes = v; else if (v.k === 'end') { endInfo = v; showEnd(); }
    const TH = THEMES[S.pub.theme] || THEMES.city;
    const T = { out: '삐익! 움직이다 걸렸어요', fin: `골인! ${v.rank}등`, cut: v.why === 'self' ? '내 선을 밟았어요! 기지에서 다시' : v.why === 'haz' ? TH.haz + '에 닿았어요! 기지에서 다시' : '선이 끊겼어요! 기지에서 다시 출발', block: '방패가 막아 줬어요!', slowed: '눈송이에 맞아 느려졌어요', die: v.why === 'mine' ? '가시에 찔렸어요! 2초 뒤 다시' : '흩어졌어요! 2초 뒤 다시 출발', crab: '집게! 출발점으로 돌아가요', warp: '🌀 순간 이동!', item: v.it ? ITEM_ICON[v.it][0] + ' ' + ITEM_ICON[v.it][2] + ' 획득!' : '' }[v.k];
    if (T && Net.now() - v.ts < 4000) { toast.textContent = T; toast.className = 'on'; toastT = performance.now(); if (navigator.vibrate) navigator.vibrate(60); }
  });

  /* 조이스틱: 닿은 자리가 중심이 되고, 끄는 동안 화면이 스크롤되지 않는다 */
  let jv = { x: 0, y: 0 }, sent = { x: 0, y: 0 }, pid = null, org = null;
  const setKnob = () => (knob.style.transform = `translate(${jv.x * 55}px,${jv.y * 55}px)`);
  joy.addEventListener('pointerdown', e => { pid = e.pointerId; joy.setPointerCapture(pid); const r = joy.getBoundingClientRect(); org = { x: e.clientX, y: e.clientY }; jbase.style.left = e.clientX - r.left + 'px'; jbase.style.top = e.clientY - r.top + 'px'; jbase.classList.add('on'); e.preventDefault(); });
  joy.addEventListener('pointermove', e => { if (e.pointerId !== pid) return; let x = (e.clientX - org.x) / 55, y = (e.clientY - org.y) / 55; const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } jv = { x, y }; setKnob(); e.preventDefault(); });
  const up = e => { if (e.pointerId !== pid) return; pid = null; jv = { x: 0, y: 0 }; setKnob(); jbase.classList.remove('on'); };
  joy.addEventListener('pointerup', up); joy.addEventListener('pointercancel', up);
  joy.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  setInterval(() => { const x = +jv.x.toFixed(2), y = +jv.y.toFixed(2); if (x !== sent.x || y !== sent.y) { sent = { x, y }; Net.set(base + '/in/' + uid, sent); } }, 80);

  /* ── 체육 OX 서바이벌: 원본 폰 화면(문제 칸·조이스틱·이모지·부활 미션)을 3D 쿼터뷰 위에 올린다 ── */
  const pmid = $('#pmid', app);
  var ox = { ui: null, tv: false, rvOn: false, toastH: 0, shKey: '' };
  function oxToast(main, sub, ms) { const t = ox.ui.toast; t.replaceChildren(main, sub ? el('small', { text: sub }) : ''); t.classList.add('show'); clearTimeout(ox.toastH); ox.toastH = setTimeout(() => t.classList.remove('show'), ms || 2200); }
  function oxUI() {
    if (ox.ui) return ox.ui;
    const qnum = el('span', { id: 'qnum', text: '대기' }), qtext = el('span', { id: 'qtext' }), qtimer = el('span', { id: 'qtimer', text: '–' });
    const stat = el('span', { class: 'chip', id: 'ostat' });
    const viewBtn = el('button', { class: 'chip', text: '📺 TV', onclick: () => { ox.tv = !ox.tv; viewBtn.textContent = ox.tv ? '📱 내 시점' : '📺 TV'; } });
    const pal = el('div', { id: 'emojiPal', class: 'hidden' }, OX3D.EMOJIS.map((e, i) => el('button', { text: e, onclick: () => { env.send({ k: 'emo', i }); pal.classList.add('hidden'); } })));
    const emo = el('button', { id: 'emojiBtn', text: '😊', onclick: () => pal.classList.toggle('hidden') });
    const rvBtn = el('button', { id: 'reviveBtn', class: 'hidden', onclick: () => startRevive() });
    const cheer = el('div', { id: 'cheerTag', class: 'hidden' }), toastEl = el('div', { id: 'oxtoast' });
    const rvProg = el('span'), rvBody = el('div', { class: 'mbody' });
    const rv = el('div', { id: 'revive', class: 'overlay hidden' }, [el('div', { class: 'modal', style: 'width:min(460px,100%)' }, [el('div', { class: 'mhead' }, ['💪 부활 미션 ', el('span', { class: 'sp' }), rvProg]), rvBody])]);
    const sw = el('div', { class: 'swatches' }), shirt = el('div', { id: 'oxshirt' }, [el('b', { text: '옷 색깔 고르기' }), sw]);
    const msg3 = el('div', { id: 'ox3msg', class: 'hidden' });
    ox.ui = { root: el('div', { id: 'oxui' }, [el('div', { id: 'topbar' }, [stat, el('span', { class: 'sp' }), viewBtn]), el('div', { id: 'qbar' }, [qnum, qtext, qtimer]), el('div', { id: 'qhint', text: '⭕ 왼쪽 파란 칸 · ❌ 오른쪽 빨간 칸' }), shirt, msg3, emo, pal, rvBtn, cheer, toastEl, rv]),
      qnum, qtext, qtimer, stat, rvBtn, cheer, toast: toastEl, rv, rvProg, rvBody, sw, shirt, pal, msg3 };
    return ox.ui;
  }
  // 부활 미션 (원본 startRevive와 같음): 5문제 중 3개 이상이면 다음 문제 때 복귀. 채점은 교실 화면이 다시 한다.
  function startRevive() {
    const my = S.st && S.st.p && S.st.p[uid]; if (!my || !(my[2] & 4) || ox.rvOn) return;
    ox.rvOn = true; env.send({ k: 'rvs' });
    const U = ox.ui, idx = shuffle(OX_REVIVE_BANK.map((_, k) => k)).slice(0, 5), answers = []; let i = 0, score = 0;
    U.rv.classList.remove('hidden');
    const show = () => {
      U.rvProg.textContent = `${i + 1} / 5 · 맞힘 ${score}`;
      const q = OX_REVIVE_BANK[idx[i]];
      const ans = a => {
        const ok = a === q[1]; if (ok) score++; answers.push(a);
        U.rvBody.replaceChildren(el('div', { style: 'text-align:center;padding:24px 0' }, [el('div', { style: 'font-size:60px', text: ok ? '⭕' : '❌' }), el('div', { class: 'big', text: ok ? '정답!' : '아쉬워요' }), el('div', { class: 'muted', text: `정답은 ${q[1]}` })]));
        setTimeout(() => { i++; if (i < 5) show(); else finish(); }, 850);
      };
      U.rvBody.replaceChildren(el('p', { class: 'muted', text: '5문제 중 3개 이상 맞히면 부활!' }), el('div', { class: 'big', style: 'font-size:24px;line-height:1.4', text: q[0] }),
        el('div', { class: 'oxbtns' }, [el('button', { style: 'background:#dfe8ff', text: '⭕', onclick: () => ans('O') }), el('button', { style: 'background:#ffe0e0', text: '❌', onclick: () => ans('X') })]));
    };
    const finish = () => {
      const pass = score >= 3; env.send({ k: 'rv', qs: idx, a: answers });
      U.rvProg.textContent = `결과 ${score} / 5`;
      U.rvBody.replaceChildren(el('div', { style: 'text-align:center;padding:18px 0' }, [el('div', { style: 'font-size:60px', text: pass ? '💪' : '📣' }), el('div', { class: 'big', text: pass ? '부활 성공!' : '부활 실패' }),
        el('p', { text: pass ? '다음 문제가 시작되면 경기장으로 돌아가요.' : '응원석에서 친구들을 응원해 주세요!' }), el('button', { class: 'btn y', text: '확인', onclick: () => { U.rv.classList.add('hidden'); ox.rvOn = false; } })]));
    };
    show();
  }
  function oxFrame(P, st) {
    const U = oxUI(); if (!U.root.isConnected) pmid.append(U.root);
    OX3D.load();
    if (OX3D.ready) { OX3D.attach(pmid); OX3D.frame({ st, pub: P, players: S.players, me: uid, tv: ox.tv, nameOf: pl => nameOf(pl) }); }
    U.msg3.classList.toggle('hidden', OX3D.ready); U.msg3.textContent = OX3D.failed ? '3D 화면을 불러오지 못했어요. 교실 화면을 보며 조이스틱으로 움직여요.' : '3D 경기장 불러오는 중…';
    const [num, text, tm, warn] = oxQbar(P, st);
    if (U.qnum.textContent !== num) U.qnum.textContent = num; if (U.qtext.textContent !== text) U.qtext.textContent = text; if (U.qtimer.textContent !== tm) U.qtimer.textContent = tm; U.qtimer.classList.toggle('warn', !!warn);
    const my = st.p && st.p[uid], n = Object.keys(st.p || {}).length, sTxt = `🏫 ${code} · 👥 ${n} · 🙋 ${st.alive != null ? st.alive : n}`;
    if (U.stat.textContent !== sTxt) U.stat.textContent = sTxt;
    const canRv = !!my && !!(my[2] & 4) && !ox.rvOn && P.ph !== 'result', alive = !my || !!(my[2] & 1), pend = !!my && !!(my[2] & 2);
    U.rvBtn.classList.toggle('hidden', !canRv);
    if (canRv) U.rvBtn.textContent = '💪 부활 미션 도전!';
    U.cheer.classList.toggle('hidden', alive); U.cheer.textContent = pend ? '✅ 부활 확정! 다음 문제에 경기장으로 돌아가요' : '📣 응원석에서 친구들을 응원해요!';
    // 옷 색깔(원본 입장 화면의 8색): 게임 시작 전 안내 화면에서 고른다
    const curSh = me.sh != null ? me.sh : (me.c || 0) % 8, shKey = curSh + ':' + P.ph;
    U.shirt.classList.toggle('hidden', P.ph !== 'intro');
    if (shKey !== ox.shKey) { ox.shKey = shKey; U.sw.replaceChildren(...OX3D.SHIRTS.map((cl, i) => el('button', { style: 'background:' + cl, class: i === curSh ? 'on' : '', onclick: () => { me.sh = i; Net.set(mine + '/sh', i); } }))); }
  }

  function showEnd() {
    if (endShown || S.pub.scene !== 'end' || !endInfo) return; endShown = true; overlay.classList.remove('hidden');
    cookieStage(overlay, '행운의 편지가 든 포춘쿠키').then(() => {
      const st = endInfo.st || {}, L = [];
      if (st.fall) L.push(`바닥이 ${st.fall}번 갈라져도 다시 돌아온 너,`); if (st.oxout) L.push(`OX에서 탈락해도 응원석에서 끝까지 친구들을 응원한 너,`); if (st.revive) L.push(`부활 미션을 ${st.revive}번 성공하고 다시 달려 나온 너,`); if (st.out) L.push(`술래에게 ${st.out}번 걸리고도 다시 달린 너,`); if (st.die) L.push(`지렁이가 ${st.die}번 흩어져도 다시 출발한 너,`); if (st.cut) L.push('선이 끊겨도 다시 그리러 나간 너,'); if (st.fin) L.push(`결승선을 ${st.fin}번 통과한 너,`); if (st.mole) L.push(`두더지를 ${st.mole}마리나 잡은 날쌘 너,`); if (st.fix) L.push(`그림 ${st.fix}곳을 고쳐 준 꼼꼼한 너,`);
      L.push(KIND_LINES[me.c % KIND_LINES.length]); L.push(KIND_LINES[(me.c + 3) % KIND_LINES.length]);
      overlay.replaceChildren(el('div', { class: 'letter' }, [el('div', { class: 'lt', text: `${me.n}에게 온 행운의 편지` }), ...L.map(t => el('p', { text: t })), S.pub.letter ? el('p', { class: 'tl', text: '선생님의 한마디: ' + S.pub.letter }) : null, el('div', { class: 'mission', text: '이 편지를 옆 친구에게 소리 내어 읽어 주면 행운이 두 배가 돼요.' })]));
    });
  }

  const VIEW = { maze: 300, terr: 560, worm: 720 };
  function frame(ms) {
    S.t = ms / 1000; const P = S.pub, g = GAMES[P.gid], st = S.st || {}, t = S.t;
    const w = pv.clientWidth, hgt = pv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (pv.width !== Math.round(w * dpr) || pv.height !== Math.round(hgt * dpr)) { pv.width = Math.round(w * dpr); pv.height = Math.round(hgt * dpr); }
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, pv.width, pv.height);
    if (toastT && ms - toastT > 2200) { toast.className = ''; toastT = 0; }
    const isG = P.scene === 'game' && !!GAMEDEF[P.gid], askOn = isG && P.ask && !['intro', 'count', 'result'].includes(P.ph);
    const play = P.scene === 'game' && !isG && (P.ph === 'play' || P.ph === 'count');
    pv.classList.toggle('hidden', !!askOn); pask.classList.toggle('hidden', !askOn);
    if (askOn && (P.ask.key !== askKey || !!P.ask.closed !== askClosed)) {
      if (P.ask.key !== askKey && !(lastMsg && performance.now() - lastMsg.rt < 4000)) lastMsg = null;
      askKey = P.ask.key; askClosed = !!P.ask.closed; env.diff = null; env.c = me.c; env.name = me.n; env.marble = P.gid === 'marble'; env.hat = { mole: 'explorer', beat: 'band', taste: 'party', tquiz: 'party', memory: 'city', zoom: 'explorer', ten: 'city', solo: 'desert', marble: null, diff: 'night' }[P.gid];
      env.teamColor = null;
      renderAsk(pask, P.ask, env); if (env.diff) env.diff.setImg(S.img);
    }
    if (!askOn) askKey = null;
    if (env.diff && P.df) env.diff.setFixed(P.df.fixed);
    const oxOn = P.scene === 'game' && P.gid === 'ox';
    document.body.classList.toggle('ox3', oxOn); document.body.classList.toggle('oxres', oxOn && P.ph === 'result');
    if (oxOn) oxFrame(P, st); else { OX3D.detach(); if (ox.ui) { ox.ui.root.remove(); ox.ui.rv.classList.add('hidden'); ox.rvOn = false; } }
    joy.classList.toggle('hidden', !(play || (oxOn && P.ph !== 'result')));
    const ptxt = P.scene === 'game' || P.scene === 'fly' ? (g ? g.icon + ' ' + g.place : '') : P.scene === 'end' ? '🏫 교실' : '', pk = ptxt + (P.lv || '') + P.scene;
    if (place.dataset.k !== pk) { place.dataset.k = pk; place.replaceChildren(ptxt, (P.scene === 'game' || P.scene === 'fly') && P.lv ? el('span', { class: 'lvb', style: 'background:' + LVCOL[P.lv], text: LVNAME[P.lv] }) : ''); }
    let B = '', U = '', cls = '';
    const view = P.scene === 'game' && VIEW[P.gid] && S.st && P.ph !== 'intro';
    if (view) {
      let mx = cam.x, my = cam.y;
      if (P.gid === 'worm') { const wm = st.w && st.w[uid]; if (wm && wm[2].length) { mx = wm[2][0]; my = wm[2][1]; } } else if (st.p && st.p[uid]) { mx = st.p[uid][0]; my = st.p[uid][1]; }
      cam.x += (mx - cam.x) * 0.25; cam.y += (my - cam.y) * 0.25;
      const sc = pv.width / VIEW[P.gid];
      c.fillStyle = P.gid === 'maze' ? '#1e7fd6' : P.gid === 'worm' ? '#ff8fc7' : '#222'; c.fillRect(0, 0, pv.width, pv.height);
      c.setTransform(sc, 0, 0, sc, pv.width / 2 - cam.x * sc, pv.height / 2 - cam.y * sc);
      if (P.gid === 'maze') drawMaze(c, S); else if (P.gid === 'terr') drawTerr(c, S); else drawWorm(c, S);
      if (P.gid === 'terr' && S.board) {   // 작은 전체 지도: 내 위치와 우리 팀 땅
        const mw = pv.width * 0.34, mh = mw * Sim.Terr.TH / Sim.Terr.TW, mx = pv.width - mw - 8 * dpr, my = 8 * dpr;
        c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 0.92; c.drawImage(S.board, mx, my, mw, mh); c.globalAlpha = 1;
        c.lineWidth = 2 * dpr; c.strokeStyle = '#fff'; c.strokeRect(mx, my, mw, mh);
        const k = mw / Sim.Terr.TW; c.strokeStyle = '#ffd400'; c.strokeRect(mx + (cam.x - VIEW.terr / 2) * k, my + (cam.y - pv.height / sc / 2) * k, VIEW.terr * k, pv.height / sc * k);
        c.fillStyle = '#e63946'; c.beginPath(); c.arc(mx + cam.x * k, my + cam.y * k, 4 * dpr, 0, 7); c.fill();
      }
    } else {
      const hatBy = { ox: 'band', red: 'gym', maze: 'explorer', terr: P.theme && THEMES[P.theme] ? THEMES[P.theme].hat : 'city' }[P.scene === 'game' || P.scene === 'fly' ? P.gid : ''] || (P.scene === 'end' ? 'party' : null);
      const s = Math.min(pv.width, pv.height) * 0.26;
      const jm = Math.hypot(jv.x, jv.y);
      drawChar(c, pv.width / 2, pv.height / 2, s, me.c, { hat: hatBy, face: P.scene === 'end' || lastOx === 'right' ? 'laugh' : lastOx === 'fell' ? 'shock' : 'smile', cheer: P.scene === 'end' || lastOx === 'right', walk: jm, dir: jm > 0.15 ? Math.atan2(jv.y, jv.x) : null, bob: jm > 0.15 ? 0 : -Math.abs(Math.sin(t * 3)) * s * 0.15, team: P.gid === 'terr' && P.scene === 'game' && me.tm != null ? me.tm : null });
    }
    if (P.scene === 'lobby') { B = '입장 완료!'; U = '교실 화면에서 내 캐릭터를 찾아보세요'; }
    else if (P.scene === 'map') { B = '다음 여행지는?'; U = '선생님이 지도를 보고 있어요'; }
    else if (P.scene === 'fly') { B = g ? `${g.place}(으)로 날아가는 중` : ''; U = '열기구 꽉 잡아요'; }
    else if (P.scene === 'end') { B = '여행 끝!'; U = '교실에 돌아왔어요'; }
    else if (P.scene === 'game') {
      const my = st.p && st.p[uid];
      if (P.ph === 'intro') { B = g.name; U = (RULES[P.gid] || [''])[0]; }
      else if (P.ph === 'count') { B = String(Math.max(0, Math.ceil((P.t - Net.now()) / 1000)) || '출발!'); U = isG ? '큰 화면을 보세요' : '조이스틱 준비'; }
      else if (P.ph === 'result') { if (lastRes) { B = (lastRes.team != null ? TEAM[lastRes.team].s + ' ' + TEAM[lastRes.team].n + '팀 ' : '') + lastRes.rank + '등'; U = lastRes.v + (lastRes.unit || ''); } else if (lastMsg) { B = lastMsg.b; U = lastMsg.s || ''; } else { B = '결과 발표'; U = '교실 화면을 보세요'; } }
      else if (isG) {
        if (lastMsg) { B = lastMsg.b; U = lastMsg.s || ''; cls = lastMsg.c || ''; }
        else if (P.ph === 'teacher') { B = '선생님이 답을 고르는 중'; U = '큰 화면을 보세요'; }
        else if (P.ph === 'review') { B = '선생님이 답을 확인 중'; U = '조금만 기다려요'; }
        else if (P.ph === 'show') { B = '큰 화면을 기억해요!'; U = ''; }
        else { B = ''; U = P.ask && P.ask.closed ? '마감됐어요. 큰 화면을 보세요' : '큰 화면을 보며 폰으로 답해요'; }
      }
      else if (P.gid === 'ox') {
        if (P.ph === 'play' && my) { const z = my[0] < 640 ? 'O' : my[0] > 960 ? 'X' : '-'; B = z === '-' ? '위험 구역!' : `지금 ${z} 구역`; U = z === '-' ? '어서 O나 X로 걸어가요' : `남은 시간 ${Math.ceil(st.left || 0)}초`; cls = z === 'O' ? 'blue' : z === 'X' ? 'red' : 'warn'; }
        else if (P.ph === 'closed') { B = '마감!'; U = my && my[2] === 'fall' ? '으악, 바닥이 갈라졌어요' : '정답 공개를 기다려요'; }
        else if (P.ph === 'reveal') { B = lastOx === 'right' ? '정답! +10점' : lastOx === 'wrong' ? '아쉬워요' : lastOx === 'fell' ? '떨어졌어요' : '정답 공개'; U = lastOx === 'right' && P.practice ? '연습판은 점수가 없어요' : '다음 문제에 다시 가운데에서 출발해요'; cls = lastOx === 'right' ? 'green' : ''; }
      } else if (P.gid === 'red') {
        if (!my) { B = '다음 판부터 함께해요'; }
        else if (my[2] === 'out') { B = '삐익! 걸렸어요'; U = '다음 판에 다시 나와요'; }
        else if (my[2] === 'fin') { B = `골인! ${my[3]}등`; cls = 'green'; }
        else if (P.ph === 'play') { if (st.it === 'look') { B = '멈춰!!'; U = '손을 떼요'; cls = 'red'; } else { B = '지금이야!'; U = '오른쪽으로 밀어요'; cls = 'green'; } }
        else { B = `${P.round}판 끝`; U = '다음 판을 기다려요'; }
      } else if (P.gid === 'maze') { if (my && my[2] === 'fin') { B = `보물 발견! ${my[3]}등`; cls = 'green'; } else { U = `출구는 오른쪽 끝${(st.cr || []).length ? ' · 게 조심' : ''} · 남은 ${Math.ceil(st.left || 0)}초`; } }
      else if (P.gid === 'terr') { if (my) { const fx = []; if (my[3] > 0) fx.push(`⚡ 번개 ${my[3]}초`); if (my[4] > 0) fx.push(`🛡 방패 ${my[4]}초`); if (my[5] > 0) fx.push(`❄ 느려짐 ${my[5]}초`); const T = TEAM[my[2]], stars = (st.lm || []).filter(o => o === my[2]).length; U = `${T.s} ${T.n}팀 ${(st.pc || [])[my[2]] || 0}%${stars ? ' ★' + stars : ''} · 남은 ${Math.ceil(st.left || 0)}초` + (fx.length ? ' · ' + fx.join(' ') : ''); } }
      else if (P.gid === 'worm') { const ws = st.w || {}, mw = ws[uid]; if (mw) { if (mw[1]) { B = '흩어졌어요!'; U = '2초 뒤 다시 출발'; } else { const rank = 1 + Object.keys(ws).filter(i => ws[i][0] > mw[0]).length; U = `길이 ${mw[0]} · ${rank}등 · 남은 ${Math.ceil(st.left || 0)}초`; } } }
      if (P.paused) { B = '잠깐 멈춤'; U = ''; }
    }
    if (big.textContent !== B) big.textContent = B; if (sub.textContent !== U) sub.textContent = U;
    msg.className = cls + (view && !B ? ' slim' : '');
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
