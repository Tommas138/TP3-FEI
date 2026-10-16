import { EstadoPartido as EstadoPrisma, EstadoTorneo, FasePartido, type Prisma } from '@prisma/client';
import {
  ganadorDeLosSets,
  resultadoDelTorneoSchema,
  type ClaveCuadro,
  type DatosResultado,
  type EstadoPartido,
  type PartidoConResultado,
  type SistemaDeJuego,
} from '@setpoint/shared';
import { organizacionAdministrada } from '../../lib/permisos';
import { prisma } from '../../lib/prisma';
import { ErrorHttp } from '../../middleware/errores';
import { camposConError } from '../../middleware/validar';
import { correccionCambiaLosCuadros } from './cuadros';
import { avanzarGanador } from './cuadros.service';
import { INCLUIR_ZONAS, inscriptosYPartidos } from './posiciones.service';

// Carga y corrección de resultados (F06). Los carga la organización (03-flujo-organizacion.md §10).
// Las tablas de las zonas se calculan en cada consulta, así que guardar un resultado de zona ya
// las actualiza. Uno de cuadro, además, hace avanzar al ganador.

const TERMINADO = [EstadoTorneo.FINALIZADO, EstadoTorneo.CANCELADO];

const jugador = { select: { id: true, nombre: true, apellido: true } } as const;

const DEL_TORNEO = {
  id: true,
  nombre: true,
  edicion: true,
  estado: true,
  gruposCerrados: true,
  clasificanPorGrupo: true,
  tieneComplementaria: true,
  setsPorPartido: true,
  terceroSet: true,
  gamesPorSet: true,
  puntosTieBreak: true,
  puntosSuperTieBreak: true,
  categoria: { select: { nombre: true } },
} satisfies Prisma.TorneoSelect;

const DEL_PARTIDO = {
  id: true,
  torneoId: true,
  fase: true,
  grupo: true,
  cuadro: true,
  ronda: true,
  jugadorAId: true,
  jugadorBId: true,
  ganadorId: true,
  estado: true,
  actualizadoEn: true,
  jugadorA: jugador,
  jugadorB: jugador,
  sets: {
    select: { gamesA: true, gamesB: true, tieBreakA: true, tieBreakB: true, esSuperTieBreak: true },
    orderBy: { numero: 'asc' },
  },
} satisfies Prisma.PartidoSelect;

type Torneo = Prisma.TorneoGetPayload<{ select: typeof DEL_TORNEO }>;
type Partido = Prisma.PartidoGetPayload<{ select: typeof DEL_PARTIDO }>;

async function torneoDeLaOrganizacion(organizacionId: number, torneoId: number) {
  if (!Number.isInteger(torneoId)) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');
  // El filtro por organización es el aislamiento: el id solo no alcanza.
  const torneo = await prisma.torneo.findFirst({ where: { id: torneoId, organizacionId }, select: DEL_TORNEO });
  if (!torneo) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');
  return torneo;
}

// Partido no tiene organizacionId: se busca dentro del torneo, que ya se buscó en la organización.
async function partidoDelTorneo(torneoId: number, partidoId: number) {
  if (!Number.isInteger(partidoId)) throw new ErrorHttp(404, 'PARTIDO_NO_ENCONTRADO');
  const partido = await prisma.partido.findFirst({ where: { id: partidoId, torneoId }, select: DEL_PARTIDO });
  if (!partido) throw new ErrorHttp(404, 'PARTIDO_NO_ENCONTRADO');
  return partido;
}

const sistemaDeJuego = (torneo: Torneo): SistemaDeJuego => ({
  setsPorPartido: torneo.setsPorPartido,
  terceroSet: torneo.terceroSet.toLowerCase() as SistemaDeJuego['terceroSet'],
  gamesPorSet: torneo.gamesPorSet,
  puntosTieBreak: torneo.puntosTieBreak,
  puntosSuperTieBreak: torneo.puntosSuperTieBreak,
});

function aPartidoConResultado(torneo: Torneo, partido: Partido): PartidoConResultado {
  const aJugador = (j: Partido['jugadorA']) => j && { jugadorId: j.id, nombre: j.nombre, apellido: j.apellido };
  return {
    id: partido.id,
    torneoId: partido.torneoId,
    nombre: `${torneo.edicion ?? torneo.nombre} · ${torneo.categoria.nombre}`,
    fase: partido.fase === FasePartido.GRUPOS ? 'grupos' : 'eliminatoria',
    grupo: partido.grupo,
    cuadro: (partido.cuadro?.toLowerCase() ?? null) as ClaveCuadro | null,
    ronda: partido.ronda,
    jugadorA: aJugador(partido.jugadorA),
    jugadorB: aJugador(partido.jugadorB),
    estado: partido.estado.toLowerCase() as EstadoPartido,
    ganadorId: partido.ganadorId,
    sets: partido.sets,
    sistema: sistemaDeJuego(torneo),
  };
}

// Un partido con su resultado y el sistema de juego del torneo: lo que hace falta para cargarlo o corregirlo.
export async function obtenerPartido(slug: string, usuarioId: number, torneoId: number, partidoId: number) {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  const torneo = await torneoDeLaOrganizacion(organizacionId, torneoId);
  return aPartidoConResultado(torneo, await partidoDelTorneo(torneo.id, partidoId));
}

const ESTADO_DEL_RESULTADO = {
  jugado: EstadoPrisma.JUGADA,
  walkover: EstadoPrisma.WALKOVER,
  abandono: EstadoPrisma.ABANDONO,
} as const;

// El ganador de un partido jugado sale de los sets. El del W.O. y el del abandono lo indica la
// organización: es quien estuvo para jugar o quien siguió.
function ganadorDelResultado(resultado: DatosResultado, jugadorAId: number, jugadorBId: number) {
  if (resultado.tipo === 'jugado') return ganadorDeLosSets(resultado.sets) === 'A' ? jugadorAId : jugadorBId;
  if (resultado.ganadorId !== jugadorAId && resultado.ganadorId !== jugadorBId) {
    throw new ErrorHttp(400, 'DATOS_INVALIDOS', { ganadorId: 'Tiene que ser uno de los dos jugadores del partido' });
  }
  return resultado.ganadorId;
}

// Con las zonas cerradas, un resultado de zona se corrige solo si los cuadros que se armaron con
// esas tablas no cambian (decisión 028).
async function verificarQueNoCambianLosCuadros(torneo: Torneo, corregido: Parameters<typeof correccionCambiaLosCuadros>[3]) {
  const conZonas = await prisma.torneo.findUniqueOrThrow({ where: { id: torneo.id }, include: INCLUIR_ZONAS });
  const { inscriptos, partidos } = inscriptosYPartidos(conZonas);
  if (correccionCambiaLosCuadros(inscriptos, partidos, torneo, corregido)) {
    throw new ErrorHttp(409, 'CORRECCION_CAMBIA_LOS_CUADROS');
  }
}

// Guarda el resultado de un partido o lo corrige: reemplaza el que tenga. El ganador lo calcula
// la API, nunca lo manda el cliente salvo en un W.O. o un abandono.
export async function guardarResultado(
  slug: string,
  usuarioId: number,
  torneoId: number,
  partidoId: number,
  datos: DatosResultado,
): Promise<PartidoConResultado> {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  const torneo = await torneoDeLaOrganizacion(organizacionId, torneoId);
  const partido = await partidoDelTorneo(torneo.id, partidoId);

  // Terminado el torneo, sus puntos ya se repartieron (F16).
  if (TERMINADO.some((e) => e === torneo.estado)) throw new ErrorHttp(409, 'TORNEO_TERMINADO');
  if (partido.estado === EstadoPrisma.CANCELADA) throw new ErrorHttp(409, 'PARTIDO_CANCELADO');
  const { jugadorAId, jugadorBId } = partido;
  // En un cuadro, el partido espera a que llegue el ganador del anterior.
  if (jugadorAId === null || jugadorBId === null) throw new ErrorHttp(409, 'PARTIDO_SIN_JUGADORES');

  const validado = resultadoDelTorneoSchema(sistemaDeJuego(torneo)).safeParse(datos);
  if (!validado.success) throw new ErrorHttp(400, 'DATOS_INVALIDOS', camposConError(validado.error));
  const resultado = validado.data;

  const estado = ESTADO_DEL_RESULTADO[resultado.tipo];
  const ganadorId = ganadorDelResultado(resultado, jugadorAId, jugadorBId);
  // El W.O. no guarda sets (decisión 016); el abandono guarda lo que se jugó (decisión 027).
  const sets = resultado.tipo === 'walkover' ? [] : resultado.sets;

  const deZona = partido.fase === FasePartido.GRUPOS;
  if (deZona && torneo.gruposCerrados) {
    await verificarQueNoCambianLosCuadros(torneo, { grupo: partido.grupo!, jugadorAId, jugadorBId, ganadorId, estado, sets });
  }

  await prisma.$transaction(async (tx) => {
    // Con las zonas como condición: si se cerraron mientras tanto, esta carga no se comparó con los cuadros.
    const torneoSinCambios = await tx.torneo.updateMany({
      where: { id: torneo.id, gruposCerrados: torneo.gruposCerrados, estado: { notIn: TERMINADO } },
      data: { actualizadoEn: new Date() },
    });
    // Con la última modificación como condición, dos correcciones simultáneas no se pisan.
    const partidoSinCambios = await tx.partido.updateMany({
      where: { id: partido.id, actualizadoEn: partido.actualizadoEn },
      data: { estado, ganadorId },
    });
    if (torneoSinCambios.count === 0 || partidoSinCambios.count === 0) throw new ErrorHttp(409, 'RESULTADO_DESACTUALIZADO');

    // Los sets y el ganador se escriben juntos: Partido.ganadorId es una redundancia de los sets.
    await tx.setPartido.deleteMany({ where: { partidoId: partido.id } });
    if (sets.length > 0) {
      await tx.setPartido.createMany({ data: sets.map((set, i) => ({ partidoId: partido.id, numero: i + 1, ...set })) });
    }

    // Si el ganador es el mismo, el cuadro queda como estaba.
    if (!deZona && ganadorId !== partido.ganadorId) await avanzarGanador(tx, partido.id);
  });

  return aPartidoConResultado(torneo, await partidoDelTorneo(torneo.id, partido.id));
}
