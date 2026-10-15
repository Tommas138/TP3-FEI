# 021 — En el sorteo en pantalla, el servidor sortea todo y la web lo revela

**Estado:** aceptada — 15 de octubre de 2026

## Contexto

El modo `asistido` es para los circuitos que hacen el sorteo como ceremonia: se proyecta durante la reunión y todos ven salir a cada jugador ([02-dominio.md](../02-dominio.md) §4.2). Es uno de los tres modos de sorteo que se implementan ([decisión 020](020-carga-manual-del-sorteo.md)).

Hay que decidir dónde ocurre el azar: si el sorteo se hace de una vez y la pantalla lo muestra de a poco, o si cada jugador se sortea en el momento en que sale.

## Opciones consideradas

1. **El servidor sortea todo de una vez, igual que en el automático, y la web lo revela de a un jugador.**
   - En contra: el resultado existe antes de que empiece la animación. Quien recargue la página a mitad de la ceremonia ve todo.
2. **El servidor sortea de a un jugador**: cada "sacar bolilla" es un pedido a la API, que asigna a uno.
   - En contra: hace falta un borrador a medio armar, que hoy se trata como inválido, más endpoints, y cuidar los reintentos y el doble clic. Cuesta varias veces más.

## Decisión

Opción 1, con "Volver a sortear" dentro de la misma vista.

- **Sortear en pantalla hace un sorteo nuevo, siembra incluida** (`POST /torneos/:id/sorteo` con `modoSorteo: 'asistido'` y `nuevaSiembra: true`). Lo que sale en pantalla no lo vio nadie antes. Se guarda como borrador con `modoSorteo = ASISTIDO` ([decisión 014](014-borrador-del-sorteo.md)).
- **Mientras no se sorteó en pantalla, la página no muestra zonas.** El sorteo automático que se hace al abrir la página queda oculto en este modo.
- **La vista ocupa la pantalla completa** si el navegador lo permite y, si no, tapa la página. Los jugadores salen en orden de siembra, de a uno cada un segundo y medio: primero los cabezas de serie, después el segundo bombo y así. Se puede pausar o mostrar todo de una vez.
- **Al terminar**: "Volver a sortear" hace otro sorteo y lo revela desde el principio; "Listo" vuelve a la página, donde se revisa y se confirma como siempre.
- **Salir de la pantalla completa no corta la ceremonia.** La vista se cierra con "Cerrar" o con Escape.

## Por qué

- **El azar es igual de justo.** Nadie ve el servidor: para quien mira la proyección, el resultado sale cuando sale.
- **No hay lógica nueva en la API:** es el sorteo de siempre, guardado con otro modo. La ceremonia es toda de la web.
- **Volver a sortear funciona igual que en el automático.** Si algo sale mal en la reunión, se repite sin otra regla.

## Qué se resigna

- **El resultado existe antes de mostrarse.** Si alguien abre la página en otra pestaña durante la ceremonia, lo ve antes de que salga.
- **No se puede retomar una ceremonia a la mitad.** Si se cierra la vista, al volver se ven todas las zonas.
- **Se puede repetir hasta que salga algo que guste.** Pasa lo mismo con el automático; el control es que la ceremonia es pública.
