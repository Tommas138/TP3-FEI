import { EstadoTorneo } from '@prisma/client';
import type { RespuestaMisPartidos } from '@setpoint/shared';
import { perfilDeJugador } from '../../lib/permisos';
import { prisma } from '../../lib/prisma';
import { partidosDelJugador } from './mis-partidos';

const EN_JUEGO = [EstadoTorneo.ZONAS_GENERADAS, EstadoTorneo.GRUPOS_EN_CURSO, EstadoTorneo.ELIMINATORIAS];

const JUGADOR = { select: { nombre: true, apellido: true, telefono: true } };

// Los partidos del jugador que pregunta en su torneo más reciente en juego (F11). El teléfono
// solo sale de los rivales de un partido por jugar (decisión 046).
export async function misPartidos(slug: string, usuarioId: number): Promise<RespuestaMisPartidos> {
  const { organizacionId, jugadorId } = await perfilDeJugador(slug, usuarioId);

  const inscripcion = await prisma.inscripcion.findFirst({
    where: {
      jugadorId,
      grupo: { not: null },
      torneo: { organizacionId, sorteoConfirmado: true, estado: { in: EN_JUEGO } },
    },
    orderBy: { torneoId: 'desc' },
    select: { torneo: { select: { id: true, nombre: true, edicion: true } } },
  });
  if (!inscripcion) return { partidos: null };
  const { torneo } = inscripcion;

  const partidos = await prisma.partido.findMany({
    where: { torneoId: torneo.id },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      fase: true,
      grupo: true,
      cuadro: true,
      ronda: true,
      jugadorAId: true,
      jugadorBId: true,
      ganadorId: true,
      estado: true,
      fechaAcordada: true,
      fechaLimite: true,
      sedeTexto: true,
      club: { select: { nombre: true } },
      cancha: { select: { nombre: true } },
      jugadorA: JUGADOR,
      jugadorB: JUGADOR,
      sets: { select: { gamesA: true, gamesB: true }, orderBy: { numero: 'asc' } },
    },
  });

  return {
    partidos: {
      torneoId: torneo.id,
      torneo: torneo.edicion ?? torneo.nombre,
      partidos: partidosDelJugador(jugadorId, partidos),
    },
  };
}
