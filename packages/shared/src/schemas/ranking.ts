// Ranking público del circuito (F09). Lo calcula la API por casillero con reemplazo
// (02-dominio.md §7); la web solo lo muestra. Sin datos de contacto de los jugadores.

export type TorneoDelCalendario = {
  id: number;
  nombre: string;
};

// Los puntos vigentes de un torneo del calendario y el año del que salieron ("Primavera 25").
export type Casillero = {
  etapaId: number;
  puntos: number;
  anio: number;
};

export type FilaDeRanking = {
  jugadorId: number;
  puesto: number;
  nombre: string;
  apellido: string;
  puntos: number;
  // Solo los casilleros con puntos. Los ajustes manuales suman al total sin casillero.
  casilleros: Casillero[];
};

export type CategoriaDeRanking = {
  id: number;
  nombre: string;
  filas: FilaDeRanking[];
};

export type RankingPublico = {
  organizacion: string;
  // false: la organización no lleva ranking y no se muestra ninguna tabla.
  usaRanking: boolean;
  torneosDelCalendario: TorneoDelCalendario[];
  categorias: CategoriaDeRanking[];
};
