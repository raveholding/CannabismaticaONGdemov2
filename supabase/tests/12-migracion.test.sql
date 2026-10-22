-- Pruebas de 12-migracion-sistema-anterior.sql (correr sobre una base con 00-stub-supabase.sql + la migración).
-- Uso: psql -v plan="$(node plan_sintetico.js)" -v malo=... -f 12-migracion.test.sql
\set ON_ERROR_STOP 1
create or replace function pg_temp.ok(c boolean, n text) returns void language plpgsql as $$ begin if not c then raise exception 'FALLA: %', n; end if; raise notice 'ok  %', n; end $$;
create or replace function pg_temp.como(u text) returns void language plpgsql as $$ begin perform set_config('request.jwt.claim.sub', u, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.srv() returns void language plpgsql as $$ begin perform set_config('request.jwt.claim.sub', '', false); execute 'set role service_role'; end $$;
create or replace function pg_temp.falla(sql text, patron text) returns boolean language plpgsql as $$ begin execute sql; return false; exception when others then return sqlerrm ~* patron; end $$;
\set A '\'aaaaaaaa-0000-0000-0000-00000000000a\''
\set B '\'bbbbbbbb-0000-0000-0000-00000000000b\''
\set adminA '\'11111111-1111-1111-1111-111111111111\''
\set mostA '\'22222222-2222-2222-2222-222222222222\''
\set adminB '\'33333333-3333-3333-3333-333333333333\''

-- 1. permisos: un usuario NO puede llamar migra_aplicar por la API (sólo la función de servidor, service_role)
select pg_temp.como(:adminA);
select pg_temp.ok(pg_temp.falla(format('select public.migra_aplicar(%L, %L::jsonb, null, %L)', :A, :'plan', :adminA), 'permission denied'), 'ni el admin puede llamar migra_aplicar directo (plan escrito a mano)');
reset role; select pg_temp.srv();
select pg_temp.ok(pg_temp.falla(format('select public.migra_aplicar(%L, %L::jsonb, null, %L)', :A, :'plan', :mostA), 'administrador'), 'en nombre de un mostrador: rechazado');
select pg_temp.ok(pg_temp.falla(format('select public.migra_aplicar(%L, %L::jsonb, null, %L)', :A, :'plan', :adminB), 'administrador'), 'en nombre del admin de B, sobre A: rechazado');

-- 2. todo o nada: un plan con error, con rubro inválido, sin ciclo o con ciclo real (no histórico) no deja nada
select pg_temp.ok(pg_temp.falla(format('select public.migra_aplicar(%L, %L::jsonb, null, %L)', :A, :'plan_error', :adminA), 'errores'), 'un plan marcado con errores se rechaza');
select pg_temp.ok(pg_temp.falla(format('select public.migra_aplicar(%L, %L::jsonb, null, %L)', :A, :'plan_malo', :adminA), 'rubro financiero'), 'rubro inexistente: se rechaza');
select pg_temp.ok(pg_temp.falla(format('select public.migra_aplicar(%L, %L::jsonb, null, %L)', :A, :'plan_sinciclo', :adminA), 'ciclo'), 'renglón sin ciclo: se rechaza');
select pg_temp.ok(pg_temp.falla(format('select public.migra_aplicar(%L, %L::jsonb, null, %L)', :A, :'plan_cicloreal', :adminA), 'revalidación'), 'renglón apuntando a un ciclo real activo: se rechaza');
select pg_temp.ok(pg_temp.falla(format('select public.migra_aplicar(%L, %L::jsonb, null, %L)', :A, :'plan_movmalo', :adminA), 'revalidación'), 'movimiento «dispensacion» positivo colado en movs: se rechaza');
select pg_temp.ok((select count(*) from public.legajos) = 0 and (select count(*) from public.donaciones) = 0 and (select count(*) from public.migra_ids) = 0, 'después de los rechazos no quedó nada (rollback total)');

-- 3. carga real
select public.migra_aplicar(:A, :'plan'::jsonb, 'libro_sintetico.xlsx', :adminA) as r \gset
select pg_temp.ok((:'r'::jsonb->>'lote') = 'MIG-0001', 'lote MIG-0001 creado');
select pg_temp.ok((select count(*) from public.legajos where comercio_id = :A) = 8, '8 legajos');
select pg_temp.ok((select count(*) from public.dispensacion_detalles) = 11, '11 renglones de dispensación');
select pg_temp.ok((select count(*) from public.dispensaciones) = 9, '9 dispensaciones (una por entrega con productos)');
select pg_temp.ok((select count(*) from public.donaciones) = 10 and (select sum(importe_cent) from public.donaciones) = 36399998, '10 donaciones por $ 363.999,98 (centavos exactos)');
select pg_temp.ok((select count(*) from public.dispensacion_detalles where ciclo_cultivo_id = 'CU-HIST-MIGRACION' and ciclo_historico) = 11, 'cada renglón con ciclo de origen (histórico)');
select pg_temp.ok((select stock from public.stock_por_genetica where id = 'L-MIG-G0000002') = 69.5, 'stock reconstruido: 69,5 g');
select pg_temp.ok((select count(*) from public.legajo_documentos) = 2 and (select count(*) from public.legajo_seguimientos) = 2, 'documentos y seguimientos');
select pg_temp.ok((select pii->>'nac' from public.legajos where clave = '99100001') = '1997-05-11', 'el formulario completó la ficha');
select pg_temp.ok((select legajo_id from public.legajos where clave = '99100001') ~ '^L-260330-', 'legajo con la fecha de ingreso del sistema anterior');
select pg_temp.ok((select count(*) from public.legajos where revisar) = 5, '5 legajos para revisar');

-- 4. idempotencia: reenviar el mismo plan no duplica
select public.migra_aplicar(:A, :'plan'::jsonb, null, :adminA) as r2 \gset
select pg_temp.ok((:'r2'::jsonb->>'lote') is null and (select count(*) from public.donaciones) = 10 and (select count(*) from public.dispensacion_detalles) = 11 and (select count(*) from public.legajos) = 8, 'reenviar el mismo plan no duplica');

select pg_temp.ok((select count(*) from public.migra_lotes) = 1, 'reenviar no crea un lote vacío');
select public.migra_aplicar(:A, :'plan_form'::jsonb, null, :adminA) as r3 \gset
select pg_temp.ok((:'r3'::jsonb->>'lote') = 'MIG-0002' and (select count(*) from public.migra_lotes) = 2 and (select count(*) from public.migra_ids where lote = 'MIG-0002') = 1, 'un plan con sólo un formulario nuevo queda como su propio lote MIG-0002');
reset role;
-- 5. sólo-agregar e inmutabilidad (también para el dueño de la función)
reset role;
select pg_temp.ok(pg_temp.falla('update public.donaciones set importe_cent = 1', 'sólo-agregar'), 'donaciones: UPDATE rechazado');
select pg_temp.ok(pg_temp.falla('delete from public.dispensacion_detalles', 'sólo-agregar'), 'detalle: DELETE rechazado');
select pg_temp.ok(pg_temp.falla('delete from public.stock_movimientos', 'sólo-agregar'), 'movimientos: DELETE rechazado');
select pg_temp.ok(pg_temp.falla($$update public.legajos set legajo_id = 'L-260101-AAAAAA'$$, 'inmutable'), 'legajo_id inmutable');
select pg_temp.ok(pg_temp.falla('delete from public.legajos', 'no se borra'), 'un legajo no se borra');

-- 6. escritura directa y RLS A/B
select pg_temp.como(:adminA);
select pg_temp.ok(pg_temp.falla(format($$insert into public.donaciones (comercio_id, fecha, ts, importe_cent, medio, rubro_financiero_id) values (%L, current_date, now(), 100, 'efectivo', 'R-01')$$, :A), 'permission denied'), 'insertar directo está prohibido aun siendo admin');
select pg_temp.ok((select count(*) from public.legajos) = 8, 'admin de A ve sus 8 legajos');
reset role; select pg_temp.como(:adminB);
select pg_temp.ok((select count(*) from public.legajos) = 0 and (select count(*) from public.donaciones) = 0 and (select count(*) from public.legajo_documentos) = 0, 'el admin de B no ve nada de A');
reset role; select pg_temp.como(:mostA);
select pg_temp.ok((select count(*) from public.legajo_documentos) = 0 and (select count(*) from public.legajos) = 0 and (select count(*) from public.legajo_seguimientos) = 0, 'el mostrador no ve datos de salud (legajo, seguimientos, documentos)');
reset role;
select set_config('request.jwt.claim.sub', '', false);


-- 7. vínculo con Drive
select pg_temp.como(:adminA);
select public.migra_vincular_carpeta(:A, (select legajo_id from public.legajos where clave = '99100001'), '1AbCdEfGhIjKlMnOpQrStUvWxYz');
select pg_temp.ok(pg_temp.falla(format('select public.migra_vincular_carpeta(%L, %L, %L)', :A, (select legajo_id from public.legajos where clave = '99100001'), '1OtraCarpetaDistinta0000'), 'ya vinculado'), 'una carpeta vinculada no se reemplaza por otra');
select public.migra_vincular_documento(:A, (select id from public.legajo_documentos where id_anterior = 'dc000001'), '1FileIdDeEjemplo000000', 'https://drive.google.com/file/d/1FileIdDeEjemplo000000/view', 'abc123', 3, 'vinculado');
select pg_temp.ok((select estado from public.legajo_documentos where id_anterior = 'dc000001') = 'vinculado', 'documento vinculado con file_id, url, hash y versión');
select pg_temp.ok(pg_temp.falla(format('select public.migra_vincular_documento(%L, %L, %L, %L, null, null, %L)', :A, (select id from public.legajo_documentos where id_anterior = 'dc000001'), '1FileIdDeEjemplo000000', 'javascript:alert(1)', 'vinculado'), 'inválido'), 'url no https rechazada');
reset role;
