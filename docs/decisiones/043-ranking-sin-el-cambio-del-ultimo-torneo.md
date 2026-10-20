# 043 — La tarjeta del ranking no muestra cuánto cambió el último torneo

**Estado:** aceptada — 19 de octubre de 2026

## Contexto

La tarjeta negra de [ranking.html](../pantallas/jugador/ranking.html) muestra, además del puesto y los puntos, un chip "+15" y la línea "Los 15 de Invierno 26 reemplazaron los 10 que tenías en Invierno 25".

La ruta que usa la app, `GET /api/publico/:slug/ranking` ([decisión 033](033-ranking-publico.md)), devuelve los casilleros vigentes, pero no los puntos que cada uno reemplazó. Además, la referencia se contradice: si 15 reemplazan a 10, el jugador subió 5, no 15.

## Opciones consideradas

1. **Sacar el chip y la línea por ahora.**
   - En contra: el jugador no ve cuánto cambió con el último torneo.
2. **Ampliar la ruta pública** con los puntos que reemplazó cada casillero.
   - En contra: toca la API y la web; el seed no tiene ningún reemplazo, así que habría que sumar movimientos viejos para poder mostrarlo; y la ruta pública pasa a exponer historial.
3. **Mostrar solo "+N", los puntos del último torneo**, sin la línea.
   - En contra: "+15" se lee como lo que subiste, y si reemplazó 10, subiste 5.

## Decisión

Opción 1. La tarjeta muestra "Vas 1º de 26", el total y los casilleros, con el último torneo que sumó en lima.

## Por qué

- **No se muestra un número que puede estar mal.** Con la opción 3, el "+N" contradice lo que pasó cada vez que hubo un reemplazo, que en un circuito con ranking es casi siempre.
- **Lo que pide F09 y F11 ya está:** tu puesto, tus puntos y de qué torneo salió cada uno.
- **Se puede sumar después sin rehacer nada:** es otro dato en la respuesta y una línea en la tarjeta. Tiene más sentido con F16 (el cierre que reemplaza los casilleros) y con la ficha del jugador (F17), que ya muestran historial.

## Qué se resigna

- **La línea que explica el reemplazo**, que es justo lo que más cuesta entender del ranking por casilleros. La regla está explicada en la landing y en *Tu circuito*, que ve la organización, pero no en la app.
