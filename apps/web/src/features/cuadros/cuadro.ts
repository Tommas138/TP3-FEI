import type { ClaveCuadro, CuadroEliminatorio, EstadoPartido, PartidoDelCuadro } from '@setpoint/shared';

// "Cuadro consuelo" va fijo hasta que la organización pueda configurar su nombre (07 §1.2).
// "Campeonato" sigue así hasta cerrar la decisión abierta 16.
export const NOMBRE_DEL_CUADRO: Record<ClaveCuadro, string> = {
  campeonato: 'Campeonato',
  complementaria: 'Cuadro consuelo',
};

const RONDAS_DESDE_LA_FINAL = ['final', 'semis', 'cuartos', 'octavos'];

// "octavos", "cuartos"... contando desde la final. Más atrás de octavos, el número de ronda.
export function rotuloDeRonda(ronda: number, rondas: number) {
  return RONDAS_DESDE_LA_FINAL[rondas - ronda] ?? `ronda ${ronda}`;
}

const CON_RESULTADO: EstadoPartido[] = ['jugada', 'walkover', 'abandono'];

export function tieneResultado(partido: PartidoDelCuadro) {
  return CON_RESULTADO.includes(partido.estado);
}

// Los lugares de una ronda, de arriba hacia abajo: la ronda tiene la mitad que la anterior y la
// final, uno. Donde hubo un bye no hay partido (decisión 023) y el lugar queda vacío, para que
// cada partido siga a la altura de los dos que lo alimentan.
export function lugaresDeLaRonda(cuadro: CuadroEliminatorio, ronda: number): (PartidoDelCuadro | null)[] {
  const lugares = 2 ** (cuadro.rondas - ronda);
  return Array.from(
    { length: lugares },
    (_, i) => cuadro.partidos.find((p) => p.ronda === ronda && p.ordenEnRonda === i + 1) ?? null,
  );
}

export function partidosJugados(cuadro: CuadroEliminatorio) {
  return cuadro.partidos.filter(tieneResultado).length;
}

// La primera ronda con algo por jugar; si ya se jugó todo, la final. Es donde abre el celular.
export function rondaEnCurso(cuadro: CuadroEliminatorio) {
  return cuadro.partidos.find((p) => !tieneResultado(p))?.ronda ?? cuadro.rondas;
}

// La final por jugarse se destaca: con borde negro y franja lima en el cuadro principal, y en gris
// en el consuelo, para que lo primero que se vea sea la final del principal.
export type Destacado = 'principal' | 'consuelo';

// La final, cuando ya se sabe quiénes la juegan y todavía no se jugó.
export function destacadoDe(partido: PartidoDelCuadro, cuadro: CuadroEliminatorio): Destacado | undefined {
  const finalPendiente =
    partido.ronda === cuadro.rondas && partido.jugadorA !== null && partido.jugadorB !== null && !tieneResultado(partido);
  if (!finalPendiente) return undefined;
  return cuadro.cuadro === 'campeonato' ? 'principal' : 'consuelo';
}

type Lado = 'A' | 'B';

// Lo que va a la derecha de cada jugador en la tarjeta. En el cuadro, los sets ganados (design.md
// §8); abierta, los games de cada set. Un W.O. y un abandono lo dicen del lado del ganador.
export function marcadorDelLado(partido: PartidoDelCuadro, lado: Lado, abierta: boolean): string {
  if (!tieneResultado(partido)) return '—';
  const esGanador = partido.ganadorId === (lado === 'A' ? partido.jugadorA : partido.jugadorB)?.jugadorId;
  if (partido.estado === 'walkover') return esGanador ? 'W.O.' : '';
  if (partido.estado === 'abandono' && !abierta) return esGanador ? 'ab.' : '';

  const propios = (set: PartidoDelCuadro['sets'][number]) => (lado === 'A' ? set.gamesA : set.gamesB);
  const ajenos = (set: PartidoDelCuadro['sets'][number]) => (lado === 'A' ? set.gamesB : set.gamesA);
  if (abierta) return partido.sets.map(propios).join(' ');
  return String(partido.sets.filter((set) => propios(set) > ajenos(set)).length);
}

const diaYHora = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

// "domingo 22 · 11:00" (design.md §8). Sin fecha anotada, "a coordinar".
export function cuandoSeJuega(partido: PartidoDelCuadro) {
  if (!partido.fechaAcordada) return 'a coordinar';
  const partes = Object.fromEntries(diaYHora.formatToParts(new Date(partido.fechaAcordada)).map((p) => [p.type, p.value]));
  return `${partes.weekday} ${partes.day} · ${partes.hour}:${partes.minute}`;
}

const PRIMEROS = ['', 'el primero', 'los dos primeros', 'los tres primeros', 'los cuatro primeros'];

// La bajada de la página, con el formato del torneo.
export function bajada(cuadros: CuadroEliminatorio[], clasificadosPorGrupo: number) {
  const primeros = PRIMEROS[clasificadosPorGrupo] ?? `los ${clasificadosPorGrupo} primeros`;
  const van = clasificadosPorGrupo === 1 ? 'va' : 'van';
  if (cuadros.length < 2) return `Al cuadro ${van} ${primeros} de cada zona.`;
  return `Corren en paralelo. Nadie queda afuera de la fase de grupos: ${primeros} de cada zona ${van} a ${NOMBRE_DEL_CUADRO.campeonato} y el resto al ${NOMBRE_DEL_CUADRO.complementaria.toLowerCase()}.`;
}
