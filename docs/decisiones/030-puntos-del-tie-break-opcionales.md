# 030 — Los puntos del tie-break son opcionales

**Estado:** aceptada — 16 de octubre de 2026

## Contexto

`SetPartido` tiene `tieBreakA` y `tieBreakB`, que pueden quedar vacíos. Para los desempates un 7-6 cuenta como un game más, sea cual sea el tie-break ([02-dominio.md](../02-dominio.md) §5): los puntos no cambian ninguna tabla. Al cargar un resultado (F06) hay que decidir si se piden.

El tie-break de POLENTA es a 7 sin diferencia: en 6-6 se juega un punto más, así que termina 7-6 como máximo. No hay un parámetro para el tie-break con diferencia de 2 (8-6, 10-8), que usan otros circuitos.

## Opciones consideradas

1. **Opcionales:** si vienen se validan; si no, alcanza con el 7-6.
   - En contra: algunos marcadores quedan sin el detalle ("7-6" en lugar de "7-6 (4)").
2. **Obligatorios en todo 7-6.**
   - En contra: obliga a conseguir un dato que no cambia ninguna tabla y que en los mensajes del grupo muchas veces no viene, lo que también afecta a F19. Un circuito con tie-break con diferencia de 2 no podría cargar su resultado.
3. **No se piden ni se guardan.**
   - En contra: se pierde un dato que el jugador sí mira, y quedan columnas sin uso.

## Decisión

Opción 1. En `resultadoDelTorneoSchema()`, en `packages/shared/src/schemas/resultado.ts`:

- Si vienen los puntos, tienen que venir los dos, en un set que terminó 7-6, y ganados por quien ganó el set.
- Se validan con la regla de 02-dominio §5: de 7-0 a 7-6, con `puntosTieBreak` del torneo.
- El super tie-break no tiene este problema: sus puntos son su resultado y siempre se cargan.

## Por qué

- **No se pide lo que no se usa:** la carga es más rápida y no queda trabada por un dato que nadie anotó.
- **El circuito con tie-break con diferencia de 2 igual puede cargar su resultado**, sin los puntos, mientras no haya un parámetro para su regla.

## Qué se resigna

- **El detalle del tie-break no siempre va a estar** en la ficha del jugador ni en el head-to-head.
- **Un tie-break 8-6 no se puede guardar.** Si un circuito lo pide, hace falta un parámetro del torneo para la diferencia de 2.
