// Tabla de posiciones de la zona (02-dominio.md §6).
// Lógica pura: recibe los partidos de una zona, devuelve la tabla. No toca la base.

// Mismos valores que el enum EstadoPartido de Prisma.
export type EstadoPartido =
  | 'PENDIENTE_COORDINACION'
  | 'ANOTADA'
  | 'CONFIRMADA'
  | 'JUGADA'
  | 'VENCIDA'
  | 'WALKOVER'
  | 'CANCELADA';

// Un set como lo guarda SetPartido. En un super tie-break, gamesA y gamesB son los puntos.
export type SetDelPartido = { gamesA: number; gamesB: number; esSuperTieBreak: boolean };

export type PartidoDeLaTabla = {
  jugadorAId: number;
  jugadorBId: number;
  ganadorId: number | null;
  estado: EstadoPartido;
  sets: SetDelPartido[];
};

export type Estadisticas = {
  jugadorId: number;
  partidosJugados: number;
  partidosGanados: number;
  setsGanados: number;
  setsPerdidos: number;
  gamesGanados: number;
  gamesPerdidos: number;
};

// Solo suman los partidos con resultado. Un W.O. tiene ganador aunque no tenga sets.
export function tieneResultado(partido: PartidoDeLaTabla) {
  return (partido.estado === 'JUGADA' || partido.estado === 'WALKOVER') && partido.ganadorId !== null;
}

// El W.O. se computa 6-0 6-0 a favor del rival (02-dominio.md §8.5). No se guardan sets:
// se arman acá a partir del estado y del ganador (decisión 016).
function setsDelResultado(partido: PartidoDeLaTabla): SetDelPartido[] {
  if (partido.estado !== 'WALKOVER') return partido.sets;
  const ganaA = partido.ganadorId === partido.jugadorAId;
  const set = { gamesA: ganaA ? 6 : 0, gamesB: ganaA ? 0 : 6, esSuperTieBreak: false };
  return [set, set];
}

// Games que aporta un set a cada lado. El tie-break ya está dentro del 7-6, así que cuenta
// como un game. El super tie-break cuenta como un game para quien lo gana, no como sus puntos.
function gamesDelSet(set: SetDelPartido): [number, number] {
  if (!set.esSuperTieBreak) return [set.gamesA, set.gamesB];
  return set.gamesA > set.gamesB ? [1, 0] : [0, 1];
}

// Partidos, sets y games de cada integrante de la zona. Quien todavía no jugó queda en cero.
export function estadisticasDeZona(integrantes: { jugadorId: number }[], partidos: PartidoDeLaTabla[]): Estadisticas[] {
  const porJugador = new Map<number, Estadisticas>(
    integrantes.map(({ jugadorId }) => [
      jugadorId,
      { jugadorId, partidosJugados: 0, partidosGanados: 0, setsGanados: 0, setsPerdidos: 0, gamesGanados: 0, gamesPerdidos: 0 },
    ]),
  );

  for (const partido of partidos.filter(tieneResultado)) {
    const a = porJugador.get(partido.jugadorAId);
    const b = porJugador.get(partido.jugadorBId);
    if (!a || !b) throw new Error(`El partido ${partido.jugadorAId} - ${partido.jugadorBId} no es de esta zona`);

    a.partidosJugados++;
    b.partidosJugados++;
    (partido.ganadorId === partido.jugadorAId ? a : b).partidosGanados++;

    for (const set of setsDelResultado(partido)) {
      const [gamesA, gamesB] = gamesDelSet(set);
      a.gamesGanados += gamesA;
      a.gamesPerdidos += gamesB;
      b.gamesGanados += gamesB;
      b.gamesPerdidos += gamesA;
      const [ganador, perdedor] = gamesA > gamesB ? [a, b] : [b, a];
      ganador.setsGanados++;
      perdedor.setsPerdidos++;
    }
  }
  return [...porJugador.values()];
}

// Criterios de desempate, en el orden del reglamento (02-dominio.md §6).
export type Criterio =
  | 'PARTIDOS_GANADOS'
  | 'SETS_GANADOS'
  | 'DIFERENCIA_SETS'
  | 'GAMES_GANADOS'
  | 'DIFERENCIA_GAMES'
  | 'ENFRENTAMIENTO_DIRECTO'
  | 'RANKING';

// Un integrante con su posición de siembra, que es su ranking al inicio del torneo:
// la escribe el sorteo con el ranking vigente (decisión 014).
export type Integrante = { jugadorId: number; posicionSiembra: number };

type FilaAOrdenar = Estadisticas & { posicionSiembra: number };

// Lo que sabe un criterio además de las dos filas: quiénes siguen empatados en este punto
// de la cascada y los partidos de la zona.
type Empate = { empatados: FilaAOrdenar[]; partidos: PartidoDeLaTabla[] };

// Negativo si a va antes que b, positivo si va después, 0 si el criterio no los separa.
type Comparador = { criterio: Criterio; comparar: (a: FilaAOrdenar, b: FilaAOrdenar, empate: Empate) => number };

const masEsMejor = (valor: (e: Estadisticas) => number) => (a: Estadisticas, b: Estadisticas) => valor(b) - valor(a);

// Solo desempata entre dos. Con tres o más empatados no hay un único enfrentamiento que
// mirar, y se pasa al ranking (decisión 017). Si no jugaron entre ellos, tampoco separa.
function enfrentamientoDirecto(a: FilaAOrdenar, b: FilaAOrdenar, { empatados, partidos }: Empate) {
  if (empatados.length !== 2) return 0;
  const entreEllos = partidos.find(
    (p) =>
      tieneResultado(p) &&
      ((p.jugadorAId === a.jugadorId && p.jugadorBId === b.jugadorId) ||
        (p.jugadorAId === b.jugadorId && p.jugadorBId === a.jugadorId)),
  );
  if (!entreEllos) return 0;
  return entreEllos.ganadorId === a.jugadorId ? -1 : 1;
}

// La cascada es una lista: reordenarla para otro circuito es cambiar este array
// (07-configurabilidad.md §3).
export const CASCADA_DE_ZONA: Comparador[] = [
  { criterio: 'PARTIDOS_GANADOS', comparar: masEsMejor((e) => e.partidosGanados) },
  { criterio: 'SETS_GANADOS', comparar: masEsMejor((e) => e.setsGanados) },
  { criterio: 'DIFERENCIA_SETS', comparar: masEsMejor((e) => e.setsGanados - e.setsPerdidos) },
  { criterio: 'GAMES_GANADOS', comparar: masEsMejor((e) => e.gamesGanados) },
  { criterio: 'DIFERENCIA_GAMES', comparar: masEsMejor((e) => e.gamesGanados - e.gamesPerdidos) },
  { criterio: 'ENFRENTAMIENTO_DIRECTO', comparar: enfrentamientoDirecto },
  // Las posiciones de siembra no se repiten, así que el ranking siempre desempata.
  { criterio: 'RANKING', comparar: (a, b) => a.posicionSiembra - b.posicionSiembra },
];

export type FilaDeTabla = FilaAOrdenar & {
  posicion: number;
  // El criterio que la separó de la fila de abajo. Es lo que se explica en pantalla
  // ("desempata games ganados"). Null en la última fila.
  desempateConElSiguiente: Criterio | null;
};

type Ordenada = { fila: FilaAOrdenar; desempateConElSiguiente: Criterio | null };

// Vale el primer criterio que rompe la igualdad: se ordena por el primero, se parte en
// bloques de empatados y cada bloque sigue con los criterios que quedan.
function ordenarPorCascada(bloque: FilaAOrdenar[], cascada: Comparador[], partidos: PartidoDeLaTabla[]): Ordenada[] {
  const [actual, ...resto] = cascada;
  if (bloque.length === 1 || !actual) return bloque.map((fila) => ({ fila, desempateConElSiguiente: null }));

  const empate = { empatados: bloque, partidos };
  const comparar = (a: FilaAOrdenar, b: FilaAOrdenar) => actual.comparar(a, b, empate);

  // El sort es estable: dentro de un empate se conserva el orden en que llegaron.
  const bloques: FilaAOrdenar[][] = [];
  for (const fila of [...bloque].sort(comparar)) {
    const ultimo = bloques.at(-1);
    if (ultimo && comparar(ultimo[0], fila) === 0) ultimo.push(fila);
    else bloques.push([fila]);
  }

  return bloques.flatMap((empatados, i) => {
    const ordenadas = ordenarPorCascada(empatados, resto, partidos);
    if (i < bloques.length - 1) ordenadas[ordenadas.length - 1].desempateConElSiguiente = actual.criterio;
    return ordenadas;
  });
}

// La tabla de posiciones de una zona, ordenada con la cascada de desempates.
export function tablaDeZona(integrantes: Integrante[], partidos: PartidoDeLaTabla[]): FilaDeTabla[] {
  const siembra = new Map(integrantes.map((i) => [i.jugadorId, i.posicionSiembra]));
  const filas = estadisticasDeZona(integrantes, partidos).map((e) => ({ ...e, posicionSiembra: siembra.get(e.jugadorId)! }));

  return ordenarPorCascada(filas, CASCADA_DE_ZONA, partidos).map(({ fila, desempateConElSiguiente }, i) => ({
    ...fila,
    posicion: i + 1,
    desempateConElSiguiente,
  }));
}
