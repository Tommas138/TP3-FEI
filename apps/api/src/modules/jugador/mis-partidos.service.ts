import { EstadoTorneo } from '@prisma/client';
import type { RespuestaMisPartidos } from '@setpoint/shared';
import { perfilDeJugador } from '../../lib/permisos';
import { prisma } from '../../lib/prisma';
import { partidosDelJugador } from './mis-partidos';

const EN_JUEGO = [EstadoTorneo.ZONAS_GENERADAS, EstadoTorneo.GRUPOS_EN_CURSO, EstadoTorneo.ELIMINATORIAS];

const JUGADOR = { select: { nombre: true, apellido: true, telefono: true } };

// Los partidos del jugador que pregunta en todos sus torneos en juego (F11): pueden ser dos,
// las eliminatorias de uno y las zonas del siguiente. El teléfono solo sale de los rivales de un
// partido por jugar (decisión 046).
export async function misPartidos(slug: string, usuarioId: number): Promise<RespuestaMisPartidos> {
  const { organizacionId, jugadorId } = await perfilDeJugador(slug, usuarioId);

  const torneos = await prisma.torneo.findMany({
    where: {
      organizacionId,
      sorteoConfirmado: true,
      estado: { in: EN_JUEGO },
      inscripciones: { some: { jugadorId, grupo: { not: null } } },
    },
    orderBy: { id: 'asc' },
    select: { id: true, nombre: true, edicion: true },
  });
  if (torneos.length === 0) return { partidos: null };

  const partidos = await prisma.partido.findMany({
    where: { torneoId: { in: torneos.map((t) => t.id) } },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      torneoId: true,
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

  const nombres = torneos.map((t) => t.edicion ?? t.nombre);
  return {
    partidos: {
      torneos: nombres,
      // Con más de un torneo, cada partido dice de cuál es.
      partidos: torneos.flatMap((t, i) =>
        partidosDelJugador(
          jugadorId,
          partidos.filter((p) => p.torneoId === t.id),
          torneos.length > 1 ? nombres[i] : undefined,
        ),
      ),
    },
  };
}
