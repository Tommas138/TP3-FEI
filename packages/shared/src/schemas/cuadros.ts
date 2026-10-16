// Cuadros eliminatorios de un torneo (F08). Los arma la API al cerrar las zonas
// (docs/decisiones/022, 023 y 026); la web y la app solo los muestran.

// En la interfaz, "complementaria" se muestra con el nombre del cuadro consuelo.
export const clavesCuadro = ['campeonato', 'complementaria'] as const;
export type ClaveCuadro = (typeof clavesCuadro)[number];

// Mismos valores que el enum EstadoPartido de Prisma, en minúsculas.
export const estadosPartido = [
  'pendiente_coordinacion',
  'anotada',
  'confirmada',
  'jugada',
  'vencida',
  'walkover',
  'abandono',
  'cancelada',
] as const;
export type EstadoPartido = (typeof estadosPartido)[number];

export type JugadorDelCuadro = { jugadorId: number; nombre: string; apellido: string };

export type PartidoDelCuadro = {
  id: number;
  ronda: number; // 1 es la primera ronda; la última es la final
  ordenEnRonda: number; // de arriba hacia abajo del cuadro
  // null hasta que llega el ganador del partido anterior.
  jugadorA: JugadorDelCuadro | null;
  jugadorB: JugadorDelCuadro | null;
  ganadorId: number | null;
  estado: EstadoPartido;
  // 'AAAA-MM-DD'
  fechaLimite: string | null;
  // En un super tie-break, gamesA y gamesB son los puntos. Un W.O. no tiene sets (decisión 016);
  // en un abandono, el último puede haber quedado sin terminar (decisión 027).
  sets: { gamesA: number; gamesB: number; esSuperTieBreak: boolean }[];
};

export type CuadroEliminatorio = {
  cuadro: ClaveCuadro;
  // Rondas del cuadro, contando la primera aunque los byes la dejen incompleta: quien tiene
  // bye no juega la primera ronda y ese partido no existe (decisión 023).
  rondas: number;
  partidos: PartidoDelCuadro[];
};

export type Cuadros = {
  torneoId: number;
  // "Primavera 2026 · Tercera"
  nombre: string;
  // Sin cuadro consuelo, o si no le alcanzaron los jugadores, hay uno solo.
  cuadros: CuadroEliminatorio[];
};
