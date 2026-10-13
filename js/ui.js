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
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v.01M18 14.5v.01"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9"/><path d="M10 13h4"/>',
    box: '<path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z"/><path d="m4 7 8 4 8-4M12 11v10"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tasks: '<rect x="3.5" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="16.5" y="4" width="4" height="13" rx="1"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 10.5a3.8 3.8 0 0 1-.3 7.5H7Z"/>',
    plug: '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0V8Z"/><path d="M12 17v4"/>',
    swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    left: '<path d="m14 6-6 6 6 6"/>',
    right: '<path d="m10 6 6 6-6 6"/>',
    up: '<path d="m6 14 6-6 6 6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 16a5 5 0 0 1 6.4 0"/><path d="M12 19.5v.01"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
    nfc: '<path d="M6 8c2.5 2.7 2.5 5.3 0 8M10 6c4 3.7 4 8.3 0 12M14 4c5.5 4.7 5.5 11.3 0 16"/>',
    print2: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7Z"/>'
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
