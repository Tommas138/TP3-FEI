import { describe, expect, it } from 'vitest';
import { zonasConPosiciones, type InscriptoEnZona, type PartidoEnZona } from '../../src/modules/competencia/posiciones';

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
