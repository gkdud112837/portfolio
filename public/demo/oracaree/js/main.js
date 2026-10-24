/* ============================================================
   ORAcarEE 데모 — 런타임
   URL 해시: #autoplay (자동 재생) #kiosk (포트폴리오 임베드)
   ============================================================ */
(function () {
  'use strict';
  var O = window.ORA;

  var screenEl = document.querySelector('[data-screen]');
  var toastEl = document.getElementById('toast');
  var headsupEl = document.getElementById('headsup');
  var toastTimer = null;

  var app = {
    route: 'home',
    state: {},

    go: function (route, state) {
      if (route !== this.route) {
        clearTimeout(toastTimer);
        toastEl.classList.add('hidden');
      }
      this.stopTrack();
      this.route = route;
      this.state = state || {};
      screenEl.innerHTML = O.screens[route](this.state);
      /* 같은 화면을 다시 그릴 때 지도가 처음 위치로 튀지 않도록 마지막 위치를 이어 받는다 */
      var live = screenEl.querySelector('[data-live]');
      if (live && this._track && this._track.name === live.dataset.live) this.placeTrack(this._track.p);
    },

    /* 녹화 궤적의 비율 p(0~1) 지점으로 지도를 옮긴다. 수달은 화면에 고정되어 있다 */
    placeTrack: function (p) {
      var live = screenEl.querySelector('[data-live]');
      if (!live) return;
      var name = live.dataset.live;
      var pts = O.TRACKS[name].pts;
      var f = Math.max(0, Math.min(1, p)) * (pts.length - 1);
      var i = Math.min(pts.length - 2, Math.floor(f));
      var k = f - i;
      var a = pts[i], b = pts[i + 1];
      var x = a[0] + (b[0] - a[0]) * k;
      var y = a[1] + (b[1] - a[1]) * k;
      var s = O.SCALE;
      live.querySelector('.pan').style.transform =
        'translate(' + (-x * s).toFixed(1) + 'px,' + (-y * s).toFixed(1) + 'px)';
      this._track = { name: name, p: p };

      /* 진행 방향 — 몇 칸 앞을 보고 정해야 작은 흔들림에 그림이 바뀌지 않는다 */
      var j = Math.min(pts.length - 1, i + 3), h = Math.max(0, j - 4);
      var dx = pts[j][0] - pts[h][0], dy = pts[j][1] - pts[h][1];
      if (Math.abs(dx) + Math.abs(dy) > 1.5) this.faceDir(live, Math.atan2(-dy, dx) * 180 / Math.PI);

      /* 출발 직후 일부만 펼친 채로 두고, 그 이후 및 도착 직전에는 핸들(아래창)이 올라오지 않도록 유지 */
      var sheet = screenEl.querySelector('[data-ride-sheet]');
      if (sheet) sheet.classList.toggle('is-collapsed', !(name === 'ride' && p < 0.13));
    },

    faceDir: function (live, deg) {
      var dirs = ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'];
      var a = (deg + 360) % 360;
      var d = dirs[Math.round(a / 45) % 8];
      var img = live.querySelector('.otter');
      if (img.dataset.dir === d) return;
      /* 두 방위 경계 근처에서 그림이 번갈아 바뀌지 않도록, 지금 방향에서 35° 넘게 벗어날 때만 바꾼다 */
      var cur = dirs.indexOf(img.dataset.dir);
      if (cur !== -1) {
        var diff = Math.abs(a - cur * 45) % 360;
        if (Math.min(diff, 360 - diff) < 35) return;
      }
      var spr = O.OTTER[d];
      img.dataset.dir = d;
      img.src = 'assets/' + spr[0];
      img.style.width = spr[1] + 'px';
      img.style.left = (O.OTTER_AT.x - spr[1] / 2) + 'px';
    },

    /* 녹화 궤적을 ms 동안 재생한다. rAF 는 백그라운드 탭에서 멈추므로 타이머로 돌린다 */
    playTrack: function (ms, from, to) {
      var self = this;
      this.stopTrack();
      from = from == null ? 0 : from;
      to = to == null ? 1 : to;
      var t0 = performance.now();
      this.placeTrack(from);
      this._timer = setInterval(function () {
        var k = Math.min(1, (performance.now() - t0) / ms);
        self.placeTrack(from + (to - from) * k);
        if (k >= 1) self.stopTrack();
      }, 33);
    },

    stopTrack: function () {
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
    },

    setText: function (sel, text) {
      var el = screenEl.querySelector(sel);
      if (el) el.textContent = text;
    },

    flash: function (sel) {
      var el = screenEl.querySelector(sel);
      if (!el) return;
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    },

    /* 실제 앱과 같이 탭바 바로 위, 수달 아이콘이 붙은 토스트 */
    toast: function (text, ms) {
      toastEl.innerHTML = '<img src="assets/otter-down-right.png" alt="">' + text;
      toastEl.classList.remove('hidden');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.classList.add('hidden'); }, ms || 2200);
    },

    /* FCM 결제 안내 푸시 */
    headsup: function (on) {
      headsupEl.classList.toggle('show', !!on);
    },

    restart: function () {
      this.stopTrack();
      this._track = null;
      this.headsup(false);
      play();
    }
  };

  /* ─── 시계 ─── */
  function tickClock() {
    var el = document.querySelector('[data-clock]');
    if (!el) return;
    var d = new Date();
    el.textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ─── 재생 ─── */
  var timers = [];
  function stop() { timers.forEach(clearTimeout); timers = []; }
  function play() {
    stop();
    O.buildScript(app).forEach(function (step) {
      timers.push(setTimeout(step.fn, step.t));
    });
  }

  /* 화면 전환 때 깜빡이지 않도록 지도 이미지를 미리 받아 둔다 */
  function preload() {
    var files = ['pick-gumi', 'pick-sangam', 'dest-6', 'route-2', 'search', 'approach', 'ride', 'zoom', 'done-loading', 'done-paid'];
    files.forEach(function (f) { new Image().src = 'assets/maps/' + f + '.jpg'; });
    ['keyboard.png', 'otter-up.png', 'otter-up-right.png', 'otter-up-left.png', 'otter-down.png',
      'otter-down-left.png', 'otter-down-right.png'].forEach(function (f) { new Image().src = 'assets/' + f; });
  }

  /* ─── 부트 ─── */
  var tokens = (location.hash || '').replace('#', '').split('+').filter(Boolean);
  var isKiosk = tokens.indexOf('kiosk') !== -1;
  var isAuto = tokens.indexOf('autoplay') !== -1 || isKiosk;

  if (isKiosk) {
    document.body.classList.add('kiosk');
    document.documentElement.classList.add('kiosk');
  }

  document.querySelector('[data-sbicons]').innerHTML = O.statusIcons();
  tickClock();
  setInterval(tickClock, 20000);
  preload();

  app.go('home');

  if (isAuto) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          play();
          obs.disconnect();
        });
      }, { threshold: 0.05 });
      io.observe(document.getElementById('phone1'));
      /* 임베드 iframe은 교차 판정이 늦을 수 있어 안전망 */
      setTimeout(function () { if (!timers.length) play(); }, 1200);
    } else {
      play();
    }
  }

  window.ORA_APP = app;
})();
