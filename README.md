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

## Estructura

```
index.html        pantalla principal
css/app.css       estilos
js/core.js        datos, reglas y utilidades (importes en centavos, stock por movimientos)
js/ui.js          modales, avisos, impresión, QR
js/app.js         pantallas y formularios
js/qrcode.js      generador de QR (qrcode-generator, MIT)
assets/           logo e íconos
```

Desarrollado por **Rave Holding** · WhatsApp +54 9 387 514-3900 · raveholding@gmail.com
