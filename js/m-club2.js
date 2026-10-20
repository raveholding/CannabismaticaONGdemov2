/* Sistema VB ONG · Club: lectura del QR de la tarjeta con la cámara (SISTEMA_VB_ONGF 4.27.3)
   Usa BarcodeDetector donde el navegador lo ofrece; si no, se avisa y quedan el lector USB, el código y el DNI. */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, fail = U.fail, VIEWS = CM.VIEWS;
  var render = function () { CM.render(); };
  var stream = null, timer = null, cb = null;

  CM.camaraQR = function () { return !!(g.BarcodeDetector && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); };
  function parar() {
    if (timer) { clearInterval(timer); timer = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    cb = null;
  }
  CM.pararCamara = parar;

  /* Token de la tarjeta: CM-S|<clave>|<firma>. Devuelve { dni } o { err } */
  CM.leerTokenSello = function (txt) {
    var m = /^\s*CM-S\|([^|]+)\|([0-9a-f]{8})\s*$/i.exec(String(txt || ''));
    if (!m) return null;
    var dni = m[1];
    if (!CM.paciente(dni)) return { err: 'La tarjeta no corresponde a ningún paciente de esta ONG.' };
    if (CM.firmaSello(dni) !== m[2].toLowerCase()) return { err: 'La firma de la tarjeta no es válida: puede estar falsificada. Usá el código o el DNI.' };
    return { dni: dni };
  };

  CM.acts['qr-escanear'] = function (t) {
    var destino = t.getAttribute('data-t') || 'sello';
    if (!CM.camaraQR()) {
      CM.toast('Este navegador no puede leer QR con la cámara. Usá un lector USB (escribe solo), el código de la tarjeta o el DNI.', true);
      return;
    }
    CM.modal.open({ title: 'Escanear tarjeta', body: '<p class="hint" style="margin-top:0">Apuntá la cámara al QR de la tarjeta. La imagen no se guarda.</p><video id="qrVid" playsinline muted style="width:100%;max-height:60vh;border-radius:12px;background:#000"></video><p class="err" role="alert" id="qrErr"></p>',
      footer: '<button class="btn" type="button" data-act="qr-cerrar">Cancelar</button>' });
    var vid = document.getElementById('qrVid'), det;
    try { det = new g.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { det = null; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (s) {
      stream = s; cb = function (code) { aplicar(destino, code); };
      if (!vid || !document.body.contains(vid)) { parar(); return; }
      vid.srcObject = s; vid.play().catch(function () { /* nada */ });
      timer = setInterval(function () {
        if (!document.body.contains(vid)) { parar(); return; }
        if (!det) return;
        det.detect(vid).then(function (r) { if (r && r.length && cb) { var c = r[0].rawValue, f = cb; parar(); CM.modal.close(true); f(c); } }).catch(function () { /* cuadro sin QR */ });
      }, 300);
    }).catch(function (e) {
      var er = document.getElementById('qrErr'); if (er) er.textContent = (e && e.name === 'NotAllowedError') ? 'Permiso de cámara denegado. Usá el código o el DNI.' : 'No se pudo abrir la cámara. Usá el código o el DNI.';
    });
  };
  CM.acts['qr-cerrar'] = function () { parar(); CM.modal.close(true); };
  function aplicar(destino, code) {
    if (destino === 'sello') {
      var r = CM.leerTokenSello(code);
      if (!r) { CM.toast('El QR no es una tarjeta del Club.', true); return; }
      if (r.err) { CM.toast(r.err, true); return; }
      var s = CM.otorgarSello(r.dni, 'Participación en taller');
      if (s.err) { CM.toast(s.err, true); return; }
      CM.audit('Sello otorgado', 'Legajo ' + CM.legDe(r.dni) + ' · ' + s.ok.id + ' · medio: QR con cámara'); CM.save(); render(); CM.toast('Sello otorgado a ' + U.nombreCorto(U.nombreDe(r.dni)) + '.');
    }
  }

  /* El campo del mostrador también acepta lo que escribe un lector USB (el contenido del QR) */
  var f0 = CM.forms.sello;
  CM.forms.sello = function (f) {
    var v = f.elements.dni.value, r = CM.leerTokenSello(v);
    if (r) {
      if (r.err) return fail(f, 'dni', r.err);
      f.elements.dni.value = r.dni;
      var s = CM.otorgarSello(r.dni, f.elements.motivo.value);
      if (s.err) return fail(f, 'dni', s.err);
      CM.audit('Sello otorgado', 'Legajo ' + CM.legDe(r.dni) + ' · ' + s.ok.id + ' · medio: QR (lector)'); CM.save(); render(); CM.toast('Sello otorgado.');
      return;
    }
    return f0(f);
  };

  var fid0 = VIEWS.fidelizacion;
  VIEWS.fidelizacion = function () {
    var h = fid0();
    return h.replace('Otorgar sello de hoy</button></div></form>', 'Otorgar sello de hoy</button><button class="btn" type="button" data-act="qr-escanear" data-t="sello">' + CM.icon('qr') + 'Escanear QR con la cámara</button></div><p class="hint" style="margin:6px 0 0">También podés pasar el QR por un lector USB sobre el campo de arriba, o escribir el código o el DNI.</p></form>');
  };
})(window);
