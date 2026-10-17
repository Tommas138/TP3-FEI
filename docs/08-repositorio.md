# Repositorio: estructura y ramas

---

## 1. Estructura de carpetas

```
tp-torneos/
├── CLAUDE.md                    # contexto para Claude Code, cargado en cada sesión
├── README.md                    # cómo levantar el proyecto
├── CONTRIBUTING.md              # reglas de trabajo del equipo
├── docker-compose.yml           # api + web + postgres, autosuficiente
├── .env.example                 # variables necesarias, sin valores reales
├── .gitignore
├── package.json                 # workspaces del monorepo
│
├── docs/                        # documentación de diseño
│   ├── README.md                # índice, estado, decisiones abiertas
│   ├── 01-vision.md
│   ├── 02-dominio.md
│   ├── 03-flujo-organizacion.md
│   ├── 04-flujo-jugador.md
│   ├── 05-pagos.md
│   ├── 06-ia.md
│   ├── 07-configurabilidad.md
│   ├── 08-repositorio.md        # este archivo
│   └── diagramas/               # SVG y fuentes
│
├── apps/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts          # 1 organización, 2 categorías, 32 jugadores, 1 torneo
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── config/
│   │   │   ├── middleware/      # auth, validación Zod, manejo de errores
│   │   │   ├── modules/         # ← por dominio, NO por capa técnica
│   │   │   │   ├── auth/
│   │   │   │   ├── organizaciones/
│   │   │   │   ├── clubes/
│   │   │   │   ├── jugadores/
│   │   │   │   ├── torneos/
│   │   │   │   ├── inscripciones/
│   │   │   │   ├── competencia/ # sorteo, zonas, desempates, cuadros
│   │   │   │   ├── ranking/
│   │   │   │   ├── pagos/
│   │   │   │   └── ia/
│   │   │   └── lib/
│   │   └── tests/
│   │       └── competencia/     # ← acá viven los tests que importan
│   │
│   ├── web/
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── routes/
│   │       ├── features/        # espejo de los módulos de la API
│   │       ├── components/      # UI reutilizable, sin lógica de dominio
│   │       ├── hooks/
│   │       └── lib/
│   │
│   └── mobile/
│       ├── app.json
│       ├── eas.json             # perfiles de build para el APK
│       ├── .env.example         # EXPO_PUBLIC_API_URL: la API vista desde el celular
│       └── src/
│           ├── app/             # rutas (expo-router)
│           ├── features/        # espejo de los módulos de la API
│           ├── components/
│           └── lib/
│
└── packages/
    └── shared/
        └── src/
            ├── schemas/         # Zod: fuente única de verdad
            ├── types/           # inferidos de los schemas
            └── constants/       # estados, instancias, tabla de puntos por defecto
```

### Por qué así

**Módulos por dominio, no por capa.** Nada de `controllers/`, `services/`, `models/` en la raíz. Cada carpeta de `modules/` contiene sus rutas, su lógica y sus tipos. Dos razones:

1. El trabajo se divide por rebanada vertical entre los tres integrantes. Con módulos por dominio, cada uno trabaja mayormente en su carpeta y los conflictos de merge bajan mucho.
2. Cuando algo falla en el sorteo, está todo en `competencia/`. No hay que saltar entre tres carpetas.

**`competencia/` aislado.** Ahí vive lo más complejo del proyecto: sorteo, generación de zonas, cascada de desempates, avance de cuadros. Debe ser **lógica pura, sin acceso a base de datos** — recibe datos, devuelve resultados. Así se testea sin levantar Postgres.

**`features/` espejado entre web y mobile.** Si en la API hay `modules/inscripciones/`, en web hay `features/inscripciones/` y en mobile también. Buscar algo es predecible.

**`packages/shared` es lo que justifica TypeScript.** Los schemas de Zod se definen una vez y los consumen los tres proyectos. Si cambia el shape de `CrearTorneo`, rompe la compilación en los tres lados en vez de fallar en runtime.

---

## 2. Ramas

### El modelo: `main` + ramas cortas

**Nada de Gitflow.** Con tres personas y sin despliegues a producción, una rama `develop` solo agrega un merge de por medio sin aportar nada.

```
main ──●────●────●────●────●────●──▶
        \       /      \      /
         ●─────●        ●────●
      feat/torneos   feat/pagos
```

### Reglas

| Regla | Detalle |
|---|---|
| **`main` siempre funciona** | En cualquier momento se tiene que poder clonar, `docker compose up` y mostrar algo. La cátedra tiene entregas parciales |
| **Ramas cortas** | Máximo 2 o 3 días de vida. Si una rama vive una semana, el merge duele |
| **Código: siempre por PR** | Revisado por **uno** de los otros dos, no los dos. Con tres personas, exigir dos aprobaciones frena todo |
| **Documentación: push directo a `main`** | Pedir revisión para cambiar un párrafo es fricción sin beneficio |
| **Todos commitean** | La cátedra va a controlar que el equipo sea dueño del producto. Un historial donde commitea una sola persona es mala señal |

### Nombres de rama

```
feat/competencia-desempates
feat/pagos-webhook
fix/ranking-casillero-duplicado
docs/actualizar-dominio
chore/setup-docker
```

Prefijo + módulo + qué. Que el nombre coincida con la carpeta de `modules/` hace obvio quién está tocando qué.

### Commits

Convención mínima, con el mismo prefijo:

```
feat(competencia): cascada de desempates con tests
fix(pagos): idempotencia del webhook de MercadoPago
docs(dominio): corregir modelo de ranking por casilleros
chore: configurar workspaces del monorepo
```

No hace falta ser estricto, pero un historial legible ayuda en la defensa y hace trivial armar el informe de avance de cada entrega.

---

## 3. Tags para las entregas

Esto es lo más importante de esta sección y casi nadie lo hace.

La cátedra evalúa por entregas parciales: 25%, 50%, 75%, 100%. **Al momento de cada entrega, tagueen el commit.**

```bash
git tag -a entrega-25 -m "Entrega 25%: CRUD de torneos, jugadores e inscripciones"
git push origin entrega-25
```

Por qué importa:

- Si algo se rompe en octubre, pueden volver exactamente a lo que entregaron y demostrar que funcionaba
- Si un docente pregunta qué había en cada instancia, es un comando
- Al preparar la presentación final, el diff entre tags cuenta la historia del proyecto solo

Mismo criterio para el diseño de base de datos y los requisitos funcionales, que también son entregables:

```
entrega-requisitos
entrega-diseno-bd
entrega-25
entrega-50
entrega-75
entrega-100
```

---

## 4. Cómo trabajamos

**Objetivo: los tres aprenden todo el stack.** No hay especialización fija. Salir del proyecto sin haber tocado el backend, el móvil o la infraestructura sería un mal resultado aunque se apruebe.

Pero hay que distinguir dos cosas:

> **"Todos aprenden todo" ≠ "todos editan el mismo archivo al mismo tiempo".**
> Lo primero es el objetivo. Lo segundo son conflictos de merge y trabajo duplicado.

### Los tres mecanismos

**1. Juntos la primera vez de cada patrón.** El primer módulo CRUD, la primera pantalla, el primer test, el primer endpoint validado con Zod, el primer Dockerfile. Los tres en una máquina, uno tecleando y rotando. Después, las repeticiones se dividen.

Es lo que más rinde: se aprende una vez en conjunto y se paraleliza el resto.

**2. Propiedad rotativa por etapa.** En cada etapa, cada módulo tiene **un solo responsable** — quien decide y quien resuelve conflictos ahí. Pero el responsable rota entre etapas.

| Etapa | A | B | C |
|---|---|---|---|
| 2 | torneos | jugadores, inscripciones | infraestructura, ranking |
| 3 | competencia | pagos | mobile, ranking |
| 4 | pagos | competencia | ia |
| 5 | ia | infraestructura | torneos |

Así todos pasan por todo, pero en cada momento hay una sola persona decidiendo por carpeta.

**3. Los tres revisan todos los PR.** El mecanismo más subestimado: leer código ajeno es donde más se aprende, y garantiza que nadie quede sin contexto de una parte del sistema aunque no la haya escrito.

Para no frenar, alcanza con **una aprobación** para mergear; los otros dos pueden leer después.

### El costo, dicho claro

Trabajar así es **más lento** que repartirse el trabajo y no cruzarse. Con fecha de entrega en noviembre, el riesgo es real.

La forma de que no los mate es respetar la regla 1: **juntos la primera vez, divididos las repeticiones.** Si programan absolutamente todo de a tres, no llegan.

### El contrato de API se acuerda antes

Los schemas de Zod en `packages/shared` se definen primero, aunque el endpoint todavía no exista. Así quien hace una pantalla puede trabajar contra un mock sin esperar a que el backend esté listo. Esto vale independientemente de quién sea el responsable de cada módulo.

## 5. Repositorio

- **Privado**, en GitHub, los tres con acceso de escritura.
- Nunca commitear `.env`, credenciales de MercadoPago ni claves de API. Solo `.env.example` con los nombres de las variables.
- Si el plan lo permite, activar protección de `main` exigiendo PR para código. Si no, alcanza con acordarlo y respetarlo.

> Siendo estudiantes universitarios, conviene revisar si califican para el GitHub Student Developer Pack, que suele incluir funcionalidades de planes pagos sin costo. Verificar condiciones vigentes.

---

## 6. Rutina semanal sugerida

| Cuándo | Qué |
|---|---|
| Inicio de sesión de trabajo | `git pull`, mirar la tabla de decisiones abiertas del README |
| Durante | Rama corta, commits chicos, PR cuando funciona |
| Últimos 15 minutos | ¿Algo de lo que decidimos hoy cambia un documento? Si sí, se edita ahora con los tres presentes |
| Antes de cada entrega | Verificar `docker compose up` en una máquina limpia, taguear |
| Al empezar una etapa | Rotar responsables de módulo según la tabla de §4 |

El último punto de la tercera fila es el que sostiene la documentación viva. Sin un momento fijo, se pudre.

---

## 7. Adopción de Docker

Nadie del equipo usó Docker antes. La estrategia es una rampa, no todo de golpe.

| Cuándo | Qué | Dificultad |
|---|---|---|
| **Semana 1** | `docker-compose.yml` con **solo Postgres** | Muy baja: imagen oficial, sin Dockerfile propio |
| **Etapa 3** | Dockerfile de la API, multi-stage | Media |
| **Etapa 4** | Dockerfile del web + compose completo | Media |
| **Etapa 5** | Verificar en máquina limpia | — |

### Por qué Postgres primero

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: torneos
      POSTGRES_PASSWORD: torneos
      POSTGRES_DB: torneos
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

`docker compose up -d` y listo. No hay que escribir ningún Dockerfile y resuelve un problema real desde el primer día: los tres tienen la misma base sin instalar Postgres localmente.

Es la entrada más suave a Docker y deja el concepto de `compose` aprendido antes de tener que escribir imágenes propias.

### Notas

- **La app móvil no se dockeriza.** Expo compila un APK, no un contenedor. El entregable dockerizado es API + web + base.
- El `docker compose up` final **no puede depender de Neon**. Si el docente lo levanta en una máquina limpia sin acceso a la cuenta del equipo, tiene que funcionar igual.
- Neon queda para desarrollo compartido y demo; Postgres local para el entregable. Misma `schema.prisma`, distinta `DATABASE_URL`.
