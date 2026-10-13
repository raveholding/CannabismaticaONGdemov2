/* Cannabismatica I+D · Sistema ONG (demo v2) · Nube, Periféricos y ticket, Importar/Exportar, Integraciones, Usuarios y permisos, Auditoría, Configuración */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, $ = U.$, fl = U.fl, opt = U.opt, fail = U.fail, VIEWS = CM.VIEWS;
  var render = function () { CM.render(); };
  function money(c) { return CM.fmtMoney(c); }
  function pageH(t, p, extra) { return '<div class="page-h"><div><h1>' + esc(t) + '</h1><p>' + p + '</p></div>' + (extra || '') + '</div>'; }
  function tabs(items, cur, act) {
    return '<div class="tabs" role="group">' + items.map(function (i) { return '<button type="button" data-act="' + act + '" data-v="' + esc(i[0]) + '" aria-pressed="' + (i[0] === cur) + '">' + i[1] + '</button>'; }).join('') + '</div>';
  }
  function estPill(k) {
    return { pend: '<span class="pill p-warn">Pendiente de configuración</span>', manual: '<span class="pill p-ok">Activo (manual)</span>', sim: '<span class="pill p-info">Simulación</span>', fis: '<span class="pill p-mu">Pendiente de prueba física</span>', nd: '<span class="pill p-mu">No disponible en la demo</span>', ok: '<span class="pill p-ok">Disponible</span>', no: '<span class="pill p-mu">No disponible</span>' }[k];
  }

  /* ---------- selector de rol (simulación) ---------- */
  CM.rolSel = function () {
    var s = $('#rolSel'); if (!s || !CM.db) return;
    s.innerHTML = Object.keys(CM.ROLES).map(function (k) { return opt(k, 'Rol: ' + CM.ROLES[k], CM.db.cfg.rol === k); }).join('');
  };
  document.addEventListener('change', function (ev) {
    if (ev.target.id !== 'rolSel') return;
    CM.db.cfg.rol = ev.target.value; CM.audit('Cambio de rol (simulación)', 'Rol activo: ' + CM.ROLES[ev.target.value]); CM.save(); render(); CM.toast('Rol activo: ' + CM.ROLES[ev.target.value] + '.');
  });

  /* ===================================================================
     NUBE
     =================================================================== */
  VIEWS.nube = function () {
    var db = CM.db;
    return pageH('Nube', 'Sincronización entre equipos y respaldo. En esta demo <b>no hay nube conectada</b>: todo vive en este navegador.') +
      '<div class="note warn" style="margin-bottom:14px"><b>Estado: ' + 'pendiente de configuración.</b> El sistema funciona sin conexión; al conectar la nube, los cambios locales se suben solos.</div>' +
      '<div class="grid g3"><div class="card kpi"><div class="l">Conexión con la nube</div><div class="v" style="font-size:1.2rem;padding:6px 0">' + estPill('pend') + '</div><div class="s">Sin proyecto conectado</div></div>' +
      '<div class="card kpi"><div class="l">Cambios locales registrados</div><div class="v">' + db.audit.length + '</div><div class="s">Se subirían al conectar (cola local)</div></div>' +
      '<div class="card kpi"><div class="l">Modo de trabajo</div><div class="v" style="font-size:1.2rem;padding:6px 0"><span class="pill p-ok">Sin conexión</span></div><div class="s">Datos guardados en este navegador</div></div></div>' +
      '<div class="grid g2" style="margin-top:14px"><section class="card"><h2>Qué se necesita para activarla (sistema real)</h2><ul class="tl">' +
      ['Proyecto en la nube (un proyecto para todas las organizaciones, aisladas por servidor)', 'Esquema de base de datos con permisos por organización (RLS) y pruebas cruzadas entre dos organizaciones', 'Ingreso con correo y contraseña; recuperación de clave con código', 'Respaldos automáticos del proveedor y restauración probada', 'Sincronización entre equipos cada pocos segundos, con cola si no hay internet'].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="hint">Esto lo configura Rave Holding con la organización; los secretos nunca viajan en el navegador.</p></section>' +
      '<section class="card"><h2>Respaldo local (funciona hoy)</h2><p style="color:var(--mu)">Descargá una copia de todos los datos de esta demo y restaurala cuando quieras. En el sistema real el respaldo va cifrado.</p><div class="row"><button class="btn pri" data-act="bk-bajar">' + CM.icon('dl') + 'Descargar respaldo (JSON)</button><label class="btn" for="bkFile" style="cursor:pointer">' + CM.icon('undo') + 'Restaurar desde un respaldo</label><input type="file" id="bkFile" accept=".json,application/json" class="sr"></div>' +
      '<div class="note info" style="margin-top:12px">Este respaldo de la demo no está cifrado. Contiene datos ficticios.</div></section></div>';
  };
  CM.acts['bk-bajar'] = function () {
    CM.audit('Respaldo local', 'Descarga de respaldo JSON'); CM.save();
    CM.descargar('respaldo_cannabismatica_demo_' + CM.hoy() + '.json', JSON.stringify(CM.db), 'application/json');
  };
  document.addEventListener('change', function (ev) {
    if (ev.target.id !== 'bkFile' || !ev.target.files[0]) return;
    if (!CM.need('nube', 'admin')) { ev.target.value = ''; return; }
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var o = JSON.parse(fr.result);
        if (!o || o.v !== 2 || typeof o.pacientes !== 'object' || !Array.isArray(o.lotes) || !Array.isArray(o.movs) || !Array.isArray(o.audit)) throw new Error('forma');
        CM.pendBk = o;
        CM.modal.open({ title: 'Restaurar respaldo', body: '<p>El archivo es válido: ' + Object.keys(o.pacientes).length + ' pacientes, ' + o.lotes.length + ' lotes. Se reemplazan los datos actuales de esta demo.</p>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn bad" data-act="bk-ok">Sí, restaurar</button>' });
      } catch (e) { CM.toast('Ese archivo no es un respaldo válido de esta demo.', true); }
    };
    fr.readAsText(ev.target.files[0]); ev.target.value = '';
  });
  CM.acts['bk-ok'] = function () {
    if (!CM.pendBk) return;
    var o = CM.pendBk; CM.pendBk = null;
    if (!o.cajas || !o.menu) CM.seedExt(o);
    CM.db = o; CM.audit('Respaldo restaurado', 'Datos reemplazados desde un archivo'); CM.save(); CM.modal.close(true); g.location.hash = '#/inicio'; render(); CM.toast('Respaldo restaurado.');
  };

  /* ===================================================================
     PERIFÉRICOS Y TICKET
     =================================================================== */
  CM.per2 = { doc: 'prueba', ancho: '80' };
  var HAL = [
    ['printer_thermal', 'Impresora térmica de tickets (ESC/POS, 58 y 80 mm)', 'USB · Serie · red (TCP 9100) · Bluetooth · impresora de Windows'],
    ['printer_a4', 'Impresora A4 / láser', 'Driver de Windows o PDF'],
    ['printer_label', 'Impresora de etiquetas (ZPL / EPL)', 'USB · red · driver de Windows'],
    ['scanner', 'Lector de código de barras / QR', 'Modo teclado (sin configuración) o serie'],
    ['scale', 'Balanza (peso estable en vivo)', 'Serie / USB; el protocolo depende de la marca [VERIFICAR]'],
    ['nfc_reader', 'Lector NFC', 'USB (PC/SC) en Windows · Web NFC en Android'],
    ['fingerprint_reader', 'Lector de huellas', 'Según SDK del modelo; requiere revisión legal [VERIFICAR]'],
    ['cash_drawer', 'Cajón de dinero', 'Pulso desde la impresora térmica'],
    ['display', 'Pantalla del paciente / segunda pantalla', 'Segunda ventana del navegador']
  ];
  function caps() {
    var n = g.navigator;
    return [['Impresión del navegador', 'print' in g], ['WebUSB', 'usb' in n], ['Web Serial', 'serial' in n], ['Web Bluetooth', 'bluetooth' in n], ['Web NFC', 'NDEFReader' in g], ['Cámara (lectura de QR)', !!(n.mediaDevices && n.mediaDevices.getUserMedia)]];
  }
  function pad(s, w) { s = String(s); return s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length); }
  function lr(a, b, w) { a = String(a); b = String(b); return a.length + b.length + 1 > w ? a.slice(0, Math.max(0, w - b.length - 1)) + ' ' + b : a + ' '.repeat(w - a.length - b.length) + b; }
  function ctr(s, w) { s = String(s).slice(0, w); var l = Math.floor((w - s.length) / 2); return ' '.repeat(l) + s; }
  function wrap(s, w) { var out = [], line = ''; String(s).split(/\s+/).forEach(function (p) { if ((line + ' ' + p).trim().length > w) { out.push(line); line = p; } else line = (line + ' ' + p).trim(); }); if (line) out.push(line); return out; }
  function sinTilde(s) { return CM.norm(s).toUpperCase(); }
  function ticketTexto(doc, w) {
    var db = CM.db, c = w === 58 ? 32 : 42, L = [], rule = '-'.repeat(c), o = db.ong;
    L.push(ctr(sinTilde('Fundacion Cannabismatica I+D'), c), ctr(o.domicilio.slice(0, c), c), rule);
    if (doc === 'aporte') {
      var a = db.aportes.slice().sort(function (x, y) { return y.ts.localeCompare(x.ts); })[0];
      if (!a) return 'Sin aportes para imprimir.';
      L.push(ctr('COMPROBANTE DE APORTE VOLUNTARIO', c).slice(0, c), ctr('NO VALIDO COMO FACTURA', c), rule, 'N.: ' + a.id, 'Fecha: ' + CM.fmtFecha(a.fecha), 'Paciente DNI: ' + a.dni, 'Concepto: ' + sinTilde(a.concepto), 'Medio: ' + sinTilde(CM.MEDIOS[a.medio] || a.medio), rule, lr('APORTE', money(a.cent), c), rule);
      L.push.apply(L, wrap('Aporte voluntario, no es pago de un servicio. Documento interno de demostracion.', c));
    } else if (doc === 'disp') {
      var d = db.disp.filter(function (x) { return !x.anulada; }).sort(function (x, y) { return y.ts.localeCompare(x.ts); })[0];
      if (!d) return 'Sin dispensaciones para imprimir.';
      L.push(ctr('ENTREGA DE PREPARADO', c), rule, 'N.: ' + d.id, 'Fecha: ' + CM.fmtFecha(d.fecha), 'Paciente DNI: ' + d.dni, 'Lote: ' + d.lote, sinTilde(d.nombre).slice(0, c), lr('Cantidad', CM.fmtNum(d.cant) + ' ' + d.unidad, c), rule);
      L.push.apply(L, wrap('Uso bajo indicacion medica. Conserve el producto fuera del alcance de menores.', c));
    } else if (doc === 'cierre') {
      var cj = db.cajas.filter(function (x) { return x.cierre; }).pop();
      if (!cj) return 'Sin cajas cerradas para imprimir.';
      var x = cj.cierre;
      L.push(ctr('CIERRE DE CAJA ' + cj.id, c), rule, 'Fecha: ' + CM.fmtFecha(x.fecha), lr('Fondo inicial', money(x.inicial), c), lr('Ingresos', money(x.ingresos), c), lr('Egresos', money(x.egresos), c), lr('Esperado', money(x.esperadoEf), c), lr('Declarado', money(x.declaradoEf), c), lr('Diferencia', money(x.dif), c), rule, 'Sello: ' + x.hash.slice(0, 16));
    } else {
      L.push(ctr('TICKET DE PRUEBA', c), rule, 'Ancho: ' + w + ' mm (' + c + ' caracteres)', 'Acentos y enie: a e i o u n', 'Importe de ejemplo: ' + money(1234567), rule, ctr('Si lo ves completo, ancho OK', c));
    }
    L.push(rule, ctr('Desarrollado por Rave Holding', c), ctr('+54 9 387 514-3900', c));
    return L.join('\n');
  }
  VIEWS.perifericos = function () {
    var f = CM.per2, w = +f.ancho;
    return pageH('Periféricos y ticket', 'Dispositivos conectables y vista previa del ticket. <b>Ningún dispositivo físico fue probado todavía</b>: figuran como «pendiente de prueba física».') +
      '<section class="card"><h2>Qué permite este navegador</h2><div class="kv">' + caps().map(function (c) { return '<div><small>' + esc(c[0]) + '</small><b>' + (c[1] ? 'Disponible' : 'No disponible aquí') + '</b></div>'; }).join('') + '</div><p class="hint">Disponible no significa probado: falta hacerlo con cada modelo real. Los datos que vuelven de un dispositivo se validan antes de usarse.</p></section>' +
      '<div class="grid g2" style="margin-top:14px"><section class="card"><h2>Ticket</h2><div class="f f2">' + fl('Documento', '<select id="pfDoc" class="in">' + opt('prueba', 'Ticket de prueba', f.doc === 'prueba') + opt('aporte', 'Último aporte voluntario', f.doc === 'aporte') + opt('disp', 'Última entrega de preparado', f.doc === 'disp') + opt('cierre', 'Último cierre de caja', f.doc === 'cierre') + '</select>') + fl('Ancho de papel', '<select id="pfAn" class="in">' + opt('58', '58 mm', f.ancho === '58') + opt('80', '80 mm', f.ancho === '80') + '</select>') + '</div>' +
      '<div class="tkwrap"><pre class="tk tk' + f.ancho + '" aria-label="Vista previa del ticket">' + esc(ticketTexto(f.doc, w)) + '</pre></div><div class="row" style="margin-top:12px"><button class="btn pri" data-act="tk-print">' + CM.icon('print') + 'Imprimir ticket</button></div><p class="hint">Imprime con el diálogo del navegador (impresora del sistema). La impresión directa ESC/POS, el corte y la apertura de cajón requieren la impresora real o un agente local: <b>pendiente de prueba física</b>.</p></section>' +
      '<section class="card"><h2>Facturación (ARCA)</h2><div class="kv"><div><small>Factura C</small><b>Simulador sin validez fiscal</b></div><div><small>Pedido automático de CAE</small><b>Pendiente de configuración</b></div></div><div class="note warn" style="margin-top:12px">Para emitir con CAE real hacen falta el certificado digital de la ONG y los servicios WSAA/WSFE de ARCA, probados en homologación <b>[VERIFICAR en arca.gob.ar y con el contador]</b>. Hoy los comprobantes de la demo dicen «sin validez fiscal».</div></section></div>' +
      '<section class="card" style="margin-top:14px"><h2>Tipos de dispositivo</h2><div class="tw"><table><thead><tr><th>Tipo</th><th>Conexión posible</th><th>Estado</th></tr></thead><tbody>' + HAL.map(function (h) { return '<tr><td><b>' + esc(h[1]) + '</b><br><small class="hint">' + esc(h[0]) + '</small></td><td>' + esc(h[2]) + '</td><td>' + estPill('fis') + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
  };
  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'pfDoc') { CM.per2.doc = ev.target.value; render(); } else if (ev.target.id === 'pfAn') { CM.per2.ancho = ev.target.value; render(); }
  });
  CM.acts['tk-print'] = function () { CM.imprimir('<pre class="tk tkp tk' + CM.per2.ancho + '">' + esc(ticketTexto(CM.per2.doc, +CM.per2.ancho)) + '</pre>'); };

  /* ===================================================================
     IMPORTAR / EXPORTAR
     =================================================================== */
  var EXPORTS = [
    ['pacientes', 'Pacientes', true], ['disp', 'Dispensaciones', false], ['aportes', 'Aportes voluntarios', false], ['comps', 'Comprobantes simulados', false], ['lotes', 'Lotes y stock', false], ['movs', 'Movimientos de stock', false],
    ['cajas', 'Cajas cerradas', false], ['menuitems', 'Talleres y servicios del menú', false], ['personal', 'Personal', true], ['fichas', 'Fichadas', false], ['sellos', 'Sellos', false], ['memb', 'Membresías', false], ['insumos', 'Insumos', false]
  ];
  function m2(v) { return (v / 100).toFixed(2).replace('.', ','); }
  function datosExport(k) {
    var db = CM.db;
    switch (k) {
      case 'pacientes': return [['DNI', 'Nombre', 'Telefono', 'Email', 'Nacimiento', 'Domicilio', 'REPROCANN', 'Vence', 'Historia completa', 'Consentimiento'], Object.keys(db.pacientes).map(function (d) { var p = db.pacientes[d], r = CM.estadoRep(p.reprocann); return [p.dni, p.nombre, p.tel, p.email, p.nac, p.dir, CM.REP_LABEL[r.k], p.reprocann.vence || '', p.historiaCompleta ? 'Si' : 'No', p.consentimiento || '']; })];
      case 'disp': return [['Id', 'Fecha', 'DNI', 'Lote', 'Preparado', 'Cantidad', 'Unidad', 'Anulada'], db.disp.map(function (d) { return [d.id, d.fecha, d.dni, d.lote, d.nombre, d.cant, d.unidad, d.anulada ? 'Si' : 'No']; })];
      case 'aportes': return [['Id', 'Fecha', 'DNI', 'Concepto', 'Medio', 'Importe', 'Estado', 'Factura C'], db.aportes.map(function (a) { var c = a.comp ? CM.comp(a.comp) : null; return [a.id, a.fecha, a.dni, a.concepto, CM.MEDIOS[a.medio] || a.medio, m2(a.cent), a.estado, c ? c.pv + '-' + c.nro : '']; })];
      case 'comps': return [['Tipo', 'Numero', 'Fecha', 'DNI', 'Importe', 'Anulado', 'Simulado'], db.comps.map(function (c) { return [c.tipo, c.pv + '-' + c.nro, c.fecha, c.dni, m2(c.cent), c.anulado ? 'Si' : 'No', 'Si (sin validez fiscal)']; })];
      case 'lotes': return [['Lote', 'Preparado', 'Tipo', 'Quimiotipo', 'Unidad', 'Stock', 'Minimo'], db.lotes.map(function (l) { return [l.id, l.nombre, CM.PRODUCTOS[l.prod].n, l.quim, l.unidad, CM.stockLote(l.id), l.min]; })];
      case 'movs': return [['Id', 'Fecha', 'Lote', 'Tipo', 'Cantidad', 'Referencia', 'Motivo'], db.movs.map(function (m) { return [m.id, m.fecha, m.lote, m.tipo, m.cant, m.ref, m.motivo]; })];
      case 'cajas': return [['Caja', 'Fecha', 'Cerro', 'Ingresos', 'Egresos', 'Esperado', 'Declarado', 'Diferencia', 'Sello'], db.cajas.filter(function (c) { return c.cierre; }).map(function (c) { var x = c.cierre; return [c.id, x.fecha, x.user, m2(x.ingresos), m2(x.egresos), m2(x.esperadoEf), m2(x.declaradoEf), m2(x.dif), x.hash]; })];
      case 'personal': return [['Id', 'Nombre', 'DNI', 'Cargo', 'Area', 'Activo'], db.staff.map(function (e) { return [e.id, e.nombre, e.dni, e.cargo, e.area, e.activo ? 'Si' : 'No']; })];
      case 'fichas': return [['Persona', 'Fecha', 'Tipo', 'Fecha y hora', 'Metodo'], db.fichas.map(function (x) { return [x.emp, x.fecha, x.tipo, x.ts, x.metodo]; })];
      case 'sellos': return [['Id', 'Fecha', 'DNI', 'Tipo', 'Cantidad', 'Motivo'], db.sellos.map(function (s) { return [s.id, s.fecha, s.dni, s.tipo, s.cant, s.motivo]; })];
      case 'memb': return [['Id', 'DNI', 'Plan', 'Desde', 'Pagada hasta', 'Estado'], db.membresias.map(function (m) { return [m.id, m.dni, m.plan, m.desde, m.pagadoHasta, CM.estadoMemb(m)]; })];
      case 'menuitems': return [['Nombre', 'Rubro', 'Descripcion', 'Aporte sugerido', 'Name', 'Description', 'Duracion', 'Incluye'], db.menu.draft.items.map(function (i) { return [i.es.n, i.cat, i.es.d, m2(i.cent), i.en ? i.en.n : '', i.en ? i.en.d : '', i.dur ? i.dur.es : '', i.inc ? i.inc.es.split('\n').join('; ') : '']; })];
      default: return [['Id', 'Insumo', 'Unidad', 'Minimo'], db.insumos.map(function (i) { return [i.id, i.n, i.unidad, i.min]; })];
    }
  }
  CM.acts['exp-uno'] = function (t) {
    if (!CM.need('importexport', 'oper')) return;
    var k = t.getAttribute('data-v'), def = EXPORTS.filter(function (e) { return e[0] === k; })[0];
    function go() { var d = datosExport(k); CM.audit('Exportación', def[1] + ' · ' + d[1].length + ' filas'); CM.save(); CM.descargar(k + '_' + CM.hoy() + '.csv', CM.csv(d[0], d[1])); }
    if (def[2]) { CM.modal.open({ title: 'Datos personales', body: '<p>Vas a exportar <b>' + esc(def[1]) + '</b>, que incluye datos personales. Usalos sólo para la finalidad de la fundación y guardalos de forma segura (Ley 25.326 <b>[VERIFICAR]</b>).</p>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" data-act="exp-ok" data-v="' + k + '">Entiendo, exportar</button>' }); return; }
    go();
  };
  CM.acts['exp-ok'] = function (t) {
    var k = t.getAttribute('data-v'), d = datosExport(k); CM.audit('Exportación', k + ' · ' + d[1].length + ' filas · datos personales'); CM.save(); CM.modal.close(true); CM.descargar(k + '_' + CM.hoy() + '.csv', CM.csv(d[0], d[1]));
  };
  var CAMPOS_PAC = [['dni', 'DNI', true, ['dni', 'documento', 'nro documento', 'numero de documento']], ['nombre', 'Nombre y apellido', true, ['nombre', 'nombre y apellido', 'apellido y nombre', 'paciente', 'socio']], ['tel', 'Teléfono', false, ['telefono', 'tel', 'celular', 'whatsapp', 'movil']], ['email', 'Correo', false, ['email', 'correo', 'mail', 'e-mail']], ['nac', 'Nacimiento', false, ['nacimiento', 'fecha de nacimiento', 'fecha nac', 'nac']], ['dir', 'Domicilio', false, ['domicilio', 'direccion']], ['cons', 'Consentimiento (Sí/No)', false, ['consentimiento', 'acepta', 'consiente']]];
  function fechaISO(s) {
    s = String(s || '').trim(); if (!s) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) || null, y, mo, d;
    if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; } else {
      m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/.exec(s); if (!m) { if (/^\d{5}$/.test(s)) { var dt = new Date(Date.UTC(1899, 11, 30) + (+s) * 864e5); return dt.toISOString().slice(0, 10); } return null; }
      d = +m[1]; mo = +m[2]; y = +m[3]; if (y < 100) y += y > 30 ? 1900 : 2000;
    }
    var t = new Date(Date.UTC(y, mo - 1, d)); if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
    var iso = t.toISOString().slice(0, 10); return iso > CM.hoy() ? null : iso;
  }
  function numAR(s) { s = String(s == null ? '' : s).trim(); if (!s) return null; var v = CM.parseCant ? CM.parseCant(s) : parseFloat(s.replace(',', '.')); return isNaN(v) ? NaN : v; }
  function catMenu(txt) {
    var d = CM.db.menu.draft, n = CM.norm(txt || ''); if (!n) return 'servicios';
    var c = d.cats.filter(function (x) { return CM.norm(x.id) === n || CM.norm(x.es) === n || CM.norm(x.en) === n; })[0]; return c ? c.id : null;
  }
  function proxId(pref, arr) { var mx = 0; arr.forEach(function (x) { var m = new RegExp('^' + pref + '(\\d+)$').exec(x.id); if (m) mx = Math.max(mx, +m[1]); }); return pref + (mx + 1); }
  /* cada entidad define sus columnas, validación, alta/actualización y reversión */
  var ENT = {
    pacientes: {
      label: 'Pacientes', unidad: 'paciente(s)', perm: 'importexport', personal: true,
      campos: CAMPOS_PAC, plantilla: [['DNI', 'Nombre y apellido', 'Telefono', 'Email', 'Fecha de nacimiento', 'Domicilio', 'Consentimiento'], [['99000100', 'Ejemplo Uno', '3875000100', 'ejemplo1@example.com', '15/03/1980', 'Salta, Capital', 'Si']]],
      parse: function (g1) {
        var er = [], dni = CM.soloDigitos(g1('dni')), nom = g1('nombre').replace(/\s+/g, ' '), tel = CM.soloDigitos(g1('tel')), nac = fechaISO(g1('nac')), em = g1('email');
        if (dni.length < 6 || dni.length > 9) er.push('DNI inválido'); if (nom.length < 3) er.push('Falta el nombre');
        if (g1('tel') && (tel.length < 8 || tel.length > 13)) er.push('Teléfono inválido');
        if (g1('nac') && nac === null) er.push('Fecha de nacimiento inválida');
        if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) er.push('Correo inválido');
        return { er: er, id: dni, o: { dni: dni, nombre: nom, tel: tel, email: em, nac: nac || '', dir: g1('dir'), cons: /^(si|sí|s|1|true|yes|x)$/i.test(g1('cons')) } };
      },
      existe: function (id) { return !!CM.paciente(id); },
      snap: function (id) { return JSON.parse(JSON.stringify(CM.paciente(id))); },
      crear: function (o) { CM.db.pacientes[o.dni] = { dni: o.dni, nombre: o.nombre, nac: o.nac, tel: o.tel, email: o.email, dir: o.dir, cp: '', obraSocial: '', ocupacion: '', motivo: '', dudas: '', codSeg: '', historiaCompleta: false, consentimiento: '', consImport: o.cons ? 'Sí (según archivo)' : 'No', reprocann: { estado: 'sin', vence: null, carnet: false }, alta: CM.hoy(), drive1: '', drive2: '', importada: true }; return o.dni; },
      actualizar: function (id, o) { var p = CM.paciente(id); if (o.nombre) p.nombre = o.nombre; if (o.tel) p.tel = o.tel; if (o.email) p.email = o.email; if (o.nac) p.nac = o.nac; if (o.dir) p.dir = o.dir; },
      restaurar: function (id, prev) { CM.db.pacientes[id] = prev; },
      quitar: function (id) { delete CM.db.pacientes[id]; },
      bloqueo: function (id) { return CM.dispDe(id).length || CM.aportesDe(id).length ? 'ya hay dispensaciones o aportes de pacientes de este lote' : ''; },
      aviso: function (a) { return 'Quienes no traen consentimiento quedan con consentimiento «No» (la opción más restrictiva: no reciben mensajes). Cantidad en esa situación: <b>' + a.nuevos.concat(a.act).filter(function (x) { return !x.cons; }).length + '</b> (Ley 25.326 <b>[VERIFICAR]</b>). Los pacientes importados quedan con la historia clínica pendiente.'; }
    },
    personal: {
      label: 'Personal', unidad: 'persona(s)', perm: 'importexport', personal: true,
      campos: [['nombre', 'Nombre y apellido', true, ['nombre', 'nombre y apellido', 'apellido y nombre', 'persona', 'empleado']], ['dni', 'DNI', true, ['dni', 'documento']], ['cargo', 'Cargo', false, ['cargo', 'puesto', 'funcion']], ['area', 'Área', false, ['area', 'sector', 'equipo']], ['tel', 'Teléfono', false, ['telefono', 'tel', 'celular', 'whatsapp']]],
      plantilla: [['Nombre y apellido', 'DNI', 'Cargo', 'Area', 'Telefono'], [['Ejemplo Persona', '99100100', 'Voluntariado', 'Talleres y educación', '3875100100']]],
      parse: function (g1) {
        var er = [], dni = CM.soloDigitos(g1('dni')), nom = g1('nombre').replace(/\s+/g, ' ');
        if (dni.length < 6 || dni.length > 9) er.push('DNI inválido'); if (nom.length < 3) er.push('Falta el nombre');
        return { er: er, id: dni, o: { dni: dni, nombre: nom, cargo: g1('cargo'), area: g1('area'), tel: CM.soloDigitos(g1('tel')) } };
      },
      existe: function (id) { return CM.db.staff.some(function (e) { return e.dni === id; }); },
      snap: function (id) { return JSON.parse(JSON.stringify(CM.db.staff.filter(function (e) { return e.dni === id; })[0])); },
      crear: function (o) { var e = { id: proxId('E', CM.db.staff), nombre: o.nombre, dni: o.dni, cargo: o.cargo, area: o.area, tel: o.tel, activo: true }; CM.db.staff.push(e); return e.dni; },
      actualizar: function (id, o) { var e = CM.db.staff.filter(function (x) { return x.dni === id; })[0]; if (o.nombre) e.nombre = o.nombre; if (o.cargo) e.cargo = o.cargo; if (o.area) e.area = o.area; if (o.tel) e.tel = o.tel; },
      restaurar: function (id, prev) { var i = CM.db.staff.findIndex(function (x) { return x.dni === id; }); CM.db.staff[i] = prev; },
      quitar: function (id) { CM.db.staff = CM.db.staff.filter(function (x) { return x.dni !== id; }); },
      bloqueo: function (id) { var e = CM.db.staff.filter(function (x) { return x.dni === id; })[0]; return e && CM.db.fichas.some(function (f) { return f.emp === e.id; }) ? 'ya hay fichadas de personas de este lote' : ''; },
      aviso: function () { return 'Las personas importadas quedan activas, sin tarjeta emitida (se emite desde Personal y fichaje).'; }
    },
    insumos: {
      label: 'Insumos de inventario', unidad: 'insumo(s)', perm: 'inventario',
      campos: [['nombre', 'Insumo', true, ['insumo', 'nombre', 'articulo', 'producto', 'descripcion']], ['unidad', 'Unidad', false, ['unidad', 'um']], ['min', 'Stock mínimo', false, ['minimo', 'stock minimo', 'min']], ['stock', 'Stock inicial', false, ['stock', 'cantidad', 'existencia', 'saldo', 'stock inicial']], ['rubro', 'Rubro de inventario', false, ['rubro', 'categoria', 'familia']]],
      plantilla: [['Insumo', 'Unidad', 'Stock minimo', 'Stock inicial', 'Rubro'], [['Bolsas de papel', 'u', '50', '200', 'Material de talleres']]],
      parse: function (g1) {
        var er = [], nom = g1('nombre').replace(/\s+/g, ' '), mn = numAR(g1('min')), st = numAR(g1('stock'));
        if (nom.length < 2) er.push('Falta el nombre del insumo');
        if (mn !== null && (isNaN(mn) || mn < 0)) er.push('Stock mínimo inválido'); if (st !== null && (isNaN(st) || st < 0)) er.push('Stock inicial inválido');
        return { er: er, id: CM.norm(nom), o: { nombre: nom, unidad: g1('unidad') || 'u', min: mn || 0, stock: st || 0, rubro: g1('rubro') } };
      },
      existe: function (id) { return CM.db.insumos.some(function (x) { return CM.norm(x.n) === id; }); },
      snap: function (id) { return JSON.parse(JSON.stringify(CM.db.insumos.filter(function (x) { return CM.norm(x.n) === id; })[0])); },
      crear: function (o) {
        var rb = CM.db.irubros.filter(function (r) { return CM.norm(r.n) === CM.norm(o.rubro); })[0] || CM.db.irubros[0];
        var x = { id: proxId('IN-', CM.db.insumos), rubro: rb.id, n: o.nombre, unidad: o.unidad, min: o.min, activo: true, importado: true }; CM.db.insumos.push(x);
        if (o.stock > 0) CM.db.imovs.push({ id: CM.nextId('IM'), ins: x.id, fecha: CM.hoy(), ts: new Date().toISOString(), cant: o.stock, motivo: 'Saldo inicial (importación)', user: CM.db.cfg.operador, imp: true });
        return CM.norm(o.nombre);
      },
      actualizar: function (id, o) { var x = CM.db.insumos.filter(function (y) { return CM.norm(y.n) === id; })[0]; if (o.unidad) x.unidad = o.unidad; if (o.min) x.min = o.min; },
      restaurar: function (id, prev) { var i = CM.db.insumos.findIndex(function (y) { return CM.norm(y.n) === id; }); CM.db.insumos[i] = prev; },
      quitar: function (id) { var x = CM.db.insumos.filter(function (y) { return CM.norm(y.n) === id; })[0]; if (!x) return; CM.db.imovs = CM.db.imovs.filter(function (m) { return m.ins !== x.id; }); CM.db.insumos = CM.db.insumos.filter(function (y) { return y !== x; }); },
      bloqueo: function (id) { var x = CM.db.insumos.filter(function (y) { return CM.norm(y.n) === id; })[0]; return x && CM.db.imovs.some(function (m) { return m.ins === x.id && !m.imp; }) ? 'ya hay movimientos de stock de insumos de este lote' : ''; },
      aviso: function () { return 'Si el rubro no existe, el insumo entra en el primer rubro de inventario. El stock inicial queda como movimiento «Saldo inicial (importación)».'; }
    },
    menu: {
      label: 'Talleres, cursos y servicios del menú público', unidad: 'ítem(s) del menú', perm: 'menu',
      campos: [['nombre', 'Nombre', true, ['nombre', 'titulo', 'actividad', 'servicio', 'taller', 'curso']], ['cat', 'Rubro del menú', false, ['rubro', 'categoria', 'tipo']], ['desc', 'Descripción', false, ['descripcion', 'detalle', 'texto']], ['aporte', 'Aporte sugerido ($)', false, ['aporte', 'aporte sugerido', 'importe', 'monto', 'contribucion']], ['nombreEn', 'Nombre (inglés)', false, ['name', 'nombre en', 'nombre ingles', 'english']], ['descEn', 'Descripción (inglés)', false, ['description', 'descripcion en', 'descripcion ingles']], ['dur', 'Duración', false, ['duracion']], ['inc', 'Qué incluye (separar con ;)', false, ['incluye', 'que incluye']]],
      plantilla: [['Nombre', 'Rubro', 'Descripcion', 'Aporte sugerido', 'Name', 'Description', 'Duracion', 'Incluye'], [['Taller de ejemplo', 'Talleres', 'Descripción del taller', '5000', 'Example workshop', 'Workshop description', '2 horas', 'Material; Certificado']]],
      parse: function (g1) {
        var er = [], nom = g1('nombre').replace(/\s+/g, ' '), c = catMenu(g1('cat')), ap = g1('aporte') ? CM.parseMonto(g1('aporte')) : 0;
        if (nom.length < 3) er.push('Falta el nombre'); if (c === null) er.push('Rubro del menú desconocido'); if (isNaN(ap) || ap < 0) er.push('Aporte inválido');
        return { er: er, id: CM.norm(nom), o: { nombre: nom, cat: c, desc: g1('desc'), cent: ap || 0, nombreEn: g1('nombreEn'), descEn: g1('descEn'), dur: g1('dur'), inc: g1('inc') } };
      },
      existe: function (id) { return CM.db.menu.draft.items.some(function (x) { return CM.norm(x.es.n) === id; }); },
      snap: function (id) { return JSON.parse(JSON.stringify(CM.db.menu.draft.items.filter(function (x) { return CM.norm(x.es.n) === id; })[0])); },
      crear: function (o) {
        var d = CM.db.menu.draft; d.items.push({ id: proxId('P', d.items), cat: o.cat, activo: true, cent: o.cent, es: { n: o.nombre, d: o.desc }, en: { n: o.nombreEn || o.nombre, d: o.descEn || o.desc }, dur: { es: o.dur, en: o.dur }, inc: { es: o.inc.split(';').map(function (z) { return z.trim(); }).filter(Boolean).join('\n'), en: o.inc.split(';').map(function (z) { return z.trim(); }).filter(Boolean).join('\n') } }); return CM.norm(o.nombre);
      },
      actualizar: function (id, o) { var x = CM.db.menu.draft.items.filter(function (y) { return CM.norm(y.es.n) === id; })[0]; if (o.desc) x.es.d = o.desc; if (o.cent) x.cent = o.cent; if (o.cat) x.cat = o.cat; if (o.nombreEn) x.en.n = o.nombreEn; if (o.descEn) x.en.d = o.descEn; },
      restaurar: function (id, prev) { var a = CM.db.menu.draft.items, i = a.findIndex(function (y) { return CM.norm(y.es.n) === id; }); a[i] = prev; },
      quitar: function (id) { var d = CM.db.menu.draft; d.items = d.items.filter(function (y) { return CM.norm(y.es.n) !== id; }); },
      bloqueo: function (id) { var it = CM.db.menu.draft.items.filter(function (y) { return CM.norm(y.es.n) === id; })[0]; return it && CM.db.menu.pub.items.some(function (y) { return y.id === it.id; }) ? 'el ítem ya fue publicado: ocultalo desde Menú público' : ''; },
      aviso: function () { return 'Los ítems importados entran al <b>borrador</b> del menú público: se ven recién cuando los publicás desde Administración → Menú público.'; }
    }
  };
  function nuevoImp(ent) { return { paso: 1, ent: ent || 'pacientes', nombre: '', head: [], rows: [], map: {}, dup: 'actualizar', msg: '', prueba: null }; }
  CM.imp = nuevoImp();
  function E() { return ENT[CM.imp.ent] || ENT.pacientes; }
  CM.acts['imp-plantilla'] = function () { var e = E(); CM.descargar('plantilla_' + CM.imp.ent + '.csv', CM.csv(e.plantilla[0], e.plantilla[1])); };
  CM.forms['imp-ent'] = function (f) { CM.imp = nuevoImp(f.elements.ent.value); render(); };
  function analizar() {
    var f = CM.imp, e = E(), res = { nuevos: [], act: [], omit: [], err: [] }, vistos = {};
    f.rows.forEach(function (r, i) {
      var g1 = function (k) { var ix = f.map[k]; return ix === undefined || ix === '' ? '' : String(r[+ix] == null ? '' : r[+ix]).trim(); };
      var p = e.parse(g1), n = i + 2;
      if (!p.er.length && !p.id) p.er.push('Falta la clave de la fila');
      if (!p.er.length && vistos[p.id]) p.er.push('Repetido dentro del archivo');
      if (p.er.length) { res.err.push({ n: n, dni: p.id, e: p.er.join(', ') }); return; }
      vistos[p.id] = 1; p.o._id = p.id;
      if (e.existe(p.id)) { if (f.dup === 'omitir') res.omit.push(p.o); else res.act.push(p.o); } else res.nuevos.push(p.o);
    });
    return res;
  }
  function filasLeidas(rows, nombre) {
    var f = CM.imp, e = E(), hi = 0;
    for (var i = 0; i < Math.min(rows.length, 10); i++) { if (rows[i].filter(function (c) { return String(c).trim(); }).length >= 2) { hi = i; break; } }
    if (rows.length < 2) { f.msg = 'No encontré filas de datos en el archivo.'; render(); return; }
    if (rows.length - hi - 1 > 20000) { f.msg = 'El archivo supera las 20.000 filas.'; render(); return; }
    f.head = rows[hi].map(function (c) { return String(c == null ? '' : c); }); f.rows = rows.slice(hi + 1); f.nombre = nombre; f.msg = ''; f.prueba = null; f.map = {};
    e.campos.forEach(function (c) { f.head.forEach(function (h, ix) { if (f.map[c[0]] === undefined && c[3].indexOf(CM.norm(h)) > -1) f.map[c[0]] = ix; }); });
    f.paso = 2; render();
  }
  /* lector mínimo de .xlsx (zip + XML), sin librerías externas */
  CM.leerXlsx = function (buf) {
    var u = new Uint8Array(buf), dv = new DataView(buf), eocd = -1, i;
    for (i = u.length - 22; i >= Math.max(0, u.length - 70000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) return Promise.reject(new Error('zip'));
    var n = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true), ent = {}, td = new TextDecoder();
    for (i = 0; i < n; i++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      var met = dv.getUint16(off + 10, true), csz = dv.getUint32(off + 20, true), nl = dv.getUint16(off + 28, true), el = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lo = dv.getUint32(off + 42, true);
      ent[td.decode(u.subarray(off + 46, off + 46 + nl))] = { met: met, csz: csz, lo: lo }; off += 46 + nl + el + cl;
    }
    function leer(nombre) {
      var x = ent[nombre]; if (!x) return Promise.resolve(null);
      var ln = dv.getUint16(x.lo + 26, true), le = dv.getUint16(x.lo + 28, true), ini = x.lo + 30 + ln + le, dat = u.subarray(ini, ini + x.csz);
      if (x.met === 0) return Promise.resolve(td.decode(dat));
      if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('ds'));
      var ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter(); w.write(dat); w.close();
      return new Response(ds.readable).arrayBuffer().then(function (b) { return td.decode(b); });
    }
    function xml(t) { return new DOMParser().parseFromString(t, 'application/xml'); }
    var hojas = Object.keys(ent).filter(function (k) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(k); }).sort(function (a, b) { return parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10); });
    if (!hojas.length) return Promise.reject(new Error('hoja'));
    return Promise.all([leer('xl/sharedStrings.xml'), leer(hojas[0])]).then(function (r) {
      var ss = [];
      if (r[0]) Array.prototype.forEach.call(xml(r[0]).getElementsByTagName('si'), function (si) { ss.push(Array.prototype.map.call(si.getElementsByTagName('t'), function (t) { return t.textContent; }).join('')); });
      var rows = [];
      Array.prototype.forEach.call(xml(r[1]).getElementsByTagName('row'), function (row) {
        var arr = [];
        Array.prototype.forEach.call(row.getElementsByTagName('c'), function (c) {
          var ref = c.getAttribute('r') || '', col = 0, m = /^([A-Z]+)/.exec(ref); if (m) m[1].split('').forEach(function (ch) { col = col * 26 + ch.charCodeAt(0) - 64; });
          var t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0], val = '';
          if (t === 's' && v) val = ss[+v.textContent] || ''; else if (t === 'inlineStr') val = Array.prototype.map.call(c.getElementsByTagName('t'), function (z) { return z.textContent; }).join(''); else if (v) val = v.textContent;
          arr[(col || arr.length + 1) - 1] = val;
        });
        for (var k = 0; k < arr.length; k++) if (arr[k] === undefined) arr[k] = '';
        rows.push(arr);
      });
      return rows;
    });
  };
  VIEWS.importexport = function () {
    var f = CM.imp, e = E(), db = CM.db;
    var head = pageH('Importar / Exportar', 'Sacá tus datos en CSV (se abre directo en Excel) o traé datos desde otro sistema: CSV, Excel (.xlsx) o pegando desde una planilla. Todo queda en la auditoría.');
    var exp = '<section class="card"><h2>Exportar</h2><div class="row">' + EXPORTS.map(function (x) { return '<button class="btn sm" data-act="exp-uno" data-v="' + x[0] + '">' + CM.icon('dl') + esc(x[1]) + '</button>'; }).join('') + '</div><p class="hint">CSV con punto y coma y UTF-8 (se abre directo en Excel). Las celdas que empiezan con = + - @ se neutralizan para evitar inyección de fórmulas.</p></section>';
    var paso = '', cant = 0;
    if (f.paso === 1) {
      paso = '<form data-form="imp-ent" class="row" style="margin-bottom:12px"><label class="fl" style="min-width:260px"><span>¿Qué querés importar?</span><select class="in" name="ent">' + Object.keys(ENT).map(function (k) { return opt(k, ENT[k].label, k === f.ent); }).join('') + '</select></label><button class="btn" type="submit">Elegir</button></form>' +
        '<p style="color:var(--mu)">Subí un archivo <b>.csv</b> o <b>.xlsx</b> (hasta 20.000 filas y 15 MB), o pegá las filas copiadas desde Excel. La primera fila tiene que tener los títulos de las columnas.</p><div class="row"><label class="btn pri" for="impFile" style="cursor:pointer">' + CM.icon('plus') + 'Elegir archivo (CSV o Excel)</label><input type="file" id="impFile" accept=".csv,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr"><button class="btn" data-act="imp-plantilla">' + CM.icon('dl') + 'Descargar plantilla</button></div>' +
        '<details style="margin-top:12px"><summary>Pegar desde Excel</summary><textarea class="in tall" id="impPaste" placeholder="Pegá acá las filas (con los títulos en la primera)"></textarea><div class="row" style="margin-top:8px"><button class="btn" data-act="imp-pegar">Usar lo pegado</button></div></details>' +
        (f.msg ? '<div class="note bad" role="alert" style="margin-top:12px">' + esc(f.msg) + '</div>' : '');
    } else if (f.paso === 2) {
      paso = '<p style="color:var(--mu)">Entidad: <b>' + esc(e.label) + '</b> · Archivo: <b>' + esc(f.nombre) + '</b> · ' + f.rows.length + ' fila(s). Indicá qué columna corresponde a cada dato (se reconocieron las habituales).</p><form data-form="imp-map" class="f">' + e.campos.map(function (c) {
        return fl(c[1] + (c[2] ? ' *' : ''), '<select class="in" name="m_' + c[0] + '">' + opt('', '— No importar —', f.map[c[0]] === undefined || f.map[c[0]] === '') + f.head.map(function (h, i) { return opt(String(i), h || ('Columna ' + (i + 1)), String(f.map[c[0]]) === String(i)); }).join('') + '</select>');
      }).join('') + fl('Si ya existe', '<select class="in" name="dup">' + opt('actualizar', 'Actualizar los datos', f.dup === 'actualizar') + opt('omitir', 'Omitirlo (no tocar)', f.dup === 'omitir') + '</select>') + '<p class="err" role="alert" data-err></p><div class="row"><button class="btn" type="button" data-act="imp-volver">Volver</button><button class="btn pri" type="submit">Ver vista previa</button></div></form>';
    } else {
      var a = analizar(); cant = a.nuevos.length + a.act.length;
      paso = '<div class="grid g4"><div class="card kpi"><div class="l">Nuevos</div><div class="v">' + a.nuevos.length + '</div></div><div class="card kpi"><div class="l">A actualizar</div><div class="v">' + a.act.length + '</div></div><div class="card kpi"><div class="l">Omitidos</div><div class="v">' + a.omit.length + '</div></div><div class="card kpi"><div class="l">Con error</div><div class="v">' + a.err.length + '</div></div></div>' +
        '<div class="note info" style="margin-top:12px">' + e.aviso(a) + '</div>' +
        (a.err.length ? '<h3 style="margin-top:14px">Errores por fila</h3><div class="tw"><table><thead><tr><th>Fila</th><th>Clave</th><th>Problema</th></tr></thead><tbody>' + a.err.slice(0, 20).map(function (x) { return '<tr><td>' + x.n + '</td><td>' + esc(x.dni) + '</td><td>' + esc(x.e) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '') +
        (f.prueba ? '<div class="note ok" style="margin-top:12px" role="status">' + esc(f.prueba) + '</div>' : '') +
        '<div class="row" style="margin-top:14px"><button class="btn" data-act="imp-atras">Volver al mapeo</button><button class="btn" data-act="imp-probar">Probar (sin guardar)</button><button class="btn pri" data-act="imp-ok"' + (cant ? '' : ' disabled') + '>Importar ' + cant + ' ' + esc(e.unidad) + '</button></div>';
    }
    var lote = db.imports[db.imports.length - 1];
    return head + exp + '<section class="card" style="margin-top:14px"><div class="row sp"><h2>Importar ' + esc(e.label.toLowerCase()) + ' · paso ' + f.paso + ' de 3</h2>' + (f.paso > 1 ? '<button class="btn sm" data-act="imp-reset">Empezar de nuevo</button>' : '') + '</div>' + paso + '</section>' +
      '<section class="card" style="margin-top:14px"><h2>Lotes importados</h2>' + (db.imports.length ? '<div class="tw"><table><thead><tr><th>Fecha</th><th>Qué</th><th>Archivo</th><th class="n">Nuevos</th><th class="n">Actualizados</th><th>Estado</th></tr></thead><tbody>' + db.imports.slice().reverse().map(function (l) { return '<tr><td>' + esc(CM.fmtFH(l.ts)) + '</td><td>' + esc((ENT[l.ent || 'pacientes'] || {}).label || '') + '</td><td>' + esc(l.archivo) + '</td><td class="n">' + l.nuevos.length + '</td><td class="n">' + Object.keys(l.prev).length + '</td><td>' + (l.deshecho ? '<span class="pill p-mu">Deshecho</span>' : '<span class="pill p-ok">Aplicado</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>' + (lote && !lote.deshecho ? '<div class="row" style="margin-top:12px"><button class="btn bad" data-act="imp-deshacer">Deshacer el último lote</button></div>' : '') : '<div class="empty">Todavía no se importó nada.</div>') + '<p class="hint">Importar el mismo archivo dos veces no duplica registros. El lote se puede deshacer mientras no haya movimientos posteriores que dependan de él.</p></section>';
  };
  document.addEventListener('change', function (ev) {
    if (ev.target.id !== 'impFile' || !ev.target.files[0]) return;
    if (!CM.need('importexport', 'admin')) { ev.target.value = ''; return; }
    var file = ev.target.files[0], f = CM.imp; ev.target.value = '';
    if (file.size > 15 * 1024 * 1024) { f.msg = 'El archivo supera los 15 MB.'; render(); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var buf = new Uint8Array(fr.result), txt;
      if (buf[0] === 0x50 && buf[1] === 0x4b) {
        CM.leerXlsx(fr.result).then(function (rows) { filasLeidas(rows, file.name); }, function () { f.msg = 'No pude leer ese archivo Excel. Probá guardarlo de nuevo como .xlsx o como CSV.'; render(); });
        return;
      }
      try { txt = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e2) { txt = new TextDecoder('windows-1252').decode(buf); }
      filasLeidas(CM.parseCSV(txt).rows, file.name);
    };
    fr.readAsArrayBuffer(file);
  });
  CM.acts['imp-pegar'] = function () {
    if (!CM.need('importexport', 'admin')) return;
    var t = document.getElementById('impPaste'); if (!t || !t.value.trim()) { CM.toast('Pegá primero las filas copiadas.', true); return; }
    if (t.value.length > 15 * 1024 * 1024) { CM.imp.msg = 'Lo pegado supera los 15 MB.'; render(); return; }
    filasLeidas(CM.parseCSV(t.value).rows, 'Pegado desde Excel');
  };
  CM.forms['imp-map'] = function (f) {
    var im = CM.imp, e = E(); im.map = {};
    e.campos.forEach(function (c) { var v = f.elements['m_' + c[0]].value; if (v !== '') im.map[c[0]] = +v; });
    im.dup = f.elements.dup.value;
    var falta = e.campos.filter(function (c) { return c[2] && im.map[c[0]] === undefined; })[0];
    if (falta) return fail(f, 'm_' + falta[0], 'Indicá la columna de «' + falta[1] + '».');
    im.paso = 3; im.prueba = null; render();
  };
  CM.acts['imp-volver'] = function () { CM.imp.paso = 1; render(); };
  CM.acts['imp-atras'] = function () { CM.imp.paso = 2; render(); };
  CM.acts['imp-reset'] = function () { CM.imp = nuevoImp(CM.imp.ent); render(); };
  CM.acts['imp-probar'] = function () { var a = analizar(); CM.imp.prueba = 'Prueba sin guardar: se crearían ' + a.nuevos.length + ', se actualizarían ' + a.act.length + ', se omitirían ' + a.omit.length + ' y ' + a.err.length + ' fila(s) tienen error. No se modificó nada.'; render(); };
  CM.acts['imp-ok'] = function () {
    var f = CM.imp, e = E();
    if (!CM.need('importexport', 'admin') || !CM.need(e.perm, 'edit')) return;
    var a = analizar(), lote = { id: CM.nextId('IMP'), ts: new Date().toISOString(), user: CM.db.cfg.operador, archivo: f.nombre, ent: f.ent, nuevos: [], prev: {}, deshecho: false }, prevs = {};
    a.act.forEach(function (o) { prevs[o._id] = e.snap(o._id); });
    // todo validado: recién ahora se modifica la base; si algo falla, se revierte
    var respaldo = JSON.stringify(CM.db);
    try {
      a.nuevos.forEach(function (o) { lote.nuevos.push(e.crear(o)); });
      a.act.forEach(function (o) { e.actualizar(o._id, o); });
      lote.prev = prevs; CM.db.imports.push(lote);
      CM.audit('Importación de ' + e.label.toLowerCase(), f.nombre + ' · ' + lote.nuevos.length + ' nuevos · ' + Object.keys(prevs).length + ' actualizados'); CM.save();
    } catch (err) { CM.db = JSON.parse(respaldo); CM.toast('Falló la importación y se revirtió: no se modificó nada.', true); return; }
    CM.imp = nuevoImp(f.ent); render(); CM.toast('Importación terminada: ' + lote.nuevos.length + ' nuevos y ' + Object.keys(prevs).length + ' actualizados.');
  };
  CM.acts['imp-deshacer'] = function () {
    if (!CM.need('importexport', 'admin')) return;
    var l = CM.db.imports[CM.db.imports.length - 1]; if (!l || l.deshecho) return;
    var e = ENT[l.ent || 'pacientes'], bloq = l.nuevos.filter(function (d) { return e.bloqueo(d); });
    if (bloq.length) { CM.toast('No se puede deshacer: ' + e.bloqueo(bloq[0]) + '.', true); return; }
    l.nuevos.forEach(function (d) { e.quitar(d); }); Object.keys(l.prev).forEach(function (d) { e.restaurar(d, l.prev[d]); });
    l.deshecho = true; CM.audit('Importación deshecha', l.id + ' · ' + l.archivo); CM.save(); render(); CM.toast('Lote deshecho.');
  };

  /* ===================================================================
     INTEGRACIONES
     =================================================================== */
  var INTEG = [
    ['Google Drive (carpetas del paciente)', 'manual', 'Hoy: enlaces Drive 1 y Drive 2 cargados a mano en cada ficha.', 'Para sincronizar archivos: cuenta Google de la fundación, proyecto con la API habilitada, pantalla de consentimiento y permisos mínimos (drive.file). Los tokens quedan cifrados en el servidor.'],
    ['Formularios de Google (historia y seguimiento)', 'manual', 'Activo: la demo abre los formularios y los muestra en el QR de la etiqueta.', 'La carga automática de respuestas a la ficha requiere conectar la hoja de respuestas.'],
    ['Mercado Pago (aportes por QR o link)', 'pend', 'Pendiente de configuración.', 'Cuenta de la fundación, credenciales por canal seguro, webhooks con firma y pruebas en sandbox. Un aporte sólo se acredita con confirmación verificada del proveedor.'],
    ['WhatsApp', 'manual', 'Activo: abre WhatsApp con un mensaje listo (envío manual). No es un envío automático.', 'El envío automático usa la API oficial de WhatsApp Business: cuenta, plantillas aprobadas, costos [VERIFICAR].'],
    ['Correo electrónico', 'pend', 'Pendiente de configuración.', 'SMTP o proveedor transaccional configurado en el servidor, con baja de comunicaciones y lista de supresión.'],
    ['Facturación electrónica ARCA (Factura C)', 'pend', 'Simulador sin validez fiscal.', 'Certificado digital, relación de servicio WSFE, punto de venta y pruebas de homologación [VERIFICAR en arca.gob.ar].'],
    ['Google Calendar / Sheets', 'pend', 'Pendiente de configuración.', 'Sólo si la fundación agenda turnos o quiere informes en hojas; OAuth con permisos mínimos.'],
    ['Analítica y publicidad (Google Analytics, Meta Pixel)', 'nd', 'Apagado: no se instala ningún rastreador en el menú público.', 'Se activaría sólo con consentimiento y revisión legal [VERIFICAR]. Nunca en pantallas internas ni con datos de salud.']
  ];
  VIEWS.integraciones = function () {
    return pageH('Integraciones', 'Conexiones opcionales con otros servicios. Ninguna está conectada en esta demo salvo los enlaces manuales; cada tarjeta dice la verdad sobre su estado.') +
      '<div class="grid g2">' + INTEG.map(function (i) { return '<section class="card"><div class="row sp"><h3>' + esc(i[0]) + '</h3>' + estPill(i[1]) + '</div><p style="margin:8px 0">' + esc(i[2]) + '</p><details><summary>Qué hace falta</summary><p class="hint" style="margin-top:8px">' + esc(i[3]) + '</p></details></section>'; }).join('') + '</div>' +
      '<section class="card" style="margin-top:14px"><h2>Probar un enlace manual</h2><p style="color:var(--mu)">WhatsApp se abre con un mensaje listo; una persona lo revisa y lo envía.</p><a class="btn" href="https://wa.me/5493875143900?text=' + encodeURIComponent('Hola Rave Holding, consulto por la integración de la demo de Cannabismatica') + '" target="_blank" rel="noopener noreferrer">Abrir WhatsApp de Rave Holding</a></section>';
  };

  /* ===================================================================
     USUARIOS Y PERMISOS
     =================================================================== */
  VIEWS.usuarios = function () {
    var db = CM.db, rl = Object.keys(CM.ROLES);
    return pageH('Usuarios y permisos', 'Quién puede hacer qué. Cambiá el rol activo para ver cómo se comporta el sistema. <b>Simulación:</b> en el sistema real los permisos se validan también en el servidor.',
      '<button class="btn pri" data-act="us-nuevo">' + CM.icon('plus') + 'Nuevo usuario</button>') +
      '<section class="card"><h2>Usuarios</h2><div class="tw"><table><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + db.users.map(function (u) {
        return '<tr' + (u.activo ? '' : ' class="anulada"') + '><td><b>' + esc(u.nombre) + '</b></td><td>' + esc(u.correo) + '</td><td>' + esc(CM.ROLES[u.rol]) + '</td><td>' + (u.activo ? '<span class="pill p-ok">Activo</span>' : '<span class="pill p-mu">Baja</span>') + '</td><td class="acts"><button class="btn sm" data-act="us-edit" data-id="' + esc(u.id) + '">Editar</button><button class="btn sm" data-act="us-clave" data-id="' + esc(u.id) + '">Clave temporal</button><button class="btn sm" data-act="us-actuar" data-id="' + esc(u.id) + '">Usar este rol</button></td></tr>';
      }).join('') + '</tbody></table></div></section>' +
      '<section class="card" style="margin-top:14px"><h2>Matriz de permisos</h2><p class="hint">Niveles: sólo ver · operar (cargar) · editar · administrar (anular, cerrar, configurar). El administrador siempre puede todo, para no quedar bloqueado.</p><form data-form="perms"><div class="tw"><table><thead><tr><th>Módulo</th>' + rl.map(function (r) { return '<th>' + esc(CM.ROLES[r]) + '</th>'; }).join('') + '</tr></thead><tbody>' + CM.MODS.map(function (m) {
        return '<tr><td>' + esc(m[1]) + '</td>' + rl.map(function (r) {
          if (r === 'admin') return '<td><span class="pill p-ok">Administrar</span></td>';
          return '<td><label class="sr" for="pm_' + r + '_' + m[0] + '">' + esc(m[1] + ' · ' + CM.ROLES[r]) + '</label><select id="pm_' + r + '_' + m[0] + '" class="in sm" name="' + r + '|' + m[0] + '">' + CM.LVL.map(function (l) { return opt(l, CM.LVL_L[l], (db.perms[r][m[0]] || '') === l); }).join('') + '</select></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div><div class="row" style="margin-top:12px"><button class="btn pri" type="submit">Guardar permisos</button><button class="btn" type="button" data-act="perms-reset">Restaurar valores por defecto</button></div></form><p class="hint">En la demo los permisos se aplican a las pantallas y a las acciones de los módulos de gestión; las pantallas originales (pacientes, dispensaciones, aportes) se controlan a nivel de acceso a la sección.</p></section>';
  };
  CM.forms.perms = function (f) {
    if (!CM.need('usuarios', 'admin')) return;
    Array.prototype.forEach.call(f.elements, function (el) { if (el.name && el.name.indexOf('|') > -1) { var p = el.name.split('|'); CM.db.perms[p[0]][p[1]] = el.value; } });
    CM.audit('Permisos', 'Matriz de permisos actualizada'); CM.save(); render(); CM.toast('Permisos guardados.');
  };
  CM.acts['perms-reset'] = function () { if (!CM.need('usuarios', 'admin')) return; CM.db.perms = CM.permsDefault(); CM.audit('Permisos', 'Restaurados los valores por defecto'); CM.save(); render(); };
  CM.acts['us-actuar'] = function (t) {
    var u = CM.db.users.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0];
    if (!u.activo) { CM.toast('Ese usuario está de baja.', true); return; }
    CM.db.cfg.rol = u.rol; CM.db.cfg.operador = u.nombre; CM.audit('Cambio de usuario (simulación)', u.nombre + ' · ' + CM.ROLES[u.rol]); CM.save(); render(); CM.toast('Ahora actuás como ' + u.nombre + '.');
  };
  function modalUs(u) {
    var edit = !!u;
    CM.modal.open({ title: edit ? 'Editar usuario' : 'Nuevo usuario', body: '<form id="fUS" data-form="usuario" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(edit ? u.id : '') + '">' + fl('Nombre *', '<input class="in" name="nombre" value="' + esc(edit ? u.nombre : '') + '">') + fl('Correo *', '<input class="in" type="email" name="correo" value="' + esc(edit ? u.correo : '') + '">') + fl('Rol', '<select class="in" name="rol">' + Object.keys(CM.ROLES).map(function (r) { return opt(r, CM.ROLES[r], edit && u.rol === r); }).join('') + '</select>') + (edit ? '<label class="chk"><input type="checkbox" name="activo"' + (u.activo ? ' checked' : '') + '><span>Activo (si se desmarca, pierde el acceso en todos los equipos)</span></label>' : '') + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fUS">Guardar</button>' });
  }
  CM.acts['us-nuevo'] = function () { if (CM.need('usuarios', 'admin')) modalUs(null); };
  CM.acts['us-edit'] = function (t) { if (CM.need('usuarios', 'admin')) modalUs(CM.db.users.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]); };
  CM.forms.usuario = function (f) {
    var e = f.elements, n = e.nombre.value.trim(), c = e.correo.value.trim();
    if (n.length < 3) return fail(f, 'nombre', 'Escribí el nombre.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)) return fail(f, 'correo', 'Revisá el correo.');
    var u = e.id.value ? CM.db.users.filter(function (x) { return x.id === e.id.value; })[0] : null;
    if (u) {
      if (u.rol === 'admin' && (e.rol.value !== 'admin' || !e.activo.checked) && CM.db.users.filter(function (x) { return x.rol === 'admin' && x.activo; }).length < 2) return fail(f, 'rol', 'Tiene que quedar al menos un administrador activo.');
      u.nombre = n; u.correo = c; u.rol = e.rol.value; u.activo = e.activo.checked; CM.audit('Usuario editado', u.id + ' · ' + n + ' · ' + u.rol);
    } else { CM.db.users.push({ id: 'U-' + (CM.db.users.length + 1 + Math.floor(Math.random() * 90)), nombre: n, correo: c, rol: e.rol.value, activo: true }); CM.audit('Usuario nuevo', n + ' · ' + e.rol.value); }
    CM.save(); CM.modal.close(true); render();
  };
  CM.acts['us-clave'] = function (t) {
    if (!CM.need('usuarios', 'admin')) return;
    var u = CM.db.users.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0], cod = CM.sha256(u.id + Date.now()).slice(0, 8).toUpperCase();
    CM.audit('Clave temporal', 'Generada para ' + u.nombre); CM.save();
    CM.modal.open({ title: 'Clave temporal', body: '<p>Clave temporal para <b>' + esc(u.nombre) + '</b>: <code style="font-size:1.2rem">' + esc(cod) + '</code></p><div class="note info">Demostración: no se guarda ninguna contraseña real. En el sistema real la persona debe elegir una clave propia al ingresar.</div>', footer: '<button class="btn pri" data-act="modal-close">Listo</button>' });
  };

  /* ===================================================================
     AUDITORÍA
     =================================================================== */
  CM.aud = { q: '', user: '', desde: '', res: null };
  VIEWS.auditoria = function () {
    var f = CM.aud, a = CM.db.audit;
    var arr = a.filter(function (x) { return (!f.q || CM.norm(x.accion + ' ' + x.detalle).indexOf(CM.norm(f.q)) > -1) && (!f.user || x.user === f.user) && (!f.desde || x.ts.slice(0, 10) >= f.desde); });
    var users = {}; a.forEach(function (x) { users[x.user] = 1; });
    var v = f.res;
    return pageH('Auditoría', 'Bitácora de acciones críticas. Cada registro se encadena con el anterior mediante un hash SHA-256: si alguien altera uno, la verificación lo detecta.',
      '<div class="row"><button class="btn pri" data-act="aud-verif">' + CM.icon('shield') + 'Verificar integridad</button><button class="btn" data-act="csv-aud">' + CM.icon('dl') + 'Exportar CSV</button></div>') +
      (v ? '<div class="note ' + (v.ok ? 'ok' : 'bad') + '" role="status" style="margin-bottom:14px">' + (v.ok ? 'Cadena íntegra: ' + v.n + ' registros verificados, ninguno alterado.' : 'Se detectó una alteración en: ' + esc(v.malos.join(', ')) + '.') + '</div>' : '') +
      '<section class="card"><div class="row" style="margin-bottom:12px"><label class="sr" for="auQ">Buscar</label><input id="auQ" class="in fx" placeholder="Buscar en acción o detalle" value="' + esc(f.q) + '"><label class="sr" for="auU">Usuario</label><select id="auU" class="in fx">' + opt('', 'Todos los usuarios', !f.user) + Object.keys(users).map(function (u) { return opt(u, u, f.user === u); }).join('') + '</select><label class="sr" for="auD">Desde</label><input id="auD" type="date" class="in fx" value="' + esc(f.desde) + '"></div>' +
      '<p class="hint" style="margin:0 0 8px">' + arr.length + ' de ' + a.length + ' registros (se muestran los primeros 100)</p><div class="tw"><table><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Rol</th><th>Acción</th><th>Detalle</th><th>Hash</th></tr></thead><tbody>' + arr.slice(0, 100).map(function (x) {
        return '<tr><td>' + esc(CM.fmtFH(x.ts)) + '</td><td>' + esc(x.user) + '</td><td>' + esc(CM.ROLES[x.rol] || x.rol || '') + '</td><td>' + esc(x.accion) + '</td><td>' + esc(x.detalle) + '</td><td><code>' + esc((x.h || '').slice(0, 8)) + '</code></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<details style="margin-top:14px"><summary>Prueba de integridad (demo)</summary><p class="hint">Altera a propósito el detalle de un registro para mostrar que la verificación lo detecta; después se puede reparar.</p><div class="row"><button class="btn sm bad" data-act="aud-alterar">Simular alteración</button><button class="btn sm" data-act="aud-reparar">Reparar la alteración de prueba</button></div></details></section>';
  };
  document.addEventListener('input', function (ev) { if (ev.target.id === 'auQ') { CM.aud.q = ev.target.value; var pos = ev.target.selectionStart; render(); var n = $('#auQ'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* nada */ } } } });
  document.addEventListener('change', function (ev) { if (ev.target.id === 'auU') { CM.aud.user = ev.target.value; render(); } else if (ev.target.id === 'auD') { CM.aud.desde = ev.target.value; render(); } });
  CM.acts['aud-verif'] = function () { CM.aud.res = CM.verificarAuditoria(); render(); };
  CM.acts['aud-alterar'] = function () {
    if (!CM.need('auditoria', 'admin')) return;
    var a = CM.db.audit; if (a.length < 3) return;
    a[2].detalle += ' [ALTERADO]'; CM.db.cfg.audAlt = a[2].id; CM.save(); CM.aud.res = CM.verificarAuditoria(); render();
  };
  CM.acts['aud-reparar'] = function () {
    if (!CM.need('auditoria', 'admin')) return;
    var id = CM.db.cfg.audAlt, e = CM.db.audit.filter(function (x) { return x.id === id; })[0];
    if (!e) { CM.toast('No hay alteración de prueba para reparar.'); return; }
    e.detalle = e.detalle.replace(' [ALTERADO]', ''); delete CM.db.cfg.audAlt; CM.save(); CM.aud.res = CM.verificarAuditoria(); render();
  };

  /* ===================================================================
     CONFIGURACIÓN (bloques extra dentro de la pantalla Ajustes)
     =================================================================== */
  var PROTEGIDOS = ['inicio', 'ajustes', 'usuarios', 'auditoria'];
  CM.cfgExtra = function () {
    var db = CM.db, mods = CM.NAV.filter(function (n) { return n[0] !== '-' && PROTEGIDOS.indexOf(n[3]) < 0; });
    return '<form class="card f" data-form="cfg-mods" style="margin-top:14px"><h2>Módulos activos</h2><p class="hint" style="margin:0">Apagá lo que la organización no usa: desaparece del menú sin borrar datos. Rubro: <b>' + esc(db.cfg.rubroOng) + '</b> · Zona horaria: ' + esc(db.cfg.zona) + '.</p><div class="chks">' + mods.map(function (n) {
      return '<label class="chk"><input type="checkbox" name="' + esc(n[3]) + '"' + (db.cfg.mods[n[3]] === false ? '' : ' checked') + '><span>' + esc(n[1]) + '</span></label>';
    }).join('') + '</div><div class="row"><button class="btn pri" type="submit">Guardar módulos</button></div></form>' +
      '<section class="card" style="margin-top:14px"><div class="row sp"><h2>Rubros financieros</h2><button class="btn pri sm" data-act="rb-nuevo">' + CM.icon('plus') + 'Nuevo rubro</button></div><p class="hint" style="margin:0 0 10px">Cada movimiento de caja lleva un rubro obligatorio. Un rubro con historial no se borra: se desactiva.</p><div class="tw"><table><thead><tr><th>Rubro</th><th>Aplica a</th><th>Estado</th><th></th></tr></thead><tbody>' + db.rubros.map(function (r) {
        return '<tr' + (r.activo ? '' : ' class="anulada"') + '><td>' + esc(r.n) + '</td><td>' + ({ ingreso: 'Ingresos', egreso: 'Egresos', ambos: 'Ingresos y egresos' }[r.tipo]) + '</td><td>' + (r.activo ? '<span class="pill p-ok">Activo</span>' : '<span class="pill p-mu">Inactivo</span>') + '</td><td class="acts"><button class="btn sm" data-act="rb-edit" data-id="' + esc(r.id) + '">Editar</button><button class="btn sm" data-act="rb-toggle" data-id="' + esc(r.id) + '">' + (r.activo ? 'Desactivar' : 'Activar') + '</button></td></tr>';
      }).join('') + '</tbody></table></div></section>';
  };
  CM.forms['cfg-mods'] = function (f) {
    if (!CM.need('ajustes', 'admin')) return;
    CM.NAV.forEach(function (n) { if (n[0] !== '-' && PROTEGIDOS.indexOf(n[3]) < 0) CM.db.cfg.mods[n[3]] = !!f.elements[n[3]].checked; });
    CM.audit('Configuración', 'Módulos activos actualizados'); CM.save(); render(); CM.toast('Módulos actualizados.');
  };
  function modalRubro(r) {
    var edit = !!r;
    CM.modal.open({ title: edit ? 'Editar rubro financiero' : 'Nuevo rubro financiero', body: '<form id="fRB" data-form="rubro" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(edit ? r.id : '') + '">' + fl('Nombre *', '<input class="in" name="n" value="' + esc(edit ? r.n : '') + '">') + fl('Aplica a', '<select class="in" name="tipo">' + opt('ingreso', 'Ingresos', edit && r.tipo === 'ingreso') + opt('egreso', 'Egresos', edit && r.tipo === 'egreso') + opt('ambos', 'Ingresos y egresos', edit && r.tipo === 'ambos') + '</select>') + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fRB">Guardar</button>' });
  }
  CM.acts['rb-nuevo'] = function () { if (CM.need('ajustes', 'admin')) modalRubro(null); };
  CM.acts['rb-edit'] = function (t) { if (CM.need('ajustes', 'admin')) modalRubro(CM.rubro(t.getAttribute('data-id'))); };
  CM.forms.rubro = function (f) {
    var e = f.elements, n = e.n.value.trim();
    if (n.length < 3) return fail(f, 'n', 'Escribí el nombre del rubro.');
    if (CM.db.rubros.some(function (r) { return CM.norm(r.n) === CM.norm(n) && r.id !== e.id.value; })) return fail(f, 'n', 'Ya existe un rubro con ese nombre.');
    var r = e.id.value ? CM.rubro(e.id.value) : null;
    if (r) { r.n = n; r.tipo = e.tipo.value; } else CM.db.rubros.push({ id: 'R-' + String(CM.db.rubros.length + 1).padStart(2, '0') + Math.floor(Math.random() * 10), n: n, tipo: e.tipo.value, activo: true });
    CM.audit('Rubro financiero', n + ' · ' + e.tipo.value); CM.save(); CM.modal.close(true); render();
  };
  CM.acts['rb-toggle'] = function (t) {
    if (!CM.need('ajustes', 'admin')) return;
    var r = CM.rubro(t.getAttribute('data-id'));
    if (r.activo && r.id === 'R-01') { CM.toast('«Aportes voluntarios» lo usa el sistema para los aportes: no se desactiva.', true); return; }
    r.activo = !r.activo; CM.audit('Rubro financiero', r.n + (r.activo ? ' activado' : ' desactivado')); CM.save(); render();
  };
})(window);
