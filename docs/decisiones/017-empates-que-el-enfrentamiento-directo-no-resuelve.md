# 017 — Empates que el enfrentamiento directo no resuelve

**Estado:** aceptada — 13 de octubre de 2026

## Contexto

La cascada de desempates de la zona termina, dentro del grupo, en el criterio 6: el ganador del partido entre ambos ([02-dominio.md](../02-dominio.md) §6). El reglamento de POLENTA lo escribe para dos jugadores y no dice qué pasa en dos casos:

- **Tres o más jugadores llegan empatados al criterio 6.** Pasa, por ejemplo, en un empate circular (A le gana a B, B a C y C a A) con los mismos marcadores. "El partido entre ambos" no existe: hay tres partidos y cada uno ganó uno.
- **Los dos empatados todavía no jugaron entre ellos.** Es lo habitual mientras la zona está en juego, y la tabla se muestra igual.

El criterio 7 (mayor ranking al inicio del torneo) está escrito para comparar entre grupos. Además hay que definir qué dato es ese ranking.

## Opciones consideradas

Para el empate de tres o más:

1. **Se saltea el enfrentamiento directo y desempata el ranking al inicio del torneo.**
   - En contra: los partidos entre los empatados no pesan, aunque uno de ellos les haya ganado a los otros dos.
2. **Mini-tabla entre los empatados:** se repite la cascada contando solo los partidos entre ellos.
   - En contra: es una regla que el reglamento no tiene, suma un nivel de recursión al motor y es difícil de explicar en una línea en la pantalla. En el empate circular perfecto no resuelve nada y hay que caer igual en otro criterio.
3. **Sorteo.**
   - En contra: la tabla cambiaría entre una consulta y otra, salvo que el resultado del sorteo se guarde. Y se ve arbitrario.

Para el ranking al inicio del torneo:

1. **`Inscripcion.posicionSiembra`**, que el sorteo escribe con el ranking vigente ([decisión 014](014-borrador-del-sorteo.md)).
   - En contra: en un torneo sin ranking, o entre jugadores con los mismos puntos, esa posición salió al azar ([decisión 013](013-empates-en-la-siembra.md)).
2. **Recalcular el ranking a la fecha de inicio del torneo.**
   - En contra: una consulta más en la pantalla más consultada, y entre jugadores con los mismos puntos sigue sin desempatar.

## Decisión

- **El enfrentamiento directo solo desempata entre dos.** Con tres o más empatados, o si los dos todavía no jugaron entre ellos, no separa a nadie.
- **Lo que queda empatado lo define el ranking al inicio del torneo, también dentro de la zona.** Es el criterio 7 del reglamento, extendido.
- **El ranking al inicio del torneo es `posicionSiembra`.**

En `apps/api/src/modules/competencia/clasificacion.ts` son los dos últimos comparadores de `CASCADA_DE_ZONA`: `ENFRENTAMIENTO_DIRECTO` y `RANKING`.

## Por qué

- **No se inventa un criterio:** se usa el que el reglamento ya tiene para el último desempate, en lugar de sumar una mini-tabla o un sorteo.
- **La tabla siempre tiene un orden y es siempre el mismo.** Las posiciones de siembra no se repiten, así que nunca quedan dos filas empatadas ni hace falta guardar nada.
- **Es raro llegar ahí con la zona terminada.** Para que tres jugadores sigan empatados después de sets y games tienen que coincidir los marcadores. Mientras la zona está en juego sí pasa seguido, y ordenar por siembra es lo que se espera: sin partidos jugados, la tabla muestra a los jugadores por ranking.
- **`posicionSiembra` ya es el ranking con el que se armó el torneo**, y no depende de puntos que cambien después.

## Qué se resigna

- **En un empate de tres, ganarles a los otros dos no alcanza:** clasifica el mejor rankeado. Si POLENTA lo resuelve de otra forma, cambia el comparador `enfrentamientoDirecto`.
- **En un torneo sin ranking, el último desempate es el azar del sorteo.** No hay otro dato con qué desempatar, pero en la pantalla se va a leer como "ranking": el texto tiene que contemplarlo. *Resuelto en `explicarDesempate()` (`packages/shared/src/desempate.ts`): sin ranking dice "desempata el sorteo".*
- **Va más allá del reglamento escrito.** Se suma a las preguntas para el organizador.
