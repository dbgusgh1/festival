/* 「체육 OX 서바이벌」 3D 경기장과 캐릭터.
   아래 「원본 그대로」 표시 사이의 코드는 선생님이 만든 체육OX서바이벌 index.html(1단계 체험판)의 3D 코드를 고치지 않고 옮겨 온 것이다.
   여기서는 그 장면을 띄우고, 교실 화면이 보내 주는 위치·상태에 맞춰 캐릭터를 움직이는 일만 덧붙였다.
   교실 TV는 전체 보기(📺), 학생 폰은 내 캐릭터를 따라가는 쿼터뷰(📱)로 그린다. */
const OX3D = (function () {
  const URL3 = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
  const EMOJIS = ['👏', '🔥', '😆', '💪', '❤️', '📣', '😱', '👍', '🙌'];
  let loading = null, W = null, failed = false;
  function load() {
    if (!loading) loading = import(URL3).then(THREE => (W = build(THREE))).catch(e => { failed = true; console.error(e); return null; });
    return loading;
  }
  function build(THREE) {
    const canvas = document.createElement('canvas'); canvas.id = 'ox3d';
    let saved = {}; try { saved = JSON.parse(localStorage.getItem('peox_settings')) || {}; } catch (e) { }
    const settings = Object.assign({ time: 10, maxRevives: 1, bots: 20, low: false }, saved);
    /* ════════ 원본 그대로 (시작) ════════ */
    const renderer = new THREE.WebGLRenderer({canvas, antialias:!settings.low, powerPreference:'high-performance'});
    renderer.setPixelRatio(settings.low?1:Math.min(devicePixelRatio,2));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8fd0ff);
    scene.fog = new THREE.Fog(0xd6efff, 70, 150);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 260);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x7a9a5a, 1.0));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.5); sun.position.set(-14,32,16); scene.add(sun); scene.add(sun.target);

    const M = c => new THREE.MeshLambertMaterial({color:c});
    function box(w,h,d,c,x,y,z,parent=scene){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c)); m.position.set(x,y,z); parent.add(m); return m; }
    function texFromCanvas(cv){ const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; }
    function rrect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

    /* ---------- 월드 상수 ---------- */
    const ZONE_W = 11, ZONE_D = 10, ZONE_Z = -4;
    const ZONES = { O:{x:-7, z:ZONE_Z}, X:{x:7, z:ZONE_Z} };
    const PLAY = {x0:-17, x1:17, z0:-13, z1:7.5};
    const STAND = {x0:-15, x1:15, z0:9.6, z1:13};

    /* ---------- 하늘 · 구름 · 언덕 ---------- */
    (function sky(){ const cv=document.createElement('canvas'); cv.width=2; cv.height=256; const g=cv.getContext('2d');
      const gr=g.createLinearGradient(0,0,0,256); gr.addColorStop(0,'#4fa8ff'); gr.addColorStop(.55,'#9fd6ff'); gr.addColorStop(1,'#e6f5ff'); g.fillStyle=gr; g.fillRect(0,0,2,256);
      scene.background=texFromCanvas(cv); })();
    const clouds=[];
    for(let i=0;i<9;i++){ const c=new THREE.Group(); const m=new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x666666});
      const n=3+(i%3); for(let k=0;k<n;k++){ const s=new THREE.Mesh(new THREE.IcosahedronGeometry(2.2+Math.random()*1.6,1),m); s.position.set(k*2.6-n*1.3,Math.random()*1.2,Math.random()*1.5); s.userData.ns=true; c.add(s); }
      c.position.set(-70+i*17+Math.random()*8, 26+Math.random()*10, -55-Math.random()*25); scene.add(c); clouds.push(c); }
    [[-55,-70,26],[-20,-80,30],[25,-78,28],[60,-68,24],[-80,-40,22],[80,-40,22]].forEach(([x,z,r],i)=>{ const h=new THREE.Mesh(new THREE.SphereGeometry(r,20,12),M(i%2?0x77b552:0x86c25c)); h.scale.y=.45; h.position.set(x,-2,z); h.userData.ns=true; scene.add(h); });

    /* ---------- 바닥: 잔디 줄무늬 + 운동장 트랙 ---------- */
    (function ground(){
      const cv=document.createElement('canvas'); cv.width=512; cv.height=512; const g=cv.getContext('2d');
      for(let i=0;i<16;i++){ g.fillStyle=i%2?'#8cc65a':'#97cf64'; g.fillRect(0,i*32,512,32); }
      const t=texFromCanvas(cv); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(8,8);
      const m=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshLambertMaterial({map:t})); m.rotation.x=-Math.PI/2; m.receiveShadow=true; scene.add(m);
    })();
    (function sand(){
      const W=38,D=30,k=27; const cv=document.createElement('canvas'); cv.width=W*k; cv.height=D*k; const g=cv.getContext('2d');
      g.fillStyle='#e4c891'; rrect(g,0,0,cv.width,cv.height,70); g.fill();
      for(let i=0;i<7000;i++){ g.fillStyle=Math.random()<.5?'rgba(185,145,90,.28)':'rgba(255,244,215,.35)'; const s=2+Math.random()*4; g.fillRect(Math.random()*cv.width,Math.random()*cv.height,s,s); }
      // 운동장 트랙 (분필 라인)
      const cx=19*k, cy=13*k; g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=5;
      [[16.8,11.3],[15.6,10.2],[14.4,9.1]].forEach(([rx,rz],i)=>{ g.setLineDash(i===1?[18,14]:[]); g.beginPath(); g.ellipse(cx,cy,rx*k,rz*k,0,0,Math.PI*2); g.stroke(); });
      g.setLineDash([]);
      // 출발선
      g.lineWidth=6; g.beginPath(); g.moveTo(cx-1*k,cy+9.1*k); g.lineTo(cx-1*k,cy+11.3*k); g.stroke();
      // 모서리 테두리
      g.strokeStyle='rgba(160,120,70,.5)'; g.lineWidth=10; rrect(g,5,5,cv.width-10,cv.height-10,66); g.stroke();
      const m=new THREE.Mesh(new THREE.PlaneGeometry(W,D), new THREE.MeshLambertMaterial({map:texFromCanvas(cv),transparent:true}));
      m.rotation.x=-Math.PI/2; m.position.set(0,0.01,-2); m.receiveShadow=true; scene.add(m);
    })();
    function zoneTexture(type){
      const cv=document.createElement('canvas'); cv.width=550; cv.height=500; const g=cv.getContext('2d');
      const grd=g.createLinearGradient(0,0,0,500);
      if(type==='O'){ grd.addColorStop(0,'#b6bdca'); grd.addColorStop(1,'#9ea6b4'); } else { grd.addColorStop(0,'#eda287'); grd.addColorStop(1,'#de8a6d'); }
      g.fillStyle=grd; rrect(g,0,0,550,500,40); g.fill();
      for(let i=0;i<900;i++){ g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(Math.random()*550,Math.random()*500,3,3); }
      g.setLineDash([26,18]); g.lineWidth=10; g.strokeStyle='#fff'; rrect(g,14,14,522,472,34); g.stroke(); g.setLineDash([]);
      g.shadowColor='rgba(0,0,0,.18)'; g.shadowOffsetY=8;
      if(type==='O'){ g.lineWidth=58; g.strokeStyle='#2f6bff'; g.beginPath(); g.ellipse(275,245,165,145,0,0,Math.PI*2); g.stroke(); }
      else { g.lineWidth=62; g.lineCap='round'; g.strokeStyle='#e04545'; g.beginPath(); g.moveTo(125,105); g.lineTo(425,385); g.moveTo(425,105); g.lineTo(125,385); g.stroke(); }
      g.shadowColor='transparent'; g.font='900 34px "Noto Sans KR", sans-serif'; g.fillStyle='rgba(255,255,255,.9)'; g.textAlign='center'; g.fillText(type==='O'?'정답이 O라면 여기!':'정답이 X라면 여기!',275,470);
      return texFromCanvas(cv);
    }
    for(const k of ['O','X']){
      const m=new THREE.Mesh(new THREE.PlaneGeometry(ZONE_W,ZONE_D), new THREE.MeshLambertMaterial({map:zoneTexture(k), transparent:true}));
      m.rotation.x=-Math.PI/2; m.position.set(ZONES[k].x,0.03,ZONES[k].z); m.receiveShadow=true; scene.add(m);
    }
    for(let z=-10; z<7; z+=1.4) box(0.18,0.02,0.7,0xffffff,0,0.04,z);

    /* ---------- 응원석 ---------- */
    (function stand(){
      const cv=document.createElement('canvas'); cv.width=1024; cv.height=160; const g=cv.getContext('2d');
      g.fillStyle='#b7c0cd'; g.fillRect(0,0,1024,160); for(let x=0;x<1024;x+=64){ g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(x,0,32,160); }
      g.fillStyle='#7f8a9b'; g.font='900 90px "Noto Sans KR"'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('📣 응 원 석',512,82);
      const m=new THREE.Mesh(new THREE.PlaneGeometry(32,5), new THREE.MeshLambertMaterial({map:texFromCanvas(cv)})); m.rotation.x=-Math.PI/2; m.position.set(0,0.02,11.3); m.receiveShadow=true; scene.add(m);
      const seatCols=[0x2f6bff,0xffd23f,0xef4b4b,0x2fbf71];
      for(let i=0;i<3;i++){ box(32,0.5+i*0.5,1.1,0x8792a5,0,(0.5+i*0.5)/2,14.3+i*1.1);
        for(let s=0;s<14;s++) box(1.4,0.35,0.7,seatCols[(s+i)%4],-14.6+s*2.25,0.5+i*0.5+0.17,14.25+i*1.1); }
      // 응원 현수막
      const bc=document.createElement('canvas'); bc.width=1024; bc.height=128; const bg=bc.getContext('2d');
      bg.fillStyle='#ffd23f'; bg.fillRect(0,0,1024,128); bg.fillStyle='#1d2433'; bg.font='900 72px Jua, "Noto Sans KR"'; bg.textAlign='center'; bg.textBaseline='middle'; bg.fillText('🔥 끝까지 살아남자! 파이팅! 🔥',512,68);
      const ban=new THREE.Mesh(new THREE.PlaneGeometry(18,2.2),new THREE.MeshLambertMaterial({map:texFromCanvas(bc),side:THREE.DoubleSide})); ban.position.set(0,3.6,17.6); ban.rotation.y=Math.PI; scene.add(ban);
      box(0.2,4.8,0.2,0xdddddd,-9.1,2.4,17.6); box(0.2,4.8,0.2,0xdddddd,9.1,2.4,17.6);
    })();

    /* ---------- 학교 건물 ---------- */
    (function building(){
      box(44,11,6,0xf1e2bd,0,5.5,-25);
      box(45.4,0.7,7.2,0x9c5b43,0,11.3,-25); box(45.4,0.5,0.3,0xb86a4c,0,11.75,-21.5);
      [4.2,7.4].forEach(y=>box(44,0.35,0.25,0xd27c4b,0,y,-21.9));
      for(let row=0;row<3;row++) for(let col=-9;col<=9;col++){
        if(Math.abs(col)<=2 && row<2) continue;
        const x=col*2.2, y=2.2+row*3.1;
        box(1.85,1.85,0.12,0xffffff,x,y,-21.96); box(1.55,1.55,0.1,row===1&&col%3===0?0xffe9a8:0x9fd0f0,x,y,-21.9);
        box(0.08,1.55,0.05,0xffffff,x,y,-21.84); box(2.0,0.14,0.3,0xffffff,x,y-1.0,-21.8);
      }
      // 현관 + 계단 + 간판
      box(6,3.4,0.2,0x5f7682,0,1.7,-21.95); box(0.08,3.2,0.05,0xdfe8ee,0,1.7,-21.83);
      [0,1,2].forEach(i=>box(8-i*.6,0.22,1.0-i*.25,0xd9d9d9,0,0.11+i*0.22,-21.2+i*0.12));
      box(8.4,0.45,3.2,0xf7f7f7,0,4.0,-20.5); box(0.3,3.8,0.3,0xf7f7f7,-3.8,1.9,-19.1); box(0.3,3.8,0.3,0xf7f7f7,3.8,1.9,-19.1);
      const sc=document.createElement('canvas'); sc.width=512; sc.height=64; const sg=sc.getContext('2d'); sg.fillStyle='#2b3f8f'; sg.fillRect(0,0,512,64); sg.fillStyle='#fff'; sg.font='900 38px "Noto Sans KR"'; sg.textAlign='center'; sg.textBaseline='middle'; sg.fillText('우 리 중 학 교',256,34);
      const sign=new THREE.Mesh(new THREE.PlaneGeometry(7.6,0.95),new THREE.MeshBasicMaterial({map:texFromCanvas(sc)})); sign.position.set(0,4.0,-18.88); scene.add(sign);
      // 화단
      [-1,1].forEach(sd=>{ box(10,0.6,1.0,0x8a5a36,sd*10,0.3,-21.2); for(let i=0;i<9;i++){ const f=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,0),M([0x3f9b4a,0x4caf50][i%2])); f.position.set(sd*10-4.4+i*1.1,0.8,-21.2); scene.add(f);
          const fl=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),M([0xff6fb1,0xffd23f,0xffffff,0xff8a3d][i%4])); fl.position.set(sd*10-4.4+i*1.1,1.1,-21.0); scene.add(fl);} });
      // 시계탑
      box(4,4,4,0xe8d7ad,0,13.5,-24); box(4.6,0.5,4.6,0x9c5b43,0,15.7,-24);
      const clk=new THREE.Mesh(new THREE.CircleGeometry(1.4,28),M(0xffffff)); clk.position.set(0,13.5,-21.95); scene.add(clk);
      const rim=new THREE.Mesh(new THREE.TorusGeometry(1.45,.12,8,28),M(0x1d2433)); rim.position.set(0,13.5,-21.94); scene.add(rim);
      const h1=box(0.12,0.8,0.05,0x1d2433,0,13.85,-21.9); const h2=box(0.08,1.1,0.05,0xef4b4b,0.35,13.6,-21.88); h2.rotation.z=-0.9;
      // 국기봉
      for(let i=0;i<3;i++){ box(0.12,7,0.12,0xdddddd,-14+i*1.3,3.5,-19.5); box(1.0,0.65,0.05,[0x2f6bff,0xffd23f,0x2fbf71][i],-13.45+i*1.3,6.6,-19.5); }
    })();
    /* ---------- 체육관 (오른쪽) ---------- */
    (function gym(){
      box(14,7,16,0xe9eef3,30,3.5,-12);
      const roof=new THREE.Mesh(new THREE.CylinderGeometry(7.3,7.3,16.6,24,1,false,0,Math.PI),M(0x2f6bff)); roof.rotation.z=Math.PI/2; roof.rotation.y=Math.PI/2; roof.scale.set(1,1,.45); roof.position.set(30,7,-12); scene.add(roof);
      const cv=document.createElement('canvas'); cv.width=256; cv.height=64; const g=cv.getContext('2d'); g.fillStyle='#1d2433'; g.fillRect(0,0,256,64); g.fillStyle='#fff'; g.font='900 36px "Noto Sans KR"'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('체 육 관',128,34);
      const s=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:texFromCanvas(cv)})); s.position.set(22.95,5,-12); s.rotation.y=-Math.PI/2; scene.add(s);
      box(0.1,3,4,0x5f7682,22.95,1.5,-12);
    })();
    /* ---------- 축구 골대 ---------- */
    function goal(x,dir){
      const g=new THREE.Group(); const w=M(0xffffff);
      const post=(px,pz,h)=>{ const p=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,h,8),w); p.position.set(px,h/2,pz); g.add(p); };
      post(0,-2.6,2.3); post(0,2.6,2.3); const bar=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,5.2,8),w); bar.rotation.x=Math.PI/2; bar.position.set(0,2.3,0); g.add(bar);
      post(-1.4,-2.6,1.2); post(-1.4,2.6,1.2);
      const net=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.3,5.2),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.35})); net.position.set(-.7,1.15,0); g.add(net);
      g.position.set(x,0,-4); g.rotation.y=dir; scene.add(g);
    }
    goal(-18.6,0); goal(18.6,Math.PI);

    /* ---------- 전광판 (테두리 전구 반짝반짝) ---------- */
    const bulbs=[];
    const board = (function(){
      const cv=document.createElement('canvas'); cv.width=1024; cv.height=300; const g=cv.getContext('2d');
      const tex=texFromCanvas(cv);
      box(17.6,5.8,0.7,0x141a28,0,8.6,-21.5); box(0.6,3,0.6,0x141a28,-6,4.5,-21.6); box(0.6,3,0.6,0x141a28,6,4.5,-21.6);
      const m=new THREE.Mesh(new THREE.PlaneGeometry(16.6,4.8), new THREE.MeshBasicMaterial({map:tex})); m.position.set(0,8.6,-21.1); scene.add(m);
      const bg=new THREE.SphereGeometry(.12,8,6);
      for(let i=0;i<44;i++){ const t=i/44; let x,y; const per=2*(17.2+5.4); let d=t*per;
        if(d<17.2){x=-8.6+d;y=11.3;} else if((d-=17.2)<5.4){x=8.6;y=11.3-d;} else if((d-=5.4)<17.2){x=8.6-d;y=5.9;} else {d-=17.2;x=-8.6;y=5.9+d;}
        const b=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:0xffffff})); b.position.set(x,y,-21.1); scene.add(b); bulbs.push(b); }
      function wrap(text,maxW){ const words=text.split(' '); const lines=[]; let cur=''; for(const w of words){ const t=cur?cur+' '+w:w; if(g.measureText(t).width>maxW && cur){ lines.push(cur); cur=w; } else cur=t; } if(cur) lines.push(cur); return lines; }
      function draw(tag,main,right,color='#fff'){
        g.fillStyle='#0d1220'; g.fillRect(0,0,1024,300);
        for(let y=0;y<300;y+=6){ g.fillStyle='rgba(255,255,255,.025)'; g.fillRect(0,y,1024,2); }
        g.font='900 40px Jua, sans-serif'; g.textBaseline='top'; g.textAlign='left'; g.fillStyle='#ffd23f'; g.fillText(tag,36,24);
        g.textAlign='right'; g.fillStyle='#7cf0a6'; g.fillText(right||'',988,24);
        g.textAlign='center'; g.fillStyle=color; g.font='900 54px "Noto Sans KR", sans-serif';
        g.shadowColor=color; g.shadowBlur=14;
        const lines=wrap(main,930).slice(0,3); const lh=66; const start=165-(lines.length*lh)/2;
        lines.forEach((l,i)=>g.fillText(l,512,start+i*lh)); g.shadowBlur=0;
        tex.needsUpdate=true;
      }
      return {draw};
    })();
    const BULB_COLS=[0xffd23f,0xff6fb1,0x7cf0a6,0x8fb4ff];
    let bulbT=0, bulbStep=0;

    /* ---------- 나무 · 덤불 ---------- */
    function tree(x,z,s=1){ const g=new THREE.Group();
      const t=new THREE.Mesh(new THREE.CylinderGeometry(.22*s,.32*s,1.8*s,7),M(0x8b5a2b)); t.position.y=.9*s; g.add(t);
      const greens=[0x3f9b4a,0x4fb35a,0x37883f];
      [[0,2.5,0,1.35],[.7,2.1,.3,.95],[-.6,2.2,-.2,1.0],[0,3.3,0,.9]].forEach(([px,py,pz,r],i)=>{ const l=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,1),M(greens[i%3])); l.position.set(px*s,py*s,pz*s); g.add(l); });
      g.position.set(x,0,z); g.rotation.y=x*z; scene.add(g); }
    [[-22,-16],[-24,-8],[-23,0],[-22,8],[24,2],[22,9],[-14,-19.5],[14,-19.5],[-8,21],[0,22],[8,21],[-17,19],[17,19],[-28,-15],[-26,14],[26,14],[38,-2],[38,-22]].forEach(([x,z],i)=>tree(x,z,0.9+(i%3)*0.15));
    for(let i=0;i<14;i++){ const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.8,1),M(i%2?0x4caf50:0x43a047)); b.scale.y=.7; b.position.set(-19.8+(i%2)*39.6, .4, -14+Math.floor(i/2)*3.6); scene.add(b); }

    /* 고정된 물체에 그림자 (한 번만 계산해서 가볍게) */
    if(!settings.low){
      renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate=false;
      sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:120}); sun.shadow.camera.updateProjectionMatrix();
      scene.traverse(o=>{ if(o.isMesh && !o.userData.ns && o.geometry.type!=='PlaneGeometry' && o.geometry.type!=='CircleGeometry') o.castShadow=true; });
      renderer.shadowMap.needsUpdate=true;
    }

    /* ---------- 울타리 ---------- */
    function fence(cx,cz,color){
      const g=new THREE.Group(); const hw=ZONE_W/2+0.3, hd=ZONE_D/2+0.3; const mat=M(color), wht=M(0xffffff);
      const post=new THREE.BoxGeometry(.18,1.2,.18);
      const addPost=(x,z)=>{ const p=new THREE.Mesh(post,wht); p.position.set(x,.6,z); g.add(p); };
      for(let x=-hw;x<=hw+0.01;x+=hw/5){ addPost(x,-hd); addPost(x,hd); }
      for(let z=-hd;z<=hd+0.01;z+=hd/4){ addPost(-hw,z); addPost(hw,z); }
      for(const y of [.5,1.0]){
        const r1=new THREE.Mesh(new THREE.BoxGeometry(hw*2,.12,.12),mat); r1.position.set(0,y,-hd); g.add(r1);
        const r2=r1.clone(); r2.position.z=hd; g.add(r2);
        const r3=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,hd*2),mat); r3.position.set(-hw,y,0); g.add(r3);
        const r4=r3.clone(); r4.position.x=hw; g.add(r4);
      }
      g.position.set(cx,0,cz); g.scale.y=0.001; g.visible=false; scene.add(g); return g;
    }
    const fences=[fence(ZONES.O.x,ZONES.O.z,0x2f6bff), fence(ZONES.X.x,ZONES.X.z,0xef4b4b)];
    let fenceTarget=0, fenceVal=0;

    /* 선생님 캐릭터 */
    /* =========================================================
       캐릭터
       ========================================================= */
    const SKIN=0xf3c9a5, HAIR=0x1d1d24;
    const SHIRTS=['#ef4b4b','#2f6bff','#2fbf71','#ffd23f','#a05cff','#ff8a3d','#ff6fb1','#2cc6d6'];
    const NAMES=['민준','서연','도윤','하은','시우','지우','예준','수아','주원','지호','하준','서윤','유준','채원','건우','지민','우진','윤서','선우','다은','현우','소율','연우','예린','정우','가은','승현','하린','준서','민서','태윤','나윤','은우','수빈'];
    const HAIRS=[0x1d1d24,0x3a2618,0x5a3a22,0x2b2b3a];
    const geo={
      body:new THREE.CapsuleGeometry(.36,.42,4,14), shorts:new THREE.CylinderGeometry(.37,.4,.26,14),
      head:new THREE.SphereGeometry(.62,24,18), hairCap:new THREE.SphereGeometry(.665,24,14,0,Math.PI*2,0,Math.PI*0.52),
      pony:new THREE.SphereGeometry(.22,12,10), bangs:new THREE.SphereGeometry(.675,24,6,Math.PI*0.08,Math.PI*0.84,Math.PI*0.2,Math.PI*0.17), leg:new THREE.CapsuleGeometry(.13,.26,4,10), shoe:new THREE.SphereGeometry(.17,12,8),
      sleeve:new THREE.CapsuleGeometry(.12,.26,4,10), hand:new THREE.SphereGeometry(.12,12,8),
      eye:new THREE.SphereGeometry(.085,12,10), shine:new THREE.SphereGeometry(.028,6,6), cheek:new THREE.SphereGeometry(.11,10,8),
      mouth:new THREE.TorusGeometry(.075,.022,6,14,Math.PI), shadow:new THREE.CircleGeometry(.62,20) };
    const T = c => new THREE.MeshToonMaterial({color:c});
    const skinMat=T(SKIN), eyeMat=new THREE.MeshBasicMaterial({color:0x1a1a22}), shineMat=new THREE.MeshBasicMaterial({color:0xffffff}),
      cheekMat=new THREE.MeshBasicMaterial({color:0xff8fa3,transparent:true,opacity:.55}), shortsMat=T(0x2a3550), shoeMat=T(0xffffff);
    const shadowMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false});
    function labelSprite(text,me=false){
      const cv=document.createElement('canvas'); cv.width=256; cv.height=72; const g=cv.getContext('2d');
      g.font='900 34px "Noto Sans KR", sans-serif'; const w=Math.min(240,g.measureText(text).width+36);
      g.fillStyle= me?'#ffd23f':'rgba(29,36,51,.85)'; rrect(g,128-w/2,8,w,56,28); g.fill();
      if(me){ g.lineWidth=5; g.strokeStyle='#1d2433'; g.stroke(); }
      g.fillStyle= me?'#1d2433':'#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,128,37);
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texFromCanvas(cv),depthTest:false})); s.scale.set(2.2,.62,1); s.renderOrder=10; return s;
    }
    function emojiSprite(e){
      const cv=document.createElement('canvas'); cv.width=128; cv.height=128; const g=cv.getContext('2d');
      g.fillStyle='#fff'; g.beginPath(); g.arc(64,58,52,0,Math.PI*2); g.fill(); g.beginPath(); g.moveTo(52,104); g.lineTo(64,124); g.lineTo(76,104); g.fill();
      g.font='64px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,64,62);
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texFromCanvas(cv),depthTest:false})); s.scale.set(1.3,1.3,1); s.renderOrder=11; return s;
    }
    let charSeed=0;
    function makeChar(shirt,name,me=false){
      const g=new THREE.Group(); const seed=charSeed++;
      const shirtMat=T(shirt), hairMat=T(me?HAIRS[0]:HAIRS[seed%HAIRS.length]);
      const sh=new THREE.Mesh(geo.shadow,shadowMat); sh.rotation.x=-Math.PI/2; sh.position.y=.04; g.add(sh);
      // 다리 (엉덩이에 관절)
      const legs=[-1,1].map(sd=>{ const hip=new THREE.Group(); hip.position.set(sd*.17,.62,0);
        const leg=new THREE.Mesh(geo.leg,skinMat); leg.position.y=-.2; hip.add(leg);
        const shoe=new THREE.Mesh(geo.shoe,shoeMat); shoe.scale.set(1,.7,1.4); shoe.position.set(0,-.5,.06); hip.add(shoe);
        g.add(hip); return hip; });
      const shorts=new THREE.Mesh(geo.shorts,shortsMat); shorts.position.y=.7; g.add(shorts);
      const body=new THREE.Mesh(geo.body,shirtMat); body.position.y=1.08; g.add(body);
      // 팔 (어깨에 관절 → 흔들어도 몸에 붙어 있음)
      const arms=[-1,1].map(sd=>{ const sho=new THREE.Group(); sho.position.set(sd*.38,1.3,0);
        const pivot=new THREE.Group(); pivot.rotation.z=sd*.32; sho.add(pivot);
        const sleeve=new THREE.Mesh(geo.sleeve,shirtMat); sleeve.position.y=-.22; pivot.add(sleeve);
        const hand=new THREE.Mesh(geo.hand,skinMat); hand.position.y=-.5; pivot.add(hand);
        g.add(sho); return sho; });
      // 머리
      const head=new THREE.Group(); head.position.y=1.98; g.add(head);
      head.add(new THREE.Mesh(geo.head,skinMat));
      const cap=new THREE.Mesh(geo.hairCap,hairMat); cap.rotation.x=-.75; head.add(cap);
      const bangs=new THREE.Mesh(geo.bangs,hairMat); head.add(bangs);
      head.rotation.x=-.18; // 얼굴이 살짝 위(카메라)를 보도록
      if(!me && seed%3===1){ const pony=new THREE.Mesh(geo.pony,hairMat); pony.position.set(0,.15,-.68); head.add(pony); }
      [-1,1].forEach(sd=>{
        const e=new THREE.Mesh(geo.eye,eyeMat); e.scale.set(1.15,1.45,.6); e.position.set(sd*.21,-.02,.565); head.add(e);
        const sh2=new THREE.Mesh(geo.shine,shineMat); sh2.position.set(sd*.21+.03,.04,.62); head.add(sh2);
        const ck=new THREE.Mesh(geo.cheek,cheekMat); ck.scale.set(1,.6,.3); ck.position.set(sd*.36,-.17,.47); head.add(ck);
      });
      const mouth=new THREE.Mesh(geo.mouth,eyeMat); mouth.rotation.z=Math.PI; mouth.position.set(0,-.17,.585); head.add(mouth);
      const label=labelSprite(name,me); label.position.y=3.15; g.add(label);
      if(me){ const ring=new THREE.Mesh(new THREE.RingGeometry(.78,.98,28),new THREE.MeshBasicMaterial({color:0xffd23f,side:THREE.DoubleSide})); ring.rotation.x=-Math.PI/2; ring.position.y=.05; g.add(ring); }
      scene.add(g);
      return {group:g, legs, arms, head, label, emoji:null, emojiT:0};
    }

    /* 선생님 (단상) */
    (function teacherNpc(){ const t=makeChar('#1d2433','선생님'); t.group.position.set(0,0,-17.6); box(2.4,1.1,1.0,0x8b4a1f,0,.55,-16.6); })();
    /* ════════ 원본 그대로 (끝) ════════ */
    return { THREE, canvas, renderer, scene, camera, board, bulbs, BULB_COLS, clouds, fences, makeChar, emojiSprite, SHIRTS, settings };
  }

  /* ── 페스티벌 연결 부분 ── */
  let chars = {}, fenceVal = 0, bulbT = 0, bulbStep = 0, boardKey = '', last = 0, camPos = null, camLook = null, host = null, size = '';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function showEmoji(ch, e) {
    if (ch.c.emoji) ch.c.group.remove(ch.c.emoji);
    const s = W.emojiSprite(e); s.position.y = 4.1; ch.c.group.add(s); ch.c.emoji = s; ch.c.emojiT = 2.2;
  }
  function boardFor(pub, st, n) {
    const q = pub.q;
    if (pub.ph === 'result') return ['🏆 최종 결과', '교실 화면에서 순위를 확인해요', `${(st && st.q) || 0}문제`];
    if (!q || pub.ph === 'intro') return ['체육 OX 서바이벌', '선생님이 문제를 내면 정답 칸으로 달려가세요!', `👥 ${n}명`];
    if (pub.ph === 'reveal' && pub.ans) return [`Q${q.n} 정답`, `정답은 ${pub.ans === 'O' ? '⭕ O' : '❌ X'}  ${pub.ex || ''}`, `생존 ${(st && st.alive) || 0}명`, pub.ans === 'O' ? '#8fb4ff' : '#ff9a9a'];
    if (pub.ph === 'closed') return [`Q${q.n}`, q.text, '판정 중...'];
    if (pub.ph === 'count') return [`Q${q.n + 1 <= q.total ? q.n + 1 : q.n}`, '곧 다음 문제가 나와요!', `생존 ${(st && st.alive) || 0}명`];
    return [`Q${q.n}`, q.text, `${Math.ceil((st && st.left) || 0)}`];
  }
  return {
    load, get failed() { return failed; }, get ready() { return !!W; },
    EMOJIS,
    get SHIRTS() { return W ? W.SHIRTS : ['#ef4b4b', '#2f6bff', '#2fbf71', '#ffd23f', '#a05cff', '#ff8a3d', '#ff6fb1', '#2cc6d6']; },
    attach(parent) { if (!W) return; if (W.canvas.parentNode !== parent) parent.prepend(W.canvas); host = parent; W.canvas.style.display = ''; },
    detach() { if (W && W.canvas.parentNode) W.canvas.style.display = 'none'; },
    reset() { if (!W) return; for (const id in chars) W.scene.remove(chars[id].c.group); chars = {}; boardKey = ''; },
    /* v = { st, pub, players, me, tv, nameOf } */
    frame(v) {
      if (!W) return;
      const { THREE, renderer, camera, scene, board, bulbs, BULB_COLS, clouds, fences } = W;
      const now = performance.now(), dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      // 크기 맞추기
      const cw = W.canvas.clientWidth || 1, chh = W.canvas.clientHeight || 1, key = cw + 'x' + chh;
      if (key !== size) { size = key; renderer.setSize(cw, chh, false); camera.aspect = cw / chh; camera.updateProjectionMatrix(); }
      const st = v.st || {}, ps = st.p || {}, pub = v.pub || {};
      // 캐릭터 만들기·지우기
      for (const id in ps) {
        const pl = v.players[id]; if (!pl || !pl.c) continue;
        const shirt = W.SHIRTS[(ps[id][3] || 0) % W.SHIRTS.length], name = v.nameOf(pl), me = id === v.me;
        let ch = chars[id];
        if (ch && (ch.shirt !== shirt || ch.name !== name)) { scene.remove(ch.c.group); ch = null; }
        if (!ch) { ch = chars[id] = { c: W.makeChar(shirt, name, me), shirt, name, x: ps[id][0] / 100, z: ps[id][1] / 100, vx: 0, vz: 0, ry: 0, walk: 0, es: ps[id][5] }; }
      }
      for (const id in chars) if (!ps[id] || !v.players[id]) { scene.remove(chars[id].c.group); delete chars[id]; }
      // 위치·애니메이션 (원본 step()의 캐릭터 부분과 같은 계산)
      const k = Math.min(1, dt * 12);
      for (const id in chars) {
        const p = chars[id], s = ps[id], tx = s[0] / 100, tz = s[1] / 100, alive = !!(s[2] & 1), auto = !!(s[2] & 8);
        const nx = Math.hypot(tx - p.x, tz - p.z) > 6 ? tx : p.x + (tx - p.x) * k, nz = Math.hypot(tx - p.x, tz - p.z) > 6 ? tz : p.z + (tz - p.z) * k;
        p.vx = p.vx * 0.6 + ((nx - p.x) / dt) * 0.4; p.vz = p.vz * 0.6 + ((nz - p.z) / dt) * 0.4; p.x = nx; p.z = nz;
        const c = p.c, g = c.group; g.position.set(p.x, 0, p.z);
        const sp = Math.hypot(p.vx, p.vz);
        if (sp > 0.3) { const tr = Math.atan2(p.vx, p.vz); let d = tr - p.ry; d = Math.atan2(Math.sin(d), Math.cos(d)); p.ry += d * Math.min(1, dt * 12); p.walk += dt * sp * 2.2; }
        else p.walk *= 0.8;
        g.rotation.y = p.ry; const sw = Math.sin(p.walk) * 0.7 * Math.min(1, sp / 3);
        c.legs[0].rotation.x = sw; c.legs[1].rotation.x = -sw; c.arms[0].rotation.x = -sw * 1.1; c.arms[1].rotation.x = sw * 1.1; c.head.rotation.z = Math.sin(p.walk * 0.5) * 0.06 * Math.min(1, sp / 3);
        const cheer = !alive && !auto && sp < 0.3;
        g.position.y = cheer ? Math.abs(Math.sin(now / 180 + p.x)) * 0.25 : Math.abs(Math.sin(p.walk)) * 0.08 * Math.min(1, sp / 3);
        if (cheer) { const w = Math.sin(now / 150 + p.x) * 0.5; c.arms[0].rotation.x = -2.6 + w; c.arms[1].rotation.x = -2.6 - w; } // 응원: 만세
        if (s[5] !== p.es) { p.es = s[5]; if (s[4] >= 0 && EMOJIS[s[4]]) showEmoji(p, EMOJIS[s[4]]); }
        if (c.emoji) { c.emojiT -= dt; c.emoji.position.y = 4.1 + Math.sin(c.emojiT * 6) * 0.05; if (c.emojiT <= 0) { g.remove(c.emoji); c.emoji = null; } }
      }
      // 전광판
      const bd = boardFor(pub, st, Object.keys(chars).length), bk = bd.join('|');
      if (bk !== boardKey) { boardKey = bk; board.draw(bd[0], bd[1], bd[2], bd[3]); }
      // 구름 · 전광판 전구 · 울타리 (원본과 같음)
      clouds.forEach(c => { c.position.x += dt * 0.8; if (c.position.x > 85) c.position.x = -85; });
      bulbT += dt; if (bulbT > (pub.ph === 'play' ? 0.18 : 0.45)) { bulbT = 0; bulbStep++; bulbs.forEach((b, i) => b.material.color.setHex(BULB_COLS[(i + bulbStep) % BULB_COLS.length])); }
      const fenceTarget = ['closing', 'judge', 'graded'].includes(st.ph) ? 1 : 0;
      fenceVal += (fenceTarget - fenceVal) * Math.min(1, dt * 5);
      fences.forEach(f => { f.visible = fenceVal > 0.02; f.scale.y = Math.max(0.001, fenceVal); });
      // 카메라 (원본과 같음: TV 전체 보기 / 내 쿼터뷰)
      if (!camPos) { camPos = new THREE.Vector3(0, 30, 30); camLook = new THREE.Vector3(0, 0, -3); }
      const portrait = chh > cw, mine = v.me && chars[v.me];
      let tp, tl;
      if (v.tv || !mine) { tp = new THREE.Vector3(0, portrait ? 54 : 31, portrait ? 42 : 30); tl = new THREE.Vector3(0, portrait ? 0 : 3, portrait ? -3 : -10); }
      else { const kk = portrait ? 1 : 0.8; tp = new THREE.Vector3(mine.x, 19 * kk, mine.z + 12.5 * kk); tl = new THREE.Vector3(mine.x, 0.8, mine.z - 2.5); }
      camPos.lerp(tp, Math.min(1, dt * 6)); camLook.lerp(tl, Math.min(1, dt * 6));
      camera.position.copy(camPos); camera.lookAt(camLook);
      renderer.render(scene, camera);
    }
  };
})();
