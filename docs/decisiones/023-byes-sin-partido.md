# 023 — Los byes no generan partido

**Estado:** aceptada — 15 de octubre de 2026

## Contexto

Un cuadro de eliminación directa necesita una cantidad de lugares que sea potencia de 2. Con 16 clasificados no sobra nada, pero con 12 (6 zonas de 4 y 2 clasificados) el cuadro es de 16 y quedan 4 lugares vacíos: 4 jugadores pasan a la segunda ronda sin jugar. Pasa también en el cuadro consuelo cuando hay zonas de 3 ([decisión 015](015-zonas-con-menos-inscriptos.md)). Los byes son para los mejores sembrados ([decisión 022](022-ubicacion-en-el-cuadro.md)).

Hay que decidir cómo queda un bye en la base.

## Opciones consideradas

1. **Un `Partido` de primera ronda con un solo jugador, que avanza solo.**
   - En contra: la base registra como jugado un partido que no se jugó, el mismo problema que se evitó con el W.O. ([decisión 016](016-walkover-sin-sets-guardados.md)). No hay un estado `BYE` en `EstadoPartido`, y cada consulta de partidos (el tablero, el head-to-head, "mis partidos") tendría que acordarse de saltearlos.
2. **No se crea el partido: el jugador queda directamente en la segunda ronda**, como jugador A o B del partido al que habría avanzado.
   - En contra: la primera ronda queda incompleta. La pantalla del cuadro tiene que dibujar el hueco a partir de `ronda` y `ordenEnRonda`.

## Decisión

Opción 2. `armarCuadro()` en `apps/api/src/modules/competencia/cuadros.ts` crea todos los partidos de la segunda ronda en adelante, y de la primera solo los que tienen dos jugadores. Quien tiene bye ya figura en su partido de segunda ronda.

## Por qué

- **La base solo tiene partidos que se juegan.** Un cuadro de n jugadores tiene n − 1 partidos, haya byes o no: es la misma cuenta que ya usa la convocatoria para estimar el torneo (`calcularFormato()` en `packages/shared`).
- **Ninguna consulta necesita un caso especial.** Contar partidos jugados o pendientes, armar el head-to-head o el ranking por instancia no tiene que filtrar nada.
- **No hace falta otro estado del partido** ni migración.

## Qué se resigna

- **La pantalla del cuadro tiene que deducir los huecos**: la primera ronda tiene menos partidos que lugares. `ronda` y `ordenEnRonda` alcanzan para ubicar cada partido.
- **Para saber que alguien tuvo bye hay que mirar el cuadro**: no hay un registro que lo diga. Para los puntos no importa: la instancia alcanzada es la ronda en la que quedó eliminado, y esa sí está en el cuadro.
