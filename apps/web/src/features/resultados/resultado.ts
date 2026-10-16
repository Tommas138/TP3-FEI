import {
  ganadorDeLosSets,
  resultadoDelTorneoSchema,
  setsGanados,
  type ClaveCuadro,
  type DatosResultado,
  type EstadoPartido,
  type FilaDePosiciones,
  type JugadorDelPartido,
  type PartidoConResultado,
  type PartidoDeLaLista,
  type SetCargado,
  type SimulacionDeResultado,
  type SistemaDeJuego,
} from '@setpoint/shared';
import { ErrorApi } from '../../lib/api';

// Lógica de la pantalla Cargar resultado (F06): de lo que se escribe en la grilla al resultado
// que se manda a la API, y los textos que lo explican. No sabe de React ni de la API.

// Un texto con números: la pantalla muestra los números en mono (design.md §4).
export type Frase = (string | number)[];

export type TipoDeResultado = DatosResultado['tipo'];

// Una columna de la grilla tal como está escrita: un campo vacío es ''.
export type SetEscrito = { gamesA: string; gamesB: string; tieBreakA: string; tieBreakB: string };

export type Carga = {
  tipo: TipoDeResultado;
  // Una columna por set del sistema de juego. En un W.O. se conserva, pero no se manda.
  sets: SetEscrito[];
  // En un W.O., quién ganó; en un abandono, quién siguió jugando.
  ganadorId: number | null;
};

export type Columna = { rotulo: string; esSuperTieBreak: boolean };

// Una columna por set: set 1, set 2 y el decisivo, que puede ser un super tie-break.
export function columnasDeLaGrilla(sistema: SistemaDeJuego): Columna[] {
  return Array.from({ length: sistema.setsPorPartido }, (_, i) => {
    const esSuperTieBreak = i === sistema.setsPorPartido - 1 && sistema.terceroSet === 'super_tiebreak';
    return { rotulo: esSuperTieBreak ? 'super tie-break' : `set ${i + 1}`, esSuperTieBreak };
  });
}

// Los puntos del tie-break se piden solo en un set que terminó 7-6, y son opcionales (decisión 030).
export function llevaTieBreak(set: SetEscrito, columna: Columna, sistema: SistemaDeJuego) {
  if (columna.esSuperTieBreak || set.gamesA === '' || set.gamesB === '') return false;
  const [a, b] = [Number(set.gamesA), Number(set.gamesB)];
  return Math.max(a, b) === sistema.gamesPorSet + 1 && Math.min(a, b) === sistema.gamesPorSet;
}

const SIN_ESCRIBIR: SetEscrito = { gamesA: '', gamesB: '', tieBreakA: '', tieBreakB: '' };
const escrito = (n: number | null) => (n === null ? '' : String(n));

const ESTADOS_CON_RESULTADO: EstadoPartido[] = ['jugada', 'walkover', 'abandono'];
export const tieneResultado = (partido: { estado: EstadoPartido }) => ESTADOS_CON_RESULTADO.includes(partido.estado);

// Se puede cargar si tiene a sus dos jugadores y no se canceló.
export const sePuedeCargar = (partido: PartidoDeLaLista) =>
  partido.jugadorA !== null && partido.jugadorB !== null && partido.estado !== 'cancelada';

const falta = (partido: PartidoDeLaLista) => sePuedeCargar(partido) && !tieneResultado(partido);

// La carga con que arranca la pantalla: el resultado que ya tiene el partido, o vacía.
export function cargaDelPartido(partido: PartidoConResultado): Carga {
  const sets = Array.from({ length: partido.sistema.setsPorPartido }, (_, i): SetEscrito => {
    const set = partido.sets[i];
    if (!set) return SIN_ESCRIBIR;
    return {
      gamesA: escrito(set.gamesA),
      gamesB: escrito(set.gamesB),
      tieBreakA: escrito(set.tieBreakA),
      tieBreakB: escrito(set.tieBreakB),
    };
  });
  const tipo: TipoDeResultado = partido.estado === 'walkover' || partido.estado === 'abandono' ? partido.estado : 'jugado';
  return { tipo, sets, ganadorId: tipo === 'jugado' ? null : partido.ganadorId };
}

export type Problemas = {
  // Uno por columna de la grilla: el del set y el de los puntos de su tie-break.
  sets: (string | null)[];
  tieBreaks: (string | null)[];
  // Lo que es del partido entero: "El partido terminó 2 a 0: cargalo como jugado".
  partido: string | null;
};

export type Lectura = {
  // El resultado listo para mandar. null mientras falte algo o haya un problema.
  datos: DatosResultado | null;
  problemas: Problemas;
  // De qué lado está el ganador, para destacarlo. null mientras no se sepa.
  ganador: 'A' | 'B' | null;
};

const vacio = (s: string) => s === '';
const puntosDelTieBreak = (s: string) => (vacio(s) ? null : Number(s));

// Lee la carga con las mismas reglas que la API (resultadoDelTorneoSchema). Lo que todavía se
// está escribiendo no es un problema: un set a medias, o el partido sin terminar mientras
// queden sets vacíos. Esos casos no muestran mensaje, pero tampoco dejan guardar.
export function leerCarga(carga: Carga, partido: PartidoConResultado): Lectura {
  const { sistema } = partido;
  const columnas = columnasDeLaGrilla(sistema);
  const problemas: Problemas = { sets: columnas.map(() => null), tieBreaks: columnas.map(() => null), partido: null };
  const ladoDe = (jugadorId: number | null) =>
    jugadorId === null ? null : jugadorId === partido.jugadorA?.jugadorId ? 'A' : 'B';

  if (carga.tipo === 'walkover') {
    const datos = carga.ganadorId === null ? null : ({ tipo: 'walkover', ganadorId: carga.ganadorId } as const);
    return { datos, problemas, ganador: ladoDe(carga.ganadorId) };
  }
  const ganadorElegido = carga.tipo === 'abandono' ? ladoDe(carga.ganadorId) : null;

  // Los sets son las columnas escritas, de izquierda a derecha, hasta la primera vacía. Si
  // después hay otra escrita, falta esa.
  const sets: SetCargado[] = [];
  for (const [i, set] of carga.sets.entries()) {
    const escritos = [set.gamesA, set.gamesB].filter((s) => !vacio(s)).length;
    if (escritos < 2) {
      const sigueOtro = carga.sets.slice(i + 1).some((s) => !vacio(s.gamesA) || !vacio(s.gamesB));
      if (sigueOtro) problemas.sets[i] = escritos === 0 ? 'Falta este set' : 'Faltan los games de uno de los dos';
      if (sigueOtro || escritos === 1) return { datos: null, problemas, ganador: ganadorElegido };
      break;
    }
    const tieBreak = llevaTieBreak(set, columnas[i], sistema);
    sets.push({
      gamesA: Number(set.gamesA),
      gamesB: Number(set.gamesB),
      tieBreakA: tieBreak ? puntosDelTieBreak(set.tieBreakA) : null,
      tieBreakB: tieBreak ? puntosDelTieBreak(set.tieBreakB) : null,
      esSuperTieBreak: columnas[i].esSuperTieBreak,
    });
  }
  if (sets.length === 0) return { datos: null, problemas, ganador: ganadorElegido };

  // Sin ganador elegido, el abandono se valida igual para avisar de los sets: el 0 no es de nadie.
  const resultado =
    carga.tipo === 'jugado' ? { tipo: carga.tipo, sets } : { tipo: carga.tipo, ganadorId: carga.ganadorId ?? 0, sets };
  const validado = resultadoDelTorneoSchema(sistema).safeParse(resultado);
  for (const { path, message } of validado.error?.issues ?? []) {
    const [campo, i, detalle] = path;
    if (campo === 'sets' && typeof i === 'number') {
      const donde = detalle === 'tieBreakA' || detalle === 'tieBreakB' ? problemas.tieBreaks : problemas.sets;
      donde[i] ??= message;
    } else if (campo !== 'ganadorId') {
      problemas.partido ??= message;
    }
  }

  // Un partido que todavía no se definió, con sets por escribir, se está cargando.
  const { a, b } = setsGanados(sets);
  const sinDefinir = Math.max(a, b) < Math.floor(sistema.setsPorPartido / 2) + 1;
  if (carga.tipo === 'jugado' && sinDefinir && sets.length < columnas.length) problemas.partido = null;

  if (!validado.success) return { datos: null, problemas, ganador: ganadorElegido };
  const datos = validado.data;
  return { datos, problemas, ganador: datos.tipo === 'jugado' ? ganadorDeLosSets(datos.sets) : ladoDe(datos.ganadorId) };
}

// Cómo se nombra a cada jugador: por el apellido, salvo que los dos lo compartan.
export function nombresDelPartido(partido: {
  jugadorA: JugadorDelPartido | null;
  jugadorB: JugadorDelPartido | null;
}): [string, string] {
  const { jugadorA: a, jugadorB: b } = partido;
  if (a && b && a.apellido === b.apellido) return [`${a.nombre} ${a.apellido}`, `${b.nombre} ${b.apellido}`];
  return [a?.apellido ?? 'a definir', b?.apellido ?? 'a definir'];
}

const ORDINALES = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto'];

// Quién ganó y quién perdió, con el nombre con que se los muestra.
function ganadorYPerdedor(datos: DatosResultado, partido: PartidoConResultado) {
  const nombres = nombresDelPartido(partido);
  const a = { jugadorId: partido.jugadorA!.jugadorId, nombre: nombres[0] };
  const b = { jugadorId: partido.jugadorB!.jugadorId, nombre: nombres[1] };
  const ganaA = datos.tipo === 'jugado' ? ganadorDeLosSets(datos.sets) === 'A' : datos.ganadorId === a.jugadorId;
  return ganaA ? [a, b] : [b, a];
}

// La caja verde: "Gana Roa, 2 sets a 1", con un detalle en mono si hace falta.
export function resumenDelResultado(datos: DatosResultado, partido: PartidoConResultado): { titulo: Frase; detalle: string | null } {
  const [ganador, perdedor] = ganadorYPerdedor(datos, partido);
  if (datos.tipo === 'jugado') {
    const sets = setsGanados(datos.sets);
    const decisivo = datos.sets[datos.sets.length - 1];
    return {
      titulo: [`Gana ${ganador.nombre}, `, Math.max(sets.a, sets.b), ' sets a ', Math.min(sets.a, sets.b)],
      detalle: decisivo.esSuperTieBreak ? `el ${ORDINALES[datos.sets.length - 1]} set se definió por super tie-break` : null,
    };
  }
  // W.O. y abandono se computan 6-0 6-0 (decisiones 016 y 027).
  return datos.tipo === 'walkover'
    ? { titulo: [`Gana ${ganador.nombre} por walkover`], detalle: 'para la tabla cuenta 6-0 6-0' }
    : {
        titulo: [`Gana ${ganador.nombre} por abandono de ${perdedor.nombre}`],
        detalle: 'para la tabla cuenta 6-0 6-0, como un walkover',
      };
}

// En la interfaz, el cuadro consuelo no se llama "Complementaria" (design.md §9).
export const nombreDelCuadro = (cuadro: ClaveCuadro) => (cuadro === 'campeonato' ? 'Campeonato' : 'Cuadro consuelo');

// "semifinales", contando desde la final.
export function nombreDeRonda(ronda: number, rondas: number) {
  return ['final', 'semifinales', 'cuartos de final', 'octavos de final'][rondas - ronda] ?? `ronda ${ronda}`;
}

// Dónde se juega el partido, para las migas: "Zona A", o "Campeonato · semifinales".
export function ubicacionDelPartido(partido: PartidoConResultado) {
  if (partido.fase === 'grupos') return `Zona ${partido.grupo}`;
  return `${nombreDelCuadro(partido.cuadro!)} · ${nombreDeRonda(partido.ronda!, partido.rondas!)}`;
}

// El rótulo en mono debajo de los nombres: "zona A · fase de grupos".
export function rotuloDelPartido(partido: PartidoConResultado) {
  if (partido.fase === 'grupos') return `zona ${partido.grupo} · fase de grupos`;
  return ubicacionDelPartido(partido).toLowerCase();
}

export const CAMBIA_LOS_CUADROS =
  'Las zonas ya se cerraron y este resultado cambia quién clasifica o en qué orden. Los cuadros ya están armados, así que no se puede corregir.';

const DESTINOS = { campeonato: 'clasifica a Campeonato', complementaria: 'va al cuadro consuelo' };

// A qué cuadro iría si la zona terminara así. Mientras falten partidos, es "por ahora".
function destino(fila: FilaDePosiciones, zonaCompleta: boolean) {
  const texto = fila.destino ? DESTINOS[fila.destino] : 'queda afuera de los cuadros';
  return zonaCompleta ? texto : `por ahora ${texto}`;
}

// Lo que pasaría en la zona al guardar, con la tabla que calculó la API (decisión 032): dónde
// queda cada uno y a qué cuadro va. Con las zonas cerradas, si los cuadros cambian o no.
export function vistaPreviaDeLaZona(simulacion: SimulacionDeResultado, datos: DatosResultado, partido: PartidoConResultado): Frase[] {
  const zona = simulacion.zona!;
  const [ganador, perdedor] = ganadorYPerdedor(datos, partido);
  const filaDe = (jugadorId: number) => zona.filas.find((f) => f.jugadorId === jugadorId)!;
  const [g, p] = [filaDe(ganador.jugadorId), filaDe(perdedor.jugadorId)];

  if (simulacion.zonasCerradas) {
    return [
      [`${ganador.nombre} queda `, g.posicion, `.º y ${perdedor.nombre}, `, p.posicion, `.º, en la zona ${zona.grupo}.`],
      ...(simulacion.cambiaLosCuadros ? [] : [['Los cuadros quedan como estaban: la siembra no cambia.']]),
    ];
  }

  const completa = zona.partidosSinResultado === 0;
  const faltan = zona.partidosSinResultado;
  return [
    [
      `${ganador.nombre} queda `,
      g.posicion,
      `.º de la zona ${zona.grupo} con `,
      g.partidosGanados,
      ` ${g.partidosGanados === 1 ? 'partido ganado' : 'partidos ganados'} y ${destino(g, completa)}.`,
    ],
    [`${perdedor.nombre} queda `, p.posicion, `.º y ${destino(p, completa)}.`],
    completa
      ? [`La zona ${zona.grupo} queda completa.`]
      : faltan === 1
        ? ['Falta ', faltan, ` partido en la zona ${zona.grupo}.`]
        : ['Faltan ', faltan, ` partidos en la zona ${zona.grupo}.`],
  ];
}

const conArticulo = (ronda: string) => (ronda === 'final' || ronda.startsWith('ronda') ? `la ${ronda}` : ronda);

export const SIGUIENTE_YA_JUGADO =
  'El partido siguiente del cuadro ya se jugó con el ganador anterior, así que no se puede cambiar quién ganó.';

// Una corrección de cuadro que cambia el ganador no se guarda si el partido siguiente ya se
// jugó (decisión 028). Ese partido es el de la ronda siguiente donde está el ganador anterior.
export function cambiaUnGanadorQueYaJugo(datos: DatosResultado, partido: PartidoConResultado, lista: PartidoDeLaLista[]) {
  const anterior = partido.ganadorId;
  if (partido.fase !== 'eliminatoria' || anterior === null) return false;
  if (ganadorYPerdedor(datos, partido)[0].jugadorId === anterior) return false;
  return lista.some(
    (p) =>
      p.cuadro === partido.cuadro &&
      p.ronda === partido.ronda! + 1 &&
      tieneResultado(p) &&
      (p.jugadorA?.jugadorId === anterior || p.jugadorB?.jugadorId === anterior),
  );
}

// Lo que pasaría en el cuadro al guardar. La arma la web: alcanza con la ronda (decisión 032).
export function vistaPreviaDelCuadro(datos: DatosResultado, partido: PartidoConResultado): Frase[] {
  const [ganador, perdedor] = ganadorYPerdedor(datos, partido);
  const ronda = partido.ronda!;
  const rondas = partido.rondas!;
  const siguiente = conArticulo(nombreDeRonda(ronda + 1, rondas));

  const lineas: Frase[] =
    ronda === rondas
      ? [
          [`${ganador.nombre} es campeón ${partido.cuadro === 'campeonato' ? 'de Campeonato' : 'del cuadro consuelo'}.`],
          [`${perdedor.nombre} pierde la final.`],
        ]
      : [[`${ganador.nombre} pasa a ${siguiente}.`], [`${perdedor.nombre} queda afuera en ${conArticulo(nombreDeRonda(ronda, rondas))}.`]];

  // Una corrección que cambia el ganador lo reemplaza en el partido siguiente (decisión 028).
  if (tieneResultado(partido)) {
    if (partido.ganadorId === ganador.jugadorId) lineas.push(['El cuadro queda como estaba: el ganador es el mismo.']);
    else if (ronda < rondas) lineas.push([`${ganador.nombre} ocupa el lugar de ${perdedor.nombre} en ${siguiente}.`]);
  }
  return lineas;
}

// El primer partido al que le falta el resultado: es el que se abre si no se eligió uno.
export function primeroSinResultado(partidos: PartidoDeLaLista[]) {
  return partidos.find(falta) ?? null;
}

// Cómo está cada partido en la lista. Vencido es un partido que se pasó de su plazo sin resultado.
export type Situacion = 'sin_jugadores' | 'falta' | 'vencido' | 'con_resultado';

export type FilaDeLaLista = {
  partido: PartidoDeLaLista;
  situacion: Situacion;
  // "falta", "ganó Roa"...
  estado: string;
};

export type SeccionDeLaLista = {
  titulo: string;
  faltan: number;
  // Todos sus partidos tienen resultado. Una ronda de cuadro sin jugadores todavía no lo está.
  completa: boolean;
  filas: FilaDeLaLista[];
};

const faltaEn = (fila: FilaDeLaLista) => fila.situacion === 'falta' || fila.situacion === 'vencido';

function situacionEnLaLista(partido: PartidoDeLaLista): Situacion {
  if (!sePuedeCargar(partido)) return 'sin_jugadores';
  if (tieneResultado(partido)) return 'con_resultado';
  return partido.estado === 'vencida' ? 'vencido' : 'falta';
}

function estadoEnLaLista(partido: PartidoDeLaLista, situacion: Situacion) {
  if (situacion !== 'con_resultado') return { sin_jugadores: 'espera la ronda anterior', falta: 'falta', vencido: 'venció' }[situacion];
  const [a, b] = nombresDelPartido(partido);
  return `ganó ${partido.ganadorId === partido.jugadorA?.jugadorId ? a : b}`;
}

// Para «Cambiar partido»: una sección por zona y por ronda de cada cuadro. Primero las
// secciones con partidos que faltan y, en cada una, primero esos partidos. Los cancelados no
// se cargan.
export function seccionesDeLaLista(partidos: PartidoDeLaLista[]): SeccionDeLaLista[] {
  const rondas = new Map<ClaveCuadro, number>();
  for (const { cuadro, ronda } of partidos) if (cuadro) rondas.set(cuadro, Math.max(rondas.get(cuadro) ?? 0, ronda!));

  const secciones = new Map<string, FilaDeLaLista[]>();
  for (const partido of partidos.filter((p) => p.estado !== 'cancelada')) {
    const titulo =
      partido.fase === 'grupos'
        ? `Zona ${partido.grupo}`
        : `${nombreDelCuadro(partido.cuadro!)} · ${nombreDeRonda(partido.ronda!, rondas.get(partido.cuadro!)!)}`;
    const situacion = situacionEnLaLista(partido);
    secciones.set(titulo, [...(secciones.get(titulo) ?? []), { partido, situacion, estado: estadoEnLaLista(partido, situacion) }]);
  }

  return [...secciones]
    .map(([titulo, filas]) => ({
      titulo,
      faltan: filas.filter(faltaEn).length,
      completa: filas.every((f) => f.situacion === 'con_resultado'),
      filas: [...filas.filter(faltaEn), ...filas.filter((f) => !faltaEn(f))],
    }))
    .sort((x, y) => Number(y.faltan > 0) - Number(x.faltan > 0));
}

// Cada error de la API, en palabras.
export function textoDelError(error: Error, porDefecto = 'No se pudo guardar. Probá de nuevo.'): string {
  const codigo = error instanceof ErrorApi ? error.codigo : '';
  switch (codigo) {
    case 'CORRECCION_CAMBIA_LOS_CUADROS':
      return CAMBIA_LOS_CUADROS;
    case 'SIGUIENTE_YA_JUGADO':
      return SIGUIENTE_YA_JUGADO;
    case 'TORNEO_TERMINADO':
      return 'El torneo ya terminó y sus puntos se repartieron: no se pueden cargar ni corregir resultados.';
    case 'PARTIDO_CANCELADO':
      return 'Este partido se canceló: no lleva resultado.';
    case 'PARTIDO_SIN_JUGADORES':
      return 'Este partido todavía no tiene a sus dos jugadores: espera a los ganadores de la ronda anterior.';
    case 'RESULTADO_DESACTUALIZADO':
      return 'Alguien guardó otro resultado de este partido mientras tanto. Recargá la página para verlo antes de guardar.';
    case 'DATOS_INVALIDOS':
      return Object.values((error as ErrorApi).campos)[0] ?? 'Revisá el resultado.';
    case 'SIN_CONEXION':
      return 'No hay conexión. Probá de nuevo.';
    default:
      return porDefecto;
  }
}
