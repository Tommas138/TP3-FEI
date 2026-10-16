import { describe, expect, it } from 'vitest';
import {
  alcanzanParaLasZonas,
  armarZonasManuales,
  distribuirEnZonas,
  empezoLaFaseDeGrupos,
  generarPartidosDeZona,
  mezclar,
  ordenarSiembra,
  siembraGuardada,
  type Azar,
  type Zona,
} from '../../src/modules/competencia/sorteo';

// Generador determinista (mulberry32): el mismo contrato que Math.random, pero repetible.
function azarConSemilla(semilla: number): Azar {
  let estado = semilla;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// La siembra de POLENTA: 32 jugadores cuyo id es su posición de siembra.
const siembra32 = Array.from({ length: 32 }, (_, i) => i + 1);

const siembras = (zona: Zona) => zona.integrantes.map((i) => i.posicionSiembra);
const suma = (zona: Zona) => siembras(zona).reduce((total, s) => total + s, 0);

describe('mezclar', () => {
  it('devuelve los mismos elementos sin modificar la lista original', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const mezclados = mezclar(original, azarConSemilla(1));

    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...mezclados].sort((a, b) => a - b)).toEqual(original);
    expect(mezclados).not.toEqual(original);
  });
});

describe('ordenarSiembra', () => {
  it('ordena de más a menos puntos', () => {
    const siembra = ordenarSiembra(
      [
        { jugadorId: 1, puntos: 110 },
        { jugadorId: 2, puntos: 165 },
        { jugadorId: 3, puntos: 100 },
      ],
      azarConSemilla(1),
    );

    expect(siembra).toEqual([2, 1, 3]);
  });

  it('los empatados quedan juntos, detrás de los que tienen más y delante de los que tienen menos', () => {
    const jugadores = [
      { jugadorId: 1, puntos: 0 },
      { jugadorId: 2, puntos: 50 },
      { jugadorId: 3, puntos: 100 },
      { jugadorId: 4, puntos: 50 },
      { jugadorId: 5, puntos: 0 },
      { jugadorId: 6, puntos: 50 },
    ];

    for (let semilla = 1; semilla <= 20; semilla++) {
      const siembra = ordenarSiembra(jugadores, azarConSemilla(semilla));

      expect(siembra[0]).toBe(3);
      expect([...siembra.slice(1, 4)].sort()).toEqual([2, 4, 6]);
      expect([...siembra.slice(4)].sort()).toEqual([1, 5]);
    }
  });

  it('el orden entre empatados depende del azar, no del orden de llegada', () => {
    const jugadores = Array.from({ length: 8 }, (_, i) => ({ jugadorId: i + 1, puntos: 0 }));
    const ordenes = new Set<string>();
    for (let semilla = 1; semilla <= 20; semilla++) ordenes.add(ordenarSiembra(jugadores, azarConSemilla(semilla)).join());

    expect(ordenes.size).toBeGreaterThan(1);
  });

  it('con el mismo azar da el mismo orden', () => {
    const jugadores = Array.from({ length: 8 }, (_, i) => ({ jugadorId: i + 1, puntos: 0 }));

    expect(ordenarSiembra(jugadores, azarConSemilla(7))).toEqual(ordenarSiembra(jugadores, azarConSemilla(7)));
  });
});

describe('distribuirEnZonas', () => {
  // Tabla de 02-dominio.md §4.2.
  it('serpentina: las 8 zonas de POLENTA suman 66', () => {
    const zonas = distribuirEnZonas(siembra32, 8, 'SERPENTINA', azarConSemilla(1));

    expect(zonas.map((z) => z.grupo)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    expect(siembras(zonas[0])).toEqual([1, 16, 17, 32]);
    expect(siembras(zonas[1])).toEqual([2, 15, 18, 31]);
    expect(siembras(zonas[7])).toEqual([8, 9, 24, 25]);
    expect(zonas.map(suma)).toEqual([66, 66, 66, 66, 66, 66, 66, 66]);
  });

  it('directa: la zona A queda más fácil (52) que la H (80)', () => {
    const zonas = distribuirEnZonas(siembra32, 8, 'DIRECTA', azarConSemilla(1));

    expect(siembras(zonas[0])).toEqual([1, 9, 17, 25]);
    expect(siembras(zonas[7])).toEqual([8, 16, 24, 32]);
    expect(suma(zonas[0])).toBe(52);
    expect(suma(zonas[7])).toBe(80);
  });

  it('bombos: cada zona recibe un jugador de cada franja', () => {
    for (let semilla = 1; semilla <= 20; semilla++) {
      const zonas = distribuirEnZonas(siembra32, 8, 'BOMBOS', azarConSemilla(semilla));

      for (const zona of zonas) {
        // Franja 0 = cabezas de serie (1 a 8), franja 1 = 9 a 16, y así.
        expect(siembras(zona).map((s) => Math.floor((s - 1) / 8))).toEqual([0, 1, 2, 3]);
      }
    }
  });

  it('bombos: el reparto dentro de la franja depende del azar', () => {
    const repartos = new Set<string>();
    for (let semilla = 1; semilla <= 20; semilla++) {
      repartos.add(JSON.stringify(distribuirEnZonas(siembra32, 8, 'BOMBOS', azarConSemilla(semilla)).map(siembras)));
    }

    expect(repartos.size).toBeGreaterThan(1);
  });

  it('en los tres modos cada jugador queda en una sola zona, con su posición de siembra', () => {
    const jugadores = siembra32.map((posicion) => posicion + 100);

    for (const modo of ['SERPENTINA', 'DIRECTA', 'BOMBOS'] as const) {
      const integrantes = distribuirEnZonas(jugadores, 8, modo, azarConSemilla(3)).flatMap((z) => z.integrantes);

      expect(integrantes).toHaveLength(32);
      expect(new Set(integrantes.map((i) => i.jugadorId)).size).toBe(32);
      for (const { jugadorId, posicionSiembra } of integrantes) expect(jugadorId).toBe(posicionSiembra + 100);
    }
  });

  it('si no alcanzan para la última vuelta, quedan zonas con un jugador menos', () => {
    const zonas = distribuirEnZonas(siembra32.slice(0, 30), 8, 'SERPENTINA', azarConSemilla(1));

    // La cuarta vuelta va de la H a la A: se quedan sin cuarto jugador la B y la A.
    expect(zonas.map((z) => z.integrantes.length)).toEqual([3, 3, 4, 4, 4, 4, 4, 4]);
    expect(siembras(zonas[7])).toEqual([8, 9, 24, 25]);
    expect(siembras(zonas[0])).toEqual([1, 16, 17]);
  });
});

describe('generarPartidosDeZona', () => {
  it('con 32 jugadores en 8 zonas de 4 genera 48 partidos, 6 por zona', () => {
    const partidos = generarPartidosDeZona(distribuirEnZonas(siembra32, 8, 'SERPENTINA', azarConSemilla(1)));

    expect(partidos).toHaveLength(48);
    for (const grupo of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
      expect(partidos.filter((p) => p.grupo === grupo)).toHaveLength(6);
    }
  });

  it('dentro de una zona juegan todos contra todos, una sola vez', () => {
    const partidos = generarPartidosDeZona([
      {
        grupo: 'A',
        integrantes: [
          { jugadorId: 1, posicionSiembra: 1 },
          { jugadorId: 16, posicionSiembra: 16 },
          { jugadorId: 17, posicionSiembra: 17 },
          { jugadorId: 32, posicionSiembra: 32 },
        ],
      },
    ]);

    expect(partidos.map((p) => [p.jugadorAId, p.jugadorBId])).toEqual([
      [1, 16],
      [1, 17],
      [1, 32],
      [16, 17],
      [16, 32],
      [17, 32],
    ]);
  });

  it('una zona de 3 juega 3 partidos', () => {
    const zonas = distribuirEnZonas([1, 2, 3], 1, 'SERPENTINA', azarConSemilla(1));

    expect(generarPartidosDeZona(zonas)).toHaveLength(3);
  });
});

describe('siembraGuardada', () => {
  it('devuelve los jugadores en el orden de su posición de siembra', () => {
    const inscriptos = [
      { jugadorId: 30, posicionSiembra: 3 },
      { jugadorId: 10, posicionSiembra: 1 },
      { jugadorId: 20, posicionSiembra: 2 },
    ];

    expect(siembraGuardada(inscriptos)).toEqual([10, 20, 30]);
  });

  it('si alguien entró después del sorteo, no hay siembra que reusar', () => {
    const inscriptos = [
      { jugadorId: 10, posicionSiembra: 1 },
      { jugadorId: 20, posicionSiembra: 2 },
      { jugadorId: 30, posicionSiembra: null },
    ];

    expect(siembraGuardada(inscriptos)).toBeNull();
  });

  it('si alguien se bajó después del sorteo y quedó un hueco, no hay siembra que reusar', () => {
    const inscriptos = [
      { jugadorId: 10, posicionSiembra: 1 },
      { jugadorId: 30, posicionSiembra: 3 },
    ];

    expect(siembraGuardada(inscriptos)).toBeNull();
  });

  it('sin inscriptos no hay siembra', () => {
    expect(siembraGuardada([])).toBeNull();
  });
});

describe('alcanzanParaLasZonas', () => {
  it('con el cupo lleno alcanzan', () => {
    expect(alcanzanParaLasZonas(32, 8)).toBe(true);
  });

  it('alcanzan mientras ninguna zona quede con menos de 3', () => {
    expect(alcanzanParaLasZonas(24, 8)).toBe(true);
    expect(alcanzanParaLasZonas(23, 8)).toBe(false);
  });
});

describe('armarZonasManuales', () => {
  // 8 jugadores en 2 zonas: los ids son su posición de siembra.
  const siembra8 = [1, 2, 3, 4, 5, 6, 7, 8];

  it('ordena cada zona por siembra y le pone a cada jugador su posición', () => {
    const resultado = armarZonasManuales(
      [
        { grupo: 'A', jugadorIds: [8, 1, 5, 4] },
        { grupo: 'B', jugadorIds: [2, 7, 3, 6] },
      ],
      siembra8,
      2,
    );

    expect(resultado).toEqual({
      zonas: [
        { grupo: 'A', integrantes: [1, 4, 5, 8].map((id) => ({ jugadorId: id, posicionSiembra: id })) },
        { grupo: 'B', integrantes: [2, 3, 6, 7].map((id) => ({ jugadorId: id, posicionSiembra: id })) },
      ],
    });
  });

  it('la posición de siembra sale de la siembra, no del id', () => {
    const resultado = armarZonasManuales(
      [
        { grupo: 'A', jugadorIds: [40, 10, 30] },
        { grupo: 'B', jugadorIds: [20, 50, 60] },
      ],
      [60, 50, 40, 30, 20, 10],
      2,
    );

    expect('zonas' in resultado && resultado.zonas[0].integrantes).toEqual([
      { jugadorId: 40, posicionSiembra: 3 },
      { jugadorId: 30, posicionSiembra: 4 },
      { jugadorId: 10, posicionSiembra: 6 },
    ]);
  });

  it('si falta un jugador, no coinciden', () => {
    const resultado = armarZonasManuales(
      [
        { grupo: 'A', jugadorIds: [1, 2, 3, 4] },
        { grupo: 'B', jugadorIds: [5, 6, 7] },
      ],
      siembra8,
      2,
    );

    expect(resultado).toEqual({ error: 'JUGADORES_DISTINTOS' });
  });

  it('si un jugador está en dos zonas, no coinciden', () => {
    const resultado = armarZonasManuales(
      [
        { grupo: 'A', jugadorIds: [1, 2, 3, 4] },
        { grupo: 'B', jugadorIds: [4, 5, 6, 7] },
      ],
      siembra8,
      2,
    );

    expect(resultado).toEqual({ error: 'JUGADORES_DISTINTOS' });
  });

  it('si hay alguien que no está en la siembra, no coinciden', () => {
    const resultado = armarZonasManuales(
      [
        { grupo: 'A', jugadorIds: [1, 2, 3, 4] },
        { grupo: 'B', jugadorIds: [5, 6, 7, 99] },
      ],
      siembra8,
      2,
    );

    expect(resultado).toEqual({ error: 'JUGADORES_DISTINTOS' });
  });

  it('tienen que ser las zonas del formato, de la A en adelante', () => {
    const tresZonas = [
      { grupo: 'A', jugadorIds: [1, 2, 3] },
      { grupo: 'B', jugadorIds: [4, 5, 6] },
      { grupo: 'C', jugadorIds: [7, 8] },
    ];
    const salteada = [
      { grupo: 'A', jugadorIds: [1, 2, 3, 4] },
      { grupo: 'C', jugadorIds: [5, 6, 7, 8] },
    ];

    expect(armarZonasManuales(tresZonas, siembra8, 2)).toEqual({ error: 'ZONAS_INVALIDAS' });
    expect(armarZonasManuales(salteada, siembra8, 2)).toEqual({ error: 'ZONAS_INVALIDAS' });
  });

  it('las zonas tienen el mismo tamaño que daría el sorteo', () => {
    const despareja = [
      { grupo: 'A', jugadorIds: [1, 2, 3, 4, 5] },
      { grupo: 'B', jugadorIds: [6, 7, 8] },
    ];

    expect(armarZonasManuales(despareja, siembra8, 2)).toEqual({ error: 'ZONAS_INVALIDAS' });
  });

  it('con el cupo sin llenar, acepta zonas de 3 y de 4', () => {
    // 7 jugadores en 2 zonas: una de 4 y una de 3.
    const resultado = armarZonasManuales(
      [
        { grupo: 'A', jugadorIds: [1, 4, 5] },
        { grupo: 'B', jugadorIds: [2, 3, 6, 7] },
      ],
      [1, 2, 3, 4, 5, 6, 7],
      2,
    );

    expect('zonas' in resultado).toBe(true);
  });
});

describe('empezoLaFaseDeGrupos', () => {
  const dia = (fecha: string) => new Date(`${fecha}T00:00:00.000Z`);

  it('arranca el día de la fecha de inicio, no antes', () => {
    expect(empezoLaFaseDeGrupos(dia('2026-10-17'), '2026-10-16')).toBe(false);
    expect(empezoLaFaseDeGrupos(dia('2026-10-16'), '2026-10-16')).toBe(true);
    expect(empezoLaFaseDeGrupos(dia('2026-10-01'), '2026-10-16')).toBe(true);
  });

  it('sin fecha de inicio no arranca', () => {
    expect(empezoLaFaseDeGrupos(null, '2026-10-16')).toBe(false);
  });
});
