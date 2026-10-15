# 022 — Cómo se ubica a los clasificados en el cuadro

**Estado:** aceptada — 15 de octubre de 2026

## Contexto

Al cerrar la fase de grupos, los primeros de cada zona van al cuadro principal y, si el torneo lo tiene, el resto al cuadro consuelo ([02-dominio.md](../02-dominio.md) §3.1). El reglamento de POLENTA no dice **dónde** va cada uno dentro del cuadro: quién juega contra quién en la primera ronda.

Tiene que servir para cualquier formato que permita la convocatoria (F04): 8 zonas con 2 clasificados, que da un cuadro de 16 justo, pero también 6 zonas, 3 clasificados por zona o zonas de 3 cuando no se llena el cupo ([decisión 015](015-zonas-con-menos-inscriptos.md)). En esos casos el cuadro no es potencia de 2 y hay byes ([decisión 023](023-byes-sin-partido.md)).

Dos cosas se esperan de cualquier cuadro de tenis: que los mejores no se crucen temprano y que dos jugadores de la misma zona, que ya se enfrentaron, no vuelvan a cruzarse enseguida.

## Opciones consideradas

1. **Cruces fijos por zona, estilo Mundial:** 1A–2B, 1B–2A, 1C–2D…
   - En contra: solo queda prolijo con 2, 4, 8 o 16 zonas y 2 clasificados. Con 6 zonas, 3 clasificados o zonas incompletas hay que inventar otro patrón para cada caso. Además, entre los ganadores de zona no distingue a quien ganó todo de quien clasificó por desempate.
2. **Una siembra única de clasificados y el orden de siembra estándar.** Primero todos los ganadores de zona, ordenados entre zonas con la cascada; después los segundos, y así. Esa siembra se ubica en el cuadro como en cualquier torneo con cabezas de serie (el 1 y el 2 solo se cruzan en la final) y, dentro de cada franja de siembra, se aleja a los compañeros de zona.
   - En contra: hay más lógica que en un patrón fijo, y un jugador entiende menos a primera vista de dónde salió su cruce.
3. **Sorteo de cruces:** los ganadores de zona como cabezas de serie y el resto sorteado, con la restricción de la zona.
   - En contra: es otra ceremonia, con pantalla, borrador y confirmación propios, como el sorteo de zonas (decisiones 014, 020 y 021). Cuesta varias veces más.

## Decisión

Opción 2, en `apps/api/src/modules/competencia/cuadros.ts`:

- `siembraDelCuadro()` arma la siembra puesto por puesto con `compararEntreZonas()`, que ya resuelve las zonas de distinto tamaño ([decisión 018](018-comparar-zonas-de-distinto-tamano.md)).
- `ubicarEnElCuadro()` parte del orden de siembra estándar. Dentro de cada franja de siembra ({1}, {2}, {3, 4}, {5…8}, {9…16}) cada jugador, de mejor a peor sembrado, toma el lugar libre en el que se cruzaría lo más tarde posible con los de su zona ya ubicados. Ante la misma distancia, el lugar del orden estándar.
- No hay azar: con las mismas zonas, sale siempre el mismo cuadro.

Con dos clasificados por zona, los dos de una zona quedan en mitades opuestas y solo pueden cruzarse en la final. Cada ganador de zona juega la primera ronda contra un segundo de otra zona.

## Por qué

- **Sirve para cualquier formato** sin casos especiales: 16, 12 o 5 clasificados, con o sin byes.
- **Reutiliza la cascada** de F07 y la comparación entre zonas, que ya están probadas. Ganar la zona con más holgura da mejor siembra, y con ella un camino más fácil o un bye.
- **Mover jugadores dentro de una franja no le quita protección a nadie:** es lo mismo que se sortea en un cuadro con cabezas de serie. Por eso se puede alejar a los compañeros de zona sin romper la siembra.
- **Es determinista**, como el cálculo de las posiciones: el cuadro se puede rehacer y explicar a partir de las tablas de las zonas.

## Qué se resigna

- **No es el método de POLENTA ni lo pide su reglamento**, que no dice nada sobre los cruces. Se suma a las preguntas para el organizador.
- **Con tres o más clasificados por zona no siempre se pueden separar todos hasta la final.** Se los aleja lo más posible: nunca se cruzan en la primera ronda.
- **No hay sorteo de cruces.** Un circuito que quiera hacerlo como ceremonia no tiene cómo, por ahora.
