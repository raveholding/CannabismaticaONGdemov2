#!/bin/sh
# Pruebas de la migración 12 contra un Postgres local descartable.  Uso: PGHOST=... PGPORT=... sh supabase/tests/correr.sh
set -e
cd "$(dirname "$0")"
P="psql -X -q -v ON_ERROR_STOP=1 -U postgres"
$P -c "drop database if exists t12" >/dev/null && $P -c "create database t12" >/dev/null
$P -d t12 -f 00-stub-supabase.sql >/dev/null
$P -d t12 -f ../migrations/12-migracion-sistema-anterior.sql >/dev/null 2>&1
$P -d t12 -f ../migrations/12-migracion-sistema-anterior.sql >/dev/null 2>&1 && echo "ok  la migración corre dos veces sin error (idempotente)"
$P -d t12 -v plan="$(node plan_sintetico.js)" -v plan_malo="$(node plan_sintetico.js malo)" -v plan_error="$(node plan_sintetico.js error)" -v plan_sinciclo="$(node plan_sintetico.js sinciclo)" -v plan_cicloreal="$(node plan_sintetico.js cicloreal)" -v plan_movmalo="$(node plan_sintetico.js movmalo)" -v plan_form="$(node plan_sintetico.js form)" -f 12-migracion.test.sql 2>&1 | sed -n 's/.*NOTICE:  \(ok  .*\)/\1/p; s/.*\(ERROR:.*\)/\1/p'
