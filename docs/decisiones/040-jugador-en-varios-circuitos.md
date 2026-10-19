# 040 — El jugador que juega en varios circuitos elige en cuál entra

**Estado:** aceptada — 19 de octubre de 2026

## Contexto

Un mismo jugador puede pertenecer a varios circuitos, con ranking independiente en cada uno (F02). En la base, un `Usuario` tiene un `Jugador` por cada organización en la que juega. Al ingresar a la app hay que decidir de cuál muestra los datos.

Para los administradores, la [decisión 002](002-organizacion-al-ingresar.md) resolvió el caso parecido entrando a la organización más antigua, porque hoy nadie administra dos.

## Opciones consideradas

1. **El perfil más antiguo**, como la decisión 002.
   - En contra: el segundo circuito no se puede ver desde la app.
2. **El jugador elige, y puede cambiar después.**
   - En contra: es una pantalla que no está en `docs/pantallas`, y hace falta un lugar para cambiar de circuito.
3. **Rechazar el ingreso** si tiene más de un perfil.
   - En contra: deja afuera a un usuario válido.

Para cambiar de circuito ya adentro se consideraron tres lugares: tocar el nombre del circuito en el encabezado, una pestaña "Cuenta" en la navegación, o solo al ingresar (cerrando sesión para cambiar).

## Decisión

Opción 2, y se cambia desde el encabezado.

- El ingreso devuelve todos los perfiles activos, del más viejo al más nuevo ([decisión 039](039-ingreso-del-jugador.md)).
- Con un solo circuito, entra directo. Con varios, la app pregunta "¿A qué circuito entrás?" y recuerda la elección en el celular.
- El nombre del circuito en el encabezado de las pantallas del jugador, con un chevron, abre la misma pantalla: los circuitos, con un punto lima en el actual, y "Cerrar sesión".
- Cambiar de circuito no pide volver a ingresar: el token es del usuario, y cada pedido dice de qué circuito es.
- El seed le da a la cuenta de prueba un perfil en cada organización.

Los administradores siguen como dice la decisión 002.

## Por qué

- **El jugador en dos circuitos es un caso real de la plataforma**, no un supuesto: F02 lo pide, y la demo tiene dos organizaciones ([devolucion-25.md](../devolucion-25.md), cambio A4). Para un administrador, en cambio, hoy no existe.
- **El encabezado ya está en todas las pantallas del jugador** y ya muestra el circuito: tocarlo para cambiarlo no depende de cómo se resuelva la navegación entre pantallas, que todavía no está diseñada.
- **Resuelve dónde va "Cerrar sesión"**, que ninguna pantalla de referencia tenía.

## Qué se resigna

- **Una pantalla sin referencia visual.** Está armada con los componentes de [design.md](../design.md) y anotada en [pantallas/README.md](../pantallas/README.md).
- **Que el nombre se pueda tocar no es evidente.** Lo indica el chevron.
- **Al cerrar sesión se olvida el circuito elegido**, para que en un celular compartido quien entre después elija el suyo.
