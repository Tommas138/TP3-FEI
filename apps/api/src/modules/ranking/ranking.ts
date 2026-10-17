import type { FilaDeRanking } from '@setpoint/shared';

// Ranking por casilleros de etapa con reemplazo (02-dominio.md §7).
// Lógica pura: recibe movimientos, devuelve puntos. No toca la base.

export type MovimientoDeRanking = {
  id: number;
  jugadorId: number;
  etapaId: number | null;
  puntos: number;
  fecha: Date;
};

// Con la misma fecha manda el id más alto: es el que se cargó después.
function esMasReciente(a: MovimientoDeRanking, b: MovimientoDeRanking) {
  const diferencia = a.fecha.getTime() - b.fecha.getTime();
  return diferencia !== 0 ? diferencia > 0 : a.id > b.id;
}

// El movimiento vigente de cada casillero: por cada jugador y etapa, el más reciente.
// Los movimientos sin etapa (ajustes manuales) no ocupan casillero y no se devuelven.
export function casillerosVigentes(movimientos: MovimientoDeRanking[]): MovimientoDeRanking[] {
  const casilleros = new Map<string, MovimientoDeRanking>();
  for (const movimiento of movimientos) {
    if (movimiento.etapaId === null) continue;
    const clave = `${movimiento.jugadorId}:${movimiento.etapaId}`;
    const vigente = casilleros.get(clave);
    if (!vigente || esMasReciente(movimiento, vigente)) casilleros.set(clave, movimiento);
  }
  return [...casilleros.values()];
}

// Puntos vigentes de cada jugador: por cada casillero de etapa vale solo el movimiento
// más reciente, y se suman los casilleros. Los ajustes manuales se suman todos.
// Los movimientos tienen que ser de una sola categoría: cada una tiene su ranking.
export function puntosVigentes(movimientos: MovimientoDeRanking[]): Map<number, number> {
  const puntos = new Map<number, number>();
  const ajustes = movimientos.filter((m) => m.etapaId === null);

  for (const movimiento of [...casillerosVigentes(movimientos), ...ajustes]) {
    puntos.set(movimiento.jugadorId, (puntos.get(movimiento.jugadorId) ?? 0) + movimiento.puntos);
  }
  return puntos;
}

// Puesto de cada jugador según sus puntos. Los empatados comparten puesto y el
// siguiente saltea los lugares ocupados: 1º, 2º, 2º, 4º.
export function asignarPuestos(puntosPorJugador: Map<number, number>): Map<number, number> {
  const ordenados = [...puntosPorJugador].sort(([, a], [, b]) => b - a);
  const puestos = new Map<number, number>();

  ordenados.forEach(([jugadorId, puntos], i) => {
    const anterior = ordenados[i - 1];
    const empata = anterior !== undefined && anterior[1] === puntos;
    puestos.set(jugadorId, empata ? puestos.get(anterior[0])! : i + 1);
  });
  return puestos;
}

export type JugadorDeRanking = { id: number; nombre: string; apellido: string };

// La tabla de una categoría (F09). Los movimientos tienen que ser de esa categoría y de
// esos jugadores. Ordenada por puesto; los empatados, por apellido. El año de cada
// casillero sale de la fecha del movimiento: "Primavera 25".
export function tablaDeCategoria(jugadores: JugadorDeRanking[], movimientos: MovimientoDeRanking[]): FilaDeRanking[] {
  const puntos = puntosVigentes(movimientos);
  const puestos = asignarPuestos(new Map(jugadores.map((j) => [j.id, puntos.get(j.id) ?? 0])));
  const casilleros = casillerosVigentes(movimientos);

  return jugadores
    .map((j) => ({
      jugadorId: j.id,
      puesto: puestos.get(j.id)!,
      nombre: j.nombre,
      apellido: j.apellido,
      puntos: puntos.get(j.id) ?? 0,
      casilleros: casilleros
        .filter((m) => m.jugadorId === j.id && m.puntos > 0)
        .map((m) => ({ etapaId: m.etapaId!, puntos: m.puntos, anio: m.fecha.getUTCFullYear() })),
    }))
    .sort((a, b) => a.puesto - b.puesto || a.apellido.localeCompare(b.apellido, 'es'));
}
