import {
  EstadoInscripcion,
  EstadoTorneo,
  type ModoInscripcion,
  type ModoSede,
  type Prisma,
  type TerceroSet,
} from '@prisma/client';
import type {
  Convocatoria,
  DatosConvocatoria,
  EstadoTorneo as ClaveEstado,
  ResumenConvocatoria,
} from '@setpoint/shared';
import { organizacionAdministrada } from '../../lib/permisos';
import { prisma } from '../../lib/prisma';
import { ErrorHttp } from '../../middleware/errores';

// Las claves del contrato son los valores de los enums de Prisma en minúscula.
const aEnum = <T extends string>(valor: string) => valor.toUpperCase() as T;
const aClave = <T extends string>(valor: string) => valor.toLowerCase() as T;

// 'AAAA-MM-DD' <-> DateTime a medianoche UTC, para que la fecha no se corra por zona horaria.
const aFecha = (dia: string | null) => (dia === null ? null : new Date(`${dia}T00:00:00.000Z`));
const aDia = (fecha: Date | null) => (fecha === null ? null : fecha.toISOString().slice(0, 10));

const CON_RELACIONES = {
  categoria: { select: { nombre: true } },
  etapa: { select: { nombre: true } },
  clubSede: { select: { nombre: true } },
} satisfies Prisma.TorneoInclude;

type TorneoConRelaciones = Prisma.TorneoGetPayload<{ include: typeof CON_RELACIONES }>;

// Los torneos de una convocatoria comparten `edicion`. El primero (menor id) la representa.
async function torneosDeLaConvocatoria(organizacionId: number, torneoId: number) {
  if (!Number.isInteger(torneoId)) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');

  // El filtro por organización es el aislamiento: el id solo no alcanza.
  const torneo = await prisma.torneo.findFirst({
    where: { id: torneoId, organizacionId },
    select: { id: true, edicion: true },
  });
  if (!torneo) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');

  return prisma.torneo.findMany({
    where: torneo.edicion === null ? { id: torneo.id } : { organizacionId, edicion: torneo.edicion },
    orderBy: { id: 'asc' },
    include: CON_RELACIONES,
  });
}

function aConvocatoria(torneos: TorneoConRelaciones[]): Convocatoria {
  // Todo lo que no es categoría ni cupo se guarda igual en los torneos de la convocatoria.
  const [t] = torneos;
  return {
    id: t.id,
    estado: aClave<ClaveEstado>(t.estado),
    torneos: torneos.map((x) => ({ id: x.id, categoria: x.categoria.nombre })),

    nombre: t.nombre,
    descripcion: t.descripcion ?? '',
    etapa: t.etapa?.nombre ?? null,
    categorias: torneos.map((x) => ({ categoria: x.categoria.nombre, cupo: x.cupo })),

    precio: t.precio.toNumber(),
    modoInscripcion: aClave(t.modoInscripcion),
    tieneListaEspera: t.tieneListaEspera,
    cierreInscripcion: aDia(t.cierreInscripcion),
    fechaInicio: aDia(t.fechaInicio),

    cantidadGrupos: t.cantidadGrupos,
    clasificanPorGrupo: t.clasificanPorGrupo,
    tieneComplementaria: t.tieneComplementaria,

    setsPorPartido: t.setsPorPartido === 5 ? 5 : 3,
    puntoDeOro: t.puntoDeOro,
    terceroSet: aClave(t.terceroSet),
    gamesPorSet: t.gamesPorSet,
    puntosTieBreak: t.puntosTieBreak,
    puntosSuperTieBreak: t.puntosSuperTieBreak,

    plazoGruposDias: t.plazoGruposDias,
    plazoPorRondaDias: t.plazoPorRondaDias,

    sedeGrupos: aClave(t.sedeGrupos),
    sedeEliminatorias: aClave(t.sedeEliminatorias),
    clubSede: t.clubSede?.nombre ?? null,
  };
}

// Traduce los nombres que llegan (categorías, etapa, club) a ids de la organización.
async function resolverNombres(organizacionId: number, datos: DatosConvocatoria) {
  const organizacion = await prisma.organizacion.findUniqueOrThrow({
    where: { id: organizacionId },
    select: {
      usaRanking: true,
      categorias: { where: { activa: true }, select: { id: true, nombre: true } },
      etapas: { where: { activa: true }, select: { id: true, nombre: true } },
      clubes: { select: { id: true, nombre: true } },
    },
  });

  const buscar = (filas: { id: number; nombre: string }[], nombre: string) =>
    filas.find((f) => f.nombre.toLowerCase() === nombre.toLowerCase())?.id;

  const categoriaIds = datos.categorias.map((c) => {
    const id = buscar(organizacion.categorias, c.categoria);
    if (id === undefined) throw new ErrorHttp(400, 'CATEGORIA_NO_ENCONTRADA');
    return id;
  });

  let etapaId: number | null = null;
  if (datos.etapa !== null) {
    // Sin ranking no hay casilleros que actualizar: el torneo es suelto sí o sí.
    if (!organizacion.usaRanking) throw new ErrorHttp(400, 'CIRCUITO_SIN_RANKING');
    etapaId = buscar(organizacion.etapas, datos.etapa) ?? null;
    if (etapaId === null) throw new ErrorHttp(400, 'ETAPA_NO_ENCONTRADA');
  }

  let clubSedeId: number | null = null;
  if (datos.clubSede !== null) {
    clubSedeId = buscar(organizacion.clubes, datos.clubSede) ?? null;
    if (clubSedeId === null) throw new ErrorHttp(400, 'CLUB_NO_ENCONTRADO');
  }

  return { categoriaIds, etapaId, clubSedeId };
}

// Columnas compartidas por todos los torneos de la convocatoria.
function columnasCompartidas(datos: DatosConvocatoria, etapaId: number | null, clubSedeId: number | null) {
  return {
    nombre: datos.nombre,
    // La edición agrupa los torneos de la convocatoria: es su nombre.
    edicion: datos.nombre,
    descripcion: datos.descripcion || null,
    etapaId,
    clubSedeId,

    precio: datos.precio,
    modoInscripcion: aEnum<ModoInscripcion>(datos.modoInscripcion),
    tieneListaEspera: datos.tieneListaEspera,
    cierreInscripcion: aFecha(datos.cierreInscripcion),
    fechaInicio: aFecha(datos.fechaInicio),

    cantidadGrupos: datos.cantidadGrupos,
    clasificanPorGrupo: datos.clasificanPorGrupo,
    tieneComplementaria: datos.tieneComplementaria,

    setsPorPartido: datos.setsPorPartido,
    puntoDeOro: datos.puntoDeOro,
    terceroSet: aEnum<TerceroSet>(datos.terceroSet),
    gamesPorSet: datos.gamesPorSet,
    puntosTieBreak: datos.puntosTieBreak,
    puntosSuperTieBreak: datos.puntosSuperTieBreak,

    plazoGruposDias: datos.plazoGruposDias,
    plazoPorRondaDias: datos.plazoPorRondaDias,

    sedeGrupos: aEnum<ModoSede>(datos.sedeGrupos),
    sedeEliminatorias: aEnum<ModoSede>(datos.sedeEliminatorias),
  } satisfies Partial<Prisma.TorneoUncheckedCreateInput>;
}

// El nombre identifica a la convocatoria dentro de la organización. `excepto` es la propia,
// para que guardarla sin cambiar el nombre no choque consigo misma.
async function verificarNombreLibre(organizacionId: number, nombre: string, excepto?: string) {
  if (excepto !== undefined && nombre.toLowerCase() === excepto.toLowerCase()) return;
  const otro = await prisma.torneo.findFirst({
    where: { organizacionId, edicion: { equals: nombre, mode: 'insensitive' } },
    select: { id: true },
  });
  if (otro) throw new ErrorHttp(409, 'NOMBRE_REPETIDO');
}

export async function obtenerConvocatoria(slug: string, usuarioId: number, torneoId: number) {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  return aConvocatoria(await torneosDeLaConvocatoria(organizacionId, torneoId));
}

// Se crea en borrador: no es visible para los jugadores hasta que se publique.
export async function crearConvocatoria(slug: string, usuarioId: number, datos: DatosConvocatoria) {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  await verificarNombreLibre(organizacionId, datos.nombre);
  const { categoriaIds, etapaId, clubSedeId } = await resolverNombres(organizacionId, datos);
  const compartidas = columnasCompartidas(datos, etapaId, clubSedeId);

  const ids = await prisma.$transaction((tx) =>
    Promise.all(
      datos.categorias.map((c, i) =>
        tx.torneo.create({
          data: { ...compartidas, organizacionId, categoriaId: categoriaIds[i], cupo: c.cupo },
          select: { id: true },
        }),
      ),
    ),
  );

  return obtenerConvocatoria(slug, usuarioId, Math.min(...ids.map((t) => t.id)));
}

export async function editarConvocatoria(slug: string, usuarioId: number, torneoId: number, datos: DatosConvocatoria) {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  const torneos = await torneosDeLaConvocatoria(organizacionId, torneoId);

  // Se edita en borrador y mientras la inscripción está abierta. Después, el sorteo ya usó el formato.
  const enBorrador = torneos.every((t) => t.estado === EstadoTorneo.BORRADOR);
  const publicado = torneos.every((t) => t.estado === EstadoTorneo.PUBLICADO);
  if (!enBorrador && !publicado) throw new ErrorHttp(409, 'TORNEO_NO_EDITABLE');

  const [principal, ...resto] = torneos;
  await verificarNombreLibre(organizacionId, datos.nombre, principal.edicion ?? principal.nombre);

  if (publicado) {
    await editarPublicada(torneos, datos);
    return obtenerConvocatoria(slug, usuarioId, principal.id);
  }

  const { categoriaIds, etapaId, clubSedeId } = await resolverNombres(organizacionId, datos);
  const compartidas = columnasCompartidas(datos, etapaId, clubSedeId);

  // En borrador los torneos no tienen inscripciones ni partidos: cambiar las categorías es
  // borrar los demás y recrearlos. El principal se conserva para que el id de la URL no cambie.
  await prisma.$transaction(async (tx) => {
    if (resto.length > 0) await tx.torneo.deleteMany({ where: { id: { in: resto.map((t) => t.id) } } });

    const [primera, ...demas] = datos.categorias;
    await tx.torneo.update({
      where: { id: principal.id },
      data: { ...compartidas, categoriaId: categoriaIds[0], cupo: primera.cupo },
    });

    for (const [i, c] of demas.entries()) {
      await tx.torneo.create({
        data: { ...compartidas, organizacionId, categoriaId: categoriaIds[i + 1], cupo: c.cupo },
      });
    }
  });

  return obtenerConvocatoria(slug, usuarioId, principal.id);
}

// Inscripciones que ocupan un lugar del cupo. La lista de espera no ocupa: espera uno.
const OCUPAN_CUPO = [EstadoInscripcion.PENDIENTE_PAGO, EstadoInscripcion.PAGADA];

// Con la inscripción abierta cada torneo puede tener inscripciones colgando: no se borra ni se
// recrea nada. Las categorías quedan fijas y cada fila se actualiza con el cupo de la suya.
async function editarPublicada(torneos: TorneoConRelaciones[], datos: DatosConvocatoria) {
  const cupoPorCategoria = new Map(datos.categorias.map((c) => [c.categoria.toLowerCase(), c.cupo]));
  const mismasCategorias =
    cupoPorCategoria.size === torneos.length &&
    torneos.every((t) => cupoPorCategoria.has(t.categoria.nombre.toLowerCase()));
  if (!mismasCategorias) throw new ErrorHttp(409, 'CATEGORIAS_BLOQUEADAS');

  const ocupados = await prisma.inscripcion.groupBy({
    by: ['torneoId'],
    where: { torneoId: { in: torneos.map((t) => t.id) }, estado: { in: OCUPAN_CUPO } },
    _count: { _all: true },
  });
  const cupoDe = (t: TorneoConRelaciones) => cupoPorCategoria.get(t.categoria.nombre.toLowerCase())!;
  for (const t of torneos) {
    const inscriptos = ocupados.find((o) => o.torneoId === t.id)?._count._all ?? 0;
    if (cupoDe(t) < inscriptos) throw new ErrorHttp(409, 'CUPO_MENOR_A_INSCRIPTOS');
  }

  const { etapaId, clubSedeId } = await resolverNombres(torneos[0].organizacionId, datos);
  const compartidas = columnasCompartidas(datos, etapaId, clubSedeId);

  await prisma.$transaction(
    torneos.map((t) => prisma.torneo.update({ where: { id: t.id }, data: { ...compartidas, cupo: cupoDe(t) } })),
  );
}

// Día de hoy en Argentina como 'AAAA-MM-DD'. En UTC, de noche ya sería mañana.
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

// Publicar abre la inscripción: el torneo se vuelve visible para los jugadores.
export async function publicarConvocatoria(slug: string, usuarioId: number, torneoId: number) {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  const torneos = await torneosDeLaConvocatoria(organizacionId, torneoId);
  if (torneos.some((t) => t.estado !== EstadoTorneo.BORRADOR)) throw new ErrorHttp(409, 'TORNEO_NO_EDITABLE');

  // El borrador puede guardarse sin fechas; publicarlo no. Los datos son iguales en todas las filas.
  const { cierreInscripcion, fechaInicio } = aConvocatoria(torneos);
  const campos: Record<string, string> = {};
  if (cierreInscripcion === null) campos.cierreInscripcion = 'Elegí cuándo cierra la inscripción';
  else if (cierreInscripcion < hoy()) campos.cierreInscripcion = 'La inscripción no puede cerrar en una fecha pasada';
  if (fechaInicio === null) campos.fechaInicio = 'Elegí cuándo empieza el torneo';
  if (Object.keys(campos).length > 0) throw new ErrorHttp(400, 'DATOS_INCOMPLETOS', campos);

  await prisma.torneo.updateMany({
    where: { id: { in: torneos.map((t) => t.id) }, estado: EstadoTorneo.BORRADOR },
    data: { estado: EstadoTorneo.PUBLICADO },
  });

  return obtenerConvocatoria(slug, usuarioId, torneos[0].id);
}

// Una fila por convocatoria, de la más nueva a la más vieja.
export async function listarConvocatorias(slug: string, usuarioId: number): Promise<ResumenConvocatoria[]> {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  const torneos = await prisma.torneo.findMany({
    where: { organizacionId },
    orderBy: { id: 'asc' },
    include: {
      ...CON_RELACIONES,
      // Solo las pagadas: una reserva sin pagar todavía puede vencer.
      _count: { select: { inscripciones: { where: { estado: EstadoInscripcion.PAGADA } } } },
    },
  });

  // Mismo agrupamiento que torneosDeLaConvocatoria: por edición, o el torneo solo si no tiene.
  const porEdicion = new Map<string, typeof torneos>();
  for (const t of torneos) {
    const clave = t.edicion ?? `#${t.id}`;
    porEdicion.set(clave, [...(porEdicion.get(clave) ?? []), t]);
  }

  return [...porEdicion.values()]
    .map((grupo) => {
      const c = aConvocatoria(grupo);
      return {
        id: c.id,
        nombre: c.nombre,
        estado: c.estado,
        torneos: grupo.map((t) => ({
          id: t.id,
          categoria: t.categoria.nombre,
          estado: aClave<ClaveEstado>(t.estado),
          cupo: t.cupo,
          inscriptos: t._count.inscripciones,
        })),
        cierreInscripcion: c.cierreInscripcion,
        fechaInicio: c.fechaInicio,
        precio: c.precio,
      };
    })
    .sort((a, b) => b.id - a.id);
}
