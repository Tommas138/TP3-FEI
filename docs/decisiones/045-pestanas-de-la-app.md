# 045 — Cómo se navega en la app

**Estado:** aceptada — 19 de octubre de 2026

## Contexto

Hasta ahora la app tenía una sola pantalla con sesión, el ranking. F11 suma Mi zona y Cuándo juego, y después vienen El torneo (F12) y la ficha (F17). Las pantallas de referencia no muestran cómo se pasa de una a otra.

## Opciones consideradas

1. **Una barra de pestañas abajo**, con las pantallas principales.
   - En contra: no hay pantalla de referencia con la barra; hay que diseñarla con los tokens.
2. **Enlaces dentro de cada pantalla**, sin barra.
   - En contra: con tres pantallas ya se navega peor, y empeora con cada pantalla nueva.

## Decisión

Opción 1. Las pantallas con sesión y circuito están en el grupo `src/app/(pestanas)` de expo-router, con `Tabs`. La barra es un componente propio, `BarraDePestanas`: solo texto, la pestaña activa en negro y una raya lima arriba. La app abre en Cuándo juego, que es la vista principal según [04-flujo-jugador.md](../04-flujo-jugador.md) §7; hasta que exista, en el ranking.

## Por qué

- **Es lo habitual en Android** y lo que el jugador espera de una app: cada pantalla principal a un toque, desde cualquier otra.
- **`Tabs` viene con expo-router.** No suma dependencias.
- **Texto solo, sin íconos:** la app no tiene librería de íconos, y sumar `react-native-svg` para tres pestañas no se justifica. Con nombres cortos se lee igual.

## Qué se resigna

- **La barra no pasó por el canvas de diseño.** Si el diseño la cambia, se cambia un solo componente.
- **Lugar para pocas pestañas:** con texto solo entran cuatro, como mucho. Lo que venga después (la ficha, El torneo) se abre desde otra pantalla.
