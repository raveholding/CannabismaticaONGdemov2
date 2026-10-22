// Pruebas de la función drive-legajos (node t/drive.test.ts). Google y la base SIMULADOS; datos ficticios.
import assert from 'node:assert';
import { manejar } from '../supabase/functions/drive-legajos/index.ts';
import { _limpiarCache } from '../supabase/functions/_shared/google.ts';
let ok = 0, malas = 0;
async function t(n: string, fn: () => Promise<void>) { try { await fn(); ok++; console.log('ok  ' + n); } catch (e: any) { malas++; console.error('FALLA ' + n + '\n   ' + (e && e.stack || e)); } }

const par = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const pk = Buffer.from(await crypto.subtle.exportKey('pkcs8', par.privateKey)).toString('base64');
const SA = JSON.stringify({ type: 'service_account', client_email: 'drive-prueba@demo.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\n' + pk + '\n-----END PRIVATE KEY-----\n' });
const A = 'aaaaaaaa-0000-0000-0000-00000000000a', LEG = 'L-260330-ABCDEF', RAIZ = 'RAIZ00000000ficticia';
const env = (x: Record<string, any> = {}) => (k: string) => ({ GOOGLE_SA_JSON_AAAAAAAA00000000000000000000000A: SA, SUPABASE_URL: 'https://db.ejemplo', SUPABASE_ANON_KEY: 'anon', ALLOWED_ORIGINS: 'https://raveholding.github.io', ...x } as any)[k];
const J = (o: any, st = 200) => ({ ok: st < 400, status: st, json: async () => o, text: async () => JSON.stringify(o) });

function mundo(o: { rol?: string | null; sinRaiz?: boolean } = {}) {
  const w: any = { files: [] as any[], n: 0, subidas: 0 };
  w.fetch = async (url: string, init: any = {}) => {
    const u = new URL(url), H = init.headers || {};
    if (u.host === 'oauth2.googleapis.com') return J({ access_token: 'tok', expires_in: 3600 });
    if (u.host === 'db.ejemplo') {
      if (u.pathname === '/auth/v1/user') return H.authorization === 'Bearer jwt' ? J({ id: 'u' }) : J({}, 401);
      if (u.pathname.endsWith('/migra_rol')) return J(o.rol === undefined ? 'mostrador' : o.rol);
      if (u.pathname.endsWith('/migra_config')) return J(o.sinRaiz ? [] : [{ drive_root_id: RAIZ }]);
    }
    if (u.host === 'www.googleapis.com') {
      if ((init.method || 'GET') === 'POST') {
        let meta: any;
        if (u.pathname.startsWith('/upload/')) { const txt = new TextDecoder().decode(init.body); meta = JSON.parse(txt.slice(txt.indexOf('{'), txt.indexOf('}\r\n') + 1)); w.subidas++; meta.size = init.body.length; }
        else meta = JSON.parse(init.body);
        const id = 'FILE' + String(++w.n).padStart(10, '0'); const f = { id, ...meta, webViewLink: 'https://drive.google.com/file/d/' + id + '/view' }; w.files.push(f); return J(f);
      }
      const q = u.searchParams.get('q') || '';
      return J({ files: w.files.filter((f: any) => {
        let m; if ((m = /'([^']+)' in parents/.exec(q)) && !(f.parents || []).includes(m[1])) return false;
        if ((m = /appProperties has \{ key='([^']+)' and value='([^']+)' \}/.exec(q)) && (f.appProperties || {})[m[1]] !== m[2]) return false;
        if ((m = /mimeType = '([^']+)'/.exec(q)) && f.mimeType !== m[1]) return false;
        return true; }) });
    }
    throw new Error('red no simulada ' + url);
  };
  return w;
}
const pdf = new TextEncoder().encode('%PDF-1.4 documento ficticio de prueba');
const b64 = Buffer.from(pdf).toString('base64');
const hash = Buffer.from(await crypto.subtle.digest('SHA-256', pdf)).toString('hex');
const pedir = (b: any, jwt = 'jwt') => new Request('https://fn/drive-legajos', { method: 'POST', headers: { authorization: 'Bearer ' + jwt, origin: 'https://raveholding.github.io' }, body: JSON.stringify(b) });
const subir = (extra: any = {}) => ({ accion: 'subir', comercio: A, legajo: LEG, dni: '99100001', nombre: LEG + '_REPROCANN_20261022_v1_' + hash.slice(0, 8) + '.pdf', mime: 'application/pdf', tipo: 'REPROCANN', version: 1, hash, b64, ...extra });

await t('carpeta: crea Legajos/ y {legajo}_{DNI} una sola vez, desde cualquier equipo', async () => {
  _limpiarCache(); const w = mundo();
  const r1 = await (await manejar(pedir({ accion: 'carpeta', comercio: A, legajo: LEG, dni: '99100001' }), { env: env(), fetch: w.fetch })).json();
  const r2 = await (await manejar(pedir({ accion: 'carpeta', comercio: A, legajo: LEG, dni: '99100001' }), { env: env(), fetch: w.fetch })).json();
  assert.ok(r1.ok && r1.creada && !r2.creada && r1.carpeta === r2.carpeta);
  assert.deepStrictEqual(w.files.map((f: any) => f.name).sort(), ['L-260330-ABCDEF_99100001', 'Legajos']);
});
await t('subir: el archivo va a la carpeta del legajo con huella, tipo y versión', async () => {
  _limpiarCache(); const w = mundo();
  const r = await (await manejar(pedir(subir()), { env: env(), fetch: w.fetch })).json();
  assert.ok(r.ok && r.archivo.id && !r.repetido && r.hash === hash, JSON.stringify(r));
  const f = w.files.find((x: any) => x.id === r.archivo.id), cp = w.files.find((x: any) => x.name === 'L-260330-ABCDEF_99100001');
  assert.deepStrictEqual(f.parents, [cp.id]); assert.strictEqual(f.appProperties.vbongHash, hash); assert.strictEqual(f.appProperties.vbongTipo, 'REPROCANN');
});
await t('subir dos veces el mismo archivo no lo duplica', async () => {
  _limpiarCache(); const w = mundo();
  await manejar(pedir(subir()), { env: env(), fetch: w.fetch });
  const r = await (await manejar(pedir(subir()), { env: env(), fetch: w.fetch })).json();
  assert.ok(r.repetido); assert.strictEqual(w.subidas, 1);
});
await t('la huella se recalcula en el servidor: un archivo alterado en el camino se rechaza', async () => {
  _limpiarCache(); const w = mundo();
  const r = await manejar(pedir(subir({ hash: 'f'.repeat(64) })), { env: env(), fetch: w.fetch });
  assert.strictEqual(r.status, 422); assert.strictEqual(w.subidas, 0);
});
await t('sólo PDF o fotos; nombre con el legajo; legajo con formato válido', async () => {
  _limpiarCache(); const w = mundo();
  assert.strictEqual((await manejar(pedir(subir({ mime: 'text/html' })), { env: env(), fetch: w.fetch })).status, 422);
  assert.strictEqual((await manejar(pedir(subir({ nombre: 'otro.pdf' })), { env: env(), fetch: w.fetch })).status, 422);
  assert.strictEqual((await manejar(pedir(subir({ legajo: "x' or '1" })), { env: env(), fetch: w.fetch })).status, 400);
});
await t('sin sesión 401 · sin ser miembro 403 · sin carpeta raíz o sin cuenta de servicio del comercio 503', async () => {
  _limpiarCache();
  assert.strictEqual((await manejar(pedir(subir(), 'malo'), { env: env(), fetch: mundo().fetch })).status, 401);
  assert.strictEqual((await manejar(pedir(subir()), { env: env(), fetch: mundo({ rol: null }).fetch })).status, 403);
  assert.strictEqual((await manejar(pedir(subir()), { env: env(), fetch: mundo({ sinRaiz: true }).fetch })).status, 503);
  const r = await manejar(pedir(subir()), { env: env({ GOOGLE_SA_JSON_AAAAAAAA00000000000000000000000A: undefined }), fetch: mundo().fetch });
  assert.strictEqual(r.status, 503); assert.ok(!JSON.stringify(await r.json()).includes('PRIVATE'));
});
await t('archivo de más de 10 MB → 413', async () => {
  const big = Buffer.alloc(10 * 1024 * 1024 + 10).toString('base64');
  assert.strictEqual((await manejar(pedir(subir({ b64: big })), { env: env(), fetch: mundo().fetch })).status, 413);
});
console.log('\n' + ok + ' pruebas correctas' + (malas ? ' · ' + malas + ' FALLAS' : '')); if (malas) process.exit(1);
