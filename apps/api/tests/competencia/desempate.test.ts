import { describe, expect, it } from 'vitest';
import { explicarDesempate, type CriterioDesempate, type FilaDePosiciones } from '@setpoint/shared';

type Fila = Parameters<typeof explicarDesempate>[0];

function fila(apellido: string, datos: Partial<FilaDePosiciones> = {}): Fila {
  return {
    nombre: 'Juan',
    apellido,
    posicionSiembra: 1,
    partidosJugados: 3,
    partidosGanados: 2,
    setsGanados: 4,
    setsPerdidos: 2,
    gamesGanados: 30,
    gamesPerdidos: 20,
    desempateConElSiguiente: null,
    ...datos,
  };
}

const arriba = (criterio: CriterioDesempate, datos: Partial<FilaDePosiciones> = {}) =>
  fila('Bustos', { desempateConElSiguiente: criterio, ...datos });

describe('explicarDesempate', () => {
  it('la última fila no tiene nada que explicar', () => {
    expect(explicarDesempate(fila('Bustos'), fila('Ledesma'), true)).toBeNull();
  });

  it('partidos ganados', () => {
    const texto = explicarDesempate(arriba('partidos_ganados', { partidosGanados: 2 }), fila('Ledesma', { partidosGanados: 1 }), true);

    expect(texto).toBe('Bustos ganó 2 partidos y Ledesma, 1.');
  });

  it('partidos ganados, en singular', () => {
    const texto = explicarDesempate(arriba('partidos_ganados', { partidosGanados: 1 }), fila('Ledesma', { partidosGanados: 0 }), true);

    expect(texto).toBe('Bustos ganó 1 partido y Ledesma, 0.');
  });

  it('sets ganados', () => {
    const texto = explicarDesempate(arriba('sets_ganados', { setsGanados: 4 }), fila('Ledesma', { setsGanados: 3 }), true);

    expect(texto).toBe('Bustos y Ledesma están igualados en partidos. Desempata sets ganados: 4 contra 3.');
  });

  it('diferencia de sets, con signo', () => {
    const texto = explicarDesempate(
      arriba('diferencia_sets', { setsGanados: 2, setsPerdidos: 2 }),
      fila('Ledesma', { setsGanados: 2, setsPerdidos: 3 }),
      true,
    );

    expect(texto).toBe('Bustos y Ledesma están igualados en partidos y sets ganados. Desempata diferencia de sets: 0 contra -1.');
  });

  it('games ganados', () => {
    const texto = explicarDesempate(arriba('games_ganados', { gamesGanados: 23 }), fila('Ledesma', { gamesGanados: 17 }), true);

    expect(texto).toBe('Bustos y Ledesma están igualados en partidos y sets. Desempata games ganados: 23 contra 17.');
  });

  it('diferencia de games', () => {
    const texto = explicarDesempate(
      arriba('diferencia_games', { gamesGanados: 24, gamesPerdidos: 18 }),
      fila('Ledesma', { gamesGanados: 24, gamesPerdidos: 22 }),
      true,
    );

    expect(texto).toBe('Bustos y Ledesma están igualados en partidos, sets y games ganados. Desempata diferencia de games: +6 contra +2.');
  });

  it('enfrentamiento directo', () => {
    const texto = explicarDesempate(arriba('enfrentamiento_directo'), fila('Ledesma'), true);

    expect(texto).toBe('Bustos y Ledesma están igualados en partidos, sets y games. Desempata el partido entre ambos, que ganó Bustos.');
  });

  it('ranking al inicio del torneo', () => {
    const texto = explicarDesempate(arriba('ranking', { posicionSiembra: 3 }), fila('Ledesma', { posicionSiembra: 7 }), true);

    expect(texto).toBe(
      'Bustos y Ledesma están igualados en partidos, sets y games. Desempata el ranking al inicio del torneo: Bustos entró sembrado 3.º y Ledesma, 7.º.',
    );
  });

  it('sin ranking no habla de ranking: lo que desempata es el sorteo', () => {
    const texto = explicarDesempate(arriba('ranking', { posicionSiembra: 3 }), fila('Ledesma', { posicionSiembra: 7 }), false);

    expect(texto).toBe('Bustos y Ledesma están igualados en partidos, sets y games. Desempata el sorteo, porque el circuito no usa ranking.');
  });

  it('si ninguno jugó todavía, lo dice en lugar de hablar de igualdad', () => {
    const sinJugar = { partidosJugados: 0, partidosGanados: 0, setsGanados: 0, setsPerdidos: 0, gamesGanados: 0, gamesPerdidos: 0 };
    const texto = explicarDesempate(arriba('ranking', { ...sinJugar, posicionSiembra: 1 }), fila('Ledesma', { ...sinJugar, posicionSiembra: 5 }), true);

    expect(texto).toBe('Bustos y Ledesma todavía no jugaron. Desempata el ranking al inicio del torneo: Bustos entró sembrado 1.º y Ledesma, 5.º.');
  });

  it('si comparten apellido, usa el nombre completo', () => {
    const texto = explicarDesempate(
      fila('Bustos', { nombre: 'Juan', desempateConElSiguiente: 'games_ganados', gamesGanados: 23 }),
      fila('Bustos', { nombre: 'Pedro', gamesGanados: 17 }),
      true,
    );

    expect(texto).toBe('Juan Bustos y Pedro Bustos están igualados en partidos y sets. Desempata games ganados: 23 contra 17.');
  });
});
