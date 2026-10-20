# Cannabismatica I+D · Sistema ONG (sistema completo para probar)

Sistema completo (HTML5, funciona sin conexión en el navegador) para prueba del cliente, del sistema de gestión de la **Fundación Cannabismatica Investigación y Desarrollo** (ONG de cannabis medicinal, Salta · Ley N.º 27.350 · REPROCANN).
Para que el equipo y el cliente la recorran y definan correcciones. **No es el sistema final**: los datos son ficticios y se guardan sólo en el navegador de quien la abre.

## Qué incluye

| Módulo | Qué hace |
|---|---|
| **Búsqueda por DNI** | El DNI es la clave primaria: buscador global (arriba) y en Inicio. Si el DNI no existe, abre el ingreso breve. |
| **Ingreso breve** | Nombre completo, DNI y teléfono. Después se completa la **Historia clínica / Solicitud REPROCANN** (mismos campos del formulario de Google). |
| **Ficha del paciente** | Datos, estado REPROCANN, dispensaciones, aportes, seguimientos y los dos accesos a Drive. |
| **Google Drive** | **Drive 1**: ficha de datos y documentación. **Drive 2**: historial clínico. Enlace editable por paciente (sólo https de Google). |
| **REPROCANN** | Estado de la ONG (Válido / Vencido / En trámite) con fecha de vencimiento y días restantes, y vigencia de cada paciente con alertas. |
| **Dispensaciones y trazabilidad** | Lotes con stock por movimientos (frascos, gramos, aceites, cremas, comestibles), anulación con motivo, informe por período, CSV y auditoría. Etiqueta imprimible con **QR al formulario de Seguimiento médico**. |
| **Donaciones voluntarias y Factura C** | Registro de aportes y **Factura C simulada** (más nota de crédito C). Marcada como *documento de demostración sin validez fiscal*. |
| **Seguimiento médico** | Formulario mensual con las mismas opciones del formulario de Google. |

### Módulos de gestión (Sistema VB adaptado a la ONG)

| Módulo | Qué hace |
|---|---|
| **Dashboard** | Donaciones, dispensaciones, egresos y resultado de caja estimado; filtros por período, medio y Factura C; tabla equivalente y CSV. |
| **Caja · Arqueo y cierre · Cajas cerradas** | Apertura, ingresos/egresos con **rubro financiero obligatorio**, arqueo por denominaciones, cierre con foto inmutable y sello SHA-256, historial en lista y calendario, alerta de días sin cierre, ficha A4 y verificación de integridad. |
| **Inventario** | Insumos y movimientos de stock, stock mínimo, rubros de inventario, historial y CSV. |
| **Fidelización** | Tarjeta de sellos con QR firmado (1 por día), cupones con límites, membresías con consentimiento versionado y aporte asociado. |
| **Personal y fichaje** | Empleados, tarjeta/QR firmado, fichaje (rechaza firmas falsas y repetidos en 60 s), planilla de horas. |
| **Tareas y organigrama** | Tablero Kanban y organigrama editable. |
| **Menú público** | Página completa «Quiero mi REPROCANN, talleres, cursos y servicios», ES/EN: portada, buscador, tarjetas con detalle (duración, qué incluye), agenda de talleres y cursos, cómo funciona, preguntas frecuentes, contacto, Club (consentimientos y control de menores), Wi-Fi, redes, QR y compartir; enlace directo a cada servicio (`#/m/P4`). Todo se edita en Administración → Menú público (borrador → publicación con versiones y reversión); acceso oculto en `#/acceso`. |
| **Nube · Periféricos y ticket · Integraciones** | Estados honestos: *Pendiente de configuración* / *pendiente de prueba física*. Respaldo local real. Ticket 58/80 mm de ejemplo. |
| **Importar / Exportar** | Pacientes, personal, insumos de inventario y servicios del menú, desde CSV, Excel (.xlsx) o pegando desde una planilla; 3 pasos con errores por fila, modo prueba, duplicados, atomicidad y deshacer lote; exportaciones con neutralización de fórmulas. |
| **Usuarios y permisos · Auditoría · Configuración** | 4 roles × módulos (simulado en el navegador), auditoría con cadena de hashes verificable, módulos activables y rubros financieros. |

Terminología de ONG en toda la interfaz: paciente/socio, dispensación, donación voluntaria, Factura C ante ARCA.

## Cómo probarla

- **Primero se abre el menú público** (como lo ve la gente). Para el personal: botón **Acceso del equipo** (o tocar 5 veces el logo) → correo y clave. Usuarios de ejemplo: `admin@`, `ana@` (supervisora), `beto@` (mostrador), `cele@` (operador) `example.com`; clave de demostración compartida **Demo2026!** (sólo para la demo, se muestra rotulada en la pantalla de ingreso). 5 intentos fallidos bloquean 2 minutos; las claves temporales obligan a elegir una propia. «Salir» vuelve al menú.
- Contacto de la ONG en el menú: WhatsApp 3876390362.
- Entrá a la URL de GitHub Pages del repositorio (o abrí `index.html` desde un servidor local: `python3 -m http.server`).
- Pacientes de ejemplo: **99000001** (válido), **99000002** (vence en 25 días), **99000003** (en trámite), **99000004** (vencido: la dispensación se bloquea), **99000005**, **99000006** (historia pendiente).
- *Ajustes → Restablecer datos de ejemplo* vuelve todo al inicio.
- Parámetro opcional `?hoy=AAAA-MM-DD` para simular otra fecha (vigencias).

## Fase 6 (novedades)
- **Planilla de seguimiento de cultivo** (Trazabilidad → "Planilla de cultivo" y menú lateral "Cultivo"): N°, Fecha, Día, Semana, Fase, Riego (PH/EC), H %, Temp, R. Off (EC/PH), Observaciones y Encargado; corrección/anulación con motivo, ciclo cerrado de sólo lectura, impresión A4 y CSV.
- **Google Drive opcional** (`js/m-drive.js`): la ONG carga su Client ID de Google; guarda cada ciclo como archivo nuevo con nombre único `<ciclo>_<lote>_<fecha>_v<n>`, sin pisar ni duplicar. Probado sólo con Google simulado; falta probar con cuenta real. La CSP ahora permite los dominios de Google necesarios.
- **Menú público**: carga sin parpadeo del panel, encabezado opaco y créditos de VINCULAR BUSINESS visibles.
- **Empezar de cero**: botón en Ajustes que retira los datos de ejemplo conservando usuarios, ajustes y menú.
- Prompt reutilizable para otras ONG: `docs/Sistema-VB-ONG.md` (v2).

## Límites de la demo (a validar antes del sistema real)

- Los datos **no** viajan a ningún servidor. La versión real usaría una base con aislamiento por organización y cifrado.
- **Factura C**: simulada. El CAE real requiere certificado digital de la ONG y conexión con los servicios de ARCA **[VERIFICAR con el contador y en arca.gob.ar]**.
- **Drive**: en la demo los enlaces apuntan a Google Drive en general; la creación automática de carpetas por DNI queda para la etapa real.
- Normativa (vigencias REPROCANN, exención de la ONG, texto de consentimiento) **[VERIFICAR con asesor legal y fuentes oficiales]**.
- Las reglas de bloqueo y el tope mensual de flores son configurables y no representan una regla legal.

- Nube (Supabase), pagos (Mercado Pago), Google, correo/WhatsApp, lector biométrico, impresoras y balanzas **no están conectados**: la demo lo dice en pantalla. Fotos reales con zoom (las tarjetas usan ilustraciones propias), mapa embebido y reseñas de Google no están en esta demo.
- El ingreso (usuarios y claves con hash) y los roles funcionan sólo en el navegador: es una demostración, no seguridad real. En el sistema real se validan en el servidor.
- Los roles y permisos se simulan en el navegador; en el sistema real se validan en el servidor.

## Novedades de la versión 5

- **Estética** de la demo anterior (menú público oscuro con verde lima, panel claro con barra lateral negra): `css/theme.css`.
- **Historia Clínica · Solicitud Reprocann** en el menú público (`js/m-hc.js`): formulario de alta + datos médicos; cada envío crea un paciente nuevo con **legajo único** (`L-aammdd-XXXXXX`) y carpeta de Drive sugerida única. Un documento repetido nunca pisa la ficha: queda marcado como posible duplicado. Los datos quedan **sin verificar** hasta que el equipo los revise.
- **Turnero Digital** para pacientes/socios en la misma sección, con WhatsApp directo; el equipo confirma o rechaza desde Administración → Menú público.
- **Donación** reemplaza a "Aporte" en toda la interfaz (español e inglés).
- **Documento opcional** (DNI, CUIT o CUIL) en pacientes, dispensaciones, donaciones e importación; Factura C simulada a consumidor final sin documento. El tope desde el cual se pide documento es configurable en Ajustes [VERIFICAR en arca.gob.ar].
- Identificación interna: `js/ident.js`. Pruebas automáticas: 7 suites + `test6` (41 controles de esta versión).

## Estructura

```
index.html        pantalla principal
css/app.css       estilos
js/core.js        datos, reglas y utilidades (importes en centavos, stock por movimientos)
js/ui.js          modales, avisos, impresión, QR
js/app.js         pantallas base y navegación
js/ext.js         caja, auditoría, fidelización, personal, semilla ampliada
js/m-*.js         módulos (caja, gestión, menú público, sistema)
css/mods.css      estilos de los módulos nuevos
css/theme.css     estética (tokens y ajustes visuales)
js/ident.js       legajo único, documento opcional, búsqueda de pacientes
js/m-hc.js        historia clínica pública y turnero
js/qrcode.js      generador de QR (qrcode-generator, MIT)
assets/           logo e íconos
```

Desarrollado por **VINCULAR BUSINESS** · WhatsApp (387) 4484132 · vincularbusiness@gmail.com

## Actualización (octubre 2026)
- Esta demo sigue siendo local (sin nube, con usuarios y datos de ejemplo) y sirve para mostrar el sistema a otras organizaciones. La versión con nube real (ingreso con Supabase, sincronización, roles en servidor) es la de Fundación Cannabismatica: https://raveholding.github.io/Cannabismatica/
- Corrección incorporada: identificadores (rubros, personal, cajas) sin choques entre equipos (`CM.idRand`, `CM.siguienteCaja`).
- Prompt maestro para ONG actualizado: `docs/SISTEMA_VB_ONGF.md` (asistente de voz, club, tarjetas, proveedores, caja, banner del desarrollador, legajo/biometría/Drive/Sheets/ciclos; sin mayorista ni multisucursal) y `docs/Sistema-VB-ONG.md` (v3.0). Esos módulos nuevos están especificados, todavía no implementados en esta demo.
