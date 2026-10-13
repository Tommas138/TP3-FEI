# 013 — Cómo se ordenan en la siembra los jugadores que empatan en puntos

**Estado:** aceptada — 12 de octubre de 2026

## Contexto

El sorteo (F05) reparte a los jugadores en zonas según su **posición de siembra**: el orden que da el ranking vigente de la categoría ([02-dominio.md](../02-dominio.md) §4). Ese orden tiene que ser total, porque la serpentina y la distribución directa mandan a cada posición a una zona distinta.

El ranking no alcanza para ordenarlos a todos: `asignarPuestos` ([decisión 001](001-calculo-del-ranking.md)) hace que los empatados compartan puesto. Y los empates son muchos, no un caso borde: todo jugador nuevo entra con 0 puntos (02-dominio §7.5), y en un torneo sin ranking los inscriptos empatan todos. El reglamento de POLENTA no dice cómo desempatar la siembra.

## Opciones consideradas

1. **Al azar entre empatados.**
   - En contra: dos sorteos seguidos del mismo torneo pueden dar zonas distintas aunque el modo sea serpentina. Lo que se confirma tiene que ser lo que se vio, así que hay que guardar el orden que salió.
2. **Por orden de inscripción.** Entre empatados va primero quien se inscribió antes.
   - En contra: premia inscribirse temprano con una mejor siembra, algo que ningún reglamento dice.
3. **Alfabético por apellido.**
   - En contra: es arbitrario y siempre favorece a los mismos: entre los que tienen 0 puntos, los mismos apellidos quedarían mejor sembrados en todos los torneos.

## Decisión

Opción 1. `ordenarSiembra(jugadores, azar)` en `apps/api/src/modules/competencia/sorteo.ts` mezcla a los jugadores y después los ordena por puntos con un orden estable: los empatados conservan el orden de la mezcla.

La fuente de azar se recibe por parámetro, con el contrato de `Math.random`.

## Por qué

- **Es la única opción que no le da ventaja a nadie** por algo ajeno al juego. Es además lo que ya hace el sorteo por bombos de POLENTA: azar dentro de cada franja.
- **Resuelve el torneo sin ranking sin código aparte.** Con todos en 0, el orden entero sale al azar, que es la siembra "al azar" que pide F05.
- **Con el azar como parámetro, los tests son deterministas** y la lógica sigue siendo pura.
- **Guardar el orden no cuesta nada nuevo:** `Inscripcion.posicionSiembra` ya existe para eso.

## Qué se resigna

- **La serpentina deja de ser reproducible** cuando hay empates: "Volver a sortear" cambia las zonas. Quien confirme el sorteo tiene que guardar la siembra que se mostró, no recalcularla.
- **No se puede auditar el azar.** No se guarda una semilla: si un jugador pregunta por qué quedó sembrado detrás de otro con los mismos puntos, la respuesta es "se sorteó". Si hiciera falta, se puede pasar una fuente de azar con semilla sin cambiar la firma.
