# 029 — La fase de grupos arranca en la fecha de inicio del torneo

**Estado:** aceptada — 16 de octubre de 2026

## Contexto

El ciclo de vida del torneo tiene `zonas_generadas` y después `grupos_en_curso`, que según [03-flujo-organizacion.md](../03-flujo-organizacion.md) §2 empieza cuando "arranca el plazo de 3 semanas". Confirmar el sorteo deja el torneo en `zonas_generadas`, pero nada lo pasaba a `grupos_en_curso`.

La fecha de inicio ya existe: es obligatoria para publicar la convocatoria, no se puede cambiar después de cerrar la inscripción, y el sorteo la usa para la fecha límite de los partidos de zona. Lo que falta es quién cambia el estado ese día. Hoy ninguna acción depende de él: los resultados se cargan y las zonas se cierran en los dos estados.

## Opciones consideradas

1. **Al confirmar el sorteo.**
   - En contra: `zonas_generadas` deja de usarse o hay que redefinirlo, y el plazo real empieza en la fecha de inicio, no al confirmar.
2. **Con el primer resultado de zona**, en la misma transacción.
   - En contra: el estado depende de la carga y no del calendario: si el primer resultado se carga a la semana, durante esa semana el torneo figura como no empezado.
3. **Al llegar la fecha de inicio**, con una tarea periódica de la API.
   - En contra: es el primer proceso en segundo plano del proyecto, y el estado puede atrasarse hasta una hora.
4. **Al llegar la fecha de inicio, calculado en cada consulta.**
   - En contra: el estado guardado y el que se muestra no coinciden, y cada consulta que filtra por estado tiene que conocer la regla.

## Decisión

Opción 3.

- `programarInicioDeGrupos()`, en `apps/api/src/modules/competencia/inicio-de-grupos.ts`, se ejecuta al arrancar la API y después cada hora. Pasa a `grupos_en_curso` todo torneo en `zonas_generadas` cuya fecha de inicio sea hoy o antes, en día de Argentina.
- Si el sorteo se confirma ese día o después, `confirmarSorteo()` lo deja directamente en `grupos_en_curso`.
- Un partido que los jugadores adelantan se puede cargar antes de la fecha, con el torneo todavía en `zonas_generadas`.

## Por qué

- **Es lo que dice 03 §2:** "en curso" quiere decir que arrancó el plazo, y el plazo de los partidos de zona ya se cuenta desde esa fecha.
- **El estado guardado es el real:** las consultas que filtran por estado no necesitan conocer la regla.
- **No necesita infraestructura nueva:** es un temporizador dentro de la misma API. Si la API estuvo apagada, la primera revisión pone todo al día.

## Qué se resigna

- **Hasta una hora de atraso** después de la medianoche del día de inicio.
- **Un temporizador dentro de la API.** Si algún día corren varias instancias, la actualización es idempotente, pero cada una la repite.
