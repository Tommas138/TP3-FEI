# Dominio: reglas del circuito

> **Fuente de autoridad.** Todo lo de este documento sale del *Reglamento POLENTA Team Tenis* (jul-2026), del ranking real de Tercera 2026 y de las respuestas del organizador. No hay supuestos nuestros salvo donde se aclara explícitamente.
>
> **POLENTA es el cliente de validación, no el molde.** Este documento describe *un* circuito real; [07-configurabilidad.md](07-configurabilidad.md) define qué de esto se parametriza para otras organizaciones y qué queda fijo. Donde una regla es configurable, se indica con **En la plataforma:**.
>
> Los términos que usa este documento son los de POLENTA ("etapa", "Complementaria"). La interfaz usa términos genéricos: ver §0.

---

## 0. Glosario: código ↔ interfaz

Desde la devolución del 25% ([devolucion-25.md](devolucion-25.md), cambios A3 y D), la interfaz no usa los nombres del código ni los de POLENTA. **En código, base de datos y API no se renombra nada** ([decisión 010](decisiones/010-torneo-del-calendario-en-la-interfaz.md)).

| Código / base / API | Interfaz | Ejemplo | Término de POLENTA |
|---|---|---|---|
| `Etapa` | **Torneo del calendario** | "El Primavera" | Etapa |
| `Torneo` | **Edición** (si pertenece a un torneo del calendario) | "Primavera 26 · Tercera" | Torneo, etapa |
| `Torneo` con `etapaId` null | Torneo (suelto) — *decisión abierta 15* | "Abierto de verano" | — |
| `Torneo.edicion` (texto) | Nombre de la convocatoria que agrupa las categorías | "Primavera 2026" | — |
| `Cuadro.COMPLEMENTARIA`, `tieneComplementaria` | **Cuadro consuelo**, nombre configurable | — | Complementaria |
| `Cuadro.CAMPEONATO` | Campeonato — *decisión abierta 16* | — | Campeonato |
| `Categoria` | Categoría | "Tercera" | Categoría |
| `MovimientoRanking` (por `etapaId`) | Puntos de un torneo del calendario | "Primavera 25: 15" | Casillero |
| `Jugador` (de la organización) | Jugador; la lista es el padrón | — | Padrón |

> **Ojo con `Torneo.edicion`.** Es un campo de texto que ya existía y nombra la convocatoria completa ("Primavera 2026", todas las categorías). En la interfaz, en cambio, "edición" es un `Torneo`: una categoría de esa convocatoria. No se renombra el campo; quien lo lea en el código tiene que saber que no es lo mismo que la "edición" de la pantalla.

**Por qué "torneo del calendario".** "Etapa" es un término de POLENTA que fuera del circuito no se entiende: suena a fase de un torneo, no a un torneo que vuelve cada año. "Torneo del calendario" dice lo que es. Como `Torneo` ya existe y es otra cosa (una categoría de una convocatoria), en la interfaz pasa a llamarse "edición": *el Primavera es un torneo del calendario; Primavera 26 · Tercera es una edición*.

---

## 1. Estructura del circuito

```
Circuito (POLENTA)
  └── Categoría (Segunda, Tercera)        ← ranking independiente por categoría
        └── Etapa / Torneo estacional      ← Primavera, Verano, Pretemporada, Otoño, Invierno
              ├── Fase de grupos
              ├── Cuadro Campeonato
              └── Cuadro Complementaria
```

Se juegan **4 torneos estacionales por año más un Master**. Un jugador acumula puntos únicamente en la categoría en la que compite ese torneo.

---

## 2. Acceso al circuito

**En POLENTA es cerrado y por invitación.** Para inscribirse hay que estar aceptado en el grupo de WhatsApp del circuito. El Comité Organizador decide a quién incorpora según comportamiento, nivel de juego u otros criterios, y **no está obligado a explicar un rechazo**.

Consecuencia para POLENTA: no hay registro abierto de jugadores. La organización es dueña de su padrón y decide quién entra; el jugador no se autogestiona el alta.

> **Esto es una elección de POLENTA, no una regla de la plataforma.** El sistema soporta tres modos de inscripción vía `modo_inscripcion` ([07-configurabilidad.md](07-configurabilidad.md) §2.5):
>
> | Modo | Quién se inscribe |
> |---|---|
> | `cerrada` | Solo el padrón. **POLENTA usa este** |
> | `con_aprobacion` | Cualquiera solicita, la organización aprueba |
> | `abierta` | Cualquiera se inscribe pagando |
>
> Otros circuitos pueden querer torneos abiertos, y el sistema los contempla.

**Categoría:** el jugador se inscribe en la que corresponde a su nivel, pero el Comité puede reasignarlo. La premisa del reglamento es que todos los jugadores son conocidos y se tiene referencia de su nivel.

---

## 3. Formato del torneo

### 3.1 Fase de grupos

Grupos de 4 jugadores, todos contra todos. Con 32 inscriptos: 8 grupos.

- **Los 2 primeros de cada grupo** → cuadro **Campeonato**
- **Los 2 últimos de cada grupo** → cuadro **Complementaria**

Nadie queda afuera. El reglamento garantiza un mínimo de 4 partidos por jugador: 3 de zona y al menos 1 de eliminatoria.

**Si no se llena el cupo**, se mantiene la cantidad de grupos y algunos quedan de 3; quien cae en uno de 3 juega 2 partidos de zona. Con menos de 3 por grupo no se sortea. El reglamento no lo define: es una decisión nuestra ([decisión 015](decisiones/015-zonas-con-menos-inscriptos.md)).

**En la plataforma:** el tamaño de los grupos, los clasificados al cuadro principal y si hay cuadro consuelo son parámetros del torneo. El cuadro consuelo es opcional y su nombre es configurable: por defecto "cuadro consuelo"; POLENTA lo llama "Complementaria" ([07](07-configurabilidad.md) §2.1).

### 3.2 Cuadros eliminatorios

Fuera de la fase de grupos **todo es eliminación directa**. Ambos cuadros funcionan igual y corren en paralelo; Complementaria tiene su propio campeón.

**Dónde va cada uno en el cuadro.** El reglamento no lo define: es una decisión nuestra ([decisión 022](decisiones/022-ubicacion-en-el-cuadro.md)). Se arma una siembra única: primero todos los ganadores de zona, ordenados entre zonas con la cascada de §6; después los segundos, y así. Esa siembra se ubica como en cualquier cuadro con cabezas de serie: el 1 y el 2 solo pueden cruzarse en la final. Dentro de cada franja de siembra se aleja a los compañeros de zona: con dos clasificados por zona, quedan en mitades opuestas y solo se cruzan en la final.

**Byes.** Si los clasificados no son potencia de 2 (6 zonas, zonas de 3 en el cuadro consuelo), sobran lugares, y los mejores sembrados pasan a la segunda ronda sin jugar. Ese partido no se crea ([decisión 023](decisiones/023-byes-sin-partido.md)): un cuadro de n jugadores tiene n − 1 partidos, haya byes o no.

### 3.3 Volumen de partidos

Con 32 jugadores en 8 grupos de 4:

| Fase | Partidos |
|---|---|
| Zonas (6 por grupo × 8) | 48 |
| Campeonato (16 jugadores) | 15 |
| Complementaria (16 jugadores) | 15 |
| **Total** | **78** |

> Este número es el que dimensiona el proyecto. Dos cuadros paralelos duplican el motor de eliminatorias y es la razón de la decisión abierta 4 del [README](README.md).

---

## 4. Armado de los grupos

### 4.1 Cómo se hace hoy: sorteo por bombos

Es un **evento social**, no solo un algoritmo: se realiza con integrantes del Comité e invitados presentes, **se graba en video y se comparte** en el grupo de WhatsApp.

Mecánica: un bombo con las letras de grupo y un bombo por cada franja de ranking (cabezas de serie, segundos, terceros, cuartos). Se van tomando pares para asignar cada jugador a un grupo.

En términos algorítmicos equivale a **asignación aleatoria dentro de cada franja de ranking**.

### 4.2 Qué implementa el sistema

El organizador prefiere **serpentina**, pero pidió poder elegir. Se implementan ambos modos vía `modo_distribucion`:

**Serpentina** — la dirección se invierte en cada vuelta. Todos los grupos suman lo mismo:

| Grupo | A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|---|
| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| | 16 | 15 | 14 | 13 | 12 | 11 | 10 | 9 |
| | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 |
| | 32 | 31 | 30 | 29 | 28 | 27 | 26 | 25 |
| **Suma** | **66** | **66** | **66** | **66** | **66** | **66** | **66** | **66** |

**Directa** — se recorre A→H en cada vuelta. El grupo A queda notoriamente más fácil (52) que el H (80).

**Bombos** — aleatorio dentro de cada franja. Replica la mecánica actual.

**Posición de siembra.** Los tres modos parten del mismo orden: los inscriptos de más a menos puntos en el ranking vigente de la categoría. **Los que empatan en puntos se ordenan al azar entre ellos** ([decisión 013](decisiones/013-empates-en-la-siembra.md)); el reglamento no lo define, y los empates son frecuentes porque todo jugador nuevo entra con 0. En un torneo sin ranking todos empatan y el orden entero sale al azar.

**El sorteo como ceremonia es un caso general, no una rareza de POLENTA.** Por eso se parametriza con `modo_sorteo` ([07-configurabilidad.md](07-configurabilidad.md) §2.1):

- `automatico` — el sistema sortea y publica
- `asistido` — sortea en pantalla con animación, para proyectar durante la reunión
- `manual` — la organización carga a mano el resultado del sorteo físico

> El modo `manual` respeta la tradición existente sin obligar a nadie a cambiarla, y es el más simple de programar. Debería implementarse primero.

---

## 5. Sistema de juego

Estas reglas afectan directamente al modelo de datos del partido.

- **Modalidad:** single. No hay dobles.
- **Partidos al mejor de 3 sets.**
- **Punto de oro:** al llegar a 40-40 se juega un punto único, sin ventajas.
- **Set:** a 6 games, con tie-break a 7 puntos sin diferencia. Si el tie-break llega a 6-6, se juega un punto más para definirlo.
- **Tercer set:** no se juega. Con 1 set por lado se define por **super tie-break a 10 puntos**, sin diferencia; si llega a 9-9, un punto más.

**Implicancias de modelado:**

- Un `Set` puede ser un set normal o un super tie-break. Hay que distinguirlos con un flag.
- Para el cómputo de desempates: **el super tie-break cuenta como 1 set y además como 1 game**. El tie-break cuenta como 1 game.
- Los partidos tienen **2 o 3 sets**, nunca más.

---

## 6. Orden clasificatorio y desempates

Cascada lineal. **Vale el primer criterio que rompa la igualdad.**

| # | Criterio |
|---|---|
| 1 | Partidos ganados (1 punto por partido ganado) |
| 2 | Cantidad de sets ganados |
| 3 | Diferencia entre sets ganados y perdidos |
| 4 | Cantidad de games ganados |
| 5 | Diferencia entre games ganados y perdidos |
| 6 | Ganador del partido entre ambos (solo dentro del grupo) |
| 7 | Para comparar **entre grupos**: mayor ranking al inicio del torneo |

> **Nota de implementación:** el enfrentamiento directo va **anteúltimo**, no segundo. Al estar tan abajo en la cascada, los empates circulares (A gana a B, B a C, C a A) ya quedaron resueltos por los criterios de sets y games. Esto simplifica bastante el algoritmo respecto de otros formatos.

**Lo que el criterio 6 no resuelve.** El enfrentamiento directo solo desempata entre dos jugadores. Si llegan empatados tres o más, o si los dos todavía no jugaron entre ellos, se pasa al criterio 7 también dentro del grupo: va primero el mejor rankeado al inicio del torneo, que es su posición de siembra. El reglamento no lo define: es una decisión nuestra ([decisión 017](decisiones/017-empates-que-el-enfrentamiento-directo-no-resuelve.md)).

El mismo procedimiento se usa para comparar entre grupos cuando hay que definir, por ejemplo, un "mejor tercero" para ubicar posiciones en los cuadros. Entre grupos no hay partido entre ambos: se salta el criterio 6.

**Grupos de distinto tamaño.** Si no se llenó el cupo y se comparan grupos de 4 con grupos de 3, en cada grupo de 4 se descarta el partido contra el último, para que todos comparen la misma cantidad de partidos. Es lo que hacen la FIFA y la UEFA con grupos desiguales. El reglamento no lo define: es una decisión nuestra ([decisión 018](decisiones/018-comparar-zonas-de-distinto-tamano.md)).

**En la plataforma:** la cascada es fija en v1, porque coincide con la práctica habitual ([07](07-configurabilidad.md) §3). Al ser una lista de comparadores, reordenarla para otro circuito es cambiar un array.

**Se implementa como una lista ordenada de comparadores.** Es el único lugar del proyecto donde los tests unitarios se pagan solos: los casos borde son numerosos y no se verifican a mano de forma confiable.

---

## 7. Ranking

### 7.1 Contexto: es el modelo de la ATP

Antes del detalle, algo que importa para el diseño: **este modelo no es una particularidad de POLENTA.** Es el mismo mecanismo del ranking ATP y WTA, y el que usan la mayoría de los circuitos amateur.

En la ATP el ranking suma los puntos de las últimas 52 semanas, y cuando un torneo vuelve al calendario los puntos del año anterior caducan y se reemplazan por los nuevos. De ahí la expresión *"defender puntos"*.

La diferencia con POLENTA es solo de escala: la ATP calcula sobre los 19 mejores resultados con torneos obligatorios y opcionales; POLENTA cuenta sus 5 etapas completas. La lógica de reemplazo es idéntica.

> La otra familia de rankings de tenis son los **ratings tipo Elo** (UTR es el caso conocido), donde el número sube o baja según a quién le ganaste y por cuánto. Más justo en teoría, pero opaco para el jugador y necesita mucho volumen de partidos para estabilizarse. Ningún circuito amateur relevado lo usa.

### 7.2 Cómo funciona: reemplazo por casillero

**No es una suma rodante de los últimos 12 meses.** Es un conjunto de casilleros, uno por etapa del calendario (en la interfaz, uno por **torneo del calendario**). Cuando se juega una etapa, sus puntos **reemplazan** a los de esa misma etapa del año anterior.

> Torneo Primavera 2026 reemplaza los puntos de Torneo Primavera 2025.

El acumulado es la **suma de los casilleros vigentes**. Verificación contra el ranking real de Tercera 2026:

| Jugador | Prim 25 | Ver 25/26 | Pretemp 26 | Otoño 26 | Inv 26 | Acumulado |
|---|---|---|---|---|---|---|
| German Fernández | 10 | 15 | 50 | 15 | 75 | **165** |
| Diego Jacinto | 15 | 10 | 10 | 50 | 25 | **110** |
| Juan Maffei | 0 | 0 | 100 | 0 | 0 | **100** |

En los tres casos el acumulado es la suma exacta de los casilleros.

**Por qué importa la distinción.** Una ventana rodante de 12 meses daría casi el mismo resultado, pero se rompe en el borde: al jugarse Primavera 26, si Primavera 25 todavía está dentro de los 12 meses, ambas sumarían por unos días. El reemplazo por casillero es determinista siempre.

### 7.3 Modelo de datos propuesto

`MovimientoRanking` con `jugador_id`, `categoria_id`, `etapa_id`, `puntos`, `motivo`, `fecha`.

El ranking vigente se calcula así: **por cada casillero de etapa, tomar el movimiento más reciente; sumar todos los casilleros.**

Ventajas de guardar movimientos en vez de un campo `puntos` mutable:

- **Auditable:** el jugador ve de qué torneo salió cada punto, igual que en la planilla actual
- **Reversible:** si se corrige un resultado, se revierte el movimiento
- **Sin desincronización:** no hay un valor que pueda quedar inconsistente

### 7.4 Tabla de puntos

| Instancia | Fase | Puntos |
|---|---|---|
| Campeón | Campeonato | 100 |
| Finalista | Campeonato | 75 |
| Semifinalista | Campeonato | 50 |
| Cuartos de final | Campeonato | 25 |
| Octavos de final | Campeonato | 15 |
| Participación | Complementaria | 10 |

Todo jugador que completa la fase de grupos y no clasifica a Campeonato recibe **10 puntos**.

**En la plataforma:** la tabla de puntos es configurable por organización, y una organización sin ranking no la necesita ([07](07-configurabilidad.md) §1).

### 7.5 Jugadores nuevos

**Entran con 0 puntos.** No hay estimación de nivel ni puntos provisionales.

Le toma aproximadamente **4 torneos** alcanzar a la mayoría del ranking, simplemente por cantidad de torneos jugados.

> Esto simplifica el diseño: se descartan la posición de ingreso estimada y los movimientos provisionales que estaban previstos en versiones anteriores.

### 7.6 Alcance

Cada categoría tiene su **ranking independiente**. Un jugador acumula puntos solo en la categoría en la que juega cada torneo.

> **Pendiente:** qué ocurre con los puntos previos cuando un jugador cambia de categoría. El reglamento no lo aclara. Ver decisión abierta 7 del [README](README.md).

---

## 8. Plazos y coordinación

### 8.1 Cronograma

| Instancia | Plazo |
|---|---|
| Fase de grupos | 3 semanas |
| Cada ronda eliminatoria | 1 semana |

El cronograma se anuncia al convocar el torneo y **debe cumplirse sin excepción**, para no postergar las instancias siguientes ni obligar a otros a jugar partidos muy seguidos.

### 8.2 Los jugadores coordinan entre ellos

**Todos los partidos los arreglan los jugadores**, dentro del plazo de su instancia. La organización no asigna horarios.

Los turnos pactados y sus reprogramaciones **deben quedar registrados en el grupo de WhatsApp** una vez confirmados por ambos. Ese registro manual es exactamente lo que la plataforma reemplaza.

### 8.3 Reprogramación

Se admite **una sola reprogramación** por partido, avisando con al menos **24 horas** de anticipación. Motivos habituales: viaje o enfermedad.

Si se avisa con menos de 24 horas, o si el otro jugador no puede reprogramar, **quien no puede cumplir debe dar W.O.**

**En la plataforma:** los plazos, la cantidad de reprogramaciones y la antelación son parámetros del torneo ([07](07-configurabilidad.md) §2.3).

### 8.4 Partidos no coordinados

Quien no logre coordinar dentro del plazo debe dar W.O., y gana quien estuvo disponible. Si no hay acuerdo sobre quién fue, **el Comité Organizador decide**: puede dar por ganador a quien estuvo disponible más días, o aplicar otro criterio según el caso.

En la práctica actual se flexibiliza: agregan días o acomodan la fecha.

> Para el sistema: la resolución de un partido no jugado **no es automática**. Se le presenta el caso a la organización con el historial de coordinación (quién propuso qué, quién no respondió) y ella decide.

### 8.5 Cómputo del W.O.

**6-0 6-0 a favor del rival.** Esto resuelve limpiamente el impacto en los criterios de desempate por sets y games.

---

## 9. Sedes y costos de cancha

| Fase | Dónde se juega | Quién paga la cancha |
|---|---|---|
| Grupos | Donde los jugadores prefieran | Los jugadores |
| Eliminatorias | Club designado por la organización | La organización |

Consecuencia: **un torneo es multisede en fase de grupos** — cada partido puede jugarse en un club distinto, elegido por los dos jugadores. En eliminatorias hay sede única.

**En la plataforma:** sede libre o designada, por fase ([07](07-configurabilidad.md) §2.4).

> **Decisión abierta 2:** desde qué instancia exactamente paga la organización. El reglamento dice "fases de Campeonato y Complementaria", la respuesta 9 dice cuartos de final y la 23 dice octavos.

---

## 10. Reporte de resultados

**Hoy:** al terminar el partido, alguno de los dos jugadores manda un mensaje al grupo de WhatsApp con el resultado. **No hay planilla de papel.** El organizador lo ve en el grupo y lo anota en su Excel.

Además, el reglamento de POLENTA **obliga a enviar un registro fotográfico de ambos jugadores** junto con el resultado.

> **Esto es regla interna del circuito, no requisito de la plataforma.** El sistema permite adjuntar fotos a un partido de forma **opcional**; si un circuito quiere obligar, lo hace su propio reglamento. Cuando la foto está, la crónica automática la usa ([06-ia.md](06-ia.md) §3). Ver [07-configurabilidad.md](07-configurabilidad.md) §4.

---

## 11. Inscripciones

### 11.1 Cómo funciona hoy

1. Se publica una encuesta en el grupo de WhatsApp para medir interesados por categoría
2. El jugador transfiere el importe
3. Envía el comprobante indicando la categoría
4. **Recién ahí queda inscripto**

El cupo se asigna **por orden de confirmación**. Quienes quedan afuera pasan a una **lista de espera**, ordenada por llegada, que cubre deserciones.

Si al cerrar las inscripciones hay jugadores que no pagaron, se los consulta para que lo hagan en un plazo prudencial; si no cumplen, se pasa a la lista de espera con el mismo criterio.

### 11.2 Qué incluye la inscripción

- Un tubo de pelotas nuevas por jugador, para usar en los partidos del torneo
- Costo de las canchas en las fases eliminatorias
- Asado de camaradería al cierre del torneo
- Premios

**Importe actual:** $45.000 ARS. **Medio de pago actual:** transferencia bancaria únicamente.

### 11.3 Qué mejora la plataforma

El circuito de "transferir → sacar foto del comprobante → mandarlo → esperar que alguien lo verifique a mano" se reemplaza por un checkout que confirma solo. Es una mejora directa sobre el proceso actual, no una funcionalidad teórica.

También se modela la **lista de espera**, que hoy se lleva a mano.

**En la plataforma:** quién puede inscribirse, el importe, la lista de espera y los minutos de reserva son parámetros del torneo ([07](07-configurabilidad.md) §2.6).

---

## 12. Convocatoria del torneo

Al anunciar cada torneo, la organización define:

- Información general
- Categorías a disputar y cupo de cada una
- Importe de inscripción e información de pago
- Formato de juego
- Fecha de cierre de inscripción
- Cronograma de fechas por instancia

Esta lista es el formulario de creación del torneo en el sistema.

---

## 13. Camaradería

Al final de cada torneo hay un asado con entrega de premios. Está incluido en la inscripción.

> No requiere desarrollo, pero es un dato de identidad del circuito que vale la pena reflejar en la ficha pública del torneo.
