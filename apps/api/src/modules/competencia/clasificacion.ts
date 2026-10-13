// Tabla de posiciones de la zona (02-dominio.md §6).
// Lógica pura: recibe los partidos de una zona, devuelve la tabla. No toca la base.

// Mismos valores que el enum EstadoPartido de Prisma.
export type EstadoPartido =
  | 'PENDIENTE_COORDINACION'
  | 'ANOTADA'
  | 'CONFIRMADA'
  | 'JUGADA'
  | 'VENCIDA'
  | 'WALKOVER'
  | 'CANCELADA';

// Un set como lo guarda SetPartido. En un super tie-break, gamesA y gamesB son los puntos.
export type SetDelPartido = { gamesA: number; gamesB: number; esSuperTieBreak: boolean };

export type PartidoDeLaTabla = {
  jugadorAId: number;
  jugadorBId: number;
  ganadorId: number | null;
  estado: EstadoPartido;
  sets: SetDelPartido[];
};

export type Estadisticas = {
  jugadorId: number;
  partidosJugados: number;
  partidosGanados: number;
  setsGanados: number;
  setsPerdidos: number;
  gamesGanados: number;
  gamesPerdidos: number;
};

// Solo suman los partidos con resultado. Un W.O. tiene ganador aunque no tenga sets.
export function tieneResultado(partido: PartidoDeLaTabla) {
  return (partido.estado === 'JUGADA' || partido.estado === 'WALKOVER') && partido.ganadorId !== null;
}

// El W.O. se computa 6-0 6-0 a favor del rival (02-dominio.md §8.5). No se guardan sets:
// se arman acá a partir del estado y del ganador (decisión 016).
function setsDelResultado(partido: PartidoDeLaTabla): SetDelPartido[] {
  if (partido.estado !== 'WALKOVER') return partido.sets;
  const ganaA = partido.ganadorId === partido.jugadorAId;
  const set = { gamesA: ganaA ? 6 : 0, gamesB: ganaA ? 0 : 6, esSuperTieBreak: false };
  return [set, set];
}

// Games que aporta un set a cada lado. El tie-break ya está dentro del 7-6, así que cuenta
// como un game. El super tie-break cuenta como un game para quien lo gana, no como sus puntos.
function gamesDelSet(set: SetDelPartido): [number, number] {
  if (!set.esSuperTieBreak) return [set.gamesA, set.gamesB];
  return set.gamesA > set.gamesB ? [1, 0] : [0, 1];
}

// Partidos, sets y games de cada integrante de la zona. Quien todavía no jugó queda en cero.
export function estadisticasDeZona(integrantes: { jugadorId: number }[], partidos: PartidoDeLaTabla[]): Estadisticas[] {
  const porJugador = new Map<number, Estadisticas>(
    integrantes.map(({ jugadorId }) => [
      jugadorId,
      { jugadorId, partidosJugados: 0, partidosGanados: 0, setsGanados: 0, setsPerdidos: 0, gamesGanados: 0, gamesPerdidos: 0 },
    ]),
  );

  for (const partido of partidos.filter(tieneResultado)) {
    const a = porJugador.get(partido.jugadorAId);
    const b = porJugador.get(partido.jugadorBId);
    if (!a || !b) throw new Error(`El partido ${partido.jugadorAId} - ${partido.jugadorBId} no es de esta zona`);

    a.partidosJugados++;
    b.partidosJugados++;
    (partido.ganadorId === partido.jugadorAId ? a : b).partidosGanados++;

    for (const set of setsDelResultado(partido)) {
      const [gamesA, gamesB] = gamesDelSet(set);
      a.gamesGanados += gamesA;
      a.gamesPerdidos += gamesB;
      b.gamesGanados += gamesB;
      b.gamesPerdidos += gamesA;
      const [ganador, perdedor] = gamesA > gamesB ? [a, b] : [b, a];
      ganador.setsGanados++;
      perdedor.setsPerdidos++;
    }
  }
  return [...porJugador.values()];
}
