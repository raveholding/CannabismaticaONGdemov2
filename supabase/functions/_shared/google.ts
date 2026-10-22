// Sistema VB ONG · Google con CUENTA DE SERVICIO (sólo servidor) · SISTEMA_VB_ONGF 4.28.4 / 4.28.5
// - El JSON de la cuenta de servicio vive en los secretos de la función (GOOGLE_SA_JSON). Nunca llega al navegador,
//   al repositorio, a los logs ni a las respuestas.
// - Sin dependencias: firma RS256 con WebCrypto (Deno y Node 22 la traen).
// - Todas las funciones reciben `fetch` inyectable para poder probarlas sin red.
// Requisito a cargo de la ONG: compartir la planilla (lector) y la carpeta raíz del Drive (editor) con el correo de la cuenta de servicio.

export type Fetch = (url: string, init?: Record<string, unknown>) => Promise<{ ok: boolean; status: number; json: () => Promise<any>; text: () => Promise<string> }>;
export type CuentaServicio = { client_email: string; private_key: string; token_uri?: string };

export const SCOPES = {
  sheets: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  drive: 'https://www.googleapis.com/auth/drive',
};
const DRIVE = 'https://www.googleapis.com/drive/v3';
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
export const MIME_CARPETA = 'application/vnd.google-apps.folder';
export const MIME_ACCESO = 'application/vnd.google-apps.shortcut';

export class ErrorGoogle extends Error {
  status: number; etapa: string;
  constructor(etapa: string, status: number, msg: string) { super(msg); this.status = status; this.etapa = etapa; }
}

function b64url(b: Uint8Array | string): string {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : b;
  let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function pemABytes(pem: string): Uint8Array {
  const b = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const bin = atob(b), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Valida el JSON de la cuenta de servicio sin devolver nunca su contenido. */
export function leerCuentaServicio(json: string | undefined): CuentaServicio {
  if (!json) throw new ErrorGoogle('config', 0, 'Pendiente de configuración: falta el secreto GOOGLE_SA_JSON.');
  let o: any;
  try { o = JSON.parse(json); } catch { throw new ErrorGoogle('config', 0, 'El secreto GOOGLE_SA_JSON no es un JSON válido.'); }
  if (o.type !== 'service_account' || !/^[^@\s]+@[^@\s]+\.iam\.gserviceaccount\.com$/.test(o.client_email || '') || !/BEGIN PRIVATE KEY/.test(o.private_key || '')) {
    throw new ErrorGoogle('config', 0, 'GOOGLE_SA_JSON no parece una cuenta de servicio de Google.');
  }
  return { client_email: o.client_email, private_key: o.private_key, token_uri: o.token_uri };
}

const cache = new Map<string, { token: string; vence: number }>();
/** Token de acceso OAuth 2.0 (JWT bearer, RFC 7523). Se reutiliza hasta 5 min antes de vencer. */
export async function tokenCuentaServicio(sa: CuentaServicio, scopes: string[], f: Fetch, ahoraSeg: number = Math.floor(Date.now() / 1000)): Promise<string> {
  const k = sa.client_email + '|' + scopes.join(' ');
  const c = cache.get(k); if (c && c.vence - 300 > ahoraSeg) return c.token;
  const aud = 'https://oauth2.googleapis.com/token';
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: scopes.join(' '), aud, iat: ahoraSeg - 30, exp: ahoraSeg + 3300 }));
  const key = await crypto.subtle.importKey('pkcs8', pemABytes(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const firma = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + claim)));
  const jwt = head + '.' + claim + '.' + b64url(firma);
  const r = await f(aud, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt });
  if (!r.ok) throw new ErrorGoogle('token', r.status, 'Google rechazó la cuenta de servicio (' + r.status + '). Revisá que la clave no esté revocada.');
  const j = await r.json();
  if (!j.access_token) throw new ErrorGoogle('token', r.status, 'Google no devolvió un token.');
  cache.set(k, { token: j.access_token, vence: ahoraSeg + (j.expires_in || 3600) });
  return j.access_token;
}
export function _limpiarCache() { cache.clear(); }

async function g(f: Fetch, token: string, url: string, init: Record<string, any> = {}, etapa = 'google'): Promise<any> {
  const r = await f(url, { ...init, headers: { authorization: 'Bearer ' + token, ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers || {}) } });
  if (!r.ok) {
    const st = r.status;
    const msg = st === 404 ? 'No encontrado o sin permiso: compartí la carpeta / planilla con el correo de la cuenta de servicio.'
      : st === 403 ? 'Google negó el acceso (permisos o cuota).' : st === 429 ? 'Google limitó la cantidad de pedidos: reintentá en unos minutos.' : 'Error de Google (' + st + ').';
    throw new ErrorGoogle(etapa, st, msg);
  }
  return r.status === 204 ? null : r.json();
}

/* ================= SHEETS: libro completo ================= */
/** Lee todas las pestañas como texto formateado (igual a como se ve en la planilla y a como exporta el .xlsx). */
export async function leerLibro(f: Fetch, token: string, spreadsheetId: string): Promise<Record<string, string[][]>> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(spreadsheetId)) throw new ErrorGoogle('config', 0, 'Identificador de planilla inválido.');
  const meta = await g(f, token, `${SHEETS}/${spreadsheetId}?fields=sheets.properties.title`, {}, 'sheets');
  const titulos: string[] = (meta.sheets || []).map((s: any) => s.properties.title).slice(0, 60);
  if (!titulos.length) return {};
  const qs = titulos.map((t) => 'ranges=' + encodeURIComponent("'" + t.replace(/'/g, "''") + "'")).join('&');
  const v = await g(f, token, `${SHEETS}/${spreadsheetId}/values:batchGet?${qs}&valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS`, {}, 'sheets');
  const libro: Record<string, string[][]> = {};
  (v.valueRanges || []).forEach((vr: any, i: number) => { libro[titulos[i]] = (vr.values || []).map((row: any[]) => row.map((c) => (c == null ? '' : String(c)))); });
  return libro;
}

/* ================= DRIVE ================= */
function q(s: string): string { return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"; }
const LISTA = '&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=10&fields=files(id,name,mimeType,webViewLink,md5Checksum,version,parents,appProperties,shortcutDetails)';

async function buscar(f: Fetch, token: string, consulta: string): Promise<any[]> {
  const r = await g(f, token, `${DRIVE}/files?q=${encodeURIComponent(consulta)}${LISTA}`, {}, 'drive');
  return r.files || [];
}
async function crear(f: Fetch, token: string, cuerpo: Record<string, unknown>): Promise<any> {
  return g(f, token, `${DRIVE}/files?supportsAllDrives=true&fields=id,name,webViewLink,appProperties`, { method: 'POST', body: JSON.stringify(cuerpo) }, 'drive');
}

/** Carpeta «Legajos» dentro de la raíz configurada. Idempotente: la reconoce por su propiedad, no por el nombre. */
export async function carpetaLegajos(f: Fetch, token: string, raizId: string): Promise<string> {
  if (!/^[A-Za-z0-9_-]{10,100}$/.test(raizId)) throw new ErrorGoogle('config', 0, 'Identificador de carpeta raíz inválido.');
  const ya = await buscar(f, token, `${q(raizId)} in parents and mimeType = ${q(MIME_CARPETA)} and appProperties has { key='vbong' and value='legajos' } and trashed = false`);
  if (ya.length) return ya[0].id;
  const c = await crear(f, token, { name: 'Legajos', mimeType: MIME_CARPETA, parents: [raizId], appProperties: { vbong: 'legajos' } });
  return c.id;
}

/** Carpeta del paciente /Legajos/{legajo_id}_{DNI} (o _SD). Idempotente por propiedad vbongLegajo = legajo_id. */
export async function carpetaPaciente(f: Fetch, token: string, legajosId: string, legajoId: string, dni: string | null): Promise<{ id: string; creada: boolean; url: string }> {
  if (!/^L-\d{6}-[2-9A-HJKMNP-Z]{6}$/.test(legajoId)) throw new ErrorGoogle('datos', 0, 'Legajo inválido.');
  const d = (dni || '').replace(/\D/g, '');
  const ya = await buscar(f, token, `${q(legajosId)} in parents and mimeType = ${q(MIME_CARPETA)} and appProperties has { key='vbongLegajo' and value=${q(legajoId)} } and trashed = false`);
  if (ya.length > 1) throw new ErrorGoogle('drive', 409, 'Hay más de una carpeta para el legajo ' + legajoId + ': revisalo a mano.');
  if (ya.length) return { id: ya[0].id, creada: false, url: ya[0].webViewLink || '' };
  const c = await crear(f, token, { name: legajoId + '_' + (d.length >= 6 && d.length <= 11 ? d : 'SD'), mimeType: MIME_CARPETA, parents: [legajosId], appProperties: { vbongLegajo: legajoId } });
  return { id: c.id, creada: true, url: c.webViewLink || '' };
}

/** Busca el archivo del sistema anterior por su ID (AppSheet lo nombra «<ID>.Archivo_PDF.<hora>.<ext>»). */
export async function archivoAnterior(f: Fetch, token: string, idAnterior: string): Promise<any | null> {
  if (!/^[A-Za-z0-9]{4,40}$/.test(idAnterior)) throw new ErrorGoogle('datos', 0, 'ID de documento inválido.');
  const fs = (await buscar(f, token, `name contains ${q(idAnterior + '.')} and mimeType != ${q(MIME_CARPETA)} and mimeType != ${q(MIME_ACCESO)} and trashed = false`))
    .filter((x) => String(x.name).indexOf(idAnterior + '.') === 0);
  if (fs.length > 1) throw new ErrorGoogle('drive', 409, 'Hay ' + fs.length + ' archivos con el ID ' + idAnterior + ': revisalo a mano.');
  return fs[0] || null;
}

/** Vincula el archivo original al legajo SIN moverlo ni copiarlo (no rompe AppSheet): crea un acceso directo en la carpeta del paciente.
 *  Idempotente: un acceso por documento (propiedad vbongDoc). Devuelve los metadatos que se guardan en legajo_documentos. */
export async function vincularDocumento(f: Fetch, token: string, carpetaId: string, idAnterior: string, nombre: string): Promise<{ estado: 'vinculado' | 'no encontrado'; fileId?: string; url?: string; md5?: string | null; version?: number | null }> {
  const orig = await archivoAnterior(f, token, idAnterior);
  if (!orig) return { estado: 'no encontrado' };
  const ya = await buscar(f, token, `${q(carpetaId)} in parents and mimeType = ${q(MIME_ACCESO)} and appProperties has { key='vbongDoc' and value=${q(idAnterior)} } and trashed = false`);
  if (!ya.length) {
    const limpio = String(nombre || idAnterior).replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').trim().slice(0, 100) || idAnterior;
    await crear(f, token, { name: limpio, mimeType: MIME_ACCESO, parents: [carpetaId], shortcutDetails: { targetId: orig.id }, appProperties: { vbongDoc: idAnterior } });
  }
  return { estado: 'vinculado', fileId: orig.id, url: orig.webViewLink || `https://drive.google.com/file/d/${orig.id}/view`, md5: orig.md5Checksum || null, version: orig.version ? Number(orig.version) : null };
}
