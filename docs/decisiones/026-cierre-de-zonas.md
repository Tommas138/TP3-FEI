# 026 — Los cuadros se arman cuando la organización cierra las zonas

**Estado:** aceptada — 16 de octubre de 2026

## Contexto

Al terminar la fase de grupos, el sistema arma los cuadros con las posiciones finales de cada zona ([03-flujo-organizacion.md](../03-flujo-organizacion.md) §11). Cómo se ubica cada uno está en las decisiones [022](022-ubicacion-en-el-cuadro.md) y [023](023-byes-sin-partido.md). Falta decidir **cuándo** se arman: qué los dispara y si antes existe algo.

Las zonas no siempre terminan solas. Un partido que no se coordinó dentro del plazo queda vencido, y el reglamento dice que lo resuelve el Comité: W.O., doble W.O. o más días ([02-dominio.md](../02-dominio.md) §8.4). Hasta que lo resuelve, la tabla de esa zona no está cerrada.

## Opciones consideradas

1. **Automáticamente, al cargarse el último resultado de zona.**
   - En contra: si queda un partido vencido sin resolver, no se dispara nunca y no hay forma de destrabarlo. Nadie mira las tablas finales antes de que los cuadros existan, y una carga equivocada en el último partido arma un cuadro equivocado sin aviso.
2. **La organización cierra las zonas** cuando todos los partidos tienen resultado, y en ese momento el sistema arma los cuadros.
   - En contra: es un paso más para la organización. "Automático" queda en el armado, no en el disparo.
3. **La estructura vacía de los cuadros se crea al confirmar el sorteo** y se llena al cerrar las zonas.
   - En contra: hay que tocar la confirmación del sorteo. Durante tres semanas existen partidos vacíos que el tablero y "mis partidos" tienen que saltear, y si el formato cambia por bajas (zonas de 3) la estructura reservada ya no sirve.

## Decisión

Opción 2. `POST /api/organizaciones/:slug/torneos/:id/cuadros`, en `apps/api/src/modules/competencia/cuadros.service.ts`:

- Se puede cerrar desde zonas generadas o grupos en curso, y una sola vez: el torneo pasa a eliminatorias con `gruposCerrados`, con el estado como condición del `UPDATE`, igual que la confirmación del sorteo.
- Si algún partido de zona no tiene resultado, responde `ZONAS_INCOMPLETAS`. Los cancelados no frenan el cierre; los vencidos sí, porque los decide la organización.
- En la misma transacción se crean los dos cuadros completos, de la final hacia atrás, con el partido al que avanza cada ganador y la fecha límite de cada ronda: el plazo por ronda del torneo, contado desde el cierre.
- No se deshace.

El avance del ganador lo hace `avanzarGanador()`, que la carga de resultados (F06) llama en la misma transacción en que guarda el resultado.

## Por qué

- **Respeta el reglamento:** lo que no se jugó lo decide la organización, no una regla automática. El cierre no puede pasar antes de esa decisión.
- **La organización ve las tablas finales antes de que existan los cuadros**, en la misma pantalla de posiciones, y cierra cuando está conforme.
- **Mientras se juegan las zonas no hay partidos vacíos** que ensucien el tablero.
- **Los plazos de las rondas salen del día real del cierre**, no del cronograma estimado de la convocatoria, que se corre si las zonas se estiran.

## Qué se resigna

- **No es automático de punta a punta:** hace falta un clic.
- **No se puede reabrir.** Si después del cierre se corrige un resultado de zona que cambia quién clasifica, los cuadros no se rehacen solos. Rehacerlos con partidos ya jugados es un problema aparte, que hoy no se resuelve.
- **El cronograma de la convocatoria pasa a ser una estimación** para la fase eliminatoria: las fechas reales salen del cierre.
