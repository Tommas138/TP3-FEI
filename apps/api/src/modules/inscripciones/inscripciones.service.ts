import { EstadoInscripcion, EstadoTorneo, type Prisma } from '@prisma/client';
import type { EstadoTorneo as ClaveEstado, InscripcionesDelTorneo, MedioPago } from '@setpoint/shared';
import { organizacionAdministrada } from '../../lib/permisos';
import { prisma } from '../../lib/prisma';
import { ErrorHttp } from '../../middleware/errores';
import { alcanzanParaLasZonas } from '../competencia/sorteo';

// Inscripciones de un torneo (F13, versión mínima): ver quiénes ocupan el cupo y cerrar la
// inscripción para que la categoría quede lista para sortear.

// Las que ocupan un lugar del cupo. La lista de espera, las bajas y las vencidas llegan con F13 completa.
const OCUPAN_CUPO = [EstadoInscripcion.PAGADA, EstadoInscripcion.PENDIENTE_PAGO];

const CON_INSCRIPCIONES = {
  categoria: { select: { nombre: true } },
  inscripciones: {
    where: { estado: { in: OCUPAN_CUPO } },
    select: {
      id: true,
      estado: true,
      reservaVence: true,
      creadoEn: true,
      jugador: { select: { nombre: true, apellido: true } },
      pago: { select: { medio: true } },
    },
  },
} satisfies Prisma.TorneoInclude;

type TorneoConInscripciones = Prisma.TorneoGetPayload<{ include: typeof CON_INSCRIPCIONES }>;

// Día en Argentina como 'AAAA-MM-DD'. En UTC, de noche ya sería mañana.
const diaEnArgentina = (fecha: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(fecha);

// El :id de la URL es el de un torneo, no el de la convocatoria: cada categoría cierra aparte.
async function torneoDeLaOrganizacion(organizacionId: number, torneoId: number) {
  if (!Number.isInteger(torneoId)) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');

  // El filtro por organización es el aislamiento: el id solo no alcanza.
  const torneo = await prisma.torneo.findFirst({ where: { id: torneoId, organizacionId }, include: CON_INSCRIPCIONES });
  if (!torneo) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');
  return torneo;
}

const pagadas = (torneo: TorneoConInscripciones) =>
  torneo.inscripciones.filter((i) => i.estado === EstadoInscripcion.PAGADA).length;

// La convocatoria se identifica por su primer torneo (decisión 003).
async function idDeLaConvocatoria(torneo: TorneoConInscripciones) {
  if (torneo.edicion === null) return torneo.id;
  const primero = await prisma.torneo.findFirstOrThrow({
    where: { organizacionId: torneo.organizacionId, edicion: torneo.edicion },
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  return primero.id;
}

async function aInscripciones(torneo: TorneoConInscripciones): Promise<InscripcionesDelTorneo> {
  return {
    torneoId: torneo.id,
    convocatoriaId: await idDeLaConvocatoria(torneo),
    nombre: `${torneo.edicion ?? torneo.nombre} · ${torneo.categoria.nombre}`,
    estado: torneo.estado.toLowerCase() as ClaveEstado,
    sorteoConfirmado: torneo.sorteoConfirmado,
    cierreInscripcion: torneo.cierreInscripcion?.toISOString().slice(0, 10) ?? null,
    cupo: torneo.cupo,
    cantidadGrupos: torneo.cantidadGrupos,
    alcanzanParaLasZonas: alcanzanParaLasZonas(pagadas(torneo), torneo.cantidadGrupos),
    inscripciones: [...torneo.inscripciones]
      // La más reciente primero; las del mismo momento, por apellido.
      .sort(
        (a, b) =>
          b.creadoEn.getTime() - a.creadoEn.getTime() || a.jugador.apellido.localeCompare(b.jugador.apellido, 'es'),
      )
      .map((i) => ({
        id: i.id,
        nombre: i.jugador.nombre,
        apellido: i.jugador.apellido,
        estado: i.estado === EstadoInscripcion.PAGADA ? 'pagada' : 'reservando',
        medio: (i.pago?.medio.toLowerCase() as MedioPago | undefined) ?? null,
        fecha: diaEnArgentina(i.creadoEn),
        reservaVence: i.estado === EstadoInscripcion.PAGADA ? null : (i.reservaVence?.toISOString() ?? null),
      })),
  };
}

export async function obtenerInscripciones(slug: string, usuarioId: number, torneoId: number) {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  return aInscripciones(await torneoDeLaOrganizacion(organizacionId, torneoId));
}

// Cierra la inscripción de la categoría: queda lista para sortear. Las reservas sin pagar no se
// tocan: no entran al sorteo, que solo toma las pagadas (decisión 024).
export async function cerrarInscripcion(slug: string, usuarioId: number, torneoId: number) {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  const torneo = await torneoDeLaOrganizacion(organizacionId, torneoId);
  if (torneo.estado !== EstadoTorneo.PUBLICADO) throw new ErrorHttp(409, 'INSCRIPCION_NO_ABIERTA');

  // Cerrada, el formato ya no se edita ni la inscripción se reabre: si los que pagaron no
  // alcanzan para las zonas, la categoría quedaría sin poder sortearse (decisión 025).
  if (!alcanzanParaLasZonas(pagadas(torneo), torneo.cantidadGrupos)) {
    throw new ErrorHttp(409, 'INSCRIPTOS_INSUFICIENTES');
  }

  // Con el estado como condición, de dos cierres simultáneos solo uno cambia el torneo.
  const { count } = await prisma.torneo.updateMany({
    where: { id: torneo.id, organizacionId, estado: EstadoTorneo.PUBLICADO },
    data: { estado: EstadoTorneo.INSCRIPCIONES_CERRADAS },
  });
  if (count === 0) throw new ErrorHttp(409, 'INSCRIPCION_NO_ABIERTA');

  return obtenerInscripciones(slug, usuarioId, torneoId);
}
