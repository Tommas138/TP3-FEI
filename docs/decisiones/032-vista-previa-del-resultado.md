# 032 — La vista previa de un resultado de zona la calcula la API sin guardar

**Estado:** aceptada — 16 de octubre de 2026

## Contexto

Antes de guardar un resultado, la pantalla *Cargar resultado* (F06) tiene que decir qué va a pasar: quién queda en qué puesto de la zona y a qué cuadro va cada uno ([design.md](../design.md) §2, principio 4). Eso es la tabla de la zona con el resultado nuevo, ordenada con la cascada de desempates.

La cascada vive en la API (`apps/api/src/modules/competencia/clasificacion.ts`) y es el módulo más testeado del proyecto. La web tiene los partidos que trae la API, pero no la cuenta. Con las zonas cerradas, además, una corrección se rechaza si cambia la siembra de los cuadros ([decisión 028](028-correccion-de-resultados.md)), y conviene saberlo antes de tocar "Guardar".

## Opciones consideradas

1. **Un endpoint que simula:** `POST .../partidos/:partidoId/simulacion`, con el mismo body que el `PUT`, que devuelve la tabla de la zona como quedaría sin guardar nada.
   - En contra: un pedido por cada cambio de la grilla, y la vista previa llega con un poco de demora.
2. **Mover la cascada a `packages/shared`** y calcular la tabla en la web.
   - En contra: mueve el módulo más testeado dentro de un PR de pantalla, y la web tendría que pedir todos los partidos de la zona con sus sets.
3. **Simplificar la vista previa** a lo que se sabe sin la tabla: quién gana y por cuánto.
   - En contra: no dice quién queda dónde ni adónde va, que es lo que pide el principio 4 de design.md.

## Decisión

Opción 1.

- **`POST /torneos/:id/partidos/:partidoId/simulacion`** recibe lo mismo que el `PUT` y lo valida igual: comparten `resultadoAGuardar()` en `resultados.service.ts`. Si el `PUT` lo rechazaría, la simulación también.
- **Devuelve la tabla de la zona como quedaría**, con `simularZona()` en `posiciones.ts`, que reemplaza el partido con `conElResultado()` y la arma con las mismas funciones que `GET .../posiciones`. Suma cuántos partidos de la zona seguirían sin resultado, para decir si la clasificación es "por ahora".
- **Con las zonas cerradas, avisa si la corrección cambia los cuadros**, con la misma `correccionCambiaLosCuadros()` que el guardado. La pantalla lo dice y no deja guardar.
- **La web la pide con un debounce**, solo cuando la grilla forma un resultado válido. Mientras llega la respuesta nueva, la anterior se ve apagada.
- **En un partido de cuadro no hay tabla:** la vista previa ("Roa pasa a semifinales", "Roa es campeón de Campeonato") la arma la web con la ronda y las rondas del cuadro, que trae el partido. La simulación de un partido de cuadro valida y devuelve la zona en `null`.
- **Una corrección de cuadro que cambia un ganador que ya jugó el partido siguiente** también se avisa antes de guardar: la web lo sabe con la lista de partidos del torneo ([decisión 031](031-como-se-llega-a-cargar-resultado.md)), donde ese ganador aparece en la ronda siguiente con resultado. El `409 SIGUIENTE_YA_JUGADO` queda como respaldo.

## Por qué

- **Una sola cuenta.** La tabla de la vista previa sale de las mismas funciones que la tabla real, así que no pueden diferir.
- **La cascada no se mueve** y sus tests siguen donde están.
- **La pantalla dice lo que pide design.md**: puesto, partidos ganados y cuadro de cada uno, antes de guardar.

## Qué se resigna

- **Un pedido por cada cambio** que forma un resultado válido. El debounce los junta mientras se escribe.
- **La vista previa llega con un poco de demora**, y sin conexión no aparece, aunque la grilla sí se valida.
- **La app móvil, si algún día carga resultados, tiene que pedir lo mismo a la API**: no hay cálculo local.
