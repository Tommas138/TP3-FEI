# 035 — Los estilos de la app se escriben con StyleSheet

**Estado:** aceptada — 17 de octubre de 2026

## Contexto

La web escribe sus estilos con clases de Tailwind 4. En React Native no hay CSS: los estilos son objetos. Al crear `apps/mobile` había que elegir cómo escribirlos.

## Opciones consideradas

1. **`StyleSheet` de React Native con los tokens** ([decisión 034](034-tokens-de-la-app.md)).
   - En contra: es más verboso que las clases, y la web y la app escriben los estilos de dos formas distintas.
2. **NativeWind**, que lleva las clases de Tailwind a React Native.
   - En contra: la versión estable (4.2.7) usa Tailwind 3 y la web usa Tailwind 4.3; la que usa Tailwind 4 (5.0) todavía está en versión candidata. Suma configuración de Babel y Metro, y una capa más para explicar.
3. **Unistyles 3**, con temas tipados.
   - En contra: depende de módulos nativos (Nitro) y no corre en Expo Go, así que obliga a un development build desde el primer día.

## Decisión

Opción 1. Cada pantalla define sus estilos con `StyleSheet.create`, y todo valor de color, fuente, radio o medida sale de `src/lib/tokens.ts`.

Dos reglas propias de React Native:

- **El peso de la fuente se elige con `fontFamily`** (`fuentes.sans[600]`), nunca con `fontWeight`. En Android cada peso es una familia aparte.
- **Los números llevan `...tabular`** (`fontVariant: ['tabular-nums']`), el equivalente de `font-variant-numeric: tabular-nums`.

## Por qué

- **No hay nada que configurar ni que se pueda romper al subir de SDK.** Es la API de React Native, documentada con cada versión.
- **Corre en Expo Go**, que es como se prueba la app hasta que lleguen las notificaciones.
- **Cada línea se explica** en la defensa sin pasar por una librería.

## Qué se resigna

- **Dos idiomas de estilos en el proyecto:** clases en la web y objetos en la app. Quien pasa de una a la otra traduce `bg-negro` a `backgroundColor: colores.negro`.
- **Más líneas por pantalla** que con clases.
