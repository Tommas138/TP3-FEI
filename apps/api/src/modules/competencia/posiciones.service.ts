import { FasePartido, type Prisma } from '@prisma/client';
import type { Posiciones } from '@setpoint/shared';
import { organizacionAdministrada } from '../../lib/permisos';
import { prisma } from '../../lib/prisma';
import { ErrorHttp } from '../../middleware/errores';
import { zonasConPosiciones, type InscriptoEnZona, type PartidoEnZona } from './posiciones';

// Lo que hace falta leer para calcular las zonas. Lo usan las posiciones y el cierre de las
// zonas, que arma los cuadros con las mismas tablas.
export const INCLUIR_ZONAS = {
  // Quien tiene zona entró al sorteo confirmado, aunque después se haya bajado:
  // sus partidos siguen en la tabla.
  inscripciones: {
    where: { grupo: { not: null } },
    select: { jugadorId: true, grupo: true, posicionSiembra: true, jugador: { select: { nombre: true, apellido: true } } },
  },
  partidos: {
    where: { fase: FasePartido.GRUPOS },
    select: {
      grupo: true,
      jugadorAId: true,
      jugadorBId: true,
      ganadorId: true,
      estado: true,
      sets: { select: { gamesA: true, gamesB: true, esSuperTieBreak: true }, orderBy: { numero: 'asc' } },
    },
  },
} satisfies Prisma.TorneoInclude;

type TorneoConZonas = Prisma.TorneoGetPayload<{ include: typeof INCLUIR_ZONAS }>;

export function inscriptosYPartidos(torneo: TorneoConZonas): { inscriptos: InscriptoEnZona[]; partidos: PartidoEnZona[] } {
  return {
    inscriptos: torneo.inscripciones.map((i) => ({
      jugadorId: i.jugadorId,
      grupo: i.grupo!,
      posicionSiembra: i.posicionSiembra!,
      nombre: i.jugador.nombre,
      apellido: i.jugador.apellido,
    })),
    // En la fase de grupos los dos jugadores y la zona están siempre: los escribe el sorteo.
    partidos: torneo.partidos.map((p) => ({ ...p, grupo: p.grupo!, jugadorAId: p.jugadorAId!, jugadorBId: p.jugadorBId! })),
  };
}

// Tabla de posiciones de las zonas de un torneo (F07). No se guarda: se calcula en cada
// consulta a partir de los partidos, igual que el ranking.
export async function obtenerPosiciones(slug: string, usuarioId: number, torneoId: number): Promise<Posiciones> {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  if (!Number.isInteger(torneoId)) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');

  // El filtro por organización es el aislamiento: el id solo no alcanza.
  const torneo = await prisma.torneo.findFirst({
    where: { id: torneoId, organizacionId },
    include: {
      categoria: { select: { nombre: true } },
      organizacion: { select: { usaRanking: true } },
      ...INCLUIR_ZONAS,
    },
  });
  if (!torneo) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');
  // Antes de confirmar, las zonas son un borrador y no hay partidos (decisión 014).
  if (!torneo.sorteoConfirmado) throw new ErrorHttp(409, 'ZONAS_NO_GENERADAS');

  const { inscriptos, partidos } = inscriptosYPartidos(torneo);
  return {
    torneoId: torneo.id,
    nombre: `${torneo.edicion ?? torneo.nombre} · ${torneo.categoria.nombre}`,
    usaRanking: torneo.organizacion.usaRanking,
    clasificanPorGrupo: torneo.clasificanPorGrupo,
    tieneComplementaria: torneo.tieneComplementaria,
    zonas: zonasConPosiciones(inscriptos, partidos, torneo),
  };
}
