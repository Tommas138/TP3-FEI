import { describe, expect, it } from 'vitest';
import {
  simularZona,
  zonasConPosiciones,
  type InscriptoEnZona,
  type PartidoEnZona,
} from '../../src/modules/competencia/posiciones';

// Los inscriptos de una zona, en orden de siembra a partir de la que se indica.
function inscriptos(grupo: string, desde: number, ...ids: number[]): InscriptoEnZona[] {
  return ids.map((jugadorId, i) => ({ jugadorId, grupo, posicionSiembra: desde + i, nombre: `Nombre ${jugadorId}`, apellido: `Apellido ${jugadorId}` }));
}

// Partido de zona ganado 6-0 6-0 por el primero.
function ganado(grupo: string, ganadorId: number, perdedorId: number): PartidoEnZona {
  const set = { gamesA: 6, gamesB: 0, esSuperTieBreak: false };
  return { grupo, jugadorAId: ganadorId, jugadorBId: perdedorId, ganadorId, estado: 'JUGADA', sets: [set, set] };
}

const POLENTA = { clasificanPorGrupo: 2, tieneComplementaria: true };

describe('zonasConPosiciones', () => {
  it('arma una tabla por zona, de la A en adelante, con el nombre de cada jugador', () => {
    const zonas = zonasConPosiciones(
      [...inscriptos('B', 2, 21, 22, 23), ...inscriptos('A', 1, 11, 12, 13)],
      [ganado('A', 13, 11), ganado('B', 22, 21)],
      POLENTA,
    );

    expect(zonas.map((z) => z.grupo)).toEqual(['A', 'B']);
    // Quien perdió queda debajo de quien todavía no jugó: tiene peor diferencia de sets.
    expect(zonas[0].filas.map((f) => f.jugadorId)).toEqual([13, 12, 11]);
    expect(zonas[1].filas.map((f) => f.jugadorId)).toEqual([22, 23, 21]);
    expect(zonas[0].filas[0]).toMatchObject({ posicion: 1, nombre: 'Nombre 13', apellido: 'Apellido 13', partidosGanados: 1 });
  });

  it('marca la línea de corte: los primeros a Campeonato y el resto a la Complementaria', () => {
    const [zona] = zonasConPosiciones(inscriptos('A', 1, 1, 2, 3, 4), [], POLENTA);

    expect(zona.filas.map((f) => f.destino)).toEqual(['campeonato', 'campeonato', 'complementaria', 'complementaria']);
  });

  it('sin cuadro consuelo, los que no clasifican no tienen destino', () => {
    const [zona] = zonasConPosiciones(inscriptos('A', 1, 1, 2, 3, 4), [], { clasificanPorGrupo: 2, tieneComplementaria: false });

    expect(zona.filas.map((f) => f.destino)).toEqual(['campeonato', 'campeonato', null, null]);
  });

  it('en una zona de 3, el tercero va a la Complementaria', () => {
    const [zona] = zonasConPosiciones(inscriptos('A', 1, 1, 2, 3), [], POLENTA);

    expect(zona.filas.map((f) => f.destino)).toEqual(['campeonato', 'campeonato', 'complementaria']);
  });

  it('devuelve el criterio de desempate con el nombre compartido', () => {
    const [zona] = zonasConPosiciones(inscriptos('A', 1, 1, 2, 3, 4), [ganado('A', 2, 3)], POLENTA);

    expect(zona.filas.map((f) => f.jugadorId)).toEqual([2, 1, 4, 3]);
    expect(zona.filas.map((f) => f.desempateConElSiguiente)).toEqual(['partidos_ganados', 'ranking', 'diferencia_sets', null]);
  });
});

describe('simularZona', () => {
  const todos = [...inscriptos('A', 1, 1, 2, 3, 4), ...inscriptos('B', 5, 5, 6, 7, 8)];
  const sinJugar = (grupo: string, jugadorAId: number, jugadorBId: number): PartidoEnZona => ({
    grupo,
    jugadorAId,
    jugadorBId,
    ganadorId: null,
    estado: 'PENDIENTE_COORDINACION',
    sets: [],
  });
  // La zona A con dos partidos jugados y uno por jugar, y uno de la B que no tiene que mezclarse.
  const partidos = [ganado('A', 1, 2), ganado('A', 3, 4), sinJugar('A', 4, 1), ganado('B', 8, 5)];

  it('devuelve solo la zona del partido, con su resultado nuevo', () => {
    const zona = simularZona(todos, partidos, POLENTA, ganado('A', 4, 1));

    expect(zona.grupo).toBe('A');
    // El 4 le gana al 1: los dos quedan con un partido ganado, y el 3 y el 4 pasan adelante por sets.
    expect(zona.filas.map((f) => f.jugadorId)).toEqual([3, 4, 1, 2]);
    expect(zona.filas.find((f) => f.jugadorId === 4)).toMatchObject({ partidosGanados: 1, destino: 'campeonato' });
    expect(zona.filas.find((f) => f.jugadorId === 1)).toMatchObject({ partidosJugados: 2, destino: 'complementaria' });
  });

  it('corrige un resultado ya cargado en lugar de sumarlo', () => {
    // El 1 le había ganado al 2. Corregido, gana el 2, con los jugadores en el mismo orden.
    const set = { gamesA: 0, gamesB: 6, esSuperTieBreak: false };
    const corregido: PartidoEnZona = { ...ganado('A', 1, 2), ganadorId: 2, sets: [set, set] };
    const dos = simularZona(todos, partidos, POLENTA, corregido).filas.find((f) => f.jugadorId === 2);

    expect(dos).toMatchObject({ partidosJugados: 1, partidosGanados: 1, setsGanados: 2 });
  });

  it('cuenta un W.O. como 6-0 6-0 para el ganador', () => {
    const walkover: PartidoEnZona = { ...sinJugar('A', 4, 1), ganadorId: 4, estado: 'WALKOVER' };
    const cuatro = simularZona(todos, partidos, POLENTA, walkover).filas.find((f) => f.jugadorId === 4);

    expect(cuatro).toMatchObject({ partidosGanados: 1, setsGanados: 2, gamesGanados: 12 });
  });

  it('dice cuántos partidos de la zona siguen sin resultado', () => {
    expect(simularZona(todos, partidos, POLENTA, ganado('A', 4, 1)).partidosSinResultado).toBe(0);
    expect(simularZona(todos, [...partidos, sinJugar('A', 2, 3)], POLENTA, ganado('A', 4, 1)).partidosSinResultado).toBe(1);
  });

  it('no guarda nada: la lista de partidos queda como estaba', () => {
    simularZona(todos, partidos, POLENTA, ganado('A', 4, 1));
    expect(partidos[2].estado).toBe('PENDIENTE_COORDINACION');
  });
});
