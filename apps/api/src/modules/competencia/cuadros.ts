// Cuadros eliminatorios (02-dominio.md §3.2).
// Lógica pura: recibe las zonas terminadas, devuelve los partidos de cada cuadro. No toca la base.
import { compararEntreZonas, type ZonaConPartidos } from './clasificacion';

export type Clasificado = { jugadorId: number; grupo: string; posicionEnZona: number };

export type PartidoDeCuadro = {
  ronda: number; // 1 es la primera ronda; la última es la final
  ordenEnRonda: number; // de 1 en adelante, de arriba hacia abajo del cuadro
  jugadorAId: number | null; // null hasta que llega el ganador del partido anterior
  jugadorBId: number | null;
};

const desdeHasta = (desde: number, hasta: number) =>
  Array.from({ length: Math.max(0, hasta - desde + 1) }, (_, i) => desde + i);

// Qué puestos de cada zona van a cada cuadro. Sin cuadro consuelo, los que no clasifican
// quedan afuera.
export function puestosPorCuadro(clasificanPorGrupo: number, tieneComplementaria: boolean, zonaMasGrande: number) {
  return {
    campeonato: desdeHasta(1, Math.min(clasificanPorGrupo, zonaMasGrande)),
    complementaria: tieneComplementaria ? desdeHasta(clasificanPorGrupo + 1, zonaMasGrande) : [],
  };
}

// La siembra del cuadro: primero todos los del primer puesto, ordenados entre zonas con la
// cascada (decisión 018); después los del puesto siguiente, y así. El índice + 1 es la siembra.
export function siembraDelCuadro(zonas: ZonaConPartidos[], puestos: number[]): Clasificado[] {
  return puestos.flatMap((puesto) =>
    compararEntreZonas(zonas, puesto).map(({ jugadorId, grupo }) => ({ jugadorId, grupo, posicionEnZona: puesto })),
  );
}

// Orden de siembra estándar: en qué lugar del cuadro va cada siembra, de arriba hacia abajo.
// El 1 y el 2 solo pueden cruzarse en la final. Con 8 lugares: [1, 8, 4, 5, 2, 7, 3, 6].
export function ordenDeSiembra(lugares: number): number[] {
  let orden = [1];
  while (orden.length < lugares) {
    const suma = orden.length * 2 + 1;
    orden = orden.flatMap((s) => [s, suma - s]);
  }
  return orden;
}

// La potencia de 2 que sigue: los lugares que sobran son byes.
const lugaresPara = (jugadores: number) => 2 ** Math.ceil(Math.log2(jugadores));

// En qué ronda se cruzarían dos lugares del cuadro, contados desde 0: 1 es la primera ronda.
const rondaDelCruce = (a: number, b: number) => Math.floor(Math.log2(a ^ b)) + 1;

// Las franjas de siembra son {1}, {2}, {3, 4}, {5..8}, {9..16}... Cambiar de lugar a dos
// siembras de la misma franja no le quita protección a nadie: es lo que se sortea en un
// cuadro con cabezas de serie.
const franjaDe = (siembra: number) => Math.ceil(Math.log2(siembra));
const siembrasDeLaFranja = (franja: number) => (franja === 0 ? [1] : desdeHasta(2 ** (franja - 1) + 1, 2 ** franja));

// Ubica a cada clasificado en un lugar del cuadro. Parte del orden de siembra estándar y,
// dentro de cada franja, aleja a los compañeros de zona: cada uno toma el lugar en que se
// cruzaría lo más tarde posible con los de su zona ya ubicados. Con dos por zona, quedan en
// mitades opuestas y solo pueden cruzarse en la final (decisión 022).
//
// Los byes son para los mejores sembrados: un jugador solo cambia de lugar con otro que
// también tiene bye, o que también juega la primera ronda. Los lugares vacíos quedan en null.
export function ubicarEnElCuadro(siembra: Clasificado[]): (Clasificado | null)[] {
  const lugares = lugaresPara(siembra.length);
  const lugarDe = new Map(ordenDeSiembra(lugares).map((s, lugar) => [s, lugar]));
  const tieneBye = (s: number) => s <= lugares - siembra.length;

  const cuadro: (Clasificado | null)[] = Array(lugares).fill(null);
  const lugarDelJugador = new Map<number, number>();

  siembra.forEach((jugador, i) => {
    const s = i + 1;
    const companeros = siembra
      .slice(0, i)
      .filter((otro) => otro.grupo === jugador.grupo)
      .map((otro) => lugarDelJugador.get(otro.jugadorId)!);

    // De menor a mayor siembra: ante la misma distancia gana el lugar del orden estándar.
    const candidatos = siembrasDeLaFranja(franjaDe(s))
      .filter((t) => t <= siembra.length && tieneBye(t) === tieneBye(s))
      .map((t) => lugarDe.get(t)!)
      .filter((lugar) => cuadro[lugar] === null);

    let elegido = candidatos[0];
    let mejorRonda = -1;
    for (const lugar of candidatos) {
      const ronda = Math.min(Infinity, ...companeros.map((otro) => rondaDelCruce(lugar, otro)));
      if (ronda > mejorRonda) [elegido, mejorRonda] = [lugar, ronda];
    }

    cuadro[elegido] = jugador;
    lugarDelJugador.set(jugador.jugadorId, elegido);
  });

  return cuadro;
}

// A dónde va el ganador: el partido k de una ronda alimenta al ⌈k/2⌉ de la siguiente,
// como jugador A si k es impar y como B si es par.
export function lugarSiguiente(ordenEnRonda: number) {
  return { ordenEnRonda: Math.ceil(ordenEnRonda / 2), lado: ordenEnRonda % 2 === 1 ? 'A' : 'B' } as const;
}

// Todos los partidos del cuadro, de la primera ronda a la final. Los de las rondas siguientes
// quedan sin jugadores hasta que avanzan los ganadores. Quien tiene bye no juega la primera
// ronda: ese partido no se crea y el jugador ya queda en la segunda (decisión 023). Así un
// cuadro de n jugadores tiene n − 1 partidos, haya byes o no.
// Con menos de dos jugadores no hay cuadro.
export function armarCuadro(siembra: Clasificado[]): PartidoDeCuadro[] {
  if (siembra.length < 2) return [];
  const cuadro = ubicarEnElCuadro(siembra);
  const rondas = Math.log2(cuadro.length);

  const porRonda = desdeHasta(1, rondas).map((ronda) =>
    desdeHasta(1, cuadro.length / 2 ** ronda).map(
      (ordenEnRonda): PartidoDeCuadro => ({ ronda, ordenEnRonda, jugadorAId: null, jugadorBId: null }),
    ),
  );

  const primeraRonda = porRonda[0].filter((partido) => {
    const a = cuadro[partido.ordenEnRonda * 2 - 2];
    const b = cuadro[partido.ordenEnRonda * 2 - 1];
    if (a && b) {
      partido.jugadorAId = a.jugadorId;
      partido.jugadorBId = b.jugadorId;
      return true;
    }
    // Nunca quedan dos lugares vacíos juntos: cada lugar vacío enfrenta a una siembra con bye.
    const conBye = (a ?? b)!;
    const { ordenEnRonda, lado } = lugarSiguiente(partido.ordenEnRonda);
    porRonda[1][ordenEnRonda - 1][lado === 'A' ? 'jugadorAId' : 'jugadorBId'] = conBye.jugadorId;
    return false;
  });

  return [...primeraRonda, ...porRonda.slice(1).flat()];
}
