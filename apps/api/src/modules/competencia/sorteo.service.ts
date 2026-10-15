import {
  EstadoInscripcion,
  EstadoTorneo,
  FasePartido,
  ModoSorteo as ModoSorteoPrisma,
  type ModoDistribucion as ModoPrisma,
  type Prisma,
} from '@prisma/client';
import {
  calcularFormato,
  type DatosCargarZonas,
  type DatosSortear,
  type EstadoTorneo as ClaveEstado,
  type ModoDistribucion,
  type ModoSorteo,
  type Sorteo,
} from '@setpoint/shared';
import { organizacionAdministrada } from '../../lib/permisos';
import { prisma } from '../../lib/prisma';
import { ErrorHttp } from '../../middleware/errores';
import { puntosVigentes } from '../ranking/ranking';
import {
  alcanzanParaLasZonas,
  armarZonasManuales,
  distribuirEnZonas,
  generarPartidosDeZona,
  MINIMO_POR_ZONA,
  ordenarSiembra,
  siembraGuardada,
  type Zona,
} from './sorteo';

// Sorteo y armado de zonas (F05). Mientras no se confirma, el resultado vive como borrador en
// Inscripcion.grupo y posicionSiembra: lo que se confirma es lo que se vio (decisión 014).

const CON_INSCRIPTOS = {
  categoria: { select: { nombre: true } },
  organizacion: { select: { usaRanking: true } },
  // Solo las pagadas entran al sorteo: una reserva sin pagar todavía puede vencer.
  inscripciones: {
    where: { estado: EstadoInscripcion.PAGADA },
    select: {
      id: true,
      jugadorId: true,
      grupo: true,
      posicionSiembra: true,
      jugador: { select: { nombre: true, apellido: true } },
    },
  },
} satisfies Prisma.TorneoInclude;

type TorneoConInscriptos = Prisma.TorneoGetPayload<{ include: typeof CON_INSCRIPTOS }>;

// El :id de la URL es el de un torneo, no el de la convocatoria: cada categoría se sortea aparte.
async function torneoDeLaOrganizacion(organizacionId: number, torneoId: number) {
  if (!Number.isInteger(torneoId)) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');

  // El filtro por organización es el aislamiento: el id solo no alcanza.
  const torneo = await prisma.torneo.findFirst({ where: { id: torneoId, organizacionId }, include: CON_INSCRIPTOS });
  if (!torneo) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');
  return torneo;
}

// Se sortea con la inscripción cerrada y hasta confirmar. Después, las zonas ya tienen partidos.
function verificarSorteable(torneo: TorneoConInscriptos) {
  if (torneo.estado !== EstadoTorneo.INSCRIPCIONES_CERRADAS || torneo.sorteoConfirmado) {
    throw new ErrorHttp(409, 'TORNEO_NO_SORTEABLE');
  }
}

// Las zonas del borrador, de la A en adelante y cada una en orden de siembra. null si todavía
// no se sorteó o si algún inscripto quedó sin zona (entró después del último sorteo).
function zonasGuardadas(torneo: TorneoConInscriptos) {
  const { inscripciones } = torneo;
  if (inscripciones.length === 0) return null;
  if (inscripciones.some((i) => i.grupo === null || i.posicionSiembra === null)) return null;

  const grupos = [...new Set(inscripciones.map((i) => i.grupo!))].sort();
  return grupos.map((grupo) => ({
    grupo,
    integrantes: inscripciones
      .filter((i) => i.grupo === grupo)
      .sort((a, b) => a.posicionSiembra! - b.posicionSiembra!)
      .map((i) => ({
        jugadorId: i.jugadorId,
        posicionSiembra: i.posicionSiembra!,
        nombre: i.jugador.nombre,
        apellido: i.jugador.apellido,
      })),
  }));
}

function aSorteo(torneo: TorneoConInscriptos): Sorteo {
  return {
    torneoId: torneo.id,
    nombre: `${torneo.edicion ?? torneo.nombre} · ${torneo.categoria.nombre}`,
    estado: torneo.estado.toLowerCase() as ClaveEstado,
    usaRanking: torneo.organizacion.usaRanking,
    modoDistribucion: torneo.modoDistribucion.toLowerCase() as ModoDistribucion,
    modoSorteo: torneo.modoSorteo.toLowerCase() as ModoSorteo,
    confirmado: torneo.sorteoConfirmado,
    cantidadGrupos: torneo.cantidadGrupos,
    plazoGruposDias: torneo.plazoGruposDias,
    inscriptos: torneo.inscripciones.length,
    // Los que no tienen siembra van al final, por apellido.
    jugadores: torneo.inscripciones
      .map((i) => ({
        jugadorId: i.jugadorId,
        nombre: i.jugador.nombre,
        apellido: i.jugador.apellido,
        posicionSiembra: i.posicionSiembra,
      }))
      .sort(
        (a, b) =>
          (a.posicionSiembra ?? Infinity) - (b.posicionSiembra ?? Infinity) || a.apellido.localeCompare(b.apellido, 'es'),
      ),
    zonas: zonasGuardadas(torneo),
  };
}

// Puntos de cada inscripto en el ranking vigente de la categoría del torneo. Sin ranking
// todos tienen 0 y la siembra sale entera al azar (decisión 013).
async function puntosDeLosInscriptos(torneo: TorneoConInscriptos) {
  const ids = torneo.inscripciones.map((i) => i.jugadorId);
  if (!torneo.organizacion.usaRanking) return ids.map((jugadorId) => ({ jugadorId, puntos: 0 }));

  const movimientos = await prisma.movimientoRanking.findMany({
    where: { organizacionId: torneo.organizacionId, categoriaId: torneo.categoriaId, jugadorId: { in: ids } },
    select: { id: true, jugadorId: true, etapaId: true, puntos: true, fecha: true },
  });
  const puntos = puntosVigentes(movimientos);
  return ids.map((jugadorId) => ({ jugadorId, puntos: puntos.get(jugadorId) ?? 0 }));
}

export async function obtenerSorteo(slug: string, usuarioId: number, torneoId: number) {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  return aSorteo(await torneoDeLaOrganizacion(organizacionId, torneoId));
}

// Las verificaciones que comparten el sorteo y la carga manual.
async function torneoParaSortear(slug: string, usuarioId: number, torneoId: number) {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  const torneo = await torneoDeLaOrganizacion(organizacionId, torneoId);
  verificarSorteable(torneo);
  if (!alcanzanParaLasZonas(torneo.inscripciones.length, torneo.cantidadGrupos)) {
    throw new ErrorHttp(409, 'INSCRIPTOS_INSUFICIENTES');
  }
  return torneo;
}

// La siembra del borrador si sigue sirviendo; si no, una nueva según el ranking.
async function siembraDelTorneo(torneo: TorneoConInscriptos, nueva: boolean) {
  const guardada = nueva ? null : siembraGuardada(torneo.inscripciones);
  return guardada ?? ordenarSiembra(await puntosDeLosInscriptos(torneo), Math.random);
}

// Sortea y guarda el resultado como borrador, reemplazando el anterior.
export async function sortear(slug: string, usuarioId: number, torneoId: number, datos: DatosSortear) {
  const torneo = await torneoParaSortear(slug, usuarioId, torneoId);
  const siembra = await siembraDelTorneo(torneo, datos.nuevaSiembra);
  const modo = datos.modoDistribucion.toUpperCase() as ModoPrisma;
  const zonas = distribuirEnZonas(siembra, torneo.cantidadGrupos, modo, Math.random);

  const modoSorteo = datos.modoSorteo === 'asistido' ? ModoSorteoPrisma.ASISTIDO : ModoSorteoPrisma.AUTOMATICO;
  await guardarBorrador(torneo, zonas, { modoDistribucion: modo, modoSorteo });
  return obtenerSorteo(slug, usuarioId, torneoId);
}

// Guarda como borrador las zonas de un sorteo hecho en persona (modo manual). La siembra se
// calcula igual que al sortear: así cada zona muestra sus posiciones y sus sumas.
export async function cargarZonas(slug: string, usuarioId: number, torneoId: number, datos: DatosCargarZonas) {
  const torneo = await torneoParaSortear(slug, usuarioId, torneoId);
  const siembra = await siembraDelTorneo(torneo, false);

  const resultado = armarZonasManuales(datos.zonas, siembra, torneo.cantidadGrupos);
  // Si los jugadores no coinciden, lo más probable es que alguien se haya inscripto o bajado mientras se cargaba.
  if ('error' in resultado) {
    throw new ErrorHttp(409, resultado.error === 'JUGADORES_DISTINTOS' ? 'SORTEO_DESACTUALIZADO' : 'ZONAS_INVALIDAS');
  }

  await guardarBorrador(torneo, resultado.zonas, { modoSorteo: ModoSorteoPrisma.MANUAL });
  return obtenerSorteo(slug, usuarioId, torneoId);
}

// Reemplaza el borrador por estas zonas.
async function guardarBorrador(torneo: TorneoConInscriptos, zonas: Zona[], datosTorneo: Prisma.TorneoUpdateManyMutationInput) {
  const inscripcionDe = new Map(torneo.inscripciones.map((i) => [i.jugadorId, i.id]));
  await prisma.$transaction(async (tx) => {
    // Con el estado como condición, un sorteo que llega después de confirmar no pisa las zonas.
    const { count } = await tx.torneo.updateMany({
      where: { id: torneo.id, estado: EstadoTorneo.INSCRIPCIONES_CERRADAS, sorteoConfirmado: false },
      data: datosTorneo,
    });
    if (count === 0) throw new ErrorHttp(409, 'TORNEO_NO_SORTEABLE');

    // Quien se bajó después de un sorteo anterior no puede quedar con zona.
    await tx.inscripcion.updateMany({
      where: { torneoId: torneo.id, estado: { not: EstadoInscripcion.PAGADA } },
      data: { grupo: null, posicionSiembra: null },
    });
    for (const { grupo, integrantes } of zonas) {
      for (const { jugadorId, posicionSiembra } of integrantes) {
        await tx.inscripcion.update({ where: { id: inscripcionDe.get(jugadorId)! }, data: { grupo, posicionSiembra } });
      }
    }
  });
}

// Último día de la fase de grupos según el cronograma del torneo, el mismo que se mostró al
// crearlo. A medianoche UTC, como el resto de las fechas de día. null si no hay fecha de inicio.
function finDeGrupos(torneo: TorneoConInscriptos) {
  const { cronograma } = calcularFormato({
    cantidadGrupos: torneo.cantidadGrupos,
    clasificanPorGrupo: torneo.clasificanPorGrupo,
    tieneComplementaria: torneo.tieneComplementaria,
    plazoGruposDias: torneo.plazoGruposDias,
    plazoPorRondaDias: torneo.plazoPorRondaDias,
    fechaInicio: torneo.fechaInicio?.toISOString().slice(0, 10) ?? null,
  });
  const hasta = cronograma[0].hasta;
  return hasta === null ? null : new Date(`${hasta}T00:00:00.000Z`);
}

// Confirma el borrador: genera los partidos de zona y el torneo pasa a zonas generadas.
export async function confirmarSorteo(slug: string, usuarioId: number, torneoId: number) {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  const torneo = await torneoDeLaOrganizacion(organizacionId, torneoId);
  verificarSorteable(torneo);

  const zonas = zonasGuardadas(torneo);
  if (zonas === null) throw new ErrorHttp(409, 'SORTEO_DESACTUALIZADO');
  // Una baja posterior al sorteo puede dejar una zona corta aunque el total alcance.
  if (zonas.some((z) => z.integrantes.length < MINIMO_POR_ZONA)) throw new ErrorHttp(409, 'SORTEO_DESACTUALIZADO');

  const fechaLimite = finDeGrupos(torneo);
  await prisma.$transaction(async (tx) => {
    // Con el estado como condición, dos confirmaciones simultáneas no generan los partidos dos veces.
    const { count } = await tx.torneo.updateMany({
      where: { id: torneo.id, estado: EstadoTorneo.INSCRIPCIONES_CERRADAS, sorteoConfirmado: false },
      data: { estado: EstadoTorneo.ZONAS_GENERADAS, sorteoConfirmado: true },
    });
    if (count === 0) throw new ErrorHttp(409, 'TORNEO_NO_SORTEABLE');

    await tx.partido.createMany({
      data: generarPartidosDeZona(zonas).map((p) => ({
        torneoId: torneo.id,
        fase: FasePartido.GRUPOS,
        grupo: p.grupo,
        jugadorAId: p.jugadorAId,
        jugadorBId: p.jugadorBId,
        fechaLimite,
      })),
    });
  });

  return obtenerSorteo(slug, usuarioId, torneoId);
}
