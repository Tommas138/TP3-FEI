# 037 — Una sola copia de React en el monorepo

**Estado:** aceptada — 17 de octubre de 2026

## Contexto

Con `apps/mobile` hay dos apps de React en los mismos workspaces de npm. Expo fija la versión exacta de React de cada SDK: el SDK 58 pide `react 19.3.0` con `react-native 0.88.0`. La web declara `^19.2.8`, que hoy resolvió a 19.3.0, pero React 19.3.1 ya salió. Si alguien regenera el lockfile, la web sube y la app no, y npm deja dos copias de React. React Native toma la de la raíz y la app la suya, y aparece "Invalid hook call". La guía de monorepos de Expo dice que dos versiones de React en una app no funcionan.

Hoy hay una sola copia, pero nada la garantiza.

## Opciones consideradas

1. **`overrides` en el `package.json` de la raíz** (`react` y `react-dom` en `19.3.0`).
   - En contra: la web queda atada a la versión de React que pida Expo, y la restricción no se ve en `apps/web/package.json`.
2. **19.3.0 exacto, sin `^`, en la web y en la app.**
   - En contra: son dos lugares que hay que cambiar juntos, y si alguien vuelve a poner `^` nada lo frena.
3. **Sacar `apps/mobile` de los workspaces**, con su propio `node_modules` y su lockfile.
   - En contra: dos instalaciones, se pierde la configuración automática de Metro para monorepos y hay que resolver a mano `@setpoint/shared` y su zod.

## Decisión

Opción 1. El `package.json` de la raíz tiene:

```json
"overrides": { "react": "19.3.0", "react-dom": "19.3.0" }
```

Al cambiar de SDK de Expo, se cambia esta versión a la que pida el SDK nuevo, en el mismo commit.

## Por qué

- **Es lo que recomienda la guía de monorepos de Expo** para npm, y npm lo hace cumplir en todo el árbol, incluidas las dependencias de las dependencias.
- **Un solo lugar.** No depende de que alguien se acuerde de cambiar dos archivos.
- **La web no pierde nada hoy:** ya usaba 19.3.0.

## Qué se resigna

- **La web sube de React cuando sube Expo**, no antes. Una versión de React que la web quiera usar tiene que esperar al SDK que la traiga.
- **Quien lea `apps/web/package.json` ve `^19.2.8`** y no sabe que manda la raíz. Lo dice este documento.
