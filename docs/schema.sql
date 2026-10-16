-- ============================================================================
-- SetPoint — Plataforma de gestión de torneos de tenis amateur
-- Trabajo Final 2026 — Tecnicatura Universitaria en Desarrollo Web, UNCo FaI
--
-- PostgreSQL 16. Equivalente al schema.prisma del proyecto.
--
-- v3 — Correcciones de la cátedra:
--   * Se elimina la tabla grupos: solo guardaba una letra. El grupo pasa a ser
--     una columna en inscripciones y en partidos. Un JOIN menos en la tabla
--     de posiciones, que es la consulta más frecuente del sistema.
--   * Se elimina partidos.es_walkover: duplicaba el estado WALKOVER.
--   * Se documentan las dos redundancias intencionales: partidos.ganador_id
--     y movimientos_ranking.
--
-- v2 — Cambios respecto de la versión anterior:
--   * Se elimina torneo_categorias: cada torneo ES de una categoría.
--     "Primavera 2026 — Tercera" y "Primavera 2026 — Segunda" son dos torneos.
--   * Se agrega torneos.edicion para agrupar las categorías de un evento.
--   * Se podan los índices redundantes con UNIQUE compuestos.
--   * Se eliminan cronicas y fotos_partido: fuera de alcance del proyecto.
--
-- SOBRE LOS ÍNDICES: hay dos clases y conviene no confundirlas.
--   * uq_*  -> reglas de integridad. No son optimización: impiden datos malos.
--   * ix_*  -> optimización. Solo sobre columnas por las que se consulta.
-- Un UNIQUE compuesto (a, b) YA indexa la columna a. No agregar ix sobre (a).
-- PostgreSQL NO indexa las claves foráneas automáticamente: hay que hacerlo.
-- ============================================================================

BEGIN;

-- ============================================================================
-- TIPOS ENUMERADOS
-- ============================================================================

CREATE TYPE modo_inscripcion       AS ENUM ('CERRADA', 'CON_APROBACION', 'ABIERTA');
CREATE TYPE modo_distribucion      AS ENUM ('SERPENTINA', 'DIRECTA', 'BOMBOS');
CREATE TYPE modo_sorteo            AS ENUM ('AUTOMATICO', 'ASISTIDO', 'MANUAL');
CREATE TYPE quien_carga_resultados AS ENUM ('ORGANIZACION', 'ORGANIZACION_Y_JUGADORES');
CREATE TYPE modo_sede              AS ENUM ('LIBRE', 'DESIGNADA');
CREATE TYPE superficie             AS ENUM ('POLVO_LADRILLO', 'CEMENTO', 'SINTETICO', 'CARPETA', 'OTRA');
CREATE TYPE tercero_set            AS ENUM ('SET_COMPLETO', 'SUPER_TIEBREAK');

CREATE TYPE estado_torneo AS ENUM (
    'BORRADOR', 'PUBLICADO', 'INSCRIPCIONES_CERRADAS', 'ZONAS_GENERADAS',
    'GRUPOS_EN_CURSO', 'ELIMINATORIAS', 'FINALIZADO', 'CANCELADO'
);

CREATE TYPE estado_inscripcion AS ENUM (
    'PENDIENTE_PAGO', 'PAGADA', 'EXPIRADA', 'RECHAZADA', 'CANCELADA', 'EN_LISTA_ESPERA'
);

CREATE TYPE medio_pago         AS ENUM ('MERCADOPAGO', 'EFECTIVO', 'TRANSFERENCIA', 'OTRO');
CREATE TYPE estado_pago        AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'DEVUELTO');
CREATE TYPE tipo_cuenta_cobro  AS ENUM ('PLATAFORMA', 'PROPIA');
CREATE TYPE estado_liquidacion AS ENUM ('PENDIENTE', 'PAGADA');
CREATE TYPE cuadro             AS ENUM ('CAMPEONATO', 'COMPLEMENTARIA');
CREATE TYPE fase_partido       AS ENUM ('GRUPOS', 'ELIMINATORIA');

CREATE TYPE estado_partido AS ENUM (
    'PENDIENTE_COORDINACION', 'ANOTADA', 'CONFIRMADA', 'JUGADA',
    'VENCIDA', 'WALKOVER', 'ABANDONO', 'CANCELADA'
);

CREATE TYPE instancia AS ENUM (
    'CAMPEON', 'FINALISTA', 'SEMIFINALISTA', 'CUARTOS',
    'OCTAVOS', 'DIECISEISAVOS', 'PARTICIPACION'
);

CREATE TYPE motivo_movimiento AS ENUM (
    'IMPORTACION_INICIAL', 'RESULTADO_TORNEO', 'AJUSTE_MANUAL', 'REVERSION'
);

CREATE TYPE estado_proceso_ia AS ENUM (
    'PENDIENTE', 'PROCESADO', 'CONFIRMADO', 'DESCARTADO', 'ERROR'
);

-- ============================================================================
-- USUARIOS Y ORGANIZACIONES
-- ============================================================================

-- Credencial de acceso. NO es la entidad del dominio: eso es jugadores.
CREATE TABLE usuarios (
    id             SERIAL PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    nombre         VARCHAR(100) NOT NULL,
    apellido       VARCHAR(100) NOT NULL,
    creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Circuito o grupo organizador. Clave de aislamiento de todo el sistema.
CREATE TABLE organizaciones (
    id                     SERIAL PRIMARY KEY,
    nombre                 VARCHAR(150) NOT NULL,
    slug                   VARCHAR(80)  NOT NULL UNIQUE,
    descripcion            TEXT,
    contacto               VARCHAR(255),
    usa_ranking            BOOLEAN NOT NULL DEFAULT TRUE,
    ventana_ranking_meses  INTEGER NOT NULL DEFAULT 12,
    solo_mejores_n         INTEGER,
    puntos_jugador_nuevo   INTEGER NOT NULL DEFAULT 0,
    quien_carga_resultados quien_carga_resultados NOT NULL DEFAULT 'ORGANIZACION',
    creado_en              TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_org_ventana CHECK (ventana_ranking_meses > 0),
    CONSTRAINT ck_org_mejores CHECK (solo_mejores_n IS NULL OR solo_mejores_n > 0)
);

-- Un circuito puede tener varios administradores (el "Comité Organizador").
CREATE TABLE admins_organizacion (
    id              SERIAL PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id)       ON DELETE CASCADE,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_admin_org UNIQUE (usuario_id, organizacion_id)
);
-- organizacion_id no es la primera columna del unique -> índice propio
CREATE INDEX ix_admins_org ON admins_organizacion (organizacion_id);

-- Categoría de juego. Cada una tiene su ranking independiente.
CREATE TABLE categorias (
    id              SERIAL PRIMARY KEY,
    organizacion_id INTEGER     NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre          VARCHAR(80) NOT NULL,
    orden           INTEGER     NOT NULL,
    activa          BOOLEAN     NOT NULL DEFAULT TRUE,
    -- este unique ya indexa organizacion_id
    CONSTRAINT uq_categoria_org UNIQUE (organizacion_id, nombre)
);

-- Etapa del calendario anual. Define los casilleros del ranking.
CREATE TABLE etapas (
    id              SERIAL PRIMARY KEY,
    organizacion_id INTEGER     NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre          VARCHAR(80) NOT NULL,
    orden           INTEGER     NOT NULL,
    activa          BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_etapa_org UNIQUE (organizacion_id, nombre)
);

-- Puntos que otorga cada instancia alcanzada.
CREATE TABLE puntajes_instancia (
    id              SERIAL PRIMARY KEY,
    organizacion_id INTEGER   NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    instancia       instancia NOT NULL,
    puntos          INTEGER   NOT NULL,
    CONSTRAINT uq_puntaje_org UNIQUE (organizacion_id, instancia),
    CONSTRAINT ck_puntaje_no_negativo CHECK (puntos >= 0)
);

-- ============================================================================
-- CLUBES Y CANCHAS (opcionales)
-- ============================================================================

-- Registrar clubes es OPCIONAL. Sin ellos la sede se escribe como texto libre.
CREATE TABLE clubes (
    id              SERIAL PRIMARY KEY,
    organizacion_id INTEGER      NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre          VARCHAR(150) NOT NULL,
    direccion       VARCHAR(255),
    CONSTRAINT uq_club_org UNIQUE (organizacion_id, nombre)
);

CREATE TABLE canchas (
    id         SERIAL PRIMARY KEY,
    club_id    INTEGER     NOT NULL REFERENCES clubes(id) ON DELETE CASCADE,
    nombre     VARCHAR(80) NOT NULL,
    superficie superficie  NOT NULL DEFAULT 'POLVO_LADRILLO',
    CONSTRAINT uq_cancha_club UNIQUE (club_id, nombre)
);

-- ============================================================================
-- JUGADORES
-- ============================================================================

-- Ficha del jugador en el padrón. Existe SIN cuenta: la crea la organización.
CREATE TABLE jugadores (
    id              SERIAL PRIMARY KEY,
    organizacion_id INTEGER      NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    categoria_id    INTEGER      REFERENCES categorias(id) ON DELETE SET NULL,
    usuario_id      INTEGER      REFERENCES usuarios(id)   ON DELETE SET NULL,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    dni             VARCHAR(20),
    telefono        VARCHAR(25),
    email           VARCHAR(255),
    foto_url        TEXT,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_jugador_dni_org UNIQUE (organizacion_id, dni)
);
CREATE INDEX ix_jugadores_apellido  ON jugadores (organizacion_id, apellido);   -- búsqueda pública
CREATE INDEX ix_jugadores_categoria ON jugadores (organizacion_id, categoria_id); -- padrón por categoría
CREATE INDEX ix_jugadores_usuario   ON jugadores (usuario_id);                   -- del login a la ficha

-- ============================================================================
-- TORNEOS
-- ============================================================================

-- UN TORNEO ES DE UNA CATEGORÍA.
-- "Primavera 2026 — Tercera" y "Primavera 2026 — Segunda" son dos torneos.
-- El campo edicion agrupa las categorías de un mismo evento.
CREATE TABLE torneos (
    id                     SERIAL PRIMARY KEY,
    organizacion_id        INTEGER      NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    categoria_id           INTEGER      NOT NULL REFERENCES categorias(id)     ON DELETE RESTRICT,
    etapa_id               INTEGER      REFERENCES etapas(id) ON DELETE SET NULL,
    club_sede_id           INTEGER      REFERENCES clubes(id) ON DELETE SET NULL,
    nombre                 VARCHAR(150) NOT NULL,
    edicion                VARCHAR(80),
    descripcion            TEXT,
    estado                 estado_torneo NOT NULL DEFAULT 'BORRADOR',

    -- inscripción
    cupo                   INTEGER          NOT NULL,
    precio                 NUMERIC(12, 2)   NOT NULL DEFAULT 0,
    modo_inscripcion       modo_inscripcion NOT NULL DEFAULT 'CERRADA',
    minutos_reserva_cupo   INTEGER          NOT NULL DEFAULT 15,
    tiene_lista_espera     BOOLEAN          NOT NULL DEFAULT TRUE,

    -- fechas
    fecha_inicio           DATE,
    fecha_fin              DATE,
    cierre_inscripcion     TIMESTAMPTZ,
    plazo_grupos_dias      INTEGER NOT NULL DEFAULT 21,
    plazo_por_ronda_dias   INTEGER NOT NULL DEFAULT 7,

    -- formato
    cantidad_grupos        INTEGER           NOT NULL DEFAULT 8,
    clasifican_por_grupo   INTEGER           NOT NULL DEFAULT 2,
    tiene_complementaria   BOOLEAN           NOT NULL DEFAULT TRUE,
    modo_distribucion      modo_distribucion NOT NULL DEFAULT 'SERPENTINA',
    modo_sorteo            modo_sorteo       NOT NULL DEFAULT 'MANUAL',
    sorteo_confirmado      BOOLEAN           NOT NULL DEFAULT FALSE,
    grupos_cerrados        BOOLEAN           NOT NULL DEFAULT FALSE,

    -- sistema de juego
    sets_por_partido       INTEGER     NOT NULL DEFAULT 3,
    punto_de_oro           BOOLEAN     NOT NULL DEFAULT TRUE,
    tercero_set            tercero_set NOT NULL DEFAULT 'SUPER_TIEBREAK',
    games_por_set          INTEGER     NOT NULL DEFAULT 6,
    puntos_tie_break       INTEGER     NOT NULL DEFAULT 7,
    puntos_super_tie_break INTEGER     NOT NULL DEFAULT 10,

    -- sedes
    sede_grupos            modo_sede NOT NULL DEFAULT 'LIBRE',
    sede_eliminatorias     modo_sede NOT NULL DEFAULT 'DESIGNADA',

    creado_en              TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- una sola vez cada categoría por edición del evento
    CONSTRAINT uq_torneo_edicion_categoria UNIQUE (organizacion_id, edicion, categoria_id),
    CONSTRAINT ck_torneo_cupo       CHECK (cupo > 0),
    CONSTRAINT ck_torneo_precio     CHECK (precio >= 0),
    CONSTRAINT ck_torneo_grupos     CHECK (cantidad_grupos > 0),
    CONSTRAINT ck_torneo_clasifican CHECK (clasifican_por_grupo > 0),
    CONSTRAINT ck_torneo_reserva    CHECK (minutos_reserva_cupo > 0),
    CONSTRAINT ck_torneo_fechas     CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);
CREATE INDEX ix_torneos_org_estado ON torneos (organizacion_id, estado); -- listar publicados
CREATE INDEX ix_torneos_etapa      ON torneos (etapa_id);                -- cálculo de ranking
CREATE INDEX ix_torneos_categoria  ON torneos (categoria_id);            -- FK

-- ============================================================================
-- INSCRIPCIONES Y PAGOS
-- ============================================================================

CREATE TABLE inscripciones (
    id                 SERIAL PRIMARY KEY,
    torneo_id          INTEGER            NOT NULL REFERENCES torneos(id)   ON DELETE CASCADE,
    jugador_id         INTEGER            NOT NULL REFERENCES jugadores(id) ON DELETE RESTRICT,
    grupo              VARCHAR(2),        -- 'A', 'B'... null hasta el sorteo
    estado             estado_inscripcion NOT NULL DEFAULT 'PENDIENTE_PAGO',
    reserva_vence      TIMESTAMPTZ,
    orden_lista_espera INTEGER,
    posicion_siembra   INTEGER,
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_inscripcion UNIQUE (torneo_id, jugador_id)
);
CREATE INDEX ix_inscripciones_estado  ON inscripciones (torneo_id, estado); -- contar cupo
CREATE INDEX ix_inscripciones_jugador ON inscripciones (jugador_id);        -- historial
CREATE INDEX ix_inscripciones_grupo   ON inscripciones (torneo_id, grupo);  -- integrantes del grupo

CREATE TABLE pagos (
    id                  SERIAL PRIMARY KEY,
    inscripcion_id      INTEGER        NOT NULL UNIQUE REFERENCES inscripciones(id) ON DELETE CASCADE,
    medio               medio_pago     NOT NULL DEFAULT 'MERCADOPAGO',
    estado              estado_pago    NOT NULL DEFAULT 'PENDIENTE',
    monto               NUMERIC(12, 2) NOT NULL,
    mp_preference_id    VARCHAR(120),
    -- el UNIQUE ya crea el índice: no hace falta uno aparte
    mp_payment_id       VARCHAR(120) UNIQUE,
    payload_crudo       JSONB,
    requiere_devolucion BOOLEAN        NOT NULL DEFAULT FALSE,
    devuelto_en         TIMESTAMPTZ,
    creado_en           TIMESTAMPTZ    NOT NULL DEFAULT now(),
    actualizado_en      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT ck_pago_monto CHECK (monto >= 0)
);

-- Hoy siempre tipo PLATAFORMA. Los tokens quedan listos para Marketplace.
CREATE TABLE cuentas_cobro (
    id              SERIAL PRIMARY KEY,
    organizacion_id INTEGER           NOT NULL UNIQUE REFERENCES organizaciones(id) ON DELETE CASCADE,
    tipo            tipo_cuenta_cobro NOT NULL DEFAULT 'PLATAFORMA',
    access_token    TEXT,
    refresh_token   TEXT,
    token_vence     TIMESTAMPTZ
);

CREATE TABLE liquidaciones (
    id                 SERIAL PRIMARY KEY,
    torneo_id          INTEGER            NOT NULL UNIQUE REFERENCES torneos(id) ON DELETE CASCADE,
    monto_recaudado    NUMERIC(12, 2)     NOT NULL DEFAULT 0,
    comision           NUMERIC(12, 2)     NOT NULL DEFAULT 0,
    monto_organizacion NUMERIC(12, 2)     NOT NULL DEFAULT 0,
    estado             estado_liquidacion NOT NULL DEFAULT 'PENDIENTE',
    pagada_en          TIMESTAMPTZ
);

-- ============================================================================
-- PARTIDOS
-- ============================================================================

CREATE TABLE partidos (
    id                   SERIAL PRIMARY KEY,
    torneo_id            INTEGER        NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
    fase                 fase_partido   NOT NULL,
    grupo                VARCHAR(2),    -- 'A', 'B'... solo en fase de grupos
    cuadro               cuadro,
    ronda                INTEGER,
    orden_en_ronda       INTEGER,
    siguiente_partido_id INTEGER        REFERENCES partidos(id) ON DELETE SET NULL,

    jugador_a_id         INTEGER        REFERENCES jugadores(id) ON DELETE SET NULL,
    jugador_b_id         INTEGER        REFERENCES jugadores(id) ON DELETE SET NULL,
    -- redundancia intencional: derivable de los sets, pero se consulta todo
    -- el tiempo. Se escribe en la misma transacción que los sets.
    ganador_id           INTEGER        REFERENCES jugadores(id) ON DELETE SET NULL,

    estado               estado_partido NOT NULL DEFAULT 'PENDIENTE_COORDINACION',

    -- coordinación
    fecha_limite         TIMESTAMPTZ,
    fecha_acordada       TIMESTAMPTZ,
    club_id              INTEGER      REFERENCES clubes(id)   ON DELETE SET NULL,
    cancha_id            INTEGER      REFERENCES canchas(id)  ON DELETE SET NULL,
    sede_texto           VARCHAR(150),
    anotada_por_id       INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
    confirmada_por_id    INTEGER      REFERENCES usuarios(id) ON DELETE SET NULL,
    reprogramaciones     INTEGER      NOT NULL DEFAULT 0,

    observaciones        TEXT,

    creado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- un partido de grupos tiene grupo y no cuadro; uno de eliminatoria al revés
    CONSTRAINT ck_partido_fase CHECK (
        (fase = 'GRUPOS'       AND grupo  IS NOT NULL AND cuadro IS NULL)
     OR (fase = 'ELIMINATORIA' AND cuadro IS NOT NULL AND grupo  IS NULL)
    ),
    CONSTRAINT ck_partido_distintos CHECK (
        jugador_a_id IS NULL OR jugador_b_id IS NULL OR jugador_a_id <> jugador_b_id
    ),
    CONSTRAINT ck_partido_ganador CHECK (
        ganador_id IS NULL OR ganador_id = jugador_a_id OR ganador_id = jugador_b_id
    ),
    CONSTRAINT ck_partido_reprogramaciones CHECK (reprogramaciones >= 0)
);
CREATE INDEX ix_partidos_fase      ON partidos (torneo_id, fase);   -- zonas y cuadros
CREATE INDEX ix_partidos_estado    ON partidos (torneo_id, estado); -- tablero de avance
CREATE INDEX ix_partidos_grupo     ON partidos (torneo_id, grupo);  -- tabla de posiciones
CREATE INDEX ix_partidos_jugador_a ON partidos (jugador_a_id);      -- mis partidos / head-to-head
CREATE INDEX ix_partidos_jugador_b ON partidos (jugador_b_id);

-- Un set del partido. Puede ser un set normal o un super tie-break.
-- Para desempates: el super tie-break cuenta como 1 set Y como 1 game.
CREATE TABLE sets_partido (
    id                 SERIAL PRIMARY KEY,
    partido_id         INTEGER NOT NULL REFERENCES partidos(id) ON DELETE CASCADE,
    numero             INTEGER NOT NULL,
    games_a            INTEGER NOT NULL,
    games_b            INTEGER NOT NULL,
    tie_break_a        INTEGER,
    tie_break_b        INTEGER,
    es_super_tie_break BOOLEAN NOT NULL DEFAULT FALSE,
    -- este unique ya indexa partido_id
    CONSTRAINT uq_set_partido UNIQUE (partido_id, numero),
    CONSTRAINT ck_set_numero CHECK (numero BETWEEN 1 AND 5),
    CONSTRAINT ck_set_games  CHECK (games_a >= 0 AND games_b >= 0)
);

-- ============================================================================
-- RANKING
-- ============================================================================

-- Modelo de casilleros con reemplazo (igual que el ranking ATP).
-- Ranking vigente = por cada etapa, el movimiento más reciente; sumados.
-- El ranking NO se guarda: se calcula en cada consulta a partir de acá.
--
-- REDUNDANCIA INTENCIONAL respecto de partidos. Para un torneo jugado en el
-- sistema los puntos se podrían derivar del cuadro, pero se guardan porque:
--   * el historial importado no tiene partidos de los cuales derivar
--   * es una foto al cierre: si cambia la tabla de puntos, el pasado no se reescribe
--   * hay ajustes manuales que no corresponden a ningún partido
--   * derivarlo exigiría reconstruir cada cuadro de los últimos 12 meses
CREATE TABLE movimientos_ranking (
    id              SERIAL PRIMARY KEY,
    organizacion_id INTEGER           NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    jugador_id      INTEGER           NOT NULL REFERENCES jugadores(id)      ON DELETE CASCADE,
    categoria_id    INTEGER           NOT NULL REFERENCES categorias(id)     ON DELETE RESTRICT,
    etapa_id        INTEGER           REFERENCES etapas(id)  ON DELETE SET NULL,
    torneo_id       INTEGER           REFERENCES torneos(id) ON DELETE SET NULL,
    puntos          INTEGER           NOT NULL,
    instancia       instancia,
    motivo          motivo_movimiento NOT NULL,
    detalle         TEXT,
    fecha           TIMESTAMPTZ       NOT NULL DEFAULT now()
);
CREATE INDEX ix_mov_ranking   ON movimientos_ranking (organizacion_id, categoria_id);     -- tabla de ranking
CREATE INDEX ix_mov_casillero ON movimientos_ranking (jugador_id, categoria_id, etapa_id); -- casillero
CREATE INDEX ix_mov_torneo    ON movimientos_ranking (torneo_id);                          -- revertir torneo

-- ============================================================================
-- FUNCIONALIDADES ASISTIDAS POR IA
-- ============================================================================

-- F03 — Carga masiva de jugadores desde planilla.
CREATE TABLE importaciones_padron (
    id              SERIAL PRIMARY KEY,
    organizacion_id INTEGER           NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    archivo_nombre  VARCHAR(255)      NOT NULL,
    archivo_url     TEXT,
    respuesta_cruda JSONB,
    resumen         JSONB,
    estado          estado_proceso_ia NOT NULL DEFAULT 'PENDIENTE',
    confirmada_en   TIMESTAMPTZ,
    creado_en       TIMESTAMPTZ       NOT NULL DEFAULT now()
);
CREATE INDEX ix_importaciones_org ON importaciones_padron (organizacion_id);

-- F19 — Registro de resultados a partir de mensajes.
CREATE TABLE extracciones_resultado (
    id              SERIAL PRIMARY KEY,
    partido_id      INTEGER           REFERENCES partidos(id) ON DELETE SET NULL,
    entrada_cruda   TEXT              NOT NULL,
    respuesta_cruda JSONB,
    estado          estado_proceso_ia NOT NULL DEFAULT 'PENDIENTE',
    confirmada_en   TIMESTAMPTZ,
    creado_en       TIMESTAMPTZ       NOT NULL DEFAULT now()
);
CREATE INDEX ix_extracciones_partido ON extracciones_resultado (partido_id);

COMMIT;

-- ============================================================================
-- NOTAS
-- ============================================================================
--
-- 1. RANKING VIGENTE. No es SUM(puntos). Hay que tomar, por cada casillero de
--    etapa, el movimiento más reciente, y recién ahí sumar:
--
--    SELECT j.id, j.nombre, j.apellido, COALESCE(SUM(m.puntos), 0) AS total
--    FROM jugadores j
--    LEFT JOIN LATERAL (
--        SELECT DISTINCT ON (mr.etapa_id) mr.puntos
--        FROM movimientos_ranking mr
--        WHERE mr.jugador_id = j.id
--          AND mr.categoria_id = $1
--          AND mr.fecha >= now() - INTERVAL '12 months'
--        ORDER BY mr.etapa_id, mr.fecha DESC
--    ) m ON TRUE
--    WHERE j.organizacion_id = $2 AND j.categoria_id = $1 AND j.activo
--    GROUP BY j.id
--    ORDER BY total DESC, j.apellido;
--
--    Usa ix_mov_casillero.
--
-- 2. AGRUPAR LAS CATEGORÍAS DE UN EVENTO. Como cada torneo es de una
--    categoría, las dos "Primavera 2026" se recuperan por edicion:
--
--    SELECT * FROM torneos
--    WHERE organizacion_id = $1 AND edicion = 'Primavera 2026';
--
-- 3. AISLAMIENTO MULTI-ORGANIZACIÓN. Toda consulta filtra por organizacion_id.
--    Las tablas que no lo tienen (partidos, sets) llegan vía torneos.
--
-- 7. TODO LO DE UN JUGADOR EN UN TORNEO. Dos JOINs:
--
--    SELECT i.estado, i.grupo, i.posicion_siembra,
--           p.fase, p.cuadro, p.ronda, p.estado, p.ganador_id,
--           s.numero, s.games_a, s.games_b
--    FROM inscripciones i
--    JOIN partidos p
--      ON p.torneo_id = i.torneo_id
--     AND (p.jugador_a_id = i.jugador_id OR p.jugador_b_id = i.jugador_id)
--    LEFT JOIN sets_partido s ON s.partido_id = p.id
--    WHERE i.torneo_id = $1 AND i.jugador_id = $2;
--
-- 4. RESERVA DE CUPO. El job que expira reservas vencidas:
--
--    UPDATE inscripciones SET estado = 'EXPIRADA'
--    WHERE estado = 'PENDIENTE_PAGO' AND reserva_vence < now();
--
--    Para evitar sobreventa, contar el cupo en la misma transacción que crea
--    la inscripción, con SELECT ... FOR UPDATE sobre torneos.
--
-- 5. uq_jugador_dni_org. En PostgreSQL NULL no colisiona con NULL en un UNIQUE,
--    así que puede haber muchos jugadores sin DNI en la misma organización.
--    Es el comportamiento buscado mientras el padrón no lo tenga cargado.
--
-- 6. actualizado_en. Prisma lo mantiene desde la aplicación (@updatedAt).
--    Si se escribe por SQL directo, agregar un trigger BEFORE UPDATE.
-- ============================================================================