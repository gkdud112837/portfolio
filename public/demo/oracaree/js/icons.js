/* ============================================================
   ORAcarEE 데모 — 아이콘 · 지도 SVG
   ============================================================ */
(function () {
  'use strict';
  var O = (window.ORA = window.ORA || {});

  var P = {
    search: 'M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z',
    car: 'M5 16v3m14-3v3M4 16h16l-1.4-5.2A2 2 0 0016.7 9H7.3a2 2 0 00-1.9 1.8L4 16z',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    history: 'M12 7v5l3 2M3.1 12a8.9 8.9 0 108.9-8.9A8.9 8.9 0 004.6 6.4M3 4v3h3',
    bookmark: 'M7 4h10v16l-5-4-5 4z',
    pin: 'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z',
    chev: 'M9 6l6 6-6 6',
    home: 'M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1z',
    star: 'M12 3.5l2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17.6 6.4 20.5l1.2-6.1L3 10.1l6.3-.8z',
    person: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2.2-7 5v1h14v-1c0-2.8-3-5-7-5z',
    back: 'M15 5l-7 7 7 7',
    card: 'M3 7.5A1.5 1.5 0 014.5 6h15A1.5 1.5 0 0121 7.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 16.5zM3 10h18',
    check: 'M20 7L10 17l-5-5',
    bot: 'M12 4a1.6 1.6 0 011.6 1.6c0 .6-.3 1.1-.8 1.4V8h2.7A3.5 3.5 0 0119 11.5v4A3.5 3.5 0 0115.5 19h-7A3.5 3.5 0 015 15.5v-4A3.5 3.5 0 018.5 8h2.7V7c-.5-.3-.8-.8-.8-1.4A1.6 1.6 0 0112 4zM9.5 12a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4zm5 0a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z',
    siren: 'M12 3a5 5 0 015 5v4l1.6 3H5.4L7 12V8a5 5 0 015-5zM10 19a2 2 0 004 0',
    wifi: 'M5 12.5a10 10 0 0114 0M8 15.5a6 6 0 018 0M12 19h.01',
    signal: 'M4 18h2v-4H4zm5 0h2V9H9zm5 0h2V5h-2z',
    battery: 'M4 8h13a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1zm16 2.5v3'
  };

  O.icon = function (name, size, cls) {
    var d = P[name] || P.pin;
    var filled = name === 'home' || name === 'star' || name === 'person' || name === 'pin' || name === 'bookmark';
    return '<svg class="' + (cls || '') + '" width="' + (size || 24) + '" height="' + (size || 24) +
      '" viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') +
      '" stroke="' + (filled ? 'none' : 'currentColor') +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  };

  O.statusIcons = function () {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="' + P.wifi + '"/></svg>' +
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="' + P.signal + '"/></svg>' +
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="' + P.battery + '"/></svg>';
  };

  /* ============================================================
     움직이는 지도 — 실제 화면 녹화에서 프레임 간 이동량을 추적해 이어 붙인
     지도(파노라마)와 그 카메라 궤적(tracks.js)을 그대로 재생한다.
     실제 앱처럼 수달 택시는 화면의 한 자리에 고정되고 지도가 따라 움직인다.
     좌표는 녹화 540 x 1170 기준이며 화면에는 2/3 배율로 그린다.
     ============================================================ */
  O.SCALE = 2 / 3;
  /* 수달 바퀴 아래 중심점 — 녹화에서 실측한 화면 위치 */
  O.OTTER_AT = { x: 180, y: 382 };

  /* 진행 방향(8방위) → [파일, 폭]. 녹화 속 수달 모습과 같은 그림을 고른다 */
  O.OTTER = {
    n:  ['otter-up.png', 44],
    ne: ['otter-up-right.png', 66],
    nw: ['otter-up-left.png', 66],
    w:  ['otter-down-right.png', 66],
    sw: ['otter-down-right.png', 66],
    s:  ['otter-down.png', 46],
    se: ['otter-down-left.png', 66],
    e:  ['otter-down-left.png', 66]
  };

  O.liveMap = function (name) {
    var t = O.TRACKS[name];
    return '<div class="live-map" data-live="' + name + '">' +
      '<div class="pan"><img src="assets/maps/' + name + '.jpg" alt="" style="width:' +
        (t.w * O.SCALE).toFixed(1) + 'px;height:' + (t.h * O.SCALE).toFixed(1) + 'px"></div>' +
      '<img class="otter" alt="" src="assets/otter-up-right.png">' +
      '</div>';
  };
})();
