# 048 — El APK de prueba se conecta por http

**Estado:** aceptada — 20 de octubre de 2026

## Contexto

El primer APK no se conectaba a la API: decía que no había conexión y ningún pedido llegaba al servidor. Desde Android 9, las apps compiladas para distribuir bloquean las conexiones `http://` y solo permiten `https://`. Expo Go y los builds de desarrollo vienen con ese bloqueo desactivado, por eso con Expo Go la misma app andaba.

El APK de prueba apunta a la API corriendo en la notebook de quien lo genera, en la red de su casa (`http://<IP>:3000`), que no tiene https.

## Opciones consideradas

1. **Permitir http solo en el APK de prueba.** El perfil `preview` de `eas.json` define `PERMITIR_HTTP=1`, y `app.config.ts` activa `usesCleartextTraffic` con `expo-build-properties` solo si está.
   - En contra: una variable y una condición más en la configuración.
2. **Permitir http siempre.**
   - En contra: la app entregable aceptaría conexiones sin cifrar, y el token de sesión viajaría en claro si la API no tiene https.
3. **Usar https con un túnel** (tipo ngrok) para la API.
   - En contra: una cuenta externa más, y en el plan gratis la URL cambia en cada sesión, lo que obliga a otro APK cada vez.

## Decisión

Opción 1. El perfil `preview` es el de prueba. Un perfil de producción, cuando exista, no define la variable y exige https.

## Por qué

- **Se puede probar en la red de casa** sin cuentas ni URLs que cambian.
- **No queda una app que acepte http sin querer:** el permiso depende del perfil, no de un valor fijo en `app.json`.
- **Se ve en `eas.json`** qué perfil lo tiene, y `npx eas-cli config --profile preview` muestra si quedó activo.

## Qué se resigna

- **El APK de prueba manda el token sin cifrar** por la Wi-Fi de casa. Es la red de quien prueba, con datos de prueba.
- **Para la demo y la entrega hace falta resolver https** o generar el APK con este perfil sabiendo lo que implica. Queda para cuando se defina dónde corre la API en la demo.
