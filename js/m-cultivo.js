/* Sistema VB ONG · Trazabilidad: Planilla de Seguimiento de Cultivo
   Ciclos de cultivo con registros diarios: N, Fecha, Día, Semana, Fase, Riego (PH/EC), H%, Temp, R. Off (PH/EC), Observaciones, Encargado.
   Nada se borra: una corrección pide motivo y guarda lo anterior; un registro erróneo se anula con motivo. */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, fl = U.fl, opt = U.opt, fail = U.fail, $ = U.$, VIEWS = CM.VIEWS;
  var render = function () { CM.render(); };
  var HOJA = 25;                                    /* filas por hoja impresa, igual que la planilla en papel */
  CM.FASES = ['Germinación', 'Plántula', 'Vegetativo', 'Pre-floración', 'Floración', 'Lavado de raíces', 'Cosecha', 'Secado', 'Curado'];   /* [VERIFICAR con el equipo técnico de la ONG] */
  CM.cu = CM.cu || { sel: '', ver: 'todas' };

  /* ---------- permisos: módulo propio "cultivo" ---------- */
  if (!CM.MODS.some(function (m) { return m[0] === 'cultivo'; })) CM.MODS.splice(5, 0, ['cultivo', 'Cultivo (planilla)']);
  var pd0 = CM.permsDefault;
  CM.permsDefault = function () {
    var p = pd0(); p.admin.cultivo = 'admin'; p.supervisor.cultivo = 'edit'; p.mostrador.cultivo = 'ver'; p.operador.cultivo = 'oper'; return p;
  };
  CM.NAV.splice(6, 0, ['cultivo', 'Cultivo', 'flask', 'cultivo']);
  CM.TITULOS.cultivo = 'Planilla de cultivo';

  /* ---------- utilidades ---------- */
  function num(s) {
    s = String(s == null ? '' : s).trim().replace(',', '.');
    if (s === '') return null;
    if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return Number(s);
  }
  function nf(v) { return v == null ? '—' : String(v).replace('.', ','); }
  function cicloId() {
    var h = CM.hoy().replace(/-/g, '').slice(2), u = {}, i, id;
    (CM.db.cultivos || []).forEach(function (c) { u[c.id] = 1; });
    for (i = 0; i < 60; i++) {
      var a = new Uint32Array(1); (g.crypto || {}).getRandomValues ? g.crypto.getRandomValues(a) : (a[0] = Math.floor(Math.random() * 4294967296));
      id = 'CU-' + h + '-' + a[0].toString(36).toUpperCase().slice(0, 5).padStart(5, '0');
      if (!u[id]) return id;
    }
    return 'CU-' + Date.now().toString(36).toUpperCase();
  }
  CM.cultivo = function (id) { return (CM.db.cultivos || []).filter(function (c) { return c.id === id; })[0] || null; };
  CM.cultivoRegs = function (id, conAnuladas) {
    return (CM.db.cultReg || []).filter(function (r) { return r.cu === id && (conAnuladas || !r.anulada); }).sort(function (a, b) { return a.n - b.n; });
  };
  function diaSem(fecha, inicio) {
    var dia = CM.diffDays(inicio, fecha) + 1;
    return { dia: dia, sem: Math.ceil(dia / 7) };
  }
  function encargados() {
    var s = {}; (CM.db.staff || []).forEach(function (p) { if (p.nombre) s[p.nombre] = 1; }); (CM.db.users || []).forEach(function (u) { if (u.nombre) s[u.nombre] = 1; });
    return Object.keys(s);
  }

  /* ---------- migración / ejemplo ---------- */
  var init0 = CM.init;
  CM.init = function () {
    init0();
    var db = CM.db, ch = false;
    if (!db.cultivos) {
      db.cultivos = []; db.cultReg = []; ch = true;
      if (db.lotes && db.lotes.length) sembrarEjemplo(db);   /* sólo con datos de ejemplo */
    }
    if (db.cfg.ejemplo === undefined) { db.cfg.ejemplo = Object.keys(db.pacientes || {}).length > 0; ch = true; }
    if (db.perms) Object.keys(db.perms).forEach(function (r) { if (db.perms[r].cultivo === undefined) { db.perms[r].cultivo = CM.permsDefault()[r] ? CM.permsDefault()[r].cultivo : ''; ch = true; } });
    if (ch) CM.save();
  };
  function sembrarEjemplo(db) {
    var h = CM.hoy(), ini = CM.addDays(h, -17), id = cicloId();
    var c = { id: id, nombre: 'Ciclo de ejemplo · Sala 1', lote: 'Sala 1 · Genética de ejemplo', inicio: ini, estado: 'activo', ejemplo: true, creado: new Date().toISOString(), user: 'Ejemplo', notas: 'Datos de ejemplo para probar la planilla. Se pueden cerrar o borrar con "Empezar de cero".', drive: { versiones: [] } };
    db.cultivos.push(c);
    var fases = [['Plántula', 7], ['Vegetativo', 18]];
    for (var i = 0; i < 12; i++) {
      var f = CM.addDays(ini, i + 3), ds = diaSem(f, ini);
      db.cultReg.push({ id: 'CR-EJ' + (i + 1), cu: id, n: i + 1, fecha: f, dia: ds.dia, sem: ds.sem, fase: ds.dia <= 7 ? 'Plántula' : 'Vegetativo',
        ph: 6.0 + (i % 3) * 0.1, ec: 1.2 + (i % 4) * 0.1, h: 60 + (i % 5), temp: 23 + (i % 3), roph: 6.2, roec: 1.5, obs: i === 5 ? 'Se regó con 20 % de runoff.' : '', enc: 'Operador demo', ts: new Date().toISOString(), user: 'Ejemplo', anulada: null, hist: [] });
    }
    void fases;
  }

  /* ---------- pantalla ---------- */
  function tabs() {
    return '';
  }
  function cultivoHtml() {
    var db = CM.db, cs = db.cultivos.slice().sort(function (a, b) { return b.inicio.localeCompare(a.inicio) || b.id.localeCompare(a.id); });
    var puedeNuevo = CM.can('cultivo', 'oper');
    if (!CM.cu.sel || !CM.cultivo(CM.cu.sel)) CM.cu.sel = cs.length ? cs[0].id : '';
    var sel = CM.cultivo(CM.cu.sel);
    var lista = cs.length ? '<div class="tw"><table><thead><tr><th>Ciclo</th><th>Lote / sala</th><th>Inicio</th><th class="n">Registros</th><th>Estado</th><th>Drive</th><th></th></tr></thead><tbody>' + cs.map(function (c) {
      var n = CM.cultivoRegs(c.id).length, v = (c.drive && c.drive.versiones || []).length;
      return '<tr' + (c.id === CM.cu.sel ? ' class="sel"' : '') + '><td><b>' + esc(c.id) + '</b><br><small class="hint">' + esc(c.nombre) + '</small></td><td>' + esc(c.lote) + '</td><td>' + CM.fmtFecha(c.inicio) + '</td><td class="n">' + n + '</td><td>' +
        (c.estado === 'activo' ? '<span class="pill p-ok">Activo</span>' : '<span class="pill p-warn">Cerrado</span>') + (c.ejemplo ? ' <span class="pill">Ejemplo</span>' : '') + '</td><td>' + (v ? '<span class="pill p-ok">' + v + ' versión(es)</span>' : '<span class="hint">Sin guardar</span>') + '</td><td><button class="btn sm' + (c.id === CM.cu.sel ? ' pri' : '') + '" data-act="cu-ver" data-id="' + esc(c.id) + '">' + (c.id === CM.cu.sel ? 'Abierto' : 'Abrir planilla') + '</button></td></tr>';
    }).join('') + '</tbody></table></div>' : '<div class="empty">Todavía no hay ciclos de cultivo. Creá el primero con “Nuevo ciclo”.</div>';
    return '<div class="page-h"><div><h1>Planilla de seguimiento de cultivo</h1><p>Un ciclo por lote o sala. Cada día se carga un registro con riego, humedad, temperatura y runoff. Los registros no se borran: se corrigen con motivo o se anulan, y todo queda en la auditoría.</p></div>' +
      '<div class="row">' + (puedeNuevo ? '<button class="btn pri" data-act="cu-nuevo">' + CM.icon('plus') + 'Nuevo ciclo</button>' : '') + '</div></div>' +
      '<section class="card"><h2>Ciclos de cultivo</h2>' + lista + '</section>' + (sel ? planillaHtml(sel) : '');
  }
  function planillaHtml(c) {
    var regs = CM.cultivoRegs(c.id, true), activos = regs.filter(function (r) { return !r.anulada; }), ult = activos[activos.length - 1];
    var abierto = c.estado === 'activo', edit = abierto && CM.can('cultivo', 'edit');
    var st = '<div class="grid g4" style="margin:12px 0"><div class="card flat"><small class="hint">Día del ciclo</small><br><b style="font-size:22px">' + (c.estado === 'activo' ? Math.max(1, diaSem(CM.hoy(), c.inicio).dia) : (ult ? ult.dia : '—')) + '</b></div>' +
      '<div class="card flat"><small class="hint">Último riego PH / EC</small><br><b style="font-size:22px">' + (ult ? nf(ult.ph) + ' / ' + nf(ult.ec) : '—') + '</b></div>' +
      '<div class="card flat"><small class="hint">Última humedad / temp.</small><br><b style="font-size:22px">' + (ult ? nf(ult.h) + ' % / ' + nf(ult.temp) + ' °C' : '—') + '</b></div>' +
      '<div class="card flat"><small class="hint">Registros</small><br><b style="font-size:22px">' + activos.length + '</b>' + (regs.length > activos.length ? ' <small class="hint">(+' + (regs.length - activos.length) + ' anulados)</small>' : '') + '</div></div>';
    var filas = regs.map(function (r) {
      var cls = r.anulada ? ' style="opacity:.55;text-decoration:line-through"' : '';
      return '<tr' + cls + '><td class="n">' + r.n + '</td><td>' + CM.fmtFecha(r.fecha) + '</td><td class="n">' + r.dia + '</td><td class="n">' + r.sem + '</td><td>' + esc(r.fase) + '</td><td class="n">' + nf(r.ph) + '</td><td class="n">' + nf(r.ec) + '</td><td class="n">' + nf(r.h) + '</td><td class="n">' + nf(r.temp) + '</td><td class="n">' + nf(r.roph) + '</td><td class="n">' + nf(r.roec) + '</td><td>' + esc(r.obs || '') + (r.anulada ? '<br><small class="hint">Anulado: ' + esc(r.anulada.motivo) + '</small>' : (r.hist && r.hist.length ? '<br><small class="hint">Corregido ' + r.hist.length + ' vez/veces</small>' : '')) + '</td><td>' + esc(r.enc) + '</td><td>' +
        (edit && !r.anulada ? '<div class="row"><button class="btn sm" data-act="cr-edit" data-id="' + esc(r.id) + '" aria-label="Corregir registro ' + r.n + '">' + CM.icon('edit') + '</button><button class="btn sm" data-act="cr-anular" data-id="' + esc(r.id) + '" aria-label="Anular registro ' + r.n + '">' + CM.icon('x') + '</button></div>' : '') + '</td></tr>';
    }).join('');
    var tabla = '<div class="tw"><table class="cult"><thead><tr><th rowspan="2" class="n">N°</th><th rowspan="2">Fecha</th><th rowspan="2" class="n">Día</th><th rowspan="2" class="n">Semana</th><th rowspan="2">Fase</th><th colspan="2" class="c">Riego</th><th rowspan="2" class="n">H %</th><th rowspan="2" class="n">Temp °C</th><th colspan="2" class="c">R. Off</th><th rowspan="2">Observaciones</th><th rowspan="2">Encargado</th><th rowspan="2"></th></tr><tr><th class="n">PH</th><th class="n">EC</th><th class="n">PH</th><th class="n">EC</th></tr></thead><tbody>' +
      (filas || '<tr><td colspan="14"><div class="empty">Sin registros todavía.</div></td></tr>') + '</tbody></table></div>';
    var drive = CM.driveHtml ? CM.driveHtml(c) : '';
    return '<section class="card" style="margin-top:14px"><div class="row sp"><div><h2>' + esc(c.nombre) + '</h2><p style="margin:2px 0 0"><span class="pill p-info" aria-label="Código del ciclo">' + esc(c.id) + '</span></p><p class="hint" style="margin:6px 0 0">Lote / sala: ' + esc(c.lote) + ' · Inicio ' + CM.fmtFecha(c.inicio) + (c.notas ? ' · ' + esc(c.notas) : '') + '</p>' +
      '<p style="margin:6px 0 0"><b>Cantidad:</b> <span data-cu-cant>' + (c.cantidad != null ? esc(nf(c.cantidad) + ' ' + (c.unidad || '')) : '—') + '</span> · <b>Variedad:</b> <span data-cu-var>' + esc(c.variedad || '—') + '</span> ' +
      (c.estado === 'activo' && CM.can('cultivo', 'oper') ? '<button class="btn sm" data-act="cu-meta" data-id="' + esc(c.id) + '">' + CM.icon('edit') + 'Editar cantidad y variedad</button>' : '') + '</p>' +
      ((c.metaHist || []).length ? '<details><summary class="hint">Historial de cambios (' + c.metaHist.length + ')</summary><ul class="tl">' + c.metaHist.slice().reverse().map(function (h) { return '<li>' + esc(CM.fmtFH(h.ts)) + ' · ' + esc(h.user) + ' · ' + esc(nf(h.antes.cantidad)) + ' ' + esc(h.antes.unidad || '') + ' / ' + esc(h.antes.variedad || '—') + ' → ' + esc(nf(h.despues.cantidad)) + ' ' + esc(h.despues.unidad || '') + ' / ' + esc(h.despues.variedad || '—') + ' · ' + esc(h.motivo) + '</li>'; }).join('') + '</ul></details>' : '') + '</div><div class="row">' +
      (abierto && CM.can('cultivo', 'oper') ? '<button class="btn pri" data-act="cr-nuevo" data-id="' + esc(c.id) + '">' + CM.icon('plus') + 'Agregar registro</button>' : '') +
      '<button class="btn" data-act="cu-print" data-id="' + esc(c.id) + '">' + CM.icon('print') + 'Imprimir planilla</button><button class="btn" data-act="cu-csv" data-id="' + esc(c.id) + '">' + CM.icon('dl') + 'Exportar CSV</button>' +
      (CM.can('cultivo', 'admin') ? (abierto ? '<button class="btn" data-act="cu-cerrar" data-id="' + esc(c.id) + '">' + CM.icon('lock') + 'Cerrar ciclo</button>' : '<button class="btn" data-act="cu-reabrir" data-id="' + esc(c.id) + '">' + CM.icon('undo') + 'Reabrir</button>') : '') + '</div></div>' +
      (abierto ? '' : '<div class="note info" style="margin-top:10px">Este ciclo está cerrado: no admite registros ni correcciones. Un administrador puede reabrirlo (queda auditado).</div>') + st + tabla + drive + '</section>';
  }
  VIEWS.cultivo = cultivoHtml;
  CM.cultivoHtml = cultivoHtml;

  /* la misma planilla también se ve dentro de Trazabilidad (pestaña) */
  var tr0 = VIEWS.trazabilidad;
  VIEWS.trazabilidad = function () {
    var t = CM.cu.tab === 'cultivo' ? 'cultivo' : 'lotes';
    var barra = '<div class="tabs" role="group" aria-label="Secciones de trazabilidad"><button type="button" data-act="tr-tab" data-v="lotes" aria-pressed="' + (t === 'lotes') + '">Lotes y dispensaciones</button>' +
      (CM.can('cultivo', 'ver') ? '<button type="button" data-act="tr-tab" data-v="cultivo" aria-pressed="' + (t === 'cultivo') + '">Planilla de cultivo</button>' : '') + '</div>';
    return barra + (t === 'cultivo' && CM.can('cultivo', 'ver') ? cultivoHtml() : tr0());
  };
  CM.acts['tr-tab'] = function (t) { CM.cu.tab = t.getAttribute('data-v') === 'cultivo' ? 'cultivo' : 'lotes'; render(); };
  CM.acts['cu-ver'] = function (t) { CM.cu.sel = t.getAttribute('data-id'); render(); };

  /* ---------- ciclos ---------- */
  CM.acts['cu-nuevo'] = function () {
    if (!CM.need('cultivo', 'oper')) return;
    CM.modal.open({
      title: 'Nuevo ciclo de cultivo',
      body: '<form id="fCU" data-form="cu-nuevo" class="f" autocomplete="off" novalidate>' + fl('Nombre del ciclo *', '<input class="in" name="nombre" maxlength="80" placeholder="Ej.: Ciclo otoño · Sala 2">') +
        fl('Lote o sala *', '<input class="in" name="lote" maxlength="80" placeholder="Ej.: Sala 2 · Genética A">') +
        fl('Fecha de inicio (día 1) *', '<input class="in" type="date" name="inicio" value="' + CM.hoy() + '" max="' + CM.hoy() + '">') + fl('Notas', '<input class="in" name="notas" maxlength="200">') +
        '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fCU">Crear ciclo</button>'
    });
  };
  CM.forms['cu-nuevo'] = function (f) {
    if (!CM.need('cultivo', 'oper')) return;
    var e = f.elements, nom = e.nombre.value.trim().replace(/\s+/g, ' '), lote = e.lote.value.trim().replace(/\s+/g, ' ');
    if (nom.length < 3) return fail(f, 'nombre', 'Escribí el nombre del ciclo (3 letras o más).');
    if (lote.length < 2) return fail(f, 'lote', 'Escribí el lote o la sala.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.inicio.value) || e.inicio.value > CM.hoy()) return fail(f, 'inicio', 'La fecha de inicio no puede ser futura.');
    var c = { id: cicloId(), nombre: nom, lote: lote, inicio: e.inicio.value, estado: 'activo', creado: new Date().toISOString(), user: CM.db.cfg.operador, notas: e.notas.value.trim(), drive: { versiones: [] } };
    CM.db.cultivos.push(c); CM.cu.sel = c.id; CM.cu.tab = CM.cu.tab || 'lotes';
    CM.audit('Cultivo: ciclo creado', c.id + ' · ' + c.nombre + ' · ' + c.lote); CM.save(); CM.modal.close(true); render(); CM.toast('Ciclo ' + c.id + ' creado.');
  };
  /* Cantidad y variedad editables: cada cambio guarda el valor anterior, el motivo y la persona (nada se pisa en silencio) */
  CM.acts['cu-meta'] = function (t) {
    if (!CM.need('cultivo', 'oper')) return; var c = CM.cultivo(t.getAttribute('data-id')); if (!c || c.estado !== 'activo') return;
    CM.modal.open({ title: 'Cantidad y variedad · ' + c.id, body: '<form id="fCM2" data-form="cu-meta" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(c.id) + '"><div class="f f2">' +
      fl('Cantidad', '<input class="in num" name="cant" inputmode="decimal" value="' + (c.cantidad != null ? esc(String(c.cantidad).replace('.', ',')) : '') + '">') +
      fl('Unidad', '<select class="in" name="uni">' + ['g', 'kg', 'unidades'].map(function (u) { return opt(u, u, (c.unidad || 'unidades') === u); }).join('') + '</select>') + '</div>' +
      fl('Variedad (genética / cepa)', '<input class="in" name="vari" maxlength="80" value="' + esc(c.variedad || '') + '">') + fl('Motivo del cambio' + ((c.cantidad != null || c.variedad) ? ' *' : ''), '<input class="in" name="motivo" maxlength="120" placeholder="Ej.: recuento de plantas">') +
      '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fCM2">Guardar</button>' });
  };
  CM.forms['cu-meta'] = function (f) {
    if (!CM.need('cultivo', 'oper')) return; var e = f.elements, c = CM.cultivo(e.id.value); if (!c || c.estado !== 'activo') return fail(f, '', 'El ciclo está cerrado.');
    var cant = e.cant.value.trim() === '' ? null : CM.parseCant(e.cant.value);
    if (cant !== null && (isNaN(cant) || cant < 0)) return fail(f, 'cant', 'La cantidad no es válida (hasta 2 decimales).');
    var vari = e.vari.value.trim().replace(/\s+/g, ' '), tenia = c.cantidad != null || !!c.variedad, mot = e.motivo.value.trim();
    if (cant === (c.cantidad == null ? null : c.cantidad) && vari === (c.variedad || '') && e.uni.value === (c.unidad || 'unidades')) return fail(f, '', 'No cambió nada.');
    if (tenia && mot.length < 4) return fail(f, 'motivo', 'Escribí el motivo del cambio.');
    var antes = { cantidad: c.cantidad == null ? null : c.cantidad, unidad: c.unidad || '', variedad: c.variedad || '' };
    c.cantidad = cant; c.unidad = e.uni.value; c.variedad = vari;
    (c.metaHist = c.metaHist || []).push({ ts: new Date().toISOString(), user: CM.db.cfg.operador, motivo: mot || 'Carga inicial', antes: antes, despues: { cantidad: cant, unidad: c.unidad, variedad: vari } });
    CM.audit('Cultivo: cantidad y variedad', c.id + ' · ' + (cant == null ? '—' : cant + ' ' + c.unidad) + ' · ' + (vari || '—') + (mot ? ' · ' + mot : '')); CM.save(); CM.modal.close(true); render(); CM.toast('Ciclo actualizado.');
  };
  CM.acts['cu-cerrar'] = function (t) {
    if (!CM.need('cultivo', 'admin')) return; var c = CM.cultivo(t.getAttribute('data-id')); if (!c) return;
    CM.modal.open({ title: 'Cerrar ciclo ' + c.id, body: '<p>Un ciclo cerrado no admite registros ni correcciones. Podés reabrirlo después (queda auditado).</p>', footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" data-act="cu-cerrar-ok" data-id="' + esc(c.id) + '">Cerrar ciclo</button>' });
  };
  CM.acts['cu-cerrar-ok'] = function (t) { var c = CM.cultivo(t.getAttribute('data-id')); if (!c || !CM.need('cultivo', 'admin')) return; c.estado = 'cerrado'; c.cierre = new Date().toISOString(); CM.audit('Cultivo: ciclo cerrado', c.id); CM.save(); CM.modal.close(true); render(); };
  CM.acts['cu-reabrir'] = function (t) { var c = CM.cultivo(t.getAttribute('data-id')); if (!c || !CM.need('cultivo', 'admin')) return; c.estado = 'activo'; delete c.cierre; CM.audit('Cultivo: ciclo reabierto', c.id); CM.save(); render(); };

  /* ---------- registros ---------- */
  function modalRegistro(c, r) {
    var h = CM.hoy(), v = r || { fecha: h, fase: '', ph: null, ec: null, h: null, temp: null, roph: null, roec: null, obs: '', enc: CM.db.cfg.operador || '' };
    var ds = diaSem(v.fecha, c.inicio), ult = CM.cultivoRegs(c.id).slice(-1)[0];
    if (!r && ult) v.fase = ult.fase;
    function inp(n, val, lab, ph) { return fl(lab, '<input class="in num" name="' + n + '" inputmode="decimal" autocomplete="off" placeholder="' + ph + '" value="' + (val == null ? '' : esc(String(val).replace('.', ','))) + '">'); }
    CM.modal.open({
      title: (r ? 'Corregir registro N° ' + r.n : 'Nuevo registro') + ' · ' + c.id, wide: true,
      body: '<form id="fCR" data-form="cr-guardar" class="f" autocomplete="off" novalidate><input type="hidden" name="cu" value="' + esc(c.id) + '"><input type="hidden" name="rid" value="' + esc(r ? r.id : '') + '">' +
        '<div class="f f2">' + fl('Fecha *', '<input class="in" type="date" id="crFecha" name="fecha" value="' + esc(v.fecha) + '" min="' + esc(c.inicio) + '" max="' + h + '">') +
        fl('Día y semana (se calculan solos)', '<input class="in" id="crDS" readonly tabindex="-1" value="Día ' + ds.dia + ' · Semana ' + ds.sem + '">') + '</div>' +
        '<div class="f f2">' + fl('Fase *', '<select class="in" name="fase"><option value="">Elegí la fase…</option>' + CM.FASES.map(function (x) { return opt(x, x, v.fase === x); }).join('') + '</select>') +
        fl('Encargado/a *', '<input class="in" name="enc" maxlength="60" list="crEnc" value="' + esc(v.enc) + '"><datalist id="crEnc">' + encargados().map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>') + '</div>' +
        '<fieldset><legend>Riego</legend><div class="f f2">' + inp('ph', v.ph, 'PH (0 a 14)', 'Ej.: 6,2') + inp('ec', v.ec, 'EC (mS/cm, 0 a 10)', 'Ej.: 1,4') + '</div></fieldset>' +
        '<div class="f f2">' + inp('h', v.h, 'H % (humedad, 0 a 100)', 'Ej.: 62') + inp('temp', v.temp, 'Temp °C (−10 a 60)', 'Ej.: 24') + '</div>' +
        '<fieldset><legend>R. Off (runoff)</legend><div class="f f2">' + inp('roph', v.roph, 'PH (0 a 14)', 'Ej.: 6,4') + inp('roec', v.roec, 'EC (mS/cm, 0 a 10)', 'Ej.: 1,6') + '</div></fieldset>' +
        fl('Observaciones', '<textarea class="in" name="obs" maxlength="300" style="min-height:60px">' + esc(v.obs || '') + '</textarea>') +
        (r ? fl('Motivo de la corrección *', '<input class="in" name="motivo" maxlength="160" placeholder="Ej.: error de tipeo en el PH">') : '') +
        '<p class="hint" style="margin:0">Las mediciones que no se tomaron ese día pueden quedar vacías (se ven con “—”). Los valores se validan por rango.</p><p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fCR">' + (r ? 'Guardar corrección' : 'Guardar registro') + '</button>'
    });
  }
  CM.acts['cr-nuevo'] = function (t) { var c = CM.cultivo(t.getAttribute('data-id')); if (!c || !CM.need('cultivo', 'oper')) return; if (c.estado !== 'activo') return CM.toast('El ciclo está cerrado.', true); modalRegistro(c, null); };
  CM.acts['cr-edit'] = function (t) {
    var r = (CM.db.cultReg || []).filter(function (x) { return x.id === t.getAttribute('data-id'); })[0], c = r && CM.cultivo(r.cu);
    if (!r || !c || !CM.need('cultivo', 'edit')) return; if (c.estado !== 'activo') return CM.toast('El ciclo está cerrado.', true); modalRegistro(c, r);
  };
  document.addEventListener('input', function (ev) {
    var t = ev.target; if (!t || t.id !== 'crFecha') return;
    var f = t.form, c = f && CM.cultivo(f.elements.cu.value), o = document.getElementById('crDS'); if (!c || !o) return;
    if (/^\d{4}-\d{2}-\d{2}$/.test(t.value) && t.value >= c.inicio) { var d = diaSem(t.value, c.inicio); o.value = 'Día ' + d.dia + ' · Semana ' + d.sem; } else o.value = '—';
  });
  function rango(f, name, lab, min, max) {
    var v = num(f.elements[name].value);
    if (v !== null && (isNaN(v) || v < min || v > max)) { fail(f, name, lab + ': escribí un número entre ' + String(min).replace('.', ',') + ' y ' + String(max).replace('.', ',') + ' (con coma o punto).'); return undefined; }
    return v;
  }
  CM.forms['cr-guardar'] = function (f) {
    var e = f.elements, c = CM.cultivo(e.cu.value);
    if (!c || !CM.need('cultivo', e.rid.value ? 'edit' : 'oper')) return;
    if (c.estado !== 'activo') return fail(f, 'fecha', 'El ciclo está cerrado.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha.value)) return fail(f, 'fecha', 'Elegí la fecha.');
    if (e.fecha.value < c.inicio) return fail(f, 'fecha', 'La fecha no puede ser anterior al inicio del ciclo (' + CM.fmtFecha(c.inicio) + ').');
    if (e.fecha.value > CM.hoy()) return fail(f, 'fecha', 'La fecha no puede ser futura.');
    if (CM.FASES.indexOf(e.fase.value) < 0) return fail(f, 'fase', 'Elegí la fase.');
    var enc = e.enc.value.trim().replace(/\s+/g, ' '); if (enc.length < 2) return fail(f, 'enc', 'Escribí quién es el/la encargado/a.');
    var ph = rango(f, 'ph', 'Riego PH', 0, 14); if (ph === undefined) return;
    var ec = rango(f, 'ec', 'Riego EC', 0, 10); if (ec === undefined) return;
    var hh = rango(f, 'h', 'H %', 0, 100); if (hh === undefined) return;
    var tp = rango(f, 'temp', 'Temp', -10, 60); if (tp === undefined) return;
    var rph = rango(f, 'roph', 'R. Off PH', 0, 14); if (rph === undefined) return;
    var rec = rango(f, 'roec', 'R. Off EC', 0, 10); if (rec === undefined) return;
    if ([ph, ec, hh, tp, rph, rec].every(function (x) { return x === null; }) && !e.obs.value.trim()) return fail(f, 'ph', 'Cargá al menos una medición o una observación.');
    var ds = diaSem(e.fecha.value, c.inicio), obs = e.obs.value.trim().slice(0, 300);
    var datos = { fecha: e.fecha.value, dia: ds.dia, sem: ds.sem, fase: e.fase.value, ph: ph, ec: ec, h: hh, temp: tp, roph: rph, roec: rec, obs: obs, enc: enc };
    if (e.rid.value) {
      var r = CM.db.cultReg.filter(function (x) { return x.id === e.rid.value; })[0]; if (!r || r.anulada) return;
      var mot = e.motivo.value.trim(); if (mot.length < 3) return fail(f, 'motivo', 'Escribí el motivo de la corrección.');
      var antes = {}; Object.keys(datos).forEach(function (k) { antes[k] = r[k]; });
      r.hist = r.hist || []; r.hist.push({ ts: new Date().toISOString(), user: CM.db.cfg.operador, motivo: mot, antes: antes });
      Object.keys(datos).forEach(function (k) { r[k] = datos[k]; });
      CM.audit('Cultivo: registro corregido', c.id + ' · N° ' + r.n + ' · ' + mot);
    } else {
      var n = CM.cultivoRegs(c.id, true).reduce(function (m, x) { return Math.max(m, x.n); }, 0) + 1;
      var nr = { id: CM.nextId('CR'), cu: c.id, n: n, ts: new Date().toISOString(), user: CM.db.cfg.operador, anulada: null, hist: [] };
      Object.keys(datos).forEach(function (k) { nr[k] = datos[k]; });
      CM.db.cultReg.push(nr);
      CM.audit('Cultivo: registro cargado', c.id + ' · N° ' + n + ' · ' + CM.fmtFecha(datos.fecha) + ' · ' + datos.fase);
    }
    CM.save(); CM.modal.close(true); render(); CM.toast('Registro guardado.');
  };
  CM.acts['cr-anular'] = function (t) {
    var r = (CM.db.cultReg || []).filter(function (x) { return x.id === t.getAttribute('data-id'); })[0], c = r && CM.cultivo(r.cu);
    if (!r || !c || !CM.need('cultivo', 'edit')) return; if (c.estado !== 'activo') return CM.toast('El ciclo está cerrado.', true);
    CM.modal.open({ title: 'Anular registro N° ' + r.n, body: '<form id="fCA" data-form="cr-anular" class="f" novalidate><input type="hidden" name="rid" value="' + esc(r.id) + '"><p>El registro queda visible tachado: no se borra.</p>' + fl('Motivo *', '<input class="in" name="motivo" maxlength="160">') + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn bad" type="submit" form="fCA">Anular registro</button>' });
  };
  CM.forms['cr-anular'] = function (f) {
    var r = CM.db.cultReg.filter(function (x) { return x.id === f.elements.rid.value; })[0], mot = f.elements.motivo.value.trim();
    if (!r || r.anulada || !CM.need('cultivo', 'edit')) return; if (mot.length < 3) return fail(f, 'motivo', 'Escribí el motivo.');
    r.anulada = { ts: new Date().toISOString(), user: CM.db.cfg.operador, motivo: mot }; CM.audit('Cultivo: registro anulado', r.cu + ' · N° ' + r.n + ' · ' + mot); CM.save(); CM.modal.close(true); render();
  };

  /* ---------- CSV, impresión ---------- */
  var CAB = ['N', 'Fecha', 'Dia', 'Semana', 'Fase', 'Riego PH', 'Riego EC', 'H%', 'Temp', 'R.Off PH', 'R.Off EC', 'Observaciones', 'Encargado', 'Estado'];
  CM.cultivoCsv = function (c) {
    return CM.csv(CAB, CM.cultivoRegs(c.id, true).map(function (r) {
      return [r.n, r.fecha, r.dia, r.sem, r.fase, r.ph, r.ec, r.h, r.temp, r.roph, r.roec, r.obs, r.enc, r.anulada ? 'Anulado: ' + r.anulada.motivo : 'Vigente'];
    }));
  };
  CM.cultivoNombreBase = function (c) { return 'Cultivo_' + c.id + '_' + String(c.lote).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30); };
  CM.acts['cu-csv'] = function (t) {
    var c = CM.cultivo(t.getAttribute('data-id')); if (!c || !CM.need('cultivo', 'ver')) return;
    CM.descargar(CM.cultivoNombreBase(c) + '_' + CM.hoy().replace(/-/g, '') + '.csv', CM.cultivoCsv(c));
    CM.audit('Exportación', 'CSV de planilla de cultivo ' + c.id); CM.save();
  };
  CM.acts['cu-print'] = function (t) {
    var c = CM.cultivo(t.getAttribute('data-id')); if (!c || !CM.need('cultivo', 'ver')) return;
    var regs = CM.cultivoRegs(c.id), hojas = Math.max(1, Math.ceil(regs.length / HOJA)), out = '<style>@page{size:letter landscape;margin:10mm}.cp{page-break-after:always;font-size:11px}.cp:last-child{page-break-after:auto}.cp table{width:100%;border-collapse:collapse}.cp th,.cp td{border:1px solid #111;padding:3px 4px;height:20px;color:#111}.cp th{background:#eee}</style>';
    for (var h = 0; h < hojas; h++) {
      var filas = '';
      for (var i = 0; i < HOJA; i++) {
        var r = regs[h * HOJA + i], n = h * HOJA + i + 1;
        filas += r ? '<tr><td>' + r.n + '</td><td>' + CM.fmtFecha(r.fecha) + '</td><td>' + r.dia + '</td><td>' + r.sem + '</td><td>' + esc(r.fase) + '</td><td>' + nf(r.ph) + '</td><td>' + nf(r.ec) + '</td><td>' + nf(r.h) + '</td><td>' + nf(r.temp) + '</td><td>' + nf(r.roph) + '</td><td>' + nf(r.roec) + '</td><td>' + esc(r.obs || '') + '</td><td>' + esc(r.enc) + '</td></tr>' : '<tr><td>' + n + '</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
      }
      out += '<div class="doc cp"><h1 style="margin:0 0 4px;font-size:16px">Planilla de seguimiento de cultivo · ' + esc(CM.db.ong.nombre) + '</h1><p style="margin:0 0 6px">Ciclo ' + esc(c.id) + ' · ' + esc(c.nombre) + ' · Lote / sala: ' + esc(c.lote) + ' · Inicio ' + CM.fmtFecha(c.inicio) + ' · Hoja ' + (h + 1) + ' de ' + hojas + ' · Impreso ' + CM.fmtFecha(CM.hoy()) + '</p>' +
        '<table><thead><tr><th rowspan="2">N°</th><th rowspan="2">FECHA</th><th rowspan="2">DÍA</th><th rowspan="2">SEMANA</th><th rowspan="2">FASE</th><th colspan="2">RIEGO</th><th rowspan="2">H%</th><th rowspan="2">TEMP</th><th colspan="2">R. OFF</th><th rowspan="2">OBSERVACIONES</th><th rowspan="2">ENCARGADO</th></tr><tr><th>PH</th><th>EC</th><th>PH</th><th>EC</th></tr></thead><tbody>' + filas + '</tbody></table></div>';
    }
    CM.imprimir(out); CM.audit('Impresión', 'Planilla de cultivo ' + c.id + ' (' + hojas + ' hoja/s)'); CM.save();
  };

  /* ---------- empezar de cero (borra los datos de ejemplo, conserva usuarios, ajustes y menú) ---------- */
  CM.vaciarDatos = function () {
    var d = CM.db, keep = { v: 1, cfg: 1, ong: 1, users: 1, perms: 1, rubros: 1, menu: 1, nube: 1, planes: 1, irubros: 1, org: 1, counters: 0, audit: 0 };
    Object.keys(d).forEach(function (k) {
      if (keep[k]) return;
      if (Array.isArray(d[k])) d[k] = []; else if (k === 'pacientes') d[k] = {}; else if (k === 'counters') d[k] = {};
    });
    d.pacientes = {}; d.counters = {}; d.audit = []; d.cultivos = []; d.cultReg = []; d.cupones = []; d.cuponUsos = [];
    if (d.menu) { d.menu.altas = []; d.menu.solicitudes = []; d.menu.turnos = []; d.menu.hcs = []; }
    d.cfg.ejemplo = false;
    CM.audit('Empezar de cero', 'Se borraron los datos de ejemplo (pacientes, lotes, donaciones, cajas, cultivo). Se conservaron usuarios, ajustes y menú.');
  };
  CM.acts['vaciar'] = function () {
    if (!CM.need('ajustes', 'admin')) return;
    CM.modal.open({ title: 'Empezar de cero', body: '<p>Se borran <b>todos los datos cargados</b> (pacientes, lotes, dispensaciones, donaciones, comprobantes, cajas, cultivo, tareas) y queda el sistema vacío para cargar los datos reales. Se conservan usuarios, permisos, ajustes y el menú público.</p><p class="hint">Hacé antes un respaldo en Importar / Exportar si querés guardar algo. Esta acción no se puede deshacer.</p>', footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn bad" data-act="vaciar-ok">Borrar y empezar de cero</button>' });
  };
  CM.acts['vaciar-ok'] = function () { if (!CM.need('ajustes', 'admin')) return; CM.vaciarDatos(); CM.save(); CM.modal.close(true); g.location.hash = '#/inicio'; render(); CM.toast('Listo: el sistema quedó vacío.'); };
  void tabs;
})(window);
