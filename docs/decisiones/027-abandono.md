# 027 — El abandono guarda lo que se jugó y se computa como un W.O.

**Estado:** aceptada — 16 de octubre de 2026

## Contexto

F06 dice que el walkover y el abandono "se registran como seis a cero en ambos sets". Para el W.O. eso ya está resuelto: no se guardan sets y el 6-0 6-0 se arma al calcular la tabla ([decisión 016](016-walkover-sin-sets-guardados.md)). El abandono es distinto: el partido empezó, hay un marcador real ("6-3 2-1, abandonó"), y `EstadoPartido` no tenía forma de distinguirlo. El reglamento de POLENTA no dice cómo se computa un abandono ([02-dominio.md](../02-dominio.md) §8.5): F06 es una regla nuestra.

## Opciones consideradas

1. **Igual que un W.O.:** un estado `ABANDONO` sin sets, y la tabla le arma el 6-0 6-0.
   - En contra: se pierde el marcador real, que es lo que muestra el tenis y lo que verían la ficha del jugador (F17) y el head-to-head (F18).
2. **Se guarda lo que se jugó y se computa 6-0 6-0:** `ABANDONO` con los sets jugados, el último posiblemente sin terminar, y el ganador que indica la organización. Para la tabla cuenta como un W.O.
   - En contra: hay sets guardados que no cuentan para los desempates; quien sume games tiene que mirar el estado. Validar un marcador parcial es más lógica.
3. **Se guarda lo que se jugó y se completa el marcador** a favor de quien siguió: los games que faltaban del set en juego y los sets que faltaban.
   - En contra: es una regla nuestra que contradice F06 y que el reglamento no tiene. Quien abandona conserva sus games, así que abandonar le puede convenir más que dar W.O.

## Decisión

Opción 2.

- `EstadoPartido` suma `ABANDONO`.
- `PUT .../partidos/:partidoId/resultado` acepta `{ tipo: 'abandono', ganadorId, sets }`. Los sets se validan contra el sistema de juego como los de un partido jugado, salvo el último, que puede haber quedado en juego (hasta 6-6, o un super tie-break que no llegó a 10). Si el marcador ya define el partido, no es un abandono y se pide cargarlo como jugado.
- `estadisticasDeZona()`, en `apps/api/src/modules/competencia/clasificacion.ts`, trata el abandono igual que el W.O.: 6-0 6-0 a favor del ganador, sin mirar los sets guardados.

## Por qué

- **La base dice lo que pasó:** se jugó hasta acá y uno abandonó. Es lo mismo que defiende la 016 desde el otro lado: no registrar como jugado lo que no se jugó, ni como no jugado lo que sí.
- **Respeta F06:** para los desempates, abandonar y dar W.O. valen lo mismo.
- **Hay un solo lugar que cuenta sets y games**, el mismo que ya arma el W.O.

## Qué se resigna

- **Una consulta directa a `sets_partido` cuenta games que la tabla no cuenta.** Ya pasaba al revés con el W.O. (016): cualquier estadística con SQL tiene que mirar el estado.
- **Quien abandona pierde los games que había ganado.** Si el circuito computara distinto, hay que cambiar `estadisticasDeZona()`. Queda la pregunta al organizador en el [README](../README.md).
