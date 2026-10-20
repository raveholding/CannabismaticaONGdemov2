/* Sistema VB ONG · Google Drive de la ONG (opcional)
   - Cuenta propia de la ONG; permiso mínimo "drive.file" (sólo ve y toca lo que crea este sistema).
   - El Client ID es público (no es un secreto) y lo carga la ONG en esta pantalla. No se guarda ninguna clave ni token: el token vive sólo en memoria.
   - Nunca pisa archivos: cada guardado es un archivo NUEVO con nombre único (ciclo + fecha + versión + huella del contenido).
     Si el contenido es idéntico a una versión ya guardada, no vuelve a subir (idempotencia por huella).
   - Todo es [VERIFICAR] contra la documentación oficial de Google antes de usarlo en producción. Probado con un Google simulado; falta probarlo con una cuenta real. */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, fl = U.fl, fail = U.fail;
  var render = function () { CM.render(); };
  var SCOPE = 'https://www.googleapis.com/auth/drive.file';
  var GSI = 'https://accounts.google.com/gsi/client';
  var API = 'https://www.googleapis.com/drive/v3/files';
  var UP = 'https://www.googleapis.com/upload/drive/v3/files';
  var tok = { v: '', exp: 0 };          /* token sólo en memoria */
  var est = { msg: '', bad: false, busy: false };

  function cid() { return (CM.db.ong && CM.db.ong.driveClientId) || ''; }
  function conectado() { return !!tok.v && Date.now() < tok.exp; }
  CM.driveConectado = conectado;
  function q(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

  /* ---------- conexión ---------- */
  function cargarGsi() {
    return new Promise(function (ok, no) {
      if (g.google && g.google.accounts && g.google.accounts.oauth2) return ok();
      var s = document.createElement('script'); s.src = GSI; s.async = true;
      s.onload = function () { ok(); }; s.onerror = function () { no(new Error('No se pudo cargar el servicio de acceso de Google (¿sin Internet o bloqueado?).')); };
      document.head.appendChild(s);
    });
  }
  function conectar() {
    if (!cid()) return Promise.reject(new Error('Primero cargá el Client ID de Google de la ONG.'));
    return cargarGsi().then(function () {
      return new Promise(function (ok, no) {
        var cl = g.google.accounts.oauth2.initTokenClient({
          client_id: cid(), scope: SCOPE, callback: function (r) {
            if (r && r.access_token) { tok.v = r.access_token; tok.exp = Date.now() + ((r.expires_in || 3000) - 60) * 1000; ok(); }
            else no(new Error((r && (r.error_description || r.error)) || 'Google no entregó el permiso.'));
          },
          error_callback: function (e) { no(new Error('Se canceló o falló el permiso de Google' + (e && e.type ? ' (' + e.type + ')' : '') + '.')); }
        });
        cl.requestAccessToken({ prompt: '' });
      });
    });
  }
  function asegurar() { return conectado() ? Promise.resolve() : conectar(); }
  function api(url, o) {
    o = o || {}; o.headers = Object.assign({ Authorization: 'Bearer ' + tok.v }, o.headers || {});
    return fetch(url, o).then(function (r) {
      if (r.status === 401) { tok.v = ''; throw new Error('El permiso de Google venció. Volvé a conectar.'); }
      if (!r.ok) throw new Error('Google respondió con un error (' + r.status + ').');
      return r.json();
    });
  }
  function listar(query) { return api(API + '?q=' + encodeURIComponent(query) + '&fields=' + encodeURIComponent('files(id,name,appProperties,webViewLink)') + '&pageSize=100&spaces=drive'); }

  /* carpeta propia de este sistema: se busca por clave (no por nombre) para no duplicarla */
  function carpeta(clave, nombre, parent) {
    return listar("mimeType='application/vnd.google-apps.folder' and trashed=false and appProperties has { key='vbongKey' and value='" + q(clave) + "' }").then(function (r) {
      if (r.files && r.files.length) return r.files[0];
      var meta = { name: nombre, mimeType: 'application/vnd.google-apps.folder', appProperties: { vbongKey: clave, vbong: '1' } };
      if (parent) meta.parents = [parent];
      return api(API + '?fields=id,name', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(meta) });
    });
  }
  function nombreLibre(carp, base) {
    function probar(n, i) {
      var nombre = i ? base.replace(/(\.[a-z]+)$/, '-' + (i + 1) + '$1') : base;
      return listar("name='" + q(nombre) + "' and '" + q(carp) + "' in parents and trashed=false").then(function (r) { return r.files && r.files.length ? (i > 20 ? Promise.reject(new Error('No se pudo armar un nombre único.')) : probar(n, i + 1)) : nombre; });
    }
    return probar(base, 0);
  }
  function subir(carp, nombre, texto, props) {
    var b = '----vbong' + Math.random().toString(36).slice(2), meta = { name: nombre, parents: [carp], mimeType: 'text/csv', appProperties: props };
    var body = '--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) + '\r\n--' + b + '\r\nContent-Type: text/csv; charset=UTF-8\r\n\r\n' + texto + '\r\n--' + b + '--';
    return api(UP + '?uploadType=multipart&fields=id,name,webViewLink', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body: body });
  }

  /* ---------- guardar la planilla de un ciclo ---------- */
  CM.driveGuardarCiclo = function (c) {
    var texto = CM.cultivoCsv(c), huella = CM.sha256(texto).slice(0, 12), drv = c.drive = c.drive || { versiones: [] };
    var ya = drv.versiones.filter(function (v) { return v.huella === huella; })[0];
    if (ya) return Promise.resolve({ repetido: true, nombre: ya.nombre });
    return asegurar().then(function () { return carpeta('cultivo|' + c.id, 'Sistema VB ONG · ' + c.id + ' · ' + c.nombre); }).then(function (cf) {
      /* ¿ya existe en Drive un archivo con esta huella? (por si se borró el registro local) */
      return listar("'" + q(cf.id) + "' in parents and trashed=false and appProperties has { key='vbongHuella' and value='" + q(c.id + '|' + huella) + "' }").then(function (r) {
        if (r.files && r.files.length) return { repetido: true, nombre: r.files[0].name, id: r.files[0].id, cf: cf };
        var ver = drv.versiones.length + 1, f = CM.hoy().replace(/-/g, '');
        var base = CM.cultivoNombreBase(c) + '_' + f + '_v' + ver + '_' + huella + '.csv';
        return nombreLibre(cf.id, base).then(function (nombre) {
          return subir(cf.id, nombre, texto, { vbong: '1', vbongHuella: c.id + '|' + huella, ciclo: c.id, version: String(ver) }).then(function (a) { return { nuevo: true, nombre: a.name, id: a.id, link: a.webViewLink, cf: cf, ver: ver }; });
        });
      });
    }).then(function (res) {
      if (res.nuevo) { drv.versiones.push({ ver: res.ver, nombre: res.nombre, id: res.id, huella: huella, ts: new Date().toISOString(), user: CM.db.cfg.operador, link: res.link || '' }); drv.carpetaId = res.cf.id; CM.audit('Drive: planilla guardada', c.id + ' · ' + res.nombre); CM.save(); }
      return res;
    });
  };

  /* carpeta del legajo de un paciente (nombre único: contiene el legajo) */
  CM.driveCarpetaPaciente = function (p) {
    return asegurar().then(function () { return carpeta('legajos-raiz', 'Legajos'); }).then(function (raiz) {
      return carpeta('legajo|' + p.leg, CM.nombreCarpetaLegajo(p), raiz.id);
    }).then(function (cf) {
      p.driveId = cf.id; CM.audit('Drive: carpeta de legajo', 'Legajo ' + p.leg); CM.save(); return cf;
    });
  };

  CM._drv = { api: api, asegurar: asegurar, carpeta: carpeta, listar: listar, conectado: conectado, API: API };

  /* ---------- pantalla ---------- */
  CM.driveHtml = function (c) {
    var drv = c.drive || { versiones: [] }, admin = CM.can('cultivo', 'admin'), oper = CM.can('cultivo', 'oper');
    var estado = !cid() ? '<span class="pill p-warn">Pendiente de configuración</span>' : conectado() ? '<span class="pill p-ok">Conectado</span>' : '<span class="pill">Sin conectar</span>';
    var vs = drv.versiones.length ? '<div class="tw" style="margin-top:8px"><table><thead><tr><th>Versión</th><th>Archivo en Drive (nombre único)</th><th>Guardado</th><th>Por</th></tr></thead><tbody>' + drv.versiones.slice().reverse().map(function (v) {
      return '<tr><td>v' + v.ver + '</td><td>' + (v.link && /^https:\/\//.test(v.link) ? '<a href="' + esc(v.link) + '" target="_blank" rel="noopener noreferrer">' + esc(v.nombre) + '</a>' : esc(v.nombre)) + '</td><td>' + esc(CM.fmtFecha(v.ts.slice(0, 10))) + '</td><td>' + esc(v.user) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '';
    return '<div class="card flat" style="margin-top:14px"><div class="row sp"><h3 style="margin:0">' + CM.icon('drive') + ' Google Drive de la ONG</h3>' + estado + '</div>' +
      '<p class="hint" style="margin:6px 0">Guarda una copia de la planilla en el Drive de la fundación. Cada guardado crea un <b>archivo nuevo con nombre único</b> (ciclo + fecha + versión + huella): nunca pisa ni duplica. Permiso mínimo: sólo ve lo que crea este sistema. ' + (cid() ? '' : 'Falta el Client ID de Google de la ONG [VERIFICAR en Google Cloud Console].') + '</p>' +
      (est.msg ? '<div class="note ' + (est.bad ? 'bad' : 'ok') + '" role="status">' + esc(est.msg) + '</div>' : '') +
      '<div class="row">' + (oper ? '<button class="btn pri" data-act="drv-guardar" data-id="' + esc(c.id) + '"' + (est.busy ? ' disabled' : '') + '>' + CM.icon('up') + (conectado() ? 'Guardar en Drive' : 'Conectar y guardar en Drive') + '</button>' : '') +
      (admin ? '<button class="btn" data-act="drv-config">' + CM.icon('gear') + 'Client ID de Google</button>' : '') + (conectado() ? '<button class="btn" data-act="drv-salir">Desconectar</button>' : '') + '</div>' + vs + '</div>';
  };
  CM.acts['drv-config'] = function () {
    if (!CM.need('cultivo', 'admin')) return;
    CM.modal.open({ title: 'Client ID de Google (Drive)', body: '<form id="fDV" data-form="drv-config" class="f" novalidate><p>Pegá el <b>ID de cliente OAuth</b> de la ONG (tipo “Aplicación web”) y agregá esta dirección como origen autorizado en Google Cloud. No es una clave secreta. <b>[VERIFICAR en la documentación oficial de Google]</b></p>' +
      fl('ID de cliente', '<input class="in" name="cid" autocomplete="off" spellcheck="false" placeholder="1234567890-abc….apps.googleusercontent.com" value="' + esc(cid()) + '">') + '<p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" type="button" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fDV">Guardar</button>' });
  };
  CM.forms['drv-config'] = function (f) {
    if (!CM.need('cultivo', 'admin')) return;
    var v = f.elements.cid.value.trim();
    if (v && !/^[0-9]{6,}-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(v)) return fail(f, 'cid', 'No parece un ID de cliente de Google (termina en .apps.googleusercontent.com).');
    CM.db.ong.driveClientId = v; tok.v = ''; CM.audit('Drive: Client ID ' + (v ? 'cargado' : 'quitado'), ''); CM.save(); CM.modal.close(true); render();
  };
  CM.acts['drv-salir'] = function () { tok.v = ''; est = { msg: 'Desconectado. Para revocar el permiso del todo, hacelo en tu cuenta de Google → Seguridad.', bad: false, busy: false }; CM.audit('Drive: desconectado', ''); CM.save(); render(); };
  CM.acts['drv-guardar'] = function (t) {
    var c = CM.cultivo(t.getAttribute('data-id')); if (!c || !CM.need('cultivo', 'oper') || est.busy) return;
    if (!cid()) { est = { msg: 'Pendiente de configuración: un administrador tiene que cargar el Client ID de Google.', bad: true, busy: false }; return render(); }
    est = { msg: 'Guardando en Drive…', bad: false, busy: true }; render();
    CM.driveGuardarCiclo(c).then(function (r) {
      est = { msg: r.repetido ? 'Esta versión ya estaba guardada en Drive (' + r.nombre + '). No se duplicó nada.' : 'Guardado en Drive como ' + r.nombre + '.', bad: false, busy: false };
    }).catch(function (e) { est = { msg: (e && e.message) || 'No se pudo guardar en Drive.', bad: true, busy: false }; }).then(function () { render(); });
  };
})(window);
