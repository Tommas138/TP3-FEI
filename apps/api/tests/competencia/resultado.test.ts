import { describe, expect, it } from 'vitest';
import {
  ganadorDeLosSets,
  resultadoDelTorneoSchema,
  type DatosResultadoEntrada,
  type SistemaDeJuego,
} from '@setpoint/shared';

// El sistema de juego de POLENTA: al mejor de 3, sets a 6 con tie-break a 7 y super tie-break
// a 10 en lugar del tercer set (02-dominio.md §5).
const POLENTA: SistemaDeJuego = {
  setsPorPartido: 3,
  terceroSet: 'super_tiebreak',
  gamesPorSet: 6,
  puntosTieBreak: 7,
  puntosSuperTieBreak: 10,
};

const set = (gamesA: number, gamesB: number, tieBreak?: [number | null, number | null]) => ({
  gamesA,
  gamesB,
  ...(tieBreak && { tieBreakA: tieBreak[0], tieBreakB: tieBreak[1] }),
});
const superTieBreak = (puntosA: number, puntosB: number) => ({ gamesA: puntosA, gamesB: puntosB, esSuperTieBreak: true });

const jugado = (...sets: ReturnType<typeof set>[]): DatosResultadoEntrada => ({ tipo: 'jugado', sets });
const abandono = (...sets: ReturnType<typeof set>[]): DatosResultadoEntrada => ({ tipo: 'abandono', ganadorId: 1, sets });

// Los problemas del resultado como { campo: mensaje }. Vacío si se puede guardar.
function problemas(datos: DatosResultadoEntrada, sistema = POLENTA) {
  const resultado = resultadoDelTorneoSchema(sistema).safeParse(datos);
  if (resultado.success) return {};
  return Object.fromEntries(resultado.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('resultadoDelTorneoSchema', () => {
  describe('sets', () => {
    it('acepta los sets que terminan 6-4 o menos', () => {
      expect(problemas(jugado(set(6, 4), set(0, 6), superTieBreak(10, 3)))).toEqual({});
    });

    it('7-5 es un set terminado', () => {
      expect(problemas(jugado(set(7, 5), set(5, 7), superTieBreak(10, 8)))).toEqual({});
    });

    it('6-5 todavía no terminó, y 8-6 no existe', () => {
      expect(problemas(jugado(set(6, 5), set(6, 2)))).toEqual({ 'sets.0': 'Un set termina 6-4 o menos, 7-5 o 7-6' });
      expect(problemas(jugado(set(8, 6), set(6, 2)))).toEqual({ 'sets.0': 'Un set termina 6-4 o menos, 7-5 o 7-6' });
    });

    it('sigue los games por set del torneo', () => {
      const cortos = { ...POLENTA, gamesPorSet: 4 };

      expect(problemas(jugado(set(4, 2), set(5, 4)), cortos)).toEqual({});
      expect(problemas(jugado(set(4, 3), set(4, 0)), cortos)).toEqual({ 'sets.0': 'Un set termina 4-2 o menos, 5-3 o 5-4' });
    });
  });

  describe('tie-break', () => {
    it('7-6 sin los puntos del tie-break alcanza: son opcionales (decisión 030)', () => {
      expect(problemas(jugado(set(7, 6), set(6, 3)))).toEqual({});
    });

    it('7-6 con el tie-break', () => {
      expect(problemas(jugado(set(7, 6, [7, 4]), set(6, 7, [5, 7]), superTieBreak(10, 6)))).toEqual({});
    });

    it('el punto extra: en 6-6 se juega un punto más, así que termina 7-6 y nunca 8-7', () => {
      expect(problemas(jugado(set(7, 6, [7, 6]), set(6, 3)))).toEqual({});
      expect(problemas(jugado(set(7, 6, [8, 7]), set(6, 3)))).toEqual({
        'sets.0.tieBreakA': 'El tie-break es a 7 puntos: termina 7-0 a 7-6',
      });
    });

    it('lo gana quien gana el set', () => {
      expect(problemas(jugado(set(7, 6, [4, 7]), set(6, 3)))).toEqual({
        'sets.0.tieBreakA': 'El tie-break lo gana quien gana el set',
      });
    });

    it('solo un 7-6 se define por tie-break', () => {
      expect(problemas(jugado(set(6, 4, [7, 4]), set(6, 3)))).toEqual({
        'sets.0.tieBreakA': 'Solo un 7-6 se define por tie-break',
      });
    });

    it('pide los puntos de los dos', () => {
      expect(problemas(jugado(set(7, 6, [7, null]), set(6, 3)))).toEqual({
        'sets.0.tieBreakB': 'Cargá los puntos de los dos, o de ninguno',
      });
    });
  });

  describe('super tie-break', () => {
    it('el punto extra: en 9-9 se juega un punto más, así que 10-9 vale y 11-9 o 11-10 no', () => {
      const mensaje = { 'sets.2': 'El super tie-break es a 10 puntos: termina 10-0 a 10-9' };

      expect(problemas(jugado(set(6, 4), set(3, 6), superTieBreak(10, 9)))).toEqual({});
      expect(problemas(jugado(set(6, 4), set(3, 6), superTieBreak(11, 9)))).toEqual(mensaje);
      expect(problemas(jugado(set(6, 4), set(3, 6), superTieBreak(11, 10)))).toEqual(mensaje);
    });

    it('solo se juega en el set decisivo', () => {
      expect(problemas(jugado(set(6, 4), superTieBreak(10, 8)))).toEqual({
        'sets.1': 'El super tie-break solo se juega en el set decisivo',
      });
    });

    it('si el torneo lo usa, el set decisivo no puede ser un set completo', () => {
      expect(problemas(jugado(set(6, 4), set(3, 6), set(6, 2)))).toEqual({
        'sets.2': 'En este torneo el set decisivo se define por super tie-break',
      });
    });

    it('con el tercer set completo, el decisivo es un set normal', () => {
      const completo = { ...POLENTA, terceroSet: 'set_completo' as const };

      expect(problemas(jugado(set(6, 4), set(3, 6), set(7, 5)), completo)).toEqual({});
      expect(problemas(jugado(set(6, 4), set(3, 6), superTieBreak(10, 8)), completo)).toEqual({
        'sets.2': 'En este torneo el set decisivo se juega completo',
      });
    });
  });

  describe('partido', () => {
    it('no hay tercer set cuando ya iba 2-0', () => {
      expect(problemas(jugado(set(6, 4), set(6, 3), superTieBreak(10, 8)))).toEqual({
        'sets.2': 'El partido ya estaba definido 2 a 0',
      });
    });

    it('falta el set decisivo', () => {
      expect(problemas(jugado(set(6, 4), set(3, 6)))).toEqual({ sets: 'El partido no terminó: va 1 a 1' });
    });

    it('a cinco sets se gana con tres, y el quinto es el decisivo', () => {
      const cincoSets = { ...POLENTA, setsPorPartido: 5 };

      expect(problemas(jugado(set(6, 4), set(6, 3), set(6, 2)), cincoSets)).toEqual({});
      expect(problemas(jugado(set(6, 4), set(3, 6), set(6, 2), set(4, 6), superTieBreak(10, 7)), cincoSets)).toEqual({});
      expect(problemas(jugado(set(6, 4), set(6, 3), superTieBreak(10, 8)), cincoSets)).toEqual({
        'sets.2': 'El super tie-break solo se juega en el set decisivo',
      });
    });
  });

  describe('W.O. y abandono', () => {
    it('el W.O. no lleva sets: el 6-0 6-0 se arma al calcular (decisión 016)', () => {
      expect(problemas({ tipo: 'walkover', ganadorId: 1 })).toEqual({});
    });

    it('el abandono guarda lo que se jugó: el último set puede haber quedado en juego', () => {
      expect(problemas(abandono(set(6, 3), set(2, 1)))).toEqual({});
      expect(problemas(abandono(set(6, 3), set(6, 6)))).toEqual({});
      expect(problemas(abandono(set(6, 3), set(3, 6), superTieBreak(5, 3)))).toEqual({});
    });

    it('puede haber abandono entre dos sets', () => {
      expect(problemas(abandono(set(6, 3), set(3, 6)))).toEqual({});
    });

    it('solo el último set puede quedar sin terminar', () => {
      expect(problemas(abandono(set(2, 1), set(6, 3)))).toEqual({ 'sets.0': 'Un set termina 6-4 o menos, 7-5 o 7-6' });
    });

    it('un set sin terminar va hasta 6-6', () => {
      expect(problemas(abandono(set(6, 3), set(8, 2)))).toEqual({
        'sets.1': 'Un set termina 6-4 o menos, 7-5 o 7-6, y sin terminar va hasta 6-6',
      });
    });

    it('si el partido ya estaba definido, no fue abandono', () => {
      expect(problemas(abandono(set(6, 3), set(6, 2)))).toEqual({ sets: 'El partido terminó 2 a 0: cargalo como jugado' });
    });
  });
});

describe('ganadorDeLosSets', () => {
  it('gana quien ganó más sets, contando el super tie-break como uno', () => {
    expect(ganadorDeLosSets([set(6, 4), set(3, 6), superTieBreak(10, 8)])).toBe('A');
    expect(ganadorDeLosSets([set(4, 6), set(7, 6), superTieBreak(8, 10)])).toBe('B');
  });

  it('mientras van iguales no hay ganador', () => {
    expect(ganadorDeLosSets([set(6, 4), set(3, 6)])).toBeNull();
  });
});
