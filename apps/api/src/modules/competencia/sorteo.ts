// Sorteo y armado de zonas (02-dominio.md §4).
// Lógica pura: recibe jugadores, devuelve zonas y partidos. No toca la base.

import { letrasDeZonas, tamanosDeZona } from '@setpoint/shared';

// Mismos valores que el enum ModoDistribucion de Prisma.
export type ModoDistribucion = 'SERPENTINA' | 'DIRECTA' | 'BOMBOS';

// Fuente de azar con el contrato de Math.random: un número en [0, 1).
// Se recibe por parámetro para que los tests puedan fijar el resultado.
export type Azar = () => number;

export type JugadorASembrar = { jugadorId: number; puntos: number };

export type Zona = {
  grupo: string; // "A", "B"...
  integrantes: { jugadorId: number; posicionSiembra: number }[];
};

export type PartidoDeZona = { grupo: string; jugadorAId: number; jugadorBId: number };

// Fisher-Yates. Devuelve una copia: no modifica la lista que recibe.
export function mezclar<T>(items: T[], azar: Azar): T[] {
  const mezclados = [...items];
  for (let i = mezclados.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [mezclados[i], mezclados[j]] = [mezclados[j], mezclados[i]];
  }
  return mezclados;
}

// Orden de siembra: de más a menos puntos. Los empatados quedan al azar entre ellos
// (decisión 013). En un torneo sin ranking todos llegan con 0 y el orden entero es al azar.
// Devuelve los ids; la posición de siembra de cada uno es su índice + 1.
export function ordenarSiembra(jugadores: JugadorASembrar[], azar: Azar): number[] {
  // El sort es estable: entre empatados se conserva el orden que dejó la mezcla.
  return mezclar(jugadores, azar)
    .sort((a, b) => b.puntos - a.puntos)
    .map((j) => j.jugadorId);
}

// La siembra de un sorteo anterior, si sigue sirviendo: cada inscripto tiene una posición y
// van de 1 a N sin huecos. Si alguien se bajó o entró después, devuelve null y hay que sembrar
// de nuevo. Reusarla es lo que hace que cambiar de modo no vuelva a sortear los empates
// (decisión 014).
export function siembraGuardada(inscriptos: { jugadorId: number; posicionSiembra: number | null }[]): number[] | null {
  const ordenados = [...inscriptos].sort((a, b) => (a.posicionSiembra ?? 0) - (b.posicionSiembra ?? 0));
  const completa = ordenados.length > 0 && ordenados.every((i, indice) => i.posicionSiembra === indice + 1);
  return completa ? ordenados.map((i) => i.jugadorId) : null;
}

// Las zonas son de 4 y, si no se llenó el cupo, de 3. Con menos, la zona no alcanza para
// definir quién clasifica (decisión 015).
export const MINIMO_POR_ZONA = 3;

export function alcanzanParaLasZonas(inscriptos: number, cantidadGrupos: number) {
  return inscriptos >= cantidadGrupos * MINIMO_POR_ZONA;
}

// En qué orden recibe jugadores cada grupo en una vuelta.
function ordenDeGrupos(modo: ModoDistribucion, vuelta: number, cantidadGrupos: number, azar: Azar): number[] {
  const grupos = Array.from({ length: cantidadGrupos }, (_, i) => i);
  if (modo === 'BOMBOS') return mezclar(grupos, azar);
  if (modo === 'SERPENTINA' && vuelta % 2 === 1) return grupos.reverse();
  return grupos;
}

// Reparte la siembra en zonas, de a una vuelta: cada vuelta toma la franja siguiente de
// la siembra (tantos jugadores como grupos) y le da uno a cada grupo.
//   SERPENTINA: invierte la dirección en cada vuelta, así las zonas suman lo mismo.
//   DIRECTA: siempre de la A a la última.
//   BOMBOS: al azar dentro de cada franja.
// Si los jugadores no alcanzan para completar la última vuelta, quedan zonas con uno menos.
export function distribuirEnZonas(siembra: number[], cantidadGrupos: number, modo: ModoDistribucion, azar: Azar): Zona[] {
  const zonas: Zona[] = letrasDeZonas(cantidadGrupos).map((grupo) => ({ grupo, integrantes: [] }));

  for (let inicio = 0; inicio < siembra.length; inicio += cantidadGrupos) {
    const franja = siembra.slice(inicio, inicio + cantidadGrupos);
    const orden = ordenDeGrupos(modo, inicio / cantidadGrupos, cantidadGrupos, azar);
    franja.forEach((jugadorId, i) => {
      zonas[orden[i]].integrantes.push({ jugadorId, posicionSiembra: inicio + i + 1 });
    });
  }
  return zonas;
}

export type ZonaCargada = { grupo: string; jugadorIds: number[] };

// Zonas de un sorteo hecho en persona y cargado a mano (modo manual). Tienen que estar todos
// los de la siembra, una sola vez, en las zonas del formato y con los mismos tamaños que daría
// el sorteo (decisión 015). La posición de siembra sale de la siembra, no de quien carga.
//   JUGADORES_DISTINTOS: falta alguien, sobra alguien o alguien está dos veces.
//   ZONAS_INVALIDAS: no son las zonas del formato o alguna quedó de un tamaño que no corresponde.
export function armarZonasManuales(
  cargadas: ZonaCargada[],
  siembra: number[],
  cantidadGrupos: number,
): { zonas: Zona[] } | { error: 'JUGADORES_DISTINTOS' | 'ZONAS_INVALIDAS' } {
  const letras = letrasDeZonas(cantidadGrupos);
  if (cargadas.length !== cantidadGrupos || cargadas.some((z, i) => z.grupo !== letras[i])) {
    return { error: 'ZONAS_INVALIDAS' };
  }

  const ids = cargadas.flatMap((z) => z.jugadorIds);
  const enLaSiembra = new Set(siembra);
  if (ids.length !== siembra.length || new Set(ids).size !== ids.length || ids.some((id) => !enLaSiembra.has(id))) {
    return { error: 'JUGADORES_DISTINTOS' };
  }

  const { menor, mayor } = tamanosDeZona(siembra.length, cantidadGrupos);
  const minimo = Math.max(menor, MINIMO_POR_ZONA);
  if (cargadas.some((z) => z.jugadorIds.length < minimo || z.jugadorIds.length > mayor)) {
    return { error: 'ZONAS_INVALIDAS' };
  }

  const posicion = new Map(siembra.map((jugadorId, i) => [jugadorId, i + 1]));
  return {
    zonas: cargadas.map(({ grupo, jugadorIds }) => ({
      grupo,
      integrantes: jugadorIds
        .map((jugadorId) => ({ jugadorId, posicionSiembra: posicion.get(jugadorId)! }))
        .sort((a, b) => a.posicionSiembra - b.posicionSiembra),
    })),
  };
}

// Todos contra todos dentro de cada zona: con 4 integrantes, 6 partidos.
export function generarPartidosDeZona(zonas: Zona[]): PartidoDeZona[] {
  const partidos: PartidoDeZona[] = [];
  for (const { grupo, integrantes } of zonas) {
    for (let a = 0; a < integrantes.length; a++) {
      for (let b = a + 1; b < integrantes.length; b++) {
        partidos.push({ grupo, jugadorAId: integrantes[a].jugadorId, jugadorBId: integrantes[b].jugadorId });
      }
    }
  }
  return partidos;
}
