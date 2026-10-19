# 041 — La sesión del jugador se guarda con expo-secure-store

**Estado:** aceptada — 19 de octubre de 2026

## Contexto

Al ingresar, la app recibe un token de sesión que vale 7 días. Para no pedir la contraseña cada vez que se abre la app, hay que guardarlo en el celular. La web lo guarda en `localStorage` (decisión abierta 13 del [README](../README.md)), que no existe en React Native.

## Opciones consideradas

1. **`expo-secure-store`**, cifrado con el Keystore de Android.
   - En contra: la lectura es asincrónica, así que al abrir la app hay un momento en que todavía no se sabe si hay sesión.
2. **`AsyncStorage`**, el almacenamiento simple de React Native.
   - En contra: queda sin cifrar; un celular rooteado o un backup lo dejan leer.
3. **Solo en memoria.**
   - En contra: se pierde al cerrar la app.

## Decisión

Opción 1. `apps/mobile/src/features/auth/sesion.ts` guarda la respuesta del ingreso y, aparte, el circuito elegido ([decisión 040](040-jugador-en-varios-circuitos.md)).

- **Al abrir la app, la splash espera** a que se lea la sesión, así no se ve el ingreso un instante antes de saber que había una.
- **Lo que se lee se valida con `respuestaIngresoJugadorSchema`**: una sesión rota o guardada por otra versión de la app se descarta y se vuelve a ingresar.
- **El plugin de `expo-secure-store` queda en `app.json`**: en el APK saca estos datos del backup automático de Android, porque la clave del Keystore no viaja a otro celular y la sesión restaurada no se podría descifrar.

## Por qué

- **El token permite actuar en nombre del jugador**, y desde F14 va a anotar fechas de partidos. Cifrado es lo mínimo razonable, y cuesta lo mismo que sin cifrar.
- **Es lo que la decisión abierta 13 ya daba por hecho** para la app.
- **Funciona en Expo Go**, que es como se prueba la app hasta las notificaciones.

## Qué se resigna

- **La sesión dura 7 días, como en la web**: después la app vuelve a pedir la contraseña. Para una app de celular es poco, pero alargarla es otra decisión (un token distinto para la app), y no hace falta para la demo.
- **Un restore en otro celular no trae la sesión**: hay que volver a ingresar.
