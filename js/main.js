/* 첫 화면과 주소별 화면 나누기
   주소 뒤에 ?r=방번호 → 학생 폰,  ?host=방번호 → 교실 화면,  ?ctl=방번호 → 선생님 조종판 */
window.boot = function () { return bootInner().catch(e => { console.error(e); showErr(e && (e.stack || e.message) || e); }); };
async function bootInner() {
  const app = $('#app');
  app.replaceChildren(el('div', { class: 'card', text: '불러오는 중…' }));
  await Net.ready();
  if (!Net.live && !$('#demo')) document.body.append(el('div', { id: 'demo', text: '연습 모드 · 이 컴퓨터의 브라우저 창끼리만 연결돼요' }));

  function teacherGate(then) {
    if (Net.teacher()) return then();
    let mode = 'login';
    const id = el('input', { type: 'text', placeholder: '아이디 (영문 소문자·숫자 3~20자)', autocapitalize: 'off' }), pw = el('input', { type: 'password', placeholder: '비밀번호 (6자 이상)' }), pw2 = el('input', { type: 'password', placeholder: '비밀번호 한 번 더' });
    const err = el('div', { class: 'err' }), go = el('button', { class: 'b pri' }), sw = el('button', { class: 'b link' }), title = el('div', { class: 'big' });
    [id, pw, pw2].forEach(i => i.addEventListener('input', () => (err.textContent = '')));
    const paint = () => { title.textContent = mode === 'login' ? '선생님 로그인' : '선생님 계정 만들기'; go.textContent = mode === 'login' ? '로그인' : '계정 만들기'; sw.textContent = mode === 'login' ? '처음이에요. 계정 만들기' : '이미 계정이 있어요'; pw2.style.display = mode === 'login' ? 'none' : ''; };
    sw.onclick = () => { mode = mode === 'login' ? 'signup' : 'login'; err.textContent = ''; paint(); };
    go.onclick = async () => {
      const i = id.value.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(i)) { err.textContent = '아이디는 영문 소문자와 숫자로 3~20자예요.'; return; }
      if (pw.value.length < 6) { err.textContent = '비밀번호는 6자 이상이어야 해요.'; return; }
      if (mode === 'signup' && pw.value !== pw2.value) { err.textContent = '비밀번호 두 칸이 서로 달라요.'; return; }
      try { await (mode === 'login' ? Net.login(i, pw.value) : Net.signup(i, pw.value)); if (mode === 'signup') Net.set('users/' + Net.uid(), { id: i, t: Net.now() }); then(); } catch (e) { err.textContent = e.message; }
    };
    paint();
    app.replaceChildren(el('div', { class: 'card' }, [title, id, pw, pw2, err, go, sw, navLink('처음으로', '?')]));
  }

  function dashboard() {
    document.body.className = 'ctl';
    const ed = el('div', { class: 'cblk' }), err = el('div', { class: 'err' });
    const open = async () => {
      for (let k = 0; k < 20; k++) { const code = String(1000 + ((Math.random() * 9000) | 0)); if (!(await Net.get('rooms/' + code + '/meta'))) { go('?host=' + code); return; } }
      err.textContent = '빈 방 번호를 찾지 못했어요. 다시 눌러 주세요.';
    };
    app.replaceChildren(el('h2', { text: `${Net.teacher()} 선생님` }),
      el('div', { class: 'cblk' }, [el('h3', { text: '교실 컴퓨터에서' }), el('div', { class: 'hint', text: '방을 열면 이 창이 교실 화면이 돼요. F11로 전체 화면을 켜 주세요.' }), el('button', { class: 'b pri', text: '새 방 열기', onclick: open }), err]),
      ed, el('button', { class: 'b link', text: '로그아웃', onclick: async () => { await Net.logout(); go('?'); } }));
    teacherBox(ed);
  }

  if (QS.get('r')) return startPlayer(QS.get('r').trim());
  if (QS.get('host')) return teacherGate(() => startHost(QS.get('host')));
  if (QS.get('ctl')) return teacherGate(() => startCtl(QS.get('ctl')));
  if (QS.has('teacher')) return teacherGate(dashboard);

  const code = el('input', { type: 'text', inputmode: 'numeric', maxlength: 4, placeholder: '방 번호 4자리' }), err = el('div', { class: 'err' });
  code.addEventListener('input', () => (err.textContent = ''));
  const cv = el('canvas', { width: 600, height: 200, class: 'parade' });
  app.replaceChildren(el('div', { class: 'card' }, [cv, el('div', { class: 'big', text: '우리 반 게임 페스티벌' }), el('div', { class: 'sub', text: '교실에서 출발해 세계를 여행하고 다시 교실로!' }), code, err,
    el('button', { class: 'b pri', text: '학생 입장', onclick: () => { const v = code.value.trim(); if (!/^\d{4}$/.test(v)) { err.textContent = '교실 화면에 보이는 방 번호 4자리를 넣어 주세요.'; return; } go('?r=' + v); } }),
    navLink('선생님은 여기로', '?teacher'), el('div', { class: 'hint', style: 'opacity:.5;font-size:12px;margin-top:6px', text: APP_VER + (Net.live ? ' · 실제 연결' : ' · 연습 모드') })]));
  const c = cv.getContext('2d'); (function l(ms) { if (!cv.isConnected) return; c.clearRect(0, 0, 600, 200); [7, 23, 41, 12, 58, 94].forEach((s, k) => drawChar(c, 60 + k * 96, 110, 36, s, { face: k % 2 ? 'laugh' : 'smile', hat: ['band', 'explorer', 'city', null, 'night', 'party'][k], bob: -Math.abs(Math.sin(ms / 300 + k)) * 14 })); requestAnimationFrame(l); })(0);
}
window.boot();
