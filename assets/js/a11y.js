/* Accessibility toolbar — bottom-left button + panel. Settings persist per browser. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, KEY = 'nyp-a11y';
  var SIZES = [1, 1.12, 1.25, 1.37, 1.5];
  var OPTIONS = [
    ['contrast', 'High contrast', 'contrast'],
    ['gray', 'Grayscale', 'drop'],
    ['links', 'Highlight links', 'underline'],
    ['font', 'Readable font', 'font'],
    ['spacing', 'Text spacing', 'spacing'],
    ['lines', 'Line height', 'lines'],
    ['cursor', 'Big cursor', 'cursor'],
    ['still', 'Stop animations', 'pause'],
    ['noimg', 'Hide images', 'noimg'],
    ['guide', 'Reading guide', 'guide']
  ];
  var state = { fs: 0 };
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved && typeof saved === 'object') state = saved; } catch (e) {}

  function icon(name) { return '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>'; }

  /* ---- Build UI ---- */
  var fab = d.createElement('button');
  fab.type = 'button';
  fab.className = 'a11y-fab';
  fab.setAttribute('aria-label', 'Accessibility options');
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', 'a11y-panel');
  fab.innerHTML = icon('access');

  var panel = d.createElement('div');
  panel.id = 'a11y-panel';
  panel.className = 'a11y-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'a11y-title');
  var opts = OPTIONS.map(function (o) {
    return '<button type="button" class="a11y-opt" data-opt="' + o[0] + '" aria-pressed="false">' + icon(o[2]) + '<span>' + o[1] + '</span></button>';
  }).join('');
  panel.innerHTML =
    '<div class="a11y-head"><h2 id="a11y-title">Accessibility</h2>' +
    '<button type="button" class="a11y-x" aria-label="Close accessibility options">' + icon('x') + '</button></div>' +
    '<div class="a11y-body">' +
    '<div class="a11y-size" role="group" aria-label="Text size"><span>Text size</span><div class="ctl">' +
    '<button type="button" data-fs="-1" aria-label="Decrease text size">A&minus;</button>' +
    '<output aria-live="polite">100%</output>' +
    '<button type="button" data-fs="1" aria-label="Increase text size">A+</button></div></div>' +
    '<div class="a11y-grid">' + opts + '</div>' +
    '<div class="a11y-foot"><button type="button" class="a11y-reset">' + icon('reset') + 'Reset all</button>' +
    '<a href="https://www.boons.io/accessibility-statement" target="_blank" rel="noopener">Accessibility statement<span class="sr-only"> (opens in a new tab)</span></a></div>' +
    '</div>';

  var guide = d.createElement('div');
  guide.className = 'a11y-guide';
  guide.hidden = true;
  guide.setAttribute('aria-hidden', 'true');

  d.body.appendChild(guide);
  d.body.appendChild(panel);
  d.body.appendChild(fab);

  var out = panel.querySelector('output');

  /* ---- Apply ---- */
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function apply() {
    var fs = Math.max(0, Math.min(SIZES.length - 1, state.fs | 0));
    state.fs = fs;
    root.style.setProperty('--a11y-fs', SIZES[fs]);
    out.textContent = Math.round(SIZES[fs] * 100) + '%';
    OPTIONS.forEach(function (o) {
      var on = !!state[o[0]];
      root.classList.toggle('a11y-' + o[0], on);
      var b = panel.querySelector('[data-opt="' + o[0] + '"]');
      if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    guide.hidden = !state.guide;
    try { window.dispatchEvent(new CustomEvent('a11y:change')); } catch (e) {}
  }

  /* ---- Events ---- */
  function open() {
    panel.hidden = false; fab.setAttribute('aria-expanded', 'true');
    var first = panel.querySelector('.a11y-x'); if (first) first.focus();
  }
  function close(returnFocus) {
    panel.hidden = true; fab.setAttribute('aria-expanded', 'false');
    if (returnFocus) fab.focus();
  }
  fab.addEventListener('click', function () { panel.hidden ? open() : close(true); });
  panel.querySelector('.a11y-x').addEventListener('click', function () { close(true); });
  panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(true); } });
  d.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !fab.contains(e.target)) close(false);
  });
  panel.querySelectorAll('[data-fs]').forEach(function (b) {
    b.addEventListener('click', function () { state.fs = (state.fs | 0) + parseInt(b.getAttribute('data-fs'), 10); apply(); save(); });
  });
  panel.querySelectorAll('[data-opt]').forEach(function (b) {
    b.addEventListener('click', function () { var k = b.getAttribute('data-opt'); state[k] = !state[k]; apply(); save(); });
  });
  panel.querySelector('.a11y-reset').addEventListener('click', function () { state = { fs: 0 }; apply(); save(); });

  function moveGuide(y) { guide.style.top = y + 'px'; }
  d.addEventListener('mousemove', function (e) { if (state.guide) moveGuide(e.clientY); }, { passive: true });
  d.addEventListener('touchmove', function (e) { if (state.guide && e.touches[0]) moveGuide(e.touches[0].clientY); }, { passive: true });
  moveGuide(window.innerHeight / 2);

  apply();
})();
