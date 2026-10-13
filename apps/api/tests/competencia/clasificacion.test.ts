import { describe, expect, it } from 'vitest';
import {
  estadisticasDeZona,
  tablaDeZona,
  type EstadoPartido,
  type FilaDeTabla,
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

// Los integrantes de la zona, en orden de siembra: el primero es el mejor rankeado.
const integrantes = (...ids: number[]) => ids.map((jugadorId, i) => ({ jugadorId, posicionSiembra: i + 1 }));

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

// El orden de la tabla y, entre cada par de filas, el criterio que las separó.
const orden = (tabla: FilaDeTabla[]) => tabla.map((f) => f.jugadorId);
const desempates = (tabla: FilaDeTabla[]) => tabla.map((f) => f.desempateConElSiguiente);

describe('tablaDeZona', () => {
  it('ordena por partidos ganados', () => {
    const tabla = tablaDeZona(integrantes(1, 2, 3), [jugado(3, 1, '6-4 6-4'), jugado(3, 2, '6-4 6-4'), jugado(2, 1, '6-4 6-4')]);

    expect(orden(tabla)).toEqual([3, 2, 1]);
    expect(tabla.map((f) => f.posicion)).toEqual([1, 2, 3]);
    expect(desempates(tabla)).toEqual(['PARTIDOS_GANADOS', 'PARTIDOS_GANADOS', null]);
  });

  it('con los mismos partidos ganados, desempata por sets ganados y después por diferencia de sets', () => {
    // 3 y 4 perdieron, pero 3 le sacó un set a su rival. 1 y 2 ganaron 2 sets, pero 1 perdió uno.
    const tabla = tablaDeZona(integrantes(1, 2, 3, 4), [jugado(1, 3, '6-4 3-6 [10-8]'), jugado(2, 4, '6-4 6-4')]);

    expect(orden(tabla)).toEqual([2, 1, 3, 4]);
    expect(desempates(tabla)).toEqual(['DIFERENCIA_SETS', 'PARTIDOS_GANADOS', 'SETS_GANADOS', null]);
  });

  it('con los sets iguales, desempata por games ganados antes que por diferencia', () => {
    // 1 ganó más games (14 contra 12) aunque 2 tiene mejor diferencia (+12 contra +2).
    const tabla = tablaDeZona(integrantes(1, 2, 3, 4), [jugado(1, 3, '7-6 7-6'), jugado(2, 4, '6-0 6-0')]);

    expect(orden(tabla)).toEqual([1, 2, 3, 4]);
    expect(desempates(tabla)).toEqual(['GAMES_GANADOS', 'PARTIDOS_GANADOS', 'GAMES_GANADOS', null]);
  });

  it('con los mismos games ganados, desempata por diferencia de games', () => {
    // 1 y 2 ganaron 12 games, pero 1 perdió 8 y 2 perdió 4.
    const tabla = tablaDeZona(integrantes(1, 2, 3, 4), [jugado(1, 3, '6-4 6-4'), jugado(2, 4, '6-2 6-2')]);

    expect(orden(tabla).slice(0, 2)).toEqual([2, 1]);
    expect(tabla[0].desempateConElSiguiente).toBe('DIFERENCIA_GAMES');
  });

  it('el W.O. entra en la cascada como 6-0 6-0', () => {
    // Los dos ganaron 12 games; el W.O. no le dio ninguno al rival.
    const tabla = tablaDeZona(integrantes(1, 2, 3, 4), [walkover(1, 3), jugado(2, 4, '6-4 6-4')]);

    expect(orden(tabla).slice(0, 2)).toEqual([1, 2]);
    expect(tabla[0].desempateConElSiguiente).toBe('DIFERENCIA_GAMES');
  });

  it('separa al primero y sigue desempatando a los que quedan igualados', () => {
    // Los tres ganaron un partido: 4 se despega por diferencia de sets, y entre 1 y 2 deciden los games.
    const partidos = [jugado(4, 3, '6-0 6-0'), jugado(1, 3, '6-4 3-6 [10-8]'), jugado(2, 3, '6-3 4-6 [10-8]')];
    const tabla = tablaDeZona(integrantes(1, 2, 3, 4), partidos);

    expect(orden(tabla)).toEqual([4, 2, 1, 3]);
    expect(desempates(tabla)).toEqual(['DIFERENCIA_SETS', 'GAMES_GANADOS', 'PARTIDOS_GANADOS', null]);
  });

  it('entre dos empatados en todo, gana el que ganó el partido entre ambos', () => {
    // 1 y 2 quedan iguales en partidos, sets y games. 2 está mejor sembrado, pero 1 le ganó.
    const partidos = [jugado(1, 2, '6-4 6-4'), jugado(2, 3, '6-4 6-4'), jugado(4, 1, '6-4 6-4')];
    const tabla = tablaDeZona(integrantes(2, 1, 3, 4), partidos);

    expect(orden(tabla)).toEqual([4, 1, 2, 3]);
    expect(desempates(tabla)).toEqual(['DIFERENCIA_SETS', 'ENFRENTAMIENTO_DIRECTO', 'PARTIDOS_GANADOS', null]);
  });

  it('el enfrentamiento directo también vale si fue por W.O.', () => {
    // 2 ganó por W.O. y perdió 0-6 0-6: queda igual que 1 en todo, y le ganó.
    const partidos = [walkover(2, 1), jugado(1, 3, '6-0 6-0'), jugado(4, 2, '6-0 6-0')];
    const tabla = tablaDeZona(integrantes(1, 2, 3, 4), partidos);

    expect(orden(tabla).slice(1, 3)).toEqual([2, 1]);
    expect(tabla[1].desempateConElSiguiente).toBe('ENFRENTAMIENTO_DIRECTO');
  });

  it('si los dos empatados todavía no jugaron entre ellos, desempata el ranking', () => {
    const tabla = tablaDeZona(integrantes(2, 1, 3, 4), [jugado(1, 3, '6-4 6-4'), jugado(2, 4, '6-4 6-4')]);

    expect(orden(tabla)).toEqual([2, 1, 3, 4]);
    expect(desempates(tabla)).toEqual(['RANKING', 'PARTIDOS_GANADOS', 'RANKING', null]);
  });

  it('en un empate circular de tres no mira el enfrentamiento directo: desempata el ranking', () => {
    // 1 le ganó a 2, 2 a 3 y 3 a 1, todos por el mismo marcador.
    const partidos = [jugado(1, 2, '6-4 6-4'), jugado(2, 3, '6-4 6-4'), jugado(3, 1, '6-4 6-4')];
    const tabla = tablaDeZona(integrantes(3, 2, 1), partidos);

    expect(orden(tabla)).toEqual([3, 2, 1]);
    expect(desempates(tabla)).toEqual(['RANKING', 'RANKING', null]);
  });

  it('con tres empatados no usa el enfrentamiento directo aunque uno les haya ganado a los otros dos', () => {
    // 1, 2 y 3 quedan iguales en todo gracias a sus partidos con 4, 5 y 6. Aunque 3 les ganó a
    // 1 y a 2, entre tres se pasa al ranking, y 3 es el peor sembrado de los tres.
    const partidos = [
      jugado(3, 1, '6-4 6-4'),
      jugado(3, 2, '6-4 6-4'),
      jugado(1, 4, '6-4 6-4'),
      jugado(1, 5, '6-4 6-4'),
      jugado(2, 4, '6-4 6-4'),
      jugado(2, 5, '6-4 6-4'),
      jugado(6, 3, '6-4 6-4'),
    ];
    const tabla = tablaDeZona(integrantes(1, 2, 3, 4, 5, 6), partidos);

    expect(orden(tabla).slice(0, 3)).toEqual([1, 2, 3]);
    expect(desempates(tabla).slice(0, 2)).toEqual(['RANKING', 'RANKING']);
  });

  it('sin partidos jugados, la tabla sigue el orden de siembra', () => {
    const tabla = tablaDeZona(integrantes(3, 1, 2), []);

    expect(orden(tabla)).toEqual([3, 1, 2]);
    expect(desempates(tabla)).toEqual(['RANKING', 'RANKING', null]);
  });
});
