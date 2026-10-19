# Diseño

Sistema visual de SetPoint. Esta es la fuente de verdad para todo lo que se dibuje en la web y en la app: si algo no está acá, se resuelve con los tokens y componentes que sí están, no inventando uno nuevo.

Las pantallas de referencia están en el canvas **SetPoint — Verde pelota**, dividido en tres páginas: Jugador, Organizador y Público.

---

## 1. Los dos contextos de uso

Todo el sistema sale de que hay dos personas usando esto en situaciones opuestas.

| | Organizador | Jugador |
|---|---|---|
| Dónde | Escritorio | Celular |
| Cuándo | Sentado, con tiempo | Parado afuera del club, al sol, antes de jugar |
| Qué necesita | Densidad y escaneo: 78 partidos, 8 zonas, tablas | Una sola cosa por pantalla, tipografía grande, contraste alto |
| Trabajo principal | "Qué partidos faltan y a quién apurar" | "Cuándo juego, contra quién y dónde" |

**Es el mismo sistema con dos densidades, no dos diseños.** Los mismos colores, la misma tipografía, los mismos componentes; cambian las escalas.

---

## 2. Principios

1. **El color no decora.** El lima marca tres cosas y nada más: lo que ganaste, lo que sos vos, y la acción principal. Si aparece en un cuarto lugar, algo está mal.
2. **Un objeto gráfico, repetido.** La barra de marcas es la misma en el tablero, en la landing y en el cupo de inscripciones. La matriz de zona es la misma para el jugador y para el organizador. Nadie tiene que aprender dos lenguajes.
3. **El número se lee antes que la etiqueta.** Todo dato numérico va en mono y con más peso visual que su rótulo.
4. **Decir qué va a pasar antes de que pase.** Antes de guardar un resultado, la pantalla dice quién queda primero y quién va al cuadro consuelo. Antes de pagar, dice que el lugar se reserva 15 minutos.
5. **Bordes, no sombras.** La jerarquía la dan el borde de 1px, el fondo negro y el espacio. No hay `box-shadow` en el sistema.
6. **Sentence case siempre.** Ni títulos ni botones ni etiquetas en mayúsculas. Los rótulos en mono minúscula (`pg`, `sets`, `zona D`) son la única excepción y son parte del acabado.

---

## 3. Color

### Tokens

| Token | Hex | Para qué |
|---|---|---|
| `--lima` | `#CDF546` | Acento único. Acción principal, victoria, "vos", torneo del calendario en curso |
| `--lima-tenue` | `#F7FCE7` | Fondo de celda ganada en matrices y tablas |
| `--negro` | `#0A0B0D` | Texto principal, superficies oscuras, botones secundarios sólidos |
| `--carbon` | `#17191D` | Celdas dentro de una superficie negra, ítem activo de la navegación |
| `--borde-oscuro` | `#2C3037` | Bordes y separadores sobre una superficie negra |
| `--gris-700` | `#3F4348` | Texto secundario sobre blanco |
| `--gris-500` | `#6A7079` | Rótulos, texto de apoyo |
| `--gris-400` | `#9BA1A9` | Texto sobre negro, datos apagados, perdedor en una tabla |
| `--gris-300` | `#C9CDD3` | Borde de campo de formulario, celda punteada |
| `--linea` | `#E6E8EB` | Borde de tarjeta y separador |
| `--linea-suave` | `#F1F2F4` | Separador entre filas de tabla |
| `--fondo` | `#F6F7F8` | Fondo de página secundario, cajas de ayuda |
| `--fondo-tabla` | `#FAFBFC` | Encabezado de tabla, pie de tarjeta |
| `--blanco` | `#FFFFFF` | Superficie principal |
| `--rojo` | `#E5484D` | Solo vencimientos. Marcas y rellenos |
| `--rojo-texto` | `#C62A2F` | El mismo rojo para texto (el otro no llega a 4.5:1) |
| `--rojo-fondo` | `#FEF6F6` | Fondo de fila o tarjeta vencida |
| `--rojo-linea` | `#F3D3D4` | Borde de lo anterior |

### Reglas

- **El lima nunca es texto sobre blanco.** No llega al contraste mínimo. Sobre negro sí (17:1), y ahí es donde vive: números grandes, chips, el punto del logo.
- **El rojo solo significa vencimiento.** No se usa para "error de formulario" ni para eliminar. Un partido que venció sin jugarse es lo único urgente del sistema.
- **La derrota se dibuja en gris, no en rojo.** En tablas y matrices, el ganador va en `--negro` con peso 600 y el perdedor en `--gris-400`.
- **Contrastes verificados:** negro sobre blanco 19:1, `--gris-500` sobre blanco 5.3:1, blanco sobre negro 19:1, `--gris-400` sobre negro 7.4:1, negro sobre lima 17:1.

---

## 4. Tipografía

Dos familias, de Google Fonts:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap">
```

- **Instrument Sans** — interfaz, nombres, títulos, copy. Pesos 400 / 500 / 600. El 700 casi no se usa.
- **Geist Mono** — **todo número**: marcadores, puntos, plazos, horarios, importes, fechas cortas, rótulos de columna. Siempre con `font-variant-numeric: tabular-nums`.

```css
.mono {
  font-family: "Geist Mono", ui-monospace, "SF Mono", Consolas, monospace;
  font-variant-numeric: tabular-nums;
}
```

El mono es lo que da el acabado de producto y lo que hace que las tablas queden alineadas sin trabajo extra.

### Escala móvil (390 de ancho)

| Uso | Tamaño | Peso | Tracking |
|---|---|---|---|
| Nombre del rival, título de pantalla | 34–38 | 600 | −0.032em |
| Título de sección | 20 | 600 | −0.025em |
| Dato principal (nombre en lista) | 17–19 | 500 | — |
| Cuerpo | 16–17 | 400 | — |
| Rótulo | 15 | 500 | — |
| Mono grande (puntos, marcador) | 24–52 | 500 | −0.02 a −0.04em |
| Mono chico (fecha, zona, rótulo de casillero) | 15 | 400/500 | — |

**Piso duro: 15px.** Ningún texto baja de ahí en móvil, y los datos van de 17 para arriba. Las pantallas de referencia del jugador tienen rótulos de 10 a 14: al implementarlas suben a 15. Si algo no entra, se reorganiza, como los casilleros del ranking, que van sin el año.

### Escala escritorio (1280)

| Uso | Tamaño | Peso |
|---|---|---|
| Título de página | 30 | 600 |
| Título de sección | 17–20 | 600 |
| Fila de tabla | 14–15 | 400/500/600 |
| Rótulo de columna (mono) | 11–12 | 400 |
| Cuerpo / ayuda | 13–15 | 400 |

---

## 5. Medidas

| | Móvil | Escritorio |
|---|---|---|
| Alto de toque / botón principal | **56** | 40–44 |
| Botón secundario | 52 | 34–36 |
| Alto de fila de lista | 52–60 | 38 (denso) / 56–64 (con acción) |
| Padding lateral de pantalla | 16–18 | 28 |
| Separación entre bloques | 18–22 | 16–24 |

**Radios:** 999 para chips y píldoras · 8–12 para botones y campos · 12–14 para tarjetas y tablas · 16–20 para superficies grandes y tarjetas negras.

**Bordes:** 1px `--linea` por defecto. 2px `--negro` para el campo enfocado y para el partido destacado (la final pendiente). Nunca hay sombras.

---

## 6. Componentes

### Botones

| Variante | Fondo | Texto | Cuándo |
|---|---|---|---|
| Principal (jugador) | `--lima` | `--negro` | La acción que el jugador quiere hacer: pagar, anotar la fecha, escribirle al rival |
| Principal (organizador) | `--negro` | blanco | Guardar, resolver, publicar, cargar resultado |
| Secundario | transparente + borde `--linea` | `--negro` | Todo lo demás |
| Sobre fondo negro | transparente + borde `--borde-oscuro` | blanco | Acción alternativa dentro de una tarjeta negra |

Nunca hay flechas pegadas al texto del botón. El texto dice la acción completa: "Anotar y avisarle a Pablo", no "Continuar".

### Chips

Píldora de radio 999, alto 34–40, borde 1px. Activo: fondo `--negro`, texto blanco. Se usan para categorías, filtros, superficies y modos.

### Campos

Alto 56 en móvil y 48 en escritorio, radio 10–12, borde 1px `--gris-300`. El campo activo lleva borde 2px `--negro`. El valor va en mono si es un número.

### Tarjeta negra

Fondo `--negro`, radio 16–18, padding 20–22. Es el recurso de jerarquía más fuerte del sistema y se usa para **una sola cosa por pantalla**: el próximo partido, el ranking propio, la conciliación, el resumen del torneo, el hero de la landing.

### Barra de marcas

El objeto gráfico central del sistema. Una fila de rectángulos de 3px de radio y 30–44 de alto, uno por unidad real (un partido, un lugar del cupo), agrupados con `gap: 3px` y separados en bloques con `gap: 18px` cuando hay agrupación.

Colores: `--negro` hecho · `--gris-400` en curso · `--linea` pendiente · `--rojo` vencido.

Aparece en el tablero (48 partidos en 8 bloques de 6, con la letra de zona debajo), en inscripciones (32 lugares) y en la landing. **Es siempre el mismo objeto.**

### Matriz de zona

La fase de grupos como todos contra todos. Fila = el jugador, columna = el rival.

- Ganó: fondo `--lima-tenue`, marcador en peso 600
- Perdió: marcador en `--gris-400`
- Con fecha: la fecha corta en mono `--gris-500`
- Sin coordinar: recuadro punteado 1px `--gris-300`, vacío
- Diagonal: `#F1F2F4`, sin contenido

En escritorio se le suman columnas de `pg`, `sets` y `games` a la derecha. En móvil se muestra sola y las posiciones van abajo.

### Tabla de posiciones

Fila de 52–60. Punto de 7px a la izquierda del nombre: lima si clasifica, `--linea` si no. La línea de corte es una regla de 1px `--negro` con el texto centrado encima. Debajo de la tabla, **el desempate explicado en palabras**: "Bustos y Ledesma están igualados en partidos y sets. Desempata games ganados: 23 contra 17."

### Cuadro eliminatorio

Columnas por ronda con rótulo en mono minúscula. Tarjeta de 190×62 con dos filas de 31; el ganador con fondo `--lima-tenue` y peso 600. **En las tarjetas va el resultado en sets (2-0, 2-1), no el marcador completo** — es lo que hace legible un cuadro de 16. Las llaves se dibujan con codos de 1px `--linea`. El partido pendiente destacado lleva borde 2px `--negro` y franja lima con fecha y hora.

---

## 7. Vocabulario de estados

### Partido

| Estado | Cómo se ve |
|---|---|
| `pendiente` (sin coordinar) | Recuadro punteado vacío |
| `anotada` / `confirmada` | Fecha corta en mono gris: `sáb 14` |
| `jugada` | Marcador en tinta, ganador en peso 600, perdedor en gris |
| `vencida` | Rojo. Fila con fondo `--rojo-fondo` y texto `--rojo-texto` |

### Inscripción

`reservando` (con reloj de 15 minutos corriendo, en rojo cuando queda poco) · `pagada` (punto lima) · `en lista de espera` (numerada por orden de llegada) · `libre` (marca `--linea`).

### Torneo

`borrador` · `publicado` · `inscripciones cerradas` · `zonas generadas` · `grupos en curso` · `cuadros` · `finalizado`. Se muestran como chip en mono minúscula.

---

## 8. Cómo se escriben los datos

| Dato | Formato | Ejemplo |
|---|---|---|
| Fecha corta | día abreviado + número, minúscula | `sáb 14` |
| Fecha y hora | separados por punto medio | `sáb 14 · 10:00` |
| Fecha larga | día de semana completo | `domingo 22 de septiembre` |
| Marcador de set | guion simple, espacio entre sets | `6-4 3-6 10-8` |
| Marcador en cuadro | sets ganados | `2-1` |
| Sets y games en tabla | par con guion | `4-0`, `26-15` |
| Puntos | número solo, la palabra al lado | `95 puntos` |
| Dinero | punto como separador de miles | `$45.000` |
| Plazo | en días, no en fechas | `quedan 6 días` |
| Torneo del calendario abreviado | tres letras minúscula | `prim` `ver` `pre` `oto` `inv` |

---

## 9. Voz

Español rioplatense, voseo, sentence case. Se le habla al usuario de vos y en presente.

- **Sí:** "Anotá la fecha", "Te falta coordinar", "Quedan 4 lugares", "Todavía nadie anotó la fecha"
- **No:** "Registrar encuentro", "Partidos pendientes de coordinación", "Cupos disponibles: 4"

Cada pantalla dice la consecuencia, no solo la acción: *"Pablo recibe un aviso y confirma con un toque. Recién ahí queda agendado para los dos."*

Nada de emoji en producto.

### Vocabulario

La interfaz usa términos genéricos, no los del código ni los de un circuito en particular ([devolucion-25.md](devolucion-25.md), cambios A3 y D). Equivalencia completa con el código en [02-dominio.md](02-dominio.md) §0.

| Se dice | No se dice | Nota |
|---|---|---|
| **Torneo del calendario** | Etapa | "El Primavera es un torneo del calendario" |
| **Edición** | Torneo (para una categoría de un torneo del calendario) | "Primavera 26 · Tercera". Un torneo suelto sigue siendo "torneo" (decisión abierta 15 del [README](README.md)) |
| **Cuadro consuelo**, o el nombre que configure la organización | Complementaria | POLENTA lo configura como "Complementaria"; en sus pantallas se ve así |
| Campeonato | — | Decisión abierta 16: puede pasar a "cuadro principal" |

**Estado.** Las pantallas implementadas ya usan estos términos, salvo "Campeonato" (decisión abierta 16); el nombre configurable del cuadro consuelo está pendiente. Los HTML de referencia no se rehacen y conservan los términos viejos: cuáles, en [pantallas/README.md](pantallas/README.md).

### Ayuda en contexto

*Propuesto* ([devolucion-25.md](devolucion-25.md), cambio H). **No hay tutorial** que resalte pasos en pantalla: es caro de hacer y la gente lo saltea. La explicación aparece donde hace falta:

- Debajo del campo o la sección que explica, en `--gris-500`, cuerpo 13–14 en escritorio. Una o dos oraciones que digan la consecuencia, como el resto de la voz: *"Cada torneo del calendario es un casillero del ranking. Cuando se juega Primavera 26, sus puntos reemplazan los de Primavera 25."*
- Para explicaciones largas, una caja `--fondo` con radio de tarjeta, sin ícono de ayuda ni signo de pregunta.
- **Tarjeta "Primeros pasos"** en el inicio del organizador: tres pasos con check (*Importá tus jugadores · Creá tu primer torneo · Compartí el link de inscripción*) que **se tildan solos** cuando se cumplen. Borde `--linea`, no tarjeta negra: no es el dato principal de la pantalla. Desaparece cuando están los tres.

---

## 10. Iconos

SVG en línea, trazo de 1.7–1.9, grilla de 16/18/20/24, `stroke-linecap: round`. Nunca emoji ni glifos unicode como ícono. El set actual: búsqueda, chevron, reloj, cámara, compartir, mensaje, check, cuadro, calendario, tarjeta, archivo, barras.

---

## 11. Pantallas y features

El canvas tiene **21 pantallas**, en el orden en que se usan.

| Pantalla | Superficie | Feature |
|---|---|---|
| Cuándo juego | App del jugador | F11 |
| Mi zona | App del jugador | F07, F11 |
| Ranking | App del jugador | F09 |
| Anotar la fecha | App del jugador | F14 |
| El torneo | App del jugador | F12 |
| Inscripción y pago | App del jugador | F12 |
| Cuenta e ingreso | App del jugador | F02 |
| Qué está en juego | App del jugador | F20 |
| Registrar la organización | Web del organizador | F01 |
| Tu circuito | Web del organizador | F01 |
| Padrón | Web del organizador | F02 |
| Tablero del torneo | Web del organizador | F15 |
| Cargar resultado | Web del organizador | F06, F07 |
| Cerrar el torneo | Web del organizador | F16 |
| Inscripciones | Web del organizador | F13 |
| Sorteo de zonas | Web del organizador | F05 |
| Importar padrón | Web del organizador | F03 |
| Nuevo torneo | Web del organizador | F04 |
| Landing | Web pública | — |
| Los dos cuadros | Web pública | F08, F10 |
| Ficha y cara a cara | Web pública | F17, F18 |

**Sin pantalla:** F19, registro de resultados a partir de mensajes. Está condicionada al tiempo y a confirmar con el profesor ([devolucion-25.md](devolucion-25.md), cambio I); se diseña solo si se confirma. Además, la importación por excepción (F03) cambia la pantalla *Importar padrón*, que hay que rediseñar: hoy muestra todas las filas para decidir.

---

## 12. Implementación

### Tokens en CSS

```css
:root {
  --lima: #CDF546;
  --lima-tenue: #F7FCE7;
  --negro: #0A0B0D;
  --carbon: #17191D;
  --borde-oscuro: #2C3037;
  --gris-700: #3F4348;
  --gris-500: #6A7079;
  --gris-400: #9BA1A9;
  --gris-300: #C9CDD3;
  --linea: #E6E8EB;
  --linea-suave: #F1F2F4;
  --fondo: #F6F7F8;
  --fondo-tabla: #FAFBFC;
  --rojo: #E5484D;
  --rojo-texto: #C62A2F;
  --rojo-fondo: #FEF6F6;
  --rojo-linea: #F3D3D4;

  --r-chip: 999px;
  --r-control: 10px;
  --r-tarjeta: 14px;
  --r-superficie: 18px;
}
```

### Tailwind

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      lima: { DEFAULT: '#CDF546', tenue: '#F7FCE7' },
      negro: '#0A0B0D',
      carbon: '#17191D',
      'borde-oscuro': '#2C3037',
      gris: { 700: '#3F4348', 500: '#6A7079', 400: '#9BA1A9', 300: '#C9CDD3' },
      linea: { DEFAULT: '#E6E8EB', suave: '#F1F2F4' },
      rojo: { DEFAULT: '#E5484D', texto: '#C62A2F', fondo: '#FEF6F6', linea: '#F3D3D4' },
    },
    fontFamily: {
      sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
    },
  },
}
```

### Tokens en React Native

La app tiene su copia de los tokens en `apps/mobile/src/lib/tokens.ts`, con los mismos valores que `apps/web/src/index.css` ([decisión 034](decisiones/034-tokens-de-la-app.md)). Si cambia un valor de este documento, cambia en los dos archivos. Los estilos se escriben con `StyleSheet` y esos tokens ([decisión 035](decisiones/035-estilos-de-la-app.md)).

- **Las fuentes van dentro de la app**, porque en el celular no hay Google Fonts. Salen de los paquetes `@expo-google-fonts/instrument-sans` y `@expo-google-fonts/geist-mono`, se cargan con `useFonts` en `src/app/_layout.tsx` y la splash espera a que estén. Es en tiempo de ejecución y no con el plugin de `expo-font` porque Expo Go no lee el plugin.
- **El peso se elige con la familia, nunca con `fontWeight`.** En Android cada peso es una fuente aparte: `fontFamily: fuentes.sans[600]`, no `fontWeight: '600'`.
- **`tabular-nums` se escribe `fontVariant: ['tabular-nums']`**, que en los tokens es `tabular`.
- **Las medidas de la escala móvil también son tokens** (`medidas.toque` = 56, `medidas.margen` = 16), porque en la app se repiten en cada pantalla.

### Notas para quien implemente

- Las tarjetas negras no llevan sombra ni gradiente. Si parece plano, es correcto.
- Toda tabla y toda matriz usan `tabular-nums`. Sin eso, las columnas bailan.
- El cuadro eliminatorio se arma con columnas de altura fija y `justify-content: space-around` anidado: cada par de partidos queda centrado respecto del siguiente, y los codos son bordes de 1px con `border-left: none`.
- Nada de scroll horizontal en móvil. Si una tabla no entra, se reorganiza (así se resolvieron los cinco casilleros del ranking).

---

## 13. Decisiones de diseño abiertas

- El lima queda casi todo sobre superficies negras; en pantallas claras el color casi no aparece. Falta decidir si se quiere más presencia de marca en las vistas claras.
- La matriz de zona está pensada para grupos de 4. Un circuito que arme zonas de 5 o 6 necesita otro tratamiento de esa tabla.
- Falta la versión móvil del tablero del organizador. Hoy es solo escritorio, que es lo que el reparto web/móvil define, pero conviene revisarlo con el organizador real.
