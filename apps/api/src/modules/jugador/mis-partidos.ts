// Los partidos del jugador desde su lado (F11). Lógica pura: recibe los partidos ya leídos.
import type { PartidoDelJugador } from '@setpoint/shared';

type SetLeido = { gamesA: number; gamesB: number };
type JugadorLeido = { nombre: string; apellido: string; telefono: string | null };

export type PartidoLeido = {
  id: number;
  fase: 'GRUPOS' | 'ELIMINATORIA';
  grupo: string | null;
  cuadro: 'CAMPEONATO' | 'COMPLEMENTARIA' | null;
  ronda: number | null;
  jugadorAId: number | null;
  jugadorBId: number | null;
  ganadorId: number | null;
  estado: string;
  fechaAcordada: Date | null;
  fechaLimite: Date | null;
  sedeTexto: string | null;
  club: { nombre: string } | null;
  cancha: { nombre: string } | null;
  jugadorA: JugadorLeido | null;
  jugadorB: JugadorLeido | null;
  sets: SetLeido[];
};

const CON_RESULTADO = new Set(['JUGADA', 'WALKOVER', 'ABANDONO']);

// "semifinales", contando desde la final. Igual que en la web (features/resultados).
function nombreDeRonda(ronda: number, rondas: number) {
  return ['final', 'semifinales', 'cuartos de final', 'octavos de final'][rondas - ronda] ?? `ronda ${ronda}`;
}

// En la interfaz, el cuadro consuelo no se llama "Complementaria" (design.md §9).
function instancia(p: PartidoLeido, rondasPorCuadro: Map<string, number>) {
  if (p.fase === 'GRUPOS') return `zona ${p.grupo}`;
  const cuadro = p.cuadro === 'CAMPEONATO' ? 'campeonato' : 'cuadro consuelo';
  return `${cuadro} · ${nombreDeRonda(p.ronda!, rondasPorCuadro.get(p.cuadro!)!)}`;
}

// El marcador desde el lado del jugador. El W.O. no guarda sets (decisión 016).
function marcador(p: PartidoLeido, esA: boolean) {
  if (p.estado === 'WALKOVER') return 'W.O.';
  const sets = p.sets.map((s) => (esA ? `${s.gamesA}-${s.gamesB}` : `${s.gamesB}-${s.gamesA}`)).join(' ');
  return p.estado === 'ABANDONO' ? `${sets} ab.` : sets;
}

// Cada partido del torneo en el que juega, visto desde su lado. Todos los del torneo hacen falta
// para saber cuántas rondas tiene cada cuadro y nombrar la ronda.
export function partidosDelJugador(jugadorId: number, partidosDelTorneo: PartidoLeido[]): PartidoDelJugador[] {
  const rondasPorCuadro = new Map<string, number>();
  for (const p of partidosDelTorneo) {
    if (p.cuadro && p.ronda) rondasPorCuadro.set(p.cuadro, Math.max(rondasPorCuadro.get(p.cuadro) ?? 0, p.ronda));
  }

  return partidosDelTorneo
    .filter((p) => p.jugadorAId === jugadorId || p.jugadorBId === jugadorId)
    .map((p) => {
      const esA = p.jugadorAId === jugadorId;
      const rival = esA ? p.jugadorB : p.jugadorA;
      const jugado = CON_RESULTADO.has(p.estado);
      const sede = p.club ? [p.club.nombre, p.cancha && `cancha ${p.cancha.nombre}`].filter(Boolean).join(' · ') : p.sedeTexto;

      return {
        id: p.id,
        instancia: instancia(p, rondasPorCuadro),
        rival: rival && {
          nombre: rival.nombre,
          apellido: rival.apellido,
          // Solo mientras hay que coordinar (decisión 046).
          telefono: jugado ? null : rival.telefono,
        },
        estado: p.estado,
        fechaAcordada: p.fechaAcordada?.toISOString() ?? null,
        fechaLimite: p.fechaLimite?.toISOString() ?? null,
        sede,
        resultado: jugado ? { gano: p.ganadorId === jugadorId, marcador: marcador(p, esA) } : null,
      };
    });
}
