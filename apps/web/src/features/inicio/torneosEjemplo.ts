// Los tipos de la pantalla de inicio y datos de ejemplo para verla completa (/inicio?ejemplo=1).
// Los datos reales salen de torneosDeInicio.ts, que hoy solo puede llenar borradores e
// inscripciones abiertas: el ejemplo muestra cómo se ve con torneos en juego y terminados.
// Todos los nombres de personas son ficticios.

export type TorneoEnBorrador = {
  id: number;
  nombre: string;
  detalle: string;
};

export type TorneoEnJuego = {
  id: number;
  nombre: string;
  fase: string;
  detalle: string;
  partidosJugados: number;
  partidosTotales: number;
  partidosVencidos: number;
};

// Una categoría con la inscripción abierta. `id` es el del torneo, no el de la convocatoria.
export type TorneoConInscripcionAbierta = {
  id: number;
  nombre: string;
  detalle: string;
  pagaron: number;
  cupo: number;
};

// Una categoría con la inscripción cerrada que todavía no se sorteó.
export type TorneoParaSortear = {
  id: number;
  nombre: string;
  detalle: string;
  pagaron: number;
  cupo: number;
};

export type TorneoTerminado = {
  id: number;
  nombre: string;
  termino: string;
  campeon: string;
  jugadores: number;
};

export type Aviso =
  | { tipo: 'partidos-vencidos'; categoria: string; partidos: number }
  | { tipo: 'pocos-inscriptos'; torneo: string; pagaron: number; cupo: number; cierraEn: string };

export type TorneosDeInicio = {
  borradores: TorneoEnBorrador[];
  enJuego: TorneoEnJuego[];
  conInscripcionAbierta: TorneoConInscripcionAbierta[];
  paraSortear: TorneoParaSortear[];
  terminados: TorneoTerminado[];
  // La tabla muestra solo los últimos; este es el total.
  totalTerminados: number;
  avisos: Aviso[];
  jugadores: number;
  categorias: number;
  recaudadoEnInscripcionesAbiertas: number;
  usaRanking: boolean;
};

export const torneosEjemplo: TorneosDeInicio = {
  borradores: [],
  enJuego: [
    {
      id: 1,
      nombre: 'Invierno 26 · Segunda',
      fase: 'Cuadros',
      detalle: '32 jugadores · cuartos de final hasta el sábado 3',
      partidosJugados: 58,
      partidosTotales: 78,
      partidosVencidos: 3,
    },
  ],
  conInscripcionAbierta: [
    { id: 2, nombre: 'Primavera 26 · Tercera', detalle: 'Cierra el viernes 9 · sorteo el sábado 10', pagaron: 24, cupo: 32 },
    { id: 3, nombre: 'Primavera 26 · Segunda', detalle: 'Cierra el viernes 23 · sorteo el sábado 24', pagaron: 9, cupo: 32 },
  ],
  paraSortear: [],
  terminados: [
    { id: 4, nombre: 'Invierno 26 · Tercera', termino: '05/09/2026', campeon: 'Lucas Ferreyra', jugadores: 32 },
    { id: 5, nombre: 'Otoño 26 · Segunda', termino: '27/06/2026', campeon: 'Nicolás Arrieta', jugadores: 32 },
    { id: 6, nombre: 'Otoño 26 · Tercera', termino: '20/06/2026', campeon: 'Martín Sanhueza', jugadores: 28 },
  ],
  totalTerminados: 9,
  avisos: [
    { tipo: 'partidos-vencidos', categoria: 'Segunda', partidos: 3 },
    { tipo: 'pocos-inscriptos', torneo: 'Primavera 26 · Segunda', pagaron: 9, cupo: 32, cierraEn: 'tres semanas' },
  ],
  jugadores: 77,
  categorias: 2,
  recaudadoEnInscripcionesAbiertas: 1485000,
  usaRanking: true,
};
