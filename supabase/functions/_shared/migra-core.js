/* Sistema VB ONG · Núcleo de MIGRACIÓN del sistema anterior (planilla AppSheet / Google Sheets «CANNABISMATICA")
   Una sola fuente de verdad para la validación y el mapeo: la usa la pantalla del navegador (js/m-migra.js)
   y la usan las pruebas en Node (t/). No toca ninguna base: recibe el libro ya leído y devuelve un PLAN.

   Reglas:
   - «Todo o nada»: si queda UN error sin resolver, el plan sale con ok=false y no se carga nada.
   - Las reglas de migración histórica están APAGADAS por defecto. Cada una que se enciende queda escrita en el plan
     (y en la auditoría al aplicar), para que se vea qué se decidió.
   - Dinero en centavos enteros. Cantidades con hasta 2 decimales. Fechas a ISO (AAAA-MM-DD) en hora de Salta.
   - Los datos que vienen de la planilla son NO confiables: se recortan, se limpian y nunca se ejecutan. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MIGRA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = 'migra-1.0';

  /* ---------- reglas (apagadas por defecto) ---------- */
  var REGLAS = {
    cicloHistorico: 'Asignar las entregas sin ciclo al ciclo «Stock histórico (migración)», cerrado y rotulado',
    omitirRenglonesVacios: 'Omitir renglones vacíos de entregas (sin cantidad y con importe cero)',
    serviciosSinStock: 'Tratar «consulta médica» y «horas» como donación de servicio, sin dispensación ni stock',
    crearLegajoFaltante: 'Crear un legajo «a revisar» para el documento de una entrega que no está en la hoja Legajo',
    separarARevision: 'Separar a «revisión» (sin cargar) las filas que no se pueden resolver y cargar el resto',
    medioSinDato: 'Registrar la donación con medio «Otro (sin dato)» cuando la forma de pago está vacía o es MIXTO sin desglose',
    cobradoManda: 'Cuando lo cobrado (Efectivo / Transferencia) no coincide con la suma del detalle, registrar lo cobrado'
  };

  /* ---------- utilidades ---------- */
  function txt(v, max) {
    var s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
    return max ? s.slice(0, max) : s;
  }
  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
  function digitos(s) { return String(s || '').replace(/\D/g, ''); }
  /* número con coma o punto decimal; acepta negativo; '' → null; basura → NaN */
  function num(v) {
    var s = String(v == null ? '' : v).trim().replace(/[$\s]/g, '');
    if (s === '') return null;
    if (!/^-?[\d.,]+$/.test(s)) return NaN;
    var neg = s.charAt(0) === '-'; if (neg) s = s.slice(1);
    var lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
    if (lc > -1 && ld > -1) s = lc > ld ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (lc > -1) s = (s.match(/,/g) || []).length > 1 ? s.replace(/,/g, '') : s.replace(',', '.');
    else if (ld > -1) { var p = s.split('.'); if (p.length > 2 || (p[1].length === 3 && p[0] !== '0')) s = s.replace(/\./g, ''); }
    var n = Number(s);
    if (!isFinite(n)) return NaN;
    return neg ? -n : n;
  }
  function cent(v) { var n = num(v); if (n === null) return null; if (isNaN(n)) return NaN; return Math.round(n * 100); }
  function cant(v) { var n = num(v); if (n === null) return null; if (isNaN(n)) return NaN; return Math.round(n * 100) / 100; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* dd/mm/aaaa [hh:mm[:ss]] · número de serie de Excel · aaaa-mm-dd → { fecha:'AAAA-MM-DD', ts:ISO (UTC, desde hora de Salta UTC-3) } */
  function fecha(v) {
    var s = txt(v);
    if (!s) return null;
    var m, y, mo, d, hh = 12, mi = 0, ss = 0;
    var sn = s.replace(',', '.');
    if (/^\d+(\.\d+)?$/.test(sn) && +sn > 20000 && +sn < 80000) {
      var ms = Math.round((+sn - 25569) * 864e5), dt = new Date(ms);
      y = dt.getUTCFullYear(); mo = dt.getUTCMonth() + 1; d = dt.getUTCDate(); hh = dt.getUTCHours(); mi = dt.getUTCMinutes(); ss = dt.getUTCSeconds();
    } else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s))) {
      d = +m[1]; mo = +m[2]; y = +m[3]; if (m[4] !== undefined) { hh = +m[4]; mi = +m[5]; ss = +(m[6] || 0); }
    } else if ((m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(s))) {
      y = +m[1]; mo = +m[2]; d = +m[3]; if (m[4] !== undefined) { hh = +m[4]; mi = +m[5]; ss = +(m[6] || 0); }
    } else return NaN;
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2100 || hh > 23 || mi > 59 || ss > 59) return NaN;
    var chk = new Date(Date.UTC(y, mo - 1, d));
    if (chk.getUTCMonth() !== mo - 1) return NaN;
    var iso = y + '-' + pad(mo) + '-' + pad(d);
    return { fecha: iso, ts: new Date(Date.UTC(y, mo - 1, d, hh + 3, mi, ss)).toISOString() };
  }
  function malo(x) { return typeof x === 'number' && x !== x; }
  function lista(v) { return txt(v).split(/\s*,\s*/).filter(Boolean).slice(0, 30); }
  function httpsOk(u) {
    u = txt(u, 2000); if (!u) return '';
    try { var x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; }
  }

  /* ---------- hojas y columnas ---------- */
  var HOJAS = {
    usuarios: 'usuarios_roles', docInst: 'documentacion_institucional', recursos: 'recursos_utiles',
    form1: 'respuestas_de_formulario_1', form2: 'respuestas_de_formulario_2', legajo: 'legajo', documentos: 'documentos',
    seguimientos: 'seguimientos', geneticas: 'geneticas', movimientos: 'movimientos', entregas: 'entregas',
    detalle: 'entregasdetalle', arqueo: 'arqueo'
  };
  var NOMBRE_HOJA = {
    usuarios: 'Usuarios_Roles', docInst: 'Documentación_Institucional', recursos: 'Recursos_Utiles', form1: 'Respuestas de formulario 1',
    form2: 'Respuestas de formulario 2', legajo: 'Legajo', documentos: 'Documentos', seguimientos: 'Seguimientos', geneticas: 'Geneticas',
    movimientos: 'Movimientos', entregas: 'Entregas', detalle: 'EntregasDetalle', arqueo: 'Arqueo'
  };
  /* columnas: clave → prefijos aceptados del encabezado normalizado (el primero que coincide gana) */
  var COLS = {
    usuarios: { email: ['email', 'correo'], nombre: ['nombre_completo', 'nombre'], rol: ['rol'] },
    docInst: { id: ['documento_id', 'id'], nombre: ['nombre_documento', 'nombre'], url: ['link_drive', 'link', 'enlace', 'url'], cat: ['categoria'] },
    recursos: { id: ['id_recurso', 'id'], nombre: ['nombrerecurso', 'nombre'], url: ['enlacerecurso', 'enlace', 'link', 'url'] },
    legajo: { id: ['id_legajo'], nombre: ['nombre'], dni: ['dni'], alta: ['fecha_ingreso'], estado: ['estado'], diag: ['diagnostico'], pdf: ['archivospdf'] },
    documentos: { id: ['id_documento'], fecha: ['fecha'], leg: ['id_legajo'], nombre: ['nombredocumento'], tipo: ['tipodocumento'], ruta: ['archivo_pdf', 'archivo'] },
    seguimientos: { id: ['id_seguimiento'], leg: ['id_legajo_ref', 'id_legajo'], fecha: ['fecha'], resp: ['responsable'], prod: ['producto_asignado'], obs: ['observaciones'] },
    geneticas: { id: ['id_genetica'], nombre: ['nombre_variedad', 'nombre'], tipo: ['tipo'], thc: ['thc'], cbd: ['cbd'], indic: ['indicaciones'], stock: ['stock'], ent: ['entradas'], sal: ['salidas'] },
    movimientos: { id: ['id_movimiento'], tipo: ['tipo_movimiento', 'tipo'], gen: ['id_genetica_ref', 'id_genetica'], leg: ['id_legajo_ref'], cant: ['cantidad_gr', 'cantidad'], fecha: ['fecha'] },
    entregas: { id: ['entregaid'], fecha: ['fecha'], leg: ['id_legajo'], tipo: ['tipo'], forma: ['formapago'], user: ['usuario'], turno: ['turno'], ef: ['efectivo'], tr: ['transferencia'] },
    detalle: { id: ['entregadetalleid'], ent: ['entregaid'], gen: ['id_genetica'], cant: ['cantidad'], precio: ['precio'], sub: ['subtotal'], desc: ['descuento'], total: ['total'] },
    arqueo: { id: ['arqueoid'], fecha: ['fecha'], tef: ['totalefectivo'], tba: ['totalbanco'], ref: ['recuentoefectivo'], rba: ['recuentobanco'], obs: ['observaciones'], turno: ['turno'], user: ['usuario'] },
    form1: { ts: ['marca_temporal'], motivo: ['motivo'], nombre: ['nombre_y_apellido'], nac: ['fecha_de_nacimiento'], dni: ['dni'], dir: ['direccion'], cp: ['codigo_postal'], tel: ['telefono'], email: ['email'], os: ['obra_social'], codSeg: ['cod_de_seguimiento'], ocup: ['labor'], dudas: ['dudas'], inscr: ['deseas_inscribirte'] },
    form2: { ts: ['marca_temporal'], nombre: ['nombre_completo'], dni: ['dni'], obj: ['sintoma'], vias: ['vias'], prods: ['productos'], quim: ['sabe_que_quimiotipo'], mej: ['siente_alguna_de_las_siguientes_mejoras'], efe: ['siente_alguno_de_estos_efectos'], dejo: ['dejo_de_realizar'], nueva: ['mejoro_o_comenzo'], tipoAct: ['que_tipo_de_actividad'], hab: ['reconoce_o_tiene'], com: ['algun_comentario'], email: ['direccion_de_correo'], gen: ['inflorescencias'] }
  };
  /* sólo estas hojas son imprescindibles para migrar pacientes y entregas */
  var OBLIGATORIAS = ['legajo', 'geneticas', 'entregas', 'detalle'];

  function mapa(head, def) {
    var h = head.map(norm), out = {}, faltan = [];
    Object.keys(def).forEach(function (k) {
      var idx = -1;
      def[k].some(function (pref) { for (var i = 0; i < h.length; i++) if (h[i] && h[i].indexOf(pref) === 0) { idx = i; return true; } return false; });
      out[k] = idx; if (idx < 0) faltan.push(k);
    });
    return { idx: out, faltan: faltan };
  }
  function hoja(libro, clave) {
    var objetivo = HOJAS[clave], k = Object.keys(libro || {}).filter(function (n) { return norm(n) === objetivo; })[0];
    return k ? libro[k] : null;
  }
  function filas(rows, def) {
    if (!rows || !rows.length) return { filas: [], faltan: Object.keys(def), sinEncabezado: true };
    var m = mapa(rows[0] || [], def), out = [];
    for (var r = 1; r < rows.length; r++) {
      var row = rows[r] || [], o = { _fila: r + 1 }, vacia = true;
      Object.keys(m.idx).forEach(function (k) { var i = m.idx[k], v = i < 0 ? '' : row[i]; o[k] = v == null ? '' : String(v); if (txt(o[k])) vacia = false; });
      if (!vacia) out.push(o);
    }
    return { filas: out, faltan: m.faltan };
  }

  /* ---------- clasificación de productos ---------- */
  function clasificar(nombre) {
    var n = norm(nombre);
    if (/consulta|hrs|horas?_|^hrs|servicio|honorario/.test(n)) return { prod: 'servicio', unidad: '' };
    if (/aceite/.test(n)) return { prod: 'aceite', unidad: 'frasco' };
    if (/crema|unguento/.test(n)) return { prod: 'crema', unidad: 'u' };
    if (/comestible|galleta|brownie|gomita/.test(n)) return { prod: 'comestible', unidad: 'u' };
    return { prod: 'flores', unidad: 'g' };
  }
  function quimDe(tipo, thc, cbd) {
    var t = norm(tipo), a = num(thc), b = num(cbd);
    if (t === 'cbd') return 'Q3';
    if (a > 0 && b > 0 && Math.abs(a - b) <= Math.max(a, b) * 0.5) return 'Q2';
    if (a > 0 || /sativa|indica|hibrido/.test(t)) return 'Q1';
    return '';
  }
  var ROLES = { administrador: 'admin', admin: 'admin', supervisor: 'supervisor', supervisora: 'supervisor', mostrador: 'mostrador', vendedor: 'mostrador', cajero: 'mostrador', operador: 'operador', operadora: 'operador', voluntario: 'operador', voluntaria: 'operador' };

  /* ---------- ANÁLISIS ---------- */
  /* libro: { 'NombreHoja': [[celdas], …] }
     ctx:  { hoy:'AAAA-MM-DD', reglas:{…}, existente:{ docs:{num:key}, legAnt:{id:key}, migIds:{id:1}, emails:{mail:1} }, rnd:function(n)->Uint32Array } */
  function analizar(libro, ctx) {
    ctx = ctx || {};
    var R = {}, reglas = ctx.reglas || {};
    Object.keys(REGLAS).forEach(function (k) { R[k] = reglas[k] === true; });
    var ex = ctx.existente || {}, exDocs = ex.docs || {}, exLeg = ex.legAnt || {}, exMig = ex.migIds || {}, exMails = ex.emails || {};
    var rnd = ctx.rnd || function (n) { var a = []; for (var i = 0; i < n; i++) a.push(Math.floor(Math.random() * 4294967296)); return a; };
    var hoy = ctx.hoy || new Date().toISOString().slice(0, 10);

    var errores = [], avisos = [], revision = [];
    function E(h, f, id, causa) { errores.push({ hoja: NOMBRE_HOJA[h] || h, fila: f, id: id || '', causa: causa }); }
    function A(h, f, id, causa) { avisos.push({ hoja: NOMBRE_HOJA[h] || h, fila: f, id: id || '', causa: causa }); }
    /* un problema: si la regla «separar a revisión» está activa va a revisión (no se carga); si no, es un error que bloquea */
    function P(h, f, id, causa) {
      if (R.separarARevision) revision.push({ hoja: NOMBRE_HOJA[h] || h, fila: f, id: id || '', causa: causa });
      else E(h, f, id, causa);
      return false;
    }

    var plan = { version: VERSION, reglas: R, pacientes: [], enriquecer: [], lotes: [], movs: [], disp: [], aportes: [], seg: [], docs: [], users: [], docInst: [], recursos: [], formResp: [], arqueos: [], entregas: [], ciclo: null, omitidos: [] };
    var L = {}, faltanHojas = [];
    Object.keys(HOJAS).forEach(function (k) {
      var rows = hoja(libro, k);
      if (!rows) { if (OBLIGATORIAS.indexOf(k) >= 0) faltanHojas.push(NOMBRE_HOJA[k]); L[k] = { filas: [], faltan: [], ausente: true }; return; }
      L[k] = filas(rows, COLS[k]);
      var crit = { legajo: ['id', 'dni'], geneticas: ['id', 'nombre'], entregas: ['id', 'leg', 'fecha'], detalle: ['id', 'ent', 'gen', 'cant', 'total'] }[k] || [];
      crit.forEach(function (c) { if (L[k].faltan.indexOf(c) >= 0) E(k, 1, '', 'Falta la columna «' + c + '» en el encabezado.'); });
    });
    faltanHojas.forEach(function (n) { E(n, 0, '', 'Falta la pestaña «' + n + '» en el archivo.'); });
    if (faltanHojas.length) return cerrar();

    /* ===== 1. LEGAJOS (pacientes) ===== */
    var porLeg = {}, porDoc = {}, usadosLeg = {}, ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    function nuevoLeg(alta) {
      for (var t = 0; t < 80; t++) {
        var r = rnd(6), s = ''; for (var i = 0; i < 6; i++) s += ABC.charAt(r[i] % ABC.length);
        var id = 'L-' + alta.replace(/-/g, '').slice(2) + '-' + s;
        if (!usadosLeg[id] && !(ex.legs || {})[id]) { usadosLeg[id] = 1; return id; }
      }
      throw new Error('No pude generar un legajo único');
    }
    function claveInterna() { var r = rnd(2); return '88' + String(r[0] % 1000000).padStart(6, '0') + String(r[1] % 100000).padStart(5, '0'); }
    function crearPac(o) {
      var d = o.doc, key;
      if (d && exDocs[d]) { // ya existe en el sistema: no se duplica, sólo se vincula
        porLeg[o.legAnt] = exDocs[d]; if (d) porDoc[d] = exDocs[d];
        plan.omitidos.push({ hoja: o.hoja, id: o.legAnt, causa: 'ya existe en el sistema (documento ' + d + ')' });
        return exDocs[d];
      }
      if (o.legAnt && exLeg[o.legAnt]) { porLeg[o.legAnt] = exLeg[o.legAnt]; plan.omitidos.push({ hoja: o.hoja, id: o.legAnt, causa: 'ya importado antes' }); return exLeg[o.legAnt]; }
      key = d && d.length >= 6 && d.length <= 9 ? d : claveInterna();
      var p = { key: key, leg: nuevoLeg(o.alta || hoy), legAnt: o.legAnt || '', doc: d ? { tipo: 'DNI', num: d } : null, nombre: o.nombre, alta: o.alta || hoy,
        motivo: o.motivo || '', estadoAnt: o.estado || '', revisar: !!o.revisar, notasMig: o.notas || [], origen: 'migración · ' + o.hoja, mig: 1 };
      plan.pacientes.push(p);
      if (o.legAnt) porLeg[o.legAnt] = key;
      if (d) porDoc[d] = key;
      return key;
    }
    L.legajo.filas.forEach(function (f) {
      var id = txt(f.id, 40), nom = txt(f.nombre, 120), dRaw = txt(f.dni, 20), d = digitos(dRaw), notas = [], rev = false;
      if (!id && !d) { E('legajo', f._fila, '', 'Fila sin ID_Legajo ni DNI.'); return; }
      if (!nom) { E('legajo', f._fila, id, 'Legajo sin nombre.'); return; }
      if (/@/.test(nom)) { notas.push('el nombre parece un correo'); rev = true; }
      if (dRaw && !/^\d+$/.test(dRaw)) { notas.push('documento original «' + dRaw + '» con caracteres no numéricos'); rev = true; }
      if (d && (d.length < 6 || d.length > 9)) { notas.push('documento de ' + d.length + ' dígitos'); rev = true; }
      if (!d) { notas.push('sin documento'); rev = true; }
      var dv = d && d.length >= 6 && d.length <= 9 ? d : '';
      var fa = fecha(f.alta); if (fa !== null && (malo(fa) || fa.fecha > hoy)) { notas.push('fecha de ingreso inválida «' + txt(f.alta) + '»'); fa = null; rev = true; }
      if (id && porLeg[id] !== undefined) { E('legajo', f._fila, id, 'ID_Legajo repetido en la hoja Legajo.'); return; }
      if (dv && porDoc[dv]) { E('legajo', f._fila, id, 'DNI ' + dv + ' repetido en la hoja Legajo.'); return; }
      if (!txt(f.estado)) notas.push('sin estado');
      if (rev) A('legajo', f._fila, id, 'Se carga marcado «a revisar»: ' + notas.join('; ') + '.');
      crearPac({ hoja: 'Legajo', legAnt: id || d, doc: dv, nombre: nom, alta: fa ? fa.fecha : '', motivo: txt(f.diag, 2000), estado: txt(f.estado, 30), revisar: rev, notas: notas });
    });
    function pacDe(legAnt) {
      var s = txt(legAnt); if (!s) return null;
      if (porLeg[s] !== undefined) return porLeg[s];
      var d = digitos(s); if (d && porDoc[d]) return porDoc[d];
      if (exLeg[s]) return exLeg[s];
      if (d && exDocs[d]) return exDocs[d];
      return null;
    }

    var vistos = {};
    /* ===== 2. FORMULARIO 1 (alta / historia clínica) → completa la ficha sin pisar nada ===== */
    L.form1.filas.forEach(function (f) {
      var d = digitos(f.dni), ts = fecha(f.ts), sid = 'F1:' + txt(f.ts) + ':' + d;
      if (vistos[sid]) { plan.omitidos.push({ hoja: 'Respuestas de formulario 1', id: sid, causa: 'respuesta repetida en la hoja' }); return; } vistos[sid] = 1;
      if (exMig[sid]) { plan.omitidos.push({ hoja: 'Respuestas de formulario 1', id: sid, causa: 'ya importada' }); return; }
      if (!d || d.length < 6 || d.length > 9) { A('form1', f._fila, '', 'Respuesta sin DNI válido: queda en revisión, no se asocia a ningún legajo.'); revision.push({ hoja: NOMBRE_HOJA.form1, fila: f._fila, id: sid, causa: 'sin DNI válido' }); return; }
      var key = pacDe(d);
      if (!key) {
        key = crearPac({ hoja: 'Respuestas de formulario 1', legAnt: '', doc: d, nombre: txt(f.nombre, 120) || 'Sin nombre (formulario)', alta: ts && !malo(ts) ? ts.fecha : '', motivo: txt(f.motivo, 2000), revisar: true, notas: ['alta creada desde el formulario: no estaba en la hoja Legajo'] });
        A('form1', f._fila, d, 'No estaba en la hoja Legajo: se crea la ficha marcada «a revisar».');
      }
      var nac = fecha(f.nac);
      plan.enriquecer.push({ key: key, sid: sid, campos: {
        nac: nac && !malo(nac) && nac.fecha < hoy ? nac.fecha : '', tel: digitos(f.tel).slice(0, 15), email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(txt(f.email)) ? txt(f.email, 120).toLowerCase() : '',
        dir: txt(f.dir, 200), cp: txt(f.cp, 10), obraSocial: txt(f.os, 120), codSeg: txt(f.codSeg, 60), ocupacion: txt(f.ocup, 120), dudas: txt(f.dudas, 1000), motivo: txt(f.motivo, 2000)
      } });
      plan.formResp.push({ id: sid, tipo: 'F1', key: key, fecha: ts && !malo(ts) ? ts.fecha : '', mig: 1 });
    });

    /* ===== 3. FORMULARIO 2 (seguimiento médico) → seguimientos ===== */
    L.form2.filas.forEach(function (f) {
      var d = digitos(f.dni), ts = fecha(f.ts), sid = 'F2:' + txt(f.ts) + ':' + d;
      if (vistos[sid]) { plan.omitidos.push({ hoja: 'Respuestas de formulario 2', id: sid, causa: 'respuesta repetida en la hoja' }); return; } vistos[sid] = 1;
      if (exMig[sid]) { plan.omitidos.push({ hoja: 'Respuestas de formulario 2', id: sid, causa: 'ya importada' }); return; }
      var key = d ? pacDe(d) : null;
      if (!key) { A('form2', f._fila, d, 'Seguimiento de un documento que no tiene legajo: queda en revisión.'); revision.push({ hoja: NOMBRE_HOJA.form2, fila: f._fila, id: sid, causa: 'documento sin legajo' }); return; }
      if (!ts || malo(ts)) { A('form2', f._fila, d, 'Fecha ilegible: queda en revisión.'); revision.push({ hoja: NOMBRE_HOJA.form2, fila: f._fila, id: sid, causa: 'fecha ilegible' }); return; }
      plan.seg.push({ id: sid, key: key, fecha: ts.fecha, objetivos: lista(f.obj), otro: '', vias: lista(f.vias), productos: lista(f.prods), genetica: txt(f.gen, 200), quim: lista(f.quim), mejoras: lista(f.mej), efectos: lista(f.efe), dejo: txt(f.dejo, 200), nueva: txt(f.nueva, 200), tipoAct: txt(f.tipoAct, 200), habitos: lista(f.hab), comentario: txt(f.com, 2000), mig: 1 });
      plan.formResp.push({ id: sid, tipo: 'F2', key: key, fecha: ts.fecha, mig: 1 });
    });

    /* ===== 4. SEGUIMIENTOS (hoja propia) ===== */
    L.seguimientos.filas.forEach(function (f) {
      var id = txt(f.id, 40), key = pacDe(f.leg), ts = fecha(f.fecha);
      if (!id) { E('seguimientos', f._fila, '', 'Seguimiento sin ID.'); return; }
      if (exMig['SG:' + id]) return;
      if (!key) { P('seguimientos', f._fila, id, 'El legajo «' + txt(f.leg) + '» no existe.'); return; }
      if (!ts || malo(ts)) { P('seguimientos', f._fila, id, 'Fecha ilegible.'); return; }
      plan.seg.push({ id: 'SG:' + id, key: key, fecha: ts.fecha, objetivos: [], otro: '', vias: [], productos: [], genetica: txt(f.prod, 200), quim: [], mejoras: [], efectos: [], dejo: '', nueva: '', tipoAct: '', habitos: [], comentario: txt(f.obs, 2000), responsable: txt(f.resp, 120), mig: 1 });
    });

    /* ===== 5. DOCUMENTOS (archivos del legajo en el Drive de AppSheet) ===== */
    L.documentos.filas.forEach(function (f) {
      var id = txt(f.id, 40), key = pacDe(f.leg), ts = fecha(f.fecha), ruta = txt(f.ruta, 300);
      if (!id) { E('documentos', f._fila, '', 'Documento sin ID.'); return; }
      if (exMig['DOC:' + id]) { plan.omitidos.push({ hoja: 'Documentos', id: id, causa: 'ya importado' }); return; }
      if (!ruta) { A('documentos', f._fila, id, 'Documento sin archivo: queda en revisión.'); revision.push({ hoja: NOMBRE_HOJA.documentos, fila: f._fila, id: id, causa: 'sin archivo' }); return; }
      if (/\.\.|^\/|:\/\//.test(ruta)) { E('documentos', f._fila, id, 'Ruta de archivo no permitida.'); return; }
      if (!key) { A('documentos', f._fila, id, 'Documento sin legajo válido («' + txt(f.leg) + '»): queda en revisión.'); revision.push({ hoja: NOMBRE_HOJA.documentos, fila: f._fila, id: id, causa: 'sin legajo' }); return; }
      var ext = (/\.([a-z0-9]{2,5})$/i.exec(ruta) || [])[1] || '';
      plan.docs.push({ id: 'DOC:' + id, legacyId: id, key: key, fecha: ts && !malo(ts) ? ts.fecha : '', nombre: txt(f.nombre, 160) || 'Documento sin nombre', tipo: txt(f.tipo, 40), ruta: ruta, ext: ext.toLowerCase(), driveFileId: '', estado: 'por vincular', mig: 1 });
    });

    /* ===== 6. GENÉTICAS → lotes de stock ===== */
    var gens = {}, lotesUsados = {};
    L.geneticas.filas.forEach(function (f) {
      var id = txt(f.id, 40), nom = txt(f.nombre, 120);
      if (!id || !nom) { E('geneticas', f._fila, id, 'Genética sin ID o sin nombre.'); return; }
      if (gens[id]) { E('geneticas', f._fila, id, 'ID_Genetica repetido.'); return; }
      var c = clasificar(nom), loteId = 'L-MIG-' + id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 24);
      if (lotesUsados[loteId]) { E('geneticas', f._fila, id, 'El ID choca con «' + lotesUsados[loteId] + '» al armar el código de lote: renombrá uno de los dos.'); return; }
      lotesUsados[loteId] = id;
      gens[id] = { id: id, nombre: nom, prod: c.prod, unidad: c.unidad, lote: loteId, stockHoja: cant(f.stock) };
      if (c.prod === 'servicio') { A('geneticas', f._fila, id, '«' + nom + '» no es un producto (servicio): ' + (R.serviciosSinStock ? 'sus renglones se cargan como donación de servicio, sin stock.' : 'no se crea lote; sus renglones necesitan la regla «servicios sin stock».')); return; }
      if (exMig['LOT:' + id]) { plan.omitidos.push({ hoja: 'Geneticas', id: id, causa: 'lote ya importado' }); return; }
      plan.lotes.push({ id: loteId, legacyId: id, prod: c.prod, nombre: nom, quim: quimDe(f.tipo, f.thc, f.cbd), tipoAnt: txt(f.tipo, 30), thc: num(f.thc), cbd: num(f.cbd), indic: txt(f.indic, 500), unidad: c.unidad, min: 0, ingreso: hoy, mig: 1 });
    });

    /* ===== 7. MOVIMIENTOS de STOCK (no es la caja: son gramos) ===== */
    L.movimientos.filas.forEach(function (f) {
      var id = txt(f.id, 40), g = gens[txt(f.gen)], q = cant(f.cant), ts = fecha(f.fecha), tipo = norm(f.tipo);
      if (!id) { E('movimientos', f._fila, '', 'Movimiento sin ID.'); return; }
      if (exMig['MV:' + id]) return;
      if (!g) { P('movimientos', f._fila, id, 'La genética «' + txt(f.gen) + '» no existe.'); return; }
      if (g.prod === 'servicio') { A('movimientos', f._fila, id, 'Movimiento de stock sobre un servicio («' + g.nombre + '»): se ignora.'); return; }
      if (q === null || isNaN(q) || q === 0) { P('movimientos', f._fila, id, 'Cantidad vacía, cero o ilegible.'); return; }
      if (!ts || malo(ts)) { P('movimientos', f._fila, id, 'Fecha ilegible.'); return; }
      var t = /entrada/.test(tipo) ? 'ingreso' : /ajuste/.test(tipo) ? 'ajuste' : null;
      if (!t) { P('movimientos', f._fila, id, 'Tipo de movimiento desconocido «' + txt(f.tipo) + '».'); return; }
      if (t === 'ingreso' && q < 0) A('movimientos', f._fila, id, 'Entrada con cantidad negativa: se carga como está.');
      plan.movs.push({ id: 'MV:' + id, fecha: ts.fecha, ts: ts.ts, lote: g.lote, tipo: t, cant: q, ref: id, motivo: 'Migración · ' + txt(f.tipo, 40) + (txt(f.leg) ? ' · registró ' + txt(f.leg, 20) : ''), user: 'Migración', mig: 1 });
    });

    /* ===== 8. ENTREGAS + DETALLE → dispensaciones y donaciones ===== */
    var dets = {}, detIds = {};
    L.detalle.filas.forEach(function (f) {
      var id = txt(f.id, 40);
      if (!id) { E('detalle', f._fila, '', 'Renglón sin EntregaDetalleID.'); return; }
      if (detIds[id]) { E('detalle', f._fila, id, 'EntregaDetalleID repetido.'); return; }
      detIds[id] = 1; (dets[txt(f.ent)] = dets[txt(f.ent)] || []).push(f);
    });
    var entIds = {}, ciclo = null;
    function cicloHist() {
      if (!ciclo) {
        ciclo = { id: 'CU-HIST-MIGRACION', nombre: 'Stock histórico (migración del sistema anterior)', lote: 'Histórico', inicio: '', estado: 'cerrado', creado: '', user: 'Migración', notas: 'Ciclo creado por la migración para las entregas que en el sistema anterior no tenían ciclo de origen. No es un ciclo real de cultivo.', historico: true, drive: { versiones: [] }, mig: 1 };
        plan.ciclo = ciclo;
      }
      return ciclo.id;
    }
    L.entregas.filas.forEach(function (f) {
      var id = txt(f.id, 40), fila = f._fila;
      if (!id) { E('entregas', fila, '', 'Entrega sin EntregaID.'); return; }
      if (entIds[id]) { E('entregas', fila, id, 'EntregaID repetido.'); return; }
      entIds[id] = 1;
      if (exMig['ENTX:' + id]) { plan.omitidos.push({ hoja: 'Entregas', id: id, causa: 'ya importada' }); return; }
      var ts = fecha(f.fecha);
      if (!ts || malo(ts)) { P('entregas', fila, id, 'Fecha ilegible «' + txt(f.fecha) + '».'); return; }
      if (ts.fecha > hoy) { P('entregas', fila, id, 'Fecha futura.'); return; }
      var legRaw = txt(f.leg, 20), key = pacDe(legRaw);
      if (!legRaw) { P('entregas', fila, id, 'Entrega sin legajo (ID_Legajo vacío).'); return; }
      if (!key) {
        var d = digitos(legRaw);
        if (R.crearLegajoFaltante && d.length >= 6 && d.length <= 9) {
          key = crearPac({ hoja: 'Entregas', legAnt: legRaw, doc: d, nombre: 'Paciente ' + d + ' (sin legajo en el sistema anterior)', alta: ts.fecha, revisar: true, notas: ['creado por la migración: la entrega ' + id + ' tenía un documento que no estaba en la hoja Legajo'] });
          A('entregas', fila, id, 'El documento ' + d + ' no estaba en la hoja Legajo: se crea un legajo «a revisar».');
        } else { P('entregas', fila, id, 'El legajo «' + legRaw + '» no existe en la hoja Legajo.'); return; }
      }
      var lineas = dets[id] || [];
      if (!lineas.length) { P('entregas', fila, id, 'Entrega sin renglones en EntregasDetalle.'); return; }
      var dispNuevas = [], sumaCent = 0, sumaServ = 0, malas = [];
      lineas.forEach(function (l) {
        var gid = txt(l.gen), g = gens[gid], q = cant(l.cant), pr = cent(l.precio), sub = cent(l.sub), ds = cent(l.desc), tot = cent(l.total);
        if ([q, pr, sub, ds, tot].some(function (x) { return x !== null && isNaN(x); })) { malas.push('renglón ' + txt(l.id) + ': número ilegible'); return; }
        var vacio = (q === null || q === 0) && !tot && (!gid || !!g); // sin cantidad y sin importe: no hay nada que dispensar ni registrar
        if (vacio) { if (R.omitirRenglonesVacios) { plan.omitidos.push({ hoja: 'EntregasDetalle', id: txt(l.id), causa: 'renglón vacío' }); return; } malas.push('renglón ' + txt(l.id) + ' vacío'); return; }
        if (!gid) { malas.push('renglón ' + txt(l.id) + ' sin genética (cantidad ' + (q || 0) + ', total ' + ((tot || 0) / 100) + ')'); return; }
        if (!g) { malas.push('renglón ' + txt(l.id) + ': la genética «' + gid + '» no existe'); return; }
        if (tot === null) tot = (sub || 0) - (ds || 0);
        if (sub !== null && ds !== null && tot !== sub - ds && Math.abs(tot - (sub - ds)) > 1) A('detalle', l._fila, txt(l.id), 'Total ' + tot / 100 + ' ≠ subtotal − descuento (' + (sub - ds) / 100 + '): se usa el total.');
        if (q !== null && pr !== null && sub !== null && Math.abs(Math.round(q * pr) - sub) > Math.max(2, Math.abs(sub) * 0.001)) A('detalle', l._fila, txt(l.id), 'Subtotal no coincide con cantidad × precio.');
        if (g.prod === 'servicio') {
          if (!R.serviciosSinStock) { malas.push('renglón ' + txt(l.id) + ' es un servicio («' + g.nombre + '»)'); return; }
          sumaServ += tot; sumaCent += tot; return;
        }
        if (q === null || q <= 0) {
          if (tot < 0) { A('detalle', l._fila, txt(l.id), 'Renglón sin cantidad con importe negativo: se toma como descuento de la entrega, sin dispensación.'); sumaCent += tot; return; }
          malas.push('renglón ' + txt(l.id) + ' sin cantidad'); return;
        }
        if (tot < 0) { malas.push('renglón ' + txt(l.id) + ' con total negativo'); return; }
        var cu = '';
        if (R.cicloHistorico) cu = cicloHist();
        else { malas.push('renglón ' + txt(l.id) + ' sin ciclo de cultivo de origen'); return; }
        sumaCent += tot;
        dispNuevas.push({ id: 'DET:' + txt(l.id), legacyId: txt(l.id), entrega: id, fecha: ts.fecha, ts: ts.ts, key: key, lote: g.lote, prod: g.prod, nombre: g.nombre, unidad: g.unidad, cant: q, cu: cu, cuHist: !!R.cicloHistorico, cent: tot, user: txt(f.user, 120) || 'Migración', mig: 1 });
      });
      if (malas.length) { P('entregas', fila, id, malas.join(' · ') + '.'); return; }
      /* importes: lo cobrado según las columnas Efectivo / Transferencia; si están vacías, la suma del detalle */
      var ef = cent(f.ef), tr = cent(f.tr), forma = norm(f.forma), aps = [];
      if ((ef !== null && isNaN(ef)) || (tr !== null && isNaN(tr)) || ef < 0 || tr < 0) { P('entregas', fila, id, 'Importe de efectivo o transferencia ilegible o negativo.'); return; }
      var hayCols = ef !== null || tr !== null, cobrado = (ef || 0) + (tr || 0);
      if (hayCols) {
        if (Math.abs(cobrado - Math.max(0, sumaCent)) > 1) {
          var dif = 'Lo cobrado (' + cobrado / 100 + ') no coincide con la suma del detalle (' + sumaCent / 100 + ')';
          if (!R.cobradoManda) { P('entregas', fila, id, dif + '.'); return; }
          A('entregas', fila, id, dif + ': se registra lo cobrado.');
        }
        if (ef > 0) aps.push({ medio: 'efectivo', cent: ef });
        if (tr > 0) aps.push({ medio: 'transferencia', cent: tr });
      } else if (sumaCent > 0) {
        var medio = forma === 'efectivo' ? 'efectivo' : forma === 'transferencia' ? 'transferencia' : '';
        if (!medio) {
          if (!R.medioSinDato) { P('entregas', fila, id, 'Forma de pago ' + (forma ? '«' + txt(f.forma) + '» sin desglose' : 'vacía') + ' y sin importes por medio.'); return; }
          medio = 'otro';
          A('entregas', fila, id, 'Forma de pago ' + (forma ? txt(f.forma) + ' sin desglose' : 'vacía') + ': se registra como «Otro (sin dato)».');
        }
        aps.push({ medio: medio, cent: sumaCent });
      } else if (sumaCent < 0) { P('entregas', fila, id, 'La entrega suma un importe negativo.'); return; }
      dispNuevas.forEach(function (x) { plan.disp.push(x); });
      aps.forEach(function (a, i) {
        plan.aportes.push({ id: 'DON:' + id + '|' + a.medio, entrega: id, fecha: ts.fecha, ts: ts.ts, key: key, cent: a.cent, medio: a.medio, servicio: sumaServ > 0 && i === 0 ? sumaServ : 0,
          concepto: 'Donación voluntaria', rubroId: 'R-01', obs: 'Migración del sistema anterior · entrega ' + id + (txt(f.turno) ? ' · turno ' + txt(f.turno, 20) : ''), user: txt(f.user, 120) || 'Migración', mig: 1 });
      });
      if (!aps.length && !dispNuevas.length) plan.omitidos.push({ hoja: 'Entregas', id: id, causa: 'entrega sin productos ni importe' });
      if (aps.length || dispNuevas.length) plan.entregas.push('ENTX:' + id); // marca de idempotencia
    });
    /* renglones de detalle cuya entrega no existe */
    Object.keys(dets).forEach(function (eid) { if (!entIds[eid]) dets[eid].forEach(function (l) { P('detalle', l._fila, txt(l.id), 'La entrega «' + eid + '» no existe en la hoja Entregas.'); }); });

    /* ===== 9. CONTROL DE STOCK: lo reconstruido por movimientos vs. la columna Stock de Geneticas ===== */
    plan.controlStock = Object.keys(gens).filter(function (k) { return gens[k].prod !== 'servicio'; }).map(function (k) {
      var g = gens[k], s = 0;
      plan.movs.forEach(function (m) { if (m.lote === g.lote) s += m.cant; });
      plan.disp.forEach(function (d) { if (d.lote === g.lote) s -= d.cant; });
      s = Math.round(s * 100) / 100;
      return { lote: g.lote, nombre: g.nombre, reconstruido: s, hoja: g.stockHoja, coincide: g.stockHoja === null || isNaN(g.stockHoja) ? null : Math.abs(s - g.stockHoja) < 0.01 };
    });
    plan.controlStock.forEach(function (c) {
      if (c.reconstruido < 0) A('geneticas', 0, c.lote, '«' + c.nombre + '» queda con stock negativo (' + c.reconstruido + '): faltan entradas en el sistema anterior. Se marca en rojo hasta regularizarlo.');
      if (c.coincide === false) A('geneticas', 0, c.lote, '«' + c.nombre + '»: stock reconstruido ' + c.reconstruido + ' ≠ columna Stock de la hoja (' + c.hoja + ').');
    });

    /* ===== 10. USUARIOS, DOCUMENTOS INSTITUCIONALES, RECURSOS, ARQUEOS ===== */
    L.usuarios.filas.forEach(function (f) {
      var mail = txt(f.email, 120).toLowerCase(), rol = ROLES[norm(f.rol)];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { E('usuarios', f._fila, mail, 'Correo inválido.'); return; }
      if (!rol) { E('usuarios', f._fila, mail, 'Rol desconocido «' + txt(f.rol) + '» (se aceptan Administrador, Supervisor, Mostrador, Operador).'); return; }
      if (exMails[mail]) { plan.omitidos.push({ hoja: 'Usuarios_Roles', id: mail, causa: 'el usuario ya existe' }); return; }
      if (plan.users.some(function (u) { return u.correo === mail; })) { E('usuarios', f._fila, mail, 'Correo repetido.'); return; }
      plan.users.push({ correo: mail, nombre: txt(f.nombre, 80) || mail, rol: rol, mig: 1 });
    });
    [['docInst', 'docInst'], ['recursos', 'recursos']].forEach(function (par) {
      L[par[0]].filas.forEach(function (f) {
        var id = txt(f.id, 40), u = httpsOk(f.url);
        if (!id) { E(par[0], f._fila, '', 'Fila sin ID.'); return; }
        if (exMig[par[0] + ':' + id]) return;
        if (u === null) { E(par[0], f._fila, id, 'El enlace no es https.'); return; }
        plan[par[1]].push({ id: par[0] + ':' + id, legacyId: id, nombre: txt(f.nombre, 160), url: u, cat: txt(f.cat, 60), mig: 1 });
      });
    });
    L.arqueo.filas.forEach(function (f) {
      var id = txt(f.id, 40), ts = fecha(f.fecha);
      if (!id || !ts || malo(ts)) { E('arqueo', f._fila, id, 'Arqueo sin ID o con fecha ilegible.'); return; }
      if (exMig['ARQ:' + id]) return;
      var v = ['tef', 'tba', 'ref', 'rba'].map(function (k) { return cent(f[k]); });
      if (v.some(function (x) { return x !== null && isNaN(x); })) { E('arqueo', f._fila, id, 'Importe ilegible.'); return; }
      plan.arqueos.push({ id: 'ARQ:' + id, fecha: ts.fecha, totalEf: v[0], totalBanco: v[1], recuentoEf: v[2], recuentoBanco: v[3], obs: txt(f.obs, 500), turno: txt(f.turno, 20), user: txt(f.user, 120), soloLectura: true, mig: 1 });
    });

    return cerrar();

    function cerrar() {
      plan.errores = errores; plan.avisos = avisos; plan.revision = revision;
      plan.ok = errores.length === 0;
      plan.resumen = {
        pacientes: plan.pacientes.length, enriquecidos: plan.enriquecer.length, aRevisar: plan.pacientes.filter(function (p) { return p.revisar; }).length,
        lotes: plan.lotes.length, movimientos: plan.movs.length, dispensaciones: plan.disp.length, donaciones: plan.aportes.length,
        donadoCent: plan.aportes.reduce(function (s, a) { return s + a.cent; }, 0), seguimientos: plan.seg.length, documentos: plan.docs.length,
        usuarios: plan.users.length, docInst: plan.docInst.length, recursos: plan.recursos.length, arqueos: plan.arqueos.length,
        errores: errores.length, avisos: avisos.length, revision: revision.length, omitidos: plan.omitidos.length
      };
      return plan;
    }
  }

  return { VERSION: VERSION, REGLAS: REGLAS, analizar: analizar, _u: { num: num, cent: cent, cant: cant, fecha: fecha, norm: norm, clasificar: clasificar, quimDe: quimDe, httpsOk: httpsOk } };
});
