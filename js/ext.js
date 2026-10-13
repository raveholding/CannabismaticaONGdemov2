/* Cannabismatica I+D · Sistema ONG (demo v2) · extensión del núcleo: hash, roles, caja, fidelización, personal, datos de ejemplo de los módulos nuevos */
(function (g) {
  'use strict';
  var CM = g.CM;

  /* ---------- SHA-256 síncrono (sellos de cierre y cadena de auditoría) ---------- */
  var K = [], H0 = [];
  (function () {
    var n = 2, c = 0;
    function primo(x) { for (var i = 2; i * i <= x; i++) if (x % i === 0) return false; return true; }
    while (c < 64) {
      if (primo(n)) {
        if (c < 8) H0[c] = (Math.pow(n, 0.5) * 4294967296) | 0;
        K[c++] = (Math.pow(n, 1 / 3) * 4294967296) | 0;
      }
      n++;
    }
  })();
  function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
  CM.sha256 = function (txt) {
    var b = new TextEncoder().encode(String(txt)), len = b.length, nw = (((len + 8) >> 6) + 1) * 16, w = new Array(nw), i, j;
    for (i = 0; i < nw; i++) w[i] = 0;
    for (i = 0; i < len; i++) w[i >> 2] |= b[i] << (24 - (i % 4) * 8);
    w[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
    w[nw - 1] = len * 8;
    var h = H0.slice();
    for (j = 0; j < nw; j += 16) {
      var W = w.slice(j, j + 16), a = h[0], bb = h[1], c = h[2], d = h[3], e = h[4], f = h[5], gg = h[6], hh = h[7];
      for (i = 0; i < 64; i++) {
        if (i >= 16) {
          var w15 = W[i - 15], w2 = W[i - 2];
          W[i] = (W[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + W[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0;
        }
        var t1 = (hh + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & f) ^ (~e & gg)) + K[i] + W[i]) | 0;
        var t2 = ((rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
        hh = gg; gg = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + bb) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
      h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + gg) | 0; h[7] = (h[7] + hh) | 0;
    }
    return h.map(function (x) { return (x >>> 0).toString(16).padStart(8, '0'); }).join('');
  };

  /* ---------- CSV de entrada (separador detectado, comillas, BOM) ---------- */
  CM.parseCSV = function (txt) {
    txt = String(txt || '').replace(/^﻿/, '');
    var first = txt.split(/\r?\n/)[0] || '';
    var cands = [';', ',', '\t'], sep = ';', best = -1;
    cands.forEach(function (c) { var n = first.split(c).length; if (n > best) { best = n; sep = c; } });
    var rows = [], row = [], cell = '', q = false, i, ch;
    for (i = 0; i < txt.length; i++) {
      ch = txt.charAt(i);
      if (q) {
        if (ch === '"') { if (txt.charAt(i + 1) === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && txt.charAt(i + 1) === '\n') i++;
        row.push(cell); cell = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); if (row.length > 1 || row[0] !== '') rows.push(row); }
    return { sep: sep, rows: rows };
  };

  /* ---------- roles y permisos ---------- */
  CM.ROLES = { admin: 'Administrador/a', supervisor: 'Supervisor/a', mostrador: 'Mostrador', operador: 'Operador/a voluntario/a' };
  CM.LVL = ['', 'ver', 'oper', 'edit', 'admin'];
  CM.LVL_L = { '': 'Sin acceso', ver: 'Sólo ver', oper: 'Operar (cargar)', edit: 'Editar', admin: 'Administrar (anular / cerrar)' };
  CM.MODS = [
    ['pacientes', 'Pacientes'], ['dispensaciones', 'Dispensaciones'], ['aportes', 'Aportes y Factura C'], ['reprocann', 'REPROCANN'], ['trazabilidad', 'Trazabilidad'],
    ['dashboard', 'Dashboard'], ['caja', 'Caja'], ['cierre', 'Arqueo y cierre'], ['cerradas', 'Cajas cerradas'], ['inventario', 'Inventario'], ['fidelizacion', 'Fidelización'],
    ['personal', 'Personal y fichaje'], ['tareas', 'Tareas y organigrama'], ['menu', 'Menú público'], ['nube', 'Nube'], ['perifericos', 'Periféricos y ticket'],
    ['importexport', 'Importar / Exportar'], ['integraciones', 'Integraciones'], ['usuarios', 'Usuarios y permisos'], ['auditoria', 'Auditoría'], ['ajustes', 'Configuración']
  ];
  CM.permsDefault = function () {
    var all = {}, sup = {}, mos = {}, ope = {};
    CM.MODS.forEach(function (m) { all[m[0]] = 'admin'; });
    CM.MODS.forEach(function (m) { sup[m[0]] = 'edit'; });
    sup.cierre = 'admin'; sup.cerradas = 'edit'; sup.caja = 'admin'; sup.nube = 'ver'; sup.usuarios = 'ver'; sup.ajustes = 'ver'; sup.importexport = 'oper'; sup.menu = 'edit'; sup.integraciones = 'ver'; sup.auditoria = 'ver';
    mos.pacientes = 'oper'; mos.dispensaciones = 'oper'; mos.aportes = 'oper'; mos.reprocann = 'ver'; mos.trazabilidad = 'ver'; mos.caja = 'oper'; mos.inventario = 'ver'; mos.fidelizacion = 'oper'; mos.personal = 'oper'; mos.tareas = 'oper'; mos.dashboard = 'ver'; mos.perifericos = 'oper';
    ope.pacientes = 'oper'; ope.inventario = 'ver'; ope.tareas = 'oper'; ope.fidelizacion = 'ver'; ope.reprocann = 'ver'; ope.personal = 'oper';
    return { admin: all, supervisor: sup, mostrador: mos, operador: ope };
  };
  CM.can = function (mod, lvl) {
    var db = CM.db; if (!db || !db.perms) return true;
    var r = db.cfg.rol || 'admin', p = (db.perms[r] || {})[mod] || '';
    if (r === 'admin') return true;
    return CM.LVL.indexOf(p) >= CM.LVL.indexOf(lvl || 'ver');
  };

  /* ---------- auditoría con cadena de hashes ---------- */
  function hAud(e) { return CM.sha256([e.prev, e.id, e.ts, e.user, e.rol || '', e.accion, e.detalle].join('|')); }
  CM.audit = function (accion, detalle) {
    var a = CM.db.audit, prev = a.length ? (a[0].h || '') : 'GENESIS';
    var e = { id: CM.nextId('AU'), ts: new Date().toISOString(), user: CM.db.cfg.operador || 'Operador demo', rol: CM.db.cfg.rol || 'admin', accion: accion, detalle: detalle || '', prev: prev };
    e.h = hAud(e);
    a.unshift(e);
    if (a.length > 1000) a.length = 1000;
  };
  CM.rehashAudit = function () {
    var a = CM.db.audit, prev = 'GENESIS', i;
    for (i = a.length - 1; i >= 0; i--) { a[i].prev = prev; a[i].rol = a[i].rol || 'admin'; a[i].h = hAud(a[i]); prev = a[i].h; }
  };
  CM.verificarAuditoria = function () {
    var a = CM.db.audit, prevH = null, i, malos = [], n = 0;
    for (i = a.length - 1; i >= 0; i--) {
      var e = a[i];
      if (!e.h) continue;
      n++;
      if (prevH !== null && e.prev !== prevH) malos.push(e.id + ' (cadena)');
      else if (hAud(e) !== e.h) malos.push(e.id + ' (contenido)');
      prevH = e.h;
    }
    return { ok: !malos.length, n: n, malos: malos };
  };


  /* ---------- ingreso del equipo (demo): clave con sal + SHA-256, sesión en la pestaña, bloqueo por intentos ---------- */
  CM.CLAVE_DEMO = 'Demo2026!';
  CM.hashPw = function (salt, pw) { return CM.sha256('cm-pw|' + salt + '|' + pw); };
  CM.setPw = function (u, pw, cambiar) { u.salt = CM.sha256('s|' + u.id + '|' + Math.random() + Date.now()).slice(0, 16); u.pw = CM.hashPw(u.salt, pw); u.cambiar = !!cambiar; };
  CM.claveValida = function (pw) { return typeof pw === 'string' && pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw); };
  var memSes = null;
  CM.ses = {
    get: function () { try { return window.sessionStorage.getItem('cmv2_ses') || memSes; } catch (e) { return memSes; } },
    set: function (v) { memSes = v; try { window.sessionStorage.setItem('cmv2_ses', v); } catch (e) { /* memoria */ } },
    clear: function () { memSes = null; try { window.sessionStorage.removeItem('cmv2_ses'); } catch (e) { /* nada */ } }
  };
  CM.usuarioActual = function () {
    var id = CM.ses.get(); if (!id || !CM.db || !CM.db.users) return null;
    var u = CM.db.users.filter(function (x) { return x.id === id && x.activo; })[0];
    return u || null;
  };
  CM.sesionOk = function () {
    var u = CM.usuarioActual(); if (!u) return false;
    if (u.rol !== 'admin') { CM.db.cfg.rol = u.rol; }
    CM.db.cfg.operador = u.nombre; return true;
  };
  CM.login = function (correo, clave) {
    var db = CM.db, c = String(correo || '').trim().toLowerCase(), ahora = Date.now();
    db.lock = db.lock || {};
    var L = db.lock[c] || { n: 0, hasta: 0 };
    if (L.hasta > ahora) return { err: 'Demasiados intentos. Esperá ' + Math.ceil((L.hasta - ahora) / 1000) + ' segundos e intentá de nuevo.' };
    var u = db.users.filter(function (x) { return String(x.correo).toLowerCase() === c; })[0];
    if (!u || !u.activo || !u.pw || CM.hashPw(u.salt, String(clave || '')) !== u.pw) {
      L.n++; if (L.n >= 5) { L.hasta = ahora + 120000; L.n = 0; }
      db.lock[c] = L; CM.audit('Ingreso fallido', 'Intento con el correo ' + (c.slice(0, 3) + '***')); CM.save();
      return { err: 'Usuario o clave incorrectos.' };
    }
    delete db.lock[c];
    CM.ses.set(u.id); db.cfg.rol = u.rol; db.cfg.operador = u.nombre;
    CM.audit('Ingreso al sistema', u.nombre + ' · rol ' + u.rol); CM.save();
    return { ok: u };
  };
  CM.logout = function () {
    var u = CM.usuarioActual(); if (u) { CM.audit('Salida del sistema', u.nombre); CM.save(); }
    CM.ses.clear();
  };

  /* ---------- caja ---------- */
  CM.cajaAbierta = function () { var c = CM.db.cajas.filter(function (x) { return x.estado === 'abierta'; }); return c.length ? c[c.length - 1] : null; };
  CM.rubro = function (id) { for (var i = 0; i < CM.db.rubros.length; i++) if (CM.db.rubros[i].id === id) return CM.db.rubros[i]; return null; };
  CM.rubrosPara = function (tipo) {
    var t = tipo === 'ingreso' ? 'ingreso' : 'egreso';
    return CM.db.rubros.filter(function (r) { return r.activo !== false && (r.tipo === t || r.tipo === 'ambos'); });
  };
  function aportesDeCaja(caja) {
    var cerrados = {};
    CM.db.cajas.forEach(function (c) { if (c.estado === 'cerrada' && c.cierre) c.cierre.movs.forEach(function (m) { if (m.ref) cerrados[m.ref] = 1; }); });
    return CM.db.aportes.filter(function (a) { return a.estado === 'registrado' && a.fecha >= caja.fecha && !cerrados[a.id]; }).map(function (a) {
      return { id: 'AP-' + a.id, ts: a.ts, tipo: 'ingreso', cent: a.cent, medio: a.medio, rubroId: 'R-01', rubroN: 'Aportes voluntarios', motivo: a.concepto + ' · DNI ' + a.dni, user: a.user, ref: a.id, derivado: true, fc: !!a.comp };
    });
  }
  CM.cajaMovs = function (caja) {
    if (caja.estado === 'cerrada' && caja.cierre) return caja.cierre.movs;
    var man = CM.db.cmovs.filter(function (m) { return m.caja === caja.id; });
    return man.concat(aportesDeCaja(caja)).sort(function (a, b) { return a.ts.localeCompare(b.ts); });
  };
  CM.totCaja = function (caja, movs) {
    movs = movs || CM.cajaMovs(caja);
    var t = { inicial: caja.inicial, porMedio: {}, ingresos: 0, egresos: 0, ingEf: 0, egEf: 0, esperadoEf: 0, conFC: 0, sinFC: 0 };
    movs.forEach(function (m) {
      if (m.tipo === 'ingreso') {
        t.ingresos += m.cent; t.porMedio[m.medio] = (t.porMedio[m.medio] || 0) + m.cent;
        if (m.medio === 'efectivo') t.ingEf += m.cent;
        if (m.derivado || m.ref) { if (m.fc) t.conFC += m.cent; else t.sinFC += m.cent; }
      } else { t.egresos += m.cent; if (m.medio === 'efectivo') t.egEf += m.cent; }
    });
    t.esperadoEf = t.inicial + t.ingEf - t.egEf;
    return t;
  };
  CM.addCMov = function (o) {
    var caja = CM.cajaAbierta();
    if (!caja) return { err: 'No hay una caja abierta. Abrila primero.' };
    if (!(o.cent > 0)) return { err: 'El importe tiene que ser mayor que cero.' };
    var r = CM.rubro(o.rubroId);
    if (!r || r.activo === false) return { err: 'Elegí un rubro financiero válido: es obligatorio.' };
    var t = o.tipo === 'ingreso' ? 'ingreso' : 'egreso';
    if (r.tipo !== t && r.tipo !== 'ambos') return { err: 'Ese rubro no corresponde a un ' + t + '.' };
    if (o.tipo !== 'ingreso' && String(o.motivo || '').trim().length < 4) return { err: 'Escribí el motivo (obligatorio para egresos, retiros y reintegros).' };
    var m = { id: CM.nextId('CM'), caja: caja.id, ts: o.ts || new Date().toISOString(), tipo: o.tipo, cent: o.cent, medio: 'efectivo', rubroId: r.id, rubroN: r.n, motivo: String(o.motivo || '').trim(), user: CM.db.cfg.operador, ref: '' };
    CM.db.cmovs.push(m);
    return { ok: m };
  };
  var CAMPOS_SELLO = ['fecha', 'ts', 'user', 'inicial', 'movs', 'porMedio', 'ingresos', 'egresos', 'esperadoEf', 'declaradoEf', 'dif', 'obs', 'conFC', 'sinFC', 'caja', 'nro'];
  CM.hashCierre = function (c) {
    var o = {}; CAMPOS_SELLO.forEach(function (k) { o[k] = c[k]; });
    return CM.sha256(JSON.stringify(o));
  };
  CM.cerrarCaja = function (caja, declaradoEf, obs, ts) {
    var movs = CM.cajaMovs(caja).map(function (m) { return { id: m.id, ts: m.ts, tipo: m.tipo, cent: m.cent, medio: m.medio, rubroId: m.rubroId, rubroN: m.rubroN, motivo: m.motivo, user: m.user, ref: m.ref || '', derivado: !!m.derivado, fc: !!m.fc }; });
    var t = CM.totCaja(caja, movs);
    var c = { fecha: ts ? ts.slice(0, 10) : CM.hoy(), ts: ts || new Date().toISOString(), user: CM.db.cfg.operador, inicial: caja.inicial, movs: movs, porMedio: t.porMedio, ingresos: t.ingresos, egresos: t.egresos, esperadoEf: t.esperadoEf, declaradoEf: declaradoEf, dif: declaradoEf - t.esperadoEf, obs: obs || '', conFC: t.conFC, sinFC: t.sinFC, caja: caja.id, nro: caja.nro };
    c.hash = CM.hashCierre(c); c.notas = [];
    caja.cierre = c; caja.estado = 'cerrada';
    return c;
  };
  CM.verificarCierre = function (c) { return CM.hashCierre(c) === c.hash; };
  CM.diasSinCaja = function () {
    var cubiertos = {}, ab = CM.cajaAbierta(), res = [];
    CM.db.cajas.forEach(function (c) { cubiertos[c.fecha] = 1; if (c.cierre) cubiertos[c.cierre.fecha] = 1; });
    var enCierres = {};
    CM.db.cajas.forEach(function (c) { if (c.cierre) c.cierre.movs.forEach(function (m) { if (m.ref) enCierres[m.ref] = 1; }); });
    var dias = {};
    CM.db.aportes.forEach(function (a) {
      if (a.estado !== 'registrado' || enCierres[a.id]) return;
      if (ab && a.fecha >= ab.fecha) return;
      dias[a.fecha] = (dias[a.fecha] || 0) + a.cent;
    });
    Object.keys(dias).sort().forEach(function (f) { res.push({ fecha: f, cent: dias[f] }); });
    return res;
  };

  /* ---------- fidelización ---------- */
  CM.saldoSellos = function (dni) { var s = 0; CM.db.sellos.forEach(function (x) { if (x.dni === dni) s += x.cant; }); return s; };
  CM.otorgarSello = function (dni, motivo) {
    if (!CM.paciente(dni)) return { err: 'Ese DNI no existe.' };
    var h = CM.hoy();
    if (CM.db.sellos.some(function (x) { return x.dni === dni && x.fecha === h && x.tipo === 'sello'; })) return { err: 'Ese paciente ya recibió un sello hoy (límite: 1 por día, validado en el mostrador).' };
    var s = { id: CM.nextId('SE'), dni: dni, fecha: h, ts: new Date().toISOString(), tipo: 'sello', cant: 1, motivo: motivo || 'Participación', user: CM.db.cfg.operador };
    CM.db.sellos.push(s); return { ok: s };
  };
  CM.canjearSellos = function (dni, beneficio) {
    var meta = CM.db.cfg.sellosMeta || 8;
    if (CM.saldoSellos(dni) < meta) return { err: 'Faltan sellos: se necesitan ' + meta + '.' };
    var s = { id: CM.nextId('SE'), dni: dni, fecha: CM.hoy(), ts: new Date().toISOString(), tipo: 'canje', cant: -meta, motivo: beneficio || 'Beneficio por sellos', user: CM.db.cfg.operador };
    CM.db.sellos.push(s); return { ok: s };
  };
  CM.cupon = function (cod) { cod = String(cod || '').trim().toUpperCase(); for (var i = 0; i < CM.db.cupones.length; i++) if (CM.db.cupones[i].cod === cod) return CM.db.cupones[i]; return null; };
  CM.usosCupon = function (cod, dni) { return CM.db.cuponUsos.filter(function (u) { return u.cod === cod && (!dni || u.dni === dni); }).length; };
  CM.validarCupon = function (cod, dni) {
    var c = CM.cupon(cod), h = CM.hoy();
    if (!c) return { err: 'El cupón no existe.' };
    if (c.estado !== 'activo') return { err: 'El cupón está ' + (c.estado === 'pausado' ? 'pausado' : 'inactivo') + '.' };
    if (h < c.desde) return { err: 'El cupón todavía no está vigente (desde ' + CM.fmtFecha(c.desde) + ').' };
    if (h > c.hasta) return { err: 'El cupón venció el ' + CM.fmtFecha(c.hasta) + '.' };
    if (c.max && CM.usosCupon(c.cod) >= c.max) return { err: 'El cupón alcanzó su límite de usos (' + c.max + ').' };
    if (dni) {
      if (!CM.paciente(dni)) return { err: 'Ese DNI no existe.' };
      if (c.porPac && CM.usosCupon(c.cod, dni) >= c.porPac) return { err: 'Ese paciente ya usó este cupón el máximo de veces (' + c.porPac + ').' };
    }
    return { ok: c };
  };
  CM.canjearCupon = function (cod, dni, ref) {
    var v = CM.validarCupon(cod, dni); if (v.err) return v;
    var key = v.ok.cod + '|' + dni + '|' + (ref || '');
    if (ref && CM.db.cuponUsos.some(function (u) { return u.key === key; })) return { err: 'Ese canje ya estaba registrado (operación repetida: no se duplica).' };
    var u = { id: CM.nextId('CU'), key: key, cod: v.ok.cod, dni: dni, fecha: CM.hoy(), ts: new Date().toISOString(), ref: ref || '', user: CM.db.cfg.operador };
    CM.db.cuponUsos.push(u); return { ok: u };
  };
  CM.plan = function (id) { for (var i = 0; i < CM.db.planes.length; i++) if (CM.db.planes[i].id === id) return CM.db.planes[i]; return null; };
  CM.estadoMemb = function (m) {
    if (m.estado === 'cancelada') return 'cancelada';
    if (m.estado === 'pausada') return 'pausada';
    if (!m.pagadoHasta) return 'pendiente';
    return m.pagadoHasta >= CM.hoy() ? 'activa' : 'vencida';
  };

  /* ---------- personal y fichaje ---------- */
  CM.firmaEmp = function (id) { return CM.sha256('cm-demo-firma|' + id).slice(0, 8); };
  CM.tokenEmp = function (e) { return 'EMP-' + e.id + '-' + CM.firmaEmp(e.id); };
  CM.fichar = function (entrada, fuente) {
    var s = String(entrada || '').trim(), emp = null;
    if (!s) return { err: 'Pasá la tarjeta, escaneá el QR o escribí el DNI del empleado.' };
    var m = /^EMP-([A-Z0-9]+)-([0-9a-f]{8})$/i.exec(s);
    if (m) {
      if (CM.firmaEmp(m[1].toUpperCase()) !== m[2].toLowerCase()) return { err: 'Firma inválida: la tarjeta o el QR no es auténtico. No se registró nada.' };
      emp = CM.db.staff.filter(function (x) { return x.id === m[1].toUpperCase(); })[0];
    } else {
      var d = CM.soloDigitos(s);
      emp = CM.db.staff.filter(function (x) { return x.dni === d; })[0];
    }
    if (!emp) return { err: 'No encontré a esa persona.' };
    if (!emp.activo) return { err: emp.nombre + ' está dado de baja.' };
    var ult = CM.db.fichas.filter(function (f) { return f.emp === emp.id; }).sort(function (a, b) { return a.ts.localeCompare(b.ts); }).pop();
    var ahora = Date.now();
    if (ult && ahora - Date.parse(ult.ts) < 60000) return { err: 'Fichada repetida: pasaron menos de 60 segundos desde la última de ' + emp.nombre + '.' };
    var tipo = ult && ult.tipo === 'entrada' && ult.fecha === CM.hoy() ? 'salida' : 'entrada';
    var f = { id: CM.nextId('FI'), emp: emp.id, ts: new Date(ahora).toISOString(), fecha: CM.hoy(), tipo: tipo, metodo: fuente || 'manual', dispositivo: 'Terminal de la demo' };
    CM.db.fichas.push(f);
    return { ok: f, emp: emp };
  };
  CM.minutosDia = function (empId, fecha) {
    var arr = CM.db.fichas.filter(function (f) { return f.emp === empId && f.fecha === fecha; }).sort(function (a, b) { return a.ts.localeCompare(b.ts); });
    var min = 0, ent = null;
    arr.forEach(function (f) { if (f.tipo === 'entrada') ent = Date.parse(f.ts); else if (ent !== null) { min += Math.round((Date.parse(f.ts) - ent) / 60000); ent = null; } });
    return min;
  };
  CM.fmtHM = function (min) { return Math.floor(min / 60) + ' h ' + String(min % 60).padStart(2, '0') + ' min'; };

  /* ---------- menú público: configuración por defecto ---------- */

  /* contenidos ampliados del menú público: se completan en datos guardados antes de esta versión */
  var ITX = {
    P1: { dur: ['Proceso de 2 a 4 semanas (estimado)', 'Process of about 2 to 4 weeks (estimate)'], inc: ['Revisión de tu documentación|Review of your paperwork', 'Ayuda con la solicitud en el registro oficial|Help with the application in the official registry', 'Acompañamiento hasta tener novedades|Support until you get a response'] },
    P2: { dur: ['Una reunión de 30 minutos', 'One 30-minute meeting'], inc: ['Control de la fecha de vencimiento|Check of your expiry date', 'Documentación actualizada|Updated paperwork', 'Aviso previo al próximo vencimiento|Reminder before the next expiry'] },
    P3: { dur: ['Consulta de 40 minutos', '40-minute consultation'], inc: ['Evaluación del cuadro clínico|Assessment of your clinical situation', 'Orientación sobre el acompañamiento|Guidance on follow-up', 'Informe para tu historia clínica|Report for your medical record'] },
    P4: { dur: ['2 horas', '2 hours'], inc: ['Material de estudio|Study material', 'Marco legal vigente [VERIFICAR]|Current legal framework [VERIFY]', 'Espacio para preguntas|Q&A time'] },
    P5: { dur: ['90 minutos', '90 minutes'], inc: ['Información práctica|Practical information', 'Material impreso|Printed material', 'Charla abierta a familias|Open session for families'] },
    P6: { dur: ['4 encuentros semanales', '4 weekly sessions'], inc: ['Cuadernillo del curso|Course booklet', 'Certificado de asistencia|Attendance certificate', 'Acceso al grupo de consultas|Access to the Q&A group'] },
    P7: { dur: ['4 encuentros semanales', '4 weekly sessions'], inc: ['Formación para acompañantes|Training for companions', 'Material de apoyo|Support material', 'Certificado de asistencia|Attendance certificate'] },
    P8: { dur: ['Seguimiento mensual', 'Monthly follow-up'], inc: ['Formulario de seguimiento médico|Medical follow-up form', 'Revisión de la evolución|Review of progress'] },
    P9: { dur: ['Consulta de 30 minutos', '30-minute consultation'], inc: ['Orientación sobre la Ley 27.350 [VERIFICAR]|Guidance on Law 27.350 [VERIFY]', 'Dudas sobre el registro y la documentación|Questions about the registry and paperwork'] }
  };
  function lineas(a, i) { return a.map(function (x) { return x.split('|')[i] || ''; }).join('\n'); }
  CM.menuExtra = function () {
    var h = CM.hoy();
    return {
      portada: {
        es: { kicker: 'Fundación · Salta', titulo: 'Acompañamiento para pacientes de cannabis medicinal', sub: 'Te ayudamos con tu REPROCANN y ofrecemos talleres, cursos y servicios informativos, con trato cercano y responsable.', cta1: 'Quiero mi REPROCANN', cta2: 'Escribinos por WhatsApp' },
        en: { kicker: 'Foundation · Salta, Argentina', titulo: 'Support for medical cannabis patients', sub: 'We help you with your REPROCANN registration and offer workshops, courses and information services, with close and responsible care.', cta1: 'I want my REPROCANN', cta2: 'Message us on WhatsApp' }
      },
      pasos: [
        { es: { t: 'Primer contacto', d: 'Escribinos o visitanos y te contamos cómo seguir.' }, en: { t: 'First contact', d: 'Write or visit us and we explain the next steps.' } },
        { es: { t: 'Consulta de evaluación', d: 'Una consulta con el equipo médico de la fundación.' }, en: { t: 'Initial consultation', d: 'A consultation with the foundation medical team.' } },
        { es: { t: 'Documentación y solicitud', d: 'Reunimos tus papeles y te acompañamos en el registro oficial. Los requisitos los define el organismo [VERIFICAR].' }, en: { t: 'Paperwork and application', d: 'We gather your documents and support you in the official registry. Requirements are set by the authority [VERIFY].' } },
        { es: { t: 'Seguimiento', d: 'Controles periódicos y respuestas a tus dudas.' }, en: { t: 'Follow-up', d: 'Regular check-ins and answers to your questions.' } }
      ],
      agenda: [
        { id: 'AG1', item: 'P4', fecha: CM.addDays(h, 7), hora: '18:00', lugar: 'Sede de la fundación', modalidad: 'presencial', cupo: 20, activo: true },
        { id: 'AG2', item: 'P5', fecha: CM.addDays(h, 14), hora: '17:30', lugar: 'Virtual (enlace por WhatsApp)', modalidad: 'virtual', cupo: 40, activo: true },
        { id: 'AG3', item: 'P6', fecha: CM.addDays(h, 21), hora: '19:00', lugar: 'Sede de la fundación', modalidad: 'presencial', cupo: 15, activo: true },
        { id: 'AG4', item: 'P7', fecha: CM.addDays(h, 35), hora: '19:00', lugar: 'Sede de la fundación', modalidad: 'presencial', cupo: 15, activo: true }
      ],
      faq: [
        { es: { q: '¿Qué es el REPROCANN?', a: 'Es el registro nacional creado a partir de la Ley 27.350 para personas que usan cannabis con fines medicinales. Los requisitos y trámites los define el organismo oficial [VERIFICAR en argentina.gob.ar].' }, en: { q: 'What is REPROCANN?', a: 'It is the national registry created under Law 27,350 for people who use cannabis for medical purposes. Requirements and procedures are set by the official authority [VERIFY].' } },
        { es: { q: '¿Los aportes son obligatorios?', a: 'No. Los aportes son voluntarios y se destinan al sostenimiento de la fundación. Podés consultar sin aportar.' }, en: { q: 'Are contributions mandatory?', a: 'No. Contributions are voluntary and support the foundation. You can ask questions without contributing.' } },
        { es: { q: '¿Cómo me inscribo a un taller o curso?', a: 'Agregalo a «Mi consulta» y envianos el mensaje por WhatsApp. Es una solicitud: te confirmamos el lugar por el mismo medio.' }, en: { q: 'How do I sign up for a workshop or course?', a: 'Add it to “My inquiry” and send us the message on WhatsApp. It is a request: we confirm your place the same way.' } },
        { es: { q: '¿Atienden a menores de edad?', a: 'Los servicios son para mayores de 18 años o con autorización de su tutor/a. Consultanos el caso [VERIFICAR texto legal].' }, en: { q: 'Do you see minors?', a: 'Services are for people over 18 or with guardian authorization. Ask us about your case [VERIFY legal text].' } },
        { es: { q: '¿Esta información reemplaza una consulta médica?', a: 'No. Todo el contenido es informativo y no reemplaza la consulta con un profesional de la salud.' }, en: { q: 'Does this information replace medical advice?', a: 'No. All content is informational and does not replace a consultation with a health professional.' } }
      ]
    };
  };
  CM.menuFill = function (c) {
    if (!c) return c;
    var x = CM.menuExtra();
    ['portada', 'pasos', 'agenda', 'faq'].forEach(function (k) { if (!c[k]) c[k] = x[k]; });
    c.bloques = c.bloques || {};
    ['agenda', 'pasos', 'faq'].forEach(function (k) { if (c.bloques[k] === undefined) c.bloques[k] = true; });
    c.orden = c.orden || ['catalogo'];
    ['agenda', 'pasos', 'faq'].forEach(function (k) { if (c.orden.indexOf(k) < 0) c.orden.splice(c.orden.indexOf('catalogo') + 1 + ['agenda', 'pasos', 'faq'].indexOf(k), 0, k); });
    (c.items || []).forEach(function (i) {
      var d = ITX[i.id];
      if (!i.dur) i.dur = d ? { es: d.dur[0], en: d.dur[1] } : { es: '', en: '' };
      if (!i.inc) i.inc = d ? { es: lineas(d.inc, 0), en: lineas(d.inc, 1) } : { es: '', en: '' };
    });
    return c;
  };
  CM.menuDefault = function () {
    return {
      nombre: 'Cannabismatica I+D',
      eslogan: { es: 'Acompañamiento, información y cuidado para pacientes', en: 'Support, information and care for patients' },
      direccion: 'Islas Malvinas 137', localidad: 'Salta Capital', wa: '5493876390362', email: 'cannabismatica@gmail.com',
      horarios: { 1: ['09:00', '18:00'], 2: ['09:00', '18:00'], 3: ['09:00', '18:00'], 4: ['09:00', '18:00'], 5: ['09:00', '18:00'], 6: ['09:00', '13:00'], 0: null },
      mostrarHorario: true,
      frases: [
        { id: 'F1', tipo: 'institucional', activa: true, es: 'Información responsable, acompañamiento cercano.', en: 'Responsible information, close support.' },
        { id: 'F2', tipo: 'informativa', activa: true, es: 'Este contenido es informativo y no reemplaza la consulta médica.', en: 'This content is informational and does not replace a medical consultation.' },
        { id: 'F3', tipo: 'legal', activa: true, obligatoria: true, es: 'Asociación sin fines de lucro. Los aportes son voluntarios y se destinan al sostenimiento de la fundación. [VERIFICAR texto legal con asesor/a]', en: 'Non-profit association. Contributions are voluntary and support the foundation. [VERIFY legal text]' },
        { id: 'F4', tipo: 'legal', activa: true, obligatoria: true, es: 'Servicios para mayores de 18 años o con autorización de su tutor/a. [VERIFICAR texto legal con asesor/a]', en: 'Services for people over 18 or with guardian authorization. [VERIFY legal text]' }
      ],
      rotar: true, intervalo: 6,
      cats: [
        { id: 'reprocann', es: 'Quiero mi REPROCANN', en: 'I want my REPROCANN' },
        { id: 'talleres', es: 'Talleres', en: 'Workshops' },
        { id: 'cursos', es: 'Cursos', en: 'Courses' },
        { id: 'servicios', es: 'Servicios', en: 'Services' }
      ],
      items: [
        { id: 'P1', cat: 'reprocann', activo: true, cent: 1500000, es: { n: 'Quiero mi REPROCANN: inscripción asistida', d: 'Te acompañamos paso a paso con la documentación y la solicitud en el registro oficial.' }, en: { n: 'I want my REPROCANN: assisted enrollment', d: 'We guide you step by step with the paperwork and the official registry application.' } },
        { id: 'P2', cat: 'reprocann', activo: true, cent: 1000000, es: { n: 'Renovación de REPROCANN', d: 'Revisamos tu vencimiento y te ayudamos a renovar a tiempo.' }, en: { n: 'REPROCANN renewal', d: 'We check your expiry date and help you renew on time.' } },
        { id: 'P3', cat: 'reprocann', activo: true, cent: 1200000, es: { n: 'Consulta médica de evaluación', d: 'Primera consulta con el equipo médico de la fundación.' }, en: { n: 'Initial medical evaluation', d: 'First consultation with the foundation medical team.' } },
        { id: 'P4', cat: 'talleres', activo: true, cent: 600000, es: { n: 'Taller de cultivo responsable', d: 'Buenas prácticas de autocultivo dentro del marco legal vigente.' }, en: { n: 'Responsible growing workshop', d: 'Good home-growing practices within the current legal framework.' } },
        { id: 'P5', cat: 'talleres', activo: true, cent: 500000, es: { n: 'Taller: uso seguro, dosis y vías de administración', d: 'Información práctica para pacientes y familias.' }, en: { n: 'Workshop: safe use, dosing and routes', d: 'Practical information for patients and families.' } },
        { id: 'P6', cat: 'cursos', activo: true, cent: 2000000, es: { n: 'Curso: introducción al cannabis medicinal', d: 'Cuatro encuentros con material de estudio.' }, en: { n: 'Course: introduction to medical cannabis', d: 'Four sessions with study material.' } },
        { id: 'P7', cat: 'cursos', activo: true, cent: 2500000, es: { n: 'Curso para acompañantes y cuidadores', d: 'Formación para quienes acompañan a pacientes.' }, en: { n: 'Course for companions and caregivers', d: 'Training for people who support patients.' } },
        { id: 'P8', cat: 'servicios', activo: true, cent: 0, es: { n: 'Seguimiento médico mensual', d: 'Para pacientes con carnet que ya recibieron una dispensación.' }, en: { n: 'Monthly medical follow-up', d: 'For patients with a card who already received a dispensation.' } },
        { id: 'P9', cat: 'servicios', activo: true, cent: 800000, es: { n: 'Orientación legal', d: 'Consultas sobre la Ley 27.350 y el registro.' }, en: { n: 'Legal guidance', d: 'Questions about Law 27.350 and the registry.' } }
      ],
      bloques: { club: true, wifi: true, ubic: true, redes: true, compartir: true, volver: true },
      orden: ['catalogo', 'club', 'wifi', 'ubic', 'redes'],
      wifi: { ssid: 'Cannabismatica-Invitados', clave: 'demo-invitados-2026', modo: 'manual', vigencia: 'horario' },
      ubic: { consulta: 'Islas Malvinas 137, Salta Capital', resena: '' },
      redes: [
        { id: 'RS1', label: 'Instagram', url: 'https://www.instagram.com/cannabismatica', activa: true },
        { id: 'RS2', label: 'WhatsApp', url: 'wa', activa: true },
        { id: 'RS3', label: 'Facebook', url: '', activa: false }
      ],
      oculto: { activo: true, toques: 5, boton: true },
      club: { activo: true, version: 'v1.0' },
      lang: 'es'
    };
  };
  var menuDef0 = CM.menuDefault;
  CM.menuDefault = function () { return CM.menuFill(menuDef0()); };

  /* ---------- datos de ejemplo de los módulos nuevos ---------- */
  function ts(fecha, hh) { return fecha + 'T' + hh + ':00.000Z'; }
  CM.seedExt = function (d) {
    var prevDb = CM.db; CM.db = d;
    var h = CM.hoy();
    d.cfg.rol = d.cfg.rol || 'admin';
    d.cfg.sellosMeta = 8;
    d.cfg.mods = {};
    d.cfg.rubroOng = 'ONG de salud · cannabis medicinal';
    d.cfg.zona = 'America/Argentina/Salta';
    d.rubros = [
      ['R-01', 'Aportes voluntarios', 'ingreso'], ['R-02', 'Cuotas de socios', 'ingreso'], ['R-03', 'Donaciones', 'ingreso'], ['R-04', 'Talleres y cursos', 'ingreso'], ['R-05', 'Servicios y acompañamiento', 'ingreso'],
      ['R-06', 'Insumos y envases', 'egreso'], ['R-07', 'Servicios (luz, agua, internet)', 'egreso'], ['R-08', 'Honorarios y viáticos', 'egreso'], ['R-09', 'Alquiler', 'egreso'], ['R-10', 'Librería y limpieza', 'egreso'],
      ['R-11', 'Gastos bancarios', 'egreso'], ['R-12', 'Devolución de aportes', 'egreso'], ['R-13', 'Ajustes y diferencias', 'ambos']
    ].map(function (r) { return { id: r[0], n: r[1], tipo: r[2], activo: true }; });
    d.cajas = []; d.cmovs = [];
    d.users = [
      { id: 'U-1', nombre: 'Administración (ejemplo)', correo: 'admin@example.com', rol: 'admin', activo: true },
      { id: 'U-2', nombre: 'Ana, supervisora (ficticia)', correo: 'ana@example.com', rol: 'supervisor', activo: true },
      { id: 'U-3', nombre: 'Beto, mostrador (ficticio)', correo: 'beto@example.com', rol: 'mostrador', activo: true },
      { id: 'U-4', nombre: 'Cele, voluntaria (ficticia)', correo: 'cele@example.com', rol: 'operador', activo: true }
    ];
    d.users.forEach(function (u) { CM.setPw(u, CM.CLAVE_DEMO, false); });
    d.perms = CM.permsDefault();
    d.staff = [
      { id: 'E1', nombre: 'Presidencia (ficticia)', dni: '99100001', cargo: 'Presidencia', area: 'Comisión directiva', tel: '3875100001', activo: true },
      { id: 'E2', nombre: 'Tesorería (ficticia)', dni: '99100002', cargo: 'Tesorería', area: 'Comisión directiva', tel: '3875100002', activo: true },
      { id: 'E3', nombre: 'Dra. Médica (ficticia)', dni: '99100003', cargo: 'Coordinación médica', area: 'Equipo médico', tel: '3875100003', activo: true },
      { id: 'E4', nombre: 'Beto Mostrador (ficticio)', dni: '99100004', cargo: 'Mostrador y dispensación', area: 'Atención', tel: '3875100004', activo: true },
      { id: 'E5', nombre: 'Cele Voluntaria (ficticia)', dni: '99100005', cargo: 'Voluntariado', area: 'Talleres y educación', tel: '3875100005', activo: true }
    ];
    d.fichas = [];
    [-9, -8, -7, -6, -5, -4, -3, -2, -1].forEach(function (n) {
      var f = CM.addDays(h, n), dow = new Date(f + 'T12:00:00Z').getUTCDay();
      if (dow === 0 || dow === 6) return;
      ['E3', 'E4', 'E5'].forEach(function (id, i) {
        var ini = ['11:55', '12:02', '12:10'][i], fin = ['18:05', '18:00', '16:00'][i];
        d.fichas.push({ id: CM.nextId('FI'), emp: id, ts: ts(f, ini), fecha: f, tipo: 'entrada', metodo: i === 0 ? 'NFC (ejemplo)' : 'QR', dispositivo: 'Terminal de la demo' });
        d.fichas.push({ id: CM.nextId('FI'), emp: id, ts: ts(f, fin), fecha: f, tipo: 'salida', metodo: i === 0 ? 'NFC (ejemplo)' : 'QR', dispositivo: 'Terminal de la demo' });
      });
    });
    d.tareas = [
      { id: 'T-1', t: 'Renovar el REPROCANN de la ONG', d: 'Reunir la documentación y revisar la fecha de vencimiento.', resp: 'E1', pri: 'alta', vence: CM.addDays(h, 20), col: 'curso' },
      { id: 'T-2', t: 'Llamar a pacientes con seguimiento pendiente', d: '', resp: 'E3', pri: 'media', vence: CM.addDays(h, 3), col: 'pend' },
      { id: 'T-3', t: 'Preparar el taller de cultivo responsable', d: 'Material y lista de inscriptos.', resp: 'E5', pri: 'media', vence: CM.addDays(h, 9), col: 'pend' },
      { id: 'T-4', t: 'Rendición mensual de aportes', d: 'Controlar cajas cerradas y comprobantes.', resp: 'E2', pri: 'alta', vence: CM.addDays(h, 6), col: 'rev' },
      { id: 'T-5', t: 'Reposición de envases ámbar', d: '', resp: 'E4', pri: 'baja', vence: CM.addDays(h, 14), col: 'pend' },
      { id: 'T-6', t: 'Actualizar el menú público', d: 'Cargar las fechas de los próximos talleres.', resp: 'E5', pri: 'baja', vence: '', col: 'hecha' },
      { id: 'T-7', t: 'Backup mensual de la base', d: 'Exportar el respaldo local.', resp: 'E2', pri: 'media', vence: CM.addDays(h, -2), col: 'curso' }
    ];
    d.counters.T = 7;
    d.org = [
      { id: 'O1', n: 'Comisión directiva', parent: '', cargo: 'Órgano de gobierno', emp: '' },
      { id: 'O2', n: 'Presidencia', parent: 'O1', cargo: 'Representación legal', emp: 'E1' },
      { id: 'O3', n: 'Tesorería', parent: 'O1', cargo: 'Finanzas y rendiciones', emp: 'E2' },
      { id: 'O4', n: 'Equipo médico', parent: 'O2', cargo: 'Historias clínicas y seguimiento', emp: 'E3' },
      { id: 'O5', n: 'Atención y dispensación', parent: 'O2', cargo: 'Mostrador, trazabilidad', emp: 'E4' },
      { id: 'O6', n: 'Talleres y educación', parent: 'O2', cargo: 'Voluntariado', emp: 'E5' }
    ];
    d.counters.O = 6;
    d.sellos = [];
    function sello(dni, n) { for (var i = n; i >= 1; i--) { var f = CM.addDays(h, -i * 4); d.sellos.push({ id: CM.nextId('SE'), dni: dni, fecha: f, ts: ts(f, '15:00'), tipo: 'sello', cant: 1, motivo: 'Participación en taller', user: 'Operador demo' }); } }
    sello('99000001', 5); sello('99000002', 3); sello('99000005', 8);
    d.cupones = [
      { id: 'CP-1', cod: 'BIENVENIDA', tipo: 'pct', valor: 20, desde: CM.addDays(h, -10), hasta: CM.addDays(h, 60), max: 50, porPac: 1, estado: 'activo', desc: 'Bonificación del 20 % sobre el aporte sugerido del primer taller.' },
      { id: 'CP-2', cod: 'TALLER2000', tipo: 'monto', valor: 200000, desde: CM.addDays(h, -5), hasta: CM.addDays(h, 30), max: 20, porPac: 1, estado: 'activo', desc: 'Bonificación de $ 2.000 sobre el aporte sugerido de un curso.' },
      { id: 'CP-3', cod: 'VERANO', tipo: 'pct', valor: 10, desde: CM.addDays(h, -90), hasta: CM.addDays(h, -30), max: 30, porPac: 1, estado: 'activo', desc: 'Campaña anterior (vencida, de ejemplo).' }
    ];
    d.cuponUsos = [{ id: 'CU-000001', key: 'BIENVENIDA|99000001|', cod: 'BIENVENIDA', dni: '99000001', fecha: CM.addDays(h, -6), ts: ts(CM.addDays(h, -6), '15:00'), ref: '', user: 'Operador demo' }];
    d.counters.CU = 1;
    d.planes = [
      { id: 'PL-1', n: 'Socio/a solidario/a · mensual', per: 'mensual', cent: 800000, ben: 'Seguimiento médico incluido y prioridad en talleres.', activo: true },
      { id: 'PL-2', n: 'Socio/a solidario/a · anual', per: 'anual', cent: 8000000, ben: 'Igual al mensual, con el año completo.', activo: true },
      { id: 'PL-3', n: 'Beneficiario/a con cuota bonificada', per: 'mensual', cent: 0, ben: 'Cuota bonificada por la comisión directiva.', activo: true }
    ];
    d.membresias = [
      { id: 'MB-1', dni: '99000001', plan: 'PL-1', desde: CM.addDays(h, -40), pagadoHasta: CM.addDays(h, 20), cons: { version: 'v1.0', fecha: CM.addDays(h, -40) }, estado: 'ok' },
      { id: 'MB-2', dni: '99000002', plan: 'PL-1', desde: h, pagadoHasta: '', cons: { version: 'v1.0', fecha: h }, estado: 'ok' },
      { id: 'MB-3', dni: '99000005', plan: 'PL-2', desde: CM.addDays(h, -400), pagadoHasta: CM.addDays(h, -35), cons: { version: 'v1.0', fecha: CM.addDays(h, -400) }, estado: 'ok' }
    ];
    d.counters.MB = 3;
    d.irubros = [
      { id: 'IR-1', n: 'Envases y etiquetas', color: '#a0de4a' },
      { id: 'IR-2', n: 'Material de talleres', color: '#6cc6ff' },
      { id: 'IR-3', n: 'Librería y limpieza', color: '#f2b740' }
    ];
    d.insumos = [
      { id: 'IN-1', rubro: 'IR-1', n: 'Envase ámbar 30 ml', unidad: 'u', min: 40, activo: true },
      { id: 'IN-2', rubro: 'IR-1', n: 'Etiquetas adhesivas', unidad: 'u', min: 100, activo: true },
      { id: 'IN-3', rubro: 'IR-1', n: 'Guantes descartables (caja)', unidad: 'caja', min: 4, activo: true },
      { id: 'IN-4', rubro: 'IR-2', n: 'Cuadernillos del taller', unidad: 'u', min: 15, activo: true },
      { id: 'IN-5', rubro: 'IR-3', n: 'Resma A4', unidad: 'u', min: 3, activo: true }
    ];
    d.imovs = [];
    [['IN-1', 120], ['IN-2', 80], ['IN-3', 6], ['IN-4', 40], ['IN-5', 2]].forEach(function (x) { d.imovs.push({ id: CM.nextId('IM'), ins: x[0], fecha: CM.addDays(h, -60), ts: ts(CM.addDays(h, -60), '12:00'), cant: x[1], motivo: 'Saldo inicial de la demo', user: 'Operador demo' }); });
    d.imovs.push({ id: CM.nextId('IM'), ins: 'IN-2', fecha: CM.addDays(h, -8), ts: ts(CM.addDays(h, -8), '14:00'), cant: -30, motivo: 'Uso en etiquetado de lotes', user: 'Operador demo' });
    d.menu = { draft: CM.menuDefault(), pub: null, versiones: [], altas: [], solicitudes: [] };
    d.menu.pub = JSON.parse(JSON.stringify(d.menu.draft));
    d.menu.versiones.push({ v: 1, ts: ts(CM.addDays(h, -30), '13:00'), user: 'Administración (ejemplo)', hash: CM.sha256(JSON.stringify(d.menu.pub)), cfg: JSON.parse(JSON.stringify(d.menu.pub)), nota: 'Primera publicación de la demo' });
    d.imports = [];
    d.nube = { cola: 0, ultima: '' };
    d.contactos = [];

    /* cajas cerradas de ejemplo (una por día, salvo un día que se deja sin cierre a propósito para la alerta) */
    var defs = [
      [-40, 2000000, [['egreso', 'R-10', 150000, 'Librería y limpieza del mes']], 0, ''],
      [-20, 2000000, [['egreso', 'R-06', 420000, 'Reposición de envases y etiquetas']], 0, ''],
      [-12, 2000000, [['ingreso', 'R-04', 600000, 'Inscripciones al taller de cultivo'], ['egreso', 'R-07', 350000, 'Internet y luz del local']], 0, ''],
      [-5, 2000000, [['ingreso', 'R-02', 800000, 'Cuota de socio (efectivo)'], ['retiro', 'R-13', 1000000, 'Retiro para depósito bancario']], -50000, 'Faltante de $ 500 detectado en el recuento; se revisa con tesorería.'],
      [-4, 2000000, [['egreso', 'R-08', 250000, 'Viáticos de talleres']], 0, ''],
      [-3, 2000000, [], 0, ''],
      [-2, 2000000, [['ingreso', 'R-03', 500000, 'Donación en efectivo']], 20000, 'Sobrante de $ 200 sin origen identificado.'],
      [-1, 2000000, [['egreso', 'R-10', 90000, 'Limpieza']], 0, '']
    ];
    defs.forEach(function (df) {
      var f = CM.addDays(h, df[0]), nro = d.cajas.length + 1;
      var caja = { id: 'CJ-' + String(nro).padStart(6, '0'), nro: nro, fecha: f, estado: 'abierta', apTs: ts(f, '11:00'), apUser: 'Operador demo', inicial: df[1], cierre: null };
      d.cajas.push(caja);
      df[2].forEach(function (m, i) {
        var r = CM.rubro(m[1]);
        d.cmovs.push({ id: CM.nextId('CM'), caja: caja.id, ts: ts(f, String(13 + i).padStart(2, '0') + ':00'), tipo: m[0], cent: m[2], medio: 'efectivo', rubroId: r.id, rubroN: r.n, motivo: m[3], user: 'Operador demo', ref: '' });
      });
      var movs = CM.cajaMovs(caja), t = CM.totCaja(caja, movs);
      // sólo los aportes de ese día entran en esa caja
      var propios = movs.filter(function (m) { return !m.derivado || (CM.db.aportes.filter(function (a) { return a.id === m.ref; })[0] || {}).fecha === f; });
      var snapCaja = caja;
      var tmp = CM.cerrarCaja(snapCaja, 0, '', ts(f, '21:00'));
      // recalcular con movimientos propios
      var t2 = CM.totCaja(caja, propios);
      var dec = t2.esperadoEf + df[3];
      tmp.movs = propios; tmp.porMedio = t2.porMedio; tmp.ingresos = t2.ingresos; tmp.egresos = t2.egresos; tmp.esperadoEf = t2.esperadoEf; tmp.conFC = t2.conFC; tmp.sinFC = t2.sinFC;
      tmp.declaradoEf = dec; tmp.dif = dec - t2.esperadoEf; tmp.obs = df[4]; tmp.user = 'Operador demo'; tmp.hash = CM.hashCierre(tmp);
      void t;
    });
    // el día -30 queda sin caja a propósito. Caja de hoy: abierta
    var nroH = d.cajas.length + 1;
    var cajaH = { id: 'CJ-' + String(nroH).padStart(6, '0'), nro: nroH, fecha: h, estado: 'abierta', apTs: ts(h, '00:00').replace('T00:00:00', 'T00:00:01'), apUser: 'Operador demo', inicial: 2000000, cierre: null };
    d.cajas.push(cajaH);
    var rr1 = CM.rubro('R-04');
    d.cmovs.push({ id: CM.nextId('CM'), caja: cajaH.id, ts: new Date().toISOString(), tipo: 'ingreso', cent: 300000, medio: 'efectivo', rubroId: rr1.id, rubroN: rr1.n, motivo: 'Inscripción a taller (ejemplo)', user: 'Operador demo', ref: '' });
    d.counters.CJ = d.cajas.length;
    CM.rehashAudit();
    CM.audit('Demo', 'Módulos de gestión cargados con datos de ejemplo');
    CM.db = prevDb || d;
    return d;
  };

  /* ---------- enganche con la semilla y la carga ---------- */
  var seed0 = CM.seed;
  CM.seed = function () { var d = seed0(); CM.seedExt(d); CM.db = d; return d; };
  var init0 = CM.init;
  CM.init = function () {
    init0();
    if (!CM.db.cajas || !CM.db.menu) { CM.seedExt(CM.db); CM.save(); }
    else if (CM.db.audit.length && !CM.db.audit[0].h) { CM.rehashAudit(); CM.save(); }
    var m = CM.db.menu, ch = false;
    (CM.db.users || []).forEach(function (u) { if (!u.pw) { CM.setPw(u, CM.CLAVE_DEMO, false); ch = true; } });
    if (m) [m.draft, m.pub].concat((m.versiones || []).map(function (v) { return v.cfg; })).forEach(function (c) { if (c && c.wa === '5493870000000') { c.wa = '5493876390362'; ch = true; } if (c && c.oculto && c.oculto.boton === undefined) { c.oculto.boton = true; ch = true; } });
    if (m && m.draft && !m.draft.portada) { CM.menuFill(m.draft); CM.menuFill(m.pub); (m.versiones || []).forEach(function (v) { CM.menuFill(v.cfg); }); ch = true; }
    if (ch) CM.save();
  };
})(window);
