# Cannabismatica I+D · Sistema ONG (demo v2)

Demo interactiva del sistema de gestión de la **Fundación Cannabismatica Investigación y Desarrollo** (ONG de cannabis medicinal, Salta · Ley N.º 27.350 · REPROCANN).
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
| **Aportes voluntarios y Factura C** | Registro de aportes y **Factura C simulada** (más nota de crédito C). Marcada como *documento de demostración sin validez fiscal*. |
| **Seguimiento médico** | Formulario mensual con las mismas opciones del formulario de Google. |

### Módulos de gestión (Sistema VB adaptado a la ONG)

| Módulo | Qué hace |
|---|---|
| **Dashboard** | Aportes, dispensaciones, egresos y resultado de caja estimado; filtros por período, medio y Factura C; tabla equivalente y CSV. |
| **Caja · Arqueo y cierre · Cajas cerradas** | Apertura, ingresos/egresos con **rubro financiero obligatorio**, arqueo por denominaciones, cierre con foto inmutable y sello SHA-256, historial en lista y calendario, alerta de días sin cierre, ficha A4 y verificación de integridad. |
| **Inventario** | Insumos y movimientos de stock, stock mínimo, rubros de inventario, historial y CSV. |
| **Fidelización** | Tarjeta de sellos con QR firmado (1 por día), cupones con límites, membresías con consentimiento versionado y aporte asociado. |
| **Personal y fichaje** | Empleados, tarjeta/QR firmado, fichaje (rechaza firmas falsas y repetidos en 60 s), planilla de horas. |
| **Tareas y organigrama** | Tablero Kanban y organigrama editable. |
| **Menú público** | «Quiero mi REPROCANN, talleres, cursos y servicios», ES/EN, frases y leyendas, Club (con consentimientos, control de menores), Wi-Fi, redes, acceso oculto (`#/acceso`), borrador → publicación con versiones y reversión. |
| **Nube · Periféricos y ticket · Integraciones** | Estados honestos: *Pendiente de configuración* / *pendiente de prueba física*. Respaldo local real. Ticket 58/80 mm de ejemplo. |
| **Importar / Exportar** | CSV en 3 pasos con errores por fila, modo prueba, duplicados, deshacer lote; exportaciones con neutralización de fórmulas. |
| **Usuarios y permisos · Auditoría · Configuración** | 4 roles × módulos (simulado en el navegador), auditoría con cadena de hashes verificable, módulos activables y rubros financieros. |

Terminología de ONG en toda la interfaz: paciente/socio, dispensación, aporte voluntario, Factura C ante ARCA.

## Cómo probarla

- Entrá a la URL de GitHub Pages del repositorio (o abrí `index.html` desde un servidor local: `python3 -m http.server`).
- Pacientes de ejemplo: **99000001** (válido), **99000002** (vence en 25 días), **99000003** (en trámite), **99000004** (vencido: la dispensación se bloquea), **99000005**, **99000006** (historia pendiente).
- *Ajustes → Restablecer datos de ejemplo* vuelve todo al inicio.
- Parámetro opcional `?hoy=AAAA-MM-DD` para simular otra fecha (vigencias).

## Límites de la demo (a validar antes del sistema real)

- Los datos **no** viajan a ningún servidor. La versión real usaría una base con aislamiento por organización y cifrado.
- **Factura C**: simulada. El CAE real requiere certificado digital de la ONG y conexión con los servicios de ARCA **[VERIFICAR con el contador y en arca.gob.ar]**.
- **Drive**: en la demo los enlaces apuntan a Google Drive en general; la creación automática de carpetas por DNI queda para la etapa real.
- Normativa (vigencias REPROCANN, exención de la ONG, texto de consentimiento) **[VERIFICAR con asesor legal y fuentes oficiales]**.
- Las reglas de bloqueo y el tope mensual de flores son configurables y no representan una regla legal.

- Nube (Supabase), pagos (Mercado Pago), Google, correo/WhatsApp, lector biométrico, impresoras y balanzas **no están conectados**: la demo lo dice en pantalla. Importar .xlsx, fotos con zoom, mapa embebido y reseñas de Google no están en esta demo.
- Los roles y permisos se simulan en el navegador; en el sistema real se validan en el servidor.

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
js/qrcode.js      generador de QR (qrcode-generator, MIT)
assets/           logo e íconos
```

Desarrollado por **Rave Holding** · WhatsApp +54 9 387 514-3900 · raveholding@gmail.com
