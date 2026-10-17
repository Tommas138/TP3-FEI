# Plataforma de gestión de torneos de tenis

**Trabajo Final — Tecnicatura Universitaria en Desarrollo Web, UNCo FaI**
Grupo de 3 · Entrega: fines de noviembre de 2026

Los circuitos amateur de tenis se organizan con Excel y WhatsApp: el ranking en una planilla que actualiza una persona, los cuadros y los resultados perdidos entre mensajes, las inscripciones cobradas por transferencia y verificadas a mano. SetPoint es una plataforma multi-organización para que cualquier circuito organice sus torneos y su ranking sin eso.

**Caso de validación:** POLENTA Team Tenis, un circuito real de Neuquén con 77 jugadores en 2 categorías. Sus reglas y sus datos prueban que el sistema resuelve un caso real; lo que varía entre circuitos se configura ([07-configurabilidad.md](07-configurabilidad.md)).

**Versión de la documentación:** 2.1 — octubre de 2026
**Cambio principal de la v2.1:** cambios a partir de la devolución de la verificación del 25% ([devolucion-25.md](devolucion-25.md)): encuadre general en lugar de centrado en POLENTA, resumen de una página, importación automática por excepción, "torneo del calendario" en la interfaz, y detección del calendario y las categorías en la importación.
**v2.0** (25 de agosto de 2026): incorporación del reglamento y datos reales de POLENTA. Se corrigen el modelo de ranking, el formato de torneo (aparece el cuadro consuelo, que POLENTA llama "Complementaria") y la cascada de desempates.

---

## Índice

| Documento | Contenido |
|---|---|
| [00-resumen.md](00-resumen.md) | **Empezar acá.** El proyecto en dos minutos: problema, usuarios, flujos, arquitectura e IA |
| [devolucion-25.md](devolucion-25.md) | Devolución de la verificación del 25%: qué dijo el profesor y qué cambia |
| [01-vision.md](01-vision.md) | Pitch, problema que resuelve, relevamiento de competencia |
| [02-dominio.md](02-dominio.md) | **Reglas del caso de validación (POLENTA).** Formato, sistema de juego, desempates, ranking, plazos. Glosario código ↔ interfaz |
| [03-flujo-organizacion.md](03-flujo-organizacion.md) | Qué hace la organización desde la web |
| [04-flujo-jugador.md](04-flujo-jugador.md) | Qué hace el jugador desde la app |
| [05-pagos.md](05-pagos.md) | Integración con MercadoPago |
| [06-ia.md](06-ia.md) | Las tres funcionalidades de IA |
| [07-configurabilidad.md](07-configurabilidad.md) | Qué se parametriza por organización y qué queda fijo |
| [08-repositorio.md](08-repositorio.md) | Estructura de carpetas, ramas, tags de entrega y forma de trabajo |
| [09-setup-inicial.md](09-setup-inicial.md) | Guía paso a paso para inicializar el proyecto |
| [10-features.md](10-features.md) | **Lista de funcionalidades para la 2da entrega** |
| [decisiones/](decisiones/) | Decisiones de arquitectura, una por archivo: contexto, opciones, por qué y qué se resigna |
| [design.md](design.md) | Sistema visual: color, tipografía, componentes y voz |
| [schema.sql](schema.sql) | Modelo de datos en SQL, para la entrega de diseño de base de datos. La fuente real es `apps/api/prisma/schema.prisma` |

> **02-dominio.md documenta el caso POLENTA**, que es el cliente de validación. **07-configurabilidad.md** define qué de eso se parametriza para otras organizaciones y qué queda fijo. Leer los dos juntos.

> **02-dominio.md es la fuente de autoridad sobre el dominio.** Sus reglas salen del reglamento escrito de POLENTA y de las respuestas del organizador, no de supuestos nuestros. Ante cualquier contradicción con el resto de los documentos, manda ese.

---

## Stack

TypeScript · React (web) · React Native + Expo (móvil) · Express + Prisma (API) · PostgreSQL / Neon · MercadoPago · Docker

Monorepo con workspaces: `apps/api`, `apps/web`, `apps/mobile`, `packages/shared`.

---

## Caso de validación

**POLENTA Team Tenis**, circuito amateur sin fines de lucro organizado por un grupo de jugadores independientes. Es el cliente real con el que se valida el sistema, no el único al que apunta: la demo incluye una segunda organización ficticia con otra configuración ([devolucion-25.md](devolucion-25.md), cambio A4). Datos actuales:

| | |
|---|---|
| Jugadores | 77 |
| Categorías | Segunda y Tercera |
| Torneos por año | 4 estacionales + Master |
| Inscripción | $45.000 ARS |
| Coordinación actual | Grupo de WhatsApp |
| Ranking actual | Planilla Excel manual |
| Cobro actual | Transferencia + envío de comprobante |

---

## Decisiones abiertas

| # | Decisión | Bloquea | Estado |
|---|---|---|---|
| 1 | ¿Qué `modo_sorteo` usa POLENTA: automático, asistido o manual? (ver [07](07-configurabilidad.md) §2.1) | Nada: se implementan los tres. Solo define cuál le mostramos en la demo | Consultar |
| 2 | ¿Desde qué instancia paga las canchas la organización? El reglamento dice "fases de Campeonato y Complementaria", la respuesta 9 dice cuartos y la 23 dice octavos | Modelo de sedes | Consultar |
| 3 | El ranking del PDF tiene 5 casilleros (incluye "Pretemporada"), pero la respuesta 15 menciona 4 torneos + Master. ¿Pretemporada **es** el Master? | Modelo de ranking | Consultar |
| 4 | ¿Se implementa el cuadro consuelo (la "Complementaria" de POLENTA) completo, o se recorta el alcance para llegar a noviembre? | Alcance del proyecto | **Decidir en grupo** |
| 5 | ¿El resultado lo carga la organización a mano, o se extrae del mensaje de WhatsApp con IA? Desde la devolución del 25%, F19 es la candidata a "IA en el uso diario", condicionada al tiempo ([devolucion-25.md](devolucion-25.md), cambio I) | Alcance de [06](06-ia.md) | **Preguntar al profesor**, después decidir en grupo |
| 7 | **Cambio de categoría:** si un jugador de Tercera pasa a Segunda, ¿qué pasa con sus puntos de Tercera? ¿Se transfieren, quedan congelados, o el jugador desaparece de esa tabla? | Modelo de ranking | Consultar |
| 8 | ¿DNI o email como identificador en el flujo de inscripción por link? (ver [04](04-flujo-jugador.md) §5.8) | Flujo de inscripción | **Decidir en grupo** |
| 10 | ¿Se implementan las **proyecciones pre-torneo** sugeridas por la cátedra? ("si llegás a semis sumás 50 y pasás al puesto 4") | Alcance | **Decidir en grupo** |
| 11 | **Política de devolución:** ¿POLENTA devuelve el dinero si alguien se baja después de pagar? ¿Cambia si ya se hizo el sorteo? | Estados de inscripción | Consultar |
| 12 | ¿Los jugadores pueden cargar resultados con confirmación del rival, o la carga es exclusiva de la organización? Está parametrizado como `quien_carga_resultados` | Permisos | **Decidir en grupo** |
| 13 | **Dónde guarda la web el token de sesión.** Hoy va en `localStorage` (`apps/web/src/features/auth/sesion.ts`): es lo más simple y alcanza para el TP, pero un script inyectado por XSS podría leerlo. La alternativa es una cookie `httpOnly`, que JavaScript no puede leer, pero obliga a configurar CORS con credenciales y protección CSRF, y no sirve para la app móvil, que guardará el token en el almacenamiento seguro del dispositivo | Nada por ahora | Revisar antes de un deploy público |
| 14 | **¿"Todo automático" se refiere a la importación o al uso diario?** La importación por excepción responde lo primero; F19, lo segundo. Ver las preguntas de [devolucion-25.md](devolucion-25.md) §4 | Prioridad de F19 | **Preguntar al profesor** |
| 15 | **Casos sin nombre cerrado para "edición".** "Edición" es un `Torneo` de un torneo del calendario. ¿Un torneo suelto (sin etapa) se muestra como "torneo"? ¿Y cómo se llama la convocatoria que crea varias ediciones a la vez ("Primavera 26", Segunda y Tercera), que en código es el campo `Torneo.edicion`? ([decisión 010](decisiones/010-torneo-del-calendario-en-la-interfaz.md)) | Textos de *Nuevo torneo* | **Decidir en grupo** |
| 16 | **¿"Campeonato" también pasa a genérico** ("cuadro principal", configurable), como el cuadro consuelo? ([devolucion-25.md](devolucion-25.md) §3.1) | Textos de la interfaz | **Decidir en grupo** |

> **El schema ya no está bloqueado.** Ninguna de las decisiones abiertas cambia las tablas: son valores de configuración, datos del seed o lógica de negocio.

### Resueltas

- ~~¿Distribución directa o serpentina?~~ **Serpentina**, configurable
- ~~¿Cuántos clasifican por grupo?~~ **Dos a Campeonato, dos a Complementaria**
- ~~¿El cuadro final es eliminación simple?~~ **Sí**, ambos cuadros
- ~~¿Se soporta dobles?~~ **No.** Solo single
- ~~¿Quién carga los resultados?~~ **La organización**
- ~~Tabla de puntos~~ **100 / 75 / 50 / 25 / 15 / 10**
- ~~Ventana del ranking~~ **12 meses, por reemplazo de casillero**
- ~~Cómputo de W.O.~~ **6-0 6-0 a favor del rival**
- ~~¿Un torneo es multisede?~~ **Sí en fase de grupos** (cada partido donde quieran), sede única en eliminatorias
- ~~¿El padrón tiene teléfono?~~ Irrelevante en POLENTA: usa `modo_inscripcion: cerrada`, sin registro abierto
- ~~¿Puede alguien de afuera inscribirse a un torneo de POLENTA?~~ **No**, porque POLENTA usa `modo_inscripcion: cerrada`. Pero la plataforma soporta torneos abiertos y con aprobación para otros circuitos
- ~~¿Inscribirse suma puntos al ranking?~~ **No.** Los puntos los da la instancia alcanzada al cerrar el torneo
- ~~¿Cómo aparece un jugador nuevo en el ranking?~~ Entra al padrón con 0 puntos y sube al jugar. No hay un acto de "agregarse al ranking"
- ~~Tabla de puntos: ¿fija o configurable?~~ **Configurable por organización** ([07](07-configurabilidad.md) §1)
- ~~¿La foto del partido es obligatoria?~~ **No.** Es regla interna de POLENTA. El sistema permite adjuntar fotos, opcionalmente
- ~~¿El modelo de ranking por casilleros es una particularidad de POLENTA?~~ **No.** Es el modelo de la ATP: ventana rodante con reemplazo al volver el torneo
- ~~¿La app negocia la fecha o solo la registra?~~ **La registra.** Los jugadores siguen coordinando por WhatsApp; cualquiera de los dos anota la fecha y el rival confirma con un toque. La confirmación se modela en el schema desde el inicio ([04](04-flujo-jugador.md) §6)
- ~~¿Cómo interpreta la IA la planilla del padrón: mapeo de columnas o extracción completa?~~ **Extracción completa, auditada contra la planilla** antes de mostrarla y confirmada por la organización ([decisión 009](decisiones/009-importacion-extraccion-completa-con-ia.md)). El mapeo se rompía con cada variante de planilla; la auditoría cubre el riesgo de que el modelo invente un número
- ~~¿La importación pide confirmar cada fila?~~ **No: automática por excepción.** Se importa solo lo que pasa todos los controles con coincidencia segura; la organización revisa lo que falló o es dudoso ([devolucion-25.md](devolucion-25.md), cambio C). La revisión fila por fila daba la impresión de que la IA hacía poco y desperdiciaba la auditoría
- ~~¿Cómo se llama "Etapa" en la interfaz?~~ **"Torneo del calendario"**, y `Torneo` se muestra como "Edición". En código no se renombra nada ([decisión 010](decisiones/010-torneo-del-calendario-en-la-interfaz.md)). "Etapa" no se entendía fuera de POLENTA
- ~~¿Hay que configurar el calendario antes de importar?~~ **No.** La importación detecta los torneos del calendario y las categorías en la planilla y los crea al confirmar ([decisión 011](decisiones/011-la-importacion-detecta-el-calendario.md)). Una organización con datos previos queda configurada con solo subir su archivo
- ~~¿Se importan varios archivos u hojas a la vez?~~ **Sí, uno o varios por categoría**, hasta 10 archivos. Un archivo por torneo del calendario no se soporta en esta versión ([decisión 012](decisiones/012-importacion-de-varios-archivos-y-hojas.md))
- ~~¿Cómo se siembra a los jugadores que empatan en puntos?~~ **Al azar entre los empatados** ([decisión 013](decisiones/013-empates-en-la-siembra.md)). Es lo único que no le da ventaja a nadie por algo ajeno al juego, y resuelve la siembra de los torneos sin ranking
- ~~¿Dónde vive el sorteo entre "volver a sortear" y confirmar?~~ **Como borrador en la base**, en `Inscripcion.grupo` y `posicionSiembra` ([decisión 014](decisiones/014-borrador-del-sorteo.md)). Lo que se confirma es lo que se vio, sin confiar en lo que mande el cliente, y sobrevive a recargar la página
- ~~¿Cuántas zonas se arman si no se llena el cupo?~~ **Las del formato, con zonas de 3 si hace falta y nunca menos** ([decisión 015](decisiones/015-zonas-con-menos-inscriptos.md)). Cambiar la cantidad de zonas alteraría el formato publicado y los cuadros
- ~~¿Se implementan los tres modos de sorteo o solo `manual` + `automatico`?~~ **Los tres.** El sorteo como ceremonia es un caso general (02-dominio §4.2): un circuito sortea en persona y carga el resultado, otro lo proyecta en la reunión. Los tres llenan el mismo borrador y se confirman igual, así que cada modo nuevo es solo otra forma de armar las zonas. El manual se carga arrastrando a cada jugador a su zona ([decisión 020](decisiones/020-carga-manual-del-sorteo.md))
- ~~En el sorteo en pantalla, ¿se sortea de una vez o de a un jugador?~~ **De una vez, en el servidor, y la web lo revela de a un jugador** ([decisión 021](decisiones/021-sorteo-en-pantalla.md)). Para quien mira la proyección el azar es igual de justo, y no hace falta lógica nueva en la API
- ~~¿El W.O. guarda sets 6-0 6-0 en la base?~~ **No: se arman al calcular**, a partir del estado y el ganador ([decisión 016](decisiones/016-walkover-sin-sets-guardados.md)). Así la base no registra como jugado un partido que no se jugó
- ~~¿Qué pasa si el enfrentamiento directo no desempata?~~ **Define el ranking al inicio del torneo**, que es la posición de siembra ([decisión 017](decisiones/017-empates-que-el-enfrentamiento-directo-no-resuelve.md)). El enfrentamiento directo solo vale entre dos; con tres o más empatados, o si todavía no jugaron entre ellos, se usa el criterio que el reglamento ya tiene para el último desempate
- ~~¿Cómo se compara entre zonas de 3 y de 4?~~ **Se descarta el partido contra el último de cada zona de 4** ([decisión 018](decisiones/018-comparar-zonas-de-distinto-tamano.md)). Así todos comparan la misma cantidad de partidos; es lo que hacen la FIFA y la UEFA con grupos desiguales
- ~~¿Las posiciones de las zonas son públicas?~~ **Por ahora solo para quien administra; la consulta pública y Mi zona tendrán su propia ruta sobre el mismo cálculo** ([decisión 019](decisiones/019-acceso-a-las-posiciones.md)). Cada ruta se abre con la pantalla que la usa y el permiso que esa pantalla necesita
- ~~¿Dónde va cada clasificado en el cuadro?~~ **Por una siembra única de clasificados**: los ganadores de zona primero, ordenados entre zonas con la cascada, y los compañeros de zona en mitades opuestas ([decisión 022](decisiones/022-ubicacion-en-el-cuadro.md)). Sirve para cualquier formato, con o sin byes, sin un patrón distinto para cada cantidad de zonas
- ~~¿Un bye es un partido?~~ **No: quien tiene bye entra directo en la segunda ronda** ([decisión 023](decisiones/023-byes-sin-partido.md)). Así la base solo tiene partidos que se juegan, como con el W.O.
- ~~¿Qué pasa con las reservas sin pagar al cerrar la inscripción?~~ **No se tocan: no entran al sorteo y se resuelven con F13 completa** ([decisión 024](decisiones/024-reservas-sin-pagar-al-cerrar.md)). No dejar cerrar con reservas vigentes hacía esperar hasta 15 minutos, y vencerlas al cerrar es una regla que el reglamento no dice: les da un plazo para pagar
- ~~¿Se puede cerrar la inscripción si los que pagaron no alcanzan para las zonas?~~ **No** ([decisión 025](decisiones/025-no-se-cierra-sin-inscriptos-para-las-zonas.md)). Cerrada, el formato ya no se edita y la categoría quedaría sin poder sortearse; abierta, todavía se puede bajar la cantidad de zonas
- ~~¿Cuándo se arman los cuadros?~~ **Cuando la organización cierra las zonas**, con todos los partidos resueltos ([decisión 026](decisiones/026-cierre-de-zonas.md)). Un cierre automático no se dispararía nunca con un partido vencido, que según el reglamento lo resuelve el Comité
- ~~¿El inicio muestra una tarjeta por convocatoria o por categoría?~~ **Por categoría, desde que se publica** ([decisión 026](decisiones/026-una-tarjeta-por-categoria-en-el-inicio.md)). Cada categoría cierra la inscripción y se sortea por separado, así que puede estar en un momento distinto que las demás. Los borradores siguen por convocatoria
- ~~¿Qué fecha llevan los puntos importados de la planilla?~~ **El 1° de enero del año del casillero** ([decisión 008](decisiones/008-fecha-de-los-movimientos-importados.md)). La planilla no tiene fechas y el ranking solo necesita que un torneo real de esa etapa y ese año le gane al importado
- ~~¿Cómo se registra un abandono?~~ **Se guarda lo que se jugó y se computa 6-0 6-0, como un W.O.** ([decisión 027](decisiones/027-abandono.md)). La base registra el partido que de verdad empezó, y para los desempates abandonar vale lo mismo que dar W.O., como pide F06
- ~~¿Qué pasa al corregir un resultado que ya tuvo efecto?~~ **Se corrige si no cambia lo que ya se armó con él** ([decisión 028](decisiones/028-correccion-de-resultados.md)). En un cuadro, si el ganador es el mismo o el partido siguiente no se jugó; con las zonas cerradas, si la siembra de los cuadros queda igual. Así nunca se borra un partido que se jugó, y se pueden arreglar los errores de tipeo, que casi nunca cambian quién gana
- ~~¿Cuándo pasa el torneo a grupos en curso?~~ **Al llegar la fecha de inicio**, con una tarea de la API que revisa cada hora ([decisión 029](decisiones/029-grupos-en-curso.md)). Es cuando arranca el plazo de la fase de grupos, y así el estado guardado es el real sin calcularlo en cada consulta
- ~~¿Son obligatorios los puntos del tie-break?~~ **No: si vienen se validan** ([decisión 030](decisiones/030-puntos-del-tie-break-opcionales.md)). No cambian ninguna tabla, en los mensajes del grupo muchas veces no vienen, y un circuito con tie-break con diferencia de 2 puede cargar su resultado igual
- ~~¿Por dónde se entra a cargar un resultado, si el tablero todavía no existe?~~ **Desde el Sorteo de zonas confirmado, y el partido se elige dentro de la pantalla** ([decisión 031](decisiones/031-como-se-llega-a-cargar-resultado.md)). Se llega en la demo con un clic, los partidos de cuadro también tienen entrada, y la lista se reemplaza cuando llegue el tablero (F15) sin tocar otra pantalla
- ~~¿Cómo dice la pantalla qué pasa antes de guardar un resultado?~~ **La API simula el resultado sin guardarlo y devuelve la tabla de la zona** ([decisión 032](decisiones/032-vista-previa-del-resultado.md)). La vista previa sale de la misma cuenta que la tabla real y la cascada no se mueve de la API; en un cuadro alcanza con la ronda y la arma la web
- ~~¿Dónde se consulta el ranking sin cuenta?~~ **En una página pública de la web, `/c/:slug/ranking`, sobre `GET /api/publico/:slug/ranking`** ([decisión 033](decisiones/033-ranking-publico.md)). F09 pide un enlace que se abra sin instalar nada, y la app todavía no existe; todo lo que no pide login va bajo `/api/publico`. Si la organización no lleva ranking, el enlace lo dice y no muestra tabla

---

## Preguntas pendientes para el organizador

Lista para llevar a la próxima charla. Las respondidas se tachan.

### Ranking y categorías

1. **Cambio de categoría:** si un jugador de Tercera pasa a Segunda, ¿qué pasa con sus puntos de Tercera? ¿Quedan congelados, siguen envejeciendo por reemplazo de casillero, o el jugador sale de esa tabla?
   *Contexto: el reglamento dice que cada categoría tiene ranking independiente y que se acumulan puntos solo en la categoría que se juega, pero no aclara qué pasa con los puntos previos.*
2. ¿Es común que alguien cambie de categoría a mitad de año?
3. El ranking del PDF tiene 5 casilleros e incluye "Pretemporada", pero mencionaste 4 torneos + Master. ¿Pretemporada **es** el Master?

### Inscripción y padrón

4. ¿Alguna vez alguien de afuera del grupo quiso anotarse a un torneo? ¿Cómo lo manejaron?
5. **Pedir el Excel del ranking** en su formato original, no el PDF. Ya no bloquea la importación (F03 funciona con columnas en otro orden, totales, notas y nombres escritos distinto), pero hace falta para sumar al eval un caso real ([06](06-ia.md) §1).
6. ¿Estarías dispuesto a cargar el DNI de los jugadores en el padrón, o preferís que el sistema no lo pida?

### Pagos y devoluciones

7. ¿Devuelven el dinero si alguien se baja después de pagar? ¿Cambia la respuesta si ya se hizo el sorteo? ¿Alguna vez pasó?

### Canchas

8. ¿De qué superficie son las canchas de los clubes donde juegan? Polvo de ladrillo, cemento, sintético, carpeta.
   *Contexto: la cátedra sugirió head-to-head por superficie ("mejor en tierra roja"). Es un campo en `Cancha` y sale casi gratis, pero hace falta el dato.*

### Organización del torneo

9. ¿Qué modo de sorteo prefieren: que el sistema sortee solo, que sortee en pantalla durante la reunión, o cargar a mano el resultado del sorteo físico?
10. ¿Desde qué instancia paga las canchas la organización? El reglamento dice "fases de Campeonato y Complementaria", pero mencionaste cuartos en una respuesta y octavos en otra.

### Desempates

12. Si **tres jugadores** terminan la zona empatados en partidos, sets y games, ¿cómo lo resuelven? ¿Y pasó alguna vez?
    *Contexto: el reglamento habla del "ganador del partido entre ambos", que solo sirve entre dos. Hoy el sistema pone primero al mejor rankeado al inicio del torneo ([decisión 017](decisiones/017-empates-que-el-enfrentamiento-directo-no-resuelve.md)).*
13. Si no se llena el cupo y quedan zonas de 3 y de 4, ¿cómo comparan a los de distintas zonas, por ejemplo para elegir un mejor tercero?
    *Contexto: en una zona de 4 se juega un partido más. Hoy el sistema descarta el partido contra el último de cada zona de 4 ([decisión 018](decisiones/018-comparar-zonas-de-distinto-tamano.md)).*
14. ¿Cómo arman hoy los cruces de la primera ronda de Campeonato y Complementaria? ¿Hay un patrón fijo (1° de A contra 2° de B), se sortea, o lo decide el Comité?
    *Contexto: el reglamento no lo dice. Hoy el sistema siembra a todos los clasificados (ganadores de zona primero) y separa a los de una misma zona hasta la final ([decisión 022](decisiones/022-ubicacion-en-el-cuadro.md)).*
15. Si un jugador **abandona** un partido empezado (por ejemplo, 6-3 2-1 y se lesiona), ¿cómo lo computan en la tabla de la zona? ¿Como un W.O., o le cuentan los games que llegó a ganar?
    *Contexto: el reglamento solo habla del W.O. Hoy el sistema guarda el marcador hasta el abandono y lo computa 6-0 6-0, igual que un W.O. ([decisión 027](decisiones/027-abandono.md)).*

### Resultados

11. **Pedir capturas reales del grupo de WhatsApp** donde llegan los resultados (con los datos personales difuminados). Define qué tendría que entender el modelo de IA.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| **78 partidos por torneo y dos cuadros paralelos.** El motor de competencia es más grande de lo estimado | Priorizar el cuadro principal; el cuadro consuelo como incremento posterior (decisión abierta 4). Es parámetro del torneo, no supuesto fijo |
| **Los cambios de la devolución del 25% compiten por tiempo** con el motor de competencia y la app móvil | Se ordenan por costo: textos de la interfaz y seed primero; importación por excepción y detección del calendario después; varios formatos (PDF, texto, imágenes) y F19 solo si sobra tiempo ([devolucion-25.md](devolucion-25.md)) |
| **Sobregeneralizar la configurabilidad** y no llegar a noviembre | [07](07-configurabilidad.md) fija el límite: solo se parametriza lo barato y lo que varía de verdad |
| Partidos que nunca se coordinan y bloquean el cierre de la zona | Tablero de avance con alertas de plazo; W.O. según reglamento |
| Los webhooks de MercadoPago necesitan URL pública | ngrok en desarrollo; verificar antes de la demo |
| Sobreventa de cupos por concurrencia | Reserva con vencimiento + lista de espera |
| La demo depende de una cuenta de Neon externa | `docker-compose` con Postgres local, autosuficiente |
| El insumo de la extracción de resultados no está confirmado | El desarrollo es el mismo para captura, foto o texto libre. Las otras dos funcionalidades de IA no dependen de esto |
| La importación del padrón depende de la API de Anthropic, y `docker compose up` no puede depender de cuentas externas | Sin `ANTHROPIC_API_KEY` la API levanta igual y la importación termina en error con el motivo; el alta manual sigue funcionando. Para la demo, la key va en el `.env`. El rate limiting y el tope de gasto de [06](06-ia.md) todavía no están implementados |
| Exposición de datos de contacto en pantallas públicas | Ninguna vista pública incluye teléfono ni email |

---

## Glosario

Los términos de la interfaz son genéricos; entre paréntesis, cómo los llama POLENTA. La equivalencia con los nombres del código está en [02-dominio.md](02-dominio.md) §0.

| Término | Significado |
|---|---|
| **Torneo del calendario** | Torneo que se repite cada año y tiene su casillero en el ranking. En código, `Etapa`. En POLENTA: Primavera, Verano, Pretemporada, Otoño, Invierno |
| **Edición** | Una vez que se juega un torneo del calendario, en una categoría: "Primavera 26 · Tercera". En código, `Torneo` |
| **Zona / grupo** | Grupo de jugadores que juegan todos contra todos en la primera fase. En POLENTA, de 4 |
| **Cuadro principal** | Cuadro eliminatorio de los mejores de cada zona (POLENTA: "Campeonato", los 2 primeros). La interfaz todavía dice "Campeonato": decisión abierta 16 |
| **Cuadro consuelo** | Cuadro eliminatorio opcional de los que no clasifican al principal. Nombre configurable (POLENTA: "Complementaria", los 2 últimos de cada zona) |
| **Cabeza de serie** | Jugador mejor rankeado de cada grupo |
| **Casillero** | Lugar del ranking que corresponde a un torneo del calendario; se reemplaza cada año |
| **Punto de oro** | Punto único que define el game al llegar a 40-40, sin ventajas |
| **Super tie-break** | Tie-break a 10 puntos que reemplaza al tercer set |
