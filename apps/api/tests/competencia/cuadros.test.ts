import { describe, expect, it } from 'vitest';
import type { PartidoDeLaTabla, ZonaConPartidos } from '../../src/modules/competencia/clasificacion';
import {
  armarCuadro,
  lugarSiguiente,
  ordenDeSiembra,
  puestosPorCuadro,
  siembraDelCuadro,
  type Clasificado,
  type PartidoDeCuadro,
} from '../../src/modules/competencia/cuadros';

const GRUPOS = 'ABCDEFGH';

// Una zona terminada en la que cada uno le ganó 6-0 6-0 a todos los de abajo: la tabla queda
// en el orden de los ids. Entre zonas, los del mismo puesto empatan en todo y los ordena la
// posición de siembra.
function zonaTerminada(grupo: string, integrantes: { jugadorId: number; posicionSiembra: number }[]): ZonaConPartidos {
  const partidos: PartidoDeLaTabla[] = [];
  integrantes.forEach((a, i) =>
    integrantes.slice(i + 1).forEach((b) =>
      partidos.push({
        jugadorAId: a.jugadorId,
        jugadorBId: b.jugadorId,
        ganadorId: a.jugadorId,
        estado: 'JUGADA',
        sets: [
          { gamesA: 6, gamesB: 0, esSuperTieBreak: false },
          { gamesA: 6, gamesB: 0, esSuperTieBreak: false },
        ],
      }),
    ),
  );
  return { grupo, integrantes, partidos };
}

// Zonas repartidas en serpentina, como las arma el sorteo. El jugador z·10 + p es el que
// terminó p-ésimo en la zona z: el 11 ganó la A, el 22 salió segundo en la B.
// Con tamanos se pueden armar zonas de 3.
function zonasEnSerpentina(tamanos: number[]): ZonaConPartidos[] {
  const n = tamanos.length;
  return tamanos.map((tamano, z) =>
    zonaTerminada(
      GRUPOS[z],
      Array.from({ length: tamano }, (_, p) => ({
        jugadorId: (z + 1) * 10 + p + 1,
        posicionSiembra: p * n + (p % 2 === 0 ? z + 1 : n - z),
      })),
    ),
  );
}

// Clasificados de zonas distintas, en orden de siembra.
const clasificados = (cantidad: number): Clasificado[] =>
  Array.from({ length: cantidad }, (_, i) => ({ jugadorId: i + 1, grupo: `Z${i + 1}`, posicionEnZona: 1 }));

const rondasDe = (partidos: PartidoDeCuadro[]) => Math.max(...partidos.map((p) => p.ronda));
const deLaRonda = (partidos: PartidoDeCuadro[], ronda: number) => partidos.filter((p) => p.ronda === ronda);
const juega = (partido: PartidoDeCuadro, jugadorId: number) => partido.jugadorAId === jugadorId || partido.jugadorBId === jugadorId;

// En qué mitad del cuadro entra el jugador: 'arriba' o 'abajo'.
function mitad(partidos: PartidoDeCuadro[], jugadorId: number) {
  const partido = partidos.filter((p) => juega(p, jugadorId)).sort((a, b) => a.ronda - b.ronda)[0];
  const partidosEnLaRonda = 2 ** (rondasDe(partidos) - partido.ronda);
  return partido.ordenEnRonda <= partidosEnLaRonda / 2 ? 'arriba' : 'abajo';
}

// Los compañeros de zona que se cruzan en la primera ronda que juegan.
function cruzanCompaneros(partidos: PartidoDeCuadro[], siembra: Clasificado[]) {
  const grupoDe = new Map(siembra.map((c) => [c.jugadorId, c.grupo]));
  return partidos.filter((p) => p.jugadorAId && p.jugadorBId && grupoDe.get(p.jugadorAId) === grupoDe.get(p.jugadorBId));
}

describe('ordenDeSiembra', () => {
  it('ubica al 1 y al 2 en mitades opuestas, y así en cada franja', () => {
    expect(ordenDeSiembra(2)).toEqual([1, 2]);
    expect(ordenDeSiembra(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it('enfrenta en la primera ronda al mejor con el peor', () => {
    const orden = ordenDeSiembra(16);
    for (let i = 0; i < 16; i += 2) expect(orden[i] + orden[i + 1]).toBe(17);
  });
});

describe('puestosPorCuadro', () => {
  it('manda los dos primeros a Campeonato y el resto a Complementaria', () => {
    expect(puestosPorCuadro(2, true, 4)).toEqual({ campeonato: [1, 2], complementaria: [3, 4] });
  });

  it('sin cuadro consuelo, los que no clasifican quedan afuera', () => {
    expect(puestosPorCuadro(2, false, 4)).toEqual({ campeonato: [1, 2], complementaria: [] });
  });

  it('con zonas de 3, Complementaria solo recibe terceros', () => {
    expect(puestosPorCuadro(2, true, 3)).toEqual({ campeonato: [1, 2], complementaria: [3] });
  });
});

describe('siembraDelCuadro', () => {
  it('pone primero a todos los ganadores de zona, ordenados entre zonas, y después a los segundos', () => {
    const siembra = siembraDelCuadro(zonasEnSerpentina([4, 4, 4, 4, 4, 4, 4, 4]), [1, 2]);

    expect(siembra.map((c) => `${c.posicionEnZona}${c.grupo}`)).toEqual([
      ...'ABCDEFGH'.split('').map((g) => `1${g}`),
      // Los segundos de la serpentina vienen al revés: el de la H es el mejor sembrado.
      ...'HGFEDCBA'.split('').map((g) => `2${g}`),
    ]);
  });

  it('con zonas de 3, los cuartos son solo los de las zonas de 4', () => {
    const siembra = siembraDelCuadro(zonasEnSerpentina([4, 4, 4, 4, 3, 3, 3, 3]), [3, 4]);

    expect(siembra.filter((c) => c.posicionEnZona === 3)).toHaveLength(8);
    expect(siembra.filter((c) => c.posicionEnZona === 4).map((c) => c.grupo).sort()).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('armarCuadro', () => {
  describe('con el cupo de POLENTA: 8 zonas de 4 y dos clasificados', () => {
    const zonas = zonasEnSerpentina([4, 4, 4, 4, 4, 4, 4, 4]);
    const siembra = siembraDelCuadro(zonas, [1, 2]);
    const partidos = armarCuadro(siembra);

    it('genera 15 partidos en 4 rondas, con la primera completa y el resto esperando ganadores', () => {
      expect(partidos).toHaveLength(15);
      expect([1, 2, 3, 4].map((r) => deLaRonda(partidos, r).length)).toEqual([8, 4, 2, 1]);
      expect(deLaRonda(partidos, 1).every((p) => p.jugadorAId && p.jugadorBId)).toBe(true);
      expect(partidos.filter((p) => p.ronda > 1).every((p) => !p.jugadorAId && !p.jugadorBId)).toBe(true);
    });

    it('los dos mejores sembrados van a mitades opuestas', () => {
      expect(deLaRonda(partidos, 1)[0].jugadorAId).toBe(11);
      expect(mitad(partidos, 11)).toBe('arriba');
      expect(mitad(partidos, 21)).toBe('abajo');
    });

    it('cada ganador de zona juega la primera ronda contra un segundo', () => {
      for (const p of deLaRonda(partidos, 1)) expect([p.jugadorAId! % 10, p.jugadorBId! % 10].sort()).toEqual([1, 2]);
    });

    it('los dos de una misma zona quedan en mitades opuestas: solo se cruzan en la final', () => {
      for (let z = 1; z <= 8; z++) expect(mitad(partidos, z * 10 + 1)).not.toBe(mitad(partidos, z * 10 + 2));
    });

    it('arma el cuadro consuelo con los terceros y cuartos de la misma forma', () => {
      const consuelo = siembraDelCuadro(zonas, [3, 4]);
      const partidosConsuelo = armarCuadro(consuelo);

      expect(partidosConsuelo).toHaveLength(15);
      for (let z = 1; z <= 8; z++) expect(mitad(partidosConsuelo, z * 10 + 3)).not.toBe(mitad(partidosConsuelo, z * 10 + 4));
    });
  });

  describe('con byes', () => {
    it('con 6 zonas, 12 clasificados: 4 byes para los ganadores de zona mejor sembrados', () => {
      const siembra = siembraDelCuadro(zonasEnSerpentina([4, 4, 4, 4, 4, 4]), [1, 2]);
      const partidos = armarCuadro(siembra);
      const conBye = siembra.slice(0, 4).map((c) => c.jugadorId);

      expect(partidos).toHaveLength(11);
      expect(deLaRonda(partidos, 1)).toHaveLength(4);
      for (const id of conBye) {
        expect(deLaRonda(partidos, 1).some((p) => juega(p, id))).toBe(false);
        expect(deLaRonda(partidos, 2).some((p) => juega(p, id))).toBe(true);
      }
      for (let z = 1; z <= 6; z++) expect(mitad(partidos, z * 10 + 1)).not.toBe(mitad(partidos, z * 10 + 2));
    });

    it('con zonas de 3, el consuelo queda de 12 y tiene n − 1 partidos', () => {
      const siembra = siembraDelCuadro(zonasEnSerpentina([4, 4, 4, 4, 3, 3, 3, 3]), [3, 4]);

      expect(siembra).toHaveLength(12);
      expect(armarCuadro(siembra)).toHaveLength(11);
    });

    it('con 5 jugadores, los byes son para las siembras 1, 2 y 3', () => {
      const partidos = armarCuadro(clasificados(5));

      expect(partidos).toHaveLength(4);
      expect(deLaRonda(partidos, 1)).toEqual([{ ronda: 1, ordenEnRonda: 2, jugadorAId: 4, jugadorBId: 5 }]);
      expect(deLaRonda(partidos, 2)).toEqual([
        { ronda: 2, ordenEnRonda: 1, jugadorAId: 1, jugadorBId: null },
        { ronda: 2, ordenEnRonda: 2, jugadorAId: 2, jugadorBId: 3 },
      ]);
    });

    it('de 2 a 32 jugadores: n − 1 partidos, y en la primera ronda solo los que no tienen bye', () => {
      for (let n = 2; n <= 32; n++) {
        const partidos = armarCuadro(clasificados(n));
        expect(partidos).toHaveLength(n - 1);
        const lugares = 2 ** Math.ceil(Math.log2(n));
        expect(deLaRonda(partidos, 1)).toHaveLength(n - lugares / 2);
      }
    });
  });

  it('con tres clasificados por zona, los de una misma zona no se cruzan en la primera ronda', () => {
    const siembra = siembraDelCuadro(zonasEnSerpentina([4, 4, 4, 4]), [1, 2, 3]);

    expect(cruzanCompaneros(armarCuadro(siembra), siembra)).toEqual([]);
  });

  it('con dos jugadores es directamente la final', () => {
    expect(armarCuadro(clasificados(2))).toEqual([{ ronda: 1, ordenEnRonda: 1, jugadorAId: 1, jugadorBId: 2 }]);
  });

  it('con menos de dos jugadores no hay cuadro', () => {
    expect(armarCuadro(clasificados(1))).toEqual([]);
    expect(armarCuadro([])).toEqual([]);
  });
});

describe('lugarSiguiente', () => {
  it('los partidos 1 y 2 alimentan al 1 de la ronda siguiente; el 3 y el 4, al 2', () => {
    expect([1, 2, 3, 4].map(lugarSiguiente)).toEqual([
      { ordenEnRonda: 1, lado: 'A' },
      { ordenEnRonda: 1, lado: 'B' },
      { ordenEnRonda: 2, lado: 'A' },
      { ordenEnRonda: 2, lado: 'B' },
    ]);
  });
});
