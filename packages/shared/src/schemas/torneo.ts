import { z } from 'zod';

// Una convocatoria es lo que la organización publica en una sola pantalla: "Primavera 2026,
// Tercera y Segunda". En la base son varios Torneo, uno por categoría, que comparten todo
// salvo la categoría y el cupo (ver docs/decisiones/003-torneo-con-varias-categorias.md).

// Los grupos son siempre de 4, todos contra todos (02-dominio §3.1).
export const JUGADORES_POR_GRUPO = 4;

const entero = (min: number, max: number) =>
  z
    .number({ error: 'Tiene que ser un número' })
    .int('Tiene que ser un número entero')
    .min(min, `Como mínimo ${min}`)
    .max(max, `Como máximo ${max}`);

// Las fechas viajan como 'AAAA-MM-DD'. null = todavía sin definir: el borrador puede no tenerlas.
const fecha = z.iso.date('Fecha inválida').nullable().default(null);

const categoriaConCupo = z.object({
  // Por nombre, igual que en el padrón y en la configuración del circuito.
  categoria: z.string().trim().min(1).max(40),
  cupo: entero(2, 256),
});

export const estadosTorneo = [
  'borrador',
  'publicado',
  'inscripciones_cerradas',
  'zonas_generadas',
  'grupos_en_curso',
  'eliminatorias',
  'finalizado',
  'cancelado',
] as const;

export type EstadoTorneo = (typeof estadosTorneo)[number];

// Los valores por defecto son los de POLENTA, que coinciden con los del schema de Prisma.
export const convocatoriaSchema = z
  .object({
    // --- lo básico ---
    nombre: z.string({ error: 'Escribí el nombre del torneo' }).trim().min(2, 'Escribí el nombre del torneo').max(80),
    descripcion: z.string().trim().max(500).default(''),
    // null = torneo suelto, no actualiza ningún casillero del ranking.
    etapa: z.string().trim().min(1).max(40).nullable().default(null),
    categorias: z
      .array(categoriaConCupo)
      .min(1, 'Elegí al menos una categoría')
      .max(10)
      .refine(
        (lista) => new Set(lista.map((c) => c.categoria.toLowerCase())).size === lista.length,
        'Hay categorías repetidas',
      ),

    // --- inscripción ---
    precio: z.number({ error: 'Tiene que ser un número' }).min(0, 'No puede ser negativo').max(10_000_000).default(0),
    modoInscripcion: z.enum(['cerrada', 'con_aprobacion', 'abierta']).default('cerrada'),
    tieneListaEspera: z.boolean().default(true),
    cierreInscripcion: fecha,
    fechaInicio: fecha,

    // --- formato ---
    cantidadGrupos: entero(1, 32).default(8),
    clasificanPorGrupo: entero(1, JUGADORES_POR_GRUPO - 1).default(2),
    tieneComplementaria: z.boolean().default(true),

    // --- sistema de juego ---
    setsPorPartido: z.union([z.literal(3), z.literal(5)]).default(3),
    puntoDeOro: z.boolean().default(true),
    terceroSet: z.enum(['set_completo', 'super_tiebreak']).default('super_tiebreak'),
    gamesPorSet: entero(4, 9).default(6),
    puntosTieBreak: entero(5, 15).default(7),
    puntosSuperTieBreak: entero(7, 15).default(10),

    // --- plazos, en días ---
    plazoGruposDias: entero(1, 90).default(21),
    plazoPorRondaDias: entero(1, 30).default(7),

    // --- sedes ---
    sedeGrupos: z.enum(['libre', 'designada']).default('libre'),
    sedeEliminatorias: z.enum(['libre', 'designada']).default('designada'),
    // Club de la organización donde se juegan las eliminatorias, por nombre. Opcional:
    // los clubes registrados lo son.
    clubSede: z.string().trim().min(1).max(80).nullable().default(null),
  })
  .superRefine((datos, ctx) => {
    const lugares = datos.cantidadGrupos * JUGADORES_POR_GRUPO;
    datos.categorias.forEach((c, i) => {
      if (c.cupo > lugares) {
        ctx.addIssue({
          code: 'custom',
          path: ['categorias', i, 'cupo'],
          message: `Con ${datos.cantidadGrupos} grupos de ${JUGADORES_POR_GRUPO} entran hasta ${lugares}`,
        });
      }
    });

    // Las fechas 'AAAA-MM-DD' se comparan bien como texto.
    if (datos.cierreInscripcion && datos.fechaInicio && datos.cierreInscripcion > datos.fechaInicio) {
      ctx.addIssue({
        code: 'custom',
        path: ['cierreInscripcion'],
        message: 'La inscripción tiene que cerrar antes de que empiece el torneo',
      });
    }
  });

// Lo que manda la web: los campos con valor por defecto pueden faltar.
export type DatosConvocatoriaEntrada = z.input<typeof convocatoriaSchema>;
export type DatosConvocatoria = z.output<typeof convocatoriaSchema>;

// Punto de partida del formulario de nuevo torneo. Zod completa los valores por defecto;
// el nombre y las categorías los elige la organización.
export function convocatoriaInicial(categorias: string[]): DatosConvocatoria {
  const datos = convocatoriaSchema.parse({ nombre: 'provisorio', categorias: [{ categoria: 'x', cupo: 2 }] });
  const cupo = datos.cantidadGrupos * JUGADORES_POR_GRUPO;
  return { ...datos, nombre: '', categorias: categorias.map((categoria) => ({ categoria, cupo })) };
}

// Lo que devuelve la API. `id` es el del primer torneo de la convocatoria y es el que va en la URL.
export type Convocatoria = DatosConvocatoria & {
  id: number;
  estado: EstadoTorneo;
  torneos: { id: number; categoria: string }[];
};

// Una categoría de la convocatoria en el listado. `id` es el del torneo: el que va en la URL de
// Inscripciones y del sorteo. Cada categoría cierra la inscripción por separado, así que el
// estado puede no ser el mismo que el de las demás.
export type ResumenTorneo = {
  id: number;
  categoria: string;
  estado: EstadoTorneo;
  cupo: number;
  // Los que ya pagaron.
  inscriptos: number;
};

// Una fila del listado de torneos de la organización: una por convocatoria, no por categoría.
export type ResumenConvocatoria = {
  id: number;
  nombre: string;
  // El del primer torneo: borrador y publicado son de toda la convocatoria a la vez.
  estado: EstadoTorneo;
  torneos: ResumenTorneo[];
  cierreInscripcion: string | null;
  fechaInicio: string | null;
  precio: number;
};
