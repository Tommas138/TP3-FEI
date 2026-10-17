# SetPoint

Plataforma de gestión de torneos de tenis amateur. Web + app móvil instalable.

Reemplaza el circuito actual de planillas de Excel, cuadros en papel y coordinación por WhatsApp: armado de zonas con siembra por ranking, cuadros eliminatorios, coordinación de partidos entre jugadores, cobro de inscripciones y ranking que se actualiza solo.

**Cliente:** [POLENTA Team Tenis](docs/02-dominio.md), circuito amateur de Neuquén — 77 jugadores, 2 categorías, 5 torneos por año.

---

## Estado

🚧 **En desarrollo.** Fase de diseño completa, implementación en curso.

Ver [`docs/README.md`](docs/README.md) para el estado detallado y las decisiones abiertas.

---

## Stack

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript |
| Web | React + Vite |
| Móvil | React Native + Expo |
| API | Express + Prisma |
| Base de datos | PostgreSQL |
| Pagos | MercadoPago |
| Contenedores | Docker |

Monorepo con workspaces de npm.

---

## Requisitos

- Node.js 22.13 o superior (lo pide Expo SDK 58)
- Docker y Docker Compose
- Para la app móvil: [Expo Go](https://expo.dev/go) actualizado en el celular (tiene que soportar el SDK 58), o un emulador Android

---

## Levantar el proyecto

```bash
git clone https://github.com/jeremiasHerr/setpoint.git
cd setpoint
npm install
docker compose up -d db mailpit      # Postgres y el servidor de mail de prueba
cp apps/api/.env.example apps/api/.env
npm run db:migrate -w apps/api       # crea las tablas
npm run db:seed -w apps/api          # datos de prueba
npm run dev -w apps/api              # API en http://localhost:3000
```

> Por ahora Docker levanta solo la base de datos y Mailpit. El `docker compose up` completo, con API y web, llega en la etapa 4.

Los mails que manda la API (por ahora, el link para recuperar la contraseña) no salen a internet: los atrapa Mailpit y se leen en http://localhost:8025. Sin `SMTP_HOST` en el `.env`, se imprimen en la consola de la API.

### App móvil

La app no se dockeriza: corre en el celular y le habla a la API que corre en la notebook.

```bash
cp apps/mobile/.env.example apps/mobile/.env   # y poné la IP de la notebook
npm run dev -w apps/api                        # la API tiene que estar corriendo
npm run dev -w apps/mobile                     # Metro, con el QR
```

1. En `apps/mobile/.env`, `EXPO_PUBLIC_API_URL` es la dirección de la API **vista desde el celular**: `http://<IP de la notebook>:3000`. La IP sale de `ipconfig` ("Dirección IPv4"). `localhost` no sirve: desde el celular es el propio celular. En el emulador de Android va `http://10.0.2.2:3000`.
2. El celular tiene que estar en la misma Wi-Fi que la notebook. Escaneá el QR con Expo Go. Mientras el Expo Go del Play Store no soporte el SDK 58, instalá el APK que publica Expo: [Expo-Go-58.0.4.apk](https://github.com/expo/expo-go-releases/releases/download/Expo-Go-58.0.4/Expo-Go-58.0.4.apk). Si ya tenías el del Play Store, desinstalalo antes.
3. Si el celular no llega a la API, revisá que el firewall de Windows deje entrar a Node en redes privadas, y que la Wi-Fi esté marcada como red privada.
4. La variable se lee al compilar: si la cambiás, reiniciá con `npx expo start --clear` (desde `apps/mobile`).

Por ahora la app tiene una sola pantalla de prueba, que dice si llega a la API.

El APK instalable se genera con EAS ([decisión 036](docs/decisiones/036-apk-con-eas.md)): `npx eas-cli login` y después `npx eas-cli build -p android --profile preview` desde `apps/mobile`.

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Postgres |
| `JWT_SECRET` | Firma de tokens de sesión |
| `MERCADOPAGO_ACCESS_TOKEN` | Credencial de **sandbox** |
| `ANTHROPIC_API_KEY` | Funcionalidades de IA |

> Nunca commitear el `.env`. Usar credenciales de sandbox de MercadoPago durante todo el desarrollo.

---

## Estructura

```
setpoint/
├── docs/              documentación de diseño
├── apps/
│   ├── api/           Express + Prisma
│   ├── web/           React
│   └── mobile/        React Native (Expo)
└── packages/
    └── shared/        schemas de Zod y tipos compartidos
```

Detalle completo en [`docs/08-repositorio.md`](docs/08-repositorio.md).

---

## Documentación

| Documento | Contenido |
|---|---|
| [Estado y decisiones](docs/README.md) | Índice, decisiones abiertas, riesgos |
| [Visión](docs/01-vision.md) | Problema, pitch, competencia |
| [Dominio](docs/02-dominio.md) | **Reglas del circuito.** Formato, desempates, ranking |
| [Flujo organización](docs/03-flujo-organizacion.md) | Panel web |
| [Flujo jugador](docs/04-flujo-jugador.md) | App móvil |
| [Pagos](docs/05-pagos.md) | MercadoPago |
| [IA](docs/06-ia.md) | Las tres funcionalidades |
| [Configurabilidad](docs/07-configurabilidad.md) | Qué se parametriza |
| [Repositorio](docs/08-repositorio.md) | Estructura, ramas, forma de trabajo |
| [Setup inicial](docs/09-setup-inicial.md) | Guía paso a paso |
| [Features](docs/10-features.md) | Lista de funcionalidades de la 2da entrega |
| [Diseño](docs/design.md) | Sistema visual |

---

## Riesgos

| `npm audit` reporta 3 vulnerabilidades altas en `deepmerge-ts` | Es una dependencia del CLI de Prisma, que solo corre en desarrollo y no procesa datos de usuarios. **No correr `npm audit fix --force`**: baja Prisma a 6.12 y rompe la alineación de versiones. Se resuelve cuando Prisma actualice la dependencia |
| `npm audit` reporta vulnerabilidades en las herramientas de build de la app (Metro, `braces`, `micromatch`, `node-forge` en el CLI de Expo) | Corren en la máquina de quien desarrolla y no van en el APK. **No correr `npm audit fix --force`**: propone bajar Expo al SDK 44. Se resuelven al actualizar el SDK |

---

## Tests

```bash
npm test
```

La lógica de competencia (sorteo, tablas de posiciones, cascada de desempates) es lógica pura sin acceso a base de datos y está cubierta por tests. Es la parte del sistema donde un error es silencioso y difícil de detectar a ojo.

---

## Contribuir

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md). En resumen:

- Código por Pull Request, con una aprobación
- Documentación directo a `main`
- Un cambio de diseño va en el mismo commit que el código que lo implementa
- Ramas cortas: `feat/modulo-descripcion`

---

## Equipo

- Jeremías Herrera
- Tomás Mengón
- Dana García

Trabajo Final — Tecnicatura Universitaria en Desarrollo Web
Facultad de Informática, Universidad Nacional del Comahue

Entrega: noviembre de 2026

