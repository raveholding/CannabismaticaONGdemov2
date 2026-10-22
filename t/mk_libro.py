"""Genera un libro .xlsx SINTÉTICO con la misma estructura que la planilla «CANNABISMATICA» del sistema anterior
(13 pestañas, mismos encabezados) y con cada tipo de anomalía encontrada en los datos reales.
TODOS los datos son ficticios (documentos 991xxxxx, correos example.org). No contiene datos de ninguna persona real.
Uso: python3 t/mk_libro.py <salida.xlsx> [<salida.json>] [--variante dup]"""
import json, sys, zipfile
from datetime import datetime
from xml.sax.saxutils import escape

def serial(dt):  # fecha → número de serie de Excel (como exporta Google Sheets)
    return (dt - datetime(1899, 12, 30)).total_seconds() / 86400

H = {}
H['Respuestas de formulario 2'] = [["Marca temporal","Nombre Completo\n(como figura en el DNI)","DNI\n(sin espacios ni puntos)","Sintoma o Patología a mejorar\nObjetivo Terapeutico:","Vias de Admninistración","Productos Indicados","Sabe que Quimiotipo esta consumiendo? (Q)","Siente alguna de las siguientes mejoras?","Siente alguno de estos efectos NO deseados?","Dejo de realizar alguna actividad desde el consumo del cannabis?","Mejoro o comenzó con alguna actividad nueva desde el consumo de cannabis?","Que tipo de actividad comenzo o mejoro?","Reconoce o tiene la necesidad de mejorar habitos y estilos de vida saludables? ","Algun comentario que nos quieras compartir :)","Dirección de correo electrónico","Inflorescencias o Flores Secas Terapéuticas\nSeleccione la genética"],
  ["24/03/2026 2:15:10","Ana Prueba (ficticia)","99100001","Insomnio","Inhalatoria Combustion","Flores Secas","Quimitipo 1 (THC)","Mejora del Sueño","No siento efectos adversos","No","Si","Caminatas","Si, Actividad Fisica","","ana@example.org","Petroleum ejemplo"],
  ["9/05/2026 20:36:22","Ana Prueba (ficticia)","99100001","Insomnio, Ansiedad","Sublingual","Aceite Sublingual","Quimitipo 3 (CBD)","Disminución de Ansiedad","Sequedad Bucal","No","No","","","Comentario <b>con</b> etiqueta","",""],
  ["10/05/2026 10:00:00","Desconocido (ficticio)","99199999","Dolor","","","","","","","","","","","",""]]
H['Respuestas de formulario 1'] = [["Marca temporal","Motivo de Consulta / Porque motivo utiliza cannabis","Nombre y Apellido","Fecha de Nacimiento\n","DNI\n(Sin espacios ni puntos)","Dirección \n(Provincia, Localidad, Barrio, Calle, N°)","Código Postal","Teléfono \n(sin espacios)","Email ","Obra Social / N°","Cod. de Seguimiento - \nPaciente REPROCANN","Labor - Ocupación -Trabajo","DUDAS - CONSULTAS - COMENTARIOS","Deseas inscribirte en el programa?"],
  ["18/03/2026","insomnio","Ana Prueba (ficticia)","11/05/1997","99100001","Calle Ejemplo 1","4400","3875550001","ana@example.org","no","DEMO-A1","docente","","Si"],
  [],
  ["30/03/2026 21:27:44","Dolor","Persona solo formulario (ficticia)","17/06/1993","99100050","Calle Ejemplo 50","4400","5493875550050","solo.form@example.org","OS demo","","","=HYPERLINK(\"http://x\")","Si"],
  ["31/03/2026 10:00:00","Dolor","Sin documento (ficticio)","01/01/1990","","","","","","","","","",""]]
H['Usuarios_Roles'] = [["Email","Nombre_Completo","Rol"],["admin.migrado@example.org","Admin migrado (ficticio)","Administrador"],["operadora.migrada@example.org","Operadora migrada (ficticia)","Administrador"]]
H['Recursos_Utiles'] = [["ID_Recurso","NombreRecurso","EnlaceRecurso"],["r0000001","Formulario de Seguimiento (ejemplo)","https://docs.google.com/forms/d/e/EJEMPLO/viewform"]]
H['Documentación_Institucional'] = [["Documento_ID","Nombre_Documento","Link_Drive","Categoria"],["d0000001","Estatuto (ejemplo)","https://docs.google.com/document/d/EJEMPLO/edit","Administrativo"]]
H['Legajo'] = [["ID_Legajo","Nombre","DNI","Fecha_Ingreso","Estado","Diagnostico","ArchivosPDF"],[],
  ["99100001","Ana Prueba (ficticia)","99100001","30/03/2026","Activo","Insomnio"],
  ["99100002","Beto Ejemplo (ficticio)","99100002","18/03/2026","Activo","Dolor crónico"],
  ["99100003","Caro Muestra (ficticia)","99100003","02/04/2026","","Ansiedad"],
  ["NaN","persona sin dni (ficticia)","NaN","25/08/2026","Activo","no puede dormir"],
  ["-9910009","Dani Negativo (ficticio)","-9910009","24/09/2026","Activo","Dolor lumbar"],
  ["99100010","correo.como.nombre@example.org","99100010","31/08/2026","Activo","Insomnio"]]
H['Documentos'] = [["ID_Documento","Fecha","ID_Legajo","NombreDocumento","TipoDocumento","Archivo_PDF"],
  ["dc000001","23/03/2026 15:24:10","99100001","Consentimiento (ejemplo)","","Documentos_Files_/dc000001.Archivo_PDF.182431.pdf"],
  ["dc000002","30/03/2026 21:48:13","","","","Documentos_Files_/dc000002.Archivo_PDF.004822.docx"],
  ["dc000003","25/08/2026 21:01:39","NaN","hc","","Documentos_Files_/dc000003.Archivo_PDF.000146.docx"],
  ["dc000004","11/09/2026 13:38:42","99100002"]]
H['Seguimientos'] = [["ID_Seguimiento","ID_Legajo_REF","Fecha","Responsable","Producto_Asignado","Observaciones"]]
H['Geneticas'] = [["ID_Genetica","Nombre_Variedad","Tipo","THC_pct","CBD_pct","Indicaciones","Stock","Entradas","Salidas"],
  ["g0000001","Aromito ejemplo","CBD","0,3","17","Ansiolítico","1","105","104"],
  ["g0000002","Tropicana ejemplo","Hibrido","20","","Bienestar","70","100","30"],
  ["g0000003","Petroleum ejemplo","Sativa","20","","Estimulante","-5","10","15"],
  ["g0000004","ACEITE Q3 ejemplo","CBD","","30","Ansiedad","3","5","2"],
  ["g0000005","Crema Ungüento 50cc ejemplo","Hibrido","10","10","Dolor","2","3","1"],
  ["g0000006","consulta medica 1/4 ejemplo","Hibrido","","","(4 aportes)","-2","0","2"],
  ["g0000007","Hrs Extras ejemplo","","","","Hrs","1,5","4,5","3"]]
H['Movimientos'] = [["ID_Movimiento","Tipo_Movimiento","ID_Genetica_REF","ID_Legajo_REF","Cantidad_gr","Fecha"],
  ["mv000001","Entrada a stock","g0000001","","105","03/04/2026 19:27:04"],
  ["mv000002","Entrada a stock","g0000002","99100002","100","03/04/2026 19:27:28"],
  [],
  ["mv000003","Ajustes de stock","g0000002","99100002","-0,5","07/04/2026 18:43:44"],
  ["mv000004","Entrada a stock","g0000003","","10","07/05/2026 20:51:24"],
  ["mv000005","Entrada a stock","g0000004","","5","07/05/2026 20:51:24"],
  ["mv000006","Entrada a stock","g0000005","","3","07/05/2026 20:51:24"],
  ["mv000007","Entrada a stock","g0000007","99100001","2,5","22/07/2026 21:46:51"]]
# Entregas: fechas mezcladas (texto y número de serie, como exporta Google)
H['Entregas'] = [["EntregaID","Fecha","ID_Legajo","Tipo","FormaPago","Usuario","Turno","Efectivo","Transferencia"],
  ["en000001", serial(datetime(2026,4,2,10,12,26)), "99100001","","EFECTIVO","operador@example.org","MAÑANA","37000"],
  ["en000002","15/04/2026 12:04:05","99100002","","TRANSFERENCIA","operador@example.org","MAÑANA"],
  ["en000003","17/07/2026 18:28:22","99100001","","MIXTO","operador@example.org","TARDE","30000","24000"],
  ["en000004","27/07/2026 21:20:16","99100003","","MIXTO","operador@example.org","TARDE"],
  ["en000005","30/05/2026 16:02:47","99100002","","","operador@example.org","TARDE"],
  ["en000006","30/03/2026 22:53:32","","","TRANSFERENCIA","operador@example.org","TARDE","","35000"],
  ["en000007","16/07/2026 20:57:29","99109999","","TRANSFERENCIA","operador@example.org","TARDE"],
  [],
  ["en000008","07/07/2026 19:24:19","99100001","","TRANSFERENCIA","operador@example.org","TARDE"],
  ["en000009","18/05/2026 18:16:18","99100002","","EFECTIVO","operador@example.org","TARDE","10000"],
  ["en000010","10/10/2026 20:50:28","99100001","","TRANSFERENCIA","operador@example.org"],
  ["en000011","18/09/2026 17:16:12","-9910009","","TRANSFERENCIA","operador@example.org"],
  ["en000012","14/09/2026 11:29:04","99100003","","TRANSFERENCIA","operador@example.org","MAÑANA"]]
H['EntregasDetalle'] = [["EntregaDetalleID","EntregaID","ID_Genetica","Cantidad","Precio","SubTotal","Descuento","Total"],
  ["de000001","en000001","g0000001","10","4000","40000","3000","37000"],
  ["de000002","en000002","g0000002","15","7000","105000","","105000"],
  ["de000003","en000003","g0000002","5","9000","45000","","45000"],
  ["de000004","en000003","g0000001","1","9000","9000","","9000"],
  ["de000005","en000004","g0000003","1","11000","11000","","11000"],
  ["de000006","en000005","g0000002","2","","0","","0"],
  ["de000007","en000006","g0000003","5","7000","35000","","35000"],
  ["de000008","en000007","g0000003","2","8000","16000","","16000"],
  ["de000009","en000008","g0000002","2","8000","16000","","16000"],
  ["de000010","en000008","","","","0","","0"],
  ["de000011","en000009","g0000004","","30000","0","20000","-20000"],
  ["de000012","en000009","g0000004","1","30000","30000","","30000"],
  ["de000013","en000010","g0000006","1","60000","60000","","60000"],
  ["de000014","en000011","g0000002","6","8333,33","49999,98","","49999,98"],
  ["de000015","en000012","","2","10000","20000","","20000"],
  ["de000016","en000012","g0000003","1","8000","8000","","8000"],
  ["de000017","en999999","g0000002","1","1000","1000","","1000"],
  ["de000018","en000004","g0000005","1","5000","5000","","5000"],
  ["de000019","en000002","g0000004","0","0","0","","0"]]
H['Arqueo'] = [["ArqueoID","Fecha","TotalEfectivo","TotalBanco","RecuentoEfectivo","RecuentoBanco","DiferenciaEfectivo","DiferenciaBanco","Observaciones","Turno","Usuario"]]

ORDEN = ['Respuestas de formulario 2','Respuestas de formulario 1','Usuarios_Roles','Recursos_Utiles','Documentación_Institucional','Legajo','Documentos','Seguimientos','Geneticas','Movimientos','Entregas','EntregasDetalle','Arqueo']

if '--variante' in sys.argv and sys.argv[sys.argv.index('--variante')+1] == 'limpio':
    # versión que debe pasar en modo estricto salvo por los ciclos: sólo filas sanas
    pass

def col(i):
    s = ''
    i += 1
    while i: i, r = divmod(i - 1, 26); s = chr(65 + r) + s
    return s

def escribir(path):
    ss, idx = [], {}
    def si(v):
        if v not in idx: idx[v] = len(ss); ss.append(v)
        return idx[v]
    sheets = []
    for name in ORDEN:
        rows = H[name]; out = []
        for r, row in enumerate(rows):
            cells = []
            for c, v in enumerate(row):
                ref = col(c) + str(r + 1)
                if isinstance(v, (int, float)): cells.append('<c r="%s"><v>%r</v></c>' % (ref, v))
                elif v == '': continue
                else: cells.append('<c r="%s" t="s"><v>%d</v></c>' % (ref, si(v)))
            out.append('<row r="%d">%s</row>' % (r + 1, ''.join(cells)))
        sheets.append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>%s</sheetData></worksheet>' % ''.join(out))
    z = zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED)
    z.writestr('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' + ''.join('<Override PartName="/xl/worksheets/sheet%d.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' % (i+1) for i in range(len(ORDEN))) + '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>')
    z.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    z.writestr('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + ''.join('<sheet name="%s" sheetId="%d" r:id="rId%d"/>' % (escape(n, {'"': '&quot;'}), i+1, i+1) for i, n in enumerate(ORDEN)) + '</sheets></workbook>')
    z.writestr('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + ''.join('<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/>' % (i+1, i+1) for i in range(len(ORDEN))) + '<Relationship Id="rId99" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>')
    for i, s in enumerate(sheets): z.writestr('xl/worksheets/sheet%d.xml' % (i+1), s)
    z.writestr('xl/sharedStrings.xml', '<?xml version="1.0" encoding="UTF-8"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="%d" uniqueCount="%d">%s</sst>' % (len(ss), len(ss), ''.join('<si><t xml:space="preserve">%s</t></si>' % escape(v) for v in ss)))
    z.close()

escribir(sys.argv[1])
if len(sys.argv) > 2 and sys.argv[2].endswith('.json'):
    def js(v):
        if isinstance(v, float): return ('%r' % round(v, 6)).replace('.', ',')
        return v
    json.dump({n: [[js(c) for c in row] for row in H[n]] for n in ORDEN}, open(sys.argv[2], 'w'), ensure_ascii=False)
