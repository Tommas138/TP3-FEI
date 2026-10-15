import { z } from 'zod';
import type { EstadoTorneo } from './torneo';

// Sorteo y armado de zonas de un torneo (F05). Se sortea por torneo, es decir, por categoría:
// cada una tiene su ranking y sus zonas.

export const modosDistribucion = ['serpentina', 'directa', 'bombos'] as const;
export type ModoDistribucion = (typeof modosDistribucion)[number];

// Lo que manda la web al sortear. El resultado queda guardado como borrador hasta que se
// confirma (ver docs/decisiones/014-borrador-del-sorteo.md).
export const sortearSchema = z.object({
  modoDistribucion: z.enum(modosDistribucion),
  // true = "Volver a sortear": se vuelve a sortear también el orden entre los empatados en puntos.
  // false = solo cambia cómo se reparten: se reusa la siembra del borrador, si sigue sirviendo.
  nuevaSiembra: z.boolean().default(false),
});

export type DatosSortearEntrada = z.input<typeof sortearSchema>;
export type DatosSortear = z.output<typeof sortearSchema>;

export const modosSorteo = ['automatico', 'asistido', 'manual'] as const;
export type ModoSorteo = (typeof modosSorteo)[number];

// Lo que manda la web en el modo manual: el resultado de un sorteo hecho en persona, zona por
// zona. La API comprueba que estén todos los inscriptos y que las zonas sean las del formato.
export const cargarZonasSchema = z.object({
  zonas: z
    .array(
      z.object({
        grupo: z.string().regex(/^[A-Z]$/),
        jugadorIds: z.array(z.number().int().positive()),
      }),
    )
    .min(1),
});

export type DatosCargarZonas = z.infer<typeof cargarZonasSchema>;

// Las letras de las zonas: "A", "B"... tantas como grupos tiene el formato.
export function letrasDeZonas(cantidadGrupos: number) {
  return Array.from({ length: cantidadGrupos }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i));
}

// Cuántos jugadores puede tener cada zona: todas iguales o, si el cupo no se llenó, algunas
// con uno menos (decisión 015). Vale igual para el sorteo y para el que se carga a mano.
export function tamanosDeZona(inscriptos: number, cantidadGrupos: number) {
  return { menor: Math.floor(inscriptos / cantidadGrupos), mayor: Math.ceil(inscriptos / cantidadGrupos) };
}

export type IntegranteDeZona = {
  jugadorId: number;
  // Lugar en el ranking al momento del sorteo: 1 es el mejor sembrado.
  posicionSiembra: number;
  nombre: string;
  apellido: string;
};

export type ZonaSorteada = {
  grupo: string; // "A", "B"...
  integrantes: IntegranteDeZona[];
};

// Un inscripto que entra al sorteo, tenga o no zona en el borrador.
export type JugadorDelSorteo = {
  jugadorId: number;
  nombre: string;
  apellido: string;
  // null si todavía no se sorteó o si entró después del último sorteo.
  posicionSiembra: number | null;
};

export type Sorteo = {
  torneoId: number;
  // "Primavera 2026 · Tercera"
  nombre: string;
  estado: EstadoTorneo;
  // Sin ranking, la siembra sale entera al azar.
  usaRanking: boolean;
  modoDistribucion: ModoDistribucion;
  // Cómo se armó el borrador o, si ya se confirmó, las zonas.
  modoSorteo: ModoSorteo;
  // true una vez confirmado: las zonas ya no cambian y los partidos existen.
  confirmado: boolean;
  cantidadGrupos: number;
  plazoGruposDias: number;
  // Solo los que pagaron: son los únicos que entran al sorteo.
  inscriptos: number;
  // Los mismos inscriptos, en orden de siembra. El modo manual los reparte a mano.
  jugadores: JugadorDelSorteo[];
  // null mientras no se sorteó, o si cambiaron los inscriptos desde el último sorteo.
  zonas: ZonaSorteada[] | null;
};
