/* Pruebas del núcleo de migración (node t/migra.test.js). Datos 100 % ficticios (t/libro_sintetico.json). */
'use strict';
const assert = require('assert');
const M = require('../js/migra-core.js');
const L = JSON.parse(JSON.stringify(require('./libro_sintetico.json')));
const HOY = '2026-10-22';
const TODAS = {}; Object.keys(M.REGLAS).forEach(k => { TODAS[k] = true; });
let ok = 0;
function t(nombre, fn) { try { fn(); ok++; console.log('ok  ' + nombre); } catch (e) { console.error('FALLA ' + nombre + '\n   ' + e.message); process.exitCode = 1; } }
const clon = o => JSON.parse(JSON.stringify(o));
const sinReglas = () => M.analizar(clon(L), { hoy: HOY });
const conReglas = (extra) => M.analizar(clon(L), Object.assign({ hoy: HOY, reglas: TODAS }, extra || {}));

/* ---------- utilidades ---------- */
t('números con coma decimal, miles y negativos', () => {
  const u = M._u;
  assert.strictEqual(u.cent('49999,98'), 4999998);
  assert.strictEqual(u.cent('30000,01'), 3000001);
  assert.strictEqual(u.cent('0,01'), 1);
  assert.strictEqual(u.cent('10.000'), 1000000);
  assert.strictEqual(u.cent('1.500,50'), 150050);
  assert.strictEqual(u.cent('-20000'), -2000000);
  assert.strictEqual(u.cant('2,125'), 2.13);
  assert.strictEqual(u.cant('0,3'), 0.3);
  assert.strictEqual(u.cent(''), null);
  assert.ok(Number.isNaN(u.cent('12abc')));
});
t('fechas: texto, con hora, sin cero, número de serie, inválidas', () => {
  const f = M._u.fecha;
  assert.deepStrictEqual(f('30/03/2026 22:53:32'), { fecha: '2026-03-30', ts: '2026-03-31T01:53:32.000Z' });
  assert.strictEqual(f('9/05/2026 20:36:22').fecha, '2026-05-09');
  assert.strictEqual(f('18/03/2026').fecha, '2026-03-18');
  assert.strictEqual(f('46114,425301').fecha, '2026-04-02'); // número de serie de Excel con coma decimal
  assert.ok(Number.isNaN(f('31/02/2026')));
  assert.ok(Number.isNaN(f('hola')));
  assert.strictEqual(f(''), null);
});
t('clasificación de productos y servicios', () => {
  const c = M._u.clasificar;
  assert.strictEqual(c('ACEITE Q3').prod, 'aceite');
  assert.strictEqual(c('Crema Ungüento 50cc').prod, 'crema');
  assert.strictEqual(c('consulta medica 1/4').prod, 'servicio');
  assert.strictEqual(c('Hrs Extras D.A').prod, 'servicio');
  assert.strictEqual(c('Tropicana Doble Cookies').prod, 'flores');
});
t('enlaces: sólo https', () => {
  assert.strictEqual(M._u.httpsOk('javascript:alert(1)'), null);
  assert.strictEqual(M._u.httpsOk('http://x.com'), null);
  assert.ok(M._u.httpsOk('https://docs.google.com/x'));
});

/* ---------- todo o nada ---------- */
t('modo estricto: rechaza todo y explica fila y causa', () => {
  const p = sinReglas();
  assert.strictEqual(p.ok, false);
  assert.ok(p.errores.length >= 10);
  assert.ok(p.errores.some(e => e.hoja === 'Entregas' && e.id === 'en000006' && /sin legajo/.test(e.causa)));
  assert.ok(p.errores.some(e => e.hoja === 'Entregas' && /ciclo de cultivo/.test(e.causa)));
  assert.ok(p.errores.some(e => e.hoja === 'EntregasDetalle' && e.id === 'de000017'));
  assert.ok(p.errores.every(e => e.fila !== undefined && e.causa));
});
t('con reglas que resuelven todo, pero SIN «separar a revisión»: sigue bloqueado', () => {
  const r = clon(TODAS); r.separarARevision = false;
  const p = M.analizar(clon(L), { hoy: HOY, reglas: r });
  assert.strictEqual(p.ok, false);
  assert.ok(p.errores.some(e => e.id === 'en000006'));
  assert.ok(p.errores.some(e => e.id === 'en000012'));
});
t('con todas las reglas: listo, con números esperados', () => {
  const p = conReglas();
  assert.strictEqual(p.ok, true, JSON.stringify(p.errores));
  assert.strictEqual(p.resumen.pacientes, 8);
  assert.strictEqual(p.resumen.aRevisar, 5);
  assert.strictEqual(p.resumen.dispensaciones, 11);
  assert.strictEqual(p.resumen.donaciones, 10);
  assert.strictEqual(p.resumen.donadoCent, 36399998); // 37000+105000+30000+24000+16000+16000+16000+10000+60000+49999,98
  assert.strictEqual(p.resumen.movimientos, 6); // el de «horas» se ignora
  assert.strictEqual(p.resumen.lotes, 5);       // consulta y horas no son lotes
  assert.strictEqual(p.resumen.seguimientos, 2);
  assert.strictEqual(p.resumen.documentos, 2);
});
t('cada dispensación tiene ciclo de origen (histórico, rotulado)', () => {
  const p = conReglas();
  assert.ok(p.disp.every(d => d.cu === 'CU-HIST-MIGRACION' && d.cuHist === true));
  assert.ok(p.ciclo && p.ciclo.historico && p.ciclo.estado === 'cerrado');
});
t('importes: columnas por medio, mixto con desglose, sin desglose, descuento negativo, servicio', () => {
  const p = conReglas(), ap = id => p.aportes.filter(a => a.entrega === id);
  assert.deepStrictEqual(ap('en000003').map(a => [a.medio, a.cent]), [['efectivo', 3000000], ['transferencia', 2400000]]);
  assert.deepStrictEqual(ap('en000004').map(a => [a.medio, a.cent]), [['otro', 1600000]]);
  assert.deepStrictEqual(ap('en000009').map(a => [a.medio, a.cent]), [['efectivo', 1000000]]);
  assert.strictEqual(ap('en000010')[0].servicio, 6000000);
  assert.strictEqual(p.disp.filter(d => d.entrega === 'en000010').length, 0);
  assert.strictEqual(ap('en000005').length, 0); // dispensación sin donación
  assert.strictEqual(p.disp.filter(d => d.entrega === 'en000005').length, 1);
  assert.ok(p.aportes.every(a => Number.isInteger(a.cent) && a.cent > 0 && a.rubroId === 'R-01'));
});
t('un renglón con genética pero cantidad 0 e importe 0 se omite (con la regla) y no hace perder la entrega', () => {
  const p = conReglas();
  assert.ok(p.omitidos.some(o => o.id === 'de000019'));
  assert.ok(p.aportes.some(a => a.entrega === 'en000002' && a.cent === 10500000));
  const r = clon(TODAS); r.omitirRenglonesVacios = false; r.separarARevision = false;
  assert.ok(M.analizar(clon(L), { hoy: HOY, reglas: r }).errores.some(e => e.id === 'en000002' && /de000019 vacío/.test(e.causa)));
});
t('una entrega con un renglón irresoluble va entera a revisión (no se parte)', () => {
  const p = conReglas();
  assert.ok(p.revision.some(r => r.id === 'en000012'));
  assert.strictEqual(p.disp.filter(d => d.entrega === 'en000012').length, 0);
});
t('stock reconstruido por movimientos y comparado con la hoja', () => {
  const p = conReglas(), c = n => p.controlStock.find(x => x.nombre === n);
  assert.strictEqual(c('Tropicana ejemplo').reconstruido, 69.5); // 100 − 0,5 − 15 − 5 − 2 − 2 − 6
  assert.strictEqual(c('Tropicana ejemplo').coincide, false);
  assert.strictEqual(c('Crema Ungüento 50cc ejemplo').coincide, true);
});
t('legajos: nunca se reutiliza; formato L-AAMMDD-XXXXXX con la fecha de ingreso; DNI dudoso a revisar', () => {
  const p = conReglas(), legs = p.pacientes.map(x => x.leg);
  assert.strictEqual(new Set(legs).size, legs.length);
  assert.ok(legs.every(l => /^L-\d{6}-[2-9A-HJKMNP-Z]{6}$/.test(l)));
  const ana = p.pacientes.find(x => x.legAnt === '99100001');
  assert.ok(ana.leg.startsWith('L-260330-'));
  const nan = p.pacientes.find(x => x.legAnt === 'NaN');
  assert.ok(nan.revisar && nan.doc === null && /^88\d{11}$/.test(nan.key));
  assert.ok(p.pacientes.find(x => x.legAnt === '99100010').revisar); // nombre = correo
});
t('el formulario completa la ficha y no se asocia a otro', () => {
  const p = conReglas(), e = p.enriquecer.find(x => x.key === '99100001');
  assert.strictEqual(e.campos.nac, '1997-05-11');
  assert.strictEqual(e.campos.tel, '3875550001');
  assert.ok(p.pacientes.some(x => x.key === '99100050' && x.revisar));
});
t('idempotencia: con lo ya migrado marcado, no se duplica nada', () => {
  const p1 = conReglas(), ids = {}, docs = {}, legAnt = {};
  [].concat(p1.disp, p1.aportes, p1.movs, p1.seg, p1.docs, p1.docInst, p1.recursos).forEach(x => { ids[x.id] = 1; });
  p1.enriquecer.forEach(x => { ids[x.sid] = 1; }); p1.entregas.forEach(x => { ids[x] = 1; }); p1.lotes.forEach(x => { ids['LOT:' + x.legacyId] = 1; });
  p1.pacientes.forEach(x => { if (x.doc) docs[x.doc.num] = x.key; if (x.legAnt) legAnt[x.legAnt] = x.key; });
  const p2 = conReglas({ existente: { docs, legAnt, migIds: ids, emails: { 'admin.migrado@example.org': 1, 'operadora.migrada@example.org': 1 } } });
  assert.strictEqual(p2.ok, true);
  ['pacientes', 'dispensaciones', 'donaciones', 'movimientos', 'lotes', 'seguimientos', 'documentos', 'usuarios', 'docInst', 'recursos'].forEach(k => assert.strictEqual(p2.resumen[k], 0, k));
});
t('un paciente que ya existe en el sistema por DNI no se duplica', () => {
  const p = conReglas({ existente: { docs: { '99100002': '99100002' }, legAnt: {}, migIds: {}, emails: {} } });
  assert.ok(!p.pacientes.some(x => x.key === '99100002'));
  assert.ok(p.disp.some(d => d.key === '99100002'));
});
t('repetidos en la hoja Legajo y EntregaID repetido bloquean (no hay regla que los tape)', () => {
  const d = clon(L); d.Legajo.push(['99100002', 'Otro (ficticio)', '99100002', '01/01/2026', 'Activo', '']);
  d.Entregas.push(['en000001', '01/01/2026', '99100001', '', 'EFECTIVO', 'x@example.org', '', '1000']);
  const p = M.analizar(d, { hoy: HOY, reglas: TODAS });
  assert.strictEqual(p.ok, false);
  assert.ok(p.errores.some(e => /repetido/.test(e.causa) && e.hoja === 'Legajo'));
  assert.ok(p.errores.some(e => /repetido/.test(e.causa) && e.hoja === 'Entregas'));
});
t('falta una pestaña obligatoria o una columna crítica', () => {
  const d = clon(L); delete d.EntregasDetalle;
  assert.ok(M.analizar(d, { hoy: HOY }).errores.some(e => /Falta la pestaña/.test(e.causa)));
  const d2 = clon(L); d2.Entregas[0][2] = 'Paciente';
  assert.ok(M.analizar(d2, { hoy: HOY, reglas: TODAS }).errores.some(e => /columna «leg»/.test(e.causa)));
});
t('rol desconocido y correo inválido en Usuarios_Roles', () => {
  const d = clon(L); d.Usuarios_Roles.push(['no-es-correo', 'X', 'Administrador'], ['y@example.org', 'Y', 'Dueño']);
  const p = M.analizar(d, { hoy: HOY, reglas: TODAS });
  assert.ok(p.errores.some(e => /Correo inválido/.test(e.causa)));
  assert.ok(p.errores.some(e => /Rol desconocido/.test(e.causa)));
});
t('datos no confiables: rutas peligrosas, enlaces no https, fechas futuras', () => {
  const d = clon(L);
  d.Documentos.push(['dcx', '01/01/2026', '99100001', 'x', '', '../../etc/passwd']);
  d['Recursos_Utiles'].push(['rx', 'malo', 'javascript:alert(1)']);
  d.Entregas.push(['enfut', '01/01/2027 10:00:00', '99100001', '', 'EFECTIVO', 'x@example.org', '', '1000']);
  d.EntregasDetalle.push(['defut', 'enfut', 'g0000002', '1', '1000', '1000', '', '1000']);
  const p = M.analizar(d, { hoy: HOY, reglas: TODAS });
  assert.ok(p.errores.some(e => /Ruta de archivo no permitida/.test(e.causa)));
  assert.ok(p.errores.some(e => /no es https/.test(e.causa)));
  assert.ok(p.revision.some(e => e.id === 'enfut' && /futura/.test(e.causa)));
});
t('el texto se recorta y no trae caracteres de control', () => {
  const d = clon(L); d.Legajo.push(['99100099', 'A\u0000B' + 'x'.repeat(500), '99100099', '01/01/2026', 'Activo', '']);
  const p = M.analizar(d, { hoy: HOY, reglas: TODAS }), x = p.pacientes.find(q => q.key === '99100099');
  assert.ok(x.nombre.length <= 120 && !/\u0000/.test(x.nombre));
});

t('Efectivo/Transferencia en 0 explícito no inventa una donación', () => {
  const d = clon(L); d.Entregas.push(['enzero', '01/10/2026', '99100001', '', 'EFECTIVO', 'x@example.org', '', '0', '0']);
  d.EntregasDetalle.push(['dezero', 'enzero', 'g0000002', '1', '5000', '5000', '', '5000']);
  const p = M.analizar(d, { hoy: HOY, reglas: TODAS });
  assert.strictEqual(p.aportes.filter(a => a.entrega === 'enzero').length, 0);
  assert.ok(p.avisos.some(a => a.id === 'enzero' && /no coincide/.test(a.causa)));
});
t('lo cobrado distinto del detalle bloquea si no se enciende «cobradoManda»', () => {
  const d = clon(L); d.Entregas.push(['endif', '01/10/2026', '99100001', '', 'EFECTIVO', 'x@example.org', '', '9000']);
  d.EntregasDetalle.push(['dedif', 'endif', 'g0000002', '1', '5000', '5000', '', '5000']);
  const r = clon(TODAS); r.cobradoManda = false; r.separarARevision = false;
  assert.ok(M.analizar(d, { hoy: HOY, reglas: r }).errores.some(e => e.id === 'endif' && /no coincide/.test(e.causa)));
});
t('claves sin choques: entrega «X:efectivo» y entrega «X» generan claves distintas', () => {
  const d = clon(L);
  d.Entregas.push(['eq', '01/10/2026', '99100001', '', 'EFECTIVO', 'x@example.org', '', '1000'], ['eq:efectivo', '01/10/2026', '99100001', '', 'EFECTIVO', 'x@example.org', '', '1000']);
  d.EntregasDetalle.push(['dq1', 'eq', 'g0000002', '1', '1000', '1000', '', '1000'], ['dq2', 'eq:efectivo', 'g0000002', '1', '1000', '1000', '', '1000']);
  const p = M.analizar(d, { hoy: HOY, reglas: TODAS }), ids = [].concat(p.aportes.map(a => a.id), p.entregas, p.disp.map(x => x.id));
  assert.strictEqual(new Set(ids).size, ids.length);
});
t('dos genéticas cuyo código de lote chocaría se informan', () => {
  const d = clon(L); d.Geneticas.push(['g-0000001', 'Otra', 'CBD', '', '', '', '', '', '']);
  assert.ok(M.analizar(d, { hoy: HOY, reglas: TODAS }).errores.some(e => /choca/.test(e.causa)));
});
t('reordenar las filas del formulario no hace reimportar respuestas viejas', () => {
  const p1 = conReglas(), ids = {}; p1.enriquecer.forEach(x => { ids[x.sid] = 1; }); p1.seg.forEach(x => { ids[x.id] = 1; });
  const d = clon(L); const f = d['Respuestas de formulario 1']; f.splice(1, 0, f.pop());
  const g = d['Respuestas de formulario 2']; g.splice(1, 0, g.pop());
  const p2 = M.analizar(d, { hoy: HOY, reglas: TODAS, existente: { docs: {}, legAnt: {}, migIds: ids, emails: {} } });
  assert.strictEqual(p2.enriquecer.length, 0); assert.strictEqual(p2.seg.filter(x => x.id.startsWith('F2:')).length, 0);
});

console.log('\n' + ok + ' pruebas correctas' + (process.exitCode ? ' · HAY FALLAS' : ''));
