/* Cannabismatica I+D · Sistema ONG (demo v2) · Inventario, Fidelización, Personal y fichaje, Tareas y organigrama */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, $ = U.$, fl = U.fl, opt = U.opt, fail = U.fail, VIEWS = CM.VIEWS;
  var render = function () { CM.render(); };
  function money(c) { return CM.fmtMoney(c); }
  function pageH(t, p, extra) { return '<div class="page-h"><div><h1>' + esc(t) + '</h1><p>' + p + '</p></div>' + (extra || '') + '</div>'; }
  function tabs(items, cur, act) {
    return '<div class="tabs" role="group">' + items.map(function (i) { return '<button type="button" data-act="' + act + '" data-v="' + esc(i[0]) + '" aria-pressed="' + (i[0] === cur) + '">' + i[1] + '</button>'; }).join('') + '</div>';
  }
  function sel(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
  function addMonths(iso, n) { var d = new Date(iso + 'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); }
  function empNom(id) { var e = sel(CM.db.staff, id); return e ? e.nombre.replace(/\s*\((ficticio|ficticia)\)/i, '') : '—'; }

  /* ===================================================================
     INVENTARIO
     =================================================================== */
  CM.inv = { sec: 'prep', tab: 'todos', irub: 'todos' };
  function stockPill(s, min) {
    if (s <= 0) return '<span class="pill p-bad">Sin stock</span>';
    if (s <= min) return '<span class="pill p-warn">Stock bajo</span>';
    return '<span class="pill p-ok">Normal</span>';
  }
  function stockIns(id) { var s = 0; CM.db.imovs.forEach(function (m) { if (m.ins === id) s += m.cant; }); return Math.round(s * 100) / 100; }
  VIEWS.inventario = function () {
    var f = CM.inv, db = CM.db;
    var head = pageH('Inventario', 'Preparados por lote (trazables) e insumos y materiales de la fundación. Los ajustes no editan el stock: agregan un movimiento con motivo.');
    var sec = tabs([['prep', 'Preparados (lotes)'], ['ins', 'Insumos y materiales']], f.sec, 'inv-sec');
    if (f.sec === 'prep') {
      var cnt = { todos: db.lotes.length }, bajos = { todos: 0 };
      Object.keys(CM.PRODUCTOS).forEach(function (k) { cnt[k] = 0; bajos[k] = 0; });
      db.lotes.forEach(function (l) { cnt[l.prod]++; if (CM.stockLote(l.id) <= l.min) { bajos[l.prod]++; bajos.todos++; } });
      var ts = [['todos', 'Todos <span class="pill p-mu">' + cnt.todos + '</span>' + (bajos.todos ? ' <span class="pill p-warn">' + bajos.todos + ' bajo</span>' : '')]].concat(Object.keys(CM.PRODUCTOS).map(function (k) { return [k, esc(CM.PRODUCTOS[k].n) + ' <span class="pill p-mu">' + cnt[k] + '</span>']; }));
      var arr = db.lotes.filter(function (l) { return f.tab === 'todos' || l.prod === f.tab; });
      return head + sec + '<section class="card">' + tabs(ts, f.tab, 'inv-tab') +
        '<div class="row" style="margin-bottom:12px"><button class="btn sm" data-act="lote-nuevo">' + CM.icon('plus') + 'Nuevo lote</button><button class="btn sm" data-act="inv-csv">' + CM.icon('dl') + 'Exportar CSV</button></div>' +
        (arr.length ? '<div class="tw"><table><thead><tr><th>Lote</th><th>Preparado</th><th>Quimiotipo</th><th class="n">Stock</th><th class="n">Mínimo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + arr.map(function (l) {
          var s = CM.stockLote(l.id);
          return '<tr><td><b>' + esc(l.id) + '</b></td><td>' + esc(l.nombre) + '</td><td>' + esc(l.quim) + '</td><td class="n">' + esc(U.cantTxt(s, l.unidad)) + '</td><td class="n">' + esc(CM.fmtNum(l.min)) + '</td><td>' + stockPill(s, l.min) + '</td><td class="acts"><button class="btn sm" data-act="inv-aj" data-id="' + esc(l.id) + '">Ajuste rápido</button><button class="btn sm" data-act="inv-hist" data-id="' + esc(l.id) + '">Historial</button><button class="btn sm" data-act="inv-min" data-id="' + esc(l.id) + '">Mínimo</button></td></tr>';
        }).join('') + '</tbody></table></div>' : U.tablaVacia('No hay lotes en este rubro.')) + '</section>';
    }
    // insumos
    var ir = db.irubros;
    var its = [['todos', 'Todos <span class="pill p-mu">' + db.insumos.filter(function (x) { return x.activo; }).length + '</span>']].concat(ir.map(function (r) { return [r.id, '<span class="dot" style="background:' + esc(r.color) + '"></span>' + esc(r.n) + ' <span class="pill p-mu">' + db.insumos.filter(function (x) { return x.rubro === r.id && x.activo; }).length + '</span>']; }));
    var items = db.insumos.filter(function (x) { return f.irub === 'todos' || x.rubro === f.irub; });
    return head + sec + '<section class="card">' + tabs(its, f.irub, 'inv-irub') +
      '<div class="row" style="margin-bottom:12px"><button class="btn sm" data-act="ins-nuevo">' + CM.icon('plus') + 'Nuevo insumo</button><button class="btn sm" data-act="irub-nuevo">' + CM.icon('plus') + 'Nuevo rubro</button></div>' +
      (items.length ? '<div class="tw"><table><thead><tr><th>Insumo</th><th>Rubro</th><th class="n">Stock</th><th class="n">Mínimo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + items.map(function (x) {
        var s = stockIns(x.id), r = sel(ir, x.rubro);
        return '<tr' + (x.activo ? '' : ' class="anulada"') + '><td><b>' + esc(x.n) + '</b></td><td>' + (r ? '<span class="dot" style="background:' + esc(r.color) + '"></span>' + esc(r.n) : '—') + '</td><td class="n">' + esc(CM.fmtNum(s)) + ' ' + esc(x.unidad) + '</td><td class="n">' + esc(CM.fmtNum(x.min)) + '</td><td>' + (x.activo ? stockPill(s, x.min) : '<span class="pill p-mu">Inactivo</span>') + '</td><td class="acts"><button class="btn sm" data-act="ins-mov" data-id="' + esc(x.id) + '">Ingreso / egreso</button><button class="btn sm" data-act="ins-hist" data-id="' + esc(x.id) + '">Historial</button><button class="btn sm" data-act="ins-edit" data-id="' + esc(x.id) + '">Editar</button></td></tr>';
      }).join('') + '</tbody></table></div>' : U.tablaVacia('No hay insumos en este rubro.')) + '</section>' +
      '<section class="card" style="margin-top:14px"><h2>Rubros de insumos</h2><ul class="tl">' + ir.map(function (r) {
        var n = db.insumos.filter(function (x) { return x.rubro === r.id; }).length;
        return '<li class="rubrow"><span><span class="dot" style="background:' + esc(r.color) + '"></span><b>' + esc(r.n) + '</b> <small class="hint">' + n + ' insumo(s)</small></span><span class="acts"><button class="btn sm" data-act="irub-edit" data-id="' + esc(r.id) + '">' + CM.icon('edit') + 'Editar</button><button class="btn sm bad" data-act="irub-del" data-id="' + esc(r.id) + '">' + CM.icon('trash') + 'Eliminar</button></span></li>';
      }).join('') + '</ul></section>';
  };
  CM.acts['inv-sec'] = function (t) { CM.inv.sec = t.getAttribute('data-v'); render(); };
  CM.acts['inv-tab'] = function (t) { CM.inv.tab = t.getAttribute('data-v'); render(); };
  CM.acts['inv-irub'] = function (t) { CM.inv.irub = t.getAttribute('data-v'); render(); };
  CM.acts['inv-csv'] = function () {
    CM.descargar('inventario_lotes_' + CM.hoy() + '.csv', CM.csv(['Lote', 'Preparado', 'Tipo', 'Quimiotipo', 'Unidad', 'Stock', 'Minimo'], CM.db.lotes.map(function (l) { return [l.id, l.nombre, CM.PRODUCTOS[l.prod].n, l.quim, l.unidad, CM.stockLote(l.id), l.min]; })));
  };
  function modalAjuste(titulo, hidden, extra) {
    CM.modal.open({
      title: titulo, body: '<form id="fIA" data-form="inv-aj" class="f" autocomplete="off" novalidate>' + hidden + extra +
        '<div class="f f2">' + fl('Tipo de movimiento', '<select class="in" name="tipo">' + opt('mas', 'Ingreso (suma)') + opt('menos', 'Egreso por uso, pérdida o corrección (resta)') + '</select>') + fl('Cantidad *', '<input class="in num" name="cant" inputmode="decimal" placeholder="0">') + '</div>' +
        fl('Motivo * (obligatorio)', '<input class="in" name="motivo" placeholder="Ej.: recuento físico, merma, donación recibida">') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fIA">Registrar</button>'
    });
  }
  CM.acts['inv-aj'] = function (t) {
    if (!CM.need('inventario', 'oper')) return;
    var l = CM.lote(t.getAttribute('data-id'));
    modalAjuste('Ajuste rápido · ' + l.nombre, '<input type="hidden" name="k" value="lote"><input type="hidden" name="id" value="' + esc(l.id) + '">', '<div class="card flat">Stock actual: <b>' + esc(U.cantTxt(CM.stockLote(l.id), l.unidad)) + '</b></div>');
  };
  CM.acts['ins-mov'] = function (t) {
    if (!CM.need('inventario', 'oper')) return;
    var x = sel(CM.db.insumos, t.getAttribute('data-id'));
    modalAjuste('Ingreso / egreso · ' + x.n, '<input type="hidden" name="k" value="ins"><input type="hidden" name="id" value="' + esc(x.id) + '">', '<div class="card flat">Stock actual: <b>' + esc(CM.fmtNum(stockIns(x.id))) + ' ' + esc(x.unidad) + '</b></div>');
  };
  CM.forms['inv-aj'] = function (f) {
    var e = f.elements, cant = CM.parseCant(e.cant.value), motivo = e.motivo.value.trim(), signo = e.tipo.value === 'mas' ? 1 : -1;
    if (isNaN(cant) || cant <= 0) return fail(f, 'cant', 'Cantidad inválida.');
    if (motivo.length < 4) return fail(f, 'motivo', 'Escribí el motivo: es obligatorio.');
    if (e.k.value === 'lote') {
      var l = CM.lote(e.id.value);
      if (signo < 0 && cant > CM.stockLote(l.id)) return fail(f, 'cant', 'No puede quedar stock negativo: hay ' + U.cantTxt(CM.stockLote(l.id), l.unidad) + '.');
      if (l.unidad !== 'g' && Math.round(cant) !== cant) return fail(f, 'cant', 'Los frascos y las unidades son enteros.');
      CM.addMov(l.id, signo > 0 ? 'ingreso' : 'ajuste', signo * cant, '', motivo);
      CM.audit('Ajuste de stock', l.id + ' · ' + (signo > 0 ? '+' : '-') + cant + ' · ' + motivo);
    } else {
      var x = sel(CM.db.insumos, e.id.value);
      if (signo < 0 && cant > stockIns(x.id)) return fail(f, 'cant', 'No puede quedar stock negativo.');
      CM.db.imovs.push({ id: CM.nextId('IM'), ins: x.id, fecha: CM.hoy(), ts: new Date().toISOString(), cant: signo * cant, motivo: motivo, user: CM.db.cfg.operador });
      CM.audit('Movimiento de insumo', x.n + ' · ' + (signo > 0 ? '+' : '-') + cant + ' · ' + motivo);
    }
    CM.save(); CM.modal.close(true); render(); CM.toast('Movimiento registrado.');
  };
  CM.acts['inv-hist'] = function (t) {
    var l = CM.lote(t.getAttribute('data-id')), mv = CM.db.movs.filter(function (m) { return m.lote === l.id; }).sort(function (a, b) { return b.ts.localeCompare(a.ts); });
    CM.modal.open({ title: 'Historial · ' + l.nombre, wide: true, body: '<div class="tw"><table><thead><tr><th>Fecha</th><th>Tipo</th><th class="n">Cantidad</th><th>Referencia</th><th>Motivo</th><th>Usuario</th></tr></thead><tbody>' + mv.map(function (m) { return '<tr><td>' + esc(CM.fmtFecha(m.fecha)) + '</td><td>' + esc(m.tipo) + '</td><td class="n">' + (m.cant > 0 ? '+' : '') + esc(CM.fmtNum(m.cant)) + '</td><td>' + esc(m.ref) + '</td><td>' + esc(m.motivo) + '</td><td>' + esc(m.user) + '</td></tr>'; }).join('') + '</tbody></table></div>', footer: '<button class="btn" data-act="modal-close">Cerrar</button>' });
  };
  CM.acts['ins-hist'] = function (t) {
    var x = sel(CM.db.insumos, t.getAttribute('data-id')), mv = CM.db.imovs.filter(function (m) { return m.ins === x.id; }).sort(function (a, b) { return b.ts.localeCompare(a.ts); });
    CM.modal.open({ title: 'Historial · ' + x.n, wide: true, body: '<div class="tw"><table><thead><tr><th>Fecha</th><th class="n">Cantidad</th><th>Motivo</th><th>Usuario</th></tr></thead><tbody>' + mv.map(function (m) { return '<tr><td>' + esc(CM.fmtFecha(m.fecha)) + '</td><td class="n">' + (m.cant > 0 ? '+' : '') + esc(CM.fmtNum(m.cant)) + '</td><td>' + esc(m.motivo) + '</td><td>' + esc(m.user) + '</td></tr>'; }).join('') + '</tbody></table></div>', footer: '<button class="btn" data-act="modal-close">Cerrar</button>' });
  };
  CM.acts['inv-min'] = function (t) {
    if (!CM.need('inventario', 'edit')) return;
    var l = CM.lote(t.getAttribute('data-id'));
    CM.modal.open({ title: 'Stock mínimo · ' + l.nombre, body: '<form id="fMN" data-form="inv-min" class="f" novalidate><input type="hidden" name="id" value="' + esc(l.id) + '">' + fl('Alertar cuando el stock llegue a (' + l.unidad + ')', '<input class="in num" name="min" inputmode="decimal" placeholder="0" value="' + esc(l.min) + '">') + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fMN">Guardar</button>' });
  };
  CM.forms['inv-min'] = function (f) {
    var l = CM.lote(f.elements.id.value), v = CM.parseCant(f.elements.min.value);
    if (isNaN(v)) return fail(f, 'min', 'Valor inválido.');
    CM.audit('Stock mínimo', l.id + ' · ' + l.min + ' → ' + v); l.min = v; CM.save(); CM.modal.close(true); render();
  };
  /* insumos: alta y edición */
  function modalIns(x) {
    var edit = !!x;
    CM.modal.open({
      title: edit ? 'Editar insumo' : 'Nuevo insumo', body: '<form id="fIN" data-form="ins" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(edit ? x.id : '') + '">' +
        fl('Nombre *', '<input class="in" name="n" value="' + esc(edit ? x.n : '') + '">') +
        '<div class="f f2">' + fl('Rubro *', '<select class="in" name="rubro">' + CM.db.irubros.map(function (r) { return opt(r.id, r.n, edit && x.rubro === r.id); }).join('') + '</select>') + fl('Unidad *', '<input class="in" name="unidad" value="' + esc(edit ? x.unidad : 'u') + '">') + '</div>' +
        '<div class="f f2">' + fl('Stock mínimo', '<input class="in num" name="min" inputmode="decimal" placeholder="0" value="' + esc(edit ? x.min : '') + '">') + (edit ? '' : fl('Stock inicial', '<input class="in num" name="ini" inputmode="decimal" placeholder="0">')) + '</div>' +
        (edit ? '<label class="chk"><input type="checkbox" name="activo"' + (x.activo ? ' checked' : '') + '><span>Activo (si se desmarca, deja de aparecer en alertas)</span></label>' : '') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fIN">Guardar</button>'
    });
  }
  CM.acts['ins-nuevo'] = function () { if (CM.need('inventario', 'edit')) modalIns(null); };
  CM.acts['ins-edit'] = function (t) { if (CM.need('inventario', 'edit')) modalIns(sel(CM.db.insumos, t.getAttribute('data-id'))); };
  CM.forms.ins = function (f) {
    var e = f.elements, n = e.n.value.trim(), min = e.min.value.trim() ? CM.parseCant(e.min.value) : 0;
    if (n.length < 2) return fail(f, 'n', 'Escribí el nombre.');
    if (!e.unidad.value.trim()) return fail(f, 'unidad', 'Escribí la unidad.');
    if (isNaN(min)) return fail(f, 'min', 'Mínimo inválido.');
    var x = e.id.value ? sel(CM.db.insumos, e.id.value) : null;
    if (x) { x.n = n; x.rubro = e.rubro.value; x.unidad = e.unidad.value.trim(); x.min = min; x.activo = e.activo.checked; CM.audit('Insumo editado', x.id + ' · ' + n); }
    else {
      x = { id: CM.nextId('IN'), rubro: e.rubro.value, n: n, unidad: e.unidad.value.trim(), min: min, activo: true }; CM.db.insumos.push(x);
      var ini = e.ini && e.ini.value.trim() ? CM.parseCant(e.ini.value) : 0;
      if (isNaN(ini)) return fail(f, 'ini', 'Stock inicial inválido.');
      if (ini > 0) CM.db.imovs.push({ id: CM.nextId('IM'), ins: x.id, fecha: CM.hoy(), ts: new Date().toISOString(), cant: ini, motivo: 'Stock inicial', user: CM.db.cfg.operador });
      CM.audit('Insumo nuevo', x.id + ' · ' + n);
    }
    CM.save(); CM.modal.close(true); render(); CM.toast('Insumo guardado.');
  };
  /* rubros de insumos: ABM */
  function modalIrub(r) {
    var edit = !!r;
    CM.modal.open({
      title: edit ? 'Editar rubro' : 'Nuevo rubro de insumos', body: '<form id="fIR" data-form="irub" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(edit ? r.id : '') + '">' + fl('Nombre del rubro *', '<input class="in" name="n" value="' + esc(edit ? r.n : '') + '">') + fl('Color', '<input class="in" type="color" name="color" value="' + esc(edit ? r.color : '#a0de4a') + '" style="padding:4px">') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fIR">Guardar</button>'
    });
  }
  CM.acts['irub-nuevo'] = function () { if (CM.need('inventario', 'edit')) modalIrub(null); };
  CM.acts['irub-edit'] = function (t) { if (CM.need('inventario', 'edit')) modalIrub(sel(CM.db.irubros, t.getAttribute('data-id'))); };
  CM.forms.irub = function (f) {
    var e = f.elements, n = e.n.value.trim();
    if (n.length < 2) return fail(f, 'n', 'Escribí el nombre del rubro.');
    if (CM.db.irubros.some(function (r) { return CM.norm(r.n) === CM.norm(n) && r.id !== e.id.value; })) return fail(f, 'n', 'Ya existe un rubro con ese nombre.');
    var r = e.id.value ? sel(CM.db.irubros, e.id.value) : null;
    if (r) { r.n = n; r.color = e.color.value; } else CM.db.irubros.push({ id: CM.idRand('IR-'), n: n, color: e.color.value });
    CM.audit('Rubro de insumos', n); CM.save(); CM.modal.close(true); render(); CM.toast('Rubro guardado.');
  };
  CM.acts['irub-del'] = function (t) {
    if (!CM.need('inventario', 'edit')) return;
    var r = sel(CM.db.irubros, t.getAttribute('data-id')), n = CM.db.insumos.filter(function (x) { return x.rubro === r.id; }).length;
    if (n) { CM.modal.open({ title: 'No se puede eliminar', body: '<p>El rubro <b>' + esc(r.n) + '</b> tiene ' + n + ' insumo(s) con historial. Para conservar la trazabilidad no se borra: reasigná o desactivá esos insumos primero.</p>', footer: '<button class="btn pri" data-act="modal-close">Entendido</button>' }); return; }
    CM.modal.open({ title: 'Eliminar rubro', body: '<p>¿Eliminar el rubro <b>' + esc(r.n) + '</b>? No tiene insumos asociados.</p>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn bad" data-act="irub-del-ok" data-id="' + esc(r.id) + '">Sí, eliminar</button>' });
  };
  CM.acts['irub-del-ok'] = function (t) {
    CM.db.irubros = CM.db.irubros.filter(function (r) { return r.id !== t.getAttribute('data-id'); }); CM.inv.irub = 'todos';
    CM.audit('Rubro de insumos eliminado', t.getAttribute('data-id')); CM.save(); CM.modal.close(true); render();
  };

  /* ===================================================================
     FIDELIZACIÓN: sellos, cupones, membresías
     =================================================================== */
  CM.fid = { tab: 'sellos' };
  var BENEF = ['Taller sin donación sugerida', 'Seguimiento médico prioritario', 'Material de lectura impreso'];
  CM.firmaSello = function (dni) { return CM.sha256('cm-demo-sello|' + dni).slice(0, 8); };
  function cuponEstado(c) {
    var h = CM.hoy();
    if (c.estado === 'pausado') return ['Pausado', 'p-mu'];
    if (h > c.hasta) return ['Vencido', 'p-bad'];
    if (h < c.desde) return ['Programado', 'p-info'];
    if (c.max && CM.usosCupon(c.cod) >= c.max) return ['Agotado', 'p-warn'];
    return ['Vigente', 'p-ok'];
  }
  function membPill(m) {
    var e = CM.estadoMemb(m);
    return { activa: '<span class="pill p-ok">Activa</span>', pendiente: '<span class="pill p-warn">Pendiente de pago</span>', vencida: '<span class="pill p-bad">Impaga / vencida</span>', pausada: '<span class="pill p-mu">Pausada</span>', cancelada: '<span class="pill p-mu">Cancelada</span>' }[e];
  }
  VIEWS.fidelizacion = function () {
    var f = CM.fid, db = CM.db, meta = db.cfg.sellosMeta;
    var head = pageH('Fidelización, cupones y membresía', 'Programa de participación de pacientes y socios. Los saldos son un libro mayor: no se editan, se compensan con un movimiento.');
    var tb = tabs([['sellos', 'Sellos'], ['cupones', 'Cupones'], ['memb', 'Membresías de socios']], f.tab, 'fid-tab');
    if (f.tab === 'sellos') {
      var pacs = Object.keys(db.pacientes).map(function (k) { return db.pacientes[k]; }).map(function (p) { return { p: p, s: CM.saldoSellos(p.dni) }; }).sort(function (a, b) { return b.s - a.s; });
      var led = db.sellos.slice().sort(function (a, b) { return b.ts.localeCompare(a.ts); }).slice(0, 12);
      return head + tb + '<div class="grid g2"><section class="card"><h2>Programa de sellos</h2><p style="color:var(--mu)">Un sello por día y por paciente, validado en el mostrador. Con <b>' + meta + '</b> sellos se canjea un beneficio. El alta desde el menú público <b>no</b> da sellos.</p>' +
        '<form data-form="sello" class="f" autocomplete="off" novalidate><div class="f f2">' + fl('Paciente * (nombre, legajo, DNI, CUIT o CUIL)', '<input class="in" name="dni" autocomplete="off" placeholder="Ej.: 99000001 o el legajo">') + fl('Motivo', '<select class="in" name="motivo">' + ['Participación en taller', 'Seguimiento médico realizado', 'Voluntariado', 'Asistencia a curso'].map(function (m) { return opt(m, m); }).join('') + '</select>') + '</div><p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">' + CM.icon('star') + 'Otorgar sello de hoy</button></div></form></section>' +
        '<section class="card"><h2>Últimos movimientos</h2><div class="tw"><table><thead><tr><th>Fecha</th><th>Paciente</th><th>Movimiento</th></tr></thead><tbody>' + led.map(function (s) { return '<tr><td>' + esc(CM.fmtFecha(s.fecha)) + '</td><td>' + esc(U.nombreCorto(U.nombreDe(s.dni))) + '</td><td>' + (s.tipo === 'sello' ? '+1 sello' : 'Canje (' + s.cant + ') · ' + esc(s.motivo)) + '</td></tr>'; }).join('') + '</tbody></table></div></section></div>' +
        '<section class="card" style="margin-top:14px"><h2>Saldo de cada paciente</h2><div class="tw"><table><thead><tr><th>Paciente</th><th>Progreso</th><th class="n">Sellos</th><th>Acciones</th></tr></thead><tbody>' + pacs.map(function (x) {
          return '<tr><td>' + esc(U.nombreCorto(x.p.nombre)) + '<br><small class="hint">' + esc(CM.idTxt(x.p)) + '</small></td><td style="min-width:140px"><div class="prog" role="img" aria-label="' + x.s + ' de ' + meta + ' sellos"><i style="width:' + Math.min(100, Math.round(x.s / meta * 100)) + '%"></i></div></td><td class="n">' + x.s + ' / ' + meta + '</td><td class="acts"><button class="btn sm" data-act="sello-hoy" data-dni="' + esc(x.p.dni) + '">+ Sello</button><button class="btn sm" data-act="sello-canje" data-dni="' + esc(x.p.dni) + '"' + (x.s < meta ? ' disabled' : '') + '>Canjear</button><button class="btn sm" data-act="sello-tarjeta" data-dni="' + esc(x.p.dni) + '">' + CM.icon('qr') + 'Tarjeta</button></td></tr>';
        }).join('') + '</tbody></table></div></section>';
    }
    if (f.tab === 'cupones') {
      return head + tb + '<div class="grid g2"><section class="card"><h2>Canjear un cupón</h2><form data-form="cupon-canje" class="f" autocomplete="off" novalidate>' +
        '<div class="f f2">' + fl('Código del cupón *', '<input class="in" name="cod" placeholder="Ej.: BIENVENIDA" style="text-transform:uppercase">') + fl('Paciente * (nombre, legajo, DNI, CUIT o CUIL)', '<input class="in" name="dni" autocomplete="off" placeholder="Ej.: 99000001 o el legajo">') + '</div>' +
        '<div class="f f2">' + fl('Donación sugerida del taller o curso (opcional, para calcular)', '<input class="in num" name="base" inputmode="decimal" placeholder="0">') + fl('Referencia (taller / curso) — evita canjes repetidos', '<input class="in" name="ref" placeholder="Ej.: Taller de cultivo 12/11">') + '</div>' +
        '<p class="err" role="alert" data-err></p><div class="note info" data-res hidden></div><div class="row"><button class="btn" type="button" data-act="cupon-validar">Validar</button><button class="btn pri" type="submit">Canjear cupón</button></div></form></section>' +
        '<section class="card"><h2>Cupones</h2><div class="row" style="margin-bottom:10px"><button class="btn sm" data-act="cupon-nuevo">' + CM.icon('plus') + 'Nuevo cupón</button></div><div class="tw"><table><thead><tr><th>Código</th><th>Bonificación</th><th>Vigencia</th><th class="n">Usos</th><th>Estado</th><th></th></tr></thead><tbody>' + db.cupones.map(function (c) {
          var es = cuponEstado(c);
          return '<tr><td><b>' + esc(c.cod) + '</b><br><small class="hint">' + esc(c.desc) + '</small></td><td>' + (c.tipo === 'pct' ? c.valor + ' %' : esc(money(c.valor))) + '</td><td>' + esc(CM.fmtFecha(c.desde)) + ' a ' + esc(CM.fmtFecha(c.hasta)) + '</td><td class="n">' + CM.usosCupon(c.cod) + (c.max ? ' / ' + c.max : '') + '</td><td><span class="pill ' + es[1] + '">' + es[0] + '</span></td><td><button class="btn sm" data-act="cupon-pausa" data-id="' + esc(c.id) + '">' + (c.estado === 'pausado' ? 'Reactivar' : 'Pausar') + '</button></td></tr>';
        }).join('') + '</tbody></table></div><p class="hint">Un cupón de bonificación reduce el <i>donación sugerida</i> de un taller o curso. No se acumula con otros: se aplica uno por operación.</p></section></div>';
    }
    // membresías
    var ms = db.membresias.slice().sort(function (a, b) { return b.id.localeCompare(a.id); });
    return head + tb + '<div class="grid g3"><div class="card kpi"><div class="l">Socios con cuota activa</div><div class="v">' + ms.filter(function (m) { return CM.estadoMemb(m) === 'activa'; }).length + '</div></div><div class="card kpi"><div class="l">Pendientes de pago</div><div class="v">' + ms.filter(function (m) { return CM.estadoMemb(m) === 'pendiente'; }).length + '</div></div><div class="card kpi"><div class="l">Impagas o vencidas</div><div class="v">' + ms.filter(function (m) { return CM.estadoMemb(m) === 'vencida'; }).length + '</div></div></div>' +
      '<section class="card" style="margin-top:14px"><div class="row sp"><h2>Membresías de socios</h2><button class="btn pri sm" data-act="memb-nueva">' + CM.icon('plus') + 'Nueva membresía</button></div><div class="tw"><table><thead><tr><th>Socio/a</th><th>Plan</th><th>Cuota</th><th>Pagada hasta</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + ms.map(function (m) {
        var pl = CM.plan(m.plan);
        return '<tr><td>' + esc(U.nombreCorto(U.nombreDe(m.dni))) + '<br><small class="hint">' + esc(CM.idTxt(CM.paciente(m.dni))) + ' · aceptó términos ' + esc(m.cons.version) + ' el ' + esc(CM.fmtFecha(m.cons.fecha)) + '</small></td><td>' + esc(pl ? pl.n : '—') + '</td><td>' + esc(pl ? money(pl.cent) : '—') + '</td><td>' + (m.pagadoHasta ? esc(CM.fmtFecha(m.pagadoHasta)) : '—') + '</td><td>' + membPill(m) + '</td><td class="acts">' +
          (m.estado === 'cancelada' ? '' : '<button class="btn sm" data-act="memb-pago" data-id="' + esc(m.id) + '">Confirmar pago</button><button class="btn sm" data-act="memb-pausa" data-id="' + esc(m.id) + '">' + (m.estado === 'pausada' ? 'Reanudar' : 'Pausar') + '</button><button class="btn sm bad" data-act="memb-cancel" data-id="' + esc(m.id) + '">Cancelar</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div><div class="note info" style="margin-top:12px">La membresía no figura <b>activa</b> hasta que se confirma el pago de la cuota. Esta es la cuota que los socios aportan a la fundación; no tiene relación con ningún cobro de Rave Holding por el sistema.</div></section>' +
      '<section class="card" style="margin-top:14px"><h2>Planes</h2><ul class="tl">' + db.planes.map(function (p) { return '<li class="rubrow"><span><b>' + esc(p.n) + '</b> · ' + esc(money(p.cent)) + ' (' + esc(p.per) + ')<br><small class="hint">' + esc(p.ben) + '</small></span></li>'; }).join('') + '</ul></section>';
  };
  CM.acts['fid-tab'] = function (t) { CM.fid.tab = t.getAttribute('data-v'); render(); };
  CM.forms.sello = function (f) {
    if (!CM.need('fidelizacion', 'oper')) return;
    var dni = (CM.resolverPac(f.elements.dni.value) || { dni: '' }).dni, r = CM.otorgarSello(dni, f.elements.motivo.value);
    if (r.err) return fail(f, 'dni', r.err);
    CM.audit('Sello otorgado', 'Legajo ' + CM.legDe(dni) + ' · ' + r.ok.id); CM.save(); render(); CM.toast('Sello otorgado.');
  };
  CM.acts['sello-hoy'] = function (t) {
    if (!CM.need('fidelizacion', 'oper')) return;
    var r = CM.otorgarSello(t.getAttribute('data-dni'), 'Participación en taller');
    if (r.err) { CM.toast(r.err, true); return; }
    CM.audit('Sello otorgado', 'Legajo ' + CM.legDe(t.getAttribute('data-dni')) + ' · ' + r.ok.id); CM.save(); render(); CM.toast('Sello otorgado.');
  };
  CM.acts['sello-canje'] = function (t) {
    if (!CM.need('fidelizacion', 'oper')) return;
    var dni = t.getAttribute('data-dni');
    CM.modal.open({ title: 'Canjear sellos', body: '<form id="fSC" data-form="sello-canje" class="f"><input type="hidden" name="dni" value="' + esc(dni) + '"><p>' + esc(U.nombreCorto(U.nombreDe(dni))) + ' tiene ' + CM.saldoSellos(dni) + ' sellos. El canje resta ' + CM.db.cfg.sellosMeta + '.</p>' + fl('Beneficio', '<select class="in" name="b">' + BENEF.map(function (b) { return opt(b, b); }).join('') + '</select>') + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fSC">Canjear</button>' });
  };
  CM.forms['sello-canje'] = function (f) {
    var dni = f.elements.dni.value, r = CM.canjearSellos(dni, f.elements.b.value);
    if (r.err) return fail(f, 'b', r.err);
    CM.audit('Canje de sellos', 'Legajo ' + CM.legDe(dni) + ' · ' + f.elements.b.value); CM.save(); CM.modal.close(true); render(); CM.toast('Canje registrado.');
  };
  function tarjetaHtml(p) {
    var s = CM.saldoSellos(p.dni), meta = CM.db.cfg.sellosMeta, tok = 'CM-S|' + p.dni + '|' + CM.firmaSello(p.dni), cells = '';
    for (var i = 0; i < meta; i++) cells += '<span class="' + (i < Math.min(s, meta) ? 'on' : '') + '">' + (i < Math.min(s, meta) ? '★' : '') + '</span>';
    return '<div class="tarj"><div class="tj-h"><img src="assets/logo.png" alt="Cannabismatica"></div><div class="tj-b"><div class="tj-n">' + esc(U.nombreCorto(p.nombre)) + '</div><div class="tj-d">' + esc(CM.docCorto(p)) + '</div><div class="tj-s">' + cells + '</div></div><div class="tj-q">' + CM.qrSvg(tok) + '</div><div class="tj-f">Tarjeta de participación · ejemplo</div></div>';
  }
  CM.acts['sello-tarjeta'] = function (t) {
    var p = CM.paciente(t.getAttribute('data-dni'));
    CM.modal.open({ title: 'Tarjeta de participación', body: '<div class="tarj-wrap">' + tarjetaHtml(p) + '</div><p class="hint">Tamaño de tarjeta 85,6 × 54 mm. El QR lleva una firma: una tarjeta falsificada no valida. En esta versión el QR no se lee con cámara.</p>', footer: '<button class="btn" data-act="modal-close">Cerrar</button><button class="btn pri" data-act="tarj-print" data-dni="' + esc(p.dni) + '">' + CM.icon('print') + 'Imprimir</button>' });
  };
  CM.acts['tarj-print'] = function (t) { CM.imprimir('<div class="tarj-wrap print">' + tarjetaHtml(CM.paciente(t.getAttribute('data-dni'))) + '</div>'); };
  function resCupon(f, msg, ok) {
    var r = $('[data-res]', f); r.hidden = false; r.className = 'note ' + (ok ? 'ok' : 'bad'); r.textContent = msg;
  }
  function calcCupon(f, c) {
    var base = f.elements.base.value.trim() ? CM.parseMonto(f.elements.base.value) : NaN, txt = c.desc;
    if (!isNaN(base) && base > 0) {
      var bon = c.tipo === 'pct' ? Math.round(base * c.valor / 100) : Math.min(c.valor, base);
      txt = 'Bonificación de ' + money(bon) + ' → donación sugerida final ' + money(base - bon) + '.';
    }
    return txt;
  }
  CM.acts['cupon-validar'] = function (t) {
    var f = t.closest('form'), dni = (CM.resolverPac(f.elements.dni.value) || { dni: '' }).dni, v = CM.validarCupon(f.elements.cod.value, dni);
    $('[data-err]', f).textContent = '';
    if (v.err) resCupon(f, v.err, false); else resCupon(f, 'Cupón válido. ' + calcCupon(f, v.ok), true);
  };
  CM.forms['cupon-canje'] = function (f) {
    if (!CM.need('fidelizacion', 'oper')) return;
    var dni = (CM.resolverPac(f.elements.dni.value) || { dni: '' }).dni, r = CM.canjearCupon(f.elements.cod.value, dni, f.elements.ref.value.trim());
    if (r.err) { resCupon(f, r.err, false); return; }
    var c = CM.cupon(f.elements.cod.value);
    CM.audit('Canje de cupón', c.cod + ' · Legajo ' + CM.legDe(dni) + ' · ' + (f.elements.ref.value.trim() || 'sin referencia')); CM.save();
    CM.toast('Cupón canjeado. ' + calcCupon(f, c)); render();
  };
  CM.acts['cupon-pausa'] = function (t) {
    if (!CM.need('fidelizacion', 'edit')) return;
    var c = sel(CM.db.cupones, t.getAttribute('data-id')); c.estado = c.estado === 'pausado' ? 'activo' : 'pausado';
    CM.audit('Cupón ' + (c.estado === 'pausado' ? 'pausado' : 'reactivado'), c.cod); CM.save(); render();
  };
  CM.acts['cupon-nuevo'] = function () {
    if (!CM.need('fidelizacion', 'edit')) return;
    var h = CM.hoy();
    CM.modal.open({ title: 'Nuevo cupón', body: '<form id="fCN" data-form="cupon-nuevo" class="f" autocomplete="off" novalidate>' + fl('Código * (letras y números)', '<input class="in" name="cod" maxlength="20" style="text-transform:uppercase">') +
      '<div class="f f2">' + fl('Tipo de bonificación', '<select class="in" name="tipo">' + opt('pct', 'Porcentaje (%)') + opt('monto', 'Monto fijo ($)') + '</select>') + fl('Valor *', '<input class="in num" name="valor" inputmode="decimal" placeholder="0">') + '</div>' +
      '<div class="f f2">' + fl('Vigente desde', '<input class="in" type="date" name="desde" value="' + h + '">') + fl('Vigente hasta', '<input class="in" type="date" name="hasta" value="' + CM.addDays(h, 30) + '">') + '</div>' +
      '<div class="f f2">' + fl('Máximo de usos en total', '<input class="in num" name="max" inputmode="numeric" placeholder="Sin límite">') + fl('Usos por paciente', '<input class="in num" name="porPac" inputmode="numeric" placeholder="1" value="1">') + '</div>' +
      fl('Descripción', '<input class="in" name="desc">') + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fCN">Crear cupón</button>' });
  };
  CM.forms['cupon-nuevo'] = function (f) {
    var e = f.elements, cod = e.cod.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(cod)) return fail(f, 'cod', 'El código debe tener de 3 a 20 letras o números.');
    if (CM.cupon(cod)) return fail(f, 'cod', 'Ya existe un cupón con ese código.');
    var val = e.tipo.value === 'pct' ? CM.parseCant(e.valor.value) : CM.parseMonto(e.valor.value);
    if (isNaN(val) || val <= 0) return fail(f, 'valor', 'Valor inválido.');
    if (e.tipo.value === 'pct' && val >= 100) return fail(f, 'valor', 'El porcentaje tiene que ser menor que 100.');
    if (!e.desde.value || !e.hasta.value || e.hasta.value < e.desde.value) return fail(f, 'hasta', 'Revisá las fechas de vigencia.');
    var max = e.max.value.trim() ? parseInt(e.max.value, 10) : 0, pp = e.porPac.value.trim() ? parseInt(e.porPac.value, 10) : 1;
    if (isNaN(max) || isNaN(pp) || max < 0 || pp < 0) return fail(f, 'max', 'Los usos deben ser números enteros.');
    CM.db.cupones.push({ id: CM.nextId('CP'), cod: cod, tipo: e.tipo.value, valor: val, desde: e.desde.value, hasta: e.hasta.value, max: max, porPac: pp, estado: 'activo', desc: e.desc.value.trim() });
    CM.audit('Cupón creado', cod); CM.save(); CM.modal.close(true); render(); CM.toast('Cupón creado.');
  };
  /* membresías */
  CM.acts['memb-nueva'] = function () {
    if (!CM.need('fidelizacion', 'oper')) return;
    CM.modal.open({ title: 'Nueva membresía de socio/a', body: '<form id="fMB" data-form="memb-nueva" class="f" autocomplete="off" novalidate>' + fl('Paciente * (nombre, legajo, DNI, CUIT o CUIL)', '<input class="in" name="dni" autocomplete="off" placeholder="Ej.: 99000001 o el legajo">') +
      fl('Plan *', '<select class="in" name="plan">' + CM.db.planes.map(function (p) { return opt(p.id, p.n + ' · ' + money(p.cent) + ' (' + p.per + ')'); }).join('') + '</select>') +
      '<div class="note info">Términos v1.0 [VERIFICAR con asesor/a legal]: la cuota es una donación voluntaria y periódico que sostiene a la fundación. Se puede pausar o cancelar en cualquier momento, sin obstáculos. La membresía se activa cuando se confirma el pago.</div>' +
      '<label class="chk"><input type="checkbox" name="ok"><span>La persona leyó y acepta los términos de la membresía (v1.0) *</span></label><p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fMB">Crear membresía</button>' });
  };
  CM.forms['memb-nueva'] = function (f) {
    var e = f.elements, dni = (CM.resolverPac(e.dni.value) || { dni: '' }).dni;
    if (!CM.paciente(dni)) return fail(f, 'dni', 'No encontré a ese paciente: escribí su nombre, legajo o documento. Si todavía no está registrado, creá primero su ficha.');
    if (!e.ok.checked) return fail(f, 'ok', 'Falta el consentimiento: es obligatorio y queda registrado con su versión.');
    if (CM.db.membresias.some(function (m) { return m.dni === dni && ['cancelada'].indexOf(m.estado) < 0; })) return fail(f, 'dni', 'Ese paciente ya tiene una membresía vigente.');
    CM.db.membresias.push({ id: CM.nextId('MB'), dni: dni, plan: e.plan.value, desde: CM.hoy(), pagadoHasta: '', cons: { version: 'v1.0', fecha: CM.hoy() }, estado: 'ok' });
    CM.audit('Membresía creada', 'Legajo ' + CM.legDe(dni) + ' · ' + e.plan.value + ' · consentimiento v1.0'); CM.save(); CM.modal.close(true); render(); CM.toast('Membresía creada: queda pendiente hasta confirmar el pago.');
  };
  CM.acts['memb-pago'] = function (t) {
    if (!CM.need('fidelizacion', 'oper')) return;
    var m = sel(CM.db.membresias, t.getAttribute('data-id')), pl = CM.plan(m.plan);
    CM.modal.open({ title: 'Confirmar pago de la cuota', body: '<form id="fMP" data-form="memb-pago" class="f"><input type="hidden" name="id" value="' + esc(m.id) + '"><p>' + esc(U.nombreCorto(U.nombreDe(m.dni))) + ' · ' + esc(pl.n) + ' · <b>' + esc(money(pl.cent)) + '</b></p>' +
      (pl.cent > 0 ? fl('Medio de la donación', '<select class="in" name="medio">' + Object.keys(CM.MEDIOS).map(function (k) { return opt(k, CM.MEDIOS[k]); }).join('') + '</select>') + '<label class="chk"><input type="checkbox" name="fc"><span>Emitir Factura C simulada</span></label><div class="note info">Se registra una donación voluntaria (entra a la caja abierta y al dashboard). Sólo confirmá si ya recibiste el aporte.</div>' : '<div class="note info">Cuota bonificada: no genera aporte.</div>') +
      '</form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fMP">Confirmar pago recibido</button>' });
  };
  CM.forms['memb-pago'] = function (f) {
    var e = f.elements, m = sel(CM.db.membresias, e.id.value), pl = CM.plan(m.plan);
    if (pl.cent > 0) {
      var a = { id: CM.nextId('A'), fecha: CM.hoy(), ts: new Date().toISOString(), dni: m.dni, disp: '', cent: pl.cent, medio: e.medio.value, concepto: 'Contribución', obs: 'Cuota de socio/a · ' + pl.n, user: CM.db.cfg.operador, estado: 'registrado', comp: '' };
      CM.db.aportes.push(a); CM.audit('Donación voluntaria', a.id + ' · cuota de socio · ' + money(a.cent));
      if (e.fc && e.fc.checked) { var c = CM.emitirFacturaC(a); CM.audit('Factura C simulada', c.pv + '-' + c.nro + ' · ' + a.id); }
    }
    var base = m.pagadoHasta && m.pagadoHasta >= CM.hoy() ? m.pagadoHasta : CM.hoy();
    m.pagadoHasta = addMonths(base, pl.per === 'anual' ? 12 : 1);
    CM.audit('Membresía: pago confirmado', m.id + ' · hasta ' + m.pagadoHasta); CM.save(); CM.modal.close(true); render(); CM.toast('Pago confirmado: membresía activa.');
  };
  CM.acts['memb-pausa'] = function (t) { if (!CM.need('fidelizacion', 'edit')) return; var m = sel(CM.db.membresias, t.getAttribute('data-id')); m.estado = m.estado === 'pausada' ? 'ok' : 'pausada'; CM.audit('Membresía ' + (m.estado === 'pausada' ? 'pausada' : 'reanudada'), m.id); CM.save(); render(); };
  CM.acts['memb-cancel'] = function (t) {
    if (!CM.need('fidelizacion', 'edit')) return;
    CM.modal.open({ title: 'Cancelar membresía', body: '<p>La cancelación es inmediata y no borra el historial de cuotas.</p>', footer: '<button class="btn" data-act="modal-close">Volver</button><button class="btn bad" data-act="memb-cancel-ok" data-id="' + esc(t.getAttribute('data-id')) + '">Cancelar membresía</button>' });
  };
  CM.acts['memb-cancel-ok'] = function (t) { var m = sel(CM.db.membresias, t.getAttribute('data-id')); m.estado = 'cancelada'; CM.audit('Membresía cancelada', m.id); CM.save(); CM.modal.close(true); render(); };

  /* ===================================================================
     PERSONAL Y FICHAJE
     =================================================================== */
  CM.per = { tab: 'terminal', mes: '' };
  VIEWS.personal = function () {
    var f = CM.per, db = CM.db, mes = f.mes || CM.mesActual();
    var head = pageH('Personal y fichaje', 'Equipo de la fundación, terminal de fichaje y planilla de horas. Los datos del personal son ficticios.');
    var tb = tabs([['terminal', 'Terminal de fichaje'], ['equipo', 'Equipo'], ['horas', 'Planilla de horas']], f.tab, 'per-tab');
    if (f.tab === 'terminal') {
      var ult = db.fichas.slice().sort(function (a, b) { return b.ts.localeCompare(a.ts); }).slice(0, 10), nfc = ('NDEFReader' in g);
      return head + tb + '<div class="grid g2"><section class="card"><h2>Fichar entrada o salida</h2><form data-form="fichar" class="f" autocomplete="off" novalidate>' + fl('Tarjeta NFC, QR o DNI del empleado', '<input class="in" name="cod" autocomplete="off" placeholder="Pasá la tarjeta o escribí el DNI" style="font-size:18px">') +
        '<p class="err" role="alert" data-err></p><div class="note ok" data-res hidden></div><div class="row"><button class="btn pri" type="submit">' + CM.icon('clock') + 'Fichar</button><button class="btn" type="button" data-act="fichar-nfc">' + CM.icon('nfc') + 'Simular lectura NFC</button></div></form>' +
        '<ul class="hint" style="padding-left:18px"><li>Una persona no puede fichar dos veces en menos de 60 segundos.</li><li>Una tarjeta o QR con firma falsa se rechaza.</li><li>Si el navegador no tiene NFC, se ficha con el lector USB (teclea el código) o a mano.</li></ul></section>' +
        '<section class="card"><h2>Dispositivos</h2><div class="kv"><div><small>NFC en este navegador</small><b>' + (nfc ? 'Disponible (Web NFC), sin probar con tarjeta real' : 'No disponible aquí') + '</b></div><div><small>Lector de huellas</small><b>Pendiente de prueba física</b></div></div><div class="note warn" style="margin-top:10px">La huella es un dato biométrico de alto riesgo: no se habilita hasta contar con un lector probado y la revisión legal <b>[VERIFICAR con asesor/a legal]</b>.</div>' +
        '<h3 style="margin-top:14px">Últimas fichadas</h3><div class="tw"><table><thead><tr><th>Fecha y hora</th><th>Persona</th><th>Tipo</th><th>Método</th></tr></thead><tbody>' + ult.map(function (x) { return '<tr><td>' + esc(CM.fmtFH(x.ts)) + '</td><td>' + esc(empNom(x.emp)) + '</td><td>' + (x.tipo === 'entrada' ? '<span class="pill p-ok">Entrada</span>' : '<span class="pill p-info">Salida</span>') + '</td><td>' + esc(x.metodo) + '</td></tr>'; }).join('') + '</tbody></table></div></section></div>';
    }
    if (f.tab === 'equipo') {
      return head + tb + '<section class="card"><div class="row sp"><h2>Equipo</h2><button class="btn pri sm" data-act="emp-nuevo">' + CM.icon('plus') + 'Alta de persona</button></div><div class="tw"><table><thead><tr><th>Persona</th><th>Cargo</th><th>Área</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + db.staff.map(function (e) {
        return '<tr' + (e.activo ? '' : ' class="anulada"') + '><td><b>' + esc(e.nombre) + '</b><br><small class="hint">DNI ' + esc(e.dni) + '</small></td><td>' + esc(e.cargo) + '</td><td>' + esc(e.area) + '</td><td>' + (e.activo ? '<span class="pill p-ok">Activo/a</span>' : '<span class="pill p-mu">Baja</span>') + '</td><td class="acts"><button class="btn sm" data-act="emp-carnet" data-id="' + esc(e.id) + '">' + CM.icon('qr') + 'Carnet QR</button><button class="btn sm" data-act="emp-edit" data-id="' + esc(e.id) + '">Editar</button></td></tr>';
      }).join('') + '</tbody></table></div></section>';
    }
    // horas
    var meses = {}; meses[CM.mesActual()] = 1; db.fichas.forEach(function (x) { meses[x.fecha.slice(0, 7)] = 1; });
    var rows = db.staff.map(function (e) {
      var dias = {}; db.fichas.forEach(function (x) { if (x.emp === e.id && x.fecha.slice(0, 7) === mes) dias[x.fecha] = 1; });
      var tot = 0, n = 0; Object.keys(dias).forEach(function (d) { var m = CM.minutosDia(e.id, d); if (m > 0) { tot += m; n++; } });
      return { e: e, n: n, tot: tot };
    });
    return head + tb + '<section class="card"><div class="row" style="margin-bottom:12px"><label class="sr" for="phMes">Mes</label><select id="phMes" class="in fx">' + Object.keys(meses).sort().reverse().map(function (m) { return opt(m, m.slice(5) + '/' + m.slice(0, 4), m === mes); }).join('') + '</select><button class="btn sm" data-act="horas-csv">' + CM.icon('dl') + 'Exportar CSV</button></div>' +
      '<div class="tw"><table><thead><tr><th>Persona</th><th class="n">Días con jornada completa</th><th class="n">Horas trabajadas</th><th class="n">Promedio diario</th><th></th></tr></thead><tbody>' + rows.map(function (r) {
        return '<tr><td>' + esc(r.e.nombre) + '</td><td class="n">' + r.n + '</td><td class="n">' + esc(CM.fmtHM(r.tot)) + '</td><td class="n">' + (r.n ? esc(CM.fmtHM(Math.round(r.tot / r.n))) : '—') + '</td><td><button class="btn sm" data-act="horas-det" data-id="' + esc(r.e.id) + '">Detalle</button></td></tr>';
      }).join('') + '</tbody></table></div><p class="hint">Sólo cuentan jornadas con entrada y salida registradas el mismo día. Referencia de jornada y registro: Ley 20.744 <b>[VERIFICAR con asesor/a laboral]</b>.</p></section>';
  };
  CM.acts['per-tab'] = function (t) { CM.per.tab = t.getAttribute('data-v'); render(); };
  document.addEventListener('change', function (ev) { if (ev.target.id === 'phMes') { CM.per.mes = ev.target.value; render(); } });
  function resFicha(f, r, ok) {
    var box = $('[data-res]', f), er = $('[data-err]', f);
    if (ok) { er.textContent = ''; box.hidden = false; box.textContent = r; } else { box.hidden = true; er.textContent = r; }
  }
  CM.forms.fichar = function (f) {
    var r = CM.fichar(f.elements.cod.value, /^EMP-/i.test(f.elements.cod.value) ? 'QR / tarjeta' : 'DNI manual');
    if (r.err) { resFicha(f, r.err, false); return; }
    CM.audit('Fichada', r.emp.nombre + ' · ' + r.ok.tipo); CM.save();
    render(); var nf = $('form[data-form="fichar"]'); if (nf) resFicha(nf, (r.ok.tipo === 'entrada' ? 'Entrada' : 'Salida') + ' registrada: ' + r.emp.nombre + ' a las ' + CM.fmtFH(r.ok.ts).slice(-5) + '.', true);
  };
  CM.acts['fichar-nfc'] = function (t) {
    var act = CM.db.staff.filter(function (e) { return e.activo; }); if (!act.length) return;
    var f = t.closest('form'), pick = act[Math.floor(Math.random() * act.length)];
    var r = CM.fichar(CM.tokenEmp(pick), 'NFC (simulado)');
    if (r.err) { resFicha(f, r.err, false); return; }
    CM.audit('Fichada', r.emp.nombre + ' · ' + r.ok.tipo + ' · NFC simulado'); CM.save(); render();
    var nf = $('form[data-form="fichar"]'); if (nf) resFicha(nf, 'Lectura NFC simulada → ' + (r.ok.tipo === 'entrada' ? 'entrada' : 'salida') + ' de ' + r.emp.nombre + '.', true);
  };
  CM.acts['horas-csv'] = function () {
    var mes = CM.per.mes || CM.mesActual(), rows = [];
    CM.db.staff.forEach(function (e) { CM.db.fichas.filter(function (x) { return x.emp === e.id && x.fecha.slice(0, 7) === mes; }).sort(function (a, b) { return a.ts.localeCompare(b.ts); }).forEach(function (x) { rows.push([e.nombre, x.fecha, x.tipo, CM.fmtFH(x.ts), x.metodo]); }); });
    CM.descargar('fichadas_' + mes + '.csv', CM.csv(['Persona', 'Fecha', 'Tipo', 'Fecha y hora', 'Metodo'], rows));
  };
  CM.acts['horas-det'] = function (t) {
    var e = sel(CM.db.staff, t.getAttribute('data-id')), mes = CM.per.mes || CM.mesActual(), dias = {};
    CM.db.fichas.forEach(function (x) { if (x.emp === e.id && x.fecha.slice(0, 7) === mes) dias[x.fecha] = 1; });
    CM.modal.open({ title: 'Jornadas de ' + e.nombre, body: '<div class="tw"><table><thead><tr><th>Día</th><th>Fichadas</th><th class="n">Horas</th></tr></thead><tbody>' + Object.keys(dias).sort().map(function (d) {
      var fs = CM.db.fichas.filter(function (x) { return x.emp === e.id && x.fecha === d; }).sort(function (a, b) { return a.ts.localeCompare(b.ts); });
      return '<tr><td>' + esc(CM.fmtFecha(d)) + '</td><td>' + fs.map(function (x) { return esc(x.tipo + ' ' + CM.fmtFH(x.ts).slice(-5)); }).join(' · ') + '</td><td class="n">' + esc(CM.fmtHM(CM.minutosDia(e.id, d))) + '</td></tr>';
    }).join('') + '</tbody></table></div>', footer: '<button class="btn" data-act="modal-close">Cerrar</button>', wide: true });
  };
  function modalEmp(e) {
    var edit = !!e;
    CM.modal.open({ title: edit ? 'Editar persona' : 'Alta de persona', body: '<form id="fEM" data-form="emp" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(edit ? e.id : '') + '">' + fl('Nombre y apellido *', '<input class="in" name="nombre" value="' + esc(edit ? e.nombre : '') + '">') +
      '<div class="f f2">' + fl('DNI *', '<input class="in" name="dni" inputmode="numeric" maxlength="9" value="' + esc(edit ? e.dni : '') + '">') + fl('Teléfono', '<input class="in" name="tel" inputmode="tel" value="' + esc(edit ? e.tel : '') + '">') + '</div>' +
      '<div class="f f2">' + fl('Cargo *', '<input class="in" name="cargo" value="' + esc(edit ? e.cargo : '') + '">') + fl('Área', '<input class="in" name="area" value="' + esc(edit ? e.area : '') + '">') + '</div>' +
      (edit ? '<label class="chk"><input type="checkbox" name="activo"' + (e.activo ? ' checked' : '') + '><span>Activo/a (desmarcar = baja, sin borrar el historial)</span></label>' : '') + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fEM">Guardar</button>' });
  }
  CM.acts['emp-nuevo'] = function () { if (CM.need('personal', 'edit')) modalEmp(null); };
  CM.acts['emp-edit'] = function (t) { if (CM.need('personal', 'edit')) modalEmp(sel(CM.db.staff, t.getAttribute('data-id'))); };
  CM.forms.emp = function (f) {
    var e = f.elements, dni = CM.soloDigitos(e.dni.value), n = e.nombre.value.trim();
    if (n.length < 3) return fail(f, 'nombre', 'Escribí nombre y apellido.');
    if (dni.length < 6 || dni.length > 9) return fail(f, 'dni', 'El DNI debe tener entre 6 y 9 números.');
    if (!e.cargo.value.trim()) return fail(f, 'cargo', 'Escribí el cargo.');
    if (CM.db.staff.some(function (x) { return x.dni === dni && x.id !== e.id.value; })) return fail(f, 'dni', 'Ya hay una persona con ese DNI.');
    var x = e.id.value ? sel(CM.db.staff, e.id.value) : null;
    if (x) { x.nombre = n; x.dni = dni; x.tel = e.tel.value.trim(); x.cargo = e.cargo.value.trim(); x.area = e.area.value.trim(); x.activo = e.activo.checked; CM.audit('Personal editado', x.id + ' · ' + n); }
    else { x = { id: CM.idRand('E'), nombre: n, dni: dni, tel: e.tel.value.trim(), cargo: e.cargo.value.trim(), area: e.area.value.trim(), activo: true }; CM.db.staff.push(x); CM.audit('Personal: alta', x.id + ' · ' + n); }
    CM.save(); CM.modal.close(true); render(); CM.toast('Guardado.');
  };
  function carnetHtml(e) {
    return '<div class="tarj"><div class="tj-h"><img src="assets/logo.png" alt="Cannabismatica"></div><div class="tj-b"><div class="tj-n">' + esc(e.nombre) + '</div><div class="tj-d">' + esc(e.cargo) + '</div></div><div class="tj-q">' + CM.qrSvg(CM.tokenEmp(e)) + '</div><div class="tj-f">Carnet de personal · ejemplo</div></div>';
  }
  CM.acts['emp-carnet'] = function (t) {
    var e = sel(CM.db.staff, t.getAttribute('data-id'));
    CM.modal.open({ title: 'Carnet de ' + e.nombre, body: '<div class="tarj-wrap">' + carnetHtml(e) + '</div><p class="hint">Código firmado: <code>' + esc(CM.tokenEmp(e)) + '</code>. Se puede grabar en una tarjeta NFC o imprimir como QR.</p>', footer: '<button class="btn" data-act="modal-close">Cerrar</button><button class="btn pri" data-act="carnet-print" data-id="' + esc(e.id) + '">' + CM.icon('print') + 'Imprimir</button>' });
  };
  CM.acts['carnet-print'] = function (t) { CM.imprimir('<div class="tarj-wrap print">' + carnetHtml(sel(CM.db.staff, t.getAttribute('data-id'))) + '</div>'); };

  /* ===================================================================
     TAREAS Y ORGANIGRAMA
     =================================================================== */
  CM.tar = { tab: 'tablero', resp: '' };
  var COLS = [['pend', 'Pendiente'], ['curso', 'En curso'], ['rev', 'En revisión'], ['hecha', 'Hecha']];
  var PRI = { alta: ['Alta', 'p-bad'], media: ['Media', 'p-warn'], baja: ['Baja', 'p-mu'] };
  VIEWS.tareas = function () {
    var f = CM.tar, db = CM.db;
    var head = pageH('Tareas y organigrama', 'Tablero de trabajo del equipo y estructura de la fundación.');
    var tb = tabs([['tablero', 'Tablero de tareas'], ['org', 'Organigrama']], f.tab, 'tar-tab');
    if (f.tab === 'org') {
      var hijos = function (pid) { return db.org.filter(function (n) { return n.parent === pid; }); };
      var nodo = function (n) {
        var kids = hijos(n.id), em = n.emp ? sel(db.staff, n.emp) : null;
        return '<li><div class="onode"><b>' + esc(n.n) + '</b><small>' + esc(n.cargo) + '</small>' + (em ? '<span class="pill p-info">' + esc(empNom(n.emp)) + '</span>' : '') + '<span class="acts"><button class="btn sm" data-act="org-edit" data-id="' + esc(n.id) + '" aria-label="Editar ' + esc(n.n) + '">' + CM.icon('edit') + '</button><button class="btn sm" data-act="org-add" data-id="' + esc(n.id) + '" aria-label="Agregar área dentro de ' + esc(n.n) + '">' + CM.icon('plus') + '</button></span></div>' + (kids.length ? '<ul>' + kids.map(nodo).join('') + '</ul>' : '') + '</li>';
      };
      return head + tb + '<section class="card"><div class="row sp"><h2>Organigrama</h2><button class="btn pri sm" data-act="org-add" data-id="">' + CM.icon('plus') + 'Nueva área</button></div><div class="orgwrap"><ul class="org">' + hijos('').map(nodo).join('') + '</ul></div><p class="hint">Cada recuadro se puede editar; con «+» se agrega un área dependiente.</p></section>';
    }
    var tareas = db.tareas.filter(function (t) { return !f.resp || t.resp === f.resp; });
    var h = CM.hoy();
    return head + tb + '<div class="row" style="margin-bottom:12px"><label class="sr" for="tarResp">Filtrar por responsable</label><select id="tarResp" class="in fx">' + opt('', 'Todo el equipo', !f.resp) + db.staff.map(function (e) { return opt(e.id, e.nombre, f.resp === e.id); }).join('') + '</select><button class="btn pri sm" data-act="tar-nueva">' + CM.icon('plus') + 'Nueva tarea</button></div>' +
      '<div class="kanban">' + COLS.map(function (c, ci) {
        var arr = tareas.filter(function (t) { return t.col === c[0]; });
        return '<section class="kcol" data-col="' + c[0] + '" aria-label="' + c[1] + '"><h3>' + c[1] + ' <span class="pill p-mu">' + arr.length + '</span></h3>' + arr.map(function (t) {
          var vencida = t.vence && t.vence < h && t.col !== 'hecha';
          return '<article class="kcard" draggable="true" data-id="' + esc(t.id) + '"><b>' + esc(t.t) + '</b>' + (t.d ? '<p>' + esc(t.d) + '</p>' : '') + '<div class="row"><span class="pill ' + PRI[t.pri][1] + '">' + PRI[t.pri][0] + '</span>' + (t.vence ? '<span class="pill ' + (vencida ? 'p-bad' : 'p-mu') + '">' + (vencida ? 'Vencida ' : 'Vence ') + esc(CM.fmtFecha(t.vence)) + '</span>' : '') + '</div><small class="hint">' + esc(empNom(t.resp)) + '</small><div class="row kb"><button class="btn sm" data-act="tar-mov" data-id="' + esc(t.id) + '" data-d="-1"' + (ci === 0 ? ' disabled' : '') + ' aria-label="Mover a la columna anterior">' + CM.icon('left') + '</button><button class="btn sm" data-act="tar-mov" data-id="' + esc(t.id) + '" data-d="1"' + (ci === 3 ? ' disabled' : '') + ' aria-label="Mover a la columna siguiente">' + CM.icon('right') + '</button><button class="btn sm" data-act="tar-edit" data-id="' + esc(t.id) + '">Editar</button></div></article>';
        }).join('') + (arr.length ? '' : '<p class="hint">Sin tareas.</p>') + '</section>';
      }).join('') + '</div><p class="hint">Podés arrastrar las tarjetas entre columnas o usar las flechas (en pantallas táctiles).</p>';
  };
  CM.acts['tar-tab'] = function (t) { CM.tar.tab = t.getAttribute('data-v'); render(); };
  document.addEventListener('change', function (ev) { if (ev.target.id === 'tarResp') { CM.tar.resp = ev.target.value; render(); } });
  function moverTarea(id, col) {
    var t = sel(CM.db.tareas, id); if (!t || t.col === col) return;
    if (!CM.need('tareas', 'oper')) return;
    CM.audit('Tarea movida', t.id + ' · ' + t.col + ' → ' + col); t.col = col; CM.save(); render();
  }
  CM.acts['tar-mov'] = function (t) {
    var tk = sel(CM.db.tareas, t.getAttribute('data-id')), i = COLS.map(function (c) { return c[0]; }).indexOf(tk.col) + parseInt(t.getAttribute('data-d'), 10);
    if (i >= 0 && i < COLS.length) moverTarea(tk.id, COLS[i][0]);
  };
  document.addEventListener('dragstart', function (ev) { var c = ev.target.closest && ev.target.closest('.kcard'); if (c) { try { ev.dataTransfer.setData('text/plain', c.getAttribute('data-id')); ev.dataTransfer.effectAllowed = 'move'; } catch (e) { /* nada */ } } });
  document.addEventListener('dragover', function (ev) { if (ev.target.closest && ev.target.closest('.kcol')) ev.preventDefault(); });
  document.addEventListener('drop', function (ev) {
    var col = ev.target.closest && ev.target.closest('.kcol'); if (!col) return;
    ev.preventDefault(); var id = ''; try { id = ev.dataTransfer.getData('text/plain'); } catch (e) { /* nada */ }
    if (id) moverTarea(id, col.getAttribute('data-col'));
  });
  function modalTarea(t) {
    var edit = !!t;
    CM.modal.open({ title: edit ? 'Editar tarea' : 'Nueva tarea', body: '<form id="fTA" data-form="tarea" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(edit ? t.id : '') + '">' + fl('Título *', '<input class="in" name="t" value="' + esc(edit ? t.t : '') + '">') + fl('Descripción', '<textarea class="in" name="d">' + esc(edit ? t.d : '') + '</textarea>') +
      '<div class="f f2">' + fl('Responsable', '<select class="in" name="resp">' + CM.db.staff.filter(function (e) { return e.activo; }).map(function (e) { return opt(e.id, e.nombre, edit && t.resp === e.id); }).join('') + '</select>') + fl('Prioridad', '<select class="in" name="pri">' + Object.keys(PRI).map(function (k) { return opt(k, PRI[k][0], edit && t.pri === k); }).join('') + '</select>') + '</div>' +
      '<div class="f f2">' + fl('Vencimiento', '<input class="in" type="date" name="vence" value="' + esc(edit ? t.vence : '') + '">') + fl('Columna', '<select class="in" name="col">' + COLS.map(function (c) { return opt(c[0], c[1], edit ? t.col === c[0] : c[0] === 'pend'); }).join('') + '</select>') + '</div><p class="err" role="alert" data-err></p></form>',
      footer: (edit ? '<button class="btn bad" type="button" data-act="tar-del" data-id="' + esc(t.id) + '">Eliminar</button>' : '') + '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fTA">Guardar</button>' });
  }
  CM.acts['tar-nueva'] = function () { if (CM.need('tareas', 'oper')) modalTarea(null); };
  CM.acts['tar-edit'] = function (t) { if (CM.need('tareas', 'oper')) modalTarea(sel(CM.db.tareas, t.getAttribute('data-id'))); };
  CM.forms.tarea = function (f) {
    var e = f.elements, ti = e.t.value.trim();
    if (ti.length < 3) return fail(f, 't', 'Escribí un título.');
    var x = e.id.value ? sel(CM.db.tareas, e.id.value) : null;
    if (x) { x.t = ti; x.d = e.d.value.trim(); x.resp = e.resp.value; x.pri = e.pri.value; x.vence = e.vence.value; x.col = e.col.value; CM.audit('Tarea editada', x.id); }
    else { x = { id: CM.nextId('T').replace('T-0000', 'T-'), t: ti, d: e.d.value.trim(), resp: e.resp.value, pri: e.pri.value, vence: e.vence.value, col: e.col.value }; CM.db.tareas.push(x); CM.audit('Tarea creada', x.id + ' · ' + ti); }
    CM.save(); CM.modal.close(true); render(); CM.toast('Tarea guardada.');
  };
  CM.acts['tar-del'] = function (t) {
    CM.db.tareas = CM.db.tareas.filter(function (x) { return x.id !== t.getAttribute('data-id'); }); CM.audit('Tarea eliminada', t.getAttribute('data-id')); CM.save(); CM.modal.close(true); render();
  };
  /* organigrama */
  function descendientes(id) { var r = [id]; CM.db.org.forEach(function (n) { if (n.parent === id) r = r.concat(descendientes(n.id)); }); return r; }
  function modalOrg(n, parent) {
    var edit = !!n, ex = edit ? descendientes(n.id) : [];
    CM.modal.open({ title: edit ? 'Editar área' : 'Nueva área', body: '<form id="fOR" data-form="org" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(edit ? n.id : '') + '">' + fl('Nombre del área *', '<input class="in" name="n" value="' + esc(edit ? n.n : '') + '">') + fl('Función', '<input class="in" name="cargo" value="' + esc(edit ? n.cargo : '') + '">') +
      fl('Depende de', '<select class="in" name="parent">' + opt('', '— Es el nivel superior —', edit ? n.parent === '' : parent === '') + CM.db.org.filter(function (o) { return ex.indexOf(o.id) < 0; }).map(function (o) { return opt(o.id, o.n, edit ? n.parent === o.id : parent === o.id); }).join('') + '</select>') +
      fl('Persona a cargo', '<select class="in" name="emp">' + opt('', '— Sin asignar —', !edit || !n.emp) + CM.db.staff.map(function (e) { return opt(e.id, e.nombre, edit && n.emp === e.id); }).join('') + '</select>') + '<p class="err" role="alert" data-err></p></form>',
      footer: (edit ? '<button class="btn bad" type="button" data-act="org-del" data-id="' + esc(n.id) + '">Quitar</button>' : '') + '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fOR">Guardar</button>' });
  }
  CM.acts['org-edit'] = function (t) { if (CM.need('tareas', 'edit')) modalOrg(sel(CM.db.org, t.getAttribute('data-id')), ''); };
  CM.acts['org-add'] = function (t) { if (CM.need('tareas', 'edit')) modalOrg(null, t.getAttribute('data-id')); };
  CM.forms.org = function (f) {
    var e = f.elements, n = e.n.value.trim();
    if (n.length < 2) return fail(f, 'n', 'Escribí el nombre del área.');
    var x = e.id.value ? sel(CM.db.org, e.id.value) : null;
    if (x) { x.n = n; x.cargo = e.cargo.value.trim(); x.parent = e.parent.value; x.emp = e.emp.value; CM.audit('Organigrama editado', x.id + ' · ' + n); }
    else { CM.db.org.push({ id: 'O' + (++CM.db.counters.O), n: n, cargo: e.cargo.value.trim(), parent: e.parent.value, emp: e.emp.value }); CM.audit('Organigrama: área nueva', n); }
    CM.save(); CM.modal.close(true); render();
  };
  CM.acts['org-del'] = function (t) {
    var id = t.getAttribute('data-id');
    if (CM.db.org.some(function (o) { return o.parent === id; })) { CM.toast('Esa área tiene áreas dependientes: movelas primero.', true); return; }
    CM.db.org = CM.db.org.filter(function (o) { return o.id !== id; }); CM.audit('Organigrama: área quitada', id); CM.save(); CM.modal.close(true); render();
  };
})(window);
