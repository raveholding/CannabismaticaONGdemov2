"""Ficha del paciente: una carpeta por legajo + «Documentos y escaneos» (Chromium real, datos ficticios).
Uso: python3 t/e2e_docs.py"""
import http.server, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fallas, oks = [], [0]
def chk(c, n):
    if c: oks[0] += 1; print('ok  ' + n)
    else: fallas.append(n); print('FALLA ' + n)
os.chdir(RAIZ)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), Q); threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/index.html' % srv.server_address[1]
PDF = os.path.join('/tmp', 'doc_ficticio.pdf'); open(PDF, 'wb').write(b'%PDF-1.4\n% documento ficticio de prueba\n')
PDF2 = os.path.join('/tmp', 'doc_ficticio2.pdf'); open(PDF2, 'wb').write(b'%PDF-1.4\n% otro documento ficticio\n')
with sync_playwright() as pw:
    br = pw.chromium.launch(); pg = br.new_page(viewport={'width': 1280, 'height': 900})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(URL + '#/acceso'); pg.wait_for_timeout(500)
    pg.fill('input[name=correo]', 'admin@example.com'); pg.fill('input[name=clave]', 'Demo2026!'); pg.click('form[data-form=acceso] button[type=submit]'); pg.wait_for_timeout(700)
    ev = pg.evaluate
    pg.goto(URL + '#/paciente/99000002'); pg.wait_for_timeout(400)
    card = pg.locator('section.drive')
    chk(card.count() == 1, 'una sola tarjeta de carpeta del legajo')
    chk(card.locator('a.btn.pri').count() == 1, 'un solo botón para abrir la carpeta (antes eran dos)')
    chk(card.locator('text=carpeta anterior de historial clínico').count() == 1, 'la carpeta vieja queda como enlace chico, no como segundo botón')
    chk(pg.locator('#docCam[capture=environment]').count() == 1 and pg.locator('#docFile').count() == 1, 'botones «Subir documento» y «Escanear con la cámara»')
    chk(ev('CM.driveModo()') == 'pendiente', 'demo sin Client ID: Drive pendiente (no se finge nada)')
    # subir sin Drive: queda guardado en el equipo como pendiente
    pg.set_input_files('#docFile', PDF); pg.wait_for_timeout(300)
    pg.select_option('form[data-form=doc-subir] select[name=tipo]', 'REPROCANN'); pg.fill('form[data-form=doc-subir] input[name=desc]', 'Vigente 2029 (ejemplo)')
    pg.click('#modalRoot button[type=submit]'); pg.wait_for_timeout(900)
    d = ev("CM.db.legDocs.filter(x=>x.dni==='99000002')")
    chk(len(d) == 1 and d[0]['estado'] == 'pendiente' and len(d[0]['hash']) == 64 and d[0]['version'] == 1, 'sin Drive: registrado como «pendiente de subir» con huella y versión')
    chk(d[0]['nombreDrive'].startswith(ev("CM.db.pacientes['99000002'].leg") + '_REPROCANN_') and d[0]['nombreDrive'].endswith('.pdf'), 'nombre único con legajo, tipo, fecha, versión y huella')
    guardado = ev("(async()=>{const r=indexedDB.open(CM.docsIDB,1);const db=await new Promise(o=>r.onsuccess=()=>o(r.result));return await new Promise(o=>{const q=db.transaction('f').objectStore('f').get('%s');q.onsuccess=()=>o(q.result?q.result.size:0)})})()" % d[0]['id'])
    chk(guardado > 0, 'el archivo quedó guardado en este equipo (no se pierde)')
    chk(pg.locator('text=Pendiente de subir').count() >= 1, 'la ficha lo muestra «pendiente de subir»')
    aud = ev("CM.db.audit[0].detalle")
    chk('huella' in aud and 'Vigente' not in aud, 'auditoría con legajo, tipo y huella, sin el contenido')
    # mismo archivo otra vez: no se duplica
    pg.set_input_files('#docFile', PDF); pg.wait_for_timeout(300)
    pg.select_option('form[data-form=doc-subir] select[name=tipo]', 'Otro'); pg.click('#modalRoot button[type=submit]'); pg.wait_for_timeout(700)
    chk(ev("CM.db.legDocs.filter(x=>x.dni==='99000002').length") == 1, 'el mismo archivo no se duplica')
    # Drive disponible (Google simulado): se sube, queda el id y se borra la copia local
    ev('''(()=>{const D=CM._drv,files=[];CM.db.ong.driveClientId='123456-demo.apps.googleusercontent.com';
      D.conectado=()=>true; CM._drv.conectado=D.conectado;
      CM.driveCarpetaPaciente=p=>Promise.resolve({id:'CARPETA000000demo'});
      D.listar=q=>Promise.resolve({files:files.filter(f=>q.includes(f.appProperties.vbongHash))});
      D.api=(u,o)=>{window.__sub=(window.__sub||0)+1;const f={id:'ARCHIVO00000'+files.length,webViewLink:'https://drive.google.com/file/d/ARCHIVO/view',appProperties:{vbongHash:window.__h}};files.push(f);return Promise.resolve(f)};})()''')
    ev("window.__h=CM.db.legDocs.find(x=>x.dni==='99000002').hash")
    pg.goto(URL + '#/inicio'); pg.wait_for_timeout(100); pg.goto(URL + '#/paciente/99000002'); pg.wait_for_timeout(300)
    pg.click('[data-act=docs-reintentar]'); pg.wait_for_timeout(900)
    d2 = ev("CM.db.legDocs.find(x=>x.dni==='99000002')")
    chk(d2['estado'] == 'subido' and d2['fileId'].startswith('ARCHIVO') and d2['url'].startswith('https://'), 'con Drive: subido, con id y enlace de Google')
    quedo = ev("(async()=>{const r=indexedDB.open(CM.docsIDB,1);const db=await new Promise(o=>r.onsuccess=()=>o(r.result));return await new Promise(o=>{const q=db.transaction('f').objectStore('f').get('%s');q.onsuccess=()=>o(!!q.result)})})()" % d2['id'])
    chk(not quedo, 'la copia local se borra recién después de que Google confirmó')
    chk(pg.locator('section.drive >> text=En Drive').count() >= 1, 'la ficha lo muestra «En Drive» con botón Abrir')
    # segunda versión del mismo tipo con otro archivo
    pg.set_input_files('#docFile', PDF2); pg.wait_for_timeout(300)
    pg.select_option('form[data-form=doc-subir] select[name=tipo]', 'REPROCANN'); pg.click('#modalRoot button[type=submit]'); pg.wait_for_timeout(900)
    vs = ev("CM.db.legDocs.filter(x=>x.dni==='99000002').map(x=>x.version).sort()")
    chk(vs == [1, 2], 'otro archivo del mismo tipo queda como versión 2 (nunca pisa la 1)')
    # permisos: operador puede subir; tipo de archivo no permitido
    ev("CM.db.cfg.rol='operador'"); pg.goto(URL + '#/inicio'); pg.wait_for_timeout(100); pg.goto(URL + '#/paciente/99000002'); pg.wait_for_timeout(300)
    chk(pg.locator('#docFile').count() == 1, 'el operador (voluntaria) puede subir escaneos')
    ev("CM.db.cfg.rol='admin'")
    open('/tmp/x.html', 'w').write('<b>hola</b>')
    pg.set_input_files('#docFile', '/tmp/x.html'); pg.wait_for_timeout(300)
    chk(pg.locator('form[data-form=doc-subir]').count() == 0, 'un HTML no se acepta')
    # demo: banner de Pacientes explica el modelo
    pg.goto(URL + '#/pacientes'); pg.wait_for_timeout(300)
    chk(pg.locator('text=nadie tendrá que conectar nada').count() >= 1, 'el banner explica la conexión manual y la cuenta de servicio')
    pg.set_viewport_size({'width': 360, 'height': 800}); pg.goto(URL + '#/paciente/99000002'); pg.wait_for_timeout(400)
    chk(ev('document.documentElement.scrollWidth') <= 362, 'ficha en 360 px sin desborde')
    chk(not errs, 'consola sin errores' + ('' if not errs else ': ' + ' | '.join(errs[:3])))
    br.close()
print('\n%d correctas, %d fallas' % (oks[0], len(fallas))); sys.exit(1 if fallas else 0)
