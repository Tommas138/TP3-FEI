import type { Circuito, EstadoTorneo, ResumenConvocatoria } from '@setpoint/shared';
import { diaCorto } from '../torneos/texto';
import type { TorneosDeInicio } from './torneosEjemplo';

// "Primavera 26 · Tercera y Segunda": el borrador es uno solo aunque tenga varias categorías.
function nombreDelBorrador({ nombre, torneos }: ResumenConvocatoria) {
  return `${nombre} · ${torneos.map((t) => t.categoria).join(' y ')}`;
}

function detalleDeFechas({ cierreInscripcion, fechaInicio }: ResumenConvocatoria) {
  const partes = [
    cierreInscripcion && `Cierra el ${diaCorto(cierreInscripcion)}`,
    fechaInicio && `empieza el ${diaCorto(fechaInicio)}`,
  ].filter(Boolean);
  return partes.join(' · ') || 'Sin fechas todavía';
}

// Desde que se publica, una tarjeta por categoría: cada una cierra su inscripción por separado
// y puede estar en un momento distinto que las demás (decisión 026).
function categoriasEn(convocatorias: ResumenConvocatoria[], estado: EstadoTorneo) {
  return convocatorias.flatMap((convocatoria) =>
    convocatoria.torneos
      .filter((t) => t.estado === estado)
      .map((torneo) => ({ convocatoria, torneo, nombre: `${convocatoria.nombre} · ${torneo.categoria}` })),
  );
}

// Arma la pantalla de inicio con lo que hoy sabe la API. "En juego", "Terminados" y los avisos
// salen de partidos y cierres, que todavía no se muestran: llegan con el tablero (F15) y el cierre (F16).
export function aTorneosDeInicio(convocatorias: ResumenConvocatoria[], circuito: Circuito): TorneosDeInicio {
  const borradores = convocatorias.filter((c) => c.estado === 'borrador');
  const abiertas = categoriasEn(convocatorias, 'publicado');
  // Confirmar el sorteo pasa el torneo a zonas_generadas: con la inscripción cerrada, todavía no se sorteó.
  const paraSortear = categoriasEn(convocatorias, 'inscripciones_cerradas');

  return {
    borradores: borradores.map((c) => ({ id: c.id, nombre: nombreDelBorrador(c), detalle: detalleDeFechas(c) })),
    conInscripcionAbierta: abiertas.map(({ convocatoria, torneo, nombre }) => ({
      id: torneo.id,
      nombre,
      detalle: detalleDeFechas(convocatoria),
      pagaron: torneo.inscriptos,
      cupo: torneo.cupo,
    })),
    paraSortear: paraSortear.map(({ convocatoria, torneo, nombre }) => ({
      id: torneo.id,
      nombre,
      detalle: convocatoria.fechaInicio
        ? `Inscripción cerrada · empieza el ${diaCorto(convocatoria.fechaInicio)}`
        : 'Inscripción cerrada',
      pagaron: torneo.inscriptos,
      cupo: torneo.cupo,
    })),
    enJuego: [],
    terminados: [],
    totalTerminados: 0,
    avisos: [],
    jugadores: circuito.jugadores,
    categorias: circuito.categorias.length,
    recaudadoEnInscripcionesAbiertas: abiertas.reduce((suma, { convocatoria, torneo }) => suma + torneo.inscriptos * convocatoria.precio, 0),
    usaRanking: circuito.usaRanking,
  };
}
