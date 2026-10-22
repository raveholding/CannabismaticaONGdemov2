#!/bin/sh
# El núcleo de migración tiene UNA sola fuente: js/migra-core.js. Antes de desplegar la función se copia acá
# (el despliegue de Supabase sólo empaqueta supabase/functions). La prueba t/server.test.ts falla si las copias difieren.
cp "$(dirname "$0")/../../js/migra-core.js" "$(dirname "$0")/_shared/migra-core.js" && echo "Núcleo copiado."
