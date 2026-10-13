// Sorteo y armado de zonas (02-dominio.md §4).
// Lógica pura: recibe jugadores, devuelve zonas y partidos. No toca la base.

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
  const zonas: Zona[] = Array.from({ length: cantidadGrupos }, (_, i) => ({
    grupo: String.fromCharCode('A'.charCodeAt(0) + i),
    integrantes: [],
  }));

  for (let inicio = 0; inicio < siembra.length; inicio += cantidadGrupos) {
    const franja = siembra.slice(inicio, inicio + cantidadGrupos);
    const orden = ordenDeGrupos(modo, inicio / cantidadGrupos, cantidadGrupos, azar);
    franja.forEach((jugadorId, i) => {
      zonas[orden[i]].integrantes.push({ jugadorId, posicionSiembra: inicio + i + 1 });
    });
  }
  return zonas;
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
