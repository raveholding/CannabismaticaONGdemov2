/* Cannabismatica I+D · Sistema ONG · Menú público: «Historia Clínica · Solicitud Reprocann», Turnero Digital y WhatsApp.
   - Formulario de registro inicial + datos para abrir la historia clínica: cada envío crea un paciente NUEVO con legajo único.
   - Pacientes y socios ya registrados: pedido de turno (Turnero Digital) y WhatsApp directo.
   - Administración: bandeja «Historia clínica y turnos». */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, fl = U.fl, opt = U.opt, fail = U.fail, VIEWS = CM.VIEWS;
  var render = function () { CM.render(); };

  var H = {
    es: {
      nav: 'Historia Clínica · Solicitud Reprocann',
      t1: 'Quiero registrarme', t2: 'Ya soy paciente o socio/a',
      nom: 'Nombre', ape: 'Apellido', nac: 'Fecha de nacimiento', wa: 'WhatsApp (con característica)', email: 'Correo electrónico', cp: 'Código postal', dir: 'Dirección (provincia, localidad, barrio, calle y N.º)',
      obra: 'Obra social / N.º (opcional)', ocup: 'Labor, ocupación o trabajo', motivo: 'Motivo de consulta: ¿por qué motivo usás o querés usar cannabis medicinal?', rep: 'Tu REPROCANN', rep0: 'Todavía no tengo', rep1: 'Lo tengo en trámite', rep2: 'Lo tengo vigente',
      dudas: 'Dudas, consultas o comentarios (opcional)', tutor: 'Madre, padre o representante legal (obligatorio si sos menor de 18 años)',
      enviar: 'Enviar mi solicitud', ident: 'Tu legajo, DNI/CUIT/CUIL o nombre completo', fecha: 'Día que preferís', franja: 'Franja horaria', motivoT: '¿Para qué querés el turno?', nota: 'Comentario (opcional)', pedir: 'Pedir turno', wapp: 'Escribinos por WhatsApp',
      m0: 'Consulta médica', m1: 'Trámite o renovación de REPROCANN', m2: 'Retiro de mi tratamiento', m3: 'Taller o curso', m4: 'Otro motivo', f1: 'Mañana (9 a 13 hs)', f2: 'Tarde (14 a 18 hs)', f3: 'Cualquier horario',
      okT: '¡Recibimos tu solicitud!', okL: 'Tu legajo es', okD: 'Guardalo: lo vas a necesitar para pedir turnos y hacer consultas. El equipo revisa tus datos y te escribe por WhatsApp. Esto es una solicitud: todavía no implica que tengas el REPROCANN ni una entrega.', copiar: 'Copiar legajo', otra: 'Cargar otra solicitud',
      okTurno: 'Recibimos tu pedido de turno. El equipo lo confirma por WhatsApp: hasta entonces no está reservado.',
      eNom: 'Escribí tu nombre y apellido.', eNac: 'Ingresá una fecha de nacimiento válida (año de 4 cifras).', eWa: 'Revisá el WhatsApp (10 números con característica, sin 0 ni 15).', eMail: 'Escribí un correo válido.', eCp: 'Falta el código postal.', eDir: 'Falta la dirección.', eOcup: 'Falta la labor u ocupación.', eMot: 'Contanos el motivo de consulta.', eTut: 'Sos menor de 18 años: hace falta el nombre de tu madre, padre o representante legal.', eCons: 'Hace falta aceptar el consentimiento para abrir la historia clínica.', eRate: 'Enviaste varias solicitudes seguidas. Esperá unos minutos y probá de nuevo.', eId: 'Escribí tu legajo, documento o nombre completo.', eFec: 'Elegí un día que no sea anterior a hoy.',
      c1: 'Doy mi consentimiento para la apertura de mi historia clínica y para el tratamiento de mis datos personales, que se usan resguardando mi identidad.', c2: 'Acepto recibir mensajes del equipo por WhatsApp o correo (opcional).',
      intro: 'Completá este formulario para abrir tu historia clínica y pedir el acompañamiento en tu REPROCANN. Cada envío crea un legajo nuevo y único a tu nombre.',
      introS: 'Si ya sos paciente o socio/a, pedí tu turno para acercarte a la ONG o escribinos directo por WhatsApp.', wamsg: 'Hola, completé la Historia Clínica / Solicitud Reprocann en la web. Mi legajo es ', wamsgT: 'Hola, pedí un turno desde la web para el ', wamsgG: 'Hola, quiero consultar por la Historia Clínica / Solicitud Reprocann.', turnoOff: 'El pedido de turnos por la web no está habilitado por ahora: escribinos por WhatsApp.'
    },
    en: {
      nav: 'Medical record · REPROCANN request',
      t1: 'I want to register', t2: 'I am already a patient or member',
      nom: 'First name', ape: 'Last name', nac: 'Date of birth', wa: 'WhatsApp (with area code)', email: 'Email', cp: 'Postal code', dir: 'Address (province, city, district, street and number)',
      obra: 'Health insurance / No. (optional)', ocup: 'Occupation or job', motivo: 'Reason for consultation: why do you use or want to use medical cannabis?', rep: 'Your REPROCANN', rep0: 'I do not have it yet', rep1: 'It is in progress', rep2: 'I have it, valid',
      dudas: 'Questions or comments (optional)', tutor: 'Mother, father or legal representative (required if you are under 18)',
      enviar: 'Send my request', ident: 'Your record number, ID/tax ID or full name', fecha: 'Preferred day', franja: 'Time slot', motivoT: 'What is the appointment for?', nota: 'Comment (optional)', pedir: 'Request an appointment', wapp: 'Message us on WhatsApp',
      m0: 'Medical consultation', m1: 'REPROCANN registration or renewal', m2: 'Pick-up of my treatment', m3: 'Workshop or course', m4: 'Other', f1: 'Morning (9 to 1 pm)', f2: 'Afternoon (2 to 6 pm)', f3: 'Any time',
      okT: 'We received your request!', okL: 'Your record number is', okD: 'Keep it: you will need it to request appointments and ask questions. The team reviews your data and writes to you on WhatsApp. This is a request: it does not mean you already hold a REPROCANN or a delivery.', copiar: 'Copy record number', otra: 'Send another request',
      okTurno: 'We received your appointment request. The team confirms it on WhatsApp: until then it is not booked.',
      eNom: 'Enter your first and last name.', eNac: 'Enter a valid date of birth (4-digit year).', eWa: 'Check the WhatsApp number (10 digits with area code).', eMail: 'Enter a valid email.', eCp: 'Postal code is missing.', eDir: 'Address is missing.', eOcup: 'Occupation is missing.', eMot: 'Tell us the reason for consultation.', eTut: 'You are under 18: we need the name of your mother, father or legal representative.', eCons: 'Consent is needed to open the medical record.', eRate: 'You sent several requests in a row. Wait a few minutes and try again.', eId: 'Enter your record number, ID or full name.', eFec: 'Pick a day that is not before today.',
      c1: 'I consent to the opening of my medical record and to the processing of my personal data, which is used protecting my identity.', c2: 'I agree to receive messages from the team by WhatsApp or email (optional).',
      intro: 'Fill in this form to open your medical record and ask for support with your REPROCANN. Each submission creates a new, unique record in your name.',
      introS: 'If you are already a patient or member, request your appointment to visit the foundation or message us directly on WhatsApp.', wamsg: 'Hello, I completed the Medical record / REPROCANN request on the website. My record number is ', wamsgT: 'Hello, I requested an appointment on the website for ', wamsgG: 'Hello, I would like to ask about the Medical record / REPROCANN request.', turnoOff: 'Online appointment requests are not enabled right now: message us on WhatsApp.'
    }
  };
  CM.hcTxt = H;
  CM.pub.hcTab = CM.pub.hcTab || 'nuevo';
  CM.pub.hcNonce = CM.pub.hcNonce || nonce();
  CM.pub.hcTs = CM.pub.hcTs || [];
  function nonce() { var a = new Uint32Array(3); if (g.crypto && g.crypto.getRandomValues) g.crypto.getRandomValues(a); else a = [Date.now(), Math.random() * 4e9, Math.random() * 4e9]; return Array.prototype.map.call(a, function (x) { return Math.floor(x).toString(36); }).join(''); }
  function tx(cfg, o, L) { return (o && (o[L] || o.es)) || ''; }
  function limite() {
    var ahora = Date.now(); CM.pub.hcTs = CM.pub.hcTs.filter(function (t) { return ahora - t < 600000; });
    if (CM.pub.hcTs.length >= 3) return true;
    CM.pub.hcTs.push(ahora); return false;
  }

  /* ---------- sección pública ---------- */
  CM.hcHtml = function (cfg, live, L) {
    var h = H[L], a = live ? 'data-act' : 'data-x', hc = cfg.hc || {}, tab = CM.pub.hcTab === 'socio' ? 'socio' : 'nuevo', wa = 'https://wa.me/' + cfg.wa;
    var out = '<section class="pub-s pub-hc" id="pub-hc" aria-labelledby="pubHc"><h2 id="pubHc">' + CM.icon('clip') + esc(h.nav) + '</h2>' +
      '<div class="pub-tabs" role="group" aria-label="' + esc(h.nav) + '"><button type="button" ' + a + '="pub-hc-tab" data-v="nuevo" aria-pressed="' + (tab === 'nuevo') + '">' + h.t1 + '</button><button type="button" ' + a + '="pub-hc-tab" data-v="socio" aria-pressed="' + (tab === 'socio') + '">' + h.t2 + '</button></div>';
    if (tab === 'nuevo') {
      out += '<p>' + esc(tx(cfg, hc.intro, L) || h.intro) + '</p>';
      if (CM.pub.hcOk && live) {
        var ok = CM.pub.hcOk, m = h.wamsg + ok.leg;
        return out + '<div class="note ok" role="status"><b>' + h.okT + '</b><p style="margin:6px 0">' + h.okL + ' <b class="pub-leg-n">' + esc(ok.leg) + '</b></p><p style="margin:0">' + h.okD + '</p></div>' +
          '<div class="row"><button type="button" class="btn" ' + a + '="pub-copiar" data-v="' + esc(ok.leg) + '">' + CM.icon('copy') + h.copiar + '</button><a class="btn pri" href="' + esc(wa + '?text=' + encodeURIComponent(m)) + '" target="_blank" rel="noopener noreferrer">' + CM.icon('chat') + h.wapp + '</a><button type="button" class="btn" ' + a + '="pub-hc-otra">' + h.otra + '</button></div></section>';
      }
      out += '<form ' + (live ? 'data-form="pub-hc"' : '') + ' class="f" autocomplete="off" novalidate><input type="hidden" name="nonce" value="' + esc(CM.pub.hcNonce) + '">' +
        '<div class="f f2">' + fl(h.nom + ' *', '<input class="in" name="nom" autocomplete="given-name">') + fl(h.ape + ' *', '<input class="in" name="ape" autocomplete="family-name">') + '</div>' +
        '<div class="f f2">' + fl(h.nac + ' *', '<input class="in" type="date" name="nac" min="1900-01-01" max="' + CM.hoy() + '">') + fl(h.wa + ' *', '<input class="in" name="wa" inputmode="tel" placeholder="3875000000">') + '</div>' +
        CM.docCampos(null).replace('(opcional)', L === 'en' ? '(optional)' : '(opcional)').replace('Tipo de documento', L === 'en' ? 'Document type' : 'Tipo de documento').replace('Número', L === 'en' ? 'Number' : 'Número').replace('Sin documento', L === 'en' ? 'No document' : 'Sin documento') +
        '<div class="f f2">' + fl(h.email + ' *', '<input class="in" type="email" name="email" autocomplete="email" inputmode="email">') + fl(h.cp + ' *', '<input class="in" name="cp" maxlength="8" autocomplete="postal-code">') + '</div>' +
        fl(h.dir + ' *', '<textarea class="in" name="dir" style="min-height:64px" autocomplete="street-address"></textarea>') +
        '<div class="f f2">' + fl(h.ocup + ' *', '<input class="in" name="ocup">') + fl(h.obra, '<input class="in" name="obra">') + '</div>' +
        fl(h.motivo + ' *', '<textarea class="in" name="motivo"></textarea>') +
        fl(h.rep, '<select class="in" name="rep">' + opt('0', h.rep0) + opt('1', h.rep1) + opt('2', h.rep2) + '</select>') +
        fl(h.dudas, '<input class="in" name="dudas">') + fl(h.tutor, '<input class="in" name="tutor">') +
        '<label class="chk"><input type="checkbox" name="c1"><span>' + esc(tx(cfg, hc.consent, L) || h.c1) + ' <b>[VERIFICAR]</b></span></label><label class="chk"><input type="checkbox" name="c2"><span>' + h.c2 + '</span></label>' +
        '<p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">' + h.enviar + '</button><a class="btn" href="' + esc(wa + '?text=' + encodeURIComponent(h.wamsgG)) + '" target="_blank" rel="noopener noreferrer">' + CM.icon('chat') + h.wapp + '</a></div></form></section>';
      return out;
    }
    /* ya soy paciente o socio/a: turnero + WhatsApp */
    out += '<p>' + h.introS + '</p>';
    if (CM.pub.turnoOk && live) {
      return out + '<div class="note ok" role="status">' + h.okTurno + '</div><div class="row"><a class="btn pri" href="' + esc(wa + '?text=' + encodeURIComponent(h.wamsgT + CM.pub.turnoOk)) + '" target="_blank" rel="noopener noreferrer">' + CM.icon('chat') + h.wapp + '</a><button type="button" class="btn" ' + a + '="pub-turno-otro">' + h.pedir + '</button></div></section>';
    }
    if (hc.turnero === false) return out + '<div class="note info">' + h.turnoOff + '</div><div class="row"><a class="btn pri" href="' + esc(wa) + '" target="_blank" rel="noopener noreferrer">' + CM.icon('chat') + h.wapp + '</a></div></section>';
    out += '<form ' + (live ? 'data-form="pub-turno"' : '') + ' class="f" autocomplete="off" novalidate><h3>' + CM.icon('cal') + ' Turnero Digital</h3>' +
      fl(h.ident + ' *', '<input class="in" name="ident" autocomplete="off">') + fl(h.wa + ' *', '<input class="in" name="wa" inputmode="tel" placeholder="3875000000">') +
      fl(h.motivoT, '<select class="in" name="motivo">' + [h.m0, h.m1, h.m2, h.m3, h.m4].map(function (m, i) { return opt(String(i), m); }).join('') + '</select>') +
      '<div class="f f2">' + fl(h.fecha + ' *', '<input class="in" type="date" name="fecha" min="' + CM.hoy() + '">') + fl(h.franja, '<select class="in" name="franja">' + opt('1', h.f1) + opt('2', h.f2) + opt('3', h.f3) + '</select>') + '</div>' +
      fl(h.nota, '<input class="in" name="nota" maxlength="200">') +
      '<p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">' + h.pedir + '</button><a class="btn" href="' + esc(wa + '?text=' + encodeURIComponent(h.wamsgG)) + '" target="_blank" rel="noopener noreferrer">' + CM.icon('chat') + h.wapp + '</a></div></form></section>';
    return out;
  };

  CM.acts['pub-hc-tab'] = function (t) { CM.pub.hcTab = t.getAttribute('data-v') === 'socio' ? 'socio' : 'nuevo'; render(); };
  CM.acts['pub-hc-otra'] = function () { CM.pub.hcOk = null; CM.pub.hcNonce = nonce(); render(); };
  CM.acts['pub-turno-otro'] = function () { CM.pub.turnoOk = null; render(); };

  /* ---------- envío del formulario: SIEMPRE un paciente nuevo y único ---------- */
  CM.forms['pub-hc'] = function (f) {
    var cfg = CM.db.menu.pub, L = CM.pub.lang === 'en' ? 'en' : 'es', h = H[L], e = f.elements;
    var nom = e.nom.value.trim().replace(/\s+/g, ' '), ape = e.ape.value.trim().replace(/\s+/g, ' '), tel = CM.soloDigitos(e.wa.value).replace(/^0+/, '').replace(/^549?/, ''), email = e.email.value.trim();
    var nonceV = e.nonce.value;
    CM.pub.hcHechos = CM.pub.hcHechos || {};
    if (CM.pub.hcHechos[nonceV]) { CM.pub.hcOk = CM.pub.hcHechos[nonceV]; render(); return; }   /* doble toque o reenvío: no crea otro */
    if (nom.length < 2 || ape.length < 2) return fail(f, 'nom', h.eNom);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.nac.value) || e.nac.value > CM.hoy() || e.nac.value < '1900-01-01') return fail(f, 'nac', h.eNac);
    if (tel.length !== 10) return fail(f, 'wa', h.eWa);
    var vd = CM.validarDoc(e.tdoc.value, e.ndoc.value); if (!vd.ok) return fail(f, 'ndoc', vd.err);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(f, 'email', h.eMail);
    if (!e.cp.value.trim()) return fail(f, 'cp', h.eCp);
    if (!e.dir.value.trim()) return fail(f, 'dir', h.eDir);
    if (!e.ocup.value.trim()) return fail(f, 'ocup', h.eOcup);
    if (!e.motivo.value.trim()) return fail(f, 'motivo', h.eMot);
    if (CM.edad(e.nac.value) < 18 && !e.tutor.value.trim()) return fail(f, 'tutor', h.eTut);
    if (!e.c1.checked) return fail(f, 'c1', h.eCons);
    if (limite()) return fail(f, 'nom', h.eRate);
    var rep = e.rep.value === '1' ? { estado: 'tramite', vence: null, carnet: false } : { estado: 'sin', vence: null, carnet: false };
    var p = CM.nuevoPaciente({
      nombre: nom + ' ' + ape, tel: tel, doc: vd.doc, nac: e.nac.value, email: email, dir: e.dir.value.trim(), cp: e.cp.value.trim(), obraSocial: e.obra.value.trim(), ocupacion: e.ocup.value.trim(),
      motivo: e.motivo.value.trim(), dudas: e.dudas.value.trim(), tutor: e.tutor.value.trim(), historiaCompleta: true, consentimiento: CM.hoy(), reprocann: rep, origen: 'menú público', revisar: true
    });
    p.repDeclarado = e.rep.value === '2' ? 'vigente (a verificar)' : e.rep.value === '1' ? 'en trámite' : 'no tiene'; p.comerciales = !!e.c2.checked;
    var hcx = { id: CM.nextId('HC'), ts: new Date().toISOString(), leg: p.leg, pac: p.dni, nombre: nom + ' ' + ape, estado: 'pendiente', dup: p.posibleDup || '', nonce: nonceV };
    CM.db.menu.hcs.push(hcx);
    CM.audit('Solicitud de historia clínica (menú público)', 'Legajo ' + p.leg + ' · pendiente de verificación' + (p.posibleDup ? ' · documento repetido: posible duplicado' : '')); CM.save();
    CM.pub.hcOk = CM.pub.hcHechos[nonceV] = { leg: p.leg }; CM.pub.hcNonce = nonce(); render();
  };

  /* ---------- Turnero Digital ---------- */
  CM.forms['pub-turno'] = function (f) {
    var L = CM.pub.lang === 'en' ? 'en' : 'es', h = H[L], e = f.elements, tel = CM.soloDigitos(e.wa.value).replace(/^0+/, '').replace(/^549?/, ''), id = e.ident.value.trim();
    if (id.length < 3) return fail(f, 'ident', h.eId);
    if (tel.length !== 10) return fail(f, 'wa', h.eWa);
    if (!e.fecha.value || e.fecha.value < CM.hoy()) return fail(f, 'fecha', h.eFec);
    if (limite()) return fail(f, 'ident', h.eRate);
    var p = CM.resolverPac(id), mot = [h.m0, h.m1, h.m2, h.m3, h.m4][+e.motivo.value] || h.m4, fr = { 1: h.f1, 2: h.f2, 3: h.f3 }[e.franja.value] || h.f3;
    CM.db.menu.turnos.push({ id: CM.nextId('TU'), ts: new Date().toISOString(), ident: id.slice(0, 80), pac: p ? p.dni : '', tel10: tel, motivo: mot, fecha: e.fecha.value, franja: fr, nota: e.nota.value.trim().slice(0, 200), estado: 'solicitado' });
    CM.audit('Pedido de turno (menú público)', (p ? 'Legajo ' + p.leg : 'sin ficha identificada') + ' · ' + e.fecha.value); CM.save();
    CM.pub.turnoOk = CM.fmtFecha(e.fecha.value) + ' (' + fr + ')'; render();   /* la respuesta es la misma exista o no la ficha */
  };

  /* ---------- administración: bandeja ---------- */
  function perm() { return CM.need('menu', 'edit'); }
  CM.hcAdmin = function () {
    var m = CM.db.menu, hcs = m.hcs.slice().sort(function (a, b) { return b.ts.localeCompare(a.ts); }), tus = m.turnos.slice().sort(function (a, b) { return a.fecha.localeCompare(b.fecha); }), cfg = m.draft.hc || {};
    var th = hcs.length ? '<div class="tw"><table><thead><tr><th>Fecha</th><th>Legajo</th><th>Persona</th><th>Estado</th><th></th></tr></thead><tbody>' + hcs.map(function (x) {
      var p = CM.paciente(x.pac);
      return '<tr><td>' + esc(CM.fmtFecha(x.ts.slice(0, 10))) + '</td><td><b>' + esc(x.leg) + '</b></td><td>' + esc(U.nombreCorto(x.nombre)) + (x.dup ? '<br><span class="pill p-bad">Documento repetido: revisar duplicado</span>' : '') + '</td><td>' +
        (x.estado === 'pendiente' ? '<span class="pill p-warn">Pendiente de verificar</span>' : '<span class="pill p-ok">Verificada</span>') + '</td><td><div class="row">' + (p ? '<a class="btn sm" href="#/paciente/' + esc(p.dni) + '">Abrir legajo</a>' : '') +
        (x.estado === 'pendiente' ? '<button class="btn sm pri" data-act="hc-ok" data-id="' + esc(x.id) + '">Marcar verificada</button>' : '') + '</div></td></tr>';
    }).join('') + '</tbody></table></div>' : '<div class="empty">Todavía no llegaron solicitudes de historia clínica por el menú.</div>';
    var tt = tus.length ? '<div class="tw"><table><thead><tr><th>Día pedido</th><th>Franja</th><th>Motivo</th><th>Persona</th><th>WhatsApp</th><th>Estado</th><th></th></tr></thead><tbody>' + tus.map(function (x) {
      var p = CM.paciente(x.pac);
      return '<tr><td>' + esc(CM.fmtFecha(x.fecha)) + '</td><td>' + esc(x.franja) + '</td><td>' + esc(x.motivo) + (x.nota ? '<br><small class="hint">' + esc(x.nota) + '</small>' : '') + '</td><td>' + esc(p ? U.nombreCorto(p.nombre) + ' · ' + (p.leg || '') : x.ident) + (p ? '' : '<br><span class="pill p-warn">Sin ficha identificada</span>') + '</td>' +
        '<td><a href="https://wa.me/549' + esc(x.tel10) + '" target="_blank" rel="noopener noreferrer">' + esc(x.tel10) + '</a></td><td><span class="pill p-' + (x.estado === 'confirmado' ? 'ok' : x.estado === 'rechazado' ? 'bad' : 'warn') + '">' + esc(x.estado) + '</span></td><td><div class="row">' +
        (x.estado === 'solicitado' ? '<button class="btn sm pri" data-act="tu-est" data-id="' + esc(x.id) + '" data-v="confirmado">Confirmar</button><button class="btn sm" data-act="tu-est" data-id="' + esc(x.id) + '" data-v="rechazado">Rechazar</button>' : '') + '</div></td></tr>';
    }).join('') + '</tbody></table></div>' : '<div class="empty">Sin pedidos de turno.</div>';
    return '<div class="note info">Cada solicitud crea un <b>paciente nuevo con legajo único</b>: nunca pisa una ficha existente. Los datos que cargó la persona quedan <b>sin verificar</b> hasta que el equipo los revise (especialmente el REPROCANN). Cada confirmación de turno se avisa por WhatsApp.</div>' +
      '<section class="card"><h2>Solicitudes de historia clínica y REPROCANN</h2>' + th + '</section><section class="card" style="margin-top:14px"><h2>Turnero Digital</h2>' + tt + '</section>' +
      '<form class="card f" data-form="mp-hc" novalidate style="margin-top:14px"><h2>Textos de la sección pública</h2><label class="chk"><input type="checkbox" name="tur"' + (cfg.turnero === false ? '' : ' checked') + '><span>Habilitar el pedido de turnos por la web (Turnero Digital)</span></label>' +
      fl('Texto de presentación (español)', '<textarea class="in" name="ies">' + esc((cfg.intro && cfg.intro.es) || '') + '</textarea>') + fl('Texto de presentación (inglés)', '<textarea class="in" name="ien">' + esc((cfg.intro && cfg.intro.en) || '') + '</textarea>') +
      fl('Consentimiento (español) [VERIFICAR con asesor/a legal]', '<textarea class="in" name="ces">' + esc((cfg.consent && cfg.consent.es) || '') + '</textarea>') + fl('Consentimiento (inglés) [VERIFICAR]', '<textarea class="in" name="cen">' + esc((cfg.consent && cfg.consent.en) || '') + '</textarea>') +
      '<p class="hint" style="margin:0">Dejá vacío un texto para usar el que viene por defecto. Los cambios van al borrador del menú.</p><p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Guardar en el borrador</button></div></form>';
  };
  CM.acts['hc-ok'] = function (t) {
    if (!perm()) return; var x = CM.db.menu.hcs.filter(function (y) { return y.id === t.getAttribute('data-id'); })[0]; if (!x) return;
    x.estado = 'verificada'; var p = CM.paciente(x.pac); if (p) p.revisar = false;
    CM.audit('Solicitud de historia clínica verificada', 'Legajo ' + x.leg); CM.save(); render();
  };
  CM.acts['tu-est'] = function (t) {
    if (!perm()) return; var x = CM.db.menu.turnos.filter(function (y) { return y.id === t.getAttribute('data-id'); })[0]; if (!x) return;
    x.estado = t.getAttribute('data-v') === 'confirmado' ? 'confirmado' : 'rechazado';
    CM.audit('Turno ' + x.estado, x.id + ' · ' + x.fecha); CM.save(); render();
    CM.toast(x.estado === 'confirmado' ? 'Turno confirmado. Avisale a la persona por WhatsApp.' : 'Turno rechazado.');
  };
  CM.forms['mp-hc'] = function (f) {
    if (!perm()) return; var e = f.elements, d = CM.db.menu.draft;
    d.hc = d.hc || {}; d.hc.turnero = e.tur.checked;
    d.hc.intro = { es: e.ies.value.trim().slice(0, 600), en: e.ien.value.trim().slice(0, 600) }; d.hc.consent = { es: e.ces.value.trim().slice(0, 600), en: e.cen.value.trim().slice(0, 600) };
    CM.audit('Menú público (borrador)', 'Sección Historia clínica y turnos'); CM.save(); render(); CM.toast('Guardado en el borrador. Publicalo para que lo vea el público.');
  };
})(window);
