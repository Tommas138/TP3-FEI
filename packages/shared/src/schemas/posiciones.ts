// Tabla de posiciones de las zonas de un torneo (F07). La calcula la API con la cascada de
// desempates de 02-dominio.md §6; la web y la app solo la muestran.

// En el orden de la cascada.
export const criteriosDesempate = [
  'partidos_ganados',
  'sets_ganados',
  'diferencia_sets',
  'games_ganados',
  'diferencia_games',
  'enfrentamiento_directo',
  'ranking',
] as const;
export type CriterioDesempate = (typeof criteriosDesempate)[number];

// A qué cuadro iría si la zona terminara así. null: queda afuera (sin cuadro consuelo).
// En la interfaz, "complementaria" se muestra con el nombre del cuadro consuelo.
export type DestinoDeZona = 'campeonato' | 'complementaria' | null;

export type FilaDePosiciones = {
  posicion: number;
  jugadorId: number;
  nombre: string;
  apellido: string;
  // Ranking al inicio del torneo: 1 es el mejor sembrado. Es el último desempate.
  posicionSiembra: number;
  partidosJugados: number;
  partidosGanados: number;
  setsGanados: number;
  setsPerdidos: number;
  gamesGanados: number;
  gamesPerdidos: number;
  // El criterio que la separó de la fila de abajo. null en la última fila.
  desempateConElSiguiente: CriterioDesempate | null;
  destino: DestinoDeZona;
};

export type ZonaDePosiciones = {
  grupo: string; // "A", "B"...
  filas: FilaDePosiciones[];
};

export type Posiciones = {
  torneoId: number;
  // "Primavera 2026 · Tercera"
  nombre: string;
  // Sin ranking, la posición de siembra salió al azar del sorteo.
  usaRanking: boolean;
  // La línea de corte: los primeros clasificanPorGrupo van a Campeonato.
  clasificanPorGrupo: number;
  tieneComplementaria: boolean;
  zonas: ZonaDePosiciones[];
};
