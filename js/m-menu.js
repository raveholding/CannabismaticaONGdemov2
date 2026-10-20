/* Cannabismatica I+D · Sistema ONG (demo v2) · Menú público (#/m) y su administración (#/menu-publico), ingreso del equipo (#/acceso) */
(function (g) {
  'use strict';
  var CM = g.CM, esc = CM.esc, U = CM.U, $ = U.$, fl = U.fl, opt = U.opt, fail = U.fail, VIEWS = CM.VIEWS;
  var render = function () { CM.render(); };
  function money(c) { return CM.fmtMoney(c); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pageH(t, p, extra) { return '<div class="page-h"><div><h1>' + esc(t) + '</h1><p>' + p + '</p></div>' + (extra || '') + '</div>'; }
  function tabs(items, cur, act) {
    return '<div class="tabs" role="group">' + items.map(function (i) { return '<button type="button" data-act="' + act + '" data-v="' + esc(i[0]) + '" aria-pressed="' + (i[0] === cur) + '">' + i[1] + '</button>'; }).join('') + '</div>';
  }
  CM.copiar = function (txt) {
    function fb() {
      var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } ta.remove(); CM.toast(ok ? 'Copiado.' : 'No se pudo copiar: seleccionalo y copialo a mano.', !ok);
    }
    if (g.navigator.clipboard && g.navigator.clipboard.writeText) g.navigator.clipboard.writeText(txt).then(function () { CM.toast('Copiado.'); }, fb); else fb();
  };
  CM.urlHttps = function (u) { try { var x = new URL(String(u || '').trim()); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; } };
  var DOM = { Instagram: /(^|\.)instagram\.com$/, Facebook: /(^|\.)(facebook|fb)\.com$/, TikTok: /(^|\.)tiktok\.com$/, X: /(^|\.)(x|twitter)\.com$/, YouTube: /(^|\.)(youtube\.com|youtu\.be)$/, LinkedIn: /(^|\.)linkedin\.com$/, Telegram: /(^|\.)(t\.me|telegram\.me)$/ };
  function urlRed(label, url) {
    var h = CM.urlHttps(url); if (!h) return null;
    if (DOM[label] && !DOM[label].test(new URL(h).hostname)) return null;
    return h;
  }
  function urlPub() { return g.location.origin + g.location.pathname + '#/m'; }

  /* ---------- textos de la interfaz pública ---------- */
  var T = {
    es: { abierto: 'Abierto ahora', cerrado: 'Cerrado ahora', demo: 'Contenidos de ejemplo', aporte: 'Donación sugerida', sin: 'Sin donación', agregar: 'Agregar a mi consulta', quitar: 'Quitar', mi: 'Mi consulta', vacio: 'Todavía no agregaste nada.', enviar: 'Enviar consulta por WhatsApp', aviso: 'Esto es una consulta: no confirma turnos ni compromisos. El equipo te responde por WhatsApp.', club: 'Sumate al club de socios/as', clubD: 'Dejanos tus datos para recibir información de la fundación. Los sellos y beneficios se validan siempre en el mostrador.', nom: 'Nombre', ape: 'Apellido', nac: 'Fecha de nacimiento', wa: 'WhatsApp (con característica)', c1: 'Acepto sumarme al club de socios/as y que la fundación guarde mis datos para ese fin. *', c2: 'Quiero recibir novedades y comunicaciones por WhatsApp o correo.', c3: 'Acepto el uso de mis datos para estadísticas de la fundación.', unirme: 'Quiero sumarme', gracias: 'Recibimos tu solicitud. Si hace falta, el equipo se comunica con vos.', wifi: 'Wi-Fi para invitados', red: 'Red', clave: 'Clave', copiar: 'Copiar clave', wifiOff: 'La clave se entrega en el mostrador durante el horario de atención.', donde: 'Dónde estamos', llegar: 'Cómo llegar', resena: 'Dejanos tu reseña', redes: 'Seguinos', compartir: 'Compartir', copiado: 'Enlace copiado', arriba: 'Volver arriba', dev: 'Desarrollado por', legal: 'Información legal', idioma: 'Idioma', cant: 'Cantidad' },
    en: { abierto: 'Open now', cerrado: 'Closed now', demo: 'Sample content', aporte: 'Suggested donation', sin: 'No donation', agregar: 'Add to my inquiry', quitar: 'Remove', mi: 'My inquiry', vacio: 'You have not added anything yet.', enviar: 'Send inquiry via WhatsApp', aviso: 'This is an inquiry: it does not confirm appointments or commitments. The team will reply on WhatsApp.', club: 'Join our members club', clubD: 'Leave your details to receive information from the foundation. Stamps and benefits are always validated at the counter.', nom: 'First name', ape: 'Last name', nac: 'Date of birth', wa: 'WhatsApp (with area code)', c1: 'I agree to join the members club and to let the foundation keep my data for that purpose. *', c2: 'I want to receive news and messages by WhatsApp or email.', c3: 'I agree to the use of my data for the foundation statistics.', unirme: 'Join', gracias: 'We received your request. The team will contact you if needed.', wifi: 'Guest Wi-Fi', red: 'Network', clave: 'Password', copiar: 'Copy password', wifiOff: 'The password is given at the counter during opening hours.', donde: 'Where to find us', llegar: 'Get directions', resena: 'Leave us a review', redes: 'Follow us', compartir: 'Share', copiado: 'Link copied', arriba: 'Back to top', dev: 'Developed by', legal: 'Legal information', idioma: 'Language', cant: 'Quantity' }
  };
  CM.pub = { lang: '', cart: {}, cat: '*', q: '', abierto: '', enviado: false, toques: [] };
  function lang() {
    if (!CM.pub.lang) {
      var m = /[?&]lang=(es|en)/.exec(g.location.search || '');
      CM.pub.lang = m ? m[1] : ((g.navigator.language || 'es').slice(0, 2) === 'en' ? 'en' : 'es');
    }
    return CM.pub.lang;
  }
  function abiertoAhora(cfg) {
    if (!cfg.mostrarHorario) return null;
    var hs = cfg.horarios, any = Object.keys(hs).some(function (k) { return hs[k]; });
    if (!any) return null;
    try {
      var p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Salta', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()), o = {};
      p.forEach(function (x) { o[x.type] = x.value; });
      var dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], hm = o.hour + ':' + o.minute, h = hs[dow];
      return !!(h && hm >= h[0] && hm < h[1]);
    } catch (e) { return null; }
  }
  function tr(cfg, o, k) { var L = lang(); return (o[L] && o[L][k]) || (o.es && o.es[k]) || ''; }
  function ph(cfg, f) { var L = lang(); return f[L] || f.es; }
  function hrsTxt(cfg) {
    var d = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'], de = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], L = lang(), out = [];
    [1, 2, 3, 4, 5, 6, 0].forEach(function (k) { var h = cfg.horarios[k]; out.push((L === 'en' ? de[k] : d[k]) + ' ' + (h ? h[0] + '–' + h[1] : (L === 'en' ? 'closed' : 'cerrado'))); });
    return out.join(' · ');
  }

  /* ---------- ilustraciones propias (no son fotos de productos) ---------- */
  function artSvg(cat, n) {
    var hue = 88 + (n % 4) * 8, a = 'hsl(' + hue + ',55%,52%)', b = 'hsl(' + (hue + 20) + ',45%,26%)', m = '';
    if (cat === 'reprocann') m = '<path d="M140 18 L186 34 V70 C186 92 164 104 140 112 C116 104 94 92 94 70 V34 Z" fill="none" stroke="' + a + '" stroke-width="3"/><path d="M140 94 C140 74 140 62 140 50 M140 78 C128 76 120 68 118 58 C128 60 136 66 140 76 M140 70 C152 68 160 60 162 50 C152 52 144 58 140 68" fill="none" stroke="' + a + '" stroke-width="3" stroke-linecap="round"/>';
    else if (cat === 'talleres') m = '<path d="M140 108 V58" stroke="' + a + '" stroke-width="4" stroke-linecap="round"/><path d="M140 70 C120 70 106 58 104 40 C124 40 138 52 140 70 Z M140 62 C158 62 172 50 174 32 C154 32 142 44 140 62 Z" fill="none" stroke="' + a + '" stroke-width="3" stroke-linejoin="round"/><path d="M110 108 H170" stroke="' + a + '" stroke-width="4" stroke-linecap="round"/>';
    else if (cat === 'cursos') m = '<path d="M84 34 H136 C140 34 140 38 140 38 V104 C132 98 90 98 84 100 Z M196 34 H144 C140 34 140 38 140 38 V104 C148 98 190 98 196 100 Z" fill="none" stroke="' + a + '" stroke-width="3" stroke-linejoin="round"/><path d="M96 52 H128 M96 66 H128 M152 52 H184 M152 66 H184" stroke="' + a + '" stroke-width="3" stroke-linecap="round"/>';
    else m = '<circle cx="140" cy="62" r="34" fill="none" stroke="' + a + '" stroke-width="3"/><path d="M140 84 C112 66 118 44 134 46 C138 46 140 50 140 52 C140 50 142 46 146 46 C162 44 168 66 140 84 Z" fill="none" stroke="' + a + '" stroke-width="3" stroke-linejoin="round"/>';
    return '<svg viewBox="0 0 280 124" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><linearGradient id="ga' + n + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + b + '"/><stop offset="1" stop-color="#0b120b"/></linearGradient></defs><rect width="280" height="124" fill="url(#ga' + n + ')"/><circle cx="' + (30 + (n * 37) % 220) + '" cy="24" r="40" fill="' + a + '" opacity=".08"/><circle cx="' + (230 - (n * 23) % 160) + '" cy="110" r="52" fill="' + a + '" opacity=".07"/>' + m + '</svg>';
  }
  var NAVL = { es: { hc: 'Historia Clínica · Solicitud Reprocann', catalogo: 'Servicios', agenda: 'Agenda', pasos: 'Cómo funciona', faq: 'Preguntas', club: 'Club', ubic: 'Contacto' }, en: { hc: 'Medical record · REPROCANN request', catalogo: 'Services', agenda: 'Schedule', pasos: 'How it works', faq: 'FAQ', club: 'Club', ubic: 'Contact' } };
  var TX = {
    es: { ver: 'Ver detalle', buscar: 'Buscar un servicio, taller o curso', todos: 'Todos', sinRes: 'No encontramos nada con esa búsqueda.', agenda: 'Próximas actividades', agendaD: 'Reservá tu lugar agregando la actividad a tu consulta. Es una solicitud: confirmamos el cupo por WhatsApp.', cupo: 'cupos', pres: 'Presencial', virt: 'Virtual', pasos: 'Cómo funciona', faq: 'Preguntas frecuentes', incluye: 'Qué incluye', dur: 'Duración', cerrar: 'Cerrar', consultarWa: 'Consultar por WhatsApp', contacto: 'Contacto', hoy: 'Hoy', wa: 'WhatsApp', mail: 'Correo', hecho: 'Listo', inscr: 'Quiero inscribirme', chips: 'Ley 27.350 · REPROCANN' },
    en: { ver: 'View details', buscar: 'Search a service, workshop or course', todos: 'All', sinRes: 'We found nothing for that search.', agenda: 'Upcoming activities', agendaD: 'Reserve your place by adding the activity to your inquiry. It is a request: we confirm availability on WhatsApp.', cupo: 'seats', pres: 'In person', virt: 'Online', pasos: 'How it works', faq: 'Frequently asked questions', incluye: 'What is included', dur: 'Duration', cerrar: 'Close', consultarWa: 'Ask on WhatsApp', contacto: 'Contact', hoy: 'Today', wa: 'WhatsApp', mail: 'Email', hecho: 'Done', inscr: 'I want to sign up', chips: 'Law 27,350 · REPROCANN' }
  };
  function lista(txt) { return String(txt || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  function fechaL(f) { var L = lang(); try { return new Intl.DateTimeFormat(L === 'en' ? 'en-GB' : 'es-AR', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(f + 'T12:00:00Z')); } catch (e) { return f; } }
  function telFmt(wa) { var d = String(wa || '').replace(/^549/, ''); return d.length === 10 ? d.slice(0, 4) + ' ' + d.slice(4, 6) + '-' + d.slice(6) : d; }
  function itemCard(cfg, i, a, t, x, n) {
    var q = CM.pub.cart[i.id] || 0, cat = i.cat;
    return '<article class="pub-it"><div class="pub-art">' + artSvg(cat, n) + '</div><div class="pub-itb"><h3>' + esc(tr(cfg, i, 'n')) + '</h3><p>' + esc(tr(cfg, i, 'd')) + '</p>' +
      (i.dur && (i.dur[lang()] || i.dur.es) ? '<p class="pub-dur">' + CM.icon('clock') + esc(i.dur[lang()] || i.dur.es) + '</p>' : '') +
      '<div class="pub-itf"><b>' + (i.cent > 0 ? t.aporte + ': ' + esc(money(i.cent)) : t.sin) + '</b></div><div class="row"><button type="button" class="btn sm" ' + a + '="pub-det" data-id="' + esc(i.id) + '">' + x.ver + '</button>' +
      (q ? '<span class="pill p-info">×' + q + '</span><button type="button" class="btn sm" ' + a + '="pub-quitar" data-id="' + esc(i.id) + '" aria-label="' + t.quitar + ' ' + esc(tr(cfg, i, 'n')) + '">−</button>' : '') + '<button type="button" class="btn pri sm" ' + a + '="pub-add" data-id="' + esc(i.id) + '">' + (q ? '+' : t.agregar) + '</button></div></div></article>';
  }

  /* ---------- la página pública (sirve para el menú publicado y para la vista previa del borrador) ---------- */
  function pubHtml(cfg, live) {
    CM.menuFill(cfg);
    var L = lang(), t = T[L], x = TX[L], ab = abiertoAhora(cfg), a = live ? 'data-act' : 'data-x', po = cfg.portada[L] || cfg.portada.es, wa = 'https://wa.me/' + cfg.wa;
    var cats = cfg.cats.filter(function (c) { return cfg.items.some(function (i) { return i.cat === c.id && i.activo; }); });
    var cat = CM.pub.cat === '*' ? '*' : (CM.pub.cat && cats.some(function (c) { return c.id === CM.pub.cat; }) ? CM.pub.cat : '*');
    var q = CM.norm(CM.pub.q || '');
    var rot = cfg.frases.filter(function (f) { return f.activa && f.tipo !== 'legal'; }), leg = cfg.frases.filter(function (f) { return f.activa && f.tipo === 'legal'; });
    var on = function (b) { return b === 'catalogo' || cfg.bloques[b]; };
    var ancl = cfg.orden.filter(function (b) { return NAVL[L][b] && on(b) && (b !== 'club' || cfg.club.activo) && (b !== 'agenda' || cfg.agenda.some(function (g1) { return g1.activo; })); });
    var h = '<div class="pubpage' + (live ? '' : ' prev') + '" lang="' + L + '">' +
      '<header class="pub-h"><button type="button" class="pub-logo" ' + a + '="pub-logo" aria-label="' + esc(cfg.nombre) + '"><img src="assets/logo.png" alt="' + esc(cfg.nombre) + '" width="723" height="220"></button>' +
      '<nav class="pub-nav" aria-label="' + esc(cfg.nombre) + '">' + ancl.map(function (b) { return '<button type="button" ' + a + '="pub-ir" data-v="' + b + '">' + NAVL[L][b] + '</button>'; }).join('') + '</nav>' +
      (cfg.oculto && cfg.oculto.boton ? '<a class="btn sm pub-acc" ' + (live ? 'href="#/acceso"' : '') + '>' + (L === 'en' ? 'Team access' : 'Acceso del equipo') + '</a>' : '') + '<div class="pub-lang" role="group" aria-label="' + t.idioma + '"><button type="button" ' + a + '="pub-lang" data-v="es" aria-pressed="' + (L === 'es') + '" lang="es">ES</button><button type="button" ' + a + '="pub-lang" data-v="en" aria-pressed="' + (L === 'en') + '" lang="en">EN</button></div></header>' +
      '<section class="pub-hero"><div class="pub-hero-bg" aria-hidden="true">' + artSvg('reprocann', 3).replace('<svg ', '<svg class="hb" ') + '</div><div class="pub-hero-in"><p class="pub-kick">' + esc(po.kicker) + '</p><h1>' + esc(po.titulo) + '</h1><p class="pub-sub">' + esc(po.sub) + '</p>' +
      '<div class="row pub-cta"><button type="button" class="btn pri" ' + a + '="pub-reprocann">' + esc(po.cta1) + '</button><a class="btn" href="' + esc(wa) + '" target="_blank" rel="noopener noreferrer">' + esc(po.cta2) + '</a></div>' +
      '<ul class="pub-chips"><li>' + CM.icon('shield') + esc(x.chips) + '</li><li>' + CM.icon('pin') + esc(cfg.direccion) + (cfg.localidad ? ', ' + esc(cfg.localidad) : '') + '</li>' + (ab === null ? '' : '<li><span class="pill ' + (ab ? 'p-ok' : 'p-mu') + '">' + (ab ? t.abierto : t.cerrado) + '</span></li>') + '</ul></div></section>' +
      (CM.db.cfg.ejemplo ? '<div class="pub-demo">' + t.demo + '</div>' : '');
    if (rot.length) h += '<div class="pub-rot"><p id="pubRot" ' + (cfg.rotar && live ? 'aria-live="polite"' : '') + ' data-n="' + rot.length + '" data-i="0" data-s="' + cfg.intervalo + '">' + esc(ph(cfg, rot[0])) + '</p>' + (cfg.rotar && live && rot.length > 1 ? '<button type="button" class="btn sm" data-act="pub-rot-pausa" id="pubPausa" aria-pressed="false">' + (L === 'en' ? 'Pause' : 'Pausar') + '</button>' : '') + '</div>';
    var ids = Object.keys(CM.pub.cart).filter(function (k) { return CM.pub.cart[k] > 0; });
    cfg.orden.forEach(function (b) {
      if (b === 'hc') { if (cfg.bloques.hc) h += CM.hcHtml(cfg, live, L); }
      else if (b === 'catalogo') {
        var its = cfg.items.filter(function (i) { return i.activo && (cat === '*' || i.cat === cat) && (!q || CM.norm(tr(cfg, i, 'n') + ' ' + tr(cfg, i, 'd')).indexOf(q) > -1); });
        h += '<section class="pub-s" id="pub-catalogo" aria-labelledby="pubCatT"><h2 id="pubCatT">' + NAVL[L].catalogo + '</h2>' +
          '<label class="pub-search"><span class="sr">' + x.buscar + '</span>' + CM.icon('search') + '<input class="in" type="search" id="pubQ" placeholder="' + esc(x.buscar) + '" value="' + esc(CM.pub.q || '') + '" ' + (live ? '' : 'disabled') + ' autocomplete="off"></label>' +
          '<div class="pub-tabs" role="group" aria-label="' + NAVL[L].catalogo + '"><button type="button" ' + a + '="pub-cat" data-v="*" aria-pressed="' + (cat === '*') + '">' + x.todos + '</button>' + cats.map(function (c) { return '<button type="button" ' + a + '="pub-cat" data-v="' + esc(c.id) + '" aria-pressed="' + (c.id === cat) + '" class="' + (c.id === 'reprocann' ? 'hl' : '') + '">' + esc(c[L] || c.es) + '</button>'; }).join('') + '</div>' +
          '<div class="pub-items">' + (its.length ? its.map(function (i, n) { return itemCard(cfg, i, a, t, x, n + 1); }).join('') : '<p class="empty">' + x.sinRes + '</p>') + '</div></section>';
        h += '<section class="pub-s pub-cart" id="pub-consulta" aria-labelledby="pubMi"><h2 id="pubMi">' + t.mi + '</h2>' + (ids.length ? '<ul>' + ids.map(function (k) { var it = cfg.items.filter(function (y) { return y.id === k; })[0]; return it ? '<li>' + esc(tr(cfg, it, 'n')) + ' ×' + CM.pub.cart[k] + '</li>' : ''; }).join('') + '</ul><button type="button" class="btn pri" ' + a + '="pub-enviar">' + t.enviar + '</button><p class="hint">' + t.aviso + '</p>' : '<p class="hint">' + t.vacio + '</p>') + '</section>';
      } else if (b === 'agenda' && cfg.bloques.agenda) {
        var ag = cfg.agenda.filter(function (g1) { return g1.activo && g1.fecha >= CM.hoy(); }).sort(function (u, v) { return u.fecha.localeCompare(v.fecha); });
        if (ag.length) h += '<section class="pub-s" id="pub-agenda" aria-labelledby="pubAg"><h2 id="pubAg">' + CM.icon('cal') + x.agenda + '</h2><p class="hint">' + x.agendaD + '</p><ul class="pub-ag">' + ag.map(function (g1) {
          var it = cfg.items.filter(function (y) { return y.id === g1.item; })[0]; if (!it) return '';
          return '<li><div class="pub-agd"><b>' + esc(fechaL(g1.fecha)) + '</b><small>' + esc(g1.hora) + ' hs</small></div><div class="pub-agm"><b>' + esc(tr(cfg, it, 'n')) + '</b><small>' + (g1.modalidad === 'virtual' ? x.virt : x.pres) + ' · ' + esc(g1.lugar) + ' · ' + esc(g1.cupo) + ' ' + x.cupo + '</small></div><button type="button" class="btn pri sm" ' + a + '="pub-add" data-id="' + esc(it.id) + '">' + x.inscr + '</button></li>';
        }).join('') + '</ul></section>';
      } else if (b === 'pasos' && cfg.bloques.pasos && cfg.pasos.length) {
        h += '<section class="pub-s" id="pub-pasos" aria-labelledby="pubPs"><h2 id="pubPs">' + x.pasos + '</h2><ol class="pub-steps">' + cfg.pasos.map(function (p1, i) { var o = p1[L] || p1.es; return '<li><span class="pub-n" aria-hidden="true">' + (i + 1) + '</span><div><b>' + esc(o.t) + '</b><p>' + esc(o.d) + '</p></div></li>'; }).join('') + '</ol></section>';
      } else if (b === 'faq' && cfg.bloques.faq && cfg.faq.length) {
        h += '<section class="pub-s" id="pub-faq" aria-labelledby="pubFq"><h2 id="pubFq">' + x.faq + '</h2>' + cfg.faq.map(function (f1) { var o = f1[L] || f1.es; return '<details class="pub-q"><summary>' + esc(o.q) + '</summary><p>' + esc(o.a) + '</p></details>'; }).join('') + '</section>';
      } else if (b === 'club' && cfg.bloques.club && cfg.club.activo) {
        h += '<section class="pub-s" id="pub-club" aria-labelledby="pubClub"><h2 id="pubClub">' + t.club + '</h2><p>' + t.clubD + '</p>' + (CM.pub.enviado && live ? '<div class="note ok" role="status">' + t.gracias + '</div>' : '') +
          '<form ' + (live ? 'data-form="pub-club"' : '') + ' class="f" autocomplete="off" novalidate><div class="f f2"><label class="fl"><span>' + t.nom + ' *</span><input class="in" name="nom" autocomplete="given-name"></label><label class="fl"><span>' + t.ape + ' *</span><input class="in" name="ape" autocomplete="family-name"></label></div>' +
          '<div class="f f2"><label class="fl"><span>' + t.nac + ' *</span><input class="in" type="date" name="nac" max="' + CM.hoy() + '"></label><label class="fl"><span>' + t.wa + ' *</span><input class="in" name="wa" inputmode="tel" placeholder="3875000000"></label></div>' +
          '<label class="chk"><input type="checkbox" name="c1"><span>' + t.c1 + '</span></label><label class="chk"><input type="checkbox" name="c2"><span>' + t.c2 + '</span></label><label class="chk"><input type="checkbox" name="c3"><span>' + t.c3 + '</span></label>' +
          '<p class="err" role="alert" data-err></p><button class="btn pri" type="submit">' + t.unirme + '</button></form></section>';
      } else if (b === 'wifi' && cfg.bloques.wifi && cfg.wifi.ssid) {
        var vig = cfg.wifi.vigencia === 'siempre' || ab !== false;
        h += '<section class="pub-s" id="pub-wifi" aria-labelledby="pubWifi"><h2 id="pubWifi">' + CM.icon('wifi') + t.wifi + '</h2>' + (vig && cfg.wifi.clave ? '<div class="kv"><div><small>' + t.red + '</small><b>' + esc(cfg.wifi.ssid) + '</b></div><div><small>' + t.clave + '</small><b>' + esc(cfg.wifi.clave) + '</b></div></div><div class="row" style="margin-top:10px"><button type="button" class="btn sm" ' + a + '="pub-copiar" data-v="' + esc(cfg.wifi.clave) + '">' + CM.icon('copy') + t.copiar + '</button></div>' : '<p class="hint">' + t.wifiOff + '</p>') + '</section>';
      } else if (b === 'ubic' && cfg.bloques.ubic) {
        var qs = encodeURIComponent(cfg.ubic.consulta || (cfg.direccion + ' ' + cfg.localidad)), rs = cfg.ubic.resena ? CM.urlHttps(cfg.ubic.resena) : null;
        h += '<section class="pub-s" id="pub-ubic" aria-labelledby="pubUb"><h2 id="pubUb">' + CM.icon('pin') + t.donde + '</h2><div class="pub-contact"><div><p><b>' + esc(cfg.direccion) + (cfg.localidad ? ', ' + esc(cfg.localidad) : '') + '</b></p>' + (cfg.mostrarHorario ? '<p class="pub-hrs">' + esc(hrsTxt(cfg)) + '</p>' : '') + '<p><a href="' + esc(wa) + '" target="_blank" rel="noopener noreferrer">' + x.wa + ' ' + esc(telFmt(cfg.wa)) + '</a>' + (cfg.email ? ' · <a href="mailto:' + esc(cfg.email) + '">' + esc(cfg.email) + '</a>' : '') + '</p>' +
          '<div class="row"><a class="btn" href="https://www.google.com/maps/search/?api=1&query=' + qs + '" target="_blank" rel="noopener noreferrer">' + t.llegar + '</a>' + (rs ? '<a class="btn" href="' + esc(rs) + '" target="_blank" rel="noopener noreferrer">' + t.resena + '</a>' : '') + '</div></div></div></section>';
      } else if (b === 'redes' && cfg.bloques.redes) {
        var rr = cfg.redes.filter(function (r) { return r.activa; }).map(function (r) {
          var u = r.url === 'wa' ? 'https://wa.me/' + cfg.wa : urlRed(r.label, r.url);
          return u ? '<a class="btn sm" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(r.label) + '</a>' : '';
        }).join('');
        if (rr) h += '<section class="pub-s" id="pub-redes" aria-labelledby="pubRs"><h2 id="pubRs">' + t.redes + '</h2><div class="row">' + rr + '</div></section>';
      }
    });
    if (cfg.bloques.compartir) h += '<section class="pub-s pub-share"><div><h2>' + t.compartir + '</h2><div class="row"><button type="button" class="btn" ' + a + '="pub-share">' + CM.icon('share') + t.compartir + '</button><button type="button" class="btn" ' + a + '="pub-copiar" data-v="' + esc(urlPub()) + '">' + CM.icon('copy') + t.copiado.replace('Enlace copiado', 'Copiar enlace').replace('Link copied', 'Copy link') + '</button></div></div><div class="qrbox" role="img" aria-label="QR">' + CM.qrSvg(urlPub()) + '</div></section>';
    h += '<footer class="pub-f">' + (leg.length ? '<div class="pub-leg"><b>' + t.legal + '</b>' + leg.map(function (f) { return '<p>' + esc(ph(cfg, f)) + '</p>'; }).join('') + '</div>' : '') +
      '<p class="pub-dev">' + t.dev + ' <b>VINCULAR BUSINESS</b><br><i>Tu idea, en buenas manos.</i></p>' + CM.devBanner('te escribo desde el menú de ' + cfg.nombre) + '</footer>' +
      (live ? '<a class="pub-wa" href="' + esc(wa) + '" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">' + CM.icon('chat') + '</a>' : '') +
      (ids.length && live ? '<button type="button" class="pub-bar" ' + a + '="pub-ir" data-v="consulta">' + t.mi + ' (' + ids.reduce(function (s, k) { return s + CM.pub.cart[k]; }, 0) + ')</button>' : '') +
      (cfg.bloques.volver && live ? '<button type="button" class="pub-up" id="pubUp" data-act="pub-up" aria-label="' + t.arriba + '" hidden>' + CM.icon('up') + '</button>' : '') + '</div>';
    return h;
  }
  VIEWS.m = function () { return pubHtml(CM.db.menu.pub, true); };
  VIEWS.acceso = function () {
    var cfg = CM.db.menu.pub, us = CM.db.users.filter(function (u) { return u.activo; });
    var ya = CM.usuarioActual && CM.usuarioActual();
    if (ya) return '<div class="pubpage"><div class="card login"><h1>Ya ingresaste</h1><p>Sesión de <b>' + esc(ya.nombre) + '</b> (' + esc(CM.ROLES[ya.rol]) + ').</p><div class="row"><a class="btn pri" href="#/inicio">Ir al sistema</a><button class="btn" data-act="salir">Salir</button></div></div></div>';
    return '<div class="pubpage"><div class="card login"><div style="text-align:center"><img src="assets/logo.png" alt="Cannabismatica" style="max-width:220px;height:auto"></div><h1>Acceso del equipo</h1><p class="hint">Ingresá con tu correo y tu clave. Si no tenés usuario, pedíselo a la administración de la fundación.</p>' +
      '<form data-form="acceso" class="f" autocomplete="on" novalidate>' + fl('Correo', '<input class="in" type="email" name="correo" autocomplete="username" inputmode="email" autocapitalize="none" spellcheck="false">') +
      fl('Clave', '<span class="pwrow"><input class="in" type="password" name="clave" autocomplete="current-password"><button type="button" class="btn sm" data-act="ver-clave" aria-pressed="false">Mostrar</button></span>') +
      '<p class="err" role="alert" data-err></p><button class="btn pri" type="submit">Ingresar</button><div class="row" style="justify-content:space-between"><button type="button" class="btn sm" data-act="olvide">Olvidé mi contraseña</button><a class="btn sm" href="#/m">Volver al menú</a></div></form>' +
      '<details style="margin-top:14px"><summary>Usuarios de prueba</summary><div class="note warn" style="margin:8px 0">Demostración: estos usuarios y esta clave son ficticios y se muestran sólo para probar. En el sistema real no existe una clave compartida y cada persona elige la suya.</div><p>Clave de todos los usuarios de ejemplo: <code>' + esc(CM.CLAVE_DEMO) + '</code></p><div class="tw"><table><thead><tr><th>Correo</th><th>Rol</th></tr></thead><tbody>' + us.map(function (u) { return '<tr><td><button type="button" class="linkbtn" data-act="acceso-usar" data-v="' + esc(u.correo) + '">' + esc(u.correo) + '</button></td><td>' + esc(CM.ROLES[u.rol]) + '</td></tr>'; }).join('') + '</tbody></table></div></details>' +
      '<p class="hint" style="margin-top:12px">Desarrollado por <b>VINCULAR BUSINESS</b> · <i>Tu idea, en buenas manos.</i></p>' + CM.devBanner('necesito ayuda para ingresar al sistema de ' + cfg.nombre) + '</div></div>';
  };
  CM.forms.acceso = function (f) {
    var r = CM.login(f.elements.correo.value, f.elements.clave.value);
    if (r.err) return fail(f, 'clave', r.err);
    g.location.hash = '#/inicio'; render();
    if (r.ok.cambiar) setTimeout(function () { CM.modalClave(true); }, 50);
  };
  CM.acts['acceso-usar'] = function (t) { var e = document.querySelector('[data-form="acceso"]'); if (!e) return; e.elements.correo.value = t.getAttribute('data-v'); e.elements.clave.value = CM.CLAVE_DEMO; e.elements.clave.focus(); };
  CM.acts['ver-clave'] = function (t) { var i = t.parentNode.querySelector('input'), v = i.type === 'password'; i.type = v ? 'text' : 'password'; t.textContent = v ? 'Ocultar' : 'Mostrar'; t.setAttribute('aria-pressed', String(v)); };
  CM.acts.olvide = function () {
    var cfg = CM.db.menu.pub;
    CM.modal.open({ title: 'Olvidé mi contraseña', body: '<p>Pedile a la <b>administración de la fundación</b> que te genere una clave temporal desde <i>Usuarios y permisos</i>. Al ingresar vas a elegir una clave propia.</p><p>Si la administración tampoco puede ingresar, escribile a VINCULAR BUSINESS.</p>', footer: '<button class="btn" data-act="modal-close">Cerrar</button><a class="btn pri" href="https://wa.me/5493874484132?text=' + encodeURIComponent('Hola VINCULAR BUSINESS, olvidé la clave del sistema de ' + cfg.nombre) + '" target="_blank" rel="noopener noreferrer">Escribir a VINCULAR BUSINESS</a>' });
  };
  CM.acts.salir = function () { CM.logout(); CM.db.cfg.rol = 'admin'; g.location.hash = '#/m'; render(); CM.toast('Cerraste la sesión.'); };
  CM.modalClave = function (forzada) {
    CM.modal.open({ title: forzada ? 'Elegí tu clave propia' : 'Cambiar mi clave', body: (forzada ? '<div class="note warn">Ingresaste con una clave temporal: elegí una propia para seguir.</div>' : '') + '<form id="fCL" data-form="mi-clave" class="f" autocomplete="off" novalidate>' + fl('Clave actual', '<input class="in" type="password" name="act" autocomplete="current-password">') + fl('Clave nueva (mínimo 8, con letras y números)', '<input class="in" type="password" name="n1" autocomplete="new-password">') + fl('Repetí la clave nueva', '<input class="in" type="password" name="n2" autocomplete="new-password">') + '<p class="err" role="alert" data-err></p></form>', footer: (forzada ? '' : '<button class="btn" data-act="modal-close">Cancelar</button>') + '<button class="btn pri" type="submit" form="fCL">Guardar clave</button>' });
  };
  CM.acts['mi-clave'] = function () { CM.modalClave(false); };
  CM.forms['mi-clave'] = function (f) {
    var u = CM.usuarioActual(); if (!u) return;
    var e = f.elements;
    if (CM.hashPw(u.salt, e.act.value) !== u.pw) return fail(f, 'act', 'La clave actual no es correcta.');
    if (!CM.claveValida(e.n1.value)) return fail(f, 'n1', 'La clave nueva necesita al menos 8 caracteres, con letras y números.');
    if (e.n1.value !== e.n2.value) return fail(f, 'n2', 'Las dos claves nuevas no coinciden.');
    if (e.n1.value === e.act.value) return fail(f, 'n1', 'Elegí una clave distinta de la actual.');
    CM.setPw(u, e.n1.value, false); CM.audit('Cambio de clave', u.nombre); CM.save(); CM.modal.close(true); render(); CM.toast('Clave cambiada.');
  };
  /* acciones del menú público */

  CM.acts['pub-ir'] = function (t) {
    var b = t.getAttribute('data-v'), el = document.getElementById('pub-' + b); if (!el) return;
    var rm = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' }); el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true });
  };
  CM.acts['pub-reprocann'] = function () { CM.pub.hcTab = 'nuevo'; render(); var el = document.getElementById('pub-hc'); if (el) { var rm = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches; el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' }); el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); } };
  document.addEventListener('input', function (ev) {
    if (ev.target.id !== 'pubQ') return;
    CM.pub.q = ev.target.value; var pos = ev.target.selectionStart; render();
    var n = document.getElementById('pubQ'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* nada */ } }
  });
  CM.acts['pub-det'] = function (t) { detalle(t.getAttribute('data-id')); };
  function detalle(id) {
    var cfg = CM.db.menu.pub, it = cfg.items.filter(function (y) { return y.id === id && y.activo; })[0]; if (!it) return;
    var L = lang(), t = T[L], x = TX[L], inc = lista((it.inc && (it.inc[L] || it.inc.es)) || ''), dur = it.dur && (it.dur[L] || it.dur.es);
    var url = urlPub() + '/' + id;
    var msg = (L === 'en' ? 'Hello, I would like to ask about: ' : 'Hola, quiero consultar por: ') + tr(cfg, it, 'n');
    CM.modal.open({ title: tr(cfg, it, 'n'), wide: true,
      body: '<div class="pub-art pub-artm">' + artSvg(it.cat, 2) + '</div><p>' + esc(tr(cfg, it, 'd')) + '</p>' + (dur ? '<p class="pub-dur">' + CM.icon('clock') + '<b>' + x.dur + ':</b> ' + esc(dur) + '</p>' : '') +
        (inc.length ? '<h3>' + x.incluye + '</h3><ul class="pub-inc">' + inc.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') +
        '<p><b>' + (it.cent > 0 ? t.aporte + ': ' + esc(money(it.cent)) : t.sin) + '</b></p><p class="hint">' + t.aviso + '</p>',
      footer: '<button class="btn" data-act="modal-close">' + x.cerrar + '</button><button class="btn" data-act="pub-copiar" data-v="' + esc(url) + '">' + CM.icon('copy') + (L === 'en' ? 'Copy link' : 'Copiar enlace') + '</button><a class="btn" href="https://wa.me/' + cfg.wa + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener noreferrer">' + x.consultarWa + '</a><button class="btn pri" data-act="pub-add-cerrar" data-id="' + esc(id) + '">' + t.agregar + '</button>' });
  }
  CM.acts['pub-add-cerrar'] = function (t) { var id = t.getAttribute('data-id'); CM.pub.cart[id] = (CM.pub.cart[id] || 0) + 1; CM.modal.close(true); render(); CM.toast(lang() === 'en' ? 'Added to your inquiry.' : 'Agregado a tu consulta.'); };
  CM.acts['pub-lang'] = function (t) { CM.pub.lang = t.getAttribute('data-v'); render(); };
  CM.acts['pub-cat'] = function (t) { CM.pub.cat = t.getAttribute('data-v'); render(); };
  CM.acts['pub-add'] = function (t) { var id = t.getAttribute('data-id'); CM.pub.cart[id] = (CM.pub.cart[id] || 0) + 1; render(); };
  CM.acts['pub-quitar'] = function (t) { var id = t.getAttribute('data-id'); CM.pub.cart[id] = Math.max(0, (CM.pub.cart[id] || 0) - 1); render(); };
  CM.acts['pub-copiar'] = function (t) { CM.copiar(t.getAttribute('data-v')); };
  CM.acts['pub-up'] = function () { var rm = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches; g.scrollTo({ top: 0, behavior: rm ? 'auto' : 'smooth' }); };
  CM.acts['pub-share'] = function () {
    var url = urlPub(), cfg = CM.db.menu.pub;
    if (g.navigator.share) g.navigator.share({ title: cfg.nombre, text: cfg.eslogan[lang()] || '', url: url }).catch(function () { /* canceló */ });
    else CM.copiar(url);
  };
  CM.acts['pub-enviar'] = function (t, ev) {
    var cfg = CM.db.menu.pub, ids = Object.keys(CM.pub.cart).filter(function (k) { return CM.pub.cart[k] > 0; });
    if (!ids.length) return;
    var lines = ids.map(function (k) { var it = cfg.items.filter(function (x) { return x.id === k; })[0]; return '- ' + tr(cfg, it, 'n') + ' x' + CM.pub.cart[k]; });
    var msg = (lang() === 'en' ? 'Hello, I would like to inquire about:\n' : 'Hola, quiero consultar por:\n') + lines.join('\n');
    CM.db.menu.solicitudes.push({ id: CM.nextId('SO'), ts: new Date().toISOString(), items: ids.map(function (k) { return { id: k, q: CM.pub.cart[k] }; }), estado: 'abierta en WhatsApp (manual)' });
    CM.save();
    g.open('https://wa.me/' + cfg.wa + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    CM.pub.cart = {}; render();
  };
  CM.acts['pub-logo'] = function () {
    var cfg = CM.db.menu.pub; if (!cfg.oculto.activo) return;
    var now = Date.now(); CM.pub.toques = CM.pub.toques.filter(function (x) { return now - x < 3000; }); CM.pub.toques.push(now);
    if (CM.pub.toques.length >= cfg.oculto.toques) { CM.pub.toques = []; g.location.hash = '#/acceso'; }
  };
  CM.acts['pub-rot-pausa'] = function (t) { var p = t.getAttribute('aria-pressed') === 'true'; t.setAttribute('aria-pressed', String(!p)); t.textContent = p ? 'Pausar' : 'Reanudar'; CM.pub.pausa = !p; };
  CM.forms['pub-club'] = function (f) {
    var cfg = CM.db.menu.pub, L = lang(), e = f.elements, nom = e.nom.value.trim().replace(/\s+/g, ' '), ape = e.ape.value.trim().replace(/\s+/g, ' '), tel = CM.soloDigitos(e.wa.value).replace(/^0+/, '').replace(/^549?/, '');
    var M = L === 'en' ? { n: 'Enter your first name.', a: 'Enter your last name.', f: 'Enter a valid date of birth (4-digit year).', w: 'Check your WhatsApp number (10 digits with area code).', c: 'You must accept the first box to join.', m: 'Under 18: we cannot complete the sign-up with benefits or messages. Please ask a parent or guardian to contact the foundation.' } : { n: 'Escribí tu nombre.', a: 'Escribí tu apellido.', f: 'Ingresá una fecha de nacimiento válida (año de 4 cifras).', w: 'Revisá el WhatsApp (10 números con característica).', c: 'Tenés que aceptar la primera casilla para sumarte.', m: 'Sos menor de 18 años: no podemos completar el alta con beneficios ni mensajes. Pedile a tu madre, padre o tutor/a que se comunique con la fundación.' };
    if (nom.length < 2) return fail(f, 'nom', M.n);
    if (ape.length < 2) return fail(f, 'ape', M.a);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.nac.value) || e.nac.value > CM.hoy() || e.nac.value < '1900-01-01') return fail(f, 'nac', M.f);
    if (tel.length !== 10) return fail(f, 'wa', M.w);
    if (CM.edad(e.nac.value) < 18) return fail(f, 'nac', M.m);
    if (!e.c1.checked) return fail(f, 'c1', M.c);
    var ult = tel.slice(-10), dup = CM.db.menu.altas.some(function (a) { return a.tel10 === ult; });
    var ya = dup || Object.keys(CM.db.pacientes).some(function (k) { return CM.soloDigitos(CM.db.pacientes[k].tel).slice(-10) === ult; });
    if (!ya) {
      CM.db.menu.altas.push({ id: CM.nextId('CL'), ts: new Date().toISOString(), nom: nom, ape: ape, nac: e.nac.value, tel10: ult, estado: 'pendiente', origen: 'menú público', cons: { club: true, comerciales: e.c2.checked, estadisticas: e.c3.checked, version: cfg.club.version } });
      CM.audit('Alta al club (menú público)', 'Pendiente de revisión · ' + nom + ' ' + ape); CM.save();
    }
    CM.pub.enviado = true; render();
  };
  /* rotación de frases y botón "volver arriba" */
  var rotT = null, scrollH = null;
  CM.afterRender = (function (prev) {
    return function (r) {
      if (prev) prev(r);
      if (rotT) { clearInterval(rotT); rotT = null; }
      if (scrollH) { g.removeEventListener('scroll', scrollH); scrollH = null; }
      document.documentElement.lang = r.v === 'm' ? lang() : 'es-AR';
      var uf = CM.usuarioActual && CM.usuarioActual(); if (uf && uf.cambiar && r.v !== 'm' && r.v !== 'acceso' && !CM.modal.isOpen()) CM.modalClave(true);
      if (r.v !== 'm') return;
      if (r.a && CM.pub.abierto !== r.a) { CM.pub.abierto = r.a; setTimeout(function () { detalle(r.a); }, 0); } else if (!r.a) CM.pub.abierto = '';
      var cfg = CM.db.menu.pub, p = $('#pubRot'), rot = cfg.frases.filter(function (f) { return f.activa && f.tipo !== 'legal'; });
      var rm = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (p && cfg.rotar && rot.length > 1 && !rm) {
        var i = 0;
        rotT = setInterval(function () { if (CM.pub.pausa || document.hidden) return; i = (i + 1) % rot.length; p.textContent = ph(cfg, rot[i]); }, Math.max(2, cfg.intervalo) * 1000);
        p.addEventListener('mouseenter', function () { CM.pub.pausa = true; }); p.addEventListener('mouseleave', function () { var b = $('#pubPausa'); CM.pub.pausa = b ? b.getAttribute('aria-pressed') === 'true' : false; });
        p.addEventListener('focusin', function () { CM.pub.pausa = true; });
      }
      var up = $('#pubUp');
      if (up) { scrollH = function () { up.hidden = (g.scrollY || 0) < 300; }; g.addEventListener('scroll', scrollH, { passive: true }); scrollH(); }
    };
  })(CM.afterRender);

  /* ===================================================================
     ADMINISTRACIÓN DEL MENÚ PÚBLICO
     =================================================================== */
  CM.mp = { tab: 'ident' };
  var TABS = [['ident', 'Identidad y horarios'], ['frases', 'Frases y leyendas'], ['cat', 'Catálogo'], ['cont', 'Portada y contenidos'], ['bloques', 'Bloques y orden'], ['sol', 'Historia clínica y turnos'], ['club', 'Club y altas'], ['wifi', 'Wi-Fi'], ['red', 'Ubicación y redes'], ['acc', 'Compartir y acceso'], ['pub', 'Vista previa y publicación']];
  var DIAS = [[1, 'Lunes'], [2, 'Martes'], [3, 'Miércoles'], [4, 'Jueves'], [5, 'Viernes'], [6, 'Sábado'], [0, 'Domingo']];
  function sinPublicar() { var m = CM.db.menu; return JSON.stringify(m.draft) !== JSON.stringify(m.pub); }
  function dr() { return CM.db.menu.draft; }
  VIEWS['menu-publico'] = function () {
    var f = CM.mp, d = dr(), m = CM.db.menu;
    var head = pageH('Menú público', 'Todo lo que ve el público se configura acá: nada está escrito fijo en el código. Los cambios son <b>borrador</b> hasta que se publican.',
      '<div class="row"><a class="btn" href="#/m" target="_blank" rel="noopener">' + CM.icon('globe') + 'Abrir menú público</a></div>');
    var estado = sinPublicar() ? '<div class="note warn" style="margin-bottom:12px">Hay cambios en borrador sin publicar. Revisalos en «Vista previa y publicación».</div>' : '';
    var body = '';
    if (f.tab === 'ident') {
      body = '<form class="card f" data-form="mp-ident" autocomplete="off" novalidate><h2>Identidad y datos</h2><div class="f f2">' + fl('Nombre *', '<input class="in" name="nombre" value="' + esc(d.nombre) + '">') + fl('WhatsApp de la ONG (549 + 10 números) *', '<input class="in" name="wa" inputmode="numeric" value="' + esc(d.wa) + '"><span class="hint">Número de ejemplo: cargá el real de la fundación.</span>') +
        fl('Eslogan (español)', '<input class="in" name="es" value="' + esc(d.eslogan.es) + '">') + fl('Eslogan (inglés)', '<input class="in" name="en" value="' + esc(d.eslogan.en) + '">') +
        fl('Dirección', '<input class="in" name="direccion" value="' + esc(d.direccion) + '">') + fl('Localidad', '<input class="in" name="localidad" value="' + esc(d.localidad) + '">') + fl('Correo', '<input class="in" type="email" name="email" value="' + esc(d.email) + '">') + '</div>' +
        '<label class="chk"><input type="checkbox" name="mh"' + (d.mostrarHorario ? ' checked' : '') + '><span>Mostrar horarios y el indicador «Abierto ahora» (si no hay horarios cargados, no se muestra)</span></label><h3>Horarios de atención</h3><div class="hrs">' + DIAS.map(function (x) {
          var h = d.horarios[x[0]];
          return '<div class="hrow"><b>' + x[1] + '</b><label class="chk"><input type="checkbox" name="c' + x[0] + '"' + (h ? '' : ' checked') + '><span>Cerrado</span></label><input class="in" type="time" name="a' + x[0] + '" value="' + esc(h ? h[0] : '09:00') + '" aria-label="Apertura ' + x[1] + '"><input class="in" type="time" name="b' + x[0] + '" value="' + esc(h ? h[1] : '18:00') + '" aria-label="Cierre ' + x[1] + '"></div>';
        }).join('') + '</div><p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Guardar en borrador</button></div></form>';
    } else if (f.tab === 'frases') {
      body = '<section class="card"><div class="row sp"><h2>Frases y leyendas</h2><button class="btn pri sm" data-act="fr-nueva">' + CM.icon('plus') + 'Nueva frase</button></div><div class="note info">Las leyendas <b>legales</b> se muestran siempre fijas y separadas de las frases rotativas. Los textos legales son plantillas: confirmalos con tu asesor/a <b>[VERIFICAR]</b>.</div>' +
        '<form data-form="mp-rot" class="row" style="margin:12px 0"><label class="chk"><input type="checkbox" name="rotar"' + (d.rotar ? ' checked' : '') + '><span>Rotar las frases automáticamente (se pausa al enfocar y respeta «reducir movimiento»)</span></label><label class="fl" style="max-width:200px"><span>Cada (segundos)</span><input class="in num" name="int" inputmode="numeric" value="' + esc(d.intervalo) + '"></label><button class="btn" type="submit">Guardar</button></form>' +
        '<div class="tw"><table><thead><tr><th>Tipo</th><th>Español</th><th>Inglés</th><th>Estado</th><th></th></tr></thead><tbody>' + d.frases.map(function (x) {
          return '<tr><td>' + (x.tipo === 'legal' ? '<span class="pill p-warn">Legal</span>' : '<span class="pill p-info">' + esc(x.tipo) + '</span>') + (x.obligatoria ? '<br><small class="hint">obligatoria</small>' : '') + '</td><td>' + esc(x.es) + '</td><td>' + esc(x.en) + '</td><td>' + (x.activa ? '<span class="pill p-ok">Activa</span>' : '<span class="pill p-mu">Inactiva</span>') + '</td><td class="acts"><button class="btn sm" data-act="fr-edit" data-id="' + esc(x.id) + '">Editar</button><button class="btn sm" data-act="fr-toggle" data-id="' + esc(x.id) + '">' + (x.activa ? 'Desactivar' : 'Activar') + '</button></td></tr>';
        }).join('') + '</tbody></table></div></section>';
    } else if (f.tab === 'cat') {
      body = '<div class="grid g2"><section class="card"><h2>Rubros del menú</h2><p class="hint">El primero se destaca: «Quiero mi REPROCANN».</p><form data-form="mp-cats" class="f">' + d.cats.map(function (c) { return '<div class="f f2">' + fl('Rubro «' + c.id + '» · español', '<input class="in" name="es_' + c.id + '" value="' + esc(c.es) + '">') + fl('Inglés', '<input class="in" name="en_' + c.id + '" value="' + esc(c.en) + '">') + '</div>'; }).join('') + '<p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Guardar nombres</button></div></form></section>' +
        '<section class="card"><div class="row sp"><h2>Talleres, cursos y servicios</h2><button class="btn pri sm" data-act="it-nuevo">' + CM.icon('plus') + 'Nuevo</button></div><div class="tw"><table><thead><tr><th>Rubro</th><th>Nombre</th><th class="n">Donación sugerida</th><th>En el menú</th><th></th></tr></thead><tbody>' + d.items.map(function (i) {
          var faltaEn = !(i.en && i.en.n);
          return '<tr><td>' + esc(i.cat) + '</td><td>' + esc(i.es.n) + (faltaEn ? '<br><small class="hint" style="color:var(--warn)">Falta la traducción al inglés</small>' : '') + '</td><td class="n">' + (i.cent ? esc(money(i.cent)) : 'Sin donación') + '</td><td>' + (i.activo ? '<span class="pill p-ok">Publicado</span>' : '<span class="pill p-mu">Oculto</span>') + '</td><td class="acts"><button class="btn sm" data-act="it-edit" data-id="' + esc(i.id) + '">Editar</button><button class="btn sm" data-act="it-toggle" data-id="' + esc(i.id) + '">' + (i.activo ? 'Ocultar' : 'Mostrar') + '</button></td></tr>';
        }).join('') + '</tbody></table></div></section></div>';
    } else if (f.tab === 'cont') {
      CM.menuFill(d);
      var P = d.portada, pr = function (L, k) { return esc((P[L] || {})[k] || ''); }, pl = function (arr, k1, k2, L) { return esc(arr.map(function (z) { var o = z[L] || {}; return (o[k1] || '') + ' | ' + (o[k2] || ''); }).join('\n')); };
      body = '<div class="grid g2"><form class="card f" data-form="mp-portada" novalidate><h2>Portada</h2><div class="f f2">' +
        fl('Antetítulo (español)', '<input class="in" name="k_es" value="' + pr('es', 'kicker') + '">') + fl('Kicker (English)', '<input class="in" name="k_en" value="' + pr('en', 'kicker') + '">') +
        fl('Título (español) *', '<input class="in" name="t_es" value="' + pr('es', 'titulo') + '">') + fl('Title (English)', '<input class="in" name="t_en" value="' + pr('en', 'titulo') + '">') +
        fl('Bajada (español)', '<textarea class="in" name="s_es">' + pr('es', 'sub') + '</textarea>') + fl('Subtitle (English)', '<textarea class="in" name="s_en">' + pr('en', 'sub') + '</textarea>') +
        fl('Botón principal (español)', '<input class="in" name="c1_es" value="' + pr('es', 'cta1') + '">') + fl('Main button (English)', '<input class="in" name="c1_en" value="' + pr('en', 'cta1') + '">') +
        fl('Botón de WhatsApp (español)', '<input class="in" name="c2_es" value="' + pr('es', 'cta2') + '">') + fl('WhatsApp button (English)', '<input class="in" name="c2_en" value="' + pr('en', 'cta2') + '">') +
        '</div><p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Guardar en borrador</button></div></form>' +
        '<div><form class="card f" data-form="mp-pasos" novalidate><h2>Cómo funciona</h2><p class="hint">Un paso por línea: <code>Título | Texto</code>. Las dos listas deben tener la misma cantidad de líneas.</p>' + fl('Pasos (español)', '<textarea class="in tall" name="es">' + pl(d.pasos, 't', 'd', 'es') + '</textarea>') + fl('Steps (English)', '<textarea class="in tall" name="en">' + pl(d.pasos, 't', 'd', 'en') + '</textarea>') + '<p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Guardar en borrador</button></div></form>' +
        '<form class="card f" data-form="mp-faq" novalidate style="margin-top:14px"><h2>Preguntas frecuentes</h2><p class="hint">Una por línea: <code>Pregunta | Respuesta</code>.</p>' + fl('Preguntas (español)', '<textarea class="in tall" name="es">' + pl(d.faq, 'q', 'a', 'es') + '</textarea>') + fl('Questions (English)', '<textarea class="in tall" name="en">' + pl(d.faq, 'q', 'a', 'en') + '</textarea>') + '<p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Guardar en borrador</button></div></form></div></div>' +
        '<section class="card" style="margin-top:14px"><div class="row sp"><h2>Agenda de talleres y cursos</h2><button class="btn pri sm" data-act="ag-nueva">' + CM.icon('plus') + 'Nueva fecha</button></div><div class="tw"><table><thead><tr><th>Fecha</th><th>Actividad</th><th>Modalidad y lugar</th><th class="n">Cupos</th><th>Estado</th><th></th></tr></thead><tbody>' +
        (d.agenda.length ? d.agenda.slice().sort(function (u, v) { return u.fecha.localeCompare(v.fecha); }).map(function (g1) { var it = d.items.filter(function (y) { return y.id === g1.item; })[0]; return '<tr><td>' + esc(CM.fmtFecha(g1.fecha)) + ' ' + esc(g1.hora) + '</td><td>' + esc(it ? it.es.n : g1.item) + '</td><td>' + esc(g1.modalidad === 'virtual' ? 'Virtual' : 'Presencial') + ' · ' + esc(g1.lugar) + '</td><td class="n">' + esc(g1.cupo) + '</td><td>' + (g1.fecha < CM.hoy() ? '<span class="pill p-mu">Pasada (no se muestra)</span>' : g1.activo ? '<span class="pill p-ok">Publicada</span>' : '<span class="pill p-mu">Oculta</span>') + '</td><td class="acts"><button class="btn sm" data-act="ag-edit" data-id="' + esc(g1.id) + '">Editar</button><button class="btn sm" data-act="ag-toggle" data-id="' + esc(g1.id) + '">' + (g1.activo ? 'Ocultar' : 'Mostrar') + '</button></td></tr>'; }).join('') : '<tr><td colspan="6"><div class="empty">Sin fechas cargadas.</div></td></tr>') + '</tbody></table></div><p class="hint">Las fechas pasadas dejan de mostrarse solas. Inscribirse es una solicitud: el cupo se confirma por WhatsApp.</p></section>';
    } else if (f.tab === 'bloques') {
      var NB = { catalogo: 'Catálogo (siempre visible)', agenda: 'Agenda de talleres y cursos', pasos: 'Cómo funciona', faq: 'Preguntas frecuentes', club: 'Alta al club de socios/as', wifi: 'Wi-Fi para invitados', ubic: 'Ubicación y reseñas', redes: 'Redes sociales' };
      body = '<section class="card"><h2>Bloques y orden</h2><ul class="tl">' + d.orden.map(function (b, i) {
        var on = b === 'catalogo' ? true : d.bloques[b];
        return '<li class="rubrow"><span><b>' + esc(NB[b]) + '</b> ' + (on ? '<span class="pill p-ok">Activo</span>' : '<span class="pill p-mu">Apagado</span>') + '</span><span class="acts">' + (b === 'catalogo' ? '' : '<button class="btn sm" data-act="bl-toggle" data-v="' + b + '">' + (on ? 'Apagar' : 'Encender') + '</button>') + '<button class="btn sm" data-act="bl-mov" data-v="' + b + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Subir ' + esc(NB[b]) + '">' + CM.icon('up') + '</button><button class="btn sm" data-act="bl-mov" data-v="' + b + '" data-d="1"' + (i === d.orden.length - 1 ? ' disabled' : '') + ' aria-label="Bajar ' + esc(NB[b]) + '">↓</button></span></li>';
      }).join('') + '</ul></section>';
    } else if (f.tab === 'sol') {
      body = CM.hcAdmin();
    } else if (f.tab === 'club') {
      body = '<section class="card"><h2>Altas desde el menú público</h2><p style="color:var(--mu)">Cada alta guarda por separado el consentimiento de cada finalidad, con versión del aviso, fecha y origen. Sin permiso comercial, no se envía ninguna comunicación. El alta <b>no</b> da sellos ni beneficios.</p>' +
        '<form data-form="mp-club" class="row"><label class="chk"><input type="checkbox" name="act"' + (d.club.activo ? ' checked' : '') + '><span>Habilitar el formulario de alta al club en el menú</span></label><button class="btn" type="submit">Guardar</button></form>' +
        (m.altas.length ? '<div class="tw" style="margin-top:12px"><table><thead><tr><th>Fecha</th><th>Persona</th><th>Consentimientos</th><th>Estado</th><th></th></tr></thead><tbody>' + m.altas.slice().reverse().map(function (a) {
          return '<tr><td>' + esc(CM.fmtFH(a.ts)) + '</td><td>' + esc(a.nom + ' ' + a.ape) + '<br><small class="hint">Nac. ' + esc(CM.fmtFecha(a.nac)) + ' · WhatsApp ***' + esc(a.tel10.slice(-4)) + ' · ' + esc(a.origen) + '</small></td><td><small>Club: sí · Comunicaciones: ' + (a.cons.comerciales ? 'sí' : '<b>no</b>') + ' · Estadísticas: ' + (a.cons.estadisticas ? 'sí' : 'no') + ' · ' + esc(a.cons.version) + '</small></td><td><span class="pill ' + (a.estado === 'pendiente' ? 'p-warn' : a.estado === 'activo' ? 'p-ok' : 'p-mu') + '">' + esc(a.estado) + '</span></td><td class="acts">' + (a.estado === 'pendiente' ? '<button class="btn sm" data-act="alta-conv" data-id="' + esc(a.id) + '">Pasar a paciente</button><button class="btn sm" data-act="alta-rech" data-id="' + esc(a.id) + '">Rechazar</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="empty">Todavía no hay altas. Probá el formulario en el menú público.</div>') + '</section>' +
        '<section class="card" style="margin-top:14px"><h2>Consultas armadas en el menú</h2>' + (m.solicitudes.length ? '<ul class="tl">' + m.solicitudes.slice().reverse().slice(0, 8).map(function (s) { return '<li>' + esc(CM.fmtFH(s.ts)) + ' · ' + s.items.map(function (x) { var it = d.items.filter(function (y) { return y.id === x.id; })[0]; return esc(it ? it.es.n : x.id) + ' ×' + x.q; }).join(', ') + ' · <small class="hint">' + esc(s.estado) + '</small></li>'; }).join('') + '</ul>' : '<div class="empty">Sin consultas todavía.</div>') + '<p class="hint">Una consulta es una solicitud: no confirma turnos. Se envía por WhatsApp de forma manual.</p></section>';
    } else if (f.tab === 'wifi') {
      body = '<form class="card f" data-form="mp-wifi" autocomplete="off" novalidate><h2>Wi-Fi para invitados</h2><div class="note warn">Usá una red de invitados <b>aislada</b> de la red de gestión y del fichaje. Nunca publiques la clave de la red administrativa. Texto de la Ley 25.891 <b>[VERIFICAR]</b>.</div><div class="f f2">' + fl('Nombre de la red (SSID)', '<input class="in" name="ssid" value="' + esc(d.wifi.ssid) + '">') + fl('Clave vigente', '<input class="in" name="clave" value="' + esc(d.wifi.clave) + '">') +
        fl('Modalidad', '<select class="in" name="modo">' + opt('manual', 'Clave fija cargada a mano', d.wifi.modo === 'manual') + opt('rotativa', 'Rotativa manual (con recordatorio)', d.wifi.modo === 'rotativa') + opt('auto', 'Rotación automática o portal cautivo (requiere router compatible: no disponible en la demo)', false, true) + '</select>') +
        fl('Vigencia', '<select class="in" name="vig">' + opt('horario', 'Visible sólo en horario de atención', d.wifi.vigencia === 'horario') + opt('siempre', 'Visible siempre', d.wifi.vigencia === 'siempre') + '</select>') + '</div><p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Guardar en borrador</button></div></form>';
    } else if (f.tab === 'red') {
      body = '<form class="card f" data-form="mp-red" autocomplete="off" novalidate><h2>Ubicación y reseñas</h2>' + fl('Búsqueda para el botón «Cómo llegar»', '<input class="in" name="consulta" value="' + esc(d.ubic.consulta) + '"><span class="hint">Se abre Google Maps con esta búsqueda. El mapa embebido está apagado (necesita consentimiento y ajustes de seguridad).</span>') +
        fl('Enlace para dejar reseñas en Google (opcional)', '<input class="in" name="resena" placeholder="https://…" value="' + esc(d.ubic.resena) + '"><span class="hint">Mostrar reseñas dentro del menú requiere la API de Google y está pendiente de configuración. Nunca se muestran reseñas inventadas.</span>') +
        '<h2 style="margin-top:6px">Redes sociales</h2>' + d.redes.map(function (r) { return '<div class="f f2">' + fl(r.label, r.url === 'wa' ? '<input class="in" value="Usa el WhatsApp de la ONG" disabled>' : '<input class="in" name="u_' + r.id + '" placeholder="https://…" value="' + esc(r.url) + '">') + '<label class="chk"><input type="checkbox" name="a_' + r.id + '"' + (r.activa ? ' checked' : '') + '><span>Mostrar «' + esc(r.label) + '»</span></label></div>'; }).join('') +
        '<p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Guardar en borrador</button></div></form>';
    } else if (f.tab === 'acc') {
      var url = urlPub();
      body = '<div class="grid g2"><form class="card f" data-form="mp-acc" autocomplete="off"><h2>Compartir y acceso</h2><label class="chk"><input type="checkbox" name="comp"' + (d.bloques.compartir ? ' checked' : '') + '><span>Botón «Compartir» (usa el menú de compartir del celular o copia el enlace)</span></label><label class="chk"><input type="checkbox" name="vol"' + (d.bloques.volver ? ' checked' : '') + '><span>Botón flotante «Volver arriba»</span></label>' +
        '<label class="chk"><input type="checkbox" name="bt"' + (d.oculto.boton ? ' checked' : '') + '><span>Mostrar el botón visible «Acceso del equipo» en el encabezado del menú</span></label><label class="chk"><input type="checkbox" name="oc"' + (d.oculto.activo ? ' checked' : '') + '><span>Acceso oculto del equipo: tocar varias veces el logo del menú abre el ingreso</span></label>' + fl('Cantidad de toques seguidos (3 segundos)', '<input class="in num" name="toq" inputmode="numeric" value="' + esc(d.oculto.toques) + '" style="max-width:140px">') +
        '<div class="note info">La ocultación es solo comodidad visual. La seguridad real es el ingreso con contraseña, los roles y el aislamiento de datos del servidor. La ruta <code>#/acceso</code> sirve para teclado y lectores de pantalla.</div><p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Guardar en borrador</button></div></form>' +
        '<section class="card"><h2>QR y enlace del menú</h2><div class="qrbox big" role="img" aria-label="Código QR del menú público">' + CM.qrSvg(url) + '</div><p class="hint" style="word-break:break-all">' + esc(url) + '</p><div class="row"><button class="btn" data-act="pub-copiar" data-v="' + esc(url) + '">' + CM.icon('copy') + 'Copiar enlace</button><button class="btn" data-act="qr-print">' + CM.icon('print') + 'Imprimir QR</button><button class="btn" data-act="qr-svg">' + CM.icon('dl') + 'Descargar SVG</button></div></section></div>';
    } else {
      var vers = m.versiones.slice().reverse();
      body = '<div class="grid g2"><section class="card"><h2>Vista previa del borrador</h2><div class="phone">' + pubHtml(d, false) + '</div></section><div><section class="card"><h2>Publicación</h2>' + (sinPublicar() ? '<div class="note warn">El borrador tiene cambios sin publicar.</div>' : '<div class="note ok">El borrador coincide con lo publicado.</div>') +
        '<form data-form="mp-publicar" class="f" style="margin-top:10px">' + fl('Nota de la publicación', '<input class="in" name="nota" placeholder="Ej.: cargué los talleres de noviembre">') + '<p class="err" role="alert" data-err></p><div class="row"><button class="btn pri" type="submit">Publicar ahora</button><button class="btn" type="button" data-act="mp-descartar">Descartar borrador</button></div></form></section>' +
        '<section class="card" style="margin-top:14px"><h2>Versiones publicadas</h2><div class="tw"><table><thead><tr><th>N.º</th><th>Fecha</th><th>Usuario</th><th>Sello</th><th></th></tr></thead><tbody>' + vers.map(function (v, i) { return '<tr><td>v' + v.v + (i === 0 ? ' <span class="pill p-ok">vigente</span>' : '') + '</td><td>' + esc(CM.fmtFH(v.ts)) + '</td><td>' + esc(v.user) + '</td><td><code>' + esc(v.hash.slice(0, 8)) + '</code></td><td>' + (i === 0 ? '' : '<button class="btn sm" data-act="mp-revertir" data-v="' + v.v + '">Revertir a esta</button>') + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
        '<section class="card" style="margin-top:14px"><h2>Exportar / importar configuración</h2><div class="row"><button class="btn" data-act="mp-export">' + CM.icon('dl') + 'Exportar JSON</button><label class="btn" for="mpImp" style="cursor:pointer">' + CM.icon('plus') + 'Importar JSON al borrador</label><input type="file" id="mpImp" accept=".json,application/json" class="sr"></div></section></div></div>';
    }
    return head + estado + tabs(TABS, f.tab, 'mp-tab') + body;
  };
  CM.acts['mp-tab'] = function (t) { CM.mp.tab = t.getAttribute('data-v'); render(); };
  function guardarBorrador(txt) { CM.audit('Menú público (borrador)', txt); CM.save(); render(); CM.toast('Guardado en borrador.'); }
  function perm() { return CM.need('menu', 'edit'); }
  CM.forms['mp-ident'] = function (f) {
    if (!perm()) return;
    var e = f.elements, d = dr(), wa = CM.soloDigitos(e.wa.value);
    if (e.nombre.value.trim().length < 2) return fail(f, 'nombre', 'Escribí el nombre.');
    if (!/^549\d{10}$/.test(wa)) return fail(f, 'wa', 'El WhatsApp debe tener el formato 549 + característica + número (13 dígitos en total).');
    var hs = {};
    for (var i = 0; i < 7; i++) {
      var k = (i + 1) % 7;
      if (e['c' + k].checked) hs[k] = null; else {
        if (!e['a' + k].value || !e['b' + k].value || e['b' + k].value <= e['a' + k].value) return fail(f, 'b' + k, 'Revisá el horario: el cierre tiene que ser posterior a la apertura.');
        hs[k] = [e['a' + k].value, e['b' + k].value];
      }
    }
    d.nombre = e.nombre.value.trim(); d.wa = wa; d.eslogan = { es: e.es.value.trim(), en: e.en.value.trim() }; d.direccion = e.direccion.value.trim(); d.localidad = e.localidad.value.trim(); d.email = e.email.value.trim(); d.mostrarHorario = e.mh.checked; d.horarios = hs;
    guardarBorrador('Identidad y horarios');
  };
  CM.forms['mp-rot'] = function (f) {
    if (!perm()) return; var v = parseInt(f.elements.int.value, 10);
    if (isNaN(v) || v < 2 || v > 60) { CM.toast('El intervalo va de 2 a 60 segundos.', true); return; }
    dr().rotar = f.elements.rotar.checked; dr().intervalo = v; guardarBorrador('Rotación de frases');
  };
  function modalFrase(x) {
    var edit = !!x;
    CM.modal.open({ title: edit ? 'Editar frase' : 'Nueva frase', body: '<form id="fFR" data-form="mp-frase" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(edit ? x.id : '') + '">' + fl('Tipo', '<select class="in" name="tipo">' + ['institucional', 'informativa', 'legal'].map(function (k) { return opt(k, k.charAt(0).toUpperCase() + k.slice(1), edit && x.tipo === k); }).join('') + '</select>') + fl('Texto en español *', '<textarea class="in" name="es">' + esc(edit ? x.es : '') + '</textarea>') + fl('Texto en inglés', '<textarea class="in" name="en">' + esc(edit ? x.en : '') + '</textarea>') + '<p class="hint">Una traducción de una leyenda legal también hay que revisarla con el asesor/a.</p><p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fFR">Guardar</button>' });
  }
  CM.acts['fr-nueva'] = function () { if (perm()) modalFrase(null); };
  CM.acts['fr-edit'] = function (t) { if (perm()) modalFrase(dr().frases.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]); };
  CM.forms['mp-frase'] = function (f) {
    var e = f.elements, es = e.es.value.trim();
    if (es.length < 4) return fail(f, 'es', 'Escribí el texto en español.');
    var x = e.id.value ? dr().frases.filter(function (y) { return y.id === e.id.value; })[0] : null;
    if (x) { x.tipo = e.tipo.value; x.es = es; x.en = e.en.value.trim(); }
    else dr().frases.push({ id: 'F' + (dr().frases.length + 1 + Math.floor(Math.random() * 900)), tipo: e.tipo.value, activa: true, es: es, en: e.en.value.trim() });
    CM.modal.close(true); guardarBorrador('Frase guardada');
  };
  CM.acts['fr-toggle'] = function (t) {
    if (!perm()) return;
    var x = dr().frases.filter(function (y) { return y.id === t.getAttribute('data-id'); })[0];
    if (x.activa && x.obligatoria) {
      CM.modal.open({ title: 'Desactivar leyenda legal obligatoria', body: '<form id="fLD" data-form="mp-legal-off" class="f"><input type="hidden" name="id" value="' + esc(x.id) + '"><div class="note bad">Esta leyenda figura como obligatoria. Desactivarla puede generar un incumplimiento. Queda registrado quién y por qué.</div>' + fl('Motivo * (obligatorio)', '<input class="in" name="motivo">') + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn bad" type="submit" form="fLD">Desactivar igual</button>' });
      return;
    }
    x.activa = !x.activa; guardarBorrador('Frase ' + (x.activa ? 'activada' : 'desactivada') + ': ' + x.id);
  };
  CM.forms['mp-legal-off'] = function (f) {
    var mo = f.elements.motivo.value.trim(); if (mo.length < 6) return fail(f, 'motivo', 'Escribí el motivo (mínimo 6 letras).');
    var x = dr().frases.filter(function (y) { return y.id === f.elements.id.value; })[0]; x.activa = false;
    CM.modal.close(true); guardarBorrador('Leyenda legal desactivada: ' + x.id + ' · motivo: ' + mo);
  };
  CM.forms['mp-cats'] = function (f) {
    if (!perm()) return; var d = dr();
    for (var i = 0; i < d.cats.length; i++) { var c = d.cats[i], es = f.elements['es_' + c.id].value.trim(); if (!es) return fail(f, 'es_' + c.id, 'Falta el nombre en español.'); c.es = es; c.en = f.elements['en_' + c.id].value.trim() || es; }
    guardarBorrador('Rubros del menú');
  };
  function modalItem(x) {
    var edit = !!x, d = dr();
    CM.modal.open({ title: edit ? 'Editar' : 'Nuevo taller, curso o servicio', wide: true, body: '<form id="fIT" data-form="mp-item" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(edit ? x.id : '') + '"><div class="f f2">' + fl('Rubro', '<select class="in" name="cat">' + d.cats.map(function (c) { return opt(c.id, c.es, edit && x.cat === c.id); }).join('') + '</select>') + fl('Donación sugerida (en pesos; vacío = sin donación)', '<input class="in num" name="cent" inputmode="decimal" placeholder="0" value="' + esc(edit && x.cent ? (x.cent / 100).toString().replace('.', ',') : '') + '">') + '</div>' +
      '<div class="f f2">' + fl('Nombre (español) *', '<input class="in" name="nes" value="' + esc(edit ? x.es.n : '') + '">') + fl('Name (English)', '<input class="in" name="nen" value="' + esc(edit && x.en ? x.en.n : '') + '">') + fl('Descripción (español)', '<textarea class="in" name="des">' + esc(edit ? x.es.d : '') + '</textarea>') + fl('Description (English)', '<textarea class="in" name="den">' + esc(edit && x.en ? x.en.d : '') + '</textarea>') + '</div><div class="f f2">' + fl('Duración (español)', '<input class="in" name="dures" value="' + esc(edit && x.dur ? x.dur.es : '') + '">') + fl('Duration (English)', '<input class="in" name="duren" value="' + esc(edit && x.dur ? x.dur.en : '') + '">') + fl('Qué incluye (una línea por punto, español)', '<textarea class="in" name="incs">' + esc(edit && x.inc ? x.inc.es : '') + '</textarea>') + fl('What is included (one line per point, English)', '<textarea class="in" name="incn">' + esc(edit && x.inc ? x.inc.en : '') + '</textarea>') + '</div><p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fIT">Guardar</button>' });
  }
  CM.acts['it-nuevo'] = function () { if (perm()) modalItem(null); };
  CM.acts['it-edit'] = function (t) { if (perm()) modalItem(dr().items.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]); };
  CM.forms['mp-item'] = function (f) {
    var e = f.elements, cent = e.cent.value.trim() ? CM.parseMonto(e.cent.value) : 0;
    if (e.nes.value.trim().length < 3) return fail(f, 'nes', 'Escribí el nombre en español.');
    if (isNaN(cent)) return fail(f, 'cent', 'Importe inválido.');
    var x = e.id.value ? dr().items.filter(function (y) { return y.id === e.id.value; })[0] : null;
    var o = { cat: e.cat.value, cent: cent, es: { n: e.nes.value.trim(), d: e.des.value.trim() }, en: { n: e.nen.value.trim(), d: e.den.value.trim() }, dur: { es: e.dures.value.trim(), en: e.duren.value.trim() }, inc: { es: e.incs.value.trim(), en: e.incn.value.trim() } };
    if (x) { x.cat = o.cat; x.cent = o.cent; x.es = o.es; x.en = o.en; x.dur = o.dur; x.inc = o.inc; } else { o.id = 'P' + (dr().items.length + 1 + Math.floor(Math.random() * 900)); o.activo = true; dr().items.push(o); }
    CM.modal.close(true); guardarBorrador('Ítem del menú guardado');
  };

  CM.forms['mp-portada'] = function (f) {
    if (!perm()) return; var e = f.elements, d = dr(); CM.menuFill(d);
    if (e.t_es.value.trim().length < 4) return fail(f, 't_es', 'Escribí el título en español.');
    ['es', 'en'].forEach(function (L) { d.portada[L] = { kicker: e['k_' + L].value.trim(), titulo: e['t_' + L].value.trim() || e.t_es.value.trim(), sub: e['s_' + L].value.trim(), cta1: e['c1_' + L].value.trim() || e.c1_es.value.trim(), cta2: e['c2_' + L].value.trim() || e.c2_es.value.trim() }; });
    guardarBorrador('Portada');
  };
  function parLineas(txt) { return String(txt || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { var i = l.indexOf('|'); return i < 0 ? null : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }); }
  function formLista(clave, k1, k2, nombre) {
    return function (f) {
      if (!perm()) return; var d = dr(), es = parLineas(f.elements.es.value), en = parLineas(f.elements.en.value);
      if (es.some(function (x) { return !x || !x[0] || !x[1]; })) return fail(f, 'es', 'Cada línea en español tiene que ser «Título | Texto» y no puede quedar vacía.');
      if (en.some(function (x) { return !x || !x[0] || !x[1]; })) return fail(f, 'en', 'Cada línea en inglés tiene que ser «Title | Text».');
      if (en.length && en.length !== es.length) return fail(f, 'en', 'La lista en inglés tiene ' + en.length + ' líneas y la de español ' + es.length + '. Tienen que coincidir.');
      if (es.length > 12) return fail(f, 'es', 'El máximo es 12.');
      d[clave] = es.map(function (x, i) { var o = { es: {}, en: {} }; o.es[k1] = x[0]; o.es[k2] = x[1]; o.en[k1] = en[i] ? en[i][0] : x[0]; o.en[k2] = en[i] ? en[i][1] : x[1]; return o; });
      guardarBorrador(nombre);
    };
  }
  CM.forms['mp-pasos'] = formLista('pasos', 't', 'd', 'Cómo funciona');
  CM.forms['mp-faq'] = formLista('faq', 'q', 'a', 'Preguntas frecuentes');
  function modalAg(x) {
    var d = dr(), edit = !!x;
    CM.modal.open({ title: edit ? 'Editar fecha' : 'Nueva fecha', body: '<form id="fAG" data-form="mp-ag" class="f" autocomplete="off" novalidate><input type="hidden" name="id" value="' + esc(edit ? x.id : '') + '"><div class="f f2">' + fl('Actividad *', '<select class="in" name="actv">' + d.items.filter(function (i) { return i.cat !== 'reprocann'; }).map(function (i) { return opt(i.id, i.es.n, edit && x.item === i.id); }).join('') + '</select>') +
      fl('Fecha *', '<input class="in" type="date" name="fecha" min="' + CM.hoy() + '" value="' + esc(edit ? x.fecha : '') + '">') + fl('Hora *', '<input class="in" type="time" name="hora" value="' + esc(edit ? x.hora : '18:00') + '">') +
      fl('Modalidad', '<select class="in" name="mod">' + opt('presencial', 'Presencial', !edit || x.modalidad === 'presencial') + opt('virtual', 'Virtual', edit && x.modalidad === 'virtual') + '</select>') + fl('Lugar *', '<input class="in" name="lugar" value="' + esc(edit ? x.lugar : 'Sede de la fundación') + '">') + fl('Cupos *', '<input class="in num" name="cupo" inputmode="numeric" placeholder="0" value="' + esc(edit ? x.cupo : '') + '">') + '</div><p class="err" role="alert" data-err></p></form>',
      footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fAG">Guardar</button>' });
  }
  CM.acts['ag-nueva'] = function () { if (perm()) modalAg(null); };
  CM.acts['ag-edit'] = function (t) { if (perm()) modalAg(dr().agenda.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]); };
  CM.acts['ag-toggle'] = function (t) { if (!perm()) return; var x = dr().agenda.filter(function (y) { return y.id === t.getAttribute('data-id'); })[0]; x.activo = !x.activo; guardarBorrador('Fecha de agenda ' + (x.activo ? 'publicada' : 'oculta') + ': ' + x.id); };
  CM.forms['mp-ag'] = function (f) {
    var e = f.elements, cupo = parseInt(e.cupo.value, 10);
    if (!e.fecha.value || e.fecha.value < CM.hoy() || !/^\d{4}-/.test(e.fecha.value)) return fail(f, 'fecha', 'Elegí una fecha de hoy en adelante.');
    if (!e.hora.value) return fail(f, 'hora', 'Elegí la hora.');
    if (e.lugar.value.trim().length < 3) return fail(f, 'lugar', 'Escribí el lugar.');
    if (isNaN(cupo) || cupo < 1 || cupo > 500) return fail(f, 'cupo', 'Los cupos van de 1 a 500.');
    var o = { item: e.actv.value, fecha: e.fecha.value, hora: e.hora.value, modalidad: e.mod.value, lugar: e.lugar.value.trim(), cupo: cupo };
    var x = e.id.value ? dr().agenda.filter(function (y) { return y.id === e.id.value; })[0] : null;
    if (x) Object.keys(o).forEach(function (k) { x[k] = o[k]; }); else { o.id = 'AG' + (dr().agenda.length + 1 + Math.floor(Math.random() * 900)); o.activo = true; dr().agenda.push(o); }
    CM.modal.close(true); guardarBorrador('Agenda');
  };
  CM.acts['it-toggle'] = function (t) { if (!perm()) return; var x = dr().items.filter(function (y) { return y.id === t.getAttribute('data-id'); })[0]; x.activo = !x.activo; guardarBorrador('Ítem ' + (x.activo ? 'publicado' : 'oculto') + ': ' + x.id); };
  CM.acts['bl-toggle'] = function (t) { if (!perm()) return; var b = t.getAttribute('data-v'); dr().bloques[b] = !dr().bloques[b]; guardarBorrador('Bloque ' + b + (dr().bloques[b] ? ' encendido' : ' apagado')); };
  CM.acts['bl-mov'] = function (t) {
    if (!perm()) return; var o = dr().orden, b = t.getAttribute('data-v'), i = o.indexOf(b), j = i + parseInt(t.getAttribute('data-d'), 10);
    if (j < 0 || j >= o.length) return; o.splice(i, 1); o.splice(j, 0, b); guardarBorrador('Orden de bloques');
  };
  CM.forms['mp-club'] = function (f) { if (!perm()) return; dr().club.activo = f.elements.act.checked; guardarBorrador('Alta al club ' + (dr().club.activo ? 'habilitada' : 'deshabilitada')); };
  CM.acts['alta-rech'] = function (t) { if (!CM.need('menu', 'edit')) return; var a = CM.db.menu.altas.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]; a.estado = 'rechazado'; CM.audit('Alta al club rechazada', a.id); CM.save(); render(); };
  CM.acts['alta-conv'] = function (t) {
    if (!CM.need('menu', 'edit')) return;
    var a = CM.db.menu.altas.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0];
    CM.modal.open({ title: 'Pasar a paciente', body: '<form id="fAC" data-form="alta-conv" class="f"><input type="hidden" name="id" value="' + esc(a.id) + '"><p>' + esc(a.nom + ' ' + a.ape) + '. Se crea una ficha nueva con un legajo único. El documento (DNI, CUIT o CUIL) es opcional.</p>' + CM.docCampos(null) + '<p class="err" role="alert" data-err></p></form>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" type="submit" form="fAC">Crear ficha</button>' });
  };
  CM.forms['alta-conv'] = function (f) {
    var a = CM.db.menu.altas.filter(function (x) { return x.id === f.elements.id.value; })[0];
    if (!a || a.estado === 'activo') return;
    var vd = CM.validarDoc(f.elements.tdoc.value, f.elements.ndoc.value); if (!vd.ok) return fail(f, 'ndoc', vd.err);
    var p = CM.nuevoPaciente({ nombre: a.nom + ' ' + a.ape, nac: a.nac, tel: a.tel10, doc: vd.doc, origen: 'club (menú público)' });
    a.estado = 'activo'; a.pac = p.dni; CM.audit('Alta al club → paciente', 'Legajo ' + p.leg + ' · ' + a.id); CM.save(); CM.modal.close(true); render(); CM.toast('Ficha creada con el legajo ' + p.leg + '. Falta completar la historia clínica.');
  };
  CM.forms['mp-wifi'] = function (f) {
    if (!perm()) return; var e = f.elements, w = dr().wifi;
    if (e.ssid.value.trim().length < 2) return fail(f, 'ssid', 'Escribí el nombre de la red.');
    if (e.clave.value.trim().length < 8 && dr().bloques.wifi) return fail(f, 'clave', 'La clave debe tener al menos 8 caracteres.');
    var cambio = w.clave !== e.clave.value.trim();
    w.ssid = e.ssid.value.trim(); w.clave = e.clave.value.trim(); w.modo = e.modo.value; w.vigencia = e.vig.value;
    guardarBorrador('Wi-Fi' + (cambio ? ' (cambio de clave)' : ''));
  };
  CM.forms['mp-red'] = function (f) {
    if (!perm()) return; var e = f.elements, d = dr();
    if (e.resena.value.trim() && !CM.urlHttps(e.resena.value)) return fail(f, 'resena', 'El enlace de reseñas debe ser https.');
    for (var i = 0; i < d.redes.length; i++) {
      var r = d.redes[i]; if (r.url === 'wa') { r.activa = e['a_' + r.id].checked; continue; }
      var u = e['u_' + r.id].value.trim(), on = e['a_' + r.id].checked;
      if (on && !urlRed(r.label, u)) return fail(f, 'u_' + r.id, 'El enlace de ' + r.label + ' tiene que ser https y de su dominio oficial.');
      r.url = u; r.activa = on;
    }
    d.ubic.consulta = e.consulta.value.trim(); d.ubic.resena = e.resena.value.trim(); guardarBorrador('Ubicación y redes');
  };
  CM.forms['mp-acc'] = function (f) {
    if (!perm()) return; var e = f.elements, n = parseInt(e.toq.value, 10);
    if (isNaN(n) || n < 3 || n > 10) return fail(f, 'toq', 'Los toques van de 3 a 10.');
    var d = dr(); d.bloques.compartir = e.comp.checked; d.bloques.volver = e.vol.checked; d.oculto.activo = e.oc.checked; d.oculto.boton = e.bt.checked; d.oculto.toques = n; guardarBorrador('Compartir y acceso');
  };
  CM.acts['qr-print'] = function () { CM.imprimir('<div class="doc" style="text-align:center"><h1>' + esc(dr().nombre) + '</h1><p>Escaneá para ver talleres, cursos y servicios</p><div style="width:320px;margin:20px auto">' + CM.qrSvg(urlPub()) + '</div><p style="word-break:break-all">' + esc(urlPub()) + '</p></div>'); };
  CM.acts['qr-svg'] = function () { CM.descargar('qr_menu_publico.svg', CM.qrSvg(urlPub()), 'image/svg+xml'); };
  /* publicación */
  function validarPub(d) {
    var er = [];
    if (!/^549\d{10}$/.test(d.wa)) er.push('El WhatsApp de la ONG no tiene el formato 549 + 10 números.');
    if (d.bloques.wifi && !d.wifi.clave) er.push('El bloque Wi-Fi está activo y no tiene clave.');
    if (!d.items.some(function (i) { return i.activo; })) er.push('No hay ningún taller, curso o servicio publicado.');
    if (d.ubic.resena && !CM.urlHttps(d.ubic.resena)) er.push('El enlace de reseñas no es https.');
    if (!d.frases.some(function (f) { return f.activa && f.tipo === 'legal'; })) er.push('No hay ninguna leyenda legal activa (confirmalo con tu asesor/a).');
    return er;
  }
  CM.forms['mp-publicar'] = function (f) {
    if (!CM.need('menu', 'admin')) return;
    var er = validarPub(dr());
    if (er.length) return fail(f, 'nota', 'No se puede publicar: ' + er.join(' '));
    if (!sinPublicar()) return fail(f, 'nota', 'No hay cambios para publicar.');
    var m = CM.db.menu, v = m.versiones.length + 1;
    m.pub = clone(m.draft);
    m.versiones.push({ v: v, ts: new Date().toISOString(), user: CM.db.cfg.operador, hash: CM.sha256(JSON.stringify(m.pub)), cfg: clone(m.pub), nota: f.elements.nota.value.trim() });
    CM.audit('Menú público publicado', 'v' + v + ' · sello ' + m.versiones[v - 1].hash.slice(0, 10)); CM.save(); render(); CM.toast('Publicado la versión ' + v + '. Ya se ve en el menú público.');
  };
  CM.acts['mp-descartar'] = function () { if (!CM.need('menu', 'edit')) return; CM.db.menu.draft = clone(CM.db.menu.pub); CM.audit('Menú público', 'Borrador descartado'); CM.save(); render(); CM.toast('Borrador descartado.'); };
  CM.acts['mp-revertir'] = function (t) {
    if (!CM.need('menu', 'admin')) return;
    var m = CM.db.menu, ver = m.versiones.filter(function (x) { return x.v === parseInt(t.getAttribute('data-v'), 10); })[0]; if (!ver) return;
    m.draft = clone(ver.cfg); m.pub = clone(ver.cfg); var n = m.versiones.length + 1;
    m.versiones.push({ v: n, ts: new Date().toISOString(), user: CM.db.cfg.operador, hash: CM.sha256(JSON.stringify(m.pub)), cfg: clone(m.pub), nota: 'Reversión a la versión ' + ver.v });
    CM.audit('Menú público revertido', 'a v' + ver.v + ' → nueva v' + n); CM.save(); render(); CM.toast('Se volvió a la versión ' + ver.v + ' (queda como v' + n + ').');
  };
  CM.acts['mp-export'] = function () { CM.descargar('menu_publico_config_' + CM.hoy() + '.json', JSON.stringify(dr(), null, 2), 'application/json'); };
  document.addEventListener('change', function (ev) {
    if (ev.target.id !== 'mpImp' || !ev.target.files[0]) return;
    if (!CM.need('menu', 'edit')) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var o = JSON.parse(fr.result), base = CM.menuDefault();
        if (!o || typeof o !== 'object' || !Array.isArray(o.items) || !Array.isArray(o.frases) || !o.cats) throw new Error('forma');
        Object.keys(base).forEach(function (k) { if (!(k in o)) o[k] = base[k]; });
        var dif = Object.keys(base).filter(function (k) { return JSON.stringify(o[k]) !== JSON.stringify(dr()[k]); });
        CM.modal.open({ title: 'Importar configuración', body: '<p>Archivo válido. Campos que cambian respecto del borrador: <b>' + (dif.length ? dif.map(esc).join(', ') : 'ninguno') + '</b>.</p><div class="note info">Se aplica al borrador (no se publica solo).</div>', footer: '<button class="btn" data-act="modal-close">Cancelar</button><button class="btn pri" data-act="mp-imp-ok">Aplicar al borrador</button>' });
        CM.pendImp = o;
      } catch (e) { CM.toast('El archivo no es una configuración válida del menú.', true); }
    };
    fr.readAsText(ev.target.files[0]); ev.target.value = '';
  });
  CM.acts['mp-imp-ok'] = function () { if (CM.pendImp) { CM.db.menu.draft = CM.pendImp; CM.pendImp = null; CM.modal.close(true); guardarBorrador('Configuración importada'); } };
})(window);
