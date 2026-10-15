/* Cannabismatica I+D · Sistema ONG (demo v2) · núcleo: datos, utilidades, reglas */
(function (g) {
  'use strict';
  var CM = g.CM = {};
  var KEY = 'cmv2_db_v2';
  var memDB = null;

  /* ---------- utilidades ---------- */
  CM.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  CM.norm = function (s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  };
  CM.soloDigitos = function (s) { return String(s || '').replace(/\D/g, ''); };

  CM.hoy = function () {
    var m = /[?&]hoy=(\d{4}-\d{2}-\d{2})/.exec(g.location.search || '');
    if (m) return m[1];
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Salta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  };
  CM.addDays = function (iso, n) {
    var d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  CM.diffDays = function (a, b) { // b - a en días
    return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
  };
  CM.fmtFecha = function (iso) {
    return /^\d{4}-\d{2}-\d{2}/.test(iso || '') ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '—';
  };
  CM.fmtFH = function (ts) {
    try {
      return new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Salta', dateStyle: 'short', timeStyle: 'short' }).format(new Date(ts));
    } catch (e) { return String(ts); }
  };
  CM.edad = function (nac) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nac || '')) return null;
    var h = CM.hoy(), a = +h.slice(0, 4) - +nac.slice(0, 4);
    if (h.slice(5) < nac.slice(5)) a--;
    return a;
  };
  CM.mesActual = function () { return CM.hoy().slice(0, 7); };

  var nf = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
  CM.fmtMoney = function (c) { return nf.format((c || 0) / 100); };
  CM.fmtNum = function (n) {
    return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n || 0);
  };
  // Importes en centavos enteros. Acepta formato argentino (1.500,50) y 1500.50
  CM.parseMonto = function (s) {
    s = String(s == null ? '' : s).trim().replace(/[$\s]/g, '');
    if (!s || !/^[\d.,]+$/.test(s)) return NaN;
    var lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
    if (lc > -1 && ld > -1) {
      s = lc > ld ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else if (lc > -1) {
      s = (s.match(/,/g) || []).length > 1 ? s.replace(/,/g, '') : s.replace(',', '.');
    } else if (ld > -1) {
      var p = s.split('.');
      if (p.length > 2 || p[1].length === 3) s = s.replace(/\./g, '');
    }
    var n = Number(s);
    if (!isFinite(n) || n < 0) return NaN;
    return Math.round(n * 100);
  };
  // Cantidades (g, frascos, unidades): hasta 2 decimales, coma o punto
  CM.parseCant = function (s) {
    s = String(s == null ? '' : s).trim().replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
    var n = Number(s);
    return isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  };
  CM.urlDrive = function (u) {
    u = String(u || '').trim();
    if (!u) return '';
    try {
      var x = new URL(u);
      if (x.protocol !== 'https:') return null;
      if (!(x.hostname === 'drive.google.com' || x.hostname === 'docs.google.com' || /\.google\.com$/.test(x.hostname))) return null;
      return x.href;
    } catch (e) { return null; }
  };

  /* CSV: separador ;, UTF-8 con BOM, anti inyección de fórmulas */
  CM.csvCell = function (v) {
    if (typeof v === 'number') return String(v).replace('.', ',');
    var s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    if (/[;"\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  CM.csv = function (headers, rows) {
    var out = [headers.map(CM.csvCell).join(';')];
    rows.forEach(function (r) { out.push(r.map(CM.csvCell).join(';')); });
    return '﻿' + out.join('\r\n');
  };
  CM.descargar = function (nombre, texto, mime) {
    var b = new Blob([texto], { type: mime || 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ---------- catálogos ---------- */
  CM.PRODUCTOS = {
    flores: { n: 'Flores secas terapéuticas', unidad: 'g', un: 'g' },
    aceite: { n: 'Aceite sublingual', unidad: 'frasco', un: 'frascos' },
    comestible: { n: 'Comestible oral', unidad: 'u', un: 'unidades' },
    crema: { n: 'Crema tópica', unidad: 'u', un: 'unidades' }
  };
  CM.MEDIOS = { efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'Mercado Pago (QR / link)', otro: 'Otro' };
  CM.CONCEPTOS = ['Donación voluntaria', 'Contribución'];
  CM.REP_LABEL = { valido: 'Válido', vencido: 'Vencido', tramite: 'En trámite', sin: 'Sin REPROCANN' };
  CM.REP_CLASS = { valido: 'p-ok', vencido: 'p-bad', tramite: 'p-warn', sin: 'p-mu' };

  /* ---------- base de datos (localStorage con respaldo en memoria) ---------- */
  CM.db = null;
  function leer() {
    try { var t = g.localStorage.getItem(KEY); if (t) return JSON.parse(t); } catch (e) { /* sin acceso */ }
    return memDB ? JSON.parse(memDB) : null;
  }
  CM.save = function () {
    var t = JSON.stringify(CM.db);
    memDB = t;
    try { g.localStorage.setItem(KEY, t); } catch (e) { /* queda en memoria */ }
  };
  CM.nextId = function (pref) {
    var c = CM.db.counters;
    c[pref] = (c[pref] || 0) + 1;
    return pref + '-' + String(c[pref]).padStart(6, '0');
  };
  CM.audit = function (accion, detalle) {
    CM.db.audit.unshift({ id: CM.nextId('AU'), ts: new Date().toISOString(), user: CM.db.cfg.operador || 'Operador demo', accion: accion, detalle: detalle || '' });
    if (CM.db.audit.length > 400) CM.db.audit.length = 400;
  };
  CM.init = function () {
    var d = leer();
    if (d && d.v === 2) { CM.db = d; return; }
    CM.db = CM.seed();
    CM.save();
  };
  CM.reset = function () {
    CM.db = CM.seed();
    CM.save();
  };

  /* ---------- stock por movimientos (suma conmutativa) ---------- */
  CM.stockLote = function (id) {
    var s = 0;
    CM.db.movs.forEach(function (m) { if (m.lote === id) s += m.cant; });
    return Math.round(s * 100) / 100;
  };
  CM.lote = function (id) {
    for (var i = 0; i < CM.db.lotes.length; i++) if (CM.db.lotes[i].id === id) return CM.db.lotes[i];
    return null;
  };
  CM.addMov = function (lote, tipo, cant, ref, motivo) {
    CM.db.movs.push({ id: CM.nextId('MV'), fecha: CM.hoy(), ts: new Date().toISOString(), lote: lote, tipo: tipo, cant: Math.round(cant * 100) / 100, ref: ref || '', motivo: motivo || '', user: CM.db.cfg.operador });
  };

  /* ---------- REPROCANN ---------- */
  // estado efectivo: un "Válido" con fecha vencida se muestra "Vencido"
  CM.estadoRep = function (r) {
    var out = { k: 'sin', dias: null, prox: false, vence: null };
    if (!r || !r.estado || r.estado === 'sin') return out;
    out.k = r.estado;
    out.vence = r.vence || null;
    if (r.vence) {
      out.dias = CM.diffDays(CM.hoy(), r.vence);
      if (r.estado === 'valido' && out.dias < 0) out.k = 'vencido';
      if (out.k === 'valido' && out.dias <= 60) out.prox = true;
    }
    return out;
  };
  CM.paciente = function (dni) { return CM.db.pacientes[CM.soloDigitos(dni)] || null; };

  // Reglas de la dispensación (configurables en Ajustes). Devuelve avisos y si bloquea.
  CM.reglasDispensar = function (p) {
    var res = { bloquea: false, msgs: [], pideObs: false };
    var ong = CM.estadoRep(CM.db.ong.reprocann);
    var pr = CM.estadoRep(p.reprocann);
    var bl = CM.db.cfg.bloquearVencido;
    if (ong.k === 'vencido' || ong.k === 'sin') {
      res.msgs.push({ t: bl ? 'bad' : 'warn', m: 'El permiso REPROCANN de la ONG figura ' + CM.REP_LABEL[ong.k] + '.' });
      if (bl) res.bloquea = true;
    } else if (ong.k === 'tramite') {
      res.msgs.push({ t: 'warn', m: 'El permiso REPROCANN de la ONG está en trámite.' });
      res.pideObs = true;
    }
    if (pr.k === 'vencido') {
      res.msgs.push({ t: bl ? 'bad' : 'warn', m: 'El REPROCANN del paciente está vencido.' });
      if (bl) res.bloquea = true;
    } else if (pr.k === 'sin') {
      res.msgs.push({ t: 'warn', m: 'El paciente no tiene REPROCANN cargado: se pedirá una observación.' });
      res.pideObs = true;
    } else if (pr.k === 'tramite') {
      res.msgs.push({ t: 'warn', m: 'El REPROCANN del paciente está en trámite: se pedirá una observación.' });
      res.pideObs = true;
    } else if (pr.prox) {
      res.msgs.push({ t: 'warn', m: 'El REPROCANN del paciente vence en ' + pr.dias + ' días.' });
    }
    if (!p.historiaCompleta) {
      res.msgs.push({ t: 'warn', m: 'La historia clínica está pendiente de completar.' });
    }
    return res;
  };

  /* ---------- consultas ---------- */
  CM.dispDe = function (dni) { return CM.db.disp.filter(function (d) { return d.dni === dni; }); };
  CM.aportesDe = function (dni) { return CM.db.aportes.filter(function (a) { return a.dni === dni; }); };
  CM.segDe = function (dni) { return CM.db.seg.filter(function (s) { return s.dni === dni; }); };
  CM.gramosMes = function (dni, mes) {
    var t = 0;
    CM.db.disp.forEach(function (d) { if (d.dni === dni && !d.anulada && d.unidad === 'g' && d.fecha.slice(0, 7) === mes) t += d.cant; });
    return Math.round(t * 100) / 100;
  };
  CM.seguimientoPendiente = function (p) {
    var disp = CM.dispDe(p.dni).filter(function (d) { return !d.anulada; });
    if (!disp.length) return false;
    var ult = disp.map(function (d) { return d.fecha; }).sort().pop();
    var s = CM.segDe(p.dni).map(function (x) { return x.fecha; }).sort().pop();
    var h = CM.hoy();
    if (CM.diffDays(ult, h) < 20) return false; // recién dispensado: todavía no corresponde
    return !s || CM.diffDays(s, h) > 35;
  };
  CM.comp = function (id) {
    for (var i = 0; i < CM.db.comps.length; i++) if (CM.db.comps[i].id === id) return CM.db.comps[i];
    return null;
  };

  /* ---------- datos de ejemplo (ficticios) ---------- */
  CM.seed = function () {
    var h = CM.hoy();
    var yymm = h.slice(2, 4) + h.slice(5, 7);
    var d = {
      v: 2,
      counters: {},
      cfg: { ejemplo: true, operador: 'Operador demo', bloquearVencido: true, topeMensualG: '', stockBajoDefault: 20 },
      ong: {
        nombre: 'Fundación Cannabismatica Investigación y Desarrollo',
        domicilio: 'Islas Malvinas 137, Salta Capital',
        email: 'cannabismatica@gmail.com',
        instagram: '@cannabismatica',
        cuit: '',
        condicionIva: 'Sujeto exento [a confirmar con contador]',
        puntoVenta: '0004',
        reprocann: { estado: 'valido', vence: CM.addDays(h, 140), nroInscripcion: '' },
        urlSeguimiento: 'https://docs.google.com/forms/d/e/1FAIpQLSc8HPFQ5w5EnQsGY0eCN0IEgVfl4GFTH_pKvdY_sjn44RF5oA/viewform',
        urlHistoria: 'https://docs.google.com/forms/d/e/1FAIpQLScMl4UfouAeMkd8L5Ex6C09cUE49JeIrf7oVsK1Ty2ol-cf1A/viewform'
      },
      pacientes: {}, lotes: [], movs: [], disp: [], aportes: [], comps: [], seg: [], audit: []
    };
    CM.db = d; // necesario para nextId / addMov durante la semilla
    var DR = 'https://drive.google.com/drive/my-drive';
    function pac(o) {
      o.alta = o.alta || CM.addDays(h, -90);
      o.drive1 = o.drive1 || ''; o.drive2 = o.drive2 || '';
      d.pacientes[o.dni] = o;
    }
    pac({ dni: '99000001', nombre: 'María Fernández (ficticia)', nac: '1984-03-12', tel: '3875000001', email: 'maria.demo@example.com', dir: 'Salta, Capital, Centro, Calle Ejemplo 100', cp: '4400', obraSocial: 'Obra social demo 123', ocupacion: 'Docente', motivo: 'Dolor crónico y trastornos del sueño', dudas: '', codSeg: 'DEMO-0001', historiaCompleta: true, consentimiento: CM.addDays(h, -85), reprocann: { estado: 'valido', vence: CM.addDays(h, 210), carnet: true }, drive1: DR, drive2: DR });
    pac({ dni: '99000002', nombre: 'Carlos Gutiérrez (ficticio)', nac: '1971-11-02', tel: '3875000002', email: 'carlos.demo@example.com', dir: 'Salta, Capital, Barrio Ejemplo, Calle Demo 250', cp: '4400', obraSocial: '', ocupacion: 'Comerciante', motivo: 'Ansiedad y estrés', dudas: 'Consulta por vía de administración', codSeg: 'DEMO-0002', historiaCompleta: true, consentimiento: CM.addDays(h, -80), reprocann: { estado: 'valido', vence: CM.addDays(h, 25), carnet: true }, drive1: DR, drive2: DR });
    pac({ dni: '99000003', nombre: 'Lucía Ramos (ficticia)', nac: '1992-07-30', tel: '3875000003', email: 'lucia.demo@example.com', dir: 'Salta, Capital, Barrio Muestra, Calle Prueba 12', cp: '4400', obraSocial: 'Obra social demo 456', ocupacion: 'Administrativa', motivo: 'Migraña', dudas: '', codSeg: '', historiaCompleta: true, consentimiento: CM.addDays(h, -9), reprocann: { estado: 'tramite', vence: null, carnet: false }, alta: CM.addDays(h, -9), drive1: DR, drive2: DR });
    pac({ dni: '99000004', nombre: 'Joaquín Torres (ficticio)', nac: '1965-01-19', tel: '3875000004', email: 'joaquin.demo@example.com', dir: 'Salta, Capital, Calle Falsa 500', cp: '4400', obraSocial: '', ocupacion: 'Jubilado', motivo: 'Artrosis', dudas: '', codSeg: 'DEMO-0004', historiaCompleta: true, consentimiento: CM.addDays(h, -170), reprocann: { estado: 'valido', vence: CM.addDays(h, -12), carnet: true }, alta: CM.addDays(h, -170), drive1: DR, drive2: DR });
    pac({ dni: '99000005', nombre: 'Rosa Aguirre (ficticia)', nac: '1958-09-05', tel: '3875000005', email: '', dir: 'Salta, Capital, Villa Demo, Calle Sin Número s/n', cp: '4400', obraSocial: 'Obra social demo 789', ocupacion: 'Ama de casa', motivo: 'Fibromialgia', dudas: '', codSeg: 'DEMO-0005', historiaCompleta: true, consentimiento: CM.addDays(h, -60), reprocann: { estado: 'valido', vence: CM.addDays(h, 300), carnet: true }, alta: CM.addDays(h, -60), drive1: DR, drive2: '' });
    pac({ dni: '99000006', nombre: 'Martín Soria (ficticio)', nac: '', tel: '3875000006', email: '', dir: '', cp: '', obraSocial: '', ocupacion: '', motivo: '', dudas: '', codSeg: '', historiaCompleta: false, consentimiento: '', reprocann: { estado: 'sin', vence: null, carnet: false }, alta: CM.addDays(h, -1) });

    function lote(abbr, prod, nombre, quim, stock, min) {
      var l = { id: 'L-' + yymm + '-' + abbr, prod: prod, nombre: nombre, quim: quim, unidad: CM.PRODUCTOS[prod].unidad, min: min, ingreso: CM.addDays(h, -90) };
      d.lotes.push(l);
      d.movs.push({ id: CM.nextId('MV'), fecha: l.ingreso, ts: l.ingreso + 'T12:00:00.000Z', lote: l.id, tipo: 'ingreso', cant: stock, ref: '', motivo: 'Saldo inicial de la demo', user: 'Operador demo' });
      return l;
    }
    lote('PET', 'flores', 'Petroleum Q1', 'Q1', 300, 50);
    lote('TRO', 'flores', 'Tropicana Cookies Q1', 'Q1', 250, 50);
    lote('TOC', 'flores', 'Tropicana Old Cookies Q1+CBN', 'Q1+CBN', 40, 30);
    lote('ZAZ', 'flores', 'ZaZa Q1', 'Q1', 200, 50);
    lote('ARO', 'flores', 'Aromito Q3 CBD', 'Q3', 180, 50);
    lote('FAN', 'flores', 'Fancy Q1', 'Q1', 150, 50);
    lote('CHE', 'flores', 'ChemoVar Q2', 'Q2', 100, 40);
    lote('AC3', 'aceite', 'Aceite sublingual Q3 (CBD)', 'Q3', 60, 10);
    lote('AC1', 'aceite', 'Aceite sublingual Q1 (THC)', 'Q1', 40, 10);
    lote('CR3', 'crema', 'Crema tópica CBD', 'Q3', 30, 8);
    lote('CO2', 'comestible', 'Comestible oral Q2', 'Q2', 50, 10);

    function L(abbr) { return 'L-' + yymm + '-' + abbr; }
    function disp(dni, dias, abbr, cant, indic) {
      var l = CM.lote(L(abbr)), id = CM.nextId('D'), f = CM.addDays(h, -dias);
      d.disp.push({ id: id, fecha: f, ts: f + 'T15:00:00.000Z', dni: dni, lote: l.id, prod: l.prod, nombre: l.nombre, quim: l.quim, unidad: l.unidad, cant: cant, indic: indic || '', obs: '', user: 'Operador demo', aporte: '', anulada: null });
      d.movs.push({ id: CM.nextId('MV'), fecha: f, ts: f + 'T15:00:00.000Z', lote: l.id, tipo: 'dispensacion', cant: -cant, ref: id, motivo: '', user: 'Operador demo' });
      return id;
    }
    function aporte(dni, dias, dispId, cent, medio, conFactura) {
      var id = CM.nextId('A'), f = CM.addDays(h, -dias);
      var a = { id: id, fecha: f, ts: f + 'T15:05:00.000Z', dni: dni, disp: dispId || '', cent: cent, medio: medio, concepto: 'Donación voluntaria', obs: '', user: 'Operador demo', estado: 'registrado', comp: '' };
      d.aportes.push(a);
      if (dispId) d.disp.forEach(function (x) { if (x.id === dispId) x.aporte = id; });
      if (conFactura) CM.emitirFacturaC(a, f);
      return a;
    }
    var d1 = disp('99000001', 40, 'PET', 5, '0,25 g por la noche, vaporizado');
    var d2 = disp('99000001', 12, 'ARO', 7, 'Dosis según indicación médica');
    var d3 = disp('99000001', 12, 'AC3', 1, '5 gotas sublingual cada 12 h');
    var d4 = disp('99000002', 30, 'TRO', 10, '');
    var d5 = disp('99000002', 3, 'TRO', 10, '');
    disp('99000004', 75, 'ZAZ', 5, '');
    var d7 = disp('99000005', 20, 'CR3', 1, 'Aplicar en zona afectada');
    var d8 = disp('99000005', 5, 'AC3', 1, '');
    var d9 = disp('99000005', 5, 'ARO', 5, '');
    aporte('99000001', 40, d1, 1500000, 'transferencia', true);
    aporte('99000001', 12, d2, 2000000, 'mercadopago', true);
    aporte('99000002', 30, d4, 1000000, 'efectivo', false);
    aporte('99000005', 20, d7, 800000, 'efectivo', true);
    aporte('99000005', 5, d9, 1200000, 'transferencia', false);
    d.seg.push({ id: CM.nextId('S'), dni: '99000001', fecha: CM.addDays(h, -10), objetivos: ['Dolor Cronico', 'Insomnio'], otro: '', vias: ['Inhalatoria Vaporizacion', 'Sublingual'], productos: ['Flores Secas', 'Aceite Sublingual'], genetica: 'Aromito Q3 CBD', quim: ['Quimitipo 3 (CBD)'], mejoras: ['Disminucion Dolor', 'Mejora del Sueño'], efectos: ['Sequedad Bucal'], dejo: 'No', nueva: 'Si', tipoAct: 'Caminatas', habitos: ['Si, Actividad Fisica'], comentario: 'Seguimiento de ejemplo.' });
    d.seg.push({ id: CM.nextId('S'), dni: '99000005', fecha: CM.addDays(h, -25), objetivos: ['Fibromialgia'], otro: '', vias: ['Tópica (piel)'], productos: ['Crema Topica'], genetica: '', quim: ['Quimitipo 3 (CBD)'], mejoras: ['Disminucion Dolor'], efectos: ['No siento efectos adversos'], dejo: 'No', nueva: 'No', tipoAct: '', habitos: ['No tengo necesidad de realizar - mejorar algunas de las actividades anteriores.'], comentario: '' });
    CM.audit('Demo', 'Datos de ejemplo cargados (ficticios)');
    return d;
  };

  /* ---------- comprobantes simulados (Factura C / Nota de crédito C) ---------- */
  CM.emitirFacturaC = function (aporte, fecha) {
    var nro = (CM.db.counters.FCN = (CM.db.counters.FCN || 0) + 1);
    var c = {
      id: CM.nextId('CP'), tipo: 'FC', pv: CM.db.ong.puntoVenta, nro: String(nro).padStart(8, '0'),
      fecha: fecha || CM.hoy(), aporte: aporte.id, dni: aporte.dni || '', rec: aporte.rec || null, cent: aporte.cent,
      concepto: aporte.concepto, cae: 'SIM' + String(Math.floor(Math.random() * 1e11)).padStart(11, '0'),
      caeVto: CM.addDays(fecha || CM.hoy(), 10), simulado: true, anulado: false, ref: ''
    };
    CM.db.comps.push(c);
    aporte.comp = c.id;
    return c;
  };
  CM.emitirNotaCreditoC = function (comp, motivo) {
    var nro = (CM.db.counters.NCN = (CM.db.counters.NCN || 0) + 1);
    var n = {
      id: CM.nextId('CP'), tipo: 'NCC', pv: CM.db.ong.puntoVenta, nro: String(nro).padStart(8, '0'),
      fecha: CM.hoy(), aporte: comp.aporte, dni: comp.dni || '', rec: comp.rec || null, cent: comp.cent, concepto: 'Anulación de Factura C ' + comp.pv + '-' + comp.nro + (motivo ? ' · ' + motivo : ''),
      cae: 'SIM' + String(Math.floor(Math.random() * 1e11)).padStart(11, '0'), caeVto: CM.addDays(CM.hoy(), 10), simulado: true, anulado: false, ref: comp.id
    };
    CM.db.comps.push(n);
    comp.anulado = true;
    return n;
  };
})(window);
