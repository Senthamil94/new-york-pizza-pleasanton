/* New York Pizza Pleasanton — site interactions */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function still() { return reduceMQ.matches || root.classList.contains('a11y-still'); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); }

  /* ---------- Open / closed status (Pacific Time) ---------- */
  // minutes from midnight: [open, close]; 0 = Sunday
  var HOURS = { 0: [600, 1350], 1: [600, 1350], 2: [600, 1350], 3: [600, 1350], 4: [600, 1350], 5: [600, 1410], 6: [600, 1410] };
  function fmt(min) {
    var h = Math.floor(min / 60) % 24, m = min % 60, ap = h >= 12 ? 'PM' : 'AM', hh = h % 12 || 12;
    return hh + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + ap;
  }
  function nowPT() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[o.weekday], min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) { var n = new Date(); return { day: n.getDay(), min: n.getHours() * 60 + n.getMinutes() }; }
  }
  function getStatus() {
    var t = nowPT(), h = HOURS[t.day];
    if (t.min >= h[0] && t.min < h[1]) {
      return { open: true, text: (h[1] - t.min <= 45 ? 'Closing soon · until ' : 'Open now · until ') + fmt(h[1]) };
    }
    if (t.min < h[0]) return { open: false, text: 'Closed · opens today ' + fmt(h[0]) };
    return { open: false, text: 'Closed · opens tomorrow ' + fmt(HOURS[(t.day + 1) % 7][0]) };
  }
  function paintStatus() {
    var s = getStatus(), t = nowPT();
    $all('[data-open-status]').forEach(function (el) {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      var txt = el.querySelector('.status-text'); if (txt) txt.textContent = s.text;
    });
    $all('[data-day]').forEach(function (el) {
      var days = el.getAttribute('data-day').split(',').map(Number);
      el.classList.toggle('is-today', days.indexOf(t.day) > -1);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- Header shadow ---------- */
  var header = d.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile drawer ---------- */
  var drawer = d.getElementById('drawer');
  var openBtn = d.querySelector('[data-drawer-open]');
  if (drawer && openBtn) {
    var closeBtn = drawer.querySelector('[data-drawer-close]');
    var focusables = function () { return $all('a[href], button:not([disabled])', drawer); };
    var onKey = function (e) {
      if (e.key === 'Escape') { closeDrawer(); return; }
      if (e.key === 'Tab') {
        var f = focusables(), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    var openDrawer = function () {
      drawer.classList.add('is-open');
      drawer.removeAttribute('inert');
      openBtn.setAttribute('aria-expanded', 'true');
      root.classList.add('no-scroll');
      d.addEventListener('keydown', onKey);
      setTimeout(function () { closeBtn.focus(); }, 60);
    };
    var closeDrawer = function () {
      drawer.classList.remove('is-open');
      drawer.setAttribute('inert', '');
      openBtn.setAttribute('aria-expanded', 'false');
      root.classList.remove('no-scroll');
      d.removeEventListener('keydown', onKey);
      openBtn.focus();
    };
    openBtn.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    $all('a', drawer).forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('href').charAt(0) === '#') closeDrawer(); }); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && drawer.classList.contains('is-open')) closeDrawer(); });
  }

  /* ---------- Hero slider ---------- */
  // load the remaining hero slides once the page is ready
  function loadDeferred() {
    $all('img[data-src]').forEach(function (im) {
      if (im.getAttribute('data-srcset')) im.srcset = im.getAttribute('data-srcset');
      im.src = im.getAttribute('data-src');
      im.removeAttribute('data-src'); im.removeAttribute('data-srcset');
    });
  }
  if (d.readyState === 'complete') setTimeout(loadDeferred, 200);
  else window.addEventListener('load', function () { setTimeout(loadDeferred, 200); });

  $all('[data-slider]').forEach(function (sl) {
    var slides = $all('.slide', sl), dots = $all('.dot', sl);
    var pauseBtn = sl.querySelector('[data-pause]');
    var i = 0, timer = null, playing = true, held = false, DUR = 6500;
    if (slides.length < 2) return;
    sl.style.setProperty('--dur', DUR + 'ms');

    function setPauseUI() {
      if (!pauseBtn) return;
      pauseBtn.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
      pauseBtn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-' + (playing ? 'pause' : 'play') + '"></use></svg>';
    }
    function schedule() {
      clearTimeout(timer);
      sl.classList.remove('is-ticking');
      void sl.offsetWidth; // restart progress animation
      if (playing && !held && !still() && !d.hidden) {
        sl.classList.add('is-ticking');
        timer = setTimeout(function () { go(i + 1); }, DUR);
      }
    }
    function go(n) {
      n = (n + slides.length) % slides.length;
      if (n !== i) {
        slides[i].classList.remove('is-active');
        slides[i].setAttribute('aria-hidden', 'true');
        dots[i] && dots[i].removeAttribute('aria-current');
        i = n;
        slides[i].classList.add('is-active');
        slides[i].removeAttribute('aria-hidden');
        dots[i] && dots[i].setAttribute('aria-current', 'true');
      }
      schedule();
    }
    dots.forEach(function (dot, k) { dot.addEventListener('click', function () { go(k); }); });
    var prev = sl.querySelector('[data-prev]'), next = sl.querySelector('[data-next]');
    prev && prev.addEventListener('click', function () { go(i - 1); });
    next && next.addEventListener('click', function () { go(i + 1); });
    pauseBtn && pauseBtn.addEventListener('click', function () { playing = !playing; setPauseUI(); schedule(); });

    // hover / focus holds the slideshow
    sl.addEventListener('mouseenter', function () { held = true; clearTimeout(timer); sl.classList.add('is-hold'); });
    sl.addEventListener('mouseleave', function () { held = false; sl.classList.remove('is-hold'); schedule(); });
    sl.addEventListener('focusin', function () { held = true; clearTimeout(timer); sl.classList.add('is-hold'); });
    sl.addEventListener('focusout', function (e) { if (!sl.contains(e.relatedTarget)) { held = false; sl.classList.remove('is-hold'); schedule(); } });

    // keyboard
    sl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(i - 1); }
      if (e.key === 'ArrowRight') { go(i + 1); }
    });

    // swipe
    var sx = null, sy = null;
    var vp = sl.querySelector('.hero-viewport') || sl;
    vp.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    vp.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? i + 1 : i - 1);
      sx = sy = null;
    }, { passive: true });

    d.addEventListener('visibilitychange', schedule);
    window.addEventListener('a11y:change', schedule);
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', schedule);
    setPauseUI();
    schedule();
  });

  /* ---------- Horizontal rails ---------- */
  $all('[data-rail-prev], [data-rail-next]').forEach(function (btn) {
    var rail = d.getElementById(btn.getAttribute('aria-controls'));
    if (!rail) return;
    var dir = btn.hasAttribute('data-rail-prev') ? -1 : 1;
    btn.addEventListener('click', function () {
      var item = rail.firstElementChild;
      var w = item ? item.getBoundingClientRect().width + 16 : 300;
      var n = Math.max(1, Math.floor(rail.clientWidth / w));
      rail.scrollBy({ left: dir * w * n, behavior: still() ? 'auto' : 'smooth' });
    });
  });
  $all('.rail[id]').forEach(function (rail) {
    var p = d.querySelector('[data-rail-prev][aria-controls="' + rail.id + '"]');
    var n = d.querySelector('[data-rail-next][aria-controls="' + rail.id + '"]');
    if (!p && !n) return;
    function upd() {
      var max = rail.scrollWidth - rail.clientWidth - 4;
      if (p) p.disabled = rail.scrollLeft <= 4;
      if (n) n.disabled = rail.scrollLeft >= max;
    }
    rail.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = $all('[data-reveal]');
  if ('IntersectionObserver' in window && !still()) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Footer year ---------- */
  $all('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
