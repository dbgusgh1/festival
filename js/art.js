/* 그림 모음: 틀린 그림 찾기 장면 4종(교실·체육관·급식실·운동장)과 사진 확대 탐정 기본 그림 4종.
   장면은 물건 목록으로 만들고, 틀린 곳은 물건 몇 개의 색·크기·있고 없음을 바꿔서 매번 새로 만든다. */
const ART = (function () {
  const hsl = (h, s, l) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;
  const LINE = '#3a2a1a';
  function R(c, x, y, w, h, r, fill) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill(); c.lineWidth = 4; c.strokeStyle = LINE; c.stroke(); }
  function C(c, x, y, r, fill, lw) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = fill; c.fill(); if (lw !== 0) { c.lineWidth = lw || 4; c.strokeStyle = LINE; c.stroke(); } }
  // 물건 종류: 그리기 함수와 대략의 반지름(틀린 곳 판정 범위)
  const OBJ = {
    board: { r: 120, f(c, h) { R(c, -260, -110, 520, 220, 10, '#7a4a22'); R(c, -244, -96, 488, 192, 6, hsl(h, 45, 32)); c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.moveTo(-200, -40); c.quadraticCurveTo(-120, -80, -40, -40); c.moveTo(20, -50); c.lineTo(180, -50); c.moveTo(-200, 30); c.lineTo(60, 30); c.stroke(); } },
    win: { r: 80, f(c, h) { R(c, -80, -100, 160, 200, 6, '#fff'); R(c, -68, -88, 136, 176, 4, hsl(h, 80, 78)); c.fillStyle = '#fff'; c.fillRect(-4, -88, 8, 176); c.fillRect(-68, -4, 136, 8); C(c, -30, -50, 16, '#fff', 0); C(c, -14, -52, 18, '#fff', 0); } },
    clock: { r: 50, f(c, h) { C(c, 0, 0, 48, hsl(h, 80, 60)); C(c, 0, 0, 38, '#fff', 3); c.strokeStyle = LINE; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -28); c.moveTo(0, 0); c.lineTo(20, 8); c.stroke(); } },
    poster: { r: 60, f(c, h) { R(c, -55, -70, 110, 140, 6, hsl(h, 85, 70)); c.fillStyle = '#fff'; c.font = '70px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', 0, 4); } },
    shelf: { r: 90, f(c, h) { R(c, -90, -110, 180, 220, 6, hsl(h, 45, 45)); for (let row = 0; row < 3; row++) { c.fillStyle = LINE; c.fillRect(-84, -104 + row * 72 + 64, 168, 6); for (let k = 0; k < 6; k++) { c.fillStyle = hsl(h + k * 55 + row * 20, 70, 60); c.fillRect(-78 + k * 27, -96 + row * 72 + (k % 2) * 8, 22, 60 - (k % 2) * 8); } } } },
    globe: { r: 55, f(c, h) { c.fillStyle = LINE; c.fillRect(-6, 40, 12, 26); R(c, -36, 62, 72, 12, 4, hsl(h, 50, 40)); C(c, 0, 0, 46, '#4aa3ff'); c.fillStyle = hsl(h, 60, 50); c.beginPath(); c.ellipse(-14, -10, 18, 12, 0.4, 0, 7); c.ellipse(16, 16, 14, 10, -0.3, 0, 7); c.fill(); } },
    plant: { r: 55, f(c, h) { c.fillStyle = '#3aa655'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(-30 + k * 15, -40 - (k % 2) * 20, 14, 34, -0.6 + k * 0.3, 0, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = LINE; c.stroke(); } R(c, -36, -8, 72, 64, 10, hsl(h, 70, 55)); } },
    desk: { r: 90, f(c, h) { c.fillStyle = LINE; c.fillRect(-80, 0, 12, 80); c.fillRect(68, 0, 12, 80); R(c, -100, -16, 200, 24, 6, hsl(h, 55, 58)); } },
    chair: { r: 50, f(c, h) { c.fillStyle = LINE; c.fillRect(-34, 10, 8, 50); c.fillRect(26, 10, 8, 50); R(c, -40, -70, 80, 60, 8, hsl(h, 75, 60)); R(c, -44, 0, 88, 14, 5, hsl(h, 75, 50)); } },
    books: { r: 40, f(c, h) { for (let k = 0; k < 3; k++) R(c, -38 + k * 4, -8 - k * 16, 76 - k * 8, 16, 3, hsl(h + k * 70, 75, 60)); } },
    bag: { r: 50, f(c, h) { R(c, -40, -50, 80, 100, 22, hsl(h, 75, 55)); R(c, -26, 0, 52, 34, 8, hsl(h, 75, 45)); c.lineWidth = 5; c.strokeStyle = LINE; c.beginPath(); c.arc(0, -50, 20, Math.PI, 0); c.stroke(); } },
    cup: { r: 34, f(c, h) { c.lineWidth = 6; c.strokeStyle = LINE; c.beginPath(); c.arc(30, 0, 14, -1.4, 1.4); c.stroke(); R(c, -28, -32, 56, 64, 8, hsl(h, 75, 60)); } },
    lamp: { r: 55, f(c, h) { c.fillStyle = LINE; c.fillRect(-3, -120, 6, 90); c.beginPath(); c.moveTo(-50, 10); c.lineTo(-24, -34); c.lineTo(24, -34); c.lineTo(50, 10); c.closePath(); c.fillStyle = hsl(h, 80, 62); c.fill(); c.lineWidth = 4; c.stroke(); C(c, 0, 16, 12, '#fff3a8'); } },
    trophy: { r: 45, f(c, h) { R(c, -26, 30, 52, 16, 4, hsl(h + 200, 40, 40)); c.fillStyle = hsl(h, 90, 55); c.fillRect(-6, 4, 12, 28); c.beginPath(); c.moveTo(-34, -44); c.lineTo(34, -44); c.quadraticCurveTo(30, 10, 0, 10); c.quadraticCurveTo(-30, 10, -34, -44); c.fill(); c.lineWidth = 4; c.strokeStyle = LINE; c.stroke(); } },
    ball: { r: 34, f(c, h, v) { if (v) { C(c, 0, 0, 32, hsl(h, 90, 55)); c.strokeStyle = LINE; c.lineWidth = 3; c.beginPath(); c.moveTo(-32, 0); c.lineTo(32, 0); c.moveTo(0, -32); c.lineTo(0, 32); c.arc(0, 0, 20, 0, 7); c.stroke(); } else { C(c, 0, 0, 32, '#fff'); c.fillStyle = hsl(h, 10, 20); c.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.257 - 1.57; c.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); } c.fill(); C(c, 0, 0, 32, 'transparent'); } } },
    hoop: { r: 90, f(c, h) { c.fillStyle = LINE; c.fillRect(-8, 40, 16, 200); R(c, -90, -70, 180, 120, 8, '#fff'); R(c, -36, -30, 72, 52, 2, hsl(h, 70, 90)); c.strokeStyle = hsl(h, 90, 50); c.lineWidth = 8; c.beginPath(); c.ellipse(0, 34, 36, 8, 0, 0, 7); c.stroke(); c.strokeStyle = '#ddd'; c.lineWidth = 2; for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(k * 11, 38); c.lineTo(k * 6, 80); c.stroke(); } } },
    cone: { r: 40, f(c, h) { c.beginPath(); c.moveTo(-34, 40); c.lineTo(-8, -46); c.lineTo(8, -46); c.lineTo(34, 40); c.closePath(); c.fillStyle = hsl(h, 95, 55); c.fill(); c.lineWidth = 4; c.strokeStyle = LINE; c.stroke(); c.fillStyle = '#fff'; c.fillRect(-20, -6, 40, 12); R(c, -44, 36, 88, 12, 3, hsl(h, 95, 45)); } },
    mat: { r: 90, f(c, h) { R(c, -110, -26, 220, 52, 10, hsl(h, 70, 55)); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * 55, -26); c.lineTo(k * 55, 26); c.stroke(); } } },
    flag: { r: 50, f(c, h) { c.fillStyle = LINE; c.fillRect(-4, -70, 8, 140); c.beginPath(); c.moveTo(4, -70); c.lineTo(70, -46); c.lineTo(4, -22); c.closePath(); c.fillStyle = hsl(h, 85, 58); c.fill(); c.lineWidth = 4; c.stroke(); } },
    bunting: { r: 80, f(c, h) { c.strokeStyle = LINE; c.lineWidth = 3; c.beginPath(); c.moveTo(-150, -20); c.quadraticCurveTo(0, 20, 150, -20); c.stroke(); for (let k = 0; k < 6; k++) { const x = -125 + k * 50, y = -10 + Math.sin(k / 5 * Math.PI) * 16; c.beginPath(); c.moveTo(x - 18, y); c.lineTo(x + 18, y); c.lineTo(x, y + 36); c.closePath(); c.fillStyle = hsl(h + k * 60, 85, 60); c.fill(); c.stroke(); } } },
    tree: { r: 100, f(c, h) { R(c, -18, 0, 36, 120, 6, '#8a5a2b'); C(c, -40, -30, 60, hsl(h, 60, 45)); C(c, 40, -30, 60, hsl(h, 60, 45)); C(c, 0, -80, 70, hsl(h, 60, 50)); } },
    cloud: { r: 80, f(c) { c.fillStyle = '#fff'; [[-50, 0, 40], [0, -20, 50], [50, 0, 40], [0, 10, 40]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }); } },
    sun: { r: 80, f(c, h) { c.strokeStyle = hsl(h, 95, 55); c.lineWidth = 8; for (let k = 0; k < 12; k++) { const a = k * 0.5236; c.beginPath(); c.moveTo(Math.cos(a) * 62, Math.sin(a) * 62); c.lineTo(Math.cos(a) * 84, Math.sin(a) * 84); c.stroke(); } C(c, 0, 0, 52, hsl(h, 95, 60)); } },
    bench: { r: 90, f(c, h) { c.fillStyle = LINE; c.fillRect(-90, 0, 10, 40); c.fillRect(80, 0, 10, 40); R(c, -110, -16, 220, 20, 4, hsl(h, 60, 50)); R(c, -110, -60, 220, 18, 4, hsl(h, 60, 50)); } },
    tray: { r: 70, f(c, h) { R(c, -80, -44, 160, 88, 12, hsl(h, 40, 80)); C(c, -42, -10, 22, '#fff'); C(c, 0, -10, 18, '#ffcf5c'); C(c, 42, -10, 20, '#e2553a'); R(c, -60, 14, 120, 20, 6, '#7bc96f'); } },
    milk: { r: 34, f(c, h) { c.beginPath(); c.moveTo(-24, -24); c.lineTo(0, -50); c.lineTo(24, -24); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 4; c.strokeStyle = LINE; c.stroke(); R(c, -24, -24, 48, 64, 3, '#fff'); c.fillStyle = hsl(h, 75, 55); c.fillRect(-20, -6, 40, 22); } },
    apple: { r: 30, f(c, h) { C(c, 0, 0, 26, hsl(h, 85, 52)); c.fillStyle = '#3aa655'; c.beginPath(); c.ellipse(10, -28, 10, 5, -0.5, 0, 7); c.fill(); } },
    pot: { r: 70, f(c, h) { R(c, -70, -40, 140, 90, 14, hsl(h, 40, 60)); R(c, -80, -50, 160, 16, 6, hsl(h, 40, 45)); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 5; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-30 + k * 30, -60); c.quadraticCurveTo(-20 + k * 30, -80, -30 + k * 30, -100); c.stroke(); } } },
    flower: { r: 30, f(c, h) { c.fillStyle = '#3aa655'; c.fillRect(-2, 0, 4, 40); for (let k = 0; k < 5; k++) { const a = k * 1.257; C(c, Math.cos(a) * 14, Math.sin(a) * 14, 11, hsl(h, 85, 65), 2); } C(c, 0, 0, 8, '#ffd23f', 2); } },
    bird: { r: 30, f(c, h) { c.fillStyle = hsl(h, 80, 55); c.beginPath(); c.ellipse(0, 0, 26, 18, 0, 0, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = LINE; c.stroke(); C(c, 14, -6, 4, LINE, 0); c.fillStyle = '#ffa630'; c.beginPath(); c.moveTo(24, 0); c.lineTo(38, 3); c.lineTo(24, 7); c.fill(); } },
    slide: { r: 120, f(c, h) { c.fillStyle = LINE; c.fillRect(-100, -120, 10, 180); c.fillRect(-40, -120, 10, 180); for (let k = 0; k < 5; k++) c.fillRect(-100, -100 + k * 34, 70, 6); c.beginPath(); c.moveTo(-30, -120); c.quadraticCurveTo(60, -60, 120, 60); c.lineTo(90, 60); c.quadraticCurveTo(40, -40, -30, -90); c.closePath(); c.fillStyle = hsl(h, 85, 58); c.fill(); c.lineWidth = 4; c.stroke(); } }
  };
  const NOCOLOR = { cloud: 1 };
  // 장면: 배경 그리기 + 물건 목록 [종류, x, y, 크기, 색상(hue), 틀린 곳 후보 여부, 변형]
  const SCENES = {
    classroom: {
      name: '교실', bg(c) { c.fillStyle = '#fff2d6'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#d9a066'; c.fillRect(0, 640, 1600, 260); c.fillStyle = '#c98b52'; for (let x = 0; x < 1600; x += 120) c.fillRect(x, 640, 4, 260); },
      objs: [['board', 800, 190, 1, 140, 1], ['win', 130, 210, 1, 200, 1], ['win', 1470, 210, 1, 200, 1], ['clock', 800, 40, 0.8, 0, 1], ['poster', 330, 180, 1, 330, 1], ['poster', 1270, 180, 1, 50, 1], ['shelf', 160, 530, 1, 25, 1], ['globe', 160, 380, 0.9, 120, 1], ['plant', 1460, 560, 1, 10, 1], ['lamp', 500, 40, 0.8, 50, 1], ['lamp', 1100, 40, 0.8, 190, 1],
        ['desk', 430, 560, 1, 30, 1], ['desk', 800, 560, 1, 30, 1], ['desk', 1170, 560, 1, 30, 1], ['chair', 380, 720, 1, 200, 1], ['chair', 760, 720, 1, 340, 1], ['chair', 1130, 720, 1, 120, 1], ['books', 450, 535, 0.9, 260, 1], ['cup', 860, 525, 0.8, 0, 1], ['bag', 1240, 500, 0.9, 280, 1], ['trophy', 1340, 380, 0.9, 45, 1], ['ball', 1000, 800, 1, 25, 1, 1], ['apple', 760, 528, 0.9, 0, 1], ['plant', 1290, 580, 0.6, 290, 1]]
    },
    gym: {
      name: '체육관', bg(c) { c.fillStyle = '#d8ecff'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#f0b468'; c.fillRect(0, 560, 1600, 340); c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.arc(800, 760, 120, 0, 7); c.moveTo(800, 560); c.lineTo(800, 900); c.stroke(); c.strokeStyle = 'rgba(150,90,30,.3)'; c.lineWidth = 2; for (let y = 580; y < 900; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(1600, y); c.stroke(); } },
      objs: [['win', 300, 110, 0.7, 200, 1], ['win', 800, 110, 0.7, 200, 1], ['win', 1300, 110, 0.7, 200, 1], ['bunting', 550, 70, 1, 0, 1], ['bunting', 1050, 70, 1, 180, 1], ['hoop', 150, 330, 1, 20, 1], ['hoop', 1450, 330, 1, 200, 1], ['clock', 800, 260, 0.9, 210, 1], ['flag', 560, 430, 1, 0, 1], ['flag', 1040, 430, 1, 120, 1],
        ['ball', 420, 640, 1, 25, 1, 1], ['ball', 620, 820, 1, 0, 1, 0], ['ball', 980, 640, 1, 25, 1, 1], ['ball', 1180, 820, 1, 200, 1, 1], ['cone', 300, 790, 1, 25, 1], ['cone', 1300, 790, 1, 25, 1], ['cone', 800, 620, 0.8, 190, 1], ['mat', 330, 560, 1, 210, 1], ['mat', 1270, 560, 1, 330, 1], ['bench', 800, 450, 1, 30, 1], ['trophy', 700, 400, 0.8, 45, 1], ['bag', 900, 400, 0.8, 120, 1], ['cup', 1000, 410, 0.7, 300, 1]]
    },
    cafeteria: {
      name: '급식실', bg(c) { c.fillStyle = '#d9f5ec'; c.fillRect(0, 0, 1600, 900); for (let y = 560; y < 900; y += 60) for (let x = 0; x < 1600; x += 60) { c.fillStyle = ((x + y) / 60) % 2 ? '#fff' : '#ffe3c4'; c.fillRect(x, y, 60, 60); } },
      objs: [['win', 200, 200, 1, 190, 1], ['win', 1400, 200, 1, 190, 1], ['clock', 800, 70, 0.9, 120, 1], ['poster', 520, 170, 1, 0, 1], ['poster', 1080, 170, 1, 140, 1], ['lamp', 400, 40, 0.8, 30, 1], ['lamp', 800, 200, 0.6, 300, 1], ['lamp', 1200, 40, 0.8, 30, 1], ['pot', 800, 380, 1, 25, 1], ['plant', 1500, 520, 1, 330, 1],
        ['desk', 450, 620, 1.6, 40, 0], ['desk', 1150, 620, 1.6, 40, 0], ['tray', 360, 590, 0.9, 210, 1], ['tray', 560, 590, 0.9, 120, 1], ['tray', 1060, 590, 0.9, 300, 1], ['tray', 1260, 590, 0.9, 30, 1], ['milk', 460, 530, 0.8, 210, 1], ['milk', 1160, 530, 0.8, 0, 1], ['apple', 660, 560, 1, 0, 1], ['apple', 980, 560, 1, 90, 1], ['cup', 250, 560, 0.8, 50, 1], ['cup', 1360, 560, 0.8, 250, 1], ['chair', 380, 790, 1, 200, 1], ['chair', 600, 790, 1, 20, 1], ['chair', 1100, 790, 1, 280, 1], ['chair', 1320, 790, 1, 120, 1]]
    },
    playground: {
      name: '운동장', bg(c) { c.fillStyle = '#8fd8ff'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#8ad46a'; c.fillRect(0, 520, 1600, 380); c.fillStyle = '#e7c48a'; c.beginPath(); c.ellipse(800, 760, 520, 120, 0, 0, 7); c.fill(); },
      objs: [['sun', 1420, 120, 1, 45, 1], ['cloud', 250, 110, 1, 0, 1], ['cloud', 700, 80, 0.8, 0, 1], ['cloud', 1050, 150, 0.9, 0, 1], ['bird', 520, 200, 1, 200, 1], ['bird', 900, 240, 0.9, 0, 1], ['bird', 1200, 180, 1, 300, 1], ['tree', 120, 420, 1, 120, 1], ['tree', 1480, 430, 1, 100, 1], ['tree', 420, 400, 0.8, 140, 1], ['slide', 1180, 500, 1, 0, 1],
        ['bench', 640, 520, 1, 25, 1], ['ball', 760, 760, 1, 25, 1, 1], ['ball', 980, 800, 1, 0, 1, 0], ['cone', 400, 760, 1, 25, 1], ['cone', 1200, 760, 1, 25, 1], ['flag', 800, 640, 1, 0, 1], ['flower', 140, 640, 1, 330, 1], ['flower', 220, 680, 1, 50, 1], ['flower', 1400, 650, 1, 280, 1], ['flower', 1480, 700, 1, 0, 1], ['bag', 560, 600, 0.8, 200, 1], ['cup', 700, 620, 0.7, 130, 1]]
    }
  };
  function drawObj(c, o) {
    if (o.mut === 'gone') return;
    const T = OBJ[o.t]; let s = o.s, h = o.h;
    if (o.mut === 'big') s *= 1.45; else if (o.mut === 'small') s *= 0.55; else if (o.mut === 'color') h += 150;
    c.save(); c.translate(o.x, o.y); c.scale(s, s); T.f(c, h, o.v); c.restore();
  }
  // 틀린 곳 고르기: 서로 떨어진 물건 n개에 변형을 하나씩
  function makeDiffs(sceneKey, n, seed, lv) {
    const sc = SCENES[sceneKey], r = Sim.rng(seed);
    const objs = sc.objs.map(([t, x, y, s, h, m, v]) => ({ t, x, y, s, h, m, v, mut: null }));
    const cand = objs.filter(o => o.m).sort(() => r() - 0.5), picked = [];
    for (const o of cand) {
      if (picked.length >= n) break;
      if (picked.some(p => Math.hypot(p.x - o.x, p.y - o.y) < 170)) continue;
      // 하: 크게 바뀌거나 사라짐 위주, 상: 색·작아짐 같은 눈에 덜 띄는 변화도 섞인다
      const kinds = lv === 1 ? ['big', 'gone', 'gone'] : ['big', 'gone']; if (!NOCOLOR[o.t] && lv !== 1) kinds.push('color', 'color'); if (OBJ[o.t].r * o.s < 70) kinds.push('big'); else kinds.push('small');
      if (lv === 3 && !NOCOLOR[o.t]) kinds.push('color', 'small');
      o.mut = kinds[(r() * kinds.length) | 0]; picked.push(o);
    }
    const rk = lv === 1 ? 1.25 : lv === 3 ? 0.88 : 1;
    const spots = picked.map(o => ({ x: o.x, y: o.y, r: Math.max(44, (OBJ[o.t].r * o.s * (o.mut === 'big' ? 1.4 : 1) + 10) * rk) }));
    return { objs, spots };
  }
  function renderScene(c, sceneKey, objs, withMut) {
    const sc = SCENES[sceneKey]; sc.bg(c);
    objs.forEach(o => drawObj(c, withMut ? o : Object.assign({}, o, { mut: null })));
  }

  /* 올린 사진에서 틀린 곳 만들기: 색 바꾸기, 지우기, 좌우 뒤집기 */
  function mutatePhoto(c, spots) {
    for (const s of spots) {
      const x0 = Math.max(0, (s.x - s.r) | 0), y0 = Math.max(0, (s.y - s.r) | 0), w = Math.min(1600 - x0, (s.r * 2) | 0), h = Math.min(900 - y0, (s.r * 2) | 0);
      if (w < 2 || h < 2) continue;
      if (s.k === 'mirror') {
        const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h; tmp.getContext('2d').drawImage(c.canvas, x0, y0, w, h, 0, 0, w, h);
        c.save(); c.beginPath(); c.arc(s.x, s.y, s.r, 0, 7); c.clip(); c.translate(x0 + w, y0); c.scale(-1, 1); c.drawImage(tmp, 0, 0); c.restore(); continue;
      }
      const img = c.getImageData(x0, y0, w, h), d = img.data;
      if (s.k === 'erase') {   // 둘레의 평균색으로 메우기
        let rr = 0, gg = 0, bb = 0, n = 0;
        for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const dist = Math.hypot(xx + x0 - s.x, yy + y0 - s.y); if (dist > s.r * 0.9 && dist <= s.r) { const i = (yy * w + xx) * 4; rr += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; } }
        rr /= n || 1; gg /= n || 1; bb /= n || 1;
        for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const dist = Math.hypot(xx + x0 - s.x, yy + y0 - s.y); if (dist <= s.r * 0.9) { const i = (yy * w + xx) * 4, k = 0.85 + Math.random() * 0.1; d[i] = rr * k; d[i + 1] = gg * k; d[i + 2] = bb * k; } }
      } else {                 // 색상 바꾸기(빨강↔초록↔파랑 돌리기)
        for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { if (Math.hypot(xx + x0 - s.x, yy + y0 - s.y) > s.r) continue; const i = (yy * w + xx) * 4, r0 = d[i]; d[i] = d[i + 2]; d[i + 2] = d[i + 1]; d[i + 1] = r0; }
      }
      c.putImageData(img, x0, y0);
    }
  }
  // 사진을 1600x900 안에 꽉 차게(잘라서) 그리기
  function cover(c, img) {
    const s = Math.max(1600 / img.width, 900 / img.height), w = img.width * s, h = img.height * s;
    c.fillStyle = '#000'; c.fillRect(0, 0, 1600, 900); c.drawImage(img, (1600 - w) / 2, (900 - h) / 2, w, h);
  }

  /* 사진 확대 탐정 기본 그림 (cx, cy는 첫 단서의 중심, w는 단계별로 보이는 폭의 비율) */
  const ZOOM = [
    { ans: '사과', alts: ['애플', 'apple'], cx: 790, cy: 430, w: [0.06, 0.3, 1], draw(c) {
      c.fillStyle = '#ffe9c7'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#e9cfa3'; c.fillRect(0, 640, 1600, 260);
      C(c, 1230, 470, 190, '#e0312b', 8); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(1160, 400, 50, 30, -0.6, 0, 7); c.fill(); c.fillStyle = '#6b3d1f'; c.fillRect(1222, 250, 14, 50); c.fillStyle = '#3aa655'; c.beginPath(); c.ellipse(1290, 270, 60, 26, -0.4, 0, 7); c.fill();
      C(c, 790, 470, 230, '#d92b26', 8); C(c, 790, 470, 212, '#fff4cf', 0); c.fillStyle = '#f3e2a5'; c.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566 - 1.57; c.lineTo(790 + Math.cos(a) * 70, 470 + Math.sin(a) * 70); c.lineTo(790 + Math.cos(a + 0.628) * 30, 470 + Math.sin(a + 0.628) * 30); } c.fill();
      for (let k = 0; k < 5; k++) { const a = k * 1.2566 - 1.57; c.fillStyle = '#4a2a12'; c.beginPath(); c.ellipse(790 + Math.cos(a) * 44, 470 + Math.sin(a) * 44, 10, 18, a + 1.57, 0, 7); c.fill(); }
      c.fillStyle = '#6b3d1f'; c.fillRect(783, 230, 14, 40); } },
    { ans: '수박', alts: ['watermelon'], cx: 800, cy: 420, w: [0.07, 0.32, 1], draw(c) {
      c.fillStyle = '#c9f0ff'; c.fillRect(0, 0, 1600, 900);
      c.save(); c.translate(800, 260); c.beginPath(); c.moveTo(-420, 0); c.lineTo(420, 0); c.lineTo(0, 560); c.closePath(); c.fillStyle = '#2f9e44'; c.fill(); c.beginPath(); c.moveTo(-380, 0); c.lineTo(380, 0); c.lineTo(0, 510); c.closePath(); c.fillStyle = '#d8f5a2'; c.fill(); c.beginPath(); c.moveTo(-350, 0); c.lineTo(350, 0); c.lineTo(0, 470); c.closePath(); c.fillStyle = '#ff4d6d'; c.fill();
      c.fillStyle = '#1b1b1b'; for (let k = 0; k < 16; k++) { const y = 60 + (k % 4) * 90, x = (((k / 4) | 0) - 1.5) * (240 - y * 0.45); c.beginPath(); c.ellipse(x, y, 9, 15, 0, 0, 7); c.fill(); } c.restore();
      c.fillStyle = '#2f9e44'; c.fillRect(0, 230, 1600, 30); for (let x = 0; x < 1600; x += 60) { c.fillStyle = '#1e6b2e'; c.fillRect(x, 230, 26, 30); } } },
    { ans: '농구공', alts: ['농구', '공', 'basketball'], cx: 800, cy: 330, w: [0.06, 0.28, 1], draw(c) {
      c.fillStyle = '#f0b468'; c.fillRect(0, 0, 1600, 900); c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); c.arc(800, 1100, 600, Math.PI, 0); c.stroke();
      C(c, 800, 450, 260, '#f2751c', 10); c.strokeStyle = '#3a2a1a'; c.lineWidth = 9; c.beginPath(); c.moveTo(540, 450); c.lineTo(1060, 450); c.moveTo(800, 190); c.lineTo(800, 710); c.stroke();
      c.beginPath(); c.arc(560, 450, 200, -1.1, 1.1); c.stroke(); c.beginPath(); c.arc(1040, 450, 200, Math.PI - 1.1, Math.PI + 1.1); c.stroke();
      c.fillStyle = 'rgba(0,0,0,.15)'; for (let k = 0; k < 400; k++) { const a = k * 2.39996, rr = Math.sqrt(k / 400) * 250; c.beginPath(); c.arc(800 + Math.cos(a) * rr, 450 + Math.sin(a) * rr, 3, 0, 7); c.fill(); } } },
    { ans: '해바라기', alts: ['해바라기꽃', 'sunflower'], cx: 800, cy: 400, w: [0.06, 0.3, 1], draw(c) {
      c.fillStyle = '#9ad8ff'; c.fillRect(0, 0, 1600, 900); c.fillStyle = '#7ccf5f'; c.fillRect(0, 700, 1600, 200); c.fillStyle = '#3aa655'; c.fillRect(788, 420, 24, 480); c.beginPath(); c.ellipse(700, 650, 90, 36, 0.5, 0, 7); c.fill();
      for (let k = 0; k < 22; k++) { const a = k * 0.2856; c.save(); c.translate(800, 400); c.rotate(a); c.beginPath(); c.ellipse(0, -200, 44, 110, 0, 0, 7); c.fillStyle = k % 2 ? '#ffd000' : '#ffbe0b'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#a87900'; c.stroke(); c.restore(); }
      C(c, 800, 400, 140, '#5a3210', 6); for (let k = 0; k < 500; k++) { const a = k * 2.39996, rr = Math.sqrt(k / 500) * 130; C(c, 800 + Math.cos(a) * rr, 400 + Math.sin(a) * rr, 4, k % 3 ? '#3b1f08' : '#8a5a20', 0); } } }
  ];
  return { OBJ, SCENES, makeDiffs, renderScene, mutatePhoto, cover, ZOOM };
})();
