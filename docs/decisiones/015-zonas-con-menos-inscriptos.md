# 015 — Cuántas zonas se arman si no se llena el cupo

**Estado:** aceptada — 13 de octubre de 2026

## Contexto

El formato del torneo fija la cantidad de zonas (`cantidadGrupos`), y las zonas son de 4 ([02-dominio.md](../02-dominio.md) §3.1). Pero el cupo no siempre se llena: con 26 inscriptos y 8 zonas, no alcanza para que todas tengan 4. El reglamento no dice qué hacer.

Además, cuando se cierra la inscripción el formato ya no se puede editar ([03-flujo-organizacion.md](../03-flujo-organizacion.md) §6): el sorteo trabaja con lo que se publicó.

## Opciones consideradas

1. **Se respeta `cantidadGrupos`, con zonas de al menos 3.** Algunas zonas quedan con uno menos. Si alguna quedara con menos de 3, el sorteo se rechaza.
   - En contra: con muchas bajas no hay sorteo posible, y el formato ya no se puede corregir.
2. **Se recalcula la cantidad de zonas:** `ceil(inscriptos / 4)`.
   - En contra: cambia el formato que se publicó y, con él, el tamaño de los cuadros (F08), que dependen de `cantidadGrupos`.
3. **Se respeta `cantidadGrupos`, sin mínimo.**
   - En contra: pueden quedar zonas de 1 o 2 jugadores, donde la zona no define nada.

## Decisión

Opción 1. `alcanzanParaLasZonas(inscriptos, cantidadGrupos)` en `apps/api/src/modules/competencia/sorteo.ts` exige `inscriptos ≥ cantidadGrupos × 3`. Si no alcanza, la API responde `INSCRIPTOS_INSUFICIENTES`. La serpentina ya reparte así: la última vuelta incompleta deja con uno menos a las zonas que le tocan al final.

## Por qué

- **El formato publicado no cambia.** Los cuadros, el cronograma y la cantidad de clasificados quedan como se anunciaron.
- **Una zona de 3 sigue definiendo algo:** con los 2 clasificados de POLENTA, uno de los tres va al cuadro consuelo.
- **Es el caso habitual de un cupo casi lleno**, y no hace falta código aparte: la distribución ya lo resuelve.

## Qué se resigna

- **En una zona de 3, cada jugador juega 2 partidos de zona, no 3.** El reglamento de POLENTA promete un mínimo de 3 de zona y 1 de eliminatoria; con el cupo incompleto, quienes caen en una zona de 3 juegan uno menos.
- **Si `clasificanPorGrupo` es 3, una zona de 3 clasifica entera.** El formato lo permite, pero no es el caso de POLENTA.
- **Con muchas bajas no hay sorteo** y no hay forma de achicar el formato desde la web. Si pasa en la práctica, la salida es permitir editar `cantidadGrupos` con la inscripción cerrada y antes del sorteo.
