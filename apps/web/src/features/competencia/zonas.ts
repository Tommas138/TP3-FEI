import type { JugadorDelSorteo, ZonaSorteada } from '@setpoint/shared';

// La suma de las posiciones de siembra: si todas las zonas dan lo mismo, quedaron parejas.
export function sumaDeSiembra(zona: ZonaSorteada) {
  return zona.integrantes.reduce((total, integrante) => total + integrante.posicionSiembra, 0);
}

// Todos contra todos: una zona de 4 juega 6 partidos.
export function partidosDeZona(zonas: { integrantes: unknown[] }[]) {
  return zonas.reduce((total, { integrantes }) => total + (integrantes.length * (integrantes.length - 1)) / 2, 0);
}

// En el modo manual, la zona de cada jugador mientras se carga el sorteo presencial.
// Quien no figura todavía no tiene zona.
export type Asignacion = Record<number, string>;

export type ZonaACargar = { grupo: string; integrantes: JugadorDelSorteo[] };

// Las zonas como van quedando. Los jugadores llegan en orden de siembra y así quedan en cada zona.
export function zonasDeLaAsignacion(jugadores: JugadorDelSorteo[], letras: string[], asignacion: Asignacion): ZonaACargar[] {
  return letras.map((grupo) => ({ grupo, integrantes: jugadores.filter((j) => asignacion[j.jugadorId] === grupo) }));
}

// La asignación de un borrador ya guardado, para seguir desde ahí.
export function asignacionDeLasZonas(zonas: ZonaSorteada[] | null): Asignacion {
  return Object.fromEntries((zonas ?? []).flatMap((z) => z.integrantes.map((i) => [i.jugadorId, z.grupo])));
}
