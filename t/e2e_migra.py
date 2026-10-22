"""Prueba de punta a punta de «Migración del sistema anterior» en un Chromium real (Playwright).
Datos 100 % ficticios: t/libro_sintetico.xlsx (generado por t/mk_libro.py).
Uso: python3 t/e2e_migra.py [URL]   (por defecto levanta un servidor local en el repo)"""
import http.server, json, os, socketserver, sys, threading
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(RAIZ, 't', 'libro_sintetico.xlsx')
fallas, oks = [], [0]
def chk(cond, nombre):
    if cond: oks[0] += 1; print('ok  ' + nombre)
    else: fallas.append(nombre); print('FALLA ' + nombre)

def servir():
    os.chdir(RAIZ)
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    s = socketserver.TCPServer(('127.0.0.1', 0), Q); threading.Thread(target=s.serve_forever, daemon=True).start()
    return 'http://127.0.0.1:%d/index.html' % s.server_address[1]

URL = sys.argv[1] if len(sys.argv) > 1 else servir()
with sync_playwright() as pw:
    br = pw.chromium.launch()
    pg = br.new_page(viewport={'width': 1280, 'height': 900})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(URL + '#/acceso'); pg.wait_for_timeout(600)
    pg.fill('input[name=correo]', 'admin@example.com'); pg.fill('input[name=clave]', 'Demo2026!')
    pg.click('form[data-form=acceso] button[type=submit]'); pg.wait_for_timeout(800)
    ev = lambda js: pg.evaluate(js)
    antes = ev('({p:Object.keys(CM.db.pacientes).length,d:CM.db.disp.length,a:CM.db.aportes.length,m:CM.db.movs.length,aud:CM.db.audit.length})')

    pg.goto(URL + '#/migracion'); pg.wait_for_timeout(400)
    chk(pg.locator('h1', has_text='Migración del sistema anterior').count() == 1, 'la pantalla existe y la ve el administrador')
    chk(pg.locator('#nav a[href="#/migracion"]').count() == 1, 'aparece en el menú lateral')
    pg.set_input_files('#migFile', XLSX); pg.wait_for_timeout(1500)
    chk(ev('Object.keys(CM.mg.libro||{}).length') == 13, 'lee las 13 pestañas del .xlsx con su nombre')
    chk(ev('CM.mg.plan.ok') is False, 'modo estricto: no se puede migrar')
    chk(pg.locator('[data-act=mig-ok]').is_disabled(), 'botón «Migrar todo» deshabilitado con errores')
    chk(ev("CM.mg.plan.errores.some(e=>e.id==='en000006')"), 'el error de la entrega sin legajo se ve con su ID')
    chk(ev("CM.mg.libro['Entregas'][1][1]").startswith('46114,'), 'una fecha como número de serie llega con coma decimal')
    pg.click('[data-act=mig-probar]'); pg.wait_for_timeout(200)
    chk(ev('Object.keys(CM.db.pacientes).length') == antes['p'], '«Probar» no modifica nada')

    # encender todas las reglas
    for k in ev('Object.keys(MIGRA.REGLAS)'):
        pg.check('form[data-form=mig-reglas] input[name=%s]' % k)
    pg.click('form[data-form=mig-reglas] button[type=submit]'); pg.wait_for_timeout(400)
    r = ev('CM.mg.plan.resumen')
    chk(ev('CM.mg.plan.ok') is True and r['dispensaciones'] == 11 and r['donaciones'] == 10 and r['donadoCent'] == 36399998, 'con reglas: listo y con los mismos números que en Node (11 / 10 / $ 363.999,98)')
    chk(not pg.locator('[data-act=mig-ok]').is_disabled(), 'botón «Migrar todo» habilitado')
    pg.click('[data-act=mig-ok]'); pg.wait_for_timeout(300)
    chk(pg.locator('#modalRoot .md', has_text='Reglas encendidas').count() == 1, 'confirmación muestra las reglas encendidas')
    pg.click('[data-act=mig-ok2]'); pg.wait_for_timeout(800)
    d = ev('''(()=>{const db=CM.db,l=db.migra.lotes[db.migra.lotes.length-1];return {lote:l&&l.id,
      p:Object.keys(db.pacientes).length,d:db.disp.length,a:db.aportes.length,
      dm:db.disp.filter(x=>x.mig).length,am:db.aportes.filter(x=>x.mig).length,
      suma:db.aportes.filter(x=>x.mig).reduce((s,x)=>s+x.cent,0),
      sinCiclo:db.disp.filter(x=>x.mig&&!x.cu).length, ciclo:!!CM.cultivo('CU-HIST-MIGRACION'),
      tro:CM.stockLote('L-MIG-G0000002'), docs:db.legDocs.length, users:db.users.filter(u=>u.mig&&!u.activo).length,
      aud:db.audit[0].accion+' | '+db.audit[0].detalle, guardado:!!localStorage.getItem('cmv2_db_v2')&&JSON.parse(localStorage.getItem('cmv2_db_v2')).migra.lotes.length}})()''')
    chk(d['lote'] == 'MIG-0001', 'se creó el lote MIG-0001')
    chk(d['p'] == antes['p'] + 8 and d['dm'] == 11 and d['am'] == 10, 'se cargaron 8 legajos, 11 dispensaciones y 10 donaciones')
    chk(d['suma'] == 36399998, 'el total donado cierra al centavo')
    chk(d['sinCiclo'] == 0 and d['ciclo'], 'toda dispensación migrada tiene ciclo de origen (histórico)')
    chk(d['tro'] == 69.5, 'stock del lote reconstruido por movimientos (69,5 g)')
    chk(d['docs'] == 2 and d['users'] == 2, 'documentos del legajo y usuarios (inactivos, a invitar)')
    chk('Migración del sistema anterior' in d['aud'] and 'cicloHistorico' in d['aud'], 'auditoría con las reglas usadas')
    chk(d['guardado'] == 1, 'quedó guardado en el navegador')

    # ficha del paciente: documentos y marca de revisión
    pg.goto(URL + '#/paciente/99100001'); pg.wait_for_timeout(400)
    chk(pg.locator('text=Documentos del sistema anterior').count() == 1, 'la ficha muestra los documentos del sistema anterior')
    href = pg.locator('a:has-text("Buscar en Drive")').first.get_attribute('href')
    chk(href.startswith('https://drive.google.com/drive/search?q=dc000001'), 'enlace de búsqueda en Drive por el ID del documento')
    k = ev("Object.keys(CM.db.pacientes).find(k=>CM.db.pacientes[k].legAnt==='NaN')")
    pg.goto(URL + '#/paciente/' + k); pg.wait_for_timeout(400)
    chk(pg.locator('text=Legajo migrado para revisar').count() == 1, 'un legajo dudoso se ve marcado «para revisar»')
    pg.goto(URL + '#/paciente/99100001'); pg.wait_for_timeout(300)
    chk(ev("CM.db.pacientes['99100001'].nac") == '1997-05-11' and ev("CM.db.pacientes['99100001'].historiaCompleta") is True, 'el formulario completó la ficha')

    # XSS: el comentario con etiqueta se muestra como texto
    chk(ev("CM.db.seg.some(s=>/<b>con<\\/b>/.test(s.comentario))") and pg.locator('#main b:has-text("con")').count() == 0, 'texto con etiquetas no se interpreta como HTML')

    # las donaciones migradas no entran a una caja abierta hoy
    ev('''(()=>{CM.db.cajas.push({id:'CJ-T',nro:99,fecha:'2026-01-01',estado:'abierta',inicial:0,user:'t',ts:new Date().toISOString()});})()''')
    chk(ev("(()=>{const mig=new Set(CM.db.aportes.filter(a=>a.mig).map(a=>a.id));const c=CM.db.cajas.find(c=>c.id==='CJ-T');const t0=CM.cajaMovs(c);return mig.size>0&&t0.every(m=>!mig.has(m.ref))})()"), 'las donaciones migradas no se suman a la caja abierta')
    ev("CM.db.cajas=CM.db.cajas.filter(c=>c.id!=='CJ-T')")

    # reimportar el mismo archivo: no duplica
    pg.goto(URL + '#/migracion'); pg.wait_for_timeout(300)
    pg.set_input_files('#migFile', XLSX); pg.wait_for_timeout(1500)
    for k2 in ev('Object.keys(MIGRA.REGLAS)'):
        pg.check('form[data-form=mig-reglas] input[name=%s]' % k2)
    pg.click('form[data-form=mig-reglas] button[type=submit]'); pg.wait_for_timeout(400)
    r2 = ev('CM.mg.plan.resumen')
    chk(r2['pacientes'] == 0 and r2['dispensaciones'] == 0 and r2['donaciones'] == 0 and r2['movimientos'] == 0 and r2['documentos'] == 0, 'reimportar el mismo archivo no duplica nada')

    # atomicidad: si algo falla en medio, no cambia nada
    snap = ev('JSON.stringify(CM.db).length')
    res = ev('''(()=>{const p=MIGRA.analizar(CM.mg.libro,{hoy:CM.hoy(),reglas:Object.fromEntries(Object.keys(MIGRA.REGLAS).map(k=>[k,true])),existente:{docs:{},legAnt:{},migIds:{},emails:{}},rnd:n=>crypto.getRandomValues(new Uint32Array(n))});
       p.aportes[3].rubroId='R-NO-EXISTE'; return CM.migraAplicar(p,'falla.xlsx');})()''')
    chk(res['ok'] is False and ev('JSON.stringify(CM.db).length') == snap, 'una falla en medio revierte todo (rubro inexistente)')

    # deshacer: bloqueado si algo posterior depende; libre si no
    ev('''CM.db.disp.push({id:'D-POST',fecha:CM.hoy(),dni:'99100001',lote:'L-MIG-G0000002',cant:1,unidad:'g',anulada:null})''')
    pg.goto(URL + '#/migracion'); pg.wait_for_timeout(300)
    pg.click('[data-act=mig-deshacer]'); pg.wait_for_timeout(200); pg.click('[data-act=mig-deshacer2]'); pg.wait_for_timeout(400)
    chk(ev('CM.db.migra.lotes[0].deshecho') is False, 'no se deshace si hay una dispensación posterior que lo usa')
    ev("CM.db.disp=CM.db.disp.filter(d=>d.id!=='D-POST')")
    pg.click('[data-act=mig-deshacer]'); pg.wait_for_timeout(200); pg.click('[data-act=mig-deshacer2]'); pg.wait_for_timeout(500)
    fin = ev('({p:Object.keys(CM.db.pacientes).length,d:CM.db.disp.length,a:CM.db.aportes.length,m:CM.db.movs.length,ids:Object.keys(CM.db.migra.ids).length,des:CM.db.migra.lotes[0].deshecho,nac:(CM.db.pacientes["99100001"]||{}).nac})')
    chk(fin['des'] and fin['p'] == antes['p'] and fin['d'] == antes['d'] and fin['a'] == antes['a'] and fin['m'] == antes['m'] and fin['ids'] == 0, 'deshacer deja la base como antes')

    # permisos: mostrador no ve la pantalla
    ev("CM.db.cfg.rol='mostrador'"); pg.goto(URL + '#/inicio'); pg.wait_for_timeout(200); pg.goto(URL + '#/migracion'); pg.wait_for_timeout(300)
    chk(pg.locator('#nav a[href="#/migracion"]').count() == 0 and pg.locator('text=Sin permiso').count() + pg.locator('text=Sólo un administrador').count() >= 1, 'un mostrador no puede migrar')
    ev("CM.db.cfg.rol='admin'")

    # regresión: todas las pantallas abren sin errores, en 360 px sin desborde en migración
    vistas = ev("CM.NAV.filter(n=>n[0]!=='-').map(n=>n[0])")
    malas = []
    for v in vistas:
        pg.goto(URL + '#/' + v); pg.wait_for_timeout(120)
        if pg.locator('#main').inner_text().strip() == '': malas.append(v)
    chk(not malas, 'regresión: las %d pantallas abren (%s)' % (len(vistas), ','.join(malas)))
    pg.set_viewport_size({'width': 360, 'height': 800}); pg.goto(URL + '#/migracion'); pg.wait_for_timeout(300)
    pg.set_input_files('#migFile', XLSX); pg.wait_for_timeout(1200)
    chk(ev('document.documentElement.scrollWidth') <= 362, '360 px sin desborde horizontal')
    h = ev("Math.min(...[...document.querySelectorAll('form[data-form=mig-reglas] label.chk')].map(e=>e.getBoundingClientRect().height))")
    chk(h >= 44, 'casillas de reglas con área táctil ≥ 44 px (%.0f)' % h)
    chk(not errs, 'consola sin errores' + ('' if not errs else ': ' + ' | '.join(errs[:3])))
    br.close()
print('\n%d correctas, %d fallas' % (oks[0], len(fallas)))
sys.exit(1 if fallas else 0)
