# Hoja de la toma V3 y vista previa de importación

La descarga comienza en la fila 1. Las columnas A–H son de consulta, en gris; I–Q son para llenar, en amarillo suave. Se mantiene una fila por bien e ID fijo. La hoja «Léeme» explica los colores y el conteo. EDIFICIO, PISO y UBICACIÓN son texto libre, sin listas desplegables: los nombres oficiales de los ambientes se asignan durante el inventario y luego se vinculan al plano en la importación. Solo OPERATIVIDAD y CONSERVACIÓN tienen listas, porque son valores fijos de la app; usan rangos con nombre en una hoja oculta.

La vista previa reconoce títulos en cualquier orden y fila, incluida ESTADO como alias de OPERATIVIDAD. La conservación registrada en las V3 anteriores se conserva cuando contiene Bueno, Regular, Malo o Por evaluar. La nueva descarga contiene una sola columna OPERATIVIDAD, separada de CONSERVACIÓN.

Las ubicaciones se agrupan en una tabla alineada. Coincidencias únicas por nombre o alias, edificio y piso se proponen como seguras; las coincidencias ambiguas requieren elección. Se ignoran tildes, mayúsculas, espacios entre nombre y número y variantes como «4º piso». Los números de ambiente se conservan: Aula 401 y Aula 402 son ambientes diferentes. El selector se puede buscar y se limita al mismo edificio y piso. Las asignaciones manuales o como texto prevalecen sobre nuevas sugerencias y se recuerdan en `config/ubicacionesV3`.

«Responsables de CR…», en el menú de usuario del administrador, permite guardar responsables en `config/responsablesCR`. El valor inicial de 20312 es Eduardo Barba; una configuración existente tiene prioridad. La importación usa el responsable como custodio por defecto, permite dejarlo vacío y conserva los valores que trae cada fila.

## Comprobaciones realizadas

Todas las escrituras de prueba se hicieron con datos de ejemplo en modo local o en un proyecto `demo-` del emulador oficial. El respaldo real se leyó solamente en una copia local, sin conexión a Firestore.

| Pantalla o formato | Qué se comprobó |
| --- | --- |
| Descargar V3 | Anual y puntual, por CR y todos los CR: 17 columnas desde fila 1; solo consulta en gris; bloque a llenar amarillo, incluido el encabezado; fechas, filtros, inmovilización, tres validaciones (operatividad, conservación y cantidad; edificio, piso y ubicación libres), rangos con nombre, hoja Léeme e IDs sin fórmulas. |
| V3 de la versión anterior | Se capturó una descarga con 151 bienes de ejemplo del código público de `main` `c6de2b8`: 18 columnas, encabezado en fila 14. El importador nuevo reconoce todos los bienes y mantiene las filas vacías pendientes. Se probó también una descarga anterior con conteos: conserva fecha, custodio, conservación, operatividad, observaciones y los tres resultados. |
| V3 original de 13 columnas | Se leyó `01-LISTA_ACTIVO_FIJO_082026-V3.xlsx`: 1305 bienes, sin desconocidos ni errores. Esta es una comprobación adicional; no sustituye al archivo `03-IMPORTACION…` solicitado. |
| Vista previa | 151 encontrados; botón con número de conteos; sin escribir IMPORTAR; columnas ignoradas bajo el resumen; ubicaciones pendientes primero y resueltas plegadas; búsqueda limitada por edificio y piso; sugerencias seguras y ambiguas; asignaciones, custodio, búsqueda y reemplazo conservados al cambiar otros campos. Anchuras 1366, 768 y 360 px, sin desbordamiento del diálogo; tabla con desplazamiento horizontal en móvil. |
| Guardar y volver a importar | 151 conteos de ejemplo guardados, resumen final y enlaces a fichas; ubicaciones recordadas; los conteos existentes se conservan sin reemplazo explícito; el custodio del archivo tiene prioridad y se permite custodio vacío. |
| Identificaciones y cantidades | CSV; columnas reordenadas y títulos movidos; ESTADO como operatividad; cantidad mayor a 1 solo se expande con elección explícita y conserva la ubicación en todos los IDs; cantidad 0 y No localizado; títulos repetidos e incompletos bloqueados; encabezados repetidos omitidos; ambiente eliminado exige revisar la asignación; fecha u observaciones solas no confirman un conteo. |
| Resultado final | Bienes guardados, omitidos y por revisar con enlaces; una fila pendiente aparece como omitida y revisable; un conteo simultáneo se conserva, no se cuenta como guardado y ofrece revisión del conflicto. |
| Responsables de CR | Eduardo Barba precargado para 20312; edición y guardado en configuración; otro CR sin responsable importa con custodio vacío. |
| Firestore oficial | SDK real contra emulador: 151 conteos anuales en dos lotes por CR, un conteo puntual, responsables y ubicaciones guardados con las reglas actuales. |
| V3 real de todos los CR (versión publicada) | Archivo del usuario `V3_Toma_INVENTARIO_ACTIVO_FIJO_-_ANO_2026_Todos_CR.xlsx`: 1307 bienes, 34 CR, cabecera en fila 14 y 18 columnas; 479 conteos de CR 20312, 828 pendientes, sin errores ni columnas ignoradas. Con planos aproximados, 12 de 14 ubicaciones se resuelven solas; quedan Comedor (Almacenes, piso 6) y Almacén - Piso 01 (Almacenes, piso 4). Con los 479 conteos ya registrados, el botón queda en «Importar 0 conteos» y ofrece reemplazo explícito. |
| Códigos contables en la toma | En la versión publicada, cada fila se comparaba con su propio bien: el archivo real mostraba 1305 avisos «ya existe en 1 bien de la base». Ahora solo se avisa si el código está en otro bien o se repite en el archivo: quedan los 2 casos reales (M-000954-D y M-000977-A). Prueba `tests/v3-codigos.cjs`. |
| LibreOffice | La plantilla nueva con los 798 bienes de CR 20312 se abrió y guardó en LibreOffice: conserva inmovilización, validaciones, rangos con nombre y hoja oculta; reimporta 479 conteos y 319 pendientes sin errores. No sustituye la prueba en Excel. |
| Regresión | Resumen y fichas con códigos compartidos; corrección contable con motivo e historial; etiqueta/ADM inmutables; marcar y desmarcar duplicados; alta Excel/CSV, Formato 7.1, toma anual y puntual, cierres, Hallazgos y actas congeladas. |

## Pendiente antes de integrar y publicar

- Importar el archivo exacto `03-IMPORTACION_ACTIVO_FIJO-CR_20312-082026-V1.xlsx`, si aún se usará. No está en Descargas, Documentos ni Drive. Se probó en su lugar la V3 real de todos los CR.
- Abrir una descarga nueva en **Microsoft Excel de escritorio**, comprobar que no solicita reparación, probar las listas, filtros, inmovilización y guardado; volver a importar esa copia guardada desde Excel. **Hecho el 10-nov por el usuario** con la versión anterior a quitar las listas de ubicación: el archivo guardado por Excel conserva tabla, filtro, inmovilización, validaciones, rangos y hoja oculta, y se reimporta sin errores. El entorno disponible es Linux y no hay una sesión de Excel conectada. Las verificaciones con openpyxl no sustituyen esta prueba.

No se modificó `firestore.rules` ni se publicaron reglas. No se modificaron datos reales. La integración en `main` y la publicación quedan pendientes de las dos comprobaciones anteriores. Verificar el SHA de `main` y la ejecución de Pages antes de comunicar que está publicado.

## Reproducir las pruebas sintéticas

Con Node.js y Python disponibles, desde la raíz del repositorio:

```sh
npm ci --prefix tests
npm exec --prefix tests -- playwright install chromium
python3 -m pip install openpyxl
python3 -m http.server 8781 --bind 127.0.0.1
```

En otra terminal, también desde la raíz:

```sh
V3_TEST_OUTPUT="$PWD/work/v3-resultados" npm test --prefix tests
python3 tests/v3-xlsx.py work/v3-resultados
```

`TEST_BASE_URL` permite elegir otra URL local. `BROWSER_BIN` permite usar un Chromium instalado. `V3_SCREENSHOTS=1` activa capturas de las pantallas. `V3_ACTUAL_FILE` permite aportar la descarga de la versión anterior para probarla; sin esa variable se construye un archivo de ejemplo con sus 18 columnas y encabezado en fila 14. Los archivos y capturas generados son sintéticos y se guardan en `work/` o en una carpeta temporal, nunca en la base real.
