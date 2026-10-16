# 025 — No se cierra la inscripción si los que pagaron no alcanzan para las zonas

**Estado:** aceptada — 15 de octubre de 2026

## Contexto

El sorteo exige al menos 3 jugadores por zona ([decisión 015](015-zonas-con-menos-inscriptos.md)): si los que pagaron son menos que `cantidadGrupos × 3`, responde `INSCRIPTOS_INSUFICIENTES`.

Con la inscripción cerrada, el formato ya no se edita ([03-flujo-organizacion.md](../03-flujo-organizacion.md) §6) y no hay forma de reabrirla. Si se pudiera cerrar con pocos pagados, la categoría quedaría trabada: no se puede sortear ni corregir.

## Opciones consideradas

1. **Dejar cerrar igual.** El sorteo muestra que no alcanzan.
   - En contra: la categoría queda sin salida hasta que F13 completa tenga reabrir o cancelar.
2. **No dejar cerrar.** La API responde 409 `INSCRIPTOS_INSUFICIENTES` y la pantalla dice cuántos hacen falta y que se puede bajar la cantidad de zonas.
   - En contra: la organización no puede cerrar "por las dudas" y resolverlo después; tiene que resolverlo antes.

## Decisión

Opción 2, con el mismo chequeo que el sorteo: `alcanzanParaLasZonas` (`apps/api/src/modules/competencia/sorteo.ts`).

- La API manda `alcanzanParaLasZonas` junto con las inscripciones. La pantalla deshabilita "Cerrar inscripciones" y explica por qué antes de que lo toquen: *"Para armar 6 zonas hacen falta al menos 18 inscriptos que hayan pagado, y hay 10"*, con un enlace al torneo para bajar la cantidad de zonas.
- La API lo vuelve a verificar al cerrar.

## Por qué

- **Mientras la inscripción está abierta, la salida existe:** esperar a que paguen más o bajar la cantidad de zonas editando el torneo. Una vez cerrada, no.
- **Es la misma regla del sorteo, aplicada antes.** No hay una regla nueva para explicar.

## Qué se resigna

- **No cubre las bajas posteriores al cierre.** Cuando F13 completa permita dar de baja con la inscripción cerrada, una baja puede dejar a la categoría por debajo del mínimo. La salida que propone la decisión 015, editar `cantidadGrupos` antes del sorteo, sigue pendiente.
- **En una convocatoria de varias categorías, bajar la cantidad de zonas la cambia para todas**, porque el formato es uno solo ([decisión 003](003-torneo-con-varias-categorias.md)). Y si otra categoría ya cerró, la convocatoria ya no se edita: a la que no alcanza solo le queda esperar a que paguen más.
