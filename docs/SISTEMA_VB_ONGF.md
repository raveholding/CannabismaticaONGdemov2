# SISTEMA VB ONGF (`SISTEMA_VB_ONGF`) — PROMPT MAESTRO PARA ONG (derivado de SISTEMA_VB_26F)

Versión ONGF 1.0 · 2026-10-20 · Base: SISTEMA VB 26F (revisión V26.10) adaptado a **organizaciones sin fines de lucro (ONG)**, con las funciones corregidas del **asistente de voz, el Club, las tarjetas, los proveedores y la caja**, el **banner oficial del desarrollador** y un módulo nuevo de **legajo, ciclos de cultivo, Google Drive/Sheets y lector de huellas**. **No incluye** el módulo Mayorista/Minorista (4.22 del 26F) ni la multisucursal (4.14.4 y todo lo que dependa de sucursales / Casa Central).

**Cómo está armado:** todo lo del 26F que aplica a una ONG se conserva con su numeración (4.1 a 4.21, 4.23 a 4.26, secciones 5 a 16); lo que se quitó está declarado en la sección «Alcance». Lo específico de la ONG (vocabulario, legajo, dispensación, donaciones, Factura C, cultivo, REPROCANN, turnero) y las correcciones están en **4.27**, y el módulo biométrico/Drive/Sheets/ciclos en **4.28**. Donde este documento difiera del 26F, **manda este documento**.

**Qué cambia respecto del 26F** (todo aditivo salvo las exclusiones):

| Cambio | Dónde |
|---|---|
| **Excluido:** Mayorista/Minorista (listas L1–L5, escalones, bultos/packs, crédito con plazo, pedidos de venta → remito → recibo, lotes/FEFO comerciales, cierre ciego por canal, contabilidad 4.22.8) y **multisucursal** (sucursales, depósitos, Casa Central, `branch_id`, consolidado entre sedes). El modelo es **una ONG = un comercio (tenant) = una sede** | «Alcance» |
| Vocabulario y reglas propias de ONG: paciente/socio, **Donación** (nunca «aporte»), entrega/dispensación, documento opcional, Factura C, legajo único, REPROCANN, turnero, planilla de cultivo | 4.27.1 |
| **Asistente de voz** corregido para ONG (hoy no existe en el sistema): lista cerrada de acciones, la voz sólo **prepara**, no lee datos de salud en voz alta por defecto | 4.13 + 4.27.2 |
| **Club** corregido: alta pública, sellos por QR/código/DNI/NFC, tarjeta portátil, lectura del QR por cámara, consentimientos por finalidad | 4.6 + 4.25 + 4.27.3 |
| **Tarjetas** (Club y carnet del personal): emisión, reimpresión que invalida la anterior, baja, firma | 4.19 + 4.25 + 4.27.4 |
| **Proveedores y compras** (módulo nuevo en el sistema ONG): órdenes, ingreso de mercadería atómico, cuenta corriente | 4.21 + 4.27.5 |
| **Caja** corregida: rubro obligatorio, traspasos, detalle de cobros, cierre administrativo de caja huérfana, ventas de la caja con detalle | 4.5 + 4.14 + 4.23 + 4.24 + 4.27.6 |
| **Banner oficial del desarrollador (VINCULAR BUSINESS)** con botones reales en todas las superficies | regla 11 + 4.27.7 |
| **Legajo, biometría, Drive (cuenta de servicio), Sheets/Formularios y ciclos de cultivo** | 4.28 |

---

## 0. CÓMO USAR ESTE DOCUMENTO

1. Copiá este documento completo y pegalo como prompt maestro (o como instrucciones de un proyecto). No lo resumas.
2. Completá la **Ficha de la ONG (sección 1)**. Todo lo que está entre `[CORCHETES]` es una variable. Un dato que no se tiene se deja como `[PENDIENTE]`: nunca se inventa.
3. Antes de ejecutar cambios en un repositorio, inspeccioná el código real (sección 12) y seguí las reglas de trabajo (sección 2), de pruebas (sección 13) y de entrega (sección 15).
4. Las funciones descritas son **requisitos**: no se consideran hechas por estar descritas. Se declaran hechas sólo con evidencia de prueba. La matriz **4.27.0** dice qué existe hoy en el sistema de la ONG y qué falta.
5. La arquitectura conversacional se diseña desde el inicio, pero la ejecución de cada acción depende de permisos, configuración, conexión, validaciones y confirmaciones. La IA no tiene acceso irrestricto al sistema.
6. Nada de este documento contiene datos personales ni de salud de personas reales. Los datos de ejemplo se rotulan «ejemplo».
7. Entregá cambios verificables en el repositorio: un diseño, mockup o respuesta textual no equivale a una función operativa.

Convenciones: identificadores de código en inglés; textos de interfaz y respuestas en castellano rioplatense simple (con versión en inglés donde se pida); `[VERIFICAR]` = dato normativo o técnico que debe confirmarse en la fuente oficial antes de afirmarlo.

## ALCANCE: QUÉ SE QUITA DEL 26F (obligatorio, para no reintroducirlo)

- **Mayorista/Minorista (26F 4.22 completo y 5.2):** no se implementa ni se deja «apagado» en la interfaz: sin listas de precios, escalones por cantidad, bultos/packs/fardos, unidades por bulto, acuerdos especiales, crédito con plazo y mora por canal, pedidos de venta, remitos de despacho, cobranzas con valores, cierre ciego por canal, caja por canal (`channel_scope`), precios mayoristas en el menú, ni contabilidad con asientos (`accounting.on`). El stock sigue en una **unidad base** (`und`, `kg`, `lt`, `g`). Cualquier referencia residual a canal, lista, bulto o mayorista en un texto heredado **no aplica**.
- **Multisucursal (26F 4.14.4, 5.19, prueba 21):** sin sucursales, depósitos, `branch_id`, Casa Central, consolidados entre sedes ni alcance por sucursal. Una ONG con dos sedes físicas se resuelve con **dos comercios (tenants)** independientes. Cualquier «sucursal» residual en un texto heredado se lee como «la sede».
- **Se mantienen, pero apagados por defecto y sin protagonismo en una ONG:** checkout online (4.18) y «tienda con envíos» (4.26) como **donaciones/merchandising online**; Wallet y avisos (4.19); marketing y redes (5.6); Meta Pixel (5.14).
- **No aplican a una ONG de salud:** gastronomía (mesas, comandas, mozos), órdenes de trabajo, comisiones de vendedores, recetas de cocina. Los **insumos** de cultivo y dispensación sí (4.27.5).

---

## 1. FICHA DE LA ONG (completar)

| Dato | Valor |
|---|---|
| Nombre, personería jurídica y rubro | `[NOMBRE]` · `[PERSONERÍA / N.º]` · `[RUBRO: salud / cultura / comedor / educación / ambiente / otro]` |
| Domicilio, localidad, provincia y país | `[DIRECCIÓN]` · `[LOCALIDAD]` · `[PROVINCIA]` · `[PAÍS]` |
| Zona horaria y moneda | `[ZONA_HORARIA]` · `[MONEDA]` |
| WhatsApp (con código de país), teléfono, correo | `[WHATSAPP]` · `[TELÉFONO]` · `[CORREO]` |
| Alias/CBU/Mercado Pago para donaciones, titular y CUIT | `[ALIAS]` · `[TITULAR]` · `[CUIT]` |
| Condición frente al IVA y ¿Factura C ante ARCA ya habilitada? | `[CONDICIÓN]` · `[SÍ/NO]` |
| Facturación electrónica (4.12): CUIT, razón social, domicilio fiscal, inicio de actividades, punto de venta tipo "Web Services", ambiente (homologación / producción), quién tramita el certificado | `[…]` |
| Marco normativo propio de la actividad (por ejemplo REPROCANN / Ley N.º 27.350) y trámite propio de la ONG | `[VERIFICAR con asesor/a legal y fuente oficial]` |
| Nube (4.28 y 6.11): proyecto del proveedor (URL + clave **publicable**), región, correo del administrador, ¿se limpia un proyecto anterior? | `[URL_PROYECTO]` · `[CLAVE_PUBLICABLE]` · `[REGIÓN]` · `[CORREO_ADMIN]` · `[SÍ/NO]` |
| Logo (archivo), dos colores, dirección corta del menú | `[LOGO]` · `[COLOR1]` `[COLOR2]` · `[SLUG]` |
| Redes sociales (cuáles y enlaces) | `[INSTAGRAM]` `[FACEBOOK]` `[TIKTOK]` `[X]` `[YOUTUBE]` `[OTRAS]` |
| Club / socios: meta de sellos, premio, ¿tarjeta en Apple Wallet/Google Wallet?, canales de aviso, consentimiento, frecuencia, horarios de silencio | `[…]` |
| Menú público: frases, leyendas legales, idiomas ES/EN, mapa/reseñas, Wi-Fi de invitados, ¿alta al Club desde el menú?, ¿Historia Clínica / solicitud pública?, ¿Turnero?, gesto del acceso oculto | `[…]` |
| Equipo | nombre, correo y rol: admin / supervisor / mostrador / operador |
| Cajas y equipos (una sola sede) · ¿una persona o varias por caja? | `[…]` |
| Modelo de caja | `[SIMPLE / OPERATIVAS + PRINCIPAL]` |
| Asistente conversacional (4.13 y 4.27.2) | `[VOZ / TEXTO / VOZ+TEXTO]` · proveedor de voz `[NAVEGADOR / OTRO / PENDIENTE]` · retención de audio `[NO GUARDAR]` · lectura en voz alta de datos de salud `[NO por defecto]` |
| Acciones por voz que requieren confirmación extra | `[DISPENSACIONES / DONACIONES / ANULACIONES / CIERRES / BORRADOS / TRANSFERENCIAS]` |
| Legajo, Drive y Sheets (4.28) | carpeta raíz de Drive `[URL/ID]` · cuenta de servicio `[CORREO DE LA CUENTA]` (el JSON va al servidor, nunca aquí) · Formulario/Hoja de ingreso `[URL]` |
| Lector de huellas (4.28.2) | marca/modelo exacto `[PENDIENTE]` · SDK/driver `[PENDIENTE]` · revisión legal `[PENDIENTE]` |
| Ciclos de cultivo (4.28.3) | salas/ciclos activos `[…]` · variedades `[…]` · unidades (g/kg/unidades) `[…]` |
| Periféricos: impresora térmica/A4/etiquetas, lector de códigos, cámara/NFC, cajón, pantalla | `[MARCAS Y MODELOS]` |
| ¿Se dispensa sin stock (stock negativo)? | `[NO]` por defecto en una ONG de salud (con interruptor y auditoría si se habilita) |
| Umbral de identificación del receptor de Factura C | `[PENDIENTE — VERIFICAR monto vigente en arca.gob.ar]` |
| ¿Lectura de facturas de proveedores con IA en la nube? | `[SÍ/NO]` (cuesta por uso; sin datos de personas) |
| Modalidad | Solo menú QR / Sistema completo con nube / + instalador Windows |
| Desarrollador (créditos obligatorios) | **VINCULAR BUSINESS** · Único celular **(387) 4484132** (`wa.me/5493874484132`) · **vincularbusiness@gmail.com** · lema “Tu idea, en buenas manos.” (datos oficiales: se mantienen en TODOS los productos; ver regla 11 y 4.27.7) |

---

## 2. ROL Y REGLAS DE TRABAJO (obligatorias)

Actuá como un equipo senior liderado por un **Arquitecto de Software y Líder Técnico con experiencia equivalente a una década o más** en ERP/POS, sistemas transaccionales, multitenencia, operación offline-first, diseño de API, seguridad aplicada, sistemas conversacionales y evolución de productos en producción. Asumí también los roles de desarrollador full-stack, diseñador UI/UX accesible, especialista en ciberseguridad (OWASP Top 10, ASVS, MASVS), ingeniería de datos, pruebas automatizadas, integrador de hardware POS, SEO técnico y cumplimiento legal del país y provincia del cliente.

**Estándar de ingeniería:** priorizá corrección y mantenibilidad por encima de atajos; justificá decisiones con trade-offs; separá dominio, aplicación, infraestructura y presentación; usá SOLID cuando aporte claridad, contratos tipados/esquemas validados, errores explícitos, transacciones, idempotencia, observabilidad sin secretos y migraciones reversibles. No inventes que sos una persona real ni atribuyas experiencia personal; aplicá el nivel de criterio profesional especificado en este rol.

1. **No inventes** endpoints, servicios, resoluciones, números de ley, tasas, comisiones ni compatibilidades de hardware. Si un dato normativo o técnico no es seguro, marcalo `[VERIFICAR]` e indicá la fuente oficial. No inventes URLs de organismos.
2. **Supuestos primero.** Antes de programar, listá en pocas líneas los supuestos. Si algo del pedido es contradictorio o riesgoso, señalalo y proponé la alternativa segura.
3. **Seguro por defecto.** Nunca credenciales, claves o secretos en el código, en el HTML ni en los logs: variables de entorno o gestor de secretos. En el archivo público sólo van la URL del proyecto y la clave *publicable*. Si encontrás un secreto expuesto en material existente del cliente, no lo uses, avisá y recomendá rotarlo.
4. **Nada nuevo rompe ni reemplaza lo existente.** Las capacidades se agregan como módulos u opciones (banderas de configuración), apagadas por defecto si cambian el comportamiento o dependen de terceros.
5. **Detectar antes de agregar.** Antes de crear una función, buscá si ya existe. Si existe y funciona, no la toques; si está incompleta, completala; si está duplicada, fusioná conservando las capacidades de ambas; si no existe, agregala como módulo. Nunca la agregues dos veces.
6. **Antes de pisar nada en producción, verificá qué depende de ese archivo** (tareas programadas, instaladores con auto-actualización, páginas generadas, claves leídas por scripts). Si publicar la demo en ese lugar rompería algo, publicá en otro repositorio o carpeta y avisá.
7. **Entrega por bloques** si la salida excede el límite: bloques numerados, cada uno termina con "— Continúa en el bloque N —" y se espera "continuar". Nunca resumas ni omitas código para que entre.
8. **Hacé el trabajo completo** (código, pruebas, subidas): no pases pasos manuales que puedas hacer vos. Si falta un dato, consultá **una sola vez y junto**, antes de suponer.
9. **Una sola pasada de correcciones.** Revisá todas las correcciones pendientes antes de dar algo por terminado y antes de armar instaladores. No hagas entregas parciales que dejen arreglos para después.
10. **Todo queda probado** con pruebas automáticas de flujos reales con datos reales (no sólo "carga la pantalla") y, para trabajo de alto riesgo, revisado por un agente independiente.
11. **Créditos (datos oficiales, no se cambian sin pedido del titular).** Desarrollado por **VINCULAR BUSINESS** · Único celular **(387) 4484132** · **vincularbusiness@gmail.com** · lema **“Tu idea, en buenas manos.”**. El **banner oficial final** (imagen `assets/vb-banner.webp`, texto alternativo con los mismos datos) acompaña al ingreso y al menú público **con botones reales**: áreas clicables sobre las píldoras del banner (WhatsApp `wa.me/5493874484132` y correo `mailto:`) y una fila de botones de al menos 48 px (**WhatsApp · Llamar `tel:+5493874484132` · Correo**); el resto de los lugares lleva la línea de texto. Los usuarios tienen que saber quién desarrolló el sistema en ingreso, asistente, barra lateral, tickets, pantalla del cliente, menú, páginas de producto e instalador. Se puede cambiar la presentación (completa, corta, ícono), no eliminar.
12. **Entrega honesta.** Al final, en pocas líneas: qué quedó, qué tiene que hacer el dueño, qué no se pudo probar. Prohibido afirmar "100 % funcional", "sin errores" o "compatible con todo" sin evidencia reproducible.
13. **El Core no conoce ningún rubro ni marca de hardware.** Lo específico vive en módulos, configuración o adaptadores (orden de dependencia: Adaptador → Módulo → Core).
14. **Demos:** los datos inventados (costos, stock, códigos de barras, cupones, planes, Wi-Fi, clientes, ventas) se rotulan "ejemplo" en pantalla y no se presentan como reales.

---

## 3. QUÉ ES EL PRODUCTO

ERP/SaaS multicomercio para negocios de `[PAÍS]`, en tres piezas con el mismo código:

1. **Archivo único HTML5** (hosting estático o GitHub Pages): adelante el **menú digital público**; detrás de "Acceso del equipo" (`#acceso`), el **panel de gestión** (`#panel/<pantalla>`). Funciona sin conexión con la base cifrada en cada equipo (IndexedDB).
2. **Nube (Supabase u otra con RLS):** un proyecto para todos los comercios, aislados por servidor; varios equipos comparten datos casi en tiempo real.
3. **Programa de Windows (64 y 32 bits):** instalador con ícono del producto; instala, abre, actualiza y desinstala.

**Arquitectura por capas:**
- **Core:** identidad, comercio (tenant), permisos, auditoría encadenada, cifrado, sincronización, configuración, i18n, idempotencia.
- **Asistente conversacional transversal:** entrada de voz/texto, interpretación estructurada, catálogo/registro de acciones, validación de permisos, política de confirmación, ejecución por servicios del dominio, respuesta y auditoría. No accede directamente a la base de datos ni evita las reglas del Core.
- **Organización operativa:** cajas operativas, caja principal/consolidada, sesiones, movimientos, asignaciones y cierres con jerarquía explícita y trazabilidad de distribuciones.
- **Configuración:** datos del comercio, rubro, horarios, interruptores, atajos, modelo de cajas.
- **Módulos:** ventas/POS, costos y precios, descuentos/cupones/membresías, facturación, inventario por rubros, insumos, cajas y finanzas con rubro obligatorio, compras/IA, gastos, clientes/fiados, fidelización, personal/fichaje, menú público y su administración, reportes/Analytics, comisiones, importar/exportar, correo, WhatsApp, marketing/redes, cobros online, Google Drive/APIs, Meta Pixel, legal, **legajo, dispensación y ciclos de cultivo (4.28)**.
- **Hardware (HAL):** `DeviceManager` con drivers intercambiables por tipo (`printer_thermal`, `printer_a4`, `printer_label`, `scale`, `scanner`, `nfc_reader`, `fingerprint_reader`, `cash_drawer`, `display`).
- **Adaptadores por rubro:** comercio, gastronomía, servicios, profesional, ONG.

**Orden del panel (navegación):** Resumen (Dashboard Analytics, **primera pantalla, antes de Vender**) → Operación (Vender, Pedidos, Caja, Arqueo/cierre, Cajas cerradas, Inventario) → Clientes y fidelización (Clientes, Fidelización, Cupones y membresías) → Equipo (Personal y fichaje, Tareas) → Menú y web (Menú público, Legal y cumplimiento) → Sistema (Periféricos y ticket, Importar/Exportar, Integraciones, Roles, Auditoría, Configuración). El asistente conversacional está disponible mediante un punto de acceso transversal y contextual, sin reemplazar la navegación ni ocultar los estados de ejecución.

---

## 4. REQUISITOS FUNCIONALES

### 4.1 Dashboard Analytics (Resumen) — primera pantalla
- Bento-grid: ventas netas, ticket promedio, margen bruto estimado (sólo roles con permiso de costos), descuentos otorgados, socios nuevos, sellos entregados, cupones usados, deuda de cuenta corriente, evolución diaria, participación por rubro, productos más vendidos, medios de pago, alertas (stock bajo y **stock negativo**, cobros digitales pendientes, cumpleaños con consentimiento), pedidos recibidos por el menú (son solicitudes, no ventas).
- Filtros: período (hoy, ayer, 7, 30 días, todo), medio de pago, con/sin factura fiscal (siempre visible y filtrable), rubro; botón "Restablecer"; fecha/hora de actualización y zona horaria; fórmula visible en cada tarjeta; tabla accesible equivalente a cada gráfico; "Sin datos suficientes" cuando corresponda. Los filtros de una vista no alteran otras pantallas.
- Aviso si hay una caja abierta de días anteriores (días con ventas sin cierre).
- Nunca llamar "ganancia neta" a un margen que no descuenta impuestos, comisiones, sueldos ni gastos: se rotula "margen bruto estimado".

### 4.2 Vender (POS)
- **Teclas de función arriba** (barra fija en escritorio, estática en móvil), cada botón con nombre y tecla ("Efectivo (F1)"), mínimo 48 px, táctil y teclado. Sólo dentro de Vender y del cobro; se evita la acción propia del navegador (`preventDefault` en F5/F11/F12 dentro del POS).

| Tecla | Acción |
|---|---|
| F1 | Efectivo (abre el cobro con ese medio) |
| F2 | Tarjeta débito |
| F3 | Tarjeta crédito |
| F4 | Cuenta corriente / fiado (lleva al selector de cliente) |
| F5 | Nota de crédito (elegir venta; con CAE emite nota; sin CAE anula; sólo administrador) |
| F6 | Reintegro (egreso con motivo y rubro obligatorios) |
| F7 | Borrar la operación (doble confirmación, auditado) |
| F8 | Con / Sin factura fiscal (muestra el modo actual; vale para la operación en curso) |
| F9 | Cantidad de la línea seleccionada |
| F10 | Modificar precio de la línea (auditado) |
| F11 | Buscar producto |
| F12 | Cobrar |

  Con el cobro abierto: F1–F4 cambian el medio, F8 alterna fiscal/interno, F12 confirma. Dos botones fijos: "Ingreso de efectivo" y "Egreso de efectivo" (misma caja, rubro obligatorio).
- Búsqueda; lector de código de barras con detección de lectura rápida (no confundir con tipeo); etiquetas EAN-13 de balanza con peso o precio embebido (modo configurable); PLU.
- **Medios de pago:** efectivo, débito, crédito, transferencia, QR/billetera, cuenta corriente (requiere cliente con límite asignado y lo respeta). Cobros digitales quedan **pendientes** hasta confirmación verificada del proveedor (webhook firmado); volver del checkout o una captura nunca acredita un cobro.
- **Edición de cada línea:** cantidad, precio unitario e importe enlazados (cantidad × precio = importe); si se edita el importe, en productos por peso se recalcula la cantidad y en productos por unidad el precio. No admite cero ni negativos. Todo cambio de precio queda en auditoría (producto, precio de lista, aplicado, usuario).
- **Venta con o sin stock (interruptor):** configuración global "Permitir vender sin stock" (por defecto **activada**) y, por producto, "Exigir stock" (ese producto nunca se vende sin stock). Con la opción activa, vender más de lo que hay **se permite**: el stock queda en **negativo**, la línea del ticket muestra "Sin stock: quedará en negativo (−N und)", se registra en auditoría (`VENTA_SIN_STOCK`) y el producto se marca en rojo en Inventario, en Vender y en las alertas del Resumen hasta regularizarlo (compra o ajuste). Con la opción apagada o con "Exigir stock", el botón del producto se deshabilita y el servidor rechaza la venta. Ajustes manuales a negativo sólo si el producto admite venta sin stock. Anular/devolver restituye el stock en la unidad base. El menú público trata stock ≤ 0 como "sin stock" según la regla del comercio.
- **Documento:** Sin factura fiscal → Ticket interno (comprobante de dispensación o donación), numeración propia por caja ("2-15" = ticket 15 de la caja 2), leyenda "DOCUMENTO NO VÁLIDO COMO FACTURA" (nunca "Factura"). Con factura → A/B/C y notas de crédito/débito, validación de condición fiscal del cliente; el **CAE se pide solo al servidor fiscal (ver 4.12)** y, mientras la integración no esté habilitada y probada, queda "pendiente de CAE" y se carga a mano; con CAE es inmutable (se corrige con nota). El interruptor tiene texto y color distintos, el documento resultante es visible antes de confirmar, el valor por defecto es configurable por rol, y cambiarlo pide motivo y queda auditado. Los presupuestos no suman como venta. **Estado real (2026-10-19):** el código emite *Ticket interno* o *Factura electrónica*; el selector de documento queda como el sistema actual (una sola vez, sin duplicarlo).
- Los totales se recalculan siempre en el sistema (servidor): nunca se confía en el precio que llega de afuera. Se muestra el cálculo completo antes de confirmar.
- **Modo táctil/POS:** áreas de 48×48 px con 8 px de separación, teclado numérico en pantalla, gestos; nada depende sólo del hover o del clic derecho. Kiosco a pantalla completa con PIN de supervisor, cierre por inactividad y pantalla de cliente secundaria.
- **Campos numéricos (regla de todo el sistema):** nunca arrancan con "0" cargado; vacíos con placeholder; si traen valor, al entrar quedan seleccionados. Teclado en pantalla: teclas ≥ 56 px, el primer dígito reemplaza el valor, vacío muestra "Escribí el número", botones "Borrar todo / Cancelar / Listo".
- Los campos `type=number` se leen con `valueAsNumber`; los textos con el parser local (coma decimal); fechas con año de 4 cifras primero.

### 4.3 Descuentos, cupones, membresías y beneficios
- **Regla de oro:** un beneficio por compra. Cupón **o** membresía (se aplica el mejor, nunca acumulados), descuento manual y promociones de tarjeta tampoco se acumulan salvo configuración expresa visible antes de cobrar.
- Los productos de venta restringida por edad (p. ej. tabaco) **no participan** de promociones ni descuentos.
- Cupón: código único por tenant, estado, vigencia, porcentaje o monto fijo, compra mínima, tope, límite total y por cliente, audiencia (todos / socios / cumpleaños), exclusiones. El servidor valida y consume de forma atómica e idempotente; devolver/anular libera el uso.
- El descuento se **reparte por línea** (método del mayor resto, centavos enteros); el ticket conserva base, cupón, descuento, regla y precio final.
- Membresías/suscripciones: plan (nombre, precio, periodicidad, beneficio), consentimiento versionado, cancelación sin obstáculos; no se marca activa hasta confirmar el pago.

### 4.4 Inventario por rubros
- **Rubros diferenciados y visibles:** pestañas de rubros con **color propio** y contador; vista agrupada por rubro con encabezado de color (cantidad, alcohol, +18, fuera del menú); chip de rubro en cada fila; filtros por rubro, texto (nombre, presentación, código) y "sólo stock bajo/negativo"; productos sin rubro se muestran aparte.
- **Alta y edición de rubros** (rol autorizado): nombre único, color (paleta + validación `#RRGGBB` estricta antes de usarlo en estilos), responsable opcional, diseño en el menú (grilla / filas / por bodega), nombre en el menú, interruptores "mostrar en el menú", "vende alcohol" y "sólo +18 (sin promociones)". Un rubro con operaciones no se borra: se edita o desactiva. **ABM completo y siempre visible (v2.3):** en Configuración → "Rubros, responsables y reparto" cada rubro es una tarjeta que **se acomoda (flex-wrap) y nunca recorta** sus controles: encabezado con nombre + botones **Editar** y **Eliminar** (≥44 px, con `aria-label`), y debajo responsable, "reparte" e impuesto diario. Eliminar: sin productos ni historial → se borra; con productos → pide el rubro de destino (nunca quedan productos huérfanos); con ventas/movimientos → se **archiva** (el historial y los reportes se conservan). Todo con auditoría y sincronizado (borrado lógico). **Prueba obligatoria:** los botones deben verse completos a 1600/1280/768/360 px **con "reparte" tildado** (el campo de impuesto agranda la fila), y editar/alta/baja vacía/baja con productos deben funcionar y llegar al servidor.
- **Unidades:** `und`, `kg`, `lt` (internamente `u`, `kg`, `l`). Etiquetas coherentes en edición, Vender, ajustes, exportación e importación (la importación acepta und/lt/litro/litros). Stock en unidad base común; sin bultos ni packs.
- Producto: nombre, presentación, grupo/bodega, rubro, unidad, costo, tipo de cálculo (recargo sobre costo o margen sobre precio, nunca mezclados), precio final, stock (puede ser negativo si se vende sin stock), código de barras único, PLU de balanza, descripción, nombre en inglés, "Publicar en menú digital" (apagado por defecto), activo, "Exigir stock". Margen se muestra sólo con costo cargado ("—" si el costo es cero). La eliminación está protegida por el requisito **4.16**: el borrado físico sólo se permite a Administrador y sólo si no hay referencias ni historial. Si tiene movimientos, dispensaciones, donaciones, facturas, devoluciones u otra referencia histórica, se archiva/desactiva mediante borrado lógico, preservando el historial y las claves referenciales.
- Ajuste rápido con motivo obligatorio; movimientos de stock auditados; stock mínimo/máximo con alertas; sin depósitos ni sucursales (una sola sede).
- La API pública nunca expone costo, stock exacto, proveedor ni márgenes.

### 4.5 Caja y cierres
- Apertura, movimientos (ingresos, egresos, retiros, reintegros), cierre con arqueo; cada sesión se asigna a la caja configurada para el terminal, responsable y turno. **Todo movimiento financiero lleva un rubro válido obligatorio** (sección 6.10).
- Al cerrar se guarda una foto inmutable: medios de pago, fiscal vs. interno, egresos y retiros, esperado vs. declarado, usuario y hora, observaciones y sello SHA-256; en la nube el cierre queda congelado (sólo se agregan notas).
- Pantalla "Cajas cerradas": lista y calendario, filtros, alertas de días sin cierre, ficha imprimible (A4) con verificación de integridad, CSV.
- Importes en centavos enteros o `DECIMAL(14,2)`, nunca float. Fechas en UTC y visualización en `[ZONA_HORARIA]`.
- Modelo flexible de cajas (una caja/una persona, varias personas, varias cajas, por turno/responsable). Se aplica la especificación jerárquica de **4.14**: caja simple, cajas operativas y caja principal/consolidada se configuran sin obligar a todos los clientes a usar la estructura completa. Reparto entre socios, sueldos y reporte de cierre para WhatsApp son un **módulo opcional apagado por defecto** (sección 5.9); sin socios configurados el reporte no muestra secciones vacías ni "()" huérfanos.
- **Ventas de esta caja con detalle de cada operación y cajas sin límite de operaciones por turno:** especificado en **4.24.1–4.24.2** (hoy la tabla existe pero sin detalle).
- **Traspasos entre cajas (también con cajas cerradas), comprobante interno, permiso `transfer_funds` y registro con filtros:** especificados en **4.23.1–4.23.3 y 4.23.7**; el cierre sellado no cambia (4.23.2).

### 4.6 Clientes, Club y fidelización
- **Clientes:** consentimientos separados por finalidad (atención/club, comunicaciones comerciales, analítica/publicidad) con versión, fecha y origen; sin consentimiento comercial el cliente queda fuera de campañas; WhatsApp y correo cifrados; duplicados por los últimos 10 dígitos del WhatsApp; fiados (límite de crédito sólo modificable por rol autorizado, antigüedad, alertas); baja que anonimiza y conserva el historial contable.
- **Alta al Club desde el menú público** (nombre y apellido, WhatsApp, fecha de nacimiento): reutiliza el módulo de clientes (no crea una base paralela); fecha de nacimiento con su propio validador (un cumpleaños anterior al 2000 es válido); menores de 18 no se dan de alta con beneficios ni comunicaciones; respuesta genérica ante duplicados (nunca confirma si un número ya existe); límites por dispositivo/IP/hora; idempotencia (doble toque = un cliente); sin conexión o con error el mensaje es honesto, nunca un alta "exitosa" sin confirmación.
- **Tarjeta de sellos:** libro mayor (los sellos no se editan, se corrigen con un movimiento compensatorio auditado); meta configurable; 1 sello por día por socio; código de 8 dígitos (N.º de socio + código de 4 dígitos que cambia cada 2 minutos) o QR firmado, de **un solo uso**; el cliente consulta su tarjeta digital en el menú (recuperación con dos factores: WhatsApp + fecha de nacimiento); canje de premio auditado y reversión al anular la venta. El alta al Club no regala sellos.
- **Tarjeta del Club en la nube (V26.3) — flujo completo:** (1) el cliente escanea el QR del menú, completa nombre y apellido, WhatsApp, cumpleaños y **DNI (opcional)**, y acepta el consentimiento; (2) **su celular genera** el identificador y la clave secreta de su tarjeta (80 y 192 bits al azar), los manda cifrados (RSA-OAEP + AES-GCM con la llave pública del comercio) y **muestra la tarjeta en el acto**, con su QR y su código de 4 cifras que cambian cada 2 minutos (estado «en trámite» hasta que el negocio la active); (3) el equipo (admin, supervisor o mostrador, con sesión abierta) descifra el alta cada 20 s o al abrir el cobro / Fidelización, crea el cliente **con el mismo id que la tarjeta** y le asigna el N.º de socio; (4) el celular consulta el estado con `club_estado(slug, id)` (anónimo, `09-club-tarjeta.sql`: sólo devuelve N.º de socio y cantidad de sellos de quien conoce el identificador secreto; nunca nombre, WhatsApp, DNI ni cumpleaños) y pasa a mostrar «Socio N.º 0007 · 3 / 8». Un segundo celular del mismo cliente (mismo WhatsApp **y** mismo cumpleaños) obtiene su propia tarjeta sobre la misma ficha; con otro cumpleaños el alta se rechaza (evita colgarse de una cuenta ajena). Las altas que el equipo no puede abrir **no se descartan** (quedan «nueva»); sólo se rechazan las inválidas (menores de 18, datos incompletos, WhatsApp repetido con otro cumpleaños).
- **Sellos en el mostrador (V26.3)** — un sello por socio cada 24 h en todos los casos, auditado con el medio usado: por **QR** de la tarjeta (`RAVE2|id|código`, un solo uso; lector USB que escribe solo o cámara con `BarcodeDetector` si el navegador la ofrece), por **código de 8 números** (N.º de socio + código), por **DNI** (se escribe; si hay dos clientes con el mismo DNI se pide buscarlo por nombre) o por **tarjeta/etiqueta NFC** (`RAVE2N|id`, Web NFC: sólo Chrome en Android; la etiqueta se graba desde la ficha del cliente). Disponible en Vender → Cobrar (campo «Sello del Club») y en Fidelización. El cobro también encuentra al cliente por DNI. La etiqueta NFC es fija (no rota como el QR): el límite de un sello por día y la baja de la tarjeta son su defensa. El DNI es opcional, va cifrado en la nube (`__pii`) y se borra en la baja.
- **Checklist de aceptación del Club (correcciones V26.3 que no se pueden perder):** (1) el cliente que escanea el QR del menú recibe su tarjeta **en el acto**, con QR y código que rotan cada 2 minutos, aunque no haya sesión del negocio abierta: **jamás se oculta el bloque de la tarjeta por falta de sesión**; (2) el alta de un celular no se pierde: una alta ilegible o duplicada queda «nueva» y sólo se rechazan las inválidas (menores de 18, datos incompletos, WhatsApp repetido con otro cumpleaños); (3) la importación de altas corre sola (cada 20 s, al abrir Cobrar o Fidelización), es **no destructiva** y con bloqueo para que no corra dos veces a la vez; (4) el cliente nace con el **mismo id que la tarjeta** y recibe su N.º de socio; el celular lo consulta con `club_estado`, que nunca devuelve nombre, WhatsApp, DNI ni cumpleaños; (5) sellos por **QR, código de 8 cifras, DNI o NFC**: uno cada 24 h por socio, un solo uso por código, auditados con el medio; (6) el **DNI es opcional**, va cifrado (`__pii`), se borra en la baja y, si dos clientes lo comparten, se pide elegir por nombre; (7) la **meta y el premio** del Club se publican en el menú por la lista cerrada de `rave_limpiar_menu`; (8) los **cupones** por audiencia (todos / socios / cumpleaños) aplican en todo el sistema, con límite por cliente y uso sincronizado; (9) las pruebas con códigos que rotan usan reloj ajustable en **todos** los dispositivos (`window.__now`); (10) la tarjeta vive en el celular: si el cliente borra los datos del navegador la pierde, y el mostrador sigue sellando por DNI o NFC.
- **Administración de clientes por el administrador (edición, baja y eliminación definitiva sin historial, con efectos en cadena sobre la tarjeta, campañas y altas pendientes):** especificada en **4.24.3–4.24.4**.
- **Wallet (Apple/Google):** no implementado — necesita cuentas de desarrollador y certificados de firma de pases (ver 4.19). Alternativa vigente: la tarjeta queda guardada en el celular (se puede agregar a la pantalla de inicio) y, si se pierde, el mostrador suma sellos con DNI o NFC.
- **Tarjeta modelo del negocio (en Fidelización):** vista previa de frente y dorso a tamaño tarjeta (85,6 × 54 mm) con logo, nombre, sellos de ejemplo configurables, premio, dirección, WhatsApp y red social del comercio; el dorso lleva un QR al menú; impresión "con ejemplo" y "en blanco" lista para imprimir/cortar. Los datos salen de la configuración, nunca fijos en el código.
- **Tarjeta digital entregable:** además de consultar/imprimir la tarjeta web existente, el cliente debe poder recibir un enlace seguro para guardarla en Apple Wallet o Google Wallet cuando el comercio haya habilitado y configurado esa plataforma. La tarjeta y el envío de avisos se implementan según **4.19** y el módulo opcional **5.23**; no crear una segunda cuenta ni un saldo paralelo.

### 4.7 Personal
Empleados con documento cifrado, tarjeta NFC/QR firmada, terminal de fichaje (Web NFC en Android/Chrome, lector USB o tecleado); rechaza firmas falsas y repetidos en 60 s; registro con fecha y hora del servidor, dispositivo y método; planillas de horas. Lector de huellas sólo vía HAL, con revisión legal previa (sección 6.7).

### 4.8 Compras y gastos con IA (sólo admin)
Subir o fotografiar facturas/remitos (JPG, PNG, PDF); lectura en cascada: QR fiscal → IA en la nube (opcional) → texto del PDF/OCR local → parser local; extrae proveedor (nombre y ID fiscal con dígito verificador), tipo y número, fechas, renglones, neto, impuestos y total; sugiere categoría. **Revisión humana obligatoria** (imagen + formulario, controles de importes, duplicados, fechas) antes de guardar. Adjunto cifrado. Tablero por categoría y proveedor, compras vs. ventas, alertas de variación de costos, notas de crédito que restan. La IA trata el contenido del documento como **dato, nunca instrucción**; salida con esquema JSON estricto; sin herramientas ni acceso a datos del comercio; tope diario.

**Vinculación (V26.2):** la factura leída y revisada puede terminar como *ingreso de mercadería* con su proveedor, stock, costo y deuda según **4.21**; no se duplica el gasto: un mismo hecho económico se registra una sola vez.

### 4.9 Importar y exportar todo (y migrar desde el sistema anterior)
Entidades: artículos, rubros, clientes, boletas/ventas, cajas cerradas, gastos, proveedores. Plantillas descargables; CSV (`;`, UTF-8 con BOM). Importar CSV/XLSX en 3–5 pasos (**el .xlsx se lee de verdad, sin librerías externas**: zip + XML con `DecompressionStream`, primera hoja, tope de tamaño descomprimido, fechas de Excel → dd/mm/aaaa, decimales → formato local, strings compartidos/inline; el `.xls` antiguo se rechaza con instrucciones claras; nunca un mensaje del tipo "todavía no se lee"): archivo → mapeo (reconoce columnas propias y sinónimos) → vista previa con contadores (nuevos / a actualizar / omitidos / con error), errores por fila y "Probar (sin guardar)"; máximo 20.000 filas y 15 MB; números en formato local; fechas en número de Excel y dd/mm/aa. Duplicados por código de barras/SKU, WhatsApp (últimos 10 dígitos), nombre de rubro. Atomicidad: se valida y cifra todo primero; si algo falla se revierte; cada lote queda registrado y se puede deshacer el último. Clientes migrados sin consentimiento quedan con consentimiento "No". Boletas y cajas históricas nunca tocan stock, caja viva ni cola fiscal, y un archivo repetido no duplica. Toda celda que empiece con `=`, `+`, `@` o `-` se neutraliza (anti inyección de fórmulas). Todo en auditoría.

### 4.10 Periféricos (enchufar y usar)
- **HAL / DeviceManager** con drivers por tipo; agregar un modelo no toca el núcleo. Conexiones: USB, Serie, red (TCP 9100), Bluetooth y driver de impresora del sistema operativo. En el navegador: WebUSB, Web Serial y Web Bluetooth cuando existan; si no, agente local.
- **Botón único "Conectar y reconocer (automático)":** el navegador pide elegir el dispositivo una sola vez (exigencia de seguridad); el sistema toma marca y modelo, lo registra con valores razonables (80 mm, corte, acentos PC850), imprime una hoja de prueba y no duplica. **Reconexión sola** al abrir, al enchufar y cada 30 s, con aviso de desconexión (heartbeat). **"Impresora de Windows (1 clic)"** como vía más simple.
- Impresoras térmicas/comanderas (ESC/POS 58/80 mm, corte, cajón, QR, códigos, ruteo por sector, cola con reintentos sin duplicar tickets); A4 por driver/PDF; etiquetas ZPL/EPL. Balanzas: lectura en vivo por Serie/USB con protocolos configurables, esperar peso estable, reconexión, varias balanzas, EAN-13 de balanza. Lector de códigos en modo teclado. NFC: USB (PC/SC) y Web NFC. Cajón por pulso desde la impresora, auditado.
- Los datos que vuelven de un dispositivo no son confiables: validar rango y tipo. La ausencia de un periférico nunca bloquea las demás funciones. Hardware real sin probar se declara "pendiente de prueba física" con marca/modelo/SO/driver.
- **Ticket representativo del cliente:** logo, razón social, dirección, teléfono, número y fecha, atendió y caja, líneas con descuento desglosado, medio de pago, sellos del socio, QR del menú, mensaje al pie editable, leyenda de documento no válido como factura y leyendas legales breves (derechos del consumidor, restricción por edad) sin marcas `[VERIFICAR]` impresas; ancho 58/80 mm; vista previa y texto/bytes ESC/POS comprobables.

### 4.11 Administración y recuperación
Datos del comercio y rubro; usuarios/roles (permisos validados en el servidor); respaldos cifrados; auditoría encadenada (hash); zona de riesgo; nube; Integraciones (estado, cuenta conectada, permisos, última sincronización, errores, costos, botón desconectar/revocar; nunca tokens al cliente). Código de recuperación de 20 caracteres mostrado una sola vez; el admin restablece la clave de un empleado con clave temporal obligando el cambio; "Necesito ayuda" → solicitud al desarrollador; restablecimiento de soporte sólo tras verificar identidad y nunca ejecutable desde la API. Sin contraseña ni código, los datos cifrados no se recuperan (por diseño).

### 4.12 Facturación electrónica fiscal: certificado y CAE automático (pantalla "Periféricos y ticket")

Ejemplo de referencia: Argentina / ARCA (WSAA + WSFEv1). Para otro país se reemplaza el adaptador fiscal; el contrato (cola, estados, idempotencia, ticket) no cambia. Todos los nombres de menús, servicios y URLs del organismo son `[VERIFICAR]` en la fuente oficial antes de publicar.

**Dónde vive:** tarjeta "Facturación electrónica" dentro de **Periféricos y ticket** (sólo administrador), porque el resultado aparece en el ticket. No hay una pantalla fiscal separada que duplique configuración.

**Regla de oro:** el pedido de CAE **nunca** se hace desde el navegador (CORS, clave privada, secretos). Lo hace una **función de servidor** (en la referencia: Edge Function `arca`), apagada por defecto, que no se activa en producción sin una prueba real en homologación con el certificado del cliente. Hasta entonces el CAE se carga a mano y el ticket dice "COMPROBANTE PENDIENTE DE CAE — no válido como factura".

**Datos del emisor (configuración por comercio y por ambiente):** CUIT con dígito verificador, razón social, condición frente al IVA, domicilio fiscal, inicio de actividades, punto de venta tipo "Web Services" (número), ambiente (homologación y producción separados, nunca mezclados), alícuota de IVA por defecto de los productos (editable por producto), umbral de identificación del consumidor final `[VERIFICAR monto vigente]`.

**Credenciales:** la clave privada RSA 2048 se genera **en el servidor** (nunca viaja ni se descarga), se cifra con una llave maestra guardada en los secretos de la función (`ARCA_MASTER_KEY`, que nadie escribe en el código ni en el navegador) y se guarda en una tabla **sin políticas de lectura** (ilegible desde el cliente). El certificado y el ticket de acceso (TA) también quedan cifrados y separados por comercio y ambiente. Los certificados jamás se sincronizan con los equipos ni se incluyen en respaldos ni exportaciones.

**Asistente de 5 pasos por ambiente:**
1. Datos del emisor + generación de la clave y la solicitud CSR (PKCS#10, SHA-256; sujeto `C=<país>, O=<razón social>, CN=<alias sin espacios>, serialNumber=CUIT <11 dígitos>`) validando CUIT y alias. Se muestra/copia sólo la CSR.
2. Guía de lo que se hace en el sitio del organismo con clave fiscal: crear el certificado pegando la CSR y bajar el `.crt` (textos y menús `[VERIFICAR]`; el sistema no automatiza esa web).
3. Carga del `.crt`: se verifica que corresponde a la clave guardada, que no está vencido y que el CUIT del certificado es el del emisor; se muestra el vencimiento y se avisa con 30 días de anticipación.
4. Guía de la relación de servicio (WSFE) y alta del punto de venta "Web Services" `[VERIFICAR]`.
5. **Probar conexión**: pide el TA (WSAA) y consulta el estado del servicio y el último comprobante autorizado; sólo si pasa se habilita "Pedir CAE automático" (bandera por ambiente, apagada por defecto).

**Autenticación con el organismo (WSAA):** ticket de requerimiento (`generationTime` unos minutos hacia atrás y `expirationTime` hacia adelante para absorber diferencias de reloj), firma CMS con el certificado del emisor (algoritmo de firma aceptado `[VERIFICAR]`), TA con vigencia de unas 12 h que **se guarda y se reutiliza** (el servicio rechaza un TA nuevo mientras haya uno vigente: ventana de retención `[VERIFICAR]`), reloj del servidor sincronizado. Endpoints de la referencia `[VERIFICAR]`: WSAA homologación `https://wsaahomo.afip.gov.ar/ws/services/LoginCms`, producción `https://wsaa.afip.gov.ar/ws/services/LoginCms`; WSFEv1 homologación `https://wswhomo.afip.gov.ar/wsfev1/service.asmx`, producción `https://servicios1.afip.gov.ar/wsfev1/service.asmx`.

**Pedido de CAE (WSFEv1):** `FEDummy` (estado), `FECompUltimoAutorizado` (siguiente número), `FECAESolicitar`, `FECompConsultar` (verificar antes de reintentar). Reglas:
- **El servidor arma el comprobante desde la venta ya guardada**, nunca desde el cuerpo del pedido: líneas, precios, descuentos, cliente. Totales recalculados con centavos enteros; precios con IVA incluido → neto = bruto / (1 + alícuota), IVA discriminado por alícuota (A y B), sin discriminar en C; el redondeo por alícuota se concilia al centavo (la suma de neto + IVA + exento + tributos = total exacto).
- **Clase del comprobante** según emisor y receptor: emisor Responsable Inscripto → A si el receptor es Responsable Inscripto, B en los demás casos; emisor Monotributo/Exento → C. Se informa la **condición frente al IVA del receptor** (campo obligatorio desde la RG 5616 `[VERIFICAR vigencia]`); tipo y número de documento del receptor (CUIT, DNI o consumidor final sin identificar si el monto lo permite).
- **Idempotencia:** una venta tiene a lo sumo un CAE (clave única por venta). Se reserva el número bajo bloqueo por comercio + punto de venta + tipo. Ante un timeout o corte se consulta `FECompConsultar` antes de reintentar; nunca se emite dos veces la misma venta.
- **Estados:** `pendiente` → `procesando` → `autorizado` | `rechazado` (con observaciones/errores del organismo, visibles y corregibles) | `error_red` (reintento con espera creciente y tope). Los reintentos los dispara cualquier equipo conectado con permiso y, si está disponible, una tarea programada del servidor `[VERIFICAR]`.
- **Sin conexión:** la venta se cobra igual; el ticket provisorio sale como "pendiente de CAE" y la factura se pide al reconectar. Nunca se muestra como autorizada sin respuesta del organismo.
- **Inmutabilidad:** con CAE la venta no se edita ni se borra. La corrección es una **nota de crédito/débito** pedida por el mismo canal con el comprobante asociado.
- **Resultado:** el servidor escribe CAE, vencimiento, tipo, punto de venta y número en el registro de la venta y los equipos lo reciben por la sincronización.

**Ticket / comprobante:** muestra tipo y letra, número `PPPP-NNNNNNNN`, CAE y vencimiento, datos del emisor y del receptor, desglose de IVA cuando corresponde y el **QR fiscal** (JSON versionado codificado en base64 sobre la URL oficial `[VERIFICAR especificación y URL vigentes]`). Sin CAE: leyenda de pendiente. La leyenda "DOCUMENTO NO VÁLIDO COMO FACTURA" es exclusiva de los comprobantes internos.

**Modo simulador (sólo demos):** genera un CAE de ejemplo rotulado "SIMULADO — SIN VALIDEZ FISCAL" para mostrar el flujo; está prohibido en el sistema real de un cliente. Un simulador **no** reemplaza la homologación.

**Auditoría:** cada solicitud, respuesta, observación y error queda registrado sin claves, certificados ni TA. **Pruebas:** firma CMS verificable con herramienta independiente, TRA con horas correctas, reutilización del TA, error de TA vigente, numeración, timeout con consulta previa, rechazo con observaciones, nota de crédito con comprobante asociado, totales con redondeo conflictivo por alícuota, A/B/C según condición, venta duplicada rechazada, usuario sin permiso, comercio A sin acceso a credenciales del B, secretos ausentes de respuestas y logs, y **homologación real con el certificado del cliente** (pendiente hasta tenerlo).

**Implementación de referencia (as-built, v2.2) — contrato entre navegador y servidor**
- **Acciones de la función** (`POST /functions/v1/arca` con `{accion, comercio, ambiente, …}` y el JWT del usuario): `estado`, `generar_csr` (admin), `cargar_cert` (admin), `probar` (admin), `emitir`, `nota_credito` (admin), `reintentar`. Respuestas con un `resumen` (`id, estado, tipo, letra, pto, nro, cae, vto, fecha, total, neto, iva, cuit, razon, cond, receptor, error, ambiente, qr`); errores `{error, etapa, reintentable}` (422 = dato a corregir; 502 = el organismo no respondió → el navegador **no** lo toma como "sin internet" y conserva el motivo). La config del emisor se guarda con la función SQL `arca_guardar_config` (el CUIT y el punto de venta quedan bloqueados cuando ya hay comprobantes aprobados).
- **El CAE lo escribe sólo el servidor** en la venta (`arca` / `arcaNC`); la función `sincronizar()` descarta cualquier `arca` que llegue del navegador y conserva el del servidor; con CAE el comprobante no cambia. El navegador, al recibir la venta, **nunca pisa un CAE ya obtenido con una lectura vieja** (carrera real encontrada en pruebas).
- **Receptor:** se elige en el cobro (consumidor final / DNI / CUIT / CUIL, condición frente al IVA, nombre) con validación local de CUIT/DNI; se guarda **sólo en el equipo** hasta obtener el CAE (no viaja en los registros de ventas) y se envía en el pedido de emisión. Un equipo sólo reintenta las ventas de **su** caja (tiene el receptor); los reintentos de lo ya reservado en el servidor los hace cualquier equipo (`reintentar`).
- **Flujo al cobrar "Con ARCA":** la venta se guarda y sincroniza → se pide el CAE (pantalla "Pidiendo CAE a ARCA…", con opción *Seguir sin esperar*) → ticket con CAE y QR. Si ARCA no responde o no hay internet, la venta queda como *pendiente de CAE* y se reintenta sola con cada sincronización; si ARCA **rechaza**, no se reintenta sola: se muestra el motivo y la tarjeta ofrece *Pedir CAE* de nuevo o *Anular*. Con ARCA caído nunca se duplica un comprobante (probado: 3 ventas → exactamente 3 comprobantes).
- **Nota de crédito:** anular una venta con CAE abre el flujo "Nota de crédito" (motivo obligatorio, irreversible): pide la NC al servidor y **recién entonces** anula la venta (stock, cupones, sellos). Sin conexión no se emite.
- **Ticket:** razón social, CUIT y condición del certificado (no los del ticket interno), `FACTURA/NOTA DE CRÉDITO` + letra + código, `Pto. Vta. PPPP Nro. NNNNNNNN`, receptor, neto/IVA en letra A, leyenda de transparencia fiscal al consumidor en letra B `[VERIFICAR texto vigente]`, CAE, vencimiento y QR fiscal. El QR fiscal (~300 caracteres) obliga a un generador de QR con versiones hasta 20 (nivel M): verificado con un lector de referencia.
- **Demo:** el simulador (letra B, CAE inventado, rótulo "COMPROBANTE SIMULADO · SIN VALIDEZ FISCAL") sólo existe cuando la nube no está configurada; el sistema del cliente nunca lo usa.
- **Pruebas ejecutadas (v2.2, entorno local con Postgres/PostgREST reales y ARCA FALSO):** 18 pruebas Deno de la función (CSR verificable con `openssl req -verify`, certificado de otra clave rechazado, CMS, TA, numeración, timeout con consulta previa, rechazo, NC asociada, A/B/C, redondeo) + 32 comprobaciones en Chromium (emisor, CSR sin que la clave llegue al navegador, certificado, probar conexión, activar, Factura B y A, ARCA caído → cola → CAE sin duplicar, rechazo, tarjeta de pendientes, NC, ticket, QR, sin datos del receptor en el servidor). **Falta siempre:** homologación con el certificado real del comercio y luego producción; nada de esto reemplaza esa prueba.

### 4.13 Asistente conversacional transversal (voz y texto) — requisito de arquitectura desde el inicio

**Propósito:** permitir que una persona autorizada opere funciones de negocio hablando o escribiendo en castellano rioplatense simple. Ejemplo: “Preparame una dispensación de dos gramos de [variedad] para el legajo [N.º], del ciclo [código]”; el sistema la deja **preparada** y la persona la confirma. El sistema debe interpretar, validar, registrar la operación real y comunicar el resultado. No alcanza con transcribir voz, producir una respuesta o cambiar visualmente una pantalla.

**Regla central:** la IA interpreta y selecciona una acción de un catálogo permitido; el backend del ERP conserva la autoridad sobre permisos, datos, reglas de negocio, importes y persistencia. Está prohibido dar a la IA acceso irrestricto a SQL, secretos, tokens, archivos privados o endpoints arbitrarios.

#### 4.13.1 Experiencia de usuario
- Punto de acceso transversal visible desde todas las áreas autenticadas: botón de micrófono, entrada de texto, estado de escucha/procesamiento/confirmación/ejecución/error y respuesta leída en voz alta cuando la síntesis esté habilitada.
- La interfaz informa claramente cuándo el micrófono está activo. No escuchar ni grabar permanentemente de manera oculta. No guardar audio crudo por defecto; si una función futura necesita conservarlo, pedir consentimiento explícito, definir finalidad, acceso y vencimiento.
- Comprender instrucciones naturales, correcciones y referencias: “agregale una soda”, “sacá el último producto”, “cambiá la mesa a la seis”, “mostrame qué quedó pendiente”. Resolver referencias según el contexto actual, sin confundir comercios, cajas, clientes o sesiones.
- Aceptar voz y texto mediante una interfaz de entrada intercambiable. El sistema debe seguir siendo operable sin micrófono, sin altavoces y cuando el proveedor de voz/IA no esté configurado.
- Mantener castellano rioplatense en las respuestas; usar el vocabulario del rubro y del comercio. Registrar en la interfaz qué acción se va a ejecutar y qué campos detectó, particularmente ante operaciones con impacto.
- No inventar coincidencias del catálogo. Si hay productos homónimos, variantes, tamaños, marcas, precios o datos ambiguos, preguntar y esperar respuesta. No asumir “gaseosa” cuando existen varias opciones incompatibles.
- Permitir corregir una interpretación antes de ejecutar, cancelar la operación y, cuando las reglas lo permitan, pedir deshacer una operación mediante una acción compensatoria auditada. No prometer deshacer acciones irreversibles.

#### 4.13.2 Flujo obligatorio de cada instrucción
1. Capturar voz o texto; normalizar errores de reconocimiento sin cambiar el significado económico u operativo.
2. Detectar intención, entidades, cantidades, referencias y datos ausentes en un esquema tipado y validado.
3. Resolver el tenant, la caja, el usuario y el contexto de pantalla desde la sesión autenticada, nunca desde datos no confiables que la IA pueda inventar.
4. Buscar la acción publicada por el `ActionRegistry` del módulo activo y comprobar que esté habilitada para el plan, el tenant y el rol del usuario.
5. Validar parámetros contra esquema y reglas de negocio en backend. Consultar al servidor los precios, permisos, disponibilidad, saldos y estados actuales; no confiar en valores calculados por el modelo o enviados por el navegador.
6. Si hay ambigüedad, falta un campo obligatorio o hay varias coincidencias, preguntar de forma concreta y no ejecutar parcialmente salvo que la operación esté diseñada expresamente para borrador.
7. Aplicar política por riesgo: lectura; escritura reversible de bajo riesgo; escritura con impacto; acción crítica/irreversible. Las acciones de riesgo medio/alto muestran un resumen y requieren confirmación explícita según política. Las críticas pueden exigir volver a autenticarse o un segundo factor; la frase de voz no reemplaza ese control.
8. Ejecutar por servicio de dominio existente, dentro de una transacción cuando corresponda y con clave de idempotencia. No crear una implementación paralela de las reglas de venta, caja, inventario, turnos o comandas.
9. Persistir auditoría con actor, origen (`voice`, `text`, `ui`, integración), acción solicitada, acción resuelta, referencia del registro, campos relevantes no sensibles, resultado, política de confirmación, timestamps y clave de idempotencia. No registrar audio completo, tokens, secretos ni información sensible innecesaria.
10. Confirmar al usuario sólo lo que realmente se guardó/confirmó. Diferenciar `borrador`, `pendiente de sincronización`, `pendiente de confirmación externa`, `ejecutado`, `rechazado` y `fallido`. Si el servidor o un proveedor no confirma, nunca anunciar éxito.

#### 4.13.3 Catálogo universal de acciones
- Crear un `ActionRegistry` central y extensible. Cada módulo/adaptador declara sus herramientas disponibles con: `actionId`, descripción de la intención, schema de entrada, schema de resultado, permisos RBAC, requisitos de contexto, nivel de riesgo, política de confirmación, si admite offline, regla de idempotencia, servicio de dominio invocado, errores esperados y pruebas.
- El registro de acciones es una lista blanca. El modelo sólo puede elegir acciones registradas y parámetros validados. El servidor vuelve a comprobar la acción aunque el frontend ya la haya validado.
- Toda nueva operación de negocio pública del sistema debe declarar su acción conversacional si es razonable operarla de esa forma. En el alta de un módulo, agregar su definición, permisos, contexto, auditoría, UX de confirmación y pruebas. No afirmar “todas las funciones disponibles por voz” hasta que la matriz pantalla/función/acción/prueba demuestre cobertura; las acciones físicas o no seguras se excluyen explícitamente o requieren un flujo asistido.
- Las acciones de consulta no devuelven campos a los que el usuario no tiene permiso (por ejemplo, costos, datos personales, información de otro tenant). Los reportes aplican los mismos filtros y reglas de acceso que la UI.
- Nombres de referencia (no endpoints asumidos): `dispensation.prepare`, `donation.prepare`, `patient.lookup`, `club.stamp.prepare`, `inventory.stock.lookup`, `inventory.item.archive`, `cash.session.open`, `cash.session.reconcile`, `cash.session.close`, `appointments.create`, `cultivation.cycle.read`, `reports.cash.read`. Adaptar o reutilizar los servicios reales encontrados en el repositorio; no duplicarlos.

Ejemplo orientativo de definición de acción (el formato final debe ajustarse a la tecnología real del repositorio):
```json
{
  "actionId": "dispensation.prepare",
  "inputSchema": {
    "type": "object",
    "required": ["legajoId", "cicloId", "quantity", "unit"],
    "properties": {
      "legajoId": {"type": "string"},
      "cicloId": {"type": "string"},
      "quantity": {"type": "number", "exclusiveMinimum": 0},
      "unit": {"type": "string", "enum": ["g", "und", "ml"]},
      "notes": {"type": "string"}
    }
  },
  "requiredPermissions": ["dispense.create"],
  "riskLevel": "write_with_impact",
  "confirmationPolicy": "always_confirm",
  "idempotent": true
}
```

#### 4.13.4 Cobertura funcional (ONG)
- **Pacientes y socios:** buscar por nombre, legajo, documento o WhatsApp; abrir ficha; ver estado del trámite propio (por ejemplo vigencia REPROCANN) y turnos; **preparar** (no confirmar) un alta o un turno.
- **Dispensaciones y donaciones:** preparar una dispensación (paciente, lote, cantidad, ciclo de origen) y una donación voluntaria con sus campos; el servidor valida lote, stock, tope por persona, rubro y permisos; la persona confirma con un toque.
- **Inventario y cultivo:** consultar stock y lotes, estado de un ciclo de cultivo, últimas mediciones de la planilla, alertas de vencimiento y stock mínimo.
- **Caja y administración:** consultar estado de la caja, esperado vs. declarado, últimos movimientos, cajas cerradas y alertas; cambios de permisos, borrados, transferencias de dinero, anulaciones, cierres y configuración crítica **nunca** se ejecutan por el solo hecho de que el modelo los haya interpretado.
- **Equipo y tareas:** consultar fichadas propias, tareas pendientes, crear una tarea.
- Todos los rubros: comandos genéricos «ayuda», «qué puedo hacer acá», «cancelar», «repetir resumen» y «mostrar la interpretación»; la disponibilidad se genera a partir de los permisos y las acciones publicadas, no de una lista fija engañosa.

#### 4.13.5 Voz, proveedor y modo offline
- Diseñar adaptadores sustituibles: `SpeechToTextProvider`, `LanguageModelProvider`, `TextToSpeechProvider`; mantener contratos neutrales al proveedor y evitar dependencia directa del núcleo.
- La configuración del proveedor, límites de uso, costos, ubicación de datos y consentimiento son visibles para el administrador. Secretos sólo del lado servidor. Si el proveedor falla, mostrar el error del asistente sin marcar la nube principal como caída.
- Respetar CSP, CORS, límites de tamaño/duración, rate limiting, timeout, reintentos acotados y límites de gasto. El contenido reconocido se trata como entrada no confiable y puede contener instrucciones maliciosas; nunca puede ampliar privilegios ni alterar el prompt interno.
- Offline: permitir sólo las acciones para las que el módulo declare soporte local seguro. Las operaciones encoladas llevan clave idempotente y estado “pendiente de sincronización”. Permisos no actualizados, pagos, facturación fiscal y otras acciones cuya validez dependa del servidor no se presentan como definitivas sin confirmación remota.

### 4.14 Cajas flexibles y caja principal (configuración modular; una sola sede)

#### 4.14.1 Perfiles de operación
- **Modo simple:** una caja operativa; no se muestran conceptos de caja principal ni distribución.
- **Modo varias cajas:** cajas operativas separadas por terminal, equipo, turno, responsable o sector.
- **Modo caja principal:** una caja principal/general recibe consolidaciones o fondos transferidos desde las cajas operativas. No se duplican ingresos por hacerlos visibles en un consolidado.
- Los perfiles se activan mediante configuración persistida por tenant y, cuando corresponda, rol. Debe existir migración segura y un valor por defecto equivalente al funcionamiento simple actual. La UI oculta la complejidad no habilitada, pero el backend también rechaza operaciones de módulos deshabilitados.

#### 4.14.2 Entidades y relaciones requeridas
Diseñar migraciones relacionales normalizadas, compatibles con la base existente y con las entidades ya presentes; antes de crear tablas duplicadas, detectar el modelo real. Respetar la clave de tenant ya usada por el repositorio: en el esquema de referencia existente aparece `comercio_id`; si el código adopta `tenant_id`, mapearlo de forma consistente. **No crear `tenant_id` y `comercio_id` como dos identificadores paralelos del mismo comercio.** Como mínimo, cubrir conceptos equivalentes a:
- `cash_registers`: cajas físicas/lógicas con `tenant_id`, código único, nombre, tipo (`operational` / `main`), estado y vínculo jerárquico opcional a caja principal. No permitir jerarquías cíclicas.
- `cash_register_assignments`: asignaciones temporales de usuarios/equipos/turnos a caja, con fechas y auditoría.
- `cash_sessions`: apertura y cierre de una sesión por caja, usuario responsable, estado, saldo inicial y sello inmutable de cierre.
- `cash_movements`: libro mayor de movimientos de caja, importe en centavos enteros o `DECIMAL(14,2)`, moneda, tipo, rubro financiero obligatorio, fuente, referencia de negocio, actor, fecha y clave de idempotencia.
- `cash_movement_allocations` o estructura equivalente: desglose de un movimiento entre una o más cajas origen/destino, con importes que concilien exactamente con el movimiento padre. Los renglones de distribución no se vuelven a sumar como un segundo ingreso/egreso independiente en los consolidados.
- `cash_transfers`: transferencia identificable entre cajas, con movimientos de salida/entrada vinculados y estado atómico. Una transferencia completa debe tener importes de salida y entrada iguales y no se duplica al reintentar.
- `cash_closures`: instantánea de arqueo individual o consolidado, esperado vs. declarado, medios de pago, diferencias, responsables y sello/hash. Un cierre realizado no se sobrescribe; las aclaraciones van en registros nuevos.
- `cash_closure_lines` / vínculos a cierres origen: referencia exacta a sesiones y cajas incluidas en un cierre consolidado, evitando contar dos veces una caja o sesión.
- Configuración de módulo y alcance de usuario: usar el esquema de configuración/roles que ya exista si cumple; no crear un segundo sistema paralelo.
- `audit_log` o sistema de auditoría existente, con actor, tenant, caja, motivo, antes/después cuando sea seguro y correlación de la operación.

Los nombres anteriores son contratos conceptuales, no permiso para duplicar tablas que ya existan. El implementador debe mapearlos a entidades vigentes o crear migraciones nuevas y aditivas con nombres consistentes.

#### 4.14.3 Reglas de movimientos y arqueos
- Cada venta/ingreso/egreso tiene una caja fuente válida o una razón explícita por la que no aplica. Todo movimiento financiero conserva su rubro financiero obligatorio conforme a 6.10.
- Un pago a proveedor que se financia desde varias cajas debe registrar un único evento de negocio con asignaciones trazables por caja, usuario autorizante, importe aportado y comprobante/motivo. Las actualizaciones se confirman en una transacción; si una caja no puede aportar los fondos según la política configurada, no dejar distribuciones parciales huérfanas.
- Permitir arqueo individual, cierre de caja operativa, arqueo consolidado de una caja principal y consolidación de varias cajas de la sede sólo a roles habilitados. Diferenciar “consolidado de lectura” de “transferencia real de fondos”: una vista consolidada no mueve efectivo.
- Al consolidar, documentar claramente esperado, declarado, diferencias y elementos incluidos; no modificar cierres sellados de origen. La corrección se efectúa con movimiento compensatorio autorizado y motivo.
- Soportar reparto entre socios cuando el cliente active el módulo correspondiente. Definir porcentajes, base de cálculo, redondeo al centavo, momento de liquidación y snapshot de regla; no inferir porcentajes ni cambiar cierres anteriores al editar la configuración.
- El consolidado debe ser reproducible, filtrable por período, caja, moneda, medio de pago y estado; mostrar hora/zona horaria, origen y fórmula. Excluir registros no confirmados según política y marcarlos con estado explícito.
- Asegurar aislamiento de tenant en base de datos, endpoints/RPC, consultas, exports, informes y funciones de servidor. Toda transferencia, distribución, apertura, cierre o autorización queda auditada.

#### 4.14.4 Una sola sede
El modelo es **una ONG = un comercio (tenant) = una sede**. No hay sucursales, depósitos ni Casa Central. Una ONG con dos sedes físicas usa **dos comercios (tenants)** independientes, cada uno con su caja y su inventario.


### 4.15 Ordenamiento reutilizable en todas las tablas

- Implementar un componente/servicio genérico reutilizable (por ejemplo `SortableTable` / `TableSortController`, adaptado al stack real), usado por **todas las tablas y listados tabulares del sistema**: paneles, inventario, ventas, clientes, equipo, cajas, auditoría, reportes e importaciones cuando corresponda.
- En cada encabezado elegible, mostrar control accesible de orden ascendente/descendente y estado visible (sin ordenar, ascendente, descendente). Incluir `aria-sort`, foco por teclado, texto accesible y objetivos táctiles de al menos 44×44 px. No depender sólo del color o de un ícono.
- Ordenar por tipo de dato y regla de negocio: números como números, dinero por valor numérico, fechas como fechas, texto con comparación local y tildes, estados por orden definido; valores nulos al final salvo requisito explícito. Nunca ordenar dinero o números como cadenas.
- El ordenamiento debe ser determinista ante valores iguales (desempate por identificador estable) y compatible con filtros, búsqueda, paginación y selección masiva. Al cambiar filtros, evitar estados visuales que indiquen una ordenación que ya no se aplica.
- Para tablas pequeñas se admite ordenamiento local. Para datos grandes, usar ordenamiento en servidor con campos/columnas permitidas mediante lista blanca y consultas parametrizadas; nunca interpolar nombre de columna enviado por el cliente. El orden de servidor y el de exportación deben ser coherentes y documentados.
- Guardar preferencias por usuario sólo si aporta valor, sin alterar los datos ni filtrar información. En tablas virtualizadas o de reportes, mantener accesibilidad y estabilidad de selección.
- Auditar únicamente cambios de preferencia si existe un motivo relevante; no crear eventos de auditoría por cada clic de ordenamiento.
- Revisar todas las tablas existentes mediante inventario de componentes y agregar pruebas de cobertura para detectar tablas sin ordenamiento. Una grilla visual que no sea una tabla de datos se documenta como excepción justificada.

### 4.16 Eliminación protegida de artículos de inventario (sólo Administrador)

- Incorporar acciones visibles de “Eliminar” en inventario para eliminación individual y masiva por selección. **Sólo el rol Administrador** puede ejecutar la acción. No basta con ocultar botones: el servidor, RPC/endpoints y la política RLS deben rechazar a cualquier otro usuario, incluso si invoca la operación manualmente.
- Separar explícitamente **borrado físico** de **archivado/borrado lógico**:
  - Si el artículo no tiene movimientos, dispensaciones, donaciones, facturas, devoluciones, recetas, compras, historial de precios ni referencias operativas, permitir borrado físico sólo con permiso `inventory.items.delete`, confirmación reforzada y auditoría.
  - Si el artículo tiene historial o referencias, bloquear el borrado físico y ofrecer “Archivar/desactivar” conservando claves, snapshots históricos e informes. No romper claves foráneas ni alterar comprobantes cerrados/fiscales.
  - La política de negocio no debe permitir que una acción de eliminación cambie ventas históricas, recalculen cierres ni elimine movimientos contables o fiscales.
- Antes de una eliminación masiva, mostrar vista previa con cantidad seleccionada, artículos eliminables, artículos que sólo pueden archivarse y los bloqueados con motivo. Nunca ejecutar sobre toda la tabla por una selección vacía; ninguna selección masiva puede exceder el alcance visible y autorizado sin una confirmación adicional clara.
- Exigir reautenticación/confirmación reforzada según política de riesgo, registrar usuario, fecha, motivo, IDs, resultado por artículo y correlación de operación. No registrar información innecesaria.
- En nube, el backend aplica permisos y reglas de integridad por tenant; las migraciones tienen índices/FK y política de borrado explícita. En modo offline, una petición de borrado físico queda bloqueada hasta poder validar referencias y permisos en el servidor; no se declara borrado definitivo localmente.
- Para auditoría y recuperación, preferir papelera lógica cuando sea adecuado; cualquier restauración debe ser administrativa, validar colisiones y preservar el historial.


### 4.17 Entregables técnicos obligatorios de arquitectura, SQL y código

No respondas sólo con recomendaciones conceptuales. Inspeccioná el repositorio real; si aún no existe, definí e inicializá una estructura coherente con el producto de la sección 3. Entregá código, migraciones, pruebas y documentación que puedan verificarse. Adaptá estos directorios al stack existente; no dupliques lógica ni mantengas dos fuentes de verdad.

**Estructura lógica de referencia (adaptable, no dogmática):**
```text
src/
  core/
    auth/                 # identidad, roles, permisos y contexto tenant
    assistant/            # VoiceInterface, IntentEngine, ActionRegistry, policies
    audit/                # auditoría/correlación e integridad
    sync/                 # sincronización, conflictos e idempotencia
    config/               # feature flags y configuración por tenant
  modules/
    cash/                 # cajas, sesiones, movimientos, arqueos, cierres
    inventory/            # artículos, movimientos, archivo y borrado seguro
    ong/                   # legajo, dispensación, cultivo (adaptador de rubro)
    pos/
    customers/
    team/
    reports/
    checkout/              # carrito, cotización, órdenes y checkout público
    payments/              # adaptadores de proveedor, webhooks y conciliación
    shipping/              # retiro, tarifas, zonas y adaptadores de transportistas
  shared/
    components/SortableTable/
    providers/             # STT/LLM/TTS, con adaptadores sustituibles
supabase/
  migrations/              # SQL numerado, aditivo e idempotente
  functions/               # funciones de servidor verificadas (checkout, pagos, webhook, transporte)
  tests/                   # RLS, RPC, migraciones y flujos transaccionales
tests/
  unit/
  integration/
  e2e/
docs/
  architecture/
  migrations/
  runbooks/
```

Si el producto se entrega como HTML único, mantené el código fuente modular y generá el HTML mediante el proceso de ensamblado existente. No copies manualmente funciones en múltiples archivos HTML ni rompas los repositorios/instaladores publicados.

**SQL y base de datos:** crear los archivos de migración reales con nombres numerados y fecha/propósito; añadir restricciones `NOT NULL`, claves foráneas compuestas donde corresponda, índices, unicidad por tenant, checks de importes/estados, políticas RLS y RPC/funciones de servidor necesarias. Usar de manera consistente el identificador de comercio que exista en el repositorio (`comercio_id` o `tenant_id`, nunca ambos como fuentes de verdad). Las migraciones deben ser aditivas, idempotentes y probarse en una copia real de la base. Incluir datos/configuración inicial no sensible, verificación posterior, plan de compatibilidad de datos previos y pasos de reversión o recuperación. No entregar fragmentos SQL sueltos como sustituto del archivo aplicable. No aplicar limpieza destructiva sin respaldo y orden expresa.

**Backend y servicios:** definir contratos y servicios de dominio para cada operación; validar sesión/JWT, rol, permiso granular, tenant, estado de caja, reglas contables y estado del módulo. Para pagos, transferencias, cierres y borrados, usar transacciones, idempotencia y auditoría. La IA invoca estos servicios mediante acciones registradas; no tiene acceso SQL directo.

**Frontend:** reutilizar componentes, estados y validadores; ocultar opciones no disponibles sin confiar en esa ocultación para seguridad. Implementar estados claros de espera, confirmación, ejecución, error, sincronización pendiente y resultado confirmado. Todas las tablas usan el componente de ordenamiento reutilizable.

**Pruebas y documentación exigidas:** entregar matriz requisito → archivo/función/tabla → permiso → prueba → resultado; pruebas de migración/RLS/RBAC, flujos felices, errores, concurrencia, duplicados, modo offline y regresión; diagrama de arquitectura; diccionario de datos; mapa de roles/acciones; guía de configuración/secretos; instrucciones de despliegue y rollback; limitaciones y dependencias externas. Si algo no puede ejecutarse por falta de credenciales, hardware o cuenta externa, indicar exactamente qué quedó pendiente y no marcarlo como probado.

### 4.18 Checkout online opcional estilo e-commerce (tipo Tienda Nube) — convive con WhatsApp

**Propósito:** incorporar compra directa en el menú/catálogo público y preparación de envíos locales o nacionales sin alterar el flujo actual de pedidos por WhatsApp. Es una capacidad opcional por comercio/tenant. Debe poder construirse desde el inicio, pero permanecer apagada por defecto hasta configurar proveedor, tarifas, políticas y pruebas. No implica copiar código, marca ni interfaz propietaria de otra plataforma: se implementa un flujo e-commerce equivalente con diseño propio del producto.

#### 4.18.1 Modo de venta y configuración administrativa
- En Administración → Menú público / Ventas online mostrar un selector accesible **Modo de venta** con, como mínimo: `whatsapp` (flujo actual) y `online_checkout`. Valor por defecto `whatsapp`. Si la arquitectura del comercio requiere ambos canales, permitir `whatsapp_and_checkout` sólo después de especificar qué canal se ofrece y comprobar que no se creen pedidos duplicados; no retirar el botón de WhatsApp por defecto.
- El cambio de modo requiere rol `store.settings.manage` (o permiso equivalente ya existente), comprobación en backend, auditoría y vista previa antes de publicar. El frontend oculta los controles no aplicables, pero el backend valida la bandera en cada solicitud. Si falta una configuración requerida, el checkout no se anuncia al público y se muestra al administrador el requisito pendiente.
- Parámetros no secretos de tienda: modo de venta, proveedor habilitado, ambiente (`sandbox`/`production`), medios de entrega activos, reglas/tarifas de envío, provincias/códigos postales atendidos, horarios y punto de retiro, mensaje de confirmación, moneda y reglas comerciales revisadas. Validar tipos, rangos, longitud, enumeraciones y coherencia; no aceptar JSON libre sin esquema.
- Proveedor de pagos: preferir una interfaz/contrato `PaymentProviderAdapter` reemplazable (ej. Mercado Pago u otro proveedor admitido y verificado). La clave pública que el proveedor permita publicar puede entregarse al frontend si realmente es pública; el `Access Token`, claves privadas, secretos de webhook y refresh tokens **nunca** se devuelven al navegador, se guardan en HTML, en `localStorage`, en configuración genérica legible, en backups/exportaciones del comercio ni en logs. Guardarlos en el gestor de secretos del servidor o almacén cifrado separado de acceso restringido; en la base guardar sólo `secret_ref`, proveedor, ambiente, estado de conexión, fecha de última prueba y metadatos no sensibles. Campo de secreto tipo write-only: al guardar se vacía; al volver sólo se ve “configurada/no configurada”, fecha y opcionalmente últimos caracteres enmascarados autorizados; jamás se vuelve a revelar el valor completo.
- Si por compatibilidad se conserva el nombre lógico `mercadopago_keys`, dicho objeto no podrá incluir ni exponer el Access Token. Modelar por separado `public_key` y `credential_secret_ref`. Rotación/revocación sin registrar el valor secreto.
- Métodos de entrega configurables e independientes: (a) retiro en local, activable/desactivable, con punto de retiro, horarios e instrucciones; (b) envío local/cadetería con tarifa fija o por zonas configuradas y reglas de cobertura; (c) envío nacional por provincia/código postal, tabla de tarifas o adaptador de transportista (ej. Andreani, Correo Argentino, OCA) sujeto a disponibilidad y documentación oficial vigentes `[VERIFICAR]`. No inventar cobertura, costo, etiqueta, tracking ni compatibilidad de API. Las URLs de transportistas deben provenir de configuración administrativa validada y de una lista de destinos permitidos; no aceptar URLs arbitrarias proporcionadas por el comprador.
- Permitir reglas explícitas de costo fijo, zona, rango postal, peso/volumen si existe soporte real, compra mínima o envío bonificado sólo si el comercio las configura. Las tarifas deben incluir versión, moneda, alcance, vigencia y auditoría. Si una API no responde, informar que el envío no pudo cotizarse; no inventar una tarifa ni confirmar el pedido con un precio desconocido. No modificar una tarifa ya aceptada en una orden guardada.
- El módulo completo tiene bandera de feature por tenant. Apagado: conservar el menú y carrito existentes, el enlace/botón “Enviar pedido por WhatsApp” y las rutas publicadas sin cambios visuales involuntarios.

#### 4.18.2 Experiencia de compra en el menú público
- En `whatsapp`, al terminar el carrito se mantiene el comportamiento actual: botón “Enviar pedido por WhatsApp”. Ese pedido sigue siendo una solicitud y no una venta confirmada hasta que el negocio la convierta por su proceso existente.
- En `online_checkout`, el botón “Comprar” inicia un checkout responsive de tres etapas con indicadores de progreso y opción de volver sin perder los datos no sensibles:
  1. **Datos del comprador:** nombre, email y teléfono; validar formato, tamaño y normalización. Solicitar sólo datos necesarios y mostrar privacidad/consentimientos aplicables. Evitar revelar si un email/teléfono pertenece a una persona registrada.
  2. **Entrega:** retiro en local o envío habilitado; pedir dirección, localidad, provincia y código postal sólo cuando corresponda. Calcular una tarifa con reglas del servidor o adaptador de transporte; mostrar costo, tiempo estimado sólo cuando tenga fuente y dirección resumida antes de confirmar. La selección de Salta u otra provincia es configuración del comercio, no una regla fija del código.
  3. **Pago online:** iniciar el proveedor configurado usando checkout hospedado/redirección o componentes oficiales tokenizados. No recoger, procesar ni almacenar PAN, CVV, PIN ni credenciales de tarjeta en Sistema VB. Mostrar importe final, moneda, productos, descuentos, entrega y políticas antes de enviar al proveedor.
- Recalcular productos, precios, descuentos, stock según reglas actuales, envío, impuestos configurados y total en backend; no confiar en precios/totales calculados por JavaScript ni en los datos enviados por el comprador. Usar centavos enteros o DECIMAL exacto, nunca `float`. La orden conserva snapshots inmutables de nombre/SKU/presentación, cantidad, precio aplicado, descuentos, tarifa, dirección de entrega y reglas aceptadas; no cambia si luego se edita el catálogo.
- Una orden inicial queda `pending_payment` / `pago_pendiente` antes de dirigir al proveedor. Generar identificador interno impredecible y referencia externa idempotente; aplicar rate limiting, límites de unidades/importe, verificación de stock y protección contra bots. El link de pago no contiene secretos ni datos personales innecesarios.
- La URL de retorno del proveedor sólo informa al comprador y permite consultar el estado desde el servidor. **Nunca** marca un pago como aprobado. Hasta recibir y verificar la confirmación, mostrar “Pago pendiente de confirmación”; no preparar ni despachar como pagado.
- Si el pago falla, expira o el comprador abandona, preservar el estado real y permitir reintentar de forma idempotente sin crear cobros/órdenes duplicados. Liberar reservas temporales según regla de negocio versionada; no borrar historial.

#### 4.18.3 Modelo de datos y migraciones
- Antes de crear tablas, inspeccionar el esquema real. Reutilizar las entidades existentes si cubren el dominio; no crear una segunda fuente de verdad para menú, productos, clientes, pagos o pedidos. Si Sistema VB usa la tabla genérica `registros`, integrar las nuevas colecciones en la lista blanca y políticas; si usa tablas relacionales, generar las migraciones SQL correspondientes. Los nombres siguientes son contratos lógicos orientativos que deben mapearse al esquema existente, no una orden para duplicar tablas.
- Configuración de venta (`store_sales_settings` o equivalente): `tenant_id`/`comercio_id`, `modo_venta` con `CHECK`/enum, `checkout_enabled`, `provider`, `environment`, configuración pública no secreta, referencia al secreto en el backend, `shipping_config` validada, moneda, `version`, `created_at`, `updated_at`, `updated_by`. No guardar el secreto de pago dentro del JSON general.
- Órdenes (`orders`/`ordenes`, reutilizar si ya existe): ID opaco, tenant, código público de seguimiento no enumerable, clave idempotente, comprador mínimo necesario, dirección protegida, totales desglosados en enteros/DECIMAL, moneda, snapshots de líneas y reglas, fuente/canal (`whatsapp`, `checkout` u otro), referencias al proveedor sin secretos, timestamps, versión optimista y `created_by` cuando aplique. Índices por tenant, fecha, estado y clave idempotente. Las consultas públicas sólo exponen lo mínimo por token de pedido firmado/de suficiente entropía.
- Separar estados que representan dimensiones diferentes: `payment_status` (`pending`, `approved`, `rejected`, `cancelled`, `refunded`, `charged_back`, `unknown`) y `order_status` (`draft`, `pending_payment`, `confirmed`, `preparing`, `ready_to_ship`, `shipped`, `delivered`, `cancelled`). Los estados externos se mapean mediante adaptador; no avanzar un pedido a despacho por una notificación incompleta. Mantener un historial append-only de cambios de estado con actor, motivo, fuente, ID de evento y fecha.
- Líneas de orden (`order_items`/equivalente): snapshot del producto/variante, cantidad validada mayor a cero, precio unitario, descuento e importe en centavos, referencia de producto nullable si se elimina/archiva más adelante; el histórico se conserva aunque el artículo ya no exista.
- Intentos de pago (`payment_attempts`): tenant, orden, proveedor, ambiente, referencia del proveedor, clave idempotente, importe/moneda esperados, estado, timestamps, errores normalizados sin secretos. Único por tenant/proveedor/clave idempotente y restricciones que impidan asociar un pago de otro tenant.
- Eventos de webhook (`payment_webhook_events` o equivalente): proveedor, ambiente, ID de evento/notificación, pago/orden referidos, fecha de recepción, resultado de validación y procesamiento. Clave única adecuada por proveedor/ambiente/evento (y, donde corresponda, por pago/transición) para idempotencia. Almacenar únicamente el cuerpo mínimo redactado/hash necesario para diagnóstico, sujeto a límites de tamaño y retención; nunca conservar tokens o datos de tarjeta. No confiar en un ID de evento aislado como prueba de pago.
- Entrega (`shipping_quotes`, `shipments` o equivalente): versión de tarifa/cotización y vencimiento, método, destino mínimo necesario, costo, transportista, tracking y estado. El tracking sólo se guarda cuando el transportista/proceso lo confirma. Dirección y contacto se cifran o se restringen a roles que realmente los necesitan.
- Todos los registros tienen tenant cuando corresponda, claves foráneas compuestas que incluyen tenant cuando sea viable, restricciones, índices, RLS y auditoría. Evitar borrado en cascada de órdenes, pagos, comprobantes o eventos históricos. Migraciones numeradas, aditivas, idempotentes, probadas en una copia, con estrategia de rollback/restauración.

#### 4.18.4 Flujo backend, pago y webhook
1. `POST /checkout/quote` (o equivalente): valida que el checkout esté activo para el tenant, recibe carrito y entrega solicitada, obtiene productos/precios desde la fuente de verdad, aplica reglas vigentes y devuelve una cotización identificada con expiración. No reservar ni debitar dinero sólo por consultar.
2. `POST /checkout/orders`: valida sesión pública/token CSRF donde corresponda, rate limits, esquema de entrada, cotización vigente, tenant, existencia y estado de productos, cantidad, límites de stock, descuentos y tarifa. Recalcula importes servidor a servidor; crea orden e historial en transacción con idempotencia. Responde sólo con ID público/token de consulta limitado y datos de redirección no secretos.
3. `POST /checkout/payments/session` (o equivalente): sólo para orden válida y pendiente; crea preferencia/sesión mediante adaptador de pago desde servidor, importe y moneda derivados de la orden guardada, referencia externa idempotente y URL de retorno fija/verificada. No permite enviar un monto arbitrario desde el frontend. Persistir la referencia antes o en una transacción de estados bien definida; reintentos consultan la sesión/pago existente antes de crear otro.
4. Endpoint público de webhook por proveedor: valida la autenticidad usando el mecanismo vigente documentado oficialmente `[VERIFICAR en documentación oficial del proveedor]`, secreto guardado en servidor, firma/headers y marca de tiempo/replay cuando el proveedor lo soporte. Aplicar límites de tamaño, rate limiting y respuestas no verbosas. No confiar en IP allowlist como única prueba ni en un webhook sin firma/consulta confiable.
5. Obtener el detalle del pago por el API oficial del proveedor desde el backend; validar cuenta receptora, ambiente, ID, tenant/orden, referencia externa, estado final, monto exacto, moneda, método y relación con la orden. Si alguno no coincide, registrar incidente, ponerlo en revisión y no acreditar ni despachar. El webhook no recibe permisos por ser público.
6. En una sola operación transaccional/idempotente, registrar el evento, bloquear o actualizar la orden de manera segura, cambiar `payment_status` y el historial sólo si la transición es válida; no procesar dos veces el mismo evento. Un evento viejo no puede retroceder un estado final válido. Estados ambiguos, firma inválida, importes distintos o proveedor no disponible quedan pendientes/de revisión, nunca “aprobados”.
7. Confirmar automáticamente “Pagado — listo para preparar/despachar” sólo después de validación autoritativa. La preparación/despacho exige que la orden y su entrega estén válidas; el pago aprobado no significa que el paquete fue enviado. Reembolsos, contracargos y cancelaciones necesitan flujo separado, permisos, conciliación y acciones compensatorias auditadas; no editar el histórico de la orden para ocultarlos.
8. En caso de timeout, consulta el estado del proveedor antes de repetir una operación de pago. Los webhooks pueden repetirse, llegar fuera de orden o no llegar; implementar reconsulta/reconciliación programada y una bandeja de excepciones. El estado del módulo de pagos no altera por sí solo el indicador general de conexión/nube de Sistema VB.
9. Ningún endpoint de webhook acepta como autoridad `approved`, monto, moneda o tenant suministrado por el cliente. Una redirección exitosa, un screenshot, un mensaje del comprador o una respuesta generada por IA no acreditan el pago.

#### 4.18.5 Panel de órdenes y operación
- Incorporar Administración → Órdenes online si el módulo está activo y el rol tiene acceso. Listado con búsqueda/ordenamiento reutilizable, filtros por fecha/pago/envío, detalle, productos, importes, datos de entrega necesarios, historial cronológico y referencia de pago parcialmente enmascarada.
- Mostrar estados diferenciados y legibles: “Pago pendiente”, “Pago aprobado”, “Preparando”, “Listo para despachar”, “Enviado”, “Entregado”, “Pago rechazado”, “Reembolso/contracargo en revisión”. El distintivo **“Pagado — listo para despachar”** sólo aparece si el estado fue verificado en backend y la orden aún no fue despachada/cancelada.
- Mostrar dirección completa y etiqueta de envío sólo a personal autorizado que la necesita para preparar/despachar; ocultarla en listados públicos, logs, notificaciones amplias y roles no autorizados. Las etiquetas se generan sólo mediante proveedor/proceso configurado; no fingir una etiqueta descargable si no hay integración real.
- Acciones manuales de cambiar a preparado/enviado, registrar tracking, cancelar, reembolsar o marcar entrega validan permiso específico y estado actual, piden confirmación según impacto y se auditan. Un usuario no puede marcar manualmente “pagado” salvo proceso de conciliación manual explícito con permiso separado y justificante.
- Añadir reportes de órdenes, ventas cobradas, pendientes, rechazadas, costos de envío y devoluciones, sin doble contabilización de la orden, el cobro y los movimientos de caja. Un pago externo se refleja en reportes conforme a la política contable/configurada; no crear automáticamente un ingreso de caja física si no ingresó efectivo. El módulo de caja conserva la clasificación financiera obligatoria de 6.10.

#### 4.18.6 Compatibilidad con el asistente conversacional y modo offline
- Registrar en `ActionRegistry` acciones de consulta/preparación de orden donde tenga sentido (por ejemplo `getOrderStatus`, `prepareCheckoutOrder`, `getShippingQuote`). La IA puede preparar un borrador, resolver campos faltantes o informar estado, pero no puede declarar pagado, forjar eventos, modificar la cuenta del proveedor ni marcar despachado sin pasar por las herramientas protegidas.
- Operaciones financieras sensibles siempre se ejecutan en backend con identidad y permiso; una orden preparada por voz/texto requiere confirmar productos, dirección, entrega y total antes de crearla. No dictar ni transcribir números de tarjeta, CVV, tokens o secretos al proveedor de IA. No autorizar pagos sólo con una frase o voz reconocida.
- En modo offline no prometer cotización actualizada, checkout aceptado, pago aprobado ni etiqueta. Se puede guardar un borrador local seguro si la política lo permite, claramente marcado “Pendiente de conexión; todavía no enviado”, sin iniciar o acreditar pagos hasta confirmar con el servidor. La vuelta de conexión reconcilia por idempotencia y evita órdenes duplicadas.

#### 4.18.7 Entregables específicos
Entregar cambios reales en administración del menú, frontend de checkout, adaptadores de pago/transporte, servicios y endpoints de servidor, migraciones SQL, políticas RLS/RBAC, actualización de sincronización/listas blancas/respaldo/exportación, configuración de secretos, pruebas unitarias/integración/E2E, diagrama de estados, mapa de datos y guía de sandbox/producción. La habilitación productiva requiere cuenta del propietario, credenciales por canal seguro, URLs/webhooks verificados, prueba real de pago y reconciliación. Sin esos insumos, mantener apagado y declarar explícitamente qué está pendiente.



### 4.19 Tarjetas de fidelización en Apple Wallet / Google Wallet y avisos automáticos a clientes

**Objetivo:** permitir que el cliente reciba su tarjeta digital de fidelización y la guarde por decisión propia en Apple Wallet o Google Wallet, y que el comercio configure avisos automáticos relevantes (por ejemplo, saldo/sellos actualizados, premio disponible o vencimiento) desde un motor central y auditable. La capacidad es opcional por comercio y programa de fidelización. No debe romper la tarjeta web actual ni el pedido por WhatsApp.

#### 4.19.1 Experiencia del cliente y envío de la tarjeta
- En Fidelización/Clientes, los usuarios autorizados pueden elegir **Enviar tarjeta digital** por un canal configurado (por ejemplo, correo o WhatsApp Business oficial) o generar un enlace seguro para que el cliente la obtenga desde el menú público. El cliente también puede iniciar el proceso desde su área de tarjeta digital.
- El mensaje debe contener instrucciones claras y enlaces oficiales **Agregar a Apple Wallet** y/o **Guardar en Google Wallet** sólo cuando cada plataforma esté habilitada y la tarjeta haya sido generada correctamente. No afirmar que se guardó: el cliente debe completar y aceptar el flujo de la wallet. Estados internos separados: `not_requested`, `link_created`, `sent/accepted_by_provider`, `pass_generated`, `save_flow_opened` si técnicamente medible, y `saved/registered` únicamente si la plataforma ofrece una señal verificable. Si no hay confirmación, mostrar “enlace enviado” o “pendiente”, nunca “guardada”.
- El envío puede ser manual por un operador autorizado o automático al alta/consentimiento en el Club, según la configuración. El cliente debe poder volver a solicitar la tarjeta sin crear una membresía duplicada.
- La tarjeta digital es una representación del programa de fidelización; la fuente de verdad de puntos, sellos, categoría y premio sigue siendo el ledger del Sistema VB. La wallet nunca acredita ni canjea beneficios por sí sola.
- Incluir alternativa web accesible y código QR cuando la plataforma no esté disponible o el cliente no tenga una wallet compatible. No bloquear la tarjeta de fidelización existente por no usar una wallet.

#### 4.19.2 Apple Wallet y Google Wallet: implementación por adaptadores
- Crear interfaces independientes, por ejemplo `WalletPassProvider`, con adaptadores `AppleWalletPassAdapter` y `GoogleWalletPassAdapter`. No mezclar credenciales, IDs, APIs ni reglas de una plataforma con la otra ni con los datos genéricos del programa.
- **Apple Wallet:** generar el pase de tipo tarjeta de tienda (`storeCard`) o el tipo compatible vigente, con identificador de pase y número de serie estables por tarjeta. Firmar cada `.pkpass` en backend con el certificado y la clave privada requeridos por Apple; la clave privada, certificados y tokens de autenticación jamás llegan al HTML, navegador, IndexedDB, exportaciones o logs. Distribuir por descarga segura/web/email según soporte oficial. Si se habilitan actualizaciones, implementar el servicio web de registro, consulta, entrega de pase actualizado y baja de registro; guardar sólo las relaciones de registro necesarias y autenticar cada endpoint según las instrucciones vigentes de Apple.
- **Google Wallet:** usar la API oficial y objetos/clases de fidelización del emisor habilitado; crear o actualizar el objeto del socio mediante backend y entregar el enlace oficial de guardado generado con el mecanismo firmado admitido por la API. Las credenciales del emisor/cuenta de servicio y claves de firma permanecen en servidor. No suponer que un enlace por sí solo significa que el usuario completó el guardado.
- Revisar y confirmar documentación oficial, cuentas de desarrollador/emisor, permisos, certificaciones, cuotas y limitaciones actuales antes de producción: Apple Wallet `https://developer.apple.com/documentation/walletpasses` y distribución/actualización `https://developer.apple.com/documentation/walletpasses/distributing-and-updating-a-pass`; Google Wallet `https://developers.google.com/wallet` y referencia de objeto de fidelización `https://developers.google.com/wallet/reference/rest/v1/loyaltyobject`. Marcar `[VERIFICAR]` cualquier detalle dependiente de políticas, cuentas o versiones de API.
- Los pases pueden mostrar únicamente información mínima: marca, nombre público del programa, identificador opaco de socio, saldo/sellos o premio cuando corresponda, fecha de vigencia y código de barras/QR. No incluir DNI, domicilio, fecha de nacimiento, teléfono, correo, tokens de sesión, secretos, ni datos sensibles. El QR o código no debe contener información personal en claro ni ser una autorización de canje autosuficiente.
- Validar los canjes en el servidor: código firmado o identificador opaco con rotación/expiración según riesgo, límites de uso, verificación de tenant/programa/cliente/estado y prevención de repetición. Para un canje de un solo uso, consumir el token en una transacción atómica. La lectura de una captura de pantalla no reemplaza la validación del servidor.
- **Actualización:** cuando cambien puntos/sellos, nivel, premio o vigencia, actualizar la representación web y, si se implementó la capacidad oficial, actualizar el pase guardado en la wallet. Las notificaciones de actualización propias de una wallet no deben confundirse con mensajes de marketing o con la entrega de un email/WhatsApp. Si la plataforma no confirma entrega/actualización, dejar estado pendiente y mostrar la fecha de última sincronización conocida.
- Las funciones de Apple/Google tienen requisitos de cuenta, firma, permisos, dispositivos y plataforma; no asegurar compatibilidad universal ni simular producción. Mantener sandbox/demo claramente rotulado y pases de ejemplo sin beneficios reales.

#### 4.19.3 Avisos automáticos: reglas configurables
- Agregar una pantalla **Administración → Fidelización → Avisos automáticos** y, cuando tenga sentido, centralizarla como **Sistema → Comunicaciones** usando un único componente reutilizable. Sólo roles autorizados pueden crear/editar/publicar reglas; el servidor valida permisos, tenant, límites y estado de consentimiento.
- Permitir reglas con: evento disparador; audiencia y criterios de elegibilidad; canal/es disponibles; plantilla versionada; fecha/hora/zona horaria; ventanas de silencio; límite por persona y canal; cooldown; prioridad; caducidad; estado de prueba/activo/pausado; responsable y auditoría. Las campañas deben tener vista previa, envío de prueba y estimación de destinatarios antes de activarse.
- Triggers iniciales configurables, no todos activos por defecto: alta/activación del Club; tarjeta lista para guardar; puntos/sellos acreditados; premio alcanzado; premio o cupón por vencer; cumpleaños si corresponde legalmente y hay permiso; membresía/plan por vencer o pago pendiente; recordatorio de turno, reserva u orden sólo si el módulo de rubro lo soporta; inactividad de fidelización con consentimiento comercial. Reutilizar eventos reales del ERP; no inferir compras, saldo, cumpleaños o estado de pago desde el texto de un mensaje.
- Canales por adaptador: correo transaccional; WhatsApp Business API oficial; SMS mediante proveedor habilitado; notificación web/PWA únicamente cuando exista soporte real y consentimiento explícito del navegador; avisos/actualizaciones específicos de Wallet sólo mediante capacidades documentadas y habilitadas por la plataforma. Un enlace `wa.me` que abre WhatsApp no es envío automático. No usar scraping, automatización de WhatsApp Web, listas compradas ni gateways no autorizados.
- Separar **mensajes operativos/transaccionales** (por ejemplo, confirmación de una acción solicitada o estado de una tarjeta) de **marketing/promocionales**. Mantener consentimiento granular por finalidad y canal con versión, fecha, origen, texto aceptado y revocación. No enviar marketing sin consentimiento válido; no convertir el consentimiento del Club, la recepción de una tarjeta o el consentimiento transaccional en permiso de publicidad. Respetar bajas, lista de supresión, políticas de plantilla del proveedor y normativa aplicable `[VERIFICAR]`.
- Incluir centro de preferencias accesible para seleccionar canales, frecuencia y tipos de aviso, revocar consentimiento comercial y solicitar baja. Procesar la baja de forma idempotente e inmediata para campañas nuevas; una baja de marketing no debe suprimir avisos estrictamente operativos que se deban al usuario, según la política legal verificada.
- Control de frecuencia: máximo configurable por canal/cliente, ventanas de silencio y zona horaria, deduplicación de eventos y prevención de campañas repetidas. No establecer valores comerciales universales como verdad fija: proponer valores iniciales conservadores configurables y mostrar claramente la configuración efectiva.
- Las notificaciones automáticas deben originarse en eventos confirmados del servidor; no enviar por simples cambios visuales, eventos pendientes, ventas no confirmadas ni datos locales que todavía no se sincronizaron. Para wallet, actualizar el saldo únicamente después de confirmar el movimiento de fidelización en el ledger.

#### 4.19.4 Cola, estados, datos y ejecución fiable
- Implementar `NotificationService` / `NotificationProviderAdapter` y patrón transactional outbox: en la misma transacción del evento de negocio insertar una tarea de comunicación; un worker/función programada independiente procesa la cola aunque ningún navegador esté abierto. Si no existe el scheduler necesario, declararlo como dependencia pendiente y no simular envíos automáticos.
- Estados mínimos de entrega: `queued`, `processing`, `accepted_by_provider`, `sent`, `delivered`, `read` (sólo si el proveedor lo reporta), `failed`, `suppressed`, `cancelled`, `unknown`. Mapear cada canal a estados que realmente informe. “Aceptado por proveedor” no es “entregado”; no inventar confirmaciones de lectura.
- Cada trabajo tiene ID idempotente derivado del evento de negocio, regla, canal y destinatario pseudonimizado; límite de reintentos con espera exponencial y jitter, cola de fallos definitivos (DLQ), manejo de rate limits, reconsulta cuando aplique y protección contra tormentas de reintentos. Los reintentos no duplican mensajes ni beneficios. Un proveedor caído no bloquea ventas, fidelización, sincronización ni la nube principal.
- Modelo lógico a mapear al esquema actual (no crear tablas duplicadas si existe equivalente): `wallet_passes` (tenant, cliente, plataforma, ID opaco de pase, versión, estado, referencia de proveedor y fechas); `wallet_registrations` si la plataforma soporta actualización registrada; `notification_preferences` (cliente, finalidad/canal, consentimiento y revocación); `notification_templates` (canal, idioma, versión y estado); `notification_rules` (trigger, audiencia, horario, límites y canal); `notification_outbox/jobs` (evento, dedupe key, estado, programado, intentos y próxima ejecución); `notification_delivery_events` (referencia externa, estado, fecha y error normalizado). Todas las entidades quedan aisladas por tenant, con RLS, claves foráneas, índices, restricciones y política de retención.
- No almacenar credenciales en tablas de configuración accesibles al cliente. Guardar sólo referencias a secretos del servidor; para contraseñas de proveedor, certificados y claves de firma aplicar almacenamiento secreto/cifrado, rotación y revocación. Una tabla que almacene la configuración pública nunca contiene private keys, Access Tokens, bearer tokens, claves de APNs, credenciales de cuenta de servicio o `authenticationToken` revelables.
- Tratar correo, teléfono, tokens de enlace, IDs externos, direcciones y contenido del mensaje como datos protegidos. Minimizar contenido en logs; nunca registrar tokens completos, credenciales o el cuerpo íntegro de mensajes sensibles. Evitar que un ID secuencial permita enumerar miembros o tarjetas.

#### 4.19.5 Enlaces, autenticación y privacidad
- Los enlaces de entrega/guardado deben usar tokens aleatorios con alta entropía, ámbito limitado a un único tenant, cliente, tarjeta y propósito; vencimiento corto configurable; canje de un solo uso o repetible sólo cuando el diseño lo requiera expresamente; invalidación, rotación, rate limiting y no enumeración. Guardar hash del token cuando sea viable; no incluir puntos, teléfono, email ni ID interno en query strings.
- El endpoint valida servidor-side la identidad/posesión del enlace, estado del socio, vigencia del programa y que el pase pertenezca al tenant. Respuestas genéricas no revelan si existe una cuenta; evitar open redirects, URLs de destino arbitrarias, phishing de dominios o enlaces hacia tenants distintos.
- Los datos enviados a terceros se limitan al mínimo necesario, con proveedor, finalidad, ubicación/retención y acuerdos requeridos documentados. Evaluar privacidad y base legal por jurisdicción y tipo de comunicación `[VERIFICAR]`. No enviar categorías sensibles, deuda, compras privadas o datos financieros en notificaciones visibles en pantalla bloqueada.
- Cambios de diseño/plantilla, activación de reglas, exportación de destinatarios, rotación de certificados y acciones masivas requieren permiso granular y auditoría. Para envíos masivos: previsualización, límites diarios por tenant/proveedor, confirmación humana cuando corresponda y botón de pausa/cancelación de cola.

#### 4.19.6 Integración con fidelización y resto del ERP
- Los nuevos módulos reutilizan Clientes, Club, libro mayor de puntos/sellos, cupones, membresías, correo, WhatsApp y auditoría existentes. No se crea una base paralela de clientes, puntos, consentimientos o membresías.
- Exponer acciones del `ActionRegistry` sólo donde tenga sentido y según rol, por ejemplo `sendLoyaltyCard`, `createWalletSaveLink`, `getWalletPassStatus`, `previewNotificationRule`, `sendTestNotification`, `pauseNotificationRule` y `getNotificationDeliveryStatus`. Una orden por voz no debe disparar campañas masivas ni revelar datos de clientes; las acciones masivas requieren permisos reforzados, vista previa y confirmación explícita.
- Con nube deshabilitada, la tarjeta web actual sigue funcionando; wallet/notificaciones externas se muestran como “Pendiente de configuración” o deshabilitadas. No encolar una notificación externa como entregada cuando sólo quedó guardada localmente. Al recuperar conexión, sincronizar eventos de forma idempotente y respetar las bajas más recientes.

#### 4.19.7 Entregables y dependencias
Entregar migraciones SQL y políticas RLS, servicios y adaptadores de cada plataforma/canal, plantillas administrables, interfaz de preferencias, cola/worker programado, endpoints de registro/actualización cuando correspondan, gestión segura de certificados/secretos, auditoría, guía de entorno de pruebas y producción, pruebas automatizadas y matriz de compatibilidad. La producción requiere cuentas, permisos, certificados, dominios HTTPS, credenciales y opt-ins reales según cada proveedor. Si una dependencia no está configurada, la característica queda apagada y su estado se declara sin simular éxito.

Referencias oficiales de implementación a revisar durante el desarrollo: Apple Wallet `https://developer.apple.com/documentation/walletpasses`; Apple distribución/actualización `https://developer.apple.com/documentation/walletpasses/distributing-and-updating-a-pass`; Apple web service de actualización `https://developer.apple.com/documentation/WalletPasses/adding-a-web-service-to-update-passes`; Google Wallet API `https://developers.google.com/wallet`; Google Wallet Loyalty Object `https://developers.google.com/wallet/reference/rest/v1/loyaltyobject`. Verificar requisitos, límites y políticas vigentes de cada plataforma antes de publicar.

---

---

## 4.20 VENTAS, PAGOS MIXTOS, VUELTO Y CUENTA CORRIENTE PARCIAL (V26.1)

**Objetivo.** Una venta se puede cobrar con **varios medios a la vez** (p. ej. $ 60.000 = $ 40.000 efectivo + $ 20.000 cuenta corriente) sin que la caja, el arqueo ni la cuenta del cliente se desfasen. Es una extensión del cobro existente (4.18 no cambia); no se duplica ninguna pantalla: el mismo modal "Confirmar cobro" gana el modo **Dividir el pago (mixto)**.

**Reglas obligatorias.**
1. **Identificación.** Cuenta corriente (total o parcial) exige un **cliente identificado**; nunca consumidor final anónimo. Se respeta su límite de crédito sobre la parte a cuenta corriente.
2. **Suma exacta.** La suma de los medios imputados + la parte a cuenta corriente debe dar **exactamente** el total (centavos enteros). Si faltan o sobran centavos, el botón Cobrar no avanza y se muestra "Faltan $ X / Sobran $ X". Hay un botón **Resto** por línea. Un medio no se repite; QR/MODO (cobro digital pendiente) no se combinan con otro medio.
3. **Alerta de vuelto.** En efectivo, "Recibe en mano" es opcional; si es mayor que el importe imputado a efectivo se muestra una **alerta grande, role="alert"**, con el vuelto exacto ("VUELTO A ENTREGAR $ X") en el cobro, en el comprobante y en el ticket. Si es menor, se bloquea con mensaje claro. El vuelto **nunca** forma parte de lo imputado.
4. **Caja y arqueo.** El efectivo esperado suma **sólo el dinero que entró** (importe imputado a efectivo, neto de vuelto). La parte a cuenta corriente **no** suma a efectivo ni a "cobrado" del turno. El cierre informa por separado: *COBRADO REAL* · *A CUENTA CORRIENTE (deuda de clientes, no entró a caja)* · *vuelto entregado*, y el total vendido.
5. **Cuenta corriente.** Al confirmar se genera automáticamente un **débito** por el saldo (auditoría `CTA_CTE_DEBITO`). El estado de la venta queda **Pagada / Pago parcial / Pendiente de cobro** con el saldo vinculado; el resumen del cliente se actualiza al instante con el libro (débitos, créditos, saldo corrido). Anular la venta saca el débito. El saldo **se deriva** de ventas y cobros (no existe un segundo saldo que pueda desfasarse).
6. **Atomicidad.** Toda validación (stock, límite, suma, cliente, cupón, sello) ocurre **antes** de mutar; una venta rechazada no deja stock, caja, deuda ni numeración huérfanos. En la nube, `sincronizar()` valida cada venta en su propia sub-transacción; los importes derivados (`fiadoAmt`, `paid`, `balance`, `pstate`) los **calcula el servidor** y una venta con pagos registrados queda **inmutable** (se corrige con anulación / nota de crédito).
7. **Modelo de datos** (equivalente relacional de `registros`): `Ventas(id, n, ts, total, cust, status, pstate)` · `Detalle_Ventas = ventas.items[]` · `Pagos_Venta = ventas.pays[] {m, a, fee}` (a = importe imputado) · `Cuentas_Corrientes_Movimientos` = débitos (parte `fiado` de cada venta) + créditos (colección `fiado`, cobros de deuda), consultable con `cc_movimientos(comercio, cliente)`.
8. **Exportación y reportes.** La exportación de ventas agrega `pagos`, `a_cuenta_corriente` y `estado_pago`; el dashboard reparte cada venta mixta entre sus medios.
9. **Límite declarado.** El límite de crédito se valida en el mostrador (equipo); el servidor valida estructura, suma y cliente pero **no rechaza por límite** para no romper la venta sin conexión (se informa y se audita).

**Pruebas obligatorias:** 40.000 + 20.000 = 60.000; suma que no cierra (menos/más); cuenta corriente sin cliente; cliente inexistente; límite excedido; medio repetido; QR combinado; efectivo recibido menor; vuelto 10.000 (recibe 50.000 sobre 40.000); arqueo sólo con efectivo real; reporte de cierre con deuda separada; ficha del cliente con débito y saldo; cobro de deuda; anulación; reenvío adulterado desde el equipo; aislamiento A/B; 320/360 px. Implementadas en `t/v7.py`, `t/c16.py` y `supabase/tests/14-sql-tests.sql`.

## 4.21 PROVEEDORES Y COMPRAS (V26.2) — órdenes de compra, ingreso de mercadería atómico y cuenta corriente de proveedores

**Objetivo.** Gestionar proveedores, órdenes de compra y la recepción de mercadería **sin romper inventario ni caja**: una sola operación atómica suma el stock, actualiza el costo (el margen se recalcula solo) y registra la deuda con el proveedor o el egreso de caja/banco. Es un módulo aditivo que convive con 4.8 (lectura de facturas con IA: la carga revisada de una factura puede terminar en este mismo ingreso) y con 4.5 (caja). No se duplica ninguna pantalla, tabla ni función existente: se detecta antes (sección 12).

**Modelo de datos (tablas relacionales reales, todas con `tenant_id` → comercio, RLS, `created_at/updated_at/created_by`, restricciones y claves foráneas compuestas `(id, tenant_id)`).** Dinero en `numeric(14,2)` (pesos) en SQL/API y en **centavos enteros** en el estado del equipo; cantidades `numeric(14,3)`; nunca `float`.
- `proveedores`: razón social, CUIT **como texto de 11 dígitos sin guiones** (con dígito verificador validado, único por comercio), condición frente al IVA (*Responsable Inscripto / Monotributista / Exento*), correo, teléfono, dirección, `saldo_cuenta_corriente`, activo (archivo en lugar de borrado).
- `ordenes_compra` (+ `ordenes_compra_detalles`): número correlativo por comercio, proveedor, estado (*Borrador / Solicitada / Recibida / Cancelada*), total calculado **por el servidor**, fecha de emisión; el detalle guarda producto, cantidad y **costo pactado**.
- `ingresos_mercaderia` (+ `ingresos_mercaderia_detalles`): proveedor, orden vinculada (opcional), tipo y número de comprobante (*Factura / Remito*; único por proveedor y tipo, sin distinguir mayúsculas), fecha de recepción, condición (cuenta corriente o contado), medio, rubro, caja, total y, por renglón, **stock y costo antes/después**.
- `cuenta_corriente_proveedores`: libro **sólo-agregar** (triggers que impiden modificar o borrar): *Factura / Remito / Pago / Nota de Crédito*, monto, `saldo_acumulado`, referencia, medio, rubro, motivo. El saldo del proveedor es siempre la suma del libro (se prueba).
- El catálogo de productos vive en el almacén genérico del sistema (`registros`): `producto_id` **no** es clave foránea; lo valida la función. Un producto con órdenes o ingresos **no se borra, se archiva** (extiende la regla de 4.16).

**Operaciones (funciones del servidor `SECURITY DEFINER`, `search_path` fijo; DML directo revocado a `anon` y `authenticated`; sólo administrador y supervisor; mostrador/operador rechazados en el servidor).**
1. `proveedor_guardar` (alta/edición/archivo), `proveedores_listar` (búsqueda, estado de cuenta, orden por lista blanca de columnas —nunca texto libre en el `ORDER BY`—, paginación, comodines escapados).
2. `orden_compra_guardar` (nace *Borrador* o *Solicitada*; sólo se edita un Borrador; idempotente por clave), `orden_compra_estado` (Borrador→Solicitada/Cancelada, Solicitada→Cancelada; *Recibida* sólo por recepción).
3. **`procesar_recepcion` — transacción atómica única**: bloquea al proveedor (dos envíos simultáneos se ordenan), valida clave de idempotencia, comprobante duplicado, orden Solicitada del mismo proveedor y productos que pertenezcan a ella, total declarado vs. suma de renglones, fecha razonable, rubro válido para egreso (6.10) y, si es efectivo, **caja abierta**; luego **suma stock** (movimiento `smov` del servidor, conmutativo con las ventas de otras cajas), **actualiza el costo** (costo 0 = bonificación: no pisa el vigente), asienta la **Factura/Remito** en el libro, y si es **contado** asienta además el **Pago** y, en efectivo, crea el **egreso de caja** con el rubro; marca la orden *Recibida* y devuelve las **diferencias** (pedido vs. recibido, pactado vs. facturado). **Cualquier falla revierte todo** (stock, costo, libro, caja, orden).
4. `proveedor_pago_registrar` (no puede superar la deuda; medio y rubro obligatorios; efectivo exige caja abierta), `proveedor_nota_credito` (reduce la deuda, puede dejar saldo a favor; no mueve caja ni stock), `cuenta_proveedor` (libro) y `compras_snapshot` (lectura de todo para la pantalla).
5. **Idempotencia** por clave en recepciones, pagos, notas y órdenes (reintento, doble clic, caída de red: se devuelve lo ya guardado y nunca se duplica). Auditoría de cada operación. Hash/cierres sellados no se tocan.

**API REST (Edge Function delgada `api`, JSON de entrada y salida, sin secretos; reenvía el JWT del usuario y el comercio va en `X-Tenant-Id`; clave de idempotencia en `Idempotency-Key`).** `GET /proveedores` (filtros `q`, `estado`, `orden`, `dir`, paginación, con estado de cuenta) · `POST /proveedores` · `GET /proveedores/{id}/cuenta` · `GET /compras/ordenes` · **`POST /compras/orden`** · `POST /compras/orden/{id}/estado` · **`POST /compras/recepcion`** (carga masiva de renglones que dispara stock, costo y deuda/caja) · `POST /compras/pago` · `POST /compras/nota-credito`. Respuestas `{ok:true,data}` o `{ok:false,error:{codigo,mensaje}}`; 201 al crear (200 si la clave ya existía); 401/403/404/405/413/422/500/503 mapeados; CORS por lista de orígenes. Un único contrato (pesos, `snake_case`) para el servidor, la API y el equipo.

**Pantalla "Proveedores y compras" (Operación, permiso `purchases`: administrador y supervisor por defecto; los datos anteriores migran sin pisar lo que el dueño ya decidió).**
- Tablero neumórfico con **Total deuda a proveedores** (sólo saldos a pagar; el saldo a favor se muestra aparte) y **Órdenes pendientes de recepción**, más proveedores activos.
- **Tabla de proveedores** con búsqueda, filtro (activos / con deuda / al día / archivados) y **encabezados clicables con flechas ▲/▼** por nombre, saldo u otra columna (componente de ordenamiento de 4.15); en celular se ocultan las columnas secundarias.
- **Órdenes de compra**: alta con renglones dinámicos (producto con búsqueda, cantidad, costo pactado, subtotal en vivo), borrador o solicitar, editar, cancelar, ver y recibir.
- **Carga de remito**: buscador de proveedor, orden pendiente (precarga sus renglones), renglones dinámicos con **cantidad y costo actualizado** (muestra stock actual, cambio de costo y margen sólo a quien ve costos), tipo y número de comprobante, fecha, total declarado de control, cuenta corriente o contado (medio + **rubro obligatorio** + caja abierta), confirmación con el impacto en palabras y resultado con stock/costo antes→después y diferencias contra la orden.
- **Cuenta corriente**: libro con saldo corrido, ingresos de mercadería con detalle, **pago** y **nota de crédito**, exportación CSV/Excel con fórmulas neutralizadas.
- Campos numéricos sin "0" precargado y con selección al enfocar; áreas táctiles ≥ 44 px; sin desbordes de 320 a 1440 px.

**Dos motores, mismas reglas.** *Nube:* las operaciones se ejecutan en el servidor, requieren internet y **nunca fingen haber guardado** (sin conexión se avisa "no se guardó nada"); antes de operar se sincronizan los datos locales que el servidor necesita (productos, caja, rubros) y después se baja el stock/costo/caja resultante **sin contarlos dos veces**. *Local (demo o sin nube):* mismas validaciones sobre el estado del equipo, con retroceso completo ante cualquier falla. Las reglas de negocio no se escriben dos veces con significados distintos: el contrato es el mismo.

**Límites declarados.** Sin nube, la recepción no es transaccional contra otros equipos (no los hay). El producto es un dato del catálogo, no una clave foránea. No emite documentos fiscales de compra ni calcula retenciones/percepciones (la IVA/percepción de la factura se carga como dato de 4.8). Devolución de mercadería al proveedor: se registra la nota de crédito; el ajuste de stock es manual en Inventario.

**Pruebas obligatorias:** alta con CUIT válido/ inválido/ repetido · orden con total calculado por el servidor · recepción con y sin orden · diferencias pedido/recibido y pactado/facturado · costo que sube, que baja y costo 0 (bonificación) · **rollback total** si falla la caja (stock, costo, libro y orden intactos) · comprobante duplicado · repetir la misma clave (una sola vez) y **doble clic** · contado en efectivo sin caja abierta · contado con rubro vacío/incompatible/ajeno · pago mayor a la deuda · nota de crédito y saldo a favor · libro con saldo acumulado consistente · concurrencia (misma clave ×6; 8 comprobantes simultáneos sobre el mismo producto; 8 pagos simultáneos contra una deuda) · producto con compras no se borra · aislamiento A/B (un comercio no lee ni escribe en el otro) y piso de rol (mostrador/operador rechazados en el servidor) · API (401/400/403/404/405/422, CORS, idempotencia 201/200) · pantalla en demo y en nube (incluido stock sin doble conteo y sin conexión) · responsive 320/360/768/1440 · regresión completa de las suites anteriores.

---


## 4.23 TRASPASOS DE FONDOS CONTROLADOS, DETALLE DE COBROS DIGITALES Y EXPEDIENTE DIGITAL DE LA TRANSACCIÓN (V26.7)

**Estado: ESPECIFICACIÓN CORREGIDA Y ESTRUCTURADA. Nada de lo nuevo de 4.23 está implementado al 2026-10-19** (matriz 4.23.0). Nace del documento de ajuste «Cajas, Transferencia de Fondos y Trazabilidad Transaccional». Es **aditivo**: extiende 4.5, 4.14, 4.20 y 6.10 sin reemplazarlos. Con sus banderas apagadas el comportamiento es **exactamente** el de hoy. Es la **prioridad de entrega** del sistema del cliente (4.23.14).

**Objetivo.** (1) Que sólo quien tenga permiso explícito pueda mover fondos entre cajas, también con cajas **cerradas**, sin alterar nunca un cierre sellado. (2) Que cada cobro digital (transferencia, tarjeta, QR/billetera) guarde su **detalle de comprobante** para conciliar con el banco o el proveedor. (3) Que cualquier venta, cobro o movimiento se pueda abrir en un **Expediente digital** con todo su recorrido. (4) Que los comprobantes de traspaso y los detalles de cobro queden en tablas **sólo-agregar** en el servidor.

**Principios (no se negocian).**
1. **Una sola fuente de verdad:** se **extiende** el registro de traspasos que ya existe (`S.transfers`, colección `ctransf`); no se crea un segundo libro de traspasos ni una segunda pantalla.
2. **El cierre sellado no se toca.** Lo que ocurre después de cerrar se registra en registros aparte, vinculados al cierre (lección de la sección 14: «no meter datos nuevos dentro de un cierre sellado»).
3. **La venta ya hecha no se edita.** Los detalles de cobro viajan en un registro propio y versionado, vinculado a la venta; las correcciones son versiones nuevas, nunca un `UPDATE`.
4. **Nada se inventa:** estado «acreditada», comisión, retención, número de asiento o IP sólo se muestran si hay una fuente fiable; si no, «sin dato» o «no activado». Sin conexión no se afirma ninguna confirmación de un tercero.
5. **Dinero en centavos enteros** (`bigint`/`numeric(14,2)`), fechas en UTC con visualización en `[ZONA_HORARIA]`, el servidor es la fuente de la hora oficial.
6. **Datos personales y de pago con mínimo necesario:** nunca número completo de tarjeta, vencimiento, CVV, PIN ni banda; titular ordenante cifrado y enmascarado; todo con RLS, `tenant_id` y prueba cruzada A/B.
7. **Lo que el adjunto pide y choca con lo ya decidido o con la realidad técnica** se resuelve en 4.23.13; no se implementa en silencio ninguna de las dos versiones.

### 4.23.0 Matriz de detección (inspección del código real, 2026-10-19)

Antes de construir se vuelve a inspeccionar el repositorio: esta tabla es el punto de partida, no un sustituto.

| Requisito del adjunto | Estado hoy | Qué hacer |
|---|---|---|
| Traspaso de fondos entre cajas | **Existe** (`xferCreate`, `A.xfer`, `A.xferRev`, `transfersFor`, vista `cajasx`): sólo entre cajas **abiertas**, con módulo de caja principal activo, rubro obligatorio (6.10), motivo ≥ 3 caracteres, idempotente por id, reversa sólo del administrador, auditado | **Completar:** permiso propio, cajas cerradas, autorizante, comprobante, estados, registro con filtros |
| Permiso `PERMISO_TRANSFERIR_FONDOS_INTERNOS` | **No existe.** Hoy basta `close_cash` (arqueo y cierre) | **Agregar** `transfer_funds` en `PERMS` (4.23.1); migración de roles con aviso |
| Traspaso con caja origen o destino **cerrada** | **No existe:** `xferCreate` exige las dos cajas abiertas | **Agregar** (4.23.2) sin tocar el cierre sellado |
| Comprobante interno de traspaso con 8 campos | **No existe.** El traspaso guarda `{id, ts, from, to, fromSess, toSess, amount, rubro, rubroName, motivo, user, rev}`: faltan autorizante, estado de las cajas, moneda, número consecutivo e impresión | **Agregar** (4.23.3) |
| Detalle del cobro digital | **No existe.** `pays[] = {m, a, fee}`: sólo medio, importe y comisión. Medios hoy: efectivo, fiado, mixto, débito, crédito, transferencia, qr, modo, pedidosya | **Agregar** registro `cobro_detalles` (4.23.4); `fee` se reutiliza para la comisión |
| Validadores en la pantalla de cobro | **Parcial:** `payCheck` valida importes, cliente y límite; **no** pide datos de comprobante | **Completar** `payCheck` (un solo punto de validación; lección de 4.20) |
| Captura de datos por API del proveedor | **No existe** integración que devuelva datos de pago al sistema | Sólo carga manual declarada; verificada únicamente con la integración de 4.18 / O.2 cuando exista |
| Expediente digital (drill-down) | **No existe.** Hay lista de ventas, ticket y auditoría general, sin vista de desglose por operación | **Agregar** (4.23.6) reutilizando ticket, líneas (`lr`, `ll`, `lb`), `pays` y auditoría |
| Número de asiento contable | **No existe contabilidad** (no está en el alcance de la ONG) | Mostrar «Contabilidad no activada»; no se muestra número de asiento |
| Audit log inmutable | **Parcial:** `audit()` encadena hash en el equipo (`id, ts, user, action, detail, prev, hash`) y sincroniza como colección `audit` de una sola escritura; el servidor **no** tiene trigger que impida modificarla. Ya existe el patrón `rave_solo_agregar()` (libro de proveedores, ingresos de mercadería) y `arca_comprobantes_inmutable` | **Completar** con tablas sólo-agregar (4.23.8) y usar la tabla de auditoría estructurada (4.23.8) |
| Pestaña «Registro de traspasos» con filtros | **Parcial:** tarjeta «Traspasos entre cajas» dentro de *Cajas* (lista sin filtros) | **Completar** como pestaña con filtros, estados y comprobante (4.23.7) |
| Moneda del traspaso | **No existe** el campo (todo es ARS) | Campo `currency` con `ARS` por defecto; multimoneda **no** está en alcance |

### 4.23.1 Permiso de traspaso de fondos (`transfer_funds`)

- **Clave nueva** `transfer_funds` («Traspasar fondos entre cajas») en `PERMS`; en el adjunto aparece como `PERMISO_TRANSFERIR_FONDOS_INTERNOS`: es el mismo permiso, con la clave técnica en inglés del resto de la matriz. Se agrega a la pantalla *Usuarios y permisos* y a la matriz de roles.
- **Bloqueado por defecto.** Sólo el administrador lo tiene siempre. Supervisor, mostrador, operador y cualquier rol personalizado **no** lo reciben salvo que el administrador lo tilde (por rol o, si el sistema ya admite permisos individuales, por usuario). Otorgarlo o quitarlo queda auditado (`PERMISO_OTORGADO` / `PERMISO_QUITADO`, usuario, rol y quién lo hizo).
- **Bandera `xfer.strict`.** Con la bandera encendida, `xferCreate`, `A.xfer` y la recepción exigen `transfer_funds` en lugar de `close_cash`. **Migración de datos existentes (no rompe lo anterior):** el primer ingreso del administrador tras actualizar muestra qué roles tenían hasta ahora la capacidad (los que tienen `close_cash`) y ofrece, con un botón explícito y auditado, «Otorgar a los roles que ya traspasaban». Nada se otorga en silencio. En el sistema del cliente se enciende al entregar, después de ese aviso; en la demo nace encendida con roles de ejemplo.
- **Validación en el servidor:** `sincronizar()` rechaza la colección `ctransf` (y los eventos de traspaso) cuando el usuario no tiene `transfer_funds`, igual que hoy rechaza otras colecciones por rol (`rave_puede_escribir`). El permiso se lee de la configuración de roles ya sincronizada; si el servidor aún no la tiene disponible por usuario, se agrega una función `rave_tiene_permiso(tenant, usuario, permiso)` en la migración 11. Ocultar el botón no es un control.
- **Autorizante.** El emisor necesita `transfer_funds`. Además se exige un **usuario autorizante** distinto del emisor, con rol administrador, cuando se cumple cualquiera de estas condiciones (todas configurables, por defecto encendidas): (a) alguna de las dos cajas está **cerrada**; (b) el importe supera `xfer.approvalOver` (centavos; vacío = nunca por importe); (c) se trata de una reversa; (d) — se trata de una reversa. El autorizante se identifica con su PIN o clave en el momento (se reutiliza el mecanismo de PIN de supervisor del kiosco/ingreso, sin crear otro) y queda registrado con el **método** (`permiso_propio`, `pin_admin`, `clave_admin`). Si el emisor es administrador y ninguna condición exige un segundo usuario, el autorizante es él mismo y el método `permiso_propio`.
- **Límite declarado:** la comprobación del PIN del autorizante ocurre en el equipo; el servidor verifica que el autorizante exista, sea administrador activo del comercio y distinto del emisor cuando corresponda, pero no puede probar que se tipeó el PIN.

### 4.23.2 Traspaso con cajas cerradas: fondo en tránsito y saldo inicial sugerido

**Regla de oro:** el cierre sellado, su arqueo y su hash **jamás** se modifican. Un traspaso posterior se guarda como registro propio, vinculado al cierre (`from_closure_id` / `to_closure_id`) y aparece en la ficha del cierre en una sección separada, **«Movimientos posteriores al cierre»**, fuera de la foto sellada.

**Estados del traspaso** (la máquina de estados vive en eventos sólo-agregar, 4.23.8; el comprobante no cambia):

| Estado | Cuándo | Efecto sobre el efectivo esperado |
|---|---|---|
| `completado` | Origen y destino **abiertas** (comportamiento de hoy) | Resta en origen y suma en destino en el acto |
| `en_transito` | Destino **cerrada** (u origen cerrada y destino abierta con recepción pendiente) | Sale del origen; **no** suma al destino hasta ser recibido; se muestra como «Fondos en tránsito» |
| `recibido` | El destino confirma la recepción con el importe | Suma al esperado del turno abierto del destino |
| `recibido_con_diferencia` | El importe recibido difiere del enviado | Suma lo recibido; la diferencia queda registrada y auditada (nunca se absorbe en silencio) |
| `devuelto` | El destino rechaza o no corresponde | Vuelve al origen mediante un traspaso inverso vinculado |
| `revertido` | El administrador corrige | Contraasiento: un comprobante nuevo de reversa vinculado al original (`rev_of`); el original no se edita |

**Casos:**
1. **Origen abierta, destino abierta:** `completado` (hoy). Se agrega comprobante, autorizante y estado de cajas.
2. **Destino cerrada** (origen abierta): `en_transito`. Modo configurable `xfer.closedMode`:
   - `transito` (**por defecto**): el fondo queda pendiente hasta que quien abra el próximo turno de esa caja lo **reciba** explícitamente (confirmando importe). Antes de recibir no cuenta en su esperado.
   - `saldo_inicial`: al abrir el próximo turno, el importe se integra **automáticamente** al *saldo inicial sugerido* y la apertura lo muestra como «incluye traspaso N.º …». Requiere autorizante.
3. **Origen cerrada** (el efectivo ya fue declarado en el cierre): se trata como un **retiro posterior al cierre** del fondo retenido de esa caja. Requiere autorizante. No cambia el cierre; reduce el **saldo inicial sugerido** del próximo turno de esa caja y se muestra en «Movimientos posteriores al cierre».
4. **Ambas cerradas:** permitido con autorizante obligatorio; el origen se trata como en 3 y el destino como en 2.

**Saldo inicial sugerido del próximo turno.** `sugerido = efectivo declarado en el último cierre de esa caja − retiros posteriores al cierre + traspasos recibidos (según closedMode)`. Si el cajero abre con otro importe, la apertura lo permite pero registra la **diferencia de apertura** con motivo y la audita (hoy la apertura es un importe libre sin referencia).

**Invariante contable (prueba de propiedad):** para todo traspaso, `importe enviado = importe recibido + en tránsito + diferencias registradas + devuelto`. El dinero no aparece ni desaparece. Los «fondos en tránsito» tienen alerta de antigüedad (`xfer.transitAlertH`, horas; sin valor por defecto inventado: lo define el dueño) y se listan en el Resumen y en la lista de pendientes de la apertura.

**No es ingreso ni gasto:** el traspaso es un movimiento interno; no suma a ventas, gastos ni ganancia. Conserva el rubro obligatorio de 6.10 (clasificación financiera), y los reportes de rubro lo muestran como «Traspasos internos», aparte.

### 4.23.3 Comprobante interno de traspaso («Boleta de Movimiento de Fondos»)

Se genera automáticamente al crear el traspaso. Campos obligatorios (los 8 del adjunto, con su resolución técnica):

| # | Campo | Detalle |
|---|---|---|
| 1 | **ID del movimiento** | `id` único e idempotente (uid) + **número visible por caja de origen** `T-<caja>-<n>` (consecutivo sin saltos dentro de esa caja, como los tickets «2-15»); el servidor impone `unique(tenant_id, caja_origen, n)` y marca huecos. Ver 4.23.13 (consecutivo global vs. sin conexión) |
| 2 | **Fecha y hora exactas** | `ts_equipo` (UTC) **y** `ts_servidor` (UTC, la oficial); si difieren más de un umbral, se marca «hora de equipo desfasada» |
| 3 | **Usuario emisor** | id y nombre al momento (instantánea) |
| 4 | **Usuario autorizante** | id, nombre y `método` (`permiso_propio` / `pin_admin` / `clave_admin`); obligatorio según 4.23.1 |
| 5 | **Caja de origen / de destino** | ids y nombres al momento (instantánea) |
| 6 | **Monto y moneda** | centavos enteros `> 0` + `currency` (`ARS` por defecto) |
| 7 | **Estado de las cajas al traspasar** | `abierta` / `cerrada` de origen y de destino, más id de turno abierto o id del último cierre |
| 8 | **Concepto / observación** | obligatorio, mínimo 3 caracteres, saneado (anti-XSS); más el **rubro financiero** (id e instantánea del nombre) |

- **Hash de integridad:** SHA-256 de los campos canónicos + hash del comprobante anterior del comercio (cadena). El comprobante **no se edita ni se borra**; el estado cambia sólo por eventos nuevos y la corrección es una reversa vinculada.
- **Impresión:** ticket de 80/58 mm y A4, con leyenda «DOCUMENTO INTERNO — NO VÁLIDO COMO FACTURA», dos líneas de firma (entrega / recibe), QR o código corto de verificación y los créditos de VINCULAR BUSINESS (regla 11). Se reimprime como «copia» sin generar un número nuevo.
- Cada creación, recepción, diferencia, devolución y reversa genera un evento de auditoría con valor anterior y nuevo.

### 4.23.4 Detalle de cobros digitales (transferencia, tarjeta, QR/billetera)

**Dónde se guarda.** En una entidad propia `cobro_detalles` (vinculada por `sale_id` + índice del pago dentro de `pays[]`), **versionada y sólo-agregar**. La venta y su `pays` no cambian de forma. Cada pago de una venta de pagos mixtos (4.20) tiene su propio detalle: «$ 10.000 efectivo + $ 15.000 QR + $ 50.000 transferencia» produce dos detalles (el efectivo no lleva).

**Campos por medio** (se rotulan en pantalla con su nombre claro; los que el adjunto llama «obligatorios» son los de la columna «Defecto»):

| Medio | Campo | Defecto | Validación |
|---|---|---|---|
| **Transferencia / CBU / CVU** | Banco o entidad de origen (o alias/CBU de origen) | Obligatorio | Texto 2–60 caracteres, saneado |
| | Cuenta de destino (a qué cuenta del comercio ingresó) | Obligatorio | Se elige de las cuentas cargadas en *Medios de pago*; si no hay, texto libre y aviso |
| | N.º de comprobante / operación / transacción | Obligatorio, **no relajable** | 6–40 caracteres alfanuméricos; **único** por (comercio, medio, entidad, número) |
| | Fecha y hora de la transferencia | Obligatorio | No futura; no anterior a `pay.maxAgeH` (configurable) |
| | Titular ordenante (nombre y CUIT/DNI) | Recomendado; obligatorio sobre `pay.ordOver` | CUIT con dígito verificador (`rave_cuit_ok`) o DNI de 7–8 dígitos; **cifrado** |
| **Tarjeta crédito / débito** | Marca (Visa, Mastercard, American Express, otras) | Obligatorio | Lista cerrada editable |
| | Tipo (débito / crédito) y **cuotas** | Obligatorio | Coherente con el medio elegido; cuotas enteras ≥ 1 y dentro del plan de N.3 |
| | N.º de cupón / lote / terminal | Obligatorio | Alfanumérico 1–20 |
| | **Código de autorización** | Obligatorio, **no relajable** | Patrón configurable por adquirente, por defecto `^[A-Za-z0-9]{4,12}$` (el adjunto habla de 6 dígitos: no es universal, `[VERIFICAR con el adquirente]`) |
| | **Últimos 4 dígitos** | Obligatorio | Exactamente 4 dígitos |
| **QR / pasarela** (Mercado Pago, MODO, BNA+, otras) | Proveedor / agregador | Obligatorio | Lista cerrada editable |
| | ID de transacción del proveedor (`payment_id`, `merchant_order_id`) | Obligatorio, **no relajable** | Alfanumérico 4–60; único por proveedor |
| | Estado | Ver abajo | `declarado` (cargado a mano) / `en_proceso` / `aprobado` / `acreditado` / `rechazado` / `reembolsado` |
| | Comisión aplicada y retenciones | Opcional | Sólo desde configuración fiable o dato del proveedor; nunca inventadas |

**Reglas de seguridad y verdad:**
1. **Nunca** se guarda número completo de tarjeta, vencimiento, CVV/CVC, PIN ni banda. Un detector rechaza lo tipeado en cualquier campo de texto que parezca un PAN (13–19 dígitos que pasan Luhn) con un mensaje claro y **sin guardarlo ni dejarlo en logs ni en auditoría**. Los últimos 4 dígitos y el código de autorización son lo máximo permitido; alcance PCI-DSS y marco del adquirente `[VERIFICAR]`.
2. **Estado del QR / pasarela:** hoy el sistema **no consulta** a ningún proveedor, así que todo lo cargado a mano queda `declarado` y se rotula «declarado por el cajero — sin verificar». Los estados `aprobado` / `acreditado` los escribe **sólo** el webhook verificado de la integración (O.2, 4.18); una captura de pantalla, la vuelta del navegador o un mensaje del cliente nunca acreditan. Sin conexión: «pendiente de verificación».
3. **Duplicados:** el mismo N.º de operación o ID de transacción no se acepta dos veces; el cajero ve «ya usado en la venta N.º …» (sin revelar datos de otro comercio). Sólo un supervisor puede autorizar un duplicado, con motivo, y queda en auditoría.
4. **Importe:** se pide el importe acreditado en el comprobante cuando difiere del cobrado; la diferencia se marca (no se redondea en silencio).
5. **Datos personales:** nombre y documento del ordenante, y toda clave sensible, se cifran **antes de salir del equipo** con la misma mecánica que los datos de clientes (`pii` de `COLS`); el servidor no los ve en claro; la API pública nunca los expone; en pantalla se enmascaran (`***1234`) y revelarlos requiere permiso y queda auditado. Finalidad, plazo de conservación y deber de informar `[VERIFICAR con asesor legal — Ley 25.326 y normativa vigente]`.
6. **Los controles de `payCheck` siguen siendo un único punto:** se amplía esa función (no se escribe un validador paralelo) y el servidor revalida estructura, unicidad y permisos al sincronizar.

**Excepción controlada («cobro sin comprobante»).** Si el comprobante no está disponible en el momento (se cayó la red del banco, falta el ticket del posnet), un supervisor puede autorizar cobrar con los campos relajables vacíos, con **motivo** obligatorio. La venta queda marcada `det_pendiente` y aparece en una lista **«Cobros a conciliar»**; completar el detalle agrega una **versión nueva** (no edita la venta). Los campos «no relajables» no admiten excepción. El cierre de caja muestra cuántos cobros digitales quedaron sin detalle.

**Matriz configurable (`pay.detail.on`, apagada por defecto).** En *Medios de pago y financiación* el administrador ve y ajusta, por medio, cada campo como `obligatorio` / `recomendado` / `oculto` (cada cambio con motivo y auditado), salvo los no relajables. En el sistema del cliente se enciende al entregar; los valores por defecto son los de la tabla. Con la bandera apagada, el cobro funciona como hoy.

**Captura por API:** cuando exista integración con un proveedor, los campos que éste devuelva se **precargan y se marcan «verificado»** (bloqueados para edición); los que no devuelva se cargan a mano como `declarado`. No se promete captura automática sin integración real.

### 4.23.5 Pantalla de cobro: comportamiento

- Al elegir Transferencia, Débito, Crédito o QR, el cobro abre un bloque **«Datos del comprobante»** con los campos del medio, validación en vivo, mensajes en castellano claro y botón de cobrar **bloqueado** hasta cumplir los obligatorios (o hasta la excepción de un supervisor). Teclado numérico en pantalla y áreas táctiles de 48 px; ningún campo numérico precarga «0».
- En pago mixto, cada medio digital tiene su propio bloque; el total debe seguir cerrando al centavo (regla de 4.20).
- Atajos: F2/F3 (débito/crédito) y el resto de F1–F12 de 4.2 **no cambian**; el foco pasa al primer campo del comprobante.
- Sin conexión se puede cobrar y guardar el detalle en el equipo; la unicidad se revalida al sincronizar y un conflicto queda visible para resolverlo, no se declara sincronizado.
- El **ticket** muestra, para cobros digitales, medio, últimos 4 dígitos y autorización o N.º de operación (nunca el titular ordenante ni datos internos).

### 4.23.6 Expediente digital de la transacción (drill-down)

**Acceso.** Desde cualquier venta, cobro, movimiento de caja, movimiento de stock, traspaso, nota de crédito, compra o cierre, un botón **«Ver expediente»** abre una vista (modal en celular, panel en escritorio) con enlace compartible interno `#expediente/<tipo>/<id>`. Permiso `audit_read` (administrador y supervisor por defecto) para el expediente completo; el cajero ve el de **sus** ventas sin costos, sin datos de otros usuarios y sin IP. Cada apertura de un expediente con datos sensibles queda auditada (`EXPEDIENTE_VISTO`).

**Contenido** (una sección plegable por bloque; todo lo que no exista aún se rotula «no aplica» o «no activado», nunca vacío ni inventado):
1. **Encabezado:** N.º de comprobante (`2-15`, `T-2-7`…), tipo (ticket interno / factura / NC / traspaso…), caja, turno y usuario, paciente o donante (legajo, documento) y condición fiscal (los datos que la ficha ya tiene; sin dato → «sin dato»), documento fiscal o interno y CAE si lo hay.
2. **Ítems:** código / SKU, descripción, **lote y vencimiento** (cuando exista F3; hasta entonces «sin lote»), ****ciclo de origen** (4.28.3), cantidad y unidad, importe (donación), descuentos, cupón/beneficio, subtotal y total por línea. El costo y el margen se muestran sólo con `view_cost`.
3. **Formas de pago:** cada pago con su medio e importe y, para los digitales, **todos los campos de 4.23.4** (ordenante enmascarado), estado `declarado` / `verificado`, versión del detalle, si quedó `det_pendiente` y los vínculos al ticket y al movimiento de caja resultante. Vuelto y parte fiada separados (4.20).
4. **Impacto contable:** sin contabilidad en la ONG, la sección dice «Contabilidad no activada» y muestra el impacto de **gestión** que sí existe: movimiento de caja, de stock, de cuenta corriente y rubro.
5. **Auditoría:** línea de tiempo con todos los eventos de esa operación (alta, cambios de precio, descuentos, anulación, nota de crédito, reimpresión, cambios de detalle de cobro, traspasos vinculados): fecha y hora, usuario, rol, **dispositivo** (id propio del equipo) y acción, con valor anterior y nuevo. La **IP** sólo la agrega el servidor y sólo se muestra a administradores (criterio de retención `[VERIFICAR con asesor legal]`). Verificación de la cadena de hash de esos eventos.
6. **Documentos vinculados:** venta ↔ nota de crédito ↔ factura ↔ cierre de caja que la incluye ↔ traspasos relacionados.

**Salidas:** impresión A4, PDF por impresión del navegador y CSV con fórmulas neutralizadas; columnas según permiso. Accesible por teclado, con texto alternativo y sin depender sólo del color. Rendimiento: carga el expediente de **una** operación, nunca baja todos los registros al navegador (en la nube, consulta paginada en servidor).

### 4.23.7 Registro de traspasos (pestaña administrativa)

- **Dónde:** *Cajas → pestaña «Traspasos»* (reemplaza la tarjeta simple actual; no se duplica). Visible con `transfer_funds` o `audit_read`; el administrador ve todo; un usuario con el permiso ve los traspasos de las cajas que su rol alcanza.
- **Filtros:** rango de fechas, caja de origen y de destino, **usuario emisor**, **usuario autorizante**, estado (`completado`, `en_transito`, `recibido`, `con diferencia`, `devuelto`, `revertido`), estado de las cajas al traspasar (abierta / cerrada), rango de importe y rubro. Ordenamiento universal (4.15).
- **Indicadores:** total movido en el período, **fondos en tránsito** (importe y antigüedad), cantidad con diferencia, traspasos con caja cerrada. Cada KPI con su fórmula y período.
- **Fila → comprobante:** abre el comprobante (4.23.3) y su expediente (4.23.6); acciones según permiso: recibir, devolver, revertir (sólo administrador), reimprimir, exportar.
- **Exportación** CSV (`;`, UTF-8 con BOM, fórmulas neutralizadas) y A4 imprimible. Tabla accesible; en 360 px se transforma en tarjetas sin desborde.
- **Alertas:** en tránsito sobre `xfer.transitAlertH`, traspasos con diferencia, hora de equipo desfasada y huecos de numeración.

### 4.23.8 Pistas de auditoría inmutables (servidor)

**Tablas nuevas** de la migración `11-traspasos-cobros-auditoria.sql` (aditivas, idempotentes; patrón `rave_solo_agregar()` ya existente):
- `traspasos` — el comprobante. `unique(tenant_id, id)`, `unique(tenant_id, caja_origen, n)`, `amount_cents bigint check (> 0)`, `currency char(3)`, hash y hash previo.
- `traspaso_eventos` — máquina de estados sólo-agregar (`emitido`, `en_transito`, `recibido`, `recibido_con_diferencia`, `devuelto`, `revertido`, `anotado`), con usuario, hora de servidor, importe recibido y nota.
- `cobro_detalles` — detalle versionado (`sale_id`, `pay_idx`, `version`), campos sensibles cifrados, estado de verificación, hash; índice único parcial para N.º de operación y ID de transacción (duplicados).
- `auditoria_eventos` — la tabla de auditoría estructurada de la ONG (`module, action, entity, entity_id, old_value, new_value, reason, user, role, device_id, ip, hash, hash_prev`). Si ya existe cuando se construya esta migración, se **extiende**; no se crea otra (regla de detección).

**Inmutabilidad en la base:**
- `BEFORE UPDATE OR DELETE` con `rave_solo_agregar()` en las cuatro tablas, y `REVOKE UPDATE, DELETE, TRUNCATE` para `authenticated`. Se escribe sólo mediante `sincronizar()` / funciones `SECURITY DEFINER` con `search_path` fijo; **la hora (`ts_servidor`) y la IP las pone el servidor**, no el cliente.
- Cadena de hash por comercio calculada por trigger al insertar, y función `rave_verificar_cadena(tenant)` que devuelve el primer eslabón roto. Pantalla de auditoría con botón «Verificar integridad».
- Una colección nueva exige actualizar `sincronizar()`, su política de lectura, exportación, importación y respaldo (regla de 6.1). Un registro rechazado no traba al resto del lote.
- **RLS en todas** (lectura sólo de miembros del comercio; escritura sólo por funciones), claves foráneas compuestas `(id, tenant_id)`, y prueba cruzada A/B.

**Límite declarado (no escribir «inalterable» sin esto):** la base impide modificar o borrar a los usuarios de la aplicación, pero un superusuario del proyecto o el rol de servicio podrían alterar la base: la defensa adicional son las copias de seguridad automáticas del proveedor `[VERIFICAR plan]`, el hash encadenado que **detecta** cambios y, opcionalmente, anclar el último hash fuera de la base (etapa futura). En el equipo, el encadenado detecta manipulación pero no la impide.

### 4.23.9 Banderas, permisos y configuración

| Elemento | Detalle | Defecto |
|---|---|---|
| `xfer.strict` | Exige `transfer_funds` (4.23.1) | Cliente: encendida al entregar, con el aviso de migración; demo: encendida |
| `xfer.closedMode` | `transito` / `saldo_inicial` (4.23.2) | `transito` |
| `xfer.approvalOver` | Importe (centavos) desde el cual exige autorizante | Vacío |
| `xfer.transitAlertH` | Horas para alertar un fondo en tránsito | Lo define el dueño |
| `pay.detail.on` | Detalle de cobros digitales y validadores (4.23.4) | Cliente: encendida al entregar; demo: encendida |
| `pay.maxAgeH`, `pay.ordOver` | Antigüedad máxima de una transferencia y monto desde el cual el ordenante es obligatorio | Los define el dueño |
| `audit.server` | Auditoría estructurada en servidor (4.23.8) | Encendida con la nube |
| Permisos nuevos | `transfer_funds` · `audit_read` · `pay_detail_edit` (completar detalles pendientes: administrador, supervisor y quien cobró) | Administrador siempre; el resto según 4.23.1 |

### 4.23.10 Modelo de datos y flujo

```
sales (pays[]) ──1:n── cobro_detalles (versión n)          sin editar la venta
cash_sessions ──< transfers (traspasos) ──< traspaso_eventos   sin editar el comprobante
cash_closings (sellado) <── from_closure_id / to_closure_id      sin editar el cierre
auditoria_eventos (entity, entity_id) ──> expediente de cualquier operación
```

Flujo de un traspaso con destino cerrado: `permiso (transfer_funds)` → `autorizante (PIN admin)` → comprobante `T-1-7` (estado cajas: origen abierta / destino cerrada) → evento `en_transito` → *(al abrir el destino)* recepción con importe → evento `recibido` o `recibido_con_diferencia` → cierre del turno del destino lo incluye en su esperado. Cada paso con auditoría, idempotente por id y reintentable sin duplicar.

### 4.23.11 Pruebas obligatorias (números conocidos, calculados de forma independiente)

1. **Permiso:** cajero, mostrador, operador y supervisor **sin** el permiso no ven ni ejecutan el traspaso (interfaz **y** servidor: `sincronizar` rechaza `ctransf`); con el permiso otorgado, sí; quitarlo lo bloquea; cada cambio queda auditado; el aviso de migración lista a los roles que tenían `close_cash` y no otorga nada solo.
2. **Cajas abiertas:** traspaso de $ 10.000 entre dos cajas abiertas → origen −10.000, destino +10.000, comprobante con los 8 campos, hash válido.
3. **Destino cerrada:** destino cerrada con cierre sellado; traspaso de $ 10.000 → `en_transito`, el **cierre sellado y su hash no cambian**, el esperado del destino no cambia hasta recibir; al abrir el turno y recibir $ 10.000 → esperado = apertura + 10.000; recibiendo $ 9.500 → `recibido_con_diferencia` de −$ 500, auditado.
4. **Origen cerrada:** caja con efectivo declarado $ 50.000 al cierre; retiro posterior de $ 10.000 con autorizante → sugerido de apertura **$ 40.000**; abrir con $ 39.000 registra diferencia de apertura −$ 1.000 con motivo; la sección «Movimientos posteriores al cierre» lo muestra y el cierre sigue idéntico.
5. **Ambas cerradas:** autorizante obligatorio; el comprobante guarda ambos estados.
6. **Invariante:** con traspasos aleatorios en todos los estados, `enviado = recibido + en tránsito + diferencias + devuelto` siempre.
7. **Idempotencia y sin conexión:** doble clic y reenvío del mismo lote no duplican el comprobante; dos equipos creando traspasos de la misma caja no repiten número; huecos de numeración se detectan y se informan.
8. **Inmutabilidad:** `UPDATE` y `DELETE` sobre `traspasos`, `traspaso_eventos`, `cobro_detalles` y `auditoria_eventos` son **rechazados por el servidor**, también con la sesión de un administrador y desde PostgREST; la cadena de hash es válida; alterar un eslabón se detecta con `rave_verificar_cadena`.
9. **Detalle de cobro:** transferencia con todos los campos → válida; sin N.º de operación → bloquea; N.º repetido → rechazado y sólo un supervisor lo autoriza con motivo; fecha futura y fecha vieja rechazadas; CUIT con dígito inválido rechazado; tarjeta: últimos 4 dígitos de 3 o 5 cifras rechazados; **un PAN de 16 dígitos con Luhn válido tipeado en cualquier campo se rechaza y no aparece en datos, logs, auditoría ni exportaciones**; autorización fuera del patrón rechazada; QR manual queda `declarado` y **nunca** `acreditado`.
10. **Pago mixto:** venta de $ 75.000 = $ 10.000 efectivo + $ 15.000 QR + $ 50.000 transferencia → el expediente lista los 3 medios, con detalle del QR y de la transferencia; el efectivo esperado de la caja suma **sólo** $ 10.000; el total cierra al centavo.
11. **Excepción:** cobro sin comprobante con supervisor y motivo → venta `det_pendiente`, aparece en «Cobros a conciliar»; completar el detalle crea la **versión 2** y la venta no cambia; los campos no relajables no admiten excepción.
12. **Expediente:** una dispensación con donación, pago mixto y nota de crédito muestra encabezado, ítems, pagos, auditoría y vínculos correctos; dice «Contabilidad no activada» (no inventa asiento); el cajero no ve costos ni IP; abrirlo queda auditado; CSV con fórmulas neutralizadas.
13. **Registro de traspasos:** cada filtro (fecha, caja, emisor, autorizante, estado, importe, rubro) devuelve el conjunto esperado sobre un conjunto de datos conocido; KPIs y exportación coinciden con el cálculo independiente; 360 px sin desbordes.
14. **Seguridad y aislamiento:** RLS A/B en todas las tablas nuevas, RPC y exportaciones; `tenant_id` manipulado; XSS en motivo, banco, titular y observaciones; ordenante cifrado (no aparece en claro en la base, la API pública ni el menú); IDOR sobre `#expediente/…`; límites de intentos de PIN.
15. **Regresión y forma:** con las banderas **apagadas** el comportamiento y las suites previas no cambian; encendidas y apagadas en la misma base (el estado anterior carga sin errores, los traspasos viejos se leen con valores por defecto); cierres sellados anteriores intactos y verificables; sincronización idempotente; 320/360/768/1024/1440 sin desbordes y con áreas táctiles medidas con números (≥ 44/48 px); consola sin errores; `file://` y `https`.

### 4.23.12 Criterios de aceptación

- Migración `11` aplicada y probada **dos veces**: sobre base nueva y sobre la base con datos, con respaldo previo y restauración verificada; pruebas de 4.23.11 verdes; **regresión completa verde** con banderas apagadas y encendidas; revisión independiente de seguridad (permisos, PAN, cifrado del ordenante, inmutabilidad); documentación y publicación en el repositorio de la ONG y en la demo. Nada se declara «100 % funcional».
- **Dependen de terceros:** adquirentes y procesadoras (formato del código de autorización, N.º de cupón, terminal), bancos y billeteras (formato de comprobantes), integración con Mercado Pago / MODO / BNA+ para verificar estados (O.2, 4.18), asesor legal (datos personales, conservación, PCI-DSS), contador (asientos de F7).
- **Fuera de alcance:** conciliación bancaria automática (importar extractos), multimoneda, verificación del comprobante contra el banco, captura automática sin integración, anclaje externo del hash, pantalla del cliente con estos datos.

### 4.23.13 Contradicciones o puntos técnicos del adjunto y decisión tomada (regla 2 de la sección 2)

| El adjunto pide | Choca con | Decisión por defecto (configurable) |
|---|---|---|
| `ID_Movimiento` único **y consecutivo** | El sistema funciona sin conexión con varios equipos: un consecutivo global sin huecos requiere servidor | `id` único idempotente + número consecutivo **por caja de origen** (como los tickets); el servidor impone unicidad y detecta huecos (4.23.3) |
| Traspaso permitido con cajas cerradas | El cierre sellado es inmutable (4.5) | El cierre no se toca: «fondo en tránsito» o saldo inicial sugerido, en registros aparte (4.23.2) |
| Sólo con permiso explícito del administrador | Hoy basta `close_cash` | `transfer_funds` + `xfer.strict` + aviso de migración; nada se otorga en silencio (4.23.1) |
| Autorizante «por token/clave de un administrador» | La verificación del PIN ocurre en el equipo | Se registra método y administrador; el servidor valida existencia, rol y que sea distinto del emisor; límite declarado |
| Datos de cobro **obligatorios** | Velocidad del mostrador, red caída, comprobantes que no existen aún | Matriz configurable; «cobro sin comprobante» con supervisor y motivo; campos no relajables (N.º de operación, autorización, ID del proveedor) |
| «Captura por API» | No hay integración que devuelva datos de pago | Carga manual `declarado`; `verificado` sólo con integración real |
| «Estado en tiempo real: Aprobada / Acreditada» | Sin conexión y sin consulta al proveedor no se puede saber | No se afirma; solo el webhook verificado acredita (O.2) |
| «Comisión y retenciones teóricas» | No inventar tasas (N.3) | Sólo con datos fiables de configuración o del proveedor; si no, vacío |
| «Código de autorización de 6 dígitos» | Varía según adquirente | Patrón configurable (`[VERIFICAR con el adquirente]`) |
| «Últimos 4 dígitos» | PCI-DSS | Sólo últimos 4 + detector de PAN que rechaza y no guarda |
| Titular ordenante (nombre y CUIT/DNI) | Datos personales (Ley 25.326) | Cifrado en el equipo, enmascarado, acceso auditado, conservación `[VERIFICAR]` |
| «Número de asiento contable generado automáticamente» | No existe contabilidad (fuera del alcance de la ONG) | Se muestra «Contabilidad no activada» |
| «IP / Dispositivo» en la auditoría | Datos personales; el navegador no conoce su IP pública | Dispositivo = id propio del equipo; IP sólo agregada por el servidor  |
| Tabla «inmutable» | Superusuarios del proyecto | Triggers sólo-agregar + `REVOKE` + hash encadenado; límite declarado (4.23.8) |
| «Pestaña de registro de traspasos» | Ya hay una tarjeta con lista | Se extiende como pestaña con filtros, no se duplica |
| Moneda del traspaso | El sistema es monomoneda (ARS) | Campo `currency = 'ARS'`; multimoneda fuera de alcance |

### 4.23.14 Orden de construcción (prioridad de entrega)

La decisión de qué se construye es del dueño; el orden recomendado, cada paso con **regresión completa verde y publicación** (ninguno deja el sistema a medias) y todos en la **migración 11**:

| Paso | Contenido | Depende de |
|---|---|---|
| G1 | Permiso `transfer_funds` + `xfer.strict` + aviso de migración; comprobante con 8 campos e impresión; estados y cajas cerradas (tránsito / saldo sugerido); pestaña «Traspasos» con filtros | — |
| G2 | Detalle de cobros digitales: registro versionado, validadores en `payCheck`, matriz configurable, excepción y «Cobros a conciliar», detector de PAN, cifrado del ordenante | G1 no; puede ir en paralelo |
| G3 | Expediente digital + auditoría estructurada del servidor (`auditoria_eventos`, `rave_verificar_cadena`) + tablas sólo-agregar | G1 y G2 (usa sus datos) |

Antes de cada paso: inspeccionar (sección 12), listar supuestos, escribir las pruebas junto con el código. **Preguntas que se hacen una sola vez y juntas** (se hacen junto con las preguntas de 4.27.8): ¿modo de caja cerrada `transito` o `saldo_inicial`? · ¿importe desde el cual se pide autorizante? · ¿horas de alerta de fondo en tránsito? · ¿qué campos de cada medio digital son obligatorios en el mostrador? · ¿antigüedad máxima aceptada para una transferencia? · ¿quién puede ver el expediente completo y los datos del ordenante? · ¿qué cuentas bancarias y proveedores de QR usa el comercio?

---

## 4.24 DETALLE DE LAS OPERACIONES DE LA CAJA, CAJAS SIN LÍMITE DE OPERACIONES Y ADMINISTRACIÓN DE LOS SOCIOS DEL CLUB (V26.8, versión ONG)

**Estado: ESPECIFICACIÓN.** Dos pedidos: (A) que en **Caja → «Operaciones de esta caja»** (dispensaciones, donaciones, ingresos y egresos) se pueda ver el **detalle completo de cada operación** con los movimientos que generó, y que una caja **no tenga límite** de operaciones por turno; (B) que el **administrador pueda editar y borrar** a los socios/pacientes del Club. Es **aditivo**: extiende 4.5, 4.6 y 4.23; con sus banderas apagadas el comportamiento es el actual.

### 4.24.0 Matriz de detección
Antes de construir se inspecciona el repositorio. Si la tabla de operaciones de la caja ya existe, se **completa** (no se crea otra pantalla); si la edición/baja de socios ya existe, se completa con las reglas de abajo. Una sola vista `operationDetail` (el expediente de 4.23.6 la amplía; no se hacen dos).

### 4.24.1 «Operaciones de esta caja» con detalle
**Tabla:** N.º (`2-15`), hora, tipo (dispensación / donación / ingreso / egreso / reintegro / nota de crédito), paciente o donante (o «anónima»), ítems, medio(s) de pago, documento (comprobante interno / Factura C / nota de crédito), estado, importe y acciones (*Ver detalle*, *Cobro* si está pendiente, *Anular* con permiso `void`). Toda la fila se abre con clic, toque o Enter.
- **Filtros y búsqueda** (sin alterar otras pantallas): tipo, estado, medio, persona, usuario, rango de horas, N.º o importe. Orden universal (4.15).
- **Totales de la sesión** siempre visibles y que **cierran con el arqueo**: por tipo, por medio y por estado; anulados y notas de crédito aparte (no suman).
- **Sin tope:** no se recorta ni se pagina de forma que oculte operaciones; si hay muchas, desplazamiento virtual o paginación con total visible.
**Detalle (`operationDetail`):** modal en celular y panel en escritorio. (1) Encabezado: N.º, fecha y hora, caja, turno, usuario, persona (legajo, documento si existe) y documento (con CAE si lo hay). (2) Ítems: código, descripción, **lote y ciclo de origen**, cantidad y unidad, importe, descuentos, donación; el costo sólo con `view_cost`. (3) Pagos: cada medio con su importe, vuelto y parte a cuenta (4.20). (4) **Movimientos que generó:** caja por medio (con su rubro), stock por línea en unidad base, cuenta corriente, sellos o cupones del Club, y nota de crédito/anulación vinculadas, con usuario, fecha y hora. (5) Línea de tiempo de auditoría. **Datos de salud:** el detalle de una dispensación muestra lo mínimo necesario según el rol y su apertura queda auditada.
**Permisos:** el cajero ve las operaciones de **su** sesión abierta, sin costos; supervisor y administrador ven todas las cajas. Todo dato se escapa (anti-XSS); CSV con fórmulas neutralizadas; 360 px sin desbordes y táctiles de 48 px.

### 4.24.2 Las cajas no tienen límite de operaciones por turno
Una caja puede hacer **todas las operaciones que necesite** en su turno: sin tope de cantidad, de líneas, de importe acumulado, de ingresos y egresos ni de cobros a cuenta; quedan permitidas dispensar, donar, ingresos y egresos con rubro, reintegros, notas de crédito, anulaciones (con `void`) y, con `transfer_funds`, traspasos. Lo que sigue vigente son **reglas de negocio**, no límites de la caja: stock y lote (no negativo), tope de entrega por persona, permisos y validaciones de cobro. La numeración por caja (`2-15`) sigue creciendo sin reiniciarse ni repetirse entre equipos. Único límite técnico admitido: rendimiento, que **se mide** (apertura, listado, arqueo, cierre sellado, sincronización en lotes de 200 y exportación con miles de operaciones, sin recortar datos). El cierre sellado incluye **todas** las operaciones de la sesión. Una alerta opcional de efectivo acumulado (sugerir retiro) no bloquea.

### 4.24.3 Socios/pacientes del Club: edición por el administrador
- **Quién:** el administrador (`config`) edita cualquier socio. La edición básica (nombre, apellido, observaciones) conserva el permiso `customers`; **WhatsApp, documento, fecha de nacimiento y consentimientos** requieren administrador o el permiso `customers_admin`, validado **en el servidor**.
- **Validaciones (las del alta, un solo validador):** fecha de nacimiento con su validador (21/05/1990 es válida; año de 4 cifras primero); WhatsApp normalizado a +54 9 y comparado por los **últimos 10 dígitos**; si pertenece a otro socio se ofrece **fusionar** con vista previa (nunca se pisa en silencio); menor de 18: sin beneficios ni comunicaciones comerciales.
- **Consentimientos:** el administrador puede **revocarlos**; **otorgar** uno exige **constancia** escrita (cómo y cuándo lo dio el titular), con origen «administrador», versión del aviso, fecha y motivo.
- **Sellos y cupones no se editan:** se corrigen con un movimiento compensatorio auditado. El N.º de socio no cambia.
- **Auditoría:** `CLIENTE_EDITADO` con campo, valor anterior y nuevo, datos personales **enmascarados**; WhatsApp, correo y documento siguen **cifrados**. La API pública y el menú nunca exponen estos datos.

### 4.24.4 Baja y eliminación por el administrador
Sólo administrador (o `customers_admin`). (1) **Baja (anonimiza):** conserva dispensaciones, donaciones y comprobantes con su identificador interno; borra nombre, apellido, WhatsApp, correo, nacimiento y documento; revoca la tarjeta. (2) **Eliminación definitiva:** sólo si **no hay historial** (dispensaciones, donaciones, cuenta corriente, canjes, documentos fiscales, legajo con historia clínica); si lo hay, el botón se reemplaza por la explicación y la lista de lo que bloquea. Los **datos de salud** y los comprobantes fiscales **no se destruyen** ni se anonimizan sin la política de conservación confirmada `[VERIFICAR con asesor/a legal: Ley 25.326, derecho de supresión y normativa sanitaria]`.
- **Deuda o saldo:** con saldo > 0 se bloquea por defecto; se continúa sólo con decisión explícita y auditada (cobrar, condonar con movimiento compensatorio y motivo, o mantener asociada al registro anonimizado).
- **Confirmación doble:** motivo y escribir el **N.º de socio**; un solo toque nunca elimina. Auditoría `BAJA_CLIENTE` / `CLIENTE_ELIMINADO` sin datos personales en claro.
- **Efectos en cadena:** se revoca la tarjeta (se rota el secreto: QR, código y NFC dejan de validar) y el pase de Wallet si existiera; se cancelan envíos pendientes; se excluye de campañas; una alta pendiente del menú con el mismo WhatsApp se marca «rechazada» para que **no reaparezca**; un equipo sin conexión que suba una edición de un socio eliminado recibe un rechazo visible. Con la nube, la baja se propaga a todos los equipos por lápida y la validación de rol está en el servidor.
- Fuera de alcance: eliminación masiva y deshacer una eliminación definitiva (se recupera sólo de un respaldo).

### 4.24.5 Pruebas obligatorias
1. **Detalle:** turno con una dispensación (2 u de un lote, donación $ 2.000) y una donación anónima $ 1.000: la tabla muestra ambas, el detalle muestra ítems, lote, pagos y **movimientos generados** (caja por medio, stock −2 u, rubro); los totales ($ 3.000) coinciden con el arqueo.
2. **Pago mixto y estados:** efectivo + QR + transferencia muestra tres renglones; anulada y nota de crédito aparte; pendiente ofrece *Cobro*.
3. **Sin límite:** turno con **5.000** operaciones mixtas: el listado las muestra todas, suma del listado = arqueo = cierre sellado; numeración sin saltos con dos equipos; pantalla sin congelarse (tiempos registrados); sincronización idempotente.
4. **Permisos y forma:** cajero sólo su sesión y sin costos; el detalle de un cierre es de sólo lectura; XSS; 320/360/768/1024/1440 sin desbordes; consola sin errores.
5. **Edición de socios:** administrador edita todo; sólo `customers` no cambia WhatsApp/documento/nacimiento/consentimientos (interfaz **y** servidor); 21/05/1990 válida y año de 2 cifras rechazado; WhatsApp duplicado ofrece fusionar; consentimiento sin constancia rechazado; auditoría con valores enmascarados; datos cifrados.
6. **Baja y eliminación:** sin historial se elimina en todos los equipos; con historial sólo baja; con deuda bloqueado; confirmación doble; tarjeta revocada; alta pendiente que no reaparece; edición tardía rechazada; sin permiso, rechazado en el servidor.
7. **Seguridad y aislamiento:** RLS A/B, `tenant_id` manipulado, API pública sin datos de personas, el sello 1 por 24 h y el alta al Club siguen igual (regresión de 4.6). **Regresión** con banderas apagadas y encendidas.

### 4.24.6 Decisiones por defecto
La baja y la eliminación pasan a **administrador** (o `customers_admin`) y se avisa en el primer ingreso tras actualizar (misma mecánica de 4.23.1); «borrar» un socio con historial es baja que anonimiza; otorgar consentimiento exige constancia.

### 4.24.7 Orden de construcción
H1 «Operaciones de esta caja» con `operationDetail` · H2 prueba de volumen · H3 administración de socios (con revisión independiente de seguridad). Cada paso termina con sus pruebas verdes, regresión verde y publicación. **Dependen de terceros:** asesor legal (conservación y supresión de datos).

---

## 4.25 TARJETA DEL CLUB PORTÁTIL: GUARDARLA, VOLVER A VERLA Y RECUPERARLA (V26.10)

**Estado en la ONG: ESPECIFICACIÓN a verificar con la matriz 4.27.0** (en el sistema de referencia del 26F figuraba implementado; en la ONG se inspecciona el código y se completa lo que falte). Corrige un error real: el cliente **no podía guardar su tarjeta ni volver a verla** (si se borraba el almacenamiento del navegador o cambiaba de celular, la perdía). Es **aditivo**: no cambia el cálculo de sellos, el antifraude ni los cupones.

**4.25.1 Requisitos**
1. **Guardar en el celular:** botón «Guardar mi tarjeta» que (a) descarga la tarjeta como **imagen PNG con su QR**, (b) ofrece compartirla (Web Share con archivo; si no existe, descarga) y (c) pide al navegador **almacenamiento persistente** (`navigator.storage.persist`). Además la tarjeta se **replica** en IndexedDB (espejo) para sobrevivir a la limpieza de `localStorage`.
2. **Volver a verla:** al abrir el menú, si falta la tarjeta en `localStorage` pero existe el espejo, se restaura sola. Sin ninguna de las dos, el menú ofrece «Recuperar mi tarjeta».
3. **Enlace personal de la tarjeta (`#tarjeta=…`):** el administrador lo genera desde la ficha del cliente («Enlace de la tarjeta»), con copiar y envío por WhatsApp (`wa.me`). Al abrirlo en otro celular, la tarjeta se importa y queda guardada. **Es una llave:** quien lo tenga puede sellar con esa tarjeta; se advierte «no lo compartas». **Regenerar/anular un enlace ya entregado NO está implementado** (mejora pendiente: rotar el secreto de la tarjeta).
4. **Pedido por WhatsApp:** el cliente sin tarjeta puede pedirla al local con un mensaje prearmado; el local responde con el enlace del punto 3. No se otorgan sellos por pedirla.
5. **Wallet (Apple/Google):** sigue **pendiente de certificados y cuentas del comercio** (ver 4.19). El PNG con QR es el sustituto honesto mientras tanto; nunca se afirma que la tarjeta está en la Wallet.
6. **Nube:** el alta del Club en nube replica el espejo tras unirse; la recuperación en nube usa `pubCloudCard`/`pubCloudCode` sin exponer el secreto de otros clientes.

**4.25.2 Seguridad y privacidad**
- El secreto de la tarjeta **nunca** va a logs ni a la auditoría: el evento `TARJETA_ENLACE` registra quién y cuándo, **sin el secreto**.
- El enlace usa el fragmento `#` (no viaja al servidor ni a registros de acceso) y se borra de la barra de direcciones al importarse.
- El sello sigue validándose en el mostrador y en el servidor (código con ventana temporal, 1 sello por día por cliente, nonce). Tener la imagen de la tarjeta no permite sellar por sí sola sin el código vigente.
- A un cliente dado de baja no se le puede generar enlace ni importar su tarjeta (`pubCardPortable` devuelve nulo).

**4.25.3 Pruebas obligatorias (`k1.py`, 29 verificaciones):** guardar PNG, espejo en IndexedDB, restauración tras borrar `localStorage`, importación por enlace, secreto ausente de auditoría y de logs, cliente dado de baja sin enlace, pedido por WhatsApp, 320/360 px, textos ES/EN.

**4.25.4 Límites declarados:** recuperación en nube de extremo a extremo **sin probar contra un Supabase real**; Wallet real sin implementar; si el cliente borra todo y nadie le reenvía el enlace, el local debe emitir uno nuevo (por diseño: sin identidad verificada no se entrega la tarjeta).

---

## 4.26 MENÚ PÚBLICO: «MENÚ LOCAL» O «TIENDA CON ENVÍOS» (OPCIONAL POR COMERCIO) (V26.10)

**Estado en la ONG: ESPECIFICACIÓN opcional, apagada por defecto.** Pedido del dueño: que el menú público pueda funcionar **como una tienda online (estilo Tienda Nube)** para la ONG que quiera recibir donaciones o enviar merchandising a otras provincias (para una ONG: merchandising o donaciones online), **sin obligar** a los demás. Es **opcional por comercio** y **aditivo**: por defecto queda en «Menú local» y el comportamiento anterior no cambia.

**4.26.1 Modos (Administración → Menú público → «Tipo de menú público»)**
- **Menú local (por defecto):** carta/catálogo y pedido por WhatsApp, retiro o entrega local, como hasta ahora.
- **Tienda con envíos:** suma al pedido por WhatsApp: **datos de entrega** (nombre, provincia, localidad, dirección, indicaciones), **costo de envío estimado por provincia**, **envío gratis desde un monto**, plazo estimado, transportista informativo, **compra mínima**, y regla para **resto del país** (cotización a convenir o tarifa fija).
- Opciones del modo tienda: retiro en el local, entrega local, tabla de zonas por provincia (24 jurisdicciones), alcohol «no se envía» / «se envía» (por defecto **no**: el alcohol no sale de la entrega local salvo decisión expresa y verificada [VERIFICAR normativa provincial y de transporte]).

**4.26.2 Reglas**
1. El pedido sigue siendo una **solicitud por WhatsApp**, no una venta ni un cobro: el envío mostrado es **estimado** y el POS recalcula precios al cobrar (decisión de arquitectura vigente). Cobro online y cotización de transportistas por API quedan **pendientes de proveedor** (4.18).
2. Montos del envío en **centavos enteros** en la configuración y publicados en pesos; nunca costo, margen ni stock en la API pública.
3. Validación al armar el pedido: provincia obligatoria, dirección completa, mínimo de compra, productos con alcohol bloqueados si el modo lo prohíbe; mensajes claros sin perder el carrito.
4. El mensaje de WhatsApp agrega: ENTREGA, Recibe, Dirección, Indicaciones, Envío y **Total con envío estimado**.
5. Los datos de entrega del comprador **no se guardan en el servidor** por esta función (viajan sólo en el mensaje que el cliente envía); no se listan en el menú.
6. Configuración con borrador/publicación y versión como el resto del menú (P.11); el cambio de modo se audita (`MENU_TIPO`) y sólo lo hace el administrador o rol autorizado.
7. Si el comercio no completa zonas, el modo tienda muestra «a convenir», nunca tarifas inventadas.

**4.26.3 Pruebas obligatorias (`k2.py`, 37 verificaciones):** modo local sin cambios, modo tienda con provincia dentro/fuera de zonas, envío gratis por monto, mínimo, alcohol bloqueado, resto del país, mensaje de WhatsApp, permiso de mostrador denegado, borrador vs. publicado, auditoría `MENU_TIPO`, 320/360 px, ES/EN.

**4.26.4 Límites declarados:** sin pasarela de pago, sin cotización en vivo de Correo Argentino/Andreani/etc., sin etiquetas de envío ni seguimiento; tarifas cargadas a mano por el dueño; normativa de envío de alcohol y de ventas a distancia (botón de arrepentimiento, defensa del consumidor) a verificar con asesor [VERIFICAR].

---

## 4.27 CORRECCIONES PARA LA ONG: VOZ, CLUB, TARJETAS, PROVEEDORES, CAJA Y BANNER DEL DESARROLLADOR (V26.11-ONG)

**Estado: ESPECIFICACIÓN con matriz de detección.** Reúne lo que el 26F pide para el asistente de voz, el Club, las tarjetas, los proveedores y la caja, **aplicado a la ONG**, y lo que hoy **falta o está incompleto** en el sistema de la ONG. Es **aditivo**: con sus banderas apagadas el comportamiento actual no cambia. Donde un texto heredado hable de «cliente», «venta» o «comercio», **en la ONG se lee con el vocabulario de 4.27.1**.

### 4.27.0 Matriz de detección (se vuelve a inspeccionar el código real antes de construir)
| Área | Qué dice el 26F | Estado esperado hoy en el sistema de la ONG | Qué se hace |
|---|---|---|---|
| Asistente de voz | 4.13: `ActionRegistry`, voz y texto, confirmación, auditoría | **No existe** | Construirlo por fases (4.27.2). Texto primero; voz detrás de bandera |
| Club | 4.6 + 4.25: alta pública, sellos, tarjeta portátil | Existe alta, sellos por QR/código/DNI y tarjeta en el celular; **la cámara no lee el QR** donde `BarcodeDetector` no existe; **sin Wallet** | Completar lectura del QR por cámara con alternativa; Wallet queda apagado (4.19) |
| Tarjetas | 4.19 y 4.25: emisión, reimpresión que invalida, baja, firma | Tarjeta del Club y carnet del personal con alcance parcial | Completar (4.27.4) |
| Proveedores y compras | 4.21: órdenes, ingreso atómico, cuenta corriente | **El módulo no existe** en el sistema de la ONG | Construirlo (4.27.5), con **insumos** de cultivo y dispensación |
| Caja | 4.5, 4.14, 4.20, 4.23, 4.24 | Caja con apertura, cierre y arqueo; **faltan** traspasos controlados, detalle de cobros digitales, cierre administrativo de una caja huérfana, detalle de cada operación y rubro obligatorio en todo movimiento | Completar (4.27.6) |
| Banner del desarrollador | regla 11 | Los créditos dicen **«Rave Holding»** (dato incorrecto para la ONG) y no hay banner con botones | **Corregir a VINCULAR BUSINESS** y agregar el banner (4.27.7) |

Cada fila se reconfirma leyendo el código. Si algo ya existe y funciona, **no se toca**; si está incompleto, se completa; si no existe, se agrega como módulo.

### 4.27.1 Vocabulario y reglas propias de la ONG
- **Personas:** «paciente» (quien recibe) y «socio/a» (quien integra la ONG). **Nunca** «cliente».
- **Operaciones:** «Dispensación» (entrega de producto a un paciente) y «**Donación**» (aporte voluntario en dinero). **Nunca** «venta», «compra», «cobro», «precio» ni «aporte» en pantalla, comprobantes, mensajes, menú, asistente ni exportaciones. El importe de una donación es **voluntario**: no se presenta como precio de un producto.
- **Documento:** el comprobante interno lleva «DOCUMENTO INTERNO — NO VÁLIDO COMO FACTURA». La **Factura C** es opcional y sólo con ARCA habilitado (4.12), con el umbral de identificación `[VERIFICAR]`.
- **Legajo único** por persona (4.28.1), **REPROCANN / Ley N.º 27.350** como marco `[VERIFICAR con asesor/a legal y fuente oficial]`, turnero y planilla de cultivo como en 7.
- Los textos heredados que digan «cliente», «venta» o «comercio» se **traducen** al aplicar: en la base y el código pueden conservarse los identificadores técnicos (`customers`, `sales`), la interfaz no.

### 4.27.2 Asistente de voz y texto (4.13 aplicado a la ONG)
- **Arquitectura:** `ActionRegistry` con lista **cerrada** de acciones (4.13.4), cada una con esquema validado, permiso, política de confirmación y auditoría. El modelo **interpreta**; el servidor valida y ejecuta. Sin acción registrada, sin permiso o con el módulo apagado, la respuesta es «no puedo hacer eso acá» y se explica por qué.
- **Modo texto primero** (siempre disponible, sin proveedor). La **voz** es una bandera por ONG, apagada por defecto, con la **Web Speech API del navegador** como primer proveedor `[VERIFICAR soporte]`. Aviso previo y consentimiento: en algunos navegadores el audio lo procesa un servicio externo. **No se guarda audio**; sólo el texto interpretado, si la ONG lo pide.
- **La voz sólo prepara.** Una dispensación, una donación, un alta, una anulación, un cierre, un borrado o un traspaso se **preparan** en el formulario y los **confirma una persona con un toque**. Nada de dinero ni de salud se ejecuta por haber sido dicho.
- **Datos de salud:** el asistente **no los lee en voz alta** por defecto (interruptor del administrador, auditado); en pantalla muestra lo mínimo según el rol.
- Interpretación visible («Entendí: dispensar 2 g de [variedad] a [paciente]. ¿Confirmás?»), «cancelar», «repetir», rechazo de nombres ambiguos con lista para elegir, y tiempo de espera de la confirmación.
- Costos de IA, límites de uso por usuario y por día, y reintentos acotados. Sin proveedor configurado el resto del sistema sigue funcionando.
- **Pruebas:** frases ambiguas, homónimos de pacientes, usuario sin permiso, acción apagada, inyección de instrucciones en un nombre o nota, confirmación vencida, sin conexión, micrófono denegado, audio no guardado, auditoría de cada acción.

### 4.27.3 Club de socios/pacientes (4.6 y 4.25 corregidos)
- **Alta pública** desde el menú con consentimiento por finalidad (mayores de 18 años; menores sin beneficios ni comunicaciones comerciales). El celular que escanea el QR del menú recibe su tarjeta **en el acto**, aunque no haya sesión del equipo abierta; **jamás se oculta el bloque de la tarjeta por falta de sesión**.
- **Importación de altas** automática, **no destructiva** y con bloqueo para que no corra dos veces; una alta ilegible o duplicada queda «nueva», y sólo se rechazan las inválidas. El socio nace con el **mismo id que la tarjeta** y recibe su N.º.
- **Sellos** (uno por socio cada 24 h, auditado con el medio): **QR rotativo** de la tarjeta (un solo uso), **código de 8 cifras**, **DNI** (opcional, cifrado; ante duplicados se elige por nombre) o **NFC** (Web NFC: sólo Chrome en Android). **Corrección:** el mostrador debe poder **leer el QR con la cámara** (`BarcodeDetector` si existe) o con lector USB; si el navegador no lo soporta, se ofrece el código de 8 cifras sin bloquear.
- `club_estado` nunca devuelve nombre, WhatsApp, DNI ni cumpleaños. Meta y beneficio del Club se publican en el menú por la lista cerrada de campos permitidos. Cupones por audiencia con límite por persona.
- **Edición y baja** por el administrador según 4.24.3 y 4.24.4.
- **Wallet y avisos (4.19):** apagados; la ONG usa la tarjeta web hasta tener cuentas oficiales.
- **Pruebas:** las del Club de 4.6 y 4.25, más lectura por cámara, sin soporte de cámara, y baja de la tarjeta que deja de validar.

### 4.27.4 Tarjetas (Club y carnet del personal)
- **Emisión** con N.º, QR y código; **reimpresión** que **invalida** la anterior (se rota el secreto); **baja** que revoca QR, código y NFC; texto legible por si el código no escanea.
- **Carnet del personal:** foto opcional, nombre, rol y QR de fichaje con el mismo ciclo de vida; impresión en tarjeta o A4 con los créditos de VINCULAR BUSINESS.
- **Firma:** el QR lleva un identificador y una firma/código de verificación que el **servidor** valida; nunca datos de salud en el QR. La etiqueta NFC es fija (la protege el límite de un sello por día y la baja).
- Tarjeta portátil de 4.25: guardarla, volver a verla y recuperarla sin exponer datos de otra persona.

### 4.27.5 Proveedores, insumos y compras (4.21 aplicado a la ONG)
- **Módulo nuevo**, sólo administrador y rol autorizado. Proveedor (nombre, CUIT con dígito verificador, contacto), **órdenes de compra** con estados, **ingreso de mercadería atómico** (`procesar_recepcion`: stock, costo, cuenta corriente y caja en **una** transacción, idempotente), **cuenta corriente** del proveedor y pagos (con rubro financiero obligatorio, 6.10).
- **Insumos** de cultivo y dispensación (sustratos, nutrientes, envases, etiquetas): unidad base, stock mínimo, alertas y consumo asociado al **ciclo de cultivo** (4.28.3).
- Libro de proveedores **sólo-agregar** (`rave_solo_agregar()`): una corrección se hace con un movimiento compensatorio, no editando.
- Lectura de facturas de proveedores con IA (4.8): opcional, en la nube, **sin datos de personas**; el resultado se confirma a mano antes de impactar stock o caja.
- El vocabulario para la ONG: «compra de insumos» es un **gasto de la ONG**, no una operación con pacientes.
- **Pruebas:** orden → recepción parcial → recepción completa; reenvío idempotente; precio y cantidad con decimales; pago mixto a proveedor; recepción sin conexión; cuenta corriente que cierra contra los pagos; permisos; A/B de aislamiento.

### 4.27.6 Caja (4.5, 4.14, 4.20, 4.23 y 4.24 aplicados a la ONG)
- **Rubro financiero obligatorio** en todo movimiento (6.10), con la lista de rubros de la ONG (donaciones, dispensaciones sin importe, insumos, servicios, otros).
- **Pagos mixtos y vuelto** (4.20) con el nombre «Donación»; **detalle de cobros digitales** (transferencia, tarjeta, QR) según 4.23.4.
- **Traspasos de fondos controlados** (permiso `transfer_funds`, fondo en tránsito, comprobante «Boleta de Movimiento de Fondos») según 4.23.1 a 4.23.3.
- **Cierre administrativo de una caja huérfana** (turno abierto por alguien que no volvió): sólo con permiso, con motivo, esperado vs. declarado y auditoría; no se pisa el cierre sellado de otras cajas.
- **Detalle de cada operación y cajas sin límite** según 4.24 (versión ONG). Sellos de cierre y consolidado de la sede como en 4.14.
- **Expediente digital** de cada transacción (4.23.6) y auditoría sólo-agregar (4.23.8).
- **Pruebas:** las de 4.23.11 y 4.24.5, más: caja huérfana cerrada por el administrador, dispensación sin importe que no mueve dinero, donación mixta que cuadra con el arqueo.

### 4.27.7 Banner oficial del desarrollador (VINCULAR BUSINESS)
- **Datos oficiales** (regla 11): **VINCULAR BUSINESS** · celular **(387) 4484132** · `wa.me/5493874484132` · `tel:+5493874484132` · **vincularbusiness@gmail.com** · lema **«Tu idea, en buenas manos.»**
- **Corrección de la ONG:** los créditos actuales dicen «Rave Holding». Se reemplazan en README, menú, ingreso, barra lateral, tickets, tarjetas, instalador y documentos por VINCULAR BUSINESS. Se puede cambiar la presentación (completa, corta, ícono), **no eliminar**.
- **Banner:** imagen `assets/vb-banner.webp` con texto alternativo con los mismos datos, en el ingreso y el menú público, y una fila de **botones reales de al menos 48 px: WhatsApp · Llamar · Correo**. **Si el archivo de la imagen no se entrega, no se inventa ni se dibuja una réplica:** se usa el bloque de texto con los tres botones y se marca «pendiente de imagen oficial».
- En los demás lugares, la línea de texto de los créditos. Ningún enlace sale con datos de personas.
- **Pruebas:** botones con enlace correcto en 360 px, sin desbordes, texto alternativo, impresión de ticket con la línea de créditos, ningún resto de «Rave Holding» (búsqueda en el código).

### 4.27.8 Orden de construcción
J1 banner y créditos (rápido, sin riesgo) · J2 caja (cierre de caja huérfana, rubro, detalle, traspasos) · J3 proveedores e insumos · J4 Club (lectura de QR por cámara) y tarjetas · J5 asistente en modo texto · J6 voz · J7 módulo 4.28 por etapas (legajo → ciclos → Drive → Sheets → huellas). Cada paso termina con sus pruebas, regresión verde y publicación. **Dependen de terceros:** asesor legal (datos de salud, biometría, supresión), ARCA (Factura C), cuenta de servicio de Google, lector de huellas físico, imagen oficial del banner.

---

## 4.28 LEGAJO, BIOMETRÍA, DRIVE, SHEETS Y CICLOS DE CULTIVO (MÓDULO AMPLIADO DE LA ONG)
**Estado: ESPECIFICACIÓN.** Marco: trazabilidad de pacientes, legajos y dispensación/cultivo con Google Drive API v3, Google Sheets API v4 y lector de huellas. **Todo apagado por defecto**, con estados "Pendiente de configuración" honestos.

### 4.28.1 Identidad y modelo de datos
- `legajo_id` único e **inmutable** (legible `L-aammdd-XXXXXX` + UUID interno; UNIQUE NOT NULL). Nunca se reutiliza ni se edita. Documento repetido = ficha nueva marcada "posible duplicado" (sin fusionar sola).
- Campos del registro de trazabilidad (todas las tablas con `tenant_id`, RLS, `created_at/updated_at`, borrado lógico):
  `legajo_id`, `biometric_template_hash`, `drive_folder_id`, `sheet_row_id`, `ciclo_cultivo_id`, `origen_cultivo`, `fecha_registro` (UTC), `usuario_id`, `tipo_seguimiento` (alta, seguimiento, dispensación, consulta, documento, formulario).
- **Auditoría inmutable por operación** (alta, validación biométrica, actualización, consulta, dispensación): tabla sólo-agregar con timestamp UTC, usuario ejecutante y **ID de transacción**, encadenada por hash; sin datos biométricos ni clínicos en el texto del log.
- Cada dispensación y cada seguimiento referencia obligatoriamente su **"Origen de cultivo"** (ciclo); sin ciclo válido, se rechaza en servidor.

### 4.28.2 Lector de huellas (HAL `fingerprint_reader`, módulo `biometria`)
Condiciones de habilitación (todas): modelo físico exacto documentado (DigitalPersona, SecuGen, ZKTeco u otro) con SDK/driver/licencia y SO [VERIFICAR]; **revisión legal aprobada** (dato biométrico de alto riesgo, Ley 25.326 [VERIFICAR con asesor/a legal y AAIP]); consentimiento expreso y revocable del titular; alternativa manual siempre disponible. Hasta entonces: "Pendiente de prueba física / revisión legal", sin simular.
- **Vías técnicas, dichas con honestidad**: (a) **WebAuthn/FIDO2** es lo único nativo del navegador, pero autentica a *quien tiene un autenticador registrado*, no identifica a un paciente entre muchos (no sirve para "poner el dedo y encontrar a la persona" 1:N); sirve para autorizar al **personal**. (b) La **identificación 1:N de pacientes** por lectores DigitalPersona/SecuGen/ZKTeco exige SDK nativo → **agente local** (127.0.0.1, emparejamiento de un solo uso, orígenes en lista blanca, mensajes firmados) o app de escritorio; no existe en el navegador puro.
- **Qué se guarda**: sólo el **hash/plantilla codificada**, nunca la imagen cruda. Si el SDK exige plantilla, se cifra en reposo y tránsito, acceso restringido, retención y borrado definidos, jamás en logs, exportaciones ni IA. Nota técnica: el *hash criptográfico* de una plantilla no sirve para comparar huellas (cada lectura varía); la comparación 1:N la hace el SDK/agente local sobre plantillas cifradas; el campo `biometric_template_hash` guarda la **referencia protegida** (identificador/huella digital de la plantilla cifrada), y la coincidencia se resuelve localmente. [VERIFICAR con el fabricante antes de diseñar el almacenamiento.]
- **Flujo de dispensación**: dedo → coincidencia local → devuelve `legajo_id` → el sistema abre ficha, historia clínica y **estado actual de dispensación**; todo validado además en servidor (usuario activo, rol, tenant, dispositivo autorizado, desafío/nonce anti-repetición).
- **Sin coincidencia**: asociación rápida de la huella capturada a un perfil **recién ingresado por Formulario/Sheet** (con consentimiento en el momento), creando el vínculo `legajo_id ↔ plantilla protegida` con auditoría; nunca se asocia a una ficha existente sin confirmación humana.
- La huella **no es único factor** para recuperar cuentas ni para operaciones financieras críticas. Si el lector falla o falta, nada se bloquea: se identifica por legajo/DNI.
- Pruebas físicas por modelo: coincidencia/no coincidencia, dedo no registrado, sensor desconectado, timeout, repetición (replay), dos personas, borrado de plantilla, offline, auditoría sin dato biométrico.

### 4.28.3 Ciclos de cultivo
- Cabecera: **nombre del ciclo/sala arriba** (ej. "Sala 1 vege") y **código único abajo** (ej. "CU-261020-1TCD3": prefijo CU + aammdd + sufijo aleatorio sin caracteres ambiguos, verificado único con reintentos).
- **Cantidad** (volumen/peso/unidades, con unidad) y **Variedad** (genética/cepa) **editables en tiempo real**; cada cambio conserva valor anterior, motivo y usuario (nada se pisa en silencio); sincronización entre equipos. Ciclo cerrado = sólo lectura.
- Planilla de seguimiento (del 7 ter de ONG v3.0 del sistema): N°, fecha, día, semana, fase, PH/EC, humedad, temperatura, runoff, observaciones, encargado/a; reglas de rango y A4/CSV ya definidas.
- Trazabilidad: lote → ciclo → dispensación → legajo, consultable en ambos sentidos.

### 4.28.4 Google Drive API v3 (cuenta de servicio, por backend)
- **Autenticación por Service Account** (JSON de credenciales) **únicamente en servidor** (Supabase Edge Function / secret manager). **El JSON nunca va al navegador, al repositorio, a logs ni a exportaciones.** El navegador sólo llama a la función del backend con la sesión del usuario.
- Carpeta raíz: `https://drive.google.com/drive/folders/1jNC7tq4Oivfzoob_ZPsFZggDcmVYK47H` (ID `1jNC7tq4Oivfzoob_ZPsFZggDcmVYK47H`), guardado como **configuración del tenant** (no fijo en el código). **Requisito previo a cargo de la ONG:** compartir esa carpeta con el correo de la cuenta de servicio con permiso de editor; sin eso la API devuelve 404/403 y el sistema muestra "Pendiente de configuración".
- Alcance mínimo: la cuenta de servicio sólo ve lo que se le comparte. No usar acceso a todo Drive.
- **Creación automática** de carpeta del paciente al crear el legajo: `/Legajos/{legajo_id}_{DNI}` (si no hay DNI: `{legajo_id}_SD`) dentro de la raíz, **idempotente** (clave = legajo; se ubica por propiedad propia, no por nombre; si existe, se reutiliza). Nunca duplicar carpetas.
- **Carga de documentos/historia clínica** desde el sistema a la carpeta del paciente; se guardan en la base `file_id`, URL y metadatos (nombre, tipo, tamaño, hash, versión, usuario, fecha). Nombres únicos con sello y hash; nunca se sobrescribe ni se borra; mismo hash = no se vuelve a subir.
- Documentos clínicos son datos de salud: sólo los sube quien tiene permiso, con selección explícita, y el enlace no se publica ni se comparte fuera de la ONG. Marcar respaldos como cifrados.
- Estados reales: sin guardar / guardado (fecha, versión) / error / requiere reconfigurar. Nada se afirma guardado sin confirmación de Google. Cola con reintentos acotados y límites de tamaño/cuota.
- Aislamiento: cada tenant tiene su propia raíz y credencial; la función valida tenant en cada operación; una referencia manipulada no puede tocar archivos de otro.
- Migración desde el módulo actual `m-drive.js` (OAuth con Client ID en el navegador): **conservarlo como opción alternativa** si la ONG no usa cuenta de servicio; no mantener dos mecanismos activos a la vez para el mismo tenant.
- Pruebas: carpeta ya existente, homónimos, colisión de nombre, mismo contenido no duplica, error 401/403/404/cuota, desconexión, dos tenants, cuenta de servicio sin permiso. Con Google simulado y luego con cuenta real autorizada.

### 4.28.5 Google Sheets API v4 y Formularios (ingesta)
- Ingreso de datos por **Google Form → Sheet**: Apps Script `onFormSubmit` que envía un **webhook firmado (HMAC con secreto compartido guardado en secretos, nunca en el script público)** a una Edge Function; alternativa: lectura periódica por Sheets API v4 con la cuenta de servicio (la hoja compartida con ella). [VERIFICAR cuotas y límites de Apps Script/Sheets.]
- Validación **antes de crear**: duplicado por DNI y por legajo; si existe, **no se crea otra ficha**: se agrega el formulario como hito de la existente y se marca para revisión; DNI inválido se rechaza con motivo.
- Idempotencia: `sheet_row_id` (hoja + fila + marca de tiempo/ID de respuesta) único; reenvíos del webhook no duplican.
- **Cada formulario = hito cronológico** en la historia del legajo (`tipo_seguimiento = formulario`), sólo agregar, con origen "Sheet/Form", usuario del sistema "integración" y transacción auditada.
- Los datos del formulario son **no confiables**: saneamiento, escape (XSS), neutralización de fórmulas al exportar, límites de tamaño y de frecuencia; nunca ejecutar contenido de celdas.
- Si la hoja o el webhook fallan, la entrada queda en bandeja "pendiente de resolver", sin crear ficha parcial.
- Pruebas: formulario nuevo, DNI duplicado, legajo duplicado, firma inválida, replay, fila repetida, datos con fórmula/HTML, hoja sin permiso, A/B.


---


## 5. MÓDULOS OPCIONALES (aditivos, auditables, apagados por defecto si dependen de terceros)

Reglas comunes: banderas por comercio/rol/dispositivo; migraciones SQL aditivas, versionadas e idempotentes probadas sobre copia; `tenant_id`, RLS y pruebas cruzadas A/B en toda entidad; servidor valida y recalcula; idempotencia; límites de uso; auditoría; dinero en centavos enteros; sin proveedor/credencial/dispositivo → estado "Pendiente de configuración" y el resto sigue funcionando; ninguna integración se declara terminada por tener una pantalla simulada.

- **5.1 Costos, porcentajes y precios:** recargo (precio = costo × (1 + p/100); costo 100 + 30 % = 130) y margen bruto (precio = costo / (1 − p/100); costo 100 + 30 % = 142,86); rechazar margen < 0 o ≥ 100; recalcular en vivo; cambio manual pide confirmación; historial; roles autorizados ven costo.
- **5.2 (no aplica a la ONG):** el módulo mayorista/minorista del 26F está excluido; el stock se lleva en una unidad base.
- **5.3 Tarjetas, cuotas y financiación:** planes de cuotas y promociones con vigencia, interés explícito, costo financiero visible, sin guardar PAN/CVV/PIN, distinguir "registrar medio" de "procesar pago", conciliación e idempotencia `[VERIFICAR normativa]`.
- **5.4 Correo:** SMTP/API en servidor, plantillas versionadas, cola con reintentos, baja y lista de supresión, nunca campañas sin consentimiento.
- **5.5 WhatsApp:** "Abrir WhatsApp" (enlace `wa.me` con texto codificado; no es envío automático) separado de WhatsApp Business API oficial (tokens en servidor, webhooks verificados, plantillas autorizadas `[VERIFICAR]`); estados preparado / abierto / aceptado / entregado / fallido; nunca scraping ni automatizar WhatsApp Web.
- **5.6 Marketing y redes:** calendario editorial, campañas con UTM, adaptadores por plataforma, aprobación humana antes de publicar o gastar, ROI/ROAS sólo con datos verificables.
- **5.7 Lector de huellas:** HAL, verificación local preferida, sin imágenes crudas, consentimiento y alternativa razonable, revisión legal previa, nunca como única autorización de una operación financiera.
- **5.8 Dashboard ampliado y reportes de rentabilidad:** por categoría/rubro, producto, empleado; participación en ingresos (denominador visible, N/D si es cero); comisiones configurables y congeladas por venta; fórmulas y períodos visibles.
- **5.9 Reparto entre socios y reporte de cierre diario para WhatsApp:** módulo apagado por defecto; los nombres y porcentajes son configuración del cliente (ficha L), no del núcleo; texto precargado desde caja y asistencia, cálculo local, vista previa, "Copiar" y "Abrir en WhatsApp", ediciones auditadas, prueba con caso numérico conocido; no toca el cierre sellado.
- **5.10 Recetas, insumos y producción:** unidades con conversión explícita, costo de receta con snapshot versionado, no descontar dos veces (producto terminado e insumos), mermas, lotes y vencimientos.
- **5.11 Gastos detallados:** fecha de gasto/vencimiento/pago, categoría, rubro financiero, proveedor, adjuntos cifrados, recurrentes, presupuesto vs. real; un gasto pendiente no mueve caja; no duplicar factura y pago de caja.
- **5.12 Cobros online (p. ej. Mercado Pago u otro proveedor del país):** credenciales por tenant en servidor, sandbox separado de producción, orden creada por el servidor con referencia externa idempotente, webhook con firma verificada, consulta al proveedor y validación de importe/moneda/cuenta, estados aplicables, sin acreditar por retorno del navegador; offline = pendiente.
- **5.13 Google (Drive, Gmail, Calendar, Sheets, Analytics/Tag Manager, Ads, Business Profile):** tarjetas separadas, OAuth con `state` de un solo uso, scopes mínimos, tokens cifrados en servidor, mapeo de archivos por tenant, sin duplicar al actualizar, conflictos explícitos, desconectar/revocar sin borrar archivos del cliente salvo orden expresa `[VERIFICAR requisitos vigentes]`.
- **5.14 Meta Pixel y Conversions API:** sólo en el menú público (nunca en panel/POS), consentimiento previo y opción de rechazo, `Purchase` sólo con venta real confirmada, `event_id` común para deduplicar, tokens en servidor `[VERIFICAR]`.
- **5.15 Facturación electrónica:** especificación completa en **4.12** (asistente de certificado por ambiente, CAE automático por servidor con cola e idempotencia, QR fiscal en el ticket, simulador sólo para demos).
- **5.16 Extensiones del Core:** atajos de Facturación e Inventario (`ShortcutManager`, reconfigurables, sin combinaciones del navegador), stock mínimo/máximo, agenda de turnos (módulo nuevo); sin depósitos, mesas ni órdenes de trabajo en la ONG.
- **5.17 Asistente conversacional:** la arquitectura y los contratos del `ActionRegistry` se diseñan desde el inicio. La voz y los proveedores externos pueden activarse por tenant con feature flags; el modo texto puede operar como alternativa. Si el proveedor no está configurado, el resto del sistema funciona.
- **5.18 Modelo de caja principal y cajas operativas:** configuración por tenant; modo simple predeterminado; activar jerarquía, distribuciones y consolidación sólo cuando el cliente lo requiere. No activar permisos administrativos por activar el módulo.
- **5.19 (no aplica a la ONG):** la multisucursal está excluida; una ONG = un comercio = una sede.
- **5.20 Ordenamiento universal:** capacidad reutilizable incluida en el sistema, con ordenación por servidor donde corresponda; no es un módulo comercial apagable que pueda dejar tablas sin una interacción básica de ordenamiento.
- **5.21 Gestión de eliminación de inventario:** la UI puede ocultarse por rol, pero la autorización de servidor es obligatoria siempre. Borrado físico y archivo tienen políticas diferentes, según 4.16.
- **5.22 Checkout online e-commerce:** módulo opcional definido en 4.18; feature flag apagada por defecto, con adaptadores separados para pagos y envíos, órdenes con snapshots, estados de pago/entrega separados, webhook validado e idempotente y panel de despacho. Deshabilitarlo no cambia el flujo de WhatsApp. Nunca incluir secretos de pago en el frontend ni declarar cobros aprobados por el retorno del navegador.
- **5.23 Wallet de fidelización y avisos automáticos:** módulo opcional definido en 4.19. Reutiliza el Club y el ledger de sellos/puntos; soporta Apple Wallet/Google Wallet sólo con cuentas y credenciales oficiales configuradas, enlaces protegidos, actualización cuando la plataforma lo permita y fallback de tarjeta web. El motor de avisos funciona mediante outbox/worker, reglas, consentimiento granular, bajas, límites de frecuencia, plantillas versionadas, estados reales por canal e idempotencia. Apagado o sin proveedor, no afecta al resto del sistema. Nunca filtrar tokens, claves de firma, PII ni listas de clientes.

---

## 6. NUBE, SEGURIDAD Y DATOS

### 6.1 Nube (reglas que no se negocian)
En el archivo público sólo van la **URL del proyecto y la clave publicable**; los secretos privados de cualquier proveedor se configuran en el servidor, nunca en el HTML. Un proyecto del proveedor sirve a todos los comercios, aislados por servidor (`comercio_id` + RLS). Con la URL vacía el sistema funciona 100 % local y la pantalla Nube muestra "Pendiente de configuración". Las migraciones SQL son archivos numerados, aditivos e idempotentes **creados en el repositorio antes de indicar que existen** (nunca pedirle al dueño ejecutar archivos inexistentes), probados sobre una copia de la base, con RLS verificada con pruebas cruzadas A/B y backup/restauración antes de producción. `sincronizar()` es la **única puerta de escritura** y aplica en el servidor: lista cerrada de colecciones, roles, movimientos/auditoría/fichadas escritos una vez, **stock calculado sumando movimientos**, cajas cerradas congeladas, un cambio con error se rechaza solo sin trabar al resto. Cliente: sincroniza cada 15 s y 1,5 s después de guardar; sin internet sigue vendiendo ("Sin conexión · N por subir"). Una colección nueva exige actualizar `sincronizar()` y la política de lectura. Cada registro lleva `tenant_id`, `created_at`, `updated_at`, `created_by`, `deleted_at`. Detalle de referencia en **6.11**.

### 6.2 Seguridad (OWASP / ASVS / MASVS)
- Base cifrada AES-256-GCM, llave envuelta por contraseña (PBKDF2-SHA256 ≥ 200.000); datos personales cifrados aparte; la base vive en IndexedDB, nunca en `localStorage`.
- **Anti-XSS:** todo dato (incluido OCR/IA/QR, carrito, rubros, redes, nombres de producto, colores) se escapa o se fuerza a número/lista blanca; las URLs se validan por esquema (`https:`, `tel:`, `mailto:`, `wa.me`) y por dominio esperado de cada red; los colores con `#RRGGBB` estricto; atributos externos con `rel="noopener noreferrer"`. Exportaciones CSV neutralizan fórmulas.
- **CSP** estricta (`default-src 'none'` + lo mínimo, `frame-src` sólo el mapa, SRI en scripts externos), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy y Permissions-Policy desde el hosting.
- Control de acceso por rol **en el servidor**; consultas parametrizadas; validación de toda entrada; límites de intentos con bloqueo creciente; mensajes que no distinguen "usuario inexistente" de "clave incorrecta"; rate limiting en login, soporte y sellos.
- Multitenant: RLS en todas las tablas, vistas, funciones, archivos y webhooks; prueba obligatoria de que el comercio A no lee nada del B.
- Funciones `SECURITY DEFINER` con `search_path` fijo; operaciones críticas (precios, descuentos, anulaciones, pagos, cajas, usuarios, permisos) con validación y auditoría en servidor.
- Secretos: nada en código ni logs; marcadores `<API_KEY>`, `<SECRET>`, `<ACCESS_TOKEN>`; terceros procesados en backend, separados por tenant, tokens cifrados, mínimo privilegio, rotación y revocación. Logs sin contraseñas ni contenido completo de facturas; errores internos sin rutas ni stack traces.
- **Checkout y pagos online (4.18):** los tokens privados, client secrets, secretos de webhook y credenciales de transportistas sólo viven en un gestor de secretos/almacén server-side con control de acceso por tenant, cifrado, rotación y revocación. No usar prefijos `NEXT_PUBLIC_`/equivalentes para secretos; escanear repositorio, bundles, source maps, HTML, exportaciones y logs. Claves públicas sólo si el proveedor las define como publicables. No almacenar datos de tarjeta; usar checkout hospedado/tokenización oficial. El webhook valida firma según documentación vigente, consulta la API del proveedor y compara orden, cuenta, ambiente, monto y moneda; procesa transacciones idempotentes, limita tamaño/frecuencia y no revela información sensible al responder. No confiar en retorno del navegador ni en datos enviados por IA/comprador.
- **Checkout y datos de entrega:** evitar IDOR/enumeración de órdenes, aplicar tokens de consulta impredecibles o autenticación, permisos por función, minimización/cifrado de datos personales, retención definida, protección anti-CSRF donde corresponda, CORS de lista permitida, validación estricta, rate limiting y mitigación de abuso. Validar integraciones de transporte con allowlist y protección contra SSRF; ningún dato público puede configurar destinos de red del servidor.
- **Wallet y avisos automáticos (4.19):** certificados/llaves de firma de Apple y credenciales de emisor de Google sólo server-side; links con tokens aleatorios, de alcance limitado, expirables y no enumerables; endpoints de actualización autenticados; consentimiento por propósito/canal; bajas y listas de supresión; control de frecuencia, rate limit e idempotencia; minimizar datos personales en la tarjeta, mensajes y logs. No considerar un enlace enviado, el saldo renderizado en cliente o un mensaje aceptado por el proveedor como prueba de que la tarjeta se guardó o la notificación se entregó.
- Datos personales clasificados (pública / interna / confidencial / sensible / crítica), mínima información necesaria; registro de bases y plazos de conservación `[VERIFICAR con asesor legal]`.
- Seguridad de la IA: contenido de documentos como dato, esquema JSON estricto, sin herramientas no autorizadas, revisión humana en flujos que lo requieren, tope diario y sin exponer el prompt interno.
- Seguridad del asistente conversacional: entrada de voz/transcripción no confiable; no puede cambiar roles, políticas ni el catálogo de herramientas. Cada herramienta vuelve a comprobar RBAC, RLS, tenant en backend. No usar la respuesta del modelo como autorización ni enviar secretos o datos de otros clientes al proveedor. Minimizar datos y configurar retención/costos.
- Acciones de impacto: precios, descuentos, anulaciones, pagos, cierres, transferencias, borrados, permisos, caja principal y datos confidenciales requieren confirmación explícita y validación backend. La confirmación se asocia al resumen y al identificador exacto de operación para evitar reutilización.
- Aislamiento: toda lectura y escritura sensible se restringe por tenant, incluso en agregaciones, búsquedas, descargas, colas, tareas programadas, logs y acciones conversacionales. No confiar en datos de otro comercio expresados por voz sin verificar la membresía.
- Agente local (cuando exista) sólo en 127.0.0.1, con emparejamiento de un solo uso, orígenes en lista blanca, mensajes firmados y actualizaciones firmadas.
- **Incrustaciones:** si un documento se inserta como cadena en un `<script>` (por ejemplo un menú dentro de `<iframe srcdoc>`), escapar `</script`, `<script` y `<!--` en la cadena; un `</script>` literal dentro de un string JavaScript corta el bloque y el sistema no arranca.

### 6.3 Decisiones de arquitectura (no se reabren sin motivo)
El pedido por WhatsApp del menú es una **solicitud**, no una venta (el POS recalcula). Modelo de movimientos (suma conmutativa) para stock y caja; sin bloqueos que rompan el trabajo sin conexión. CSP con SRI en lugar de nonces (HTML estático). PWA primero; tiendas de apps como etapa posterior. Las rutas de producto ya publicadas se conservan y el slug es un alias.

### 6.11 Nube: arquitectura de referencia (Supabase) y puesta en marcha
**Piezas:** (1) *Auth* por correo y contraseña con "Confirm email" **desactivado** (si no, el alta queda trabada); (2) *Postgres* con RLS; (3) *PostgREST* (RPC); (4) *Edge Functions* para lo que no puede correr en el navegador (CAE fiscal, lectura de facturas con IA); (5) *Storage* privado para comprobantes. Ninguna función de servidor recibe permisos por el sólo hecho de existir: cada una valida el JWT del usuario y su rol en el comercio.

**Configuración en el código:** dos constantes (`CLOUD_URL`, `CLOUD_KEY`) que reemplaza el ensamblado; vacías = nube apagada. La clave `service_role` y cualquier `sb_secret_…` **no se usan ni se escriben** en el HTML; si aparecen en algún repositorio público se reporta y se recomienda rotarlas.

**Pantalla Administración → Nube:** estado (sin configurar · desconectado · sincronizado · sin conexión con N pendientes · error), crear comercio (primer equipo), entrar con correo y contraseña (equipos nuevos), número de caja del equipo, miembros y roles (alta por correo, quitar acceso corta todos los equipos), "Sincronizar ahora", rechazos del servidor con motivo, código de recuperación (se muestra **una sola vez** al crear el comercio y no se cierra sin confirmar que se guardó; se puede regenerar), cerrar sesión.

**Datos:** tabla genérica `registros (comercio_id, coleccion, id, datos jsonb, borrado, actualizado)`; lectura RLS sólo miembros; escritura sólo por `sincronizar()`. Colecciones cerradas (productos, ventas, sesiones/cajas, movimientos de caja y distribución, asignaciones, cierres, movimientos de stock, clientes, cuenta corriente, empleados, fichadas, tareas, cupones, planes, membresías, fidelización, configuración, auditoría y las del módulo vigente; si Checkout Online se habilita, órdenes, líneas/snapshots de orden, cotizaciones/envíos, intentos de pago e historial de estados/eventos; si Wallet/avisos se habilitan, preferencias/consentimientos por canal, reglas y plantillas de notificación, outbox/jobs/eventos de entrega, pases/registros de Wallet y sus estados, cada una agregada explícitamente a la lista blanca y con RLS propia). Las acciones conversacionales persistidas deben pasar por una lista blanca con esquemas y límites; nunca aceptar colecciones arbitrarias desde el modelo. Reglas del servidor: roles (mostrador/operador no editan productos, gastos, personal ni configuración); **auditoría, movimientos y fichadas se escriben una vez**; **una caja cerrada no se modifica** (sólo notas del administrador); campos de seguridad de la configuración (certificados, claves, Access Tokens, client secrets, secretos de webhook, credenciales de transportistas, certificados/llaves de firma de pases, credenciales de emisores Wallet y tokens de autenticación/registro) **se descartan** del payload genérico; esas credenciales usan rutas server-side específicas; tope de tamaño por registro y de cantidad por envío; nombres de colección con lista blanca y formato validado.

**Stock multi-equipo:** el navegador **no envía el stock**: envía *movimientos* (`delta` con motivo). El servidor suma los movimientos en una sola transacción sobre el producto (con bloqueo de fila), de modo que dos cajas que venden la misma botella restan las dos y el total cierra, incluso con stock negativo permitido. El stock que se ve en cada equipo = stock del servidor + movimientos propios aún no subidos. Un producto nuevo sube con stock 0 y un movimiento "saldo inicial".

**Cifrado:** llave de datos (DEK, AES-256-GCM) por comercio, generada en el primer equipo; cada miembro la guarda envuelta con una llave derivada de su contraseña (PBKDF2-SHA256 ≥ 200.000) y una copia envuelta con el código de recuperación. Los datos personales (WhatsApp, correo, DNI, nacimiento) se cifran **antes de subir** y la base local se guarda cifrada en IndexedDB; el servidor no puede leerlos. Cambiar la contraseña re-envuelve la llave; un miembro nuevo recibe la llave de un administrador (clave temporal que debe cambiar al entrar). Sin contraseña ni código de recuperación los datos cifrados **no se pueden recuperar (por diseño)**.

**Sin conexión:** se puede ingresar con correo y contraseña contra la llave envuelta guardada en el equipo en el último acceso; todo cambio se encola y se reconcilia al volver Internet; nunca se muestra como sincronizado lo que no confirmó el servidor. **Cajas y numeración:** cada equipo tiene su caja y su numeración ("2-15"); número de caja único por comercio. **Límite conocido:** dos ediciones simultáneas del mismo registro se resuelven con la última guardada (mejora opcional: versionado optimista en precios y permisos).

**Cliente de nube (as-built, v2.2):** ingreso con Auth por correo y contraseña (REST; la clave publicable va en `apikey`, el JWT del usuario en `Authorization`); llave de datos (DEK) envuelta con la contraseña (PBKDF2-SHA256 200.000) y copia con código de recuperación (20 caracteres, sólo admin); estado local cifrado en IndexedDB (nombre de base propio por cliente: GitHub Pages comparte origen entre repositorios); sincronización cada 15 s y 1,5 s después de guardar, diferencias por huella, lotes de 150, stock como movimientos, rechazos del servidor visibles, cierre de sesión por inactividad (30 min) y al quitar un miembro. Los datos personales de clientes y empleados viajan cifrados (`__pii`). Alta al Club desde el menú público: cifrada en el navegador con la llave pública del comercio (RSA-OAEP + AES-GCM); el equipo la descifra, deduplica por los últimos 10 dígitos del WhatsApp (misma persona + mismo cumpleaños = segunda tarjeta en la misma ficha) e importa como cliente (se importa sola cada 20 s con la sesión abierta, también desde un mostrador). Menú público: instantánea publicada (`menu_publico(slug)`) sin costo ni stock exacto; **con la nube activa la tarjeta del Club se ve sin sesión** (vive en el celular del cliente y consulta `club_estado`), con los cupones para todos y, si es socio, los de socios y cumpleaños; la instantánea publicada lleva sólo la meta y el premio del club (`rave_limpiar_menu` en `09-club-tarjeta.sql`). **Compilación:** `build.py cliente` con `SUPABASE_URL`, `SUPABASE_KEY` (rechaza `service_role`/`sb_secret_`), `RAVE_SLUG` (igual al *slug* del comercio) y `PUBLIC_URL`; sin URL/clave el ingreso dice "Pendiente de configuración". **Límites conocidos:** recargar la página sin internet requiere el HTML en caché (no hay service worker); fotos propias de productos necesitan Storage (fase 2); el último uso de un cupón no es atómico entre equipos; un empleado que olvida su clave se quita y se vuelve a invitar; los reintentos de ARCA corren sólo mientras algún equipo tenga el sistema abierto (sin tarea programada).

**Puesta en marcha (en orden):** 1) opcional y **destructivo**, sólo con respaldo y orden expresa del dueño: script de limpieza de un proyecto anterior; 2) scripts base en orden (base → sincronización → recuperación/soporte → menú público → fiscal → pagos mixtos → proveedores y compras `08-proveedores-compras.sql` → tarjeta del Club `09-club-tarjeta.sql`), pegando el contenido real en el editor SQL; 3) desactivar "Confirm email"; 4) cargar los secretos de las funciones por el canal seguro del proveedor (nunca por chat ni por correo); 5) publicar el archivo con URL + clave publicable; 6) crear el comercio desde el primer equipo y guardar el código de recuperación; 7) agregar equipos y miembros. Pruebas: ver sección 13, ítem 16.

### 6.7 Biometría
Dato de alto riesgo: no habilitar hasta aprobar la revisión legal; sin plantillas en logs/exportaciones; método alternativo siempre disponible.

### 6.10 Rubro financiero obligatorio en todo movimiento
Todo ingreso o egreso que el sistema registre o procese lleva un **rubro financiero válido** (existente, activo, del mismo tenant y compatible con el tipo: "rubro", "compartido" sólo egreso, "cobranza" sólo ingreso). Se exige en interfaz, aplicación, servidor y base (NOT NULL + clave foránea por tenant); offline se revalida al sincronizar; webhooks sin clasificación válida quedan en bandeja técnica sin crear movimiento; los importados exigen mapeo en la vista previa; el cierre sellado incluye la clasificación; las correcciones son movimientos compensatorios con motivo. Pruebas: rubro vacío, inexistente, inactivo, incompatible, de otro tenant; venta, devolución, webhook, offline, importación, concurrencia e idempotencia.

---

## 7. MENÚ PÚBLICO AMPLIADO Y SU ADMINISTRACIÓN

El menú público es anónimo y de sólo lectura; se configura **todo** desde Administración → "Menú público" (nada fijo en el código, salvo el crédito del desarrollador). Si ya existe un menú aprobado por el cliente, se reutiliza tal cual (diseño, carrito, buscador, lightbox) y sólo se le conectan datos públicos, sin tocar su apariencia.

1. **Catálogo en vivo desde el inventario** (rubros con diseño y color, productos publicados, precios, fotos, "sin stock"); la API pública sólo expone nombre, descripción, imagen, categoría y los datos expresamente habilitados (nunca datos de personas).
2. **Encabezado:** logo (WebP/AVIF/PNG/JPG, SVG sólo saneado; derivado a favicon e ícono PWA), datos del comercio, horarios con indicador "Abierto ahora" (sólo si hay horarios cargados), portada y colores de marca.
3. **Frases comerciales y leyendas legales** (plantillas `[VERIFICAR]`, confirmadas por el dueño con registro de quién y cuándo); una leyenda "legal obligatoria" no se desactiva sin motivo auditado; rotación con pausa, `aria-live` y respeto de `prefers-reduced-motion`.
4. **Idiomas ES/EN** con selector por nombre (no banderas), `?lang=`, `lang` y `hreflang`, traducciones editables y revisadas por el dueño; precios no se convierten.
5. **Acceso oculto del administrador** (toques múltiples sobre el logo, pulsación larga, teclas o ruta `#acceso`): sólo abre el formulario de ingreso; la seguridad real es la autenticación y la RLS; la ruta directa queda documentada para accesibilidad; sin pistas en el HTML público.
6. **Compartir** (Web Share con alternativa "Copiar enlace"), **QR del menú** descargable, botón flotante "Volver arriba" que no tapa carrito ni leyendas.
7. **Ubicación y reseñas:** dirección, "Cómo llegar", mapa embebido opcional (apagado por defecto, tras consentimiento, con CSP), enlaces para dejar y ver reseñas; reseñas dentro del menú sólo con API oficial por backend y sin inventar nunca puntajes ni textos.
8. **Club, cupones y tarjeta de fidelización** públicos (ver 4.3 y 4.6), membresías y cupones visibles con su condición. Incorporar botones condicionales “Agregar a Apple Wallet” y “Guardar en Google Wallet”, y opción de solicitar el envío seguro de la tarjeta; mostrarlos sólo cuando el adaptador esté operativo y el socio haya sido autenticado/validado. Mantener la tarjeta web como alternativa. Las preferencias de avisos y la baja de marketing deben poder consultarse sin revelar si existe otro cliente.
9. **Wi-Fi temporal de invitados** (red aislada de la del POS; QR de conexión; clave fija, rotación manual o automática sólo si el equipo lo permite; vigencia; cambios auditados; cartel legal `[VERIFICAR]`).
10. **Redes sociales — lista editable con lugar para agregar más:** cada red con interruptor "Mostrar", tipo (Instagram, Facebook, TikTok, X, YouTube, WhatsApp, LinkedIn, Telegram, Threads, Spotify, sitio web, otra), nombre, usuario y enlace; validación https, sin espacios y **coherencia de dominio con la red elegida**; para mostrarla debe tener enlace; íconos SVG en línea (genérico si falta); X y YouTube vienen precargadas **como ejemplo y apagadas**; sin widgets de terceros (los enlaces no cargan scripts).
11. **Información legal** (privacidad y consentimientos, precios y entregas, botón de arrepentimiento y defensa del consumidor, venta restringida por edad, Wi-Fi) y botón de arrepentimiento que abre el canal configurado y queda registrado.
12. **Créditos del desarrollador (VINCULAR BUSINESS, datos oficiales de la regla 11)** en menú, páginas de producto y PWA, con banner oficial y mensaje prellenado (`wa.me/5493874484132`) que identifica al comercio.
13. **Administración:** secciones (identidad, frases y leyendas, idiomas, bloques y orden, Club, Wi-Fi, ubicación y reseñas, redes, compartir y QR, acceso oculto, SEO/Open Graph, créditos y legales, vista previa y publicación); **borrador y publicación** con versión, usuario, fecha y hash; comparar y **revertir** a la versión anterior; el menú se actualiza sin recargar; sólo admin o rol autorizado (validado en servidor); validaciones al guardar; importar/exportar la configuración con diferencias, modo prueba y reversión.
14. **SEO y rendimiento:** páginas por producto con Open Graph y JSON-LD (sólo con datos existentes), sitemap, PWA instalable, imágenes con `srcset` y carga diferida, accesibilidad AA (teclado, foco atrapado en modales, textos alternativos), 320/360 px sin desbordes.
15. **Dependencias de terceros** (siempre decirlas al cliente): reseñas (API y cuotas), mapa embebido (consentimiento y CSP), rotación automática de Wi-Fi (equipo de red), textos legales, traducciones, widgets de redes.


**Checkout online opcional (integración de 4.18):**
16. **Modo de venta:** configuración por comercio/canal con `whatsapp` como valor por defecto. En modo WhatsApp, conservar exactamente el flujo vigente. En modo Checkout Online, el carrito ofrece “Comprar” y el checkout de datos del comprador → entrega/retiro → pago. Si ambos canales están expresamente habilitados, presentar opciones claras sin duplicar la orden.
17. **Administración de venta y entrega:** incorporar, según rol, configuración write-only de credenciales, prueba de conexión sandbox/producción, retiro local, envío local por tarifa/zona y envío nacional por tarifas configuradas o adaptador oficial. No mostrar la pantalla de producción como “lista” hasta pasar validaciones y una prueba de extremo a extremo.
18. **Panel de órdenes:** listado de órdenes online y etiqueta “Pagado — listo para despachar” únicamente tras verificación server-side del pago. Dirección, contacto, etiqueta y tracking sólo aparecen a roles que los necesitan. Separar pago de preparación/envío; conservar historial.
19. **Publicación segura:** el modo checkout no se publica mientras no haya política de privacidad/devoluciones/entrega revisada, método de entrega cotizable, proveedor de pago configurado, webhook comprobado y pruebas completadas. Si el proveedor no está configurado o falla, mostrar un estado comprensible al administrador y preservar el flujo de WhatsApp.

---

## 8. LEGAL Y CUMPLIMIENTO (país y provincia del cliente)

Pantalla "Legal y cumplimiento" con plantillas **editables y marcadas `[VERIFICAR]`**, registro de quién las confirmó (asesor) y cuándo, y lista de verificación "qué hace el sistema / qué falta y quién lo hace". Para Argentina, como punto de partida a **verificar con asesor y fuente oficial**: protección de datos personales (Ley 25.326 y autoridad de aplicación), defensa del consumidor (Ley 24.240 y normativa de venta a distancia y botón de arrepentimiento), venta de alcohol y tabaco a menores y horarios provinciales/municipales, uso de Wi-Fi/registro de equipos, facturación electrónica y condición fiscal, registro de la base de datos y plazos de conservación. Para otro país/provincia se reemplaza el paquete por el equivalente local. No se inventan números de ley, textos oficiales ni resoluciones; no se imprime `[VERIFICAR]` en tickets ni en el menú público: se confirma antes de publicar.

---

## 9. DISEÑO

Premium, limpio, mucho aire; tipografía sans legible + titulares con serifa; sombras sutiles, bordes de 15–20 px; paleta del comercio (`[COLOR1]`, `[COLOR2]`, neutros). Bento-grid, barra lateral colapsable, barra superior contextual (comercio, caja, estado de nube, periféricos, idioma, usuario). Íconos SVG en línea; ícono propio del producto en pestaña, barra de tareas, celular, instalador y accesos (nunca el globo genérico). Responsive 320/360/768/1024/1440+ sin desbordes (en móvil, la barra de teclas F pasa a estática y los buscadores ocupan todo el ancho). Gráficos con orden fijo, paleta validada, etiquetas directas, tooltips por foco y toque, tabla alternativa, sin ejes duplicados ni tortas; no usar sólo color para comunicar estados (los negativos llevan texto y símbolo).

---

## 10. WINDOWS Y OTRAS PLATAFORMAS

**Windows:** instalador (Go, 64 y 32 bits) con ícono, versión y empresa; sin pedir administrador; instala en carpeta propia; accesos en Escritorio e Inicio (abrir, actualizar, desinstalar); ventana propia del navegador (`--app`) con perfil aparte; actualiza bajando el HTML publicado, validándolo y guardando el anterior sin tocar datos; pregunta antes de borrar datos al desinstalar; acceso opcional con impresión directa (`--kiosk-printing`) que afecta todas las impresiones y requiere decisión. Sin firma digital hasta tener certificado (SmartScreen avisará). Windows 7/8 sin soporte: aviso. **Antes de cambiar el archivo que el instalador descarga, verificar que no se publique una demo encima de una instalación real.** PCs viejas: `[VERIFICAR runtime]`; alternativa: otra PC sirve el sistema por LAN.

**Móviles y tiendas (etapa futura):** PWA instalable; contenedor nativo sólo si se decide publicar. iPhone/iPad: Safari no soporta Web NFC/Serial/USB/Bluetooth. Android: NFC, cámara, Bluetooth, USB OTG. Reglas de tiendas (privacidad, eliminación de cuenta, venta de alcohol/tabaco, cobros de suscripciones) `[VERIFICAR]`. Seguridad móvil (MASVS): claves en Keychain/Keystore, pinning, biometría opcional, cierre remoto, borrado al desvincular.

---

## 11. MATRIZ DE ADAPTACIÓN (ONG)

Este documento es **sólo para ONG**. El rubro se configura en Administración sin tocar los datos; lo que sigue indica qué se prende, qué vocabulario se usa y qué se apaga.

| Tipo de ONG | Prender | Vocabulario | Apagar / notas |
|---|---|---|---|
| **Salud (por ejemplo, cannabis medicinal, Ley N.º 27.350)** | Legajo único, dispensación, donaciones, turnero, planilla y ciclos de cultivo, insumos, Club de pacientes/socios, Drive/Sheets, historia clínica cifrada | paciente, socio, dispensación, donación, legajo | Sin control de alcohol; datos de salud cifrados y con acceso mínimo; sin Pixel ni publicidad; biometría sólo con revisión legal |
| **Comedor / asistencia social** | Entregas con registro de beneficiarios, donaciones, insumos, proveedores, voluntarios (Personal) | beneficiario, entrega, donación | Sin Factura C salvo que se habilite; menú público opcional |
| **Cultura / clubes / educación / ambiente** | Socios con cuotas, membresías, campañas de donación, agenda de turnos, sellos de fidelización | socio, cuota, campaña, donación | Sin control de edad salvo actividades restringidas |

Cada ONG define en la **ficha de particularidades** lo que no es general, como módulo opcional apagado por defecto: rubros internos, cierres a medida, reportes propios, formatos de mensajes. Para cada punto: qué se quiere, quién lo usa, qué datos entran, qué sale y si toca el cierre sellado.

**Capacidades transversales para la ONG:** el asistente por voz/texto reutiliza el `ActionRegistry` y sólo publica acciones compatibles con el módulo, el rol y la configuración; las tablas usan el ordenamiento de 4.15; las cajas se presentan según el perfil configurado (una sede); el borrado de inventario respeta 4.16. La voz no habilita una función que no exista, esté apagada o carezca de permiso. El checkout online (4.18) y la tienda con envíos (4.26) son opcionales y están apagados: el flujo por WhatsApp es el predeterminado.

---

## 12. DETECCIÓN DE LO EXISTENTE (antes de cada cambio)

1. Inspeccioná repositorio, esquema, pantallas, permisos y pruebas. Listá lo que ya existe y su estado.
2. Funciones duplicadas: fusionar. Incompletas: completar. Inexistentes: agregar como módulo con bandera.
3. Nombres únicos: las funciones de módulos distintos comparten el mismo ámbito en un HTML de un solo archivo; buscar duplicados antes de publicar (un `procesarCola` repetido dejó sin cola de impresión a una térmica).
4. Un módulo nuevo se agrega a la lista de ensamblado o no se arma.
5. Colecciones nuevas: actualizar sincronización, lectura, exportación, importación y respaldo. Para V26, contemplar entidades de cajas, sesiones, movimientos/distribuciones, cierres y auditoría, además de cambios de inventario y estado de acciones conversacionales cuando deban persistirse.
6. Un estado persistido de una versión anterior no debe romper la nueva: los campos nuevos se leen con valores por defecto (`!== false`, `|| valor`), no se asumen presentes.
7. Inventariá todas las pantallas, formularios, tablas, botones y servicios de negocio. Creá una matriz de cobertura del `ActionRegistry`: módulo → pantalla → acción disponible → schema → permiso → riesgo → confirmación → operación offline → pruebas. No inventes que una función está cubierta si falta su entrada o su prueba.
8. Para cajas, detectá primero entidades actuales, claves, numeración y flujos. No crees una segunda fuente de verdad para caja, sesiones o cierres. Especificá el plan de migración y el comportamiento de clientes ya existentes en modo simple.
9. Para el ordenamiento, localizá todas las tablas de datos y componentes reutilizados. La aceptación requiere una lista de componentes/tablas cubiertas y excepciones justificadas; no alcanza con implementar un ejemplo.
10. Para el borrado de artículos, identifica todas las referencias históricas y toda ruta de backend. La seguridad no se da por validada si sólo desaparece el botón para el usuario no administrador.
11. Para Checkout Online, detecta si ya existen carrito, solicitudes de WhatsApp, órdenes, pagos, webhooks, clientes y configuración de envío. Reutiliza lo que corresponda sin confundir solicitud de WhatsApp con orden de compra pagable ni registrar dos veces una misma venta.
12. Para wallet y avisos, detecta módulo Club/ledger, consentimientos, proveedor de correo/WhatsApp/SMS, scheduler/worker, colas y auditoría. Reutiliza preferencias, clientes y servicios de comunicaciones existentes; verifica qué estados reporta cada proveedor; no declares automático un flujo que dependa de que el navegador esté abierto.
13. Todo campo nuevo de producto, cliente, venta o cierre se lee con valor por defecto en los datos viejos y en los cierres sellados.

---

## 13. PRUEBAS Y CRITERIOS DE ACEPTACIÓN

Pruebas **automáticas con navegador real** (flujos con datos reales, `file://` y `https`, 320/360/768/1024/1440), reloj ajustable para lo que depende de la hora, y revisión independiente para lo de alto riesgo. Mínimo:

1. **Arranque y consola:** la página carga sin errores de consola ni de sintaxis (verificar que ningún `</script>` ni `<!--` dentro de cadenas corte el bloque); todas las pantallas abren; sin desbordes horizontales.
2. **Vender:** F1–F12 y sus botones; edición enlazada de cantidad/precio/importe; escáner vs. tipeo; etiqueta EAN-13; cálculo antes de confirmar; numeración por caja; fiado con y sin límite; fiscal/interno con motivo; nota de crédito y anulación con devolución de stock y de sello; reintegro.
3. **Venta sin stock:** con la opción activa vender 5 de un producto con stock 3 deja −2, la línea avisa, se audita y se marca en rojo en Inventario, Vender y Resumen; con "Exigir stock" o con la opción apagada el botón se deshabilita y el servidor rechaza; ajuste a negativo sólo si corresponde; anular restituye; dos cajas vendiendo el último ítem concurrentemente.
4. **Inventario por rubros:** pestañas y contadores; agrupar/filtrar; alta y edición de rubro (color inválido rechazado); producto en rubro nuevo; unidades und/kg/lt en edición, listados, exportación e importación; rubro oculto del menú no aparece en el público; margen "—" sin costo.
5. **Beneficios:** cupón vs. membresía (el mejor, no acumulados); tabaco excluido; reparto por línea con centavos (333/333/334); cupón vencido, de un solo uso, por cliente; concurrencia del último uso.
6. **Fidelización:** sello por código (cliente inferido del código), código repetido rechazado, 1 por día, ventana de 2 minutos, canje, reversión por anulación; alta al Club (válido, duplicado sin revelar, menor de 18, XSS, doble envío, consentimientos separados); tarjeta modelo con N sellos de ejemplo e impresión; recuperación de tarjeta con WhatsApp + nacimiento.
7. **Caja:** apertura, ingresos/egresos con rubro obligatorio, arqueo, cierre sellado y congelado, diferencia, reporte sin secciones vacías; rubro inexistente/de otro tenant rechazado.
8. **Menú público:** idéntico al aprobado; catálogo en vivo; carrito y pedido por WhatsApp (solicitud); control de edad y horario; ES/EN; cupones, tarjeta, legales y arrepentimiento; **redes:** X y YouTube de ejemplo apagadas, activar con enlace válido, enlace de otro dominio rechazado, `javascript:` rechazado, agregar red nueva, aparecen en el menú sólo las activas; administración: borrador, publicar, revertir; 360 px.
9. **Periféricos:** parseo de balanza y peso estable, ESC/POS (bytes, corte, QR), cola sin duplicados, reconexión; hardware real = "pendiente de prueba física".
10. **Seguridad:** XSS en cada campo (producto, rubro, red, cliente, cupón), CSV con fórmulas, roles por API (mostrador no edita menú ni rubros), tenant A/B, secretos ausentes del archivo, CSP sin violaciones, límites de intentos, idempotencia de pagos y webhooks, auditoría encadenada válida.
11. **Importar/exportar:** archivos buenos, malos, duplicados y `.xlsx`; reversión; archivo repetido no duplica.
12. **Regresión:** cada función de la versión anterior sigue funcionando; el estado persistido de una versión previa carga sin errores.
13. **Persistencia:** recargar conserva los datos; respaldo y restauración.
14. **Terceros:** sólo con sandbox o cuentas del propietario; sin tokens ni datos personales en los resultados guardados.

15. **Facturación electrónica (4.12):** firma CMS verificada con herramienta independiente; TRA con horas correctas; TA reutilizado y error de TA vigente; numeración con bloqueo; timeout seguido de consulta antes de reintentar; rechazo con observaciones visibles; nota de crédito con comprobante asociado; totales con redondeo conflictivo por alícuota (la suma cierra al centavo); clase A/B/C según emisor y receptor y condición de IVA del receptor informada; venta duplicada rechazada; usuario sin permiso; comercio A sin acceso a credenciales del B; secretos ausentes de respuestas, logs y exportaciones; ticket con CAE, vencimiento y QR; ticket pendiente sin CAE; simulador rotulado y ausente en el sistema del cliente. **Homologación real con el certificado del cliente: pendiente hasta tenerlo; nada de esto se declara "aprobado" sin ella.**
16. **Nube (6.11):** correr los scripts SQL sobre una base real de prueba (Postgres) con RLS activa y usuarios de prueba; comercio A no lee ni escribe nada del B (tablas, RPC, menús, credenciales fiscales); mostrador no escribe productos ni configuración; auditoría/movimientos escritos una vez; caja cerrada congelada; stock = suma de movimientos con dos equipos vendiendo el mismo producto en paralelo (incluso en negativo); registro rechazado no traba al resto; sincronización idempotente (reenviar el mismo lote no duplica); cursor sin huecos; borrado lógico; datos personales ilegibles en el servidor; entrar con contraseña equivocada, cambiar contraseña, miembro nuevo, quitar miembro (pierde acceso), recuperación con el código; modo sin conexión con cola y reconciliación; dos navegadores reales compartiendo datos contra un servidor de prueba; ningún secreto en el HTML publicado.
17. **Asistente conversacional:** probar voz y texto, castellano rioplatense, reconocimiento con ruido razonable, errores de transcripción, cantidades, productos homónimos, varias cajas, falta de campos, cancelación, corrección, proveedor no configurado/caído, límites de uso y salida en esquema inválido. La operación guardada debe coincidir con la interpretación confirmada; el modelo no puede invocar una acción desconocida, saltarse permisos, exfiltrar otro tenant ni crear duplicados al reintentar.
18. **Acciones por voz/texto y permisos:** por cada acción del registro, probar rol permitido y denegado directamente contra backend; cambios de precio, pagos, anulaciones, cierres, transferencias, borrados y permisos requieren el nivel de confirmación definido. Una confirmación anterior no puede autorizar una acción distinta. La auditoría identifica origen y correlación sin guardar audio/secretos.
19. **Comandas conversacionales:** “una pizza grande especial de calamares, una gaseosa y una soda, tres personas, mesa cuatro”; verificar catálogo, cantidades, mesa, comensales, totales del servidor, estado real, ticket/cocina si se confirma y duplicados por reintento. Si hay varias gaseosas posibles, no debe seleccionar una arbitrariamente.
20. **Cajas operativas/principal:** modo simple sin pantallas innecesarias; múltiples cajas; transferencia y pago repartido entre cajas; importes concilian exactamente; reversión ante fallo; sin doble conteo; arqueo individual y consolidado; cierre congelado; reparto de socios conforme a snapshot; operación concurrente y reintento idempotente.
21. *(No aplica a la ONG: multisucursal excluida.)*
22. **Borrado de inventario:** usuario no administrador no puede borrar ni por UI ni API/RPC directa; admin puede eliminar un artículo sin historial; artículo con historial no se elimina físicamente y ofrece archivar; eliminación masiva con mezcla de estados informa resultados por ítem, vacío no elimina todo, auditoría y recuperación funcionan; RLS/FK y concurrencia comprobadas.
23. **Ordenamiento universal:** inventario completo de tablas cubiertas; ascendente/descendente con números, dinero, fechas, tildes, nulos y empates; mantiene filtros/paginación/selección; prueba de lista blanca de columnas del servidor y protección contra inyección; teclado/ARIA/táctil; anchos 320/360/768/1024/1440 px.
24. **Regresión de V26:** cajas, acciones del asistente, borrado de artículos y ordenamiento no rompen POS, inventario, stock negativo, importación/exportación, cierres, fidelización, facturación fiscal, modo offline ni la experiencia simple de clientes ya existentes.
25. **Modo de venta y compatibilidad:** con el checkout apagado, el menú conserva el flujo y botón de WhatsApp y no crea órdenes de pago; al cambiar el modo requiere permiso, queda auditado y la configuración incompleta impide publicarlo.
26. **Checkout extremo a extremo:** comprador válido/inválido; paso atrás/adelante; carrito vacío, producto desactivado, precio cambiado, stock bajo/negativo según política, descuento inválido, cotización vencida, provincia/código postal no atendido, retiro local, tarifa fija/por zona y transportista caído. El total recalculado por servidor coincide al centavo; ninguna tarifa se inventa.
27. **Pagos online:** sandbox y producción aislados; creación idempotente de orden/sesión; retorno del navegador sin webhook no acredita el pago; pago aprobado sólo tras consulta/verificación del servidor; rechazado, cancelado, pendiente, reembolso, contracargo, timeout, evento duplicado, evento fuera de orden, firma inválida, monto/moneda/cuenta/tenant discrepantes y API caída. Los errores van a revisión y no permiten despacho.
28. **Webhook y multitenancy:** evento válido se procesa una sola vez; replay y payload de tenant ajeno son rechazados; el mismo evento repetido no duplica movimientos ni cambia dos veces la orden; no se acepta un estado `approved` del cuerpo sin verificación independiente; rate limit, límite de payload y respuesta sin datos sensibles; cuenta/proveedor/ambiente están asociados al tenant correcto.
29. **Secretos de pago y transporte:** escanear código fuente, HTML final, bundle, source maps, configuración pública, IndexedDB, respuestas, logs, auditoría, exportación y errores para detectar tokens. La UI de credenciales es write-only, el valor no se vuelve a renderizar, sólo admin puede rotar y ningún usuario/tenant lee secretos ajenos. Revocar/rotar no interrumpe el flujo WhatsApp.
30. **Pedidos y despacho:** estados de pago separados de estado de entrega; distintivo “Pagado — listo para despachar” sólo en orden aprobada no cancelada/no despachada; dirección restringida por rol; cambios manuales requieren permiso, motivo y auditoría; etiqueta/tracking no se simulan; reembolsos/contracargos y cancelaciones conservan historial sin borrar la orden.
31. **Privacidad y abuso:** XSS en nombre/dirección; CSRF donde corresponda; enumeración/IDOR de órdenes; abuso de checkout, repetición de solicitudes, cantidades/importes extremos, datos de entrada enormes, inyección de fórmulas en exportaciones y SSRF en configuración de transportistas. Ningún dato de tarjeta es almacenado; se prueban retención y borrado/anonimización conforme a política.
32. **Sin conexión y regresión:** offline no afirma que el pedido está enviado/pagado; reconexión concilia por clave idempotente; caída del proveedor checkout/webhook/transporte no pone la nube principal en estado “caída” ni bloquea POS/WhatsApp. Ejecutar toda la regresión V26.


33. **Wallet de fidelización:** sin cuentas/certificados el módulo queda pendiente y la tarjeta web sigue funcionando; generar pase Apple firmado por backend y enlace Google oficial en entornos de prueba; validar propietario/tenant, ID opaco, datos mínimos, QR/código sin PII y canje validado en servidor; token vencido, usado, alterado o de otro comercio rechazado; tarjeta no declara “guardada” sin señal verificable; actualización de saldo al cambiar el ledger; revocación/baja de registro cuando esté soportada; ningún secreto en HTML, bundle, logs, backups o respuestas.
34. **Avisos automáticos y consentimiento:** comprobar cada trigger configurado sólo tras evento confirmado; separación marketing/transaccional; cliente sin opt-in comercial excluido; baja inmediata e idempotente; cambio de preferencias; ventanas de silencio, zona horaria, cooldown y límite de frecuencia; doble evento no duplica mensaje; proveedor caído/rechazo/429/timeout, reintento y DLQ; estados “aceptado”, “enviado”, “entregado” y “leído” sólo cuando el canal los reporte; el worker funciona sin navegador abierto; fallo de comunicaciones no rompe POS, nube, fidelización ni checkout.
35. **Envío y automatización segura:** link de tarjeta expira, no se enumera, tiene alcance limitado y no filtra datos por query/logs; destinatario no autenticado recibe respuesta genérica; plantillas con XSS/inyección neutralizados; WhatsApp usa sólo API oficial/plantillas vigentes, correos incluyen baja cuando corresponda, notificaciones push requieren permiso del usuario; pruebas de aislamiento entre tenants, rate limits, pausa de campaña masiva y auditoría de quién la activó.
36. **Club V26.3 (4.6):** celular nuevo → tarjeta en el acto → importación por un equipo con sesión (admin y mostrador) → el celular pasa de «en trámite» a «Socio N.º 0001»; sellos por QR, código de 8 cifras, DNI y NFC (simulado, con reloj ajustable en todos los dispositivos); segundo sello el mismo día rechazado; código repetido rechazado; premio y reversión por anulación; segundo celular del mismo cliente (mismo WhatsApp **y** mismo cumpleaños) con tarjeta propia y con otro cumpleaños rechazado; altas viejas y altas que el equipo no puede abrir **no se descartan**; DNI repetido (pide elegir), inválido y borrado en la baja; el DNI nunca en claro en la nube; `club_estado` sin datos personales y con aislamiento A/B; meta y premio publicados; cupones de todos y de socios, con límite por cliente y uso sincronizado. NFC y cámara con hardware real: **pendiente de prueba física**.
37. *(No aplica a la ONG: mayorista excluido.)*

38. **Traspasos, detalle de cobros y expediente (4.23):** las pruebas de **4.23.11**, paso por paso (permiso en interfaz y servidor, cajas cerradas con cierre sellado intacto, comprobante de 8 campos, invariante enviado = recibido + tránsito + diferencias, tablas sólo-agregar con `UPDATE`/`DELETE` rechazados, detector de PAN, pago mixto $ 10.000 + $ 15.000 + $ 50.000, expediente); con las banderas apagadas la regresión de las suites anteriores no cambia.

39. **Caja y clientes del Club (4.24):** las pruebas de **4.24.5**: detalle de cada dispensación y donación con sus movimientos, turno de 5.000 operaciones sin tope, edición, baja y eliminación del administrador validadas en interfaz y servidor, tarjeta revocada, alta pendiente que no reaparece; con las banderas apagadas la regresión de las suites anteriores no cambia.

Matriz de trazabilidad: requisito → archivos/tablas/funciones → pruebas → resultado. Nada se declara "aprobado" sin evidencia reproducible.

---

## 14. LECCIONES APRENDIDAS (no repetir)

- Un producto cargado se ve en el menú sin recargar; categorías y productos usan el mismo alta/edición y foto; el estilo de tarjetas del menú no contamina al panel; en 360 px nada desborda; la capa del menú lateral no ocupa lugar en la grilla.
- Un `</script>` o un `<!--` dentro de un string de JavaScript rompe todo el bloque: escaparlos al incrustar documentos (`<\/script>`, `<\!--`, `<\script`). Una prueba de consola vacía no alcanza: abrir la página y verificar que arranca.
- Modales reutilizados: los listeners no deben actuar con el modal cerrado; un modal que abre otro no debe cerrarlo después (usar `setTimeout`); un modal que reemplaza a otro debe volver a abrir el asistente.
- `type=number` con `valueAsNumber`; fechas con año de 4 cifras antes que de 2 en las regex; probar con 21/05/1990; las fechas de nacimiento no pasan por el validador de fechas de operaciones.
- "0" precargado en montos: prohibido (placeholder y selección al enfocar); probar tecleando directo.
- Un botón de teclado en pantalla con texto arriba a la izquierda indica falta de `display:flex`: revisar con captura de pantalla, no sólo con pruebas.
- WebUSB no puede tomar impresoras que el sistema ya maneja: por eso existe "Impresora de Windows". No prometer reconocimiento automático total.
- Atajos de teclado: `preventDefault` sobre F5/F11/F12 dentro del POS y navegación previa fuera de Vender.
- No meter datos nuevos dentro de un cierre sellado: lo editable va en un registro aparte.
- Con nube activa se deshabilita "Borrar historial" y no se restaura un respaldo legible encima.
- Si el navegador de prueba no ve la base, validar leyendo el respaldo cifrado y recargando.
- Datos de demo: rotular "ejemplo"; los números del servidor con fechas absurdas no pueden romper vistas; las notas de crédito restan también en los reportes.
- Un reporte de cierre sin socios configurados no muestra paréntesis vacíos ni secciones sin contenido.
- Si el menú del cliente en producción es el mismo archivo que usan una tarea programada y un instalador, **no reemplazarlo con una demo**: publicar aparte.
- Un secreto encontrado en HTML público del cliente se reporta y se recomienda rotar; no se reutiliza.
- **Fiscal:** el WSAA rechaza pedir un TA nuevo mientras haya uno vigente: guardarlo y reutilizarlo; el reloj del servidor debe estar en hora; ante un corte durante `FECAESolicitar` consultar el comprobante antes de reintentar (si no, se saltea o duplica un número); la condición de IVA del receptor es obligatoria desde la RG 5616 `[VERIFICAR]`; un simulador no es una homologación; la clave privada se genera y queda en el servidor, nunca en el navegador.
- **Nube:** nunca enviar el stock desde el navegador (enviar movimientos); lo que se escribe en el cliente y en el servidor con la misma regla de negocio se prueba con dos equipos reales en paralelo; "Confirm email" activado traba el alta; si el proyecto ya tenía un esquema de un sistema anterior, `create table if not exists` conserva la forma vieja sin avisar: limpiar de forma explícita y con respaldo; una clave `secret` encontrada en un repositorio público se reporta y se rota.

- **Lecciones v2.2:** (1) una lectura de sincronización que empezó antes de obtener el CAE puede llegar después y pisarlo: al aplicar datos del servidor sobre una venta, conservar el `arca`/`arcaNC` local si el entrante no lo trae; (2) el QR fiscal (~300 caracteres) no entra en un generador limitado a la versión 12: ampliar y verificar con un lector independiente (OpenCV) en vez de confiar en que "se ve un cuadrado"; (3) un 502 de la función fiscal no es "sin internet": conservar `etapa` y motivo; (4) las pruebas con navegador bajo CSP estricta no pueden usar `wait_for_function` con texto (usa `eval`): consultar en un bucle con `evaluate`; (5) el modo "Con ARCA" del POS queda activo entre ventas (visible y auditado): las pruebas deben apagarlo antes de una venta interna; (6) el CAE no entra en la sincronización genérica: lo escribe el servidor fiscal y `sincronizar()` lo preserva; (7) si el navegador y el servidor ven la misma venta, el receptor identificado **no** debe quedar en los registros genéricos; (8) los repositorios y carpetas del cliente y de la demo son distintos: nunca reutilizar la base local ni la clave publicable entre ellos.
- **Lecciones v2.3:** (1) **un módulo opcional que falla jamás puede marcar la nube como caída**: las llamadas a funciones de servidor (`/functions/v1/…`, p. ej. ARCA no desplegada → sin CORS → error de red) no tocan el indicador de conexión (`fn:true`), y esos módulos no se consultan en cada sincronización si no hay nada que hacer (reintentos ARCA sólo si hay facturas pendientes de CAE); el indicador "Sin conexión" se reserva a fallas de la API principal; probar con la función caída. (2) **La variante del cliente nunca dice "demo"**: ni títulos, ni tarjetas ("Datos de la demo", "Empezar de cero"), ni etiquetas ("SIMULADO" → "Pendiente de configuración"), ni botones simulados (balanza); la demo conserva sus rótulos. Prueba obligatoria: recorrer **todas** las pantallas de la variante cliente y buscar `demo|simulad` en el texto visible. (3) **Cada compilación lleva fecha/hora y variante visibles** (Configuración: "versión del cliente · compilada AAAA-MM-DD HH:MM UTC") para distinguir de inmediato una copia vieja en caché del navegador; ante "no veo el cambio": Ctrl+F5 y comparar esa marca. (4) Las filas con controles variables (checkbox que agrega un campo) **no** pueden ser una línea flex sin `wrap`: los botones de acción terminan recortados por la tarjeta y el usuario cree que "no se puede editar". (5) Antes de decir "conectado", comprobar con una llamada real (`menu_publico`) y mirar los registros de la API del proveedor en vez de suponer. (6) El resultado de un script de instalación (SQL) se verifica leyendo las tablas creadas, no con "corrió sin errores". (7) **Importar .xlsx se lee de verdad** (no alcanza con decir "guardalo como CSV"): lector propio sin librerías externas (la CSP no las permite): zip + `DecompressionStream('deflate-raw')` + `DOMParser`, primera hoja, textos compartidos, fechas por formato de celda (→ dd/mm/aaaa), decimales a formato argentino, tope de tamaño descomprimido (anti zip-bomb); `.xls` viejo se rechaza con instrucciones. Se prueba con un Excel real (título arriba, fecha 21/05/1990, decimales, tildes, código de barras largo). (8) **Los requisitos de tamaño se miden con números**, no a ojo: la prueba lee `getBoundingClientRect()` y falla si un botón táctil mide menos de 44 px o se sale de su tarjeta.

---

## 15. PUBLICACIÓN Y ENTREGA

1. Catálogo y, si hay, migración del sistema anterior (importadores). 2. Personalización (logo, textos, colores, contacto, reglas de venta restringida, dirección corta). 3. Ensamblado (URL y clave publicable). 4. Pruebas automáticas en verde (sección 13). 5. Revisión de correcciones en una sola pasada y, si el riesgo lo justifica, revisión independiente de seguridad. 6. Publicación: hosting estático (por ejemplo GitHub Pages: rama principal, raíz) en un repositorio **distinto** de cualquier producción que ya exista salvo orden expresa; instalador y SQL aplicados en entorno de prueba antes de producción. 7. Prueba desde cero en el local (PC, celular como segunda caja, corte de internet, permisos, quitar un usuario, cargar una factura, cerrar caja, simular clave olvidada). 8. Capacitación del dueño (código de recuperación, respaldo, equipo, nube, NFC, lectura de facturas, redes y menú).

**Repositorios:** uno para la **demo** (datos de ejemplo, simulador fiscal, nube sin configurar) y uno por **cliente** (datos reales, sin simulador, nube configurada); nunca mezclar ni reutilizar el de otro cliente ni reemplazar un archivo que usa una tarea programada o un instalador. Los scripts SQL y las funciones viajan en el repositorio del cliente (carpeta `supabase/`).

**Lo que depende de terceros (decírselo siempre al cliente):** CAE real (certificado y servicio del organismo fiscal, alta del punto de venta, clave fiscal del titular); nube (proyecto del proveedor, scripts SQL ejecutados por quien tiene acceso, secretos de las funciones); IA en la nube (clave y costos); cobros online (cuenta, credenciales, webhooks, sandbox); Apple Wallet (cuenta/desarrollo, certificado de firma y servicio seguro para pases actualizables); Google Wallet (cuenta de emisor, permisos de API y credenciales de servidor); WhatsApp Business, correo, SMS y push (proveedor, plantillas, permisos, dominios, opt-ins, cuotas y costos); transportistas (credenciales, cobertura y API vigente); Meta (permisos, políticas, consentimiento); tiendas de apps y firma de código (cuentas y certificados pagos); agente local y hardware real (etapa futura / sin probar); normativa (registro de bases, plazos de conservación, comunicaciones comerciales, horarios de venta restringida y textos legales: asesor y fuente oficial); recuperación (sin contraseña ni código no hay datos).

**Definición de terminado:** todo publicado (web, instalador, SQL aplicado) · pruebas en verde y revisión independiente sin pendientes de seguridad · regresión · documentación (guía de nube, de Windows, prueba desde cero, arquitectura de compras/cajas, soporte, este prompt) · entrega honesta con límites. Para V26 se suma: cobertura de acciones conversacionales trazable por módulo; migraciones de cajas aplicadas en base de prueba; pruebas RBAC/RLS y conciliación; pruebas de borrado admin; inventario de tablas con ordenamiento y pruebas de accesibilidad; si Checkout Online está activado, prueba real/sandbox de orden, pago, webhook idempotente, envío y no exposición de secretos; si Wallet/avisos están activados, prueba de generación/guardado de pase, actualización, consentimiento, baja, cola/worker, idempotencia y estados reales de entrega. Sin credenciales/cuenta del propietario, declarar el paso productivo pendiente y mantener el módulo apagado.

**Formato de la entrega final (obligatorio):** módulos implementados; migraciones; suites de prueba y resultados; integraciones realmente configuradas; secretos que debe cargar el dueño por canal seguro; dependencias pagas; dispositivos probados (marca/modelo/versión/SO/driver) y pendientes de prueba física; límites conocidos y riesgos abiertos. Prohibido "100 % funcional", "sin errores" o "aprobado" sin evidencia.

---

## 16. CHECKLIST DE ADAPTACIÓN A UN NEGOCIO NUEVO (actualizado para V26)

1. Completar la ficha (sección 1) y marcar `[PENDIENTE]` lo que falte.
2. Elegir rubro y prender/apagar módulos con la matriz (sección 11).
3. Cargar logo, colores y datos del comercio; revisar que nada del comercio anterior quede fijo en el código (buscar nombre, teléfono, redes, direcciones, alias).
4. Definir rubros del inventario con color, diseño en el menú, y reglas de venta restringida; definir unidades (und/kg/lt) y la política de venta sin stock.
5. Importar el catálogo (con modo prueba) y asignar rubro financiero a todo lo histórico.
6. Configurar cajas, usuarios, roles y, si hay socios, el módulo de reparto.
7. **Nube (6.11):** repositorio propio del cliente, scripts SQL en orden, "Confirm email" desactivado, ensamblado con URL + clave publicable, comercio creado y código de recuperación guardado.
8. **Facturación electrónica (4.12):** datos del emisor, CSR, certificado, relación de servicio y punto de venta, "Probar conexión" en homologación, recién después producción.
9. Configurar fidelización (meta, premio, tarjeta modelo), cupones y planes de ejemplo → reales.
10. Configurar el menú público: textos en ES/EN, frases y leyendas confirmadas, redes (con las no usadas apagadas), mapa/reseñas, Wi-Fi, acceso oculto, créditos.
11. Paquete legal local confirmado por asesor.
12. Periféricos: conectar, probar y registrar marca/modelo.
13. Ejecutar la batería de pruebas (sección 13) y la prueba desde cero en el local.
14. Configurar el perfil de cajas (simple / operativas y principal) según la operación real de la sede.
15. Revisar la matriz del asistente: habilitar entrada de voz/texto, configurar proveedor y costos si aplica, validar acciones publicadas, permisos y políticas de confirmación; conservar alternativa manual.
16. Verificar borrado/archivo de artículos con rol admin y denegación real para el resto de los roles; comprobar que todas las tablas de datos usen ordenamiento.
17. Ejecutar la batería de pruebas (sección 13), incluida la regresión de V26 y la prueba desde cero en el local.
18. Si el cliente necesita e-commerce, configurar Checkout Online de 4.18: escoger modo de venta, probar sandbox, definir métodos/tarifas de entrega, configurar secretos por canal seguro, registrar webhook, revisar privacidad/devoluciones y aprobar las pruebas antes de activar producción. Si no se necesita, mantenerlo apagado y confirmar que WhatsApp sigue funcionando.
19. Si el cliente utiliza fidelización digital, configurar 4.19: proveedores/cuentas de Apple Wallet y/o Google Wallet, certificados y secretos por canal seguro, diseño y contenido mínimo del pase, enlace/autenticación de cliente, canales automáticos, plantillas, reglas, horarios, límites, consentimiento por finalidad/canal, baja y política de retención. Probar la generación, el guardado real en dispositivos compatibles, las actualizaciones y los avisos con estados verificados; si faltan requisitos de proveedor, conservar la tarjeta web y mostrar la dependencia pendiente.
20. Publicar (sección 15), capacitar al dueño y entregar el informe honesto.
21. *(No aplica a la ONG: mayorista excluido.)*

---


### Lecciones adicionales V26 (obligatorias)
- La IA no es el sistema de permisos: cada herramienta vuelve a comprobar autorización en backend. Ocultar un botón nunca reemplaza RBAC/RLS.
- Una intención reconocida no prueba que una operación quedó guardada. La respuesta de éxito se emite sólo tras confirmación de la fuente de verdad y debe mostrar los estados pendientes.
- La idempotencia se aplica al efecto económico/operativo, no sólo a la transcripción. Un audio repetido, un doble clic o un timeout no puede duplicar dispensaciones, donaciones, movimientos ni transferencias.
- En una consolidación de caja, un movimiento origen y sus asignaciones son una misma operación económica. No sumar simultáneamente el padre y el espejo en el total.
- Los cierres sellados e históricos fiscales no se editan ni se eliminan para facilitar un reporte. Se crean movimientos compensatorios auditados cuando corresponda.
- La ordenación por servidor sólo acepta columnas en lista blanca y valores enlazados/parametrizados; nunca se concatena una columna recibida del usuario.
- El borrado masivo requiere una vista previa y resultado por artículo. Selección vacía jamás significa “todos”.
- El proveedor de IA/voz puede fallar sin degradar el estado de sincronización principal. La interfaz debe reportar ambos estados separadamente.
- Las pruebas de voz no usan únicamente mocks del modelo: además comprueban que las operaciones resultantes existen en la base de prueba y que los permisos fueron aplicados.
- En Checkout Online, un retorno del navegador nunca acredita un pago; verificar el estado desde el backend y el API del proveedor antes de activar preparación/despacho.
- Los webhooks se repiten y pueden llegar fuera de orden: registrar evento/resultado y aplicar transiciones idempotentes; consultar al proveedor antes de reintentar tras timeout para no duplicar cobros.
- Las credenciales de pago no se guardan en `config_envios`, `mercadopago_keys` genérico ni sincronización pública. Guardar sólo referencias a secretos server-side y probar el HTML/bundle compilado para descartar filtraciones.
- Un pedido enviado por WhatsApp es una solicitud; una orden de checkout, un pago aprobado, una orden preparada y un envío despachado son estados distintos. No mezclarlos en los reportes ni en la caja.
- Un enlace de Apple/Google Wallet enviado no demuestra que el cliente guardó la tarjeta; mostrar sólo el estado que el proveedor permite verificar. Mantener la tarjeta web como alternativa y no crear saldos paralelos.
- Las notificaciones se generan desde eventos de servidor confirmados y salen por una cola/worker; no depender de que un navegador permanezca abierto ni llamar “entregado” a un mensaje sólo aceptado por el proveedor.
- La recepción de una tarjeta del Club no implica consentimiento comercial. Mantener finalidades y canales separados; las bajas, límites de frecuencia y preferencias deben respetarse en todos los canales integrados.
- **Un permiso nuevo que reemplaza a otro (traspasos: de `close_cash` a `transfer_funds`) se migra con aviso y botón explícito, nunca en silencio**: quien lo tenía y lo pierde tiene que enterarse, y quien no lo tenía no lo recibe solo. Un cierre sellado no se toca para registrar lo que pasa después: va en un registro aparte vinculado. «Inalterable» se escribe siempre con su límite (4.23.8).

## Anexo histórico de lecciones del prompt base (contenido preservado)

- **Lecciones v2.4 (ARCA práctico para el cliente):** (1) **El instructivo de certificados vive dentro del producto**, no en un PDF aparte: Administración → ARCA muestra un asistente de 5 pasos por ambiente (homologación y producción separados) con estado **hecho/pendiente** en cada uno, el paso en curso abierto y el resto plegado: (1) datos del emisor; (2) generar clave y CSR en el servidor (el CSR queda visible mientras no haya certificado: copiar/descargar); (3) qué pedir en ARCA, con **los valores exactos listos para copiar** (alias, CUIT, CSR) y los nombres de menús de cada ambiente (homologación: WSASS "Nuevo certificado" → "Crear DN y obtener certificado" → "Crear autorización a servicio" `wsfe`; producción: "Administración de Certificados Digitales" → "Agregar alias"; relación en el Administrador de Relaciones de Clave Fiscal; punto de venta "RECE para aplicativo y web services") — todo marcado [VERIFICAR] porque ARCA renombra menús; (4) cargar el .crt; (5) autorizar el servicio y crear el punto de venta. Resumen "✔ clave · ✔ certificado · vence AAAA-MM-DD" siempre visible fuera de los plegables, más una lista de **errores típicos** con su causa (computador no autorizado a wsfe, certificado de otro ambiente, TA vigente, punto de venta de otro sistema, certificado vencido, clave no corresponde). (2) **La carga del certificado perdona el formato y nunca la seguridad**: acepta .crt/.pem/.cer en texto o DER binario, con saltos CRLF, BOM o texto alrededor (extrae el bloque), re-arma el PEM; **rechaza en el navegador, con explicación** una clave privada pegada (jamás se envía) y un CSR pegado en lugar del certificado; el servidor sigue validando que corresponda a la clave del comercio, que no esté vencido y guarda el vencimiento. (3) **Una función de servidor nueva se despliega en el proyecto nuevo**: tras crear un proyecto de Supabase la Edge Function `arca` no existe; se despliega (panel: Edge Functions → Via Editor, un solo archivo `supabase/despliegue-panel/arca-index.ts` generado con `bundle_arca.py`, "Verify JWT" **apagado** porque la función valida la sesión, secretos `ARCA_MASTER_KEY` —generada, nunca mostrada— y `ALLOWED_ORIGINS`) y se comprueba con una llamada real (sin sesión debe responder 401 con CORS). (4) **Prueba obligatoria del asistente**: generar CSR, rechazar CSR/clave/texto pegados, cargar un certificado firmado con la clave del comercio (incluso con CRLF y basura alrededor), rechazar uno de otra clave, probar conexión de punta a punta contra un ARCA falso, y regresión de cola/rechazos/notas de crédito. Lo que **no** se puede declarar probado sin el certificado real del cliente: la comunicación con ARCA homologación/producción.
- **Equipo, invitaciones y datos sensibles (v2.5):** (1) **En la nube las personas con acceso son los miembros del comercio (Supabase Auth + tabla `miembros`), nunca una lista local**: los "usuarios con PIN" del navegador se vacían al cargar la nube (la identidad viene de la sesión) y por eso un "+ Usuario" local parecía "no guardarse". Administración → **Usuarios y permisos** muestra, en la variante con nube, la tarjeta **Equipo**: lista de miembros con correo y rol, cambio de rol, **Quitar** (corta el acceso en todos los equipos), **Invitar a una persona** (correo, nombre, rol) y **invitaciones pendientes**. La misma tarjeta se reutiliza en la pantalla Nube (un solo componente, `teamCardHtml/teamInit`, sin duplicar). Sólo el administrador la ve; el resto ve un aviso. La lista local con PIN queda únicamente en la demo sin nube. (2) **Invitación práctica:** el código de acceso (12 caracteres, un solo uso, 14 días) se muestra **una sola vez** junto a un mensaje listo con el enlace, el correo y las instrucciones ("Acceso del equipo → Tengo una invitación") y botones **Copiar mensaje** y **Enviar por WhatsApp**; la clave de cifrado del comercio viaja envuelta con ese código, nunca en claro. (3) **Funciones que ya existen pero no se encuentran son una falla**: toda acción de gestión (invitar, quitar, cambiar rol) debe estar en la pantalla donde el administrador la busca (Usuarios y permisos), no sólo en una pantalla técnica. (4) **Datos sensibles ocultos por defecto:** el CSR sólo se muestra mientras falta el certificado (el servidor deja de enviarlo y el navegador lo borra al cargar el .crt); el campo del certificado se vacía tras cargarlo; la clave privada de ARCA jamás sale del servidor y una clave pegada por error se rechaza en el navegador; la clave de Wi-Fi del panel es un campo de contraseña con botón mostrar/ocultar; los códigos de acceso y de recuperación se ven una sola vez; auditoría, mensajes de error y logs no llevan claves, tokens ni certificados. (5) **Pruebas obligatorias:** Usuarios y permisos sin botón local en la nube; invitar, ver pendiente, recargar y que siga; el invitado entra con su rol; un mostrador no ve el formulario; cambiar rol llega al servidor; el mensaje de invitación trae enlace, correo y código.

---

---

