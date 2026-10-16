# 028 — Un resultado se corrige si no cambia lo que ya se armó con él

**Estado:** aceptada — 16 de octubre de 2026

## Contexto

F06 pide poder corregir un resultado ya cargado, "revirtiendo sus efectos sobre tablas y cuadros". Las tablas de las zonas se calculan en cada consulta, así que mientras las zonas están abiertas no hay nada que revertir. Los problemas aparecen cuando el resultado ya tuvo consecuencias:

- **Zonas cerradas.** Los cuadros se armaron con las tablas finales ([decisión 026](026-cierre-de-zonas.md)), y la 026 ya dice que no se rehacen.
- **Partido de cuadro.** `avanzarGanador()` reemplaza al ganador en el partido siguiente, pero si ese partido ya se jugó, se jugó con otro.

Una corrección de cuadro que no cambia el ganador no afecta nada, y una corrección de zona no siempre cambia la siembra.

## Opciones consideradas

1. **No se corrige nada que ya tuvo efecto:** ni un partido de zona con las zonas cerradas, ni uno de cuadro cuyo siguiente ya tiene resultado.
   - En contra: no deja cambiar un 6-3 por un 6-4 aunque no cambie nada.
2. **Se corrige si lo que ya tuvo efecto queda igual.** En un cuadro, siempre que el ganador sea el mismo; si cambia, solo si el siguiente no se jugó. Con las zonas cerradas, solo si la siembra de los dos cuadros queda igual.
   - En contra: más lógica, y un error que sí cambia quién clasificó o quién avanzó no se puede corregir.
3. **En cascada:** se anulan los resultados que vinieron después y se rehacen los cuadros.
   - En contra: borra partidos que se jugaron de verdad, contradice la 026 y es lo más riesgoso para noviembre.

## Decisión

Opción 2. Cargar y corregir es el mismo `PUT .../partidos/:partidoId/resultado`: el resultado nuevo reemplaza al anterior, sets y ganador en la misma transacción.

- **Zona abierta:** se corrige siempre.
- **Zona cerrada:** se recalculan las siembras de los dos cuadros con el resultado corregido (`correccionCambiaLosCuadros()` en `apps/api/src/modules/competencia/cuadros.ts`). Si alguna cambia, responde `409 CORRECCION_CAMBIA_LOS_CUADROS`.
- **Cuadro:** si el ganador es el mismo, el cuadro no se toca. Si cambia, `avanzarGanador()` pone al nuevo en el partido siguiente, salvo que ese partido ya tenga resultado: `409 SIGUIENTE_YA_JUGADO`.
- **Torneo finalizado:** no se corrige nada (`409 TORNEO_TERMINADO`), porque ya se repartieron los puntos (F16).

## Por qué

- **Ningún resultado jugado se borra:** lo que se rechaza es justo lo que obligaría a anular un partido que existió.
- **Cubre los errores más comunes**, que son de tipeo: un game de más o de menos, el tie-break mal anotado. Esos casi nunca cambian quién gana.
- **Usa el mismo cálculo que armó los cuadros:** la siembra se compara con las mismas funciones que la generaron, así que no hay dos versiones de la regla.

## Qué se resigna

- **Un error que cambió quién clasificó o quién avanzó no tiene arreglo en el sistema.** Es la misma limitación que la 026 ya aceptaba para los cuadros, y ahora alcanza también al cuadro con un partido siguiente jugado.
- **Un game puede bloquear una corrección.** Entre zonas, los empates se resuelven por sets y games ([decisión 018](018-comparar-zonas-de-distinto-tamano.md)), así que un game puede mover la siembra entre zonas aunque clasifiquen los mismos.
