import { z } from 'zod';
import type { ClaveCuadro, EstadoPartido } from './cuadros';

// Carga de resultados (F06). La organización manda los sets; el ganador lo calcula la API.
// Las reglas del sistema de juego están en 02-dominio.md §5 y sus parámetros, en el torneo
// (07-configurabilidad.md §2.2).

const puntos = z
  .number({ error: 'Tiene que ser un número' })
  .int('Tiene que ser un número entero')
  .min(0, 'No puede ser negativo')
  .max(99, 'Como máximo 99');

// Un set del lado del jugador A y del B. En un super tie-break, gamesA y gamesB son los puntos.
export const setCargadoSchema = z.object({
  gamesA: puntos,
  gamesB: puntos,
  // Los puntos del tie-break de un 7-6 son opcionales: no cambian ninguna tabla (decisión 030).
  tieBreakA: puntos.nullable().default(null),
  tieBreakB: puntos.nullable().default(null),
  esSuperTieBreak: z.boolean().default(false),
});

const sets = z.array(setCargadoSchema).min(1, 'Cargá al menos un set').max(5, 'Como máximo 5 sets');
const ganadorId = z.number({ error: 'Elegí quién ganó' }).int().positive();

// Lo que manda la web al guardar o corregir el resultado de un partido.
export const resultadoSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('jugado'), sets }),
  // El W.O. no lleva sets: el 6-0 6-0 se arma al calcular la tabla (decisión 016).
  z.object({ tipo: z.literal('walkover'), ganadorId }),
  // Lo que se jugó hasta el abandono: el último set puede haber quedado sin terminar.
  // Para la tabla cuenta como un W.O. a favor de quien siguió (decisión 027).
  z.object({ tipo: z.literal('abandono'), ganadorId, sets }),
]);

export type DatosResultadoEntrada = z.input<typeof resultadoSchema>;
export type DatosResultado = z.output<typeof resultadoSchema>;
export type SetCargado = z.output<typeof setCargadoSchema>;

// Los parámetros del torneo que deciden cómo puede terminar un partido.
export type SistemaDeJuego = {
  setsPorPartido: number; // 3 o 5
  // Cómo se juega el set decisivo: el tercero, o el quinto a cinco sets.
  terceroSet: 'set_completo' | 'super_tiebreak';
  gamesPorSet: number;
  puntosTieBreak: number;
  puntosSuperTieBreak: number;
};

type Problema = { path: (string | number)[]; message: string };

const setsParaGanar = (sistema: SistemaDeJuego) => Math.floor(sistema.setsPorPartido / 2) + 1;

// Sets que ganó cada uno. Sirve para un partido terminado: en un abandono, el set que quedó
// sin terminar no lo ganó nadie.
export function setsGanados(sets: { gamesA: number; gamesB: number }[]) {
  return { a: sets.filter((s) => s.gamesA > s.gamesB).length, b: sets.filter((s) => s.gamesB > s.gamesA).length };
}

// Quién ganó un partido jugado: el que ganó más sets. null mientras estén igualados.
export function ganadorDeLosSets(sets: { gamesA: number; gamesB: number }[]): 'A' | 'B' | null {
  const { a, b } = setsGanados(sets);
  if (a === b) return null;
  return a > b ? 'A' : 'B';
}

// Un set a G games termina G a G−2 o menos, G+1 a G−1, o G+1 a G con tie-break.
function setTerminado({ gamesA, gamesB }: SetCargado, g: number) {
  const [mayor, menor] = [Math.max(gamesA, gamesB), Math.min(gamesA, gamesB)];
  return (mayor === g && menor <= g - 2) || (mayor === g + 1 && menor >= g - 1);
}

// Sin terminar, va hasta G−G: en el tie-break del set todavía no lo ganó nadie.
function setEnJuego({ gamesA, gamesB }: SetCargado, g: number) {
  const [mayor, menor] = [Math.max(gamesA, gamesB), Math.min(gamesA, gamesB)];
  return mayor < g || (mayor === g && menor >= g - 1);
}

// Tie-break y super tie-break son sin diferencia: se gana con P puntos y, si llegan a P−1
// iguales, se juega un punto más (02-dominio.md §5). Así, el máximo es P a P−1.
const tieBreakTerminado = (a: number, b: number, p: number) => Math.max(a, b) === p && Math.min(a, b) <= p - 1;

function problemaDelTieBreak(set: SetCargado, sistema: SistemaDeJuego): Problema | null {
  const { gamesA, gamesB, tieBreakA, tieBreakB } = set;
  if (tieBreakA === null && tieBreakB === null) return null;

  const g = sistema.gamesPorSet;
  const p = sistema.puntosTieBreak;
  if (Math.max(gamesA, gamesB) !== g + 1 || Math.min(gamesA, gamesB) !== g) {
    return { path: ['tieBreakA'], message: `Solo un ${g + 1}-${g} se define por tie-break` };
  }
  if (tieBreakA === null || tieBreakB === null) {
    return { path: [tieBreakA === null ? 'tieBreakA' : 'tieBreakB'], message: 'Cargá los puntos de los dos, o de ninguno' };
  }
  if (!tieBreakTerminado(tieBreakA, tieBreakB, p)) {
    return { path: ['tieBreakA'], message: `El tie-break es a ${p} puntos: termina ${p}-0 a ${p}-${p - 1}` };
  }
  if ((tieBreakA > tieBreakB) !== (gamesA > gamesB)) {
    return { path: ['tieBreakA'], message: 'El tie-break lo gana quien gana el set' };
  }
  return null;
}

// El problema de un set, si tiene. El último set de un abandono puede haber quedado en juego.
function problemaDelSet(set: SetCargado, numero: number, sistema: SistemaDeJuego, puedeEstarEnJuego: boolean): Problema | null {
  const decisivo = numero === sistema.setsPorPartido;
  const conSuperTieBreak = sistema.terceroSet === 'super_tiebreak';
  const g = sistema.gamesPorSet;

  if (set.esSuperTieBreak && !decisivo) return { path: [], message: 'El super tie-break solo se juega en el set decisivo' };
  if (set.esSuperTieBreak && !conSuperTieBreak) return { path: [], message: 'En este torneo el set decisivo se juega completo' };
  if (decisivo && conSuperTieBreak && !set.esSuperTieBreak) {
    return { path: [], message: 'En este torneo el set decisivo se define por super tie-break' };
  }

  if (set.esSuperTieBreak) {
    const p = sistema.puntosSuperTieBreak;
    if (set.tieBreakA !== null || set.tieBreakB !== null) {
      return { path: ['tieBreakA'], message: 'El super tie-break no lleva tie-break: sus puntos van en el set' };
    }
    if (tieBreakTerminado(set.gamesA, set.gamesB, p)) return null;
    if (puedeEstarEnJuego && Math.max(set.gamesA, set.gamesB) < p) return null;
    return {
      path: [],
      message: puedeEstarEnJuego
        ? `El super tie-break es a ${p} puntos: termina ${p}-0 a ${p}-${p - 1}, y sin terminar no llega a ${p}`
        : `El super tie-break es a ${p} puntos: termina ${p}-0 a ${p}-${p - 1}`,
    };
  }

  if (setTerminado(set, g)) return problemaDelTieBreak(set, sistema);
  if (puedeEstarEnJuego && setEnJuego(set, g)) {
    // Un set sin terminar no tiene tie-break terminado.
    return set.tieBreakA !== null || set.tieBreakB !== null
      ? { path: ['tieBreakA'], message: `Solo un ${g + 1}-${g} se define por tie-break` }
      : null;
  }
  const comoTermina = `Un set termina ${g}-${g - 2} o menos, ${g + 1}-${g - 1} o ${g + 1}-${g}`;
  return { path: [], message: puedeEstarEnJuego ? `${comoTermina}, y sin terminar va hasta ${g}-${g}` : comoTermina };
}

// Todo lo que impide guardar el resultado con el sistema de juego del torneo.
function problemasDelResultado(resultado: DatosResultado, sistema: SistemaDeJuego): Problema[] {
  if (resultado.tipo === 'walkover') return [];

  const abandono = resultado.tipo === 'abandono';
  const paraGanar = setsParaGanar(sistema);
  const problemas: Problema[] = [];
  const terminados = { a: 0, b: 0 };

  for (const [i, set] of resultado.sets.entries()) {
    // Lo que venga después del set que define el partido sobra.
    if (Math.max(terminados.a, terminados.b) === paraGanar) {
      const [mas, menos] = [Math.max(terminados.a, terminados.b), Math.min(terminados.a, terminados.b)];
      problemas.push({ path: ['sets', i], message: `El partido ya estaba definido ${mas} a ${menos}` });
      break;
    }

    const ultimo = i === resultado.sets.length - 1;
    const problema = problemaDelSet(set, i + 1, sistema, abandono && ultimo);
    if (problema) {
      problemas.push({ path: ['sets', i, ...problema.path], message: problema.message });
      continue;
    }

    // En un abandono, el último set puede no tener ganador todavía.
    const terminado = set.esSuperTieBreak
      ? tieBreakTerminado(set.gamesA, set.gamesB, sistema.puntosSuperTieBreak)
      : setTerminado(set, sistema.gamesPorSet);
    if (terminado) terminados[set.gamesA > set.gamesB ? 'a' : 'b']++;
  }
  if (problemas.length > 0) return problemas;

  const [mas, menos] = [Math.max(terminados.a, terminados.b), Math.min(terminados.a, terminados.b)];
  if (!abandono && mas < paraGanar) return [{ path: ['sets'], message: `El partido no terminó: va ${mas} a ${menos}` }];
  if (abandono && mas === paraGanar) {
    return [{ path: ['sets'], message: `El partido terminó ${mas} a ${menos}: cargalo como jugado` }];
  }
  return [];
}

// El resultado validado contra el sistema de juego del torneo. Lo usa la API al guardar, y la
// web para avisar antes de mandar.
export function resultadoDelTorneoSchema(sistema: SistemaDeJuego) {
  return resultadoSchema.superRefine((resultado, ctx) => {
    for (const { path, message } of problemasDelResultado(resultado, sistema)) {
      ctx.addIssue({ code: 'custom', path, message });
    }
  });
}

export type JugadorDelPartido = { jugadorId: number; nombre: string; apellido: string };

// Lo que devuelve la API de un partido: lo que hace falta para cargar o corregir su resultado.
export type PartidoConResultado = {
  id: number;
  torneoId: number;
  // "Primavera 2026 · Tercera"
  nombre: string;
  fase: 'grupos' | 'eliminatoria';
  grupo: string | null; // solo en fase de grupos
  cuadro: ClaveCuadro | null; // solo en eliminatorias
  ronda: number | null;
  // null en un partido de cuadro hasta que llega el ganador del anterior.
  jugadorA: JugadorDelPartido | null;
  jugadorB: JugadorDelPartido | null;
  estado: EstadoPartido;
  ganadorId: number | null;
  // Un W.O. no tiene sets. En un abandono, el último puede haber quedado sin terminar.
  sets: SetCargado[];
  sistema: SistemaDeJuego;
};
