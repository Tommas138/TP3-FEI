// Tabla de posiciones de cada zona con la línea de corte (F07).
// Lógica pura: recibe inscriptos y partidos ya leídos, devuelve las zonas. No toca la base.
import type { CriterioDesempate, DestinoDeZona, ZonaDePosiciones } from '@setpoint/shared';
import { tablaDeZona, type PartidoDeLaTabla } from './clasificacion';

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
