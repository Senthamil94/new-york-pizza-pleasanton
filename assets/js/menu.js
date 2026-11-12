/* Menu experience: one category at a time, swipe / tabs / search / filters, dish bottom-sheet. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var list = d.querySelector('[data-cat-list]');
  if (!list) return;

  var tabs = Array.prototype.slice.call(list.querySelectorAll('.cat-chip'));
  var panels = tabs.map(function (t) { return d.getElementById(t.getAttribute('data-cat')); });
  var main = d.getElementById('menu-main');
  var nav = d.querySelector('.cat-nav');
  var header = d.querySelector('.site-header');
  var results = d.getElementById('menu-results');
  var resultsGrid = d.getElementById('results-grid');
  var resultsTitle = d.getElementById('results-title');
  var emptyBox = d.getElementById('results-empty');
  var input = d.getElementById('menu-search');
  var clearBtn = d.querySelector('.search-clear');
  var filters = Array.prototype.slice.call(d.querySelectorAll('[data-filter]'));
  var allDishes = Array.prototype.slice.call(d.querySelectorAll('.cat-panel .dish'));
  var current = -1;

  function still() {
    return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || root.classList.contains('a11y-still');
  }
  function isDesktop() { return window.innerWidth >= 1024; }

  /* ---- ARIA tabs ---- */
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Menu categories');
  list.setAttribute('aria-orientation', isDesktop() ? 'vertical' : 'horizontal');
  Array.prototype.forEach.call(list.children, function (li) { li.setAttribute('role', 'presentation'); });
  tabs.forEach(function (t, k) {
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', panels[k].id);
    t.setAttribute('aria-selected', 'false');
    t.setAttribute('tabindex', '-1');
    panels[k].setAttribute('role', 'tabpanel');
    panels[k].setAttribute('aria-labelledby', t.id);
    panels[k].hidden = true;
  });

  function scrollChip(t) {
    if (isDesktop()) { try { t.scrollIntoView({ block: 'nearest' }); } catch (e) {} return; }
    if (list.scrollWidth <= list.clientWidth) return;
    var left = t.parentNode.offsetLeft - (list.clientWidth - t.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, left), behavior: still() ? 'auto' : 'smooth' });
  }
  function menuTop() {
    var hh = header ? header.offsetHeight : 0;
    var nh = !isDesktop() && nav ? nav.offsetHeight : 0;
    return main.getBoundingClientRect().top + window.scrollY - hh - nh - (isDesktop() ? 24 : 8);
  }
  function scrollToMenu(force) {
    var top = menuTop();
    if (force || window.scrollY > top + 4) window.scrollTo({ top: Math.max(0, top), behavior: still() ? 'auto' : 'smooth' });
  }

  function show(k, opts) {
    opts = opts || {};
    if (k < 0 || k >= tabs.length) return;
    var dir = k > current ? 'enter-next' : 'enter-prev';
    if (current > -1) {
      panels[current].hidden = true;
      panels[current].classList.remove('enter-next', 'enter-prev');
      tabs[current].setAttribute('aria-selected', 'false');
      tabs[current].setAttribute('tabindex', '-1');
    }
    current = k;
    var p = panels[k], t = tabs[k];
    if (results.hidden) p.hidden = false;
    t.setAttribute('aria-selected', 'true');
    t.setAttribute('tabindex', '0');
    if (!still() && opts.animate !== false) { void p.offsetWidth; p.classList.add(dir); }
    scrollChip(t);
    if (opts.hash !== false && window.history && history.replaceState) history.replaceState(null, '', '#' + p.id);
    if (opts.scroll) scrollToMenu(opts.force);
    if (opts.focus) t.focus();
  }
  function indexOfId(id) {
    for (var k = 0; k < panels.length; k++) if (panels[k].id === id) return k;
    return -1;
  }

  tabs.forEach(function (t, k) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      resetSearch(true);
      show(k, { scroll: true });
    });
  });
  list.addEventListener('keydown', function (e) {
    var k = current;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') k = 0;
    else if (e.key === 'End') k = tabs.length - 1;
    else return;
    e.preventDefault();
    resetSearch(true);
    show(k, { focus: true });
  });
  window.addEventListener('resize', function () { list.setAttribute('aria-orientation', isDesktop() ? 'vertical' : 'horizontal'); });

  // "Up next" / "Previous" pager links
  main.addEventListener('click', function (e) {
    var a = e.target.closest('[data-go]');
    if (!a) return;
    var k = indexOfId(a.getAttribute('data-go'));
    if (k < 0) return;
    e.preventDefault();
    show(k, { scroll: true, force: true });
  });

  // Swipe left / right between categories (touch)
  var sx = null, sy = null, st = 0;
  main.addEventListener('touchstart', function (e) {
    if (!results.hidden) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
  }, { passive: true });
  main.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = sy = null;
    if (Date.now() - st > 700) return;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      var k = current + (dx < 0 ? 1 : -1);
      if (k >= 0 && k < tabs.length) show(k, { scroll: true });
    }
  }, { passive: true });

  /* ---- Search + filters ---- */
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function activeFilters() {
    return filters.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return b.getAttribute('data-filter'); });
  }
  function resetSearch(silent) {
    if (input) input.value = '';
    filters.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    if (!silent) run(); else hideResults();
  }
  function hideResults() {
    results.hidden = true;
    if (clearBtn) clearBtn.hidden = true;
    if (current > -1) panels[current].hidden = false;
  }
  function run() {
    var raw = input ? input.value.trim() : '';
    var q = norm(raw);
    var f = activeFilters();
    if (clearBtn) clearBtn.hidden = !raw;
    if (!q && !f.length) { hideResults(); return; }
    panels.forEach(function (p) { p.hidden = true; });
    var words = q ? q.split(/\s+/) : [];
    var matches = allDishes.filter(function (li) {
      var b = li.querySelector('[data-dish]');
      var hay = norm(b.getAttribute('data-name') + ' ' + b.getAttribute('data-desc') + ' ' + b.getAttribute('data-cat'));
      for (var w = 0; w < words.length; w++) if (hay.indexOf(words[w]) === -1) return false;
      var tags = (b.getAttribute('data-tags') || '').split(' ');
      var price = parseFloat(b.getAttribute('data-price'));
      for (var j = 0; j < f.length; j++) {
        if (f[j] === 'under10') { if (!(price < 10)) return false; }
        else if (tags.indexOf(f[j]) === -1) return false;
      }
      return true;
    });
    resultsGrid.innerHTML = '';
    matches.forEach(function (li) {
      var c = li.cloneNode(true);
      c.classList.remove('dish--feature');
      var body = c.querySelector('.dish-body');
      var cat = d.createElement('span');
      cat.className = 'dish-cat';
      cat.textContent = c.querySelector('[data-dish]').getAttribute('data-cat');
      body.insertBefore(cat, body.firstChild);
      resultsGrid.appendChild(c);
    });
    var n = matches.length;
    resultsTitle.textContent = n + (n === 1 ? ' dish' : ' dishes') + (raw ? ' for “' + raw + '”' : '');
    emptyBox.hidden = n !== 0;
    resultsGrid.hidden = n === 0;
    results.hidden = false;
  }
  var t;
  if (input) {
    input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 120); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; run(); } });
    var form = input.closest('form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault(); run();
      if (!results.hidden) scrollToMenu(true);
      input.blur();
    });
  }
  if (clearBtn) clearBtn.addEventListener('click', function () { input.value = ''; run(); input.focus(); });
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      run();
    });
  });
  Array.prototype.forEach.call(d.querySelectorAll('[data-reset-search]'), function (b) {
    b.addEventListener('click', function () { resetSearch(false); scrollToMenu(); });
  });
  var sb = d.querySelector('[data-search-focus]');
  if (sb && input) sb.addEventListener('click', function () {
    var top = input.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) - 24;
    window.scrollTo({ top: Math.max(0, top), behavior: still() ? 'auto' : 'smooth' });
    setTimeout(function () { input.focus({ preventScroll: true }); }, still() ? 0 : 350);
  });

  /* ---- Dish detail dialog ---- */
  var dlg = d.getElementById('dish-dialog');
  var TAGS = { fan: ['tag-fan', 'Fan favorite'], halal: ['tag-halal', 'Halal'], crowd: ['tag-crowd', 'Feeds 4–5'], deal: ['tag-deal', 'Deal'] };
  function openDish(b) {
    if (!dlg) return;
    var name = b.getAttribute('data-name');
    var img = d.getElementById('dd-img');
    img.src = b.getAttribute('data-img');
    img.alt = name;
    d.getElementById('dd-cat').textContent = b.getAttribute('data-cat');
    d.getElementById('dd-name').textContent = name;
    d.getElementById('dd-desc').textContent = b.getAttribute('data-desc');
    d.getElementById('dd-price').textContent = '$' + b.getAttribute('data-price');
    var was = b.getAttribute('data-was');
    d.getElementById('dd-was').innerHTML = was ? '<span class="sr-only">Regular price </span>$' + was : '';
    var tagBox = d.getElementById('dd-tags');
    tagBox.innerHTML = '';
    (b.getAttribute('data-tags') || '').split(' ').forEach(function (k) {
      if (!TAGS[k]) return;
      var s = d.createElement('span'); s.className = 'tag ' + TAGS[k][0]; s.textContent = TAGS[k][1]; tagBox.appendChild(s);
    });
    var order = d.getElementById('dd-order');
    order.setAttribute('aria-label', 'Order ' + name + ' online (opens in a new tab)');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    root.classList.add('no-scroll');
  }
  main.addEventListener('click', function (e) {
    var b = e.target.closest('[data-dish]');
    if (b) openDish(b);
  });
  if (dlg) {
    var closeDlg = function () { if (typeof dlg.close === 'function') dlg.close(); else { dlg.removeAttribute('open'); root.classList.remove('no-scroll'); } };
    dlg.addEventListener('close', function () { root.classList.remove('no-scroll'); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDlg(); });
    Array.prototype.forEach.call(dlg.querySelectorAll('[data-dd-close]'), function (b) { b.addEventListener('click', closeDlg); });
    var dy0 = null;
    var grab = dlg.querySelector('.dd-img');
    grab.addEventListener('touchstart', function (e) { dy0 = e.touches[0].clientY; }, { passive: true });
    grab.addEventListener('touchend', function (e) {
      if (dy0 !== null && e.changedTouches[0].clientY - dy0 > 80) closeDlg();
      dy0 = null;
    }, { passive: true });
  }

  /* ---- Initial state ---- */
  function fromHash(scroll) {
    var id = (location.hash || '').slice(1);
    var k = id ? indexOfId(id) : -1;
    if (k > -1) { show(k, { hash: false, animate: false, scroll: scroll, force: true }); return true; }
    return false;
  }
  if (fromHash(false)) {
    // wait for layout (fonts/images) before aligning the chosen category under the sticky bars
    var align = function () { scrollToMenu(true); };
    setTimeout(align, 60);
    window.addEventListener('load', align);
  } else {
    show(0, { hash: false, animate: false });
  }
  window.addEventListener('hashchange', function () { resetSearch(true); fromHash(true); });
  root.classList.add('menu-ready');
})();
