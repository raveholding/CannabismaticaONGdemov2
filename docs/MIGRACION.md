# Migración del sistema anterior (planilla «CANNABISMATICA» de AppSheet / Google Sheets)

Versión migra-1.0 · 2026-10-22 · SISTEMA_VB_ONGF 4.9 / 4.28

Este documento no contiene datos de ninguna persona. Las pruebas usan un libro **sintético** (`t/libro_sintetico.xlsx`, generado por `t/mk_libro.py`) con la misma estructura y las mismas anomalías que la planilla real.

## 1. Cómo se usa (demo y sistema)

1. En Google Sheets: **Archivo → Descargar → Microsoft Excel (.xlsx)**.
2. En el sistema: **Sistema → Migración del sistema anterior** (sólo administrador) → elegir el archivo. Se leen las 13 pestañas **dentro del navegador**: el archivo no se envía a ningún servidor.
3. Leer el resultado: errores, filas que irían «a revisión», avisos, control de stock y omitidos. **Descargar informe (CSV)** para revisarlo con la ONG.
4. Decidir qué reglas de migración histórica se encienden (sección 4). **Probar (sin guardar)** no modifica nada.
5. **Migrar todo**: una sola operación. Si algo falla en medio, no queda nada. Queda en la auditoría con las reglas usadas.
6. **Deshacer el último lote**: posible mientras no haya dispensaciones, donaciones, movimientos o cierres de caja nuevos que usen lo migrado.

Reimportar el mismo archivo no duplica: cada registro guarda su identificador del sistema anterior.

## 2. Mapeo de pestañas

| Pestaña | Destino | Notas |
|---|---|---|
| `Legajo` | Legajo único del paciente (`legajos`) | Se genera `L-AAMMDD-XXXXXX` con la **fecha de ingreso** del sistema anterior; el `ID_Legajo` viejo queda en `legajo_anterior`. DNI dudoso (NaN, negativo, menos de 6 o más de 9 dígitos), nombre con forma de correo o sin estado ⇒ se carga **«a revisar»**. DNI repetido ⇒ error. |
| `Respuestas de formulario 1` | Completa la ficha (nacimiento, teléfono, correo, dirección, obra social, código REPROCANN…) + `formularios_respuestas` | **Nunca pisa** un dato que la ficha ya tenga (el conflicto queda anotado). Un DNI sin legajo crea la ficha «a revisar». Sin DNI ⇒ a revisión. |
| `Respuestas de formulario 2` | Seguimiento médico (`legajo_seguimientos`, tipo «formulario») | Un DNI sin legajo ⇒ a revisión. |
| `Seguimientos` | `legajo_seguimientos` | Hoy está vacía. |
| `Documentos` | `legajo_documentos` (estado «por vincular») | Se guarda la ruta de AppSheet; el vínculo con Drive lo hace la función de servidor (sección 6). Rutas con `..`, `/` inicial o `://` ⇒ error. |
| `Geneticas` | Lotes de stock (`geneticas`) | Se clasifican: aceite → frasco, crema → u, el resto → g. **«consulta médica» y «Hrs Extras» no son productos** (ver regla). Quimiotipo deducido de THC/CBD. |
| `Movimientos` | **Movimientos de stock** en la unidad del lote | **No es la caja**: son entradas y ajustes en gramos. El stock se reconstruye sumando movimientos − dispensaciones y se compara con la columna `Stock` (pestaña «Control de stock»). |
| `Entregas` + `EntregasDetalle` | Dispensación (un renglón por producto, con **ciclo de origen obligatorio**) + **Donación** (rubro «Donaciones voluntarias») | Lo donado se toma de las columnas `Efectivo` / `Transferencia`; si están vacías, de la suma del detalle con el medio de `FormaPago`. Una entrega sin importe es una dispensación sin donación. Las donaciones migradas son historia: **no entran en una caja abierta hoy**. |
| `Usuarios_Roles` | Usuarios **inactivos, para invitar** | En la nube las personas entran por invitación (no se crean claves). Roles aceptados: Administrador, Supervisor, Mostrador, Operador. |
| `Documentación_Institucional`, `Recursos_Utiles` | Listas de enlaces | Sólo enlaces `https`. |
| `Arqueo` | `arqueos_historicos` (sólo lectura) | Hoy está vacía. No se convierte en cierres sellados. |

## 3. «Todo o nada»

Con todas las reglas apagadas, un solo error impide cargar y el informe dice **pestaña, fila, ID y causa**. Errores que **ninguna regla tapa**: ID repetido, DNI repetido en `Legajo`, columna o pestaña faltante, número ilegible, rol desconocido, enlace no https, ruta peligrosa.

## 4. Reglas de migración histórica (apagadas por defecto)

| Regla | Qué resuelve | Riesgo / qué decide la ONG |
|---|---|---|
| Ciclo histórico | El sistema anterior **no registraba ciclo de cultivo**. Asigna las entregas al ciclo cerrado **«Stock histórico (migración)»** (`CU-HIST-MIGRACION`), marcado `historico`. | No es un ciclo real: la trazabilidad de esa materia prima queda como «histórica». Sin esta regla no se puede migrar ninguna entrega. |
| Omitir renglones vacíos | Renglones sin cantidad y con importe 0. | Ninguno. |
| Servicios sin stock | «consulta médica» y «Hrs Extras» figuran como genéticas. Se cargan como **donación de servicio**, sin dispensación ni stock. | Confirmar que no son productos. |
| Crear legajo faltante | Entregas con un DNI que no está en `Legajo` ⇒ legajo «a revisar». | Completar la ficha después. |
| Separar a revisión | Las filas imposibles (sin legajo, renglón sin genética con importe) **no se cargan** y quedan listadas; se carga el resto. | Esas entregas quedan fuera hasta corregirlas en la planilla y reimportar (no duplica). |
| Medio «Otro (sin dato)» | `FormaPago` vacía o `MIXTO` sin desglose. | El arqueo histórico por medio de pago no es exacto para esas entregas. |
| Lo cobrado manda | `Efectivo`/`Transferencia` no coinciden con la suma del detalle. Se registra lo cobrado (nunca se inventa dinero: un 0 explícito no genera donación). | Sin esta regla esas entregas quedan a revisión. |

## 5. Base de datos (nube)

`supabase/migrations/12-migracion-sistema-anterior.sql` — aditiva e idempotente (probada dos veces seguidas).

- Tablas con `comercio_id`, RLS y **sin escritura directa**. Todo entra por `migra_aplicar(comercio, plan, archivo, usuario)` (`SECURITY DEFINER`, `search_path` fijo con el esquema `extensions`, un lote a la vez por comercio). **Sólo la puede ejecutar la función de servidor** (`service_role`), que arma el plan leyendo Google: nadie puede mandar un plan escrito a mano por la API. La base revalida que el usuario sea administrador y lo crítico del plan (fechas, cantidades, tipos de movimiento, rutas, ciclo histórico).
- `migra_config` (por comercio): planilla, carpeta raíz de Drive y carpetas de documentos de AppSheet, cargadas con `migra_config_guardar` (administrador). El pedido a la función nunca elige planilla ni carpeta.
- **Sólo-agregar** (`rave_solo_agregar`): movimientos de stock, dispensaciones, detalle, donaciones, seguimientos, respuestas, arqueos y el registro de lotes. El `legajo_id` es inmutable y un legajo no se borra.
- `dispensacion_detalles.ciclo_cultivo_id NOT NULL` con clave foránea a `ciclos_cultivo`; `donaciones.rubro_financiero_id NOT NULL` con clave foránea a `rubros_financieros`. Importes en `bigint` (centavos).
- Legajos, seguimientos, respuestas de formularios y documentos clínicos: sólo administrador y supervisor. `legajo_anterior` es único por comercio (no se duplican pacientes sin DNI al reimportar).
- **Punto de adaptación**: la función `migra_rol()` lee `miembros(comercio_id, user_id, rol)`. **[VERIFICAR]** contra la base real del cliente antes de aplicar; si las columnas se llaman distinto, se ajusta sólo esa función.
- **Límite declarado**: los datos personales del legajo van en la columna `pii` (jsonb) protegidos por RLS, **no cifrados de extremo a extremo** como pide 6.11. La carga desde el navegador puede cifrarlos con la llave del comercio antes de subir; la carga desde la función de servidor necesita leerlos en claro de Google. Decisión pendiente (ver «Decisiones»).

**Cómo deshacer en la nube**: las tablas son de sólo-agregar a propósito. Un lote se revierte con una función administrativa que borre por `migra_lote` deshabilitando los triggers dentro de una transacción, **sólo con respaldo previo y orden expresa**; no se incluye para que no exista un botón destructivo. Antes de producción: respaldo, prueba en una copia (branch) y verificación de conteos.

## 6. Función de servidor `migra-sheets` (Google con cuenta de servicio)

`supabase/functions/migra-sheets/index.ts` + `_shared/google.ts` (Deno, sin dependencias).

- `analizar`: lee la planilla con la **cuenta de servicio** y devuelve el informe (sin la lista de datos personales).
- `aplicar`: si el plan no tiene errores, llama a `migra_aplicar` con el JWT del usuario (los permisos los aplica la base).
- `drive`: crea `Legajos/` dentro de la carpeta raíz y una carpeta por legajo `{legajo_id}_{DNI}` (o `_SD`), **idempotente por propiedad de la carpeta, no por nombre**; vincula cada documento creando un **acceso directo** al archivo original de AppSheet — **no lo mueve ni lo copia**, así la app vieja sigue funcionando. Guarda `file_id`, URL, md5 y versión. Dos archivos con el mismo ID ⇒ se informa, no se elige al azar. Procesa en tandas (`limite`, máx. 100).
- Antes de desplegar: `sh supabase/functions/copiar-nucleo.sh` (una sola fuente: `js/migra-core.js`; una prueba falla si las copias difieren).

**Secretos** (panel de Supabase → Edge Functions → Secrets; nunca por chat ni correo): una cuenta de servicio **por comercio** en `GOOGLE_SA_JSON_<id del comercio en hexadecimal, mayúsculas, sin guiones>` y `ALLOWED_ORIGINS`; `SUPABASE_SERVICE_ROLE_KEY` la provee Supabase. «Verify JWT» apagado (la función valida la sesión).

La planilla se lee **sin formato** (`UNFORMATTED_VALUE`, fechas como número de serie): el plan es idéntico venga del .xlsx o de la API. El estado existente se lee paginado. Los documentos se buscan **sólo dentro de las carpetas de AppSheet del comercio**. El vínculo con Drive lo corre sólo un administrador.

**A cargo de la ONG en Google**: crear la cuenta de servicio en un proyecto de Google Cloud con las APIs de Sheets y Drive habilitadas; **compartir la planilla (lector) y la carpeta raíz (editor)** con el correo de la cuenta de servicio. Sin eso la función responde «Pendiente de configuración» o «compartí la carpeta…».

## 7. Pruebas

| Suite | Qué prueba | Resultado (2026-10-22) |
|---|---|---|
| `node t/migra.test.js` | Núcleo: números, fechas, clasificación, todo o nada, reglas, importes por medio, ciclo, stock, legajos, formularios, idempotencia, duplicados, datos no confiables | 26/26 |
| `python3 t/e2e_migra.py` | Chromium real: lector .xlsx de 13 pestañas, estricto, reglas, migrar, ficha, XSS, caja abierta, reimportar, rollback, deshacer bloqueado y libre, permisos, 25 pantallas, 360 px, consola | 38/38 |
| `node t/server.test.ts` | Función de servidor con Google y base simulados: 401/403/405/CORS, JWT RS256 verificado, sin secreto ⇒ 503, planilla no compartida, plan idéntico al del navegador, Drive idempotente, accesos directos, entradas maliciosas, token reutilizado | 19/19 |
| `sh supabase/tests/correr.sh` | Postgres 16 real: migración dos veces, permisos, rollback total, carga con centavos exactos, ciclo obligatorio, stock por movimientos, idempotencia, sólo-agregar, RLS A/B, documentos clínicos, vínculo con Drive | 36/36 |

**No probado**: la cuenta de servicio y la planilla reales de Google (no hay credenciales), un proyecto Supabase real, Deno real (se probó con Node 22).

## 8. Revisión independiente (2026-10-22)

Un revisor independiente encontró 13 defectos; se corrigieron todos antes de publicar y se agregaron pruebas para cada uno: cuenta de servicio y planilla por comercio (antes las elegía el pedido), `digest()` fuera de `public` en Supabase, datos de salud visibles para mostrador/operador, lectura de Sheets dependiente del idioma, paginado y unicidad de `legajo_anterior`, `migra_aplicar` invocable con un plan escrito a mano, lote sin registrar cuando sólo había formularios, 0 explícito que inventaba una donación, guardado sin lugar informado como éxito, zip bomba, deshacer inexacto, claves de idempotencia que podían chocar y alertas falsas de «días sin cierre».

Pendiente (decisión, no defecto): los datos personales en la tabla `legajos` quedan protegidos por RLS pero **no cifrados de extremo a extremo**.
