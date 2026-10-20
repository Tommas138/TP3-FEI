# 046 — A quién se le muestra el teléfono de un jugador

**Estado:** aceptada — 19 de octubre de 2026

## Contexto

Cuándo juego (F11) tiene un botón "Escribirle" que abre WhatsApp con el rival, porque la app no tiene chat ([04-flujo-jugador.md](../04-flujo-jugador.md) §6.6). Para eso la API tiene que mandarle a la app el teléfono del rival.

El mismo §6.6 dice que los rivales de zona pueden ver el teléfono "con aviso previo". Ese aviso no está diseñado: no hay pantalla ni campo donde el jugador lo acepte. Hasta ahora, ninguna respuesta de la API para jugadores o para el público incluía un teléfono.

## Opciones consideradas

1. **Solo a los rivales, solo para coordinar, sin el aviso por ahora.** `GET /api/jugador/:slug/partidos` da el teléfono del rival en los partidos que todavía no se jugaron, y en ningún otro caso.
   - En contra: hasta que exista el aviso, no se cumple del todo lo que dice el documento.
2. **Ningún teléfono hasta diseñar el aviso.** Sin botón "Escribirle".
   - En contra: la pantalla pierde su acción principal, y coordinar es lo que el jugador hace con su rival ([02-dominio.md](../02-dominio.md) §8.2).

## Decisión

Opción 1. El teléfono sale solo de `partidosDelJugador()` (`apps/api/src/modules/jugador/mis-partidos.ts`), solo para el rival de cada partido y solo mientras el partido no tiene resultado. Ninguna otra ruta lo devuelve.

## Por qué

- **Es lo que hoy ya pasa en el grupo de WhatsApp:** los jugadores del circuito se conocen y coordinan entre ellos. La app no expone nada que el rival no tenga ya.
- **El alcance es el mínimo para coordinar:** quien tiene que escribirle, cuando tiene que escribirle. Terminado el partido, el teléfono deja de salir.
- **El aviso previo se puede sumar después** sin cambiar la ruta: es un dato del jugador y un `if` en `partidosDelJugador()`.

## Qué se resigna

- **El aviso previo de §6.6 queda pendiente.** Hasta que exista, el jugador no se entera de que su rival puede ver su teléfono.
- **Un jugador de un circuito con inscripción abierta** (`modo_inscripcion: abierta`) puede tener rivales que no conoce. Para esos circuitos el aviso es más necesario que para POLENTA.
