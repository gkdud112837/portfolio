/* ============================================================
   ORAcarEE 데모 — 화면 렌더러
   실제 화면 녹화(1080 x 2340)를 1/3 배율(360 x 780)로 옮겨 배치한다.
   홈 · 탑승 위치 설정 · 도착지 설정 · 경로 확인 · 택시 탐색 · 배차 · 운행 · 완료
   ============================================================ */
(function () {
  'use strict';
  var O = window.ORA;
  var icon = function (n, s, c) { return O.icon(n, s, c); };

  var TRIP = {
    gumi: '경상북도 구미시 3공단3로 302 삼성스토어 스마트시티 모바일',
    from: '서울 마포구 월드컵북로 366 DMC홍보관',
    fromFull: '서울특별시 마포구 월드컵북로 366 DMC홍보관',
    to: '서울특별시 마포구 월드컵로42길 13 서부운전면허시험장',
    toFull: '서울특별시 마포구 월드컵로42길 13 한국도로교통공단 서부운전면허시험장',
    price: '2,500원',
    minutes: '약 4분 소요'
  };
  O.TRIP = TRIP;

  function tabbar() {
    var items = [['home', '홈'], ['history', '이용내역'], ['star', '즐겨찾기'], ['person', '마이페이지']];
    return '<nav class="tabbar">' + items.map(function (it, i) {
      return '<div class="tab' + (i === 0 ? ' on' : '') + '">' + icon(it[0], 21) + '<span>' + it[1] + '</span></div>';
    }).join('') + '</nav>';
  }

  function appbar(title, back) {
    return '<div class="appbar">' + (back ? icon('back', 20, 'back') : '') + '<h1>' + title + '</h1></div>';
  }

  /* 녹화에서 잘라낸 지도 한 장. 화면 상단(상태바 아래)부터 깔린다 */
  function still(file, cls) {
    return '<div class="still' + (cls ? ' ' + cls : '') + '"><img src="assets/maps/' + file + '" alt=""></div>';
  }

  /* 실제 녹화 화면 캡처 한 장 (홈 · 완료처럼 움직임이 없는 화면) */
  function shot(file) {
    return '<div class="shot"><img src="assets/maps/' + file + '" alt=""></div>';
  }

  function pinSvg(color) {
    return '<svg class="center-pin" viewBox="0 0 24 32" aria-hidden="true"><path d="M12 31s10-11.2 10-18.6A10 10 0 0 0 2 12.4C2 19.8 12 31 12 31z" fill="' + color + '"/><circle cx="12" cy="12.2" r="3.6" fill="#fff"/></svg>';
  }

  O.screens = {

    /* ── 홈 — 녹화 화면과 같은 배치. 운행을 마치면 방금 간 곳이 최근 목적지 맨 위에 올라온다 ── */
    home: function (st) {
      var dests = [
        ['서울특별시 마포구 월드컵로42길 40 다이클로 상암월드컵파크6단지점', '서울특별시 마포구 월드컵로42길 40 다이클로 상암월드컵파크6단지점'],
        ['서울 마포구 상암동 1538 난지천공원', '서울 마포구 상암동 1538 난지천공원'],
        ['경상북도 구미시 대학로 61 금오공과대학교', '경상북도 구미시 대학로 61 금오공과대학교']
      ];
      if (st && st.end) dests = [[TRIP.toFull, TRIP.toFull]].concat(dests.slice(0, 2));
      return '<div class="scene home">' +
        '<div class="hello"><img src="assets/otter.png" alt=""><div><b>안녕하세요, 하영님!</b><span>오늘은 어디로 모실까요?</span></div></div>' +
        '<div class="searchbar">' + icon('search', 17) + '<span>목적지, 맛집 등을 검색하세요</span></div>' +
        '<div class="call-card">' +
          '<div class="call-top"><div class="call-icon">' + icon('car', 17) + '</div><span class="chip-ok">호출 가능</span></div>' +
          '<h2>무인 택시 부르기</h2><p>오라카이 택시가 근처에 대기중입니다!</p>' +
          '<img class="call-otter" src="assets/otter-down-right.png" alt="">' +
          '<div class="btn-call" data-k="call">지금 호출하기 ' + icon('arrow', 15) + '</div>' +
        '</div>' +
        '<div class="quick">' +
          '<div class="quick-card">' + icon('history', 17) + '<b>이용내역</b><span>지난 여정 확인</span></div>' +
          '<div class="quick-card">' + icon('bookmark', 17) + '<b>저장된 장소</b><span>집, 회사...</span></div>' +
        '</div>' +
        '<div class="sec-title">최근 목적지</div>' +
        '<div class="dests">' + dests.map(function (d) {
          return '<div class="dest"><div class="dest-pin">' + icon('pin', 15) + '</div>' +
            '<div class="dest-txt"><b>' + d[0] + '</b><span>' + d[1] + '</span></div>' + icon('chev', 13, 'chev') + '</div>';
        }).join('') + '</div>' +
        tabbar() + '</div>';
    },

    /* ── 탑승 위치 설정 ── */
    pickup: function (st) {
      st = st || {};
      var kbd = !!st.keyboard;
      var map = st.sangam ? 'pick-sangam.jpg' : 'pick-gumi.jpg';
      var text = st.text != null ? st.text : '';
      var field = text
        ? '<span class="typed">' + text + '</span>' + (kbd ? '<i class="caret"></i>' : '')
        : (kbd ? '<i class="caret"></i>' : '<span class="ph">장소명 또는 주소를 입력하세요</span>');
      return '<div class="scene">' +
        '<div class="map-area' + (kbd ? ' is-kbd' : '') + '">' + still(map, st.fade ? 'fade-in' : '') + '</div>' +
        '<div class="sheet' + (kbd ? ' is-kbd' : '') + '">' +
          '<h2>탑승 위치를 설정하세요</h2>' +
          '<div class="field' + (kbd ? ' focus' : '') + '">' + field + '</div>' +
          '<div class="btn-pill" data-k="pick">지도 핀 위치에서 탑승</div>' +
        '</div>' +
        tabbar() +
        (kbd ? '<div class="keyboard"><div class="suggest">' +
          (st.suggest || ['', '', '']).map(function (w) { return '<span>' + w + '</span>'; }).join('') +
          '</div><img src="assets/keyboard.png" alt=""></div>' : '') +
        '</div>';
    },

    /* ── 도착지 설정 — 목적지 지점 바로 표시 ── */
    dest: function () {
      var addr = '<span class="typed">' + TRIP.to + '</span>';
      return '<div class="scene">' +
        '<div class="map-area">' + still('dest-6.jpg', 'fade-in') + '</div>' +
        appbar('도착지 설정', true) +
        '<div class="sheet">' +
          '<h2>어디로 모실까요?</h2>' +
          '<div class="field focus">' + addr + '</div>' +
          '<div class="btn-pill" data-k="dest">지도 핀 위치를 도착지로 설정</div>' +
        '</div>' + tabbar() + '</div>';
    },

    /* ── 경로 확인 ── */
    route: function (st) {
      var ready = st && st.ready;
      return '<div class="scene">' +
        '<div class="map-area">' + still('route-2.jpg') + '</div>' +
        appbar('경로 확인', true) +
        '<div class="sheet route">' +
          '<p class="trip-line"><b>출발:</b> ' + TRIP.fromFull + '</p>' +
          '<p class="trip-line"><b>도착:</b> ' + TRIP.toFull + '</p>' +
          (ready
            ? '<div class="fare"><span class="won">예상 금액: ' + TRIP.price + '</span><i>·</i><span class="min">' + TRIP.minutes + '</span></div>'
            : '<div class="fare calc">자율주행 요금 및 소요 시간 계산 중...</div>') +
          '<div class="btn-hail" data-k="hail">' + icon('car', 17) + ' 오라카이 택시 호출하기</div>' +
          '<div class="hail-note">가장 가까운 수달 택시가 3분 내에 도착합니다</div>' +
        '</div>' + tabbar() + '</div>';
    },

    /* ── 근처 택시 탐색 ── */
    searching: function () {
      return '<div class="scene">' +
        '<div class="map-area tall">' + still('search.jpg') + '</div>' +
        appbar('오라카이', false) +
        '<div class="sheet light searching"><div class="grab"></div>' +
          '<p class="finding">근처 오라카이 택시를 찾는 중입니다...</p>' +
          '<div class="spinner"></div>' +
        '</div>' + tabbar() + '</div>';
    },

    /* ── 배차 — 대기하던 택시가 다른 곳에서 탑승지로 온다 ── */
    coming: function (st) {
      var arrived = st && st.arrived;
      return '<div class="scene">' + O.liveMap('approach') +
        appbar('오라카이', false) +
        '<div class="sheet light coming"><div class="grab"></div>' +
          '<h2>오라카이가 가고있어요!</h2>' +
          '<div class="eta"><span class="badge">승차 예정</span><b>잠시 후 탑승지로 도착합니다</b></div>' +
        '</div>' + tabbar() +
        (arrived
          ? '<div class="dim"></div><div class="modal">' +
              '<b>오라카이가 도착했습니다!</b>' +
              '<p>탑승이 완료되셨다면 탑승 완료 버튼을<br>눌러주세요!</p>' +
              '<div class="btn-pill" data-k="board">탑승 완료</div>' +
            '</div>'
          : '') +
        '</div>';
    },

    /* ── 운행 중 — 탑승지에서 목적지까지 ── */
    riding: function (st) {
      var zoom = st && st.zoom;
      return '<div class="scene">' + O.liveMap(zoom ? 'zoom' : 'ride') +
        appbar('오라카이', true) +
        '<div class="sheet light riding" data-ride-sheet><div class="grab"></div>' +
          '<h2>수달 택시가 이동 중이에요</h2>' +
          '<div class="eta"><span class="badge">도착 예정</span><b data-eta>약 4분 후 도착</b></div>' +
          '<div class="car-card"><div class="car-ico">' + icon('bot', 17) + '</div>' +
            '<div><span class="plate">서울 00 가 1234</span><b>수달 자율주행 택시</b>' +
            '<span class="stat">● 안전 운행 중</span></div></div>' +
          '<div class="sheet-btns"><div class="btn btn-green">문의하기</div>' +
            '<div class="btn btn-red">' + icon('siren', 13) + ' 비상 정지</div></div>' +
        '</div>' + tabbar() + '</div>';
    },

    /* ── 운행 완료 · 자동 결제 (실제 화면 캡처) ── */
    done: function (st) {
      return '<div class="scene">' + shot(st && st.paid ? 'done-paid.jpg' : 'done-loading.jpg') + '</div>';
    }
  };
})();
