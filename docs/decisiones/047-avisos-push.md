# 047 — Cómo llegan los avisos al celular

**Estado:** aceptada — 19 de octubre de 2026

## Contexto

F11 pide que la app avise "cuando se publica el fixture, cuando su rival confirma una fecha y cuando se acerca un partido", y que los avisos lleguen "como notificaciones del teléfono, sin necesidad de abrir la aplicación".

- **La confirmación del rival** depende de anotar la fecha, que es F14 (75%). Todavía no hay nada que la dispare.
- **Un aviso remoto en Android pasa por Firebase Cloud Messaging.** El servicio de avisos de Expo lo usa por debajo, con las credenciales de un proyecto de Firebase que se cargan en EAS.
- **Expo Go para Android no sirve para probar avisos.** Desde el SDK 53 no recibe avisos remotos, y con el SDK 58 tampoco carga `expo-notifications`: le falta un módulo nativo (`ExpoTopicSubscriptionModule`) que la librería pide al importarse, en todas sus versiones 58. Los avisos solo se prueban con un APK.
- **`docker compose up` no puede depender de cuentas externas.**

## Opciones consideradas

1. **Remoto para el fixture y local para el recordatorio.** La API manda el fixture por el servicio de Expo; el celular programa el recordatorio antes de cada partido.
   - En contra: una tabla nueva para los tokens, cuentas externas (Expo y Firebase) para el APK, y el aviso remoto solo se prueba con el APK.
2. **Solo locales.** La app programa los recordatorios y, al abrirse, avisa si hay fixture nuevo.
   - En contra: el fixture no llega sin abrir la app, que es justo lo que pide F11.
3. **Solo remotos**, el recordatorio incluido, con una tarea programada en la API.
   - En contra: lo mismo que la opción 1, más una tarea; y el recordatorio no llega si el celular no tiene señal a esa hora.

## Decisión

Opción 1.

- **El celular se anota** con `PUT /api/jugador/:slug/dispositivo` al entrar a la app, y se borra con `DELETE` al cerrar sesión. Los tokens se guardan en `DispositivoAviso`, del usuario y no de una organización: un mismo celular recibe los avisos de todos los circuitos en los que juega. Es la única tabla sin `organizacionId`, por eso.
- **El fixture se avisa al confirmar el sorteo**, a cada jugador con cuenta, con su zona. Se manda fuera de la transacción y sin esperarlo: si falla, la confirmación no se deshace. Se manda por HTTP al servicio de Expo, sin SDK. Los tokens que Expo da por no registrados se borran.
- **El recordatorio lo programa la app** un día antes de cada partido con fecha, o dos horas antes si la fecha se anotó con menos de un día. Se rehacen cada vez que se cargan los partidos de Cuándo juego.
- **El aviso de la confirmación del rival** se suma con F14, con el mismo `enviarAvisos()`.
- **El `projectId` y el dueño del proyecto de EAS van en `app.json`.** No son secretos, y los tres integrantes tienen que generar el APK sobre el mismo proyecto para que la firma sea la misma ([decisión 036](036-apk-con-eas.md)). EAS no lee el `.env` al evaluar la configuración, así que tampoco pueden ir ahí.
- **El `google-services.json` de Firebase no se commitea:** `app.config.ts` lo toma de `GOOGLE_SERVICES_JSON`, una variable de tipo archivo en el entorno de EAS. Sin él, el APK funciona igual y no recibe el aviso del fixture.

## Por qué

- **Es lo único que cumple "sin abrir la aplicación"** para el fixture.
- **La API no guarda ningún secreto:** las credenciales de Firebase quedan en EAS, del lado de quien genera el APK. Sin internet, como en una demo con `docker compose up`, el envío falla, se registra y la API sigue.
- **El recordatorio local llega aunque el celular no tenga señal** a esa hora, y no hace falta una tarea programada en la API.

## Qué se resigna

- **Los avisos solo se prueban con un APK.** En Expo Go la app carga `expo-notifications` protegida: si falla, abre igual con los avisos apagados. Los recordatorios andan en cualquier APK; el aviso del fixture, solo en uno generado con el proyecto de Firebase.
- **Generar el APK pide dos cuentas:** la de Expo, que ya pedía la [decisión 036](036-apk-con-eas.md), y un proyecto de Firebase. El proyecto de EAS es de la cuenta `dundermifflinpruebas`; para generar el APK, cada integrante tiene que ser miembro de esa cuenta.
- **Si el jugador cambia la fecha en otro celular**, el recordatorio de este se corrige recién al abrir la app.
- **No hay preferencias de avisos.** El jugador los apaga desde los ajustes de Android.
