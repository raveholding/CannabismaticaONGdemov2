/* Cannabismatica I+D · Sistema ONG (demo v2) · interfaz: íconos, modales, avisos, impresión */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc;
  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 5a3.5 3.5 0 0 1 0 7"/><path d="M18 14c2.2.6 3.5 2.5 3.5 6"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7.5 15h9"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20Z"/>',
    shield: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4"/><path d="M12 16V8"/><path d="M16 16v-6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    drive: '<path d="m8 3 8 0 5 9-4 7H7l-4-7 5-9Z"/><path d="m8 3 8.5 15M16 3 7.5 18M3 12h18"/>',
    doc: '<path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 12h6M9 16h6"/>',
    alert: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v5M12 18v.01"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/>',
    dl: '<path d="M12 4v11M7 11l5 5 5-5"/><path d="M4 20h16"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'
  };
  CM.icon = function (n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>'; };

  /* ---------- avisos ---------- */
  var toastT;
  CM.toast = function (msg, bad) {
    var r = document.getElementById('toastRoot');
    r.innerHTML = '<div class="toast' + (bad ? ' bad' : '') + '">' + esc(msg) + '</div>';
    clearTimeout(toastT);
    toastT = setTimeout(function () { r.innerHTML = ''; }, 3600);
  };

  /* ---------- modal único ---------- */
  var lastFocus = null, onCloseCb = null;
  CM.modal = {
    el: function () { return document.querySelector('#modalRoot .md'); },
    isOpen: function () { return !!document.querySelector('#modalRoot .ov'); },
    open: function (o) {
      CM.modal.close(true);
      lastFocus = document.activeElement;
      onCloseCb = o.onClose || null;
      var root = document.getElementById('modalRoot');
      root.innerHTML = '<div class="ov" data-act="modal-bg"><div class="md' + (o.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="mdT">' +
        '<header><h2 id="mdT">' + esc(o.title) + '</h2><button type="button" class="x" data-act="modal-close" aria-label="Cerrar">×</button></header>' +
        '<div class="bd">' + o.body + '</div>' + (o.footer ? '<footer>' + o.footer + '</footer>' : '') + '</div></div>';
      var first = root.querySelector('.md .bd input:not([readonly]):not([type=hidden]),.md .bd select,.md .bd textarea,.md .bd button');
      var f = o.focus ? root.querySelector(o.focus) : first;
      if (f) setTimeout(function () { try { f.focus(); } catch (e) { /* nada */ } }, 30);
    },
    close: function (silent) {
      var root = document.getElementById('modalRoot');
      if (!root.firstChild) return;
      root.innerHTML = '';
      var cb = onCloseCb; onCloseCb = null;
      if (!silent) {
        if (cb) cb();
        if (lastFocus && document.contains(lastFocus)) { try { lastFocus.focus(); } catch (e) { /* nada */ } }
      }
    }
  };

  /* ---------- impresión (documentos y etiquetas) ---------- */
  CM.imprimir = function (html) {
    var pa = document.getElementById('printArea');
    pa.innerHTML = html;
    document.body.classList.add('printing');
    var done = function () { document.body.classList.remove('printing'); pa.innerHTML = ''; g.removeEventListener('afterprint', done); };
    g.addEventListener('afterprint', done);
    setTimeout(function () { try { g.print(); } catch (e) { done(); } }, 60);
    setTimeout(function () { if (document.body.classList.contains('printing')) done(); }, 60000);
  };

  /* ---------- QR (biblioteca qrcode-generator, MIT) ---------- */
  CM.qrSvg = function (texto) {
    try {
      var q = g.qrcode(0, 'M');
      q.addData(String(texto));
      q.make();
      return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (e) { return '<svg viewBox="0 0 10 10"></svg>'; }
  };

  /* ---------- acciones por delegación ---------- */
  CM.acts = {}; CM.forms = {};
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-act]');
    if (!t) return;
    var n = t.getAttribute('data-act');
    if (n === 'modal-bg') { if (ev.target === t) CM.modal.close(); return; }
    if (n === 'modal-close') { CM.modal.close(); return; }
    var fn = CM.acts[n];
    if (fn) { ev.preventDefault(); fn(t, ev); }
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target.closest('form[data-form]');
    if (!f) return;
    ev.preventDefault();
    var fn = CM.forms[f.getAttribute('data-form')];
    if (fn && document.body.contains(f)) fn(f, ev);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && CM.modal.isOpen()) { CM.modal.close(); return; }
    if (ev.key === 'Tab' && CM.modal.isOpen()) {
      var md = CM.modal.el();
      var f = md.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),a[href]');
      if (!f.length) return;
      var a = f[0], b = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === a) { ev.preventDefault(); b.focus(); }
      else if (!ev.shiftKey && document.activeElement === b) { ev.preventDefault(); a.focus(); }
    }
  });
  // Campos numéricos: nunca arrancan con "0"; al entrar queda todo seleccionado (también con mouse)
  var selNext = false;
  document.addEventListener('focusin', function (ev) {
    if (ev.target.classList && ev.target.classList.contains('num')) { selNext = true; ev.target.select(); }
  });
  document.addEventListener('mouseup', function (ev) {
    if (selNext && ev.target.classList && ev.target.classList.contains('num')) { ev.preventDefault(); ev.target.select(); }
    selNext = false;
  });
})(window);
