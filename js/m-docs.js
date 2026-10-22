/* Sistema VB ONG · Carpeta del legajo y «Documentos y escaneos» (SISTEMA_VB_ONGF 4.28.4)
   - UNA carpeta por legajo (Legajos/{legajo}_{DNI}). Se abre directo desde la ficha.
   - Subir un documento o una foto (cámara del celular): va a la carpeta del legajo con nombre único; queda registrado
     quién, cuándo, tipo, huella SHA-256 y versión. Nunca se pisa ni se duplica (misma huella = ya estaba).
   - Drive por SERVIDOR (cuenta de servicio de la ONG, sistema con nube): nadie conecta nada en ningún equipo.
     Drive por NAVEGADOR (sólo la demo, sin servidor): hace falta «Conectar Drive» en cada sesión.
   - Si Drive no está disponible, el archivo queda guardado EN ESTE EQUIPO como «pendiente de subir» y se sube solo después.
     Nunca se informa «subido» sin la respuesta de Google. Los datos clínicos no van a la auditoría (sólo legajo, tipo y huella). */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, fl = U.fl, fail = U.fail;
  var render = function () { CM.render(); };
  var MAX = 20 * 1024 * 1024, MAX_SRV = 10 * 1024 * 1024;
  var TIPOS_OK = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif' };
  CM.DOC_TIPOS = ['Consentimiento informado', 'REPROCANN', 'Historia clínica', 'Receta', 'Estudio', 'DNI', 'Otro'];
  var EJEMPLO = 'https://drive.google.com/drive/my-drive';
  var est = { busy: false };

  function asegurar(db) { if (!db.legDocs) db.legDocs = []; if (db.ong && !db.ong.driveSrv) db.ong.driveSrv = { raiz: '', carpetasAppSheet: [], cuenta: '' }; return db; }
  var init0 = CM.init;
  CM.init = function () { init0(); asegurar(CM.db); };

  /* ---------- modo de Drive ---------- */
  CM.driveModo = function () {
    var o = CM.db.ong || {}, srv = o.driveSrv || {};
    if (CM.nubeFn && srv.raiz) return 'servidor';          // sistema con nube + cuenta de servicio configurada
    if (o.driveClientId) return 'navegador';               // demo: conexión manual
    return 'pendiente';
  };
  function drv() { return CM._drv; }
  function carpetaUrl(p) {
    if (p.drive1 && p.drive1 !== EJEMPLO) return p.drive1;
    if (p.driveId) return 'https://drive.google.com/drive/folders/' + p.driveId;
    return '';
  }
  CM.carpetaUrl = carpetaUrl;

  /* ---------- cola local (IndexedDB): el archivo no se pierde aunque Drive no esté disponible ---------- */
  var IDB = 'vbong_docs_pend';
  function idb() {
    return new Promise(function (ok, no) {
      try { var r = g.indexedDB.open(IDB, 1); r.onupgradeneeded = function () { r.result.createObjectStore('f'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; }
      catch (e) { no(e); }
    });
  }
  function idbOp(modo, fn) { return idb().then(function (d) { return new Promise(function (ok, no) { var tx = d.transaction('f', modo), st = tx.objectStore('f'), r = fn(st); tx.oncomplete = function () { ok(r && r.result); }; tx.onerror = function () { no(tx.error); }; }); }); }
  var guardarLocal = function (id, blob) { return idbOp('readwrite', function (st) { return st.put(blob, id); }); };
  var leerLocal = function (id) { return idbOp('readonly', function (st) { return st.get(id); }); };
  var borrarLocal = function (id) { return idbOp('readwrite', function (st) { return st.delete(id); }); };

  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function huella(blob) { return blob.arrayBuffer().then(function (b) { return g.crypto.subtle.digest('SHA-256', b); }).then(hex); }
  function limpio(s) { return String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60); }

  /* ---------- subir a Drive (dos adaptadores, mismo resultado) ---------- */
  function subirNavegador(p, d, blob) {
    var D = drv(); if (!D) return Promise.reject(new Error('Drive no disponible.'));
    return CM.driveCarpetaPaciente(p).then(function (cf) {
      if (!p.drive1 || p.drive1 === EJEMPLO) p.drive1 = 'https://drive.google.com/drive/folders/' + cf.id;
      var q = "'" + cf.id + "' in parents and trashed=false and appProperties has { key='vbongHash' and value='" + d.hash + "' }";
      return D.listar(q).then(function (r) {
        if (r.files && r.files.length) return r.files[0];   // ya estaba en Drive (idempotente por huella)
        var b = '----vbong' + d.hash.slice(0, 16), meta = { name: d.nombreDrive, parents: [cf.id], mimeType: d.mime, appProperties: { vbong: '1', vbongHash: d.hash, vbongLegajo: p.leg, vbongTipo: d.tipo.slice(0, 40), vbongVersion: String(d.version) } };
        var cuerpo = new Blob(['--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) + '\r\n--' + b + '\r\nContent-Type: ' + d.mime + '\r\n\r\n', blob, '\r\n--' + b + '--']);
        return D.api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,md5Checksum', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body: cuerpo });
      });
    });
  }
  function subirServidor(p, d, blob) {
    if (blob.size > MAX_SRV) return Promise.reject(new Error('Por el servidor se suben archivos de hasta 10 MB. [VERIFICAR límite del proveedor]'));
    return blob.arrayBuffer().then(function (buf) {
      var u = new Uint8Array(buf), s = '', i; for (i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
      return CM.nubeFn('drive-legajos', { accion: 'subir', legajo: p.leg, dni: (CM.docPac(p) || {}).num || '', nombre: d.nombreDrive, mime: d.mime, hash: d.hash, tipo: d.tipo, version: d.version, b64: g.btoa(s) });
    }).then(function (r) { if (!r || !r.ok) throw new Error((r && r.error) || 'El servidor no confirmó la subida.'); if (r.carpeta && !carpetaUrl(p)) p.drive1 = 'https://drive.google.com/drive/folders/' + r.carpeta; return r.archivo; });
  }
  function subir(p, d) {
    var modo = CM.driveModo();
    if (modo === 'pendiente') return Promise.reject(new Error('Drive pendiente de configuración: el archivo queda guardado en este equipo.'));
    if (modo === 'navegador' && !(drv() && drv().conectado())) return Promise.reject(new Error('Drive sin conectar: el archivo queda guardado en este equipo.'));
    return leerLocal(d.id).then(function (blob) {
      if (!blob) throw new Error('El archivo pendiente ya no está en este equipo: subilo de nuevo.');
      return (modo === 'servidor' ? subirServidor : subirNavegador)(p, d, blob);
    }).then(function (f) {
      if (!f || !f.id) throw new Error('Google no confirmó la subida.');
      d.estado = 'subido'; d.fileId = f.id; d.url = f.webViewLink && /^https:\/\//.test(f.webViewLink) ? f.webViewLink : 'https://drive.google.com/file/d/' + f.id + '/view'; d.md5 = f.md5Checksum || ''; d.subido = new Date().toISOString();
      CM.audit('Documento del legajo subido a Drive', 'Legajo ' + p.leg + ' · ' + d.tipo + ' · v' + d.version + ' · huella ' + d.hash.slice(0, 12));
      CM.save();
      return borrarLocal(d.id).catch(function () { /* nada */ });
    });
  }
  CM.docsSubirPendientes = function (soloDni) {
    var pend = (CM.db.legDocs || []).filter(function (d) { return d.estado === 'pendiente' && (!soloDni || d.dni === soloDni); });
    var ok = 0, mal = 0, ult = '';
    return pend.reduce(function (pr, d) {
      return pr.then(function () { var p = CM.paciente(d.dni); if (!p) return; return subir(p, d).then(function () { ok++; }, function (e) { mal++; ult = e.message; d.error = e.message; CM.save(); }); });
    }, Promise.resolve()).then(function () { return { ok: ok, mal: mal, ult: ult }; });
  };
  /* reintento automático: cada 30 s si Drive está disponible */
  setInterval(function () {
    if (est.busy || !CM.db || !CM.db.legDocs) return;
    var m = CM.driveModo(); if (m === 'pendiente' || (m === 'navegador' && !(drv() && drv().conectado()))) return;
    if (!CM.db.legDocs.some(function (d) { return d.estado === 'pendiente'; })) return;
    est.busy = true; CM.docsSubirPendientes().then(function (r) { est.busy = false; if (r.ok) render(); });
  }, 30000);

  /* ---------- pantalla: carpeta del legajo ---------- */
  CM.carpetaLegajoHtml = function (p) {
    var u = carpetaUrl(p), modo = CM.driveModo(), oper = CM.can('pacientes', 'oper'), admin = CM.can('pacientes', 'admin');
    var estado = modo === 'servidor' ? '<span class="pill p-ok">Drive automático (servidor)</span>' : modo === 'navegador' ? (drv() && drv().conectado() ? '<span class="pill p-ok">Drive conectado</span>' : '<span class="pill">Drive sin conectar (demo)</span>') : '<span class="pill p-warn">Drive pendiente de configuración</span>';
    var h = '<section class="card drive" style="margin-top:14px"><div class="row sp"><div class="t">' + CM.icon('drive') + '<div><h3 style="margin:0">Carpeta del legajo · ' + esc(p.leg || '—') + '</h3><span class="hint">Una sola carpeta por legajo: ' + esc(CM.nombreCarpetaLegajo(p)) + '</span></div></div>' + estado + '</div>';
    if (u) {
      h += '<div class="row" style="margin-top:10px"><a class="btn pri" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + CM.icon('link') + 'Abrir carpeta del legajo</a><button class="btn sm" data-act="copiar" data-v="' + esc(u) + '">' + CM.icon('copy') + 'Copiar enlace</button></div>';
    } else if (p.drive1 === EJEMPLO) {
      h += '<div class="row" style="margin-top:10px"><a class="btn pri" href="' + esc(EJEMPLO) + '" target="_blank" rel="noopener noreferrer">' + CM.icon('link') + 'Abrir carpeta (enlace de ejemplo)</a></div><p class="hint">Dato de ejemplo de la demo: en el sistema real cada paciente tiene su propia carpeta, creada sola.</p>';
    } else {
      h += '<div class="note ' + (modo === 'servidor' ? 'info' : 'warn') + '" style="margin-top:10px">' + (modo === 'servidor' ? 'La carpeta se crea sola en el servidor; aparece acá en la próxima sincronización.' : 'Todavía no tiene carpeta.') + '</div>' +
        (oper && modo !== 'servidor' ? '<div class="row"><button class="btn pri" data-act="drive-crear" data-dni="' + esc(p.dni) + '">' + CM.icon('plus') + 'Crear carpeta del legajo</button></div>' : '') +
        (modo === 'pendiente' ? '<p class="hint">Con la nube del sistema real, la carpeta se crea sola con la cuenta de servicio de la ONG (nadie tiene que conectar nada).</p>' : '');
    }
    var extra = [];
    if (p.drive2) extra.push('<a href="' + esc(p.drive2) + '" target="_blank" rel="noopener noreferrer">carpeta anterior de historial clínico</a>');
    if (admin) extra.push('<button class="btn-link" data-act="drive-edit" data-dni="' + esc(p.dni) + '" data-w="1">vincular otra carpeta a mano</button>');
    if (extra.length) h += '<p class="hint" style="margin:8px 0 0">También: ' + extra.join(' · ') + '</p>';
    return h + CM.docsHtml(p) + '</section>';
  };

  /* ---------- pantalla: documentos y escaneos ---------- */
  CM.docsHtml = function (p) {
    var docs = (CM.db.legDocs || []).filter(function (d) { return d.dni === p.dni; }).sort(function (a, b) { return String(b.ts || b.fecha || '').localeCompare(String(a.ts || a.fecha || '')); });
    var oper = CM.can('pacientes', 'oper'), pend = docs.filter(function (d) { return d.estado === 'pendiente'; }).length;
    var pill = function (d) {
      if (d.estado === 'subido' || d.driveFileId) return '<span class="pill p-ok">En Drive</span>';
      if (d.estado === 'pendiente') return '<span class="pill p-warn" title="' + esc(d.error || '') + '">Pendiente de subir · guardado en este equipo</span>';
      return '<span class="pill p-warn">Sistema anterior · por vincular</span>';
    };
    var abrir = function (d) {
      var u = d.url || (d.driveFileId ? 'https://drive.google.com/file/d/' + d.driveFileId + '/view' : '');
      if (u && /^https:\/\//.test(u)) return '<a class="btn sm" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">Abrir</a>';
      if (d.legacyId) return '<a class="btn sm" target="_blank" rel="noopener noreferrer" href="https://drive.google.com/drive/search?q=' + encodeURIComponent(d.legacyId) + '">Buscar en Drive</a>';
      return '';
    };
    return '<div style="margin-top:16px;border-top:1px solid var(--line,#e5e5e5);padding-top:12px"><div class="row sp"><h3 style="margin:0">Documentos y escaneos (' + docs.length + ')</h3>' +
      (oper ? '<div class="row"><label class="btn pri" for="docFile" style="cursor:pointer">' + CM.icon('plus') + 'Subir documento</label><input type="file" id="docFile" data-dni="' + esc(p.dni) + '" accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" class="sr">' +
        '<label class="btn" for="docCam" style="cursor:pointer">' + CM.icon('eye') + 'Escanear con la cámara</label><input type="file" id="docCam" data-dni="' + esc(p.dni) + '" accept="image/*" capture="environment" class="sr"></div>' : '') + '</div>' +
      '<p class="hint" style="margin:6px 0">PDF o fotos, hasta 20 MB. Cada archivo va a la carpeta del legajo con nombre único; nunca se reemplaza uno anterior. Queda registrado quién lo subió y cuándo.</p>' +
      (pend && oper ? '<div class="note warn">' + pend + ' archivo(s) guardado(s) en este equipo, pendientes de subir a Drive. <button class="btn sm" data-act="docs-reintentar" data-dni="' + esc(p.dni) + '">Subir ahora</button></div>' : '') +
      (docs.length ? '<div class="tw"><table><thead><tr><th>Fecha</th><th>Documento</th><th>Tipo</th><th>Versión</th><th>Subió</th><th>Estado</th><th></th></tr></thead><tbody>' + docs.map(function (d) {
        return '<tr><td>' + esc(CM.fmtFecha(String(d.ts || d.fecha || '').slice(0, 10))) + '</td><td>' + esc(d.nombre) + '<br><small class="hint">' + esc(d.nombreDrive || d.ruta || '') + '</small></td><td>' + esc(d.tipo || d.ext || '—') + '</td><td>' + (d.version ? 'v' + esc(String(d.version)) : '—') + '</td><td>' + esc(d.user || (d.mig ? 'Migración' : '—')) + '</td><td>' + pill(d) + '</td><td>' + abrir(d) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="empty">Todavía no hay documentos en este legajo.</div>') + '</div>';
  };

  /* ---------- acciones ---------- */
  var elegido = null;
  document.addEventListener('change', function (ev) {
    var t = ev.target; if ((t.id !== 'docFile' && t.id !== 'docCam') || !t.files[0]) return;
    if (!CM.need('pacientes', 'oper')) { t.value = ''; return; }
    var f = t.files[0], dni = t.getAttribute('data-dni'); t.value = '';
    var mime = f.type === 'image/jpg' ? 'image/jpeg' : f.type;
    if (!TIPOS_OK[mime]) { CM.toast('Sólo PDF o fotos (JPG, PNG, WEBP, HEIC).', true); return; }
    if (f.size > MAX) { CM.toast('El archivo supera los 20 MB.', true); return; }
    if (!f.size) { CM.toast('El archivo está vacío.', true); return; }
    elegido = { blob: f, mime: mime, dni: dni, cam: t.id === 'docCam' };
    CM.modal.open({ title: 'Guardar en el legajo', body: '<form id="fDC" data-form="doc-subir" class="f" novalidate><p class="hint">' + esc(f.name || 'Foto de la cámara') + ' · ' + esc(CM.fmtNum(Math.round(f.size / 1024))) + ' KB</p>' +
      fl('Tipo de documento *', '<select class="in" name="tipo"><option value="">Elegí…</option>' + CM.DOC_TIPOS.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select>') +
      fl('Descripción (opcional)', '<input class="in" name="desc" maxlength="60" placeholder="Ej.: REPROCANN vigente 2029">') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fDC">Guardar</button>' });
  });
  CM.forms['doc-subir'] = function (f) {
    var e = f.elements, sel = elegido, p = sel && CM.paciente(sel.dni);
    if (!p || !CM.need('pacientes', 'oper')) return;
    var tipo = e.tipo.value; if (CM.DOC_TIPOS.indexOf(tipo) < 0) return fail(f, 'tipo', 'Elegí el tipo de documento.');
    var desc = limpio(e.desc.value);
    CM.modal.close(true);
    huella(sel.blob).then(function (h) {
      var docs = asegurar(CM.db).legDocs, ya = docs.filter(function (d) { return d.dni === p.dni && d.hash === h; })[0];
      if (ya) { CM.toast('Ese mismo archivo ya está en el legajo (' + CM.fmtFecha(String(ya.ts).slice(0, 10)) + '). No se duplicó.'); return; }
      var ver = docs.filter(function (d) { return d.dni === p.dni && d.tipo === tipo; }).length + 1;
      var ext = TIPOS_OK[sel.mime], fecha = CM.hoy().replace(/-/g, '');
      var d = { id: CM.idRand('DOC-'), dni: p.dni, nombre: desc || tipo, tipo: tipo, mime: sel.mime, ext: ext, size: sel.blob.size, hash: h, version: ver,
        nombreDrive: p.leg + '_' + limpio(tipo).replace(/\s+/g, '-') + '_' + fecha + '_v' + ver + '_' + h.slice(0, 8) + '.' + ext,
        ts: new Date().toISOString(), user: CM.db.cfg.operador, estado: 'pendiente', origen: sel.cam ? 'cámara' : 'archivo' };
      return guardarLocal(d.id, sel.blob).then(function () {
        docs.push(d);
        CM.audit('Documento agregado al legajo', 'Legajo ' + p.leg + ' · ' + tipo + ' · v' + ver + ' · huella ' + h.slice(0, 12));
        CM.save(); render();
        return subir(p, d).then(function () { render(); CM.toast('Documento guardado en la carpeta del legajo.'); }, function (err) { d.error = err.message; CM.save(); render(); CM.toast(err.message, true); });
      }, function () { CM.toast('Este navegador no permite guardar el archivo en el equipo y Drive no está disponible: no se guardó nada.', true); });
    }).catch(function () { CM.toast('No se pudo leer el archivo.', true); });
    return false;
  };
  CM.acts['docs-reintentar'] = function (t) {
    if (!CM.need('pacientes', 'oper') || est.busy) return;
    var m = CM.driveModo();
    var go = function () { est.busy = true; return CM.docsSubirPendientes(t.getAttribute('data-dni')).then(function (r) { est.busy = false; render(); CM.toast(r.ok + ' subido(s).' + (r.mal ? ' ' + r.mal + ' sin subir: ' + r.ult : ''), !!r.mal); }); };
    if (m === 'navegador' && !(drv() && drv().conectado())) { drv().asegurar().then(go, function (e) { CM.toast(e.message, true); }); return; }
    go();
  };
})(window);
