/* 우리 반 게임 페스티벌 — 구글 앱스 스크립트 버전 (Code.gs + Index.html 두 파일)

   ① 아래 FB_CONFIG에 Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹) → "SDK 설정 및 구성" 값을 붙여 넣습니다.
      값을 넣기 전에는 "연습 모드"(같은 컴퓨터의 브라우저 창끼리만 연결)로 열립니다.
   ② 배포 → 새 배포 → 유형: 웹 앱 → 실행 사용자: 나 → 액세스 권한: 모든 사용자 → 배포.
      나오는 웹 앱 주소(…/exec)가 교실에서 접속할 주소입니다. QR도 이 주소로 자동으로 만들어집니다.
   ③ 코드를 고친 뒤에는 배포 → 배포 관리 → 연필 → 버전: "새 버전" → 배포 를 눌러야 학생들에게 반영됩니다.

   게임 판정과 실시간 연결은 모두 Index.html 안(교실 컴퓨터 화면)과 Firebase에서 일어납니다.
   이 파일은 페이지를 내보내고, 주소 뒤에 붙은 값(?r=방번호, ?host=방번호 등)을 페이지에 넘겨 주는 일만 합니다. */

const FB_CONFIG = {
  apiKey: '여기에_붙여넣기',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  appId: ''
};

function doGet(e) {
  const p = (e && e.parameter) || {};
  const qs = Object.keys(p).map(k => encodeURIComponent(k) + (p[k] === '' ? '' : '=' + encodeURIComponent(p[k]))).join('&');
  const boot = 'window.GAS_BASE=' + JSON.stringify(ScriptApp.getService().getUrl()) +
    ';window.GAS_QS=' + JSON.stringify(qs ? '?' + qs : '') +
    ';window.FB_CONFIG=' + JSON.stringify(FB_CONFIG) + ';';
  const html = HtmlService.createHtmlOutputFromFile('Index').getContent().replace('/*__GAS_BOOT__*/', () => boot);
  return HtmlService.createHtmlOutput(html)
    .setTitle('우리 반 게임 페스티벌')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
