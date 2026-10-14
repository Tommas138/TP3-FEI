# 018 — Comparar zonas de distinto tamaño

**Estado:** aceptada — 14 de octubre de 2026

## Contexto

A veces hay que comparar a jugadores de zonas distintas que terminaron en el mismo puesto: por ejemplo, elegir al mejor tercero para completar un cuadro. El reglamento dice que se usa el mismo procedimiento que dentro de la zona ([02-dominio.md](../02-dominio.md) §6).

Pero si no se llena el cupo, conviven zonas de 4 y de 3 ([decisión 015](015-zonas-con-menos-inscriptos.md)). En una zona de 4 se juegan 3 partidos y en una de 3, 2. Los primeros criterios de la cascada son totales (partidos, sets y games ganados), así que el de la zona de 4 compara con un partido más. El reglamento no lo contempla, porque supone todas las zonas completas.

## Opciones consideradas

1. **Comparar los totales como están.**
   - En contra: el de la zona de 4 tiene un partido más para sumar. Un tercero que le ganó al último ya está arriba de cualquier tercero de una zona de 3 que no ganó nada, aunque hayan jugado igual contra los de arriba.
2. **Descartar, en cada zona de 4, el partido contra el último.** Todos comparan la misma cantidad de partidos, contra rivales que también clasificaron arriba del último. Es lo que hacen la FIFA y la UEFA cuando los grupos no son del mismo tamaño.
   - En contra: un resultado real deja de contar para esta comparación. Y hay que explicar en pantalla por qué el jugador tiene menos partidos que en la tabla de su zona.
3. **Comparar promedios por partido** (games ganados por partido, etc.).
   - En contra: aparecen decimales y empates raros, la cascada deja de ser la del reglamento y se explica peor ("1,5 sets por partido").

## Decisión

Opción 2. `compararEntreZonas()` en `apps/api/src/modules/competencia/clasificacion.ts`:

- Toma de cada zona al jugador del puesto pedido, según la tabla completa de su zona. Las zonas que no tienen ese puesto (una zona de 3 al comparar cuartos) no entran.
- Si las zonas que se comparan no son del mismo tamaño, en las más grandes descarta los partidos contra los que quedaron debajo del tamaño de la más chica. Con zonas de 3 y de 4, el partido contra el último.
- Ordena con `CASCADA_ENTRE_ZONAS`: la de la zona sin el enfrentamiento directo, que entre zonas no existe. Lo que queda empatado lo define el ranking al inicio del torneo.

El ranking al inicio del torneo es `posicionSiembra` ([decisión 017](017-empates-que-el-enfrentamiento-directo-no-resuelve.md)). El sorteo la numera de 1 a N en todo el torneo, no dentro de cada zona, así que sirve para comparar entre zonas sin cambios y nunca empata.

## Por qué

- **Se comparan cosas iguales:** la misma cantidad de partidos y contra rivales del mismo nivel relativo.
- **La cascada sigue siendo la del reglamento**, con los mismos criterios y en el mismo orden. Solo cambia qué partidos entran.
- **Es una práctica conocida**, que se puede citar si un jugador pregunta.
- **Con todas las zonas completas no cambia nada.** El caso de POLENTA con el cupo lleno queda como dice el reglamento.

## Qué se resigna

- **Un partido jugado no cuenta para esta comparación.** Quien le ganó al último por 6-0 6-0 pierde esos games frente a otro de una zona de 3.
- **Quién es "el último" sale de la tabla completa**, que puede haberse definido por enfrentamiento directo o por ranking. Una diferencia mínima en esa zona decide qué partido se descarta.
- **Va más allá del reglamento escrito.** Se suma a las preguntas para el organizador.
