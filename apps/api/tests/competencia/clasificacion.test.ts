import { describe, expect, it } from 'vitest';
import {
  estadisticasDeZona,
  type EstadoPartido,
  type PartidoDeLaTabla,
} from '../../src/modules/competencia/clasificacion';

// Un partido jugado a partir del marcador, visto desde el jugador A: '6-4 3-6 [10-8]'.
// El set entre corchetes es un super tie-break. El ganador sale de los sets.
function jugado(jugadorAId: number, jugadorBId: number, marcador: string): PartidoDeLaTabla {
  const sets = marcador.split(' ').map((set) => {
    const esSuperTieBreak = set.startsWith('[');
    const [gamesA, gamesB] = set.replace(/[[\]]/g, '').split('-').map(Number);
    return { gamesA, gamesB, esSuperTieBreak };
  });
  const setsDeA = sets.filter((s) => s.gamesA > s.gamesB).length;
  const ganadorId = setsDeA > sets.length / 2 ? jugadorAId : jugadorBId;
  return { jugadorAId, jugadorBId, ganadorId, estado: 'JUGADA', sets };
}

function walkover(ganadorId: number, perdedorId: number): PartidoDeLaTabla {
  return { jugadorAId: perdedorId, jugadorBId: ganadorId, ganadorId, estado: 'WALKOVER', sets: [] };
}

function sinJugar(jugadorAId: number, jugadorBId: number, estado: EstadoPartido): PartidoDeLaTabla {
  return { jugadorAId, jugadorBId, ganadorId: null, estado, sets: [] };
}

const integrantes = (...ids: number[]) => ids.map((jugadorId) => ({ jugadorId }));

const deJugador = (jugadorId: number, partidos: PartidoDeLaTabla[], ids = [1, 2, 3, 4]) =>
  estadisticasDeZona(integrantes(...ids), partidos).find((e) => e.jugadorId === jugadorId);

describe('estadisticasDeZona', () => {
  it('suma partidos, sets y games de un partido en dos sets', () => {
    const partidos = [jugado(1, 2, '6-4 6-3')];

    expect(deJugador(1, partidos)).toEqual({
      jugadorId: 1,
      partidosJugados: 1,
      partidosGanados: 1,
      setsGanados: 2,
      setsPerdidos: 0,
      gamesGanados: 12,
      gamesPerdidos: 7,
    });
    expect(deJugador(2, partidos)).toMatchObject({ partidosGanados: 0, setsGanados: 0, setsPerdidos: 2, gamesGanados: 7, gamesPerdidos: 12 });
  });

  it('cuenta el tie-break como un game: el 7-6 ya lo incluye', () => {
    expect(deJugador(1, [jugado(1, 2, '7-6 6-4')])).toMatchObject({ gamesGanados: 13, gamesPerdidos: 10 });
  });

  it('cuenta el super tie-break como un set y un game, no como sus puntos', () => {
    const partidos = [jugado(1, 2, '6-4 3-6 [10-8]')];

    expect(deJugador(1, partidos)).toMatchObject({ partidosGanados: 1, setsGanados: 2, setsPerdidos: 1, gamesGanados: 10, gamesPerdidos: 10 });
    expect(deJugador(2, partidos)).toMatchObject({ partidosGanados: 0, setsGanados: 1, setsPerdidos: 2, gamesGanados: 10, gamesPerdidos: 10 });
  });

  it('computa el W.O. como 6-0 6-0 a favor del rival', () => {
    const partidos = [walkover(2, 1)];

    expect(deJugador(2, partidos)).toMatchObject({ partidosJugados: 1, partidosGanados: 1, setsGanados: 2, setsPerdidos: 0, gamesGanados: 12, gamesPerdidos: 0 });
    expect(deJugador(1, partidos)).toMatchObject({ partidosJugados: 1, partidosGanados: 0, setsGanados: 0, setsPerdidos: 2, gamesGanados: 0, gamesPerdidos: 12 });
  });

  it('ignora los sets guardados en un W.O.', () => {
    const conSets = { ...walkover(2, 1), sets: [{ gamesA: 3, gamesB: 2, esSuperTieBreak: false }] };

    expect(deJugador(2, [conSets])).toMatchObject({ setsGanados: 2, gamesGanados: 12, gamesPerdidos: 0 });
  });

  it('no suma los partidos sin resultado', () => {
    const estados: EstadoPartido[] = ['PENDIENTE_COORDINACION', 'ANOTADA', 'CONFIRMADA', 'VENCIDA', 'CANCELADA'];
    const partidos = estados.map((estado) => sinJugar(1, 2, estado));

    expect(deJugador(1, partidos)).toMatchObject({ partidosJugados: 0, setsGanados: 0, gamesGanados: 0 });
  });

  it('incluye en cero a quien todavía no jugó', () => {
    const tabla = estadisticasDeZona(integrantes(1, 2, 3), [jugado(1, 2, '6-0 6-0')]);

    expect(tabla.map((e) => e.jugadorId)).toEqual([1, 2, 3]);
    expect(tabla[2]).toMatchObject({ partidosJugados: 0, gamesGanados: 0, gamesPerdidos: 0 });
  });

  it('acumula los partidos de toda la zona', () => {
    const partidos = [jugado(1, 2, '6-4 6-4'), jugado(3, 1, '6-2 6-2'), walkover(1, 4)];

    expect(deJugador(1, partidos)).toMatchObject({
      partidosJugados: 3,
      partidosGanados: 2,
      setsGanados: 4,
      setsPerdidos: 2,
      gamesGanados: 12 + 4 + 12,
      gamesPerdidos: 8 + 12 + 0,
    });
  });

  it('rechaza un partido de un jugador que no es de la zona', () => {
    expect(() => estadisticasDeZona(integrantes(1, 2), [jugado(1, 9, '6-0 6-0')])).toThrow();
  });
});
