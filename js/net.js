/* 통신 계층. Firebase 설정이 있으면 Firebase Realtime Database, 없으면 연습 모드(같은 컴퓨터의 창끼리)로 동작한다.
   화면 코드는 set / on / get 세 가지만 쓴다. */
const $ = (s, r) => (r || document).querySelector(s);
function el(tag, attrs, kids) {
  const e = document.createElement(tag);
  for (const k in (attrs || {})) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
  }
  [].concat(kids || []).forEach(c => c != null && e.append(c));
  return e;
}
const QS = new URLSearchParams(location.search);
const clean = v => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const MAIL = '@uribanfest.app';

const Net = (function () {
  const cfg = window.FB_CONFIG || {};
  const live = !!(window.firebase && cfg.apiKey && !/^여기/.test(cfg.apiKey) && cfg.databaseURL && !QS.has('demo'));

  if (live) {
    firebase.initializeApp(cfg);
    const db = firebase.database(), auth = firebase.auth();
    let off = 0, user = null;
    db.ref('.info/serverTimeOffset').on('value', s => (off = s.val() || 0));
    const first = new Promise(res => auth.onAuthStateChanged(u => { user = u; res(); }));
    const err = e => {
      const m = { 'auth/email-already-in-use': '이미 있는 아이디예요.', 'auth/weak-password': '비밀번호는 6자 이상이어야 해요.', 'auth/invalid-credential': '아이디나 비밀번호가 맞지 않아요.', 'auth/wrong-password': '아이디나 비밀번호가 맞지 않아요.', 'auth/user-not-found': '아이디나 비밀번호가 맞지 않아요.', 'auth/operation-not-allowed': 'Firebase 콘솔에서 로그인 방법(이메일/비밀번호, 익명)을 켜 주세요.' };
      throw new Error(m[e.code] || e.message);
    };
    return {
      live: true,
      ready: () => first,
      uid: () => user && user.uid,
      teacher: () => (user && !user.isAnonymous && user.email ? user.email.split('@')[0] : null),
      anon: async () => { await first; if (!user) await auth.signInAnonymously().catch(err); user = auth.currentUser; return user.uid; },
      signup: (id, pw) => auth.createUserWithEmailAndPassword(id + MAIL, pw).then(c => { user = c.user; }).catch(err),
      login: (id, pw) => auth.signInWithEmailAndPassword(id + MAIL, pw).then(c => { user = c.user; }).catch(err),
      logout: () => auth.signOut(),
      now: () => Date.now() + off,
      set: (p, v) => db.ref(p).set(clean(v)).catch(e => console.warn('쓰기 실패', p, e.message)),
      // 학생 입력: 서버에 도착한 시각(at)을 Firebase 서버가 찍는다
      ev: (p, v) => db.ref(p).set(Object.assign(clean(v), { at: firebase.database.ServerValue.TIMESTAMP })).catch(e => console.warn('입력 실패', e.message)),
      get: p => db.ref(p).get().then(s => s.val()),
      on: (p, cb) => db.ref(p).on('value', s => cb(s.val())),
      gone: (p, v) => db.ref(p).onDisconnect().set(v)
    };
  }

  /* ── 연습 모드: BroadcastChannel로 같은 브라우저의 창끼리 데이터 나무를 맞춘다 ── */
  const tree = {}, subs = [];
  const bc = new BroadcastChannel('uriban-festival');
  const parts = p => p.split('/').filter(Boolean);
  const read = p => { let n = tree; for (const k of parts(p)) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : n; };
  const write = (p, v) => {
    const ks = parts(p); let n = tree;
    for (let i = 0; i < ks.length - 1; i++) { if (typeof n[ks[i]] !== 'object' || n[ks[i]] == null) n[ks[i]] = {}; n = n[ks[i]]; }
    if (v === null) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = v;
    for (const s of subs) if (s.p.startsWith(p) || p.startsWith(s.p)) s.cb(clean(read(s.p)));
  };
  let synced, gotTree = false;
  const ready = new Promise(res => (synced = res));
  bc.onmessage = e => {
    const m = e.data;
    if (m.t === 'set') write(m.p, m.v);
    else if (m.t === 'hello' && Object.keys(tree).length) bc.postMessage({ t: 'tree', tree });
    else if (m.t === 'tree' && !gotTree) { gotTree = true; for (const k in m.tree) write(k, m.tree[k]); synced(); }
  };
  bc.postMessage({ t: 'hello' }); setTimeout(() => synced(), 300);
  // 창마다 다른 참가자가 되도록 탭별 번호를 쓴다(새로고침해도 유지)
  let uid = sessionStorage.getItem('fest_uid');
  if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('fest_uid', uid); }
  const accounts = () => JSON.parse(localStorage.getItem('fest_accounts') || '{}');
  return {
    live: false,
    ready: () => ready,
    uid: () => { const t = sessionStorage.getItem('fest_teacher'); return t ? 'T_' + t : uid; },
    teacher: () => sessionStorage.getItem('fest_teacher'),
    anon: async () => uid,
    signup: async (id, pw) => { const a = accounts(); if (a[id]) throw new Error('이미 있는 아이디예요.'); a[id] = pw; localStorage.setItem('fest_accounts', JSON.stringify(a)); sessionStorage.setItem('fest_teacher', id); },
    login: async (id, pw) => { if (accounts()[id] !== pw) throw new Error('아이디나 비밀번호가 맞지 않아요.'); sessionStorage.setItem('fest_teacher', id); },
    logout: async () => sessionStorage.removeItem('fest_teacher'),
    now: () => Date.now(),
    set: (p, v) => { v = clean(v); write(p, v); bc.postMessage({ t: 'set', p, v }); return Promise.resolve(); },
    ev(p, v) { return this.set(p, Object.assign(clean(v), { at: Date.now() })); },
    get: async p => { await ready; return clean(read(p)); },
    on: (p, cb) => { subs.push({ p, cb }); ready.then(() => cb(clean(read(p)))); },
    gone: () => {}
  };
})();
