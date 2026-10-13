/* Cannabismatica I+D · Sistema ONG (demo v2) · pantallas y acciones */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var NAV = CM.NAV = [
    ['inicio', 'Inicio', 'home', 'inicio'], ['pacientes', 'Pacientes', 'users', 'pacientes'], ['dispensaciones', 'Dispensaciones', 'flask', 'dispensaciones'],
    ['aportes', 'Aportes', 'heart', 'aportes'], ['reprocann', 'REPROCANN', 'shield', 'reprocann'], ['trazabilidad', 'Trazabilidad', 'chart', 'trazabilidad'],
    ['-', 'Gestión'],
    ['dashboard', 'Dashboard', 'chart', 'dashboard'], ['caja', 'Caja', 'cash', 'caja'], ['cierre', 'Arqueo y cierre', 'lock', 'cierre'], ['cajas-cerradas', 'Cajas cerradas', 'archive', 'cerradas'],
    ['inventario', 'Inventario', 'box', 'inventario'], ['fidelizacion', 'Fidelización', 'star', 'fidelizacion'], ['personal', 'Personal y fichaje', 'clock', 'personal'], ['tareas', 'Tareas y organigrama', 'tasks', 'tareas'],
    ['-', 'Comunidad'],
    ['menu-publico', 'Menú público', 'globe', 'menu'],
    ['-', 'Sistema'],
    ['nube', 'Nube', 'cloud', 'nube'], ['perifericos', 'Periféricos y ticket', 'plug', 'perifericos'], ['importexport', 'Importar / Exportar', 'swap', 'importexport'], ['integraciones', 'Integraciones', 'link', 'integraciones'],
    ['usuarios', 'Usuarios y permisos', 'key', 'usuarios'], ['auditoria', 'Auditoría', 'doc', 'auditoria'], ['ajustes', 'Configuración', 'gear', 'ajustes']
  ];
  var TITULOS = CM.TITULOS = { inicio: 'Inicio', pacientes: 'Pacientes', paciente: 'Ficha del paciente', dispensaciones: 'Dispensaciones', aportes: 'Aportes voluntarios y Factura C', reprocann: 'REPROCANN', trazabilidad: 'Trazabilidad', ajustes: 'Configuración' };

  /* ---------- helpers de vista ---------- */
  function uTxt(u, n) {
    if (u === 'g') return 'g';
    if (u === 'frasco') return n === 1 ? 'frasco' : 'frascos';
    return n === 1 ? 'unidad' : 'unidades';
  }
  function cantTxt(c, u) { return CM.fmtNum(c) + ' ' + uTxt(u, c); }
  function opt(v, l, sel, dis) { return '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + (dis ? ' disabled' : '') + '>' + esc(l) + '</option>'; }
  function repPill(est) {
    var t = CM.REP_LABEL[est.k];
    if (est.k === 'valido' && est.prox) t += ' · vence en ' + est.dias + ' d';
    return '<span class="pill ' + (est.prox && est.k === 'valido' ? 'p-warn' : CM.REP_CLASS[est.k]) + '">' + esc(t) + '</span>';
  }
  function repDetalle(est) {
    if (est.k === 'sin') return 'Sin datos de REPROCANN.';
    if (est.k === 'tramite') return 'En trámite' + (est.vence ? ' · fecha estimada ' + CM.fmtFecha(est.vence) : '') + '.';
    if (!est.vence) return CM.REP_LABEL[est.k] + ' (sin fecha de vencimiento cargada).';
    if (est.dias < 0) return 'Venció el ' + CM.fmtFecha(est.vence) + ' (hace ' + Math.abs(est.dias) + ' días).';
    return 'Vence el ' + CM.fmtFecha(est.vence) + ' (en ' + est.dias + ' días).';
  }
  function iniciales(n) { return String(n || '?').replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map(function (x) { return x.charAt(0).toUpperCase(); }).join(''); }
  function nombreCorto(n) { return String(n || '').replace(/\s*\((ficticio|ficticia)\)\s*/i, '').trim(); }
  function telWa(t) { var d = CM.soloDigitos(t).replace(/^0+/, '').replace(/^549?/, ''); return '549' + d; }
  function nombreDe(dni) { var p = CM.paciente(dni); return p ? p.nombre : 'DNI ' + dni; }
  function tablaVacia(msg) { return '<div class="empty">' + esc(msg) + '</div>'; }
  function lastDisp(dni) {
    var l = CM.dispDe(dni).filter(function (d) { return !d.anulada; }).map(function (d) { return d.fecha; }).sort().pop();
    return l || '';
  }
  function yymm() { var h = CM.hoy(); return h.slice(2, 4) + h.slice(5, 7); }

  /* ---------- navegación y ruteo ---------- */
  var MOD_DE_VISTA = { paciente: 'pacientes', 'cajas-cerradas': 'cerradas', 'menu-publico': 'menu' };
  function modDe(v) { return MOD_DE_VISTA[v] || v; }
  CM.visible = function (n) {
    if (n[3] === 'inicio') return true;
    if (CM.db.cfg.mods && CM.db.cfg.mods[n[3]] === false && ['usuarios', 'ajustes', 'auditoria'].indexOf(n[3]) < 0) return false;
    return !CM.can || CM.can(n[3], 'ver');
  };
  function renderNav(v) {
    var cur = v === 'paciente' ? 'pacientes' : v, out = '', pend = '';
    NAV.forEach(function (n) {
      if (n[0] === '-') { pend = '<div class="nav-h" aria-hidden="true">' + esc(n[1]) + '</div>'; return; }
      if (!CM.visible(n)) return;
      out += pend; pend = '';
      out += '<a href="#/' + n[0] + '"' + (n[0] === cur ? ' aria-current="page"' : '') + '>' + CM.icon(n[2]) + '<span>' + esc(n[1]) + '</span></a>';
    });
    $('#nav').innerHTML = out;
    var cu = $('#nav a[aria-current="page"]'); if (cu && cu.scrollIntoView) { try { cu.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { /* nada */ } }
  }
  function ruta() {
    var p = (g.location.hash || '#/inicio').replace(/^#\/?/, '').split('/');
    return { v: p[0] || 'inicio', a: decodeURIComponent(p[1] || '') };
  }
  var VIEWS = CM.VIEWS = {};
  function render() {
    var r = ruta();
    if (!VIEWS[r.v]) r = { v: 'inicio', a: '' };
    var pub = r.v === 'm' || r.v === 'acceso';
    document.body.classList.toggle('pub', pub);
    if (CM.rolSel) CM.rolSel();
    renderNav(r.v);
    var denegado = !pub && r.v !== 'inicio' && r.v !== 'acceso' && CM.can && !CM.can(modDe(r.v), 'ver');
    $('#main').innerHTML = denegado ? '<div class="card"><h1>Sin permiso</h1><p style="color:var(--mu)">El rol actual (' + esc(CM.ROLES[CM.db.cfg.rol] || '') + ') no tiene acceso a esta sección. Cambiá el rol en <a href="#/usuarios">Usuarios y permisos</a> o en el selector de la barra superior.</p></div>' : VIEWS[r.v](r);
    document.title = (TITULOS[r.v] || '') + ' · Cannabismatica I+D (demo)';
    hideSugg();
    if (CM.afterRender) CM.afterRender(r);
  }
  CM.render = render;
  g.addEventListener('hashchange', function () { render(); g.scrollTo(0, 0); $('#main').focus({ preventScroll: true }); });

  /* ---------- buscador por DNI (clave primaria) ---------- */
  function hideSugg() { var s = $('#sugg'); s.hidden = true; s.innerHTML = ''; $('#q').setAttribute('aria-expanded', 'false'); }
  function buscar(q) {
    q = String(q || '').trim();
    var d = CM.soloDigitos(q), res = [], db = CM.db.pacientes;
    var onlyNum = /^[\d.\s]+$/.test(q);
    Object.keys(db).forEach(function (k) {
      var p = db[k];
      if (onlyNum ? (d.length >= 2 && k.indexOf(d) === 0) : (CM.norm(p.nombre).indexOf(CM.norm(q)) > -1)) res.push(p);
    });
    return { res: res.slice(0, 6), dni: onlyNum ? d : '', exacto: onlyNum && db[d] ? db[d] : null };
  }
  function irBuscar(q) {
    var b = buscar(q);
    if (b.exacto) { g.location.hash = '#/paciente/' + b.exacto.dni; return; }
    if (b.res.length === 1) { g.location.hash = '#/paciente/' + b.res[0].dni; return; }
    if (b.dni && b.dni.length >= 6 && b.dni.length <= 9) { modalNuevoPaciente(b.dni); return; }
    if (b.res.length > 1) { g.location.hash = '#/pacientes'; CM.toast('Hay varios resultados: elegí uno de la lista.'); return; }
    CM.toast('No encontré pacientes. Probá con el DNI completo (sin puntos).', true);
  }
  document.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.id === 'q') {
      var v = t.value.trim(), box = $('#sugg');
      if (v.length < 2) { hideSugg(); return; }
      var b = buscar(v), h = '';
      b.res.forEach(function (p) {
        h += '<button type="button" data-act="goto" data-dni="' + esc(p.dni) + '"><span><b>' + esc(nombreCorto(p.nombre)) + '</b><br><small>DNI ' + esc(p.dni) + '</small></span>' + repPill(CM.estadoRep(p.reprocann)) + '</button>';
      });
      if (b.dni && !b.exacto && b.dni.length >= 6 && b.dni.length <= 9) {
        h += '<button type="button" data-act="alta-dni" data-dni="' + esc(b.dni) + '"><span><b>Paciente nuevo con DNI ' + esc(b.dni) + '</b><br><small>Abrir ingreso breve</small></span>' + CM.icon('plus') + '</button>';
      }
      if (!h) h = '<div class="empty">Sin resultados</div>';
      box.innerHTML = h; box.hidden = false; t.setAttribute('aria-expanded', 'true');
    } else if (t.id === 'fpq' || t.id === 'fpe') {
      var tb = $('#tbPac'); if (tb) tb.innerHTML = filasPacientes($('#fpq').value, $('#fpe').value);
    } else if (t.id === 'dsDni' || t.id === 'apDni') {
      resolverDni(t);
    } else if (t.id === 'dsLote') {
      actualizarLote();
    }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.id === 'dsLote') actualizarLote();
    if (t.id === 'trPer' || t.id === 'trProd' || t.id === 'trDesde' || t.id === 'trHasta') { var m = $('#trBody'); if (m) m.innerHTML = trazabilidadCuerpo(); }
    if (t.id === 'dsFlt' || t.id === 'apFlt' || t.id === 'apMes' || t.id === 'dsMes') { render(); }
  });
  document.addEventListener('keydown', function (ev) {
    var t = ev.target;
    if (t.id === 'q') {
      if (ev.key === 'Enter') { ev.preventDefault(); irBuscar(t.value); }
      if (ev.key === 'Escape') hideSugg();
    }
  });
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest('.search')) hideSugg();
  });
  CM.forms.buscar = function (f) { irBuscar(f.elements.q.value); };
  CM.acts.goto = function (t) { $('#q').value = ''; g.location.hash = '#/paciente/' + t.getAttribute('data-dni'); };
  CM.acts['alta-dni'] = function (t) { hideSugg(); modalNuevoPaciente(t.getAttribute('data-dni')); };

  /* ===================================================================
     PANTALLAS
     =================================================================== */
  VIEWS.inicio = function () {
    var db = CM.db, mes = CM.mesActual(), h = CM.hoy();
    var pacs = Object.keys(db.pacientes).map(function (k) { return db.pacientes[k]; });
    var dm = db.disp.filter(function (d) { return !d.anulada && d.fecha.slice(0, 7) === mes; });
    var tot = {};
    dm.forEach(function (d) { tot[d.unidad] = (tot[d.unidad] || 0) + d.cant; });
    var totTxt = Object.keys(tot).map(function (u) { return cantTxt(Math.round(tot[u] * 100) / 100, u); }).join(' · ') || 'Sin dispensaciones';
    var apMes = db.aportes.filter(function (a) { return a.estado === 'registrado' && a.fecha.slice(0, 7) === mes; }).reduce(function (s, a) { return s + a.cent; }, 0);
    var ong = CM.estadoRep(db.ong.reprocann);

    var al = [];
    if (ong.k !== 'valido' || ong.prox) al.push({ t: ong.k === 'vencido' || ong.k === 'sin' ? 'bad' : 'warn', h: '<a href="#/reprocann">Permiso REPROCANN de la ONG</a>: ' + esc(repDetalle(ong)) });
    pacs.forEach(function (p) {
      var e = CM.estadoRep(p.reprocann);
      if (e.k === 'vencido') al.push({ t: 'bad', h: '<a href="#/paciente/' + esc(p.dni) + '">' + esc(nombreCorto(p.nombre)) + '</a>: REPROCANN vencido. ' + esc(repDetalle(e)) });
      else if (e.k === 'valido' && e.prox) al.push({ t: 'warn', h: '<a href="#/paciente/' + esc(p.dni) + '">' + esc(nombreCorto(p.nombre)) + '</a>: REPROCANN vence en ' + e.dias + ' días.' });
      if (!p.historiaCompleta) al.push({ t: 'warn', h: '<a href="#/paciente/' + esc(p.dni) + '">' + esc(nombreCorto(p.nombre)) + '</a>: historia clínica pendiente de completar.' });
      if (CM.seguimientoPendiente(p)) al.push({ t: 'info', h: '<a href="#/paciente/' + esc(p.dni) + '">' + esc(nombreCorto(p.nombre)) + '</a>: seguimiento médico mensual pendiente.' });
    });
    db.lotes.forEach(function (l) {
      var s = CM.stockLote(l.id);
      if (s <= l.min) al.push({ t: s <= 0 ? 'bad' : 'warn', h: '<a href="#/trazabilidad">Stock bajo</a>: ' + esc(l.nombre) + ' (' + esc(l.id) + ') · quedan ' + esc(cantTxt(s, l.unidad)) + '.' });
    });

    // últimos 14 días
    var dias = [], max = 1;
    for (var i = 13; i >= 0; i--) {
      var f = CM.addDays(h, -i), n = db.disp.filter(function (d) { return !d.anulada && d.fecha === f; }).length;
      dias.push({ f: f, n: n }); if (n > max) max = n;
    }
    var bars = dias.map(function (d) { return '<div class="b" style="height:' + Math.max(3, Math.round(d.n / max * 100)) + '%" title="' + CM.fmtFecha(d.f) + ': ' + d.n + ' dispensación(es)"><span>' + (d.n || '') + '</span></div>'; }).join('');
    var axis = dias.map(function (d) { return '<span>' + d.f.slice(8) + '</span>'; }).join('');

    var ult = db.disp.slice().sort(function (a, b) { return b.ts.localeCompare(a.ts); }).slice(0, 6);
    var ultH = ult.length ? '<div class="tw"><table><thead><tr><th>Fecha</th><th>Paciente</th><th>Preparado</th><th class="n">Cantidad</th></tr></thead><tbody>' + ult.map(function (d) {
      return '<tr class="click' + (d.anulada ? ' anulada' : '') + '" data-act="goto" data-dni="' + esc(d.dni) + '"><td>' + CM.fmtFecha(d.fecha) + '</td><td>' + esc(nombreCorto(nombreDe(d.dni))) + '</td><td>' + esc(d.nombre) + '</td><td class="n">' + esc(cantTxt(d.cant, d.unidad)) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : tablaVacia('Todavía no hay dispensaciones.');

    return '<section class="card hero"><h1>Buscar paciente por DNI</h1><p style="margin:0;color:var(--mu)">El DNI es la clave que une la ficha, los Drive, el REPROCANN y la trazabilidad del paciente.</p>' +
      '<form data-form="buscar" autocomplete="off"><label class="sr" for="hq">DNI del paciente</label><input id="hq" name="q" class="in" inputmode="numeric" placeholder="DNI sin puntos, p. ej. 99000001" aria-describedby="hqh"><button class="btn pri" type="submit">' + CM.icon('search') + 'Buscar</button><button class="btn" type="button" data-act="nuevo-paciente">' + CM.icon('plus') + 'Nuevo paciente</button></form>' +
      '<p id="hqh" class="hint" style="margin:10px 0 0">Datos de demostración: probá con 99000001, 99000002 o 99000004. Si el DNI no existe, se abre el ingreso breve.</p></section>' +
      '<div class="grid g4" style="margin-top:14px">' +
      '<div class="card kpi"><div class="l">Pacientes en el sistema</div><div class="v">' + pacs.length + '</div><div class="s">' + pacs.filter(function (p) { return p.historiaCompleta; }).length + ' con historia clínica completa</div></div>' +
      '<div class="card kpi"><div class="l">Dispensaciones del mes</div><div class="v">' + dm.length + '</div><div class="s">' + esc(totTxt) + '</div></div>' +
      '<div class="card kpi"><div class="l">Aportes voluntarios del mes</div><div class="v">' + esc(CM.fmtMoney(apMes)) + '</div><div class="s">Registrados, sin anulaciones</div></div>' +
      '<div class="card kpi"><div class="l">REPROCANN de la ONG</div><div class="v" style="font-size:1.2rem;padding:6px 0">' + repPill(ong) + '</div><div class="s">' + esc(repDetalle(ong)) + '</div></div></div>' +
      '<div class="grid g2" style="margin-top:14px"><section class="card"><div class="row sp"><h2>Alertas</h2><span class="pill p-mu">' + al.length + '</span></div>' +
      (al.length ? '<ul class="tl">' + al.slice(0, 10).map(function (a) { return '<li><span class="pill p-' + (a.t === 'bad' ? 'bad' : a.t === 'warn' ? 'warn' : 'info') + '">' + (a.t === 'bad' ? 'Urgente' : a.t === 'warn' ? 'Atención' : 'Aviso') + '</span> ' + a.h + '</li>'; }).join('') + '</ul>' : '<div class="note ok">Sin alertas pendientes.</div>') + '</section>' +
      '<section class="card"><h2>Dispensaciones por día (últimos 14)</h2><div class="bars" role="img" aria-label="Dispensaciones por día durante los últimos 14 días; máximo ' + max + ' en un día">' + bars + '</div><div class="axis" aria-hidden="true">' + axis + '</div><h3 style="margin-top:18px">Últimas dispensaciones</h3>' + ultH + '</section></div>';
  };

  /* ---------- pacientes ---------- */
  function filasPacientes(q, est) {
    q = CM.norm(q); var d = CM.soloDigitos(q);
    var arr = Object.keys(CM.db.pacientes).map(function (k) { return CM.db.pacientes[k]; }).filter(function (p) {
      var okq = !q || CM.norm(p.nombre).indexOf(q) > -1 || (d && p.dni.indexOf(d) > -1);
      var e = CM.estadoRep(p.reprocann);
      var oke = !est || e.k === est || (est === 'prox' && e.prox) || (est === 'hist' && !p.historiaCompleta);
      return okq && oke;
    }).sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
    if (!arr.length) return '<tr><td colspan="6">' + tablaVacia('Sin pacientes con ese filtro.') + '</td></tr>';
    return arr.map(function (p) {
      var e = CM.estadoRep(p.reprocann), u = lastDisp(p.dni);
      return '<tr class="click" data-act="goto" data-dni="' + esc(p.dni) + '"><td><b>' + esc(p.dni) + '</b></td><td>' + esc(nombreCorto(p.nombre)) + '</td><td>' + esc(p.tel) + '</td><td>' + repPill(e) + '</td><td>' +
        (p.historiaCompleta ? '<span class="pill p-ok">Completa</span>' : '<span class="pill p-warn">Pendiente</span>') + '</td><td>' + (u ? CM.fmtFecha(u) : '—') + '</td></tr>';
    }).join('');
  }
  VIEWS.pacientes = function () {
    return '<div class="page-h"><div><h1>Pacientes</h1><p>Identificados por DNI. Tocá una fila para abrir la ficha.</p></div><button class="btn pri" data-act="nuevo-paciente">' + CM.icon('plus') + 'Nuevo paciente (ingreso breve)</button></div>' +
      '<div class="card"><div class="row" style="margin-bottom:12px"><label class="sr" for="fpq">Filtrar por DNI o nombre</label><input id="fpq" class="in" style="max-width:340px" placeholder="Filtrar por DNI o nombre" autocomplete="off">' +
      '<label class="sr" for="fpe">Filtrar por estado</label><select id="fpe" class="in" style="max-width:260px"><option value="">Todos los estados</option><option value="valido">REPROCANN válido</option><option value="prox">Vence en 60 días o menos</option><option value="vencido">REPROCANN vencido</option><option value="tramite">En trámite</option><option value="sin">Sin REPROCANN</option><option value="hist">Historia clínica pendiente</option></select></div>' +
      '<div class="tw"><table><thead><tr><th>DNI</th><th>Paciente</th><th>Teléfono</th><th>REPROCANN</th><th>Historia clínica</th><th>Última dispensación</th></tr></thead><tbody id="tbPac">' + filasPacientes('', '') + '</tbody></table></div></div>';
  };

  /* ---------- ficha del paciente ---------- */
  function driveCard(p, w) {
    var u = p['drive' + w];
    var tit = w === 1 ? 'Drive 1 · Ficha de datos y documentación' : 'Drive 2 · Historial clínico';
    var sub = w === 1 ? 'Datos personales y documentación médica del paciente.' : 'Historia clínica y evolución del paciente.';
    var h = '<div class="card flat drive"><div class="t">' + CM.icon('drive') + '<div><h3 style="margin:0">' + esc(tit) + '</h3><span class="hint">' + esc(sub) + '</span></div></div>';
    if (u) {
      h += '<a class="btn pri" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + CM.icon('link') + 'Abrir en Google Drive</a><div class="u">' + esc(u) + '</div>' +
        '<div class="row"><button class="btn sm" data-act="copiar" data-v="' + esc(u) + '">' + CM.icon('copy') + 'Copiar enlace</button><button class="btn sm" data-act="drive-edit" data-dni="' + esc(p.dni) + '" data-w="' + w + '">Cambiar enlace</button></div>';
      if (u === 'https://drive.google.com/drive/my-drive') h += '<span class="hint">Enlace de ejemplo de la demo: en el sistema real cada paciente tiene su propia carpeta.</span>';
    } else {
      h += '<div class="note warn">Sin carpeta vinculada todavía.</div><button class="btn" data-act="drive-edit" data-dni="' + esc(p.dni) + '" data-w="' + w + '">' + CM.icon('plus') + 'Vincular carpeta de Drive</button>';
    }
    return h + '</div>';
  }
  VIEWS.paciente = function (r) {
    var dni = CM.soloDigitos(r.a), p = CM.paciente(dni);
    if (!p) {
      return '<div class="card"><h1>No encontramos el DNI ' + esc(dni) + '</h1><p>No hay un paciente cargado con ese DNI.</p><div class="row"><button class="btn pri" data-act="alta-dni" data-dni="' + esc(dni) + '">' + CM.icon('plus') + 'Crear con ingreso breve</button><a class="btn" href="#/pacientes">Ver todos los pacientes</a></div></div>';
    }
    var e = CM.estadoRep(p.reprocann), edad = CM.edad(p.nac), mes = CM.mesActual();
    var disp = CM.dispDe(dni).sort(function (a, b) { return b.ts.localeCompare(a.ts); });
    var aps = CM.aportesDe(dni).sort(function (a, b) { return b.ts.localeCompare(a.ts); });
    var segs = CM.segDe(dni).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    var gMes = CM.gramosMes(dni, mes);
    var pend = CM.seguimientoPendiente(p);

    var head = '<section class="card"><div class="ph"><div class="avatar" aria-hidden="true">' + esc(iniciales(p.nombre)) + '</div><div style="flex:1;min-width:220px"><h1>' + esc(p.nombre) + '</h1>' +
      '<div class="row" style="margin-top:6px"><span class="pill p-info">DNI ' + esc(p.dni) + '</span>' + repPill(e) +
      (p.historiaCompleta ? '<span class="pill p-ok">Historia completa</span>' : '<span class="pill p-warn">Historia pendiente</span>') +
      (pend ? '<span class="pill p-info">Seguimiento pendiente</span>' : '') + '</div></div></div>' +
      '<div class="row" style="margin-top:16px"><button class="btn pri" data-act="dispensar" data-dni="' + esc(dni) + '">' + CM.icon('flask') + 'Registrar dispensación</button>' +
      '<button class="btn" data-act="aporte" data-dni="' + esc(dni) + '">' + CM.icon('heart') + 'Registrar aporte voluntario</button>' +
      '<button class="btn" data-act="seguimiento" data-dni="' + esc(dni) + '">' + CM.icon('clip') + 'Seguimiento médico</button>' +
      '<button class="btn" data-act="historia" data-dni="' + esc(dni) + '">' + CM.icon('doc') + (p.historiaCompleta ? 'Editar historia clínica' : 'Completar historia clínica') + '</button></div></section>';

    var drives = '<div class="grid g2" style="margin-top:14px">' + driveCard(p, 1) + driveCard(p, 2) + '</div>';

    var datos = '<section class="card" style="margin-top:14px"><div class="row sp"><h2>Datos y historia clínica</h2><a class="btn sm" href="' + esc(CM.db.ong.urlHistoria) + '" target="_blank" rel="noopener noreferrer">Abrir formulario de Historia (Google Forms)</a></div><div class="kv">' +
      kv('Nombre y apellido', p.nombre) + kv('Fecha de nacimiento', p.nac ? CM.fmtFecha(p.nac) + (edad != null ? ' · ' + edad + ' años' : '') : '') + kv('Teléfono', p.tel ? p.tel : '') +
      kv('Correo electrónico', p.email) + kv('Dirección', p.dir) + kv('Código postal', p.cp) + kv('Obra social / N°', p.obraSocial) + kv('Labor / ocupación', p.ocupacion) +
      kv('Motivo de consulta', p.motivo) + kv('Código de seguimiento REPROCANN', p.codSeg) + kv('Dudas, consultas o comentarios', p.dudas) + kv('Consentimiento informado', p.consentimiento ? 'Registrado el ' + CM.fmtFecha(p.consentimiento) : '') +
      '</div>' + (p.tel ? '<p style="margin:12px 0 0"><a class="btn sm" href="https://wa.me/' + esc(telWa(p.tel)) + '" target="_blank" rel="noopener noreferrer">WhatsApp al paciente</a> <span class="hint">Sólo para comunicaciones del tratamiento.</span></p>' : '') + '</section>';

    var rep = '<section class="card" style="margin-top:14px"><div class="row sp"><h2>REPROCANN del paciente</h2><button class="btn sm" data-act="rep-edit" data-dni="' + esc(dni) + '">Actualizar estado</button></div>' +
      '<div class="row">' + repPill(e) + '<span>' + esc(repDetalle(e)) + '</span></div><div class="kv" style="margin-top:12px">' + kv('Carnet', p.reprocann && p.reprocann.carnet ? 'Entregado' : 'No entregado') + kv('Código de vinculación / seguimiento', p.codSeg) + kv('Gramos de flores dispensados este mes', CM.fmtNum(gMes) + ' g') + '</div></section>';

    var dh = disp.length ? '<div class="tw"><table><thead><tr><th>N.º</th><th>Fecha</th><th>Preparado</th><th class="n">Cantidad</th><th>Lote</th><th>Entregó</th><th></th></tr></thead><tbody>' + disp.map(function (d) {
      return '<tr' + (d.anulada ? ' class="anulada"' : '') + '><td>' + esc(d.id) + '</td><td>' + CM.fmtFecha(d.fecha) + '</td><td>' + esc(d.nombre) + '<br><small class="hint">' + esc(CM.PRODUCTOS[d.prod].n) + '</small></td><td class="n">' + esc(cantTxt(d.cant, d.unidad)) + '</td><td>' + esc(d.lote) + '</td><td>' + esc(d.user) + '</td><td>' +
        (d.anulada ? '<span class="pill p-bad">Anulada</span>' : '<button class="btn sm" data-act="etiqueta" data-id="' + esc(d.id) + '">' + CM.icon('qr') + 'Etiqueta</button>') + '</td></tr>';
    }).join('') + '</tbody></table></div>' : tablaVacia('Todavía no tiene dispensaciones.');
    var dsec = '<section class="card" style="margin-top:14px"><h2>Dispensaciones</h2>' + dh + '</section>';

    var ah = aps.length ? '<div class="tw"><table><thead><tr><th>N.º</th><th>Fecha</th><th>Concepto</th><th>Medio</th><th class="n">Importe</th><th>Comprobante</th></tr></thead><tbody>' + aps.map(function (a) { return filaAporte(a, true); }).join('') + '</tbody></table></div>' : tablaVacia('Sin aportes voluntarios registrados.');
    var asec = '<section class="card" style="margin-top:14px"><h2>Aportes voluntarios y Factura C</h2>' + ah + '</section>';

    var sh = segs.length ? '<ul class="tl">' + segs.map(function (s) {
      return '<li><b>' + CM.fmtFecha(s.fecha) + '</b> · Objetivo: ' + esc((s.objetivos || []).join(', ') || '—') + '<br><small class="hint">Mejoras: ' + esc((s.mejoras || []).join(', ') || '—') + ' · Efectos no deseados: ' + esc((s.efectos || []).join(', ') || '—') + (s.genetica ? ' · Genética: ' + esc(s.genetica) : '') + '</small>' + (s.comentario ? '<br>“' + esc(s.comentario) + '”' : '') + '</li>';
    }).join('') + '</ul>' : tablaVacia('Todavía no hay seguimientos. Se completan una vez por mes cuando el paciente ya tiene carnet y fue dispensado.');
    var ssec = '<section class="card" style="margin-top:14px"><div class="row sp"><h2>Seguimiento médico</h2><a class="btn sm" href="' + esc(CM.db.ong.urlSeguimiento) + '" target="_blank" rel="noopener noreferrer">Abrir formulario de Seguimiento (Google Forms)</a></div>' + sh + '</section>';
    return head + drives + datos + rep + dsec + asec + ssec;
  };
  function kv(l, v) { return '<div><small>' + esc(l) + '</small><b>' + (v ? esc(v) : '<span style="color:var(--mu)">—</span>') + '</b></div>'; }

  /* ---------- aportes ---------- */
  function filaAporte(a, sinPac) {
    var c = a.comp ? CM.comp(a.comp) : null;
    var cell;
    if (a.estado === 'anulado') cell = '<span class="pill p-bad">Anulado</span>';
    else if (c && c.anulado) cell = '<span class="pill p-bad">Factura C anulada</span>';
    else if (c) cell = '<button class="btn sm" data-act="ver-comp" data-id="' + esc(c.id) + '">' + CM.icon('doc') + 'Factura C ' + esc(c.pv + '-' + c.nro) + '</button>';
    else cell = '<button class="btn sm pri" data-act="emitir-fc" data-id="' + esc(a.id) + '">Emitir Factura C (simulada)</button>';
    return '<tr' + (a.estado === 'anulado' ? ' class="anulada"' : '') + '><td>' + esc(a.id) + '</td><td>' + CM.fmtFecha(a.fecha) + '</td>' + (sinPac ? '' : '<td><a href="#/paciente/' + esc(a.dni) + '">' + esc(nombreCorto(nombreDe(a.dni))) + '</a><br><small class="hint">DNI ' + esc(a.dni) + '</small></td>') +
      '<td>' + esc(a.concepto) + '</td><td>' + esc(CM.MEDIOS[a.medio] || a.medio) + '</td><td class="n">' + esc(CM.fmtMoney(a.cent)) + '</td><td>' + cell + '</td></tr>';
  }
  VIEWS.aportes = function () {
    var db = CM.db, mes = ($('#apMes') && $('#apMes').value) || CM.mesActual();
    var meses = {}; meses[CM.mesActual()] = 1; db.aportes.forEach(function (a) { meses[a.fecha.slice(0, 7)] = 1; });
    var ml = Object.keys(meses).sort().reverse();
    var flt = ($('#apFlt') && $('#apFlt').value) || '';
    var arr = db.aportes.filter(function (a) { return (mes === 'todos' || a.fecha.slice(0, 7) === mes) && (!flt || (flt === 'sinfc' ? (!a.comp && a.estado === 'registrado') : a.estado === flt)); }).sort(function (a, b) { return b.ts.localeCompare(a.ts); });
    var tot = arr.filter(function (a) { return a.estado === 'registrado'; }).reduce(function (s, a) { return s + a.cent; }, 0);
    var sinFc = db.aportes.filter(function (a) { return !a.comp && a.estado === 'registrado'; }).length;
    var comps = db.comps.slice().sort(function (a, b) { return b.id.localeCompare(a.id); });
    return '<div class="page-h"><div><h1>Aportes voluntarios y Factura C</h1><p>Registro de contribuciones de los pacientes. El módulo de Factura C ante ARCA es una <b>simulación</b>: no se envía nada a ARCA ni se obtiene CAE real.</p></div><button class="btn pri" data-act="aporte" data-dni="">' + CM.icon('plus') + 'Registrar aporte</button></div>' +
      '<div class="note info" style="margin-bottom:14px">Para emitir con CAE real hace falta el certificado digital de la ONG y la conexión con los servicios de ARCA (WSAA/WSFE) <b>[VERIFICAR con el contador y en arca.gob.ar]</b>. Esa etapa no está incluida en esta demo.</div>' +
      '<div class="grid g3"><div class="card kpi"><div class="l">Aportes del período</div><div class="v">' + esc(CM.fmtMoney(tot)) + '</div><div class="s">' + arr.length + ' registro(s) mostrados</div></div><div class="card kpi"><div class="l">Sin Factura C emitida</div><div class="v">' + sinFc + '</div><div class="s">Aportes registrados pendientes de comprobante</div></div><div class="card kpi"><div class="l">Comprobantes simulados</div><div class="v">' + comps.length + '</div><div class="s">Facturas C y notas de crédito C</div></div></div>' +
      '<section class="card" style="margin-top:14px"><div class="row" style="margin-bottom:12px"><label class="sr" for="apMes">Mes</label><select id="apMes" class="in" style="max-width:200px">' + opt('todos', 'Todos los meses', mes === 'todos') + ml.map(function (m) { return opt(m, m.slice(5) + '/' + m.slice(0, 4), m === mes); }).join('') + '</select>' +
      '<label class="sr" for="apFlt">Estado</label><select id="apFlt" class="in" style="max-width:260px">' + opt('', 'Todos', !flt) + opt('registrado', 'Registrados', flt === 'registrado') + opt('sinfc', 'Sin Factura C', flt === 'sinfc') + opt('anulado', 'Anulados', flt === 'anulado') + '</select></div>' +
      (arr.length ? '<div class="tw"><table><thead><tr><th>N.º</th><th>Fecha</th><th>Paciente</th><th>Concepto</th><th>Medio</th><th class="n">Importe</th><th>Comprobante</th></tr></thead><tbody>' + arr.map(function (a) { return filaAporte(a, false); }).join('') + '</tbody></table></div>' : tablaVacia('No hay aportes en este período.')) + '</section>' +
      '<section class="card" style="margin-top:14px"><h2>Comprobantes emitidos (simulados)</h2>' + (comps.length ? '<div class="tw"><table><thead><tr><th>Tipo</th><th>Número</th><th>Fecha</th><th>Paciente</th><th class="n">Importe</th><th>Estado</th><th></th></tr></thead><tbody>' + comps.map(function (c) {
        return '<tr><td>' + (c.tipo === 'FC' ? 'Factura C' : 'Nota de crédito C') + '</td><td>' + esc(c.pv + '-' + c.nro) + '</td><td>' + CM.fmtFecha(c.fecha) + '</td><td>' + esc(nombreCorto(nombreDe(c.dni))) + '</td><td class="n">' + esc(CM.fmtMoney(c.cent)) + '</td><td>' + (c.anulado ? '<span class="pill p-bad">Anulada</span>' : '<span class="pill p-info">Simulada</span>') + '</td><td><button class="btn sm" data-act="ver-comp" data-id="' + esc(c.id) + '">Ver / imprimir</button></td></tr>';
      }).join('') + '</tbody></table></div>' : tablaVacia('Todavía no se emitieron comprobantes.')) + '</section>';
  };

  /* ---------- dispensaciones ---------- */
  VIEWS.dispensaciones = function () {
    var db = CM.db, mes = ($('#dsMes') && $('#dsMes').value) || CM.mesActual();
    var meses = {}; meses[CM.mesActual()] = 1; db.disp.forEach(function (d) { meses[d.fecha.slice(0, 7)] = 1; });
    var ml = Object.keys(meses).sort().reverse();
    var flt = ($('#dsFlt') && $('#dsFlt').value) || '';
    var arr = db.disp.filter(function (d) { return (mes === 'todos' || d.fecha.slice(0, 7) === mes) && (!flt || d.prod === flt); }).sort(function (a, b) { return b.ts.localeCompare(a.ts); });
    return '<div class="page-h"><div><h1>Dispensaciones</h1><p>Entrega de preparados a pacientes. Cada entrega descuenta el lote y queda en la trazabilidad.</p></div><button class="btn pri" data-act="dispensar" data-dni="">' + CM.icon('plus') + 'Nueva dispensación</button></div>' +
      '<section class="card"><div class="row" style="margin-bottom:12px"><label class="sr" for="dsMes">Mes</label><select id="dsMes" class="in" style="max-width:200px">' + opt('todos', 'Todos los meses', mes === 'todos') + ml.map(function (m) { return opt(m, m.slice(5) + '/' + m.slice(0, 4), m === mes); }).join('') + '</select>' +
      '<label class="sr" for="dsFlt">Tipo de preparado</label><select id="dsFlt" class="in" style="max-width:260px">' + opt('', 'Todos los preparados', !flt) + Object.keys(CM.PRODUCTOS).map(function (k) { return opt(k, CM.PRODUCTOS[k].n, flt === k); }).join('') + '</select></div>' +
      (arr.length ? '<div class="tw"><table><thead><tr><th>N.º</th><th>Fecha</th><th>Paciente</th><th>Preparado</th><th class="n">Cantidad</th><th>Lote</th><th>Entregó</th><th></th></tr></thead><tbody>' + arr.map(function (d) {
        return '<tr' + (d.anulada ? ' class="anulada"' : '') + '><td>' + esc(d.id) + '</td><td>' + CM.fmtFecha(d.fecha) + '</td><td><a href="#/paciente/' + esc(d.dni) + '">' + esc(nombreCorto(nombreDe(d.dni))) + '</a><br><small class="hint">DNI ' + esc(d.dni) + '</small></td><td>' + esc(d.nombre) + '</td><td class="n">' + esc(cantTxt(d.cant, d.unidad)) + '</td><td>' + esc(d.lote) + '</td><td>' + esc(d.user) + '</td><td>' +
          (d.anulada ? '<span class="pill p-bad" title="' + esc(d.anulada.motivo) + '">Anulada</span>' : '<div class="row"><button class="btn sm" data-act="etiqueta" data-id="' + esc(d.id) + '">' + CM.icon('qr') + 'Etiqueta</button><button class="btn sm bad" data-act="anular-disp" data-id="' + esc(d.id) + '">Anular</button></div>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : tablaVacia('No hay dispensaciones en este período.')) + '</section>';
  };

  /* ---------- REPROCANN ---------- */
  var repFiltro = '';
  VIEWS.reprocann = function () {
    var ong = CM.db.ong, e = CM.estadoRep(ong.reprocann);
    var pacs = Object.keys(CM.db.pacientes).map(function (k) { return CM.db.pacientes[k]; }).map(function (p) { return { p: p, e: CM.estadoRep(p.reprocann) }; })
      .filter(function (x) { return !repFiltro || x.e.k === repFiltro || (repFiltro === 'prox' && x.e.prox); })
      .sort(function (a, b) { return (a.e.vence || '9999').localeCompare(b.e.vence || '9999'); });
    var cnt = { valido: 0, vencido: 0, tramite: 0, sin: 0 };
    Object.keys(CM.db.pacientes).forEach(function (k) { cnt[CM.estadoRep(CM.db.pacientes[k].reprocann).k]++; });
    return '<div class="page-h"><div><h1>REPROCANN</h1><p>Estado del permiso de la ONG y de cada paciente (Ley N.º 27.350). La carga y la consulta oficial se hacen en el sitio del Ministerio de Salud.</p></div><a class="btn" href="https://reprocann.msal.gob.ar/" target="_blank" rel="noopener noreferrer">' + CM.icon('link') + 'Sitio oficial REPROCANN</a></div>' +
      '<section class="card hero"><div class="row sp"><div><h2>' + esc(ong.nombre) + '</h2><p style="margin:4px 0 0;color:var(--mu)">Persona jurídica · ' + esc(ong.domicilio) + '</p></div><button class="btn" data-act="rep-ong">Actualizar estado y vencimiento</button></div>' +
      '<div class="grid g3" style="margin-top:14px"><div class="card flat kpi"><div class="l">Estado del permiso</div><div class="v" style="font-size:1.3rem;padding:6px 0">' + repPill(e) + '</div></div>' +
      '<div class="card flat kpi"><div class="l">Fecha de vencimiento</div><div class="v">' + (e.vence ? CM.fmtFecha(e.vence) : '—') + '</div><div class="s">' + esc(repDetalle(e)) + '</div></div>' +
      '<div class="card flat kpi"><div class="l">N.º de inscripción</div><div class="v" style="font-size:1.3rem;padding:6px 0">' + (ong.reprocann.nroInscripcion ? esc(ong.reprocann.nroInscripcion) : '<span style="color:var(--mu)">A completar</span>') + '</div></div></div>' +
      (e.k !== 'valido' || e.prox ? '<div class="note ' + (e.k === 'valido' ? 'warn' : 'bad') + '" style="margin-top:12px">' + (CM.db.cfg.bloquearVencido && (e.k === 'vencido' || e.k === 'sin') ? 'Con el permiso vencido o sin cargar, el sistema <b>bloquea</b> las nuevas dispensaciones (se puede cambiar en Ajustes).' : 'Revisá la vigencia del permiso con anticipación.') + '</div>' : '') + '</section>' +
      '<section class="card" style="margin-top:14px"><h2>Pacientes y vigencia</h2><div class="tabs" role="group" aria-label="Filtrar por estado">' +
      [['', 'Todos (' + Object.keys(CM.db.pacientes).length + ')'], ['valido', 'Válidos (' + cnt.valido + ')'], ['prox', 'Vencen en 60 días'], ['vencido', 'Vencidos (' + cnt.vencido + ')'], ['tramite', 'En trámite (' + cnt.tramite + ')'], ['sin', 'Sin REPROCANN (' + cnt.sin + ')']].map(function (f) {
        return '<button type="button" data-act="rep-flt" data-v="' + f[0] + '" aria-pressed="' + (repFiltro === f[0]) + '">' + esc(f[1]) + '</button>';
      }).join('') + '</div>' +
      (pacs.length ? '<div class="tw"><table><thead><tr><th>DNI</th><th>Paciente</th><th>Estado</th><th>Vencimiento</th><th>Carnet</th><th></th></tr></thead><tbody>' + pacs.map(function (x) {
        return '<tr><td><b>' + esc(x.p.dni) + '</b></td><td><a href="#/paciente/' + esc(x.p.dni) + '">' + esc(nombreCorto(x.p.nombre)) + '</a></td><td>' + repPill(x.e) + '</td><td>' + (x.e.vence ? CM.fmtFecha(x.e.vence) : '—') + '</td><td>' + (x.p.reprocann && x.p.reprocann.carnet ? 'Sí' : 'No') + '</td><td><button class="btn sm" data-act="rep-edit" data-dni="' + esc(x.p.dni) + '">Actualizar</button></td></tr>';
      }).join('') + '</tbody></table></div>' : tablaVacia('Sin pacientes con ese estado.')) + '</section>';
  };
  CM.acts['rep-flt'] = function (t) { repFiltro = t.getAttribute('data-v'); render(); };

  /* ---------- trazabilidad ---------- */
  function rangoTr() {
    var h = CM.hoy();
    var desde = ($('#trDesde') && $('#trDesde').value) || h.slice(0, 8) + '01';
    var hasta = ($('#trHasta') && $('#trHasta').value) || h;
    var prod = ($('#trProd') && $('#trProd').value) || '';
    return { desde: desde, hasta: hasta, prod: prod };
  }
  function dispFiltradas() {
    var r = rangoTr();
    return CM.db.disp.filter(function (d) { return d.fecha >= r.desde && d.fecha <= r.hasta && (!r.prod || d.prod === r.prod); }).sort(function (a, b) { return b.ts.localeCompare(a.ts); });
  }
  function trazabilidadCuerpo() {
    var arr = dispFiltradas(), ok = arr.filter(function (d) { return !d.anulada; });
    var porProd = {}, porGen = {};
    ok.forEach(function (d) {
      var k = d.prod + '|' + d.unidad; porProd[k] = (porProd[k] || 0) + d.cant;
      var kg = d.nombre + '|' + d.unidad; porGen[kg] = (porGen[kg] || 0) + d.cant;
    });
    var gMax = 1; Object.keys(porGen).forEach(function (k) { if (porGen[k] > gMax) gMax = porGen[k]; });
    var resumen = Object.keys(porProd).length ? '<div class="grid g4">' + Object.keys(porProd).map(function (k) {
      var pr = k.split('|'); return '<div class="card flat kpi"><div class="l">' + esc(CM.PRODUCTOS[pr[0]].n) + '</div><div class="v">' + esc(cantTxt(Math.round(porProd[k] * 100) / 100, pr[1])) + '</div></div>';
    }).join('') + '</div>' : tablaVacia('Sin dispensaciones en el período.');
    var gen = Object.keys(porGen).sort(function (a, b) { return porGen[b] - porGen[a]; }).map(function (k) {
      var pr = k.split('|'); return '<div class="hb"><span>' + esc(pr[0]) + '</span><span><i style="width:' + Math.max(2, Math.round(porGen[k] / gMax * 100)) + '%"></i></span><em>' + esc(CM.fmtNum(porGen[k])) + ' ' + esc(uTxt(pr[1], porGen[k]) === 'g' ? 'g' : pr[1] === 'frasco' ? 'fr.' : 'u.') + '</em></div>';
    }).join('');
    var tabla = arr.length ? '<div class="tw"><table><thead><tr><th>Fecha</th><th>N.º</th><th>DNI</th><th>Preparado / lote</th><th class="n">Cantidad</th><th>Entregó</th><th>Estado</th></tr></thead><tbody>' + arr.map(function (d) {
      return '<tr' + (d.anulada ? ' class="anulada"' : '') + '><td>' + CM.fmtFecha(d.fecha) + '</td><td>' + esc(d.id) + '</td><td>' + esc(d.dni) + '</td><td>' + esc(d.nombre) + '<br><small class="hint">' + esc(d.lote) + '</small></td><td class="n">' + esc(cantTxt(d.cant, d.unidad)) + '</td><td>' + esc(d.user) + '</td><td>' + (d.anulada ? 'Anulada: ' + esc(d.anulada.motivo) : 'Entregada') + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '';
    return '<h2>Resumen del período</h2>' + resumen + (gen ? '<h3 style="margin-top:18px">Por genética / preparado</h3>' + gen : '') + '<h3 style="margin-top:18px">Detalle de dispensaciones (' + arr.length + ')</h3>' + tabla;
  }
  VIEWS.trazabilidad = function () {
    var db = CM.db, h = CM.hoy();
    var stock = '<div class="tw"><table><thead><tr><th>Lote</th><th>Preparado</th><th>Tipo</th><th>Quimiotipo</th><th class="n">Ingresó</th><th class="n">Disponible</th><th>Estado</th></tr></thead><tbody>' + db.lotes.map(function (l) {
      var s = CM.stockLote(l.id), ing = db.movs.filter(function (m) { return m.lote === l.id && m.tipo === 'ingreso'; }).reduce(function (a, m) { return a + m.cant; }, 0);
      return '<tr><td>' + esc(l.id) + '</td><td>' + esc(l.nombre) + '</td><td>' + esc(CM.PRODUCTOS[l.prod].n) + '</td><td>' + esc(l.quim) + '</td><td class="n">' + esc(cantTxt(ing, l.unidad)) + '</td><td class="n"><b>' + esc(cantTxt(s, l.unidad)) + '</b></td><td>' + (s <= 0 ? '<span class="pill p-bad">Agotado</span>' : s <= l.min ? '<span class="pill p-warn">Stock bajo</span>' : '<span class="pill p-ok">Normal</span>') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    var movs = db.movs.slice().sort(function (a, b) { return b.ts.localeCompare(a.ts) || b.id.localeCompare(a.id); }).slice(0, 25);
    var mt = '<div class="tw"><table><thead><tr><th>Fecha</th><th>Lote</th><th>Movimiento</th><th class="n">Cantidad</th><th>Referencia / motivo</th><th>Usuario</th></tr></thead><tbody>' + movs.map(function (m) {
      var l = CM.lote(m.lote);
      return '<tr><td>' + CM.fmtFecha(m.fecha) + '</td><td>' + esc(m.lote) + '</td><td>' + esc({ ingreso: 'Ingreso', dispensacion: 'Dispensación', ajuste: 'Ajuste', anulacion: 'Anulación de dispensación' }[m.tipo] || m.tipo) + '</td><td class="n">' + (m.cant > 0 ? '+' : '') + esc(CM.fmtNum(m.cant)) + ' ' + esc(l ? l.unidad === 'g' ? 'g' : 'u.' : '') + '</td><td>' + esc((m.ref ? m.ref + ' ' : '') + (m.motivo || '')) + '</td><td>' + esc(m.user) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    return '<div class="page-h"><div><h1>Trazabilidad</h1><p>Control de lotes y cantidades dispensadas para la auditoría interna. El stock se calcula sumando movimientos: nada se edita ni se borra, se corrige con un movimiento nuevo.</p></div>' +
      '<div class="row"><button class="btn" data-act="lote-nuevo">' + CM.icon('plus') + 'Nuevo lote</button><button class="btn" data-act="stock-ajuste">Ajustar stock</button></div></div>' +
      '<section class="card"><div class="row sp"><h2>Dispensaciones por período</h2><div class="row"><button class="btn sm" data-act="csv-disp">' + CM.icon('dl') + 'Exportar CSV</button><button class="btn sm" data-act="print-tr">' + CM.icon('print') + 'Imprimir informe</button></div></div>' +
      '<div class="row" style="margin:10px 0 14px"><label class="fl" style="max-width:190px"><span>Desde</span><input id="trDesde" type="date" class="in" value="' + h.slice(0, 8) + '01"></label><label class="fl" style="max-width:190px"><span>Hasta</span><input id="trHasta" type="date" class="in" value="' + h + '"></label>' +
      '<label class="fl" style="max-width:260px"><span>Preparado</span><select id="trProd" class="in">' + opt('', 'Todos', true) + Object.keys(CM.PRODUCTOS).map(function (k) { return opt(k, CM.PRODUCTOS[k].n); }).join('') + '</select></label></div><div id="trBody">' + trazabilidadCuerpo() + '</div></section>' +
      '<section class="card" style="margin-top:14px"><h2>Stock disponible por lote</h2>' + stock + '</section>' +
      '<section class="card" style="margin-top:14px"><div class="row sp"><h2>Últimos movimientos de stock</h2><button class="btn sm" data-act="csv-movs">' + CM.icon('dl') + 'Exportar CSV</button></div>' + mt + '</section>';
  };
  CM.acts['csv-disp'] = function () {
    var arr = dispFiltradas();
    CM.descargar('dispensaciones_' + CM.hoy() + '.csv', CM.csv(['N', 'Fecha', 'DNI', 'Lote', 'Preparado', 'Tipo', 'Cantidad', 'Unidad', 'Entrego', 'Estado', 'Motivo anulacion'], arr.map(function (d) {
      return [d.id, d.fecha, d.dni, d.lote, d.nombre, CM.PRODUCTOS[d.prod].n, d.cant, d.unidad, d.user, d.anulada ? 'Anulada' : 'Entregada', d.anulada ? d.anulada.motivo : ''];
    })));
    CM.audit('Exportación', 'CSV de dispensaciones (' + arr.length + ' filas)'); CM.save();
  };
  CM.acts['csv-movs'] = function () {
    CM.descargar('movimientos_stock_' + CM.hoy() + '.csv', CM.csv(['N', 'Fecha', 'Lote', 'Tipo', 'Cantidad', 'Referencia', 'Motivo', 'Usuario'], CM.db.movs.map(function (m) { return [m.id, m.fecha, m.lote, m.tipo, m.cant, m.ref, m.motivo, m.user]; })));
    CM.audit('Exportación', 'CSV de movimientos de stock'); CM.save();
  };
  CM.acts['print-tr'] = function () {
    var r = rangoTr();
    CM.imprimir('<div class="doc"><div class="darkband"><img src="assets/logo.png" alt="Cannabismatica"></div><h1 style="margin-top:12px">Informe de trazabilidad</h1><p>Período: ' + CM.fmtFecha(r.desde) + ' a ' + CM.fmtFecha(r.hasta) + ' · Emitido el ' + CM.fmtFecha(CM.hoy()) + ' por ' + esc(CM.db.cfg.operador) + '</p><div class="demo">DATOS FICTICIOS DE DEMOSTRACIÓN</div>' + $('#trBody').innerHTML + '</div>');
  };

  /* ---------- ajustes ---------- */
  VIEWS.ajustes = function () {
    var o = CM.db.ong, c = CM.db.cfg;
    var aud = CM.db.audit.slice(0, 40);
    return '<div class="page-h"><div><h1>Configuración</h1><p>Datos de la ONG, reglas de la demo y módulos activos. La bitácora está en <a href="#/auditoria">Auditoría</a>.</p></div></div>' +
      '<form class="card f" data-form="ajustes" autocomplete="off"><h2>Datos de la ONG</h2><div class="f f2">' +
      fl('Nombre de la ONG', '<input class="in" name="nombre" value="' + esc(o.nombre) + '" required>') + fl('Domicilio', '<input class="in" name="domicilio" value="' + esc(o.domicilio) + '">') +
      fl('Correo', '<input class="in" name="email" type="email" value="' + esc(o.email) + '">') + fl('Instagram', '<input class="in" name="instagram" value="' + esc(o.instagram) + '">') +
      fl('CUIT de la ONG (para la Factura C)', '<input class="in num" name="cuit" inputmode="numeric" placeholder="11 dígitos" value="' + esc(o.cuit) + '">') + fl('Punto de emisión de Factura C (4 dígitos)', '<input class="in num" name="pv" inputmode="numeric" placeholder="4 dígitos" value="' + esc(o.puntoVenta) + '">') +
      fl('Condición frente al IVA', '<input class="in" name="iva" value="' + esc(o.condicionIva) + '">') + fl('Operador actual (queda en la auditoría)', '<input class="in" name="operador" value="' + esc(c.operador) + '" required>') +
      '</div><h2 style="margin-top:6px">Formularios de Google</h2><div class="f f2">' + fl('Formulario de Historia clínica / Solicitud REPROCANN', '<input class="in" name="uh" value="' + esc(o.urlHistoria) + '">') + fl('Formulario de Seguimiento médico (va en el QR de la etiqueta)', '<input class="in" name="us" value="' + esc(o.urlSeguimiento) + '">') + '</div>' +
      '<h2 style="margin-top:6px">Reglas de la dispensación</h2><label class="chk"><input type="checkbox" name="bloq"' + (c.bloquearVencido ? ' checked' : '') + '><span>Bloquear dispensaciones si el REPROCANN de la ONG o del paciente está vencido</span></label>' +
      fl('Tope mensual de flores por paciente, en gramos (opcional; el valor lo define el equipo médico)', '<input class="in num" name="tope" inputmode="decimal" placeholder="Sin tope" value="' + esc(c.topeMensualG) + '" style="max-width:260px">') +
      '<p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Guardar ajustes</button></div></form>' +
      (CM.cfgExtra ? CM.cfgExtra() : '') +
      '<section class="card" style="margin-top:14px"><h2>Sobre esta demo</h2><ul style="margin:0;padding-left:20px;color:var(--mu)"><li>Todos los pacientes y movimientos son <b>ficticios</b> y se guardan sólo en este navegador (no viajan a ningún servidor).</li><li>La Factura C es una <b>simulación</b> sin validez fiscal: no se conecta con ARCA.</li><li>Los enlaces a Drive de la demo apuntan a Google Drive en general; en el sistema real cada paciente tiene sus dos carpetas.</li><li>Normativa (Ley 27.350, vigencias del REPROCANN, exención de la ONG) <b>[VERIFICAR con asesor legal y fuentes oficiales]</b>.</li></ul>' +
      '<div class="row" style="margin-top:14px"><button class="btn bad" data-act="reset-demo">' + CM.icon('undo') + 'Restablecer datos de ejemplo</button></div></section>';
  };
  function fl(l, inner) { return '<label class="fl"><span>' + esc(l) + '</span>' + inner + '</label>'; }
  function flr(lHtml, inner) { return '<label class="fl"><span>' + lHtml + '</span>' + inner + '</label>'; }
  CM.acts['csv-aud'] = function () {
    CM.descargar('auditoria_' + CM.hoy() + '.csv', CM.csv(['Fecha', 'Usuario', 'Accion', 'Detalle'], CM.db.audit.map(function (a) { return [a.ts, a.user, a.accion, a.detalle]; })));
  };
  CM.acts['reset-demo'] = function () {
    CM.modal.open({ title: 'Restablecer datos de ejemplo', body: '<p>Se borran todos los cambios hechos en esta demo y se vuelven a cargar los pacientes ficticios.</p>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn bad" data-act="reset-ok">Sí, restablecer</button>' });
  };
  CM.acts['reset-ok'] = function () { CM.reset(); CM.modal.close(); g.location.hash = '#/inicio'; render(); CM.toast('Datos de ejemplo restablecidos.'); };
  function fail(f, name, msg) {
    var e = $('[data-err]', f); if (e) e.textContent = msg;
    $$('[aria-invalid]', f).forEach(function (x) { x.removeAttribute('aria-invalid'); });
    var el = name && f.elements[name]; if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
    return false;
  }
  CM.forms.ajustes = function (f) {
    var e = f.elements, cuit = CM.soloDigitos(e.cuit.value), pv = CM.soloDigitos(e.pv.value);
    if (e.cuit.value.trim() && cuit.length !== 11) return fail(f, 'cuit', 'El CUIT debe tener 11 dígitos.');
    if (!pv || pv.length > 5) return fail(f, 'pv', 'El punto de emisión debe tener hasta 5 dígitos.');
    var tope = e.tope.value.trim() ? CM.parseCant(e.tope.value) : '';
    if (tope !== '' && (isNaN(tope) || tope <= 0)) return fail(f, 'tope', 'El tope tiene que ser un número mayor que cero (o dejalo vacío).');
    var uh = e.uh.value.trim(), us = e.us.value.trim();
    if ((uh && CM.urlDrive(uh) === null) || (us && CM.urlDrive(us) === null)) return fail(f, 'uh', 'Los enlaces de formularios deben ser https de Google.');
    var o = CM.db.ong; o.nombre = e.nombre.value.trim(); o.domicilio = e.domicilio.value.trim(); o.email = e.email.value.trim(); o.instagram = e.instagram.value.trim();
    o.cuit = cuit; o.puntoVenta = pv.padStart(4, '0'); o.condicionIva = e.iva.value.trim(); o.urlHistoria = uh || o.urlHistoria; o.urlSeguimiento = us || o.urlSeguimiento;
    CM.db.cfg.operador = e.operador.value.trim() || 'Operador demo'; CM.db.cfg.bloquearVencido = e.bloq.checked; CM.db.cfg.topeMensualG = tope;
    CM.audit('Ajustes', 'Datos de la ONG y reglas actualizados'); CM.save(); CM.toast('Ajustes guardados.'); render();
  };

  /* ===================================================================
     MODALES Y FORMULARIOS
     =================================================================== */
  CM.acts['nuevo-paciente'] = function () { modalNuevoPaciente(''); };
  function modalNuevoPaciente(dni) {
    CM.modal.open({
      title: 'Nuevo paciente · ingreso breve',
      body: '<form id="fNP" data-form="alta" class="f" autocomplete="off" novalidate><p style="margin:0;color:var(--mu)">Con estos tres datos el paciente ya queda identificado por DNI. Después se completa la historia clínica.</p>' +
        fl('Nombre y apellido *', '<input class="in" name="nombre" autocomplete="off" placeholder="Como figura en el DNI">') +
        fl('DNI * (sin espacios ni puntos)', '<input class="in" name="dni" inputmode="numeric" maxlength="9" placeholder="Ej.: 99000007" value="' + esc(dni || '') + '">') +
        fl('Teléfono * (sin espacios)', '<input class="in" name="tel" inputmode="tel" placeholder="Ej.: 3875000000"><span class="hint">Si es de otra provincia, con característica.</span>') +
        '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fNP">Guardar y abrir ficha</button>',
      focus: dni ? 'input[name=nombre]' : 'input[name=nombre]'
    });
  }
  CM.forms.alta = function (f) {
    var e = f.elements, nombre = e.nombre.value.trim().replace(/\s+/g, ' '), dni = CM.soloDigitos(e.dni.value), tel = CM.soloDigitos(e.tel.value);
    if (nombre.length < 3) return fail(f, 'nombre', 'Escribí nombre y apellido.');
    if (dni.length < 6 || dni.length > 9) return fail(f, 'dni', 'El DNI debe tener entre 6 y 9 números, sin puntos.');
    if (tel.length < 8 || tel.length > 13) return fail(f, 'tel', 'Revisá el teléfono (entre 8 y 13 números).');
    if (CM.paciente(dni)) {
      CM.modal.close(); g.location.hash = '#/paciente/' + dni; CM.toast('Ese DNI ya existe: abrí la ficha existente.'); return;
    }
    CM.db.pacientes[dni] = { dni: dni, nombre: nombre, nac: '', tel: tel, email: '', dir: '', cp: '', obraSocial: '', ocupacion: '', motivo: '', dudas: '', codSeg: '', historiaCompleta: false, consentimiento: '', reprocann: { estado: 'sin', vence: null, carnet: false }, alta: CM.hoy(), drive1: '', drive2: '' };
    CM.audit('Alta de paciente', 'DNI ' + dni + ' · ingreso breve'); CM.save();
    CM.modal.close(true); g.location.hash = '#/paciente/' + dni; render(); CM.toast('Paciente creado. Falta completar la historia clínica.');
  };

  CM.acts.historia = function (t) { modalHistoria(t.getAttribute('data-dni')); };
  function modalHistoria(dni) {
    var p = CM.paciente(dni); if (!p) return;
    var h = CM.hoy();
    CM.modal.open({
      title: 'Historia clínica · Solicitud REPROCANN', wide: true,
      body: '<form id="fHC" data-form="historia" class="f" autocomplete="off" novalidate><input type="hidden" name="dni" value="' + esc(dni) + '">' +
        '<div class="note info">Mismos datos que el formulario de Google “Historia Clínica / Solicitud Reprocann”. Los datos se usan resguardando la identidad del paciente.</div>' +
        fl('Motivo de consulta / por qué motivo utiliza cannabis *', '<textarea class="in" name="motivo">' + esc(p.motivo) + '</textarea>') +
        '<div class="f f2">' + fl('Nombre y apellido *', '<input class="in" name="nombre" value="' + esc(p.nombre) + '">') + fl('Fecha de nacimiento *', '<input class="in" type="date" name="nac" min="1900-01-01" max="' + h + '" value="' + esc(p.nac) + '">') +
        fl('DNI', '<input class="in" name="dnix" value="' + esc(dni) + '" readonly>') + fl('Teléfono * (sin espacios)', '<input class="in" name="tel" inputmode="tel" value="' + esc(p.tel) + '">') +
        fl('Correo electrónico *', '<input class="in" name="email" type="email" value="' + esc(p.email) + '">') + fl('Código postal *', '<input class="in" name="cp" value="' + esc(p.cp) + '" maxlength="8">') + '</div>' +
        fl('Dirección * (provincia, localidad, barrio, calle, N.º)', '<textarea class="in" name="dir" style="min-height:64px">' + esc(p.dir) + '</textarea>') +
        '<div class="f f2">' + fl('Obra social / N.º', '<input class="in" name="obra" value="' + esc(p.obraSocial) + '">') + fl('Código de seguimiento · paciente REPROCANN', '<input class="in" name="codSeg" value="' + esc(p.codSeg) + '">') +
        fl('Labor · ocupación · trabajo *', '<input class="in" name="ocupacion" value="' + esc(p.ocupacion) + '">') + fl('Dudas, consultas o comentarios', '<input class="in" name="dudas" value="' + esc(p.dudas) + '">') + '</div>' +
        '<div id="tutorBox" hidden>' + fl('Madre, padre o representante legal (obligatorio si es menor de 18 años)', '<input class="in" name="tutor" value="' + esc(p.tutor || '') + '">') + '</div>' +
        '<label class="chk"><input type="checkbox" name="consent"' + (p.consentimiento ? ' checked' : '') + '><span>El paciente otorga su consentimiento para recibir asesoría, sugerencias y acompañamiento del equipo profesional, y para el tratamiento de sus datos personales <b>[texto legal a validar con asesor]</b>.</span></label>' +
        '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fHC">Guardar historia clínica</button>'
    });
  }
  CM.forms.historia = function (f) {
    var e = f.elements, dni = e.dni.value, p = CM.paciente(dni); if (!p) return;
    var nombre = e.nombre.value.trim().replace(/\s+/g, ' '), nac = e.nac.value, tel = CM.soloDigitos(e.tel.value), email = e.email.value.trim();
    if (!e.motivo.value.trim()) return fail(f, 'motivo', 'Contanos el motivo de consulta.');
    if (nombre.length < 3) return fail(f, 'nombre', 'Escribí nombre y apellido.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nac) || nac > CM.hoy() || nac < '1900-01-01') return fail(f, 'nac', 'Cargá una fecha de nacimiento válida (año de 4 cifras).');
    if (tel.length < 8 || tel.length > 13) return fail(f, 'tel', 'Revisá el teléfono.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(f, 'email', 'Escribí un correo válido.');
    if (!e.cp.value.trim()) return fail(f, 'cp', 'Falta el código postal.');
    if (!e.dir.value.trim()) return fail(f, 'dir', 'Falta la dirección.');
    if (!e.ocupacion.value.trim()) return fail(f, 'ocupacion', 'Falta la labor u ocupación.');
    var ed = CM.edad(nac);
    if (ed < 18 && !e.tutor.value.trim()) { $('#tutorBox').hidden = false; return fail(f, 'tutor', 'El paciente es menor de 18 años: se necesita el representante legal.'); }
    if (!e.consent.checked) return fail(f, 'consent', 'Hace falta el consentimiento informado.');
    p.nombre = nombre; p.nac = nac; p.tel = tel; p.email = email; p.cp = e.cp.value.trim(); p.dir = e.dir.value.trim(); p.motivo = e.motivo.value.trim();
    p.obraSocial = e.obra.value.trim(); p.codSeg = e.codSeg.value.trim(); p.ocupacion = e.ocupacion.value.trim(); p.dudas = e.dudas.value.trim(); p.tutor = e.tutor.value.trim();
    if (!p.consentimiento) p.consentimiento = CM.hoy();
    var primera = !p.historiaCompleta; p.historiaCompleta = true;
    CM.audit(primera ? 'Historia clínica completada' : 'Historia clínica editada', 'DNI ' + dni); CM.save();
    CM.modal.close(true); render(); CM.toast('Historia clínica guardada.');
  };
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.name === 'nac' && t.form && t.form.id === 'fHC') {
      var ed = CM.edad(t.value), b = $('#tutorBox'); if (b) b.hidden = !(ed != null && ed < 18);
    }
  });

  /* Drive */
  CM.acts['drive-edit'] = function (t) {
    var dni = t.getAttribute('data-dni'), w = t.getAttribute('data-w'), p = CM.paciente(dni);
    CM.modal.open({
      title: 'Vincular ' + (w === '1' ? 'Drive 1 · Ficha y documentación' : 'Drive 2 · Historial clínico'),
      body: '<form id="fDR" data-form="drive" class="f" novalidate><input type="hidden" name="dni" value="' + esc(dni) + '"><input type="hidden" name="w" value="' + esc(w) + '">' +
        fl('Enlace de la carpeta o archivo (https://drive.google.com/…)', '<input class="in" name="url" inputmode="url" placeholder="https://drive.google.com/drive/folders/…" value="' + esc(p['drive' + w]) + '">') +
        '<p class="hint" style="margin:0">Sólo se aceptan enlaces https de Google. Dejalo vacío para desvincular.</p><p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fDR">Guardar enlace</button>'
    });
  };
  CM.forms.drive = function (f) {
    var e = f.elements, p = CM.paciente(e.dni.value); if (!p) return;
    var u = CM.urlDrive(e.url.value);
    if (u === null) return fail(f, 'url', 'El enlace tiene que empezar con https:// y ser de Google Drive o Google Docs.');
    p['drive' + e.w.value] = u;
    CM.audit('Enlace de Drive ' + e.w.value, 'DNI ' + p.dni + (u ? ' vinculado' : ' desvinculado')); CM.save(); CM.modal.close(true); render(); CM.toast('Enlace guardado.');
  };
  CM.acts.copiar = function (t) {
    var v = t.getAttribute('data-v');
    var ok = function () { CM.toast('Enlace copiado.'); };
    try { navigator.clipboard.writeText(v).then(ok, function () { CM.toast('No se pudo copiar: seleccionalo manualmente.', true); }); } catch (e) { CM.toast('No se pudo copiar: seleccionalo manualmente.', true); }
  };

  /* REPROCANN (paciente y ONG) */
  function repForm(titulo, dni, r, ong) {
    CM.modal.open({
      title: titulo,
      body: '<form id="fRP" data-form="rep" class="f" novalidate><input type="hidden" name="dni" value="' + esc(dni) + '">' +
        fl('Estado', '<select class="in" name="estado">' + opt('valido', 'Válido', r.estado === 'valido') + opt('tramite', 'En trámite', r.estado === 'tramite') + opt('vencido', 'Vencido', r.estado === 'vencido') + (ong ? '' : opt('sin', 'Sin REPROCANN', r.estado === 'sin' || !r.estado)) + '</select>') +
        fl('Fecha de vencimiento', '<input class="in" type="date" name="vence" value="' + esc(r.vence || '') + '">') +
        (ong ? fl('N.º de inscripción de la ONG', '<input class="in" name="nro" value="' + esc(r.nroInscripcion || '') + '">') : '<label class="chk"><input type="checkbox" name="carnet"' + (r.carnet ? ' checked' : '') + '><span>Carnet entregado al paciente</span></label>') +
        '<p class="hint" style="margin:0">Cargá lo que figura en el sitio oficial del REPROCANN <b>[VERIFICAR vigencias en reprocann.msal.gob.ar]</b>.</p><p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fRP">Guardar</button>'
    });
  }
  CM.acts['rep-edit'] = function (t) { var dni = t.getAttribute('data-dni'), p = CM.paciente(dni); repForm('REPROCANN del paciente', dni, p.reprocann || {}, false); };
  CM.acts['rep-ong'] = function () { repForm('REPROCANN de la ONG (persona jurídica)', '', CM.db.ong.reprocann, true); };
  CM.forms.rep = function (f) {
    var e = f.elements, dni = e.dni.value, est = e.estado.value, vence = e.vence.value;
    if (vence && !/^\d{4}-\d{2}-\d{2}$/.test(vence)) return fail(f, 'vence', 'Fecha inválida.');
    if (est === 'valido' && !vence) return fail(f, 'vence', 'Un permiso válido necesita fecha de vencimiento.');
    if (dni) {
      var p = CM.paciente(dni); p.reprocann = { estado: est, vence: vence || null, carnet: e.carnet ? e.carnet.checked : false };
      CM.audit('REPROCANN del paciente', 'DNI ' + dni + ' → ' + CM.REP_LABEL[est] + (vence ? ' hasta ' + CM.fmtFecha(vence) : ''));
    } else {
      CM.db.ong.reprocann = { estado: est, vence: vence || null, nroInscripcion: e.nro.value.trim() };
      CM.audit('REPROCANN de la ONG', CM.REP_LABEL[est] + (vence ? ' hasta ' + CM.fmtFecha(vence) : ''));
    }
    CM.save(); CM.modal.close(true); render(); CM.toast('Estado REPROCANN actualizado.');
  };

  /* ---------- buscar paciente dentro de un modal ---------- */
  function resolverDni(inp) {
    var d = CM.soloDigitos(inp.value), p = CM.paciente(d), box = $(inp.id === 'dsDni' ? '#dsPac' : '#apPac');
    if (!box) return;
    if (!d) { box.innerHTML = ''; return; }
    if (!p) {
      box.innerHTML = '<span class="hint">No existe ese DNI todavía.</span>';
      if (inp.id === 'dsDni') { $('#dsAvisos').innerHTML = ''; var bb = $('button[form=fDS]'); if (bb) bb.disabled = false; }
      return;
    }
    box.innerHTML = '<b>' + esc(p.nombre) + '</b> ' + repPill(CM.estadoRep(p.reprocann));
    if (inp.id === 'dsDni') mostrarAvisos(p);
  }
  function mostrarAvisos(p) {
    var r = CM.reglasDispensar(p);
    $('#dsAvisos').innerHTML = r.msgs.map(function (m) { return '<div class="note ' + m.t + '">' + esc(m.m) + '</div>'; }).join('');
    var b = $('#fDS button[type=submit]') || $('button[form=fDS]');
    if (b) b.disabled = r.bloquea;
    if ($('#dsObsReq')) $('#dsObsReq').textContent = r.pideObs ? ' *' : '';
  }

  /* ---------- dispensar ---------- */
  CM.acts.dispensar = function (t) { modalDispensar(t.getAttribute('data-dni') || ''); };
  function modalDispensar(dni) {
    var p = dni ? CM.paciente(dni) : null;
    var lotes = CM.db.lotes, grupos = '';
    Object.keys(CM.PRODUCTOS).forEach(function (k) {
      var ls = lotes.filter(function (l) { return l.prod === k; });
      if (!ls.length) return;
      grupos += '<optgroup label="' + esc(CM.PRODUCTOS[k].n) + '">' + ls.map(function (l) { var s = CM.stockLote(l.id); return opt(l.id, l.nombre + ' · ' + l.id + ' · quedan ' + cantTxt(s, l.unidad), false, s <= 0); }).join('') + '</optgroup>';
    });
    CM.modal.open({
      title: 'Registrar dispensación', wide: true,
      body: '<form id="fDS" data-form="dispensar" class="f" autocomplete="off" novalidate>' +
        (p ? '<input type="hidden" name="dni" value="' + esc(dni) + '"><div class="card flat"><b>' + esc(p.nombre) + '</b> · DNI ' + esc(dni) + ' ' + repPill(CM.estadoRep(p.reprocann)) + '</div>' :
          fl('DNI del paciente *', '<input class="in" id="dsDni" name="dni" inputmode="numeric" maxlength="9" placeholder="Sin puntos"><span id="dsPac" class="hint" aria-live="polite"></span>')) +
        '<div id="dsAvisos" aria-live="polite"></div>' +
        fl('Preparado y lote *', '<select class="in" id="dsLote" name="lote"><option value="">Elegí un preparado…</option>' + grupos + '</select>') +
        '<div class="f f2">' + flr('Cantidad entregada * <span id="dsUni" style="color:var(--ac)"></span>', '<input class="in num" name="cant" inputmode="decimal" placeholder="0"><span id="dsDisp" class="hint"></span>') +
        fl('Indicación / posología', '<input class="in" name="indic" placeholder="Según indicación médica">') + '</div>' +
        flr('Observación<span id="dsObsReq"></span>', '<textarea class="in" name="obs" style="min-height:64px" placeholder="Obligatoria si el REPROCANN está en trámite, sin cargar o se supera el tope"></textarea>') +
        '<fieldset><legend>Aporte voluntario (opcional)</legend><div class="f f2">' + fl('Importe del aporte', '<input class="in num" name="aporte" inputmode="decimal" placeholder="0">') +
        fl('Medio', '<select class="in" name="medio">' + Object.keys(CM.MEDIOS).map(function (k) { return opt(k, CM.MEDIOS[k]); }).join('') + '</select>') + '</div>' +
        '<label class="chk" style="margin-top:10px"><input type="checkbox" name="fc" checked><span>Emitir Factura C simulada si hay aporte</span></label></fieldset>' +
        '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fDS">Confirmar dispensación</button>'
    });
    if (p) mostrarAvisos(p);
  }
  function actualizarLote() {
    var sel = $('#dsLote'); if (!sel) return;
    var l = CM.lote(sel.value), u = $('#dsUni'), d = $('#dsDisp');
    if (!l) { u.textContent = ''; d.textContent = ''; return; }
    u.textContent = '(' + (l.unidad === 'g' ? 'gramos' : l.unidad === 'frasco' ? 'frascos' : 'unidades') + ')';
    d.textContent = 'Disponible: ' + cantTxt(CM.stockLote(l.id), l.unidad);
  }
  CM.forms.dispensar = function (f) {
    if (f.dataset.busy) return;
    var e = f.elements, dni = CM.soloDigitos(e.dni.value), p = CM.paciente(dni);
    if (!p) return fail(f, 'dni', 'Ese DNI no existe. Creá primero al paciente.');
    var l = CM.lote(e.lote.value);
    if (!l) return fail(f, 'lote', 'Elegí el preparado y el lote.');
    var cant = CM.parseCant(e.cant.value);
    if (isNaN(cant) || cant <= 0) return fail(f, 'cant', 'Escribí una cantidad mayor que cero (hasta 2 decimales).');
    if (l.unidad !== 'g' && Math.round(cant) !== cant) return fail(f, 'cant', 'Los frascos y las unidades se entregan enteros.');
    var stock = CM.stockLote(l.id);
    if (cant > stock) return fail(f, 'cant', 'No alcanza el stock del lote: quedan ' + cantTxt(stock, l.unidad) + '.');
    var reglas = CM.reglasDispensar(p);
    if (reglas.bloquea) return fail(f, '', 'No se puede dispensar: ' + reglas.msgs.filter(function (m) { return m.t === 'bad'; }).map(function (m) { return m.m; }).join(' '));
    var obs = e.obs.value.trim(), pideObs = reglas.pideObs, tope = CM.db.cfg.topeMensualG;
    if (l.unidad === 'g' && tope && CM.gramosMes(dni, CM.mesActual()) + cant > tope) {
      pideObs = true;
      if (!obs) return fail(f, 'obs', 'Se supera el tope mensual de ' + tope + ' g del paciente: explicá el motivo en la observación.');
    }
    if (pideObs && !obs) return fail(f, 'obs', 'Falta la observación (obligatoria por el estado del REPROCANN).');
    var aporte = 0;
    if (e.aporte.value.trim()) { aporte = CM.parseMonto(e.aporte.value); if (isNaN(aporte)) return fail(f, 'aporte', 'El aporte no es un importe válido (ej.: 15.000 o 15000,50).'); }
    f.dataset.busy = '1';
    var h = CM.hoy(), id = CM.nextId('D');
    CM.db.disp.push({ id: id, fecha: h, ts: new Date().toISOString(), dni: dni, lote: l.id, prod: l.prod, nombre: l.nombre, quim: l.quim, unidad: l.unidad, cant: cant, indic: e.indic.value.trim(), obs: obs, user: CM.db.cfg.operador, aporte: '', anulada: null });
    CM.addMov(l.id, 'dispensacion', -cant, id, '');
    var ap = null, comp = null;
    if (aporte > 0) {
      ap = { id: CM.nextId('A'), fecha: h, ts: new Date().toISOString(), dni: dni, disp: id, cent: aporte, medio: e.medio.value, concepto: 'Aporte voluntario', obs: '', user: CM.db.cfg.operador, estado: 'registrado', comp: '' };
      CM.db.aportes.push(ap); CM.db.disp[CM.db.disp.length - 1].aporte = ap.id;
      CM.audit('Aporte voluntario', ap.id + ' · DNI ' + dni + ' · ' + CM.fmtMoney(aporte));
      if (e.fc.checked) { comp = CM.emitirFacturaC(ap); CM.audit('Factura C simulada', comp.pv + '-' + comp.nro + ' · ' + ap.id); }
    }
    CM.audit('Dispensación', id + ' · DNI ' + dni + ' · ' + l.nombre + ' · ' + cantTxt(cant, l.unidad) + (obs ? ' · obs: ' + obs : ''));
    CM.save(); CM.modal.close(true); render();
    exitoDispensacion(id, comp);
  };
  function exitoDispensacion(id, comp) {
    var d = CM.db.disp.filter(function (x) { return x.id === id; })[0];
    CM.modal.open({
      title: 'Dispensación registrada',
      body: '<div class="note ok"><b>' + esc(id) + '</b> · ' + esc(nombreCorto(nombreDe(d.dni))) + ' · ' + esc(d.nombre) + ' · ' + esc(cantTxt(d.cant, d.unidad)) + '. El stock del lote ya se descontó.</div>' + (comp ? '<div class="note info">Se emitió la Factura C simulada ' + esc(comp.pv + '-' + comp.nro) + '.</div>' : '') +
        '<div class="row"><button class="btn pri" data-act="etiqueta" data-id="' + esc(id) + '">' + CM.icon('qr') + 'Imprimir etiqueta con QR</button>' + (comp ? '<button class="btn" data-act="ver-comp" data-id="' + esc(comp.id) + '">' + CM.icon('doc') + 'Ver Factura C</button>' : '') + '<a class="btn" href="#/paciente/' + esc(d.dni) + '" data-act="modal-close">Ir a la ficha</a></div>',
      footer: '<button class="btn" data-act="modal-close">Cerrar</button>'
    });
  }
  CM.acts['anular-disp'] = function (t) {
    var id = t.getAttribute('data-id');
    CM.modal.open({
      title: 'Anular dispensación ' + id,
      body: '<form id="fAN" data-form="anular" class="f" novalidate><input type="hidden" name="id" value="' + esc(id) + '"><p style="margin:0">La dispensación no se borra: queda marcada como anulada y el lote recupera la cantidad con un movimiento de anulación.</p>' + fl('Motivo de la anulación *', '<textarea class="in" name="motivo"></textarea>') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Volver</button><button class="btn bad" type="submit" form="fAN">Anular dispensación</button>'
    });
  };
  CM.forms.anular = function (f) {
    var id = f.elements.id.value, motivo = f.elements.motivo.value.trim();
    var d = CM.db.disp.filter(function (x) { return x.id === id; })[0];
    if (!d || d.anulada) return;
    if (motivo.length < 5) return fail(f, 'motivo', 'Escribí el motivo (mínimo 5 letras).');
    d.anulada = { ts: new Date().toISOString(), motivo: motivo, user: CM.db.cfg.operador };
    CM.addMov(d.lote, 'anulacion', d.cant, id, motivo);
    CM.audit('Anulación de dispensación', id + ' · ' + motivo);
    CM.save(); CM.modal.close(true); render(); CM.toast('Dispensación anulada. El lote recuperó la cantidad.');
  };

  /* ---------- etiqueta con QR al formulario de seguimiento ---------- */
  CM.acts.etiqueta = function (t) {
    var id = t.getAttribute('data-id'), d = CM.db.disp.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    var html = etiquetaHTML(d);
    CM.modal.open({
      title: 'Etiqueta de dispensación ' + id,
      body: html + '<p class="hint" style="margin:0">El QR abre el formulario de Seguimiento médico. La etiqueta no lleva el nombre del paciente: sólo el N.º de dispensación para la trazabilidad.</p>',
      footer: '<button class="btn" data-act="modal-close">Cerrar</button><button class="btn pri" data-act="etiqueta-print" data-id="' + esc(id) + '">' + CM.icon('print') + 'Imprimir</button>'
    });
  };
  CM.acts['etiqueta-print'] = function (t) {
    var d = CM.db.disp.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]; if (d) CM.imprimir(etiquetaHTML(d));
  };
  function etiquetaHTML(d) {
    var peso = d.unidad === 'g' ? 'Peso neto: ' + CM.fmtNum(d.cant) + ' g' : 'Cantidad: ' + cantTxt(d.cant, d.unidad);
    return '<div class="doc" style="padding:0;max-width:362px;background:none"><div class="label" style="background:#fff;color:#111"><div class="darkband"><img src="assets/logo.png" alt="Cannabismatica Investigación y Desarrollo"></div>' +
      '<div class="gen">' + esc(d.nombre) + '</div><div class="row2"><span>' + esc(peso) + '</span><span>' + esc(d.quim) + '</span></div>' +
      '<div class="row2" style="font-size:12px;color:#444"><span>Lote ' + esc(d.lote) + '</span><span>N.º ' + esc(d.id) + ' · ' + CM.fmtFecha(d.fecha) + '</span></div>' +
      '<div class="qr">' + CM.qrSvg(CM.db.ong.urlSeguimiento) + '<p><b>Formulario Seguimiento Médico</b><br>Cannabismatica I+D<br><br>Ley 27.350<br>Reprocann</p></div></div></div>';
  }

  /* ---------- aportes y Factura C ---------- */
  CM.acts.aporte = function (t) { modalAporte(t.getAttribute('data-dni') || ''); };
  function modalAporte(dni) {
    var p = dni ? CM.paciente(dni) : null;
    CM.modal.open({
      title: 'Registrar aporte voluntario',
      body: '<form id="fAP" data-form="aporte" class="f" autocomplete="off" novalidate>' +
        (p ? '<input type="hidden" name="dni" value="' + esc(dni) + '"><div class="card flat"><b>' + esc(p.nombre) + '</b> · DNI ' + esc(dni) + '</div>' : fl('DNI del paciente *', '<input class="in" id="apDni" name="dni" inputmode="numeric" maxlength="9" placeholder="Sin puntos"><span id="apPac" class="hint" aria-live="polite"></span>')) +
        '<div class="f f2">' + fl('Concepto', '<select class="in" name="concepto">' + CM.CONCEPTOS.map(function (c) { return opt(c, c); }).join('') + '</select>') +
        fl('Medio', '<select class="in" name="medio">' + Object.keys(CM.MEDIOS).map(function (k) { return opt(k, CM.MEDIOS[k]); }).join('') + '</select>') + '</div>' +
        fl('Importe del aporte (en pesos) *', '<input class="in num" name="importe" inputmode="decimal" placeholder="0" style="font-size:20px">') +
        fl('Observación', '<input class="in" name="obs" placeholder="Opcional">') +
        '<label class="chk"><input type="checkbox" name="fc" checked><span>Emitir Factura C simulada ahora</span></label><p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fAP">Registrar aporte</button>'
    });
  }
  CM.forms.aporte = function (f) {
    if (f.dataset.busy) return;
    var e = f.elements, dni = CM.soloDigitos(e.dni.value), p = CM.paciente(dni);
    if (!p) return fail(f, 'dni', 'Ese DNI no existe. Creá primero al paciente.');
    var cent = CM.parseMonto(e.importe.value);
    if (isNaN(cent) || cent <= 0) return fail(f, 'importe', 'Escribí un importe mayor que cero (ej.: 15.000 o 15000,50).');
    f.dataset.busy = '1';
    var a = { id: CM.nextId('A'), fecha: CM.hoy(), ts: new Date().toISOString(), dni: dni, disp: '', cent: cent, medio: e.medio.value, concepto: e.concepto.value, obs: e.obs.value.trim(), user: CM.db.cfg.operador, estado: 'registrado', comp: '' };
    CM.db.aportes.push(a); CM.audit('Aporte voluntario', a.id + ' · DNI ' + dni + ' · ' + CM.fmtMoney(cent) + ' · ' + a.concepto);
    var c = null;
    if (e.fc.checked) { c = CM.emitirFacturaC(a); CM.audit('Factura C simulada', c.pv + '-' + c.nro + ' · ' + a.id); }
    CM.save(); CM.modal.close(true); render();
    if (c) verComprobante(c.id); else CM.toast('Aporte registrado.');
  };
  CM.acts['emitir-fc'] = function (t) {
    var a = CM.db.aportes.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0];
    if (!a || a.comp || a.estado !== 'registrado') return;
    var c = CM.emitirFacturaC(a); CM.audit('Factura C simulada', c.pv + '-' + c.nro + ' · ' + a.id); CM.save(); render(); verComprobante(c.id);
  };
  CM.acts['ver-comp'] = function (t) { verComprobante(t.getAttribute('data-id')); };
  function docComp(c) {
    var o = CM.db.ong, p = CM.paciente(c.dni), nc = c.tipo === 'NCC';
    return '<div class="doc"><div class="demo">DOCUMENTO DE DEMOSTRACIÓN · SIN VALIDEZ FISCAL · NO ENVIADO A ARCA</div>' +
      '<div class="hd"><div><h1 style="font-size:17px">' + esc(o.nombre) + '</h1><div>' + esc(o.domicilio) + '</div><div>Condición frente al IVA: ' + esc(o.condicionIva) + '</div></div>' +
      '<div class="letra">C<small>COD. ' + (nc ? '013' : '011') + '</small></div>' +
      '<div><h1>' + (nc ? 'NOTA DE CRÉDITO' : 'FACTURA') + '</h1><div>Punto de emisión: <b>' + esc(c.pv) + '</b> · N.º: <b>' + esc(c.nro) + '</b></div><div>Fecha de emisión: <b>' + CM.fmtFecha(c.fecha) + '</b></div><div>CUIT: ' + (o.cuit ? esc(o.cuit) : '<i>[a completar en Ajustes]</i>') + '</div></div></div>' +
      '<div style="border:1px solid #111;border-top:0;padding:10px 12px"><b>Receptor:</b> ' + esc(p ? nombreCorto(p.nombre) : '') + ' · DNI ' + esc(c.dni) + ' · Condición frente al IVA: Consumidor final</div>' +
      '<table style="margin-top:12px"><thead><tr><th>Concepto</th><th style="width:130px;text-align:right">Importe</th></tr></thead><tbody><tr><td>' + esc(c.concepto) + '</td><td style="text-align:right">' + esc(CM.fmtMoney(c.cent)) + '</td></tr></tbody></table>' +
      '<div class="tot">Importe total: ' + esc(CM.fmtMoney(c.cent)) + '</div>' +
      '<div class="ft">CAE simulado N.º ' + esc(c.cae) + ' · Vto.: ' + CM.fmtFecha(c.caeVto) + '<br>Comprobante generado por la demo del Sistema ONG. Para emitir con CAE real se requiere el certificado digital de la ONG y la conexión con los servicios de ARCA [VERIFICAR].<br>Aporte voluntario registrado por ' + esc(CM.db.cfg.operador) + '.</div></div>';
  }
  function verComprobante(id) {
    var c = CM.comp(id); if (!c) return;
    CM.modal.open({
      title: (c.tipo === 'FC' ? 'Factura C ' : 'Nota de crédito C ') + c.pv + '-' + c.nro, wide: true,
      body: '<div style="background:#fff;border-radius:12px;overflow:auto">' + docComp(c) + '</div>' + (c.anulado ? '<div class="note bad">Esta Factura C fue anulada con una nota de crédito C.</div>' : ''),
      footer: '<button class="btn" data-act="modal-close">Cerrar</button>' + (c.tipo === 'FC' && !c.anulado ? '<button class="btn bad" data-act="nc" data-id="' + esc(c.id) + '">Anular con nota de crédito C</button>' : '') + '<button class="btn pri" data-act="print-comp" data-id="' + esc(c.id) + '">' + CM.icon('print') + 'Imprimir / guardar PDF</button>'
    });
  }
  CM.acts['print-comp'] = function (t) { var c = CM.comp(t.getAttribute('data-id')); if (c) CM.imprimir(docComp(c)); };
  CM.acts.nc = function (t) {
    var id = t.getAttribute('data-id');
    CM.modal.open({
      title: 'Anular Factura C con nota de crédito C',
      body: '<form id="fNC" data-form="nc" class="f" novalidate><input type="hidden" name="id" value="' + esc(id) + '"><p style="margin:0">Un comprobante emitido no se edita: se anula con una nota de crédito (simulada) por el mismo importe.</p>' + fl('Motivo *', '<input class="in" name="motivo">') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Volver</button><button class="btn bad" type="submit" form="fNC">Emitir nota de crédito C</button>'
    });
  };
  CM.forms.nc = function (f) {
    var c = CM.comp(f.elements.id.value), motivo = f.elements.motivo.value.trim();
    if (!c || c.anulado) return;
    if (motivo.length < 4) return fail(f, 'motivo', 'Escribí el motivo.');
    var n = CM.emitirNotaCreditoC(c, motivo);
    CM.audit('Nota de crédito C simulada', n.pv + '-' + n.nro + ' anula ' + c.pv + '-' + c.nro + ' · ' + motivo);
    CM.save(); CM.modal.close(true); render(); verComprobante(n.id);
  };

  /* ---------- seguimiento médico (formulario de Google) ---------- */
  var SEG = {
    objetivos: ['Uso Adulto y Responsable', 'Disminución de Riesgos y Daños asociado al consumo de Cannabis', 'Disminución de Riesgos y Daños asociado al consumo de Otras Sustancias (Tabaco, Alcohol, Estupefacientes, Drogas Peligrosas)', 'Ansiedad', 'Alzheimer', 'Anorexia - Caquexia', 'Artritis', 'Artrosis', 'Atralgia', 'Asma', 'Asperger', 'Ataxia', 'Condicion Espectro Autista', 'Convulsiones', 'Cuidados paliativos / Fin de la vida', 'Depresion', 'Dermatitis atopica / eccema atopico', 'Dolor Cronico', 'Dolor Articular', 'Enfermedad de Crohn', 'Epilepsia', 'Esclerosis Multiple', 'Esclerosis Tuberosa', 'Estres', 'Estres Post Traumatico', 'Esquizofrenia', 'Fibromialgia', 'Hernia Lumar', 'Inflamacion', 'Insomnio', 'Lupus', 'Migraña', 'Mialgia', 'Neuralgia', 'Neuralgia del Trigemino', 'Neurofibromatosis tipo 1', 'Neuropatia Diabetica', 'Paralisis Cerebral', 'Parkinson', 'Psoriasis', 'Quemaduras', 'Quimioterapia', 'Retraso Madurativo', 'Sd Tourette', 'Temblor Escencial', 'Tercera Edad', 'Trastorno del Sueño', 'Vitiligo'],
    vias: ['Inhalatoria Combustion', 'Inhalatoria Vaporizacion', 'Oral - Comida', 'Sublingual', 'Tópica (piel)', 'Otras vias (especificar)'],
    productos: ['Flores Secas', 'Aceite Sublingual', 'Comestible Oral', 'Crema Topica'],
    genetica: ['Aromito Q3 CBD', 'Tropicana Cookies (fenotipo cookies) Q1', 'Tropicana Old Cookies (fenotipo cookies, cosecha tardía alta en CBN) Q1+CBN', 'ZaZa Q1', '(BSOD74) Petroleum Q1', 'Fancy Q1', 'ChemoVar Q2'],
    quim: ['Quimitipo 1 (THC)', 'Quimitipo 2 (TCH = CBD)', 'Quimitipo 3 (CBD)', 'CBN (Cannabinol)', 'CBG'],
    mejoras: ['Disminución de Ansiedad', 'Disminucion Dolor', 'Disminución de Inflamacion', 'Mejora del Sueño', 'Mejora del Estado del Animo', 'Mejora de la Calidad de vida', 'Mejora en el Apetito - Digestion', 'Mejora de Movilidad y Actividades'],
    efectos: ['No siento efectos adversos', 'Ansiedad', 'Disminución de la voluntad y energia', 'Depresion', 'Palpitaciones', 'Dolor de Pecho - Torax', 'Mareos', 'Nauseas y Vomitos', 'Sequedad Bucal', 'Somnolencia - Sueño Diurno', 'Vertigo', 'Paranoia'],
    habitos: ['Si, Dieta / Nutrición', 'Si, Actividad Fisica', 'Si, Recreación', 'Si, Estudio / Trabajo / Deberes / Obligaciones', 'No tengo necesidad de realizar - mejorar algunas de las actividades anteriores.']
  };
  function chks(name, arr) {
    return '<div class="chks">' + arr.map(function (v) { return '<label class="chk"><input type="checkbox" name="' + name + '" value="' + esc(v) + '"><span>' + esc(v) + '</span></label>'; }).join('') + '</div>';
  }
  function yn(name) { return '<select class="in" name="' + name + '" style="max-width:200px">' + opt('', 'Sin responder') + opt('Si', 'Sí') + opt('No', 'No') + '</select>'; }
  CM.acts.seguimiento = function (t) {
    var dni = t.getAttribute('data-dni'), p = CM.paciente(dni); if (!p) return;
    CM.modal.open({
      title: 'Seguimiento médico continuo', wide: true,
      body: '<form id="fSG" data-form="seg" class="f" autocomplete="off" novalidate><input type="hidden" name="dni" value="' + esc(dni) + '">' +
        '<div class="note info">Formulario de seguimiento terapéutico mensual. Los datos se emplean únicamente con fines médico-científicos, resguardando la identidad del paciente. Paciente: <b>' + esc(nombreCorto(p.nombre)) + '</b> · DNI ' + esc(dni) + '.</div>' +
        '<fieldset><legend>Síntoma o patología a mejorar · objetivo terapéutico</legend>' + chks('objetivos', SEG.objetivos) + fl('Otro (aclarar sintomatología)', '<input class="in" name="otro">') + '</fieldset>' +
        '<fieldset><legend>Vías de administración</legend>' + chks('vias', SEG.vias) + '</fieldset>' +
        '<fieldset><legend>Productos indicados</legend>' + chks('productos', SEG.productos) + '</fieldset>' +
        fl('Flor seca terapéutica: genética que mejor lo acompañó durante el mes', '<select class="in" name="genetica">' + opt('', 'Sin responder') + SEG.genetica.map(function (v) { return opt(v, v); }).join('') + '</select>') +
        '<fieldset><legend>¿Sabe qué quimiotipo está consumiendo?</legend>' + chks('quim', SEG.quim) + '</fieldset>' +
        '<fieldset><legend>¿Siente alguna de las siguientes mejoras?</legend>' + chks('mejoras', SEG.mejoras) + '</fieldset>' +
        '<fieldset><legend>¿Siente alguno de estos efectos no deseados?</legend>' + chks('efectos', SEG.efectos) + '</fieldset>' +
        '<div class="f f2">' + fl('¿Dejó de realizar alguna actividad desde el consumo?', yn('dejo')) + fl('¿Mejoró o comenzó una actividad nueva?', yn('nueva')) + '</div>' +
        fl('¿Qué tipo de actividad comenzó o mejoró?', '<input class="in" name="tipoAct">') +
        '<fieldset><legend>¿Reconoce la necesidad de mejorar hábitos y estilos de vida saludables?</legend>' + chks('habitos', SEG.habitos) + '</fieldset>' +
        fl('Algún comentario que quieras compartir', '<textarea class="in" name="comentario"></textarea>') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fSG">Guardar seguimiento</button>'
    });
  };
  CM.forms.seg = function (f) {
    var e = f.elements, dni = e.dni.value;
    function vals(n) { return $$('input[name=' + n + ']:checked', f).map(function (x) { return x.value; }); }
    var o = { id: CM.nextId('S'), dni: dni, fecha: CM.hoy(), objetivos: vals('objetivos'), otro: e.otro.value.trim(), vias: vals('vias'), productos: vals('productos'), genetica: e.genetica.value, quim: vals('quim'), mejoras: vals('mejoras'), efectos: vals('efectos'), dejo: e.dejo.value, nueva: e.nueva.value, tipoAct: e.tipoAct.value.trim(), habitos: vals('habitos'), comentario: e.comentario.value.trim() };
    if (!o.objetivos.length && !o.otro) return fail(f, '', 'Elegí al menos un síntoma u objetivo terapéutico (o completá “Otro”).');
    if (o.otro) o.objetivos.push('Otro: ' + o.otro);
    CM.db.seg.push(o); CM.audit('Seguimiento médico', 'DNI ' + dni); CM.save(); CM.modal.close(true); render(); CM.toast('Seguimiento guardado.');
  };

  /* ---------- lotes y stock ---------- */
  CM.acts['lote-nuevo'] = function () {
    CM.modal.open({
      title: 'Nuevo lote de preparado',
      body: '<form id="fLN" data-form="lote" class="f" autocomplete="off" novalidate>' +
        fl('Tipo de preparado *', '<select class="in" name="prod">' + Object.keys(CM.PRODUCTOS).map(function (k) { return opt(k, CM.PRODUCTOS[k].n + ' (' + CM.PRODUCTOS[k].un + ')'); }).join('') + '</select>') +
        fl('Nombre / genética *', '<input class="in" name="nombre" placeholder="Ej.: Fancy Q1">') +
        '<div class="f f2">' + fl('Quimiotipo', '<input class="in" name="quim" placeholder="Q1, Q2, Q3…">') + fl('Cantidad que ingresa *', '<input class="in num" name="cant" inputmode="decimal" placeholder="0">') + '</div>' +
        fl('Aviso de stock bajo desde', '<input class="in num" name="min" inputmode="decimal" placeholder="' + CM.db.cfg.stockBajoDefault + '">') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fLN">Crear lote</button>'
    });
  };
  CM.forms.lote = function (f) {
    var e = f.elements, nombre = e.nombre.value.trim(), cant = CM.parseCant(e.cant.value);
    if (nombre.length < 2) return fail(f, 'nombre', 'Escribí el nombre o genética.');
    if (isNaN(cant) || cant <= 0) return fail(f, 'cant', 'Cantidad inválida.');
    var min = e.min.value.trim() ? CM.parseCant(e.min.value) : CM.db.cfg.stockBajoDefault;
    if (isNaN(min)) return fail(f, 'min', 'Valor inválido.');
    var prod = e.prod.value, un = CM.PRODUCTOS[prod].unidad;
    if (un !== 'g' && Math.round(cant) !== cant) return fail(f, 'cant', 'Los frascos y las unidades son enteros.');
    var ab = CM.norm(nombre).replace(/[^a-z0-9]/g, '').slice(0, 3).toUpperCase() || 'LOT', id = 'L-' + yymm() + '-' + ab, n = 1;
    while (CM.lote(id)) { n++; id = 'L-' + yymm() + '-' + ab + n; }
    CM.db.lotes.push({ id: id, prod: prod, nombre: nombre, quim: e.quim.value.trim() || '—', unidad: un, min: min, ingreso: CM.hoy() });
    CM.addMov(id, 'ingreso', cant, '', 'Ingreso inicial del lote');
    CM.audit('Nuevo lote', id + ' · ' + nombre + ' · ' + cantTxt(cant, un)); CM.save(); CM.modal.close(true); render(); CM.toast('Lote ' + id + ' creado.');
  };
  CM.acts['stock-ajuste'] = function () {
    CM.modal.open({
      title: 'Ajustar stock de un lote',
      body: '<form id="fSA" data-form="ajuste" class="f" autocomplete="off" novalidate><p style="margin:0">Los ajustes no editan el stock: suman o restan un movimiento auditado.</p>' +
        fl('Lote *', '<select class="in" name="lote"><option value="">Elegí un lote…</option>' + CM.db.lotes.map(function (l) { return opt(l.id, l.nombre + ' · ' + l.id + ' · ' + cantTxt(CM.stockLote(l.id), l.unidad)); }).join('') + '</select>') +
        '<div class="f f2">' + fl('Tipo de ajuste', '<select class="in" name="tipo">' + opt('mas', 'Ingreso (suma)') + opt('menos', 'Egreso por pérdida, merma o corrección (resta)') + '</select>') + fl('Cantidad *', '<input class="in num" name="cant" inputmode="decimal" placeholder="0">') + '</div>' +
        fl('Motivo *', '<input class="in" name="motivo">') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fSA">Registrar ajuste</button>'
    });
  };
  CM.forms.ajuste = function (f) {
    var e = f.elements, l = CM.lote(e.lote.value), cant = CM.parseCant(e.cant.value), motivo = e.motivo.value.trim();
    if (!l) return fail(f, 'lote', 'Elegí un lote.');
    if (isNaN(cant) || cant <= 0) return fail(f, 'cant', 'Cantidad inválida.');
    if (motivo.length < 4) return fail(f, 'motivo', 'Escribí el motivo.');
    var signo = e.tipo.value === 'mas' ? 1 : -1;
    if (signo < 0 && cant > CM.stockLote(l.id)) return fail(f, 'cant', 'No puede quedar stock negativo: hay ' + cantTxt(CM.stockLote(l.id), l.unidad) + '.');
    CM.addMov(l.id, signo > 0 ? 'ingreso' : 'ajuste', signo * cant, '', motivo);
    CM.audit('Ajuste de stock', l.id + ' · ' + (signo > 0 ? '+' : '-') + cant + ' · ' + motivo); CM.save(); CM.modal.close(true); render(); CM.toast('Ajuste registrado.');
  };

  /* ---------- utilidades para los módulos de gestión ---------- */
  CM.U = { $: $, $$: $$, fl: fl, flr: flr, opt: opt, fail: fail, tablaVacia: tablaVacia, repPill: repPill, repDetalle: repDetalle, nombreCorto: nombreCorto, nombreDe: nombreDe, cantTxt: cantTxt, uTxt: uTxt, iniciales: iniciales, telWa: telWa, hideSugg: hideSugg };

  /* ---------- arranque (lo dispara js/boot.js cuando cargaron todos los módulos) ---------- */
  CM.boot = function () {
    CM.init();
    if (!g.location.hash) g.location.hash = '#/inicio';
    render();
  };
})(window);
