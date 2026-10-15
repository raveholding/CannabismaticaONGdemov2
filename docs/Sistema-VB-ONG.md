# Sistema VB ONG — prompt maestro para ONG (base reutilizable)

Versión: 2.0 (v1.0 + carga del menú público, créditos, Planilla de cultivo, Google Drive con nombres únicos y modo "sistema completo") · Rave Holding · Deriva de Sistema VB (RAVE CORE) y de la demo validada de Fundación Cannabismatica I+D.
Uso: este documento se agrega **sobre** el prompt maestro "Sistema VB" (secciones B a P). Donde haya diferencias, manda este documento para ONG. Antes de cambiar un repositorio, inspeccionar el código real. Todo lo descripto es requisito, no funcionalidad ya hecha.
La estética NO forma parte de este prompt: cada ONG define logo, colores y tipografía en su ficha (sección 1).

## 0. Reglas de trabajo (heredadas, sin cambios)
- Castellano rioplatense; identificadores en inglés. Hacer el trabajo completo (código, pruebas, subida); consultar una sola vez y junto si falta un dato.
- No inventar leyes, resoluciones, endpoints ni topes: marcar **[VERIFICAR]** con la fuente oficial (arca.gob.ar, argentina.gob.ar, AAIP, ministerio de salud, etc.).
- Seguro por defecto: sin secretos en el código; RLS y roles en servidor; importes en centavos enteros; fechas UTC con zona del comercio; auditoría encadenada; cierres sellados e inmutables; todo movimiento de dinero con rubro financiero obligatorio (O.10).
- Detectar antes de agregar: no duplicar tablas, pantallas ni funciones; completar, fusionar, o agregar como módulo apagado por bandera.
- Nada nuevo rompe lo existente. Pruebas automáticas de flujos reales (no sólo "carga la pantalla"), regresión completa, y revisión independiente para lo de alto riesgo.
- Créditos visibles: Rave Holding · WhatsApp +54 9 387 514-3900 · raveholding@gmail.com.
- Entrega honesta al final: qué quedó, qué debe hacer la ONG, qué no se pudo probar ("pendiente de configuración" / "pendiente de prueba física").

## 1. Ficha de la ONG (completar)
Nombre y personería · rubro (salud, cultura, comedor, educación, ambiente…) · domicilio y ciudad · WhatsApp (549…) y teléfono · correo · CUIT y condición frente al IVA · logo, colores y tipografía · alias/CBU o Mercado Pago para donaciones [datos propios de la ONG] · marco normativo propio de la actividad [VERIFICAR] · equipo (nombre, correo, rol) · sedes · idiomas del menú (ES/EN) · ¿Turnero? · ¿hay carpetas de Drive por persona? · ¿Factura C ante ARCA ya habilitada? · umbral de identificación del receptor, si aplica [VERIFICAR].

## 2. Vocabulario obligatorio de ONG (toda la interfaz, ES y EN, incluidos menús, tickets, exportaciones, auditoría y mensajes)
Nunca usar: cliente, venta, compra, cobro, precio, vender, cobrar, comprador, **aporte(s)**.
| Comercio | ONG |
|---|---|
| Cliente | Paciente / Persona asistida / Socio/a (según rubro) |
| Venta, compra | Entrega, dispensación, prestación |
| Cobro, precio | **Donación (voluntaria)**, contribución |
| Facturador | Módulo de Factura "C" ante ARCA |
La palabra **Donación** reemplaza a "Aporte" en pantallas, botones, columnas CSV, plantillas, ayudas, auditoría y semilla de datos. Los identificadores internos pueden conservar el nombre histórico, pero no se muestran. Prueba: recorrer cada pantalla y verificar con búsqueda de texto que no aparece "Aporte".
Los rubros financieros evitan nombres repetidos (ej.: "Donaciones voluntarias" y "Otras donaciones").

## 3. Ingreso y menú público
- La aplicación abre en el **menú público**. Desde él, un acceso discreto ("Acceso del equipo") lleva al ingreso con usuario y clave; sin sesión, cualquier ruta interna vuelve al menú.
- Mensajes de error iguales para usuario inexistente y clave incorrecta; bloqueo creciente desde el 5.º intento; clave temporal con cambio obligatorio; sesión por pestaña.
- El menú público es anónimo y de sólo lectura: nunca expone datos de personas, saldos, stock exacto ni costos. Todo texto/URL se escapa y se valida (https:, tel:, mailto:, wa.me).
- Administración → "Menú público": borrador / publicación / versiones y reversión, bloques ordenables, ES/EN, auditoría de cada cambio.

## 4. Corrección 1 — Sección pública "Historia Clínica · Solicitud [trámite propio de la ONG]"
(En la demo: "Historia Clínica · Solicitud Reprocann". Para otra ONG se cambia el nombre del trámite en la ficha.)
- Es un **bloque propio del menú**, primero en el orden y con su ítem en la barra de navegación, en ES y EN, editable desde Administración (textos de presentación y de consentimiento).
- Dos pestañas:
  1. **Nueva solicitud**: registro + datos para la historia clínica/legajo. Campos: nombre, apellido, fecha de nacimiento, WhatsApp, tipo y número de documento (**opcionales**), correo, código postal, domicilio, ocupación, obra social (opcional), motivo de consulta, estado del trámite declarado, dudas, tutor/a (obligatorio si es menor de 18), consentimiento informado por separado de las comunicaciones comerciales (casillas sin marcar, texto versionado, fecha y origen). Texto legal [VERIFICAR con asesor/a legal: Ley 25.326 y normativa de salud vigente].
  2. **Ya soy paciente o socio/a**: **Turnero Digital** (identificación por nombre, legajo o documento + WhatsApp + motivo + día + franja + nota) y botón de **WhatsApp directo** a la ONG con mensaje prellenado.
- Honestidad de los datos: todo lo enviado por la web queda "sin verificar / solicitud web" hasta que el equipo lo marque verificado; un estado de trámite declarado nunca se toma como vigente. La respuesta del turnero es idéntica exista o no la ficha (sin filtrar datos). El turno es una **solicitud**: lo confirma o rechaza el equipo (bandeja en Administración → Menú público) y se avisa por WhatsApp; nunca se muestra confirmado por sí solo.
- Antiabuso: nonce por envío (idempotencia: doble toque no duplica), límite 3 envíos por 10 minutos por dispositivo, saneamiento y escape (XSS), sin conexión no se declara éxito.
- Menores: sin tutor no se completa; comunicaciones comerciales y beneficios restringidos [VERIFICAR con asesoría legal].

## 5. Corrección 2 — Legajo automático único y cero colisiones
- Cada envío exitoso genera **automáticamente** el legajo / historia clínica y un **paciente nuevo e independiente**. Nunca se actualiza, fusiona ni pisa una ficha existente por coincidir nombre, teléfono o documento.
- Identificadores:
  - **Legajo** `L-aammdd-XXXXXX` (6 caracteres de un alfabeto sin ambiguos, aleatorio criptográfico), verificado contra los existentes, con reintentos y respaldo por marca de tiempo. En producción: UUID v4/v7 en servidor + legajo legible con restricción UNIQUE.
  - **Clave interna** independiente del documento (la clave nunca es el DNI salvo compatibilidad con datos viejos y sólo si no existe): en la demo, 13 dígitos que empiezan en 88 (no pueden chocar con un DNI de hasta 9 dígitos ni un CUIT de 11).
  - **Carpeta de Drive** sugerida: `Legajo L-… · Apellido Nombre`; el legajo hace único el nombre aunque haya homónimos. La carpeta real se crea con idempotencia (clave = legajo; si ya existe, se reutiliza; nunca se sobrescribe un archivo: nombre con sello de tiempo + hash). Integración real con Drive por OAuth de la ONG: **pendiente de configuración**.
- Documento repetido: la ficha nueva se crea igual y queda marcada **"posible duplicado"** (con referencia a la existente) para que una persona del equipo decida; no se fusiona sola. Misma regla en alta manual, menú público e importación.
- Búsqueda por nombre, legajo, DNI, CUIT o CUIL en toda la aplicación (buscador superior, dispensaciones, donaciones, turnero); si hay varias coincidencias se pide más precisión, nunca se elige una al azar.
- Base de datos real: columnas `legajo UNIQUE NOT NULL`, `id UUID PK`, `documento_tipo`, `documento_num NULL` con índice **no único** (el mismo documento puede estar en dos fichas marcadas para revisión), `posible_duplicado_de NULL`, `origen`, `verificado`. Altas con `Idempotency-Key` (nonce). Pruebas de concurrencia: 50 altas simultáneas → 50 legajos distintos.
- Pruebas obligatorias: legajos únicos, mismo DNI dos veces = dos legajos con marca, doble toque no duplica, carpetas únicas, ficha original intacta, límite de envíos, menor sin tutor, documento inválido, XSS, aislamiento entre ONG (tenant A/B).

## 6. Corrección 3 — "Donación" en lugar de "Aporte"
Ver sección 2. Incluye: menú lateral, títulos, formularios ("Importe de la donación"), tickets, comprobantes ("Donación voluntaria registrada por…"), columnas de exportación e importación (sinónimos aceptados al importar: "donación", "donación sugerida" y, por compatibilidad con archivos viejos, "aporte"), exportaciones, plantillas, auditoría, informes, textos en inglés ("Donation") y semilla de datos. Concordancia de género correcta ("Última donación", "la donación", "inválida").

## 7. Corrección 4 — Documento opcional y compatibilidad con ARCA (Factura C)
- En **Dispensaciones, Donaciones, alta de pacientes, importación y turnero** el documento **no es obligatorio**. Se puede cargar DNI, CUIT o CUIL, o ninguno.
- Validación sólo si se carga: DNI de 6 a 9 dígitos; CUIT/CUIL de 11 dígitos con dígito verificador y prefijo válido. Un documento mal cargado se rechaza con mensaje claro que aclara "si no lo tenés, dejalo vacío"; texto sin ningún dígito en una columna de documento al importar también se rechaza.
- Una donación puede registrarse con: paciente identificado (por nombre, legajo o documento), **donante sin ficha** (nombre y documento opcionales) o **anónima** (consumidor final). Cada caso guarda `receptor {nombre, doc|null}`.
- **Factura C simulada** (y nota de crédito C): receptor "Consumidor final" cuando no hay documento; con CUIT/CUIL/DNI muestra el documento formateado; la condición frente al IVA del receptor con CUIT se marca "a confirmar con el receptor [VERIFICAR]". La numeración por punto de emisión no se repite ni se salta; la nota de crédito copia al receptor de la factura original.
- **Umbral de identificación**: ARCA puede exigir identificar al receptor por encima de ciertos montos [VERIFICAR en arca.gob.ar la normativa y el importe vigentes — no se inventa]. Por eso el tope es **configurable** en Ajustes (centavos; vacío = nunca se exige). Si se supera y no hay documento, se avisa y se ofrece registrar la donación **sin** Factura C; nunca se bloquea el registro de la donación ni la dispensación.
- Una dispensación con donación opcional integrada: sin documento, con cualquier tipo de documento, con o sin Factura C, no bloquea, no choca ni da error. Las exportaciones muestran Legajo / Documento / Donante.
- Facturación real con CAE (WSAA + WSFE): módulo de servidor con certificado de la ONG, apagado por defecto, probado en homologación antes de activarlo [VERIFICAR]. Hasta entonces el comprobante es de demostración y lo dice en pantalla.
- Pruebas obligatorias: donación sin documento, con DNI, con CUIT y con CUIL (4 Facturas C, numeración correcta); documento inválido avisa; umbral exige documento y "sin Factura C" pasa igual; paciente sin documento se busca por legajo y nombre y se le dispensa con donación y Factura C; importación sin documento; exportaciones; NC copia receptor.

## 7 bis. Corrección 5 — Menú público: carga limpia, encabezado legible y créditos
- Al abrir la aplicación nunca se ve el panel ni un parpadeo antes del menú: el panel permanece oculto hasta que el arranque termina y se decide la vista (sin sesión → menú público).
- El encabezado fijo del menú es opaco (sin transparencia ni desenfoque): ningún texto se superpone con el logo ni con el contenido al desplazarse, en 320, 360, 768 y escritorio.
- Los créditos del desarrollador ("Desarrollado por Rave Holding · WhatsApp +54 9 387 514-3900 · raveholding@gmail.com", con enlaces wa.me y mailto) se ven siempre al final del menú, en una tarjeta propia, con margen inferior que no queda tapado por botones flotantes (WhatsApp, volver arriba, barra inferior). Se prueba con captura y con verificación de superposición.

## 7 ter. Módulo Trazabilidad — Planilla de seguimiento de cultivo
- Pestaña "Planilla de cultivo" dentro de Trazabilidad y entrada propia en el menú lateral (permiso propio `cultivo`: mostrador ve; operador carga; administrador corrige, cierra y reabre).
- Entidad **ciclo** (nombre, lote o sala, fecha de inicio = día 1, estado activo/cerrado, notas) y **registros** con los campos obligatorios de la planilla: N° (correlativo por ciclo), Fecha, Día, Semana, Fase, Riego (PH / EC), H % (humedad), Temp (°C), R. Off (runoff: EC / PH), Observaciones y Encargado/a.
- Reglas: Día = días desde el inicio + 1 y Semana = techo(día/7), calculados solos y visibles al elegir la fecha; Fecha no anterior al inicio ni futura; Fase de una lista editable marcada [VERIFICAR con el equipo técnico]; PH 0–14, EC 0–10 mS/cm, H 0–100, Temp −10 a 60; decimales con coma o punto; campos numéricos vacíos con ayuda gris (nunca "0" precargado); al menos una medición u observación; Encargado/a con sugerencias del personal.
- Nada se borra: corregir exige motivo y conserva los valores anteriores; anular exige motivo y deja la fila tachada. Un ciclo cerrado es de sólo lectura. Todo en la auditoría encadenada.
- Impresión A4 apaisada (25 filas por hoja, encabezado con ONG, ciclo y lote) y CSV (`;`, UTF-8 con BOM, anti-fórmulas). Todo texto cargado se escapa (anti-XSS).
- Pruebas: columnas y orden, día/semana (día 8 = semana 2), rangos inválidos, fecha futura o previa al inicio, corrección con motivo, anulación, ciclo cerrado, permisos por rol, XSS, CSV, impresión.

## 7 quater. Google Drive opcional (guardar y gestionar la planilla y el legajo)
- Se activa por ONG en Integraciones: la ONG carga su propio Client ID de Google (público; nunca el secreto), con origen autorizado de la página. Alcance mínimo `drive.file`; la sesión de Google se pide sólo al tocar el botón (el script de Google no se carga antes) y el token vive sólo en memoria, jamás en el almacenamiento ni en logs. La política de seguridad del navegador (CSP) lista únicamente los dominios de Google necesarios.
- **Nombres únicos y sin pisar**: cada guardado crea un archivo nuevo con nombre `<ID de ciclo>_<lote>_<aaaa-mm-dd>_v<n>` (el legajo usa `legajo|<leg>`); si el nombre existe se incrementa la versión. Nunca se sobrescribe ni se borra. La carpeta se ubica por una propiedad propia (no por el nombre) y cada archivo lleva una huella del contenido: si el contenido no cambió, no se vuelve a subir (idempotencia, sin duplicados).
- Estados honestos: "Sin guardar", "Guardado en Drive (fecha, versión)", "Error / requiere reconectar". Sin conexión o sin autorización no se afirma nada guardado.
- Desconectar descarta el token en memoria y no borra nada en el Drive de la ONG.
- Pruebas: con Google simulado (creación de carpeta, nombre único, colisión → v+1, mismo contenido no duplica, errores 401/403/red). Pendiente de prueba con cuenta real de Google [VERIFICAR scopes y verificación de la aplicación en la documentación oficial].

## 7 quinquies. Modo "sistema completo para probar" (reemplaza al modo demo)
- Sin carteles "demo" ni "demostración": el sistema se entrega operativo. Los datos iniciales son de ejemplo, se identifican como "Datos de ejemplo" (indicador en el panel y aviso en el menú) y se retiran con un botón "Empezar de cero en este equipo" (con doble confirmación y auditoría) que borra pacientes, lotes, dispensaciones, donaciones, cajas, cultivos y comprobantes pero conserva usuarios, permisos, ajustes, menú y rubros.
- Tras vaciar, todas las pantallas funcionan sin errores y se puede dar de alta, dispensar, cobrar donaciones y cargar cultivo desde cero.
- Lo que depende de terceros sigue marcado: Factura C simulada hasta tener certificado y CAE real; Drive, Mercado Pago, nube y correo "Pendiente de configuración".

## 8. Módulos de ONG (sobre el Core de Sistema VB; todos por bandera)
Pacientes/socios y legajo · dispensaciones o prestaciones con trazabilidad de lote/stock y topes por persona · planilla de seguimiento de cultivo (7 ter) · estado del trámite propio (vigencia, vencimiento, alertas) · donaciones y Factura C · caja con apertura, arqueo, cierre sellado y cajas cerradas · dashboard Analytics (donaciones, entregas, stock, trámites por vencer) · inventario y lotes · fidelización/cuotas de socios · personal y fichaje · tareas y organigrama · talleres, cursos y servicios (menú) · importar/exportar todo (CSV;, UTF-8 BOM, anti-fórmulas, sin duplicar, reversión del último lote) · integraciones por tenant (nube, Mercado Pago, Drive con nombres únicos (7 quater), correo, WhatsApp) siempre "Pendiente de configuración" hasta probarlas · usuarios, roles, auditoría encadenada, ajustes.
Periféricos y nube según Sistema VB (HAL, Supabase, RLS, idempotencia).

## 9. Privacidad y datos sensibles
Los datos de salud son sensibles: cifrado en reposo y tránsito, acceso por rol y por necesidad, auditoría de lectura, consentimiento por finalidad separado, derechos del titular (acceso, rectificación, supresión) con canal visible, retención y registro de la base ante la autoridad [VERIFICAR con asesor/a legal y fuente oficial]. Nunca en logs ni en URLs; nunca en el menú público; WhatsApp, correo, nacimiento y documento cifrados en la versión real.

## 10. Pruebas y definición de terminado
Suites automáticas de flujos reales: panel, menú público, ingreso/roles, importación/exportación, caja/cierres, legajo y duplicados, turnero, carga del menú sin parpadeo y créditos visibles, planilla de cultivo, Drive simulado, "empezar de cero", donaciones y Factura C con y sin documento, vocabulario (búsqueda de "Aporte"/"cliente"/"venta"…), responsive 320/360/768/1024/1440 sin desbordes, XSS, aislamiento A/B, regresión completa, y verificación en la URL publicada (con parámetro de versión para evitar caché). Nada se declara "100 % funcional": se informa lo probado, lo pendiente de configuración (certificado ARCA, Drive, Mercado Pago, textos legales) y lo pendiente de prueba física (hardware).

## 11. Entrega final (formato)
1) Qué se implementó y qué pruebas pasaron (cifras). 2) Qué debe hacer la ONG (textos legales, certificado de ARCA, cuentas de integraciones, umbral). 3) Qué no se pudo probar y riesgos abiertos. 4) Créditos de Rave Holding.
