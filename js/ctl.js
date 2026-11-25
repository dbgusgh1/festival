/* 진행자 조종판. 교실 화면의 ⚙ 서랍과 선생님 폰 조종 화면이 같은 코드를 쓴다.
   미공개 정보(선생님 답 고르기, 겹치면 0점 답 검토)는 교실 화면 서랍에서 쓰면 학생에게 보일 수 있어 경고를 붙인다. */
function buildControl(root, ctx) {
  const o = { practice: false, src: 'default', n: 0, auto: true, theme: '', collide: true, nteams: 4, mode: 'race', k: 3, spots: 5, need: 4 };
  const send = ctx.send, S = ctx.S;
  const btn = (t, fn, cls) => el('button', { class: 'b ' + (cls || ''), text: t, onclick: fn });
  const h = t => el('h3', { text: t });
  const sel = (key, pairs) => { const s = el('select', { onchange: e => { const v = e.target.value; o[key] = v === 'true' ? true : v === 'false' ? false : /^\d+$/.test(v) ? +v : v; } }, pairs.map(([v, t]) => el('option', { value: v, text: t }))); s.value = String(o[key]); return s; };
  const lab = (t, node) => el('label', { class: 'opt' }, [el('span', { text: t }), node]);

  const status = el('div', { class: 'cstat' });
  const target = el('input', { type: 'number', min: 1, max: 200, placeholder: '예: 30', class: 'num' });
  const tErr = el('div', { class: 'err' });
  const lobby = el('div', { class: 'cblk' }, [h('입장'), el('div', { class: 'row' }, [lab('목표 인원', target), btn('목표 인원이 되면 자동 시작', () => { const n = parseInt(target.value, 10); if (!(n >= 1 && n <= 200)) { tErr.textContent = '1에서 200 사이 숫자를 넣어 주세요.'; return; } tErr.textContent = ''; send({ t: 'target', n }); })]), tErr,
    el('div', { class: 'row' }, [btn('자동 시작 취소', () => send({ t: 'cancel' })), btn('현재 인원으로 시작', () => send({ t: 'begin' }), 'pri')])]);

  const grid = el('div', { class: 'dgrid' }, Object.keys(GAMES).sort((a, b) => GAMES[a].no - GAMES[b].no).map(id => {
    const g = GAMES[id];
    return el('button', { class: 'dest' + (g.ready ? '' : ' off'), disabled: !g.ready || null, onclick: () => send({ t: 'go', gid: id, o: Object.assign({}, o) }) }, [el('b', { text: g.icon + ' ' + g.place }), el('span', { text: g.name + (g.team ? ' · 팀전' : '') + (g.ready ? '' : ' · 준비 중') })]);
  }));
  const pr = el('input', { type: 'checkbox', onchange: e => (o.practice = e.target.checked) });
  const kIn = el('input', { type: 'number', min: 1, max: 50, value: 3, class: 'num', onchange: e => (o.k = Math.max(1, parseInt(e.target.value, 10) || 1)) });
  const dest = el('div', { class: 'cblk' }, [h('여행지 고르기 (누르면 바로 날아가요)'),
    el('div', { class: 'opts' }, [lab('연습판', pr),
      lab('문제 출처', sel('src', [['default', '기본 문제'], ['mine', '내 문제'], ['shared', '공용 창고'], ['mix', '모두 섞어서']])),
      lab('문제·판 수', sel('n', [[0, '게임 기본값'], [1, '1'], [3, '3'], [5, '5'], [8, '8'], [10, '10']])),
      lab('술래', sel('auto', [['true', '자동'], ['false', '선생님이 직접']])),
      lab('땅따먹기 맵', sel('theme', [['', '무작위'], ['city', '흑백 도시'], ['desert', '사막'], ['sea', '바닷속'], ['night', '밤하늘']])),
      lab('지렁이 충돌', sel('collide', [['true', '켜기'], ['false', '끄기']])),
      lab('로켓 엔진', sel('need', [[3, '3개'], [4, '4개'], [5, '5개']])),
      lab('틀린 곳', sel('spots', [[3, '3곳'], [5, '5곳'], [7, '7곳']])),
      lab('구슬 경주', sel('mode', [['race', '경주 모드'], ['lottery', '행운 추첨']])), lab('당첨 인원', kIn)]), grid]);

  const bStart = btn('시작', () => send({ t: 'start' }), 'pri'), bPause = btn('일시정지', () => send({ t: 'pause' })), bReveal = btn('정답 공개', () => send({ t: 'reveal' }), 'pri');
  const bNext = btn('다음', () => send({ t: 'next' }), 'pri'), bLook = btn('돌아보기!', () => send({ t: 'look' }), 'warn'), bEnd = btn('지금 끝내고 결과 보기', () => send({ t: 'end' })), bMap = btn('지도로 돌아가기', () => send({ t: 'map' }));
  const bCan = btn('', () => send({ t: S.pub.can }), 'pri');
  const secret = el('div', { class: 'secret' });
  const game = el('div', { class: 'cblk' }, [h('게임 진행'), el('div', { class: 'row wrap' }, [bStart, bCan, bPause, bReveal, bNext, bLook, bEnd, bMap]), secret]);

  const plist = el('div', { class: 'plist' });
  const people = el('div', { class: 'cblk' }, [h('참가자와 팀'), el('div', { class: 'row' }, [lab('팀 수', sel('nteams', [[2, '2팀'], [3, '3팀'], [4, '4팀']])), btn('팀 자동 편성', () => send({ t: 'teams', n: o.nteams }))]), plist]);
  const letter = el('input', { type: 'text', maxlength: 80, placeholder: '예: 한 학기 동안 고마웠어' });
  const fin = el('div', { class: 'cblk' }, [h('마무리'), lab('편지 끝에 붙일 한마디', letter), el('div', { class: 'row' }, [btn('한마디 저장', () => send({ t: 'letter', text: letter.value })), btn('행사 마치기 (교실로 돌아오기)', () => send({ t: 'finish' }), 'pri')])]);
  const test = el('div', { class: 'cblk' }, [h('시험용 (실제 학생이 아닌 가상 참가자)'), el('div', { class: 'row' }, [btn('가상 참가자 10명 넣기', () => send({ t: 'bots', n: 10 })), btn('가상 참가자 지우기', () => send({ t: 'nobots' }))])]);
  root.replaceChildren(status, lobby, dest, game, people, fin, test);
  const show = (n, v) => (n.style.display = v ? '' : 'none');
  let pkey = '', skey = '';
  const warn = () => ctx.screen ? el('div', { class: 'err', text: '이 서랍은 교실 화면에 비쳐요. 학생이 보면 안 되면 선생님 폰 조종판에서 하세요.' }) : null;

  function drawSecret() {
    const pv = S.priv || {}, P = S.pub || {};
    if (pv.need === 'tans') {
      secret.replaceChildren(el('h3', { text: '선생님 답 몰래 고르기' }), warn(), el('div', { class: 'hint', text: pv.q }),
        el('div', { class: 'dgrid' }, pv.o.map((t, k) => btn(SYM[k] + ' ' + t, () => send({ t: 'tans', v: k })))));
    } else if (pv.review && P.ph === 'review') {
      const groups = pv.review;
      secret.replaceChildren(el('h3', { text: '답 검토 (묶기·제외·가리기 후 점수 확정)' }), warn(),
        ...groups.map(g => {
          const into = el('select', { onchange: e => { if (e.target.value) send({ t: 'smerge', from: g.k, into: e.target.value }); } }, [el('option', { value: '', text: '같은 답으로 묶기…' }), ...groups.filter(x => x.k !== g.k).map(x => el('option', { value: x.k, text: x.label }))]);
          return el('div', { class: 'prow' }, [el('span', { class: 'pn', text: `${g.label} · ${g.n}명` + (g.out ? ' (제외)' : '') + (g.hide ? ' (가림)' : '') }), into, btn(g.out ? '제외 취소' : '주제와 안 맞음', () => send({ t: 'sout', k: g.k }), 'sm'), btn(g.hide ? '보이기' : '가리기', () => send({ t: 'shide', k: g.k }), 'sm')]);
        }));
    } else secret.replaceChildren();
  }
  function update() {
    const P = S.pub || {}, ids = Object.keys(S.players || {}).filter(id => S.players[id] && S.players[id].c);
    const g = GAMES[P.gid], where = { lobby: '입장 대기', map: '지도에서 여행지 고르는 중', fly: '이동 중', game: g ? g.place + ' · ' + g.name : '', end: '행사 마침' }[P.scene] || '';
    status.textContent = `방 ${ctx.code} · ${ids.length}명 · ${where}` + (P.practice && P.scene === 'game' ? ' · 연습판' : '');
    show(lobby, P.scene === 'lobby'); show(dest, P.scene === 'map' || (P.scene === 'game' && P.ph === 'result') || P.scene === 'end');
    show(game, P.scene === 'game'); show(fin, P.scene !== 'lobby');
    show(bStart, P.ph === 'intro'); show(bPause, P.ph === 'play'); bPause.textContent = P.paused ? '계속하기' : '일시정지';
    show(bReveal, P.gid === 'ox' && P.ph === 'closed');
    show(bNext, (P.gid === 'ox' && P.ph === 'reveal') || (P.gid === 'red' && P.ph === 'roundend'));
    bNext.textContent = P.gid === 'ox' ? (P.q && P.q.n < P.q.total ? '다음 문제' : '결과 보기') : (P.round < P.rounds ? '다음 판' : '결과 보기');
    show(bCan, !!P.can && P.ph !== 'result' && P.ph !== 'intro'); bCan.textContent = P.canLabel || '다음';
    show(bLook, P.gid === 'red' && P.ph === 'play' && P.manual); show(bEnd, P.ph && P.ph !== 'result');
    const sk = JSON.stringify(S.priv || {}) + P.ph; if (sk !== skey) { skey = sk; drawSecret(); }
    const key = ids.map(id => id + (S.players[id].tm ?? '') + (S.players[id].hide ? 'h' : '')).join(',');
    if (key !== pkey) {
      pkey = key;
      plist.replaceChildren(...ids.map(id => { const p = S.players[id], T = p.tm != null ? TEAM[p.tm] : null;
        return el('div', { class: 'prow' }, [el('span', { class: 'pn', text: p.n + (p.hide ? ' (가려짐)' : '') }), el('button', { class: 'tm', style: T ? 'background:' + T.c : '', text: T ? T.s + ' ' + T.n : '팀 없음', onclick: () => send({ t: 'team', pid: id }) }), btn(p.hide ? '보이기' : '이름 가리기', () => send({ t: 'hide', pid: id }), 'sm'), btn('내보내기', () => send({ t: 'kick', pid: id }), 'sm')]); }));
    }
  }
  update();
  return { update };
}

/* 선생님 폰 조종 화면 */
async function startCtl(code) {
  const base = 'rooms/' + code, app = $('#app'); document.body.className = 'ctl';
  const meta = await Net.get(base + '/meta');
  if (!meta || meta.owner !== Net.uid()) { app.replaceChildren(el('div', { class: 'card', text: '이 방을 연 선생님 계정으로 로그인해야 조종할 수 있어요.' })); return; }
  const S = { pub: {}, players: {}, priv: {} }, box = el('div', { class: 'ctlbox' });
  app.replaceChildren(el('h2', { text: '진행자 조종판' }), box, el('a', { class: 'b link', href: location.pathname + '?teacher' + (QS.has('demo') ? '&demo' : ''), text: '문제·사진 관리는 선생님 첫 화면에서' }));
  const ui = buildControl(box, { code, S, send: m => Net.set(base + '/cmd', Object.assign({ ts: Net.now(), id: Math.random() }, m)) });
  Net.on(base + '/pub', v => { S.pub = v || {}; ui.update(); }); Net.on(base + '/players', v => { S.players = v || {}; ui.update(); }); Net.on(base + '/priv', v => { S.priv = v || {}; ui.update(); });
}
