import { describe, expect, it } from 'vitest';
import { partidosDelJugador, type PartidoLeido } from '../../src/modules/jugador/mis-partidos';

const roa = { nombre: 'Javier', apellido: 'Roa', telefono: '2994000000' };
const yo = { nombre: 'Martín', apellido: 'Sanhueza', telefono: '2995000000' };

let proximoId = 1;
function partido(datos: Partial<PartidoLeido>): PartidoLeido {
  return {
    id: proximoId++,
    fase: 'GRUPOS',
    grupo: 'C',
    cuadro: null,
    ronda: null,
    jugadorAId: 1,
    jugadorBId: 2,
    ganadorId: null,
    estado: 'PENDIENTE_COORDINACION',
    fechaAcordada: null,
    fechaLimite: null,
    sedeTexto: null,
    club: null,
    cancha: null,
    jugadorA: yo,
    jugadorB: roa,
    sets: [],
    ...datos,
  };
}

describe('partidosDelJugador', () => {
  it('solo devuelve los partidos en los que juega', () => {
    const partidos = partidosDelJugador(1, [partido({}), partido({ jugadorAId: 3, jugadorBId: 4 })]);

    expect(partidos).toHaveLength(1);
  });

  it('muestra el marcador desde su lado, juegue como A o como B', () => {
    const sets = [{ gamesA: 6, gamesB: 3 }, { gamesA: 4, gamesB: 6 }, { gamesA: 10, gamesB: 7 }];
    const comoA = partidosDelJugador(1, [partido({ estado: 'JUGADA', ganadorId: 1, sets })]);
    const comoB = partidosDelJugador(2, [partido({ estado: 'JUGADA', ganadorId: 1, sets })]);

    expect(comoA[0].resultado).toEqual({ gano: true, marcador: '6-3 4-6 10-7' });
    expect(comoB[0].resultado).toEqual({ gano: false, marcador: '3-6 6-4 7-10' });
  });

  it('un W.O. se muestra como W.O. y un abandono lleva la marca', () => {
    const [walkover, abandono] = partidosDelJugador(1, [
      partido({ estado: 'WALKOVER', ganadorId: 1 }),
      partido({ estado: 'ABANDONO', ganadorId: 2, sets: [{ gamesA: 6, gamesB: 4 }, { gamesA: 2, gamesB: 1 }] }),
    ]);

    expect(walkover.resultado).toEqual({ gano: true, marcador: 'W.O.' });
    expect(abandono.resultado).toEqual({ gano: false, marcador: '6-4 2-1 ab.' });
  });

  it('da el teléfono del rival solo si el partido no se jugó (decisión 046)', () => {
    const [porJugar, jugado] = partidosDelJugador(1, [
      partido({}),
      partido({ estado: 'JUGADA', ganadorId: 2, sets: [{ gamesA: 1, gamesB: 6 }, { gamesA: 2, gamesB: 6 }] }),
    ]);

    expect(porJugar.rival?.telefono).toBe('2994000000');
    expect(jugado.rival?.telefono).toBeNull();
  });

  it('nombra la ronda contando desde la final, y el cuadro consuelo por su nombre genérico', () => {
    const cuadro = { fase: 'ELIMINATORIA' as const, grupo: null };
    const partidos = partidosDelJugador(1, [
      partido({ ...cuadro, cuadro: 'CAMPEONATO', ronda: 1, jugadorAId: 5, jugadorBId: 6 }),
      partido({ ...cuadro, cuadro: 'CAMPEONATO', ronda: 2 }),
      partido({ ...cuadro, cuadro: 'CAMPEONATO', ronda: 3, jugadorAId: 7, jugadorBId: 8 }),
      partido({ ...cuadro, cuadro: 'COMPLEMENTARIA', ronda: 1 }),
      partido({}),
    ]);

    expect(partidos.map((p) => p.instancia)).toEqual(['campeonato · semifinales', 'cuadro consuelo · final', 'zona C']);
  });

  it('arma la sede con el club y la cancha, o usa la sede escrita', () => {
    const [registrada, libre] = partidosDelJugador(1, [
      partido({ club: { nombre: 'Club Alta Barda' }, cancha: { nombre: '3' } }),
      partido({ sedeTexto: 'Club Independiente' }),
    ]);

    expect(registrada.sede).toBe('Club Alta Barda · cancha 3');
    expect(libre.sede).toBe('Club Independiente');
  });

  it('un rival que todavía no se definió en el cuadro queda en null', () => {
    const [partidoSinRival] = partidosDelJugador(1, [partido({ jugadorB: null, jugadorBId: null })]);

    expect(partidoSinRival.rival).toBeNull();
  });

  it('con el nombre del torneo, la instancia lo lleva adelante', () => {
    const [conTorneo] = partidosDelJugador(1, [partido({ grupo: 'B' })], 'Copa Confluencia 2026');

    expect(conTorneo.instancia).toBe('Copa Confluencia 2026 · zona B');
  });
});
