/* Cannabismatica I+D · Sistema ONG (demo v2) · Dashboard, Caja, Arqueo/Cierre y Cajas cerradas */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, $ = U.$, fl = U.fl, opt = U.opt, fail = U.fail, VIEWS = CM.VIEWS;
  var render = function () { CM.render(); };

  CM.need = function (mod, lvl) {
    if (CM.can(mod, lvl)) return true;
    CM.toast('Tu rol (' + CM.ROLES[CM.db.cfg.rol] + ') no tiene permiso para esta acción.', true);
    return false;
  };
  function money(c) { return CM.fmtMoney(c); }
  function pillDif(d) {
    if (d === 0) return '<span class="pill p-ok">Sin diferencia</span>';
    return d > 0 ? '<span class="pill p-warn">Sobrante ' + esc(money(d)) + '</span>' : '<span class="pill p-bad">Faltante ' + esc(money(-d)) + '</span>';
  }
  function medioL(k) { return CM.MEDIOS[k] || k; }
  function pageH(t, p, extra) { return '<div class="page-h"><div><h1>' + esc(t) + '</h1><p>' + p + '</p></div>' + (extra || '') + '</div>'; }
  function tipoL(t) { return { ingreso: 'Ingreso', egreso: 'Egreso', retiro: 'Retiro', reintegro: 'Reintegro' }[t] || t; }

  /* ===================================================================
     DASHBOARD
     =================================================================== */
  CM.dash = { per: '30', desde: '', hasta: '', medio: '', fc: '' };
  function rangoDash() {
    var f = CM.dash, h = CM.hoy();
    if (f.per === 'mes') return [h.slice(0, 7) + '-01', h];
    if (f.per === 'todo') return ['0000-00-00', '9999-99-99'];
    if (f.per === 'custom') return [f.desde || '0000-00-00', f.hasta || h];
    return [CM.addDays(h, -(+f.per - 1)), h];
  }
  function datosDash() {
    var db = CM.db, r = rangoDash(), f = CM.dash;
    var aps = db.aportes.filter(function (a) {
      if (a.fecha < r[0] || a.fecha > r[1]) return false;
      if (f.medio && a.medio !== f.medio) return false;
      var c = a.comp ? CM.comp(a.comp) : null, fc = !!(c && !c.anulado);
      if (f.fc === 'con' && !fc) return false;
      if (f.fc === 'sin' && fc) return false;
      return true;
    });
    var ok = aps.filter(function (a) { return a.estado === 'registrado'; });
    var anul = aps.filter(function (a) { return a.estado === 'anulado'; });
    var sum = function (arr) { return arr.reduce(function (s, a) { return s + a.cent; }, 0); };
    var disp = db.disp.filter(function (d) { return !d.anulada && d.fecha >= r[0] && d.fecha <= r[1]; });
    var porUn = {}; disp.forEach(function (d) { porUn[d.unidad] = (porUn[d.unidad] || 0) + d.cant; });
    var eg = 0;
    db.cajas.forEach(function (c) {
      CM.cajaMovs(c).forEach(function (m) { if (m.tipo !== 'ingreso' && (c.estado === 'cerrada' ? c.cierre.fecha : (m.ts || '').slice(0, 10)) >= r[0] && (c.estado === 'cerrada' ? c.cierre.fecha : (m.ts || '').slice(0, 10)) <= r[1]) eg += m.cent; });
    });
    var memb = db.membresias.filter(function (m) { return CM.estadoMemb(m) === 'activa'; }).length;
    var sellos = db.sellos.filter(function (s) { return s.tipo === 'sello' && s.fecha >= r[0] && s.fecha <= r[1]; }).length;
    return { r: r, aps: ok, anul: anul, tot: sum(ok), anulTot: sum(anul), disp: disp, porUn: porUn, eg: eg, memb: memb, sellos: sellos };
  }
  function serie(D) {
    var r = D.r, h = CM.hoy(), dias = [], ini = r[0], fin = r[1] > h ? h : r[1];
    if (ini === '0000-00-00') {
      var min = D.aps.concat(D.anul).map(function (a) { return a.fecha; }).concat(D.disp.map(function (d) { return d.fecha; })).sort()[0] || h;
      ini = min;
    }
    if (CM.diffDays(ini, fin) > 62) { // por mes
      var mm = {}; D.aps.forEach(function (a) { var k = a.fecha.slice(0, 7); mm[k] = (mm[k] || 0) + a.cent; });
      Object.keys(mm).sort().forEach(function (k) { dias.push({ l: k.slice(5) + '/' + k.slice(2, 4), c: mm[k], t: k.slice(5) + '/' + k.slice(0, 4) }); });
      return { items: dias, tipo: 'mes' };
    }
    for (var f = ini; f <= fin; f = CM.addDays(f, 1)) {
      var c = 0; D.aps.forEach(function (a) { if (a.fecha === f) c += a.cent; });
      dias.push({ l: f.slice(8), c: c, t: CM.fmtFecha(f) });
    }
    return { items: dias, tipo: 'dia' };
  }
  function hbars(rows, fmt) {
    var max = 1; rows.forEach(function (r) { if (r[1] > max) max = r[1]; });
    return rows.map(function (r) {
      return '<div class="hb"><span>' + esc(r[0]) + '</span><i style="width:' + Math.max(2, Math.round(r[1] / max * 100)) + '%"></i><em>' + esc(fmt ? fmt(r[1]) : r[1]) + '</em></div>';
    }).join('');
  }
  VIEWS.dashboard = function () {
    var db = CM.db, f = CM.dash, D = datosDash(), h = CM.hoy();
    var sinDatos = !D.aps.length && !D.disp.length;
    var ab = CM.cajaAbierta(), tcaja = ab ? CM.totCaja(ab) : null;
    var S = serie(D);
    var max = 1; S.items.forEach(function (x) { if (x.c > max) max = x.c; });
    var bars = S.items.map(function (x) { return '<div class="b" style="height:' + Math.max(3, Math.round(x.c / max * 100)) + '%" title="' + esc(x.t + ': ' + money(x.c)) + '"></div>'; }).join('');
    var axis = S.items.map(function (x, i) { return '<span>' + (S.items.length > 20 && i % 2 ? '' : esc(x.l)) + '</span>'; }).join('');
    var porMedio = {}; D.aps.forEach(function (a) { porMedio[a.medio] = (porMedio[a.medio] || 0) + a.cent; });
    var porConc = {}; D.aps.forEach(function (a) { porConc[a.concepto] = (porConc[a.concepto] || 0) + a.cent; });
    var porProd = {}; D.disp.forEach(function (d) { porProd[CM.PRODUCTOS[d.prod].n] = (porProd[CM.PRODUCTOS[d.prod].n] || 0) + 1; });
    var porLote = {}; D.disp.forEach(function (d) { var k = d.nombre + ' (' + U.uTxt(d.unidad, 2) + ')'; porLote[k] = (porLote[k] || 0) + d.cant; });
    var topLotes = Object.keys(porLote).map(function (k) { return [k, Math.round(porLote[k] * 100) / 100]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
    var reps = { valido: 0, vencido: 0, tramite: 0, sin: 0 };
    Object.keys(db.pacientes).forEach(function (k) { reps[CM.estadoRep(db.pacientes[k].reprocann).k]++; });
    var bajos = db.lotes.filter(function (l) { return CM.stockLote(l.id) <= l.min; }).length;
    var conFC = D.aps.filter(function (a) { var c = a.comp ? CM.comp(a.comp) : null; return c && !c.anulado; }).reduce(function (s, a) { return s + a.cent; }, 0);
    var prom = D.aps.length ? Math.round(D.tot / D.aps.length) : 0;
    var res = D.tot - D.eg;
    var gTxt = Object.keys(D.porUn).map(function (u) { return U.cantTxt(Math.round(D.porUn[u] * 100) / 100, u); }).join(' · ') || '—';
    var filtros = 'Período: ' + (f.per === 'custom' ? CM.fmtFecha(D.r[0]) + ' a ' + CM.fmtFecha(D.r[1]) : { 7: 'últimos 7 días', 30: 'últimos 30 días', 90: 'últimos 90 días', mes: 'mes en curso', todo: 'todo el historial' }[f.per]) + ' · Medio: ' + (f.medio ? medioL(f.medio) : 'todos') + ' · Factura C: ' + ({ '': 'todas', con: 'sólo con Factura C', sin: 'sólo sin Factura C' }[f.fc]);
    var tbl = '<div class="tw"><table><caption class="sr">Donaciones por ' + (S.tipo === 'mes' ? 'mes' : 'día') + ' del período</caption><thead><tr><th>' + (S.tipo === 'mes' ? 'Mes' : 'Fecha') + '</th><th class="n">Donaciones registrados</th></tr></thead><tbody>' + S.items.map(function (x) { return '<tr><td>' + esc(x.t) + '</td><td class="n">' + esc(money(x.c)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return pageH('Dashboard', 'Indicadores de la ONG calculados con los datos guardados en este navegador. Todos los importes son de ejemplo.',
      '<div class="row"><button class="btn sm" data-act="dash-csv">' + CM.icon('dl') + 'Exportar CSV</button></div>') +
      '<section class="card" aria-label="Filtros"><div class="row">' +
      '<label class="sr" for="dbPer">Período</label><select id="dbPer" class="in fx">' + opt('7', 'Últimos 7 días', f.per === '7') + opt('30', 'Últimos 30 días', f.per === '30') + opt('90', 'Últimos 90 días', f.per === '90') + opt('mes', 'Mes en curso', f.per === 'mes') + opt('todo', 'Todo el historial', f.per === 'todo') + opt('custom', 'Rango personalizado…', f.per === 'custom') + '</select>' +
      (f.per === 'custom' ? '<label class="sr" for="dbD">Desde</label><input id="dbD" type="date" class="in fx" value="' + esc(f.desde) + '"><label class="sr" for="dbH">Hasta</label><input id="dbH" type="date" class="in fx" value="' + esc(f.hasta) + '">' : '') +
      '<label class="sr" for="dbMed">Medio de la donación</label><select id="dbMed" class="in fx">' + opt('', 'Todos los medios', !f.medio) + Object.keys(CM.MEDIOS).map(function (k) { return opt(k, CM.MEDIOS[k], f.medio === k); }).join('') + '</select>' +
      '<label class="sr" for="dbFc">Con o sin Factura C</label><select id="dbFc" class="in fx">' + opt('', 'Con y sin Factura C', !f.fc) + opt('con', 'Sólo con Factura C (simulada)', f.fc === 'con') + opt('sin', 'Sólo sin Factura C', f.fc === 'sin') + '</select>' +
      '<button class="btn sm" data-act="dash-reset">Restablecer</button></div>' +
      '<p class="hint" style="margin:10px 0 0">Filtros aplicados → ' + esc(filtros) + ' · Actualizado: ' + esc(CM.fmtFH(new Date())) + ' (hora de Salta) · Estado: datos locales de este navegador</p></section>' +
      (sinDatos ? '<div class="note warn" style="margin-top:14px">Sin datos suficientes para este filtro. Ampliá el período o quitá filtros.</div>' : '') +
      '<div class="grid g4" style="margin-top:14px">' +
      '<div class="card kpi"><div class="l">Donaciones voluntarias</div><div class="v">' + esc(money(D.tot)) + '</div><div class="s">' + D.aps.length + ' donaciones · promedio ' + esc(money(prom)) + '</div></div>' +
      '<div class="card kpi"><div class="l">Dispensaciones</div><div class="v">' + D.disp.length + '</div><div class="s">' + esc(gTxt) + '</div></div>' +
      '<div class="card kpi"><div class="l">Egresos de caja</div><div class="v">' + esc(money(D.eg)) + '</div><div class="s">Egresos, retiros y reintegros</div></div>' +
      '<div class="card kpi"><div class="l">Resultado de caja estimado</div><div class="v">' + esc(money(res)) + '</div><div class="s">Donaciones − egresos. No es ganancia neta: faltan impuestos y otros costos.</div></div></div>' +
      '<div class="grid g2" style="margin-top:14px"><section class="card"><h2>Donaciones por ' + (S.tipo === 'mes' ? 'mes' : 'día') + '</h2>' +
      (S.items.length ? '<div class="bars" role="img" aria-label="Donaciones por ' + (S.tipo === 'mes' ? 'mes' : 'día') + ' en el período; el máximo es ' + esc(money(max)) + '">' + bars + '</div><div class="axis" aria-hidden="true">' + axis + '</div>' : '<div class="empty">Sin datos suficientes</div>') +
      '<details style="margin-top:12px"><summary>Ver tabla equivalente</summary>' + tbl + '</details></section>' +
      '<section class="card"><h2>Donaciones por medio</h2>' + (Object.keys(porMedio).length ? hbars(Object.keys(porMedio).map(function (k) { return [medioL(k), porMedio[k]]; }), money) : '<div class="empty">Sin donacións en el período</div>') +
      '<h3 style="margin-top:14px">Con y sin Factura C</h3>' + hbars([['Con Factura C (simulada)', conFC], ['Sin Factura C', D.tot - conFC]], money) +
      '<h3 style="margin-top:14px">Por concepto</h3>' + (Object.keys(porConc).length ? hbars(Object.keys(porConc).map(function (k) { return [k, porConc[k]]; }), money) : '<div class="empty">—</div>') + '</section></div>' +
      '<div class="grid g3" style="margin-top:14px"><section class="card"><h2>Dispensaciones por preparado</h2>' + (Object.keys(porProd).length ? hbars(Object.keys(porProd).map(function (k) { return [k, porProd[k]]; })) : '<div class="empty">Sin dispensaciones</div>') + '<h3 style="margin-top:14px">Lotes más entregados</h3>' + (topLotes.length ? hbars(topLotes, function (v) { return CM.fmtNum(v); }) : '<div class="empty">—</div>') + '</section>' +
      '<section class="card"><h2>Pacientes y REPROCANN</h2>' + hbars([['Válidos', reps.valido], ['En trámite', reps.tramite], ['Vencidos', reps.vencido], ['Sin REPROCANN', reps.sin]]) +
      '<div class="kv" style="margin-top:12px"><div><small>Socios con cuota activa</small><b>' + D.memb + '</b></div><div><small>Sellos otorgados (período)</small><b>' + D.sellos + '</b></div></div></section>' +
      '<section class="card"><h2>Caja y stock</h2><div class="kv"><div><small>Caja de hoy</small><b>' + (ab ? 'Abierta' : 'Sin abrir') + '</b></div><div><small>Efectivo esperado</small><b>' + (tcaja ? esc(money(tcaja.esperadoEf)) : '—') + '</b></div><div><small>Lotes con stock bajo</small><b>' + bajos + '</b></div><div><small>Donaciones anulados</small><b>' + D.anul.length + ' · ' + esc(money(D.anulTot)) + '</b></div></div></section></div>' +
      '<section class="card" style="margin-top:14px"><h2>Cómo se calcula cada indicador</h2><details><summary>Ver fórmulas y criterios</summary><ul style="color:var(--mu);margin:10px 0 0;padding-left:20px"><li><b>Donaciones voluntarias</b> = suma de los aportes en estado «registrado» dentro del período y de los filtros. Los anulados no suman y se muestran aparte.</li><li><b>Promedio</b> = aportes ÷ cantidad de aportes (si es cero, se muestra $ 0).</li><li><b>Egresos de caja</b> = egresos + retiros + reintegros de las cajas del período, con rubro financiero asignado.</li><li><b>Resultado de caja estimado</b> = aportes − egresos de caja. No incluye impuestos, honorarios fuera de caja ni otros costos: no es ganancia neta.</li><li><b>Con / sin Factura C</b> separa los aportes con comprobante simulado vigente de los que no lo tienen. La Factura C simulada no tiene validez fiscal.</li><li>Los datos del sistema son de ejemplo y se guardan sólo en este navegador.</li></ul></details></section>';
  };
  document.addEventListener('change', function (ev) {
    var t = ev.target, f = CM.dash;
    if (t.id === 'dbPer') { f.per = t.value; if (f.per === 'custom' && !f.desde) { f.desde = CM.addDays(CM.hoy(), -30); f.hasta = CM.hoy(); } render(); }
    else if (t.id === 'dbD') { f.desde = t.value; render(); }
    else if (t.id === 'dbH') { f.hasta = t.value; render(); }
    else if (t.id === 'dbMed') { f.medio = t.value; render(); }
    else if (t.id === 'dbFc') { f.fc = t.value; render(); }
  });
  CM.acts['dash-reset'] = function () { CM.dash = { per: '30', desde: '', hasta: '', medio: '', fc: '' }; render(); };
  CM.acts['dash-csv'] = function () {
    var D = datosDash();
    CM.descargar('dashboard_' + CM.hoy() + '.csv', CM.csv(['Fecha', 'Legajo', 'Documento', 'Concepto', 'Medio', 'Importe', 'Factura C'], D.aps.map(function (a) { var c = a.comp ? CM.comp(a.comp) : null; return [a.fecha, CM.quienDe(a).pac ? CM.legDe(a.dni) : '', CM.quienDe(a).doc, a.concepto, medioL(a.medio), (a.cent / 100).toFixed(2).replace('.', ','), c && !c.anulado ? c.pv + '-' + c.nro : 'Sin']; })));
  };

  /* ===================================================================
     CAJA
     =================================================================== */
  VIEWS.caja = function () {
    var ab = CM.cajaAbierta(), alertas = CM.diasSinCaja();
    var head = pageH('Caja', 'Efectivo y movimientos del día. Todo ingreso o egreso lleva un <b>rubro financiero obligatorio</b>. Las donaciones registradas entran solos a la caja abierta.',
      '<div class="row">' + (ab ? '<a class="btn pri" href="#/cierre">' + CM.icon('lock') + 'Ir al arqueo y cierre</a>' : '<button class="btn pri" data-act="caja-abrir">' + CM.icon('plus') + 'Abrir caja</button>') + '</div>');
    var al = alertas.length ? '<div class="note warn" style="margin-bottom:14px"><b>Días con aportes y sin caja cerrada:</b> ' + alertas.map(function (a) { return esc(CM.fmtFecha(a.fecha)) + ' (' + esc(money(a.cent)) + ')'; }).join(', ') + '. Revisalos en <a href="#/cajas-cerradas">Cajas cerradas</a>.</div>' : '';
    if (!ab) {
      var ult = CM.db.cajas.filter(function (c) { return c.estado === 'cerrada'; }).pop();
      return head + al + '<section class="card"><h2>No hay una caja abierta</h2><p style="color:var(--mu)">Abrí la caja con el fondo inicial en efectivo para registrar ingresos, egresos, retiros y reintegros. Los aportes que se carguen quedan asociados a la caja abierta.</p>' +
        (ult ? '<div class="kv"><div><small>Última caja cerrada</small><b>' + esc(CM.fmtFecha(ult.cierre.fecha)) + ' · ' + esc(ult.id) + '</b></div><div><small>Resultado del arqueo</small><b>' + pillDif(ult.cierre.dif) + '</b></div></div>' : '') + '</section>';
    }
    var movs = CM.cajaMovs(ab), t = CM.totCaja(ab, movs);
    var medios = Object.keys(t.porMedio).map(function (k) { return [medioL(k), t.porMedio[k]]; });
    var bot = '<div class="row" style="margin:14px 0"><button class="btn" data-act="caja-mov" data-tipo="ingreso">' + CM.icon('plus') + 'Ingreso de efectivo</button><button class="btn" data-act="caja-mov" data-tipo="egreso">Egreso de efectivo</button><button class="btn" data-act="caja-mov" data-tipo="retiro">Retiro</button><button class="btn" data-act="caja-mov" data-tipo="reintegro">Reintegro</button></div>';
    return head + al +
      '<div class="grid g4"><div class="card kpi"><div class="l">Fondo inicial · ' + esc(ab.id) + '</div><div class="v">' + esc(money(ab.inicial)) + '</div><div class="s">Abrió ' + esc(ab.apUser) + ' el ' + esc(CM.fmtFecha(ab.fecha)) + '</div></div>' +
      '<div class="card kpi"><div class="l">Ingresos</div><div class="v">' + esc(money(t.ingresos)) + '</div><div class="s">Donaciones y otros ingresos</div></div>' +
      '<div class="card kpi"><div class="l">Egresos, retiros y reintegros</div><div class="v">' + esc(money(t.egresos)) + '</div><div class="s">Con rubro y motivo</div></div>' +
      '<div class="card kpi"><div class="l">Efectivo esperado en caja</div><div class="v">' + esc(money(t.esperadoEf)) + '</div><div class="s">Fondo + ingresos − egresos, sólo efectivo</div></div></div>' + bot +
      '<div class="grid g2"><section class="card"><h2>Movimientos de la caja</h2>' + (movs.length ? '<div class="tw"><table><thead><tr><th>Hora</th><th>Tipo</th><th>Rubro financiero</th><th>Detalle</th><th>Medio</th><th class="n">Importe</th><th></th></tr></thead><tbody>' + movs.map(function (m) {
        return '<tr><td>' + esc(CM.fmtFH(m.ts).slice(-5)) + '</td><td>' + esc(tipoL(m.tipo)) + '</td><td>' + esc(m.rubroN) + '</td><td>' + esc(m.motivo) + (m.derivado ? ' <span class="pill p-info">Donación</span>' : '') + '</td><td>' + esc(medioL(m.medio)) + '</td><td class="n">' + (m.tipo === 'ingreso' ? '' : '− ') + esc(money(m.cent)) + '</td><td>' + (m.derivado ? '' : '<button class="btn sm" data-act="caja-corregir" data-id="' + esc(m.id) + '" aria-label="Corregir con contraasiento">Corregir</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : U.tablaVacia('Todavía no hay movimientos.')) + '</section>' +
      '<section class="card"><h2>Ingresos por medio</h2>' + (medios.length ? hbars(medios, money) : '<div class="empty">Sin ingresos</div>') + '<p class="hint">Sólo el efectivo entra al arqueo. Transferencias y Mercado Pago se concilian aparte.</p><div class="note info">Los movimientos no se editan ni se borran: «Corregir» agrega un contraasiento con rubro y motivo, y queda en la auditoría.</div></section></div>';
  };
  CM.acts['caja-abrir'] = function () {
    if (!CM.need('caja', 'oper')) return;
    CM.modal.open({
      title: 'Abrir caja', body: '<form id="fCA" data-form="caja-abrir" class="f" autocomplete="off" novalidate><p style="margin:0;color:var(--mu)">Contá el efectivo con el que arranca la caja.</p>' +
        fl('Fondo inicial en efectivo (en pesos) *', '<input class="in num" name="ini" inputmode="decimal" placeholder="0" style="font-size:20px">') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fCA">Abrir caja</button>'
    });
  };
  CM.forms['caja-abrir'] = function (f) {
    if (CM.cajaAbierta()) return fail(f, 'ini', 'Ya hay una caja abierta.');
    var c = CM.parseMonto(f.elements.ini.value);
    if (isNaN(c)) return fail(f, 'ini', 'Escribí el fondo inicial (puede ser 0 si empieza vacía: escribí 0).');
    var sc = CM.siguienteCaja(), n = sc.nro;
    var caja = { id: sc.id, nro: n, fecha: CM.hoy(), estado: 'abierta', apTs: new Date().toISOString(), apUser: CM.db.cfg.operador, inicial: c, cierre: null };
    CM.db.cajas.push(caja); CM.audit('Apertura de caja', caja.id + ' · fondo ' + money(c)); CM.save(); CM.modal.close(true); render(); CM.toast('Caja abierta.');
  };
  var TIT = { ingreso: 'Ingreso de efectivo', egreso: 'Egreso de efectivo', retiro: 'Retiro de efectivo', reintegro: 'Reintegro' };
  CM.acts['caja-mov'] = function (t) {
    if (!CM.need('caja', 'oper')) return;
    if (!CM.cajaAbierta()) { CM.toast('Abrí la caja primero.', true); return; }
    modalMov(t.getAttribute('data-tipo'), '', null);
  };
  function modalMov(tipo, rubroSug, base) {
    var rs = CM.rubrosPara(tipo);
    CM.modal.open({
      title: TIT[tipo], body: '<form id="fCM" data-form="caja-mov" class="f" autocomplete="off" novalidate><input type="hidden" name="tipo" value="' + esc(tipo) + '">' +
        (base ? '<div class="note info">Contraasiento de ' + esc(base.id) + ': ' + esc(base.motivo) + '</div>' : '') +
        fl('Rubro financiero * (obligatorio)', '<select class="in" name="rubro"><option value="">Elegí un rubro…</option>' + rs.map(function (r) { return opt(r.id, r.n, r.id === rubroSug); }).join('') + '</select>') +
        fl('Importe (en pesos) *', '<input class="in num" name="importe" inputmode="decimal" placeholder="0" style="font-size:20px">') +
        fl(tipo === 'ingreso' ? 'Detalle (opcional)' : 'Motivo *', '<input class="in" name="motivo" placeholder="' + (tipo === 'ingreso' ? 'Ej.: inscripción a un taller' : 'Ej.: reposición de envases') + '">') +
        '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fCM">Registrar</button>'
    });
  }
  CM.forms['caja-mov'] = function (f) {
    var e = f.elements, cent = CM.parseMonto(e.importe.value);
    if (isNaN(cent) || cent <= 0) return fail(f, 'importe', 'Escribí un importe mayor que cero.');
    var r = CM.addCMov({ tipo: e.tipo.value, cent: cent, rubroId: e.rubro.value, motivo: e.motivo.value });
    if (r.err) return fail(f, /rubro/i.test(r.err) ? 'rubro' : (/motivo/i.test(r.err) ? 'motivo' : 'importe'), r.err);
    CM.audit('Movimiento de caja', tipoL(e.tipo.value) + ' · ' + money(cent) + ' · rubro ' + r.ok.rubroN + ' · ' + r.ok.id);
    CM.save(); CM.modal.close(true); render(); CM.toast('Movimiento registrado.');
  };
  CM.acts['caja-corregir'] = function (t) {
    if (!CM.need('caja', 'edit')) return;
    var m = CM.db.cmovs.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]; if (!m) return;
    var inv = m.tipo === 'ingreso' ? 'egreso' : 'ingreso';
    modalMov(inv, m.rubroId, m);
  };

  /* ===================================================================
     ARQUEO / CIERRE
     =================================================================== */
  var DEN = [20000, 10000, 2000, 1000, 500, 200, 100, 50, 20, 10];
  VIEWS.cierre = function () {
    var ab = CM.cajaAbierta();
    var head = pageH('Arqueo y cierre de caja', 'Contá el efectivo, compará con lo esperado y cerrá. El cierre queda <b>sellado y congelado</b>.');
    if (!ab) return head + '<section class="card"><h2>No hay una caja abierta</h2><p style="color:var(--mu)">Abrí la caja desde <a href="#/caja">Caja</a> para poder hacer el arqueo.</p></section>';
    var t = CM.totCaja(ab);
    return head + '<div class="grid g2"><section class="card"><h2>Resumen de ' + esc(ab.id) + '</h2><div class="kv"><div><small>Fondo inicial</small><b>' + esc(money(ab.inicial)) + '</b></div><div><small>Ingresos</small><b>' + esc(money(t.ingresos)) + '</b></div><div><small>Egresos, retiros, reintegros</small><b>' + esc(money(t.egresos)) + '</b></div><div><small>Efectivo esperado</small><b id="arEsp" data-v="' + t.esperadoEf + '">' + esc(money(t.esperadoEf)) + '</b></div></div>' +
      '<h3 style="margin-top:16px">Ingresos por medio</h3>' + (Object.keys(t.porMedio).length ? hbars(Object.keys(t.porMedio).map(function (k) { return [medioL(k), t.porMedio[k]]; }), money) : '<div class="empty">Sin ingresos</div>') +
      '<h3 style="margin-top:16px">Con Factura C / sin Factura C</h3>' + hbars([['Donaciones con Factura C (simulada)', t.conFC], ['Donaciones sin Factura C', t.sinFC]], money) + '</section>' +
      '<form class="card f" data-form="cierre" autocomplete="off" novalidate><h2>Recuento de efectivo</h2><p class="hint" style="margin:0">Cargá la cantidad de billetes y monedas de cada tipo, o escribí el total contado.</p>' +
      '<div class="den">' + DEN.map(function (d) { return '<label class="fl"><span>' + esc(money(d * 100)) + '</span><input class="in num dn" data-d="' + d + '" inputmode="numeric" placeholder="0" aria-label="Cantidad de billetes o monedas de ' + d + ' pesos"></label>'; }).join('') + '</div>' +
      fl('…o total contado directamente (en pesos)', '<input class="in num" id="arTot" name="tot" inputmode="decimal" placeholder="0">') +
      '<div class="card flat" aria-live="polite"><div class="row sp"><span>Efectivo declarado</span><b id="arDec">Escribí el recuento</b></div><div class="row sp"><span>Diferencia</span><b id="arDif">—</b></div></div>' +
      fl('Observaciones (obligatorias si hay diferencia)', '<textarea class="in" name="obs" placeholder="Ej.: faltante de billetes chicos"></textarea>') +
      '<p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">' + CM.icon('lock') + 'Cerrar caja y sellar</button></div></form></div>';
  };
  function recalcArqueo() {
    var esp = $('#arEsp'); if (!esp) return;
    var tot = $('#arTot'), suma = 0, alguno = false;
    document.querySelectorAll('.dn').forEach(function (i) { var n = parseInt(i.value, 10); if (!isNaN(n) && n > 0) { suma += n * (+i.getAttribute('data-d')); alguno = true; } });
    var dec = null;
    if (tot.value.trim()) { var c = CM.parseMonto(tot.value); if (!isNaN(c)) dec = c; } else if (alguno) dec = suma * 100;
    var out = $('#arDec'), dif = $('#arDif');
    if (dec === null) { out.textContent = 'Escribí el recuento'; dif.innerHTML = '—'; return; }
    out.textContent = money(dec);
    dif.innerHTML = pillDif(dec - (+esp.getAttribute('data-v')));
  }
  document.addEventListener('input', function (ev) { var t = ev.target; if (t.classList && (t.classList.contains('dn') || t.id === 'arTot')) recalcArqueo(); });
  CM.forms.cierre = function (f) {
    if (!CM.need('cierre', 'admin')) return;
    var ab = CM.cajaAbierta(); if (!ab) return fail(f, 'tot', 'No hay caja abierta.');
    var e = f.elements, dec = null, suma = 0, alguno = false;
    document.querySelectorAll('.dn').forEach(function (i) { var n = parseInt(i.value, 10); if (!isNaN(n) && n > 0) { suma += n * (+i.getAttribute('data-d')); alguno = true; } });
    if (e.tot.value.trim()) { dec = CM.parseMonto(e.tot.value); if (isNaN(dec)) return fail(f, 'tot', 'El total contado no es un importe válido.'); } else if (alguno) dec = suma * 100;
    if (dec === null) return fail(f, 'tot', 'Escribí el recuento del efectivo (si no hay efectivo, escribí 0 en el total).');
    var t = CM.totCaja(ab), dif = dec - t.esperadoEf, obs = e.obs.value.trim();
    if (dif !== 0 && obs.length < 4) return fail(f, 'obs', 'Hay diferencia de ' + money(Math.abs(dif)) + ': explicá el motivo en observaciones.');
    CM.modal.open({
      title: 'Confirmar cierre de caja', body: '<p>Vas a cerrar <b>' + esc(ab.id) + '</b>. Esperado ' + esc(money(t.esperadoEf)) + ' · declarado ' + esc(money(dec)) + ' · ' + pillDif(dif) + '</p><div class="note warn">El cierre se congela con un sello SHA-256. No se puede editar ni borrar; sólo se pueden agregar notas de auditoría.</div>',
      footer: '<button class="btn" data-act="modal-close">Volver</button><button class="btn pri" data-act="cierre-ok" data-dec="' + dec + '" data-obs="' + esc(obs) + '">Sí, cerrar y sellar</button>'
    });
  };
  CM.acts['cierre-ok'] = function (t) {
    var ab = CM.cajaAbierta(); if (!ab || !CM.need('cierre', 'admin')) return;
    var c = CM.cerrarCaja(ab, parseInt(t.getAttribute('data-dec'), 10), t.getAttribute('data-obs'));
    CM.audit('Cierre de caja', ab.id + ' · declarado ' + money(c.declaradoEf) + ' · dif ' + money(c.dif) + ' · sello ' + c.hash.slice(0, 12));
    CM.save(); CM.modal.close(true); CM.cc.sel = ab.id; g.location.hash = '#/cajas-cerradas'; render(); verCierre(ab.id); CM.toast('Caja cerrada y sellada.');
  };

  /* ===================================================================
     CAJAS CERRADAS
     =================================================================== */
  CM.cc = { desde: '', hasta: '', user: '', dif: '', vista: 'lista', mes: '', sel: '' };
  function cerradas() {
    var f = CM.cc;
    return CM.db.cajas.filter(function (c) { return c.estado === 'cerrada' && c.cierre; }).filter(function (c) {
      var x = c.cierre;
      if (f.desde && x.fecha < f.desde) return false;
      if (f.hasta && x.fecha > f.hasta) return false;
      if (f.user && x.user !== f.user) return false;
      if (f.dif === 'con' && x.dif === 0) return false;
      if (f.dif === 'sin' && x.dif !== 0) return false;
      return true;
    }).sort(function (a, b) { return b.cierre.ts.localeCompare(a.cierre.ts); });
  }
  VIEWS['cajas-cerradas'] = function () {
    var f = CM.cc, arr = cerradas(), alertas = CM.diasSinCaja();
    var users = {}; CM.db.cajas.forEach(function (c) { if (c.cierre) users[c.cierre.user] = 1; });
    var conDif = arr.filter(function (c) { return c.cierre.dif !== 0; }).length;
    var lista = arr.length ? '<div class="tw"><table><thead><tr><th>Caja</th><th>Fecha</th><th>Cerró</th><th class="n">Esperado</th><th class="n">Declarado</th><th>Resultado</th><th>Sello</th><th></th></tr></thead><tbody>' + arr.map(function (c) {
      var x = c.cierre, ok = CM.verificarCierre(x);
      return '<tr><td>' + esc(c.id) + '</td><td>' + esc(CM.fmtFecha(x.fecha)) + '</td><td>' + esc(x.user) + '</td><td class="n">' + esc(money(x.esperadoEf)) + '</td><td class="n">' + esc(money(x.declaradoEf)) + '</td><td>' + pillDif(x.dif) + '</td><td><code>' + esc(x.hash.slice(0, 8)) + '</code> ' + (ok ? '<span class="pill p-ok">Íntegro</span>' : '<span class="pill p-bad">Alterado</span>') + '</td><td><button class="btn sm" data-act="cc-ver" data-id="' + esc(c.id) + '">Ver detalle</button></td></tr>';
    }).join('') + '</tbody></table></div>' : U.tablaVacia('No hay cajas cerradas con ese filtro.');
    return pageH('Cajas cerradas', 'Historial inmutable de cierres. Cada uno guarda una foto de la caja con su sello de integridad.',
      '<div class="row"><button class="btn sm" data-act="cc-csv">' + CM.icon('dl') + 'Exportar CSV</button></div>') +
      (alertas.length ? '<div class="note bad" style="margin-bottom:14px"><b>Alerta:</b> hay ' + alertas.length + ' día(s) con donaciones registradas y sin caja cerrada: ' + alertas.map(function (a) { return esc(CM.fmtFecha(a.fecha)) + ' (' + esc(money(a.cent)) + ')'; }).join(', ') + '.</div>' : '<div class="note ok" style="margin-bottom:14px">Todos los días con donaciones tienen su caja cerrada.</div>') +
      '<section class="card"><div class="row" style="margin-bottom:12px"><label class="sr" for="ccD">Desde</label><input id="ccD" type="date" class="in fx" value="' + esc(f.desde) + '"><label class="sr" for="ccH">Hasta</label><input id="ccH" type="date" class="in fx" value="' + esc(f.hasta) + '">' +
      '<label class="sr" for="ccU">Usuario</label><select id="ccU" class="in fx">' + opt('', 'Todos los usuarios', !f.user) + Object.keys(users).map(function (u) { return opt(u, u, f.user === u); }).join('') + '</select>' +
      '<label class="sr" for="ccDif">Diferencia</label><select id="ccDif" class="in fx">' + opt('', 'Con y sin diferencia', !f.dif) + opt('con', 'Sólo con diferencia', f.dif === 'con') + opt('sin', 'Sólo sin diferencia', f.dif === 'sin') + '</select>' +
      '<div class="tabs" style="margin:0"><button type="button" data-act="cc-vista" data-v="lista" aria-pressed="' + (f.vista === 'lista') + '">Lista</button><button type="button" data-act="cc-vista" data-v="cal" aria-pressed="' + (f.vista === 'cal') + '">Calendario</button></div></div>' +
      '<p class="hint" style="margin:0 0 10px">' + arr.length + ' cierre(s) · ' + conDif + ' con diferencia</p>' + (f.vista === 'cal' ? calendario() : lista) + '</section>';
  };
  function calendario() {
    var f = CM.cc, mes = f.mes || CM.hoy().slice(0, 7), y = +mes.slice(0, 4), m = +mes.slice(5) - 1;
    var primero = new Date(Date.UTC(y, m, 1)), dias = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), off = (primero.getUTCDay() + 6) % 7;
    var por = {}; CM.db.cajas.forEach(function (c) { if (c.cierre) { (por[c.cierre.fecha] = por[c.cierre.fecha] || []).push(c); } });
    var sin = {}; CM.diasSinCaja().forEach(function (a) { sin[a.fecha] = a.cent; });
    var cel = '', i;
    for (i = 0; i < off; i++) cel += '<div class="cal-d vacio"></div>';
    for (i = 1; i <= dias; i++) {
      var fe = mes + '-' + String(i).padStart(2, '0'), cs = por[fe], cls = 'cal-d', et = '', btn = false;
      if (cs) { var dif = cs.some(function (c) { return c.cierre.dif !== 0; }); cls += dif ? ' dif' : ' ok'; et = dif ? 'Con diferencia' : 'Sin diferencia'; btn = true; }
      else if (sin[fe] !== undefined) { cls += ' alerta'; et = 'Sin cierre'; }
      cel += btn ? '<button type="button" class="' + cls + '" data-act="cc-ver" data-id="' + esc(cs[0].id) + '" aria-label="' + i + ': ' + et + '"><b>' + i + '</b><small>' + et + '</small></button>' : '<div class="' + cls + '"><b>' + i + '</b><small>' + et + '</small></div>';
    }
    var prev = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 7), next = new Date(Date.UTC(y, m + 1, 1)).toISOString().slice(0, 7);
    return '<div class="row sp" style="margin-bottom:10px"><button class="btn sm" data-act="cc-mes" data-m="' + prev + '">' + CM.icon('left') + 'Anterior</button><b>' + ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][m] + ' ' + y + '</b><button class="btn sm" data-act="cc-mes" data-m="' + next + '">Siguiente' + CM.icon('right') + '</button></div>' +
      '<div class="cal" role="group" aria-label="Calendario de cierres">' + ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(function (d) { return '<div class="cal-h">' + d + '</div>'; }).join('') + cel + '</div>' +
      '<p class="hint">Verde: cerrada sin diferencia · Ámbar: con diferencia · Rojo: donaciones sin caja cerrada.</p>';
  }
  document.addEventListener('change', function (ev) {
    var t = ev.target, f = CM.cc;
    if (t.id === 'ccD') { f.desde = t.value; render(); } else if (t.id === 'ccH') { f.hasta = t.value; render(); }
    else if (t.id === 'ccU') { f.user = t.value; render(); } else if (t.id === 'ccDif') { f.dif = t.value; render(); }
  });
  CM.acts['cc-vista'] = function (t) { CM.cc.vista = t.getAttribute('data-v'); render(); };
  CM.acts['cc-mes'] = function (t) { CM.cc.mes = t.getAttribute('data-m'); render(); };
  CM.acts['cc-csv'] = function () {
    var arr = cerradas();
    CM.descargar('cajas_cerradas_' + CM.hoy() + '.csv', CM.csv(['Caja', 'Fecha', 'Cerro', 'Fondo inicial', 'Ingresos', 'Egresos', 'Esperado efectivo', 'Declarado efectivo', 'Diferencia', 'Observaciones', 'Sello SHA-256'], arr.map(function (c) { var x = c.cierre, m = function (v) { return (v / 100).toFixed(2).replace('.', ','); }; return [c.id, x.fecha, x.user, m(x.inicial), m(x.ingresos), m(x.egresos), m(x.esperadoEf), m(x.declaradoEf), m(x.dif), x.obs, x.hash]; })));
  };
  CM.acts['cc-ver'] = function (t) { verCierre(t.getAttribute('data-id')); };
  function docCierre(c) {
    var x = c.cierre;
    return '<div class="doc"><div class="darkband"><img src="assets/logo.png" alt="Cannabismatica"></div><h1 style="margin-top:12px">Cierre de caja ' + esc(c.id) + '</h1>' +
      '<table><tbody><tr><th>Fecha</th><td>' + esc(CM.fmtFecha(x.fecha)) + '</td><th>Cerró</th><td>' + esc(x.user) + '</td></tr><tr><th>Fondo inicial</th><td>' + esc(money(x.inicial)) + '</td><th>Efectivo esperado</th><td>' + esc(money(x.esperadoEf)) + '</td></tr><tr><th>Efectivo declarado</th><td>' + esc(money(x.declaradoEf)) + '</td><th>Diferencia</th><td>' + esc(money(x.dif)) + '</td></tr><tr><th>Ingresos</th><td>' + esc(money(x.ingresos)) + '</td><th>Egresos</th><td>' + esc(money(x.egresos)) + '</td></tr></tbody></table>' +
      '<h3 style="margin:14px 0 6px">Movimientos</h3><table><thead><tr><th>Hora</th><th>Tipo</th><th>Rubro</th><th>Detalle</th><th>Importe</th></tr></thead><tbody>' + x.movs.map(function (m) { return '<tr><td>' + esc(CM.fmtFH(m.ts).slice(-5)) + '</td><td>' + esc(tipoL(m.tipo)) + '</td><td>' + esc(m.rubroN) + '</td><td>' + esc(m.motivo) + '</td><td>' + (m.tipo === 'ingreso' ? '' : '− ') + esc(money(m.cent)) + '</td></tr>'; }).join('') + '</tbody></table>' +
      (x.obs ? '<p><b>Observaciones:</b> ' + esc(x.obs) + '</p>' : '') + (x.notas.length ? '<p><b>Notas de auditoría:</b></p><ul>' + x.notas.map(function (n) { return '<li>' + esc(CM.fmtFH(n.ts)) + ' · ' + esc(n.user) + ': ' + esc(n.texto) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="ft">Sello SHA-256: ' + esc(x.hash) + '<br>Verificación de integridad al imprimir: ' + (CM.verificarCierre(x) ? 'ÍNTEGRO' : 'ALTERADO') + '</p></div>';
  }
  function verCierre(id) {
    var c = CM.db.cajas.filter(function (x) { return x.id === id; })[0]; if (!c || !c.cierre) return;
    var x = c.cierre, ok = CM.verificarCierre(x);
    var medios = Object.keys(x.porMedio).map(function (k) { return [medioL(k), x.porMedio[k]]; });
    CM.modal.open({
      title: 'Cierre ' + c.id + ' · ' + CM.fmtFecha(x.fecha), wide: true,
      body: '<div class="row">' + pillDif(x.dif) + (ok ? '<span class="pill p-ok">Sello íntegro</span>' : '<span class="pill p-bad">Sello NO coincide: cierre alterado</span>') + '</div>' +
        '<div class="kv"><div><small>Cerró</small><b>' + esc(x.user) + '</b></div><div><small>Fondo inicial</small><b>' + esc(money(x.inicial)) + '</b></div><div><small>Ingresos</small><b>' + esc(money(x.ingresos)) + '</b></div><div><small>Egresos</small><b>' + esc(money(x.egresos)) + '</b></div><div><small>Esperado / declarado</small><b>' + esc(money(x.esperadoEf)) + ' / ' + esc(money(x.declaradoEf)) + '</b></div><div><small>Con / sin Factura C</small><b>' + esc(money(x.conFC)) + ' / ' + esc(money(x.sinFC)) + '</b></div></div>' +
        '<div class="note ' + (ok ? 'ok' : 'bad') + '">Sello SHA-256: <code style="word-break:break-all">' + esc(x.hash) + '</code></div>' +
        (x.obs ? '<div class="note warn"><b>Observaciones del cierre:</b> ' + esc(x.obs) + '</div>' : '') +
        '<h3>Línea de tiempo</h3><ul class="tl"><li><b>' + esc(CM.fmtFH(c.apTs)) + '</b> · Apertura por ' + esc(c.apUser) + ' con fondo ' + esc(money(x.inicial)) + '</li>' + x.movs.map(function (m) { return '<li><b>' + esc(CM.fmtFH(m.ts)) + '</b> · ' + esc(tipoL(m.tipo)) + ' ' + (m.tipo === 'ingreso' ? '+' : '−') + esc(money(m.cent)) + ' · rubro <b>' + esc(m.rubroN) + '</b> · ' + esc(m.motivo) + ' <small class="hint">(' + esc(m.user) + ')</small></li>'; }).join('') + '<li><b>' + esc(CM.fmtFH(x.ts)) + '</b> · Cierre y sello por ' + esc(x.user) + '</li></ul>' +
        '<h3>Ingresos por medio</h3>' + (medios.length ? hbars(medios, money) : '<div class="empty">Sin ingresos</div>') +
        '<h3>Notas de auditoría (sólo se agregan)</h3>' + (x.notas.length ? '<ul class="tl">' + x.notas.map(function (n) { return '<li>' + esc(CM.fmtFH(n.ts)) + ' · <b>' + esc(n.user) + '</b>: ' + esc(n.texto) + '</li>'; }).join('') + '</ul>' : '<p class="hint">Sin notas.</p>') +
        '<form id="fNT" data-form="cc-nota" class="row" autocomplete="off"><input type="hidden" name="id" value="' + esc(c.id) + '"><label class="sr" for="ntT">Nueva nota de auditoría</label><input id="ntT" class="in" name="texto" style="flex:1;min-width:200px" placeholder="Agregar una nota de revisión"><button class="btn" type="submit">Agregar nota</button></form><p class="err" role="alert" data-err></p>' +
        '<details><summary>Prueba de integridad</summary><p class="hint">Para mostrar cómo se detecta una alteración: el botón modifica a propósito el importe declarado de este cierre, el sello deja de coincidir y se puede reparar.</p><div class="row"><button class="btn sm bad" data-act="cc-alterar" data-id="' + esc(c.id) + '">Simular alteración</button><button class="btn sm" data-act="cc-reparar" data-id="' + esc(c.id) + '">Reparar la alteración de prueba</button></div></details>',
      footer: '<button class="btn" data-act="modal-close">Cerrar</button><button class="btn pri" data-act="cc-print" data-id="' + esc(c.id) + '">' + CM.icon('print') + 'Imprimir A4 / PDF</button>'
    });
  }
  CM.forms['cc-nota'] = function (f) {
    if (!CM.need('cerradas', 'edit')) return;
    var c = CM.db.cajas.filter(function (x) { return x.id === f.elements.id.value; })[0], tx = f.elements.texto.value.trim();
    if (!c || !c.cierre) return;
    if (tx.length < 4) return fail(f, 'texto', 'Escribí la nota.');
    c.cierre.notas.push({ ts: new Date().toISOString(), user: CM.db.cfg.operador, texto: tx });
    CM.audit('Nota en cierre', c.id + ' · ' + tx); CM.save(); verCierre(c.id);
  };
  CM.acts['cc-print'] = function (t) { var c = CM.db.cajas.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]; if (c) CM.imprimir(docCierre(c)); };
  CM.acts['cc-alterar'] = function (t) {
    var c = CM.db.cajas.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]; if (!c || !CM.need('cerradas', 'admin')) return;
    c.cierre.declaradoEf += 100; c.cierre.__t = (c.cierre.__t || 0) + 100; CM.audit('Prueba de integridad', 'Alteración simulada en ' + c.id); CM.save(); verCierre(c.id); render();
  };
  CM.acts['cc-reparar'] = function (t) {
    var c = CM.db.cajas.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]; if (!c || !c.cierre.__t || !CM.need('cerradas', 'admin')) { CM.toast('No hay alteración de prueba para reparar.'); return; }
    c.cierre.declaradoEf -= c.cierre.__t; delete c.cierre.__t; CM.audit('Prueba de integridad', 'Alteración reparada en ' + c.id); CM.save(); verCierre(c.id); render();
  };
  CM.afterRender = (function (prev) { return function (r) { if (prev) prev(r); if (r.v === 'cierre') recalcArqueo(); }; })(CM.afterRender);
})(window);
