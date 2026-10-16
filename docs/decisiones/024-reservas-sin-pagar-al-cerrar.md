# 024 — Al cerrar la inscripción, las reservas sin pagar no se tocan

**Estado:** aceptada — 15 de octubre de 2026

## Contexto

Al sorteo de zonas (F05) se llega desde la pantalla Inscripciones (F13): "Cerrar inscripciones" deja la categoría lista para sortear. F13 completa es de la entrega del 75%; por ahora va una versión mínima, que solo muestra los inscriptos y cierra.

En el momento de cerrar puede haber **reservas**: inscripciones en `PENDIENTE_PAGO`, que ocupan un lugar del cupo mientras corre el plazo para pagar (15 minutos por defecto, `minutosReservaCupo`). El sorteo toma solo las inscripciones `PAGADA`. Hay que decidir qué pasa con esas reservas al cerrar.

El reglamento de POLENTA dice que si al cerrar hay jugadores que no pagaron, se los consulta para que lo hagan en un plazo prudencial, y si no cumplen, pasa la lista de espera ([02-dominio.md](../02-dominio.md) §11.1).

## Opciones consideradas

1. **No dejar cerrar mientras haya reservas vigentes.**
   - En contra: la organización espera hasta 15 minutos frente a la pantalla, y cada reserva nueva vuelve a trabar el cierre.
2. **Vencerlas al cerrar** (pasan a `EXPIRADA`).
   - En contra: es una regla que el reglamento no dice. Al contrario, POLENTA les da un plazo para pagar. Quien estaba pagando justo en ese momento pierde el lugar sin aviso.
3. **No tocarlas.** Quedan como están, no entran al sorteo y se resuelven cuando exista F13 completa.

## Decisión

Opción 3. `POST /api/organizaciones/:slug/torneos/:id/inscripciones/cerrar` solo cambia el estado del torneo, de `PUBLICADO` a `INSCRIPCIONES_CERRADAS`, con el estado como condición para que dos cierres simultáneos no pisen nada. Las inscripciones no se modifican.

La pantalla lo dice antes de cerrar: *"Las 2 reservas sin pagar no entran al sorteo."*

## Por qué

- **No inventa una regla.** El reglamento les da un plazo; vencerlas al cerrar se lo quitaría.
- **No hay que esperar.** Se cierra cuando la organización decide, por ejemplo apenas se llena el cupo.
- **El sorteo no cambia.** Ya toma solo las pagadas, así que una reserva no entra ni rompe el borrador ([decisión 014](014-borrador-del-sorteo.md)).

## Qué se resigna

- **Una reserva puede quedar colgada después del cierre**, ocupando un lugar en la barra de Inscripciones, hasta que F13 completa la resuelva: vencerla, inscribir a mano o pasar al siguiente de la lista de espera.
- **Un pago que llega después del cierre queda sin regla.** Cuando exista el pago (F12), si una reserva se paga con la inscripción cerrada, entra al sorteo si todavía no se confirmó, porque el sorteo toma las pagadas de ese momento; si ya se confirmó, queda pagada y sin zona. F12 tiene que decidir si acepta pagos con la inscripción cerrada.
