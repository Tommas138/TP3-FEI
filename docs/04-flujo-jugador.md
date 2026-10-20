# Flujo del jugador

> Reglas de negocio en [02-dominio.md](02-dominio.md).

---

## 1. Principio: leer es público, escribir requiere cuenta

**Consultar información no exige cuenta.** Ranking, ficha de jugador, historial, cuadros, zonas, calendario y crónicas son páginas públicas accesibles por link. La organización comparte la URL en el grupo de WhatsApp donde ya se comunican, el jugador la toca y ve lo que necesita.

**Solo las acciones exigen cuenta.** Inscribirse, pagar y coordinar fechas requieren autenticación — y ahí la fricción está justificada, porque el jugador está haciendo algo que quiere hacer.

> **Por qué:** el público del circuito es mayoritariamente gente adulta acostumbrada a coordinar por WhatsApp. Pedirles registro solo para ver su ranking es fricción que abandonarían.
>
> Validado externamente: las tres plataformas relevadas ([01-vision.md](01-vision.md) §3) resuelven la consulta sin autenticación.

---

## 2. Principio de mínima carga

**Al jugador se le pide lo mínimo indispensable. Su trabajo es jugar.**

| Se le pide | No se le pide |
|---|---|
| Inscribirse y pagar — es lo que quiere hacer | Cargar resultados |
| Coordinar fecha con su rival — **ya lo hace hoy** por WhatsApp | Actualizar su perfil o su ranking |
| | Reclamar perfiles o verificar identidad |

La distinción clave: coordinar la fecha **no es carga nueva**. El reglamento ya obliga a registrar los turnos pactados en el grupo de WhatsApp; la app solo cambia dónde queda ese registro y lo vuelve consultable.

---

## 3. Pantallas públicas

| Pantalla | Contenido |
|---|---|
| Ranking del circuito | Tabla por categoría, con el desglose por torneo del calendario, como el Excel actual |
| Ficha del jugador | Historial de partidos, torneos disputados, evolución |
| Head-to-head | Comparación entre dos jugadores |
| Cuadros y zonas | Cuadro principal y, si hay, cuadro consuelo, en vivo |
| Calendario | Partidos acordados por fecha |

Se accede por link directo, sin sesión. **No exponen datos de contacto.** La búsqueda de jugador es **por apellido**, no un listado completo del padrón.

---

## 4. Registro y vinculación

En modo `cerrada` —el de POLENTA— **el jugador ya existe en el padrón antes de tener cuenta**: el registro no lo crea, lo conecta con su perfil. En modo `abierta` ocurre al revés: el perfil se crea al inscribirse, con 0 puntos.

El registro ocurre **en el momento de inscribirse a un torneo**, no antes. Datos: nombre, apellido, email y contraseña.

| Situación | Resolución |
|---|---|
| Un solo perfil compatible por apellido | Vinculación directa, confirmada por el jugador |
| Varios perfiles compatibles | Elige de una lista con nombre y categoría — sin datos de contacto |
| Ninguno compatible | En modo `cerrada` no debería ocurrir; se deriva a la organización. En modo `abierta` se crea un perfil nuevo con 0 puntos |

La organización **ve y puede revertir** las vinculaciones desde su panel. En un circuito cerrado como POLENTA el riesgo es bajo —todos se conocen y nadie gana nada apropiándose del historial ajeno—; en un circuito abierto la revisión de la organización pasa a ser más relevante.

> **Estado:** el lado de la organización ya está: el padrón marca los perfiles con cuenta y permite desvincularlos (`DELETE /jugadores/:id/cuenta`). La creación de la cuenta y la elección del perfil llegan con F12 ([decisión 007](decisiones/007-vinculacion-de-cuentas-en-f02.md)).

### 4.1 Ingreso a la app

Quien ya tiene cuenta entra a la app con su email y su contraseña, por `POST /api/auth/ingreso-jugador`, distinto del ingreso de la web ([decisión 039](decisiones/039-ingreso-del-jugador.md)). La misma cuenta puede administrar una organización desde la web y jugar desde la app.

- **Un perfil por circuito.** Si juega en varios, elige en cuál entrar y la app lo recuerda. Para cambiar, toca el nombre del circuito en el encabezado, donde también está "Cerrar sesión" ([decisión 040](decisiones/040-jugador-en-varios-circuitos.md)).
- **La sesión queda guardada en el celular**, cifrada, y dura 7 días como en la web ([decisión 041](decisiones/041-sesion-en-el-celular.md)).
- **Sin sesión, la app solo muestra el ingreso.** La consulta sin cuenta es la de la web, por link ([decisión 042](decisiones/042-la-app-sin-sesion.md)).
- **Quien solo administra** recibe un aviso para entrar por la web.

> **Estado:** implementado en la app para el 50%, con la cuenta de prueba del seed. Recuperar la contraseña desde la app todavía no: el link del mail abre la web.

> **Descartado:** verificación por SMS y flujo de reclamo de perfiles. Resolvían un riesgo bajo en los circuitos amateur, donde los jugadores se conocen (POLENTA: 77 personas), y la revisión de la organización ya cubre el caso raro.

---

## 5. Inscripción a un torneo

> **Sección en diseño.** El flujo por link con DNI es la propuesta actual; ver puntos abiertos al final.

### 5.1 Quién puede inscribirse

Depende del `modo_inscripcion` del torneo ([07-configurabilidad.md](07-configurabilidad.md) §2.5). En POLENTA es `cerrada`: **solo jugadores que ya están en el padrón**.

Distinción importante que conviene no mezclar:

| | Quién |
|---|---|
| Ver ranking, cuadros, fichas, crónicas | Cualquiera, sin cuenta |
| **Inscribirse a un torneo** | Solo quien está en el padrón (modo `cerrada`) |

Público para **leer** no es público para **inscribirse**.

### 5.2 Cómo entra un jugador nuevo al circuito

Depende del modo. En `cerrada` —el de POLENTA— **lo agrega la organización**, no hay autoservicio. En `abierta`, el perfil se crea solo al inscribirse. El diagrama siguiente describe el modo `cerrada`.

```
La organización lo da de alta en el padrón (0 puntos)
        |
        v
Se inscribe a un torneo
        |
        v
Juega
        |
        v
Al cerrar el torneo, gana puntos según instancia alcanzada
        |
        v
Sube en el ranking
```

**Nunca hay un momento en que alguien "se agrega al ranking".** El ranking es consecuencia de haber jugado. Un jugador nuevo figura en la tabla con 0 puntos desde que está en el padrón, y sube cuando compite.

**Inscribirse no otorga puntos.** Los puntos los da la instancia alcanzada al cerrar el torneo. Alguien puede anotarse a cinco torneos y su ranking no se mueve hasta que juegue.

### 5.3 Flujo propuesto: link con DNI

El objetivo es que inscribirse no requiera crear cuenta ni recordar contraseña. La organización comparte un link del torneo en el grupo de WhatsApp donde ya se comunican.

**Camino normal, el DNI ya está asociado:**

```
Link -> ingresa DNI -> match con su perfil del padrón -> paga -> inscripto
```

**Primera vez, el DNI todavía no está en el padrón:**

El padrón actual de POLENTA **no tiene DNI cargado**, así que la primera inscripción de cada jugador pasa por acá:

```
Link -> ingresa DNI -> sin coincidencia
     -> ingresa nombre y apellido
     -> elige su perfil de una lista de coincidencias
     -> paga -> inscripto
     -> el DNI queda asociado a ese perfil
```

De la segunda inscripción en adelante, ese jugador entra por el camino normal. La lista de coincidencias muestra **solo nombre y categoría**, nunca datos de contacto ni puntos.

### 5.4 Cómo se conecta el pago con la base de datos

**Distinción central: `Jugador` y `Usuario` son entidades distintas.**

| Entidad | Qué es | Cuándo existe |
|---|---|---|
| `Jugador` | Perfil del padrón: categoría, puntos, historial. **Es la entidad del dominio** | Antes de que la persona toque nada. La crea la organización |
| `Usuario` | Solo credencial de acceso: email y contraseña | Opcional, después del pago |

**La inscripción se vincula al `Jugador`, no al `Usuario`.** Por eso el flujo funciona sin cuenta: el `Jugador` ya existía en el padrón.

```prisma
model Jugador {
  id             Int      @id @default(autoincrement())
  nombre         String
  apellido       String
  dni            String?              // se completa en la 1ra inscripción
  organizacionId Int
  categoriaId    Int
  usuarioId      Int?     @unique     // opcional, si crea cuenta
  usuario        Usuario? @relation(fields: [usuarioId], references: [id])
  inscripciones  Inscripcion[]

  @@unique([organizacionId, dni])
}

model Inscripcion {
  id           Int       @id @default(autoincrement())
  jugadorId    Int                    // <- la conexión
  torneoId     Int
  estado       String                 // pendiente_pago | pagada | expirada
  reservaVence DateTime?
  jugador      Jugador   @relation(fields: [jugadorId], references: [id])
  pago         Pago?
}

model Usuario {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  jugador      Jugador?
}
```

### 5.5 La secuencia, fila por fila

**Estado inicial** tras importar el padrón:

```
Jugador { id: 42, nombre: "German", dni: null, usuarioId: null }
```

| Paso | Qué ocurre en la base |
|---|---|
| Ingresa DNI 30123456 | Busca `Jugador where dni = '30123456'`. Sin coincidencia |
| Elige su nombre de la lista | `Jugador[42].dni = "30123456"` |
| Inicia el pago | `Inscripcion { id: 100, jugadorId: 42, torneoId: 7, estado: "pendiente_pago" }` |
| Va a MercadoPago | Preferencia con `external_reference = 100` |
| Llega el webhook | `Inscripcion[100].estado = "pagada"` + `Pago { inscripcionId: 100, ... }` |
| (Opcional) crea cuenta | `Usuario { id: 5, ... }` y `Jugador[42].usuarioId = 5` |

**La cadena completa:**

```
Pago  ->  Inscripcion  ->  Jugador  ->  (opcional) Usuario
```

> **El vínculo no depende de quién pagó.** Si el jugador paga con la cuenta de MercadoPago de otra persona, no importa: la inscripción ya sabía a qué `jugadorId` pertenecía desde antes de ir al checkout. El `external_reference` es el hilo conductor, no la identidad del pagador.
>
> Esa es la razón de fondo para crear la inscripción **antes** del pago y no después.

### 5.6 La cuenta es opcional y viene después del pago

Al terminar el pago, el jugador queda inscripto **sin tener cuenta**. Recién ahí se le ofrece crearla:

```
DNI -> paga -> "Listo, estás inscripto"
            -> "¿Querés ver tus partidos en la app? Creá tu contraseña"
```

Dos razones:

- **La inscripción nunca se bloquea** por no tener cuenta. Respeta el principio de mínima carga (§2)
- **Es el mejor momento para ofrecer la app**: el jugador acaba de comprometerse con el torneo, es cuando más motivado está

Quien no quiera cuenta se queda con las pantallas públicas y no pierde nada, salvo notificaciones push y coordinación dentro de la app.

### 5.7 Reserva de cupo y lista de espera

1. Al iniciar el pago se crea la inscripción en `pendiente_pago` con **reserva de cupo** por los minutos que configure el torneo (por defecto, 15)
2. Confirmado el webhook, queda `pagada`
3. Si el cupo está lleno, puede sumarse a la **lista de espera**; si alguien se baja, se le notifica y se le habilita el pago

Detalle en [05-pagos.md](05-pagos.md).

### 5.8 Tratamiento del DNI

El DNI es dato personal sensible en Argentina:

- Se almacena **encriptado**, nunca en texto plano
- **No aparece en ninguna pantalla pública** ni en respuestas de la API destinadas a otros jugadores
- Solo la organización dueña del padrón puede verlo

> Alternativa evaluada: usar el **email** como identificador, que MercadoPago devuelve en el webhook sin necesidad de pedirlo. Ventaja: dato menos sensible y no hay que solicitarlo. Desventaja: algunos proveedores reciclan direcciones de cuentas borradas.
>
> El riesgo del email reciclado es despreciable acá: requiere que la dirección se libere, que alguien la registre, **y que esa persona justo quiera inscribirse a ese mismo circuito** (en POLENTA, 77 personas en Neuquén). Ambas opciones son razonables; la decisión está abierta.

### 5.9 Puntos abiertos de esta sección

- ¿DNI o email como identificador? (ver §5.8)
- ¿Qué pasa si el jugador tipea mal su DNI y coincide con otro del padrón?
- **Red de seguridad definida:** la organización ve y puede revertir cualquier vinculación desde su panel. En un circuito donde los jugadores se conocen entre sí, como POLENTA, ninguna llave técnica es tan confiable como el organizador mirando la lista. El sistema debe hacer que el caso normal sea automático y el caso raro, fácil de corregir a mano

## 6. Coordinación de partidos

Todos los partidos los arreglan los jugadores dentro del plazo de su instancia ([02-dominio.md](02-dominio.md) §8). La organización no asigna horarios.

### 6.1 Alcance: registrar, no negociar

**La app es donde queda registrada la fecha, no donde se negocia.**

Los jugadores siguen coordinando por WhatsApp, que es lo que hacen hoy y funciona. Lo que falta no es una mejor forma de negociar: es que lo acordado quede en algún lado consultable, en vez de perderse en el scroll del grupo.

Muchos circuitos ya exigen registrar los turnos pactados: el reglamento de POLENTA, por ejemplo, obliga a hacerlo en el grupo de WhatsApp. La app resuelve ese mismo requisito mejor.

> **Descartado:** sistema de propuestas y contrapropuestas con ida y vuelta dentro de la app. Es varias veces más trabajo y compite con WhatsApp, que ya funciona y no tiene sentido reemplazar.

### 6.2 El flujo

1. Los dos jugadores acuerdan por WhatsApp, como siempre
2. **Cualquiera de los dos** anota la fecha, hora y club en la app
3. El rival recibe una notificación y **confirma** con un toque
4. Ambos ven el partido agendado y reciben recordatorio

En fase de grupos el club lo eligen ellos. En eliminatorias la sede está fijada por la organización y solo se acuerda fecha y hora.

### 6.3 Por qué existe la confirmación

Una fecha pactada tiene consecuencias: si no se juega, alguien debe dar W.O. Si un jugador anota una fecha y el otro nunca se enteró, después no hay forma de determinar quién incumplió.

La confirmación deja constancia de que ambos supieron. Es el mismo propósito que persigue el reglamento al exigir el registro en el grupo, resuelto mejor.

Para el jugador es un toque sobre una notificación, así que no vulnera el principio de mínima carga (§2).

### 6.4 Ciclo de vida del partido

```
pendiente  ->  anotada  ->  confirmada  ->  jugada
                                         -> vencida
```

| Estado | Significa |
|---|---|
| `pendiente` | Nadie cargó fecha todavía |
| `anotada` | Uno cargó la fecha, falta que el rival confirme |
| `confirmada` | Ambos al tanto. Cuenta como turno pactado |
| `jugada` | Resultado cargado |
| `vencida` | Se acabó el plazo sin jugarse. Resuelve la organización |

**Reprogramación:** la cantidad permitida y la antelación son parámetros del torneo ([07](07-configurabilidad.md) §2.3); en POLENTA, una sola y con 24 horas. Vuelve el partido a `anotada`.

### 6.5 Nota de implementación

La confirmación se modela **desde el schema**, aunque la interfaz inicial pueda no usarla:

```prisma
model Partido {
  fechaAcordada    DateTime?
  clubId           Int?      // en zonas lo eligen los jugadores
  anotadaPorId     Int?      // quién cargó la fecha
  confirmadaPorId  Int?      // null = todavía sin confirmar
  fechaLimite      DateTime  // vence el plazo de la instancia
}
```

Con la confirmación desactivada, `anotada` es el estado previo a jugar y `confirmadaPorId` queda en null. Activarla después es un botón en la app y una línea en el endpoint — **sin migración**.

> Dos columnas nullables cuestan nada ahora y evitan reescribir la lógica de coordinación más adelante.

### 6.6 Contacto entre rivales

Los rivales de zona pueden ver el teléfono del jugador, con aviso previo. Nadie más. Para hablar, un botón que abra WhatsApp con el rival: **no se construye un chat.**

**Implementado:** la API da el teléfono solo al rival de un partido que todavía no se jugó ([decisión 046](decisiones/046-telefono-del-rival.md)). El aviso previo todavía no existe.

## 7. Mis partidos

Vista principal durante el torneo: próximo partido con rival, club, día y hora. Partidos pendientes de coordinar con su plazo. Historial del torneo en curso.

Notificación push al generarse el fixture, al acordarse una fecha y como recordatorio previo al partido.

**Implementado** ([decisión 047](decisiones/047-avisos-push.md)): el fixture llega por push al confirmarse el sorteo; el recordatorio lo programa el celular un día antes de cada partido con fecha. El de la fecha acordada llega con F14.

---

## 8. Zona y cuadros

Tabla de posiciones del grupo en vivo, con la línea de corte marcada — arriba clasifican al cuadro principal, abajo al cuadro consuelo si el torneo lo tiene. Los cuadros son navegables.

---

## 9. Ranking e historial

- Ranking de su categoría, con su posición destacada
- **Desglose por torneo del calendario**, igual que la planilla actual, mostrando qué edición aportó cada puntaje
- Historial completo de partidos con head-to-head

---

## 10. Reparto web / móvil

| Funcionalidad | Web | Móvil |
|---|---|---|
| Ver ranking, ficha, cuadros, calendario (**público**) | ✓ | ✓ |
| Registro y login | ✓ | ✓ |
| Gestionar padrón e importar Excel | ✓ | — |
| Crear y configurar torneo | ✓ | — |
| Gestionar inscripciones y lista de espera | ✓ | — |
| Sorteo y generación de zonas | ✓ | — |
| Tablero de avance | ✓ | — |
| Cargar resultados | ✓ | — |
| Inscribirse y pagar | — | ✓ |
| Coordinar fechas | — | ✓ |
| Mis partidos | ✓ | ✓ |
| Notificaciones push | — | ✓ |

La app móvil es **obligatoria** para grupos de 3 y no puede ser una web responsive. Su razón de existir es el flujo del jugador: inscripción, coordinación y consulta.
