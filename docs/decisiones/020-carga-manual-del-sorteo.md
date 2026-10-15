# 020 — El sorteo presencial se carga arrastrando a cada jugador a su zona

**Estado:** aceptada — 15 de octubre de 2026

## Contexto

Se implementan los tres modos de sorteo: automático, en pantalla y manual. El grupo lo decidió así porque el sorteo como ceremonia es un caso general y no una rareza de POLENTA ([02-dominio.md](../02-dominio.md) §4.2). Esto cierra la decisión abierta 6.

En el modo `manual` el sorteo se hace en persona: POLENTA lo hace con bombos, lo graba y lo comparte en el grupo. Después la organización carga en el sistema en qué zona quedó cada jugador. Con el cupo lleno son 32 jugadores en 8 zonas.

## Opciones consideradas

1. **Una lista de inscriptos con un selector de zona en cada fila.**
   - En contra: no se ve cómo van quedando las zonas mientras se carga, salvo con una vista aparte.
2. **Arrastrar a cada jugador hasta su zona.**
   - En contra: suma una dependencia, y el uso con teclado y con lector de pantalla hay que resolverlo.
3. **Partir del sorteo automático y mover jugadores entre zonas.**
   - En contra: un sorteo físico no se parece al automático, así que la carga se vuelve una cadena de intercambios. Además mezcla cargar un sorteo con retocar uno automático, que es otra funcionalidad.

Para arrastrar se evaluaron tres caminos: **@dnd-kit**, la **API nativa** de drag & drop del navegador y **pragmatic-drag-and-drop**. La API nativa no funciona en pantallas táctiles ni trae soporte de teclado. pragmatic-drag-and-drop deja la accesibilidad a cargo nuestro y se usa menos en React.

## Decisión

Opción 2, con `@dnd-kit/core`. La pantalla *Sorteo de zonas* muestra arriba a los jugadores que todavía no tienen zona y abajo las zonas, cada una con sus lugares libres. Un jugador se arrastra a una zona, de una zona a otra o de vuelta a la lista. Una zona completa no recibe más.

- **Teclado:** con espacio se levanta al jugador, con cada flecha salta a la zona más cercana en esa dirección y con espacio se suelta. Los anuncios para lectores de pantalla están en español.
- **La API valida lo que se carga** (`POST /torneos/:id/sorteo/manual`, `armarZonasManuales()`): tienen que estar todos los inscriptos que pagaron, cada uno una sola vez, en las zonas del formato y con los tamaños que daría el sorteo, es decir, todas iguales o algunas con uno menos ([decisión 015](015-zonas-con-menos-inscriptos.md)).
- **La posición de siembra la calcula la API** con el ranking, igual que en el sorteo automático. No la manda quien carga.
- **Lo cargado se guarda como borrador y se confirma con el mismo paso que el automático** ([decisión 014](014-borrador-del-sorteo.md)). "Confirmar y publicar" guarda las zonas y enseguida las confirma.

## Por qué

- **Es la forma más parecida al sorteo real:** sale una bolilla y el jugador va a su zona. Mientras se carga se ven las zonas armadas y se puede comparar contra el video.
- **@dnd-kit trae teclado y lector de pantalla.** Sin esto, el modo manual quedaría solo para quien usa mouse.
- **La misma librería resuelve la siembra a mano de los torneos sin ranking**, que también se ordena arrastrando.
- **La confirmación no cambia:** el modo manual es otra forma de llenar el mismo borrador.

## Qué se resigna

- **Una dependencia nueva** en la web.
- **Lo que se va cargando vive en el navegador hasta confirmar.** Si se recarga la página a mitad de la carga, se pierde. Guardar en la base cada jugador que se mueve obligaría a manejar un borrador a medio armar, que hoy se trata como inválido.
- **Con 32 jugadores son 32 arrastres.** Es lo mismo que sacar 32 bolillas.
