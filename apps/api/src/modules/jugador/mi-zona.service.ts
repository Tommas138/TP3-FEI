import { EstadoTorneo, FasePartido } from '@prisma/client';
import type { RespuestaMiZona } from '@setpoint/shared';
import { perfilDeJugador } from '../../lib/permisos';
import { prisma } from '../../lib/prisma';
import { inscriptosYPartidos, INCLUIR_ZONAS } from '../competencia/posiciones.service';
import { zonasConPosiciones } from '../competencia/posiciones';

// Mientras el torneo está en estos estados, la zona del jugador se muestra. En eliminatorias
// ya está cerrada, pero sigue siendo la referencia de cómo llegó a cada cuadro.
const CON_ZONA_EN_JUEGO = [EstadoTorneo.ZONAS_GENERADAS, EstadoTorneo.GRUPOS_EN_CURSO, EstadoTorneo.ELIMINATORIAS];
const ZONA_ABIERTA: EstadoTorneo[] = [EstadoTorneo.ZONAS_GENERADAS, EstadoTorneo.GRUPOS_EN_CURSO];

// La zona del jugador que pregunta (F11). Si está en más de un torneo, la que se está jugando
// va antes que una ya cerrada; entre iguales, la del torneo más nuevo.
// La tabla sale de la misma cuenta que las posiciones de la organización (decisión 019).
export async function miZona(slug: string, usuarioId: number): Promise<RespuestaMiZona> {
  const { organizacionId, jugadorId } = await perfilDeJugador(slug, usuarioId);

  const inscripciones = await prisma.inscripcion.findMany({
    where: {
      jugadorId,
      grupo: { not: null },
      torneo: { organizacionId, sorteoConfirmado: true, estado: { in: CON_ZONA_EN_JUEGO } },
    },
    orderBy: { torneoId: 'desc' },
    select: { torneoId: true, grupo: true, torneo: { select: { estado: true } } },
  });
  const inscripcion = inscripciones.find((i) => ZONA_ABIERTA.includes(i.torneo.estado)) ?? inscripciones[0];
  if (!inscripcion) return { zona: null };
  const grupo = inscripcion.grupo!;

  const [torneo, partidos] = await Promise.all([
    prisma.torneo.findUniqueOrThrow({
      where: { id: inscripcion.torneoId },
      include: { categoria: { select: { nombre: true } }, organizacion: { select: { usaRanking: true } }, ...INCLUIR_ZONAS },
    }),
    prisma.partido.findMany({
      where: { torneoId: inscripcion.torneoId, fase: FasePartido.GRUPOS, grupo },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        jugadorAId: true,
        jugadorBId: true,
        ganadorId: true,
        estado: true,
        fechaAcordada: true,
        fechaLimite: true,
        sets: { select: { gamesA: true, gamesB: true, esSuperTieBreak: true }, orderBy: { numero: 'asc' } },
      },
    }),
  ]);

  const { inscriptos, partidos: partidosDeLaTabla } = inscriptosYPartidos(torneo);
  const [zona] = zonasConPosiciones(
    inscriptos.filter((i) => i.grupo === grupo),
    partidosDeLaTabla.filter((p) => p.grupo === grupo),
    torneo,
  );
  const limites = partidos.flatMap((p) => (p.fechaLimite ? [p.fechaLimite.getTime()] : []));

  return {
    zona: {
      torneoId: torneo.id,
      nombre: `${torneo.edicion ?? torneo.nombre} · ${torneo.categoria.nombre}`,
      grupo,
      usaRanking: torneo.organizacion.usaRanking,
      clasificanPorGrupo: torneo.clasificanPorGrupo,
      tieneComplementaria: torneo.tieneComplementaria,
      vence: limites.length > 0 ? new Date(Math.max(...limites)).toISOString() : null,
      filas: zona.filas,
      // En la fase de grupos los dos jugadores están siempre: los escribe el sorteo.
      partidos: partidos.map((p) => ({
        id: p.id,
        jugadorAId: p.jugadorAId!,
        jugadorBId: p.jugadorBId!,
        ganadorId: p.ganadorId,
        estado: p.estado,
        fechaAcordada: p.fechaAcordada?.toISOString() ?? null,
        sets: p.sets,
      })),
    },
  };
}
