# Contrato de la hoja V3 (congelado)

**Vigente desde:** 10-nov-2026 · **Hasta:** el cierre de la toma «Inventario Activo Fijo - Año 2026».
**Prueba que lo protege:** `web-tests/v3-contrato.cjs` (incluida en `npm test`).

La V3 es el Excel que se descarga de la app, se llena en campo y se vuelve a subir. Mientras dure la toma 2026, nada de este documento puede cambiar. Si una mejora necesita tocarlo, primero se consulta con el usuario, luego se actualizan este documento y la prueba, y recién al final el código.

## 1. Archivo descargado

| Elemento | Valor fijo |
|---|---|
| Hojas | `ETIQUETA` (la que se llena), `Léeme`, `Listas` (oculta) |
| Títulos | Fila 1; la fila 1 queda fija al desplazarse |
| Una fila | Un bien (una etiqueta) |
| Columnas A–M (gris, consulta) | Se llenan desde el sistema; si se editan, el importador las ignora |
| Columnas N–V (amarillo, campo) | Las llena el inventariador |

### Columnas, en este orden

| Col. | Título | Tipo | Notas |
|---|---|---|---|
| A | ID | consulta | Número de etiqueta |
| B | CÓDIGO CONTABLE | consulta | Referencia contable; se resaltan los repetidos |
| C | AGRUPADOR | consulta | Familia del bien (sillas, mesas…) |
| D | ACTIVO | consulta | Descripción original del registro |
| E | MARCA | consulta | |
| F | MODELO | consulta | |
| G | SERIE / PLACA | consulta | |
| H | FECHA DE ADQUISICIÓN | consulta | |
| I | CÓDIGO ADMINISTRACIÓN | consulta | Código ADM (identifica la ficha) |
| J | CÓDIGO CR | consulta | |
| K | CR | consulta | |
| L | Prioridad CR | consulta | |
| M | RESULTADO | consulta | Resultado actual en la toma |
| N | FECHA DE INVENTARIO | campo | Fecha |
| O | EDIFICIO | campo | Texto libre |
| P | PISO | campo | Texto libre |
| Q | UBICACIÓN | campo | Texto libre (el nombre oficial del ambiente se asigna al importar) |
| R | CANTIDAD | campo | Entero 0 o 1 (validado en Excel) |
| S | OPERATIVIDAD | campo | Lista: Operativo, Inoperativo, No probado, No aplica |
| T | CONSERVACIÓN | campo | Lista: Bueno, Regular, Malo, Por evaluar |
| U | CUSTODIO | campo | Texto libre; si queda vacío se usa el responsable del CR |
| V | OBSERVACIONES | campo | Diferencias de marca, modelo o serie van aquí |

## 2. Cómo se interpreta cada fila al importar

| La fila tiene… | Resultado |
|---|---|
| Algún dato en EDIFICIO, PISO, UBICACIÓN, OPERATIVIDAD, CONSERVACIÓN o CUSTODIO, o CANTIDAD = 1 | **Encontrado** |
| CANTIDAD = 0, o «No localizado» escrito en CONSERVACIÓN, o RESULTADO = No localizado | **No localizado** |
| RESULTADO = Por conciliar, con datos de campo | **Por conciliar** |
| CANTIDAD mayor que 1 | Se ofrece repartir la cantidad entre los IDs siguientes del mismo grupo de bienes iguales (con elección del usuario) |
| Solo FECHA DE INVENTARIO y/u OBSERVACIONES | **Sigue pendiente** (no confirma el conteo) |
| Solo cambios en columnas grises | **Sigue pendiente** |
| Fila vacía | **Sigue pendiente** |

Nota: que una fila con solo ubicación u operatividad cuente como Encontrado es el diseño actual; el usuario aún no lo ha confirmado expresamente.

## 3. Compatibilidad

- El importador **lee por títulos**, no por posición: acepta columnas en otro orden y columnas propias del usuario (las ignora y avisa).
- Debe estar presente la cabecera base de la V3 original (13 títulos o sus equivalentes nuevos). Si falta alguno, la hoja se rechaza con mensaje.
- Siguen entrando las V3 anteriores: 13 columnas (ESTADO se lee como operatividad/conservación), 17 y 18 columnas (cabecera en fila 14) y CSV.
- Un título repetido en la cabecera bloquea la importación.
- Si otra persona guardó el mismo bien mientras se revisaba la vista previa, ese conteo no se reemplaza y se ofrece revisarlo.

## 4. Qué sí se puede cambiar sin romper el contrato

- Textos de la hoja `Léeme`, anchos de columna, colores exactos (manteniendo gris ≠ amarillo).
- Mensajes y diseño de la vista previa de importación.
- Funciones nuevas que no alteren columnas, títulos, listas ni las reglas de la sección 2.
