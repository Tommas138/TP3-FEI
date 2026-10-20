import { describe, expect, it } from 'vitest';
import { avisosDeFixture, tokensDadosDeBaja } from '../../src/modules/avisos/avisos';

describe('avisosDeFixture', () => {
  it('le dice a cada jugador con cuenta su zona', () => {
    const avisos = avisosDeFixture('Otoño 26 · Tercera', [
      { usuarioId: 7, grupo: 'C' },
      { usuarioId: 9, grupo: 'A' },
    ]);

    expect(avisos).toEqual([
      { usuarioId: 7, titulo: 'Ya está el fixture de Otoño 26 · Tercera', cuerpo: expect.stringContaining('zona C') },
      { usuarioId: 9, titulo: 'Ya está el fixture de Otoño 26 · Tercera', cuerpo: expect.stringContaining('zona A') },
    ]);
  });

  it('no avisa a quien no tiene cuenta: no tiene la app', () => {
    expect(avisosDeFixture('Otoño 26 · Tercera', [{ usuarioId: null, grupo: 'B' }])).toEqual([]);
  });
});

describe('tokensDadosDeBaja', () => {
  it('devuelve solo los tokens de celulares que ya no están registrados', () => {
    const tokens = ['ExponentPushToken[a]', 'ExponentPushToken[b]', 'ExponentPushToken[c]'];
    const tickets = [
      { status: 'ok' as const },
      { status: 'error' as const, details: { error: 'DeviceNotRegistered' } },
      { status: 'error' as const, details: { error: 'MessageRateExceeded' } },
    ];

    expect(tokensDadosDeBaja(tokens, tickets)).toEqual(['ExponentPushToken[b]']);
  });

  it('sin tickets, no da de baja a nadie', () => {
    expect(tokensDadosDeBaja(['ExponentPushToken[a]'], [])).toEqual([]);
  });
});
