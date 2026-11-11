# Modelo de datos operativo (tipo OpenMAINT) — aprobado 10-nov-2026

Fase 0.3 del «Plan integral v2 – Gestión operativa de AF/BM». Documento de diseño con el usuario: https://claude.ai/artifact/QVny6kjx3D1wvQasxaUr7H

## Principio

El centro es el **bien físico**: está en un **espacio**, es de un **tipo**, pertenece a un **área** y tiene una **persona** a cargo (custodio). Movimientos, órdenes de trabajo, tomas y contratos registran lo que le pasa. El **registro contable** es solo referencia y se usa para conciliar en la toma.

## Reglas de compatibilidad

- No se borra ni se renombra ningún campo ni colección existente (`bienes`, `tomas`, `tomas/{id}/conteos`, `planos`, `sistemas`, `equipos`, `mantenimientos`, `usuarios`, `config`, `actasCR`).
- Lo nuevo se agrega al lado. Las reglas de Firestore solo se amplían.
- La V3 sigue el contrato `docs/contrato-v3.md` hasta el cierre de la toma 2026.
- Ninguna ficha se migra durante la toma; la migración (F1.5) usa los resultados de la toma, con respaldo, vista previa y confirmación del usuario.

## Colecciones nuevas

| Colección | Campos principales | Etapa |
|---|---|---|
| `espacios/{id}` | `nivel` (sede, edificio, piso, ambiente), `padre`, `codigo`, `nombre`, `tipoAmbiente`, `areaId`, `plano` + `ambId` (enlace al ambiente del plano), `alias` (nombres vistos en campo), `activo` | F1.1 |
| `areas/{id}` | `nombre`, `sigla`, `jefeId`, `crs` (CR contables equivalentes, referencia), `activa` | F1.2 |
| `personas/{id}` | `nombre` (nombres completos), `cargo`, `areas` (lista: una persona puede estar en varias), `correo` (opcional), `usuarioId` (opcional), `activa`. Sin DNI ni datos sensibles | F1.2 |
| `tiposBien/{id}` | `familia`, `nombre`, `clase` (AF/BM por defecto), `atributos` [{k, l, t, opts, req}], `vidaUtil`, `planId` | F1.3 |
| `movimientos/{id}` | `tipo` (traslado, reasignación, préstamo, devolución, ingreso/salida de almacén, alta, baja), `bienes`, `origen` {espacioId, custodioId}, `destino` {…}, `motivo`, `acta`, `estado`, `u`, `t` | E2 |
| `solicitudes/{id}` | bien o espacio, quién reporta, descripción, prioridad, estado | E3 |
| `ordenes/{id}` | `tipo` (correctiva/preventiva), bien o espacio, responsable (persona o proveedor), `estado`, trabajo, costo, checklist | E3 |
| `planesPreventivos/{id}` | `tipoBienId`, tareas, frecuencia, checklist | E3 |
| `proveedores/{id}` | razón social, contacto, rubro | E5 |
| `contratos/{id}` | proveedor, bienes cubiertos, vigencia, monto, aviso | E5 |

### Espacios: sedes aprobadas

| Sede | Edificios | Planos |
|---|---|---|
| Sede Lima principal (`LIM`) | Almacenes, CCB | 9 planos (S2, S1, SM, P1–P5, AZ) |
| Sucursal Piura | Edificio principal | No; ambientes se crean al registrar |
| Sucursal Trujillo | Edificio principal | No |
| Sucursal Huancayo | Edificio principal | No |
| Sucursal Arequipa | Edificio principal | No |
| Sucursal Juliaca | Edificio principal | No |
| Sucursal Cusco | Edificio principal | No |

Códigos de espacio jerárquicos, por ejemplo `LIM-CCB-P4-401`.

## Ficha del bien: clasificación de campos

| Sección | Campos actuales (sin cambios) | Campos nuevos | Naturaleza |
|---|---|---|---|
| Identificación | `codigo` (ADM, inmutable), `idEtq` (inmutable), `nombre`, `marca`, `modelo`, `serie`, `tipo` (AF/BM), `categoria`, `seccion` | `tipoBienId`, `atributos`, `documentos` | Operativa |
| Ubicación | `sede`, `piso`, `ambiente`, `amb`, `cuad`, `pt`, `ubicacion` | `espacioId` (manda) | Operativa |
| Responsables | `area` (texto), `responsable` (texto) | `areaId`, `custodioId` | Operativa |
| Estado y ciclo | `etapa`, `condicion`, `oper`, `fechaAlta`, `motivoBaja` | — | Operativa |
| Económico | — | `proveedorId`, `garantiaHasta`, `contratoId` | Operativa (E5) |
| Contable (referencia) | `codCont`, `cuenta`, `valorHist`, `valorNeto`, `fechaAdq`, `refDoc`, `crs`, `crToma`, `crOriginal`, `prioridadCR` | — | Contable |
| Inventario | `inv`, `registroDuplicado` | — | Inventario |
| Sistema | `hist`, `creado`, `act`, `imp`, `origenDatos`, `dataset` | — | Sistema |

- Bienes sin registro contable (BM, sobrantes dados de alta) son fichas completas con `codCont` y valores vacíos.
- El área del bien se registra en el bien (`areaId`); no se deduce del custodio, porque una persona puede estar en varias áreas.
- Cada bien tiene una persona a cargo (`custodioId`).
- Los textos actuales (`area`, `responsable`, `ambiente`) se conservan como valor anterior hasta vincularlos.
- Movimientos y órdenes van en sus propias colecciones para no crecer la ficha hacia el límite de 1 MB.

## Carga inicial de catálogos (revisada por el usuario)

1. Espacios: desde los 9 planos de Lima (Almacenes / CCB) y los alias que la importación V3 ya recuerda (`config/ubicacionesV3`). Sucursales con su edificio principal.
2. Áreas: una por CR (nombre del CR), con su CR en `crs`.
3. Personas: responsables de CR (`config/responsablesCR`) y custodios escritos en la V3, sin repetidos.
4. Tipos de bien: los 34 agrupadores, dentro de las familias actuales (muebles, equipos, enseres, muebles de casa, vehículos).

## Seguridad y capacidad

- Catálogos: lectura para usuarios activos, escritura solo administrador. Roles finos en E6.
- Plan Spark: 1 307 bienes y algunos cientos de espacios y personas caben; movimientos y órdenes se leen por páginas.
