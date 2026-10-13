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

export type Sorteo = {
  torneoId: number;
  // "Primavera 2026 · Tercera"
  nombre: string;
  estado: EstadoTorneo;
  // Sin ranking, la siembra sale entera al azar.
  usaRanking: boolean;
  modoDistribucion: ModoDistribucion;
  // true una vez confirmado: las zonas ya no cambian y los partidos existen.
  confirmado: boolean;
  cantidadGrupos: number;
  plazoGruposDias: number;
  // Solo los que pagaron: son los únicos que entran al sorteo.
  inscriptos: number;
  // null mientras no se sorteó, o si cambiaron los inscriptos desde el último sorteo.
  zonas: ZonaSorteada[] | null;
};
