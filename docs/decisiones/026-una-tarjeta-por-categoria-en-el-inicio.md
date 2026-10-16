# 026 — En el inicio, una tarjeta por categoría

**Estado:** aceptada — 15 de octubre de 2026

## Contexto

El inicio del organizador mostraba una tarjeta por convocatoria ("Primavera 26 · Tercera y Segunda"), con los inscriptos de todas las categorías sumados en una sola barra.

Desde la versión mínima de F13, cada categoría cierra su inscripción por separado y tiene su propia pantalla Inscripciones y su propio sorteo, con el id de su `Torneo` en la URL ([decisión 003](003-torneo-con-varias-categorias.md)). Una misma convocatoria puede tener Tercera lista para sortear y Segunda todavía abierta. El inicio tiene que llevar a cada una.

La referencia [home.html](../pantallas/organizador/home.html) ya dibujaba una tarjeta por categoría.

## Opciones consideradas

1. **Una tarjeta por categoría**, cada una con su barra, su botón y en el grupo de su momento.
   - En contra: una convocatoria de varias categorías ocupa varias tarjetas, y el encabezado cuenta categorías, no convocatorias.
2. **Una tarjeta por convocatoria, con un botón por categoría.**
   - En contra: si las categorías están en momentos distintos, la tarjeta no puede decir uno solo. La barra sumada no sirve para decidir nada: 30 de 64 no dice si Tercera está llena.

## Decisión

Opción 1, desde que la convocatoria se publica. Los borradores siguen siendo una fila por convocatoria, porque se editan juntos en Nuevo torneo.

`ResumenConvocatoria` trae `torneos`, con el id, la categoría, el estado, el cupo y los inscriptos de cada una. Las sumas de cupo e inscriptos de la convocatoria se sacaron: solo las usaba el inicio.

## Por qué

- **Cada tarjeta tiene un solo estado y una sola acción**: inscripciones abiertas o lista para sortear.
- **La barra de una categoría dice algo** (24 de 32 en Tercera). La suma de dos no.
- **El enlace sale con el id de la categoría**, sin que el inicio tenga que traducir el de la convocatoria. Es justo el error que no se ve con una sola categoría.
- **Coincide con la referencia del inicio.**

## Qué se resigna

- **El nombre de la convocatoria se repite** en cada tarjeta de sus categorías.
- **El encabezado cuenta categorías:** "3 con la inscripción abierta" pueden ser dos convocatorias.
