# 039 — El jugador ingresa por un endpoint propio

**Estado:** aceptada — 19 de octubre de 2026

## Contexto

La app del jugador necesita un login. El único que había, `POST /api/auth/ingreso`, es el de la web: devuelve la organización que administra el usuario ([decisión 002](002-organizacion-al-ingresar.md)) y responde 403 `SIN_ORGANIZACION` a quien no administra ninguna. Un jugador no podía entrar.

Un mismo usuario puede ser administrador de una organización y jugador de otra, o de la misma. Las cuentas de jugador existen desde F02 (`Jugador.usuarioId`), aunque crearlas desde la app llega con F12.

## Opciones consideradas

1. **Un endpoint aparte**, `POST /api/auth/ingreso-jugador`, que devuelve los perfiles de jugador.
   - En contra: dos endpoints de login que comparten el chequeo de la contraseña.
2. **El mismo `/auth/ingreso`**, con el perfil de jugador en la respuesta y sin rechazar a quien no administra.
   - En contra: cambia el contrato que usa la web, la respuesta pasa a tener campos opcionales, y la web tendría que rechazar ella misma a quien solo juega.
3. **Uno que devuelve todos los roles** (lo que administra y dónde juega) y elige cada cliente.
   - En contra: es el cambio más grande, toca la web y obliga a un selector de rol que no está diseñado.

## Decisión

Opción 1. `POST /api/auth/ingreso-jugador` recibe lo mismo que el de la web (`ingresoSchema`) y responde `RespuestaIngresoJugador`: el token, el usuario y un perfil por circuito en el que juega ([decisión 040](040-jugador-en-varios-circuitos.md)).

- Quien no tiene ningún perfil de jugador activo recibe 403 `SIN_PERFIL_DE_JUGADOR`. La app le dice que, si administra una organización, entre por la web.
- El chequeo de email y contraseña es una sola función para los dos endpoints: mismo error y mismo tiempo de respuesta exista o no el email.
- El token es el mismo de siempre: identifica al usuario, no al circuito.

## Por qué

- **La web no cambia.** Su login, su sesión y sus mensajes quedan como estaban.
- **Cada cliente pide lo que usa:** la web, la organización que administra; la app, dónde juega.
- **Quien es administrador y jugador a la vez no tiene que elegir rol:** entra como administrador en la web y como jugador en la app, con la misma cuenta.

## Qué se resigna

- **Dos rutas de login** que quien lea la API tiene que conocer.
- **Un administrador que entra a la app sin perfil de jugador ve un error**, no su organización. La app es del jugador ([04-flujo-jugador.md](../04-flujo-jugador.md) §10).
