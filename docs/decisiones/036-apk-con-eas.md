# 036 — El APK se genera con EAS en la nube

**Estado:** aceptada — 17 de octubre de 2026

## Contexto

La cátedra pide una app móvil instalable: un APK, no una web responsive. Expo ofrece dos formas de compilarlo: en sus servidores (EAS Build) o en una máquina propia con las herramientas de Android.

Además, `eas build --local` pide igual una cuenta de Expo y no funciona en Windows. "Compilar local" quiere decir generar el proyecto nativo (`npx expo prebuild`) y compilarlo con Gradle, con Android Studio y el JDK instalados. Las máquinas del equipo usan Windows, y al tomar esta decisión ninguna tenía el SDK de Android.

## Opciones consideradas

1. **EAS en la nube**, con un perfil `preview` en `eas.json` que genera un APK (`android.buildType: "apk"`).
   - En contra: necesita la cuenta de Expo de un integrante. El plan gratuito tiene cupo mensual y cola. La URL de la API va en `eas.json` porque el `.env`, que está ignorado, no se sube.
2. **Build local con Android Studio**: `expo prebuild` y Gradle, sin cuentas.
   - En contra: Android Studio y el JDK en cada máquina que compile, varios GB y un primer build largo. La firma y las credenciales de las notificaciones quedan a mano.
3. **Los dos**: EAS como camino principal y el build local documentado como respaldo.
   - En contra: dos caminos para mantener y explicar, y el local igual pide instalar Android Studio para probarlo.

## Decisión

Opción 1. `apps/mobile/eas.json` tiene el perfil `preview`:

```json
"preview": { "distribution": "internal", "android": { "buildType": "apk" } }
```

Se compila con `npx eas-cli build -p android --profile preview`. Vincular el proyecto con la cuenta (`eas init`) y poner la URL de la API en el perfil queda para cuando se genere el primer APK, porque pide la cuenta y la IP de la demo.

## Por qué

- **No hay que instalar nada pesado.** Cualquiera del equipo compila con una cuenta, desde cualquier máquina.
- **El build es reproducible:** sale de `eas.json` y `app.json`, que están en el repo, y no de cómo esté configurada una máquina.
- **EAS guarda la firma del APK.** Sin eso, cada APK nuevo firmado con otra clave no se instala encima del anterior.
- **Las notificaciones lo van a necesitar:** EAS guarda las credenciales de Firebase sin que entren al repo.

## Qué se resigna

- **Depende de una cuenta externa.** El APK ya generado funciona sin ella, pero para generar uno nuevo hace falta la cuenta de quien la creó. No afecta a `docker compose up`, porque la app no se dockeriza ([08-repositorio.md](../08-repositorio.md) §7).
- **Cupo y cola del plan gratuito.** Un build tarda lo que tarde la cola, así que conviene no dejar el APK para el último día.
- **La URL de la API queda fija en el APK.** Si cambia la IP de la notebook de la demo, hay que compilar otro.
