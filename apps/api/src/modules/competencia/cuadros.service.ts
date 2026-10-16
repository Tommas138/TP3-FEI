import { Cuadro, EstadoTorneo, FasePartido, type Prisma } from '@prisma/client';
import type { ClaveCuadro, Cuadros, EstadoPartido } from '@setpoint/shared';
import { organizacionAdministrada } from '../../lib/permisos';
import { prisma } from '../../lib/prisma';
import { ErrorHttp } from '../../middleware/errores';
import {
  agruparZonas,
  armarCuadro,
  fechaLimiteDeRonda,
  lugarSiguiente,
  partidoSiguiente,
  partidosSinResultado,
  puestosPorCuadro,
  siembraDelCuadro,
  type PartidoDeCuadro,
} from './cuadros';
import { INCLUIR_ZONAS, inscriptosYPartidos } from './posiciones.service';

// Cuadros eliminatorios (F08). Se arman cuando la organización cierra las zonas (decisión 026),
// con las mismas tablas que muestran las posiciones.

// Con el sorteo confirmado, el torneo queda en zonas generadas; el tablero (F15) lo pasará a
// grupos en curso. Las zonas se pueden cerrar desde cualquiera de los dos.
const ESTADOS_CON_ZONAS = [EstadoTorneo.ZONAS_GENERADAS, EstadoTorneo.GRUPOS_EN_CURSO];

async function torneoDeLaOrganizacion(organizacionId: number, torneoId: number) {
  if (!Number.isInteger(torneoId)) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');
  // El filtro por organización es el aislamiento: el id solo no alcanza.
  const torneo = await prisma.torneo.findFirst({
    where: { id: torneoId, organizacionId },
    include: { categoria: { select: { nombre: true } }, ...INCLUIR_ZONAS },
  });
  if (!torneo) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');
  return torneo;
}

// Se crea de la final hacia atrás: así, al crear cada partido, el partido al que avanza su
// ganador ya existe y se conoce su id.
async function crearCuadro(
  tx: Prisma.TransactionClient,
  datos: { torneoId: number; cuadro: Cuadro; cierre: Date; plazoPorRondaDias: number },
  partidos: PartidoDeCuadro[],
) {
  if (partidos.length === 0) return;
  const rondas = Math.max(...partidos.map((p) => p.ronda));
  const idDe = new Map<string, number>();

  for (const partido of [...partidos].sort((a, b) => b.ronda - a.ronda)) {
    const siguiente = partidoSiguiente(partido, rondas);
    const { id } = await tx.partido.create({
      data: {
        torneoId: datos.torneoId,
        fase: FasePartido.ELIMINATORIA,
        cuadro: datos.cuadro,
        ronda: partido.ronda,
        ordenEnRonda: partido.ordenEnRonda,
        jugadorAId: partido.jugadorAId,
        jugadorBId: partido.jugadorBId,
        siguientePartidoId: siguiente ? idDe.get(`${siguiente.ronda}-${siguiente.ordenEnRonda}`)! : null,
        fechaLimite: fechaLimiteDeRonda(datos.cierre, datos.plazoPorRondaDias, partido.ronda),
      },
      select: { id: true },
    });
    idDe.set(`${partido.ronda}-${partido.ordenEnRonda}`, id);
  }
}

// Cierra las zonas y arma los cuadros: el torneo pasa a eliminatorias. No se deshace.
export async function cerrarZonas(slug: string, usuarioId: number, torneoId: number): Promise<Cuadros> {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  const torneo = await torneoDeLaOrganizacion(organizacionId, torneoId);
  if (!ESTADOS_CON_ZONAS.some((e) => e === torneo.estado) || torneo.gruposCerrados) {
    throw new ErrorHttp(409, 'ZONAS_NO_CERRABLES');
  }

  const { inscriptos, partidos } = inscriptosYPartidos(torneo);
  if (partidosSinResultado(partidos) > 0) throw new ErrorHttp(409, 'ZONAS_INCOMPLETAS');

  const zonas = agruparZonas(inscriptos, partidos);
  const puestos = puestosPorCuadro(
    torneo.clasificanPorGrupo,
    torneo.tieneComplementaria,
    Math.max(...zonas.map((z) => z.integrantes.length)),
  );
  const datos = { torneoId: torneo.id, cierre: new Date(), plazoPorRondaDias: torneo.plazoPorRondaDias };

  await prisma.$transaction(async (tx) => {
    // Con el estado como condición, dos cierres simultáneos no generan los cuadros dos veces.
    const { count } = await tx.torneo.updateMany({
      where: { id: torneo.id, estado: { in: ESTADOS_CON_ZONAS }, gruposCerrados: false },
      data: { estado: EstadoTorneo.ELIMINATORIAS, gruposCerrados: true },
    });
    if (count === 0) throw new ErrorHttp(409, 'ZONAS_NO_CERRABLES');

    await crearCuadro(tx, { ...datos, cuadro: Cuadro.CAMPEONATO }, armarCuadro(siembraDelCuadro(zonas, puestos.campeonato)));
    await crearCuadro(
      tx,
      { ...datos, cuadro: Cuadro.COMPLEMENTARIA },
      armarCuadro(siembraDelCuadro(zonas, puestos.complementaria)),
    );
  });

  return obtenerCuadros(slug, usuarioId, torneoId);
}

// Hace avanzar al ganador al partido siguiente de su cuadro. La llama la carga de resultados
// (F06) en la misma transacción en que guarda el resultado. Si se corrige el resultado antes de
// que se juegue el partido siguiente, vuelve a llamarla y el nuevo ganador pisa al anterior.
export async function avanzarGanador(tx: Prisma.TransactionClient, partidoId: number) {
  const partido = await tx.partido.findUniqueOrThrow({
    where: { id: partidoId },
    select: { fase: true, ordenEnRonda: true, ganadorId: true, siguientePartidoId: true },
  });
  // En la final no hay a dónde avanzar: su ganador es el campeón del cuadro.
  if (partido.fase !== FasePartido.ELIMINATORIA || partido.siguientePartidoId === null || partido.ganadorId === null) return;

  const { lado } = lugarSiguiente(partido.ordenEnRonda!);
  await tx.partido.update({
    where: { id: partido.siguientePartidoId },
    data: lado === 'A' ? { jugadorAId: partido.ganadorId } : { jugadorBId: partido.ganadorId },
  });
}

const jugadorDelCuadro = { select: { id: true, nombre: true, apellido: true } } as const;

// Los cuadros de un torneo, para quien administra la organización (decisión 019).
export async function obtenerCuadros(slug: string, usuarioId: number, torneoId: number): Promise<Cuadros> {
  const organizacionId = await organizacionAdministrada(slug, usuarioId);
  if (!Number.isInteger(torneoId)) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');

  const torneo = await prisma.torneo.findFirst({
    where: { id: torneoId, organizacionId },
    select: {
      id: true,
      nombre: true,
      edicion: true,
      gruposCerrados: true,
      categoria: { select: { nombre: true } },
      partidos: {
        where: { fase: FasePartido.ELIMINATORIA },
        orderBy: [{ ronda: 'asc' }, { ordenEnRonda: 'asc' }],
        select: {
          id: true,
          cuadro: true,
          ronda: true,
          ordenEnRonda: true,
          ganadorId: true,
          estado: true,
          fechaLimite: true,
          jugadorA: jugadorDelCuadro,
          jugadorB: jugadorDelCuadro,
          sets: { select: { gamesA: true, gamesB: true, esSuperTieBreak: true }, orderBy: { numero: 'asc' } },
        },
      },
    },
  });
  if (!torneo) throw new ErrorHttp(404, 'TORNEO_NO_ENCONTRADO');
  if (!torneo.gruposCerrados) throw new ErrorHttp(409, 'CUADROS_NO_GENERADOS');

  const aJugador = (j: { id: number; nombre: string; apellido: string } | null) =>
    j && { jugadorId: j.id, nombre: j.nombre, apellido: j.apellido };

  const cuadros = [Cuadro.CAMPEONATO, Cuadro.COMPLEMENTARIA]
    .map((cuadro) => torneo.partidos.filter((p) => p.cuadro === cuadro))
    .filter((partidos) => partidos.length > 0)
    .map((partidos) => ({
      cuadro: partidos[0].cuadro!.toLowerCase() as ClaveCuadro,
      rondas: Math.max(...partidos.map((p) => p.ronda!)),
      partidos: partidos.map((p) => ({
        id: p.id,
        ronda: p.ronda!,
        ordenEnRonda: p.ordenEnRonda!,
        jugadorA: aJugador(p.jugadorA),
        jugadorB: aJugador(p.jugadorB),
        ganadorId: p.ganadorId,
        estado: p.estado.toLowerCase() as EstadoPartido,
        fechaLimite: p.fechaLimite?.toISOString().slice(0, 10) ?? null,
        sets: p.sets,
      })),
    }));

  return {
    torneoId: torneo.id,
    nombre: `${torneo.edicion ?? torneo.nombre} · ${torneo.categoria.nombre}`,
    cuadros,
  };
}
