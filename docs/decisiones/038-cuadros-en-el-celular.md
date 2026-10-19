# 038 — Cómo se ven los cuadros en el celular

**Estado:** aceptada — 19 de octubre de 2026

## Contexto

*Los dos cuadros* ([publico/cuadros.html](../pantallas/publico/cuadros.html)) es una página pública: la organización comparte el enlace en el grupo de WhatsApp y casi todos la van a abrir desde el celular. La referencia está dibujada a 1860 px, con los dos cuadros lado a lado: cada uno tiene una columna de 190 px por ronda, unidas por codos de 34 px. Un cuadro de 16 (cuatro rondas) ocupa unos 860 px, y uno de 32, unos 1090 px.

[design.md](../design.md) §12 prohíbe el scroll horizontal en el celular: si algo no entra, se reorganiza.

## Opciones consideradas

1. **Una ronda a la vez.** Chips para elegir el cuadro y la ronda, y los partidos de esa ronda apilados en tarjetas a lo ancho de la pantalla. Abre en la ronda que se está jugando.
   - En contra: en el celular se pierde la forma del cuadro, y para seguir a un jugador hay que cambiar de ronda.
2. **Todas las rondas en una lista.** Un cuadro a la vez, con las rondas una debajo de la otra.
   - En contra: un cuadro de 16 son 15 tarjetas, y la final, que es lo que más se busca, queda al fondo.
3. **El cuadro achicado.** El mismo dibujo con codos, con tarjetas angostas para que entre en 375 px.
   - En contra: con apellidos largos no entra, y las tarjetas quedan por debajo del área táctil mínima.

## Decisión

- **En el celular y la tablet, una ronda a la vez** (`CuadroPorRonda`). Los byes no tienen partido ([decisión 023](023-byes-sin-partido.md)), así que en esa vista no aparecen.
- **Desde 1280 px, los cuadros completos** (`CuadroCompleto`), con codos y lado a lado si entran; si no, uno debajo del otro. El corte es 1280 px y no 1024 px porque un cuadro de 32 (cinco rondas) mide 1090 px y tiene que entrar entero.
- **La página abre en la ronda en curso:** la primera que tiene un partido sin resultado o, si ya se jugó todo, la final.

## Por qué

- **Es lo que se busca al abrir el enlace:** qué se juega esta semana y cómo salió lo último. La ronda en curso responde las dos cosas sin buscar.
- **Cumple design.md sin achicar nada:** las tarjetas mantienen su tamaño y se pueden tocar.
- **Los cuadros completos siguen estando** en la pantalla grande, que es la que se proyecta o se mira con tiempo.

## Qué se resigna

- **En el celular no se ve el camino de un jugador de un vistazo.** Si se pide, una ficha del jugador (F17) puede mostrar su recorrido.
- **Entre 1024 y 1280 px se ve la vista por ronda**, aunque un cuadro de 16 entraría completo.
- **Un cuadro de 64 (seis rondas) no entra en 1280 px:** ese contenedor tiene scroll horizontal en escritorio. Ningún circuito relevado juega cuadros de 64.
