# 042 — Sin sesión, la app solo muestra el ingreso

**Estado:** aceptada — 19 de octubre de 2026

## Contexto

[04-flujo-jugador.md](../04-flujo-jugador.md) §1 dice que consultar no exige cuenta: el ranking, los cuadros y las zonas se abren por link. Eso ya existe en la web: `/c/:slug/ranking` ([decisión 033](033-ranking-publico.md)) y `/c/:slug/torneos/:id/cuadros` ([decisión 038](038-cuadros-en-el-celular.md)). Había que decidir qué muestra la app a quien la abre sin haber ingresado.

## Opciones consideradas

1. **Solo el ingreso.**
   - En contra: quien no tiene cuenta no saca nada de la app; tiene que usar el link de la web.
2. **El ingreso y el ranking público de una organización que se elige.**
   - En contra: necesita un endpoint para listar o buscar organizaciones y una pantalla que no está diseñada.
3. **El ingreso y botones que abren el ranking y los cuadros de la web.**
   - En contra: igual hay que saber de qué organización, y suma una variable con la dirección de la web.

## Decisión

Opción 1. Sin sesión, todas las rutas de la app llevan a *Ingresar* (`Stack.Protected` en `src/app/_layout.tsx`). La pantalla dice que mirar el ranking y los cuadros no necesita cuenta y que se abren desde el link que comparte la organización.

## Por qué

- **La consulta sin cuenta ya está resuelta, y en el lugar que pide F09:** un link que se abre sin instalar nada.
- **Sin sesión, la app no sabe de qué organización mostrar algo.** La plataforma tiene varias, y la web lo resuelve con el slug del link.
- **La app existe para lo que pide cuenta:** tus partidos, tu zona, tus avisos, inscribirte y anotar la fecha.

## Qué se resigna

- **Quien instala la app sin cuenta no ve nada.** En POLENTA, las cuentas nacen al inscribirse (F12), así que hasta entonces la app no le sirve.
