// Pruebas de la función de servidor migra-sheets y del módulo de Google (node t/server.test.ts — Node 22 quita los tipos).
// Google y la base se SIMULAN: no hay red. Datos 100 % ficticios (t/libro_sintetico.json).
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { manejar } from '../supabase/functions/migra-sheets/index.ts';
import { _limpiarCache, carpetaPaciente, vincularDocumento, carpetaLegajos, leerCuentaServicio } from '../supabase/functions/_shared/google.ts';

const LIBRO = JSON.parse(readFileSync(new URL('./libro_sintetico.json', import.meta.url), 'utf8'));
let ok = 0, malas = 0;
async function t(n: string, fn: () => Promise<void>) { try { await fn(); ok++; console.log('ok  ' + n); } catch (e: any) { malas++; console.error('FALLA ' + n + '\n   ' + (e && e.stack || e)); } }

/* ---------- cuenta de servicio de PRUEBA (clave generada en el momento) ---------- */
const par = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const pk = Buffer.from(await crypto.subtle.exportKey('pkcs8', par.privateKey)).toString('base64');
const SA = JSON.stringify({ type: 'service_account', client_email: 'migra-prueba@proyecto-demo.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\n' + pk.replace(/(.{64})/g, '$1\n') + '\n-----END PRIVATE KEY-----\n' });
const SHEET = '1SheetDePruebaFicticio00000000000000000';
const RAIZ = '1RaizDePruebaFicticia000000';
const A = 'aaaaaaaa-0000-0000-0000-00000000000a';

/* ---------- Google + base simulados ---------- */
function mundo(opts: { rol?: string; sinPermisoSheet?: boolean } = {}) {
  const w: any = { tokens: 0, jwtOk: true, scopes: [] as string[], files: [] as any[], n: 0, rpc: [] as any[], legajos: [] as any[], docs: [] as any[], migIds: [] as string[], log: [] as string[] };
  w.files.push({ id: 'ORIG-dc000001', name: 'dc000001.Archivo_PDF.182431.pdf', mimeType: 'application/pdf', parents: ['APPSHEET'], webViewLink: 'https://drive.google.com/file/d/ORIG-dc000001/view', md5Checksum: 'md5x', version: '7', appProperties: {} });
  w.legajos = [{ legajo_id: 'L-260330-ABCDEF', doc: '99100001' }, { legajo_id: 'L-260825-GHJKMN', doc: null }];
  w.docs = [{ id: 'doc-uuid-1', id_anterior: 'dc000001', nombre: 'Consentimiento (ejemplo)', leg: 'L-260330-ABCDEF' }, { id: 'doc-uuid-2', id_anterior: 'dc000099', nombre: 'No existe', leg: 'L-260330-ABCDEF' }];
  const carpetas: Record<string, string> = {};
  const J = (o: any, st = 200) => ({ ok: st < 400, status: st, json: async () => o, text: async () => JSON.stringify(o) });
  function matchQ(f: any, q: string) {
    if (/trashed = false/.test(q) && f.trashed) return false;
    let m;
    if ((m = /'([^']+)' in parents/.exec(q)) && !(f.parents || []).includes(m[1])) return false;
    if ((m = /mimeType = '([^']+)'/.exec(q)) && f.mimeType !== m[1]) return false;
    for (const mm of q.matchAll(/mimeType != '([^']+)'/g)) if (f.mimeType === mm[1]) return false;
    if ((m = /appProperties has \{ key='([^']+)' and value='((?:\\'|[^'])+)' \}/.exec(q)) && (f.appProperties || {})[m[1]] !== m[2].replace(/\\'/g, "'")) return false;
    if ((m = /name contains '((?:\\'|[^'])+)'/.exec(q)) && String(f.name).indexOf(m[1]) < 0) return false;
    return true;
  }
  w.fetch = async (url: string, init: any = {}) => {
    const u = new URL(url), H = init.headers || {};
    w.log.push((init.method || 'GET') + ' ' + u.host + u.pathname);
    if (u.host === 'oauth2.googleapis.com') {
      const jwt = new URLSearchParams(init.body).get('assertion')!; const [h, c, s] = jwt.split('.');
      const okSig = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', par.publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(h + '.' + c));
      const claim = JSON.parse(Buffer.from(c, 'base64url').toString());
      w.jwtOk = w.jwtOk && okSig && claim.iss === 'migra-prueba@proyecto-demo.iam.gserviceaccount.com' && claim.aud === 'https://oauth2.googleapis.com/token' && claim.exp > claim.iat;
      w.scopes.push(claim.scope); w.tokens++;
      return J({ access_token: 'tok-' + w.tokens, expires_in: 3600 });
    }
    if (u.host === 'sheets.googleapis.com') {
      if (opts.sinPermisoSheet) return J({ error: { code: 404 } }, 404);
      assert.ok(String(H.authorization).startsWith('Bearer tok-'));
      if (u.pathname.endsWith(SHEET)) return J({ sheets: Object.keys(LIBRO).map((t) => ({ properties: { title: t } })) });
      const ranges = u.searchParams.getAll('ranges').map((r) => r.replace(/^'|'$/g, '').replace(/''/g, "'"));
      assert.strictEqual(u.searchParams.get('valueRenderOption'), 'FORMATTED_VALUE');
      return J({ valueRanges: ranges.map((r) => ({ range: r, values: LIBRO[r].map((row: any[]) => row.map((c) => String(c))) })) });
    }
    if (u.host === 'www.googleapis.com') {
      if ((init.method || 'GET') === 'POST') {
        const b = JSON.parse(init.body); const f = { id: 'F' + (++w.n), ...b, webViewLink: 'https://drive.google.com/drive/folders/F' + w.n };
        w.files.push(f); return J(f);
      }
      return J({ files: w.files.filter((f: any) => matchQ(f, u.searchParams.get('q') || '')).slice(0, 10) });
    }
    if (u.host === 'db.ejemplo') {
      if (u.pathname === '/auth/v1/user') return H.authorization === 'Bearer jwt-ok' ? J({ id: 'u1' }) : J({}, 401);
      if (u.pathname.startsWith('/rest/v1/rpc/')) {
        const fn = u.pathname.split('/').pop(), args = JSON.parse(init.body); w.rpc.push({ fn, args });
        if (fn === 'migra_rol') return J(opts.rol || 'admin');
        if (fn === 'migra_aplicar') return J({ ok: true, lote: 'MIG-0001', donado_cent: args.p_plan.resumen.donadoCent });
        if (fn === 'migra_vincular_carpeta') { carpetas[args.p_legajo_id] = args.p_folder_id; return J(null); }
        if (fn === 'migra_vincular_documento') { const d = w.docs.find((x: any) => x.id === args.p_doc); d.estado = args.p_estado; d.file_id = args.p_file_id; return J(null); }
      }
      if (u.pathname === '/rest/v1/legajos') return J(w.legajos.filter((l: any) => !carpetas[l.legajo_id]).map((l: any) => ({ legajo_id: l.legajo_id, doc: l.doc, clave: l.doc || 'x' })));
      if (u.pathname === '/rest/v1/migra_ids') return J(w.migIds.map((i: string) => ({ id_anterior: i })));
      if (u.pathname === '/rest/v1/legajo_documentos') return J(w.docs.filter((d: any) => !d.estado && carpetas[d.leg]).map((d: any) => ({ id: d.id, id_anterior: d.id_anterior, nombre: d.nombre, legajos: { drive_folder_id: carpetas[d.leg] } })));
    }
    throw new Error('red no simulada: ' + url);
  };
  return w;
}
const env = (extra: Record<string, string | undefined> = {}) => (k: string) => ({ GOOGLE_SA_JSON: SA, SUPABASE_URL: 'https://db.ejemplo', SUPABASE_ANON_KEY: 'anon', ALLOWED_ORIGINS: 'https://raveholding.github.io', MIGRA_SHEET_ID: SHEET, DRIVE_ROOT_ID: RAIZ, ...extra } as any)[k];
const pedir = (cuerpo: any, jwt = 'jwt-ok', origin = 'https://raveholding.github.io') => new Request('https://fn.ejemplo/migra-sheets', { method: 'POST', headers: { authorization: 'Bearer ' + jwt, origin }, body: JSON.stringify(cuerpo) });
const TODAS: any = { cicloHistorico: true, omitirRenglonesVacios: true, serviciosSinStock: true, crearLegajoFaltante: true, separarARevision: true, medioSinDato: true };

await t('la copia del núcleo en la función es idéntica a js/migra-core.js', async () => {
  assert.strictEqual(readFileSync(new URL('../supabase/functions/_shared/migra-core.js', import.meta.url), 'utf8'), readFileSync(new URL('../js/migra-core.js', import.meta.url), 'utf8'));
});
await t('sin sesión → 401; método GET → 405; CORS sólo para el origen permitido', async () => {
  const w = mundo();
  assert.strictEqual((await manejar(pedir({ accion: 'analizar', comercio: A }, 'malo'), { env: env(), fetch: w.fetch })).status, 401);
  assert.strictEqual((await manejar(new Request('https://fn.ejemplo/x', { method: 'GET' }), { env: env(), fetch: w.fetch })).status, 405);
  const r = await manejar(pedir({ accion: 'analizar', comercio: A }, 'jwt-ok', 'https://malo.example'), { env: env(), fetch: w.fetch });
  assert.strictEqual(r.headers.get('access-control-allow-origin'), null);
});
await t('un mostrador no puede migrar (403)', async () => {
  const w = mundo({ rol: 'mostrador' });
  assert.strictEqual((await manejar(pedir({ accion: 'analizar', comercio: A }), { env: env(), fetch: w.fetch })).status, 403);
});
await t('sin GOOGLE_SA_JSON → 503 «Pendiente de configuración»', async () => {
  const w = mundo(); const r = await manejar(pedir({ accion: 'analizar', comercio: A }), { env: env({ GOOGLE_SA_JSON: undefined }), fetch: w.fetch });
  assert.strictEqual(r.status, 503); assert.match((await r.json()).error, /Pendiente de configuración/);
});
await t('JSON que no es cuenta de servicio: rechazado sin mostrar su contenido', async () => {
  assert.throws(() => leerCuentaServicio('{"type":"user","secreto":"NO-MOSTRAR"}'), (e: any) => !/NO-MOSTRAR/.test(e.message));
});
await t('analizar: lee la planilla con la cuenta de servicio (JWT firmado y verificable) y NO carga nada', async () => {
  _limpiarCache(); const w = mundo();
  const r = await manejar(pedir({ accion: 'analizar', comercio: A }), { env: env(), fetch: w.fetch, hoy: '2026-10-22' });
  const j = await r.json();
  assert.strictEqual(r.status, 200); assert.strictEqual(j.aplicado, false); assert.strictEqual(j.informe.ok, false);
  assert.ok(w.jwtOk); assert.ok(w.scopes.every((s: string) => s === 'https://www.googleapis.com/auth/spreadsheets.readonly'));
  assert.ok(!w.rpc.some((x: any) => x.fn === 'migra_aplicar'));
  assert.ok(!('pacientes' in j.informe) && !JSON.stringify(j).includes('PRIVATE KEY') && !JSON.stringify(j).includes('tok-'));
});
await t('aplicar en modo estricto con errores: no llama a migra_aplicar', async () => {
  _limpiarCache(); const w = mundo();
  const j = await (await manejar(pedir({ accion: 'aplicar', comercio: A }), { env: env(), fetch: w.fetch, hoy: '2026-10-22' })).json();
  assert.strictEqual(j.aplicado, false); assert.ok(!w.rpc.some((x: any) => x.fn === 'migra_aplicar'));
});
await t('aplicar con reglas: envía el plan completo a migra_aplicar (mismos números que el navegador)', async () => {
  _limpiarCache(); const w = mundo();
  const j = await (await manejar(pedir({ accion: 'aplicar', comercio: A, reglas: TODAS }), { env: env(), fetch: w.fetch, hoy: '2026-10-22' })).json();
  assert.strictEqual(j.aplicado, true); assert.strictEqual(j.resultado.donado_cent, 36399998);
  const p = w.rpc.find((x: any) => x.fn === 'migra_aplicar').args.p_plan;
  assert.strictEqual(p.ok, true); assert.strictEqual(p.disp.length, 11); assert.strictEqual(p.aportes.length, 10);
});
await t('planilla no compartida con la cuenta de servicio → mensaje claro (502)', async () => {
  _limpiarCache(); const w = mundo({ sinPermisoSheet: true });
  const r = await manejar(pedir({ accion: 'analizar', comercio: A }), { env: env(), fetch: w.fetch });
  assert.strictEqual(r.status, 502); assert.match((await r.json()).error, /compartí/);
});
await t('drive: crea «Legajos» y una carpeta por legajo ({legajo}_{DNI} o _SD), vincula documentos con acceso directo', async () => {
  _limpiarCache(); const w = mundo();
  const j = await (await manejar(pedir({ accion: 'drive', comercio: A }), { env: env(), fetch: w.fetch })).json();
  assert.deepStrictEqual([j.drive.carpetas, j.drive.vinculados, j.drive.noEncontrados, j.drive.errores.length], [2, 1, 1, 0]);
  const nombres = w.files.filter((f: any) => f.mimeType === 'application/vnd.google-apps.folder').map((f: any) => f.name).sort();
  assert.deepStrictEqual(nombres, ['L-260330-ABCDEF_99100001', 'L-260825-GHJKMN_SD', 'Legajos']);
  const acc = w.files.filter((f: any) => f.mimeType === 'application/vnd.google-apps.shortcut');
  assert.strictEqual(acc.length, 1); assert.strictEqual(acc[0].shortcutDetails.targetId, 'ORIG-dc000001');
  assert.deepStrictEqual(w.files.find((f: any) => f.id === 'ORIG-dc000001').parents, ['APPSHEET']); // el original no se movió
  assert.ok(w.scopes.includes('https://www.googleapis.com/auth/drive'));
});
await t('drive es idempotente: correrlo de nuevo no duplica carpetas ni accesos', async () => {
  _limpiarCache(); const w = mundo(); const tok = 'tok-x';
  const lg1 = await carpetaLegajos(w.fetch, tok, RAIZ), lg2 = await carpetaLegajos(w.fetch, tok, RAIZ);
  assert.strictEqual(lg1, lg2);
  const c1 = await carpetaPaciente(w.fetch, tok, lg1, 'L-260330-ABCDEF', '99100001'), c2 = await carpetaPaciente(w.fetch, tok, lg1, 'L-260330-ABCDEF', '99100001');
  assert.strictEqual(c1.id, c2.id); assert.strictEqual(c2.creada, false);
  await vincularDocumento(w.fetch, tok, c1.id, 'dc000001', 'Consentimiento'); await vincularDocumento(w.fetch, tok, c1.id, 'dc000001', 'Consentimiento');
  assert.strictEqual(w.files.filter((f: any) => f.mimeType === 'application/vnd.google-apps.shortcut').length, 1);
  assert.strictEqual(w.files.filter((f: any) => f.name === 'Legajos').length, 1);
});
await t('drive: dos archivos con el mismo ID se informan, no se elige uno al azar', async () => {
  const w = mundo(); w.files.push({ id: 'ORIG-dup', name: 'dc000001.Archivo_PDF.999.pdf', mimeType: 'application/pdf', parents: ['APPSHEET'] });
  await assert.rejects(vincularDocumento(w.fetch, 'tok', 'CARPETA', 'dc000001', 'x'), /2 archivos/);
});
await t('drive: entradas maliciosas (comillas en el ID, legajo inválido) se rechazan antes de llamar a Google', async () => {
  const w = mundo();
  await assert.rejects(vincularDocumento(w.fetch, 'tok', 'C', "x' or name contains '", 'x'), /inválido/);
  await assert.rejects(carpetaPaciente(w.fetch, 'tok', 'C', 'legajo-malo', null), /inválido/);
  assert.strictEqual(w.log.length, 0);
});
await t('el token se reutiliza mientras está vigente', async () => {
  _limpiarCache(); const w = mundo();
  await manejar(pedir({ accion: 'analizar', comercio: A }), { env: env(), fetch: w.fetch });
  await manejar(pedir({ accion: 'analizar', comercio: A }), { env: env(), fetch: w.fetch });
  assert.strictEqual(w.tokens, 1);
});
console.log('\n' + ok + ' pruebas correctas' + (malas ? ' · ' + malas + ' FALLAS' : ''));
if (malas) process.exit(1);
