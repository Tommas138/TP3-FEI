# 031 — Cargar resultado se abre desde el Sorteo de zonas y el partido se elige adentro

**Estado:** aceptada — 16 de octubre de 2026

## Contexto

La pantalla *Cargar resultado* (F06) carga un partido por vez, y la referencia la ubica debajo del tablero del torneo: sus migas dicen "Tablero / Zona A / Cargar resultado". Pero el tablero (F15) es de la entrega del 75% y todavía no existe. Lo único que hay del torneo una vez confirmado el sorteo es la pantalla *Sorteo de zonas*, y los partidos de los cuadros no aparecen en ninguna pantalla.

Hay que decidir por dónde se entra a cargar un resultado y cómo se elige el partido, sin hacer el tablero dentro de un PR de otra pantalla.

## Opciones consideradas

1. **Desde las tarjetas de zona del Sorteo:** cada zona confirmada lista sus partidos y cada uno lleva a cargarlo.
   - En contra: convierte el Sorteo en un tablero a medias, y los partidos de cuadro no tienen desde dónde entrar.
2. **Solo por URL**, hasta que llegue el tablero.
   - En contra: en la demo no se llega a la pantalla.
3. **Un botón en el Sorteo, y el partido se elige dentro de la pantalla.** Se abre en el primer partido sin resultado y "Cambiar partido" despliega todos los del torneo.
   - En contra: la lista de partidos es una versión mínima de lo que va a hacer el tablero, y se va a reemplazar.

## Decisión

Opción 3.

- **La ruta es `/torneos/:id/resultados/:partidoId?`.** Sin `partidoId`, abre el primer partido que no tiene resultado, en el orden de la lista. Si no falta ninguno, muestra la lista para elegir cuál corregir.
- **"Cambiar partido"** despliega, dentro de la misma tarjeta, los partidos del torneo agrupados por zona y por ronda de cada cuadro, con los que faltan primero. Los de cuadro que esperan al ganador de la ronda anterior se ven pero no se pueden abrir, y los cancelados no aparecen.
- **La lista sale de un endpoint nuevo, `GET /torneos/:id/partidos`**, liviano: id, fase, zona o cuadro y ronda, jugadores, estado y ganador. Los sets se piden al abrir cada partido.
- **Se entra con "Cargar resultados"** en el pie del Sorteo de zonas, una vez confirmado.
- **Migas:** "<edición · categoría> / Zona A / Cargar resultado", o el cuadro y la ronda si es de cuadro ("Campeonato · semifinales"). La edición lleva al Sorteo de zonas. Para nombrar la ronda, el partido trae las rondas de su cuadro.

## Por qué

- **Se llega en la demo con un clic**, desde la pantalla que ya existe para el torneo.
- **Los partidos de cuadro tienen entrada**, igual que los de zona, sin otra pantalla.
- **El Sorteo sigue siendo el sorteo.** La lista vive en la pantalla que la usa y se puede tirar sin tocar otra.

## Qué se resigna

- **La lista es una versión mínima de lo que va a hacer el tablero (F15).** Cuando llegue, el tablero pasa a ser la entrada, "Cambiar partido" probablemente desaparezca y las migas van a empezar por él.
- **Mientras tanto, el Sorteo de zonas hace de página del torneo**, aunque su nombre no lo diga.
