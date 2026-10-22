// Sistema VB ONG · Función de servidor «migra-sheets» (Supabase Edge Function, Deno)
// Lee la planilla del sistema anterior con la CUENTA DE SERVICIO, la valida con el MISMO núcleo que usa el navegador
// (_shared/migra-core.js, copia de js/migra-core.js) y la carga con migra_aplicar (una transacción, todo o nada).
// También crea las carpetas /Legajos/{legajo_id}_{DNI} y vincula los documentos del legajo en Google Drive.
//
// POST /functions/v1/migra-sheets   Authorization: Bearer <JWT del usuario>   (Verify JWT: apagado; se valida acá)
//   { accion: 'analizar' | 'aplicar' | 'drive', comercio: uuid, spreadsheetId?: string, reglas?: {...}, raizDrive?: string, limite?: number }
// Secretos: GOOGLE_SA_JSON (JSON de la cuenta de servicio), SUPABASE_URL, SUPABASE_ANON_KEY, ALLOWED_ORIGINS, MIGRA_SHEET_ID (opcional), DRIVE_ROOT_ID (opcional)
// Nunca devuelve el JSON de la cuenta de servicio, tokens ni datos personales completos en los errores.

import * as nucleo from '../_shared/migra-core.js';
import { SCOPES, ErrorGoogle, leerCuentaServicio, tokenCuentaServicio, leerLibro, carpetaLegajos, carpetaPaciente, vincularDocumento, type Fetch } from '../_shared/google.ts';

const MIGRA: any = (nucleo as any).default ?? (globalThis as any).MIGRA;
type Env = (k: string) => string | undefined;
export type Deps = { env: Env; fetch: Fetch; hoy?: string };

function cors(origen: string | null, env: Env): Record<string, string> {
  const ok = (env('ALLOWED_ORIGINS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const h: Record<string, string> = { 'access-control-allow-headers': 'authorization, content-type, apikey', 'access-control-allow-methods': 'POST, OPTIONS', vary: 'origin' };
  if (origen && ok.includes(origen)) h['access-control-allow-origin'] = origen;
  return h;
}
function resp(cuerpo: unknown, status: number, h: Record<string, string>) {
  return new Response(JSON.stringify(cuerpo), { status, headers: { ...h, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

/** PostgREST con el JWT del USUARIO: los permisos y la RLS los aplica la base, no esta función. */
function db(deps: Deps, jwt: string) {
  const url = (deps.env('SUPABASE_URL') || '').replace(/\/$/, ''), key = deps.env('SUPABASE_ANON_KEY') || '';
  const h = { apikey: key, authorization: 'Bearer ' + jwt, 'content-type': 'application/json' };
  return {
    async rpc(fn: string, args: unknown) {
      const r = await deps.fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: h, body: JSON.stringify(args) });
      const t = await r.text(); let j: any = null; try { j = t ? JSON.parse(t) : null; } catch { /* nada */ }
      if (!r.ok) { const e: any = new Error((j && (j.message || j.hint)) || 'Error de la base (' + r.status + ')'); e.status = r.status === 401 || r.status === 403 ? 403 : 422; throw e; }
      return j;
    },
    async select(tabla: string, qs: string) {
      const r = await deps.fetch(`${url}/rest/v1/${tabla}?${qs}`, { headers: h });
      if (!r.ok) { const e: any = new Error('No pude leer ' + tabla + ' (' + r.status + ')'); e.status = 502; throw e; }
      return r.json();
    },
    async usuario() {
      const r = await deps.fetch(`${url}/auth/v1/user`, { headers: h });
      return r.ok ? r.json() : null;
    },
  };
}

async function existente(base: ReturnType<typeof db>, comercio: string) {
  const c = encodeURIComponent(comercio);
  const legs: any[] = await base.select('legajos', `select=clave,legajo_id,legajo_anterior,pii->>doc&comercio_id=eq.${c}&limit=50000`);
  const ids: any[] = await base.select('migra_ids', `select=id_anterior&comercio_id=eq.${c}&limit=200000`);
  const out = { docs: {} as Record<string, string>, legAnt: {} as Record<string, string>, legs: {} as Record<string, number>, migIds: {} as Record<string, number>, emails: {} };
  legs.forEach((l) => { if (l.doc) out.docs[l.doc] = l.clave; if (l.legajo_anterior) out.legAnt[l.legajo_anterior] = l.clave; out.legs[l.legajo_id] = 1; });
  ids.forEach((i) => { out.migIds[i.id_anterior] = 1; });
  return out;
}
/** El informe que vuelve al navegador: sin la lista de datos personales del plan. */
function informe(p: any) {
  return { ok: p.ok, resumen: p.resumen, reglas: p.reglas, errores: p.errores.slice(0, 2000), revision: p.revision.slice(0, 2000), avisos: p.avisos.slice(0, 2000), controlStock: p.controlStock || [] };
}

export async function manejar(req: Request, deps: Deps): Promise<Response> {
  const h = cors(req.headers.get('origin'), deps.env);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return resp({ ok: false, error: 'Método no permitido.' }, 405, h);
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return resp({ ok: false, error: 'Falta la sesión.' }, 401, h);
  const base = db(deps, jwt);
  const u = await base.usuario();
  if (!u || !u.id) return resp({ ok: false, error: 'Sesión inválida o vencida.' }, 401, h);
  let b: any;
  try { const t = await req.text(); if (t.length > 64 * 1024) return resp({ ok: false, error: 'Pedido demasiado grande.' }, 413, h); b = JSON.parse(t || '{}'); } catch { return resp({ ok: false, error: 'JSON inválido.' }, 400, h); }
  if (!/^[0-9a-f-]{36}$/i.test(b.comercio || '')) return resp({ ok: false, error: 'Comercio inválido.' }, 400, h);
  try {
    const rol = await base.rpc('migra_rol', { p_comercio: b.comercio });
    if (rol !== 'admin' && !(b.accion === 'drive' && rol === 'supervisor')) return resp({ ok: false, error: 'Sólo un administrador puede migrar.' }, 403, h);
    const sa = leerCuentaServicio(deps.env('GOOGLE_SA_JSON'));

    if (b.accion === 'analizar' || b.accion === 'aplicar') {
      const sheet = b.spreadsheetId || deps.env('MIGRA_SHEET_ID') || '';
      const tok = await tokenCuentaServicio(sa, [SCOPES.sheets], deps.fetch);
      const libro = await leerLibro(deps.fetch, tok, sheet);
      const reglas: Record<string, boolean> = {};
      Object.keys(MIGRA.REGLAS).forEach((k) => { reglas[k] = !!(b.reglas && b.reglas[k] === true); });
      const plan = MIGRA.analizar(libro, { hoy: deps.hoy || new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), reglas, existente: await existente(base, b.comercio), rnd: (n: number) => crypto.getRandomValues(new Uint32Array(n)) });
      if (b.accion === 'analizar' || !plan.ok) return resp({ ok: true, aplicado: false, informe: informe(plan) }, 200, h);
      const r = await base.rpc('migra_aplicar', { p_comercio: b.comercio, p_plan: plan, p_archivo: 'Google Sheets ' + sheet.slice(0, 8) + '…' });
      return resp({ ok: true, aplicado: true, resultado: r, informe: informe(plan) }, 200, h);
    }

    if (b.accion === 'drive') {
      const raiz = b.raizDrive || deps.env('DRIVE_ROOT_ID') || '';
      const lim = Math.max(1, Math.min(100, Number(b.limite) || 25));
      const tok = await tokenCuentaServicio(sa, [SCOPES.drive], deps.fetch);
      const legajos = await carpetaLegajos(deps.fetch, tok, raiz);
      const c = encodeURIComponent(b.comercio);
      const sinCarpeta: any[] = await base.select('legajos', `select=legajo_id,pii->>doc&comercio_id=eq.${c}&drive_folder_id=is.null&deleted_at=is.null&order=created_at&limit=${lim}`);
      const out = { carpetas: 0, reutilizadas: 0, vinculados: 0, noEncontrados: 0, errores: [] as { ref: string; error: string }[] };
      for (const l of sinCarpeta) {
        try {
          const cp = await carpetaPaciente(deps.fetch, tok, legajos, l.legajo_id, l.doc);
          await base.rpc('migra_vincular_carpeta', { p_comercio: b.comercio, p_legajo_id: l.legajo_id, p_folder_id: cp.id });
          cp.creada ? out.carpetas++ : out.reutilizadas++;
        } catch (e: any) { out.errores.push({ ref: l.legajo_id, error: e.message }); }
      }
      const docs: any[] = await base.select('legajo_documentos', `select=id,id_anterior,nombre,legajos!inner(drive_folder_id)&comercio_id=eq.${c}&estado=eq.por%20vincular&legajos.drive_folder_id=not.is.null&limit=${lim}`);
      for (const d of docs) {
        try {
          const v = await vincularDocumento(deps.fetch, tok, d.legajos.drive_folder_id, d.id_anterior, d.nombre);
          await base.rpc('migra_vincular_documento', { p_comercio: b.comercio, p_doc: d.id, p_file_id: v.fileId || null, p_url: v.url || null, p_md5: v.md5 || null, p_version: v.version || null, p_estado: v.estado });
          v.estado === 'vinculado' ? out.vinculados++ : out.noEncontrados++;
        } catch (e: any) { out.errores.push({ ref: d.id_anterior, error: e.message }); }
      }
      return resp({ ok: true, drive: out, quedan: sinCarpeta.length === lim || docs.length === lim }, 200, h);
    }
    return resp({ ok: false, error: 'Acción desconocida.' }, 400, h);
  } catch (e: any) {
    if (e instanceof ErrorGoogle) return resp({ ok: false, error: e.message, etapa: e.etapa }, e.etapa === 'config' ? 503 : 502, h);
    return resp({ ok: false, error: e.message || 'Error inesperado.' }, e.status || 500, h);
  }
}

const D: any = (globalThis as any).Deno;
if (D && D.serve) D.serve((req: Request) => manejar(req, { env: (k) => D.env.get(k), fetch: fetch as unknown as Fetch }));
