/* Sistema VB ONG · Proveedores, insumos y compras (SISTEMA_VB_ONGF 4.27.5)
   Órdenes de compra, ingreso de mercadería ATÓMICO (stock + costo + cuenta corriente + egreso de caja en una sola operación),
   cuenta corriente del proveedor de sólo-agregar (saldo = suma del libro) e insumos con stock por movimientos.
   Vocabulario de la ONG: «compra de insumos» es un gasto de la ONG, no una operación con pacientes. */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, fl = U.fl, opt = U.opt, fail = U.fail, VIEWS = CM.VIEWS;
  var render = function () { CM.render(); };
  var money = function (c) { return CM.fmtMoney(c); };

  /* ---------- permisos y navegación ---------- */
  if (!CM.MODS.some(function (m) { return m[0] === 'proveedores'; })) CM.MODS.splice(10, 0, ['proveedores', 'Proveedores e insumos']);
  var pd0 = CM.permsDefault;
  CM.permsDefault = function () {
    var p = pd0(); p.admin.proveedores = 'admin'; p.supervisor.proveedores = 'edit'; p.mostrador.proveedores = ''; p.operador.proveedores = ''; return p;
  };
  (function () {
    var i = -1; CM.NAV.forEach(function (n, k) { if (n[0] === 'inventario') i = k; });
    CM.NAV.splice(i + 1, 0, ['proveedores', 'Proveedores e insumos', 'clip', 'proveedores']);
  })();
  CM.TITULOS.proveedores = 'Proveedores e insumos';
  CM.pv = CM.pv || { tab: 'prov', prov: '' };

  /* ---------- datos ---------- */
  function cuit(s) { return CM.soloDigitos(s); }
  CM.provSaldo = function (id) { var s = 0; (CM.db.ccprov || []).forEach(function (m) { if (m.prov === id) s += m.cent; }); return s; };
  CM.insStock = function (id) { var s = 0; (CM.db.insMovs || []).forEach(function (m) { if (m.ins === id) s += m.cant; }); return Math.round(s * 100) / 100; };
  function prov(id) { return (CM.db.provs || []).filter(function (p) { return p.id === id; })[0] || null; }
  function ins(id) { return (CM.db.ins || []).filter(function (p) { return p.id === id; })[0] || null; }
  function orden(id) { return (CM.db.ordenes || []).filter(function (p) { return p.id === id; })[0] || null; }

  var init0 = CM.init;
  CM.init = function () {
    init0();
    var db = CM.db, ch = false;
    if (!db.provs) {
      db.provs = []; db.ins = []; db.insMovs = []; db.ordenes = []; db.recs = []; db.ccprov = []; ch = true;
      if (db.lotes && db.lotes.length) {
        db.provs.push({ id: 'PV-000001', nombre: 'Vivero y sustratos del Norte (ejemplo)', cuit: '', tel: '3875000100', mail: '', notas: 'Proveedor de ejemplo', activo: true });
        db.provs.push({ id: 'PV-000002', nombre: 'Envases y etiquetas Salta (ejemplo)', cuit: '', tel: '3875000200', mail: '', notas: 'Proveedor de ejemplo', activo: true });
        db.counters.PV = 2;
        [['IN-000001', 'Sustrato universal', 'kg', 20, 150000], ['IN-000002', 'Nutrientes base', 'lt', 5, 800000], ['IN-000003', 'Frascos de 30 ml', 'u', 50, 45000], ['IN-000004', 'Etiquetas adhesivas', 'u', 100, 6000]].forEach(function (x, i) {
          db.ins.push({ id: x[0], nombre: x[1] + ' (ejemplo)', unidad: x[2], min: x[3], costo: x[4], activo: true });
          db.insMovs.push({ id: 'IM-EJ' + (i + 1), ins: x[0], cant: x[3] * 3, tipo: 'saldo inicial', ref: '', motivo: 'Saldo inicial de la demo', ts: CM.hoy() + 'T12:00:00.000Z', user: 'Ejemplo' });
        });
        db.counters.IN = 4;
      }
    }
    if (db.perms) Object.keys(db.perms).forEach(function (r) { if (db.perms[r].proveedores === undefined) { db.perms[r].proveedores = CM.permsDefault()[r] ? CM.permsDefault()[r].proveedores : ''; ch = true; } });
    if (ch) CM.save();
  };

  /* ---------- LIBRO DE CUENTA CORRIENTE (sólo agregar) ---------- */
  function asentar(o) {
    var saldo = CM.provSaldo(o.prov) + o.cent;
    var m = { id: CM.nextId('CC'), prov: o.prov, tipo: o.tipo, cent: o.cent, saldo: saldo, ref: o.ref || '', medio: o.medio || '', rubro: o.rubro || '', motivo: o.motivo || '', ts: new Date().toISOString(), user: CM.db.cfg.operador };
    CM.db.ccprov.push(m);
    return m;
  }

  /* ---------- INGRESO DE MERCADERÍA ATÓMICO ---------- */
  function sumaItems(items) { return items.reduce(function (s, x) { return s + Math.round(x.cant * x.costo); }, 0); }
  /* o: { idem, prov, orden, tipoComp, nroComp, fecha, cond:'cc'|'contado', rubro, totalDecl, items:[{ins,cant,costo}] } */
  CM.procesarRecepcion = function (o) {
    var db = CM.db;
    if (o.idem && db.recs.some(function (r) { return r.idem === o.idem; })) return { err: 'Esta recepción ya fue registrada (se ignora el reenvío).', dup: true };
    var p = prov(o.prov); if (!p || p.activo === false) return { err: 'Elegí un proveedor válido.' };
    if (['Factura', 'Remito'].indexOf(o.tipoComp) < 0) return { err: 'Elegí el tipo de comprobante.' };
    var nro = String(o.nroComp || '').trim(); if (nro.length < 3) return { err: 'Escribí el número del comprobante.' };
    var nk = CM.norm(nro);
    if (db.recs.some(function (r) { return r.prov === o.prov && r.tipoComp === o.tipoComp && CM.norm(r.nroComp) === nk; })) return { err: 'Ya hay una recepción de este proveedor con el mismo ' + o.tipoComp + ' y número.' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.fecha || '') || o.fecha > CM.hoy() || CM.diffDays(o.fecha, CM.hoy()) > 365) return { err: 'La fecha de recepción no es razonable (no puede ser futura ni de hace más de un año).' };
    var items = (o.items || []).filter(function (x) { return x && x.ins; });
    if (!items.length) return { err: 'Cargá al menos un renglón.' };
    var seen = {}, i;
    for (i = 0; i < items.length; i++) {
      var x = items[i], it = ins(x.ins);
      if (!it) return { err: 'Hay un insumo que no existe.' };
      if (seen[x.ins]) return { err: 'El insumo «' + it.nombre + '» está repetido: sumá las cantidades en un solo renglón.' };
      seen[x.ins] = 1;
      if (!(x.cant > 0)) return { err: 'La cantidad de «' + it.nombre + '» tiene que ser mayor que cero.' };
      if (it.unidad === 'u' && Math.round(x.cant) !== x.cant) return { err: '«' + it.nombre + '» se recibe en unidades enteras.' };
      if (isNaN(x.costo) || x.costo < 0) return { err: 'El costo de «' + it.nombre + '» no es válido (0 = bonificación).' };
    }
    var ord = null;
    if (o.orden) {
      ord = orden(o.orden);
      if (!ord || ord.prov !== o.prov || ord.estado !== 'Solicitada') return { err: 'La orden elegida no está pendiente o es de otro proveedor.' };
      for (i = 0; i < items.length; i++) if (!ord.items.some(function (y) { return y.ins === items[i].ins; })) return { err: 'Hay un insumo que no pertenece a la orden elegida.' };
    }
    var total = sumaItems(items);
    if (o.totalDecl != null && o.totalDecl !== total) return { err: 'El total declarado (' + money(o.totalDecl) + ') no coincide con la suma de los renglones (' + money(total) + ').' };
    var rub = CM.rubro(o.rubro); if (!rub || rub.activo === false || (rub.tipo !== 'egreso' && rub.tipo !== 'ambos')) return { err: 'Elegí un rubro financiero válido para el egreso: es obligatorio.' };
    var caja = null;
    if (o.cond === 'contado') {
      caja = CM.cajaAbierta();
      if (!caja) return { err: 'Para pagar de contado en efectivo hace falta una caja abierta.' };
    } else if (o.cond !== 'cc') return { err: 'Elegí la condición: cuenta corriente o contado.' };

    /* — todo validado: se aplica como una sola operación; si algo falla, se revierte todo — */
    var snap = { ccprov: db.ccprov.length, insMovs: db.insMovs.length, recs: db.recs.length, cmovs: db.cmovs.length, counters: JSON.stringify(db.counters), ins: JSON.stringify(db.ins), ord: ord ? ord.estado : '', audit: db.audit.length };
    try {
      var id = CM.nextId('RC'), difs = [];
      items.forEach(function (x) {
        var it = ins(x.ins), antes = CM.insStock(x.ins), cantes = it.costo || 0;
        db.insMovs.push({ id: CM.nextId('IM'), ins: x.ins, cant: x.cant, tipo: 'ingreso', ref: id, motivo: o.tipoComp + ' ' + nro, ts: new Date().toISOString(), user: db.cfg.operador });
        if (x.costo > 0) it.costo = x.costo;               /* costo 0 = bonificación: no pisa el vigente */
        x.antes = antes; x.despues = Math.round((antes + x.cant) * 100) / 100; x.costoAntes = cantes;
      });
      if (ord) {
        ord.items.forEach(function (y) { var r = items.filter(function (x) { return x.ins === y.ins; })[0]; if (!r || r.cant !== y.cant) difs.push({ ins: y.ins, pedido: y.cant, recibido: r ? r.cant : 0 }); else if (r.costo !== y.costo) difs.push({ ins: y.ins, pactado: y.costo, facturado: r.costo }); });
        ord.estado = 'Recibida'; ord.recibida = id;
      }
      asentar({ prov: o.prov, tipo: o.tipoComp, cent: total, ref: id, rubro: rub.n });
      var movCaja = null;
      if (o.cond === 'contado') {
        asentar({ prov: o.prov, tipo: 'Pago', cent: -total, ref: id, medio: 'efectivo', rubro: rub.n, motivo: 'Pago de contado' });
        var r = CM.addCMov({ tipo: 'egreso', cent: total, rubroId: rub.id, motivo: 'Compra de insumos · ' + p.nombre + ' · ' + o.tipoComp + ' ' + nro });
        if (r.err) throw new Error(r.err);
        r.ok.ref = id; movCaja = r.ok.id;
      }
      db.recs.push({ id: id, idem: o.idem || '', prov: o.prov, orden: o.orden || '', tipoComp: o.tipoComp, nroComp: nro, fecha: o.fecha, cond: o.cond, total: total, rubro: rub.n, caja: caja ? caja.id : '', movCaja: movCaja,
        items: items.map(function (x) { return { ins: x.ins, cant: x.cant, costo: x.costo, antes: x.antes, despues: x.despues, costoAntes: x.costoAntes }; }), difs: difs, user: db.cfg.operador, ts: new Date().toISOString() });
      CM.audit('Ingreso de mercadería', id + ' · ' + p.nombre + ' · ' + o.tipoComp + ' ' + nro + ' · ' + money(total) + ' · ' + (o.cond === 'contado' ? 'contado' : 'cuenta corriente'));
      return { ok: db.recs[db.recs.length - 1] };
    } catch (e) {
      db.ccprov.length = snap.ccprov; db.insMovs.length = snap.insMovs; db.recs.length = snap.recs; db.cmovs.length = snap.cmovs; db.audit.length = snap.audit;
      db.counters = JSON.parse(snap.counters); db.ins = JSON.parse(snap.ins); if (ord) { ord.estado = snap.ord; delete ord.recibida; }
      return { err: 'No se pudo registrar: ' + e.message + ' (no se guardó nada).' };
    }
  };

  /* ---------- PAGO A PROVEEDOR ---------- */
  CM.pagarProveedor = function (o) {
    var p = prov(o.prov); if (!p) return { err: 'Elegí un proveedor.' };
    if (!(o.cent > 0)) return { err: 'El importe tiene que ser mayor que cero.' };
    var saldo = CM.provSaldo(o.prov);
    if (o.cent > saldo) return { err: 'El pago (' + money(o.cent) + ') supera la deuda actual (' + money(saldo) + ').' };
    var rub = CM.rubro(o.rubro); if (!rub || (rub.tipo !== 'egreso' && rub.tipo !== 'ambos')) return { err: 'Elegí un rubro financiero válido: es obligatorio.' };
    var db = CM.db, n0 = db.ccprov.length, c0 = db.cmovs.length, cn = JSON.stringify(db.counters);
    var mov = null;
    if (o.medio === 'efectivo') {
      var r = CM.addCMov({ tipo: 'egreso', cent: o.cent, rubroId: rub.id, motivo: 'Pago a proveedor · ' + p.nombre + (o.motivo ? ' · ' + o.motivo : '') });
      if (r.err) return { err: r.err };
      mov = r.ok;
    }
    var m = asentar({ prov: o.prov, tipo: 'Pago', cent: -o.cent, medio: o.medio, rubro: rub.n, motivo: o.motivo || '', ref: mov ? mov.id : '' });
    if (mov) mov.ref = m.id;
    CM.audit('Pago a proveedor', p.nombre + ' · ' + money(o.cent) + ' · ' + o.medio + ' · saldo ' + money(m.saldo));
    void n0; void c0; void cn;
    return { ok: m };
  };

  /* ---------- PANTALLA ---------- */
  function pageH(t, p, extra) { return '<div class="page-h"><div><h1>' + esc(t) + '</h1><p>' + p + '</p></div>' + (extra || '') + '</div>'; }
  function tabsH(cur) {
    var T = [['prov', 'Proveedores'], ['oc', 'Órdenes de compra'], ['rec', 'Ingresos de mercadería'], ['ins', 'Insumos'], ['cc', 'Cuenta corriente']];
    return '<div class="tabs" role="group" aria-label="Secciones de proveedores">' + T.map(function (t) { return '<button type="button" data-act="pv-tab" data-v="' + t[0] + '" aria-pressed="' + (cur === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
  }
  CM.acts['pv-tab'] = function (t) { CM.pv.tab = t.getAttribute('data-v'); render(); };
  CM.acts['pv-sel'] = function (t) { CM.pv.prov = t.getAttribute('data-id'); CM.pv.tab = 'cc'; render(); };
  function provOpts(sel) { return '<option value="">Elegí un proveedor…</option>' + CM.db.provs.filter(function (p) { return p.activo !== false; }).map(function (p) { return opt(p.id, p.nombre, p.id === sel); }).join(''); }
  function insOpts(sel) { return '<option value="">Insumo…</option>' + CM.db.ins.filter(function (p) { return p.activo !== false; }).map(function (p) { return opt(p.id, p.nombre + ' (' + p.unidad + ')', p.id === sel); }).join(''); }
  function rubOpts(sel) { return '<option value="">Elegí un rubro…</option>' + CM.rubrosPara('egreso').map(function (r) { return opt(r.id, r.n, r.id === sel); }).join(''); }

  VIEWS.proveedores = function () {
    var db = CM.db, t = CM.pv.tab, h = '';
    var head = pageH('Proveedores e insumos', 'Compras de insumos de la ONG: órdenes, <b>ingreso de mercadería atómico</b> (stock, costo, deuda y caja en una sola operación) y cuenta corriente del proveedor. El libro de cuenta corriente <b>sólo se agrega</b>: una corrección es un movimiento nuevo.');
    if (t === 'prov') {
      h = '<section class="card"><div class="row sp"><h2>Proveedores</h2><button class="btn pri" data-act="pv-nuevo">' + CM.icon('plus') + 'Nuevo proveedor</button></div>' + (db.provs.length ? '<div class="tw"><table><thead><tr><th>Proveedor</th><th>CUIT</th><th>Contacto</th><th class="n">Deuda</th><th></th></tr></thead><tbody>' + db.provs.map(function (p) {
        var s = CM.provSaldo(p.id);
        return '<tr><td><b>' + esc(p.nombre) + '</b></td><td>' + esc(p.cuit ? p.cuit : '—') + '</td><td>' + esc(p.tel || '') + (p.mail ? '<br><small class="hint">' + esc(p.mail) + '</small>' : '') + '</td><td class="n">' + esc(money(s)) + '</td><td><button class="btn sm" data-act="pv-sel" data-id="' + esc(p.id) + '">Cuenta corriente</button></td></tr>';
      }).join('') + '</tbody></table></div>' : U.tablaVacia('Todavía no hay proveedores.')) + '</section>';
    } else if (t === 'oc') {
      h = '<section class="card"><div class="row sp"><h2>Órdenes de compra</h2><button class="btn pri" data-act="oc-nueva">' + CM.icon('plus') + 'Nueva orden</button></div>' + (db.ordenes.length ? '<div class="tw"><table><thead><tr><th>N.º</th><th>Fecha</th><th>Proveedor</th><th>Renglones</th><th class="n">Total</th><th>Estado</th><th></th></tr></thead><tbody>' + db.ordenes.slice().reverse().map(function (o) {
        var p = prov(o.prov);
        return '<tr><td>' + esc(o.id) + '</td><td>' + esc(CM.fmtFecha(o.fecha)) + '</td><td>' + esc(p ? p.nombre : '') + '</td><td>' + o.items.map(function (x) { var it = ins(x.ins); return esc((it ? it.nombre : x.ins) + ' × ' + CM.fmtNum(x.cant)); }).join('<br>') + '</td><td class="n">' + esc(money(sumaItems(o.items))) + '</td><td><span class="pill ' + (o.estado === 'Solicitada' ? 'p-warn' : (o.estado === 'Recibida' ? 'p-ok' : 'p-mu')) + '">' + esc(o.estado) + '</span></td><td>' +
          (o.estado === 'Solicitada' ? '<button class="btn sm" data-act="rec-nueva" data-orden="' + esc(o.id) + '">Recibir</button> <button class="btn sm" data-act="oc-cancelar" data-id="' + esc(o.id) + '">Cancelar</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : U.tablaVacia('Todavía no hay órdenes.')) + '</section>';
    } else if (t === 'rec') {
      h = '<section class="card"><div class="row sp"><h2>Ingresos de mercadería</h2><button class="btn pri" data-act="rec-nueva">' + CM.icon('plus') + 'Cargar remito o factura</button></div>' + (db.recs.length ? '<div class="tw"><table><thead><tr><th>N.º</th><th>Fecha</th><th>Proveedor</th><th>Comprobante</th><th>Condición</th><th class="n">Total</th><th>Impacto</th></tr></thead><tbody>' + db.recs.slice().reverse().map(function (r) {
        var p = prov(r.prov);
        return '<tr><td>' + esc(r.id) + '</td><td>' + esc(CM.fmtFecha(r.fecha)) + '</td><td>' + esc(p ? p.nombre : '') + '</td><td>' + esc(r.tipoComp + ' ' + r.nroComp) + '</td><td>' + (r.cond === 'contado' ? 'Contado (efectivo)' : 'Cuenta corriente') + '</td><td class="n">' + esc(money(r.total)) + '</td><td><small class="hint">' + r.items.map(function (x) { var it = ins(x.ins); return esc((it ? it.nombre : x.ins) + ': ' + CM.fmtNum(x.antes) + ' → ' + CM.fmtNum(x.despues)); }).join('<br>') + (r.difs && r.difs.length ? '<br><b>Diferencias con la orden: ' + r.difs.length + '</b>' : '') + '</small></td></tr>';
      }).join('') + '</tbody></table></div>' : U.tablaVacia('Todavía no se cargó mercadería.')) + '</section>';
    } else if (t === 'ins') {
      h = '<section class="card"><div class="row sp"><h2>Insumos</h2><span class="row"><button class="btn" data-act="ins-consumo">Registrar consumo</button><button class="btn pri" data-act="ins-nuevo">' + CM.icon('plus') + 'Nuevo insumo</button></span></div>' + (db.ins.length ? '<div class="tw"><table><thead><tr><th>Insumo</th><th class="n">Stock</th><th class="n">Mínimo</th><th class="n">Último costo</th><th>Estado</th></tr></thead><tbody>' + db.ins.map(function (it) {
        var s = CM.insStock(it.id), bajo = s <= it.min;
        return '<tr><td>' + esc(it.nombre) + '</td><td class="n">' + esc(CM.fmtNum(s) + ' ' + it.unidad) + '</td><td class="n">' + esc(CM.fmtNum(it.min)) + '</td><td class="n">' + esc(it.costo ? money(it.costo) : '—') + '</td><td>' + (bajo ? '<span class="pill p-bad">Stock bajo</span>' : '<span class="pill p-ok">Ok</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : U.tablaVacia('Todavía no hay insumos.')) + '<p class="hint">El stock se calcula como la suma de movimientos (ingresos y consumos): no se edita a mano.</p></section>';
    } else {
      var pid = CM.pv.prov, p = prov(pid), libro = (db.ccprov || []).filter(function (m) { return !pid || m.prov === pid; });
      h = '<section class="card"><div class="row sp"><h2>Cuenta corriente</h2><span class="row"><label class="sr" for="pvSel">Proveedor</label><select class="in" id="pvSel" data-chg="pv-filtro">' + provOpts(pid).replace('Elegí un proveedor…', 'Todos los proveedores') + '</select>' + (p ? '<button class="btn pri" data-act="pv-pago" data-id="' + esc(pid) + '">Registrar pago</button>' : '') + '</span></div>' +
        (p ? '<div class="kv"><div><small>Deuda con ' + esc(p.nombre) + '</small><b>' + esc(money(CM.provSaldo(pid))) + '</b></div></div>' : '') +
        (libro.length ? '<div class="tw"><table><thead><tr><th>Fecha</th><th>Proveedor</th><th>Movimiento</th><th>Rubro</th><th class="n">Importe</th><th class="n">Saldo</th></tr></thead><tbody>' + libro.slice().reverse().map(function (m) {
          var pp = prov(m.prov);
          return '<tr><td>' + esc(CM.fmtFH(m.ts)) + '</td><td>' + esc(pp ? pp.nombre : '') + '</td><td>' + esc(m.tipo) + (m.motivo ? ' · ' + esc(m.motivo) : '') + '</td><td>' + esc(m.rubro) + '</td><td class="n">' + esc(money(m.cent)) + '</td><td class="n">' + esc(money(m.saldo)) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : U.tablaVacia('Sin movimientos.')) + '<div class="note info" style="margin-top:12px">Libro de sólo-agregar: Factura y Remito suman deuda; Pago la resta. El saldo siempre es la suma del libro.</div></section>';
    }
    return head + tabsH(t) + h;
  };
  CM.acts['pv-filtro'] = function () {};
  document.addEventListener('change', function (ev) { var t = ev.target; if (t && t.id === 'pvSel') { CM.pv.prov = t.value; render(); } });

  /* ---------- altas ---------- */
  CM.acts['pv-nuevo'] = function () {
    if (!CM.need('proveedores', 'edit')) return;
    CM.modal.open({ title: 'Nuevo proveedor', body: '<form id="fPV" data-form="pv-nuevo" class="f" autocomplete="off" novalidate>' + fl('Nombre *', '<input class="in" name="nombre" maxlength="80">') + fl('CUIT (opcional, se valida)', '<input class="in" name="cuit" inputmode="numeric" maxlength="13" placeholder="20-12345678-6">') + '<div class="f f2">' + fl('Teléfono', '<input class="in" name="tel" inputmode="tel">') + fl('Correo', '<input class="in" name="mail" type="email">') + '</div><p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fPV">Guardar</button>' });
  };
  CM.forms['pv-nuevo'] = function (f) {
    if (!CM.need('proveedores', 'edit')) return;
    var e = f.elements, nom = e.nombre.value.trim().replace(/\s+/g, ' '), c = cuit(e.cuit.value);
    if (nom.length < 3) return fail(f, 'nombre', 'Escribí el nombre del proveedor.');
    if (c && !CM.cuitValido(c)) return fail(f, 'cuit', 'El CUIT no es válido (revisá los 11 dígitos).');
    if (c && CM.db.provs.some(function (p) { return p.cuit === c; })) return fail(f, 'cuit', 'Ya existe un proveedor con ese CUIT.');
    var p = { id: CM.nextId('PV'), nombre: nom, cuit: c, tel: e.tel.value.trim(), mail: e.mail.value.trim(), notas: '', activo: true };
    CM.db.provs.push(p); CM.audit('Proveedor creado', p.id + ' · ' + nom); CM.save(); CM.modal.close(true); render(); CM.toast('Proveedor creado.');
  };
  CM.acts['ins-nuevo'] = function () {
    if (!CM.need('proveedores', 'edit')) return;
    CM.modal.open({ title: 'Nuevo insumo', body: '<form id="fIN" data-form="ins-nuevo" class="f" autocomplete="off" novalidate>' + fl('Nombre *', '<input class="in" name="nombre" maxlength="80" placeholder="Ej.: Sustrato universal">') + '<div class="f f2">' + fl('Unidad *', '<select class="in" name="unidad">' + ['kg', 'g', 'lt', 'ml', 'u'].map(function (x) { return opt(x, x); }).join('') + '</select>') + fl('Stock mínimo (alerta)', '<input class="in num" name="min" inputmode="decimal" value="0">') + '</div><p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fIN">Guardar</button>' });
  };
  CM.forms['ins-nuevo'] = function (f) {
    if (!CM.need('proveedores', 'edit')) return;
    var e = f.elements, nom = e.nombre.value.trim().replace(/\s+/g, ' '), mn = CM.parseCant(e.min.value || '0');
    if (nom.length < 3) return fail(f, 'nombre', 'Escribí el nombre del insumo.');
    if (isNaN(mn)) return fail(f, 'min', 'El mínimo no es una cantidad válida.');
    if (CM.db.ins.some(function (x) { return CM.norm(x.nombre) === CM.norm(nom); })) return fail(f, 'nombre', 'Ya existe un insumo con ese nombre.');
    var it = { id: CM.nextId('IN'), nombre: nom, unidad: e.unidad.value, min: mn, costo: 0, activo: true };
    CM.db.ins.push(it); CM.audit('Insumo creado', it.id + ' · ' + nom); CM.save(); CM.modal.close(true); render(); CM.toast('Insumo creado.');
  };
  CM.acts['ins-consumo'] = function () {
    if (!CM.need('proveedores', 'oper')) return;
    var cs = (CM.db.cultivos || []).filter(function (c) { return c.estado === 'activo'; });
    CM.modal.open({ title: 'Registrar consumo de insumo', body: '<form id="fIC" data-form="ins-consumo" class="f" autocomplete="off" novalidate>' + fl('Insumo *', '<select class="in" name="ins">' + insOpts('') + '</select>') + fl('Cantidad *', '<input class="in num" name="cant" inputmode="decimal">') + fl('Ciclo de cultivo (opcional)', '<select class="in" name="ciclo"><option value="">Sin ciclo</option>' + cs.map(function (c) { return opt(c.id, c.id + ' · ' + c.nombre); }).join('') + '</select>') + fl('Motivo *', '<input class="in" name="motivo" placeholder="Ej.: riego semana 3">') + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fIC">Registrar</button>' });
  };
  CM.forms['ins-consumo'] = function (f) {
    if (!CM.need('proveedores', 'oper')) return;
    var e = f.elements, it = ins(e.ins.value), c = CM.parseCant(e.cant.value);
    if (!it) return fail(f, 'ins', 'Elegí el insumo.');
    if (isNaN(c) || c <= 0) return fail(f, 'cant', 'Escribí una cantidad mayor que cero.');
    if (c > CM.insStock(it.id)) return fail(f, 'cant', 'No alcanza el stock: quedan ' + CM.fmtNum(CM.insStock(it.id)) + ' ' + it.unidad + '.');
    if (e.motivo.value.trim().length < 4) return fail(f, 'motivo', 'Escribí el motivo.');
    CM.db.insMovs.push({ id: CM.nextId('IM'), ins: it.id, cant: -c, tipo: 'consumo', ref: e.ciclo.value, motivo: e.motivo.value.trim(), ts: new Date().toISOString(), user: CM.db.cfg.operador });
    CM.audit('Consumo de insumo', it.nombre + ' · ' + CM.fmtNum(c) + ' ' + it.unidad + (e.ciclo.value ? ' · ciclo ' + e.ciclo.value : '')); CM.save(); CM.modal.close(true); render(); CM.toast('Consumo registrado.');
  };

  /* ---------- órdenes de compra ---------- */
  function filas(prefijo, n, items) {
    var h = '';
    for (var i = 0; i < n; i++) {
      var x = items && items[i] || {};
      h += '<div class="f f3 rowitem"><label class="fl"><span>Insumo ' + (i + 1) + '</span><select class="in" name="' + prefijo + 'i' + i + '">' + insOpts(x.ins) + '</select></label>' +
        '<label class="fl"><span>Cantidad</span><input class="in num" name="' + prefijo + 'c' + i + '" inputmode="decimal" value="' + (x.cant != null ? esc(String(x.cant).replace('.', ',')) : '') + '"></label>' +
        '<label class="fl"><span>Costo unitario ($)</span><input class="in num" name="' + prefijo + 'k' + i + '" inputmode="decimal" value="' + (x.costo != null ? esc(String(x.costo / 100).replace('.', ',')) : '') + '"></label></div>';
    }
    return h;
  }
  function leerFilas(f, prefijo, n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var id = f.elements[prefijo + 'i' + i].value, c = f.elements[prefijo + 'c' + i].value.trim(), k = f.elements[prefijo + 'k' + i].value.trim();
      if (!id && !c && !k) continue;
      if (!id) return { err: 'El renglón ' + (i + 1) + ' no tiene insumo.' };
      var cant = CM.parseCant(c), costo = k === '' ? NaN : CM.parseMonto(k);
      if (isNaN(cant) || cant <= 0) return { err: 'El renglón ' + (i + 1) + ' tiene una cantidad no válida.' };
      if (isNaN(costo)) return { err: 'El renglón ' + (i + 1) + ' tiene un costo no válido (0 = bonificación).' };
      out.push({ ins: id, cant: cant, costo: costo });
    }
    return { ok: out };
  }
  CM.acts['oc-nueva'] = function () {
    if (!CM.need('proveedores', 'edit')) return;
    if (!CM.db.provs.length || !CM.db.ins.length) { CM.toast('Primero cargá al menos un proveedor y un insumo.', true); return; }
    CM.modal.open({ title: 'Nueva orden de compra', wide: true, body: '<form id="fOC" data-form="oc-nueva" class="f" autocomplete="off" novalidate>' + fl('Proveedor *', '<select class="in" name="prov">' + provOpts('') + '</select>') + filas('o', 4) + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fOC">Solicitar</button>' });
  };
  CM.forms['oc-nueva'] = function (f) {
    if (!CM.need('proveedores', 'edit')) return;
    if (!prov(f.elements.prov.value)) return fail(f, 'prov', 'Elegí el proveedor.');
    var r = leerFilas(f, 'o', 4); if (r.err) return fail(f, '', r.err);
    if (!r.ok.length) return fail(f, '', 'Cargá al menos un renglón.');
    var seen = {}; for (var i = 0; i < r.ok.length; i++) { if (seen[r.ok[i].ins]) return fail(f, '', 'Un insumo está repetido: sumá las cantidades.'); seen[r.ok[i].ins] = 1; }
    var o = { id: CM.nextId('OC'), prov: f.elements.prov.value, fecha: CM.hoy(), estado: 'Solicitada', items: r.ok, user: CM.db.cfg.operador, ts: new Date().toISOString() };
    CM.db.ordenes.push(o); CM.audit('Orden de compra', o.id + ' · ' + prov(o.prov).nombre + ' · ' + money(sumaItems(o.items))); CM.save(); CM.modal.close(true); CM.pv.tab = 'oc'; render(); CM.toast('Orden ' + o.id + ' solicitada.');
  };
  CM.acts['oc-cancelar'] = function (t) {
    if (!CM.need('proveedores', 'edit')) return;
    var o = orden(t.getAttribute('data-id')); if (!o || o.estado !== 'Solicitada') return;
    o.estado = 'Cancelada'; CM.audit('Orden cancelada', o.id); CM.save(); render();
  };

  /* ---------- recepción ---------- */
  CM.acts['rec-nueva'] = function (t) {
    if (!CM.need('proveedores', 'edit')) return;
    if (!CM.db.provs.length || !CM.db.ins.length) { CM.toast('Primero cargá al menos un proveedor y un insumo.', true); return; }
    var o = orden(t.getAttribute('data-orden') || ''), idem = CM.idRand('rc-');
    CM.modal.open({ title: 'Ingreso de mercadería' + (o ? ' · ' + o.id : ''), wide: true,
      body: '<form id="fRC" data-form="rec-nueva" class="f" autocomplete="off" novalidate><input type="hidden" name="idem" value="' + esc(idem) + '"><input type="hidden" name="orden" value="' + esc(o ? o.id : '') + '">' +
        '<div class="f f2">' + fl('Proveedor *', '<select class="in" name="prov">' + provOpts(o ? o.prov : '') + '</select>') + fl('Fecha de recepción *', '<input class="in" type="date" name="fecha" value="' + CM.hoy() + '" max="' + CM.hoy() + '">') + '</div>' +
        '<div class="f f2">' + fl('Tipo de comprobante *', '<select class="in" name="tc"><option>Remito</option><option>Factura</option></select>') + fl('Número *', '<input class="in" name="nro" maxlength="40" placeholder="0001-00001234">') + '</div>' +
        filas('r', 4, o ? o.items : null) +
        '<div class="f f2">' + fl('Total declarado de control ($, opcional)', '<input class="in num" name="tot" inputmode="decimal">') + fl('Rubro financiero * (obligatorio)', '<select class="in" name="rubro">' + rubOpts('R-06') + '</select>') + '</div>' +
        fl('Condición *', '<select class="in" name="cond"><option value="cc">Cuenta corriente (queda como deuda)</option><option value="contado">Contado en efectivo (egreso de la caja abierta)</option></select>') +
        '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fRC">Confirmar ingreso</button>' });
  };
  CM.forms['rec-nueva'] = function (f) {
    if (!CM.need('proveedores', 'edit')) return;
    if (f.dataset.busy) return; f.dataset.busy = '1';
    var e = f.elements, r = leerFilas(f, 'r', 4);
    if (r.err) { delete f.dataset.busy; return fail(f, '', r.err); }
    var td = e.tot.value.trim() ? CM.parseMonto(e.tot.value) : null;
    if (td !== null && isNaN(td)) { delete f.dataset.busy; return fail(f, 'tot', 'El total declarado no es un importe válido.'); }
    var res = CM.procesarRecepcion({ idem: e.idem.value, prov: e.prov.value, orden: e.orden.value, tipoComp: e.tc.value, nroComp: e.nro.value, fecha: e.fecha.value, cond: e.cond.value, rubro: e.rubro.value, totalDecl: td, items: r.ok });
    if (res.err) { delete f.dataset.busy; return fail(f, '', res.err); }
    CM.save(); CM.modal.close(true); CM.pv.tab = 'rec'; render();
    CM.toast('Ingreso ' + res.ok.id + ' registrado: stock, costo y ' + (res.ok.cond === 'contado' ? 'caja' : 'deuda') + ' actualizados.');
  };

  /* ---------- pago ---------- */
  CM.acts['pv-pago'] = function (t) {
    if (!CM.need('proveedores', 'edit')) return;
    var p = prov(t.getAttribute('data-id')); if (!p) return;
    CM.modal.open({ title: 'Pago a ' + p.nombre, body: '<form id="fPG" data-form="pv-pago" class="f" autocomplete="off" novalidate><input type="hidden" name="prov" value="' + esc(p.id) + '"><div class="note info">Deuda actual: <b>' + esc(money(CM.provSaldo(p.id))) + '</b></div>' +
      fl('Importe ($) *', '<input class="in num" name="imp" inputmode="decimal">') + fl('Medio *', '<select class="in" name="medio"><option value="efectivo">Efectivo (egreso de la caja abierta)</option><option value="transferencia">Transferencia</option></select>') +
      fl('Rubro financiero * (obligatorio)', '<select class="in" name="rubro">' + rubOpts('R-06') + '</select>') + fl('Detalle', '<input class="in" name="motivo" maxlength="120">') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fPG">Registrar pago</button>' });
  };
  CM.forms['pv-pago'] = function (f) {
    if (!CM.need('proveedores', 'edit')) return;
    var e = f.elements, c = CM.parseMonto(e.imp.value);
    if (isNaN(c) || c <= 0) return fail(f, 'imp', 'Escribí un importe mayor que cero.');
    var r = CM.pagarProveedor({ prov: e.prov.value, cent: c, medio: e.medio.value, rubro: e.rubro.value, motivo: e.motivo.value.trim() });
    if (r.err) return fail(f, '', r.err);
    CM.save(); CM.modal.close(true); render(); CM.toast('Pago registrado.');
  };
})(window);
