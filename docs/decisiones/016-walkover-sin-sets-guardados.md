# 016 — El W.O. no guarda sets: el 6-0 6-0 se arma al calcular

**Estado:** aceptada — 13 de octubre de 2026

## Contexto

El W.O. se computa como 6-0 6-0 a favor del rival ([02-dominio.md](../02-dominio.md) §8.5), y ese marcador entra en los desempates por sets y games de la tabla de la zona (F07). El partido ya tiene `estado = WALKOVER` y `ganadorId`. Falta definir si además se guardan dos `SetPartido` de 6-0, o si el 6-0 6-0 se arma cuando se calcula la tabla.

## Opciones consideradas

1. **Guardar los sets 6-0 6-0.** La carga del W.O. (F06) escribe dos sets como si se hubieran jugado.
   - En contra: un W.O. queda igual que un 6-0 6-0 jugado salvo por el `estado`. El head-to-head (F18) y la ficha del jugador (F17) tendrían que filtrarlo para no mostrar un partido que no existió.
2. **No guardar sets: se arman al calcular**, a partir de `estado` y `ganadorId`.
   - En contra: los lugares que cuentan sets y games tienen que acordarse de hacerlo.

## Decisión

Opción 2. Un partido `WALKOVER` no tiene `SetPartido`. `estadisticasDeZona()` en `apps/api/src/modules/competencia/clasificacion.ts` le arma el 6-0 6-0 al ganador y, si por error hubiera sets guardados, los ignora.

## Por qué

- **La base no dice que se jugó algo que no se jugó.** El marcador del W.O. es una regla de cómputo del reglamento, no un resultado.
- **No hay datos duplicados:** el estado y el ganador ya alcanzan, y no pueden contradecirse con unos sets.
- **Hay un solo lugar que cuenta sets y games para los desempates**, así que olvidarse del W.O. no es un riesgo real.

## Qué se resigna

- **Una consulta directa a `sets_partido` no ve los W.O.** Si una estadística futura suma games con SQL, tiene que contemplar el estado del partido.
- **Si otro circuito computara el W.O. distinto** (por ejemplo, 6-0 6-0 6-0 a cinco sets), hay que cambiar esta función. Hoy no es un parámetro del torneo ([07-configurabilidad.md](../07-configurabilidad.md) §2.2).
