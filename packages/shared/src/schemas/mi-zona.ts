// Mi zona, en la app del jugador (F11): docs/pantallas/jugador/mi-zona.html. La tabla es la
// misma de F07; además van los partidos de la zona, para la matriz de todos contra todos.
import type { FilaDePosiciones } from './posiciones';

export type SetDeMiZona = { gamesA: number; gamesB: number; esSuperTieBreak: boolean };

export type PartidoDeMiZona = {
  id: number;
  jugadorAId: number;
  jugadorBId: number;
  ganadorId: number | null;
  // JUGADA, WALKOVER, ABANDONO, o un estado previo a jugarse.
  estado: string;
  fechaAcordada: string | null;
  sets: SetDeMiZona[];
};

export type MiZona = {
  torneoId: number;
  // "Copa del Limay 2026 · Tercera"
  nombre: string;
  grupo: string;
  usaRanking: boolean;
  clasificanPorGrupo: number;
  tieneComplementaria: boolean;
  // Hasta cuándo hay para jugar la zona. null si el torneo no tiene plazo cargado.
  vence: string | null;
  filas: FilaDePosiciones[];
  partidos: PartidoDeMiZona[];
};

// zona null: el jugador no está en ninguna zona en juego.
export type RespuestaMiZona = { zona: MiZona | null };
