# 044 — Cómo reconoce la API al jugador

**Estado:** aceptada — 19 de octubre de 2026

## Contexto

Mi zona y Cuándo juego (F11) muestran lo de un jugador en particular: su zona, sus partidos, el teléfono de sus rivales. Hasta ahora la API tenía dos permisos: administrar la organización (`organizacionAdministrada`, rutas de `/api/organizaciones`) y nada (`/api/publico`, [decisión 033](033-ranking-publico.md)). La [decisión 019](019-acceso-a-las-posiciones.md) dejó dicho que Mi zona tendría su propia ruta sobre el mismo cálculo de posiciones, y que había que definir cómo se reconoce al jugador.

El token identifica al usuario, no al circuito ([decisión 039](039-ingreso-del-jugador.md)), y un usuario puede jugar en varios ([decisión 040](040-jugador-en-varios-circuitos.md)).

## Opciones consideradas

1. **Prefijo `/api/jugador/:slug`**, con login y un permiso nuevo, `perfilDeJugador(slug, usuarioId)`, que devuelve el perfil de ese usuario en esa organización.
   - En contra: un tercer árbol de rutas.
2. **Las rutas de `/api/organizaciones` aceptan también a un jugador** de la organización.
   - En contra: cada ruta mezcla dos permisos, y un error en uno abre datos de administración a los jugadores.

## Decisión

Opción 1. `GET /api/jugador/:slug/zona` es la primera ruta. El jugador sale del token y del slug: nunca de un id en la URL, así que no se puede pedir la zona de otro. Quien no tiene un perfil activo en la organización recibe 403 `SIN_PERFIL_DE_JUGADOR`, como en el ingreso.

## Por qué

- **Tres prefijos, tres permisos:** `/api/organizaciones` para quien administra, `/api/jugador` para quien juega, `/api/publico` para cualquiera. Se ve en la URL qué permiso tiene cada ruta.
- **Ninguna ruta de administración cambia.** No se toca el permiso de lo que ya funciona.
- **El cálculo no se duplica:** Mi zona usa `zonasConPosiciones()`, igual que las posiciones de la organización.

## Qué se resigna

- **Habrá más de una ruta para datos parecidos.** La zona tiene una ruta para la organización y otra para el jugador, y va a tener una pública con F10.
- **Si el jugador está en dos torneos a la vez** (las eliminatorias de uno y las zonas del siguiente), Mi zona muestra una sola zona: la que se está jugando, antes que una ya cerrada.
