/* 선생님 서랍: 내 문제(OX·선생님 퀴즈·취향·겹치면 0점 주제), 내 사진(확대 탐정·틀린 그림), 공용 창고, 관리자, 지난 행사 기록 */
const QTYPES = {
  ox: { name: 'OX 퀴즈', show: v => `[${v.a}] ${v.q}` },
  tq: { name: '선생님 퀴즈', show: v => `${v.q} · ${v.o.join(' / ')}` + (v.a != null ? ` (내 답: ${v.o[v.a]})` : '') },
  taste: { name: '취향 질문', show: v => `${v.a} vs ${v.b}` },
  solo: { name: '겹치면 0점 주제', show: v => v.q }
};
const fileToCover = file => new Promise((res, rej) => {
  const fr = new FileReader();
  fr.onload = () => { const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 900; ART.cover(cv.getContext('2d'), im); res(cv); }; im.onerror = () => rej(new Error('그림 파일을 읽지 못했어요.')); im.src = fr.result; };
  fr.onerror = () => rej(new Error('파일을 읽지 못했어요.')); fr.readAsDataURL(file);
});

function teacherBox(root) {
  const uid = Net.uid(), me = Net.teacher(), T = 'teachers/' + uid;
  const tabs = el('div', { class: 'row wrap' }), body = el('div', { class: 'tbody' });
  const pages = { q: '내 문제', photo: '내 사진', shared: '공용 창고', hist: '지난 행사' };
  let cur = 'q', isAdmin = false;
  const btn = (t, fn, cls) => el('button', { class: 'b ' + (cls || ''), text: t, onclick: fn });
  function paintTabs() { tabs.replaceChildren(...Object.keys(pages).map(k => btn(pages[k], () => { cur = k; paintTabs(); page(); }, k === cur ? 'pri' : ''))); }
  root.replaceChildren(el('h3', { text: '내 서랍' }), tabs, body);
  Net.get('admins/' + uid).then(v => { if (v) { isAdmin = true; pages.admin = '관리자'; paintTabs(); } });
  paintTabs(); page();

  function page() { ({ q: pageQ, photo: pagePhoto, shared: pageShared, hist: pageHist, admin: pageAdmin })[cur](); }

  /* ── 내 문제 ── */
  function pageQ() {
    let type = 'ox';
    const typeSel = el('select', { onchange: e => { type = e.target.value; form(); } }, Object.keys(QTYPES).map(k => el('option', { value: k, text: QTYPES[k].name })));
    const f = el('div', { class: 'qform' }), list = el('div', { class: 'qlist' }), err = el('div', { class: 'err' });
    body.replaceChildren(el('div', { class: 'row' }, [el('span', { text: '종류' }), typeSel]), f, err, list);
    function inp(ph, max) { const i = el('input', { type: 'text', maxlength: max || 60, placeholder: ph }); i.addEventListener('input', () => (err.textContent = '')); return i; }
    function form() {
      let get;
      if (type === 'ox') { const q = inp('예: 우리 반 체육대회 줄다리기에서 우리가 이겼다', 80), a = el('select', {}, [el('option', { value: 'O', text: '정답 O' }), el('option', { value: 'X', text: '정답 X' })]), ex = inp('짧은 해설 (없어도 돼요)'); f.replaceChildren(q, el('div', { class: 'row' }, [a, ex])); get = () => q.value.trim() ? { q: q.value.trim(), a: a.value, ex: ex.value.trim() } : '문제를 먼저 적어 주세요.'; }
      else if (type === 'tq') { const q = inp('예: 선생님이 방학 첫날 가장 먼저 할 일은?', 80), os = [0, 1, 2, 3].map(k => inp(`보기 ${k + 1}`, 20)), a = el('select', {}, [el('option', { value: '', text: '답은 행사 때 몰래 고를게요' }), ...[0, 1, 2, 3].map(k => el('option', { value: k, text: `내 답은 보기 ${k + 1}` }))]);
        f.replaceChildren(q, el('div', { class: 'dgrid' }, os), a); get = () => { const o = os.map(i => i.value.trim()); if (!q.value.trim()) return '문제를 먼저 적어 주세요.'; if (o.some(x => !x)) return '보기 네 개를 모두 적어 주세요.'; const r = { q: q.value.trim(), o }; if (a.value !== '') r.a = +a.value; return r; }; }
      else if (type === 'taste') { const a = inp('예: 탕수육 부먹', 20), b = inp('예: 탕수육 찍먹', 20); f.replaceChildren(el('div', { class: 'row' }, [a, el('span', { text: 'vs' }), b])); get = () => a.value.trim() && b.value.trim() ? { a: a.value.trim(), b: b.value.trim() } : '두 선택지를 모두 적어 주세요.'; }
      else { const q = inp('예: 교실에서 볼 수 있는 네모난 물건은?', 60); f.replaceChildren(q); get = () => q.value.trim() ? { q: q.value.trim() } : '주제를 먼저 적어 주세요.'; }
      f.append(btn('추가', () => { const v = get(); if (typeof v === 'string') { err.textContent = v; return; } Net.set(`${T}/q/${type}/q${Date.now().toString(36)}`, v); form(); }, 'pri'));
      Net.get(`${T}/q/${type}`).then(paint);
    }
    function paint(v) {
      v = v || {}; const ks = Object.keys(v);
      list.replaceChildren(...(ks.length ? ks.map(k => el('div', { class: 'prow' }, [el('span', { class: 'pn', text: QTYPES[type].show(v[k]) }),
        btn('공용 창고에 올리기', () => { const it = Object.assign({}, v[k]); if (type === 'tq') delete it.a; Net.set(`shared/${type}/${uid}_${k}`, Object.assign(it, { by: me, uid })).then(() => alertLine('공용 창고에 올렸어요. 다른 선생님도 쓸 수 있어요.')); }, 'sm'),
        btn('지우기', () => { Net.set(`${T}/q/${type}/${k}`, null).then(() => Net.get(`${T}/q/${type}`).then(paint)); }, 'sm')])) : [el('div', { class: 'hint', text: '아직 추가한 문제가 없어요. 위에서 추가하면 행사 때 "문제 출처: 내 문제"로 쓸 수 있어요.' })]));
    }
    function alertLine(t) { err.style.color = '#27b56a'; err.textContent = t; setTimeout(() => { err.textContent = ''; err.style.color = ''; }, 2500); }
    Net.on(`${T}/q`, () => { if (cur === 'q') Net.get(`${T}/q/${type}`).then(paint); });
    form();
  }

  /* ── 내 사진 ── */
  function pagePhoto() {
    let kind = 'diff', cv = null, spots = [], center = null;
    const kindSel = el('select', { onchange: e => { kind = e.target.value; reset(); } }, [el('option', { value: 'diff', text: '틀린 그림 찾기' }), el('option', { value: 'zoom', text: '사진 확대 탐정' })]);
    const file = el('input', { type: 'file', accept: 'image/*' }), err = el('div', { class: 'err' }), work = el('div', { class: 'pwork' }), list = el('div', { class: 'qlist' });
    body.replaceChildren(el('div', { class: 'row' }, [el('span', { text: '게임' }), kindSel]), el('div', { class: 'hint', text: '교실, 체육관, 여행 사진 등 직접 찍은 사진을 올려요. 사진은 내 계정에만 저장돼요.' }), file, err, work, el('h3', { text: '올린 사진' }), list);
    file.addEventListener('change', async () => { err.textContent = ''; const f = file.files[0]; if (!f) return; try { cv = await fileToCover(f); spots = []; center = null; editor(); } catch (e) { err.textContent = e.message; } });
    function reset() { cv = null; spots = []; center = null; work.replaceChildren(); file.value = ''; loadList(); }
    function editor() {
      const view = el('canvas', { width: 1600, height: 900, class: 'pview' }), vc = view.getContext('2d');
      const title = el('input', { type: 'text', maxlength: 20, placeholder: kind === 'diff' ? '그림 이름 (예: 우리 교실)' : '정답 (예: 사과)' });
      const alts = el('input', { type: 'text', maxlength: 60, placeholder: '다른 정답 표기, 쉼표로 (예: 애플, apple)' });
      const rIn = el('input', { type: 'range', min: 25, max: 120, value: 55 }), kSel = el('select', {}, [el('option', { value: 'color', text: '색 바꾸기' }), el('option', { value: 'erase', text: '지우기' }), el('option', { value: 'mirror', text: '좌우 뒤집기' })]);
      const preview = el('input', { type: 'checkbox' }), ws = [el('input', { type: 'range', min: 3, max: 25, value: 7 }), el('input', { type: 'range', min: 15, max: 70, value: 30 })];
      const info = el('div', { class: 'hint' });
      function paint() {
        vc.drawImage(cv, 0, 0);
        if (kind === 'diff') { if (preview.checked) ART.mutatePhoto(vc, spots); spots.forEach((s, k) => { vc.strokeStyle = '#ff2d55'; vc.lineWidth = 6; vc.beginPath(); vc.arc(s.x, s.y, s.r, 0, 7); vc.stroke(); txt(vc, String(k + 1), s.x, s.y, 40, '#fff', 'center', '#ff2d55'); }); info.textContent = `틀린 곳 ${spots.length}개 · 사진을 눌러 추가 (3~7개 권장)`; }
        else if (center) { [ws[0].value / 100, ws[1].value / 100, 1].forEach((w, k) => { const vw = 1600 * w, vh = vw * 9 / 16; let sx = Math.max(0, Math.min(1600 - vw, center.x - vw / 2)), sy = Math.max(0, Math.min(900 - vh, center.y - vh / 2)); vc.strokeStyle = ['#ff2d55', '#ffcc00', '#34c759'][k]; vc.lineWidth = 8; vc.strokeRect(sx, sy, vw, vh); }); info.textContent = '빨강 = 첫 단서, 노랑 = 두 번째 단서, 초록 = 마지막(전체)'; }
        else info.textContent = '첫 단서로 보여 줄 부분을 사진에서 눌러요';
      }
      view.addEventListener('click', e => { const r = view.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 1600, y = (e.clientY - r.top) / r.height * 900; if (kind === 'diff') { if (spots.length >= 9) return; spots.push({ x: Math.round(x), y: Math.round(y), r: +rIn.value, k: kSel.value }); } else center = { x: Math.round(x), y: Math.round(y) }; paint(); });
      [rIn, preview, ...ws].forEach(i => i.addEventListener('input', paint));
      const save = btn('저장', async () => {
        err.textContent = '';
        if (kind === 'diff' && spots.length < 1) { err.textContent = '틀린 곳을 하나 이상 찍어 주세요.'; return; }
        if (kind === 'zoom' && !center) { err.textContent = '첫 단서 위치를 사진에서 눌러 주세요.'; return; }
        if (kind === 'zoom' && !title.value.trim()) { err.textContent = '정답을 적어 주세요.'; return; }
        const id = 'p' + Date.now().toString(36), url = cv.toDataURL('image/jpeg', 0.8);
        await Net.set(`${T}/img/${id}`, url);
        const meta = kind === 'diff' ? { title: title.value.trim() || '내 사진', spots } : { ans: title.value.trim(), alts: alts.value.split(',').map(s => s.trim()).filter(Boolean), cx: center.x, cy: center.y, w: [ws[0].value / 100, ws[1].value / 100, 1] };
        await Net.set(`${T}/q/${kind}/${id}`, meta); reset();
      }, 'pri');
      work.replaceChildren(view, info, kind === 'diff' ? el('div', { class: 'opts' }, [el('label', { class: 'opt' }, [el('span', { text: '크기' }), rIn]), el('label', { class: 'opt' }, [el('span', { text: '바꾸는 방법' }), kSel]), el('label', { class: 'opt' }, [el('span', { text: '바뀐 모습 미리 보기' }), preview]), btn('마지막 점 지우기', () => { spots.pop(); paint(); }, 'sm')]) : el('div', { class: 'opts' }, [el('label', { class: 'opt' }, [el('span', { text: '첫 단서 폭' }), ws[0]]), el('label', { class: 'opt' }, [el('span', { text: '두 번째 단서 폭' }), ws[1]])]),
        title, kind === 'zoom' ? alts : null, save);
      paint();
    }
    function loadList() {
      Net.get(`${T}/q/${kind}`).then(v => { v = v || {}; const ks = Object.keys(v);
        list.replaceChildren(...(ks.length ? ks.map(k => el('div', { class: 'prow' }, [el('span', { class: 'pn', text: kind === 'diff' ? `${v[k].title} · 틀린 곳 ${(v[k].spots || []).length}개` : `정답 ${v[k].ans}` }), btn('지우기', async () => { await Net.set(`${T}/q/${kind}/${k}`, null); await Net.set(`${T}/img/${k}`, null); loadList(); }, 'sm')])) : [el('div', { class: 'hint', text: '아직 올린 사진이 없어요. 행사 때 "문제 출처: 내 문제"나 "모두 섞어서"를 고르면 나와요.' })])); });
    }
    loadList();
  }

  /* ── 공용 창고 ── */
  function pageShared() {
    const list = el('div', { class: 'qlist' });
    body.replaceChildren(el('div', { class: 'hint', text: '모든 선생님이 함께 쓰는 문제예요. 행사 때 "문제 출처: 공용 창고"를 고르면 나와요. 내가 올린 문제와(관리자는 모든 문제를) 지울 수 있어요.' }), list);
    Net.get('shared').then(v => {
      v = v || {}; const rows = [];
      Object.keys(QTYPES).forEach(type => Object.entries(v[type] || {}).forEach(([k, it]) => rows.push(el('div', { class: 'prow' }, [el('span', { class: 'pn', text: `[${QTYPES[type].name}] ${QTYPES[type].show(it)} · ${it.by || ''}` }), (it.uid === uid || isAdmin) ? btn('지우기', () => Net.set(`shared/${type}/${k}`, null).then(pageShared), 'sm') : null]))));
      list.replaceChildren(...(rows.length ? rows : [el('div', { class: 'hint', text: '아직 공용 창고가 비어 있어요.' })]));
    });
  }

  /* ── 지난 행사 ── */
  function pageHist() {
    Net.get(`${T}/rooms`).then(v => {
      v = v || {}; const ks = Object.keys(v).sort((a, b) => v[b].t - v[a].t).slice(0, 20);
      body.replaceChildren(...(ks.length ? ks.map(k => { const r = v[k], d = new Date(r.t);
        return el('div', { class: 'cblk' }, [el('b', { text: `${d.getMonth() + 1}월 ${d.getDate()}일 · 방 ${k} · ${r.n || 0}명` }),
          ...(r.games || []).map(g => el('div', { class: 'hint', text: `${GAMES[g.gid] ? GAMES[g.gid].icon + ' ' + GAMES[g.gid].name : g.gid}${g.practice ? ' (연습)' : ''} — ${(g.top || []).join(', ')}` })),
          navLink('이 방 다시 열기', '?host=' + k, 'b sm')]); }) : [el('div', { class: 'hint', text: '아직 연 행사가 없어요.' })]));
    });
  }

  /* ── 관리자 ── */
  function pageAdmin() {
    Net.get('users').then(v => {
      v = v || {}; const ks = Object.keys(v).sort((a, b) => (v[b].t || 0) - (v[a].t || 0));
      body.replaceChildren(el('div', { class: 'hint', text: `가입한 선생님 ${ks.length}명 · 공용 창고 정리는 "공용 창고" 탭에서 할 수 있어요.` }),
        ...ks.map(k => el('div', { class: 'prow' }, [el('span', { class: 'pn', text: `${v[k].id} · ${new Date(v[k].t || 0).toLocaleDateString('ko-KR')} 가입` })])));
    });
  }
}
