-- =====================================================================================
-- 12 · MIGRACIÓN DEL SISTEMA ANTERIOR (planilla «CANNABISMATICA» de AppSheet / Google Sheets)
-- Sistema VB ONG · SISTEMA_VB_ONGF 4.28 · 2026-10-22
--
-- Qué hace (aditivo e idempotente: se puede correr dos veces sin efecto):
--   · Tablas relacionales para legajos, documentos del legajo, seguimientos, respuestas de formularios,
--     genéticas, ciclos de cultivo, movimientos de stock, dispensaciones + detalle, donaciones,
--     arqueos históricos, documentación institucional, recursos y el registro de lotes migrados.
--   · Todas con comercio_id (la clave de tenant del sistema), RLS de lectura para miembros,
--     sin escritura directa (sólo por funciones SECURITY DEFINER con search_path fijo).
--   · Libros SÓLO-AGREGAR (movimientos, dispensaciones, detalle, donaciones, seguimientos, respuestas,
--     arqueos, lotes): BEFORE UPDATE OR DELETE lo impide. Se corrige con movimientos compensatorios.
--   · migra_aplicar(comercio, plan, archivo, usuario): carga el PLAN que produce js/migra-core.js en UNA transacción.
--     Si una sola fila falla, no queda nada. Reenviar el mismo plan no duplica (migra_ids).
--     SÓLO la puede llamar la función de servidor migra-sheets (rol service_role), que arma el plan ella misma
--     leyendo Google: un usuario no puede mandar un plan escrito a mano por la API.
--   · migra_config: planilla, carpeta raíz de Drive y carpetas de AppSheet POR COMERCIO (nunca las elige el pedido).
--
-- Requisitos previos (se verifican al inicio; si faltan, el script se detiene sin tocar nada):
--   · tabla comercios(id uuid)  · tabla miembros(comercio_id uuid, user_id uuid, rol text)
--   · función auth.uid() (Supabase)
--   [VERIFICAR] los nombres reales de esas columnas en la base del cliente: si difieren, se ajusta
--   SÓLO la función migra_rol() de abajo (un único punto de adaptación).
--
-- Reversión: ver docs/MIGRACION.md («Cómo deshacer»). Antes de producción: respaldo y prueba en una copia.
-- =====================================================================================

do $$
begin
  if to_regclass('public.comercios') is null then raise exception 'Falta la tabla comercios: corré antes los scripts base.'; end if;
  if to_regclass('public.miembros') is null then raise exception 'Falta la tabla miembros: corré antes los scripts base.'; end if;
  if to_regprocedure('auth.uid()') is null then raise exception 'Falta auth.uid(): este script es para Supabase.'; end if;
end $$;

create extension if not exists pgcrypto;  -- en Supabase vive en el esquema «extensions»: las funciones lo incluyen en su search_path

-- ---------- adaptador de rol (único punto a ajustar si la base real usa otros nombres) ----------
create or replace function public.migra_rol(p_comercio uuid) returns text
language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select m.rol from public.miembros m where m.comercio_id = p_comercio and m.user_id = auth.uid() limit 1
$$;
revoke all on function public.migra_rol(uuid) from public;
grant execute on function public.migra_rol(uuid) to authenticated;

-- ---------- sólo-agregar (no reemplaza una versión existente del sistema) ----------
do $$
begin
  if to_regprocedure('public.rave_solo_agregar()') is null then
    execute $f$
      create function public.rave_solo_agregar() returns trigger language plpgsql as $b$
      begin
        raise exception 'Registro de sólo-agregar: % no se puede % (corregí con un movimiento compensatorio)', tg_table_name, lower(tg_op)
          using errcode = 'P0001';
      end $b$;
    $f$;
  end if;
end $$;

-- ---------- legajo inmutable ----------
create or replace function public.migra_legajo_inmutable() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'Un legajo no se borra: se da de baja (deleted_at).' using errcode = 'P0001'; end if;
  if new.legajo_id is distinct from old.legajo_id or new.id is distinct from old.id or new.comercio_id is distinct from old.comercio_id then
    raise exception 'El legajo_id es inmutable.' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end $$;

-- =====================================================================================
-- TABLAS
-- =====================================================================================
create table if not exists public.rubros_financieros (
  comercio_id uuid not null references public.comercios(id),
  id text not null,
  nombre text not null check (length(nombre) between 1 and 80),
  tipo text not null check (tipo in ('ingreso','egreso','ambos')),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id)
);

create table if not exists public.migra_config (
  comercio_id uuid primary key references public.comercios(id),
  sheet_id text check (sheet_id ~ '^[A-Za-z0-9_-]{20,100}$'),
  drive_root_id text check (drive_root_id ~ '^[A-Za-z0-9_-]{10,100}$'),
  appsheet_folders text[] not null default '{}',  -- carpetas Documentos_Files_ / Documentos_Images del sistema anterior
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists public.legajos (
  comercio_id uuid not null references public.comercios(id),
  id uuid not null default gen_random_uuid(),
  legajo_id text not null check (legajo_id ~ '^L-[0-9]{6}-[2-9A-HJKMNP-Z]{6}$'),
  clave text not null,                         -- clave del sistema (DNI o 88xxxxxxxxxxx si no hay documento)
  legajo_anterior text,                        -- ID_Legajo del sistema anterior
  doc_tipo text check (doc_tipo in ('DNI','CUIT','CUIL')),
  doc_hash text,                               -- sha256(comercio_id:doc) para detectar duplicados sin exponer el documento
  pii jsonb not null default '{}'::jsonb,      -- nombre, documento y contacto [ver límite en docs/MIGRACION.md]
  estado_anterior text,
  revisar boolean not null default false,
  notas_migracion text[] not null default '{}',
  fecha_alta date not null,
  drive_folder_id text,
  origen text not null default 'sistema',
  migra_lote text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  primary key (comercio_id, id),
  unique (comercio_id, legajo_id),
  unique (comercio_id, clave)
);
create unique index if not exists legajos_doc_unico on public.legajos (comercio_id, doc_hash) where doc_hash is not null and deleted_at is null;
create unique index if not exists legajos_anterior_unico on public.legajos (comercio_id, legajo_anterior) where legajo_anterior is not null;

create table if not exists public.geneticas (
  comercio_id uuid not null references public.comercios(id),
  id text not null,                            -- L-MIG-… (lote de stock)
  id_anterior text,
  nombre text not null,
  producto text not null check (producto in ('flores','aceite','crema','comestible')),
  unidad text not null check (unidad in ('g','frasco','u','ml','kg')),
  quimiotipo text,
  tipo_anterior text,
  thc_pct numeric(6,2), cbd_pct numeric(6,2),
  indicaciones text,
  stock_minimo numeric(14,2) not null default 0,
  migra_lote text,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id)
);

create table if not exists public.ciclos_cultivo (
  comercio_id uuid not null references public.comercios(id),
  id text not null,
  nombre text not null,
  sala text,
  inicio date not null,
  estado text not null check (estado in ('activo','cerrado')),
  historico boolean not null default false,    -- true = ciclo creado por la migración, no es un ciclo real
  notas text,
  migra_lote text,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id)
);

create table if not exists public.stock_movimientos (
  comercio_id uuid not null references public.comercios(id),
  id uuid not null default gen_random_uuid(),
  genetica_id text not null,
  tipo text not null check (tipo in ('ingreso','ajuste','dispensacion','anulacion')),
  cantidad numeric(14,2) not null check (cantidad <> 0),
  fecha date not null,
  ts timestamptz not null,
  ref text,
  motivo text,
  usuario text,
  migra_lote text,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id),
  foreign key (comercio_id, genetica_id) references public.geneticas(comercio_id, id)
);
create index if not exists stock_mov_gen on public.stock_movimientos (comercio_id, genetica_id);

create table if not exists public.dispensaciones (
  comercio_id uuid not null references public.comercios(id),
  id uuid not null default gen_random_uuid(),
  legajo_uuid uuid not null,
  fecha date not null,
  ts timestamptz not null,
  entrega_anterior text,
  usuario text,
  obs text,
  migra_lote text,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id),
  foreign key (comercio_id, legajo_uuid) references public.legajos(comercio_id, id)
);
create unique index if not exists dispensaciones_entrega_ant on public.dispensaciones (comercio_id, entrega_anterior) where entrega_anterior is not null;

create table if not exists public.dispensacion_detalles (
  comercio_id uuid not null references public.comercios(id),
  id uuid not null default gen_random_uuid(),
  dispensacion_id uuid not null,
  genetica_id text not null,
  ciclo_cultivo_id text not null,              -- obligatorio: trazabilidad de la materia prima
  cantidad numeric(14,2) not null check (cantidad > 0),
  unidad text not null,
  importe_cent bigint not null default 0 check (importe_cent >= 0),
  detalle_anterior text,
  ciclo_historico boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id),
  foreign key (comercio_id, dispensacion_id) references public.dispensaciones(comercio_id, id),
  foreign key (comercio_id, genetica_id) references public.geneticas(comercio_id, id),
  foreign key (comercio_id, ciclo_cultivo_id) references public.ciclos_cultivo(comercio_id, id)
);

create table if not exists public.donaciones (
  comercio_id uuid not null references public.comercios(id),
  id uuid not null default gen_random_uuid(),
  legajo_uuid uuid,
  dispensacion_id uuid,
  fecha date not null,
  ts timestamptz not null,
  importe_cent bigint not null check (importe_cent > 0),
  servicio_cent bigint not null default 0 check (servicio_cent >= 0),
  medio text not null check (medio in ('efectivo','transferencia','mercadopago','tarjeta','qr','otro')),
  rubro_financiero_id text not null,
  concepto text not null default 'Donación voluntaria',
  obs text,
  usuario text,
  id_anterior text,
  migra_lote text,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id),
  foreign key (comercio_id, legajo_uuid) references public.legajos(comercio_id, id),
  foreign key (comercio_id, dispensacion_id) references public.dispensaciones(comercio_id, id),
  foreign key (comercio_id, rubro_financiero_id) references public.rubros_financieros(comercio_id, id)
);

create table if not exists public.legajo_seguimientos (
  comercio_id uuid not null references public.comercios(id),
  id uuid not null default gen_random_uuid(),
  legajo_uuid uuid not null,
  fecha date not null,
  tipo_seguimiento text not null check (tipo_seguimiento in ('alta','seguimiento','dispensacion','consulta','documento','formulario')),
  datos jsonb not null default '{}'::jsonb,
  id_anterior text,
  migra_lote text,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id),
  foreign key (comercio_id, legajo_uuid) references public.legajos(comercio_id, id)
);

create table if not exists public.formularios_respuestas (
  comercio_id uuid not null references public.comercios(id),
  id uuid not null default gen_random_uuid(),
  sheet_row_id text not null,                  -- hoja + fila + marca temporal: idempotencia
  formulario text not null check (formulario in ('F1','F2')),
  legajo_uuid uuid,
  fecha date,
  migra_lote text,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id),
  unique (comercio_id, sheet_row_id),
  foreign key (comercio_id, legajo_uuid) references public.legajos(comercio_id, id)
);

create table if not exists public.legajo_documentos (
  comercio_id uuid not null references public.comercios(id),
  id uuid not null default gen_random_uuid(),
  legajo_uuid uuid not null,
  id_anterior text,
  nombre text not null,
  tipo text,
  extension text,
  ruta_anterior text,                          -- ruta en la carpeta de AppSheet
  fecha date,
  file_id text,                                -- Google Drive
  url text check (url is null or url ~ '^https://'),
  hash_md5 text,
  version bigint,
  estado text not null default 'por vincular' check (estado in ('por vincular','vinculado','no encontrado','error')),
  vinculado_at timestamptz,
  migra_lote text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (comercio_id, id),
  foreign key (comercio_id, legajo_uuid) references public.legajos(comercio_id, id)
);
create unique index if not exists legajo_docs_ant on public.legajo_documentos (comercio_id, id_anterior) where id_anterior is not null;

create table if not exists public.arqueos_historicos (
  comercio_id uuid not null references public.comercios(id),
  id text not null,
  fecha date not null,
  total_ef_cent bigint, total_banco_cent bigint, recuento_ef_cent bigint, recuento_banco_cent bigint,
  obs text, turno text, usuario text,
  migra_lote text,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id)
);

create table if not exists public.documentacion_institucional (
  comercio_id uuid not null references public.comercios(id),
  id text not null, nombre text not null, url text check (url is null or url ~ '^https://'), categoria text,
  migra_lote text, created_at timestamptz not null default now(),
  primary key (comercio_id, id)
);
create table if not exists public.recursos_utiles (
  comercio_id uuid not null references public.comercios(id),
  id text not null, nombre text not null, url text check (url is null or url ~ '^https://'),
  migra_lote text, created_at timestamptz not null default now(),
  primary key (comercio_id, id)
);

create table if not exists public.migra_lotes (
  comercio_id uuid not null references public.comercios(id),
  id text not null,
  archivo text,
  version text,
  reglas text[] not null default '{}',
  resumen jsonb not null,
  usuario uuid,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id)
);
create table if not exists public.migra_ids (
  comercio_id uuid not null references public.comercios(id),
  id_anterior text not null,                   -- p. ej. ENT:4da6e1ad:efectivo, DET:fcfc6943, MV:a03fde13
  lote text not null,
  created_at timestamptz not null default now(),
  primary key (comercio_id, id_anterior)
);

-- ---------- sólo-agregar e inmutabilidad ----------
do $$
declare t text;
begin
  foreach t in array array['stock_movimientos','dispensaciones','dispensacion_detalles','donaciones','legajo_seguimientos','formularios_respuestas','arqueos_historicos','migra_lotes','migra_ids'] loop
    if not exists (select 1 from pg_trigger where tgname = t || '_solo_agregar' and tgrelid = ('public.' || t)::regclass) then
      execute format('create trigger %I before update or delete on public.%I for each row execute function public.rave_solo_agregar()', t || '_solo_agregar', t);
    end if;
  end loop;
  if not exists (select 1 from pg_trigger where tgname = 'legajos_inmutable' and tgrelid = 'public.legajos'::regclass) then
    create trigger legajos_inmutable before update or delete on public.legajos for each row execute function public.migra_legajo_inmutable();
  end if;
end $$;

-- ---------- RLS: lectura para miembros del comercio; escritura sólo por funciones ----------
do $$
declare t text;
begin
  foreach t in array array['migra_config','rubros_financieros','legajos','geneticas','ciclos_cultivo','stock_movimientos','dispensaciones','dispensacion_detalles','donaciones','legajo_seguimientos','formularios_respuestas','legajo_documentos','arqueos_historicos','documentacion_institucional','recursos_utiles','migra_lotes','migra_ids'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select on public.%I to authenticated', t);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_leer_miembros') then
      execute format('create policy %I on public.%I for select to authenticated using (public.migra_rol(comercio_id) is not null)', t || '_leer_miembros', t);
    end if;
  end loop;
end $$;
-- datos personales y de salud (legajo, seguimientos, respuestas, documentos clínicos) y configuración: sólo admin y supervisor.
-- [Límite] el mostrador trabaja con la copia cifrada del sistema (6.11); estas tablas son el respaldo relacional de la migración.
do $$
declare t text;
begin
  foreach t in array array['legajos','legajo_seguimientos','formularios_respuestas','legajo_documentos','migra_config'] loop
    execute format('drop policy if exists %I on public.%I', t || '_leer_miembros', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.migra_rol(comercio_id) in (''admin'',''supervisor''))', t || '_leer_miembros', t);
  end loop;
end $$;

create or replace function public.migra_config_guardar(p_comercio uuid, p_sheet text, p_raiz text, p_carpetas text[])
returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if public.migra_rol(p_comercio) is distinct from 'admin' then raise exception 'Sólo un administrador.' using errcode = '42501'; end if;
  if exists (select 1 from unnest(coalesce(p_carpetas, '{}')) c where c !~ '^[A-Za-z0-9_-]{10,100}$') then raise exception 'Identificador de carpeta inválido.'; end if;
  insert into public.migra_config (comercio_id, sheet_id, drive_root_id, appsheet_folders, updated_by) values (p_comercio, p_sheet, p_raiz, coalesce(p_carpetas, '{}'), auth.uid())
  on conflict (comercio_id) do update set sheet_id = excluded.sheet_id, drive_root_id = excluded.drive_root_id, appsheet_folders = excluded.appsheet_folders, updated_at = now(), updated_by = auth.uid();
end $$;
revoke all on function public.migra_config_guardar(uuid, text, text, text[]) from public;
grant execute on function public.migra_config_guardar(uuid, text, text, text[]) to authenticated;

-- =====================================================================================
-- migra_aplicar: carga atómica del PLAN (formato de js/migra-core.js · migra-1.0)
-- =====================================================================================
drop function if exists public.migra_aplicar(uuid, jsonb, text);
create or replace function public.migra_aplicar(p_comercio uuid, p_plan jsonb, p_archivo text, p_usuario uuid)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_lote text; v_n int; x jsonb; v_uuid uuid; v_disp uuid; v_k text;
  v_leg jsonb := '{}'::jsonb;       -- clave → uuid de legajo
  v_dispEnt jsonb := '{}'::jsonb;   -- entrega anterior → uuid de dispensación
  c_pac int := 0; c_disp int := 0; c_det int := 0; c_don int := 0; c_mov int := 0; c_seg int := 0; c_doc int := 0; c_lot int := 0; c_omit int := 0;
  v_suma bigint := 0;
begin
  -- permisos: el usuario en cuyo nombre migra la función de servidor tiene que ser administrador del comercio
  if not exists (select 1 from public.miembros m where m.comercio_id = p_comercio and m.user_id = p_usuario and m.rol = 'admin') then
    raise exception 'Sólo un administrador del comercio puede migrar.' using errcode = '42501';
  end if;
  -- defensa en profundidad: aunque el plan lo arma el servidor, se revalida lo crítico
  if exists (select 1 from jsonb_array_elements(coalesce(p_plan->'disp','[]')) d where (d->>'fecha')::date > current_date + 1 or (d->>'cant')::numeric <= 0)
     or exists (select 1 from jsonb_array_elements(coalesce(p_plan->'aportes','[]')) d where (d->>'fecha')::date > current_date + 1 or (d->>'cent')::bigint <= 0)
     or exists (select 1 from jsonb_array_elements(coalesce(p_plan->'movs','[]')) d where d->>'tipo' not in ('ingreso','ajuste'))
     or exists (select 1 from jsonb_array_elements(coalesce(p_plan->'docs','[]')) d where d->>'ruta' !~ '^[A-Za-z0-9_][A-Za-z0-9_ ./-]*$' or length(d->>'ruta') > 300 or d->>'ruta' like '%..%')
     or exists (select 1 from jsonb_array_elements(coalesce(p_plan->'disp','[]')) d where d->>'cu' is distinct from p_plan->'ciclo'->>'id'
                and not exists (select 1 from public.ciclos_cultivo c where c.comercio_id = p_comercio and c.id = d->>'cu' and c.historico)) then
    raise exception 'El plan no pasa la revalidación del servidor (fechas, cantidades, tipos, rutas o ciclo de origen).';
  end if;
  -- plan
  if p_plan is null or p_plan->>'version' is distinct from 'migra-1.0' then raise exception 'Plan de migración con versión desconocida.'; end if;
  if (p_plan->>'ok')::boolean is not true then raise exception 'El plan tiene errores: no se carga nada.'; end if;
  if pg_column_size(p_plan) > 40 * 1024 * 1024 then raise exception 'El plan supera 40 MB.'; end if;
  -- un solo lote a la vez por comercio
  perform pg_advisory_xact_lock(hashtext('migra:' || p_comercio::text));

  select 'MIG-' || lpad((count(*) + 1)::text, 4, '0') into v_lote from public.migra_lotes where comercio_id = p_comercio;

  -- rubro de donaciones (si el comercio todavía no lo tiene)
  insert into public.rubros_financieros (comercio_id, id, nombre, tipo) values (p_comercio, 'R-01', 'Donaciones voluntarias', 'ingreso')
  on conflict do nothing;

  -- legajos existentes del comercio (por clave)
  select coalesce(jsonb_object_agg(clave, id), '{}'::jsonb) into v_leg from public.legajos where comercio_id = p_comercio;

  -- 1. legajos
  for x in select * from jsonb_array_elements(coalesce(p_plan->'pacientes', '[]')) loop
    if v_leg ? (x->>'key') then c_omit := c_omit + 1; continue; end if;
    insert into public.legajos (comercio_id, legajo_id, clave, legajo_anterior, doc_tipo, doc_hash, pii, estado_anterior, revisar, notas_migracion, fecha_alta, origen, migra_lote, created_by)
    values (p_comercio, x->>'leg', x->>'key', nullif(x->>'legAnt', ''),
      case when jsonb_typeof(x->'doc') = 'object' then x->'doc'->>'tipo' end,
      case when jsonb_typeof(x->'doc') = 'object' then encode(digest(p_comercio::text || ':' || (x->'doc'->>'num'), 'sha256'), 'hex') end,
      jsonb_build_object('nombre', left(x->>'nombre', 120), 'doc', case when jsonb_typeof(x->'doc') = 'object' then x->'doc'->>'num' end, 'motivo', left(x->>'motivo', 2000)),
      nullif(x->>'estadoAnt', ''), coalesce((x->>'revisar')::boolean, false),
      coalesce(array(select jsonb_array_elements_text(x->'notasMig')), '{}'), (x->>'alta')::date, left(x->>'origen', 80), v_lote, auth.uid())
    returning id into v_uuid;
    v_leg := v_leg || jsonb_build_object(x->>'key', v_uuid); c_pac := c_pac + 1;
  end loop;

  -- 2. datos de los formularios: completan la ficha sin pisar lo que ya tenía
  for x in select * from jsonb_array_elements(coalesce(p_plan->'enriquecer', '[]')) loop
    if exists (select 1 from public.migra_ids where comercio_id = p_comercio and id_anterior = x->>'sid') then continue; end if;
    if not (v_leg ? (x->>'key')) then raise exception 'Formulario de un legajo inexistente (%).', x->>'key'; end if;
    update public.legajos l set pii = (select jsonb_object_agg(k, v) from (
        select k, v from jsonb_each(l.pii) e(k, v)
        union all
        select k, to_jsonb(left(v #>> '{}', 2000)) from jsonb_each(x->'campos') c(k, v)
         where k in ('nac','tel','email','dir','cp','obraSocial','codSeg','ocupacion','dudas','motivo')
           and coalesce(v #>> '{}', '') <> '' and not (l.pii ? k and coalesce(l.pii->>k, '') <> '')) s)
      where l.comercio_id = p_comercio and l.id = (v_leg->>(x->>'key'))::uuid;
    insert into public.migra_ids values (p_comercio, x->>'sid', v_lote);
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p_plan->'formResp', '[]')) loop
    insert into public.formularios_respuestas (comercio_id, sheet_row_id, formulario, legajo_uuid, fecha, migra_lote)
    values (p_comercio, x->>'id', x->>'tipo', (v_leg->>(x->>'key'))::uuid, nullif(x->>'fecha', '')::date, v_lote)
    on conflict (comercio_id, sheet_row_id) do nothing;
  end loop;

  -- 3. ciclo histórico
  if jsonb_typeof(p_plan->'ciclo') = 'object' then
    insert into public.ciclos_cultivo (comercio_id, id, nombre, sala, inicio, estado, historico, notas, migra_lote)
    values (p_comercio, p_plan->'ciclo'->>'id', p_plan->'ciclo'->>'nombre', p_plan->'ciclo'->>'lote',
      coalesce((select min((d->>'fecha')::date) from jsonb_array_elements(p_plan->'disp') d), current_date), 'cerrado', true, p_plan->'ciclo'->>'notas', v_lote)
    on conflict do nothing;
  end if;

  -- 4. genéticas (lotes)
  for x in select * from jsonb_array_elements(coalesce(p_plan->'lotes', '[]')) loop
    if exists (select 1 from public.migra_ids where comercio_id = p_comercio and id_anterior = 'LOT:' || (x->>'legacyId')) then continue; end if;
    insert into public.geneticas (comercio_id, id, id_anterior, nombre, producto, unidad, quimiotipo, tipo_anterior, thc_pct, cbd_pct, indicaciones, migra_lote)
    values (p_comercio, x->>'id', x->>'legacyId', x->>'nombre', x->>'prod', x->>'unidad', nullif(x->>'quim', ''), nullif(x->>'tipoAnt', ''),
      (x->>'thc')::numeric, (x->>'cbd')::numeric, nullif(x->>'indic', ''), v_lote);
    insert into public.migra_ids values (p_comercio, 'LOT:' || (x->>'legacyId'), v_lote); c_lot := c_lot + 1;
  end loop;

  -- 5. movimientos de stock
  for x in select * from jsonb_array_elements(coalesce(p_plan->'movs', '[]')) loop
    if exists (select 1 from public.migra_ids where comercio_id = p_comercio and id_anterior = x->>'id') then continue; end if;
    insert into public.stock_movimientos (comercio_id, genetica_id, tipo, cantidad, fecha, ts, ref, motivo, usuario, migra_lote)
    values (p_comercio, x->>'lote', x->>'tipo', (x->>'cant')::numeric, (x->>'fecha')::date, (x->>'ts')::timestamptz, x->>'ref', left(x->>'motivo', 300), 'Migración', v_lote);
    insert into public.migra_ids values (p_comercio, x->>'id', v_lote); c_mov := c_mov + 1;
  end loop;

  -- 6. dispensaciones (una cabecera por entrega) + detalle con ciclo obligatorio + movimiento de stock
  for x in select * from jsonb_array_elements(coalesce(p_plan->'disp', '[]')) loop
    if exists (select 1 from public.migra_ids where comercio_id = p_comercio and id_anterior = x->>'id') then continue; end if;
    if not (v_leg ? (x->>'key')) then raise exception 'Dispensación de un legajo inexistente (entrega %).', x->>'entrega'; end if;
    if coalesce(x->>'cu', '') = '' then raise exception 'Renglón % sin ciclo de cultivo de origen.', x->>'legacyId'; end if;
    v_disp := (v_dispEnt->>(x->>'entrega'))::uuid;
    if v_disp is null then
      insert into public.dispensaciones (comercio_id, legajo_uuid, fecha, ts, entrega_anterior, usuario, obs, migra_lote)
      values (p_comercio, (v_leg->>(x->>'key'))::uuid, (x->>'fecha')::date, (x->>'ts')::timestamptz, x->>'entrega', left(x->>'user', 120), 'Migración del sistema anterior', v_lote)
      returning id into v_disp;
      v_dispEnt := v_dispEnt || jsonb_build_object(x->>'entrega', v_disp); c_disp := c_disp + 1;
    end if;
    insert into public.dispensacion_detalles (comercio_id, dispensacion_id, genetica_id, ciclo_cultivo_id, cantidad, unidad, importe_cent, detalle_anterior, ciclo_historico)
    values (p_comercio, v_disp, x->>'lote', x->>'cu', (x->>'cant')::numeric, x->>'unidad', greatest(0, (x->>'cent')::bigint), x->>'legacyId', coalesce((x->>'cuHist')::boolean, false));
    insert into public.stock_movimientos (comercio_id, genetica_id, tipo, cantidad, fecha, ts, ref, motivo, usuario, migra_lote)
    values (p_comercio, x->>'lote', 'dispensacion', -(x->>'cant')::numeric, (x->>'fecha')::date, (x->>'ts')::timestamptz, x->>'legacyId', 'Migración', 'Migración', v_lote);
    insert into public.migra_ids values (p_comercio, x->>'id', v_lote); c_det := c_det + 1;
  end loop;

  -- 7. donaciones (rubro financiero obligatorio)
  for x in select * from jsonb_array_elements(coalesce(p_plan->'aportes', '[]')) loop
    if exists (select 1 from public.migra_ids where comercio_id = p_comercio and id_anterior = x->>'id') then continue; end if;
    if not exists (select 1 from public.rubros_financieros where comercio_id = p_comercio and id = x->>'rubroId' and activo and tipo in ('ingreso','ambos')) then
      raise exception 'Donación % con rubro financiero inválido (%).', x->>'entrega', x->>'rubroId';
    end if;
    insert into public.donaciones (comercio_id, legajo_uuid, dispensacion_id, fecha, ts, importe_cent, servicio_cent, medio, rubro_financiero_id, concepto, obs, usuario, id_anterior, migra_lote)
    values (p_comercio, (v_leg->>(x->>'key'))::uuid, (v_dispEnt->>(x->>'entrega'))::uuid, (x->>'fecha')::date, (x->>'ts')::timestamptz, (x->>'cent')::bigint,
      coalesce((x->>'servicio')::bigint, 0), x->>'medio', x->>'rubroId', coalesce(x->>'concepto', 'Donación voluntaria'), left(x->>'obs', 500), left(x->>'user', 120), x->>'id', v_lote);
    insert into public.migra_ids values (p_comercio, x->>'id', v_lote); c_don := c_don + 1; v_suma := v_suma + (x->>'cent')::bigint;
  end loop;
  for v_k in select jsonb_array_elements_text(coalesce(p_plan->'entregas', '[]')) loop
    insert into public.migra_ids values (p_comercio, v_k, v_lote) on conflict do nothing;
  end loop;

  -- 8. seguimientos
  for x in select * from jsonb_array_elements(coalesce(p_plan->'seg', '[]')) loop
    if exists (select 1 from public.migra_ids where comercio_id = p_comercio and id_anterior = x->>'id') then continue; end if;
    insert into public.legajo_seguimientos (comercio_id, legajo_uuid, fecha, tipo_seguimiento, datos, id_anterior, migra_lote)
    values (p_comercio, (v_leg->>(x->>'key'))::uuid, (x->>'fecha')::date, case when (x->>'id') like 'F2:%' then 'formulario' else 'seguimiento' end, x - 'key' - 'id', x->>'id', v_lote);
    insert into public.migra_ids values (p_comercio, x->>'id', v_lote); c_seg := c_seg + 1;
  end loop;

  -- 9. documentos del legajo (se vinculan con Drive después: migra_vincular_documento)
  for x in select * from jsonb_array_elements(coalesce(p_plan->'docs', '[]')) loop
    if exists (select 1 from public.migra_ids where comercio_id = p_comercio and id_anterior = x->>'id') then continue; end if;
    insert into public.legajo_documentos (comercio_id, legajo_uuid, id_anterior, nombre, tipo, extension, ruta_anterior, fecha, migra_lote)
    values (p_comercio, (v_leg->>(x->>'key'))::uuid, x->>'legacyId', left(x->>'nombre', 160), nullif(x->>'tipo', ''), nullif(x->>'ext', ''), x->>'ruta', nullif(x->>'fecha', '')::date, v_lote);
    insert into public.migra_ids values (p_comercio, x->>'id', v_lote); c_doc := c_doc + 1;
  end loop;

  -- 10. institucional, recursos, arqueos (también quedan marcados para no repetir)
  for x in select * from jsonb_array_elements(coalesce(p_plan->'docInst', '[]')) loop
    if exists (select 1 from public.migra_ids where comercio_id = p_comercio and id_anterior = x->>'id') then continue; end if;
    insert into public.documentacion_institucional (comercio_id, id, nombre, url, categoria, migra_lote)
      values (p_comercio, x->>'legacyId', left(x->>'nombre', 160), nullif(x->>'url', ''), nullif(x->>'cat', ''), v_lote) on conflict do nothing;
    insert into public.migra_ids values (p_comercio, x->>'id', v_lote);
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p_plan->'recursos', '[]')) loop
    if exists (select 1 from public.migra_ids where comercio_id = p_comercio and id_anterior = x->>'id') then continue; end if;
    insert into public.recursos_utiles (comercio_id, id, nombre, url, migra_lote)
      values (p_comercio, x->>'legacyId', left(x->>'nombre', 160), nullif(x->>'url', ''), v_lote) on conflict do nothing;
    insert into public.migra_ids values (p_comercio, x->>'id', v_lote);
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p_plan->'arqueos', '[]')) loop
    if exists (select 1 from public.migra_ids where comercio_id = p_comercio and id_anterior = x->>'id') then continue; end if;
    insert into public.arqueos_historicos (comercio_id, id, fecha, total_ef_cent, total_banco_cent, recuento_ef_cent, recuento_banco_cent, obs, turno, usuario, migra_lote)
      values (p_comercio, x->>'id', (x->>'fecha')::date, (x->>'totalEf')::bigint, (x->>'totalBanco')::bigint, (x->>'recuentoEf')::bigint, (x->>'recuentoBanco')::bigint, left(x->>'obs', 500), x->>'turno', x->>'user', v_lote) on conflict do nothing;
    insert into public.migra_ids values (p_comercio, x->>'id', v_lote);
  end loop;

  -- invariantes: si el plan era nuevo, lo cargado tiene que coincidir con lo anunciado
  -- si no se escribió nada, no hay lote; si se escribió algo (aunque sean sólo formularios), el lote queda registrado
  if c_pac = 0 and not exists (select 1 from public.migra_ids where comercio_id = p_comercio and lote = v_lote) then
    return jsonb_build_object('ok', true, 'lote', null, 'mensaje', 'Nada nuevo: este plan ya estaba cargado.');
  end if;
  if c_don = jsonb_array_length(coalesce(p_plan->'aportes', '[]')) and v_suma <> (p_plan->'resumen'->>'donadoCent')::bigint then
    raise exception 'El importe donado no cierra (% vs %).', v_suma, p_plan->'resumen'->>'donadoCent';
  end if;

  insert into public.migra_lotes (comercio_id, id, archivo, version, reglas, resumen, usuario)
  values (p_comercio, v_lote, left(p_archivo, 200), p_plan->>'version',
    coalesce(array(select k from jsonb_each_text(coalesce(p_plan->'reglas', '{}')) r(k, v) where v = 'true'), '{}'),
    jsonb_build_object('legajos', c_pac, 'dispensaciones', c_disp, 'renglones', c_det, 'donaciones', c_don, 'donado_cent', v_suma, 'movimientos', c_mov, 'seguimientos', c_seg, 'documentos', c_doc, 'lotes', c_lot, 'ya_existian', c_omit),
    auth.uid());
  return jsonb_build_object('ok', true, 'lote', v_lote, 'legajos', c_pac, 'dispensaciones', c_disp, 'renglones', c_det, 'donaciones', c_don, 'donado_cent', v_suma,
    'movimientos', c_mov, 'seguimientos', c_seg, 'documentos', c_doc, 'lotes', c_lot);
end $$;
revoke all on function public.migra_aplicar(uuid, jsonb, text, uuid) from public, anon, authenticated;
grant execute on function public.migra_aplicar(uuid, jsonb, text, uuid) to service_role;

-- ---------- vínculo con Google Drive (lo llama la función de servidor drive-legajos) ----------
create or replace function public.migra_vincular_carpeta(p_comercio uuid, p_legajo_id text, p_folder_id text)
returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if public.migra_rol(p_comercio) is distinct from 'admin' then raise exception 'Sin permiso.' using errcode = '42501'; end if;
  if p_folder_id !~ '^[A-Za-z0-9_-]{10,100}$' then raise exception 'Identificador de carpeta inválido.'; end if;
  update public.legajos set drive_folder_id = p_folder_id
   where comercio_id = p_comercio and legajo_id = p_legajo_id and (drive_folder_id is null or drive_folder_id = p_folder_id);
  if not found then raise exception 'Legajo inexistente o ya vinculado a otra carpeta.'; end if;
end $$;
create or replace function public.migra_vincular_documento(p_comercio uuid, p_doc uuid, p_file_id text, p_url text, p_md5 text, p_version bigint, p_estado text)
returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if public.migra_rol(p_comercio) is distinct from 'admin' then raise exception 'Sin permiso.' using errcode = '42501'; end if;
  if p_estado not in ('vinculado','no encontrado','error') then raise exception 'Estado inválido.'; end if;
  if p_estado = 'vinculado' and (p_file_id !~ '^[A-Za-z0-9_-]{10,100}$' or p_url !~ '^https://(drive|docs)\.google\.com/') then raise exception 'Archivo de Drive inválido.'; end if;
  update public.legajo_documentos set file_id = case when p_estado = 'vinculado' then p_file_id end, url = case when p_estado = 'vinculado' then p_url end,
    hash_md5 = p_md5, version = p_version, estado = p_estado, vinculado_at = now(), updated_at = now()
   where comercio_id = p_comercio and id = p_doc and (file_id is null or file_id = p_file_id);
  if not found then raise exception 'Documento inexistente o vinculado a otro archivo.'; end if;
end $$;
revoke all on function public.migra_vincular_carpeta(uuid, text, text) from public;
revoke all on function public.migra_vincular_documento(uuid, uuid, text, text, text, bigint, text) from public;
grant execute on function public.migra_vincular_carpeta(uuid, text, text) to authenticated;
grant execute on function public.migra_vincular_documento(uuid, uuid, text, text, text, bigint, text) to authenticated;

-- ---------- vista de control: stock por genética = suma de movimientos ----------
create or replace view public.stock_por_genetica with (security_invoker = true) as
  select g.comercio_id, g.id, g.nombre, g.unidad, coalesce(sum(m.cantidad), 0)::numeric(14,2) as stock
  from public.geneticas g left join public.stock_movimientos m on m.comercio_id = g.comercio_id and m.genetica_id = g.id
  group by g.comercio_id, g.id, g.nombre, g.unidad;
grant select on public.stock_por_genetica to authenticated;

-- verificación posterior (no modifica nada)
do $$
declare n int;
begin
  select count(*) into n from pg_tables where schemaname = 'public' and tablename in ('legajos','dispensaciones','dispensacion_detalles','donaciones','migra_ids') and rowsecurity;
  if n <> 5 then raise exception 'Verificación: RLS no quedó activa en todas las tablas de migración.'; end if;
end $$;
