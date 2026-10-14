import type { CriterioDesempate, FilaDePosiciones } from './schemas/posiciones';

// Explica en una línea por qué una fila de la tabla quedó arriba de la siguiente, para que
// nadie tenga que rehacer la cuenta: "Bustos y Ledesma están igualados en partidos y sets.
// Desempata games ganados: 23 contra 17."

type Fila = Pick<
  FilaDePosiciones,
  | 'nombre'
  | 'apellido'
  | 'posicionSiembra'
  | 'partidosJugados'
  | 'partidosGanados'
  | 'setsGanados'
  | 'setsPerdidos'
  | 'gamesGanados'
  | 'gamesPerdidos'
  | 'desempateConElSiguiente'
>;

const conSigno = (n: number) => (n > 0 ? `+${n}` : `${n}`);

// Los que deciden con un empate previo: todos menos el primero.
type CriterioTrasEmpate = Exclude<CriterioDesempate, 'partidos_ganados'>;

// En qué venían igualados cuando decidió cada criterio.
const igualadosEn: Record<CriterioTrasEmpate, string> = {
  sets_ganados: 'partidos',
  diferencia_sets: 'partidos y sets ganados',
  games_ganados: 'partidos y sets',
  diferencia_games: 'partidos, sets y games ganados',
  enfrentamiento_directo: 'partidos, sets y games',
  ranking: 'partidos, sets y games',
};

// El último desempate es la posición de siembra. Sin ranking, esa posición salió al azar del
// sorteo y decirle "ranking" sería engañoso (decisión 017).
function porRanking(arriba: Fila, abajo: Fila, nombres: [string, string], usaRanking: boolean) {
  if (!usaRanking) return 'Desempata el sorteo, porque el circuito no usa ranking.';
  return `Desempata el ranking al inicio del torneo: ${nombres[0]} entró sembrado ${arriba.posicionSiembra}.º y ${nombres[1]}, ${abajo.posicionSiembra}.º.`;
}

function desempata(criterio: CriterioTrasEmpate, arriba: Fila, abajo: Fila, nombres: [string, string], usaRanking: boolean) {
  switch (criterio) {
    case 'sets_ganados':
      return `Desempata sets ganados: ${arriba.setsGanados} contra ${abajo.setsGanados}.`;
    case 'diferencia_sets':
      return `Desempata diferencia de sets: ${conSigno(arriba.setsGanados - arriba.setsPerdidos)} contra ${conSigno(abajo.setsGanados - abajo.setsPerdidos)}.`;
    case 'games_ganados':
      return `Desempata games ganados: ${arriba.gamesGanados} contra ${abajo.gamesGanados}.`;
    case 'diferencia_games':
      return `Desempata diferencia de games: ${conSigno(arriba.gamesGanados - arriba.gamesPerdidos)} contra ${conSigno(abajo.gamesGanados - abajo.gamesPerdidos)}.`;
    case 'enfrentamiento_directo':
      return `Desempata el partido entre ambos, que ganó ${nombres[0]}.`;
    case 'ranking':
      return porRanking(arriba, abajo, nombres, usaRanking);
  }
}

// null en la última fila, que no tiene a nadie debajo.
export function explicarDesempate(arriba: Fila, abajo: Fila, usaRanking: boolean): string | null {
  const criterio = arriba.desempateConElSiguiente;
  if (criterio === null) return null;

  // Por apellido, salvo que los dos lo compartan.
  const nombres: [string, string] =
    arriba.apellido === abajo.apellido
      ? [`${arriba.nombre} ${arriba.apellido}`, `${abajo.nombre} ${abajo.apellido}`]
      : [arriba.apellido, abajo.apellido];

  if (criterio === 'partidos_ganados') {
    return `${nombres[0]} ganó ${arriba.partidosGanados} ${arriba.partidosGanados === 1 ? 'partido' : 'partidos'} y ${nombres[1]}, ${abajo.partidosGanados}.`;
  }
  // Mientras la zona no arrancó, todos están en cero y la tabla sigue la siembra.
  if (criterio === 'ranking' && arriba.partidosJugados === 0 && abajo.partidosJugados === 0) {
    return `${nombres[0]} y ${nombres[1]} todavía no jugaron. ${porRanking(arriba, abajo, nombres, usaRanking)}`;
  }
  return `${nombres[0]} y ${nombres[1]} están igualados en ${igualadosEn[criterio]}. ${desempata(criterio, arriba, abajo, nombres, usaRanking)}`;
}
