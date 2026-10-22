// Sistema VB ONG · Función de servidor «drive-legajos» (Supabase Edge Function, Deno) · SISTEMA_VB_ONGF 4.28.4
// Drive SIN conexión manual: usa la cuenta de servicio de la ONG (secreto por comercio). Desde cualquier equipo, nadie conecta nada.
//
// POST /functions/v1/drive-legajos   Authorization: Bearer <JWT del usuario>   (Verify JWT: apagado; se valida acá)
//   { accion: 'carpeta', comercio, legajo, dni? }                         → crea o reutiliza /Legajos/{legajo}_{DNI}
//   { accion: 'subir', comercio, legajo, dni?, nombre, mime, tipo, version, hash, b64 } → sube el archivo a la carpeta del legajo
// La carpeta raíz sale de migra_config (por comercio). La huella SHA-256 se RECALCULA en el servidor (no se confía en la del navegador).
// Secretos: GOOGLE_SA_JSON_<comercio hex, mayúsculas, sin guiones>, SUPABASE_URL, SUPABASE_ANON_KEY, ALLOWED_ORIGINS.
// [VERIFICAR] tamaño máximo de pedido del proveedor de funciones (acá se acepta hasta 10 MB de archivo).

import { SCOPES, ErrorGoogle, leerCuentaServicio, tokenCuentaServicio, carpetaLegajos, carpetaPaciente, subirArchivo, type Fetch } from '../_shared/google.ts';

type Env = (k: string) => string | undefined;
export type Deps = { env: Env; fetch: Fetch };
const MAX = 10 * 1024 * 1024;
const MIMES: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif' };
const ROLES = ['admin', 'supervisor', 'mostrador', 'operador'];

function cors(origen: string | null, env: Env): Record<string, string> {
  const ok = (env('ALLOWED_ORIGINS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const h: Record<string, string> = { 'access-control-allow-headers': 'authorization, content-type, apikey', 'access-control-allow-methods': 'POST, OPTIONS', vary: 'origin' };
  if (origen && ok.includes(origen)) h['access-control-allow-origin'] = origen;
  return h;
}
const resp = (c: unknown, s: number, h: Record<string, string>) => new Response(JSON.stringify(c), { status: s, headers: { ...h, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
function hex(b: ArrayBuffer) { return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join(''); }
function deB64(s: string): Uint8Array { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }

export async function manejar(req: Request, deps: Deps): Promise<Response> {
  const h = cors(req.headers.get('origin'), deps.env);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return resp({ ok: false, error: 'Método no permitido.' }, 405, h);
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return resp({ ok: false, error: 'Falta la sesión.' }, 401, h);
  const url = (deps.env('SUPABASE_URL') || '').replace(/\/$/, ''), H = { apikey: deps.env('SUPABASE_ANON_KEY') || '', authorization: 'Bearer ' + jwt, 'content-type': 'application/json' };
  const u = await deps.fetch(`${url}/auth/v1/user`, { headers: H });
  if (!u.ok) return resp({ ok: false, error: 'Sesión inválida o vencida.' }, 401, h);
  let b: any;
  try { const t = await req.text(); if (t.length > Math.ceil(MAX * 4 / 3) + 8192) return resp({ ok: false, error: 'El archivo supera los 10 MB.' }, 413, h); b = JSON.parse(t || '{}'); } catch { return resp({ ok: false, error: 'JSON inválido.' }, 400, h); }
  if (!/^[0-9a-f-]{36}$/i.test(b.comercio || '')) return resp({ ok: false, error: 'Comercio inválido.' }, 400, h);
  if (!/^L-\d{6}-[2-9A-HJKMNP-Z]{6}$/.test(b.legajo || '')) return resp({ ok: false, error: 'Legajo inválido.' }, 400, h);
  try {
    const rr = await deps.fetch(`${url}/rest/v1/rpc/migra_rol`, { method: 'POST', headers: H, body: JSON.stringify({ p_comercio: b.comercio }) });
    const rol = rr.ok ? await rr.json() : null;
    if (!ROLES.includes(rol)) return resp({ ok: false, error: 'Sin permiso en este comercio.' }, 403, h);
    const cr = await deps.fetch(`${url}/rest/v1/migra_config?select=drive_root_id&comercio_id=eq.${encodeURIComponent(b.comercio)}`, { headers: H });
    const cfg = cr.ok ? (await cr.json())[0] : null;
    if (!cfg || !cfg.drive_root_id) return resp({ ok: false, error: 'Pendiente de configuración: falta la carpeta raíz de Drive de este comercio.', etapa: 'config' }, 503, h);
    const sa = leerCuentaServicio(deps.env('GOOGLE_SA_JSON_' + String(b.comercio).replace(/-/g, '').toUpperCase()));
    const tok = await tokenCuentaServicio(sa, [SCOPES.drive], deps.fetch);
    const raiz = await carpetaLegajos(deps.fetch, tok, cfg.drive_root_id);
    const cp = await carpetaPaciente(deps.fetch, tok, raiz, b.legajo, String(b.dni || ''));
    if (b.accion === 'carpeta') return resp({ ok: true, carpeta: cp.id, url: cp.url, creada: cp.creada }, 200, h);
    if (b.accion !== 'subir') return resp({ ok: false, error: 'Acción desconocida.' }, 400, h);

    const mime = String(b.mime || '');
    if (!MIMES[mime]) return resp({ ok: false, error: 'Sólo PDF o fotos.' }, 422, h);
    let bytes: Uint8Array;
    try { bytes = deB64(String(b.b64 || '')); } catch { return resp({ ok: false, error: 'Archivo ilegible.' }, 422, h); }
    if (!bytes.length || bytes.length > MAX) return resp({ ok: false, error: 'El archivo está vacío o supera los 10 MB.' }, 413, h);
    const hash = hex(await crypto.subtle.digest('SHA-256', bytes));
    if (b.hash && b.hash !== hash) return resp({ ok: false, error: 'El archivo llegó distinto de como salió del equipo: no se guardó.' }, 422, h);
    const nombre = String(b.nombre || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').trim().slice(0, 120);
    if (!nombre.startsWith(b.legajo + '_')) return resp({ ok: false, error: 'Nombre de archivo inválido.' }, 422, h);
    const props = { vbongHash: hash, vbongLegajo: b.legajo, vbongTipo: String(b.tipo || '').slice(0, 40), vbongVersion: String(Number(b.version) || 1) };
    const f = await subirArchivo(deps.fetch, tok, cp.id, nombre, mime, bytes, props);
    return resp({ ok: true, carpeta: cp.id, archivo: { id: f.id, webViewLink: f.webViewLink, md5Checksum: f.md5Checksum || null }, repetido: !!f.repetido, hash }, 200, h);
  } catch (e: any) {
    if (e instanceof ErrorGoogle) return resp({ ok: false, error: e.message, etapa: e.etapa }, e.etapa === 'config' ? 503 : 502, h);
    return resp({ ok: false, error: 'Error inesperado.' }, 500, h);
  }
}

const D: any = (globalThis as any).Deno;
if (D && D.serve) D.serve((req: Request) => manejar(req, { env: (k) => D.env.get(k), fetch: fetch as unknown as Fetch }));
