/* Sistema VB ONG · Legajo completo del paciente: carpeta en Drive + fila en la hoja de legajos + estado de los formularios
   - Cada paciente nuevo (por el formulario público, el alta del club, la historia clínica o el ingreso breve) queda con su legajo único.
   - Con el Drive de la ONG conectado, el sistema crea sola la carpeta «Legajos/{legajo}_{DNI}» y la fila del legajo en la hoja «Legajos · {ONG}».
   - Google exige que una persona de la ONG autorice el acceso desde el navegador: si nadie lo hizo todavía, los legajos quedan «pendientes»
     y se procesan todos juntos con un solo botón. Los datos clínicos NO van a la hoja: sólo identificación, estado de formularios y enlace a la carpeta.
   - Nunca pisa ni duplica: carpeta y hoja se buscan por clave propia; cada legajo es una única fila. */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, D = CM._drv;
  if (!D) return;
  var SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
  var MIME_HOJA = 'application/vnd.google-apps.spreadsheet';
  var JSONH = { 'Content-Type': 'application/json' };
  var COLS = ['Legajo', 'Fecha de alta', 'Apellido y nombre', 'Documento', 'Teléfono', 'Nacimiento', 'Origen', 'REPROCANN', 'Formulario de ingreso', 'Historia clínica', 'Carpeta del legajo', 'Actualizado'];
  var est = { busy: false, msg: '', bad: false };
  var cola = Promise.resolve(), hojaCache = null, timer = null;
  var DRIVE_EJEMPLO = 'https://drive.google.com/drive/my-drive';

  /* ---------- estado de los formularios del legajo ---------- */
  CM.legajoForms = function (p) {
    var f = [];
    if (!p.nac) f.push('fecha de nacimiento'); if (!p.tel) f.push('teléfono'); if (!p.email) f.push('correo'); if (!p.dir) f.push('domicilio'); if (!p.consentimiento) f.push('consentimiento informado');
    var ing = f.length ? { k: 'pend', t: 'Sin completar', falt: f } : { k: 'ok', t: 'Completo', falt: [] };
    var hc = p.historiaCompleta ? (p.revisar ? { k: 'rev', t: 'Completa · por verificar' } : { k: 'ok', t: 'Completa y verificada' }) : { k: 'pend', t: 'Sin completar' };
    return { ing: ing, hc: hc };
  };
  function linkCarpeta(p) { return p.drive1 && p.drive1 !== DRIVE_EJEMPLO ? p.drive1 : ''; }
  function celda(v) { v = String(v == null ? '' : v); return /^[=+\-@]/.test(v) ? "'" + v : v; }
  function fila(p) {
    var fm = CM.legajoForms(p), dc = CM.docPac ? CM.docPac(p) : null, rep = CM.estadoRep ? CM.estadoRep(p.reprocann) : null;
    return [p.leg, p.alta || '', p.nombre, dc ? dc.tipo + ' ' + dc.num : 'Sin documento', p.tel || '', p.nac || '', p.origen || '', rep ? rep.t || rep.k || '' : '',
      fm.ing.t + (fm.ing.falt.length ? ' (falta: ' + fm.ing.falt.join(', ') + ')' : ''), fm.hc.t, linkCarpeta(p), ''].map(celda);
  }
  function huella(p) { var f = fila(p); f[11] = ''; return CM.sha256(JSON.stringify(f)).slice(0, 12); }
  function sinCarpeta(p) { return !p.driveId && !linkCarpeta(p); }
  function sinHoja(p) { return p.hojaH !== huella(p); }
  CM.legajoPend = function () {
    return Object.keys(CM.db.pacientes).map(function (k) { return CM.db.pacientes[k]; }).filter(function (p) { return p.leg && (sinCarpeta(p) || sinHoja(p)); });
  };

  /* ---------- hoja de legajos en el Drive de la ONG ---------- */
  function hoja() {
    if (hojaCache) return Promise.resolve(hojaCache);
    return D.carpeta('legajos-raiz', 'Legajos').then(function (raiz) {
      return D.listar("mimeType='" + MIME_HOJA + "' and trashed=false and appProperties has { key='vbongKey' and value='legajos-hoja' }").then(function (r) {
        if (r.files && r.files.length) return r.files[0];
        var nom = 'Legajos · ' + String((CM.db.ong && CM.db.ong.nombre) || 'Fundación').slice(0, 80);
        return D.api(D.API + '?fields=id,name,webViewLink', { method: 'POST', headers: JSONH, body: JSON.stringify({ name: nom, mimeType: MIME_HOJA, parents: [raiz.id], appProperties: { vbongKey: 'legajos-hoja', vbong: '1' } }) }).then(function (h) {
          return D.api(SHEETS + '/' + encodeURIComponent(h.id) + '/values/A1:L1?valueInputOption=RAW', { method: 'PUT', headers: JSONH, body: JSON.stringify({ values: [COLS] }) }).then(function () { return h; });
        });
      });
    }).then(function (h) { hojaCache = h; if (h.webViewLink && CM.db.ong) CM.db.ong.hojaLegajos = h.webViewLink; return h; });
  }
  function upsert(h, p) {
    var f = fila(p); f[11] = new Date().toISOString().slice(0, 16).replace('T', ' ');
    var base = SHEETS + '/' + encodeURIComponent(h.id) + '/values/';
    return D.api(base + 'A:A').then(function (r) {
      var v = r.values || [], i = -1, k;
      for (k = 1; k < v.length; k++) if (v[k][0] === p.leg) { i = k; break; }
      if (i < 0) return D.api(base + 'A:L:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', { method: 'POST', headers: JSONH, body: JSON.stringify({ values: [f] }) });
      var n = i + 1;
      return D.api(base + 'A' + n + ':L' + n + '?valueInputOption=RAW', { method: 'PUT', headers: JSONH, body: JSON.stringify({ values: [f] }) });
    });
  }

  /* ---------- crear carpeta + fila (un legajo) ---------- */
  function prov(p) {
    return D.asegurar().then(function () {
      if (!sinCarpeta(p)) return null;
      return CM.driveCarpetaPaciente(p).then(function (cf) { if (!linkCarpeta(p)) p.drive1 = 'https://drive.google.com/drive/folders/' + cf.id; });
    }).then(function () { return hoja(); }).then(function (h) {
      var hh = huella(p);
      return upsert(h, p).then(function () { p.hojaH = hh; p.hojaTs = new Date().toISOString(); CM.audit('Legajo en Drive y hoja', 'Legajo ' + p.leg); CM.save(); });
    });
  }
  CM.legajoProvisionar = function (p) { var pr = cola.then(function () { return prov(p); }); cola = pr.catch(function () { }); return pr; };

  function procesar(lista) {
    var ok = 0, mal = 0, ult = '';
    return lista.reduce(function (pr, p) {
      return pr.then(function () { return CM.legajoProvisionar(p).then(function () { ok++; }, function (e) { mal++; ult = (e && e.message) || ''; }); });
    }, Promise.resolve()).then(function () { return { ok: ok, mal: mal, ult: ult }; });
  }
  function auto() {
    timer = null;
    if (!D.conectado() || est.busy || !CM.db || !CM.db.pacientes) return;
    var l = CM.legajoPend(); if (!l.length) return;
    est.busy = true;
    procesar(l.slice(0, 25)).then(function (r) { est.busy = false; if (r.mal) est.msg = 'No se pudieron procesar ' + r.mal + ' legajo(s). ' + r.ult; if (CM.render) CM.render(); });
  }
  function programar() { if (!timer) timer = setTimeout(auto, 1500); }
  setInterval(function () { if (D.conectado() && !est.busy && CM.db && CM.db.pacientes && CM.legajoPend().length) programar(); }, 15000);

  /* todo paciente nuevo, venga de donde venga, nace con legajo; si el Drive está conectado se procesa solo */
  var nuevo0 = CM.nuevoPaciente;
  CM.nuevoPaciente = function (o) { var p = nuevo0(o); if (D.conectado()) programar(); return p; };

  /* ---------- pantallas ---------- */
  function pillDrive() {
    var cid = !!(CM.db.ong && CM.db.ong.driveClientId);
    if (CM.driveModo && CM.driveModo() === 'servidor') return '<span class="pill p-ok">Drive automático (servidor)</span>';
    return !cid ? '<span class="pill p-warn">Drive pendiente de configuración</span>' : D.conectado() ? '<span class="pill p-ok">Drive conectado</span>' : '<span class="pill">Drive sin conectar</span>';
  }
  CM.legajoBanner = function () {
    var pacs = Object.keys(CM.db.pacientes).map(function (k) { return CM.db.pacientes[k]; }), pend = CM.legajoPend();
    var sc = pacs.filter(sinCarpeta).length, ni = 0, nh = 0;
    pacs.forEach(function (p) { var f = CM.legajoForms(p); if (f.ing.k !== 'ok') ni++; if (f.hc.k === 'pend') nh++; });
    var oper = CM.can('pacientes', 'oper'), cid = !!(CM.db.ong && CM.db.ong.driveClientId);
    var hojaUrl = CM.db.ong && CM.db.ong.hojaLegajos && /^https:\/\//.test(CM.db.ong.hojaLegajos) ? CM.db.ong.hojaLegajos : '';
    return '<section class="card" style="margin-bottom:14px"><div class="row sp"><h2 style="margin:0">Legajos: carpetas y formularios</h2>' + pillDrive() + '</div>' +
      '<div class="row" style="margin-top:8px"><span class="pill ' + (sc ? 'p-warn' : 'p-ok') + '">' + sc + ' sin carpeta</span><span class="pill ' + (ni ? 'p-warn' : 'p-ok') + '">' + ni + ' con ingreso sin completar</span><span class="pill ' + (nh ? 'p-warn' : 'p-ok') + '">' + nh + ' con historia clínica sin completar</span></div>' +
      '<p class="hint" style="margin:8px 0">Cada paciente que completa el formulario de ingreso queda con un legajo único. Con el Drive de la ONG conectado, el sistema crea su carpeta (<b>Legajos/legajo_DNI</b>) y su fila en la hoja de legajos. Los datos clínicos no se copian a la hoja.</p>' +
      (est.msg ? '<div class="note ' + (est.bad ? 'bad' : 'ok') + '" role="status">' + esc(est.msg) + '</div>' : '') +
      '<div class="row">' + (oper ? '<button class="btn pri" data-act="legajo-lote"' + (est.busy || !pend.length ? ' disabled' : '') + '>' + CM.icon('drive') + (D.conectado() ? 'Procesar ' : 'Conectar Drive y procesar ') + pend.length + ' legajo(s) pendiente(s)</button>' : '') +
      (hojaUrl ? '<a class="btn" href="' + esc(hojaUrl) + '" target="_blank" rel="noopener noreferrer">' + CM.icon('link') + 'Abrir la hoja de legajos</a>' : '') + '</div>' +
      '<p class="hint" style="margin:8px 0 0">' + (CM.driveModo && CM.driveModo() === 'servidor' ? 'Las carpetas se crean solas con la cuenta de servicio de la ONG: nadie tiene que conectar nada en ningún equipo.' :
        'Por ahora la conexión con Google Drive es manual: una persona de la ONG toca «Conectar» y el permiso dura la sesión de ese equipo' + (cid ? '.' : ' (falta cargar el Client ID de Google en Trazabilidad → Planilla de cultivo).') + ' Con la cuenta de servicio de la ONG las carpetas se crearán solas y nadie tendrá que conectar nada.') + '</p></section>';
  };
  CM.legajoFormsHtml = function (p) {
    var f = CM.legajoForms(p), cls = { ok: 'p-ok', rev: 'p-info', pend: 'p-warn' };
    var urlH = CM.db.ong && CM.db.ong.urlHistoria && /^https:\/\//.test(CM.db.ong.urlHistoria) ? CM.db.ong.urlHistoria : '';
    var hojaTxt = p.hojaTs && p.hojaH === huella(p) ? '<span class="pill p-ok">En la hoja de legajos</span>' : '<span class="pill p-warn">Hoja pendiente de actualizar</span>';
    return '<section class="card" style="margin-top:14px"><div class="row sp"><h3 style="margin:0">Formularios del legajo</h3>' + hojaTxt + '</div><div class="kv" style="margin-top:10px">' +
      '<div><b>Formulario de ingreso</b><br><span class="pill ' + cls[f.ing.k] + '">' + esc(f.ing.t) + '</span>' + (f.ing.falt.length ? '<br><small class="hint">Falta: ' + esc(f.ing.falt.join(', ')) + '</small>' : '') + '</div>' +
      '<div><b>Historia clínica</b><br><span class="pill ' + cls[f.hc.k] + '">' + esc(f.hc.t) + '</span>' + (f.hc.k === 'pend' ? '<br><small class="hint">Se completa desde el botón «Completar historia clínica».</small>' : '') + '</div></div>' +
      (urlH ? '<p style="margin:10px 0 0"><a class="btn sm" href="' + esc(urlH) + '" target="_blank" rel="noopener noreferrer">Abrir formulario de historia</a></p>' : '') + '</section>';
  };
  CM.acts['legajo-lote'] = function () {
    if (!CM.need('pacientes', 'oper') || est.busy) return;
    if (!(CM.db.ong && CM.db.ong.driveClientId)) { est = { busy: false, msg: 'Pendiente de configuración: un administrador tiene que cargar el Client ID de Google de la ONG.', bad: true }; return CM.render(); }
    var l = CM.legajoPend(); if (!l.length) return;
    est = { busy: true, msg: 'Procesando ' + l.length + ' legajo(s)…', bad: false }; CM.render();
    D.asegurar().then(function () { return procesar(l); }).then(function (r) {
      est = { busy: false, bad: r.mal > 0, msg: r.ok + ' legajo(s) con carpeta y fila en la hoja.' + (r.mal ? ' ' + r.mal + ' con error: ' + r.ult : '') };
    }).catch(function (e) { est = { busy: false, bad: true, msg: (e && e.message) || 'No se pudo conectar con Google.' }; }).then(function () { CM.render(); });
  };
})(window);
