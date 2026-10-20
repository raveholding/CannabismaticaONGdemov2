/* Sistema VB ONG · Caja: operaciones con detalle y cierre administrativo de una caja huérfana (SISTEMA_VB_ONGF 4.24 y 4.27.6) */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, fl = U.fl, fail = U.fail, VIEWS = CM.VIEWS;
  var render = function () { CM.render(); };
  var money = function (c) { return CM.fmtMoney(c); };
  CM.cj = CM.cj || { tipo: '', medio: '', q: '' };
  var TIPO = { ingreso: 'Ingreso', egreso: 'Egreso', retiro: 'Retiro', reintegro: 'Reintegro' };

  /* ¿la caja abierta quedó de un día anterior? (turno abierto por alguien que no volvió) */
  CM.cajaHuerfana = function () { var c = CM.cajaAbierta(); return c && c.fecha < CM.hoy() ? c : null; };

  var caja0 = VIEWS.caja;
  VIEWS.caja = function () {
    var h = caja0(), ab = CM.cajaAbierta();
    if (!ab) return h;
    var hu = CM.cajaHuerfana(), aviso = '';
    if (hu) {
      aviso = '<div class="note warn" style="margin-bottom:14px"><b>Caja abierta desde el ' + esc(CM.fmtFecha(hu.fecha)) + ' (' + esc(hu.id) + ').</b> Nadie la cerró. ' +
        (CM.can('cierre', 'admin') ? 'Podés cerrarla desde <a href="#/cierre">Arqueo y cierre</a>, o hacer un <button class="btn sm" data-act="caja-huerfana">cierre administrativo</button> si no se puede contar el efectivo.' : 'Pedile a un administrador que la cierre.') + '</div>';
    }
    return aviso + h + operaciones(ab);
  };
  /* el aviso va antes del contenido; el listado de operaciones, al final */
  function operaciones(ab) {
    var f = CM.cj, movs = CM.cajaMovs(ab), q = CM.norm(f.q);
    var vis = movs.filter(function (m) {
      if (f.tipo && m.tipo !== f.tipo) return false;
      if (f.medio && m.medio !== f.medio) return false;
      if (q && CM.norm([m.motivo, m.rubroN, m.user, m.id, money(m.cent)].join(' ')).indexOf(q) < 0) return false;
      return true;
    });
    var tot = { n: vis.length, ing: 0, egr: 0 };
    vis.forEach(function (m) { if (m.tipo === 'ingreso') tot.ing += m.cent; else tot.egr += m.cent; });
    var medios = {}; Object.keys(CM.MEDIOS).forEach(function (k) { medios[k] = 1; });
    return '<section class="card" style="margin-top:14px" aria-labelledby="opsT"><h2 id="opsT">Operaciones de esta caja</h2><p class="hint" style="margin-top:0">Sin tope de operaciones por turno. Tocá una fila para ver el <b>detalle</b> y los movimientos que generó.</p>' +
      '<div class="f f3" style="margin-bottom:10px"><label class="fl"><span>Tipo</span><select class="in" id="cjTipo"><option value="">Todos</option>' + Object.keys(TIPO).map(function (k) { return '<option value="' + k + '"' + (f.tipo === k ? ' selected' : '') + '>' + TIPO[k] + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>Medio</span><select class="in" id="cjMedio"><option value="">Todos</option>' + Object.keys(medios).map(function (k) { return '<option value="' + k + '"' + (f.medio === k ? ' selected' : '') + '>' + esc(CM.MEDIOS[k]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>Buscar (detalle, rubro, usuario, N.º o importe)</span><input class="in" id="cjQ" value="' + esc(f.q) + '" autocomplete="off"></label></div>' +
      (vis.length ? '<div class="tw"><table><thead><tr><th>N.º</th><th>Hora</th><th>Tipo</th><th>Detalle</th><th>Medio</th><th class="n">Importe</th><th></th></tr></thead><tbody>' + vis.map(function (m) {
        return '<tr class="clk" tabindex="0" data-act="caja-det" data-id="' + esc(m.id) + '"><td>' + esc(m.id) + '</td><td>' + esc(CM.fmtFH(m.ts).slice(-5)) + '</td><td>' + esc(TIPO[m.tipo] || m.tipo) + '</td><td>' + esc(m.motivo) + '</td><td>' + esc(CM.MEDIOS[m.medio] || m.medio) + '</td><td class="n">' + (m.tipo === 'ingreso' ? '' : '−') + esc(money(m.cent)) + '</td><td><button class="btn sm" data-act="caja-det" data-id="' + esc(m.id) + '">Ver detalle</button></td></tr>';
      }).join('') + '</tbody><tfoot><tr><th colspan="5">' + tot.n + ' operaciones · totales de lo que se ve</th><th class="n">' + esc(money(tot.ing)) + ' / −' + esc(money(tot.egr)) + '</th><th></th></tr></tfoot></table></div>' : U.tablaVacia('No hay operaciones con esos filtros.')) +
      '<p class="hint">Ingresos / egresos de la lista. El efectivo esperado del arqueo es: fondo inicial + ingresos en efectivo − egresos en efectivo.</p></section>';
  }
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t || !t.id) return;
    if (t.id === 'cjTipo') { CM.cj.tipo = t.value; render(); } else if (t.id === 'cjMedio') { CM.cj.medio = t.value; render(); } else if (t.id === 'cjQ') { CM.cj.q = t.value; render(); }
  });
  document.addEventListener('keydown', function (ev) {
    var t = ev.target; if (ev.key === 'Enter' && t && t.classList && t.classList.contains('clk') && t.tagName === 'TR') { ev.preventDefault(); CM.acts['caja-det'](t); }
  });

  /* ---------- detalle de una operación: lo que la operación generó ---------- */
  CM.detalleOperacion = function (id) {
    var db = CM.db, ab = CM.cajaAbierta(), m = null, caja = null;
    db.cajas.forEach(function (c) { CM.cajaMovs(c).forEach(function (x) { if (x.id === id) { m = x; caja = c; } }); });
    if (!m) return null;
    var gen = [], ap = null, d = null, comp = null;
    gen.push('<b>Caja ' + esc(caja.id) + '</b>: ' + (m.tipo === 'ingreso' ? 'entra ' : 'sale ') + esc(money(m.cent)) + ' por ' + esc(CM.MEDIOS[m.medio] || m.medio) + ' · rubro «' + esc(m.rubroN) + '»' + (m.medio === 'efectivo' ? ' (cuenta para el arqueo)' : ' (se concilia aparte)'));
    if (m.derivado && m.ref) {
      ap = db.aportes.filter(function (a) { return a.id === m.ref; })[0];
      if (ap) {
        d = ap.disp ? db.disp.filter(function (x) { return x.id === ap.disp; })[0] : null;
        comp = ap.comp ? CM.comp(ap.comp) : null;
        if (d) gen.push('<b>Stock</b>: ' + esc(CM.fmtNum(-d.cant) + ' ' + d.unidad) + ' del lote ' + esc(d.lote) + ' (' + esc(d.nombre) + ') por la dispensación ' + esc(d.id) + (d.cu ? ' · ciclo de origen ' + esc(d.cu) : ''));
        if (comp) gen.push('<b>Comprobante</b>: ' + (comp.tipo === 'FC' ? 'Factura C' : 'Nota de crédito C') + ' ' + esc(comp.pv + '-' + comp.nro) + (comp.simulado ? ' (simulada, sin validez fiscal)' : '') + (comp.anulado ? ' · anulada' : ''));
        else gen.push('<b>Comprobante</b>: sin Factura C (comprobante interno)');
        if (ap.estado === 'anulado') gen.push('<b>Estado</b>: donación anulada');
      }
    } else if (m.ref && /^(RC|CC)-/.test(m.ref)) {
      var rc = (db.recs || []).filter(function (r) { return r.id === m.ref; })[0];
      gen.push('<b>Proveedores</b>: ' + (rc ? 'ingreso de mercadería ' + esc(rc.id) + ' (' + esc(rc.tipoComp + ' ' + rc.nroComp) + ')' : 'pago registrado en la cuenta corriente ' + esc(m.ref)));
    }
    var aud = db.audit.filter(function (a) { return (a.detalle || '').indexOf(m.id) >= 0 || (m.ref && (a.detalle || '').indexOf(m.ref) >= 0); }).slice(0, 6);
    return { m: m, caja: caja, ap: ap, d: d, comp: comp, gen: gen, aud: aud };
  };
  CM.acts['caja-det'] = function (t) {
    var x = CM.detalleOperacion(t.getAttribute('data-id')); if (!x) return;
    var m = x.m, p = x.ap && x.ap.dni ? CM.paciente(x.ap.dni) : null;
    CM.modal.open({ title: 'Operación ' + m.id, wide: true,
      body: '<div class="kv"><div><small>Fecha y hora</small><b>' + esc(CM.fmtFH(m.ts)) + '</b></div><div><small>Caja</small><b>' + esc(x.caja.id) + '</b></div><div><small>Usuario</small><b>' + esc(m.user) + '</b></div><div><small>Importe</small><b>' + (m.tipo === 'ingreso' ? '' : '−') + esc(money(m.cent)) + '</b></div></div>' +
        '<p><b>' + esc(TIPO[m.tipo] || m.tipo) + '</b> · ' + esc(m.motivo) + '</p>' +
        (x.ap ? '<p>' + (p ? 'Paciente: <b>' + esc(U.nombreCorto(p.nombre)) + '</b> · legajo ' + esc(CM.legDe(p.dni)) : 'Donante sin identificar') + '</p>' : '') +
        '<h3>Movimientos que generó</h3><ul class="tl">' + x.gen.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
        '<h3>Auditoría</h3>' + (x.aud.length ? '<ul class="tl">' + x.aud.map(function (a) { return '<li>' + esc(CM.fmtFH(a.ts)) + ' · ' + esc(a.user) + ' · ' + esc(a.accion) + '</li>'; }).join('') + '</ul>' : '<p class="hint">Sin eventos de auditoría vinculados.</p>'),
      footer: '<button class="btn" type="button" data-act="modal-close">Cerrar</button>' });
  };

  /* ---------- cierre administrativo de caja huérfana ---------- */
  CM.acts['caja-huerfana'] = function () {
    if (!CM.need('cierre', 'admin')) return;
    var hu = CM.cajaHuerfana(); if (!hu) { CM.toast('No hay una caja de un día anterior abierta.', true); return; }
    var t = CM.totCaja(hu);
    CM.modal.open({ title: 'Cierre administrativo de ' + hu.id,
      body: '<form id="fCH" data-form="caja-huerfana" class="f" autocomplete="off" novalidate><div class="note warn">Esta caja se abrió el <b>' + esc(CM.fmtFecha(hu.fecha)) + '</b> y nadie la cerró. El cierre administrativo queda <b>sellado y marcado</b> como tal. Efectivo esperado: <b>' + esc(money(t.esperadoEf)) + '</b>.</div>' +
        fl('Efectivo contado ($, opcional)', '<input class="in num" name="dec" inputmode="decimal" placeholder="Dejalo vacío si no se puede contar">') +
        '<label class="chk"><input type="checkbox" name="esp"> No se pudo contar: tomar el efectivo <b>esperado</b> como declarado (diferencia 0)</label>' +
        fl('Motivo * (mínimo 10 caracteres)', '<textarea class="in" name="motivo" placeholder="Ej.: el turno terminó sin cierre; se verificó con el comprobante de depósito"></textarea>') +
        '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fCH">Cerrar y sellar</button>' });
  };
  CM.forms['caja-huerfana'] = function (f) {
    if (!CM.need('cierre', 'admin')) return;
    var hu = CM.cajaHuerfana(); if (!hu) return fail(f, '', 'Ya no hay una caja huérfana.');
    var e = f.elements, mot = e.motivo.value.trim(), t = CM.totCaja(hu), dec;
    if (mot.length < 10) return fail(f, 'motivo', 'Explicá el motivo (10 caracteres o más).');
    if (e.dec.value.trim()) { dec = CM.parseMonto(e.dec.value); if (isNaN(dec)) return fail(f, 'dec', 'El efectivo contado no es un importe válido.'); }
    else if (e.esp.checked) dec = t.esperadoEf;
    else return fail(f, 'dec', 'Escribí el efectivo contado o marcá que no se pudo contar.');
    var c = CM.cerrarCaja(hu, dec, '[CIERRE ADMINISTRATIVO] ' + mot + (e.dec.value.trim() ? '' : ' (efectivo no contado: se tomó el esperado)'));
    c.administrativo = true;
    CM.audit('Cierre administrativo de caja', hu.id + ' · abierta el ' + hu.fecha + ' · declarado ' + money(c.declaradoEf) + ' · dif ' + money(c.dif) + ' · sello ' + c.hash.slice(0, 12) + ' · ' + mot);
    CM.save(); CM.modal.close(true); render(); CM.toast('Caja cerrada administrativamente.');
  };

  /* el arqueo también avisa de la caja huérfana */
  var cierre0 = VIEWS.cierre;
  VIEWS.cierre = function () {
    var h = cierre0(), hu = CM.cajaHuerfana();
    if (!hu || !CM.can('cierre', 'admin')) return h;
    return h + '<div class="note warn" style="margin-top:14px">Caja abierta desde el ' + esc(CM.fmtFecha(hu.fecha)) + '. Si no se puede contar el efectivo: <button class="btn sm" data-act="caja-huerfana">cierre administrativo</button></div>';
  };
})(window);
