# Lista de funcionalidades (features)

**Segunda entrega — Trabajo Final 2026**
Proyecto: SetPoint — Plataforma de gestión de torneos de tenis amateur
Caso de validación: POLENTA Team Tenis

> **Actualizado tras la verificación del 25%** ([devolucion-25.md](devolucion-25.md)): F03 pasa a ser automática por excepción y detecta el calendario y las categorías; F19 pasa a ser la candidata a "IA en el uso diario", condicionada al tiempo. Los textos usan los términos genéricos de la interfaz ("torneo del calendario", "cuadro consuelo").

> **Versión 2 — corrige la devolución de la cátedra.** Las features están numeradas en el orden cronológico real de uso del sistema, y las cuatro primeras explicitan quién da de alta la organización, los jugadores y los torneos, y en qué momento.

---

## Cómo se pone en marcha el sistema

Antes del listado, la secuencia operativa completa. Cada paso está cubierto por las features que se indican.

| # | Momento | Quién | Qué ocurre | Feature |
|---|---|---|---|---|
| 1 | Una única vez, al adoptar el sistema | Quien administra el circuito | Crea la cuenta de la organización. Si administra un circuito con ranking, define categorías, torneos del calendario y tabla de puntos, o deja que la importación los detecte (paso 2) | F01 |
| 2 | Antes del primer torneo, y luego cada vez que hay altas | La organización | Carga los jugadores de su circuito: uno por uno, subiendo su planilla, o abriendo la inscripción para que se anoten solos. Si sube su planilla, el circuito queda configurado | F02, F03 |
| 3 | Cada vez que se organiza un torneo | La organización | Crea el torneo con su categoría, cupo, importe, formato y cronograma, y lo publica | F04 |
| 4 | Desde la publicación hasta el cierre de inscripción | Los jugadores | Se inscriben y pagan | F12, F13 |
| 5 | Al cerrarse las inscripciones | La organización | Ejecuta el sorteo; se generan los grupos y los partidos | F05 |
| 6 | Durante el torneo | Jugadores y organización | Se coordinan las fechas, se juega y se cargan los resultados | F06, F14 |
| 7 | Al definirse los campeones | La organización | Cierra el torneo y el ranking se actualiza solo | F16 |

> **Nada es preexistente.** La organización, los jugadores y los torneos se dan de alta dentro del sistema, en ese orden, y las cuatro primeras features cubren esos tres momentos.

---

## Resumen de entregas

| Entrega | Fecha aprox. | Features | Foco |
|---|---|---|---|
| 25% | Fin de septiembre | F01 a F04 | **Puesta en marcha:** alta de organización, jugadores y torneos |
| 50% | Mediados de octubre | F05 a F11 | Motor de competencia, consulta pública y app móvil |
| 75% | Principios de noviembre | F12 a F17 | Inscripciones, pagos, coordinación y cierre |
| 100% | Mediados de noviembre | F18 a F20 | Estadísticas y funcionalidades asistidas por IA |

---

## F01 — Alta de la organización y configuración del circuito

**Es el primer paso y ocurre una sola vez.** Quien administra el circuito crea la cuenta de su organización con un correo y una contraseña, y a partir de ese momento puede empezar a usar el sistema. Si además administra un circuito con ranking anual, define sus categorías, los torneos de su calendario y la tabla de puntos que otorga cada instancia. Esa configuración es opcional, puede activarse más adelante y, si el circuito ya tiene su ranking en una planilla, la arma la importación (F03).

**Precisiones de alcance:**
- Lo hace la propia organización desde la web; nadie carga nada por ella.
- Una organización puede correr torneos sueltos sin ranking, y activar el ranking después.
- Las categorías son propias de cada circuito; POLENTA usa Segunda y Tercera.
- Los torneos del calendario definen los casilleros del ranking anual y solo hacen falta si se usa ranking.
- El inicio del organizador muestra una tarjeta de **primeros pasos** que se tildan solos: importar los jugadores, crear el primer torneo, compartir el link de inscripción. *Propuesto.*
- La tabla de puntos es editable: campeón, finalista, semifinalista, cuartos, octavos y participación.
- Opcionalmente puede registrar los clubes donde suele jugar, con sus canchas y superficies, para habilitar estadísticas por superficie.

**Entrega: 25%**

---

## F02 — Alta y gestión de jugadores

**Ocurre antes del primer torneo y se repite cada vez que hay altas.** La organización construye la lista de jugadores de su circuito, que es la base sobre la que después se arman las inscripciones, el ranking y el historial. Puede cargarlos de a uno desde el panel, editar sus datos, asignarles categoría o darlos de baja. Un jugador que recién se incorpora empieza con cero puntos.

**Precisiones de alcance:**
- Hay tres formas de que un jugador entre al circuito: alta manual desde el panel, carga masiva desde planilla (F03), o inscripción abierta, si la organización decide permitir que cualquiera se anote.
- En circuitos cerrados como POLENTA, la organización es la única vía de ingreso: quien no está en la lista no puede inscribirse a ningún torneo.
- Un jugador nuevo ingresa con cero puntos y sube al ir jugando torneos.
- La organización puede reasignar la categoría de un jugador cuando corresponda.
- Un mismo jugador puede pertenecer a varios circuitos, con ranking independiente en cada uno.
- El padrón puede ser cerrado, con aprobación previa o abierto, según lo defina la organización. En modo abierto, quien se inscribe sin estar en el padrón se incorpora automáticamente con cero puntos.
- Cuando un jugador crea su cuenta, el sistema le ofrece vincularla con su perfil del padrón para recuperar su historial y sus puntos. La organización puede revisar y revertir esas vinculaciones.

**Entrega: 25%**

---

## F03 — Carga masiva de jugadores desde planilla

**Es la puerta de entrada de un circuito que ya existe.** La organización sube la planilla de cálculo que viene usando y el sistema carga a todos los jugadores con sus puntos históricos, en lugar de tipearlos de a uno. Lo que el sistema puede verificar contra el archivo se importa solo; la organización revisa únicamente lo que falló o es dudoso: *"Importamos 74 jugadores. Revisá estos 3"*.

**Precisiones de alcance:**
- Reconoce automáticamente qué columna corresponde a cada torneo del calendario.
- Detecta que "J. Pérez", "Juan Perez" y "PEREZ, Juan" son la misma persona.
- Descarta filas que no son jugadores, como totales o encabezados repetidos.
- Cada número importado se verifica contra el archivo: no entra al ranking ningún punto que no esté en la planilla.
- La importación es repetible: se puede volver a subir la planilla cada vez que haya altas, y solo se agrega lo nuevo.

**Estado de la entrega del 25%:** implementada con revisión de todas las filas, para Excel y CSV, una hoja y una categoría por subida.

**Alcance a partir de la devolución del 25%** ([devolucion-25.md](devolucion-25.md)):

| Cambio | Estado |
|---|---|
| **Automática por excepción:** lo que pasa todos los controles con una coincidencia segura se importa sin pedir confirmación; la importación entera se puede deshacer | Decidido |
| **Detecta los torneos del calendario y las categorías** en la planilla y los crea al confirmar. Una organización recién registrada sube su archivo y el circuito queda configurado | Decidido |
| **Varios archivos** (uno por categoría) **y varias hojas** (una por categoría), hasta 10 archivos de 2 MB | Decidido |
| Un archivo por torneo del calendario | Fuera de alcance en esta versión |
| **Más formatos**, en este orden: PDF con texto, texto pegado, imágenes y PDF escaneados. Las imágenes no se pueden auditar contra el origen: todas sus filas pasan por revisión | Propuesto, alcance futuro |

**Funcionalidad asistida por IA. Entrega: 25% (base) · cambios de la devolución: entrega a asignar**

---

## F04 — Creación y convocatoria de torneos

**La organización crea cada torneo cuando decide organizarlo**, y el sistema le pide la misma información que hoy publica en su convocatoria: nombre, categorías a disputar, cupo de cada una, importe de inscripción, formato de juego, fecha de cierre de inscripción y cronograma de fechas por instancia. El torneo queda en borrador hasta que la organización decide publicarlo, y recién ahí se vuelve visible para los jugadores y se abren las inscripciones.

**Precisiones de alcance:**
- Solo la organización crea torneos; los jugadores no pueden.
- El formato es configurable: cantidad de grupos, clasificados por grupo y si se juega o no cuadro consuelo.
- El sistema de juego se parametriza: cantidad de sets, punto de oro, super tie-break.
- Se definen los plazos de cada instancia, por ejemplo tres semanas para la fase de grupos y una semana por ronda eliminatoria.
- **Un torneo puede ser suelto o formar parte de un circuito con ranking.** Si es suelto, el resultado son las posiciones finales de ese torneo y no hace falta configurar etapas ni puntos.
- La sede puede quedar a libre elección de los jugadores, escribiendo el nombre del lugar, o elegirse de la lista de clubes que la organización haya cargado.

**Entrega: 25%**

---

## F05 — Sorteo y armado de zonas

Con las inscripciones cerradas, el sistema distribuirá a los jugadores en grupos usando el ranking vigente, de modo que todos los grupos queden con un nivel equivalente, y generará automáticamente todos los partidos de la fase de grupos. La organización revisa el resultado antes de confirmarlo y publicarlo.

**Precisiones de alcance:**
- La distribución por serpentina reparte a los jugadores de manera que todos los grupos sumen el mismo ranking acumulado.
- En torneos sin ranking, el orden de siembra lo define la organización manualmente o se sortea al azar.
- La organización puede elegir entre distribución serpentina, directa o por bombos.
- También puede cargar a mano el resultado de un sorteo hecho presencialmente, para circuitos que lo hacen como ceremonia.
- Con treinta y dos jugadores en ocho grupos de cuatro se generan cuarenta y ocho partidos de zona.

**Estado:** implementada con el sorteo automático y los tres modos de distribución. El sorteo queda como borrador hasta confirmarlo ([decisión 014](decisiones/014-borrador-del-sorteo.md)) y, si no se llena el cupo, se arman zonas de 3 ([decisión 015](decisiones/015-zonas-con-menos-inscriptos.md)). Sortear en pantalla y cargar a mano dependen de la decisión abierta 6.

**Entrega: 50%**

---

## F06 — Carga de resultados

La organización podrá registrar el resultado de cada partido indicando los games de cada set y el ganador. Al guardarse, el sistema actualiza inmediatamente todo lo que dependa de ese resultado: la tabla de posiciones del grupo o el avance del jugador a la siguiente ronda del cuadro.

**Precisiones de alcance:**
- Contempla partidos definidos por super tie-break en lugar de tercer set.
- Contempla walkover y abandono, que se registran como seis a cero en ambos sets.
- Permite corregir un resultado ya cargado, revirtiendo sus efectos sobre tablas y cuadros.
- Cada circuito define si los resultados los carga únicamente la organización o si también pueden cargarlos los jugadores con confirmación del rival.

**Entrega: 50%**

---

## F07 — Clasificación automática y desempates

El sistema ordenará automáticamente la tabla de posiciones de cada grupo aplicando los criterios de desempate del reglamento del circuito, sin que nadie tenga que hacer cuentas de sets y games a mano. La tabla se actualiza con cada resultado cargado y muestra con claridad quiénes están clasificando.

**Precisiones de alcance:**
- Los criterios se aplican en cascada: partidos ganados, sets ganados, diferencia de sets, games ganados, diferencia de games y enfrentamiento directo.
- Vale el primer criterio que rompa la igualdad.
- El super tie-break se computa como un set y además como un game; el tie-break, como un game.
- El mismo procedimiento resuelve comparaciones entre grupos, por ejemplo para definir el mejor tercero.

**Entrega: 50%**

---

## F08 — Cuadro principal y cuadro consuelo

Al terminar la fase de grupos, el sistema armará automáticamente los cuadros eliminatorios ubicando a cada jugador según su posición en la zona. Los mejores de cada grupo van al cuadro principal y, si el torneo lo tiene, el resto al cuadro consuelo, de modo que todos los inscriptos sigan compitiendo. Cada resultado hace avanzar al ganador a la ronda siguiente sin intervención manual.

**Precisiones de alcance:**
- Ambos cuadros funcionan en paralelo y cada uno define su propio campeón.
- La cantidad de clasificados por grupo a cada cuadro es configurable.
- El cuadro consuelo puede desactivarse para circuitos que no lo utilicen, y su nombre es configurable (POLENTA lo llama "Complementaria").
- Con treinta y dos inscriptos se generan quince partidos en cada cuadro.

**Entrega: 50%**

---

## F09 — Consulta pública del ranking

Cualquier persona podrá consultar el ranking del circuito desde un enlace, sin necesidad de crear cuenta ni instalar nada. La organización comparte el enlace por su canal habitual y los jugadores acceden a la tabla actualizada, con el mismo detalle por torneo del calendario que hoy tiene la planilla que se pasan por mensaje.

**Precisiones de alcance:**
- El ranking se muestra por categoría, con el desglose de puntos que aportó cada torneo del calendario.
- Se puede buscar a un jugador por apellido para ver su posición.
- Ninguna pantalla pública muestra datos de contacto de los jugadores.
- La información se actualiza sola a medida que se cierran torneos, sin que nadie edite una planilla.

**Entrega: 50%**

---

## F10 — Consulta pública del torneo en vivo

Cualquier persona podrá seguir el desarrollo de un torneo desde un enlace, sin cuenta ni instalación: las tablas de posiciones de cada zona, los cuadros eliminatorios, y el calendario de partidos con fecha, hora y lugar. La información se actualiza a medida que se cargan los resultados.

**Precisiones de alcance:**
- Las tablas de zona muestran con claridad quiénes están clasificando a cada cuadro.
- Los cuadros se recorren visualmente y muestran el avance ronda por ronda.
- El calendario lista los partidos acordados por fecha, para saber qué se juega cada día.
- Es la pantalla que la organización comparte en su grupo, reemplazando el envío de imágenes del cuadro.
- Ninguna pantalla pública muestra datos de contacto de los jugadores.

**Entrega: 50%**

---

## F11 — Mis partidos y avisos en el celular

El jugador dispondrá de una aplicación instalable en su teléfono donde ver sus próximos partidos con rival, club, día y horario, además de los partidos que todavía tiene pendientes de coordinar. La aplicación le avisa cuando se publica el fixture, cuando su rival confirma una fecha y cuando se acerca un partido.

**Precisiones de alcance:**
- Es una aplicación instalable, no un sitio web abierto en el navegador.
- Muestra la tabla de posiciones de su zona y su posición respecto del corte de clasificación.
- Permite consultar el ranking, los cuadros y su historial desde el teléfono.
- Los avisos llegan como notificaciones del teléfono, sin necesidad de abrir la aplicación.

**Entrega: 50%**

---

## F12 — Inscripción y pago desde el celular

**Desde que el torneo se publica y hasta la fecha de cierre**, el jugador puede inscribirse y abonar la inscripción desde su teléfono, sin transferir por fuera del sistema ni enviar comprobantes. Al confirmarse el pago, su lugar en el torneo queda asegurado automáticamente y tanto él como la organización lo ven reflejado al instante.

**Precisiones de alcance:**
- Solo pueden inscribirse los jugadores que la organización cargó previamente en el circuito, salvo que haya habilitado la inscripción abierta.
- El lugar se reserva por quince minutos mientras se completa el pago.
- Si el pago no se concreta en ese plazo, el lugar se libera para otro jugador.
- La inscripción se confirma sola: nadie tiene que verificar comprobantes a mano.
- El jugador no necesita crear una cuenta previa para inscribirse.
- Si el cupo está completo, puede anotarse en la lista de espera.

**Entrega: 75%**

---

## F13 — Administración de inscripciones y lista de espera

La organización podrá seguir el estado de las inscripciones de cada torneo en tiempo real: quiénes confirmaron, quiénes tienen el pago pendiente, cuántos lugares quedan y quiénes están en lista de espera. También podrá inscribir manualmente a quien haya pagado por fuera del sistema y dar de baja a quien se arrepienta, liberando el cupo automáticamente.

**Precisiones de alcance:**
- La lista de espera se ordena por orden de llegada y cubre las bajas automáticamente.
- Al liberarse un lugar, el primero de la lista recibe aviso y puede completar su pago.
- Permite registrar pagos en efectivo o por transferencia hechos fuera del sistema.
- Ante una baja, el sistema deja registrada la cancelación y si corresponde devolución, pero **el movimiento de dinero lo realiza la organización por fuera del sistema**. La política de reembolsos es del circuito, no de la plataforma.
- Muestra la conciliación del torneo: cuánto se recaudó, cuánto corresponde a la organización y qué devoluciones quedaron pendientes.

**Entrega: 75%**

---

## F14 — Coordinación de partidos entre jugadores

Los jugadores podrán registrar en el sistema la fecha, hora y club acordados para cada uno de sus partidos, y el rival confirmará que está al tanto. Cada uno ve en todo momento qué partidos le faltan jugar y cuánto tiempo le queda del plazo de la instancia.

**Precisiones de alcance:**
- Cualquiera de los dos jugadores puede cargar la fecha acordada; el otro la confirma.
- **Requiere que el jugador tenga cuenta**, ya que está registrando información en nombre de su perfil. La cuenta se ofrece al terminar el pago de la inscripción y se crea en un paso.
- **Ningún jugador queda bloqueado por no tener cuenta:** la organización siempre puede cargar la fecha en su nombre.
- En fase de grupos los jugadores eligen dónde jugar; en las eliminatorias la sede la fija la organización.
- Se admite una sola reprogramación por partido, con veinticuatro horas de anticipación.
- Un partido que llega al vencimiento del plazo sin jugarse queda señalado para que la organización resuelva.

**Entrega: 75%**

---

## F15 — Tablero de seguimiento del torneo

La organización dispondrá de una pantalla única donde ver el avance completo del torneo: qué partidos ya se jugaron, cuáles tienen fecha acordada, cuáles todavía no coordinó nadie y cuántos días quedan de cada plazo. Reemplaza el trabajo actual de revisar conversaciones para saber cómo viene cada zona.

**Precisiones de alcance:**
- Señala los partidos en riesgo de vencer sin haberse jugado.
- Muestra el estado de cada grupo con su tabla de posiciones en vivo.
- Permite resolver los partidos vencidos otorgando el walkover que corresponda.
- Ofrece una vista general del torneo y otra en detalle por grupo.

**Entrega: 75%**

---

## F16 — Cierre de torneo y actualización del ranking

Al definirse los campeones, la organización cerrará el torneo y el sistema otorgará automáticamente los puntos que corresponden a cada jugador según la instancia que alcanzó, actualizando el ranking del circuito. Los puntos reemplazan a los obtenidos en la edición anterior del mismo torneo del calendario, tal como funciona hoy la planilla.

**Precisiones de alcance:**
- En torneos sueltos sin ranking, el cierre produce la tabla de posiciones finales del torneo y no otorga puntos.
- Cada jugador puede ver de qué torneo salió cada uno de sus puntos.
- Los jugadores que completan la fase de grupos sin clasificar al cuadro principal reciben los puntos de participación.
- Si se corrige un resultado después del cierre, el ranking se recalcula.
- Cada categoría mantiene su ranking independiente.

**Entrega: 75%**

---

## F17 — Ficha e historial del jugador

Cada jugador tendrá una ficha con su historial completo: todos los partidos que jugó, con qué resultado, en qué torneo y en qué instancia, además de su evolución en el ranking a lo largo del tiempo. Es información que hoy se pierde al terminar cada torneo.

**Precisiones de alcance:**
- Muestra estadísticas acumuladas: partidos jugados, ganados y perdidos.
- Incluye los torneos disputados y la instancia alcanzada en cada uno.
- Muestra la evolución de sus puntos torneo por torneo.
- Es de acceso público, sin necesidad de cuenta.

**Entrega: 75%**

---

## F18 — Comparativa entre jugadores

Cualquier persona podrá comparar a dos jugadores del circuito y ver el historial de enfrentamientos entre ambos: cuántas veces jugaron, quién ganó cada partido y en qué torneo fue. Antes de un partido, cada jugador puede consultar cómo le fue históricamente contra ese rival.

**Precisiones de alcance:**
- Muestra el resultado acumulado del cruce, por ejemplo tres a dos.
- Detalla cada enfrentamiento con su resultado, torneo e instancia.
- Permite filtrar el rendimiento según la superficie de la cancha.
- Se accede desde la ficha de cualquier jugador o desde un buscador por apellido.

**Entrega: 100%**

---

## F19 — Registro de resultados a partir de mensajes

La organización podrá cargar varios resultados de una sola vez a partir de los mensajes que los jugadores ya envían por su canal habitual, en lugar de transcribirlos uno por uno. El sistema interpreta los mensajes, identifica de qué partido se trata y cuál fue el resultado, y presenta todo en una pantalla de confirmación antes de guardar.

**Precisiones de alcance:**
- Interpreta mensajes escritos de forma libre, con o sin guiones, en primera persona o en tercera.
- Distingue qué mensajes son resultados y cuáles son conversación.
- Reconoce situaciones especiales como abandonos o partidos definidos por super tie-break.
- Usa la misma arquitectura que F03: lo que pasa los controles (el partido existe, los jugadores son los de esa zona, el marcador es válido) se carga solo; lo dudoso queda para que la organización lo confirme.
- Si no logra interpretar un mensaje, ese partido queda para carga manual sin bloquear a los demás.

**Estado: condicionada, a confirmar con el profesor.** Desde la devolución del 25% es la candidata a llevar la IA al uso de todos los días, porque cargar resultados es el dolor recurrente real y F03 se usa pocas veces por año. Depende del tiempo: se encara después de terminar F03 y la app móvil ([devolucion-25.md](devolucion-25.md), cambio I).

**Funcionalidad asistida por IA. Entrega: 100%**

---

## F20 — Proyecciones de ranking

Antes y durante el torneo, cada jugador podrá ver cuántos puntos sumaría y qué posición alcanzaría en el ranking según hasta dónde llegue en el cuadro. Permite entender qué está en juego en cada partido.

**Precisiones de alcance:**
- Calcula el escenario para cada instancia posible: octavos, cuartos, semifinal, final y título.
- Considera el reemplazo de los puntos obtenidos en la edición anterior del mismo torneo del calendario.
- Muestra la posición estimada en el ranking en cada escenario.
- Se accede desde la ficha del jugador y desde la vista del torneo.

**Funcionalidad asistida por IA. Entrega: 100%**

---


---

## Notas para el grupo

**Qué cambió respecto de la versión anterior.** La numeración seguía el orden en que fueron surgiendo las features, no el orden en que se usan. Ahora F01 a F04 cubren la puesta en marcha —organización, jugadores, torneos— y el resto sigue el recorrido natural de un torneo. La planilla entregada además tenía las entregas descolocadas: indicaba que los torneos se creaban en la última entrega y que los resultados se cargaban en la primera.

**La tabla de puesta en marcha es la respuesta directa a la devolución.** Conviene dejarla visible en la planilla, no solo en este documento.

**Orden de lectura.** La lista se recorre de arriba abajo como la historia de uso del sistema: se da de alta la organización, se cargan los jugadores, se crea el torneo, se juega, se cierra. Si alguna feature no encaja en ese relato, está mal ubicada.

**Crónicas automáticas y fotos: fuera de alcance.** Se descartaron por decisión del grupo. Consecuencia a tener presente: quedan dos funcionalidades asistidas por IA confirmadas (F03 y F20) más una condicionada (F19). La cátedra exige integración significativa de IA; dos sólidas alcanzan, pero conviene no perder más.

**Devolución del 25%.** El profesor dijo que la IA no lo convenció y que "lo ideal es que sea todo automático". F03 responde con la importación por excepción y la detección del calendario; si lo que espera es IA en el uso diario, la respuesta es F19. Las preguntas están en [devolucion-25.md](devolucion-25.md) §4.

**Riesgo de alcance.** F08 —los dos cuadros en paralelo— es la feature más pesada del proyecto. Si el cronograma se complica, el cuadro consuelo puede desactivarse por configuración y entregarse solo el cuadro principal, sin modificar ninguna otra feature.
