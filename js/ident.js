/* Cannabismatica I+D · Sistema ONG · Identificación de personas
   - Legajo único (no se repite ni se pisa nunca) + clave interna independiente del documento.
   - Documento OPCIONAL: DNI, CUIT o CUIL (se puede omitir; si se carga se valida).
   - Búsqueda de paciente por nombre, legajo, DNI, CUIT o CUIL. */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc;
  var ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

  function rnd(n) {
    var a = new Uint32Array(n);
    if (g.crypto && g.crypto.getRandomValues) g.crypto.getRandomValues(a);
    else for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 4294967296);
    return a;
  }
  function usados(campo) {
    var m = {}, db = CM.db;
    Object.keys(db.pacientes).forEach(function (k) { if (db.pacientes[k][campo]) m[db.pacientes[k][campo]] = 1; });
    return m;
  }

  /* ---------- identificadores únicos ---------- */
  CM.nuevoLegajo = function () {
    var u = usados('leg'), t, id;
    for (t = 0; t < 60; t++) {
      var r = rnd(6), s = '';
      for (var i = 0; i < 6; i++) s += ABC.charAt(r[i] % ABC.length);
      id = 'L-' + CM.hoy().replace(/-/g, '').slice(2) + '-' + s;
      if (!u[id]) return id;
    }
    return 'L-' + Date.now().toString(36).toUpperCase() + '-' + rnd(1)[0].toString(36).toUpperCase().slice(0, 4);
  };
  /* Clave interna: 13 dígitos que empiezan con 88. Un DNI tiene hasta 9 y un CUIT 11, así que nunca chocan. */
  CM.claveNueva = function () {
    var db = CM.db, k, t;
    for (t = 0; t < 60; t++) {
      var r = rnd(2);
      k = '88' + String(r[0] % 1000000).padStart(6, '0') + String(r[1] % 100000).padStart(5, '0');
      if (!db.pacientes[k]) return k;
    }
    return '88' + String(Date.now()).slice(-11);
  };

  /* ---------- documento opcional ---------- */
  CM.TIPOS_DOC = { DNI: 'DNI', CUIT: 'CUIT', CUIL: 'CUIL' };
  function cuitOk(d) {
    if (d.length !== 11) return false;
    if (['20', '23', '24', '25', '26', '27', '30', '33', '34'].indexOf(d.slice(0, 2)) < 0) return false;
    var w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2], s = 0, i;
    for (i = 0; i < 10; i++) s += parseInt(d.charAt(i), 10) * w[i];
    var v = 11 - (s % 11); if (v === 11) v = 0; else if (v === 10) v = 9;
    return v === parseInt(d.charAt(10), 10);
  }
  CM.cuitValido = cuitOk;
  /* Devuelve { ok, vacio, doc:{tipo,num}, err }. Si no se carga número, no hay error: el documento es opcional. */
  CM.validarDoc = function (tipo, num) {
    var d = CM.soloDigitos(num);
    if (!d) return { ok: true, vacio: true, doc: null };
    if (!tipo) tipo = d.length === 11 ? 'CUIT' : 'DNI';
    if (tipo === 'DNI') {
      if (d.length < 6 || d.length > 9) return { ok: false, err: 'El DNI debe tener entre 6 y 9 números, sin puntos. Si no lo tenés, dejalo vacío.' };
    } else if (tipo === 'CUIT' || tipo === 'CUIL') {
      if (!cuitOk(d)) return { ok: false, err: 'El ' + tipo + ' no es válido (11 números, con su dígito verificador). Si no lo tenés, dejalo vacío.' };
    } else return { ok: false, err: 'Elegí DNI, CUIT o CUIL.' };
    return { ok: true, doc: { tipo: tipo, num: d } };
  };
  CM.fmtDoc = function (doc) {
    if (!doc || !doc.num) return '';
    var n = doc.num;
    if (doc.tipo !== 'DNI' && n.length === 11) n = n.slice(0, 2) + '-' + n.slice(2, 10) + '-' + n.slice(10);
    return doc.tipo + ' ' + n;
  };
  /* Documento de un paciente (compatible con fichas viejas, donde la clave era el DNI). */
  CM.docPac = function (p) {
    if (!p) return null;
    if (p.doc && p.doc.num) return p.doc;
    if (/^\d{6,9}$/.test(String(p.dni))) return { tipo: 'DNI', num: String(p.dni) };
    return null;
  };
  /* Texto para pantallas: "DNI 123 · Legajo L-…" o "Sin documento · Legajo L-…" */
  CM.idTxt = function (p) {
    if (!p) return '';
    var d = CM.docPac(p);
    return (d ? CM.fmtDoc(d) : 'Sin documento') + (p.leg ? ' · Legajo ' + p.leg : '');
  };
  CM.docCorto = function (p) { var d = CM.docPac(p); return d ? CM.fmtDoc(d) : (p && p.leg ? 'Legajo ' + p.leg : 'Sin documento'); };

  /* HTML de los dos campos (los dos opcionales) */
  CM.docCampos = function (v) {
    v = v || {};
    var U = CM.U, fl = U.fl, opt = U.opt;
    return '<div class="f f2">' + fl('Tipo de documento (opcional)', '<select class="in" name="tdoc">' + opt('', 'Sin documento', !v.tipo) + opt('DNI', 'DNI', v.tipo === 'DNI') + opt('CUIT', 'CUIT', v.tipo === 'CUIT') + opt('CUIL', 'CUIL', v.tipo === 'CUIL') + '</select>') +
      fl('Número (opcional, sin puntos ni guiones)', '<input class="in" name="ndoc" inputmode="numeric" maxlength="13" autocomplete="off" value="' + esc(v.num || '') + '">') + '</div>';
  };

  /* ---------- búsqueda de pacientes ---------- */
  function norm(s) { return CM.norm ? CM.norm(s) : String(s || '').toLowerCase(); }
  /* Todos los pacientes que coinciden con el texto (nombre, legajo, DNI, CUIT, CUIL o clave). */
  CM.buscarPacs = function (q) {
    q = String(q || '').trim();
    if (!q) return [];
    var db = CM.db.pacientes, d = CM.soloDigitos(q), out = [], nq = norm(q), uq = q.toUpperCase();
    var soloNum = /^[\d.\-\s]+$/.test(q);
    Object.keys(db).forEach(function (k) {
      var p = db[k], dc = CM.docPac(p), hit = false;
      if (soloNum) { if (d.length >= 2 && (k.indexOf(d) === 0 || (dc && dc.num.indexOf(d) === 0))) hit = true; }
      else if (/^L-/i.test(q)) { if (p.leg && p.leg.indexOf(uq) === 0) hit = true; }
      else if (norm(p.nombre).indexOf(nq) > -1 || (p.leg && p.leg.toUpperCase() === uq)) hit = true;
      if (hit) out.push(p);
    });
    return out;
  };
  /* Un solo paciente, o null si no hay coincidencia exacta/única. */
  CM.resolverPac = function (q) {
    q = String(q || '').trim();
    if (!q) return null;
    var db = CM.db.pacientes, d = CM.soloDigitos(q);
    if (db[q]) return db[q];
    if (d && db[d] && /^[\d.\-\s]+$/.test(q)) return db[d];
    var k = Object.keys(db), i, hits = [];
    if (/^[\d.\-\s]+$/.test(q) && d.length >= 6) {
      for (i = 0; i < k.length; i++) { var dc = CM.docPac(db[k[i]]); if (dc && dc.num === d) hits.push(db[k[i]]); }
      return hits.length === 1 ? hits[0] : null;
    }
    if (/^L-/i.test(q)) { for (i = 0; i < k.length; i++) if (db[k[i]].leg && db[k[i]].leg.toUpperCase() === q.toUpperCase()) return db[k[i]]; return null; }
    var r = CM.buscarPacs(q);
    return r.length === 1 ? r[0] : null;
  };

  /* ---------- alta de paciente: siempre registro nuevo y único ---------- */
  /* o: { nombre, tel, doc:{tipo,num}|null, origen, ...otros campos de la ficha }.
     La clave interna es el DNI sólo si es nuevo; si no (sin documento, CUIT/CUIL o DNI repetido) se genera una clave única.
     Nunca pisa una ficha existente: un documento repetido queda marcado como "posible duplicado" para revisar. */
  CM.nuevoPaciente = function (o) {
    var db = CM.db, doc = o.doc && o.doc.num ? o.doc : null, key, dup = '';
    if (doc) Object.keys(db.pacientes).forEach(function (k) { var dc = CM.docPac(db.pacientes[k]); if (!dup && dc && dc.num === doc.num) dup = k; });
    if (doc && doc.tipo === 'DNI' && !db.pacientes[doc.num]) key = doc.num; else key = CM.claveNueva();
    var leg = CM.nuevoLegajo();
    var p = {
      dni: key, leg: leg, doc: doc, nombre: o.nombre, nac: o.nac || '', tel: o.tel || '', email: o.email || '', dir: o.dir || '', cp: o.cp || '', obraSocial: o.obraSocial || '',
      ocupacion: o.ocupacion || '', motivo: o.motivo || '', dudas: o.dudas || '', codSeg: '', historiaCompleta: !!o.historiaCompleta, consentimiento: o.consentimiento || '',
      reprocann: o.reprocann || { estado: 'sin', vence: null, carnet: false }, alta: CM.hoy(), drive1: '', drive2: '',
      origen: o.origen || 'sistema', driveKey: leg, driveCarpeta: 'Legajo ' + leg + ' · ' + String(o.nombre || '').slice(0, 60)
    };
    if (o.tutor) p.tutor = o.tutor;
    if (dup) p.posibleDup = dup;
    if (o.revisar) p.revisar = true;
    db.pacientes[key] = p;
    return p;
  };

  /* ---------- migración de datos guardados ---------- */
  var init0 = CM.init;
  CM.init = function () {
    init0();
    var db = CM.db, ch = false;
    Object.keys(db.pacientes).forEach(function (k) {
      var p = db.pacientes[k];
      if (!p.leg) { p.leg = CM.nuevoLegajo(); ch = true; }
      if (p.doc === undefined) { p.doc = /^\d{6,9}$/.test(k) ? { tipo: 'DNI', num: k } : null; ch = true; }
      if (!p.driveKey) { p.driveKey = p.leg; p.driveCarpeta = 'Legajo ' + p.leg + ' · ' + String(p.nombre || '').slice(0, 60); ch = true; }
    });
    if (db.menu && !db.menu.turnos) { db.menu.turnos = []; ch = true; }
    if (db.menu && !db.menu.hcs) { db.menu.hcs = []; ch = true; }
    if (ch) CM.save();
  };
})(window);
(function (g) { g.CM.legDe = function (dni) { var p = g.CM.paciente(dni); return p && p.leg ? p.leg : String(dni || ''); }; })(window);
