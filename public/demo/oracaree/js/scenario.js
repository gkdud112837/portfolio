/* ============================================================
   ORAcarEE 데모 — 자동 시연 시나리오
   실제 화면 녹화 1·2·3의 순서를 그대로 따른다.
   홈 → 탑승 위치 검색 → 도착지 핀 지정 → 경로·요금 확인 → 호출 → 택시 탐색
   → 택시가 다른 곳에서 탑승지로 이동 → 도착 · 탑승 → 목적지까지 운행
   → 결제 안내 푸시 → 도착 · 자동 결제 → 홈 → 반복
   ============================================================ */
(function () {
  'use strict';
  var O = window.ORA;

  /* 한글 입력이 조합되는 모습 그대로 — 녹화에서 "상암동 dmc"를 검색했다 */
  var TYPING = ['ㅅ', '사', '상', '상ㅇ', '상아', '상암', '상암ㄷ', '상암도', '상암동', '상암동 ',
    '상암동 d', '상암동 dm', '상암동 dmc'];
  var SUGGEST = {
    '상': ['상', '상암', '상태'], '상암': ['상암', '상암동', '상담'], '상암동': ['상암동', '상담', '사암'],
    '상암동 d': ['I', 'is', 'and'], '상암동 dm': ['dm', 'do', 'didn\'t'], '상암동 dmc': ['dmc', 'do', 'didn\'t']
  };

  O.buildScript = function (app) {
    var s = [];
    var at = function (t, fn) { s.push({ t: t, fn: fn }); };

    /* 홈 — 지금 호출하기 */
    at(0, function () { app.go('home'); });
    at(1300, function () { app.flash('[data-k="call"]'); });

    /* 탑승 위치 — 현재 위치(구미)가 먼저 잡힌다 */
    at(1900, function () { app.go('pickup', { text: '' }); });
    at(2500, function () { app.go('pickup', { text: O.TRIP.gumi }); });

    /* 입력창을 눌러 상암 DMC를 검색 */
    at(3500, function () { app.go('pickup', { keyboard: true, text: O.TRIP.gumi, suggest: ['모바', '', ''] }); });
    at(3900, function () { app.go('pickup', { keyboard: true, text: '' }); });
    TYPING.forEach(function (txt, i) {
      at(4100 + i * 140, function () {
        var key = Object.keys(SUGGEST).filter(function (k) { return txt.indexOf(k) === 0; }).pop();
        app.go('pickup', { keyboard: true, text: txt, suggest: key ? SUGGEST[key] : ['', '', ''] });
      });
    });

    /* 검색 결과 선택 — 키보드가 내려가고 지도가 상암으로 옮겨간다 */
    var tP = 4100 + TYPING.length * 140 + 500;
    at(tP, function () { app.go('pickup', { sangam: true, fade: true, text: O.TRIP.from }); });
    at(tP + 1300, function () { app.flash('[data-k="pick"]'); });

    /* 도착지 — 목적지(서부운전면허시험장) 바로 표시 (화면 끊김 제거) */
    var tD = tP + 1800;
    at(tD, function () { app.go('dest'); });
    var tDe = tD + 1300;
    at(tDe, function () { app.flash('[data-k="dest"]'); });

    /* 경로 확인 — 요금·소요 시간을 계산한 뒤 보여준다 */
    var tR = tDe + 1600;
    at(tR, function () { app.go('route', { ready: false }); });
    at(tR + 1300, function () { app.go('route', { ready: true }); });
    at(tR + 2700, function () { app.flash('[data-k="hail"]'); });

    /* 호출 → 근처 택시 탐색 */
    var tS = tR + 3300;
    at(tS, function () { app.go('searching'); app.toast('수달 택시를 호출합니다.', 2000); });

    /* 배차 — 미디어재단 TBS 앞에 있던 택시가 탑승지(DMC홍보관)로 온다 */
    var tC = tS + 2200;
    at(tC, function () { app.go('coming'); app.playTrack(5200); });
    at(tC + 5500, function () { app.go('coming', { arrived: true }); });
    at(tC + 6900, function () { app.flash('[data-k="board"]'); });

    /* 운행 — 탑승지에서 목적지까지, 녹화 속 카메라 이동을 그대로 재생 */
    var tM = tC + 7500;
    var RIDE = 17000;
    at(tM, function () { app.go('riding'); app.playTrack(RIDE); });

    /* 목적지 근처 — 결제 안내 푸시가 오고 지도가 확대된다 */
    var tZ = tM + RIDE + 200;
    at(tZ - 1200, function () { app.headsup(true); });
    at(tZ, function () { app.go('riding', { zoom: true }); app.playTrack(3600); });
    at(tZ + 2600, function () { app.headsup(false); });

    /* 도착 · 자동 결제 */
    var tE = tZ + 3900;
    at(tE, function () { app.go('done', { paid: false }); });
    at(tE + 1500, function () { app.go('done', { paid: true }); });

    /* 홈 — 자동 결제 완료 토스트, 최근 목적지에 방금 간 곳이 올라온다 */
    at(tE + 4300, function () {
      app.go('home', { end: true });
      app.toast('수달 택시 이용 요금 2,500원이 자동 결제되었습니다.', 3000);
    });

    at(tE + 7600, function () { app.restart(); });

    return s;
  };
})();
