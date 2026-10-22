/* Sistema VB ONG · Pantalla «Migración del sistema anterior» (planilla AppSheet / Google Sheets → sistema)
   - Lee el libro .xlsx COMPLETO (las 13 pestañas) dentro del navegador: los datos no salen de este equipo.
   - Valida con el núcleo compartido (js/migra-core.js): «todo o nada». Las reglas de migración histórica
     están apagadas por defecto; cada una que se encienda queda en el lote y en la auditoría.
   - Aplica en UNA operación: trabaja sobre una copia de la base, verifica invariantes y recién entonces la reemplaza.
   - Reimportar el mismo archivo no duplica (cada registro guarda su identificador del sistema anterior).
   - El lote se puede deshacer mientras nada nuevo dependa de lo importado. */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, VIEWS = CM.VIEWS, M = g.MIGRA;
  var render = function () { CM.render(); };
  var money = function (c) { return CM.fmtMoney(c); };
  if (!M) return;

  (function () {
    var i = -1; CM.NAV.forEach(function (n, k) { if (n[0] === 'importexport') i = k; });
    CM.NAV.splice(i + 1, 0, ['migracion', 'Migración del sistema anterior', 'swap', 'importexport']);
  })();
  CM.TITULOS.migracion = 'Migración del sistema anterior';
  CM.mg = CM.mg || { libro: null, archivo: '', plan: null, reglas: {}, msg: '', tab: 'errores', leyendo: false };

  /* ---------- base ---------- */
  function asegurar(db) {
    if (!db.migra) db.migra = { lotes: [], ids: {} };
    if (!db.legDocs) db.legDocs = [];
    if (!db.docInst) db.docInst = [];
    if (!db.recursos) db.recursos = [];
    if (!db.arqueosHist) db.arqueosHist = [];
    if (!db.cultivos) db.cultivos = [];
    if (!db.cultReg) db.cultReg = [];
    return db;
  }
  var init0 = CM.init;
  CM.init = function () { init0(); var had = !!CM.db.migra; asegurar(CM.db); if (!had) CM.save(); };

  /* Las donaciones migradas son historia: no entran como ingreso derivado en una caja abierta hoy */
  var cajaMovs0 = CM.cajaMovs;
  CM.cajaMovs = function (caja) {
    var movs = cajaMovs0(caja);
    if (caja.estado === 'cerrada') return movs;
    var mig = {}; (CM.db.aportes || []).forEach(function (a) { if (a.mig) mig[a.id] = 1; });
    return movs.filter(function (m) { return !(m.derivado && mig[m.ref]); });
  };

  /* …ni generan alertas de «días con donaciones sin cierre» */
  var dsc0 = CM.diasSinCaja;
  CM.diasSinCaja = function () {
    var ap = CM.db.aportes; CM.db.aportes = ap.filter(function (a) { return !a.mig; });
    try { return dsc0(); } finally { CM.db.aportes = ap; }
  };

  /* ---------- lector .xlsx de libro completo (todas las pestañas, con su nombre) ---------- */
  function leerZip(buf) {
    var u = new Uint8Array(buf), dv = new DataView(buf), eocd = -1, i;
    for (i = u.length - 22; i >= Math.max(0, u.length - 70000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error('No es un archivo .xlsx válido.');
    var n = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true), ent = {}, td = new TextDecoder();
    for (i = 0; i < n; i++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      var met = dv.getUint16(off + 10, true), csz = dv.getUint32(off + 20, true), usz = dv.getUint32(off + 24, true), nl = dv.getUint16(off + 28, true), el = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lo = dv.getUint32(off + 42, true);
      ent[td.decode(u.subarray(off + 46, off + 46 + nl))] = { met: met, csz: csz, usz: usz, lo: lo }; off += 46 + nl + el + cl;
    }
    var usados = { n: 0 }, total = 0; Object.keys(ent).forEach(function (k) { total += ent[k].usz; });
    if (total > 80 * 1024 * 1024) throw new Error('El archivo descomprimido supera 80 MB.');
    return function leer(nombre) {
      var x = ent[nombre]; if (!x) return Promise.resolve(null);
      var ln = dv.getUint16(x.lo + 26, true), le = dv.getUint16(x.lo + 28, true), ini = x.lo + 30 + ln + le, dat = u.subarray(ini, ini + x.csz);
      if (x.met === 0) return Promise.resolve(td.decode(dat));
      if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('Este navegador no puede descomprimir .xlsx; usá Chrome, Edge o Firefox actualizados.'));
      var ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter();
      w.write(dat).catch(function () { }); w.close().catch(function () { });
      var rd = ds.readable.getReader(), partes = [], n = 0;
      function paso() {
        return rd.read().then(function (r) {
          if (r.done) { var out = new Uint8Array(n), o = 0; partes.forEach(function (p) { out.set(p, o); o += p.length; }); return td.decode(out); }
          n += r.value.length; usados.n += r.value.length;
          if (n > 40 * 1024 * 1024 || usados.n > 120 * 1024 * 1024) { rd.cancel().catch(function () { }); throw new Error('El archivo descomprimido es demasiado grande.'); }
          partes.push(r.value); return paso();
        });
      }
      return paso();
    };
  }
  function xml(t) { return new DOMParser().parseFromString(t, 'application/xml'); }
  function porTag(el, tag) { return Array.prototype.slice.call(el.getElementsByTagNameNS('*', tag)); }
  CM.leerXlsxLibro = function (buf) {
    var leer;
    try { leer = leerZip(buf); } catch (e) { return Promise.reject(e); }
    return Promise.all([leer('xl/workbook.xml'), leer('xl/_rels/workbook.xml.rels'), leer('xl/sharedStrings.xml')]).then(function (r) {
      if (!r[0] || !r[1]) throw new Error('El archivo no tiene la estructura de un libro de Excel.');
      var rels = {}; porTag(xml(r[1]), 'Relationship').forEach(function (x) { rels[x.getAttribute('Id')] = x.getAttribute('Target'); });
      var ss = []; if (r[2]) porTag(xml(r[2]), 'si').forEach(function (si) { ss.push(porTag(si, 't').map(function (t) { return t.textContent; }).join('')); });
      var hojas = porTag(xml(r[0]), 'sheet').map(function (s) {
        var rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'), t = rels[rid] || '';
        t = t.replace(/^\/?xl\//, '').replace(/^\//, ''); return { nombre: s.getAttribute('name'), ruta: 'xl/' + t };
      });
      if (hojas.length > 60) throw new Error('El libro tiene demasiadas pestañas.');
      return Promise.all(hojas.map(function (h) { return leer(h.ruta); })).then(function (txts) {
        var libro = {};
        hojas.forEach(function (h, k) {
          if (!txts[k]) return;
          var rows = [];
          porTag(xml(txts[k]), 'row').forEach(function (row) {
            var ri = (+row.getAttribute('r') || rows.length + 1) - 1; if (ri > 50000) return;
            var arr = [];
            porTag(row, 'c').forEach(function (c) {
              var ref = c.getAttribute('r') || '', col = 0, m = /^([A-Z]+)/.exec(ref); if (m) m[1].split('').forEach(function (ch) { col = col * 26 + ch.charCodeAt(0) - 64; });
              if (col > 200) return;
              var t = c.getAttribute('t'), v = porTag(c, 'v')[0], val = '';
              if (t === 's' && v) val = ss[+v.textContent] || '';
              else if (t === 'inlineStr') val = porTag(c, 't').map(function (z) { return z.textContent; }).join('');
              else if (t === 'str' || t === 'b' || t === 'e') val = v ? v.textContent : '';
              else if (v) { var nv = Number(v.textContent); val = isFinite(nv) ? String(Math.round(nv * 1e6) / 1e6).replace('.', ',') : v.textContent; } // número: coma decimal, sin ambigüedad de miles
              arr[(col || arr.length + 1) - 1] = val;
            });
            for (var q = 0; q < arr.length; q++) if (arr[q] === undefined) arr[q] = '';
            rows[ri] = arr;
          });
          for (var z = 0; z < rows.length; z++) if (!rows[z]) rows[z] = [];
          libro[h.nombre] = rows;
        });
        return libro;
      });
    });
  };

  /* ---------- análisis contra el estado actual (idempotencia) ---------- */
  function existente() {
    var db = asegurar(CM.db), docs = {}, legAnt = {}, legs = {}, emails = {};
    Object.keys(db.pacientes).forEach(function (k) {
      var p = db.pacientes[k], d = CM.docPac(p);
      if (d && d.num) docs[d.num] = k;
      if (p.legAnt) legAnt[p.legAnt] = k;
      if (p.leg) legs[p.leg] = 1;
    });
    (db.users || []).forEach(function (u) { if (u.correo) emails[String(u.correo).toLowerCase()] = 1; });
    return { docs: docs, legAnt: legAnt, legs: legs, migIds: db.migra.ids, emails: emails };
  }
  function rnd(n) { var a = new Uint32Array(n); g.crypto.getRandomValues(a); return a; }
  function analizar() {
    var mg = CM.mg; if (!mg.libro) return;
    mg.plan = M.analizar(mg.libro, { hoy: CM.hoy(), reglas: mg.reglas, existente: existente(), rnd: rnd });
    mg.prueba = '';
  }

  /* ---------- APLICAR (atómico) ---------- */
  function aplicar(plan, archivo) {
    var db = asegurar(JSON.parse(JSON.stringify(CM.db))), prevDb = CM.db;
    var lote = { id: 'MIG-' + String((db.migra.lotes.length + 1)).padStart(4, '0'), ts: new Date().toISOString(), user: CM.db.cfg.operador, archivo: archivo, version: plan.version,
      reglas: Object.keys(plan.reglas).filter(function (k) { return plan.reglas[k]; }), resumen: plan.resumen,
      creados: { pacientes: [], lotes: [], movs: [], disp: [], aportes: [], seg: [], docs: [], users: [], docInst: [], recursos: [], arqueos: [], cultivos: [] }, campos: {}, ids: [], conflictos: [], deshecho: false };
    CM.db = db; // nextId usa CM.db: trabajamos sobre la copia
    try {
      function marca(id) { if (db.migra.ids[id]) throw new Error('Identificador repetido: ' + id); db.migra.ids[id] = lote.id; lote.ids.push(id); }
      plan.pacientes.forEach(function (p) {
        if (db.pacientes[p.key]) throw new Error('La clave ' + p.key + ' ya existe');
        db.pacientes[p.key] = { dni: p.key, leg: p.leg, legAnt: p.legAnt, doc: p.doc, nombre: p.nombre, nac: '', tel: '', email: '', dir: '', cp: '', obraSocial: '', ocupacion: '', motivo: p.motivo, dudas: '', codSeg: '',
          historiaCompleta: false, consentimiento: '', reprocann: { estado: 'sin', vence: null, carnet: false }, alta: p.alta, drive1: '', drive2: '', origen: p.origen,
          driveKey: p.leg, driveCarpeta: 'Legajo ' + p.leg + ' · ' + String(p.nombre).slice(0, 60), revisar: p.revisar || undefined, notasMig: p.notasMig, estadoAnt: p.estadoAnt, mig: lote.id };
        lote.creados.pacientes.push(p.key);
      });
      plan.enriquecer.forEach(function (e) {
        var p = db.pacientes[e.key]; if (!p) throw new Error('Paciente inexistente ' + e.key);
        Object.keys(e.campos).forEach(function (c) {
          var v = e.campos[c]; if (!v) return;
          if (!p[c]) { p[c] = v; if (p.mig !== lote.id) (lote.campos[e.key] = lote.campos[e.key] || {})[c] = v; }
          else if (String(p[c]) !== String(v)) lote.conflictos.push({ legajo: p.leg, campo: c, seConserva: 'el valor que ya tenía la ficha' });
        });
        if (!p.revisar && p.nombre && !p.historiaCompleta) { p.historiaCompleta = true; if (p.mig !== lote.id) (lote.campos[e.key] = lote.campos[e.key] || {}).historiaCompleta = true; }
        marca(e.sid);
      });
      if (plan.ciclo && !CM.cultivo(plan.ciclo.id)) {
        var c = JSON.parse(JSON.stringify(plan.ciclo)), fs = plan.disp.map(function (d) { return d.fecha; }).sort();
        c.inicio = fs[0] || CM.hoy(); c.creado = new Date().toISOString(); c.cierre = c.creado; c.mig = lote.id;
        db.cultivos.push(c); lote.creados.cultivos.push(c.id);
      }
      plan.lotes.forEach(function (l) {
        if (CM.lote(l.id)) throw new Error('El lote ' + l.id + ' ya existe');
        var x = { id: l.id, prod: l.prod, nombre: l.nombre, quim: l.quim, unidad: l.unidad, min: 0, ingreso: CM.hoy(), legacyId: l.legacyId, thc: l.thc, cbd: l.cbd, indic: l.indic, tipoAnt: l.tipoAnt, mig: lote.id };
        db.lotes.push(x); lote.creados.lotes.push(l.id); marca('LOT:' + l.legacyId);
      });
      plan.movs.forEach(function (m) {
        if (!CM.lote(m.lote)) throw new Error('Movimiento sin lote ' + m.lote);
        var id = CM.nextId('MV'); db.movs.push({ id: id, fecha: m.fecha, ts: m.ts, lote: m.lote, tipo: m.tipo, cant: m.cant, ref: m.ref, motivo: m.motivo, user: m.user, mig: lote.id });
        lote.creados.movs.push(id); marca(m.id);
      });
      var dispPorEnt = {}, apPorEnt = {};
      plan.disp.forEach(function (d) {
        if (!db.pacientes[d.key]) throw new Error('Dispensación sin paciente');
        if (!CM.lote(d.lote)) throw new Error('Dispensación sin lote ' + d.lote);
        if (!d.cu || !CM.cultivo(d.cu)) throw new Error('Dispensación sin ciclo de origen');
        var l = CM.lote(d.lote), id = CM.nextId('D');
        db.disp.push({ id: id, fecha: d.fecha, ts: d.ts, dni: d.key, lote: d.lote, prod: l.prod, nombre: l.nombre, quim: l.quim, unidad: l.unidad, cant: d.cant, indic: '', obs: 'Migración · entrega ' + d.entrega + ' · renglón ' + d.legacyId, user: d.user, aporte: '', anulada: null, cu: d.cu, cuHist: d.cuHist, mig: lote.id, migId: d.id });
        var mv = CM.nextId('MV'); db.movs.push({ id: mv, fecha: d.fecha, ts: d.ts, lote: d.lote, tipo: 'dispensacion', cant: -d.cant, ref: id, motivo: 'Migración', user: d.user, mig: lote.id });
        lote.creados.disp.push(id); lote.creados.movs.push(mv); marca(d.id);
        (dispPorEnt[d.entrega] = dispPorEnt[d.entrega] || []).push(id);
      });
      plan.aportes.forEach(function (a) {
        if (!db.pacientes[a.key]) throw new Error('Donación sin paciente');
        if (!(a.cent > 0)) throw new Error('Donación con importe no positivo');
        if (!CM.rubro(a.rubroId)) throw new Error('Rubro financiero inexistente ' + a.rubroId);
        var id = CM.nextId('A'), ds = dispPorEnt[a.entrega] || [];
        db.aportes.push({ id: id, fecha: a.fecha, ts: a.ts, dni: a.key, disp: ds[0] || '', cent: a.cent, medio: a.medio, concepto: a.concepto, rubroId: a.rubroId, obs: a.obs, user: a.user, estado: 'registrado', comp: '', servicioCent: a.servicio || 0, mig: lote.id, migId: a.id });
        (apPorEnt[a.entrega] = apPorEnt[a.entrega] || []).push(id);
        lote.creados.aportes.push(id); marca(a.id);
      });
      Object.keys(apPorEnt).forEach(function (e) { (dispPorEnt[e] || []).forEach(function (did) { db.disp.forEach(function (x) { if (x.id === did) x.aporte = apPorEnt[e][0]; }); }); });
      plan.entregas.forEach(function (id) { marca(id); });
      plan.seg.forEach(function (s) {
        if (!db.pacientes[s.key]) throw new Error('Seguimiento sin paciente');
        var id = CM.nextId('S'), o = JSON.parse(JSON.stringify(s)); o.id = id; o.dni = s.key; delete o.key; o.migId = s.id; o.mig = lote.id;
        db.seg.push(o); lote.creados.seg.push(id); marca(s.id);
      });
      plan.formResp.forEach(function (f) { if (f.tipo === 'F1' || !db.migra.ids[f.id]) { /* F1 ya se marcó en enriquecer; F2 se marcó con el seguimiento */ } });
      plan.docs.forEach(function (d) {
        if (!db.pacientes[d.key]) throw new Error('Documento sin paciente');
        var o = JSON.parse(JSON.stringify(d)); o.dni = d.key; delete o.key; o.mig = lote.id; db.legDocs.push(o); lote.creados.docs.push(o.id); marca(d.id);
      });
      plan.users.forEach(function (u) {
        var id = 'U-M' + String((db.users || []).length + 1).padStart(3, '0');
        (db.users = db.users || []).push({ id: id, nombre: u.nombre, correo: u.correo, rol: u.rol, activo: false, invitar: true, mig: lote.id });
        lote.creados.users.push(id);
      });
      ['docInst', 'recursos'].forEach(function (k) { plan[k].forEach(function (x) { var o = JSON.parse(JSON.stringify(x)); o.mig = lote.id; db[k].push(o); lote.creados[k].push(o.id); marca(x.id); }); });
      plan.arqueos.forEach(function (x) { var o = JSON.parse(JSON.stringify(x)); o.mig = lote.id; db.arqueosHist.push(o); lote.creados.arqueos.push(o.id); marca(x.id); });

      /* invariantes antes de confirmar */
      var nd = db.disp.filter(function (d) { return d.mig === lote.id; }).length, na = db.aportes.filter(function (d) { return d.mig === lote.id; }).length;
      if (nd !== plan.disp.length || na !== plan.aportes.length) throw new Error('Los totales no cierran');
      var suma = db.aportes.filter(function (d) { return d.mig === lote.id; }).reduce(function (s, a) { return s + a.cent; }, 0);
      if (suma !== plan.resumen.donadoCent) throw new Error('El importe donado no cierra');
      db.migra.lotes.push(lote);
      CM.audit('Migración del sistema anterior', lote.id + ' · ' + archivo + ' · ' + plan.resumen.pacientes + ' legajos nuevos · ' + plan.resumen.dispensaciones + ' dispensaciones · ' + plan.resumen.donaciones + ' donaciones (' + money(plan.resumen.donadoCent) + ') · reglas: ' + (lote.reglas.length ? lote.reglas.join(', ') : 'ninguna (modo estricto)'));
      /* guardar y comprobar que quedó escrito (el navegador puede no tener lugar) */
      var txtDb = JSON.stringify(db);
      try { g.localStorage.setItem('cmv2_db_v2', txtDb); if ((g.localStorage.getItem('cmv2_db_v2') || '').length !== txtDb.length) throw new Error('x'); }
      catch (e) { throw new Error('El navegador no tiene lugar para guardar estos datos (' + Math.round(txtDb.length / 1048576) + ' MB). No se guardó nada: usá la migración desde la nube'); }
      CM.save();
      return { ok: true, lote: lote };
    } catch (err) {
      CM.db = prevDb; // nada cambió
      try { CM.save(); } catch (e2) { /* nada */ }
      return { ok: false, err: err.message || String(err) };
    }
  }
  CM.migraAplicar = aplicar; // para las pruebas

  /* ---------- DESHACER ---------- */
  function bloqueosDeshacer(l) {
    var db = CM.db, pac = {}, lot = {}, out = [];
    l.creados.pacientes.forEach(function (k) { pac[k] = 1; }); l.creados.lotes.forEach(function (k) { lot[k] = 1; });
    (function mirar(o, ruta, prof) { // cualquier registro posterior que apunte a un legajo o lote migrado bloquea
      if (!o || typeof o !== 'object' || prof > 4) return;
      if (Array.isArray(o)) { o.forEach(function (x, i) { if (x && typeof x === 'object' && !Array.isArray(x) && x.mig !== l.id && ((x.dni && pac[x.dni]) || (x.lote && lot[x.lote]) || (x.ins && lot[x.ins]))) out.push(ruta + ' ' + (x.id || ('#' + i))); else mirar(x, ruta, prof + 1); }); return; }
      Object.keys(o).forEach(function (k) { if (['pacientes', 'migra', 'audit', 'staff', 'users', 'fichadas', 'perms', 'imports', 'org', 'tareas'].indexOf(k) < 0) /* el personal también tiene «dni», pero no es un paciente */ mirar(o[k], ruta ? ruta + '.' + k : k, prof + 1); });
    })(db, '', 0);
    (db.cajas || []).forEach(function (c) { if (c.cierre && c.cierre.movs.some(function (m) { return l.creados.aportes.indexOf(m.ref) >= 0; })) out.push('la caja cerrada ' + c.id); });
    return out;
  }
  function deshacer(l) {
    var db = CM.db, b = bloqueosDeshacer(l);
    if (b.length) return { ok: false, err: 'No se puede deshacer: hay registros posteriores que usan datos migrados (' + b[0] + ')' + (b.length > 1 ? ' (y ' + (b.length - 1) + ' más)' : '') + '.' };
    var copia = JSON.parse(JSON.stringify(db));
    try {
      function fuera(arr) { return (arr || []).filter(function (x) { return x.mig !== l.id; }); }
      db.disp = fuera(db.disp); db.aportes = fuera(db.aportes); db.movs = fuera(db.movs); db.lotes = fuera(db.lotes); db.seg = fuera(db.seg);
      db.legDocs = fuera(db.legDocs); db.docInst = fuera(db.docInst); db.recursos = fuera(db.recursos); db.arqueosHist = fuera(db.arqueosHist); db.users = fuera(db.users); db.cultivos = fuera(db.cultivos);
      l.creados.pacientes.forEach(function (k) { delete db.pacientes[k]; });
      Object.keys(l.campos || {}).forEach(function (k) { // sólo se quita lo que puso la migración y nadie cambió después
        var p = db.pacientes[k]; if (!p) return;
        Object.keys(l.campos[k]).forEach(function (c) { if (p[c] === l.campos[k][c]) { if (c === 'historiaCompleta') p[c] = false; else p[c] = ''; } });
      });
      l.ids.forEach(function (id) { if (db.migra.ids[id] === l.id) delete db.migra.ids[id]; });
      l.deshecho = true; l.deshechoTs = new Date().toISOString();
      CM.audit('Migración deshecha', l.id + ' · ' + l.archivo); CM.save();
      return { ok: true };
    } catch (e) { CM.db = copia; return { ok: false, err: 'Falló al deshacer y se revirtió.' }; }
  }
  CM.migraDeshacer = deshacer;

  /* ---------- VISTA ---------- */
  function tabla(head, rows, vacio) {
    if (!rows.length) return '<div class="empty">' + esc(vacio) + '</div>';
    return '<div class="tw"><table><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function tile(n, l, cls) { return '<div class="card flat"><small class="hint">' + esc(l) + '</small><br><b style="font-size:22px"' + (cls ? ' class="' + cls + '"' : '') + '>' + esc(String(n)) + '</b></div>'; }
  VIEWS.migracion = function () {
    var mg = CM.mg, db = asegurar(CM.db), p = mg.plan, admin = CM.can('importexport', 'admin');
    var h = '<div class="page-h"><div><h1>Migración del sistema anterior</h1><p>Trae los datos de la planilla «CANNABISMATICA» (AppSheet / Google Sheets): legajos, formularios, documentos, genéticas, movimientos de stock, entregas y su detalle, usuarios y recursos. ' +
      'El archivo se lee en este navegador y no se envía a ningún servidor.</p></div></div>';
    if (!admin) return h + '<div class="note warn">Sólo un administrador puede migrar datos.</div>';
    h += '<section class="card"><h2>1 · Archivo</h2><ol style="color:var(--mu);margin:6px 0 12px;padding-left:20px"><li>Abrí la planilla en Google Sheets → <b>Archivo → Descargar → Microsoft Excel (.xlsx)</b>.</li><li>Elegí ese archivo acá. Se leen todas las pestañas.</li></ol>' +
      '<div class="row"><label class="btn pri" for="migFile" style="cursor:pointer">' + CM.icon('plus') + 'Elegir el archivo .xlsx</label><input type="file" id="migFile" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr">' +
      (mg.archivo ? '<span class="pill p-info">' + esc(mg.archivo) + ' · ' + Object.keys(mg.libro || {}).length + ' pestañas</span>' : '') + '</div>' +
      (mg.leyendo ? '<p class="hint">Leyendo el archivo…</p>' : '') + (mg.msg ? '<div class="note bad" role="alert" style="margin-top:10px">' + esc(mg.msg) + '</div>' : '') + '</section>';
    if (p) {
      var r = p.resumen;
      h += '<section class="card" style="margin-top:14px"><h2>2 · Reglas de migración histórica</h2><p class="hint">Apagadas = modo estricto «todo o nada»: un solo error impide cargar. Cada regla que enciendas queda escrita en el lote y en la auditoría.</p>' +
        '<form data-form="mig-reglas" class="f">' + Object.keys(M.REGLAS).map(function (k) {
          return '<label class="chk" style="display:flex;gap:10px;align-items:flex-start;min-height:44px;padding:6px 0"><input type="checkbox" name="' + k + '"' + (mg.reglas[k] ? ' checked' : '') + ' style="width:22px;height:22px;flex:none"><span>' + esc(M.REGLAS[k]) + '</span></label>';
        }).join('') + '<div class="row"><button class="btn" type="submit">Volver a analizar con estas reglas</button></div></form></section>';
      h += '<section class="card" style="margin-top:14px"><div class="row sp"><h2>3 · Resultado del análisis</h2>' + (p.ok ? '<span class="pill p-ok">Listo para migrar</span>' : '<span class="pill p-bad">' + r.errores + ' error(es): no se puede migrar</span>') + '</div>' +
        '<div class="grid g4" style="margin:12px 0">' + tile(r.pacientes, 'Legajos nuevos') + tile(r.aRevisar, 'Legajos a revisar', r.aRevisar ? 'warn' : '') + tile(r.dispensaciones, 'Dispensaciones') + tile(r.donaciones + ' · ' + money(r.donadoCent), 'Donaciones') +
        tile(r.lotes + ' / ' + r.movimientos, 'Lotes / movimientos de stock') + tile(r.seguimientos, 'Seguimientos') + tile(r.documentos, 'Documentos del legajo') + tile(r.usuarios + ' · ' + (r.docInst + r.recursos), 'Usuarios · docs y recursos') + '</div>' +
        '<div class="row" role="tablist">' + [['errores', 'Errores (' + r.errores + ')'], ['revision', 'A revisión (' + r.revision + ')'], ['avisos', 'Avisos (' + r.avisos + ')'], ['stock', 'Control de stock'], ['omitidos', 'Omitidos (' + r.omitidos + ')']].map(function (t) {
          return '<button class="btn sm' + (mg.tab === t[0] ? ' pri' : '') + '" role="tab" aria-selected="' + (mg.tab === t[0]) + '" data-act="mig-tab" data-t="' + t[0] + '">' + esc(t[1]) + '</button>';
        }).join('') + '<button class="btn sm" data-act="mig-csv">' + CM.icon('dl') + 'Descargar informe (CSV)</button></div><div style="margin-top:10px">';
      var lim = function (a) { return a.slice(0, 300); };
      if (mg.tab === 'errores') h += tabla(['Pestaña', 'Fila', 'ID', 'Causa'], lim(p.errores).map(function (e) { return [e.hoja, e.fila || '—', e.id, e.causa]; }), 'Sin errores.');
      if (mg.tab === 'revision') h += tabla(['Pestaña', 'Fila', 'ID', 'Causa'], lim(p.revision).map(function (e) { return [e.hoja, e.fila || '—', e.id, e.causa]; }), 'Nada quedó en revisión.');
      if (mg.tab === 'avisos') h += tabla(['Pestaña', 'Fila', 'ID', 'Aviso'], lim(p.avisos).map(function (e) { return [e.hoja, e.fila || '—', e.id, e.causa]; }), 'Sin avisos.');
      if (mg.tab === 'stock') h += tabla(['Lote', 'Genética', 'Stock reconstruido', 'Columna Stock de la hoja', '¿Coincide?'], (p.controlStock || []).map(function (c) { return [c.lote, c.nombre, CM.fmtNum(c.reconstruido), c.hoja === null ? '—' : CM.fmtNum(c.hoja), c.coincide === null ? '—' : c.coincide ? 'Sí' : 'No']; }), 'Sin genéticas.');
      if (mg.tab === 'omitidos') h += tabla(['Pestaña', 'ID', 'Por qué'], lim(p.omitidos).map(function (e) { return [e.hoja, e.id, e.causa]; }), 'Nada omitido.');
      h += (p.errores.length > 300 || p.avisos.length > 300 ? '<p class="hint">Se muestran las primeras 300 filas; el CSV tiene todo.</p>' : '') + '</div>' +
        '<div class="row" style="margin-top:14px"><button class="btn" data-act="mig-probar">Probar (sin guardar)</button><button class="btn pri" data-act="mig-ok"' + (p.ok ? '' : ' disabled aria-disabled="true"') + '>Migrar todo</button></div>' +
        (mg.prueba ? '<div class="note info" role="status" style="margin-top:10px">' + esc(mg.prueba) + '</div>' : '') + '</section>';
    }
    var lotes = db.migra.lotes.slice().reverse();
    h += '<section class="card" style="margin-top:14px"><h2>Lotes migrados</h2>' + (lotes.length ? tabla(['Lote', 'Fecha', 'Archivo', 'Legajos', 'Dispensaciones', 'Donaciones', 'Reglas', 'Estado'], lotes.map(function (l) {
      return [l.id, CM.fmtFH(l.ts), l.archivo, l.resumen.pacientes, l.resumen.dispensaciones, l.resumen.donaciones + ' · ' + money(l.resumen.donadoCent), l.reglas.length ? l.reglas.join(', ') : 'estricto', l.deshecho ? 'Deshecho' : 'Aplicado'];
    }), '') + (lotes[0] && !lotes[0].deshecho ? '<div class="row" style="margin-top:12px"><button class="btn bad" data-act="mig-deshacer">Deshacer el último lote</button></div>' : '') +
      (lotes[0] && lotes[0].conflictos && lotes[0].conflictos.length ? '<p class="hint">' + lotes[0].conflictos.length + ' dato(s) del formulario no se copiaron porque la ficha ya tenía otro valor (se conserva el de la ficha).</p>' : '') : '<div class="empty">Todavía no se migró nada.</div>') + '</section>';
    var rev = Object.keys(db.pacientes).map(function (k) { return db.pacientes[k]; }).filter(function (x) { return x.revisar && x.mig; });
    if (rev.length) h += '<section class="card" style="margin-top:14px"><h2>Legajos migrados para revisar (' + rev.length + ')</h2><div class="tw"><table><thead><tr><th>Legajo</th><th>Legajo anterior</th><th>Nombre</th><th>Qué revisar</th></tr></thead><tbody>' +
      rev.slice(0, 200).map(function (x) { return '<tr><td><a href="#/paciente/' + encodeURIComponent(x.dni) + '">' + esc(x.leg) + '</a></td><td>' + esc(x.legAnt || '—') + '</td><td>' + esc(x.nombre) + '</td><td>' + esc((x.notasMig || []).join('; ')) + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
    if (db.docInst.length || db.recursos.length) h += '<section class="card" style="margin-top:14px"><h2>Documentación institucional y recursos</h2><ul>' + db.docInst.concat(db.recursos).map(function (x) {
      return '<li>' + (x.url ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer">' + esc(x.nombre || x.legacyId) + '</a>' : esc(x.nombre)) + (x.cat ? ' <span class="pill p-mu">' + esc(x.cat) + '</span>' : '') + '</li>';
    }).join('') + '</ul></section>';
    return h;
  };

  /* documentos del sistema anterior en la ficha del paciente */
  var vPac0 = VIEWS.paciente;
  VIEWS.paciente = function (r) {
    var out = vPac0(r), p = CM.paciente(r.a); if (!p) return out;
    var docs = (CM.db.legDocs || []).filter(function (d) { return d.dni === p.dni; });
    var extra = '';
    if (p.revisar && p.mig) extra += '<div class="note warn" style="margin-top:14px"><b>Legajo migrado para revisar:</b> ' + esc((p.notasMig || []).join('; ') || 'datos incompletos') + (p.legAnt ? ' · legajo anterior ' + esc(p.legAnt) : '') + '</div>';
    if (docs.length) extra += '<section class="card" style="margin-top:14px"><h3 style="margin-top:0">Documentos del sistema anterior (' + docs.length + ')</h3><p class="hint">Están en la carpeta de AppSheet del Drive de la ONG. «Buscar en Drive» abre la búsqueda por su identificador (necesita la sesión de Google de la ONG).</p>' +
      '<div class="tw"><table><thead><tr><th>Fecha</th><th>Documento</th><th>Tipo</th><th>Estado</th><th></th></tr></thead><tbody>' + docs.map(function (d) {
        return '<tr><td>' + esc(CM.fmtFecha(d.fecha)) + '</td><td>' + esc(d.nombre) + '<br><small class="hint">' + esc(d.ruta) + '</small></td><td>' + esc(d.tipo || d.ext || '—') + '</td><td>' + (d.driveFileId ? '<span class="pill p-ok">Vinculado</span>' : '<span class="pill p-warn">Por vincular</span>') + '</td>' +
          '<td><a class="btn sm" target="_blank" rel="noopener noreferrer" href="https://drive.google.com/drive/search?q=' + encodeURIComponent(d.legacyId) + '">' + CM.icon('drive') + 'Buscar en Drive</a></td></tr>';
      }).join('') + '</tbody></table></div></section>';
    return out + extra;
  };

  /* ---------- acciones ---------- */
  document.addEventListener('change', function (ev) {
    if (ev.target.id !== 'migFile' || !ev.target.files[0]) return;
    if (!CM.need('importexport', 'admin')) { ev.target.value = ''; return; }
    var file = ev.target.files[0], mg = CM.mg; ev.target.value = '';
    mg.msg = ''; mg.plan = null; mg.libro = null; mg.archivo = '';
    if (file.size > 25 * 1024 * 1024) { mg.msg = 'El archivo supera los 25 MB.'; render(); return; }
    if (!/\.xlsx$/i.test(file.name)) { mg.msg = 'Elegí el archivo .xlsx descargado de Google Sheets (Archivo → Descargar → Microsoft Excel).'; render(); return; }
    mg.leyendo = true; render();
    var fr = new FileReader();
    fr.onload = function () {
      CM.leerXlsxLibro(fr.result).then(function (libro) {
        mg.leyendo = false; mg.libro = libro; mg.archivo = file.name; mg.tab = 'errores'; analizar();
        CM.audit('Migración: archivo analizado', file.name + ' · ' + Object.keys(libro).length + ' pestañas · ' + mg.plan.resumen.errores + ' errores');
        CM.save(); render();
      }, function (e) { mg.leyendo = false; mg.msg = 'No pude leer el archivo: ' + (e && e.message || 'formato desconocido') + '.'; render(); });
    };
    fr.onerror = function () { mg.leyendo = false; mg.msg = 'No pude leer el archivo.'; render(); };
    fr.readAsArrayBuffer(file);
  });
  CM.forms['mig-reglas'] = function (f) {
    var mg = CM.mg; mg.reglas = {};
    Object.keys(M.REGLAS).forEach(function (k) { mg.reglas[k] = !!f.elements[k].checked; });
    analizar(); render(); return false;
  };
  CM.acts['mig-tab'] = function (t) { CM.mg.tab = t.getAttribute('data-t'); render(); };
  CM.acts['mig-csv'] = function () {
    var p = CM.mg.plan; if (!p) return;
    var rows = [];
    p.errores.forEach(function (e) { rows.push(['Error', e.hoja, e.fila, e.id, e.causa]); });
    p.revision.forEach(function (e) { rows.push(['A revisión', e.hoja, e.fila, e.id, e.causa]); });
    p.avisos.forEach(function (e) { rows.push(['Aviso', e.hoja, e.fila, e.id, e.causa]); });
    p.omitidos.forEach(function (e) { rows.push(['Omitido', e.hoja, '', e.id, e.causa]); });
    CM.descargar('informe_migracion_' + CM.hoy() + '.csv', CM.csv(['Tipo', 'Pestaña', 'Fila', 'ID', 'Detalle'], rows));
  };
  CM.acts['mig-probar'] = function () {
    var mg = CM.mg; if (!mg.plan) return; analizar();
    var r = mg.plan.resumen;
    mg.prueba = 'Prueba sin guardar: se crearían ' + r.pacientes + ' legajos (' + r.aRevisar + ' a revisar), ' + r.dispensaciones + ' dispensaciones, ' + r.donaciones + ' donaciones por ' + money(r.donadoCent) + ', ' + r.movimientos + ' movimientos de stock, ' + r.seguimientos + ' seguimientos y ' + r.documentos + ' documentos. ' +
      (mg.plan.ok ? 'No hay errores.' : 'Hay ' + r.errores + ' error(es): así no se puede migrar.') + ' No se modificó nada.';
    render();
  };
  CM.acts['mig-ok'] = function () {
    var mg = CM.mg; if (!mg.plan || !CM.need('importexport', 'admin')) return;
    analizar(); if (!mg.plan.ok) { render(); CM.toast('Hay errores: no se migró nada.', true); return; }
    var r = mg.plan.resumen, rg = Object.keys(mg.plan.reglas).filter(function (k) { return mg.plan.reglas[k]; });
    CM.modal.open({ title: 'Confirmar la migración', body: '<p>Se van a cargar <b>' + r.pacientes + '</b> legajos, <b>' + r.dispensaciones + '</b> dispensaciones, <b>' + r.donaciones + '</b> donaciones (' + esc(money(r.donadoCent)) + '), ' + r.movimientos + ' movimientos de stock, ' + r.seguimientos + ' seguimientos y ' + r.documentos + ' documentos, en una sola operación.</p>' +
      '<p>Reglas encendidas: ' + (rg.length ? '<b>' + esc(rg.map(function (k) { return M.REGLAS[k]; }).join(' · ')) + '</b>' : 'ninguna (modo estricto)') + '.</p><p class="hint">Queda en la auditoría y se puede deshacer mientras nada nuevo dependa de lo migrado.</p>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" data-act="mig-ok2">Migrar</button>' });
  };
  CM.acts['mig-ok2'] = function () {
    var mg = CM.mg; if (!mg.plan || !mg.plan.ok || !CM.need('importexport', 'admin')) return;
    var res = aplicar(mg.plan, mg.archivo);
    CM.modal.close(true);
    if (!res.ok) { CM.toast('Falló la migración y se revirtió: no se modificó nada (' + res.err + ').', true); return; }
    analizar(); render(); CM.toast('Migración terminada: lote ' + res.lote.id + '.');
  };
  CM.acts['mig-deshacer'] = function () {
    var l = asegurar(CM.db).migra.lotes[CM.db.migra.lotes.length - 1]; if (!l || l.deshecho || !CM.need('importexport', 'admin')) return;
    CM.modal.open({ title: 'Deshacer ' + l.id, body: '<p>Se quitan todos los registros que trajo este lote y se restauran las fichas que había completado. ¿Seguimos?</p>', footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn bad" data-act="mig-deshacer2">Deshacer</button>' });
  };
  CM.acts['mig-deshacer2'] = function () {
    var l = CM.db.migra.lotes[CM.db.migra.lotes.length - 1]; CM.modal.close(true); if (!l) return;
    var r = deshacer(l); if (!r.ok) { CM.toast(r.err, true); return; }
    if (CM.mg.libro) analizar(); render(); CM.toast('Lote ' + l.id + ' deshecho.');
  };
})(window);
