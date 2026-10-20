# SISTEMA_VB_ONGF — Prompt maestro para ONG (Sistema VB 26F adaptado y corregido)

Versión: ONGF 1.0 · 2026-10-20 · Rave Holding
Deriva de: SISTEMA_VB_26F (RAVE CORE FINAL V2 + sección P) y de Sistema VB ONG v3.0 (Fundación Cannabismatica I+D).

## USO
Usar este documento completo como prompt maestro para ONG. Donde difiera del 26F, **manda este documento**. Todo lo que sigue es requisito de implementación, no funcionalidad ya hecha. Antes de tocar un repositorio, inspeccionar el código real y aplicar "Detectar antes de agregar".

## ALCANCE: QUÉ ENTRA Y QUÉ QUEDA AFUERA
**Excluido (no se implementa, no se muestra, no se deja "apagado" en la interfaz):**
- Ventas mayoristas, precios por tramo, bultos/packs cerrados, unidades por bulto, reglas de descuento mayorista (26F: N.2 completo, "Reglas mayoristas", bultos en inventario, importación/exportación de esas columnas).
- Multisucursal: sucursales, depósitos, stock por sucursal, caja por sucursal, filtros por sucursal en reportes, valor por defecto de ARCA por sucursal, transferencias entre sedes.
- También quedan fuera por no aplicar a una ONG: cuotas de tarjeta e intereses (N.3), gastronomía (mesas/mozos), órdenes de trabajo, comisiones de vendedores (O.6.C-D), recetas de cocina (O.4), Meta Pixel (O.8), cupones comerciales (O.3 cupones y suscripciones comerciales), campañas de marketing con anuncios pagos (N.6).
- Si el equipo tiene una sola sede, el modelo es **una ONG = un comercio (tenant) = una sede**. La columna `sucursal_id` no existe; si algún día se necesita, es otro proyecto.
**Se conserva del 26F:** Core, ONG/legajo/dispensación, caja y cierres sellados, rubro financiero obligatorio (O.10), inventario por lote, proveedores y gastos, donaciones y Factura C, club de sellos, personal/fichaje, menú público ampliado (P, menos lo excluido), Drive, importar/exportar, auditoría, nube Supabase, seguridad, recuperación y soporte.

## 0. Reglas de trabajo (heredadas del 26F, sin cambios)
1. Castellano rioplatense simple; identificadores de código en inglés.
2. No inventar endpoints, leyes, resoluciones ni topes: marcar **[VERIFICAR]** con la fuente oficial (arca.gob.ar, argentina.gob.ar, AAIP, Ministerio de Salud).
3. Antes de programar, listar supuestos. Señalar lo contradictorio o riesgoso y proponer la alternativa segura.
4. Seguro por defecto: sin credenciales ni secretos en el código ni en el HTML (variables de entorno / secretos del proveedor).
5. Nada nuevo rompe lo existente: capacidades como módulos con bandera, apagadas por defecto si cambian el comportamiento o dependen de terceros.
6. Detectar antes de agregar: si existe y funciona, no se toca; si está incompleta, se completa; si está duplicada, se fusiona sin perder capacidades; si no existe, se agrega como módulo. Nunca dos veces.
7. Hacer el trabajo completo (código, pruebas, subida); si falta un dato, consultar **una sola vez y junto**.
8. Una sola pasada final de correcciones pendientes antes de dar por terminado. Pruebas automáticas de flujos reales y, para lo de alto riesgo, revisión de un agente independiente.
9. Dinero en centavos enteros o DECIMAL(14,2); fechas en UTC con zona del comercio (America/Argentina/Salta).
10. Entrega honesta: qué quedó, qué debe hacer la ONG, qué no se pudo probar ("pendiente de configuración" / "pendiente de prueba física"). Nunca "100 % funcional" sin evidencia reproducible.

## 1. Ficha de la ONG (completar)
Nombre y personería · rubro · domicilio y ciudad · WhatsApp (549…) · correo · CUIT y condición frente al IVA · logo, dos colores, dirección corta del menú · alias/CBU/Mercado Pago para donaciones · marco normativo propio (ej. Ley 27.350 / REPROCANN) [VERIFICAR] · equipo (nombre, correo, rol) · cajas/equipos (una sede) · idiomas ES/EN · ¿Turnero? · ¿Club de sellos? · ¿Asistente de voz habilitado? · ¿Drive/Sheets/Formularios? · ¿lector de huellas (modelo exacto)? · ¿Factura C ante ARCA ya habilitada? · umbral de identificación del receptor [VERIFICAR].

## 2. Vocabulario obligatorio de ONG
Nunca mostrar: cliente, venta, compra, cobro, precio, vender, cobrar, comprador, **aporte(s)**, mayorista, sucursal, depósito.
Cliente → Paciente / Socio/a · Venta → Dispensación / Entrega · Cobro → **Donación (voluntaria)** · Proveedor → Proveedor (se mantiene) · Facturador → Módulo de Factura C.
Prueba: recorrer todas las pantallas y buscar por texto cada palabra prohibida (ES y EN).

## 3. CORRECCIONES AL SISTEMA EXISTENTE (lista de arreglos a aplicar en una sola pasada)
A. **Asistente de voz** (sección 4): hoy no existe en el código → módulo nuevo.
B. **Club** (sección 5): unificar club de sellos, tarjeta y alta pública sin duplicar clientes.
C. **Tarjetas** (sección 6): corregir tarjeta de participación (QR hoy no se lee con cámara) y carnet de personal.
D. **Proveedores** (sección 7): hoy sólo hay un texto en Integraciones → módulo nuevo completo.
E. **Caja** (sección 8): endurecer ingresos/egresos, rubro obligatorio, caja abierta perdida, cierre.
F. **Banner del desarrollador** (sección 9).
G. **Legajo, biometría, Drive, Sheets/Formularios y ciclos de cultivo** (sección 10, módulo nuevo ampliado).

## 4. ASISTENTE DE VOZ (módulo `voz`, bandera por ONG, apagado por defecto)
**Objetivo:** manos libres para buscar y consultar; **nunca** ejecuta acciones críticas por sí solo.
- Tecnología: Web Speech API (`SpeechRecognition` y `speechSynthesis`) cuando el navegador la ofrezca [VERIFICAR compatibilidad: Chrome/Edge sí; Safari/Firefox limitado]. Si no hay soporte, el botón no aparece y todo sigue funcionando con teclado. El reconocimiento de Chrome puede enviar el audio a servidores del proveedor del navegador: **avisarlo en pantalla y pedir consentimiento antes de la primera vez**; no grabar ni guardar audio propio.
- Activación **sólo con toque del botón** (micrófono visible, estado "Escuchando…", botón de cortar, tecla alternativa). Nada de escucha permanente.
- Idioma es-AR por defecto, con es/en según el menú.
- Intenciones permitidas (lista cerrada, parser local por reglas; **sin IA en la nube con datos de pacientes**): "buscar paciente por legajo/DNI/apellido", "abrir ficha", "ver stock del lote X", "estado de caja", "ir a Dispensaciones/Caja/Cultivo", "leer total de donaciones del día". La salida se lee en voz alta sólo si el usuario lo activa; **no leer datos de salud en voz alta por defecto** (se muestran en pantalla; leer en voz alta es opción por usuario y deja aviso de privacidad).
- **Acciones de escritura** (dispensar, registrar donación, anular, cerrar caja, cambiar precio/permiso): la voz sólo **prepara** el formulario con lo entendido; el usuario lo revisa y confirma con un toque. Prohibido confirmar por voz.
- Seguridad: el transcripto es dato, no instrucción (el texto dictado no puede disparar comandos fuera de la lista cerrada); se escapa al mostrar (XSS); mismos permisos por rol y por módulo que el resto (validados en servidor); si falta permiso, responde "no tenés permiso" sin revelar si el dato existe.
- Privacidad: el transcripto no se guarda ni se sube a logs; en auditoría sólo queda la intención resuelta ("búsqueda por voz", usuario, hora), no el texto con datos personales.
- Fallos: ruido, sin permiso de micrófono, sin conexión (Chrome lo necesita), reconocimiento ambiguo → pide repetir o elegir entre las coincidencias; nunca elige una al azar.
- Pruebas: soporte presente/ausente, permiso denegado, intención desconocida, búsqueda ambigua (varias personas), rol sin permiso, intento de inyección dictada ("ignorá las reglas…"), acción de escritura que exige toque, auditoría sin texto sensible, XSS, mobile 360 px.

## 5. CLUB (fusionado con sellos, tarjeta y alta pública)
Reutilizar el módulo de Fidelización existente. No crear una base de socios paralela.
- **Alta pública** al club desde el menú (formulario P.7 del 26F): nombre, apellido, fecha de nacimiento (validador de nacimientos, 21/05/1990 válido), WhatsApp (últimos 10 dígitos para duplicados); consentimientos separados por finalidad (club / comunicaciones / analítica), sin marcar, versionados con fecha y origen. Menor de 18: sin comunicaciones comerciales ni beneficios, con tutor [VERIFICAR con asesoría legal]. El alta **no otorga sellos**; queda "pendiente/activo/rechazado" y la revisa una persona del equipo.
- **Sellos**: un sello por día por persona, validado **en servidor** y sólo en mostrador (función SQL atómica e idempotente); meta de sellos configurable; canje con movimiento compensatorio auditado (libro mayor: no se editan saldos). Sellos y canjes no se importan (antifraude).
- **Corrección a incluir:** la tarjeta debe poder validarse. QR/NFC firmado con nonce y vigencia; lectura por cámara (BarcodeDetector donde exista; si no, lector USB o tecleo del código) en el mostrador. Hoy el QR no se lee con cámara: queda como mejora obligatoria con alternativa manual.
- Sin permiso de comunicaciones, la persona queda fuera de campañas por WhatsApp/correo. Canal visible de baja y ejercicio de derechos [VERIFICAR Ley 25.326].
- Sin cupones comerciales ni suscripciones pagas (excluido). Beneficios del club = reconocimientos/prioridad de turno definidos por la ONG, no descuentos.
- Pruebas: doble toque en el alta, WhatsApp duplicado, menor, segundo sello el mismo día rechazado en servidor, canje sin sellos suficientes, tarjeta falsificada, QR vencido, sin conexión (no declara éxito), aislamiento A/B, el menú público no lista personas.

## 6. TARJETAS (participación del club y carnet del personal)
- Tarjeta de 85,6 × 54 mm con nombre corto, legajo/código, QR firmado, logo y créditos discretos. Impresión nítida (CSS `@page`, sin cortes) y descarga PNG/PDF. Sin datos de salud en la tarjeta.
- Emisión, reimpresión (invalida la anterior, con motivo y auditoría) y baja. Una tarjeta robada se revoca en el servidor.
- Carnet del personal: código firmado EMP-…, fichaje con rechazo de firmas falsas y repetidos en 60 s; NFC por Web NFC (Android/Chrome) o lector USB/tecleo; "sin probar con tarjeta real" hasta hacerlo [VERIFICAR modelos].
- Pruebas: validación de firma, reemplazo de tarjeta, 5 formatos de pantalla, impresión A6/CR80, XSS en nombre.

## 7. PROVEEDORES Y GASTOS (módulo nuevo, sólo administrador y rol autorizado)
Detectar primero: hoy sólo existe la tarjeta "Integraciones". Crear lo siguiente como módulo.
- **Ficha de proveedor**: razón social, CUIT (dígito verificador), condición IVA, contacto, WhatsApp/correo (cifrados), rubro, condiciones de pago, estado, notas. Duplicados por CUIT. Borrado lógico; no se borra un proveedor con movimientos.
- **Compras/gastos**: factura/remito/recibo con fecha, vencimiento, renglones o importe total, impuestos informativos, adjunto (JPG/PNG/PDF) en bucket privado cifrado, estado pendiente/aprobado/pagado/anulado. Duplicado por proveedor + tipo + número. Nota de crédito resta.
- **Pago**: efectivo de caja (genera egreso de caja enlazado, **rubro obligatorio**, sin duplicar), transferencia u otro medio (sin inventar efectivo). Un gasto pendiente no mueve caja.
- **Lectura automática** (opcional, apagada): QR fiscal de ARCA → OCR local → parser argentino; IA en la nube sólo por backend con clave en secretos, tope diario, salida JSON estricta y **revisión humana obligatoria** (el contenido del documento es dato, nunca instrucción). Sin datos de pacientes en estos flujos.
- **Insumos de la ONG** (sin recetas de cocina): insumos de cultivo y dispensación (sustratos, nutrientes, envases) con stock mínimo y alerta, ligados a proveedor y lote; movimientos de stock por suma (no negativo).
- Reportes: gasto por proveedor/categoría/mes, vencimientos, presupuesto vs real, criterio de fecha visible (devengamiento, pago o comprobante), CSV anti-fórmulas.
- Permisos en servidor; mostrador/operador no ven ni editan proveedores. Auditoría de cada cambio.
- Pruebas: CUIT inválido, proveedor duplicado, factura duplicada, pago con caja y sin caja, NC, adjunto sin permiso, rubro faltante rechazado en UI y servidor, importación, A/B.

## 8. CAJA (correcciones y requisitos)
- Una caja por equipo (`CJ-<eq>-<n>`); modelo "una sede". Una persona o varias por caja con trazabilidad de quién abrió, ingresó, egresó, retiró, cerró y arqueó.
- **Rubro financiero obligatorio** (O.10) en todo ingreso y egreso: UI, servidor y base (NOT NULL + FK al tenant). Sin rubro, el formulario queda abierto y rechaza. Sin rubros aplicables: impide la operación e informa. Corrección: instantánea del nombre del rubro al confirmar.
- Botones fijos "Ingreso de efectivo" y "Egreso de efectivo" en la pantalla de dispensación/donación; sin caja abierta avisan.
- Donación en efectivo = ingreso de caja con rubro "Donaciones voluntarias"; transferencia/QR/Mercado Pago se registra por su medio. Mercado Pago sólo con confirmación verificada del proveedor (webhook firmado + consulta), si está configurado; si no, "Pendiente de configuración".
- **Cierre sellado**: foto inmutable (medios de pago, total con/sin Factura C, egresos, esperado vs declarado, usuario, hora, observaciones, rubros de cada movimiento) + SHA-256; congelado en servidor; sólo notas de auditoría agregadas; correcciones por movimiento compensatorio con rubro y motivo.
- **Corrección — caja abierta perdida:** hoy un equipo perdido deja la caja abierta sin salida. Agregar "Cierre administrativo de caja huérfana" (sólo administrador, con arqueo declarado, motivo obligatorio, marcado en el sello y en auditoría), disparado también por alerta de caja abierta > 24 h.
- Cajas cerradas: lista y calendario, filtros, alerta de días con movimiento y sin cierre, ficha A4, CSV.
- Offline: se sigue operando; al sincronizar el servidor revalida rubro, tenant y permisos; los rechazados quedan visibles y recuperables, nunca marcados como sincronizados.
- Pruebas: rubro vacío/ajeno/inactivo/incompatible, doble clic, dos cajas concurrentes, cierre congelado, cierre huérfano, offline→sync con rechazo, devolución parcial (nota de crédito), importación sin rubro exige mapeo.

## 9. BANNER DEL DESARROLLADOR (créditos Rave Holding)
- Texto oficial: **"Desarrollado por Rave Holding · WhatsApp +54 9 387 514-3900 · raveholding@gmail.com"**, con enlaces `https://wa.me/5493875143900` (mensaje prellenado que identifica a la ONG, sin datos de personas) y `mailto:`. [Confirmar con el equipo de Rave Holding si hay una marca/leyenda distinta para este producto antes de publicar.]
- Presente en: pantalla de ingreso, menú público (tarjeta propia al final), páginas por producto/servicio, asistente de voz (panel), barra lateral, tickets y comprobantes, pantalla del cliente/paciente, tarjetas impresas (versión corta), instalador/PWA y pie de exportaciones PDF.
- Presentación elegible (texto completo, corto, ícono con nombre) y idioma; **no se puede eliminar**. Nunca tapado por botones flotantes (WhatsApp, volver arriba, barra inferior); margen inferior verificado con captura en 320/360/768/1024/1440.
- Prueba: presencia en cada superficie, enlaces correctos, sin superposición, ES/EN.

## 10. LEGAJO, BIOMETRÍA, DRIVE, SHEETS Y CICLOS DE CULTIVO (módulo ampliado)
Marco: trazabilidad de pacientes, legajos y dispensación/cultivo con Google Drive API v3, Google Sheets API v4 y lector de huellas. **Todo apagado por defecto**, con estados "Pendiente de configuración" honestos.

### 10.1 Identidad y modelo de datos
- `legajo_id` único e **inmutable** (legible `L-aammdd-XXXXXX` + UUID interno; UNIQUE NOT NULL). Nunca se reutiliza ni se edita. Documento repetido = ficha nueva marcada "posible duplicado" (sin fusionar sola).
- Campos del registro de trazabilidad (todas las tablas con `tenant_id`, RLS, `created_at/updated_at`, borrado lógico):
  `legajo_id`, `biometric_template_hash`, `drive_folder_id`, `sheet_row_id`, `ciclo_cultivo_id`, `origen_cultivo`, `fecha_registro` (UTC), `usuario_id`, `tipo_seguimiento` (alta, seguimiento, dispensación, consulta, documento, formulario).
- **Auditoría inmutable por operación** (alta, validación biométrica, actualización, consulta, dispensación): tabla sólo-agregar con timestamp UTC, usuario ejecutante y **ID de transacción**, encadenada por hash; sin datos biométricos ni clínicos en el texto del log.
- Cada dispensación y cada seguimiento referencia obligatoriamente su **"Origen de cultivo"** (ciclo); sin ciclo válido, se rechaza en servidor.

### 10.2 Lector de huellas (HAL `fingerprint_reader`, módulo `biometria`)
Condiciones de habilitación (todas): modelo físico exacto documentado (DigitalPersona, SecuGen, ZKTeco u otro) con SDK/driver/licencia y SO [VERIFICAR]; **revisión legal aprobada** (dato biométrico de alto riesgo, Ley 25.326 [VERIFICAR con asesor/a legal y AAIP]); consentimiento expreso y revocable del titular; alternativa manual siempre disponible. Hasta entonces: "Pendiente de prueba física / revisión legal", sin simular.
- **Vías técnicas, dichas con honestidad**: (a) **WebAuthn/FIDO2** es lo único nativo del navegador, pero autentica a *quien tiene un autenticador registrado*, no identifica a un paciente entre muchos (no sirve para "poner el dedo y encontrar a la persona" 1:N); sirve para autorizar al **personal**. (b) La **identificación 1:N de pacientes** por lectores DigitalPersona/SecuGen/ZKTeco exige SDK nativo → **agente local** (127.0.0.1, emparejamiento de un solo uso, orígenes en lista blanca, mensajes firmados) o app de escritorio; no existe en el navegador puro.
- **Qué se guarda**: sólo el **hash/plantilla codificada**, nunca la imagen cruda. Si el SDK exige plantilla, se cifra en reposo y tránsito, acceso restringido, retención y borrado definidos, jamás en logs, exportaciones ni IA. Nota técnica: el *hash criptográfico* de una plantilla no sirve para comparar huellas (cada lectura varía); la comparación 1:N la hace el SDK/agente local sobre plantillas cifradas; el campo `biometric_template_hash` guarda la **referencia protegida** (identificador/huella digital de la plantilla cifrada), y la coincidencia se resuelve localmente. [VERIFICAR con el fabricante antes de diseñar el almacenamiento.]
- **Flujo de dispensación**: dedo → coincidencia local → devuelve `legajo_id` → el sistema abre ficha, historia clínica y **estado actual de dispensación**; todo validado además en servidor (usuario activo, rol, tenant, dispositivo autorizado, desafío/nonce anti-repetición).
- **Sin coincidencia**: asociación rápida de la huella capturada a un perfil **recién ingresado por Formulario/Sheet** (con consentimiento en el momento), creando el vínculo `legajo_id ↔ plantilla protegida` con auditoría; nunca se asocia a una ficha existente sin confirmación humana.
- La huella **no es único factor** para recuperar cuentas ni para operaciones financieras críticas. Si el lector falla o falta, nada se bloquea: se identifica por legajo/DNI.
- Pruebas físicas por modelo: coincidencia/no coincidencia, dedo no registrado, sensor desconectado, timeout, repetición (replay), dos personas, borrado de plantilla, offline, auditoría sin dato biométrico.

### 10.3 Ciclos de cultivo
- Cabecera: **nombre del ciclo/sala arriba** (ej. "Sala 1 vege") y **código único abajo** (ej. "CU-261020-1TCD3": prefijo CU + aammdd + sufijo aleatorio sin caracteres ambiguos, verificado único con reintentos).
- **Cantidad** (volumen/peso/unidades, con unidad) y **Variedad** (genética/cepa) **editables en tiempo real**; cada cambio conserva valor anterior, motivo y usuario (nada se pisa en silencio); sincronización entre equipos. Ciclo cerrado = sólo lectura.
- Planilla de seguimiento (del 7 ter de ONG v3): N°, fecha, día, semana, fase, PH/EC, humedad, temperatura, runoff, observaciones, encargado/a; reglas de rango y A4/CSV ya definidas.
- Trazabilidad: lote → ciclo → dispensación → legajo, consultable en ambos sentidos.

### 10.4 Google Drive API v3 (cuenta de servicio, por backend)
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

### 10.5 Google Sheets API v4 y Formularios (ingesta)
- Ingreso de datos por **Google Form → Sheet**: Apps Script `onFormSubmit` que envía un **webhook firmado (HMAC con secreto compartido guardado en secretos, nunca en el script público)** a una Edge Function; alternativa: lectura periódica por Sheets API v4 con la cuenta de servicio (la hoja compartida con ella). [VERIFICAR cuotas y límites de Apps Script/Sheets.]
- Validación **antes de crear**: duplicado por DNI y por legajo; si existe, **no se crea otra ficha**: se agrega el formulario como hito de la existente y se marca para revisión; DNI inválido se rechaza con motivo.
- Idempotencia: `sheet_row_id` (hoja + fila + marca de tiempo/ID de respuesta) único; reenvíos del webhook no duplican.
- **Cada formulario = hito cronológico** en la historia del legajo (`tipo_seguimiento = formulario`), sólo agregar, con origen "Sheet/Form", usuario del sistema "integración" y transacción auditada.
- Los datos del formulario son **no confiables**: saneamiento, escape (XSS), neutralización de fórmulas al exportar, límites de tamaño y de frecuencia; nunca ejecutar contenido de celdas.
- Si la hoja o el webhook fallan, la entrada queda en bandeja "pendiente de resolver", sin crear ficha parcial.
- Pruebas: formulario nuevo, DNI duplicado, legajo duplicado, firma inválida, replay, fila repetida, datos con fórmula/HTML, hoja sin permiso, A/B.

## 11. NUBE Y SEGURIDAD (del 26F, aplicadas a la ONG)
- Un proyecto Supabase propio de la ONG (región São Paulo), RLS en todas las tablas, escritura sólo por funciones `SECURITY DEFINER` (`sync_push`: lista cerrada de colecciones, roles/niveles por módulo, stock no negativo con bloqueo, cierres congelados, auditoría sólo-agregar). Colección nueva ⇒ actualizar `sync_push` y la política de lectura.
- Ingreso con Supabase Auth (8+ caracteres con letras y números; sin registro libre); primer admin con código de configuración de un solo uso; recuperación y soporte (`soporte_restablecer_clave` sólo desde el SQL Editor); cierre por inactividad; bloqueo creciente.
- Datos del equipo cifrados (AES-256-GCM, PBKDF2-SHA256 200.000) en IndexedDB; nada sensible en `localStorage` ni en URLs.
- CSP estricta con `connect-src` sólo al proyecto y a Google si se usa; sin scripts de terceros innecesarios.
- Migraciones **aditivas, numeradas, idempotentes**, probadas en copia y con backup/restauración verificados antes de producción. No pedir al dueño ejecutar archivos que no existan en el repositorio.
- Datos de salud: cifrado, acceso por rol y necesidad, auditoría de lectura, consentimiento por finalidad, derechos del titular, retención y registro de la base [VERIFICAR con asesor/a legal y fuente oficial].

## 12. PRUEBAS Y DEFINICIÓN DE TERMINADO
Suites automáticas de flujos reales (no sólo "carga la pantalla"): asistente de voz, club/sellos/tarjeta, proveedores y gastos, caja y cierres (incl. huérfana), banner, legajo y duplicados, ciclos de cultivo, Drive (simulado y real), Sheets/Formularios, biometría (simulada en software; real **sólo** con modelo físico), donaciones y Factura C, vocabulario (búsqueda de palabras prohibidas, incluidas mayorista/sucursal), responsive 320/360/768/1024/1440, XSS, aislamiento A/B, regresión completa de la v3, y verificación en la URL publicada (con parámetro de versión). Revisión independiente de seguridad para: biometría, Service Account, webhooks y datos de salud.
**Terminado =** pruebas en verde + regresión sin pérdidas + revisión sin pendientes de seguridad + documentación + entrega honesta.

## 13. DEPENDENCIAS DE TERCEROS Y LÍMITES (decirlo siempre a la ONG)
- Service Account de Google: proyecto Google Cloud, APIs Drive y Sheets habilitadas, JSON cargado por canal seguro en secretos, carpeta compartida con la cuenta de servicio.
- Lector de huellas: modelo, SDK, licencia, agente local y **revisión legal**; sin eso el módulo no se habilita. Identificación 1:N no es posible sólo con el navegador.
- Reconocimiento de voz: depende del navegador y puede enviar audio al proveedor del navegador.
- Factura C real: certificado digital y WSFE [VERIFICAR arca.gob.ar]; hasta entonces simulada y rotulada.
- Mercado Pago, correo y WhatsApp automático: cuenta, credenciales y pruebas sandbox; "Pendiente de configuración" hasta entonces.
- Normativa (REPROCANN, datos de salud, menores, registro de base, retención): asesor/a legal y fuente oficial.
- Supabase plan gratuito: respaldos y pausa por inactividad [VERIFICAR plan].
- Dos ediciones simultáneas del mismo registro: gana la última guardada.

## 14. ENTREGA FINAL (formato)
1) Qué se implementó y qué pruebas pasaron (cifras). 2) Qué debe hacer la ONG (compartir la carpeta con la cuenta de servicio, cargar secretos, textos legales, certificado ARCA, revisión legal de biometría). 3) Qué no se pudo probar (hardware real, cuentas reales) y riesgos abiertos. 4) Créditos: Desarrollado por Rave Holding · WhatsApp +54 9 387 514-3900 · raveholding@gmail.com.

— FIN DE SISTEMA_VB_ONGF —
