import type { ZonaSorteada } from '@setpoint/shared';

// La suma de las posiciones de siembra: si todas las zonas dan lo mismo, quedaron parejas.
export function sumaDeSiembra(zona: ZonaSorteada) {
  return zona.integrantes.reduce((total, integrante) => total + integrante.posicionSiembra, 0);
}

// Todos contra todos: una zona de 4 juega 6 partidos.
export function partidosDeZona(zonas: ZonaSorteada[]) {
  return zonas.reduce((total, { integrantes }) => total + (integrantes.length * (integrantes.length - 1)) / 2, 0);
}
