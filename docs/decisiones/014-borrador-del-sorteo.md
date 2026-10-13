# 014 — El sorteo se guarda como borrador en la base hasta confirmarlo

**Estado:** aceptada — 13 de octubre de 2026

## Contexto

En la pantalla *Sorteo de zonas* (F05) la organización sortea, mira cómo quedarían las zonas, puede cambiar el modo de distribución o volver a sortear, y recién después confirma. Al confirmar se generan los partidos de zona y el torneo pasa a `zonas_generadas`.

El resultado no es reproducible: los empatados en puntos se ordenan al azar ([decisión 013](013-empates-en-la-siembra.md)) y los bombos son azar por definición. Si la confirmación volviera a sortear, se confirmaría otra cosa que la que se vio. Entre "sortear" y "confirmar" el resultado tiene que vivir en algún lado.

## Opciones consideradas

1. **Borrador en la base.** Sortear escribe `Inscripcion.grupo` y `Inscripcion.posicionSiembra`, con `Torneo.sorteoConfirmado` en `false`. Confirmar genera los partidos con lo guardado.
   - En contra: cada sorteo escribe una fila por inscripto. Con 32 jugadores no importa.
2. **Sin estado: la web reenvía las zonas al confirmar.** La vista previa no guarda nada; al confirmar, la web manda las zonas y la API valida que estén los mismos jugadores y que los tamaños sean coherentes.
   - En contra: recargar la página pierde el sorteo. Y la API termina aceptando un reparto armado por el cliente, que en la práctica es un modo `manual` sin decirlo.

## Decisión

Opción 1. `POST /torneos/:id/sorteo` sortea y guarda el borrador; `POST /torneos/:id/sorteo/confirmar` lo confirma. El `:id` es el de un `Torneo`, es decir, una categoría: cada categoría se sortea por separado.

- **Cambiar de modo reusa la siembra guardada.** Pasar de serpentina a directa y volver da las mismas zonas, aunque haya empates.
- **"Volver a sortear" vuelve a sembrar**, así que también vuelve a sortear el orden entre los empatados.
- **Si cambiaron los inscriptos después del último sorteo** (alguien entró sin zona, o una baja dejó una zona corta), no se puede confirmar hasta volver a sortear.
- **Los partidos vencen el último día de la fase de grupos del cronograma del torneo:** `fechaInicio + plazoGruposDias − 1`, el mismo que se mostró al crearlo. Se toma desde la fecha de inicio y no desde el día del sorteo, porque el cronograma se anuncia en la convocatoria y se cumple sin excepción ([02-dominio.md](../02-dominio.md) §8.1).

## Por qué

- **Lo que se confirma es lo que se vio**, sin confiar en lo que mande el cliente.
- **No hace falta schema nuevo:** `Inscripcion.grupo`, `Inscripcion.posicionSiembra` y `Torneo.sorteoConfirmado` ya existían para esto.
- **El borrador sobrevive a recargar la página**, y otro miembro del comité lo ve igual.
- **La confirmación se protege sola contra el doble clic:** el cambio de estado tiene como condición que el torneo siga en `inscripciones_cerradas`, así que dos confirmaciones simultáneas no generan los partidos dos veces.

## Qué se resigna

- **Una escritura por inscripto en cada sorteo.** Irrelevante a esta escala.
- **El borrador es único por torneo.** No se pueden guardar dos sorteos para compararlos: el último pisa al anterior.
- **Confirmar no se deshace.** Si hiciera falta, sería borrar los partidos de zona y volver el estado atrás, mientras no haya resultados cargados. No está implementado.
