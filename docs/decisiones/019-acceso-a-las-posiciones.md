# 019 — Quién puede consultar las posiciones de las zonas

**Estado:** aceptada — 14 de octubre de 2026

## Contexto

La tabla de posiciones de las zonas (F07) la van a mostrar tres pantallas, con públicos distintos:

- **La web de la organización**, para seguir el torneo y cargar resultados (F06).
- **Mi zona**, en la app (F11), para el jugador que está en la zona.
- **La consulta pública** (F10), para cualquiera que quiera ver cómo va el torneo, sin cuenta.

Hoy la API solo tiene un permiso para lo que cuelga de un torneo: administrar la organización (`organizacionAdministrada`). No hay rutas públicas ni un chequeo de "jugador de esta organización". La primera pantalla que usa la tabla es la de la organización.

## Opciones consideradas

1. **Una sola ruta pública**, sin autenticación, para las tres pantallas.
   - En contra: decide hoy qué muestra la consulta pública, antes de diseñar F10. Cualquiera con el slug y el id ve la tabla.
2. **Con login de administrador ahora; la consulta pública suma su propia ruta sobre el mismo servicio.**
   - En contra: van a quedar dos o tres rutas para la misma tabla, y la app necesita un permiso que todavía no existe.
3. **Con login de cualquier usuario**, administrador o jugador.
   - En contra: F10 igual necesita una ruta sin login, y comprobar que el jugador es de la organización es código nuevo que hoy no usa nadie.

## Decisión

Opción 2. `GET /api/organizaciones/:slug/torneos/:id/posiciones` pide login y que el usuario administre la organización, igual que el sorteo. El cálculo vive en `obtenerPosiciones()` y `zonasConPosiciones()` (`apps/api/src/modules/competencia/`), sin nada que dependa de quién pregunta: las rutas de F10 y F11 lo reusan con su propio permiso.

## Por qué

- **Cada ruta se abre cuando existe la pantalla que la usa**, con el permiso que esa pantalla necesita. Es la misma regla que seguimos con el frontend: nada "por las dudas".
- **El aislamiento por organización no cambia:** el torneo se busca siempre con su `organizacionId`.
- **Lo caro es el cálculo, y ese no se duplica.** Una ruta nueva son pocas líneas.

## Qué se resigna

- **Habrá más de una ruta para la misma tabla.** Quien lea la API tiene que saber que devuelven lo mismo.
- **La app no la puede consumir todavía.** Cuando se haga Mi zona hay que definir cómo se reconoce al jugador de la organización.
