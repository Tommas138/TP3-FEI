# 033 — Dónde vive la consulta pública del ranking

**Estado:** aceptada — 17 de octubre de 2026

## Contexto

F09 pide que cualquiera consulte el ranking del circuito "desde un enlace, sin necesidad de crear cuenta ni instalar nada". La pantalla de referencia ([jugador/ranking.html](../pantallas/jugador/ranking.html)) es de la app del jugador y abre con una tarjeta "Vas 4º de 26" que necesita saber quién está logueado. La app (`apps/mobile`) todavía no existe.

Además, es la primera ruta de la API sin login. Hasta ahora todo colgaba de `/api/organizaciones/:slug/...` con `autenticar`, y la [decisión 019](019-acceso-a-las-posiciones.md) dejó dicho que cada consulta pública tendría su propia ruta.

Había que decidir tres cosas: en qué superficie va la pantalla, cómo se expone la ruta y qué muestra el enlace de una organización sin ranking.

## Opciones consideradas

**Superficie**

1. **Página pública en la web**, en `/c/:slug/ranking`.
   - En contra: no es la pantalla de la app de la referencia. La app la va a tener que hacer después, sobre la misma API.
2. **Solo la API ahora; la pantalla cuando exista la app.**
   - En contra: F09 no se vería en la entrega del 50%, y la app exige instalar, que es justo lo que F09 dice que no hace falta.
3. **Web y app en el mismo PR.**
   - En contra: obliga a inicializar `apps/mobile` dentro de esta feature. No es una pantalla por PR.

**Ruta de la API**

1. **Prefijo `/api/publico`:** `GET /api/publico/:slug/ranking`.
   - En contra: el mismo recurso queda en dos árboles de rutas.
2. **Bajo `/api/organizaciones/:slug/ranking`, sin autenticar.**
   - En contra: `organizacionesRouter` aplica `autenticar` a todo; habría que montarla antes y es fácil abrir algo sin querer.

**Organización con `usaRanking` apagado**

1. **Un aviso, sin tabla.**
   - En contra: los puntos guardados no se ven.
2. **La tabla igual.**
   - En contra: contradice lo que configuró la organización.

## Decisión

- **Página pública en la web**, en `/c/:slug/ranking` (`RankingPublicoPage`). Sin la tarjeta "Vas 4º": no hay sesión. El desglose por torneo del calendario se abre al tocar cada fila.
- **Prefijo `/api/publico`.** El cálculo es `tablaDeCategoria()` en `modules/ranking/ranking.ts`, lógica pura sobre `puntosVigentes()` y `asignarPuestos()` ([decisión 001](001-calculo-del-ranking.md)).
- **Sin ranking, un aviso:** la API responde `usaRanking: false` sin tablas y la página dice "Este circuito no lleva ranking".

## Por qué

- **La web cumple F09 tal como está escrita:** un enlace que se abre en el navegador del celular desde el grupo de WhatsApp, sin instalar nada.
- **Lo que no pide login queda junto y se audita de un vistazo.** Las consultas públicas que vienen (F10, F17) se suman bajo el mismo prefijo, y ninguna tiene que esquivar el `autenticar` de otro router.
- **La configuración de la organización manda.** Apagar el ranking no borra nada ([07](../07-configurabilidad.md) §1), así que los puntos vuelven a verse si lo reactiva.
- **El ranking es el mismo que ve el padrón:** cada jugador figura en su categoría actual, con los puntos de esa categoría, y los de baja no figuran (03-flujo-organizacion §5).

## Qué se resigna

- **La pantalla de la app sigue pendiente.** Cuando exista, va a consumir la misma ruta y sumar lo que depende de la sesión: la tarjeta "Vas 4º" y la fila propia destacada.
- **Habrá dos ramas de rutas** para la misma organización: `/api/organizaciones/:slug` con login y `/api/publico/:slug` sin login.
- **Cualquiera con el slug ve nombre, apellido y puntos** de todos los jugadores. Nunca teléfono, email ni DNI.
- **Los puntos de un torneo del calendario desactivado** suman al total pero no tienen casillero en el desglose, igual que los ajustes manuales.
