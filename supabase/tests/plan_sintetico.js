// Genera el plan (todas las reglas) desde el libro sintético, para probar migra_aplicar en Postgres.
const M = require('../../js/migra-core.js'), L = require('../../t/libro_sintetico.json');
const r = {}; Object.keys(M.REGLAS).forEach(k => r[k] = true);
let s = 7; const rnd = n => Array.from({ length: n }, () => (s = (s * 1103515245 + 12345) >>> 0));
const p = M.analizar(L, { hoy: '2026-10-22', reglas: r, rnd });
if (process.argv[2] === 'malo') p.aportes[3].rubroId = 'R-NO-EXISTE';
if (process.argv[2] === 'error') p.ok = false;
if (process.argv[2] === 'sinciclo') p.disp[0].cu = '';
process.stdout.write(JSON.stringify(p));
