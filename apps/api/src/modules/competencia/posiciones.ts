// Tabla de posiciones de cada zona con la línea de corte (F07).
// Lógica pura: recibe inscriptos y partidos ya leídos, devuelve las zonas. No toca la base.
import type { CriterioDesempate, DestinoDeZona, ZonaDePosiciones, ZonaSimulada } from '@setpoint/shared';
import { conElResultado, tablaDeZona, type PartidoDeLaTabla } from './clasificacion';
import { partidosSinResultado } from './cuadros';

export type InscriptoEnZona = {
  jugadorId: number;
  grupo: string;
  posicionSiembra: number;
  nombre: string;
  apellido: string;
};

export type PartidoEnZona = PartidoDeLaTabla & { grupo: string };

export type Corte = { clasificanPorGrupo: number; tieneComplementaria: boolean };

function destino(posicion: number, { clasificanPorGrupo, tieneComplementaria }: Corte): DestinoDeZona {
  if (posicion <= clasificanPorGrupo) return 'campeonato';
  return tieneComplementaria ? 'complementaria' : null;
}

// Una tabla por zona, de la A en adelante.
export function zonasConPosiciones(inscriptos: InscriptoEnZona[], partidos: PartidoEnZona[], corte: Corte): ZonaDePosiciones[] {
  const grupos = [...new Set(inscriptos.map((i) => i.grupo))].sort();
  const inscriptoDe = new Map(inscriptos.map((i) => [i.jugadorId, i]));

  return grupos.map((grupo) => {
    const integrantes = inscriptos.filter((i) => i.grupo === grupo);
    const tabla = tablaDeZona(
      integrantes,
      partidos.filter((p) => p.grupo === grupo),
    );
    return {
      grupo,
      filas: tabla.map((fila) => {
        const { nombre, apellido } = inscriptoDe.get(fila.jugadorId)!;
        return {
          ...fila,
          nombre,
          apellido,
          desempateConElSiguiente: (fila.desempateConElSiguiente?.toLowerCase() ?? null) as CriterioDesempate | null,
          destino: destino(fila.posicion, corte),
        };
      }),
    };
  });
}

// La zona de un partido como quedaría con su resultado nuevo, sin guardar nada: es la vista
// previa de la carga (decisión 032). Sale de la misma cuenta que las posiciones.
export function simularZona(
  inscriptos: InscriptoEnZona[],
  partidos: PartidoEnZona[],
  corte: Corte,
  nuevo: PartidoEnZona,
): ZonaSimulada {
  const deLaZona = conElResultado(partidos, nuevo).filter((p) => p.grupo === nuevo.grupo);
  const [zona] = zonasConPosiciones(
    inscriptos.filter((i) => i.grupo === nuevo.grupo),
    deLaZona,
    corte,
  );
  return { ...zona, partidosSinResultado: partidosSinResultado(deLaZona) };
}
