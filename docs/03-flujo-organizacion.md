# Flujo de la organización (web)

> Reglas de negocio en [02-dominio.md](02-dominio.md). Los términos de la interfaz ("torneo del calendario", "edición", "cuadro consuelo") y su equivalencia con el código están en [02](02-dominio.md) §0.

---

## 1. Roles y entidades

### Con cuenta de usuario

| Rol | Accede desde | Responsabilidad |
|---|---|---|
| **Organización** | Web | Padrón, torneos, sorteo, resultados, cierre |
| **Jugador** | App móvil | Se inscribe, paga, coordina fechas, consulta |

Solo dos roles con autenticación.

### Sin cuenta

| Entidad | Qué es |
|---|---|
| **Club / sede** | Dirección y canchas. Dato, no usuario |
| **Jugador (perfil de padrón)** | La persona en el padrón. Existe sin cuenta |

El sistema es **multi-organización**: `organizacion_id` es la clave de aislamiento de torneos, categorías, rankings, padrón y liquidaciones. Debe estar en el schema desde el primer día.

Un club puede alojar torneos de circuitos distintos, y una organización rota entre varios clubes.

---

## 2. Ciclo de vida del torneo

```
borrador → publicado → inscripciones_cerradas → zonas_generadas
        → grupos_en_curso → eliminatorias → finalizado
```

| Estado | Se entra cuando | Qué se puede hacer |
|---|---|---|
| `borrador` | Se crea el torneo | Editar todo. No visible |
| `publicado` | La organización lo publica | Inscripciones abiertas. Se sigue editando, salvo las categorías |
| `inscripciones_cerradas` | La organización cierra la inscripción de la categoría (§7). Hoy no se cierra sola al llenarse el cupo ni al vencer la fecha | Sortear las zonas. Con F13 completa, además, resolver la lista de espera |
| `zonas_generadas` | Se confirma el sorteo, antes de la fecha de inicio | Comunicar grupos y plazos. Cargar los partidos que se adelanten |
| `grupos_en_curso` | Llega la fecha de inicio: arranca el plazo de 3 semanas. Lo cambia una tarea de la API que revisa cada hora; si el sorteo se confirma después de esa fecha, entra directo ([decisión 029](decisiones/029-grupos-en-curso.md)) | Cargar resultados de zona |
| `eliminatorias` | Cierran todas las zonas | El cuadro principal y, si hay, el consuelo en juego, con el plazo por ronda del torneo. En la interfaz: "cuadros" |
| `finalizado` | Se definen ambos campeones | Solo lectura. Se impactan los puntos |

> **Nota:** a diferencia de versiones anteriores, la organización **no paga** por publicar un torneo. El modelo de ingresos del circuito son las inscripciones de los jugadores.

---

## 3. Alta de la organización

Registro con email y contraseña (`POST /api/auth/registro`). En una sola transacción se crean:

- La **organización**, con un slug único derivado de su nombre (`polenta`, `polenta-2`, …) y con `usa_ranking` apagado
- El **usuario administrador**, que guarda el email y la contraseña. La organización no tiene credenciales propias: se accede a ella a través de sus administradores (`AdminOrganizacion`), lo que permite sumar más adelante a otros miembros del comité sin compartir una contraseña
- El vínculo entre los dos

La respuesta incluye un token de sesión (JWT), así la organización queda ingresada sin pasar por la pantalla de ingreso.

**Ingreso** (`POST /api/auth/ingreso`): email y contraseña del administrador. Devuelve lo mismo que el registro. Si el email no existe o la contraseña no coincide, la respuesta es la misma (`CREDENCIALES_INVALIDAS`), para no revelar qué emails tienen cuenta. Si el usuario administra más de una organización, entra a la más antigua ([decisión 002](decisiones/002-organizacion-al-ingresar.md)).

**Por qué arranca sin ranking.** Es la puerta de entrada al producto: se puede publicar un torneo suelto sin configurar nada, y el ranking se activa después ([07-configurabilidad.md](07-configurabilidad.md) §1).

**El registro no configura el circuito.** Pide solo lo necesario para entrar: nombre del circuito, nombre de quien lo administra, email y contraseña. Las categorías, el calendario y la tabla de puntos se configuran después, por uno de dos caminos:

| Camino | Para quién | Cómo |
|---|---|---|
| **Importar la planilla** | Un circuito que ya existe, con rankings en Excel | La importación detecta las categorías y los torneos del calendario en la planilla y los crea al confirmar ([07](07-configurabilidad.md) §1.1). El circuito queda configurado con solo subir el archivo. *Pendiente de código* |
| **Configurarlo a mano** en *Tu circuito* | Un circuito nuevo, o quien prefiera hacerlo así | Lo de abajo |

> **Por qué así.** Pedir la configuración en el registro obliga a entender "etapas" y "casilleros" antes de ver el producto, y a tipear lo que la planilla ya tiene. Desde la devolución del 25% ([devolucion-25.md](devolucion-25.md), cambio E) la planilla es la fuente: quien tiene datos previos no configura nada a mano.

**Primeros pasos.** *Propuesto, pendiente de código* ([devolucion-25.md](devolucion-25.md), cambio H). El inicio del organizador muestra una tarjeta con tres pasos que se tildan solos al cumplirse: *Importá tus jugadores · Creá tu primer torneo · Compartí el link de inscripción*. Se eligió esto en lugar de un tutorial que resalta pasos en pantalla, que es caro de hacer y la gente lo saltea. El resto de la ayuda va **en contexto**: el texto que explica algo aparece junto a lo que explica, no en una pantalla aparte.

**El inicio con torneos.** Agrupa los torneos por momento: en juego, para sortear, con la inscripción abierta, en borrador y terminados. Desde que se publica, cada categoría tiene su propia tarjeta ([decisión 026](decisiones/026-una-tarjeta-por-categoria-en-el-inicio.md)), porque cierra la inscripción y se sortea por separado; los borradores van uno por convocatoria.

- Las categorías con la inscripción abierta llevan a su pantalla Inscripciones (§7).
- Las que cerraron y todavía no se sortearon van en "Para sortear", con "Sortear zonas" como acción principal. No van en "Necesita tu atención": ese bloque es rojo, y el rojo solo significa vencimiento.
- Una categoría con el sorteo confirmado deja de verse hasta que exista el tablero (F15), que es lo que llena "En juego".

Después del alta, y en cualquier momento, se configura:

- Nombre del circuito y datos de contacto
- **Categorías propias** (en POLENTA: Segunda y Tercera)
- **Torneos del calendario** (`Etapa` en código; en POLENTA: Primavera, Verano, Pretemporada, Otoño, Invierno) — definen los casilleros del ranking
- Tabla de puntos por instancia
- Nombre del cuadro consuelo (por defecto, "cuadro consuelo"; en POLENTA, "Complementaria"). *Pendiente de código*
- Clubes con los que trabaja

Todo menos los clubes se edita en la pantalla *Tu circuito*, que se guarda sola: cada cambio se envía un momento después de dejar de escribir (`PUT /api/organizaciones/:slug/circuito`, solo para administradores de esa organización). El PUT recibe la configuración completa y la deja tal cual llega.

**Las categorías y los torneos del calendario que se quitan se desactivan, no se borran** (`activa = false`). Una categoría puede tener torneos y jugadores apuntándole, y una etapa, torneos y movimientos de ranking; borrarlas rompería el historial o directamente fallaría por las claves foráneas. Si el nombre vuelve a agregarse, se reactiva la misma fila, con su historial. El orden de la lista define `orden`: para las etapas, es el orden del calendario.

---

## 4. Alta de clubes y canchas

Nombre, dirección y canchas con superficie. Alta de datos, sin usuario asociado.

Para las fases eliminatorias, el torneo declara su **sede designada**. En fase de grupos no hace falta: cada partido se juega donde acuerden los jugadores.

---

## 5. Gestión del padrón

La organización es dueña de su padrón. En modo `cerrada` —el que usa POLENTA— es además la única vía de alta; en modo `abierta` los jugadores se agregan solos al inscribirse ([07-configurabilidad.md](07-configurabilidad.md) §2.5). En todos los modos, la organización puede:

- Alta manual de jugadores
- **Importación desde planilla**, automática por excepción: se importa solo lo que pasa todos los controles, y la organización revisa lo dudoso ([06-ia.md](06-ia.md) §1)
- Asignación y reasignación de categoría
- Baja o desactivación

En el caso de validación, el padrón de POLENTA tiene 77 jugadores en 2 categorías.

### API del padrón

Los tres endpoints exigen sesión y solo responden a administradores de esa organización.

| Endpoint | Qué hace |
|---|---|
| `GET /api/organizaciones/:slug/jugadores` | Devuelve el padrón completo, ordenado por apellido. Cada fila trae categoría, puntos, puesto y partidos jugados |
| `POST /api/organizaciones/:slug/jugadores` | Alta manual: nombre, apellido, categoría y teléfono opcional |
| `PATCH /api/organizaciones/:slug/jugadores/:id` | Edita solo los campos que llegan. Sirve también para reasignar la categoría y para la baja |

**El padrón viaja entero.** Filtrar por categoría y buscar por apellido se resuelve en la pantalla: con padrones de decenas de jugadores no se justifica paginar.

**Un jugador nuevo entra con 0 puntos porque no se le crea ningún movimiento de ranking**, no porque se le cargue un cero. Figura en el ranking de su categoría desde el alta.

**La baja desactiva, no borra** (`activo = false`). El jugador tiene partidos, inscripciones y movimientos de ranking que son historial del circuito. De baja deja de tener puesto en el ranking y los demás suben; reactivarlo lo devuelve con sus puntos.

**Los puntos y el puesto se calculan en cada consulta** a partir de los movimientos, por casillero con reemplazo ([decisión 001](decisiones/001-calculo-del-ranking.md)). Los empatados comparten puesto.

**Cambio de categoría — provisorio.** El ranking de una categoría lista a los jugadores que hoy están en ella y suma solo los movimientos de esa categoría. Quien pasa de Tercera a Segunda aparece en Segunda con 0 puntos; sus movimientos de Tercera quedan guardados y vuelven a contar si regresa. Es lo mínimo que no pierde información mientras el organizador no responda qué corresponde (decisión abierta 7 del [README](README.md)).

**El teléfono solo sale por estos endpoints.** Ninguna respuesta pública lo incluye.

### API de la importación desde planilla (F03)

Mismas reglas de acceso que el padrón. El diseño de la extracción está en [06-ia.md](06-ia.md) §1.

| Endpoint | Qué hace |
|---|---|
| `POST /api/organizaciones/:slug/importaciones` | Multipart con `archivo` (`.xlsx`, `.xls` o `.csv`, hasta 2 MB) y `categoria` (por nombre). Procesa la planilla con IA y devuelve la propuesta en estado `PROCESADO`, o `ERROR` con el motivo. Tarda unos 20 segundos |
| `GET /api/organizaciones/:slug/importaciones/:id` | Propuesta, problemas de la auditoría y conteos (existentes, nuevos, dudosos, con problemas) |
| `POST /api/organizaciones/:slug/importaciones/:id/confirmar` | Una decisión por fila: `vincular` con un jugador del padrón, `crear` uno nuevo o `excluir`. Aplica todo en una transacción y deja la importación `CONFIRMADO` |
| `POST /api/organizaciones/:slug/importaciones/:id/descartar` | Pasa a `DESCARTADO` sin guardar nada |

**La propuesta se lee de la base, no del cliente.** El cliente solo manda las decisiones. Así no puede cargar puntos que la IA no extrajo ni la auditoría revisó.

**Un casillero con puntos crea un movimiento `IMPORTACION_INICIAL`**, fechado el 1° de enero del año del casillero ([decisión 008](decisiones/008-fecha-de-los-movimientos-importados.md)). Un casillero en 0 no crea nada, por la misma razón que un jugador nuevo entra sin movimientos.

**Confirmar es idempotente por casillero:** si el jugador ya tiene en esa categoría un movimiento de la misma etapa, el mismo año y los mismos puntos, se saltea. Volver a subir la planilla cuando hay altas solo agrega lo nuevo.

#### Cambios planificados a partir de la devolución del 25%

*Pendientes de código.* Lo de arriba describe lo implementado. El diseño de cada cambio está en [06-ia.md](06-ia.md) §1 y en las decisiones [011](decisiones/011-la-importacion-detecta-el-calendario.md) y [012](decisiones/012-importacion-de-varios-archivos-y-hojas.md).

| Hoy | Después |
|---|---|
| Todas las filas esperan una decisión de la organización en `confirmar` | **Automática por excepción.** Las filas seguras se aplican solas al terminar el procesamiento; `confirmar` recibe decisiones solo para las filas a revisar. La pantalla dice *"Importamos 74 jugadores. Revisá estos 3"* |
| Sin forma de deshacer una importación confirmada | **Deshacer la importación**: borra sus movimientos y los jugadores que creó, si no tienen otra actividad. Requiere vincular cada movimiento con su importación (migración) |
| `archivo` y `categoria` por nombre, un archivo por subida | Hasta **10 archivos de 2 MB**, cada uno con una o varias hojas. La categoría se detecta por el título de la hoja o el nombre del archivo; si no se puede, se pregunta |
| Sin etapas configuradas termina en `ERROR` (`SIN_ETAPAS`) | **Detecta los torneos del calendario** en los encabezados y los propone; se crean al confirmar, en la misma transacción |
| Solo `.xlsx`, `.xls` y `.csv` | Propuesto: PDF con texto, texto pegado e imágenes, en ese orden de prioridad |

---

## 6. Creación del torneo

El formulario replica la convocatoria que hoy publican en WhatsApp ([02](02-dominio.md) §12):

- Nombre y descripción
- **Torneo del calendario** (`etapaId`) — define qué casillero del ranking se actualiza. Si no se elige, es un torneo suelto
- Categorías a disputar y cupo de cada una. Cada categoría es un `Torneo` aparte que comparte todo lo demás con las otras ([decisión 003](decisiones/003-torneo-con-varias-categorias.md))
- Importe de inscripción
- **Formato**: cantidad de grupos, clasificados por grupo, si hay cuadro consuelo, modo de distribución y modo de sorteo
- **Sistema de juego**: sets, punto de oro, super tie-break
- Fecha de cierre de inscripción
- **Cronograma por instancia**
- Sedes: libre o designada, por fase

> Todos los valores por defecto salen de la configuración de la organización. El listado completo de parámetros está en [07-configurabilidad.md](07-configurabilidad.md).

**Publicar.** El borrador se puede guardar incompleto, pero para publicarlo tienen que estar la fecha de cierre de inscripción, que no puede ser pasada, y la fecha de inicio. Publicar pasa a `publicado` todos los torneos de la convocatoria a la vez.

**Editar con la inscripción abierta.** Mientras el torneo está publicado se puede seguir ajustando todo menos las categorías: cada una ya puede tener inscripciones, y en borrador cambiarlas implica borrar y recrear torneos ([decisión 003](decisiones/003-torneo-con-varias-categorias.md)). El cupo de una categoría no puede bajar de la cantidad de inscriptos que ocupan lugar (pendientes de pago y pagados; la lista de espera no cuenta). Cuando se cierra la inscripción, el formato ya no cambia: el sorteo lo usa. Como el formato es uno solo para toda la convocatoria, alcanza con que una categoría cierre para que la convocatoria entera deje de editarse, aunque otra siga abierta.

---

## 7. Gestión de inscripciones

Panel con el padrón en vivo: confirmados, pendientes de pago, cupo restante y **lista de espera**.

Funciones:

- Inscribir manualmente a quien pagó por fuera del sistema
- Dar de baja y **promover automáticamente al primero de la lista de espera**
- Enviar recordatorio a quienes no completaron el pago
- Cerrar inscripciones

La lista de espera se ordena **por orden de llegada** y cubre deserciones, replicando la regla actual del reglamento.

**Lo que existe hoy** es una versión mínima, que es el camino al sorteo. Se llega desde la tarjeta de la categoría en el inicio (§3). La pantalla Inscripciones es de una categoría (`/torneos/:id/inscripciones`, con el id del `Torneo`, no el de la convocatoria): muestra los lugares del cupo (pagados, reservando y libres) y la lista de inscriptos con su estado. Con la inscripción abierta, el botón es "Cerrar inscripciones": el torneo pasa a `inscripciones_cerradas` y el botón pasa a "Sortear zonas", que lleva al sorteo. Cada categoría se cierra aparte, y cerrar no se deshace.

- **Las reservas sin pagar no se tocan al cerrar** ([decisión 024](decisiones/024-reservas-sin-pagar-al-cerrar.md)): no entran al sorteo, que toma solo las pagadas, y se resuelven cuando exista F13 completa. La pantalla lo avisa antes de cerrar.
- **No se puede cerrar si los que pagaron no alcanzan para las zonas**, al menos 3 por zona ([decisión 025](decisiones/025-no-se-cierra-sin-inscriptos-para-las-zonas.md)). La pantalla dice cuántos hacen falta y enlaza al torneo para bajar la cantidad de zonas.

Inscribir a mano, dar de baja, recordar el pago, la lista de espera y la conciliación todavía no están.

---

## 8. Sorteo y generación de zonas

Dos parámetros independientes ([07-configurabilidad.md](07-configurabilidad.md) §2.1):

- **`modo_distribucion`** — cómo se reparten los jugadores: `serpentina`, `directa` o `bombos`
- **`modo_sorteo`** — quién lo ejecuta: `automatico`, `asistido` (en pantalla, para proyectar) o `manual` (la organización carga el resultado del sorteo físico)

El sistema genera los grupos y los partidos de zona. La organización puede revisar antes de confirmar.

**Se sortea con la inscripción cerrada** (`inscripciones_cerradas`), y solo entran los inscriptos que pagaron. Se llega desde la pantalla Inscripciones de la categoría, con "Sortear zonas" (§7). Cada categoría se sortea por separado: es un `Torneo` aparte, con su propio ranking.

**El sorteo lo pide la organización.** Hasta el primer sorteo la página muestra las zonas vacías, y elegir el reparto no sortea. Lo mismo al cambiar el reparto de un borrador: vuelven las zonas vacías hasta tocar «Sortear». Así cada resultado aparece cuando lo piden.

**El sorteo queda como borrador hasta confirmarlo** ([decisión 014](decisiones/014-borrador-del-sorteo.md)). Sortear después de cambiar el modo de distribución reparte de nuevo con la misma siembra; "volver a sortear" vuelve a sortear también el orden entre los empatados en puntos. Al confirmar se generan los partidos de zona, con vencimiento en el último día de la fase de grupos del cronograma, y el torneo pasa a `zonas_generadas`. Confirmar no se deshace.

**Si no se llenó el cupo**, se respeta la cantidad de zonas del formato y algunas quedan de 3. Con menos de 3 por zona no se puede sortear ([decisión 015](decisiones/015-zonas-con-menos-inscriptos.md)).

**En el modo `manual`** la organización arrastra a cada jugador a la zona que le tocó en el sorteo presencial ([decisión 020](decisiones/020-carga-manual-del-sorteo.md)). La API comprueba que estén todos los que pagaron, una sola vez, y que las zonas tengan los tamaños que daría el sorteo. La posición de siembra la calcula la API con el ranking, igual que en el automático. Al confirmar, lo cargado se guarda como borrador y se confirma en el mismo paso.

**En el modo `asistido`** el sorteo se hace frente a todos ([decisión 021](decisiones/021-sorteo-en-pantalla.md)). La organización elige el reparto y toca "Sortear en pantalla": la API hace un sorteo nuevo, siembra incluida, y la web lo muestra en pantalla completa, de a un jugador y bombo por bombo. Mientras no se sorteó en pantalla, la página no muestra zonas. Al terminar se puede volver a sortear o volver a la página para revisar y confirmar.

**El sorteo no reserva los cuadros.** Se arman recién al cerrar las zonas (§11), con o sin cuadro consuelo según el parámetro del torneo ([decisión 026](decisiones/026-cierre-de-zonas.md)).

---

## 9. Seguimiento: tablero de avance

Pantalla central durante el torneo. Por grupo muestra:

- Partidos jugados, con fecha acordada, y sin coordinar
- Días restantes del plazo
- Alertas de partidos en riesgo de vencimiento
- Tabla de posiciones en vivo con la línea de corte marcada

Reemplaza el trabajo actual de revisar el grupo de WhatsApp a mano.

---

## 10. Carga de resultados

**La carga es responsabilidad de la organización.** Los jugadores no cargan resultados ([04-flujo-jugador.md](04-flujo-jugador.md) §2).

Por partido: los sets y, si se conocen, los puntos del tie-break de un 7-6 ([decisión 030](decisiones/030-puntos-del-tie-break-opcionales.md)). Se valida contra el sistema de juego configurado en el torneo ([07-configurabilidad.md](07-configurabilidad.md) §2.2): cómo termina un set, que el super tie-break sea el set decisivo y que no sobren ni falten sets. **El ganador lo calcula el sistema a partir de los sets**; la organización solo lo indica en un W.O. o un abandono.

Hay tres tipos de resultado:

| Tipo | Qué se carga | Para la tabla |
|---|---|---|
| Jugado | Los sets | Los sets |
| Walkover | Quién ganó. No se guardan sets ([decisión 016](decisiones/016-walkover-sin-sets-guardados.md)) | 6-0 6-0 a favor del ganador |
| Abandono | Quién ganó y lo que se jugó; el último set puede haber quedado sin terminar | 6-0 6-0 a favor del ganador, como el W.O. ([decisión 027](decisiones/027-abandono.md)) |

Al guardar:

- La tabla de posiciones de la zona ya se ve actualizada: se calcula en cada consulta con la cascada de desempates
- Si era de cuadro, el ganador avanza a la siguiente ronda del cuadro que corresponda, en la misma transacción

**Corrección.** Se carga el resultado otra vez y reemplaza al anterior. Se puede siempre que no cambie lo que ya se armó con él ([decisión 028](decisiones/028-correccion-de-resultados.md)):

- Con las zonas abiertas, siempre.
- Con las zonas cerradas, solo si los cuadros quedan con la misma siembra.
- En un cuadro, si cambia el ganador, solo si el partido siguiente todavía no se jugó: el nuevo ganador reemplaza al anterior.
- Con el torneo finalizado, nunca.

**Partidos no jugados en plazo:** no se resuelven con regla automática. El sistema presenta el caso con el historial de coordinación y la organización decide W.O., doble W.O. o extensión. El W.O. se registra como **6-0 6-0**. El doble W.O. todavía no se puede cargar.

### API de la carga de resultados

| Endpoint | Qué hace |
|---|---|
| `GET /api/organizaciones/:slug/torneos/:id/partidos/:partidoId` | El partido con su resultado y el sistema de juego del torneo |
| `PUT /api/organizaciones/:slug/torneos/:id/partidos/:partidoId/resultado` | Guarda o corrige el resultado: `{ tipo: 'jugado', sets }`, `{ tipo: 'walkover', ganadorId }` o `{ tipo: 'abandono', ganadorId, sets }` |

Los dos son solo para quien administra la organización. Los errores de validación responden `400 DATOS_INVALIDOS` con un mensaje por set. Los que no dependen de los datos responden 409: `PARTIDO_SIN_JUGADORES` (un partido de cuadro que espera al ganador del anterior), `CORRECCION_CAMBIA_LOS_CUADROS`, `SIGUIENTE_YA_JUGADO`, `TORNEO_TERMINADO`, y `RESULTADO_DESACTUALIZADO` si otra carga del mismo partido llegó antes.

---

## 11. Cierre de fase de grupos

**Las zonas las cierra la organización**, cuando todos los partidos tienen resultado ([decisión 026](decisiones/026-cierre-de-zonas.md)). Los cancelados no frenan el cierre; los vencidos sí, porque antes hay que resolverlos. Al cerrar, el sistema:

1. Ordena cada grupo con la cascada de desempates
2. Manda los N primeros de cada grupo al cuadro **principal** (N configurable; en POLENTA, 2, y lo llaman Campeonato)
3. **Si el torneo tiene cuadro consuelo**, manda al resto a ese segundo cuadro
4. Genera los cuadros completos: dónde va cada uno sale de una siembra única de los clasificados ([decisión 022](decisiones/022-ubicacion-en-el-cuadro.md)), y quien tiene bye ya queda en la segunda ronda ([decisión 023](decisiones/023-byes-sin-partido.md))

El torneo pasa a `eliminatorias`. Cerrar no se deshace.

Cuando hay dos cuadros, corren en paralelo con el mismo plazo por ronda, contado desde el día del cierre (en POLENTA, la primera ronda vence a los 7 días y la segunda a los 14). Cada resultado de cuadro hace avanzar al ganador al partido siguiente.

---

## 12. Cierre del torneo

Con los campeones definidos (uno por cuadro), la organización cierra el torneo. El sistema:

- Genera los `MovimientoRanking` según instancia alcanzada
- **Reemplaza el casillero de ese torneo del calendario** en el ranking de cada jugador
- Si es un torneo suelto, produce las posiciones finales y no otorga puntos
