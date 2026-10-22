// Genera el plan (todas las reglas) desde el libro sintético, para probar migra_aplicar en Postgres.
const M = require('../../js/migra-core.js'), L = require('../../t/libro_sintetico.json');
const r = {}; Object.keys(M.REGLAS).forEach(k => r[k] = true);
let s = 7; const rnd = n => Array.from({ length: n }, () => (s = (s * 1103515245 + 12345) >>> 0));
const p = M.analizar(L, { hoy: '2026-10-22', reglas: r, rnd });
if (process.argv[2] === 'malo') p.aportes[3].rubroId = 'R-NO-EXISTE';
if (process.argv[2] === 'error') p.ok = false;
if (process.argv[2] === 'sinciclo') p.disp[0].cu = '';
if (process.argv[2] === 'cicloreal') p.disp[0].cu = 'CU-261020-REAL1';
if (process.argv[2] === 'movmalo') p.movs.push({ id: 'MV:x', fecha: '2026-01-01', ts: '2026-01-01T12:00:00Z', lote: p.lotes[0].id, tipo: 'dispensacion', cant: 500, ref: 'x', motivo: '' });
if (process.argv[2] === 'form') { p.formResp.push({ id: 'F1:nuevo:99100001', tipo: 'F1', key: '99100001', fecha: '2026-10-01' }); p.enriquecer = [{ key: '99100001', sid: 'F1:nuevo:99100001', campos: { cp: '4401' } }]; }
process.stdout.write(JSON.stringify(p));
